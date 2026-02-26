/**
 * [IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING]
 * Service worker handleMessage routing: NATIVE_PING, SWITCH_STORAGE_MODE, DEV_COMMAND
 * are handled inside handleMessage and do not call messageHandler.processMessage.
 * Other types go through processMessage and response is wrapped as { success, data } or { success: false, error }.
 */

import { HoverboardServiceWorker } from '../../src/core/service-worker.js'
import { MESSAGE_TYPES } from '../../src/core/message-handler.js'

beforeEach(() => {
  global.chrome.storage.local.get.mockImplementation((keys, cb) => {
    const key = Array.isArray(keys) ? keys[0] : keys
    const result = key ? { [key]: null } : {}
    if (cb) cb(result)
    return Promise.resolve(result)
  })
  global.chrome.storage.sync.get.mockResolvedValue({})
  global.chrome.tabs.query.mockResolvedValue([])
  global.chrome.tabs.get.mockResolvedValue({ id: 1, url: 'https://example.com' })
})

describe('[IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING] SW handleMessage routing', () => {
  test('NATIVE_PING returns success and data and does not call processMessage', async () => {
    const sw = new HoverboardServiceWorker()
    sw.pingNativeHost = jest.fn().mockResolvedValue({ pong: true })
    const processMessageSpy = jest.spyOn(sw.messageHandler, 'processMessage')

    const result = await sw.handleMessage({ type: 'NATIVE_PING' }, {})

    expect(result).toEqual({ success: true, data: { pong: true } })
    expect(processMessageSpy).not.toHaveBeenCalled()
    processMessageSpy.mockRestore()
  })

  test('SWITCH_STORAGE_MODE returns switched and does not call processMessage', async () => {
    const sw = new HoverboardServiceWorker()
    sw._providerInitialized = true
    sw.initBookmarkProvider = jest.fn().mockResolvedValue(undefined)
    const processMessageSpy = jest.spyOn(sw.messageHandler, 'processMessage')

    const result = await sw.handleMessage({ type: MESSAGE_TYPES.SWITCH_STORAGE_MODE }, {})

    expect(result).toEqual({ success: true, data: { switched: true } })
    expect(processMessageSpy).not.toHaveBeenCalled()
    processMessageSpy.mockRestore()
  })

  test('DEV_COMMAND when debug not enabled returns error and does not call processMessage', async () => {
    const sw = new HoverboardServiceWorker()
    global.chrome.storage.local.get.mockImplementation((keys, cb) => {
      const result = { DEBUG_HOVERBOARD_UI: false }
      if (cb) cb(result)
      return Promise.resolve(result)
    })
    sw._providerInitialized = true
    const processMessageSpy = jest.spyOn(sw.messageHandler, 'processMessage')

    const result = await sw.handleMessage({ type: MESSAGE_TYPES.DEV_COMMAND, data: { subcommand: 'getStorageSnapshot' } }, {})

    expect(result).toMatchObject({ success: false, error: 'debug not enabled' })
    expect(processMessageSpy).not.toHaveBeenCalled()
    processMessageSpy.mockRestore()
  })

  test('GET_OPTIONS calls processMessage and wraps response as success and data', async () => {
    const sw = new HoverboardServiceWorker()
    sw._providerInitialized = true
    sw.messageHandler.processMessage = jest.fn().mockResolvedValue({ someOption: true })

    const result = await sw.handleMessage({ type: MESSAGE_TYPES.GET_OPTIONS }, {})

    expect(sw.messageHandler.processMessage).toHaveBeenCalledWith({ type: 'getOptions' }, {})
    expect(result).toEqual({ success: true, data: { someOption: true } })
  })

  test('when processMessage throws handleMessage returns success false and error', async () => {
    const sw = new HoverboardServiceWorker()
    sw._providerInitialized = true
    sw.messageHandler.processMessage = jest.fn().mockRejectedValue(new Error('handler failed'))

    const result = await sw.handleMessage({ type: MESSAGE_TYPES.GET_OPTIONS }, {})

    expect(result).toEqual({ success: false, error: 'handler failed' })
  })
})
