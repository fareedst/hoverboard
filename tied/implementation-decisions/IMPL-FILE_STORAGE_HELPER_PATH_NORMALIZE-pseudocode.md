# [IMPL-FILE_STORAGE_HELPER_PATH_NORMALIZE] [ARCH-FILE_BOOKMARK_PROVIDER] [REQ-FILE_BOOKMARK_STORAGE]
# Path normalization (~ expansion without double slash) and write verification (file exists and non-empty).
# Contract: path/data inputs and resolved path or success/error.
INPUT: path string (may contain ~); file path and data (for write)
OUTPUT: resolved path (no double slash from HOME); success only if file exists and non-empty after write
DATA: HOME with trailing slash stripped (H = ${HOME%/})

# Resolve ~ using stripped HOME to avoid double slash.
expand_tilde(path):
  H = strip_trailing_slash(HOME)
  IF path is ~ or ~/...: REPLACE ~ with H; RETURN (no // in result)
  RETURN path

# Write data to path; fail if file missing or empty after write.
writeBookmarksFile(path, data):
  path = expand_tilde(path)
  WRITE data to path (create dir if needed)
  IF file missing OR file empty: OUTPUT error; EXIT failure
  ELSE: OUTPUT success
