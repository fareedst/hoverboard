/**
 * === IMPL-FULL-BLOCK: IMPL-CONTEXT_MENU_QUICK_ACCESS ===
 * [IMPL-CONTEXT_MENU_QUICK_ACCESS] [ARCH-QUICK_ACCESS_ENTRY] [REQ-QUICK_ACCESS_ENTRY] — This block defines context menu for quick access. Implements REQ "context menu" with same four actions as commands; implements ARCH by having SW own context menu.
 * 
 * ## SETUP_CONTEXT_MENUS
 * 
 * - [REQ-QUICK_ACCESS_ENTRY] [ARCH-QUICK_ACCESS_ENTRY] [IMPL-CONTEXT_MENU_QUICK_ACCESS] How: setupContextMenus: creates parent and four children so REQ "context menu with parent Hoverboard and four items" is satisfied. Call on install (handleInstall) so menus appear after install.
 * - Contract:
 *   - INPUT: user right-clicks (any context); user selects one of four Hoverboard menu items
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: same as extension commands (side panel, options, bookmarks index, or import opens)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - EFFECTS: Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: SETUP_CONTEXT_MENUS
 *   - api = browser.contextMenus || chrome.contextMenus
 *   - IF !api THEN RETURN
 *   - api.removeAll(() => {  // idempotent: clear then create so update does not duplicate
 *   - api.create({ id: 'hoverboard-root', title: 'Hoverboard', contexts: ['all'] })
 *   - api.create({ id: 'hoverboard-open-side-panel', parentId: 'hoverboard-root', title: 'Open side panel', contexts: ['all'] })
 *   - api.create({ id: 'hoverboard-open-options', parentId: 'hoverboard-root', title: 'Open options', contexts: ['all'] })
 *   - api.create({ id: 'hoverboard-open-bookmarks-index', parentId: 'hoverboard-root', title: 'Open bookmarks index', contexts: ['all'] })
 *   - api.create({ id: 'hoverboard-open-import', parentId: 'hoverboard-root', title: 'Open browser bookmark import', contexts: ['all'] })
 *   - })
 * 
 * ## BLOCK_2
 * 
 * - [REQ-QUICK_ACCESS_ENTRY] [ARCH-QUICK_ACCESS_ENTRY] [IMPL-CONTEXT_MENU_QUICK_ACCESS] How: onClicked: implements same four actions as command handler so REQ and ARCH are satisfied (single behavior, multiple entry points).
 * - Contract:
 *   - INPUT: user right-clicks (any context); user selects one of four Hoverboard menu items
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: same as extension commands (side panel, options, bookmarks index, or import opens)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - EFFECTS: Http, IO
 *   - TERMINATION: total
 * - PROCEDURE: BLOCK_2
 *   - 1. api.onClicked.addListener((info, tab) => {
 *   - 2.   SWITCH info.menuItemId:
 *   - 3.     "hoverboard-open-side-panel": same as open-side-panel command (chrome.sidePanel.open({ windowId: this._sidePanelWindowId }))
 *   - 4.     "hoverboard-open-options": chrome.runtime.openOptionsPage()
 *   - 5.     "hoverboard-open-bookmarks-index": OPEN_BOOKMARKS_INDEX_TAB  # [IMPL-LOCAL_BOOKMARKS_INDEX]
 *   - 6.     "hoverboard-open-import": chrome.tabs.create({ url: chrome.runtime.getURL('src/ui/browser-bookmark-import/browser-bookmark-import.html') })
 *   - 7. })
 * 
 * === END IMPL-FULL-BLOCK: IMPL-CONTEXT_MENU_QUICK_ACCESS ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-EXTENSION_COMMANDS ===
 * [IMPL-EXTENSION_COMMANDS] [ARCH-QUICK_ACCESS_ENTRY] [REQ-QUICK_ACCESS_ENTRY] — Extension commands for quick access; SW owns command handling. Contract: shortcut in; one of four targets opens.
 * 
 * ## MANIFEST_JSON
 * 
 * - [REQ-QUICK_ACCESS_ENTRY] [ARCH-QUICK_ACCESS_ENTRY] [IMPL-EXTENSION_COMMANDS] How: Manifest: four commands so Chrome shows them in chrome://extensions/shortcuts; user can reassign.
 * - Contract:
 *   - INPUT: user presses assigned shortcut (or default Ctrl+Shift+B/O/M/I)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: side panel opens, or options page opens, or bookmarks index tab opens, or import page tab opens
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: command names (open-side-panel, open-options, open-bookmarks-index, open-import); SW onCommand handler
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: State
 *   - TERMINATION: total
 * - PROCEDURE: MANIFEST_JSON
 *   - "commands": {
 *   - "open-side-panel": { "suggested_key": { "default": "Ctrl+Shift+B" }, "description": "Open Hoverboard side panel" },
 *   - "open-options": { "suggested_key": { "default": "Ctrl+Shift+O" }, "description": "Open Hoverboard options" },
 *   - "open-bookmarks-index": { "suggested_key": { "default": "Ctrl+Shift+M" }, "description": "Open bookmarks index" },
 *   - "open-import": { "suggested_key": { "default": "Ctrl+Shift+I" }, "description": "Open browser bookmark import" }
 *   - }
 * 
 * ## HANDLE_COMMAND
 * 
 * - [REQ-QUICK_ACCESS_ENTRY] [ARCH-QUICK_ACCESS_ENTRY] [IMPL-EXTENSION_COMMANDS] How: SW onCommand: handle each command; side panel via _sidePanelWindowId; openOptionsPage and tabs.create for options, index, import.
 * - Contract:
 *   - INPUT: user presses assigned shortcut (or default Ctrl+Shift+B/O/M/I)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: side panel opens, or options page opens, or bookmarks index tab opens, or import page tab opens
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: command names (open-side-panel, open-options, open-bookmarks-index, open-import); SW onCommand handler
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: HANDLE_COMMAND
 *   - SWITCH command:
 *   - "open-side-panel": windowId = this._sidePanelWindowId; IF windowId != null AND chrome.sidePanel?.open THEN chrome.sidePanel.open({ windowId })
 *   - "open-side-panel-bookmark": chrome.storage.local.set({ hoverboard_sidepanel_active_tab: 'bookmark' }); THEN sidePanel.open({ windowId })
 *   - "open-side-panel-tags-tree": chrome.storage.local.set({ hoverboard_sidepanel_active_tab: 'tagsTree' }); THEN sidePanel.open({ windowId })
 *   - "open-side-panel-browser-tabs": chrome.storage.local.set({ hoverboard_sidepanel_active_tab: 'browserTabs' }); THEN sidePanel.open({ windowId })
 *   - "open-options": chrome.runtime.openOptionsPage()
 *   - "open-bookmarks-index": OPEN_BOOKMARKS_INDEX_TAB  # tabs.create + REQUEST_SIDE_PANEL_CLOSE [IMPL-LOCAL_BOOKMARKS_INDEX]
 *   - "open-import": chrome.tabs.create({ url: ... browser-bookmark-import.html })
 *   - How (sub-block): Side panel: storage.onChanged for SIDE_PANEL_TAB_STORAGE_KEY → switchTab(newValue) when panel already open.
 * 
 * === END IMPL-FULL-BLOCK: IMPL-EXTENSION_COMMANDS ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-ICON_CLICK_BEHAVIOR ===
 * [IMPL-ICON_CLICK_BEHAVIOR] [ARCH-ICON_CLICK_BEHAVIOR] [REQ-ICON_CLICK_BEHAVIOR] — Icon click opens side panel (default) or popup; when side panel, click toggles (close if already open).
 * 
 * ## _SEED_ICON_CLICK_PREFERENCE_CACHE
 * 
 * - [REQ-ICON_CLICK_BEHAVIOR] [ARCH-ICON_CLICK_BEHAVIOR] [IMPL-ICON_CLICK_BEHAVIOR] How: Manifest: no default_popup so onClicked fires. Config: iconClickOpensSidePanel default true; schema optional boolean. Options: toggle bound to iconClickOpensSidePanel; load and save with other settings. SW: cache preference so handler stays synchronous (user gesture required for sidePanel.open).
 * - Contract:
 *   - INPUT: user clicks extension toolbar icon
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: side panel opens or closes (toggle) when option enabled; else popup opens
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: SW _iconClickOpensSidePanel (cached), _sidePanelWindowId; panel _sidePanelLoadTime; MESSAGE_TYPES.REQUEST_SIDE_PANEL_CLOSE
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: _SEED_ICON_CLICK_PREFERENCE_CACHE
 *   - getConfig().then(c => this._iconClickOpensSidePanel = c.iconClickOpensSidePanel)
 *   - storage.onChanged.addListener(changes, areaName => IF areaName === 'local' AND changes.hoverboard_settings THEN getConfig().then(...))
 * 
 * ## HANDLE_ACTION_CLICK
 * 
 * - [REQ-ICON_CLICK_BEHAVIOR] [ARCH-ICON_CLICK_BEHAVIOR] [IMPL-ICON_CLICK_BEHAVIOR] How: SW: listener passes tab from Chrome into handleActionClick(tab). SW handleActionClick(tab): prefer clicked window; Chrome requires sidePanel.open() in same synchronous user-gesture stack.
 * - Contract:
 *   - INPUT: user clicks extension toolbar icon
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: side panel opens or closes (toggle) when option enabled; else popup opens
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: SW _iconClickOpensSidePanel (cached), _sidePanelWindowId; panel _sidePanelLoadTime; MESSAGE_TYPES.REQUEST_SIDE_PANEL_CLOSE
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: HANDLE_ACTION_CLICK
 *   - openSidePanel = (this._iconClickOpensSidePanel !== false)
 *   - IF NOT openSidePanel: action.openPopup(); RETURN
 *   - IF NOT sidePanel.open available: action.openPopup(); RETURN
 *   - How (sub-block): # [IMPL-ICON_CLICK_BEHAVIOR] Prefer clicked window: use tab from onClicked when provided, else cache.
 *   - clickedWindowId = tab?.windowId != null ? tab.windowId : null
 *   - cachedWindowId = this._sidePanelWindowId
 *   - useWindowId = clickedWindowId != null ? clickedWindowId : cachedWindowId
 *   - IF useWindowId != null:
 *   - IF clickedWindowId != null AND NOT _isRestrictedForSidePanel(tab?.url): this._sidePanelWindowId = clickedWindowId
 *   - sidePanel.open({ windowId: useWindowId }); windows.update(useWindowId, { focused: true }); sendMessage(REQUEST_SIDE_PANEL_CLOSE); RETURN
 *   - How (sub-block): # [IMPL-ICON_CLICK_BEHAVIOR] Cold start: no tab and no cache; do NOT call sidePanel.open in async callback (gesture would be lost). Seed cache for next click; open popup as fallback.
 *   - tabs.query({ active: true, currentWindow: true }, (tabs) =>
 *   - tabFromQuery = tabs?.[0]
 *   - IF tabFromQuery?.windowId != null AND NOT _isRestrictedForSidePanel(tabFromQuery.url): this._sidePanelWindowId = tabFromQuery.windowId
 *   - )
 *   - action.openPopup()
 * 
 * ## BIND_TOGGLE_CLOSE_REQUEST
 * 
 * - [REQ-ICON_CLICK_BEHAVIOR] [IMPL-ICON_CLICK_BEHAVIOR] How: Side panel: on REQUEST_SIDE_PANEL_CLOSE close if visible and open long enough (toggle).
 * - Contract:
 *   - INPUT: user clicks extension toolbar icon
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: side panel opens or closes (toggle) when option enabled; else popup opens
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: SW _iconClickOpensSidePanel (cached), _sidePanelWindowId; panel _sidePanelLoadTime; MESSAGE_TYPES.REQUEST_SIDE_PANEL_CLOSE
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: BIND_TOGGLE_CLOSE_REQUEST
 *   - runtime.onMessage.addListener(message =>
 *   - IF message?.type !== REQUEST_SIDE_PANEL_CLOSE RETURN
 *   - IF document.visibilityState !== 'visible' RETURN
 *   - IF (Date.now() - _sidePanelLoadTime) < 300 RETURN
 *   - window.close())
 * 
 * === END IMPL-FULL-BLOCK: IMPL-ICON_CLICK_BEHAVIOR ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-CROSS_BROWSER ===
 * [IMPL-CROSS_BROWSER] [ARCH-CROSS_BROWSER] [REQ-CROSS_BROWSER] — Chrome-first browser API shim; shared `browser` export for messaging and storage helpers. Contract: callers import { browser } from safari-shim (via utils); Promise-friendly messaging.
 * 
 * ## INITIALIZE_BROWSER_API
 * 
 * - [IMPL-CROSS_BROWSER] [ARCH-CROSS_BROWSER] [REQ-CROSS_BROWSER] How: Implements initializeBrowserAPI() behavior for IMPL-CROSS_BROWSER.
 * - Contract:
 *   - INPUT: chrome (or future browser) extension APIs; caller operations (sendMessage, tabs, storage)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: unified `browser` object with Promise wrappers, retry, and storage helpers
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: src/shared/safari-shim.js; re-export from src/shared/utils.js
 *   - EFFECTS: Async, Http, IO
 *   - TERMINATION: total
 * - PROCEDURE: INITIALIZE_BROWSER_API
 *   - IF chrome is defined: browser = chrome; RETURN
 *   - IF window.browser (polyfill): browser = window.browser; RETURN
 *   - browser = createMinimalBrowserAPI()
 *   - How (sub-block): Wrap messaging/tabs with retries and Promise API for Chrome service worker and content scripts.
 *   - 1. safariEnhancements (browser API shim):
 *   - PROVIDE runtime.sendMessage / tabs.* with retry and Promise behavior
 *   - PROVIDE storage helpers (quota monitoring, graceful degradation) for Chromium storage
 *   - DO NOT attach Safari-only platform metadata on messages (Safari product deferred)
 *   - How (sub-block): Reserved hooks for deferred multi-browser; Safari product not active.
 * 
 * ## PLATFORM_UTILS
 * 
 * - [IMPL-CROSS_BROWSER] [ARCH-CROSS_BROWSER] [REQ-CROSS_BROWSER] How: Implements platformUtils behavior for IMPL-CROSS_BROWSER.
 * - Contract:
 *   - INPUT: chrome (or future browser) extension APIs; caller operations (sendMessage, tabs, storage)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: unified `browser` object with Promise wrappers, retry, and storage helpers
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: src/shared/safari-shim.js; re-export from src/shared/utils.js
 *   - EFFECTS: Async, Http, IO
 *   - TERMINATION: total
 * - PROCEDURE: PLATFORM_UTILS
 *   - isSafari(): RETURN false  # reserved; Safari App Extension deferred
 *   - isChrome(): RETURN chrome is defined
 *   - isFirefox(): RETURN browser.runtime.getBrowserInfo is a function
 *   - getPlatform():
 *   - IF isChrome(): RETURN "chrome"
 *   - IF isFirefox(): RETURN "firefox"
 *   - RETURN "unknown"
 *   - How (sub-block): Call sites use shim export, not raw chrome only, for future expansion readiness.
 *   - 1. ON service worker / content / message-handler import:
 *   - USE browser from safari-shim (or utils re-export)
 * 
 * === END IMPL-FULL-BLOCK: IMPL-CROSS_BROWSER ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-SERVICE_WORKER ===
 * [IMPL-SERVICE_WORKER] [ARCH-SERVICE_WORKER] [REQ-MANIFEST_V3_MIGRATION] — How: MV3 service worker owns messaging, badge, recent-tags memory, and lifecycle wake/sleep.
 * 
 * ## SERVICE_WORKER_MAIN
 * 
 * - [IMPL-SERVICE_WORKER] [ARCH-SERVICE_WORKER] [REQ-MANIFEST_V3_MIGRATION] How: wire listeners once; delegate business logic to validated modules.
 * - Contract:
 *   - INPUT: chrome.runtime.onMessage; install/activate; alarms; port connections
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: routed handler results; badge updates; persisted recent-tags snapshot; keep-alive while async work runs
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: src/core/service-worker.js; MessageHandler; RecentTagsMemoryManager; updateBadgeForTab
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: SERVICE_WORKER_MAIN
 *   - ON install/activate: AWAIT initManagers()
 *   - ON message (msg, sender, sendResponse):
 *   - result = AWAIT handleMessage(msg, sender)
 *   - sendResponse(result); RETURN true
 *   - ON alarm: AWAIT runDeferredTasks()
 *   - RETURN
 *   - How (sub-block): How: after processMessage success for bookmark/tag mutations, refresh badge.
 * 
 * ## HANDLE_MESSAGE
 * 
 * - [IMPL-SERVICE_WORKER] [ARCH-SERVICE_WORKER] [REQ-MANIFEST_V3_MIGRATION] How: Implements handleMessage(msg, sender) behavior for IMPL-SERVICE_WORKER.
 * - Contract:
 *   - INPUT: chrome.runtime.onMessage; install/activate; alarms; port connections
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: routed handler results; badge updates; persisted recent-tags snapshot; keep-alive while async work runs
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: src/core/service-worker.js; MessageHandler; RecentTagsMemoryManager; updateBadgeForTab
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: HANDLE_MESSAGE
 *   - result = AWAIT messageHandler.processMessage(msg, sender)
 *   - IF result.ok AND isMutation(msg.type): AWAIT updateBadgeForTab(resolveTab(sender, msg))
 *   - RETURN result
 * 
 * === END IMPL-FULL-BLOCK: IMPL-SERVICE_WORKER ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-UI_INSPECTOR ===
 * [IMPL-UI_INSPECTOR] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION] — recordMessage/recordAction ring buffers; getLastMessages/getLastActions; debug-gated. Contract: message or action in; ring buffers and getters; enabled flag.
 * 
 * ## MAIN
 * 
 * - [IMPL-UI_INSPECTOR] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION] How: Logical block for IMPL-UI_INSPECTOR.
 * - Contract:
 *   - INPUT: message (recordMessage); action (recordAction); gated by DEBUG_HOVERBOARD_UI or setEnabled(true)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: ring buffers of last N messages and last N actions; getLastMessages(), getLastActions()
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: message ring buffer; action ring buffer; enabled flag
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: MAIN
 *   - How (sub-block): Append to buffer when enabled; drop oldest if full.
 *   - 1. recordMessage(msg): IF enabled: APPEND to message buffer; DROP oldest if full
 *   - 2. recordAction(action): IF enabled: APPEND to action buffer; DROP oldest if full
 *   - How (sub-block): Return copy of buffers.
 *   - 3. getLastMessages(), getLastActions(): RETURN copy of buffer(s)
 *   - How (sub-block): Service-worker records message; PopupController/content record action.
 *   - 4. Wiring: service-worker after handle message -> recordMessage; PopupController/content-main on action -> recordAction
 * 
 * === END IMPL-FULL-BLOCK: IMPL-UI_INSPECTOR ===
 */
// [IMPL-ICON_CLICK_BEHAVIOR] [IMPL-EXTENSION_COMMANDS] Mock safari-shim so browser.tabs === chrome.tabs; ensures cold-start tabs.query callback form uses our mock (safari-shim's tabs.query is Promise-only).
jest.mock('../../src/shared/safari-shim.js', () => ({
  browser: typeof globalThis.chrome !== 'undefined' ? globalThis.chrome : {},
  platformUtils: {}
}))

import { HoverboardServiceWorker } from '../../src/core/service-worker.js'
import { MESSAGE_TYPES } from '../../src/core/message-handler.js'

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

  test('command open-side-panel calls chrome.sidePanel.open with cached windowId', async () => {
    sw._sidePanelWindowId = 42
    global.chrome.tabs.query.mockResolvedValue([{ id: 1, url: 'https://example.com', windowId: 42 }])
    await sw.handleCommand('open-side-panel')
    expect(global.chrome.sidePanel.open).toHaveBeenCalledWith({ windowId: 42 })
  })

  test('command open-side-panel-bookmark sets storage then opens side panel [IMPL-EXTENSION_COMMANDS]', async () => {
    sw._sidePanelWindowId = 42
    await sw.handleCommand('open-side-panel-bookmark')
    expect(global.chrome.storage.local.set).toHaveBeenCalledWith(
      { hoverboard_sidepanel_active_tab: 'bookmark' }
    )
    expect(global.chrome.sidePanel.open).toHaveBeenCalledWith({ windowId: 42 })
  })

  test('command open-side-panel-tags-tree sets storage then opens side panel [IMPL-EXTENSION_COMMANDS]', async () => {
    sw._sidePanelWindowId = 42
    await sw.handleCommand('open-side-panel-tags-tree')
    expect(global.chrome.storage.local.set).toHaveBeenCalledWith(
      { hoverboard_sidepanel_active_tab: 'tagsTree' }
    )
    expect(global.chrome.sidePanel.open).toHaveBeenCalledWith({ windowId: 42 })
  })

  test('command open-side-panel-browser-tabs sets storage then opens side panel [IMPL-EXTENSION_COMMANDS]', async () => {
    sw._sidePanelWindowId = 42
    await sw.handleCommand('open-side-panel-browser-tabs')
    expect(global.chrome.storage.local.set).toHaveBeenCalledWith(
      { hoverboard_sidepanel_active_tab: 'browserTabs' }
    )
    expect(global.chrome.sidePanel.open).toHaveBeenCalledWith({ windowId: 42 })
  })

  test('command open-side-panel-browser-bookmarks opens standalone Browser Bookmarks page [IMPL-EXTENSION_COMMANDS] [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [REQ-NON_WEB_TOOLS_TOOLBAR]', async () => {
    await sw.handleCommand('open-side-panel-browser-bookmarks')
    expect(global.chrome.tabs.create).toHaveBeenCalledWith({
      url: 'chrome-extension://test-id/src/ui/browser-bookmarks/browser-bookmarks.html'
    })
    expect(global.chrome.sidePanel.open).not.toHaveBeenCalled()
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

  // [IMPL-EXTENSION_COMMANDS] Cold-start fallback: when _sidePanelWindowId null, open-side-panel probes active tab then opens panel.
  test('command open-side-panel with _sidePanelWindowId null uses tabs.query and opens panel [IMPL-EXTENSION_COMMANDS]', async () => {
    sw._sidePanelWindowId = null
    let queryCallback
    global.chrome.tabs.query.mockImplementation((queryInfo, cb) => {
      if (typeof cb === 'function') {
        queryCallback = cb
        return undefined
      }
      return Promise.resolve([{ id: 1, windowId: 88, url: 'https://example.com' }])
    })
    await sw.handleCommand('open-side-panel')
    expect(global.chrome.tabs.query).toHaveBeenCalledWith({ active: true, currentWindow: true })
    if (queryCallback) queryCallback([{ id: 1, windowId: 88, url: 'https://example.com' }])
    expect(global.chrome.sidePanel.open).toHaveBeenCalledWith({ windowId: 88 })
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

  test('context menu onClicked hoverboard-open-side-panel calls sidePanel.open', async () => {
    sw._sidePanelWindowId = 10
    global.chrome.tabs.query.mockResolvedValue([{ id: 1, url: 'https://example.com', windowId: 10 }])
    sw.setupContextMenus()
    const onClicked = global.chrome.contextMenus.onClicked.addListener.mock.calls[0][0]
    await onClicked({ menuItemId: 'hoverboard-open-side-panel' }, {})
    expect(global.chrome.sidePanel.open).toHaveBeenCalledWith({ windowId: 10 })
  })

  // [IMPL-CONTEXT_MENU_QUICK_ACCESS] Cold-start: null cache → query then open (web tab).
  test('context menu hoverboard-open-side-panel with _sidePanelWindowId null uses tabs.query [IMPL-CONTEXT_MENU_QUICK_ACCESS]', async () => {
    sw._sidePanelWindowId = null
    let queryCallback
    global.chrome.tabs.query.mockImplementation((queryInfo, cb) => {
      if (typeof cb === 'function') {
        queryCallback = cb
        return undefined
      }
      return Promise.resolve([{ id: 2, windowId: 77, url: 'https://example.com' }])
    })
    sw.setupContextMenus()
    const onClicked = global.chrome.contextMenus.onClicked.addListener.mock.calls[0][0]
    await onClicked({ menuItemId: 'hoverboard-open-side-panel' }, {})
    if (queryCallback) queryCallback([{ id: 2, windowId: 77, url: 'https://example.com' }])
    expect(global.chrome.sidePanel.open).toHaveBeenCalledWith({ windowId: 77 })
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

describe('[REQ-ICON_CLICK_BEHAVIOR] [IMPL-ICON_CLICK_BEHAVIOR] Extension icon click', () => {
  let sw

  beforeEach(() => {
    jest.clearAllMocks()
    global.chrome.runtime.getURL.mockImplementation((path) => `chrome-extension://test-id/${path}`)
    global.chrome.windows.update = jest.fn().mockResolvedValue(undefined)
    sw = new HoverboardServiceWorker()
  })

  test('action.onClicked listener is registered', () => {
    expect(global.chrome.action.onClicked.addListener).toHaveBeenCalled()
    expect(typeof global.chrome.action.onClicked.addListener.mock.calls[0][0]).toBe('function')
  })

  // [REQ-ICON_CLICK_BEHAVIOR] [IMPL-ICON_CLICK_BEHAVIOR] Icon click uses cached windowId when set (synchronous open for user gesture).
  test('handleActionClick with _sidePanelWindowId set opens side panel synchronously and focuses window', () => {
    sw._iconClickOpensSidePanel = true
    sw._sidePanelWindowId = 42
    const queryCallsBefore = global.chrome.tabs.query.mock.calls.length
    sw.handleActionClick()
    expect(global.chrome.sidePanel.open).toHaveBeenCalledWith({ windowId: 42 })
    expect(global.chrome.windows.update).toHaveBeenCalledWith(42, { focused: true })
    expect(global.chrome.tabs.query.mock.calls.length).toBe(queryCallsBefore)
    expect(global.chrome.action.openPopup).not.toHaveBeenCalled()
  })

  test('handleActionClick with _iconClickOpensSidePanel false opens popup', () => {
    sw._iconClickOpensSidePanel = false
    sw.handleActionClick()
    expect(global.chrome.sidePanel.open).not.toHaveBeenCalled()
    expect(global.chrome.action.openPopup).toHaveBeenCalledTimes(1)
  })

  // [REQ-ICON_CLICK_BEHAVIOR] [IMPL-ICON_CLICK_BEHAVIOR] Cold start: no cache, seed cache from query and open popup (cannot call sidePanel.open in async callback).
  test('handleActionClick with _sidePanelWindowId null seeds cache and opens popup [IMPL-ICON_CLICK_BEHAVIOR]', () => {
    sw._iconClickOpensSidePanel = true
    sw._sidePanelWindowId = null
    let queryCallback
    global.chrome.tabs.query.mockImplementation((queryInfo, cb) => {
      if (typeof cb === 'function') {
        queryCallback = cb
        return undefined
      }
      return Promise.resolve([])
    })
    sw.handleActionClick()
    expect(global.chrome.tabs.query).toHaveBeenCalledWith({ active: true, currentWindow: true }, expect.any(Function))
    expect(global.chrome.sidePanel.open).not.toHaveBeenCalled()
    expect(global.chrome.action.openPopup).toHaveBeenCalledTimes(1)
    queryCallback([{ id: 2, windowId: 42, url: 'https://example.com' }])
    expect(sw._sidePanelWindowId).toBe(42)
  })

  // [REQ-ICON_CLICK_BEHAVIOR] Icon click sends REQUEST_SIDE_PANEL_CLOSE when opening via cache.
  test('handleActionClick when opening side panel sends REQUEST_SIDE_PANEL_CLOSE for toggle [REQ-ICON_CLICK_BEHAVIOR]', () => {
    sw._iconClickOpensSidePanel = true
    sw._sidePanelWindowId = 99
    global.chrome.runtime.sendMessage = jest.fn()
    sw.handleActionClick()
    expect(global.chrome.runtime.sendMessage).toHaveBeenCalledWith({ type: MESSAGE_TYPES.REQUEST_SIDE_PANEL_CLOSE })
  })

  // [IMPL-ICON_CLICK_BEHAVIOR] Icon click uses cached windowId when set (user gesture requires synchronous open).
  test('handleActionClick uses cached windowId for synchronous sidePanel.open [IMPL-ICON_CLICK_BEHAVIOR]', () => {
    sw._sidePanelWindowId = 99
    sw._iconClickOpensSidePanel = true
    sw.handleActionClick()
    expect(global.chrome.sidePanel.open).toHaveBeenCalledWith({ windowId: 99 })
    expect(global.chrome.windows.update).toHaveBeenCalledWith(99, { focused: true })
  })

  // [IMPL-ICON_CLICK_BEHAVIOR] When action.onClicked provides tab, use its windowId so panel opens in the window where user clicked (not prior window).
  test('handleActionClick with tab from onClicked uses tab.windowId not cache [IMPL-ICON_CLICK_BEHAVIOR]', () => {
    sw._sidePanelWindowId = 42
    sw._iconClickOpensSidePanel = true
    sw.handleActionClick({ id: 100, windowId: 77, url: 'https://example.com' })
    expect(global.chrome.sidePanel.open).toHaveBeenCalledWith({ windowId: 77 })
    expect(global.chrome.windows.update).toHaveBeenCalledWith(77, { focused: true })
    expect(sw._sidePanelWindowId).toBe(77)
  })

  // [REQ-NON_WEB_TOOLS_TOOLBAR] Non-web icon click opens tools toolbar, not side panel.
  test('handleActionClick with tab from onClicked non-web URL opens tools toolbar [REQ-NON_WEB_TOOLS_TOOLBAR]', () => {
    sw._sidePanelWindowId = 42
    sw._iconClickOpensSidePanel = true
    global.chrome.action.setPopup = jest.fn()
    global.chrome.action.openPopup = jest.fn()
    sw.handleActionClick({ id: 1, windowId: 88, url: 'chrome://extensions/' })
    expect(global.chrome.sidePanel.open).not.toHaveBeenCalled()
    expect(global.chrome.action.setPopup).toHaveBeenCalledWith({
      tabId: 1,
      popup: 'src/ui/tools-toolbar/tools-toolbar.html'
    })
    expect(global.chrome.action.openPopup).toHaveBeenCalled()
    expect(sw._sidePanelWindowId).toBe(42)
  })

  // [IMPL-ICON_CLICK_BEHAVIOR] Cold start: tabs.query seeds cache; sidePanel.open not called in callback (user gesture lost).
  test('handleActionClick cold-start calls tabs.query and openPopup only [IMPL-ICON_CLICK_BEHAVIOR]', () => {
    sw._sidePanelWindowId = null
    sw._iconClickOpensSidePanel = true
    let queryCallback
    global.chrome.tabs.query.mockImplementation((queryInfo, cb) => {
      if (typeof cb === 'function') {
        queryCallback = cb
        return undefined
      }
      return Promise.resolve([])
    })
    sw.handleActionClick()
    expect(global.chrome.tabs.query).toHaveBeenCalledWith(
      { active: true, currentWindow: true },
      expect.any(Function)
    )
    expect(global.chrome.action.openPopup).toHaveBeenCalledTimes(1)
    queryCallback([{ id: 1, windowId: 99, url: 'https://example.com' }])
    expect(sw._sidePanelWindowId).toBe(99)
    expect(global.chrome.sidePanel.open).not.toHaveBeenCalled()
  })

  test('handleActionClick cold-start with tab missing windowId does not set cache [IMPL-ICON_CLICK_BEHAVIOR]', () => {
    sw._sidePanelWindowId = null
    sw._iconClickOpensSidePanel = true
    let queryCallback
    global.chrome.tabs.query.mockImplementation((queryInfo, cb) => {
      if (typeof cb === 'function') {
        queryCallback = cb
        return undefined
      }
      return Promise.resolve([])
    })
    sw.handleActionClick()
    queryCallback([{ id: 7, windowId: undefined, url: 'https://example.com' }])
    expect(sw._sidePanelWindowId).toBeNull()
    expect(global.chrome.sidePanel.open).not.toHaveBeenCalled()
  })

  test('handleActionClick cold-start with no tabs still calls openPopup [IMPL-ICON_CLICK_BEHAVIOR]', () => {
    sw._sidePanelWindowId = null
    sw._iconClickOpensSidePanel = true
    let queryCallback
    global.chrome.tabs.query.mockImplementation((queryInfo, cb) => {
      if (typeof cb === 'function') {
        queryCallback = cb
        return undefined
      }
      return Promise.resolve([])
    })
    sw.handleActionClick()
    expect(global.chrome.action.openPopup).toHaveBeenCalledTimes(1)
    queryCallback([])
    expect(global.chrome.sidePanel.open).not.toHaveBeenCalled()
  })

  // [IMPL-ICON_CLICK_BEHAVIOR] Cold start on restricted tab: do not set cache, open popup only (no sidePanel.open in callback).
  test('handleActionClick cold-start with restricted tab (chrome://) does not set cache and opens popup [IMPL-ICON_CLICK_BEHAVIOR]', () => {
    sw._sidePanelWindowId = null
    sw._iconClickOpensSidePanel = true
    let queryCallback
    global.chrome.tabs.query.mockImplementation((queryInfo, cb) => {
      if (typeof cb === 'function') {
        queryCallback = cb
        return undefined
      }
      return Promise.resolve([])
    })
    sw.handleActionClick()
    queryCallback([{ id: 1, windowId: 88, url: 'chrome://extensions/' }])
    expect(sw._sidePanelWindowId).toBeNull()
    expect(global.chrome.sidePanel.open).not.toHaveBeenCalled()
    expect(global.chrome.action.openPopup).toHaveBeenCalledTimes(1)
  })
})
