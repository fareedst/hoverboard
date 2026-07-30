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
