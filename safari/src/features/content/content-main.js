// MV3-003: Content script implementation for V3 injection patterns
/**
 * Hoverboard Content Script - Main Entry Point
 * Modern replacement for inject.js with jQuery-free DOM manipulation
 * 
 * [SAFARI-EXT-CONTENT-001] Safari-specific content script adaptations
 * Enhanced with Safari-specific message handling, overlay optimizations, and performance improvements
 */

// MV3-003: Modern ES6 module imports for V3 content scripts
import { OverlayManager } from './overlay-manager.js'
import { MessageClient } from './message-client.js'
import { DOMUtils } from './dom-utils.js'
import { MESSAGE_TYPES } from '../../core/message-handler.js'
// [SAFARI-EXT-SHIM-001] Import browser API abstraction for cross-browser support
import { browser, debugLog, debugError, platformUtils } from '../../shared/utils'; // [SAFARI-EXT-SHIM-001]

// Global debug flag
window.HOVERBOARD_DEBUG = true

// [SAFARI-EXT-CONTENT-001] Safari-specific content script configuration
const SAFARI_CONTENT_CONFIG = {
  // [SAFARI-EXT-CONTENT-001] Safari-specific message handling
  messageTimeout: 15000, // 15 seconds for Safari (longer than Chrome)
  messageRetries: 5, // More retries for Safari
  messageRetryDelay: 2000, // Longer delay between retries
  
  // [SAFARI-EXT-CONTENT-001] Safari-specific overlay optimizations
  overlayAnimationDuration: 300, // Faster animations for Safari
  overlayBlurAmount: 3, // Enhanced blur for Safari
  overlayOpacityNormal: 0.03, // Lower opacity for Safari
  overlayOpacityHover: 0.12, // Lower hover opacity for Safari
  overlayOpacityFocus: 0.20, // Lower focus opacity for Safari
  
  // [SAFARI-EXT-CONTENT-001] Safari-specific performance optimizations
  enablePerformanceMonitoring: true,
  performanceMonitoringInterval: 30000, // 30 seconds
  enableMemoryOptimization: true,
  enableAnimationOptimization: true,
  
  // [SAFARI-EXT-CONTENT-001] Safari-specific error handling
  enableGracefulDegradation: true,
  enableErrorRecovery: true,
  enableRetryMechanisms: true
}

// MV3-003: Main content script class for V3 architecture
class HoverboardContentScript {
  constructor () {
    // MV3-003: Initialize content script state
    this.tabId = null
    this.pageUrl = window.location.href
    this.pageTitle = document.title

    // [SAFARI-EXT-CONTENT-001] Safari-specific initialization
    this.isSafari = platformUtils.isSafari()
    this.safariConfig = this.getSafariConfig()
    this.performanceMonitor = null
    this.errorRecoveryAttempts = 0
    this.maxErrorRecoveryAttempts = 3

    // MV3-003: Initialize modern utility classes
    this.messageClient = new MessageClient()
    this.domUtils = new DOMUtils()

    // ⭐ UI-005: Transparent overlay - 🎨 Enhanced transparency system
    // Initialize overlay manager with transparency-enabled configuration
    this.overlayManager = new OverlayManager(document, {
      overlayPosition: 'top-right',
      messageTimeout: this.safariConfig.messageTimeout,
      showRecentTags: true,
      maxRecentTags: 10,
      overlayAnimations: true,
      overlayDraggable: false,
      // Transparency settings for UI-005 with Safari optimizations
      overlayTransparencyMode: 'nearly-transparent',
      overlayPositionMode: 'bottom-fixed',
      overlayOpacityNormal: this.safariConfig.overlayOpacityNormal,
      overlayOpacityHover: this.safariConfig.overlayOpacityHover,
      overlayOpacityFocus: this.safariConfig.overlayOpacityFocus,
      overlayAdaptiveVisibility: true,
      overlayBlurAmount: this.safariConfig.overlayBlurAmount,
      // [SAFARI-EXT-CONTENT-001] Safari-specific overlay settings
      overlayAnimationDuration: this.safariConfig.overlayAnimationDuration,
      enableSafariOptimizations: this.isSafari
    })

    this.currentBookmark = null
    this.isInitialized = false
    this.overlayActive = false
    this.config = null

    this.init()
  }

  // [SAFARI-EXT-CONTENT-001] Get Safari-specific configuration
  getSafariConfig() {
    const baseConfig = { ...SAFARI_CONTENT_CONFIG }
    
    if (this.isSafari) {
      const platformConfig = platformUtils.getPlatformConfig()
      return {
        ...baseConfig,
        messageTimeout: platformConfig.messageTimeout || baseConfig.messageTimeout,
        messageRetries: platformConfig.messageRetries || baseConfig.messageRetries,
        messageRetryDelay: platformConfig.messageRetryDelay || baseConfig.messageRetryDelay,
        enablePerformanceMonitoring: platformConfig.enablePerformanceMonitoring !== false,
        enableMemoryOptimization: platformConfig.enableMemoryOptimization !== false,
        enableAnimationOptimization: platformConfig.enableAnimationOptimization !== false
      }
    }
    
    return baseConfig
  }

  async init () {
    try {
      debugLog('CONTENT-SCRIPT', 'Initializing content script')

      // [SAFARI-EXT-CONTENT-001] Safari-specific initialization logging
      if (this.isSafari) {
        debugLog('SAFARI-CONTENT', 'Initializing Safari-optimized content script')
        console.log('[SAFARI-EXT-CONTENT-001] Safari content script initialization started')
      }

      // Wait for DOM to be ready
      await this.domUtils.waitForDOM()
      debugLog('CONTENT-SCRIPT', 'DOM ready')

      // [SAFARI-EXT-CONTENT-001] Safari-specific DOM optimizations
      if (this.isSafari) {
        await this.optimizeForSafari()
      }

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

      // [SAFARI-EXT-CONTENT-001] Safari-specific overlay optimizations
      if (this.isSafari) {
        this.applySafariOverlayOptimizations()
      }

      // Notify background that content script is ready
      await this.notifyReady()
      debugLog('CONTENT-SCRIPT', 'Ready notification sent')

      // Load current page bookmark data
      await this.loadCurrentPageData()
      debugLog('CONTENT-SCRIPT', 'Current page data loaded:', this.currentBookmark)

      // [SAFARI-EXT-CONTENT-001] Start Safari-specific performance monitoring
      if (this.isSafari && this.safariConfig.enablePerformanceMonitoring) {
        this.startPerformanceMonitoring()
      }

      this.isInitialized = true
      debugLog('CONTENT-SCRIPT', 'Content script initialization complete')
      
      // [SAFARI-EXT-CONTENT-001] Safari-specific completion logging
      if (this.isSafari) {
        console.log('[SAFARI-EXT-CONTENT-001] Safari content script initialization complete')
      }
    } catch (error) {
      console.error('Hoverboard: Failed to initialize content script:', error)
      
      // [SAFARI-EXT-CONTENT-001] Safari-specific error recovery
      if (this.isSafari && this.safariConfig.enableErrorRecovery) {
        await this.handleSafariError(error)
      }
    }
  }

  // [SAFARI-EXT-CONTENT-001] Safari-specific DOM optimizations
  async optimizeForSafari() {
    console.log('[SAFARI-EXT-CONTENT-001] Applying Safari-specific DOM optimizations')
    
    try {
      // [SAFARI-EXT-CONTENT-001] Optimize CSS for Safari
      if (this.safariConfig.enableAnimationOptimization) {
        this.optimizeSafariAnimations()
      }
      
      // [SAFARI-EXT-CONTENT-001] Optimize memory usage for Safari
      if (this.safariConfig.enableMemoryOptimization) {
        this.optimizeSafariMemory()
      }
      
      console.log('[SAFARI-EXT-CONTENT-001] Safari DOM optimizations applied successfully')
    } catch (error) {
      console.warn('[SAFARI-EXT-CONTENT-001] Safari DOM optimization failed:', error)
    }
  }

  // [SAFARI-EXT-CONTENT-001] Optimize animations for Safari
  optimizeSafariAnimations() {
    // Add Safari-specific CSS optimizations
    const style = document.createElement('style')
    style.textContent = `
      /* [SAFARI-EXT-CONTENT-001] Safari-specific animation optimizations */
      .hoverboard-overlay {
        -webkit-transform: translateZ(0);
        transform: translateZ(0);
        -webkit-backface-visibility: hidden;
        backface-visibility: hidden;
        -webkit-perspective: 1000px;
        perspective: 1000px;
      }
      
      .hoverboard-overlay * {
        -webkit-transform: translateZ(0);
        transform: translateZ(0);
      }
    `
    document.head.appendChild(style)
  }

  // [SAFARI-EXT-CONTENT-001] Optimize memory usage for Safari
  optimizeSafariMemory() {
    // Implement memory optimization strategies
    if (window.performance && window.performance.memory) {
      const memoryInfo = window.performance.memory
      const memoryUsagePercent = (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100
      
      if (memoryUsagePercent > 80) {
        console.warn('[SAFARI-EXT-CONTENT-001] High memory usage detected:', memoryUsagePercent.toFixed(1) + '%')
        // Implement memory cleanup strategies
        this.cleanupMemory()
      }
    }
  }

  // [SAFARI-EXT-CONTENT-001] Memory cleanup for Safari
  cleanupMemory() {
    // Clear any cached data or event listeners that might be consuming memory
    if (this.performanceMonitor) {
      clearInterval(this.performanceMonitor)
      this.performanceMonitor = null
    }
    
    // Force garbage collection if available
    if (window.gc) {
      window.gc()
    }
  }

  // [SAFARI-EXT-CONTENT-001] Apply Safari-specific overlay optimizations
  applySafariOverlayOptimizations() {
    console.log('[SAFARI-EXT-CONTENT-001] Applying Safari-specific overlay optimizations')
    
    // Apply Safari-specific overlay settings
    if (this.overlayManager) {
      // Set Safari-specific animation duration
      this.overlayManager.animationDuration = this.safariConfig.overlayAnimationDuration
      
      // Apply Safari-specific blur and opacity settings
      this.overlayManager.blurAmount = this.safariConfig.overlayBlurAmount
      this.overlayManager.opacityNormal = this.safariConfig.overlayOpacityNormal
      this.overlayManager.opacityHover = this.safariConfig.overlayOpacityHover
      this.overlayManager.opacityFocus = this.safariConfig.overlayOpacityFocus
    }
  }

  // [SAFARI-EXT-CONTENT-001] Start Safari-specific performance monitoring
  startPerformanceMonitoring() {
    console.log('[SAFARI-EXT-CONTENT-001] Starting Safari performance monitoring')
    
    this.performanceMonitor = setInterval(() => {
      this.monitorSafariPerformance()
    }, this.safariConfig.performanceMonitoringInterval)
  }

  // [SAFARI-EXT-CONTENT-001] Monitor Safari performance
  monitorSafariPerformance() {
    try {
      if (window.performance && window.performance.memory) {
        const memoryInfo = window.performance.memory
        const memoryUsagePercent = (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100
        
        if (memoryUsagePercent > 90) {
          console.warn('[SAFARI-EXT-CONTENT-001] Critical memory usage:', memoryUsagePercent.toFixed(1) + '%')
          this.cleanupMemory()
        } else if (memoryUsagePercent > 70) {
          console.log('[SAFARI-EXT-CONTENT-001] Memory usage:', memoryUsagePercent.toFixed(1) + '%')
        }
      }
    } catch (error) {
      console.warn('[SAFARI-EXT-CONTENT-001] Performance monitoring error:', error)
    }
  }

  // [SAFARI-EXT-CONTENT-001] Handle Safari-specific errors
  async handleSafariError(error) {
    console.error('[SAFARI-EXT-CONTENT-001] Safari-specific error:', error)
    
    if (this.errorRecoveryAttempts < this.maxErrorRecoveryAttempts) {
      this.errorRecoveryAttempts++
      console.log(`[SAFARI-EXT-CONTENT-001] Attempting error recovery (${this.errorRecoveryAttempts}/${this.maxErrorRecoveryAttempts})`)
      
      try {
        // Attempt to recover from the error
        await this.attemptErrorRecovery(error)
      } catch (recoveryError) {
        console.error('[SAFARI-EXT-CONTENT-001] Error recovery failed:', recoveryError)
      }
    } else {
      console.error('[SAFARI-EXT-CONTENT-001] Max error recovery attempts reached')
    }
  }

  // [SAFARI-EXT-CONTENT-001] Attempt error recovery
  async attemptErrorRecovery(error) {
    // Implement specific error recovery strategies
    if (error.message.includes('message')) {
      // Reinitialize message client
      this.messageClient = new MessageClient()
      await this.setupMessageListeners()
    } else if (error.message.includes('overlay')) {
      // Reinitialize overlay manager
      this.overlayManager = new OverlayManager(document, this.overlayManager.config)
    }
    
    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  setupMessageListeners () {
    // [SAFARI-EXT-CONTENT-001] Enhanced Safari message listener setup
    const messageListener = (message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse)
      return true // Keep message channel open for async responses
    }
    
    browser.runtime.onMessage.addListener(messageListener)
    
    // [SAFARI-EXT-CONTENT-001] Safari-specific message listener enhancements
    if (this.isSafari) {
      console.log('[SAFARI-EXT-CONTENT-001] Safari-enhanced message listeners configured')
    }
  }

  async handleMessage (message, sender, sendResponse) {
    try {
      console.log('Content script received message:', message.type)

      // [SAFARI-EXT-CONTENT-001] Safari-specific message processing
      if (this.isSafari) {
        message = this.processSafariMessage(message, sender)
      }

      switch (message.type) {
        case 'TOGGLE_HOVER':
          await this.toggleHover()
          // [POPUP-CLOSE-BEHAVIOR-ARCH-012] - Return overlay state after toggle
          const newState = {
            isVisible: this.overlayActive,
            hasBookmark: !!this.currentBookmark
          }
          sendResponse({ success: true, data: newState })
          break

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
        case 'GET_OVERLAY_STATE':
          const overlayState = {
            isVisible: this.overlayActive,
            hasBookmark: !!this.currentBookmark,
            overlayElement: !!document.getElementById('hoverboard-overlay')
          }
          sendResponse({ success: true, data: overlayState })
          break

        // [SAFARI-EXT-CONTENT-001] Safari-specific message handlers
        case 'SAFARI_PERFORMANCE_CHECK':
          const performanceData = this.getSafariPerformanceData()
          sendResponse({ success: true, data: performanceData })
          break

        case 'SAFARI_MEMORY_CLEANUP':
          this.cleanupMemory()
          sendResponse({ success: true })
          break

        default:
          console.warn('Unknown message type:', message.type)
          sendResponse({ success: false, error: 'Unknown message type' })
      }
    } catch (error) {
      console.error('Error handling message:', error)
      
      // [SAFARI-EXT-CONTENT-001] Safari-specific error handling
      if (this.isSafari) {
        await this.handleSafariError(error)
      }
      
      sendResponse({ success: false, error: error.message })
    }
  }

  // [SAFARI-EXT-CONTENT-001] Process Safari-specific message enhancements
  processSafariMessage(message, sender) {
    if (!this.isSafari) return message
    
    // Add Safari-specific message processing
    const processedMessage = { ...message }
    
    // Add Safari-specific sender information
    if (sender && typeof safari !== 'undefined') {
      processedMessage.safariSender = {
        tabId: sender.tab?.id,
        frameId: sender.frameId,
        url: sender.tab?.url,
        platform: 'safari'
      }
    }
    
    // Add Safari-specific timestamp
    processedMessage.safariTimestamp = Date.now()
    
    return processedMessage
  }

  // [SAFARI-EXT-CONTENT-001] Get Safari performance data
  getSafariPerformanceData() {
    const performanceData = {
      isSafari: this.isSafari,
      timestamp: Date.now(),
      memoryUsage: null,
      errorRecoveryAttempts: this.errorRecoveryAttempts
    }
    
    if (window.performance && window.performance.memory) {
      const memoryInfo = window.performance.memory
      performanceData.memoryUsage = {
        used: memoryInfo.usedJSHeapSize,
        total: memoryInfo.totalJSHeapSize,
        limit: memoryInfo.jsHeapSizeLimit,
        usagePercent: (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100
      }
    }
    
    return performanceData
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

      // Debug the response structure
      console.log('🔍 [Debug] Response structure:', response)
      console.log('🔍 [Debug] Actual response:', actualResponse)
      console.log('🔍 [Debug] Actual response type:', typeof actualResponse)

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
      debugLog('CONTENT-SCRIPT', '[CHROME-DEBUG-001] showHover called', { userTriggered, platform: navigator.userAgent });
      // Platform detection
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        debugLog('CONTENT-SCRIPT', '[CHROME-DEBUG-001] Detected Chrome runtime');
      } else if (typeof browser !== 'undefined' && browser.runtime) {
        debugLog('CONTENT-SCRIPT', '[CHROME-DEBUG-001] Detected browser polyfill runtime');
      } else {
        debugError('CONTENT-SCRIPT', '[CHROME-DEBUG-001] No recognized extension runtime detected');
      }
      // Check utils.js access
      if (!debugLog || !debugError) {
        console.error('[CHROME-DEBUG-001] utils.js functions missing');
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

      // Enhanced debugging for bookmark structure
      console.log('🔍 [Debug] Bookmark data structure:')
      console.log('🔍 [Debug] - URL:', this.currentBookmark.url)
      console.log('🔍 [Debug] - Description:', this.currentBookmark.description)
      console.log('🔍 [Debug] - Tags:', this.currentBookmark.tags)
      console.log('🔍 [Debug] - Tags type:', typeof this.currentBookmark.tags)
      console.log('🔍 [Debug] - Tags length:', this.currentBookmark.tags?.length)
      console.log('🔍 [Debug] - Extended:', this.currentBookmark.extended)
      console.log('🔍 [Debug] - Hash:', this.currentBookmark.hash)
      console.log('🔍 [Debug] - Shared:', this.currentBookmark.shared)
      console.log('🔍 [Debug] - ToRead:', this.currentBookmark.toread)

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
  async handleBookmarkUpdated(bookmarkData) {
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
  async handleTagUpdated(tagUpdateData) {
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
