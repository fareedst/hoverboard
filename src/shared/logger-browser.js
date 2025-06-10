/**
 * Browser-Compatible Logger
 * Simple logger for browser testing without Node.js dependencies
 */

export class Logger {
  constructor(context = 'Browser') {
    this.context = context;
    this.logLevel = 'debug'; // Always debug in browser tests
  }
  
  getLogLevel() {
    return 'debug';
  }
  
  shouldLog(level) {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    return levels[level] >= levels[this.logLevel];
  }
  
  formatMessage(level, message, ...args) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${this.context}] [${level.toUpperCase()}]`;
    return [prefix, message, ...args];
  }
  
  debug(message, ...args) {
    if (this.shouldLog('debug')) {
      console.log(...this.formatMessage('debug', message, ...args));
    }
  }
  
  info(message, ...args) {
    if (this.shouldLog('info')) {
      console.info(...this.formatMessage('info', message, ...args));
    }
  }
  
  warn(message, ...args) {
    if (this.shouldLog('warn')) {
      console.warn(...this.formatMessage('warn', message, ...args));
    }
  }
  
  error(message, ...args) {
    if (this.shouldLog('error')) {
      console.error(...this.formatMessage('error', message, ...args));
    }
  }
  
  log(context, ...args) {
    this.debug(`[${context}]`, ...args);
  }
}

// Default logger instance
export const logger = new Logger();

// Factory function for context-specific loggers
export const createLogger = (context) => new Logger(context);

// Legacy compatibility
export const log = (context, ...args) => logger.log(context, ...args);
export const noisy = false; 