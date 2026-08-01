/**
 * [REQ-NON_WEB_TOOLS_TOOLBAR] [ARCH-NON_WEB_TOOLS_TOOLBAR] [IMPL-NON_WEB_TOOLS_TOOLBAR]
 * Close side panel on non-web; sync tools toolbar popup; badge routing; Visit History launcher.
 */
import { jest, describe, test, expect, beforeEach } from '@jest/globals'
import fs from 'fs'
import path from 'path'

jest.mock('../../src/shared/safari-shim.js', () => ({
  browser: typeof globalThis.chrome !== 'undefined' ? globalThis.chrome : {},
  platformUtils: {}
}))

import { HoverboardServiceWorker } from '../../src/core/service-worker.js'
import { MESSAGE_TYPES } from '../../src/core/message-handler.js'

// Jest+babel-jest emits CJS; import.meta.url is illegal there (syntax-only babel plugin).
// Match peer unit tests: resolve fixture paths from process.cwd().
const toolsToolbarHtmlPath = path.join(process.cwd(), 'src/ui/tools-toolbar/tools-toolbar.html')
const toolsToolbarJsPath = path.join(process.cwd(), 'src/ui/tools-toolbar/tools-toolbar.js')

describe('[REQ-NON_WEB_TOOLS_TOOLBAR] non-web dismiss and tools toolbar', () => {
  let sw

  beforeEach(() => {
    jest.clearAllMocks()
    global.chrome.runtime.getURL.mockImplementation((path) => `chrome-extension://test-id/${path}`)
    global.chrome.runtime.sendMessage = jest.fn().mockResolvedValue(undefined)
    global.chrome.action.setPopup = jest.fn()
    global.chrome.action.openPopup = jest.fn()
    sw = new HoverboardServiceWorker()
    sw._iconClickOpensSidePanel = true
  })

  test('_dismissSidePanelIfNonWeb sends REQUEST_SIDE_PANEL_CLOSE for chrome://', () => {
    sw._dismissSidePanelIfNonWeb('chrome://settings')
    expect(global.chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: MESSAGE_TYPES.REQUEST_SIDE_PANEL_CLOSE
    })
  })

  test('_dismissSidePanelIfNonWeb does not send for https', () => {
    sw._dismissSidePanelIfNonWeb('https://example.com')
    expect(global.chrome.runtime.sendMessage).not.toHaveBeenCalled()
  })

  test('_syncActionPopupForTab sets tools toolbar on non-web', () => {
    sw._syncActionPopupForTab({ id: 7, url: 'brave://rewards' })
    expect(global.chrome.action.setPopup).toHaveBeenCalledWith({
      tabId: 7,
      popup: 'src/ui/tools-toolbar/tools-toolbar.html'
    })
  })

  test('_syncActionPopupForTab clears popup on web when side panel preferred', () => {
    sw._syncActionPopupForTab({ id: 3, url: 'https://example.com' })
    expect(global.chrome.action.setPopup).toHaveBeenCalledWith({
      tabId: 3,
      popup: ''
    })
  })

  test('handleActionClick on non-web opens tools toolbar not side panel', () => {
    sw.handleActionClick({ id: 1, windowId: 9, url: 'chrome://newtab' })
    expect(global.chrome.action.setPopup).toHaveBeenCalled()
    expect(global.chrome.action.openPopup).toHaveBeenCalled()
    expect(global.chrome.sidePanel.open).not.toHaveBeenCalled()
  })

  test('handleTabActivated dismisses panel and syncs popup for non-web', async () => {
    global.chrome.tabs.get = jest.fn().mockResolvedValue({
      id: 2,
      windowId: 1,
      url: 'chrome://extensions'
    })
    global.chrome.windows.get = jest.fn().mockResolvedValue({ id: 1, type: 'normal' })
    global.browser = global.chrome
    await sw.handleTabActivated({ tabId: 2 })
    expect(global.chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: MESSAGE_TYPES.REQUEST_SIDE_PANEL_CLOSE
    })
    expect(global.chrome.action.setPopup).toHaveBeenCalledWith({
      tabId: 2,
      popup: 'src/ui/tools-toolbar/tools-toolbar.html'
    })
  })
})

describe('[REQ-NON_WEB_TOOLS_TOOLBAR] [REQ-BOOKMARK_USAGE_TRACKING] tools toolbar Visit History launcher', () => {
  test('tools-toolbar.html includes Visit History button', () => {
    const html = fs.readFileSync(toolsToolbarHtmlPath, 'utf8')
    expect(html).toMatch(/id="btn-visit-history"/)
    expect(html).toMatch(/Visit History/)
  })

  test('tools-toolbar.js opens visit-history.html', () => {
    const js = fs.readFileSync(toolsToolbarJsPath, 'utf8')
    expect(js).toMatch(/btn-visit-history/)
    expect(js).toMatch(/src\/ui\/visit-history\/visit-history\.html/)
  })
})
