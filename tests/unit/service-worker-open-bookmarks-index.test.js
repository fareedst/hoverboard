/**
 * [REQ-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX]
 * OPEN_BOOKMARKS_INDEX_TAB: create index tab then REQUEST_SIDE_PANEL_CLOSE (index-open dismisses side panel).
 */

/**
 * === IMPL-FULL-BLOCK: IMPL-LIBRARY_SEARCH_ENTRY ===
 * [IMPL-LIBRARY_SEARCH_ENTRY] [ARCH-LIBRARY_SEARCH_ENTRY] [REQ-LIBRARY_SEARCH_ENTRY] — Capture UI Search Bookmarks opens Index with ?q=; distinct from Search tabs.
 *
 * ## Build Index URL with query
 *
 * - [IMPL-LIBRARY_SEARCH_ENTRY] [ARCH-LIBRARY_SEARCH_ENTRY] [REQ-LIBRARY_SEARCH_ENTRY] How: Pure URL builder shared by SW and tests; append encoded q.
 * - Contract:
 *   - INPUT: baseUrl (string), query (string)
 *   - PRE: baseUrl may be empty
 *   - OUTPUT: baseUrl unchanged when query empty; else baseUrl + ?q= or &q= encodeURIComponent(query)
 *   - POST:
 *     - success => empty query returns baseUrl; non-empty query includes encoded q
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: BUILD_BOOKMARKS_INDEX_URL_WITH_QUERY
 *   - 1. q = trim(query)
 *   - 2. IF baseUrl empty THEN RETURN ""
 *   - 3. IF q empty THEN RETURN baseUrl
 *   - 4. sep = IF baseUrl contains "?" THEN "&" ELSE "?"
 *   - 5. RETURN baseUrl + sep + "q=" + encodeURIComponent(q)
 *
 * ## Open library search from capture UI
 *
 * - [IMPL-LIBRARY_SEARCH_ENTRY] [ARCH-LIBRARY_SEARCH_ENTRY] [REQ-LIBRARY_SEARCH_ENTRY] How: Read Search Bookmarks input; send OPEN_BOOKMARKS_INDEX with q (does not replace Search tabs).
 * - Contract:
 *   - INPUT: librarySearchInput value (string)
 *   - PRE: sendMessage available
 *   - OUTPUT: OPEN_BOOKMARKS_INDEX message with data.q
 *   - POST:
 *     - success => SW opens Index tab; Index search prefilled when q non-empty
 *   - EFFECTS: Async, State
 *   - TERMINATION: total
 * - PROCEDURE: OPEN_LIBRARY_SEARCH
 *   - 1. q = trim(librarySearchInput.value)
 *   - 2. SEND OPEN_BOOKMARKS_INDEX { q }
 *   - 3. (SW) OPEN_BOOKMARKS_INDEX_TAB(q) via BUILD_BOOKMARKS_INDEX_URL_WITH_QUERY then REQUEST_SIDE_PANEL_CLOSE
 *
 * ## Prefill Index search from URL
 *
 * - [IMPL-LIBRARY_SEARCH_ENTRY] [ARCH-LIBRARY_SEARCH_ENTRY] [REQ-LIBRARY_SEARCH_ENTRY] How: On Index load, read ?q= into search field and apply filter.
 * - Contract:
 *   - INPUT: window.location.search
 *   - PRE: Index DOM search input exists
 *   - OUTPUT: search input value set; filter applied when q present
 *   - EFFECTS: State
 *   - TERMINATION: total
 * - PROCEDURE: PREFILL_INDEX_SEARCH_FROM_QUERY
 *   - 1. params = URLSearchParams(location.search)
 *   - 2. q = params.get("q")
 *   - 3. IF q THEN SET searchInput.value = q; APPLY index filter
 *
 * === END IMPL-FULL-BLOCK: IMPL-LIBRARY_SEARCH_ENTRY ===
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

  test('[REQ-LIBRARY_SEARCH_ENTRY] OPEN_BOOKMARKS_INDEX data.q appends encoded ?q= via BUILD_BOOKMARKS_INDEX_URL_WITH_QUERY', () => {
    const onMessage = global.chrome.runtime.onMessage.addListener.mock.calls[0][0]
    const sendResponse = jest.fn()
    onMessage({ type: MESSAGE_TYPES.OPEN_BOOKMARKS_INDEX, data: { q: 'foo bar' } }, {}, sendResponse)
    expect(global.chrome.tabs.create).toHaveBeenCalledWith({
      url: 'chrome-extension://test-id/src/ui/bookmarks-table/bookmarks-table.html?q=foo%20bar'
    })
    expect(global.chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: MESSAGE_TYPES.REQUEST_SIDE_PANEL_CLOSE
    })
  })

  test('[REQ-LIBRARY_SEARCH_ENTRY] _openBookmarksIndexTab(q) uses shared URL builder', () => {
    sw._openBookmarksIndexTab('tag:work')
    expect(global.chrome.tabs.create).toHaveBeenCalledWith({
      url: 'chrome-extension://test-id/src/ui/bookmarks-table/bookmarks-table.html?q=tag%3Awork'
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
