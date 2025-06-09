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

// MV3-001: Main service worker class for V3 architecture
class HoverboardServiceWorker {
  constructor () {
    // MV3-001: Initialize core service components
    this.messageHandler = new MessageHandler()
    this.pinboardService = new PinboardService()
    this.configManager = new ConfigManager()
    this.badgeManager = new BadgeManager()

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

// MV3-001: Export for testing and external access
export { HoverboardServiceWorker }

// MV3-001: Global service worker ready indicator
console.log('✅ Hoverboard Service Worker (V3) loaded and ready!')
