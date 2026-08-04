/**
 * === IMPL-FULL-BLOCK: IMPL-DEBUG_PANEL ===
 * [IMPL-DEBUG_PANEL] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION] — Debug logging by category and debug panel showing last actions, messages, and current bookmark/backend. Contract: inputs, outputs, and data for logging and panel.
 *
 * ## MAIN
 *
 * - [IMPL-DEBUG_PANEL] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION] How: Logical block for IMPL-DEBUG_PANEL.
 * - Contract:
 *   - INPUT: LOG_CATEGORIES (ui, message, overlay, storage); optional debug panel open
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: debugLogger.trace/debug in message-handler, PopupController, content-main; debug panel shows last actions, last messages, current bookmark/tags/backend
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: debug-logger.js; debug.html + debug.js; inspector ring buffers
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: MAIN
 *   - How (sub-block): Logging: emit trace/debug when category enabled.
 *   - 1. Logging: WHEN category enabled: debugLogger.trace(msg) or debugLogger.debug(msg) with category
 *   - How (sub-block): Debug panel: on load request last actions/messages/current bookmark and render.
 *   - 2. Debug panel (debug.html): ON load SEND DEV_COMMAND getLastActions/getLastMessages/getCurrentBookmark (or getStorageSnapshot); RENDER in panel
 *
 * ## MESSAGE_DISPATCH_TESTABILITY
 *
 * - [IMPL-DEBUG_PANEL] [IMPL-MESSAGE_HANDLING] [IMPL-UI_TESTABILITY_HOOKS] [ARCH-UI_TESTABILITY] [ARCH-MESSAGE_HANDLING] [REQ-UI_INSPECTION] [REQ-MODULE_VALIDATION] How: Consumes the message-processing callback seam to expose diagnostics without requiring the debug panel UI.
 * - Contract:
 *   - INPUT: processed message/result and debug inspector callback
 *   - PRE: debug inspector callback is registered
 *   - OUTPUT: observable diagnostic action containing message/result
 *   - POST:
 *     - success => diagnostic callback receives the processed message and result
 *   - EFFECTS: State
 *   - TERMINATION: total
 * - PROCEDURE: MESSAGE_DISPATCH_TESTABILITY
 *   - REGISTER inspector callback
 *   - AWAIT message processing
 *   - CALL inspector callback with message and result
 *   - RETURN diagnostic observation
 *
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
