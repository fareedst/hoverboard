/**
 * === IMPL-FULL-BLOCK: IMPL-SIDE_PANEL_TABS ===
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

import {
  TAB_IDS
} from './side-panel-tab-state.js'
import { createSidePanelController } from './side-panel-controller.js'
import {
  bindTabChangeRefresh as bindTabChangeRefreshEvents,
  bindWindowFocusRecentTagsRefresh as bindWindowFocusRecentTagsRefreshEvents,
  bindStorageTabChange,
  bindToggleCloseRequest,
  shouldClosePanelOnToggleMessage
} from './side-panel-event-bindings.js'
import {
  bindTabButtons,
  initSidePanelVersion,
  setSidePanelVersion,
  showPanel
} from './side-panel-shell.js'

function getDocument () {
  return typeof document !== 'undefined' ? document : null
}

function getChrome () {
  return typeof chrome !== 'undefined' ? chrome : undefined
}

const documentRef = getDocument()
const shellElements = documentRef
  ? {
      documentRef,
      bookmarkPanelEl: documentRef.getElementById('bookmarkPanel'),
      tagsTreePanelEl: documentRef.getElementById('tagsTreePanel'),
      browserTabsPanelEl: documentRef.getElementById('browserTabsPanel'),
      tabButtons: documentRef.querySelectorAll('.side-panel-tab[data-tab]')
    }
  : {}

const controller = createSidePanelController({
  bookmarkPanelEl: shellElements.bookmarkPanelEl,
  showPanel: (activeTab) => showPanel(activeTab, shellElements)
})

function getPopupController () {
  return controller.getPopupComponentsForTest()?.controller
}

export function bootSidePanel () {
  initSidePanelVersion({ documentRef, chromeRef: getChrome() })
  return controller.loadPersistedTab().then(async (activeTab) => {
    controller.setActiveTabForTest(activeTab)
    showPanel(activeTab, shellElements)
    bindTabButtons(shellElements.tabButtons, controller.switchTab)
    bindTabChangeRefresh()
    bindWindowFocusRecentTagsRefresh()
    bindStorageTabChange()
    bindToggleCloseRequest()
    await controller.runInitialTabInit(activeTab)
  })
}

export function bindTabChangeRefresh () {
  return bindTabChangeRefreshEvents({
    chromeRef: getChrome(),
    getController: getPopupController,
    onRefreshTagsTreeTab: controller.refreshTagsTreeTabIfVisible
  })
}

export function bindWindowFocusRecentTagsRefresh () {
  return bindWindowFocusRecentTagsRefreshEvents({
    chromeRef: getChrome(),
    getActiveTab: controller.getActiveTab,
    getController: getPopupController
  })
}

export function bindStorageTabChangeForTest () {
  return bindStorageTabChange({
    chromeRef: getChrome(),
    getActiveTab: controller.getActiveTab,
    switchTab: controller.switchTab,
    validTabs: TAB_IDS
  })
}

export function setSidePanelVersionForTest (version, buildTimeUtc) {
  return setSidePanelVersion(version, buildTimeUtc, { documentRef, chromeRef: getChrome() })
}

export { setSidePanelVersionForTest as setSidePanelVersion }

export { shouldClosePanelOnToggleMessage }

export function runInitialTabInit (tabId) {
  return controller.runInitialTabInit(tabId)
}

export function setPopupComponentsForTest (components) {
  controller.setPopupComponentsForTest(components)
}

export function setActiveTabForTest (tabId) {
  controller.setActiveTabForTest(tabId)
}

export function resetTagsTreeTabInitedForTest () {
  controller.resetTagsTreeTabInitedForTest()
}

export function switchTabForTest (tabId) {
  return controller.switchTabForTest(tabId)
}

export function resetBrowserTabsTabInitedForTest () {
  controller.resetBrowserTabsTabInitedForTest()
}

if (documentRef?.addEventListener) {
  documentRef.addEventListener('DOMContentLoaded', () => {
    bootSidePanel()
  })
}
