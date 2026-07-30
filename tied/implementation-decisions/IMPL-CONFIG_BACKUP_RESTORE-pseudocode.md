# [IMPL-CONFIG_BACKUP_RESTORE] [ARCH-CONFIG_STRUCTURE] [REQ-CONFIG_PORTABILITY] — exportConfig/importConfig: gather settings, auth, inhibit URLs for backup and portability.

## EXPORT_CONFIG

- [IMPL-CONFIG_BACKUP_RESTORE] [ARCH-CONFIG_STRUCTURE] [REQ-CONFIG_PORTABILITY] How: Implements exportConfig() behavior for IMPL-CONFIG_BACKUP_RESTORE.
- Contract:
  - INPUT: none (export); serialized config blob (import)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: config object (export); void or error (import) | { error: OperationFailed }
  - POST:
    - success => block outputs match OUTPUT success shape
    - error OperationFailed => no silent partial commit beyond documented best-effort
  - FAILURE_MODES: OperationFailed
  - DATA: settings, auth, inhibit URLs (from storage / to storage)
  - EFFECTS: Async, IO
  - TERMINATION: total
- PROCEDURE: EXPORT_CONFIG
  - PARALLEL_GET settings, auth, inhibitUrlList from storage (or config manager)
  - BUILD config object = { settings, auth, inhibitUrls: inhibitUrlList }
  - RETURN config object (serializable)
  - How (sub-block): Parse and validate blob; write settings, auth, inhibit URLs to storage; handle conflicts per product rule.

## IMPORT_CONFIG

- [IMPL-CONFIG_BACKUP_RESTORE] [ARCH-CONFIG_STRUCTURE] [REQ-CONFIG_PORTABILITY] How: Implements importConfig(configBlob) behavior for IMPL-CONFIG_BACKUP_RESTORE.
- Contract:
  - INPUT: none (export); serialized config blob (import)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: config object (export); void or error (import) | { error: OperationFailed }
  - POST:
    - success => block outputs match OUTPUT success shape
    - error OperationFailed => no silent partial commit beyond documented best-effort
  - FAILURE_MODES: OperationFailed
  - DATA: settings, auth, inhibit URLs (from storage / to storage)
  - EFFECTS: IO
  - TERMINATION: total
- PROCEDURE: IMPORT_CONFIG
  - PARSE configBlob
  - VALIDATE structure
  - WRITE settings to storage
  - WRITE auth to storage
  - WRITE inhibit URLs to storage (if present)
  - HANDLE conflicts or overwrite per product rule
