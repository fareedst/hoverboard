/**
 * [REQ-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX]
 * OPEN_BOOKMARKS_INDEX_TAB: create index tab then REQUEST_SIDE_PANEL_CLOSE (index-open dismisses side panel).
 */

jest.mock('../../src/shared/safari-shim.js', () => ({
  browser: typeof globalThis.chrome !== 'undefined' ? globalThis.chrome : {},
  platformUtils: {}
}))

import { readFileSync } from 'fs'
import { join } from 'path'
import { HoverboardServiceWorker } from '../../src/core/service-worker.js'
import { MESSAGE_TYPES } from '../../src/core/message-handler.js'
import { PopupController } from '../../src/ui/popup/PopupController.js'

describe('[REQ-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX] OPEN_BOOKMARKS_INDEX_TAB', () => {
  let sw

  beforeEach(() => {
    jest.clearAllMocks()
    global.chrome.runtime.getURL.mockImplementation((path) => `chrome-extension://test-id/${path}`)
    global.chrome.runtime.sendMessage.mockImplementation(() => Promise.resolve())
    sw = new HoverboardServiceWorker()
  })

  test('MESSAGE_TYPES.OPEN_BOOKMARKS_INDEX is defined', () => {
    expect(MESSAGE_TYPES.OPEN_BOOKMARKS_INDEX).toBe('OPEN_BOOKMARKS_INDEX')
  })

  test('_openBookmarksIndexTab creates index tab then sends REQUEST_SIDE_PANEL_CLOSE', () => {
    expect(typeof sw._openBookmarksIndexTab).toBe('function')
    sw._openBookmarksIndexTab()
    expect(global.chrome.tabs.create).toHaveBeenCalledWith({
      url: 'chrome-extension://test-id/src/ui/bookmarks-table/bookmarks-table.html'
    })
    expect(global.chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: MESSAGE_TYPES.REQUEST_SIDE_PANEL_CLOSE
    })
  })

  test('command open-bookmarks-index creates tab and sends REQUEST_SIDE_PANEL_CLOSE', () => {
    const listener = global.chrome.commands.onCommand.addListener.mock.calls[0][0]
    listener('open-bookmarks-index')
    expect(global.chrome.tabs.create).toHaveBeenCalledWith({
      url: 'chrome-extension://test-id/src/ui/bookmarks-table/bookmarks-table.html'
    })
    expect(global.chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: MESSAGE_TYPES.REQUEST_SIDE_PANEL_CLOSE
    })
  })

  test('context menu hoverboard-open-bookmarks-index creates tab and sends REQUEST_SIDE_PANEL_CLOSE', () => {
    sw.setupContextMenus()
    const onClicked = global.chrome.contextMenus.onClicked.addListener.mock.calls[0][0]
    onClicked({ menuItemId: 'hoverboard-open-bookmarks-index' }, {})
    expect(global.chrome.tabs.create).toHaveBeenCalledWith({
      url: 'chrome-extension://test-id/src/ui/bookmarks-table/bookmarks-table.html'
    })
    expect(global.chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: MESSAGE_TYPES.REQUEST_SIDE_PANEL_CLOSE
    })
  })

  test('OPEN_BOOKMARKS_INDEX message triggers OPEN_BOOKMARKS_INDEX_TAB', () => {
    const onMessage = global.chrome.runtime.onMessage.addListener.mock.calls[0][0]
    const sendResponse = jest.fn()
    onMessage({ type: MESSAGE_TYPES.OPEN_BOOKMARKS_INDEX }, {}, sendResponse)
    expect(global.chrome.tabs.create).toHaveBeenCalledWith({
      url: 'chrome-extension://test-id/src/ui/bookmarks-table/bookmarks-table.html'
    })
    expect(global.chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: MESSAGE_TYPES.REQUEST_SIDE_PANEL_CLOSE
    })
  })
})

describe('[REQ-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX] Popup open index via SW', () => {
  let popupController
  let sendMessageSpy

  beforeEach(() => {
    sendMessageSpy = jest.fn().mockImplementation((msg, cb) => {
      if (typeof cb === 'function') cb({ success: true })
    })
    global.chrome = {
      tabs: { query: jest.fn().mockResolvedValue([{ id: 1, url: 'https://example.com' }]), create: jest.fn() },
      runtime: { sendMessage: sendMessageSpy, getURL: jest.fn((p) => `chrome-extension://id/${p}`) }
    }
    popupController = new PopupController({
      uiManager: {
        updateShowHoverButtonState: jest.fn(),
        showError: jest.fn(),
        showSuccess: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
        setLoading: jest.fn(),
        updateCurrentTags: jest.fn(),
        updatePrivateStatus: jest.fn(),
        updateReadLaterStatus: jest.fn(),
        updateConnectionStatus: jest.fn(),
        elements: {}
      },
      stateManager: { setState: jest.fn() },
      errorHandler: { handleError: jest.fn() }
    })
  })

  test('handleOpenBookmarksIndex sends OPEN_BOOKMARKS_INDEX (not direct tabs.create)', async () => {
    await popupController.handleOpenBookmarksIndex()
    expect(sendMessageSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: MESSAGE_TYPES.OPEN_BOOKMARKS_INDEX }),
      expect.any(Function)
    )
    expect(global.chrome.tabs.create).not.toHaveBeenCalled()
  })
})

describe('[REQ-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX] Index page must not dismiss on refresh (1B)', () => {
  test('bookmarks-table.js does not reference REQUEST_SIDE_PANEL_CLOSE', () => {
    const src = readFileSync(
      join(process.cwd(), 'src/ui/bookmarks-table/bookmarks-table.js'),
      'utf8'
    )
    // Strip block comments: 1B forbids executable sends, not IMPL-FULL-BLOCK documentation.
    const executable = src.replace(/\/\*[\s\S]*?\*\//g, '')
    expect(executable).not.toMatch(/REQUEST_SIDE_PANEL_CLOSE/)
    expect(executable).not.toMatch(/OPEN_BOOKMARKS_INDEX/)
  })
})
