# [IMPL-UI_INSPECTOR] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION] — recordMessage/recordAction ring buffers; getLastMessages/getLastActions; debug-gated. Contract: message or action in; ring buffers and getters; enabled flag.

## MAIN

- [IMPL-UI_INSPECTOR] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION] How: Logical block for IMPL-UI_INSPECTOR.
- Contract:
  - INPUT: message (recordMessage); action (recordAction); gated by DEBUG_HOVERBOARD_UI or setEnabled(true)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: ring buffers of last N messages and last N actions; getLastMessages(), getLastActions()
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: message ring buffer; action ring buffer; enabled flag
  - EFFECTS: pure
  - TERMINATION: total
- PROCEDURE: MAIN
  - How (sub-block): Append to buffer when enabled; drop oldest if full.
  - 1. recordMessage(msg): IF enabled: APPEND to message buffer; DROP oldest if full
  - 2. recordAction(action): IF enabled: APPEND to action buffer; DROP oldest if full
  - How (sub-block): Return copy of buffers.
  - 3. getLastMessages(), getLastActions(): RETURN copy of buffer(s)
  - How (sub-block): Service-worker records message; PopupController/content record action.
  - 4. Wiring: service-worker after handle message -> recordMessage; PopupController/content-main on action -> recordAction

## RECORD_INJECTION_OUTCOME

- [IMPL-UI_INSPECTOR] [IMPL-POPUP_SESSION] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION] [REQ-SUGGESTED_TAGS_FROM_CONTENT] How: Observable contract for script-injection skips and results — PopupController/side-panel recordAction({ actionId: "injectionOutcome", surface, payload: { phase, trigger, tabId, urlHost, reason, injectable, errorMessage? } }). testable when setEnabled(true); used by tabChangeRefresh composition and unit inject precheck tests.
- Contract:
  - INPUT: phase, reason, injectable, optional trigger/surface/tabId/urlHost/errorMessage
  - PRE: recordAction available (no-op when inspector disabled)
  - OUTPUT: action appended when enabled
  - POST:
    - success => last actions include injectionOutcome with closed-set reason codes
  - FAILURE_MODES: none
  - DATA: action ring buffer
  - DATA_TRANSITION: buffer grows (or rotates) when enabled; else unchanged
  - EFFECTS: State
  - TERMINATION: total
- PROCEDURE: RECORD_INJECTION_OUTCOME
  - recordAction({ actionId: "injectionOutcome", surface, payload })

## RECORD_MESSAGE_RESPONSE_MISSING

- [IMPL-UI_INSPECTOR] [IMPL-MESSAGE_HANDLING] [ARCH-UI_TESTABILITY] [ARCH-MESSAGE_HANDLING] [REQ-UI_INSPECTION] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] How: Observable contract when runtime reply is null/undefined — content-main recordAction({ actionId: "messageResponseMissing", surface: "content", payload: { type } }) instead of throwing on response.success.
- Contract:
  - INPUT: message type string that expected a reply
  - PRE: unwrapMessageResponse returned null; inspector may be disabled
  - OUTPUT: action appended when enabled; caller keeps defaults
  - POST:
    - success => messageResponseMissing observable; no TypeError
  - FAILURE_MODES: none
  - DATA: action ring buffer
  - DATA_TRANSITION: buffer grows when enabled
  - EFFECTS: State
  - TERMINATION: total
- PROCEDURE: RECORD_MESSAGE_RESPONSE_MISSING
  - recordAction({ actionId: "messageResponseMissing", surface: "content", payload: { type } })
