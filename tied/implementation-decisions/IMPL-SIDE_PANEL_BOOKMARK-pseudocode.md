# [IMPL-SIDE_PANEL_BOOKMARK] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] — This block defines the Bookmark tab content and init: markup with data-popup-ref, PopupController + UIManager with container, and "By Tag" → switch tab. Implements REQ by providing popup-equivalent in panel; implements ARCH by scoped root. Runtime lives in side-panel-bookmark-tab.js; controller delegates via initTabIfNeeded.

## INIT_BOOKMARK_TAB

- [IMPL-SIDE_PANEL_BOOKMARK] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-UIManager_SCOPED_ROOT] How: exported initBookmarkTab in side-panel-bookmark-tab.js; controller calls it from INIT_TAB_IF_NEEDED with bookmarkPanelEl and onOpenTagsTreeInPanel callback; returns popupComponents for controller state.
- Contract:
  - INPUT: bookmarkPanelEl DOM root; onOpenTagsTreeInPanel callback; optional dependency injection for tests
  - PRE: bookmarkPanelEl present; UISystem and createPopup available
  - OUTPUT: popupComponents { controller, uiManager, keyboardManager } or null
  - POST:
    - success => controller.loadInitialData complete; setupEventListeners and keyboard navigation registered
  - DATA: bookmarkPanelEl, popupComponents, onOpenTagsTreeInPanel
  - EFFECTS: Async, IO, State
  - TERMINATION: total
- PROCEDURE: INIT_BOOKMARK_TAB
  - IF NOT bookmarkPanelEl: RETURN null
  - AWAIT UISystem.init({ enableThemes, enableIcons, enableAssets, preloadCriticalAssets })
  - popupComponents = createPopup({ container: bookmarkPanelEl, errorHandler, config, enableKeyboard: true, enableState: true })
  - IF onOpenTagsTreeInPanel: controller.onOpenTagsTreeInPanel = onOpenTagsTreeInPanel
  - AWAIT controller.loadInitialData()
  - uiManager.setupEventListeners()
  - keyboardManager.setupKeyboardNavigation()
  - RETURN popupComponents

## CREATE_POPUP

- [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [ARCH-SIDE_PANEL_TABS] [IMPL-SIDE_PANEL_BOOKMARK] [IMPL-UIManager_SCOPED_ROOT] How: Markup: #bookmarkPanel contains elements with data-popup-ref="mainInterface", data-popup-ref="loadingState", etc. Same structure as popup (quick actions, storage, tag management, search). Implements "Bookmark tab shows functional equivalent of popup UI". createPopup({ container }): when container provided, UIManager uses container for cacheElements (querySelector by data-popup-ref). PopupController receives that UIManager; loadInitialData gets current tab and bookmark; setupEventListeners binds same events. Implements reuse of popup stack with scoped root.
- Contract:
  - INPUT: User selects Bookmark tab; controller initTabIfNeeded calls initBookmarkTab({ bookmarkPanelEl })
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: Bookmark panel shows current-tab bookmark UI (quick actions, storage, tags, search); interactions work as in popup | { error: OperationFailed }
  - POST:
    - success => block outputs match OUTPUT success shape
    - error OperationFailed => no silent partial commit beyond documented best-effort
  - FAILURE_MODES: OperationFailed
  - DATA: bookmarkPanel (DOM root), UIManager(container), PopupController(uiManager, ...)
  - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
  - EFFECTS: IO, State
  - TERMINATION: total
- PROCEDURE: CREATE_POPUP
  - uiManager = new UIManager({ ..., container })  // UIManager.cacheElements uses container if set
  - controller = new PopupController({ uiManager, ... })
  - RETURN { controller, uiManager, ... }

## BLOCK_2

- [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [ARCH-SIDE_PANEL_TABS] [IMPL-SIDE_PANEL_BOOKMARK] How: "By Tag" in panel: when in side panel context, do not send OPEN_SIDE_PANEL; instead call switchToTagsTreeTab() (or emit so side-panel.js switches tab). Implements "By Tag switches to By Tag tab" in panel. When switching to Bookmark tab and it was already inited, call controller.refreshPopupData() so getCurrentTab and getBookmarkData run for the active tab; content then reflects current tab's bookmark state (same as badge). Implements "Bookmark tab reflects current tab when selected". Prompt refresh (like badge): when Bookmark tab is visible, refresh on tabs.onActivated and on tabs.onUpdated (when updated tab is active and status complete). refreshBookmarkTabIfVisible() calls controller.refreshPopupData() only when activeTab === "bookmark" and controller exists. Implements "Bookmark tab refreshes promptly when active tab changes or completes".
- Contract:
  - INPUT: User selects Bookmark tab; controller initTabIfNeeded calls initBookmarkTab({ bookmarkPanelEl })
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: Bookmark panel shows current-tab bookmark UI (quick actions, storage, tags, search); interactions work as in popup
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: bookmarkPanel (DOM root), UIManager(container), PopupController(uiManager, ...)
  - EFFECTS: IO
  - TERMINATION: total
- PROCEDURE: BLOCK_2
  - 1. ON "By Tag" click in This Page tab:
  - 2.   IF inPanelContext: switchToTagsTreeTab()  // e.g. callback from side-panel.js or global
  - 3.   ELSE: send OPEN_SIDE_PANEL  // popup context
  - 4. ON switchTab("bookmark"): IF bookmarkTabInited already true AND popupComponents.controller: controller.refreshPopupData()
  - 5. bindTabChangeRefresh(): chrome.tabs.onActivated → refreshBookmarkTabIfVisible(); chrome.tabs.onUpdated(tabId, changeInfo, tab) → IF changeInfo.status === "complete" AND tab.url AND updated tab is current window active tab: refreshBookmarkTabIfVisible()
