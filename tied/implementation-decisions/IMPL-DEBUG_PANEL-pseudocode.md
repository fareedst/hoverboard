# [IMPL-DEBUG_PANEL] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION] — Debug logging by category and debug panel showing last actions, messages, and current bookmark/backend. Contract: inputs, outputs, and data for logging and panel.

## MAIN

- [IMPL-DEBUG_PANEL] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION] How: Logical block for IMPL-DEBUG_PANEL.
- Contract:
  - INPUT: LOG_CATEGORIES (ui, message, overlay, storage); optional debug panel open
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: debugLogger.trace/debug in message-handler, PopupController, content-main; debug panel shows last actions, last messages, current bookmark/tags/backend
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: debug-logger.js; debug.html + debug.js; inspector ring buffers
  - EFFECTS: IO
  - TERMINATION: total
- PROCEDURE: MAIN
  - How (sub-block): Logging: emit trace/debug when category enabled.
  - 1. Logging: WHEN category enabled: debugLogger.trace(msg) or debugLogger.debug(msg) with category
  - How (sub-block): Debug panel: on load request last actions/messages/current bookmark and render.
  - 2. Debug panel (debug.html): ON load SEND DEV_COMMAND getLastActions/getLastMessages/getCurrentBookmark (or getStorageSnapshot); RENDER in panel

## MESSAGE_DISPATCH_TESTABILITY

- [IMPL-DEBUG_PANEL] [IMPL-MESSAGE_HANDLING] [IMPL-UI_TESTABILITY_HOOKS] [ARCH-UI_TESTABILITY] [ARCH-MESSAGE_HANDLING] [REQ-UI_INSPECTION] [REQ-MODULE_VALIDATION] How: Consumes the message-processing callback seam to expose diagnostics without requiring the debug panel UI.
- Contract:
  - INPUT: processed message/result and debug inspector callback
  - PRE: debug inspector callback is registered
  - OUTPUT: observable diagnostic action containing message/result
  - POST:
    - success => diagnostic callback receives the processed message and result
  - EFFECTS: State
  - TERMINATION: total
- PROCEDURE: MESSAGE_DISPATCH_TESTABILITY
  - REGISTER inspector callback
  - AWAIT message processing
  - CALL inspector callback with message and result
  - RETURN diagnostic observation
