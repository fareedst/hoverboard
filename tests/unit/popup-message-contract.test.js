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
 * === END IMPL-FULL-BLOCK: IMPL-MESSAGE_HANDLING ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-UI_ACTION_CONTRACT ===
 * [IMPL-UI_ACTION_CONTRACT] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION] — Single module exporting message types and popup/overlay action IDs for tests and inspector. Contract: static exports; no input; tests/E2E import same IDs.
 * 
 * ## MAIN
 * 
 * - [IMPL-UI_ACTION_CONTRACT] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION] How: Logical block for IMPL-UI_ACTION_CONTRACT.
 * - Contract:
 *   - INPUT: none (static contract)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: exported constants MESSAGE_TYPES, POPUP_ACTION_IDS, POPUP_ACTION_TO_MESSAGE, CONTENT_MESSAGE_TYPES, OVERLAY_ACTION_IDS
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: single module src/shared/ui-action-contract.js
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: MAIN
 *   - How (sub-block): Re-export MESSAGE_TYPES; export POPUP_ACTION_IDS, POPUP_ACTION_TO_MESSAGE, CONTENT_MESSAGE_TYPES, OVERLAY_ACTION_IDS.
 *   - 1. LOAD contract:
 *   - 2.   RE-EXPORT MESSAGE_TYPES from message layer
 *   - 3.   EXPORT POPUP_ACTION_IDS (e.g. save, toggle-overlay)
 *   - 4.   EXPORT POPUP_ACTION_TO_MESSAGE (actionId -> message type)
 *   - 5.   EXPORT CONTENT_MESSAGE_TYPES, OVERLAY_ACTION_IDS
 *   - 6. Tests and E2E IMPORT from this module; same IDs for send/assert
 * 
 * === END IMPL-FULL-BLOCK: IMPL-UI_ACTION_CONTRACT ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-POPUP_MESSAGE_TIMEOUT ===
 * [IMPL-POPUP_MESSAGE_TIMEOUT] — Promise-based send with timeout; reject on timeout or error. Contract: message and timeout in; Promise resolve/reject out.
 * 
 * ## SEND_WITH_TIMEOUT
 * 
 * - [IMPL-POPUP_MESSAGE_TIMEOUT] How: Implements sendWithTimeout(message, timeoutMs) behavior for IMPL-POPUP_MESSAGE_TIMEOUT.
 * - Contract:
 *   - INPUT: message (type, payload); timeout (ms)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: Promise that resolves with response or rejects on timeout/error | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: timeout handle; optional test mock for timeout value
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: SEND_WITH_TIMEOUT
 *   - promise = SEND message (Promise from message service)
 *   - timeoutId = SET timeout for timeoutMs -> REJECT with timeout error
 *   - ON promise resolve/reject: CLEAR timeoutId; RETURN promise result
 *   - RETURN promise (race with timeout)
 * 
 * === END IMPL-FULL-BLOCK: IMPL-POPUP_MESSAGE_TIMEOUT ===
 */
import { POPUP_ACTION_IDS, POPUP_ACTION_TO_MESSAGE, MESSAGE_TYPES } from '../../src/shared/ui-action-contract.js'

describe('[IMPL-MESSAGE_HANDLING] Popup action to message type contract', () => {
  test('openTagsTree maps to OPEN_SIDE_PANEL [REQ-SIDE_PANEL_TAGS_TREE]', () => {
    expect(POPUP_ACTION_TO_MESSAGE[POPUP_ACTION_IDS.openTagsTree]).toBe(MESSAGE_TYPES.OPEN_SIDE_PANEL)
  })

  test('showHoverboard maps to TOGGLE_HOVER (sendToTab)', () => {
    expect(POPUP_ACTION_TO_MESSAGE[POPUP_ACTION_IDS.showHoverboard]).toBe(MESSAGE_TYPES.TOGGLE_HOVER)
  })

  test('deletePin maps to DELETE_BOOKMARK', () => {
    expect(POPUP_ACTION_TO_MESSAGE[POPUP_ACTION_IDS.deletePin]).toBe(MESSAGE_TYPES.DELETE_BOOKMARK)
  })

  test('addTag maps to SAVE_TAG', () => {
    expect(POPUP_ACTION_TO_MESSAGE[POPUP_ACTION_IDS.addTag]).toBe(MESSAGE_TYPES.SAVE_TAG)
  })

  test('storageBackendChange maps to MOVE_BOOKMARK_TO_STORAGE', () => {
    expect(POPUP_ACTION_TO_MESSAGE[POPUP_ACTION_IDS.storageBackendChange]).toBe(MESSAGE_TYPES.MOVE_BOOKMARK_TO_STORAGE)
  })

  test('every non-null POPUP_ACTION_TO_MESSAGE value is a string message type', () => {
    const values = Object.values(POPUP_ACTION_TO_MESSAGE)
    for (const v of values) {
      if (v != null) expect(typeof v).toBe('string')
    }
  })
})
