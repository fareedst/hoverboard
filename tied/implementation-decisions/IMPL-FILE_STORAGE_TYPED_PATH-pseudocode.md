# [IMPL-FILE_STORAGE_TYPED_PATH] [ARCH-FILE_BOOKMARK_PROVIDER] [REQ-FILE_BOOKMARK_STORAGE] — User-typed path for file storage; Options persist path; native host read/write; initBookmarkProvider path vs picker. Contract: path input and storage; persisted path and file I/O via native host.

## RESOLVE_FILE_PATH

- [IMPL-FILE_STORAGE_TYPED_PATH] [ARCH-FILE_BOOKMARK_PROVIDER] [REQ-FILE_BOOKMARK_STORAGE] How: Implements resolveFilePath(path) behavior for IMPL-FILE_STORAGE_TYPED_PATH.
- Contract:
  - INPUT: path string (user-typed, default ~/.hoverboard); read/write requests with path
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: persisted path in hoverboard_file_storage_path; file contents read/written via native host
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: hoverboard_file_storage_path (storage); path -> if dir then path/hoverboard-bookmarks.json else path as file
  - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
  - EFFECTS: IO, State
  - TERMINATION: total
- PROCEDURE: RESOLVE_FILE_PATH
  - path = expand_tilde(path)  // IMPL-FILE_STORAGE_HELPER_PATH_NORMALIZE
  - IF path ends with .json: RETURN path AS file
  - ELSE: RETURN path + "/hoverboard-bookmarks.json"
  - How (sub-block): Send native message to helper for read/write; return result.

## READ_BOOKMARKS_FILE

- [IMPL-FILE_STORAGE_TYPED_PATH] [ARCH-FILE_BOOKMARK_PROVIDER] [REQ-FILE_BOOKMARK_STORAGE] How: Implements readBookmarksFile(path), writeBookmarksFile(path, data) behavior for IMPL-FILE_STORAGE_TYPED_PATH.
- Contract:
  - INPUT: path string (user-typed, default ~/.hoverboard); read/write requests with path
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: persisted path in hoverboard_file_storage_path; file contents read/written via native host
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: hoverboard_file_storage_path (storage); path -> if dir then path/hoverboard-bookmarks.json else path as file
  - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
  - EFFECTS: IO, State
  - TERMINATION: total
- PROCEDURE: READ_BOOKMARKS_FILE
  - path = resolveFilePath(path)
  - SEND native message (type, path) to helper; helper reads/writes file; RETURN result
  - How (sub-block): Prefer path adapter when path set; else picker adapter.

## INIT_BOOKMARK_PROVIDER

- [IMPL-FILE_STORAGE_TYPED_PATH] [ARCH-FILE_BOOKMARK_PROVIDER] [REQ-FILE_BOOKMARK_STORAGE] How: Implements initBookmarkProvider() behavior for IMPL-FILE_STORAGE_TYPED_PATH.
- Contract:
  - INPUT: path string (user-typed, default ~/.hoverboard); read/write requests with path
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: persisted path in hoverboard_file_storage_path; file contents read/written via native host
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: hoverboard_file_storage_path (storage); path -> if dir then path/hoverboard-bookmarks.json else path as file
  - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
  - EFFECTS: IO, State
  - TERMINATION: total
- PROCEDURE: INIT_BOOKMARK_PROVIDER
  - IF path set in storage: USE NativeHostFileBookmarkAdapter(path)
  - ELSE IF picker configured: USE MessageFileBookmarkAdapter
