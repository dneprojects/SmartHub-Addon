# Changelog

## [Unreleased]

### Fixed
- A router answer that never arrived, arrived corrupted, or belonged to a different command is now named in the log instead of being processed as if it were data - until now the hub could work with invented values and say nothing. Everything else behaves exactly as before.
- A command the router rejects is logged with the reason it gave.
- A failed command no longer leaves the hub blocked: Home Assistant keeps working instead of losing every entity until a restart.
- A failed router firmware update releases the network block again and puts the serial port back to its normal speed.
- An interrupted start-up no longer leaves the router in server mode, where it runs no module-to-module automation.
- The boot wait after a router restart no longer ends in an error when the router does not answer at once, and a failed firmware transfer can report itself again.
- A start-up that is interrupted no longer leaves the hub waiting forever: until now Home Assistant could hang on the hub without any message.
- Reading the system or a group mode no longer sends the same command over and over when the router answers something else; it now gives up after a few tries and says so.
- A firmware update that cannot reach the serial port now restarts the router instead of leaving it in programming mode, where it does nothing at all.

### Removed
- A network-block release flag that was never set, and the middleware that read it.
## [3.6.3] — 2026-09-18

### Changed
- After a firmware update the module is asked for its version directly instead of waiting 15 seconds for the router to refresh its copy; the version is logged as the module sends it, once for all modules that report the same one.
- A finished module update now says how it ended ("finished: OK", "failed", "skipped") instead of only that it finished.

## [3.6.2] — 2026-09-18

### Fixed
- After a module firmware update the hub re-reads only the module's version instead of its whole configuration list, which the module often cannot deliver right after its restart, and asks again if it does not answer at once.
- A module type with several matching firmware files is offered the newest one instead of the file read last.

### Changed
- The log now names the version a module reports next to the version of the firmware file, so an update that keeps being offered can be traced.

## [3.6.1] — 2026-09-17

### Fixed
- After a module firmware update the hub page no longer keeps offering the update for that module type, and Home Assistant receives the version the module actually runs.
- A module firmware update started from Home Assistant no longer leaves the hub blocked if the flash fails.

## [3.6.0] — 2026-09-17

### Changed
- The changelog in Home Assistant's update dialog no longer starts with the repository introduction (whose link led nowhere) or an empty "Unreleased" section.
- Bundled firmware updated: modules can be learned by button again and are reachable by the serial broadcast in factory state (all module types), SC Touch app 1.3.1.

## [3.5.11] — 2026-09-16

### Fixed
- A firmware update started from the web page no longer repeats itself: reloading the page after a flash used to send the update again and flash the router or the modules once more.
- The hub page no longer shows another app's name as the Smart Center's name (e.g. "core-samba.local.hass.io"): as an app the name now comes from the Home Assistant host.

## [3.5.10] — 2026-09-15

### Fixed
- A reserved address without a module no longer shifts every module above it: module lookup goes by address, so the config pages name the right module and module status and forward-table healing reach the right one.
- A re-initialisation that fails part way no longer leaves the router in server mode (where it runs no module-to-module automation) until the hub is restarted, and a router kept there for lack of a client connection is now reported in the log.
- A module restored from a backup while offline is registered with its address, so it is no longer invisible to everything that works by address, and a second restore updates it instead of creating a duplicate.
- A router error or an unusable response is no longer passed on as a module list: the hub falls back to the addresses it already knows, and a start without any module list fails instead of coming up as an installation without modules.
- A module is no longer dropped at start-up for a missing mirror that could not fill in the first place: the hub waits longer, has the router rebuild its module mirror once (which only works in operate mode) and gives the module a second chance. A router that gives no answer at all no longer counts against the module either.

### Changed
- A module whose forward table could not be healed (F3) is now logged when it happens and when it clears — until now the state was only visible in the module fault list, although the module looks healthy everywhere else.

## [3.5.9] — 2026-09-12

### Fixed
- A module in factory state (area 0 and address 0) can be learned again: when nobody answers the serial broadcast, the address and the router id are now written with a second, area-0 addressed pair of commands.

### Changed
- Bundled firmware updated: router VM V4.0 Rev 14 (replaces Rev 13, which the rescue path requires).

## [3.5.8] — 2026-09-09

### Changed
- The hub's MAC addresses are read more robustly: interfaces with other names (eno1, enp3s0, enx...) are recognised, virtual interfaces are ignored, and a missing one no longer prevents the start.
- A token file that cannot be interpreted is now reported as such instead of as "cannot open the file", which pointed at the wrong cause.

## [3.5.7] — 2026-09-07

### Fixed
- A router read that fails is no longer mistaken for "the router has no lists", which could replace all areas with a single "House" and delete the global flags and collective commands on the next save.
- A failed upload of the router lists is now detected and repeated at once — an aborted upload used to leave the router with an empty list table without any notice.
- Saving reports it when the areas, flags and collective commands could not be stored in the router, instead of always claiming success.
- Home Assistant is told that the lists are unavailable instead of receiving an empty set, so it keeps its existing entities and retries.

## [3.5.6] — 2026-08-03

### Fixed
- Saving the cover autostop delay as -1 ("inactive") no longer fails with an HTTP 500 error.

## [3.5.5] — 2026-07-29

### Added
- Automations can now be configured for the Smart Sensor: an event from another module can change its temperature setpoint or switch its controller between heating and cooling.

### Changed
- Bundled firmware updated: SC Touch RMT v6.0 rev 08 (older revisions are removed so the module firmware is selected unambiguously) and Smart Sensor UGTF-1 V1.2 01.

## [3.5.4] — 2026-07-06

### Added
- The router serial number is generated and written back when the router has no valid one (does not start with "004001"), analogous to the module serial.

## [3.5.3] — 2026-07-06

### Changed
- Forward-table self-healing now re-collects in server mode (a short config-mode window) instead of operate mode, where the re-request never completed against the live mirror; F3 is only flagged after the server-mode heals fail.

## [3.5.2] — 2026-07-05

### Added
- A module address learned or created ("Moduladresse auf Kanalpaar anlernen/anlegen") is read in immediately, without a SmartHub restart.

### Changed
- "Moduladresse entfernen" now also drops the module from the running state and frees its address, so it can be re-learned on another channel right away (no restart).
- Router diagnosis: the "Moduladresse entfernen" input is aligned one column to the right with the other single-value fields.

## [3.5.1] — 2026-07-05

### Added
- Operate-mode runtime fault detection with per-module Home Assistant `SYS_ERR` events, so a hung or timed-out module is visible without a mode switch.

### Changed
- Per-module boot status (cmd 106) is now fetched on demand instead of back-to-back with the router status, which the router used to drop.

### Fixed
- Day/night schedule from an older SmartHub (firmware mode 2 + light 0) is now shown as "Zeit oder Helligkeit" instead of the misleading "nur Zeit".

## [3.5.0] — 2026-06-25

### Added
- Automation editor: the colour LEDs (Ambient + 4 corners) can now be toggled ("wechseln").
- Settings: new "Moduladresse entfernen" action to remove a module address from the router.
- Progress popup with a result log during module-table transfers and when learning a module address.

### Changed
- Module-table transfer reworked: addresses are (re)assigned by broadcast, reaching a module on any channel and even in factory state 0,0; the router maintains its own address table.
- Adding or deleting a module now works the same offline and online (delete resets the module to 0,0).
- Smoother, continuous progress bar and clearer per-module status during transfers.
- Automation editor: button triggers select the press type first, then the name; entity selectors keep referenced-but-unnamed entries instead of dropping them.
- Config and diagnostics actions now wait for the bus instead of being silently dropped when it is briefly busy.
- Bundled firmware updated: router VM V4.0 Rev 13, RC Compact RMK v4.6 rev 07, SC Touch RMT v6.0 rev 05.

### Fixed
- Backup restore no longer loads the wrong module's data and no longer fails (HTTP 500) on high addresses; address and module type are matched (Smart Controller XL-2 01/02 and 01/03 are interchangeable).
- "Moduladresse entfernen" now actually removes the module, and deleted modules are reliably dropped from the router.
- In-place address swaps no longer wipe a module's automations or lose group membership; automations triggered by a moved module follow its new address.
- Saving settings or automations no longer fails when a Home Assistant status poll arrives mid-upload.
- More robust module-table transfer and startup read-in (waits for the router mirror; faulty modules are detected instead of read with garbled data).
- Fixed a spurious warning when setting the system or a group mode at runtime.

## [3.4.0] — 2026-06-17

### Added
- Per-module problem monitoring and forward-table self-healing, with module fault codes shown in the overview.
- Free-text messages can be sent to a module's display (requires supporting module firmware).
- Long button presses ("Tastendruck lang") are available for all room controllers and the Smart Controller Mini, not only the Touch.
- Settings and automation saves now show the same progress bar as a file upload, with a per-module/phase title.
- Updated bundled firmware: RaumController RMG v4.5 f4 / RMG1 v4.6 0f, RC Compact RMK v4.6 05, router VM V4.0 Rev 11.

### Changed
- Module faults shown as per-module single-bit F-codes with tooltips (including a dedicated mirror-problem code).
- Automation display puts the short/long qualifier before the button name.

### Fixed
- A module firmware update can no longer brick the integration (oversized files are rejected; the network block is always released).
- Configuration export no longer crashes after saving a module's climate-control settings.

## [3.3.2] — 2026-06-12

### Added
- Router diagnosis log viewer in the settings page (browse/swipe the stored logs).
- Forward table is shown as an HTML page instead of a file download.

### Changed
- Diagnosis log restructured (frozen + live blocks, latest first); forward table uses the sortable table style.

### Fixed
- Hub overview page builds fast again (no redundant per-load firmware/info reads).
- Swiping past the ends of the log history no longer reloads the page.

## [3.3.1] — 2026-06-12

### Added
- Commands log shows the heal/wedge counters.

### Fixed
- Router firmware version is parsed correctly.
- Communication test page no longer returns HTTP 500 when error modules are present.
- System documentation titles the hub sheet correctly.

## [3.3.0] — 2026-06-11

### Changed
- Comprehensive, fully-typed hardware-free test suite (mypy --strict clean, 95% coverage gate).

### Fixed
- Event server recovers from serial glitches instead of dying silently.
- All three dimmer types get the dimmer settings UI and commands.
- GSM SIM-PIN encode/decode/send fixed (4-digit PINs round-trip).
- Automation editor handles invalid/empty selections without crashing.
- Numerous smaller correctness fixes (see developer_doc.md).

### Removed
- Dead code in several handlers.

## [3.2.3] — 2026-06-08

### Added
- Apache-2.0 LICENSE, CHANGELOG.md, project metadata, and GitHub Actions CI.

### Changed
- Adopted the habitron_client Ruff rule set; safer file handling.
