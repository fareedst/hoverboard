/**
 * [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [ARCH-SIDE_PANEL_TABS] [IMPL-SIDE_PANEL_TABS]
 * Side panel entry: tab bar, Bookmark panel (popup-equivalent), Tags tree panel; tab switch and persist; init Bookmark and Tags tree tabs on first select.
 */

import {
  SIDE_PANEL_TAB_STORAGE_KEY,
  TAB_BOOKMARK,
  TAB_TAGS_TREE,
  getDefaultTab,
  getVisibilityForTab,
  getTagsTreeInitOptions,
  shouldRefreshBookmarkTabWhenSwitching,
  shouldRefreshBookmarkTabOnTabChange,
  shouldRefreshTagsTreeTabOnTabChange
} from './side-panel-tab-state.js'
import { initTagsTreeTab, setSelectedTagsFromCurrentBookmark } from './tags-tree.js'
import { init, popup } from '../index.js'
import { ErrorHandler } from '../../shared/ErrorHandler.js'
import { ConfigManager } from '../../config/config-manager.js'

const bookmarkPanelEl = document.getElementById('bookmarkPanel')
const tagsTreePanelEl = document.getElementById('tagsTreePanel')
const tabButtons = document.querySelectorAll('.side-panel-tab[data-tab]')

let activeTab = getDefaultTab()
let bookmarkTabInited = false
let tagsTreeTabInited = false
/** @type {{ controller: import('../popup/PopupController.js').PopupController, uiManager: import('../popup/UIManager.js').UIManager } | null} */
let popupComponents = null

/**
 * [IMPL-SIDE_PANEL_TABS] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT]
 * Show the panel for activeTab and hide the other; update tab aria-selected.
 */
function showPanel () {
  const { bookmarkVisible, tagsTreeVisible } = getVisibilityForTab(activeTab)
  if (bookmarkPanelEl) {
    bookmarkPanelEl.hidden = !bookmarkVisible
  }
  if (tagsTreePanelEl) {
    tagsTreePanelEl.hidden = !tagsTreeVisible
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
  }
}

function bindTabButtons () {
  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab')
      if (tab) switchTab(tab)
    })
  })
}

async function loadPersistedTab () {
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) return getDefaultTab()
  return new Promise((resolve) => {
    chrome.storage.local.get([SIDE_PANEL_TAB_STORAGE_KEY], (o) => {
      const stored = o[SIDE_PANEL_TAB_STORAGE_KEY]
      resolve(stored === TAB_BOOKMARK || stored === TAB_TAGS_TREE ? stored : getDefaultTab())
    })
  })
}

/**
 * [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [ARCH-SIDE_PANEL_TABS] [IMPL-SIDE_PANEL_TABS]
 * Register tab listeners so both tabs refresh for current tab when active browser tab changes or completes. Always refresh controller (refreshPopupData) when panel has controller; then refresh Bookmark tab UI when visible, and Tags tree tab (tag selector and tree) when visible.
 */
async function onTabChangeRefresh () {
  if (!popupComponents?.controller) return
  await popupComponents.controller.refreshPopupData()
  // Bookmark tab UI already updated by refreshPopupData(); refresh Tags tree when visible.
  refreshTagsTreeTabIfVisible()
}

function bindTabChangeRefresh () {
  const tabsApi = typeof chrome !== 'undefined' && chrome.tabs ? chrome.tabs : null
  if (!tabsApi) return
  tabsApi.onActivated.addListener(() => {
    onTabChangeRefresh()
  })
  tabsApi.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status !== 'complete' || !tab?.url) return
    tabsApi.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs?.[0]?.id === tabId) onTabChangeRefresh()
    })
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
 * Test-only hook to reset tagsTreeTabInited so runInitialTabInit('tagsTree') can be tested multiple times.
 * [IMPL-SIDE_PANEL_TABS]
 */
export function resetTagsTreeTabInitedForTest () {
  tagsTreeTabInited = false
}

document.addEventListener('DOMContentLoaded', async () => {
  activeTab = await loadPersistedTab()
  showPanel()
  bindTabButtons()
  bindTabChangeRefresh()
  await runInitialTabInit(activeTab)
})
