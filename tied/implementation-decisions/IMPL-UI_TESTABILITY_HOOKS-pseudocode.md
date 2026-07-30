# [IMPL-UI_TESTABILITY_HOOKS] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION] [REQ-MODULE_VALIDATION] — setOnMessageProcessed, setOnAction, setOnStateChange so tests assert without DOM. Contract: callbacks set by tests; message/action/state trigger callbacks.

## MAIN

- [IMPL-UI_TESTABILITY_HOOKS] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION] [REQ-MODULE_VALIDATION] How: Logical block for IMPL-UI_TESTABILITY_HOOKS.
- Contract:
  - INPUT: optional callback fn (set by tests); message (processMessage); popup/overlay action or state change
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: test can assert on message payload, action id, state without DOM
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: MessageHandler._onMessageProcessed; PopupController._onAction, _onStateChange; OverlayManager._onStateChange
  - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
  - EFFECTS: IO, State
  - TERMINATION: total
- PROCEDURE: MAIN
  - How (sub-block): After processMessage invoke callback with msg/result.
  - 1. MessageHandler: AFTER processMessage(msg): IF _onMessageProcessed: CALL with msg/result
  - How (sub-block): On action/state change invoke callbacks.
  - 2. PopupController: ON action: IF _onAction: CALL with actionId; ON state change: IF _onStateChange: CALL with state
  - 3. OverlayManager: ON visibility/content change: IF _onStateChange: CALL with { visible, contentSnapshot }
  - How (sub-block): Set callbacks, trigger, assert args.
  - 4. Tests: SET callbacks; TRIGGER message/action; ASSERT callback invoked with expected args
