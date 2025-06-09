/**
 * Badge Manager - Modern badge and icon management for browser action
 * Replaces legacy BadgeAttributes class with Promise-based architecture
 */

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
   * Calculate badge appearance based on bookmark status
   * @param {Object} bookmark - Bookmark data
   * @param {Object} config - Extension configuration
   * @returns {Object} Badge display data
   */
  calculateBadgeData (bookmark, config) {
    const isBookmarked = bookmark && bookmark.hash && bookmark.hash.length > 0
    const tagCount = bookmark?.tags?.length || 0
    const isPrivate = bookmark?.shared === 'no'
    const isToRead = bookmark?.toread === 'yes'

    let text = ''
    const backgroundColor = isBookmarked ? '#000' : '#222'
    const iconPath = isBookmarked ? this.iconPaths.bookmarked : this.iconPaths.default

    if (!isBookmarked) {
      text = config.badgeTextIfNotBookmarked || '-'
    } else {
      // Build badge text
      if (isPrivate) {
        text += config.badgeTextIfPrivate || '*'
      }

      text += tagCount.toString()

      if (isToRead) {
        text += config.badgeTextIfQueued || '!'
      }
    }

    const title = this.generateTitle(bookmark, isBookmarked)

    return {
      text,
      backgroundColor,
      iconPath,
      title
    }
  }

  /**
   * Generate tooltip title for browser action
   * @param {Object} bookmark - Bookmark data
   * @param {boolean} isBookmarked - Whether page is bookmarked
   * @returns {string} Title text
   */
  generateTitle (bookmark, isBookmarked) {
    if (!isBookmarked) {
      return 'Hoverboard - Page not bookmarked'
    }

    const parts = ['Hoverboard']

    if (bookmark.description) {
      parts.push(`"${bookmark.description}"`)
    }

    if (bookmark.tags && bookmark.tags.length > 0) {
      parts.push(`Tags: ${bookmark.tags.join(', ')}`)
    }

    if (bookmark.shared === 'no') {
      parts.push('(Private)')
    }

    if (bookmark.toread === 'yes') {
      parts.push('(To Read)')
    }

    return parts.join(' | ')
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
