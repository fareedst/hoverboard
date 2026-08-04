# [IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING] [REQ-SMART_BOOKMARKING] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [REQ-RECENT_TAGS_SYSTEM] [ARCH-TAG_SYSTEM] — Central message allowlist + validation + handler dispatch; recent-tag message types delegate to [IMPL-TAG_SYSTEM] TagService and SW recentTagsMemory policy per ARCH-TAG_SYSTEM. Contract: Promise result or reject on validation; recent handlers return safe shapes on internal failure.

## SEND

- [IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING] [REQ-SMART_BOOKMARKING] How: client-side validate type/payload; dispatch to background; return Promise (path for popup/content/offscreen callers).
- Contract:
  - INPUT: message { type, payload/data }; sender (tab/popup/background)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: Promise resolving to handler result or rejecting on validation/routing error | { error: OperationFailed }
  - POST:
    - success => block outputs match OUTPUT success shape
    - error OperationFailed => no silent partial commit beyond documented best-effort
  - FAILURE_MODES: OperationFailed
  - DATA: MESSAGE_TYPES allowlist; handler map type → async fn; TagService instance for tag/recent paths
  - EFFECTS: Async, IO
  - TERMINATION: total
- PROCEDURE: SEND
  - VALIDATE message.type in allowlist
  - VALIDATE payload shape
  - ROUTE to handler for message.type
  - handler(message) -> result; RETURN Promise.resolve(result)
  - ON error: RETURN Promise.reject; optional log

## UNWRAP_MESSAGE_RESPONSE

- [IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [REQ-UI_INSPECTION] How: shared null-tolerant unwrap for runtime replies (src/shared/message-response.js), because any extension context can win the response-channel race and answer null (Chrome 144+ promise-returning listeners / observer listeners that return promises). Callers must not dereference response.success. Observer BOOKMARK_UPDATED paths are IMPL-BOOKMARK_STATE_SYNC OBSERVER_BOOKMARK_UPDATED_APPLY_EXTERNAL and IMPL-POPUP_SESSION OBSERVER_BOOKMARK_UPDATED_FULL_REFRESH.
- Contract:
  - INPUT: response from runtime.sendMessage — { success, data } wrapper, plain payload, or null/undefined missing response; optional type + surface for readMessageResponse
  - PRE: caller awaited the send and handled thrown transport errors separately
  - OUTPUT: unwrapMessageResponse -> payload | null; isMissingMessageResponse -> boolean; readMessageResponse -> payload | null (records messageResponseMissing when missing)
  - POST:
    - success => wrapper returns response.data; non-wrapper object returns response as-is
    - missing response => returns null; readMessageResponse records messageResponseMissing; caller keeps defaults
  - FAILURE_MODES: none (total, no throw)
  - DATA: src/shared/message-response.js; callers in content-main (getTabId, getOptions, getCurrentBookmark)
  - EFFECTS: pure for unwrap/isMissing; State when readMessageResponse records inspector action
  - TERMINATION: total
- PROCEDURE: UNWRAP_MESSAGE_RESPONSE
  - IF isMissingMessageResponse(response): RETURN null
  - IF response is object AND 'success' in response: RETURN response.success ? response.data : response
  - RETURN response
  - How (sub-block): caller guard — missing response is observable, never a crash.
  - 1. CALLER: actual = readMessageResponse(response, type[, surface])
  - 2.   # readMessageResponse = unwrap + IF missing: recordAction messageResponseMissing; debugWarn
  - 3.   IF actual == null: KEEP defaults; RETURN

## HANDLE_GET_RECENT_BOOKMARKS

- How: SW entry resolves handler by message.type; missing handler → reject or structured error per router; AWAIT handler(data, senderUrl); optional BOOKMARK_UPDATED broadcast after mutating handlers ([REQ-BOOKMARK_STATE_SYNCHRONIZATION]).
- Contract:
  - INPUT: message { type, payload/data }; sender (tab/popup/background)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: Promise resolving to handler result or rejecting on validation/routing error | { error: OperationFailed }
  - POST:
    - success => block outputs match OUTPUT success shape
    - error OperationFailed => no silent partial commit beyond documented best-effort
  - FAILURE_MODES: OperationFailed
  - DATA: MESSAGE_TYPES allowlist; handler map type → async fn; TagService instance for tag/recent paths
  - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
  - EFFECTS: Async, IO, State
  - TERMINATION: total
- PROCEDURE: HANDLE_GET_RECENT_BOOKMARKS
  - recentTags = AWAIT tagService.getUserRecentTagsExcludingCurrent(data?.currentTags OR [])
  - RETURN { ...data, recentTags }
  - How (sub-block): How: addTagToRecent — validate tagName + currentSiteUrl; tagService.addTagToUserRecentList; structured { success } / error (same REQ/ARCH/IMPL cross-IMPL set as handleGetRecentBookmarks).

## HANDLE_ADD_TAG_TO_RECENT

- [IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING] [REQ-SMART_BOOKMARKING] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [REQ-RECENT_TAGS_SYSTEM] [ARCH-TAG_SYSTEM] How: Implements handleAddTagToRecent(data) behavior for IMPL-MESSAGE_HANDLING.
- Contract:
  - INPUT: message { type, payload/data }; sender (tab/popup/background)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: Promise resolving to handler result or rejecting on validation/routing error | { error: OperationFailed }
  - POST:
    - success => block outputs match OUTPUT success shape
    - error OperationFailed => no silent partial commit beyond documented best-effort
  - FAILURE_MODES: OperationFailed
  - DATA: MESSAGE_TYPES allowlist; handler map type → async fn; TagService instance for tag/recent paths
  - EFFECTS: Async, IO
  - TERMINATION: total
- PROCEDURE: HANDLE_ADD_TAG_TO_RECENT
  - VALIDATE tagName AND currentSiteUrl present
  - success = AWAIT tagService.addTagToUserRecentList(tagName, currentSiteUrl)
  - RETURN { success } OR { success: false, error: message }
  - How (sub-block): How: getUserRecentTags message — raw policy list for diagnostics/tools; TRY/CATCH → { recentTags: [], error } on failure.

## HANDLE_GET_USER_RECENT_TAGS

- [IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING] [REQ-SMART_BOOKMARKING] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [REQ-RECENT_TAGS_SYSTEM] [ARCH-TAG_SYSTEM] How: Implements handleGetUserRecentTags(data) behavior for IMPL-MESSAGE_HANDLING.
- Contract:
  - INPUT: message { type, payload/data }; sender (tab/popup/background)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: Promise resolving to handler result or rejecting on validation/routing error | { error: OperationFailed }
  - POST:
    - success => block outputs match OUTPUT success shape
    - error OperationFailed => no silent partial commit beyond documented best-effort
  - FAILURE_MODES: OperationFailed
  - DATA: MESSAGE_TYPES allowlist; handler map type → async fn; TagService instance for tag/recent paths
  - EFFECTS: Async, IO
  - TERMINATION: total
- PROCEDURE: HANDLE_GET_USER_RECENT_TAGS
  - TRY: RETURN { recentTags: AWAIT tagService.getUserRecentTags() }
  - CATCH: LOG; RETURN { recentTags: [], error }

## BLOCK_5

- --- Composition: composed_with [IMPL-POPUP_MESSAGE_TIMEOUT] [IMPL-BOOKMARK_STATE_SYNC] --- How: Ordering: client send may apply timeout/retry () before this IMPL’s send completes. Post successful bookmark mutations,  may broadcast; recent-tag handlers are read/mutation for user-recent only unless caller chains. Shared DATA: single MessageHandler TagService reference; no second recentTagsMemory writer.
- Contract:
  - INPUT: message { type, payload/data }; sender (tab/popup/background)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: Promise resolving to handler result or rejecting on validation/routing error | { error: OperationFailed }
  - POST:
    - success => block outputs match OUTPUT success shape
    - error OperationFailed => no silent partial commit beyond documented best-effort
  - FAILURE_MODES: OperationFailed
  - DATA: MESSAGE_TYPES allowlist; handler map type → async fn; TagService instance for tag/recent paths
  - EFFECTS: Async, IO
  - TERMINATION: total
- PROCEDURE: BLOCK_5
  - How (sub-block): --- Cross-IMPL ---

## MESSAGE_DISPATCH_TESTABILITY

- [IMPL-MESSAGE_HANDLING] [IMPL-UI_TESTABILITY_HOOKS] [IMPL-DEBUG_PANEL] [IMPL-UI_ACTION_CONTRACT] [ARCH-MESSAGE_HANDLING] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION] [REQ-MODULE_VALIDATION] How: Dispatches a validated message through the handler and exposes the result to testability hooks and inspection consumers.
- Contract:
  - INPUT: message, sender, handler map, optional processed callback
  - PRE: message type and payload satisfy the allowlist
  - OUTPUT: handler result and optional inspection callback payload
  - POST:
    - success => handler result is returned and the processed callback receives message/result
  - FAILURE_MODES: OperationFailed
  - EFFECTS: Async, IO, State
  - TERMINATION: total
- PROCEDURE: MESSAGE_DISPATCH_TESTABILITY
  - VALIDATE message
  - AWAIT handler result
  - IF processed callback exists: CALL callback with message and result
  - RETURN result
