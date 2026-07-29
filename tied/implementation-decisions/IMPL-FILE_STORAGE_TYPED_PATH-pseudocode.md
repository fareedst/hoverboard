# [IMPL-FILE_STORAGE_TYPED_PATH] [ARCH-FILE_BOOKMARK_PROVIDER] [REQ-FILE_BOOKMARK_STORAGE]
# User-typed path for file storage; Options persist path; native host read/write; initBookmarkProvider path vs picker.
# Contract: path input and storage; persisted path and file I/O via native host.
INPUT: path string (user-typed, default ~/.hoverboard); read/write requests with path
OUTPUT: persisted path in hoverboard_file_storage_path; file contents read/written via native host
DATA: hoverboard_file_storage_path (storage); path -> if dir then path/hoverboard-bookmarks.json else path as file

# Load path on init; save on blur/save.
Options (path input):
  ON load: READ hoverboard_file_storage_path; display in input (default ~/.hoverboard)
  ON save/blur: WRITE path to storage

# Expand ~ and resolve dir vs .json file (uses IMPL-FILE_STORAGE_HELPER_PATH_NORMALIZE).
resolveFilePath(path):
  path = expand_tilde(path)  // IMPL-FILE_STORAGE_HELPER_PATH_NORMALIZE
  IF path ends with .json: RETURN path AS file
  ELSE: RETURN path + "/hoverboard-bookmarks.json"

# Send native message to helper for read/write; return result.
readBookmarksFile(path), writeBookmarksFile(path, data):
  path = resolveFilePath(path)
  SEND native message (type, path) to helper; helper reads/writes file; RETURN result

# Prefer path adapter when path set; else picker adapter.
initBookmarkProvider():
  IF path set in storage: USE NativeHostFileBookmarkAdapter(path)
  ELSE IF picker configured: USE MessageFileBookmarkAdapter
