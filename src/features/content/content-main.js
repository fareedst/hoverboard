// MV3-003: Content script implementation for V3 injection patterns
/**
 * Hoverboard Content Script - Main Entry Point
 * Modern replacement for inject.js with jQuery-free DOM manipulation
 */

// MV3-003: Modern ES6 module imports for V3 content scripts
import { OverlayManager } from './overlay-manager.js'
import { MessageClient } from './message-client.js'
import { DOMUtils } from './dom-utils.js'
import { MESSAGE_TYPES } from '../../core/message-handler.js'
// [SAFARI-EXT-SHIM-001] Import browser API abstraction for cross-browser support
import { browser, debugLog, debugError } from '../../shared/utils' // [SAFARI-EXT-SHIM-001]
// [IMPL-UI_INSPECTOR] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION]
import { recordAction } from '../../shared/ui-inspector.js'
import { debugLogger, LOG_CATEGORIES } from '../../shared/debug-logger.js'

// Global debug flag
window.HOVERBOARD_DEBUG = true

// MV3-003: Main content script class for V3 architecture
class HoverboardContentScript {
  constructor () {
    // MV3-003: Initialize content script state
    this.tabId = null
    this.pageUrl = window.location.href
    this.pageTitle = document.title

    // MV3-003: Initialize modern utility classes
    this.messageClient = new MessageClient()
    this.domUtils = new DOMUtils()

    // ⭐ UI-005: Transparent overlay - 🎨 Enhanced transparency system
    // Initialize overlay manager with transparency-enabled configuration
    this.overlayManager = new OverlayManager(document, {
      overlayPosition: 'top-right',
      messageTimeout: 3000,
      showRecentTags: true,
      maxRecentTags: 10,
      overlayAnimations: true,
      overlayDraggable: false,
      // Transparency settings for UI-005
      overlayTransparencyMode: 'nearly-transparent',
      overlayPositionMode: 'bottom-fixed',
      overlayOpacityNormal: 0.05,
      overlayOpacityHover: 0.15,
      overlayOpacityFocus: 0.25,
      overlayAdaptiveVisibility: true,
      overlayBlurAmount: 2
    })

    this.currentBookmark = null
    this.isInitialized = false
    this.overlayActive = false
    this.config = null

    this.init()
  }

  async init () {
    try {
      debugLog('CONTENT-SCRIPT', 'Initializing content script')

      // Wait for DOM to be ready
      await this.domUtils.waitForDOM()
      debugLog('CONTENT-SCRIPT', 'DOM ready')

      // Set up message listeners
      this.setupMessageListeners()
      debugLog('CONTENT-SCRIPT', 'Message listeners set up')

      // Get tab ID from background
      await this.initializeTabId()
      debugLog('CONTENT-SCRIPT', 'Tab ID initialized:', this.tabId)

      // Get configuration and options
      await this.loadConfiguration()
      debugLog('CONTENT-SCRIPT', 'Options loaded:', this.config)

      // ⭐ UI-005: Transparent overlay - 🎨 Enhanced transparency system
      // Update overlay manager config with options and transparency settings
      this.overlayManager.config = { ...this.overlayManager.config, ...this.config }

      // Update overlay manager transparency properties
      this.overlayManager.transparencyMode = this.config.overlayTransparencyMode || 'nearly-transparent'
      this.overlayManager.positionMode = this.config.overlayPositionMode || 'bottom-fixed'
      this.overlayManager.adaptiveVisibility = this.config.overlayAdaptiveVisibility || true

      debugLog('CONTENT-SCRIPT', 'Overlay manager configured with transparency settings', {
        transparencyMode: this.overlayManager.transparencyMode,
        positionMode: this.overlayManager.positionMode,
        adaptiveVisibility: this.overlayManager.adaptiveVisibility
      })

      // Notify background that content script is ready
      await this.notifyReady()
      debugLog('CONTENT-SCRIPT', 'Ready notification sent')

      // Load current page bookmark data
      await this.loadCurrentPageData()
      debugLog('CONTENT-SCRIPT', 'Current page data loaded:', this.currentBookmark)

      this.isInitialized = true
      debugLog('CONTENT-SCRIPT', 'Content script initialization complete')
    } catch (error) {
      console.error('Hoverboard: Failed to initialize content script:', error)
    }
  }

  setupMessageListeners () {
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse)
      return true // Keep message channel open for async responses
    })
  }

  async handleMessage (message, sender, sendResponse) {
    try {
      recordAction(message.type, message.data, 'content')
      debugLogger.trace('content-main', 'handleMessage', { type: message.type }, LOG_CATEGORIES.MESSAGE)
      console.log('Content script received message:', message.type)

      switch (message.type) {
        case 'TOGGLE_HOVER': {
          await this.toggleHover()
          // [POPUP-CLOSE-BEHAVIOR-ARCH-012] - Return overlay state after toggle
          const newState = {
            isVisible: this.overlayActive,
            hasBookmark: !!this.currentBookmark
          }
          sendResponse({ success: true, data: newState })
          break
        }

        case 'HIDE_OVERLAY':
          this.overlayManager.hide()
          sendResponse({ success: true })
          break

        case 'REFRESH_DATA':
          await this.refreshData()
          sendResponse({ success: true })
          break

        case 'REFRESH_HOVER':
          await this.refreshHover()
          sendResponse({ success: true })
          break

        case 'CLOSE_IF_TO_READ':
          this.handleCloseIfToRead(message.data)
          sendResponse({ success: true })
          break

        case 'PING':
          sendResponse({ success: true, data: 'pong' })
          break

        case 'SHOW_BOOKMARK_DIALOG':
          await this.showBookmarkDialog(message.data)
          sendResponse({ success: true })
          break

        case 'TOGGLE_HOVER_OVERLAY':
          await this.toggleHoverOverlay()
          sendResponse({ success: true, data: { active: this.overlayActive } })
          break

        case 'UPDATE_CONFIG':
          this.config = { ...this.config, ...message.data }
          sendResponse({ success: true })
          break

        case 'updateOverlayTransparency':
          this.handleUpdateOverlayTransparency(message.config)
          sendResponse({ success: true })
          break

        case 'CHECK_PAGE_STATE': {
          const pageState = await this.getPageState()
          sendResponse({ success: true, data: pageState })
          break
        }

        // [TOGGLE-SYNC-CONTENT-001] - Handle bookmark updates from external sources
        case 'BOOKMARK_UPDATED':
          await this.handleBookmarkUpdated(message.data)
          sendResponse({ success: true })
          break

        case 'TAG_UPDATED':
          // [TAG-SYNC-CONTENT-001] Handle tag updates from popup or other sources
          await this.handleTagUpdated(message.data)
          sendResponse({ success: true })
          break

        // [POPUP-CLOSE-BEHAVIOR-ARCH-012] - Handle overlay state queries from popup
        case 'GET_OVERLAY_STATE': {
          const overlayState = {
            isVisible: this.overlayActive,
            hasBookmark: !!this.currentBookmark,
            overlayElement: !!document.getElementById('hoverboard-overlay')
          }
          sendResponse({ success: true, data: overlayState })
          break
        }

        // [IMPL-SELECTION_TO_TAG_INPUT] - Return current page selection for popup tag input prefill
        case 'GET_PAGE_SELECTION': {
          const selection = typeof window.getSelection === 'function' ? window.getSelection().toString() : ''
          sendResponse({ success: true, data: { selection } })
          break
        }

        default:
          console.warn('Unknown message type:', message.type)
          sendResponse({ success: false, error: 'Unknown message type' })
      }
    } catch (error) {
      console.error('Message handling error:', error)
      sendResponse({ success: false, error: error.message })
    }
  }

  async initializeTabId () {
    try {
      const response = await this.messageClient.sendMessage({
        type: MESSAGE_TYPES.GET_TAB_ID,
        data: { url: this.pageUrl }
      })

      // Handle wrapped response from service worker
      const actualResponse = response.success ? response.data : response
      this.tabId = actualResponse.tabId
      console.log('Content script tab ID:', this.tabId)
    } catch (error) {
      console.error('Failed to get tab ID:', error)
    }
  }

  async loadConfiguration () {
    try {
      const response = await this.messageClient.sendMessage({
        type: MESSAGE_TYPES.GET_OPTIONS
      })

      // Handle wrapped response from service worker
      const actualResponse = response.success ? response.data : response

      if (actualResponse) {
        this.config = { ...this.getDefaultConfig(), ...actualResponse }
        console.log('📋 Configuration loaded:', this.config)
      } else {
        this.config = this.getDefaultConfig()
      }
    } catch (error) {
      console.error('❌ Failed to load configuration:', error)
      this.config = this.getDefaultConfig()
    }
  }

  getDefaultConfig () {
    return {
      showHoverOnPageLoad: false,
      hoverShowTooltips: false,
      inhibitSitesOnPageLoad: true,
      uxAutoCloseTimeout: 0,
      // ⭐ UI-005: Transparent overlay - 🎨 Enhanced transparency system
      overlayTransparencyMode: 'nearly-transparent',
      overlayPositionMode: 'bottom-fixed',
      overlayOpacityNormal: 0.05,
      overlayOpacityHover: 0.15,
      overlayOpacityFocus: 0.25,
      overlayAdaptiveVisibility: true,
      overlayBlurAmount: 2
    }
  }

  async notifyReady () {
    try {
      await this.messageClient.sendMessage({
        type: MESSAGE_TYPES.CONTENT_SCRIPT_READY,
        data: {
          url: this.pageUrl,
          title: this.pageTitle,
          tabId: this.tabId
        }
      })
    } catch (error) {
      console.error('Failed to notify ready:', error)
    }
  }

  async loadCurrentPageData () {
    try {
      debugLog('CONTENT-SCRIPT', 'Loading current page data')
      debugLog('CONTENT-SCRIPT', 'Request data:', {
        url: this.pageUrl,
        title: this.pageTitle,
        tabId: this.tabId
      })

      const response = await this.messageClient.sendMessage({
        type: MESSAGE_TYPES.GET_CURRENT_BOOKMARK,
        data: {
          url: this.pageUrl,
          title: this.pageTitle,
          tabId: this.tabId
        }
      })

      debugLog('CONTENT-SCRIPT', 'Received response:', response)

      // Handle wrapped response from service worker
      const actualResponse = response.success ? response.data : response

      if (actualResponse.blocked) {
        debugLog('CONTENT-SCRIPT', 'Site is blocked from processing')
        return
      }

      // Extract the actual bookmark data from the response
      this.currentBookmark = actualResponse.data || actualResponse
      debugLog('CONTENT-SCRIPT', 'Current bookmark set:', this.currentBookmark)

      // Check if we should show hover on page load
      const options = await this.getOptions()
      debugLog('CONTENT-SCRIPT', 'Options for page load:', options)

      if (options.showHoverOnPageLoad) {
        debugLog('CONTENT-SCRIPT', 'Showing hover on page load')
        await this.showHoverWithDelay(options)
      }
    } catch (error) {
      console.error('Failed to load current page data:', error)
      debugLog('CONTENT-SCRIPT', 'Error loading page data:', error)
    }
  }

  async showHoverWithDelay (options) {
    const delay = options.showHoverDelay || 1000

    setTimeout(async () => {
      try {
        if (this.shouldShowHoverOnPageLoad(options)) {
          await this.showHover(false) // false = not user-triggered

          // Auto-close if configured
          if (options.uxAutoCloseTimeout > 0) {
            setTimeout(() => {
              this.overlayManager.hideOverlay()
            }, options.uxAutoCloseTimeout)
          }
        }
      } catch (error) {
        console.error('Failed to show hover on page load:', error)
      }
    }, delay)
  }

  shouldShowHoverOnPageLoad (options) {
    if (!this.currentBookmark) return false

    const hasBookmark = this.currentBookmark.hash && this.currentBookmark.hash.length > 0
    const hasTags = this.currentBookmark.tags && this.currentBookmark.tags.length > 0

    // Check configuration rules
    if (options.showHoverOPLOnlyIfNoTags && hasTags) return false
    if (options.showHoverOPLOnlyIfSomeTags && !hasTags) return false

    return true
  }

  async toggleHover () {
    if (this.overlayManager.isVisible) {
      this.overlayManager.hide()
    } else {
      await this.showHover(true) // true = user-triggered
    }
  }

  async showHover (userTriggered = false) {
    try {
      debugLogger.trace('content-main', 'showHover', { userTriggered }, LOG_CATEGORIES.OVERLAY)
      debugLog('CONTENT-SCRIPT', '[CHROME-DEBUG-001] showHover called', { userTriggered, platform: navigator.userAgent })
      // Platform detection
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        debugLog('CONTENT-SCRIPT', '[CHROME-DEBUG-001] Detected Chrome runtime')
      } else if (typeof browser !== 'undefined' && browser.runtime) {
        debugLog('CONTENT-SCRIPT', '[CHROME-DEBUG-001] Detected browser polyfill runtime')
      } else {
        debugError('CONTENT-SCRIPT', '[CHROME-DEBUG-001] No recognized extension runtime detected')
      }
      // Check utils.js access
      if (!debugLog || !debugError) {
        console.error('[CHROME-DEBUG-001] utils.js functions missing')
      }
      debugLog('CONTENT-SCRIPT', 'Showing hover', { userTriggered })

      // Refresh bookmark data for user-triggered displays
      if (userTriggered) {
        debugLog('CONTENT-SCRIPT', 'Refreshing bookmark data for user-triggered display')
        await this.loadCurrentPageData()
      }

      if (!this.currentBookmark) {
        debugLog('CONTENT-SCRIPT', 'No bookmark data available')
        console.warn('No bookmark data available for hover display')
        return
      }

      debugLog('CONTENT-SCRIPT', 'Current bookmark data:', this.currentBookmark)

      // Create and show the overlay
      this.overlayManager.show({
        bookmark: this.currentBookmark,
        pageTitle: this.pageTitle,
        pageUrl: this.pageUrl,
        tabId: this.tabId,
        userTriggered
      })

      debugLog('CONTENT-SCRIPT', 'Overlay display request sent')
    } catch (error) {
      console.error('Failed to show hover:', error)
      debugLog('CONTENT-SCRIPT', 'Error showing hover:', error)
    }
  }

  async refreshData () {
    try {
      await this.loadCurrentPageData()
      console.log('Bookmark data refreshed')
    } catch (error) {
      console.error('Failed to refresh data:', error)
    }
  }

  async refreshHover () {
    try {
      this.overlayManager.hideOverlay()
      await this.showHover(true)
    } catch (error) {
      console.error('Failed to refresh hover:', error)
    }
  }

  handleCloseIfToRead (data) {
    if (this.currentBookmark && this.currentBookmark.toread === 'yes') {
      console.log('Closing tab - bookmark is marked "read later"')
      window.close()
    }
  }

  // Public API for other modules
  getCurrentBookmark () {
    return this.currentBookmark
  }

  getTabId () {
    return this.tabId
  }

  getPageInfo () {
    return {
      url: this.pageUrl,
      title: this.pageTitle,
      tabId: this.tabId
    }
  }

  isReady () {
    return this.isInitialized
  }

  async showBookmarkDialog (data) {
    const event = { clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 }
    await this.showHoverOverlay(document.body, event)

    if (this.currentOverlay && data) {
      if (data.url) {
        this.currentOverlay.querySelector('.hoverboard-url-input').value = data.url
      }
      if (data.title) {
        this.currentOverlay.querySelector('.hoverboard-title-input').value = data.title
      }
      if (data.description) {
        this.currentOverlay.querySelector('.hoverboard-description-input').value = data.description
      }
    }
  }

  async toggleHoverOverlay () {
    if (this.overlayActive) {
      this.hideHoverOverlay()
    } else {
      const event = { clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 }
      await this.showHoverOverlay(document.body, event)
    }
  }

  async showHoverOverlay (element, event) {
    try {
      console.log('🎯 Showing hover overlay')

      const overlay = this.createOverlayElement(element, event)

      document.body.appendChild(overlay)

      this.overlayActive = true
      this.currentOverlay = overlay

      this.setupOverlayHandlers(overlay)

      if (this.config.uxAutoCloseTimeout > 0) {
        setTimeout(() => {
          this.hideHoverOverlay()
        }, this.config.uxAutoCloseTimeout)
      }
    } catch (error) {
      console.error('❌ Failed to show hover overlay:', error)
    }
  }

  createOverlayElement (element, event) {
    const overlay = document.createElement('div')
    overlay.className = 'hoverboard-overlay'
    overlay.innerHTML = `
      <div class="hoverboard-overlay-content">
        <div class="hoverboard-overlay-header">
          <span class="hoverboard-overlay-title">📌 Add to Pinboard</span>
          <button class="hoverboard-overlay-close">×</button>
        </div>
        <div class="hoverboard-overlay-body">
          <input type="text" class="hoverboard-url-input" placeholder="URL" value="${window.location.href}">
          <input type="text" class="hoverboard-title-input" placeholder="Title" value="${document.title}">
          <textarea class="hoverboard-description-input" placeholder="Description"></textarea>
          <input type="text" class="hoverboard-tags-input" placeholder="Tags (comma separated)">
          <div class="hoverboard-overlay-actions">
            <button class="hoverboard-save-button">Save Bookmark</button>
            <label class="hoverboard-private-label">
              <input type="checkbox" class="hoverboard-private-checkbox"> Private
            </label>
          </div>
        </div>
      </div>
    `

    overlay.style.position = 'fixed'
    overlay.style.left = `${Math.min(event.clientX, window.innerWidth - 350)}px`
    overlay.style.top = `${Math.min(event.clientY, window.innerHeight - 200)}px`
    overlay.style.zIndex = '999999'

    return overlay
  }

  setupOverlayHandlers (overlay) {
    const closeButton = overlay.querySelector('.hoverboard-overlay-close')
    closeButton.addEventListener('click', () => {
      this.hideHoverOverlay()
    })

    const saveButton = overlay.querySelector('.hoverboard-save-button')
    saveButton.addEventListener('click', () => {
      this.saveBookmarkFromOverlay(overlay)
    })

    document.addEventListener('click', (event) => {
      if (!overlay.contains(event.target)) {
        this.hideHoverOverlay()
      }
    }, { once: true })

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        this.hideHoverOverlay()
      }
    }, { once: true })
  }

  hideHoverOverlay () {
    if (this.currentOverlay) {
      this.currentOverlay.remove()
      this.currentOverlay = null
      this.overlayActive = false
      console.log('🎯 Hover overlay hidden')
    }
  }

  async saveBookmarkFromOverlay (overlay) {
    try {
      const url = overlay.querySelector('.hoverboard-url-input').value
      const title = overlay.querySelector('.hoverboard-title-input').value
      const description = overlay.querySelector('.hoverboard-description-input').value
      const tags = overlay.querySelector('.hoverboard-tags-input').value
      const isPrivate = overlay.querySelector('.hoverboard-private-checkbox').checked

      const response = await browser.runtime.sendMessage({
        type: 'SAVE_BOOKMARK',
        data: { url, title, description, tags, private: isPrivate }
      })

      if (response.success) {
        console.log('✅ Bookmark saved successfully')
        this.hideHoverOverlay()
      } else {
        console.error('❌ Failed to save bookmark:', response.error)
      }
    } catch (error) {
      console.error('❌ Save bookmark failed:', error)
    }
  }

  async getOptions () {
    try {
      const response = await this.messageClient.sendMessage({
        type: MESSAGE_TYPES.GET_OPTIONS
      })

      // Handle wrapped response from service worker
      const actualResponse = response.success ? response.data : response
      return actualResponse
    } catch (error) {
      console.error('Failed to get options:', error)
      return {}
    }
  }

  async getPageState () {
    return {
      url: window.location.href,
      title: document.title,
      overlayActive: this.overlayActive,
      isInitialized: this.isInitialized
    }
  }

  // [TOGGLE-SYNC-CONTENT-001] - Handle bookmark updates from external sources
  async handleBookmarkUpdated (bookmarkData) {
    try {
      // [TOGGLE-SYNC-CONTENT-001] Robustness: Validate bookmarkData before updating overlay
      if (!bookmarkData || !bookmarkData.url || !bookmarkData.tags) {
        console.warn('[TOGGLE-SYNC-CONTENT-001] Ignoring malformed bookmark update:', bookmarkData)
        return
      }
      // [TOGGLE-SYNC-CONTENT-001] - Update current bookmark data
      this.currentBookmark = bookmarkData

      // [TOGGLE-SYNC-CONTENT-001] - Refresh overlay if visible
      if (this.overlayManager.isVisible) {
        const updatedContent = {
          bookmark: bookmarkData,
          pageTitle: this.pageTitle,
          pageUrl: this.pageUrl
        }
        this.overlayManager.show(updatedContent)
      }

      debugLog('CONTENT-SCRIPT', '[TOGGLE-SYNC-CONTENT-001] Bookmark updated from external source', bookmarkData)
    } catch (error) {
      debugError('CONTENT-SCRIPT', '[TOGGLE-SYNC-CONTENT-001] Failed to handle bookmark update:', error)
    }
  }

  // [TAG-SYNC-CONTENT-001] - Handle tag updates from popup or other sources
  async handleTagUpdated (tagUpdateData) {
    try {
      // [TAG-SYNC-CONTENT-001] Validate tag update data
      if (!tagUpdateData || !tagUpdateData.url || !Array.isArray(tagUpdateData.tags)) {
        console.warn('[TAG-SYNC-CONTENT-001] Ignoring malformed tag update:', tagUpdateData)
        return
      }
      // [TAG-SYNC-CONTENT-001] Update current bookmark tags if URL matches
      if (this.currentBookmark && this.currentBookmark.url === tagUpdateData.url) {
        this.currentBookmark.tags = tagUpdateData.tags
        // [TAG-SYNC-CONTENT-001] Refresh overlay if visible
        if (this.overlayManager.isVisible) {
          const updatedContent = {
            bookmark: this.currentBookmark,
            pageTitle: this.pageTitle,
            pageUrl: this.pageUrl
          }
          this.overlayManager.show(updatedContent)
        }
        debugLog('CONTENT-SCRIPT', '[TAG-SYNC-CONTENT-001] Overlay updated with new tags', tagUpdateData.tags)
      }
    } catch (error) {
      debugError('CONTENT-SCRIPT', '[TAG-SYNC-CONTENT-001] Failed to handle tag update:', error)
    }
  }

  handleUpdateOverlayTransparency (config) {
    try {
      console.log('Updating overlay transparency configuration:', config)

      // Update local configuration
      this.config = { ...this.config, ...config }

      // Update overlay manager configuration
      if (this.overlayManager) {
        this.overlayManager.updateConfig(config)

        // Apply transparency changes immediately if overlay is visible
        if (this.overlayManager.isVisible) {
          this.overlayManager.applyTransparencyMode()
        }
      }

      console.log('Overlay transparency configuration updated successfully')
    } catch (error) {
      console.error('Failed to update overlay transparency:', error)
    }
  }
}

// Initialize content script when page loads
let hoverboardContentScript

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    hoverboardContentScript = new HoverboardContentScript()
  })
} else {
  // DOM is already ready
  hoverboardContentScript = new HoverboardContentScript()
}

// Export for other modules to access
window.hoverboardContentScript = hoverboardContentScript

export { HoverboardContentScript }
