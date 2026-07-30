/**
 * === IMPL-FULL-BLOCK: IMPL-POPUP_BUNDLE ===
 * [IMPL-POPUP_BUNDLE] [ARCH-EXTENSION_BUNDLED_ENTRY_POINTS] [REQ-EXTENSION_BUNDLED_ENTRY_POINTS] — Bundle popup entry and dependencies so no bare specifiers at runtime. Contract: source and deps in; single bundle out; build config and skip list.
 * 
 * ## MAIN
 * 
 * - [IMPL-POPUP_BUNDLE] [ARCH-EXTENSION_BUNDLED_ENTRY_POINTS] [REQ-EXTENSION_BUNDLED_ENTRY_POINTS] How: Logical block for IMPL-POPUP_BUNDLE.
 * - Contract:
 *   - INPUT: source src/ui/popup/popup.js and its dependency graph
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: single bundle dist/src/ui/popup/popup.js with all deps inlined; no bare specifiers at runtime
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: build config (e.g. rollup/vite); copyDir skip list for popup.js
 *   - EFFECTS: Http
 *   - TERMINATION: total
 * - PROCEDURE: MAIN
 *   - How (sub-block): Bundle entry and all imports into single file.
 *   - 1. build:popup:
 *   - 2.   ENTRY = src/ui/popup/popup.js
 *   - 3.   BUNDLE ENTRY and all imports into dist/src/ui/popup/popup.js
 *   - 4.   INLINE fast-xml-parser, TagService, PinboardService, etc.
 *   - How (sub-block): Skip popup.js in copy so only bundle is in dist.
 *   - 5. copyDir (scripts/build.js):
 *   - 6.   SKIP src/ui/popup/popup.js so only the bundle is in dist
 * 
 * === END IMPL-FULL-BLOCK: IMPL-POPUP_BUNDLE ===
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
