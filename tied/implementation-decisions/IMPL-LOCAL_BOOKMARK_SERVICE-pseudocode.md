# [IMPL-LOCAL_BOOKMARK_SERVICE] [ARCH-LOCAL_STORAGE_PROVIDER] [REQ-STORAGE_MODE_DEFAULT] [REQ-PER_BOOKMARK_STORAGE_BACKEND] — chrome.storage.local bookmark provider (one of five BookmarkRouter peers); same contract as Pinboard; keyed by URL. ARCH-STORAGE is settings/portability only — not this bookmark backend. Contract: url/bookmark/tag inputs and provider-shaped outputs; storage key and shape.

## GET_BOOKMARK_FOR_URL

- [IMPL-LOCAL_BOOKMARK_SERVICE] [ARCH-LOCAL_STORAGE_PROVIDER] [REQ-STORAGE_MODE_DEFAULT] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Implements getBookmarkForUrl(url) behavior for IMPL-LOCAL_BOOKMARK_SERVICE.
- Contract:
  - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: bookmark object or list of bookmarks or success/error; shape matches provider contract | { error: OperationFailed }
  - POST:
    - success => block outputs match OUTPUT success shape
    - error OperationFailed => no silent partial commit beyond documented best-effort
  - FAILURE_MODES: OperationFailed
  - DATA: storage key = hoverboard_local_bookmarks; value = object keyed by normalized URL -> bookmark
  - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
  - EFFECTS: IO, State
  - TERMINATION: total
- PROCEDURE: GET_BOOKMARK_FOR_URL
  - bookmarks = LOAD bookmarks
  - urlNorm = normalize(url)
  - RETURN bookmarks[urlNorm] or null
  - How (sub-block): Merge data into bookmark shape and persist to storage.

## SAVE_BOOKMARK

- [IMPL-LOCAL_BOOKMARK_SERVICE] [ARCH-LOCAL_STORAGE_PROVIDER] [REQ-STORAGE_MODE_DEFAULT] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Implements saveBookmark(data) behavior for IMPL-LOCAL_BOOKMARK_SERVICE.
- Contract:
  - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: bookmark object or list of bookmarks or success/error; shape matches provider contract | { error: OperationFailed }
  - POST:
    - success => block outputs match OUTPUT success shape
    - error OperationFailed => no silent partial commit beyond documented best-effort
  - FAILURE_MODES: OperationFailed
  - DATA: storage key = hoverboard_local_bookmarks; value = object keyed by normalized URL -> bookmark
  - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
  - EFFECTS: IO, State
  - TERMINATION: total
- PROCEDURE: SAVE_BOOKMARK
  - bookmarks = LOAD bookmarks
  - urlNorm = normalize(data.url)
  - bookmarks[urlNorm] = merge(data into bookmark shape with url, description, extended, tags, time, shared, toread, hash)
  - PERSIST bookmarks to storage under key
  - RETURN { success: true }
  - How (sub-block): Remove by normalized URL and persist.

## DELETE_BOOKMARK

- [IMPL-LOCAL_BOOKMARK_SERVICE] [ARCH-LOCAL_STORAGE_PROVIDER] [REQ-STORAGE_MODE_DEFAULT] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Implements deleteBookmark(url) behavior for IMPL-LOCAL_BOOKMARK_SERVICE.
- Contract:
  - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: bookmark object or list of bookmarks or success/error; shape matches provider contract | { error: OperationFailed }
  - POST:
    - success => block outputs match OUTPUT success shape
    - error OperationFailed => no silent partial commit beyond documented best-effort
  - FAILURE_MODES: OperationFailed
  - DATA: storage key = hoverboard_local_bookmarks; value = object keyed by normalized URL -> bookmark
  - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
  - EFFECTS: IO, State
  - TERMINATION: total
- PROCEDURE: DELETE_BOOKMARK
  - bookmarks = LOAD bookmarks
  - REMOVE bookmarks[normalize(url)]
  - PERSIST bookmarks to storage
  - RETURN { success: true }
  - How (sub-block): Update tags on bookmark and persist.

## SAVE_TAG

- [IMPL-LOCAL_BOOKMARK_SERVICE] [ARCH-LOCAL_STORAGE_PROVIDER] [REQ-STORAGE_MODE_DEFAULT] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Implements saveTag(data), deleteTag(data) behavior for IMPL-LOCAL_BOOKMARK_SERVICE.
- Contract:
  - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: bookmark object or list of bookmarks or success/error; shape matches provider contract | { error: OperationFailed }
  - POST:
    - success => block outputs match OUTPUT success shape
    - error OperationFailed => no silent partial commit beyond documented best-effort
  - FAILURE_MODES: OperationFailed
  - DATA: storage key = hoverboard_local_bookmarks; value = object keyed by normalized URL -> bookmark
  - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
  - EFFECTS: IO, State
  - TERMINATION: total
- PROCEDURE: SAVE_TAG
  - bookmark = getBookmarkForUrl(data.url)
  - update tags on bookmark
  - saveBookmark(bookmark) or equivalent
  - RETURN { success: true }
  - How (sub-block): Sort by time descending and return first count.

## GET_RECENT_BOOKMARKS

- [IMPL-LOCAL_BOOKMARK_SERVICE] [ARCH-LOCAL_STORAGE_PROVIDER] [REQ-STORAGE_MODE_DEFAULT] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Implements getRecentBookmarks(count) behavior for IMPL-LOCAL_BOOKMARK_SERVICE.
- Contract:
  - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: bookmark object or list of bookmarks or success/error; shape matches provider contract | { error: OperationFailed }
  - POST:
    - success => block outputs match OUTPUT success shape
    - error OperationFailed => no silent partial commit beyond documented best-effort
  - FAILURE_MODES: OperationFailed
  - DATA: storage key = hoverboard_local_bookmarks; value = object keyed by normalized URL -> bookmark
  - EFFECTS: IO
  - TERMINATION: total
- PROCEDURE: GET_RECENT_BOOKMARKS
  - bookmarks = LOAD bookmarks
  - list = values(bookmarks)
  - SORT list BY time DESCENDING
  - RETURN list[0..count-1]
