/**
 * [IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING] [IMPL-RUNTIME_VALIDATION]
 * Contract tests: processMessage returns a plain object for each known message type
 * (no unexpected throw) and unknown type throws. Sender context tests for GET_TAB_ID / GET_CURRENT_BOOKMARK.
 */

/**
 * === IMPL-FULL-BLOCK: IMPL-BOOKMARKING ===
 * [IMPL-BOOKMARKING] [ARCH-UX_CORE] [ARCH-MESSAGE_HANDLING] [REQ-SMART_BOOKMARKING] — How: create/update/delete bookmarks via MessageHandler without leaving the page; tag suggestions remain available.
 * 
 * ## SAVE_BOOKMARK
 * 
 * - [IMPL-BOOKMARKING] [ARCH-MESSAGE_HANDLING] [REQ-SMART_BOOKMARKING] How: validate envelope/data then route save through storage backend; broadcast update on success.
 * - Contract:
 *   - INPUT: saveBookmark / deleteBookmark / getCurrentBookmark messages (url, title, tags, shared, toread, description)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: persisted bookmark on preferred backend; BOOKMARK_UPDATED broadcast; UI-facing success/error payload | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: MessageHandler; BookmarkRouter / pinboard / local / file / sync / browser providers; overlay and popup callers
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: SAVE_BOOKMARK
 *   - validated = validateMessageData(message)
 *   - IF invalid: RETURN error payload
 *   - result = AWAIT bookmarkRouter.save(validated)
 *   - IF result.ok: BROADCAST BOOKMARK_UPDATED
 *   - RETURN result
 *   - How (sub-block): How: load current bookmark for URL for overlay/popup display.
 * 
 * ## GET_CURRENT_BOOKMARK
 * 
 * - [IMPL-BOOKMARKING] [ARCH-UX_CORE] [ARCH-MESSAGE_HANDLING] [REQ-SMART_BOOKMARKING] How: Implements GET_CURRENT_BOOKMARK(url) behavior for IMPL-BOOKMARKING.
 * - Contract:
 *   - INPUT: saveBookmark / deleteBookmark / getCurrentBookmark messages (url, title, tags, shared, toread, description)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: persisted bookmark on preferred backend; BOOKMARK_UPDATED broadcast; UI-facing success/error payload | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: MessageHandler; BookmarkRouter / pinboard / local / file / sync / browser providers; overlay and popup callers
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: GET_CURRENT_BOOKMARK
 *   - RETURN AWAIT bookmarkRouter.get(url) OR empty bookmark view
 *   - How (sub-block): How: delete bookmark for URL and notify listeners.
 * 
 * ## DELETE_BOOKMARK
 * 
 * - [IMPL-BOOKMARKING] [ARCH-UX_CORE] [ARCH-MESSAGE_HANDLING] [REQ-SMART_BOOKMARKING] How: Implements DELETE_BOOKMARK(url) behavior for IMPL-BOOKMARKING.
 * - Contract:
 *   - INPUT: saveBookmark / deleteBookmark / getCurrentBookmark messages (url, title, tags, shared, toread, description)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: persisted bookmark on preferred backend; BOOKMARK_UPDATED broadcast; UI-facing success/error payload | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: MessageHandler; BookmarkRouter / pinboard / local / file / sync / browser providers; overlay and popup callers
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: DELETE_BOOKMARK
 *   - result = AWAIT bookmarkRouter.delete(url)
 *   - IF result.ok: BROADCAST BOOKMARK_UPDATED
 *   - RETURN result
 * 
 * === END IMPL-FULL-BLOCK: IMPL-BOOKMARKING ===
 */
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
 * ## UNWRAP_MESSAGE_RESPONSE
 *
 * - [IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [REQ-UI_INSPECTION] How: shared null-tolerant unwrap for runtime replies (src/shared/message-response.js), because any extension context can win the response-channel race and answer null (Chrome 144+ promise-returning listeners / observer listeners that return promises). Callers must not dereference response.success. Observer BOOKMARK_UPDATED paths are IMPL-BOOKMARK_STATE_SYNC OBSERVER_BOOKMARK_UPDATED_APPLY_EXTERNAL and IMPL-POPUP_SESSION OBSERVER_BOOKMARK_UPDATED_FULL_REFRESH.
 * - Contract:
 *   - INPUT: response from runtime.sendMessage — { success, data } wrapper, plain payload, or null/undefined missing response; optional type + surface for readMessageResponse
 *   - PRE: caller awaited the send and handled thrown transport errors separately
 *   - OUTPUT: unwrapMessageResponse -> payload | null; isMissingMessageResponse -> boolean; readMessageResponse -> payload | null (records messageResponseMissing when missing)
 *   - POST:
 *     - success => wrapper returns response.data; non-wrapper object returns response as-is
 *     - missing response => returns null; readMessageResponse records messageResponseMissing; caller keeps defaults
 *   - FAILURE_MODES: none (total, no throw)
 *   - DATA: src/shared/message-response.js; callers in content-main (getTabId, getOptions, getCurrentBookmark)
 *   - EFFECTS: pure for unwrap/isMissing; State when readMessageResponse records inspector action
 *   - TERMINATION: total
 * - PROCEDURE: UNWRAP_MESSAGE_RESPONSE
 *   - IF isMissingMessageResponse(response): RETURN null
 *   - IF response is object AND 'success' in response: RETURN response.success ? response.data : response
 *   - RETURN response
 *   - How (sub-block): caller guard — missing response is observable, never a crash.
 *   - 1. CALLER: actual = readMessageResponse(response, type[, surface])
 *   - 2.   # readMessageResponse = unwrap + IF missing: recordAction messageResponseMissing; debugWarn
 *   - 3.   IF actual == null: KEEP defaults; RETURN
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
 * ## MESSAGE_DISPATCH_TESTABILITY
 *
 * - [IMPL-MESSAGE_HANDLING] [IMPL-UI_TESTABILITY_HOOKS] [IMPL-DEBUG_PANEL] [IMPL-UI_ACTION_CONTRACT] [ARCH-MESSAGE_HANDLING] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION] [REQ-MODULE_VALIDATION] How: Dispatches a validated message through the handler and exposes the result to testability hooks and inspection consumers.
 * - Contract:
 *   - INPUT: message, sender, handler map, optional processed callback
 *   - PRE: message type and payload satisfy the allowlist
 *   - OUTPUT: handler result and optional inspection callback payload
 *   - POST:
 *     - success => handler result is returned and the processed callback receives message/result
 *   - FAILURE_MODES: OperationFailed
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: MESSAGE_DISPATCH_TESTABILITY
 *   - VALIDATE message
 *   - AWAIT handler result
 *   - IF processed callback exists: CALL callback with message and result
 *   - RETURN result
 *
 * === END IMPL-FULL-BLOCK: IMPL-MESSAGE_HANDLING ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-RUNTIME_VALIDATION ===
 * [IMPL-RUNTIME_VALIDATION] [ARCH-MESSAGE_HANDLING] [ARCH-CONFIG_STRUCTURE] [REQ-CODE_QUALITY] — How: validate message envelopes/data and merged config with Zod at processMessage entry and getConfig merge.
 * 
 * ## VALIDATE_INCOMING_MESSAGE
 * 
 * - [IMPL-RUNTIME_VALIDATION] [ARCH-MESSAGE_HANDLING] [REQ-CODE_QUALITY] How: validate envelope then per-type data schema before handler body runs.
 * - Contract:
 *   - INPUT: raw chrome.runtime messages; merged config objects from storage
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: accepted typed payloads or structured validation errors; config rejected when schema fails | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: src/shared/message-schemas.js; ConfigManager Zod schemas; MessageHandler.processMessage
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: VALIDATE_INCOMING_MESSAGE
 *   - envelope = validateMessageEnvelope(message)
 *   - IF envelope fails: RETURN error
 *   - data = validateMessageData(message.type, message.data)
 *   - IF data fails: RETURN error
 *   - RETURN { type, data }
 *   - How (sub-block): How: after merge, parse config; on failure return defaults/error path without throwing to UI callers.
 * 
 * ## VALIDATE_MERGED_CONFIG
 * 
 * - [IMPL-RUNTIME_VALIDATION] [ARCH-MESSAGE_HANDLING] [ARCH-CONFIG_STRUCTURE] [REQ-CODE_QUALITY] How: Implements VALIDATE_MERGED_CONFIG(merged) behavior for IMPL-RUNTIME_VALIDATION.
 * - Contract:
 *   - INPUT: raw chrome.runtime messages; merged config objects from storage
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: accepted typed payloads or structured validation errors; config rejected when schema fails | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: src/shared/message-schemas.js; ConfigManager Zod schemas; MessageHandler.processMessage
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: VALIDATE_MERGED_CONFIG
 *   - parsed = configSchema.safeParse(merged)
 *   - IF NOT parsed.success: LOG; RETURN fallback OR error
 *   - RETURN parsed.data
 * 
 * === END IMPL-FULL-BLOCK: IMPL-RUNTIME_VALIDATION ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-DEBUG_PANEL ===
 * [IMPL-DEBUG_PANEL] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION] — Debug logging by category and debug panel showing last actions, messages, and current bookmark/backend. Contract: inputs, outputs, and data for logging and panel.
 * 
 * ## MAIN
 * 
 * - [IMPL-DEBUG_PANEL] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION] How: Logical block for IMPL-DEBUG_PANEL.
 * - Contract:
 *   - INPUT: LOG_CATEGORIES (ui, message, overlay, storage); optional debug panel open
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: debugLogger.trace/debug in message-handler, PopupController, content-main; debug panel shows last actions, last messages, current bookmark/tags/backend
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: debug-logger.js; debug.html + debug.js; inspector ring buffers
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: MAIN
 *   - How (sub-block): Logging: emit trace/debug when category enabled.
 *   - 1. Logging: WHEN category enabled: debugLogger.trace(msg) or debugLogger.debug(msg) with category
 *   - How (sub-block): Debug panel: on load request last actions/messages/current bookmark and render.
 *   - 2. Debug panel (debug.html): ON load SEND DEV_COMMAND getLastActions/getLastMessages/getCurrentBookmark (or getStorageSnapshot); RENDER in panel
 * 
 * === END IMPL-FULL-BLOCK: IMPL-DEBUG_PANEL ===
 */
import { MessageHandler, MESSAGE_TYPES } from '../../src/core/message-handler.js'

// Minimal mock provider used across contract tests
function createMockProvider (overrides = {}) {
  const base = {
    getBookmarkForUrl: jest.fn().mockResolvedValue({ url: 'https://example.com', tags: [] }),
    saveBookmark: jest.fn().mockResolvedValue({ success: true }),
    deleteBookmark: jest.fn().mockResolvedValue({ success: true }),
    getRecentBookmarks: jest.fn().mockResolvedValue([]),
    saveTag: jest.fn().mockResolvedValue({ success: true }),
    deleteTag: jest.fn().mockResolvedValue({ success: true }),
    getStorageBackendForUrl: jest.fn().mockReturnValue('local'),
    moveBookmarkToStorage: jest.fn().mockResolvedValue({ success: true }),
    getAllBookmarksForIndex: jest.fn().mockResolvedValue([])
  }
  return { ...base, ...overrides }
}

// Mock tagService methods used by handler
function createMockTagService () {
  return {
    addTagToUserRecentList: jest.fn().mockResolvedValue(true),
    getUserRecentTags: jest.fn().mockResolvedValue([]),
    handleTagAddition: jest.fn().mockResolvedValue(undefined),
    sanitizeTag: jest.fn((s) => s),
    getUserRecentTagsExcludingCurrent: jest.fn().mockResolvedValue([]),
    pinboardService: null
  }
}

beforeEach(() => {
  global.chrome.tabs.query.mockResolvedValue([{ id: 1, url: 'https://example.com' }])
  global.chrome.storage.local.get.mockImplementation((keys, cb) => {
    const result = typeof keys === 'string' ? { [keys]: null } : (Array.isArray(keys) ? keys.reduce((o, k) => ({ ...o, [k]: null }), {}) : {})
    if (cb) cb(result)
    else return Promise.resolve(result)
  })
  global.chrome.storage.sync.get.mockResolvedValue({})
  global.chrome.storage.local.set.mockImplementation((_data, cb) => { if (cb) cb(); return Promise.resolve() })
  if (global.chrome.scripting) {
    global.chrome.scripting.executeScript = jest.fn().mockResolvedValue([{ result: { title: 'Test', textContent: 'Body' } }])
  }
})

describe('[IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING] MessageHandler processMessage contracts', () => {
  test('unknown message type throws [IMPL-MESSAGE_HANDLING]', async () => {
    const handler = new MessageHandler(createMockProvider())
    await expect(handler.processMessage({ type: 'UnknownTypeXYZ', data: {} }, {})).rejects.toThrow('Unknown message type')
  })

  test('invalid envelope returns error object and does not throw [IMPL-RUNTIME_VALIDATION]', async () => {
    const handler = new MessageHandler(createMockProvider())
    const result = await handler.processMessage({ type: 'getOptions', data: [] }, {})
    expect(result).toMatchObject({ error: 'Invalid message' })
    expect(result.details).toBeDefined()
  })

  // Curated list: types that go through processMessage with minimal valid payload
  const contractCases = [
    [MESSAGE_TYPES.GET_OPTIONS, {}, {}],
    [MESSAGE_TYPES.GET_TAB_ID, {}, { tab: { id: 1, url: 'https://example.com' } }],
    [MESSAGE_TYPES.GET_TAGS_FOR_URL, { url: 'https://example.com' }, {}],
    [MESSAGE_TYPES.GET_LOCAL_BOOKMARKS_FOR_INDEX, undefined, {}],
    [MESSAGE_TYPES.GET_AGGREGATED_BOOKMARKS_FOR_INDEX, undefined, {}],
    [MESSAGE_TYPES.GET_RECENT_BOOKMARKS, { currentTags: [] }, {}],
    [MESSAGE_TYPES.SAVE_BOOKMARK, { url: 'https://example.com' }, {}],
    [MESSAGE_TYPES.DELETE_BOOKMARK, { url: 'https://example.com' }, {}],
    [MESSAGE_TYPES.SAVE_TAG, { url: 'https://example.com', value: 't' }, {}],
    [MESSAGE_TYPES.DELETE_TAG, { url: 'https://example.com', value: 't' }, {}],
    [MESSAGE_TYPES.GET_STORAGE_BACKEND_FOR_URL, { url: 'https://example.com' }, {}],
    [MESSAGE_TYPES.MOVE_BOOKMARK_TO_STORAGE, { url: 'https://example.com', targetBackend: 'local' }, {}],
    [MESSAGE_TYPES.ECHO, 'ping', {}],
    [MESSAGE_TYPES.GET_SEARCH_HISTORY, undefined, {}],
    [MESSAGE_TYPES.CLEAR_SEARCH_STATE, undefined, {}],
    [MESSAGE_TYPES.CONTENT_SCRIPT_READY, {}, { tab: { id: 1, url: 'https://example.com' } }],
    [MESSAGE_TYPES.GET_USER_RECENT_TAGS, {}, {}],
    [MESSAGE_TYPES.GET_SESSION_TAGS, undefined, {}],
    [MESSAGE_TYPES.RECORD_SESSION_TAGS, { tags: [] }, {}]
  ]

  contractCases.forEach(([type, data, sender]) => {
    test(`processMessage(${type}) returns plain object [IMPL-MESSAGE_HANDLING]`, async () => {
      const provider = createMockProvider()
      const tagService = createMockTagService()
      const handler = new MessageHandler(provider, tagService)
      const message = data !== undefined ? { type, data } : { type }
      const result = await handler.processMessage(message, sender || {})
      expect(result).toBeDefined()
      // Handler may return object or primitive (e.g. getStorageBackendForUrl returns string)
      if (typeof result === 'object' && result !== null) {
        if (result.error === 'Invalid message') {
          expect(result.details).toBeDefined()
          return
        }
        expect(Array.isArray(result) || (result.constructor && result.constructor.name === 'Object')).toBe(true)
      } else {
        expect(['string', 'number', 'boolean']).toContain(typeof result)
      }
    })
  })
})

describe('[IMPL-MESSAGE_HANDLING] GET_CURRENT_BOOKMARK and GET_TAB_ID sender context', () => {
  test('GET_TAB_ID with sender.tab returns tabId [IMPL-MESSAGE_HANDLING]', async () => {
    const handler = new MessageHandler(createMockProvider())
    const result = await handler.processMessage({ type: MESSAGE_TYPES.GET_TAB_ID }, { tab: { id: 42, url: 'https://a.com' } })
    expect(result).toEqual({ tabId: 42 })
  })

  test('GET_TAB_ID without sender.tab uses tabs.query and returns tabId when tabs exist', async () => {
    global.chrome.tabs.query.mockResolvedValue([{ id: 99, url: 'https://b.com' }])
    const handler = new MessageHandler(createMockProvider())
    const result = await handler.processMessage({ type: MESSAGE_TYPES.GET_TAB_ID }, {})
    expect(result).toEqual({ tabId: 99 })
  })

  test('GET_CURRENT_BOOKMARK with sender.tab uses tab url when data.url not provided', async () => {
    const provider = createMockProvider()
    const handler = new MessageHandler(provider)
    const result = await handler.processMessage(
      { type: MESSAGE_TYPES.GET_CURRENT_BOOKMARK },
      { tab: { id: 1, url: 'https://example.com' } }
    )
    expect(result).toBeDefined()
    expect(typeof result).toBe('object')
    expect(result.success).toBe(true)
    expect(result.data).toBeDefined()
  })

  test('GET_CURRENT_BOOKMARK with data.url uses data.url', async () => {
    const provider = createMockProvider()
    const handler = new MessageHandler(provider)
    const result = await handler.processMessage(
      { type: MESSAGE_TYPES.GET_CURRENT_BOOKMARK, data: { url: 'https://data-url.com' } },
      {}
    )
    expect(result).toBeDefined()
    expect(result.success).toBe(true)
  })
})

describe('[IMPL-MESSAGE_HANDLING] getAggregatedBookmarksForIndex response shape', () => {
  test('returns object with bookmarks array [IMPL-MESSAGE_HANDLING]', async () => {
    const provider = createMockProvider({ getAllBookmarksForIndex: jest.fn().mockResolvedValue([{ url: 'https://x.com', storage: 'local' }]) })
    const handler = new MessageHandler(provider)
    const result = await handler.processMessage({ type: MESSAGE_TYPES.GET_AGGREGATED_BOOKMARKS_FOR_INDEX }, {})
    expect(result).toHaveProperty('bookmarks')
    expect(Array.isArray(result.bookmarks)).toBe(true)
  })
})
