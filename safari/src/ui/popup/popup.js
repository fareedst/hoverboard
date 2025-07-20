/**
 * Popup JavaScript - Hoverboard Extension
 * Modern ES6+ module-based popup functionality with integrated UI system
 * [SAFARI-EXT-POPUP-001] Safari-specific popup optimizations and enhancements
 */

import { init, popup } from '../index.js'
import { ErrorHandler } from '../../shared/ErrorHandler.js'
import { ConfigManager } from '../../config/config-manager.js'
import { platformUtils } from '../../shared/safari-shim.js'

class HoverboardPopup {
  constructor () {
    this.isInitialized = false
    this.popupComponents = null
    this.errorHandler = null
    this.uiSystem = null
    this.configManager = new ConfigManager()

    // [SAFARI-EXT-POPUP-001] Safari-specific initialization
    this.isSafari = platformUtils.isSafari()
    this.safariConfig = this.getSafariPopupConfig()
    this.performanceMonitor = null
    this.errorRecoveryAttempts = 0
    this.maxErrorRecoveryAttempts = 3

    // Bind context
    this.init = this.init.bind(this)
    this.handleError = this.handleError.bind(this)
    this.cleanup = this.cleanup.bind(this)
    this.monitorSafariPerformance = this.monitorSafariPerformance.bind(this)
    this.attemptSafariErrorRecovery = this.attemptSafariErrorRecovery.bind(this)
  }

  /**
   * [SAFARI-EXT-POPUP-001] Get Safari-specific popup configuration
   */
  getSafariPopupConfig() {
    return {
      // Safari-specific performance settings
      enablePerformanceMonitoring: true,
      performanceMonitoringInterval: 30000, // 30 seconds
      enableMemoryOptimization: true,
      enableAnimationOptimization: true,
      
      // Safari-specific error handling
      enableErrorRecovery: true,
      enableGracefulDegradation: true,
      maxErrorRecoveryAttempts: 3,
      errorRecoveryDelay: 1000,
      
      // Safari-specific UI optimizations
      enableSafariUIOptimizations: true,
      enableSafariAccessibility: true,
      enableSafariAnimationOptimizations: true,
      
      // Safari-specific message handling
      messageTimeout: 15000, // 15 seconds for Safari
      messageRetries: 5, // More retries for Safari
      messageRetryDelay: 2000, // Longer delay between retries
      
      // Safari-specific overlay settings
      overlayAnimationDuration: 300, // Faster animations for Safari
      overlayBlurAmount: 3, // Enhanced blur for Safari
      overlayOpacityNormal: 0.03, // Lower opacity for Safari
      overlayOpacityHover: 0.12, // Lower hover opacity for Safari
      overlayOpacityFocus: 0.20, // Lower focus opacity for Safari
      
      // Safari-specific platform detection
      enablePlatformDetection: true,
      enableFeatureDetection: true,
      enablePerformanceDetection: true
    }
  }

  /**
   * [SAFARI-EXT-POPUP-001] Monitor Safari performance
   */
  monitorSafariPerformance() {
    try {
      if (window.performance && window.performance.memory) {
        const memoryInfo = window.performance.memory
        const memoryUsagePercent = (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100
        
        if (memoryUsagePercent > 90) {
          console.warn('[SAFARI-EXT-POPUP-001] Critical Safari popup memory usage:', memoryUsagePercent.toFixed(1) + '%')
          this.handleError('Safari Critical Memory Usage', `Memory usage: ${memoryUsagePercent.toFixed(1)}%`)
        } else if (memoryUsagePercent > 70) {
          console.log('[SAFARI-EXT-POPUP-001] High Safari popup memory usage:', memoryUsagePercent.toFixed(1) + '%')
        }
      }
    } catch (error) {
      console.warn('[SAFARI-EXT-POPUP-001] Safari performance monitoring failed:', error)
    }
  }

  /**
   * [SAFARI-EXT-POPUP-001] Attempt Safari error recovery
   */
  async attemptSafariErrorRecovery(errorInfo) {
    try {
      if (this.errorRecoveryAttempts >= this.safariConfig.maxErrorRecoveryAttempts) {
        console.warn('[SAFARI-EXT-POPUP-001] Max Safari popup error recovery attempts reached')
        return false
      }
      
      this.errorRecoveryAttempts++
      console.log(`[SAFARI-EXT-POPUP-001] Attempting Safari popup error recovery (${this.errorRecoveryAttempts}/${this.safariConfig.maxErrorRecoveryAttempts})`)
      
      // Wait before attempting recovery
      await new Promise(resolve => setTimeout(resolve, this.safariConfig.errorRecoveryDelay))
      
      // Attempt recovery based on error type
      if (errorInfo.type === 'initialization') {
        // Reinitialize popup components
        if (this.popupComponents) {
          this.popupComponents.cleanup()
        }
        await this.init()
      } else if (errorInfo.type === 'ui') {
        // Reinitialize UI system
        if (this.uiSystem) {
          this.uiSystem.cleanup()
        }
        this.uiSystem = await init({
          enableThemes: true,
          enableIcons: true,
          enableAssets: true,
          preloadCriticalAssets: true
        })
      } else if (errorInfo.type === 'message') {
        // Reinitialize message handling
        if (this.popupComponents && this.popupComponents.controller) {
          await this.popupComponents.controller.loadInitialData()
        }
      }
      
      console.log('[SAFARI-EXT-POPUP-001] Safari popup error recovery successful')
      this.errorRecoveryAttempts = 0
      return true
      
    } catch (error) {
      console.error('[SAFARI-EXT-POPUP-001] Safari popup error recovery failed:', error)
      return false
    }
  }

  /**
   * Initialize the popup application
   */
  async init () {
    try {
      console.log('[SAFARI-EXT-POPUP-001] Initializing Hoverboard popup with Safari optimizations...')

      // [SAFARI-EXT-POPUP-001] Initialize Safari-specific error handler
      this.errorHandler = new ErrorHandler()
      this.errorHandler.onError = (message, errorInfo) => {
        this.handleError(message, errorInfo)
      }

      console.log('[SAFARI-EXT-POPUP-001] Safari error handler initialized')

      // [SAFARI-EXT-POPUP-001] Initialize UI system with Safari optimizations
      this.uiSystem = await init({
        enableThemes: true,
        enableIcons: true,
        enableAssets: true,
        preloadCriticalAssets: true,
        // Safari-specific UI optimizations
        enableSafariOptimizations: this.isSafari,
        safariConfig: this.safariConfig
      })

      console.log('[SAFARI-EXT-POPUP-001] Safari UI system initialized')

      // Load configuration
      const config = await this.configManager.getConfig()
      console.log('[SAFARI-EXT-POPUP-001] Configuration loaded:', config)

      // [SAFARI-EXT-POPUP-001] Create popup with Safari-specific optimizations
      this.popupComponents = popup({
        errorHandler: this.errorHandler,
        enableKeyboard: true,
        enableState: true,
        config: config,
        // Safari-specific popup optimizations
        enableSafariOptimizations: this.isSafari,
        safariConfig: this.safariConfig
      })

      console.log('[SAFARI-EXT-POPUP-001] Safari popup components created')

      // [SAFARI-EXT-POPUP-001] Load initial data with Safari-specific error handling
      await this.popupComponents.controller.loadInitialData()

      console.log('[SAFARI-EXT-POPUP-001] Initial data loaded')

      // [SAFARI-EXT-POPUP-001] Setup UI with Safari-specific event handling
      this.popupComponents.uiManager.setupEventListeners()
      if (this.popupComponents.keyboardManager) {
        this.popupComponents.keyboardManager.setupKeyboardNavigation()
      }

      console.log('[SAFARI-EXT-POPUP-001] Safari event listeners setup complete')

      // [SAFARI-EXT-POPUP-001] Start Safari performance monitoring
      if (this.safariConfig.enablePerformanceMonitoring) {
        this.performanceMonitor = setInterval(this.monitorSafariPerformance, this.safariConfig.performanceMonitoringInterval)
        console.log('[SAFARI-EXT-POPUP-001] Safari performance monitoring started')
      }

      // Mark as initialized
      this.isInitialized = true

      console.log('[SAFARI-EXT-POPUP-001] Hoverboard popup initialized successfully with Safari optimizations')
    } catch (error) {
      console.error('[SAFARI-EXT-POPUP-001] Failed to initialize Safari popup:', error)
      await this.attemptSafariErrorRecovery({ type: 'initialization', error })
    }
  }

  /**
   * Handle errors from any component with Safari-specific enhancements
   */
  async handleError (message, errorInfo = null) {
    // Handle different parameter formats
    let errorMessage = message
    let actualError = errorInfo

    // If first parameter is an error object, adjust parameters
    if (typeof message === 'object' && message !== null) {
      actualError = message
      errorMessage = actualError.message || 'An unexpected error occurred'
    }

    console.error('[SAFARI-EXT-POPUP-001] Safari Popup Error:', errorMessage, actualError)

    // [SAFARI-EXT-POPUP-001] Safari-specific error categorization
    let errorType = 'general'
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      errorType = 'network'
    } else if (errorMessage.includes('permission') || errorMessage.includes('denied')) {
      errorType = 'permission'
    } else if (errorMessage.includes('auth') || errorMessage.includes('token')) {
      errorType = 'auth'
    } else if (errorMessage.includes('memory') || errorMessage.includes('performance')) {
      errorType = 'performance'
    }

    // [SAFARI-EXT-POPUP-001] Safari-specific error recovery
    if (this.safariConfig.enableErrorRecovery && errorType !== 'auth') {
      const recoverySuccessful = await this.attemptSafariErrorRecovery({ type: errorType, error: actualError })
      if (recoverySuccessful) {
        console.log('[SAFARI-EXT-POPUP-001] Safari error recovery successful, continuing...')
        return
      }
    }

    // [SAFARI-EXT-POPUP-001] Safari-specific error messages
    let userMessage = 'An unexpected error occurred. Please try again.'
    
    if (errorType === 'auth') {
      userMessage = 'Please configure your Pinboard API token in the extension options.'
    } else if (errorType === 'network') {
      userMessage = 'Network error. Please check your connection and try again.'
    } else if (errorType === 'permission') {
      userMessage = 'Permission denied. Please check extension permissions.'
    } else if (errorType === 'performance') {
      userMessage = 'Performance issue detected. Please try refreshing the popup.'
    }

    // Show error in UI if possible
    if (this.popupComponents && this.popupComponents.uiManager) {
      this.popupComponents.uiManager.showError(userMessage)
    }
  }

  /**
   * Cleanup resources when popup is closed with Safari-specific cleanup
   */
  cleanup () {
    console.log('[SAFARI-EXT-POPUP-001] Cleaning up Safari popup resources...')

    // [SAFARI-EXT-POPUP-001] Stop Safari performance monitoring
    if (this.performanceMonitor) {
      clearInterval(this.performanceMonitor)
      this.performanceMonitor = null
      console.log('[SAFARI-EXT-POPUP-001] Safari performance monitoring stopped')
    }

    // [SAFARI-EXT-POPUP-001] Cleanup popup components with Safari-specific cleanup
    if (this.popupComponents) {
      if (this.popupComponents.keyboardManager) {
        this.popupComponents.keyboardManager.cleanup()
      }

      if (this.popupComponents.uiManager) {
        this.popupComponents.uiManager.cleanup()
      }

      if (this.popupComponents.controller) {
        this.popupComponents.controller.cleanup()
      }
    }

    // [SAFARI-EXT-POPUP-001] Cleanup UI system with Safari-specific cleanup
    if (this.uiSystem) {
      this.uiSystem.cleanup()
    }

    // [SAFARI-EXT-POPUP-001] Reset Safari-specific state
    this.errorRecoveryAttempts = 0
    this.isInitialized = false

    console.log('[SAFARI-EXT-POPUP-001] Safari popup cleanup completed')
  }
}

// Application instance
let app = null

/**
 * Initialize the application when DOM is ready with Safari-specific initialization
 */
function initializeApp () {
  try {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeApp)
      return
    }

    console.log('[SAFARI-EXT-POPUP-001] DOM ready, creating Safari-optimized Hoverboard popup...')
    app = new HoverboardPopup()
    app.init().catch(error => {
      console.error('[SAFARI-EXT-POPUP-001] Failed to initialize Safari Hoverboard popup:', error)

      // Try to show error in UI if possible
      if (app && app.popupComponents && app.popupComponents.uiManager) {
        app.popupComponents.uiManager.showError('Failed to initialize Safari popup. Please try reloading the extension.')
      }
    })
  } catch (error) {
    console.error('[SAFARI-EXT-POPUP-001] Critical error during Safari popup initialization:', error)
  }
}

/**
 * Cleanup when window is about to close with Safari-specific cleanup
 */
window.addEventListener('beforeunload', () => {
  if (app) {
    app.cleanup()
  }
})

// Initialize the application
initializeApp()
