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
const DEV_MSG = 'devCommand'
const N = 20

async function sendDevCommand (data) {
  const r = await chrome.runtime.sendMessage({ type: DEV_MSG, data })
  if (r && r.success === false && r.error) throw new Error(r.error)
  return r
}

async function getActiveTab () {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  return tab || null
}

function render (id, text, isError = false) {
  const el = document.getElementById(id)
  if (!el) return
  el.textContent = text
  el.className = isError ? 'error' : ''
}

async function refresh () {
  render('actions', 'Loading…')
  render('messages', 'Loading…')
  render('current-state', 'Loading…')
  const tab = await getActiveTab()
  const tabUrl = tab?.url
  const tabId = tab?.id

  try {
    const [actionsRes, messagesRes] = await Promise.all([
      sendDevCommand({ subcommand: 'getLastActions', n: N }),
      sendDevCommand({ subcommand: 'getLastMessages', n: N })
    ])
    const actions = (actionsRes?.data ?? actionsRes) ?? []
    const messages = (messagesRes?.data ?? messagesRes) ?? []
    render('actions', JSON.stringify(actions, null, 2))
    render('messages', JSON.stringify(messages, null, 2))
  } catch (e) {
    render('actions', e.message || String(e), true)
    render('messages', e.message || String(e), true)
  }

  if (!tabUrl) {
    render('current-state', 'No active tab or URL.')
    return
  }
  try {
    const [bookmarkRes, tagsRes, backendRes, snapshotRes] = await Promise.all([
      sendDevCommand({ subcommand: 'getCurrentBookmark', url: tabUrl, tabId }),
      sendDevCommand({ subcommand: 'getTagsForUrl', url: tabUrl }),
      sendDevCommand({ subcommand: 'getStorageBackendForUrl', url: tabUrl }),
      sendDevCommand({ subcommand: 'getStorageSnapshot' }).catch(() => null)
    ])
    const state = {
      url: tabUrl,
      bookmark: bookmarkRes?.data ?? bookmarkRes,
      tagsForUrl: tagsRes?.data ?? tagsRes,
      storageBackend: backendRes?.data ?? backendRes,
      storageSnapshotKeys: snapshotRes?.data ? { local: snapshotRes.data.local?.length, sync: snapshotRes.data.sync?.length } : null
    }
    render('current-state', JSON.stringify(state, null, 2))
  } catch (e) {
    render('current-state', (e.message || String(e)), true)
  }
}

document.getElementById('refresh').addEventListener('click', refresh)
refresh()
