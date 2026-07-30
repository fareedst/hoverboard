/**
 * [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [ARCH-SIDE_PANEL_TABS] [IMPL-SIDE_PANEL_TABS]
 * Tab state constants and pure helpers for side panel tabs (Bookmark | Tags tree).
 * Used by side-panel.js for storage key, tab ids, and visibility.
 */

/** @type {string} chrome.storage.local key for last-selected tab */
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
 * === IMPL-FULL-BLOCK: IMPL-SIDE_PANEL_BROWSER_BOOKMARKS ===
 * [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS] [ARCH-SIDE_PANEL_BROWSER_BOOKMARKS] [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] — This block defines the browser bookmarks panel: data fetch, flatten, folder tree, filter, UI, click to open. Implements REQ by listing Chrome bookmarks with folder path and favicon; real-time search; folder filter; implements ARCH by direct chrome.bookmarks tree UX. Boundary: this panel is NOT Store B / IMPL-BROWSER_BOOKMARK_SERVICE (BookmarkRouter peer). Panel owns direct tree UI; Store B is the fifth router backend for Index/Save-to/move.
 *
 * ## FLATTEN_BOOKMARK_TREE
 *
 * - [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [ARCH-SIDE_PANEL_BROWSER_BOOKMARKS] [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS] How: Data fetch: panel calls chrome.bookmarks.getTree; flatten to list. Implements "list all Chrome bookmarks". flattenBookmarkTree(nodes, parentPath): pure. For each node: if node.url push { id, url, title, dateAdded, folderPath: parentPath, parentId }; if node.children recurse with path = parentPath ? parentPath + ' / ' + node.title : node.title. Return flat list. Implements "folder path per bookmark".
 * - Contract:
 *   - INPUT: searchQuery (string), selectedFolderId (string | null), bookmarks from chrome.bookmarks.getTree
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: visible bookmarks (filtered), click URL opens in new tab
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: allBookmarks = flattenBookmarkTree(tree), visibleBookmarks = filterBrowserBookmarks(allBookmarks, searchQuery, selectedFolderId)
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: FLATTEN_BOOKMARK_TREE
 *   - list = []
 *   - FOR each node in nodes:
 *   - path = parentPath ? parentPath + ' / ' + (node.title || 'Unnamed') : (node.title || 'Unnamed')
 *   - IF node.url: list.push({ id: node.id, url: node.url, title: node.title || '', dateAdded: node.dateAdded ?? 0, folderPath: parentPath, parentId: node.parentId })
 *   - IF node.children: list.push(...flattenBookmarkTree(node.children, path))
 *   - RETURN list
 *
 * ## BUILD_FOLDER_TREE
 *
 * - [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [ARCH-SIDE_PANEL_BROWSER_BOOKMARKS] [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS] How: buildFolderTree(nodes, parentPath): pure. Returns [{ id, title, path, count, children }]. count = number of direct bookmarks (node.url) in this folder; children = recurse on node.children. Implements "folder tree with bookmark counts".
 * - Contract:
 *   - INPUT: searchQuery (string), selectedFolderId (string | null), bookmarks from chrome.bookmarks.getTree
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: visible bookmarks (filtered), click URL opens in new tab
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: allBookmarks = flattenBookmarkTree(tree), visibleBookmarks = filterBrowserBookmarks(allBookmarks, searchQuery, selectedFolderId)
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: BUILD_FOLDER_TREE
 *   - result = []
 *   - FOR each node in nodes:
 *   - path = parentPath ? parentPath + ' / ' + (node.title || 'Unnamed') : (node.title || 'Unnamed')
 *   - directCount = (node.children ?? []).filter(c => c.url).length
 *   - childFolders = buildFolderTree((node.children ?? []).filter(c => !c.url), path)
 *   - result.push({ id: node.id, title: node.title || 'Unnamed', path, count: directCount, children: childFolders })
 *   - RETURN result
 *
 * ## FILTER_BROWSER_BOOKMARKS
 *
 * - [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [ARCH-SIDE_PANEL_BROWSER_BOOKMARKS] [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS] How: filterBrowserBookmarks(bookmarks, query, folderId): pure. Empty query returns all. If folderId: filter where parentId === folderId. Then filter by query: case-insensitive substring match on title, url, folderPath. Implements "real-time search" and "folder filter".
 * - Contract:
 *   - INPUT: searchQuery (string), selectedFolderId (string | null), bookmarks from chrome.bookmarks.getTree
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: visible bookmarks (filtered), click URL opens in new tab
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: allBookmarks = flattenBookmarkTree(tree), visibleBookmarks = filterBrowserBookmarks(allBookmarks, searchQuery, selectedFolderId)
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: FILTER_BROWSER_BOOKMARKS
 *   - filtered = bookmarks
 *   - IF folderId: filtered = filtered.filter(b => b.parentId === folderId)
 *   - q = String(query).trim().toLowerCase()
 *   - IF q === '': RETURN filtered
 *   - RETURN filtered.filter(b => (b.title??'').toLowerCase().includes(q) OR (b.url??'').toLowerCase().includes(q) OR (b.folderPath??'').toLowerCase().includes(q))
 *
 * ## BLOCK_4
 *
 * - [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [ARCH-SIDE_PANEL_BROWSER_BOOKMARKS] [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS] How: UI: search input; folder dropdown/sidebar; list section; match count. Each row: favicon, title, url, folder path. Click url: chrome.tabs.create({ url }) for http(s). Implements "match count", "click URL opens in new tab". Bulk selection and button state: selectedIds Set; renderList outputs checkbox per row; checkbox change toggles selectedIds; updateBulkButtonStates disables Open/Copy/Move/Delete/Export when selectedIds.size === 0. Select all / Deselect all buttons. Bulk actions: Open in tabs (getSelectedBookmarks, chrome.tabs.create per URL); Open in window (chrome.windows.create); Copy (buildUrlListForCopy, navigator.clipboard.writeText); Move (move select value, chrome.bookmarks.move); Delete (confirm, chrome.bookmarks.remove, push undo stack, showUndoMessage). Undo: undoStack array; UNDO_STACK_LIMIT 50; showUndoMessage(count) renders #browserBookmarksUndoBar with "Undo" button and setTimeout(UNDO_MESSAGE_DURATION_MS) to hide; on Undo click pop entry, chrome.bookmarks.create per bookmark, loadBookmarks. Export: buildBookmarksHtml/buildBookmarksCsv(selected|allBookmarks); Blob; downloadBlob. Export selected/all buttons disabled when no selection or no data. Import: populateImportFolderSelect from folderTree; file input; on Import read file.text(), parse by extension (parseBookmarksHtml|parseBookmarksCsv); get existing URLs via getSubTree(targetId)+flatten; for each row skip or overwrite per conflict; chrome.bookmarks.create; progress; loadBookmarks. Inline edit: double-click [data-field="title"] or [data-field="url"]; startInlineEdit(el): create input, replace el, focus; on blur/Enter finishEdit: chrome.bookmarks.update(id, { title }|{ url }), update allBookmarks, applyFilter(); Escape restore currentVal and applyFilter(). Keyboard: document keydown; if panel hidden return; if target in input/select/textarea and Escape blur and return; if Escape clear selectedIds and applyFilter(); if Ctrl+F preventDefault and focus searchInput. Layout: Undo bar #browserBookmarksUndoBar; import section with Import to folder, Conflict select, file input, Import button, progress; populateMoveSelect and populateImportFolderSelect mirror folder tree. Panel layout: same as Tags tree. #browserBookmarksPanel scroll container; .browser-bookmarks-above-list (flex none) with header, search, folder selector; .browser-bookmarks-list-section (min-height 100%, overflow-y auto) with #browserBookmarksList.
 * - Contract:
 *   - INPUT: searchQuery (string), selectedFolderId (string | null), bookmarks from chrome.bookmarks.getTree
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: visible bookmarks (filtered), click URL opens in new tab
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: selectedIds = Set(), lastVisible = filtered+sorted list
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: BLOCK_4
 *   - 1. RENDER: FOR each b in visibleBookmarks: display row with favicon, title, url (clickable), folderPath; show "N bookmarks" count
 *   - 2. ON search input: searchQuery = value; applyFilter(); renderList()
 *   - 3. ON folder select: selectedFolderId = value; applyFilter(); renderList()
 *   - 4. ON sort select: sortValue = value; applyFilter(); chrome.storage.local.set({ hoverboard_browser_bookmarks_sort: sortValue })
 *   - 5. sortBrowserBookmarks(visible, sortBy, sortAsc): IF sortBy === 'default' RETURN copy; IF sortBy === 'date' sort by dateAdded; IF sortBy === 'name' sort by title; sortAsc controls direction
 *   - 6. ON url click: IF url starts with http(s): chrome.tabs.create({ url: b.url })
 *   - 7. getSelectedBookmarks() = lastVisible.filter(b => selectedIds.has(b.id))
 *   - 8. ON Select all: FOR b in lastVisible selectedIds.add(b.id); applyFilter()
 *   - 9. ON Deselect all: selectedIds.clear(); applyFilter()
 *   - 10. ON Open in tabs: FOR url in getSelectedBookmarks().map(b => b.url): chrome.tabs.create({ url })
 *   - 11. ON Open in window: chrome.windows.create({ url: getSelectedBookmarks().map(b => b.url) })
 *   - 12. ON Copy URLs: navigator.clipboard.writeText(buildUrlListForCopy(getSelectedBookmarks()))
 *   - 13. ON Move: targetId = moveSelect.value; FOR b in getSelectedBookmarks(): chrome.bookmarks.move(b.id, { parentId: targetId }); loadBookmarks()
 *   - 14. ON Delete: confirm; FOR b in getSelectedBookmarks(): chrome.bookmarks.remove(b.id); push to undoStack { bookmarks: [{ parentId, url, title }] }; showUndoMessage(count)
 *   - 15. showUndoMessage(deletedCount): render undo bar "Deleted N bookmarks. Undo"; setTimeout(hide, UNDO_MESSAGE_DURATION_MS)
 *   - 16. ON Undo click: entry = undoStack.pop(); FOR b in entry.bookmarks: chrome.bookmarks.create({ parentId: b.parentId||'1', url, title, index: 0 }); loadBookmarks()
 *   - 17. ON Export selected HTML/CSV: buildBookmarksHtml|buildBookmarksCsv(getSelectedBookmarks()); downloadBlob(blob, filename)
 *   - 18. ON Export all HTML/CSV: buildBookmarksHtml|buildBookmarksCsv(allBookmarks); downloadBlob(blob, filename)
 *   - 19. ON Import: list = parseBookmarksHtml(text)|parseBookmarksCsv(text); existingUrls = flatten(getSubTree(targetId)); FOR b in list: IF conflict skip skip; ELSE IF overwrite find and chrome.bookmarks.update OR create; ELSE chrome.bookmarks.create; update progress; loadBookmarks()
 *   - 20. ON double-click title|url: startInlineEdit(el); input.onblur|Enter => finishEdit (update then applyFilter); Escape => applyFilter (restore view)
 *   - 21. handleBookmarksKeydown(e): IF panel hidden RETURN; IF target in input|select|textarea AND Escape THEN blur; RETURN; IF Escape THEN selectedIds.clear(); applyFilter(); IF Ctrl+F THEN preventDefault; searchInput.focus()
 *   - 22. PANEL LAYOUT: above-list includes undo bar, bulk actions, import section; populateMoveSelect() and populateImportFolderSelect() from folderTree
 *   - 23. PANEL LAYOUT: browserBookmarksPanel = scroll container; above-list = header + search + folder + sort + bulk + undo + import; list-section = #browserBookmarksList
 *
 * === END IMPL-FULL-BLOCK: IMPL-SIDE_PANEL_BROWSER_BOOKMARKS ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-SIDE_PANEL_TABS ===
 * [IMPL-SIDE_PANEL_TABS] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [REQ-RECENT_TAGS_SYSTEM] [ARCH-TAG_SYSTEM] — Tabbed side panel: tab bar, panels, persist, init This Page / By Tag / browser Tabs; recent-tags refresh on window focus while Bookmark tab active (same loadRecentTags contract as [IMPL-RECENT_TAGS_POPUP_REFRESH]); single page + scoped popup root per ARCH-SIDE_PANEL_TABS.
 *
 * ## GET_TAGS_TREE_INIT_OPTIONS
 *
 * - [IMPL-SIDE_PANEL_TABS] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_TAGS_TREE] How: pure helper for By Tag init — { currentBookmarkTags } from controller.currentPin.tags via normalizeTags; lives in side-panel-tab-state.js.
 * - Contract:
 *   - INPUT: panel page load; user click on tab ("This Page", "By Tag", or "Tabs")
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: one panel visible; This Page, By Tag, or browser Tabs content shown; selected tab persisted
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: activeTab ("bookmark" | "tagsTree" | "browserTabs"), bookmarkTabInited (boolean), tagsTreeTabInited (boolean), browserTabsTabInited (boolean), storage key hoverboard_sidepanel_active_tab. TAB_BROWSER_TABS = "browserTabs"; TAB_IDS includes browserTabs.
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: GET_TAGS_TREE_INIT_OPTIONS
 *   - IF controller missing: RETURN { currentBookmarkTags: [] }
 *   - raw = controller.normalizeTags(controller.currentPin?.tags) || []
 *   - RETURN { currentBookmarkTags: Array.isArray(raw) ? raw : [] }
 *
 * ## BIND_WINDOW_FOCUS_RECENT_TAGS_REFRESH
 *
 * - [IMPL-SIDE_PANEL_TABS] [ARCH-SIDE_PANEL_TABS] [ARCH-TAG_SYSTEM] [REQ-RECENT_TAGS_SYSTEM] [IMPL-RECENT_TAGS_POPUP_REFRESH] How: cross-IMPL — invokes PopupController.loadRecentTags() (async; same family as popup). chrome.windows.getCurrent callback does not await the returned promise (fire-and-forget; matches production side-panel.js). Register after bindTabChangeRefresh on panel load. Focus to this window (not WINDOW_ID_NONE), getCurrent id match; sync guards via shouldInvokeLoadRecentTagsOnWindowFocusSync in side-panel-tab-state.js (matches unit tests); no-op without chrome.windows. Phase G: exported for composition tests; setActiveTabForTest sets activeTab in tests only.
 * - Contract:
 *   - INPUT: panel page load; user click on tab ("This Page", "By Tag", or "Tabs")
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: one panel visible; This Page, By Tag, or browser Tabs content shown; selected tab persisted | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: activeTab ("bookmark" | "tagsTree" | "browserTabs"), bookmarkTabInited (boolean), tagsTreeTabInited (boolean), browserTabsTabInited (boolean), storage key hoverboard_sidepanel_active_tab. TAB_BROWSER_TABS = "browserTabs"; TAB_IDS includes browserTabs.
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: BIND_WINDOW_FOCUS_RECENT_TAGS_REFRESH
 *   - hasWindowsApi = !!(onFocusChanged AND getCurrent); IF NOT hasWindowsApi: RETURN
 *   - REGISTER onFocusChanged(windowId):
 *   - IF windowId === WINDOW_ID_NONE: RETURN
 *   - getCurrent → IF runtime.lastError OR window id mismatch: RETURN
 *   - IF NOT shouldInvokeLoadRecentTagsOnWindowFocusSync({ hasWindowsApi, activeTab, isInitialized: controller?.isInitialized, isLoading: controller?.isLoading }): RETURN
 *   - controller.loadRecentTags()  // async; not AWAIT in callback (S09.GREEN LEAP alignment)
 *
 * ## SHOULD_INVOKE_LOAD_RECENT_TAGS_ON_WINDOW_FOCUS_SYNC
 *
 * - --- Phase H E2E-only boundary [REQ-RECENT_TAGS_SYSTEM] [IMPL-SIDE_PANEL_TABS] --- How: Cross-window "return focus to this browser window → Recent Tags refresh" is e2e_only: phase_h_window_focus_recent_tags_cross_window (multi-window + real onFocusChanged). Phase G: tests/integration/window-focus-recent-tags-composition.integration.test.js. This Page Recent Tags mount in chrome-extension:// side-panel.html is e2e_only: phase_h_side_panel_recent_tags_extension_document — tests/playwright/extension-side-panel-recent-tags-e2e.spec.js. How: pure predicate for window-focus recent refresh sync gates (tested in side-panel-tabs.test.js); implementation is single boolean AND (same semantics as chained IFs). Token set aligned with side-panel-tab-state.js and tests (S09.SYNC).
 * - Contract:
 *   - INPUT: panel page load; user click on tab ("This Page", "By Tag", or "Tabs")
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: one panel visible; This Page, By Tag, or browser Tabs content shown; selected tab persisted
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: activeTab ("bookmark" | "tagsTree" | "browserTabs"), bookmarkTabInited (boolean), tagsTreeTabInited (boolean), browserTabsTabInited (boolean), storage key hoverboard_sidepanel_active_tab. TAB_BROWSER_TABS = "browserTabs"; TAB_IDS includes browserTabs.
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: SHOULD_INVOKE_LOAD_RECENT_TAGS_ON_WINDOW_FOCUS_SYNC
 *   - RETURN !!(hasWindowsApi AND activeTab === "bookmark" AND isInitialized AND NOT isLoading)
 *
 * ## SWITCH_TAB
 *
 * - [IMPL-SIDE_PANEL_TABS] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_TAGS_TREE] How: persist activeTab; showPanel; tagsTree branch passes currentBookmarkTags / setSelectedTagsFromCurrentBookmark; returning to bookmark when already inited → refreshPopupData. Tab-change refresh contract is BIND_TAB_CHANGE_REFRESH (below).
 * - Contract:
 *   - INPUT: panel page load; user click on tab ("This Page", "By Tag", or "Tabs")
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: one panel visible; This Page, By Tag, or browser Tabs content shown; selected tab persisted
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: activeTab ("bookmark" | "tagsTree" | "browserTabs"), bookmarkTabInited (boolean), tagsTreeTabInited (boolean), browserTabsTabInited (boolean), storage key hoverboard_sidepanel_active_tab. TAB_BROWSER_TABS = "browserTabs"; TAB_IDS includes browserTabs.
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: SWITCH_TAB
 *   - wasBookmarkInited = bookmarkTabInited
 *   - activeTab = tabId
 *   - chrome.storage.local.set({ hoverboard_sidepanel_active_tab: tabId })
 *   - showPanel(activeTab)
 *   - IF tabId === "tagsTree": currentTags = controller.normalizeTags(controller.currentPin?.tags) OR []; wasTagsTreeInited = tagsTreeTabInited; initTabIfNeeded(tabId, { currentBookmarkTags: currentTags }); IF wasTagsTreeInited: setSelectedTagsFromCurrentBookmark(currentTags)
 *   - ELSE IF tabId === "browserTabs": initTabIfNeeded("browserTabs")
 *   - ELSE: initTabIfNeeded(tabId)
 *   - IF tabId === "bookmark" AND wasBookmarkInited AND popupComponents.controller: popupComponents.controller.refreshPopupData()
 *
 * ## BIND_TAB_CHANGE_REFRESH
 *
 * - [IMPL-SIDE_PANEL_TABS] [IMPL-POPUP_SESSION] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [REQ-SUGGESTED_TAGS_FROM_CONTENT] How: onActivated/onUpdated → setRefreshAttribution(trigger=tabChange, surface=side_panel) then refreshPopupData. Bookmark path always refreshes; inject/suggested-tags use CLASSIFY_SCRIPT_INJECTION_URL so gallery/restricted tabs never call chrome.scripting. Exported bindTabChangeRefresh for composition tests (mirror bindWindowFocusRecentTagsRefresh). Observable: ui-inspector injectionOutcome with trigger tabChange.
 * - Contract:
 *   - INPUT: chrome.tabs.onActivated / onUpdated events; PopupController instance
 *   - PRE: controller and tabs APIs available when binding; refresh attribution helpers wired
 *   - OUTPUT: void; This Page refresh scheduled; injectionOutcome when inject skipped
 *   - POST:
 *     - success => refreshPopupData invoked with tabChange attribution
 *     - non-scriptable active tab => no chrome.scripting.executeScript / insertCSS; bookmark fields still update
 *   - FAILURE_MODES: RefreshFailed (controller path; logged)
 *   - DATA: controller._refreshTrigger ("tabChange"); controller._refreshSurface ("side_panel")
 *   - DATA_TRANSITION: on tab change, currentPin/tags refresh; suggested tags empty on expected skip
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: BIND_TAB_CHANGE_REFRESH
 *   - ON tabs.onActivated OR (tabs.onUpdated status complete):
 *   -   controller.setRefreshAttribution({ trigger: "tabChange", surface: "side_panel" })
 *   -   AWAIT controller.refreshPopupData()
 *   -   # inject prechecks inside loadSuggestedTags / updateOverlayState / injectContentScript
 *
 * ## SHOW_PANEL
 *
 * - [IMPL-SIDE_PANEL_TABS] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [REQ-SIDE_PANEL_BROWSER_TABS] How: toggle visibility of #bookmarkPanel / #tagsTreePanel / #browserTabsPanel so exactly one content panel shows.
 * - Contract:
 *   - INPUT: panel page load; user click on tab ("This Page", "By Tag", or "Tabs")
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: one panel visible; This Page, By Tag, or browser Tabs content shown; selected tab persisted
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: activeTab ("bookmark" | "tagsTree" | "browserTabs"), bookmarkTabInited (boolean), tagsTreeTabInited (boolean), browserTabsTabInited (boolean), storage key hoverboard_sidepanel_active_tab. TAB_BROWSER_TABS = "browserTabs"; TAB_IDS includes browserTabs.
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: SHOW_PANEL
 *   - IF activeTab === "bookmark": #bookmarkPanel visible, #tagsTreePanel hidden, #browserTabsPanel hidden
 *   - ELSE IF activeTab === "tagsTree": #tagsTreePanel visible, #bookmarkPanel hidden, #browserTabsPanel hidden
 *   - ELSE IF activeTab === "browserTabs": #browserTabsPanel visible, #bookmarkPanel hidden, #tagsTreePanel hidden
 *
 * ## INIT_TAB_IF_NEEDED
 *
 * - [IMPL-SIDE_PANEL_TABS] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] How: header row — setSidePanelVersion / initSidePanelVersion; no-op if #side-panel-version missing; guards for tests without chrome.runtime. How: CSS flex column on body + .side-panel-content flex 1 so tab content fills viewport. How: composed_with — single init of popup stack in #bookmarkPanel; pre: DOM ready; post: controller + loadInitialData + setupEventListeners; wires footer By Tag → switchTab("tagsTree").
 * - Contract:
 *   - INPUT: panel page load; user click on tab ("This Page", "By Tag", or "Tabs")
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: one panel visible; This Page, By Tag, or browser Tabs content shown; selected tab persisted | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: activeTab ("bookmark" | "tagsTree" | "browserTabs"), bookmarkTabInited (boolean), tagsTreeTabInited (boolean), browserTabsTabInited (boolean), storage key hoverboard_sidepanel_active_tab. TAB_BROWSER_TABS = "browserTabs"; TAB_IDS includes browserTabs.
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: INIT_TAB_IF_NEEDED
 *   - IF bookmarkTabInited RETURN
 *   - bookmarkTabInited = true
 *   - uiSystem = AWAIT UISystem.init(); popupComponents = uiSystem.createPopup({ container: document.getElementById('bookmarkPanel'), errorHandler, config })
 *   - AWAIT popupComponents.controller.loadInitialData()
 *   - popupComponents.uiManager.setupEventListeners()
 *   - // Wire "By Tag" in footer to switchTab("tagsTree") when in panel context
 *
 * ## INIT_TAB_IF_NEEDED
 *
 * - [IMPL-SIDE_PANEL_TABS] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_TAGS_TREE] How: composed_with — lazy initTagsTreeTab(options); currentBookmarkTags aligns selector after loadBookmarks; depends on bookmark tab controller when switching from This Page.
 * - Contract:
 *   - INPUT: panel page load; user click on tab ("This Page", "By Tag", or "Tabs")
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: one panel visible; This Page, By Tag, or browser Tabs content shown; selected tab persisted
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: activeTab ("bookmark" | "tagsTree" | "browserTabs"), bookmarkTabInited (boolean), tagsTreeTabInited (boolean), browserTabsTabInited (boolean), storage key hoverboard_sidepanel_active_tab. TAB_BROWSER_TABS = "browserTabs"; TAB_IDS includes browserTabs.
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: INIT_TAB_IF_NEEDED
 *   - IF tagsTreeTabInited RETURN
 *   - tagsTreeTabInited = true
 *   - initTagsTreeTab(options)  // load getAggregatedBookmarksForIndex; if options.currentBookmarkTags set, apply at end of loadBookmarks
 *
 * ## INIT_TAB_IF_NEEDED
 *
 * - [IMPL-SIDE_PANEL_TABS] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] How: composed_with — initBrowserTabsTab once; chrome.tabs list + optional referrers; visibility when activeTab === "browserTabs".
 * - Contract:
 *   - INPUT: panel page load; user click on tab ("This Page", "By Tag", or "Tabs")
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: one panel visible; This Page, By Tag, or browser Tabs content shown; selected tab persisted
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: activeTab ("bookmark" | "tagsTree" | "browserTabs"), bookmarkTabInited (boolean), tagsTreeTabInited (boolean), browserTabsTabInited (boolean), storage key hoverboard_sidepanel_active_tab. TAB_BROWSER_TABS = "browserTabs"; TAB_IDS includes browserTabs.
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: INIT_TAB_IF_NEEDED
 *   - IF browserTabsTabInited RETURN
 *   - browserTabsTabInited = true
 *   - initBrowserTabsTab()  // load tabs, referrers; render #browserTabsPanel list; bind search input, Copy button, Close button
 *   - How (sub-block): Phase G: switchTabForTest(tabId) and resetBrowserTabsTabInitedForTest() exported for composition tests — same switchTab → initTabIfNeeded("browserTabs") path without clicking .side-panel-tab (no UI).
 *
 * ## BLOCK_9
 *
 * - --- Composition: composed_with [IMPL-SIDE_PANEL_BOOKMARK] [IMPL-SIDE_PANEL_TAGS_TREE] --- How: Ordering: runInitialTabInit may await initBookmarkTab before By Tag so controller exists for getTagsTreeInitOptions. Shared DATA: popupComponents.controller (currentPin, normalizeTags) for both This Page and By Tag sync. Collision: bindTabChangeRefresh refreshPopupData and bindWindowFocusRecentTagsRefresh loadRecentTags can run close together — both read currentPin; safe (idempotent UI updates). Cross-IMPL: loadRecentTags matches  message path to  / .
 * - Contract:
 *   - INPUT: panel page load; user click on tab ("This Page", "By Tag", or "Tabs")
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: one panel visible; This Page, By Tag, or browser Tabs content shown; selected tab persisted
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: activeTab ("bookmark" | "tagsTree" | "browserTabs"), bookmarkTabInited (boolean), tagsTreeTabInited (boolean), browserTabsTabInited (boolean), storage key hoverboard_sidepanel_active_tab. TAB_BROWSER_TABS = "browserTabs"; TAB_IDS includes browserTabs.
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: BLOCK_9
 *
 * === END IMPL-FULL-BLOCK: IMPL-SIDE_PANEL_TABS ===
 */
export const SIDE_PANEL_TAB_STORAGE_KEY = 'hoverboard_sidepanel_active_tab'

/** @type {string} */
export const TAB_BOOKMARK = 'bookmark'
/** @type {string} */
export const TAB_TAGS_TREE = 'tagsTree'
/** @type {string} [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] */
export const TAB_BROWSER_TABS = 'browserTabs'
/** @type {string} [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS] */
export const TAB_BROWSER_BOOKMARKS = 'browserBookmarks'
/** @type {string} [REQ-BOOKMARK_USAGE_TRACKING] [ARCH-BOOKMARK_USAGE_TRACKING_UI] [IMPL-BOOKMARK_USAGE_TRACKING_UI] */
export const TAB_USAGE = 'usage'

/** @type {string[]} */
export const TAB_IDS = [TAB_BOOKMARK, TAB_TAGS_TREE, TAB_BROWSER_TABS, TAB_BROWSER_BOOKMARKS, TAB_USAGE]

/**
 * Default tab when none persisted.
 * [IMPL-SIDE_PANEL_TABS] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT]
 * @returns {string}
 */
export function getDefaultTab () {
  return TAB_BOOKMARK
}

/**
 * Returns which panel(s) should be visible for the given activeTab.
 * [IMPL-SIDE_PANEL_TABS] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT]
 * @param {string} activeTab
 * @returns {{ bookmarkVisible: boolean, tagsTreeVisible: boolean, browserTabsVisible: boolean, browserBookmarksVisible: boolean }}
 */
export function getVisibilityForTab (activeTab) {
  return {
    bookmarkVisible: activeTab === TAB_BOOKMARK,
    tagsTreeVisible: activeTab === TAB_TAGS_TREE,
    browserTabsVisible: activeTab === TAB_BROWSER_TABS,
    browserBookmarksVisible: activeTab === TAB_BROWSER_BOOKMARKS,
    usageVisible: activeTab === TAB_USAGE
  }
}

/**
 * [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_BOOKMARK] [IMPL-SIDE_PANEL_TABS]
 * Whether switching to the given tab should trigger a Bookmark-tab refresh (so content reflects current browser tab).
 * True when switching to Bookmark tab and it was already inited; used by switchTab to call controller.refreshPopupData().
 * @param {string} tabId
 * @param {boolean} wasBookmarkInited
 * @returns {boolean}
 */
export function shouldRefreshBookmarkTabWhenSwitching (tabId, wasBookmarkInited) {
  return tabId === TAB_BOOKMARK && wasBookmarkInited
}

/**
 * [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_BOOKMARK] [IMPL-SIDE_PANEL_TABS]
 * Whether the Bookmark tab should refresh when the browser tab changes (onActivated/onUpdated). True when Bookmark tab is visible and controller exists; used by refreshBookmarkTabIfVisible (prompt refresh like badge).
 * @param {string} activeTab
 * @param {boolean} hasController
 * @returns {boolean}
 */
export function shouldRefreshBookmarkTabOnTabChange (activeTab, hasController) {
  return activeTab === TAB_BOOKMARK && !!hasController
}

/**
 * [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [ARCH-SIDE_PANEL_TABS] [IMPL-SIDE_PANEL_TABS] [IMPL-SIDE_PANEL_TAGS_TREE]
 * Whether the Tags tree tab should refresh when the browser tab changes (onActivated/onUpdated). True when Tags tree tab is visible and inited; used by refreshTagsTreeTabIfVisible so tag selector and tree reflect current tab's bookmark (like Bookmark tab).
 * @param {string} activeTab
 * @param {boolean} tagsTreeTabInited
 * @returns {boolean}
 */
export function shouldRefreshTagsTreeTabOnTabChange (activeTab, tagsTreeTabInited) {
  return activeTab === TAB_TAGS_TREE && !!tagsTreeTabInited
}

/**
 * [IMPL-SIDE_PANEL_TABS] [ARCH-SIDE_PANEL_TABS] [ARCH-TAG_SYSTEM] [REQ-RECENT_TAGS_SYSTEM]
 * Sync guards for bindWindowFocusRecentTagsRefresh before controller.loadRecentTags(): mirrors pseudo IF branches
 * (windows API present, activeTab === bookmark, controller initialized, not loading). Window-id match stays in side-panel.js callback.
 * @param {{ hasWindowsApi: boolean, activeTab: string, isInitialized: boolean, isLoading: boolean }} o
 * @returns {boolean} true when loadRecentTags should be invoked (subject to async getCurrent checks)
 */
export function shouldInvokeLoadRecentTagsOnWindowFocusSync (o) {
  const { hasWindowsApi, activeTab, isInitialized, isLoading } = o
  return !!(
    hasWindowsApi &&
    activeTab === TAB_BOOKMARK &&
    isInitialized &&
    !isLoading
  )
}

/**
 * [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [ARCH-SIDE_PANEL_TABS] [IMPL-SIDE_PANEL_TABS] [IMPL-SIDE_PANEL_TAGS_TREE]
 * Returns options for initTagsTreeTab so the Tags tree tab displays the current URL's DB record (tag selector and tree reflect current bookmark tags). Pure helper; used on panel load when restored tab is Tags tree and when switching to Tags tree in switchTab.
 * @param {{ currentPin?: { tags?: string|string[] }, normalizeTags: (t: *) => string[] } | null | undefined} controller - PopupController-like object with currentPin and normalizeTags
 * @returns {{ currentBookmarkTags: string[] }}
 */
export function getTagsTreeInitOptions (controller) {
  if (!controller) return { currentBookmarkTags: [] }
  const raw = controller.normalizeTags(controller.currentPin?.tags) || []
  return { currentBookmarkTags: Array.isArray(raw) ? raw : [] }
}
