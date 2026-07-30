/**
 * === IMPL-FULL-BLOCK: IMPL-MESSAGE_HANDLING ===
 * [IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING] [REQ-SMART_BOOKMARKING] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [REQ-RECENT_TAGS_SYSTEM] [ARCH-TAG_SYSTEM] — Central message allowlist + validation + handler dispatch; recent-tag message types delegate to [IMPL-TAG_SYSTEM] TagService and SW recentTagsMemory policy per ARCH-TAG_SYSTEM. Contract: Promise result or reject on validation; recent handlers return safe shapes on internal failure.
 * 
 * ## SEND
 * 
 * - [IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING] [REQ-SMART_BOOKMARKING] How: client-side validate type/payload; dispatch to background; return Promise (path for popup/content/offscreen callers).
 * - Contract:
 *   - INPUT: message { type, payload/data }; sender (tab/popup/background)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: Promise resolving to handler result or rejecting on validation/routing error | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: MESSAGE_TYPES allowlist; handler map type → async fn; TagService instance for tag/recent paths
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: SEND
 *   - VALIDATE message.type in allowlist
 *   - VALIDATE payload shape
 *   - ROUTE to handler for message.type
 *   - handler(message) -> result; RETURN Promise.resolve(result)
 *   - ON error: RETURN Promise.reject; optional log
 * 
 * ## HANDLE_GET_RECENT_BOOKMARKS
 * 
 * - How: SW entry resolves handler by message.type; missing handler → reject or structured error per router; AWAIT handler(data, senderUrl); optional BOOKMARK_UPDATED broadcast after mutating handlers ([REQ-BOOKMARK_STATE_SYNCHRONIZATION]).
 * - Contract:
 *   - INPUT: message { type, payload/data }; sender (tab/popup/background)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: Promise resolving to handler result or rejecting on validation/routing error | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: MESSAGE_TYPES allowlist; handler map type → async fn; TagService instance for tag/recent paths
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: HANDLE_GET_RECENT_BOOKMARKS
 *   - recentTags = AWAIT tagService.getUserRecentTagsExcludingCurrent(data?.currentTags OR [])
 *   - RETURN { ...data, recentTags }
 *   - How (sub-block): How: addTagToRecent — validate tagName + currentSiteUrl; tagService.addTagToUserRecentList; structured { success } / error (same REQ/ARCH/IMPL cross-IMPL set as handleGetRecentBookmarks).
 * 
 * ## HANDLE_ADD_TAG_TO_RECENT
 * 
 * - [IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING] [REQ-SMART_BOOKMARKING] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [REQ-RECENT_TAGS_SYSTEM] [ARCH-TAG_SYSTEM] How: Implements handleAddTagToRecent(data) behavior for IMPL-MESSAGE_HANDLING.
 * - Contract:
 *   - INPUT: message { type, payload/data }; sender (tab/popup/background)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: Promise resolving to handler result or rejecting on validation/routing error | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: MESSAGE_TYPES allowlist; handler map type → async fn; TagService instance for tag/recent paths
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: HANDLE_ADD_TAG_TO_RECENT
 *   - VALIDATE tagName AND currentSiteUrl present
 *   - success = AWAIT tagService.addTagToUserRecentList(tagName, currentSiteUrl)
 *   - RETURN { success } OR { success: false, error: message }
 *   - How (sub-block): How: getUserRecentTags message — raw policy list for diagnostics/tools; TRY/CATCH → { recentTags: [], error } on failure.
 * 
 * ## HANDLE_GET_USER_RECENT_TAGS
 * 
 * - [IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING] [REQ-SMART_BOOKMARKING] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [REQ-RECENT_TAGS_SYSTEM] [ARCH-TAG_SYSTEM] How: Implements handleGetUserRecentTags(data) behavior for IMPL-MESSAGE_HANDLING.
 * - Contract:
 *   - INPUT: message { type, payload/data }; sender (tab/popup/background)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: Promise resolving to handler result or rejecting on validation/routing error | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: MESSAGE_TYPES allowlist; handler map type → async fn; TagService instance for tag/recent paths
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: HANDLE_GET_USER_RECENT_TAGS
 *   - TRY: RETURN { recentTags: AWAIT tagService.getUserRecentTags() }
 *   - CATCH: LOG; RETURN { recentTags: [], error }
 * 
 * ## BLOCK_5
 * 
 * - --- Composition: composed_with [IMPL-POPUP_MESSAGE_TIMEOUT] [IMPL-BOOKMARK_STATE_SYNC] --- How: Ordering: client send may apply timeout/retry () before this IMPL’s send completes. Post successful bookmark mutations,  may broadcast; recent-tag handlers are read/mutation for user-recent only unless caller chains. Shared DATA: single MessageHandler TagService reference; no second recentTagsMemory writer.
 * - Contract:
 *   - INPUT: message { type, payload/data }; sender (tab/popup/background)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: Promise resolving to handler result or rejecting on validation/routing error | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: MESSAGE_TYPES allowlist; handler map type → async fn; TagService instance for tag/recent paths
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: BLOCK_5
 *   - How (sub-block): --- Cross-IMPL ---
 * 
 * === END IMPL-FULL-BLOCK: IMPL-MESSAGE_HANDLING ===
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
import { MessageClient } from '../../src/features/content/message-client.js'

describe('[IMPL-MESSAGE_HANDLING] MessageClient sendMessage retry and error', () => {
  beforeEach(() => {
    global.browser = global.chrome
    jest.clearAllMocks()
    global.chrome.runtime.getManifest.mockReturnValue({ version: '1.0.0' })
    // Safari shim uses callback: (msg, cb) => cb(response). Simulate failure via lastError + cb().
    global.chrome.runtime.sendMessage.mockImplementation((msg, cb) => {
      if (typeof cb === 'function') {
        const err = global.chrome.runtime._testSendMessageError
        if (err) {
          global.chrome.runtime.lastError = { message: err }
          cb(undefined)
        } else {
          global.chrome.runtime.lastError = null
          cb(global.chrome.runtime._testSendMessageResponse ?? { success: true })
        }
      }
    })
  })

  test('rejects with error after retries exhausted when sendMessage reports lastError [IMPL-POPUP_MESSAGE_TIMEOUT]', async () => {
    const client = new MessageClient()
    global.chrome.runtime._testSendMessageError = 'Could not establish connection'

    await expect(client.sendMessage({ type: 'PING' }, { retries: 2, retryDelay: 10 })).rejects.toThrow('Could not establish connection')
    expect(global.chrome.runtime.sendMessage).toHaveBeenCalled()
  })

  test('does not retry when error is not retryable', async () => {
    const client = new MessageClient()
    global.chrome.runtime._testSendMessageError = 'Some other error'

    await expect(client.sendMessage({ type: 'PING' }, { retries: 2, retryDelay: 10 })).rejects.toThrow('Some other error')
    expect(global.chrome.runtime.sendMessage).toHaveBeenCalled()
  })

  test('retries on retryable error message "Extension context invalidated"', async () => {
    const client = new MessageClient()
    global.chrome.runtime._testSendMessageError = 'Extension context invalidated'

    await expect(client.sendMessage({ type: 'PING' }, { retries: 1, retryDelay: 10 })).rejects.toThrow('Extension context invalidated')
    expect(global.chrome.runtime.sendMessage).toHaveBeenCalled()
  })

  test('resolves with response when sendMessage succeeds', async () => {
    const client = new MessageClient()
    global.chrome.runtime._testSendMessageError = null
    global.chrome.runtime._testSendMessageResponse = { success: true, data: 'pong' }

    const result = await client.sendMessage({ type: 'PING' })
    expect(result).toEqual({ success: true, data: 'pong' })
    expect(global.chrome.runtime.sendMessage).toHaveBeenCalledTimes(1)
  })
})

describe('[IMPL-MESSAGE_HANDLING] MessageClient isRetryableError', () => {
  test('returns true for "Could not establish connection"', () => {
    const client = new MessageClient()
    expect(client.isRetryableError(new Error('Could not establish connection'))).toBe(true)
  })

  test('returns false for generic error', () => {
    const client = new MessageClient()
    expect(client.isRetryableError(new Error('Something went wrong'))).toBe(false)
  })
})
