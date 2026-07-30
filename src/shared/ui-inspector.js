/**
 * === IMPL-FULL-BLOCK: IMPL-UI_INSPECTOR ===
 * [IMPL-UI_INSPECTOR] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION] — recordMessage/recordAction ring buffers; getLastMessages/getLastActions; debug-gated. Contract: message or action in; ring buffers and getters; enabled flag.
 *
 * ## MAIN
 *
 * - [IMPL-UI_INSPECTOR] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION] How: Logical block for IMPL-UI_INSPECTOR.
 * - Contract:
 *   - INPUT: message (recordMessage); action (recordAction); gated by DEBUG_HOVERBOARD_UI or setEnabled(true)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: ring buffers of last N messages and last N actions; getLastMessages(), getLastActions()
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: message ring buffer; action ring buffer; enabled flag
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: MAIN
 *   - How (sub-block): Append to buffer when enabled; drop oldest if full.
 *   - 1. recordMessage(msg): IF enabled: APPEND to message buffer; DROP oldest if full
 *   - 2. recordAction(action): IF enabled: APPEND to action buffer; DROP oldest if full
 *   - How (sub-block): Return copy of buffers.
 *   - 3. getLastMessages(), getLastActions(): RETURN copy of buffer(s)
 *   - How (sub-block): Service-worker records message; PopupController/content record action.
 *   - 4. Wiring: service-worker after handle message -> recordMessage; PopupController/content-main on action -> recordAction
 *
 * ## RECORD_INJECTION_OUTCOME
 *
 * - [IMPL-UI_INSPECTOR] [IMPL-POPUP_SESSION] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION] [REQ-SUGGESTED_TAGS_FROM_CONTENT] How: Observable contract for script-injection skips and results — PopupController/side-panel recordAction({ actionId: "injectionOutcome", surface, payload: { phase, trigger, tabId, urlHost, reason, injectable, errorMessage? } }). testable when setEnabled(true); used by tabChangeRefresh composition and unit inject precheck tests.
 * - Contract:
 *   - INPUT: phase, reason, injectable, optional trigger/surface/tabId/urlHost/errorMessage
 *   - PRE: recordAction available (no-op when inspector disabled)
 *   - OUTPUT: action appended when enabled
 *   - POST:
 *     - success => last actions include injectionOutcome with closed-set reason codes
 *   - FAILURE_MODES: none
 *   - DATA: action ring buffer
 *   - DATA_TRANSITION: buffer grows (or rotates) when enabled; else unchanged
 *   - EFFECTS: State
 *   - TERMINATION: total
 * - PROCEDURE: RECORD_INJECTION_OUTCOME
 *   - recordAction({ actionId: "injectionOutcome", surface, payload })
 *
 * ## RECORD_MESSAGE_RESPONSE_MISSING
 *
 * - [IMPL-UI_INSPECTOR] [IMPL-MESSAGE_HANDLING] [ARCH-UI_TESTABILITY] [ARCH-MESSAGE_HANDLING] [REQ-UI_INSPECTION] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] How: Observable contract when runtime reply is null/undefined — content-main recordAction({ actionId: "messageResponseMissing", surface: "content", payload: { type } }) instead of throwing on response.success.
 * - Contract:
 *   - INPUT: message type string that expected a reply
 *   - PRE: unwrapMessageResponse returned null; inspector may be disabled
 *   - OUTPUT: action appended when enabled; caller keeps defaults
 *   - POST:
 *     - success => messageResponseMissing observable; no TypeError
 *   - FAILURE_MODES: none
 *   - DATA: action ring buffer
 *   - DATA_TRANSITION: buffer grows when enabled
 *   - EFFECTS: State
 *   - TERMINATION: total
 * - PROCEDURE: RECORD_MESSAGE_RESPONSE_MISSING
 *   - recordAction({ actionId: "messageResponseMissing", surface: "content", payload: { type } })
 *
 * === END IMPL-FULL-BLOCK: IMPL-UI_INSPECTOR ===
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
