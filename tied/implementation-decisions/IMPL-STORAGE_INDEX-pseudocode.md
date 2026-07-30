# [IMPL-STORAGE_INDEX] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-PER_BOOKMARK_STORAGE_BACKEND] [REQ-BROWSER_BOOKMARK_STORAGE] — Per-URL backend in chrome.storage.local; getIndex, getBackendForUrl, setBackendForUrl, removeUrl; migration from local bookmarks when empty.

## GET_INDEX

- [IMPL-STORAGE_INDEX] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-PER_BOOKMARK_STORAGE_BACKEND] [REQ-BROWSER_BOOKMARK_STORAGE] How: Load and return index from storage (or {}).
- Contract:
  - INPUT: storage key (hoverboard_storage_index)
  - PRE: chrome.storage.local available
  - OUTPUT: index map url -> backend (pinboard|local|file|sync|browser)
  - POST:
    - success => map or empty map if missing
  - DATA: index persisted under hoverboard_storage_index; VALID_BACKENDS includes browser
  - EFFECTS: Async, IO
  - TERMINATION: total
- PROCEDURE: GET_INDEX
  - 1. LOAD index from storage under key
  - 2. RETURN index (or empty map if missing)

## GET_BACKEND_FOR_URL

- [IMPL-STORAGE_INDEX] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-PER_BOOKMARK_STORAGE_BACKEND] [REQ-BROWSER_BOOKMARK_STORAGE] How: Lookup backend for URL.
- Contract:
  - INPUT: url
  - PRE: url is a string
  - OUTPUT: backend string | null
  - POST:
    - success => index[url] or null
  - DATA: index
  - EFFECTS: Async, IO
  - TERMINATION: total
- PROCEDURE: GET_BACKEND_FOR_URL
  - 1. index = GET_INDEX()
  - 2. RETURN index[url] or null

## SET_BACKEND_FOR_URL

- [IMPL-STORAGE_INDEX] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-PER_BOOKMARK_STORAGE_BACKEND] [REQ-BROWSER_BOOKMARK_STORAGE] How: Set backend for URL and persist.
- Contract:
  - INPUT: url, backend (pinboard|local|file|sync|browser)
  - PRE: backend in VALID_BACKENDS
  - OUTPUT: void (persisted)
  - POST:
    - success => index[url] = backend and persisted
  - DATA: index
  - DATA_TRANSITION: index[url] set to backend; storage updated
  - EFFECTS: Async, IO, State
  - TERMINATION: total
- PROCEDURE: SET_BACKEND_FOR_URL
  - 1. index = GET_INDEX()
  - 2. SET index[url] = backend
  - 3. PERSIST index to storage

## REMOVE_URL

- [IMPL-STORAGE_INDEX] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-PER_BOOKMARK_STORAGE_BACKEND] [REQ-BROWSER_BOOKMARK_STORAGE] How: Remove URL from index and persist.
- Contract:
  - INPUT: url
  - PRE: url is a string
  - OUTPUT: void (persisted)
  - POST:
    - success => url absent from index and persisted
  - DATA: index
  - DATA_TRANSITION: index[url] removed; storage updated
  - EFFECTS: Async, IO, State
  - TERMINATION: total
- PROCEDURE: REMOVE_URL
  - 1. index = GET_INDEX()
  - 2. REMOVE index[url]
  - 3. PERSIST index to storage

## MIGRATE_FROM_LOCAL_WHEN_EMPTY

- [IMPL-STORAGE_INDEX] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Seed index from local bookmarks when empty.
- Contract:
  - INPUT: optional localBookmarkProvider
  - PRE: called on first use or when index empty
  - OUTPUT: void
  - POST:
    - success => when index was empty and provider given, each local bookmark url mapped to "local"
  - DATA: index
  - DATA_TRANSITION: may set many index[url] = "local"
  - EFFECTS: Async, IO, State
  - TERMINATION: total
- PROCEDURE: MIGRATE_FROM_LOCAL_WHEN_EMPTY
  - 1. IF GET_INDEX() is empty AND localBookmarkProvider given:
  - 2. bookmarks = localBookmarkProvider.getAllBookmarks()
  - 3. FOR each bookmark WITH url: SET_BACKEND_FOR_URL(url, "local")
