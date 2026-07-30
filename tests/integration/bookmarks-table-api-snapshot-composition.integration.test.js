/**
 * [REQ-LOCAL_QUERY_API] [ARCH-LOCAL_QUERY_API] [IMPL-LOCAL_QUERY_API]
 * Composition: runRefreshApiSnapshot → REFRESH_API_SNAPSHOT → status text.
 * No Playwright / no bookmarks-table.js init().
 */

import {
  runRefreshApiSnapshot,
  MESSAGE_TYPE_REFRESH_API_SNAPSHOT
} from '../../src/ui/bookmarks-table/bookmarks-table-api-snapshot.js'

describe('[REQ-LOCAL_QUERY_API] runRefreshApiSnapshot composition', () => {
  /** @type {HTMLElement} */
  let resultEl

  beforeEach(() => {
    document.body.innerHTML = '<span id="api-snapshot-result" aria-live="polite"></span>'
    resultEl = document.getElementById('api-snapshot-result')
  })

  test('success shows Snapshot updated with count', async () => {
    const sendMessage = jest.fn().mockResolvedValue({ success: true, count: 3 })
    const result = await runRefreshApiSnapshot({ sendMessage, resultEl })
    expect(result).toEqual({ success: true, count: 3 })
    expect(sendMessage).toHaveBeenCalledWith({ type: MESSAGE_TYPE_REFRESH_API_SNAPSHOT })
    expect(resultEl.textContent).toBe('Snapshot updated (3 bookmarks)')
  })

  test('failure path shows error', async () => {
    const sendMessage = jest.fn().mockResolvedValue({ success: false, error: 'Native messaging not available' })
    const result = await runRefreshApiSnapshot({ sendMessage, resultEl })
    expect(result.success).toBe(false)
    expect(resultEl.textContent).toBe('Native messaging not available')
  })

  test('throw surfaces message', async () => {
    const sendMessage = jest.fn().mockRejectedValue(new Error('channel closed'))
    const result = await runRefreshApiSnapshot({ sendMessage, resultEl })
    expect(result.success).toBe(false)
    expect(resultEl.textContent).toBe('channel closed')
  })
})
