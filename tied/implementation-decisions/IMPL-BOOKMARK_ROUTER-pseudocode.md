# [IMPL-BOOKMARK_ROUTER] [ARCH-STORAGE_INDEX_AND_ROUTER] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-PER_BOOKMARK_STORAGE_BACKEND] [REQ-STORAGE_MODE_DEFAULT] [REQ-MOVE_BOOKMARK_STORAGE_UI] [REQ-LOCAL_BOOKMARKS_INDEX] [REQ-BROWSER_BOOKMARK_STORAGE] — Delegate by URL via storage index; preferredBackend for save/delete; aggregate getRecentBookmarks; moveBookmarkToStorage; fifth provider browser with 2C getBookmarkForUrl rule.

## RESOLVE_PROVIDER

- [IMPL-BOOKMARK_ROUTER] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-PER_BOOKMARK_STORAGE_BACKEND] [REQ-STORAGE_MODE_DEFAULT] [REQ-BROWSER_BOOKMARK_STORAGE] How: preferredBackend (or legacy data.backend) if valid, else index.getBackendForUrl(url), else defaultStorageMode.
- Contract:
  - INPUT: url, data (optional preferredBackend or legacy backend)
  - PRE: providerMap contains pinboard|local|file|sync|browser; defaultStorageMode is a valid backend
  - OUTPUT: provider instance
  - POST:
    - success => returned provider is from providerMap for a valid backend
  - DATA: storageIndex, defaultStorageMode, providerMap
  - EFFECTS: pure
  - TERMINATION: total
- PROCEDURE: RESOLVE_PROVIDER
  - 1. preferred = data.preferredBackend OR data.backend
  - 2. IF preferred is valid (pinboard|local|file|sync|browser): RETURN providerMap[preferred]
  - 3. backend = storageIndex.getBackendForUrl(url)
  - 4. IF backend: RETURN providerMap[backend]
  - 5. RETURN providerMap[defaultStorageMode]

## GET_BOOKMARK_FOR_URL

- [IMPL-BOOKMARK_ROUTER] [ARCH-STORAGE_INDEX_AND_ROUTER] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-PER_BOOKMARK_STORAGE_BACKEND] [REQ-BROWSER_BOOKMARK_STORAGE] How: parallel best-of among pinboard/local/file/sync only (2C: exclude browser from race); consult browser only via resolveProvider when race empty or ownership already browser.
- Contract:
  - INPUT: url, title
  - PRE: providers for pinboard/local/file/sync/browser are wired
  - OUTPUT: bookmark | null
  - POST:
    - success => best non-empty candidate among pinboard/local/file/sync, or browser/default via resolveProvider when race empty; index updated when missing/differs
  - FAILURE_MODES: ProviderQueryFailed
  - DATA: storageIndex
  - DATA_TRANSITION: index[url] may be set to best.backend when missing or differs
  - EFFECTS: Async, IO, State
  - TERMINATION: total
- PROCEDURE: GET_BOOKMARK_FOR_URL
  - 1. candidates = PARALLEL query [pinboard, local, file, sync] filtered non-empty
  - 2. IF candidates empty:
    - resolved = RESOLVE_PROVIDER(url, {})
    - RETURN resolved.getBookmarkForUrl(url, title)
  - 3. best = reduce candidates by (hasTags wins, else newer time)
  - 4. IF index missing or differs: storageIndex.setBackendForUrl(url, best.backend)
  - 5. RETURN best.bookmark

> Note: browser is never in the parallel race; save/delete/move use RESOLVE_PROVIDER when preferredBackend or index says browser.

## SAVE_BOOKMARK

- [IMPL-BOOKMARK_ROUTER] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-PER_BOOKMARK_STORAGE_BACKEND] [REQ-BROWSER_BOOKMARK_STORAGE] How: resolve provider (preferredBackend may be browser); delegate save; on success update index.
- Contract:
  - INPUT: data (url, fields, optional preferredBackend)
  - PRE: data.url present
  - OUTPUT: { success: true, ... } | { error: SaveFailed }
  - POST:
    - success => provider saved and index[url] = providerBackend
    - error SaveFailed => index unchanged
  - FAILURE_MODES: SaveFailed
  - DATA: storageIndex
  - DATA_TRANSITION: on success, index[url] set to provider backend
  - EFFECTS: Async, IO, State
  - TERMINATION: total
- PROCEDURE: SAVE_BOOKMARK
  - 1. provider = RESOLVE_PROVIDER(data.url, data)
  - 2. result = provider.saveBookmark(data)
  - 3. IF result.success: storageIndex.setBackendForUrl(url, providerBackend)
  - 4. RETURN result

## DELETE_BOOKMARK

- [IMPL-BOOKMARK_ROUTER] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-PER_BOOKMARK_STORAGE_BACKEND] [REQ-LOCAL_BOOKMARKS_INDEX] [REQ-BROWSER_BOOKMARK_STORAGE] How: accept url string or { url, preferredBackend }; Index Delete passes preferredBackend so File/Sync/Browser rows delete even when index is wrong.
- Contract:
  - INPUT: urlOrData (string | { url, preferredBackend? })
  - PRE: url resolvable from input
  - OUTPUT: { success: true } | { error: DeleteFailed }
  - POST:
    - success => provider deleted and index url removed
    - error DeleteFailed => index unchanged
  - FAILURE_MODES: DeleteFailed
  - DATA: storageIndex
  - DATA_TRANSITION: on success, remove index[url]
  - EFFECTS: Async, IO, State
  - TERMINATION: total
- PROCEDURE: DELETE_BOOKMARK
  - 1. IF urlOrData is object: data = urlOrData; url = data.url ELSE data = {}; url = urlOrData
  - 2. provider = RESOLVE_PROVIDER(url, data)
  - 3. result = provider.deleteBookmark(url)
  - 4. IF result.success: storageIndex.removeUrl(url)
  - 5. RETURN result

## SAVE_TAG_DELETE_TAG

- [IMPL-BOOKMARK_ROUTER] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-PER_BOOKMARK_STORAGE_BACKEND] [REQ-BROWSER_BOOKMARK_STORAGE] How: resolve provider and delegate saveTag/deleteTag.
- Contract:
  - INPUT: data (url, tag fields)
  - PRE: data.url present
  - OUTPUT: provider result | { error: TagOpFailed }
  - POST:
    - success => tag op applied on resolved provider
  - FAILURE_MODES: TagOpFailed
  - EFFECTS: Async, IO, State
  - TERMINATION: total
- PROCEDURE: SAVE_TAG_OR_DELETE_TAG
  - 1. provider = RESOLVE_PROVIDER(data.url, data)
  - 2. RETURN provider.saveTag(data) OR provider.deleteTag(data)

## GET_RECENT_BOOKMARKS

- [IMPL-BOOKMARK_ROUTER] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-PER_BOOKMARK_STORAGE_BACKEND] [REQ-BROWSER_BOOKMARK_STORAGE] How: aggregate all five providers; sort by time descending; return top count.
- Contract:
  - INPUT: count
  - PRE: count >= 0
  - OUTPUT: list of bookmarks (length <= count)
  - POST:
    - success => merged from pinboard|local|file|sync|browser sorted by time DESC, sliced to count
  - EFFECTS: Async, IO
  - TERMINATION: total
- PROCEDURE: GET_RECENT_BOOKMARKS
  - 1. merged = []
  - 2. FOR each provider IN [pinboard, local, file, sync, browser]: merged = merged CONCAT provider.getRecentBookmarks(count)
  - 3. SORT merged BY time DESCENDING
  - 4. RETURN merged[0..count-1]

## GET_ALL_BOOKMARKS_FOR_INDEX

- [IMPL-BOOKMARK_ROUTER] [ARCH-STORAGE_INDEX_AND_ROUTER] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-LOCAL_BOOKMARKS_INDEX] [REQ-BROWSER_BOOKMARK_STORAGE] How: aggregate local+file+sync+browser with storage field; pinboard excluded from index aggregation.
- Contract:
  - INPUT: none
  - PRE: local/file/sync/browser providers available
  - OUTPUT: list of bookmarks with storage in { local, file, sync, browser }
  - POST:
    - success => concat of four providers sorted by time DESC; no pinboard rows
  - EFFECTS: Async, IO
  - TERMINATION: total
- PROCEDURE: GET_ALL_BOOKMARKS_FOR_INDEX
  - 1. lists = PARALLEL [local, file, sync, browser].getAllBookmarks()
  - 2. RETURN concat with storage tags 'local'|'file'|'sync'|'browser', SORT BY time DESC

## MOVE_BOOKMARK_TO_STORAGE

- [IMPL-BOOKMARK_ROUTER] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-MOVE_BOOKMARK_STORAGE_UI] [REQ-PER_BOOKMARK_STORAGE_BACKEND] [REQ-BROWSER_BOOKMARK_STORAGE] How: get from source; ensure time; save to target; delete from source; update index (targetBackend may be browser).
- Contract:
  - INPUT: url, targetBackend (pinboard|local|file|sync|browser)
  - PRE: targetBackend valid; source resolvable via index or defaultStorageMode
  - OUTPUT: { success: true } | { error: MoveFailed }
  - POST:
    - success => bookmark on target, removed from source, index[url] = targetBackend
    - error MoveFailed => best-effort; index may be unchanged
  - FAILURE_MODES: MoveFailed
  - DATA: storageIndex
  - DATA_TRANSITION: on success, index[url] = targetBackend
  - EFFECTS: Async, IO, State
  - TERMINATION: total
- PROCEDURE: MOVE_BOOKMARK_TO_STORAGE
  - 1. sourceBackend = storageIndex.getBackendForUrl(url) OR defaultStorageMode
  - 2. sourceProvider = providerMap[sourceBackend]; targetProvider = providerMap[targetBackend]
  - 3. bookmark = sourceProvider.getBookmarkForUrl(url)
  - 4. IF bookmark lacks time: SET bookmark.time = now
  - 5. targetProvider.saveBookmark(bookmark)
  - 6. sourceProvider.deleteBookmark(url)
  - 7. storageIndex.setBackendForUrl(url, targetBackend)
