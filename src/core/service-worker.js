// MV3-001: Service worker implementation for Manifest V3 migration
/**
 * Hoverboard Extension - Service Worker (Manifest V3)
 * Main background service for handling extension events and API communication
 */

// MV3-001: Modern ES6 module imports for V3 architecture
import { MessageHandler } from './message-handler.js'
import { PinboardService } from '../features/pinboard/pinboard-service.js'
import { ConfigManager } from '../config/config-manager.js'
import { BadgeManager } from './badge-manager.js'

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
    // MV3-001: Initialize core service components
    this.messageHandler = new MessageHandler()
    this.pinboardService = new PinboardService()
    this.configManager = new ConfigManager()
    this.badgeManager = new BadgeManager()

    // [IMMUTABLE-REQ-TAG-003] - Initialize shared memory for recent tags
    this.recentTagsMemory = new RecentTagsMemoryManager()

    // MV3-001: Set up V3 event listeners
    this.setupEventListeners()
  }

  // MV3-001: Set up all V3 service worker event listeners
  setupEventListeners () {
    // MV3-001: Handle extension installation and updates
    chrome.runtime.onInstalled.addListener((details) => {
      this.handleInstall(details)
    })

    // MV3-001: Handle messages from content scripts and popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse)
      return true // Keep message channel open for async responses
    })

    // MV3-001: Handle tab activation for badge updates
    chrome.tabs.onActivated.addListener((activeInfo) => {
      this.handleTabActivated(activeInfo)
    })

    // MV3-001: Handle tab updates for badge management
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      this.handleTabUpdated(tabId, changeInfo, tab)
    })

    // [IMMUTABLE-REQ-TAG-003] - Handle extension reload to clear shared memory
    chrome.runtime.onStartup.addListener(() => {
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

  async handleMessage (message, sender, sendResponse) {
    try {
      const response = await this.messageHandler.processMessage(message, sender)
      sendResponse({ success: true, data: response })
    } catch (error) {
      console.error('Service worker message error:', error)
      sendResponse({ success: false, error: error.message })
    }
  }

  async handleTabActivated (activeInfo) {
    try {
      const tab = await chrome.tabs.get(activeInfo.tabId)
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
      const bookmark = await this.pinboardService.getBookmarkForUrl(tab.url)
      await this.badgeManager.updateBadge(tab.id, bookmark)
    } catch (error) {
      console.error('Badge update error:', error)
    }
  }

  setupContextMenus () {
    // Add context menu items if needed
    // chrome.contextMenus.create({
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
