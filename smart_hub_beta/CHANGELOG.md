# Changelog

All notable changes to SmartHub are documented in this file. The format is
based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- API actions `MSG_SET`/`MSG_RESET` (30/17, action 1/0) are now implemented:
  free-text messages (ISO 8859-1, 1–32 chars) are forwarded to the addressed
  module as new module command 33 (`33 <act> <tlen> <chars>`). Texts over
  16 chars are sent as two telegrams (act 2 = first 16 chars, preloaded only;
  act 1 = remaining chars, appended and shown) because the router forwards at
  most 24 bytes per module telegram; act 0 resets the message. Requires module
  firmware with command-33 support (Raumcontroller/RC Compact/SC Touch,
  in development).

### Fixed
- Configuration export crashed (`'>' not supported between instances of 'str'
  and 'int'`) when a module's climate-control radios had been saved via the
  settings form: `post_settings` stored `temp_1_2`/`temp_ctl` as raw form
  strings. They are now int-converted on save, and the export compares them
  defensively.

## [3.3.2] — 2026-06-12

### Added
- Router diagnosis log viewer in the settings page (zurück/weiter and swipe through the stored logs).
- Forward table is shown as an html page instead of a file download.

### Changed
- Diagnosis log restructured: header block with firmware, readout time and heal counters; one FROZEN and one LIVE block; latest commands first.
- Forward table uses the standard tool table style with sortable columns.
- Log viewer and forward table content are top-aligned in a scrollable area.
- Config server and settings route handlers refactored to instance methods.
- pre-commit ruff hooks run in isolated envs (PATH-independent, fixes commits on the Pi/pyenv).
- Version bumped to 3.3.2.

### Fixed
- Hub overview page builds fast again: addon slug cached with a request timeout, duplicate info readout removed, CPU arch via `platform` instead of `py-cpuinfo`.
- Hub overview page no longer re-reads firmware files on every load: the router/module update status is already computed at startup (and refreshed on demand via the version-check endpoints), so the redundant per-module `check_firmware()` disk reads were removed — this was the main remaining multi-second delay on installations with many modules.
- Swiping past the ends of the log history no longer reloads the page.

## [3.3.1] — 2026-06-12

### Fixed
- Router firmware version parsed correctly from the SMR (offset was one byte short).
- Communication test page no longer returns HTTP 500 with error modules present.
- System documentation titles the hub sheet `SmartHub '<host>'` instead of `Router '<host>'`.

### Added
- Commands log shows the heal/wedge counters with read-then-clear semantics (cmd 100/200/250).

## [3.3.0] — 2026-06-11

### Changed
- Comprehensive hardware-free test suite (every module covered), fully typed, `mypy --strict` clean, coverage gate 95%.
- Version bumped to 3.3.0.

### Fixed
- Event server recovers from serial glitches instead of dying silently.
- Automation editor handles invalid/empty selections without crashing.
- Renaming a logic/counter element refreshes its derived long name.
- All three dimmer types get the dimmer settings UI and dimmer commands.
- GSM SIM-PIN encode/decode/send fixed (4-digit PINs round-trip).
- SMC module-list read handles area rollover beyond 256 packages.
- Module documentation export works for modules without settings.
- Action descriptions whitespace-normalized.
- Smart Hub module image filename casing fixed (case-sensitive filesystems).
- Logic element/input range checks accept element 10 and input 8.
- `SmartConfigurator.main()` honors its `init_flag` parameter again.
- Router firmware upload restores the serial baud rate on all error paths.
- `get_module_image` falls back gracefully for unknown module types.
- Firmware comparison no longer truncates space-less version strings.
- `GET /upd_upload` returns `204 No Content` without the web lock.
- `data_hdlr`/`admin_hdlr` validate the router number before indexing.
- `save_descriptions_file` error path no longer masks the real error.
- Multi-flag mirror events report each flag's correct on/off state.
- Generated module serial maps the new-LE Smart Controller type correctly.
- Priority-action description no longer overwritten by the fallback text.
- `FLAG_SET`/`FLAG_RESET` abort on invalid arguments; unimplemented message paths return cleanly.
- `EVENTSTOP` resets the ApiServer auto-restart flag.
- Message forwarding keys on the router id and uses the 0-based router index.
- Router type-2 descriptions are converted to group descriptors.
- `supply_prio` encoding normalized on read; `err1_modules` no longer duplicated.

### Removed
- Dead code in several handlers.

### Added
- Serial-HW diagnosis snapshot in the commands log (router firmware Rev >= 07).
- Deliverables: router firmware Rev 07 binary and SC-Touch APK v1.2.11.

## [3.2.3] — 2026-06-08

### Added
- Apache-2.0 `LICENSE` file, `CHANGELOG.md`, project metadata in `pyproject.toml`.
- GitHub Actions CI (Ruff lint/format, pytest on Python 3.11/3.12/3.13).

### Changed
- Adopted the habitron_client Ruff rule set and applied the resulting fixes.
- File handles use `with` context managers; mutable class attributes/defaults cleaned up.

### Notes
- `mypy --strict` and the coverage gate were introduced on the `quality-testing` branch.
