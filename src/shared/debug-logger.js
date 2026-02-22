/**
 * [IMPL-DEBUG_PANEL] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION] LOG_CATEGORIES and debugLogger for structured UI/message debug output.
 * [SAFARI-EXT-DEBUG-001] Enhanced debug logging system.
 */
/** @readonly [IMPL-DEBUG_PANEL] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION] Categories for filtering: ui, message, overlay, storage */
export const LOG_CATEGORIES = Object.freeze({
  UI: 'ui',
  MESSAGE: 'message',
  OVERLAY: 'overlay',
  STORAGE: 'storage'
})

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
    /** @type {string[]} When non-empty, only these categories are logged (e.g. ['message','ui']). Empty = all. */
    this.categoryFilter = []
  }

  /**
   * Core logging method with timestamp and component tracking
   * @param {string} level - Log level (ERROR, WARN, INFO, DEBUG, TRACE)
   * @param {string} component - Component name for tracking
   * @param {string} message - Log message
   * @param {*} data - Optional data to log
   * @param {string} [category] - Optional category (LOG_CATEGORIES.UI | MESSAGE | OVERLAY | STORAGE) for filtering
   */
  log (level, component, message, data = null, category = null) {
    if (!this.debugEnabled || this.logLevels[level] > this.currentLevel) {
      return
    }
    if (this.categoryFilter.length && category && !this.categoryFilter.includes(category)) {
      return
    }

    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${level}] [${component}]`
    const categoryPrefix = category ? `[${category}] ` : ''

    // Create log entry
    const logEntry = {
      timestamp: Date.now(),
      level,
      component,
      category: category || null,
      message,
      data
    }

    // Add to buffer
    this.addToBuffer(logEntry)

    // Output to console
    if (data) {
      console.log(prefix, categoryPrefix + message, data)
    } else {
      console.log(prefix, categoryPrefix + message)
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
   * @param {string} [category] - Optional category for filtering
   */
  error (component, message, data, category) {
    this.log('ERROR', component, message, data, category)
  }

  /**
   * Warning level logging
   * @param {string} component - Component name
   * @param {string} message - Warning message
   * @param {*} data - Optional warning data
   * @param {string} [category] - Optional category for filtering
   */
  warn (component, message, data, category) {
    this.log('WARN', component, message, data, category)
  }

  /**
   * Info level logging
   * @param {string} component - Component name
   * @param {string} message - Info message
   * @param {*} data - Optional info data
   * @param {string} [category] - Optional category for filtering
   */
  info (component, message, data, category) {
    this.log('INFO', component, message, data, category)
  }

  /**
   * Debug level logging
   * @param {string} component - Component name
   * @param {string} message - Debug message
   * @param {*} data - Optional debug data
   * @param {string} [category] - Optional category for filtering
   */
  debug (component, message, data, category) {
    this.log('DEBUG', component, message, data, category)
  }

  /**
   * Trace level logging
   * @param {string} component - Component name
   * @param {string} message - Trace message
   * @param {*} data - Optional trace data
   * @param {string} [category] - Optional category for filtering
   */
  trace (component, message, data, category) {
    this.log('TRACE', component, message, data, category)
  }

  /**
   * Set category filter: only log entries with these categories (empty = all).
   * @param {string[]} categories - e.g. [LOG_CATEGORIES.MESSAGE, LOG_CATEGORIES.UI]
   */
  setCategoryFilter (categories) {
    this.categoryFilter = Array.isArray(categories) ? categories : []
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
