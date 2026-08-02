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

import { init as initUISystem, popup as createPopup } from '../index.js'
import { ErrorHandler } from '../../shared/ErrorHandler.js'
import { ConfigManager } from '../../config/config-manager.js'

/**
 * === IMPL-FULL-BLOCK: IMPL-POPUP_PANEL_KEYBOARD_QUICK_ACCESS ===
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
 *   - 10.  IF popupComponents.keyboardManager THEN popupComponents.keyboardManager.setupKeyboardNavigation()
 *
 * === END IMPL-FULL-BLOCK: IMPL-POPUP_PANEL_KEYBOARD_QUICK_ACCESS ===
 */
/**
 * [IMPL-SIDE_PANEL_BOOKMARK] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT]
 * CREATE_POPUP: initialize the shared popup stack against the Bookmark panel root.
 */
export async function initBookmarkTab ({ bookmarkPanelEl, onOpenTagsTreeInPanel, dependencies = {} } = {}) {
  if (!bookmarkPanelEl) return null
  const init = dependencies.init ?? initUISystem
  const popup = dependencies.createPopup ?? createPopup
  const ErrorHandlerClass = dependencies.ErrorHandlerClass ?? ErrorHandler
  const ConfigManagerClass = dependencies.ConfigManagerClass ?? ConfigManager
  const configManager = dependencies.configManager ?? new ConfigManagerClass()
  const getConfig = dependencies.getConfig ?? (() => configManager.getConfig())
  const errorHandler = dependencies.errorHandler ?? new ErrorHandlerClass()
  const config = await getConfig()

  await init({
    enableThemes: true,
    enableIcons: true,
    enableAssets: true,
    preloadCriticalAssets: true
  })

  const popupComponents = popup({
    container: bookmarkPanelEl,
    errorHandler,
    config,
    enableKeyboard: true,
    enableState: true
  })
  if (popupComponents?.controller && typeof onOpenTagsTreeInPanel === 'function') {
    popupComponents.controller.onOpenTagsTreeInPanel = onOpenTagsTreeInPanel
  }
  if (popupComponents?.controller) {
    await popupComponents.controller.loadInitialData()
  }
  popupComponents?.uiManager?.setupEventListeners()
  popupComponents?.keyboardManager?.setupKeyboardNavigation()
  return popupComponents
}
