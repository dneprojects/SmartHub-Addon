import asyncio
import logging
import json
import socket
import struct
import uuid
from const import SMHUB_PORT, QUERY_PORT, SMHUB_INFO

# Constants for SSDP
SSDP_ADDR = "239.255.255.250"
SSDP_PORT = 1900
SSDP_ST = "urn:habitron-com:device:SmartHub:1"


class JsonDiscoveryProtocol(asyncio.DatagramProtocol):
    """Protocol for new JSON-based UDP discovery."""

    def __init__(self, sm_hub):
        self.sm_hub = sm_hub
        self.transport = None

    def connection_made(self, transport):
        self.transport = transport

    def datagram_received(self, data, addr):
        """Handle received datagram."""
        try:
            message = data.decode().strip()
            # Check for magic discovery string
            if message == "habitron_discovery":
                conf_host = (
                    "local" if self.sm_hub.is_addon else self.sm_hub.get_host_ip()
                )
                response = {
                    "host": conf_host,
                    "ip": self.sm_hub.get_host_ip(),
                    "port": SMHUB_PORT,
                    "serial": self.sm_hub.get_serial(),
                    "version": self.sm_hub.get_version(),
                    "mac": self.sm_hub.curr_mac,
                }
                # Send JSON response back to requester
                if self.transport:
                    self.transport.sendto(json.dumps(response).encode(), addr)
                self.sm_hub.logger.debug(f"JSON Discovery request answered from {addr}")
        except Exception as err:
            self.sm_hub.logger.warning(f"Error handling JSON UDP packet: {err}")


class LegacyDiscoveryProtocol(asyncio.DatagramProtocol):
    """Protocol for old binary UDP discovery."""

    def __init__(self, resp_str, logger):
        self.resp_str = resp_str
        self.logger = logger
        self.transport = None

    def connection_made(self, transport):
        self.transport = transport

    def datagram_received(self, data, addr):
        """Handle received datagram."""
        try:
            # Legacy server responded to any packet on this port
            if self.transport and self.resp_str:
                self.transport.sendto(self.resp_str, addr)
            self.logger.debug(f"Legacy Discovery request answered from {addr}")
        except Exception as err:
            self.logger.warning(f"Error handling legacy UDP packet: {err}")


class SSDPDiscoveryProtocol(asyncio.DatagramProtocol):
    """Protocol for SSDP (Simple Service Discovery Protocol)."""

    def __init__(self, sm_hub):
        self.sm_hub = sm_hub
        self.transport = None
        self.usn = f"uuid:{uuid.uuid5(uuid.NAMESPACE_DNS, self.sm_hub.get_serial())}::{SSDP_ST}"

    def connection_made(self, transport):
        self.transport = transport
        # Join the multicast group to receive M-SEARCH packets
        sock = transport.get_extra_info("socket")
        try:
            group = socket.inet_aton(SSDP_ADDR)
            mreq = struct.pack("4sl", group, socket.INADDR_ANY)
            sock.setsockopt(socket.IPPROTO_IP, socket.IP_ADD_MEMBERSHIP, mreq)
            # Allow reuse address/port to coexist with other UPnP services
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            # Set multicast TTL to 2 to allow passing through some switches/VMs
            sock.setsockopt(socket.IPPROTO_IP, socket.IP_MULTICAST_TTL, 2)

            # Force outgoing multicast packets to use the correct interface
            # This fixes the issue where packets are sent via localhost/wrong interface
            local_ip = self.sm_hub.get_host_ip()
            if local_ip:
                self.sm_hub.logger.debug(
                    f"Binding SSDP multicast to interface: {local_ip}"
                )
                sock.setsockopt(
                    socket.IPPROTO_IP,
                    socket.IP_MULTICAST_IF,
                    socket.inet_aton(local_ip),
                )

        except Exception as err:
            self.sm_hub.logger.warning(f"Error configuring SSDP socket: {err}")

        # Announce presence immediately (Alive)
        self.send_notify("ssdp:alive")

    def datagram_received(self, data, addr):
        """Handle received packets."""
        try:
            msg = data.decode()
            # Respond to Search requests
            if "M-SEARCH" in msg and (SSDP_ST in msg or "ssdp:all" in msg):
                self.send_response(addr)
                self.sm_hub.logger.debug(f"SSDP M-SEARCH answered from {addr}")
        except Exception:
            pass

    def send_notify(self, nts_type):
        """Send NOTIFY packet (alive or byebye)."""
        if not self.transport:
            return

        location = f"http://{self.sm_hub.get_host_ip()}:{SMHUB_PORT}/description.xml"
        notify_msg = [
            "NOTIFY * HTTP/1.1",
            f"HOST: {SSDP_ADDR}:{SSDP_PORT}",
            "CACHE-CONTROL: max-age=1800",
            f"LOCATION: {location}",
            "SERVER: Linux/3.0 UPnP/1.0 HabitronSmartHub/1.0",
            f"NT: {SSDP_ST}",
            f"USN: {self.usn}",
            f"NTS: {nts_type}",
            "",
            "",
        ]
        packet = "\r\n".join(notify_msg).encode()
        try:
            self.transport.sendto(packet, (SSDP_ADDR, SSDP_PORT))
            self.sm_hub.logger.info(f"Sent SSDP NOTIFY ({nts_type})")
        except Exception as err:
            self.sm_hub.logger.warning(f"Failed to send SSDP NOTIFY: {err}")

    def send_response(self, addr):
        """Send unicast response to the searcher."""
        location = f"http://{self.sm_hub.get_host_ip()}:{SMHUB_PORT}/description.xml"
        response = [
            "HTTP/1.1 200 OK",
            "CACHE-CONTROL: max-age=1800",
            f"LOCATION: {location}",
            "SERVER: Linux/3.0 UPnP/1.0 HabitronSmartHub/1.0",
            f"ST: {SSDP_ST}",
            f"USN: {self.usn}",
            "EXT:",
            "",
            "",
        ]
        if self.transport:
            self.transport.sendto("\r\n".join(response).encode(), addr)


class QueryServer:
    """Server class for network queries searching Smart Hubs."""

    def __init__(self, loop, sm_hub):
        self.loop = loop
        self.sm_hub = sm_hub
        self.json_transport = None
        self.legacy_transport = None
        self.ssdp_protocol = None
        self.ssdp_transport = None
        self.logger = logging.getLogger(__name__)
        self.resp_str = None

    async def initialize(self):
        """Initialize legacy response string."""
        try:
            resp_header = "\x00\x00\x00\xf7"
            version_str = SMHUB_INFO.SW_VERSION.replace(".", "")[::-1]
            type_str = SMHUB_INFO.TYPE_CODE
            serial_str = SMHUB_INFO.SERIAL
            empty_str_10 = "0000000000"
            mac_str = ""
            for nmbr in self.sm_hub.lan_mac.split(":"):
                mac_str += chr(int(nmbr, 16))

            self.resp_str = (
                resp_header
                + chr(0)
                + version_str
                + type_str
                + empty_str_10
                + serial_str
                + mac_str
            ).encode("iso8859-1")
            self.logger.debug("Legacy discovery response string initialized")
        except Exception as err:
            self.logger.error(f"Error initializing legacy response: {err}")

    async def run_query_srv(self):
        """Start UDP discovery servers (JSON, Legacy, SSDP)."""
        self.logger.info(
            f"Starting UDP discovery: JSON({SMHUB_PORT}), Legacy({QUERY_PORT}), SSDP({SSDP_PORT})"
        )

        try:
            # 1. Start JSON Protocol
            self.json_transport, _ = await self.loop.create_datagram_endpoint(
                lambda: JsonDiscoveryProtocol(self.sm_hub),
                local_addr=("0.0.0.0", SMHUB_PORT),
            )

            # 2. Start Legacy Protocol
            if self.resp_str:
                self.legacy_transport, _ = await self.loop.create_datagram_endpoint(
                    lambda: LegacyDiscoveryProtocol(self.resp_str, self.logger),
                    local_addr=("0.0.0.0", QUERY_PORT),
                )

            # 3. Start SSDP Protocol (Multicast)
            # Note: We store the protocol instance to call send_notify later
            (
                self.ssdp_transport,
                self.ssdp_protocol,
            ) = await self.loop.create_datagram_endpoint(
                lambda: SSDPDiscoveryProtocol(self.sm_hub),
                local_addr=("0.0.0.0", SSDP_PORT),
                reuse_port=True,
            )

            # Keep the server running
            try:
                await asyncio.Future()
            except asyncio.CancelledError:
                pass
        except Exception as err:
            self.logger.error(f"Failed to start UDP discovery: {err}")

    def close_query_srv(self):
        """Close connections."""
        if self.json_transport:
            self.logger.info("Stopping JSON UDP discovery")
            self.json_transport.close()
            self.json_transport = None

        if self.legacy_transport:
            self.logger.info("Stopping Legacy UDP discovery")
            self.legacy_transport.close()
            self.legacy_transport = None

        if self.ssdp_transport:
            # Send ByeBye before closing
            if self.ssdp_protocol:
                self.ssdp_protocol.send_notify("ssdp:byebye")

            self.logger.info("Stopping SSDP discovery")
            self.ssdp_transport.close()
            self.ssdp_transport = None
            self.ssdp_protocol = None
