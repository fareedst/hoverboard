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
 * === IMPL-FULL-BLOCK: IMPL-TYPESCRIPT_MIGRATION ===
 * [IMPL-TYPESCRIPT_MIGRATION] [ARCH-LANGUAGE_SELECTION] [REQ-MAINTAINABILITY] — How: incremental type-check without full TS rewrite — tsconfig noEmit, // @ts-check on key JS, shared .d.ts. Status: Active tooling; not a Deferred Safari path. Expand when more files adopt @ts-check.
 * 
 * ## TYPECHECK_GATE
 * 
 * - [IMPL-TYPESCRIPT_MIGRATION] [ARCH-LANGUAGE_SELECTION] [REQ-MAINTAINABILITY] How: validate gate runs typecheck before build/push.
 * - Contract:
 *   - INPUT: npm run typecheck / validate; tsconfig.json; JSDoc and .d.ts for message/config shapes
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: tsc --noEmit pass/fail; contract errors caught at build time on checked files | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: tsconfig.json; src/shared/*.d.ts; @ts-check on config-manager, message-handler, message-schemas, message-client
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: TYPECHECK_GATE
 *   - RUN tsc --noEmit with allowJs
 *   - ON errors: FAIL validate
 *   - RETURN pass
 *   - How (sub-block): How: checked modules document contracts via JSDoc/.d.ts; Zod remains runtime source for messages.
 * 
 * ## MAINTAIN_CHECKED_SURFACE
 * 
 * - [IMPL-TYPESCRIPT_MIGRATION] [ARCH-LANGUAGE_SELECTION] [REQ-MAINTAINABILITY] How: Implements MAINTAIN_CHECKED_SURFACE behavior for IMPL-TYPESCRIPT_MIGRATION.
 * - Contract:
 *   - INPUT: npm run typecheck / validate; tsconfig.json; JSDoc and .d.ts for message/config shapes
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: tsc --noEmit pass/fail; contract errors caught at build time on checked files | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: tsconfig.json; src/shared/*.d.ts; @ts-check on config-manager, message-handler, message-schemas, message-client
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: State
 *   - TERMINATION: total
 * - PROCEDURE: MAINTAIN_CHECKED_SURFACE
 *   - KEEP // @ts-check on boundary modules
 *   - UPDATE .d.ts when message/config shapes change
 *   - RETURN
 * 
 * === END IMPL-FULL-BLOCK: IMPL-TYPESCRIPT_MIGRATION ===
 */
import {
  validateMessageEnvelope,
  validateMessageData
} from '../../src/shared/message-schemas.js'

describe('[IMPL-RUNTIME_VALIDATION] Message envelope validation', () => {
  test('accepts valid envelope with type and data', () => {
    const result = validateMessageEnvelope({ type: 'getCurrentBookmark', data: { url: 'https://example.com' } })
    expect(result.success).toBe(true)
    expect(result.data).toEqual({ type: 'getCurrentBookmark', data: { url: 'https://example.com' } })
  })

  test('accepts valid envelope with type only', () => {
    const result = validateMessageEnvelope({ type: 'getLocalBookmarksForIndex' })
    expect(result.success).toBe(true)
    expect(result.data.type).toBe('getLocalBookmarksForIndex')
    expect(result.data.data).toBeUndefined()
  })

  test('rejects missing type', () => {
    const result = validateMessageEnvelope({ data: {} })
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })

  test('rejects non-object message', () => {
    const result = validateMessageEnvelope(null)
    expect(result.success).toBe(false)
    const result2 = validateMessageEnvelope('string')
    expect(result2.success).toBe(false)
  })

  test('rejects envelope when data is not a plain object [IMPL-RUNTIME_VALIDATION]', () => {
    expect(validateMessageEnvelope({ type: 'getCurrentBookmark', data: [] }).success).toBe(false)
    expect(validateMessageEnvelope({ type: 'getCurrentBookmark', data: 'x' }).success).toBe(false)
  })
})

describe('[IMPL-RUNTIME_VALIDATION] getCurrentBookmark data', () => {
  test('accepts undefined or empty data', () => {
    expect(validateMessageData('getCurrentBookmark', undefined).success).toBe(true)
    expect(validateMessageData('getCurrentBookmark', {}).success).toBe(true)
  })
  test('accepts optional url string', () => {
    const result = validateMessageData('getCurrentBookmark', { url: 'https://a.com' })
    expect(result.success).toBe(true)
  })
  test('accepts overlay-style payload with url, title, tabId (passthrough) [IMPL-RUNTIME_VALIDATION]', () => {
    const result = validateMessageData('getCurrentBookmark', {
      url: 'https://example.com/page',
      title: 'Example',
      tabId: 42
    })
    expect(result.success).toBe(true)
    expect(result.data.title).toBe('Example')
    expect(result.data.tabId).toBe(42)
  })
})

describe('[IMPL-RUNTIME_VALIDATION] getTagsForUrl data', () => {
  test('accepts data with url', () => {
    const result = validateMessageData('getTagsForUrl', { url: 'https://example.com' })
    expect(result.success).toBe(true)
    expect(result.data.url).toBe('https://example.com')
  })
  test('rejects missing url', () => {
    const result = validateMessageData('getTagsForUrl', {})
    expect(result.success).toBe(false)
  })
  test('rejects empty url', () => {
    const result = validateMessageData('getTagsForUrl', { url: '' })
    expect(result.success).toBe(false)
  })
  test('rejects undefined data [IMPL-RUNTIME_VALIDATION]', () => {
    const result = validateMessageData('getTagsForUrl', undefined)
    expect(result.success).toBe(false)
  })
})

describe('[IMPL-RUNTIME_VALIDATION] saveBookmark data', () => {
  test('accepts url with optional tags and other fields', () => {
    const result = validateMessageData('saveBookmark', { url: 'https://x.com', tags: ['a', 'b'], description: 'd' })
    expect(result.success).toBe(true)
    expect(result.data.url).toBe('https://x.com')
  })
  test('accepts tags as string', () => {
    const result = validateMessageData('saveBookmark', { url: 'https://x.com', tags: 'a b c' })
    expect(result.success).toBe(true)
  })
  test('rejects missing url', () => {
    const result = validateMessageData('saveBookmark', { tags: ['a'] })
    expect(result.success).toBe(false)
  })
  test('rejects undefined data [IMPL-RUNTIME_VALIDATION]', () => {
    const result = validateMessageData('saveBookmark', undefined)
    expect(result.success).toBe(false)
  })
  test('accepts shared/toread as Pinboard-style strings yes/no when saving to local storage [IMPL-RUNTIME_VALIDATION]', () => {
    const result = validateMessageData('saveBookmark', { url: 'https://example.com', shared: 'yes', toread: 'no' })
    expect(result.success).toBe(true)
    expect(result.data.shared).toBe('yes')
    expect(result.data.toread).toBe('no')
  })
  test('rejects empty url', () => {
    const result = validateMessageData('saveBookmark', { url: '' })
    expect(result.success).toBe(false)
  })
  test('accepts extra keys via passthrough [IMPL-RUNTIME_VALIDATION]', () => {
    const result = validateMessageData('saveBookmark', {
      url: 'https://x.com',
      tags: ['a'],
      clientRequestId: 'req-1',
      source: 'overlay'
    })
    expect(result.success).toBe(true)
    expect(result.data.clientRequestId).toBe('req-1')
    expect(result.data.source).toBe('overlay')
  })
})

describe('[IMPL-RUNTIME_VALIDATION] deleteBookmark data', () => {
  test('accepts data with url', () => {
    const result = validateMessageData('deleteBookmark', { url: 'https://example.com' })
    expect(result.success).toBe(true)
  })
  test('rejects missing url', () => {
    const result = validateMessageData('deleteBookmark', {})
    expect(result.success).toBe(false)
  })
  // [REQ-LOCAL_BOOKMARKS_INDEX] [IMPL-RUNTIME_VALIDATION] Index Delete sends preferredBackend from Storage column
  test('accepts optional preferredBackend file|local|sync|pinboard', () => {
    for (const preferredBackend of ['file', 'local', 'sync', 'pinboard']) {
      const result = validateMessageData('deleteBookmark', { url: 'https://example.com', preferredBackend })
      expect(result.success).toBe(true)
    }
  })
  test('rejects invalid preferredBackend', () => {
    const result = validateMessageData('deleteBookmark', { url: 'https://example.com', preferredBackend: 'cloud' })
    expect(result.success).toBe(false)
  })
})

describe('[IMPL-RUNTIME_VALIDATION] saveTag data', () => {
  test('accepts url and value', () => {
    const result = validateMessageData('saveTag', { url: 'https://x.com', value: 'mytag' })
    expect(result.success).toBe(true)
  })
  test('rejects missing value', () => {
    const result = validateMessageData('saveTag', { url: 'https://x.com' })
    expect(result.success).toBe(false)
  })
  test('rejects empty value', () => {
    const result = validateMessageData('saveTag', { url: 'https://x.com', value: '' })
    expect(result.success).toBe(false)
  })
})

describe('[IMPL-RUNTIME_VALIDATION] deleteTag data', () => {
  test('accepts url and value', () => {
    const result = validateMessageData('deleteTag', { url: 'https://x.com', value: 'mytag' })
    expect(result.success).toBe(true)
  })
  test('rejects missing url', () => {
    const result = validateMessageData('deleteTag', { value: 't' })
    expect(result.success).toBe(false)
  })
  test('rejects missing value [IMPL-RUNTIME_VALIDATION]', () => {
    const result = validateMessageData('deleteTag', { url: 'https://x.com' })
    expect(result.success).toBe(false)
  })
})

describe('[IMPL-RUNTIME_VALIDATION] moveBookmarkToStorage data', () => {
  test('accepts url and targetBackend', () => {
    const result = validateMessageData('moveBookmarkToStorage', { url: 'https://example.com', targetBackend: 'local' })
    expect(result.success).toBe(true)
    expect(result.data).toEqual({ url: 'https://example.com', targetBackend: 'local' })
  })
  test('rejects missing url', () => {
    const result = validateMessageData('moveBookmarkToStorage', { targetBackend: 'local' })
    expect(result.success).toBe(false)
  })
  test('rejects missing targetBackend', () => {
    const result = validateMessageData('moveBookmarkToStorage', { url: 'https://example.com' })
    expect(result.success).toBe(false)
  })
  test('rejects empty targetBackend', () => {
    const result = validateMessageData('moveBookmarkToStorage', { url: 'https://example.com', targetBackend: '' })
    expect(result.success).toBe(false)
  })
  test('rejects undefined data [IMPL-RUNTIME_VALIDATION]', () => {
    const result = validateMessageData('moveBookmarkToStorage', undefined)
    expect(result.success).toBe(false)
  })
})

describe('[IMPL-RUNTIME_VALIDATION] Unknown type passes through', () => {
  test('returns success with original data when no schema for type', () => {
    const result = validateMessageData('unknownType', { anything: 123 })
    expect(result.success).toBe(true)
    expect(result.data).toEqual({ anything: 123 })
  })
})

describe('[IMPL-RUNTIME_VALIDATION] .strict() data schemas reject unknown keys', () => {
  test('getTagsForUrl rejects extra keys', () => {
    const result = validateMessageData('getTagsForUrl', {
      url: 'https://example.com',
      title: 'Extra'
    })
    expect(result.success).toBe(false)
  })
  test('deleteTag rejects extra keys', () => {
    const result = validateMessageData('deleteTag', {
      url: 'https://x.com',
      value: 't',
      pin: {}
    })
    expect(result.success).toBe(false)
  })
})
