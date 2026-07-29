# [IMPL-UI_INSPECTOR] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION]
# recordMessage/recordAction ring buffers; getLastMessages/getLastActions; debug-gated.
# Contract: message or action in; ring buffers and getters; enabled flag.
INPUT: message (recordMessage); action (recordAction); gated by DEBUG_HOVERBOARD_UI or setEnabled(true)
OUTPUT: ring buffers of last N messages and last N actions; getLastMessages(), getLastActions()
DATA: message ring buffer; action ring buffer; enabled flag

# Append to buffer when enabled; drop oldest if full.
recordMessage(msg): IF enabled: APPEND to message buffer; DROP oldest if full
recordAction(action): IF enabled: APPEND to action buffer; DROP oldest if full

# Return copy of buffers.
getLastMessages(), getLastActions(): RETURN copy of buffer(s)

# Service-worker records message; PopupController/content record action.
Wiring: service-worker after handle message -> recordMessage; PopupController/content-main on action -> recordAction
