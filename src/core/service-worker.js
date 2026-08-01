/**
 * === IMPL-FULL-BLOCK: IMPL-BOOKMARK_USAGE_TRACKING ===
 * [IMPL-BOOKMARK_USAGE_TRACKING] [ARCH-BOOKMARK_USAGE_TRACKING] [REQ-BOOKMARK_USAGE_TRACKING] — Record visit and optional referrer; debounce; persist usage + nav edges in chrome.storage.local.
 *
 * ## RECORD_VISIT
 *
 * - [IMPL-BOOKMARK_USAGE_TRACKING] [ARCH-BOOKMARK_USAGE_TRACKING] [REQ-BOOKMARK_USAGE_TRACKING] How: Implements recordVisit(url, referrer?) behavior for IMPL-BOOKMARK_USAGE_TRACKING.
 * - Contract:
 *   - INPUT: context / caller args
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: result
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - EFFECTS: Http, IO
 *   - TERMINATION: total
 * - PROCEDURE: RECORD_VISIT
 *   - url = cleanUrl(url); if !url return
 *   - IF now - _lastRecordedVisit[url] < DEBOUNCE_MS return  // debounce
 *   - _lastRecordedVisit[url] = now
 *   - usage = read usage[url] or create { visitCount:0, firstVisitedAt:'', lastVisitedAt:'', recentVisits:[] }
 *   - usage.visitCount++; usage.lastVisitedAt = now; if !usage.firstVisitedAt then usage.firstVisitedAt = now
 *   - usage.recentVisits = [now, ...usage.recentVisits].slice(0, RECENT_VISITS_CAP)
 *   - write usage map
 *   - IF referrer: ref = cleanUrl(referrer); IF ref && ref !== url && /^https?:/.test(ref): add/increment edge ref→url; write edges map
 *   - 1. getUsage(url), getAllUsage(): read from storage; return normalized records
 *   - 2. getMostFrequent(n), getMostRecent(n): sort by visitCount / lastVisitedAt; return top n
 *   - 3. getInboundLinks(url): edges[url] or []
 *   - 4. getOutboundLinks(url): all edges where sourceUrl === url (scan edges map)
 *   - 5. getNavigationGraph(): all edges as { sourceUrl, targetUrl, count, ... }
 *   - 6. clearUsage(url): delete usage[url]; delete edges[url]; remove url from any edge as sourceUrl
 *
 * === END IMPL-FULL-BLOCK: IMPL-BOOKMARK_USAGE_TRACKING ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-FILE_STORAGE_TYPED_PATH ===
 * [IMPL-FILE_STORAGE_TYPED_PATH] [ARCH-FILE_BOOKMARK_PROVIDER] [REQ-FILE_BOOKMARK_STORAGE] — User-typed path for file storage; Options persist path; native host read/write; initBookmarkProvider path vs picker. Contract: path input and storage; persisted path and file I/O via native host.
 *
 * ## RESOLVE_FILE_PATH
 *
 * - [IMPL-FILE_STORAGE_TYPED_PATH] [ARCH-FILE_BOOKMARK_PROVIDER] [REQ-FILE_BOOKMARK_STORAGE] How: Implements resolveFilePath(path) behavior for IMPL-FILE_STORAGE_TYPED_PATH.
 * - Contract:
 *   - INPUT: path string (user-typed, default ~/.hoverboard); read/write requests with path
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: persisted path in hoverboard_file_storage_path; file contents read/written via native host
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: hoverboard_file_storage_path (storage); path -> if dir then path/hoverboard-bookmarks.json else path as file
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: RESOLVE_FILE_PATH
 *   - path = expand_tilde(path)  // IMPL-FILE_STORAGE_HELPER_PATH_NORMALIZE
 *   - IF path ends with .json: RETURN path AS file
 *   - ELSE: RETURN path + "/hoverboard-bookmarks.json"
 *   - How (sub-block): Send native message to helper for read/write; return result.
 *
 * ## READ_BOOKMARKS_FILE
 *
 * - [IMPL-FILE_STORAGE_TYPED_PATH] [ARCH-FILE_BOOKMARK_PROVIDER] [REQ-FILE_BOOKMARK_STORAGE] How: Implements readBookmarksFile(path), writeBookmarksFile(path, data) behavior for IMPL-FILE_STORAGE_TYPED_PATH.
 * - Contract:
 *   - INPUT: path string (user-typed, default ~/.hoverboard); read/write requests with path
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: persisted path in hoverboard_file_storage_path; file contents read/written via native host
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: hoverboard_file_storage_path (storage); path -> if dir then path/hoverboard-bookmarks.json else path as file
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: READ_BOOKMARKS_FILE
 *   - path = resolveFilePath(path)
 *   - SEND native message (type, path) to helper; helper reads/writes file; RETURN result
 *   - How (sub-block): Prefer path adapter when path set; else picker adapter.
 *
 * ## INIT_BOOKMARK_PROVIDER
 *
 * - [IMPL-FILE_STORAGE_TYPED_PATH] [ARCH-FILE_BOOKMARK_PROVIDER] [REQ-FILE_BOOKMARK_STORAGE] How: Implements initBookmarkProvider() behavior for IMPL-FILE_STORAGE_TYPED_PATH.
 * - Contract:
 *   - INPUT: path string (user-typed, default ~/.hoverboard); read/write requests with path
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: persisted path in hoverboard_file_storage_path; file contents read/written via native host
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: hoverboard_file_storage_path (storage); path -> if dir then path/hoverboard-bookmarks.json else path as file
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: INIT_BOOKMARK_PROVIDER
 *   - IF path set in storage: USE NativeHostFileBookmarkAdapter(path)
 *   - ELSE IF picker configured: USE MessageFileBookmarkAdapter
 *
 * === END IMPL-FULL-BLOCK: IMPL-FILE_STORAGE_TYPED_PATH ===
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
 * === IMPL-FULL-BLOCK: IMPL-BADGE_REFRESH ===
 * [IMPL-BADGE_REFRESH] [ARCH-BADGE] [REQ-BADGE_INDICATORS] — Service worker refreshes badge after saveTag, deleteTag, saveBookmark so icon reflects tag count and flags.
 *
 * ## MAIN
 *
 * - [IMPL-BADGE_REFRESH] [ARCH-BADGE] [REQ-BADGE_INDICATORS] How: Logical block for IMPL-BADGE_REFRESH.
 * - Contract:
 *   - INPUT: message result (after processMessage) with type saveTag | deleteTag | saveBookmark
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: badge updated for the affected tab (icon label and optional private/toread indicators)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: handleMessage in service worker; updateBadgeForTab(tab)
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: MAIN
 *   - How (sub-block): Resolve tab (sender.tab or query active for saveBookmark); call updateBadgeForTab(tab).
 *   - 1. AFTER processMessage(message) succeeds:
 *   - 2.   IF message.type IN [saveTag, deleteTag, saveBookmark]:
 *   - 3.     tab = sender.tab IF present
 *   - 4.     IF no tab AND message.type = saveBookmark: tab = query active tab
 *   - 5.     IF tab: updateBadgeForTab(tab)
 *
 * === END IMPL-FULL-BLOCK: IMPL-BADGE_REFRESH ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-CONTEXT_MENU_QUICK_ACCESS ===
 * [IMPL-CONTEXT_MENU_QUICK_ACCESS] [ARCH-QUICK_ACCESS_ENTRY] [REQ-QUICK_ACCESS_ENTRY] — This block defines context menu for quick access. Implements REQ "context menu" with same four actions as commands; implements ARCH by having SW own context menu.
 *
 * ## SETUP_CONTEXT_MENUS
 *
 * - [REQ-QUICK_ACCESS_ENTRY] [ARCH-QUICK_ACCESS_ENTRY] [IMPL-CONTEXT_MENU_QUICK_ACCESS] How: setupContextMenus: creates parent and four children so REQ "context menu with parent Hoverboard and four items" is satisfied. Call on install (handleInstall) so menus appear after install.
 * - Contract:
 *   - INPUT: user right-clicks (any context); user selects one of four Hoverboard menu items
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: same as extension commands (side panel, options, bookmarks index, or import opens)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - EFFECTS: Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: SETUP_CONTEXT_MENUS
 *   - api = browser.contextMenus || chrome.contextMenus
 *   - IF !api THEN RETURN
 *   - api.removeAll(() => {  // idempotent: clear then create so update does not duplicate
 *   - api.create({ id: 'hoverboard-root', title: 'Hoverboard', contexts: ['all'] })
 *   - api.create({ id: 'hoverboard-open-side-panel', parentId: 'hoverboard-root', title: 'Open side panel', contexts: ['all'] })
 *   - api.create({ id: 'hoverboard-open-options', parentId: 'hoverboard-root', title: 'Open options', contexts: ['all'] })
 *   - api.create({ id: 'hoverboard-open-bookmarks-index', parentId: 'hoverboard-root', title: 'Open bookmarks index', contexts: ['all'] })
 *   - api.create({ id: 'hoverboard-open-import', parentId: 'hoverboard-root', title: 'Open browser bookmark import', contexts: ['all'] })
 *   - })
 *
 * ## BLOCK_2
 *
 * - [REQ-QUICK_ACCESS_ENTRY] [ARCH-QUICK_ACCESS_ENTRY] [IMPL-CONTEXT_MENU_QUICK_ACCESS] How: onClicked: implements same four actions as command handler so REQ and ARCH are satisfied (single behavior, multiple entry points).
 * - Contract:
 *   - INPUT: user right-clicks (any context); user selects one of four Hoverboard menu items
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: same as extension commands (side panel, options, bookmarks index, or import opens)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - EFFECTS: Http, IO
 *   - TERMINATION: total
 * - PROCEDURE: BLOCK_2
 *   - 1. api.onClicked.addListener((info, tab) => {
 *   - 2.   SWITCH info.menuItemId:
 *   - 3.     "hoverboard-open-side-panel": same as open-side-panel command (chrome.sidePanel.open({ windowId: this._sidePanelWindowId }))
 *   - 4.     "hoverboard-open-options": chrome.runtime.openOptionsPage()
 *   - 5.     "hoverboard-open-bookmarks-index": OPEN_BOOKMARKS_INDEX_TAB  # [IMPL-LOCAL_BOOKMARKS_INDEX]
 *   - 6.     "hoverboard-open-import": chrome.tabs.create({ url: chrome.runtime.getURL('src/ui/browser-bookmark-import/browser-bookmark-import.html') })
 *   - 7. })
 *
 * === END IMPL-FULL-BLOCK: IMPL-CONTEXT_MENU_QUICK_ACCESS ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-EXTENSION_COMMANDS ===
 * [IMPL-EXTENSION_COMMANDS] [ARCH-QUICK_ACCESS_ENTRY] [REQ-QUICK_ACCESS_ENTRY] — Extension commands for quick access; SW owns command handling. Contract: shortcut in; one of four targets opens.
 *
 * ## MANIFEST_JSON
 *
 * - [REQ-QUICK_ACCESS_ENTRY] [ARCH-QUICK_ACCESS_ENTRY] [IMPL-EXTENSION_COMMANDS] How: Manifest: four commands so Chrome shows them in chrome://extensions/shortcuts; user can reassign.
 * - Contract:
 *   - INPUT: user presses assigned shortcut (or default Ctrl+Shift+B/O/M/I)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: side panel opens, or options page opens, or bookmarks index tab opens, or import page tab opens
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: command names (open-side-panel, open-options, open-bookmarks-index, open-import); SW onCommand handler
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: State
 *   - TERMINATION: total
 * - PROCEDURE: MANIFEST_JSON
 *   - "commands": {
 *   - "open-side-panel": { "suggested_key": { "default": "Ctrl+Shift+B" }, "description": "Open Hoverboard side panel" },
 *   - "open-options": { "suggested_key": { "default": "Ctrl+Shift+O" }, "description": "Open Hoverboard options" },
 *   - "open-bookmarks-index": { "suggested_key": { "default": "Ctrl+Shift+M" }, "description": "Open bookmarks index" },
 *   - "open-import": { "suggested_key": { "default": "Ctrl+Shift+I" }, "description": "Open browser bookmark import" }
 *   - }
 *
 * ## HANDLE_COMMAND
 *
 * - [REQ-QUICK_ACCESS_ENTRY] [ARCH-QUICK_ACCESS_ENTRY] [IMPL-EXTENSION_COMMANDS] How: SW onCommand: handle each command; side panel via _sidePanelWindowId; openOptionsPage and tabs.create for options, index, import.
 * - Contract:
 *   - INPUT: user presses assigned shortcut (or default Ctrl+Shift+B/O/M/I)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: side panel opens, or options page opens, or bookmarks index tab opens, or import page tab opens
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: command names (open-side-panel, open-options, open-bookmarks-index, open-import); SW onCommand handler
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: HANDLE_COMMAND
 *   - SWITCH command:
 *   - "open-side-panel": windowId = this._sidePanelWindowId; IF windowId != null AND chrome.sidePanel?.open THEN chrome.sidePanel.open({ windowId })
 *   - "open-side-panel-bookmark": chrome.storage.local.set({ hoverboard_sidepanel_active_tab: 'bookmark' }); THEN sidePanel.open({ windowId })
 *   - "open-side-panel-tags-tree": chrome.storage.local.set({ hoverboard_sidepanel_active_tab: 'tagsTree' }); THEN sidePanel.open({ windowId })
 *   - "open-side-panel-browser-tabs": chrome.storage.local.set({ hoverboard_sidepanel_active_tab: 'browserTabs' }); THEN sidePanel.open({ windowId })
 *   - "open-options": chrome.runtime.openOptionsPage()
 *   - "open-bookmarks-index": OPEN_BOOKMARKS_INDEX_TAB  # tabs.create + REQUEST_SIDE_PANEL_CLOSE [IMPL-LOCAL_BOOKMARKS_INDEX]
 *   - "open-import": chrome.tabs.create({ url: ... browser-bookmark-import.html })
 *   - How (sub-block): Side panel: storage.onChanged for SIDE_PANEL_TAB_STORAGE_KEY → switchTab(newValue) when panel already open.
 *
 * === END IMPL-FULL-BLOCK: IMPL-EXTENSION_COMMANDS ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-ICON_CLICK_BEHAVIOR ===
 * [IMPL-ICON_CLICK_BEHAVIOR] [ARCH-ICON_CLICK_BEHAVIOR] [REQ-ICON_CLICK_BEHAVIOR] — Icon click opens side panel (default) or popup; when side panel, click toggles (close if already open).
 *
 * ## _SEED_ICON_CLICK_PREFERENCE_CACHE
 *
 * - [REQ-ICON_CLICK_BEHAVIOR] [ARCH-ICON_CLICK_BEHAVIOR] [IMPL-ICON_CLICK_BEHAVIOR] How: Manifest: no default_popup so onClicked fires. Config: iconClickOpensSidePanel default true; schema optional boolean. Options: toggle bound to iconClickOpensSidePanel; load and save with other settings. SW: cache preference so handler stays synchronous (user gesture required for sidePanel.open).
 * - Contract:
 *   - INPUT: user clicks extension toolbar icon
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: side panel opens or closes (toggle) when option enabled; else popup opens
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: SW _iconClickOpensSidePanel (cached), _sidePanelWindowId; panel _sidePanelLoadTime; MESSAGE_TYPES.REQUEST_SIDE_PANEL_CLOSE
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: _SEED_ICON_CLICK_PREFERENCE_CACHE
 *   - getConfig().then(c => this._iconClickOpensSidePanel = c.iconClickOpensSidePanel)
 *   - storage.onChanged.addListener(changes, areaName => IF areaName === 'local' AND changes.hoverboard_settings THEN getConfig().then(...))
 *
 * ## HANDLE_ACTION_CLICK
 *
 * - [REQ-ICON_CLICK_BEHAVIOR] [ARCH-ICON_CLICK_BEHAVIOR] [IMPL-ICON_CLICK_BEHAVIOR] How: SW: listener passes tab from Chrome into handleActionClick(tab). SW handleActionClick(tab): prefer clicked window; Chrome requires sidePanel.open() in same synchronous user-gesture stack.
 * - Contract:
 *   - INPUT: user clicks extension toolbar icon
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: side panel opens or closes (toggle) when option enabled; else popup opens
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: SW _iconClickOpensSidePanel (cached), _sidePanelWindowId; panel _sidePanelLoadTime; MESSAGE_TYPES.REQUEST_SIDE_PANEL_CLOSE
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: HANDLE_ACTION_CLICK
 *   - openSidePanel = (this._iconClickOpensSidePanel !== false)
 *   - IF NOT openSidePanel: action.openPopup(); RETURN
 *   - IF NOT sidePanel.open available: action.openPopup(); RETURN
 *   - How (sub-block): # [IMPL-ICON_CLICK_BEHAVIOR] Prefer clicked window: use tab from onClicked when provided, else cache.
 *   - clickedWindowId = tab?.windowId != null ? tab.windowId : null
 *   - cachedWindowId = this._sidePanelWindowId
 *   - useWindowId = clickedWindowId != null ? clickedWindowId : cachedWindowId
 *   - IF useWindowId != null:
 *   - IF clickedWindowId != null AND NOT _isRestrictedForSidePanel(tab?.url): this._sidePanelWindowId = clickedWindowId
 *   - sidePanel.open({ windowId: useWindowId }); windows.update(useWindowId, { focused: true }); sendMessage(REQUEST_SIDE_PANEL_CLOSE); RETURN
 *   - How (sub-block): # [IMPL-ICON_CLICK_BEHAVIOR] Cold start: no tab and no cache; do NOT call sidePanel.open in async callback (gesture would be lost). Seed cache for next click; open popup as fallback.
 *   - tabs.query({ active: true, currentWindow: true }, (tabs) =>
 *   - tabFromQuery = tabs?.[0]
 *   - IF tabFromQuery?.windowId != null AND NOT _isRestrictedForSidePanel(tabFromQuery.url): this._sidePanelWindowId = tabFromQuery.windowId
 *   - )
 *   - action.openPopup()
 *
 * ## BIND_TOGGLE_CLOSE_REQUEST
 *
 * - [REQ-ICON_CLICK_BEHAVIOR] [IMPL-ICON_CLICK_BEHAVIOR] How: Side panel: on REQUEST_SIDE_PANEL_CLOSE close if visible and open long enough (toggle).
 * - Contract:
 *   - INPUT: user clicks extension toolbar icon
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: side panel opens or closes (toggle) when option enabled; else popup opens
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: SW _iconClickOpensSidePanel (cached), _sidePanelWindowId; panel _sidePanelLoadTime; MESSAGE_TYPES.REQUEST_SIDE_PANEL_CLOSE
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: BIND_TOGGLE_CLOSE_REQUEST
 *   - runtime.onMessage.addListener(message =>
 *   - IF message?.type !== REQUEST_SIDE_PANEL_CLOSE RETURN
 *   - IF document.visibilityState !== 'visible' RETURN
 *   - IF (Date.now() - _sidePanelLoadTime) < 300 RETURN
 *   - window.close())
 *
 * === END IMPL-FULL-BLOCK: IMPL-ICON_CLICK_BEHAVIOR ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-SIDE_PANEL_BROWSER_TABS ===
 * [IMPL-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [REQ-SIDE_PANEL_BROWSER_TABS] — This block defines the browser tabs panel: data fetch, search scope, filter, UI, copy URLs, close with confirm. Implements REQ by listing tabs with title/URL/referrer and optional pageText/importantTags; scope-aware filter; implements ARCH by chrome.tabs + scripting and visible-list actions.
 *
 * ## FILTER_BROWSER_TABS
 *
 * - [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] How: Data fetch: panel queries chrome.tabs; windowScope selects query. Referrer via GET_TAB_REFERRERS (SW executeScript per tab). When searchScope is pageText or importantTags, panel sends GET_TABS_PAGE_TEXT or GET_TABS_IMPORTANT_TAGS with tab list; SW executeScript per tab returns tabId→string map; panel merges into allTabs. Show loading state during pageText/importantTags fetch. Implements "list from current or all windows", "collect referrer", "search in page text or important tags". filterBrowserTabs(tabs, query, scope): pure function. Empty query returns all. scope tabInfo → match title, url, referrer; scope pageText → match tab.pageText; scope importantTags → match tab.importantTags. Case-insensitive substring. Implements "filter by search term" and "search in selected scope".
 * - Contract:
 *   - INPUT: windowScope (currentWindow | all), searchScope (tabInfo | pageText | importantTags), searchQuery (string), tabs list from chrome.tabs
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: visible tabs (filtered), copy URLs to clipboard with count, close visible tabs after confirm with count
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: tabs = [{ id, windowId, title, url, referrer, pageText?, importantTags? }], visibleTabs = filterBrowserTabs(tabs, searchQuery, searchScope)
 *   - EFFECTS: Async, Http, IO
 *   - TERMINATION: total
 * - PROCEDURE: FILTER_BROWSER_TABS
 *   - q = String(query).trim().toLowerCase()
 *   - IF q === '' RETURN tabs
 *   - IF scope === 'tabInfo': RETURN tabs WHERE (t.title??'').toLowerCase().includes(q) OR (t.url??'').toLowerCase().includes(q) OR (t.referrer??'').toLowerCase().includes(q)
 *   - IF scope === 'pageText': RETURN tabs WHERE (t.pageText??'').toLowerCase().includes(q)
 *   - IF scope === 'importantTags': RETURN tabs WHERE (t.importantTags??'').toLowerCase().includes(q)
 *   - RETURN tabs
 *
 * ## MERGE_BOOKMARK_REPLY_INTO_TAB
 *
 * - [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] How: UI: window scope toggle; search-scope control (Tab info | Page text | Elements, default Tab info); control groups with very narrow margins; Title/URL/Block above filter textbox; on searchScope change, if pageText or importantTags fetch that data and merge; search input; on input visibleTabs = filterBrowserTabs(allTabs, searchQuery, searchScope); re-render. Multi-row card per tab. Implements "search scope selection", "filter by selected scope". List display mode: user chooses what each list item shows (title only, URL only, or full block). Default block. In non-block mode text is clickable to focus window/tab; remove icon after text. Implements "choose how each tab is shown" and "clickable text in title/url mode". Remove from display: session-scoped hidden set; remove icon in all modes (after text in title/url, before Tags in block). Refresh clears. Implements "remove from displayed list". Close single tab: per-row close-tab button before window id (block: before ids line; title/url: before focus link). Remove button unchanged (after tab id / after link). ON click (data-action=closeTab): chrome.tabs.remove(tabId); then remove from allTabs and re-render or loadTabs(). Focus on click: in block mode ids line (.browser-tabs-card-ids-link); in title/url mode the text (.browser-tabs-card-focus-link). Both have data-window-id and data-tab-id. On click (delegated): read ids; if valid, chrome.windows.update(windowId, { focused: true }); chrome.tabs.update(tabId, { active: true }). Bookmark tags + row flags: after allTabs built (referrers merged), FOR each tab WHERE url is http(s): reply = getCurrentBookmark({ url, title }); mergeBookmarkReplyIntoTab(tab, reply). In RENDER show "Tags: " + join(tab.bookmarkTags) or "—" plus to-read/private indicators when flags are true. How: apply getCurrentBookmark reply to a tab row — tags array plus boolean bookmarkToread / bookmarkPrivate from toread/shared (trim + case-insensitive; defaults toread=no, shared=yes). Clear all three when reply missing, unsuccessful, or blocked.
 * - Contract:
 *   - INPUT: windowScope (currentWindow | all), searchScope (tabInfo | pageText | importantTags), searchQuery (string), tabs list from chrome.tabs
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: visible tabs (filtered), copy URLs to clipboard with count, close visible tabs after confirm with count
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: listDisplayMode = 'block' | 'title' | 'url' (default 'block')
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: MERGE_BOOKMARK_REPLY_INTO_TAB
 *   - IF NOT reply OR NOT reply.success OR NOT reply.data OR reply.data.blocked:
 *   - tab.bookmarkTags = []; tab.bookmarkToread = false; tab.bookmarkPrivate = false; RETURN
 *   - d = reply.data
 *   - tab.bookmarkTags = Array.isArray(d.tags) ? d.tags : []
 *   - exists = !!d.exists
 *   - tab.bookmarkToread = exists AND (trim+lower(d.toread ?? 'no') === 'yes')
 *   - tab.bookmarkPrivate = exists AND (trim+lower(d.shared ?? 'yes') === 'no')
 *
 * ## BUILD_BOOKMARK_TOGGLES_MARKUP
 *
 * - [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] How: render inline to-read indicator and private indicator when tab.bookmarkToread / tab.bookmarkPrivate are true (classes browser-tabs-card-toggle-toread / -private inside .browser-tabs-card-toggles).
 * - Contract:
 *   - INPUT: windowScope (currentWindow | all), searchScope (tabInfo | pageText | importantTags), searchQuery (string), tabs list from chrome.tabs
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: visible tabs (filtered), copy URLs to clipboard with count, close visible tabs after confirm with count
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: tabs = [{ id, windowId, title, url, referrer, pageText?, importantTags? }], visibleTabs = filterBrowserTabs(tabs, searchQuery, searchScope)
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: BUILD_BOOKMARK_TOGGLES_MARKUP
 *   - parts = []
 *   - IF tab.bookmarkToread: parts.push span.browser-tabs-card-toggle-toread (title/aria "To read")
 *   - IF tab.bookmarkPrivate: parts.push span.browser-tabs-card-toggle-private (title/aria "Private")
 *   - IF parts empty: RETURN ''
 *   - RETURN span.browser-tabs-card-toggles wrapping parts
 *   - 1. RENDER (per card, with tags): include buildBookmarkTogglesMarkup(tab) near Tags line
 *
 * ## REFRESH_BOOKMARK_DISPLAY_FOR_ALL_TABS
 *
 * - [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] How: post-batch bookmark refresh — after Set/Clear to-read or Add tags, re-query getCurrentBookmark for every tab in allTabs and mergeBookmarkReplyIntoTab so tags and indicators match storage; then applyFilter().
 * - Contract:
 *   - INPUT: windowScope (currentWindow | all), searchScope (tabInfo | pageText | importantTags), searchQuery (string), tabs list from chrome.tabs
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: visible tabs (filtered), copy URLs to clipboard with count, close visible tabs after confirm with count | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: tabs = [{ id, windowId, title, url, referrer, pageText?, importantTags? }], visibleTabs = filterBrowserTabs(tabs, searchQuery, searchScope)
 *   - EFFECTS: Async, Http, IO
 *   - TERMINATION: total
 * - PROCEDURE: REFRESH_BOOKMARK_DISPLAY_FOR_ALL_TABS
 *   - FOR each tab in allTabs:
 *   - IF tab.url is not http(s): mergeBookmarkReplyIntoTab(tab, { success: false }); CONTINUE
 *   - reply = AWAIT getCurrentBookmark({ url: tab.url, title: tab.title })
 *   - mergeBookmarkReplyIntoTab(tab, reply)  // on error: merge with { success: false }
 *   - applyFilter()
 *
 * ## BLOCK_5
 *
 * - [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] How: Copy URLs / Copy Records / Close: unchanged; act on visibleTabs. Close tabs with tag(s): from visibleTabs take those with Array.isArray(tab.bookmarkTags) && tab.bookmarkTags.length > 0; confirm; chrome.tabs.remove each; then loadTabs(). Close tabs without tags: from visibleTabs take those with !tab.bookmarkTags || !Array.isArray(tab.bookmarkTags) || tab.bookmarkTags.length === 0; confirm; remove each; then loadTabs(). Refresh: clear hidden set then loadTabs() so list repopulates and all tabs can reappear. Batch bookmark actions: Set to-read (fetch then merge to preserve tags; create if missing), Clear to-read (skip if no bookmark), Add tags (create if missing; use reply.data.url). Only http(s) URLs. After each batch, AWAIT refreshBookmarkDisplayForAllTabs() so row tags and to-read/private indicators match storage. SW returns handler response as-is; handler getCurrentBookmark returns plain dataOut. Panel structure: same scroll behavior as Tags tree. Panel (#browserTabsPanel) is the scroll container. First child .browser-tabs-above-list (flex: none): header, window scope, search scope, filter, message, stats line (#browserTabsStats), batch bookmark, actions. Second child .browser-tabs-list-section (min-height: 100%, overflow-y: auto): Title/URL/Block control row immediately above #browserTabsList. Above block scrolls off; list section fills visible height and scrolls list. Implements "Title/URL/Block above list" and "stats line above Tags". Stats line: above batch bookmark (Tags) section, element #browserTabsStats. Display counts from getDisplayedTabs(): displayWindows = unique windowIds in getDisplayedTabs(), displayTabs = getDisplayedTabs().length. Totals from loadTabs: totalWindows = (await chrome.windows.getAll()).length, totalTabs = (await chrome.tabs.query({})).length. Update stats on renderList() and after loadTabs(). Format e.g. "Windows: displayWindows / totalWindows · Tabs: displayTabs / totalTabs". When APIs unavailable (e.g. tests) use 0 or fallback. Implements "stats line showing display group vs all open". Sections and tooltips: controls grouped into sections (Scope, Filter & display, Batch bookmark, List actions, Window actions). Stats line above Batch bookmark. Title/URL/Block in list section above #browserTabsList. Every control has title and where helpful aria-label. Implements "sections for UI controls" and "tooltips on controls". Favicon: allTabs preserve favIconUrl from chrome.tabs. RENDER: each card shows img.browser-tabs-card-favicon with src=tab.favIconUrl (fallback when empty to avoid broken img). Block mode: favicon before title; title/url mode: favicon before the clickable text. Elements: label + textbox only; always use textbox value (parseImportantTagSources); when empty use default list. Textbox persisted in chrome.storage.local on blur; on load populate from storage or default. Control groups: narrow margins (browser-tabs-control-group). Gather: move displayed tabs into current window. currentWindowId = (await chrome.windows.getCurrent()).id; FOR each tab in getDisplayedTabs(): IF tab.windowId !== currentWindowId THEN chrome.tabs.move(tab.id, { windowId: currentWindowId, index: -1 }); show "Gathered N tabs" or "All visible tabs already in this window"; loadTabs(). Distribute: each displayed tab in its own window; skip if already only tab in window. FOR each tab in getDisplayedTabs(): tabsInWindow = await chrome.tabs.query({ windowId: tab.windowId }); IF tabsInWindow.length > 1: chrome.windows.create({ tabId: tab.id }); show "Distributed N tabs"; loadTabs().
 * - Contract:
 *   - INPUT: windowScope (currentWindow | all), searchScope (tabInfo | pageText | importantTags), searchQuery (string), tabs list from chrome.tabs
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: visible tabs (filtered), copy URLs to clipboard with count, close visible tabs after confirm with count
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: tab.favIconUrl from query
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: BLOCK_5
 *   - 1. ON Copy button click: urls = visibleTabs.map(t => t.url); navigator.clipboard.writeText(urls.join('\n')); showToastOrMessage("Copied " + urls.length + " URLs")
 *   - 2. ON Copy Records button click: yamlString = buildRecordsYamlForCopy(visibleTabs); navigator.clipboard.writeText(yamlString); showToastOrMessage("Copied " + visibleTabs.length + " record(s)")
 *   - 3. ON Close button click: IF visibleTabs.length === 0 return; IF NOT confirm("Close " + visibleTabs.length + " tabs?") return; FOR each tab in visibleTabs: chrome.tabs.remove(tab.id); show "Closed N tabs"
 *   - 4. ON Close tagged button click: toClose = visibleTabs.filter(t => Array.isArray(t.bookmarkTags) && t.bookmarkTags.length > 0); IF toClose.length === 0 show message and return; IF NOT confirm("Close N tab(s) with tag(s)?") return; FOR each tab in toClose: chrome.tabs.remove(tab.id); await loadTabs(); show "Closed N tabs"
 *   - 5. ON Close untagged button click: toClose = visibleTabs.filter(t => !Array.isArray(t.bookmarkTags) || t.bookmarkTags.length === 0); IF toClose.length === 0 show message and return; IF NOT confirm("Close N tab(s) without tags?") return; FOR each tab in toClose: chrome.tabs.remove(tab.id); await loadTabs(); show "Closed N tabs"
 *   - 6. ON Refresh button click: hiddenTabIds.clear(); loadTabs()
 *   - 7. ON Set to-read button click: FOR each tab in getDisplayedTabs() WHERE tab.url is http(s): reply = getCurrentBookmark({ url: tab.url, title: tab.title }); IF reply.data.exists AND reply.data.url: saveBookmark({ ...reply.data, toread: 'yes' }); ELSE: urlToSave = reply.data.url || tab.url; saveBookmark({ url: urlToSave, description: tab.title ?? '', tags: [], toread: 'yes', preferredBackend: 'local' }); AWAIT refreshBookmarkDisplayForAllTabs(); show "Set to-read for N tabs"
 *   - 8. ON Clear to-read button click: FOR each tab in getDisplayedTabs(): reply = getCurrentBookmark({ url: tab.url, title: tab.title }); IF reply.success AND reply.data AND NOT reply.data.blocked AND reply.data.exists: saveBookmark({ ...reply.data, toread: 'no' }); ELSE skip; AWAIT refreshBookmarkDisplayForAllTabs(); show "Cleared to-read for N tabs"
 *   - 9. ON Add tags button click: newTags = parseTagsInput(tagsInput.value); IF newTags.length === 0 return; FOR each tab in getDisplayedTabs() WHERE tab.url is http(s): reply = getCurrentBookmark({ url: tab.url, title: tab.title }); IF reply.success AND reply.data AND reply.data.url AND NOT reply.data.blocked: IF reply.data.exists: payload = buildAddTagsPayload(reply.data, newTags); saveBookmark(payload); ELSE: urlToSave = reply.data.url || tab.url; saveBookmark({ url: urlToSave, description: tab.title ?? '', tags: newTags, preferredBackend: 'local' }); AWAIT refreshBookmarkDisplayForAllTabs(); clear tagsInput; show "Added tags for N tabs"
 *   - 10. PANEL LAYOUT: browserTabsPanel = scroll container (overflow-y: auto); browser-tabs-above-list = flex none (contains stats line above batch bookmark section); browser-tabs-list-section = min-height 100% overflow-y auto; first child of list-section = Title|URL|Block radio row; second child = #browserTabsList.
 *   - 11. DATA (in loadTabs): totalWindows, totalTabs from chrome.windows.getAll and chrome.tabs.query({})
 *   - 12. updateStatsLine(): displayed = getDisplayedTabs(); displayW = new Set(displayed.map(t => t.windowId)).size; displayT = displayed.length; set #browserTabsStats text to "Windows: displayW / totalWindows · Tabs: displayT / totalTabs"; call from renderList and after loadTabs
 *   - 13. SECTIONS: section.browser-tabs-section-scope, section.browser-tabs-section-filter, stats line (above bookmark section), section.browser-tabs-section-bookmark, section.browser-tabs-section-actions, section.browser-tabs-section-window. Within sections use .browser-tabs-control-group with margin 0.125rem 0 for tight grouping. Order in Filter & display: (1) filter textbox, (2) Elements (label + textbox). In list section: (1) Title | URL | Block row, (2) #browserTabsList.
 *   - 14. TOOLTIPS: title attribute (and aria-label) on each button, input, label group describing use
 *   - 15. RENDER: <img class="browser-tabs-card-favicon" src="..." alt=""> before title/url in all modes; fallback src or hide when no favicon
 *   - 16. parseImportantTagSources(str): return str.trim().split(',').map(s => s.trim()).filter(Boolean)
 *   - 17. ON load: read storage for textbox; populate input or default
 *   - 18. ON GET_TABS_IMPORTANT_TAGS: data.tabs; data.importantTagSources = parseImportantTagSources(textboxValue); IF empty THEN default list (DEFAULT_IMPORTANT_TAG_SOURCES)
 *   - 19. ON Gather button click: displayed = getDisplayedTabs(); currentWin = await chrome.windows.getCurrent(); moved = 0; FOR each tab in displayed: IF tab.windowId !== currentWin.id: await chrome.tabs.move(tab.id, { windowId: currentWin.id, index: -1 }); moved++; show message; loadTabs()
 *   - 20. ON Distribute button click: displayed = getDisplayedTabs(); distributed = 0; FOR each tab in displayed: list = await chrome.tabs.query({ windowId: tab.windowId }); IF list.length > 1: await chrome.windows.create({ tabId: tab.id }); distributed++; show message; loadTabs()
 *
 * ## TABS_CREATE_PREFERRED_BACKEND
 *
 * - [IMPL-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [REQ-SIDE_PANEL_BROWSER_TABS] How: Product rule — batch/create from Tabs panel uses preferredBackend local (not Options defaultStorageMode); changing this needs dedicated CITDP.
 * - Contract:
 *   - INPUT: create payload for missing bookmark from tab URL
 *   - PRE: tab url is http(s)
 *   - OUTPUT: saveBookmark payload with preferredBackend local
 *   - POST:
 *     - success => new bookmarks from Tabs land in Local store unless an existing bookmark was updated in place
 *   - CONTROL: preferredBackend fixed to local for create-from-tabs; Options defaultStorageMode is not consulted on this path
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: TABS_CREATE_PREFERRED_BACKEND
 *   - 1. WHEN creating a bookmark because none exists for tab URL: SET preferredBackend = 'local'
 *   - 2. WHEN updating an existing bookmark (exists): preserve existing backend via saveBookmark merge (no preferredBackend override required)
 *
 * === END IMPL-FULL-BLOCK: IMPL-SIDE_PANEL_BROWSER_TABS ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-SIDE_PANEL_RECENTLY_CLOSED_TABS ===
 * [IMPL-SIDE_PANEL_RECENTLY_CLOSED_TABS] [ARCH-SIDE_PANEL_RECENTLY_CLOSED_TABS] [REQ-SIDE_PANEL_RECENTLY_CLOSED_TABS] — Tab source toggle and recently closed tabs integration. Extends IMPL-SIDE_PANEL_BROWSER_TABS with open | recentlyClosed | both.
 *
 * ## NORMALIZE_CLOSED_SESSIONS
 *
 * - [REQ-SIDE_PANEL_RECENTLY_CLOSED_TABS] [ARCH-SIDE_PANEL_RECENTLY_CLOSED_TABS] [IMPL-SIDE_PANEL_RECENTLY_CLOSED_TABS] How: normalizeClosedSessions(sessions): pure. Flatten Session[] from getRecentlyClosed; each tab: id=sessionId, sessionId, title, url, lastModified, isClosed=true, referrer='', pageText='', importantTags=''. Window sessions: recurse into tabs.
 * - Contract:
 *   - INPUT: context / caller args
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: result
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: tabSource = 'open' | 'recentlyClosed' | 'both' (default 'open')
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: NORMALIZE_CLOSED_SESSIONS
 *   - result = []; FOR each s in sessions: IF s.tab: result.push({ id: s.tab.sessionId, sessionId: s.tab.sessionId, title: s.tab.title??'', url: s.tab.url??'', lastModified: s.lastModified, isClosed: true, referrer: '', pageText: '', importantTags: '' }); IF s.window && s.window.tabs: FOR each t in s.window.tabs: result.push({ id: t.sessionId, sessionId: t.sessionId, title: t.title??'', url: t.url??'', lastModified: s.lastModified, isClosed: true, referrer: '', pageText: '', importantTags: '' }); RETURN result
 *
 * ## BLOCK_2
 *
 * - [REQ-SIDE_PANEL_RECENTLY_CLOSED_TABS] [ARCH-SIDE_PANEL_RECENTLY_CLOSED_TABS] [IMPL-SIDE_PANEL_RECENTLY_CLOSED_TABS] How: GET_RECENTLY_CLOSED_TABS (SW): sessions = chrome.sessions.getRecentlyClosed({ maxResults: 25 }); tabs = normalizeClosedSessions(sessions); RETURN { success: true, data: tabs } loadTabs: when tabSource=open: existing chrome.tabs path. When recentlyClosed: sendMessage GET_RECENTLY_CLOSED_TABS; allTabs = response.data. When both: openTabs = chrome.tabs.query; closedTabs = GET_RECENTLY_CLOSED_TABS; allTabs = openTabs.concat(closedTabs). Scope restriction: when tabSource includes recentlyClosed, searchScope forced to tabInfo; Page text and Elements disabled with note. Restore: closed tab card has data-action=restoreTab data-session-id. ON click: chrome.sessions.restore(sessionId); loadTabs(). Open tab keeps data-action=closeTab. buildRecordsYamlForCopy: for closed tabs include sessionId and lastModified; id may be sessionId string. hiddenTabIds: use tab.id (numeric for open, sessionId string for closed). getDisplayedTabs filters by !hiddenTabIds.has(t.id). Sessions API check: if !chrome.sessions: hide tab source options recentlyClosed and both; show only Open. Gather/Distribute: when tabSource=recentlyClosed or all displayed are closed, hide or disable Gather and Distribute. Close: only for open tabs. toClose = visibleTabs.filter(t => !t.isClosed); confirm; chrome.tabs.remove each; loadTabs()
 * - Contract:
 *   - INPUT: context / caller args
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: result
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: tabSource = 'open' | 'recentlyClosed' | 'both' (default 'open')
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: BLOCK_2
 *   - 1. ON GET_RECENTLY_CLOSED_TABS (service worker): sessions = AWAIT chrome.sessions.getRecentlyClosed({ maxResults: 25 }); tabs = normalizeClosedSessions(sessions); RETURN { success: true, data: tabs }
 *   - 2. ON loadTabs: IF tabSource === 'open': (existing path); IF tabSource === 'recentlyClosed': allTabs = AWAIT sendMessage(GET_RECENTLY_CLOSED_TABS).data; IF tabSource === 'both': openTabs = AWAIT chrome.tabs.query(...); closedTabs = AWAIT sendMessage(GET_RECENTLY_CLOSED_TABS).data; allTabs = openTabs.concat(closedTabs)
 *   - 3. IF tabSource !== 'open': searchScope = 'tabInfo'; disable pageText/importantTags radios; show note
 *   - 4. RENDER (closed tab): Restore button (data-action=restoreTab, data-session-id); no Close button
 *   - 5. ON restoreTab click: sessionId = data-session-id; AWAIT chrome.sessions.restore(sessionId); loadTabs()
 *   - 6. buildRecordsYamlForCopy: IF tab.isClosed: add sessionId, lastModified to YAML entry
 *   - 7. IF !chrome.sessions: tabSourceOptions = ['open'] only
 *   - 8. IF tabSource === 'recentlyClosed' OR (tabSource === 'both' AND getDisplayedTabs().every(t => t.isClosed)): hide Gather, Distribute
 *   - 9. ON Close: toClose = visibleTabs.filter(t => !t.isClosed); confirm; FOR each in toClose: chrome.tabs.remove(t.id); loadTabs()
 *
 * === END IMPL-FULL-BLOCK: IMPL-SIDE_PANEL_RECENTLY_CLOSED_TABS ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-SIDE_PANEL_TAGS_TREE ===
 * [IMPL-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [REQ-SIDE_PANEL_TAGS_TREE] — This block defines the overall feature: side panel tags tree opened from popup; panel shows tag→urls tree; click URL opens in new tab. Implements REQ by providing the side-panel entry and tag-tree UX; implements ARCH by following the open-flow and data-flow decisions.
 *
 * ## BUILD_TAG_TO_BOOKMARKS
 *
 * - [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE] How: Popup entry: implements requirement "open tags tree from popup" by sending OPEN_SIDE_PANEL. ARCH prescribes message-based open; this block is the popup side. SW open in user gesture: implements requirement that side panel opens in response to user click. chrome.sidePanel.open() may only be called in user gesture (no await). So: maintain cached normal windowId; on OPEN_SIDE_PANEL handle in onMessage synchronously (no await before open). Implements ARCH open flow. Panel load: implements tag tree data flow; uses getAggregatedBookmarksForIndex (local+file+sync+browser; no Pinboard) then load config, apply filters, sort, group, build tag map and tag list, render. Implements REQ filters/sort/group and config persistence. When panel is tabbed, Tags tree is second tab; load/render runs on tab select or first show. initTagsTreeTab(options) is callable from side-panel.js when user selects Tags tree tab; optional currentBookmarkTags syncs tag selector to current bookmark. Implements "Tags tree tab" in tabbed panel and "tag selector matches current bookmark; tree shows only bookmarks that share at least one tag". Placeholder/demo mode (?demo=1 or ?screenshot=1): loadPlaceholderForScreenshot uses tagsTreePlaceholderBookmarks (tags-tree-demo-data.js), a rich set (25+ bookmarks, 15+ tags, time/updated_at, extended) so the By Tag demo GIF shows tag selector, tree, filters and search. Set rawBookmarks so tag toggle invokes refreshFromConfig; then tagToBookmarks, allTags, selectedTagOrder; hide load error and empty state; renderTagSelector(); renderTree(). buildTagToBookmarks: implements requirement "tag-based tree" by producing Map<tag, [{ title, url }]> from bookmarks. One pass; trim/dedupe per tag.
 * - Contract:
 *   - INPUT: user click in popup (open Tags tree); panel page load; user actions in panel (select/reorder tags, expand/collapse, click URL)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: side panel visible; tag selector and hierarchical tree rendered; URL opens in new tab on click | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: bookmarks (from getAggregatedBookmarksForIndex = local+file+sync+browser; no Pinboard), config (expanded, timeField, timeStart, timeEnd, tagsInclude, domains, groupBy, sortBy, sortAsc, selectedTagOrder, showAllTags), filtered bookmarks, tagToBookmarks (Map tag → [{ title, url }]), allTags (string[]), collapsedTags/collapsedSections (Set), panel DOM refs
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: BUILD_TAG_TO_BOOKMARKS
 *   - result = new Map()
 *   - FOR each b in bookmarks:
 *   - tags = Array.isArray(b.tags) ? b.tags : []; title = b.description || b.url || ''
 *   - FOR each tag in tags:
 *   - tagKey = String(tag).trim(); IF empty skip
 *   - IF result has no key tagKey THEN result[tagKey] = []; result[tagKey].push({ title, url: b.url })
 *   - RETURN result
 *
 * ## GET_ALL_TAGS_FROM_BOOKMARKS
 *
 * - [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE] How: getAllTagsFromBookmarks: implements tag selector data by returning sorted unique tags from bookmarks.
 * - Contract:
 *   - INPUT: user click in popup (open Tags tree); panel page load; user actions in panel (select/reorder tags, expand/collapse, click URL)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: side panel visible; tag selector and hierarchical tree rendered; URL opens in new tab on click
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: bookmarks (from getAggregatedBookmarksForIndex = local+file+sync+browser; no Pinboard), config (expanded, timeField, timeStart, timeEnd, tagsInclude, domains, groupBy, sortBy, sortAsc, selectedTagOrder, showAllTags), filtered bookmarks, tagToBookmarks (Map tag → [{ title, url }]), allTags (string[]), collapsedTags/collapsedSections (Set), panel DOM refs
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: GET_ALL_TAGS_FROM_BOOKMARKS
 *   - set = new Set(); FOR each b in bookmarks: FOR each t in (b.tags || []): set.add(String(t).trim())
 *   - RETURN sorted Array.from(set)
 *
 * ## GET_TAGS_TO_DISPLAY
 *
 * - [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE] How: Tag list view mode: implements "user can switch between all tags and only checked tags; choice persisted". showAllTags boolean in config; when true display allTags, when false display selectedTagOrder filtered by allTags (avoid stale tags). Persisted in panel config.
 * - Contract:
 *   - INPUT: user click in popup (open Tags tree); panel page load; user actions in panel (select/reorder tags, expand/collapse, click URL)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: side panel visible; tag selector and hierarchical tree rendered; URL opens in new tab on click
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: bookmarks (from getAggregatedBookmarksForIndex = local+file+sync+browser; no Pinboard), config (expanded, timeField, timeStart, timeEnd, tagsInclude, domains, groupBy, sortBy, sortAsc, selectedTagOrder, showAllTags), filtered bookmarks, tagToBookmarks (Map tag → [{ title, url }]), allTags (string[]), collapsedTags/collapsedSections (Set), panel DOM refs
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: GET_TAGS_TO_DISPLAY
 *   - IF showAllTags THEN RETURN allTags
 *   - allSet = Set(allTags); RETURN selectedTagOrder filtered to items IN allSet (preserve order)
 *
 * ## RENDER_TAG_SELECTOR
 *
 * - [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE] How: renderTagSelector: implements tag selection and order UI and compact layout. Renders checkboxes for visibleTags = getTagsToDisplay(allTags, selectedTagOrder, config.showAllTags); on checkbox change save selectedTagOrder and refreshFromConfig; toggle change updates showAllTags, savePanelConfig, renderTagSelector only.
 * - Contract:
 *   - INPUT: user click in popup (open Tags tree); panel page load; user actions in panel (select/reorder tags, expand/collapse, click URL)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: side panel visible; tag selector and hierarchical tree rendered; URL opens in new tab on click
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: bookmarks (from getAggregatedBookmarksForIndex = local+file+sync+browser; no Pinboard), config (expanded, timeField, timeStart, timeEnd, tagsInclude, domains, groupBy, sortBy, sortAsc, selectedTagOrder, showAllTags), filtered bookmarks, tagToBookmarks (Map tag → [{ title, url }]), allTags (string[]), collapsedTags/collapsedSections (Set), panel DOM refs
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: RENDER_TAG_SELECTOR
 *   - visibleTags = getTagsToDisplay(allTags, selectedTagOrder, config.showAllTags)
 *   - render list of tags (visibleTags) with selection state (checked iff in selectedTagOrder) and compact layout; on change save selectedTagOrder and refreshFromConfig
 *   - 1. ON tag list view toggle: config.showAllTags = NOT config.showAllTags; savePanelConfig(config); renderTagSelector()
 *
 * ## RENDER_TREE
 *
 * - [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE] How: renderTree: implements collapsible URL lists per tag; each section has tag label + toggle + list of title+URL.
 * - Contract:
 *   - INPUT: user click in popup (open Tags tree); panel page load; user actions in panel (select/reorder tags, expand/collapse, click URL)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: side panel visible; tag selector and hierarchical tree rendered; URL opens in new tab on click
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: bookmarks (from getAggregatedBookmarksForIndex = local+file+sync+browser; no Pinboard), config (expanded, timeField, timeStart, timeEnd, tagsInclude, domains, groupBy, sortBy, sortAsc, selectedTagOrder, showAllTags), filtered bookmarks, tagToBookmarks (Map tag → [{ title, url }]), allTags (string[]), collapsedTags/collapsedSections (Set), panel DOM refs
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: RENDER_TREE
 *   - FOR each tag in selectedTagOrder: entries = tagToBookmarks.get(tag) || []; render section (tag + toggle + list); store url for click
 *
 * ## BLOCK_6
 *
 * - [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE] How: refreshFromConfig: syncConfigFromControls; savePanelConfig; IF !rawBookmarks or length 0 RETURN (no re-render). filterState = getFilterStateForTagsTree(panelConfig, selectedTagOrder); filtered = applyFilters(rawBookmarks, filterState); sorted = sortBookmarks(filtered, ...); matchingBookmarks = search filter or sorted; IF groupBy !== 'none' renderGrouped ELSE tagToBookmarks = buildTagToBookmarks(matchingBookmarks, allTags); renderTagSelector(); renderTree(); updateSearchCount; scrollToMatch. Config expand/collapse: implements requirement that config region is expandable for use and collapsible to maximize bookmarks space; toggle loads/saves expanded state; when collapsed only compact bar visible; when expanded show full filter and display controls. Filter pipeline: implements requirement to filter by create/update time range, tags include, and domain. Apply in sequence: time range (field + startMs/endMs), then tags include (bookmark must have at least one tag in set), then domains (URL hostname in set). Empty set or null bounds mean no filter for that step. getDomainFromUrl: implements domain filter/group by returning hostname from URL; invalid or empty URL returns empty string; no throw. filterByTimeRange: implements time range filter; uses bookmark time or updated_at per field; null start/end means no bound; inclusive. filterByTagsInclude: implements tags include filter; empty tagSet = all pass; otherwise bookmark must have at least one tag (case-insensitive) in set. filterByDomains: implements domain filter; empty domainSet = all pass; otherwise bookmark's getDomainFromUrl(url) in domainSet (case-insensitive). sortBookmarks: implements display sort by chosen axis (time, updated_at, tag, domain) and direction (sortAsc). For time use ms; for tag use first tag or ''; for domain use getDomainFromUrl. groupBookmarksBy: implements display group by; returns structure for sectioned render (e.g. Map<groupKey, bookmark[]>). groupBy in 'none' | 'time' | 'updated_at' | 'tag' | 'domain'; bucket keys for date (e.g. date string); per-tag or per-domain one key per value. renderGrouped: implements collapsible sectioned display when groupBy not none; each section has header (toggle) and list of bookmark links; click URL opens in new tab. loadPanelConfig / savePanelConfig: implements config state persistence; read/write expanded, timeField, timeStart, timeEnd, tagsInclude, domains, groupBy, sortBy, sortAsc, selectedTagOrder, showAllTags to chrome.storage.local. showAllTags defaults true for backward compatibility. openUrlInNewTab / ON click URL: implements "click-to-open in new tab" requirement via chrome.tabs.create({ url }). Tags tree panel layout: panel (#tagsTreePanel) is the scroll container so the above-list div can scroll off the page; .tree-section has min-height 100% so it consumes full visible height when the div is scrolled off and scrolls its list. Implements "tab content fills vertical space" for Tags tree tab. DOM: #tagsTreePanel > .tags-tree-above-list > (header, config-section, search-section, tag-selector-section) + .tree-section
 * - Contract:
 *   - INPUT: user click in popup (open Tags tree); panel page load; user actions in panel (select/reorder tags, expand/collapse, click URL)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: side panel visible; tag selector and hierarchical tree rendered; URL opens in new tab on click
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: bookmarks (from getAggregatedBookmarksForIndex = local+file+sync+browser; no Pinboard), config (expanded, timeField, timeStart, timeEnd, tagsInclude, domains, groupBy, sortBy, sortAsc, selectedTagOrder, showAllTags), filtered bookmarks, tagToBookmarks (Map tag → [{ title, url }]), allTags (string[]), collapsedTags/collapsedSections (Set), panel DOM refs
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: BLOCK_6
 *   - 1. refreshFromConfig(): syncConfigFromControls(); savePanelConfig(); IF !rawBookmarks or rawBookmarks.length === 0 RETURN; filterState = getFilterStateForTagsTree(panelConfig, selectedTagOrder); filtered = applyFilters(rawBookmarks, filterState); sorted = sortBookmarks(filtered, panelConfig.sortBy, panelConfig.sortAsc); matchingBookmarks = searchQuery ? filterBookmarksBySearch(sorted, searchQuery) : sorted; IF panelConfig.groupBy !== 'none' THEN renderGrouped(matchingBookmarks) ELSE tagToBookmarks = buildTagToBookmarks(matchingBookmarks, allTags); renderTagSelector(); renderTree(); updateSearchCount(); scrollToMatch(searchMatchIndex)
 *   - 2. ON config toggle click: config.expanded = NOT config.expanded; savePanelConfig(config); renderConfigToggle(config.expanded); show or hide config content
 *   - 3. applyFilters(bookmarks, config): list = bookmarks; list = filterByTimeRange(list, config.timeField, config.timeStart, config.timeEnd); list = filterByTagsInclude(list, config.tagsInclude); list = filterByDomains(list, config.domains); RETURN list
 *   - 4. getDomainFromUrl(url): IF !url or !String(url).trim() RETURN ''; TRY parse url; RETURN hostname (lowercase) OR ''
 *   - 5. filterByTimeRange(bookmarks, field, startMs, endMs): RETURN bookmarks WHERE inTimeRange(b, field, startMs, endMs)  // inTimeRange: get ms from b; if null return false; if startMs and ms < startMs return false; if endMs and ms > endMs return false; return true
 *   - 6. filterByTagsInclude(bookmarks, tagSet): IF !tagSet or size 0 RETURN bookmarks; RETURN bookmarks WHERE (b.tags normalized) INTERSECT tagSet non-empty
 *   - 7. filterByDomains(bookmarks, domainSet): IF !domainSet or size 0 RETURN bookmarks; RETURN bookmarks WHERE getDomainFromUrl(b.url) in domainSet
 *   - 8. sortBookmarks(bookmarks, sortBy, sortAsc): sort list by sortBy key; if sortAsc ascending else descending; RETURN sorted array
 *   - 9. groupBookmarksBy(bookmarks, groupBy): IF groupBy === 'none' RETURN null or flat; result = Map(); FOR b in bookmarks: key = keyFor(b, groupBy); append b to result[key]; RETURN result
 *   - 10. renderGrouped(grouped, config): FOR each groupKey in grouped: render section header (groupKey + toggle); render list of title+URL; store url for click → openUrlInNewTab(url)
 *   - 11. loadPanelConfig(): get from chrome.storage.local; RETURN defaults for missing keys (showAllTags default true)
 *   - 12. savePanelConfig(config): chrome.storage.local.set(config keyed by storage keys)
 *   - 13. ON click URL in tree: url = event target url; openUrlInNewTab(url)  // openUrlInNewTab(url) => chrome.tabs.create({ url })
 *   - 14. CSS #tagsTreePanel: display block; flex 1 1 0; min-height 0; overflow-y auto; background var(--color-background)
 *   - 15. CSS .tags-tree-above-list: flex none (natural height; scrolls off with panel scroll)
 *   - 16. CSS .tree-section: min-height 100%; overflow-y auto
 *
 * === END IMPL-FULL-BLOCK: IMPL-SIDE_PANEL_TAGS_TREE ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-UI_INSPECTOR ===
 * [IMPL-UI_INSPECTOR] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION] — recordMessage/recordAction ring buffers; getLastMessages/getLastActions; debug-gated. Contract: message or action in; ring buffers and getters; enabled flag.
 *
 * ## MAIN
 *
 * - [IMPL-UI_INSPECTOR] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION] How: Logical block for IMPL-UI_INSPECTOR.
 * - Contract:
 *   - INPUT: message (recordMessage); action (recordAction); gated by DEBUG_HOVERBOARD_UI or setEnabled(true)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: ring buffers of last N messages and last N actions; getLastMessages(), getLastActions()
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: message ring buffer; action ring buffer; enabled flag
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: MAIN
 *   - How (sub-block): Append to buffer when enabled; drop oldest if full.
 *   - 1. recordMessage(msg): IF enabled: APPEND to message buffer; DROP oldest if full
 *   - 2. recordAction(action): IF enabled: APPEND to action buffer; DROP oldest if full
 *   - How (sub-block): Return copy of buffers.
 *   - 3. getLastMessages(), getLastActions(): RETURN copy of buffer(s)
 *   - How (sub-block): Service-worker records message; PopupController/content record action.
 *   - 4. Wiring: service-worker after handle message -> recordMessage; PopupController/content-main on action -> recordAction
 *
 * ## RECORD_INJECTION_OUTCOME
 *
 * - [IMPL-UI_INSPECTOR] [IMPL-POPUP_SESSION] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION] [REQ-SUGGESTED_TAGS_FROM_CONTENT] How: Observable contract for script-injection skips and results — PopupController/side-panel recordAction({ actionId: "injectionOutcome", surface, payload: { phase, trigger, tabId, urlHost, reason, injectable, errorMessage? } }). testable when setEnabled(true); used by tabChangeRefresh composition and unit inject precheck tests.
 * - Contract:
 *   - INPUT: phase, reason, injectable, optional trigger/surface/tabId/urlHost/errorMessage
 *   - PRE: recordAction available (no-op when inspector disabled)
 *   - OUTPUT: action appended when enabled
 *   - POST:
 *     - success => last actions include injectionOutcome with closed-set reason codes
 *   - FAILURE_MODES: none
 *   - DATA: action ring buffer
 *   - DATA_TRANSITION: buffer grows (or rotates) when enabled; else unchanged
 *   - EFFECTS: State
 *   - TERMINATION: total
 * - PROCEDURE: RECORD_INJECTION_OUTCOME
 *   - recordAction({ actionId: "injectionOutcome", surface, payload })
 *
 * ## RECORD_MESSAGE_RESPONSE_MISSING
 *
 * - [IMPL-UI_INSPECTOR] [IMPL-MESSAGE_HANDLING] [ARCH-UI_TESTABILITY] [ARCH-MESSAGE_HANDLING] [REQ-UI_INSPECTION] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] How: Observable contract when runtime reply is null/undefined — content-main recordAction({ actionId: "messageResponseMissing", surface: "content", payload: { type } }) instead of throwing on response.success.
 * - Contract:
 *   - INPUT: message type string that expected a reply
 *   - PRE: unwrapMessageResponse returned null; inspector may be disabled
 *   - OUTPUT: action appended when enabled; caller keeps defaults
 *   - POST:
 *     - success => messageResponseMissing observable; no TypeError
 *   - FAILURE_MODES: none
 *   - DATA: action ring buffer
 *   - DATA_TRANSITION: buffer grows when enabled
 *   - EFFECTS: State
 *   - TERMINATION: total
 * - PROCEDURE: RECORD_MESSAGE_RESPONSE_MISSING
 *   - recordAction({ actionId: "messageResponseMissing", surface: "content", payload: { type } })
 *
 * === END IMPL-FULL-BLOCK: IMPL-UI_INSPECTOR ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-DEV_COMMAND_INSPECTION ===
 * [IMPL-DEV_COMMAND_INSPECTION] [REQ-UI_INSPECTION] [REQ-URL_TAGS_DISPLAY] [REQ-PER_BOOKMARK_STORAGE_BACKEND] — DEV_COMMAND routing for current bookmark, tags, backend, and storage snapshot (debug-gated). Contract: message shape, returned data, and handler locations.
 *
 * ## PROCESS_DEV_COMMAND
 *
 * - [IMPL-DEV_COMMAND_INSPECTION] [REQ-UI_INSPECTION] [REQ-URL_TAGS_DISPLAY] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Implements processDevCommand(cmd) behavior for IMPL-DEV_COMMAND_INSPECTION.
 * - Contract:
 *   - INPUT: DEV_COMMAND message with subcommand (getCurrentBookmark | getTagsForUrl | getStorageBackendForUrl | getStorageSnapshot); optional url/context
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: current bookmark for URL, tags for URL, backend for URL, or storage key list (SW only); gated by DEBUG_HOVERBOARD_UI
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: MessageHandler.processDevCommand; service worker getStorageSnapshot
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: PROCESS_DEV_COMMAND
 *   - IF subcommand getCurrentBookmark: RETURN bookmarkRouter.getBookmarkForUrl(url) or current tab url
 *   - IF getTagsForUrl: RETURN tags for url
 *   - IF getStorageBackendForUrl: RETURN storageIndex.getBackendForUrl(url)
 *   - IF getStorageSnapshot (SW): RETURN list of storage key names only
 *
 * === END IMPL-FULL-BLOCK: IMPL-DEV_COMMAND_INSPECTION ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-SERVICE_WORKER ===
 * [IMPL-SERVICE_WORKER] [ARCH-SERVICE_WORKER] [REQ-MANIFEST_V3_MIGRATION] — How: MV3 service worker owns messaging, badge, recent-tags memory, and lifecycle wake/sleep.
 *
 * ## SERVICE_WORKER_MAIN
 *
 * - [IMPL-SERVICE_WORKER] [ARCH-SERVICE_WORKER] [REQ-MANIFEST_V3_MIGRATION] How: wire listeners once; delegate business logic to validated modules.
 * - Contract:
 *   - INPUT: chrome.runtime.onMessage; install/activate; alarms; port connections
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: routed handler results; badge updates; persisted recent-tags snapshot; keep-alive while async work runs
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: src/core/service-worker.js; MessageHandler; RecentTagsMemoryManager; updateBadgeForTab
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: SERVICE_WORKER_MAIN
 *   - ON install/activate: AWAIT initManagers()
 *   - ON message (msg, sender, sendResponse):
 *   - result = AWAIT handleMessage(msg, sender)
 *   - sendResponse(result); RETURN true
 *   - ON alarm: AWAIT runDeferredTasks()
 *   - RETURN
 *   - How (sub-block): How: after processMessage success for bookmark/tag mutations, refresh badge.
 *
 * ## HANDLE_MESSAGE
 *
 * - [IMPL-SERVICE_WORKER] [ARCH-SERVICE_WORKER] [REQ-MANIFEST_V3_MIGRATION] How: Implements handleMessage(msg, sender) behavior for IMPL-SERVICE_WORKER.
 * - Contract:
 *   - INPUT: chrome.runtime.onMessage; install/activate; alarms; port connections
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: routed handler results; badge updates; persisted recent-tags snapshot; keep-alive while async work runs
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: src/core/service-worker.js; MessageHandler; RecentTagsMemoryManager; updateBadgeForTab
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: HANDLE_MESSAGE
 *   - result = AWAIT messageHandler.processMessage(msg, sender)
 *   - IF result.ok AND isMutation(msg.type): AWAIT updateBadgeForTab(resolveTab(sender, msg))
 *   - RETURN result
 *
 * === END IMPL-FULL-BLOCK: IMPL-SERVICE_WORKER ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-EXT_IDENTITY ===
 * [IMPL-EXT_IDENTITY] [ARCH-EXT_IDENTITY] [REQ-EXTENSION_IDENTITY] — How: present Hoverboard as a Chromium extension with content-script injection and Pinboard-compatible UX surfaces.
 *
 * ## BOOTSTRAP_EXTENSION
 *
 * - [IMPL-EXT_IDENTITY] [ARCH-EXT_IDENTITY] [REQ-EXTENSION_IDENTITY] How: MV3 entry points register once; content script bootstraps page UI when URL allowed.
 * - Contract:
 *   - INPUT: extension install/load; manifest entry points (service worker, content scripts, popup, options, side panel)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: loaded extension identity (name, permissions, entry points); content scripts on matching pages
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: manifest.json; src/core/service-worker.js; content script entry; browser API shim (IMPL-CROSS_BROWSER)
 *   - EFFECTS: Http, IO
 *   - TERMINATION: total
 * - PROCEDURE: BOOTSTRAP_EXTENSION
 *   - REGISTER service worker message listeners
 *   - ON content script load: IF URL not inhibited THEN init overlay/hover surface
 *   - EXPOSE popup / side panel / options as user-facing surfaces
 *   - RETURN
 *
 * === END IMPL-FULL-BLOCK: IMPL-EXT_IDENTITY ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-MV3_MIGRATION ===
 * [IMPL-MV3_MIGRATION] [ARCH-MV3_MIGRATION] [REQ-MANIFEST_V3_MIGRATION] — How: keep store-compatible Manifest V3: service worker replaces background page; preserve messaging and APIs.
 *
 * ## MV3_BACKGROUND_RUNTIME
 *
 * - [IMPL-MV3_MIGRATION] [ARCH-MV3_MIGRATION] [REQ-MANIFEST_V3_MIGRATION] How: service worker owns listeners; async message replies use return true / Promise patterns.
 * - Contract:
 *   - INPUT: extension lifecycle events; chrome.runtime / chrome.storage / chrome.action calls
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: service-worker-backed background behavior equivalent to prior MV2 background page contracts
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: manifest_version 3; src/core/service-worker.js; ARCH-SERVICE_WORKER lifecycle patterns
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: MV3_BACKGROUND_RUNTIME
 *   - ON install/activate: init shared managers (config, tags memory, badge)
 *   - ON message: DELEGATE to MessageHandler; KEEP channel alive until AWAIT completes
 *   - ON alarm/idle as needed: wake worker for deferred work
 *   - RETURN
 *
 * === END IMPL-FULL-BLOCK: IMPL-MV3_MIGRATION ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-PLAYWRIGHT_E2E_EXTENSION ===
 * [IMPL-PLAYWRIGHT_E2E_EXTENSION] [ARCH-UI_TESTABILITY] [ARCH-MESSAGE_HANDLING] [REQ-UI_INSPECTION] [REQ-THIS_PAGE_TAG_SORT] [REQ-AI_TAGGING_POPUP] — How: build unpacked extension then drive Chromium persistent context for popup, messaging, overlay, options, side panel E2E.
 *
 * ## LAUNCH_EXTENSION_CONTEXT
 *
 * - [IMPL-PLAYWRIGHT_E2E_EXTENSION] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION] How: global setup builds extension; fixture launches persistent context and resolves extension id.
 * - Contract:
 *   - INPUT: npm run test:e2e:extension; playwright.extension.config.js; built dist/ extension
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: pass/fail Playwright reports for extension surfaces; getExtensionId for page evaluation | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: tests/playwright/global-setup.js; extension-fixture.js; extension-*.spec.js
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: LAUNCH_EXTENSION_CONTEXT
 *   - AWAIT buildExtensionDist()
 *   - context = launchPersistentContext(userDataDir, args with --load-extension)
 *   - extensionId = AWAIT getExtensionId(context)
 *   - RETURN { context, extensionId }
 *   - How (sub-block): How: specs open popup/side panel/options pages and assert messaging/UI contracts without rewriting product logic.
 *
 * ## RUN_EXTENSION_SPECS
 *
 * - [IMPL-PLAYWRIGHT_E2E_EXTENSION] [ARCH-UI_TESTABILITY] [ARCH-MESSAGE_HANDLING] [REQ-UI_INSPECTION] [REQ-THIS_PAGE_TAG_SORT] [REQ-AI_TAGGING_POPUP] How: Implements RUN_EXTENSION_SPECS behavior for IMPL-PLAYWRIGHT_E2E_EXTENSION.
 * - Contract:
 *   - INPUT: npm run test:e2e:extension; playwright.extension.config.js; built dist/ extension
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: pass/fail Playwright reports for extension surfaces; getExtensionId for page evaluation | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: tests/playwright/global-setup.js; extension-fixture.js; extension-*.spec.js
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: RUN_EXTENSION_SPECS
 *   - FOR each extension-*.spec: use LAUNCH_EXTENSION_CONTEXT; exercise surface; ASSERT expectations
 *   - RETURN
 *
 * === END IMPL-FULL-BLOCK: IMPL-PLAYWRIGHT_E2E_EXTENSION ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-LIBRARY_SEARCH_ENTRY ===
 * [IMPL-LIBRARY_SEARCH_ENTRY] [ARCH-LIBRARY_SEARCH_ENTRY] [REQ-LIBRARY_SEARCH_ENTRY] — Capture UI Search Bookmarks opens Index with ?q=; distinct from Search tabs.
 *
 * ## Build Index URL with query
 *
 * - [IMPL-LIBRARY_SEARCH_ENTRY] [ARCH-LIBRARY_SEARCH_ENTRY] [REQ-LIBRARY_SEARCH_ENTRY] How: Pure URL builder shared by SW and tests; append encoded q.
 * - Contract:
 *   - INPUT: baseUrl (string), query (string)
 *   - PRE: baseUrl may be empty
 *   - OUTPUT: baseUrl unchanged when query empty; else baseUrl + ?q= or &q= encodeURIComponent(query)
 *   - POST:
 *     - success => empty query returns baseUrl; non-empty query includes encoded q
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: BUILD_BOOKMARKS_INDEX_URL_WITH_QUERY
 *   - 1. q = trim(query)
 *   - 2. IF baseUrl empty THEN RETURN ""
 *   - 3. IF q empty THEN RETURN baseUrl
 *   - 4. sep = IF baseUrl contains "?" THEN "&" ELSE "?"
 *   - 5. RETURN baseUrl + sep + "q=" + encodeURIComponent(q)
 *
 * ## Open library search from capture UI
 *
 * - [IMPL-LIBRARY_SEARCH_ENTRY] [ARCH-LIBRARY_SEARCH_ENTRY] [REQ-LIBRARY_SEARCH_ENTRY] How: Read Search Bookmarks input; send OPEN_BOOKMARKS_INDEX with q (does not replace Search tabs).
 * - Contract:
 *   - INPUT: librarySearchInput value (string)
 *   - PRE: sendMessage available
 *   - OUTPUT: OPEN_BOOKMARKS_INDEX message with data.q
 *   - POST:
 *     - success => SW opens Index tab; Index search prefilled when q non-empty
 *   - EFFECTS: Async, State
 *   - TERMINATION: total
 * - PROCEDURE: OPEN_LIBRARY_SEARCH
 *   - 1. q = trim(librarySearchInput.value)
 *   - 2. SEND OPEN_BOOKMARKS_INDEX { q }
 *   - 3. (SW) OPEN_BOOKMARKS_INDEX_TAB(q) via BUILD_BOOKMARKS_INDEX_URL_WITH_QUERY then REQUEST_SIDE_PANEL_CLOSE
 *
 * ## Prefill Index search from URL
 *
 * - [IMPL-LIBRARY_SEARCH_ENTRY] [ARCH-LIBRARY_SEARCH_ENTRY] [REQ-LIBRARY_SEARCH_ENTRY] How: On Index load, set search field from ?q= via prefillSearchFromQuery; filter applied later by loadBookmarks / applySearchAndFilter.
 * - Contract:
 *   - INPUT: window.location.search; searchInput
 *   - PRE: Index DOM search input exists (or helper no-ops when null)
 *   - OUTPUT: search input value set when q present; empty q leaves prior value
 *   - POST:
 *     - success => searchInput.value equals decoded q when q non-empty; subsequent applySearchAndFilter uses that value
 *   - EFFECTS: State
 *   - TERMINATION: total
 * - PROCEDURE: PREFILL_INDEX_SEARCH_FROM_QUERY
 *   - 1. CALL prefillSearchFromQuery(URLSearchParams(location.search), searchInput)  // bookmarks-table-library-search.js
 *   - 2. ON loadBookmarks / applySearchAndFilter: filter uses searchInput.value (including prefilled q)
 *
 * === END IMPL-FULL-BLOCK: IMPL-LIBRARY_SEARCH_ENTRY ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-LINK_HEALTH ===
 * [IMPL-LINK_HEALTH] [ARCH-LINK_HEALTH] [REQ-LINK_HEALTH] — Index batch link health via SW fetch HEAD→GET; store hoverboard_link_health; Health column/filter.
 *
 * ## Classify HTTP status
 *
 * - [IMPL-LINK_HEALTH] [ARCH-LINK_HEALTH] [REQ-LINK_HEALTH] How: Map numeric status to ok|redirect|client_error|server_error|unknown.
 * - Contract:
 *   - INPUT: status (number)
 *   - PRE: status may be non-finite
 *   - OUTPUT: status class string
 *   - POST:
 *     - success => 2xx ok; 3xx redirect; 4xx client_error; 5xx server_error; else unknown
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: CLASSIFY_HTTP_STATUS
 *   - 1. IF status not finite or <= 0 THEN RETURN "unknown"
 *   - 2. IF 200..299 THEN RETURN "ok"
 *   - 3. IF 300..399 THEN RETURN "redirect"
 *   - 4. IF 400..499 THEN RETURN "client_error"
 *   - 5. IF 500..599 THEN RETURN "server_error"
 *   - 6. RETURN "unknown"
 *
 * ## Build health record
 *
 * - [IMPL-LINK_HEALTH] [ARCH-LINK_HEALTH] [REQ-LINK_HEALTH] How: Normalize fetch result into persisted record with checkedAt.
 * - Contract:
 *   - INPUT: { ok?, status?, error? }
 *   - OUTPUT: { status, httpStatus, error, checkedAt }
 *   - EFFECTS: pure (clock for checkedAt)
 *   - TERMINATION: total
 * - PROCEDURE: BUILD_HEALTH_RECORD
 *   - 1. checkedAt = now ISO
 *   - 2. IF error THEN RETURN { status: "unreachable", httpStatus: null, error, checkedAt }
 *   - 3. RETURN { status: CLASSIFY_HTTP_STATUS(status), httpStatus, error: null, checkedAt }
 *
 * ## Match inhibit list
 *
 * - [IMPL-LINK_HEALTH] [ARCH-LINK_HEALTH] [REQ-LINK_HEALTH] [IMPL-URL_INHIBITION] How: Pure substring match aligned with ConfigManager.isUrlAllowed (protocol stripped).
 * - Contract:
 *   - INPUT: url (string), inhibitUrls (string[])
 *   - PRE: inhibitUrls may be empty/null
 *   - OUTPUT: boolean (true = inhibited / skip fetch)
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: URL_MATCHES_INHIBIT_LIST
 *   - 1. IF url empty THEN RETURN false
 *   - 2. normalized = strip https?:// from url
 *   - 3. FOR each entry IN inhibitUrls (trim; skip empty):
 *   - 4.   IF normalized includes entry OR entry includes normalized THEN RETURN true
 *   - 5. RETURN false
 *
 * ## Fetch with link-health timeout
 *
 * - [IMPL-LINK_HEALTH] [ARCH-LINK_HEALTH] [REQ-LINK_HEALTH] How: AbortController-bounded fetch; do not read response body (status only).
 * - Contract:
 *   - INPUT: url, init (method/redirect), timeoutMs (default LINK_HEALTH_FETCH_TIMEOUT_MS)
 *   - PRE: fetch available
 *   - OUTPUT: Response
 *   - FAILURE_MODES: abort → Error name AbortError message "timeout"; network errors propagate
 *   - EFFECTS: Http, Async
 *   - TERMINATION: total
 * - PROCEDURE: FETCH_WITH_LINK_HEALTH_TIMEOUT
 *   - 1. controller = new AbortController; timer = abort after timeoutMs
 *   - 2. TRY: RETURN fetch(url, { ...init, redirect: follow, signal: controller.signal })
 *   - 3. CATCH abort: THROW timeout AbortError
 *   - 4. FINALLY: clearTimeout(timer)
 *
 * ## Check link health batch
 *
 * - [IMPL-LINK_HEALTH] [ARCH-LINK_HEALTH] [REQ-LINK_HEALTH] How: SW CHECK_LINK_HEALTH; inhibit skip; HEAD then GET on 405/501 with timeout; merge into chrome.storage.local.
 * - Contract:
 *   - INPUT: urls[] (http/https only; max 50)
 *   - PRE: chrome.storage.local available; fetch available; ConfigManager inhibit list readable
 *   - OUTPUT: { success, results, checked }
 *   - POST:
 *     - success => hoverboard_link_health updated for each checked URL
 *     - inhibited URLs => no fetch; unreachable record error "inhibited"
 *     - timeout => unreachable record error "timeout"
 *   - FAILURE_MODES: network error → unreachable; abort → timeout; inhibit → skip fetch
 *   - EFFECTS: Http, IO, State, Async
 *   - DATA: hoverboard_link_health; hoverboard_inhibit_urls (read)
 *   - DATA_TRANSITION: map[url] = health record
 *   - TERMINATION: total
 * - PROCEDURE: CHECK_LINK_HEALTH
 *   - 1. IF NOT IS_LINK_HEALTH_CHECKS_ENABLED(ConfigManager.getConfig()) THEN RETURN { success: false, error: "Link health checks disabled" }
 *   - 2. list = filter http(s) urls; slice(0, 50)
 *   - 3. inhibitUrls = ConfigManager.getInhibitUrls()
 *   - 4. map = READ hoverboard_link_health OR {}
 *   - 5. FOR each url IN list:
 *   - 6.   IF URL_MATCHES_INHIBIT_LIST(url, inhibitUrls) THEN record = BUILD_HEALTH_RECORD({ error: "inhibited" }); GOTO merge
 *   - 7.   TRY: res = FETCH_WITH_LINK_HEALTH_TIMEOUT(url, HEAD); IF status 405 or 501 THEN res = FETCH_WITH_LINK_HEALTH_TIMEOUT(url, GET)
 *   - 8.        DO NOT read body; record = BUILD_HEALTH_RECORD({ status: res.status, ok: res.ok })
 *   - 9.   CATCH: record = BUILD_HEALTH_RECORD({ error: message or "timeout" })
 *   - 10.  merge: map = MERGE_HEALTH_MAP(map, url, record)
 *   - 11. WRITE hoverboard_link_health = map
 *   - 12. RETURN { success: true, results, checked: list.length }
 *
 * ## Get link health map
 *
 * - [IMPL-LINK_HEALTH] [ARCH-LINK_HEALTH] [REQ-LINK_HEALTH] How: GET_LINK_HEALTH reads stored map for Index column/filter.
 * - Contract:
 *   - INPUT: none
 *   - OUTPUT: health map object
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: GET_LINK_HEALTH
 *   - 1. RETURN chrome.storage.local[hoverboard_link_health] OR {}
 *
 * ## Filter Index by health
 *
 * - [IMPL-LINK_HEALTH] [ARCH-LINK_HEALTH] [REQ-LINK_HEALTH] How: Pure filter for Health column status filter.
 * - Contract:
 *   - INPUT: bookmarks[], healthMap, statusFilter
 *   - OUTPUT: filtered bookmarks
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: FILTER_BOOKMARKS_BY_HEALTH
 *   - 1. IF statusFilter empty THEN RETURN bookmarks
 *   - 2. KEEP rows where (healthMap[url].status OR "unknown") == statusFilter
 *
 * ## Link health checks enabled flag
 *
 * - [IMPL-LINK_HEALTH] [ARCH-LINK_HEALTH] [REQ-LINK_HEALTH] How: Privacy-first opt-in; config key linkHealthChecksEnabled defaults false.
 * - Contract:
 *   - INPUT: config (MergedConfig|null)
 *   - OUTPUT: boolean (true only when linkHealthChecksEnabled === true)
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: IS_LINK_HEALTH_CHECKS_ENABLED
 *   - 1. RETURN config.linkHealthChecksEnabled === true
 *
 * ## Format capture-UI health hint
 *
 * - [IMPL-LINK_HEALTH] [ARCH-LINK_HEALTH] [REQ-LINK_HEALTH] How: Compact This Page/popup label from stored record when enabled.
 * - Contract:
 *   - INPUT: rec (health record|null), { enabled }
 *   - PRE: enabled false or missing record => empty string
 *   - OUTPUT: "" | "Health: {status}" | "Health: {status} ({httpStatus})"
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: FORMAT_LINK_HEALTH_HINT
 *   - 1. IF NOT enabled OR NOT rec.status THEN RETURN ""
 *   - 2. IF httpStatus != null THEN RETURN "Health: {status} ({httpStatus})"
 *   - 3. RETURN "Health: {status}"
 *
 * ## Gate Index check controls
 *
 * - [IMPL-LINK_HEALTH] [ARCH-LINK_HEALTH] [REQ-LINK_HEALTH] How: Hide/disable Check link health controls when opt-in off; Health column may remain read-only.
 * - Contract:
 *   - INPUT: enabled (boolean), checkButton (element|null)
 *   - EFFECTS: State (DOM hidden/disabled)
 *   - TERMINATION: total
 * - PROCEDURE: APPLY_LINK_HEALTH_CONTROLS_GATE
 *   - 1. IF checkButton null THEN RETURN
 *   - 2. checkButton.hidden = NOT enabled; checkButton.disabled = NOT enabled
 *
 * ## Index Check link health UI
 *
 * - [IMPL-LINK_HEALTH] [ARCH-LINK_HEALTH] [REQ-LINK_HEALTH] How: Index orchestrator runCheckLinkHealth (bookmarks-table-link-health.js) for composition tests; applySearchAndFilter uses FILTER_BOOKMARKS_BY_HEALTH; Health cell via formatHealthCellLabel; gated by linkHealthChecksEnabled.
 * - Contract:
 *   - INPUT: selectedUrls OR filteredBookmarks urls; sendMessage; resultEl; onResults; enabled?
 *   - PRE: sendMessage available; urls may be empty
 *   - OUTPUT: status text; linkHealthMap merge; table refresh on success
 *   - POST:
 *     - success => onResults called with results; resultEl shows Checked N
 *     - empty urls => resultEl "No URLs to check"; no sendMessage
 *     - enabled === false => resultEl "Link health checks disabled"; no sendMessage
 *   - FAILURE_MODES: EmptyUrls, Disabled, CheckFailed, SendThrow
 *   - EFFECTS: Async, State
 *   - TERMINATION: total
 * - PROCEDURE: RUN_CHECK_LINK_HEALTH_UI
 *   - 1. IF enabled === false THEN set resultEl; RETURN failure Disabled
 *   - 2. urls = selected OR filtered URLs
 *   - 3. CALL runCheckLinkHealth({ urls, sendMessage, resultEl, onResults })
 *   - 4. onResults: merge into linkHealthMap; applySearchAndFilter
 *
 * ## Capture UI link health hint
 *
 * - [IMPL-LINK_HEALTH] [ARCH-LINK_HEALTH] [REQ-LINK_HEALTH] How: Popup/This Page reads GET_LINK_HEALTH for current URL when opt-in on; apply hint text to DOM.
 * - Contract:
 *   - INPUT: currentUrl; config; sendMessage GET_LINK_HEALTH; hintEl
 *   - PRE: IS_LINK_HEALTH_CHECKS_ENABLED(config)
 *   - OUTPUT: hintEl text/hidden
 *   - EFFECTS: Async, State, IO
 *   - TERMINATION: total
 * - PROCEDURE: CAPTURE_UI_LINK_HEALTH_HINT
 *   - 1. IF NOT IS_LINK_HEALTH_CHECKS_ENABLED(config) THEN clear hintEl; RETURN
 *   - 2. map = GET_LINK_HEALTH
 *   - 3. text = FORMAT_LINK_HEALTH_HINT(map[currentUrl], { enabled: true })
 *   - 4. APPLY hintEl = text (hidden when empty)
 *
 * === END IMPL-FULL-BLOCK: IMPL-LINK_HEALTH ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-LOCAL_QUERY_API ===
 * [IMPL-LOCAL_QUERY_API] [ARCH-LOCAL_QUERY_API] [REQ-LOCAL_QUERY_API] — Localhost HTTP API over File bookmarks + optional aggregate-snapshot; bearer token; 127.0.0.1 only; extension REFRESH_API_SNAPSHOT.
 *
 * ## Auth and bind
 *
 * - [IMPL-LOCAL_QUERY_API] [ARCH-LOCAL_QUERY_API] [REQ-LOCAL_QUERY_API] How: Bind loopback only; require Bearer token from api-token file.
 * - Contract:
 *   - INPUT: installDir, port, request Authorization header
 *   - PRE: token file exists or generated on first start
 *   - OUTPUT: authorized request proceeds | { error: Unauthorized | ForbiddenBind }
 *   - POST:
 *     - success => listen address is 127.0.0.1:port
 *     - error Unauthorized => HTTP 401
 *   - FAILURE_MODES: Unauthorized, ForbiddenBind
 *   - EFFECTS: IO, Http
 *   - TERMINATION: may_diverge (HTTP server loop — intentional)
 * - PROCEDURE: ENSURE_TOKEN_AND_LISTEN
 *   - 1. IF api-token missing THEN generate random token; WRITE installDir/api-token
 *   - 2. LISTEN only on 127.0.0.1:port
 *   - 3. ON each request: IF Authorization != "Bearer "+token THEN 401
 *
 * ## Load bookmarks (File or snapshot)
 *
 * - [IMPL-LOCAL_QUERY_API] [ARCH-LOCAL_QUERY_API] [REQ-LOCAL_QUERY_API] How: Prefer aggregate-snapshot.json when present; else hoverboard-bookmarks.json version-1 shape.
 * - Contract:
 *   - INPUT: bookmarksFilePath, snapshotFilePath
 *   - PRE: paths may be missing
 *   - OUTPUT: list of bookmark objects | empty list
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: LOAD_BOOKMARKS
 *   - 1. IF aggregate-snapshot.json exists THEN TRY PARSE snapshot.bookmarks; RETURN list
 *   - 2. IF hoverboard-bookmarks.json missing THEN RETURN []
 *   - 3. PARSE JSON { version, bookmarks: map url -> pin }
 *   - 4. RETURN values as array (default storage "file")
 *
 * ## List and filter
 *
 * - [IMPL-LOCAL_QUERY_API] [ARCH-LOCAL_QUERY_API] [REQ-LOCAL_QUERY_API] How: GET /v1/bookmarks with q, tag, url filters.
 * - Contract:
 *   - INPUT: bookmarks[], query params q, tag, url
 *   - PRE: auth passed
 *   - OUTPUT: JSON { bookmarks: [...], count }
 *   - EFFECTS: pure (filter) + Http
 *   - TERMINATION: total
 * - PROCEDURE: FILTER_BOOKMARKS
 *   - 1. IF url set THEN keep exact url match
 *   - 2. IF tag set THEN keep bookmarks whose tags contain tag (case-insensitive)
 *   - 3. IF q set THEN keep substring match on description, url, tags, extended (case-insensitive)
 *   - 4. RETURN filtered
 *
 * ## File write and delete
 *
 * - [IMPL-LOCAL_QUERY_API] [ARCH-LOCAL_QUERY_API] [REQ-LOCAL_QUERY_API] How: POST/PATCH merge pin into File JSON; DELETE by url query (File only, not snapshot).
 * - Contract:
 *   - INPUT: pin JSON (POST/PATCH) or url query (DELETE)
 *   - PRE: auth passed; url required
 *   - OUTPUT: { ok, bookmark|deleted } | HTTP 400/500
 *   - FAILURE_MODES: MissingUrl, InvalidJSON, IO
 *   - EFFECTS: IO, Http
 *   - TERMINATION: total
 * - PROCEDURE: WRITE_OR_DELETE_FILE_BOOKMARK
 *   - 1. POST/PATCH: Decode pin; IF url empty THEN 400; MERGE into hoverboard-bookmarks.json; RETURN ok
 *   - 2. DELETE: IF url query empty THEN 400; REMOVE url from File map; RETURN ok
 *
 * ## Health
 *
 * - [IMPL-LOCAL_QUERY_API] [ARCH-LOCAL_QUERY_API] [REQ-LOCAL_QUERY_API] How: GET /v1/health returns ok, source file|snapshot, bind.
 * - Contract:
 *   - INPUT: none (auth required)
 *   - OUTPUT: { ok: true, source, bind, port }
 *   - EFFECTS: Http, IO (stat snapshot)
 *   - TERMINATION: total
 * - PROCEDURE: HEALTH
 *   - 1. source = IF snapshot exists THEN "snapshot" ELSE "file"
 *   - 2. RETURN { ok: true, source, bind: "127.0.0.1", port }
 *
 * ## Build aggregate snapshot payload
 *
 * - [IMPL-LOCAL_QUERY_API] [ARCH-LOCAL_QUERY_API] [REQ-LOCAL_QUERY_API] How: Pure map from aggregated Index rows to snapshot JSON.
 * - Contract:
 *   - INPUT: bookmarks[] from getAggregatedBookmarksForIndex
 *   - OUTPUT: { version: 1, updatedAt, bookmarks: [...] }
 *   - EFFECTS: pure (clock for updatedAt)
 *   - TERMINATION: total
 * - PROCEDURE: BUILD_AGGREGATE_SNAPSHOT_PAYLOAD
 *   - 1. MAP each row to pin fields + storage; DROP rows without url
 *   - 2. RETURN { version: 1, updatedAt: now ISO, bookmarks }
 *
 * ## Refresh API snapshot (extension)
 *
 * - [IMPL-LOCAL_QUERY_API] [ARCH-LOCAL_QUERY_API] [REQ-LOCAL_QUERY_API] How: REFRESH_API_SNAPSHOT aggregates providers and writes aggregate-snapshot.json via native host.
 * - Contract:
 *   - INPUT: none (message from Index/Options)
 *   - PRE: BookmarkRouter ready; native messaging available
 *   - OUTPUT: { success, count } | { success: false, error }
 *   - FAILURE_MODES: RouterNotReady, NativeUnavailable, WriteFailed
 *   - EFFECTS: IO, Async, State
 *   - TERMINATION: total
 * - PROCEDURE: REFRESH_API_SNAPSHOT
 *   - 1. agg = handleGetAggregatedBookmarksForIndex()
 *   - 2. payload = BUILD_AGGREGATE_SNAPSHOT_PAYLOAD(agg.bookmarks)
 *   - 3. SEND native writeBookmarksFile path ~/.hoverboard/aggregate-snapshot.json data payload
 *   - 4. ON success RETURN { success: true, count: payload.bookmarks.length }
 *   - 5. ON failure RETURN { success: false, error }
 *
 * ## Index Refresh API snapshot UI
 *
 * - [IMPL-LOCAL_QUERY_API] [ARCH-LOCAL_QUERY_API] [REQ-LOCAL_QUERY_API] How: Index orchestrator runRefreshApiSnapshot (bookmarks-table-api-snapshot.js) for composition tests.
 * - Contract:
 *   - INPUT: sendMessage; resultEl
 *   - PRE: sendMessage available
 *   - OUTPUT: status text with count or error
 *   - POST:
 *     - success => resultEl shows Snapshot updated (N bookmarks)
 *     - failure => resultEl shows error; no throw to caller
 *   - FAILURE_MODES: SnapshotFailed, SendThrow
 *   - EFFECTS: Async
 *   - TERMINATION: total
 * - PROCEDURE: RUN_REFRESH_API_SNAPSHOT_UI
 *   - 1. CALL runRefreshApiSnapshot({ sendMessage, resultEl })
 *   - 2. sendMessage REFRESH_API_SNAPSHOT → SW REFRESH_API_SNAPSHOT
 *
 * === END IMPL-FULL-BLOCK: IMPL-LOCAL_QUERY_API ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION ===
 * Associate a captured Local/File archive with a selected-backend bookmark while preserving metadata and compensating partial failure.
 *
 * ## RESOLVE_ARCHIVE_BOOKMARK_CONTEXT
 * - [IMPL-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE] How: resolve explicit backend ownership without aggregate URL lookup and retain the prior archive for compensation.
 * - Contract:
 *   - INPUT: request { url, preferredBackend }, selectedBackendLookup, archiveStore, isUrlAllowed
 *   - PRE: request exists; selectedBackendLookup, archiveStore, and isUrlAllowed are callable
 *   - OUTPUT: context { url, backend, existingBookmark, previousArchive } | { success: false, code }
 *   - POST:
 *     - success => existingBookmark may be null or any non-null record, including a stub
 *     - error => no page capture or bookmark mutation occurs
 *   - FAILURE_MODES: InvalidRequest, UnsupportedBackend, RestrictedUrl, InhibitedUrl, LookupFailed
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: RESOLVE_ARCHIVE_BOOKMARK_CONTEXT
 *   - IF url is absent: RETURN InvalidRequest
 *   - IF url is not HTTP(S): RETURN RestrictedUrl
 *   - IF preferredBackend is not local or file: RETURN UnsupportedBackend
 *   - IF isUrlAllowed(url) is false: RETURN InhibitedUrl
 *   - existingBookmark = AWAIT selectedBackendLookup(url, preferredBackend)
 *   - previousArchive = AWAIT archiveStore.read(url, preferredBackend)
 *   - RETURN context
 *
 * ## CAPTURE_ARCHIVE_AND_ASSOCIATE_BOOKMARK
 * - [IMPL-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE] How: capture and persist the archive before preserving or creating selected-backend bookmark ownership.
 * - Contract:
 *   - INPUT: context, captureContext, captureArchive, archiveStore
 *   - PRE: context passed RESOLVE_ARCHIVE_BOOKMARK_CONTEXT; archiveStore writes the selected backend
 *   - OUTPUT: current archive plus association state | { success: false, code, bookmarkCreated: false }
 *   - POST:
 *     - success => archive is current; existingBookmark is never rewritten
 *     - capture/storage error => bookmarkCreated is false and prior archive retention is reported
 *   - FAILURE_MODES: CaptureFailed, StorageFailed
 *   - DATA: previousArchive, currentArchive
 *   - DATA_TRANSITION: archive is written before missing-bookmark creation
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: CAPTURE_ARCHIVE_AND_ASSOCIATE_BOOKMARK
 *   - captured = AWAIT captureArchive(context.url, captureContext)
 *   - IF captured fails: RETURN stable failure with archiveRetained = previousArchive exists
 *   - saved = AWAIT archiveStore.saveArchive(context.url, context.backend, captured.archive)
 *   - IF saved fails: RETURN StorageFailed with archiveRetained = previousArchive exists
 *   - RETURN current archive plus previousArchive and existingBookmark
 *
 * ## CREATE_MINIMAL_BOOKMARK_IF_ABSENT
 * - [IMPL-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE] [IMPL-BOOKMARK_CREATE_UPDATE_TIMES] [IMPL-DOM_UTILITIES] How: preserve any non-null selected-backend bookmark and create exactly one default-shaped bookmark only when lookup returned null.
 * - Contract:
 *   - INPUT: current archive, context, existingBookmark (nullable), createMinimalBookmark, saveBookmark, clock
 *   - PRE: archive write succeeded; selected backend is local or file; existingBookmark may be null or non-null
 *   - OUTPUT: { success: true, bookmark, bookmarkCreated } | { success: false, code: BookmarkSaveFailed }
 *   - POST:
 *     - existingBookmark non-null => no save occurs and bookmarkCreated is false
 *     - existingBookmark null and save succeeds => one bookmark uses archive URL/title, empty tags/notes, selected backend, and normal timestamps
 *   - FAILURE_MODES: BookmarkSaveFailed
 *   - DATA_TRANSITION: create one missing-bookmark record; never update a non-null existing record
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: CREATE_MINIMAL_BOOKMARK_IF_ABSENT
 *   - IF existingBookmark is non-null: RETURN { success: true, bookmark: existingBookmark, bookmarkCreated: false }
 *   - now = clock()
 *   - minimal = createMinimalBookmark({ url: context.url, description: archive.sourceTitle, tags: [], notes: '', preferredBackend: context.backend, time: now, updated_at: now })
 *   - saved = AWAIT saveBookmark(minimal)
 *   - IF saved fails: RETURN BookmarkSaveFailed
 *   - RETURN { success: true, bookmark: saved.bookmark OR minimal, bookmarkCreated: true }
 *
 * ## COMPENSATE_ARCHIVE_ASSOCIATION_FAILURE
 * - [IMPL-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE] How: restore the prior archive or remove only the new archive after bookmark association failure and expose uncertainty.
 * - Contract:
 *   - INPUT: context, previousArchive (nullable), archiveStore
 *   - PRE: current archive write succeeded and bookmark creation failed
 *   - OUTPUT: { archiveRetained, priorArchiveRestored, cleanupFailed, compensationError? }
 *   - POST:
 *     - previousArchive exists => restore is attempted
 *     - no previousArchive => only the new archive is removed
 *     - cleanup failure => cleanupFailed is true and the error remains visible
 *   - FAILURE_MODES: CompensationFailed
 *   - DATA_TRANSITION: current archive becomes previous archive or is deleted
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: COMPENSATE_ARCHIVE_ASSOCIATION_FAILURE
 *   - IF previousArchive exists: result = AWAIT archiveStore.restore(context.url, context.backend, previousArchive)
 *   - ELSE: result = AWAIT archiveStore.removeCurrent(context.url, context.backend)
 *   - IF result fails: RETURN archiveRetained = true, priorArchiveRestored = false, cleanupFailed = true, compensationError
 *   - IF previousArchive exists: RETURN archiveRetained = true, priorArchiveRestored = true, cleanupFailed = false
 *   - RETURN archiveRetained = false, priorArchiveRestored = false, cleanupFailed = false
 *
 * ## ARCHIVE_ASSOCIATION_RESULT_BOUNDARY
 * - [IMPL-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE] How: expose one stable response shape to message and popup/This Page callers.
 * - Contract:
 *   - INPUT: context result, archive result, bookmark result, compensation result
 *   - PRE: failed paths carry a stable code; bookmarkCreated defaults false
 *   - OUTPUT: success or failure response with association and compensation diagnostics
 *   - POST:
 *     - success => archive persistence and required bookmark association succeeded
 *     - failure => bookmarkCreated is false and CompensationFailed remains visible
 *   - FAILURE_MODES: delegated failure modes, CompensationFailed
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: ARCHIVE_ASSOCIATION_RESULT_BOUNDARY
 *   - IF context, capture, or archive write failed: RETURN failure with bookmarkCreated false and retention diagnostics
 *   - IF existingBookmark is non-null: RETURN success with bookmarkCreated false, archiveRetained true, cleanupFailed false
 *   - IF minimal bookmark save succeeds: RETURN success with bookmarkCreated true, archiveRetained true, cleanupFailed false
 *   - IF minimal bookmark save fails: RETURN failure merged with COMPENSATE_ARCHIVE_ASSOCIATION_FAILURE
 *
 * === END IMPL-FULL-BLOCK: IMPL-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION ===
 */
// [IMPL-MV3_MIGRATION] [ARCH-MV3_MIGRATION] [REQ-MANIFEST_V3_MIGRATION]: Service worker implementation for Manifest V3 migration
/**
 * Hoverboard Extension - Service Worker (Manifest V3)
 * Main background service for handling extension events and API communication
 */

// [IMPL-MV3_MIGRATION] [ARCH-MV3_MIGRATION] [REQ-MANIFEST_V3_MIGRATION]: Modern ES6 module imports for V3 architecture
import { MessageHandler, MESSAGE_TYPES } from './message-handler.js'
import { PinboardService } from '../features/pinboard/pinboard-service.js'
import { LocalBookmarkService } from '../features/storage/local-bookmark-service.js'
import { SyncBookmarkService } from '../features/storage/sync-bookmark-service.js'
import { BrowserBookmarkService } from '../features/storage/browser-bookmark-service.js'
import { FileBookmarkService } from '../features/storage/file-bookmark-service.js'
import { InMemoryFileBookmarkAdapter } from '../features/storage/file-bookmark-storage-adapter.js'
import { MessageFileBookmarkAdapter, ensureOffscreenDocument } from '../features/storage/message-file-bookmark-adapter.js'
import { NativeHostFileBookmarkAdapter } from '../features/storage/native-host-file-bookmark-adapter.js'
import { StorageIndex } from '../features/storage/storage-index.js'
import { BookmarkRouter } from '../features/storage/bookmark-router.js'
import { normalizeBookmarkForDisplay } from '../features/storage/url-tags-manager.js'
import { BookmarkUsageTracker } from '../features/storage/bookmark-usage-tracker.js'
import { ConfigManager } from '../config/config-manager.js'
import { BadgeManager } from './badge-manager.js'
// [REQ-ICON_CLICK_BEHAVIOR] [IMPL-EXTENSION_COMMANDS] Tab IDs and storage key for side panel tab-specific commands
import { SIDE_PANEL_TAB_STORAGE_KEY, TAB_BOOKMARK, TAB_TAGS_TREE, TAB_BROWSER_TABS } from '../ui/side-panel/side-panel-tab-state.js'
import { isWebProtocolUrl } from '../shared/web-protocol.js'
// [SAFARI-EXT-SHIM-001] Import browser API abstraction for cross-browser support
import { browser } from '../shared/safari-shim.js' // [SAFARI-EXT-SHIM-001]
// [IMPL-UI_INSPECTOR] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION] Optional message log for testing/debugging
import * as uiInspector from '../shared/ui-inspector.js'
import { RecentTagsMemoryManager } from '../features/tagging/recent-tags-memory-manager.js'
import { createProviderInitMutex } from '../shared/async-init-mutex.js'
import { buildBookmarksIndexUrlWithQuery } from '../shared/library-search-entry.js'
import { PageArchiveStore } from '../features/archive/page-archive-store.js'
import { PageScreenshotStore } from '../features/archive/page-screenshot-store.js'
import { ChromeStoragePageArchiveAdapter } from '../features/archive/page-archive-storage-adapter.js'
import { ArchiveContentSearch } from '../features/archive/archive-content-search.js'

/** [IMPL-ICON_CLICK_BEHAVIOR] [IMPL-NON_WEB_TOOLS_TOOLBAR] Non-web (not http/https) — skip window cache / prefer web fallback. */
const _isRestrictedForSidePanel = (url) => !isWebProtocolUrl(url)

const TOOLS_TOOLBAR_POPUP = 'src/ui/tools-toolbar/tools-toolbar.html'
const FULL_POPUP_PATH = 'src/ui/popup/popup.html'
const BROWSER_BOOKMARKS_PAGE = 'src/ui/browser-bookmarks/browser-bookmarks.html'

// [IMPL-MV3_MIGRATION] [ARCH-MV3_MIGRATION] [REQ-MANIFEST_V3_MIGRATION]: Main service worker class for V3 architecture
class HoverboardServiceWorker {
  constructor () {
    // [IMPL-MV3_MIGRATION] [ARCH-MV3_MIGRATION] [REQ-MANIFEST_V3_MIGRATION]: Initialize core service components (default provider until async init)
    this.messageHandler = new MessageHandler()
    this.configManager = new ConfigManager()
    this.badgeManager = new BadgeManager()
    // [REQ-BOOKMARK_USAGE_TRACKING] [ARCH-BOOKMARK_USAGE_TRACKING] [IMPL-BOOKMARK_USAGE_TRACKING] Track visit frequency/recency and referrer graph for bookmarked URLs
    this.usageTracker = new BookmarkUsageTracker()
    // [ARCH-LOCAL_STORAGE_PROVIDER] Active bookmark provider (set by initBookmarkProvider)
    this.bookmarkProvider = this.messageHandler.bookmarkProvider

    // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] - Initialize shared memory for recent tags
    this.recentTagsMemory = new RecentTagsMemoryManager()

    this._providerInitialized = false
    // [REQ-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX] Serialize cold-start init so concurrent first messages share one in-flight promise
    this._ensureProviderInitialized = createProviderInitMutex(() => this.initBookmarkProvider())
    // [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE] Cached normal windowId for sidePanel.open(). Implements open-from-popup by keeping a windowId so open() can be called synchronously in onMessage (user gesture requirement: no await before open).
    this._sidePanelWindowId = null
    // [REQ-ICON_CLICK_BEHAVIOR] [IMPL-ICON_CLICK_BEHAVIOR] Cached so handleActionClick can call sidePanel.open() synchronously (user gesture requirement: no await before open).
    this._iconClickOpensSidePanel = undefined

    // [IMPL-MV3_MIGRATION] [ARCH-MV3_MIGRATION] [REQ-MANIFEST_V3_MIGRATION]: Set up V3 event listeners
    this.setupEventListeners()
    this._seedSidePanelWindowCache()
    this._seedIconClickPreferenceCache()
  }

  /**
   * [REQ-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX] Lazy provider init with mutex (concurrent cold-start safe).
   * SWITCH_STORAGE_MODE still calls initBookmarkProvider() directly for forced re-init.
   */
  async ensureBookmarkProviderInitialized () {
    if (this._providerInitialized) return
    await this._ensureProviderInitialized()
  }

  /**
   * [IMPL-FILE_STORAGE_TYPED_PATH] [ARCH-FILE_BOOKMARK_PROVIDER] [REQ-FILE_BOOKMARK_STORAGE] File adapter: path set → NativeHost; configured picker → Message; otherwise bookmark operations may use InMemory, but durable File archives remain unavailable.
   * [ARCH-LOCAL_STORAGE_PROVIDER] [ARCH-STORAGE_INDEX_AND_ROUTER] Create providers, storage index, router; wire MessageHandler.
   */
  async initBookmarkProvider () {
    const tagService = this.messageHandler.tagService
    const pinboardProvider = new PinboardService(tagService)
    const localProvider = new LocalBookmarkService(tagService)
    const syncProvider = new SyncBookmarkService(tagService)
    const browserProvider = new BrowserBookmarkService(tagService)

    let fileAdapter = new InMemoryFileBookmarkAdapter()
    let fileArchiveAdapter = null
    const storage = await chrome.storage.local.get(['hoverboard_file_storage_configured', 'hoverboard_file_storage_path'])
    const pathSet = !!(storage.hoverboard_file_storage_path && String(storage.hoverboard_file_storage_path).trim())
    const fileStorageConfigured = !!storage.hoverboard_file_storage_configured

    if (pathSet) {
      fileAdapter = new NativeHostFileBookmarkAdapter()
      fileArchiveAdapter = fileAdapter
      console.log('[SERVICE-WORKER] [IMPL-FILE_STORAGE_TYPED_PATH] File storage using native host path:', storage.hoverboard_file_storage_path)
    } else if (fileStorageConfigured && typeof chrome.offscreen !== 'undefined') {
      try {
        await ensureOffscreenDocument()
        fileAdapter = new MessageFileBookmarkAdapter()
        fileArchiveAdapter = fileAdapter
      } catch (e) {
        console.warn('[SERVICE-WORKER] File storage offscreen not available; durable File archives unavailable:', e.message)
      }
    }
    const fileProvider = new FileBookmarkService(fileAdapter, tagService)

    // [IMPL-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE]
    // Archive artifacts use separate Local/File stores; the MessageHandler association boundary receives these stores after router initialization.
    const archiveSearch = new ArchiveContentSearch()
    const archiveStore = new PageArchiveStore({
      localAdapter: new ChromeStoragePageArchiveAdapter(),
      fileAdapter: fileArchiveAdapter,
      archiveSearch
    })
    const screenshotStore = new PageScreenshotStore({
      localAdapter: new ChromeStoragePageArchiveAdapter(),
      fileAdapter: fileArchiveAdapter
    })

    const storageIndex = new StorageIndex()
    await storageIndex.ensureMigrationFromLocal(localProvider)

    const getDefaultStorageMode = () => this.configManager.getStorageMode()
    const router = new BookmarkRouter(
      pinboardProvider,
      localProvider,
      fileProvider,
      syncProvider,
      storageIndex,
      getDefaultStorageMode,
      browserProvider
    )

    tagService.pinboardService = router
    this.bookmarkProvider = router
    this.messageHandler.setBookmarkProvider(router)
    this.messageHandler.setArchiveServices(archiveStore, screenshotStore, archiveSearch)
    this._providerInitialized = true
    const mode = await this.configManager.getStorageMode()
    console.log('[SERVICE-WORKER] [ARCH-STORAGE_INDEX_AND_ROUTER] Bookmark router initialized; default mode:', mode)
  }

  // [IMPL-MV3_MIGRATION] [ARCH-MV3_MIGRATION] [REQ-MANIFEST_V3_MIGRATION]: Set up all V3 service worker event listeners
  setupEventListeners () {
    // [IMPL-MV3_MIGRATION] [ARCH-MV3_MIGRATION] [REQ-MANIFEST_V3_MIGRATION]: Handle extension installation and updates
    browser.runtime.onInstalled.addListener((details) => {
      this.handleInstall(details)
    })

    // [IMPL-MV3_MIGRATION] [ARCH-MV3_MIGRATION] [REQ-MANIFEST_V3_MIGRATION]: Handle messages from content scripts and popup
    // [SAFARI-EXT-IMPL-001] Use browser API for cross-browser compatibility
    /** @type {(message: { type: string, data?: Record<string, unknown> }, sender: chrome.runtime.MessageSender, sendResponse: (response?: unknown) => void) => void} */
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('[SERVICE-WORKER] Received message:', message)

      // [REQ-SIDE_PANEL_TAGS_TREE] [IMPL-ICON_CLICK_BEHAVIOR] [REQ-NON_WEB_TOOLS_TOOLBAR] OPEN_SIDE_PANEL; on non-web open tools toolbar.
      if (message.type === MESSAGE_TYPES.OPEN_SIDE_PANEL) {
        this._openSidePanelOrToolsToolbar().then(() => sendResponse({ success: true })).catch(() => {
          this._openSidePanelWithFallback((result) => sendResponse(result))
        })
        return true
      }

      // [REQ-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX] Popup → SW OPEN_BOOKMARKS_INDEX_TAB (create + dismiss side panel).
      // [REQ-LIBRARY_SEARCH_ENTRY] Optional message.data.q prefills Index search via ?q=
      if (message.type === MESSAGE_TYPES.OPEN_BOOKMARKS_INDEX) {
        this._openBookmarksIndexTab(message.data?.q || message.q || '')
        sendResponse({ success: true })
        return true
      }

      // [REQ-LOCAL_QUERY_API] [IMPL-LOCAL_QUERY_API] Write aggregate-snapshot.json for Local Query API
      if (message.type === 'REFRESH_API_SNAPSHOT' || message.type === MESSAGE_TYPES.REFRESH_API_SNAPSHOT) {
        this._refreshApiSnapshot()
          .then((result) => sendResponse(result))
          .catch((error) => sendResponse({ success: false, error: error.message }))
        return true
      }

      // [REQ-LINK_HEALTH] [IMPL-LINK_HEALTH]
      if (message.type === 'CHECK_LINK_HEALTH' || message.type === MESSAGE_TYPES.CHECK_LINK_HEALTH) {
        this._checkLinkHealth(message.data?.urls || [])
          .then((result) => sendResponse(result))
          .catch((error) => sendResponse({ success: false, error: error.message }))
        return true
      }
      if (message.type === 'GET_LINK_HEALTH' || message.type === MESSAGE_TYPES.GET_LINK_HEALTH) {
        this._getLinkHealthMap()
          .then((map) => sendResponse({ success: true, data: map }))
          .catch((error) => sendResponse({ success: false, error: error.message }))
        return true
      }

      // Handle async response properly for Manifest V3
      this.handleMessage(message, sender)
        .then(response => {
          console.log('[SERVICE-WORKER] Sending response:', response)
          sendResponse(response)
        })
        .catch(error => {
          console.error('[SERVICE-WORKER] Message error:', error)
          sendResponse({ success: false, error: error.message })
        })

      // Return true to indicate we will respond asynchronously
      return true
    })

    // [IMPL-MV3_MIGRATION] [ARCH-MV3_MIGRATION] [REQ-MANIFEST_V3_MIGRATION]: Handle tab activation for badge updates
    browser.tabs.onActivated.addListener((activeInfo) => {
      this.handleTabActivated(activeInfo)
    })

    // [IMPL-MV3_MIGRATION] [ARCH-MV3_MIGRATION] [REQ-MANIFEST_V3_MIGRATION]: Handle tab updates for badge management
    browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      this.handleTabUpdated(tabId, changeInfo, tab)
    })

    // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] - Handle extension reload to clear shared memory
    browser.runtime.onStartup.addListener(() => {
      this.handleExtensionStartup()
    })

    // [REQ-QUICK_ACCESS_ENTRY] [ARCH-QUICK_ACCESS_ENTRY] [IMPL-EXTENSION_COMMANDS] Extension commands: open side panel (and tab-specific), options, bookmarks index, import.
    const chromeApi = typeof globalThis.chrome !== 'undefined' ? globalThis.chrome : null
    if (chromeApi?.commands?.onCommand?.addListener) {
      chromeApi.commands.onCommand.addListener((command) => { this.handleCommand(command).catch(() => {}) })
    }

    // [REQ-ICON_CLICK_BEHAVIOR] [ARCH-ICON_CLICK_BEHAVIOR] [IMPL-ICON_CLICK_BEHAVIOR] Icon click: open side panel (default) or popup per config. Handler must be synchronous so sidePanel.open() runs in user-gesture context.
    if (chromeApi?.action?.onClicked?.addListener) {
      chromeApi.action.onClicked.addListener((tab) => { this.handleActionClick(tab) })
    }
  }

  /** [REQ-ICON_CLICK_BEHAVIOR] [IMPL-ICON_CLICK_BEHAVIOR] Seed and keep _iconClickOpensSidePanel so handleActionClick can read it synchronously. */
  _seedIconClickPreferenceCache () {
    this.configManager.getConfig().then((c) => { this._iconClickOpensSidePanel = c.iconClickOpensSidePanel }).catch(() => {})
    const storage = typeof globalThis.chrome !== 'undefined' && globalThis.chrome.storage ? globalThis.chrome.storage : null
    if (storage?.onChanged?.addListener) {
      storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== 'local') return
        if (changes.hoverboard_settings) {
          this.configManager.getConfig().then((c) => { this._iconClickOpensSidePanel = c.iconClickOpensSidePanel }).catch(() => {})
        }
      })
    }
  }

  /**
   * [REQ-ICON_CLICK_BEHAVIOR] [ARCH-ICON_CLICK_BEHAVIOR] [IMPL-ICON_CLICK_BEHAVIOR]
   * Handle extension icon click: open side panel (default) or popup per cached preference; if side panel, toggle (close when already open).
   * Chrome requires sidePanel.open() in the same synchronous user-gesture stack; we call it only when we have a cached windowId (synchronous). When cache is null we cannot open from an async callback (gesture would be lost).
   * @param {chrome.tabs.Tab|undefined} [tab] Tab where the action was clicked (Chrome passes this to onClicked); use its windowId for correct window.
   */
  handleActionClick (tab) {
    const chromeApi = typeof globalThis.chrome !== 'undefined' ? globalThis.chrome : null
    // [REQ-NON_WEB_TOOLS_TOOLBAR] [IMPL-NON_WEB_TOOLS_TOOLBAR] Non-web badge: tools toolbar (not side panel).
    if (tab?.url != null && !isWebProtocolUrl(tab.url)) {
      this._openToolsToolbar(tab)
      return
    }
    // [REQ-ICON_CLICK_BEHAVIOR] [IMPL-ICON_CLICK_BEHAVIOR] Preference and API check; open popup when side panel disabled or unavailable.
    const openSidePanel = this._iconClickOpensSidePanel !== false
    if (!openSidePanel) {
      if (chromeApi?.action?.openPopup) chromeApi.action.openPopup()
      return
    }
    if (!chromeApi?.sidePanel?.open) {
      if (chromeApi?.action?.openPopup) chromeApi.action.openPopup()
      return
    }
    // [ARCH-ICON_CLICK_BEHAVIOR] [IMPL-ICON_CLICK_BEHAVIOR] Prefer clicked window: use tab from onClicked when provided, else cached windowId.
    const clickedWindowId = tab?.windowId != null ? tab.windowId : null
    const cachedWindowId = this._sidePanelWindowId
    const useWindowId = clickedWindowId != null ? clickedWindowId : cachedWindowId
    // [IMPL-ICON_CLICK_BEHAVIOR] Synchronous open: update cache when clicked and not restricted; sidePanel.open; windows.update focus; send REQUEST_SIDE_PANEL_CLOSE.
    if (useWindowId != null) {
      try {
        if (clickedWindowId != null && !_isRestrictedForSidePanel(tab?.url)) this._sidePanelWindowId = clickedWindowId
        chromeApi.sidePanel.open({ windowId: useWindowId })
        if (chromeApi?.windows?.update) chromeApi.windows.update(useWindowId, { focused: true }).catch(() => {})
        if (chromeApi?.runtime?.sendMessage) {
          const p = chromeApi.runtime.sendMessage({ type: MESSAGE_TYPES.REQUEST_SIDE_PANEL_CLOSE })
          if (p && typeof p.catch === 'function') p.catch(() => {})
        }
      } catch (e) {}
      return
    }
    // [IMPL-ICON_CLICK_BEHAVIOR] Cold start: no clicked tab and no cached window; tabs.query seeds cache only, openPopup as fallback (do not call sidePanel.open in callback—user gesture would be lost).
    const tabsApi = chromeApi?.tabs ?? (typeof browser !== 'undefined' ? browser.tabs : null)
    if (tabsApi?.query) {
      tabsApi.query({ active: true, currentWindow: true }, (tabs) => {
        const tabFromQuery = tabs && tabs[0]
        if (tabFromQuery?.windowId != null && !_isRestrictedForSidePanel(tabFromQuery.url)) this._sidePanelWindowId = tabFromQuery.windowId
      })
    }
    if (chromeApi?.action?.openPopup) chromeApi.action.openPopup()
  }

  /**
   * [REQ-QUICK_ACCESS_ENTRY] [ARCH-QUICK_ACCESS_ENTRY] [IMPL-EXTENSION_COMMANDS]
   * Handle extension command (keyboard shortcut): open side panel (or specific tab), options, bookmarks index, or import page.
   */
  async handleCommand (command) {
    const chromeApi = typeof globalThis.chrome !== 'undefined' ? globalThis.chrome : null
    const runtime = chromeApi?.runtime || browser.runtime
    const getURL = runtime.getURL ? (path) => runtime.getURL(path) : () => ''
    const windowId = this._sidePanelWindowId

    if (command === 'open-side-panel') {
      // [REQ-NON_WEB_TOOLS_TOOLBAR] On non-web active tab, open tools toolbar instead of side panel.
      await this._openSidePanelOrToolsToolbar()
      return
    }
    // [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [IMPL-NON_WEB_TOOLS_TOOLBAR] Standalone Browser Bookmarks page (not side-panel tab).
    if (command === 'open-side-panel-browser-bookmarks') {
      this._openBrowserBookmarksPage()
      return
    }
    // [IMPL-EXTENSION_COMMANDS] Tab-specific commands: set persisted tab then open panel; panel reads storage on load or onChanged.
    if (command === 'open-side-panel-bookmark' || command === 'open-side-panel-tags-tree' || command === 'open-side-panel-browser-tabs') {
      const tabId = command === 'open-side-panel-bookmark' ? TAB_BOOKMARK : command === 'open-side-panel-tags-tree' ? TAB_TAGS_TREE : TAB_BROWSER_TABS
      if (chromeApi?.storage?.local?.set) {
        await chromeApi.storage.local.set({ [SIDE_PANEL_TAB_STORAGE_KEY]: tabId })
      }
      this._openSidePanelWithFallback()
      return
    }
    if (command === 'open-options') {
      if (runtime.openOptionsPage) runtime.openOptionsPage()
      return
    }
    if (command === 'open-bookmarks-index') {
      // [REQ-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX] OPEN_BOOKMARKS_INDEX_TAB
      this._openBookmarksIndexTab()
      return
    }
    if (command === 'open-import') {
      const url = getURL('src/ui/browser-bookmark-import/browser-bookmark-import.html')
      if (url && (chromeApi?.tabs?.create || browser.tabs?.create)) {
        (chromeApi?.tabs ?? browser.tabs).create({ url })
      }
    }
  }

  /**
   * [REQ-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX] [IMPL-ICON_CLICK_BEHAVIOR]
   * OPEN_BOOKMARKS_INDEX_TAB: create Local Bookmarks Index tab then dismiss already-open side panel (tab-create only).
   * [REQ-LIBRARY_SEARCH_ENTRY] [IMPL-LIBRARY_SEARCH_ENTRY] Optional q via BUILD_BOOKMARKS_INDEX_URL_WITH_QUERY
   */
  /**
   * === IMPL-FULL-BLOCK: IMPL-NON_WEB_TOOLS_TOOLBAR ===
   * [IMPL-NON_WEB_TOOLS_TOOLBAR] [ARCH-NON_WEB_TOOLS_TOOLBAR] [REQ-NON_WEB_TOOLS_TOOLBAR] How: setPopup tools-toolbar on non-web; clear or popup.html on web per iconClickOpensSidePanel.
   *
   * ## SYNC_ACTION_POPUP_FOR_TAB
   *
   * - Contract:
   *   - INPUT: tab, _iconClickOpensSidePanel
   *   - PRE: action.setPopup available
   *   - OUTPUT: popup path synced for tabId
   *   - POST: non-web → tools-toolbar.html; web + side-panel preference → empty popup; web + popup preference → popup.html
   *   - EFFECTS: IO
   *   - TERMINATION: total
   * - PROCEDURE: SYNC_ACTION_POPUP_FOR_TAB
   *   - IF NOT IS_WEB_PROTOCOL_URL(tab.url): action.setPopup({ tabId, popup: 'src/ui/tools-toolbar/tools-toolbar.html' }); RETURN
   *   - IF _iconClickOpensSidePanel === false: action.setPopup({ tabId, popup: 'src/ui/popup/popup.html' }); RETURN
   *   - action.setPopup({ tabId, popup: '' })
   *
   * === END IMPL-FULL-BLOCK: IMPL-NON_WEB_TOOLS_TOOLBAR ===
   */
  _syncActionPopupForTab (tab) {
    const chromeApi = typeof globalThis.chrome !== 'undefined' ? globalThis.chrome : null
    if (!chromeApi?.action?.setPopup || tab?.id == null) return
    if (!isWebProtocolUrl(tab.url)) {
      chromeApi.action.setPopup({ tabId: tab.id, popup: TOOLS_TOOLBAR_POPUP })
      return
    }
    if (this._iconClickOpensSidePanel === false) {
      chromeApi.action.setPopup({ tabId: tab.id, popup: FULL_POPUP_PATH })
      return
    }
    chromeApi.action.setPopup({ tabId: tab.id, popup: '' })
  }

  /**
   * === IMPL-FULL-BLOCK: IMPL-NON_WEB_TOOLS_TOOLBAR ===
   * [IMPL-NON_WEB_TOOLS_TOOLBAR] [ARCH-NON_WEB_TOOLS_TOOLBAR] [REQ-NON_WEB_TOOLS_TOOLBAR] How: On active tab activate/navigate-complete, if URL non-web send REQUEST_SIDE_PANEL_CLOSE.
   *
   * ## DISMISS_SIDE_PANEL_IF_NON_WEB
   *
   * - Contract:
   *   - INPUT: tab.url
   *   - PRE: SW runtime available
   *   - OUTPUT: message sent when non-web
   *   - POST: web URLs do not send dismiss for protocol reason
   *   - EFFECTS: IO (runtime.sendMessage)
   *   - TERMINATION: total
   * - PROCEDURE: DISMISS_SIDE_PANEL_IF_NON_WEB
   *   - IF NOT IS_WEB_PROTOCOL_URL(tab.url): runtime.sendMessage({ type: REQUEST_SIDE_PANEL_CLOSE })
   *
   * === END IMPL-FULL-BLOCK: IMPL-NON_WEB_TOOLS_TOOLBAR ===
   */
  _dismissSidePanelIfNonWeb (url) {
    if (isWebProtocolUrl(url)) return
    const chromeApi = typeof globalThis.chrome !== 'undefined' ? globalThis.chrome : null
    const runtime = chromeApi?.runtime || (typeof browser !== 'undefined' ? browser.runtime : null)
    if (!runtime?.sendMessage) return
    const p = runtime.sendMessage({ type: MESSAGE_TYPES.REQUEST_SIDE_PANEL_CLOSE })
    if (p && typeof p.catch === 'function') p.catch(() => {})
  }

  /**
   * === IMPL-FULL-BLOCK: IMPL-NON_WEB_TOOLS_TOOLBAR ===
   * [IMPL-NON_WEB_TOOLS_TOOLBAR] [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS] [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] How: tabs.create standalone Browser Bookmarks page (no longer side-panel tab).
   *
   * ## OPEN_BROWSER_BOOKMARKS_PAGE
   *
   * - Contract:
   *   - INPUT: none
   *   - PRE: runtime.getURL
   *   - OUTPUT: new tab with browser-bookmarks.html
   *   - POST: does not switch a side-panel tab (Bookmarks is not a side-panel surface)
   *   - EFFECTS: IO
   *   - TERMINATION: total
   * - PROCEDURE: OPEN_BROWSER_BOOKMARKS_PAGE
   *   - tabs.create({ url: runtime.getURL('src/ui/browser-bookmarks/browser-bookmarks.html') })
   *
   * === END IMPL-FULL-BLOCK: IMPL-NON_WEB_TOOLS_TOOLBAR ===
   */
  _openBrowserBookmarksPage () {
    const chromeApi = typeof globalThis.chrome !== 'undefined' ? globalThis.chrome : null
    const runtime = chromeApi?.runtime || browser.runtime
    const getURL = runtime?.getURL ? (path) => runtime.getURL(path) : () => ''
    const url = getURL(BROWSER_BOOKMARKS_PAGE)
    const tabsApi = chromeApi?.tabs ?? browser.tabs
    if (url && tabsApi?.create) tabsApi.create({ url })
  }

  /**
   * === IMPL-FULL-BLOCK: IMPL-NON_WEB_TOOLS_TOOLBAR ===
   * [IMPL-NON_WEB_TOOLS_TOOLBAR] [IMPL-ICON_CLICK_BEHAVIOR] [REQ-NON_WEB_TOOLS_TOOLBAR] How: open-side-panel / OPEN_SIDE_PANEL / handleActionClick on non-web must not sidePanel.open; ensure tools popup then openPopup.
   *
   * ## HANDLE_OPEN_SIDE_PANEL_WHEN_NON_WEB
   *
   * - Contract:
   *   - INPUT: active tab url
   *   - PRE: user gesture when openPopup
   *   - OUTPUT: tools toolbar shown
   *   - POST: non-web path never calls sidePanel.open
   *   - EFFECTS: IO
   *   - FAILURE_MODES: openPopup unavailable after setPopup (best-effort)
   *   - TERMINATION: total
   * - PROCEDURE: HANDLE_OPEN_SIDE_PANEL_WHEN_NON_WEB
   *   - IF IS_WEB_PROTOCOL_URL(url): existing side panel / popup path; RETURN
   *   - SYNC_ACTION_POPUP_FOR_TAB(tab)
   *   - action.openPopup()
   *
   * === END IMPL-FULL-BLOCK: IMPL-NON_WEB_TOOLS_TOOLBAR ===
   */
  _openToolsToolbar (tab) {
    const chromeApi = typeof globalThis.chrome !== 'undefined' ? globalThis.chrome : null
    if (tab) this._syncActionPopupForTab(tab)
    if (chromeApi?.action?.openPopup) {
      try { chromeApi.action.openPopup() } catch (_) {}
    }
  }

  /** [REQ-NON_WEB_TOOLS_TOOLBAR] [IMPL-NON_WEB_TOOLS_TOOLBAR] Open side panel on web; tools toolbar on non-web. */
  async _openSidePanelOrToolsToolbar () {
    const chromeApi = typeof globalThis.chrome !== 'undefined' ? globalThis.chrome : null
    const tabsApi = chromeApi?.tabs ?? (typeof browser !== 'undefined' ? browser.tabs : null)
    try {
      const tabs = tabsApi?.query ? await tabsApi.query({ active: true, currentWindow: true }) : []
      const tab = tabs && tabs[0]
      if (tab && !isWebProtocolUrl(tab.url)) {
        this._openToolsToolbar(tab)
        return
      }
    } catch (_) {}
    this._openSidePanelWithFallback()
  }

  _openBookmarksIndexTab (q = '') {
    const chromeApi = typeof globalThis.chrome !== 'undefined' ? globalThis.chrome : null
    const runtime = chromeApi?.runtime || browser.runtime
    const getURL = runtime?.getURL ? (path) => runtime.getURL(path) : () => ''
    const baseUrl = getURL('src/ui/bookmarks-table/bookmarks-table.html')
    const url = buildBookmarksIndexUrlWithQuery(baseUrl, q)
    const tabsApi = chromeApi?.tabs ?? browser.tabs
    if (url && tabsApi?.create) {
      tabsApi.create({ url })
    }
    // [IMPL-ICON_CLICK_BEHAVIOR] Cooperative close: panel closes if visible and open long enough.
    if (runtime?.sendMessage) {
      const p = runtime.sendMessage({ type: MESSAGE_TYPES.REQUEST_SIDE_PANEL_CLOSE })
      if (p && typeof p.catch === 'function') p.catch(() => {})
    }
  }

  /**
   * [REQ-ICON_CLICK_BEHAVIOR] [IMPL-ICON_CLICK_BEHAVIOR] [IMPL-EXTENSION_COMMANDS] [IMPL-CONTEXT_MENU_QUICK_ACCESS]
   * Open side panel using cached windowId or cold-start fallback (tabs.query callback). Preserves user gesture for sidePanel.open.
   * @param {(result: { success: boolean; error?: string }) => void} [onComplete] Called when open completes (for OPEN_SIDE_PANEL message response).
   */
  _openSidePanelWithFallback (onComplete) {
    const chromeApi = typeof globalThis.chrome !== 'undefined' ? globalThis.chrome : null
    if (!chromeApi?.sidePanel?.open) {
      onComplete?.({ success: false, error: 'Side panel is not available.' })
      return
    }
    if (this._sidePanelWindowId != null) {
      try {
        chromeApi.sidePanel.open({ windowId: this._sidePanelWindowId })
        onComplete?.({ success: true })
      } catch (e) {
        onComplete?.({ success: false, error: e?.message ?? String(e) })
      }
      return
    }
    const tabsApi = chromeApi?.tabs ?? (typeof browser !== 'undefined' ? browser.tabs : null)
    if (tabsApi?.query) {
      tabsApi.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs && tabs[0]
        const tryOpen = (target) => {
          if (target?.windowId) {
            try {
              chromeApi.sidePanel.open({ windowId: target.windowId })
              onComplete?.({ success: true })
            } catch (e) {
              onComplete?.({ success: false, error: e?.message ?? String(e) })
            }
          } else if (target?.id) {
            try {
              chromeApi.sidePanel.open({ tabId: target.id })
              onComplete?.({ success: true })
            } catch (e) {
              onComplete?.({ success: false, error: e?.message ?? String(e) })
            }
          } else {
            onComplete?.({ success: false, error: 'No browser window available for side panel. Switch to a browser tab and try again.' })
          }
        }
        if (tab && _isRestrictedForSidePanel(tab.url)) {
          tabsApi.query({ url: ['http://*/*', 'https://*/*'] }, (webTabs) => {
            tryOpen(webTabs && webTabs[0] ? webTabs[0] : tab)
          })
        } else {
          tryOpen(tab)
        }
      })
    } else {
      onComplete?.({ success: false, error: 'Side panel is not available.' })
    }
  }

  /** [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE] Seed _sidePanelWindowId from active tab's normal window. Implements cache so OPEN_SIDE_PANEL handler can open panel without await (user gesture). [IMPL-ICON_CLICK_BEHAVIOR] Skip seeding when active tab is chrome:// or chrome-extension:// (Chrome does not show side panel on those pages). */
  _seedSidePanelWindowCache () {
    const winApi = typeof globalThis.chrome !== 'undefined' && globalThis.chrome.windows ? globalThis.chrome.windows : browser.windows
    const tabsApi = typeof globalThis.chrome !== 'undefined' && globalThis.chrome.tabs ? globalThis.chrome.tabs : browser.tabs
    const setCache = (windowId) => {
      if (windowId != null) {
        this._sidePanelWindowId = windowId
      }
    }
    tabsApi.query({ active: true }).then((tabs) => {
      const tab = tabs && tabs[0]
      if (tab?.windowId != null && !_isRestrictedForSidePanel(tab?.url) && winApi.get) {
        winApi.get(tab.windowId).then((w) => { if (w?.type === 'normal') setCache(w.id) }).catch(() => {})
      }
    }).catch(() => {})
  }

  // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] Browser profile startup: clear persisted user recent tags ([REQ-RECENT_TAGS_SYSTEM] fresh session).
  async handleExtensionStartup () {
    console.log('[IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] Extension startup - clearing recent tags shared memory and storage')
    await this.recentTagsMemory.clearRecentTags()
  }

  // [IMPL-MV3_MIGRATION] [ARCH-MV3_MIGRATION] [REQ-MANIFEST_V3_MIGRATION]: Handle extension installation and updates
  async handleInstall (details) {
    console.log('🚀 Hoverboard installed/updated:', details.reason)

    if (details.reason === 'install') {
      // [IMPL-MV3_MIGRATION] [ARCH-MV3_MIGRATION] [REQ-MANIFEST_V3_MIGRATION]: Initialize default settings for first-time installation
      await this.configManager.initializeDefaults()

      // [IMPL-MV3_MIGRATION] [ARCH-MV3_MIGRATION] [REQ-MANIFEST_V3_MIGRATION]: Set up context menus if needed
      this.setupContextMenus()
    }
  }

  async handleMessage (message, sender) {
    // [IMPL-UI_INSPECTOR] Enable inspector in SW from storage (no localStorage in SW)
    try {
      const prefs = await browser.storage.local.get('DEBUG_HOVERBOARD_UI')
      if (prefs.DEBUG_HOVERBOARD_UI) uiInspector.setEnabled(true)
    } catch (_) {}

    try {
      // [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE] OPEN_SIDE_PANEL is handled in onMessage listener only (synchronous open for user gesture); not processed here.

      // [REQ-NATIVE_HOST_WRAPPER] [IMPL-NATIVE_HOST_WRAPPER] Optional ping to native host for testing connectivity
      if (message.type === 'NATIVE_PING') {
        const pingResult = await this.pingNativeHost()
        const out = { success: true, data: pingResult }
        uiInspector.recordMessage(message.type, message.data, sender, out)
        return out
      }

      // [ARCH-LOCAL_STORAGE_PROVIDER] [IMPL-LOCAL_BOOKMARKS_INDEX] Lazy-init provider (mutex for concurrent cold start)
      await this.ensureBookmarkProviderInitialized()

      // [ARCH-LOCAL_STORAGE_PROVIDER] Storage mode switch: re-init provider and respond (no processMessage)
      if (message.type === MESSAGE_TYPES.SWITCH_STORAGE_MODE) {
        await this.initBookmarkProvider()
        const out = { success: true, data: { switched: true } }
        uiInspector.recordMessage(message.type, message.data, sender, out)
        return out
      }

      // [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] Get referrers from tab documents; must run in SW so executeScript runs in tab context.
      if (message.type === MESSAGE_TYPES.GET_TAB_REFERRERS) {
        const tabs = message.data?.tabs || []
        const scripting = typeof chrome !== 'undefined' && chrome.scripting ? chrome.scripting : (typeof browser !== 'undefined' && browser.scripting ? browser.scripting : null)
        const referrers = /** @type {Record<number, string>} */ ({})
        if (scripting && scripting.executeScript) {
          await Promise.all(
            tabs.map(async (tab) => {
              const id = tab.id ?? tab.tabId
              const url = tab.url
              if (id == null || !url || !/^https?:\/\//i.test(url)) {
                if (id != null) referrers[id] = ''
                return
              }
              try {
                const results = await scripting.executeScript({
                  target: { tabId: id },
                  func: () => document.referrer || ''
                })
                const raw = results?.[0]?.result
                referrers[id] = (raw != null && String(raw) !== 'null') ? String(raw) : ''
              } catch (_) {
                referrers[id] = ''
              }
            })
          )
        }
        const out = { success: true, data: referrers }
        uiInspector.recordMessage(message.type, message.data, sender, out)
        return out
      }

      // [REQ-SIDE_PANEL_RECENTLY_CLOSED_TABS] [ARCH-SIDE_PANEL_RECENTLY_CLOSED_TABS] [IMPL-SIDE_PANEL_RECENTLY_CLOSED_TABS] Get recently closed tabs from chrome.sessions; returns raw Session[] for panel to normalize.
      if (message.type === MESSAGE_TYPES.GET_RECENTLY_CLOSED_TABS) {
        const sessionsApi = typeof chrome !== 'undefined' && chrome.sessions ? chrome.sessions : (typeof browser !== 'undefined' && browser.sessions ? browser.sessions : null)
        if (!sessionsApi || typeof sessionsApi.getRecentlyClosed !== 'function') {
          const out = { success: false, error: 'sessions API unavailable' }
          uiInspector.recordMessage(message.type, message.data, sender, out)
          return out
        }
        try {
          const sessions = await sessionsApi.getRecentlyClosed({ maxResults: 25 })
          const out = { success: true, data: sessions || [] }
          uiInspector.recordMessage(message.type, message.data, sender, out)
          return out
        } catch (err) {
          const out = { success: false, error: String(err && err.message ? err.message : err) }
          uiInspector.recordMessage(message.type, message.data, sender, out)
          return out
        }
      }

      // [REQ-BOOKMARK_USAGE_TRACKING] [ARCH-BOOKMARK_USAGE_TRACKING] [IMPL-BOOKMARK_USAGE_TRACKING] Get usage for one URL or all (data.url optional).
      if (message.type === MESSAGE_TYPES.GET_BOOKMARK_USAGE) {
        try {
          const url = message.data?.url
          const data = url ? await this.usageTracker.getUsage(url) : await this.usageTracker.getAllUsage()
          const out = { success: true, data }
          uiInspector.recordMessage(message.type, message.data, sender, out)
          return out
        } catch (err) {
          const out = { success: false, error: String(err && err.message ? err.message : err) }
          uiInspector.recordMessage(message.type, message.data, sender, out)
          return out
        }
      }

      // [REQ-BOOKMARK_USAGE_TRACKING] [IMPL-BOOKMARK_USAGE_TRACKING] Get most frequent and most recent (data.n optional, default 10).
      if (message.type === MESSAGE_TYPES.GET_BOOKMARK_USAGE_STATS) {
        try {
          const n = Math.min(100, Math.max(1, Number(message.data?.n) || 10))
          const [mostFrequent, mostRecent] = await Promise.all([
            this.usageTracker.getMostFrequent(n),
            this.usageTracker.getMostRecent(n)
          ])
          const out = { success: true, data: { mostFrequent, mostRecent } }
          uiInspector.recordMessage(message.type, message.data, sender, out)
          return out
        } catch (err) {
          const out = { success: false, error: String(err && err.message ? err.message : err) }
          uiInspector.recordMessage(message.type, message.data, sender, out)
          return out
        }
      }

      // [REQ-BOOKMARK_USAGE_TRACKING] [IMPL-BOOKMARK_USAGE_TRACKING] Get full navigation graph (edges: sourceUrl, targetUrl, count, timestamps).
      if (message.type === MESSAGE_TYPES.GET_BOOKMARK_NAVIGATION_GRAPH) {
        try {
          const data = await this.usageTracker.getNavigationGraph()
          const out = { success: true, data }
          uiInspector.recordMessage(message.type, message.data, sender, out)
          return out
        } catch (err) {
          const out = { success: false, error: String(err && err.message ? err.message : err) }
          uiInspector.recordMessage(message.type, message.data, sender, out)
          return out
        }
      }

      // [REQ-BOOKMARK_USAGE_TRACKING] [IMPL-BOOKMARK_USAGE_TRACKING_UI] Get inbound links for a URL (for This Page "Referred from").
      if (message.type === MESSAGE_TYPES.GET_BOOKMARK_INBOUND_LINKS) {
        try {
          const url = message.data?.url
          const data = url ? await this.usageTracker.getInboundLinks(url) : []
          const out = { success: true, data }
          uiInspector.recordMessage(message.type, message.data, sender, out)
          return out
        } catch (err) {
          const out = { success: false, error: String(err && err.message ? err.message : err) }
          uiInspector.recordMessage(message.type, message.data, sender, out)
          return out
        }
      }

      // [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] Get page body text per tab for search scope "Page text". SW runs executeScript per tab; returns tabId -> string (title + body.innerText capped).
      if (message.type === MESSAGE_TYPES.GET_TABS_PAGE_TEXT) {
        const tabs = message.data?.tabs || []
        const scripting = typeof chrome !== 'undefined' && chrome.scripting ? chrome.scripting : (typeof browser !== 'undefined' && browser.scripting ? browser.scripting : null)
        const pageTextMap = /** @type {Record<number, string>} */ ({})
        const extractPageText = () => {
          const maxLen = 16000
          const title = (document.title && String(document.title).trim()) || ''
          const raw = document.body && document.body.innerText ? String(document.body.innerText).trim() : ''
          const text = (title + ' ' + raw).trim()
          return text.length > maxLen ? text.slice(0, maxLen) : text
        }
        if (scripting && scripting.executeScript) {
          await Promise.all(
            tabs.map(async (tab) => {
              const id = tab.id ?? tab.tabId
              const url = tab.url
              if (id == null || !url || !/^https?:\/\//i.test(url)) {
                if (id != null) pageTextMap[id] = ''
                return
              }
              try {
                const results = await scripting.executeScript({
                  target: { tabId: id },
                  func: extractPageText
                })
                const raw = results?.[0]?.result
                pageTextMap[id] = typeof raw === 'string' ? raw : ''
              } catch (_) {
                pageTextMap[id] = ''
              }
            })
          )
        }
        const out = { success: true, data: pageTextMap }
        uiInspector.recordMessage(message.type, message.data, sender, out)
        return out
      }

      // [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] Get important-tags snippet per tab; optional importantTagSources (array) selects which DOM sources to collect. SW runs executeScript per tab with args; returns tabId -> string.
      if (message.type === MESSAGE_TYPES.GET_TABS_IMPORTANT_TAGS) {
        const tabs = message.data?.tabs || []
        const rawSources = message.data?.importantTagSources
        const defaultSources = ['title', 'meta description', 'og:title', 'h1', 'h2', 'h3', 'img alt', 'a title']
        const sources = Array.isArray(rawSources) && rawSources.length > 0 ? rawSources : defaultSources
        const scripting = typeof chrome !== 'undefined' && chrome.scripting ? chrome.scripting : (typeof browser !== 'undefined' && browser.scripting ? browser.scripting : null)
        const importantTagsMap = /** @type {Record<number, string>} */ ({})
        /** Injectable: receives sources array; collects only those DOM sources (title, meta description, og:title, h1–h3, img alt, a title). Must be serializable for executeScript. */
        function collectImportantTagsWithSources (sourcesArg) {
          const maxLen = 8192
          const parts = []
          const doc = document
          const s = sourcesArg && Array.isArray(sourcesArg) ? sourcesArg : []
          const has = (name) => s.includes(name)
          if (has('title')) {
            const title = (doc.title && String(doc.title).trim()) || ''
            if (title) parts.push(title)
          }
          if (has('meta description')) {
            const metaDesc = doc.querySelector('meta[name="description"]')
            if (metaDesc) {
              const c = (metaDesc.getAttribute('content') || '').trim()
              if (c) parts.push(c)
            }
          }
          if (has('og:title')) {
            const ogTitle = doc.querySelector('meta[property="og:title"]')
            if (ogTitle) {
              const c = (ogTitle.getAttribute('content') || '').trim()
              if (c) parts.push(c)
            }
          }
          if (has('h1') || has('h2') || has('h3')) {
            const sel = ['h1', 'h2', 'h3'].filter((h) => has(h))
            if (sel.length) {
              const headings = doc.querySelectorAll(sel.join(', '))
              headings.forEach((el) => {
                const t = (el.textContent || '').trim()
                if (t) parts.push(t)
              })
            }
          }
          if (has('img alt')) {
            const imgs = doc.querySelectorAll('img[alt]')
            imgs.forEach((el) => {
              const alt = (el.getAttribute('alt') || '').trim()
              if (alt) parts.push(alt)
            })
          }
          if (has('a title')) {
            const linksWithTitle = doc.querySelectorAll('a[title]')
            const linkTitles = []
            linksWithTitle.forEach((el) => {
              const t = (el.getAttribute('title') || '').trim()
              if (t) linkTitles.push(t)
            })
            if (linkTitles.length > 0) parts.push(linkTitles.slice(0, 50).join(' '))
          }
          const joined = parts.join(' ')
          return joined.length > maxLen ? joined.slice(0, maxLen) : joined
        }
        if (scripting && scripting.executeScript) {
          await Promise.all(
            tabs.map(async (tab) => {
              const id = tab.id ?? tab.tabId
              const url = tab.url
              if (id == null || !url || !/^https?:\/\//i.test(url)) {
                if (id != null) importantTagsMap[id] = ''
                return
              }
              try {
                const results = await scripting.executeScript({
                  target: { tabId: id },
                  func: collectImportantTagsWithSources,
                  args: [sources]
                })
                const raw = results?.[0]?.result
                importantTagsMap[id] = typeof raw === 'string' ? raw : ''
              } catch (_) {
                importantTagsMap[id] = ''
              }
            })
          )
        }
        const out = { success: true, data: importantTagsMap }
        uiInspector.recordMessage(message.type, message.data, sender, out)
        return out
      }

      // [IMPL-DEV_COMMAND_INSPECTION] [REQ-UI_INSPECTION] [REQ-URL_TAGS_DISPLAY] [REQ-PER_BOOKMARK_STORAGE_BACKEND] DEV_COMMAND: only when debug flag set; getStorageSnapshot in SW.
      if (message.type === MESSAGE_TYPES.DEV_COMMAND) {
        let devEnabled = false
        try {
          const prefs = await browser.storage.local.get('DEBUG_HOVERBOARD_UI')
          devEnabled = !!prefs.DEBUG_HOVERBOARD_UI
        } catch (_) {}
        if (!devEnabled) {
          const out = { success: false, error: 'debug not enabled' }
          uiInspector.recordMessage(message.type, message.data, sender, out)
          return out
        }
        if (message.data?.subcommand === 'getStorageSnapshot') {
          const local = await browser.storage.local.get(null)
          const sync = await browser.storage.sync.get(null).catch(() => ({}))
          const redact = (obj) => Object.keys(obj).filter((k) => !/token|password|secret|auth/i.test(k))
          const out = { success: true, data: { local: redact(local), sync: redact(sync) } }
          uiInspector.recordMessage(message.type, message.data, sender, out)
          return out
        }
        if (message.data?.subcommand === 'getLastActions') {
          const n = message.data?.n ?? 20
          const out = { success: true, data: uiInspector.getLastActions(n) }
          uiInspector.recordMessage(message.type, message.data, sender, out)
          return out
        }
        if (message.data?.subcommand === 'getLastMessages') {
          const n = message.data?.n ?? 20
          const out = { success: true, data: uiInspector.getLastMessages(n) }
          uiInspector.recordMessage(message.type, message.data, sender, out)
          return out
        }
      }

      console.log('[SERVICE-WORKER] Processing message:', message.type)
      const response = await this.messageHandler.processMessage(message, sender)
      console.log('[SERVICE-WORKER] Message processed successfully:', response)

      // [IMPL-BADGE_REFRESH] [ARCH-BADGE] [REQ-BADGE_INDICATORS] After saveTag/deleteTag/saveBookmark success: resolve tab, updateBadgeForTab(tab).
      const badgeRefreshTypes = [MESSAGE_TYPES.SAVE_TAG, MESSAGE_TYPES.DELETE_TAG, MESSAGE_TYPES.SAVE_BOOKMARK]
      if (badgeRefreshTypes.includes(message.type)) {
        let tab = sender.tab
        if (!tab && message.type === MESSAGE_TYPES.SAVE_BOOKMARK) {
          const tabs = await browser.tabs.query({ active: true, currentWindow: true })
          if (tabs.length > 0) tab = tabs[0]
        }
        if (tab) await this.updateBadgeForTab(tab)
      }

      // [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] Handlers that already return { success, data } (e.g. getCurrentBookmark) are returned as-is so panel gets reply.data.url. Others (getOptions, getTabId, GET_PAGE_CONTENT success) return plain shapes; wrap as { success: true, data: response } for popup/E2E contract.
      const out = (response && typeof response === 'object' && 'success' in response) ? response : { success: true, data: response }
      uiInspector.recordMessage(message.type, message.data, sender, out)
      return out
    } catch (error) {
      console.error('Service worker message error:', error)
      const out = { success: false, error: error.message }
      uiInspector.recordMessage(message?.type, message?.data, sender, out)
      return out
    }
  }

  /**
   * [REQ-NATIVE_HOST_WRAPPER] Ping native messaging host to verify connectivity.
   * @returns {Promise<{pong?: boolean, error?: string}>}
   */
  async pingNativeHost () {
    if (typeof chrome === 'undefined' || !chrome.runtime?.sendNativeMessage) {
      return { error: 'Native messaging not available' }
    }
    return new Promise((resolve) => {
      chrome.runtime.sendNativeMessage('com.hoverboard.native_host', { type: 'ping' }, (response) => {
        if (chrome.runtime.lastError) {
          resolve({ error: chrome.runtime.lastError.message })
          return
        }
        resolve(response || { error: 'No response' })
      })
    })
  }

  /**
   * [REQ-LINK_HEALTH] [ARCH-LINK_HEALTH] [IMPL-LINK_HEALTH]
   * Direct HEAD then GET with inhibit skip + AbortController timeout; persist under hoverboard_link_health.
   * @param {string[]} urls
   * @param {{ timeoutMs?: number }} [options] - optional timeout override (tests)
   */
  async _checkLinkHealth (urls = [], options = {}) {
    const {
      buildHealthRecord,
      mergeHealthMap,
      urlMatchesInhibitList,
      fetchWithLinkHealthTimeout,
      isLinkHealthChecksEnabled,
      LINK_HEALTH_STORAGE_KEY,
      LINK_HEALTH_INHIBITED_ERROR,
      LINK_HEALTH_FETCH_TIMEOUT_MS
    } = await import('../shared/link-health.js')
    let config = {}
    try {
      config = await this.configManager.getConfig()
    } catch (e) {
      console.debug('DEBUG: [REQ-LINK_HEALTH] getConfig failed; treating checks as disabled', e?.message || e)
    }
    if (!isLinkHealthChecksEnabled(config)) {
      console.debug('DEBUG: [REQ-LINK_HEALTH] CHECK_LINK_HEALTH rejected (opt-in off)')
      return { success: false, error: 'Link health checks disabled', checked: 0, results: {} }
    }
    const timeoutMs = options.timeoutMs ?? LINK_HEALTH_FETCH_TIMEOUT_MS
    const list = (Array.isArray(urls) ? urls : []).filter((u) => typeof u === 'string' && /^https?:/i.test(u)).slice(0, 50)
    let inhibitUrls = []
    try {
      inhibitUrls = await this.configManager.getInhibitUrls()
    } catch (e) {
      console.debug('DEBUG: [REQ-LINK_HEALTH] getInhibitUrls failed; treating as empty', e?.message || e)
      inhibitUrls = []
    }
    const stored = await chrome.storage.local.get(LINK_HEALTH_STORAGE_KEY)
    let map = stored[LINK_HEALTH_STORAGE_KEY] || {}
    const results = {}
    for (const url of list) {
      let record
      if (urlMatchesInhibitList(url, inhibitUrls)) {
        console.debug('DEBUG: [REQ-LINK_HEALTH] skip fetch (inhibited)', url)
        record = buildHealthRecord({ error: LINK_HEALTH_INHIBITED_ERROR })
      } else {
        try {
          // Status-only: do not buffer GET/HEAD bodies
          let res = await fetchWithLinkHealthTimeout(url, { method: 'HEAD' }, { timeoutMs })
          if (!res.ok && (res.status === 405 || res.status === 501)) {
            res = await fetchWithLinkHealthTimeout(url, { method: 'GET' }, { timeoutMs })
          }
          record = buildHealthRecord({ status: res.status, ok: res.ok })
        } catch (e) {
          record = buildHealthRecord({ error: e.message || String(e) })
        }
      }
      map = mergeHealthMap(map, url, record)
      results[url] = record
    }
    await chrome.storage.local.set({ [LINK_HEALTH_STORAGE_KEY]: map })
    return { success: true, results, checked: list.length }
  }

  async _getLinkHealthMap () {
    const { LINK_HEALTH_STORAGE_KEY } = await import('../shared/link-health.js')
    const stored = await chrome.storage.local.get(LINK_HEALTH_STORAGE_KEY)
    return stored[LINK_HEALTH_STORAGE_KEY] || {}
  }

  /**
   * [REQ-LOCAL_QUERY_API] [IMPL-LOCAL_QUERY_API] Aggregate Local+File+Sync+Browser into aggregate-snapshot.json via native host.
   */
  async _refreshApiSnapshot () {
    try {
      if (!this.messageHandler?.handleGetAggregatedBookmarksForIndex) {
        return { success: false, error: 'Bookmark router not ready' }
      }
      const agg = await this.messageHandler.handleGetAggregatedBookmarksForIndex()
      const bookmarks = agg?.bookmarks || []
      const { buildAggregateSnapshotPayload } = await import('../shared/aggregate-snapshot.js')
      const payload = buildAggregateSnapshotPayload(bookmarks)
      if (typeof chrome === 'undefined' || !chrome.runtime?.sendNativeMessage) {
        return { success: false, error: 'Native messaging not available' }
      }
      const response = await new Promise((resolve) => {
        chrome.runtime.sendNativeMessage(
          'com.hoverboard.native_host',
          {
            type: 'writeBookmarksFile',
            path: '~/.hoverboard/aggregate-snapshot.json',
            data: payload
          },
          (r) => {
            if (chrome.runtime.lastError) {
              resolve({ error: chrome.runtime.lastError.message })
              return
            }
            resolve(r || { error: 'No response' })
          }
        )
      })
      if (response?.error || response?.type === 'error') {
        return { success: false, error: response.error || response.message || 'write failed' }
      }
      return { success: true, count: payload.bookmarks.length }
    } catch (e) {
      return { success: false, error: e.message || String(e) }
    }
  }

  // [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE] Update _sidePanelWindowId when user activates a tab in a normal window. Implements cache maintenance so "open Tags tree" has a valid windowId.
  async handleTabActivated (activeInfo) {
    try {
      const tab = await browser.tabs.get(activeInfo.tabId)
      if (tab?.windowId != null) {
        try {
          const win = await (typeof globalThis.chrome !== 'undefined' && globalThis.chrome.windows ? globalThis.chrome.windows : browser.windows).get(tab.windowId)
          if (win?.type === 'normal' && win?.id != null) this._sidePanelWindowId = win.id
        } catch (_) {}
      }
      // [REQ-NON_WEB_TOOLS_TOOLBAR] [IMPL-NON_WEB_TOOLS_TOOLBAR] Close panel on non-web; sync badge popup.
      this._dismissSidePanelIfNonWeb(tab?.url)
      this._syncActionPopupForTab(tab)
      if (tab.url) {
        const bookmark = await this.updateBadgeForTab(tab)
        await this._recordBookmarkVisitIfNeeded(tab, bookmark)
      }
    } catch (error) {
      console.error('Tab activation error:', error)
    }
  }

  async handleTabUpdated (tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && tab.url) {
      try {
        // [REQ-NON_WEB_TOOLS_TOOLBAR] [IMPL-NON_WEB_TOOLS_TOOLBAR] Navigate to non-web → dismiss panel; resync popup.
        const tabsApi = typeof globalThis.chrome !== 'undefined' && globalThis.chrome.tabs ? globalThis.chrome.tabs : browser.tabs
        const active = await tabsApi.query({ active: true, currentWindow: true })
        if (active?.[0]?.id === tabId) {
          this._dismissSidePanelIfNonWeb(tab.url)
          this._syncActionPopupForTab(tab)
        }
        const bookmark = await this.updateBadgeForTab(tab)
        await this._recordBookmarkVisitIfNeeded(tab, bookmark)
      } catch (error) {
        console.error('Tab update error:', error)
      }
    }
  }

  /**
   * [IMPL-BOOKMARK_USAGE_TRACKING] Returns the normalized bookmark for the tab URL (so callers can record visit if bookmarked).
   * @param {chrome.tabs.Tab} tab
   * @returns {Promise<{ url: string, time?: string, tags?: string[], hash?: string } | undefined>}
   */
  async updateBadgeForTab (tab) {
    const config = await this.configManager.getConfig()
    if (!config.setIconOnLoad) return undefined

    try {
      await this.ensureBookmarkProviderInitialized()
      const raw = await this.bookmarkProvider.getBookmarkForUrl(tab.url)
      // [IMPL-URL_TAGS_DISPLAY] Normalize so badge and popup use same display contract (tags array)
      const bookmark = normalizeBookmarkForDisplay(raw)
      if (!bookmark.url) bookmark.url = tab.url
      await this.badgeManager.updateBadge(tab.id, bookmark)
      return bookmark
    } catch (error) {
      console.error('Badge update error:', error)
      return undefined
    }
  }

  /**
   * [REQ-BOOKMARK_USAGE_TRACKING] [ARCH-BOOKMARK_USAGE_TRACKING] [IMPL-BOOKMARK_USAGE_TRACKING]
   * Record a visit to a bookmarked URL and optional referrer (for navigation graph). Debounced per URL in tracker.
   * @param {chrome.tabs.Tab} tab
   * @param {{ url: string, time?: string, tags?: string[], hash?: string } | undefined} bookmark
   */
  async _recordBookmarkVisitIfNeeded (tab, bookmark) {
    if (!bookmark?.url || (!bookmark.time && (!bookmark.tags || bookmark.tags.length === 0) && !bookmark.hash)) return
    const scripting = (typeof globalThis.chrome !== 'undefined' && globalThis.chrome.scripting) || (typeof browser !== 'undefined' && browser.scripting) || null
    let referrer = ''
    if (scripting?.executeScript && tab?.id != null && tab?.url && /^https?:\/\//i.test(tab.url)) {
      try {
        const results = await scripting.executeScript({
          target: { tabId: tab.id },
          func: () => document.referrer || ''
        })
        const raw = results?.[0]?.result
        referrer = (raw != null && String(raw) !== 'null') ? String(raw) : ''
      } catch (_) {
        referrer = ''
      }
    }
    await this.usageTracker.recordVisit(tab.url, referrer)
  }

  /**
   * [REQ-QUICK_ACCESS_ENTRY] [ARCH-QUICK_ACCESS_ENTRY] [IMPL-CONTEXT_MENU_QUICK_ACCESS]
   * Create context menu parent "Hoverboard" and four items; onClicked performs same four actions as handleCommand.
   */
  setupContextMenus () {
    const api = (typeof globalThis.chrome !== 'undefined' && globalThis.chrome.contextMenus) || browser.contextMenus
    if (!api?.create || !api?.onClicked?.addListener) return
    api.removeAll(() => {
      api.create({ id: 'hoverboard-root', title: 'Hoverboard', contexts: ['all'] })
      api.create({ id: 'hoverboard-open-side-panel', parentId: 'hoverboard-root', title: 'Open side panel', contexts: ['all'] })
      api.create({ id: 'hoverboard-open-options', parentId: 'hoverboard-root', title: 'Open options', contexts: ['all'] })
      api.create({ id: 'hoverboard-open-bookmarks-index', parentId: 'hoverboard-root', title: 'Open bookmarks index', contexts: ['all'] })
      api.create({ id: 'hoverboard-open-import', parentId: 'hoverboard-root', title: 'Open browser bookmark import', contexts: ['all'] })
    })
    const self = this
    api.onClicked.addListener((info) => {
      const menuId = info?.menuItemId
      if (menuId === 'hoverboard-open-side-panel') {
        // [REQ-NON_WEB_TOOLS_TOOLBAR] Same as open-side-panel command (tools toolbar on non-web).
        self._openSidePanelOrToolsToolbar()
        return
      }
      if (menuId === 'hoverboard-open-options') {
        const runtime = (typeof globalThis.chrome !== 'undefined' && globalThis.chrome.runtime) || browser.runtime
        if (runtime?.openOptionsPage) runtime.openOptionsPage()
        return
      }
      if (menuId === 'hoverboard-open-bookmarks-index') {
        // [REQ-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX] OPEN_BOOKMARKS_INDEX_TAB
        this._openBookmarksIndexTab()
        return
      }
      if (menuId === 'hoverboard-open-import') {
        const chromeApi = typeof globalThis.chrome !== 'undefined' ? globalThis.chrome : null
        const runtime = chromeApi?.runtime || browser.runtime
        const getURL = runtime?.getURL ? (path) => runtime.getURL(path) : () => ''
        const url = getURL('src/ui/browser-bookmark-import/browser-bookmark-import.html')
        if (url && (chromeApi?.tabs?.create || browser.tabs?.create)) (chromeApi?.tabs ?? browser.tabs).create({ url })
      }
    })
  }
}

// [IMPL-MV3_MIGRATION] [ARCH-MV3_MIGRATION] [REQ-MANIFEST_V3_MIGRATION]: Initialize the service worker for V3 architecture
const serviceWorker = new HoverboardServiceWorker()

// [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] - Make shared memory accessible globally
if (serviceWorker.recentTagsMemory) {
  self.recentTagsMemory = serviceWorker.recentTagsMemory
  globalThis.recentTagsMemory = serviceWorker.recentTagsMemory
}

// [IMPL-MV3_MIGRATION] [ARCH-MV3_MIGRATION] [REQ-MANIFEST_V3_MIGRATION]: Export for testing and external access
export { HoverboardServiceWorker }

// [IMPL-MV3_MIGRATION] [ARCH-MV3_MIGRATION] [REQ-MANIFEST_V3_MIGRATION]: Global service worker ready indicator
console.log('✅ Hoverboard Service Worker (V3) loaded and ready!')
