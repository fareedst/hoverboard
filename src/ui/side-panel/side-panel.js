/**
 * [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [ARCH-SIDE_PANEL_TABS] [IMPL-SIDE_PANEL_TABS]
 * Side panel entry: tab bar, Bookmark panel (popup-equivalent), Tags tree panel; tab switch and persist; init Bookmark and Tags tree tabs on first select.
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
 * === IMPL-FULL-BLOCK: IMPL-POPUP_PANEL_KEYBOARD_QUICK_ACCESS ===
 * [IMPL-POPUP_PANEL_KEYBOARD_QUICK_ACCESS] [ARCH-QUICK_ACCESS_ENTRY] [REQ-QUICK_ACCESS_ENTRY] — This block defines in-popup and in-panel keyboard shortcuts. Implements REQ "keyboard shortcuts when popup or side panel has focus"; implements ARCH by reusing UI event flow (emit → PopupController handlers).
 *
 * ## MAIN
 *
 * - [REQ-QUICK_ACCESS_ENTRY] [ARCH-QUICK_ACCESS_ENTRY] [IMPL-POPUP_PANEL_KEYBOARD_QUICK_ACCESS] How: KeyboardManager shortcuts: add four entries so handleKeyDown finds handler and calls emit; PopupController already listens for openTagsTree, openOptions, openBookmarksIndex, openBrowserBookmarkImport. Implements REQ "in-popup/panel shortcuts". Side panel Bookmark tab: enable keyboard and setup so panel has same shortcuts. Implements REQ "when popup or side panel has focus".
 * - Contract:
 *   - INPUT: user focuses popup or side panel Bookmark tab; user presses Ctrl+Shift+B/O/M/I
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: same as footer button click (side panel opens, options opens, bookmarks index tab, or import tab)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: MAIN
 *   - 1. KeyboardManager constructor shortcuts:
 *   - 2.   "Ctrl+Shift+KeyB": () => this.uiManager.emit('openTagsTree')
 *   - 3.   "Ctrl+Shift+KeyO": () => this.uiManager.emit('openOptions')
 *   - 4.   "Ctrl+Shift+KeyM": () => this.uiManager.emit('openBookmarksIndex')
 *   - 5.   "Ctrl+Shift+KeyI": () => this.uiManager.emit('openBrowserBookmarkImport')
 *   - 6. initBookmarkTab() (side-panel.js):
 *   - 7.   popupComponents = popup({ ..., enableKeyboard: true, ... })
 *   - 8.   ...
 *   - 9.   popupComponents.uiManager.setupEventListeners()
 *   - 10.   IF popupComponents.keyboardManager THEN popupComponents.keyboardManager.setupKeyboardNavigation()
 *
 * === END IMPL-FULL-BLOCK: IMPL-POPUP_PANEL_KEYBOARD_QUICK_ACCESS ===
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
/**
 * === IMPL-FULL-BLOCK: IMPL-SIDE_PANEL_SNAPSHOT ===
 * [IMPL-SIDE_PANEL_SNAPSHOT] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [REQ-SIDE_PANEL_TAGS_TREE] — This block defines the side panel snapshot helper: one function returning bookmarkTab and tagsTreeTab shapes. Implements REQ-UI_INSPECTION by providing E2E-inspectable state for side panel; REQ-SIDE_PANEL_POPUP_EQUIVALENT (Bookmark tab) and REQ-SIDE_PANEL_TAGS_TREE (Tags tree tab) by capturing key elements per tab.
 *
 * ## MAIN
 *
 * - [REQ-UI_INSPECTION] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_SNAPSHOT] [IMPL-SIDE_PANEL_BOOKMARK] How: Bookmark tab snapshot: root #bookmarkPanel; query by data-popup-ref for loadingState, errorState, mainInterface; derive visibility and screen. Implements "E2E can capture Bookmark tab state" and "Bookmark tab = popup-equivalent inspectable". Tags tree tab snapshot: root #tagsTreePanel; presence of #tagSelector, #treeContainer, #searchInput, #configToggle, etc. Implements "E2E can capture Tags tree tab state" and "Tags tree tab structure inspectable". browserTabsTab snapshot: root #browserTabsPanel; presence of filter input, Copy button, Close button, list container. Implements E2E-inspectable state for Tabs tab. browserBookmarksTab snapshot: root #browserBookmarksPanel; presence of search input, folder select, sort select, list container, Select all, Undo bar, Import folder select, Export HTML/CSV buttons. Implements E2E-inspectable state for Bookmarks tab.
 * - Contract:
 *   - INPUT: page (Playwright/Puppeteer page navigated to side-panel.html)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: { bookmarkTab: {...}, tagsTreeTab: {...}, browserTabsTab: {...}, browserBookmarksTab: { panelPresent, hasSearchInput?, hasFolderSelect?, hasSortSelect?, hasListContainer?, hasSelectAllBtn?, hasUndoBar?, hasImportFolderSelect?, hasExportHtmlBtn?, hasExportCsvBtn? } } | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: document in page context
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: MAIN
 *   - 1. bookmarkTab = (function () {
 *   - 2.   const root = document.getElementById('bookmarkPanel')
 *   - 3.   if (!root) return { panelPresent: false }
 *   - 4.   const loading = root.querySelector('[data-popup-ref="loadingState"]')
 *   - 5.   const error = root.querySelector('[data-popup-ref="errorState"]')
 *   - 6.   const main = root.querySelector('[data-popup-ref="mainInterface"]')
 *   - 7.   const loadingVisible = loading && !loading.classList.contains('hidden')
 *   - 8.   const errorVisible = error && !error.classList.contains('hidden')
 *   - 9.   const mainVisible = main && !main.classList.contains('hidden')
 *   - 10.   let screen = 'unknown'
 *   - 11.   if (loadingVisible) screen = 'loading'
 *   - 12.   else if (errorVisible) screen = 'error'
 *   - 13.   else if (mainVisible) screen = 'mainInterface'
 *   - 14.   const errorMsg = root.querySelector('[data-popup-ref="errorMessage"]')
 *   - 15.   return { panelPresent: true, screen, loadingVisible, errorVisible, mainVisible, errorMessage: errorMsg ? errorMsg.textContent : undefined }
 *   - 16. })()
 *   - 17. tagsTreeTab = (function () {
 *   - 18.   const root = document.getElementById('tagsTreePanel')
 *   - 19.   if (!root) return { panelPresent: false }
 *   - 20.   return {
 *   - 21.     panelPresent: true,
 *   - 22.     hasTagSelector: !!root.querySelector('#tagSelector') || !!document.getElementById('tagSelector'),
 *   - 23.     hasTreeContainer: !!root.querySelector('#treeContainer') || !!document.getElementById('treeContainer'),
 *   - 24.     hasSearchInput: !!root.querySelector('#searchInput') || !!document.getElementById('searchInput'),
 *   - 25.     hasConfigToggle: !!root.querySelector('#configToggle') || !!document.getElementById('configToggle'),
 *   - 26.     hasSearchCount: !!root.querySelector('#searchCount') || !!document.getElementById('searchCount'),
 *   - 27.     hasEmptyState: !!root.querySelector('#emptyState') || !!document.getElementById('emptyState'),
 *   - 28.     hasLoadError: !!root.querySelector('#loadError') || !!document.getElementById('loadError')
 *   - 29.   }
 *   - 30. })()
 *   - 31. browserTabsTab = (function () {
 *   - 32.   const root = document.getElementById('browserTabsPanel')
 *   - 33.   if (!root) return { panelPresent: false }
 *   - 34.   return {
 *   - 35.     panelPresent: true,
 *   - 36.     hasFilterInput: !!root.querySelector('#browserTabsFilterInput') || !!document.getElementById('browserTabsFilterInput'),
 *   - 37.     hasCopyButton: !!root.querySelector('[data-action="copyUrls"]') || !!root.querySelector('#browserTabsCopyBtn'),
 *   - 38.     hasCloseButton: !!root.querySelector('[data-action="closeTabs"]') || !!root.querySelector('#browserTabsCloseBtn'),
 *   - 39.     hasListContainer: !!root.querySelector('#browserTabsList') || !!root.querySelector('.browser-tabs-list')
 *   - 40.   }
 *   - 41. })()
 *   - 42. browserBookmarksTab = (function () {
 *   - 43.   const root = document.getElementById('browserBookmarksPanel')
 *   - 44.   if (!root) return { panelPresent: false }
 *   - 45.   const byId = (id) => document.getElementById(id)
 *   - 46.   return {
 *   - 47.     panelPresent: true,
 *   - 48.     hasSearchInput: !!byId('browserBookmarksSearchInput'),
 *   - 49.     hasFolderSelect: !!byId('browserBookmarksFolderSelect'),
 *   - 50.     hasSortSelect: !!byId('browserBookmarksSortSelect'),
 *   - 51.     hasListContainer: !!byId('browserBookmarksList'),
 *   - 52.     hasSelectAllBtn: !!byId('browserBookmarksSelectAllBtn'),
 *   - 53.     hasUndoBar: !!byId('browserBookmarksUndoBar'),
 *   - 54.     hasImportFolderSelect: !!byId('browserBookmarksImportFolderSelect'),
 *   - 55.     hasExportHtmlBtn: !!byId('browserBookmarksExportHtmlBtn'),
 *   - 56.     hasExportCsvBtn: !!byId('browserBookmarksExportCsvBtn')
 *   - 57.   }
 *   - 58. })()
 *   - 59. RETURN { bookmarkTab, tagsTreeTab, browserTabsTab, browserBookmarksTab }
 *
 * === END IMPL-FULL-BLOCK: IMPL-SIDE_PANEL_SNAPSHOT ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-DEMO_OVERLAY ===
 * [IMPL-DEMO_OVERLAY] [PROC-DEMO_RECORDING] [REQ-SIDE_PANEL_BROWSER_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [REQ-SIDE_PANEL_TAGS_TREE] — Demo overlay: DOM inject in side-panel page before key-frame groups; position top; larger font; five text classes with colors. Used by record-demo-side-panel-tabs.js, record-demo-side-panel-this-page.js, record-demo-side-panel-by-tag.js.
 *
 * ## SET_OVERLAY
 *
 * - [IMPL-DEMO_OVERLAY] [PROC-DEMO_RECORDING] [REQ-SIDE_PANEL_BROWSER_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [REQ-SIDE_PANEL_TAGS_TREE] How: Implements setOverlay(action, achievement, textClass) behavior for IMPL-DEMO_OVERLAY.
 * - Contract:
 *   - INPUT: context / caller args
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: result
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - EFFECTS: State
 *   - TERMINATION: total
 * - PROCEDURE: SET_OVERLAY
 *   - el = getElementById('__demo_overlay__') or create and append div#__demo_overlay__
 *   - base style: position fixed; top 0; left 0; right 0; background rgba(0,0,0,0.72); font-size 18px; font-family system-ui; z-index max; pointer-events none
 *   - color = OVERLAY_CLASSES[textClass].color  // intro #e0e0e0, navigation #42a5f5, state #ffa726, action #26c6da, result #66bb6a
 *   - el.innerHTML = <strong style="color">action</strong><br><span style="opacity 0.8; color">achievement</span>
 *   - 1. removeOverlay(): remove #__demo_overlay__ if present
 *
 * ## BLOCK_2
 *
 * - [IMPL-DEMO_OVERLAY] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_BOOKMARK] Bookmark demo element highlight: scope to #bookmarkPanel so only This Page tab content is highlighted. How: Block Start: After panel ready (mainInterface visible), removeOverlay(), wait 1000*RATE ms, snap (frame 0 = useful static image). No overlay before frame 0. Implements demo_gif_standard timing. Block Overlay steps: clearHighlight; setOverlay (header rgba 0.78); highlightElement scoped to #bookmarkPanel; per-step wait*RATE and snap. RATE=1.25; overlay descriptions 30-50% longer. Implements demo_gif_standard overlay and step order above. Block End: After step 11 (Result), clearHighlight(), removeOverlay(), wait 500*RATE, inject full-screen Hoverboard icon centered, snap (frame N-1); GIF end segment 0.5s. Implements demo_gif_standard interstitial. Block GIF build: 3-part concat (nooverlay from frame 0 duration 1s, main from frames 1..N-2 at 1fps, end from frame N-1 duration 0.5s); concat filter + re-encode; no -c copy. Implements demo_gif_standard gif_build. By Tag demo (record-demo-side-panel-by-tag.js): load side panel with ?demo=1 (loadPlaceholderForScreenshot, tagsTreePlaceholderBookmarks); tag toggles update the tree. Element highlight scoped to #tagsTreePanel so only By Tag tab content is highlighted. Block: highlightElement(selector, panelId) with panelId 'browserTabsPanel' or null (document for tab bar). Every step has clearHighlight then highlightElement: 1-3 .side-panel-tabs / .side-panel-tab[data-tab="browserTabs"] (null); 4-12 #browserTabsList, #browserTabsListDisplayTitle, #browserTabsListDisplayBlock, #browserTabsFilterInput, [data-action="removeFromDisplay"], #browserTabsRefreshBtn, #browserTabsCopyRecordsBtn, #browserTabsCopyBtn (browserTabsPanel). Block: Start. Optional: persist hoverboard_sidepanel_active_tab = 'browserTabs' before opening so frame 0 shows Tabs tab. After opening panel: removeOverlay(), wait 1000*RATE ms, snap (frame 0 = useful static image). Then overlay steps from step 1 (frames 1..N-2). Block: setOverlay uses background rgba(0,0,0,0.78). RATE=1.25; overlay descriptions 30-50% longer. Block: Interstitial at end. After step 12: clearHighlight(), removeOverlay(), wait 500*RATE, inject full-screen Hoverboard icon, snap (frame N-1); GIF end segment 0.5s. Block: GIF build 3-part. (1) No-overlay from frame 0, duration 1 s. (2) Main from frames 1..N-2, 1 fps. (3) End from frame N-1, duration 0.5 s. Concat filter + re-encode; no -c copy. Block: Start with Bookmarks tab visible. Persist chrome.storage.local[hoverboard_sidepanel_active_tab] = 'browserBookmarks' in seed step before opening side-panel.html. No overlay for 1 s at start: removeOverlay(), wait 1000*RATE ms, snap (frame 0 = useful static image). Then overlay steps from "Viewing the Bookmarks tab" (frames 1..N-2). Block: Overlay header slightly more opaque. setOverlay uses background rgba(0,0,0,0.78). RATE=1.25; descriptions 30-50% longer. Block: Interstitial logo once, at end. After click URL step, wait 0.5s (rate-adjusted), then inject full-screen overlay with Hoverboard icon centered; snap (frame N-1); GIF end segment 0.5s. Acts as interstitial between replays when GIF loops. Block: GIF build 3-part concat. (1) No-overlay GIF from frame 0, duration 1 s. (2) Main GIF from frames 1..N-2 (image2 -start_number 1, -frames:v totalFrames-2), 1 fps. (3) End GIF from frame N-1, duration 0.5 s. Concat nooverlay + main + end. highlightElement scoped to #browserBookmarksPanel. Block: Start with Usage tab visible. Persist chrome.storage.local[hoverboard_sidepanel_active_tab] = 'usage' in seed step (with usage/edges placeholder data) before opening side-panel.html. No overlay for 1 s at start: removeOverlay(), wait 1000*RATE ms, snap (frame 0 = useful static image). Then overlay steps from "Viewing the Usage tab" (frames 1..N-2). Block: Overlay header rgba(0,0,0,0.78). RATE=1.25; descriptions 30-50% longer. highlightElement/clearHighlight scoped to #usagePanel (panel = getElementById('usagePanel'); el = panel.querySelector(selector)). Block: Step order: (1) Viewing Usage tab (intro), (2) Most Visited section (state), (3) Recently Visited section (state), (4) Refresh button (action), (5) Navigation Graph section (navigation). clearHighlight before each highlight; per-step snap with wait*RATE. Block: Interstitial at end. After last content step: clearHighlight(), removeOverlay(), wait 500*RATE, inject full-screen Hoverboard icon, snap (frame N-1); GIF end segment 0.5s. GIF build 3-part concat (nooverlay 1s, main 1fps, end 0.5s).
 * - Contract:
 *   - INPUT: context / caller args
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: result
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: BLOCK_2
 *   - 1. highlightElement(selector): panel = getElementById('bookmarkPanel'); el = panel.querySelector(selector); clear any existing data-demo-highlight; set el.outline and el.boxShadow to 3px solid #42a5f5 and glow; set data-demo-highlight=1 on el
 *   - 2. clearHighlight(): find element with data-demo-highlight="1"; clear outline and boxShadow; remove data-demo-highlight
 *   - 3. highlightElement(selector) for By Tag: panel = getElementById('tagsTreePanel'); el = panel.querySelector(selector); clear existing data-demo-highlight; set el.outline and el.boxShadow (3px solid #42a5f5, glow); set data-demo-highlight=1 on el. clearHighlight() same as Bookmark demo.
 *   - How (sub-block): Block Start: Persist chrome.storage.local[hoverboard_sidepanel_active_tab] = 'tagsTree' in seed step (e.g. options.html evaluate); open side-panel.html?demo=1; wait for #tagsTreePanel visible; removeOverlay(); wait 1000*RATE ms; snap (frame 0 = useful static image, By Tag tab visible). Implements demo_gif_standard timing.
 *   - How (sub-block): Step order: (1) By Tag loaded (overlay), (2) Filtering by tag — clearHighlight; setOverlay("Filtering by tag", "Only bookmarks that have at least one selected tag are shown in the tree.", state); highlightElement('.tag-selector-section'); snap; select tag(s) if hasTags. (3) Tree updated — clearHighlight; setOverlay("Tree updated", "Bookmarks under selected tags", state); highlightElement('#treeContainer'); snap. (4) Search bookmarks and # matches — clearHighlight; setOverlay("Search bookmarks", ...); highlightElement('#searchInput'); fill('example'); clearHighlight; setOverlay("Match count", ...); highlightElement('#searchCount'); snap. (5) Click URL — clearHighlight; highlightElement('.tree-bookmark-link'); setOverlay("Opening URL", "Opens in new tab", result); click first link; extra beat before end card.
 *   - How (sub-block): Block End: After last content step (Click URL): clearHighlight(); removeOverlay(); wait 500*RATE; inject full-screen Hoverboard icon centered (__demo_end_card__); snap (frame N-1); GIF end segment 0.5s. Implements demo_gif_standard interstitial.
 *   - How (sub-block): Block GIF build: 3-part concat (nooverlay from frame 0 duration 1s, main from frames 1..N-2 at 1fps, end from frame N-1 duration 0.5s); concat filter + re-encode; no -c copy. Implements demo_gif_standard gif_build.
 *   - How (sub-block): Step-to-class mapping (12 steps): 1,2 intro; 3,4 navigation; 5,6,8 state; 7,9,11 action; 10,12 result.
 *
 * === END IMPL-FULL-BLOCK: IMPL-DEMO_OVERLAY ===
 */
import { MESSAGE_TYPES } from '../../core/message-handler.js'
import {
  SIDE_PANEL_TAB_STORAGE_KEY,
  TAB_BOOKMARK,
  TAB_TAGS_TREE,
  TAB_BROWSER_TABS,
  TAB_BROWSER_BOOKMARKS,
  TAB_USAGE,
  getDefaultTab,
  getVisibilityForTab,
  getTagsTreeInitOptions,
  shouldRefreshBookmarkTabWhenSwitching,
  shouldRefreshBookmarkTabOnTabChange,
  shouldRefreshTagsTreeTabOnTabChange,
  shouldInvokeLoadRecentTagsOnWindowFocusSync
} from './side-panel-tab-state.js'
import { BUILD_TIME_UTC } from './build-info.js'
import { initTagsTreeTab, setSelectedTagsFromCurrentBookmark } from './tags-tree.js'
import { initBrowserTabsTab } from './browser-tabs-panel.js'
import { initBrowserBookmarksTab } from './browser-bookmarks-panel.js'
import { initUsageTab } from './usage-panel.js'
import { init, popup } from '../index.js'
import { ErrorHandler } from '../../shared/ErrorHandler.js'
import { recordAction } from '../../shared/ui-inspector.js'
import { ConfigManager } from '../../config/config-manager.js'

const bookmarkPanelEl = document.getElementById('bookmarkPanel')
const tagsTreePanelEl = document.getElementById('tagsTreePanel')
const browserTabsPanelEl = document.getElementById('browserTabsPanel')
const browserBookmarksPanelEl = document.getElementById('browserBookmarksPanel')
const usagePanelEl = document.getElementById('usagePanel')
const tabButtons = document.querySelectorAll('.side-panel-tab[data-tab]')

let activeTab = getDefaultTab()
let bookmarkTabInited = false
let tagsTreeTabInited = false
let browserTabsTabInited = false
let browserBookmarksTabInited = false
let usageTabInited = false
/** @type {{ controller: import('../popup/PopupController.js').PopupController, uiManager: import('../popup/UIManager.js').UIManager } | null} */
let popupComponents = null
// [REQ-ICON_CLICK_BEHAVIOR] [IMPL-ICON_CLICK_BEHAVIOR] Time when panel script ran; used to avoid closing on first open (toggle only if open > threshold).
const _sidePanelLoadTime = Date.now()

/**
 * [IMPL-SIDE_PANEL_TABS] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT]
 * Show the panel for activeTab and hide the other; update tab aria-selected.
 */
function showPanel () {
  const { bookmarkVisible, tagsTreeVisible, browserTabsVisible, browserBookmarksVisible, usageVisible } = getVisibilityForTab(activeTab)
  if (bookmarkPanelEl) {
    bookmarkPanelEl.hidden = !bookmarkVisible
  }
  if (tagsTreePanelEl) {
    tagsTreePanelEl.hidden = !tagsTreeVisible
  }
  if (browserTabsPanelEl) {
    browserTabsPanelEl.hidden = !browserTabsVisible
  }
  if (browserBookmarksPanelEl) {
    browserBookmarksPanelEl.hidden = !browserBookmarksVisible
  }
  if (usagePanelEl) {
    usagePanelEl.hidden = !usageVisible
  }
  tabButtons.forEach((btn) => {
    const tab = btn.getAttribute('data-tab')
    btn.setAttribute('aria-selected', tab === activeTab ? 'true' : 'false')
  })
}

/**
 * [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_BOOKMARK] [IMPL-SIDE_PANEL_TABS]
 * Refresh Bookmark tab when it is visible and inited so content reflects current browser tab (like badge). No-op otherwise.
 */
function refreshBookmarkTabIfVisible () {
  if (!shouldRefreshBookmarkTabOnTabChange(activeTab, popupComponents?.controller)) return
  popupComponents.controller.refreshPopupData()
}

/**
 * [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [ARCH-SIDE_PANEL_TABS] [IMPL-SIDE_PANEL_TABS] [IMPL-SIDE_PANEL_TAGS_TREE]
 * Refresh Tags tree tab when it is visible and inited so tag selector and tree reflect current tab's bookmark (like Bookmark tab). No-op otherwise. Call after controller has been refreshed (refreshPopupData).
 */
function refreshTagsTreeTabIfVisible () {
  if (!shouldRefreshTagsTreeTabOnTabChange(activeTab, tagsTreeTabInited)) return
  const tags = popupComponents?.controller
    ? (popupComponents.controller.normalizeTags(popupComponents.controller.currentPin?.tags) || [])
    : []
  setSelectedTagsFromCurrentBookmark(Array.isArray(tags) ? tags : [])
}

/**
 * [IMPL-SIDE_PANEL_TABS] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT]
 * Persist active tab and show panel; init tab if not yet inited. When switching to Bookmark tab
 * and it was already inited, refresh so content reflects current tab's bookmark (like badge).
 * When switching to Tags tree tab, pass current bookmark tags so tag selector and tree show only bookmarks that share at least one tag.
 */
function switchTab (tabId) {
  const wasBookmarkInited = bookmarkTabInited
  activeTab = tabId
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({ [SIDE_PANEL_TAB_STORAGE_KEY]: tabId })
  }
  showPanel()
  if (tabId === TAB_TAGS_TREE) {
    const opts = getTagsTreeInitOptions(popupComponents?.controller)
    const tagsArray = Array.isArray(opts.currentBookmarkTags) ? opts.currentBookmarkTags : []
    const wasTagsTreeInited = tagsTreeTabInited
    initTabIfNeeded(tabId, { currentBookmarkTags: tagsArray })
    if (wasTagsTreeInited) setSelectedTagsFromCurrentBookmark(tagsArray)
  } else if (tabId === TAB_BROWSER_TABS) {
    initTabIfNeeded(tabId)
  } else if (tabId === TAB_BROWSER_BOOKMARKS) {
    initTabIfNeeded(tabId)
  } else {
    initTabIfNeeded(tabId)
  }
  if (shouldRefreshBookmarkTabWhenSwitching(tabId, wasBookmarkInited) && popupComponents?.controller) {
    popupComponents.controller.refreshPopupData()
  }
}

/**
 * [IMPL-SIDE_PANEL_TABS] [IMPL-SIDE_PANEL_BOOKMARK] [IMPL-UIManager_SCOPED_ROOT]
 * Init Bookmark tab: UISystem init, createPopup(container), loadInitialData, setupEventListeners; wire openTagsTree to switch to Tags tree tab.
 */
async function initBookmarkTab () {
  if (bookmarkTabInited || !bookmarkPanelEl) return
  bookmarkTabInited = true
  const errorHandler = new ErrorHandler()
  const configManager = new ConfigManager()
  const config = await configManager.getConfig()
  await init({ enableThemes: true, enableIcons: true, enableAssets: true, preloadCriticalAssets: true })
  // [REQ-QUICK_ACCESS_ENTRY] [ARCH-QUICK_ACCESS_ENTRY] [IMPL-POPUP_PANEL_KEYBOARD_QUICK_ACCESS] Enable keyboard so same shortcuts work in side panel Bookmark tab
  popupComponents = popup({
    container: bookmarkPanelEl,
    errorHandler,
    config,
    enableKeyboard: true,
    enableState: true,
    onOpenTagsTreeInPanel: () => switchTab(TAB_TAGS_TREE)
  })
  if (popupComponents.controller) {
    await popupComponents.controller.loadInitialData()
  }
  if (popupComponents.uiManager) {
    popupComponents.uiManager.setupEventListeners()
  }
  if (popupComponents.keyboardManager) {
    popupComponents.keyboardManager.setupKeyboardNavigation()
  }
}

/**
 * [IMPL-SIDE_PANEL_TABS] [IMPL-SIDE_PANEL_TAGS_TREE] [REQ-SIDE_PANEL_POPUP_EQUIVALENT]
 * Init Tags tree tab: call initTagsTreeTab(options) from tags-tree.js (load bookmarks, render). Optional currentBookmarkTags syncs tag selector to current bookmark.
 */
function initTagsTreeTabIfNeeded (options = {}) {
  if (tagsTreeTabInited) return
  tagsTreeTabInited = true
  initTagsTreeTab(options)
}

function initTabIfNeeded (tabId, options = {}) {
  if (tabId === TAB_BOOKMARK) {
    initBookmarkTab()
  } else if (tabId === TAB_TAGS_TREE) {
    initTagsTreeTabIfNeeded(options)
  } else if (tabId === TAB_BROWSER_TABS) {
    initBrowserTabsTabIfNeeded()
  } else if (tabId === TAB_BROWSER_BOOKMARKS) {
    initBrowserBookmarksTabIfNeeded()
  } else if (tabId === TAB_USAGE) {
    initUsageTabIfNeeded()
  }
}

/**
 * [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [ARCH-SIDE_PANEL_BROWSER_BOOKMARKS] [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS]
 * Init Browser Bookmarks tab: call initBrowserBookmarksTab() once.
 */
function initBrowserBookmarksTabIfNeeded () {
  if (browserBookmarksTabInited) return
  browserBookmarksTabInited = true
  initBrowserBookmarksTab()
}

/**
 * [REQ-BOOKMARK_USAGE_TRACKING] [ARCH-BOOKMARK_USAGE_TRACKING_UI] [IMPL-BOOKMARK_USAGE_TRACKING_UI]
 * Init Usage tab: call initUsageTab() once with panel el and chrome.runtime.sendMessage.
 */
function initUsageTabIfNeeded () {
  if (usageTabInited || !usagePanelEl) return
  usageTabInited = true
  const sendMessage = (msg) => new Promise((resolve, reject) => {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage(msg, (res) => {
        if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message))
        else resolve(res || {})
      })
    } else {
      resolve({})
    }
  })
  initUsageTab({ panelEl: usagePanelEl, sendMessage })
}

/**
 * [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_TABS] [IMPL-SIDE_PANEL_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS]
 * Init Browser Tabs tab: call initBrowserTabsTab() once (load tabs, referrers, render, bind filter/copy/close).
 */
function initBrowserTabsTabIfNeeded () {
  if (browserTabsTabInited) return
  browserTabsTabInited = true
  initBrowserTabsTab()
}

function bindTabButtons () {
  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab')
      if (tab) switchTab(tab)
    })
  })
}

/**
 * [IMPL-SIDE_PANEL_TABS] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT]
 * Set side panel header: single line with left "Hoverboard v{version}" (or "Hoverboard") and right build time (UTC). Called on load; exported for tests.
 * @param {string} [version] - From getManifest().version when omitted we read from chrome.runtime.getManifest()
 * @param {string} [buildTimeUtc] - BUILD_TIME_UTC when omitted we use imported constant
 */
export function setSidePanelVersion (version, buildTimeUtc) {
  const rightEl = document.getElementById('side-panel-version')
  // [IMPL-SIDE_PANEL_TABS] No-op when #side-panel-version missing (e.g. tests); no throw.
  if (!rightEl) return
  const v = version ?? (typeof chrome !== 'undefined' && chrome.runtime?.getManifest?.()?.version) ?? ''
  const t = buildTimeUtc ?? BUILD_TIME_UTC
  const leftEl = document.getElementById('side-panel-title-version')
  if (leftEl) leftEl.textContent = v ? `Hoverboard v${v}` : 'Hoverboard'
  rightEl.textContent = t
}

/** [IMPL-SIDE_PANEL_TABS] Init header version and compile time on panel load. */
function initSidePanelVersion () {
  setSidePanelVersion()
}

async function loadPersistedTab () {
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) return getDefaultTab()
  return new Promise((resolve) => {
    chrome.storage.local.get([SIDE_PANEL_TAB_STORAGE_KEY], (o) => {
      const stored = o[SIDE_PANEL_TAB_STORAGE_KEY]
      resolve(stored === TAB_BOOKMARK || stored === TAB_TAGS_TREE || stored === TAB_BROWSER_TABS || stored === TAB_BROWSER_BOOKMARKS || stored === TAB_USAGE ? stored : getDefaultTab())
    })
  })
}

/**
 * [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [ARCH-SIDE_PANEL_TABS] [IMPL-SIDE_PANEL_TABS]
 * Register tab listeners so both tabs refresh for current tab when active browser tab changes or completes. Always refresh controller (refreshPopupData) when panel has controller; then refresh Bookmark tab UI when visible, and Tags tree tab (tag selector and tree) when visible.
 * Non-scriptable active tabs still refresh bookmark path; inject/suggested-tags skip via classifyScriptInjectionUrl.
 * Exported for Phase G composition tests (mirror bindWindowFocusRecentTagsRefresh).
 */
async function onTabChangeRefresh (source = 'onActivated') {
  if (!popupComponents?.controller) return
  const c = popupComponents.controller
  recordAction('tabChangeRefresh', { source, tabId: c.currentTab?.id }, 'side-panel')
  await c.refreshPopupData({ trigger: 'tabChange', surface: 'side-panel' })
  // Bookmark tab UI already updated by refreshPopupData(); refresh Tags tree when visible.
  refreshTagsTreeTabIfVisible()
}

export function bindTabChangeRefresh () {
  const tabsApi = typeof chrome !== 'undefined' && chrome.tabs ? chrome.tabs : null
  if (!tabsApi?.onActivated?.addListener || !tabsApi?.onUpdated?.addListener) return
  tabsApi.onActivated.addListener(() => {
    onTabChangeRefresh('onActivated')
  })
  tabsApi.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status !== 'complete' || !tab?.url) return
    tabsApi.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs?.[0]?.id === tabId) onTabChangeRefresh('onUpdated')
    })
  })
}

/**
 * [IMPL-SIDE_PANEL_TABS] [ARCH-SIDE_PANEL_TABS] [ARCH-TAG_SYSTEM] [REQ-RECENT_TAGS_SYSTEM] [IMPL-RECENT_TAGS_POPUP_REFRESH]
 * When this browser window gains focus, refresh Recent Tags (bindWindowFocusRecentTagsRefresh pseudo): after async window-id match,
 * uses shouldInvokeLoadRecentTagsOnWindowFocusSync for the same sync guards as unit tests, then controller.loadRecentTags() (shared path with popup refresh IMPL).
 * Exported for Phase G composition tests (trigger listener → getCurrent → loadRecentTags); production still calls this once from DOMContentLoaded.
 */
export function bindWindowFocusRecentTagsRefresh () {
  const winApi = typeof chrome !== 'undefined' && chrome.windows ? chrome.windows : null
  const hasWindowsApi = !!(winApi?.onFocusChanged?.addListener && winApi?.getCurrent)
  if (!hasWindowsApi) return
  winApi.onFocusChanged.addListener((windowId) => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) return
    winApi.getCurrent((w) => {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.lastError) return
      if (!w || w.id !== windowId) return
      const c = popupComponents?.controller
      if (!shouldInvokeLoadRecentTagsOnWindowFocusSync({
        hasWindowsApi,
        activeTab,
        isInitialized: !!c?.isInitialized,
        isLoading: !!c?.isLoading
      })) return
      c.loadRecentTags()
    })
  })
}

/**
 * [IMPL-EXTENSION_COMMANDS] [IMPL-SIDE_PANEL_TABS] When a tab-specific command runs (e.g. Ctrl+Shift+2), SW sets storage then opens panel.
 * If panel is already open, listen for storage change and switch to the requested tab.
 */
function bindStorageTabChange () {
  if (typeof chrome === 'undefined' || !chrome.storage?.onChanged?.addListener) return
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return
    const change = changes[SIDE_PANEL_TAB_STORAGE_KEY]
    if (!change?.newValue) return
    const tabId = change.newValue
    if (tabId !== TAB_BOOKMARK && tabId !== TAB_TAGS_TREE && tabId !== TAB_BROWSER_TABS && tabId !== TAB_BROWSER_BOOKMARKS && tabId !== TAB_USAGE) return
    if (tabId === activeTab) return
    switchTab(tabId)
  })
}

/** [REQ-ICON_CLICK_BEHAVIOR] [IMPL-ICON_CLICK_BEHAVIOR] Decide whether to close on REQUEST_SIDE_PANEL_CLOSE (visible and open long enough). Exported for unit tests. */
export function shouldClosePanelOnToggleMessage (message, opts = {}) {
  const visibilityState = opts.visibilityState ?? document.visibilityState
  const now = opts.now ?? Date.now()
  const loadTime = opts.loadTime ?? _sidePanelLoadTime
  const TOGGLE_MIN_OPEN_MS = 300
  if (message?.type !== MESSAGE_TYPES.REQUEST_SIDE_PANEL_CLOSE) return false
  if (visibilityState !== 'visible') return false
  if (now - loadTime < TOGGLE_MIN_OPEN_MS) return false
  return true
}

/** [REQ-ICON_CLICK_BEHAVIOR] [IMPL-ICON_CLICK_BEHAVIOR] On REQUEST_SIDE_PANEL_CLOSE from SW: close panel if visible and open long enough (toggle). */
function bindToggleCloseRequest () {
  if (typeof chrome === 'undefined' || !chrome.runtime?.onMessage?.addListener) return
  chrome.runtime.onMessage.addListener((message) => {
    if (!shouldClosePanelOnToggleMessage(message)) return
    if (typeof window.close === 'function') window.close()
  })
}

/**
 * [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [ARCH-SIDE_PANEL_TABS] [IMPL-SIDE_PANEL_TABS] [IMPL-SIDE_PANEL_TAGS_TREE]
 * On panel load: when restored tab is Tags tree, init Bookmark tab first so controller and current-tab data exist, then init Tags tree with currentBookmarkTags so it displays current URL's DB record. Exported for unit tests.
 * @param {string} tabId - activeTab (TAB_BOOKMARK | TAB_TAGS_TREE)
 */
export async function runInitialTabInit (tabId) {
  if (tabId === TAB_TAGS_TREE) {
    await initBookmarkTab()
    initTabIfNeeded(tabId, getTagsTreeInitOptions(popupComponents?.controller))
  } else if (tabId === TAB_BROWSER_TABS) {
    initTabIfNeeded(tabId)
  } else if (tabId === TAB_BROWSER_BOOKMARKS) {
    initTabIfNeeded(tabId)
  } else {
    initTabIfNeeded(tabId)
  }
}

/**
 * Test-only hook to set popupComponents so runInitialTabInit can be tested with a fake controller.
 * [IMPL-SIDE_PANEL_TABS] Used only in unit tests to assert Tags tree init receives currentBookmarkTags when panel opens with Tags tree tab.
 * @param {{ controller?: { currentPin?: { tags?: string|string[] }, normalizeTags: (t: *) => string[] } } | null} components
 */
export function setPopupComponentsForTest (components) {
  popupComponents = components
}

/**
 * Test-only: set module `activeTab` so composition tests can drive bindWindowFocusRecentTagsRefresh guards without clicking the tab bar.
 * [IMPL-SIDE_PANEL_TABS] [ARCH-SIDE_PANEL_TABS] [REQ-RECENT_TAGS_SYSTEM]
 * @param {string} tabId - e.g. TAB_BOOKMARK from side-panel-tab-state
 */
export function setActiveTabForTest (tabId) {
  activeTab = tabId
}

/**
 * Test-only hook to reset tagsTreeTabInited so runInitialTabInit('tagsTree') can be tested multiple times.
 * [IMPL-SIDE_PANEL_TABS]
 */
export function resetTagsTreeTabInitedForTest () {
  tagsTreeTabInited = false
}

/**
 * [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_TABS] [IMPL-SIDE_PANEL_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS]
 * Phase G composition tests: drive internal switchTab(tabId) without tab-bar click (no UI). When tabId === TAB_BROWSER_TABS, invokes initTabIfNeeded → initBrowserTabsTabIfNeeded → initBrowserTabsTab().
 */
export function switchTabForTest (tabId) {
  switchTab(tabId)
}

/**
 * Test-only: reset browserTabsTabInited so runInitialTabInit(TAB_BROWSER_TABS) or switchTabForTest(TAB_BROWSER_TABS) can invoke initBrowserTabsTab again.
 * [IMPL-SIDE_PANEL_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS]
 */
export function resetBrowserTabsTabInitedForTest () {
  browserTabsTabInited = false
}

document.addEventListener('DOMContentLoaded', async () => {
  initSidePanelVersion()
  activeTab = await loadPersistedTab()
  showPanel()
  bindTabButtons()
  bindTabChangeRefresh()
  bindWindowFocusRecentTagsRefresh()
  bindStorageTabChange()
  bindToggleCloseRequest()
  await runInitialTabInit(activeTab)
})
