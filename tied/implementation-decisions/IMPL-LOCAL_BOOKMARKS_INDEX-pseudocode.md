# [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [ARCH-STORAGE_INDEX_AND_ROUTER] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-LOCAL_BOOKMARKS_INDEX] [REQ-BROWSER_BOOKMARK_STORAGE] — Index page: getAggregatedBookmarksForIndex (fallback getLocalBookmarksForIndex), metadata-first filter pipeline, table with Storage column, per-store filtered / total provider-row counts, and collapsible fixed footer control panel; Stores L/F/S/B.

## LOAD_LOCAL_BOOKMARKS_INDEX

- [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [REQ-LOCAL_BOOKMARKS_INDEX] [REQ-BROWSER_BOOKMARK_STORAGE] How: LOAD_LOCAL_BOOKMARKS_INDEX: aggregate first; treat error/success:false as failure even when bookmarks is []; then filter.
- Contract:
  - INPUT: none (page load); user actions (search, filter, sort, selection, export/move/delete/import)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: displayed table of bookmarks with Storage column; filtered/sorted list | { error: OperationFailed }
  - POST:
    - success => block outputs match OUTPUT success shape
    - error OperationFailed => no silent partial commit beyond documented best-effort
  - FAILURE_MODES: OperationFailed
  - DATA: allBookmarks (array with storage field), filteredBookmarks, selectedUrls (set), sortKey, timeColumnSource, timeDisplayMode; store checkboxes local|file|sync|browser
  - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
  - EFFECTS: IO, State
  - TERMINATION: total
- PROCEDURE: LOAD_LOCAL_BOOKMARKS_INDEX
  - SEND getAggregatedBookmarksForIndex
  - IF response has error OR success is false OR bookmarks is not an array:
  - SEND getLocalBookmarksForIndex
  - SET allBookmarks = response.bookmarks with storage "local"
  - ELSE:
  - SET allBookmarks = response.bookmarks (each item has storage "local"|"file"|"sync"|"browser")
  - applySearchAndFilter()
  - 1. ON page load:
  - LOAD_LOCAL_BOOKMARKS_INDEX

## SHOULD_RELOAD_BOOKMARKS_ON_STORE_CHANGE

- [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [REQ-LOCAL_BOOKMARKS_INDEX] How: Store checkbox change refilters; if cache empty and at least one store checked, reload (cold SW recovery).
- Contract:
  - INPUT: none (page load); user actions (search, filter, sort, selection, export/move/delete/import)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: displayed table of bookmarks with Storage column; filtered/sorted list
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: allBookmarks (array with storage field), filteredBookmarks, selectedUrls (set), sortKey, timeColumnSource, timeDisplayMode; store checkboxes local|file|sync|browser
  - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
  - EFFECTS: IO, State
  - TERMINATION: total
- PROCEDURE: SHOULD_RELOAD_BOOKMARKS_ON_STORE_CHANGE
  - RETURN allBookmarksLength == 0 AND allowedStoresSize > 0

## GET_ALLOWED_STORES

- [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [REQ-LOCAL_BOOKMARKS_INDEX] [REQ-BROWSER_BOOKMARK_STORAGE] How: getAllowedStores includes browser when #store-browser checked; Move/Import-to targets include browser.
- Contract:
  - INPUT: none (page load); user actions (search, filter, sort, selection, export/move/delete/import)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: displayed table of bookmarks with Storage column; filtered/sorted list
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: allBookmarks (array with storage field), filteredBookmarks, selectedUrls (set), sortKey, timeColumnSource, timeDisplayMode; store checkboxes local|file|sync|browser
  - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
  - EFFECTS: IO, State
  - TERMINATION: total
- PROCEDURE: GET_ALLOWED_STORES
  - SET from checked #store-local|#store-file|#store-sync|#store-browser → { local, file, sync, browser }
  - How (sub-block): Apply Stores selection only after metadata-filtered rows and Store counts are derived.

## INITIALIZE_STORE_FILTERS

- [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [REQ-LOCAL_BOOKMARKS_INDEX] How: The Local Bookmarks Index starts with Local, File, Sync, and Browser Store controls checked so loaded rows are visible without an extra discovery step.
- Contract:
  - INPUT: Store checkbox elements
  - PRE: #store-local, #store-file, #store-sync, and #store-browser exist or are safely skipped
  - OUTPUT: initialized Store controls and count labels
  - POST:
    - success => all four Store checkboxes are checked unless the user changes them
    - success => each count label is available for filtered / total row-count updates
  - EFFECTS: State, DOM
  - TERMINATION: total
- PROCEDURE: INITIALIZE_STORE_FILTERS
  - 1. SET checked = true on #store-local, #store-file, #store-sync, and #store-browser
  - 2. KEEP user changes to checked state; do not reload solely to refresh counts

## COUNT_INDEX_ROWS_BY_STORE

- [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [ARCH-STORAGE_INDEX_AND_ROUTER] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-LOCAL_BOOKMARKS_INDEX] [REQ-BROWSER_BOOKMARK_STORAGE] How: Normalize provider storage values, count rows directly, and derive filtered / total counts before applying Store checkbox selection.
- Contract:
  - INPUT: allBookmarks (provider-row[]), metadataFilteredBookmarks (provider-row[])
  - PRE: arrays may be empty; rows may omit storage; storage values may vary in case or contain whitespace; duplicate URLs remain distinct rows
  - OUTPUT: { local: { filtered, total }, file: { filtered, total }, sync: { filtered, total }, browser: { filtered, total } }
  - POST:
    - success => total counts include every loaded row assigned to a known Store
    - success => filtered counts include rows surviving search, Show only, Hide, and Health filters, before Store checkbox selection
    - success => unknown storage is not attributed to a named Store; missing storage uses Local only for Local fallback rows
  - EFFECTS: pure
  - TERMINATION: total
- PROCEDURE: COUNT_INDEX_ROWS_BY_STORE
  - 1. INITIALIZE counts for local, file, sync, browser with filtered = 0 and total = 0
  - 2. FOR each row IN allBookmarks: store = NORMALIZE_INDEX_STORAGE(row.storage); IF store is known THEN counts[store].total += 1
  - 3. FOR each row IN metadataFilteredBookmarks: store = NORMALIZE_INDEX_STORAGE(row.storage); IF store is known THEN counts[store].filtered += 1
  - 4. RETURN counts
  - How (sub-block): NORMALIZE_INDEX_STORAGE trims and lowercases local|file|sync|browser; missing storage becomes local only for explicitly marked Local fallback rows; unknown values remain unassigned.

## APPLY_SEARCH_AND_FILTER

- [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [ARCH-STORAGE_INDEX_AND_ROUTER] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-LOCAL_BOOKMARKS_INDEX] [REQ-BROWSER_BOOKMARK_STORAGE] How: Implements applySearchAndFilter() behavior for IMPL-LOCAL_BOOKMARKS_INDEX.
- Contract:
  - INPUT: none (page load); user actions (search, filter, sort, selection, export/move/delete/import)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: displayed table of bookmarks with Storage column; filtered/sorted list; Store counts
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: allBookmarks (array with storage field), metadataFilteredBookmarks, filteredBookmarks, storeCounts, selectedUrls (set), sortKey, timeColumnSource, timeDisplayMode; store checkboxes local|file|sync|browser
  - EFFECTS: IO
  - TERMINATION: total
- PROCEDURE: APPLY_SEARCH_AND_FILTER
  - metadataFilteredBookmarks = allBookmarks
  - APPLY search (text)
  - APPLY show-only (tags, toread, private, time range; getShowOnlyDefaultState for Clear)
  - APPLY exclude tags (matchExcludeTags)
  - APPLY Health status filter (FILTER_BOOKMARKS_BY_HEALTH)
  - storeCounts = COUNT_INDEX_ROWS_BY_STORE(allBookmarks, metadataFilteredBookmarks)
  - UPDATE Store count labels with storeCounts filtered / total
  - filteredBookmarks = metadataFilteredBookmarks filtered by Stores selection (matchStoresFilter, getAllowedStores)
  - SORT by sortKey (e.g. time desc)
  - renderTableBody(filteredBookmarks); updateRowCount()
  - How (sub-block): Archived and All resources scopes do not update named Store counts from stale metadata rows; clear or mark them non-applicable.

## HEAD_CONTROL_PANEL

- [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [REQ-LOCAL_BOOKMARKS_INDEX] How: HEAD_CONTROL_PANEL keeps the filter controls fixed at the viewport head and exposes one of Stores, Show only, Hide, or Table Display at a time.
- Contract:
  - INPUT: requestedGroup (string), currentGroup (string)
  - PRE: requestedGroup is one of stores | show-only | hide | table-display
  - OUTPUT: active head group and corresponding visible panel
  - POST:
    - success => exactly one head panel is visible and its tab is selected
    - invalid group => currentGroup and panel visibility remain unchanged
  - FAILURE_MODES: InvalidGroup
  - DATA: activeHeadGroup
  - DATA_TRANSITION: activeHeadGroup changes only to a valid head group
  - EFFECTS: State
  - TERMINATION: total
- PROCEDURE: SET_HEAD_CONTROL_GROUP
  - IF requestedGroup is not a valid head group: RETURN { activeGroup: currentGroup, error: InvalidGroup }
  - SET activeHeadGroup = requestedGroup
  - SET selected tab state for requestedGroup
  - SET hidden = false only for requestedGroup panel
  - SET hidden = true for every other head panel
  - RETURN { activeGroup: activeHeadGroup }

## FOOTER_CONTROL_PANEL

- [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [REQ-LOCAL_BOOKMARKS_INDEX] How: FOOTER_CONTROL_PANEL keeps Actions, Import, and Export fixed at the viewport bottom, starts collapsed, and displays one control group at a time when expanded.
- Contract:
  - INPUT: requestedGroup (string), currentGroup (string or null)
  - PRE: requestedGroup is one of actions | import | export
  - OUTPUT: active footer group (string or null) and corresponding visible panel(s)
  - POST:
    - success with a different requestedGroup => exactly one footer panel is visible and its tab is selected
    - success with the already active requestedGroup => active footer group is null, all footer panels are hidden, and all footer tabs are unselected
    - success with no active footer group => Actions is the sole footer tab with tabindex 0; Import and Export use tabindex -1
    - invalid group => currentGroup and panel visibility remain unchanged
  - FAILURE_MODES: InvalidGroup
  - DATA: activeFooterGroup
  - DATA_TRANSITION: activeFooterGroup changes from null to a valid group, between valid groups, or from the active group to null
  - EFFECTS: State
  - TERMINATION: total
- PROCEDURE: SET_FOOTER_CONTROL_GROUP
  - IF requestedGroup is not a valid footer group: RETURN { activeGroup: currentGroup, error: InvalidGroup }
  - IF requestedGroup == currentGroup:
  - SET activeFooterGroup = null
  - SET selected = false for every footer tab
  - SET tabindex = 0 for Actions and -1 for every other footer tab
  - SET hidden = true for every footer panel
  - RETURN { activeGroup: null }
  - SET activeFooterGroup = requestedGroup
  - SET selected tab state for requestedGroup
  - SET tabindex = 0 for requestedGroup and -1 for every other footer tab
  - SET hidden = false only for requestedGroup panel
  - SET hidden = true for every other footer panel
  - RETURN { activeGroup: activeFooterGroup }

## INITIALIZE_INDEX_CONTROL_TABS

- [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [REQ-LOCAL_BOOKMARKS_INDEX] How: INITIALIZE_INDEX_CONTROL_TABS keeps Stores selected at the head, starts the footer collapsed, and binds accessible tab activation without changing control behavior.
- Contract:
  - INPUT: headTabList, headPanels, footerTabList, footerPanels
  - PRE: each tab references a known panel through aria-controls
  - OUTPUT: initialized head and footer control panels
  - POST:
    - success => Stores is selected and exactly one head panel is visible
    - success => activeFooterGroup is null, all footer tabs are unselected, and all footer panels are hidden
    - success => Actions is the sole footer tab with tabindex 0 while the footer is collapsed
  - DATA: activeHeadGroup, activeFooterGroup, footer tab and panel DOM state
  - DATA_TRANSITION: initialization selects Stores at the head and sets the footer to its collapsed state
  - EFFECTS: State
  - TERMINATION: total
- PROCEDURE: INITIALIZE_INDEX_CONTROL_TABS
  - CALL SET_HEAD_CONTROL_GROUP("stores", "stores")
  - SET activeFooterGroup = null
  - SET selected = false for every footer tab
  - SET tabindex = 0 for Actions and -1 for every other footer tab
  - SET hidden = true for every footer panel
  - ON head tab activation: CALL SET_HEAD_CONTROL_GROUP(requestedGroup, activeHeadGroup)
  - ON footer tab activation: CALL SET_FOOTER_CONTROL_GROUP(requestedGroup, activeFooterGroup)
  - ON footer Enter or Space activation: CALL SET_FOOTER_CONTROL_GROUP(requestedGroup, activeFooterGroup)
  - ON footer ArrowLeft, ArrowRight, Home, or End: move focus to the requested tab and CALL SET_FOOTER_CONTROL_GROUP(requestedGroup, activeFooterGroup)

## SYNC_CONTROL_PANEL_OFFSETS

- [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [REQ-LOCAL_BOOKMARKS_INDEX] How: SYNC_CONTROL_PANEL_OFFSETS measures compact or active fixed head/footer regions so sticky table headers and list spacing avoid control overlap after initialization and every footer transition.
- Contract:
  - INPUT: headPanel (element), footerPanel (element), root (element)
  - PRE: root exists; missing panel elements are allowed
  - OUTPUT: root CSS variables for head offset and footer spacing
  - DATA: root CSS variables --index-head-sticky-height and --index-footer-sticky-height
  - DATA_TRANSITION: measured panel heights replace the root CSS variable values after initialization, transition, or resize
  - POST:
    - success => CSS variables equal the current measured compact or active panel heights
  - EFFECTS: State
  - TERMINATION: total
- PROCEDURE: SYNC_CONTROL_PANEL_OFFSETS
  - IF root is missing: RETURN
  - IF headPanel exists: SET --index-head-sticky-height = headPanel.offsetHeight pixels
  - IF footerPanel exists: SET --index-footer-sticky-height = footerPanel.offsetHeight pixels
  - CALL APPLY_STICKY_THEAD_OFFSET
  - ON initialization, footer transition, or panel resize: REPEAT SYNC_CONTROL_PANEL_OFFSETS

## APPLY_STICKY_THEAD_OFFSET

- [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [REQ-LOCAL_BOOKMARKS_INDEX] How: APPLY_STICKY_THEAD_OFFSET keeps table headings at the table top initially and offsets them below the fixed head controls only after the bookmark list scrolls underneath.
- Contract:
  - INPUT: tableWrapper (element), headPanel (element), root (element)
  - PRE: root, tableWrapper, and headPanel exist
  - OUTPUT: root sticky-thead-offset class state
  - DATA: root sticky-thead-offset class
  - DATA_TRANSITION: class is present only while the table top is above the measured head-panel height
  - POST:
    - tableWrapper top >= headPanel height => root does not have sticky-thead-offset
    - tableWrapper top < headPanel height => root has sticky-thead-offset
  - EFFECTS: State
  - TERMINATION: total
- PROCEDURE: APPLY_STICKY_THEAD_OFFSET
  - tableTop = tableWrapper.getBoundingClientRect().top
  - headHeight = headPanel.offsetHeight
  - IF tableTop < headHeight: ADD sticky-thead-offset to root
  - ELSE: REMOVE sticky-thead-offset from root
  - ON scroll, table visibility change, or IntersectionObserver callback: REPEAT APPLY_STICKY_THEAD_OFFSET

## BULK_DELETE

- [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [REQ-LOCAL_BOOKMARKS_INDEX] [IMPL-BOOKMARK_ROUTER] How: Bulk Delete uses row Storage column as preferredBackend; pending/final #delete-result mirrors Import status UX. Orchestrator: runBulkDelete (bookmarks-table-bulk-delete.js) for composition-testable wiring.
- Contract:
  - INPUT: none (page load); user actions (search, filter, sort, selection, export/move/delete/import)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: displayed table of bookmarks with Storage column; filtered/sorted list | { error: OperationFailed }
  - POST:
    - success => block outputs match OUTPUT success shape
    - error OperationFailed => no silent partial commit beyond documented best-effort
  - FAILURE_MODES: OperationFailed
  - DATA: allBookmarks (array with storage field), filteredBookmarks, selectedUrls (set), sortKey, timeColumnSource, timeDisplayMode; store checkboxes local|file|sync|browser
  - EFFECTS: IO
  - TERMINATION: total
- PROCEDURE: BULK_DELETE
  - IF selectedUrls empty: RETURN
  - runBulkDelete(urls, bookmarksByUrl, sendMessage, confirmFn, #delete-result, onAfterDelete):
  - titles = descriptions for selected URLs from bookmarksByUrl
  - IF NOT confirmFn(buildDeleteConfirmMessage(count, titles)): RETURN cancelled
  - setDeleteResultPending(#delete-result)  # "Deleting…" warning color
  - FOR each url IN urls:
  - bookmark = lookup url in bookmarksByUrl
  - payload = buildDeletePayload(bookmark)  # { url, preferredBackend from storage }
  - SEND deleteBookmark with data = payload
  - COUNT ok / fail from response
  - onAfterDelete()  # CLEAR selectedUrls; loadBookmarks(); updateMoveControlsState()
  - setDeleteResultFinal(#delete-result, formatDeleteResultMessage({ deleted: ok, failed: fail }))
  - How (sub-block): buildDeletePayload(bookmark):
  - IF bookmark missing or no url: RETURN null
  - RETURN { url: bookmark.url, preferredBackend: lowercase(bookmark.storage) OR "local" }

## OPEN_BOOKMARKS_INDEX_TAB

- [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [REQ-LOCAL_BOOKMARKS_INDEX] How: concurrent cold-start messages share one in-flight initBookmarkProvider promise (createProviderInitMutex). OPEN_BOOKMARKS_INDEX_TAB: create index tab then dismiss already-open side panel (tab-create only; not page refresh). How: SW owns create+broadcast so popup/command/menu share one path; panel closes via REQUEST_SIDE_PANEL_CLOSE (icon-toggle semantics).
- Contract:
  - INPUT: none (page load); user actions (search, filter, sort, selection, export/move/delete/import)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: displayed table of bookmarks with Storage column; filtered/sorted list
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: allBookmarks (array with storage field), filteredBookmarks, selectedUrls (set), sortKey, timeColumnSource, timeDisplayMode; store checkboxes local|file|sync|browser
  - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
  - EFFECTS: Async, IO, State
  - TERMINATION: total
- PROCEDURE: OPEN_BOOKMARKS_INDEX_TAB
  - url = runtime.getURL('src/ui/bookmarks-table/bookmarks-table.html')
  - tabs.create({ url })
  - runtime.sendMessage({ type: REQUEST_SIDE_PANEL_CLOSE })
  - How (sub-block): Entry points that call OPEN_BOOKMARKS_INDEX_TAB (not options href):
  - 1. ON OPEN_BOOKMARKS_INDEX message: OPEN_BOOKMARKS_INDEX_TAB
  - 2. ON command open-bookmarks-index: OPEN_BOOKMARKS_INDEX_TAB
  - 3. ON context menu hoverboard-open-bookmarks-index: OPEN_BOOKMARKS_INDEX_TAB
  - 4. Popup: bookmarksIndexBtn -> openBookmarksIndex -> SEND OPEN_BOOKMARKS_INDEX
  - 5. Options: bookmarks-index-link href -> extension URL (no dismiss; out of scope)
  - How (sub-block): Index page init must NOT send REQUEST_SIDE_PANEL_CLOSE (refresh must not re-dismiss after icon reopen).
