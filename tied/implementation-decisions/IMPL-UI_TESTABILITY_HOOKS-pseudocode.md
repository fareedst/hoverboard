# [IMPL-UI_TESTABILITY_HOOKS] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION] [REQ-MODULE_VALIDATION]
# setOnMessageProcessed, setOnAction, setOnStateChange so tests assert without DOM.
# Contract: callbacks set by tests; message/action/state trigger callbacks.
INPUT: optional callback fn (set by tests); message (processMessage); popup/overlay action or state change
OUTPUT: test can assert on message payload, action id, state without DOM
DATA: MessageHandler._onMessageProcessed; PopupController._onAction, _onStateChange; OverlayManager._onStateChange

# After processMessage invoke callback with msg/result.
MessageHandler: AFTER processMessage(msg): IF _onMessageProcessed: CALL with msg/result
# On action/state change invoke callbacks.
PopupController: ON action: IF _onAction: CALL with actionId; ON state change: IF _onStateChange: CALL with state
OverlayManager: ON visibility/content change: IF _onStateChange: CALL with { visible, contentSnapshot }

# Set callbacks, trigger, assert args.
Tests: SET callbacks; TRIGGER message/action; ASSERT callback invoked with expected args
