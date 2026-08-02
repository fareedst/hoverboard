/**
 * === IMPL-FULL-BLOCK: IMPL-SIDE_PANEL_TABS ===
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
 * === END IMPL-FULL-BLOCK: IMPL-SIDE_PANEL_TABS ===
 */

import { MESSAGE_TYPES } from '../../core/message-handler.js'
import { shouldInvokeLoadRecentTagsOnWindowFocusSync } from './side-panel-tab-state.js'
import { recordAction as defaultRecordAction } from '../../shared/ui-inspector.js'

function getChrome (chromeRef) {
  return chromeRef ?? (typeof chrome !== 'undefined' ? chrome : undefined)
}

/**
 * [IMPL-SIDE_PANEL_TABS] [IMPL-POPUP_SESSION] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [REQ-SUGGESTED_TAGS_FROM_CONTENT]
 * BIND_TAB_CHANGE_REFRESH: bind browser tab lifecycle events to PopupController refresh.
 */
export function bindTabChangeRefresh ({
  chromeRef,
  getController = () => null,
  onRefreshTagsTreeTab = () => {},
  recordAction = defaultRecordAction
} = {}) {
  const chromeValue = getChrome(chromeRef)
  const tabsApi = chromeValue?.tabs
  if (!tabsApi?.onActivated?.addListener || !tabsApi?.onUpdated?.addListener) return

  const refresh = async (source) => {
    const controller = getController()
    if (!controller) return
    recordAction('tabChangeRefresh', { source, tabId: controller.currentTab?.id }, 'side-panel')
    const attribution = { trigger: 'tabChange', surface: 'side-panel' }
    controller.setRefreshAttribution?.(attribution)
    await controller.refreshPopupData(attribution)
    onRefreshTagsTreeTab()
  }

  tabsApi.onActivated.addListener(() => {
    refresh('onActivated')
  })
  tabsApi.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status !== 'complete' || !tab?.url) return
    tabsApi.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs?.[0]?.id === tabId) refresh('onUpdated')
    })
  })
}

/**
 * [IMPL-SIDE_PANEL_TABS] [ARCH-SIDE_PANEL_TABS] [ARCH-TAG_SYSTEM] [REQ-RECENT_TAGS_SYSTEM] [IMPL-RECENT_TAGS_POPUP_REFRESH]
 * BIND_WINDOW_FOCUS_RECENT_TAGS_REFRESH: match the focused browser window before refreshing Recent Tags.
 */
export function bindWindowFocusRecentTagsRefresh ({
  chromeRef,
  getActiveTab = () => 'bookmark',
  getController = () => null
} = {}) {
  const chromeValue = getChrome(chromeRef)
  const windowsApi = chromeValue?.windows
  const hasWindowsApi = !!(windowsApi?.onFocusChanged?.addListener && windowsApi?.getCurrent)
  if (!hasWindowsApi) return

  windowsApi.onFocusChanged.addListener((windowId) => {
    if (windowId === windowsApi.WINDOW_ID_NONE) return
    windowsApi.getCurrent((windowValue) => {
      if (chromeValue.runtime?.lastError) return
      if (!windowValue || windowValue.id !== windowId) return
      const controller = getController()
      if (!shouldInvokeLoadRecentTagsOnWindowFocusSync({
        hasWindowsApi,
        activeTab: getActiveTab(),
        isInitialized: !!controller?.isInitialized,
        isLoading: !!controller?.isLoading
      })) return
      controller.loadRecentTags()
    })
  })
}

/**
 * [IMPL-EXTENSION_COMMANDS] [IMPL-SIDE_PANEL_TABS]
 * Bind storage changes from tab-specific commands to the controller.
 */
export function bindStorageTabChange ({ chromeRef, getActiveTab, switchTab, validTabs } = {}) {
  const chromeValue = getChrome(chromeRef)
  if (!chromeValue?.storage?.onChanged?.addListener) return
  chromeValue.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return
    const tabId = changes.hoverboard_sidepanel_active_tab?.newValue
    if (!validTabs?.includes(tabId) || tabId === getActiveTab()) return
    switchTab(tabId)
  })
}

/**
 * === IMPL-FULL-BLOCK: IMPL-ICON_CLICK_BEHAVIOR ===
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
const sidePanelLoadTime = Date.now()

/** [REQ-ICON_CLICK_BEHAVIOR] [IMPL-ICON_CLICK_BEHAVIOR] Decide whether a toggle-close message should close the panel. */
export function shouldClosePanelOnToggleMessage (message, opts = {}) {
  const documentRef = opts.documentRef ?? (typeof document !== 'undefined' ? document : undefined)
  const visibilityState = opts.visibilityState ?? documentRef?.visibilityState
  const now = opts.now ?? Date.now()
  const loadTime = opts.loadTime ?? sidePanelLoadTime
  if (message?.type !== MESSAGE_TYPES.REQUEST_SIDE_PANEL_CLOSE) return false
  if (visibilityState !== 'visible') return false
  if (now - loadTime < 300) return false
  return true
}

/** [REQ-ICON_CLICK_BEHAVIOR] [IMPL-ICON_CLICK_BEHAVIOR] Register the side-panel toggle-close listener. */
export function bindToggleCloseRequest ({
  chromeRef,
  documentRef,
  windowRef
} = {}) {
  const chromeValue = getChrome(chromeRef)
  if (!chromeValue?.runtime?.onMessage?.addListener) return
  const windowValue = windowRef ?? (typeof window !== 'undefined' ? window : undefined)
  chromeValue.runtime.onMessage.addListener((message) => {
    if (!shouldClosePanelOnToggleMessage(message, {
      documentRef,
      loadTime: sidePanelLoadTime
    })) return
    windowValue?.close?.()
  })
}
