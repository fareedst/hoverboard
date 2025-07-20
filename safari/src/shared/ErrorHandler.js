/**
 * ErrorHandler - Centralized error handling for the extension
 * 
 * [SAFARI-EXT-ERROR-001] Safari-specific error handling framework
 * Enhanced with Safari platform detection, error recovery, and graceful degradation
 */

export class ErrorHandler {
  constructor () {
    this.errorLog = []
    this.maxLogSize = 100
    this.onError = null
    this.isDebugging = false

    // [SAFARI-EXT-ERROR-001] Safari-specific error handling configuration
    this.safariConfig = {
      enableSafariErrorRecovery: true,
      maxSafariRecoveryAttempts: 3,
      safariRecoveryDelay: 1000,
      enableSafariGracefulDegradation: true,
      enableSafariErrorReporting: true,
      safariErrorTimeout: 5000,
      enableSafariPerformanceMonitoring: true
    }

    // Error type categories
    this.errorTypes = {
      NETWORK: 'network',
      PERMISSION: 'permission',
      VALIDATION: 'validation',
      RUNTIME: 'runtime',
      STORAGE: 'storage',
      CONTENT_SCRIPT: 'content_script',
      BACKGROUND: 'background',
      USER_INPUT: 'user_input',
      // [SAFARI-EXT-ERROR-001] Safari-specific error types
      SAFARI_SPECIFIC: 'safari_specific',
      SAFARI_MESSAGING: 'safari_messaging',
      SAFARI_STORAGE: 'safari_storage',
      SAFARI_UI: 'safari_ui',
      SAFARI_PERFORMANCE: 'safari_performance'
    }

    // [SAFARI-EXT-ERROR-001] Safari error recovery state
    this.safariRecoveryState = {
      recoveryAttempts: 0,
      lastRecoveryTime: 0,
      recoveryInProgress: false,
      degradedMode: false
    }

    // Setup global error handlers
    this.setupGlobalHandlers()
    
    // [SAFARI-EXT-ERROR-001] Initialize Safari-specific error handling
    this.initializeSafariErrorHandling()
  }

  /**
   * [SAFARI-EXT-ERROR-001] Initialize Safari-specific error handling
   */
  initializeSafariErrorHandling() {
    try {
      console.log('[SAFARI-EXT-ERROR-001] Initializing Safari error handling')
      
      // Detect Safari platform
      this.isSafari = this.detectSafariPlatform()
      
      if (this.isSafari) {
        console.log('[SAFARI-EXT-ERROR-001] Safari platform detected, enabling Safari-specific error handling')
        this.enableSafariErrorHandling()
      } else {
        console.log('[SAFARI-EXT-ERROR-001] Non-Safari platform detected, using standard error handling')
      }
    } catch (error) {
      console.warn('[SAFARI-EXT-ERROR-001] Failed to initialize Safari error handling:', error)
    }
  }

  /**
   * [SAFARI-EXT-ERROR-001] Detect Safari platform
   */
  detectSafariPlatform() {
    try {
      // Check for Safari-specific APIs
      const isSafari = typeof safari !== 'undefined' || 
                      (typeof window !== 'undefined' && window.safari) ||
                      navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome')
      
      console.log('[SAFARI-EXT-ERROR-001] Safari platform detection result:', isSafari)
      return isSafari
    } catch (error) {
      console.warn('[SAFARI-EXT-ERROR-001] Safari platform detection failed:', error)
      return false
    }
  }

  /**
   * [SAFARI-EXT-ERROR-001] Enable Safari-specific error handling
   */
  enableSafariErrorHandling() {
    try {
      // Setup Safari-specific error handlers
      this.setupSafariErrorHandlers()
      
      // Initialize Safari performance monitoring
      if (this.safariConfig.enableSafariPerformanceMonitoring) {
        this.initializeSafariPerformanceMonitoring()
      }
      
      // Setup Safari error recovery mechanisms
      this.setupSafariErrorRecovery()
      
      console.log('[SAFARI-EXT-ERROR-001] Safari error handling enabled')
    } catch (error) {
      console.warn('[SAFARI-EXT-ERROR-001] Failed to enable Safari error handling:', error)
    }
  }

  /**
   * [SAFARI-EXT-ERROR-001] Setup Safari-specific error handlers
   */
  setupSafariErrorHandlers() {
    try {
      // Safari-specific unhandled promise rejection handler
      window.addEventListener('unhandledrejection', (event) => {
        console.error('[SAFARI-EXT-ERROR-001] Safari Unhandled Promise Rejection:', {
          reason: event.reason,
          promise: event.promise,
          stack: event.reason?.stack,
          message: event.reason?.message
        })
        
        // Handle Safari-specific promise rejection
        this.handleSafariPromiseRejection(event.reason)
        event.preventDefault()
      })

      // Safari-specific global error handler
      window.addEventListener('error', (event) => {
        console.error('[SAFARI-EXT-ERROR-001] Safari Global Error:', {
          error: event.error,
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        })
        
        // Handle Safari-specific global error
        this.handleSafariGlobalError(event)
      })

      console.log('[SAFARI-EXT-ERROR-001] Safari error handlers setup complete')
    } catch (error) {
      console.warn('[SAFARI-EXT-ERROR-001] Failed to setup Safari error handlers:', error)
    }
  }

  /**
   * [SAFARI-EXT-ERROR-001] Handle Safari-specific promise rejection
   */
  handleSafariPromiseRejection(reason) {
    try {
      const errorInfo = this.createSafariErrorInfo('Safari Promise Rejection', reason, this.errorTypes.SAFARI_SPECIFIC)
      
      // Attempt Safari-specific error recovery
      if (this.safariConfig.enableSafariErrorRecovery) {
        this.attemptSafariErrorRecovery(errorInfo)
      }
      
      // Handle error normally
      this.handleError('Safari Promise Rejection', reason, this.errorTypes.SAFARI_SPECIFIC)
    } catch (error) {
      console.error('[SAFARI-EXT-ERROR-001] Failed to handle Safari promise rejection:', error)
    }
  }

  /**
   * [SAFARI-EXT-ERROR-001] Handle Safari-specific global error
   */
  handleSafariGlobalError(event) {
    try {
      const errorInfo = this.createSafariErrorInfo('Safari Global Error', event.error || event.message, this.errorTypes.SAFARI_SPECIFIC)
      
      // Attempt Safari-specific error recovery
      if (this.safariConfig.enableSafariErrorRecovery) {
        this.attemptSafariErrorRecovery(errorInfo)
      }
      
      // Handle error normally
      this.handleError('Safari Global Error', event.error || event.message, this.errorTypes.SAFARI_SPECIFIC)
    } catch (error) {
      console.error('[SAFARI-EXT-ERROR-001] Failed to handle Safari global error:', error)
    }
  }

  /**
   * [SAFARI-EXT-ERROR-001] Create Safari-specific error information
   */
  createSafariErrorInfo(message, error, type, context = {}) {
    const errorInfo = this.createErrorInfo(message, error, type, context)
    
    // Add Safari-specific information
    errorInfo.safari = {
      platform: 'safari',
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      recoveryAttempts: this.safariRecoveryState.recoveryAttempts,
      degradedMode: this.safariRecoveryState.degradedMode
    }
    
    // Add Safari extension specific info
    if (typeof safari !== 'undefined' && safari.extension) {
      errorInfo.safari.extensionId = safari.extension.globalPage.contentWindow.location.href
    }
    
    return errorInfo
  }

  /**
   * [SAFARI-EXT-ERROR-001] Attempt Safari-specific error recovery
   */
  async attemptSafariErrorRecovery(errorInfo) {
    try {
      if (this.safariRecoveryState.recoveryInProgress) {
        console.log('[SAFARI-EXT-ERROR-001] Safari error recovery already in progress')
        return
      }
      
      if (this.safariRecoveryState.recoveryAttempts >= this.safariConfig.maxSafariRecoveryAttempts) {
        console.warn('[SAFARI-EXT-ERROR-001] Max Safari recovery attempts reached')
        this.enableSafariDegradedMode()
        return
      }
      
      this.safariRecoveryState.recoveryInProgress = true
      this.safariRecoveryState.recoveryAttempts++
      
      console.log(`[SAFARI-EXT-ERROR-001] Attempting Safari error recovery (${this.safariRecoveryState.recoveryAttempts}/${this.safariConfig.maxSafariRecoveryAttempts})`)
      
      // Wait before attempting recovery
      await this.delay(this.safariConfig.safariRecoveryDelay)
      
      // Attempt recovery based on error type
      const recoverySuccessful = await this.performSafariErrorRecovery(errorInfo)
      
      if (recoverySuccessful) {
        console.log('[SAFARI-EXT-ERROR-001] Safari error recovery successful')
        this.safariRecoveryState.recoveryAttempts = 0
      } else {
        console.warn('[SAFARI-EXT-ERROR-001] Safari error recovery failed')
      }
      
      this.safariRecoveryState.recoveryInProgress = false
      this.safariRecoveryState.lastRecoveryTime = Date.now()
      
    } catch (error) {
      console.error('[SAFARI-EXT-ERROR-001] Safari error recovery failed:', error)
      this.safariRecoveryState.recoveryInProgress = false
    }
  }

  /**
   * [SAFARI-EXT-ERROR-001] Perform Safari-specific error recovery
   */
  async performSafariErrorRecovery(errorInfo) {
    try {
      switch (errorInfo.type) {
        case this.errorTypes.SAFARI_MESSAGING:
          return await this.recoverSafariMessagingError(errorInfo)
        case this.errorTypes.SAFARI_STORAGE:
          return await this.recoverSafariStorageError(errorInfo)
        case this.errorTypes.SAFARI_UI:
          return await this.recoverSafariUIError(errorInfo)
        case this.errorTypes.SAFARI_PERFORMANCE:
          return await this.recoverSafariPerformanceError(errorInfo)
        default:
          return await this.recoverSafariGenericError(errorInfo)
      }
    } catch (error) {
      console.error('[SAFARI-EXT-ERROR-001] Safari error recovery failed:', error)
      return false
    }
  }

  /**
   * [SAFARI-EXT-ERROR-001] Recover Safari messaging error
   */
  async recoverSafariMessagingError(errorInfo) {
    try {
      console.log('[SAFARI-EXT-ERROR-001] Attempting Safari messaging error recovery')
      
      // Attempt to reinitialize message client
      if (window.messageClient) {
        await window.messageClient.reinitialize()
        return true
      }
      
      return false
    } catch (error) {
      console.error('[SAFARI-EXT-ERROR-001] Safari messaging error recovery failed:', error)
      return false
    }
  }

  /**
   * [SAFARI-EXT-ERROR-001] Recover Safari storage error
   */
  async recoverSafariStorageError(errorInfo) {
    try {
      console.log('[SAFARI-EXT-ERROR-001] Attempting Safari storage error recovery')
      
      // Attempt to clear and reinitialize storage
      if (typeof browser !== 'undefined' && browser.storage) {
        await browser.storage.local.clear()
        return true
      }
      
      return false
    } catch (error) {
      console.error('[SAFARI-EXT-ERROR-001] Safari storage error recovery failed:', error)
      return false
    }
  }

  /**
   * [SAFARI-EXT-ERROR-001] Recover Safari UI error
   */
  async recoverSafariUIError(errorInfo) {
    try {
      console.log('[SAFARI-EXT-ERROR-001] Attempting Safari UI error recovery')
      
      // Attempt to reinitialize UI components
      if (window.uiManager) {
        await window.uiManager.reinitialize()
        return true
      }
      
      return false
    } catch (error) {
      console.error('[SAFARI-EXT-ERROR-001] Safari UI error recovery failed:', error)
      return false
    }
  }

  /**
   * [SAFARI-EXT-ERROR-001] Recover Safari performance error
   */
  async recoverSafariPerformanceError(errorInfo) {
    try {
      console.log('[SAFARI-EXT-ERROR-001] Attempting Safari performance error recovery')
      
      // Attempt to optimize performance
      if (window.performance && window.performance.memory) {
        // Force garbage collection if available
        if (window.gc) {
          window.gc()
        }
        
        // Clear any caches
        if (window.caches) {
          const cacheNames = await window.caches.keys()
          await Promise.all(cacheNames.map(name => window.caches.delete(name)))
        }
        
        return true
      }
      
      return false
    } catch (error) {
      console.error('[SAFARI-EXT-ERROR-001] Safari performance error recovery failed:', error)
      return false
    }
  }

  /**
   * [SAFARI-EXT-ERROR-001] Recover Safari generic error
   */
  async recoverSafariGenericError(errorInfo) {
    try {
      console.log('[SAFARI-EXT-ERROR-001] Attempting Safari generic error recovery')
      
      // Generic recovery: wait and retry
      await this.delay(this.safariConfig.safariRecoveryDelay * 2)
      
      // Check if error is resolved
      return !this.hasActiveErrors()
    } catch (error) {
      console.error('[SAFARI-EXT-ERROR-001] Safari generic error recovery failed:', error)
      return false
    }
  }

  /**
   * [SAFARI-EXT-ERROR-001] Enable Safari degraded mode
   */
  enableSafariDegradedMode() {
    try {
      console.warn('[SAFARI-EXT-ERROR-001] Enabling Safari degraded mode')
      
      this.safariRecoveryState.degradedMode = true
      
      // Disable non-essential features
      if (this.safariConfig.enableSafariGracefulDegradation) {
        this.applySafariGracefulDegradation()
      }
      
      // Notify UI of degraded mode
      if (this.onError) {
        this.onError('Safari extension is running in degraded mode due to repeated errors', {
          type: 'safari_degraded_mode',
          degradedMode: true
        })
      }
    } catch (error) {
      console.error('[SAFARI-EXT-ERROR-001] Failed to enable Safari degraded mode:', error)
    }
  }

  /**
   * [SAFARI-EXT-ERROR-001] Apply Safari graceful degradation
   */
  applySafariGracefulDegradation() {
    try {
      console.log('[SAFARI-EXT-ERROR-001] Applying Safari graceful degradation')
      
      // Disable performance monitoring
      this.safariConfig.enableSafariPerformanceMonitoring = false
      
      // Reduce error recovery attempts
      this.safariConfig.maxSafariRecoveryAttempts = 1
      
      // Disable complex error recovery
      this.safariConfig.enableSafariErrorRecovery = false
      
      console.log('[SAFARI-EXT-ERROR-001] Safari graceful degradation applied')
    } catch (error) {
      console.error('[SAFARI-EXT-ERROR-001] Failed to apply Safari graceful degradation:', error)
    }
  }

  /**
   * [SAFARI-EXT-ERROR-001] Setup Safari error recovery
   */
  setupSafariErrorRecovery() {
    try {
      // Setup periodic error recovery checks
      setInterval(() => {
        if (this.safariRecoveryState.degradedMode && this.hasActiveErrors()) {
          console.log('[SAFARI-EXT-ERROR-001] Checking for Safari error recovery opportunities')
          this.checkSafariErrorRecovery()
        }
      }, 30000) // Check every 30 seconds
      
      console.log('[SAFARI-EXT-ERROR-001] Safari error recovery setup complete')
    } catch (error) {
      console.warn('[SAFARI-EXT-ERROR-001] Failed to setup Safari error recovery:', error)
    }
  }

  /**
   * [SAFARI-EXT-ERROR-001] Check Safari error recovery
   */
  async checkSafariErrorRecovery() {
    try {
      if (!this.hasActiveErrors()) {
        console.log('[SAFARI-EXT-ERROR-001] No active errors, attempting to restore normal mode')
        this.restoreSafariNormalMode()
      }
    } catch (error) {
      console.error('[SAFARI-EXT-ERROR-001] Safari error recovery check failed:', error)
    }
  }

  /**
   * [SAFARI-EXT-ERROR-001] Restore Safari normal mode
   */
  restoreSafariNormalMode() {
    try {
      console.log('[SAFARI-EXT-ERROR-001] Restoring Safari normal mode')
      
      this.safariRecoveryState.degradedMode = false
      this.safariRecoveryState.recoveryAttempts = 0
      
      // Re-enable features
      this.safariConfig.enableSafariPerformanceMonitoring = true
      this.safariConfig.maxSafariRecoveryAttempts = 3
      this.safariConfig.enableSafariErrorRecovery = true
      
      console.log('[SAFARI-EXT-ERROR-001] Safari normal mode restored')
    } catch (error) {
      console.error('[SAFARI-EXT-ERROR-001] Failed to restore Safari normal mode:', error)
    }
  }

  /**
   * [SAFARI-EXT-ERROR-001] Initialize Safari performance monitoring
   */
  initializeSafariPerformanceMonitoring() {
    try {
      console.log('[SAFARI-EXT-ERROR-001] Initializing Safari performance monitoring')
      
      // Monitor memory usage
      setInterval(() => {
        this.monitorSafariPerformance()
      }, 30000) // Check every 30 seconds
      
      console.log('[SAFARI-EXT-ERROR-001] Safari performance monitoring initialized')
    } catch (error) {
      console.warn('[SAFARI-EXT-ERROR-001] Failed to initialize Safari performance monitoring:', error)
    }
  }

  /**
   * [SAFARI-EXT-ERROR-001] Monitor Safari performance
   */
  monitorSafariPerformance() {
    try {
      if (window.performance && window.performance.memory) {
        const memoryInfo = window.performance.memory
        const memoryUsagePercent = (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100
        
        if (memoryUsagePercent > 90) {
          console.warn('[SAFARI-EXT-ERROR-001] Critical Safari memory usage:', memoryUsagePercent.toFixed(1) + '%')
          this.handleError('Safari Critical Memory Usage', `Memory usage: ${memoryUsagePercent.toFixed(1)}%`, this.errorTypes.SAFARI_PERFORMANCE)
        } else if (memoryUsagePercent > 70) {
          console.log('[SAFARI-EXT-ERROR-001] High Safari memory usage:', memoryUsagePercent.toFixed(1) + '%')
        }
      }
    } catch (error) {
      console.warn('[SAFARI-EXT-ERROR-001] Safari performance monitoring failed:', error)
    }
  }

  /**
   * [SAFARI-EXT-ERROR-001] Check if there are active errors
   */
  hasActiveErrors() {
    try {
      // Check recent errors (last 5 minutes)
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000)
      const recentErrors = this.errorLog.filter(error => 
        new Date(error.timestamp).getTime() > fiveMinutesAgo
      )
      
      return recentErrors.length > 0
    } catch (error) {
      console.warn('[SAFARI-EXT-ERROR-001] Failed to check active errors:', error)
      return false
    }
  }

  /**
   * [SAFARI-EXT-ERROR-001] Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Setup global error handlers
   */
  setupGlobalHandlers () {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled Promise Rejection Details:', {
        reason: event.reason,
        promise: event.promise,
        stack: event.reason?.stack,
        message: event.reason?.message
      })
      this.handleError('Unhandled Promise Rejection', event.reason, this.errorTypes.RUNTIME)
      event.preventDefault()
    })

    // Handle global errors
    window.addEventListener('error', (event) => {
      console.error('Global Error Details:', {
        error: event.error,
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      })
      this.handleError('Global Error', event.error || event.message, this.errorTypes.RUNTIME)
    })
  }

  /**
   * Main error handling method
   */
  handleError (message, error = null, type = this.errorTypes.RUNTIME, context = {}) {
    const errorInfo = this.createErrorInfo(message, error, type, context)

    // Add to error log
    this.addToLog(errorInfo)

    // Log to console in development
    if (this.isDebugging) {
      console.error('ErrorHandler:', errorInfo)
    }

    // Report to error tracking service (if configured)
    this.reportError(errorInfo)

    // Notify UI layer
    if (this.onError) {
      try {
        this.onError(this.getUserFriendlyMessage(errorInfo), errorInfo)
      } catch (callbackError) {
        console.error('Error in error handler callback:', callbackError)
      }
    }

    return errorInfo
  }

  /**
   * Create standardized error information
   */
  createErrorInfo (message, error, type, context) {
    const errorInfo = {
      id: this.generateErrorId(),
      message,
      type,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      context
    }

    // Extract error details
    if (error) {
      if (error instanceof Error) {
        errorInfo.stack = error.stack
        errorInfo.name = error.name
        errorInfo.originalMessage = error.message
      } else if (typeof error === 'string') {
        errorInfo.originalMessage = error
      } else {
        errorInfo.originalMessage = JSON.stringify(error)
      }
    }

    // Add Chrome extension specific info
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      errorInfo.extensionId = chrome.runtime.id
      if (chrome.runtime.lastError) {
        errorInfo.chromeError = chrome.runtime.lastError.message
      }
    }

    return errorInfo
  }

  /**
   * Add error to log
   */
  addToLog (errorInfo) {
    this.errorLog.unshift(errorInfo)

    // Limit log size
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize)
    }
  }

  /**
   * Generate unique error ID
   */
  generateErrorId () {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get user-friendly error message
   */
  getUserFriendlyMessage (errorInfo) {
    const typeMessages = {
      [this.errorTypes.NETWORK]: 'Network connection problem. Please check your internet connection.',
      [this.errorTypes.PERMISSION]: 'Permission denied. Please check extension permissions.',
      [this.errorTypes.VALIDATION]: 'Invalid input. Please check your data and try again.',
      [this.errorTypes.STORAGE]: 'Storage problem. Please try again later.',
      [this.errorTypes.CONTENT_SCRIPT]: 'Page interaction problem. Please reload the page.',
      [this.errorTypes.BACKGROUND]: 'Extension service problem. Please reload the extension.',
      [this.errorTypes.USER_INPUT]: 'Invalid input. Please check your data.',
      [this.errorTypes.RUNTIME]: 'An unexpected error occurred. Please try again.',
      // [SAFARI-EXT-ERROR-001] Safari-specific error messages
      [this.errorTypes.SAFARI_SPECIFIC]: 'Safari-specific error occurred. Please try again.',
      [this.errorTypes.SAFARI_MESSAGING]: 'Safari messaging error. Please reload the extension.',
      [this.errorTypes.SAFARI_STORAGE]: 'Safari storage error. Please try again later.',
      [this.errorTypes.SAFARI_UI]: 'Safari UI error. Please reload the page.',
      [this.errorTypes.SAFARI_PERFORMANCE]: 'Safari performance issue. Please try again.'
    }

    // Check for specific error patterns
    if (errorInfo.originalMessage) {
      const message = errorInfo.originalMessage.toLowerCase()

      if (message.includes('network') || message.includes('fetch')) {
        return typeMessages[this.errorTypes.NETWORK]
      }

      if (message.includes('permission') || message.includes('denied')) {
        return typeMessages[this.errorTypes.PERMISSION]
      }

      if (message.includes('storage') || message.includes('quota')) {
        return typeMessages[this.errorTypes.SAFARI_STORAGE]
      }

      // [SAFARI-EXT-ERROR-001] Safari-specific error patterns
      if (message.includes('safari') || message.includes('webkit')) {
        return typeMessages[this.errorTypes.SAFARI_SPECIFIC]
      }
    }

    return typeMessages[errorInfo.type] || typeMessages[this.errorTypes.RUNTIME]
  }

  /**
   * Report error to tracking service
   */
  async reportError (errorInfo) {
    try {
      // In a production environment, you might send to an error tracking service
      // For now, we'll just store locally for debugging

      if (this.isDebugging) {
        await this.storeErrorLocally(errorInfo)
      }
    } catch (reportingError) {
      console.warn('Failed to report error:', reportingError)
    }
  }

  /**
   * Store error locally for debugging
   */
  async storeErrorLocally (errorInfo) {
    try {
      const result = await chrome.storage.local.get(['errorLog'])
      const existingLog = result.errorLog || []

      existingLog.unshift(errorInfo)

      // Keep only recent errors
      const trimmedLog = existingLog.slice(0, 50)

      await chrome.storage.local.set({ errorLog: trimmedLog })
    } catch (storageError) {
      console.warn('Failed to store error locally:', storageError)
    }
  }

  /**
   * Handle Chrome extension API errors
   */
  handleChromeError (operation, context = {}) {
    if (chrome.runtime.lastError) {
      this.handleError(
        `Chrome API Error in ${operation}`,
        chrome.runtime.lastError.message,
        this.errorTypes.RUNTIME,
        context
      )
      return true
    }
    return false
  }

  /**
   * Handle network/fetch errors
   */
  handleNetworkError (url, error, context = {}) {
    this.handleError(
      `Network Error: ${url}`,
      error,
      this.errorTypes.NETWORK,
      { url, ...context }
    )
  }

  /**
   * Handle validation errors
   */
  handleValidationError (field, value, rule, context = {}) {
    this.handleError(
      `Validation Error: ${field}`,
      `Value "${value}" failed validation rule: ${rule}`,
      this.errorTypes.VALIDATION,
      { field, value, rule, ...context }
    )
  }

  /**
   * Handle permission errors
   */
  handlePermissionError (permission, context = {}) {
    this.handleError(
      `Permission Error: ${permission}`,
      `Missing or denied permission: ${permission}`,
      this.errorTypes.PERMISSION,
      { permission, ...context }
    )
  }

  /**
   * Handle storage errors
   */
  handleStorageError (operation, error, context = {}) {
    this.handleError(
      `Storage Error: ${operation}`,
      error,
      this.errorTypes.STORAGE,
      { operation, ...context }
    )
  }

  /**
   * [SAFARI-EXT-ERROR-001] Handle Safari-specific errors
   */
  handleSafariError (operation, context = {}) {
    try {
      // Check for Safari-specific errors
      if (typeof safari !== 'undefined' && safari.extension) {
        const errorInfo = this.createSafariErrorInfo(
          `Safari Error: ${operation}`,
          null,
          this.errorTypes.SAFARI_SPECIFIC,
          { operation, ...context }
        )
        this.handleError(`Safari Error: ${operation}`, null, this.errorTypes.SAFARI_SPECIFIC, context)
        return errorInfo
      }
      
      // Check for Safari WebKit errors
      if (window.webkit && window.webkit.messageHandlers) {
        const errorInfo = this.createSafariErrorInfo(
          `Safari WebKit Error: ${operation}`,
          null,
          this.errorTypes.SAFARI_SPECIFIC,
          { operation, ...context }
        )
        this.handleError(`Safari WebKit Error: ${operation}`, null, this.errorTypes.SAFARI_SPECIFIC, context)
        return errorInfo
      }
      
      return null
    } catch (error) {
      console.error('[SAFARI-EXT-ERROR-001] Failed to handle Safari error:', error)
      return null
    }
  }

  /**
   * [SAFARI-EXT-ERROR-001] Handle Safari messaging errors
   */
  handleSafariMessagingError (operation, error, context = {}) {
    try {
      const errorInfo = this.createSafariErrorInfo(
        `Safari Messaging Error: ${operation}`,
        error,
        this.errorTypes.SAFARI_MESSAGING,
        { operation, ...context }
      )
      
      // Attempt Safari-specific error recovery
      if (this.safariConfig.enableSafariErrorRecovery) {
        this.attemptSafariErrorRecovery(errorInfo)
      }
      
      this.handleError(`Safari Messaging Error: ${operation}`, error, this.errorTypes.SAFARI_MESSAGING, context)
      return errorInfo
    } catch (error) {
      console.error('[SAFARI-EXT-ERROR-001] Failed to handle Safari messaging error:', error)
      return null
    }
  }

  /**
   * [SAFARI-EXT-ERROR-001] Handle Safari storage errors
   */
  handleSafariStorageError (operation, error, context = {}) {
    try {
      const errorInfo = this.createSafariErrorInfo(
        `Safari Storage Error: ${operation}`,
        error,
        this.errorTypes.SAFARI_STORAGE,
        { operation, ...context }
      )
      
      // Attempt Safari-specific error recovery
      if (this.safariConfig.enableSafariErrorRecovery) {
        this.attemptSafariErrorRecovery(errorInfo)
      }
      
      this.handleError(`Safari Storage Error: ${operation}`, error, this.errorTypes.SAFARI_STORAGE, context)
      return errorInfo
    } catch (error) {
      console.error('[SAFARI-EXT-ERROR-001] Failed to handle Safari storage error:', error)
      return null
    }
  }

  /**
   * [SAFARI-EXT-ERROR-001] Handle Safari UI errors
   */
  handleSafariUIError (operation, error, context = {}) {
    try {
      const errorInfo = this.createSafariErrorInfo(
        `Safari UI Error: ${operation}`,
        error,
        this.errorTypes.SAFARI_UI,
        { operation, ...context }
      )
      
      // Attempt Safari-specific error recovery
      if (this.safariConfig.enableSafariErrorRecovery) {
        this.attemptSafariErrorRecovery(errorInfo)
      }
      
      this.handleError(`Safari UI Error: ${operation}`, error, this.errorTypes.SAFARI_UI, context)
      return errorInfo
    } catch (error) {
      console.error('[SAFARI-EXT-ERROR-001] Failed to handle Safari UI error:', error)
      return null
    }
  }

  /**
   * [SAFARI-EXT-ERROR-001] Handle Safari performance errors
   */
  handleSafariPerformanceError (operation, error, context = {}) {
    try {
      const errorInfo = this.createSafariErrorInfo(
        `Safari Performance Error: ${operation}`,
        error,
        this.errorTypes.SAFARI_PERFORMANCE,
        { operation, ...context }
      )
      
      // Attempt Safari-specific error recovery
      if (this.safariConfig.enableSafariErrorRecovery) {
        this.attemptSafariErrorRecovery(errorInfo)
      }
      
      this.handleError(`Safari Performance Error: ${operation}`, error, this.errorTypes.SAFARI_PERFORMANCE, context)
      return errorInfo
    } catch (error) {
      console.error('[SAFARI-EXT-ERROR-001] Failed to handle Safari performance error:', error)
      return null
    }
  }

  /**
   * [SAFARI-EXT-ERROR-001] Get Safari error statistics
   */
  getSafariErrorStats () {
    try {
      const safariErrors = this.errorLog.filter(error => 
        error.type.startsWith('safari_') || 
        (error.safari && error.safari.platform === 'safari')
      )
      
      const stats = {
        total: safariErrors.length,
        byType: {},
        recoveryAttempts: this.safariRecoveryState.recoveryAttempts,
        degradedMode: this.safariRecoveryState.degradedMode,
        recoveryInProgress: this.safariRecoveryState.recoveryInProgress,
        lastRecoveryTime: this.safariRecoveryState.lastRecoveryTime
      }
      
      // Count by type
      safariErrors.forEach(error => {
        stats.byType[error.type] = (stats.byType[error.type] || 0) + 1
      })
      
      return stats
    } catch (error) {
      console.error('[SAFARI-EXT-ERROR-001] Failed to get Safari error stats:', error)
      return { total: 0, byType: {}, recoveryAttempts: 0, degradedMode: false }
    }
  }

  /**
   * [SAFARI-EXT-ERROR-001] Get Safari error recovery status
   */
  getSafariRecoveryStatus () {
    try {
      return {
        recoveryAttempts: this.safariRecoveryState.recoveryAttempts,
        maxAttempts: this.safariConfig.maxSafariRecoveryAttempts,
        degradedMode: this.safariRecoveryState.degradedMode,
        recoveryInProgress: this.safariRecoveryState.recoveryInProgress,
        lastRecoveryTime: this.safariRecoveryState.lastRecoveryTime,
        hasActiveErrors: this.hasActiveErrors(),
        isSafari: this.isSafari
      }
    } catch (error) {
      console.error('[SAFARI-EXT-ERROR-001] Failed to get Safari recovery status:', error)
      return { recoveryAttempts: 0, maxAttempts: 3, degradedMode: false, recoveryInProgress: false }
    }
  }

  /**
   * Set error callback
   */
  setErrorCallback (callback) {
    this.onError = callback
  }

  /**
   * Enable/disable debugging
   */
  setDebugging (enabled) {
    this.isDebugging = enabled
  }

  /**
   * Get error statistics
   */
  getErrorStats () {
    const stats = {
      total: this.errorLog.length,
      byType: {},
      recent: this.errorLog.slice(0, 5),
      oldest: this.errorLog.length > 0 ? this.errorLog[this.errorLog.length - 1].timestamp : null,
      newest: this.errorLog.length > 0 ? this.errorLog[0].timestamp : null
    }

    // Count by type
    this.errorLog.forEach(error => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1
    })

    return stats
  }

  /**
   * Get errors by type
   */
  getErrorsByType (type) {
    return this.errorLog.filter(error => error.type === type)
  }

  /**
   * Get recent errors
   */
  getRecentErrors (count = 10) {
    return this.errorLog.slice(0, count)
  }

  /**
   * Clear error log
   */
  clearLog () {
    this.errorLog = []
  }

  /**
   * Export error log
   */
  exportLog () {
    return {
      errors: this.errorLog,
      stats: this.getErrorStats(),
      exportedAt: new Date().toISOString(),
      version: '1.0'
    }
  }

  /**
   * Check if error should be retried
   */
  shouldRetry (errorInfo, attempt = 1, maxAttempts = 3) {
    // Don't retry validation or permission errors
    if (errorInfo.type === this.errorTypes.VALIDATION ||
        errorInfo.type === this.errorTypes.PERMISSION) {
      return false
    }

    // Don't retry if max attempts reached
    if (attempt >= maxAttempts) {
      return false
    }

    // Retry network and runtime errors
    return errorInfo.type === this.errorTypes.NETWORK ||
           errorInfo.type === this.errorTypes.RUNTIME
  }

  /**
   * Create retry delay (exponential backoff)
   */
  getRetryDelay (attempt) {
    return Math.min(1000 * Math.pow(2, attempt - 1), 10000)
  }

  /**
   * Cleanup error handler
   */
  cleanup () {
    this.errorLog = []
    this.onError = null

    // Remove global handlers if needed
    // (In practice, you might not want to remove these)
  }
}
