/**
 * === IMPL-FULL-BLOCK: IMPL-LOG_LEVEL_CONFIG ===
 * Unit tests for getLogLevel / Logger / legacy log — see src/shared/logger.js full blocks.
 * === END IMPL-FULL-BLOCK: IMPL-LOG_LEVEL_CONFIG ===
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
