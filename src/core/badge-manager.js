/**
 * === IMPL-FULL-BLOCK: IMPL-BOOKMARK_STATE_SYNC ===
 * [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] — BOOKMARK_UPDATED broadcast after overlay persist; popup and badge refresh so state is consistent.
 *
 * ## MAIN
 *
 * - [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] How: Logical block for IMPL-BOOKMARK_STATE_SYNC.
 * - Contract:
 *   - INPUT: user actions (overlay toggle, tag save/delete, bookmark save); processMessage result
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: consistent bookmark state across overlay, popup, badge
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: overlay state, popup state, badge state; BOOKMARK_UPDATED broadcast
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: MAIN
 *   - How (sub-block): Send message to backend; on success broadcast BOOKMARK_UPDATED.
 *   - 1. ON overlay toggle (saveBookmark / saveTag / deleteTag):
 *   - 2.   SEND message to backend; await processMessage result
 *   - 3.   BROADCAST BOOKMARK_UPDATED (so other surfaces can refresh)
 *   - How (sub-block): On saveTag/deleteTag/saveBookmark result compare tab URL state and update icon/count.
 *   - 4. Badge manager:
 *   - 5.   ON message result (saveTag | deleteTag | saveBookmark): compare current tab URL state with stored state; UPDATE badge icon/count
 *
 * ## OBSERVER_BOOKMARK_UPDATED_APPLY_EXTERNAL
 *
 * - [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [ARCH-MESSAGE_HANDLING] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] How: Constructor-path observer listener — synchronous, returns undefined, re-fetches pin/tags via applyExternalBookmarkUpdate in a detached promise. Distinct from setupRealTimeUpdates full refresh (IMPL-POPUP_SESSION OBSERVER_BOOKMARK_UPDATED_FULL_REFRESH). Chrome 144+ treats a promise-returning listener as answering and would deliver null to the SW sender.
 * - Contract:
 *   - INPUT: runtime.onMessage envelope (any type); BOOKMARK_UPDATED triggers refresh
 *   - PRE: PopupController constructed; chrome.runtime.onMessage available when registering
 *   - OUTPUT: undefined (never a Promise, never sendResponse); pin/tags UI may update asynchronously
 *   - POST:
 *     - success => listener returned undefined; unrelated types left the response channel free
 *     - BOOKMARK_UPDATED => detached applyExternalBookmarkUpdate started (or no-op when no currentTab)
 *   - FAILURE_MODES: RefreshFailed (caught inside detached chain; debugError; does not answer message)
 *   - DATA: currentTab; currentPin; UIManager tag/privacy/read-later widgets
 *   - DATA_TRANSITION: on BOOKMARK_UPDATED success path, currentPin and chip UI updated from re-fetch; else unchanged
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: OBSERVER_BOOKMARK_UPDATED_APPLY_EXTERNAL
 *   - REGISTER runtime.onMessage as synchronous function:
 *   -   IF message?.type !== 'BOOKMARK_UPDATED': RETURN undefined
 *   -   START detached applyExternalBookmarkUpdate(); CATCH → debugError
 *   -   RETURN undefined
 *
 * ## OBSERVER_BOOKMARK_UPDATED_FULL_REFRESH
 *
 * - [IMPL-BOOKMARK_STATE_SYNC] [IMPL-POPUP_SESSION] [ARCH-BOOKMARK_STATE_SYNC] [ARCH-POPUP_SESSION] [ARCH-MESSAGE_HANDLING] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [REQ-POPUP_PERSISTENT_SESSION] How: setupRealTimeUpdates observer — synchronous, returns undefined, runs refreshOnExternalBookmarkUpdate (refreshPopupData then updateOverlayState) in a detached promise. Complements constructor applyExternalBookmarkUpdate path; duplicate refresh is an accepted non-goal.
 * - Contract:
 *   - INPUT: runtime.onMessage envelope (any type); BOOKMARK_UPDATED triggers full refresh
 *   - PRE: setupRealTimeUpdates registered; controller may be initialized
 *   - OUTPUT: undefined; full This Page refresh may run asynchronously
 *   - POST:
 *     - success => listener returned undefined; response channel not claimed
 *     - BOOKMARK_UPDATED => detached refreshPopupData + updateOverlayState started
 *   - FAILURE_MODES: RefreshFailed (caught inside detached chain; debugError)
 *   - DATA: PopupController session state; overlay button state
 *   - DATA_TRANSITION: on success path, bookmark/suggested/overlay UI refreshed; else unchanged
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: OBSERVER_BOOKMARK_UPDATED_FULL_REFRESH
 *   - REGISTER runtime.onMessage as synchronous function:
 *   -   IF message?.type !== 'BOOKMARK_UPDATED': RETURN undefined
 *   -   START detached refreshOnExternalBookmarkUpdate(); CATCH → debugError
 *   -   RETURN undefined
 *
 * === END IMPL-FULL-BLOCK: IMPL-BOOKMARK_STATE_SYNC ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-URL_TAGS_DISPLAY ===
 * [IMPL-URL_TAGS_DISPLAY] [ARCH-URL_TAGS_DISPLAY] [REQ-URL_TAGS_DISPLAY] [REQ-BADGE_INDICATORS] [REQ-PER_BOOKMARK_STORAGE_BACKEND] — normalizeBookmarkForDisplay, getBookmarkForDisplay, getTagsForUrl, getBadgeDisplayValue; handler and popup use router and re-fetch. Contract: bookmark or provider+url; normalized bookmark, tags, or badge value.
 *
 * ## NORMALIZE_BOOKMARK_FOR_DISPLAY
 *
 * - [IMPL-URL_TAGS_DISPLAY] [ARCH-URL_TAGS_DISPLAY] [REQ-URL_TAGS_DISPLAY] [REQ-BADGE_INDICATORS] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Implements normalizeBookmarkForDisplay(bookmark) behavior for IMPL-URL_TAGS_DISPLAY.
 * - Contract:
 *   - INPUT: bookmark (raw from provider), provider + url + title (for getBookmarkForDisplay), provider + url (for getTagsForUrl)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: normalized bookmark (tags array), tags array, badge display value (text, tagCount, flags)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: single module url-tags-manager; used by message-handler, service-worker, badge-manager, popup, bookmark-router
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: NORMALIZE_BOOKMARK_FOR_DISPLAY
 *   - IF bookmark null: RETURN null or empty shape
 *   - tags = bookmark.tags IF array ELSE (bookmark.tags split by spaces or [])
 *   - RETURN { ...bookmark, tags, ...requiredDefaults }
 *   - How (sub-block): Get raw from provider and normalize; caller sets needsAuth.
 *
 * ## GET_BOOKMARK_FOR_DISPLAY
 *
 * - [IMPL-URL_TAGS_DISPLAY] [ARCH-URL_TAGS_DISPLAY] [REQ-URL_TAGS_DISPLAY] [REQ-BADGE_INDICATORS] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Implements getBookmarkForDisplay(provider, url, title) behavior for IMPL-URL_TAGS_DISPLAY.
 * - Contract:
 *   - INPUT: bookmark (raw from provider), provider + url + title (for getBookmarkForDisplay), provider + url (for getTagsForUrl)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: normalized bookmark (tags array), tags array, badge display value (text, tagCount, flags)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: single module url-tags-manager; used by message-handler, service-worker, badge-manager, popup, bookmark-router
 *   - EFFECTS: Async
 *   - TERMINATION: total
 * - PROCEDURE: GET_BOOKMARK_FOR_DISPLAY
 *   - raw = AWAIT provider.getBookmarkForUrl(url)
 *   - RETURN normalizeBookmarkForDisplay(raw); caller sets needsAuth when !hasAuth
 *   - How (sub-block): Get bookmark for url and return tags array.
 *
 * ## GET_TAGS_FOR_URL
 *
 * - [IMPL-URL_TAGS_DISPLAY] [ARCH-URL_TAGS_DISPLAY] [REQ-URL_TAGS_DISPLAY] [REQ-BADGE_INDICATORS] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Implements getTagsForUrl(provider, url) behavior for IMPL-URL_TAGS_DISPLAY.
 * - Contract:
 *   - INPUT: bookmark (raw from provider), provider + url + title (for getBookmarkForDisplay), provider + url (for getTagsForUrl)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: normalized bookmark (tags array), tags array, badge display value (text, tagCount, flags)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: single module url-tags-manager; used by message-handler, service-worker, badge-manager, popup, bookmark-router
 *   - EFFECTS: Async
 *   - TERMINATION: total
 * - PROCEDURE: GET_TAGS_FOR_URL
 *   - bookmark = AWAIT getBookmarkForDisplay(provider, url, null)
 *   - RETURN bookmark?.tags ?? []
 *   - How (sub-block): Normalize and return text, tagCount, isPrivate, isToRead, isBookmarked, title.
 *
 * ## GET_BADGE_DISPLAY_VALUE
 *
 * - [IMPL-URL_TAGS_DISPLAY] [ARCH-URL_TAGS_DISPLAY] [REQ-URL_TAGS_DISPLAY] [REQ-BADGE_INDICATORS] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Implements getBadgeDisplayValue(bookmark, config) behavior for IMPL-URL_TAGS_DISPLAY.
 * - Contract:
 *   - INPUT: bookmark (raw from provider), provider + url + title (for getBookmarkForDisplay), provider + url (for getTagsForUrl)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: normalized bookmark (tags array), tags array, badge display value (text, tagCount, flags)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: single module url-tags-manager; used by message-handler, service-worker, badge-manager, popup, bookmark-router
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Http, State
 *   - TERMINATION: total
 * - PROCEDURE: GET_BADGE_DISPLAY_VALUE
 *   - normalized = normalizeBookmarkForDisplay(bookmark)
 *   - RETURN { text, tagCount, isPrivate, isToRead, isBookmarked, title }
 *   - How (sub-block): Handler and popup and router usage (same IMPL set).
 *   - 1. Message handler: handleGetCurrentBookmark always via getBookmarkForDisplay(router)
 *   - 2. Message handler: handleGetTagsForUrl returns getTagsForUrl
 *   - 3. Popup: getBookmarkData null only when blocked; re-fetch tags before add/remove
 *   - 4. Router: _hasTags/_isEmptyBookmark use normalizeBookmarkForDisplay
 *
 * === END IMPL-FULL-BLOCK: IMPL-URL_TAGS_DISPLAY ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-BADGE ===
 * [IMPL-BADGE] [ARCH-BADGE] [REQ-BADGE_INDICATORS] — How: drive tab-scoped badge text/color from bookmark/overlay state via service-worker badge helpers.
 *
 * ## UPDATE_BADGE_FOR_TAB
 *
 * - [IMPL-BADGE] [ARCH-BADGE] [REQ-BADGE_INDICATORS] How: resolve bookmark state for tab then set badge text/color or clear.
 * - Contract:
 *   - INPUT: tab id / URL; bookmark presence and tag signals from MessageHandler / TagService paths
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: chrome.action badge text and background color updated per tab; cleared when no bookmark
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: chrome.action API; per-tab badge cache in service worker; composed_with IMPL-BADGE_REFRESH
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: UPDATE_BADGE_FOR_TAB
 *   - IF NOT tab: RETURN
 *   - state = AWAIT resolveBookmarkStateForTab(tab)
 *   - IF state.hasBookmark: SET badge text/color from state
 *   - ELSE: CLEAR badge for tab.id
 *   - RETURN
 *   - How (sub-block): How: after successful saveTag/deleteTag/saveBookmark, refresh badge (delegates to IMPL-BADGE_REFRESH).
 *
 * ## ON_BOOKMARK_MUTATION_SUCCESS
 *
 * - [IMPL-BADGE] [ARCH-BADGE] [REQ-BADGE_INDICATORS] How: Implements ON_BOOKMARK_MUTATION_SUCCESS(message, sender) behavior for IMPL-BADGE.
 * - Contract:
 *   - INPUT: tab id / URL; bookmark presence and tag signals from MessageHandler / TagService paths
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: chrome.action badge text and background color updated per tab; cleared when no bookmark
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: chrome.action API; per-tab badge cache in service worker; composed_with IMPL-BADGE_REFRESH
 *   - EFFECTS: Async, Http, IO
 *   - TERMINATION: total
 * - PROCEDURE: ON_BOOKMARK_MUTATION_SUCCESS
 *   - tab = resolveTab(sender, message)
 *   - AWAIT UPDATE_BADGE_FOR_TAB(tab)
 *
 * === END IMPL-FULL-BLOCK: IMPL-BADGE ===
 */
import { getBadgeDisplayValue } from '../features/storage/url-tags-manager.js'

export class BadgeManager {
  constructor () {
    // Use chrome.runtime.getURL to get proper extension URLs
    this.iconPaths = {
      default: {
        16: chrome.runtime.getURL('icons/hoverboard_16.png'),
        19: chrome.runtime.getURL('icons/hoverboard_19.png'),
        32: chrome.runtime.getURL('icons/hoverboard_32.png'),
        48: chrome.runtime.getURL('icons/hoverboard_48.png')
      },
      bookmarked: {
        16: chrome.runtime.getURL('icons/hoverboard_16.png'),
        19: chrome.runtime.getURL('icons/hoverboard_19b.png'),
        32: chrome.runtime.getURL('icons/hoverboard_32.png'),
        48: chrome.runtime.getURL('icons/hoverboard_48.png')
      }
    }
  }

  /**
   * Update browser action badge for a specific tab
   * @param {number} tabId - Tab ID to update
   * @param {Object} bookmark - Bookmark data
   */
  async updateBadge (tabId, bookmark) {
    try {
      const config = await this.getConfig()
      const badgeData = this.calculateBadgeData(bookmark, config)

      await Promise.all([
        this.setBadgeText(tabId, badgeData.text),
        this.setBadgeBackgroundColor(tabId, badgeData.backgroundColor),
        this.setIcon(tabId, badgeData.iconPath),
        this.setTitle(tabId, badgeData.title)
      ])
    } catch (error) {
      console.error('Failed to update badge:', error)
    }
  }

  /**
   * Calculate badge appearance based on bookmark status.
   * [IMPL-URL_TAGS_DISPLAY] Badge text/count/title from single source (getBadgeDisplayValue).
   * @param {Object} bookmark - Bookmark data (raw or normalized)
   * @param {Object} config - Extension configuration
   * @returns {Object} Badge display data
   */
  calculateBadgeData (bookmark, config) {
    const badgeValue = getBadgeDisplayValue(bookmark, config)
    const backgroundColor = badgeValue.isBookmarked ? '#000' : '#222'
    const iconPath = badgeValue.isBookmarked ? this.iconPaths.bookmarked : this.iconPaths.default
    return {
      text: badgeValue.text,
      backgroundColor,
      iconPath,
      title: badgeValue.title
    }
  }

  /**
   * Generate tooltip title for browser action.
   * [IMPL-URL_TAGS_DISPLAY] Delegates to getBadgeDisplayValue for consistency; kept for callers that pass (bookmark, isBookmarked).
   * @param {Object} bookmark - Bookmark data
   * @param {boolean} isBookmarked - Whether page is bookmarked
   * @returns {string} Title text
   */
  generateTitle (bookmark, isBookmarked) {
    const badgeValue = getBadgeDisplayValue(bookmark || {}, this.getConfig ? {} : {})
    return badgeValue.title
  }

  /**
   * Set badge text for a tab
   * @param {number} tabId - Tab ID
   * @param {string} text - Badge text
   */
  async setBadgeText (tabId, text) {
    return chrome.action.setBadgeText({
      text: text || '',
      tabId
    })
  }

  /**
   * Set badge background color for a tab
   * @param {number} tabId - Tab ID
   * @param {string} color - Background color
   */
  async setBadgeBackgroundColor (tabId, color) {
    return chrome.action.setBadgeBackgroundColor({
      color: color || '#000',
      tabId
    })
  }

  /**
   * Set browser action icon for a tab
   * @param {number} tabId - Tab ID
   * @param {Object|string} iconPath - Icon path object or string
   */
  async setIcon (tabId, iconPath) {
    return chrome.action.setIcon({
      path: iconPath,
      tabId
    })
  }

  /**
   * Set browser action title for a tab
   * @param {number} tabId - Tab ID
   * @param {string} title - Title text
   */
  async setTitle (tabId, title) {
    return chrome.action.setTitle({
      title: title || 'Hoverboard',
      tabId
    })
  }

  /**
   * Clear badge for a tab (reset to default state)
   * @param {number} tabId - Tab ID
   */
  async clearBadge (tabId) {
    await Promise.all([
      this.setBadgeText(tabId, ''),
      this.setBadgeBackgroundColor(tabId, '#222'),
      this.setIcon(tabId, this.iconPaths.default),
      this.setTitle(tabId, 'Hoverboard')
    ])
  }

  /**
   * Get extension configuration
   * @returns {Promise<Object>} Configuration object
   */
  async getConfig () {
    // This would typically come from ConfigManager
    // For now, return default configuration
    return {
      badgeTextIfNotBookmarked: '-',
      badgeTextIfPrivate: '*',
      badgeTextIfQueued: '!',
      badgeTextIfBookmarkedNoTags: '0'
    }
  }
}
