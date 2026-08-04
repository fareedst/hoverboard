/**
 * [IMPL-LOGGER_CONTEXT_LEVELS] [IMPL-LOG_LEVEL_CONFIG] [IMPL-LOGGER_LEGACY] [ARCH-STRUCTURED_LOGGING] [REQ-STRUCTURED_LOGGING] How: Connects environment-derived log level configuration to context and legacy logger calls with consistent severity filtering.
 * Contract:
 *   INPUT: environment, logger context, severity, message arguments
 *   PRE: log-level configuration and logger adapters are available
 *   OUTPUT: emitted or suppressed formatted log line
 *   POST:
 *     success => production suppresses debug below warn while development emits the legacy path
 *   EFFECTS: IO
 *   TERMINATION: total
 * PROCEDURE: LOGGER_CONFIG_COMPOSITION
 *   level = GET_LOG_LEVEL()
 *   IF requested severity is below level: suppress output
 *   ELSE: format context and arguments
 *   Route legacy log calls through the configured logger
 *   Emit the resulting line
 *
 * Pattern: UNKNOWN binding resolved as shared logger/config composition.
 * Composition: environment -> Logger level configuration -> context logger
 * and legacy log adapter. No UI invocation.
 */

import { Logger, createLogger, log } from '../../src/shared/logger.js'

describe('[IMPL-LOGGER_CONTEXT_LEVELS] logger/config composition', () => {
  const originalEnv = process.env.NODE_ENV

  afterEach(() => {
    process.env.NODE_ENV = originalEnv
  })

  test('production configuration controls context logger severity', () => {
    process.env.NODE_ENV = 'production'
    const logger = createLogger('composition')
    const debug = jest.spyOn(console, 'log').mockImplementation(() => {})
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})

    logger.debug('hidden')
    logger.warn('visible')

    expect(logger).toBeInstanceOf(Logger)
    expect(debug).not.toHaveBeenCalled()
    expect(warn).toHaveBeenCalled()
    debug.mockRestore()
    warn.mockRestore()
  })

  test('legacy log reaches the same configured logger path', () => {
    process.env.NODE_ENV = 'development'
    const output = jest.spyOn(console, 'log').mockImplementation(() => {})

    log('legacy-composition', 'message')

    expect(output).toHaveBeenCalled()
    expect(output.mock.calls.flat().map(String).join(' ')).toContain('legacy-composition')
    output.mockRestore()
  })
})
