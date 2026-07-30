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
 * === IMPL-FULL-BLOCK: IMPL-POPUP_SESSION ===
 * [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] — PopupController handlers await messages; StateManager and UIManager updates; no window.close. Contract: user actions and GET_OVERLAY_STATE; popup open and state/UI in sync.
 * 
 * ## MAIN
 * 
 * - [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] How: Logical block for IMPL-POPUP_SESSION.
 * - Contract:
 *   - INPUT: user actions (show overlay, toggle private, save, etc.); GET_OVERLAY_STATE fallback
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: popup stays open; state and UI updated; no window.close
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: StateManager (overlay visible, bookmark, etc.); UIManager (button states, labels)
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: MAIN
 *   - How (sub-block): Await message; update state and UI; inline notification; do not close.
 *   - 1. PopupController handler (e.g. handleShowHoverboard):
 *   - 2.   AWAIT send message (e.g. TOGGLE_OVERLAY)
 *   - 3.   StateManager.update(...); UIManager.updateShowHoverButtonState(...)
 *   - 4.   INLINE notification if needed; DO NOT call window.close
 *   - How (sub-block): On open sync overlay state to StateManager and UIManager.
 *   - 5. ON popup open: SEND GET_OVERLAY_STATE; SYNC state to StateManager and UIManager
 * 
 * ## CLASSIFY_SCRIPT_INJECTION_URL
 * 
 * - [IMPL-POPUP_SESSION] [IMPL-SUGGESTED_TAGS] [ARCH-SUGGESTED_TAGS] [REQ-SUGGESTED_TAGS_FROM_CONTENT] How: Shared pure classifier in src/shared/script-injection-eligibility.js for browser-forbidden (non-scriptable) URLs vs injectable http(s). Distinct from user inhibit URLs (IMPL-URL_INHIBITION). Used by canInjectIntoTab, loadSuggestedTags, updateOverlayState, injectContentScript.
 * - Contract:
 *   - INPUT: url (string | unknown); optional error object for classifyScriptInjectionError
 *   - PRE: true (total on any input shape)
 *   - OUTPUT: { injectable: boolean, reason: missing_url | restricted_scheme | extensions_gallery | ok } | classifyScriptInjectionError -> reason | null
 *   - POST:
 *     - success => reason codes are closed-set; injectable true only when reason is ok
 *     - restricted schemes / gallery hosts / missing url => injectable false
 *   - FAILURE_MODES: none (total, no throw)
 *   - DATA: gallery host allowlist (chromewebstore.google.com; chrome.google.com/webstore; microsoftedge.microsoft.com/addons)
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: CLASSIFY_SCRIPT_INJECTION_URL
 *   - IF url not non-empty string: RETURN { injectable: false, reason: missing_url }
 *   - IF scheme in chrome:// | chrome-extension:// | edge:// | about: | devtools:// | view-source: OR not http(s): RETURN { injectable: false, reason: restricted_scheme }
 *   - IF isExtensionsGalleryUrl(url): RETURN { injectable: false, reason: extensions_gallery }
 *   - RETURN { injectable: true, reason: ok }
 *   - How (sub-block): classifyScriptInjectionError(error) maps Chrome rejection text to extensions_gallery | restricted_scheme | null (unexpected).
 * 
 * ## SKIP_NON_SCRIPTABLE_INJECT
 * 
 * - [IMPL-POPUP_SESSION] [IMPL-UI_INSPECTOR] [ARCH-SUGGESTED_TAGS] [REQ-SUGGESTED_TAGS_FROM_CONTENT] [REQ-UI_INSPECTION] How: Precheck before suggested-tags / overlay-state / content inject — CLASSIFY_SCRIPT_INJECTION_URL; non-scriptable → skip scripting, recordAction injectionOutcome, debugLog/warn (not debugError); unexpected failures remain debugError.
 * - Contract:
 *   - INPUT: currentTab.url; phase (suggested_tags | overlay_state | inject); optional refresh trigger/surface
 *   - PRE: classifier available; ui-inspector may be disabled (recordAction no-ops)
 *   - OUTPUT: skip (empty suggested / false overlay / no inject) | proceed to scripting | { error: UnexpectedInjectFailed }
 *   - POST:
 *     - expected skip => injectionOutcome recorded; no chrome.scripting call; no debugError
 *     - injectable ok => scripting may proceed
 *   - FAILURE_MODES: UnexpectedInjectFailed
 *   - DATA: _refreshTrigger, _refreshSurface for inspector attribution
 *   - DATA_TRANSITION: on skip, suggested tags cleared or overlay button forced off as phase dictates; else unchanged until inject path runs
 *   - EFFECTS: IO, State, Async
 *   - TERMINATION: total
 * - PROCEDURE: SKIP_NON_SCRIPTABLE_INJECT
 *   - classif = classifyScriptInjectionUrl(tab.url)
 *   - IF NOT classif.injectable:
 *   -   recordAction injectionOutcome { phase, reason: classif.reason, injectable: false, trigger, surface }
 *   -   debugLog/warn; APPLY phase skip; RETURN
 *   - TRY scripting path
 *   - CATCH err:
 *   -   expected = classifyScriptInjectionError(err)
 *   -   IF expected: recordAction injectionOutcome { reason: expected }; debugWarn; RETURN
 *   -   debugError; RETURN error UnexpectedInjectFailed
 * 
 * ## OBSERVER_BOOKMARK_UPDATED_FULL_REFRESH
 * 
 * - [IMPL-POPUP_SESSION] [IMPL-BOOKMARK_STATE_SYNC] [ARCH-POPUP_SESSION] [ARCH-MESSAGE_HANDLING] [REQ-POPUP_PERSISTENT_SESSION] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] How: setupRealTimeUpdates BOOKMARK_UPDATED watcher is an observer listener (see IMPL-MESSAGE_HANDLING UNWRAP_MESSAGE_RESPONSE / IMPL-BOOKMARK_STATE_SYNC OBSERVER_BOOKMARK_UPDATED_FULL_REFRESH): sync function, return undefined, detached refreshPopupData then updateOverlayState.
 * - Contract:
 *   - INPUT: runtime.onMessage envelope
 *   - PRE: setupRealTimeUpdates registered
 *   - OUTPUT: undefined; refresh may run asynchronously
 *   - POST:
 *     - success => response channel not claimed
 *   - FAILURE_MODES: RefreshFailed (caught in detached chain)
 *   - DATA: PopupController session
 *   - DATA_TRANSITION: on BOOKMARK_UPDATED success path, This Page + overlay state refreshed
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: OBSERVER_BOOKMARK_UPDATED_FULL_REFRESH
 *   - REGISTER runtime.onMessage as synchronous function:
 *   -   IF message?.type !== 'BOOKMARK_UPDATED': RETURN undefined
 *   -   START detached refresh (refreshPopupData then updateOverlayState); CATCH → debugError
 *   -   RETURN undefined
 * 
 * === END IMPL-FULL-BLOCK: IMPL-POPUP_SESSION ===
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
 * === END IMPL-FULL-BLOCK: IMPL-MESSAGE_HANDLING ===
 */
import fs from 'fs'
import path from 'path'
import { PopupController } from '../../src/ui/popup/PopupController.js'

const SRC_DIR = path.resolve(__dirname, '../../src')

function collectJsFiles (dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return collectJsFiles(full)
    return entry.isFile() && full.endsWith('.js') ? [full] : []
  })
}

function makeController () {
  return new PopupController({
    errorHandler: { handle: jest.fn() },
    stateManager: { setState: jest.fn() },
    uiManager: {
      updateShowHoverButtonState: jest.fn(),
      updateSuggestedTags: jest.fn(),
      showError: jest.fn(),
      showSuccess: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      setLoading: jest.fn(),
      updateCurrentTags: jest.fn(),
      updatePrivateStatus: jest.fn(),
      updateReadLaterStatus: jest.fn(),
      updateConnectionStatus: jest.fn()
    }
  })
}

describe('[IMPL-POPUP_SESSION] PopupController runtime.onMessage observer listeners', () => {
  let listeners

  beforeEach(() => {
    chrome.runtime.onMessage.addListener.mockClear()
    makeController()
    listeners = chrome.runtime.onMessage.addListener.mock.calls.map((call) => call[0])
  })

  test('at least one BOOKMARK_UPDATED observer listener is registered', () => {
    expect(listeners.length).toBeGreaterThan(0)
  })

  test('unrelated message types get no response and no promise from any listener', () => {
    for (const listener of listeners) {
      const sendResponse = jest.fn()
      const result = listener({ type: 'getTabId', data: { url: 'https://example.com/' } }, {}, sendResponse)

      expect(result).toBeUndefined()
      expect(sendResponse).not.toHaveBeenCalled()
    }
  })

  test('BOOKMARK_UPDATED still refreshes without claiming the response channel', async () => {
    const controller = makeController()
    const registered = chrome.runtime.onMessage.addListener.mock.calls
      .map((call) => call[0])
      .slice(listeners.length)

    controller.currentTab = { id: 5, url: 'https://example.com/' }
    controller.getBookmarkData = jest.fn().mockResolvedValue({ tags: ['a'], shared: 'yes', toread: 'no' })
    controller.refreshTagFrequencyMapForSort = jest.fn().mockResolvedValue(undefined)
    controller.refreshPopupData = jest.fn().mockResolvedValue(undefined)
    controller.updateOverlayState = jest.fn().mockResolvedValue(undefined)

    for (const listener of registered) {
      const sendResponse = jest.fn()
      expect(listener({ type: 'BOOKMARK_UPDATED' }, {}, sendResponse)).toBeUndefined()
      expect(sendResponse).not.toHaveBeenCalled()
    }

    await new Promise((resolve) => setTimeout(resolve, 0))

    const refreshed = controller.refreshPopupData.mock.calls.length + controller.getBookmarkData.mock.calls.length
    expect(refreshed).toBeGreaterThan(0)
  })

  test('both observer paths fire: applyExternalBookmarkUpdate and refreshOnExternalBookmarkUpdate', async () => {
    chrome.runtime.onMessage.addListener.mockClear()
    const controller = makeController()
    const registered = chrome.runtime.onMessage.addListener.mock.calls.map((call) => call[0])
    expect(registered.length).toBeGreaterThanOrEqual(2)

    controller.currentTab = { id: 5, url: 'https://example.com/' }
    controller.applyExternalBookmarkUpdate = jest.fn().mockResolvedValue(undefined)
    controller.refreshOnExternalBookmarkUpdate = jest.fn().mockResolvedValue(undefined)

    for (const listener of registered) {
      expect(listener({ type: 'BOOKMARK_UPDATED' }, {}, jest.fn())).toBeUndefined()
    }

    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(controller.applyExternalBookmarkUpdate).toHaveBeenCalled()
    expect(controller.refreshOnExternalBookmarkUpdate).toHaveBeenCalled()
  })
})

describe('[ARCH-MESSAGE_HANDLING] source contract: no async onMessage listeners', () => {
  test('no src file registers onMessage.addListener with an async function', () => {
    const offenders = collectJsFiles(SRC_DIR).filter((file) =>
      /onMessage\.addListener\(\s*async/.test(fs.readFileSync(file, 'utf8'))
    )

    expect(offenders.map((file) => path.relative(SRC_DIR, file))).toEqual([])
  })
})
