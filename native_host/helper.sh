#!/usr/bin/env sh
# === IMPL-FULL-BLOCK: IMPL-FILE_STORAGE_HELPER_PATH_NORMALIZE ===
# [IMPL-FILE_STORAGE_HELPER_PATH_NORMALIZE] [ARCH-FILE_BOOKMARK_PROVIDER] [REQ-FILE_BOOKMARK_STORAGE] — Path normalization (~ expansion without double slash) and write verification (file exists and non-empty). Contract: path/data inputs and resolved path or success/error.
# 
# ## EXPAND_TILDE
# 
# - [IMPL-FILE_STORAGE_HELPER_PATH_NORMALIZE] [ARCH-FILE_BOOKMARK_PROVIDER] [REQ-FILE_BOOKMARK_STORAGE] How: Implements expand_tilde(path) behavior for IMPL-FILE_STORAGE_HELPER_PATH_NORMALIZE.
# - Contract:
#   - INPUT: path string (may contain ~); file path and data (for write)
#   - PRE: caller supplies valid inputs for this block; dependencies wired
#   - OUTPUT: resolved path (no double slash from HOME); success only if file exists and non-empty after write | { error: OperationFailed }
#   - POST:
#     - success => block outputs match OUTPUT success shape
#     - error OperationFailed => no silent partial commit beyond documented best-effort
#   - FAILURE_MODES: OperationFailed
#   - DATA: HOME with trailing slash stripped (H = ${HOME%/})
#   - EFFECTS: IO
#   - TERMINATION: total
# - PROCEDURE: EXPAND_TILDE
#   - H = strip_trailing_slash(HOME)
#   - IF path is ~ or ~/...: REPLACE ~ with H; RETURN (no // in result)
#   - RETURN path
#   - How (sub-block): Write data to path; fail if file missing or empty after write.
# 
# ## WRITE_BOOKMARKS_FILE
# 
# - [IMPL-FILE_STORAGE_HELPER_PATH_NORMALIZE] [ARCH-FILE_BOOKMARK_PROVIDER] [REQ-FILE_BOOKMARK_STORAGE] How: Implements writeBookmarksFile(path, data) behavior for IMPL-FILE_STORAGE_HELPER_PATH_NORMALIZE.
# - Contract:
#   - INPUT: path string (may contain ~); file path and data (for write)
#   - PRE: caller supplies valid inputs for this block; dependencies wired
#   - OUTPUT: resolved path (no double slash from HOME); success only if file exists and non-empty after write | { error: OperationFailed }
#   - POST:
#     - success => block outputs match OUTPUT success shape
#     - error OperationFailed => no silent partial commit beyond documented best-effort
#   - FAILURE_MODES: OperationFailed
#   - DATA: HOME with trailing slash stripped (H = ${HOME%/})
#   - EFFECTS: IO
#   - TERMINATION: total
# - PROCEDURE: WRITE_BOOKMARKS_FILE
#   - path = expand_tilde(path)
#   - WRITE data to path (create dir if needed)
#   - IF file missing OR file empty: OUTPUT error; EXIT failure
#   - ELSE: OUTPUT success
# 
# === END IMPL-FULL-BLOCK: IMPL-FILE_STORAGE_HELPER_PATH_NORMALIZE ===
# [REQ-NATIVE_HOST_WRAPPER] [IMPL-NATIVE_HOST_WRAPPER] [IMPL-FILE_STORAGE_TYPED_PATH] [IMPL-FILE_STORAGE_HELPER_PATH_NORMALIZE]
# Read JSON from stdin; handle bookmark and page-archive files with path; else echo back.
# Path: directory (we use sibling hoverboard JSON files) or full path if ends with .json.
# Expands ~ to $HOME.

set -e
INPUT=$(cat)

# [IMPL-FILE_STORAGE_HELPER_PATH_NORMALIZE] Expand ~ to home. Use ${HOME%/} to avoid double slash when HOME has trailing slash (e.g. Chrome native host env).
expand_tilde() {
  H="${HOME%/}"
  case "$1" in
    '~') echo "$H" ;;
    ~/*) echo "${H}/${1#\~/}" ;;
    ~*)  echo "${H}/${1#\~}" ;;
    *)   echo "$1" ;;
  esac
}

# Resolve path to file: if ends with .json use as-is, else dir/hoverboard-bookmarks.json
resolve_file() {
  expanded=$(expand_tilde "$1")
  case "$expanded" in
    *\.json) echo "$expanded" ;;
    *)       echo "${expanded%/}/hoverboard-bookmarks.json" ;;
  esac
}

resolve_archive_file() {
  expanded=$(expand_tilde "$1")
  case "$expanded" in
    *\.json) echo "$expanded" ;;
    *)       echo "${expanded%/}/hoverboard-page-archives.json" ;;
  esac
}

if command -v jq >/dev/null 2>&1; then
  TYPE=$(echo "$INPUT" | jq -r '.type // empty')
  case "$TYPE" in
    readBookmarksFile)
      PATH_ARG=$(echo "$INPUT" | jq -r '.path // empty')
      if [ -z "$PATH_ARG" ]; then
        echo "{\"type\":\"error\",\"message\":\"readBookmarksFile: path required\"}"
        exit 0
      fi
      FILE=$(resolve_file "$PATH_ARG")
      DIR=$(dirname "$FILE")
      if [ ! -f "$FILE" ]; then
        echo "{\"type\":\"readBookmarksFile\",\"data\":{\"version\":1,\"bookmarks\":{}}}"
        exit 0
      fi
      DATA=$(cat "$FILE" | jq -c . 2>/dev/null || echo '{"version":1,"bookmarks":{}}')
      echo "$DATA" | jq -c '{type: "readBookmarksFile", data: .}'
      ;;
    writeBookmarksFile)
      PATH_ARG=$(echo "$INPUT" | jq -r '.path // empty')
      if [ -z "$PATH_ARG" ]; then
        echo "{\"type\":\"error\",\"message\":\"writeBookmarksFile: path required\"}"
        exit 0
      fi
      FILE=$(resolve_file "$PATH_ARG")
      DIR=$(dirname "$FILE")
      mkdir -p "$DIR"
      DATA=$(echo "$INPUT" | jq -c '.data // {version:1, bookmarks:{}}')
      echo "$DATA" > "$FILE"
      # [IMPL-FILE_STORAGE_HELPER_PATH_NORMALIZE] Post-write verification: return error if file missing or empty
      if [ ! -f "$FILE" ] || [ ! -s "$FILE" ]; then
        echo "{\"type\":\"error\",\"message\":\"writeBookmarksFile: failed to write file\"}"
        exit 0
      fi
      echo "{\"type\":\"writeBookmarksFile\",\"success\":true}"
      ;;
    readArchiveFile)
      PATH_ARG=$(echo "$INPUT" | jq -r '.path // empty')
      if [ -z "$PATH_ARG" ]; then
        echo "{\"type\":\"error\",\"message\":\"readArchiveFile: path required\"}"
        exit 0
      fi
      FILE=$(resolve_archive_file "$PATH_ARG")
      if [ ! -f "$FILE" ]; then
        echo "{\"type\":\"readArchiveFile\",\"data\":{\"version\":1,\"archives\":{},\"screenshots\":{}}}"
        exit 0
      fi
      DATA=$(cat "$FILE" | jq -c . 2>/dev/null || echo '{"version":1,"archives":{},"screenshots":{}}')
      echo "$DATA" | jq -c '{type: "readArchiveFile", data: .}'
      ;;
    writeArchiveFile)
      PATH_ARG=$(echo "$INPUT" | jq -r '.path // empty')
      if [ -z "$PATH_ARG" ]; then
        echo "{\"type\":\"error\",\"message\":\"writeArchiveFile: path required\"}"
        exit 0
      fi
      FILE=$(resolve_archive_file "$PATH_ARG")
      DIR=$(dirname "$FILE")
      mkdir -p "$DIR"
      DATA=$(echo "$INPUT" | jq -c '.data // {version:1, archives:{}, screenshots:{}}')
      echo "$DATA" > "$FILE"
      if [ ! -f "$FILE" ] || [ ! -s "$FILE" ]; then
        echo "{\"type\":\"error\",\"message\":\"writeArchiveFile: failed to write file\"}"
        exit 0
      fi
      echo "{\"type\":\"writeArchiveFile\",\"success\":true}"
      ;;
    *)
      echo "$INPUT" | jq -c 'if .type then . else {type: "echo", payload: .} end'
      ;;
  esac
else
  echo "$INPUT" | cat
fi
