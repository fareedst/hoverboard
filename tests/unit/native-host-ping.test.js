/**
 * [REQ-NATIVE_HOST_WRAPPER] [IMPL-NATIVE_HOST_WRAPPER] Native host ping: NATIVE_PING handling and pingNativeHost.
 * Unit tests for service worker responding to NATIVE_PING and using chrome.runtime.sendNativeMessage.
 */

import { jest } from '@jest/globals'

const mockProcessMessage = jest.fn().mockResolvedValue({})

jest.mock('../../src/core/message-handler.js', () => ({
  MessageHandler: jest.fn().mockImplementation(() => ({
    processMessage: mockProcessMessage,
    bookmarkProvider: null,
    setBookmarkProvider: jest.fn(),
    tagService: {}
  })),
  MESSAGE_TYPES: {}
}))

jest.mock('../../src/config/config-manager.js', () => ({
  ConfigManager: jest.fn().mockImplementation(() => ({
    getConfig: jest.fn().mockResolvedValue({ setIconOnLoad: true }),
    getStorageMode: jest.fn().mockResolvedValue('remote'),
    initializeDefaults: jest.fn().mockResolvedValue(undefined)
  }))
}))

jest.mock('../../src/core/badge-manager.js', () => ({
  BadgeManager: jest.fn().mockImplementation(() => ({}))
}))

jest.mock('../../src/features/pinboard/pinboard-service.js', () => ({
  PinboardService: jest.fn().mockImplementation(() => ({}))
}))

jest.mock('../../src/features/storage/local-bookmark-service.js', () => ({
  LocalBookmarkService: jest.fn().mockImplementation(() => ({}))
}))

jest.mock('../../src/shared/safari-shim.js', () => ({
  browser: {
    tabs: {
      get: jest.fn().mockResolvedValue({}),
      query: jest.fn().mockResolvedValue([]),
      onActivated: { addListener: jest.fn() },
      onUpdated: { addListener: jest.fn() }
    },
    runtime: {
      onInstalled: { addListener: jest.fn() },
      onMessage: { addListener: jest.fn() },
      onStartup: { addListener: jest.fn() }
    }
  }
}))

describe('[REQ-NATIVE_HOST_WRAPPER] [IMPL-NATIVE_HOST_WRAPPER] Native host ping', () => {
  let HoverboardServiceWorker

  beforeAll(async () => {
    const module = await import('../../src/core/service-worker.js')
    HoverboardServiceWorker = module.HoverboardServiceWorker
  })

  beforeEach(() => {
    jest.clearAllMocks()
    mockProcessMessage.mockResolvedValue({})
    global.chrome.runtime.lastError = null
  })

  test('handleMessage NATIVE_PING returns success and pong when sendNativeMessage succeeds', async () => {
    global.chrome.runtime.sendNativeMessage.mockImplementation((host, msg, callback) => {
      expect(host).toBe('com.hoverboard.native_host')
      expect(msg).toEqual({ type: 'ping' })
      callback({ type: 'pong' })
    })

    const sw = new HoverboardServiceWorker()
    const result = await sw.handleMessage({ type: 'NATIVE_PING' }, {})

    expect(result).toEqual({ success: true, data: { type: 'pong' } })
    expect(mockProcessMessage).not.toHaveBeenCalled()
  })

  test('handleMessage NATIVE_PING returns success with error when sendNativeMessage reports lastError', async () => {
    global.chrome.runtime.sendNativeMessage.mockImplementation((host, msg, callback) => {
      global.chrome.runtime.lastError = { message: 'Specified native messaging host not found.' }
      callback(null)
    })

    const sw = new HoverboardServiceWorker()
    const result = await sw.handleMessage({ type: 'NATIVE_PING' }, {})

    expect(result.success).toBe(true)
    expect(result.data).toHaveProperty('error', 'Specified native messaging host not found.')
    expect(mockProcessMessage).not.toHaveBeenCalled()
  })

  test('pingNativeHost returns pong when sendNativeMessage succeeds', async () => {
    global.chrome.runtime.sendNativeMessage.mockImplementation((host, msg, callback) => {
      callback({ type: 'pong' })
    })

    const sw = new HoverboardServiceWorker()
    const data = await sw.pingNativeHost()

    expect(data).toEqual({ type: 'pong' })
    expect(global.chrome.runtime.sendNativeMessage).toHaveBeenCalledWith(
      'com.hoverboard.native_host',
      { type: 'ping' },
      expect.any(Function)
    )
  })

  test('pingNativeHost returns error when sendNativeMessage is undefined', async () => {
    const orig = global.chrome.runtime.sendNativeMessage
    global.chrome.runtime.sendNativeMessage = undefined

    const sw = new HoverboardServiceWorker()
    const data = await sw.pingNativeHost()

    expect(data).toEqual({ error: 'Native messaging not available' })

    global.chrome.runtime.sendNativeMessage = orig
  })

  test('pingNativeHost returns error when callback receives null response', async () => {
    global.chrome.runtime.sendNativeMessage.mockImplementation((host, msg, callback) => {
      callback(null)
    })

    const sw = new HoverboardServiceWorker()
    const data = await sw.pingNativeHost()

    expect(data).toEqual({ error: 'No response' })
  })
})
