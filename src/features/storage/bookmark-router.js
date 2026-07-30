/**
 * [IMPL-BOOKMARK_ROUTER] [ARCH-STORAGE_INDEX_AND_ROUTER] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-PER_BOOKMARK_STORAGE_BACKEND] [REQ-STORAGE_MODE_DEFAULT] [REQ-MOVE_BOOKMARK_STORAGE_UI] [REQ-BROWSER_BOOKMARK_STORAGE]
 * Delegates bookmark operations to the correct provider per URL; save follows preferredBackend; getRecentBookmarks aggregate; moveBookmarkToStorage.
 * [IMPL-URL_TAGS_DISPLAY] Tag shape (string/array) via url-tags-manager.
 * [REQ-BROWSER_BOOKMARK_STORAGE] 2C: browser excluded from getBookmarkForUrl best-of race unless no other non-empty candidate (or resolve via preferred/index/default on empty path).
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
 * === IMPL-FULL-BLOCK: IMPL-LOCAL_BOOKMARKS_INDEX ===
 * [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [ARCH-STORAGE_INDEX_AND_ROUTER] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-LOCAL_BOOKMARKS_INDEX] [REQ-BROWSER_BOOKMARK_STORAGE] — Index page: getAggregatedBookmarksForIndex (fallback getLocalBookmarksForIndex), filter pipeline, table with Storage column; Stores L/F/S/B. Contract: page load and user actions; displayed table and filtered list; state data.
 *
 * ## LOAD_LOCAL_BOOKMARKS_INDEX
 *
 * - [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [REQ-LOCAL_BOOKMARKS_INDEX] [REQ-BROWSER_BOOKMARK_STORAGE] How: LOAD_LOCAL_BOOKMARKS_INDEX: aggregate first; treat error/success:false as failure even when bookmarks is []; then filter.
 * - Contract:
 *   - INPUT: none (page load); user actions (search, filter, sort, selection, export/move/delete/import)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: displayed table of bookmarks with Storage column; filtered/sorted list | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: allBookmarks (array with storage field), filteredBookmarks, selectedUrls (set), sortKey, timeColumnSource, timeDisplayMode; store checkboxes local|file|sync|browser
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: LOAD_LOCAL_BOOKMARKS_INDEX
 *   - SEND getAggregatedBookmarksForIndex
 *   - IF response has error OR success is false OR bookmarks is not an array:
 *   - SEND getLocalBookmarksForIndex
 *   - SET allBookmarks = response.bookmarks with storage "local"
 *   - ELSE:
 *   - SET allBookmarks = response.bookmarks (each item has storage "local"|"file"|"sync"|"browser")
 *   - applySearchAndFilter()
 *   - 1. ON page load:
 *   - LOAD_LOCAL_BOOKMARKS_INDEX
 *
 * ## SHOULD_RELOAD_BOOKMARKS_ON_STORE_CHANGE
 *
 * - [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [REQ-LOCAL_BOOKMARKS_INDEX] How: Store checkbox change refilters; if cache empty and at least one store checked, reload (cold SW recovery).
 * - Contract:
 *   - INPUT: none (page load); user actions (search, filter, sort, selection, export/move/delete/import)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: displayed table of bookmarks with Storage column; filtered/sorted list
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: allBookmarks (array with storage field), filteredBookmarks, selectedUrls (set), sortKey, timeColumnSource, timeDisplayMode; store checkboxes local|file|sync|browser
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: SHOULD_RELOAD_BOOKMARKS_ON_STORE_CHANGE
 *   - RETURN allBookmarksLength == 0 AND allowedStoresSize > 0
 *
 * ## GET_ALLOWED_STORES
 *
 * - [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [REQ-LOCAL_BOOKMARKS_INDEX] [REQ-BROWSER_BOOKMARK_STORAGE] How: getAllowedStores includes browser when #store-browser checked; Move/Import-to targets include browser.
 * - Contract:
 *   - INPUT: none (page load); user actions (search, filter, sort, selection, export/move/delete/import)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: displayed table of bookmarks with Storage column; filtered/sorted list
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: allBookmarks (array with storage field), filteredBookmarks, selectedUrls (set), sortKey, timeColumnSource, timeDisplayMode; store checkboxes local|file|sync|browser
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: GET_ALLOWED_STORES
 *   - SET from checked #store-local|#store-file|#store-sync|#store-browser → { local, file, sync, browser }
 *   - How (sub-block): Apply stores filter, search, show-only, exclude tags; sort and render.
 *
 * ## APPLY_SEARCH_AND_FILTER
 *
 * - [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [ARCH-STORAGE_INDEX_AND_ROUTER] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-LOCAL_BOOKMARKS_INDEX] [REQ-BROWSER_BOOKMARK_STORAGE] How: Implements applySearchAndFilter() behavior for IMPL-LOCAL_BOOKMARKS_INDEX.
 * - Contract:
 *   - INPUT: none (page load); user actions (search, filter, sort, selection, export/move/delete/import)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: displayed table of bookmarks with Storage column; filtered/sorted list
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: allBookmarks (array with storage field), filteredBookmarks, selectedUrls (set), sortKey, timeColumnSource, timeDisplayMode; store checkboxes local|file|sync|browser
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: APPLY_SEARCH_AND_FILTER
 *   - filteredBookmarks = allBookmarks
 *   - APPLY stores filter (matchStoresFilter, getAllowedStores)
 *   - APPLY search (text)
 *   - APPLY show-only (tags, toread, private, time range; getShowOnlyDefaultState for Clear)
 *   - APPLY exclude tags (matchExcludeTags)
 *   - SORT by sortKey (e.g. time desc)
 *   - renderTableBody(filteredBookmarks); updateRowCount()
 *
 * ## BULK_DELETE
 *
 * - [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [REQ-LOCAL_BOOKMARKS_INDEX] [IMPL-BOOKMARK_ROUTER] How: Bulk Delete uses row Storage column as preferredBackend; pending/final #delete-result mirrors Import status UX. Orchestrator: runBulkDelete (bookmarks-table-bulk-delete.js) for composition-testable wiring.
 * - Contract:
 *   - INPUT: none (page load); user actions (search, filter, sort, selection, export/move/delete/import)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: displayed table of bookmarks with Storage column; filtered/sorted list | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: allBookmarks (array with storage field), filteredBookmarks, selectedUrls (set), sortKey, timeColumnSource, timeDisplayMode; store checkboxes local|file|sync|browser
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: BULK_DELETE
 *   - IF selectedUrls empty: RETURN
 *   - runBulkDelete(urls, bookmarksByUrl, sendMessage, confirmFn, #delete-result, onAfterDelete):
 *   - titles = descriptions for selected URLs from bookmarksByUrl
 *   - IF NOT confirmFn(buildDeleteConfirmMessage(count, titles)): RETURN cancelled
 *   - setDeleteResultPending(#delete-result)  # "Deleting…" warning color
 *   - FOR each url IN urls:
 *   - bookmark = lookup url in bookmarksByUrl
 *   - payload = buildDeletePayload(bookmark)  # { url, preferredBackend from storage }
 *   - SEND deleteBookmark with data = payload
 *   - COUNT ok / fail from response
 *   - onAfterDelete()  # CLEAR selectedUrls; loadBookmarks(); updateMoveControlsState()
 *   - setDeleteResultFinal(#delete-result, formatDeleteResultMessage({ deleted: ok, failed: fail }))
 *   - How (sub-block): buildDeletePayload(bookmark):
 *   - IF bookmark missing or no url: RETURN null
 *   - RETURN { url: bookmark.url, preferredBackend: lowercase(bookmark.storage) OR "local" }
 *
 * ## OPEN_BOOKMARKS_INDEX_TAB
 *
 * - [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [REQ-LOCAL_BOOKMARKS_INDEX] How: concurrent cold-start messages share one in-flight initBookmarkProvider promise (createProviderInitMutex). OPEN_BOOKMARKS_INDEX_TAB: create index tab then dismiss already-open side panel (tab-create only; not page refresh). How: SW owns create+broadcast so popup/command/menu share one path; panel closes via REQUEST_SIDE_PANEL_CLOSE (icon-toggle semantics).
 * - Contract:
 *   - INPUT: none (page load); user actions (search, filter, sort, selection, export/move/delete/import)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: displayed table of bookmarks with Storage column; filtered/sorted list
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: allBookmarks (array with storage field), filteredBookmarks, selectedUrls (set), sortKey, timeColumnSource, timeDisplayMode; store checkboxes local|file|sync|browser
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: OPEN_BOOKMARKS_INDEX_TAB
 *   - url = runtime.getURL('src/ui/bookmarks-table/bookmarks-table.html')
 *   - tabs.create({ url })
 *   - runtime.sendMessage({ type: REQUEST_SIDE_PANEL_CLOSE })
 *   - How (sub-block): Entry points that call OPEN_BOOKMARKS_INDEX_TAB (not options href):
 *   - 1. ON OPEN_BOOKMARKS_INDEX message: OPEN_BOOKMARKS_INDEX_TAB
 *   - 2. ON command open-bookmarks-index: OPEN_BOOKMARKS_INDEX_TAB
 *   - 3. ON context menu hoverboard-open-bookmarks-index: OPEN_BOOKMARKS_INDEX_TAB
 *   - 4. Popup: bookmarksIndexBtn -> openBookmarksIndex -> SEND OPEN_BOOKMARKS_INDEX
 *   - 5. Options: bookmarks-index-link href -> extension URL (no dismiss; out of scope)
 *   - How (sub-block): Index page init must NOT send REQUEST_SIDE_PANEL_CLOSE (refresh must not re-dismiss after icon reopen).
 *
 * === END IMPL-FULL-BLOCK: IMPL-LOCAL_BOOKMARKS_INDEX ===
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
import { debugLog, debugError } from '../../shared/utils.js'
import { normalizeBookmarkForDisplay } from './url-tags-manager.js'

function cleanUrl (url) {
  if (!url) return ''
  return url.trim().replace(/\/+$/, '')
}

const VALID_BACKENDS = ['pinboard', 'local', 'file', 'sync', 'browser']

export class BookmarkRouter {
  /**
   * [IMPL-BOOKMARK_ROUTER] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-PER_BOOKMARK_STORAGE_BACKEND] [REQ-STORAGE_MODE_DEFAULT] [REQ-MOVE_BOOKMARK_STORAGE_UI] [REQ-BROWSER_BOOKMARK_STORAGE] Constructor.
   * @param {Object} pinboardProvider - getBookmarkForUrl, saveBookmark, deleteBookmark, getRecentBookmarks, saveTag, deleteTag, testConnection
   * @param {Object} localProvider - same contract
   * @param {Object} fileProvider - same contract
   * @param {Object} syncProvider - same contract
   * @param {StorageIndex} storageIndex
   * @param {() => Promise<string>} getDefaultStorageMode - async returns 'pinboard'|'local'|'file'|'sync'|'browser'
   * @param {Object} [browserProvider] - chrome.bookmarks provider (optional for backward-compatible tests)
   */
  constructor (pinboardProvider, localProvider, fileProvider, syncProvider, storageIndex, getDefaultStorageMode, browserProvider = null) {
    this.pinboardProvider = pinboardProvider
    this.localProvider = localProvider
    this.fileProvider = fileProvider
    this.syncProvider = syncProvider
    this.browserProvider = browserProvider
    this.storageIndex = storageIndex
    this.getDefaultStorageMode = getDefaultStorageMode
  }

  _providerFor (backend) {
    if (backend === 'pinboard') return this.pinboardProvider
    if (backend === 'local') return this.localProvider
    if (backend === 'file') return this.fileProvider
    if (backend === 'sync') return this.syncProvider
    if (backend === 'browser') return this.browserProvider || this.localProvider
    return this.localProvider
  }

  async _backendForUrl (url) {
    const key = cleanUrl(url)
    const backend = await this.storageIndex.getBackendForUrl(key)
    if (backend) return backend
    return this.getDefaultStorageMode()
  }

  /**
   * [IMPL-BOOKMARK_ROUTER] Treat as empty when bookmark is the stub shape (no time, no tags, no description).
   * [IMPL-URL_TAGS_DISPLAY] Uses normalizeBookmarkForDisplay so tag shape (string/array) is consistent with display.
   */
  _isEmptyBookmark (bookmark) {
    if (!bookmark || !bookmark.url) return true
    const norm = normalizeBookmarkForDisplay(bookmark)
    const hasTime = !!(norm.time && norm.time.trim())
    const hasTags = norm.tags.length > 0
    const hasDescription = !!(norm.description && norm.description.trim())
    return !hasTime && !hasTags && !hasDescription
  }

  /**
   * [IMPL-URL_TAGS_DISPLAY] Same tag contract as url-tags-manager (normalized array).
   */
  _hasTags (bookmark) {
    return normalizeBookmarkForDisplay(bookmark).tags.length > 0
  }

  /**
   * [IMPL-BOOKMARK_ROUTER] [REQ-BROWSER_BOOKMARK_STORAGE] 2C: race pinboard/local/file/sync only; consult browser only when no other non-empty candidate (resolve may pick browser via index/default).
   */
  async getBookmarkForUrl (url, title = '') {
    const key = cleanUrl(url)
    const pinPromise = this.pinboardProvider.getBookmarkForUrl(url, title).catch(() => null)
    const [pinB, localB, fileB, syncB] = await Promise.all([
      pinPromise,
      this.localProvider.getBookmarkForUrl(url, title),
      this.fileProvider.getBookmarkForUrl(url, title),
      this.syncProvider.getBookmarkForUrl(url, title)
    ])
    const candidates = [
      { backend: 'pinboard', bookmark: pinB },
      { backend: 'local', bookmark: localB },
      { backend: 'file', bookmark: fileB },
      { backend: 'sync', bookmark: syncB }
    ].filter(c => c.bookmark && !this._isEmptyBookmark(c.bookmark))
    if (candidates.length === 0) {
      const fromIndex = await this.storageIndex.getBackendForUrl(key)
      const backend = fromIndex || await this.getDefaultStorageMode()
      const provider = this._providerFor(backend)
      return provider.getBookmarkForUrl(url, title)
    }
    const best = candidates.reduce((acc, c) => {
      const hasTags = this._hasTags(c.bookmark)
      const accHasTags = this._hasTags(acc.bookmark)
      if (hasTags && !accHasTags) return c
      if (!hasTags && accHasTags) return acc
      const accTime = acc.bookmark.time || ''
      const cTime = c.bookmark.time || ''
      return cTime > accTime ? c : acc
    })
    const fromIndex = await this.storageIndex.getBackendForUrl(key)
    if (!fromIndex || fromIndex !== best.backend) {
      debugLog('[IMPL-BOOKMARK_ROUTER] getBookmarkForUrl using:', best.backend, 'hasTags:', this._hasTags(best.bookmark))
      await this.storageIndex.setBackendForUrl(key, best.backend)
    }
    return best.bookmark
  }

  async getRecentBookmarks (count = 15) {
    const promises = [
      this.pinboardProvider.getRecentBookmarks(count),
      this.localProvider.getRecentBookmarks(count),
      this.fileProvider.getRecentBookmarks(count),
      this.syncProvider.getRecentBookmarks(count)
    ]
    if (this.browserProvider?.getRecentBookmarks) {
      promises.push(this.browserProvider.getRecentBookmarks(count))
    }
    const lists = await Promise.all(promises)
    const merged = lists.flat()
    const byTime = merged.sort((a, b) => (b.time || '').localeCompare(a.time || ''))
    const list = byTime.slice(0, count)
    debugLog('[IMPL-BOOKMARK_ROUTER] getRecentBookmarks aggregated:', list.length)
    return list
  }

  async saveBookmark (bookmarkData) {
    const url = bookmarkData?.url ? cleanUrl(bookmarkData.url) : ''
    if (!url) {
      return { success: false, code: 'invalid', message: 'URL is required' }
    }
    const fromIndex = await this.storageIndex.getBackendForUrl(url)
    const defaultMode = await this.getDefaultStorageMode()
    const preferred = bookmarkData?.preferredBackend ?? bookmarkData?.backend
    const usePreferred = preferred && VALID_BACKENDS.includes(preferred)
    // [IMPL-BOOKMARK_ROUTER] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-STORAGE_MODE_DEFAULT] [REQ-MOVE_BOOKMARK_STORAGE_UI] When popup sends preferredBackend (UI selection), use it so save follows the highlight.
    const backend = (usePreferred ? preferred : null) || fromIndex || defaultMode
    const provider = this._providerFor(backend)
    const result = await provider.saveBookmark(bookmarkData)
    if (result.success) {
      await this.storageIndex.setBackendForUrl(url, backend)
    }
    return result
  }

  /**
   * [IMPL-BOOKMARK_ROUTER] [REQ-LOCAL_BOOKMARKS_INDEX] Delete by url string or { url, preferredBackend }.
   * preferredBackend (Index Storage column) overrides storage index so File/Sync/Browser rows delete from the correct provider.
   * @param {string|{ url?: string, preferredBackend?: string }} urlOrData
   */
  async deleteBookmark (urlOrData) {
    const data = (urlOrData && typeof urlOrData === 'object') ? urlOrData : {}
    const url = (typeof urlOrData === 'string') ? urlOrData : (data.url || '')
    const key = cleanUrl(url)
    const preferred = data?.preferredBackend ?? data?.backend
    const usePreferred = preferred && VALID_BACKENDS.includes(preferred)
    let backend = usePreferred ? preferred : await this.storageIndex.getBackendForUrl(key)
    if (!backend) backend = await this.getDefaultStorageMode()
    const provider = this._providerFor(backend)
    debugLog('[IMPL-BOOKMARK_ROUTER] deleteBookmark:', key, 'backend:', backend, 'preferred:', usePreferred ? preferred : null)
    const result = await provider.deleteBookmark(url)
    if (result.success) {
      await this.storageIndex.removeUrl(key)
    }
    return result
  }

  async saveTag (tagData) {
    const url = tagData?.url ? cleanUrl(tagData.url) : ''
    if (!url) return { success: false, code: 'invalid', message: 'URL is required' }
    const backend = await this._backendForUrl(url)
    const provider = this._providerFor(backend)
    return provider.saveTag(tagData)
  }

  async deleteTag (tagData) {
    const url = tagData?.url ? cleanUrl(tagData.url) : ''
    if (!url) return { success: false, code: 'invalid', message: 'URL is required' }
    const backend = await this._backendForUrl(url)
    const provider = this._providerFor(backend)
    return provider.deleteTag(tagData)
  }

  async testConnection () {
    const defaultMode = await this.getDefaultStorageMode()
    const provider = this._providerFor(defaultMode)
    return provider.testConnection()
  }

  /**
   * [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-LOCAL_BOOKMARKS_INDEX] [REQ-BROWSER_BOOKMARK_STORAGE]
   * Aggregate local + file + sync + browser with storage field; sort by time desc.
   * @returns {Promise<Array<{ ...bookmark, storage: 'local'|'file'|'sync'|'browser' }>>}
   */
  async getAllBookmarksForIndex () {
    const [localList, fileList, syncList, browserList] = await Promise.all([
      this.localProvider.getAllBookmarks ? this.localProvider.getAllBookmarks() : [],
      this.fileProvider.getAllBookmarks ? this.fileProvider.getAllBookmarks() : [],
      this.syncProvider.getAllBookmarks ? this.syncProvider.getAllBookmarks() : [],
      this.browserProvider?.getAllBookmarks ? this.browserProvider.getAllBookmarks() : []
    ])
    const withSource = [
      ...localList.map(b => ({ ...b, storage: 'local' })),
      ...fileList.map(b => ({ ...b, storage: 'file' })),
      ...syncList.map(b => ({ ...b, storage: 'sync' })),
      ...browserList.map(b => ({ ...b, storage: 'browser' }))
    ]
    return withSource.sort((a, b) => (b.time || '').localeCompare(a.time || ''))
  }

  /**
   * [IMPL-BOOKMARK_ROUTER] Get storage backend for URL (for move UI).
   * @param {string} url
   * @returns {Promise<string>} 'pinboard'|'local'|'file'|'sync'|'browser'
   */
  async getStorageBackendForUrl (url) {
    const backend = await this.storageIndex.getBackendForUrl(url)
    if (backend) return backend
    return this.getDefaultStorageMode()
  }

  /**
   * [IMPL-BOOKMARK_ROUTER] [IMPL-MOVE_BOOKMARK_RESPONSE_AND_URL] [REQ-MOVE_BOOKMARK_STORAGE_UI] [REQ-BROWSER_BOOKMARK_STORAGE] Move bookmark to target storage (copy to target, delete from source, update index).
   * @param {string} url
   * @param {string} targetBackend - 'pinboard'|'local'|'file'|'sync'|'browser'
   */
  async moveBookmarkToStorage (url, targetBackend) {
    const key = cleanUrl(url)
    const sourceBackend = await this.storageIndex.getBackendForUrl(key) || await this.getDefaultStorageMode()
    if (sourceBackend === targetBackend) {
      return { success: true, code: 'done', message: 'Already in target storage' }
    }
    const sourceProvider = this._providerFor(sourceBackend)
    const targetProvider = this._providerFor(targetBackend)
    const bookmark = await sourceProvider.getBookmarkForUrl(url)
    if (!bookmark || !bookmark.url) {
      return { success: false, code: 'not_found', message: 'Bookmark not found in source' }
    }
    // [IMPL-MOVE_BOOKMARK_RESPONSE_AND_URL] Allow move when bookmark has url but missing time. [IMPL-BOOKMARK_CREATE_UPDATE_TIMES] Ensure time and updated_at set for target.
    const now = new Date().toISOString()
    const toSave = { ...bookmark, time: bookmark.time || now, updated_at: now }
    const saveResult = await targetProvider.saveBookmark(toSave)
    if (!saveResult.success) {
      debugError('[IMPL-BOOKMARK_ROUTER] moveBookmarkToStorage save to target failed:', saveResult)
      return saveResult
    }
    const deleteResult = await sourceProvider.deleteBookmark(url)
    if (!deleteResult.success) {
      debugError('[IMPL-BOOKMARK_ROUTER] moveBookmarkToStorage delete from source failed:', deleteResult)
    }
    await this.storageIndex.setBackendForUrl(key, targetBackend)
    debugLog('[IMPL-BOOKMARK_ROUTER] moveBookmarkToStorage done:', key, sourceBackend, '->', targetBackend)
    return { success: true, code: 'done', message: 'Operation completed' }
  }
}
