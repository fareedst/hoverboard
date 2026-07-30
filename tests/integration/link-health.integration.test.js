/**
 * [IMPL-LINK_HEALTH] [ARCH-LINK_HEALTH] [REQ-LINK_HEALTH]
 * Composition: SW runtime.onMessage CHECK_LINK_HEALTH / GET_LINK_HEALTH →
 * _checkLinkHealth / _getLinkHealthMap. No Playwright Index UI invocation.
 */

jest.mock('../../src/shared/safari-shim.js', () => ({
  browser: typeof globalThis.chrome !== 'undefined' ? globalThis.chrome : {},
  platformUtils: {}
}))

import { HoverboardServiceWorker } from '../../src/core/service-worker.js'
import { MESSAGE_TYPES } from '../../src/core/message-handler.js'
import { LINK_HEALTH_STORAGE_KEY } from '../../src/shared/link-health.js'

describe('[REQ-LINK_HEALTH] [IMPL-LINK_HEALTH] SW CHECK/GET_LINK_HEALTH wiring', () => {
  let sw
  let storage
  let onMessage

  beforeEach(() => {
    jest.clearAllMocks()
    storage = {}
    global.chrome.storage.local.get.mockImplementation(async (key) => {
      const k = typeof key === 'string' ? key : Object.keys(key || {})[0]
      return { [k]: storage[k] }
    })
    global.chrome.storage.local.set.mockImplementation(async (obj) => {
      Object.assign(storage, obj)
    })
    sw = new HoverboardServiceWorker()
    onMessage = global.chrome.runtime.onMessage.addListener.mock.calls[0][0]
  })

  test('CHECK_LINK_HEALTH message routes to _checkLinkHealth and sendResponse', async () => {
    const checkSpy = jest.spyOn(sw, '_checkLinkHealth').mockResolvedValue({
      success: true,
      checked: 1,
      results: {}
    })
    const sendResponse = jest.fn()

    const ret = onMessage(
      { type: MESSAGE_TYPES.CHECK_LINK_HEALTH, data: { urls: ['https://a.example/'] } },
      {},
      sendResponse
    )
    expect(ret).toBe(true)

    await Promise.resolve()
    await Promise.resolve()

    expect(checkSpy).toHaveBeenCalledWith(['https://a.example/'])
    expect(sendResponse).toHaveBeenCalledWith({ success: true, checked: 1, results: {} })
  })

  test('GET_LINK_HEALTH message routes to _getLinkHealthMap', async () => {
    const map = { 'https://ok.example/': { status: 'ok', checkedAt: 't' } }
    const getSpy = jest.spyOn(sw, '_getLinkHealthMap').mockResolvedValue(map)
    const sendResponse = jest.fn()

    const ret = onMessage({ type: MESSAGE_TYPES.GET_LINK_HEALTH }, {}, sendResponse)
    expect(ret).toBe(true)

    await Promise.resolve()
    await Promise.resolve()

    expect(getSpy).toHaveBeenCalled()
    expect(sendResponse).toHaveBeenCalledWith({ success: true, data: map })
    // Keep storage key import exercised for composition locus stability.
    expect(LINK_HEALTH_STORAGE_KEY).toBe('hoverboard_link_health')
  })

  test('CHECK_LINK_HEALTH failure path sendResponse success false', async () => {
    jest.spyOn(sw, '_checkLinkHealth').mockRejectedValue(new Error('batch failed'))
    const sendResponse = jest.fn()

    onMessage(
      { type: 'CHECK_LINK_HEALTH', data: { urls: ['https://x.example/'] } },
      {},
      sendResponse
    )
    await Promise.resolve()
    await Promise.resolve()

    expect(sendResponse).toHaveBeenCalledWith({ success: false, error: 'batch failed' })
  })
})
