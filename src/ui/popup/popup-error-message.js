/**
 * [IMPL-POPUP_BUNDLE] [ARCH-UI_TESTABILITY] [REQ-MODULE_VALIDATION] Pure helper: classify popup error and return user-facing message.
 * Extracted from popup.js handleError so logic is unit-testable without loading the full popup.
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
