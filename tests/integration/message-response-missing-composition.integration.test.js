/**
 * [IMPL-MESSAGE_HANDLING] [IMPL-UI_INSPECTOR] [IMPL-COMPOSITION_TEST_PATTERNS]
 * [ARCH-MESSAGE_HANDLING] [ARCH-UI_TESTABILITY] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [REQ-COMPOSITION_TEST_RECOGNITION]
 * Pattern: MESSAGE_DISPATCH
 *
 * Composition: missing runtime reply → unwrapMessageResponse(null) → readMessageResponse records
 * messageResponseMissing (no TypeError). Unit helpers covered in message-response module tests when present.
 * No Playwright.
 */

import { readMessageResponse, unwrapMessageResponse } from '../../src/shared/message-response.js'
import { recordAction } from '../../src/shared/ui-inspector.js'

jest.mock('../../src/shared/ui-inspector.js', () => ({
  recordAction: jest.fn()
}))

describe('[IMPL-MESSAGE_HANDLING] missing message response composition', () => {
  beforeEach(() => {
    recordAction.mockClear()
  })

  test('null reply unwraps to null and records messageResponseMissing for type', () => {
    expect(unwrapMessageResponse(null)).toBeNull()
    const payload = readMessageResponse(null, 'GET_BOOKMARK', 'popup')
    expect(payload).toBeNull()
    expect(recordAction).toHaveBeenCalledWith(
      'messageResponseMissing',
      { type: 'GET_BOOKMARK' },
      'popup'
    )
  })

  test('success envelope yields data without recording missing', () => {
    const payload = readMessageResponse({ success: true, data: { tags: ['a'] } }, 'GET_BOOKMARK', 'popup')
    expect(payload).toEqual({ tags: ['a'] })
    expect(recordAction).not.toHaveBeenCalled()
  })
})
