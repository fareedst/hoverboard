/**
 * Hoverboard Extension - Service Worker (Manifest V3)
 * Main background service for handling extension events and API communication
 */

import { MessageHandler } from './message-handler.js';
import { PinboardService } from '../features/pinboard/pinboard-service.js';
import { ConfigManager } from '../config/config-manager.js';
import { BadgeManager } from './badge-manager.js';

class HoverboardServiceWorker {
  constructor() {
    this.messageHandler = new MessageHandler();
    this.pinboardService = new PinboardService();
    this.configManager = new ConfigManager();
    this.badgeManager = new BadgeManager();
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Handle extension installation and updates
    chrome.runtime.onInstalled.addListener((details) => {
      this.handleInstall(details);
    });

    // Handle messages from content scripts and popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open for async responses
    });

    // Handle tab activation for badge updates
    chrome.tabs.onActivated.addListener((activeInfo) => {
      this.handleTabActivated(activeInfo);
    });

    // Handle tab updates for badge management
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      this.handleTabUpdated(tabId, changeInfo, tab);
    });
  }

  async handleInstall(details) {
    console.log('Hoverboard installed/updated:', details.reason);
    
    if (details.reason === 'install') {
      // Initialize default settings
      await this.configManager.initializeDefaults();
      
      // Set up context menus if needed
      this.setupContextMenus();
    }
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      const response = await this.messageHandler.processMessage(message, sender);
      sendResponse({ success: true, data: response });
    } catch (error) {
      console.error('Service worker message error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async handleTabActivated(activeInfo) {
    try {
      const tab = await chrome.tabs.get(activeInfo.tabId);
      if (tab.url) {
        await this.updateBadgeForTab(tab);
      }
    } catch (error) {
      console.error('Tab activation error:', error);
    }
  }

  async handleTabUpdated(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && tab.url) {
      try {
        await this.updateBadgeForTab(tab);
      } catch (error) {
        console.error('Tab update error:', error);
      }
    }
  }

  async updateBadgeForTab(tab) {
    const config = await this.configManager.getConfig();
    if (!config.setIconOnLoad) return;

    try {
      const bookmark = await this.pinboardService.getBookmarkForUrl(tab.url);
      await this.badgeManager.updateBadge(tab.id, bookmark);
    } catch (error) {
      console.error('Badge update error:', error);
    }
  }

  setupContextMenus() {
    // Add context menu items if needed
    // chrome.contextMenus.create({
    //   id: 'hoverboard-bookmark',
    //   title: 'Bookmark with Hoverboard',
    //   contexts: ['page']
    // });
  }
}

// Initialize the service worker
const serviceWorker = new HoverboardServiceWorker();

// Export for testing purposes
export { HoverboardServiceWorker }; 