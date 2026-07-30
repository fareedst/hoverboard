# [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] — PopupController handlers await messages; StateManager and UIManager updates; no window.close. Contract: user actions and GET_OVERLAY_STATE; popup open and state/UI in sync.

## MAIN

- [IMPL-POPUP_SESSION] [ARCH-POPUP_SESSION] [REQ-POPUP_PERSISTENT_SESSION] How: Logical block for IMPL-POPUP_SESSION.
- Contract:
  - INPUT: user actions (show overlay, toggle private, save, etc.); GET_OVERLAY_STATE fallback
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: popup stays open; state and UI updated; no window.close
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: StateManager (overlay visible, bookmark, etc.); UIManager (button states, labels)
  - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
  - EFFECTS: Async, IO, State
  - TERMINATION: total
- PROCEDURE: MAIN
  - How (sub-block): Await message; update state and UI; inline notification; do not close.
  - 1. PopupController handler (e.g. handleShowHoverboard):
  - 2.   AWAIT send message (e.g. TOGGLE_OVERLAY)
  - 3.   StateManager.update(...); UIManager.updateShowHoverButtonState(...)
  - 4.   INLINE notification if needed; DO NOT call window.close
  - How (sub-block): On open sync overlay state to StateManager and UIManager.
  - 5. ON popup open: SEND GET_OVERLAY_STATE; SYNC state to StateManager and UIManager

## CLASSIFY_SCRIPT_INJECTION_URL

- [IMPL-POPUP_SESSION] [IMPL-SUGGESTED_TAGS] [ARCH-SUGGESTED_TAGS] [REQ-SUGGESTED_TAGS_FROM_CONTENT] How: Shared pure classifier in src/shared/script-injection-eligibility.js for browser-forbidden (non-scriptable) URLs vs injectable http(s). Distinct from user inhibit URLs (IMPL-URL_INHIBITION). Used by canInjectIntoTab, loadSuggestedTags, updateOverlayState, injectContentScript.
- Contract:
  - INPUT: url (string | unknown); optional error object for classifyScriptInjectionError
  - PRE: true (total on any input shape)
  - OUTPUT: { injectable: boolean, reason: missing_url | restricted_scheme | extensions_gallery | ok } | classifyScriptInjectionError -> reason | null
  - POST:
    - success => reason codes are closed-set; injectable true only when reason is ok
    - restricted schemes / gallery hosts / missing url => injectable false
  - FAILURE_MODES: none (total, no throw)
  - DATA: gallery host allowlist (chromewebstore.google.com; chrome.google.com/webstore; microsoftedge.microsoft.com/addons)
  - EFFECTS: pure
  - TERMINATION: total
- PROCEDURE: CLASSIFY_SCRIPT_INJECTION_URL
  - IF url not non-empty string: RETURN { injectable: false, reason: missing_url }
  - IF scheme in chrome:// | chrome-extension:// | edge:// | about: | devtools:// | view-source: OR not http(s): RETURN { injectable: false, reason: restricted_scheme }
  - IF isExtensionsGalleryUrl(url): RETURN { injectable: false, reason: extensions_gallery }
  - RETURN { injectable: true, reason: ok }
  - How (sub-block): classifyScriptInjectionError(error) maps Chrome rejection text to extensions_gallery | restricted_scheme | null (unexpected).

## SKIP_NON_SCRIPTABLE_INJECT

- [IMPL-POPUP_SESSION] [IMPL-UI_INSPECTOR] [ARCH-SUGGESTED_TAGS] [REQ-SUGGESTED_TAGS_FROM_CONTENT] [REQ-UI_INSPECTION] How: Precheck before suggested-tags / overlay-state / content inject — CLASSIFY_SCRIPT_INJECTION_URL; non-scriptable → skip scripting, recordAction injectionOutcome, debugLog/warn (not debugError); unexpected failures remain debugError.
- Contract:
  - INPUT: currentTab.url; phase (suggested_tags | overlay_state | inject); optional refresh trigger/surface
  - PRE: classifier available; ui-inspector may be disabled (recordAction no-ops)
  - OUTPUT: skip (empty suggested / false overlay / no inject) | proceed to scripting | { error: UnexpectedInjectFailed }
  - POST:
    - expected skip => injectionOutcome recorded; no chrome.scripting call; no debugError
    - injectable ok => scripting may proceed
  - FAILURE_MODES: UnexpectedInjectFailed
  - DATA: _refreshTrigger, _refreshSurface for inspector attribution
  - DATA_TRANSITION: on skip, suggested tags cleared or overlay button forced off as phase dictates; else unchanged until inject path runs
  - EFFECTS: IO, State, Async
  - TERMINATION: total
- PROCEDURE: SKIP_NON_SCRIPTABLE_INJECT
  - classif = classifyScriptInjectionUrl(tab.url)
  - IF NOT classif.injectable:
  -   recordAction injectionOutcome { phase, reason: classif.reason, injectable: false, trigger, surface }
  -   debugLog/warn; APPLY phase skip; RETURN
  - TRY scripting path
  - CATCH err:
  -   expected = classifyScriptInjectionError(err)
  -   IF expected: recordAction injectionOutcome { reason: expected }; debugWarn; RETURN
  -   debugError; RETURN error UnexpectedInjectFailed

## OBSERVER_BOOKMARK_UPDATED_FULL_REFRESH

- [IMPL-POPUP_SESSION] [IMPL-BOOKMARK_STATE_SYNC] [ARCH-POPUP_SESSION] [ARCH-MESSAGE_HANDLING] [REQ-POPUP_PERSISTENT_SESSION] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] How: setupRealTimeUpdates BOOKMARK_UPDATED watcher is an observer listener (see IMPL-MESSAGE_HANDLING UNWRAP_MESSAGE_RESPONSE / IMPL-BOOKMARK_STATE_SYNC OBSERVER_BOOKMARK_UPDATED_FULL_REFRESH): sync function, return undefined, detached refreshPopupData then updateOverlayState.
- Contract:
  - INPUT: runtime.onMessage envelope
  - PRE: setupRealTimeUpdates registered
  - OUTPUT: undefined; refresh may run asynchronously
  - POST:
    - success => response channel not claimed
  - FAILURE_MODES: RefreshFailed (caught in detached chain)
  - DATA: PopupController session
  - DATA_TRANSITION: on BOOKMARK_UPDATED success path, This Page + overlay state refreshed
  - EFFECTS: Async, IO, State
  - TERMINATION: total
- PROCEDURE: OBSERVER_BOOKMARK_UPDATED_FULL_REFRESH
  - REGISTER runtime.onMessage as synchronous function:
  -   IF message?.type !== 'BOOKMARK_UPDATED': RETURN undefined
  -   START detached refresh (refreshPopupData then updateOverlayState); CATCH → debugError
  -   RETURN undefined
