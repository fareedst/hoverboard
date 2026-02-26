# Extension Messaging Protocols

[ARCH-MESSAGE_HANDLING] [IMPL-MESSAGE_HANDLING]

Short reference for which process handles which message types and over which channel.

## Service worker listener

- **OPEN_SIDE_PANEL**: Handled in `onMessage` listener only (synchronous); not passed to `handleMessage`. Response: `{ success: true }` or `{ success: false, error }`.
- **NATIVE_PING**: Handled in `handleMessage`; does not call `messageHandler.processMessage`. Response: `{ success: true, data: pingResult }`.
- **SWITCH_STORAGE_MODE**: Handled in `handleMessage`; re-inits bookmark provider; does not call `processMessage`. Response: `{ success: true, data: { switched: true } }`.
- **DEV_COMMAND**: Handled in `handleMessage` when debug enabled (subcommands: getStorageSnapshot, getLastActions, getLastMessages); does not call `processMessage`. Response: `{ success: true, data }` or `{ success: false, error }`.
- **All other types**: Passed to `messageHandler.processMessage(message, sender)`. Response wrapped as `{ success: true, data: response }` or `{ success: false, error: error.message }`.

## Content script listener

- **GET_PAGE_CONTENT**: Handled by early listener (before init) in content-main.js. Response: `{ success: true, data }` (readability result) or `{ success: false, error }`.
- **CONTENT_MESSAGE_TYPES** (see `src/shared/ui-action-contract.js`): TOGGLE_HOVER, HIDE_OVERLAY, REFRESH_DATA, REFRESH_HOVER, CLOSE_IF_TO_READ, PING, SHOW_BOOKMARK_DIALOG, TOGGLE_HOVER_OVERLAY, UPDATE_CONFIG, updateOverlayTransparency, CHECK_PAGE_STATE, BOOKMARK_UPDATED, TAG_UPDATED, GET_OVERLAY_STATE.
- **GET_PAGE_SELECTION**: Handled in content script; not in CONTENT_MESSAGE_TYPES list. Response: `{ success: true, data: { selection } }`.
- **Unknown type**: `sendResponse({ success: false, error: 'Unknown message type' })`.

## Offscreen document

- **READ_FILE_BOOKMARKS**: Response `{ error: null, data: { version, bookmarks } }` or `{ error: string, data: null }`.
- **WRITE_FILE_BOOKMARKS**: Response `{ error: null, success: true }` or `{ error: string, success: false }`.
- **Unknown type**: Listener returns `false` (no sendResponse).

## Channels

| Channel | Sender(s) | Receiver | API |
|---------|-----------|----------|-----|
| UI → SW | Popup, Options, Side panel, Content | Service worker | `chrome.runtime.sendMessage` |
| SW → Content | Service worker | Content script | `chrome.tabs.sendMessage` |
| Popup → Content | Popup | Content (active tab) | `chrome.tabs.sendMessage` (sendToTab) |
| SW → Offscreen | Service worker (MessageFileBookmarkAdapter) | Offscreen doc | `chrome.runtime.sendMessage` |
