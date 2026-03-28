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
// [SAFARI-EXT-SHIM-001] Import browser API abstraction for cross-browser support
import { browser } from '../shared/safari-shim.js' // [SAFARI-EXT-SHIM-001]
import { RecentTagsMemoryManager } from '../features/tagging/recent-tags-memory-manager.js'

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
    // [SAFARI-EXT-SERVICE-001] Use native Chrome API for service worker event listeners
    chrome.runtime.onInstalled.addListener((details) => {
      this.handleInstall(details)
    })

    // MV3-001: Handle messages from content scripts and popup
    // [SAFARI-EXT-SERVICE-001] Use native Chrome API for proper async message handling
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
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
    // [SAFARI-EXT-SERVICE-001] Use native Chrome API for tab event listeners
    chrome.tabs.onActivated.addListener((activeInfo) => {
      this.handleTabActivated(activeInfo)
    })

    // MV3-EXT-IMPL-001: Handle tab updates for badge management
    // [SAFARI-EXT-SERVICE-001] Use native Chrome API for tab event listeners
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      this.handleTabUpdated(tabId, changeInfo, tab)
    })

    // [IMMUTABLE-REQ-TAG-003] - Handle extension reload to clear shared memory
    // [SAFARI-EXT-SERVICE-001] Use native Chrome API for runtime event listeners
    chrome.runtime.onStartup.addListener(() => {
      this.handleExtensionStartup()
    })
  }

  // [IMMUTABLE-REQ-TAG-003] Browser profile startup: clear persisted user recent tags ([REQ-RECENT_TAGS_SYSTEM] fresh session).
  async handleExtensionStartup () {
    console.log('[IMMUTABLE-REQ-TAG-003] Extension startup - clearing recent tags shared memory and storage')
    await this.recentTagsMemory.clearRecentTags()
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
      console.log('[SERVICE-WORKER] Processing message:', message.type)
      const response = await this.messageHandler.processMessage(message, sender)
      console.log('[SERVICE-WORKER] Message processed successfully:', response)

      // [IMPL-BADGE_REFRESH] [ARCH-BADGE] [REQ-BADGE_INDICATORS] After saveTag/deleteTag/saveBookmark success: resolve tab, updateBadgeForTab(tab).
      const badgeRefreshTypes = ['saveTag', 'deleteTag', 'saveBookmark']
      if (badgeRefreshTypes.includes(message.type)) {
        let tab = sender.tab
        if (!tab && message.type === 'saveBookmark') {
          const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
          if (tabs.length > 0) tab = tabs[0]
        }
        if (tab) await this.updateBadgeForTab(tab)
      }

      return { success: true, data: response }
    } catch (error) {
      console.error('Service worker message error:', error)
      return { success: false, error: error.message }
    }
  }

  async handleTabActivated (activeInfo) {
    try {
      // [SAFARI-EXT-SERVICE-001] Use native Chrome API for tab operations
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
      // [SAFARI-EXT-SERVICE-001] Use native Chrome API for badge operations
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
