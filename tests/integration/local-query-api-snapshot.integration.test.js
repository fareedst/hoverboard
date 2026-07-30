/**
 * [IMPL-LOCAL_QUERY_API] [ARCH-LOCAL_QUERY_API] [REQ-LOCAL_QUERY_API]
 * Composition: SW runtime.onMessage REFRESH_API_SNAPSHOT → _refreshApiSnapshot.
 * No Playwright Options/Index UI invocation.
 */

jest.mock('../../src/shared/safari-shim.js', () => ({
  browser: typeof globalThis.chrome !== 'undefined' ? globalThis.chrome : {},
  platformUtils: {}
}))

import { HoverboardServiceWorker } from '../../src/core/service-worker.js'
import { MESSAGE_TYPES } from '../../src/core/message-handler.js'

describe('[REQ-LOCAL_QUERY_API] [IMPL-LOCAL_QUERY_API] SW REFRESH_API_SNAPSHOT wiring', () => {
  let sw
  let onMessage

  beforeEach(() => {
    jest.clearAllMocks()
    sw = new HoverboardServiceWorker()
    onMessage = global.chrome.runtime.onMessage.addListener.mock.calls[0][0]
  })

  test('REFRESH_API_SNAPSHOT message routes to _refreshApiSnapshot', async () => {
    const refreshSpy = jest.spyOn(sw, '_refreshApiSnapshot').mockResolvedValue({
      success: true,
      count: 2
    })
    const sendResponse = jest.fn()

    const ret = onMessage({ type: MESSAGE_TYPES.REFRESH_API_SNAPSHOT }, {}, sendResponse)
    expect(ret).toBe(true)

    await Promise.resolve()
    await Promise.resolve()

    expect(refreshSpy).toHaveBeenCalled()
    expect(sendResponse).toHaveBeenCalledWith({ success: true, count: 2 })
  })

  test('REFRESH_API_SNAPSHOT string type alias also routes', async () => {
    const refreshSpy = jest.spyOn(sw, '_refreshApiSnapshot').mockResolvedValue({
      success: true,
      count: 0
    })
    const sendResponse = jest.fn()

    onMessage({ type: 'REFRESH_API_SNAPSHOT' }, {}, sendResponse)
    await Promise.resolve()
    await Promise.resolve()

    expect(refreshSpy).toHaveBeenCalled()
    expect(sendResponse).toHaveBeenCalledWith({ success: true, count: 0 })
  })

  test('REFRESH_API_SNAPSHOT failure path sendResponse success false', async () => {
    jest.spyOn(sw, '_refreshApiSnapshot').mockRejectedValue(new Error('native down'))
    const sendResponse = jest.fn()

    onMessage({ type: MESSAGE_TYPES.REFRESH_API_SNAPSHOT }, {}, sendResponse)
    await Promise.resolve()
    await Promise.resolve()

    expect(sendResponse).toHaveBeenCalledWith({ success: false, error: 'native down' })
  })

  test('_refreshApiSnapshot without router returns Bookmark router not ready', async () => {
    sw.messageHandler = {}
    const result = await sw._refreshApiSnapshot()
    expect(result).toEqual({ success: false, error: 'Bookmark router not ready' })
  })
})
