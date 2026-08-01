/**
 * [REQ-NON_WEB_TOOLS_TOOLBAR] [ARCH-NON_WEB_TOOLS_TOOLBAR] [IMPL-NON_WEB_TOOLS_TOOLBAR] [IMPL-ICON_CLICK_BEHAVIOR]
 * Composition: tabs.onActivated / onUpdated → handleTabActivated / handleTabUpdated →
 * REQUEST_SIDE_PANEL_CLOSE + action.setPopup (tools toolbar). No Playwright / no toolbar click gesture.
 */

import { jest, describe, test, expect, beforeEach } from '@jest/globals'

jest.mock('../../src/shared/safari-shim.js', () => ({
  browser: typeof globalThis.chrome !== 'undefined' ? globalThis.chrome : {},
  platformUtils: {}
}))

import { HoverboardServiceWorker } from '../../src/core/service-worker.js'
import { MESSAGE_TYPES } from '../../src/core/message-handler.js'

describe('[REQ-NON_WEB_TOOLS_TOOLBAR] SW tab activate/update → dismiss + setPopup composition', () => {
  /** @type {((info: { tabId: number }) => void) | null} */
  let onActivated = null
  /** @type {((tabId: number, changeInfo: object, tab: object) => void) | null} */
  let onUpdated = null
  /** @type {HoverboardServiceWorker} */
  let sw

  beforeEach(() => {
    jest.clearAllMocks()
    onActivated = null
    onUpdated = null
    global.chrome.tabs.onActivated = {
      addListener: jest.fn((fn) => { onActivated = fn })
    }
    global.chrome.tabs.onUpdated = {
      addListener: jest.fn((fn) => { onUpdated = fn })
    }
    global.chrome.tabs.get = jest.fn()
    // Constructor seeds side-panel window cache via tabs.query().then(...)
    global.chrome.tabs.query = jest.fn().mockResolvedValue([])
    global.chrome.windows.get = jest.fn().mockResolvedValue({ id: 1, type: 'normal' })
    global.chrome.runtime.sendMessage = jest.fn().mockResolvedValue(undefined)
    global.chrome.action.setPopup = jest.fn()
    global.chrome.runtime.getURL = jest.fn((p) => `chrome-extension://test-id/${p}`)
    global.browser = global.chrome

    sw = new HoverboardServiceWorker()
    sw._iconClickOpensSidePanel = true
    sw.updateBadgeForTab = jest.fn().mockResolvedValue(undefined)
    sw._recordBookmarkVisitIfNeeded = jest.fn().mockResolvedValue(undefined)
  })

  test('setupEventListeners binds onActivated/onUpdated to SW handlers', async () => {
    expect(global.chrome.tabs.onActivated.addListener).toHaveBeenCalled()
    expect(global.chrome.tabs.onUpdated.addListener).toHaveBeenCalled()
    expect(typeof onActivated).toBe('function')
    expect(typeof onUpdated).toBe('function')

    const activatedSpy = jest.spyOn(sw, 'handleTabActivated').mockResolvedValue(undefined)
    await onActivated({ tabId: 11 })
    expect(activatedSpy).toHaveBeenCalledWith({ tabId: 11 })
    activatedSpy.mockRestore()

    // Full dismiss + setPopup path for activate is covered in unit tests;
    // composition here proves the tabs.onActivated edge reaches the SW handler.
  })

  test('onUpdated complete for active non-web tab dismisses and syncs popup', async () => {
    global.chrome.tabs.query.mockResolvedValue([{ id: 22, url: 'brave://settings' }])
    const tab = { id: 22, url: 'brave://settings', windowId: 1 }

    await onUpdated(22, { status: 'complete' }, tab)

    expect(global.chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: MESSAGE_TYPES.REQUEST_SIDE_PANEL_CLOSE
    })
    expect(global.chrome.action.setPopup).toHaveBeenCalledWith({
      tabId: 22,
      popup: 'src/ui/tools-toolbar/tools-toolbar.html'
    })
  })

  test('onUpdated complete for https active tab does not dismiss for protocol', async () => {
    global.chrome.tabs.query.mockResolvedValue([{ id: 33, url: 'https://example.com' }])
    const tab = { id: 33, url: 'https://example.com', windowId: 1 }

    await onUpdated(33, { status: 'complete' }, tab)

    expect(global.chrome.runtime.sendMessage).not.toHaveBeenCalledWith({
      type: MESSAGE_TYPES.REQUEST_SIDE_PANEL_CLOSE
    })
    expect(global.chrome.action.setPopup).toHaveBeenCalledWith({
      tabId: 33,
      popup: ''
    })
  })
})
