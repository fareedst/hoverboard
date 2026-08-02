/**
 * [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [REQ-LOCAL_BOOKMARKS_INDEX] Load via getAggregatedBookmarksForIndex (Storage column); fallback getLocalBookmarksForIndex.
 * [IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT] [ARCH-LOCAL_BOOKMARKS_INDEX_EXPORT] [REQ-LOCAL_BOOKMARKS_INDEX_EXPORT]
 * [IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT] [ARCH-LOCAL_BOOKMARKS_INDEX_IMPORT] [REQ-LOCAL_BOOKMARKS_INDEX_IMPORT]
 * [IMPL-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] [ARCH-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] [REQ-LOCAL_BOOKMARKS_INDEX_ADD_TAGS]
 * [IMPL-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE] [ARCH-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE] [REQ-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE]
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
 * === IMPL-FULL-BLOCK: IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT ===
 * [IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT] [ARCH-LOCAL_BOOKMARKS_INDEX_EXPORT] [REQ-LOCAL_BOOKMARKS_INDEX_EXPORT] — Export all/displayed/selected to CSV; buildCsv and programmatic download. Contract: scope and bookmark sets; CSV download and column shape.
 *
 * ## EXPORT_BOOKMARKS
 *
 * - [IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT] [ARCH-LOCAL_BOOKMARKS_INDEX_EXPORT] [REQ-LOCAL_BOOKMARKS_INDEX_EXPORT] How: Implements exportBookmarks(scope) behavior for IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT.
 * - Contract:
 *   - INPUT: scope ('all' | 'displayed' | 'selected'), allBookmarks, filteredBookmarks, selectedUrls (set)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: CSV file download (Blob -> object URL -> <a download> click -> revoke)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: CSV header + rows; columns description, url, tags, time, storage, shared, toread, extended
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: EXPORT_BOOKMARKS
 *   - IF scope = 'all': source = allBookmarks
 *   - IF scope = 'displayed': source = filteredBookmarks
 *   - IF scope = 'selected': source = allBookmarks FILTER url IN selectedUrls
 *   - csvString = buildCsv(source)   // header row + one row per bookmark; escape quotes; storage Local|File|Sync|Browser
 *   - filename = "hoverboard-bookmarks-{scope}-{ISO date}.csv"
 *   - blob = new Blob([csvString]); url = createObjectURL(blob)
 *   - trigger <a download=filename href=url> click; revokeObjectURL(url)
 *   - How (sub-block): Disable export buttons when scope has no data.
 *
 * ## UPDATE_EXPORT_BUTTON_STATE
 *
 * - [IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT] [ARCH-LOCAL_BOOKMARKS_INDEX_EXPORT] [REQ-LOCAL_BOOKMARKS_INDEX_EXPORT] How: Implements updateExportButtonState() behavior for IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT.
 * - Contract:
 *   - INPUT: scope ('all' | 'displayed' | 'selected'), allBookmarks, filteredBookmarks, selectedUrls (set)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: CSV file download (Blob -> object URL -> <a download> click -> revoke)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: CSV header + rows; columns description, url, tags, time, storage, shared, toread, extended
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: UPDATE_EXPORT_BUTTON_STATE
 *   - DISABLE "Export selected" when selectedUrls.size === 0
 *   - DISABLE "Export displayed" when filteredBookmarks.length === 0
 *   - DISABLE "Export all" when allBookmarks.length === 0
 *   - (called when selection or filter changes, e.g. from updateMoveControlsState)
 *
 * === END IMPL-FULL-BLOCK: IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT ===
 * [IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT] [ARCH-LOCAL_BOOKMARKS_INDEX_IMPORT] [REQ-LOCAL_BOOKMARKS_INDEX_IMPORT] — Separate Import control group below Actions for selected; CSV/JSON import; Only new or Overwrite; saveBookmark per row; pending then final result in #import-result. Contract: file and mode and backend; counts and refreshed table; Import button is last control before result.
 *
 * ## RUN_IMPORT
 *
 * - [IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT] [ARCH-LOCAL_BOOKMARKS_INDEX_IMPORT] [REQ-LOCAL_BOOKMARKS_INDEX_IMPORT] — group is independent of selection actions. How: Implements runImport(file) behavior for IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT.
 * - Contract:
 *   - INPUT: file (CSV or JSON), mode (Only new | Overwrite), preferredBackend (Local | File | Sync | Browser), allBookmarks (existing set for "Only new")
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: imported count, skipped count, failed count; refreshed table; #import-result pending then final | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: rows = array of { url, description, tags, time, updated_at, shared, toread, extended }; existingByUrl = set of url from allBookmarks
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: RUN_IMPORT
 *   - text = read file as text
 *   - rows = parseImportFile(text, filename)   // CSV -> parseCsv; JSON -> normalize array; skip empty url
 *   - IF rows empty: SHOW error in #import-result (not pending/final success); RETURN
 *   - IF mode = "Only new": rows = rows FILTER url NOT IN existingByUrl
 *   - SHOW "Importing…" in #import-result WITH class is-pending   // accepted; warning color
 *   - imported = 0; skipped = 0; failed = 0
 *   - FOR each row IN rows:
 *   - payload = { ...row, preferredBackend }   // includes time, updated_at from file when present
 *   - response = SEND saveBookmark(payload)
 *   - IF response.success: imported++
 *   - ELSE: failed++
 *   - loadBookmarks()   // refresh table
 *   - SHOW "Imported N, skipped M, K failed" in #import-result WITH class is-final   // success color; clear is-pending
 *
 * === END IMPL-FULL-BLOCK: IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT ===
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
 * === IMPL-FULL-BLOCK: IMPL-ARCHIVED_CONTENT_SEARCH ===
 * Search extracted text from Local/File archives without changing metadata search.
 *
 * ## REPLACE_ARCHIVED_CONTENT
 * - [IMPL-ARCHIVED_CONTENT_SEARCH] [ARCH-ARCHIVED_CONTENT_SEARCH] [REQ-ARCHIVED_CONTENT_SEARCH] How: synchronize one backend-scoped extracted-text entry with successful archive capture and remove it when text is empty.
 * - Contract:
 *   - INPUT: url, backend, archive entry
 *   - PRE: url is normalizable; entry may be absent or have empty text
 *   - OUTPUT: none
 *   - POST:
 *     - non-empty entry => backend plus normalized URL maps to one normalized search entry
 *     - missing/empty entry => the selected backend plus normalized URL is absent from the index
 *   - DATA: ArchiveTextIndex keyed by backend plus normalized URL
 *   - DATA_TRANSITION: replace updates one backend-scoped entry; empty input removes one backend-scoped entry
 *   - EFFECTS: State
 *   - TERMINATION: total
 * - PROCEDURE: REPLACE_ARCHIVED_CONTENT
 *   - storage = normalizeStorage(backend OR entry.storage OR local)
 *   - key = ARCHIVE_ENTRY_KEY(normalize(url), storage)
 *   - IF entry is missing or text is empty: REMOVE_ARCHIVED_CONTENT(url, storage); RETURN
 *   - index[key] = normalizeEntry(entry with storage and archiveId)
 *
 * ## ARCHIVE_ENTRY_KEY
 * - [IMPL-ARCHIVED_CONTENT_SEARCH] [ARCH-ARCHIVED_CONTENT_SEARCH] [REQ-ARCHIVED_CONTENT_SEARCH] How: keep Local and File archive records distinct when they share a normalized URL.
 * - Contract:
 *   - INPUT: normalized URL, backend
 *   - PRE: URL is normalized; backend is local or file or defaults to local for legacy entries
 *   - OUTPUT: stable search key
 *   - POST: distinct backend/URL pairs produce distinct keys
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: ARCHIVE_ENTRY_KEY
 *   - storage = normalizeStorage(backend)
 *   - RETURN `${storage}:${normalized URL}`
 *
 * ## REMOVE_ARCHIVED_CONTENT
 * - [IMPL-ARCHIVED_CONTENT_SEARCH] [ARCH-ARCHIVED_CONTENT_SEARCH] [REQ-ARCHIVED_CONTENT_SEARCH] How: remove selected-backend derived search state when an archive is deleted or compensation removes the current archive.
 * - Contract:
 *   - INPUT: url, optional backend
 *   - PRE: url is normalizable
 *   - OUTPUT: none
 *   - POST: selected backend entry is absent, or all backend entries for the URL are absent when backend is omitted
 *   - DATA: ArchiveTextIndex keyed by backend plus normalized URL
 *   - DATA_TRANSITION: one or more backend-scoped entries are deleted
 *   - EFFECTS: State
 *   - TERMINATION: total
 * - PROCEDURE: REMOVE_ARCHIVED_CONTENT
 *   - IF backend is supplied: DELETE index[ARCHIVE_ENTRY_KEY(normalize(url), backend)]
 *   - ELSE: DELETE every index entry whose URL is normalize(url)
 *
 * ## QUERY_ARCHIVED_CONTENT
 * - [IMPL-ARCHIVED_CONTENT_SEARCH] [ARCH-ARCHIVED_CONTENT_SEARCH] [REQ-ARCHIVED_CONTENT_SEARCH] How: return bounded deterministic snippets for explicit non-empty archive-content queries without mutating metadata or the index.
 * - Contract:
 *   - INPUT: query (string), ArchiveTextIndex
 *   - PRE: index entries came from successful archive captures
 *   - OUTPUT: list of { url, title, snippet, archiveStatus, storage, archiveId, readerTarget }
 *   - POST:
 *     - success => each result has a bounded snippet and deterministic order
 *     - empty query => empty list; index remains unchanged
 *   - DATA: ArchiveTextIndex
 *   - DATA_TRANSITION: query is read-only
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: QUERY_ARCHIVED_CONTENT
 *   - needle = normalizeQuery(query)
 *   - IF needle is empty: RETURN []
 *   - results = []
 *   - FOR each entry IN index:
 *     - position = findCaseInsensitive(entry.text, needle)
 *     - IF position >= 0: append result with bounded snippet and Reader target
 *   - SORT results BY position ASCENDING, capturedAt DESCENDING, storage ASCENDING, url ASCENDING
 *   - RETURN results
 *
 * ## APPLY_ARCHIVE_CONTENT_SCOPE
 * - [IMPL-ARCHIVED_CONTENT_SEARCH] [ARCH-ARCHIVED_CONTENT_SEARCH] [REQ-ARCHIVED_CONTENT_SEARCH] How: keep archive browse/search independent from metadata filtering and rebuild derived entries from persisted artifacts before reading.
 * - Contract:
 *   - INPUT: scope ('metadata' | 'archive'), query, archiveStore, archiveSearch
 *   - PRE: scope is explicit; archiveStore and archiveSearch are available
 *   - OUTPUT: metadata filter result | archive result list
 *   - POST:
 *     - metadata scope => archive text is not queried
 *     - archive scope => metadata rows and metadata actions are not mutated
 *     - empty archive query => deterministic browse rows
 *   - FAILURE_MODES: StorageFailed, SearchFailed
 *   - DATA: persisted archives, ArchiveTextIndex, metadata rows
 *   - DATA_TRANSITION: archive scope rebuilds derived entries; metadata state remains unchanged
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: APPLY_ARCHIVE_CONTENT_SCOPE
 *   - IF scope is not archive: RETURN APPLY_METADATA_SEARCH(query)
 *   - archives = AWAIT archiveStore.listArchives()
 *   - AWAIT archiveSearch.seed(archives)
 *   - IF normalizeQuery(query) is empty: RETURN BROWSE_ARCHIVED_CONTENT(archives, archiveSearch)
 *   - RETURN QUERY_ARCHIVED_CONTENT(query)
 *
 * ## BROWSE_ARCHIVED_CONTENT
 * - [IMPL-ARCHIVED_CONTENT_SEARCH] [ARCH-ARCHIVED_CONTENT_SEARCH] [REQ-ARCHIVED_CONTENT_SEARCH] How: map persisted archives to deterministic browse rows with bounded snippets and extension-resolvable Reader targets.
 * - Contract:
 *   - INPUT: persisted archive list, archiveSearch
 *   - PRE: archiveSearch is available; each archive has a URL or is discarded
 *   - OUTPUT: deterministic rows with title, snippet, status, storage, archiveId, capturedAt, readerTarget
 *   - POST: each readerTarget resolves to the selected backend archive in the extension Reader page
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: BROWSE_ARCHIVED_CONTENT
 *   - rows = archiveSearch.browseArchivedContent(archives)
 *   - FOR each row IN rows:
 *     - row.readerTarget = extensionRuntimeUrl('src/ui/reader/reader.html', { url: row.url, backend: row.storage, archiveId: row.archiveId })
 *   - RETURN rows
 *
 * ## OPEN_READER_FROM_ARCHIVE_RESULT
 * - [IMPL-ARCHIVED_CONTENT_SEARCH] [ARCH-ARCHIVED_CONTENT_SEARCH] [REQ-ARCHIVED_CONTENT_SEARCH] [IMPL-OFFLINE_READER_MODE] [ARCH-OFFLINE_READER_MODE] [REQ-OFFLINE_READER_MODE] How: open a stored archive result in Offline Reader rather than the live page.
 * - Contract:
 *   - INPUT: archive search result with readerTarget
 *   - PRE: readerTarget is non-empty and generated by BROWSE_ARCHIVED_CONTENT or QUERY_ARCHIVED_CONTENT
 *   - OUTPUT: extension navigation target
 *   - POST: target opens Reader with URL/archiveId query and performs no live-page fetch
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: OPEN_READER_FROM_ARCHIVE_RESULT
 *   - RETURN result.readerTarget
 *
 * === END IMPL-FULL-BLOCK: IMPL-ARCHIVED_CONTENT_SEARCH ===
 */
import { initToolPageVersion } from '../styles/tool-page-version.js'
import { matchStoresFilter, parseTimeRangeValue, inTimeRange, matchExcludeTags as matchExcludeTagsFilter, getShowOnlyDefaultState, parseTagsInput, buildAddTagsPayload, buildRemoveTagsPayload, buildAddTagsConfirmMessage, buildRemoveTagsConfirmMessage, selectionStillVisible, applyRegexReplace, mergeUsageIntoBookmarks } from './bookmarks-table-filter.js'
import { buildCsv, parseCsv } from './bookmarks-table-csv.js'
import { formatTimeAbsolute, formatTimeAge } from './bookmarks-table-time.js'
import { setImportResultPending, setImportResultFinal, setImportResultError, formatImportResultMessage } from './bookmarks-table-import-status.js'
import { runBulkDelete } from './bookmarks-table-bulk-delete.js'
import { prefillSearchFromQuery } from './bookmarks-table-library-search.js'
import { runCheckLinkHealth, formatHealthCellLabel } from './bookmarks-table-link-health.js'
import { runRefreshApiSnapshot } from './bookmarks-table-api-snapshot.js'
import { buildArchiveSearchMessage, mapArchiveSearchResults } from './bookmarks-table-archive-search.js'
import { isArchiveScopeValue } from './bookmarks-table-archive-scope.js'
import { createControlTabState, selectControlGroup } from './bookmarks-table-controls.js'
import { filterBookmarksByHealth, isLinkHealthChecksEnabled, applyLinkHealthControlsGate } from '../../shared/link-health.js'
import {
  isAggregatedIndexLoadFailure,
  extractBookmarksList,
  onStoreFilterChange
} from './bookmarks-table-load.js'

const MESSAGE_TYPE_AGGREGATED = 'getAggregatedBookmarksForIndex'
const MESSAGE_TYPE_LOCAL = 'getLocalBookmarksForIndex'
const MESSAGE_TYPE_MOVE = 'moveBookmarkToStorage'
const MESSAGE_TYPE_SAVE = 'saveBookmark'
/** [REQ-BOOKMARK_USAGE_TRACKING] [ARCH-BOOKMARK_USAGE_TRACKING_UI] [IMPL-BOOKMARK_USAGE_TRACKING_UI] */
const MESSAGE_TYPE_USAGE = 'getBookmarkUsage'

let allBookmarks = []
let filteredBookmarks = []
let sortKey = 'time'
let sortAsc = false
/** [REQ-LOCAL_BOOKMARKS_INDEX] [REQ-BOOKMARK_CREATE_UPDATE_TIMES] Time column: which value to show (time = create, updated_at = last updated). Default: last updated. */
let timeColumnSource = 'updated_at'
/** [REQ-LOCAL_BOOKMARKS_INDEX] Time column display: 'absolute' (YYYY-MM-DD HH:mm:ss) or 'age' (e.g. N days O hours). Default: age at page load. */
let timeDisplayMode = 'age'
/** [REQ-ARCHIVED_CONTENT_SEARCH] Explicit search scope; metadata remains the default. */
let archiveSearchRequestId = 0
/** [REQ-LOCAL_BOOKMARKS_INDEX] Selected bookmark URLs for bulk operations (e.g. move to storage). */
const selectedUrls = new Set()
/** [REQ-LINK_HEALTH] [IMPL-LINK_HEALTH] url -> health record */
let linkHealthMap = {}
/** [REQ-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX] Independent active head/footer control groups. */
let controlTabState = createControlTabState()

function isArchiveScope () {
  return isArchiveScopeValue(elements.searchScope?.value)
}

const elements = {
  searchInput: document.getElementById('search-input'),
  searchScope: document.getElementById('search-scope'),
  searchClear: document.getElementById('search-clear'),
  storeLocal: document.getElementById('store-local'),
  storeFile: document.getElementById('store-file'),
  storeSync: document.getElementById('store-sync'),
  storeBrowser: document.getElementById('store-browser'),
  filterTags: document.getElementById('filter-tags'),
  filterToread: document.getElementById('filter-toread'),
  filterPrivate: document.getElementById('filter-private'),
  filterTimeRangeStart: document.getElementById('filter-time-range-start'),
  filterTimeRangeEnd: document.getElementById('filter-time-range-end'),
  filterTimeRangeField: document.getElementById('filter-time-range-field'),
  filterTagsExclude: document.getElementById('filter-tags-exclude'),
  showOnlyClear: document.getElementById('show-only-clear'),
  timeColumnSource: document.getElementById('time-column-source'),
  timeDisplayMode: document.getElementById('time-display-mode'),
  exportAll: document.getElementById('export-all'),
  exportDisplayed: document.getElementById('export-displayed'),
  exportSelected: document.getElementById('export-selected'),
  refreshApiSnapshot: document.getElementById('refresh-api-snapshot'),
  apiSnapshotResult: document.getElementById('api-snapshot-result'),
  checkLinkHealth: document.getElementById('check-link-health'),
  filterHealth: document.getElementById('filter-health'),
  linkHealthResult: document.getElementById('link-health-result'),
  emptyState: document.getElementById('empty-state'),
  emptyStateMessage: document.getElementById('empty-state-message'),
  tableWrapper: document.getElementById('table-wrapper'),
  tableBody: document.getElementById('table-body'),
  rowCount: document.getElementById('row-count'),
  table: document.getElementById('bookmarks-table'),
  selectAll: document.getElementById('select-all'),
  moveTargetSelect: document.getElementById('move-target'),
  moveButton: document.getElementById('move-selected-btn'),
  deleteSelectedBtn: document.getElementById('delete-selected-btn'),
  deleteResult: document.getElementById('delete-result'),
  addTagsInput: document.getElementById('add-tags-input'),
  addTagsBtn: document.getElementById('add-tags-btn'),
  deleteTagsBtn: document.getElementById('delete-tags-btn'),
  regexReplaceInput: document.getElementById('regex-replace-input'),
  regexReplacementInput: document.getElementById('regex-replacement-input'),
  regexReplaceTitle: document.getElementById('regex-replace-title'),
  regexReplaceUrl: document.getElementById('regex-replace-url'),
  regexReplaceTags: document.getElementById('regex-replace-tags'),
  regexReplaceNotes: document.getElementById('regex-replace-notes'),
  regexReplaceBtn: document.getElementById('regex-replace-btn'),
  regexReplaceError: document.getElementById('regex-replace-error'),
  importFile: document.getElementById('import-file'),
  importTrigger: document.getElementById('import-trigger'),
  importTarget: document.getElementById('import-target'),
  importResult: document.getElementById('import-result')
}

function escapeHtml (str) {
  if (str == null) return ''
  const s = String(str)
  const div = document.createElement('div')
  div.textContent = s
  return div.innerHTML
}

/**
 * [REQ-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX]
 * Reset Show only group to defaults and re-apply filter. Used by Clear button.
 */
function applyShowOnlyDefaults () {
  const def = getShowOnlyDefaultState()
  if (elements.filterTags) elements.filterTags.value = def.tags
  if (elements.filterToread) elements.filterToread.checked = def.toread
  if (elements.filterPrivate) elements.filterPrivate.checked = def.private
  if (elements.filterTimeRangeStart) elements.filterTimeRangeStart.value = def.timeRangeStart
  if (elements.filterTimeRangeEnd) elements.filterTimeRangeEnd.value = def.timeRangeEnd
  if (elements.filterTimeRangeField) elements.filterTimeRangeField.value = def.timeRangeField
  applySearchAndFilter()
}

/** [REQ-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX] Set of storage backends to include from store checkboxes; empty when none checked. */
function getAllowedStores () {
  const set = new Set()
  if (elements.storeLocal && elements.storeLocal.checked) set.add('local')
  if (elements.storeFile && elements.storeFile.checked) set.add('file')
  if (elements.storeSync && elements.storeSync.checked) set.add('sync')
  if (elements.storeBrowser && elements.storeBrowser.checked) set.add('browser')
  return set
}

function matchSearch (bookmark, q) {
  if (!q || !q.trim()) return true
  const lower = q.trim().toLowerCase()
  const title = (bookmark.description || '').toLowerCase()
  const url = (bookmark.url || '').toLowerCase()
  const tags = (Array.isArray(bookmark.tags) ? bookmark.tags.join(' ') : String(bookmark.tags || '')).toLowerCase()
  const extended = (bookmark.extended || '').toLowerCase()
  return title.includes(lower) || url.includes(lower) || tags.includes(lower) || extended.includes(lower)
}

function matchFilters (bookmark) {
  const tagFilter = ((elements.filterTags && elements.filterTags.value) || '').trim()
  if (tagFilter) {
    const includeTags = tagFilter.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
    if (includeTags.length) {
      const bTags = (bookmark.tags || []).map(t => String(t).toLowerCase())
      if (!includeTags.some(t => bTags.includes(t))) return false
    }
  }
  if (elements.filterToread && elements.filterToread.checked && bookmark.toread !== 'yes') return false
  if (elements.filterPrivate && elements.filterPrivate.checked && bookmark.shared !== 'no') return false
  const timeField = (elements.filterTimeRangeField && elements.filterTimeRangeField.value) || 'updated_at'
  const startMs = elements.filterTimeRangeStart ? parseTimeRangeValue(elements.filterTimeRangeStart.value) : null
  const endMs = elements.filterTimeRangeEnd ? parseTimeRangeValue(elements.filterTimeRangeEnd.value) : null
  if (startMs != null || endMs != null) {
    if (!inTimeRange(bookmark, timeField, startMs, endMs)) return false
  }
  return true
}

function matchExcludeTags (bookmark) {
  const excludeStr = (elements.filterTagsExclude && elements.filterTagsExclude.value) || ''
  return matchExcludeTagsFilter(bookmark, excludeStr)
}

function applySearchAndFilter () {
  // [IMPL-ARCHIVED_CONTENT_SEARCH] [ARCH-ARCHIVED_CONTENT_SEARCH] [REQ-ARCHIVED_CONTENT_SEARCH] APPLY_ARCHIVE_CONTENT_SCOPE keeps archive browse/search independent from metadata filtering.
  if (isArchiveScope()) {
    loadArchiveSearchResults(elements.searchInput?.value || '')
    return
  }
  const allowedStores = getAllowedStores()
  let list = allBookmarks.filter(b => matchStoresFilter(b, allowedStores))
  const q = elements.searchInput.value.trim()
  list = list.filter(b => matchSearch(b, q) && matchFilters(b))
  list = list.filter(matchExcludeTags)
  // [REQ-LINK_HEALTH] [IMPL-LINK_HEALTH]
  list = filterBookmarksByHealth(list, linkHealthMap, elements.filterHealth?.value || '')
  filteredBookmarks = list
  sortTable()
  renderTableBody()
  updateRowCount()
  toggleEmptyState()
  updateExportButtonState()
}

/**
 * [REQ-ARCHIVED_CONTENT_SEARCH] [ARCH-ARCHIVED_CONTENT_SEARCH] [IMPL-ARCHIVED_CONTENT_SEARCH]
 * APPLY_ARCHIVE_CONTENT_SCOPE: query only extracted archive text and map bounded results into the existing table renderer.
 */
async function loadArchiveSearchResults (query) {
  const requestId = ++archiveSearchRequestId
  try {
    const response = await chrome.runtime.sendMessage(buildArchiveSearchMessage(query))
    if (requestId !== archiveSearchRequestId) return
    const results = Array.isArray(response?.results)
      ? response.results
      : (Array.isArray(response?.data?.results) ? response.data.results : [])
    filteredBookmarks = mapArchiveSearchResults(results)
    renderTableBody()
    updateRowCount()
    toggleEmptyState()
    updateMoveControlsState()
  } catch (error) {
    console.warn('[IMPL-ARCHIVED_CONTENT_SEARCH] archive query failed:', error)
    filteredBookmarks = []
    renderTableBody()
    updateRowCount()
    toggleEmptyState()
    updateMoveControlsState()
  }
}

function compare (a, b) {
  /** [REQ-LOCAL_BOOKMARKS_INDEX] [REQ-BOOKMARK_CREATE_UPDATE_TIMES] When sorting by Time column, use timeColumnSource so order matches displayed value. */
  const effectiveKey = sortKey === 'time' ? timeColumnSource : sortKey
  const va = a[effectiveKey]
  const vb = b[effectiveKey]
  if (sortKey === 'time') {
    const cmp = (vb || '').localeCompare(va || '')
    return sortAsc ? -cmp : cmp
  }
  /** [REQ-BOOKMARK_USAGE_TRACKING] [IMPL-BOOKMARK_USAGE_TRACKING_UI] Sort by visits (numeric). */
  if (sortKey === 'visits') {
    const na = Number(va) || 0
    const nb = Number(vb) || 0
    const cmp = na - nb
    return sortAsc ? cmp : -cmp
  }
  /** [REQ-BOOKMARK_USAGE_TRACKING] [IMPL-BOOKMARK_USAGE_TRACKING_UI] Sort by lastVisited (string/date compare). */
  if (sortKey === 'lastVisited') {
    const cmp = (vb || '').localeCompare(va || '')
    return sortAsc ? -cmp : cmp
  }
  if (sortKey === 'tags') {
    const sa = Array.isArray(va) ? va.join(' ') : String(va || '')
    const sb = Array.isArray(vb) ? vb.join(' ') : String(vb || '')
    const cmp = sa.localeCompare(sb)
    return sortAsc ? cmp : -cmp
  }
  if (sortKey === 'storage') {
    const cmp = String(va || '').localeCompare(String(vb || ''))
    return sortAsc ? cmp : -cmp
  }
  const sa = String(va ?? '').toLowerCase()
  const sb = String(vb ?? '').toLowerCase()
  const cmp = sa.localeCompare(sb)
  return sortAsc ? cmp : -cmp
}

function sortTable () {
  filteredBookmarks.sort(compare)
}

function renderTableBody () {
  elements.tableBody.innerHTML = ''
  const archiveScope = isArchiveScope()
  for (const b of filteredBookmarks) {
    const tr = document.createElement('tr')
    const url = b.url || ''
    const checked = !archiveScope && selectedUrls.has(url) ? ' checked' : ''
    const title = escapeHtml(b.description || '(no title)')
    const archiveTitle = b.readerTarget
      ? `<a href="${escapeHtml(b.readerTarget)}" class="archive-reader-link" title="Open stored archive">${title}</a>`
      : title
    const archiveSnippet = b.archiveSnippet
      ? `<div class="archive-snippet">${escapeHtml(b.archiveSnippet)}</div>`
      : ''
    const urlEsc = escapeHtml(url)
    const tagsStr = Array.isArray(b.tags) ? b.tags.join(', ') : String(b.tags || '')
    const tagsEsc = escapeHtml(tagsStr)
    const timeValue = b[timeColumnSource] ?? b.time
    const time = escapeHtml(
      timeDisplayMode === 'absolute'
        ? formatTimeAbsolute(timeValue)
        : formatTimeAge(timeValue)
    )
    const visits = b.visits ?? 0
    const lastVisitedValue = b.lastVisited || ''
    const lastVisited = escapeHtml(
      timeDisplayMode === 'absolute'
        ? formatTimeAbsolute(lastVisitedValue)
        : (lastVisitedValue ? formatTimeAge(lastVisitedValue) : '')
    )
    const shared = b.shared === 'no' ? 'Private' : 'Public'
    const toread = b.toread === 'yes' ? 'Yes' : 'No'
    const storageLabel = b.storage === 'browser' ? 'Browser' : (b.storage === 'sync' ? 'Sync' : (b.storage === 'file' ? 'File' : 'Local'))
    const storage = escapeHtml(storageLabel)
    // [REQ-LINK_HEALTH] [IMPL-LINK_HEALTH]
    const healthRec = linkHealthMap[url]
    const healthLabel = escapeHtml(formatHealthCellLabel(healthRec))
    const urlLink = b.url
      ? `<a href="${escapeHtml(b.url)}" target="_blank" rel="noopener" class="url-link" title="Opens in new tab">${urlEsc}<span class="url-external-icon" aria-hidden="true">↗</span></a>`
      : urlEsc
    tr.innerHTML = `
      <td class="col-select">${archiveScope ? '' : `<label><input type="checkbox" class="row-select" data-url="${escapeHtml(url)}" aria-label="Select bookmark"${checked}></label>`}</td>
      <td class="col-title">${archiveTitle}${archiveSnippet}</td>
      <td class="col-url">${urlLink}</td>
      <td class="col-tags">${tagsEsc}</td>
      <td class="col-time">${time}</td>
      <td class="col-visits">${visits}</td>
      <td class="col-last-visited">${lastVisited}</td>
      <td class="col-storage">${storage}</td>
      <td class="col-health" title="${escapeHtml(healthRec?.checkedAt || '')}">${healthLabel}</td>
      <td class="col-shared">${shared}</td>
      <td class="col-toread">${toread}</td>
    `
    elements.tableBody.appendChild(tr)
  }
  updateSelectAllState()
}

/** [REQ-LOCAL_BOOKMARKS_INDEX] Toggle selection for one row; call after checkbox change. */
function onRowSelectChange (url, checked) {
  if (isArchiveScope()) return
  if (checked) selectedUrls.add(url)
  else selectedUrls.delete(url)
  updateMoveControlsState()
}

/** [REQ-LOCAL_BOOKMARKS_INDEX] Update header "select all" checkbox to reflect current visible selection. */
function updateSelectAllState () {
  if (!elements.selectAll) return
  if (isArchiveScope()) {
    elements.selectAll.checked = false
    elements.selectAll.indeterminate = false
    elements.selectAll.disabled = true
    return
  }
  const visible = filteredBookmarks.map(b => b.url).filter(Boolean)
  const none = visible.length === 0
  const allSelected = !none && visible.every(u => selectedUrls.has(u))
  const someSelected = visible.some(u => selectedUrls.has(u))
  elements.selectAll.checked = allSelected
  elements.selectAll.indeterminate = someSelected && !allSelected
  elements.selectAll.disabled = none
}

/** [REQ-LOCAL_BOOKMARKS_INDEX] [REQ-MOVE_BOOKMARK_STORAGE_UI] Enable/disable move, delete, add-tags, and regex-replace controls based on selection. [REQ-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] [REQ-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE] */
function updateMoveControlsState () {
  const hasSelection = !isArchiveScope() && selectedUrls.size > 0
  if (elements.moveTargetSelect) elements.moveTargetSelect.disabled = !hasSelection
  if (elements.moveButton) elements.moveButton.disabled = !hasSelection
  if (elements.deleteSelectedBtn) elements.deleteSelectedBtn.disabled = !hasSelection
  if (elements.addTagsBtn) elements.addTagsBtn.disabled = !hasSelection
  if (elements.deleteTagsBtn) elements.deleteTagsBtn.disabled = !hasSelection
  const hasPattern = elements.regexReplaceInput && (elements.regexReplaceInput.value || '').trim().length > 0
  if (elements.regexReplaceBtn) elements.regexReplaceBtn.disabled = !hasSelection || !hasPattern
  updateExportButtonState()
  updateSelectAllState()
}

/**
 * [REQ-LOCAL_BOOKMARKS_INDEX] [REQ-MOVE_BOOKMARK_STORAGE_UI] Move all selected bookmarks to the chosen storage backend.
 * Uses existing moveBookmarkToStorage message per URL; then refreshes table and clears selection.
 */
async function moveSelectedToStorage () {
  if (isArchiveScope()) return
  const target = elements.moveTargetSelect && elements.moveTargetSelect.value
  if (!target || selectedUrls.size === 0) return
  const urls = Array.from(selectedUrls)
  if (elements.moveButton) elements.moveButton.disabled = true
  let ok = 0
  let fail = 0
  for (const url of urls) {
    try {
      const res = await chrome.runtime.sendMessage({ type: MESSAGE_TYPE_MOVE, data: { url, targetBackend: target } })
      if (res && res.success) ok++
      else fail++
    } catch (e) {
      console.warn('[IMPL-LOCAL_BOOKMARKS_INDEX] moveBookmarkToStorage failed for', url, e)
      fail++
    }
  }
  selectedUrls.clear()
  await loadBookmarks()
  updateMoveControlsState()
  if (fail > 0) console.warn('[IMPL-LOCAL_BOOKMARKS_INDEX] Move completed:', ok, 'moved,', fail, 'failed')
}

/**
 * [REQ-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX] [IMPL-BOOKMARK_ROUTER]
 * Delete selected bookmarks; confirmation includes count and names if ≤8.
 * Sends preferredBackend from row Storage column so File/Sync imports delete from the correct provider.
 */
async function deleteSelectedBookmarks () {
  if (isArchiveScope()) return
  if (selectedUrls.size === 0) return
  const urls = Array.from(selectedUrls)
  const byUrl = new Map(filteredBookmarks.filter(b => b.url).map(b => [b.url, b]))
  if (elements.deleteSelectedBtn) elements.deleteSelectedBtn.disabled = true
  await runBulkDelete({
    urls,
    bookmarksByUrl: byUrl,
    sendMessage: (msg) => chrome.runtime.sendMessage(msg),
    confirmFn: (message) => confirm(message),
    deleteResultEl: elements.deleteResult,
    onAfterDelete: async () => {
      selectedUrls.clear()
      await loadBookmarks()
      updateMoveControlsState()
    }
  })
}

/**
 * [IMPL-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] [ARCH-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] [REQ-LOCAL_BOOKMARKS_INDEX_ADD_TAGS]
 * Add parsed tags from input to all selected bookmarks; merge with existing (case-insensitive dedupe); save via saveBookmark with preferredBackend; refresh; retain selection for still-visible rows.
 */
async function addTagsToSelected () {
  if (isArchiveScope()) return
  const newTags = parseTagsInput(elements.addTagsInput && elements.addTagsInput.value)
  if (newTags.length === 0) return
  if (selectedUrls.size === 0) return
  const message = buildAddTagsConfirmMessage(newTags, selectedUrls.size)
  if (!confirm(message)) return
  const urls = Array.from(selectedUrls)
  const byUrl = new Map(allBookmarks.filter(b => b && b.url).map(b => [b.url, b]))
  if (elements.addTagsBtn) elements.addTagsBtn.disabled = true
  let ok = 0
  let fail = 0
  for (const url of urls) {
    const bookmark = byUrl.get(url)
    if (!bookmark) continue
    const payload = buildAddTagsPayload(bookmark, newTags)
    if (!payload) continue
    try {
      const res = await chrome.runtime.sendMessage({ type: MESSAGE_TYPE_SAVE, data: payload })
      if (res && res.success) ok++
      else fail++
    } catch (e) {
      console.warn('[IMPL-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] saveBookmark failed for', url, e)
      fail++
    }
  }
  const urlsToRestore = new Set(selectedUrls)
  selectedUrls.clear()
  await loadBookmarks()
  for (const url of selectionStillVisible(urlsToRestore, filteredBookmarks)) selectedUrls.add(url)
  renderTableBody()
  if (elements.addTagsInput) elements.addTagsInput.value = ''
  updateMoveControlsState()
  if (fail > 0) console.warn('[IMPL-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] Add tags completed:', ok, 'updated,', fail, 'failed')
}

/**
 * [IMPL-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] [ARCH-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] [REQ-LOCAL_BOOKMARKS_INDEX_ADD_TAGS]
 * Remove parsed tags from input from all selected bookmarks; save via saveBookmark with reduced tags and preferredBackend; refresh; retain selection for still-visible rows.
 */
async function deleteTagsFromSelected () {
  if (isArchiveScope()) return
  const tagsToRemove = parseTagsInput(elements.addTagsInput && elements.addTagsInput.value)
  if (tagsToRemove.length === 0) return
  if (selectedUrls.size === 0) return
  const message = buildRemoveTagsConfirmMessage(tagsToRemove, selectedUrls.size)
  if (!confirm(message)) return
  const urls = Array.from(selectedUrls)
  const byUrl = new Map(allBookmarks.filter(b => b && b.url).map(b => [b.url, b]))
  if (elements.deleteTagsBtn) elements.deleteTagsBtn.disabled = true
  let ok = 0
  let fail = 0
  for (const url of urls) {
    const bookmark = byUrl.get(url)
    if (!bookmark) continue
    const payload = buildRemoveTagsPayload(bookmark, tagsToRemove)
    if (!payload) continue
    try {
      const res = await chrome.runtime.sendMessage({ type: MESSAGE_TYPE_SAVE, data: payload })
      if (res && res.success) ok++
      else fail++
    } catch (e) {
      console.warn('[IMPL-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] saveBookmark failed for', url, e)
      fail++
    }
  }
  const urlsToRestore = new Set(selectedUrls)
  selectedUrls.clear()
  await loadBookmarks()
  for (const url of selectionStillVisible(urlsToRestore, filteredBookmarks)) selectedUrls.add(url)
  renderTableBody()
  if (elements.addTagsInput) elements.addTagsInput.value = ''
  updateMoveControlsState()
  if (fail > 0) console.warn('[IMPL-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] Delete tags completed:', ok, 'updated,', fail, 'failed')
}

/**
 * [IMPL-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE] [ARCH-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE] [REQ-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE]
 * Run regex find-and-replace on selected bookmarks for checked fields (Title, URL, Tags, Notes); save via saveBookmark; refresh; retain selection for still-visible rows.
 */
async function regexReplaceSelected () {
  if (isArchiveScope()) return
  const patternStr = elements.regexReplaceInput && (elements.regexReplaceInput.value || '').trim()
  if (!patternStr || selectedUrls.size === 0) return
  const replacementStr = elements.regexReplacementInput ? (elements.regexReplacementInput.value || '') : ''
  const options = {
    title: elements.regexReplaceTitle ? elements.regexReplaceTitle.checked : false,
    url: elements.regexReplaceUrl ? elements.regexReplaceUrl.checked : false,
    tags: elements.regexReplaceTags ? elements.regexReplaceTags.checked : false,
    notes: elements.regexReplaceNotes ? elements.regexReplaceNotes.checked : false
  }
  if (!options.title && !options.url && !options.tags && !options.notes) {
    if (elements.regexReplaceError) {
      elements.regexReplaceError.textContent = 'Select at least one field (Title, URL, Tags, Notes).'
      elements.regexReplaceError.classList.remove('hidden')
    }
    return
  }
  try {
    RegExp(patternStr)
  } catch (e) {
    if (elements.regexReplaceError) {
      elements.regexReplaceError.textContent = 'Invalid regex: ' + (e instanceof Error ? e.message : String(e))
      elements.regexReplaceError.classList.remove('hidden')
    }
    return
  }
  if (elements.regexReplaceError) {
    elements.regexReplaceError.textContent = ''
    elements.regexReplaceError.classList.add('hidden')
  }
  const urls = Array.from(selectedUrls)
  const byUrl = new Map(allBookmarks.filter(b => b && b.url).map(b => [b.url, b]))
  if (elements.regexReplaceBtn) elements.regexReplaceBtn.disabled = true
  let ok = 0
  let fail = 0
  for (const url of urls) {
    const bookmark = byUrl.get(url)
    if (!bookmark) continue
    const result = applyRegexReplace(bookmark, patternStr, replacementStr, options)
    if (result.error) {
      if (elements.regexReplaceError) {
        elements.regexReplaceError.textContent = result.error
        elements.regexReplaceError.classList.remove('hidden')
      }
      if (elements.regexReplaceBtn) elements.regexReplaceBtn.disabled = false
      updateMoveControlsState()
      return
    }
    if (!result.payload) continue
    if (result.changed === false) continue
    try {
      const res = await chrome.runtime.sendMessage({ type: MESSAGE_TYPE_SAVE, data: result.payload })
      if (res && res.success) ok++
      else fail++
    } catch (e) {
      console.warn('[IMPL-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE] saveBookmark failed for', url, e)
      fail++
    }
  }
  const urlsToRestore = new Set(selectedUrls)
  selectedUrls.clear()
  await loadBookmarks()
  for (const url of selectionStillVisible(urlsToRestore, filteredBookmarks)) selectedUrls.add(url)
  renderTableBody()
  updateMoveControlsState()
  if (fail > 0) console.warn('[IMPL-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE] Replace completed:', ok, 'updated,', fail, 'failed')
}

/** [REQ-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX] Update row count at bottom of page; footer layout keeps it at visual bottom when content is short. */
function updateRowCount () {
  elements.rowCount.textContent = `${filteredBookmarks.length} bookmark${filteredBookmarks.length !== 1 ? 's' : ''}`
}

/** [IMPL-LOCAL_BOOKMARKS_INDEX] Empty state: when no store checked show "Select at least one store…"; when no data show default message. */
function toggleEmptyState () {
  const isArchiveScope = elements.searchScope?.value === 'archive'
  if (isArchiveScope) {
    const showEmpty = filteredBookmarks.length === 0
    if (elements.emptyStateMessage) {
      elements.emptyStateMessage.textContent = showEmpty
        ? 'No saved page archives yet. Use Save page archive on a Local or File page, then return here with search scope Archived content.'
        : elements.emptyStateMessage.textContent
    }
    elements.emptyState.classList.toggle('hidden', !showEmpty)
    elements.tableWrapper.classList.toggle('hidden', showEmpty)
    syncStickyTableHeaderOffset()
    return
  }
  const noStoreChecked = getAllowedStores().size === 0
  const noData = allBookmarks.length === 0
  const showEmpty = noStoreChecked || noData
  if (elements.emptyStateMessage) {
    elements.emptyStateMessage.textContent = noStoreChecked
      ? 'Select at least one store (Local, File, Sync, Browser) to show bookmarks.'
      : 'No local, file, sync, or browser bookmarks. This index shows bookmarks in Local/Sync storage, a File you chose, or native Browser bookmarks. Use Options to set Storage Mode and add bookmarks to see them here.'
  }
  elements.emptyState.classList.toggle('hidden', !showEmpty)
  elements.tableWrapper.classList.toggle('hidden', showEmpty)
  syncStickyTableHeaderOffset()
}

function updateSearchScopeUi () {
  const isArchiveScope = elements.searchScope?.value === 'archive'
  if (elements.searchInput) {
    elements.searchInput.placeholder = isArchiveScope
      ? 'Filter archived pages (leave empty to list all)…'
      : 'Search title, URL, tags, notes…'
  }
}

function setSort (key) {
  if (sortKey === key) {
    sortAsc = !sortAsc
  } else {
    sortKey = key
    // [IMPL-BOOKMARK_USAGE_TRACKING_UI] Default desc for time, visits, lastVisited (newest / most first)
    sortAsc = !['time', 'visits', 'lastVisited'].includes(key)
  }
  const headers = elements.table.querySelectorAll('th.sortable')
  headers.forEach(th => {
    th.classList.remove('sort-active', 'sort-asc', 'sort-desc')
    const icon = th.querySelector('.sort-icon')
    if (th.dataset.sort === sortKey) {
      th.classList.add('sort-active', sortAsc ? 'sort-asc' : 'sort-desc')
      icon.textContent = sortAsc ? '↑' : '↓'
    } else {
      icon.textContent = ''
    }
  })
  sortTable()
  renderTableBody()
}

/**
 * [IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT] Trigger download of a blob as a file.
 */
function downloadBlob (blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * [IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT] [ARCH-LOCAL_BOOKMARKS_INDEX_EXPORT] [REQ-LOCAL_BOOKMARKS_INDEX_EXPORT]
 * Export bookmarks to CSV. scope: 'all' | 'displayed' | 'selected'.
 */
function exportBookmarks (scope) {
  if (isArchiveScope()) return
  let list
  if (scope === 'all') list = allBookmarks
  else if (scope === 'displayed') list = filteredBookmarks
  else if (scope === 'selected') list = allBookmarks.filter(b => selectedUrls.has(b.url || ''))
  else return
  if (!list || list.length === 0) return
  const csv = buildCsv(list)
  const date = new Date().toISOString().slice(0, 10)
  const filename = `hoverboard-bookmarks-${scope}-${date}.csv`
  const blob = new Blob([csv], { type: 'text/csv; charset=utf-8' })
  downloadBlob(blob, filename)
}

/**
 * [IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT] [ARCH-LOCAL_BOOKMARKS_INDEX_EXPORT] [REQ-LOCAL_BOOKMARKS_INDEX_EXPORT]
 * Enable/disable export buttons; Export selected enabled only when at least one bookmark is selected.
 */
function updateExportButtonState () {
  if (isArchiveScope()) {
    if (elements.exportAll) elements.exportAll.disabled = true
    if (elements.exportDisplayed) elements.exportDisplayed.disabled = true
    if (elements.exportSelected) elements.exportSelected.disabled = true
    return
  }
  if (elements.exportAll) elements.exportAll.disabled = allBookmarks.length === 0
  if (elements.exportDisplayed) elements.exportDisplayed.disabled = filteredBookmarks.length === 0
  if (elements.exportSelected) elements.exportSelected.disabled = selectedUrls.size === 0
}

/**
 * [IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT] [ARCH-LOCAL_BOOKMARKS_INDEX_IMPORT] [REQ-LOCAL_BOOKMARKS_INDEX_IMPORT]
 * Normalize a raw object from JSON import to bookmark payload (url, description, tags array, time, shared, toread, extended).
 */
function normalizeJsonBookmark (raw) {
  const url = (raw.url || '').trim()
  if (!url) return null
  const tags = raw.tags == null ? [] : Array.isArray(raw.tags) ? raw.tags : String(raw.tags).split(/\s+/).filter(Boolean)
  const time = (raw.time ?? '').trim()
  return {
    url,
    description: (raw.description ?? '').trim(),
    extended: (raw.extended ?? '').trim(),
    tags,
    time,
    updated_at: (raw.updated_at ?? time ?? '').trim(),
    shared: raw.shared === 'no' ? 'no' : 'yes',
    toread: raw.toread === 'yes' ? 'yes' : 'no'
  }
}

/**
 * [IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT] [ARCH-LOCAL_BOOKMARKS_INDEX_IMPORT] [REQ-LOCAL_BOOKMARKS_INDEX_IMPORT]
 * Parse file content (CSV or JSON) into array of bookmark-like objects. Returns [] on parse error.
 */
function parseImportFile (text, filename) {
  const lower = (filename || '').toLowerCase()
  if (lower.endsWith('.json')) {
    try {
      const data = JSON.parse(text)
      const arr = Array.isArray(data) ? data : [data]
      return arr.map(normalizeJsonBookmark).filter(Boolean)
    } catch (e) {
      console.warn('[IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT] JSON parse failed:', e)
      return []
    }
  }
  return parseCsv(text)
}

/**
 * [IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT] [ARCH-LOCAL_BOOKMARKS_INDEX_IMPORT] [REQ-LOCAL_BOOKMARKS_INDEX_IMPORT]
 * Run import: parse file, optionally filter to only new URLs, send saveBookmark per row, refresh, show result.
 */
async function runImport (file) {
  if (!file || !elements.importResult) return
  setImportResultError(elements.importResult, '')
  const onlyNew = document.querySelector('input[name="import-mode"]:checked')?.value === 'only-new'
  const preferredBackend = (elements.importTarget && elements.importTarget.value) || 'local'
  let text
  try {
    text = await file.text()
  } catch (e) {
    setImportResultError(elements.importResult, 'Could not read file.')
    console.warn('[IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT] file.text() failed:', e)
    return
  }
  const records = parseImportFile(text, file.name)
  if (records.length === 0) {
    setImportResultError(elements.importResult, 'No valid bookmarks in file (or invalid format).')
    return
  }
  const existingUrls = new Set(allBookmarks.map(b => (b.url || '').trim()).filter(Boolean))
  const toSave = onlyNew ? records.filter(r => !existingUrls.has(r.url)) : records
  const skipped = records.length - toSave.length
  setImportResultPending(elements.importResult)
  if (elements.importTrigger) elements.importTrigger.disabled = true
  let imported = 0
  let failed = 0
  for (const rec of toSave) {
    try {
      const res = await chrome.runtime.sendMessage({
        type: MESSAGE_TYPE_SAVE,
        data: { ...rec, preferredBackend }
      })
      if (res && res.success) imported++
      else failed++
    } catch (e) {
      console.warn('[IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT] saveBookmark failed for', rec.url, e)
      failed++
    }
  }
  if (elements.importTrigger) elements.importTrigger.disabled = false
  await loadBookmarks()
  setImportResultFinal(elements.importResult, formatImportResultMessage({ imported, skipped, failed }))
  if (elements.importFile) elements.importFile.value = ''
}

/** [IMPL-LOCAL_BOOKMARKS_INDEX] LOAD_LOCAL_BOOKMARKS_INDEX: aggregate; error/success:false even with [] → local fallback. */
async function loadBookmarks () {
  try {
    const response = await chrome.runtime.sendMessage({ type: MESSAGE_TYPE_AGGREGATED })
    let list = extractBookmarksList(response)
    // [IMPL-LOCAL_BOOKMARKS_INDEX] Failure includes { bookmarks: [], error } — do not treat [] alone as success when error present
    if (isAggregatedIndexLoadFailure(response) || !Array.isArray(list)) {
      console.debug('[IMPL-LOCAL_BOOKMARKS_INDEX] aggregate load failure or non-array; falling back to local', {
        failure: isAggregatedIndexLoadFailure(response),
        isArray: Array.isArray(list)
      })
      const fallback = await chrome.runtime.sendMessage({ type: MESSAGE_TYPE_LOCAL })
      list = extractBookmarksList(fallback) ?? []
      list = (Array.isArray(list) ? list : []).map(b => ({ ...b, storage: 'local' }))
    }
    list = Array.isArray(list) ? list : []
    // [REQ-BOOKMARK_USAGE_TRACKING] [ARCH-BOOKMARK_USAGE_TRACKING_UI] [IMPL-BOOKMARK_USAGE_TRACKING_UI] Merge usage (visits, lastVisited) for Index columns
    let usageArray = []
    try {
      const usageRes = await chrome.runtime.sendMessage({ type: MESSAGE_TYPE_USAGE })
      if (usageRes?.success && Array.isArray(usageRes?.data)) usageArray = usageRes.data
    } catch (_) {}
    allBookmarks = mergeUsageIntoBookmarks(list, usageArray)
    applySearchAndFilter()
    toggleEmptyState()
    updateExportButtonState()
    updateMoveControlsState()
  } catch (err) {
    console.error('[IMPL-LOCAL_BOOKMARKS_INDEX] loadBookmarks failed:', err)
    allBookmarks = []
    elements.emptyState.innerHTML = '<p>Failed to load bookmarks. Try again later.</p>'
    elements.emptyState.classList.remove('hidden')
    elements.tableWrapper.classList.add('hidden')
    updateExportButtonState()
  }
}

/** [IMPL-LOCAL_BOOKMARKS_INDEX] Store change: filter; reload when allBookmarks empty (cold SW recovery). */
function handleStoreFilterChange () {
  return onStoreFilterChange({
    allBookmarksLength: allBookmarks.length,
    allowedStoresSize: getAllowedStores().size,
    applySearchAndFilter,
    loadBookmarks
  })
}

/**
 * [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [REQ-LOCAL_BOOKMARKS_INDEX] How: INITIALIZE_INDEX_CONTROL_TABS defaults to Stores at the head and Actions at the footer, then binds accessible tab activation without changing control behavior.
 */
function updateControlTabDom (region, activeGroup) {
  const regionEl = document.querySelector(`[data-control-region="${region}"]`)
  if (!regionEl) return
  regionEl.querySelectorAll('[data-control-tab]').forEach((tab) => {
    const selected = tab.dataset.controlGroup === activeGroup
    tab.setAttribute('aria-selected', String(selected))
    tab.tabIndex = selected ? 0 : -1
  })
  regionEl.querySelectorAll('[data-control-panel]').forEach((panel) => {
    panel.hidden = panel.dataset.controlGroup !== activeGroup
  })
}

/** [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [REQ-LOCAL_BOOKMARKS_INDEX] How: SET_HEAD_CONTROL_GROUP and SET_FOOTER_CONTROL_GROUP reject invalid groups and synchronize one selected tab with one visible panel. */
function activateControlGroup (region, group, focus = false) {
  const nextState = selectControlGroup(controlTabState, region, group)
  if (nextState === controlTabState) return
  controlTabState = nextState
  updateControlTabDom(region, group)
  if (focus) {
    document.querySelector(`[data-control-region="${region}"] [data-control-group="${group}"][data-control-tab]`)?.focus()
  }
  syncControlPanelOffsets()
}

/** [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [REQ-LOCAL_BOOKMARKS_INDEX] How: APPLY_STICKY_THEAD_OFFSET keeps the heading row at the table top initially, then applies the measured head-panel offset only after the list scrolls beneath the fixed controls. */
function syncStickyTableHeaderOffset () {
  const container = document.querySelector('.container')
  const tableWrapper = document.querySelector('#table-wrapper')
  const headPanel = document.querySelector('.index-head-controls')
  if (!container || !tableWrapper || !headPanel) return

  const tableTop = tableWrapper.getBoundingClientRect().top
  const headHeight = headPanel.offsetHeight
  container.classList.toggle('sticky-thead-offset', tableTop < headHeight)
}

/** [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [REQ-LOCAL_BOOKMARKS_INDEX] How: SYNC_CONTROL_PANEL_OFFSETS measures fixed regions for sticky table headers and footer spacing. */
function syncControlPanelOffsets () {
  const container = document.querySelector('.container')
  if (!container) return
  const headPanel = document.querySelector('.index-head-controls')
  const footerPanel = document.querySelector('.index-footer')
  if (headPanel) container.style.setProperty('--index-head-sticky-height', `${headPanel.offsetHeight}px`)
  if (footerPanel) container.style.setProperty('--index-footer-sticky-height', `${footerPanel.offsetHeight}px`)
  syncStickyTableHeaderOffset()
}

function initControlTabs () {
  /**
   * [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [REQ-LOCAL_BOOKMARKS_INDEX] How: INITIALIZE_INDEX_CONTROL_TABS defaults to Stores at the head and Actions at the footer, then binds accessible tab activation without changing control behavior.
   */
  updateControlTabDom('head', controlTabState.head)
  updateControlTabDom('footer', controlTabState.footer)
  document.querySelectorAll('[data-control-tab]').forEach((tab) => {
    tab.addEventListener('click', () => {
      activateControlGroup(tab.dataset.controlTab, tab.dataset.controlGroup)
    })
    tab.addEventListener('keydown', (event) => {
      const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End']
      if (!keys.includes(event.key)) return
      event.preventDefault()
      const region = tab.dataset.controlTab
      const tabs = Array.from(document.querySelectorAll(`[data-control-region="${region}"] [data-control-tab]`))
      const currentIndex = tabs.indexOf(tab)
      const nextIndex = event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? tabs.length - 1
          : (currentIndex + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length
      const nextTab = tabs[nextIndex]
      if (nextTab) {
        activateControlGroup(region, nextTab.dataset.controlGroup, true)
      }
    })
  })
  syncControlPanelOffsets()
}

function init () {
  initToolPageVersion()
  initControlTabs()
  elements.searchInput.addEventListener('input', applySearchAndFilter)
  elements.searchScope?.addEventListener('change', () => {
    if (isArchiveScope()) selectedUrls.clear()
    updateSearchScopeUi()
    applySearchAndFilter()
  })
  elements.searchClear.addEventListener('click', () => {
    elements.searchInput.value = ''
    applySearchAndFilter()
  })
  if (elements.storeLocal) elements.storeLocal.addEventListener('change', handleStoreFilterChange)
  if (elements.storeFile) elements.storeFile.addEventListener('change', handleStoreFilterChange)
  if (elements.storeSync) elements.storeSync.addEventListener('change', handleStoreFilterChange)
  if (elements.storeBrowser) elements.storeBrowser.addEventListener('change', handleStoreFilterChange)
  if (elements.filterTags) elements.filterTags.addEventListener('input', applySearchAndFilter)
  if (elements.filterToread) elements.filterToread.addEventListener('change', applySearchAndFilter)
  if (elements.filterPrivate) elements.filterPrivate.addEventListener('change', applySearchAndFilter)
  if (elements.filterTimeRangeStart) elements.filterTimeRangeStart.addEventListener('change', applySearchAndFilter)
  if (elements.filterTimeRangeEnd) elements.filterTimeRangeEnd.addEventListener('change', applySearchAndFilter)
  if (elements.filterTimeRangeField) elements.filterTimeRangeField.addEventListener('change', applySearchAndFilter)
  if (elements.filterTagsExclude) elements.filterTagsExclude.addEventListener('input', applySearchAndFilter)
  if (elements.showOnlyClear) elements.showOnlyClear.addEventListener('click', applyShowOnlyDefaults)

  if (elements.timeColumnSource) {
    elements.timeColumnSource.addEventListener('change', () => {
      timeColumnSource = elements.timeColumnSource.value
      sortTable()
      renderTableBody()
    })
  }
  if (elements.timeDisplayMode) {
    elements.timeDisplayMode.addEventListener('change', () => {
      timeDisplayMode = elements.timeDisplayMode.value
      renderTableBody()
    })
  }

  if (elements.exportAll) elements.exportAll.addEventListener('click', () => exportBookmarks('all'))
  if (elements.exportDisplayed) elements.exportDisplayed.addEventListener('click', () => exportBookmarks('displayed'))
  if (elements.exportSelected) elements.exportSelected.addEventListener('click', () => exportBookmarks('selected'))

  elements.table.querySelectorAll('th.sortable').forEach(th => {
    th.addEventListener('click', () => setSort(th.dataset.sort))
  })

  if (elements.selectAll) {
    elements.selectAll.addEventListener('change', () => {
      const visible = filteredBookmarks.map(b => b.url).filter(Boolean)
      if (elements.selectAll.checked) {
        visible.forEach(u => selectedUrls.add(u))
      } else {
        visible.forEach(u => selectedUrls.delete(u))
      }
      renderTableBody()
      updateMoveControlsState()
    })
  }
  elements.tableBody.addEventListener('change', (e) => {
    const cb = e.target.closest('.row-select')
    if (cb && cb.dataset.url !== undefined) {
      onRowSelectChange(cb.dataset.url, cb.checked)
    }
  })

  if (elements.moveButton) elements.moveButton.addEventListener('click', () => moveSelectedToStorage())
  if (elements.deleteSelectedBtn) elements.deleteSelectedBtn.addEventListener('click', () => deleteSelectedBookmarks())
  if (elements.addTagsBtn) elements.addTagsBtn.addEventListener('click', () => addTagsToSelected())
  if (elements.deleteTagsBtn) elements.deleteTagsBtn.addEventListener('click', () => deleteTagsFromSelected())
  if (elements.regexReplaceBtn) elements.regexReplaceBtn.addEventListener('click', () => regexReplaceSelected())
  if (elements.regexReplaceInput) {
    elements.regexReplaceInput.addEventListener('input', () => updateMoveControlsState())
    elements.regexReplaceInput.addEventListener('change', () => updateMoveControlsState())
  }

  if (elements.importTrigger && elements.importFile) {
    elements.importTrigger.addEventListener('click', () => elements.importFile.click())
    elements.importFile.addEventListener('change', (e) => {
      const file = e.target.files?.[0]
      if (file) runImport(file)
    })
  }

  if (elements.timeColumnSource) timeColumnSource = elements.timeColumnSource.value
  if (elements.timeDisplayMode) timeDisplayMode = elements.timeDisplayMode.value

  /* [REQ-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX] SYNC_CONTROL_PANEL_OFFSETS measures fixed head/footer regions for sticky headers and list spacing. */
  if (typeof ResizeObserver === 'function') {
    const ro = new ResizeObserver(syncControlPanelOffsets)
    const headPanel = document.querySelector('.index-head-controls')
    const footerPanel = document.querySelector('.index-footer')
    if (headPanel) ro.observe(headPanel)
    if (footerPanel) ro.observe(footerPanel)
  }
  syncControlPanelOffsets()

  /* [REQ-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX] APPLY_STICKY_THEAD_OFFSET observes the bookmark list and rechecks its position during scrolling so the heading row moves below the fixed head controls only when needed. */
  const tableWrapper = document.querySelector('#table-wrapper')
  if (tableWrapper) {
    window.addEventListener('scroll', syncStickyTableHeaderOffset, { passive: true })
    if (typeof IntersectionObserver === 'function') {
      const io = new IntersectionObserver(() => syncStickyTableHeaderOffset())
      io.observe(tableWrapper)
    }
    syncStickyTableHeaderOffset()
  }

  // [REQ-LIBRARY_SEARCH_ENTRY] [IMPL-LIBRARY_SEARCH_ENTRY] Prefill search from ?q=
  try {
    prefillSearchFromQuery(new URLSearchParams(window.location.search || ''), elements.searchInput)
  } catch (_) { /* ignore */ }

  // [REQ-LINK_HEALTH] [IMPL-LINK_HEALTH]
  elements.filterHealth?.addEventListener('change', applySearchAndFilter)
  elements.checkLinkHealth?.addEventListener('click', async () => {
    const urls = selectedUrls.size
      ? Array.from(selectedUrls)
      : filteredBookmarks.map((b) => b.url).filter(Boolean)
    let enabled = false
    try {
      const { ConfigManager } = await import('../../config/config-manager.js')
      const cm = new ConfigManager()
      enabled = isLinkHealthChecksEnabled(await cm.getConfig())
    } catch (_) {
      enabled = false
    }
    await runCheckLinkHealth({
      urls,
      sendMessage: (msg) => chrome.runtime.sendMessage(msg),
      resultEl: elements.linkHealthResult,
      enabled,
      onResults: (results) => {
        Object.assign(linkHealthMap, results || {})
        applySearchAndFilter()
      }
    })
  })
  ;(async () => {
    try {
      const { ConfigManager } = await import('../../config/config-manager.js')
      const cm = new ConfigManager()
      const enabled = isLinkHealthChecksEnabled(await cm.getConfig())
      applyLinkHealthControlsGate(enabled, elements.checkLinkHealth)
    } catch (_) {
      applyLinkHealthControlsGate(false, elements.checkLinkHealth)
    }
  })()
  chrome.runtime.sendMessage({ type: 'GET_LINK_HEALTH' }, (response) => {
    if (response?.success && response.data) {
      linkHealthMap = response.data
      applySearchAndFilter()
    }
  })

  // [REQ-LOCAL_QUERY_API] [IMPL-LOCAL_QUERY_API]
  elements.refreshApiSnapshot?.addEventListener('click', async () => {
    await runRefreshApiSnapshot({
      sendMessage: (msg) => chrome.runtime.sendMessage(msg),
      resultEl: elements.apiSnapshotResult
    })
  })

  loadBookmarks()
  updateMoveControlsState()
  updateSearchScopeUi()
}

init()
