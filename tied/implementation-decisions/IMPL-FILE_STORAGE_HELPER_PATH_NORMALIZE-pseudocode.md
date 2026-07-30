# [IMPL-FILE_STORAGE_HELPER_PATH_NORMALIZE] [ARCH-FILE_BOOKMARK_PROVIDER] [REQ-FILE_BOOKMARK_STORAGE] — Path normalization (~ expansion without double slash) and write verification (file exists and non-empty). Contract: path/data inputs and resolved path or success/error.

## EXPAND_TILDE

- [IMPL-FILE_STORAGE_HELPER_PATH_NORMALIZE] [ARCH-FILE_BOOKMARK_PROVIDER] [REQ-FILE_BOOKMARK_STORAGE] How: Implements expand_tilde(path) behavior for IMPL-FILE_STORAGE_HELPER_PATH_NORMALIZE.
- Contract:
  - INPUT: path string (may contain ~); file path and data (for write)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: resolved path (no double slash from HOME); success only if file exists and non-empty after write | { error: OperationFailed }
  - POST:
    - success => block outputs match OUTPUT success shape
    - error OperationFailed => no silent partial commit beyond documented best-effort
  - FAILURE_MODES: OperationFailed
  - DATA: HOME with trailing slash stripped (H = ${HOME%/})
  - EFFECTS: IO
  - TERMINATION: total
- PROCEDURE: EXPAND_TILDE
  - H = strip_trailing_slash(HOME)
  - IF path is ~ or ~/...: REPLACE ~ with H; RETURN (no // in result)
  - RETURN path
  - How (sub-block): Write data to path; fail if file missing or empty after write.

## WRITE_BOOKMARKS_FILE

- [IMPL-FILE_STORAGE_HELPER_PATH_NORMALIZE] [ARCH-FILE_BOOKMARK_PROVIDER] [REQ-FILE_BOOKMARK_STORAGE] How: Implements writeBookmarksFile(path, data) behavior for IMPL-FILE_STORAGE_HELPER_PATH_NORMALIZE.
- Contract:
  - INPUT: path string (may contain ~); file path and data (for write)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: resolved path (no double slash from HOME); success only if file exists and non-empty after write | { error: OperationFailed }
  - POST:
    - success => block outputs match OUTPUT success shape
    - error OperationFailed => no silent partial commit beyond documented best-effort
  - FAILURE_MODES: OperationFailed
  - DATA: HOME with trailing slash stripped (H = ${HOME%/})
  - EFFECTS: IO
  - TERMINATION: total
- PROCEDURE: WRITE_BOOKMARKS_FILE
  - path = expand_tilde(path)
  - WRITE data to path (create dir if needed)
  - IF file missing OR file empty: OUTPUT error; EXIT failure
  - ELSE: OUTPUT success
