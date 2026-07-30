# [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE] [REQ-PER_BOOKMARK_STORAGE_BACKEND] — chrome.bookmarks provider; same duck-typed contract as LocalBookmarkService; folder path ↔ tags with Chrome root strip; URL collapse. Contract: url/bookmark/tag inputs and provider-shaped outputs; native Chrome tree as backing store.

## CLEAN_URL

- [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE] How: Normalize URL the same way as other providers (trim, strip trailing slash).
- Contract:
  - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: bookmark object or list of bookmarks or success/error; same provider contract as LocalBookmarkService | { error: OperationFailed }
  - POST:
    - success => block outputs match OUTPUT success shape
    - error OperationFailed => no silent partial commit beyond documented best-effort
  - FAILURE_MODES: OperationFailed
  - DATA: chrome.bookmarks tree; Other Bookmarks folder id = "2"; Bookmarks Bar id = "1"; pin fields shared/toread/extended not stored in Chrome
  - EFFECTS: IO
  - TERMINATION: total
- PROCEDURE: CLEAN_URL
  - RETURN trim(url) without trailing slashes

## LOAD_FLAT_ITEMS

- [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE] How: Flatten chrome.bookmarks.getTree to URL items with folderPath and parentIds; strip root segments via ids 1/2 (fallback titles).
- Contract:
  - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: bookmark object or list of bookmarks or success/error; same provider contract as LocalBookmarkService | { error: OperationFailed }
  - POST:
    - success => block outputs match OUTPUT success shape
    - error OperationFailed => no silent partial commit beyond documented best-effort
  - FAILURE_MODES: OperationFailed
  - DATA: chrome.bookmarks tree; Other Bookmarks folder id = "2"; Bookmarks Bar id = "1"; pin fields shared/toread/extended not stored in Chrome
  - EFFECTS: IO
  - TERMINATION: total
- PROCEDURE: LOAD_FLAT_ITEMS
  - tree = chrome.bookmarks.getTree()
  - items = flattenTree(tree)  # { id, url, title, dateAdded, folderPath, parentId }
  - FOR each item:
  - item.tags = folderPathToTags(item.folderPath, { stripRoots: true })
  - RETURN items

## COLLAPSE_BY_URL

- [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE] How: Collapse duplicate URLs into one pin-shaped bookmark; merge tags; use earliest dateAdded for time; description from first title.
- Contract:
  - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: bookmark object or list of bookmarks or success/error; same provider contract as LocalBookmarkService | { error: OperationFailed }
  - POST:
    - success => block outputs match OUTPUT success shape
    - error OperationFailed => no silent partial commit beyond documented best-effort
  - FAILURE_MODES: OperationFailed
  - DATA: chrome.bookmarks tree; Other Bookmarks folder id = "2"; Bookmarks Bar id = "1"; pin fields shared/toread/extended not stored in Chrome
  - EFFECTS: IO
  - TERMINATION: total
- PROCEDURE: COLLAPSE_BY_URL
  - map = {}
  - FOR each item IN items WHERE item.url:
  - key = cleanUrl(item.url)
  - IF map lacks key:
  - map[key] = pinShape(item)  # description=title, time=ISO(dateAdded), tags=item.tags, shared='yes', toread='no', extended='', nodeIds=[item.id]
  - ELSE:
  - merge tags into map[key].tags (dedupe)
  - append item.id to map[key].nodeIds
  - IF item.dateAdded earlier: map[key].time = ISO(item.dateAdded)
  - RETURN values(map)

## GET_BOOKMARK_FOR_URL

- [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE] How: Lookup by URL; return collapsed pin or empty stub.
- Contract:
  - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: bookmark object or list of bookmarks or success/error; same provider contract as LocalBookmarkService | { error: OperationFailed }
  - POST:
    - success => block outputs match OUTPUT success shape
    - error OperationFailed => no silent partial commit beyond documented best-effort
  - FAILURE_MODES: OperationFailed
  - DATA: chrome.bookmarks tree; Other Bookmarks folder id = "2"; Bookmarks Bar id = "1"; pin fields shared/toread/extended not stored in Chrome
  - EFFECTS: IO
  - TERMINATION: total
- PROCEDURE: GET_BOOKMARK_FOR_URL
  - items = LOAD_FLAT_ITEMS filtered by cleanUrl(url)
  - IF items empty: RETURN emptyStub(url, title)
  - collapsed = collapseByUrl(items)
  - RETURN collapsed[0]

## GET_ALL_BOOKMARKS

- [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE] How: All URL bookmarks for index aggregation (router tags storage='browser').
- Contract:
  - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: bookmark object or list of bookmarks or success/error; same provider contract as LocalBookmarkService | { error: OperationFailed }
  - POST:
    - success => block outputs match OUTPUT success shape
    - error OperationFailed => no silent partial commit beyond documented best-effort
  - FAILURE_MODES: OperationFailed
  - DATA: chrome.bookmarks tree; Other Bookmarks folder id = "2"; Bookmarks Bar id = "1"; pin fields shared/toread/extended not stored in Chrome
  - EFFECTS: IO
  - TERMINATION: total
- PROCEDURE: GET_ALL_BOOKMARKS
  - RETURN collapseByUrl(LOAD_FLAT_ITEMS)

## GET_RECENT_BOOKMARKS

- [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE] How: Recent by dateAdded descending.
- Contract:
  - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: bookmark object or list of bookmarks or success/error; same provider contract as LocalBookmarkService | { error: OperationFailed }
  - POST:
    - success => block outputs match OUTPUT success shape
    - error OperationFailed => no silent partial commit beyond documented best-effort
  - FAILURE_MODES: OperationFailed
  - DATA: chrome.bookmarks tree; Other Bookmarks folder id = "2"; Bookmarks Bar id = "1"; pin fields shared/toread/extended not stored in Chrome
  - EFFECTS: IO
  - TERMINATION: total
- PROCEDURE: GET_RECENT_BOOKMARKS
  - list = getAllBookmarks(); SORT BY time DESCENDING; RETURN list[0..count-1]

## SAVE_BOOKMARK

- [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE] How: Ensure folder chain under Other Bookmarks (id 2) from tags; create or update all nodes for URL; ignore shared/toread/extended writes.
- Contract:
  - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: bookmark object or list of bookmarks or success/error; same provider contract as LocalBookmarkService | { error: OperationFailed }
  - POST:
    - success => block outputs match OUTPUT success shape
    - error OperationFailed => no silent partial commit beyond documented best-effort
  - FAILURE_MODES: OperationFailed
  - DATA: chrome.bookmarks tree; Other Bookmarks folder id = "2"; Bookmarks Bar id = "1"; pin fields shared/toread/extended not stored in Chrome
  - EFFECTS: IO
  - TERMINATION: total
- PROCEDURE: SAVE_BOOKMARK
  - key = cleanUrl(data.url)
  - parentId = ENSURE_TAG_FOLDERS(data.tags)  # nested under id "2"; empty tags → parent id "2"
  - existing = chrome.bookmarks.search({ url: data.url }) matching key
  - IF existing empty:
  - chrome.bookmarks.create({ parentId, title: data.description or '', url: data.url })
  - ELSE:
  - FOR each node IN existing:
  - chrome.bookmarks.update(node.id, { title: data.description or node.title })
  - IF node.parentId != parentId AND data.tags provided: chrome.bookmarks.move(node.id, { parentId })
  - How (sub-block): # shared, toread, extended: no-op (Chrome has no equivalents)
  - RETURN { success: true }

## DELETE_BOOKMARK

- [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE] How: Remove every Chrome node whose URL matches.
- Contract:
  - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: bookmark object or list of bookmarks or success/error; same provider contract as LocalBookmarkService | { error: OperationFailed }
  - POST:
    - success => block outputs match OUTPUT success shape
    - error OperationFailed => no silent partial commit beyond documented best-effort
  - FAILURE_MODES: OperationFailed
  - DATA: chrome.bookmarks tree; Other Bookmarks folder id = "2"; Bookmarks Bar id = "1"; pin fields shared/toread/extended not stored in Chrome
  - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
  - EFFECTS: IO, State
  - TERMINATION: total
- PROCEDURE: DELETE_BOOKMARK
  - key = cleanUrl(url)
  - nodes = search matching key
  - FOR each node: chrome.bookmarks.remove(node.id)
  - RETURN { success: true }

## SAVE_TAG

- [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE] How: Tag ops mutate folder placement via saveBookmark with updated tags.
- Contract:
  - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: bookmark object or list of bookmarks or success/error; same provider contract as LocalBookmarkService | { error: OperationFailed }
  - POST:
    - success => block outputs match OUTPUT success shape
    - error OperationFailed => no silent partial commit beyond documented best-effort
  - FAILURE_MODES: OperationFailed
  - DATA: chrome.bookmarks tree; Other Bookmarks folder id = "2"; Bookmarks Bar id = "1"; pin fields shared/toread/extended not stored in Chrome
  - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
  - EFFECTS: IO, State
  - TERMINATION: total
- PROCEDURE: SAVE_TAG
  - bookmark = getBookmarkForUrl(tagData.url)
  - UPDATE bookmark.tags per tagData
  - RETURN saveBookmark(bookmark)

## TEST_CONNECTION

- [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE] How: Always available when bookmarks permission present.
- Contract:
  - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: bookmark object or list of bookmarks or success/error; same provider contract as LocalBookmarkService | { error: OperationFailed }
  - POST:
    - success => block outputs match OUTPUT success shape
    - error OperationFailed => no silent partial commit beyond documented best-effort
  - FAILURE_MODES: OperationFailed
  - DATA: chrome.bookmarks tree; Other Bookmarks folder id = "2"; Bookmarks Bar id = "1"; pin fields shared/toread/extended not stored in Chrome
  - EFFECTS: IO
  - TERMINATION: total
- PROCEDURE: TEST_CONNECTION
  - RETURN true

## ENSURE_TAG_FOLDERS

- [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE] How: Get-or-create nested folders under Other Bookmarks for each tag segment; return leaf folder id.
- Contract:
  - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: bookmark object or list of bookmarks or success/error; same provider contract as LocalBookmarkService | { error: OperationFailed }
  - POST:
    - success => block outputs match OUTPUT success shape
    - error OperationFailed => no silent partial commit beyond documented best-effort
  - FAILURE_MODES: OperationFailed
  - DATA: chrome.bookmarks tree; Other Bookmarks folder id = "2"; Bookmarks Bar id = "1"; pin fields shared/toread/extended not stored in Chrome
  - EFFECTS: IO
  - TERMINATION: total
- PROCEDURE: ENSURE_TAG_FOLDERS
  - parentId = "2"  # Other Bookmarks
  - FOR each tag IN tags:
  - child = find folder under parentId titled tag OR create folder
  - parentId = child.id
  - RETURN parentId
