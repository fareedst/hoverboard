/**
 * === IMPL-FULL-BLOCK: IMPL-SIDE_PANEL_BOOKMARK_SEARCH ===
 * [IMPL-SIDE_PANEL_BOOKMARK_SEARCH] [ARCH-SIDE_PANEL_BOOKMARK_SEARCH] [REQ-SIDE_PANEL_BOOKMARK_SEARCH] — This block defines the search feature: pure filter plus panel UI. Implements REQ by providing search, count, and Next/Previous; implements ARCH by client-side filter and scroll/highlight.
 *
 * ## FILTER_BOOKMARKS_BY_SEARCH
 *
 * - [REQ-SIDE_PANEL_BOOKMARK_SEARCH] [ARCH-SIDE_PANEL_BOOKMARK_SEARCH] [IMPL-SIDE_PANEL_BOOKMARK_SEARCH] How: filterBookmarksBySearch: implements "search displayed list by text" by returning bookmarks where query (trimmed, case-insensitive) appears in description, url, tags (joined), or extended. Empty/whitespace query returns full list.
 * - Contract:
 *   - INPUT: context / caller args
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: result
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: FILTER_BOOKMARKS_BY_SEARCH
 *   - q = String(query).trim().toLowerCase()
 *   - IF q === '' RETURN bookmarks
 *   - RETURN bookmarks WHERE bookmarkMatches(b, q)
 *
 * ## BOOKMARK_MATCHES
 *
 * - [IMPL-SIDE_PANEL_BOOKMARK_SEARCH] [ARCH-SIDE_PANEL_BOOKMARK_SEARCH] [REQ-SIDE_PANEL_BOOKMARK_SEARCH] How: Implements bookmarkMatches(b, q) behavior for IMPL-SIDE_PANEL_BOOKMARK_SEARCH.
 * - Contract:
 *   - INPUT: context / caller args
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: result
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: BOOKMARK_MATCHES
 *   - title = (b.description ?? '').toLowerCase()
 *   - url = (b.url ?? '').toLowerCase()
 *   - tags = (b.tags ?? []).join(' ').toLowerCase()
 *   - extended = (b.extended ?? '').toLowerCase()
 *   - RETURN title.includes(q) OR url.includes(q) OR tags.includes(q) OR extended.includes(q)
 *
 * ## BLOCK_3
 *
 * - [REQ-SIDE_PANEL_BOOKMARK_SEARCH] [ARCH-SIDE_PANEL_BOOKMARK_SEARCH] [IMPL-SIDE_PANEL_BOOKMARK_SEARCH] How: Pipeline integration: after applyFilters and sortBookmarks, if searchQuery.trim() then matchingBookmarks = filterBookmarksBySearch(displayedBookmarks, searchQuery); else matchingBookmarks = displayedBookmarks. Build tagToBookmarks or grouped from matchingBookmarks. Implements "filter displayed list" and "count of matching records". Search UI: search input, count span, Previous/Next buttons. Implements "display count" and "advance to next/previous record". Render: each bookmark link gets data-search-index = flat index in display order so Nth match can be found. Implements "scroll and highlight" by finding element with data-search-index === searchMatchIndex, scrollIntoView, classList.add('search-current'); clear previous highlight.
 * - Contract:
 *   - INPUT: context / caller args
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: result
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: BLOCK_3
 *   - 1. ON refresh / load: displayedBookmarks = sortBookmarks(applyFilters(rawBookmarks, filterState), sortBy, sortAsc)
 *   - 2.   IF searchQuery.trim(): matchingBookmarks = filterBookmarksBySearch(displayedBookmarks, searchQuery)
 *   - 3.   ELSE: matchingBookmarks = displayedBookmarks
 *   - 4.   build tree/grouped from matchingBookmarks; display count = matchingBookmarks.length
 *   - 5. searchInput: on input/change set searchQuery; re-run pipeline; set searchMatchIndex = 0; update searchCount text ("N matches" or "No matches")
 *   - 6. searchCount: textContent = matchingBookmarks.length === 0 ? "No matches" : matchingBookmarks.length + " matches"
 *   - 7. searchPrev: searchMatchIndex = (searchMatchIndex - 1 + total) % total; scrollToMatch(searchMatchIndex); setHighlight(searchMatchIndex)
 *   - 8. searchNext: searchMatchIndex = (searchMatchIndex + 1) % total; scrollToMatch(searchMatchIndex); setHighlight(searchMatchIndex)
 *   - 9. WHEN rendering tree or grouped: for each bookmark link set data-search-index = index (0-based in display order)
 *   - 10. scrollToMatch(idx): links = querySelectorAll('.tree-bookmark-link[data-search-index]'); el = links[idx]; IF el THEN el.scrollIntoView({ block: 'nearest' }); remove .search-current from all; el.classList.add('search-current')
 *
 * === END IMPL-FULL-BLOCK: IMPL-SIDE_PANEL_BOOKMARK_SEARCH ===
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
 * - [IMPL-SIDE_PANEL_TABS] [IMPL-POPUP_SESSION] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [REQ-SUGGESTED_TAGS_FROM_CONTENT] How: onActivated/onUpdated → setRefreshAttribution(trigger=tabChange, surface=side-panel) then refreshPopupData. Bookmark path always refreshes; inject/suggested-tags use CLASSIFY_SCRIPT_INJECTION_URL so gallery/restricted tabs never call chrome.scripting. Exported bindTabChangeRefresh for composition tests (mirror bindWindowFocusRecentTagsRefresh). Observable: ui-inspector injectionOutcome with trigger tabChange.
 * - Contract:
 *   - INPUT: chrome.tabs.onActivated / onUpdated events; PopupController instance
 *   - PRE: controller and tabs APIs available when binding; refresh attribution helpers wired
 *   - OUTPUT: void; This Page refresh scheduled; injectionOutcome when inject skipped
 *   - POST:
 *     - success => refreshPopupData invoked with tabChange attribution
 *     - non-scriptable active tab => no chrome.scripting.executeScript / insertCSS; bookmark fields still update
 *   - FAILURE_MODES: RefreshFailed (controller path; logged)
 *   - DATA: controller._refreshTrigger ("tabChange"); controller._refreshSurface ("side-panel")
 *   - DATA_TRANSITION: on tab change, currentPin/tags refresh; suggested tags empty on expected skip
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: BIND_TAB_CHANGE_REFRESH
 *   - ON tabs.onActivated OR (tabs.onUpdated status complete):
 *   -   controller.setRefreshAttribution({ trigger: "tabChange", surface: "side-panel" })
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
import { buildTagToBookmarks, getAllTagsFromBookmarks, getFilterStateForTagsTree, getTagsToDisplay, intersectionTagOrder, mergePreferredTagSpelling, openUrlInNewTab } from './tags-tree-data.js'
import { applyFilters, sortBookmarks, groupBookmarksBy, filterBookmarksBySearch } from './tags-tree-filter.js'
import { parseTimeRangeValue } from '../bookmarks-table/bookmarks-table-filter.js'
import { tagsTreePlaceholderBookmarks } from './tags-tree-demo-data.js'

const MESSAGE_TYPE_AGGREGATED = 'getAggregatedBookmarksForIndex'
const STORAGE_KEY_SELECTED_TAGS = 'hoverboard_sidepanel_selected_tags'
const STORAGE_KEY_COLLAPSED = 'hoverboard_sidepanel_collapsed'
const STORAGE_KEY_PANEL_CONFIG = 'hoverboard_sidepanel_config'

let rawBookmarks = []
let tagToBookmarks = new Map()
let allTags = []
let selectedTagOrder = []
let collapsedTags = new Set()
let collapsedSections = new Set()
/** @type {{ expanded: boolean, timeField: string, timeStart: number|null, timeEnd: number|null, tagsInclude: Set<string>, domains: Set<string>, groupBy: string, sortBy: string, sortAsc: boolean, showAllTags: boolean }} */
let panelConfig = {
  expanded: false,
  timeField: 'updated_at',
  timeStart: null,
  timeEnd: null,
  tagsInclude: new Set(),
  domains: new Set(),
  groupBy: 'none',
  sortBy: 'updated_at',
  sortAsc: false,
  showAllTags: true
}

const tagSelectorEl = document.getElementById('tagSelector')
const treeContainerEl = document.getElementById('treeContainer')
const emptyStateEl = document.getElementById('emptyState')
const loadErrorEl = document.getElementById('loadError')
const configToggleEl = document.getElementById('configToggle')
const configContentEl = document.getElementById('configContent')
const filterTimeFieldEl = document.getElementById('filterTimeField')
const filterTimeStartEl = document.getElementById('filterTimeStart')
const filterTimeEndEl = document.getElementById('filterTimeEnd')
const filterTagsIncludeEl = document.getElementById('filterTagsInclude')
const filterDomainsEl = document.getElementById('filterDomains')
const groupByEl = document.getElementById('groupBy')
const sortByEl = document.getElementById('sortBy')
const sortAscEl = document.getElementById('sortAsc')
// [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE] Toggle: show all tags vs only checked tags; state persisted in panel config.
const tagListViewToggleEl = document.getElementById('tagListViewToggle')

/** [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_TAGS_TREE] When set before loadBookmarks(), applied to selectedTagOrder so Tags tree shows only bookmarks that share at least one tag with current bookmark. */
let pendingCurrentBookmarkTags = null

// [REQ-SIDE_PANEL_BOOKMARK_SEARCH] [ARCH-SIDE_PANEL_BOOKMARK_SEARCH] [IMPL-SIDE_PANEL_BOOKMARK_SEARCH] Search state and refs for count and Next/Prev.
let searchQuery = ''
let searchMatchIndex = 0
/** @type {Array<object>} Flat list of bookmarks in current display order (after search filter) for match count and scroll-to. */
let matchingBookmarks = []
const searchInputEl = document.getElementById('searchInput')
const searchCountEl = document.getElementById('searchCount')
const searchPrevEl = document.getElementById('searchPrev')
const searchNextEl = document.getElementById('searchNext')

/**
 * [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]
 * loadPanelConfig: implements config state persistence; reads expanded, timeField, timeStart, timeEnd, domains, groupBy, sortBy, sortAsc from chrome.storage.local; defaults for missing keys.
 */
function loadPanelConfig () {
  return new Promise((resolve) => {
    chrome.storage.local.get(STORAGE_KEY_PANEL_CONFIG, (o) => {
      const c = o[STORAGE_KEY_PANEL_CONFIG]
      const expanded = c?.expanded === true
      const timeField = c?.timeField === 'time' ? 'time' : 'updated_at'
      const timeStart = c?.timeStart != null ? c.timeStart : null
      const timeEnd = c?.timeEnd != null ? c.timeEnd : null
      const tagsInclude = new Set(Array.isArray(c?.tagsInclude) ? c.tagsInclude.filter(Boolean) : [])
      const domains = new Set(Array.isArray(c?.domains) ? c.domains : [])
      const groupBy = c?.groupBy === 'time' || c?.groupBy === 'updated_at' || c?.groupBy === 'tag' || c?.groupBy === 'domain' ? c.groupBy : 'none'
      const sortBy = c?.sortBy === 'time' || c?.sortBy === 'updated_at' || c?.sortBy === 'tag' || c?.sortBy === 'domain' ? c.sortBy : 'updated_at'
      const sortAsc = c?.sortAsc === true
      const showAllTags = c?.showAllTags !== false
      panelConfig = { expanded, timeField, timeStart, timeEnd, tagsInclude, domains, groupBy, sortBy, sortAsc, showAllTags }
      resolve(panelConfig)
    })
  })
}

/**
 * [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]
 * savePanelConfig: persists config to chrome.storage.local; domains stored as array.
 */
function savePanelConfig () {
  const c = {
    expanded: panelConfig.expanded,
    timeField: panelConfig.timeField,
    timeStart: panelConfig.timeStart,
    timeEnd: panelConfig.timeEnd,
    tagsInclude: Array.from(panelConfig.tagsInclude),
    domains: Array.from(panelConfig.domains),
    groupBy: panelConfig.groupBy,
    sortBy: panelConfig.sortBy,
    sortAsc: panelConfig.sortAsc,
    showAllTags: panelConfig.showAllTags
  }
  chrome.storage.local.set({ [STORAGE_KEY_PANEL_CONFIG]: c })
}

/**
 * [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]
 * renderConfigToggle: when collapsed shows only compact bar; when expanded shows full config content. Implements expandable/collapsible config region.
 */
function renderConfigToggle () {
  const expanded = panelConfig.expanded
  if (configToggleEl) {
    configToggleEl.setAttribute('aria-expanded', String(expanded))
    const chevron = configToggleEl.querySelector('.config-toggle-chevron')
    if (chevron) chevron.style.transform = expanded ? 'rotate(180deg)' : ''
  }
  if (configContentEl) configContentEl.classList.toggle('hidden', !expanded)
}

/**
 * Sync panelConfig from DOM controls (after user change). Sub-block: reads current control values into panelConfig.
 */
function syncConfigFromControls () {
  panelConfig.timeField = filterTimeFieldEl?.value === 'time' ? 'time' : 'updated_at'
  panelConfig.timeStart = filterTimeStartEl?.value ? parseTimeRangeValue(filterTimeStartEl.value) : null
  panelConfig.timeEnd = filterTimeEndEl?.value ? parseTimeRangeValue(filterTimeEndEl.value) : null
  const tagsStr = (filterTagsIncludeEl?.value || '').trim()
  panelConfig.tagsInclude = new Set(tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [])
  const domainStr = (filterDomainsEl?.value || '').trim()
  panelConfig.domains = new Set(domainStr ? domainStr.split(',').map(d => d.trim().toLowerCase()).filter(Boolean) : [])
  panelConfig.groupBy = groupByEl?.value || 'none'
  panelConfig.sortBy = sortByEl?.value || 'updated_at'
  panelConfig.sortAsc = sortAscEl?.value === '1'
}

/**
 * Sync DOM controls from panelConfig (e.g. after load). Sub-block: writes config to controls.
 */
function syncControlsFromConfig () {
  if (filterTimeFieldEl) filterTimeFieldEl.value = panelConfig.timeField
  if (filterTimeStartEl) filterTimeStartEl.value = panelConfig.timeStart != null ? new Date(panelConfig.timeStart).toISOString().slice(0, 16) : ''
  if (filterTimeEndEl) filterTimeEndEl.value = panelConfig.timeEnd != null ? new Date(panelConfig.timeEnd).toISOString().slice(0, 16) : ''
  if (filterTagsIncludeEl) filterTagsIncludeEl.value = Array.from(panelConfig.tagsInclude).join(', ')
  if (filterDomainsEl) filterDomainsEl.value = Array.from(panelConfig.domains).join(', ')
  if (groupByEl) groupByEl.value = panelConfig.groupBy
  if (sortByEl) sortByEl.value = panelConfig.sortBy
  if (sortAscEl) sortAscEl.value = panelConfig.sortAsc ? '1' : '0'
}

/**
 * [IMPL-SIDE_PANEL_TAGS_TREE] [PROC-DEMO_RECORDING] [REQ-SIDE_PANEL_TAGS_TREE]
 * Load placeholder data when ?screenshot=1 or ?demo=1 so the panel can be captured with consistent content.
 * Sets rawBookmarks so refreshFromConfig() (e.g. when a tag is unchecked) has data and can re-render the tree.
 * Uses tagsTreePlaceholderBookmarks (rich set: many tags, time/updated_at, extended for filters and search).
 */
function loadPlaceholderForScreenshot () {
  loadErrorEl.classList.add('hidden')
  emptyStateEl.classList.add('hidden')
  // [IMPL-SIDE_PANEL_TAGS_TREE] Required so refreshFromConfig does not early-return when user toggles a tag in demo mode.
  rawBookmarks = [...tagsTreePlaceholderBookmarks]
  tagToBookmarks = buildTagToBookmarks(tagsTreePlaceholderBookmarks)
  allTags = getAllTagsFromBookmarks(tagsTreePlaceholderBookmarks)
  selectedTagOrder = [...allTags]
  collapsedTags = new Set()
  if (tagListViewToggleEl) tagListViewToggleEl.checked = panelConfig.showAllTags
  renderTagSelector()
  renderTree()
}

/**
 * [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE] [IMPL-LOCAL_BOOKMARKS_INDEX]
 * loadBookmarks: getAggregatedBookmarksForIndex then load config, apply filters (time, tags include, domain), sort, then either group+renderGrouped or buildTagToBookmarks+renderTree. Implements filter pipeline and display sort/group.
 */
async function loadBookmarks () {
  loadErrorEl.classList.add('hidden')
  try {
    await loadPanelConfig()
    renderConfigToggle()
    syncControlsFromConfig()
    if (tagListViewToggleEl) tagListViewToggleEl.checked = panelConfig.showAllTags
    selectedTagOrder = await loadSelectedTagOrder()
    allTags = [] // set after we have bookmarks
    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: MESSAGE_TYPE_AGGREGATED }, (r) => {
        if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message))
        else resolve(r)
      })
    })
    const bookmarks = response?.bookmarks ?? (response?.data?.bookmarks ?? (Array.isArray(response) ? response : []))
    if (!Array.isArray(bookmarks)) {
      loadErrorEl.textContent = 'No bookmark data received.'
      loadErrorEl.classList.remove('hidden')
      return
    }
    // [IMPL-SIDE_PANEL_TAGS_TREE] [IMPL-LOCAL_BOOKMARKS_INDEX] Store raw bookmarks so refreshFromConfig can re-apply filters on config change.
    rawBookmarks = bookmarks
    allTags = getAllTagsFromBookmarks(bookmarks)
    // [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_TAGS_TREE] Merge current bookmark tag spellings so the list shows the bookmark's tags and is complete.
    if (pendingCurrentBookmarkTags != null && pendingCurrentBookmarkTags.length > 0) {
      allTags = mergePreferredTagSpelling(allTags, pendingCurrentBookmarkTags)
      selectedTagOrder = intersectionTagOrder(allTags, pendingCurrentBookmarkTags)
      saveSelectedTagOrder(selectedTagOrder)
      pendingCurrentBookmarkTags = null
    }
    if (selectedTagOrder.length === 0) selectedTagOrder = [...allTags]
    collapsedTags = await loadCollapsedState()
    collapsedSections = new Set()
    // [REQ-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE] Build filter state (time, tagsInclude from selectedTagOrder or config, domains) and apply pipeline.
    const filterState = {
      timeField: panelConfig.timeField,
      timeStart: panelConfig.timeStart,
      timeEnd: panelConfig.timeEnd,
      tagsInclude: panelConfig.tagsInclude.size > 0 ? panelConfig.tagsInclude : new Set(selectedTagOrder),
      domains: panelConfig.domains
    }
    const filtered = applyFilters(bookmarks, filterState)
    const sorted = sortBookmarks(filtered, panelConfig.sortBy, panelConfig.sortAsc)
    // [REQ-SIDE_PANEL_BOOKMARK_SEARCH] [ARCH-SIDE_PANEL_BOOKMARK_SEARCH] [IMPL-SIDE_PANEL_BOOKMARK_SEARCH] Apply text search to displayed list; use matchingBookmarks for tree/grouped and count.
    matchingBookmarks = (searchQuery && searchQuery.trim()) ? filterBookmarksBySearch(sorted, searchQuery) : sorted
    if (panelConfig.groupBy && panelConfig.groupBy !== 'none') {
      const grouped = groupBookmarksBy(matchingBookmarks, panelConfig.groupBy)
      renderGrouped(grouped)
      const hasContent = grouped && grouped.size > 0
      emptyStateEl.classList.toggle('hidden', hasContent)
    } else {
      tagToBookmarks = buildTagToBookmarks(matchingBookmarks, allTags)
      renderTagSelector()
      renderTree()
      const hasContent = selectedTagOrder.length > 0 && selectedTagOrder.some(t => tagToBookmarks.has(t) && tagToBookmarks.get(t).length > 0)
      emptyStateEl.classList.toggle('hidden', hasContent)
    }
    updateSearchCount()
    if (matchingBookmarks.length > 0 && searchMatchIndex >= matchingBookmarks.length) searchMatchIndex = 0
    scrollToMatch(searchMatchIndex)
  } catch (err) {
    loadErrorEl.textContent = err?.message || 'Failed to load bookmarks.'
    loadErrorEl.classList.remove('hidden')
  }
}

function loadSelectedTagOrder () {
  return new Promise((resolve) => {
    chrome.storage.local.get(STORAGE_KEY_SELECTED_TAGS, (o) => {
      const v = o[STORAGE_KEY_SELECTED_TAGS]
      resolve(Array.isArray(v) ? v : [])
    })
  })
}

function saveSelectedTagOrder (order) {
  chrome.storage.local.set({ [STORAGE_KEY_SELECTED_TAGS]: order })
}

function loadCollapsedState () {
  return new Promise((resolve) => {
    chrome.storage.local.get(STORAGE_KEY_COLLAPSED, (o) => {
      const v = o[STORAGE_KEY_COLLAPSED]
      resolve(Array.isArray(v) ? new Set(v) : new Set())
    })
  })
}

function saveCollapsedState () {
  chrome.storage.local.set({ [STORAGE_KEY_COLLAPSED]: Array.from(collapsedTags) })
}

/** [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE] Renders tag selector (checkboxes) for visible tags from getTagsToDisplay; implements tag selection/order UI and compact layout; persists selectedTagOrder. */
function renderTagSelector () {
  if (!tagSelectorEl) return
  const visibleTags = getTagsToDisplay(allTags, selectedTagOrder, panelConfig.showAllTags)
  tagSelectorEl.innerHTML = ''
  for (const tag of visibleTags) {
    const label = document.createElement('label')
    const cb = document.createElement('input')
    cb.type = 'checkbox'
    cb.value = tag
    cb.checked = selectedTagOrder.includes(tag)
    cb.addEventListener('change', () => {
      if (cb.checked) selectedTagOrder.push(tag)
      else selectedTagOrder = selectedTagOrder.filter(t => t !== tag)
      saveSelectedTagOrder(selectedTagOrder)
      refreshFromConfig()
    })
    label.appendChild(cb)
    label.appendChild(document.createTextNode(tag))
    tagSelectorEl.appendChild(label)
  }
}

/**
 * [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]
 * renderGrouped: when groupBy is not none, render section headers (collapsible) and list of bookmark links per group; click URL opens in new tab. Implements sectioned display.
 * [REQ-SIDE_PANEL_BOOKMARK_SEARCH] [IMPL-SIDE_PANEL_BOOKMARK_SEARCH] Sets data-search-index on each link for scroll/highlight.
 * @param {Map<string, Array<object>>} grouped
 */
function renderGrouped (grouped) {
  if (!grouped || !treeContainerEl) return
  treeContainerEl.innerHTML = ''
  const tagSelectorSection = document.querySelector('.tag-selector-section')
  if (tagSelectorSection) tagSelectorSection.classList.add('hidden')
  let searchRenderIndex = 0
  const keys = [...grouped.keys()].sort()
  for (const groupKey of keys) {
    const items = grouped.get(groupKey) || []
    if (items.length === 0) continue
    const section = document.createElement('div')
    section.className = 'tree-tag-section' + (collapsedSections.has(groupKey) ? ' collapsed' : '')
    section.dataset.groupKey = groupKey
    const header = document.createElement('div')
    header.className = 'tree-tag-header'
    header.setAttribute('role', 'button')
    header.setAttribute('aria-expanded', !collapsedSections.has(groupKey))
    const toggle = document.createElement('span')
    toggle.className = 'tree-tag-toggle'
    toggle.textContent = '▼'
    header.appendChild(toggle)
    header.appendChild(document.createTextNode(`${groupKey} (${items.length})`))
    header.addEventListener('click', () => {
      if (collapsedSections.has(groupKey)) collapsedSections.delete(groupKey)
      else collapsedSections.add(groupKey)
      section.classList.toggle('collapsed', collapsedSections.has(groupKey))
      header.setAttribute('aria-expanded', !collapsedSections.has(groupKey))
    })
    const list = document.createElement('ul')
    list.className = 'tree-tag-list'
    for (const b of items) {
      const title = (b.description != null && b.description !== '') ? String(b.description) : (b.url ? String(b.url) : '')
      const url = b.url ? String(b.url) : ''
      const li = document.createElement('li')
      const a = document.createElement('a')
      a.className = 'tree-bookmark-link'
      a.href = url
      a.target = '_blank'
      a.rel = 'noopener'
      a.dataset.searchIndex = String(searchRenderIndex++)
      const titleSpan = document.createElement('span')
      titleSpan.className = 'bookmark-title'
      titleSpan.textContent = title || url
      const urlSpan = document.createElement('span')
      urlSpan.className = 'bookmark-url'
      urlSpan.textContent = url
      a.appendChild(titleSpan)
      a.appendChild(urlSpan)
      a.addEventListener('click', (e) => {
        e.preventDefault()
        openUrlInNewTab(url)
      })
      li.appendChild(a)
      list.appendChild(li)
    }
    section.appendChild(header)
    section.appendChild(list)
    treeContainerEl.appendChild(section)
  }
}

/** [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE] Renders collapsible tree per selected tag with bookmark links; implements tag→URL list and click-to-open (openUrlInNewTab). [REQ-SIDE_PANEL_BOOKMARK_SEARCH] [IMPL-SIDE_PANEL_BOOKMARK_SEARCH] Sets data-search-index on each link for scroll/highlight. */
function renderTree () {
  const tagSelectorSection = document.querySelector('.tag-selector-section')
  if (tagSelectorSection) tagSelectorSection.classList.remove('hidden')
  treeContainerEl.innerHTML = ''
  let searchRenderIndex = 0
  for (const tag of selectedTagOrder) {
    const entries = tagToBookmarks.get(tag) || []
    if (entries.length === 0) continue
    const section = document.createElement('div')
    section.className = 'tree-tag-section' + (collapsedTags.has(tag) ? ' collapsed' : '')
    section.dataset.tag = tag
    const header = document.createElement('div')
    header.className = 'tree-tag-header'
    header.setAttribute('role', 'button')
    header.setAttribute('aria-expanded', !collapsedTags.has(tag))
    const toggle = document.createElement('span')
    toggle.className = 'tree-tag-toggle'
    toggle.textContent = '▼'
    header.appendChild(toggle)
    header.appendChild(document.createTextNode(`${tag} (${entries.length})`))
    header.addEventListener('click', () => {
      if (collapsedTags.has(tag)) collapsedTags.delete(tag)
      else collapsedTags.add(tag)
      saveCollapsedState()
      section.classList.toggle('collapsed', collapsedTags.has(tag))
      header.setAttribute('aria-expanded', !collapsedTags.has(tag))
    })
    const list = document.createElement('ul')
    list.className = 'tree-tag-list'
    for (const { title, url } of entries) {
      const li = document.createElement('li')
      const a = document.createElement('a')
      a.className = 'tree-bookmark-link'
      a.href = url
      a.target = '_blank'
      a.rel = 'noopener'
      a.dataset.searchIndex = String(searchRenderIndex++)
      const titleSpan = document.createElement('span')
      titleSpan.className = 'bookmark-title'
      titleSpan.textContent = title || url
      const urlSpan = document.createElement('span')
      urlSpan.className = 'bookmark-url'
      urlSpan.textContent = url
      a.appendChild(titleSpan)
      a.appendChild(urlSpan)
      a.addEventListener('click', (e) => {
        e.preventDefault()
        openUrlInNewTab(url) // [REQ-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE] Implements click URL opens in new tab
      })
      li.appendChild(a)
      list.appendChild(li)
    }
    section.appendChild(header)
    section.appendChild(list)
    treeContainerEl.appendChild(section)
  }
}

/**
 * [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]
 * refreshFromConfig: re-applies filter/sort/group from current config and rawBookmarks, then re-renders. Used when config controls change. Implements config change → re-render.
 */
function refreshFromConfig () {
  // [REQ-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE] Sync config from controls and persist.
  syncConfigFromControls()
  savePanelConfig()
  // [IMPL-SIDE_PANEL_TAGS_TREE] Early-return when no data; placeholder path must set rawBookmarks in loadPlaceholderForScreenshot.
  if (!Array.isArray(rawBookmarks) || rawBookmarks.length === 0) return
  // [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE] Build filter state from selectedTagOrder, apply pipeline, sort.
  const filterState = getFilterStateForTagsTree(panelConfig, selectedTagOrder)
  const filtered = applyFilters(rawBookmarks, filterState)
  const sorted = sortBookmarks(filtered, panelConfig.sortBy, panelConfig.sortAsc)
  // [REQ-SIDE_PANEL_BOOKMARK_SEARCH] [ARCH-SIDE_PANEL_BOOKMARK_SEARCH] [IMPL-SIDE_PANEL_BOOKMARK_SEARCH] Apply text search; use matchingBookmarks for tree/grouped and count.
  matchingBookmarks = (searchQuery && searchQuery.trim()) ? filterBookmarksBySearch(sorted, searchQuery) : sorted
  // [REQ-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE] groupBy branch: renderGrouped; else flat tree from tagToBookmarks.
  if (panelConfig.groupBy && panelConfig.groupBy !== 'none') {
    const grouped = groupBookmarksBy(matchingBookmarks, panelConfig.groupBy)
    renderGrouped(grouped)
    emptyStateEl.classList.toggle('hidden', grouped && grouped.size > 0)
  } else {
    tagToBookmarks = buildTagToBookmarks(matchingBookmarks, allTags)
    const hasContent = selectedTagOrder.length > 0 && selectedTagOrder.some(t => tagToBookmarks.has(t) && tagToBookmarks.get(t).length > 0)
    renderTagSelector()
    renderTree()
    emptyStateEl.classList.toggle('hidden', hasContent)
  }
  updateSearchCount()
  if (matchingBookmarks.length > 0 && searchMatchIndex >= matchingBookmarks.length) searchMatchIndex = 0
  scrollToMatch(searchMatchIndex)
}

/**
 * [REQ-SIDE_PANEL_BOOKMARK_SEARCH] [ARCH-SIDE_PANEL_BOOKMARK_SEARCH] [IMPL-SIDE_PANEL_BOOKMARK_SEARCH]
 * Updates the search count text (N matches / No matches). Implements display count of matching records.
 */
function updateSearchCount () {
  if (!searchCountEl) return
  const n = Array.isArray(matchingBookmarks) ? matchingBookmarks.length : 0
  searchCountEl.textContent = n === 0 ? 'No matches' : n + (n === 1 ? ' match' : ' matches')
}

/**
 * [REQ-SIDE_PANEL_BOOKMARK_SEARCH] [ARCH-SIDE_PANEL_BOOKMARK_SEARCH] [IMPL-SIDE_PANEL_BOOKMARK_SEARCH]
 * Scrolls to the Nth matching bookmark link and highlights it. Implements advance to next/previous with scroll and highlight.
 * @param {number} idx 0-based index into matching list
 */
function scrollToMatch (idx) {
  if (!treeContainerEl) return
  const links = treeContainerEl.querySelectorAll('.tree-bookmark-link[data-search-index]')
  const el = links[idx]
  links.forEach(link => link.classList.remove('search-current'))
  if (el) {
    el.classList.add('search-current')
    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }
}

/**
 * [REQ-SIDE_PANEL_BOOKMARK_SEARCH] [ARCH-SIDE_PANEL_BOOKMARK_SEARCH] [IMPL-SIDE_PANEL_BOOKMARK_SEARCH]
 * Wires search input, count, and Previous/Next buttons. Implements search bar and advance to next/previous record.
 */
function attachSearchHandlers () {
  if (searchInputEl) {
    const onSearchChange = () => {
      searchQuery = searchInputEl.value
      searchMatchIndex = 0
      refreshFromConfig()
    }
    searchInputEl.addEventListener('input', onSearchChange)
    searchInputEl.addEventListener('change', onSearchChange)
  }
  if (searchPrevEl) {
    searchPrevEl.addEventListener('click', () => {
      const total = matchingBookmarks.length
      if (total === 0) return
      searchMatchIndex = (searchMatchIndex - 1 + total) % total
      scrollToMatch(searchMatchIndex)
    })
  }
  if (searchNextEl) {
    searchNextEl.addEventListener('click', () => {
      const total = matchingBookmarks.length
      if (total === 0) return
      searchMatchIndex = (searchMatchIndex + 1) % total
      scrollToMatch(searchMatchIndex)
    })
  }
}

/**
 * [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]
 * Config toggle click: implements expand/collapse; save expanded state and show/hide config content.
 */
function attachConfigHandlers () {
  if (configToggleEl) {
    configToggleEl.addEventListener('click', () => {
      panelConfig.expanded = !panelConfig.expanded
      savePanelConfig()
      renderConfigToggle()
    })
  }
  const configInputs = [filterTimeFieldEl, filterTimeStartEl, filterTimeEndEl, filterTagsIncludeEl, filterDomainsEl, groupByEl, sortByEl, sortAscEl]
  configInputs.forEach(el => {
    if (el) el.addEventListener('change', refreshFromConfig)
  })
  if (filterTagsIncludeEl) filterTagsIncludeEl.addEventListener('blur', refreshFromConfig)
  if (filterDomainsEl) filterDomainsEl.addEventListener('blur', refreshFromConfig)
  // [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE] ON tag list view toggle: update showAllTags, save config, re-render tag selector only.
  if (tagListViewToggleEl) {
    tagListViewToggleEl.addEventListener('change', () => {
      panelConfig.showAllTags = !!tagListViewToggleEl.checked
      savePanelConfig()
      renderTagSelector()
    })
  }
}

// Export for unit test (open URL in new tab)
export { openUrlInNewTab }

/**
 * [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_TAGS_TREE]
 * Set tag selector checked state to current bookmark tags and refresh tree so only bookmarks that share at least one tag are shown. No-op if bookmarks not yet loaded.
 * @param {string[]} tags - Current bookmark tags (e.g. from PopupController.normalizeTags(currentPin?.tags)).
 */
export function setSelectedTagsFromCurrentBookmark (tags) {
  if (!Array.isArray(tags)) return
  if (allTags.length === 0) return
  allTags = mergePreferredTagSpelling(allTags, tags)
  selectedTagOrder = intersectionTagOrder(allTags, tags)
  saveSelectedTagOrder(selectedTagOrder)
  // Clear Filters & view inputs so we use selectedTagOrder only (tagsFromSelection) and domain/time do not zero the list.
  panelConfig.tagsInclude = new Set()
  panelConfig.domains = new Set()
  panelConfig.timeStart = null
  panelConfig.timeEnd = null
  syncControlsFromConfig()
  savePanelConfig()
  refreshFromConfig()
  renderTagSelector()
}

/**
 * [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [ARCH-SIDE_PANEL_TABS] [IMPL-SIDE_PANEL_TAGS_TREE]
 * initTagsTreeTab: run when Tags tree tab is shown (standalone tags-tree.html or from side-panel.js). Optional currentBookmarkTags applied when loadBookmarks completes.
 * Attaches handlers and loads bookmarks; only runs once (guard).
 * @param {{ currentBookmarkTags?: string[] }} [options]
 */
let tagsTreeTabInited = false
export function initTagsTreeTab (options = {}) {
  if (tagsTreeTabInited) return
  tagsTreeTabInited = true
  if (options.currentBookmarkTags != null) pendingCurrentBookmarkTags = options.currentBookmarkTags
  attachConfigHandlers()
  attachSearchHandlers()
  const params = new URLSearchParams(typeof window !== 'undefined' && window.location ? window.location.search : '')
  // [IMPL-SIDE_PANEL_TAGS_TREE] [PROC-DEMO_RECORDING] Placeholder path sets rawBookmarks so tag toggle updates tree.
  if (params.get('screenshot') === '1' || params.get('demo') === '1') {
    loadPlaceholderForScreenshot()
  } else {
    loadBookmarks()
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // [IMPL-SIDE_PANEL_TAGS_TREE] When loaded as standalone tags-tree.html, auto-init. When loaded by side-panel.js, initTagsTreeTab is called on tab select.
  if (document.body.id === 'tags-tree-panel') {
    initTagsTreeTab()
  }
})
