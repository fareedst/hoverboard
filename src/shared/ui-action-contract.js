/**
 * UI Action Contract - Single source of truth for message types and UI action IDs
 * [IMPL-UI_ACTION_CONTRACT] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION]
 * Used by tests, inspector, and E2E to assert on actions and message flow.
 */

import { MESSAGE_TYPES } from '../core/message-handler.js'

export { MESSAGE_TYPES }

/**
 * Popup action IDs (from UIManager events / PopupController handlers).
 * Maps to message type(s) and payload shape used when the action is triggered.
 */
export const POPUP_ACTION_IDS = {
  showHoverboard: 'showHoverboard',
  togglePrivate: 'togglePrivate',
  readLater: 'readLater',
  deletePin: 'deletePin',
  addTag: 'addTag',
  removeTag: 'removeTag',
  search: 'search',
  refreshData: 'refreshData',
  reloadExtension: 'reloadExtension',
  openOptions: 'openOptions',
  openBookmarksIndex: 'openBookmarksIndex',
  openBrowserBookmarkImport: 'openBrowserBookmarkImport',
  openTagsTree: 'openTagsTree', // [REQ-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]
  storageBackendChange: 'storageBackendChange',
  showHoverOnPageLoadChange: 'showHoverOnPageLoadChange',
  retry: 'retry'
}

/**
 * Map popup action ID -> primary message type (and optional note for sendToTab vs sendMessage).
 * Used by inspector and tests to correlate UI actions with message flow.
 */
export const POPUP_ACTION_TO_MESSAGE = {
  [POPUP_ACTION_IDS.showHoverboard]: MESSAGE_TYPES.TOGGLE_HOVER, // sendToTab
  [POPUP_ACTION_IDS.togglePrivate]: MESSAGE_TYPES.SAVE_BOOKMARK,
  [POPUP_ACTION_IDS.readLater]: MESSAGE_TYPES.SAVE_BOOKMARK,
  [POPUP_ACTION_IDS.deletePin]: MESSAGE_TYPES.DELETE_BOOKMARK,
  [POPUP_ACTION_IDS.addTag]: MESSAGE_TYPES.SAVE_TAG,
  [POPUP_ACTION_IDS.removeTag]: MESSAGE_TYPES.DELETE_TAG,
  [POPUP_ACTION_IDS.search]: MESSAGE_TYPES.SEARCH_TABS,
  [POPUP_ACTION_IDS.refreshData]: 'getCurrentBookmark', // popup refresh uses getCurrentBookmark + getTagsForUrl
  [POPUP_ACTION_IDS.reloadExtension]: null, // no message; chrome.tabs.reload
  [POPUP_ACTION_IDS.openOptions]: null, // chrome.runtime.openOptionsPage
  [POPUP_ACTION_IDS.openBookmarksIndex]: null, // chrome.tabs.create
  [POPUP_ACTION_IDS.openBrowserBookmarkImport]: null, // chrome.tabs.create [REQ-BROWSER_BOOKMARK_IMPORT]
  [POPUP_ACTION_IDS.openTagsTree]: MESSAGE_TYPES.OPEN_SIDE_PANEL, // [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE] Popup action maps to OPEN_SIDE_PANEL; SW opens side panel with cached windowId
  [POPUP_ACTION_IDS.storageBackendChange]: MESSAGE_TYPES.MOVE_BOOKMARK_TO_STORAGE,
  [POPUP_ACTION_IDS.showHoverOnPageLoadChange]: MESSAGE_TYPES.UPDATE_OVERLAY_CONFIG,
  [POPUP_ACTION_IDS.retry]: null // retry load
}

/**
 * Content script message types (handled by content-main handleMessage).
 * Used by inspector to record actions when content script handles a message.
 */
export const CONTENT_MESSAGE_TYPES = [
  'TOGGLE_HOVER',
  'HIDE_OVERLAY',
  'REFRESH_DATA',
  'REFRESH_HOVER',
  'CLOSE_IF_TO_READ',
  'PING',
  'SHOW_BOOKMARK_DIALOG',
  'TOGGLE_HOVER_OVERLAY',
  'UPDATE_CONFIG',
  'updateOverlayTransparency',
  'CHECK_PAGE_STATE',
  'BOOKMARK_UPDATED',
  'TAG_UPDATED',
  'GET_OVERLAY_STATE'
]

/**
 * Overlay action IDs (user actions within the overlay UI).
 * Used by overlay test harness action log.
 */
export const OVERLAY_ACTION_IDS = {
  refresh: 'refresh',
  close: 'close',
  tagAdded: 'tag-added',
  tagRemoved: 'tag-removed',
  togglePrivate: 'togglePrivate',
  toggleReadLater: 'toggleReadLater'
}
