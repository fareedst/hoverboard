/**
 * [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] Badge compares tab URL state and updates icon/count on saveTag/deleteTag/saveBookmark.
 * [REQ-BADGE_INDICATORS] [IMPL-URL_TAGS_DISPLAY] Uses getBadgeDisplayValue for single source of badge text/count.
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
