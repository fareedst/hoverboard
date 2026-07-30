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
const AUTH_PHRASES = [
  'No authentication token configured',
  'Authentication failed',
  'Invalid API token'
]

/**
 * Normalize (message, errorInfo) to a single error message string.
 * @param {string|Error|object} message - Error message or Error object
 * @param {Error|object|null} [errorInfo] - Optional error details
 * @returns {string} Normalized error message for classification
 */
export function normalizePopupErrorInput (message, errorInfo = null) {
  if (typeof message === 'object' && message !== null) {
    return message.message || 'An unexpected error occurred'
  }
  return typeof message === 'string' ? message : String(message)
}

/**
 * Return user-facing message for popup given raw error message.
 * @param {string} errorMessage - Normalized error message (use normalizePopupErrorInput if needed)
 * @returns {string} User-facing message to show in popup UI
 */
export function getPopupErrorMessage (errorMessage) {
  const msg = errorMessage || ''
  if (AUTH_PHRASES.some(phrase => msg.includes(phrase))) {
    return 'Please configure your Pinboard API token in the extension options.'
  }
  if (msg.includes('network') || msg.includes('fetch')) {
    return 'Network error. Please check your connection and try again.'
  }
  if (msg.includes('permission') || msg.includes('denied')) {
    return 'Permission denied. Please check extension permissions.'
  }
  return 'An unexpected error occurred. Please try again.'
}
