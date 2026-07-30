/**
 * [REQ-LOCAL_QUERY_API] [ARCH-LOCAL_QUERY_API] [IMPL-LOCAL_QUERY_API]
 * Composition: real _refreshApiSnapshot → sendNativeMessage writeBookmarksFile path/payload.
 * No Playwright.
 */

jest.mock('../../src/shared/safari-shim.js', () => ({
  browser: typeof globalThis.chrome !== 'undefined' ? globalThis.chrome : {},
  platformUtils: {}
}))

import { HoverboardServiceWorker } from '../../src/core/service-worker.js'

describe('[REQ-LOCAL_QUERY_API] [IMPL-LOCAL_QUERY_API] _refreshApiSnapshot native write', () => {
  let sw

  beforeEach(() => {
    jest.clearAllMocks()
    sw = new HoverboardServiceWorker()
    sw.messageHandler = {
      handleGetAggregatedBookmarksForIndex: jest.fn().mockResolvedValue({
        bookmarks: [
          { url: 'https://a.test/', description: 'A', storage: 'local' },
          { url: 'https://b.test/', description: 'B', storage: 'file' }
        ]
      })
    }
  })

  test('happy path writes aggregate-snapshot via sendNativeMessage', async () => {
    const captured = []
    global.chrome.runtime.sendNativeMessage = jest.fn((host, msg, cb) => {
      captured.push({ host, msg })
      cb({ success: true })
    })
    global.chrome.runtime.lastError = undefined

    const result = await sw._refreshApiSnapshot()
    expect(result).toEqual({ success: true, count: 2 })
    expect(captured).toHaveLength(1)
    expect(captured[0].host).toBe('com.hoverboard.native_host')
    expect(captured[0].msg.type).toBe('writeBookmarksFile')
    expect(captured[0].msg.path).toBe('~/.hoverboard/aggregate-snapshot.json')
    expect(captured[0].msg.data.version).toBe(1)
    expect(captured[0].msg.data.bookmarks).toHaveLength(2)
    expect(captured[0].msg.data.bookmarks.map((b) => b.url)).toEqual([
      'https://a.test/',
      'https://b.test/'
    ])
  })

  test('missing sendNativeMessage returns Native messaging not available', async () => {
    const prev = global.chrome.runtime.sendNativeMessage
    delete global.chrome.runtime.sendNativeMessage
    const result = await sw._refreshApiSnapshot()
    expect(result).toEqual({ success: false, error: 'Native messaging not available' })
    global.chrome.runtime.sendNativeMessage = prev
  })

  test('chrome.runtime.lastError surfaces as failure', async () => {
    global.chrome.runtime.sendNativeMessage = jest.fn((_host, _msg, cb) => {
      global.chrome.runtime.lastError = { message: 'host disconnected' }
      cb(undefined)
    })
    const result = await sw._refreshApiSnapshot()
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/host disconnected/)
    global.chrome.runtime.lastError = undefined
  })

  test('native error response type fails', async () => {
    global.chrome.runtime.sendNativeMessage = jest.fn((_host, _msg, cb) => {
      global.chrome.runtime.lastError = undefined
      cb({ type: 'error', message: 'write denied' })
    })
    const result = await sw._refreshApiSnapshot()
    expect(result).toEqual({ success: false, error: 'write denied' })
  })
})
