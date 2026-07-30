# [IMPL-SYNC_BOOKMARK_SERVICE] [ARCH-SYNC_STORAGE_PROVIDER] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-PER_BOOKMARK_STORAGE_BACKEND] — chrome.storage.sync peer provider under five-provider BookmarkRouter; same contract as LocalBookmarkService; quota ~100 KB. Contract: url/bookmark/tag inputs and provider-shaped outputs; sync key and shape.

## GET_BOOKMARK_FOR_URL

- [IMPL-SYNC_BOOKMARK_SERVICE] [ARCH-SYNC_STORAGE_PROVIDER] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Implements getBookmarkForUrl(url) behavior for IMPL-SYNC_BOOKMARK_SERVICE.
- Contract:
  - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: bookmark object or list of bookmarks or success/error; same provider contract as LocalBookmarkService | { error: OperationFailed }
  - POST:
    - success => block outputs match OUTPUT success shape
    - error OperationFailed => no silent partial commit beyond documented best-effort
  - FAILURE_MODES: OperationFailed
  - DATA: chrome.storage.sync key = hoverboard_sync_bookmarks; value = object keyed by URL -> bookmark (quota ~100 KB)
  - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
  - EFFECTS: IO, State
  - TERMINATION: total
- PROCEDURE: GET_BOOKMARK_FOR_URL
  - bookmarks = LOAD bookmarks
  - RETURN bookmarks[normalize(url)] or null
  - How (sub-block): Merge data and persist to sync.

## SAVE_BOOKMARK

- [IMPL-SYNC_BOOKMARK_SERVICE] [ARCH-SYNC_STORAGE_PROVIDER] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Implements saveBookmark(data) behavior for IMPL-SYNC_BOOKMARK_SERVICE.
- Contract:
  - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: bookmark object or list of bookmarks or success/error; same provider contract as LocalBookmarkService | { error: OperationFailed }
  - POST:
    - success => block outputs match OUTPUT success shape
    - error OperationFailed => no silent partial commit beyond documented best-effort
  - FAILURE_MODES: OperationFailed
  - DATA: chrome.storage.sync key = hoverboard_sync_bookmarks; value = object keyed by URL -> bookmark (quota ~100 KB)
  - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
  - EFFECTS: IO, State
  - TERMINATION: total
- PROCEDURE: SAVE_BOOKMARK
  - bookmarks = LOAD bookmarks
  - bookmarks[normalize(data.url)] = merge(data into bookmark shape)
  - PERSIST bookmarks to chrome.storage.sync
  - RETURN { success: true }
  - How (sub-block): Update bookmarks/tags and persist; return success.

## DELETE_BOOKMARK

- [IMPL-SYNC_BOOKMARK_SERVICE] [ARCH-SYNC_STORAGE_PROVIDER] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Implements deleteBookmark(url), saveTag(data), deleteTag(data) behavior for IMPL-SYNC_BOOKMARK_SERVICE.
- Contract:
  - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: bookmark object or list of bookmarks or success/error; same provider contract as LocalBookmarkService | { error: OperationFailed }
  - POST:
    - success => block outputs match OUTPUT success shape
    - error OperationFailed => no silent partial commit beyond documented best-effort
  - FAILURE_MODES: OperationFailed
  - DATA: chrome.storage.sync key = hoverboard_sync_bookmarks; value = object keyed by URL -> bookmark (quota ~100 KB)
  - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
  - EFFECTS: IO, State
  - TERMINATION: total
- PROCEDURE: DELETE_BOOKMARK
  - UPDATE bookmarks; PERSIST;       RETURN { success: true }
  - How (sub-block): Sort by time descending and return first count.

## GET_RECENT_BOOKMARKS

- [IMPL-SYNC_BOOKMARK_SERVICE] [ARCH-SYNC_STORAGE_PROVIDER] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Implements getRecentBookmarks(count) behavior for IMPL-SYNC_BOOKMARK_SERVICE.
- Contract:
  - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: bookmark object or list of bookmarks or success/error; same provider contract as LocalBookmarkService | { error: OperationFailed }
  - POST:
    - success => block outputs match OUTPUT success shape
    - error OperationFailed => no silent partial commit beyond documented best-effort
  - FAILURE_MODES: OperationFailed
  - DATA: chrome.storage.sync key = hoverboard_sync_bookmarks; value = object keyed by URL -> bookmark (quota ~100 KB)
  - EFFECTS: IO
  - TERMINATION: total
- PROCEDURE: GET_RECENT_BOOKMARKS
  - list = values(LOAD bookmarks); SORT BY time DESCENDING; RETURN list[0..count-1]
