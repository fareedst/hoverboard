/**
 * Message Handler - Modern message routing system for Hoverboard
 * Replaces legacy message passing with typed, async-first architecture
 */

import { PinboardService } from '../features/pinboard/pinboard-service.js'
import { TagService } from '../features/tagging/tag-service.js'
import { ConfigManager } from '../config/config-manager.js'

// Message type constants - migrated from config.js
export const MESSAGE_TYPES = {
  // Data retrieval
  GET_CURRENT_BOOKMARK: 'getCurrentBookmark',
  GET_RECENT_BOOKMARKS: 'getRecentBookmarks',
  GET_OPTIONS: 'getOptions',
  GET_TAB_ID: 'getTabId',

  // Bookmark operations
  SAVE_BOOKMARK: 'saveBookmark',
  DELETE_BOOKMARK: 'deleteBookmark',
  SAVE_TAG: 'saveTag',
  DELETE_TAG: 'deleteTag',

  // UI operations
  TOGGLE_HOVER: 'toggleHover',
  HIDE_OVERLAY: 'hideOverlay',
  REFRESH_DATA: 'refreshData',
  REFRESH_HOVER: 'refreshHover',

  // Site management
  INHIBIT_URL: 'inhibitUrl',

  // Search operations
  SEARCH_TITLE: 'searchTitle',
  SEARCH_TITLE_TEXT: 'searchTitleText',

  // Development/debug
  DEV_COMMAND: 'devCommand',
  ECHO: 'echo'
}

export class MessageHandler {
  constructor () {
    this.pinboardService = new PinboardService()
    this.tagService = new TagService()
    this.configManager = new ConfigManager()
  }

  /**
   * Process incoming messages with modern async/await pattern
   * @param {Object} message - The message object
   * @param {Object} sender - Chrome extension sender info
   * @returns {Promise<any>} - Response data
   */
  async processMessage (message, sender) {
    const { type, data } = message
    const tabId = sender.tab?.id
    const url = sender.tab?.url

    console.log(`Processing message: ${type}`, { data, tabId, url })

    switch (type) {
      case MESSAGE_TYPES.GET_CURRENT_BOOKMARK:
        return this.handleGetCurrentBookmark(data, url, tabId)

      case MESSAGE_TYPES.GET_RECENT_BOOKMARKS:
        return this.handleGetRecentBookmarks(data, url)

      case MESSAGE_TYPES.GET_OPTIONS:
        return this.handleGetOptions()

      case MESSAGE_TYPES.SAVE_BOOKMARK:
        return this.handleSaveBookmark(data)

      case MESSAGE_TYPES.DELETE_BOOKMARK:
        return this.handleDeleteBookmark(data)

      case MESSAGE_TYPES.SAVE_TAG:
        return this.handleSaveTag(data)

      case MESSAGE_TYPES.DELETE_TAG:
        return this.handleDeleteTag(data)

      case MESSAGE_TYPES.INHIBIT_URL:
        return this.handleInhibitUrl(data)

      case MESSAGE_TYPES.SEARCH_TITLE:
        return this.handleSearchTitle(data, tabId)

      case MESSAGE_TYPES.GET_TAB_ID:
        return { tabId }

      case MESSAGE_TYPES.ECHO:
        return { echo: data, timestamp: Date.now() }

      default:
        throw new Error(`Unknown message type: ${type}`)
    }
  }

  async handleGetCurrentBookmark (data, url, tabId) {
    if (!url) {
      throw new Error('No URL provided')
    }

    // Check if URL is allowed (not in inhibit list)
    const isAllowed = await this.configManager.isUrlAllowed(url)
    if (!isAllowed) {
      return { blocked: true, url }
    }

    // Get bookmark data from Pinboard
    const bookmark = await this.pinboardService.getBookmarkForUrl(url, data.title)

    // Update browser badge if configured
    const config = await this.configManager.getConfig()
    if (config.setIconOnLoad && tabId) {
      // Badge update handled by service worker
    }

    return bookmark
  }

  async handleGetRecentBookmarks (data, senderUrl) {
    const recentTags = await this.tagService.getRecentTags({
      description: data.description,
      time: data.time,
      extended: data.extended,
      shared: data.shared,
      tags: data.tags,
      toread: data.toread,
      senderUrl
    })

    return {
      ...data,
      recentTags
    }
  }

  async handleGetOptions () {
    return this.configManager.getOptions()
  }

  async handleSaveBookmark (data) {
    return this.pinboardService.saveBookmark(data)
  }

  async handleDeleteBookmark (data) {
    return this.pinboardService.deleteBookmark(data.url)
  }

  async handleSaveTag (data) {
    return this.pinboardService.saveTag(data)
  }

  async handleDeleteTag (data) {
    return this.pinboardService.deleteTag(data)
  }

  async handleInhibitUrl (data) {
    return this.configManager.addInhibitUrl(data.url)
  }

  async handleSearchTitle (data, tabId) {
    // TODO: Implement title search functionality
    // This was a complex feature in the original code
    return { searchCount: 0, tabId }
  }

  /**
   * Send message to content script
   * @param {number} tabId - Tab ID to send message to
   * @param {Object} message - Message to send
   */
  async sendToTab (tabId, message) {
    try {
      await chrome.tabs.sendMessage(tabId, message)
    } catch (error) {
      console.error('Failed to send message to tab:', error)
    }
  }

  /**
   * Broadcast message to all tabs
   * @param {Object} message - Message to broadcast
   */
  async broadcastToAllTabs (message) {
    try {
      const tabs = await chrome.tabs.query({})
      const promises = tabs.map(tab =>
        this.sendToTab(tab.id, message).catch(() => {
          // Ignore errors for inactive tabs
        })
      )
      await Promise.all(promises)
    } catch (error) {
      console.error('Failed to broadcast message:', error)
    }
  }
}
