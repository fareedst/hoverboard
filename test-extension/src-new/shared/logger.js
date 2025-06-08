/**
 * Modern Logger - Replaces legacy debug.js and console.js
 * Provides structured logging with levels and context
 */

export class Logger {
  constructor (context = 'Hoverboard') {
    this.context = context
    this.logLevel = this.getLogLevel()
  }

  getLogLevel () {
    // In development, show all logs. In production, show warnings and errors only.
    return process.env.NODE_ENV === 'production' ? 'warn' : 'debug'
  }

  shouldLog (level) {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 }
    return levels[level] >= levels[this.logLevel]
  }

  formatMessage (level, message, ...args) {
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${this.context}] [${level.toUpperCase()}]`
    return [prefix, message, ...args]
  }

  debug (message, ...args) {
    if (this.shouldLog('debug')) {
      console.log(...this.formatMessage('debug', message, ...args))
    }
  }

  info (message, ...args) {
    if (this.shouldLog('info')) {
      console.info(...this.formatMessage('info', message, ...args))
    }
  }

  warn (message, ...args) {
    if (this.shouldLog('warn')) {
      console.warn(...this.formatMessage('warn', message, ...args))
    }
  }

  error (message, ...args) {
    if (this.shouldLog('error')) {
      console.error(...this.formatMessage('error', message, ...args))
    }
  }

  // Legacy compatibility methods
  log (context, ...args) {
    this.debug(`[${context}]`, ...args)
  }
}

// Create default logger instance
export const logger = new Logger()

// Create context-specific loggers
export const createLogger = (context) => new Logger(context)

// Legacy compatibility exports
export const log = (context, ...args) => logger.log(context, ...args)
export const noisy = false // Legacy flag - now controlled by log level
