/**
 * [REQ-QUICK_ACCESS_ENTRY] [ARCH-QUICK_ACCESS_ENTRY] [IMPL-EXTENSION_COMMANDS] [IMPL-CONTEXT_MENU_QUICK_ACCESS]
 * Unit tests: extension commands and context menu for quick access (side panel, options, bookmarks index, import).
 */

import { HoverboardServiceWorker } from '../../src/core/service-worker.js'

describe('[REQ-QUICK_ACCESS_ENTRY] [ARCH-QUICK_ACCESS_ENTRY] [IMPL-EXTENSION_COMMANDS] Extension commands quick access', () => {
  let sw

  beforeEach(() => {
    jest.clearAllMocks()
    global.chrome.runtime.getURL.mockImplementation((path) => `chrome-extension://test-id/${path}`)
    sw = new HoverboardServiceWorker()
  })

  test('onCommand listener is registered', () => {
    expect(global.chrome.commands.onCommand.addListener).toHaveBeenCalled()
    expect(typeof global.chrome.commands.onCommand.addListener.mock.calls[0][0]).toBe('function')
  })

  test('command open-options calls chrome.runtime.openOptionsPage', () => {
    const listener = global.chrome.commands.onCommand.addListener.mock.calls[0][0]
    listener('open-options')
    expect(global.chrome.runtime.openOptionsPage).toHaveBeenCalledTimes(1)
  })

  test('command open-side-panel calls chrome.sidePanel.open with cached windowId', () => {
    sw._sidePanelWindowId = 42
    const listener = global.chrome.commands.onCommand.addListener.mock.calls[0][0]
    listener('open-side-panel')
    expect(global.chrome.sidePanel.open).toHaveBeenCalledWith({ windowId: 42 })
  })

  test('command open-bookmarks-index calls chrome.tabs.create with bookmarks-table URL', () => {
    const listener = global.chrome.commands.onCommand.addListener.mock.calls[0][0]
    listener('open-bookmarks-index')
    expect(global.chrome.tabs.create).toHaveBeenCalledWith({
      url: 'chrome-extension://test-id/src/ui/bookmarks-table/bookmarks-table.html'
    })
  })

  test('command open-import calls chrome.tabs.create with browser-bookmark-import URL', () => {
    const listener = global.chrome.commands.onCommand.addListener.mock.calls[0][0]
    listener('open-import')
    expect(global.chrome.tabs.create).toHaveBeenCalledWith({
      url: 'chrome-extension://test-id/src/ui/browser-bookmark-import/browser-bookmark-import.html'
    })
  })
})

describe('[REQ-QUICK_ACCESS_ENTRY] [ARCH-QUICK_ACCESS_ENTRY] [IMPL-CONTEXT_MENU_QUICK_ACCESS] Context menu quick access', () => {
  let sw

  beforeEach(() => {
    jest.clearAllMocks()
    global.chrome.runtime.getURL.mockImplementation((path) => `chrome-extension://test-id/${path}`)
    sw = new HoverboardServiceWorker()
  })

  test('setupContextMenus creates parent and four child menu items', () => {
    sw.setupContextMenus()
    expect(global.chrome.contextMenus.removeAll).toHaveBeenCalled()
    expect(global.chrome.contextMenus.create).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'hoverboard-root', title: 'Hoverboard' })
    )
    const createCalls = global.chrome.contextMenus.create.mock.calls
    const ids = createCalls.map((c) => c[0].id)
    expect(ids).toContain('hoverboard-open-side-panel')
    expect(ids).toContain('hoverboard-open-options')
    expect(ids).toContain('hoverboard-open-bookmarks-index')
    expect(ids).toContain('hoverboard-open-import')
  })

  test('context menu onClicked hoverboard-open-options calls openOptionsPage', () => {
    sw.setupContextMenus()
    const onClicked = global.chrome.contextMenus.onClicked.addListener.mock.calls[0][0]
    onClicked({ menuItemId: 'hoverboard-open-options' }, {})
    expect(global.chrome.runtime.openOptionsPage).toHaveBeenCalledTimes(1)
  })

  test('context menu onClicked hoverboard-open-side-panel calls sidePanel.open', () => {
    sw._sidePanelWindowId = 10
    sw.setupContextMenus()
    const onClicked = global.chrome.contextMenus.onClicked.addListener.mock.calls[0][0]
    onClicked({ menuItemId: 'hoverboard-open-side-panel' }, {})
    expect(global.chrome.sidePanel.open).toHaveBeenCalledWith({ windowId: 10 })
  })

  test('context menu onClicked hoverboard-open-bookmarks-index calls tabs.create', () => {
    sw.setupContextMenus()
    const onClicked = global.chrome.contextMenus.onClicked.addListener.mock.calls[0][0]
    onClicked({ menuItemId: 'hoverboard-open-bookmarks-index' }, {})
    expect(global.chrome.tabs.create).toHaveBeenCalledWith({
      url: 'chrome-extension://test-id/src/ui/bookmarks-table/bookmarks-table.html'
    })
  })

  test('context menu onClicked hoverboard-open-import calls tabs.create', () => {
    sw.setupContextMenus()
    const onClicked = global.chrome.contextMenus.onClicked.addListener.mock.calls[0][0]
    onClicked({ menuItemId: 'hoverboard-open-import' }, {})
    expect(global.chrome.tabs.create).toHaveBeenCalledWith({
      url: 'chrome-extension://test-id/src/ui/browser-bookmark-import/browser-bookmark-import.html'
    })
  })
})
