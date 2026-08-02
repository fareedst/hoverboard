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
 * === END IMPL-FULL-BLOCK: IMPL-SIDE_PANEL_TABS
 */

import {
  bindTabChangeRefresh,
  bindWindowFocusRecentTagsRefresh
} from '../../src/ui/side-panel/side-panel-event-bindings.js'

describe('[REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_TABS] event bindings', () => {
  test('bindTabChangeRefresh REQ-SIDE_PANEL_POPUP_EQUIVALENT forwards tab-change attribution', async () => {
    let onActivated
    const controller = {
      setRefreshAttribution: jest.fn(),
      refreshPopupData: jest.fn().mockResolvedValue()
    }
    const chromeRef = {
      tabs: {
        onActivated: { addListener: jest.fn((listener) => { onActivated = listener }) },
        onUpdated: { addListener: jest.fn() },
        query: jest.fn()
      }
    }

    bindTabChangeRefresh({ chromeRef, getController: () => controller })
    onActivated()
    await Promise.resolve()

    expect(controller.setRefreshAttribution).toHaveBeenCalledWith({
      trigger: 'tabChange',
      surface: 'side-panel'
    })
    expect(controller.refreshPopupData).toHaveBeenCalledWith({
      trigger: 'tabChange',
      surface: 'side-panel'
    })
  })

  test('bindWindowFocusRecentTagsRefresh REQ-RECENT_TAGS_SYSTEM refreshes only the matching focused window', () => {
    let onFocusChanged
    const loadRecentTags = jest.fn()
    const chromeRef = {
      runtime: { lastError: undefined },
      windows: {
        WINDOW_ID_NONE: -1,
        onFocusChanged: { addListener: jest.fn((listener) => { onFocusChanged = listener }) },
        getCurrent: jest.fn((callback) => callback({ id: 7 }))
      }
    }
    const controller = {
      isInitialized: true,
      isLoading: false,
      loadRecentTags
    }

    bindWindowFocusRecentTagsRefresh({
      chromeRef,
      getActiveTab: () => 'bookmark',
      getController: () => controller
    })
    onFocusChanged(7)

    expect(loadRecentTags).toHaveBeenCalledTimes(1)
  })
})
