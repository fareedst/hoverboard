/**
 * [IMPL-BOOKMARK_ROUTER] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-PER_BOOKMARK_STORAGE_BACKEND] [REQ-STORAGE_MODE_DEFAULT] [REQ-MOVE_BOOKMARK_STORAGE_UI] [REQ-BROWSER_BOOKMARK_STORAGE]
 * Unit tests for BookmarkRouter.
 */

/**
 * === IMPL-FULL-BLOCK: IMPL-BOOKMARK_CREATE_UPDATE_TIMES ===
 * [IMPL-BOOKMARK_CREATE_UPDATE_TIMES] [ARCH-BOOKMARK_CREATE_UPDATE_TIMES] [REQ-BOOKMARK_CREATE_UPDATE_TIMES] — Every bookmark has time (create) and updated_at (last update); provider-specific set/normalize; export/import include.
 * 
 * ## PINBOARD
 * 
 * - [IMPL-BOOKMARK_CREATE_UPDATE_TIMES] [ARCH-BOOKMARK_CREATE_UPDATE_TIMES] [REQ-BOOKMARK_CREATE_UPDATE_TIMES] — import create preserves CSV/JSON Time and Updated. How: Implements Pinboard behavior for IMPL-BOOKMARK_CREATE_UPDATE_TIMES.
 * - Contract:
 *   - INPUT: bookmark data (for save), API response (for Pinboard), raw record (for normalize)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark with time and updated_at set per provider and context
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: time = create time; updated_at = last update time
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: PINBOARD
 *   - parseBookmarkResponse / createEmptyBookmark: SET updated_at = time (API has no updated_at)
 *   - SEND to API: do NOT include updated_at
 *   - How (sub-block): If missing updated_at set to time (legacy); include updated_at in payload/CSV/JSON.
 *   - 1. Normalize (url-tags-manager, display, move, export/import):
 *   - IF bookmark has no updated_at: SET updated_at = time   // legacy
 *   - ELSE: keep updated_at
 *   - Include updated_at in payload/CSV/JSON
 * 
 * === END IMPL-FULL-BLOCK: IMPL-BOOKMARK_CREATE_UPDATE_TIMES ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-BOOKMARK_ROUTER ===
 * [IMPL-BOOKMARK_ROUTER] [ARCH-STORAGE_INDEX_AND_ROUTER] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-PER_BOOKMARK_STORAGE_BACKEND] [REQ-STORAGE_MODE_DEFAULT] [REQ-MOVE_BOOKMARK_STORAGE_UI] [REQ-LOCAL_BOOKMARKS_INDEX] [REQ-BROWSER_BOOKMARK_STORAGE] — Delegate by URL via storage index; preferredBackend for save/delete; aggregate getRecentBookmarks; moveBookmarkToStorage; fifth provider browser with 2C getBookmarkForUrl rule.
 * 
 * ## RESOLVE_PROVIDER
 * 
 * - [IMPL-BOOKMARK_ROUTER] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-PER_BOOKMARK_STORAGE_BACKEND] [REQ-STORAGE_MODE_DEFAULT] [REQ-BROWSER_BOOKMARK_STORAGE] How: preferredBackend (or legacy data.backend) if valid, else index.getBackendForUrl(url), else defaultStorageMode.
 * - Contract:
 *   - INPUT: url, data (optional preferredBackend or legacy backend)
 *   - PRE: providerMap contains pinboard|local|file|sync|browser; defaultStorageMode is a valid backend
 *   - OUTPUT: provider instance
 *   - POST:
 *     - success => returned provider is from providerMap for a valid backend
 *   - DATA: storageIndex, defaultStorageMode, providerMap
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: RESOLVE_PROVIDER
 *   - 1. preferred = data.preferredBackend OR data.backend
 *   - 2. IF preferred is valid (pinboard|local|file|sync|browser): RETURN providerMap[preferred]
 *   - 3. backend = storageIndex.getBackendForUrl(url)
 *   - 4. IF backend: RETURN providerMap[backend]
 *   - 5. RETURN providerMap[defaultStorageMode]
 * 
 * ## GET_BOOKMARK_FOR_URL
 * 
 * - [IMPL-BOOKMARK_ROUTER] [ARCH-STORAGE_INDEX_AND_ROUTER] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-PER_BOOKMARK_STORAGE_BACKEND] [REQ-BROWSER_BOOKMARK_STORAGE] How: parallel best-of among pinboard/local/file/sync only (2C: exclude browser from race); consult browser only via resolveProvider when race empty or ownership already browser.
 * - Contract:
 *   - INPUT: url, title
 *   - PRE: providers for pinboard/local/file/sync/browser are wired
 *   - OUTPUT: bookmark | null
 *   - POST:
 *     - success => best non-empty candidate among pinboard/local/file/sync, or browser/default via resolveProvider when race empty; index updated when missing/differs
 *   - FAILURE_MODES: ProviderQueryFailed
 *   - DATA: storageIndex
 *   - DATA_TRANSITION: index[url] may be set to best.backend when missing or differs
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: GET_BOOKMARK_FOR_URL
 *   - 1. candidates = PARALLEL query [pinboard, local, file, sync] filtered non-empty
 *   - 2. IF candidates empty:
 *     - resolved = RESOLVE_PROVIDER(url, {})
 *     - RETURN resolved.getBookmarkForUrl(url, title)
 *   - 3. best = reduce candidates by (hasTags wins, else newer time)
 *   - 4. IF index missing or differs: storageIndex.setBackendForUrl(url, best.backend)
 *   - 5. RETURN best.bookmark
 * 
 * > Note: browser is never in the parallel race; save/delete/move use RESOLVE_PROVIDER when preferredBackend or index says browser.
 * 
 * ## SAVE_BOOKMARK
 * 
 * - [IMPL-BOOKMARK_ROUTER] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-PER_BOOKMARK_STORAGE_BACKEND] [REQ-BROWSER_BOOKMARK_STORAGE] How: resolve provider (preferredBackend may be browser); delegate save; on success update index.
 * - Contract:
 *   - INPUT: data (url, fields, optional preferredBackend)
 *   - PRE: data.url present
 *   - OUTPUT: { success: true, ... } | { error: SaveFailed }
 *   - POST:
 *     - success => provider saved and index[url] = providerBackend
 *     - error SaveFailed => index unchanged
 *   - FAILURE_MODES: SaveFailed
 *   - DATA: storageIndex
 *   - DATA_TRANSITION: on success, index[url] set to provider backend
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: SAVE_BOOKMARK
 *   - 1. provider = RESOLVE_PROVIDER(data.url, data)
 *   - 2. result = provider.saveBookmark(data)
 *   - 3. IF result.success: storageIndex.setBackendForUrl(url, providerBackend)
 *   - 4. RETURN result
 * 
 * ## DELETE_BOOKMARK
 * 
 * - [IMPL-BOOKMARK_ROUTER] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-PER_BOOKMARK_STORAGE_BACKEND] [REQ-LOCAL_BOOKMARKS_INDEX] [REQ-BROWSER_BOOKMARK_STORAGE] How: accept url string or { url, preferredBackend }; Index Delete passes preferredBackend so File/Sync/Browser rows delete even when index is wrong.
 * - Contract:
 *   - INPUT: urlOrData (string | { url, preferredBackend? })
 *   - PRE: url resolvable from input
 *   - OUTPUT: { success: true } | { error: DeleteFailed }
 *   - POST:
 *     - success => provider deleted and index url removed
 *     - error DeleteFailed => index unchanged
 *   - FAILURE_MODES: DeleteFailed
 *   - DATA: storageIndex
 *   - DATA_TRANSITION: on success, remove index[url]
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: DELETE_BOOKMARK
 *   - 1. IF urlOrData is object: data = urlOrData; url = data.url ELSE data = {}; url = urlOrData
 *   - 2. provider = RESOLVE_PROVIDER(url, data)
 *   - 3. result = provider.deleteBookmark(url)
 *   - 4. IF result.success: storageIndex.removeUrl(url)
 *   - 5. RETURN result
 * 
 * ## SAVE_TAG_DELETE_TAG
 * 
 * - [IMPL-BOOKMARK_ROUTER] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-PER_BOOKMARK_STORAGE_BACKEND] [REQ-BROWSER_BOOKMARK_STORAGE] How: resolve provider and delegate saveTag/deleteTag.
 * - Contract:
 *   - INPUT: data (url, tag fields)
 *   - PRE: data.url present
 *   - OUTPUT: provider result | { error: TagOpFailed }
 *   - POST:
 *     - success => tag op applied on resolved provider
 *   - FAILURE_MODES: TagOpFailed
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: SAVE_TAG_OR_DELETE_TAG
 *   - 1. provider = RESOLVE_PROVIDER(data.url, data)
 *   - 2. RETURN provider.saveTag(data) OR provider.deleteTag(data)
 * 
 * ## GET_RECENT_BOOKMARKS
 * 
 * - [IMPL-BOOKMARK_ROUTER] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-PER_BOOKMARK_STORAGE_BACKEND] [REQ-BROWSER_BOOKMARK_STORAGE] How: aggregate all five providers; sort by time descending; return top count.
 * - Contract:
 *   - INPUT: count
 *   - PRE: count >= 0
 *   - OUTPUT: list of bookmarks (length <= count)
 *   - POST:
 *     - success => merged from pinboard|local|file|sync|browser sorted by time DESC, sliced to count
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: GET_RECENT_BOOKMARKS
 *   - 1. merged = []
 *   - 2. FOR each provider IN [pinboard, local, file, sync, browser]: merged = merged CONCAT provider.getRecentBookmarks(count)
 *   - 3. SORT merged BY time DESCENDING
 *   - 4. RETURN merged[0..count-1]
 * 
 * ## GET_ALL_BOOKMARKS_FOR_INDEX
 * 
 * - [IMPL-BOOKMARK_ROUTER] [ARCH-STORAGE_INDEX_AND_ROUTER] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-LOCAL_BOOKMARKS_INDEX] [REQ-BROWSER_BOOKMARK_STORAGE] How: aggregate local+file+sync+browser with storage field; pinboard excluded from index aggregation.
 * - Contract:
 *   - INPUT: none
 *   - PRE: local/file/sync/browser providers available
 *   - OUTPUT: list of bookmarks with storage in { local, file, sync, browser }
 *   - POST:
 *     - success => concat of four providers sorted by time DESC; no pinboard rows
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: GET_ALL_BOOKMARKS_FOR_INDEX
 *   - 1. lists = PARALLEL [local, file, sync, browser].getAllBookmarks()
 *   - 2. RETURN concat with storage tags 'local'|'file'|'sync'|'browser', SORT BY time DESC
 * 
 * ## MOVE_BOOKMARK_TO_STORAGE
 * 
 * - [IMPL-BOOKMARK_ROUTER] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-MOVE_BOOKMARK_STORAGE_UI] [REQ-PER_BOOKMARK_STORAGE_BACKEND] [REQ-BROWSER_BOOKMARK_STORAGE] How: get from source; ensure time; save to target; delete from source; update index (targetBackend may be browser).
 * - Contract:
 *   - INPUT: url, targetBackend (pinboard|local|file|sync|browser)
 *   - PRE: targetBackend valid; source resolvable via index or defaultStorageMode
 *   - OUTPUT: { success: true } | { error: MoveFailed }
 *   - POST:
 *     - success => bookmark on target, removed from source, index[url] = targetBackend
 *     - error MoveFailed => best-effort; index may be unchanged
 *   - FAILURE_MODES: MoveFailed
 *   - DATA: storageIndex
 *   - DATA_TRANSITION: on success, index[url] = targetBackend
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: MOVE_BOOKMARK_TO_STORAGE
 *   - 1. sourceBackend = storageIndex.getBackendForUrl(url) OR defaultStorageMode
 *   - 2. sourceProvider = providerMap[sourceBackend]; targetProvider = providerMap[targetBackend]
 *   - 3. bookmark = sourceProvider.getBookmarkForUrl(url)
 *   - 4. IF bookmark lacks time: SET bookmark.time = now
 *   - 5. targetProvider.saveBookmark(bookmark)
 *   - 6. sourceProvider.deleteBookmark(url)
 *   - 7. storageIndex.setBackendForUrl(url, targetBackend)
 * 
 * === END IMPL-FULL-BLOCK: IMPL-BOOKMARK_ROUTER ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-BROWSER_BOOKMARK_SERVICE ===
 * [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE] [REQ-PER_BOOKMARK_STORAGE_BACKEND] — chrome.bookmarks provider; same duck-typed contract as LocalBookmarkService; folder path ↔ tags with Chrome root strip; URL collapse. Contract: url/bookmark/tag inputs and provider-shaped outputs; native Chrome tree as backing store.
 * 
 * ## CLEAN_URL
 * 
 * - [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE] How: Normalize URL the same way as other providers (trim, strip trailing slash).
 * - Contract:
 *   - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark object or list of bookmarks or success/error; same provider contract as LocalBookmarkService | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: chrome.bookmarks tree; Other Bookmarks folder id = "2"; Bookmarks Bar id = "1"; pin fields shared/toread/extended not stored in Chrome
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: CLEAN_URL
 *   - RETURN trim(url) without trailing slashes
 * 
 * ## LOAD_FLAT_ITEMS
 * 
 * - [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE] How: Flatten chrome.bookmarks.getTree to URL items with folderPath and parentIds; strip root segments via ids 1/2 (fallback titles).
 * - Contract:
 *   - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark object or list of bookmarks or success/error; same provider contract as LocalBookmarkService | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: chrome.bookmarks tree; Other Bookmarks folder id = "2"; Bookmarks Bar id = "1"; pin fields shared/toread/extended not stored in Chrome
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: LOAD_FLAT_ITEMS
 *   - tree = chrome.bookmarks.getTree()
 *   - items = flattenTree(tree)  # { id, url, title, dateAdded, folderPath, parentId }
 *   - FOR each item:
 *   - item.tags = folderPathToTags(item.folderPath, { stripRoots: true })
 *   - RETURN items
 * 
 * ## COLLAPSE_BY_URL
 * 
 * - [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE] How: Collapse duplicate URLs into one pin-shaped bookmark; merge tags; use earliest dateAdded for time; description from first title.
 * - Contract:
 *   - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark object or list of bookmarks or success/error; same provider contract as LocalBookmarkService | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: chrome.bookmarks tree; Other Bookmarks folder id = "2"; Bookmarks Bar id = "1"; pin fields shared/toread/extended not stored in Chrome
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: COLLAPSE_BY_URL
 *   - map = {}
 *   - FOR each item IN items WHERE item.url:
 *   - key = cleanUrl(item.url)
 *   - IF map lacks key:
 *   - map[key] = pinShape(item)  # description=title, time=ISO(dateAdded), tags=item.tags, shared='yes', toread='no', extended='', nodeIds=[item.id]
 *   - ELSE:
 *   - merge tags into map[key].tags (dedupe)
 *   - append item.id to map[key].nodeIds
 *   - IF item.dateAdded earlier: map[key].time = ISO(item.dateAdded)
 *   - RETURN values(map)
 * 
 * ## GET_BOOKMARK_FOR_URL
 * 
 * - [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE] How: Lookup by URL; return collapsed pin or empty stub.
 * - Contract:
 *   - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark object or list of bookmarks or success/error; same provider contract as LocalBookmarkService | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: chrome.bookmarks tree; Other Bookmarks folder id = "2"; Bookmarks Bar id = "1"; pin fields shared/toread/extended not stored in Chrome
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: GET_BOOKMARK_FOR_URL
 *   - items = LOAD_FLAT_ITEMS filtered by cleanUrl(url)
 *   - IF items empty: RETURN emptyStub(url, title)
 *   - collapsed = collapseByUrl(items)
 *   - RETURN collapsed[0]
 * 
 * ## GET_ALL_BOOKMARKS
 * 
 * - [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE] How: All URL bookmarks for index aggregation (router tags storage='browser').
 * - Contract:
 *   - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark object or list of bookmarks or success/error; same provider contract as LocalBookmarkService | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: chrome.bookmarks tree; Other Bookmarks folder id = "2"; Bookmarks Bar id = "1"; pin fields shared/toread/extended not stored in Chrome
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: GET_ALL_BOOKMARKS
 *   - RETURN collapseByUrl(LOAD_FLAT_ITEMS)
 * 
 * ## GET_RECENT_BOOKMARKS
 * 
 * - [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE] How: Recent by dateAdded descending.
 * - Contract:
 *   - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark object or list of bookmarks or success/error; same provider contract as LocalBookmarkService | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: chrome.bookmarks tree; Other Bookmarks folder id = "2"; Bookmarks Bar id = "1"; pin fields shared/toread/extended not stored in Chrome
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: GET_RECENT_BOOKMARKS
 *   - list = getAllBookmarks(); SORT BY time DESCENDING; RETURN list[0..count-1]
 * 
 * ## SAVE_BOOKMARK
 * 
 * - [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE] How: Ensure folder chain under Other Bookmarks (id 2) from tags; create or update all nodes for URL; ignore shared/toread/extended writes.
 * - Contract:
 *   - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark object or list of bookmarks or success/error; same provider contract as LocalBookmarkService | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: chrome.bookmarks tree; Other Bookmarks folder id = "2"; Bookmarks Bar id = "1"; pin fields shared/toread/extended not stored in Chrome
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: SAVE_BOOKMARK
 *   - key = cleanUrl(data.url)
 *   - parentId = ENSURE_TAG_FOLDERS(data.tags)  # nested under id "2"; empty tags → parent id "2"
 *   - existing = chrome.bookmarks.search({ url: data.url }) matching key
 *   - IF existing empty:
 *   - chrome.bookmarks.create({ parentId, title: data.description or '', url: data.url })
 *   - ELSE:
 *   - FOR each node IN existing:
 *   - chrome.bookmarks.update(node.id, { title: data.description or node.title })
 *   - IF node.parentId != parentId AND data.tags provided: chrome.bookmarks.move(node.id, { parentId })
 *   - How (sub-block): # shared, toread, extended: no-op (Chrome has no equivalents)
 *   - RETURN { success: true }
 * 
 * ## DELETE_BOOKMARK
 * 
 * - [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE] How: Remove every Chrome node whose URL matches.
 * - Contract:
 *   - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark object or list of bookmarks or success/error; same provider contract as LocalBookmarkService | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: chrome.bookmarks tree; Other Bookmarks folder id = "2"; Bookmarks Bar id = "1"; pin fields shared/toread/extended not stored in Chrome
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: DELETE_BOOKMARK
 *   - key = cleanUrl(url)
 *   - nodes = search matching key
 *   - FOR each node: chrome.bookmarks.remove(node.id)
 *   - RETURN { success: true }
 * 
 * ## SAVE_TAG
 * 
 * - [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE] How: Tag ops mutate folder placement via saveBookmark with updated tags.
 * - Contract:
 *   - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark object or list of bookmarks or success/error; same provider contract as LocalBookmarkService | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: chrome.bookmarks tree; Other Bookmarks folder id = "2"; Bookmarks Bar id = "1"; pin fields shared/toread/extended not stored in Chrome
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: SAVE_TAG
 *   - bookmark = getBookmarkForUrl(tagData.url)
 *   - UPDATE bookmark.tags per tagData
 *   - RETURN saveBookmark(bookmark)
 * 
 * ## TEST_CONNECTION
 * 
 * - [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE] How: Always available when bookmarks permission present.
 * - Contract:
 *   - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark object or list of bookmarks or success/error; same provider contract as LocalBookmarkService | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: chrome.bookmarks tree; Other Bookmarks folder id = "2"; Bookmarks Bar id = "1"; pin fields shared/toread/extended not stored in Chrome
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: TEST_CONNECTION
 *   - RETURN true
 * 
 * ## ENSURE_TAG_FOLDERS
 * 
 * - [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE] How: Get-or-create nested folders under Other Bookmarks for each tag segment; return leaf folder id.
 * - Contract:
 *   - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark object or list of bookmarks or success/error; same provider contract as LocalBookmarkService | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: chrome.bookmarks tree; Other Bookmarks folder id = "2"; Bookmarks Bar id = "1"; pin fields shared/toread/extended not stored in Chrome
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: ENSURE_TAG_FOLDERS
 *   - parentId = "2"  # Other Bookmarks
 *   - FOR each tag IN tags:
 *   - child = find folder under parentId titled tag OR create folder
 *   - parentId = child.id
 *   - RETURN parentId
 * 
 * === END IMPL-FULL-BLOCK: IMPL-BROWSER_BOOKMARK_SERVICE ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-MOVE_BOOKMARK_UI ===
 * [IMPL-MOVE_BOOKMARK_UI] [ARCH-MOVE_BOOKMARK_UI] [REQ-MOVE_BOOKMARK_STORAGE_UI] [REQ-STORAGE_MODE_DEFAULT] — Popup Save to five buttons; load backend, move on click, preferredBackend on save. Contract: URL and bookmark and actions; highlighted button and move/save requests.
 * 
 * ## MAIN
 * 
 * - [IMPL-MOVE_BOOKMARK_UI] [ARCH-MOVE_BOOKMARK_UI] [REQ-MOVE_BOOKMARK_STORAGE_UI] [REQ-STORAGE_MODE_DEFAULT] How: Logical block for IMPL-MOVE_BOOKMARK_UI.
 * - Contract:
 *   - INPUT: currentUrl (tab), currentPin (current bookmark if any), user action (select storage button, save)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: highlighted storage button; move request; save request with preferredBackend | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: storage section with five buttons (Pinboard, Local, File, Sync, Browser); one has aria-pressed="true"
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: MAIN
 *   - How (sub-block): Set highlighted button from getStorageBackendForUrl or default; update Pinboard enabled.
 *   - 1. ON popup load (or bookmark data load):
 *   - 2.   IF currentPin exists: backend = send getStorageBackendForUrl(currentUrl)
 *   - 3.   ELSE: backend = defaultStorageMode
 *   - 4.   SET highlighted button to backend (data-backend attribute)
 *   - 5.   updateStoragePinboardEnabled(hasApiToken)
 *   - How (sub-block): Send move; use inner result; refresh and update UI on success.
 *   - 6. ON storage button click (user selects different backend):
 *   - 7.   url = currentPin?.url || currentTab?.url
 *   - 8.   SEND moveBookmarkToStorage(url, targetBackend)
 *   - 9.   result = response?.data ?? response   // inner result (IMPL-MOVE_BOOKMARK_RESPONSE_AND_URL)
 *   - 10.   IF result.success: refresh bookmark data; update highlighted button
 *   - 11.   ELSE: show error from result
 *   - How (sub-block): Set preferredBackend from selected button; send saveBookmark so router uses highlighted storage.
 *   - 12. ON save (createBookmark, addTagsToBookmark, toggle private, toggle read-later):
 *   - 13.   data.preferredBackend = getSelectedStorageBackend()   // button with aria-pressed="true"
 *   - 14.   SEND saveBookmark(data)   // router uses preferredBackend
 * 
 * === END IMPL-FULL-BLOCK: IMPL-MOVE_BOOKMARK_UI ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-URL_TAGS_DISPLAY ===
 * [IMPL-URL_TAGS_DISPLAY] [ARCH-URL_TAGS_DISPLAY] [REQ-URL_TAGS_DISPLAY] [REQ-BADGE_INDICATORS] [REQ-PER_BOOKMARK_STORAGE_BACKEND] — normalizeBookmarkForDisplay, getBookmarkForDisplay, getTagsForUrl, getBadgeDisplayValue; handler and popup use router and re-fetch. Contract: bookmark or provider+url; normalized bookmark, tags, or badge value.
 * 
 * ## NORMALIZE_BOOKMARK_FOR_DISPLAY
 * 
 * - [IMPL-URL_TAGS_DISPLAY] [ARCH-URL_TAGS_DISPLAY] [REQ-URL_TAGS_DISPLAY] [REQ-BADGE_INDICATORS] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Implements normalizeBookmarkForDisplay(bookmark) behavior for IMPL-URL_TAGS_DISPLAY.
 * - Contract:
 *   - INPUT: bookmark (raw from provider), provider + url + title (for getBookmarkForDisplay), provider + url (for getTagsForUrl)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: normalized bookmark (tags array), tags array, badge display value (text, tagCount, flags)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: single module url-tags-manager; used by message-handler, service-worker, badge-manager, popup, bookmark-router
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: NORMALIZE_BOOKMARK_FOR_DISPLAY
 *   - IF bookmark null: RETURN null or empty shape
 *   - tags = bookmark.tags IF array ELSE (bookmark.tags split by spaces or [])
 *   - RETURN { ...bookmark, tags, ...requiredDefaults }
 *   - How (sub-block): Get raw from provider and normalize; caller sets needsAuth.
 * 
 * ## GET_BOOKMARK_FOR_DISPLAY
 * 
 * - [IMPL-URL_TAGS_DISPLAY] [ARCH-URL_TAGS_DISPLAY] [REQ-URL_TAGS_DISPLAY] [REQ-BADGE_INDICATORS] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Implements getBookmarkForDisplay(provider, url, title) behavior for IMPL-URL_TAGS_DISPLAY.
 * - Contract:
 *   - INPUT: bookmark (raw from provider), provider + url + title (for getBookmarkForDisplay), provider + url (for getTagsForUrl)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: normalized bookmark (tags array), tags array, badge display value (text, tagCount, flags)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: single module url-tags-manager; used by message-handler, service-worker, badge-manager, popup, bookmark-router
 *   - EFFECTS: Async
 *   - TERMINATION: total
 * - PROCEDURE: GET_BOOKMARK_FOR_DISPLAY
 *   - raw = AWAIT provider.getBookmarkForUrl(url)
 *   - RETURN normalizeBookmarkForDisplay(raw); caller sets needsAuth when !hasAuth
 *   - How (sub-block): Get bookmark for url and return tags array.
 * 
 * ## GET_TAGS_FOR_URL
 * 
 * - [IMPL-URL_TAGS_DISPLAY] [ARCH-URL_TAGS_DISPLAY] [REQ-URL_TAGS_DISPLAY] [REQ-BADGE_INDICATORS] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Implements getTagsForUrl(provider, url) behavior for IMPL-URL_TAGS_DISPLAY.
 * - Contract:
 *   - INPUT: bookmark (raw from provider), provider + url + title (for getBookmarkForDisplay), provider + url (for getTagsForUrl)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: normalized bookmark (tags array), tags array, badge display value (text, tagCount, flags)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: single module url-tags-manager; used by message-handler, service-worker, badge-manager, popup, bookmark-router
 *   - EFFECTS: Async
 *   - TERMINATION: total
 * - PROCEDURE: GET_TAGS_FOR_URL
 *   - bookmark = AWAIT getBookmarkForDisplay(provider, url, null)
 *   - RETURN bookmark?.tags ?? []
 *   - How (sub-block): Normalize and return text, tagCount, isPrivate, isToRead, isBookmarked, title.
 * 
 * ## GET_BADGE_DISPLAY_VALUE
 * 
 * - [IMPL-URL_TAGS_DISPLAY] [ARCH-URL_TAGS_DISPLAY] [REQ-URL_TAGS_DISPLAY] [REQ-BADGE_INDICATORS] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Implements getBadgeDisplayValue(bookmark, config) behavior for IMPL-URL_TAGS_DISPLAY.
 * - Contract:
 *   - INPUT: bookmark (raw from provider), provider + url + title (for getBookmarkForDisplay), provider + url (for getTagsForUrl)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: normalized bookmark (tags array), tags array, badge display value (text, tagCount, flags)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: single module url-tags-manager; used by message-handler, service-worker, badge-manager, popup, bookmark-router
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Http, State
 *   - TERMINATION: total
 * - PROCEDURE: GET_BADGE_DISPLAY_VALUE
 *   - normalized = normalizeBookmarkForDisplay(bookmark)
 *   - RETURN { text, tagCount, isPrivate, isToRead, isBookmarked, title }
 *   - How (sub-block): Handler and popup and router usage (same IMPL set).
 *   - 1. Message handler: handleGetCurrentBookmark always via getBookmarkForDisplay(router)
 *   - 2. Message handler: handleGetTagsForUrl returns getTagsForUrl
 *   - 3. Popup: getBookmarkData null only when blocked; re-fetch tags before add/remove
 *   - 4. Router: _hasTags/_isEmptyBookmark use normalizeBookmarkForDisplay
 * 
 * === END IMPL-FULL-BLOCK: IMPL-URL_TAGS_DISPLAY ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-MOVE_BOOKMARK_RESPONSE_AND_URL ===
 * [IMPL-MOVE_BOOKMARK_RESPONSE_AND_URL] [REQ-MOVE_BOOKMARK_STORAGE_UI] — Popup uses response.data for success/error; move uses currentPin.url; router sets time when missing. Contract: response and currentPin/currentTab; UI and move request and router behavior.
 * 
 * ## MAIN
 * 
 * - [IMPL-MOVE_BOOKMARK_RESPONSE_AND_URL] [REQ-MOVE_BOOKMARK_STORAGE_UI] How: Logical block for IMPL-MOVE_BOOKMARK_RESPONSE_AND_URL.
 * - Contract:
 *   - INPUT: response (from moveBookmarkToStorage message), currentPin (bookmark), currentTab (tab URL)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: correct success/error UI; move request with correct URL; router allows no-time bookmark | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: service worker returns { success: true, data: routerResult }; routerResult = { success, message?, ... }
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: MAIN
 *   - How (sub-block): Use inner result for success/error and refresh.
 *   - 1. Popup — unwrap inner result:
 *   - 2.   result = response?.data ?? response
 *   - 3.   IF result?.success: show success; refresh bookmark; update storage UI
 *   - 4.   ELSE: show error (result?.message or generic)
 *   - How (sub-block): Prefer currentPin.url so key matches storage.
 *   - 5. Popup — URL for move:
 *   - 6.   url = currentPin?.url || currentTab?.url
 *   - 7.   SEND moveBookmarkToStorage(url, targetBackend)   // same key as storage, avoids tab-URL mismatch
 *   - How (sub-block): Set time when missing; save to target, delete from source, update index.
 *   - 8. Router — move when bookmark has no time:
 *   - 9.   bookmark = sourceProvider.getBookmarkForUrl(url)
 *   - 10.   IF bookmark has url and (time missing or invalid):
 *   - 11.     toSave = { ...bookmark, time: now ISO }
 *   - 12.   ELSE: toSave = bookmark
 *   - 13.   targetProvider.saveBookmark(toSave)
 *   - 14.   sourceProvider.deleteBookmark(url)
 *   - 15.   storageIndex.setBackendForUrl(url, targetBackend)
 * 
 * === END IMPL-FULL-BLOCK: IMPL-MOVE_BOOKMARK_RESPONSE_AND_URL ===
 */
import { BookmarkRouter } from '../../src/features/storage/bookmark-router.js'
import { StorageIndex } from '../../src/features/storage/storage-index.js'

describe('BookmarkRouter [IMPL-BOOKMARK_ROUTER] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-PER_BOOKMARK_STORAGE_BACKEND]', () => {
  let router
  let pinboard
  let local
  let file
  let sync
  let browser
  let storageIndex
  let defaultMode

  beforeEach(() => {
    const empty = { url: '', description: '', extended: '', tags: [], time: '', shared: 'yes', toread: 'no', hash: '' }
    const makeProvider = (name) => {
      const store = {}
      return {
        getBookmarkForUrl: jest.fn(async (url) => {
          const u = url.replace(/\/+$/, '')
          return store[u] ? { ...store[u] } : { ...empty, url: u }
        }),
        getRecentBookmarks: jest.fn(async () => Object.values(store).sort((a, b) => (b.time || '').localeCompare(a.time || ''))),
        getAllBookmarks: jest.fn(async () => Object.values(store).sort((a, b) => (b.time || '').localeCompare(a.time || ''))),
        saveBookmark: jest.fn(async (data) => {
          const u = (data.url || '').replace(/\/+$/, '')
          store[u] = { ...data, url: u, time: data.time || store[u]?.time || new Date().toISOString() }
          return { success: true, code: 'done', message: 'Operation completed' }
        }),
        deleteBookmark: jest.fn(async (url) => {
          const u = url.replace(/\/+$/, '')
          delete store[u]
          return { success: true, code: 'done', message: 'Operation completed' }
        }),
        saveTag: jest.fn(async (data) => ({ success: true })),
        deleteTag: jest.fn(async () => ({ success: true })),
        testConnection: jest.fn(async () => true)
      }
    }
    pinboard = makeProvider('pinboard')
    local = makeProvider('local')
    file = makeProvider('file')
    sync = makeProvider('sync')
    browser = makeProvider('browser')

    let stored = {}
    global.chrome.storage.local.get.mockImplementation(async (key) => {
      if (key === 'hoverboard_storage_index') {
        return { hoverboard_storage_index: { ...stored } }
      }
      return {}
    })
    global.chrome.storage.local.set.mockImplementation((obj) => {
      if (obj.hoverboard_storage_index !== undefined) {
        stored = { ...obj.hoverboard_storage_index }
      }
      return Promise.resolve()
    })
    storageIndex = new StorageIndex()
    defaultMode = jest.fn().mockResolvedValue('local')
    router = new BookmarkRouter(pinboard, local, file, sync, storageIndex, defaultMode, browser)
  })

  test('getBookmarkForUrl uses default provider when URL not in index [REQ-PER_BOOKMARK_STORAGE_BACKEND]', async () => {
    await router.getBookmarkForUrl('https://example.com/new')
    expect(defaultMode).toHaveBeenCalled()
    expect(local.getBookmarkForUrl).toHaveBeenCalledWith('https://example.com/new', '')
    expect(file.getBookmarkForUrl).toHaveBeenCalledWith('https://example.com/new', '')
    expect(sync.getBookmarkForUrl).toHaveBeenCalledWith('https://example.com/new', '')
  })

  test('getBookmarkForUrl uses index when URL in index [IMPL-BOOKMARK_ROUTER]', async () => {
    await storageIndex.setBackendForUrl('https://example.com/p', 'pinboard')
    await pinboard.saveBookmark({ url: 'https://example.com/p', description: 'Pin', time: '2026-02-14T12:00:00.000Z' })
    const b = await router.getBookmarkForUrl('https://example.com/p')
    expect(pinboard.getBookmarkForUrl).toHaveBeenCalled()
    expect(b.description).toBe('Pin')
  })

  // [IMPL-BOOKMARK_ROUTER] [REQ-URL_TAGS_DISPLAY] Best candidate: prefer backend with tags, then most recent
  test('getBookmarkForUrl prefers candidate with tags over newer without tags and updates index [IMPL-BOOKMARK_ROUTER]', async () => {
    const url = 'https://example.com/best'
    await local.saveBookmark({
      url,
      description: 'With tags',
      tags: ['a', 'b'],
      time: '2026-02-14T10:00:00.000Z'
    })
    await file.saveBookmark({
      url,
      description: 'Newer no tags',
      time: '2026-02-14T12:00:00.000Z'
    })
    const b = await router.getBookmarkForUrl(url)
    expect(b.description).toBe('With tags')
    expect(b.tags).toEqual(['a', 'b'])
    const backend = await storageIndex.getBackendForUrl(url)
    expect(backend).toBe('local')
  })

  test('getBookmarkForUrl prefers newer time when both candidates have tags [IMPL-BOOKMARK_ROUTER]', async () => {
    const url = 'https://example.com/both'
    await local.saveBookmark({
      url,
      description: 'Older',
      tags: ['x'],
      time: '2026-02-14T10:00:00.000Z'
    })
    await file.saveBookmark({
      url,
      description: 'Newer',
      tags: ['y'],
      time: '2026-02-14T12:00:00.000Z'
    })
    const b = await router.getBookmarkForUrl(url)
    expect(b.description).toBe('Newer')
    expect(b.time).toBe('2026-02-14T12:00:00.000Z')
    const backend = await storageIndex.getBackendForUrl(url)
    expect(backend).toBe('file')
  })

  test('saveBookmark updates index and uses default when new [IMPL-BOOKMARK_ROUTER]', async () => {
    const result = await router.saveBookmark({
      url: 'https://example.com/save',
      description: 'Saved',
      tags: ['x']
    })
    expect(result.success).toBe(true)
    expect(local.saveBookmark).toHaveBeenCalled()
    const backend = await storageIndex.getBackendForUrl('https://example.com/save')
    expect(backend).toBe('local')
  })

  test('deleteBookmark removes from index [REQ-PER_BOOKMARK_STORAGE_BACKEND]', async () => {
    await storageIndex.setBackendForUrl('https://example.com/d', 'local')
    await local.saveBookmark({ url: 'https://example.com/d', description: 'D' })
    await router.deleteBookmark('https://example.com/d')
    expect(local.deleteBookmark).toHaveBeenCalledWith('https://example.com/d')
    const backend = await storageIndex.getBackendForUrl('https://example.com/d')
    expect(backend).toBe(null)
  })

  // [REQ-LOCAL_BOOKMARKS_INDEX] [IMPL-BOOKMARK_ROUTER] Capture: URL-only delete with wrong index leaves File bookmark
  test('deleteBookmark without preferredBackend leaves File when index says local [REQ-LOCAL_BOOKMARKS_INDEX]', async () => {
    const url = 'https://example.com/file-only'
    await file.saveBookmark({ url, description: 'In file', time: '2026-02-14T12:00:00.000Z' })
    await storageIndex.setBackendForUrl(url, 'local')
    const result = await router.deleteBookmark(url)
    expect(result.success).toBe(true)
    expect(local.deleteBookmark).toHaveBeenCalledWith(url)
    expect(file.deleteBookmark).not.toHaveBeenCalled()
    const remaining = await file.getAllBookmarks()
    expect(remaining.some(b => b.url === url)).toBe(true)
  })

  // [REQ-LOCAL_BOOKMARKS_INDEX] [IMPL-BOOKMARK_ROUTER] preferredBackend overrides index so Index Delete hits File
  test('deleteBookmark with preferredBackend file removes File bookmark despite local index [REQ-LOCAL_BOOKMARKS_INDEX] [IMPL-BOOKMARK_ROUTER]', async () => {
    const url = 'https://example.com/file-pref'
    await file.saveBookmark({ url, description: 'In file', time: '2026-02-14T12:00:00.000Z' })
    await storageIndex.setBackendForUrl(url, 'local')
    const result = await router.deleteBookmark({ url, preferredBackend: 'file' })
    expect(result.success).toBe(true)
    expect(file.deleteBookmark).toHaveBeenCalledWith(url)
    expect(local.deleteBookmark).not.toHaveBeenCalled()
    const remaining = await file.getAllBookmarks()
    expect(remaining.some(b => b.url === url)).toBe(false)
    const backend = await storageIndex.getBackendForUrl(url)
    expect(backend).toBe(null)
  })

  test('getRecentBookmarks aggregates all five providers including browser [IMPL-BOOKMARK_ROUTER] [REQ-BROWSER_BOOKMARK_STORAGE]', async () => {
    await pinboard.saveBookmark({ url: 'https://p.com', description: 'P', time: '2026-02-14T10:00:00.000Z' })
    await local.saveBookmark({ url: 'https://l.com', description: 'L', time: '2026-02-14T11:00:00.000Z' })
    await file.saveBookmark({ url: 'https://f.com', description: 'F', time: '2026-02-14T12:00:00.000Z' })
    await sync.saveBookmark({ url: 'https://s.com', description: 'S', time: '2026-02-14T13:00:00.000Z' })
    await browser.saveBookmark({ url: 'https://b.com', description: 'B', time: '2026-02-14T14:00:00.000Z' })
    const list = await router.getRecentBookmarks(10)
    expect(list.length).toBe(5)
    expect(list.some(b => b.url === 'https://b.com')).toBe(true)
    expect(pinboard.getRecentBookmarks).toHaveBeenCalled()
    expect(local.getRecentBookmarks).toHaveBeenCalled()
    expect(file.getRecentBookmarks).toHaveBeenCalled()
    expect(sync.getRecentBookmarks).toHaveBeenCalled()
    expect(browser.getRecentBookmarks).toHaveBeenCalled()
  })

  test('getStorageBackendForUrl returns index or default', async () => {
    const b1 = await router.getStorageBackendForUrl('https://example.com/unknown')
    expect(b1).toBe('local')
    await storageIndex.setBackendForUrl('https://example.com/k', 'file')
    const b2 = await router.getStorageBackendForUrl('https://example.com/k')
    expect(b2).toBe('file')
  })

  test('moveBookmarkToStorage copies to target, deletes from source, updates index [REQ-PER_BOOKMARK_STORAGE_BACKEND]', async () => {
    await storageIndex.setBackendForUrl('https://example.com/m', 'local')
    await local.saveBookmark({
      url: 'https://example.com/m',
      description: 'Move me',
      tags: ['t'],
      time: '2026-02-14T12:00:00.000Z'
    })
    const result = await router.moveBookmarkToStorage('https://example.com/m', 'file')
    expect(result.success).toBe(true)
    expect(file.saveBookmark).toHaveBeenCalledWith(expect.objectContaining({ url: 'https://example.com/m', description: 'Move me' }))
    const savedToFile = file.saveBookmark.mock.calls[0][0]
    expect(savedToFile.time).toBeDefined()
    expect(savedToFile.updated_at).toBeDefined()
    expect(typeof savedToFile.updated_at).toBe('string')
    expect(local.deleteBookmark).toHaveBeenCalledWith('https://example.com/m')
    const backend = await storageIndex.getBackendForUrl('https://example.com/m')
    expect(backend).toBe('file')
  })

  test('moveBookmarkToStorage passes time and updated_at to target saveBookmark [REQ-BOOKMARK_CREATE_UPDATE_TIMES]', async () => {
    await storageIndex.setBackendForUrl('https://example.com/ts', 'local')
    await local.saveBookmark({
      url: 'https://example.com/ts',
      description: 'To sync',
      tags: ['a'],
      time: '2026-02-14T09:00:00.000Z'
    })
    const result = await router.moveBookmarkToStorage('https://example.com/ts', 'sync')
    expect(result.success).toBe(true)
    expect(sync.saveBookmark).toHaveBeenCalled()
    const payload = sync.saveBookmark.mock.calls[0][0]
    expect(payload.url).toBe('https://example.com/ts')
    expect(payload.time).toBe('2026-02-14T09:00:00.000Z')
    expect(payload.updated_at).toBeDefined()
    expect(typeof payload.updated_at).toBe('string')
  })

  test('moveBookmarkToStorage no-op when already in target', async () => {
    await storageIndex.setBackendForUrl('https://example.com/same', 'local')
    const result = await router.moveBookmarkToStorage('https://example.com/same', 'local')
    expect(result.success).toBe(true)
    expect(result.message).toMatch(/Already/)
    expect(local.saveBookmark).not.toHaveBeenCalled()
  })

  // [REQ-MOVE_BOOKMARK_STORAGE_UI] File ↔ browser toggle: explicit file → local move
  test('moveBookmarkToStorage file to local updates index and providers [REQ-MOVE_BOOKMARK_STORAGE_UI]', async () => {
    await storageIndex.setBackendForUrl('https://example.com/fl', 'file')
    await file.saveBookmark({
      url: 'https://example.com/fl',
      description: 'From file',
      tags: ['a'],
      time: '2026-02-14T13:00:00.000Z'
    })
    const result = await router.moveBookmarkToStorage('https://example.com/fl', 'local')
    expect(result.success).toBe(true)
    expect(local.saveBookmark).toHaveBeenCalledWith(expect.objectContaining({ url: 'https://example.com/fl', description: 'From file' }))
    expect(file.deleteBookmark).toHaveBeenCalledWith('https://example.com/fl')
    const backend = await storageIndex.getBackendForUrl('https://example.com/fl')
    expect(backend).toBe('local')
  })

  test('getAllBookmarksForIndex includes local, file, sync, and browser [REQ-LOCAL_BOOKMARKS_INDEX] [REQ-BROWSER_BOOKMARK_STORAGE]', async () => {
    await local.saveBookmark({ url: 'https://l.com', description: 'L', time: '2026-02-14T11:00:00.000Z' })
    await file.saveBookmark({ url: 'https://f.com', description: 'F', time: '2026-02-14T12:00:00.000Z' })
    await sync.saveBookmark({ url: 'https://s.com', description: 'S', time: '2026-02-14T13:00:00.000Z' })
    await browser.saveBookmark({ url: 'https://b.com', description: 'B', time: '2026-02-14T14:00:00.000Z', tags: ['chrome'] })
    const list = await router.getAllBookmarksForIndex()
    expect(list.some(b => b.storage === 'local')).toBe(true)
    expect(list.some(b => b.storage === 'file')).toBe(true)
    expect(list.some(b => b.storage === 'sync')).toBe(true)
    expect(list.some(b => b.storage === 'browser')).toBe(true)
    expect(local.getAllBookmarks).toHaveBeenCalled()
    expect(file.getAllBookmarks).toHaveBeenCalled()
    expect(sync.getAllBookmarks).toHaveBeenCalled()
    expect(browser.getAllBookmarks).toHaveBeenCalled()
  })

  // [REQ-BROWSER_BOOKMARK_STORAGE] 2C: browser folder-tags must not steal ownership when local has tags
  test('getBookmarkForUrl prefers local over browser when both have tags (2C) [REQ-BROWSER_BOOKMARK_STORAGE]', async () => {
    const url = 'https://example.com/2c'
    await local.saveBookmark({
      url,
      description: 'Local',
      tags: ['hoverboard'],
      time: '2026-02-14T10:00:00.000Z'
    })
    await browser.saveBookmark({
      url,
      description: 'Chrome',
      tags: ['folder_tag'],
      time: '2026-02-14T12:00:00.000Z'
    })
    const b = await router.getBookmarkForUrl(url)
    expect(b.description).toBe('Local')
    expect(browser.getBookmarkForUrl).not.toHaveBeenCalled()
    const backend = await storageIndex.getBackendForUrl(url)
    expect(backend).toBe('local')
  })

  test('getBookmarkForUrl returns browser when only Chrome has bookmark [REQ-BROWSER_BOOKMARK_STORAGE]', async () => {
    const url = 'https://example.com/browser-only'
    await browser.saveBookmark({
      url,
      description: 'Chrome only',
      tags: ['work'],
      time: '2026-02-14T12:00:00.000Z'
    })
    await storageIndex.setBackendForUrl(url, 'browser')
    const b = await router.getBookmarkForUrl(url)
    expect(b.description).toBe('Chrome only')
    expect(browser.getBookmarkForUrl).toHaveBeenCalled()
  })

  test('saveBookmark and moveBookmarkToStorage accept preferredBackend browser [REQ-BROWSER_BOOKMARK_STORAGE]', async () => {
    const url = 'https://example.com/to-browser'
    await local.saveBookmark({ url, description: 'Move', tags: ['t'], time: '2026-02-14T12:00:00.000Z' })
    await storageIndex.setBackendForUrl(url, 'local')
    const move = await router.moveBookmarkToStorage(url, 'browser')
    expect(move.success).toBe(true)
    expect(browser.saveBookmark).toHaveBeenCalled()
    expect(local.deleteBookmark).toHaveBeenCalledWith(url)
    expect(await storageIndex.getBackendForUrl(url)).toBe('browser')

    const save = await router.saveBookmark({
      url: 'https://example.com/save-browser',
      description: 'Saved',
      preferredBackend: 'browser'
    })
    expect(save.success).toBe(true)
    expect(browser.saveBookmark).toHaveBeenCalled()
  })

  // [IMPL-MOVE_BOOKMARK_RESPONSE_AND_URL] Move succeeds when source bookmark has url but no time
  test('moveBookmarkToStorage succeeds when bookmark has url but no time [IMPL-MOVE_BOOKMARK_RESPONSE_AND_URL]', async () => {
    await storageIndex.setBackendForUrl('https://example.com/notime', 'local')
    await local.saveBookmark({
      url: 'https://example.com/notime',
      description: 'No time',
      tags: [],
      time: ''
    })
    const result = await router.moveBookmarkToStorage('https://example.com/notime', 'file')
    expect(result.success).toBe(true)
    expect(file.saveBookmark).toHaveBeenCalledWith(expect.objectContaining({
      url: 'https://example.com/notime',
      description: 'No time'
    }))
    const saved = file.saveBookmark.mock.calls[0][0]
    expect(saved.time).toBeDefined()
    expect(typeof saved.time).toBe('string')
    expect(saved.updated_at).toBeDefined()
    expect(typeof saved.updated_at).toBe('string')
    expect(local.deleteBookmark).toHaveBeenCalledWith('https://example.com/notime')
    const backend = await storageIndex.getBackendForUrl('https://example.com/notime')
    expect(backend).toBe('file')
  })
})
