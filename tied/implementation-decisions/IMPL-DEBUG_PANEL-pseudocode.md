# [IMPL-DEBUG_PANEL] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION]
# Debug logging by category and debug panel showing last actions, messages, and current bookmark/backend.
# Contract: inputs, outputs, and data for logging and panel.
INPUT: LOG_CATEGORIES (ui, message, overlay, storage); optional debug panel open
OUTPUT: debugLogger.trace/debug in message-handler, PopupController, content-main; debug panel shows last actions, last messages, current bookmark/tags/backend
DATA: debug-logger.js; debug.html + debug.js; inspector ring buffers

# Logging: emit trace/debug when category enabled.
Logging: WHEN category enabled: debugLogger.trace(msg) or debugLogger.debug(msg) with category

# Debug panel: on load request last actions/messages/current bookmark and render.
Debug panel (debug.html): ON load SEND DEV_COMMAND getLastActions/getLastMessages/getCurrentBookmark (or getStorageSnapshot); RENDER in panel
