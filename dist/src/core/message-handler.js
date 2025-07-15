/**
 * Message Handler - Modern message routing system for Hoverboard
 * Replaces legacy message passing with typed, async-first architecture
 */

import { PinboardService } from '../features/pinboard/pinboard-service.js'
import { TagService } from '../features/tagging/tag-service.js'
import { ConfigManager } from '../config/config-manager.js'
import { TabSearchService } from '../features/search/tab-search-service.js'
import { debugLog, debugError, browser } from '../shared/utils.js'

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
  BOOKMARK_UPDATED: 'bookmarkUpdated', // [TOGGLE-SYNC-MESSAGE-001] - New message type
  TAG_UPDATED: 'TAG_UPDATED', // [TAG-SYNC-MESSAGE-001] - New message type for tag synchronization

  // Site management
  INHIBIT_URL: 'inhibitUrl',

  // Search operations
  SEARCH_TITLE: 'searchTitle',
  SEARCH_TITLE_TEXT: 'searchTitleText',

  // [IMMUTABLE-REQ-TAG-002] Tab search operations
  SEARCH_TABS: 'searchTabs',
  GET_SEARCH_HISTORY: 'getSearchHistory',
  CLEAR_SEARCH_STATE: 'clearSearchState',

  // [IMMUTABLE-REQ-TAG-003] Recent tags operations
  ADD_TAG_TO_RECENT: 'addTagToRecent',
  GET_USER_RECENT_TAGS: 'getUserRecentTags',
  GET_SHARED_MEMORY_STATUS: 'getSharedMemoryStatus',

  // Content script lifecycle
  CONTENT_SCRIPT_READY: 'contentScriptReady',

  // Overlay configuration
  UPDATE_OVERLAY_CONFIG: 'updateOverlayConfig',
  GET_OVERLAY_CONFIG: 'getOverlayConfig',

  // Development/debug
  DEV_COMMAND: 'devCommand',
  ECHO: 'echo'
}

export class MessageHandler {
  constructor (pinboardService = null, tagService = null) {
    this.pinboardService = pinboardService || new PinboardService()
    this.tagService = tagService || new TagService()
    this.configManager = new ConfigManager()

    // [IMMUTABLE-REQ-TAG-002] Initialize tab search service
    this.tabSearchService = new TabSearchService()
  }

  /**
   * Process incoming messages with modern async/await pattern
   * @param {Object} message - The message object
   * @param {Object} sender - Chrome extension sender info
   * @returns {Promise<any>} - Response data
   */
  async processMessage (message, sender) {
    const { type, data } = message
    let tabId = sender.tab?.id
    let url = sender.tab?.url

    // If sender doesn't have tab context (e.g., popup), get current active tab
    if (!tabId && (type === MESSAGE_TYPES.SEARCH_TABS || type === MESSAGE_TYPES.GET_CURRENT_BOOKMARK)) {
      try {
        debugLog('[MESSAGE-HANDLER] Getting current active tab for popup request')

        // Try multiple strategies to get the current tab
        let tabs = await browser.tabs.query({ active: true, currentWindow: true })
        debugLog('[MESSAGE-HANDLER] Found tabs (current window):', tabs.length)

        // If no tabs found in current window, try all windows
        if (tabs.length === 0) {
          debugLog('[MESSAGE-HANDLER] No tabs in current window, trying all windows')
          tabs = await browser.tabs.query({ active: true })
          debugLog('[MESSAGE-HANDLER] Found tabs (all windows):', tabs.length)
        }

        // If still no tabs, try getting any tab
        if (tabs.length === 0) {
          debugLog('[MESSAGE-HANDLER] No active tabs found, trying any tab')
          tabs = await browser.tabs.query({})
          debugLog('[MESSAGE-HANDLER] Found total tabs:', tabs.length)

          // Use the first tab if available
          if (tabs.length > 0) {
            tabId = tabs[0].id
            url = tabs[0].url
            debugLog('[MESSAGE-HANDLER] Using first available tab:', { tabId, url })
          }
        } else {
          tabId = tabs[0].id
          url = tabs[0].url
          debugLog('[MESSAGE-HANDLER] Using active tab:', { tabId, url })
        }

        if (!tabId) {
          debugError('[MESSAGE-HANDLER] No tabs available at all')
        }
      } catch (error) {
        debugError('[MESSAGE-HANDLER] Failed to get current tab:', error)
        debugError('[MESSAGE-HANDLER] Error details:', {
          message: error.message,
          stack: error.stack,
          chromeError: browser.runtime.lastError
        })
      }
    }

    debugLog(`Processing message: ${type}`, { data, tabId, url })

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

      // [IMMUTABLE-REQ-TAG-002] Handle tab search messages
      case MESSAGE_TYPES.SEARCH_TABS:
        return this.handleSearchTabs(data, tabId)

      case MESSAGE_TYPES.GET_SEARCH_HISTORY:
        return this.handleGetSearchHistory()

      case MESSAGE_TYPES.CLEAR_SEARCH_STATE:
        return this.handleClearSearchState()

      // [IMMUTABLE-REQ-TAG-003] Handle recent tags messages
      case MESSAGE_TYPES.ADD_TAG_TO_RECENT:
        return this.handleAddTagToRecent(data)

      case MESSAGE_TYPES.GET_USER_RECENT_TAGS:
        return this.handleGetUserRecentTags(data)

      case MESSAGE_TYPES.GET_SHARED_MEMORY_STATUS:
        return this.handleGetSharedMemoryStatus()

      case MESSAGE_TYPES.GET_TAB_ID:
        // For content scripts, the tabId should come from sender.tab.id
        // For popup/background, we need to get the current active tab
        debugLog('[MESSAGE-HANDLER] Processing GET_TAB_ID, current tabId:', tabId)
        if (!tabId) {
          try {
            debugLog('[MESSAGE-HANDLER] Getting current active tab for GET_TAB_ID')
            const tabs = await browser.tabs.query({ active: true, currentWindow: true })
            if (tabs.length > 0) {
              tabId = tabs[0].id
              debugLog('[MESSAGE-HANDLER] Found active tab:', tabId)
            } else {
              debugLog('[MESSAGE-HANDLER] No active tab found, using sender tab')
            }
          } catch (error) {
            debugError('[MESSAGE-HANDLER] Error getting active tab:', error)
          }
        }
        debugLog('[MESSAGE-HANDLER] Returning tabId:', tabId)
        return { tabId }

      case MESSAGE_TYPES.CONTENT_SCRIPT_READY:
        return this.handleContentScriptReady(data, tabId, url)

      case MESSAGE_TYPES.UPDATE_OVERLAY_CONFIG:
        return this.handleUpdateOverlayConfig(data)

      case MESSAGE_TYPES.GET_OVERLAY_CONFIG:
        return this.handleGetOverlayConfig()

      // [TOGGLE-SYNC-MESSAGE-001] - Handle bookmark updates across interfaces
      case MESSAGE_TYPES.BOOKMARK_UPDATED:
        debugLog('[MessageHandler] BOOKMARK_UPDATED message received', { data, tabId })
        return this.handleBookmarkUpdated(data, tabId)

      // [TAG-SYNC-MESSAGE-001] - Handle tag updates across interfaces
      case MESSAGE_TYPES.TAG_UPDATED:
        return this.handleTagUpdated(data, tabId)

      case MESSAGE_TYPES.ECHO:
        return { echo: data, timestamp: Date.now() }

      default:
        throw new Error(`Unknown message type: ${type}`)
    }
  }

  async handleGetCurrentBookmark (data, url, tabId) {
    // Use URL from data if sender doesn't have tab context (e.g., popup messages)
    const targetUrl = url || data?.url
    if (!targetUrl) {
      throw new Error('No URL provided')
    }

    debugLog('[MESSAGE-HANDLER] Getting bookmark for URL:', targetUrl)

    // Check if URL is allowed (not in inhibit list)
    debugLog('Checking if URL is allowed...')
    const isAllowed = await this.configManager.isUrlAllowed(targetUrl)
    if (!isAllowed) {
      return { success: true, data: { blocked: true, url: targetUrl } }
    }
    debugLog('URL is allowed, getting bookmark data...')

    // Check if auth token is available
    const hasAuth = await this.configManager.hasAuthToken()
    if (!hasAuth) {
      debugLog('No auth token available, returning empty bookmark')
      return {
        success: true,
        data: {
          description: data?.title || '',
          hash: '',
          time: '',
          extended: '',
          tag: '',
          tags: [],
          shared: 'yes',
          toread: 'no',
          url: targetUrl,
          needsAuth: true
        }
      }
    }

    // Get bookmark data from Pinboard
    debugLog('Getting bookmark data from Pinboard...')
    const bookmark = await this.pinboardService.getBookmarkForUrl(targetUrl, data?.title)
    debugLog('Bookmark data retrieved:', bookmark)

    // Update browser badge if configured
    const config = await this.configManager.getConfig()
    if (config.setIconOnLoad && tabId) {
      // Badge update handled by service worker
    }

    return { success: true, data: bookmark }
  }

  async handleGetRecentBookmarks (data, senderUrl) {
    debugLog('[MESSAGE-HANDLER] [IMMUTABLE-REQ-TAG-003] Handling getRecentBookmarks request:', data)
    debugLog('[MESSAGE-HANDLER] [IMMUTABLE-REQ-TAG-003] Sender URL:', senderUrl)

    // [IMMUTABLE-REQ-TAG-003] - Get user recent tags excluding current site
    const recentTags = await this.tagService.getUserRecentTagsExcludingCurrent(data.currentTags || [])

    debugLog('[MESSAGE-HANDLER] [IMMUTABLE-REQ-TAG-003] User recent tags (excluding current):', recentTags)

    const response = {
      ...data,
      recentTags
    }

    debugLog('[MESSAGE-HANDLER] [IMMUTABLE-REQ-TAG-003] Returning response:', response)
    return response
  }

  /**
   * [IMMUTABLE-REQ-TAG-003] - Handle tag addition to recent list (current site only)
   * @param {Object} data - Message data containing tagName and currentSiteUrl
   * @returns {Promise<Object>} Success status
   */
  async handleAddTagToRecent (data) {
    try {
      const { tagName, currentSiteUrl } = data

      debugLog('[MESSAGE-HANDLER] [IMMUTABLE-REQ-TAG-003] Adding tag to recent list:', { tagName, currentSiteUrl })

      if (!tagName || !currentSiteUrl) {
        throw new Error('tagName and currentSiteUrl are required')
      }

      // Add tag to user recent list for current site only
      const success = await this.tagService.addTagToUserRecentList(tagName, currentSiteUrl)

      debugLog('[MESSAGE-HANDLER] [IMMUTABLE-REQ-TAG-003] Tag addition result:', success)

      return { success }
    } catch (error) {
      debugError('[MESSAGE-HANDLER] [IMMUTABLE-REQ-TAG-003] Error adding tag to recent:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * [IMMUTABLE-REQ-TAG-003] - Handle get user recent tags request
   * @param {Object} data - Message data
   * @returns {Promise<Object>} Recent tags data
   */
  async handleGetUserRecentTags (data) {
    try {
      debugLog('[MESSAGE-HANDLER] [IMMUTABLE-REQ-TAG-003] Getting user recent tags')

      const recentTags = await this.tagService.getUserRecentTags()

      debugLog('[MESSAGE-HANDLER] [IMMUTABLE-REQ-TAG-003] User recent tags:', recentTags)

      return { recentTags }
    } catch (error) {
      debugError('[MESSAGE-HANDLER] [IMMUTABLE-REQ-TAG-003] Error getting user recent tags:', error)
      return { recentTags: [], error: error.message }
    }
  }

  /**
   * [IMMUTABLE-REQ-TAG-003] - Handle get shared memory status request
   * @returns {Promise<Object>} Shared memory status
   */
  async handleGetSharedMemoryStatus () {
    try {
      debugLog('[MESSAGE-HANDLER] [IMMUTABLE-REQ-TAG-003] Getting shared memory status')

      // Get the service worker instance to access shared memory
      const serviceWorker = await this.getServiceWorker()
      if (serviceWorker && serviceWorker.recentTagsMemory) {
        const status = serviceWorker.recentTagsMemory.getMemoryStatus()
        return { recentTagsMemory: serviceWorker.recentTagsMemory, status }
      }

      return { recentTagsMemory: null, status: 'not_available' }
    } catch (error) {
      debugError('[MESSAGE-HANDLER] [IMMUTABLE-REQ-TAG-003] Error getting shared memory status:', error)
      return { recentTagsMemory: null, status: 'error', error: error.message }
    }
  }

  /**
   * [IMMUTABLE-REQ-TAG-003] - Get service worker instance
   * @returns {Promise<Object|null>} Service worker instance or null
   */
  async getServiceWorker () {
    try {
      // In Manifest V3, we need to access the service worker instance
      // This is a bit tricky since we're already in the service worker context
      if (typeof self !== 'undefined' && self.recentTagsMemory) {
        return self
      }

      // Try to get it from the global scope
      if (typeof globalThis !== 'undefined' && globalThis.recentTagsMemory) {
        return globalThis
      }

      return null
    } catch (error) {
      debugError('[MESSAGE-HANDLER] [IMMUTABLE-REQ-TAG-003] Error getting service worker:', error)
      return null
    }
  }

  async handleGetOptions () {
    debugLog('[MESSAGE-HANDLER] Processing GET_OPTIONS')
    const options = await this.configManager.getOptions()
    debugLog('[MESSAGE-HANDLER] Returning options:', options)
    return options
  }

  async handleSaveBookmark (data) {
    // Fetch previous bookmark to get previous tags
    const previousBookmark = await this.pinboardService.getBookmarkForUrl(data.url)
    const previousTags = previousBookmark?.tags || []
    const newTags = Array.isArray(data.tags) ? data.tags : data.tags.split(' ').filter(tag => tag.trim())
    // Compute which tags are newly added
    const addedTags = newTags.filter(tag => !previousTags.includes(tag))

    const result = await this.pinboardService.saveBookmark(data)

    // [IMMUTABLE-REQ-TAG-001] - Only track newly added tags
    for (const tag of addedTags) {
      if (tag.trim()) {
        try {
          await this.tagService.handleTagAddition(tag.trim(), data)
        } catch (error) {
          debugError(`[IMMUTABLE-REQ-TAG-001] Failed to track tag "${tag}":`, error)
          // Don't fail the entire operation if tag tracking fails
        }
      }
    }

    // [IMMUTABLE-REQ-TAG-003] - Track newly added tags for current site only
    for (const tag of addedTags) {
      if (tag.trim()) {
        try {
          await this.tagService.addTagToUserRecentList(tag.trim(), data.url)
        } catch (error) {
          debugError(`[IMMUTABLE-REQ-TAG-003] Failed to add tag "${tag}" to user recent list:`, error)
          // Don't fail the entire operation if tag tracking fails
        }
      }
    }

    return result
  }

  async handleDeleteBookmark (data) {
    return this.pinboardService.deleteBookmark(data.url)
  }

  async handleSaveTag (data) {
    const result = await this.pinboardService.saveTag(data)

    // [IMMUTABLE-REQ-TAG-001] - Enhanced tag tracking for tag save
    if (data.value && data.value.trim()) {
      try {
        await this.tagService.handleTagAddition(data.value.trim(), data)
      } catch (error) {
        debugError(`[IMMUTABLE-REQ-TAG-001] Failed to track tag "${data.value}":`, error)
        // Don't fail the entire operation if tag tracking fails
      }
    }

    // [IMMUTABLE-REQ-TAG-003] - Track tag addition for current site only
    if (data.value && data.value.trim() && data.url) {
      try {
        await this.tagService.addTagToUserRecentList(data.value.trim(), data.url)
      } catch (error) {
        debugError(`[IMMUTABLE-REQ-TAG-003] Failed to add tag "${data.value}" to user recent list:`, error)
        // Don't fail the entire operation if tag tracking fails
      }
    }

    return result
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
   * [TAB-SEARCH-CORE] Handle tab search request
   */
  async handleSearchTabs (data, tabId) {
    try {
      const { searchText } = data

      debugLog('[TAB-SEARCH-CORE] Starting tab search:', { searchText, tabId })

      if (!searchText || !searchText.trim()) {
        throw new Error('Search text is required')
      }

      if (!tabId) {
        throw new Error('Current tab ID is required')
      }

      debugLog('[TAB-SEARCH-CORE] Calling tabSearchService.searchAndNavigate')
      const result = await this.tabSearchService.searchAndNavigate(searchText, tabId)
      debugLog('[TAB-SEARCH-CORE] Search result:', result)
      return result
    } catch (error) {
      debugError('[TAB-SEARCH-CORE] Search tabs error:', error)
      throw error
    }
  }

  /**
   * [TAB-SEARCH-STATE] Handle get search history request
   */
  async handleGetSearchHistory () {
    try {
      const history = this.tabSearchService.getSearchHistory()
      return { history }
    } catch (error) {
      debugError('[TAB-SEARCH-STATE] Get search history error:', error)
      throw error
    }
  }

  /**
   * [TAB-SEARCH-STATE] Handle clear search state request
   */
  async handleClearSearchState () {
    try {
      this.tabSearchService.clearSearchState()
      return { success: true }
    } catch (error) {
      debugError('[TAB-SEARCH-STATE] Clear search state error:', error)
      throw error
    }
  }

  async handleContentScriptReady (data, tabId, url) {
    // Handle content script ready notification
    debugLog('Content script ready:', { tabId, url, data })
    return { acknowledged: true, tabId, timestamp: Date.now() }
  }

  async handleUpdateOverlayConfig (data) {
    try {
      await this.configManager.updateConfig(data)

      // Broadcast the configuration update to all content scripts
      await this.broadcastToAllTabs({
        message: 'updateOverlayTransparency',
        config: data
      })

      return { success: true, updated: data }
    } catch (error) {
      debugError('Failed to update overlay config:', error)
      throw new Error('Failed to update overlay configuration')
    }
  }

  async handleGetOverlayConfig () {
    try {
      const config = await this.configManager.getConfig()

      return {
        overlayTransparencyMode: config.overlayTransparencyMode,
        overlayPositionMode: config.overlayPositionMode,
        overlayOpacityNormal: config.overlayOpacityNormal,
        overlayOpacityHover: config.overlayOpacityHover,
        overlayOpacityFocus: config.overlayOpacityFocus,
        overlayAdaptiveVisibility: config.overlayAdaptiveVisibility,
        overlayBlurAmount: config.overlayBlurAmount
      }
    } catch (error) {
      debugError('Failed to get overlay config:', error)
      throw new Error('Failed to get overlay configuration')
    }
  }

  /**
   * [TOGGLE-SYNC-MESSAGE-001] - Handle bookmark updates across interfaces
   * @param {Object} data - Bookmark data
   * @param {number} tabId - Tab ID
   */
  async handleBookmarkUpdated (data, tabId) {
    try {
      debugLog('[MessageHandler] handleBookmarkUpdated called', { data, tabId })
      // Update the bookmark with new privacy setting or other changes
      const result = await this.pinboardService.saveBookmark(data)
      debugLog('[MessageHandler] Bookmark updated via pinboardService.saveBookmark', { result })
      // Optionally broadcast to all tabs if needed
      await this.broadcastToAllTabs({
        type: 'BOOKMARK_UPDATED',
        data
      })
      debugLog('[MessageHandler] BOOKMARK_UPDATED broadcasted to all tabs', { data })
      return { success: true, updated: data }
    } catch (error) {
      debugError('[TOGGLE-SYNC-MESSAGE-001] Failed to handle bookmark update:', error)
      throw new Error('Failed to update bookmark across interfaces')
    }
  }

  /**
   * [TAG-SYNC-MESSAGE-001] - Handle tag updates across interfaces
   * @param {Object} data - Tag update data
   * @param {number} tabId - Tab ID
   */
  async handleTagUpdated (data, tabId) {
    try {
      debugLog('[TAG-SYNC-MESSAGE-001] Handling tag update:', data)

      // [TAG-SYNC-MESSAGE-001] - Validate tag update data
      if (!data || !data.url || !Array.isArray(data.tags)) {
        throw new Error('Invalid tag update data')
      }

      // [TAG-SYNC-MESSAGE-001] - Broadcast tag update to all tabs
      await this.broadcastToAllTabs({
        type: 'TAG_UPDATED',
        data
      })

      debugLog('[TAG-SYNC-MESSAGE-001] Tag update broadcasted successfully')
      return { success: true, updated: data }
    } catch (error) {
      debugError('[TAG-SYNC-MESSAGE-001] Failed to handle tag update:', error)
      if (error && error.message === 'Invalid tag update data') {
        throw error
      } else {
        throw new Error('Failed to update tags across interfaces')
      }
    }
  }

  /**
   * Send message to content script
   * @param {number} tabId - Tab ID to send message to
   * @param {Object} message - Message to send
   */
  async sendToTab (tabId, message) {
    try {
      await browser.tabs.sendMessage(tabId, message)
    } catch (error) {
      debugError('Failed to send message to tab:', error)
    }
  }

  /**
   * Broadcast message to all tabs
   * @param {Object} message - Message to broadcast
   */
  async broadcastToAllTabs (message) {
    try {
      const tabs = await browser.tabs.query({})
      const promises = tabs.map(tab =>
        this.sendToTab(tab.id, message).catch(() => {
          // Ignore errors for inactive tabs
        })
      )
      await Promise.all(promises)
    } catch (error) {
      debugError('Failed to broadcast message:', error)
    }
  }
}
