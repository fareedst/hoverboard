/**
 * [IMPL-POPUP_BUNDLE] [ARCH-UI_TESTABILITY] [REQ-MODULE_VALIDATION] Unit tests for popup error message classification.
 * Tests extracted logic from popup.js handleError (getPopupErrorMessage, normalizePopupErrorInput).
 */

import { getPopupErrorMessage, normalizePopupErrorInput } from '../../src/ui/popup/popup-error-message.js'

describe('[IMPL-POPUP_BUNDLE] popup-error-message', () => {
  describe('normalizePopupErrorInput', () => {
    test('returns message when string', () => {
      expect(normalizePopupErrorInput('Something failed')).toBe('Something failed')
    })

    test('returns Error.message when first arg is Error', () => {
      expect(normalizePopupErrorInput(new Error('Auth failed'))).toBe('Auth failed')
    })

    test('returns fallback when object has no message', () => {
      expect(normalizePopupErrorInput({})).toBe('An unexpected error occurred')
    })
  })

  describe('getPopupErrorMessage', () => {
    test('auth phrase returns token config message', () => {
      expect(getPopupErrorMessage('No authentication token configured')).toContain('Pinboard API token')
      expect(getPopupErrorMessage('Authentication failed')).toContain('Pinboard API token')
      expect(getPopupErrorMessage('Invalid API token')).toContain('Pinboard API token')
    })

    test('network/fetch returns network message', () => {
      expect(getPopupErrorMessage('network error')).toContain('Network error')
      expect(getPopupErrorMessage('fetch failed')).toContain('Network error')
    })

    test('permission/denied returns permission message', () => {
      expect(getPopupErrorMessage('permission denied')).toContain('Permission denied')
    })

    test('generic error returns fallback', () => {
      expect(getPopupErrorMessage('Something else')).toBe('An unexpected error occurred. Please try again.')
    })
  })
})
