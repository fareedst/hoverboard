// MV3-001: Service worker implementation for Manifest V3 migration
/**
 * Hoverboard Extension - Service Worker (Manifest V3)
 * Main background service for handling extension events and API communication
 */

// MV3-001: Modern ES6 module imports for V3 architecture
import { MessageHandler, MESSAGE_TYPES } from './message-handler.js'
import { PinboardService } from '../features/pinboard/pinboard-service.js'
import { LocalBookmarkService } from '../features/storage/local-bookmark-service.js'
import { ConfigManager } from '../config/config-manager.js'
import { BadgeManager } from './badge-manager.js'
// [SAFARI-EXT-SHIM-001] Import browser API abstraction for cross-browser support
import { browser } from '../shared/safari-shim.js' // [SAFARI-EXT-SHIM-001]

/**
 * [IMMUTABLE-REQ-TAG-003] - Recent Tags Memory Manager
 * Manages shared memory for user-driven recent tags across extension windows
 */
class RecentTagsMemoryManager {
  constructor () {
    // [IMMUTABLE-REQ-TAG-003] - Shared memory for recent tags
    this.recentTags = []
    this.maxListSize = 50 // Configurable maximum list size
    this.lastUpdated = null
  }

  /**
   * [IMMUTABLE-REQ-TAG-003] - Get all recent tags from shared memory
   * @returns {Array} Array of recent tag objects
   */
  getRecentTags () {
    return [...this.recentTags] // Return copy to prevent external modification
  }

  /**
   * [IMMUTABLE-REQ-TAG-003] - Add tag to recent list (current site only)
   * @param {string} tagName - Tag name to add
   * @param {string} currentSiteUrl - Current site URL for scope validation
   * @returns {boolean} Success status
   */
  addTag (tagName, currentSiteUrl) {
    try {
      if (!tagName || !currentSiteUrl) {
        console.error('[IMMUTABLE-REQ-TAG-003] Invalid parameters for addTag:', { tagName, currentSiteUrl })
        return false
      }

      const now = new Date()

      // Check if tag already exists in list
      const existingTagIndex = this.recentTags.findIndex(tag => tag.name === tagName)

      if (existingTagIndex >= 0) {
        // Update existing tag
        this.recentTags[existingTagIndex] = {
          ...this.recentTags[existingTagIndex],
          count: (this.recentTags[existingTagIndex].count || 0) + 1,
          lastUsed: now.toISOString()
        }
      } else {
        // Add new tag to list
        const newTag = {
          name: tagName,
          count: 1,
          lastUsed: now.toISOString(),
          addedFromSite: currentSiteUrl
        }
        this.recentTags.push(newTag)
      }

      // Sort by lastUsed timestamp (most recent first) and limit list size
      this.recentTags.sort((a, b) => {
        const dateA = new Date(a.lastUsed)
        const dateB = new Date(b.lastUsed)
        return dateB - dateA
      })

      // Limit list size
      if (this.recentTags.length > this.maxListSize) {
        this.recentTags = this.recentTags.slice(0, this.maxListSize)
      }

      this.lastUpdated = now.toISOString()

      console.log('[IMMUTABLE-REQ-TAG-003] Successfully added tag to shared memory:', { tagName, currentSiteUrl })
      return true
    } catch (error) {
      console.error('[IMMUTABLE-REQ-TAG-003] Error adding tag to shared memory:', error)
      return false
    }
  }

  /**
   * [IMMUTABLE-REQ-TAG-003] - Clear all recent tags (called on extension reload)
   */
  clearRecentTags () {
    this.recentTags = []
    this.lastUpdated = null
    console.log('[IMMUTABLE-REQ-TAG-003] Cleared recent tags from shared memory')
  }

  /**
   * [IMMUTABLE-REQ-TAG-003] - Get memory status for debugging
   * @returns {Object} Memory status information
   */
  getMemoryStatus () {
    return {
      tagCount: this.recentTags.length,
      maxListSize: this.maxListSize,
      lastUpdated: this.lastUpdated,
      tags: this.recentTags.map(tag => ({
        name: tag.name,
        count: tag.count,
        lastUsed: tag.lastUsed
      }))
    }
  }
}

// MV3-001: Main service worker class for V3 architecture
class HoverboardServiceWorker {
  constructor () {
    // MV3-001: Initialize core service components (default provider until async init)
    this.messageHandler = new MessageHandler()
    this.configManager = new ConfigManager()
    this.badgeManager = new BadgeManager()
    // [ARCH-LOCAL_STORAGE_PROVIDER] Active bookmark provider (set by initBookmarkProvider)
    this.bookmarkProvider = this.messageHandler.bookmarkProvider

    // [IMMUTABLE-REQ-TAG-003] - Initialize shared memory for recent tags
    this.recentTagsMemory = new RecentTagsMemoryManager()

    this._providerInitialized = false

    // MV3-001: Set up V3 event listeners
    this.setupEventListeners()
  }

  /**
   * [ARCH-LOCAL_STORAGE_PROVIDER] Create the active bookmark provider from config and wire MessageHandler.
   */
  async initBookmarkProvider () {
    const mode = await this.configManager.getStorageMode()
    const tagService = this.messageHandler.tagService
    const provider = mode === 'local'
      ? new LocalBookmarkService(tagService)
      : new PinboardService(tagService)
    tagService.pinboardService = provider
    this.bookmarkProvider = provider
    this.messageHandler.setBookmarkProvider(provider)
    this._providerInitialized = true
    console.log('[SERVICE-WORKER] [ARCH-LOCAL_STORAGE_PROVIDER] Bookmark provider initialized:', mode)
  }

  // MV3-001: Set up all V3 service worker event listeners
  setupEventListeners () {
    // MV3-001: Handle extension installation and updates
    browser.runtime.onInstalled.addListener((details) => {
      this.handleInstall(details)
    })

    // MV3-001: Handle messages from content scripts and popup
    // [SAFARI-EXT-IMPL-001] Use browser API for cross-browser compatibility
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('[SERVICE-WORKER] Received message:', message)

      // Handle async response properly for Manifest V3
      this.handleMessage(message, sender)
        .then(response => {
          console.log('[SERVICE-WORKER] Sending response:', response)
          sendResponse(response)
        })
        .catch(error => {
          console.error('[SERVICE-WORKER] Message error:', error)
          sendResponse({ success: false, error: error.message })
        })

      // Return true to indicate we will respond asynchronously
      return true
    })

    // MV3-001: Handle tab activation for badge updates
    browser.tabs.onActivated.addListener((activeInfo) => {
      this.handleTabActivated(activeInfo)
    })

    // MV3-EXT-IMPL-001: Handle tab updates for badge management
    browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      this.handleTabUpdated(tabId, changeInfo, tab)
    })

    // [IMMUTABLE-REQ-TAG-003] - Handle extension reload to clear shared memory
    browser.runtime.onStartup.addListener(() => {
      this.handleExtensionStartup()
    })
  }

  // [IMMUTABLE-REQ-TAG-003] - Handle extension startup (clears shared memory)
  async handleExtensionStartup () {
    console.log('[IMMUTABLE-REQ-TAG-003] Extension startup - clearing recent tags shared memory')
    this.recentTagsMemory.clearRecentTags()
  }

  // MV3-001: Handle extension installation and updates
  async handleInstall (details) {
    console.log('🚀 Hoverboard installed/updated:', details.reason)

    if (details.reason === 'install') {
      // MV3-001: Initialize default settings for first-time installation
      await this.configManager.initializeDefaults()

      // MV3-001: Set up context menus if needed
      this.setupContextMenus()
    }
  }

  async handleMessage (message, sender) {
    try {
      // [ARCH-LOCAL_STORAGE_PROVIDER] Lazy-init provider from config (storage mode)
      if (!this._providerInitialized) {
        await this.initBookmarkProvider()
      }

      // [ARCH-LOCAL_STORAGE_PROVIDER] Storage mode switch: re-init provider and respond (no processMessage)
      if (message.type === MESSAGE_TYPES.SWITCH_STORAGE_MODE) {
        await this.initBookmarkProvider()
        return { success: true, data: { switched: true } }
      }

      console.log('[SERVICE-WORKER] Processing message:', message.type)
      const response = await this.messageHandler.processMessage(message, sender)
      console.log('[SERVICE-WORKER] Message processed successfully:', response)
      return { success: true, data: response }
    } catch (error) {
      console.error('Service worker message error:', error)
      return { success: false, error: error.message }
    }
  }

  async handleTabActivated (activeInfo) {
    try {
      const tab = await browser.tabs.get(activeInfo.tabId)
      if (tab.url) {
        await this.updateBadgeForTab(tab)
      }
    } catch (error) {
      console.error('Tab activation error:', error)
    }
  }

  async handleTabUpdated (tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && tab.url) {
      try {
        await this.updateBadgeForTab(tab)
      } catch (error) {
        console.error('Tab update error:', error)
      }
    }
  }

  async updateBadgeForTab (tab) {
    const config = await this.configManager.getConfig()
    if (!config.setIconOnLoad) return

    try {
      if (!this._providerInitialized) {
        await this.initBookmarkProvider()
      }
      const bookmark = await this.bookmarkProvider.getBookmarkForUrl(tab.url)
      await this.badgeManager.updateBadge(tab.id, bookmark)
    } catch (error) {
      console.error('Badge update error:', error)
    }
  }

  setupContextMenus () {
    // Add context menu items if needed
    // browser.contextMenus.create({
    //   id: 'hoverboard-bookmark',
    //   title: 'Bookmark with Hoverboard',
    //   contexts: ['page']
    // });
  }
}

// MV3-001: Initialize the service worker for V3 architecture
const serviceWorker = new HoverboardServiceWorker()

// [IMMUTABLE-REQ-TAG-003] - Make shared memory accessible globally
if (serviceWorker.recentTagsMemory) {
  self.recentTagsMemory = serviceWorker.recentTagsMemory
  globalThis.recentTagsMemory = serviceWorker.recentTagsMemory
}

// MV3-001: Export for testing and external access
export { HoverboardServiceWorker }

// MV3-001: Global service worker ready indicator
console.log('✅ Hoverboard Service Worker (V3) loaded and ready!')
