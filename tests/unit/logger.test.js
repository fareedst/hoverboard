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
 * ## LOGGER_CONFIG_COMPOSITION
 *
 * - [IMPL-LOG_LEVEL_CONFIG] [IMPL-LOGGER_CONTEXT_LEVELS] [IMPL-LOGGER_LEGACY] [ARCH-STRUCTURED_LOGGING] [REQ-STRUCTURED_LOGGING] How: Supplies the environment-derived severity threshold consumed by context and legacy logger adapters.
 * - Contract:
 *   - INPUT: environment and requested log severity
 *   - PRE: environment access is available
 *   - OUTPUT: severity threshold used by logger callers
 *   - POST:
 *     - success => production resolves warn and non-production resolves debug unless configured otherwise
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: LOGGER_CONFIG_COMPOSITION
 *   - Read environment
 *   - Resolve threshold with GET_LOG_LEVEL
 *   - RETURN threshold to Logger and legacy log callers
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
 * ## LOGGER_CONFIG_COMPOSITION
 *
 * - [IMPL-LOGGER_CONTEXT_LEVELS] [IMPL-LOG_LEVEL_CONFIG] [IMPL-LOGGER_LEGACY] [ARCH-STRUCTURED_LOGGING] [REQ-STRUCTURED_LOGGING] How: Connects environment-derived log level configuration to context and legacy logger calls with consistent severity filtering.
 * - Contract:
 *   - INPUT: environment, logger context, severity, message arguments
 *   - PRE: log-level configuration and logger adapters are available
 *   - OUTPUT: emitted or suppressed formatted log line
 *   - POST:
 *     - success => production suppresses debug below warn while development emits the legacy path
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: LOGGER_CONFIG_COMPOSITION
 *   - level = GET_LOG_LEVEL()
 *   - IF requested severity is below level: suppress output
 *   - ELSE: format context and arguments
 *   - Route legacy log calls through the configured logger
 *   - Emit the resulting line
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
 * ## LOGGER_CONFIG_COMPOSITION
 *
 * - [IMPL-LOGGER_LEGACY] [IMPL-LOGGER_CONTEXT_LEVELS] [IMPL-LOG_LEVEL_CONFIG] [ARCH-STRUCTURED_LOGGING] [REQ-STRUCTURED_LOGGING] How: Keeps legacy log calls on the same configured severity path as context-aware Logger calls.
 * - Contract:
 *   - INPUT: legacy context and message arguments, configured severity threshold
 *   - PRE: legacy adapter and configured logger are available
 *   - OUTPUT: emitted or suppressed legacy log line
 *   - POST:
 *     - success => legacy calls use the configured logger threshold
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: LOGGER_CONFIG_COMPOSITION
 *   - Receive legacy log call
 *   - AWAIT configured logger severity decision
 *   - IF allowed: emit formatted legacy line
 *   - ELSE: suppress line
 *
 * === END IMPL-FULL-BLOCK: IMPL-LOGGER_LEGACY ===
 */
import { Logger, createLogger, log, noisy, logger } from '../../src/shared/logger.js'

describe('[IMPL-LOG_LEVEL_CONFIG] getLogLevel', () => {
  const originalEnv = process.env.NODE_ENV

  afterEach(() => {
    process.env.NODE_ENV = originalEnv
  })

  test('returns warn when NODE_ENV is production [IMPL-LOG_LEVEL_CONFIG]', () => {
    process.env.NODE_ENV = 'production'
    const l = new Logger('test')
    expect(l.getLogLevel()).toBe('warn')
  })

  test('returns debug when NODE_ENV is not production [IMPL-LOG_LEVEL_CONFIG]', () => {
    process.env.NODE_ENV = 'development'
    const l = new Logger('test')
    expect(l.getLogLevel()).toBe('debug')
  })
})

describe('[IMPL-LOGGER_CONTEXT_LEVELS] Logger shouldLog / formatMessage / createLogger', () => {
  const originalEnv = process.env.NODE_ENV

  afterEach(() => {
    process.env.NODE_ENV = originalEnv
  })

  test('shouldLog gates by severity vs getLogLevel [IMPL-LOGGER_CONTEXT_LEVELS]', () => {
    process.env.NODE_ENV = 'production'
    const l = new Logger('ctx')
    expect(l.shouldLog('debug')).toBe(false)
    expect(l.shouldLog('info')).toBe(false)
    expect(l.shouldLog('warn')).toBe(true)
    expect(l.shouldLog('error')).toBe(true)
  })

  test('formatMessage prefixes context and level [IMPL-LOGGER_CONTEXT_LEVELS]', () => {
    const l = new Logger('MyCtx')
    const parts = l.formatMessage('info', 'hello', 1)
    expect(parts[0]).toContain('[MyCtx]')
    expect(parts[0]).toContain('[INFO]')
    expect(parts[1]).toBe('hello')
    expect(parts[2]).toBe(1)
  })

  test('createLogger sets context; default logger exists [IMPL-LOGGER_CONTEXT_LEVELS]', () => {
    const l = createLogger('SidePanel')
    expect(l.context).toBe('SidePanel')
    expect(logger).toBeInstanceOf(Logger)
  })

  test('debug emits only when shouldLog [IMPL-LOGGER_CONTEXT_LEVELS]', () => {
    process.env.NODE_ENV = 'production'
    const l = new Logger('quiet')
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {})
    l.debug('skip-me')
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})

describe('[IMPL-LOGGER_LEGACY] log and noisy', () => {
  test('log delegates to debug with context prefix [IMPL-LOGGER_LEGACY]', () => {
    process.env.NODE_ENV = 'development'
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {})
    log('LegacyCtx', 'msg')
    expect(spy).toHaveBeenCalled()
    const joined = spy.mock.calls[0].map(String).join(' ')
    expect(joined).toContain('LegacyCtx')
    spy.mockRestore()
  })

  test('noisy is false (level filtering replaces noisy emit) [IMPL-LOGGER_LEGACY]', () => {
    expect(noisy).toBe(false)
  })
})
