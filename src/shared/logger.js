/**
 * === IMPL-FULL-BLOCK: IMPL-LOG_LEVEL_CONFIG ===
 * [IMPL-LOG_LEVEL_CONFIG] [ARCH-STRUCTURED_LOGGING] [REQ-STRUCTURED_LOGGING] — getLogLevel from environment; production => warn, else debug; used by shouldLog. Contract: no input; returns current log level; env and defaults.
 *
 * ## GET_LOG_LEVEL
 *
 * - [IMPL-LOG_LEVEL_CONFIG] [ARCH-STRUCTURED_LOGGING] [REQ-STRUCTURED_LOGGING] How: Implements getLogLevel() behavior for IMPL-LOG_LEVEL_CONFIG.
 * - Contract:
 *   - INPUT: none (reads environment)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: current log level (e.g. "debug" | "info" | "warn" | "error") | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: NODE_ENV or browser equivalent; production => warn, else => debug
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: GET_LOG_LEVEL
 *   - env = read NODE_ENV or process.env (browser fallback)
 *   - IF env = "production": RETURN "warn"
 *   - RETURN "debug" (or override from config)
 *   - How (sub-block): Logger.shouldLog(level): emit only if level >= getLogLevel().
 *   - 1. Used by Logger.shouldLog(level): IF level >= getLogLevel() then emit else skip.
 *
 * === END IMPL-FULL-BLOCK: IMPL-LOG_LEVEL_CONFIG ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-LOGGER_CONTEXT_LEVELS ===
 * [IMPL-LOGGER_CONTEXT_LEVELS] [ARCH-STRUCTURED_LOGGING] [REQ-STRUCTURED_LOGGING] — Logger with context, shouldLog, formatMessage, debug/info/warn/error; default logger and createLogger. Contract: context and level/args in; formatted line out; uses getLogLevel.
 *
 * ## LOGGER
 *
 * - [IMPL-LOGGER_CONTEXT_LEVELS] [ARCH-STRUCTURED_LOGGING] [REQ-STRUCTURED_LOGGING] How: Implements Logger(context) behavior for IMPL-LOGGER_CONTEXT_LEVELS.
 * - Contract:
 *   - INPUT: context (string), level (debug|info|warn|error), message/args
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: formatted log line to console (or transport); no return
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: Logger instance; getLogLevel() from IMPL-LOG_LEVEL_CONFIG
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: LOGGER
 *   - this.context = context
 *   - How (sub-block): Compare level to getLogLevel(); return true if should emit.
 *
 * ## SHOULD_LOG
 *
 * - [IMPL-LOGGER_CONTEXT_LEVELS] [ARCH-STRUCTURED_LOGGING] [REQ-STRUCTURED_LOGGING] How: Implements shouldLog(level) behavior for IMPL-LOGGER_CONTEXT_LEVELS.
 * - Contract:
 *   - INPUT: context (string), level (debug|info|warn|error), message/args
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: formatted log line to console (or transport); no return
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: Logger instance; getLogLevel() from IMPL-LOG_LEVEL_CONFIG
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: SHOULD_LOG
 *   - minLevel = getLogLevel()
 *   - RETURN level >= minLevel (by severity order)
 *   - How (sub-block): Prefix with context and level; format args.
 *
 * ## FORMAT_MESSAGE
 *
 * - [IMPL-LOGGER_CONTEXT_LEVELS] [ARCH-STRUCTURED_LOGGING] [REQ-STRUCTURED_LOGGING] How: Implements formatMessage(level, ...args) behavior for IMPL-LOGGER_CONTEXT_LEVELS.
 * - Contract:
 *   - INPUT: context (string), level (debug|info|warn|error), message/args
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: formatted log line to console (or transport); no return
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: Logger instance; getLogLevel() from IMPL-LOG_LEVEL_CONFIG
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: FORMAT_MESSAGE
 *   - RETURN "[context] level: args..." or structured format
 *   - How (sub-block): Emit only when shouldLog(level); output formatMessage.
 *
 * ## DEBUG
 *
 * - [IMPL-LOGGER_CONTEXT_LEVELS] [ARCH-STRUCTURED_LOGGING] [REQ-STRUCTURED_LOGGING] How: Implements debug(...), info(...), warn(...), error(...) behavior for IMPL-LOGGER_CONTEXT_LEVELS.
 * - Contract:
 *   - INPUT: context (string), level (debug|info|warn|error), message/args
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: formatted log line to console (or transport); no return | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: Logger instance; getLogLevel() from IMPL-LOG_LEVEL_CONFIG
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: DEBUG
 *   - IF shouldLog(level): OUTPUT formatMessage(level, ...args)
 *   - 1. logger = default Logger; createLogger(context) = new Logger(context).
 *
 * === END IMPL-FULL-BLOCK: IMPL-LOGGER_CONTEXT_LEVELS ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-LOGGER_LEGACY ===
 * [IMPL-LOGGER_LEGACY] [ARCH-STRUCTURED_LOGGING] [REQ-STRUCTURED_LOGGING] — log() and noisy() for legacy compatibility; log maps to debug; noisy always emits. Contract: context and args in; log line out.
 *
 * ## LOG
 *
 * - [IMPL-LOGGER_LEGACY] [ARCH-STRUCTURED_LOGGING] [REQ-STRUCTURED_LOGGING] How: Implements log(context, ...args) behavior for IMPL-LOGGER_LEGACY.
 * - Contract:
 *   - INPUT: context (string), ...args (message or interpolated values)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: log line to console
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: log and noisy in same logger module
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: State
 *   - TERMINATION: total
 * - PROCEDURE: LOG
 *   - CALL default logger.debug or createLogger(context).debug(...args)
 *   - (Same as Logger.debug so level filtering applies)
 *   - How (sub-block): Emit regardless of level; for migration/debug; remove when call sites use Logger.
 *
 * ## NOISY
 *
 * - [IMPL-LOGGER_LEGACY] [ARCH-STRUCTURED_LOGGING] [REQ-STRUCTURED_LOGGING] How: Implements noisy(context, ...args) behavior for IMPL-LOGGER_LEGACY.
 * - Contract:
 *   - INPUT: context (string), ...args (message or interpolated values)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: log line to console
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: log and noisy in same logger module
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: State
 *   - TERMINATION: total
 * - PROCEDURE: NOISY
 *   - EMIT log line regardless of level (or at debug)
 *   - Used for temporary migration/debug; can be removed when call sites use Logger directly.
 *
 * === END IMPL-FULL-BLOCK: IMPL-LOGGER_LEGACY ===
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
