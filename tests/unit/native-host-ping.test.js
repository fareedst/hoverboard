/**
 * === IMPL-FULL-BLOCK: IMPL-NATIVE_HOST_WRAPPER ===
 * [IMPL-NATIVE_HOST_WRAPPER] [ARCH-NATIVE_HOST] [REQ-NATIVE_HOST_WRAPPER] — Length-prefixed JSON on stdin/stdout; ping/pong; delegate to helper for other messages. Contract: stdin length+JSON in; stdout length+JSON out; helper path from install dir.
 * 
 * ## LOOP
 * 
 * - [IMPL-NATIVE_HOST_WRAPPER] [ARCH-NATIVE_HOST] [REQ-NATIVE_HOST_WRAPPER] How: Implements loop behavior for IMPL-NATIVE_HOST_WRAPPER.
 * - Contract:
 *   - INPUT: stdin — 4-byte length (native byte order) then UTF-8 JSON message (max 64 MiB from Chrome)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: stdout — 4-byte length then UTF-8 JSON response (max 1 MB to Chrome); stderr for debug/TRACE
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: install_dir = dir of executable; helper = helper.sh (Unix) or helper.exe then helper.ps1 (Windows)
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: LOOP
 *   - READ 4-byte length L
 *   - READ L bytes UTF-8 into message
 *   - PARSE message as JSON
 *   - How (sub-block): # Respond to ping with pong.
 *   - IF message.type === "ping":
 *   - WRITE length-prefixed JSON {"type":"pong"} to stdout
 *   - CONTINUE
 *   - How (sub-block): # Resolve helper; if missing echo request or pong per product rule.
 *   - RESOLVE helper path from install_dir (helper.sh or helper.ps1/helper.exe)
 *   - IF no helper:
 *   - ECHO request or pong to stdout (per product rule)
 *   - CONTINUE
 *   - How (sub-block): # Invoke helper; read single JSON from stdout; write length-prefixed to stdout.
 *   - INVOKE helper with message JSON on stdin
 *   - READ helper stdout as single JSON object
 *   - WRITE length-prefixed response to stdout
 * 
 * === END IMPL-FULL-BLOCK: IMPL-NATIVE_HOST_WRAPPER ===
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
 * === IMPL-FULL-BLOCK: IMPL-FILE_STORAGE_TYPED_PATH ===
 * [IMPL-FILE_STORAGE_TYPED_PATH] [ARCH-FILE_BOOKMARK_PROVIDER] [REQ-FILE_BOOKMARK_STORAGE] — User-typed path for file storage; Options persist path; native host read/write; initBookmarkProvider path vs picker. Contract: path input and storage; persisted path and file I/O via native host.
 * 
 * ## RESOLVE_FILE_PATH
 * 
 * - [IMPL-FILE_STORAGE_TYPED_PATH] [ARCH-FILE_BOOKMARK_PROVIDER] [REQ-FILE_BOOKMARK_STORAGE] How: Implements resolveFilePath(path) behavior for IMPL-FILE_STORAGE_TYPED_PATH.
 * - Contract:
 *   - INPUT: path string (user-typed, default ~/.hoverboard); read/write requests with path
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: persisted path in hoverboard_file_storage_path; file contents read/written via native host
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: hoverboard_file_storage_path (storage); path -> if dir then path/hoverboard-bookmarks.json else path as file
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: RESOLVE_FILE_PATH
 *   - path = expand_tilde(path)  // IMPL-FILE_STORAGE_HELPER_PATH_NORMALIZE
 *   - IF path ends with .json: RETURN path AS file
 *   - ELSE: RETURN path + "/hoverboard-bookmarks.json"
 *   - How (sub-block): Send native message to helper for read/write; return result.
 * 
 * ## READ_BOOKMARKS_FILE
 * 
 * - [IMPL-FILE_STORAGE_TYPED_PATH] [ARCH-FILE_BOOKMARK_PROVIDER] [REQ-FILE_BOOKMARK_STORAGE] How: Implements readBookmarksFile(path), writeBookmarksFile(path, data) behavior for IMPL-FILE_STORAGE_TYPED_PATH.
 * - Contract:
 *   - INPUT: path string (user-typed, default ~/.hoverboard); read/write requests with path
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: persisted path in hoverboard_file_storage_path; file contents read/written via native host
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: hoverboard_file_storage_path (storage); path -> if dir then path/hoverboard-bookmarks.json else path as file
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: READ_BOOKMARKS_FILE
 *   - path = resolveFilePath(path)
 *   - SEND native message (type, path) to helper; helper reads/writes file; RETURN result
 *   - How (sub-block): Prefer path adapter when path set; else picker adapter.
 * 
 * ## INIT_BOOKMARK_PROVIDER
 * 
 * - [IMPL-FILE_STORAGE_TYPED_PATH] [ARCH-FILE_BOOKMARK_PROVIDER] [REQ-FILE_BOOKMARK_STORAGE] How: Implements initBookmarkProvider() behavior for IMPL-FILE_STORAGE_TYPED_PATH.
 * - Contract:
 *   - INPUT: path string (user-typed, default ~/.hoverboard); read/write requests with path
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: persisted path in hoverboard_file_storage_path; file contents read/written via native host
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: hoverboard_file_storage_path (storage); path -> if dir then path/hoverboard-bookmarks.json else path as file
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: INIT_BOOKMARK_PROVIDER
 *   - IF path set in storage: USE NativeHostFileBookmarkAdapter(path)
 *   - ELSE IF picker configured: USE MessageFileBookmarkAdapter
 * 
 * === END IMPL-FULL-BLOCK: IMPL-FILE_STORAGE_TYPED_PATH ===
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
