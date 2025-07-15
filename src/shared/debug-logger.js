/**
 * Debug Logger - Enhanced logging system for Safari extension development
 * [SAFARI-EXT-DEBUG-001] Enhanced debug logging system
 *
 * This module provides comprehensive logging with levels, timestamps, and component tracking
 * to help debug extension loading issues and Safari-specific problems.
 */

class DebugLogger {
  constructor () {
    this.debugEnabled = true // Enable during development
    this.logLevels = {
      ERROR: 0,
      WARN: 1,
      INFO: 2,
      DEBUG: 3,
      TRACE: 4
    }
    this.currentLevel = this.logLevels.DEBUG
    this.logBuffer = [] // Store logs for analysis
    this.maxBufferSize = 1000
  }

  /**
   * Core logging method with timestamp and component tracking
   * @param {string} level - Log level (ERROR, WARN, INFO, DEBUG, TRACE)
   * @param {string} component - Component name for tracking
   * @param {string} message - Log message
   * @param {*} data - Optional data to log
   */
  log (level, component, message, data = null) {
    if (!this.debugEnabled || this.logLevels[level] > this.currentLevel) {
      return
    }

    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${level}] [${component}]`

    // Create log entry
    const logEntry = {
      timestamp: Date.now(),
      level,
      component,
      message,
      data
    }

    // Add to buffer
    this.addToBuffer(logEntry)

    // Output to console
    if (data) {
      console.log(prefix, message, data)
    } else {
      console.log(prefix, message)
    }
  }

  /**
   * Add log entry to buffer for later analysis
   * @param {Object} logEntry - Log entry object
   */
  addToBuffer (logEntry) {
    this.logBuffer.push(logEntry)

    // Limit buffer size
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift()
    }
  }

  /**
   * Error level logging
   * @param {string} component - Component name
   * @param {string} message - Error message
   * @param {*} data - Optional error data
   */
  error (component, message, data) {
    this.log('ERROR', component, message, data)
  }

  /**
   * Warning level logging
   * @param {string} component - Component name
   * @param {string} message - Warning message
   * @param {*} data - Optional warning data
   */
  warn (component, message, data) {
    this.log('WARN', component, message, data)
  }

  /**
   * Info level logging
   * @param {string} component - Component name
   * @param {string} message - Info message
   * @param {*} data - Optional info data
   */
  info (component, message, data) {
    this.log('INFO', component, message, data)
  }

  /**
   * Debug level logging
   * @param {string} component - Component name
   * @param {string} message - Debug message
   * @param {*} data - Optional debug data
   */
  debug (component, message, data) {
    this.log('DEBUG', component, message, data)
  }

  /**
   * Trace level logging
   * @param {string} component - Component name
   * @param {string} message - Trace message
   * @param {*} data - Optional trace data
   */
  trace (component, message, data) {
    this.log('TRACE', component, message, data)
  }

  /**
   * Set the current log level
   * @param {string} level - Log level to set
   */
  setLevel (level) {
    if (this.logLevels[level] !== undefined) {
      this.currentLevel = this.logLevels[level]
      this.info('DEBUG_LOGGER', `Log level set to ${level}`)
    }
  }

  /**
   * Enable or disable debug logging
   * @param {boolean} enabled - Whether to enable logging
   */
  setEnabled (enabled) {
    this.debugEnabled = enabled
    if (enabled) {
      this.info('DEBUG_LOGGER', 'Debug logging enabled')
    }
  }

  /**
   * Get recent log entries
   * @param {number} count - Number of recent entries to get
   * @returns {Array} Recent log entries
   */
  getRecentLogs (count = 50) {
    return this.logBuffer.slice(-count)
  }

  /**
   * Get logs for a specific component
   * @param {string} component - Component name to filter by
   * @returns {Array} Log entries for the component
   */
  getComponentLogs (component) {
    return this.logBuffer.filter(entry => entry.component === component)
  }

  /**
   * Get error logs only
   * @returns {Array} Error log entries
   */
  getErrorLogs () {
    return this.logBuffer.filter(entry => entry.level === 'ERROR')
  }

  /**
   * Clear the log buffer
   */
  clearLogs () {
    this.logBuffer = []
    this.info('DEBUG_LOGGER', 'Log buffer cleared')
  }

  /**
   * Generate a summary report of logging activity
   * @returns {Object} Log summary report
   */
  generateReport () {
    const report = {
      totalLogs: this.logBuffer.length,
      byLevel: {},
      byComponent: {},
      errors: this.getErrorLogs().length,
      recentActivity: this.getRecentLogs(10)
    }

    // Count by level
    this.logBuffer.forEach(entry => {
      report.byLevel[entry.level] = (report.byLevel[entry.level] || 0) + 1
      report.byComponent[entry.component] = (report.byComponent[entry.component] || 0) + 1
    })

    return report
  }
}

// Create singleton instance
export const debugLogger = new DebugLogger()

// Initialize logging
debugLogger.info('DEBUG_LOGGER', 'Debug logger initialized')
