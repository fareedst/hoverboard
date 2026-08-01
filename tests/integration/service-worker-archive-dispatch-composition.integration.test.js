/**
 * [IMPL-PAGE_ARCHIVE_STORAGE] [IMPL-MESSAGE_HANDLING]
 * [ARCH-PAGE_ARCHIVE_STORAGE] [ARCH-MESSAGE_HANDLING]
 * [REQ-PAGE_ARCHIVE_STORAGE]
 * Composition: the real service-worker runtime listener forwards archive messages and replies once.
 */

import { HoverboardServiceWorker } from '../../src/core/service-worker.js'

describe('[REQ-PAGE_ARCHIVE_STORAGE] service-worker archive dispatch composition', () => {
  test('runtime listener forwards GET_PAGE_ARCHIVE to the worker handler', async () => {
    global.chrome.runtime.onMessage.addListener.mockClear()
    const serviceWorker = new HoverboardServiceWorker()
    const response = { success: true, archive: { url: 'https://example.com/archive' } }
    serviceWorker.handleMessage = jest.fn().mockResolvedValue(response)
    const listener = global.chrome.runtime.onMessage.addListener.mock.calls.at(-1)[0]
    const sendResponse = jest.fn()
    const message = {
      type: 'GET_PAGE_ARCHIVE',
      data: { url: 'https://example.com/archive' }
    }
    const sender = { tab: { id: 7 } }

    expect(listener(message, sender, sendResponse)).toBe(true)
    await Promise.resolve()

    expect(serviceWorker.handleMessage).toHaveBeenCalledWith(message, sender)
    expect(sendResponse).toHaveBeenCalledWith(response)
  })
})
