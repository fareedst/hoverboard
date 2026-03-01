/**
 * [IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING] [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS]
 * Service worker handleMessage routing: NATIVE_PING, SWITCH_STORAGE_MODE, DEV_COMMAND, GET_TAB_REFERRERS
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
  test('[REQ-SIDE_PANEL_BROWSER_TABS] MESSAGE_TYPES includes GET_TAB_REFERRERS for referrer-via-SW', () => {
    expect(MESSAGE_TYPES.GET_TAB_REFERRERS).toBe('getTabReferrers')
  })

  test('[REQ-SIDE_PANEL_BROWSER_TABS] MESSAGE_TYPES includes GET_TABS_PAGE_TEXT and GET_TABS_IMPORTANT_TAGS for search scope', () => {
    expect(MESSAGE_TYPES.GET_TABS_PAGE_TEXT).toBe('getTabsPageText')
    expect(MESSAGE_TYPES.GET_TABS_IMPORTANT_TAGS).toBe('getTabsImportantTags')
  })

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

  // [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS]
  // Referrer fix: GET_TAB_REFERRERS is handled in SW (executeScript in tab context); does not call processMessage.
  test('GET_TAB_REFERRERS returns success and referrer map and does not call processMessage', async () => {
    const sw = new HoverboardServiceWorker()
    const processMessageSpy = jest.spyOn(sw.messageHandler, 'processMessage')
    global.chrome.scripting.executeScript.mockResolvedValue([{ result: 'https://referrer.example.com/' }])

    const result = await sw.handleMessage({
      type: MESSAGE_TYPES.GET_TAB_REFERRERS,
      data: { tabs: [{ id: 1, url: 'https://example.com' }] }
    }, {})

    expect(processMessageSpy).not.toHaveBeenCalled()
    expect(result).toEqual({ success: true, data: { 1: 'https://referrer.example.com/' } })
    processMessageSpy.mockRestore()
  })

  test('GET_TAB_REFERRERS with non-http URL sets empty referrer for that tab', async () => {
    const sw = new HoverboardServiceWorker()
    global.chrome.scripting.executeScript.mockResolvedValue([{ result: '' }])

    const result = await sw.handleMessage({
      type: MESSAGE_TYPES.GET_TAB_REFERRERS,
      data: { tabs: [{ id: 2, url: 'chrome://extensions' }, { id: 3, url: 'https://a.com' }] }
    }, {})

    expect(result.success).toBe(true)
    expect(result.data[2]).toBe('')
    expect(result.data[3]).toBeDefined()
  })

  test('[REQ-SIDE_PANEL_BROWSER_TABS] GET_TABS_PAGE_TEXT returns success and pageText map and does not call processMessage', async () => {
    const sw = new HoverboardServiceWorker()
    const processMessageSpy = jest.spyOn(sw.messageHandler, 'processMessage')
    global.chrome.scripting.executeScript.mockResolvedValue([{ result: 'Title and body text here' }])

    const result = await sw.handleMessage({
      type: MESSAGE_TYPES.GET_TABS_PAGE_TEXT,
      data: { tabs: [{ id: 1, url: 'https://example.com' }] }
    }, {})

    expect(processMessageSpy).not.toHaveBeenCalled()
    expect(result).toEqual({ success: true, data: { 1: 'Title and body text here' } })
    processMessageSpy.mockRestore()
  })

  test('[REQ-SIDE_PANEL_BROWSER_TABS] GET_TABS_IMPORTANT_TAGS returns success and importantTags map and does not call processMessage', async () => {
    const sw = new HoverboardServiceWorker()
    const processMessageSpy = jest.spyOn(sw.messageHandler, 'processMessage')
    global.chrome.scripting.executeScript.mockResolvedValue([{ result: 'H1 Heading Meta description' }])

    const result = await sw.handleMessage({
      type: MESSAGE_TYPES.GET_TABS_IMPORTANT_TAGS,
      data: { tabs: [{ id: 2, url: 'https://test.com' }] }
    }, {})

    expect(processMessageSpy).not.toHaveBeenCalled()
    expect(result).toEqual({ success: true, data: { 2: 'H1 Heading Meta description' } })
    processMessageSpy.mockRestore()
  })
})
