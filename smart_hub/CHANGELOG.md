# Changelog

Concise, user-facing notes for each release. Detailed developer notes (with
implementation specifics) are in [developer_doc.md](developer_doc.md). The format
is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

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
