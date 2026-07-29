# [IMPL-SIDE_PANEL_TABS] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [REQ-RECENT_TAGS_SYSTEM] [ARCH-TAG_SYSTEM]
# Tabbed side panel: tab bar, panels, persist, init This Page / By Tag / browser Tabs; recent-tags refresh on window focus while Bookmark tab active (same loadRecentTags contract as [IMPL-RECENT_TAGS_POPUP_REFRESH]); single page + scoped popup root per ARCH-SIDE_PANEL_TABS.

INPUT: panel page load; user click on tab ("This Page", "By Tag", or "Tabs")
OUTPUT: one panel visible; This Page, By Tag, or browser Tabs content shown; selected tab persisted
DATA: activeTab ("bookmark" | "tagsTree" | "browserTabs"), bookmarkTabInited (boolean), tagsTreeTabInited (boolean), browserTabsTabInited (boolean), storage key hoverboard_sidepanel_active_tab. TAB_BROWSER_TABS = "browserTabs"; TAB_IDS includes browserTabs.

# How: restore tab; showPanel; bindTabButtons; bindTabChangeRefresh; bindWindowFocusRecentTagsRefresh (RECENT_TAGS ordering with tab listeners); runInitialTabInit — if restored tagsTree, await bookmark init then By Tag with currentBookmarkTags so DB row for current URL shows.
ON panel page load:
  activeTab = load from chrome.storage.local key hoverboard_sidepanel_active_tab OR default "bookmark"
  showPanel(activeTab)  // display #bookmarkPanel or #tagsTreePanel; hide the other
  bindTabButtons()  // on click: switchTab(tabId); save activeTab to storage; showPanel(activeTab); initTabIfNeeded(activeTab) or initTabIfNeeded(tabId, options)
  bindTabChangeRefresh()  // tabs.onActivated and tabs.onUpdated (active tab complete) → if controller exists always refreshPopupData(); then refreshBookmarkTabIfVisible(); then refreshTagsTreeTabIfVisible()
  bindWindowFocusRecentTagsRefresh()  // REQ-RECENT_TAGS_SYSTEM: when this window gains focus and Bookmark tab active, loadRecentTags() (same getRecentBookmarks path as popup)
  runInitialTabInit(activeTab)  // IF activeTab === "tagsTree": await initBookmarkTab(); initTabIfNeeded("tagsTree", getTagsTreeInitOptions(controller)). ELSE IF activeTab === "browserTabs": initTabIfNeeded("browserTabs"). ELSE: initTabIfNeeded(activeTab). Ensures By Tag tab on open shows current URL's bookmark; Tabs tab on open loads browser tabs list (REQ-SIDE_PANEL_BROWSER_TABS).

# [IMPL-SIDE_PANEL_TABS] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_TAGS_TREE]
# How: pure helper for By Tag init — { currentBookmarkTags } from controller.currentPin.tags via normalizeTags; lives in side-panel-tab-state.js.
getTagsTreeInitOptions(controller):
  IF controller missing: RETURN { currentBookmarkTags: [] }
  raw = controller.normalizeTags(controller.currentPin?.tags) || []
  RETURN { currentBookmarkTags: Array.isArray(raw) ? raw : [] }

# [IMPL-SIDE_PANEL_TABS] [ARCH-SIDE_PANEL_TABS] [ARCH-TAG_SYSTEM] [REQ-RECENT_TAGS_SYSTEM] [IMPL-RECENT_TAGS_POPUP_REFRESH]
# How: cross-IMPL — invokes PopupController.loadRecentTags() (async; same family as popup). chrome.windows.getCurrent callback does not await the returned promise (fire-and-forget; matches production side-panel.js). Register after bindTabChangeRefresh on panel load. Focus to this window (not WINDOW_ID_NONE), getCurrent id match; sync guards via shouldInvokeLoadRecentTagsOnWindowFocusSync in side-panel-tab-state.js (matches unit tests); no-op without chrome.windows. Phase G: exported for composition tests; setActiveTabForTest sets activeTab in tests only.
bindWindowFocusRecentTagsRefresh():
  hasWindowsApi = !!(onFocusChanged AND getCurrent); IF NOT hasWindowsApi: RETURN
  REGISTER onFocusChanged(windowId):
    IF windowId === WINDOW_ID_NONE: RETURN
    getCurrent → IF runtime.lastError OR window id mismatch: RETURN
    IF NOT shouldInvokeLoadRecentTagsOnWindowFocusSync({ hasWindowsApi, activeTab, isInitialized: controller?.isInitialized, isLoading: controller?.isLoading }): RETURN
    controller.loadRecentTags()  // async; not AWAIT in callback (S09.GREEN LEAP alignment)

# --- Phase H E2E-only boundary [REQ-RECENT_TAGS_SYSTEM] [IMPL-SIDE_PANEL_TABS] ---
# Cross-window "return focus to this browser window → Recent Tags refresh" is e2e_only: phase_h_window_focus_recent_tags_cross_window (multi-window + real onFocusChanged). Phase G: tests/integration/window-focus-recent-tags-composition.integration.test.js.
# This Page Recent Tags mount in chrome-extension:// side-panel.html is e2e_only: phase_h_side_panel_recent_tags_extension_document — tests/playwright/extension-side-panel-recent-tags-e2e.spec.js.

# [IMPL-SIDE_PANEL_TABS] [ARCH-SIDE_PANEL_TABS] [ARCH-TAG_SYSTEM] [REQ-RECENT_TAGS_SYSTEM]
# How: pure predicate for window-focus recent refresh sync gates (tested in side-panel-tabs.test.js); implementation is single boolean AND (same semantics as chained IFs). Token set aligned with side-panel-tab-state.js and tests (S09.SYNC).
shouldInvokeLoadRecentTagsOnWindowFocusSync({ hasWindowsApi, activeTab, isInitialized, isLoading }):
  RETURN !!(hasWindowsApi AND activeTab === "bookmark" AND isInitialized AND NOT isLoading)

# [IMPL-SIDE_PANEL_TABS] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_TAGS_TREE]
# How: onActivated/onUpdated — refreshPopupData updates controller.currentPin; By Tag visible → refreshTagsTreeTabIfVisible / setSelectedTagsFromCurrentBookmark.
ON tabs.onActivated / tabs.onUpdated (active tab complete):
  IF popupComponents?.controller: AWAIT controller.refreshPopupData()
  IF This Page tab visible: UI already updated by refreshPopupData
  IF By Tag tab visible AND tagsTreeTabInited: refreshTagsTreeTabIfVisible() → setSelectedTagsFromCurrentBookmark(controller tags)

# [IMPL-SIDE_PANEL_TABS] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT]
# How: persist activeTab; showPanel; tagsTree branch passes currentBookmarkTags / setSelectedTagsFromCurrentBookmark; returning to bookmark when already inited → refreshPopupData.
switchTab(tabId):
  wasBookmarkInited = bookmarkTabInited
  activeTab = tabId
  chrome.storage.local.set({ hoverboard_sidepanel_active_tab: tabId })
  showPanel(activeTab)
  IF tabId === "tagsTree": currentTags = controller.normalizeTags(controller.currentPin?.tags) OR []; wasTagsTreeInited = tagsTreeTabInited; initTabIfNeeded(tabId, { currentBookmarkTags: currentTags }); IF wasTagsTreeInited: setSelectedTagsFromCurrentBookmark(currentTags)
  ELSE IF tabId === "browserTabs": initTabIfNeeded("browserTabs")
  ELSE: initTabIfNeeded(tabId)
  IF tabId === "bookmark" AND wasBookmarkInited AND popupComponents.controller: popupComponents.controller.refreshPopupData()

# [IMPL-SIDE_PANEL_TABS] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [REQ-SIDE_PANEL_BROWSER_TABS]
# How: toggle visibility of #bookmarkPanel / #tagsTreePanel / #browserTabsPanel so exactly one content panel shows.
showPanel(activeTab):
  IF activeTab === "bookmark": #bookmarkPanel visible, #tagsTreePanel hidden, #browserTabsPanel hidden
  ELSE IF activeTab === "tagsTree": #tagsTreePanel visible, #bookmarkPanel hidden, #browserTabsPanel hidden
  ELSE IF activeTab === "browserTabs": #browserTabsPanel visible, #bookmarkPanel hidden, #tagsTreePanel hidden

# [IMPL-SIDE_PANEL_TABS] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT]
# How: header row — setSidePanelVersion / initSidePanelVersion; no-op if #side-panel-version missing; guards for tests without chrome.runtime.
ON panel page load (after bindTabButtons): initSidePanelVersion() → setSidePanelVersion()  // no-op when #side-panel-version missing

# [IMPL-SIDE_PANEL_TABS] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT]
# How: CSS flex column on body + .side-panel-content flex 1 so tab content fills viewport.
CSS #side-panel-page (body): display flex; flex-direction column; height 100vh; margin 0; max-height none; width 100%
CSS .side-panel-content: flex 1 1 0; min-height 0; overflow auto; padding 0.5rem 0.75rem; display flex; flex-direction column

# [IMPL-SIDE_PANEL_TABS] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_BOOKMARK] [IMPL-UIManager_SCOPED_ROOT]
# How: composed_with — single init of popup stack in #bookmarkPanel; pre: DOM ready; post: controller + loadInitialData + setupEventListeners; wires footer By Tag → switchTab("tagsTree").
initTabIfNeeded("bookmark"):
  IF bookmarkTabInited RETURN
  bookmarkTabInited = true
  uiSystem = AWAIT UISystem.init(); popupComponents = uiSystem.createPopup({ container: document.getElementById('bookmarkPanel'), errorHandler, config })
  AWAIT popupComponents.controller.loadInitialData()
  popupComponents.uiManager.setupEventListeners()
  // Wire "By Tag" in footer to switchTab("tagsTree") when in panel context

# [IMPL-SIDE_PANEL_TABS] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_TAGS_TREE]
# How: composed_with — lazy initTagsTreeTab(options); currentBookmarkTags aligns selector after loadBookmarks; depends on bookmark tab controller when switching from This Page.
initTabIfNeeded("tagsTree", options):
  IF tagsTreeTabInited RETURN
  tagsTreeTabInited = true
  initTagsTreeTab(options)  // load getAggregatedBookmarksForIndex; if options.currentBookmarkTags set, apply at end of loadBookmarks

# [IMPL-SIDE_PANEL_TABS] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS]
# How: composed_with — initBrowserTabsTab once; chrome.tabs list + optional referrers; visibility when activeTab === "browserTabs".
initTabIfNeeded("browserTabs"):
  IF browserTabsTabInited RETURN
  browserTabsTabInited = true
  initBrowserTabsTab()  // load tabs, referrers; render #browserTabsPanel list; bind search input, Copy button, Close button
# Phase G: switchTabForTest(tabId) and resetBrowserTabsTabInitedForTest() exported for composition tests — same switchTab → initTabIfNeeded("browserTabs") path without clicking .side-panel-tab (no UI).

# --- Composition: composed_with [IMPL-SIDE_PANEL_BOOKMARK] [IMPL-SIDE_PANEL_TAGS_TREE] ---
# Ordering: runInitialTabInit may await initBookmarkTab before By Tag so controller exists for getTagsTreeInitOptions. Shared DATA: popupComponents.controller (currentPin, normalizeTags) for both This Page and By Tag sync. Collision: bindTabChangeRefresh refreshPopupData and bindWindowFocusRecentTagsRefresh loadRecentTags can run close together — both read currentPin; safe (idempotent UI updates). Cross-IMPL: loadRecentTags matches [IMPL-RECENT_TAGS_POPUP_REFRESH] message path to [IMPL-MESSAGE_HANDLING] / [IMPL-TAG_SYSTEM].
