# Changelog

All notable changes to SmartHub are documented in this file. The format is
based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [3.4.0] — 2026-06-17

### Added
- Cyclic per-module problem monitoring: the periodic router-status query now
  also requests the module boot/problem status (router cmd 106) fire-and-forget
  in operate mode; the event server parses the response and keeps each module's
  `boot_err_mask` and the router `mod_comm_errors` up to date without
  interrupting events ("Forward problems" = incomplete forward-table collection
  for that module).
- Forward-table self-healing (SmartHub side): a module that reports an
  incomplete forward-table collection ("Forward problems") while reachable is
  re-requested via `START_RT_FORW_MOD` — once per cyclic status poll (which
  spaces the retries without an extra timer), up to three attempts. If it still
  does not recover, the module is flagged with the dedicated code `F3`
  ("Weiterleitungstabelle nicht geheilt", new `RT_ERROR_CODE[3]`); during the
  retries the status text shows the attempt counter ("wird geheilt (Versuch
  n/3)"). Healing only runs in operate mode (the router collects forward tables
  itself during boot) and resets as soon as the forward bit clears. The retry
  re-request is fire-and-forget (router command 68), so it never interrupts the
  event stream.
- API actions `MSG_SET`/`MSG_RESET` (30/17, action 1/0) are now implemented:
  free-text messages (ISO 8859-1, 1–32 chars) are forwarded to the addressed
  module as new module command 33 (`33 <act> <tlen> <chars>`). Texts over
  16 chars are sent as two telegrams (act 2 = first 16 chars, preloaded only;
  act 1 = remaining chars, appended and shown) because the router forwards at
  most 24 bytes per module telegram; act 0 resets the message. Requires module
  firmware with command-33 support (Raumcontroller/RC Compact/SC Touch,
  in development).
- Long button presses ("Tastendruck lang") are now available for all room
  controllers (Smart Controller XL-1/XL-2/XL-2 LE2) and the Smart Controller
  Mini, not only the Touch. The settings pages, configuration export and
  automation triggers expose the long-press labels accordingly (driven by the
  module's io-properties). Requires module firmware that emits long-button
  events for the respective type.
- Saving module/router settings and module automations now shows the same
  progress bar in the wait popup as a configuration-file upload, instead of a
  bare spinner. The save handlers hold `web_lock` and drive `wait_progress`
  (the module list upload already reports its fraction), and the
  settings/automation pages load `progress.js` so the shared `Progress` popup
  (with bar) is used, falling back to the plain wait popup when unavailable.
- The wait popup now updates its title per module/phase during every transfer:
  `send_module_smg`/`send_module_list` set the phase to
  "<module name>: Einstellungen" / "<module name>: Verknüpfungen", and the
  config-file upload labels the router and each module ("Router wird
  übertragen", "Modul N wird übertragen"). This makes multi-module restores and
  automation saves (incl. external action modules) show which module is being
  written. `WaitProgress.start_multi` now also clears any stale phase label.
- Deliverables: updated bundled firmware binaries — RaumController (RMG v4.5
  f4, RMG1 v4.6 0f), RC Compact (RMK v4.6 05) and router (VMV2 v4.0 Rev 11,
  commok_set Bit-6 reset).

### Fixed
- Module firmware update no longer bricks the Home Assistant integration. An
  oversized firmware file (more than 255 packets / 62730 bytes) is rejected at
  upload with a clear message instead of crashing the transfer mid-way, and the
  network interface block is now always released (`try/finally`) on the router
  and module update paths — a failed update can no longer leave all entities
  permanently unavailable until a restart.
- Configuration export crashed (`'>' not supported between instances of 'str'
  and 'int'`) when a module's climate-control radios had been saved via the
  settings form: `post_settings` stored `temp_1_2`/`temp_ctl` as raw form
  strings. They are now int-converted on save, and the export compares them
  defensively.

### Changed
- Module communication errors are now shown as a list of single-bit F-codes
  instead of one combined code: a fault byte of 3 (timeout + comm error) is
  displayed as `F1, F2` rather than the misleading `F3`. This keeps `F3` free
  as a dedicated code for a future forward-table fault and matches the bitwise
  origin of the codes (each `Fx` carries its own tooltip). The per-module
  problem property was renamed `mod_boot_errors` → `mod_comm_errors` (it is no
  longer boot-specific), and the router overview now shows a cyclically fresh
  "Modulrückmeldungen" row (Korrekt / Mit Fehlern, with the fault text as
  tooltip) driven by it.
- Automation display adapted to named long button presses: for buttons the
  short/long qualifier now precedes the name (e.g. `Taste 8 lang: 'Rollladen
  Haus ab'` instead of `Taste 8: 'Rollladen Haus ab' lang`), since the
  long-press label is a trigger intention, not a button name. Inputs and
  switches keep the previous layout.
- `post_settings` now stores every numeric scalar form field (display, button
  timing, dimmer, temperature, motion level) via explicit, type-annotated
  assignments (`settings: ModuleSettings | RouterSettings`, narrowed with
  `isinstance`) instead of the previous dynamic `__setattr__` string fallback.
  This removes the footgun behind the `temp_1_2` crash, fixes `mov_level` (same
  latent string type), and lets `mypy --strict` statically reject a wrong-typed
  save at the write site.

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
