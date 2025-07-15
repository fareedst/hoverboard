/**
 * ErrorHandler - Centralized error handling for the extension
 */

import { browser } from './utils'; // [SAFARI-EXT-SHIM-001]

export class ErrorHandler {
  constructor () {
    this.errorLog = []
    this.maxLogSize = 100
    this.onError = null
    this.isDebugging = false

    // Error type categories
    this.errorTypes = {
      NETWORK: 'network',
      PERMISSION: 'permission',
      VALIDATION: 'validation',
      RUNTIME: 'runtime',
      STORAGE: 'storage',
      CONTENT_SCRIPT: 'content_script',
      BACKGROUND: 'background',
      USER_INPUT: 'user_input'
    }

    // Setup global error handlers
    this.setupGlobalHandlers()
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
    if (typeof browser !== 'undefined' && browser.runtime) {
      errorInfo.extensionId = browser.runtime.id
      if (browser.runtime.lastError) {
        errorInfo.chromeError = browser.runtime.lastError.message
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
      [this.errorTypes.RUNTIME]: 'An unexpected error occurred. Please try again.'
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
        return typeMessages[this.errorTypes.STORAGE]
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
      const result = await browser.storage.local.get(['errorLog'])
      const existingLog = result.errorLog || []

      existingLog.unshift(errorInfo)

      // Keep only recent errors
      const trimmedLog = existingLog.slice(0, 50)

      await browser.storage.local.set({ errorLog: trimmedLog })
    } catch (storageError) {
      console.warn('Failed to store error locally:', storageError)
    }
  }

  /**
   * Handle Chrome extension API errors
   */
  handleChromeError (operation, context = {}) {
    if (browser.runtime.lastError) {
      this.handleError(
        `Chrome API Error in ${operation}`,
        browser.runtime.lastError.message,
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
