/**
 * Hoverboard Content Script - Main Entry Point
 * Modern replacement for inject.js with jQuery-free DOM manipulation
 */

import { HoverSystem } from './hover-system.js';
import { OverlayManager } from './overlay-manager.js';
import { MessageClient } from './message-client.js';
import { DOMUtils } from './dom-utils.js';
import { MESSAGE_TYPES } from '../../core/message-handler.js';

class HoverboardContentScript {
  constructor() {
    this.tabId = null;
    this.pageUrl = window.location.href;
    this.pageTitle = document.title;
    
    this.hoverSystem = new HoverSystem();
    this.overlayManager = new OverlayManager();
    this.messageClient = new MessageClient();
    this.domUtils = new DOMUtils();
    
    this.currentBookmark = null;
    this.isInitialized = false;
    
    this.init();
  }

  async init() {
    try {
      console.log('Hoverboard: Initializing content script');
      
      // Wait for DOM to be ready
      await this.domUtils.waitForDOM();
      
      // Set up message listeners
      this.setupMessageListeners();
      
      // Get tab ID from background
      await this.initializeTabId();
      
      // Get configuration and options
      const options = await this.getOptions();
      
      // Initialize hover system with options
      this.hoverSystem.initialize(options);
      
      // Notify background that content script is ready
      await this.notifyReady();
      
      // Load current page bookmark data
      await this.loadCurrentPageData();
      
      this.isInitialized = true;
      console.log('Hoverboard: Content script initialized successfully');
    } catch (error) {
      console.error('Hoverboard: Failed to initialize content script:', error);
    }
  }

  setupMessageListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open for async responses
    });
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      console.log('Content script received message:', message.type);
      
      switch (message.type) {
        case 'TOGGLE_HOVER':
          await this.toggleHover();
          sendResponse({ success: true });
          break;
          
        case 'HIDE_OVERLAY':
          this.overlayManager.hideOverlay();
          sendResponse({ success: true });
          break;
          
        case 'REFRESH_DATA':
          await this.refreshData();
          sendResponse({ success: true });
          break;
          
        case 'REFRESH_HOVER':
          await this.refreshHover();
          sendResponse({ success: true });
          break;
          
        case 'CLOSE_IF_TO_READ':
          this.handleCloseIfToRead(message.data);
          sendResponse({ success: true });
          break;
          
        default:
          console.warn('Unknown message type:', message.type);
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Message handling error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async initializeTabId() {
    try {
      const response = await this.messageClient.sendMessage({
        type: MESSAGE_TYPES.GET_TAB_ID,
        data: { url: this.pageUrl }
      });
      
      this.tabId = response.tabId;
      console.log('Content script tab ID:', this.tabId);
    } catch (error) {
      console.error('Failed to get tab ID:', error);
    }
  }

  async getOptions() {
    try {
      const response = await this.messageClient.sendMessage({
        type: MESSAGE_TYPES.GET_OPTIONS
      });
      
      return response;
    } catch (error) {
      console.error('Failed to get options:', error);
      return {};
    }
  }

  async notifyReady() {
    try {
      await this.messageClient.sendMessage({
        type: 'CONTENT_SCRIPT_READY',
        data: { 
          url: this.pageUrl,
          title: this.pageTitle,
          tabId: this.tabId
        }
      });
    } catch (error) {
      console.error('Failed to notify ready:', error);
    }
  }

  async loadCurrentPageData() {
    try {
      const response = await this.messageClient.sendMessage({
        type: MESSAGE_TYPES.GET_CURRENT_BOOKMARK,
        data: {
          url: this.pageUrl,
          title: this.pageTitle,
          tabId: this.tabId
        }
      });

      if (response.blocked) {
        console.log('Hoverboard: Site is blocked from processing');
        return;
      }

      this.currentBookmark = response;
      
      // Check if we should show hover on page load
      const options = await this.getOptions();
      if (options.showHoverOnPageLoad) {
        await this.showHoverWithDelay(options);
      }
      
    } catch (error) {
      console.error('Failed to load current page data:', error);
    }
  }

  async showHoverWithDelay(options) {
    const delay = options.showHoverDelay || 1000;
    
    setTimeout(async () => {
      try {
        if (this.shouldShowHoverOnPageLoad(options)) {
          await this.showHover(false); // false = not user-triggered
          
          // Auto-close if configured
          if (options.uxAutoCloseTimeout > 0) {
            setTimeout(() => {
              this.overlayManager.hideOverlay();
            }, options.uxAutoCloseTimeout);
          }
        }
      } catch (error) {
        console.error('Failed to show hover on page load:', error);
      }
    }, delay);
  }

  shouldShowHoverOnPageLoad(options) {
    if (!this.currentBookmark) return false;
    
    const hasBookmark = this.currentBookmark.hash && this.currentBookmark.hash.length > 0;
    const hasTags = this.currentBookmark.tags && this.currentBookmark.tags.length > 0;
    
    // Check configuration rules
    if (options.showHoverOPLOnlyIfNoTags && hasTags) return false;
    if (options.showHoverOPLOnlyIfSomeTags && !hasTags) return false;
    
    return true;
  }

  async toggleHover() {
    if (this.overlayManager.isVisible()) {
      this.overlayManager.hideOverlay();
    } else {
      await this.showHover(true); // true = user-triggered
    }
  }

  async showHover(userTriggered = false) {
    try {
      // Refresh bookmark data for user-triggered displays
      if (userTriggered) {
        await this.loadCurrentPageData();
      }
      
      if (!this.currentBookmark) {
        console.warn('No bookmark data available for hover display');
        return;
      }

      // Create and show the overlay
      await this.overlayManager.showOverlay({
        bookmark: this.currentBookmark,
        pageTitle: this.pageTitle,
        pageUrl: this.pageUrl,
        tabId: this.tabId,
        userTriggered
      });
      
    } catch (error) {
      console.error('Failed to show hover:', error);
    }
  }

  async refreshData() {
    try {
      await this.loadCurrentPageData();
      console.log('Bookmark data refreshed');
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  }

  async refreshHover() {
    try {
      this.overlayManager.hideOverlay();
      await this.showHover(true);
    } catch (error) {
      console.error('Failed to refresh hover:', error);
    }
  }

  handleCloseIfToRead(data) {
    if (this.currentBookmark && this.currentBookmark.toread === 'yes') {
      console.log('Closing tab - bookmark is marked "to read"');
      window.close();
    }
  }

  // Public API for other modules
  getCurrentBookmark() {
    return this.currentBookmark;
  }

  getTabId() {
    return this.tabId;
  }

  getPageInfo() {
    return {
      url: this.pageUrl,
      title: this.pageTitle,
      tabId: this.tabId
    };
  }

  isReady() {
    return this.isInitialized;
  }
}

// Initialize content script when page loads
let hoverboardContentScript;

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    hoverboardContentScript = new HoverboardContentScript();
  });
} else {
  // DOM is already ready
  hoverboardContentScript = new HoverboardContentScript();
}

// Export for other modules to access
window.hoverboardContentScript = hoverboardContentScript;

export { HoverboardContentScript }; 