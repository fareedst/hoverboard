/**
 * [IMPL-RUNTIME_VALIDATION] processMessage validation: invalid saveBookmark data returns error
 * and does not call bookmarkProvider.saveBookmark (catches "Invalid message data for type saveBookmark").
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
import { MessageHandler } from '../../src/core/message-handler.js'

global.chrome = {
  storage: {
    local: { get: jest.fn(), set: jest.fn() },
    sync: { get: jest.fn(), set: jest.fn() }
  },
  tabs: { sendMessage: jest.fn(), query: jest.fn() },
  runtime: { sendMessage: jest.fn() }
}

describe('[IMPL-RUNTIME_VALIDATION] processMessage saveBookmark validation', () => {
  test('accepts local-storage save payload with shared/toread yes/no and calls saveBookmark [IMPL-RUNTIME_VALIDATION]', async () => {
    const saveBookmark = jest.fn().mockResolvedValue({ success: true })
    const mockProvider = {
      getBookmarkForUrl: jest.fn().mockResolvedValue({ tags: [] }),
      saveBookmark,
      deleteBookmark: jest.fn(),
      getRecentBookmarks: jest.fn(),
      saveTag: jest.fn(),
      deleteTag: jest.fn()
    }
    const handler = new MessageHandler(mockProvider)
    const result = await handler.processMessage(
      { type: 'saveBookmark', data: { url: 'https://example.com', shared: 'yes', toread: 'no', description: 'Test' } },
      {}
    )
    expect(result).not.toMatchObject({ error: 'Invalid message' })
    expect(saveBookmark).toHaveBeenCalledWith(expect.objectContaining({ url: 'https://example.com', shared: 'yes', toread: 'no' }))
  })

  test('returns error and does not call saveBookmark when data is missing', async () => {
    const saveBookmark = jest.fn()
    const mockProvider = {
      getBookmarkForUrl: jest.fn(),
      saveBookmark,
      deleteBookmark: jest.fn(),
      getRecentBookmarks: jest.fn(),
      saveTag: jest.fn(),
      deleteTag: jest.fn()
    }
    const handler = new MessageHandler(mockProvider)
    const result = await handler.processMessage({ type: 'saveBookmark' }, {})
    expect(result).toMatchObject({ error: 'Invalid message' })
    expect(result.details).toBeDefined()
    expect(saveBookmark).not.toHaveBeenCalled()
  })
})

describe('[IMPL-RUNTIME_VALIDATION] processMessage invalid envelope', () => {
  test('returns error and does not dispatch when envelope data is not a plain object', async () => {
    const getBookmarkForUrl = jest.fn()
    const mockProvider = {
      getBookmarkForUrl,
      saveBookmark: jest.fn(),
      deleteBookmark: jest.fn(),
      getRecentBookmarks: jest.fn(),
      saveTag: jest.fn(),
      deleteTag: jest.fn()
    }
    const handler = new MessageHandler(mockProvider)
    const result = await handler.processMessage({ type: 'getCurrentBookmark', data: [] }, {})
    expect(result).toMatchObject({ error: 'Invalid message' })
    expect(result.details).toBeDefined()
    expect(getBookmarkForUrl).not.toHaveBeenCalled()
  })
})

describe('[IMPL-RUNTIME_VALIDATION] processMessage getTagsForUrl validation', () => {
  test('returns error and does not call getBookmarkForUrl when data missing url', async () => {
    const getBookmarkForUrl = jest.fn()
    const mockProvider = {
      getBookmarkForUrl,
      saveBookmark: jest.fn(),
      deleteBookmark: jest.fn(),
      getRecentBookmarks: jest.fn(),
      saveTag: jest.fn(),
      deleteTag: jest.fn()
    }
    const handler = new MessageHandler(mockProvider)
    const result = await handler.processMessage({ type: 'getTagsForUrl', data: {} }, {})
    expect(result).toMatchObject({ error: 'Invalid message' })
    expect(result.details).toBeDefined()
    expect(getBookmarkForUrl).not.toHaveBeenCalled()
  })
  test('returns error when data has empty url', async () => {
    const getBookmarkForUrl = jest.fn()
    const mockProvider = {
      getBookmarkForUrl,
      saveBookmark: jest.fn(),
      deleteBookmark: jest.fn(),
      getRecentBookmarks: jest.fn(),
      saveTag: jest.fn(),
      deleteTag: jest.fn()
    }
    const handler = new MessageHandler(mockProvider)
    const result = await handler.processMessage({ type: 'getTagsForUrl', data: { url: '' } }, {})
    expect(result).toMatchObject({ error: 'Invalid message' })
    expect(getBookmarkForUrl).not.toHaveBeenCalled()
  })
  test('accepts valid getTagsForUrl and calls getBookmarkForUrl [IMPL-RUNTIME_VALIDATION]', async () => {
    const getBookmarkForUrl = jest.fn().mockResolvedValue({ url: 'https://example.com', tags: [] })
    const mockProvider = {
      getBookmarkForUrl,
      saveBookmark: jest.fn(),
      deleteBookmark: jest.fn(),
      getRecentBookmarks: jest.fn(),
      saveTag: jest.fn(),
      deleteTag: jest.fn()
    }
    const handler = new MessageHandler(mockProvider)
    const result = await handler.processMessage({ type: 'getTagsForUrl', data: { url: 'https://example.com' } }, {})
    expect(result).not.toMatchObject({ error: 'Invalid message' })
    expect(getBookmarkForUrl).toHaveBeenCalledWith('https://example.com', '')
    expect(result).toEqual({ tags: [] })
  })
})

describe('[IMPL-RUNTIME_VALIDATION] processMessage deleteBookmark validation', () => {
  test('returns error and does not call deleteBookmark when data missing url', async () => {
    const deleteBookmark = jest.fn()
    const mockProvider = {
      getBookmarkForUrl: jest.fn(),
      saveBookmark: jest.fn(),
      deleteBookmark,
      getRecentBookmarks: jest.fn(),
      saveTag: jest.fn(),
      deleteTag: jest.fn()
    }
    const handler = new MessageHandler(mockProvider)
    const result = await handler.processMessage({ type: 'deleteBookmark', data: {} }, {})
    expect(result).toMatchObject({ error: 'Invalid message' })
    expect(result.details).toBeDefined()
    expect(deleteBookmark).not.toHaveBeenCalled()
  })
  test('accepts valid deleteBookmark and calls deleteBookmark [IMPL-RUNTIME_VALIDATION]', async () => {
    const deleteBookmark = jest.fn().mockResolvedValue({ success: true })
    const mockProvider = {
      getBookmarkForUrl: jest.fn(),
      saveBookmark: jest.fn(),
      deleteBookmark,
      getRecentBookmarks: jest.fn(),
      saveTag: jest.fn(),
      deleteTag: jest.fn()
    }
    const handler = new MessageHandler(mockProvider)
    const result = await handler.processMessage({ type: 'deleteBookmark', data: { url: 'https://example.com' } }, {})
    expect(result).not.toMatchObject({ error: 'Invalid message' })
    expect(deleteBookmark).toHaveBeenCalledWith({ url: 'https://example.com' })
  })

  test('accepts deleteBookmark with preferredBackend and passes data [REQ-LOCAL_BOOKMARKS_INDEX] [IMPL-RUNTIME_VALIDATION]', async () => {
    const deleteBookmark = jest.fn().mockResolvedValue({ success: true })
    const mockProvider = {
      getBookmarkForUrl: jest.fn(),
      saveBookmark: jest.fn(),
      deleteBookmark,
      getRecentBookmarks: jest.fn(),
      saveTag: jest.fn(),
      deleteTag: jest.fn()
    }
    const handler = new MessageHandler(mockProvider)
    const data = { url: 'https://example.com', preferredBackend: 'file' }
    const result = await handler.processMessage({ type: 'deleteBookmark', data }, {})
    expect(result).not.toMatchObject({ error: 'Invalid message' })
    expect(deleteBookmark).toHaveBeenCalledWith(data)
  })
})

describe('[IMPL-RUNTIME_VALIDATION] processMessage saveTag validation', () => {
  test('returns error and does not call saveTag when data missing value', async () => {
    const saveTag = jest.fn()
    const mockProvider = {
      getBookmarkForUrl: jest.fn(),
      saveBookmark: jest.fn(),
      deleteBookmark: jest.fn(),
      getRecentBookmarks: jest.fn(),
      saveTag,
      deleteTag: jest.fn()
    }
    const handler = new MessageHandler(mockProvider)
    const result = await handler.processMessage({ type: 'saveTag', data: { url: 'https://example.com' } }, {})
    expect(result).toMatchObject({ error: 'Invalid message' })
    expect(saveTag).not.toHaveBeenCalled()
  })
  test('returns error and does not call saveTag when value is empty', async () => {
    const saveTag = jest.fn()
    const mockProvider = {
      getBookmarkForUrl: jest.fn(),
      saveBookmark: jest.fn(),
      deleteBookmark: jest.fn(),
      getRecentBookmarks: jest.fn(),
      saveTag,
      deleteTag: jest.fn()
    }
    const handler = new MessageHandler(mockProvider)
    const result = await handler.processMessage({ type: 'saveTag', data: { url: 'https://example.com', value: '' } }, {})
    expect(result).toMatchObject({ error: 'Invalid message' })
    expect(saveTag).not.toHaveBeenCalled()
  })
  test('accepts valid saveTag and calls saveTag [IMPL-RUNTIME_VALIDATION]', async () => {
    const saveTag = jest.fn().mockResolvedValue({ success: true })
    const mockProvider = {
      getBookmarkForUrl: jest.fn(),
      saveBookmark: jest.fn(),
      deleteBookmark: jest.fn(),
      getRecentBookmarks: jest.fn(),
      saveTag,
      deleteTag: jest.fn()
    }
    const handler = new MessageHandler(mockProvider)
    const result = await handler.processMessage({ type: 'saveTag', data: { url: 'https://example.com', value: 'mytag' } }, {})
    expect(result).not.toMatchObject({ error: 'Invalid message' })
    expect(saveTag).toHaveBeenCalledWith({ url: 'https://example.com', value: 'mytag' })
  })
})

describe('[IMPL-RUNTIME_VALIDATION] processMessage moveBookmarkToStorage validation', () => {
  test('returns error and does not call moveBookmarkToStorage when data missing url', async () => {
    const moveBookmarkToStorage = jest.fn()
    const mockProvider = {
      getBookmarkForUrl: jest.fn(),
      saveBookmark: jest.fn(),
      deleteBookmark: jest.fn(),
      getRecentBookmarks: jest.fn(),
      saveTag: jest.fn(),
      deleteTag: jest.fn(),
      moveBookmarkToStorage
    }
    const handler = new MessageHandler(mockProvider)
    const result = await handler.processMessage({ type: 'moveBookmarkToStorage', data: { targetBackend: 'local' } }, {})
    expect(result).toMatchObject({ error: 'Invalid message' })
    expect(result.details).toBeDefined()
    expect(moveBookmarkToStorage).not.toHaveBeenCalled()
  })
  test('returns error and does not call moveBookmarkToStorage when data missing targetBackend', async () => {
    const moveBookmarkToStorage = jest.fn()
    const mockProvider = {
      getBookmarkForUrl: jest.fn(),
      saveBookmark: jest.fn(),
      deleteBookmark: jest.fn(),
      getRecentBookmarks: jest.fn(),
      saveTag: jest.fn(),
      deleteTag: jest.fn(),
      moveBookmarkToStorage
    }
    const handler = new MessageHandler(mockProvider)
    const result = await handler.processMessage({ type: 'moveBookmarkToStorage', data: { url: 'https://example.com' } }, {})
    expect(result).toMatchObject({ error: 'Invalid message' })
    expect(moveBookmarkToStorage).not.toHaveBeenCalled()
  })
  test('accepts valid moveBookmarkToStorage and calls moveBookmarkToStorage [IMPL-RUNTIME_VALIDATION]', async () => {
    const moveBookmarkToStorage = jest.fn().mockResolvedValue({ success: true })
    const mockProvider = {
      getBookmarkForUrl: jest.fn(),
      saveBookmark: jest.fn(),
      deleteBookmark: jest.fn(),
      getRecentBookmarks: jest.fn(),
      saveTag: jest.fn(),
      deleteTag: jest.fn(),
      moveBookmarkToStorage
    }
    const handler = new MessageHandler(mockProvider)
    const result = await handler.processMessage(
      { type: 'moveBookmarkToStorage', data: { url: 'https://example.com', targetBackend: 'local' } },
      {}
    )
    expect(result).not.toMatchObject({ error: 'Invalid message' })
    expect(moveBookmarkToStorage).toHaveBeenCalledWith('https://example.com', 'local')
  })
})

describe('[IMPL-RUNTIME_VALIDATION] processMessage deleteTag validation', () => {
  test('returns error and does not call deleteTag when data missing url', async () => {
    const deleteTag = jest.fn()
    const mockProvider = {
      getBookmarkForUrl: jest.fn(),
      saveBookmark: jest.fn(),
      deleteBookmark: jest.fn(),
      getRecentBookmarks: jest.fn(),
      saveTag: jest.fn(),
      deleteTag
    }
    const handler = new MessageHandler(mockProvider)
    const result = await handler.processMessage({ type: 'deleteTag', data: { value: 'mytag' } }, {})
    expect(result).toMatchObject({ error: 'Invalid message' })
    expect(deleteTag).not.toHaveBeenCalled()
  })
  test('returns error and does not call deleteTag when data missing value', async () => {
    const deleteTag = jest.fn()
    const mockProvider = {
      getBookmarkForUrl: jest.fn(),
      saveBookmark: jest.fn(),
      deleteBookmark: jest.fn(),
      getRecentBookmarks: jest.fn(),
      saveTag: jest.fn(),
      deleteTag
    }
    const handler = new MessageHandler(mockProvider)
    const result = await handler.processMessage({ type: 'deleteTag', data: { url: 'https://example.com' } }, {})
    expect(result).toMatchObject({ error: 'Invalid message' })
    expect(deleteTag).not.toHaveBeenCalled()
  })
  test('accepts valid deleteTag and calls deleteTag [IMPL-RUNTIME_VALIDATION]', async () => {
    const deleteTag = jest.fn().mockResolvedValue({ success: true })
    const mockProvider = {
      getBookmarkForUrl: jest.fn(),
      saveBookmark: jest.fn(),
      deleteBookmark: jest.fn(),
      getRecentBookmarks: jest.fn(),
      saveTag: jest.fn(),
      deleteTag
    }
    const handler = new MessageHandler(mockProvider)
    const result = await handler.processMessage({ type: 'deleteTag', data: { url: 'https://example.com', value: 'mytag' } }, {})
    expect(result).not.toMatchObject({ error: 'Invalid message' })
    expect(deleteTag).toHaveBeenCalledWith({ url: 'https://example.com', value: 'mytag' })
  })
})
