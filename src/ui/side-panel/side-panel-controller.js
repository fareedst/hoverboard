/**
 * === IMPL-FULL-BLOCK: IMPL-SIDE_PANEL_TABS ===
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
 * === END IMPL-FULL-BLOCK: IMPL-SIDE_PANEL_TABS ===
 */

import {
  SIDE_PANEL_TAB_STORAGE_KEY,
  TAB_BOOKMARK,
  TAB_TAGS_TREE,
  TAB_BROWSER_TABS,
  getDefaultTab,
  getTagsTreeInitOptions,
  shouldRefreshBookmarkTabWhenSwitching,
  shouldRefreshBookmarkTabOnTabChange,
  shouldRefreshTagsTreeTabOnTabChange
} from './side-panel-tab-state.js'
import { initBookmarkTab as defaultInitBookmarkTab } from './side-panel-bookmark-tab.js'
import { initTagsTreeTab as defaultInitTagsTreeTab, setSelectedTagsFromCurrentBookmark } from './tags-tree.js'
import { initBrowserTabsTab as defaultInitBrowserTabsTab } from './browser-tabs-panel.js'
import { showPanel as defaultShowPanel } from './side-panel-shell.js'

function getChrome (chromeRef) {
  return chromeRef ?? (typeof chrome !== 'undefined' ? chrome : undefined)
}

/**
 * [IMPL-SIDE_PANEL_TABS] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT]
 * Controller factory keeps tab state and initialization guards independent from DOM/event adapters.
 */
export function createSidePanelController (options = {}) {
  const chromeRef = options.chromeRef
  const showPanel = options.showPanel ?? defaultShowPanel
  const initBookmarkTab = options.initBookmarkTab ?? defaultInitBookmarkTab
  const initTagsTreeTab = options.initTagsTreeTab ?? defaultInitTagsTreeTab
  const initBrowserTabsTab = options.initBrowserTabsTab ?? defaultInitBrowserTabsTab
  const selectTagsFromBookmark = options.setSelectedTagsFromCurrentBookmark ?? setSelectedTagsFromCurrentBookmark

  let activeTab = getDefaultTab()
  let bookmarkTabInited = false
  let tagsTreeTabInited = false
  let browserTabsTabInited = false
  let popupComponents = null

  async function initializeBookmarkTab () {
    if (popupComponents) return popupComponents
    if (bookmarkTabInited) return popupComponents
    bookmarkTabInited = true
    popupComponents = await initBookmarkTab({
      bookmarkPanelEl: options.bookmarkPanelEl ?? document.getElementById('bookmarkPanel'),
      onOpenTagsTreeInPanel: () => switchTab(TAB_TAGS_TREE),
      dependencies: options.bookmarkDependencies
    })
    return popupComponents
  }

  function initTagsTreeTabIfNeeded (initOptions = {}) {
    if (tagsTreeTabInited) return
    tagsTreeTabInited = true
    initTagsTreeTab(initOptions)
  }

  function initBrowserTabsTabIfNeeded () {
    if (browserTabsTabInited) return
    browserTabsTabInited = true
    initBrowserTabsTab()
  }

  function initTabIfNeeded (tabId, initOptions = {}) {
    if (tabId === TAB_BOOKMARK) return initializeBookmarkTab()
    if (tabId === TAB_TAGS_TREE) return initTagsTreeTabIfNeeded(initOptions)
    if (tabId === TAB_BROWSER_TABS) return initBrowserTabsTabIfNeeded()
  }

  function switchTab (tabId) {
    const wasBookmarkInited = bookmarkTabInited
    activeTab = tabId
    const chromeValue = getChrome(chromeRef)
    if (chromeValue?.storage?.local?.set) {
      chromeValue.storage.local.set({ [SIDE_PANEL_TAB_STORAGE_KEY]: tabId })
    }
    showPanel(tabId)
    if (tabId === TAB_TAGS_TREE) {
      const optionsForTags = getTagsTreeInitOptions(popupComponents?.controller)
      const currentBookmarkTags = Array.isArray(optionsForTags.currentBookmarkTags)
        ? optionsForTags.currentBookmarkTags
        : []
      const wasTagsTreeInited = tagsTreeTabInited
      initTabIfNeeded(tabId, { currentBookmarkTags })
      if (wasTagsTreeInited) selectTagsFromBookmark(currentBookmarkTags)
    } else {
      initTabIfNeeded(tabId)
    }
    if (shouldRefreshBookmarkTabWhenSwitching(tabId, wasBookmarkInited) && popupComponents?.controller) {
      popupComponents.controller.refreshPopupData()
    }
  }

  function refreshBookmarkTabIfVisible () {
    if (!shouldRefreshBookmarkTabOnTabChange(activeTab, popupComponents?.controller)) return
    popupComponents.controller.refreshPopupData()
  }

  function refreshTagsTreeTabIfVisible () {
    if (!shouldRefreshTagsTreeTabOnTabChange(activeTab, tagsTreeTabInited)) return
    const tags = popupComponents?.controller
      ? (popupComponents.controller.normalizeTags(popupComponents.controller.currentPin?.tags) || [])
      : []
    selectTagsFromBookmark(Array.isArray(tags) ? tags : [])
  }

  function loadPersistedTab () {
    const chromeValue = getChrome(chromeRef)
    if (!chromeValue?.storage?.local?.get) return Promise.resolve(getDefaultTab())
    return new Promise((resolve) => {
      chromeValue.storage.local.get([SIDE_PANEL_TAB_STORAGE_KEY], (storedValues) => {
        const stored = storedValues?.[SIDE_PANEL_TAB_STORAGE_KEY]
        resolve(stored === TAB_BOOKMARK || stored === TAB_TAGS_TREE || stored === TAB_BROWSER_TABS
          ? stored
          : getDefaultTab())
      })
    })
  }

  async function runInitialTabInit (tabId) {
    if (tabId === TAB_TAGS_TREE) {
      await initializeBookmarkTab()
      initTabIfNeeded(tabId, getTagsTreeInitOptions(popupComponents?.controller))
    } else {
      await initTabIfNeeded(tabId)
    }
  }

  return {
    switchTab,
    initTabIfNeeded,
    loadPersistedTab,
    runInitialTabInit,
    refreshBookmarkTabIfVisible,
    refreshTagsTreeTabIfVisible,
    getActiveTab: () => activeTab,
    setActiveTabForTest: (tabId) => { activeTab = tabId },
    setPopupComponentsForTest: (components) => { popupComponents = components },
    resetTagsTreeTabInitedForTest: () => { tagsTreeTabInited = false },
    switchTabForTest: switchTab,
    resetBrowserTabsTabInitedForTest: () => { browserTabsTabInited = false },
    getPopupComponentsForTest: () => popupComponents
  }
}
