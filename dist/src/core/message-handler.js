/**
 * [IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING] [REQ-SMART_BOOKMARKING] [REQ-BOOKMARK_STATE_SYNCHRONIZATION]
 * Message routing with type validation and handler map; processMessage and handler dispatch.
 * [IMPL-RUNTIME_VALIDATION] Incremental Zod validation at processMessage entry for critical message types.
 * @ts-check
 */

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
 * === IMPL-FULL-BLOCK: IMPL-BOOKMARKING ===
 * [IMPL-BOOKMARKING] [ARCH-UX_CORE] [ARCH-MESSAGE_HANDLING] [REQ-SMART_BOOKMARKING] — How: create/update/delete bookmarks via MessageHandler without leaving the page; tag suggestions remain available.
 *
 * ## SAVE_BOOKMARK
 *
 * - [IMPL-BOOKMARKING] [ARCH-MESSAGE_HANDLING] [REQ-SMART_BOOKMARKING] How: validate envelope/data then route save through storage backend; broadcast update on success.
 * - Contract:
 *   - INPUT: saveBookmark / deleteBookmark / getCurrentBookmark messages (url, title, tags, shared, toread, description)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: persisted bookmark on preferred backend; BOOKMARK_UPDATED broadcast; UI-facing success/error payload | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: MessageHandler; BookmarkRouter / pinboard / local / file / sync / browser providers; overlay and popup callers
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: SAVE_BOOKMARK
 *   - validated = validateMessageData(message)
 *   - IF invalid: RETURN error payload
 *   - result = AWAIT bookmarkRouter.save(validated)
 *   - IF result.ok: BROADCAST BOOKMARK_UPDATED
 *   - RETURN result
 *   - How (sub-block): How: load current bookmark for URL for overlay/popup display.
 *
 * ## GET_CURRENT_BOOKMARK
 *
 * - [IMPL-BOOKMARKING] [ARCH-UX_CORE] [ARCH-MESSAGE_HANDLING] [REQ-SMART_BOOKMARKING] How: Implements GET_CURRENT_BOOKMARK(url) behavior for IMPL-BOOKMARKING.
 * - Contract:
 *   - INPUT: saveBookmark / deleteBookmark / getCurrentBookmark messages (url, title, tags, shared, toread, description)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: persisted bookmark on preferred backend; BOOKMARK_UPDATED broadcast; UI-facing success/error payload | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: MessageHandler; BookmarkRouter / pinboard / local / file / sync / browser providers; overlay and popup callers
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: GET_CURRENT_BOOKMARK
 *   - RETURN AWAIT bookmarkRouter.get(url) OR empty bookmark view
 *   - How (sub-block): How: delete bookmark for URL and notify listeners.
 *
 * ## DELETE_BOOKMARK
 *
 * - [IMPL-BOOKMARKING] [ARCH-UX_CORE] [ARCH-MESSAGE_HANDLING] [REQ-SMART_BOOKMARKING] How: Implements DELETE_BOOKMARK(url) behavior for IMPL-BOOKMARKING.
 * - Contract:
 *   - INPUT: saveBookmark / deleteBookmark / getCurrentBookmark messages (url, title, tags, shared, toread, description)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: persisted bookmark on preferred backend; BOOKMARK_UPDATED broadcast; UI-facing success/error payload | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: MessageHandler; BookmarkRouter / pinboard / local / file / sync / browser providers; overlay and popup callers
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: DELETE_BOOKMARK
 *   - result = AWAIT bookmarkRouter.delete(url)
 *   - IF result.ok: BROADCAST BOOKMARK_UPDATED
 *   - RETURN result
 *
 * === END IMPL-FULL-BLOCK: IMPL-BOOKMARKING ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-LOCAL_BOOKMARKS_INDEX ===
 * [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [ARCH-STORAGE_INDEX_AND_ROUTER] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-LOCAL_BOOKMARKS_INDEX] [REQ-BROWSER_BOOKMARK_STORAGE] — Index page: getAggregatedBookmarksForIndex (fallback getLocalBookmarksForIndex), metadata-first filter pipeline, table with Storage column, per-store filtered / total provider-row counts, and collapsible fixed footer control panel; Stores L/F/S/B.
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
 * - [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [REQ-LOCAL_BOOKMARKS_INDEX] How: FOOTER_CONTROL_PANEL keeps Actions, Import, and Export fixed at the viewport bottom, starts collapsed, and displays one control group at a time when expanded.
 * - Contract:
 *   - INPUT: requestedGroup (string), currentGroup (string or null)
 *   - PRE: requestedGroup is one of actions | import | export
 *   - OUTPUT: active footer group (string or null) and corresponding visible panel(s)
 *   - POST:
 *     - success with a different requestedGroup => exactly one footer panel is visible and its tab is selected
 *     - success with the already active requestedGroup => active footer group is null, all footer panels are hidden, and all footer tabs are unselected
 *     - success with no active footer group => Actions is the sole footer tab with tabindex 0; Import and Export use tabindex -1
 *     - invalid group => currentGroup and panel visibility remain unchanged
 *   - FAILURE_MODES: InvalidGroup
 *   - DATA: activeFooterGroup
 *   - DATA_TRANSITION: activeFooterGroup changes from null to a valid group, between valid groups, or from the active group to null
 *   - EFFECTS: State
 *   - TERMINATION: total
 * - PROCEDURE: SET_FOOTER_CONTROL_GROUP
 *   - IF requestedGroup is not a valid footer group: RETURN { activeGroup: currentGroup, error: InvalidGroup }
 *   - IF requestedGroup == currentGroup:
 *   - SET activeFooterGroup = null
 *   - SET selected = false for every footer tab
 *   - SET tabindex = 0 for Actions and -1 for every other footer tab
 *   - SET hidden = true for every footer panel
 *   - RETURN { activeGroup: null }
 *   - SET activeFooterGroup = requestedGroup
 *   - SET selected tab state for requestedGroup
 *   - SET tabindex = 0 for requestedGroup and -1 for every other footer tab
 *   - SET hidden = false only for requestedGroup panel
 *   - SET hidden = true for every other footer panel
 *   - RETURN { activeGroup: activeFooterGroup }
 *
 * ## INITIALIZE_INDEX_CONTROL_TABS
 *
 * - [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [REQ-LOCAL_BOOKMARKS_INDEX] How: INITIALIZE_INDEX_CONTROL_TABS keeps Stores selected at the head, starts the footer collapsed, and binds accessible tab activation without changing control behavior.
 * - Contract:
 *   - INPUT: headTabList, headPanels, footerTabList, footerPanels
 *   - PRE: each tab references a known panel through aria-controls
 *   - OUTPUT: initialized head and footer control panels
 *   - POST:
 *     - success => Stores is selected and exactly one head panel is visible
 *     - success => activeFooterGroup is null, all footer tabs are unselected, and all footer panels are hidden
 *     - success => Actions is the sole footer tab with tabindex 0 while the footer is collapsed
 *   - EFFECTS: State
 *   - TERMINATION: total
 * - PROCEDURE: INITIALIZE_INDEX_CONTROL_TABS
 *   - CALL SET_HEAD_CONTROL_GROUP("stores", "stores")
 *   - SET activeFooterGroup = null
 *   - SET selected = false for every footer tab
 *   - SET tabindex = 0 for Actions and -1 for every other footer tab
 *   - SET hidden = true for every footer panel
 *   - ON head tab activation: CALL SET_HEAD_CONTROL_GROUP(requestedGroup, activeHeadGroup)
 *   - ON footer tab activation: CALL SET_FOOTER_CONTROL_GROUP(requestedGroup, activeFooterGroup)
 *   - ON footer Enter or Space activation: CALL SET_FOOTER_CONTROL_GROUP(requestedGroup, activeFooterGroup)
 *   - ON footer ArrowLeft, ArrowRight, Home, or End: move focus to the requested tab and CALL SET_FOOTER_CONTROL_GROUP(requestedGroup, activeFooterGroup)
 *
 * ## SYNC_CONTROL_PANEL_OFFSETS
 *
 * - [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [REQ-LOCAL_BOOKMARKS_INDEX] How: SYNC_CONTROL_PANEL_OFFSETS measures compact or active fixed head/footer regions so sticky table headers and list spacing avoid control overlap after initialization and every footer transition.
 * - Contract:
 *   - INPUT: headPanel (element), footerPanel (element), root (element)
 *   - PRE: root exists; missing panel elements are allowed
 *   - OUTPUT: root CSS variables for head offset and footer spacing
 *   - POST:
 *     - success => CSS variables equal the current measured compact or active panel heights
 *   - EFFECTS: State
 *   - TERMINATION: total
 * - PROCEDURE: SYNC_CONTROL_PANEL_OFFSETS
 *   - IF root is missing: RETURN
 *   - IF headPanel exists: SET --index-head-sticky-height = headPanel.offsetHeight pixels
 *   - IF footerPanel exists: SET --index-footer-sticky-height = footerPanel.offsetHeight pixels
 *   - CALL APPLY_STICKY_THEAD_OFFSET
 *   - ON initialization, footer transition, or panel resize: REPEAT SYNC_CONTROL_PANEL_OFFSETS
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
 * === IMPL-FULL-BLOCK: IMPL-MESSAGE_HANDLING ===
 * [IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING] [REQ-SMART_BOOKMARKING] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [REQ-RECENT_TAGS_SYSTEM] [ARCH-TAG_SYSTEM] — Central message allowlist + validation + handler dispatch; recent-tag message types delegate to [IMPL-TAG_SYSTEM] TagService and SW recentTagsMemory policy per ARCH-TAG_SYSTEM. Contract: Promise result or reject on validation; recent handlers return safe shapes on internal failure.
 *
 * ## SEND
 *
 * - [IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING] [REQ-SMART_BOOKMARKING] How: client-side validate type/payload; dispatch to background; return Promise (path for popup/content/offscreen callers).
 * - Contract:
 *   - INPUT: message { type, payload/data }; sender (tab/popup/background)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: Promise resolving to handler result or rejecting on validation/routing error | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: MESSAGE_TYPES allowlist; handler map type → async fn; TagService instance for tag/recent paths
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: SEND
 *   - VALIDATE message.type in allowlist
 *   - VALIDATE payload shape
 *   - ROUTE to handler for message.type
 *   - handler(message) -> result; RETURN Promise.resolve(result)
 *   - ON error: RETURN Promise.reject; optional log
 *
 * ## UNWRAP_MESSAGE_RESPONSE
 *
 * - [IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [REQ-UI_INSPECTION] How: shared null-tolerant unwrap for runtime replies (src/shared/message-response.js), because any extension context can win the response-channel race and answer null (Chrome 144+ promise-returning listeners / observer listeners that return promises). Callers must not dereference response.success. Observer BOOKMARK_UPDATED paths are IMPL-BOOKMARK_STATE_SYNC OBSERVER_BOOKMARK_UPDATED_APPLY_EXTERNAL and IMPL-POPUP_SESSION OBSERVER_BOOKMARK_UPDATED_FULL_REFRESH.
 * - Contract:
 *   - INPUT: response from runtime.sendMessage — { success, data } wrapper, plain payload, or null/undefined missing response; optional type + surface for readMessageResponse
 *   - PRE: caller awaited the send and handled thrown transport errors separately
 *   - OUTPUT: unwrapMessageResponse -> payload | null; isMissingMessageResponse -> boolean; readMessageResponse -> payload | null (records messageResponseMissing when missing)
 *   - POST:
 *     - success => wrapper returns response.data; non-wrapper object returns response as-is
 *     - missing response => returns null; readMessageResponse records messageResponseMissing; caller keeps defaults
 *   - FAILURE_MODES: none (total, no throw)
 *   - DATA: src/shared/message-response.js; callers in content-main (getTabId, getOptions, getCurrentBookmark)
 *   - EFFECTS: pure for unwrap/isMissing; State when readMessageResponse records inspector action
 *   - TERMINATION: total
 * - PROCEDURE: UNWRAP_MESSAGE_RESPONSE
 *   - IF isMissingMessageResponse(response): RETURN null
 *   - IF response is object AND 'success' in response: RETURN response.success ? response.data : response
 *   - RETURN response
 *   - How (sub-block): caller guard — missing response is observable, never a crash.
 *   - 1. CALLER: actual = readMessageResponse(response, type[, surface])
 *   - 2.   # readMessageResponse = unwrap + IF missing: recordAction messageResponseMissing; debugWarn
 *   - 3.   IF actual == null: KEEP defaults; RETURN
 *
 * ## HANDLE_GET_RECENT_BOOKMARKS
 *
 * - How: SW entry resolves handler by message.type; missing handler → reject or structured error per router; AWAIT handler(data, senderUrl); optional BOOKMARK_UPDATED broadcast after mutating handlers ([REQ-BOOKMARK_STATE_SYNCHRONIZATION]).
 * - Contract:
 *   - INPUT: message { type, payload/data }; sender (tab/popup/background)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: Promise resolving to handler result or rejecting on validation/routing error | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: MESSAGE_TYPES allowlist; handler map type → async fn; TagService instance for tag/recent paths
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: HANDLE_GET_RECENT_BOOKMARKS
 *   - recentTags = AWAIT tagService.getUserRecentTagsExcludingCurrent(data?.currentTags OR [])
 *   - RETURN { ...data, recentTags }
 *   - How (sub-block): How: addTagToRecent — validate tagName + currentSiteUrl; tagService.addTagToUserRecentList; structured { success } / error (same REQ/ARCH/IMPL cross-IMPL set as handleGetRecentBookmarks).
 *
 * ## HANDLE_ADD_TAG_TO_RECENT
 *
 * - [IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING] [REQ-SMART_BOOKMARKING] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [REQ-RECENT_TAGS_SYSTEM] [ARCH-TAG_SYSTEM] How: Implements handleAddTagToRecent(data) behavior for IMPL-MESSAGE_HANDLING.
 * - Contract:
 *   - INPUT: message { type, payload/data }; sender (tab/popup/background)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: Promise resolving to handler result or rejecting on validation/routing error | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: MESSAGE_TYPES allowlist; handler map type → async fn; TagService instance for tag/recent paths
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: HANDLE_ADD_TAG_TO_RECENT
 *   - VALIDATE tagName AND currentSiteUrl present
 *   - success = AWAIT tagService.addTagToUserRecentList(tagName, currentSiteUrl)
 *   - RETURN { success } OR { success: false, error: message }
 *   - How (sub-block): How: getUserRecentTags message — raw policy list for diagnostics/tools; TRY/CATCH → { recentTags: [], error } on failure.
 *
 * ## HANDLE_GET_USER_RECENT_TAGS
 *
 * - [IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING] [REQ-SMART_BOOKMARKING] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [REQ-RECENT_TAGS_SYSTEM] [ARCH-TAG_SYSTEM] How: Implements handleGetUserRecentTags(data) behavior for IMPL-MESSAGE_HANDLING.
 * - Contract:
 *   - INPUT: message { type, payload/data }; sender (tab/popup/background)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: Promise resolving to handler result or rejecting on validation/routing error | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: MESSAGE_TYPES allowlist; handler map type → async fn; TagService instance for tag/recent paths
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: HANDLE_GET_USER_RECENT_TAGS
 *   - TRY: RETURN { recentTags: AWAIT tagService.getUserRecentTags() }
 *   - CATCH: LOG; RETURN { recentTags: [], error }
 *
 * ## BLOCK_5
 *
 * - --- Composition: composed_with [IMPL-POPUP_MESSAGE_TIMEOUT] [IMPL-BOOKMARK_STATE_SYNC] --- How: Ordering: client send may apply timeout/retry () before this IMPL’s send completes. Post successful bookmark mutations,  may broadcast; recent-tag handlers are read/mutation for user-recent only unless caller chains. Shared DATA: single MessageHandler TagService reference; no second recentTagsMemory writer.
 * - Contract:
 *   - INPUT: message { type, payload/data }; sender (tab/popup/background)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: Promise resolving to handler result or rejecting on validation/routing error | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: MESSAGE_TYPES allowlist; handler map type → async fn; TagService instance for tag/recent paths
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: BLOCK_5
 *   - How (sub-block): --- Cross-IMPL ---
 *
 * === END IMPL-FULL-BLOCK: IMPL-MESSAGE_HANDLING ===
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
 * === IMPL-FULL-BLOCK: IMPL-SESSION_TAGS ===
 * [IMPL-SESSION_TAGS] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] — In-session tags (lowercase) for auto-apply when AI returns; getSessionTags, recordSessionTags; session or in-memory. Contract: recordSessionTags(tags) or getSessionTags(); array of lowercase tags or void.
 *
 * ## GET_SESSION_TAGS
 *
 * - [IMPL-SESSION_TAGS] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] How: Implements getSessionTags() behavior for IMPL-SESSION_TAGS.
 * - Contract:
 *   - INPUT: recordSessionTags(tags: string[]); getSessionTags(): no args
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: getSessionTags() -> string[] (lowercase); recordSessionTags -> void
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: storage key hoverboard_session_tags; use chrome.storage.session or in-memory Map in SW
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: GET_SESSION_TAGS
 *   - IF chrome.storage.session:
 *   - result = await chrome.storage.session.get('hoverboard_session_tags')
 *   - RETURN (result.hoverboard_session_tags ?? []).map(t => t.toLowerCase())
 *   - RETURN inMemorySet ? Array.from(inMemorySet) : []
 *   - How (sub-block): Merge tags (lowercase) into set; persist to session storage or in-memory.
 *
 * ## RECORD_SESSION_TAGS
 *
 * - [IMPL-SESSION_TAGS] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] How: Implements recordSessionTags(tags) behavior for IMPL-SESSION_TAGS.
 * - Contract:
 *   - INPUT: recordSessionTags(tags: string[]); getSessionTags(): no args
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: getSessionTags() -> string[] (lowercase); recordSessionTags -> void
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: storage key hoverboard_session_tags; use chrome.storage.session or in-memory Map in SW
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: RECORD_SESSION_TAGS
 *   - current = await getSessionTags()
 *   - set = new Set(current.map(t => t.toLowerCase()))
 *   - FOR tag IN tags: set.add(String(tag).trim().toLowerCase())
 *   - arr = Array.from(set)
 *   - IF chrome.storage.session: await chrome.storage.session.set({ hoverboard_session_tags: arr })
 *   - ELSE: inMemorySet = set
 *
 * === END IMPL-FULL-BLOCK: IMPL-SESSION_TAGS ===
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
 * === IMPL-FULL-BLOCK: IMPL-AI_TAGGING_READABILITY ===
 * [IMPL-AI_TAGGING_READABILITY] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] — Extract main content from document: Readability when available, else title + body.innerText; cap at maxLength.
 *
 * ## EXTRACT_PAGE_CONTENT
 *
 * - [IMPL-AI_TAGGING_READABILITY] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] How: Implements extractPageContent(document) behavior for IMPL-AI_TAGGING_READABILITY.
 * - Contract:
 *   - INPUT: document (or run in page context)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: { title: string, textContent: string }
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: maxLength (e.g. 16000)
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: EXTRACT_PAGE_CONTENT
 *   - clone = document.cloneNode(true)
 *   - result = Readability.parse(clone)  // @mozilla/readability
 *   - IF result:
 *   - title = result.title ?? document.title
 *   - text = result.textContent ?? ''
 *   - ELSE:
 *   - title = document.title
 *   - text = document.body ? document.body.innerText : ''
 *   - IF text.length > maxLength THEN text = text.slice(0, maxLength)
 *   - RETURN { title, textContent: text }
 *
 * === END IMPL-FULL-BLOCK: IMPL-AI_TAGGING_READABILITY ===
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
 * === IMPL-FULL-BLOCK: IMPL-RUNTIME_VALIDATION ===
 * [IMPL-RUNTIME_VALIDATION] [ARCH-MESSAGE_HANDLING] [ARCH-CONFIG_STRUCTURE] [REQ-CODE_QUALITY] — How: validate message envelopes/data and merged config with Zod at processMessage entry and getConfig merge.
 *
 * ## VALIDATE_INCOMING_MESSAGE
 *
 * - [IMPL-RUNTIME_VALIDATION] [ARCH-MESSAGE_HANDLING] [REQ-CODE_QUALITY] How: validate envelope then per-type data schema before handler body runs.
 * - Contract:
 *   - INPUT: raw chrome.runtime messages; merged config objects from storage
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: accepted typed payloads or structured validation errors; config rejected when schema fails | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: src/shared/message-schemas.js; ConfigManager Zod schemas; MessageHandler.processMessage
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: VALIDATE_INCOMING_MESSAGE
 *   - envelope = validateMessageEnvelope(message)
 *   - IF envelope fails: RETURN error
 *   - data = validateMessageData(message.type, message.data)
 *   - IF data fails: RETURN error
 *   - RETURN { type, data }
 *   - How (sub-block): How: after merge, parse config; on failure return defaults/error path without throwing to UI callers.
 *
 * ## VALIDATE_MERGED_CONFIG
 *
 * - [IMPL-RUNTIME_VALIDATION] [ARCH-MESSAGE_HANDLING] [ARCH-CONFIG_STRUCTURE] [REQ-CODE_QUALITY] How: Implements VALIDATE_MERGED_CONFIG(merged) behavior for IMPL-RUNTIME_VALIDATION.
 * - Contract:
 *   - INPUT: raw chrome.runtime messages; merged config objects from storage
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: accepted typed payloads or structured validation errors; config rejected when schema fails | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: src/shared/message-schemas.js; ConfigManager Zod schemas; MessageHandler.processMessage
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: VALIDATE_MERGED_CONFIG
 *   - parsed = configSchema.safeParse(merged)
 *   - IF NOT parsed.success: LOG; RETURN fallback OR error
 *   - RETURN parsed.data
 *
 * === END IMPL-FULL-BLOCK: IMPL-RUNTIME_VALIDATION ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-TYPESCRIPT_MIGRATION ===
 * [IMPL-TYPESCRIPT_MIGRATION] [ARCH-LANGUAGE_SELECTION] [REQ-MAINTAINABILITY] — How: incremental type-check without full TS rewrite — tsconfig noEmit, // @ts-check on key JS, shared .d.ts. Status: Active tooling; not a Deferred Safari path. Expand when more files adopt @ts-check.
 *
 * ## TYPECHECK_GATE
 *
 * - [IMPL-TYPESCRIPT_MIGRATION] [ARCH-LANGUAGE_SELECTION] [REQ-MAINTAINABILITY] How: validate gate runs typecheck before build/push.
 * - Contract:
 *   - INPUT: npm run typecheck / validate; tsconfig.json; JSDoc and .d.ts for message/config shapes
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: tsc --noEmit pass/fail; contract errors caught at build time on checked files | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: tsconfig.json; src/shared/*.d.ts; @ts-check on config-manager, message-handler, message-schemas, message-client
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: TYPECHECK_GATE
 *   - RUN tsc --noEmit with allowJs
 *   - ON errors: FAIL validate
 *   - RETURN pass
 *   - How (sub-block): How: checked modules document contracts via JSDoc/.d.ts; Zod remains runtime source for messages.
 *
 * ## MAINTAIN_CHECKED_SURFACE
 *
 * - [IMPL-TYPESCRIPT_MIGRATION] [ARCH-LANGUAGE_SELECTION] [REQ-MAINTAINABILITY] How: Implements MAINTAIN_CHECKED_SURFACE behavior for IMPL-TYPESCRIPT_MIGRATION.
 * - Contract:
 *   - INPUT: npm run typecheck / validate; tsconfig.json; JSDoc and .d.ts for message/config shapes
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: tsc --noEmit pass/fail; contract errors caught at build time on checked files | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: tsconfig.json; src/shared/*.d.ts; @ts-check on config-manager, message-handler, message-schemas, message-client
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: State
 *   - TERMINATION: total
 * - PROCEDURE: MAINTAIN_CHECKED_SURFACE
 *   - KEEP // @ts-check on boundary modules
 *   - UPDATE .d.ts when message/config shapes change
 *   - RETURN
 *
 * === END IMPL-FULL-BLOCK: IMPL-TYPESCRIPT_MIGRATION ===
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
 * - [IMPL-LINK_HEALTH] [ARCH-LINK_HEALTH] [REQ-LINK_HEALTH] How: Resolve link health as enabled when the setting is absent while preserving explicit false.
 * - Contract:
 *   - INPUT: config (MergedConfig|null)
 *   - OUTPUT: boolean (true when linkHealthChecksEnabled is absent or true; false only when explicitly false)
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: IS_LINK_HEALTH_CHECKS_ENABLED
 *   - 1. IF config is null or linkHealthChecksEnabled is absent THEN RETURN true
 *   - 2. RETURN config.linkHealthChecksEnabled !== false
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
 * === IMPL-FULL-BLOCK: IMPL-PAGE_ARCHIVE_STORAGE ===
 * Capture and persist sanitized readable page archives and separate artifacts for Local/File bookmarks.
 *
 * ## RESOLVE_ARCHIVE_ADAPTER
 * - [IMPL-PAGE_ARCHIVE_STORAGE] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE] How: resolve only Local/File archive adapters and report unsupported or unavailable storage before capture.
 * - Contract:
 *   - INPUT: backend (string), adapters (map)
 *   - PRE: backend is supplied as a string; adapters may omit an unconfigured File adapter
 *   - OUTPUT: adapter | { error: UnsupportedBackend | StorageUnavailable }
 *   - POST:
 *     - success => adapter is the adapter registered for local or file
 *     - error => no capture or state transition occurs
 *   - FAILURE_MODES: UnsupportedBackend, StorageUnavailable
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: RESOLVE_ARCHIVE_ADAPTER
 *   - backend = lowercase(String(backend))
 *   - IF backend is not local or file: RETURN { error: UnsupportedBackend }
 *   - adapter = adapters[backend]
 *   - IF adapter is absent: RETURN { error: StorageUnavailable }
 *   - RETURN adapter
 *
 * ## ARCHIVE_PRIVACY_GATE
 * - [IMPL-PAGE_ARCHIVE_STORAGE] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE] How: enforce HTTP(S), inhibit-list, explicit-capture, and Local/File boundaries before page content or screenshot capture.
 * - Contract:
 *   - INPUT: bookmark { url, storage }, isUrlAllowed (function), captureExplicit (boolean)
 *   - PRE: bookmark is present; isUrlAllowed is callable
 *   - OUTPUT: allowed | { error: RestrictedUrl | InhibitedUrl | UnsupportedBackend | InvalidRequest }
 *   - POST:
 *     - success => browser capture may proceed
 *     - error => browser capture is not attempted
 *   - FAILURE_MODES: InvalidRequest, UnsupportedBackend, RestrictedUrl, InhibitedUrl
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: ARCHIVE_PRIVACY_GATE
 *   - IF captureExplicit is false: RETURN { error: InvalidRequest }
 *   - IF bookmark.url is not HTTP(S): RETURN { error: RestrictedUrl }
 *   - IF bookmark.storage is not local or file: RETURN { error: UnsupportedBackend }
 *   - IF isUrlAllowed(bookmark.url) is false: RETURN { error: InhibitedUrl }
 *   - RETURN allowed
 *
 * ## CAPTURE_AND_VALIDATE
 * - [IMPL-PAGE_ARCHIVE_STORAGE] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE] How: capture and normalize the readable artifact only after the archive privacy gate succeeds.
 * - Contract:
 *   - INPUT: bookmark, capture options, capturePageContent (function)
 *   - PRE: bookmark passed ARCHIVE_PRIVACY_GATE; capturePageContent is callable
 *   - OUTPUT: archive | { error: CaptureFailed | TooLarge | RestrictedUrl | InhibitedUrl | UnsupportedBackend }
 *   - POST:
 *     - success => archive has sanitizedHtml, textContent, contentHash, version, capturedAt
 *     - error => no archive is persisted
 *   - FAILURE_MODES: CaptureFailed, TooLarge, RestrictedUrl, InhibitedUrl, UnsupportedBackend
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: CAPTURE_AND_VALIDATE
 *   - gate = AWAIT ARCHIVE_PRIVACY_GATE(bookmark)
 *   - IF gate is error: RETURN gate
 *   - captured = AWAIT capturePageContent(bookmark.url, options)
 *   - IF captured fails: RETURN { error: CaptureFailed }
 *   - archive = NORMALIZE_ARCHIVE(captured)
 *   - IF archive exceeds limits: RETURN { error: TooLarge }
 *   - RETURN archive
 *
 * ## SAVE_PAGE_ARCHIVE
 * - [IMPL-PAGE_ARCHIVE_STORAGE] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE] How: preserve the prior archive, write the new artifact, and update derived archive search only after storage succeeds.
 * - Contract:
 *   - INPUT: bookmark { url, storage }, capture options, adapters, archiveSearch
 *   - PRE: capture is explicit; bookmark.url is HTTP(S); archiveSearch may be absent
 *   - OUTPUT: { success: true, archive } | { success: false, code, previous? }
 *   - POST:
 *     - success => one current archive version and matching derived text entry exist
 *     - StorageFailed => prior archive remains available when the adapter supports atomic failure
 *   - FAILURE_MODES: InvalidRequest, UnsupportedBackend, StorageUnavailable, RestrictedUrl, InhibitedUrl, CaptureFailed, TooLarge, StorageFailed
 *   - DATA: archive collections and derived ArchiveTextIndex
 *   - DATA_TRANSITION: successful write replaces one URL version; failure does not claim a new archive
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: SAVE_PAGE_ARCHIVE
 *   - adapter = RESOLVE_ARCHIVE_ADAPTER(bookmark.storage, adapters)
 *   - IF adapter is error: RETURN { success: false, code: adapter.error }
 *   - archive = AWAIT CAPTURE_AND_VALIDATE(bookmark, options, capturePageContent)
 *   - IF archive is error: RETURN { success: false, code: archive.error }
 *   - previous = AWAIT adapter.readArchiveFile(bookmark.url)
 *   - result = AWAIT adapter.writeArchiveFile(bookmark.url, archive)
 *   - IF result fails: RETURN { success: false, code: StorageFailed, previous }
 *   - IF archiveSearch exists: AWAIT archiveSearch.replaceArchivedContent(bookmark.url, archive)
 *   - RETURN { success: true, archive }
 *
 * ## DELETE_PAGE_ARCHIVE
 * - [IMPL-PAGE_ARCHIVE_STORAGE] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE] [IMPL-PAGE_SCREENSHOT_ARCHIVE] [ARCH-PAGE_SCREENSHOT_ARCHIVE] [REQ-PAGE_SCREENSHOT_ARCHIVE] How: delete the selected backend's readable archive, screenshot artifacts, and derived search state together.
 * - Contract:
 *   - INPUT: bookmark { url, storage }, optional selected backend, adapters, archiveSearch
 *   - PRE: bookmark.url is normalized or normalizable
 *   - OUTPUT: { success: true } | { success: false, code: InvalidUrl | UnsupportedBackend | StorageUnavailable | StorageFailed }
 *   - POST:
 *     - success => readable archive, screenshot artifacts, and selected-backend search entry are absent
 *     - error => unrelated URLs and backends are unchanged
 *   - FAILURE_MODES: InvalidUrl, UnsupportedBackend, StorageUnavailable, StorageFailed
 *   - DATA: archive and screenshot collections, ArchiveTextIndex
 *   - DATA_TRANSITION: only the requested URL is removed
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: DELETE_PAGE_ARCHIVE
 *   - adapter = RESOLVE_ARCHIVE_ADAPTER(bookmark.storage, adapters)
 *   - IF adapter is error: RETURN { success: false, code: adapter.error }
 *   - REMOVE readable archive and matching screenshot records for bookmark.url
 *   - IF archiveSearch exists: AWAIT archiveSearch.removeArchivedContent(bookmark.url)
 *   - RETURN { success: true }
 *
 * ## LOOKUP_PAGE_ARCHIVE
 * - [IMPL-PAGE_ARCHIVE_STORAGE] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE] How: resolve the explicitly selected adapter before reading a URL or archive identifier and never fetch the live page.
 * - Contract:
 *   - INPUT: identifier (URL or archiveId), optional backend, adapters
 *   - PRE: identifier is present; backend is local or file when supplied
 *   - OUTPUT: archive | { error: MissingArchive | UnsupportedBackend | StorageUnavailable | StorageFailed }
 *   - POST:
 *     - success => returned archive is persisted sanitized data; no network request occurs
 *     - error => no network request occurs
 *   - FAILURE_MODES: MissingArchive, UnsupportedBackend, StorageUnavailable, StorageFailed
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: LOOKUP_PAGE_ARCHIVE
 *   - candidates = backend is supplied ? [backend] : [local, file]
 *   - FOR candidate IN candidates:
 *     - adapter = RESOLVE_ARCHIVE_ADAPTER(candidate, adapters)
 *     - IF adapter is error and backend is supplied: RETURN { error: adapter.error }
 *     - IF adapter is error: CONTINUE
 *     - IF identifier is an archiveId: archive = AWAIT adapter.getArchiveById(identifier)
 *     - ELSE: archive = AWAIT adapter.getArchive(normalizeUrl(identifier))
 *     - IF archive exists: RETURN archive
 *   - RETURN { error: MissingArchive }
 *
 * ## LIST_PAGE_ARCHIVES
 * - [IMPL-PAGE_ARCHIVE_STORAGE] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE] How: enumerate persisted Local/File artifacts through resolved adapters for explicit browse and search-scope wiring.
 * - Contract:
 *   - INPUT: optional backend, adapters
 *   - PRE: backend is local or file when supplied
 *   - OUTPUT: archives | { error: UnsupportedBackend | StorageUnavailable | StorageFailed }
 *   - POST:
 *     - success => archives contain only persisted records in deterministic order
 *   - FAILURE_MODES: UnsupportedBackend, StorageUnavailable, StorageFailed
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: LIST_PAGE_ARCHIVES
 *   - candidates = backend is supplied ? [backend] : [local, file]
 *   - FOR candidate IN candidates:
 *     - adapter = RESOLVE_ARCHIVE_ADAPTER(candidate, adapters)
 *     - IF adapter is error and backend is supplied: RETURN { error: adapter.error }
 *     - IF adapter is error: CONTINUE
 *     - archives = archives CONCAT AWAIT adapter.listArchives()
 *   - RETURN SORT archives BY capturedAt DESCENDING, url ASCENDING
 *
 * === END IMPL-FULL-BLOCK: IMPL-PAGE_ARCHIVE_STORAGE ===
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
 * === IMPL-FULL-BLOCK: IMPL-OFFLINE_READER_MODE ===
 * Render persisted sanitized archive content in a dedicated Offline Reader without fetching the live page.
 *
 * ## LOAD_READER_ARCHIVE
 * - [IMPL-OFFLINE_READER_MODE] [ARCH-OFFLINE_READER_MODE] [REQ-OFFLINE_READER_MODE] How: parse URL/archiveId/backend identity, request only the selected persisted archive state, and use an explicit freshness handoff.
 * - Contract:
 *   - INPUT: location { search }, sendMessage, elements, staleAfterMs option
 *   - PRE: Reader is an extension page; sendMessage reads persisted state only
 *   - OUTPUT: rendered Reader state
 *   - POST:
 *     - URL/archiveId query => one GET_PAGE_ARCHIVE request includes `backend`, `archiveId`, and `staleAfterMs`
 *     - no query => no storage request and missing state is rendered
 *     - archive success => screenshot lookup uses the persisted archive URL, backend, and archive identity
 *   - FAILURE_MODES: MissingArchive, UnsupportedBackend, StorageFailed, InvalidArchive
 *   - DATA: URLSearchParams, backend, archiveId, PageArchiveStore response, PageScreenshotStore response
 *   - DATA_TRANSITION: storage response becomes DOM state; no live page data enters Reader
 *   - EFFECTS: DOM, Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: LOAD_READER_ARCHIVE
 *   - query = PARSE_QUERY(location)
 *   - IF query.url and query.archiveId are absent: RENDER_READER_ERROR(MissingArchive); RETURN MissingArchive
 *   - staleAfterMs = options.staleAfterMs OR DEFAULT_READER_STALE_AFTER_MS (default 0, meaning no age-based override)
 *   - archiveResponse = AWAIT sendMessage(GET_PAGE_ARCHIVE, { url: query.url, archiveId: query.archiveId, backend: query.backend, staleAfterMs })
 *   - IF archiveResponse is missing: RENDER_READER_ERROR(MissingArchive); RETURN MissingArchive
 *   - IF archiveResponse is failed: RENDER_READER_ERROR(archiveResponse.code OR StorageFailed); RETURN archiveResponse.code OR StorageFailed
 *   - IF archive lookup throws: RENDER_READER_ERROR(StorageFailed); RETURN { success: false, code: StorageFailed, error }
 *   - RENDER_READER_ARCHIVE(archiveResponse.archive)
 *   - screenshotResponse = AWAIT sendMessage(GET_PAGE_SCREENSHOTS, { url: archiveResponse.archive.url, archiveId: archiveResponse.archive.archiveId, backend: archiveResponse.archive.storage OR query.backend })
 *   - IF screenshotResponse is successful: RENDER_READER_SCREENSHOTS(screenshotResponse.screenshots)
 *   - RETURN success
 *
 * ## RENDER_READER_ERROR
 * - [IMPL-OFFLINE_READER_MODE] [ARCH-OFFLINE_READER_MODE] [REQ-OFFLINE_READER_MODE] How: preserve stable missing, unsupported, storage, and malformed archive failure codes in an accessible Reader error state instead of collapsing them into missing content.
 * - Contract:
 *   - INPUT: failure code, Reader DOM elements
 *   - PRE: code is a stable archive lookup failure or defaults to StorageFailed
 *   - OUTPUT: { success: false, code }
 *   - POST:
 *     - content is empty and live link is hidden
 *     - status state is error with code-specific guidance
 *     - failure code remains available to callers
 *   - FAILURE_MODES: MissingArchive, UnsupportedBackend, StorageFailed, InvalidArchive
 *   - EFFECTS: DOM
 *   - TERMINATION: total
 * - PROCEDURE: RENDER_READER_ERROR
 *   - normalizedCode = code OR StorageFailed
 *   - clear content and live link
 *   - set title and status text from normalizedCode
 *   - set status state to error
 *   - RETURN { success: false, code: normalizedCode }
 *
 * ## VALIDATE_SOURCE_PRESENTATION
 * - [IMPL-OFFLINE_READER_MODE] [ARCH-OFFLINE_READER_MODE] [REQ-OFFLINE_READER_MODE] How: validate persisted source presentation metadata before it can influence the extension-owned Reader shell.
 * - Contract:
 *   - INPUT: optional sourcePresentationProfile
 *   - PRE: profile came from persisted archive data and is untrusted
 *   - OUTPUT: valid profile | absent
 *   - POST:
 *     - valid output contains only allowlisted opaque colors and light/dark intent
 *     - background-to-text and background-to-link contrast is at least WCAG AA 4.5:1
 *     - invalid, transparent, missing, or low-contrast input returns absent
 *   - FAILURE_MODES: InvalidProfile, InsufficientContrast
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: VALIDATE_SOURCE_PRESENTATION
 *   - parse background, text, and optional link as canonical opaque colors
 *   - IF background or text is absent: RETURN absent
 *   - IF contrast(background, text) is less than 4.5: RETURN absent
 *   - IF link exists and contrast(background, link) is less than 4.5: RETURN absent
 *   - RETURN profile with optional link and colorScheme
 *
 * ## APPLY_SOURCE_PRESENTATION
 * - [IMPL-OFFLINE_READER_MODE] [ARCH-OFFLINE_READER_MODE] [REQ-OFFLINE_READER_MODE] How: apply validated profile only through fixed extension-owned CSS variables on the Reader shell and clear them for the Hoverboard theme fallback.
 * - Contract:
 *   - INPUT: Reader shell element, validated profile or absent
 *   - PRE: shell is an extension-owned DOM element; profile has passed VALIDATE_SOURCE_PRESENTATION
 *   - OUTPUT: source presentation state
 *   - POST:
 *     - valid profile => shell receives fixed background, text, link, and color-scheme variables and active state
 *     - absent profile => all source variables are cleared and fallback state is active
 *     - archive HTML is never modified with profile values
 *   - FAILURE_MODES: MissingShell
 *   - EFFECTS: DOM
 *   - TERMINATION: total
 * - PROCEDURE: APPLY_SOURCE_PRESENTATION
 *   - IF shell is absent: RETURN { state: fallback, error: MissingShell }
 *   - IF profile is absent: clear fixed source variables; remove active state; RETURN fallback
 *   - set fixed source variables from profile; set active state; RETURN active
 *
 * ## RENDER_READER_ARCHIVE
 * - [IMPL-OFFLINE_READER_MODE] [ARCH-OFFLINE_READER_MODE] [REQ-OFFLINE_READER_MODE] How: render only sanitized stored HTML/text and apply a validated source presentation profile without loading live HTML.
 * - Contract:
 *   - INPUT: archive (nullable), Reader DOM elements
 *   - PRE: archive content came from persisted storage; sanitizer is available
 *   - OUTPUT: { success: true, archive } | { success: false, code: MissingArchive }
 *   - POST:
 *     - archive absent => content is empty, missing state is visible, live link is hidden
 *     - archive present => only sanitized HTML is inserted and validated profile state is applied
 *     - stale archive => warning remains visible while content remains readable
 *   - FAILURE_MODES: MissingArchive, InvalidArchive
 *   - DATA_TRANSITION: archive fields become text/DOM state; no live HTML is inserted
 *   - EFFECTS: DOM
 *   - TERMINATION: total
 * - PROCEDURE: RENDER_READER_ARCHIVE
 *   - IF archive is absent:
 *     - RETURN RENDER_READER_ERROR(MissingArchive)
 *   - title = archive.sourceTitle OR archive.title OR archive.url
 *   - profile = VALIDATE_SOURCE_PRESENTATION(archive.sourcePresentationProfile)
 *   - APPLY_SOURCE_PRESENTATION(reader shell, profile)
 *   - content.innerHTML = SANITIZE_ARCHIVE_HTML(archive.sanitizedHtml OR '')
 *   - status = archive.status == stale ? stale warning : available message
 *   - live link is optional and explicit; never auto-fetched
 *   - RETURN success
 *
 * ## RENDER_READER_SCREENSHOTS
 * - [IMPL-OFFLINE_READER_MODE] [ARCH-OFFLINE_READER_MODE] [REQ-OFFLINE_READER_MODE] [IMPL-PAGE_SCREENSHOT_ARCHIVE] [ARCH-PAGE_SCREENSHOT_ARCHIVE] [REQ-PAGE_SCREENSHOT_ARCHIVE] How: present only persisted safe screenshot artifacts alongside Reader content.
 * - Contract:
 *   - INPUT: screenshots (list), screenshot DOM elements
 *   - PRE: screenshot response is untrusted data
 *   - OUTPUT: rendered screenshot list
 *   - POST:
 *     - only data:image png/jpeg/webp base64 values create img elements
 *     - empty safe list hides the screenshot section
 *   - FAILURE_MODES: InvalidArchive
 *   - EFFECTS: DOM
 *   - TERMINATION: total
 * - PROCEDURE: RENDER_READER_SCREENSHOTS
 *   - clear screenshot list
 *   - FOR each screenshot with valid data:image/*;base64 data:
 *     - append img with data URL and captured timestamp alt text
 *   - hide screenshot section when list is empty
 *
 * ## OPEN_LIVE_PAGE
 * - [IMPL-OFFLINE_READER_MODE] [ARCH-OFFLINE_READER_MODE] [REQ-OFFLINE_READER_MODE] How: expose explicit live-page navigation without coupling it to archive rendering or fetching it automatically.
 * - Contract:
 *   - INPUT: archive.url, live-link element
 *   - PRE: archive.url may be absent, non-HTTP(S), or HTTP(S); live-link element is extension-owned
 *   - OUTPUT: configured or hidden link
 *   - POST: user activation may navigate to the live URL; Reader performs no fetch
 *   - EFFECTS: DOM
 *   - TERMINATION: total
 * - PROCEDURE: OPEN_LIVE_PAGE
 *   - IF archive.url is not HTTP(S): clear live link href; hide live link; RETURN
 *   - set live link href to archive.url only when URL is HTTP(S)
 *   - user activation opens the link; Reader does not fetch it
 *
 * === END IMPL-FULL-BLOCK: IMPL-OFFLINE_READER_MODE ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-PAGE_SCREENSHOT_ARCHIVE ===
 * Capture and persist a bounded product screenshot as a separate Local/File artifact.
 *
 * ## VALIDATE_SCREENSHOT_REQUEST
 * - [IMPL-PAGE_SCREENSHOT_ARCHIVE] [ARCH-PAGE_SCREENSHOT_ARCHIVE] [REQ-PAGE_SCREENSHOT_ARCHIVE] How: validate backend, URL, privacy, and requested dimensions before invoking browser capture.
 * - Contract:
 *   - INPUT: url, storage, options, limits, isUrlAllowed
 *   - PRE: request is explicit; isUrlAllowed is callable
 *   - OUTPUT: valid | { error: UnsupportedBackend | RestrictedUrl | InhibitedUrl | TooLarge }
 *   - POST:
 *     - valid => browser capture may be called
 *     - error => browser capture is not called
 *   - FAILURE_MODES: UnsupportedBackend, RestrictedUrl, InhibitedUrl, TooLarge
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: VALIDATE_SCREENSHOT_REQUEST
 *   - IF storage is not local or file: RETURN UnsupportedBackend
 *   - IF url is not HTTP(S): RETURN RestrictedUrl
 *   - IF isUrlAllowed(url) is false: RETURN InhibitedUrl
 *   - IF requested dimensions exceed limits: RETURN TooLarge
 *   - RETURN valid
 *
 * ## CAPTURE_PAGE_SCREENSHOT
 * - [IMPL-PAGE_SCREENSHOT_ARCHIVE] [ARCH-PAGE_SCREENSHOT_ARCHIVE] [REQ-PAGE_SCREENSHOT_ARCHIVE] How: perform pre-capture validation, capture through the dedicated browser boundary, then normalize and size-check the output.
 * - Contract:
 *   - INPUT: tabId, url, options, storage, limits, isUrlAllowed, dedicatedBrowserCapture
 *   - PRE: capture request is explicit; validation dependencies are available
 *   - OUTPUT: artifact | { success: false, code }
 *   - POST:
 *     - success => artifact has data URL, dimensions, format, contentHash, capturedAt
 *     - validation error => browser capture was not invoked
 *   - FAILURE_MODES: UnsupportedBackend, RestrictedUrl, InhibitedUrl, FullPageCaptureUnavailable, CaptureFailed, TooLarge
 *   - EFFECTS: Browser IO, Async
 *   - TERMINATION: total
 * - PROCEDURE: CAPTURE_PAGE_SCREENSHOT
 *   - validation = AWAIT VALIDATE_SCREENSHOT_REQUEST(url, storage, options, limits, isUrlAllowed)
 *   - IF validation fails: RETURN { success: false, code: validation }
 *   - IF options.fullPage and full-page capability is unavailable: RETURN FullPageCaptureUnavailable
 *   - binary = AWAIT dedicatedBrowserCapture(tabId, options)
 *   - IF binary fails: RETURN CaptureFailed
 *   - artifact = NORMALIZE_SCREENSHOT(binary, options)
 *   - IF artifact exceeds limits: RETURN TooLarge
 *   - RETURN artifact
 *
 * ## SAVE_PAGE_SCREENSHOT
 * - [IMPL-PAGE_SCREENSHOT_ARCHIVE] [ARCH-PAGE_SCREENSHOT_ARCHIVE] [REQ-PAGE_SCREENSHOT_ARCHIVE] How: persist a validated screenshot through the explicit adapter/store boundary only after capture succeeds.
 * - Contract:
 *   - INPUT: bookmark { url, storage }, tab, options, screenshotStore
 *   - PRE: screenshotStore is configured for the selected backend
 *   - OUTPUT: { success: true, artifact } | { success: false, code }
 *   - POST:
 *     - success => one current screenshot artifact exists for URL
 *     - failure => prior screenshot remains unchanged
 *   - FAILURE_MODES: delegated capture failures, UnsupportedBackend, StorageFailed
 *   - DATA_TRANSITION: successful recapture replaces current artifact after write
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: SAVE_PAGE_SCREENSHOT
 *   - artifact = AWAIT CAPTURE_PAGE_SCREENSHOT(tab, options, bookmark.storage)
 *   - IF artifact is error: RETURN artifact
 *   - result = AWAIT screenshotStore.saveScreenshot(bookmark.url, bookmark.storage, artifact)
 *   - IF result fails: RETURN StorageFailed
 *   - RETURN { success: true, artifact: result.artifact }
 *
 * ## REPLACE_CURRENT_SCREENSHOT
 * - [IMPL-PAGE_SCREENSHOT_ARCHIVE] [ARCH-PAGE_SCREENSHOT_ARCHIVE] [REQ-PAGE_SCREENSHOT_ARCHIVE] How: use one explicit adapter write to replace every prior artifact for the normalized URL while preserving unrelated archive data.
 * - Contract:
 *   - INPUT: normalized URL, selected backend, validated screenshot artifact, adapter
 *   - PRE: backend is local or file; artifact passed validation and normalization
 *   - OUTPUT: { success: true, artifact } | { success: false, code: UnsupportedBackend | StorageFailed }
 *   - POST:
 *     - success => exactly one current screenshot artifact for URL remains
 *     - write failure => prior screenshot map remains unchanged
 *   - FAILURE_MODES: InvalidUrl, UnsupportedBackend, StorageFailed
 *   - DATA_TRANSITION: replacement data is prepared before one adapter write
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: REPLACE_CURRENT_SCREENSHOT
 *   - data = AWAIT readArchiveMap(adapter)
 *   - remove every data.screenshots entry whose artifact.url == normalize(url)
 *   - data.screenshots[artifact.artifactId] = artifact with version incremented from current URL artifact or 1
 *   - AWAIT adapter.writeArchiveFile(data)
 *   - RETURN { success: true, artifact: data.screenshots[artifact.artifactId] }
 *
 * ## LIST_PAGE_SCREENSHOTS
 * - [IMPL-PAGE_SCREENSHOT_ARCHIVE] [ARCH-PAGE_SCREENSHOT_ARCHIVE] [REQ-PAGE_SCREENSHOT_ARCHIVE] How: enumerate only durable product screenshot records through the selected adapter in deterministic order.
 * - Contract:
 *   - INPUT: optional selected backend, URL, adapters
 *   - PRE: backend is local or file when supplied
 *   - OUTPUT: deterministic screenshot artifact list
 *   - POST: list contains only durable screenshot records, ordered newest first
 *   - FAILURE_MODES: UnsupportedBackend, StorageUnavailable, StorageFailed
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: LIST_PAGE_SCREENSHOTS
 *   - RETURN screenshotStore.listScreenshots(backend, url)
 *
 * ## DELETE_PAGE_SCREENSHOTS
 * - [IMPL-PAGE_SCREENSHOT_ARCHIVE] [ARCH-PAGE_SCREENSHOT_ARCHIVE] [REQ-PAGE_SCREENSHOT_ARCHIVE] How: delete screenshot artifacts for one URL without changing readable archive content.
 * - Contract:
 *   - INPUT: URL, optional selected backend, adapters
 *   - PRE: URL is normalizable
 *   - OUTPUT: { success: true } | { success: false, code: InvalidUrl | UnsupportedBackend | StorageFailed }
 *   - POST: matching screenshot artifacts are absent; readable archive remains unless DELETE_PAGE_ARCHIVE runs
 *   - FAILURE_MODES: InvalidUrl, UnsupportedBackend, StorageFailed
 *   - DATA_TRANSITION: only matching screenshot records are removed
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: DELETE_PAGE_SCREENSHOTS
 *   - RETURN screenshotStore.deleteScreenshots(url, backend)
 *
 * === END IMPL-FULL-BLOCK: IMPL-PAGE_SCREENSHOT_ARCHIVE ===
 */
import { PinboardService } from '../features/pinboard/pinboard-service.js'

/** @typedef {import('../shared/message-types').MessageEnvelope} MessageEnvelope */
/** @typedef {import('../shared/message-types').SaveBookmarkData} SaveBookmarkData */
/** @typedef {import('../shared/message-types').GetCurrentBookmarkData} GetCurrentBookmarkData */
import { LocalBookmarkService } from '../features/storage/local-bookmark-service.js'
import { getBookmarkForDisplay, getTagsForUrl, normalizeBookmarkForDisplay } from '../features/storage/url-tags-manager.js'
import { TagService } from '../features/tagging/tag-service.js'
import { ConfigManager } from '../config/config-manager.js'
import { TabSearchService } from '../features/search/tab-search-service.js'
import { getSessionTags, recordSessionTags } from '../features/ai/session-tags.js'
import { requestAiTags } from '../features/ai/ai-tagging-provider.js'
import { debugLog, debugError, browser } from '../shared/utils.js'
import { validateMessageEnvelope, validateMessageData } from '../shared/message-schemas.js'
import { capturePageContentFromSource } from '../features/archive/page-capture.js'
import { PageArchiveStore } from '../features/archive/page-archive-store.js'
import { captureArchiveAndAssociateBookmark } from '../features/archive/page-archive-bookmark-association.js'
import { ArchiveContentSearch } from '../features/archive/archive-content-search.js'
import { normalizeScreenshotArtifact, validateScreenshotRequest } from '../features/archive/page-screenshot-capture.js'
import { captureProductScreenshot } from '../features/archive/browser-screenshot-capture.js'
import { CrossResourceRetrievalService } from '../features/search/cross-resource-retrieval.js'
import { LibraryPortabilityService } from '../features/portability/library-package.js'
import { StorageIndex } from '../features/storage/storage-index.js'

// Message type constants - migrated from config.js
export const MESSAGE_TYPES = {
  // Data retrieval
  GET_CURRENT_BOOKMARK: 'getCurrentBookmark',
  GET_TAGS_FOR_URL: 'getTagsForUrl', // [IMPL-URL_TAGS_DISPLAY] Centralized tag storage for tests and UI
  GET_RECENT_BOOKMARKS: 'getRecentBookmarks',
  GET_LOCAL_BOOKMARKS_FOR_INDEX: 'getLocalBookmarksForIndex', // [REQ-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX]
  GET_AGGREGATED_BOOKMARKS_FOR_INDEX: 'getAggregatedBookmarksForIndex', // [ARCH-STORAGE_INDEX_AND_ROUTER] local + file with storage column
  GET_OPTIONS: 'getOptions',
  GET_TAB_ID: 'getTabId',

  // Bookmark operations
  SAVE_BOOKMARK: 'saveBookmark',
  DELETE_BOOKMARK: 'deleteBookmark',
  SAVE_TAG: 'saveTag',
  DELETE_TAG: 'deleteTag',

  // [ARCH-LOCAL_STORAGE_PROVIDER] Storage mode switch (handled by service worker)
  SWITCH_STORAGE_MODE: 'switchStorageMode',

  // [REQ-PER_BOOKMARK_STORAGE_BACKEND] [IMPL-BOOKMARK_ROUTER] Per-bookmark storage (move UI)
  GET_STORAGE_BACKEND_FOR_URL: 'getStorageBackendForUrl',
  MOVE_BOOKMARK_TO_STORAGE: 'moveBookmarkToStorage',

  // UI operations
  TOGGLE_HOVER: 'toggleHover',
  HIDE_OVERLAY: 'hideOverlay',
  REFRESH_DATA: 'refreshData',
  REFRESH_HOVER: 'refreshHover',
  BOOKMARK_UPDATED: 'bookmarkUpdated', // [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TOGGLE_SYNC] - New message type
  TAG_UPDATED: 'TAG_UPDATED', // [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TAG_SYNC] - New message type for tag synchronization

  // Site management
  INHIBIT_URL: 'inhibitUrl',

  // Search operations
  SEARCH_TITLE: 'searchTitle',
  SEARCH_TITLE_TEXT: 'searchTitleText',
  // [IMPL-CROSS_RESOURCE_RETRIEVAL] [ARCH-CROSS_RESOURCE_RETRIEVAL] [REQ-CROSS_RESOURCE_RETRIEVAL] Read-only aggregate library query.
  SEARCH_LIBRARY_RESOURCES: 'searchLibraryResources',
  // [IMPL-LIBRARY_PORTABILITY] [ARCH-LIBRARY_PORTABILITY] [REQ-LIBRARY_PORTABILITY] Package export/import bindings.
  EXPORT_LIBRARY_PACKAGE: 'exportLibraryPackage',
  IMPORT_LIBRARY_PACKAGE: 'importLibraryPackage',

  // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] Tab search operations
  SEARCH_TABS: 'searchTabs',
  GET_SEARCH_HISTORY: 'getSearchHistory',
  CLEAR_SEARCH_STATE: 'clearSearchState',

  // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] Recent tags operations
  ADD_TAG_TO_RECENT: 'addTagToRecent',
  GET_USER_RECENT_TAGS: 'getUserRecentTags',
  GET_SHARED_MEMORY_STATUS: 'getSharedMemoryStatus',

  // [REQ-SIDE_PANEL_BROWSER_TABS] Get document.referrer for tabs (run in SW so injection is in tab context)
  GET_TAB_REFERRERS: 'getTabReferrers',
  // [REQ-BOOKMARK_USAGE_TRACKING] [ARCH-BOOKMARK_USAGE_TRACKING] [IMPL-BOOKMARK_USAGE_TRACKING] Usage and navigation graph queries
  GET_BOOKMARK_USAGE: 'getBookmarkUsage',
  GET_BOOKMARK_USAGE_STATS: 'getBookmarkUsageStats',
  GET_BOOKMARK_NAVIGATION_GRAPH: 'getBookmarkNavigationGraph',
  GET_BOOKMARK_INBOUND_LINKS: 'getBookmarkInboundLinks',
  // [REQ-SIDE_PANEL_RECENTLY_CLOSED_TABS] [ARCH-SIDE_PANEL_RECENTLY_CLOSED_TABS] [IMPL-SIDE_PANEL_RECENTLY_CLOSED_TABS] Get recently closed tabs from chrome.sessions
  GET_RECENTLY_CLOSED_TABS: 'getRecentlyClosedTabs',
  // [REQ-SIDE_PANEL_BROWSER_TABS] Get page body text per tab for filter (SW executeScript per tab)
  GET_TABS_PAGE_TEXT: 'getTabsPageText',
  // [REQ-SIDE_PANEL_BROWSER_TABS] Get important-tags snippet (alt, h1–h3, meta, og:title) per tab for filter (SW executeScript per tab)
  GET_TABS_IMPORTANT_TAGS: 'getTabsImportantTags',

  // Content script lifecycle
  CONTENT_SCRIPT_READY: 'contentScriptReady',

  // Overlay configuration
  UPDATE_OVERLAY_CONFIG: 'updateOverlayConfig',
  GET_OVERLAY_CONFIG: 'getOverlayConfig',

  // Development/debug
  DEV_COMMAND: 'devCommand',
  ECHO: 'echo',

  // [REQ-AI_TAGGING_POPUP] [ARCH-AI_TAGGING_FLOW] AI tagging
  GET_PAGE_CONTENT: 'GET_PAGE_CONTENT',
  // [IMPL-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE]
  CAPTURE_PAGE_ARCHIVE: 'CAPTURE_PAGE_ARCHIVE',
  GET_PAGE_ARCHIVE: 'GET_PAGE_ARCHIVE',
  DELETE_PAGE_ARCHIVE: 'DELETE_PAGE_ARCHIVE',
  // [REQ-ARCHIVED_CONTENT_SEARCH] [ARCH-ARCHIVED_CONTENT_SEARCH] [IMPL-ARCHIVED_CONTENT_SEARCH]
  SEARCH_ARCHIVED_CONTENT: 'SEARCH_ARCHIVED_CONTENT',
  // [REQ-PAGE_SCREENSHOT_ARCHIVE] [ARCH-PAGE_SCREENSHOT_ARCHIVE] [IMPL-PAGE_SCREENSHOT_ARCHIVE]
  CAPTURE_PAGE_SCREENSHOT: 'CAPTURE_PAGE_SCREENSHOT',
  GET_PAGE_SCREENSHOTS: 'GET_PAGE_SCREENSHOTS',
  DELETE_PAGE_SCREENSHOTS: 'DELETE_PAGE_SCREENSHOTS',
  GET_AI_TAGS: 'GET_AI_TAGS',
  GET_SESSION_TAGS: 'getSessionTags',
  RECORD_SESSION_TAGS: 'recordSessionTags',

  // [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE] Message type for opening side panel. Implements contract: popup sends this type; SW handles in onMessage and calls chrome.sidePanel.open({ windowId }).
  OPEN_SIDE_PANEL: 'OPEN_SIDE_PANEL',
  // [REQ-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX] Popup/command/menu open Local Bookmarks Index via SW OPEN_BOOKMARKS_INDEX_TAB.
  OPEN_BOOKMARKS_INDEX: 'OPEN_BOOKMARKS_INDEX',
  // [REQ-LOCAL_QUERY_API] Write ~/.hoverboard/aggregate-snapshot.json for Local Query API
  REFRESH_API_SNAPSHOT: 'REFRESH_API_SNAPSHOT',
  // [REQ-LINK_HEALTH] Batch URL health checks
  CHECK_LINK_HEALTH: 'CHECK_LINK_HEALTH',
  GET_LINK_HEALTH: 'GET_LINK_HEALTH',
  // [REQ-ICON_CLICK_BEHAVIOR] [IMPL-ICON_CLICK_BEHAVIOR] SW sends after opening panel (and on index tab create); side panel closes itself if visible and open long enough (toggle).
  REQUEST_SIDE_PANEL_CLOSE: 'REQUEST_SIDE_PANEL_CLOSE'
}

export class MessageHandler {
  constructor (bookmarkProvider = null, tagService = null, archiveStore = null, screenshotStore = null) {
    // [ARCH-LOCAL_STORAGE_PROVIDER] Use active bookmark provider (PinboardService or LocalBookmarkService)
    this.bookmarkProvider = bookmarkProvider || new PinboardService()
    this.tagService = tagService || new TagService(this.bookmarkProvider)
    this.configManager = new ConfigManager()
    this.archiveSearch = new ArchiveContentSearch()
    this.archiveStore = archiveStore || new PageArchiveStore({ archiveSearch: this.archiveSearch })
    this.screenshotStore = screenshotStore || null
    this.crossResourceRetrievalService = new CrossResourceRetrievalService({
      bookmarkReader: this.bookmarkProvider,
      archiveStore: this.archiveStore,
      archiveSearch: this.archiveSearch,
      browserApi: browser
    })
    this.libraryPortabilityService = new LibraryPortabilityService({
      bookmarkReader: this.bookmarkProvider,
      storageIndexReader: new StorageIndex(),
      configReader: this.configManager,
      archiveReader: this.archiveStore,
      screenshotReader: this.screenshotStore
    })

    // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] Initialize tab search service
    this.tabSearchService = new TabSearchService()
  }

  /**
   * [ARCH-LOCAL_STORAGE_PROVIDER] Swap the active bookmark provider at runtime (e.g. after storage mode change).
   * @param {import('../features/pinboard/pinboard-service.js').PinboardService | import('../features/storage/local-bookmark-service.js').LocalBookmarkService} provider - PinboardService or LocalBookmarkService instance
   */
  setBookmarkProvider (provider) {
    this.bookmarkProvider = provider
    this.tagService.pinboardService = provider
    if (this.crossResourceRetrievalService) this.crossResourceRetrievalService.bookmarkReader = provider
    if (this.libraryPortabilityService) this.libraryPortabilityService.bookmarkReader = provider
  }

  /**
   * [IMPL-PAGE_ARCHIVE_STORAGE] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE]
   * Wire the service worker's configured Local/File archive adapters after provider initialization.
   */
  setArchiveServices (archiveStore, screenshotStore = null, archiveSearch = this.archiveSearch) {
    this.archiveSearch = archiveSearch || this.archiveSearch
    this.archiveStore = archiveStore || this.archiveStore
    this.screenshotStore = screenshotStore || this.screenshotStore
    if (this.archiveStore) this.archiveStore.archiveSearch = this.archiveSearch
    if (this.crossResourceRetrievalService) {
      this.crossResourceRetrievalService.archiveStore = this.archiveStore
      this.crossResourceRetrievalService.archiveSearch = this.archiveSearch
    }
    if (this.libraryPortabilityService) {
      this.libraryPortabilityService.archiveReader = this.archiveStore
      this.libraryPortabilityService.screenshotReader = this.screenshotStore
    }
  }

  /**
   * [IMPL-CROSS_RESOURCE_RETRIEVAL] [ARCH-CROSS_RESOURCE_RETRIEVAL] [REQ-CROSS_RESOURCE_RETRIEVAL]
   * Bind the read-only retrieval service after source providers are initialized.
   */
  setCrossResourceRetrievalService (service) {
    this.crossResourceRetrievalService = service || null
  }

  /**
   * [IMPL-LIBRARY_PORTABILITY] [ARCH-LIBRARY_PORTABILITY] [REQ-LIBRARY_PORTABILITY]
   * Bind package export/import orchestration after durable storage providers are initialized.
   */
  setLibraryPortabilityService (service) {
    this.libraryPortabilityService = service || null
  }

  /**
   * [IMPL-UI_TESTABILITY_HOOKS] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION] [REQ-MODULE_VALIDATION]
   * Set optional callback invoked after each message is processed (for tests). Signature: ({ type, data, response, error, senderContext }) => void
   * @param {((arg: { type: string, data?: unknown, response?: unknown, error?: unknown, senderContext?: { tabId?: number, url?: string } }) => void) | null} fn
   */
  setOnMessageProcessed (fn) {
    this._onMessageProcessed = typeof fn === 'function' ? fn : null
  }

  /**
   * Process incoming messages with modern async/await pattern.
   * [IMPL-RUNTIME_VALIDATION] Validates envelope and data (for critical types) before dispatch.
   * @param {{ type: string, data?: Record<string, unknown> }} message - The message object (type + optional data)
   * @param {chrome.runtime.MessageSender} sender - Chrome extension sender info (tab, id, url)
   * @returns {Promise<unknown>} - Response data or { error, details } on validation failure
   */
  async processMessage (message, sender) {
    // [IMPL-RUNTIME_VALIDATION] Validate message envelope; reject invalid shape before dispatch
    const envelopeResult = validateMessageEnvelope(message)
    if (!envelopeResult.success) {
      const issues = envelopeResult.error?.issues
      debugError('[IMPL-RUNTIME_VALIDATION] Invalid message envelope', issues != null ? JSON.stringify(issues) : 'envelope validation failed')
      return { error: 'Invalid message', details: issues ?? 'envelope validation failed' }
    }
    const { type } = envelopeResult.data
    const rawData = envelopeResult.data.data

    // [IMPL-RUNTIME_VALIDATION] Validate data for critical message types (incremental; no schema = no check)
    const dataResult = validateMessageData(type, rawData)
    if (!dataResult.success) {
      const dataIssues = dataResult.error?.issues
      debugError('[IMPL-RUNTIME_VALIDATION] Invalid message data for type', type, dataIssues != null ? JSON.stringify(dataIssues) : 'data validation failed')
      return { error: 'Invalid message', details: dataIssues ?? 'data validation failed' }
    }
    const data = dataResult.data

    let tabId = sender.tab?.id
    let url = sender.tab?.url

    // If sender doesn't have tab context (e.g., popup), get current active tab
    if (!tabId && (type === MESSAGE_TYPES.SEARCH_TABS || type === MESSAGE_TYPES.GET_CURRENT_BOOKMARK)) {
      try {
        debugLog('[MESSAGE-HANDLER] Getting current active tab for popup request')

        // Try multiple strategies to get the current tab
        let tabs = await browser.tabs.query({ active: true, currentWindow: true })
        debugLog('[MESSAGE-HANDLER] Found tabs (current window):', tabs.length)

        // If no tabs found in current window, try all windows
        if (tabs.length === 0) {
          debugLog('[MESSAGE-HANDLER] No tabs in current window, trying all windows')
          tabs = await browser.tabs.query({ active: true })
          debugLog('[MESSAGE-HANDLER] Found tabs (all windows):', tabs.length)
        }

        // If still no tabs, try getting any tab
        if (tabs.length === 0) {
          debugLog('[MESSAGE-HANDLER] No active tabs found, trying any tab')
          tabs = await browser.tabs.query({})
          debugLog('[MESSAGE-HANDLER] Found total tabs:', tabs.length)

          // Use the first tab if available
          if (tabs.length > 0) {
            tabId = tabs[0].id
            url = tabs[0].url
            debugLog('[MESSAGE-HANDLER] Using first available tab:', { tabId, url })
          }
        } else {
          tabId = tabs[0].id
          url = tabs[0].url
          debugLog('[MESSAGE-HANDLER] Using active tab:', { tabId, url })
        }

        if (!tabId) {
          debugError('[MESSAGE-HANDLER] No tabs available at all')
        }
      } catch (error) {
        debugError('[MESSAGE-HANDLER] Failed to get current tab:', error)
        debugError('[MESSAGE-HANDLER] Error details:', {
          message: error.message,
          stack: error.stack,
          chromeError: browser.runtime.lastError
        })
      }
    }

    const senderContext = { tabId, url }
    let response
    try {
      switch (type) {
        case MESSAGE_TYPES.GET_CURRENT_BOOKMARK:
          response = await this.handleGetCurrentBookmark(data, url, tabId)
          break
        case MESSAGE_TYPES.GET_TAGS_FOR_URL:
          response = await this.handleGetTagsForUrl(data)
          break
        case MESSAGE_TYPES.GET_RECENT_BOOKMARKS:
          response = await this.handleGetRecentBookmarks(data, url)
          break
        case MESSAGE_TYPES.GET_LOCAL_BOOKMARKS_FOR_INDEX:
          response = await this.handleGetLocalBookmarksForIndex()
          break
        case MESSAGE_TYPES.GET_AGGREGATED_BOOKMARKS_FOR_INDEX:
          response = await this.handleGetAggregatedBookmarksForIndex()
          break
        case MESSAGE_TYPES.GET_OPTIONS:
          response = await this.handleGetOptions()
          break
        case MESSAGE_TYPES.SAVE_BOOKMARK:
          response = await this.handleSaveBookmark(data)
          break
        case MESSAGE_TYPES.DELETE_BOOKMARK:
          response = await this.handleDeleteBookmark(data)
          break
        case MESSAGE_TYPES.SAVE_TAG:
          response = await this.handleSaveTag(data)
          break
        case MESSAGE_TYPES.DELETE_TAG:
          response = await this.handleDeleteTag(data)
          break
        case MESSAGE_TYPES.GET_STORAGE_BACKEND_FOR_URL:
          response = await this.handleGetStorageBackendForUrl(data)
          break
        case MESSAGE_TYPES.MOVE_BOOKMARK_TO_STORAGE:
          response = await this.handleMoveBookmarkToStorage(data)
          break
        case MESSAGE_TYPES.INHIBIT_URL:
          response = await this.handleInhibitUrl(data)
          break
        case MESSAGE_TYPES.SEARCH_TITLE:
          response = await this.handleSearchTitle(data, tabId)
          break
        case MESSAGE_TYPES.SEARCH_LIBRARY_RESOURCES:
          response = await this.handleSearchLibraryResources(data)
          break
        case MESSAGE_TYPES.EXPORT_LIBRARY_PACKAGE:
          response = await this.handleExportLibraryPackage(data)
          break
        case MESSAGE_TYPES.IMPORT_LIBRARY_PACKAGE:
          response = await this.handleImportLibraryPackage(data)
          break
        case MESSAGE_TYPES.SEARCH_TABS:
          response = await this.handleSearchTabs(data, tabId)
          break
        case MESSAGE_TYPES.GET_SEARCH_HISTORY:
          response = await this.handleGetSearchHistory()
          break
        case MESSAGE_TYPES.CLEAR_SEARCH_STATE:
          response = await this.handleClearSearchState()
          break
        case MESSAGE_TYPES.ADD_TAG_TO_RECENT:
          response = await this.handleAddTagToRecent(data)
          break
        case MESSAGE_TYPES.GET_USER_RECENT_TAGS:
          response = await this.handleGetUserRecentTags(data)
          break
        case MESSAGE_TYPES.GET_SHARED_MEMORY_STATUS:
          response = await this.handleGetSharedMemoryStatus()
          break
        case MESSAGE_TYPES.GET_TAB_ID:
          if (!tabId) {
            try {
              const tabs = await browser.tabs.query({ active: true, currentWindow: true })
              if (tabs.length > 0) tabId = tabs[0].id
            } catch (err) {
              debugError('[MESSAGE-HANDLER] Error getting active tab:', err)
            }
          }
          response = { tabId }
          break
        case MESSAGE_TYPES.CONTENT_SCRIPT_READY:
          response = await this.handleContentScriptReady(data, tabId, url)
          break
        case MESSAGE_TYPES.UPDATE_OVERLAY_CONFIG:
          response = await this.handleUpdateOverlayConfig(data)
          break
        case MESSAGE_TYPES.GET_OVERLAY_CONFIG:
          response = await this.handleGetOverlayConfig()
          break
        case MESSAGE_TYPES.BOOKMARK_UPDATED:
          response = await this.handleBookmarkUpdated(data, tabId)
          break
        case MESSAGE_TYPES.TAG_UPDATED:
          response = await this.handleTagUpdated(data, tabId)
          break
        case MESSAGE_TYPES.ECHO:
          response = { echo: data, timestamp: Date.now() }
          break
        case MESSAGE_TYPES.GET_PAGE_CONTENT:
          response = await this.handleGetPageContent(data)
          break
        case MESSAGE_TYPES.CAPTURE_PAGE_ARCHIVE:
          response = await this.handleCapturePageArchive({ ...data, tabId: data?.tabId ?? tabId, url: data?.url || url })
          break
        case MESSAGE_TYPES.GET_PAGE_ARCHIVE:
          response = await this.handleGetPageArchive(data)
          break
        case MESSAGE_TYPES.DELETE_PAGE_ARCHIVE:
          response = await this.handleDeletePageArchive(data)
          break
        case MESSAGE_TYPES.SEARCH_ARCHIVED_CONTENT:
          response = await this.handleSearchArchivedContent(data)
          break
        case MESSAGE_TYPES.CAPTURE_PAGE_SCREENSHOT:
          response = await this.handleCapturePageScreenshot({ ...data, tabId: data?.tabId ?? tabId, url: data?.url || url })
          break
        case MESSAGE_TYPES.GET_PAGE_SCREENSHOTS:
          response = await this.handleGetPageScreenshots(data)
          break
        case MESSAGE_TYPES.DELETE_PAGE_SCREENSHOTS:
          response = await this.handleDeletePageScreenshots(data)
          break
        case MESSAGE_TYPES.GET_AI_TAGS:
          response = await this.handleGetAiTags(data)
          break
        case MESSAGE_TYPES.GET_SESSION_TAGS:
          response = await this.handleGetSessionTags()
          break
        case MESSAGE_TYPES.RECORD_SESSION_TAGS:
          response = await this.handleRecordSessionTags(data)
          break
        case MESSAGE_TYPES.DEV_COMMAND:
          response = await this.processDevCommand(data, senderContext)
          break
        default:
          throw new Error(`Unknown message type: ${type}`)
      }
    } catch (error) {
      if (this._onMessageProcessed) {
        this._onMessageProcessed({ type, data, response: null, error: error.message, senderContext })
      }
      throw error
    }
    if (this._onMessageProcessed) {
      this._onMessageProcessed({ type, data, response, error: null, senderContext })
    }
    return response
  }

  /**
   * [REQ-UI_INSPECTION] Handle DEV_COMMAND subcommands for tests and debug panel (only when caller has set debug flag).
   * [IMPL-DEV_COMMAND_INSPECTION] [REQ-UI_INSPECTION] [REQ-URL_TAGS_DISPLAY] [REQ-PER_BOOKMARK_STORAGE_BACKEND] Subcommands: getCurrentBookmark, getTagsForUrl, getStorageBackendForUrl; getStorageSnapshot in SW.
   */
  async processDevCommand (data, senderContext) {
    const sub = data?.subcommand
    if (!sub) return { error: 'missing subcommand' }
    const url = data?.url || senderContext?.url
    const tabId = data?.tabId ?? senderContext?.tabId
    try {
      switch (sub) {
        case 'getCurrentBookmark':
          if (!url) return { error: 'url required' }
          return await this.handleGetCurrentBookmark(data, url, tabId)
        case 'getTagsForUrl':
          if (!url) return { error: 'url required' }
          return await this.handleGetTagsForUrl({ ...data, url })
        case 'getStorageBackendForUrl':
          if (!url) return { error: 'url required' }
          return await this.handleGetStorageBackendForUrl({ url })
        default:
          return { error: 'unknown subcommand' }
      }
    } catch (err) {
      return { error: err.message }
    }
  }

  async handleGetCurrentBookmark (data, url, tabId) {
    // [IMPL-SCREENSHOT_MODE] [REQ-LOCAL_BOOKMARKS_INDEX] Prefer data.url when http(s) (screenshot mode popup-as-tab); else sender tab url.
    const dataUrl = data?.url && typeof data.url === 'string' && (data.url.startsWith('http://') || data.url.startsWith('https://')) ? data.url : null
    const targetUrl = dataUrl || url || data?.url
    if (!targetUrl) {
      throw new Error('No URL provided')
    }

    debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Getting bookmark for URL:', targetUrl)

    // Check if URL is allowed (not in inhibit list)
    debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Checking if URL is allowed...')
    const isAllowed = await this.configManager.isUrlAllowed(targetUrl)
    if (!isAllowed) {
      return { success: true, data: { blocked: true, url: targetUrl } }
    }
    debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] URL is allowed, getting bookmark data...')

    // [IMPL-URL_TAGS_DISPLAY] Single source: getBookmarkForDisplay (router + normalize); do not short-circuit when no Pinboard auth so local/file/sync bookmarks and tags are shown
    const hasAuth = await this.configManager.hasAuthToken()
    debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Getting bookmark data from provider (router)...')
    const raw = await this.bookmarkProvider.getBookmarkForUrl(targetUrl, data?.title)
    const normalized = normalizeBookmarkForDisplay(raw)
    debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Bookmark data retrieved:', normalized)

    normalized.url = normalized.url || targetUrl
    // [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] Flag so panel can skip creating bookmark when clearing to-read
    normalized.exists = !!(raw && typeof raw === 'object')
    if (!hasAuth) normalized.needsAuth = true

    // [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] Return a plain object so url/exists survive structured clone to side panel (fixes "0 tabs modified" when reply.data.url was undefined in panel).
    const dataOut = {
      url: String(normalized.url || targetUrl),
      description: normalized.description ?? '',
      tags: Array.isArray(normalized.tags) ? normalized.tags : [],
      toread: normalized.toread ?? 'no',
      shared: normalized.shared ?? 'yes',
      exists: !!normalized.exists,
      extended: normalized.extended ?? '',
      time: normalized.time ?? '',
      updated_at: normalized.updated_at ?? '',
      hash: normalized.hash ?? ''
    }
    if (normalized.needsAuth) dataOut.needsAuth = true

    const response = { success: true, data: dataOut }
    debugLog('[IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] Service worker response structure:', {
      success: response.success,
      dataType: typeof response.data,
      dataKeys: response.data ? Object.keys(response.data) : null,
      hasUrl: !!response.data?.url,
      hasTags: !!response.data?.tags,
      tagCount: response.data?.tags ? (Array.isArray(response.data.tags) ? response.data.tags.length : 'not-array') : 0,
      hasDescription: !!response.data?.description,
      hasShared: response.data?.shared !== undefined,
      hasToread: response.data?.toread !== undefined
    })

    // Update browser badge if configured
    const config = await this.configManager.getConfig()
    if (config.setIconOnLoad && tabId) {
      // Badge update handled by service worker
    }

    return response
  }

  /**
   * [IMPL-URL_TAGS_DISPLAY] Centralized tag storage: return tags array for URL from same source as badge/popup.
   * @param {Object} data - { url: string }
   * @returns {Promise<{ tags: string[] }>}
   */
  async handleGetTagsForUrl (data) {
    const targetUrl = data?.url
    if (!targetUrl) {
      return { tags: [] }
    }
    const tags = await getTagsForUrl(this.bookmarkProvider, targetUrl)
    debugLog('[MESSAGE-HANDLER] [IMPL-URL_TAGS_DISPLAY] getTagsForUrl:', targetUrl, 'tags:', tags?.length)
    return { tags: tags || [] }
  }

  async handleGetRecentBookmarks (data, senderUrl) {
    debugLog('[MESSAGE-HANDLER] [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] Handling getRecentBookmarks request:', data)
    debugLog('[MESSAGE-HANDLER] [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] Sender URL:', senderUrl)

    // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] - Get user recent tags excluding current site
    const recentTags = await this.tagService.getUserRecentTagsExcludingCurrent(data.currentTags || [])

    debugLog('[MESSAGE-HANDLER] [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] User recent tags (excluding current):', recentTags)

    const response = {
      ...data,
      recentTags
    }

    debugLog('[MESSAGE-HANDLER] [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] Returning response:', response)
    return response
  }

  /**
   * [REQ-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX]
   * Return all bookmarks from local storage only. Always uses LocalBookmarkService, not bookmarkProvider.
   * @returns {Promise<{ bookmarks: Array }>}
   */
  async handleGetLocalBookmarksForIndex () {
    try {
      const localService = new LocalBookmarkService(this.tagService)
      const bookmarks = await localService.getAllBookmarks()
      debugLog('[MESSAGE-HANDLER] [IMPL-LOCAL_BOOKMARKS_INDEX] getLocalBookmarksForIndex:', bookmarks.length)
      return { bookmarks }
    } catch (error) {
      debugError('[MESSAGE-HANDLER] [IMPL-LOCAL_BOOKMARKS_INDEX] getLocalBookmarksForIndex failed:', error)
      return { bookmarks: [], error: error.message }
    }
  }

  /**
   * [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-LOCAL_BOOKMARKS_INDEX] Return local + file + sync bookmarks with storage field (for index page).
   * @returns {Promise<{ bookmarks: Array<{ ...bookmark, storage: 'local'|'file'|'sync' }> }>}
   */
  async handleGetAggregatedBookmarksForIndex () {
    try {
      if (typeof this.bookmarkProvider.getAllBookmarksForIndex === 'function') {
        const bookmarks = await this.bookmarkProvider.getAllBookmarksForIndex()
        debugLog('[MESSAGE-HANDLER] getAggregatedBookmarksForIndex:', bookmarks.length)
        return { bookmarks }
      }
      const localService = new LocalBookmarkService(this.tagService)
      const bookmarks = (await localService.getAllBookmarks()).map(b => ({ ...b, storage: 'local' }))
      return { bookmarks }
    } catch (error) {
      debugError('[MESSAGE-HANDLER] getAggregatedBookmarksForIndex failed:', error)
      return { bookmarks: [], error: error.message }
    }
  }

  /**
   * [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] - Handle tag addition to recent list (current site only)
   * @param {Object} data - Message data containing tagName and currentSiteUrl
   * @returns {Promise<Object>} Success status
   */
  async handleAddTagToRecent (data) {
    try {
      const { tagName, currentSiteUrl } = data

      debugLog('[MESSAGE-HANDLER] [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] Adding tag to recent list:', { tagName, currentSiteUrl })

      if (!tagName || !currentSiteUrl) {
        throw new Error('tagName and currentSiteUrl are required')
      }

      // Add tag to user recent list for current site only
      const success = await this.tagService.addTagToUserRecentList(tagName, currentSiteUrl)

      debugLog('[MESSAGE-HANDLER] [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] Tag addition result:', success)

      return { success }
    } catch (error) {
      debugError('[MESSAGE-HANDLER] [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] Error adding tag to recent:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] - Handle get user recent tags request
   * @param {Object} data - Message data
   * @returns {Promise<Object>} Recent tags data
   */
  async handleGetUserRecentTags (data) {
    try {
      debugLog('[MESSAGE-HANDLER] [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] Getting user recent tags')

      const recentTags = await this.tagService.getUserRecentTags()

      debugLog('[MESSAGE-HANDLER] [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] User recent tags:', recentTags)

      return { recentTags }
    } catch (error) {
      debugError('[MESSAGE-HANDLER] [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] Error getting user recent tags:', error)
      return { recentTags: [], error: error.message }
    }
  }

  /**
   * [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] - Handle get shared memory status request
   * @returns {Promise<Object>} Shared memory status
   */
  async handleGetSharedMemoryStatus () {
    try {
      debugLog('[MESSAGE-HANDLER] [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] Getting shared memory status')

      // Get the service worker instance to access shared memory
      const serviceWorker = await this.getServiceWorker()
      if (serviceWorker && serviceWorker.recentTagsMemory) {
        const status = serviceWorker.recentTagsMemory.getMemoryStatus()
        return { recentTagsMemory: serviceWorker.recentTagsMemory, status }
      }

      return { recentTagsMemory: null, status: 'not_available' }
    } catch (error) {
      debugError('[MESSAGE-HANDLER] [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] Error getting shared memory status:', error)
      return { recentTagsMemory: null, status: 'error', error: error.message }
    }
  }

  /**
   * [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] - Get service worker instance
   * @returns {Promise<Object|null>} Service worker instance or null
   */
  async getServiceWorker () {
    try {
      // In Manifest V3, we need to access the service worker instance
      // This is a bit tricky since we're already in the service worker context
      if (typeof self !== 'undefined' && self.recentTagsMemory) {
        return self
      }

      // Try to get it from the global scope
      if (typeof globalThis !== 'undefined' && globalThis.recentTagsMemory) {
        return globalThis
      }

      return null
    } catch (error) {
      debugError('[MESSAGE-HANDLER] [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] Error getting service worker:', error)
      return null
    }
  }

  async handleGetOptions () {
    debugLog('[MESSAGE-HANDLER] Processing GET_OPTIONS')
    const options = await this.configManager.getOptions()
    debugLog('[MESSAGE-HANDLER] Returning options:', options)
    return options
  }

  /**
   * [REQ-AI_TAGGING_POPUP] [ARCH-AI_TAGGING_FLOW] [IMPL-AI_TAGGING_READABILITY]
   * Get page title and text via scripting.executeScript so it works even when the content script
   * was not injected (e.g. tab opened before extension load). Uses body.innerText; same max length as Readability path.
   */
  async handleGetPageContent (data) {
    const tabId = data?.tabId
    if (tabId == null) return { success: false, error: 'tabId required' }
    const timeoutError = { success: false, error: 'Page content unavailable. Reload the page and try again, or use a different tab.' }
    const scripting = (typeof chrome !== 'undefined' && chrome.scripting) ? chrome.scripting : (typeof browser !== 'undefined' && browser.scripting) ? browser.scripting : null
    if (!scripting) return timeoutError
    // [IMPL-AI_TAGGING_READABILITY] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] SW fallback when content script not injected: title + body.innerText, 16k cap in caller.
    const extractInPage = () => {
      const title = (document.title && String(document.title).trim()) || ''
      const raw = document.body && document.body.innerText ? String(document.body.innerText).trim() : ''
      return { title, textContent: raw }
    }
    try {
      const results = await scripting.executeScript({ target: { tabId }, func: extractInPage })
      const raw = results && results[0] && results[0].result
      if (!raw || typeof raw !== 'object') return timeoutError
      const maxLen = 16000
      const textContent = (raw.textContent && raw.textContent.length > maxLen) ? raw.textContent.slice(0, maxLen) : (raw.textContent || '')
      return { title: raw.title || '', textContent }
    } catch (e) {
      debugError('[MESSAGE-HANDLER] GET_PAGE_CONTENT executeScript failed:', e)
      return timeoutError
    }
  }

  /**
   * [IMPL-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE]
   * Capture live page source through scripting, then associate the saved archive with selected-backend bookmark ownership.
   */
  async handleCapturePageArchive (data) {
    const tabId = data?.tabId
    const url = data?.url
    if (tabId == null || !url) return { success: false, code: 'InvalidRequest', error: 'tabId and url required', bookmarkCreated: false }

    const captureArchive = async (captureUrl, captureContext = {}) => {
      const scripting = (typeof chrome !== 'undefined' && chrome.scripting)
        ? chrome.scripting
        : (typeof browser !== 'undefined' && browser.scripting) ? browser.scripting : null
      if (!scripting) return { success: false, code: 'CaptureFailed', error: 'Page capture API unavailable' }
      try {
        const results = await scripting.executeScript({
          target: { tabId: captureContext.tabId },
          func: () => {
            /**
             * ## EXTRACT_SOURCE_PRESENTATION
             * - [IMPL-PAGE_ARCHIVE_STORAGE] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE] How: extract only computed background, foreground, link, and color-scheme intent from the live document without copying source CSS.
             * - Contract:
             *   - INPUT: live document
             *   - PRE: document is available in the page-world executeScript context
             *   - OUTPUT: raw source presentation profile
             *   - POST:
             *     - background is the first opaque computed background found while walking from body toward document
             *     - text and link are computed color values; color-scheme is light, dark, or absent
             *     - no stylesheet text, inline style text, layout, script, or external asset enters the result
             *   - FAILURE_MODES: MissingDocument
             *   - EFFECTS: pure
             *   - TERMINATION: total
             * - PROCEDURE: EXTRACT_SOURCE_PRESENTATION
             *   - IF document or document.documentElement is absent: RETURN {}
             *   - nodes = body followed by each parent through document.documentElement
             *   - FOR node IN nodes:
             *     - style = GET_COMPUTED_STYLE(node)
             *     - IF background is absent and style.backgroundColor is opaque: SET background
             *   - text = GET_COMPUTED_STYLE(body OR document.documentElement).color
             *   - link = GET_COMPUTED_STYLE(first anchor OR body OR document.documentElement).color
             *   - colorScheme = document.documentElement.style.colorScheme OR computed color-scheme intent
             *   - RETURN { background, text, link, colorScheme }
             */
            const extractSourcePresentation = () => {
              const root = document.documentElement
              const body = document.body
              if (!root) return {}
              const nodes = []
              let node = body || root
              while (node) {
                nodes.push(node)
                if (node === root) break
                node = node.parentElement
              }
              const isOpaque = value => {
                if (!value || value === 'transparent') return false
                const alpha = String(value).match(/^rgba\([^,]+,[^,]+,[^,]+,\s*([^)]+)\)$/i)
                return !alpha || Number(alpha[1]) === 1
              }
              let background = ''
              for (const candidate of nodes) {
                const style = getComputedStyle(candidate)
                if (!background && isOpaque(style.backgroundColor)) background = style.backgroundColor
              }
              const textNode = body || root
              const linkNode = document.querySelector('a') || textNode
              const textStyle = getComputedStyle(textNode)
              const linkStyle = getComputedStyle(linkNode)
              const rootStyle = getComputedStyle(root)
              const colorScheme = [root.style.colorScheme, rootStyle.colorScheme]
                .map(value => String(value || '').trim().toLowerCase())
                .find(value => value === 'light' || value === 'dark') || ''
              return {
                background,
                text: textStyle.color || '',
                link: linkStyle.color || '',
                colorScheme
              }
            }
            return {
              title: document.title || '',
              html: document.body?.innerHTML || document.documentElement?.innerHTML || '',
              textContent: document.body?.innerText || document.body?.textContent || '',
              sourcePresentationProfile: extractSourcePresentation()
            }
          }
        })
        const source = results?.[0]?.result
        return capturePageContentFromSource({ ...source, url: captureUrl }, data)
      } catch (error) {
        debugError('[IMPL-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] CAPTURE_PAGE_ARCHIVE failed:', error)
        return { success: false, code: 'CaptureFailed', error: error.message }
      }
    }

    const selectedBackendLookup = async (lookupUrl, backend) => {
      if (typeof this.bookmarkProvider.getBookmarkForBackend === 'function') {
        return this.bookmarkProvider.getBookmarkForBackend(lookupUrl, backend)
      }
      return null
    }

    const saveBookmark = bookmark => this.bookmarkProvider.saveBookmark({
      ...bookmark,
      preferredBackend: data.preferredBackend
    })

    return captureArchiveAndAssociateBookmark({
      url,
      preferredBackend: data.preferredBackend,
      captureContext: { tabId }
    }, {
      selectedBackendLookup,
      captureArchive,
      archiveStore: this.archiveStore,
      saveBookmark,
      isUrlAllowed: this.configManager.isUrlAllowed.bind(this.configManager)
    })
  }

  /**
   * [IMPL-OFFLINE_READER_MODE] [ARCH-OFFLINE_READER_MODE] [REQ-OFFLINE_READER_MODE]
   * Read only stored archive data; no live URL fetch is performed.
   */
  async handleGetPageArchive (data) {
    const archive = data?.archiveId
      ? await this.archiveStore.getArchiveById?.(data.archiveId, data?.backend || data?.storage)
      : await this.archiveStore.getArchive(data?.url, data?.backend || data?.storage)
    if (!archive) return { success: false, code: 'MissingArchive', archive: null }
    const staleAfterMs = Number(data?.staleAfterMs || 0)
    const isStale = staleAfterMs > 0 && Date.now() - Date.parse(archive.capturedAt) > staleAfterMs
    return { success: true, archive: { ...archive, status: isStale ? 'stale' : archive.status } }
  }

  /**
   * [IMPL-PAGE_ARCHIVE_STORAGE] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE]
   * Delete readable archive and all screenshot artifacts for the selected bookmark backend.
   */
  async handleDeletePageArchive (data) {
    return this.archiveStore.deleteArchive(data?.url, data?.backend || data?.storage)
  }

  /**
   * [IMPL-ARCHIVED_CONTENT_SEARCH] [ARCH-ARCHIVED_CONTENT_SEARCH] [REQ-ARCHIVED_CONTENT_SEARCH]
   * Rebuild the deterministic text view from current Local/File artifacts before every explicit query.
   */
  async handleSearchArchivedContent (data) {
    const archives = await this.archiveStore.listArchives(data?.backend || data?.storage)
    this.archiveSearch.seed(archives)
    const query = String(data?.query || '').trim()
    const results = query
      ? this.archiveSearch.queryArchivedContent(query)
      : this.archiveSearch.browseArchivedContent(archives)
    return {
      success: true,
      query: String(data?.query || ''),
      results
    }
  }

  /**
   * [IMPL-PAGE_SCREENSHOT_ARCHIVE] [ARCH-PAGE_SCREENSHOT_ARCHIVE] [REQ-PAGE_SCREENSHOT_ARCHIVE]
   * Capture a product screenshot through the browser API boundary; demo screenshot mode is untouched.
   */
  async handleCapturePageScreenshot (data) {
    if (!this.screenshotStore) return { success: false, code: 'StorageUnavailable' }
    const tabId = data?.tabId
    const url = data?.url
    const backend = String(data.backend || data.storage || await this.bookmarkProvider.getStorageBackendForUrl?.(url) || 'local').toLowerCase()
    // [IMPL-PAGE_SCREENSHOT_ARCHIVE] [ARCH-PAGE_SCREENSHOT_ARCHIVE] [REQ-PAGE_SCREENSHOT_ARCHIVE] Validate backend, URL, and dimensions before invoking the browser capture boundary.
    const validation = validateScreenshotRequest({
      url,
      storage: backend,
      options: data.options
    })
    if (!validation.valid) return { success: false, code: validation.code }
    if (!(await this.configManager.isUrlAllowed(url))) {
      console.debug('[IMPL-PAGE_SCREENSHOT_ARCHIVE] Screenshot capture skipped for inhibited URL:', url)
      return { success: false, code: 'InhibitedUrl' }
    }
    const tabs = (typeof chrome !== 'undefined' && chrome.tabs) ? chrome.tabs : browser.tabs
    if (tabId == null) return { success: false, code: 'CaptureFailed' }
    try {
      const captureResult = await captureProductScreenshot({
        tabs,
        windowId: data.windowId,
        options: data.options,
        captureFullPage: data.captureFullPage
      })
      if (!captureResult.success) return captureResult
      const artifactResult = normalizeScreenshotArtifact({
        url,
        storage: backend,
        dataUrl: captureResult.dataUrl,
        options: captureResult.options
      })
      if (!artifactResult.success) return artifactResult
      return this.screenshotStore.saveScreenshot(url, backend, artifactResult.artifact)
    } catch (error) {
      debugError('[IMPL-PAGE_SCREENSHOT_ARCHIVE] CAPTURE_PAGE_SCREENSHOT failed:', error)
      return { success: false, code: 'CaptureFailed', error: error.message }
    }
  }

  /**
   * [IMPL-PAGE_SCREENSHOT_ARCHIVE] [ARCH-PAGE_SCREENSHOT_ARCHIVE] [REQ-PAGE_SCREENSHOT_ARCHIVE]
   * List only persisted product screenshot artifacts.
   */
  async handleGetPageScreenshots (data) {
    if (!this.screenshotStore) return { success: true, screenshots: [] }
    return { success: true, screenshots: await this.screenshotStore.listScreenshots(data?.backend || data?.storage, data?.url) }
  }

  /**
   * [IMPL-PAGE_SCREENSHOT_ARCHIVE] [ARCH-PAGE_SCREENSHOT_ARCHIVE] [REQ-PAGE_SCREENSHOT_ARCHIVE]
   * Remove screenshot artifacts independently or as part of bookmark lifecycle deletion.
   */
  async handleDeletePageScreenshots (data) {
    if (!this.screenshotStore) return { success: true }
    return this.screenshotStore.deleteScreenshots(data?.url, data?.backend || data?.storage)
  }

  /**
   * [REQ-AI_TAGGING_POPUP] [ARCH-AI_TAGGING_FLOW] [IMPL-AI_TAGGING_PROVIDER]
   * Call AI provider for tags; uses config aiApiKey, aiProvider, aiTagLimit and TagService.sanitizeTag.
   */
  async handleGetAiTags (data) {
    const config = await this.configManager.getConfig()
    const apiKey = (config.aiApiKey || '').trim()
    if (!apiKey) return { success: false, error: 'No AI API key configured', tags: [] }
    const provider = config.aiProvider || 'openai'
    const limit = Math.min(128, Math.max(1, Number(config.aiTagLimit) || 64))
    const text = (data?.text || '').trim()
    if (!text) return { success: false, error: 'No text', tags: [] }
    // [IMPL-AI_TAGGING_PROVIDER] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] [REQ-TAG_INPUT_SANITIZATION] Get config, call requestAiTags with TagService.sanitizeTag, return tags.
    try {
      const sanitizeTag = (s) => this.tagService.sanitizeTag(s)
      const tags = await requestAiTags(provider, apiKey, text, limit, { sanitizeTag })
      return { success: true, tags }
    } catch (err) {
      debugError('[MESSAGE-HANDLER] GET_AI_TAGS failed:', err)
      return { success: false, error: err.message, tags: [] }
    }
  }

  /**
   * [REQ-AI_TAGGING_POPUP] [IMPL-SESSION_TAGS] Return session tags (lowercase) for auto-apply.
   */
  async handleGetSessionTags () {
    const tags = await getSessionTags()
    return { success: true, tags }
  }

  /**
   * [IMPL-SESSION_TAGS] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] Add tags to session set (called when user adds tags).
   */
  async handleRecordSessionTags (data) {
    const tags = Array.isArray(data?.tags) ? data.tags : (data?.tag ? [data.tag] : [])
    await recordSessionTags(tags)
    return { success: true }
  }

  async handleSaveBookmark (data) {
    // [IMPL-URL_TAGS_DISPLAY] Previous tags from same source as badge/popup (getTagsForUrl returns normalized array)
    const previousTags = await getTagsForUrl(this.bookmarkProvider, data.url)
    const newTags = Array.isArray(data.tags) ? data.tags : (data.tags ? String(data.tags).split(' ').filter(tag => tag.trim()) : [])
    // Compute which tags are newly added
    const addedTags = newTags.filter(tag => !previousTags.includes(tag))

    const result = await this.bookmarkProvider.saveBookmark(data)

    // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Only track newly added tags
    for (const tag of addedTags) {
      if (tag.trim()) {
        try {
          await this.tagService.handleTagAddition(tag.trim(), data)
        } catch (error) {
          debugError(`[IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] Failed to track tag "${tag}":`, error)
          // Don't fail the entire operation if tag tracking fails
        }
      }
    }

    // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] - Track newly added tags for current site only
    for (const tag of addedTags) {
      if (tag.trim()) {
        try {
          await this.tagService.addTagToUserRecentList(tag.trim(), data.url)
        } catch (error) {
          debugError(`[IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] Failed to add tag "${tag}" to user recent list:`, error)
          // Don't fail the entire operation if tag tracking fails
        }
      }
    }

    // [IMPL-SESSION_TAGS] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] Record added tags for session auto-apply
    if (addedTags.length > 0) {
      try {
        await recordSessionTags(addedTags.map(t => t.trim()).filter(Boolean))
      } catch (err) {
        debugError('[IMPL-SESSION_TAGS] recordSessionTags failed:', err)
      }
    }

    return result
  }

  /**
   * [IMPL-BOOKMARK_ROUTER] [REQ-LOCAL_BOOKMARKS_INDEX] Pass full data so preferredBackend reaches BookmarkRouter.
   */
  async handleDeleteBookmark (data) {
    const result = await this.bookmarkProvider.deleteBookmark(data)
    if (result?.success && (data?.preferredBackend === 'local' || data?.preferredBackend === 'file' || !data?.preferredBackend)) {
      const cleanup = await this.archiveStore.deleteArchive(data?.url, data?.preferredBackend)
      if (!cleanup.success) {
        console.warn('[IMPL-PAGE_ARCHIVE_STORAGE] Bookmark deleted but archive cleanup failed:', cleanup)
        return { ...result, archiveCleanup: cleanup }
      }
    }
    return result
  }

  async handleSaveTag (data) {
    const result = await this.bookmarkProvider.saveTag(data)

    // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Enhanced tag tracking for tag save
    if (data.value && data.value.trim()) {
      try {
        await this.tagService.handleTagAddition(data.value.trim(), data)
      } catch (error) {
        debugError(`[IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] Failed to track tag "${data.value}":`, error)
        // Don't fail the entire operation if tag tracking fails
      }
    }

    // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] - Track tag addition for current site only
    if (data.value && data.value.trim() && data.url) {
      try {
        await this.tagService.addTagToUserRecentList(data.value.trim(), data.url)
      } catch (error) {
        debugError(`[IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] Failed to add tag "${data.value}" to user recent list:`, error)
        // Don't fail the entire operation if tag tracking fails
      }
    }

    // [IMPL-SESSION_TAGS] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] Record tag for session auto-apply
    if (data.value && data.value.trim()) {
      try {
        await recordSessionTags([data.value.trim()])
      } catch (err) {
        debugError('[IMPL-SESSION_TAGS] recordSessionTags failed:', err)
      }
    }

    return result
  }

  async handleDeleteTag (data) {
    return this.bookmarkProvider.deleteTag(data)
  }

  /**
   * [REQ-PER_BOOKMARK_STORAGE_BACKEND] [IMPL-BOOKMARK_ROUTER] Get storage backend for URL (for move UI).
   */
  async handleGetStorageBackendForUrl (data) {
    if (typeof this.bookmarkProvider.getStorageBackendForUrl === 'function') {
      return this.bookmarkProvider.getStorageBackendForUrl(data?.url || '')
    }
    return this.configManager.getStorageMode()
  }

  /**
   * [REQ-PER_BOOKMARK_STORAGE_BACKEND] [IMPL-BOOKMARK_ROUTER] Move bookmark to target storage.
   */
  async handleMoveBookmarkToStorage (data) {
    if (typeof this.bookmarkProvider.moveBookmarkToStorage !== 'function') {
      return { success: false, code: 'unsupported', message: 'Move not supported' }
    }
    const url = data?.url
    const targetBackend = data?.targetBackend
    if (!url || !targetBackend) {
      return { success: false, code: 'invalid', message: 'url and targetBackend required' }
    }
    return this.bookmarkProvider.moveBookmarkToStorage(url, targetBackend)
  }

  async handleInhibitUrl (data) {
    return this.configManager.addInhibitUrl(data.url)
  }

  async handleSearchTitle (data, tabId) {
    // TODO: Implement title search functionality
    // This was a complex feature in the original code
    return { searchCount: 0, tabId }
  }

  /**
   * ## SEARCH_LIBRARY_RESOURCES_MESSAGE
   * - [IMPL-CROSS_RESOURCE_RETRIEVAL] [ARCH-CROSS_RESOURCE_RETRIEVAL] [REQ-CROSS_RESOURCE_RETRIEVAL] How: expose the query contract through a new message while keeping SEARCH_TITLE compatibility explicit.
   * - Contract:
   *   - INPUT: message with type SEARCH_LIBRARY_RESOURCES and query data
   *   - PRE: message handler has the retrieval service and response channel
   *   - OUTPUT: retrieval result or structured error response
   *   - POST: one response is returned; no source write occurs
   *   - FAILURE_MODES: InvalidQuery, InvalidScope, InvalidPagination
   *   - EFFECTS: Async, IO
   *   - TERMINATION: total
   * - PROCEDURE: SEARCH_LIBRARY_RESOURCES_MESSAGE
   *   - response = AWAIT QUERY_CROSS_RESOURCES(message.data)
   *   - RETURN response
   *   - SEARCH_TITLE remains a compatibility route returning its documented legacy shape until a separate deprecation change updates callers and tests
   */
  /**
   * [IMPL-CROSS_RESOURCE_RETRIEVAL] [ARCH-CROSS_RESOURCE_RETRIEVAL] [REQ-CROSS_RESOURCE_RETRIEVAL]
   * Dispatch one read-only cross-resource query without mutating any source.
   */
  async handleSearchLibraryResources (data) {
    if (typeof this.crossResourceRetrievalService?.query !== 'function') {
      return { error: 'Retrieval service unavailable' }
    }
    return this.crossResourceRetrievalService.query(data || {})
  }

  /**
   * ## LIBRARY_PORTABILITY_MESSAGE
   * - [IMPL-LIBRARY_PORTABILITY] [ARCH-LIBRARY_PORTABILITY] [REQ-LIBRARY_PORTABILITY] How: expose export, dry-run planning, and restore operations through thin message/UI bindings without changing existing CSV, HTML, or config controls.
   * - Contract:
   *   - INPUT: package operation message and operation-specific data
   *   - PRE: message handler has the portability service and response channel
   *   - OUTPUT: package, dry-run plan, or restore report
   *   - POST: one response is returned and UI status distinguishes pending, success, warning, and failure
   *   - FAILURE_MODES: InvalidPackage, PlanFailed, RestoreFailed
   *   - EFFECTS: Async, IO
   *   - TERMINATION: total
   * - PROCEDURE: LIBRARY_PORTABILITY_MESSAGE
   *   - IF operation = export: RETURN AWAIT COLLECT_LIBRARY_PACKAGE()
   *   - IF operation = plan: validated = VALIDATE_LIBRARY_PACKAGE(input.package); RETURN PLAN_LIBRARY_RESTORE(validated, input.current, input.policy, input.targets)
   *   - IF operation = restore: validated = VALIDATE_LIBRARY_PACKAGE(input.package); plan = PLAN_LIBRARY_RESTORE(validated, input.current, input.policy, input.targets); RETURN EXECUTE_LIBRARY_RESTORE(validated, plan, input.adapters, input.backupStore, input.policy)
   */
  /**
   * [IMPL-LIBRARY_PORTABILITY] [ARCH-LIBRARY_PORTABILITY] [REQ-LIBRARY_PORTABILITY]
   * Dispatch package export, dry-run planning, or verified restore through a thin binding.
   */
  async handleExportLibraryPackage (data) {
    if (typeof this.libraryPortabilityService?.export !== 'function') {
      return { error: 'Library portability service unavailable' }
    }
    return this.libraryPortabilityService.export(data || {})
  }

  async handleImportLibraryPackage (data = {}) {
    if (!this.libraryPortabilityService) {
      return { error: 'Library portability service unavailable' }
    }
    if (data.mode === 'plan' && typeof this.libraryPortabilityService.plan === 'function') {
      return this.libraryPortabilityService.plan(data)
    }
    if (data.mode === 'restore' && typeof this.libraryPortabilityService.restore === 'function') {
      return this.libraryPortabilityService.restore(data)
    }
    return { error: 'Invalid library package operation' }
  }

  /**
   * [TAB-SEARCH-CORE] Handle tab search request
   */
  async handleSearchTabs (data, tabId) {
    try {
      const { searchText } = data

      debugLog('[TAB-SEARCH-CORE] Starting tab search:', { searchText, tabId })

      if (!searchText || !searchText.trim()) {
        throw new Error('Search text is required')
      }

      if (!tabId) {
        throw new Error('Current tab ID is required')
      }

      debugLog('[TAB-SEARCH-CORE] Calling tabSearchService.searchAndNavigate')
      const result = await this.tabSearchService.searchAndNavigate(searchText, tabId)
      debugLog('[TAB-SEARCH-CORE] Search result:', result)
      return result
    } catch (error) {
      debugError('[TAB-SEARCH-CORE] Search tabs error:', error)
      throw error
    }
  }

  /**
   * [TAB-SEARCH-STATE] Handle get search history request
   */
  async handleGetSearchHistory () {
    try {
      const history = this.tabSearchService.getSearchHistory()
      return { history }
    } catch (error) {
      debugError('[TAB-SEARCH-STATE] Get search history error:', error)
      throw error
    }
  }

  /**
   * [TAB-SEARCH-STATE] Handle clear search state request
   */
  async handleClearSearchState () {
    try {
      this.tabSearchService.clearSearchState()
      return { success: true }
    } catch (error) {
      debugError('[TAB-SEARCH-STATE] Clear search state error:', error)
      throw error
    }
  }

  async handleContentScriptReady (data, tabId, url) {
    // Handle content script ready notification
    debugLog('Content script ready:', { tabId, url, data })
    return { acknowledged: true, tabId, timestamp: Date.now() }
  }

  async handleUpdateOverlayConfig (data) {
    try {
      await this.configManager.updateConfig(data)

      // Broadcast the configuration update to all content scripts
      await this.broadcastToAllTabs({
        message: 'updateOverlayTransparency',
        config: data
      })

      return { success: true, updated: data }
    } catch (error) {
      debugError('Failed to update overlay config:', error)
      throw new Error('Failed to update overlay configuration')
    }
  }

  async handleGetOverlayConfig () {
    try {
      const config = await this.configManager.getConfig()

      return {
        overlayTransparencyMode: config.overlayTransparencyMode,
        overlayPositionMode: config.overlayPositionMode,
        overlayOpacityNormal: config.overlayOpacityNormal,
        overlayOpacityHover: config.overlayOpacityHover,
        overlayOpacityFocus: config.overlayOpacityFocus,
        overlayAdaptiveVisibility: config.overlayAdaptiveVisibility,
        overlayBlurAmount: config.overlayBlurAmount
      }
    } catch (error) {
      debugError('Failed to get overlay config:', error)
      throw new Error('Failed to get overlay configuration')
    }
  }

  /**
   * [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TOGGLE_SYNC] - Handle bookmark updates across interfaces
   * @param {Object} data - Bookmark data
   * @param {number} tabId - Tab ID
   */
  async handleBookmarkUpdated (data, tabId) {
    try {
      debugLog('[MessageHandler] handleBookmarkUpdated called', { data, tabId })
      // Update the bookmark with new privacy setting or other changes
      const result = await this.bookmarkProvider.saveBookmark(data)
      debugLog('[MessageHandler] Bookmark updated via bookmarkProvider.saveBookmark', { result })
      // Optionally broadcast to all tabs if needed
      await this.broadcastToAllTabs({
        type: 'BOOKMARK_UPDATED',
        data
      })
      debugLog('[MessageHandler] BOOKMARK_UPDATED broadcasted to all tabs', { data })
      return { success: true, updated: data }
    } catch (error) {
      debugError('[IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TOGGLE_SYNC] Failed to handle bookmark update:', error)
      throw new Error('Failed to update bookmark across interfaces')
    }
  }

  /**
   * [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TAG_SYNC] - Handle tag updates across interfaces
   * @param {Object} data - Tag update data
   * @param {number} tabId - Tab ID
   */
  async handleTagUpdated (data, tabId) {
    try {
      debugLog('[IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TAG_SYNC] Handling tag update:', data)

      // [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TAG_SYNC] - Validate tag update data
      if (!data || !data.url || !Array.isArray(data.tags)) {
        throw new Error('Invalid tag update data')
      }

      // [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TAG_SYNC] - Broadcast tag update to all tabs
      await this.broadcastToAllTabs({
        type: 'TAG_UPDATED',
        data
      })

      debugLog('[IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TAG_SYNC] Tag update broadcasted successfully')
      return { success: true, updated: data }
    } catch (error) {
      debugError('[IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TAG_SYNC] Failed to handle tag update:', error)
      if (error && error.message === 'Invalid tag update data') {
        throw error
      } else {
        throw new Error('Failed to update tags across interfaces')
      }
    }
  }

  /**
   * Send message to content script
   * @param {number} tabId - Tab ID to send message to
   * @param {Object} message - Message to send
   */
  async sendToTab (tabId, message) {
    try {
      await browser.tabs.sendMessage(tabId, message)
    } catch (error) {
      debugError('Failed to send message to tab:', error)
    }
  }

  /**
   * Broadcast message to all tabs
   * @param {Object} message - Message to broadcast
   */
  async broadcastToAllTabs (message) {
    try {
      const tabs = await browser.tabs.query({})
      const promises = tabs.map(tab =>
        this.sendToTab(tab.id, message).catch(() => {
          // Ignore errors for inactive tabs
        })
      )
      await Promise.all(promises)
    } catch (error) {
      debugError('Failed to broadcast message:', error)
    }
  }
}
