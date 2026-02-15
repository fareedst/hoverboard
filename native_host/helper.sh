#!/usr/bin/env sh
# [REQ-NATIVE_HOST_WRAPPER] [IMPL-NATIVE_HOST_WRAPPER] [IMPL-FILE_STORAGE_TYPED_PATH] [IMPL-FILE_STORAGE_HELPER_PATH_NORMALIZE]
# Read JSON from stdin; handle readBookmarksFile/writeBookmarksFile with path; else echo back.
# Path: directory (we use path/hoverboard-bookmarks.json) or full path if ends with .json.
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
    *)
      echo "$INPUT" | jq -c 'if .type then . else {type: "echo", payload: .} end'
      ;;
  esac
else
  echo "$INPUT" | cat
fi
