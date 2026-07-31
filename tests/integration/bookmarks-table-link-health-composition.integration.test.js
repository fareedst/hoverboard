/**
 * [REQ-LINK_HEALTH] [ARCH-LINK_HEALTH] [IMPL-LINK_HEALTH]
 * Composition: runCheckLinkHealth → CHECK_LINK_HEALTH → onResults / status text.
 * No Playwright / no bookmarks-table.js init().
 */

import {
  runCheckLinkHealth,
  MESSAGE_TYPE_CHECK_LINK_HEALTH,
  formatHealthCellLabel
} from '../../src/ui/bookmarks-table/bookmarks-table-link-health.js'
import { filterBookmarksByHealth } from '../../src/shared/link-health.js'

describe('[REQ-LINK_HEALTH] runCheckLinkHealth composition', () => {
  /** @type {HTMLElement} */
  let resultEl

  beforeEach(() => {
    document.body.innerHTML = '<span id="link-health-result" aria-live="polite"></span>'
    resultEl = document.getElementById('link-health-result')
  })

  test('empty urls shows No URLs to check and does not sendMessage', async () => {
    const sendMessage = jest.fn()
    const onResults = jest.fn()
    const result = await runCheckLinkHealth({
      urls: [],
      sendMessage,
      resultEl,
      onResults
    })
    expect(result.success).toBe(false)
    expect(sendMessage).not.toHaveBeenCalled()
    expect(onResults).not.toHaveBeenCalled()
    expect(resultEl.textContent).toBe('No URLs to check')
  })

  test('success sends CHECK_LINK_HEALTH and merges via onResults', async () => {
    const url = 'https://example.com/a'
    const sendMessage = jest.fn().mockResolvedValue({
      success: true,
      checked: 1,
      results: { [url]: { status: 'ok', httpStatus: 200 } }
    })
    const onResults = jest.fn()
    const result = await runCheckLinkHealth({
      urls: [url],
      sendMessage,
      resultEl,
      onResults
    })
    expect(result).toEqual({ success: true, checked: 1 })
    expect(sendMessage).toHaveBeenCalledWith({
      type: MESSAGE_TYPE_CHECK_LINK_HEALTH,
      data: { urls: [url] }
    })
    expect(onResults).toHaveBeenCalledWith({ [url]: { status: 'ok', httpStatus: 200 } })
    expect(resultEl.textContent).toBe('Checked 1')
  })

  test('failure path surfaces error text', async () => {
    const sendMessage = jest.fn().mockResolvedValue({ success: false, error: 'fetch blocked' })
    const result = await runCheckLinkHealth({
      urls: ['https://example.com/'],
      sendMessage,
      resultEl
    })
    expect(result.success).toBe(false)
    expect(resultEl.textContent).toBe('fetch blocked')
  })

  test('enabled false does not sendMessage', async () => {
    const sendMessage = jest.fn()
    const result = await runCheckLinkHealth({
      urls: ['https://example.com/'],
      sendMessage,
      resultEl,
      enabled: false
    })
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/disabled/i)
    expect(sendMessage).not.toHaveBeenCalled()
    expect(resultEl.textContent).toBe('Link health checks disabled')
  })

  test('formatHealthCellLabel and filterBookmarksByHealth for Index column/filter', () => {
    expect(formatHealthCellLabel(null)).toBe('—')
    expect(formatHealthCellLabel({ status: 'ok', httpStatus: 200 })).toBe('ok (200)')
    const bookmarks = [
      { url: 'https://a.test/' },
      { url: 'https://b.test/' }
    ]
    const map = {
      'https://a.test/': { status: 'ok' },
      'https://b.test/': { status: 'client_error' }
    }
    expect(filterBookmarksByHealth(bookmarks, map, 'ok').map((b) => b.url)).toEqual(['https://a.test/'])
  })
})
