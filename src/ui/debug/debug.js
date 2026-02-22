/**
 * [IMPL-DEBUG_PANEL] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION] Debug panel: last N actions, last N messages, current tab state.
 * Requires DEBUG_HOVERBOARD_UI set in storage; DEV_COMMAND is rejected otherwise.
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
