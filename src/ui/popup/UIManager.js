/**
 * UIManager - Handles all UI interactions and DOM manipulation
 * [IMPL-UIManager_SCOPED_ROOT] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] Optional container:
 * when set, cacheElements resolves elements via container.querySelector('[data-popup-ref="id"]') for panel context.
 */

/**
 * === IMPL-FULL-BLOCK: IMPL-BOOKMARK_USAGE_TRACKING_UI ===
 * [IMPL-BOOKMARK_USAGE_TRACKING_UI] [ARCH-BOOKMARK_USAGE_TRACKING_UI] [REQ-BOOKMARK_USAGE_TRACKING] — Block 1: Surface 1 – This Page inline usage section. REQ: UI display of usage; ARCH: three surfaces; IMPL: popup/panel fetch and render.
 *
 * ## MAIN
 *
 * - 1c. Else: hide usageStatsSection. [REQ-BOOKMARK_USAGE_TRACKING] satisfaction: UI can query and display. How: 2d. Sort comparator: add visits (numeric), lastVisited (string compare).  display and sort.
 * - Contract:
 *   - INPUT: context / caller args
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: result
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - EFFECTS: Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: MAIN
 *   - How (sub-block): Block 2: Surface 2 – Index table Visits and Last Visited columns. ARCH: Index columns; IMPL: merge usage, render, sort.
 *   - How (sub-block): 2a. On load: after getAggregatedBookmarksForIndex, send getBookmarkUsage() (no url) to get all usage array.
 *   - How (sub-block): 2b. Build map url -> usage; for each bookmark b, set b.visits = map[b.url]?.visitCount ?? 0, b.lastVisited = map[b.url]?.lastVisitedAt ?? ''.
 *   - How (sub-block): 2c. renderTableBody: for each row add <td class="col-visits"> and <td class="col-last-visited">; lastVisited uses timeDisplayMode (absolute/age).
 *   - How (sub-block): Block 3: Surface 3 – Usage side-panel tab. ARCH: Usage tab; IMPL: initUsageTab, fetch stats and graph, render.
 *   - How (sub-block): 3a. Tab state: TAB_USAGE = 'usage'; TAB_IDS include it; getVisibilityForTab returns usageVisible for activeTab === TAB_USAGE.
 *   - How (sub-block): 3b. initUsageTab(): send getBookmarkUsageStats({ n: 10 }), getBookmarkNavigationGraph(); render Most Visited list (mostFrequent), Recently Visited list (mostRecent), Navigation Graph (edges grouped by sourceUrl).
 *
 * === END IMPL-FULL-BLOCK: IMPL-BOOKMARK_USAGE_TRACKING_UI ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-LOCAL_BOOKMARKS_INDEX ===
 * [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [ARCH-STORAGE_INDEX_AND_ROUTER] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-LOCAL_BOOKMARKS_INDEX] [REQ-BROWSER_BOOKMARK_STORAGE] — Index page: getAggregatedBookmarksForIndex (fallback getLocalBookmarksForIndex), metadata-first filter pipeline, table with Storage column, and per-store filtered / total provider-row counts; Stores L/F/S/B.
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
 *   - How (sub-block): Apply Stores selection only after metadata-filtered rows and Store counts are derived.
 *
 * ## INITIALIZE_STORE_FILTERS
 *
 * - [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [REQ-LOCAL_BOOKMARKS_INDEX] How: The Local Bookmarks Index starts with Local, File, Sync, and Browser Store controls checked so loaded rows are visible without an extra discovery step.
 * - Contract:
 *   - INPUT: Store checkbox elements
 *   - PRE: #store-local, #store-file, #store-sync, and #store-browser exist or are safely skipped
 *   - OUTPUT: initialized Store controls and count labels
 *   - POST:
 *     - success => all four Store checkboxes are checked unless the user changes them
 *     - success => each count label is available for filtered / total row-count updates
 *   - EFFECTS: State, DOM
 *   - TERMINATION: total
 * - PROCEDURE: INITIALIZE_STORE_FILTERS
 *   - 1. SET checked = true on #store-local, #store-file, #store-sync, and #store-browser
 *   - 2. KEEP user changes to checked state; do not reload solely to refresh counts
 *
 * ## COUNT_INDEX_ROWS_BY_STORE
 *
 * - [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [ARCH-STORAGE_INDEX_AND_ROUTER] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-LOCAL_BOOKMARKS_INDEX] [REQ-BROWSER_BOOKMARK_STORAGE] How: Normalize provider storage values, count rows directly, and derive filtered / total counts before applying Store checkbox selection.
 * - Contract:
 *   - INPUT: allBookmarks (provider-row[]), metadataFilteredBookmarks (provider-row[])
 *   - PRE: arrays may be empty; rows may omit storage; storage values may vary in case or contain whitespace; duplicate URLs remain distinct rows
 *   - OUTPUT: { local: { filtered, total }, file: { filtered, total }, sync: { filtered, total }, browser: { filtered, total } }
 *   - POST:
 *     - success => total counts include every loaded row assigned to a known Store
 *     - success => filtered counts include rows surviving search, Show only, Hide, and Health filters, before Store checkbox selection
 *     - success => unknown storage is not attributed to a named Store; missing storage uses Local only for Local fallback rows
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: COUNT_INDEX_ROWS_BY_STORE
 *   - 1. INITIALIZE counts for local, file, sync, browser with filtered = 0 and total = 0
 *   - 2. FOR each row IN allBookmarks: store = NORMALIZE_INDEX_STORAGE(row.storage); IF store is known THEN counts[store].total += 1
 *   - 3. FOR each row IN metadataFilteredBookmarks: store = NORMALIZE_INDEX_STORAGE(row.storage); IF store is known THEN counts[store].filtered += 1
 *   - 4. RETURN counts
 *   - How (sub-block): NORMALIZE_INDEX_STORAGE trims and lowercases local|file|sync|browser; missing storage becomes local only for explicitly marked Local fallback rows; unknown values remain unassigned.
 *
 * ## APPLY_SEARCH_AND_FILTER
 *
 * - [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [ARCH-STORAGE_INDEX_AND_ROUTER] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-LOCAL_BOOKMARKS_INDEX] [REQ-BROWSER_BOOKMARK_STORAGE] How: Implements applySearchAndFilter() behavior for IMPL-LOCAL_BOOKMARKS_INDEX.
 * - Contract:
 *   - INPUT: none (page load); user actions (search, filter, sort, selection, export/move/delete/import)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: displayed table of bookmarks with Storage column; filtered/sorted list; Store counts
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: allBookmarks (array with storage field), metadataFilteredBookmarks, filteredBookmarks, storeCounts, selectedUrls (set), sortKey, timeColumnSource, timeDisplayMode; store checkboxes local|file|sync|browser
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: APPLY_SEARCH_AND_FILTER
 *   - metadataFilteredBookmarks = allBookmarks
 *   - APPLY search (text)
 *   - APPLY show-only (tags, toread, private, time range; getShowOnlyDefaultState for Clear)
 *   - APPLY exclude tags (matchExcludeTags)
 *   - APPLY Health status filter (FILTER_BOOKMARKS_BY_HEALTH)
 *   - storeCounts = COUNT_INDEX_ROWS_BY_STORE(allBookmarks, metadataFilteredBookmarks)
 *   - UPDATE Store count labels with storeCounts filtered / total
 *   - filteredBookmarks = metadataFilteredBookmarks filtered by Stores selection (matchStoresFilter, getAllowedStores)
 *   - SORT by sortKey (e.g. time desc)
 *   - renderTableBody(filteredBookmarks); updateRowCount()
 *   - How (sub-block): Archived and All resources scopes do not update named Store counts from stale metadata rows; clear or mark them non-applicable.
 *
 * ## HEAD_CONTROL_PANEL
 *
 * - [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [REQ-LOCAL_BOOKMARKS_INDEX] How: HEAD_CONTROL_PANEL keeps the filter controls fixed at the viewport head and exposes one of Stores, Show only, Hide, or Table Display at a time.
 * - Contract:
 *   - INPUT: requestedGroup (string), currentGroup (string)
 *   - PRE: requestedGroup is one of stores | show-only | hide | table-display
 *   - OUTPUT: active head group and corresponding visible panel
 *   - POST:
 *     - success => exactly one head panel is visible and its tab is selected
 *     - invalid group => currentGroup and panel visibility remain unchanged
 *   - FAILURE_MODES: InvalidGroup
 *   - DATA: activeHeadGroup
 *   - DATA_TRANSITION: activeHeadGroup changes only to a valid head group
 *   - EFFECTS: State
 *   - TERMINATION: total
 * - PROCEDURE: SET_HEAD_CONTROL_GROUP
 *   - IF requestedGroup is not a valid head group: RETURN { activeGroup: currentGroup, error: InvalidGroup }
 *   - SET activeHeadGroup = requestedGroup
 *   - SET selected tab state for requestedGroup
 *   - SET hidden = false only for requestedGroup panel
 *   - SET hidden = true for every other head panel
 *   - RETURN { activeGroup: activeHeadGroup }
 *
 * ## FOOTER_CONTROL_PANEL
 *
 * - [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [REQ-LOCAL_BOOKMARKS_INDEX] How: FOOTER_CONTROL_PANEL keeps Actions, Import, and Export fixed at the viewport bottom and displays one control group at a time.
 * - Contract:
 *   - INPUT: requestedGroup (string), currentGroup (string)
 *   - PRE: requestedGroup is one of actions | import | export
 *   - OUTPUT: active footer group and corresponding visible panel
 *   - POST:
 *     - success => exactly one footer panel is visible and its tab is selected
 *     - invalid group => currentGroup and panel visibility remain unchanged
 *   - FAILURE_MODES: InvalidGroup
 *   - DATA: activeFooterGroup
 *   - DATA_TRANSITION: activeFooterGroup changes only to a valid footer group
 *   - EFFECTS: State
 *   - TERMINATION: total
 * - PROCEDURE: SET_FOOTER_CONTROL_GROUP
 *   - IF requestedGroup is not a valid footer group: RETURN { activeGroup: currentGroup, error: InvalidGroup }
 *   - SET activeFooterGroup = requestedGroup
 *   - SET selected tab state for requestedGroup
 *   - SET hidden = false only for requestedGroup panel
 *   - SET hidden = true for every other footer panel
 *   - RETURN { activeGroup: activeFooterGroup }
 *
 * ## INITIALIZE_INDEX_CONTROL_TABS
 *
 * - [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [REQ-LOCAL_BOOKMARKS_INDEX] How: INITIALIZE_INDEX_CONTROL_TABS defaults to Stores at the head and Actions at the footer, then binds accessible tab activation without changing control behavior.
 * - Contract:
 *   - INPUT: headTabList, headPanels, footerTabList, footerPanels
 *   - PRE: each tab references a known panel through aria-controls
 *   - OUTPUT: initialized head and footer control panels
 *   - POST:
 *     - success => Stores and Actions are selected; exactly one panel in each region is visible
 *   - EFFECTS: State
 *   - TERMINATION: total
 * - PROCEDURE: INITIALIZE_INDEX_CONTROL_TABS
 *   - CALL SET_HEAD_CONTROL_GROUP("stores", "stores")
 *   - CALL SET_FOOTER_CONTROL_GROUP("actions", "actions")
 *   - ON head tab activation: CALL SET_HEAD_CONTROL_GROUP(requestedGroup, activeHeadGroup)
 *   - ON footer tab activation: CALL SET_FOOTER_CONTROL_GROUP(requestedGroup, activeFooterGroup)
 *
 * ## SYNC_CONTROL_PANEL_OFFSETS
 *
 * - [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [REQ-LOCAL_BOOKMARKS_INDEX] How: SYNC_CONTROL_PANEL_OFFSETS measures the fixed head and footer regions so sticky table headers and list spacing avoid control overlap.
 * - Contract:
 *   - INPUT: headPanel (element), footerPanel (element), root (element)
 *   - PRE: root exists; missing panel elements are allowed
 *   - OUTPUT: root CSS variables for head offset and footer spacing
 *   - POST:
 *     - success => CSS variables equal the current measured panel heights
 *   - EFFECTS: State
 *   - TERMINATION: total
 * - PROCEDURE: SYNC_CONTROL_PANEL_OFFSETS
 *   - IF root is missing: RETURN
 *   - IF headPanel exists: SET --index-head-sticky-height = headPanel.offsetHeight pixels
 *   - IF footerPanel exists: SET --index-footer-sticky-height = footerPanel.offsetHeight pixels
 *   - CALL APPLY_STICKY_THEAD_OFFSET
 *   - ON panel resize: REPEAT SYNC_CONTROL_PANEL_OFFSETS
 *
 * ## APPLY_STICKY_THEAD_OFFSET
 *
 * - [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [REQ-LOCAL_BOOKMARKS_INDEX] How: APPLY_STICKY_THEAD_OFFSET keeps table headings at the table top initially and offsets them below the fixed head controls only after the bookmark list scrolls underneath.
 * - Contract:
 *   - INPUT: tableWrapper (element), headPanel (element), root (element)
 *   - PRE: root, tableWrapper, and headPanel exist
 *   - OUTPUT: root sticky-thead-offset class state
 *   - POST:
 *     - tableWrapper top >= headPanel height => root does not have sticky-thead-offset
 *     - tableWrapper top < headPanel height => root has sticky-thead-offset
 *   - EFFECTS: State
 *   - TERMINATION: total
 * - PROCEDURE: APPLY_STICKY_THEAD_OFFSET
 *   - tableTop = tableWrapper.getBoundingClientRect().top
 *   - headHeight = headPanel.offsetHeight
 *   - IF tableTop < headHeight: ADD sticky-thead-offset to root
 *   - ELSE: REMOVE sticky-thead-offset from root
 *   - ON scroll, table visibility change, or IntersectionObserver callback: REPEAT APPLY_STICKY_THEAD_OFFSET
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
 *   - 13.   data.preferredBackend = getSelectedStorageBackend()   // aria-pressed button; allowlist pinboard|local|file|sync|browser else null
 *   - 14.   SEND saveBookmark(data)   // router uses preferredBackend
 *
 * === END IMPL-FULL-BLOCK: IMPL-MOVE_BOOKMARK_UI ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-SIDE_PANEL_BOOKMARK ===
 * [IMPL-SIDE_PANEL_BOOKMARK] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] — This block defines the Bookmark tab content and init: markup with data-popup-ref, PopupController + UIManager with container, and "By Tag" → switch tab. Implements REQ by providing popup-equivalent in panel; implements ARCH by scoped root.
 *
 * ## CREATE_POPUP
 *
 * - [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [ARCH-SIDE_PANEL_TABS] [IMPL-SIDE_PANEL_BOOKMARK] [IMPL-UIManager_SCOPED_ROOT] How: Markup: #bookmarkPanel contains elements with data-popup-ref="mainInterface", data-popup-ref="loadingState", etc. Same structure as popup (quick actions, storage, tag management, search). Implements "Bookmark tab shows functional equivalent of popup UI". createPopup({ container }): when container provided, UIManager uses container for cacheElements (querySelector by data-popup-ref). PopupController receives that UIManager; loadInitialData gets current tab and bookmark; setupEventListeners binds same events. Implements reuse of popup stack with scoped root.
 * - Contract:
 *   - INPUT: User selects Bookmark tab; side-panel.js calls createPopup({ container: bookmarkPanel })
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: Bookmark panel shows current-tab bookmark UI (quick actions, storage, tags, search); interactions work as in popup | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: bookmarkPanel (DOM root), UIManager(container), PopupController(uiManager, ...)
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: CREATE_POPUP
 *   - uiManager = new UIManager({ ..., container })  // UIManager.cacheElements uses container if set
 *   - controller = new PopupController({ uiManager, ... })
 *   - RETURN { controller, uiManager, ... }
 *
 * ## BLOCK_2
 *
 * - [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [ARCH-SIDE_PANEL_TABS] [IMPL-SIDE_PANEL_BOOKMARK] How: "By Tag" in panel: when in side panel context, do not send OPEN_SIDE_PANEL; instead call switchToTagsTreeTab() (or emit so side-panel.js switches tab). Implements "By Tag switches to By Tag tab" in panel. When switching to Bookmark tab and it was already inited, call controller.refreshPopupData() so getCurrentTab and getBookmarkData run for the active tab; content then reflects current tab's bookmark state (same as badge). Implements "Bookmark tab reflects current tab when selected". Prompt refresh (like badge): when Bookmark tab is visible, refresh on tabs.onActivated and on tabs.onUpdated (when updated tab is active and status complete). refreshBookmarkTabIfVisible() calls controller.refreshPopupData() only when activeTab === "bookmark" and controller exists. Implements "Bookmark tab refreshes promptly when active tab changes or completes".
 * - Contract:
 *   - INPUT: User selects Bookmark tab; side-panel.js calls createPopup({ container: bookmarkPanel })
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: Bookmark panel shows current-tab bookmark UI (quick actions, storage, tags, search); interactions work as in popup
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: bookmarkPanel (DOM root), UIManager(container), PopupController(uiManager, ...)
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: BLOCK_2
 *   - 1. ON "By Tag" click in This Page tab:
 *   - 2.   IF inPanelContext: switchToTagsTreeTab()  // e.g. callback from side-panel.js or global
 *   - 3.   ELSE: send OPEN_SIDE_PANEL  // popup context
 *   - 4. ON switchTab("bookmark"): IF bookmarkTabInited already true AND popupComponents.controller: controller.refreshPopupData()
 *   - 5. bindTabChangeRefresh(): chrome.tabs.onActivated → refreshBookmarkTabIfVisible(); chrome.tabs.onUpdated(tabId, changeInfo, tab) → IF changeInfo.status === "complete" AND tab.url AND updated tab is current window active tab: refreshBookmarkTabIfVisible()
 *
 * === END IMPL-FULL-BLOCK: IMPL-SIDE_PANEL_BOOKMARK ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-AI_TAG_TEST ===
 * [IMPL-AI_TAG_TEST] [ARCH-AI_TAGGING_CONFIG] [REQ-AI_TAGGING_CONFIG] — Minimal API request to verify key; return { ok } or { ok, error }; used by Options and Popup Test button.
 *
 * ## TEST_AI_API_KEY
 *
 * - [IMPL-AI_TAG_TEST] [ARCH-AI_TAGGING_CONFIG] [REQ-AI_TAGGING_CONFIG] How: Implements testAiApiKey(apiKey, provider) behavior for IMPL-AI_TAG_TEST.
 * - Contract:
 *   - INPUT: apiKey (string), provider ('openai' | 'gemini')
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: { ok: boolean, error?: string } | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - EFFECTS: Http
 *   - TERMINATION: total
 * - PROCEDURE: TEST_AI_API_KEY
 *   - IF !apiKey or !provider RETURN { ok: false, error: 'Missing key or provider' }
 *   - IF provider === 'openai':
 *   - res = fetch('https://api.openai.com/v1/models', { headers: { Authorization: 'Bearer ' + apiKey } })
 *   - IF res.ok RETURN { ok: true }
 *   - IF res.status === 401 or 403 RETURN { ok: false, error: 'Invalid API key' }
 *   - RETURN { ok: false, error: res.statusText or 'Request failed' }
 *   - IF provider === 'gemini':
 *   - res = fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey)
 *   - IF res.ok RETURN { ok: true }
 *   - IF res.status === 400 or 403 RETURN { ok: false, error: 'Invalid API key' }
 *   - RETURN { ok: false, error: res.statusText or 'Request failed' }
 *   - RETURN { ok: false, error: 'Unknown provider' }
 *
 * === END IMPL-FULL-BLOCK: IMPL-AI_TAG_TEST ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-AI_TAGGING_POPUP_UI ===
 * [IMPL-AI_TAGGING_POPUP_UI] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] [REQ-STORAGE_MODE_DEFAULT] — Popup "Tag with AI" flow: get page content, get AI tags, split by session, create/update bookmark with default backend, update suggested tags.
 *
 * ## ON_TAG_WITH_AI_CLICK
 *
 * - [IMPL-AI_TAGGING_POPUP_UI] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] [REQ-STORAGE_MODE_DEFAULT] How: Implements onTagWithAiClick() behavior for IMPL-AI_TAGGING_POPUP_UI.
 * - Contract:
 *   - INPUT: user click "Tag with AI"
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark updated; suggested tags updated | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - EFFECTS: Async, Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: ON_TAG_WITH_AI_CLICK
 *   - IF !config.aiApiKey or !currentTab.url.startsWith('http') THEN show message; RETURN
 *   - content = await sendToSW({ type: 'GET_PAGE_CONTENT', data: { tabId } })  // SW uses scripting.executeScript in tab
 *   - IF !content?.textContent THEN show (content.error if content.success === false else generic error); RETURN
 *   - aiTags = await sendToSW({ type: 'GET_AI_TAGS', data: { text: content.textContent, limit: config.aiTagLimit } })
 *   - sessionSet = new Set(await sendToSW({ type: 'getSessionTags' }))
 *   - inSession = aiTags.filter(t => sessionSet.has(t.toLowerCase()))
 *   - suggested = aiTags.filter(t => !sessionSet.has(t.toLowerCase()))
 *   - bookmark = await getCurrentBookmark()
 *   - defaultBackend = await configManager.getStorageMode()
 *   - IF !bookmark?.time:
 *   - create bookmark with url, title, tags: inSession, preferredBackend: defaultBackend
 *   - ELSE:
 *   - merged = merge(bookmark.tags, inSession)  // dedupe case-insensitive
 *   - saveBookmark({ ...bookmark, tags: merged, preferredBackend: bookmark backend or defaultBackend })
 *   - updateSuggestedTags(suggested)  // so AI tags appear first in Suggested section
 *   - refresh bookmark state / badge
 *
 * === END IMPL-FULL-BLOCK: IMPL-AI_TAGGING_POPUP_UI ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-POPUP_SESSION ===
 * [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] — PopupController handlers await messages; StateManager and UIManager updates; no window.close. Contract: user actions and GET_OVERLAY_STATE; popup open and state/UI in sync.
 *
 * ## MAIN
 *
 * - [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] How: Logical block for IMPL-POPUP_SESSION.
 * - Contract:
 *   - INPUT: user actions (show overlay, toggle private, save, etc.); GET_OVERLAY_STATE fallback
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: popup stays open; state and UI updated; no window.close
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: StateManager (overlay visible, bookmark, etc.); UIManager (button states, labels)
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: MAIN
 *   - How (sub-block): Await message; update state and UI; inline notification; do not close.
 *   - 1. PopupController handler (e.g. handleShowHoverboard):
 *   - 2.   AWAIT send message (e.g. TOGGLE_OVERLAY)
 *   - 3.   StateManager.update(...); UIManager.updateShowHoverButtonState(...)
 *   - 4.   INLINE notification if needed; DO NOT call window.close
 *   - How (sub-block): On open sync overlay state to StateManager and UIManager.
 *   - 5. ON popup open: SEND GET_OVERLAY_STATE; SYNC state to StateManager and UIManager
 *
 * ## CLASSIFY_SCRIPT_INJECTION_URL
 *
 * - [IMPL-POPUP_SESSION] [IMPL-SUGGESTED_TAGS] [ARCH-SUGGESTED_TAGS] [REQ-SUGGESTED_TAGS_FROM_CONTENT] How: Shared pure classifier in src/shared/script-injection-eligibility.js for browser-forbidden (non-scriptable) URLs vs injectable http(s). Distinct from user inhibit URLs (IMPL-URL_INHIBITION). Used by canInjectIntoTab, loadSuggestedTags, updateOverlayState, injectContentScript.
 * - Contract:
 *   - INPUT: url (string | unknown); optional error object for classifyScriptInjectionError
 *   - PRE: true (total on any input shape)
 *   - OUTPUT: { injectable: boolean, reason: missing_url | restricted_scheme | extensions_gallery | ok } | classifyScriptInjectionError -> reason | null
 *   - POST:
 *     - success => reason codes are closed-set; injectable true only when reason is ok
 *     - restricted schemes / gallery hosts / missing url => injectable false
 *   - FAILURE_MODES: none (total, no throw)
 *   - DATA: gallery host allowlist (chromewebstore.google.com; chrome.google.com/webstore; microsoftedge.microsoft.com/addons)
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: CLASSIFY_SCRIPT_INJECTION_URL
 *   - IF url not non-empty string: RETURN { injectable: false, reason: missing_url }
 *   - IF scheme in chrome:// | chrome-extension:// | edge:// | about: | devtools:// | view-source: OR not http(s): RETURN { injectable: false, reason: restricted_scheme }
 *   - IF isExtensionsGalleryUrl(url): RETURN { injectable: false, reason: extensions_gallery }
 *   - RETURN { injectable: true, reason: ok }
 *   - How (sub-block): classifyScriptInjectionError(error) maps Chrome rejection text to extensions_gallery | restricted_scheme | null (unexpected).
 *
 * ## SKIP_NON_SCRIPTABLE_INJECT
 *
 * - [IMPL-POPUP_SESSION] [IMPL-UI_INSPECTOR] [ARCH-SUGGESTED_TAGS] [REQ-SUGGESTED_TAGS_FROM_CONTENT] [REQ-UI_INSPECTION] How: Precheck before suggested-tags / overlay-state / content inject — CLASSIFY_SCRIPT_INJECTION_URL; non-scriptable → skip scripting, recordAction injectionOutcome, debugLog/warn (not debugError); unexpected failures remain debugError.
 * - Contract:
 *   - INPUT: currentTab.url; phase (suggested_tags | overlay_state | inject); optional refresh trigger/surface
 *   - PRE: classifier available; ui-inspector may be disabled (recordAction no-ops)
 *   - OUTPUT: skip (empty suggested / false overlay / no inject) | proceed to scripting | { error: UnexpectedInjectFailed }
 *   - POST:
 *     - expected skip => injectionOutcome recorded; no chrome.scripting call; no debugError
 *     - injectable ok => scripting may proceed
 *   - FAILURE_MODES: UnexpectedInjectFailed
 *   - DATA: _refreshTrigger, _refreshSurface for inspector attribution
 *   - DATA_TRANSITION: on skip, suggested tags cleared or overlay button forced off as phase dictates; else unchanged until inject path runs
 *   - EFFECTS: IO, State, Async
 *   - TERMINATION: total
 * - PROCEDURE: SKIP_NON_SCRIPTABLE_INJECT
 *   - classif = classifyScriptInjectionUrl(tab.url)
 *   - IF NOT classif.injectable:
 *   -   recordAction injectionOutcome { phase, reason: classif.reason, injectable: false, trigger, surface }
 *   -   debugLog/warn; APPLY phase skip; RETURN
 *   - TRY scripting path
 *   - CATCH err:
 *   -   expected = classifyScriptInjectionError(err)
 *   -   IF expected: recordAction injectionOutcome { reason: expected }; debugWarn; RETURN
 *   -   debugError; RETURN error UnexpectedInjectFailed
 *
 * ## OBSERVER_BOOKMARK_UPDATED_FULL_REFRESH
 *
 * - [IMPL-POPUP_SESSION] [IMPL-BOOKMARK_STATE_SYNC] [ARCH-POPUP_SESSION] [ARCH-MESSAGE_HANDLING] [REQ-POPUP_PERSISTENT_SESSION] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] How: setupRealTimeUpdates BOOKMARK_UPDATED watcher is an observer listener (see IMPL-MESSAGE_HANDLING UNWRAP_MESSAGE_RESPONSE / IMPL-BOOKMARK_STATE_SYNC OBSERVER_BOOKMARK_UPDATED_FULL_REFRESH): sync function, return undefined, detached refreshPopupData then updateOverlayState.
 * - Contract:
 *   - INPUT: runtime.onMessage envelope
 *   - PRE: setupRealTimeUpdates registered
 *   - OUTPUT: undefined; refresh may run asynchronously
 *   - POST:
 *     - success => response channel not claimed
 *   - FAILURE_MODES: RefreshFailed (caught in detached chain)
 *   - DATA: PopupController session
 *   - DATA_TRANSITION: on BOOKMARK_UPDATED success path, This Page + overlay state refreshed
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: OBSERVER_BOOKMARK_UPDATED_FULL_REFRESH
 *   - REGISTER runtime.onMessage as synchronous function:
 *   -   IF message?.type !== 'BOOKMARK_UPDATED': RETURN undefined
 *   -   START detached refresh (refreshPopupData then updateOverlayState); CATCH → debugError
 *   -   RETURN undefined
 *
 * === END IMPL-FULL-BLOCK: IMPL-POPUP_SESSION ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-SELECTION_TO_TAG_INPUT ===
 * [IMPL-SELECTION_TO_TAG_INPUT] [ARCH-SELECTION_TO_TAG_INPUT] [REQ-SELECTION_TO_TAG_INPUT] [REQ-TAG_MANAGEMENT] — Prefill tag input from page selection on popup open; GET_PAGE_SELECTION and normalizeSelectionForTagInput. Contract: selection via message; tag input prefilled.
 *
 * ## NORMALIZE_SELECTION_FOR_TAG_INPUT
 *
 * - [IMPL-SELECTION_TO_TAG_INPUT] [ARCH-SELECTION_TO_TAG_INPUT] [REQ-SELECTION_TO_TAG_INPUT] [REQ-TAG_MANAGEMENT] How: Implements normalizeSelectionForTagInput(selection, maxWords) behavior for IMPL-SELECTION_TO_TAG_INPUT.
 * - Contract:
 *   - INPUT: none at popup open (selection read from page via message); raw selection string (normalizeSelectionForTagInput)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: tag input field prefilled with normalized words (side effect) | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: current tab; newTagInput element; maxWords = 8
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: NORMALIZE_SELECTION_FOR_TAG_INPUT
 *   - text = replace non-word non-space chars with space in selection
 *   - text = collapse spaces, trim
 *   - words = split text on whitespace
 *   - RETURN first maxWords words joined by space
 *   - How (sub-block): Request selection; if present set tag input to normalized value.
 *   - 1. popup loadInitialData (after loadSuggestedTags or loadRecentTags):
 *   - TRY response = sendToTab(GET_PAGE_SELECTION)
 *   - ON timeout or failure LEAVE tag input unchanged, RETURN
 *   - raw = response.data.selection
 *   - IF raw non-empty:
 *   - normalized = normalizeSelectionForTagInput(raw, 8)
 *   - setTagInputValue(normalized)
 *
 * === END IMPL-FULL-BLOCK: IMPL-SELECTION_TO_TAG_INPUT ===
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
 * === IMPL-FULL-BLOCK: IMPL-SUGGESTED_TAGS ===
 * [IMPL-SUGGESTED_TAGS] [ARCH-SUGGESTED_TAGS] [REQ-SUGGESTED_TAGS_FROM_CONTENT] [REQ-SUGGESTED_TAGS_DEDUPLICATION] [REQ-SUGGESTED_TAGS_CASE_PRESERVATION] — Summary: Suggested tags from page — overlay TagService.extractSuggestedTagsFromContent; Chromium popup via MAIN-world snippet global and IMPL-THIS_PAGE_TAG_SORT loadSuggestedTags (inject, normalize, filter, UIManager handoff).
 *
 * ## EXTRACT_SUGGESTED_TAGS
 *
 * - [IMPL-SUGGESTED_TAGS] [IMPL-THIS_PAGE_TAG_SORT] [ARCH-SUGGESTED_TAGS] [ARCH-THIS_PAGE_TAG_SORT] [REQ-SUGGESTED_TAGS_FROM_CONTENT] [REQ-SUGGESTED_TAGS_DEDUPLICATION] [REQ-SUGGESTED_TAGS_CASE_PRESERVATION] [REQ-THIS_PAGE_TAG_SORT] How: How — cross-IMPL: Popup path depends on IMPL-THIS_PAGE_TAG_SORT loadSuggestedTags; ordering invariant — executeScript file (snippet) then func (global extractor); shared data — raw array from page world; post — NORMALIZE_SUGGESTED_ROWS then filters then updateSuggestedTags(rows); on error or non-scriptable URL (IMPL-POPUP_SESSION CLASSIFY_SCRIPT_INJECTION_URL: restricted_scheme / extensions_gallery / missing_url) — updateSuggestedTags([]) + injectionOutcome; no debugError for expected skips. How — composed_with IMPL-SELECTION_TO_TAG_INPUT: pre — suggested chips rendered in UIManager; post — selection/tag-input add flows attach to chip DOM per IMPL-SELECTION_TO_TAG_INPUT (shared surface only; no ordering constraint on extraction).
 * - Contract:
 *   - INPUT: active page document (implicit)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: array of { tag: string, relevance: number, inPageFrequency: number }; tag sanitized by snippet inline rules; canonical case per pickBetterSuggestedOriginalCase rank
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: noise set; delimiter regex MUST match TagService tokenization (ARCH-SUGGESTED_TAGS tokenizer sync)
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: State
 *   - TERMINATION: total
 * - PROCEDURE: EXTRACT_SUGGESTED_TAGS
 *   - IF document invalid THEN RETURN []
 *   - TRY:
 *   - allTexts = GATHER_SOURCES(document, url)
 *   - IF allTexts empty THEN RETURN []
 *   - words = TOKENIZE(join allTexts) using shared delimiter regex
 *   - FOR each token: increment wordFrequency(lower); update originalCaseMap with pickBetterSuggestedOriginalCase
 *   - sortedEntries = SORT wordFrequency by count desc then key asc
 *   - sortedWords = PLUCK canonical string per key from originalCaseMap
 *   - How (sub-block): # [IMPL-SUGGESTED_TAGS] [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION]
 *   - How (sub-block): # How — map each candidate through TagService.sanitizeTag (overlay path delegates to IMPL-TAG_SYSTEM).
 *   - sanitized = MAP each sortedWord through SANITIZE_OVERLAY (= TagService.sanitizeTag)
 *   - unique = DEDUPE exact adjacent duplicates preserving order
 *   - RETURN slice(unique, 0, limit)
 *   - CATCH:
 *   - RETURN []
 *   - How (sub-block): How — Cross-path note (S06.3): overlay sanitizeTag vs snippet inline sanitizer may differ on edge characters; tokenizer must remain identical. See ARCH-SUGGESTED_TAGS.
 *   - How (sub-block): How — Popup inject eligibility is CLASSIFY_SCRIPT_INJECTION_URL in IMPL-POPUP_SESSION (shared module); this EXTRACT block covers page-world extraction only.
 *
 * === END IMPL-FULL-BLOCK: IMPL-SUGGESTED_TAGS ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-TAB_SEARCH_NO_MATCH_UI ===
 * [IMPL-TAB_SEARCH_NO_MATCH_UI] [ARCH-TAB_SEARCH_NO_MATCH_FEEDBACK] [REQ-TAB_SEARCH_NO_MATCH_UX] — Block 1: When handleSearch receives response.success === false and response indicates no matches, do not call showError; call showSearchNoMatchFeedback(). Other failures (e.g. "Already on last match") still call showError.
 *
 * ## HANDLE_SEARCH
 *
 * - [IMPL-TAB_SEARCH_NO_MATCH_UI] [ARCH-TAB_SEARCH_NO_MATCH_FEEDBACK] [REQ-TAB_SEARCH_NO_MATCH_UX] How: Implements handleSearch(response) behavior for IMPL-TAB_SEARCH_NO_MATCH_UI.
 * - Contract:
 *   - INPUT: context / caller args
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: result | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: HANDLE_SEARCH
 *   - IF response.success:
 *   - showSuccess(...); RETURN
 *   - isNoMatch = (response.message === "No matching tabs found" OR response.matchCount === 0)
 *   - IF isNoMatch:
 *   - showSearchNoMatchFeedback()
 *   - ELSE:
 *   - showError(response.message OR "No matching tabs found")
 *
 * ## SHOW_SEARCH_NO_MATCH_FEEDBACK
 *
 * - [IMPL-TAB_SEARCH_NO_MATCH_UI] [ARCH-TAB_SEARCH_NO_MATCH_FEEDBACK] [REQ-TAB_SEARCH_NO_MATCH_UX] How: Block 2: showSearchNoMatchFeedback adds class to elements.searchBtn; after 2s remove class. Ensures bright red border then fade to default.
 * - Contract:
 *   - INPUT: context / caller args
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: result
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: SHOW_SEARCH_NO_MATCH_FEEDBACK
 *   - IF NOT elements.searchBtn: RETURN
 *   - elements.searchBtn.classList.add("search-no-match")
 *   - setTimeout(2000, () => elements.searchBtn.classList.remove("search-no-match"))
 *
 * ## HANDLE_SEARCH_TRY_FINALLY_SCROLL
 *
 * - [IMPL-TAB_SEARCH_NO_MATCH_UI] [ARCH-TAB_SEARCH_NO_MATCH_FEEDBACK] [REQ-TAB_SEARCH_NO_MATCH_UX] How: Block 3: CSS class on search button sets border to bright red and transition (2s) to default; when class removed, border fades back. .button.secondary.search-no-match { border-color: #e00 or similar; transition: border-color 2s ease; }
 * - Contract:
 *   - INPUT: context / caller args
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: result
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: HANDLE_SEARCH_TRY_FINALLY_SCROLL
 *   - scrollContainer = uiManager?.container
 *   - savedScrollTop = scrollContainer ? scrollContainer.scrollTop : undefined
 *   - TRY:
 *   - setLoading(true)   # may reset scroll in UI
 *   - How (sub-block): # ... search logic ...
 *   - FINALLY:
 *   - setLoading(false)
 *   - IF scrollContainer != null AND savedScrollTop !== undefined:
 *   - scrollContainer.scrollTop = savedScrollTop
 *
 * === END IMPL-FULL-BLOCK: IMPL-TAB_SEARCH_NO_MATCH_UI ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-THIS_PAGE_TAG_SORT ===
 * [IMPL-THIS_PAGE_TAG_SORT] [ARCH-THIS_PAGE_TAG_SORT] [REQ-THIS_PAGE_TAG_SORT] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [REQ-SUGGESTED_TAGS_FROM_CONTENT] — Summary: Three-way chip sort when tagSortToggle present; frequency map from storage; popup suggested rows from two-step MAIN inject; uses tag-chip-sort.sortTagChipRows.
 *
 * ## REFRESH_TAG_FREQUENCY_MAP_FOR_SORT
 *
 * - [IMPL-THIS_PAGE_TAG_SORT] [IMPL-UIManager_SCOPED_ROOT] [ARCH-SIDE_PANEL_TABS] [ARCH-THIS_PAGE_TAG_SORT] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [REQ-THIS_PAGE_TAG_SORT] How: How — cross-IMPL depends on IMPL-UIManager_SCOPED_ROOT: tagSortToggle and chip containers resolve under scoped container in side panel; pre — UIManager constructed with container=bookmarkPanel and cacheElements completed; post — non-null elements.tagSortToggle enables sort UI; shared data — this.elements from IMPL-UIManager_SCOPED_ROOT. How — cross-IMPL depends on IMPL-SUGGESTED_TAGS MAIN-world path: snippet registers global; ordering — loadSuggestedTags runs file inject then func inject before NORMALIZE; shared data — raw extraction array; post — filtered rows passed to UIManager.updateSuggestedTags. How — NORMALIZE_SUGGESTED_ROWS + FILTER_INVALID_ROWS: PopupController maps MAIN extract to rows; trim string/object tags; omit entries empty after trim; then FILTER_NOT_ON_CURRENT_BOOKMARK. How — FILTER_NOT_ON_CURRENT_BOOKMARK(rows, currentTagsNormalizedLower): drop row where lower(row.tag) in set.
 * - Contract:
 *   - INPUT: raw (array of strings and/or objects from page world)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: array of { tag: string, relevance: number, inPageFrequency: number } | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: tagFrequencyMap (tag string -> count from hoverboard_tag_frequency); suggested rows { tag, relevance?, inPageFrequency? } after normalize
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: REFRESH_TAG_FREQUENCY_MAP_FOR_SORT
 *   - IF NOT chrome.storage.local THEN RETURN
 *   - TRY:
 *   - AWAIT get hoverboard_tag_frequency
 *   - map = _normalizeHoverboardTagFrequencyMap(raw)
 *   - uiManager.setTagFrequencyMapForSort(map)
 *   - CATCH:
 *   - debugError; RETURN
 *   - How (sub-block): How — loadSuggestedTags (invokes IMPL-SUGGESTED_TAGS page-world contract; ordering explicit).
 *
 * ## LOAD_SUGGESTED_TAGS
 *
 * - [IMPL-THIS_PAGE_TAG_SORT] [ARCH-THIS_PAGE_TAG_SORT] [REQ-THIS_PAGE_TAG_SORT] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [REQ-SUGGESTED_TAGS_FROM_CONTENT] How: Implements loadSuggestedTags() behavior for IMPL-THIS_PAGE_TAG_SORT.
 * - Contract:
 *   - INPUT: context / caller args
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: result | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - EFFECTS: Async, Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: LOAD_SUGGESTED_TAGS
 *   - IF no tab id THEN updateSuggestedTags([]); RETURN
 *   - classif = classifyScriptInjectionUrl(tab.url)
 *   - IF NOT classif.injectable THEN recordAction injectionOutcome(phase=suggested_tags, reason=classif.reason); updateSuggestedTags([]); RETURN
 *   - TRY:
 *   - TRY executeScript MAIN files [suggested-tags-main-world-snippet.js]; ON fileErr log non-fatal CONTINUE
 *   - AWAIT executeScript MAIN func -> globalThis.__hoverboardExtractSuggestedTagsWithRelevance()
 *   - rows = NORMALIZE_SUGGESTED_ROWS(result)
 *   - rows = FILTER_INVALID_ROWS(rows)
 *   - rows = FILTER_NOT_ON_CURRENT_BOOKMARK(rows, currentPinTagsLowerSet)
 *   - updateSuggestedTags(rows)
 *   - CATCH scriptError:
 *   - expected = classifyScriptInjectionError(scriptError)
 *   - IF expected: recordAction injectionOutcome(reason=expected); updateSuggestedTags([]); RETURN
 *   - debugError; updateSuggestedTags([])
 *   - How (sub-block): How — setTagFrequencyMapForSort: merge into tagFrequencyMap; caller redraws.
 *   - How (sub-block): How — getEffectiveTagSortMode: IF no tagSortToggle element THEN RETURN null; ELSE RETURN mode from segment state.
 *   - How (sub-block): How — updateCurrentTags / updateRecentTags / _paintSuggestedTags: IF getEffectiveTagSortMode() null THEN paint source order; ELSE build rows with displayKey=tagChipDisplayAndAddValue, bookmarkFreq, suggested relevance; sortTagChipRows(mode); paint.
 *   - How (sub-block): How — Comparators (tag-chip-sort): alphabetical by displayKey localeCompare lower tie stableIndex; frequency by bookmarkFreq desc; relevance by relevance desc then bookmarkFreq then inPageFrequency.
 *   - How (sub-block): How — loadInitialData: AWAIT refreshTagFrequencyMapForSort before first updateCurrentTags; AWAIT loadRecentTags before AWAIT loadSuggestedTags (PopupController orchestration binding).
 *   - How (sub-block): How — setupEventListeners: click [data-sort-mode] under tagSortToggle -> setTagSortMode if isTagChipSortMode.
 *
 * ## SIDE_PANEL_TAG_SORT_TOOLBAR_E2E
 *
 * - [IMPL-THIS_PAGE_TAG_SORT] [IMPL-PLAYWRIGHT_E2E_EXTENSION] [ARCH-THIS_PAGE_TAG_SORT] [REQ-THIS_PAGE_TAG_SORT] How: How — E2E-only surface (phase_h_e2e_only_surface): Playwright chrome-extension:// side panel; complements JSDOM composition tests.
 * - Contract:
 *   - INPUT: context / caller args
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: result
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: SIDE_PANEL_TAG_SORT_TOOLBAR_E2E
 *   - PRE: open side-panel.html; bookmarkPanel visible
 *   - ASSERT tagSortToggle visible
 *   - ON click frequency segment: aria-pressed matches selection
 *
 * === END IMPL-FULL-BLOCK: IMPL-THIS_PAGE_TAG_SORT ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-UIManager_SCOPED_ROOT ===
 * [IMPL-UIManager_SCOPED_ROOT] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_BOOKMARK] — Summary: Scoped DOM resolution so UIManager runs in popup (document) or side-panel Bookmark subtree (container) without duplicate ids.
 *
 * ## CACHE_ELEMENTS
 *
 * - [IMPL-UIManager_SCOPED_ROOT] [IMPL-SIDE_PANEL_BOOKMARK] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] How: How — composed_with IMPL-SIDE_PANEL_BOOKMARK: pre — Bookmark panel subtree mounted with data-popup-ref values matching popup element keys; ordering — container passed into UIManager constructor before cacheElements; post — this.elements[key] reference nodes under container (or null if missing); shared data — elementKeys and data-popup-ref attribute names align with popup ids.
 * - Contract:
 *   - INPUT: constructor options { container?: Element }; cacheElements() at init; updateSectionLabelsVisibility(showLabels: boolean)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: this.elements populated; section title nodes toggled visible/hidden | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: container (optional); elementKeys; data-popup-ref attribute names matching popup ids
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: CACHE_ELEMENTS
 *   - FOR each key in elementKeys:
 *   - IF this.container:
 *   - this.elements[key] = this.container.querySelector('[data-popup-ref="' + key + '"]')
 *   - ELSE:
 *   - this.elements[key] = document.getElementById(key)
 *   - How (sub-block): How — section labels: scope query to container or document; no throw on empty NodeList.
 *
 * ## UPDATE_SECTION_LABELS_VISIBILITY
 *
 * - [IMPL-UIManager_SCOPED_ROOT] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_BOOKMARK] How: Implements updateSectionLabelsVisibility(showLabels) behavior for IMPL-UIManager_SCOPED_ROOT.
 * - Contract:
 *   - INPUT: context / caller args
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: result
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: UPDATE_SECTION_LABELS_VISIBILITY
 *   - root = this.container || document
 *   - sectionTitles = root.querySelectorAll('.section-title')
 *   - FOR each title in sectionTitles:
 *   - IF showLabels THEN title.style.display = ''
 *   - ELSE title.style.display = 'none'
 *
 * === END IMPL-FULL-BLOCK: IMPL-UIManager_SCOPED_ROOT ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-BOOKMARK_NOTES_UI ===
 * [IMPL-BOOKMARK_NOTES_UI] [ARCH-BOOKMARK_NOTES_UI] [REQ-BOOKMARK_NOTES_UI] — Title/Notes capture UI; payload helpers; browser notes no-op.
 *
 * ## Notes editability by backend
 *
 * - [IMPL-BOOKMARK_NOTES_UI] [ARCH-BOOKMARK_NOTES_UI] [REQ-BOOKMARK_NOTES_UI] How: Browser backend cannot store extended; other backends allow notes.
 * - Contract:
 *   - INPUT: backendId (string or null)
 *   - PRE: caller may pass null/unknown
 *   - OUTPUT: boolean notesEditable
 *   - POST:
 *     - success => true iff backendId is not "browser"
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: NOTES_EDITABLE_FOR_BACKEND
 *   - 1. IF lowercase(backendId) == "browser" THEN RETURN false
 *   - 2. RETURN true
 *
 * ## Build save payload for title and notes
 *
 * - [IMPL-BOOKMARK_NOTES_UI] [ARCH-BOOKMARK_NOTES_UI] [REQ-BOOKMARK_NOTES_UI] How: Merge title/notes into pin-shaped save data with preferredBackend.
 * - Contract:
 *   - INPUT: currentPin (or null), tabTitle, titleText, notesText, preferredBackend, notesEditable
 *   - PRE: url available from currentPin.url or caller supplies url
 *   - OUTPUT: { url, description, extended, tags, shared, toread, preferredBackend? } | { error: MissingUrl }
 *   - POST:
 *     - success => description is trimmed title or tabTitle fallback; extended is notes when notesEditable else preserved or empty string; preferredBackend set when provided
 *     - error MissingUrl => no save payload
 *   - FAILURE_MODES: MissingUrl
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: BUILD_BOOKMARK_NOTES_SAVE_PAYLOAD
 *   - 1. url = currentPin.url OR caller.url
 *   - 2. IF url empty THEN RETURN { error: MissingUrl }
 *   - 3. description = trim(titleText); IF description empty THEN description = tabTitle OR ""
 *   - 4. IF notesEditable THEN extended = notesText OR "" ELSE extended = currentPin.extended OR ""
 *   - 5. tags = currentPin.tags OR ""; shared = currentPin.shared OR "yes"; toread = currentPin.toread OR "no"
 *   - 6. payload = { url, description, extended, tags, shared, toread }
 *   - 7. IF preferredBackend THEN payload.preferredBackend = preferredBackend
 *   - 8. RETURN payload
 *
 * ## Sync Details fields from pin
 *
 * - [IMPL-BOOKMARK_NOTES_UI] [ARCH-BOOKMARK_NOTES_UI] [REQ-BOOKMARK_NOTES_UI] How: Populate Title/Notes inputs; disable Notes for browser.
 * - Contract:
 *   - INPUT: pin, backendId, titleInput, notesInput, notesHintEl
 *   - PRE: DOM elements exist when called from UIManager
 *   - OUTPUT: inputs updated; notes disabled when not editable
 *   - POST:
 *     - success => titleInput.value = pin.description; notesInput.value = pin.extended when editable else ""; notesInput.disabled = !notesEditable; hint visible iff !notesEditable
 *   - EFFECTS: State
 *   - DATA: titleInput, notesInput, notesHintEl
 *   - DATA_TRANSITION: field values and disabled state match pin and backend
 *   - TERMINATION: total
 * - PROCEDURE: SYNC_BOOKMARK_NOTES_FIELDS
 *   - 1. notesEditable = NOTES_EDITABLE_FOR_BACKEND(backendId)
 *   - 2. SET titleInput.value = pin.description OR ""
 *   - 3. SET notesInput.value = IF notesEditable THEN (pin.extended OR "") ELSE ""
 *   - 4. SET notesInput.disabled = NOT notesEditable
 *   - 5. SHOW notesHintEl iff NOT notesEditable
 *
 * ## Persist on blur or Save details
 *
 * - [IMPL-BOOKMARK_NOTES_UI] [ARCH-BOOKMARK_NOTES_UI] [REQ-BOOKMARK_NOTES_UI] [REQ-MOVE_BOOKMARK_STORAGE_UI] How: Build payload and send saveBookmark with preferredBackend.
 * - Contract:
 *   - INPUT: titleText, notesText, currentPin, currentTab, getSelectedStorageBackend, resolvedBackend
 *   - PRE: sendMessage available
 *   - OUTPUT: saveBookmark sent | no-op when unchanged | { error: MissingUrl | SaveFailed }
 *   - POST:
 *     - success => pin refreshed; fields re-synced
 *   - FAILURE_MODES: MissingUrl, SaveFailed
 *   - EFFECTS: Http, State, Async
 *   - TERMINATION: total
 * - PROCEDURE: SAVE_BOOKMARK_DETAILS
 *   - 1. preferredBackend = getSelectedStorageBackend()
 *   - 2. notesEditable = NOTES_EDITABLE_FOR_BACKEND(resolvedBackend OR preferredBackend)
 *   - 3. payload = BUILD_BOOKMARK_NOTES_SAVE_PAYLOAD(...)
 *   - 4. IF payload.error THEN show error; RETURN
 *   - 5. IF payload matches currentPin description/extended (and notesEditable) THEN RETURN no-op
 *   - 6. SEND saveBookmark(payload)
 *   - 7. ON success: update currentPin; SYNC_BOOKMARK_NOTES_FIELDS; show success
 *   - 8. ON failure: show error
 *
 * === END IMPL-FULL-BLOCK: IMPL-BOOKMARK_NOTES_UI ===
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
/**
 * === IMPL-FULL-BLOCK: IMPL-PAGE_ARCHIVE_STATUS_UI ===
 * [IMPL-PAGE_ARCHIVE_STATUS_UI] [ARCH-PAGE_ARCHIVE_STATUS_UI] [REQ-PAGE_ARCHIVE_STATUS_UI] — Normalize and display selected-backend archive artifact status in shared popup/This Page UI; derive Offline Reader availability only from a readable archive.
 *
 * ## MAIN
 *
 * - [IMPL-PAGE_ARCHIVE_STATUS_UI] [ARCH-PAGE_ARCHIVE_STATUS_UI] [REQ-PAGE_ARCHIVE_STATUS_UI] How: Coordinate fail-closed normalization, backend-scoped queries, scoped DOM application, context resets, and capture refreshes without changing archive handlers.
 * - Contract:
 *   - INPUT: current tab URL, selected backend, archive/screenshot query responses, capture results, scoped UI root
 *   - PRE: PopupController and UIManager are initialized; selected backend is resolved from the current bookmark/context
 *   - OUTPUT: independent archiveSaved and screenshotSaved indicators plus readerAvailable = archiveSaved
 *   - POST: positive state exists only when the selected backend returns a valid persisted artifact; stale readable archive remains available
 *   - FAILURE_MODES: unsupported backend, rejected message, malformed response, missing artifact identity, stale context
 *   - DATA: currentUrl, selectedBackend, archiveSaved, screenshotSaved, readerAvailable, statusContextKey
 *   - DATA_TRANSITION: context changes clear all status before new query; successful query replaces only the matching status snapshot
 *   - EFFECTS: Async, IO, State, DOM
 *   - TERMINATION: total
 *
 * ## NORMALIZE_ARCHIVE_ARTIFACT_STATUS
 *
 * - [IMPL-PAGE_ARCHIVE_STATUS_UI] [ARCH-PAGE_ARCHIVE_STATUS_UI] [REQ-PAGE_ARCHIVE_STATUS_UI] How: Convert raw GET_PAGE_ARCHIVE and GET_PAGE_SCREENSHOTS results to a bounded all-false or positive status object; never infer persisted presence from metadata or defaults.
 * - Contract:
 *   - INPUT: artifactKind, backend, response
 *   - PRE: artifactKind is archive or screenshot
 *   - OUTPUT: { saved: boolean, readable: boolean, artifactId: string|null, backend: string|null }
 *   - POST: saved is true only for an accepted selected-backend persisted artifact; archive stale status remains readable
 *   - FAILURE_MODES: unsupported backend, success false, malformed payload, empty screenshot list, missing identity
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: NORMALIZE_ARCHIVE_ARTIFACT_STATUS
 *   - IF backend is not local or file: RETURN all-false
 *   - IF response is rejected, response.success is false, or response.data is malformed: RETURN all-false
 *   - IF artifactKind is archive:
 *   -   archive = response.data.archive OR response.archive OR response.data
 *   -   IF archive lacks persisted identity or non-empty readable content: RETURN all-false
 *   -   RETURN { saved: true, readable: true, artifactId: archive.id OR archive.archiveId, backend }
 *   - IF artifactKind is screenshot:
 *   -   screenshots = response.data.screenshots OR response.screenshots OR []
 *   -   artifact = first screenshot with id OR artifactId OR hash
 *   -   IF no artifact: RETURN all-false
 *   -   RETURN { saved: true, readable: false, artifactId: artifact.id OR artifact.artifactId OR artifact.hash, backend }
 *
 * ## QUERY_SELECTED_BACKEND_ARTIFACT_STATUS
 *
 * - [IMPL-PAGE_ARCHIVE_STATUS_UI] [ARCH-PAGE_ARCHIVE_STATUS_UI] [REQ-PAGE_ARCHIVE_STATUS_UI] How: Query each artifact leg only for local/file and always pass the selected backend, then normalize independently.
 * - Contract:
 *   - INPUT: currentUrl, selectedBackend, sendMessage
 *   - PRE: currentUrl is non-empty and status context is current
 *   - OUTPUT: normalized archive and screenshot status
 *   - POST: unsupported backend produces all-false without sending archive messages; query failures remain all-false
 *   - FAILURE_MODES: unsupported backend, message rejection, stale response
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: QUERY_SELECTED_BACKEND_ARTIFACT_STATUS
 *   - IF selectedBackend is not local or file: RETURN all-false
 *   - archiveResponse, screenshotResponse = AWAIT IN PARALLEL:
 *   -   sendMessage({ type: GET_PAGE_ARCHIVE, data: { url: currentUrl, backend: selectedBackend } })
 *   -   sendMessage({ type: GET_PAGE_SCREENSHOTS, data: { url: currentUrl, backend: selectedBackend } })
 *   - IF statusContextKey changed while awaiting: DISCARD both results
 *   - RETURN NORMALIZE archiveResponse and screenshotResponse independently
 *
 * ## APPLY_ARCHIVE_STATUS_UI
 *
 * - [IMPL-PAGE_ARCHIVE_STATUS_UI] [ARCH-PAGE_ARCHIVE_STATUS_UI] [REQ-PAGE_ARCHIVE_STATUS_UI] How: Apply the normalized snapshot to the current popup or scoped This Page root with non-color accessibility cues and independent recapture controls.
 * - Contract:
 *   - INPUT: normalized status, UIManager element cache
 *   - PRE: elements may be absent in optional contexts
 *   - OUTPUT: DOM reflects archiveSaved, screenshotSaved, and readerAvailable
 *   - POST: capture buttons remain enabled on archive-capable backends; Reader is visible but disabled with an explanation when unavailable
 *   - FAILURE_MODES: absent optional element
 *   - DATA_TRANSITION: set root archive/screenshot/Reader/backend datasets, set data-archive-saved/data-screenshot-saved and active classes independently, and synchronize the Reader status description visibility and aria-describedby hook
 *   - EFFECTS: DOM, State
 *   - TERMINATION: total
 * - PROCEDURE: APPLY_ARCHIVE_STATUS_UI
 *   - archiveButton = elements.captureArchiveBtn; screenshotButton = elements.captureScreenshotBtn; readerButton = elements.openReaderBtn
 *   - root = elements.mainInterface OR scoped container
 *   - SET root data-archive-saved, data-screenshot-saved, data-reader-available, and data-archive-backend
 *   - SET archiveButton active and aria-label/title from archiveSaved; preserve disabled = false for local/file recapture
 *   - SET screenshotButton active and aria-label/title from screenshotSaved; preserve disabled = false for local/file recapture
 *   - SET readerButton disabled = NOT readerAvailable; SET aria-disabled and explanatory title/label when unavailable
 *   - SET archiveStatusDescription hidden = readerAvailable and text to the unavailable explanation when Reader is unavailable
 *   - SET readerButton aria-describedby to archiveStatusDescription when that element has an id
 *   - SET data attributes on each button and shared status state
 *
 * ## REFRESH_ARCHIVE_STATUS_AFTER_CAPTURE
 *
 * - [IMPL-PAGE_ARCHIVE_STATUS_UI] [ARCH-PAGE_ARCHIVE_STATUS_UI] [REQ-PAGE_ARCHIVE_STATUS_UI] How: Refresh only the successful capture leg after a successful archive or screenshot command, preserving the other leg.
 * - Contract:
 *   - INPUT: captureKind, currentUrl, selectedBackend, captureResult
 *   - PRE: captureResult is successful and context is current
 *   - OUTPUT: updated independent status snapshot
 *   - POST: failed capture does not create a positive indicator
 *   - FAILURE_MODES: capture failure, context change, status query failure
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: REFRESH_ARCHIVE_STATUS_AFTER_CAPTURE
 *   - IF captureResult.success is not true: RETURN current status
 *   - QUERY matching artifact leg with selected backend
 *   - APPLY matching normalized status while preserving the other leg
 *
 * ## RESET_ARCHIVE_STATUS_ON_CONTEXT_CHANGE
 *
 * - [IMPL-PAGE_ARCHIVE_STATUS_UI] [ARCH-PAGE_ARCHIVE_STATUS_UI] [REQ-PAGE_ARCHIVE_STATUS_UI] How: Clear persisted status before any new URL or selected-backend context can display it, preventing cross-tab/backend leakage.
 * - Contract:
 *   - INPUT: nextUrl, nextBackend, previous status context
 *   - PRE: context change is observable
 *   - OUTPUT: cleared status snapshot and new statusContextKey
 *   - POST: archiveSaved, screenshotSaved, and readerAvailable are false until the new context is queried
 *   - EFFECTS: State, DOM
 *   - TERMINATION: total
 * - PROCEDURE: RESET_ARCHIVE_STATUS_ON_CONTEXT_CHANGE
 *   - IF `${nextUrl}|${nextBackend}` equals statusContextKey: RETURN unchanged
 *   - SET statusContextKey = `${nextUrl}|${nextBackend}`
 *   - APPLY all-false status immediately
 *   - IF nextUrl is non-empty AND nextBackend is local or file: QUERY_SELECTED_BACKEND_ARTIFACT_STATUS
 *
 * === END IMPL-FULL-BLOCK: IMPL-PAGE_ARCHIVE_STATUS_UI ===
 */
import {
  currentTagDisplayLabel,
  isEmptyOrWhitespaceOnlyTag,
  isTagCaseFoldingMode,
  tagChipDisplayAndAddValue
} from '../../shared/tag-case-folding.js'
import {
  isTagChipSortMode,
  lookupBookmarkFrequency,
  sortTagChipRows
} from '../../shared/tag-chip-sort.js'
import { syncBookmarkNotesFields as syncBookmarkNotesFieldsHelper } from '../../shared/bookmark-notes-ui.js'
import { applyLinkHealthHint } from '../../shared/link-health.js'

export class UIManager {
  constructor ({ errorHandler, stateManager, config = {}, container = null } = {}) {
    this.errorHandler = errorHandler
    this.stateManager = stateManager
    this.config = config
    this.eventHandlers = new Map()
    // [IMPL-UIManager_SCOPED_ROOT] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] Scoped root for side panel Bookmark tab
    this.container = container || null

    // [REQ-SIDE_PANEL_POPUP_EQUIVALENT] This Page tag chip case folding (original | lower | upper); default first session load.
    /** @type {import('../../shared/tag-case-folding.js').TagCaseFoldingMode} */
    this.tagCaseFoldingMode = 'original'
    // [REQ-THIS_PAGE_TAG_SORT] [IMPL-THIS_PAGE_TAG_SORT] Side panel only when tagSortToggle present; default alphabetical.
    /** @type {import('../../shared/tag-chip-sort.js').TagChipSortMode} */
    this.tagSortMode = 'alphabetical'
    /** @type {Record<string, number>} hoverboard_tag_frequency copy for chip ordering */
    this.tagFrequencyMap = {}
    /** @type {boolean} */
    this._tagSortUiEnabled = false
    /** @type {ReturnType<typeof setTimeout> | null} */
    this._actionFeedbackTimer = null
    /** @type {{ current: string[], recent: string[], suggested: Array<{ tag: string, relevance: number, inPageFrequency: number }> }} */
    this._tagChipSourceCache = { current: [], recent: [], suggested: [] }

    // Cache DOM elements
    this.elements = {}
    this.cacheElements()

    // Apply configuration-based UI settings
    this.applyConfiguration()

    // Bind methods
    this.emit = this.emit.bind(this)
    this.on = this.on.bind(this)
    this.off = this.off.bind(this)
  }

  /**
   * Apply configuration-based UI settings
   */
  applyConfiguration () {
    // Apply section labels visibility setting
    if (this.config.uxShowSectionLabels !== undefined) {
      this.updateSectionLabelsVisibility(this.config.uxShowSectionLabels)
    }

    // Apply font size configuration
    this.applyFontSizeConfig()
  }

  /**
   * Apply font size configuration using CSS variables
   */
  applyFontSizeConfig () {
    const root = document.documentElement

    // Apply font sizes from config or use defaults
    const fontSizes = {
      suggestedTags: this.config.fontSizeSuggestedTags || 10,
      labels: this.config.fontSizeLabels || 12,
      tags: this.config.fontSizeTags || 12,
      base: this.config.fontSizeBase || 14,
      inputs: this.config.fontSizeInputs || 14
    }

    // Set CSS custom properties
    root.style.setProperty('--font-size-suggested-tags', `${fontSizes.suggestedTags}px`)
    root.style.setProperty('--font-size-labels', `${fontSizes.labels}px`)
    root.style.setProperty('--font-size-tags', `${fontSizes.tags}px`)
    root.style.setProperty('--font-size-base-custom', `${fontSizes.base}px`)
    root.style.setProperty('--font-size-inputs-custom', `${fontSizes.inputs}px`)
  }

  /**
   * Update section labels visibility based on configuration.
   * [IMPL-UIManager_SCOPED_ROOT] When container set, scope to container so only Bookmark panel labels are updated.
   */
  updateSectionLabelsVisibility (showLabels) {
    const root = this.container || document
    const sectionTitles = root.querySelectorAll('.section-title')
    sectionTitles.forEach(title => {
      if (showLabels) {
        title.style.display = ''
      } else {
        title.style.display = 'none'
      }
    })
  }

  /**
   * Cache frequently used DOM elements.
   * [IMPL-UIManager_SCOPED_ROOT] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] When this.container is set,
   * resolve each element via container.querySelector('[data-popup-ref="key"]'); otherwise document.getElementById(key).
   */
  cacheElements () {
    const root = this.container || document
    const get = (key) => {
      if (this.container) {
        return this.container.querySelector(`[data-popup-ref="${key}"]`)
      }
      return document.getElementById(key)
    }
    this.elements = {
      // Container elements
      mainInterface: get('mainInterface'),
      loadingState: get('loadingState'),
      errorState: get('errorState'),
      errorMessage: get('errorMessage'),
      retryBtn: get('retryBtn'),
      actionFeedback: get('actionFeedback'),
      actionFeedbackMessage: get('actionFeedbackMessage'),

      // Status elements
      bookmarkStatus: get('bookmarkStatus'),
      versionInfo: get('versionInfo'),

      // Action buttons
      showHoverBtn: get('showHoverBtn'),
      togglePrivateBtn: get('togglePrivateBtn'),
      toggleReadBtn: get('toggleReadBtn'),
      deleteBtn: get('deleteBtn'),
      // [REQ-PAGE_ARCHIVE_STORAGE] [ARCH-PAGE_ARCHIVE_STORAGE] [IMPL-PAGE_ARCHIVE_STORAGE]
      captureArchiveBtn: get('captureArchiveBtn'),
      // [REQ-PAGE_SCREENSHOT_ARCHIVE] [ARCH-PAGE_SCREENSHOT_ARCHIVE] [IMPL-PAGE_SCREENSHOT_ARCHIVE]
      captureScreenshotBtn: get('captureScreenshotBtn'),
      // [REQ-OFFLINE_READER_MODE] [ARCH-OFFLINE_READER_MODE] [IMPL-OFFLINE_READER_MODE]
      openReaderBtn: get('openReaderBtn'),
      // [REQ-PAGE_ARCHIVE_STATUS_UI] [ARCH-PAGE_ARCHIVE_STATUS_UI] [IMPL-PAGE_ARCHIVE_STATUS_UI]
      archiveStatusDescription: get('archiveStatusDescription'),
      reloadBtn: get('reloadBtn'),
      optionsBtn: get('optionsBtn'),
      bookmarksIndexBtn: get('bookmarksIndexBtn'),
      openTagsTreeBtn: get('openTagsTreeBtn'),
      browserBookmarkImportBtn: get('browserBookmarkImportBtn'),
      settingsBtn: get('settingsBtn'),

      // Input elements
      newTagInput: get('newTagInput'),
      addTagBtn: get('addTagBtn'),
      tagWithAiBtn: get('tagWithAiBtn'),
      // [IMPL-AI_TAG_TEST] [ARCH-AI_TAGGING_CONFIG] [REQ-AI_TAGGING_CONFIG] Popup Test API key button and status span.
      testAiApiBtn: get('testAiApiBtn'),
      popupAiTestStatus: get('popupAiTestStatus'),
      searchInput: get('searchInput'),
      searchBtn: get('searchBtn'),
      searchSuggestions: get('searchSuggestions'),
      // [REQ-LIBRARY_SEARCH_ENTRY] [IMPL-LIBRARY_SEARCH_ENTRY]
      librarySearchInput: get('librarySearchInput'),
      librarySearchBtn: get('librarySearchBtn'),

      // Tag display
      currentTagsContainer: get('currentTagsContainer'),
      recentTagsContainer: get('recentTagsContainer'),
      suggestedTagsContainer: get('suggestedTagsContainer'),
      // [REQ-SIDE_PANEL_POPUP_EQUIVALENT] Side panel This Page only; absent in standalone popup.html
      tagCaseFoldingToggle: get('tagCaseFoldingToggle'),
      // [REQ-THIS_PAGE_TAG_SORT] Side panel This Page only
      tagSortToggle: get('tagSortToggle'),

      // Status displays
      privateIcon: get('privateIcon'),
      privateStatus: get('privateStatus'),
      readIcon: get('readIcon'),
      readStatus: get('readStatus'),

      // [IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] - Add checkbox element reference
      showHoverOnPageLoad: get('showHoverOnPageLoad'),

      // [IMPL-MOVE_BOOKMARK_UI] [ARCH-MOVE_BOOKMARK_UI] [REQ-MOVE_BOOKMARK_STORAGE_UI] [REQ-STORAGE_MODE_DEFAULT] Storage backend select-one buttons (pinboard | file | local | sync | browser)
      storageBackendButtons: get('storageBackendButtons'),

      // [REQ-BOOKMARK_USAGE_TRACKING] [ARCH-BOOKMARK_USAGE_TRACKING_UI] [IMPL-BOOKMARK_USAGE_TRACKING_UI] This Page inline usage section
      usageStatsSection: get('usageStatsSection'),
      usageStatsText: get('usageStatsText'),
      usageReferrerText: get('usageReferrerText'),

      // [REQ-BOOKMARK_NOTES_UI] [ARCH-BOOKMARK_NOTES_UI] [IMPL-BOOKMARK_NOTES_UI] Title/Notes fields
      bookmarkTitleInput: get('bookmarkTitleInput'),
      bookmarkNotesInput: get('bookmarkNotesInput'),
      bookmarkNotesHint: get('bookmarkNotesHint'),
      linkHealthHint: get('linkHealthHint'),
      saveBookmarkDetailsBtn: get('saveBookmarkDetailsBtn')
    }
    this._tagSortUiEnabled = !!this.elements.tagSortToggle
  }

  /**
   * Setup all event listeners
   */
  setupEventListeners () {
    // Action buttons
    this.elements.showHoverBtn?.addEventListener('click', () => {
      this.emit('showHoverboard')
    })

    this.elements.togglePrivateBtn?.addEventListener('click', () => {
      this.emit('togglePrivate')
    })

    this.elements.toggleReadBtn?.addEventListener('click', () => {
      this.emit('readLater')
    })

    this.elements.deleteBtn?.addEventListener('click', () => {
      this.emit('deletePin')
    })

    // [IMPL-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE] Forward archive association action to PopupController while preserving the persistent popup session.
    this.elements.captureArchiveBtn?.addEventListener('click', () => this.emit('capturePageArchive'))
    this.elements.captureScreenshotBtn?.addEventListener('click', () => this.emit('capturePageScreenshot'))
    // [REQ-OFFLINE_READER_MODE] [ARCH-OFFLINE_READER_MODE] [IMPL-OFFLINE_READER_MODE]
    this.elements.openReaderBtn?.addEventListener('click', () => this.emit('openOfflineReader'))

    this.elements.reloadBtn?.addEventListener('click', () => {
      // [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Emit refreshData event for manual refresh
      this.emit('refreshData')
      // Also emit reloadExtension for backward compatibility
      this.emit('reloadExtension')
    })

    this.elements.optionsBtn?.addEventListener('click', () => {
      this.emit('openOptions')
    })

    this.elements.bookmarksIndexBtn?.addEventListener('click', () => {
      this.emit('openBookmarksIndex')
    })

    // [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE] Tags tree button: emit openTagsTree so PopupController sends OPEN_SIDE_PANEL and SW opens side panel.
    this.elements.openTagsTreeBtn?.addEventListener('click', () => {
      this.emit('openTagsTree')
    })

    this.elements.browserBookmarkImportBtn?.addEventListener('click', () => {
      this.emit('openBrowserBookmarkImport')
    })

    // [REQ-MOVE_BOOKMARK_STORAGE_UI] [IMPL-MOVE_BOOKMARK_UI] Storage backend buttons: click emits storageBackendChange (move when non-API to non-API)
    const storageBtns = this.elements.storageBackendButtons?.querySelectorAll('.storage-backend-btn')
    storageBtns?.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-backend')
        if (target) this.emit('storageBackendChange', target)
      })
    })

    this.elements.settingsBtn?.addEventListener('click', () => {
      this.emit('openOptions')
    })

    // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Enhanced input handling with validation
    this.elements.addTagBtn?.addEventListener('click', () => {
      const tagText = this.elements.newTagInput?.value
      if (tagText && this.isValidTag(tagText)) {
        this.emit('addTag', tagText)
        // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Clear input after successful addition
        this.elements.newTagInput.value = ''
      } else if (tagText && !this.isValidTag(tagText)) {
        // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Show validation error
        this.showError('Invalid tag format')
      }
    })

    // [IMPL-AI_TAGGING_POPUP_UI] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] Tag with AI button click emits tagWithAi.
    this.elements.tagWithAiBtn?.addEventListener('click', () => {
      this.emit('tagWithAi')
    })

    // [IMPL-AI_TAG_TEST] [ARCH-AI_TAGGING_CONFIG] [REQ-AI_TAGGING_CONFIG] Test API key button click emits testAiApiKey.
    this.elements.testAiApiBtn?.addEventListener('click', () => {
      this.emit('testAiApiKey')
    })

    this.elements.newTagInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const tagText = this.elements.newTagInput?.value
        if (tagText && this.isValidTag(tagText)) {
          this.emit('addTag', tagText)
          // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Clear input after successful addition
          this.elements.newTagInput.value = ''
        } else if (tagText && !this.isValidTag(tagText)) {
          // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Show validation error
          this.showError('Invalid tag format')
        }
      }
    })

    // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Add input validation on blur
    this.elements.newTagInput?.addEventListener('blur', () => {
      const tagText = this.elements.newTagInput?.value
      if (tagText && !this.isValidTag(tagText)) {
        this.showError('Invalid tag format')
      }
    })

    // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Add input validation on input change
    this.elements.newTagInput?.addEventListener('input', () => {
      const tagText = this.elements.newTagInput?.value
      if (tagText && !this.isValidTag(tagText)) {
        this.elements.newTagInput.classList.add('invalid')
      } else {
        this.elements.newTagInput.classList.remove('invalid')
      }
    })

    // [REQ-BOOKMARK_NOTES_UI] [ARCH-BOOKMARK_NOTES_UI] [IMPL-BOOKMARK_NOTES_UI] Persist title/notes on blur or Save details
    const emitSaveDetails = () => this.emit('saveBookmarkDetails')
    this.elements.bookmarkTitleInput?.addEventListener('blur', emitSaveDetails)
    this.elements.bookmarkNotesInput?.addEventListener('blur', emitSaveDetails)
    this.elements.saveBookmarkDetailsBtn?.addEventListener('click', (e) => {
      e.preventDefault()
      emitSaveDetails()
    })

    // [REQ-LIBRARY_SEARCH_ENTRY] [IMPL-LIBRARY_SEARCH_ENTRY]
    const emitLibrarySearch = () => {
      const q = this.elements.librarySearchInput?.value || ''
      this.emit('librarySearch', q)
    }
    this.elements.librarySearchBtn?.addEventListener('click', (e) => {
      e.preventDefault()
      emitLibrarySearch()
    })
    this.elements.librarySearchInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') emitLibrarySearch()
    })

    this.elements.searchBtn?.addEventListener('click', (e) => {
      e.preventDefault()
      const searchText = this.elements.searchInput?.value
      if (searchText) {
        this.emit('search', searchText)
      }
    })

    this.elements.searchInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        const searchText = this.elements.searchInput?.value
        if (searchText) {
          this.emit('search', searchText)
        }
      }
    })

    // Error handling
    this.elements.retryBtn?.addEventListener('click', () => {
      this.emit('retry')
    })

    // [IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] - Add checkbox event listener
    this.elements.showHoverOnPageLoad?.addEventListener('change', () => {
      this.emit('showHoverOnPageLoadChange')
    })

    // [REQ-SIDE_PANEL_POPUP_EQUIVALENT] Tag case folding (Original / lower / UPPER); only when side-panel markup includes toggle
    const caseToggleRoot = this.elements.tagCaseFoldingToggle
    if (caseToggleRoot) {
      caseToggleRoot.querySelectorAll('[data-case-mode]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const m = btn.getAttribute('data-case-mode')
          if (isTagCaseFoldingMode(m)) this.setTagCaseFoldingMode(m)
        })
      })
      this.syncTagCaseFoldingToggleDom()
    }

    // [REQ-THIS_PAGE_TAG_SORT] Tag sort (A–Z | frequency | relevance); side-panel markup only
    const sortToggleRoot = this.elements.tagSortToggle
    if (sortToggleRoot) {
      sortToggleRoot.querySelectorAll('[data-sort-mode]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const m = btn.getAttribute('data-sort-mode')
          if (isTagChipSortMode(m)) this.setTagSortMode(m)
        })
      })
      this.syncTagSortToggleDom()
    }
  }

  /**
   * [REQ-SIDE_PANEL_POPUP_EQUIVALENT] Session-only tag label casing for This Page tag chips.
   * @returns {import('../../shared/tag-case-folding.js').TagCaseFoldingMode}
   */
  getTagCaseFoldingMode () {
    return this.tagCaseFoldingMode
  }

  /**
   * [REQ-SIDE_PANEL_POPUP_EQUIVALENT] Set casing mode and redraw cached tag chips (no refetch).
   * @param {string} mode
   */
  setTagCaseFoldingMode (mode) {
    if (!isTagCaseFoldingMode(mode)) return
    this.tagCaseFoldingMode = mode
    this.syncTagCaseFoldingToggleDom()
    this.redrawTagChipsFromCache()
  }

  /**
   * [REQ-SIDE_PANEL_POPUP_EQUIVALENT] Update aria-pressed on segment buttons when present.
   */
  syncTagCaseFoldingToggleDom () {
    const root = this.elements.tagCaseFoldingToggle
    if (!root) return
    root.querySelectorAll('[data-case-mode]').forEach((btn) => {
      const m = btn.getAttribute('data-case-mode')
      const on = m === this.tagCaseFoldingMode
      btn.setAttribute('aria-pressed', on ? 'true' : 'false')
    })
  }

  /**
   * [REQ-SIDE_PANEL_POPUP_EQUIVALENT] Re-render Current / Recent / Suggested chips from last update* payload (mode change).
   * [REQ-THIS_PAGE_TAG_SORT] Suggested list re-painted from normalized cache (objects with relevance).
   */
  redrawTagChipsFromCache () {
    const { current, recent } = this._tagChipSourceCache
    this.updateCurrentTags([...current])
    this.updateRecentTags([...recent])
    this._paintSuggestedTags()
  }

  /**
   * [REQ-THIS_PAGE_TAG_SORT] Bookmark usage counts from chrome.storage.local (hoverboard_tag_frequency).
   * @param {Record<string, number>|null|undefined} map
   */
  setTagFrequencyMapForSort (map) {
    this.tagFrequencyMap = map && typeof map === 'object' ? { ...map } : {}
    // Caller updates chip lists (updateCurrentTags / loadRecentTags) or calls redrawTagChipsFromCache after map changes.
  }

  /**
   * [REQ-THIS_PAGE_TAG_SORT] When sort toggle absent (popup), preserve incoming list order from controller.
   * @returns {import('../../shared/tag-chip-sort.js').TagChipSortMode | null}
   */
  getEffectiveTagSortMode () {
    if (!this._tagSortUiEnabled) return null
    return this.tagSortMode
  }

  /**
   * [REQ-THIS_PAGE_TAG_SORT] Set sort mode and redraw cached chips.
   * @param {string} mode
   */
  setTagSortMode (mode) {
    if (!isTagChipSortMode(mode)) return
    this.tagSortMode = mode
    this.syncTagSortToggleDom()
    this.redrawTagChipsFromCache()
  }

  /**
   * [REQ-THIS_PAGE_TAG_SORT] aria-pressed on sort segment buttons.
   */
  syncTagSortToggleDom () {
    const root = this.elements.tagSortToggle
    if (!root) return
    root.querySelectorAll('[data-sort-mode]').forEach((btn) => {
      const m = btn.getAttribute('data-sort-mode')
      const on = m === this.tagSortMode
      btn.setAttribute('aria-pressed', on ? 'true' : 'false')
    })
  }

  /**
   * @param {unknown[]} input
   * @returns {Array<{ tag: string, relevance: number, inPageFrequency: number }>}
   */
  _normalizeSuggestedList (input) {
    if (!Array.isArray(input)) return []
    const out = []
    for (const item of input) {
      if (typeof item === 'string') {
        if (!isEmptyOrWhitespaceOnlyTag(item)) {
          out.push({ tag: item.trim(), relevance: 0, inPageFrequency: 0 })
        }
        continue
      }
      if (item && typeof item === 'object' && typeof item.tag === 'string') {
        const t = item.tag.trim()
        if (isEmptyOrWhitespaceOnlyTag(t)) continue
        const relevance = typeof item.relevance === 'number' && !Number.isNaN(item.relevance) ? item.relevance : 0
        let inPageFrequency = 0
        if (typeof item.inPageFrequency === 'number' && !Number.isNaN(item.inPageFrequency)) {
          inPageFrequency = item.inPageFrequency
        } else if (typeof item.frequency === 'number' && !Number.isNaN(item.frequency)) {
          inPageFrequency = item.frequency
        }
        out.push({ tag: t, relevance, inPageFrequency })
      }
    }
    return out
  }

  /**
   * Event emitter - emit custom events
   */
  emit (eventName, ...args) {
    const handlers = this.eventHandlers.get(eventName)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(...args)
        } catch (error) {
          this.errorHandler.handleError(`Error in event handler for ${eventName}`, error)
        }
      })
    }
  }

  /**
   * Event emitter - add event listener
   */
  on (eventName, handler) {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, [])
    }
    this.eventHandlers.get(eventName).push(handler)
  }

  /**
   * Event emitter - remove event listener
   */
  off (eventName, handler) {
    const handlers = this.eventHandlers.get(eventName)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  /**
   * Set loading state
   */
  setLoading (isLoading) {
    if (this.elements.loadingState) {
      this.elements.loadingState.classList.toggle('hidden', !isLoading)
    }

    if (this.elements.mainInterface) {
      this.elements.mainInterface.classList.toggle('hidden', isLoading)
    }

    // Disable/enable interactive elements ([REQ-AI_TAGGING_POPUP] tagWithAiBtn state set in loadInitialData + handleTagWithAi)
    const interactiveElements = [
      this.elements.showHoverBtn,
      this.elements.togglePrivateBtn,
      this.elements.toggleReadBtn,
      this.elements.deleteBtn,
      this.elements.captureArchiveBtn,
      this.elements.captureScreenshotBtn,
      this.elements.openReaderBtn,
      this.elements.addTagBtn,
      this.elements.newTagInput,
      this.elements.searchBtn,
      this.elements.searchInput
    ]

    interactiveElements.forEach(element => {
      if (element) {
        if (element === this.elements.openReaderBtn && !isLoading) {
          element.disabled = element.dataset.readerAvailable !== 'true'
        } else {
          element.disabled = isLoading
        }
      }
    })
  }

  /**
   * [REQ-BOOKMARK_USAGE_TRACKING] [ARCH-BOOKMARK_USAGE_TRACKING_UI] [IMPL-BOOKMARK_USAGE_TRACKING_UI]
   * Update This Page inline usage section: show when visitCount > 0 with stats and optional referrer line; hide otherwise.
   * @param {{ visitCount: number, lastVisitedAgoText: string } | null} usage - null or { visitCount, lastVisitedAgoText } (e.g. "2 hours ago")
   * @param {string} [topReferrerDisplay] - e.g. "example.com/docs" or ''
   */
  updateUsageSection (usage, topReferrerDisplay = '') {
    const section = this.elements.usageStatsSection
    const statsEl = this.elements.usageStatsText
    const referrerEl = this.elements.usageReferrerText
    if (!section) return
    const show = usage && usage.visitCount > 0
    section.classList.toggle('hidden', !show)
    if (show && statsEl) {
      const n = usage.visitCount
      const ago = usage.lastVisitedAgoText || ''
      statsEl.textContent = `Visited ${n} time${n !== 1 ? 's' : ''} — last ${ago}`
    }
    if (referrerEl) {
      const ref = (topReferrerDisplay || '').trim()
      referrerEl.textContent = ref ? `Referred from: ${ref}` : ''
      referrerEl.setAttribute('aria-hidden', ref ? 'false' : 'true')
    }
  }

  /**
   * Update connection status indicator
   */
  updateConnectionStatus (isConnected) {
    if (this.elements.statusIndicator) {
      this.elements.statusIndicator.className = `status-indicator ${isConnected ? 'online' : 'offline'}`
      this.elements.statusIndicator.title = isConnected ? 'Connected to Pinboard' : 'Disconnected from Pinboard'
    }
  }

  /**
   * Update private status button
   */
  updatePrivateStatus (isPrivate) {
    if (this.elements.togglePrivateBtn) {
      this.elements.togglePrivateBtn.classList.toggle('active', isPrivate)

      // Update status display
      if (this.elements.privateIcon && this.elements.privateStatus) {
        if (isPrivate) {
          this.elements.privateIcon.textContent = '🔒'
          this.elements.privateStatus.textContent = 'Private'
        } else {
          this.elements.privateIcon.textContent = '🔓'
          this.elements.privateStatus.textContent = 'Public'
        }
      }
    }
  }

  /**
   * Update read later status display
   */
  updateReadLaterStatus (isReadLater) {
    if (this.elements.toggleReadBtn) {
      this.elements.toggleReadBtn.classList.toggle('active', isReadLater)

      // Update status display
      if (this.elements.readIcon && this.elements.readStatus) {
        if (isReadLater) {
          this.elements.readIcon.textContent = '📖'
          this.elements.readStatus.textContent = 'Read Later'
        } else {
          this.elements.readIcon.textContent = '📋'
          this.elements.readStatus.textContent = 'Not marked'
        }
      }
    }
  }

  /**
   * [IMPL-PAGE_ARCHIVE_STATUS_UI] [ARCH-PAGE_ARCHIVE_STATUS_UI] [REQ-PAGE_ARCHIVE_STATUS_UI]
   * Apply independent persisted artifact state to popup or scoped This Page controls.
   * Capture buttons intentionally remain recapturable; only Reader availability is gated.
   * @param {{ backend?: string|null, archiveSaved?: boolean, screenshotSaved?: boolean, readerAvailable?: boolean, archiveArtifactId?: string|null, screenshotArtifactId?: string|null }} status
   */
  updateArchiveArtifactStatus (status = {}) {
    const archiveSaved = status.archiveSaved === true
    const screenshotSaved = status.screenshotSaved === true
    const readerAvailable = status.readerAvailable === true && archiveSaved
    const archiveButton = this.elements.captureArchiveBtn
    const screenshotButton = this.elements.captureScreenshotBtn
    const readerButton = this.elements.openReaderBtn
    const root = this.elements.mainInterface || this.container

    if (root) {
      root.dataset.archiveSaved = String(archiveSaved)
      root.dataset.screenshotSaved = String(screenshotSaved)
      root.dataset.readerAvailable = String(readerAvailable)
      root.dataset.archiveBackend = status.backend || ''
    }

    if (archiveButton) {
      archiveButton.classList.toggle('active', archiveSaved)
      archiveButton.dataset.archiveSaved = String(archiveSaved)
      archiveButton.dataset.archiveArtifactId = status.archiveArtifactId || ''
      const label = archiveSaved ? 'Save page archive (saved)' : 'Save page archive'
      archiveButton.setAttribute('aria-label', label)
      archiveButton.title = label
    }

    if (screenshotButton) {
      screenshotButton.classList.toggle('active', screenshotSaved)
      screenshotButton.dataset.screenshotSaved = String(screenshotSaved)
      screenshotButton.dataset.screenshotArtifactId = status.screenshotArtifactId || ''
      const label = screenshotSaved ? 'Save page screenshot (saved)' : 'Save page screenshot'
      screenshotButton.setAttribute('aria-label', label)
      screenshotButton.title = label
    }

    if (readerButton) {
      readerButton.disabled = !readerAvailable
      readerButton.setAttribute('aria-disabled', String(!readerAvailable))
      const label = readerAvailable
        ? 'Open offline Reader'
        : 'Open offline Reader (unavailable: save a page archive first)'
      readerButton.setAttribute('aria-label', label)
      readerButton.title = label
      readerButton.dataset.readerAvailable = String(readerAvailable)
      if (this.elements.archiveStatusDescription) {
        this.elements.archiveStatusDescription.hidden = readerAvailable
        this.elements.archiveStatusDescription.textContent = readerAvailable
          ? ''
          : 'Offline Reader is unavailable until a readable page archive is saved for this backend.'
        if (this.elements.archiveStatusDescription.id) {
          readerButton.setAttribute('aria-describedby', this.elements.archiveStatusDescription.id)
        }
      }
    }
  }

  /**
   * [REQ-MOVE_BOOKMARK_STORAGE_UI] [IMPL-MOVE_BOOKMARK_UI] Update storage backend buttons: set aria-pressed on the selected backend (pinboard | local | file | sync).
   * [REQ-STORAGE_MODE_DEFAULT] If backend is falsy, use 'local' so one option is always selected.
   */
  updateStorageBackendValue (backend) {
    if (!backend) backend = 'local'
    const container = this.elements.storageBackendButtons
    if (!container) return
    const buttons = container.querySelectorAll('.storage-backend-btn')
    buttons.forEach(btn => {
      const isSelected = btn.getAttribute('data-backend') === backend
      btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false')
    })
  }

  /**
   * - [IMPL-BOOKMARK_NOTES_UI] [ARCH-BOOKMARK_NOTES_UI] [REQ-BOOKMARK_NOTES_UI] How: Populate Title/Notes inputs; disable Notes for browser.
   * @param {object|null} pin
   * @param {string|null} backendId
   */
  syncBookmarkNotesFields (pin, backendId) {
    return syncBookmarkNotesFieldsHelper({
      pin,
      backendId,
      titleInput: this.elements.bookmarkTitleInput,
      notesInput: this.elements.bookmarkNotesInput,
      notesHintEl: this.elements.bookmarkNotesHint
    })
  }

  /**
   * [REQ-LINK_HEALTH] [IMPL-LINK_HEALTH] Show or clear compact stored health hint on This Page/popup.
   * @param {string} text
   */
  setLinkHealthHint (text) {
    applyLinkHealthHint(this.elements.linkHealthHint, text)
  }

  /**
   * [REQ-MOVE_BOOKMARK_STORAGE_UI] No-op: move is done via storage backend buttons. Kept for API compatibility.
   * @param {string} _backend - 'pinboard'|'local'|'file'|'sync'
   * @param {boolean} _hasBookmark - whether current URL has a saved bookmark
   */
  updateStorageLocalToggle (_backend, _hasBookmark) {
    // Toggle removed; all moves via select-one buttons
  }

  /**
   * [REQ-MOVE_BOOKMARK_STORAGE_UI] Enable or disable Pinboard storage button based on API key configuration.
   * When disabled, button cannot be selected; title hints user to configure token in Options.
   * @param {boolean} hasApiKey - whether a Pinboard API token is configured
   */
  updateStoragePinboardEnabled (hasApiKey) {
    const container = this.elements.storageBackendButtons
    if (!container) return
    const btn = container.querySelector('.storage-backend-btn[data-backend="pinboard"]')
    if (!btn) return
    btn.disabled = !hasApiKey
    btn.title = hasApiKey ? 'Pinboard (cloud)' : 'Configure API token in Options to use Pinboard'
    btn.setAttribute('aria-label', hasApiKey ? 'Pinboard (cloud)' : 'Pinboard (cloud). Configure API token in Options to use.')
  }

  /**
   * Update version info
   */
  updateVersionInfo (version) {
    if (this.elements.versionInfo) {
      this.elements.versionInfo.textContent = `v${version}`
    }
  }

  /**
   * Update current tags display
   * [REQ-SIDE_PANEL_POPUP_EQUIVALENT] Label casing from tagCaseFoldingMode; remove uses stored string.
   * [REQ-THIS_PAGE_TAG_SORT] When side-panel sort toggle present, order by selected mode within Current Tags only.
   */
  updateCurrentTags (tags) {
    if (!this.elements.currentTagsContainer) return

    // Clear existing tags
    this.elements.currentTagsContainer.innerHTML = ''

    // Create tag elements
    const tagsArray = Array.isArray(tags) ? tags : tags.split(' ').filter(tag => tag.length > 0)
    this._tagChipSourceCache.current = [...tagsArray]

    const visible = tagsArray.filter(tag => !isEmptyOrWhitespaceOnlyTag(tag))

    // If no tags, show empty state
    if (visible.length === 0) {
      this.elements.currentTagsContainer.innerHTML = '<div class="no-tags">No tags</div>'
      return
    }

    const mode = this.getEffectiveTagSortMode()
    /** @type {string[]} */
    let ordered = visible
    if (mode) {
      const rows = visible.map((tag, stableIndex) => ({
        canonical: String(tag),
        displayKey: tagChipDisplayAndAddValue(String(tag), this.tagCaseFoldingMode).display,
        stableIndex,
        bookmarkFreq: lookupBookmarkFrequency(this.tagFrequencyMap, tag),
        relevance: 0,
        inPageFreq: 0
      }))
      ordered = sortTagChipRows(rows, mode).map((r) => r.canonical)
    }

    ordered.forEach(tag => {
      const tagElement = this.createTagElement(tag)
      this.elements.currentTagsContainer.appendChild(tagElement)
    })
  }

  /**
   * [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] - Update recent tags display with user-driven behavior
   * [REQ-THIS_PAGE_TAG_SORT] Sort within Recent Tags when side-panel toggle present (bookmark frequency map).
   * @param {string[]|Array<{ name?: string }>} recentTags - Tag names or objects with name (from service)
   */
  updateRecentTags (recentTags) {
    if (!this.elements.recentTagsContainer) return

    // Clear existing recent tags
    this.elements.recentTagsContainer.innerHTML = ''

    const raw = Array.isArray(recentTags) ? recentTags : []
    const source = raw.map((t) => {
      if (typeof t === 'string') return t
      if (t && typeof t === 'object' && t.name != null) return String(t.name)
      return String(t)
    })
    this._tagChipSourceCache.recent = [...source]
    const visible = source.filter(tag => !isEmptyOrWhitespaceOnlyTag(tag))

    // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] - Show empty state for user-driven recent tags
    if (visible.length === 0) {
      this.elements.recentTagsContainer.innerHTML = '<div class="no-tags">No recent tags</div>'
      return
    }

    const mode = this.getEffectiveTagSortMode()
    /** @type {string[]} */
    let ordered = visible
    if (mode) {
      const rows = visible.map((tag, stableIndex) => ({
        canonical: String(tag),
        displayKey: tagChipDisplayAndAddValue(String(tag), this.tagCaseFoldingMode).display,
        stableIndex,
        bookmarkFreq: lookupBookmarkFrequency(this.tagFrequencyMap, tag),
        relevance: 0,
        inPageFreq: 0
      }))
      ordered = sortTagChipRows(rows, mode).map((r) => r.canonical)
    }

    // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] - Create recent tag elements (clickable to add to current site only)
    ordered.forEach(tag => {
      const tagElement = this.createRecentTagElement(tag)
      this.elements.recentTagsContainer.appendChild(tagElement)
    })
  }

  /**
   * [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] - Create a recent tag element (clickable to add to current site only)
   * @param {string} tag - Tag name
   * @returns {HTMLElement} Tag element
   */
  createRecentTagElement (tag) {
    const { display, addValue } = tagChipDisplayAndAddValue(tag, this.tagCaseFoldingMode)
    const tagElement = document.createElement('div')
    tagElement.className = 'tag recent clickable'
    tagElement.innerHTML = `
      <span class="tag-text">${this.escapeHtml(display)}</span>
    `

    // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] - Add click handler to add this tag to current site only
    // [REQ-SIDE_PANEL_POPUP_EQUIVALENT] Persisted string matches displayed casing mode
    tagElement.addEventListener('click', () => {
      this.emit('addTag', addValue)
    })

    return tagElement
  }

  /**
   * [REQ-SUGGESTED_TAGS_FROM_CONTENT] [IMPL-SUGGESTED_TAGS] [ARCH-SUGGESTED_TAGS]
   * [REQ-THIS_PAGE_TAG_SORT] Accept legacy string[] or { tag, relevance, inPageFrequency } from page extract.
   * @param {unknown[]} suggestedTags
   */
  updateSuggestedTags (suggestedTags) {
    if (!this.elements.suggestedTagsContainer) return
    const normalized = this._normalizeSuggestedList(Array.isArray(suggestedTags) ? suggestedTags : [])
    this._tagChipSourceCache.suggested = normalized
    this._paintSuggestedTags()
  }

  /**
   * [REQ-SUGGESTED_TAGS_FROM_CONTENT] [REQ-THIS_PAGE_TAG_SORT] Paint suggested chips from normalized cache (sort when toggle present).
   */
  _paintSuggestedTags () {
    if (!this.elements.suggestedTagsContainer) return

    this.elements.suggestedTagsContainer.innerHTML = ''

    // [IMPL-UIManager_SCOPED_ROOT] Resolve suggestedTags section from container when set
    const suggestedTagsSection = this.container ? this.container.querySelector('[data-popup-ref="suggestedTags"]') : document.getElementById('suggestedTags')

    const source = this._tagChipSourceCache.suggested
    const visible = source.filter(s => !isEmptyOrWhitespaceOnlyTag(s.tag))

    if (visible.length === 0) {
      if (suggestedTagsSection) {
        suggestedTagsSection.style.display = 'none'
      }
      return
    }

    if (suggestedTagsSection) {
      suggestedTagsSection.style.display = 'block'
    }

    const mode = this.getEffectiveTagSortMode()
    /** @type {typeof visible} */
    let ordered = visible
    if (mode) {
      const rows = visible.map((item, stableIndex) => ({
        canonical: item.tag,
        displayKey: tagChipDisplayAndAddValue(item.tag, this.tagCaseFoldingMode).display,
        stableIndex,
        bookmarkFreq: lookupBookmarkFrequency(this.tagFrequencyMap, item.tag),
        relevance: item.relevance ?? 0,
        inPageFreq: item.inPageFrequency ?? 0,
        _itemRef: item
      }))
      ordered = sortTagChipRows(rows, mode).map((r) => r._itemRef)
    }

    ordered.forEach((item) => {
      const tagElement = this.createRecentTagElement(item.tag)
      this.elements.suggestedTagsContainer.appendChild(tagElement)
    })
  }

  /**
   * Create a tag element
   * [REQ-SIDE_PANEL_POPUP_EQUIVALENT] Display label follows tagCaseFoldingMode; removeTag uses stored `tag`.
   */
  createTagElement (tag) {
    const label = currentTagDisplayLabel(String(tag), this.tagCaseFoldingMode)
    const tagElement = document.createElement('div')
    tagElement.className = 'tag'
    tagElement.innerHTML = `
      <span class="tag-text">${this.escapeHtml(label)}</span>
      <button class="tag-remove" type="button" aria-label="Remove tag ${this.escapeHtml(tag)}" title="Remove tag">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
    `

    // Add remove handler
    const removeButton = tagElement.querySelector('.tag-remove')
    removeButton?.addEventListener('click', () => {
      this.emit('removeTag', tag)
    })

    return tagElement
  }

  /**
   * Clear tag input
   */
  clearTagInput () {
    if (this.elements.newTagInput) {
      this.elements.newTagInput.value = ''
      this.elements.newTagInput.focus()
    }
  }

  /**
   * [IMPL-SELECTION_TO_TAG_INPUT] [ARCH-SELECTION_TO_TAG_INPUT] [REQ-SELECTION_TO_TAG_INPUT] [REQ-TAG_MANAGEMENT] Set tag input value (e.g. from page selection).
   * @param {string} value - Text to set in the new-tag input
   */
  setTagInputValue (value) {
    if (!this.elements.newTagInput) return
    this.elements.newTagInput.value = value ?? ''
    this.elements.newTagInput.classList.remove('invalid')
  }

  /**
   * Clear search input
   */
  clearSearchInput () {
    if (this.elements.searchInput) {
      this.elements.searchInput.value = ''
    }
  }

  /**
   * Focus tag input
   */
  focusTagInput () {
    if (this.elements.newTagInput) {
      this.elements.newTagInput.focus()
    }
  }

  /**
   * Focus search input
   */
  focusSearchInput () {
    if (this.elements.searchInput) {
      this.elements.searchInput.focus()
    }
  }

  /**
   * [IMPL-TAB_SEARCH_NO_MATCH_UI] [ARCH-TAB_SEARCH_NO_MATCH_FEEDBACK] [REQ-TAB_SEARCH_NO_MATCH_UX]
   * Show search no-match feedback: add class to search button, remove after 2s so border fades to default.
   */
  showSearchNoMatchFeedback () {
    if (!this.elements.searchBtn) return
    this.elements.searchBtn.classList.add('search-no-match')
    setTimeout(() => {
      this.elements.searchBtn?.classList.remove('search-no-match')
    }, 2000)
  }

  /**
   * Show error message
   */
  showError (message) {
    if (this.elements.errorState && this.elements.errorMessage) {
      const title = this.elements.errorState.querySelector('h3')
      if (title) title.textContent = 'Error Loading Data'
      this.elements.errorMessage.textContent = message
      this.elements.errorState.classList.remove('hidden')
      this.elements.loadingState?.classList.add('hidden')
      this.elements.mainInterface?.classList.add('hidden')
      if (this.elements.retryBtn) this.elements.retryBtn.classList.remove('hidden')
    }
  }

  /**
   * [IMPL-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE]
   * Show archive association failure without replacing the loaded This Page interface with the initial-load error screen.
   */
  showActionError (message) {
    if (this.elements.errorState && this.elements.errorMessage) {
      const title = this.elements.errorState.querySelector('h3')
      if (title) title.textContent = 'Action Failed'
      this.elements.errorMessage.textContent = message
      this.elements.errorState.classList.remove('hidden')
      this.elements.loadingState?.classList.add('hidden')
      this.elements.mainInterface?.classList.remove('hidden')
      if (this.elements.retryBtn) this.elements.retryBtn.classList.add('hidden')
    }
  }

  /**
   * Hide error message
   */
  hideError () {
    if (this.elements.errorState) {
      this.elements.errorState.classList.add('hidden')
      const title = this.elements.errorState.querySelector('h3')
      if (title) title.textContent = 'Error Loading Data'
      if (this.elements.retryBtn) this.elements.retryBtn.classList.remove('hidden')
    }
  }

  /**
   * [IMPL-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE]
   * Show archive association success feedback for quick actions without hiding the loaded This Page interface.
   */
  showActionSuccess (message) {
    this._showActionFeedback(message, 'success')
  }

  /**
   * @param {string} message
   * @param {'success'} variant
   */
  _showActionFeedback (message, variant) {
    const el = this.elements.actionFeedback
    const msgEl = this.elements.actionFeedbackMessage
    if (!el || !msgEl) {
      console.log('Success:', message)
      this.hideError()
      return
    }
    el.classList.remove('hidden', 'success', 'error')
    el.classList.add(variant)
    msgEl.textContent = message
    this.hideError()
    if (this._actionFeedbackTimer) clearTimeout(this._actionFeedbackTimer)
    this._actionFeedbackTimer = setTimeout(() => {
      el.classList.add('hidden')
    }, 4000)
  }

  /**
   * Show success message
   */
  showSuccess (message) {
    if (this.elements.actionFeedback && this.elements.actionFeedbackMessage) {
      this.showActionSuccess(message)
      return
    }
    console.log('Success:', message)
    this.hideError()
  }

  /**
   * Show info message
   */
  showInfo (message) {
    // For now, we'll just log info messages
    console.log('Info:', message)
  }

  /**
   * Show/hide shortcuts help
   */
  toggleShortcutsHelp () {
    if (this.elements.shortcutsHelp) {
      const isHidden = this.elements.shortcutsHelp.hidden
      this.elements.shortcutsHelp.hidden = !isHidden
    }
  }

  /**
   * Hide shortcuts help
   */
  hideShortcutsHelp () {
    if (this.elements.shortcutsHelp) {
      this.elements.shortcutsHelp.hidden = true
    }
  }

  /**
   * Update button states based on current data
   */
  updateButtonStates (hasBookmark) {
    // Enable/disable buttons based on whether there's a bookmark
    const bookmarkRequiredButtons = [
      this.elements.togglePrivate,
      this.elements.deletePin
    ]

    bookmarkRequiredButtons.forEach(button => {
      if (button) {
        button.disabled = !hasBookmark
        button.classList.toggle('disabled', !hasBookmark)
      }
    })

    // Update button text/appearance
    if (this.elements.showHoverboard) {
      const buttonText = this.elements.showHoverboard.querySelector('.button-text')
      if (buttonText) {
        buttonText.textContent = 'Show Hoverboard'
      }
    }
  }

  /**
   * [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Update Show Hover button state from overlay visibility.
   * @param {boolean} isOverlayVisible - Whether the overlay is currently visible
   */
  updateShowHoverButtonState (isOverlayVisible) {
    const showHoverBtn = this.elements.showHoverBtn
    if (showHoverBtn) {
      const actionIcon = showHoverBtn.querySelector('.action-icon')

      if (isOverlayVisible) {
        actionIcon.textContent = '🙈'
        showHoverBtn.title = 'Hide hoverboard overlay'
        showHoverBtn.setAttribute('aria-label', 'Hide hoverboard overlay')
      } else {
        actionIcon.textContent = '👁️'
        showHoverBtn.title = 'Show hoverboard overlay'
        showHoverBtn.setAttribute('aria-label', 'Show hoverboard overlay')
      }
    }
  }

  /**
   * Set popup theme (light/dark)
   */
  setTheme (theme) {
    if (this.elements.popupContainer) {
      this.elements.popupContainer.classList.remove('light-mode', 'dark-mode')
      this.elements.popupContainer.classList.add(`${theme}-mode`)
    }
  }

  /**
   * Add CSS animation class
   */
  addAnimation (element, animationClass) {
    if (element) {
      element.classList.add(animationClass)

      // Remove animation class after animation completes
      element.addEventListener('animationend', () => {
        element.classList.remove(animationClass)
      }, { once: true })
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml (text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  /**
   * Handle window resize (if needed for responsive design)
   */
  handleResize () {
    // Could implement responsive adjustments here
    const width = window.innerWidth
    const height = window.innerHeight

    // Adjust layout if needed
    if (width < 350) {
      this.elements.popupContainer?.classList.add('compact')
    } else {
      this.elements.popupContainer?.classList.remove('compact')
    }
  }

  /**
   * [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Validate tag input
   * @param {string} tag - Tag to validate
   * @returns {boolean} Whether tag is valid
   */
  isValidTag (tag) {
    if (!tag || typeof tag !== 'string') {
      return false
    }

    const trimmedTag = tag.trim()
    if (trimmedTag.length === 0 || trimmedTag.length > 50) {
      return false
    }

    // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Check for invalid characters
    const invalidChars = /[<>]/g
    if (invalidChars.test(trimmedTag)) {
      return false
    }

    // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Check for only safe characters (allow #, +, . for e.g. C#, node.js; API encodes via buildSaveParams)
    const safeChars = /^[\w\s.#+-]+$/
    if (!safeChars.test(trimmedTag)) {
      return false
    }

    return true
  }

  /**
   * Cleanup event listeners and resources
   */
  cleanup () {
    // Clear event handlers
    this.eventHandlers.clear()

    // Remove window event listeners if any
    window.removeEventListener('resize', this.handleResize)

    // Clear timeouts if any
    // (In a full implementation, you'd track and clear timeouts)
  }

  /**
   * [TAB-SEARCH-UI] Show tab search results
   */
  showTabSearchResults (results) {
    const resultsContainer = this.elements.tabSearchResults
    if (!resultsContainer) return

    if (results.success) {
      resultsContainer.innerHTML = `
        <div class="search-result">
          <span class="result-count">${results.currentMatch} of ${results.matchCount}</span>
          <span class="result-title">${results.tabTitle}</span>
        </div>
      `
      resultsContainer.classList.remove('hidden')
    } else {
      resultsContainer.innerHTML = `
        <div class="search-result no-matches">
          <span class="result-message">${results.message}</span>
        </div>
      `
      resultsContainer.classList.remove('hidden')
    }
  }

  /**
   * [TAB-SEARCH-UI] Update search history display
   */
  updateSearchHistory (history) {
    const historyContainer = this.elements.tabSearchHistory
    if (!historyContainer || !history.length) return

    const historyHTML = history.map(term => `
      <button class="history-item" data-term="${term}">
        ${term}
      </button>
    `).join('')

    historyContainer.innerHTML = historyHTML
    historyContainer.classList.remove('hidden')
  }

  /**
   * [TAB-SEARCH-UI] Focus tab search input
   */
  focusTabSearchInput () {
    this.elements.tabSearchInput?.focus()
  }
}
