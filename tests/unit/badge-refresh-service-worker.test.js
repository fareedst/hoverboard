/**
 * === IMPL-FULL-BLOCK: IMPL-BADGE_REFRESH ===
 * [IMPL-BADGE_REFRESH] [ARCH-BADGE] [REQ-BADGE_INDICATORS] — Service worker refreshes badge after saveTag, deleteTag, saveBookmark so icon reflects tag count and flags.
 *
 * ## MAIN
 *
 * - [IMPL-BADGE_REFRESH] [ARCH-BADGE] [REQ-BADGE_INDICATORS] How: Logical block for IMPL-BADGE_REFRESH.
 * - Contract:
 *   - INPUT: message result (after processMessage) with type saveTag | deleteTag | saveBookmark
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: badge updated for the affected tab (icon label and optional private/toread indicators)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: handleMessage in service worker; updateBadgeForTab(tab)
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: MAIN
 *   - How (sub-block): Resolve tab (sender.tab or query active for saveBookmark); call updateBadgeForTab(tab).
 *   - 1. AFTER processMessage(message) succeeds:
 *   - 2.   IF message.type IN [saveTag, deleteTag, saveBookmark]:
 *   - 3.     tab = sender.tab IF present
 *   - 4.     IF no tab AND message.type = saveBookmark: tab = query active tab
 *   - 5.     IF tab: updateBadgeForTab(tab)
 *
 * ## MESSAGE_DISPATCH_BADGE_REFRESH
 *
 * - [IMPL-BADGE_REFRESH] [IMPL-MESSAGE_HANDLING] [ARCH-BADGE] [ARCH-MESSAGE_HANDLING] [REQ-BADGE_INDICATORS] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] How: Completes a successful message dispatch before refreshing the affected tab badge.
 * - Contract:
 *   - INPUT: message, sender tab, message-processing result
 *   - PRE: message processing has a resolvable result; badge updater is available
 *   - OUTPUT: updated badge state for the affected tab
 *   - POST:
 *     - success => badge refresh runs only for saveTag, deleteTag, or saveBookmark
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: MESSAGE_DISPATCH_BADGE_REFRESH
 *   - AWAIT processMessage(message)
 *   - IF message type is saveTag, deleteTag, or saveBookmark:
 *     - tab = sender tab when present
 *     - IF tab is absent and message type is saveBookmark: AWAIT active-tab lookup
 *     - IF tab exists: AWAIT updateBadgeForTab(tab)
 *
 * === END IMPL-FULL-BLOCK: IMPL-BADGE_REFRESH ===
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
 * ## MESSAGE_DISPATCH_SHARED_BROWSER
 *
 * - [IMPL-CROSS_BROWSER] [IMPL-MESSAGE_HANDLING] [ARCH-CROSS_BROWSER] [ARCH-MESSAGE_HANDLING] [REQ-CROSS_BROWSER] How: Routes a MessageClient request through the shared browser shim and resolves the callback response without UI or host-specific behavior.
 * - Contract:
 *   - INPUT: message payload, retry options, shared browser runtime
 *   - PRE: shared browser runtime is available; callback-style sendMessage is supported
 *   - OUTPUT: resolved message response
 *   - POST:
 *     - success => runtime receives the message with a generated messageId and the response is returned
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: MESSAGE_DISPATCH_SHARED_BROWSER
 *   - message = ADD messageId to input payload
 *   - SEND message through shared browser runtime
 *   - AWAIT callback response
 *   - RETURN response
 *
 * === END IMPL-FULL-BLOCK: IMPL-CROSS_BROWSER ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-MV3_MIGRATION ===
 * [IMPL-MV3_MIGRATION] [ARCH-MV3_MIGRATION] [REQ-MANIFEST_V3_MIGRATION] — How: keep store-compatible Manifest V3: service worker replaces background page; preserve messaging and APIs.
 * 
 * ## MV3_BACKGROUND_RUNTIME
 * 
 * - [IMPL-MV3_MIGRATION] [ARCH-MV3_MIGRATION] [REQ-MANIFEST_V3_MIGRATION] How: service worker owns listeners; async message replies use return true / Promise patterns.
 * - Contract:
 *   - INPUT: extension lifecycle events; chrome.runtime / chrome.storage / chrome.action calls
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: service-worker-backed background behavior equivalent to prior MV2 background page contracts
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: manifest_version 3; src/core/service-worker.js; ARCH-SERVICE_WORKER lifecycle patterns
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: MV3_BACKGROUND_RUNTIME
 *   - ON install/activate: init shared managers (config, tags memory, badge)
 *   - ON message: DELEGATE to MessageHandler; KEEP channel alive until AWAIT completes
 *   - ON alarm/idle as needed: wake worker for deferred work
 *   - RETURN
 * 
 * === END IMPL-FULL-BLOCK: IMPL-MV3_MIGRATION ===
 */
import { jest } from '@jest/globals'

const MESSAGE_TYPES = {
  SAVE_TAG: 'saveTag',
  DELETE_TAG: 'deleteTag',
  SAVE_BOOKMARK: 'saveBookmark',
  SWITCH_STORAGE_MODE: 'switchStorageMode'
}

const mockProcessMessage = jest.fn().mockResolvedValue({})

jest.mock('../../src/core/message-handler.js', () => ({
  MessageHandler: jest.fn().mockImplementation(() => ({
    processMessage: mockProcessMessage,
    bookmarkProvider: null,
    setBookmarkProvider: jest.fn(),
    tagService: {}
  })),
  MESSAGE_TYPES
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

const mockTabsQuery = jest.fn().mockResolvedValue([])
jest.mock('../../src/shared/safari-shim.js', () => ({
  browser: {
    tabs: {
      get: jest.fn().mockResolvedValue({ id: 1, url: 'https://example.com' }),
      query: mockTabsQuery,
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

describe('[REQ-BADGE_INDICATORS] [IMPL-BADGE_REFRESH] Badge refresh after overlay/popup changes', () => {
  let HoverboardServiceWorker

  beforeAll(async () => {
    const module = await import('../../src/core/service-worker.js')
    HoverboardServiceWorker = module.HoverboardServiceWorker
  })

  beforeEach(() => {
    jest.clearAllMocks()
    mockProcessMessage.mockResolvedValue({})
    mockTabsQuery.mockResolvedValue([])
  })

  test('calls updateBadgeForTab when saveTag is handled and sender has tab', async () => {
    const sw = new HoverboardServiceWorker()
    sw._providerInitialized = true
    const updateBadgeForTab = jest.fn().mockResolvedValue(undefined)
    sw.updateBadgeForTab = updateBadgeForTab

    const senderTab = { id: 101, url: 'https://example.com/page' }
    await sw.handleMessage(
      { type: 'saveTag', data: { url: 'https://example.com/page', value: 'foo' } },
      { tab: senderTab }
    )

    expect(mockProcessMessage).toHaveBeenCalled()
    expect(updateBadgeForTab).toHaveBeenCalledTimes(1)
    expect(updateBadgeForTab).toHaveBeenCalledWith(senderTab)
  })

  test('calls updateBadgeForTab when deleteTag is handled and sender has tab', async () => {
    const sw = new HoverboardServiceWorker()
    sw._providerInitialized = true
    const updateBadgeForTab = jest.fn().mockResolvedValue(undefined)
    sw.updateBadgeForTab = updateBadgeForTab

    const senderTab = { id: 102, url: 'https://example.org' }
    await sw.handleMessage(
      { type: 'deleteTag', data: { url: 'https://example.org', value: 'bar' } },
      { tab: senderTab }
    )

    expect(updateBadgeForTab).toHaveBeenCalledTimes(1)
    expect(updateBadgeForTab).toHaveBeenCalledWith(senderTab)
  })

  test('calls updateBadgeForTab when saveBookmark is handled and sender has tab', async () => {
    const sw = new HoverboardServiceWorker()
    sw._providerInitialized = true
    const updateBadgeForTab = jest.fn().mockResolvedValue(undefined)
    sw.updateBadgeForTab = updateBadgeForTab

    const senderTab = { id: 103, url: 'https://example.net' }
    await sw.handleMessage(
      { type: 'saveBookmark', data: { url: 'https://example.net', shared: 'no', toread: 'yes' } },
      { tab: senderTab }
    )

    expect(updateBadgeForTab).toHaveBeenCalledTimes(1)
    expect(updateBadgeForTab).toHaveBeenCalledWith(senderTab)
  })

  test('calls updateBadgeForTab for saveBookmark without sender.tab by querying active tab', async () => {
    const activeTab = { id: 201, url: 'https://active-tab.com' }
    mockTabsQuery.mockResolvedValue([activeTab])

    const sw = new HoverboardServiceWorker()
    sw._providerInitialized = true
    const updateBadgeForTab = jest.fn().mockResolvedValue(undefined)
    sw.updateBadgeForTab = updateBadgeForTab

    await sw.handleMessage(
      { type: 'saveBookmark', data: { url: 'https://active-tab.com', shared: 'yes' } },
      {}
    )

    expect(mockTabsQuery).toHaveBeenCalledWith({ active: true, currentWindow: true })
    expect(updateBadgeForTab).toHaveBeenCalledTimes(1)
    expect(updateBadgeForTab).toHaveBeenCalledWith(activeTab)
  })

  test('does not call updateBadgeForTab for saveTag when sender has no tab', async () => {
    const sw = new HoverboardServiceWorker()
    sw._providerInitialized = true
    const updateBadgeForTab = jest.fn().mockResolvedValue(undefined)
    sw.updateBadgeForTab = updateBadgeForTab

    await sw.handleMessage(
      { type: 'saveTag', data: { url: 'https://example.com', value: 'baz' } },
      {}
    )

    expect(updateBadgeForTab).not.toHaveBeenCalled()
  })

  test('does not call updateBadgeForTab for unrelated message types', async () => {
    const sw = new HoverboardServiceWorker()
    sw._providerInitialized = true
    const updateBadgeForTab = jest.fn().mockResolvedValue(undefined)
    sw.updateBadgeForTab = updateBadgeForTab

    await sw.handleMessage(
      { type: 'getCurrentBookmark', data: { url: 'https://example.com' } },
      { tab: { id: 1, url: 'https://example.com' } }
    )

    expect(updateBadgeForTab).not.toHaveBeenCalled()
  })
})
