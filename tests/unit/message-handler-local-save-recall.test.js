/**
 * === IMPL-FULL-BLOCK: IMPL-LOCAL_BOOKMARK_SERVICE ===
 * [IMPL-LOCAL_BOOKMARK_SERVICE] [ARCH-LOCAL_STORAGE_PROVIDER] [REQ-STORAGE_MODE_DEFAULT] [REQ-PER_BOOKMARK_STORAGE_BACKEND] — chrome.storage.local bookmark provider (one of five BookmarkRouter peers); same contract as Pinboard; keyed by URL. ARCH-STORAGE is settings/portability only — not this bookmark backend. Contract: url/bookmark/tag inputs and provider-shaped outputs; storage key and shape.
 *
 * ## GET_BOOKMARK_FOR_URL
 *
 * - [IMPL-LOCAL_BOOKMARK_SERVICE] [ARCH-LOCAL_STORAGE_PROVIDER] [REQ-STORAGE_MODE_DEFAULT] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Implements getBookmarkForUrl(url) behavior for IMPL-LOCAL_BOOKMARK_SERVICE.
 * - Contract:
 *   - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark object or list of bookmarks or success/error; shape matches provider contract | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: storage key = hoverboard_local_bookmarks; value = object keyed by normalized URL -> bookmark
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: GET_BOOKMARK_FOR_URL
 *   - bookmarks = LOAD bookmarks
 *   - urlNorm = normalize(url)
 *   - RETURN bookmarks[urlNorm] or null
 *   - How (sub-block): Merge data into bookmark shape and persist to storage.
 *
 * ## SAVE_BOOKMARK
 *
 * - [IMPL-LOCAL_BOOKMARK_SERVICE] [ARCH-LOCAL_STORAGE_PROVIDER] [REQ-STORAGE_MODE_DEFAULT] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Implements saveBookmark(data) behavior for IMPL-LOCAL_BOOKMARK_SERVICE.
 * - Contract:
 *   - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark object or list of bookmarks or success/error; shape matches provider contract | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: storage key = hoverboard_local_bookmarks; value = object keyed by normalized URL -> bookmark
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: SAVE_BOOKMARK
 *   - bookmarks = LOAD bookmarks
 *   - urlNorm = normalize(data.url)
 *   - bookmarks[urlNorm] = merge(data into bookmark shape with url, description, extended, tags, time, shared, toread, hash)
 *   - PERSIST bookmarks to storage under key
 *   - RETURN { success: true }
 *   - How (sub-block): Remove by normalized URL and persist.
 *
 * ## DELETE_BOOKMARK
 *
 * - [IMPL-LOCAL_BOOKMARK_SERVICE] [ARCH-LOCAL_STORAGE_PROVIDER] [REQ-STORAGE_MODE_DEFAULT] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Implements deleteBookmark(url) behavior for IMPL-LOCAL_BOOKMARK_SERVICE.
 * - Contract:
 *   - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark object or list of bookmarks or success/error; shape matches provider contract | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: storage key = hoverboard_local_bookmarks; value = object keyed by normalized URL -> bookmark
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: DELETE_BOOKMARK
 *   - bookmarks = LOAD bookmarks
 *   - REMOVE bookmarks[normalize(url)]
 *   - PERSIST bookmarks to storage
 *   - RETURN { success: true }
 *   - How (sub-block): Update tags on bookmark and persist.
 *
 * ## SAVE_TAG
 *
 * - [IMPL-LOCAL_BOOKMARK_SERVICE] [ARCH-LOCAL_STORAGE_PROVIDER] [REQ-STORAGE_MODE_DEFAULT] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Implements saveTag(data), deleteTag(data) behavior for IMPL-LOCAL_BOOKMARK_SERVICE.
 * - Contract:
 *   - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark object or list of bookmarks or success/error; shape matches provider contract | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: storage key = hoverboard_local_bookmarks; value = object keyed by normalized URL -> bookmark
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: SAVE_TAG
 *   - bookmark = getBookmarkForUrl(data.url)
 *   - update tags on bookmark
 *   - saveBookmark(bookmark) or equivalent
 *   - RETURN { success: true }
 *   - How (sub-block): Sort by time descending and return first count.
 *
 * ## GET_RECENT_BOOKMARKS
 *
 * - [IMPL-LOCAL_BOOKMARK_SERVICE] [ARCH-LOCAL_STORAGE_PROVIDER] [REQ-STORAGE_MODE_DEFAULT] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Implements getRecentBookmarks(count) behavior for IMPL-LOCAL_BOOKMARK_SERVICE.
 * - Contract:
 *   - INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark object or list of bookmarks or success/error; shape matches provider contract | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: storage key = hoverboard_local_bookmarks; value = object keyed by normalized URL -> bookmark
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: GET_RECENT_BOOKMARKS
 *   - bookmarks = LOAD bookmarks
 *   - list = values(bookmarks)
 *   - SORT list BY time DESCENDING
 *   - RETURN list[0..count-1]
 *
 * ## ROUTER_STORAGE_LOCAL_PROVIDER
 *
 * - [IMPL-LOCAL_BOOKMARK_SERVICE] [IMPL-BOOKMARK_ROUTER] [IMPL-STORAGE_INDEX] [ARCH-LOCAL_STORAGE_PROVIDER] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-PER_BOOKMARK_STORAGE_BACKEND] [REQ-RELIABILITY] How: Supplies the local provider operation used by BookmarkRouter and persists the selected URL mapping through StorageIndex.
 * - Contract:
 *   - INPUT: bookmark data, preferred backend, local provider, storage index
 *   - PRE: local provider storage and router index are initialized
 *   - OUTPUT: provider save result and updated backend mapping
 *   - POST:
 *     - success => local storage contains the normalized bookmark and the index identifies local
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: local bookmark map and storage-index backend mapping
 *   - DATA_TRANSITION: local bookmark map and index update only after a successful provider save
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: ROUTER_STORAGE_LOCAL_PROVIDER
 *   - Normalize bookmark URL and time fields
 *   - AWAIT local provider save
 *   - IF save succeeds: set the URL backend in StorageIndex
 *   - RETURN provider result
 *
 * === END IMPL-FULL-BLOCK: IMPL-LOCAL_BOOKMARK_SERVICE ===
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
import { MessageHandler } from '../../src/core/message-handler.js'
import { LocalBookmarkService } from '../../src/features/storage/local-bookmark-service.js'

let stored

beforeEach(() => {
  stored = {}
  global.chrome.storage.local.get.mockImplementation(async (keys) => {
    const key = typeof keys === 'object' && !Array.isArray(keys) ? Object.keys(keys)[0] : (Array.isArray(keys) ? keys[0] : keys)
    if (key === 'hoverboard_local_bookmarks') {
      return { hoverboard_local_bookmarks: { ...stored } }
    }
    return {}
  })
  global.chrome.storage.local.set.mockImplementation((obj) => {
    if (obj.hoverboard_local_bookmarks !== undefined) {
      stored = typeof obj.hoverboard_local_bookmarks === 'object' && !Array.isArray(obj.hoverboard_local_bookmarks)
        ? { ...obj.hoverboard_local_bookmarks }
        : {}
    }
    return Promise.resolve()
  })
  global.chrome.storage.sync.get.mockResolvedValue({
    hoverboard_auth_token: '',
    hoverboard_settings: {},
    hoverboard_inhibit_urls: ''
  })
  global.chrome.tabs.query.mockResolvedValue([])
})

describe('MessageHandler + LocalBookmarkService save then getCurrentBookmark [IMPL-LOCAL_BOOKMARK_SERVICE]', () => {
  test('saveBookmark via processMessage then getCurrentBookmark returns saved bookmark (local storage path)', async () => {
    const localService = new LocalBookmarkService(null)
    const handler = new MessageHandler(localService)

    const saveResult = await handler.processMessage(
      {
        type: 'saveBookmark',
        data: {
          url: 'https://example.com/saved',
          description: 'Saved',
          tags: 'x y',
          shared: 'yes',
          toread: 'no'
        }
      },
      {}
    )
    expect(saveResult.error).toBeUndefined()
    expect(saveResult.success).toBe(true)

    const getResult = await handler.processMessage(
      { type: 'getCurrentBookmark', data: { url: 'https://example.com/saved' } },
      {}
    )
    expect(getResult.success).toBe(true)
    expect(getResult.data).toBeDefined()
    expect(getResult.data.url).toBe('https://example.com/saved')
    expect(getResult.data.description).toBe('Saved')
    expect(Array.isArray(getResult.data.tags)).toBe(true)
    expect(getResult.data.tags).toContain('x')
    expect(getResult.data.tags).toContain('y')
    expect(getResult.data.shared).toBe('yes')
    expect(getResult.data.toread).toBe('no')
  })

  test('getCurrentBookmark for different URL does not return bookmark saved under another URL', async () => {
    const localService = new LocalBookmarkService(null)
    const handler = new MessageHandler(localService)

    await handler.processMessage(
      {
        type: 'saveBookmark',
        data: {
          url: 'https://example.com/one',
          description: 'First',
          tags: [],
          shared: 'yes',
          toread: 'no'
        }
      },
      {}
    )

    const getResult = await handler.processMessage(
      { type: 'getCurrentBookmark', data: { url: 'https://example.com/other' } },
      {}
    )
    expect(getResult.success).toBe(true)
    expect(getResult.data.url).toBe('https://example.com/other')
    expect(getResult.data.description).toBe('')
    expect(getResult.data.tags).toEqual([])
  })
})
