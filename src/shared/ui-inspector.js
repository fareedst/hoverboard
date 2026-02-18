/**
 * UI Inspector - Optional action and message log for testing and debugging
 * [IMPL-UI_INSPECTOR] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION]
 * Gated by DEBUG_HOVERBOARD_UI (localStorage) or setEnabled(true) in service worker.
 */

const MAX_MESSAGES = 50
const MAX_ACTIONS = 50

/** @type {boolean} */
let _enabledOverride = false

function hasLocalStorage () {
  try {
    return typeof localStorage !== 'undefined'
  } catch {
    return false
  }
}

/**
 * Whether the inspector is enabled. In popup/content: localStorage DEBUG_HOVERBOARD_UI.
 * In service worker: must call setEnabled(true) (e.g. from chrome.storage.local).
 */
export function isEnabled () {
  if (_enabledOverride) return true
  if (hasLocalStorage() && localStorage.getItem('DEBUG_HOVERBOARD_UI')) return true
  return false
}

/**
 * Set enabled state (used by service worker where localStorage is unavailable).
 */
export function setEnabled (value) {
  _enabledOverride = !!value
}

/** @type {Array<{ type: string, dataSanitized: unknown, senderContext: unknown, responseOrError: unknown, ts: number }>} */
const _messages = []

/** @type {Array<{ actionId: string, payload: unknown, surface: string, ts: number }>} */
const _actions = []

function sanitize (data) {
  if (data == null) return data
  if (typeof data !== 'object') return data
  const o = {}
  for (const [k, v] of Object.entries(data)) {
    if (k === 'token' || k === 'apiToken' || k.toLowerCase().includes('password')) {
      o[k] = '[REDACTED]'
    } else {
      o[k] = typeof v === 'object' && v !== null && !Array.isArray(v) ? sanitize(v) : v
    }
  }
  return o
}

/**
 * Record a message (type, payload, sender context, response or error).
 * No-op when inspector is disabled.
 */
export function recordMessage (type, data, senderContext, responseOrError) {
  if (!isEnabled()) return
  _messages.push({
    type,
    dataSanitized: sanitize(data),
    senderContext: senderContext != null ? { tabId: senderContext?.tab?.id, url: senderContext?.tab?.url } : undefined,
    responseOrError: responseOrError != null && typeof responseOrError === 'object' ? sanitize(responseOrError) : responseOrError,
    ts: Date.now()
  })
  if (_messages.length > MAX_MESSAGES) _messages.shift()
}

/**
 * Record a UI action (action ID, optional payload, surface: 'popup' | 'overlay' | 'content').
 * No-op when inspector is disabled.
 */
export function recordAction (actionId, payload, surface) {
  if (!isEnabled()) return
  _actions.push({
    actionId,
    payload: payload != null ? sanitize(typeof payload === 'object' ? payload : { value: payload }) : undefined,
    surface: surface || 'popup',
    ts: Date.now()
  })
  if (_actions.length > MAX_ACTIONS) _actions.shift()
}

/**
 * Get the last n message entries (newest last).
 */
export function getLastMessages (n = 20) {
  if (!isEnabled()) return []
  const len = _messages.length
  if (n >= len) return [..._messages]
  return _messages.slice(len - n)
}

/**
 * Get the last n action entries (newest last).
 */
export function getLastActions (n = 20) {
  if (!isEnabled()) return []
  const len = _actions.length
  if (n >= len) return [..._actions]
  return _actions.slice(len - n)
}

/**
 * Clear message and action rings.
 */
export function clear () {
  _messages.length = 0
  _actions.length = 0
}

export default {
  isEnabled,
  setEnabled,
  recordMessage,
  recordAction,
  getLastMessages,
  getLastActions,
  clear
}
