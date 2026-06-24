# Changelog

All notable changes to SmartHub are documented in this file. The format is
based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Automation editor: the RGB/Farblicht action now offers **wechseln** (toggle) for the 5 colour LEDs (Ambient + 4 corners), mapped to Befehl 35 task 3 (replaces the previously non-functional "temporär setzen"). The on/off entries are relabelled "einschalten"/"ausschalten" and the selector is ordered einschalten/ausschalten/wechseln/colours. Requires module firmware RC-Compact ≥ rev 07 / SC Touch ≥ rev 05.

### Changed
- Module-table transfer progress bar is now one continuous 0→100 % without the
  backward jump that happened when a second module list started uploading. The
  bar is weighted: the address changes share the first 20 %, the (much slower)
  list uploads share the remaining 80 %, each upload getting its own slice.
  Implemented via a new `WaitProgress.start_band(lo, hi, n)` that subdivides a
  sub-band (keeping the label/log), plus `set_fraction(1, 1)` per address step
  and `next_item()` per uploaded list.
- SMC list-upload log messages now name the module by its actual target address
  (`mod_addr`) instead of the handler's possibly stale `mod_id`, so after an
  address change the "transferred … to module N" line shows the new address.
- Automation editor: the on-the-fly option insertion (so an automation that
  references an entity whose name was cleared in the settings stays editable and
  round-trips on save instead of being silently dropped) is now applied to **all
  entity selectors** in both the trigger and action editors — not just buttons.
  Generalized `setButtonElement` → `setEntityElement(id, value)` (no-op for
  non-`<select>` elements and the empty placeholder; adds a "<value> (ohne Name)"
  option only when the referenced value is missing). Fixed/computed selectors
  (on/off, press type, modes, sensor types, day/month, percentages, …) and input
  fields keep plain `setElement`. (`init`-paths in `trigger.js`, `action.js`)
- Automation editor, button (Taster) trigger: the two dependent selectors are
  swapped — the press type (kurz / lang / Ende lang) now comes first, the button
  name second. The name selector depends on the press type: short press lists
  the short names (`settings.buttons`), long / long-end list the long-press names
  (`settings.buttonslong`). Implemented as three selects (`button-select` kurz,
  `button-long-select` lang, `button-dimm-select` for the separate Dimmen
  trigger, which stays unchanged); `prepare_trigger_lists` fills all three via
  distinct placeholders that all render as "-- Taster wählen --". The save path
  reads the button index from `trigger_button` (short) or `trigger_button_long`
  (long/end); the index is identical in both. A button named in only one press
  type still appears in BOTH lists; the unnamed press type shows the synthetic
  label "B<n> kurz" / "B<n> lang" so it stays selectable (both lists thus carry
  the same value set, which also makes the short↔long carry-over reliable). If
  an existing automation references a button that is unnamed in both fields, the
  selector adds that option on the fly ("B<n> (ohne Name)") on load so the entry
  stays editable and round-trips on save instead of being dropped.
  (`automation_edit_template.html`, `trigger.js`, `automtn_trigger.py`)
- Renamed the shared `asyncio.Lock` `web_lock` → `command_lock` (in
  `config_commons.py` and all users), reflecting its real scope: it serializes
  every router-bus command and mode switch, not just web/config-server requests.
- Config-server bus handlers that previously **aborted with HTTP 204** when the
  bus was busy (`command_lock` held) now **wait** for the lock and complete:
  `get_localupload`, `get_upload`, `post_loc_update`, `post_upd_upload`,
  `get_update_router`, `get_update_modules` (config_server), `re_init_hub`
  (config_setup), and `rt_reboot`, `rt_set_baud`, `rt_reinit_fwdtbl`,
  `prop_chan_id` (config_testing). A user action is no longer silently dropped
  because a brief Home-Assistant command happened to hold the lock. `turnoff_config`
  keeps the 204-abort (turning config mode off while a bus op runs may not be
  wanted). The progress-polling endpoints `get_update_status` / `get_wait_status`
  still check `command_lock.locked()` to *report* progress — they must return
  immediately and are not affected.
- The automation address fix-up + module re-sort now run **model-side at
  "Übernehmen"** (`apply_id_chan_changes` returns the per-call `old → new` map;
  `tbl_apply` calls the new `apply_automation_address_changes`), not at transfer.
  The model (and a save-to-file) is therefore already correct, and the cached
  `ModuleSettings` is rebuilt without touching the SMC CRC. The transfer only
  **persists** the rewritten lists (`persist_changed_module_lists`): each upload
  is retried (immediate, +2 s, +5 s) and a persistent failure is non-fatal
  (logged) — fixes a 500 where a module list-upload issued right after an
  in-place address swap timed out because the router was still forwarding/
  rebuilding its mirror, aborting the whole transfer.
- Module-table transfer ("Module verwalten" → "Übertragen") now (re)assigns
  module addresses via **broadcast** (router `cs` → module cmd 178 by serial)
  instead of addressing the module via its existing address. This reaches a
  module on any channel and even in factory state 0,0, so address and channel
  changes no longer depend on the module still being reachable under its old
  address. `RtHdlr.set_module_address_by_serial` gained a `batch_mode` flag
  (default `False`) so the transfer keeps its network block held across the
  whole operation and leaves the staged target model untouched.
- SmartHub no longer rewrites the router's address/channel table on transfer.
  The broadcast makes the router maintain and persist its own address table,
  migrate each module's group membership, and rebuild its forward table itself
  (verified on hardware incl. in-place address swaps). The previous
  `send_rt_channels` / per-module `del_mod_addr`/`set_module_address`
  bookkeeping corrupted that correct router state on a swap (it rewrote a
  broadcast-churned table) and was removed — as was the experimental automatic
  router restart, which is no longer needed.
- A module is **deleted via a broadcast to address 0** (resets it to 0,0 — the
  module sets `adresse=0` and `raum=0`; the router drops it from its table),
  replacing the old `del_mod_addr`.
- On a persistent address-change failure the transfer aborts; transient module
  replies (codes 252/250/251/255) are retried up to three times, the
  deterministic old-firmware reply (249) is not. Remaining modules stay pending
  for a later retry, and the abort page names the offending module and reason.
  A delete that cannot reach its module is non-fatal (warning).
- Bundled router firmware in `firmware/` updated to VM V4.0 Rev 12 (clears the
  per-address mirror flag on an address change; pairs with the cmd-106
  mirror-ready wait).
- Adding a module ("Module verwalten" → "Modul anlegen") is now purely
  model-side: it no longer arms the button-press learn (`NEXT_MD_ADDR`). The
  module's address is assigned later on "Übertragen" via broadcast, so adding
  works identically offline (save the configuration as a file) and online
  (transfer it in one go).

### Tests
- Sharpened the status↔smg serialization tests with a real 156-byte `smg_upload`
  captured from a RaumController ("RC2 - Büro, Gäste", type `0x01 0x02`,
  SC2 V4.5). The new `TestRealRaumControllerSmg` pins the exact
  `build_status → build_smg` round-trip on real data and characterizes the
  decoded cover times (Rollladenzeiten 20 / 24 / 24 s, all "down" → `COVER_POL`
  `0xAAAA`, no blade/tilt times), the button times (`T_SHORT`/`T_LONG`/`T_DIM`
  = 6 / 50 / 1), the input polarity (`SWMOD` 0 / 14 / 0) and the parsed
  name/serial/version — values a synthetic ramp fixture could not have caught at
  the real interpolation offsets (20 s → 200/1, 24 s → 240/1).
- Added `TestGetNamesRealRaumController` driving `ModuleSettingsBase.get_names`
  with the real complete 2976-byte / 159-line SMC list of the same
  RaumController (automation lines + full event-235 names trailer). This is the
  path that crashed in the field ("Parsing of names … index out of range"), so
  the test asserts header/line-length integrity over all 159 records, that the
  trailer parses with **no** error logged, and the real decoded names — buttons,
  long buttons (arg 106-108), inputs, outputs incl. the lone area-2 output and
  the two Smart-Controller dimmers, LEDs, and vis-commands with their packed
  2-byte codes (e.g. 0x0505 → "Szene 5 aus").
- Added real-data tests for a second module type, a Smart Controller Mini
  (type 0x32 0x01, "Kleener im Büro & so"): `TestRealSCKMiniSmg` pins the
  coverless smg round-trip (covers=0 → `calc_cover_times` is 32 zero bytes) plus
  button times and name/serial/version, and `TestGetNamesRealSCKMini` drives the
  real 944-byte SMC through `get_names`, covering the Mini-only parse branches
  the RaumController does not reach: the Mini button range (arg 10/11), the
  "Ambient" LED-0 finalization, 253-prefixed direct-command descriptions and
  flags.
- Added `TestRealModuleMirrorRoundtrip`, driving `build_smg`/`build_status` over
  real full 242-byte status mirrors (live cmd-0x87 read-outs) of eight further
  module-type families: a motion detector ("Smart Detect 360", type 0x50 0x65),
  a weather sensor ("Smart Nature", type 0x14 0x01), a 24 V input module
  ("Smart In 8/24V-1", type 0x0b 0x1f), a dimmer ("Smart Dimm-2", type 0x0a 0x16),
  a GSM modem ("Smart GSM", type 0x1e 0x03), a 230 V input ("Smart In 8/230V",
  type 0x0b 0x01), a relay output ("Smart Out 8/R-1", type 0x0a 0x32) and an
  ekey fingerprint reader ("Fanekey", type 0x1e 0x01), and the two
  config-richest controller families: "Smart Controller XL-2" (type 0x01 0x02,
  whose name exercises latin-1 umlaut decoding) and "Smart Controller Touch"
  (type 0x01 0x04). Pins type/name/serial/version and the smg round-trip. The
  mirror extraction is cross-validated against module 9, whose mirror's
  `build_smg` reproduces the independently verified `REAL_SCK_SMG`.
- Added `test_mirror_running_real_operate_frame`, pinning `mirror_running()` and
  the config-mode marker against a real 43-byte router channel-status frame
  (cmd 10 4 4) captured just after a hub restart — the synthetic fixture used a
  too-short 41-byte buffer.
- Added `TestRealCompactStatus`, cross-validating `module.get_status(compact)`
  (the 107-byte record the cmd 10 5 2 all-module dump is built from) against the
  device's own compact output sliced from a real live dump, for five module
  types captured in the same session as their mirrors.

### Fixed
- Setting the system or a single group mode at runtime logged a spurious
  "handle_router_cmd_resp called in Opr mode, return 0 0" warning and returned a
  bogus `\x00` ack to SmartConfig. `RtHdlr.set_mode` always used the
  response-reading command variant, but in operate mode the event server owns the
  serial reader so no response can be read. It now sends the mode command
  fire-and-forget in operate mode (the router confirms via the event stream) and
  echoes the mode as the one-byte ack, mirroring how `set_output` already works.
  The mode change itself was never lost; only the warning and return value were
  wrong.
- Address-swap transfer corrupting a module's automations: after an in-place
  address swap (A 1→9, B 9→1) `remap_automation_triggers` rewrote each external
  trigger's source-module byte **in place** without re-sorting. The module
  stores its automation lines sorted by `(src_rt, src_mod, …)`; swapping e.g.
  `(1,1)→(1,9)` left it ahead of `(1,4)`, so the list was no longer ascending
  and the module rejected the SMC upload with error flag 255 — which empties the
  module (all automations gone). A module with only a single affected trigger
  (e.g. the partner module) stayed sorted and uploaded fine, which is why only
  the multi-trigger module lost its list. `remap_automation_triggers` now
  re-sorts the automation lines by `(src_rt, src_mod)` after any change; a stable
  sort is exact here because `src_rt` is never changed and the remap is a
  bijection on `src_mod`, so each resulting group keeps its original internal
  order. The names/trailing section is untouched.
- Saving a module list (automations/settings) could fail with `index out of
  range` when the SmartConfig app's periodic status poll arrived mid-upload. The
  network-API loop only honoured the `_netw_blocked` flag at the top of the loop
  (before `readexactly`), so a poll already in flight when a config-server save
  raised the block was processed anyway: its `_auto_restart_opr` path switched
  the router back to Operate mid-upload **and** cleared the save's network block.
  The next SMC packet then read the 2-byte Operate-mode sentinel buffer
  (`_resp_buffer[8]` → IndexError). The loop now serializes its command
  processing under the same `command_lock` the save/transfer hold for their
  whole upload (`readexactly` stays outside the lock so it can't starve a
  waiting save); `_api_cmd_processing` is set inside the lock. A poll arriving
  during a save now waits cleanly instead of corrupting the in-flight upload.
- The eKey log read/delete (`prepare_log_list`, `ekey_logs`) and the air-quality
  calibration (`get_aircal`) drove the router bus (mode switches +
  `block_network_if`) **without** holding `command_lock`, so a concurrent
  network-API command could collide with them exactly like the save crash above.
  All three now run inside `async with command_lock`.
- The diagnostics/test UI (`config_testing.py`) had the same class of gap in 12
  more handlers that drive the bus without `command_lock`: `test_router`,
  `test_communication`, `reset_comm_errors`, `start_test`, `stop_test`,
  `set_output`, `set_sys_settings`, `set_cov_autostop`, `chan_reset`,
  `isp_reset`, `new_chan_id`, `chg_chan_id`. All now wrap their bus access in
  `async with command_lock` (waiting, not aborting — these are short operations
  that should complete even if a brief Home-Assistant command holds the lock).
  The long-running handlers (`rt_reboot`, `rt_set_baud`, `rt_reinit_fwdtbl`,
  `prop_chan_id`, uploads, firmware updates, `re_init_hub`) keep their existing
  "abort with 204 if busy" guard.
- Address-swap group membership: an in-place swap (A 1→9, B 9→1) makes the
  router's own per-address group migration lose a value across the reused
  address. After all address changes the transfer now re-applies the per-address
  group membership once from the model. An `old → new` address map (0 = deleted)
  is collected during the transfer for this fix-up and for a planned automation
  address fix-up.
- `set_module_address_by_serial` no longer logs a misleading "at <new> set to
  address <new>" line in batch mode (the model already carries the new id at
  transfer time); the transfer now logs the accurate "from <old> to <new>".
- Module-table transfer now waits, after each broadcast address change, until
  the router has (re)loaded the changed module's mirror (router cmd 106, mirror
  bit 0x02) before the next change — graduated wait (immediate, +3 s, +7 s).
  This serializes the in-place ring swap so the next change's displacement never
  rushes a still-busy module (which previously timed out and dropped the
  module's address from the router table on a repeated swap). The same
  per-module mirror-ready wait now gates module read-in at startup/re-init: a
  module whose mirror is not delivered in time is removed as faulty instead of
  read with stale/garbled data — fixing the unreliable post-reboot read that
  needed a second pass. New helpers `HbtnRouter.mirror_ok` / `wait_mirror_ready`.
- Module-table transfer now pulls a changed module address through every
  module's **external automation triggers**: an automation triggered by a moved
  module (source address in automation byte 1, src_mod) is re-addressed to the
  module's new address, so external triggers keep working after an address
  change or in-place swap. Cross-router forwards and local triggers are left
  alone; a reference to a deleted module stays dangling (no new address). New
  helpers `remap_automation_triggers` / `fixup_automation_addresses` in
  `config_setup`, driven by the transfer's `addr_map`. The cached
  `ModuleSettings` of each rewritten module is rebuilt from the corrected list
  so the parsed automations (and the freshly resolved source-module trigger
  objects) match the new addresses, and a later save cannot re-derive from a
  stale definition.
- The transfer now ends by re-sorting `rtr.modules` by the new addresses and
  rebuilding the positionally correlated `rtr.mod_addrs` from it, so an in-place
  swap leaves both sorted and consistent for `get_module` (new helper
  `resort_modules_by_address`).

### Added
- Progress popup for the module-table transfer: the shared wait popup now shows
  an overall progress bar plus a scrolling result log (one line per step, e.g.
  "Modul an Kanal k von Adresse … auf … gesetzt"). `WaitProgress` gained a
  `log()` line buffer, `/wait_status` reports it as a third `|`-segment, and
  `progress.js` renders it — reusable by other multi-step operations.
- The settings learn "Moduladresse auf Kanalpaar anlernen" now opens a ~1-minute
  wait popup, holds the router in config (server) mode for the duration, and
  polls the router's module list (cmd 0x63) — reporting success as soon as the
  learned address appears (or a timeout). Online only; the busy/offline cases
  report a clear message instead of starting.

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
  ("Weiterleitungstabelle nicht geheilt", new `RT_ERROR_CODE[3]`) in the module
  fault list. Healing only runs in operate mode (the router collects forward
  tables itself during boot) and resets as soon as the forward bit clears. The
  retry re-request is fire-and-forget (router command 68), so it never
  interrupts the event stream.
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
- Module faults are now shown as a per-module list of single-bit F-codes in the
  "Modulfehler" row, e.g. `Modul 5: F1, F3`, each code carrying its own tooltip.
  A fault byte of 3 (timeout + comm error) is shown as `F1, F2` instead of the
  misleading combined `F3`, which keeps `F3` free as the dedicated code for an
  unhealed forward table; the comm-error codes (router cmd 101) and that `F3`
  are merged per module. A module-mirror problem (router cmd 106 bit 0x02) is
  likewise surfaced as the dedicated code `F5` ("Spiegelung gestört") in the
  same list. The router overview and the router diagnosis page use the same
  layout and labels ("Modulfehler" / "Letzter Modulfehler"); the separate
  "Modulrückmeldungen" summary row was dropped on both, and the "last fault" row
  is hidden while current faults are present. The per-module problem property
  was renamed `mod_boot_errors` → `mod_comm_errors` (it is no longer
  boot-specific).
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
