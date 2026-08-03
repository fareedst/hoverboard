/**
 * PopupController - Main business logic controller for the popup
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
 * === IMPL-FULL-BLOCK: IMPL-BOOKMARK_STATE_SYNC ===
 * [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] — BOOKMARK_UPDATED broadcast after overlay persist; popup and badge refresh so state is consistent.
 *
 * ## MAIN
 *
 * - [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] How: Logical block for IMPL-BOOKMARK_STATE_SYNC.
 * - Contract:
 *   - INPUT: user actions (overlay toggle, tag save/delete, bookmark save); processMessage result
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: consistent bookmark state across overlay, popup, badge
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: overlay state, popup state, badge state; BOOKMARK_UPDATED broadcast
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: MAIN
 *   - How (sub-block): Send message to backend; on success broadcast BOOKMARK_UPDATED.
 *   - 1. ON overlay toggle (saveBookmark / saveTag / deleteTag):
 *   - 2.   SEND message to backend; await processMessage result
 *   - 3.   BROADCAST BOOKMARK_UPDATED (so other surfaces can refresh)
 *   - How (sub-block): On saveTag/deleteTag/saveBookmark result compare tab URL state and update icon/count.
 *   - 4. Badge manager:
 *   - 5.   ON message result (saveTag | deleteTag | saveBookmark): compare current tab URL state with stored state; UPDATE badge icon/count
 *
 * ## OBSERVER_BOOKMARK_UPDATED_APPLY_EXTERNAL
 *
 * - [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [ARCH-MESSAGE_HANDLING] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] How: Constructor-path observer listener — synchronous, returns undefined, re-fetches pin/tags via applyExternalBookmarkUpdate in a detached promise. Distinct from setupRealTimeUpdates full refresh (IMPL-POPUP_SESSION OBSERVER_BOOKMARK_UPDATED_FULL_REFRESH). Chrome 144+ treats a promise-returning listener as answering and would deliver null to the SW sender.
 * - Contract:
 *   - INPUT: runtime.onMessage envelope (any type); BOOKMARK_UPDATED triggers refresh
 *   - PRE: PopupController constructed; chrome.runtime.onMessage available when registering
 *   - OUTPUT: undefined (never a Promise, never sendResponse); pin/tags UI may update asynchronously
 *   - POST:
 *     - success => listener returned undefined; unrelated types left the response channel free
 *     - BOOKMARK_UPDATED => detached applyExternalBookmarkUpdate started (or no-op when no currentTab)
 *   - FAILURE_MODES: RefreshFailed (caught inside detached chain; debugError; does not answer message)
 *   - DATA: currentTab; currentPin; UIManager tag/privacy/read-later widgets
 *   - DATA_TRANSITION: on BOOKMARK_UPDATED success path, currentPin and chip UI updated from re-fetch; else unchanged
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: OBSERVER_BOOKMARK_UPDATED_APPLY_EXTERNAL
 *   - REGISTER runtime.onMessage as synchronous function:
 *   -   IF message?.type !== 'BOOKMARK_UPDATED': RETURN undefined
 *   -   START detached applyExternalBookmarkUpdate(); CATCH → debugError
 *   -   RETURN undefined
 *
 * ## OBSERVER_BOOKMARK_UPDATED_FULL_REFRESH
 *
 * - [IMPL-BOOKMARK_STATE_SYNC] [IMPL-POPUP_SESSION] [ARCH-BOOKMARK_STATE_SYNC] [ARCH-POPUP_SESSION] [ARCH-MESSAGE_HANDLING] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [REQ-POPUP_PERSISTENT_SESSION] How: setupRealTimeUpdates observer — synchronous, returns undefined, runs refreshOnExternalBookmarkUpdate (refreshPopupData then updateOverlayState) in a detached promise. Complements constructor applyExternalBookmarkUpdate path; duplicate refresh is an accepted non-goal.
 * - Contract:
 *   - INPUT: runtime.onMessage envelope (any type); BOOKMARK_UPDATED triggers full refresh
 *   - PRE: setupRealTimeUpdates registered; controller may be initialized
 *   - OUTPUT: undefined; full This Page refresh may run asynchronously
 *   - POST:
 *     - success => listener returned undefined; response channel not claimed
 *     - BOOKMARK_UPDATED => detached refreshPopupData + updateOverlayState started
 *   - FAILURE_MODES: RefreshFailed (caught inside detached chain; debugError)
 *   - DATA: PopupController session state; overlay button state
 *   - DATA_TRANSITION: on success path, bookmark/suggested/overlay UI refreshed; else unchanged
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: OBSERVER_BOOKMARK_UPDATED_FULL_REFRESH
 *   - REGISTER runtime.onMessage as synchronous function:
 *   -   IF message?.type !== 'BOOKMARK_UPDATED': RETURN undefined
 *   -   START detached refreshOnExternalBookmarkUpdate(); CATCH → debugError
 *   -   RETURN undefined
 *
 * === END IMPL-FULL-BLOCK: IMPL-BOOKMARK_STATE_SYNC ===
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
 * === IMPL-FULL-BLOCK: IMPL-MOVE_BOOKMARK_UI ===
 * [IMPL-MOVE_BOOKMARK_UI] [ARCH-MOVE_BOOKMARK_UI] [REQ-MOVE_BOOKMARK_STORAGE_UI] [REQ-STORAGE_MODE_DEFAULT] [REQ-READ_LATER_BROWSER_FALLBACK]
 * Implements the shared Save to control and the new-bookmark-only Read Later backend resolution.
 *
 * ## Summary contract
 *
 * - [IMPL-MOVE_BOOKMARK_UI] [ARCH-MOVE_BOOKMARK_UI] [REQ-MOVE_BOOKMARK_STORAGE_UI] [REQ-STORAGE_MODE_DEFAULT] [REQ-READ_LATER_BROWSER_FALLBACK] How: Keep ordinary Save to routing unchanged while resolving Browser-selected new Read Later saves to a metadata-capable backend.
 * - Contract:
 *   - INPUT: currentTab, currentPin, selected Save to backend, ConfigManager, UIManager, and bookmark message boundary
 *   - PRE: the shared popup stack is initialized; selected backend is one of pinboard, local, file, sync, or browser
 *   - OUTPUT: ordinary save/move requests preserve selected backend; new Read Later save uses an effective metadata-capable backend; UI reflects effective backend after success
 *   - POST:
 *     - success => persisted bookmark and Save to state use the effective backend
 *     - failure => Save to and archive-status state remain unchanged
 *   - FAILURE_MODES: ConfigReadFailed, SaveFailed, MoveFailed
 *   - DATA: currentTab, currentPin, selectedBackend, effectiveBackend, fallbackApplied, Save to DOM state, archive-status state
 *   - DATA_TRANSITION: only successful new Read Later saves replace selectedBackend with effectiveBackend; failed saves leave UI and archive state unchanged
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 *
 * ## IS_PERSISTED_BOOKMARK
 *
 * - [IMPL-MOVE_BOOKMARK_UI] [ARCH-MOVE_BOOKMARK_UI] [REQ-MOVE_BOOKMARK_STORAGE_UI] [REQ-STORAGE_MODE_DEFAULT] [REQ-READ_LATER_BROWSER_FALLBACK] How: Distinguish a persisted bookmark from the empty/stub currentPin by requiring persisted bookmark identity rather than object truthiness.
 * - Contract:
 *   - INPUT: currentPin (bookmark or null)
 *   - PRE: currentPin is null or bookmark-shaped data
 *   - OUTPUT: boolean
 *   - POST:
 *     - true => currentPin has a non-empty persisted identity such as time
 *     - false => currentPin is absent or has an empty/stub identity
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: IS_PERSISTED_BOOKMARK
 *   - IF currentPin is absent: RETURN false
 *   - IF currentPin.time is absent or blank: RETURN false
 *   - RETURN true
 *
 * ## RESOLVE_READ_LATER_BACKEND
 *
 * - [IMPL-MOVE_BOOKMARK_UI] [ARCH-MOVE_BOOKMARK_UI] [REQ-MOVE_BOOKMARK_STORAGE_UI] [REQ-STORAGE_MODE_DEFAULT] [REQ-READ_LATER_BROWSER_FALLBACK] How: Preserve every selected metadata-capable backend; resolve selected Browser through the normalized default storage mode and fall back to Local without provider I/O.
 * - Contract:
 *   - INPUT: selectedBackend, getStorageMode
 *   - PRE: selectedBackend is a valid Save to backend; getStorageMode is callable and applies ConfigManager normalization
 *   - OUTPUT: { effectiveBackend, fallbackApplied } | { error: ConfigReadFailed }
 *   - POST:
 *     - selectedBackend in pinboard, local, file, or sync => effectiveBackend equals selectedBackend and fallbackApplied is false
 *     - selectedBackend browser and configured mode in pinboard, local, file, or sync => effectiveBackend equals configured mode and fallbackApplied is true
 *     - selectedBackend browser and configured mode browser => effectiveBackend equals local and fallbackApplied is true
 *     - error ConfigReadFailed => no provider save or UI state mutation occurs
 *   - FAILURE_MODES: ConfigReadFailed
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: RESOLVE_READ_LATER_BACKEND
 *   - IF selectedBackend is pinboard, local, file, or sync: RETURN { effectiveBackend: selectedBackend, fallbackApplied: false }
 *   - configuredBackend = AWAIT getStorageMode()
 *   - IF configuredBackend is pinboard, local, file, or sync: RETURN { effectiveBackend: configuredBackend, fallbackApplied: true }
 *   - RETURN { effectiveBackend: local, fallbackApplied: true }
 *
 * ## CREATE_READ_LATER_BOOKMARK
 *
 * - [IMPL-MOVE_BOOKMARK_UI] [ARCH-MOVE_BOOKMARK_UI] [REQ-MOVE_BOOKMARK_STORAGE_UI] [REQ-STORAGE_MODE_DEFAULT] [REQ-READ_LATER_BROWSER_FALLBACK] How: Reuse the existing bookmark creation path with toread set to yes and the resolved preferredBackend; ordinary createBookmark callers remain unchanged.
 * - Contract:
 *   - INPUT: currentTab, effectiveBackend, createBookmark
 *   - PRE: currentTab has an HTTP(S) URL; effectiveBackend is metadata-capable
 *   - OUTPUT: { success, bookmark, effectiveBackend } | { error: SaveFailed }
 *   - POST:
 *     - success => one new bookmark save was requested with toread yes and preferredBackend effectiveBackend
 *     - error SaveFailed => no success UI or Save to mutation occurs
 *   - FAILURE_MODES: SaveFailed
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: CREATE_READ_LATER_BOOKMARK
 *   - result = AWAIT createBookmark([], yes, yes, effectiveBackend, suppressSuccess: true)
 *   - IF result is failure: RETURN { error: SaveFailed }
 *   - RETURN { success: true, bookmark: result.bookmark, effectiveBackend }
 *
 * ## APPLY_READ_LATER_RESULT
 *
 * - [IMPL-MOVE_BOOKMARK_UI] [ARCH-MOVE_BOOKMARK_UI] [REQ-MOVE_BOOKMARK_STORAGE_UI] [REQ-STORAGE_MODE_DEFAULT] [REQ-READ_LATER_BROWSER_FALLBACK] How: Apply Save to and informational feedback only after a successful new Read Later save; keep archive-status and Offline Reader state independent.
 * - Contract:
 *   - INPUT: saveResult, effectiveBackend, fallbackApplied, currentPin, UIManager
 *   - PRE: saveResult is the result of CREATE_READ_LATER_BOOKMARK; UIManager may expose Save to and feedback methods
 *   - OUTPUT: updated bookmark/read-later UI or failure feedback
 *   - POST:
 *     - success => Read Later success feedback is shown
 *     - success with fallbackApplied => additionally Save to shows effectiveBackend and informational feedback names Browser limitation and effectiveBackend
 *     - success without fallback => selected backend remains unchanged
 *     - failure => Save to, archive-status, and Offline Reader state are unchanged
 *   - FAILURE_MODES: SaveFailed
 *   - DATA: currentPin, Save to DOM state, archive-status state
 *   - DATA_TRANSITION: on success, currentPin.toread becomes yes; on fallback success, selected Save to becomes effectiveBackend; on failure, unchanged
 *   - EFFECTS: State
 *   - TERMINATION: total
 * - PROCEDURE: APPLY_READ_LATER_RESULT
 *   - IF saveResult is failure: SHOW failure feedback; RETURN { error: SaveFailed }
 *   - SET currentPin.toread = yes
 *   - UPDATE read-later status to true
 *   - SHOW Read Later success feedback
 *   - IF fallbackApplied:
 *     - SET Save to backend to effectiveBackend
 *     - SHOW informational feedback naming Browser limitation and effectiveBackend
 *   - RETURN { success: true, effectiveBackend }
 *
 * ## READ_LATER_EVENT_BINDING
 *
 * - [IMPL-MOVE_BOOKMARK_UI] [ARCH-MOVE_BOOKMARK_UI] [REQ-MOVE_BOOKMARK_STORAGE_UI] [REQ-STORAGE_MODE_DEFAULT] [REQ-READ_LATER_BROWSER_FALLBACK] How: Route the shared UIManager readLater event through PopupController.handleReadLater for both popup and scoped This Page surfaces.
 * - Contract:
 *   - INPUT: UIManager readLater event, PopupController.handleReadLater, popup or This Page initialization
 *   - PRE: UIManager and PopupController share the same event/controller path
 *   - OUTPUT: one handleReadLater invocation with the current surface context
 *   - POST:
 *     - success => the same Read Later resolver and result application run in popup and This Page
 *     - failure => no duplicate fallback or archive command is emitted
 *   - FAILURE_MODES: BindingMissing
 *   - EFFECTS: State
 *   - TERMINATION: total
 * - PROCEDURE: READ_LATER_EVENT_BINDING
 *   - ON UIManager emits readLater:
 *     - INVOKE PopupController.handleReadLater
 *   - ON This Page initializes shared popup:
 *     - REUSE the same UIManager event binding
 *
 * ## READ_LATER_ACTION
 *
 * - [IMPL-MOVE_BOOKMARK_UI] [ARCH-MOVE_BOOKMARK_UI] [REQ-MOVE_BOOKMARK_STORAGE_UI] [REQ-STORAGE_MODE_DEFAULT] [REQ-READ_LATER_BROWSER_FALLBACK] How: Keep persisted-bookmark updates on the existing path and apply fallback only to new Read Later bookmark creation.
 * - Contract:
 *   - INPUT: currentPin, currentTab, getSelectedStorageBackend, getStorageMode, saveBookmark, UIManager
 *   - PRE: currentTab has an HTTP(S) URL and dependencies are wired
 *   - OUTPUT: saved Read Later bookmark and UI state | { error: ConfigReadFailed | SaveFailed }
 *   - POST:
 *     - persisted bookmark => existing toggle update path is used without Read Later fallback
 *     - unbookmarked URL => CREATE_READ_LATER_BOOKMARK receives the effective backend
 *     - failure => no false success, Save to mutation, or archive command
 *   - FAILURE_MODES: ConfigReadFailed, SaveFailed
 *   - DATA: currentPin, selectedBackend, effectiveBackend, fallbackApplied
 *   - DATA_TRANSITION: only successful new saves update currentPin and fallback selection
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: READ_LATER_ACTION
 *   - IF IS_PERSISTED_BOOKMARK(currentPin):
 *     - TOGGLE toread through the existing update save path
 *     - RETURN existing update result
 *   - selectedBackend = getSelectedStorageBackend()
 *   - resolution = AWAIT RESOLVE_READ_LATER_BACKEND(selectedBackend, getStorageMode)
 *   - IF resolution is error: RETURN resolution
 *   - saveResult = AWAIT CREATE_READ_LATER_BOOKMARK(currentTab, resolution.effectiveBackend, createBookmark)
 *   - RETURN APPLY_READ_LATER_RESULT(saveResult, resolution.effectiveBackend, resolution.fallbackApplied, currentPin, UIManager)
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
 * === IMPL-FULL-BLOCK: IMPL-POPUP_MESSAGE_TIMEOUT ===
 * [IMPL-POPUP_MESSAGE_TIMEOUT] — Promise-based send with timeout; reject on timeout or error. Contract: message and timeout in; Promise resolve/reject out.
 *
 * ## SEND_WITH_TIMEOUT
 *
 * - [IMPL-POPUP_MESSAGE_TIMEOUT] How: Implements sendWithTimeout(message, timeoutMs) behavior for IMPL-POPUP_MESSAGE_TIMEOUT.
 * - Contract:
 *   - INPUT: message (type, payload); timeout (ms)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: Promise that resolves with response or rejects on timeout/error | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: timeout handle; optional test mock for timeout value
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: SEND_WITH_TIMEOUT
 *   - promise = SEND message (Promise from message service)
 *   - timeoutId = SET timeout for timeoutMs -> REJECT with timeout error
 *   - ON promise resolve/reject: CLEAR timeoutId; RETURN promise result
 *   - RETURN promise (race with timeout)
 *
 * === END IMPL-FULL-BLOCK: IMPL-POPUP_MESSAGE_TIMEOUT ===
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
 * === IMPL-FULL-BLOCK: IMPL-RECENT_TAGS_POPUP_REFRESH ===
 * [IMPL-RECENT_TAGS_POPUP_REFRESH] [ARCH-POPUP_SESSION] [ARCH-TAG_SYSTEM] [REQ-RECENT_TAGS_SYSTEM] — Contract: event-driven async; void; failures → empty chips + logged error (no unhandled reject from loadRecentTags).
 *
 * ## SETUP_AUTO_REFRESH
 *
 * - [IMPL-RECENT_TAGS_POPUP_REFRESH] [ARCH-POPUP_SESSION] [ARCH-TAG_SYSTEM] [REQ-RECENT_TAGS_SYSTEM] How: Implements setupAutoRefresh() behavior for IMPL-RECENT_TAGS_POPUP_REFRESH.
 * - Contract:
 *   - INPUT: none (event-driven)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: void (side effect — uiManager.updateRecentTags(string[]))
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: document.visibilityState; controller.initialized; controller.isLoading; currentPin.tags; getRecentBookmarks payload { currentTags, senderUrl }
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: SETUP_AUTO_REFRESH
 *   - REGISTER document.addEventListener("visibilitychange", handler)
 *   - How (sub-block): How: gate on visible + initialized + !isLoading; then await loadRecentTags (same tokens as top).
 *
 * ## HANDLER
 *
 * - [IMPL-RECENT_TAGS_POPUP_REFRESH] [ARCH-POPUP_SESSION] [ARCH-TAG_SYSTEM] [REQ-RECENT_TAGS_SYSTEM] How: Implements handler() behavior for IMPL-RECENT_TAGS_POPUP_REFRESH.
 * - Contract:
 *   - INPUT: none (event-driven)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: void (side effect — uiManager.updateRecentTags(string[]))
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: document.visibilityState; controller.initialized; controller.isLoading; currentPin.tags; getRecentBookmarks payload { currentTags, senderUrl }
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: HANDLER
 *   - IF document.visibilityState !== "visible" THEN RETURN
 *   - IF NOT controller.initialized OR controller.isLoading THEN RETURN
 *   - AWAIT loadRecentTags()
 *
 * ## LOAD_RECENT_TAGS
 *
 * - [IMPL-RECENT_TAGS_POPUP_REFRESH] [ARCH-POPUP_SESSION] [ARCH-TAG_SYSTEM] [REQ-RECENT_TAGS_SYSTEM] [IMPL-MESSAGE_HANDLING] [IMPL-TAG_SYSTEM] How: sendMessage routes to SW processMessage → handleGetRecentBookmarks → tagService.getUserRecentTagsExcludingCurrent; map to chip strings; defensive second filter vs currentTags; cross-IMPL dependency on message + TagService layers.
 * - Contract:
 *   - INPUT: none (event-driven)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: void (side effect — uiManager.updateRecentTags(string[])) | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: document.visibilityState; controller.initialized; controller.isLoading; currentPin.tags; getRecentBookmarks payload { currentTags, senderUrl }
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: LOAD_RECENT_TAGS
 *   - currentTags = normalizeTags(controller.currentPin?.tags OR [])
 *   - TRY:
 *   - response = AWAIT sendMessage({ type: "getRecentBookmarks", data: { currentTags, senderUrl: currentTab.url } })
 *   - names = MAP response.recentTags to string names (string OR .name)
 *   - filtered = FILTER names where not in currentTags
 *   - uiManager.updateRecentTags(filtered)
 *   - CATCH:
 *   - LOG error; uiManager.updateRecentTags([])
 *
 * ## BLOCK_4
 *
 * - How: satisfies REQ-RECENT_TAGS_SYSTEM “refresh when UI shown” for popup; shared SW state with side panel path ([IMPL-SIDE_PANEL_TABS] loadRecentTags on focus) — either may refresh; ordering independent; both use same message contract.
 * - Contract:
 *   - INPUT: none (event-driven)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: void (side effect — uiManager.updateRecentTags(string[]))
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: document.visibilityState; controller.initialized; controller.isLoading; currentPin.tags; getRecentBookmarks payload { currentTags, senderUrl }
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: BLOCK_4
 *   - How (sub-block): --- Composition / cross-IMPL ---
 *
 * === END IMPL-FULL-BLOCK: IMPL-RECENT_TAGS_POPUP_REFRESH ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-SCREENSHOT_MODE ===
 * [IMPL-SCREENSHOT_MODE] [REQ-LOCAL_BOOKMARKS_INDEX] — Placeholder screenshot flow: seed storage, fake tab params, data-screenshot-ready, handleGetCurrentBookmark prefers data.url. Contract: URL params and seed; placeholder UI and script capture.
 *
 * ## MAIN
 *
 * - [IMPL-SCREENSHOT_MODE] [REQ-LOCAL_BOOKMARKS_INDEX] How: Rich placeholder data: 15+ bookmarks so index and By Tag tree look robust; hero Pinboard entry with 6+ tags and non-empty extended for This Page view. Side panel: open with ?screenshot=1&url=screenshotPopupUrl&title=screenshotPopupTitle so Bookmark tab shows Pinboard bookmark (same doc, PopupController reads window.location.search).
 * - Contract:
 *   - INPUT: ?screenshot=1&url=...&title=... (popup/side panel); seed JSON (local bookmarks, storage index, theme); optional --seed=path
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: popup/index/side panel rendered with placeholder data; data-screenshot-ready attribute; script can capture screenshot
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: PopupController._screenshotMode; handleGetCurrentBookmark prefers data.url when http(s); placeholderStorageSeed
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: MAIN
 *   - 1. localBookmarks: BUILD object keyed by URL; Pinboard entry HAS tags.length >= 6, extended non-empty, toread 'yes'; total entries >= 15; mix of toread yes/no; storageIndex one key per localBookmarks URL, value 'local'
 *   - How (sub-block): Await seed; open popup/index; wait for ready; check store-local for index; capture.
 *   - 2. Script: SEED chrome.storage.local/sync (await set); optional LOAD seed from file; OPEN popup or index; WAIT for [data-screenshot-ready="true"]; CHECK #store-local for index; CAPTURE screenshot
 *   - How (sub-block): Use URL params as fake tab; set data-screenshot-ready in finally.
 *   - 3. Popup load: IF screenshot=1 and url param: USE param as fake tab url/title; SKIP getCurrentTab; IN finally SET data-screenshot-ready on #mainInterface
 *   - How (sub-block): Prefer data.url as targetUrl when http(s) so popup-as-tab gets correct bookmark.
 *   - 4. handleGetCurrentBookmark: IF data.url present and http(s): USE as targetUrl so popup-as-tab gets bookmark for screenshot URL
 *   - 5. Side panel URL: GOTO side-panel.html?screenshot=1&url=encode(screenshotPopupUrl)&title=encode(screenshotPopupTitle); SET viewport width 360 (or 240); WAIT for tab content; CAPTURE screenshot (This Page, then By Tag, Tabs, etc.); output side-panel-bookmark.png, side-panel-tags-tree.png, side-panel-tabs.png
 *   - 6. record-demo-side-panel-this-page: SEED chrome.storage.local with placeholderStorageSeed via options page; GOTO side-panel.html?screenshot=1&url=...&title=...; record frames; assemble GIF
 *
 * === END IMPL-FULL-BLOCK: IMPL-SCREENSHOT_MODE ===
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
 * [IMPL-SUGGESTED_TAGS] [ARCH-SUGGESTED_TAGS] [REQ-SUGGESTED_TAGS_FROM_CONTENT] [REQ-SUGGESTED_TAGS_DEDUPLICATION] [REQ-SUGGESTED_TAGS_CASE_PRESERVATION] — Summary: Suggested tags from page — canonical source extraction, case-insensitive Current Tags conflict handling, and Suggested Tags-only case-converted render/action values.
 *
 * ## EXTRACT_SUGGESTED_TAGS
 *
 * - [IMPL-SUGGESTED_TAGS] [IMPL-THIS_PAGE_TAG_SORT] [ARCH-SUGGESTED_TAGS] [ARCH-THIS_PAGE_TAG_SORT] [REQ-SUGGESTED_TAGS_FROM_CONTENT] [REQ-SUGGESTED_TAGS_DEDUPLICATION] [REQ-SUGGESTED_TAGS_CASE_PRESERVATION] [REQ-THIS_PAGE_TAG_SORT] How: How — cross-IMPL: Popup path depends on IMPL-THIS_PAGE_TAG_SORT loadSuggestedTags; ordering invariant — executeScript file (snippet) then func (global extractor); shared data — raw canonical source-cased array from page world; post — NORMALIZE_SUGGESTED_ROWS then filters then Suggested Tags-only display/action conversion in UIManager; on error or non-scriptable URL (IMPL-POPUP_SESSION CLASSIFY_SCRIPT_INJECTION_URL: restricted_scheme / extensions_gallery / missing_url) — updateSuggestedTags([]) + injectionOutcome; no debugError for expected skips. How — composed_with IMPL-SELECTION_TO_TAG_INPUT: pre — Suggested Tags rendered in UIManager; post — selection/tag-input add flows attach to chip DOM per IMPL-SELECTION_TO_TAG_INPUT (shared surface only; no ordering constraint on extraction).
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
 * ## CLASSIFY_SIDE_PANEL_SUGGESTED_TAG_STATE
 *
 * - [IMPL-SUGGESTED_TAGS] [IMPL-THIS_PAGE_TAG_SORT] [ARCH-SUGGESTED_TAGS] [ARCH-THIS_PAGE_TAG_SORT] [REQ-SUGGESTED_TAGS_DEDUPLICATION] [REQ-SUGGESTED_TAGS_CASE_PRESERVATION] [REQ-THIS_PAGE_TAG_SORT] How: Sanitize the raw page suggestion, apply the active Suggested Tags label conversion, and classify the adjusted value against authoritative Current Tags for the side-panel This Page surface while leaving popup and overlay filtering behavior unchanged.
 * - Contract:
 *   - INPUT: suggestedTag string; comparisonTag string adjusted by Tag labels mode; currentTags array or tag string
 *   - PRE: suggestedTag is page-derived input; comparisonTag is the active display/action value; currentTags may contain source-cased persisted tags
 *   - OUTPUT: null for invalid input, otherwise `{ state: "absent" | "case-match" | "case-mismatch", suggestedTag: string, matchedTag: string | null }`; comparisonTag is an input-only adjusted value
 *   - POST: exact case matches between comparisonTag and Current Tags are classified as case-match; case-insensitive matches with different casing as case-mismatch; no case-insensitive match as absent
 *   - FAILURE_MODES: invalid or unsafe suggested tag
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: CLASSIFY_SIDE_PANEL_SUGGESTED_TAG_STATE
 *   - sanitizedSource = SANITIZE_SUGGESTED_TAG(suggestedTag); IF sanitizedSource is null THEN RETURN null
 *   - sanitizedComparison = SANITIZE_SUGGESTED_TAG(comparisonTag); IF sanitizedComparison is null THEN RETURN null
 *   - current = NORMALIZE_CURRENT_TAGS(currentTags) without changing persisted source casing
 *   - IF current contains sanitizedComparison with exact case THEN RETURN state case-match, suggestedTag sanitizedSource, matchedTag exact match
 *   - IF current contains a tag whose lower-case value equals sanitizedComparison lower-case value THEN RETURN state case-mismatch, suggestedTag sanitizedSource, matchedTag first case-insensitive match
 *   - RETURN state absent, suggestedTag sanitizedSource, matchedTag null
 *
 * ## REPLACE_SUGGESTED_TAG_IN_PLACE
 *
 * - [IMPL-SUGGESTED_TAGS] [IMPL-THIS_PAGE_TAG_SORT] [ARCH-SUGGESTED_TAGS] [ARCH-TAG_SYSTEM] [REQ-SUGGESTED_TAGS_DEDUPLICATION] [REQ-SUGGESTED_TAGS_CASE_PRESERVATION] How: Atomically replace the matched persisted tag with the clicked case-converted Suggested Tag value at the first matching position, remove duplicate case variants of that tag, and preserve every unrelated tag and its order.
 * - Contract:
 *   - INPUT: currentTags array; matchedTag string; replacementTag string
 *   - PRE: currentTags is the authoritative snapshot used for the save; replacementTag is page-derived and must pass suggested-tag sanitization
 *   - OUTPUT: `{ ok: boolean, tags: array, replacedTag?: string, reason?: string }`
 *   - POST: success changes only the matching case-insensitive tag group and preserves its first position; failure returns a copy with no mutation
 *   - FAILURE_MODES: invalid replacement, invalid tag collection, or no matching tag
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: REPLACE_SUGGESTED_TAG_IN_PLACE
 *   - original = shallow copy currentTags when currentTags is an array; otherwise RETURN `{ ok: false, tags: [], reason: invalid_tags }`
 *   - replacement = SANITIZE_SUGGESTED_TAG(replacementTag); IF replacement is null THEN RETURN `{ ok: false, tags: original, reason: invalid_replacement }`
 *   - matchKey = lower-case sanitized matchedTag; IF matchKey is empty THEN RETURN `{ ok: false, tags: original, reason: invalid_match }`
 *   - matchingIndexes = indexes of string tags whose trimmed lower-case value equals matchKey
 *   - IF matchingIndexes is empty THEN RETURN `{ ok: false, tags: original, reason: match_not_found }`
 *   - firstIndex = first matchingIndexes value
 *   - output = replace tag at firstIndex with replacement and omit all later matching indexes
 *   - RETURN `{ ok: true, tags: output, replacedTag: original[firstIndex] }`
 *
 * ## LOAD_SIDE_PANEL_SUGGESTED_TAGS
 *
 * - [IMPL-SUGGESTED_TAGS] [IMPL-THIS_PAGE_TAG_SORT] [IMPL-UIManager_SCOPED_ROOT] [ARCH-SUGGESTED_TAGS] [ARCH-THIS_PAGE_TAG_SORT] [REQ-SUGGESTED_TAGS_DEDUPLICATION] [REQ-SUGGESTED_TAGS_CASE_PRESERVATION] [REQ-THIS_PAGE_TAG_SORT] How: Add three-state metadata only for the scoped side-panel UI; preserve canonical source data for identity, apply the active case conversion before conflict classification, apply each state’s background, border, and visible text styling consistently in normal/hover/focus states, and preserve existing popup and overlay filtering/add flow.
 * - Contract:
 *   - INPUT: normalized suggested rows; current bookmark tags; UI surface; active Tag labels mode
 *   - PRE: rows have source-cased tag values; side-panel scope is observable from UIManager container; adjusted display/action values are derived from the active mode
 *   - OUTPUT: side-panel rows with absent, case-match, or case-mismatch state metadata; popup/overlay rows retain their existing shape and filtering
 *   - POST: side-panel absent rows route to add, exact matches route to remove, and mismatches route to replace; the clicked case-converted Suggested Tag value is the add/replace payload while the exact stored match remains the remove identity
 *   - FAILURE_MODES: script extraction failure, unavailable page, invalid row
 *   - EFFECTS: Async, IO, State, DOM
 *   - TERMINATION: total
 * - PROCEDURE: LOAD_SIDE_PANEL_SUGGESTED_TAGS
 *   - rows = NORMALIZE_SUGGESTED_ROWS(raw)
 *   - IF surface is side-panel THEN
 *     - adjusted = tagChipDisplayAndAddValue(row.tag, tagCaseFoldingMode).addValue
 *     - classified = MAP rows through CLASSIFY_SIDE_PANEL_SUGGESTED_TAG_STATE(row.tag, currentTags, adjusted)
 *     - DROP null classifications only
 *     - RETURN rows enriched with state and matchedTag
 *   - ELSE
 *     - FILTER rows using existing case-insensitive popup/overlay exclusion
 *     - RETURN rows unchanged
 *
 * ## PERSIST_SIDE_PANEL_SUGGESTED_TAG_ACTION
 *
 * - [IMPL-SUGGESTED_TAGS] [IMPL-THIS_PAGE_TAG_SORT] [ARCH-SUGGESTED_TAGS] [ARCH-TAG_SYSTEM] [REQ-SUGGESTED_TAGS_DEDUPLICATION] [REQ-SUGGESTED_TAGS_CASE_PRESERVATION] How: Route absent suggestions through the existing add action, exact adjusted-value matches through the existing stored-value removal action, and adjusted-value case-mismatch suggestions through one full-bookmark save using the clicked case-converted Suggested Tag value and REPLACE_SUGGESTED_TAG_IN_PLACE; update UI state only after persistence succeeds.
 * - Contract:
 *   - INPUT: action state; clicked case-converted Suggested Tag value; optional matchedTag; authoritative current bookmark
 *   - PRE: action originated from a rendered side-panel chip; save backend is available
 *   - OUTPUT: one persisted bookmark update and refreshed This Page state
 *   - POST: clicked case-converted Suggested Tag value is persisted; unrelated tags and order are preserved; failed save leaves local bookmark/UI state unchanged
 *   - FAILURE_MODES: invalid action, stale match, save rejection
 *   - EFFECTS: Async, IO, State, DOM
 *   - TERMINATION: total
 * - PROCEDURE: PERSIST_SIDE_PANEL_SUGGESTED_TAG_ACTION
 *   - IF state absent THEN DISPATCH existing add-tag flow with clicked case-converted Suggested Tag value; RETURN
 *   - IF state case-match THEN DISPATCH existing remove-tag flow with matchedTag; RETURN
 *   - IF state case-mismatch THEN
 *     - snapshot = READ authoritative current bookmark
 *     - replacement = REPLACE_SUGGESTED_TAG_IN_PLACE(snapshot.tags, matchedTag, clicked case-converted Suggested Tag value)
 *     - IF replacement.ok is false THEN REFRESH suggestions without saving; RETURN
 *     - AWAIT one full-bookmark save with replacement.tags
 *     - IF save fails THEN preserve snapshot/UI state and report failure
 *     - ELSE APPLY replacement.tags locally and REFRESH current/recent/suggested chips
 *
 * ## PRESERVE_SIDE_PANEL_SCROLL_DURING_SUGGESTED_TAG_ACTION
 *
 * - [IMPL-SUGGESTED_TAGS] [IMPL-UIManager_SCOPED_ROOT] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] How: Preserve the scoped This Page container scroll position across Suggested Tag loading, focus, persistence, and chip-redraw effects while leaving standalone popup behavior unchanged.
 * - Contract:
 *   - INPUT: isLoading boolean; optional scoped UIManager container
 *   - PRE: UIManager has applied its element cache; a scoped container, when present, is the This Page bookmark panel scroll container
 *   - OUTPUT: loading visibility and controls updated; scoped container scrollTop restored after a completed loading transition
 *   - POST: when a scoped container exists, the scrollTop captured before the outermost loading transition equals the scrollTop after loading ends, subject to the browser's current scroll range; when no container exists, popup behavior is unchanged
 *   - FAILURE_MODES: missing container, repeated loading transition, or unavailable scrollTop
 *   - DATA: savedScopedScrollTop (number or undefined); loadingTransitionActive (boolean)
 *   - DATA_TRANSITION: capture savedScopedScrollTop only when entering loading; do not overwrite it on repeated loading calls; clear it after restoring on exit
 *   - EFFECTS: DOM, State
 *   - TERMINATION: total
 * - PROCEDURE: SET_LOADING_WITH_SCOPED_SCROLL_RESTORE
 *   - IF isLoading AND NOT loadingTransitionActive AND container exists THEN save container.scrollTop
 *   - APPLY loading-state visibility and interactive-control disabled state
 *   - IF NOT isLoading AND loadingTransitionActive THEN
 *     - SHOW mainInterface
 *     - IF savedScopedScrollTop is a number THEN SET container.scrollTop = savedScopedScrollTop
 *     - CLEAR savedScopedScrollTop and loadingTransitionActive
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
 *   - How (sub-block): How — updateCurrentTags / updateRecentTags / _paintSuggestedTags: IF getEffectiveTagSortMode() null THEN paint source order; ELSE build Current/Recent rows with source-cased displayKey and Suggested rows with case-converted displayKey=tagChipDisplayAndAddValue; sortTagChipRows(mode); paint.
 *   - How (sub-block): How — Comparators (tag-chip-sort): alphabetical by displayKey localeCompare lower tie stableIndex; frequency by bookmarkFreq desc; relevance by relevance desc then bookmarkFreq then inPageFrequency.
 *   - How (sub-block): How — loadInitialData: AWAIT refreshTagFrequencyMapForSort before first updateCurrentTags; AWAIT loadRecentTags before AWAIT loadSuggestedTags (PopupController orchestration binding).
 *   - How (sub-block): How — setupEventListeners: click [data-sort-mode] under tagSortToggle -> setTagSortMode if isTagChipSortMode.
 *
 * ## SIDE_PANEL_SUGGESTED_TAG_CHIP_ACTIONS
 *
 * - [IMPL-THIS_PAGE_TAG_SORT] [IMPL-SUGGESTED_TAGS] [IMPL-UIManager_SCOPED_ROOT] [ARCH-THIS_PAGE_TAG_SORT] [ARCH-SUGGESTED_TAGS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [REQ-SUGGESTED_TAGS_DEDUPLICATION] [REQ-SUGGESTED_TAGS_CASE_PRESERVATION] How: Apply the active Tag labels conversion before comparing each scoped Suggested Tag with Current Tags; render absent, adjusted-value case-match, and adjusted-value case-mismatch suggestions as explicit accessible chips with distinct state styling and emit add/remove/replace actions without changing popup chip behavior.
 * - Contract:
 *   - INPUT: side-panel suggested rows `{ tag, state, matchedTag }`; active Tag labels mode
 *   - PRE: adjusted comparisonTag is derived from `tag` and the active mode; row state is absent, case-match, or case-mismatch; matchedTag is present for Current Tag states
 *   - OUTPUT: accessible chip with state metadata, distinct state styling, and the correct converted or stored action payload
 *   - POST: absent emits addSuggestedTag; case-match emits removeTag with matchedTag; case-mismatch emits replaceSuggestedTag; state meaning is available through color and non-color cues
 *   - FAILURE_MODES: malformed row or missing scoped container
 *   - EFFECTS: DOM, State
 *   - TERMINATION: total
 * - PROCEDURE: SIDE_PANEL_SUGGESTED_TAG_CHIP_ACTIONS
 *   - FOR each row:
 *     - adjusted = tagChipDisplayAndAddValue(row.tag, activeTagLabelsMode).addValue
 *     - state = CLASSIFY_SIDE_PANEL_SUGGESTED_TAG_STATE(row.tag, currentTags, adjusted)
 *     - IF state absent THEN render “Add” state label and emit addSuggestedTag({ tag: row.tag, state: absent })
 *     - IF state case-match THEN render “Remove” state label and emit removeTag(matchedTag)
 *     - IF state case-mismatch THEN render “Replace” state label and emit replaceSuggestedTag({ tag: row.tag, state: case-mismatch, matchedTag: row.matchedTag })
 *     - APPLY state-specific background and border styling while retaining an accessible text label
 *   - preserve row.tag canonical source casing for identity; use adjusted for classification, display, and add/replace payloads; use matchedTag for exact stored-value removal
 *   - WHEN active Tag labels mode changes THEN reclassify cached Suggested Tags against cached Current Tags before redraw
 *   - IF keyboard Enter or Space THEN emit the same action as click
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
 * === IMPL-FULL-BLOCK: IMPL-UI_TESTABILITY_HOOKS ===
 * [IMPL-UI_TESTABILITY_HOOKS] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION] [REQ-MODULE_VALIDATION] — setOnMessageProcessed, setOnAction, setOnStateChange so tests assert without DOM. Contract: callbacks set by tests; message/action/state trigger callbacks.
 *
 * ## MAIN
 *
 * - [IMPL-UI_TESTABILITY_HOOKS] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION] [REQ-MODULE_VALIDATION] How: Logical block for IMPL-UI_TESTABILITY_HOOKS.
 * - Contract:
 *   - INPUT: optional callback fn (set by tests); message (processMessage); popup/overlay action or state change
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: test can assert on message payload, action id, state without DOM
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: MessageHandler._onMessageProcessed; PopupController._onAction, _onStateChange; OverlayManager._onStateChange
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: MAIN
 *   - How (sub-block): After processMessage invoke callback with msg/result.
 *   - 1. MessageHandler: AFTER processMessage(msg): IF _onMessageProcessed: CALL with msg/result
 *   - How (sub-block): On action/state change invoke callbacks.
 *   - 2. PopupController: ON action: IF _onAction: CALL with actionId; ON state change: IF _onStateChange: CALL with state
 *   - 3. OverlayManager: ON visibility/content change: IF _onStateChange: CALL with { visible, contentSnapshot }
 *   - How (sub-block): Set callbacks, trigger, assert args.
 *   - 4. Tests: SET callbacks; TRIGGER message/action; ASSERT callback invoked with expected args
 *
 * === END IMPL-FULL-BLOCK: IMPL-UI_TESTABILITY_HOOKS ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-DEBUG_PANEL ===
 * [IMPL-DEBUG_PANEL] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION] — Debug logging by category and debug panel showing last actions, messages, and current bookmark/backend. Contract: inputs, outputs, and data for logging and panel.
 *
 * ## MAIN
 *
 * - [IMPL-DEBUG_PANEL] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION] How: Logical block for IMPL-DEBUG_PANEL.
 * - Contract:
 *   - INPUT: LOG_CATEGORIES (ui, message, overlay, storage); optional debug panel open
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: debugLogger.trace/debug in message-handler, PopupController, content-main; debug panel shows last actions, last messages, current bookmark/tags/backend
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: debug-logger.js; debug.html + debug.js; inspector ring buffers
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: MAIN
 *   - How (sub-block): Logging: emit trace/debug when category enabled.
 *   - 1. Logging: WHEN category enabled: debugLogger.trace(msg) or debugLogger.debug(msg) with category
 *   - How (sub-block): Debug panel: on load request last actions/messages/current bookmark and render.
 *   - 2. Debug panel (debug.html): ON load SEND DEV_COMMAND getLastActions/getLastMessages/getCurrentBookmark (or getStorageSnapshot); RENDER in panel
 *
 * === END IMPL-FULL-BLOCK: IMPL-DEBUG_PANEL ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-THEME ===
 * [IMPL-THEME] [ARCH-THEME] [REQ-DARK_THEME] — How: default dark theme with user toggle; persist preference and apply to popup/overlay CSS.
 *
 * ## APPLY_THEME
 *
 * - [IMPL-THEME] [ARCH-THEME] [REQ-DARK_THEME] How: on UI bootstrap load preference (default dark); apply; on toggle persist and re-apply.
 * - Contract:
 *   - INPUT: theme preference from ConfigManager; UI theme toggle events
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: data-theme / CSS class applied on popup and overlay; persisted preference
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: ConfigManager theme keys; popup.css; overlay-styles.css; dark-theme-default tests
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: APPLY_THEME
 *   - pref = AWAIT configManager.getTheme() OR "dark"
 *   - SET root dataset/class to pref
 *   - RETURN pref
 *
 * ## TOGGLE_THEME
 *
 * - [IMPL-THEME] [ARCH-THEME] [REQ-DARK_THEME] How: Implements TOGGLE_THEME(root) behavior for IMPL-THEME.
 * - Contract:
 *   - INPUT: theme preference from ConfigManager; UI theme toggle events
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: data-theme / CSS class applied on popup and overlay; persisted preference
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: ConfigManager theme keys; popup.css; overlay-styles.css; dark-theme-default tests
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: TOGGLE_THEME
 *   - next = opposite of APPLY_THEME(root)
 *   - AWAIT configManager.setTheme(next)
 *   - APPLY_THEME(root)
 *   - RETURN next
 *
 * === END IMPL-FULL-BLOCK: IMPL-THEME ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-UX_CORE ===
 * [IMPL-UX_CORE] [ARCH-UX_CORE] [REQ-CORE_UX_PRESERVATION] [REQ-POPUP_PERSISTENT_SESSION] — How: preserve multi-action popup/overlay workflows; popup session stays open across successive actions.
 *
 * ## HANDLE_POPUP_ACTION
 *
 * - [IMPL-UX_CORE] [ARCH-UX_CORE] [REQ-POPUP_PERSISTENT_SESSION] How: after action success, refresh live data in place instead of closing the popup.
 * - Contract:
 *   - INPUT: popup/overlay user actions (save, tag, toggle, refresh); session lifecycle events
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: UI remains usable for chained actions; no forced auto-close after success; core overlay/popup behaviors retained | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: PopupController; UIManager; overlay-manager; ARCH-POPUP_SESSION / IMPL-POPUP_SESSION composition
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: HANDLE_POPUP_ACTION
 *   - result = AWAIT dispatch(action)
 *   - IF result.ok: REFRESH_POPUP_STATE(); KEEP popup open
 *   - ELSE: SHOW error; KEEP popup open
 *   - RETURN result
 *   - How (sub-block): How: overlay continues to support close/refresh/tag without regressing core show/hide UX.
 *
 * ## PRESERVE_OVERLAY_CORE
 *
 * - [IMPL-UX_CORE] [ARCH-UX_CORE] [REQ-CORE_UX_PRESERVATION] [REQ-POPUP_PERSISTENT_SESSION] How: Implements PRESERVE_OVERLAY_CORE behavior for IMPL-UX_CORE.
 * - Contract:
 *   - INPUT: popup/overlay user actions (save, tag, toggle, refresh); session lifecycle events
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: UI remains usable for chained actions; no forced auto-close after success; core overlay/popup behaviors retained
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: PopupController; UIManager; overlay-manager; ARCH-POPUP_SESSION / IMPL-POPUP_SESSION composition
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: PRESERVE_OVERLAY_CORE
 *   - SHOW/HIDE overlay per config and site policy
 *   - RETAIN close and refresh controls (IMPL-OVERLAY_CONTROLS)
 *   - RETURN
 *
 * === END IMPL-FULL-BLOCK: IMPL-UX_CORE ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-PRIVACY ===
 * [IMPL-PRIVACY] [ARCH-PRIVACY] [REQ-PRIVACY_CONTROLS] — How: honor private/shared bookmark flags and site inhibition so sensitive URLs and private pins stay under user control.
 *
 * ## APPLY_PRIVACY_CONTROLS
 *
 * - [IMPL-PRIVACY] [ARCH-PRIVACY] [REQ-PRIVACY_CONTROLS] How: before injecting page UI, check inhibit rules; before save, map private UI to API shared=no.
 * - Contract:
 *   - INPUT: bookmark shared/toread/private flags; inhibit URL lists from ConfigManager; site management rules
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: Pinboard/local payloads with correct shared flag; overlay/popup suppressed on inhibited URLs
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: ConfigManager hoverboard_settings; IMPL-URL_INHIBITION; Pinboard API shared field
 *   - EFFECTS: Http, IO
 *   - TERMINATION: total
 * - PROCEDURE: APPLY_PRIVACY_CONTROLS
 *   - IF isUrlInhibited(url): SUPPRESS overlay/hover; RETURN blocked
 *   - draft.shared = NOT draft.private
 *   - RETURN draft ready for SAVE_BOOKMARK
 *
 * === END IMPL-FULL-BLOCK: IMPL-PRIVACY ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-POPUP_THEME_CSS ===
 * [IMPL-POPUP_THEME_CSS] [ARCH-THEME] [REQ-DARK_THEME] — :root.hb-theme-dark block in popup.css so ThemeManager dark applies to popup. Contract: root and ThemeManager vars; popup uses dark/light vars.
 *
 * ## MAIN
 *
 * - [IMPL-POPUP_THEME_CSS] [ARCH-THEME] [REQ-DARK_THEME] How: Logical block for IMPL-POPUP_THEME_CSS.
 * - Contract:
 *   - INPUT: document.documentElement (root); ThemeManager sets hb-theme-dark and --hb-* vars
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: popup body uses dark background/text when theme is dark (same vars as prefers-color-scheme block)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: popup.css :root.hb-theme-dark { --bg-primary: #1e1e1e; --text-primary: ...; ... }
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: MAIN
 *   - How (sub-block): Prefer hb-theme-dark, else prefers-color-scheme, else light; elements use --bg-primary etc.
 *   - 1. Style resolution:
 *   - 2.   IF root has class hb-theme-dark: APPLY :root.hb-theme-dark variables to popup
 *   - 3.   ELSE IF prefers-color-scheme dark: APPLY @media (prefers-color-scheme: dark) variables
 *   - 4.   ELSE: APPLY light variables
 *   - 5. Popup elements USE --bg-primary, --text-primary, etc. from resolved rule
 *
 * === END IMPL-FULL-BLOCK: IMPL-POPUP_THEME_CSS ===
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
import { UIManager } from './UIManager.js'
import { StateManager } from './StateManager.js'
import { ErrorHandler } from '../../shared/ErrorHandler.js'
import { debugLog, debugError, debugWarn, normalizeSelectionForTagInput } from '../../shared/utils.js'
import {
  classifyScriptInjectionUrl,
  classifyScriptInjectionError
} from '../../shared/script-injection-eligibility.js'
import { ConfigManager } from '../../config/config-manager.js'
// [IMPL-UI_INSPECTOR] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION]
import { recordAction } from '../../shared/ui-inspector.js'
import {
  isMissingMessageResponse,
  unwrapMessageResponse
} from '../../shared/message-response.js'
import { POPUP_ACTION_IDS, MESSAGE_TYPES } from '../../shared/ui-action-contract.js'
import { splitAiTagsBySession } from '../../features/ai/ai-tagging-popup-utils.js'
import { testAiApiKey } from '../../features/ai/ai-api-test.js'
import { formatTimeAge } from '../bookmarks-table/bookmarks-table-time.js'
import {
  buildBookmarkNotesSavePayload,
  bookmarkDetailsUnchanged,
  notesEditableForBackend
} from '../../shared/bookmark-notes-ui.js'
import {
  isLinkHealthChecksEnabled,
  formatLinkHealthHint
} from '../../shared/link-health.js'
import {
  EMPTY_ARCHIVE_ARTIFACT_STATUS,
  isArchiveCapableBackend,
  normalizeArchiveArtifactStatus
} from './archive-status.js'
import {
  classifySuggestedTagState,
  replaceTagInPlace,
  sanitizeSuggestedTag,
  SUGGESTED_TAG_STATES
} from '../../shared/suggested-tag-state.js'
import { tagChipDisplayAndAddValue } from '../../shared/tag-case-folding.js'

/** [REQ-SUGGESTED_TAGS_FROM_CONTENT] [REQ-THIS_PAGE_TAG_SORT] Extension-root path for scripting.executeScript files */
const SUGGESTED_TAGS_MAIN_WORLD_FILE = 'src/features/tagging/suggested-tags-main-world-snippet.js'
const SAVE_TO_BACKENDS = ['pinboard', 'local', 'file', 'sync', 'browser']
const READ_LATER_METADATA_BACKENDS = SAVE_TO_BACKENDS.filter(backend => backend !== 'browser')

export class PopupController {
  constructor (dependencies = {}) {
    // [IMPL-MODULE_VALIDATION] [ARCH-MODULE_VALIDATION] [REQ-MODULE_VALIDATION] Proper dependency injection with fallback creation
    this.errorHandler = dependencies.errorHandler || new ErrorHandler()
    this.stateManager = dependencies.stateManager || new StateManager()
    this.configManager = dependencies.configManager || new ConfigManager()

    // [IMPL-MODULE_VALIDATION] [ARCH-MODULE_VALIDATION] [REQ-MODULE_VALIDATION] UIManager with proper dependency injection
    this.uiManager = dependencies.uiManager || new UIManager({
      errorHandler: this.errorHandler,
      stateManager: this.stateManager,
      config: {}
    })

    this.currentTab = null
    this.currentPin = null
    this.isInitialized = false
    this.isLoading = false
    // [IMPL-PAGE_ARCHIVE_STATUS_UI] [ARCH-PAGE_ARCHIVE_STATUS_UI] [REQ-PAGE_ARCHIVE_STATUS_UI]
    // Keep artifact state separate from bookmark metadata so context changes can fail closed.
    this._archiveArtifactStatus = { ...EMPTY_ARCHIVE_ARTIFACT_STATUS }
    this._archiveStatusContextKey = ''
    // [IMPL-UI_TESTABILITY_HOOKS] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION] Optional test hooks
    this._onAction = null
    this._onStateChange = null

    // [IMPL-POPUP_MESSAGE_TIMEOUT] Preserve predictable refresh behavior in tests and runtime
    const isTestEnv = typeof process !== 'undefined' && process?.env?.JEST_WORKER_ID
    this.tabMessageTimeoutMs = dependencies.tabMessageTimeoutMs ?? (isTestEnv ? 100 : 2000)

    // Bind methods
    this.loadInitialData = this.loadInitialData.bind(this)
    this.handleShowHoverboard = this.handleShowHoverboard.bind(this)
    this.handleTogglePrivate = this.handleTogglePrivate.bind(this)
    this.handleReadLater = this.handleReadLater.bind(this)
    this.handleAddTag = this.handleAddTag.bind(this)
    this.handleReplaceSuggestedTag = this.handleReplaceSuggestedTag.bind(this)
    this.handleRemoveTag = this.handleRemoveTag.bind(this)
    this.handleSearch = this.handleSearch.bind(this)
    this.handleDeletePin = this.handleDeletePin.bind(this)
    this.handleReloadExtension = this.handleReloadExtension.bind(this)
    this.handleOpenOptions = this.handleOpenOptions.bind(this)
    this.handleOpenBookmarksIndex = this.handleOpenBookmarksIndex.bind(this)
    this.handleOpenBrowserBookmarkImport = this.handleOpenBrowserBookmarkImport.bind(this)
    this.handleStorageBackendChange = this.handleStorageBackendChange.bind(this)
    this.handleSaveBookmarkDetails = this.handleSaveBookmarkDetails.bind(this)
    this.handleLibrarySearch = this.handleLibrarySearch.bind(this)
    // [IMPL-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE]
    this.handleCapturePageArchive = this.handleCapturePageArchive.bind(this)
    // [REQ-PAGE_SCREENSHOT_ARCHIVE] [ARCH-PAGE_SCREENSHOT_ARCHIVE] [IMPL-PAGE_SCREENSHOT_ARCHIVE]
    this.handleCapturePageScreenshot = this.handleCapturePageScreenshot.bind(this)
    // [REQ-OFFLINE_READER_MODE] [ARCH-OFFLINE_READER_MODE] [IMPL-OFFLINE_READER_MODE]
    this.handleOpenOfflineReader = this.handleOpenOfflineReader.bind(this)
    this.handleTagWithAi = this.handleTagWithAi.bind(this)
    this.handleTestAiApiKey = this.handleTestAiApiKey.bind(this)
    this.handleOpenTagsTree = this.handleOpenTagsTree.bind(this)
    this.normalizeTags = this.normalizeTags.bind(this)

    this.setupEventListeners()

    // [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Setup refresh mechanisms
    this.setupAutoRefresh()
    this.setupRealTimeUpdates()

    // [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] Listen for BOOKMARK_UPDATED to refresh popup data.
    // [ARCH-MESSAGE_HANDLING] Observer listener: synchronous and returns undefined, so it never answers
    // messages meant for the service worker (a promise return would reply null to the sender).
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message?.type !== 'BOOKMARK_UPDATED') return
        this.applyExternalBookmarkUpdate().catch(error => {
          debugError('[IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] Detached applyExternalBookmarkUpdate failed:', error)
        })
      })
    }
    debugLog('[IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING] [REQ-EXTENSION_IDENTITY] PopupController constructor called', { platform: navigator.userAgent })
    // Platform detection
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      debugLog('[IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING] [REQ-EXTENSION_IDENTITY] Detected Chrome runtime in PopupController')
    } else if (typeof browser !== 'undefined' && browser.runtime) {
      debugLog('[IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING] [REQ-EXTENSION_IDENTITY] Detected browser polyfill runtime in PopupController')
    } else {
      debugError('[IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING] [REQ-EXTENSION_IDENTITY] No recognized extension runtime detected in PopupController')
    }
    // Check utils.js access
    if (!debugLog || !debugError) {
      console.error('[IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING] [REQ-EXTENSION_IDENTITY] utils.js functions missing in PopupController')
    }
  }

  /**
   * Normalize tags to array format regardless of input type
   */
  normalizeTags (tags) {
    if (!tags) {
      return []
    }

    if (typeof tags === 'string') {
      // If tags is a string, split by spaces and filter out empty strings
      return tags.split(' ').filter(tag => tag.trim())
    } else if (Array.isArray(tags)) {
      // If tags is already an array, filter out empty or non-string values
      return tags.filter(tag => tag && typeof tag === 'string' && tag.trim())
    }

    // For any other type, return empty array
    return []
  }

  /**
   * Setup event listeners for popup actions
   */
  setupEventListeners () {
    // Action buttons
    this.uiManager.on('showHoverboard', this.handleShowHoverboard)
    this.uiManager.on('togglePrivate', this.handleTogglePrivate)
    this.uiManager.on('readLater', this.handleReadLater)
    this.uiManager.on('addTag', this.handleAddTag)
    this.uiManager.on('addSuggestedTag', ({ tag } = {}) => this.handleAddTag(tag))
    this.uiManager.on('replaceSuggestedTag', this.handleReplaceSuggestedTag)
    this.uiManager.on('removeTag', this.handleRemoveTag)
    this.uiManager.on('search', this.handleSearch)

    this.uiManager.on('deletePin', this.handleDeletePin)
    this.uiManager.on('reloadExtension', this.handleReloadExtension)
    this.uiManager.on('openOptions', this.handleOpenOptions)
    this.uiManager.on('openBookmarksIndex', this.handleOpenBookmarksIndex)
    this.uiManager.on('openBrowserBookmarkImport', this.handleOpenBrowserBookmarkImport)
    this.uiManager.on('openTagsTree', this.handleOpenTagsTree)
    this.uiManager.on('tagWithAi', this.handleTagWithAi)
    this.uiManager.on('testAiApiKey', this.handleTestAiApiKey)

    // [IMPL-MOVE_BOOKMARK_UI] [ARCH-MOVE_BOOKMARK_UI] [REQ-MOVE_BOOKMARK_STORAGE_UI] [REQ-STORAGE_MODE_DEFAULT] Storage backend change (move bookmark)
    this.uiManager.on('storageBackendChange', this.handleStorageBackendChange)
    // [REQ-BOOKMARK_NOTES_UI] [ARCH-BOOKMARK_NOTES_UI] [IMPL-BOOKMARK_NOTES_UI]
    this.uiManager.on('saveBookmarkDetails', this.handleSaveBookmarkDetails)
    // [REQ-LIBRARY_SEARCH_ENTRY] [IMPL-LIBRARY_SEARCH_ENTRY]
    this.uiManager.on('librarySearch', this.handleLibrarySearch)
    this.uiManager.on('capturePageArchive', this.handleCapturePageArchive)
    this.uiManager.on('capturePageScreenshot', this.handleCapturePageScreenshot)
    this.uiManager.on('openOfflineReader', this.handleOpenOfflineReader)
    // [REQ-MOVE_BOOKMARK_STORAGE_UI] Legacy storageLocalToggle event (unused in five-button Save to UI); keep wired to same move handler
    this.uiManager.on('storageLocalToggle', (targetBackend) => this.handleStorageBackendChange(targetBackend))

    // [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Add refresh event handler
    this.uiManager.on('refreshData', this.refreshPopupData.bind(this))
    // [REQ-POPUP_PERSISTENT_SESSION] [ARCH-POPUP_SESSION] [IMPL-POPUP_SESSION] Retry initial popup loading when the error-state Retry control is used.
    this.uiManager.on('retry', this.loadInitialData)

    // [IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] - Add checkbox event handler binding
    this.uiManager.on('showHoverOnPageLoadChange', this.handleShowHoverOnPageLoadChange.bind(this))
  }

  /**
   * [IMPL-UI_TESTABILITY_HOOKS] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION] [REQ-MODULE_VALIDATION] Set optional callback for UI actions (for tests).
   */
  setOnAction (fn) {
    this._onAction = typeof fn === 'function' ? fn : null
  }

  /**
   * [IMPL-UI_TESTABILITY_HOOKS] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION] [REQ-MODULE_VALIDATION] Set optional callback for state/screen changes (for tests).
   */
  setOnStateChange (fn) {
    this._onStateChange = typeof fn === 'function' ? fn : null
  }

  /**
   * Load initial data when popup opens
   * [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Enhanced data flow validation
   */
  async loadInitialData () {
    debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] loadInitialData: start')
    try {
      this.setLoading(true)

      // [IMPL-SCREENSHOT_MODE] [REQ-LOCAL_BOOKMARKS_INDEX] Screenshot/demo mode: use fake current tab from URL params so
      // screenshot scripts can open popup as tab and show bookmark data for a specific URL.
      const params = typeof window !== 'undefined' && window.location && window.location.search
        ? new URLSearchParams(window.location.search)
        : null
      const screenshotMode = params && params.get('screenshot') === '1'
      this._screenshotMode = !!screenshotMode
      const screenshotUrl = params && params.get('url')
      const screenshotTitle = params && params.get('title')
      if (screenshotMode && screenshotUrl) {
        const decodedUrl = decodeURIComponent(screenshotUrl)
        const decodedTitle = screenshotTitle ? decodeURIComponent(screenshotTitle) : ''
        this.currentTab = { url: decodedUrl, title: decodedTitle }
        debugLog('[IMPL-SCREENSHOT_MODE] loadInitialData: using fake tab from params', this.currentTab)
      } else {
        // Get current tab information
        debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] loadInitialData: calling getCurrentTab')
        this.currentTab = await this.getCurrentTab()
        debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] loadInitialData: got currentTab', this.currentTab)
      }
      if (!this.currentTab) {
        throw new Error('Unable to get current tab information')
      }

      // Update state with tab info
      this.stateManager.setState({
        currentTab: this.currentTab,
        url: this.currentTab.url,
        title: this.currentTab.title
      })

      // [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Get and validate bookmark data
      debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] loadInitialData: calling getBookmarkData', this.currentTab.url)
      this.currentPin = await this.getBookmarkData(this.currentTab.url)
      debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] loadInitialData: got currentPin', this.currentPin)

      // [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Handle both bookmarked and non-bookmarked sites
      if (!this.currentPin) {
        debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] loadInitialData: No bookmark data, creating empty bookmark for current site')
        this.currentPin = {
          url: this.currentTab.url,
          description: this.currentTab.title || '',
          tags: [],
          shared: 'yes',
          toread: 'no',
          time: '',
          updated_at: '',
          extended: '',
          hash: ''
        }
        // [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Log the created empty bookmark for test compatibility
        debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] loadInitialData: created empty bookmark', this.currentPin)
      }

      this.stateManager.setState({ currentPin: this.currentPin })

      // [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Enhanced debug logging for bookmark data
      debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] loadInitialData: bookmark data validation:', {
        hasBookmark: !!this.currentPin,
        url: this.currentPin?.url,
        description: this.currentPin?.description,
        tagCount: this.currentPin?.tags?.length || 0,
        isPrivate: this.currentPin?.shared === 'no',
        isReadLater: this.currentPin?.toread === 'yes'
      })

      // [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Process and validate tags
      const normalizedTags = this.normalizeTags(this.currentPin?.tags)
      debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] loadInitialData: tags processing:', {
        originalTags: this.currentPin?.tags,
        originalTagsType: typeof this.currentPin?.tags,
        normalizedTags,
        normalizedTagsLength: normalizedTags.length,
        normalizedTagsIsArray: Array.isArray(normalizedTags)
      })
      // [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Update UI with validated data
      debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] loadInitialData: calling updateCurrentTags with:', normalizedTags)
      // [REQ-THIS_PAGE_TAG_SORT] Bookmark tag counts for This Page frequency sort (side panel)
      await this.refreshTagFrequencyMapForSort()
      this.uiManager.updateCurrentTags(normalizedTags)
      this.uiManager.updateConnectionStatus(true)
      this.uiManager.updatePrivateStatus(this.currentPin?.shared === 'no')

      // Check if current bookmark has read later status
      const hasReadLaterStatus = this.currentPin?.toread === 'yes'
      this.uiManager.updateReadLaterStatus(hasReadLaterStatus)

      // Load recent tags
      await this.loadRecentTags()

      // [REQ-SUGGESTED_TAGS_FROM_CONTENT] [IMPL-SUGGESTED_TAGS] - Load suggested tags from page content
      await this.loadSuggestedTags()

      // [IMPL-SCREENSHOT_MODE] [REQ-SUGGESTED_TAGS_FROM_CONTENT] In screenshot/demo mode, overlay demo suggested tags from storage so Suggested Tags section is visible.
      if (this._screenshotMode) {
        await this.loadDemoSuggestedTagsIfScreenshotMode()
      }

      // [IMPL-SELECTION_TO_TAG_INPUT] [ARCH-SELECTION_TO_TAG_INPUT] [REQ-SELECTION_TO_TAG_INPUT] [REQ-TAG_MANAGEMENT] Prefill tag input from page selection (≤8 words)
      try {
        const selectionResponse = await this.sendToTab({ type: 'GET_PAGE_SELECTION' })
        const data = selectionResponse?.data ?? selectionResponse
        const raw = data?.selection
        if (raw && typeof raw === 'string') {
          const normalized = normalizeSelectionForTagInput(raw, 8)
          if (normalized) this.uiManager.setTagInputValue(normalized)
        }
      } catch (_) {
        // Content script not injected or no selection: leave tag input unchanged
      }

      // [IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] - Load checkbox state
      await this.loadShowHoverOnPageLoadSetting()

      // Set version info
      const manifest = chrome.runtime.getManifest()
      this.uiManager.updateVersionInfo(manifest.version)

      // [REQ-MOVE_BOOKMARK_STORAGE_UI] [IMPL-MOVE_BOOKMARK_UI] [REQ-STORAGE_MODE_DEFAULT] When not bookmarked: show default storage (ARCH).
      const hasRealBookmark = !!(this.currentPin?.time)
      const validBackends = ['pinboard', 'local', 'file', 'sync', 'browser']
      let storageBackend
      if (!hasRealBookmark) {
        storageBackend = await this.configManager.getStorageMode()
      } else {
        storageBackend = await this.getStorageBackendForUrl(this.currentTab?.url)
      }
      const backend = validBackends.includes(storageBackend) ? storageBackend : (await this.configManager.getStorageMode()) || 'local'
      this.uiManager.updateStorageBackendValue(backend)
      // [REQ-BOOKMARK_NOTES_UI] [ARCH-BOOKMARK_NOTES_UI] [IMPL-BOOKMARK_NOTES_UI] Sync Title/Notes; disable notes for browser
      this._resolvedStorageBackend = backend
      // [IMPL-PAGE_ARCHIVE_STATUS_UI] [ARCH-PAGE_ARCHIVE_STATUS_UI] [REQ-PAGE_ARCHIVE_STATUS_UI]
      // Query persisted artifact state only after the selected backend is resolved.
      this.refreshArchiveArtifactStatus({
        url: this.currentTab?.url,
        backend,
        force: true
      }).catch(error => {
        debugError('[IMPL-PAGE_ARCHIVE_STATUS_UI] Initial artifact status refresh failed:', error)
      })
      this.uiManager.syncBookmarkNotesFields(this.currentPin, backend)
      this.uiManager.updateStorageLocalToggle(backend, hasRealBookmark)
      // [REQ-MOVE_BOOKMARK_STORAGE_UI] Disable Pinboard storage option when no API token configured
      const token = await this.configManager.getAuthToken()
      this.uiManager.updateStoragePinboardEnabled(!!(token && token.trim()))

      // [IMPL-AI_TAGGING_POPUP_UI] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] Enable Tag with AI only when API key set and tab is http(s).
      const config = await this.configManager.getConfig()
      const aiApiKey = (config?.aiApiKey || '').trim()
      const tabUrl = (this.currentTab?.url || '').trim()
      const urlOk = tabUrl.startsWith('http://') || tabUrl.startsWith('https://')
      const tagWithAiBtn = this.uiManager.elements.tagWithAiBtn
      if (tagWithAiBtn) tagWithAiBtn.disabled = !aiApiKey || !urlOk

      // [REQ-BOOKMARK_USAGE_TRACKING] [ARCH-BOOKMARK_USAGE_TRACKING_UI] [IMPL-BOOKMARK_USAGE_TRACKING_UI] This Page inline usage section
      await this.refreshUsageSection()

      // [REQ-LINK_HEALTH] [IMPL-LINK_HEALTH] Compact This Page/popup hint when opt-in and stored record exist
      await this.refreshLinkHealthHint()

      // Mark as initialized
      this.isInitialized = true
      debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Popup initialization completed successfully')
      if (this._onStateChange) {
        this._onStateChange({ screen: 'mainInterface', state: { bookmark: this.currentPin } })
      }
    } catch (error) {
      debugError('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Failed to load initial data:', error)
      if (this._onStateChange) this._onStateChange({ screen: 'error', state: {} })
      if (this.errorHandler) {
        this.errorHandler.handleError('Failed to load initial data', error)
      }
      this.uiManager.updateConnectionStatus(false)
      // Re-throw the error so it can be caught by the calling method
      throw error
    } finally {
      this.setLoading(false)
      // [IMPL-SCREENSHOT_MODE] [REQ-LOCAL_BOOKMARKS_INDEX] Signal to screenshot script that content is ready (enables wait-for-content).
      if (this._screenshotMode && this.uiManager?.elements?.mainInterface) {
        this.uiManager.elements.mainInterface.setAttribute('data-screenshot-ready', 'true')
      }
    }
  }

  /**
   * [IMPL-SCREENSHOT_MODE] [REQ-RECENT_TAGS_SYSTEM] In screenshot/demo mode, read hoverboard_demo_recent_tags from storage and call updateRecentTags (excluding current bookmark tags). Returns true if demo tags were applied, false otherwise.
   */
  async loadDemoRecentTagsIfScreenshotMode () {
    return new Promise((resolve) => {
      if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local || typeof chrome.storage.local.get !== 'function') {
        resolve(false)
        return
      }
      chrome.storage.local.get('hoverboard_demo_recent_tags', (result) => {
        const tags = result && result.hoverboard_demo_recent_tags
        if (!Array.isArray(tags) || tags.length === 0) {
          resolve(false)
          return
        }
        const currentTags = this.normalizeTags(this.currentPin?.tags || [])
        const filtered = tags.filter(tag => !currentTags.includes(tag))
        this.uiManager.updateRecentTags(filtered)
        resolve(true)
      })
    })
  }

  /**
   * [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] - Load user-driven recent tags from shared memory
   * Excludes tags already assigned to the current site
   */
  async loadRecentTags () {
    try {
      debugLog('[POPUP-CONTROLLER] [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] Loading user-driven recent tags')

      // [IMPL-SCREENSHOT_MODE] [REQ-RECENT_TAGS_SYSTEM] In screenshot/demo mode use seeded demo recent tags so Recent Tags section is visible.
      if (this._screenshotMode) {
        const applied = await this.loadDemoRecentTagsIfScreenshotMode()
        if (applied) return
      }

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] - Get current tags to exclude from recent tags
      const currentTags = this.normalizeTags(this.currentPin?.tags || [])
      debugLog('[POPUP-CONTROLLER] [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] Current tags to exclude:', currentTags)

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] - Get user recent tags excluding current site
      const response = await this.sendMessage({
        type: 'getRecentBookmarks',
        data: {
          currentTags, // Pass current tags for exclusion
          senderUrl: this.currentTab?.url
        }
      })

      debugLog('[POPUP-CONTROLLER] [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] Recent bookmarks response received:', response)

      if (response && response.recentTags) {
        debugLog('[POPUP-CONTROLLER] [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] Recent tags from response:', response.recentTags)

        // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] - Extract tag names from recent tags data
        // Handle both string arrays and object arrays
        const recentTagNames = response.recentTags.map(tag => {
          if (typeof tag === 'string') {
            return tag
          } else if (tag && typeof tag === 'object' && tag.name) {
            return tag.name
          } else {
            return String(tag)
          }
        })

        debugLog('[POPUP-CONTROLLER] [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] Extracted recent tag names:', recentTagNames)

        // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] - Tags are already filtered by the service, but double-check
        const filteredRecentTags = recentTagNames.filter(tag =>
          !currentTags.includes(tag)
        )

        debugLog('[POPUP-CONTROLLER] [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] Final filtered recent tags:', filteredRecentTags)

        this.uiManager.updateRecentTags(filteredRecentTags)
      } else {
        debugLog('[POPUP-CONTROLLER] [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] No recent tags in response, updating with empty array')
        this.uiManager.updateRecentTags([])
      }
    } catch (error) {
      debugError('[POPUP-CONTROLLER] [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] Failed to load recent tags:', error)
      this.uiManager.updateRecentTags([])
    }
  }

  /**
   * [IMPL-THIS_PAGE_TAG_SORT] [ARCH-THIS_PAGE_TAG_SORT] [REQ-THIS_PAGE_TAG_SORT]
   * Coerce chrome.storage hoverboard_tag_frequency payload to a plain object map (tag → count); arrays / primitives / null → {}.
   */
  _normalizeHoverboardTagFrequencyMap (raw) {
    return raw != null && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}
  }

  /**
   * [ARCH-SUGGESTED_TAGS] [ARCH-THIS_PAGE_TAG_SORT] [IMPL-SUGGESTED_TAGS] [IMPL-THIS_PAGE_TAG_SORT] [REQ-SUGGESTED_TAGS_FROM_CONTENT] [REQ-THIS_PAGE_TAG_SORT]
   * NORMALIZE_SUGGESTED_ROWS + FILTER_INVALID_ROWS: map MAIN-world extract array to row objects; trim `tag`; omit empty-after-trim (matches IMPL-THIS_PAGE_TAG_SORT essence_pseudocode + unit test token set).
   */
  _normalizeSuggestedRowsFromMainWorld (raw) {
    if (!Array.isArray(raw)) return []
    return raw
      .map((entry) => {
        if (typeof entry === 'string') {
          const tag = entry.trim()
          if (!tag) return null
          return { tag, relevance: 0, inPageFrequency: 0 }
        }
        if (entry && typeof entry === 'object' && typeof entry.tag === 'string') {
          const tag = entry.tag.trim()
          if (!tag) return null
          return {
            tag,
            relevance: typeof entry.relevance === 'number' ? entry.relevance : 0,
            inPageFrequency: typeof entry.inPageFrequency === 'number' ? entry.inPageFrequency : 0
          }
        }
        return null
      })
      .filter(Boolean)
  }

  /**
   * [IMPL-THIS_PAGE_TAG_SORT] [ARCH-THIS_PAGE_TAG_SORT] [REQ-THIS_PAGE_TAG_SORT]
   * Load hoverboard_tag_frequency from storage, normalize via _normalizeHoverboardTagFrequencyMap, push into UIManager for chip ordering (side panel).
   */
  async refreshTagFrequencyMapForSort () {
    try {
      if (typeof chrome === 'undefined' || !chrome.storage?.local?.get) return
      const result = await new Promise((resolve) => {
        chrome.storage.local.get('hoverboard_tag_frequency', resolve)
      })
      const map = this._normalizeHoverboardTagFrequencyMap(result?.hoverboard_tag_frequency)
      this.uiManager.setTagFrequencyMapForSort(map)
    } catch (e) {
      debugError('[POPUP-CONTROLLER] [REQ-THIS_PAGE_TAG_SORT] refreshTagFrequencyMapForSort failed:', e)
    }
  }

  /**
   * [REQ-SUGGESTED_TAGS_FROM_CONTENT] [IMPL-SUGGESTED_TAGS] [ARCH-SUGGESTED_TAGS]
   * Load suggested tags from page headings
   */
  async loadSuggestedTags () {
    try {
      debugLog('[POPUP-CONTROLLER] [REQ-SUGGESTED_TAGS_FROM_CONTENT] Loading suggested tags from page content')

      if (!this.currentTab || !this.currentTab.id) {
        debugLog('[POPUP-CONTROLLER] [REQ-SUGGESTED_TAGS_FROM_CONTENT] No current tab, skipping suggested tags')
        this._recordInjectionOutcome({
          phase: 'suggested_tags',
          reason: 'missing_url',
          injectable: false
        })
        this.uiManager.updateSuggestedTags([])
        return
      }

      // [REQ-SUGGESTED_TAGS_FROM_CONTENT] Skip non-scriptable URLs (schemes + extensions gallery)
      const classif = classifyScriptInjectionUrl(this.currentTab.url)
      if (!classif.injectable) {
        debugLog('[POPUP-CONTROLLER] [REQ-SUGGESTED_TAGS_FROM_CONTENT] Tab URL not injectable, skipping suggested tags:', classif.reason)
        this._recordInjectionOutcome({
          phase: 'suggested_tags',
          reason: classif.reason,
          injectable: false
        })
        this.uiManager.updateSuggestedTags([])
        return
      }

      // [REQ-SUGGESTED_TAGS_FROM_CONTENT] [REQ-THIS_PAGE_TAG_SORT] MAIN world: snippet file then extractor (relevance + in-page frequency).
      try {
        try {
          await chrome.scripting.executeScript({
            target: { tabId: this.currentTab.id },
            world: 'MAIN',
            files: [SUGGESTED_TAGS_MAIN_WORLD_FILE]
          })
        } catch (fileErr) {
          debugLog('[POPUP-CONTROLLER] [REQ-SUGGESTED_TAGS_FROM_CONTENT] Main-world snippet file inject failed (non-fatal):', fileErr)
        }

        const results = await chrome.scripting.executeScript({
          target: { tabId: this.currentTab.id },
          world: 'MAIN',
          func: () => {
            const fn = globalThis.__hoverboardExtractSuggestedTagsWithRelevance
            return typeof fn === 'function' ? fn() : []
          }
        })

        if (results && results[0] && results[0].result) {
          const raw = results[0].result
          const suggestedList = this._normalizeSuggestedRowsFromMainWorld(raw)

          const currentTags = this.normalizeTags(this.currentPin?.tags || [])
          const currentTagsLower = new Set(currentTags.map((t) => t.toLowerCase()))
          const filteredSuggestedTags = this.uiManager.container
            ? suggestedList
              .map(item => {
                const mode = this.uiManager.getTagCaseFoldingMode?.() || 'original'
                const adjustedTag = tagChipDisplayAndAddValue(item.tag, mode).addValue
                const state = classifySuggestedTagState(item.tag, currentTags, adjustedTag)
                return state
                  ? { ...item, state: state.state, matchedTag: state.matchedTag }
                  : null
              })
              .filter(item => item)
            : suggestedList.filter(
              (item) => !currentTagsLower.has(item.tag.toLowerCase())
            )

          debugLog('[POPUP-CONTROLLER] [REQ-SUGGESTED_TAGS_FROM_CONTENT] Extracted suggested tags:', filteredSuggestedTags)
          this.uiManager.updateSuggestedTags(filteredSuggestedTags)
        } else {
          debugLog('[POPUP-CONTROLLER] [REQ-SUGGESTED_TAGS_FROM_CONTENT] No suggested tags extracted')
          this.uiManager.updateSuggestedTags([])
        }
      } catch (scriptError) {
        const expectedReason = classifyScriptInjectionError(scriptError)
        if (expectedReason) {
          debugWarn('[POPUP-CONTROLLER] [REQ-SUGGESTED_TAGS_FROM_CONTENT] Expected non-scriptable skip:', expectedReason, scriptError)
          this._recordInjectionOutcome({
            phase: 'suggested_tags',
            reason: expectedReason,
            injectable: false,
            errorMessage: scriptError?.message
          })
        } else {
          debugError('[POPUP-CONTROLLER] [REQ-SUGGESTED_TAGS_FROM_CONTENT] Failed to extract suggested tags:', scriptError)
          this._recordInjectionOutcome({
            phase: 'suggested_tags',
            reason: 'ok',
            injectable: true,
            errorMessage: scriptError?.message
          })
        }
        this.uiManager.updateSuggestedTags([])
      }
    } catch (error) {
      debugError('[POPUP-CONTROLLER] [REQ-SUGGESTED_TAGS_FROM_CONTENT] Failed to load suggested tags:', error)
      this.uiManager.updateSuggestedTags([])
    }
  }

  /**
   * [IMPL-SCREENSHOT_MODE] [REQ-SUGGESTED_TAGS_FROM_CONTENT] In screenshot/demo mode, read hoverboard_demo_suggested_tags from storage and call updateSuggestedTags so the Suggested Tags section is visible in screenshots and demo GIF.
   */
  async loadDemoSuggestedTagsIfScreenshotMode () {
    return new Promise((resolve) => {
      if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local || typeof chrome.storage.local.get !== 'function') {
        resolve()
        return
      }
      chrome.storage.local.get('hoverboard_demo_suggested_tags', (result) => {
        const tags = result && result.hoverboard_demo_suggested_tags
        if (Array.isArray(tags) && tags.length > 0) {
          this.uiManager.updateSuggestedTags(tags)
        }
        resolve()
      })
    })
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
   * Get current active tab
   */
  async getCurrentTab () {
    debugLog('[IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING] [REQ-EXTENSION_IDENTITY] getCurrentTab: calling chrome.tabs.query')
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        debugLog('[IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING] [REQ-EXTENSION_IDENTITY] getCurrentTab: chrome.tabs.query callback', tabs, chrome.runtime.lastError)
        if (chrome.runtime.lastError) {
          debugError('[IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING] [REQ-EXTENSION_IDENTITY] getCurrentTab: chrome.runtime.lastError', chrome.runtime.lastError)
          reject(new Error(chrome.runtime.lastError.message))
          return
        }

        if (tabs && tabs.length > 0) {
          resolve(tabs[0])
        } else {
          debugError('[IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING] [REQ-EXTENSION_IDENTITY] getCurrentTab: No active tab found')
          reject(new Error('No active tab found'))
        }
      })
    })
  }

  /**
   * Get bookmark data for a URL
   * [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Enhanced data extraction with validation
   */
  async getBookmarkData (url) {
    debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] getBookmarkData: calling chrome.runtime.sendMessage', url)
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: 'getCurrentBookmark',
          data: { url }
        },
        (response) => {
          debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] getBookmarkData: chrome.runtime.sendMessage callback', response, chrome.runtime.lastError)
          if (chrome.runtime.lastError) {
            debugError('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] getBookmarkData: chrome.runtime.lastError', chrome.runtime.lastError)
            reject(new Error(chrome.runtime.lastError.message))
            return
          }

          if (response && response.success) {
            // [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Enhanced response structure validation
            debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] getBookmarkData: response structure:', {
              response,
              responseSuccess: response.success,
              responseData: response.data,
              responseDataType: typeof response.data,
              responseDataKeys: response.data ? Object.keys(response.data) : null,
              hasUrl: !!response.data?.url,
              hasTags: !!response.data?.tags,
              tagCount: response.data?.tags ? (Array.isArray(response.data.tags) ? response.data.tags.length : 'not-array') : 0
            })

            // [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Extract and validate bookmark data
            const bookmarkData = response.data

            // [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Only treat as no bookmark when URL is blocked; needsAuth still has bookmark from local/file/sync
            if (bookmarkData?.blocked) {
              debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] getBookmarkData: URL blocked', bookmarkData)
              resolve(null)
              return
            }

            // [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Validate extracted data
            const isValid = this.validateBookmarkData(bookmarkData)
            if (!isValid) {
              debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] getBookmarkData: Invalid bookmark data structure, treating as no bookmark', bookmarkData)
              resolve(null)
              return
            }

            // [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Extract the actual bookmark data (handle both direct and nested structures)
            const extractedData = bookmarkData?.data || bookmarkData
            debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] getBookmarkData: extracted and validated bookmark data:', extractedData)
            resolve(extractedData)
          } else {
            debugError('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] getBookmarkData: Failed to get bookmark data', response)
            reject(new Error(response?.error || 'Failed to get bookmark data'))
          }
        }
      )
    })
  }

  /**
   * [IMPL-MOVE_BOOKMARK_UI] [ARCH-MOVE_BOOKMARK_UI] [REQ-MOVE_BOOKMARK_STORAGE_UI] [REQ-STORAGE_MODE_DEFAULT] Get the storage backend currently selected in the popup UI (highlighted button).
   * Used so save follows the highlight when creating or updating a bookmark.
   * @returns {string|null} 'pinboard'|'local'|'file'|'sync'|'browser' or null if not determinable
   */
  getSelectedStorageBackend () {
    // [IMPL-MOVE_BOOKMARK_UI] Five Save-to backends: pinboard | local | file | sync | browser
    const btn = this.uiManager.elements.storageBackendButtons?.querySelector('.storage-backend-btn[aria-pressed="true"]')
    const backend = btn?.getAttribute('data-backend') || null
    return (backend && SAVE_TO_BACKENDS.includes(backend)) ? backend : null
  }

  /**
   * [IMPL-MOVE_BOOKMARK_UI] [ARCH-MOVE_BOOKMARK_UI] [REQ-MOVE_BOOKMARK_STORAGE_UI] [REQ-STORAGE_MODE_DEFAULT] [REQ-READ_LATER_BROWSER_FALLBACK]
   * PROCEDURE: IS_PERSISTED_BOOKMARK
   * A URL-only currentPin is a provider lookup stub, not a persisted bookmark.
   */
  isPersistedBookmark (currentPin = this.currentPin) {
    return Boolean(currentPin?.time && String(currentPin.time).trim())
  }

  /**
   * [IMPL-MOVE_BOOKMARK_UI] [ARCH-MOVE_BOOKMARK_UI] [REQ-MOVE_BOOKMARK_STORAGE_UI] [REQ-STORAGE_MODE_DEFAULT] [REQ-READ_LATER_BROWSER_FALLBACK]
   * PROCEDURE: RESOLVE_READ_LATER_BACKEND
   * Browser cannot persist Read Later metadata, so resolve it through the
   * normalized default and use Local when the normalized default is Browser.
   */
  async resolveReadLaterBackend (selectedBackend = this.getSelectedStorageBackend()) {
    if (READ_LATER_METADATA_BACKENDS.includes(selectedBackend)) {
      return { effectiveBackend: selectedBackend, fallbackApplied: false }
    }

    const configuredBackend = await this.configManager.getStorageMode()
    const effectiveBackend = READ_LATER_METADATA_BACKENDS.includes(configuredBackend)
      ? configuredBackend
      : 'local'
    return { effectiveBackend, fallbackApplied: true }
  }

  /**
   * [IMPL-MOVE_BOOKMARK_UI] [ARCH-MOVE_BOOKMARK_UI] [REQ-MOVE_BOOKMARK_STORAGE_UI] [REQ-STORAGE_MODE_DEFAULT] [REQ-READ_LATER_BROWSER_FALLBACK]
   * PROCEDURE: CREATE_READ_LATER_BOOKMARK
   * Reuse createBookmark while passing the resolved preferredBackend.
   */
  async createReadLaterBookmark (effectiveBackend) {
    const result = await this.createBookmark([], 'yes', 'yes', effectiveBackend, {
      suppressSuccess: true
    })
    if (result?.success === false) {
      throw new Error(result.error || 'Failed to create Read Later bookmark')
    }
    return {
      success: true,
      bookmark: result?.bookmark || this.currentPin,
      effectiveBackend
    }
  }

  /**
   * [IMPL-MOVE_BOOKMARK_UI] [ARCH-MOVE_BOOKMARK_UI] [REQ-MOVE_BOOKMARK_STORAGE_UI] [REQ-STORAGE_MODE_DEFAULT] [REQ-READ_LATER_BROWSER_FALLBACK]
   * PROCEDURE: APPLY_READ_LATER_RESULT
   * Apply bookmark state first; fallback feedback is informational and does
   * not invoke archive-status handlers.
   */
  applyReadLaterResult ({ saveResult, effectiveBackend, fallbackApplied }) {
    if (!saveResult?.success) {
      throw new Error('Failed to create Read Later bookmark')
    }

    if (saveResult.bookmark) {
      this.currentPin = {
        ...(this.currentPin || {}),
        ...saveResult.bookmark,
        toread: 'yes',
        preferredBackend: effectiveBackend
      }
    } else if (this.currentPin) {
      this.currentPin.toread = 'yes'
      this.currentPin.preferredBackend = effectiveBackend
    }

    this.stateManager.setState({ currentPin: this.currentPin })
    this.uiManager.updateReadLaterStatus(true)
    this._resolvedStorageBackend = effectiveBackend
    this.uiManager.showSuccess('Bookmark created and added to read later')

    if (fallbackApplied) {
      this.uiManager.updateStorageBackendValue(effectiveBackend)
      this.uiManager.showInfo(
        `Browser storage cannot preserve Read Later metadata; saved to ${effectiveBackend} instead.`
      )
    }

    return { success: true, effectiveBackend }
  }

  /**
   * [IMPL-MOVE_BOOKMARK_UI] [ARCH-MOVE_BOOKMARK_UI] [REQ-MOVE_BOOKMARK_STORAGE_UI] Get storage backend for URL (pinboard | local | file | sync).
   */
  async getStorageBackendForUrl (url) {
    if (!url || typeof chrome?.runtime?.sendMessage !== 'function') return 'local'
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { type: 'getStorageBackendForUrl', data: { url } },
        (response) => {
          if (chrome.runtime.lastError || response === undefined) {
            resolve('local')
            return
          }
          const backend = response?.data ?? response
          resolve(typeof backend === 'string' ? backend : 'local')
        }
      )
    })
  }

  /**
   * [IMPL-MOVE_BOOKMARK_UI] [ARCH-MOVE_BOOKMARK_UI] [REQ-MOVE_BOOKMARK_STORAGE_UI] [IMPL-MOVE_BOOKMARK_RESPONSE_AND_URL] Move current bookmark to target storage backend.
   */
  async handleStorageBackendChange (targetBackend) {
    recordAction(POPUP_ACTION_IDS.storageBackendChange, { targetBackend }, 'popup')
    if (this._onAction) this._onAction({ actionId: POPUP_ACTION_IDS.storageBackendChange, payload: { targetBackend } })
    // [IMPL-PAGE_ARCHIVE_STATUS_UI] [ARCH-PAGE_ARCHIVE_STATUS_UI] [REQ-PAGE_ARCHIVE_STATUS_UI]
    // Clear the old backend before any move result can leave stale indicators visible.
    this._archiveStatusContextKey = `${this.currentTab?.url || this.currentPin?.url || ''}|${targetBackend || ''}`
    this.resetArchiveArtifactStatus(targetBackend)
    // [IMPL-MOVE_BOOKMARK_RESPONSE_AND_URL] Use bookmark URL when available so move uses same key as storage.
    const url = this.currentPin?.url || this.currentTab?.url
    if (!url) return
    try {
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          { type: 'moveBookmarkToStorage', data: { url, targetBackend } },
          (r) => (chrome.runtime.lastError ? reject(new Error(chrome.runtime.lastError.message)) : resolve(r))
        )
      })
      // [IMPL-MOVE_BOOKMARK_RESPONSE_AND_URL] Use inner result: service worker wraps as { success: true, data: routerResult }.
      const result = response?.data ?? response
      if (result?.success) {
        this.uiManager.showSuccess('Bookmark moved to ' + targetBackend)
        const updated = await this.getBookmarkData(this.currentTab?.url || url)
        this.currentPin = updated
        this.stateManager.setState({ currentPin: this.currentPin })
        this.uiManager.updateStorageBackendValue(targetBackend)
        this.uiManager.updateStorageLocalToggle(targetBackend, true)
        this.uiManager.updatePrivateStatus(this.currentPin?.shared === 'no')
        this.uiManager.updateReadLaterStatus(this.currentPin?.toread === 'yes')
        this.uiManager.updateCurrentTags(this.normalizeTags(this.currentPin?.tags))
        // [REQ-BOOKMARK_NOTES_UI] [IMPL-BOOKMARK_NOTES_UI] Re-sync details after move (browser disables notes)
        this._resolvedStorageBackend = targetBackend
        this.uiManager.syncBookmarkNotesFields(this.currentPin, targetBackend)
        await this.refreshArchiveArtifactStatus({
          url: this.currentTab?.url || url,
          backend: targetBackend,
          force: true
        })
      } else {
        this.uiManager.showError(result?.message || 'Move failed')
      }
    } catch (e) {
      debugError('[IMPL-MOVE_BOOKMARK_UI] handleStorageBackendChange failed:', e)
      this.uiManager.showError(e.message || 'Move failed')
    }
  }

  /**
   * - [IMPL-BOOKMARK_NOTES_UI] [ARCH-BOOKMARK_NOTES_UI] [REQ-BOOKMARK_NOTES_UI] [REQ-MOVE_BOOKMARK_STORAGE_UI] How: Build payload and send saveBookmark with preferredBackend.
   * PROCEDURE: SAVE_BOOKMARK_DETAILS
   */
  async handleSaveBookmarkDetails () {
    const titleText = this.uiManager.elements.bookmarkTitleInput?.value ?? ''
    const notesText = this.uiManager.elements.bookmarkNotesInput?.value ?? ''
    const preferredBackend = this.getSelectedStorageBackend()
    const resolvedBackend = this._resolvedStorageBackend || preferredBackend
    const notesEditable = notesEditableForBackend(resolvedBackend)
    const payload = buildBookmarkNotesSavePayload({
      currentPin: this.currentPin,
      url: this.currentPin?.url || this.currentTab?.url,
      tabTitle: this.currentTab?.title || '',
      titleText,
      notesText,
      preferredBackend,
      notesEditable
    })
    if (payload.error === 'MissingUrl') {
      this.uiManager.showError('No URL to save')
      return
    }
    if (bookmarkDetailsUnchanged(this.currentPin, payload, notesEditable)) {
      return
    }
    try {
      const response = await this.sendMessage({ type: 'saveBookmark', data: payload })
      const ok = response?.success !== false && !response?.error
      if (!ok) {
        this.uiManager.showError(response?.error || response?.message || 'Failed to save details')
        return
      }
      this.currentPin = {
        ...(this.currentPin || {}),
        ...payload
      }
      this.stateManager.setState({ currentPin: this.currentPin })
      this.uiManager.syncBookmarkNotesFields(this.currentPin, resolvedBackend)
      this.uiManager.showSuccess('Details saved')
    } catch (e) {
      debugError('[IMPL-BOOKMARK_NOTES_UI] handleSaveBookmarkDetails failed:', e)
      this.uiManager.showError(e.message || 'Failed to save details')
    }
  }

  /**
   * [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Validate bookmark data structure
   * @param {Object} bookmarkData - Bookmark data to validate
   * @returns {boolean} Whether the data is valid
   */
  validateBookmarkData (bookmarkData) {
    // Handle null and undefined inputs
    if (bookmarkData === null || bookmarkData === undefined) {
      return false
    }

    // Handle both direct bookmark data and response structure
    const data = bookmarkData?.data || bookmarkData

    if (!data || typeof data !== 'object' || !data.url) {
      debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Bookmark data validation: missing url or invalid object')
      return false
    }

    // [IMPL-URL_TAGS_DISPLAY] Normalize tags to array instead of rejecting (defensive; backend now returns normalized)
    if (!Array.isArray(data.tags)) {
      data.tags = data.tags == null
        ? []
        : (typeof data.tags === 'string' ? data.tags.split(/\s+/).filter(t => t.trim()) : [])
    }

    const isValid = true
    debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Bookmark data validation:', {
      isValid,
      hasUrl: !!data?.url,
      hasTags: Array.isArray(data?.tags),
      tagCount: data?.tags?.length || 0,
      hasDescription: !!data?.description,
      hasShared: data?.shared !== undefined,
      hasToread: data?.toread !== undefined,
      dataStructure: {
        hasDataProperty: !!bookmarkData?.data,
        directData: !!bookmarkData?.url,
        dataKeys: data ? Object.keys(data) : null
      }
    })

    return isValid
  }

  /**
   * Send message to background script.
   * @param {{ type: string, data?: Record<string, unknown> }} message - Message envelope (type + optional data)
   * @returns {Promise<unknown>} Response from service worker
   */
  async sendMessage (message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
          return
        }

        if (isMissingMessageResponse(response)) {
          reject(new Error('Request failed'))
          return
        }

        if (typeof response === 'object' && 'success' in response) {
          if (response.success) {
            resolve(unwrapMessageResponse(response))
            return
          }
          reject(new Error(
            typeof response.error === 'string'
              ? response.error
              : (response.code || 'Request failed')
          ))
          return
        }

        if (response && ('textContent' in response || 'title' in response)) {
          resolve(response)
        } else {
          reject(new Error(response?.error || 'Request failed'))
        }
      })
    })
  }

  /**
   * [IMPL-POPUP_MESSAGE_TIMEOUT] Send message to content script with timeout; reject on timeout or error.
   */
  async sendToTab (message) {
    if (!this.currentTab) {
      throw new Error('No current tab available')
    }

    // Check if we can inject into this tab
    if (!this.canInjectIntoTab(this.currentTab)) {
      throw new Error('Cannot inject into this tab')
    }

    const timeoutMs = this.tabMessageTimeoutMs ?? 2000

    return new Promise((resolve, reject) => {
      let settled = false

      const startTimer = () => setTimeout(() => {
        if (settled) {
          return
        }
        settled = true
        debugError('[IMPL-POPUP_MESSAGE_TIMEOUT] sendToTab timed out', {
          timeoutMs,
          messageType: message?.type
        })
        reject(new Error('Timed out waiting for tab response'))
      }, timeoutMs)

      let timerId = startTimer()

      const refreshTimer = () => {
        if (settled) {
          return
        }
        clearTimeout(timerId)
        timerId = startTimer()
      }

      const resolveOnce = (value) => {
        if (settled) {
          return
        }
        settled = true
        clearTimeout(timerId)
        resolve(value)
      }

      const rejectOnce = (error) => {
        if (settled) {
          return
        }
        settled = true
        clearTimeout(timerId)
        reject(error)
      }

      const handleResponse = (response) => {
        if (chrome.runtime.lastError) {
          if (chrome.runtime.lastError.message.includes('Receiving end does not exist')) {
            debugLog('Content script not found, attempting injection...')
            refreshTimer()
            this.injectContentScript(this.currentTab.id)
              .then(() => {
                debugLog('Content script injected, waiting for initialization...')
                refreshTimer()
                setTimeout(() => {
                  if (settled) {
                    return
                  }
                  refreshTimer()
                  chrome.tabs.sendMessage(this.currentTab.id, message, (retryResponse) => {
                    if (chrome.runtime.lastError) {
                      debugError('Retry failed, trying fallback injection:', chrome.runtime.lastError.message)
                      refreshTimer()
                      this.injectFallbackContentScript(this.currentTab.id)
                        .then(() => {
                          setTimeout(() => {
                            if (settled) {
                              return
                            }
                            refreshTimer()
                            chrome.tabs.sendMessage(this.currentTab.id, message, (fallbackResponse) => {
                              if (chrome.runtime.lastError) {
                                debugError('Fallback also failed:', chrome.runtime.lastError.message)
                                rejectOnce(new Error(chrome.runtime.lastError.message))
                                return
                              }
                              debugLog('Message sent successfully after fallback injection')
                              resolveOnce(fallbackResponse)
                            })
                          }, 500)
                        })
                        .catch(fallbackError => {
                          debugError('Fallback injection failed:', fallbackError)
                          rejectOnce(new Error(`Both injection methods failed: ${fallbackError.message}`))
                        })
                      return
                    }
                    debugLog('Message sent successfully after injection')
                    resolveOnce(retryResponse)
                  })
                }, 1000)
              })
              .catch(error => {
                const expectedReason = classifyScriptInjectionError(error)
                if (expectedReason) {
                  debugWarn('Content script injection failed (non-scriptable):', expectedReason, error)
                } else {
                  debugError('Content script injection failed:', error)
                }
                rejectOnce(new Error(`Failed to inject content script: ${error.message}`))
              })
            return
          }
          rejectOnce(new Error(chrome.runtime.lastError.message))
          return
        }
        resolveOnce(response)
      }

      const sendMessageWithTimeout = () => {
        refreshTimer()
        let maybePromise
        try {
          maybePromise = chrome.tabs.sendMessage(this.currentTab.id, message, handleResponse)
        } catch (error) {
          rejectOnce(error instanceof Error ? error : new Error(String(error)))
          return
        }

        // [IMPL-POPUP_MESSAGE_TIMEOUT] Support Promise-based mocks that skip callbacks in Jest
        if (maybePromise && typeof maybePromise.then === 'function') {
          maybePromise
            .then((response) => {
              handleResponse(response)
            })
            .catch((error) => {
              debugError('[IMPL-POPUP_MESSAGE_TIMEOUT] Promise-based sendMessage failed', error)
              rejectOnce(error instanceof Error ? error : new Error(String(error)))
            })
        }
      }

      sendMessageWithTimeout()
    })
  }

  /**
   * Check if we can inject into a tab (shared non-scriptable URL classifier).
   * [IMPL-POPUP_SESSION] [ARCH-SUGGESTED_TAGS] [REQ-SUGGESTED_TAGS_FROM_CONTENT]
   */
  canInjectIntoTab (tab) {
    return classifyScriptInjectionUrl(tab?.url).injectable
  }

  /**
   * [IMPL-UI_INSPECTOR] Record structured injectionOutcome for tests / debug.
   * @param {{ phase: string, reason: string, injectable: boolean, errorMessage?: string, tabId?: number }} partial
   */
  _recordInjectionOutcome (partial) {
    const url = this.currentTab?.url || ''
    let urlHost = ''
    try {
      if (url) urlHost = new URL(url).hostname
    } catch (_) {
      urlHost = ''
    }
    const surface = this._refreshSurface || 'popup'
    const trigger = this._refreshTrigger || 'other'
    recordAction('injectionOutcome', {
      phase: partial.phase,
      trigger,
      tabId: partial.tabId ?? this.currentTab?.id,
      urlHost,
      reason: partial.reason,
      injectable: !!partial.injectable,
      ...(partial.errorMessage ? { errorMessage: partial.errorMessage } : {})
    }, surface)
  }

  /**
   * Inject content script into tab
   */
  async injectContentScript (tabId) {
    try {
      debugLog('Injecting content script into tab:', tabId)

      // First inject the CSS
      await chrome.scripting.insertCSS({
        target: { tabId },
        files: ['src/features/content/overlay-styles.css']
      })

      // Try to inject the bundled content script (without ES6 export issues)
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        files: ['src/features/content/content-main.js']
      })

      debugLog('Content script injection completed:', results)
      this._recordInjectionOutcome({
        phase: 'inject',
        reason: 'ok',
        injectable: true,
        tabId
      })
      return results
    } catch (error) {
      const expectedReason = classifyScriptInjectionError(error)
      if (expectedReason) {
        debugWarn('Content script injection skipped (non-scriptable):', expectedReason, error)
        this._recordInjectionOutcome({
          phase: 'inject',
          reason: expectedReason,
          injectable: false,
          tabId,
          errorMessage: error?.message
        })
      } else {
        debugError('Content script injection error:', error)
        this._recordInjectionOutcome({
          phase: 'inject',
          reason: 'ok',
          injectable: true,
          tabId,
          errorMessage: error?.message
        })
      }
      throw error
    }
  }

  /**
   * Inject fallback content script that doesn't use ES6 modules
   */
  async injectFallbackContentScript (tabId) {
    try {
      debugLog('Injecting fallback content script into tab:', tabId)

      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          // Create a comprehensive message listener for enhanced overlay injection
          if (!window.hoverboardInjected) {
            window.hoverboardInjected = true

            // Define refresh overlay function for use within content script
            async function refreshOverlay () {
              try {
                // Get updated bookmark data
                const response = await new Promise((resolve) => {
                  chrome.runtime.sendMessage({
                    type: 'getBookmark',
                    data: { url: window.location.href }
                  }, resolve)
                })

                if (response && response.success && response.bookmark) {
                  // Remove existing overlay
                  const existingOverlay = document.getElementById('hoverboard-overlay')
                  if (existingOverlay) {
                    existingOverlay.remove()
                  }

                  // Show updated overlay
                  chrome.runtime.sendMessage({
                    type: 'showHoverboard',
                    data: { url: window.location.href }
                  })
                }
              } catch (error) {
                debugError('Failed to refresh overlay:', error)
              }
            }

            chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
              debugLog('Hoverboard content script received message:', message)

              if (message.type === 'TOGGLE_HOVER') {
                let overlay = document.getElementById('hoverboard-overlay')

                if (overlay) {
                  // Hide existing overlay
                  overlay.remove()
                  sendResponse({ success: true, action: 'hidden' })
                } else {
                  // Create enhanced overlay with full functionality matching test interface
                  const { bookmark, tab } = message.data || {}

                  overlay = document.createElement('div')
                  overlay.id = 'hoverboard-overlay'
                  overlay.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    width: 400px;
                    max-height: 80vh;
                    background: rgba(255,255,255,0.95);
                    border: 2px solid #90ee90;
                    border-radius: 8px;
                    padding: 0;
                    z-index: 2147483647;
                    font-family: 'Futura PT', system-ui, -apple-system, sans-serif;
                    font-size: 14px;
                    color: black;
                    font-weight: 600;
                    overflow-y: auto;
                    cursor: pointer;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                  `

                  // Create main container div
                  const mainContainer = document.createElement('div')
                  mainContainer.style.cssText = 'padding: 8px;'

                  // Create site tags row element (matching test overlay structure)
                  const siteTagsContainer = document.createElement('div')
                  siteTagsContainer.className = 'scrollmenu'
                  siteTagsContainer.style.cssText = `
                    margin-bottom: 8px;
                    padding: 4px;
                    background: white;
                    border-radius: 4px;
                  `

                  // Close button (matching extension style)
                  const closeBtn = document.createElement('span')
                  closeBtn.className = 'tiny'
                  closeBtn.innerHTML = '✕'
                  closeBtn.style.cssText = `
                    float: right;
                    cursor: pointer;
                    padding: 0.2em 0.5em;
                    color: red;
                    font-weight: 900;
                    background: rgba(255,255,255,0.8);
                    border-radius: 3px;
                    margin: 2px;
                  `
                  closeBtn.onclick = () => overlay.remove()
                  siteTagsContainer.appendChild(closeBtn)

                  // Current tags section (matching extension logic)
                  const currentLabel = document.createElement('span')
                  currentLabel.className = 'tiny'
                  currentLabel.textContent = 'Current:'
                  currentLabel.style.cssText = 'padding: 0.2em 0.5em; margin-right: 4px;'
                  siteTagsContainer.appendChild(currentLabel)

                  // Add current tags with full functionality
                  const currentTags = bookmark?.tags ? (Array.isArray(bookmark.tags) ? bookmark.tags : bookmark.tags.split(' ').filter(t => t)) : []
                  currentTags.forEach(tag => {
                    const tagElement = document.createElement('span')
                    tagElement.className = 'tiny iconTagDeleteInactive'
                    tagElement.textContent = tag
                    tagElement.style.cssText = `
                      padding: 0.2em 0.5em;
                      margin: 2px;
                      background: #f0f8f0;
                      border-radius: 3px;
                      cursor: pointer;
                      color: #90ee90;
                    `
                    tagElement.title = 'Double-click to remove'
                    tagElement.ondblclick = async () => {
                      // Remove tag and refresh overlay
                      if (confirm(`Delete tag "${tag}"?`)) {
                        chrome.runtime.sendMessage({
                          type: 'deleteTag',
                          data: {
                            url: window.location.href,
                            value: tag,
                            ...bookmark
                          }
                        })

                        // Update local bookmark data and refresh overlay
                        setTimeout(() => {
                          refreshOverlay()
                        }, 500)
                      }
                    }
                    siteTagsContainer.appendChild(tagElement)
                  })

                  // Add tag input (matching extension style)
                  const tagInput = document.createElement('input')
                  tagInput.className = 'tag-input'
                  tagInput.placeholder = 'New Tag'
                  tagInput.style.cssText = `
                    margin: 2px;
                    padding: 2px !important;
                    font-size: 12px;
                    width: 80px;
                    border: 1px solid #ccc;
                    border-radius: 3px;
                  `
                  tagInput.addEventListener('keypress', async (e) => {
                    if (e.key === 'Enter') {
                      const tagText = tagInput.value.trim()
                      if (tagText && !currentTags.includes(tagText)) {
                        chrome.runtime.sendMessage({
                          type: 'saveTag',
                          data: {
                            url: window.location.href,
                            value: tagText,
                            ...bookmark
                          }
                        })
                        tagInput.value = ''

                        // Update local bookmark data and refresh overlay
                        setTimeout(() => {
                          refreshOverlay()
                        }, 500)
                      }
                    }
                  })
                  siteTagsContainer.appendChild(tagInput)

                  // Recent tags section (matching test interface)
                  const recentContainer = document.createElement('div')
                  recentContainer.className = 'scrollmenu'
                  recentContainer.style.cssText = `
                    margin-bottom: 8px;
                    padding: 4px;
                    background: #f9f9f9;
                    border-radius: 4px;
                    font-size: smaller;
                    font-weight: 900;
                    color: green;
                  `

                  const recentLabel = document.createElement('span')
                  recentLabel.className = 'tiny'
                  recentLabel.textContent = 'Recent:'
                  recentLabel.style.cssText = 'padding: 0.2em 0.5em; margin-right: 4px;'
                  recentContainer.appendChild(recentLabel)

                  // Add sample recent tags for demonstration (same as test interface)
                  const sampleRecentTags = ['javascript', 'development', 'web', 'tutorial', 'reference', 'programming', 'tools', 'documentation']
                  sampleRecentTags.slice(0, 5).forEach(tag => {
                    if (!currentTags.includes(tag)) {
                      const tagElement = document.createElement('span')
                      tagElement.className = 'tiny'
                      tagElement.textContent = tag
                      tagElement.style.cssText = `
                        padding: 0.2em 0.5em;
                        margin: 2px;
                        background: #f0f8f0;
                        border-radius: 3px;
                        cursor: pointer;
                        color: green;
                      `
                      tagElement.onclick = async () => {
                        if (!currentTags.includes(tag)) {
                          chrome.runtime.sendMessage({
                            type: 'saveTag',
                            data: {
                              url: window.location.href,
                              value: tag,
                              ...bookmark
                            }
                          })

                          // Update local bookmark data and refresh overlay
                          setTimeout(() => {
                            refreshOverlay()
                          }, 500)
                        }
                      }
                      recentContainer.appendChild(tagElement)
                    }
                  })

                  // Action buttons section (matching extension functionality)
                  const actionsContainer = document.createElement('div')
                  actionsContainer.style.cssText = `
                    padding: 4px;
                    background: white;
                    border-radius: 4px;
                    text-align: center;
                  `

                  // Privacy toggle
                  const isPrivate = bookmark?.shared === 'no'
                  const privateBtn = document.createElement('button')
                  privateBtn.style.cssText = `
                    margin: 2px;
                    padding: 4px 8px;
                    font-size: 12px;
                    border: 1px solid #ccc;
                    border-radius: 3px;
                    background: ${isPrivate ? '#ffeeee' : '#eeffee'};
                    cursor: pointer;
                    font-weight: 600;
                  `
                  privateBtn.textContent = isPrivate ? '🔒 Private' : '🌐 Public'
                  privateBtn.onclick = async () => {
                    chrome.runtime.sendMessage({
                      type: 'saveBookmark',
                      data: {
                        ...bookmark,
                        url: window.location.href,
                        shared: isPrivate ? 'yes' : 'no'
                      }
                    })

                    // Update local bookmark data and refresh overlay
                    setTimeout(() => {
                      refreshOverlay()
                    }, 500)
                  }

                  // Read status toggle
                  const isToRead = bookmark?.toread === 'yes'
                  const readBtn = document.createElement('button')
                  readBtn.style.cssText = `
                    margin: 2px;
                    padding: 4px 8px;
                    font-size: 12px;
                    border: 1px solid #ccc;
                    border-radius: 3px;
                    background: ${isToRead ? '#ffffee' : '#eeeeff'};
                    cursor: pointer;
                    font-weight: 600;
                  `
                  readBtn.textContent = isToRead ? '📖 Read Later' : '📋 Not marked'
                  readBtn.onclick = async () => {
                    chrome.runtime.sendMessage({
                      type: 'saveBookmark',
                      data: {
                        ...bookmark,
                        url: window.location.href,
                        toread: isToRead ? 'no' : 'yes'
                      }
                    })

                    // Update local bookmark data and refresh overlay
                    setTimeout(() => {
                      refreshOverlay()
                    }, 500)
                  }

                  actionsContainer.appendChild(privateBtn)
                  actionsContainer.appendChild(readBtn)

                  // Page info at bottom (URL display - matching test interface)
                  const pageInfo = document.createElement('div')
                  pageInfo.style.cssText = `
                    padding: 4px;
                    font-size: 11px;
                    color: #666;
                    background: #f9f9f9;
                    border-radius: 4px;
                    margin-top: 4px;
                    word-break: break-all;
                  `
                  pageInfo.innerHTML = `
                    <div style="font-weight: bold; margin-bottom: 2px;">
                      ${bookmark?.description || document.title}
                    </div>
                    <div>${window.location.href}</div>
                  `

                  // Assemble the overlay (matching extension structure)
                  mainContainer.appendChild(siteTagsContainer)
                  mainContainer.appendChild(recentContainer)
                  mainContainer.appendChild(actionsContainer)
                  mainContainer.appendChild(pageInfo)
                  overlay.appendChild(mainContainer)

                  document.body.appendChild(overlay)

                  sendResponse({ success: true, action: 'shown' })
                }
              }

              return true // Keep message channel open
            })
          }
        }
      })

      debugLog('Fallback content script injection completed:', results)
      return results
    } catch (error) {
      debugError('Fallback content script injection error:', error)
      throw error
    }
  }

  /**
   * Set loading state
   */
  setLoading (isLoading) {
    this.isLoading = isLoading
    this.uiManager.setLoading(isLoading)
    if (this._onStateChange) {
      this._onStateChange({ screen: isLoading ? 'loading' : 'mainInterface', state: { bookmark: this.currentPin } })
    }
  }

  /**
   * [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Handle show/hide hoverboard; no window.close.
   * [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] [TEST-POPUP_CLOSE_BEHAVIOR] Modified to NOT close popup after toggling overlay visibility
   */
  async handleShowHoverboard () {
    recordAction(POPUP_ACTION_IDS.showHoverboard, { tabId: this.currentTab?.id }, 'popup')
    if (this._onAction) this._onAction({ actionId: POPUP_ACTION_IDS.showHoverboard, payload: { tabId: this.currentTab?.id } })
    try {
      // Check if we can inject into this tab
      if (!this.canInjectIntoTab(this.currentTab)) {
        this.uiManager.showError('Hoverboard is not available on this page (e.g., Chrome Web Store, New Tab, or Settings).')
        return
      }

      const toggleResponse = await this.sendToTab({
        type: 'TOGGLE_HOVER',
        data: {
          bookmark: this.currentPin,
          tab: this.currentTab
        }
      })

      // [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] [TEST-POPUP_CLOSE_BEHAVIOR] Remove closePopup() call and add overlay state tracking
      // [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] [TEST-POPUP_CLOSE_BEHAVIOR] Use response data for immediate UI update
      if (toggleResponse && toggleResponse.data) {
        this.uiManager.updateShowHoverButtonState(toggleResponse.data.isVisible)
        debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] [TEST-POPUP_CLOSE_BEHAVIOR] Updated UI with toggle response:', toggleResponse.data)
      } else {
        // Fallback to querying overlay state
        await this.updateOverlayState()
      }
    } catch (error) {
      debugError('Show hoverboard error:', error)
      this.errorHandler.handleError('Failed to toggle hoverboard', error)
    }
  }

  /**
   * [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Handle toggle private status (popup stays open).
   */
  async handleTogglePrivate () {
    recordAction(POPUP_ACTION_IDS.togglePrivate, { hasBookmark: !!this.currentPin }, 'popup')
    if (this._onAction) this._onAction({ actionId: POPUP_ACTION_IDS.togglePrivate, payload: { hasBookmark: !!this.currentPin } })
    try {
      this.setLoading(true)

      if (this.currentPin) {
        // Toggle private status on existing bookmark
        const isPrivate = this.currentPin.shared === 'no'
        const newSharedStatus = isPrivate ? 'yes' : 'no'

        const updatedPin = {
          ...this.currentPin,
          shared: newSharedStatus
        }
        const preferredBackendToggle = this.getSelectedStorageBackend()
        if (preferredBackendToggle) updatedPin.preferredBackend = preferredBackendToggle

        const response = await this.sendMessage({
          type: 'saveBookmark',
          data: updatedPin
        })

        this.currentPin.shared = newSharedStatus
        this.stateManager.setState({ currentPin: this.currentPin })
        this.uiManager.updatePrivateStatus(newSharedStatus === 'no')
        this.uiManager.showSuccess(`Bookmark is now ${isPrivate ? 'public' : 'private'}`)

        // [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TOGGLE_SYNC] - Notify overlay of changes (if visible)
        try {
          await this.sendToTab({
            type: 'BOOKMARK_UPDATED',
            data: updatedPin
          })
        } catch (error) {
          debugError('[IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TOGGLE_SYNC] Failed to notify overlay:', error)
          // Don't fail the entire operation if overlay notification fails
        }
      } else {
        // Create new bookmark with private status set to 'yes' (private by default when toggling)
        await this.createBookmark([], 'yes')
        this.uiManager.updatePrivateStatus(true)
        this.uiManager.showSuccess('Bookmark created as private')
      }
    } catch (error) {
      this.errorHandler.handleError('Failed to toggle private status', error)
    } finally {
      this.setLoading(false)
    }
  }

  /**
   * Handle read later action - toggles the toread attribute
   */
  async handleReadLater () {
    const hasPersistedBookmark = this.isPersistedBookmark()
    recordAction(POPUP_ACTION_IDS.readLater, { hasBookmark: hasPersistedBookmark }, 'popup')
    if (this._onAction) this._onAction({ actionId: POPUP_ACTION_IDS.readLater, payload: { hasBookmark: hasPersistedBookmark } })
    try {
      this.setLoading(true)

      if (hasPersistedBookmark) {
        // Toggle toread attribute on existing bookmark
        const isCurrentlyToRead = this.currentPin.toread === 'yes'
        const newToReadStatus = isCurrentlyToRead ? 'no' : 'yes'

        const updatedPin = {
          ...this.currentPin,
          toread: newToReadStatus,
          description: this.getBetterDescription(this.currentPin?.description, this.currentTab?.title)
        }
        const preferredBackendRead = this.getSelectedStorageBackend()
        if (preferredBackendRead) updatedPin.preferredBackend = preferredBackendRead

        const response = await this.sendMessage({
          type: 'saveBookmark',
          data: updatedPin
        })

        this.currentPin.toread = newToReadStatus
        this.stateManager.setState({ currentPin: this.currentPin })
        this.uiManager.updateReadLaterStatus(newToReadStatus === 'yes')

        const statusMessage = newToReadStatus === 'yes' ? 'Added to read later' : 'Removed from read later'
        this.uiManager.showSuccess(statusMessage)

        // [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TOGGLE_SYNC] - Notify overlay of changes (if visible)
        try {
          await this.sendToTab({
            type: 'BOOKMARK_UPDATED',
            data: updatedPin
          })
        } catch (error) {
          debugError('[IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TOGGLE_SYNC] Failed to notify overlay:', error)
          // Don't fail the entire operation if overlay notification fails
        }
      } else {
        const selectedBackend = this.getSelectedStorageBackend()
        const resolution = await this.resolveReadLaterBackend(selectedBackend)
        const saveResult = await this.createReadLaterBookmark(resolution.effectiveBackend)
        this.applyReadLaterResult({
          saveResult,
          effectiveBackend: resolution.effectiveBackend,
          fallbackApplied: resolution.fallbackApplied
        })
      }
    } catch (error) {
      this.errorHandler.handleError('Failed to toggle read later status', error)
    } finally {
      this.setLoading(false)
    }
  }

  /**
   * Handle add tag action
   * [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] - Enhanced with user-driven recent tags tracking
   */
  async handleAddTag (tagText) {
    recordAction(POPUP_ACTION_IDS.addTag, { tag: tagText }, 'popup')
    if (this._onAction) this._onAction({ actionId: POPUP_ACTION_IDS.addTag, payload: { tag: tagText } })
    if (!tagText || !tagText.trim()) {
      this.errorHandler.handleError('Please enter a tag')
      return
    }

    try {
      this.setLoading(true)

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Sanitize and validate tags
      const newTags = tagText.trim().split(/\s+/).filter(tag => tag.length > 0)

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Validate each tag
      for (const tag of newTags) {
        if (!this.isValidTag(tag)) {
          this.errorHandler.handleError(`Invalid tag: ${tag}`)
          return
        }
      }

      if (this.currentPin) {
        // [IMPL-URL_TAGS_DISPLAY] Re-fetch current tags from backend and merge so prior tags are never lost
        const url = this.currentTab?.url || this.currentPin?.url
        let currentTagsArray = this.normalizeTags(this.currentPin.tags)
        if (url) {
          try {
            const fresh = await this.getBookmarkData(url)
            if (fresh && (fresh.tags?.length || this.currentPin?.tags?.length)) {
              currentTagsArray = this.normalizeTags(fresh.tags)
            }
          } catch (e) {
            debugError('[IMPL-URL_TAGS_DISPLAY] getBookmarkData before add tag failed, using currentPin', e)
          }
        }
        const allTags = [...new Set([...currentTagsArray, ...newTags])]
        await this.addTagsToBookmark(allTags)
      } else {
        // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Create new bookmark with tags
        await this.createBookmark(newTags)
      }

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] - Track newly added tags for current site only
      for (const tag of newTags) {
        try {
          await this.sendMessage({
            type: 'addTagToRecent',
            data: {
              tagName: tag,
              currentSiteUrl: this.currentTab?.url
            }
          })
        } catch (error) {
          debugError('[POPUP-CONTROLLER] [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] Failed to track tag addition:', error)
          // Don't fail the entire operation if tag tracking fails
        }
      }

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Clear the input
      this.uiManager.clearTagInput()

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] - Refresh recent tags after adding a tag
      await this.loadRecentTags()
    } catch (error) {
      this.errorHandler.handleError('Failed to add tags', error)

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Even on failure, update UI with current tags and recent tags
      if (this.currentPin) {
        const currentTagsArray = this.normalizeTags(this.currentPin.tags)
        this.uiManager.updateCurrentTags(currentTagsArray)
      }
      await this.loadRecentTags()
    } finally {
      this.setLoading(false)
    }
  }

  /**
   * [IMPL-SUGGESTED_TAGS] [IMPL-THIS_PAGE_TAG_SORT] [ARCH-SUGGESTED_TAGS] [ARCH-TAG_SYSTEM]
   * [REQ-SUGGESTED_TAGS_DEDUPLICATION] [REQ-SUGGESTED_TAGS_CASE_PRESERVATION] Persist a
   * side-panel case-mismatch as one atomic full-bookmark replacement.
   */
  async handleReplaceSuggestedTag ({ tag, matchedTag } = {}) {
    recordAction('replaceSuggestedTag', { tag, matchedTag }, 'side-panel')
    if (this._onAction) {
      this._onAction({
        actionId: 'replaceSuggestedTag',
        payload: { tag, matchedTag }
      })
    }

    const suggestedTag = sanitizeSuggestedTag(tag)
    if (!suggestedTag || typeof matchedTag !== 'string' || !matchedTag.trim()) {
      this.uiManager.showError('Invalid suggested tag')
      return
    }

    const url = this.currentTab?.url || this.currentPin?.url
    if (!url) {
      this.uiManager.showError('No URL to update')
      return
    }

    const previousPin = this.currentPin
    try {
      this.setLoading(true)
      const authoritativePin = await this.getBookmarkData(url)
      if (!authoritativePin) {
        throw new Error('No bookmark found')
      }

      const currentTags = this.normalizeTags(authoritativePin.tags)
      const replacement = replaceTagInPlace(currentTags, matchedTag, suggestedTag)
      if (!replacement.ok) {
        debugWarn('[IMPL-SUGGESTED_TAGS] [REQ-SUGGESTED_TAGS_DEDUPLICATION] Suggested tag match was stale; no save performed:', replacement.reason)
        this.uiManager.showError('Suggested tag is out of date')
        return
      }

      const pinData = {
        ...authoritativePin,
        tags: replacement.tags.join(' '),
        description: this.getBetterDescription(authoritativePin.description, this.currentTab?.title)
      }
      const preferredBackend = this.getSelectedStorageBackend()
      if (preferredBackend) pinData.preferredBackend = preferredBackend

      const response = await this.sendMessage({
        type: 'saveBookmark',
        data: pinData
      })
      if (response?.success === false || response?.error) {
        throw new Error(response.error || response.message || 'Failed to save suggested tag replacement')
      }

      this.currentPin = pinData
      this.stateManager.setState({ currentPin: this.currentPin })
      this.uiManager.updateCurrentTags(replacement.tags)
      this.uiManager.showSuccess('Tag casing updated')
      await this.loadRecentTags()
      await this.refreshTagFrequencyMapForSort()
      this.uiManager.redrawTagChipsFromCache()
      await this.loadSuggestedTags()

      try {
        await this.notifyOverlayOfTagChanges(replacement.tags)
        await this.sendToTab({
          type: 'BOOKMARK_UPDATED',
          data: pinData
        })
      } catch (notifyError) {
        debugError('[IMPL-BOOKMARK_STATE_SYNC] [REQ-SUGGESTED_TAGS_CASE_PRESERVATION] Failed to notify overlay after suggested tag replacement:', notifyError)
      }
    } catch (error) {
      this.currentPin = previousPin
      this.errorHandler.handleError('Failed to replace suggested tag', error)
      this.uiManager.showError(error.message || 'Failed to update tag casing')
    } finally {
      this.setLoading(false)
    }
  }

  /**
   * Handle remove tag action
   */
  async handleRemoveTag (tagToRemove) {
    recordAction(POPUP_ACTION_IDS.removeTag, { tag: tagToRemove }, 'popup')
    if (this._onAction) this._onAction({ actionId: POPUP_ACTION_IDS.removeTag, payload: { tag: tagToRemove } })
    if (!this.currentPin) {
      this.errorHandler.handleError('No bookmark found')
      return
    }

    try {
      this.setLoading(true)

      // [IMPL-URL_TAGS_DISPLAY] Re-fetch current tags so we remove from authoritative list
      const url = this.currentTab?.url || this.currentPin?.url
      let currentTagsArray = this.normalizeTags(this.currentPin.tags)
      if (url) {
        try {
          const fresh = await this.getBookmarkData(url)
          if (fresh?.tags?.length) currentTagsArray = this.normalizeTags(fresh.tags)
        } catch (e) {
          debugError('[IMPL-URL_TAGS_DISPLAY] getBookmarkData before remove tag failed', e)
        }
      }
      const tagsArray = currentTagsArray.filter(tag => tag !== tagToRemove)
      await this.addTagsToBookmark(tagsArray)

      // Recent tags are refreshed in addTagsToBookmark
    } catch (error) {
      this.errorHandler.handleError('Failed to remove tag', error)
    } finally {
      this.setLoading(false)
    }
  }

  /**
   * Add tags to bookmark
   * [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Enhanced with tag tracking and validation
   */
  async addTagsToBookmark (tags) {
    // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Validate all tags before saving
    for (const tag of tags) {
      if (!this.isValidTag(tag)) {
        this.errorHandler.handleError(`Invalid tag: ${tag}`)
        return
      }
    }

    const tagsString = tags.join(' ')

    const pinData = {
      ...this.currentPin,
      tags: tagsString,
      description: this.getBetterDescription(this.currentPin?.description, this.currentTab?.title)
    }
    const preferredBackendTag = this.getSelectedStorageBackend()
    if (preferredBackendTag) pinData.preferredBackend = preferredBackendTag

    const response = await this.sendMessage({
      type: 'saveBookmark',
      data: pinData
    })

    // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Update current pin with new tags
    this.currentPin.tags = tagsString
    this.stateManager.setState({ currentPin: this.currentPin })
    this.uiManager.updateCurrentTags(tags)
    this.uiManager.showSuccess('Tags updated successfully')

    // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Refresh recent tags after updating bookmark
    await this.loadRecentTags()
    await this.refreshTagFrequencyMapForSort()
    this.uiManager.redrawTagChipsFromCache()

    // [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TAG_SYNC] - Notify overlay of tag changes
    await this.notifyOverlayOfTagChanges(tags)

    // [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TAG_SYNC] - Also send BOOKMARK_UPDATED to ensure overlay updates tags
    try {
      await this.sendToTab({
        type: 'BOOKMARK_UPDATED',
        data: pinData
      })
    } catch (error) {
      debugError('[IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TAG_SYNC] Failed to notify overlay of BOOKMARK_UPDATED after tag change:', error)
    }
  }

  /**
   * [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TAG_SYNC] - Notify overlay of tag changes
   * @param {string[]} tags - Array of updated tags
   */
  async notifyOverlayOfTagChanges (tags) {
    try {
      // [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TAG_SYNC] Send TAG_UPDATED message to overlay/content script
      const updatedBookmark = {
        url: this.currentTab?.url,
        description: this.currentTab?.title,
        tags
      }
      await this.sendToTab({
        type: 'TAG_UPDATED',
        data: updatedBookmark
      })
    } catch (error) {
      debugError('[IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TAG_SYNC] Failed to notify overlay of TAG_UPDATED:', error)
      // Don't fail the entire operation if overlay notification fails
    }
  }

  /**
   * Create new bookmark
   * [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Enhanced with tag tracking and validation
   */
  async createBookmark (
    tags,
    sharedStatus = 'yes',
    toreadStatus = 'no',
    preferredBackendOverride = null,
    { suppressSuccess = false } = {}
  ) {
    // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Validate all tags before creating bookmark
    for (const tag of tags) {
      if (!this.isValidTag(tag)) {
        this.errorHandler.handleError(`Invalid tag: ${tag}`)
        return
      }
    }

    const tagsString = tags.join(' ')

    const pinData = {
      url: this.currentTab.url,
      description: this.currentTab.title,
      tags: tagsString,
      shared: sharedStatus,
      toread: toreadStatus
    }

    // [REQ-STORAGE_MODE_DEFAULT] Save follows highlight: pass UI-selected backend so router uses it for new bookmarks.
    const preferredBackend = SAVE_TO_BACKENDS.includes(preferredBackendOverride)
      ? preferredBackendOverride
      : this.getSelectedStorageBackend()
    if (preferredBackend) pinData.preferredBackend = preferredBackend

    const response = await this.sendMessage({
      type: 'saveBookmark',
      data: pinData
    })
    if (response?.success === false || response?.error) {
      throw new Error(response.error || response.message || 'Failed to create bookmark')
    }

    // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Update current pin with new bookmark data
    this.currentPin = pinData
    this.stateManager.setState({ currentPin: this.currentPin })
    this.uiManager.updateCurrentTags(tags)
    if (!suppressSuccess) {
      this.uiManager.showSuccess('Bookmark created successfully')
    }

    // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Refresh recent tags after creating bookmark
    await this.loadRecentTags()
    await this.refreshTagFrequencyMapForSort()
    this.uiManager.redrawTagChipsFromCache()
    return { success: true, bookmark: this.currentPin, response }
  }

  /**
   * Handle search action - now uses tab search functionality
   */
  async handleSearch (searchText) {
    recordAction(POPUP_ACTION_IDS.search, { searchText }, 'popup')
    if (this._onAction) this._onAction({ actionId: POPUP_ACTION_IDS.search, payload: { searchText } })
    debugLog('[SEARCH-UI] Starting search:', { searchText, currentTab: this.currentTab })

    if (!searchText || !searchText.trim()) {
      this.errorHandler.handleError('Please enter search terms')
      return
    }

    // Check if popup is still initializing
    if (!this.isInitialized) {
      debugLog('[SEARCH-UI] Popup not yet initialized, waiting...')
      this.errorHandler.handleError('Please wait for popup to finish loading')
      return
    }

    // If currentTab is not available, try to get it
    if (!this.currentTab || !this.currentTab.id) {
      debugLog('[SEARCH-UI] No current tab available, attempting to get current tab')
      try {
        this.currentTab = await this.getCurrentTab()
        debugLog('[SEARCH-UI] Retrieved current tab:', this.currentTab)
      } catch (error) {
        debugError('[SEARCH-UI] Failed to get current tab:', error)
        this.errorHandler.handleError('Unable to get current tab information')
        return
      }
    }

    if (!this.currentTab || !this.currentTab.id) {
      this.errorHandler.handleError('No current tab available')
      return
    }

    let scrollContainer = null
    let savedScrollTop
    try {
      scrollContainer = this.uiManager?.container
      savedScrollTop = scrollContainer ? scrollContainer.scrollTop : undefined
      this.setLoading(true)

      debugLog('[SEARCH-UI] Sending search message with tab ID:', this.currentTab.id)
      const response = await this.sendMessage({
        type: 'searchTabs',
        data: { searchText: searchText.trim() }
      })

      debugLog('[SEARCH-UI] Received response:', response)

      if (response.success) {
        this.uiManager.showSuccess(`Found ${response.matchCount} matching tabs - navigating to "${response.tabTitle}"`)
      } else {
        // [IMPL-TAB_SEARCH_NO_MATCH_UI] [ARCH-TAB_SEARCH_NO_MATCH_FEEDBACK] [REQ-TAB_SEARCH_NO_MATCH_UX] No-match: visual feedback only, no error message.
        const isNoMatch = response.message === 'No matching tabs found' || response.matchCount === 0
        if (isNoMatch) {
          this.uiManager.showSearchNoMatchFeedback()
        } else {
          this.uiManager.showError(response.message || 'No matching tabs found')
        }
      }
    } catch (error) {
      debugError('[SEARCH-UI] Search error:', error)
      this.errorHandler.handleError('Failed to search tabs', error)
    } finally {
      this.setLoading(false)
      if (scrollContainer != null && savedScrollTop !== undefined) {
        scrollContainer.scrollTop = savedScrollTop
      }
    }
  }

  /**
   * [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] [TEST-POPUP_CLOSE_BEHAVIOR] Handle delete bookmark action
   * Modified to NOT close popup after deletion - popup stays open for continued interaction
   */
  async handleDeletePin () {
    recordAction(POPUP_ACTION_IDS.deletePin, { url: this.currentPin?.url }, 'popup')
    if (this._onAction) this._onAction({ actionId: POPUP_ACTION_IDS.deletePin, payload: { url: this.currentPin?.url } })
    if (!this.currentPin) {
      this.errorHandler.handleError('No bookmark found to delete')
      return
    }

    // Confirm deletion
    const globalConfirm = typeof globalThis !== 'undefined' && typeof globalThis.confirm === 'function'
      ? globalThis.confirm
      : (typeof window !== 'undefined' && typeof window.confirm === 'function' ? window.confirm : null)
    if (globalConfirm && !globalConfirm('Are you sure you want to delete this bookmark?')) {
      return
    }

    try {
      this.setLoading(true)

      const response = await this.sendMessage({
        type: 'deleteBookmark',
        data: { url: this.currentPin.url }
      })

      this.currentPin = null
      this.stateManager.setState({ currentPin: null })
      this.uiManager.updateCurrentTags([])
      this.uiManager.updatePrivateStatus(false)
      this.uiManager.showSuccess('Bookmark deleted successfully')

      // Refresh hover data
      await this.sendToTab({ message: 'refreshData' })

      // [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] [TEST-POPUP_CLOSE_BEHAVIOR] Popup stays open - user can continue working
    } catch (error) {
      this.errorHandler.handleError('Failed to delete bookmark', error)
    } finally {
      this.setLoading(false)
    }
  }

  /**
   * [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] [TEST-POPUP_CLOSE_BEHAVIOR] Handle reload extension action
   * Modified to NOT close popup after reload - popup stays open for continued interaction
   */
  async handleReloadExtension () {
    recordAction(POPUP_ACTION_IDS.reloadExtension, undefined, 'popup')
    if (this._onAction) this._onAction({ actionId: POPUP_ACTION_IDS.reloadExtension, payload: undefined })
    try {
      // Extension reload doesn't need a message - just reload the tab
      if (this.currentTab) {
        await chrome.tabs.reload(this.currentTab.id)
      }
      this.uiManager.showSuccess('Extension reloaded successfully')
      // [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] [TEST-POPUP_CLOSE_BEHAVIOR] Popup stays open - user can continue working
    } catch (error) {
      this.errorHandler.handleError('Failed to reload extension', error)
    }
  }

  /**
   * [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] [TEST-POPUP_CLOSE_BEHAVIOR] Handle open options action
   * Modified to NOT close popup after opening options - popup stays open for continued interaction
   */
  async handleOpenOptions () {
    recordAction(POPUP_ACTION_IDS.openOptions, undefined, 'popup')
    if (this._onAction) this._onAction({ actionId: POPUP_ACTION_IDS.openOptions, payload: undefined })
    try {
      chrome.runtime.openOptionsPage()
      this.uiManager.showSuccess('Options page opened in new tab')
      // [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] [TEST-POPUP_CLOSE_BEHAVIOR] Popup stays open - user can continue working
    } catch (error) {
      this.errorHandler.handleError('Failed to open options', error)
    }
  }

  /**
   * [REQ-LIBRARY_SEARCH_ENTRY] [ARCH-LIBRARY_SEARCH_ENTRY] [IMPL-LIBRARY_SEARCH_ENTRY]
   * Open Index with library query (not tab search).
   */
  async handleLibrarySearch (query) {
    const q = String(query || '').trim()
    try {
      await this.sendMessage({ type: MESSAGE_TYPES.OPEN_BOOKMARKS_INDEX, data: { q } })
    } catch (e) {
      debugError('[IMPL-LIBRARY_SEARCH_ENTRY] open index failed:', e)
      this.uiManager.showError('Failed to open bookmarks search')
    }
  }

  /**
   * [IMPL-PAGE_ARCHIVE_STATUS_UI] [ARCH-PAGE_ARCHIVE_STATUS_UI] [REQ-PAGE_ARCHIVE_STATUS_UI]
   * Clear status immediately when the current URL or selected backend changes.
   */
  resetArchiveArtifactStatus (backend = null) {
    const normalizedBackend = typeof backend === 'string' ? backend.toLowerCase() : null
    this._archiveArtifactStatus = {
      ...EMPTY_ARCHIVE_ARTIFACT_STATUS,
      backend: normalizedBackend
    }
    this.uiManager?.updateArchiveArtifactStatus?.(this._archiveArtifactStatus)
  }

  /**
   * [IMPL-PAGE_ARCHIVE_STATUS_UI] [ARCH-PAGE_ARCHIVE_STATUS_UI] [REQ-PAGE_ARCHIVE_STATUS_UI]
   * Query both persisted artifact legs with an explicit selected backend.
   */
  async querySelectedBackendArtifactStatus (url, backend, contextKey) {
    if (!url || !isArchiveCapableBackend(backend)) {
      const status = normalizeArchiveArtifactStatus({ backend })
      if (contextKey === this._archiveStatusContextKey) {
        this._archiveArtifactStatus = status
        this.uiManager?.updateArchiveArtifactStatus?.(status)
      }
      return status
    }

    const request = (type) => this.sendMessage({
      type,
      data: { url, backend }
    }).catch(error => {
      debugWarn('[IMPL-PAGE_ARCHIVE_STATUS_UI] Selected-backend artifact status query failed:', {
        type,
        url,
        backend,
        error: error?.message
      })
      return null
    })
    const [archiveResponse, screenshotResponse] = await Promise.all([
      request('GET_PAGE_ARCHIVE'),
      request('GET_PAGE_SCREENSHOTS')
    ])

    if (contextKey !== this._archiveStatusContextKey) {
      debugLog('[IMPL-PAGE_ARCHIVE_STATUS_UI] Discarded stale artifact status response:', {
        contextKey,
        currentContextKey: this._archiveStatusContextKey
      })
      return this._archiveArtifactStatus
    }

    const status = normalizeArchiveArtifactStatus({
      backend,
      archiveResponse,
      screenshotResponse
    })
    this._archiveArtifactStatus = status
    this.uiManager?.updateArchiveArtifactStatus?.(status)
    return status
  }

  /**
   * [IMPL-PAGE_ARCHIVE_STATUS_UI] [ARCH-PAGE_ARCHIVE_STATUS_UI] [REQ-PAGE_ARCHIVE_STATUS_UI]
   * Reset, query, and apply status for the current URL/backend context.
   */
  async refreshArchiveArtifactStatus ({
    url = this.currentTab?.url,
    backend = this._resolvedStorageBackend || this.getSelectedStorageBackend(),
    force = false
  } = {}) {
    const contextKey = `${url || ''}|${backend || ''}`
    if (force || contextKey !== this._archiveStatusContextKey) {
      this._archiveStatusContextKey = contextKey
      this.resetArchiveArtifactStatus(backend)
    }
    return this.querySelectedBackendArtifactStatus(url, backend, contextKey)
  }

  /**
   * [IMPL-PAGE_ARCHIVE_STATUS_UI] [ARCH-PAGE_ARCHIVE_STATUS_UI] [REQ-PAGE_ARCHIVE_STATUS_UI]
   * Refresh only the artifact leg affected by a successful capture.
   */
  async refreshArchiveStatusAfterCapture (captureKind) {
    const url = this.currentPin?.url || this.currentTab?.url
    const backend = this._resolvedStorageBackend || this.getSelectedStorageBackend()
    const contextKey = `${url || ''}|${backend || ''}`
    if (!url || !isArchiveCapableBackend(backend) || contextKey !== this._archiveStatusContextKey) return

    const type = captureKind === 'screenshot' ? 'GET_PAGE_SCREENSHOTS' : 'GET_PAGE_ARCHIVE'
    let response = null
    try {
      response = await this.sendMessage({ type, data: { url, backend } })
    } catch (error) {
      debugWarn('[IMPL-PAGE_ARCHIVE_STATUS_UI] Post-capture status query failed:', {
        type,
        url,
        backend,
        error: error?.message
      })
    }
    if (contextKey !== this._archiveStatusContextKey) return

    const next = normalizeArchiveArtifactStatus({
      backend,
      archiveResponse: captureKind === 'screenshot' ? null : response,
      screenshotResponse: captureKind === 'screenshot' ? response : null
    })
    this._archiveArtifactStatus = {
      ...this._archiveArtifactStatus,
      ...(captureKind === 'screenshot'
        ? {
            screenshotSaved: next.screenshotSaved,
            screenshotArtifactId: next.screenshotArtifactId
          }
        : {
            archiveSaved: next.archiveSaved,
            archiveArtifactId: next.archiveArtifactId,
            readerAvailable: next.readerAvailable
          })
    }
    this.uiManager?.updateArchiveArtifactStatus?.(this._archiveArtifactStatus)
  }

  /**
   * [IMPL-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE]
   * Capture the current This Page explicitly; only Local/File storage can create durable archives and selected-backend bookmarks.
   */
  async handleCapturePageArchive () {
    const url = this.currentPin?.url || this.currentTab?.url
    const backend = this.getSelectedStorageBackend()
    if (!url || !['local', 'file'].includes(backend)) {
      this.uiManager.showError('Page archives are available for Local or File storage only.')
      return
    }
    try {
      const result = await this.sendMessage({
        type: 'CAPTURE_PAGE_ARCHIVE',
        data: { tabId: this.currentTab?.id, url, preferredBackend: backend }
      })
      if (result?.success) {
        await this.refreshArchiveStatusAfterCapture('archive')
        const message = result.bookmarkCreated
          ? 'Bookmark and page archive saved. Open Bookmarks Index → search scope Archived content.'
          : 'Page archive saved. Open Bookmarks Index → search scope Archived content.'
        this.uiManager.showSuccess(message)
      } else if (result?.cleanupFailed) {
        this.uiManager.showActionError(`Page archive saved, but bookmark association cleanup failed: ${result.compensationError || 'unknown error'}`)
      } else {
        this.uiManager.showActionError(result?.error || result?.code || 'Page archive failed')
      }
    } catch (error) {
      debugError('[IMPL-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] capture page archive failed:', error)
      this.uiManager.showActionError(error?.message || 'Page archive failed')
    }
  }

  /**
   * [REQ-PAGE_SCREENSHOT_ARCHIVE] [ARCH-PAGE_SCREENSHOT_ARCHIVE] [IMPL-PAGE_SCREENSHOT_ARCHIVE]
   * Capture a dedicated product screenshot for the current Local/File page.
   */
  async handleCapturePageScreenshot () {
    const url = this.currentPin?.url || this.currentTab?.url
    const backend = this.getSelectedStorageBackend()
    if (!url || !['local', 'file'].includes(backend)) {
      this.uiManager.showError('Page screenshots are available for Local or File storage only.')
      return
    }
    try {
      const result = await this.sendMessage({
        type: 'CAPTURE_PAGE_SCREENSHOT',
        data: { tabId: this.currentTab?.id, url, backend, options: { format: 'png', fullPage: false } }
      })
      if (result?.success) {
        await this.refreshArchiveStatusAfterCapture('screenshot')
        this.uiManager.showSuccess('Page screenshot saved')
      } else this.uiManager.showError(result?.error || result?.code || 'Page screenshot failed')
    } catch (error) {
      debugError('[IMPL-PAGE_SCREENSHOT_ARCHIVE] capture page screenshot failed:', error)
      this.uiManager.showError('Page screenshot failed')
    }
  }

  /**
   * [REQ-OFFLINE_READER_MODE] [ARCH-OFFLINE_READER_MODE] [IMPL-OFFLINE_READER_MODE]
   * Open the standalone Reader page; its content is loaded only from stored archive messages.
   */
  async handleOpenOfflineReader () {
    const url = this.currentPin?.url || this.currentTab?.url
    if (!url) return
    // [IMPL-PAGE_ARCHIVE_STATUS_UI] [ARCH-PAGE_ARCHIVE_STATUS_UI] [REQ-PAGE_ARCHIVE_STATUS_UI]
    // Keep the click boundary defensive even if a stale DOM event bypasses disabled state.
    if (this._archiveArtifactStatus.readerAvailable !== true || this.uiManager?.elements?.openReaderBtn?.disabled) {
      this.uiManager?.showError?.('Offline Reader is unavailable until a readable page archive is saved.')
      return
    }
    const backend = this._resolvedStorageBackend || this.getSelectedStorageBackend()
    const params = new URLSearchParams({
      url,
      backend: backend || ''
    })
    if (this._archiveArtifactStatus.archiveArtifactId) {
      params.set('archiveId', this._archiveArtifactStatus.archiveArtifactId)
    }
    const readerUrl = `${chrome.runtime.getURL('src/ui/reader/reader.html')}?${params.toString()}`
    await chrome.tabs.create({ url: readerUrl })
  }

  /**
   * [REQ-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX]
   * Open Local Bookmarks Index via SW OPEN_BOOKMARKS_INDEX_TAB (create tab + dismiss side panel).
   */
  async handleOpenBookmarksIndex () {
    recordAction(POPUP_ACTION_IDS.openBookmarksIndex, undefined, 'popup')
    if (this._onAction) this._onAction({ actionId: POPUP_ACTION_IDS.openBookmarksIndex, payload: undefined })
    try {
      await this.sendMessage({ type: MESSAGE_TYPES.OPEN_BOOKMARKS_INDEX })
      this.uiManager.showSuccess('Bookmarks index opened in new tab')
    } catch (error) {
      this.errorHandler.handleError('Failed to open bookmarks index', error)
    }
  }

  /**
   * [REQ-BROWSER_BOOKMARK_IMPORT] [ARCH-BROWSER_BOOKMARK_IMPORT] [IMPL-BROWSER_BOOKMARK_IMPORT]
   * Open the browser bookmark import page in a new tab.
   */
  handleOpenBrowserBookmarkImport () {
    recordAction(POPUP_ACTION_IDS.openBrowserBookmarkImport, undefined, 'popup')
    if (this._onAction) this._onAction({ actionId: POPUP_ACTION_IDS.openBrowserBookmarkImport, payload: undefined })
    try {
      const url = chrome.runtime.getURL('src/ui/browser-bookmark-import/browser-bookmark-import.html')
      chrome.tabs.create({ url })
      this.uiManager.showSuccess('Browser bookmark import opened in new tab')
    } catch (error) {
      this.errorHandler.handleError('Failed to open browser bookmark import', error)
    }
  }

  /**
   * [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]
   * Open the tags and bookmarks tree in the side panel. Implements requirement "open tags tree from popup" by sending OPEN_SIDE_PANEL to the service worker (which opens the panel with cached windowId); records action, shows success or delegates error to ErrorHandler.
   */
  /**
   * [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_BOOKMARK] When onOpenTagsTreeInPanel is set (side panel Bookmark tab),
   * call it instead of sending OPEN_SIDE_PANEL so the panel switches to the Tags tree tab.
   */
  async handleOpenTagsTree () {
    recordAction(POPUP_ACTION_IDS.openTagsTree, undefined, 'popup')
    if (this._onAction) this._onAction({ actionId: POPUP_ACTION_IDS.openTagsTree, payload: undefined })
    if (typeof this.onOpenTagsTreeInPanel === 'function') {
      this.onOpenTagsTreeInPanel()
      return
    }
    try {
      await this.sendMessage({ type: MESSAGE_TYPES.OPEN_SIDE_PANEL })
      this.uiManager.showSuccess('Tags tree opened in side panel')
    } catch (error) {
      this.errorHandler.handleError('Failed to open tags tree', error)
    }
  }

  /**
   * [REQ-AI_TAGGING_POPUP] [ARCH-AI_TAGGING_FLOW] [IMPL-AI_TAGGING_POPUP_UI]
   * Submit current page to AI for tagging: Readability → AI tags → session split → save/suggested.
   */
  async handleTagWithAi () {
    const btn = this.uiManager.elements.tagWithAiBtn
    if (btn) btn.disabled = true
    try {
      // [IMPL-AI_TAGGING_POPUP_UI] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] Guard: require tab, http(s) URL, and API key.
      if (!this.currentTab || !this.currentTab.id) {
        this.uiManager.showError('No tab available')
        return
      }
      const url = (this.currentTab.url || '').trim()
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        this.uiManager.showError('AI tagging is not available on this page')
        return
      }
      const config = await this.configManager.getConfig()
      const apiKey = (config.aiApiKey || '').trim()
      if (!apiKey) {
        this.uiManager.showError('Set an AI API key in Options to use Tag with AI')
        return
      }

      // [IMPL-AI_TAGGING_POPUP_UI] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] GET_PAGE_CONTENT via SW; show content.error or generic message when no text.
      const content = await this.sendMessage({
        type: 'GET_PAGE_CONTENT',
        data: { tabId: this.currentTab.id }
      })
      const text = (content?.textContent ?? content?.data?.textContent ?? '').trim()
      if (!text) {
        const msg = (content?.success === false && content?.error) ? content.error : 'Could not extract page content for tagging'
        this.uiManager.showError(msg)
        return
      }

      // [IMPL-AI_TAGGING_POPUP_UI] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] GET_AI_TAGS from SW; require success and non-empty tags.
      const aiRes = await this.sendMessage({
        type: 'GET_AI_TAGS',
        data: { text }
      })
      const aiTags = Array.isArray(aiRes?.tags) ? aiRes.tags : []
      if (!aiRes?.success || aiTags.length === 0) {
        const msg = aiRes?.error || 'No tags returned from AI'
        this.uiManager.showError(msg)
        return
      }

      // [IMPL-AI_TAGGING_POPUP_UI] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] getSessionTags + splitAiTagsBySession → inSession vs suggested.
      const sessionRes = await this.sendMessage({ type: 'getSessionTags' })
      const sessionTags = Array.isArray(sessionRes?.tags) ? sessionRes.tags : []
      const { inSession, suggested } = splitAiTagsBySession(aiTags, sessionTags)

      const currentTags = this.normalizeTags(this.currentPin?.tags || [])
      const mergedTags = [...new Set([...currentTags, ...inSession])]

      if (!this.currentPin || !this.currentPin.url) {
        // [IMPL-AI_TAGGING_POPUP_UI] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] [REQ-STORAGE_MODE_DEFAULT] Create new bookmark with preferredBackend from getStorageMode().
        const preferredBackend = await this.configManager.getStorageMode()
        const pinData = {
          url: this.currentTab.url,
          description: content?.title || this.currentTab?.title || 'Untitled',
          tags: mergedTags.join(' '),
          shared: 'yes',
          toread: 'no',
          preferredBackend: preferredBackend || undefined
        }
        await this.sendMessage({ type: 'saveBookmark', data: pinData })
        this.currentPin = pinData
        this.stateManager.setState({ currentPin: this.currentPin })
        this.uiManager.updateCurrentTags(mergedTags)
        this.uiManager.showSuccess('Bookmark created with AI tags')
      } else {
        // [IMPL-AI_TAGGING_POPUP_UI] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] [REQ-STORAGE_MODE_DEFAULT] Update existing bookmark: merged tags, preferredBackend from selection or default.
        const pinData = {
          ...this.currentPin,
          tags: mergedTags.join(' '),
          description: this.getBetterDescription(this.currentPin?.description, content?.title || this.currentTab?.title)
        }
        const preferredBackend = this.getSelectedStorageBackend()
        if (preferredBackend) pinData.preferredBackend = preferredBackend
        await this.sendMessage({ type: 'saveBookmark', data: pinData })
        this.currentPin.tags = pinData.tags
        this.stateManager.setState({ currentPin: this.currentPin })
        this.uiManager.updateCurrentTags(mergedTags)
        this.uiManager.showSuccess('Tags updated with AI suggestions')
      }

      // [IMPL-AI_TAGGING_POPUP_UI] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] updateSuggestedTags, loadRecentTags, notify tab (BOOKMARK_UPDATED).
      this.uiManager.updateSuggestedTags(suggested)
      await this.loadRecentTags()
      try {
        await this.sendToTab({ type: 'BOOKMARK_UPDATED', data: this.currentPin })
      } catch (_) { /* ignore */ }
    } catch (error) {
      debugError('[REQ-AI_TAGGING_POPUP] handleTagWithAi failed:', error)
      this.uiManager.showError(error?.message || 'AI tagging failed')
    } finally {
      if (btn) btn.disabled = false
    }
  }

  /**
   * [REQ-AI_TAGGING_CONFIG] [IMPL-AI_TAG_TEST] Test AI API key from popup (same as options page).
   */
  async handleTestAiApiKey () {
    const statusEl = this.uiManager.elements.popupAiTestStatus
    // [IMPL-AI_TAG_TEST] [ARCH-AI_TAGGING_CONFIG] [REQ-AI_TAGGING_CONFIG] No status element; skip.
    if (!statusEl) return
    try {
      // [IMPL-AI_TAG_TEST] [ARCH-AI_TAGGING_CONFIG] [REQ-AI_TAGGING_CONFIG] Load config; require apiKey or show "Set API key in Options first".
      const config = await this.configManager.getConfig()
      const apiKey = (config.aiApiKey || '').trim()
      const provider = config.aiProvider || 'openai'
      if (!apiKey) {
        statusEl.textContent = 'Set API key in Options first'
        return
      }
      // [IMPL-AI_TAG_TEST] [ARCH-AI_TAGGING_CONFIG] [REQ-AI_TAGGING_CONFIG] "Testing…" then testAiApiKey; set status to "API key OK" or error.
      statusEl.textContent = 'Testing…'
      const result = await testAiApiKey(apiKey, provider)
      if (result.ok) {
        statusEl.textContent = 'API key OK'
      } else {
        statusEl.textContent = result.error || 'Failed'
      }
    } catch (e) {
      // [IMPL-AI_TAG_TEST] [ARCH-AI_TAGGING_CONFIG] [REQ-AI_TAGGING_CONFIG] Catch: show error message in status.
      statusEl.textContent = `Error: ${e?.message || 'Unknown'}`
    }
  }

  /**
   * Get better description for bookmark
   */
  getBetterDescription (currentDescription, pageTitle) {
    if (currentDescription && currentDescription.trim()) {
      return currentDescription
    }
    return pageTitle || 'Untitled'
  }

  /**
   * Close the popup
   */
  closePopup () {
    setTimeout(() => window.close(), 100)
  }

  /**
   * [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] [TEST-POPUP_CLOSE_BEHAVIOR] Update popup UI to reflect overlay state
   */
  async updateOverlayState () {
    if (!this.currentTab) {
      this.uiManager.updateShowHoverButtonState(false)
      return
    }
    const classif = classifyScriptInjectionUrl(this.currentTab.url)
    if (!classif.injectable) {
      debugLog('[IMPL-POPUP_SESSION] Skipping overlay state on non-scriptable URL:', classif.reason)
      this._recordInjectionOutcome({
        phase: 'overlay_state',
        reason: classif.reason,
        injectable: false
      })
      this.uiManager.updateShowHoverButtonState(false)
      return
    }
    try {
      // Query overlay state from content script
      const overlayState = await this.sendToTab({
        type: 'GET_OVERLAY_STATE'
      })

      // [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] [TEST-POPUP_CLOSE_BEHAVIOR] Handle response data structure
      const stateData = overlayState.data || overlayState

      // Update button appearance based on overlay visibility
      this.uiManager.updateShowHoverButtonState(stateData.isVisible)

      debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] [TEST-POPUP_CLOSE_BEHAVIOR] Updated overlay state:', stateData)
    } catch (error) {
      const expectedReason = classifyScriptInjectionError(error)
      if (expectedReason) {
        debugWarn('[IMPL-POPUP_SESSION] Overlay state skip (non-scriptable):', expectedReason, error)
        this._recordInjectionOutcome({
          phase: 'overlay_state',
          reason: expectedReason,
          injectable: false,
          errorMessage: error?.message
        })
      } else {
        debugError('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] [TEST-POPUP_CLOSE_BEHAVIOR] Failed to update overlay state:', error)
        this._recordInjectionOutcome({
          phase: 'overlay_state',
          reason: 'ok',
          injectable: true,
          errorMessage: error?.message
        })
      }
      // [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] [TEST-POPUP_CLOSE_BEHAVIOR] Graceful degradation - fallback to default state
      this.uiManager.updateShowHoverButtonState(false)
    }
  }

  /**
   * Cleanup resources
   */
  cleanup () {
    // Remove event listeners if needed
    this.uiManager?.off('showHoverboard', this.handleShowHoverboard)
    this.uiManager?.off('togglePrivate', this.handleTogglePrivate)
    this.uiManager?.off('readLater', this.handleReadLater)
    this.uiManager?.off('addTag', this.handleAddTag)
    this.uiManager?.off('removeTag', this.handleRemoveTag)
    this.uiManager?.off('search', this.handleSearch)
    this.uiManager?.off('deletePin', this.handleDeletePin)
    this.uiManager?.off('reloadExtension', this.handleReloadExtension)
    this.uiManager?.off('openOptions', this.handleOpenOptions)
    this.uiManager?.off('openBookmarksIndex', this.handleOpenBookmarksIndex)
    this.uiManager?.off('openBrowserBookmarkImport', this.handleOpenBrowserBookmarkImport)
    this.uiManager?.off('openTagsTree', this.handleOpenTagsTree)
    this.uiManager?.off('capturePageArchive', this.handleCapturePageArchive)
    this.uiManager?.off('capturePageScreenshot', this.handleCapturePageScreenshot)
    this.uiManager?.off('openOfflineReader', this.handleOpenOfflineReader)
    this.uiManager?.off('retry', this.loadInitialData)
  }

  /**
   * [REQ-BOOKMARK_USAGE_TRACKING] [ARCH-BOOKMARK_USAGE_TRACKING_UI] [IMPL-BOOKMARK_USAGE_TRACKING_UI]
   * Fetch usage and inbound links for current tab URL and update This Page usage section.
   */
  async refreshUsageSection () {
    const url = this.currentTab?.url
    if (!url || typeof this.sendMessage !== 'function') return
    try {
      const [usageRes, inboundRes] = await Promise.all([
        this.sendMessage({ type: MESSAGE_TYPES.GET_BOOKMARK_USAGE, data: { url } }),
        this.sendMessage({ type: MESSAGE_TYPES.GET_BOOKMARK_INBOUND_LINKS, data: { url } })
      ])
      const usage = usageRes && typeof usageRes === 'object' ? usageRes : null
      const inbound = (Array.isArray(inboundRes) ? inboundRes : [])
        .filter((e) => e?.sourceUrl)
        .sort((a, b) => (b?.count ?? 0) - (a?.count ?? 0))
      const topReferrer = inbound[0]?.sourceUrl
      let topReferrerDisplay = ''
      if (topReferrer) {
        try {
          const u = new URL(topReferrer)
          topReferrerDisplay = u.hostname + (u.pathname && u.pathname !== '/' ? u.pathname.slice(0, 50) + (u.pathname.length > 50 ? '…' : '') : '')
        } catch (_) {
          topReferrerDisplay = topReferrer.slice(0, 50)
        }
      }
      const visitCount = usage?.visitCount ?? 0
      const lastVisitedAgoText = usage?.lastVisitedAt ? formatTimeAge(usage.lastVisitedAt) : ''
      this.uiManager.updateUsageSection(
        visitCount > 0 ? { visitCount, lastVisitedAgoText } : null,
        topReferrerDisplay
      )
    } catch (err) {
      debugError('[IMPL-BOOKMARK_USAGE_TRACKING_UI] refreshUsageSection failed:', err)
      this.uiManager.updateUsageSection(null, '')
    }
  }

  /**
   * [REQ-LINK_HEALTH] [IMPL-LINK_HEALTH]
   * When opt-in enabled, show compact stored health hint for current tab URL.
   */
  async refreshLinkHealthHint () {
    if (!this.uiManager?.setLinkHealthHint) return
    try {
      const config = await this.configManager.getConfig()
      const enabled = isLinkHealthChecksEnabled(config)
      if (!enabled) {
        this.uiManager.setLinkHealthHint('')
        return
      }
      const url = this.currentTab?.url
      if (!url || typeof this.sendMessage !== 'function') {
        this.uiManager.setLinkHealthHint('')
        return
      }
      const response = await this.sendMessage({ type: 'GET_LINK_HEALTH' })
      const map = response?.success ? (response.data || {}) : {}
      const rec = map[url]
      this.uiManager.setLinkHealthHint(formatLinkHealthHint(rec, { enabled: true }))
    } catch (err) {
      debugError('[IMPL-LINK_HEALTH] refreshLinkHealthHint failed:', err)
      this.uiManager.setLinkHealthHint('')
    }
  }

  /**
   * [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Manual refresh capability
   * @param {{ trigger?: string, surface?: string }} [opts]
   */
  async refreshPopupData (opts = {}) {
    this._refreshTrigger = opts.trigger || 'other'
    this._refreshSurface = opts.surface || 'popup'
    recordAction(POPUP_ACTION_IDS.refreshData, { trigger: this._refreshTrigger }, this._refreshSurface)
    if (this._onAction) this._onAction({ actionId: POPUP_ACTION_IDS.refreshData, payload: { trigger: this._refreshTrigger } })
    debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Starting manual refresh', this._refreshTrigger)
    try {
      this.setLoading(true)
      await this.loadInitialData()

      // [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] [TEST-POPUP_CLOSE_BEHAVIOR] Update overlay state after refresh
      await this.updateOverlayState()

      this.uiManager.showSuccess('Data refreshed successfully')
      debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Manual refresh completed successfully')
    } catch (error) {
      debugError('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Refresh failed:', error)
      this.uiManager.showError('Failed to refresh data')
    } finally {
      this.setLoading(false)
      this._refreshTrigger = null
      this._refreshSurface = null
    }
  }

  /**
   * [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Setup auto-refresh on focus
   * [IMPL-RECENT_TAGS_POPUP_REFRESH] [ARCH-POPUP_SESSION] [REQ-RECENT_TAGS_SYSTEM] Refresh Recent Tags when popup becomes visible (visibilitychange).
   */
  setupAutoRefresh () {
    window.addEventListener('focus', () => {
      if (this.isInitialized && !this.isLoading) {
        debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Auto-refresh on focus triggered')
        this.refreshPopupData()
      }
    })

    // [IMPL-RECENT_TAGS_POPUP_REFRESH] [ARCH-POPUP_SESSION] [REQ-RECENT_TAGS_SYSTEM] Refresh Recent Tags every time popup is displayed
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.isInitialized && !this.isLoading) {
        debugLog('[IMPL-RECENT_TAGS_POPUP_REFRESH] Popup visible, refreshing recent tags')
        this.loadRecentTags()
      }
    })
  }

  /**
   * [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Enhanced real-time update handling
   */
  setupRealTimeUpdates () {
    // [ARCH-MESSAGE_HANDLING] Observer listener: synchronous and returns undefined so the service worker
    // reply wins the response-channel race for getTabId / getOptions / getCurrentBookmark.
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message?.type !== 'BOOKMARK_UPDATED') return
        this.refreshOnExternalBookmarkUpdate().catch(error => {
          debugError('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Detached refreshOnExternalBookmarkUpdate failed:', error)
        })
      })
    }
  }

  /**
   * [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] Detached
   * current-tab re-fetch for the BOOKMARK_UPDATED observer listener (state, tags, private/read-later).
   */
  async applyExternalBookmarkUpdate () {
    try {
      debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Received BOOKMARK_UPDATED, refreshing data')
      if (!this.currentTab || !this.currentTab.url) return

      // [TOGGLE_SYNC_POPUP] Fetch latest bookmark data for current tab
      const updatedPin = await this.getBookmarkData(this.currentTab.url)
      this.currentPin = updatedPin
      this.stateManager.setState({ currentPin: this.currentPin })
      // [TOGGLE_SYNC_POPUP] Update UI to reflect new state
      this.uiManager.updatePrivateStatus(this.currentPin?.shared === 'no')
      this.uiManager.updateReadLaterStatus(this.currentPin?.toread === 'yes')
      const normalizedTags = this.normalizeTags(this.currentPin?.tags)
      await this.refreshTagFrequencyMapForSort()
      this.uiManager.updateCurrentTags(normalizedTags)
      // [REQ-BOOKMARK_NOTES_UI] [IMPL-BOOKMARK_NOTES_UI]
      this.uiManager.syncBookmarkNotesFields(this.currentPin, this._resolvedStorageBackend || this.getSelectedStorageBackend())
      this.uiManager.showSuccess('Bookmark updated from another window')
    } catch (error) {
      debugError('[TOGGLE_SYNC_POPUP] Failed to update popup on BOOKMARK_UPDATED:', error)
    }
  }

  /**
   * [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Detached refresh for the
   * BOOKMARK_UPDATED observer listener; errors are logged, never surfaced to the sender.
   */
  async refreshOnExternalBookmarkUpdate () {
    debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Received BOOKMARK_UPDATED, refreshing data')
    try {
      await this.refreshPopupData()
      // [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] [TEST-POPUP_CLOSE_BEHAVIOR] Update overlay state after bookmark changes
      await this.updateOverlayState()
    } catch (error) {
      debugError('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Failed to refresh on update:', error)
    }
  }

  /**
   * [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Ensure popup and badge show same data
   */
  async validateBadgeSynchronization () {
    try {
      const currentTab = await this.getCurrentTab()
      const popupData = this.currentPin
      const badgeData = await this.sendMessage({
        type: 'getCurrentBookmark',
        data: { url: currentTab.url }
      })

      debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Badge synchronization check:', {
        popupTags: popupData?.tags,
        badgeTags: badgeData?.tags,
        popupTagCount: popupData?.tags?.length || 0,
        badgeTagCount: badgeData?.tags?.length || 0,
        synchronized: JSON.stringify(popupData) === JSON.stringify(badgeData)
      })

      return {
        synchronized: JSON.stringify(popupData) === JSON.stringify(badgeData),
        popupData,
        badgeData
      }
    } catch (error) {
      debugError('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Badge synchronization check failed:', error)
      return { synchronized: false, error: error.message }
    }
  }

  /**
   * [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Ensure popup and overlay show same data
   */
  async validateOverlaySynchronization () {
    try {
      const overlayData = await this.sendToTab({
        type: 'getCurrentBookmark',
        data: { url: this.currentTab.url }
      })

      debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Overlay synchronization check:', {
        popupData: this.currentPin,
        overlayData,
        popupTagCount: this.currentPin?.tags?.length || 0,
        overlayTagCount: overlayData?.tags?.length || 0,
        synchronized: JSON.stringify(this.currentPin) === JSON.stringify(overlayData)
      })

      return {
        synchronized: JSON.stringify(this.currentPin) === JSON.stringify(overlayData),
        popupData: this.currentPin,
        overlayData
      }
    } catch (error) {
      debugError('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Overlay synchronization check failed:', error)
      return { synchronized: false, error: error.message }
    }
  }

  /**
   * [IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] - Handle checkbox state change
   */
  async handleShowHoverOnPageLoadChange () {
    recordAction(POPUP_ACTION_IDS.showHoverOnPageLoadChange, undefined, 'popup')
    if (this._onAction) this._onAction({ actionId: POPUP_ACTION_IDS.showHoverOnPageLoadChange, payload: undefined })
    try {
      const isChecked = this.uiManager.elements.showHoverOnPageLoad.checked

      // Update configuration
      await this.configManager.updateConfig({
        showHoverOnPageLoad: isChecked
      })

      // Provide user feedback
      this.uiManager.showSuccess(
        isChecked ? 'Hover will show on page load' : 'Hover will not show on page load'
      )

      // Broadcast to content scripts
      await this.broadcastConfigUpdate()
    } catch (error) {
      this.errorHandler.handleError('Failed to update page load setting', error)
    }
  }

  /**
   * [IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] - Load checkbox state from configuration
   */
  async loadShowHoverOnPageLoadSetting () {
    try {
      const config = await this.configManager.getConfig()
      this.uiManager.elements.showHoverOnPageLoad.checked = config.showHoverOnPageLoad
    } catch (error) {
      this.errorHandler.handleError('Failed to load page load setting', error)
    }
  }

  /**
   * [IMPL-OVERLAY_CONTROLS] [ARCH-OVERLAY_CONTROLS] [REQ-OVERLAY_AUTO_SHOW_CONTROL] [TEST-SHOW_HOVER_CHECKBOX] - Broadcast configuration updates to content scripts
   */
  async broadcastConfigUpdate () {
    try {
      const config = await this.configManager.getConfig()

      // Send to current tab if available
      if (this.currentTab) {
        await this.sendToTab({
          type: 'UPDATE_CONFIG',
          data: { showHoverOnPageLoad: config.showHoverOnPageLoad }
        })
      }

      // Broadcast to all tabs using the existing UPDATE_OVERLAY_CONFIG message type
      await this.sendMessage({
        type: 'updateOverlayConfig',
        data: { showHoverOnPageLoad: config.showHoverOnPageLoad }
      })
    } catch (error) {
      this.errorHandler.handleError('Failed to broadcast config update', error)
    }
  }
}
