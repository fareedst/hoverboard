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
 * === END IMPL-FULL-BLOCK: IMPL-LOCAL_BOOKMARKS_INDEX ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-LOCAL_BOOKMARKS_INDEX_ADD_TAGS ===
 * [IMPL-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] [ARCH-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] [REQ-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] — Add/delete tags to selected bookmarks; parseTagsInput, mergeTags, removeTags, selectionStillVisible; saveBookmark per row. Parse comma-separated input; trim and dedupe case-insensitive.
 *
 * ## MAIN
 *
 * - [IMPL-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] [ARCH-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] [REQ-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] How: Logical block for IMPL-LOCAL_BOOKMARKS_INDEX_ADD_TAGS.
 * - Contract:
 *   - INPUT: context / caller args
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: result
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: MAIN
 *   - 1. parseTagsInput(raw): IF !raw || !raw.trim() RETURN []; parts = raw.split(',').map(s => s.trim()).filter(Boolean); seen = Set(); result = []; FOR p IN parts: low = p.toLowerCase(); IF !seen.has(low): seen.add(low); result.push(p); RETURN result
 *   - How (sub-block): Merge new tags with existing; case-insensitive dedupe.
 *   - 2. mergeTags(existingTags, newTags): existing = existingTags || []; new = newTags || []; lowerSet = Set(existing.map(t => String(t).toLowerCase())); result = [...existing]; FOR tag IN new: t = tag.trim(); IF t && !lowerSet.has(t.toLowerCase()): result.push(t); lowerSet.add(t.toLowerCase()); RETURN result
 *   - How (sub-block): Remove given tags from existing list (case-insensitive).
 *   - 3. removeTags(existingTags, tagsToRemove): removeSet = Set(tagsToRemove.map(t => String(t).trim().toLowerCase()).filter(Boolean)); RETURN existing.filter(t => !removeSet.has(String(t).toLowerCase()))
 *   - How (sub-block): Return set of selected URLs that remain in filtered list.
 *   - 4. selectionStillVisible(selectedUrls, filteredBookmarks): visibleUrls = Set(filteredBookmarks.map(b => b.url).filter(Boolean)); RETURN new Set([...selectedUrls].filter(url => visibleUrls.has(url)))
 *   - How (sub-block): For each selected URL merge new tags and send saveBookmark; refresh and restore selection for still-visible.
 *   - 5. addTagsToSelected(): newTags = parseTagsInput(addTagsInput.value); IF newTags.length === 0 RETURN; urls = Array.from(selectedUrls); byUrl = Map(allBookmarks: url -> bookmark); FOR url IN urls: b = byUrl.get(url); IF !b CONTINUE; payload = buildAddTagsPayload(b, newTags); IF payload SEND saveBookmark(payload); urlsToRestore = Set(selectedUrls); selectedUrls.clear(); loadBookmarks(); FOR url IN selectionStillVisible(urlsToRestore, filteredBookmarks): selectedUrls.add(url); renderTableBody(); addTagsInput.value = ""; updateMoveControlsState()
 *   - How (sub-block): For each selected URL remove tags and send saveBookmark; refresh and restore selection for still-visible.
 *   - 6. deleteTagsFromSelected(): tagsToRemove = parseTagsInput(addTagsInput.value); IF tagsToRemove.length === 0 RETURN; urls = Array.from(selectedUrls); byUrl = Map(allBookmarks: url -> bookmark); FOR url IN urls: b = byUrl.get(url); IF !b CONTINUE; payload = buildRemoveTagsPayload(b, tagsToRemove); IF payload SEND saveBookmark(payload); urlsToRestore = Set(selectedUrls); selectedUrls.clear(); loadBookmarks(); FOR url IN selectionStillVisible(urlsToRestore, filteredBookmarks): selectedUrls.add(url); renderTableBody(); addTagsInput.value = ""; updateMoveControlsState()
 *
 * === END IMPL-FULL-BLOCK: IMPL-LOCAL_BOOKMARKS_INDEX_ADD_TAGS ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE ===
 * [IMPL-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE] [ARCH-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE] [REQ-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE] — Regex find-and-replace on selected fields; applyRegexReplace (pure); regexReplaceSelected sends saveBookmark when changed. Pure function: build payload and set changed iff any selected field value changed.
 *
 * ## APPLY_REGEX_REPLACE
 *
 * - [IMPL-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE] [ARCH-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE] [REQ-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE] How: Implements applyRegexReplace(bookmark, patternStr, replacementStr, options { title, url, tags, notes }) behavior for IMPL-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE.
 * - Contract:
 *   - INPUT: context / caller args
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: result | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: APPLY_REGEX_REPLACE
 *   - TRY reg = new RegExp(patternStr, 'g')
 *   - CATCH e RETURN { payload: null, error: e.message }
 *   - IF !bookmark || !bookmark.url RETURN { payload: null, error: 'missing bookmark or url' }
 *   - IF !patternStr || !patternStr.trim() RETURN { payload: null, error: 'empty pattern' }
 *   - IF !options.title && !options.url && !options.tags && !options.notes RETURN { payload: null, error: 'no fields selected' }
 *   - origDesc = String(bookmark.description ?? ''); origUrl = String(bookmark.url ?? ''); origTags = [...]; origExt = String(bookmark.extended ?? '')
 *   - desc = origDesc; u = origUrl; tagsArr = [...]; ext = origExt
 *   - TRY IF options.title: desc = desc.replace(reg, replacementStr); IF options.url: u = u.replace(reg, replacementStr); IF options.tags: tagsArr = ...; IF options.notes: ext = ext.replace(reg, replacementStr)
 *   - CATCH e RETURN { payload: null, error: e.message }
 *   - changed = (opts.title && desc !== origDesc) || (opts.url && u !== origUrl) || (opts.tags && tagsArr differs from origTags) || (opts.notes && ext !== origExt)
 *   - payload = { url, description: desc, tags: tagsArr, extended: ext, preferredBackend, ...time/updated_at/shared/toread }
 *   - RETURN { payload, error: null, changed }
 *   - How (sub-block): Per selected URL apply regex; save only when changed; refresh and restore selection.
 *
 * ## REGEX_REPLACE_SELECTED
 *
 * - [IMPL-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE] [ARCH-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE] [REQ-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE] How: Implements regexReplaceSelected() behavior for IMPL-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE.
 * - Contract:
 *   - INPUT: context / caller args
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: result | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: REGEX_REPLACE_SELECTED
 *   - patternStr = regexInput.value.trim(); replacementStr = replacementInput.value
 *   - IF !patternStr || selectedUrls.size === 0 RETURN
 *   - options = { title, url, tags, notes } from checkboxes
 *   - IF no field selected: show error; RETURN
 *   - TRY RegExp(patternStr); CATCH: show error; RETURN
 *   - byUrl = Map(allBookmarks: url -> bookmark)
 *   - FOR url IN selectedUrls: b = byUrl.get(url); IF !b CONTINUE; result = applyRegexReplace(b, patternStr, replacementStr, options); IF result.error show and RETURN; IF !result.payload CONTINUE; IF result.changed === false CONTINUE; SEND saveBookmark(result.payload)
 *   - urlsToRestore = Set(selectedUrls); selectedUrls.clear(); loadBookmarks(); selectionStillVisible; renderTableBody(); clear error; updateMoveControlsState()
 *
 * === END IMPL-FULL-BLOCK: IMPL-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE ===
 */
import fs from 'fs'
import path from 'path'
import {
  matchStorageFilter,
  matchStoresFilter,
  parseTimeRangeValue,
  getBookmarkTimeMs,
  inTimeRange,
  matchExcludeTags,
  buildDeleteConfirmMessage,
  getShowOnlyDefaultState,
  parseTagsInput,
  mergeTags,
  buildAddTagsPayload,
  removeTags,
  buildRemoveTagsPayload,
  buildDeletePayload,
  buildAddTagsConfirmMessage,
  buildRemoveTagsConfirmMessage,
  selectionStillVisible,
  applyRegexReplace
} from '../../src/ui/bookmarks-table/bookmarks-table-filter.js'
import { formatTimeAbsolute, formatTimeAge } from '../../src/ui/bookmarks-table/bookmarks-table-time.js'

describe('matchStorageFilter [REQ-LOCAL_BOOKMARKS_INDEX]', () => {
  test('returns true for any bookmark when value is empty (All)', () => {
    expect(matchStorageFilter({ storage: 'local' }, '')).toBe(true)
    expect(matchStorageFilter({ storage: 'file' }, '')).toBe(true)
    expect(matchStorageFilter({ storage: 'sync' }, '')).toBe(true)
    expect(matchStorageFilter({}, '')).toBe(true)
    expect(matchStorageFilter({ storage: 'local' }, '   ')).toBe(true)
  })

  test('returns true only when storage matches value for local', () => {
    expect(matchStorageFilter({ storage: 'local' }, 'local')).toBe(true)
    expect(matchStorageFilter({ storage: 'file' }, 'local')).toBe(false)
    expect(matchStorageFilter({ storage: 'sync' }, 'local')).toBe(false)
    expect(matchStorageFilter({}, 'local')).toBe(true)
  })

  test('returns true only when storage matches value for file', () => {
    expect(matchStorageFilter({ storage: 'file' }, 'file')).toBe(true)
    expect(matchStorageFilter({ storage: 'local' }, 'file')).toBe(false)
    expect(matchStorageFilter({ storage: 'sync' }, 'file')).toBe(false)
  })

  test('returns true only when storage matches value for sync', () => {
    expect(matchStorageFilter({ storage: 'sync' }, 'sync')).toBe(true)
    expect(matchStorageFilter({ storage: 'local' }, 'sync')).toBe(false)
    expect(matchStorageFilter({ storage: 'file' }, 'sync')).toBe(false)
  })

  test('is case-insensitive', () => {
    expect(matchStorageFilter({ storage: 'Local' }, 'local')).toBe(true)
    expect(matchStorageFilter({ storage: 'FILE' }, 'file')).toBe(true)
    expect(matchStorageFilter({ storage: 'Sync' }, 'SYNC')).toBe(true)
  })
})

describe('matchStoresFilter [REQ-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX]', () => {
  test('returns false for all bookmarks when allowedStores is empty', () => {
    const empty = new Set()
    expect(matchStoresFilter({ storage: 'local' }, empty)).toBe(false)
    expect(matchStoresFilter({ storage: 'file' }, empty)).toBe(false)
    expect(matchStoresFilter({ storage: 'sync' }, empty)).toBe(false)
  })

  test('returns false when allowedStores is null or undefined', () => {
    expect(matchStoresFilter({ storage: 'local' }, null)).toBe(false)
    expect(matchStoresFilter({ storage: 'local' }, undefined)).toBe(false)
  })

  test('returns true only when bookmark storage is in allowedStores', () => {
    const localOnly = new Set(['local'])
    expect(matchStoresFilter({ storage: 'local' }, localOnly)).toBe(true)
    expect(matchStoresFilter({ storage: 'file' }, localOnly)).toBe(false)
    expect(matchStoresFilter({ storage: 'sync' }, localOnly)).toBe(false)

    const fileAndSync = new Set(['file', 'sync'])
    expect(matchStoresFilter({ storage: 'local' }, fileAndSync)).toBe(false)
    expect(matchStoresFilter({ storage: 'file' }, fileAndSync)).toBe(true)
    expect(matchStoresFilter({ storage: 'sync' }, fileAndSync)).toBe(true)
  })

  test('includes browser store [REQ-BROWSER_BOOKMARK_STORAGE] [REQ-LOCAL_BOOKMARKS_INDEX]', () => {
    const browserOnly = new Set(['browser'])
    expect(matchStoresFilter({ storage: 'browser' }, browserOnly)).toBe(true)
    expect(matchStoresFilter({ storage: 'local' }, browserOnly)).toBe(false)
    expect(matchStoresFilter({ storage: 'Browser' }, new Set(['browser']))).toBe(true)
  })

  test('defaults missing storage to local and is case-insensitive', () => {
    const localOnly = new Set(['local'])
    expect(matchStoresFilter({}, localOnly)).toBe(true)
    expect(matchStoresFilter({ storage: 'Local' }, new Set(['local']))).toBe(true)
    expect(matchStoresFilter({ storage: 'FILE' }, new Set(['file']))).toBe(true)
  })
})

describe('parseTimeRangeValue and getBookmarkTimeMs [IMPL-LOCAL_BOOKMARKS_INDEX]', () => {
  test('parseTimeRangeValue returns null for empty or invalid', () => {
    expect(parseTimeRangeValue('')).toBe(null)
    expect(parseTimeRangeValue('   ')).toBe(null)
    expect(parseTimeRangeValue('invalid')).toBe(null)
  })

  test('parseTimeRangeValue parses ISO and datetime-local style', () => {
    const ms = parseTimeRangeValue('2025-06-10T12:00')
    expect(ms).not.toBe(null)
    expect(new Date(ms).getFullYear()).toBe(2025)
    expect(new Date(ms).getMonth()).toBe(5)
  })

  test('getBookmarkTimeMs returns ms for time or updated_at', () => {
    const b = { time: '2025-06-10T10:00:00.000Z', updated_at: '2025-06-12T14:00:00.000Z' }
    expect(getBookmarkTimeMs(b, 'time')).not.toBe(null)
    expect(getBookmarkTimeMs(b, 'updated_at')).not.toBe(null)
    expect(getBookmarkTimeMs(b, 'updated_at')).toBeGreaterThan(getBookmarkTimeMs(b, 'time'))
  })

  test('getBookmarkTimeMs returns null when missing', () => {
    expect(getBookmarkTimeMs({}, 'time')).toBe(null)
    expect(getBookmarkTimeMs({ time: 'bad' }, 'time')).toBe(null)
  })
})

describe('inTimeRange [IMPL-LOCAL_BOOKMARKS_INDEX]', () => {
  test('includes bookmark when within start and end', () => {
    const b = { time: '2025-06-11T12:00:00.000Z', updated_at: '2025-06-11T12:00:00.000Z' }
    const start = new Date('2025-06-10T00:00:00Z').getTime()
    const end = new Date('2025-06-15T00:00:00Z').getTime()
    expect(inTimeRange(b, 'time', start, end)).toBe(true)
    expect(inTimeRange(b, 'updated_at', start, end)).toBe(true)
  })

  test('excludes bookmark when before start', () => {
    const b = { time: '2025-06-09T12:00:00.000Z' }
    const start = new Date('2025-06-10T00:00:00Z').getTime()
    const end = new Date('2025-06-15T00:00:00Z').getTime()
    expect(inTimeRange(b, 'time', start, end)).toBe(false)
  })

  test('excludes bookmark when after end', () => {
    const b = { time: '2025-06-16T12:00:00.000Z' }
    const start = new Date('2025-06-10T00:00:00Z').getTime()
    const end = new Date('2025-06-15T00:00:00Z').getTime()
    expect(inTimeRange(b, 'time', start, end)).toBe(false)
  })

  test('null start or end skips that bound', () => {
    const b = { time: '2025-06-11T12:00:00.000Z' }
    const end = new Date('2025-06-15T00:00:00Z').getTime()
    expect(inTimeRange(b, 'time', null, end)).toBe(true)
    const start = new Date('2025-06-10T00:00:00Z').getTime()
    expect(inTimeRange(b, 'time', start, null)).toBe(true)
  })

  test('returns false when bookmark has no valid time', () => {
    expect(inTimeRange({}, 'time', 0, 9999999999999)).toBe(false)
  })
})

describe('matchExcludeTags [IMPL-LOCAL_BOOKMARKS_INDEX]', () => {
  test('returns true when exclude string is empty (keep all)', () => {
    expect(matchExcludeTags({ tags: ['work'] }, '')).toBe(true)
    expect(matchExcludeTags({ tags: ['work'] }, '   ')).toBe(true)
  })

  test('excludes bookmark that has any of the exclude tags', () => {
    expect(matchExcludeTags({ tags: ['work', 'dev'] }, 'archive')).toBe(true)
    expect(matchExcludeTags({ tags: ['work', 'archive'] }, 'archive')).toBe(false)
    expect(matchExcludeTags({ tags: ['work', 'archive'] }, 'archive, done')).toBe(false)
  })

  test('is case-insensitive', () => {
    expect(matchExcludeTags({ tags: ['Work'] }, 'work')).toBe(false)
    expect(matchExcludeTags({ tags: ['archive'] }, 'ARCHIVE')).toBe(false)
  })

  test('handles empty tags array', () => {
    expect(matchExcludeTags({ tags: [] }, 'work')).toBe(true)
    expect(matchExcludeTags({}, 'work')).toBe(true)
  })
})

describe('buildDeleteConfirmMessage [IMPL-LOCAL_BOOKMARKS_INDEX]', () => {
  test('includes count in message', () => {
    expect(buildDeleteConfirmMessage(1, [])).toContain('Delete 1 bookmark?')
    expect(buildDeleteConfirmMessage(3, [])).toContain('Delete 3 bookmarks?')
  })

  test('includes titles when count <= 8', () => {
    const msg = buildDeleteConfirmMessage(2, ['Title A', 'Title B'])
    expect(msg).toContain('Delete 2 bookmarks?')
    expect(msg).toContain('Title A')
    expect(msg).toContain('Title B')
  })

  test('does not add title list when count > 8', () => {
    const titles = Array(10).fill('x')
    const msg = buildDeleteConfirmMessage(10, titles)
    expect(msg).toContain('Delete 10 bookmarks?')
    expect(msg).not.toContain('x')
  })

  test('uses (no title) for empty title', () => {
    const msg = buildDeleteConfirmMessage(1, [''])
    expect(msg).toContain('(no title)')
  })

  test('exactly 8 selected includes titles in message', () => {
    const titles = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    const msg = buildDeleteConfirmMessage(8, titles)
    expect(msg).toContain('Delete 8 bookmarks?')
    expect(msg).toContain('A')
    expect(msg).toContain('H')
  })

  test('9 selected does not include title list', () => {
    const titles = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']
    const msg = buildDeleteConfirmMessage(9, titles)
    expect(msg).toContain('Delete 9 bookmarks?')
    expect(msg).not.toContain('A')
    expect(msg).not.toContain('I')
  })

  test('empty titles array still shows count only', () => {
    const msg = buildDeleteConfirmMessage(3, [])
    expect(msg).toContain('Delete 3 bookmarks?')
    expect(msg).not.toMatch(/\n\n/)
  })
})

describe('buildAddTagsConfirmMessage [REQ-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] [IMPL-LOCAL_BOOKMARKS_INDEX_ADD_TAGS]', () => {
  test('includes tag list and count', () => {
    expect(buildAddTagsConfirmMessage(['work', 'review'], 2)).toContain('work, review')
    expect(buildAddTagsConfirmMessage(['work', 'review'], 2)).toContain('2 bookmarks')
    expect(buildAddTagsConfirmMessage(['x'], 1)).toContain('1 bookmark')
  })
  test('empty tag list shows (none)', () => {
    expect(buildAddTagsConfirmMessage([], 3)).toContain('(none)')
    expect(buildAddTagsConfirmMessage([], 3)).toContain('3 bookmarks')
  })
})

describe('buildRemoveTagsConfirmMessage [REQ-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] [IMPL-LOCAL_BOOKMARKS_INDEX_ADD_TAGS]', () => {
  test('includes tag list and count', () => {
    expect(buildRemoveTagsConfirmMessage(['work', 'review'], 2)).toContain('work, review')
    expect(buildRemoveTagsConfirmMessage(['work', 'review'], 2)).toContain('Remove')
    expect(buildRemoveTagsConfirmMessage(['work', 'review'], 2)).toContain('2 bookmarks')
    expect(buildRemoveTagsConfirmMessage(['x'], 1)).toContain('1 bookmark')
  })
  test('empty tag list shows (none)', () => {
    expect(buildRemoveTagsConfirmMessage([], 3)).toContain('(none)')
    expect(buildRemoveTagsConfirmMessage([], 3)).toContain('3 bookmarks')
  })
})

describe('selectionStillVisible [REQ-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] [IMPL-LOCAL_BOOKMARKS_INDEX_ADD_TAGS]', () => {
  test('returns intersection of selected URLs and displayed bookmark URLs', () => {
    const selected = new Set(['https://a.com', 'https://b.com', 'https://c.com'])
    const filtered = [
      { url: 'https://a.com', description: 'A' },
      { url: 'https://c.com', description: 'C' }
    ]
    const result = selectionStillVisible(selected, filtered)
    expect(result.size).toBe(2)
    expect(result.has('https://a.com')).toBe(true)
    expect(result.has('https://c.com')).toBe(true)
    expect(result.has('https://b.com')).toBe(false)
  })
  test('empty selectedUrls returns empty Set', () => {
    const filtered = [{ url: 'https://x.com' }]
    expect(selectionStillVisible(new Set(), filtered)).toEqual(new Set())
  })
  test('empty filteredBookmarks returns empty Set', () => {
    const selected = new Set(['https://a.com'])
    expect(selectionStillVisible(selected, [])).toEqual(new Set())
  })
  test('all selected visible returns same URLs', () => {
    const selected = new Set(['u1', 'u2'])
    const filtered = [{ url: 'u1' }, { url: 'u2' }]
    const result = selectionStillVisible(selected, filtered)
    expect(result.size).toBe(2)
    expect(result.has('u1')).toBe(true)
    expect(result.has('u2')).toBe(true)
  })
  test('ignores bookmarks with missing or falsy url', () => {
    const selected = new Set(['u1', 'u2'])
    const filtered = [{ url: 'u1' }, {}, { url: null }, { url: 'u2' }]
    const result = selectionStillVisible(selected, filtered)
    expect(result.size).toBe(2)
    expect(result.has('u1')).toBe(true)
    expect(result.has('u2')).toBe(true)
  })
  test('non-array filteredBookmarks treated as empty', () => {
    const selected = new Set(['u1'])
    expect(selectionStillVisible(selected, null)).toEqual(new Set())
    expect(selectionStillVisible(selected, undefined)).toEqual(new Set())
  })
})

describe('Filter pipeline order [IMPL-LOCAL_BOOKMARKS_INDEX]', () => {
  const startMs = new Date('2025-06-10T00:00:00Z').getTime()
  const endMs = new Date('2025-06-15T00:00:00Z').getTime()

  function tagInclude (bookmark, includeTags) {
    if (!includeTags || includeTags.length === 0) return true
    const bTags = (bookmark.tags || []).map(t => String(t).toLowerCase())
    return includeTags.some(t => bTags.includes(t.toLowerCase()))
  }

  function toReadPrivate (bookmark, toReadOnly, privateOnly) {
    if (toReadOnly && bookmark.toread !== 'yes') return false
    if (privateOnly && bookmark.shared !== 'no') return false
    return true
  }

  test('applies stores then time range then exclude tags in order', () => {
    const bookmarks = [
      { url: 'u1', storage: 'local', tags: ['work'], toread: 'yes', shared: 'no', time: '2025-06-12T12:00:00.000Z' },
      { url: 'u2', storage: 'file', tags: ['work', 'archive'], toread: 'yes', shared: 'no', time: '2025-06-12T12:00:00.000Z' },
      { url: 'u3', storage: 'local', tags: ['dev'], toread: 'no', shared: 'yes', time: '2025-06-12T12:00:00.000Z' },
      { url: 'u4', storage: 'sync', tags: ['work'], toread: 'yes', shared: 'no', time: '2025-06-08T12:00:00.000Z' },
      { url: 'u5', storage: 'local', tags: ['work'], toread: 'yes', shared: 'no', time: '2025-06-12T12:00:00.000Z' }
    ]
    const allowedStores = new Set(['local', 'sync'])
    let list = bookmarks.filter(b => matchStoresFilter(b, allowedStores))
    expect(list.map(b => b.url)).toEqual(['u1', 'u3', 'u4', 'u5'])
    list = list.filter(b => inTimeRange(b, 'time', startMs, endMs))
    expect(list.map(b => b.url)).toEqual(['u1', 'u3', 'u5'])
    list = list.filter(b => matchExcludeTags(b, 'archive'))
    expect(list.map(b => b.url)).toEqual(['u1', 'u3', 'u5'])
  })

  test('pipeline with tag include and toread/private (inline) then time range then exclude', () => {
    const bookmarks = [
      { url: 'a', storage: 'local', tags: ['work'], toread: 'yes', shared: 'no', time: '2025-06-12T12:00:00.000Z' },
      { url: 'b', storage: 'local', tags: ['dev'], toread: 'yes', shared: 'no', time: '2025-06-12T12:00:00.000Z' },
      { url: 'c', storage: 'local', tags: ['work', 'archive'], toread: 'yes', shared: 'no', time: '2025-06-12T12:00:00.000Z' }
    ]
    const allowedStores = new Set(['local'])
    const includeTags = ['work']
    let list = bookmarks.filter(b => matchStoresFilter(b, allowedStores))
    list = list.filter(b => tagInclude(b, includeTags))
    list = list.filter(b => toReadPrivate(b, true, true))
    list = list.filter(b => inTimeRange(b, 'time', startMs, endMs))
    list = list.filter(b => matchExcludeTags(b, 'archive'))
    expect(list.map(b => b.url)).toEqual(['a'])
  })
})

describe('getShowOnlyDefaultState [REQ-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX]', () => {
  test('returns default values for Show only group', () => {
    const def = getShowOnlyDefaultState()
    expect(def).toEqual({
      tags: '',
      toread: false,
      private: false,
      timeRangeStart: '',
      timeRangeEnd: '',
      timeRangeField: 'updated_at'
    })
  })

  test('returns a fresh object each call', () => {
    const a = getShowOnlyDefaultState()
    const b = getShowOnlyDefaultState()
    expect(a).not.toBe(b)
    expect(a).toEqual(b)
  })
})

describe('Time column formatters integration [REQ-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX]', () => {
  test('formatTimeAbsolute and formatTimeAge produce display strings for bookmark time/updated_at', () => {
    const bookmark = {
      time: '2025-06-10T10:00:00.000Z',
      updated_at: '2025-06-12T14:30:00.000Z'
    }
    const valueCreate = bookmark.time
    const valueUpdated = bookmark.updated_at
    expect(formatTimeAbsolute(valueCreate)).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
    expect(formatTimeAbsolute(valueUpdated)).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
    const now = new Date('2025-06-15T12:00:00.000Z').getTime()
    expect(formatTimeAge(valueCreate, now)).toMatch(/\d+ (day|days|hour|hours|minute|minutes|second|seconds)/)
    expect(formatTimeAge(valueUpdated, now)).toMatch(/\d+ (day|days|hour|hours|minute|minutes|second|seconds)/)
  })
})

/**
 * [REQ-LOCAL_BOOKMARKS_INDEX] Bookmark count at bottom of page: row count must be the last content in the page container.
 * Validates that the index HTML has .footer-info as the last block in .container and contains #row-count.
 */
describe('fixed Local Bookmarks Index controls [REQ-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX]', () => {
  test('index HTML has four head tabs and one visible default head panel', () => {
    const htmlPath = path.join(process.cwd(), 'src/ui/bookmarks-table/bookmarks-table.html')
    const html = fs.readFileSync(htmlPath, 'utf8')
    const head = html.slice(html.indexOf('class="index-head-controls"'), html.indexOf('<div id="empty-state"'))
    expect(head.match(/data-control-tab="head"/g)).toHaveLength(4)
    expect(head).toContain('data-control-group="stores" aria-controls="head-panel-stores" aria-selected="true"')
    expect(head).toContain('data-control-group="show-only"')
    expect(head).toContain('data-control-group="hide"')
    expect(head).toContain('data-control-group="table-display"')
    expect(head.match(/data-control-panel="head"/g)).toHaveLength(4)
    expect(head.match(/data-control-panel="head"[^>]* hidden/g)).toHaveLength(3)
  })

  test('index HTML checks all Stores by default and exposes filtered / total count labels', () => {
    const htmlPath = path.join(process.cwd(), 'src/ui/bookmarks-table/bookmarks-table.html')
    const html = fs.readFileSync(htmlPath, 'utf8')
    for (const store of ['local', 'file', 'sync', 'browser']) {
      expect(html).toMatch(new RegExp(`id="store-${store}"[^>]*checked`))
      expect(html).toContain(`id="store-${store}-count"`)
    }
    expect(html).toContain('filtered / total provider rows')
  })

  test('index HTML has collapsed Actions, Import, and Export footer tabs by default', () => {
    const htmlPath = path.join(process.cwd(), 'src/ui/bookmarks-table/bookmarks-table.html')
    const html = fs.readFileSync(htmlPath, 'utf8')
    const footer = html.slice(html.indexOf('class="index-footer"'), html.indexOf('</section>\n  </div>'))
    expect(footer.match(/data-control-tab="footer"/g)).toHaveLength(3)
    expect(footer).toContain('data-control-group="actions" aria-controls="footer-panel-actions" aria-selected="false"')
    expect(footer).toContain('data-control-group="import"')
    expect(footer).toContain('data-control-group="export"')
    expect(footer).toContain('id="footer-panel-export"')
    expect(footer.match(/data-control-panel="footer"[^>]* hidden/g)).toHaveLength(3)
    expect(footer).toContain('id="footer-tab-actions"')
    expect(footer).toContain('id="footer-tab-actions" class="control-tab" role="tab" data-control-tab="footer" data-control-group="actions" aria-controls="footer-panel-actions" aria-selected="false" tabindex="0"')
    expect(footer).toContain('id="refresh-api-snapshot"')
    expect(footer).toContain('id="import-trigger"')
    expect(footer).toContain('id="export-all"')
  })

  test('index HTML has footer-info with row-count as last content in container', () => {
    const htmlPath = path.join(process.cwd(), 'src/ui/bookmarks-table/bookmarks-table.html')
    const html = fs.readFileSync(htmlPath, 'utf8')
    expect(html).toContain('class="footer-info"')
    expect(html).toContain('id="row-count"')
    const containerStart = html.indexOf('<div class="container">')
    expect(containerStart).toBeGreaterThan(-1)
    const afterContainer = html.slice(containerStart)
    const lastFooterInfo = afterContainer.lastIndexOf('class="footer-info"')
    const lastRowCount = afterContainer.lastIndexOf('id="row-count"')
    expect(lastFooterInfo).toBeGreaterThan(-1)
    expect(lastRowCount).toBeGreaterThan(lastFooterInfo)
    const scriptTag = afterContainer.indexOf('<script')
    expect(scriptTag).toBeGreaterThan(lastRowCount)
  })

  test('index HTML has footer-spacer before footer-info for short-page layout [REQ-LOCAL_BOOKMARKS_INDEX]', () => {
    const htmlPath = path.join(process.cwd(), 'src/ui/bookmarks-table/bookmarks-table.html')
    const html = fs.readFileSync(htmlPath, 'utf8')
    expect(html).toContain('class="footer-spacer"')
    const spacerPos = html.indexOf('footer-spacer')
    const footerInfoPos = html.indexOf('footer-info')
    expect(spacerPos).toBeGreaterThan(-1)
    expect(footerInfoPos).toBeGreaterThan(spacerPos)
  })

  test('index CSS keeps head and footer controls sticky around the bookmark list [REQ-LOCAL_BOOKMARKS_INDEX]', () => {
    const cssPath = path.join(process.cwd(), 'src/ui/bookmarks-table/bookmarks-table.css')
    const css = fs.readFileSync(cssPath, 'utf8')
    expect(css).toContain('.index-head-controls')
    expect(css).toContain('.index-footer')
    expect(css).toContain('top: 0')
    expect(css).toContain('bottom: 0')
    expect(css).toContain('.container.sticky-thead-offset .bookmarks-table th')
    expect(css).toMatch(/\.container\.sticky-thead-offset\s+\.bookmarks-table th\s*\{[\s\S]*?top:\s*var\(--index-head-sticky-height/)
    expect(css).toContain('--index-footer-sticky-height')
    expect(css).toContain('.footer-info')
    expect(css).toMatch(/position:\s*sticky/)
  })
})

describe('Delete selected status UI [REQ-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX]', () => {
  test('index HTML has delete-result after delete-selected-btn with aria-live', () => {
    const htmlPath = path.join(process.cwd(), 'src/ui/bookmarks-table/bookmarks-table.html')
    const html = fs.readFileSync(htmlPath, 'utf8')
    expect(html).toContain('id="delete-selected-btn"')
    expect(html).toContain('id="delete-result"')
    expect(html).toContain('class="delete-result"')
    const btnPos = html.indexOf('id="delete-selected-btn"')
    const resultPos = html.indexOf('id="delete-result"')
    expect(resultPos).toBeGreaterThan(btnPos)
    expect(html).toMatch(/id="delete-result"[^>]*aria-live="polite"/)
  })
})

describe('Import result status UI [REQ-LOCAL_BOOKMARKS_INDEX_IMPORT] [IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT]', () => {
  test('index HTML has import-result after import-trigger with aria-live', () => {
    const htmlPath = path.join(process.cwd(), 'src/ui/bookmarks-table/bookmarks-table.html')
    const html = fs.readFileSync(htmlPath, 'utf8')
    expect(html).toContain('id="import-trigger"')
    expect(html).toContain('id="import-result"')
    expect(html).toContain('class="import-result"')
    const btnPos = html.indexOf('id="import-trigger"')
    const resultPos = html.indexOf('id="import-result"')
    expect(resultPos).toBeGreaterThan(btnPos)
    expect(html).toMatch(/id="import-result"[^>]*aria-live="polite"/)
  })

  test('index HTML exposes the live Browser source workflow', () => {
    const htmlPath = path.join(process.cwd(), 'src/ui/bookmarks-table/bookmarks-table.html')
    const html = fs.readFileSync(htmlPath, 'utf8')
    expect(html).toContain('id="import-source"')
    expect(html).toContain('value="browser"')
    expect(html).toContain('id="browser-import-search"')
    expect(html).toContain('id="browser-import-folder"')
    expect(html).toContain('id="browser-import-table-body"')
    expect(html).toContain('name="browser-import-mode"')
    expect(html).toContain('id="browser-import-use-folder-tags"')
    expect(html).toContain('id="browser-import-extra-tags"')
  })
})

describe('Add tags to selected UI [REQ-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] [IMPL-LOCAL_BOOKMARKS_INDEX_ADD_TAGS]', () => {
  test('index HTML has add-tags row with label, input and Add tags / Delete tags buttons in Actions for selected', () => {
    const htmlPath = path.join(process.cwd(), 'src/ui/bookmarks-table/bookmarks-table.html')
    const html = fs.readFileSync(htmlPath, 'utf8')
    expect(html).toContain('id="add-tags-input"')
    expect(html).toContain('id="add-tags-btn"')
    expect(html).toContain('id="delete-tags-btn"')
    expect(html).toContain('New tag(s):')
    expect(html).toContain('Add tags')
    expect(html).toContain('Delete tags')
  })
})

describe('parseTagsInput [REQ-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] [IMPL-LOCAL_BOOKMARKS_INDEX_ADD_TAGS]', () => {
  test('returns empty array for empty or whitespace-only input', () => {
    expect(parseTagsInput('')).toEqual([])
    expect(parseTagsInput('   ')).toEqual([])
    expect(parseTagsInput('\t')).toEqual([])
    expect(parseTagsInput(null)).toEqual([])
  })

  test('returns single tag trimmed', () => {
    expect(parseTagsInput('foo')).toEqual(['foo'])
    expect(parseTagsInput('  foo  ')).toEqual(['foo'])
  })

  test('returns multiple comma-separated tags trimmed', () => {
    expect(parseTagsInput('a, b, c')).toEqual(['a', 'b', 'c'])
    expect(parseTagsInput('  a , b , c  ')).toEqual(['a', 'b', 'c'])
  })

  test('filters empty segments', () => {
    expect(parseTagsInput('a, , b')).toEqual(['a', 'b'])
    expect(parseTagsInput(', a, , b,')).toEqual(['a', 'b'])
  })

  test('dedupes case-insensitive within input (keeps first)', () => {
    expect(parseTagsInput('a, A')).toEqual(['a'])
    expect(parseTagsInput('Work, work, WORK')).toEqual(['Work'])
  })
})

describe('mergeTags [REQ-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] [IMPL-LOCAL_BOOKMARKS_INDEX_ADD_TAGS]', () => {
  test('returns empty when both empty', () => {
    expect(mergeTags([], [])).toEqual([])
    expect(mergeTags(undefined, [])).toEqual([])
    expect(mergeTags([], undefined)).toEqual([])
  })

  test('returns existing only when new is empty', () => {
    expect(mergeTags(['a', 'b'], [])).toEqual(['a', 'b'])
  })

  test('returns new only when existing is empty', () => {
    expect(mergeTags([], ['x', 'y'])).toEqual(['x', 'y'])
  })

  test('merges with no overlap', () => {
    expect(mergeTags(['a', 'b'], ['x', 'y'])).toEqual(['a', 'b', 'x', 'y'])
  })

  test('merges with overlap case-insensitive (does not duplicate)', () => {
    expect(mergeTags(['a', 'b'], ['b', 'A', 'c'])).toEqual(['a', 'b', 'c'])
  })

  test('preserves existing casing and appends new', () => {
    expect(mergeTags(['Work'], ['Dev'])).toEqual(['Work', 'Dev'])
  })
})

describe('buildDeletePayload [REQ-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX]', () => {
  test('returns null when bookmark is null or missing url', () => {
    expect(buildDeletePayload(null)).toBe(null)
    expect(buildDeletePayload({})).toBe(null)
    expect(buildDeletePayload({ description: 'No URL' })).toBe(null)
  })

  test('returns url and preferredBackend from bookmark.storage', () => {
    const payload = buildDeletePayload({ url: 'https://example.com', storage: 'file', description: 'Ex' })
    expect(payload).toEqual({ url: 'https://example.com', preferredBackend: 'file' })
  })

  test('defaults preferredBackend to local when storage missing', () => {
    const payload = buildDeletePayload({ url: 'https://example.com' })
    expect(payload).toEqual({ url: 'https://example.com', preferredBackend: 'local' })
  })
})

describe('buildAddTagsPayload [REQ-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] [IMPL-LOCAL_BOOKMARKS_INDEX_ADD_TAGS]', () => {
  test('returns null when bookmark is null or missing url', () => {
    expect(buildAddTagsPayload(null, ['x'])).toBe(null)
    expect(buildAddTagsPayload({}, ['x'])).toBe(null)
    expect(buildAddTagsPayload({ description: 'No URL' }, ['x'])).toBe(null)
  })

  test('returns payload with merged tags and preferredBackend from bookmark.storage', () => {
    const bookmark = { url: 'https://example.com', description: 'Ex', tags: ['a'], storage: 'file' }
    const payload = buildAddTagsPayload(bookmark, ['b', 'c'])
    expect(payload).not.toBe(null)
    expect(payload.url).toBe('https://example.com')
    expect(payload.tags).toEqual(['a', 'b', 'c'])
    expect(payload.preferredBackend).toBe('file')
  })

  test('defaults preferredBackend to local when storage missing', () => {
    const bookmark = { url: 'https://example.com', description: 'Ex' }
    const payload = buildAddTagsPayload(bookmark, ['x'])
    expect(payload.preferredBackend).toBe('local')
  })

  test('merges new tags with existing (case-insensitive dedupe)', () => {
    const bookmark = { url: 'https://example.com', tags: ['a', 'b'], storage: 'local' }
    const payload = buildAddTagsPayload(bookmark, ['b', 'A', 'c'])
    expect(payload.tags).toEqual(['a', 'b', 'c'])
  })
})

describe('removeTags [REQ-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] [IMPL-LOCAL_BOOKMARKS_INDEX_ADD_TAGS]', () => {
  test('returns empty when both empty', () => {
    expect(removeTags([], [])).toEqual([])
    expect(removeTags(undefined, [])).toEqual([])
    expect(removeTags([], undefined)).toEqual([])
  })

  test('returns existing only when toRemove is empty', () => {
    expect(removeTags(['a', 'b'], [])).toEqual(['a', 'b'])
  })

  test('returns empty when toRemove only and existing empty', () => {
    expect(removeTags([], ['x', 'y'])).toEqual([])
  })

  test('removes one tag (case-insensitive)', () => {
    expect(removeTags(['a', 'b', 'c'], ['b'])).toEqual(['a', 'c'])
    expect(removeTags(['a', 'b', 'c'], ['B'])).toEqual(['a', 'c'])
  })

  test('removes multiple tags', () => {
    expect(removeTags(['a', 'b', 'c'], ['a', 'c'])).toEqual(['b'])
  })

  test('preserves casing of remaining tags', () => {
    expect(removeTags(['Work', 'Dev'], ['dev'])).toEqual(['Work'])
  })
})

describe('buildRemoveTagsPayload [REQ-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] [IMPL-LOCAL_BOOKMARKS_INDEX_ADD_TAGS]', () => {
  test('returns null when bookmark is null or missing url', () => {
    expect(buildRemoveTagsPayload(null, ['x'])).toBe(null)
    expect(buildRemoveTagsPayload({}, ['x'])).toBe(null)
    expect(buildRemoveTagsPayload({ description: 'No URL' }, ['x'])).toBe(null)
  })

  test('returns payload with reduced tags and preferredBackend from bookmark.storage', () => {
    const bookmark = { url: 'https://example.com', description: 'Ex', tags: ['a', 'b', 'c'], storage: 'file' }
    const payload = buildRemoveTagsPayload(bookmark, ['b'])
    expect(payload).not.toBe(null)
    expect(payload.url).toBe('https://example.com')
    expect(payload.tags).toEqual(['a', 'c'])
    expect(payload.preferredBackend).toBe('file')
  })

  test('defaults preferredBackend to local when storage missing', () => {
    const bookmark = { url: 'https://example.com', tags: ['a'] }
    const payload = buildRemoveTagsPayload(bookmark, [])
    expect(payload.preferredBackend).toBe('local')
  })

  test('removes tags case-insensitive', () => {
    const bookmark = { url: 'https://example.com', tags: ['a', 'b', 'c'], storage: 'local' }
    const payload = buildRemoveTagsPayload(bookmark, ['B', 'A'])
    expect(payload.tags).toEqual(['c'])
  })
})

describe('Regex replace UI [REQ-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE] [IMPL-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE]', () => {
  test('index HTML has regex-replace row with regex input, replacement input, field checkboxes and Replace button in Actions for selected', () => {
    const htmlPath = path.join(process.cwd(), 'src/ui/bookmarks-table/bookmarks-table.html')
    const html = fs.readFileSync(htmlPath, 'utf8')
    expect(html).toContain('id="regex-replace-input"')
    expect(html).toContain('id="regex-replacement-input"')
    expect(html).toContain('id="regex-replace-btn"')
    expect(html).toContain('Regex:')
    expect(html).toContain('Replacement:')
    expect(html).toContain('Replace')
    expect(html).toContain('id="regex-replace-title"')
    expect(html).toContain('id="regex-replace-url"')
    expect(html).toContain('id="regex-replace-tags"')
    expect(html).toContain('id="regex-replace-notes"')
  })
})

describe('applyRegexReplace [REQ-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE] [IMPL-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE]', () => {
  test('returns error when pattern is invalid (throws on RegExp)', () => {
    const bookmark = { url: 'https://example.com', description: 'Foo' }
    const result = applyRegexReplace(bookmark, '[invalid', 'x', { title: true, url: false, tags: false, notes: false })
    expect(result.payload).toBe(null)
    expect(result.error).toBeDefined()
    expect(typeof result.error).toBe('string')
  })

  test('returns error when bookmark is null or missing url', () => {
    expect(applyRegexReplace(null, 'a', 'b', { title: true, url: false, tags: false, notes: false }).payload).toBe(null)
    expect(applyRegexReplace({}, 'a', 'b', { title: true, url: false, tags: false, notes: false }).payload).toBe(null)
    expect(applyRegexReplace({ description: 'No URL' }, 'a', 'b', { title: true, url: false, tags: false, notes: false }).payload).toBe(null)
  })

  test('returns error when pattern is empty or whitespace', () => {
    const bookmark = { url: 'https://example.com', description: 'Foo' }
    expect(applyRegexReplace(bookmark, '', 'x', { title: true, url: false, tags: false, notes: false }).payload).toBe(null)
    expect(applyRegexReplace(bookmark, '   ', 'x', { title: true, url: false, tags: false, notes: false }).payload).toBe(null)
  })

  test('returns error when no fields selected', () => {
    const bookmark = { url: 'https://example.com', description: 'Foo' }
    const result = applyRegexReplace(bookmark, 'foo', 'bar', { title: false, url: false, tags: false, notes: false })
    expect(result.payload).toBe(null)
    expect(result.error).toBeDefined()
  })

  test('simple replace on title: pattern and replacement applied to description', () => {
    const bookmark = { url: 'https://example.com', description: 'hello foo world', storage: 'local' }
    const result = applyRegexReplace(bookmark, 'foo', 'bar', { title: true, url: false, tags: false, notes: false })
    expect(result.error).toBe(null)
    expect(result.payload).not.toBe(null)
    expect(result.payload.description).toBe('hello bar world')
    expect(result.payload.url).toBe('https://example.com')
    expect(result.payload.preferredBackend).toBe('local')
    expect(result.changed).toBe(true)
  })

  test('global replace: all occurrences in field replaced', () => {
    const bookmark = { url: 'https://example.com', description: 'foo foo foo', storage: 'local' }
    const result = applyRegexReplace(bookmark, 'foo', 'x', { title: true, url: false, tags: false, notes: false })
    expect(result.payload.description).toBe('x x x')
  })

  test('named group in replacement: pattern (?<x>\\d+), replacement $<x> items', () => {
    const bookmark = { url: 'https://example.com', description: 'Count 42 here', storage: 'local' }
    const result = applyRegexReplace(bookmark, '(?<x>\\d+)', '$<x> items', { title: true, url: false, tags: false, notes: false })
    expect(result.payload.description).toBe('Count 42 items here')
  })

  test('negative lookahead: pattern matches as per JS semantics', () => {
    // In "foo baz", "foo" is not followed by " bar", so foo(?! bar) matches and is replaced
    const bookmark = { url: 'https://example.com', description: 'foo baz', storage: 'local' }
    const result = applyRegexReplace(bookmark, 'foo(?! bar)', 'X', { title: true, url: false, tags: false, notes: false })
    expect(result.payload.description).toBe('X baz')
  })

  test('backreference in replacement: (\\w+) (\\w+) -> $2 $1', () => {
    const bookmark = { url: 'https://example.com', description: 'first second', storage: 'local' }
    const result = applyRegexReplace(bookmark, '(\\w+) (\\w+)', '$2 $1', { title: true, url: false, tags: false, notes: false })
    expect(result.payload.description).toBe('second first')
  })

  test('no match leaves field unchanged', () => {
    const bookmark = { url: 'https://example.com', description: 'hello', storage: 'local' }
    const result = applyRegexReplace(bookmark, 'xyz', 'bar', { title: true, url: false, tags: false, notes: false })
    expect(result.payload.description).toBe('hello')
    expect(result.changed).toBe(false)
  })

  test('replacement equals original: changed is false', () => {
    const bookmark = { url: 'https://example.com', description: 'foo', storage: 'local' }
    const result = applyRegexReplace(bookmark, 'foo', 'foo', { title: true, url: false, tags: false, notes: false })
    expect(result.payload.description).toBe('foo')
    expect(result.changed).toBe(false)
  })

  test('tags option: replace applied to each tag string', () => {
    const bookmark = { url: 'https://example.com', tags: ['foo-tag', 'bar-tag', 'other'], storage: 'file' }
    const result = applyRegexReplace(bookmark, '-tag', '', { title: false, url: false, tags: true, notes: false })
    expect(result.payload.tags).toEqual(['foo', 'bar', 'other'])
    expect(result.payload.preferredBackend).toBe('file')
  })

  test('url option: replace applied to url field', () => {
    const bookmark = { url: 'https://old.example.com/page', description: 'Title', storage: 'local' }
    const result = applyRegexReplace(bookmark, 'old\\.example', 'new.example', { title: false, url: true, tags: false, notes: false })
    expect(result.payload.url).toBe('https://new.example.com/page')
  })

  test('notes option: replace applied to extended field', () => {
    const bookmark = { url: 'https://example.com', extended: 'Note: foo and foo', storage: 'local' }
    const result = applyRegexReplace(bookmark, 'foo', 'bar', { title: false, url: false, tags: false, notes: true })
    expect(result.payload.extended).toBe('Note: bar and bar')
  })

  test('multiple fields at once: title and notes updated', () => {
    const bookmark = { url: 'https://example.com', description: 'd-foo', extended: 'e-foo', storage: 'local' }
    const result = applyRegexReplace(bookmark, 'foo', 'X', { title: true, url: false, tags: false, notes: true })
    expect(result.payload.description).toBe('d-X')
    expect(result.payload.extended).toBe('e-X')
  })

  test('unchanged fields preserved in payload', () => {
    const bookmark = { url: 'https://example.com', description: 'hello', tags: ['a'], extended: 'notes', time: '2020-01-01', storage: 'local' }
    const result = applyRegexReplace(bookmark, 'hello', 'hi', { title: true, url: false, tags: false, notes: false })
    expect(result.payload.description).toBe('hi')
    expect(result.payload.tags).toEqual(['a'])
    expect(result.payload.extended).toBe('notes')
    expect(result.payload.time).toBe('2020-01-01')
  })
})
