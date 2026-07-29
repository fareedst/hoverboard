# [IMPL-STORAGE] [ARCH-STORAGE] [REQ-CHROME_STORAGE_USAGE] [REQ-CONFIG_PORTABILITY]
# How: use chrome.storage.sync for settings and local for temp/cache; support export/import of portable config.
INPUT: get/set keys for settings and caches; export/import payloads
OUTPUT: persisted settings across devices via sync; local caches; portable backup files
DATA: chrome.storage.sync / local; ConfigManager; IMPL-CONFIG_BACKUP_RESTORE

# [IMPL-STORAGE] [ARCH-STORAGE] [REQ-CHROME_STORAGE_USAGE]
# How: read/write settings through ConfigManager backed by chrome.storage areas.
STORAGE_GET_SET(area, key, value?):
  IF value provided: AWAIT chrome.storage[area].set({ key: value }); RETURN
  data = AWAIT chrome.storage[area].get(key)
  RETURN data[key]

# How: export/import settings for portability (delegates detail to IMPL-CONFIG_BACKUP_RESTORE).
EXPORT_IMPORT_SETTINGS(mode, payload?):
  IF mode = export: RETURN serialize(config)
  IF mode = import: AWAIT mergeAndPersist(payload); RETURN ok
