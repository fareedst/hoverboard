# [IMPL-DEV_COMMAND_INSPECTION] [REQ-UI_INSPECTION] [REQ-URL_TAGS_DISPLAY] [REQ-PER_BOOKMARK_STORAGE_BACKEND] — DEV_COMMAND routing for current bookmark, tags, backend, and storage snapshot (debug-gated). Contract: message shape, returned data, and handler locations.

## PROCESS_DEV_COMMAND

- [IMPL-DEV_COMMAND_INSPECTION] [REQ-UI_INSPECTION] [REQ-URL_TAGS_DISPLAY] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Implements processDevCommand(cmd) behavior for IMPL-DEV_COMMAND_INSPECTION.
- Contract:
  - INPUT: DEV_COMMAND message with subcommand (getCurrentBookmark | getTagsForUrl | getStorageBackendForUrl | getStorageSnapshot); optional url/context
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: current bookmark for URL, tags for URL, backend for URL, or storage key list (SW only); gated by DEBUG_HOVERBOARD_UI
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: MessageHandler.processDevCommand; service worker getStorageSnapshot
  - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
  - EFFECTS: IO, State
  - TERMINATION: total
- PROCEDURE: PROCESS_DEV_COMMAND
  - IF subcommand getCurrentBookmark: RETURN bookmarkRouter.getBookmarkForUrl(url) or current tab url
  - IF getTagsForUrl: RETURN tags for url
  - IF getStorageBackendForUrl: RETURN storageIndex.getBackendForUrl(url)
  - IF getStorageSnapshot (SW): RETURN list of storage key names only
