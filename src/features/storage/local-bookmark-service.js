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
 * ## ROUTER_STORAGE_BOOKMARK_TIMES
 *
 * - [IMPL-BOOKMARK_CREATE_UPDATE_TIMES] [IMPL-BOOKMARK_ROUTER] [IMPL-STORAGE_INDEX] [ARCH-BOOKMARK_CREATE_UPDATE_TIMES] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-BOOKMARK_CREATE_UPDATE_TIMES] [REQ-RELIABILITY] How: Preserves bookmark time fields while router storage operations select a provider and update the storage index.
 * - Contract:
 *   - INPUT: bookmark data, preferred backend, storage providers, storage index
 *   - PRE: bookmark URL and provider map are available
 *   - OUTPUT: provider result with normalized time fields and updated storage index
 *   - POST:
 *     - success => saved bookmark retains time and updated_at; index points to the selected backend
 *   - FAILURE_MODES: ProviderSaveFailed
 *   - DATA: bookmark time fields and storage-index backend mapping
 *   - DATA_TRANSITION: successful save updates the selected URL mapping; failed save leaves the mapping unchanged
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: ROUTER_STORAGE_BOOKMARK_TIMES
 *   - Normalize missing updated_at from time
 *   - Resolve provider from preferred backend
 *   - AWAIT provider save
 *   - IF save succeeds: update storage index for the URL
 *   - RETURN provider result
 *
 * === END IMPL-FULL-BLOCK: IMPL-BOOKMARK_CREATE_UPDATE_TIMES ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-LOCAL_BOOKMARK_SERVICE ===
 * [IMPL-LOCAL_BOOKMARK_SERVICE] [ARCH-LOCAL_STORAGE_PROVIDER] [REQ-STORAGE_MODE_DEFAULT] [REQ-PER_BOOKMARK_STORAGE_BACKEND] — chrome.storage.local bookmark provider (one of five BookmarkRouter peers); same contract as Pinboard; keyed by URL. ARCH-STORAGE is settings/portability only — not this bookmark backend. Contract: url/bookmark/tag inputs and provider-shaped outputs; storage key and shape.
 *
 * ## GET_BOOKMARK_FOR_URL
 *
 * - [IMPL-LOCAL_BOOKMARK_SERVICE] [ARCH-LOCAL_STORAGE_PROVIDER] [REQ-STORAGE_MODE_DEFAULT] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Implements getBookmarkForUrl(url) behavior for IMPL-LOCAL_BOOKMARK_SERVICE.
 * - Contract:
 *   - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark object or list of bookmarks or success/error; shape matches provider contract | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: storage key = hoverboard_local_bookmarks; value = object keyed by normalized URL -> bookmark
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: GET_BOOKMARK_FOR_URL
 *   - bookmarks = LOAD bookmarks
 *   - urlNorm = normalize(url)
 *   - RETURN bookmarks[urlNorm] or null
 *   - How (sub-block): Merge data into bookmark shape and persist to storage.
 *
 * ## SAVE_BOOKMARK
 *
 * - [IMPL-LOCAL_BOOKMARK_SERVICE] [ARCH-LOCAL_STORAGE_PROVIDER] [REQ-STORAGE_MODE_DEFAULT] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Implements saveBookmark(data) behavior for IMPL-LOCAL_BOOKMARK_SERVICE.
 * - Contract:
 *   - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark object or list of bookmarks or success/error; shape matches provider contract | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: storage key = hoverboard_local_bookmarks; value = object keyed by normalized URL -> bookmark
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: SAVE_BOOKMARK
 *   - bookmarks = LOAD bookmarks
 *   - urlNorm = normalize(data.url)
 *   - bookmarks[urlNorm] = merge(data into bookmark shape with url, description, extended, tags, time, shared, toread, hash)
 *   - PERSIST bookmarks to storage under key
 *   - RETURN { success: true }
 *   - How (sub-block): Remove by normalized URL and persist.
 *
 * ## DELETE_BOOKMARK
 *
 * - [IMPL-LOCAL_BOOKMARK_SERVICE] [ARCH-LOCAL_STORAGE_PROVIDER] [REQ-STORAGE_MODE_DEFAULT] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Implements deleteBookmark(url) behavior for IMPL-LOCAL_BOOKMARK_SERVICE.
 * - Contract:
 *   - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark object or list of bookmarks or success/error; shape matches provider contract | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: storage key = hoverboard_local_bookmarks; value = object keyed by normalized URL -> bookmark
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: DELETE_BOOKMARK
 *   - bookmarks = LOAD bookmarks
 *   - REMOVE bookmarks[normalize(url)]
 *   - PERSIST bookmarks to storage
 *   - RETURN { success: true }
 *   - How (sub-block): Update tags on bookmark and persist.
 *
 * ## SAVE_TAG
 *
 * - [IMPL-LOCAL_BOOKMARK_SERVICE] [ARCH-LOCAL_STORAGE_PROVIDER] [REQ-STORAGE_MODE_DEFAULT] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Implements saveTag(data), deleteTag(data) behavior for IMPL-LOCAL_BOOKMARK_SERVICE.
 * - Contract:
 *   - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark object or list of bookmarks or success/error; shape matches provider contract | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: storage key = hoverboard_local_bookmarks; value = object keyed by normalized URL -> bookmark
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: SAVE_TAG
 *   - bookmark = getBookmarkForUrl(data.url)
 *   - update tags on bookmark
 *   - saveBookmark(bookmark) or equivalent
 *   - RETURN { success: true }
 *   - How (sub-block): Sort by time descending and return first count.
 *
 * ## GET_RECENT_BOOKMARKS
 *
 * - [IMPL-LOCAL_BOOKMARK_SERVICE] [ARCH-LOCAL_STORAGE_PROVIDER] [REQ-STORAGE_MODE_DEFAULT] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Implements getRecentBookmarks(count) behavior for IMPL-LOCAL_BOOKMARK_SERVICE.
 * - Contract:
 *   - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark object or list of bookmarks or success/error; shape matches provider contract | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: storage key = hoverboard_local_bookmarks; value = object keyed by normalized URL -> bookmark
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: GET_RECENT_BOOKMARKS
 *   - bookmarks = LOAD bookmarks
 *   - list = values(bookmarks)
 *   - SORT list BY time DESCENDING
 *   - RETURN list[0..count-1]
 *
 * ## ROUTER_STORAGE_LOCAL_PROVIDER
 *
 * - [IMPL-LOCAL_BOOKMARK_SERVICE] [IMPL-BOOKMARK_ROUTER] [IMPL-STORAGE_INDEX] [ARCH-LOCAL_STORAGE_PROVIDER] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-PER_BOOKMARK_STORAGE_BACKEND] [REQ-RELIABILITY] How: Supplies the local provider operation used by BookmarkRouter and persists the selected URL mapping through StorageIndex.
 * - Contract:
 *   - INPUT: bookmark data, preferred backend, local provider, storage index
 *   - PRE: local provider storage and router index are initialized
 *   - OUTPUT: provider save result and updated backend mapping
 *   - POST:
 *     - success => local storage contains the normalized bookmark and the index identifies local
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: local bookmark map and storage-index backend mapping
 *   - DATA_TRANSITION: local bookmark map and index update only after a successful provider save
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: ROUTER_STORAGE_LOCAL_PROVIDER
 *   - Normalize bookmark URL and time fields
 *   - AWAIT local provider save
 *   - IF save succeeds: set the URL backend in StorageIndex
 *   - RETURN provider result
 *
 * === END IMPL-FULL-BLOCK: IMPL-LOCAL_BOOKMARK_SERVICE ===
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
 *   - DATA: activeHeadGroup, activeFooterGroup, footer tab and panel DOM state
 *   - DATA_TRANSITION: initialization selects Stores at the head and sets the footer to its collapsed state
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
 *   - DATA: root CSS variables --index-head-sticky-height and --index-footer-sticky-height
 *   - DATA_TRANSITION: measured panel heights replace the root CSS variable values after initialization, transition, or resize
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
 *   - DATA: root sticky-thead-offset class
 *   - DATA_TRANSITION: class is present only while the table top is above the measured head-panel height
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
 * ## ROUTER_STORAGE_REGEX_SAVE
 *
 * - [IMPL-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE] [IMPL-BOOKMARK_ROUTER] [IMPL-STORAGE_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE] [REQ-RELIABILITY] How: Connects selected-bookmark regex replacement to preferred-backend router persistence and storage-index refresh.
 * - Contract:
 *   - INPUT: selected URLs, bookmark map, regex options, router save operation
 *   - PRE: selected URLs and replacement options are available
 *   - OUTPUT: refreshed bookmark rows with unchanged selections restored
 *   - POST:
 *     - success => only changed payloads are sent to the router and the display is reloaded
 *   - FAILURE_MODES: InvalidPattern, BookmarkSaveFailed
 *   - DATA: selected URL set and displayed bookmark rows
 *   - DATA_TRANSITION: changed rows are persisted; selection is cleared during reload and restored for visible URLs
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: ROUTER_STORAGE_REGEX_SAVE
 *   - Build replacement payload for each selected URL
 *   - IF replacement is unchanged: skip router save
 *   - AWAIT router save for each changed payload
 *   - Reload bookmark rows
 *   - Restore visible selections
 *
 * === END IMPL-FULL-BLOCK: IMPL-LOCAL_BOOKMARKS_INDEX ===
 */
import { TagService } from '../tagging/tag-service.js'
import { debugLog, debugError } from '../../shared/utils.js'

const STORAGE_KEY = 'hoverboard_local_bookmarks'

export class LocalBookmarkService {
  constructor (tagService = null) {
    this.tagService = tagService || new TagService(this)
  }

  /** [IMPL-LOCAL_BOOKMARK_SERVICE] Normalize URL for storage key (match PinboardService.cleanUrl behavior). */
  cleanUrl (url) {
    if (!url) return ''
    return url.trim().replace(/\/+$/, '')
  }

  /** [IMPL-LOCAL_BOOKMARK_SERVICE] [IMPL-BOOKMARK_CREATE_UPDATE_TIMES] Empty bookmark shape (match PinboardService.createEmptyBookmark). */
  createEmptyBookmark (url, title) {
    return {
      url: url || '',
      description: title || '',
      extended: '',
      tags: [],
      time: '',
      updated_at: '',
      shared: 'yes',
      toread: 'no',
      hash: ''
    }
  }

  /** [IMPL-LOCAL_BOOKMARK_SERVICE] Read all bookmarks from chrome.storage.local. */
  async _getAllBookmarks () {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEY)
      const raw = result[STORAGE_KEY]
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
      return raw
    } catch (e) {
      debugError('[IMPL-LOCAL_BOOKMARK_SERVICE] _getAllBookmarks failed:', e)
      return {}
    }
  }

  /** [IMPL-LOCAL_BOOKMARK_SERVICE] Write full bookmarks map to chrome.storage.local. */
  async _setAllBookmarks (map) {
    await chrome.storage.local.set({ [STORAGE_KEY]: map })
  }

  /** [IMPL-LOCAL_BOOKMARK_SERVICE] [IMPL-BOOKMARK_CREATE_UPDATE_TIMES] Normalize bookmark for return: tags as array; legacy updated_at default to time. */
  _normalizeBookmark (b) {
    if (!b) return null
    const tags = b.tags == null ? [] : Array.isArray(b.tags) ? b.tags : String(b.tags).split(/\s+/).filter(Boolean)
    const time = b.time || ''
    return {
      url: b.url || '',
      description: b.description || '',
      extended: b.extended || '',
      tags,
      time,
      updated_at: b.updated_at ?? time ?? '',
      shared: b.shared === 'no' ? 'no' : 'yes',
      toread: b.toread === 'yes' ? 'yes' : 'no',
      hash: b.hash || ''
    }
  }

  /** [IMPL-LOCAL_BOOKMARK_SERVICE] Generate a stable local hash for a URL. */
  _localHash (url) {
    let h = 0
    const s = String(url)
    for (let i = 0; i < s.length; i++) {
      h = ((h << 5) - h) + s.charCodeAt(i)
      h |= 0
    }
    return 'local-' + Math.abs(h).toString(36)
  }

  async getBookmarkForUrl (url, title = '') {
    try {
      const cleanUrl = this.cleanUrl(url)
      const all = await this._getAllBookmarks()
      const b = all[cleanUrl]
      if (b) {
        debugLog('[IMPL-LOCAL_BOOKMARK_SERVICE] getBookmarkForUrl found:', cleanUrl)
        return this._normalizeBookmark({ ...b, url: cleanUrl })
      }
      debugLog('[IMPL-LOCAL_BOOKMARK_SERVICE] getBookmarkForUrl not found, returning empty:', cleanUrl)
      return this.createEmptyBookmark(url, title)
    } catch (error) {
      debugError('[IMPL-LOCAL_BOOKMARK_SERVICE] getBookmarkForUrl failed:', error)
      return this.createEmptyBookmark(url, title)
    }
  }

  async getRecentBookmarks (count = 15) {
    try {
      const all = await this._getAllBookmarks()
      const list = Object.values(all)
        .map(b => this._normalizeBookmark(b))
        .filter(b => b && b.time)
        .sort((a, b) => (b.time || '').localeCompare(a.time || ''))
        .slice(0, count)
      debugLog('[IMPL-LOCAL_BOOKMARK_SERVICE] getRecentBookmarks:', list.length)
      return list
    } catch (error) {
      debugError('[IMPL-LOCAL_BOOKMARK_SERVICE] getRecentBookmarks failed:', error)
      return []
    }
  }

  /**
   * [REQ-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX]
   * Return full normalized array of all local bookmarks, sorted by time descending.
   * Used by the local bookmarks index page; no count limit.
   */
  async getAllBookmarks () {
    try {
      const all = await this._getAllBookmarks()
      const list = Object.entries(all)
        .map(([url, b]) => this._normalizeBookmark({ ...b, url }))
        .filter(b => b && b.url)
        .sort((a, b) => (b.time || '').localeCompare(a.time || ''))
      debugLog('[IMPL-LOCAL_BOOKMARKS_INDEX] getAllBookmarks:', list.length)
      return list
    } catch (error) {
      debugError('[IMPL-LOCAL_BOOKMARKS_INDEX] getAllBookmarks failed:', error)
      return []
    }
  }

  async saveBookmark (bookmarkData) {
    try {
      const url = bookmarkData?.url ? this.cleanUrl(bookmarkData.url) : ''
      if (!url) {
        return { success: false, code: 'invalid', message: 'URL is required' }
      }
      const tags = bookmarkData.tags == null
        ? []
        : Array.isArray(bookmarkData.tags)
          ? bookmarkData.tags
          : String(bookmarkData.tags).split(/\s+/).filter(Boolean)
      const now = new Date().toISOString()
      const all = await this._getAllBookmarks()
      const existing = all[url]
      // [IMPL-BOOKMARK_CREATE_UPDATE_TIMES] Create: use payload time/updated_at when present (import); else now. Update: keep create time, bump updated_at.
      const payloadTime = typeof bookmarkData.time === 'string' ? bookmarkData.time.trim() : ''
      const payloadUpdated = typeof bookmarkData.updated_at === 'string' ? bookmarkData.updated_at.trim() : ''
      const time = existing ? (existing.time || now) : (payloadTime || now)
      const updatedAt = existing ? now : (payloadUpdated || time)
      const bookmark = {
        url,
        description: bookmarkData.description ?? existing?.description ?? '',
        extended: bookmarkData.extended ?? existing?.extended ?? '',
        tags,
        time,
        updated_at: updatedAt,
        shared: bookmarkData.shared !== undefined ? String(bookmarkData.shared) : (existing?.shared ?? 'yes'),
        toread: bookmarkData.toread !== undefined ? String(bookmarkData.toread) : (existing?.toread ?? 'no'),
        hash: existing?.hash ?? this._localHash(url)
      }
      all[url] = bookmark
      await this._setAllBookmarks(all)
      await this.trackBookmarkTags(bookmark)
      debugLog('[IMPL-LOCAL_BOOKMARK_SERVICE] saveBookmark ok:', url)
      return { success: true, code: 'done', message: 'Operation completed' }
    } catch (error) {
      debugError('[IMPL-LOCAL_BOOKMARK_SERVICE] saveBookmark failed:', error)
      throw error
    }
  }

  async saveTag (tagData) {
    try {
      const currentBookmark = await this.getBookmarkForUrl(tagData.url)
      const existingTags = currentBookmark.tags || []
      const newTags = [...existingTags]
      if (tagData.value && !existingTags.includes(tagData.value)) {
        newTags.push(tagData.value)
      }
      const updatedBookmark = {
        ...currentBookmark,
        ...tagData,
        tags: newTags.join(' ')
      }
      if (tagData.value) {
        await this.tagService.handleTagAddition(tagData.value, updatedBookmark)
      }
      return this.saveBookmark(updatedBookmark)
    } catch (error) {
      debugError('[IMPL-LOCAL_BOOKMARK_SERVICE] saveTag failed:', error)
      throw error
    }
  }

  async deleteBookmark (url) {
    try {
      const cleanUrl = this.cleanUrl(url)
      const all = await this._getAllBookmarks()
      if (!(cleanUrl in all)) {
        debugLog('[IMPL-LOCAL_BOOKMARK_SERVICE] deleteBookmark URL not found:', cleanUrl)
        return { success: true, code: 'done', message: 'Operation completed' }
      }
      delete all[cleanUrl]
      await this._setAllBookmarks(all)
      debugLog('[IMPL-LOCAL_BOOKMARK_SERVICE] deleteBookmark ok:', cleanUrl)
      return { success: true, code: 'done', message: 'Operation completed' }
    } catch (error) {
      debugError('[IMPL-LOCAL_BOOKMARK_SERVICE] deleteBookmark failed:', error)
      throw error
    }
  }

  async deleteTag (tagData) {
    try {
      const currentBookmark = await this.getBookmarkForUrl(tagData.url)
      const existingTags = currentBookmark.tags || []
      const filteredTags = existingTags.filter(tag => tag !== tagData.value)
      const updatedBookmark = {
        ...currentBookmark,
        ...tagData,
        tags: filteredTags.join(' ')
      }
      return this.saveBookmark(updatedBookmark)
    } catch (error) {
      debugError('[IMPL-LOCAL_BOOKMARK_SERVICE] deleteTag failed:', error)
      throw error
    }
  }

  async testConnection () {
    return true
  }

  async trackBookmarkTags (bookmarkData) {
    try {
      const tags = this.extractTagsFromBookmarkData(bookmarkData)
      const sanitizedTags = Array.from(new Set(tags.map(tag => this.tagService.sanitizeTag(tag)).filter(Boolean)))
      if (sanitizedTags.length > 0) {
        for (const sanitizedTag of sanitizedTags) {
          await this.tagService.handleTagAddition(sanitizedTag, bookmarkData)
        }
        debugLog('[IMPL-LOCAL_BOOKMARK_SERVICE] Tracked tags for bookmark:', sanitizedTags)
      }
    } catch (error) {
      debugError('[IMPL-LOCAL_BOOKMARK_SERVICE] Failed to track bookmark tags:', error)
    }
  }

  extractTagsFromBookmarkData (bookmarkData) {
    const tags = []
    if (bookmarkData.tags) {
      if (typeof bookmarkData.tags === 'string') {
        tags.push(...bookmarkData.tags.split(/\s+/).filter(tag => tag.trim()))
      } else if (Array.isArray(bookmarkData.tags)) {
        tags.push(...bookmarkData.tags.filter(tag => tag && tag.trim()))
      }
    }
    return tags
  }
}
