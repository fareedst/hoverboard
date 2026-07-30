# [IMPL-STORAGE] [ARCH-STORAGE] [REQ-CHROME_STORAGE_USAGE] [REQ-CONFIG_PORTABILITY] — How: use chrome.storage.sync for settings and local for temp/cache; support export/import of portable config.

## STORAGE_GET_SET

- [IMPL-STORAGE] [ARCH-STORAGE] [REQ-CHROME_STORAGE_USAGE] How: read/write settings through ConfigManager backed by chrome.storage areas.
- Contract:
  - INPUT: get/set keys for settings and caches; export/import payloads
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: persisted settings across devices via sync; local caches; portable backup files
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: chrome.storage.sync / local; ConfigManager; IMPL-CONFIG_BACKUP_RESTORE
  - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
  - EFFECTS: Async, IO, State
  - TERMINATION: total
- PROCEDURE: STORAGE_GET_SET
  - IF value provided: AWAIT chrome.storage[area].set({ key: value }); RETURN
  - data = AWAIT chrome.storage[area].get(key)
  - RETURN data[key]
  - How (sub-block): How: export/import settings for portability (delegates detail to IMPL-CONFIG_BACKUP_RESTORE).

## EXPORT_IMPORT_SETTINGS

- [IMPL-STORAGE] [ARCH-STORAGE] [REQ-CHROME_STORAGE_USAGE] [REQ-CONFIG_PORTABILITY] How: Implements EXPORT_IMPORT_SETTINGS(mode, payload?) behavior for IMPL-STORAGE.
- Contract:
  - INPUT: get/set keys for settings and caches; export/import payloads
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: persisted settings across devices via sync; local caches; portable backup files
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: chrome.storage.sync / local; ConfigManager; IMPL-CONFIG_BACKUP_RESTORE
  - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
  - EFFECTS: Async, IO, State
  - TERMINATION: total
- PROCEDURE: EXPORT_IMPORT_SETTINGS
  - IF mode = export: RETURN serialize(config)
  - IF mode = import: AWAIT mergeAndPersist(payload); RETURN ok
