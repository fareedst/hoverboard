/**
 * Modern Logger - Replaces legacy debug.js and console.js
 * Provides structured logging with levels and context
 *
 * [IMPL-LOGGER_CONTEXT_LEVELS] Structured logging with context and levels
 * [IMPL-LOG_LEVEL_CONFIG] Environment-aware log level configuration
 * [IMPL-LOGGER_LEGACY] Legacy compatibility for gradual migration
 */

export class Logger {
  constructor (context = 'Hoverboard') {
    // IMPL-LOGGER_CONTEXT_LEVELS: Context-based logging for component identification
    // IMPLEMENTATION DECISION: Default context identifies the extension for clear log attribution
    this.context = context
    // IMPL-LOG_LEVEL_CONFIG: Dynamic log level based on environment
    this.logLevel = this.getLogLevel()
  }

  // IMPL-LOG_LEVEL_CONFIG: Environment-based log level determination
  // SPECIFICATION: Production builds should minimize console output for performance
  // IMPLEMENTATION DECISION: Debug logs in development, warnings+ in production
  getLogLevel () {
    // Check if we're in a browser environment
    if (typeof process === 'undefined' || !process.env) {
      // Browser environment - use debug level for development
      return 'debug'
    }

    // Node.js environment - check NODE_ENV
    return process.env.NODE_ENV === 'production' ? 'warn' : 'debug'
  }

  // IMPL-LOGGER_CONTEXT_LEVELS: Log level filtering logic
  // IMPLEMENTATION DECISION: Numeric level comparison for efficient filtering
  shouldLog (level) {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 }
    return levels[level] >= levels[this.logLevel]
  }

  // IMPL-LOGGER_CONTEXT_LEVELS: Consistent message formatting with metadata
  // SPECIFICATION: Include timestamp, context, and level for log analysis
  // IMPLEMENTATION DECISION: ISO timestamp format for precise timing and parsing
  formatMessage (level, message, ...args) {
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${this.context}] [${level.toUpperCase()}]`
    return [prefix, message, ...args]
  }

  // IMPL-LOGGER_CONTEXT_LEVELS: Debug level logging - Development information
  // IMPLEMENTATION DECISION: Use console.log for debug to distinguish from info
  debug (message, ...args) {
    if (this.shouldLog('debug')) {
      console.log(...this.formatMessage('debug', message, ...args))
    }
  }

  // IMPL-LOGGER_CONTEXT_LEVELS: Info level logging - General information
  // IMPLEMENTATION DECISION: Use console.info for semantic clarity
  info (message, ...args) {
    if (this.shouldLog('info')) {
      console.info(...this.formatMessage('info', message, ...args))
    }
  }

  // IMPL-LOGGER_CONTEXT_LEVELS: Warning level logging - Non-critical issues
  // IMPLEMENTATION DECISION: Use console.warn for proper browser developer tools integration
  warn (message, ...args) {
    if (this.shouldLog('warn')) {
      console.warn(...this.formatMessage('warn', message, ...args))
    }
  }

  // IMPL-LOGGER_CONTEXT_LEVELS: Error level logging - Critical issues
  // IMPLEMENTATION DECISION: Use console.error for proper error tracking and debugging
  error (message, ...args) {
    if (this.shouldLog('error')) {
      console.error(...this.formatMessage('error', message, ...args))
    }
  }

  // IMPL-LOGGER_LEGACY: Legacy compatibility methods
  // SPECIFICATION: Maintain backward compatibility during gradual migration
  // IMPLEMENTATION DECISION: Map legacy log calls to debug level
  log (context, ...args) {
    this.debug(`[${context}]`, ...args)
  }
}

// IMPL-LOGGER_CONTEXT_LEVELS: Default logger instance for global use
// IMPLEMENTATION DECISION: Singleton pattern for consistent logging across modules
export const logger = new Logger()

// IMPL-LOGGER_CONTEXT_LEVELS: Factory function for context-specific loggers
// SPECIFICATION: Allow component-specific logging contexts
// IMPLEMENTATION DECISION: Factory pattern for flexible logger creation
export const createLogger = (context) => new Logger(context)

// IMPL-LOGGER_LEGACY: Legacy compatibility exports
// SPECIFICATION: Support existing codebase during migration
// IMPLEMENTATION DECISION: Maintain legacy API while adding modern functionality
export const log = (context, ...args) => logger.log(context, ...args)
export const noisy = false // Legacy flag - now controlled by log level
