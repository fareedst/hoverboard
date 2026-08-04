/**
 * === IMPL-FULL-BLOCK: IMPL-SELECTION_TO_TAG_INPUT ===
 * [IMPL-SELECTION_TO_TAG_INPUT] [ARCH-SELECTION_TO_TAG_INPUT] [REQ-SELECTION_TO_TAG_INPUT] [REQ-TAG_MANAGEMENT] — Prefill tag input from page selection on popup open; GET_PAGE_SELECTION and normalizeSelectionForTagInput. Contract: selection via message; tag input prefilled.
 *
 * ## NORMALIZE_SELECTION_FOR_TAG_INPUT
 *
 * - [IMPL-SELECTION_TO_TAG_INPUT] [ARCH-SELECTION_TO_TAG_INPUT] [REQ-SELECTION_TO_TAG_INPUT] [REQ-TAG_MANAGEMENT] How: Implements normalizeSelectionForTagInput(selection, maxWords) behavior for IMPL-SELECTION_TO_TAG_INPUT.
 * - Contract:
 *   - INPUT: none at popup open (selection read from page via message); raw selection string (normalizeSelectionForTagInput)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: tag input field prefilled with normalized words (side effect) | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: current tab; newTagInput element; maxWords = 8
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: NORMALIZE_SELECTION_FOR_TAG_INPUT
 *   - text = replace non-word non-space chars with space in selection
 *   - text = collapse spaces, trim
 *   - words = split text on whitespace
 *   - RETURN first maxWords words joined by space
 *   - How (sub-block): Request selection; if present set tag input to normalized value.
 *   - 1. popup loadInitialData (after loadSuggestedTags or loadRecentTags):
 *   - TRY response = sendToTab(GET_PAGE_SELECTION)
 *   - ON timeout or failure LEAVE tag input unchanged, RETURN
 *   - raw = response.data.selection
 *   - IF raw non-empty:
 *   - normalized = normalizeSelectionForTagInput(raw, 8)
 *   - setTagInputValue(normalized)
 *
 * === END IMPL-FULL-BLOCK: IMPL-SELECTION_TO_TAG_INPUT ===
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
 * ## RECORD_INJECTION_OUTCOME
 *
 * - [IMPL-UI_INSPECTOR] [IMPL-POPUP_SESSION] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION] [REQ-SUGGESTED_TAGS_FROM_CONTENT] How: Observable contract for script-injection skips and results — PopupController/side-panel recordAction({ actionId: "injectionOutcome", surface, payload: { phase, trigger, tabId, urlHost, reason, injectable, errorMessage? } }). testable when setEnabled(true); used by tabChangeRefresh composition and unit inject precheck tests.
 * - Contract:
 *   - INPUT: phase, reason, injectable, optional trigger/surface/tabId/urlHost/errorMessage
 *   - PRE: recordAction available (no-op when inspector disabled)
 *   - OUTPUT: action appended when enabled
 *   - POST:
 *     - success => last actions include injectionOutcome with closed-set reason codes
 *   - FAILURE_MODES: none
 *   - DATA: action ring buffer
 *   - DATA_TRANSITION: buffer grows (or rotates) when enabled; else unchanged
 *   - EFFECTS: State
 *   - TERMINATION: total
 * - PROCEDURE: RECORD_INJECTION_OUTCOME
 *   - recordAction({ actionId: "injectionOutcome", surface, payload })
 *
 * ## RECORD_MESSAGE_RESPONSE_MISSING
 *
 * - [IMPL-UI_INSPECTOR] [IMPL-MESSAGE_HANDLING] [ARCH-UI_TESTABILITY] [ARCH-MESSAGE_HANDLING] [REQ-UI_INSPECTION] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] How: Observable contract when runtime reply is null/undefined — content-main recordAction({ actionId: "messageResponseMissing", surface: "content", payload: { type } }) instead of throwing on response.success.
 * - Contract:
 *   - INPUT: message type string that expected a reply
 *   - PRE: unwrapMessageResponse returned null; inspector may be disabled
 *   - OUTPUT: action appended when enabled; caller keeps defaults
 *   - POST:
 *     - success => messageResponseMissing observable; no TypeError
 *   - FAILURE_MODES: none
 *   - DATA: action ring buffer
 *   - DATA_TRANSITION: buffer grows when enabled
 *   - EFFECTS: State
 *   - TERMINATION: total
 * - PROCEDURE: RECORD_MESSAGE_RESPONSE_MISSING
 *   - recordAction({ actionId: "messageResponseMissing", surface: "content", payload: { type } })
 *
 * === END IMPL-FULL-BLOCK: IMPL-UI_INSPECTOR ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-AI_TAGGING_READABILITY ===
 * [IMPL-AI_TAGGING_READABILITY] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] — Extract main content from document: Readability when available, else title + body.innerText; cap at maxLength.
 *
 * ## EXTRACT_PAGE_CONTENT
 *
 * - [IMPL-AI_TAGGING_READABILITY] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] How: Implements extractPageContent(document) behavior for IMPL-AI_TAGGING_READABILITY.
 * - Contract:
 *   - INPUT: document (or run in page context)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: { title: string, textContent: string }
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: maxLength (e.g. 16000)
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: EXTRACT_PAGE_CONTENT
 *   - clone = document.cloneNode(true)
 *   - result = Readability.parse(clone)  // @mozilla/readability
 *   - IF result:
 *   - title = result.title ?? document.title
 *   - text = result.textContent ?? ''
 *   - ELSE:
 *   - title = document.title
 *   - text = document.body ? document.body.innerText : ''
 *   - IF text.length > maxLength THEN text = text.slice(0, maxLength)
 *   - RETURN { title, textContent: text }
 *
 * ## MESSAGE_DISPATCH_GET_PAGE_CONTENT
 *
 * - [IMPL-AI_TAGGING_READABILITY] [IMPL-CROSS_BROWSER] [ARCH-AI_TAGGING_FLOW] [ARCH-CROSS_BROWSER] [REQ-AI_TAGGING_POPUP] [REQ-CROSS_BROWSER] How: Dispatches GET_PAGE_CONTENT to EXTRACT_PAGE_CONTENT and returns the extracted payload through the runtime response channel.
 * - Contract:
 *   - INPUT: runtime message, sender, response callback
 *   - PRE: runtime listener is registered; response callback is callable
 *   - OUTPUT: response channel containing { success: true, data: { title, textContent } }
 *   - POST:
 *     - success => response callback receives the extracted page payload
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: MESSAGE_DISPATCH_GET_PAGE_CONTENT
 *   - ON runtime message with type GET_PAGE_CONTENT:
 *     - data = AWAIT EXTRACT_PAGE_CONTENT(document)
 *     - SEND response callback { success: true, data }
 *     - RETURN true to keep the response channel open
 *
 * === END IMPL-FULL-BLOCK: IMPL-AI_TAGGING_READABILITY ===
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
 * ## MESSAGE_DISPATCH_TESTABILITY
 *
 * - [IMPL-DEBUG_PANEL] [IMPL-MESSAGE_HANDLING] [IMPL-UI_TESTABILITY_HOOKS] [ARCH-UI_TESTABILITY] [ARCH-MESSAGE_HANDLING] [REQ-UI_INSPECTION] [REQ-MODULE_VALIDATION] How: Consumes the message-processing callback seam to expose diagnostics without requiring the debug panel UI.
 * - Contract:
 *   - INPUT: processed message/result and debug inspector callback
 *   - PRE: debug inspector callback is registered
 *   - OUTPUT: observable diagnostic action containing message/result
 *   - POST:
 *     - success => diagnostic callback receives the processed message and result
 *   - EFFECTS: State
 *   - TERMINATION: total
 * - PROCEDURE: MESSAGE_DISPATCH_TESTABILITY
 *   - REGISTER inspector callback
 *   - AWAIT message processing
 *   - CALL inspector callback with message and result
 *   - RETURN diagnostic observation
 *
 * === END IMPL-FULL-BLOCK: IMPL-DEBUG_PANEL ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-BOOKMARK_STATE_SYNC ===
 * [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] — BOOKMARK_UPDATED broadcast after overlay persist; popup and badge refresh so state is consistent.
 *
 * ## MAIN
 *
 * - [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] How: Logical block for IMPL-BOOKMARK_STATE_SYNC.
 * - Contract:
 *   - INPUT: user actions (overlay toggle, tag save/delete, bookmark save); processMessage result
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: consistent bookmark state across overlay, popup, badge
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: overlay state, popup state, badge state; BOOKMARK_UPDATED broadcast
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: MAIN
 *   - How (sub-block): Send message to backend; on success broadcast BOOKMARK_UPDATED.
 *   - 1. ON overlay toggle (saveBookmark / saveTag / deleteTag):
 *   - 2.   SEND message to backend; await processMessage result
 *   - 3.   BROADCAST BOOKMARK_UPDATED (so other surfaces can refresh)
 *   - How (sub-block): On saveTag/deleteTag/saveBookmark result compare tab URL state and update icon/count.
 *   - 4. Badge manager:
 *   - 5.   ON message result (saveTag | deleteTag | saveBookmark): compare current tab URL state with stored state; UPDATE badge icon/count
 *
 * ## OBSERVER_BOOKMARK_UPDATED_APPLY_EXTERNAL
 *
 * - [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [ARCH-MESSAGE_HANDLING] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] How: Constructor-path observer listener — synchronous, returns undefined, re-fetches pin/tags via applyExternalBookmarkUpdate in a detached promise. Distinct from setupRealTimeUpdates full refresh (IMPL-POPUP_SESSION OBSERVER_BOOKMARK_UPDATED_FULL_REFRESH). Chrome 144+ treats a promise-returning listener as answering and would deliver null to the SW sender.
 * - Contract:
 *   - INPUT: runtime.onMessage envelope (any type); BOOKMARK_UPDATED triggers refresh
 *   - PRE: PopupController constructed; chrome.runtime.onMessage available when registering
 *   - OUTPUT: undefined (never a Promise, never sendResponse); pin/tags UI may update asynchronously
 *   - POST:
 *     - success => listener returned undefined; unrelated types left the response channel free
 *     - BOOKMARK_UPDATED => detached applyExternalBookmarkUpdate started (or no-op when no currentTab)
 *   - FAILURE_MODES: RefreshFailed (caught inside detached chain; debugError; does not answer message)
 *   - DATA: currentTab; currentPin; UIManager tag/privacy/read-later widgets
 *   - DATA_TRANSITION: on BOOKMARK_UPDATED success path, currentPin and chip UI updated from re-fetch; else unchanged
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: OBSERVER_BOOKMARK_UPDATED_APPLY_EXTERNAL
 *   - REGISTER runtime.onMessage as synchronous function:
 *   -   IF message?.type !== 'BOOKMARK_UPDATED': RETURN undefined
 *   -   START detached applyExternalBookmarkUpdate(); CATCH → debugError
 *   -   RETURN undefined
 *
 * ## OBSERVER_BOOKMARK_UPDATED_FULL_REFRESH
 *
 * - [IMPL-BOOKMARK_STATE_SYNC] [IMPL-POPUP_SESSION] [ARCH-BOOKMARK_STATE_SYNC] [ARCH-POPUP_SESSION] [ARCH-MESSAGE_HANDLING] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [REQ-POPUP_PERSISTENT_SESSION] How: setupRealTimeUpdates observer — synchronous, returns undefined, runs refreshOnExternalBookmarkUpdate (refreshPopupData then updateOverlayState) in a detached promise. Complements constructor applyExternalBookmarkUpdate path; duplicate refresh is an accepted non-goal.
 * - Contract:
 *   - INPUT: runtime.onMessage envelope (any type); BOOKMARK_UPDATED triggers full refresh
 *   - PRE: setupRealTimeUpdates registered; controller may be initialized
 *   - OUTPUT: undefined; full This Page refresh may run asynchronously
 *   - POST:
 *     - success => listener returned undefined; response channel not claimed
 *     - BOOKMARK_UPDATED => detached refreshPopupData + updateOverlayState started
 *   - FAILURE_MODES: RefreshFailed (caught inside detached chain; debugError)
 *   - DATA: PopupController session state; overlay button state
 *   - DATA_TRANSITION: on success path, bookmark/suggested/overlay UI refreshed; else unchanged
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: OBSERVER_BOOKMARK_UPDATED_FULL_REFRESH
 *   - REGISTER runtime.onMessage as synchronous function:
 *   -   IF message?.type !== 'BOOKMARK_UPDATED': RETURN undefined
 *   -   START detached refreshOnExternalBookmarkUpdate(); CATCH → debugError
 *   -   RETURN undefined
 *
 * === END IMPL-FULL-BLOCK: IMPL-BOOKMARK_STATE_SYNC ===
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
// [IMPL-MV3_MIGRATION] [ARCH-MV3_MIGRATION] [REQ-MANIFEST_V3_MIGRATION]: Content script implementation for V3 injection patterns
/**
 * Hoverboard Content Script - Main Entry Point
 * Modern replacement for inject.js with jQuery-free DOM manipulation
 */

// [IMPL-MV3_MIGRATION] [ARCH-MV3_MIGRATION] [REQ-MANIFEST_V3_MIGRATION]: Modern ES6 module imports for V3 content scripts
import { OverlayManager } from './overlay-manager.js'
import { MessageClient } from './message-client.js'
import { DOMUtils } from './dom-utils.js'
import { MESSAGE_TYPES } from '../../core/message-handler.js'
import { extractPageContent } from '../ai/readability-extract.js'
// [SAFARI-EXT-SHIM-001] Import browser API abstraction for cross-browser support
import { browser, debugLog, debugError } from '../../shared/utils' // [SAFARI-EXT-SHIM-001]
// [IMPL-UI_INSPECTOR] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION]
import { recordAction } from '../../shared/ui-inspector.js'
// [IMPL-MESSAGE_HANDLING] [ARCH-MESSAGE_HANDLING] Missing (null) replies happen when another extension
// context wins the response-channel race; unwrap instead of dereferencing response.success.
import { readMessageResponse } from '../../shared/message-response.js'

// [IMPL-AI_TAGGING_READABILITY] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] Register GET_PAGE_CONTENT immediately so the
// popup can get page content before init() finishes (init() awaits waitForDOM() before setupMessageListeners).
browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== 'GET_PAGE_CONTENT') return
  // [IMPL-AI_TAGGING_READABILITY] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] Readability path: extractPageContent(document) then sendResponse.
  try {
    const result = extractPageContent(document)
    sendResponse({ success: true, data: result })
  } catch (e) {
    sendResponse({ success: false, error: e.message })
  }
  return true
})

// [IMPL-MV3_MIGRATION] [ARCH-MV3_MIGRATION] [REQ-MANIFEST_V3_MIGRATION]: Main content script class for V3 architecture
class HoverboardContentScript {
  constructor () {
    // [IMPL-MV3_MIGRATION] [ARCH-MV3_MIGRATION] [REQ-MANIFEST_V3_MIGRATION]: Initialize content script state
    this.tabId = null
    this.pageUrl = window.location.href
    this.pageTitle = document.title

    // [IMPL-MV3_MIGRATION] [ARCH-MV3_MIGRATION] [REQ-MANIFEST_V3_MIGRATION]: Initialize modern utility classes
    this.messageClient = new MessageClient()
    this.domUtils = new DOMUtils()

    // ⭐ [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Transparent overlay - 🎨 Enhanced transparency system
    // Initialize overlay manager with transparency-enabled configuration
    this.overlayManager = new OverlayManager(document, {
      overlayPosition: 'top-right',
      messageTimeout: 3000,
      showRecentTags: true,
      maxRecentTags: 10,
      overlayAnimations: true,
      overlayDraggable: false,
      // Transparency settings for [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]
      overlayTransparencyMode: 'nearly-transparent',
      overlayPositionMode: 'bottom-fixed',
      overlayOpacityNormal: 0.05,
      overlayOpacityHover: 0.15,
      overlayOpacityFocus: 0.25,
      overlayAdaptiveVisibility: true,
      overlayBlurAmount: 2
    })

    this.currentBookmark = null
    this.isInitialized = false
    this.overlayActive = false
    this.config = null

    this.init()
  }

  async init () {
    try {
      debugLog('CONTENT-SCRIPT', 'Initializing content script')

      // Wait for DOM to be ready
      await this.domUtils.waitForDOM()
      debugLog('CONTENT-SCRIPT', 'DOM ready')

      // Set up message listeners
      this.setupMessageListeners()
      debugLog('CONTENT-SCRIPT', 'Message listeners set up')

      // Get tab ID from background
      await this.initializeTabId()
      debugLog('CONTENT-SCRIPT', 'Tab ID initialized:', this.tabId)

      // Get configuration and options
      await this.loadConfiguration()
      debugLog('CONTENT-SCRIPT', 'Options loaded:', this.config)

      // ⭐ [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Transparent overlay - 🎨 Enhanced transparency system
      // Update overlay manager config with options and transparency settings
      this.overlayManager.config = { ...this.overlayManager.config, ...this.config }

      // Update overlay manager transparency properties
      this.overlayManager.transparencyMode = this.config.overlayTransparencyMode || 'nearly-transparent'
      this.overlayManager.positionMode = this.config.overlayPositionMode || 'bottom-fixed'
      this.overlayManager.adaptiveVisibility = this.config.overlayAdaptiveVisibility || true

      debugLog('CONTENT-SCRIPT', 'Overlay manager configured with transparency settings', {
        transparencyMode: this.overlayManager.transparencyMode,
        positionMode: this.overlayManager.positionMode,
        adaptiveVisibility: this.overlayManager.adaptiveVisibility
      })

      // Notify background that content script is ready
      await this.notifyReady()
      debugLog('CONTENT-SCRIPT', 'Ready notification sent')

      // Load current page bookmark data
      await this.loadCurrentPageData()
      debugLog('CONTENT-SCRIPT', 'Current page data loaded:', this.currentBookmark)

      this.isInitialized = true
      debugLog('CONTENT-SCRIPT', 'Content script initialization complete')
    } catch (error) {
      console.error('Hoverboard: Failed to initialize content script:', error)
    }
  }

  setupMessageListeners () {
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse)
      return true // Keep message channel open for async responses
    })
  }

  async handleMessage (message, sender, sendResponse) {
    try {
      recordAction(message.type, message.data, 'content')

      switch (message.type) {
        case 'TOGGLE_HOVER': {
          await this.toggleHover()
          // [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] [TEST-POPUP_CLOSE_BEHAVIOR] - Return overlay state after toggle
          const newState = {
            isVisible: this.overlayActive,
            hasBookmark: !!this.currentBookmark
          }
          sendResponse({ success: true, data: newState })
          break
        }

        case 'HIDE_OVERLAY':
          this.overlayManager.hide()
          sendResponse({ success: true })
          break

        case 'REFRESH_DATA':
          await this.refreshData()
          sendResponse({ success: true })
          break

        case 'REFRESH_HOVER':
          await this.refreshHover()
          sendResponse({ success: true })
          break

        case 'CLOSE_IF_TO_READ':
          this.handleCloseIfToRead(message.data)
          sendResponse({ success: true })
          break

        case 'PING':
          sendResponse({ success: true, data: 'pong' })
          break

        case 'SHOW_BOOKMARK_DIALOG':
          await this.showBookmarkDialog(message.data)
          sendResponse({ success: true })
          break

        case 'TOGGLE_HOVER_OVERLAY':
          await this.toggleHoverOverlay()
          sendResponse({ success: true, data: { active: this.overlayActive } })
          break

        case 'UPDATE_CONFIG':
          this.config = { ...this.config, ...message.data }
          sendResponse({ success: true })
          break

        case 'updateOverlayTransparency':
          this.handleUpdateOverlayTransparency(message.config)
          sendResponse({ success: true })
          break

        case 'CHECK_PAGE_STATE': {
          const pageState = await this.getPageState()
          sendResponse({ success: true, data: pageState })
          break
        }

        // [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TOGGLE_SYNC] - Handle bookmark updates from external sources
        case 'BOOKMARK_UPDATED':
          await this.handleBookmarkUpdated(message.data)
          sendResponse({ success: true })
          break

        case 'TAG_UPDATED':
          // [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TAG_SYNC] Handle tag updates from popup or other sources
          await this.handleTagUpdated(message.data)
          sendResponse({ success: true })
          break

        // [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] [TEST-POPUP_CLOSE_BEHAVIOR] - Handle overlay state queries from popup
        case 'GET_OVERLAY_STATE': {
          const overlayState = {
            isVisible: this.overlayActive,
            hasBookmark: !!this.currentBookmark,
            overlayElement: !!document.getElementById('hoverboard-overlay')
          }
          sendResponse({ success: true, data: overlayState })
          break
        }

        // [IMPL-SELECTION_TO_TAG_INPUT] [ARCH-SELECTION_TO_TAG_INPUT] [REQ-SELECTION_TO_TAG_INPUT] [REQ-TAG_MANAGEMENT] Return page selection for popup tag prefill
        case 'GET_PAGE_SELECTION': {
          const selection = typeof window.getSelection === 'function' ? window.getSelection().toString() : ''
          sendResponse({ success: true, data: { selection } })
          break
        }

        // [REQ-AI_TAGGING_POPUP] GET_PAGE_CONTENT is handled by the early listener above (before init) so popup gets a response without waiting for waitForDOM().

        default:
          console.warn('Unknown message type:', message.type)
          sendResponse({ success: false, error: 'Unknown message type' })
      }
    } catch (error) {
      console.error('Message handling error:', error)
      sendResponse({ success: false, error: error.message })
    }
  }

  async initializeTabId () {
    try {
      const response = await this.messageClient.sendMessage({
        type: MESSAGE_TYPES.GET_TAB_ID,
        data: { url: this.pageUrl }
      })

      // Handle wrapped response from service worker
      const actualResponse = readMessageResponse(response, MESSAGE_TYPES.GET_TAB_ID)
      if (!actualResponse) return

      this.tabId = actualResponse.tabId
      console.log('Content script tab ID:', this.tabId)
    } catch (error) {
      console.error('Failed to get tab ID:', error)
    }
  }

  async loadConfiguration () {
    try {
      const response = await this.messageClient.sendMessage({
        type: MESSAGE_TYPES.GET_OPTIONS
      })

      // Handle wrapped response from service worker
      const actualResponse = readMessageResponse(response, MESSAGE_TYPES.GET_OPTIONS)

      if (actualResponse) {
        this.config = { ...this.getDefaultConfig(), ...actualResponse }
        console.log('📋 Configuration loaded:', this.config)
      } else {
        this.config = this.getDefaultConfig()
      }
    } catch (error) {
      console.error('❌ Failed to load configuration:', error)
      this.config = this.getDefaultConfig()
    }
  }

  getDefaultConfig () {
    return {
      showHoverOnPageLoad: false,
      hoverShowTooltips: false,
      inhibitSitesOnPageLoad: true,
      uxAutoCloseTimeout: 0,
      // ⭐ [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Transparent overlay - 🎨 Enhanced transparency system
      overlayTransparencyMode: 'nearly-transparent',
      overlayPositionMode: 'bottom-fixed',
      overlayOpacityNormal: 0.05,
      overlayOpacityHover: 0.15,
      overlayOpacityFocus: 0.25,
      overlayAdaptiveVisibility: true,
      overlayBlurAmount: 2
    }
  }

  async notifyReady () {
    try {
      await this.messageClient.sendMessage({
        type: MESSAGE_TYPES.CONTENT_SCRIPT_READY,
        data: {
          url: this.pageUrl,
          title: this.pageTitle,
          tabId: this.tabId
        }
      })
    } catch (error) {
      console.error('Failed to notify ready:', error)
    }
  }

  async loadCurrentPageData () {
    try {
      debugLog('CONTENT-SCRIPT', 'Loading current page data')
      debugLog('CONTENT-SCRIPT', 'Request data:', {
        url: this.pageUrl,
        title: this.pageTitle,
        tabId: this.tabId
      })

      const response = await this.messageClient.sendMessage({
        type: MESSAGE_TYPES.GET_CURRENT_BOOKMARK,
        data: {
          url: this.pageUrl,
          title: this.pageTitle,
          tabId: this.tabId
        }
      })

      debugLog('CONTENT-SCRIPT', 'Received response:', response)

      // Handle wrapped response from service worker
      const actualResponse = readMessageResponse(response, MESSAGE_TYPES.GET_CURRENT_BOOKMARK)
      if (!actualResponse) return

      if (actualResponse.blocked) {
        debugLog('CONTENT-SCRIPT', 'Site is blocked from processing')
        return
      }

      // Extract the actual bookmark data from the response
      this.currentBookmark = actualResponse.data || actualResponse
      debugLog('CONTENT-SCRIPT', 'Current bookmark set:', this.currentBookmark)

      // Check if we should show hover on page load
      const options = await this.getOptions()
      debugLog('CONTENT-SCRIPT', 'Options for page load:', options)

      if (options.showHoverOnPageLoad) {
        debugLog('CONTENT-SCRIPT', 'Showing hover on page load')
        await this.showHoverWithDelay(options)
      }
    } catch (error) {
      console.error('Failed to load current page data:', error)
      debugLog('CONTENT-SCRIPT', 'Error loading page data:', error)
    }
  }

  async showHoverWithDelay (options) {
    const delay = options.showHoverDelay || 1000

    setTimeout(async () => {
      try {
        if (this.shouldShowHoverOnPageLoad(options)) {
          await this.showHover(false) // false = not user-triggered

          // Auto-close if configured
          if (options.uxAutoCloseTimeout > 0) {
            setTimeout(() => {
              this.overlayManager.hideOverlay()
            }, options.uxAutoCloseTimeout)
          }
        }
      } catch (error) {
        console.error('Failed to show hover on page load:', error)
      }
    }, delay)
  }

  shouldShowHoverOnPageLoad (options) {
    if (!this.currentBookmark) return false

    const hasBookmark = this.currentBookmark.hash && this.currentBookmark.hash.length > 0
    const hasTags = this.currentBookmark.tags && this.currentBookmark.tags.length > 0

    // Check configuration rules
    if (options.showHoverOPLOnlyIfNoTags && hasTags) return false
    if (options.showHoverOPLOnlyIfSomeTags && !hasTags) return false

    return true
  }

  async toggleHover () {
    if (this.overlayManager.isVisible) {
      this.overlayManager.hide()
    } else {
      await this.showHover(true) // true = user-triggered
    }
  }

  async showHover (userTriggered = false) {
    try {
      debugLog('CONTENT-SCRIPT', 'Showing hover', { userTriggered })

      // Refresh bookmark data for user-triggered displays
      if (userTriggered) {
        debugLog('CONTENT-SCRIPT', 'Refreshing bookmark data for user-triggered display')
        await this.loadCurrentPageData()
      }

      if (!this.currentBookmark) {
        debugLog('CONTENT-SCRIPT', 'No bookmark data available')
        console.warn('No bookmark data available for hover display')
        return
      }

      debugLog('CONTENT-SCRIPT', 'Current bookmark data:', this.currentBookmark)

      // Create and show the overlay
      this.overlayManager.show({
        bookmark: this.currentBookmark,
        pageTitle: this.pageTitle,
        pageUrl: this.pageUrl,
        tabId: this.tabId,
        userTriggered
      })

      debugLog('CONTENT-SCRIPT', 'Overlay display request sent')
    } catch (error) {
      console.error('Failed to show hover:', error)
      debugLog('CONTENT-SCRIPT', 'Error showing hover:', error)
    }
  }

  async refreshData () {
    try {
      await this.loadCurrentPageData()
    } catch (error) {
      console.error('Failed to refresh data:', error)
    }
  }

  async refreshHover () {
    try {
      this.overlayManager.hideOverlay()
      await this.showHover(true)
    } catch (error) {
      console.error('Failed to refresh hover:', error)
    }
  }

  handleCloseIfToRead (data) {
    if (this.currentBookmark && this.currentBookmark.toread === 'yes') {
      console.log('Closing tab - bookmark is marked "read later"')
      window.close()
    }
  }

  // Public API for other modules
  getCurrentBookmark () {
    return this.currentBookmark
  }

  getTabId () {
    return this.tabId
  }

  getPageInfo () {
    return {
      url: this.pageUrl,
      title: this.pageTitle,
      tabId: this.tabId
    }
  }

  isReady () {
    return this.isInitialized
  }

  async showBookmarkDialog (data) {
    const event = { clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 }
    await this.showHoverOverlay(document.body, event)

    if (this.currentOverlay && data) {
      if (data.url) {
        this.currentOverlay.querySelector('.hoverboard-url-input').value = data.url
      }
      if (data.title) {
        this.currentOverlay.querySelector('.hoverboard-title-input').value = data.title
      }
      if (data.description) {
        this.currentOverlay.querySelector('.hoverboard-description-input').value = data.description
      }
    }
  }

  async toggleHoverOverlay () {
    if (this.overlayActive) {
      this.hideHoverOverlay()
    } else {
      const event = { clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 }
      await this.showHoverOverlay(document.body, event)
    }
  }

  async showHoverOverlay (element, event) {
    try {
      console.log('🎯 Showing hover overlay')

      const overlay = this.createOverlayElement(element, event)

      document.body.appendChild(overlay)

      this.overlayActive = true
      this.currentOverlay = overlay

      this.setupOverlayHandlers(overlay)

      if (this.config.uxAutoCloseTimeout > 0) {
        setTimeout(() => {
          this.hideHoverOverlay()
        }, this.config.uxAutoCloseTimeout)
      }
    } catch (error) {
      console.error('❌ Failed to show hover overlay:', error)
    }
  }

  createOverlayElement (element, event) {
    const overlay = document.createElement('div')
    overlay.className = 'hoverboard-overlay'
    overlay.innerHTML = `
      <div class="hoverboard-overlay-content">
        <div class="hoverboard-overlay-header">
          <span class="hoverboard-overlay-title">📌 Add to Pinboard</span>
          <button class="hoverboard-overlay-close">×</button>
        </div>
        <div class="hoverboard-overlay-body">
          <input type="text" class="hoverboard-url-input" placeholder="URL" value="${window.location.href}">
          <input type="text" class="hoverboard-title-input" placeholder="Title" value="${document.title}">
          <textarea class="hoverboard-description-input" placeholder="Description"></textarea>
          <input type="text" class="hoverboard-tags-input" placeholder="Tags (comma separated)">
          <div class="hoverboard-overlay-actions">
            <button class="hoverboard-save-button">Save Bookmark</button>
            <label class="hoverboard-private-label">
              <input type="checkbox" class="hoverboard-private-checkbox"> Private
            </label>
          </div>
        </div>
      </div>
    `

    overlay.style.position = 'fixed'
    overlay.style.left = `${Math.min(event.clientX, window.innerWidth - 350)}px`
    overlay.style.top = `${Math.min(event.clientY, window.innerHeight - 200)}px`
    overlay.style.zIndex = '999999'

    return overlay
  }

  setupOverlayHandlers (overlay) {
    const closeButton = overlay.querySelector('.hoverboard-overlay-close')
    closeButton.addEventListener('click', () => {
      this.hideHoverOverlay()
    })

    const saveButton = overlay.querySelector('.hoverboard-save-button')
    saveButton.addEventListener('click', () => {
      this.saveBookmarkFromOverlay(overlay)
    })

    document.addEventListener('click', (event) => {
      if (!overlay.contains(event.target)) {
        this.hideHoverOverlay()
      }
    }, { once: true })

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        this.hideHoverOverlay()
      }
    }, { once: true })
  }

  hideHoverOverlay () {
    if (this.currentOverlay) {
      this.currentOverlay.remove()
      this.currentOverlay = null
      this.overlayActive = false
      console.log('🎯 Hover overlay hidden')
    }
  }

  async saveBookmarkFromOverlay (overlay) {
    try {
      const url = overlay.querySelector('.hoverboard-url-input').value
      const title = overlay.querySelector('.hoverboard-title-input').value
      const description = overlay.querySelector('.hoverboard-description-input').value
      const tags = overlay.querySelector('.hoverboard-tags-input').value
      const isPrivate = overlay.querySelector('.hoverboard-private-checkbox').checked

      const response = await browser.runtime.sendMessage({
        type: 'SAVE_BOOKMARK',
        data: { url, title, description, tags, private: isPrivate }
      })

      if (response.success) {
        console.log('✅ Bookmark saved successfully')
        this.hideHoverOverlay()
      } else {
        console.error('❌ Failed to save bookmark:', response.error)
      }
    } catch (error) {
      console.error('❌ Save bookmark failed:', error)
    }
  }

  async getOptions () {
    try {
      const response = await this.messageClient.sendMessage({
        type: MESSAGE_TYPES.GET_OPTIONS
      })

      // Handle wrapped response from service worker
      return readMessageResponse(response, MESSAGE_TYPES.GET_OPTIONS) || {}
    } catch (error) {
      console.error('Failed to get options:', error)
      return {}
    }
  }

  async getPageState () {
    return {
      url: window.location.href,
      title: document.title,
      overlayActive: this.overlayActive,
      isInitialized: this.isInitialized
    }
  }

  // [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TOGGLE_SYNC] - Handle bookmark updates from external sources
  async handleBookmarkUpdated (bookmarkData) {
    try {
      // [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TOGGLE_SYNC] Robustness: Validate bookmarkData before updating overlay (url required; tags may be empty)
      if (!bookmarkData || !bookmarkData.url) {
        console.warn('[IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TOGGLE_SYNC] Ignoring malformed bookmark update:', bookmarkData)
        return
      }
      // [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TOGGLE_SYNC] - Update current bookmark data
      this.currentBookmark = bookmarkData

      // [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TOGGLE_SYNC] - Refresh overlay if visible
      if (this.overlayManager.isVisible) {
        const updatedContent = {
          bookmark: bookmarkData,
          pageTitle: this.pageTitle,
          pageUrl: this.pageUrl
        }
        this.overlayManager.show(updatedContent)
      }

      debugLog('CONTENT-SCRIPT', '[IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TOGGLE_SYNC] Bookmark updated from external source', bookmarkData)
    } catch (error) {
      debugError('CONTENT-SCRIPT', '[IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TOGGLE_SYNC] Failed to handle bookmark update:', error)
    }
  }

  // [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TAG_SYNC] - Handle tag updates from popup or other sources
  async handleTagUpdated (tagUpdateData) {
    try {
      // [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TAG_SYNC] Validate tag update data
      if (!tagUpdateData || !tagUpdateData.url || !Array.isArray(tagUpdateData.tags)) {
        console.warn('[IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TAG_SYNC] Ignoring malformed tag update:', tagUpdateData)
        return
      }
      // [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TAG_SYNC] Update current bookmark tags if URL matches
      if (this.currentBookmark && this.currentBookmark.url === tagUpdateData.url) {
        this.currentBookmark.tags = tagUpdateData.tags
        // [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TAG_SYNC] Refresh overlay if visible
        if (this.overlayManager.isVisible) {
          const updatedContent = {
            bookmark: this.currentBookmark,
            pageTitle: this.pageTitle,
            pageUrl: this.pageUrl
          }
          this.overlayManager.show(updatedContent)
        }
        debugLog('CONTENT-SCRIPT', '[IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TAG_SYNC] Overlay updated with new tags', tagUpdateData.tags)
      }
    } catch (error) {
      debugError('CONTENT-SCRIPT', '[IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [TEST-TAG_SYNC] Failed to handle tag update:', error)
    }
  }

  handleUpdateOverlayTransparency (config) {
    try {
      console.log('Updating overlay transparency configuration:', config)

      // Update local configuration
      this.config = { ...this.config, ...config }

      // Update overlay manager configuration
      if (this.overlayManager) {
        this.overlayManager.updateConfig(config)

        // Apply transparency changes immediately if overlay is visible
        if (this.overlayManager.isVisible) {
          this.overlayManager.applyTransparencyMode()
        }
      }

      console.log('Overlay transparency configuration updated successfully')
    } catch (error) {
      console.error('Failed to update overlay transparency:', error)
    }
  }
}

// Initialize content script when page loads
let hoverboardContentScript

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    hoverboardContentScript = new HoverboardContentScript()
  })
} else {
  // DOM is already ready
  hoverboardContentScript = new HoverboardContentScript()
}

// Export for other modules to access
window.hoverboardContentScript = hoverboardContentScript

export { HoverboardContentScript }
