/**
 * [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [ARCH-SIDE_PANEL_TABS] [IMPL-SIDE_PANEL_TABS]
 * Tab state constants and pure helpers for side panel tabs (Bookmark | Tags tree).
 * Used by side-panel.js for storage key, tab ids, and visibility.
 */

/** @type {string} chrome.storage.local key for last-selected tab */
export const SIDE_PANEL_TAB_STORAGE_KEY = 'hoverboard_sidepanel_active_tab'

/** @type {string} */
export const TAB_BOOKMARK = 'bookmark'
/** @type {string} */
export const TAB_TAGS_TREE = 'tagsTree'

/** @type {string[]} */
export const TAB_IDS = [TAB_BOOKMARK, TAB_TAGS_TREE]

/**
 * Default tab when none persisted.
 * [IMPL-SIDE_PANEL_TABS] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT]
 * @returns {string}
 */
export function getDefaultTab () {
  return TAB_BOOKMARK
}

/**
 * Returns which panel(s) should be visible for the given activeTab.
 * [IMPL-SIDE_PANEL_TABS] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT]
 * @param {string} activeTab
 * @returns {{ bookmarkVisible: boolean, tagsTreeVisible: boolean }}
 */
export function getVisibilityForTab (activeTab) {
  return {
    bookmarkVisible: activeTab === TAB_BOOKMARK,
    tagsTreeVisible: activeTab === TAB_TAGS_TREE
  }
}

/**
 * [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_BOOKMARK] [IMPL-SIDE_PANEL_TABS]
 * Whether switching to the given tab should trigger a Bookmark-tab refresh (so content reflects current browser tab).
 * True when switching to Bookmark tab and it was already inited; used by switchTab to call controller.refreshPopupData().
 * @param {string} tabId
 * @param {boolean} wasBookmarkInited
 * @returns {boolean}
 */
export function shouldRefreshBookmarkTabWhenSwitching (tabId, wasBookmarkInited) {
  return tabId === TAB_BOOKMARK && wasBookmarkInited
}

/**
 * [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_BOOKMARK] [IMPL-SIDE_PANEL_TABS]
 * Whether the Bookmark tab should refresh when the browser tab changes (onActivated/onUpdated). True when Bookmark tab is visible and controller exists; used by refreshBookmarkTabIfVisible (prompt refresh like badge).
 * @param {string} activeTab
 * @param {boolean} hasController
 * @returns {boolean}
 */
export function shouldRefreshBookmarkTabOnTabChange (activeTab, hasController) {
  return activeTab === TAB_BOOKMARK && !!hasController
}

/**
 * [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [ARCH-SIDE_PANEL_TABS] [IMPL-SIDE_PANEL_TABS] [IMPL-SIDE_PANEL_TAGS_TREE]
 * Whether the Tags tree tab should refresh when the browser tab changes (onActivated/onUpdated). True when Tags tree tab is visible and inited; used by refreshTagsTreeTabIfVisible so tag selector and tree reflect current tab's bookmark (like Bookmark tab).
 * @param {string} activeTab
 * @param {boolean} tagsTreeTabInited
 * @returns {boolean}
 */
export function shouldRefreshTagsTreeTabOnTabChange (activeTab, tagsTreeTabInited) {
  return activeTab === TAB_TAGS_TREE && !!tagsTreeTabInited
}

/**
 * [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [ARCH-SIDE_PANEL_TABS] [IMPL-SIDE_PANEL_TABS] [IMPL-SIDE_PANEL_TAGS_TREE]
 * Returns options for initTagsTreeTab so the Tags tree tab displays the current URL's DB record (tag selector and tree reflect current bookmark tags). Pure helper; used on panel load when restored tab is Tags tree and when switching to Tags tree in switchTab.
 * @param {{ currentPin?: { tags?: string|string[] }, normalizeTags: (t: *) => string[] } | null | undefined} controller - PopupController-like object with currentPin and normalizeTags
 * @returns {{ currentBookmarkTags: string[] }}
 */
export function getTagsTreeInitOptions (controller) {
  if (!controller) return { currentBookmarkTags: [] }
  const raw = controller.normalizeTags(controller.currentPin?.tags) || []
  return { currentBookmarkTags: Array.isArray(raw) ? raw : [] }
}
