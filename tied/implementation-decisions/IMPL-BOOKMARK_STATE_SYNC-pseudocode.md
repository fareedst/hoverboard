# [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] — BOOKMARK_UPDATED broadcast after overlay persist; popup and badge refresh so state is consistent.

## MAIN

- [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] How: Logical block for IMPL-BOOKMARK_STATE_SYNC.
- Contract:
  - INPUT: user actions (overlay toggle, tag save/delete, bookmark save); processMessage result
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: consistent bookmark state across overlay, popup, badge
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: overlay state, popup state, badge state; BOOKMARK_UPDATED broadcast
  - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
  - EFFECTS: Async, Http, IO, State
  - TERMINATION: total
- PROCEDURE: MAIN
  - How (sub-block): Send message to backend; on success broadcast BOOKMARK_UPDATED.
  - 1. ON overlay toggle (saveBookmark / saveTag / deleteTag):
  - 2.   SEND message to backend; await processMessage result
  - 3.   BROADCAST BOOKMARK_UPDATED (so other surfaces can refresh)
  - How (sub-block): On saveTag/deleteTag/saveBookmark result compare tab URL state and update icon/count.
  - 4. Badge manager:
  - 5.   ON message result (saveTag | deleteTag | saveBookmark): compare current tab URL state with stored state; UPDATE badge icon/count

## OBSERVER_BOOKMARK_UPDATED_APPLY_EXTERNAL

- [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [ARCH-MESSAGE_HANDLING] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] How: Constructor-path observer listener — synchronous, returns undefined, re-fetches pin/tags via applyExternalBookmarkUpdate in a detached promise. Distinct from setupRealTimeUpdates full refresh (IMPL-POPUP_SESSION OBSERVER_BOOKMARK_UPDATED_FULL_REFRESH). Chrome 144+ treats a promise-returning listener as answering and would deliver null to the SW sender.
- Contract:
  - INPUT: runtime.onMessage envelope (any type); BOOKMARK_UPDATED triggers refresh
  - PRE: PopupController constructed; chrome.runtime.onMessage available when registering
  - OUTPUT: undefined (never a Promise, never sendResponse); pin/tags UI may update asynchronously
  - POST:
    - success => listener returned undefined; unrelated types left the response channel free
    - BOOKMARK_UPDATED => detached applyExternalBookmarkUpdate started (or no-op when no currentTab)
  - FAILURE_MODES: RefreshFailed (caught inside detached chain; debugError; does not answer message)
  - DATA: currentTab; currentPin; UIManager tag/privacy/read-later widgets
  - DATA_TRANSITION: on BOOKMARK_UPDATED success path, currentPin and chip UI updated from re-fetch; else unchanged
  - EFFECTS: Async, IO, State
  - TERMINATION: total
- PROCEDURE: OBSERVER_BOOKMARK_UPDATED_APPLY_EXTERNAL
  - REGISTER runtime.onMessage as synchronous function:
  -   IF message?.type !== 'BOOKMARK_UPDATED': RETURN undefined
  -   START detached applyExternalBookmarkUpdate(); CATCH → debugError
  -   RETURN undefined

## OBSERVER_BOOKMARK_UPDATED_FULL_REFRESH

- [IMPL-BOOKMARK_STATE_SYNC] [IMPL-POPUP_SESSION] [ARCH-BOOKMARK_STATE_SYNC] [ARCH-POPUP_SESSION] [ARCH-MESSAGE_HANDLING] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] [REQ-POPUP_PERSISTENT_SESSION] How: setupRealTimeUpdates observer — synchronous, returns undefined, runs refreshOnExternalBookmarkUpdate (refreshPopupData then updateOverlayState) in a detached promise. Complements constructor applyExternalBookmarkUpdate path; duplicate refresh is an accepted non-goal.
- Contract:
  - INPUT: runtime.onMessage envelope (any type); BOOKMARK_UPDATED triggers full refresh
  - PRE: setupRealTimeUpdates registered; controller may be initialized
  - OUTPUT: undefined; full This Page refresh may run asynchronously
  - POST:
    - success => listener returned undefined; response channel not claimed
    - BOOKMARK_UPDATED => detached refreshPopupData + updateOverlayState started
  - FAILURE_MODES: RefreshFailed (caught inside detached chain; debugError)
  - DATA: PopupController session state; overlay button state
  - DATA_TRANSITION: on success path, bookmark/suggested/overlay UI refreshed; else unchanged
  - EFFECTS: Async, IO, State
  - TERMINATION: total
- PROCEDURE: OBSERVER_BOOKMARK_UPDATED_FULL_REFRESH
  - REGISTER runtime.onMessage as synchronous function:
  -   IF message?.type !== 'BOOKMARK_UPDATED': RETURN undefined
  -   START detached refreshOnExternalBookmarkUpdate(); CATCH → debugError
  -   RETURN undefined
