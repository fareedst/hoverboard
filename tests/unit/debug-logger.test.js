/**
 * === IMPL-FULL-BLOCK: IMPL-DEBUG_PANEL ===
 * Unit tests for LOG_CATEGORIES and category-filtered debugLogger (panel UI is composition/E2E).
 * === END IMPL-FULL-BLOCK: IMPL-DEBUG_PANEL ===
 */
import { LOG_CATEGORIES, debugLogger } from '../../src/shared/debug-logger.js'

describe('[IMPL-DEBUG_PANEL] LOG_CATEGORIES and category filter', () => {
  beforeEach(() => {
    debugLogger.clearLogs()
    debugLogger.setCategoryFilter([])
    debugLogger.debugEnabled = true
    debugLogger.currentLevel = debugLogger.logLevels.TRACE
  })

  afterEach(() => {
    debugLogger.setCategoryFilter([])
    debugLogger.clearLogs()
  })

  test('exposes ui/message/overlay/storage categories [IMPL-DEBUG_PANEL]', () => {
    expect(LOG_CATEGORIES.UI).toBe('ui')
    expect(LOG_CATEGORIES.MESSAGE).toBe('message')
    expect(LOG_CATEGORIES.OVERLAY).toBe('overlay')
    expect(LOG_CATEGORIES.STORAGE).toBe('storage')
  })

  test('category filter suppresses non-matching categories [IMPL-DEBUG_PANEL]', () => {
    debugLogger.setCategoryFilter([LOG_CATEGORIES.MESSAGE])
    debugLogger.debug('COMP', 'ui-msg', null, LOG_CATEGORIES.UI)
    debugLogger.debug('COMP', 'message-msg', null, LOG_CATEGORIES.MESSAGE)
    const recent = debugLogger.getRecentLogs(50).filter((e) => e.component === 'COMP')
    expect(recent.some((e) => e.message === 'message-msg')).toBe(true)
    expect(recent.some((e) => e.message === 'ui-msg')).toBe(false)
  })

  test('empty category filter allows all categories [IMPL-DEBUG_PANEL]', () => {
    debugLogger.setCategoryFilter([])
    debugLogger.debug('COMP2', 'overlay-msg', null, LOG_CATEGORIES.OVERLAY)
    const recent = debugLogger.getRecentLogs(50).filter((e) => e.component === 'COMP2')
    expect(recent.some((e) => e.message === 'overlay-msg')).toBe(true)
  })
})
