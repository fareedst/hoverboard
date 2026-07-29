# [IMPL-DEV_COMMAND_INSPECTION] [REQ-UI_INSPECTION] [REQ-URL_TAGS_DISPLAY] [REQ-PER_BOOKMARK_STORAGE_BACKEND]
# DEV_COMMAND routing for current bookmark, tags, backend, and storage snapshot (debug-gated).
# Contract: message shape, returned data, and handler locations.
INPUT: DEV_COMMAND message with subcommand (getCurrentBookmark | getTagsForUrl | getStorageBackendForUrl | getStorageSnapshot); optional url/context
OUTPUT: current bookmark for URL, tags for URL, backend for URL, or storage key list (SW only); gated by DEBUG_HOVERBOARD_UI
DATA: MessageHandler.processDevCommand; service worker getStorageSnapshot

# Dispatch by subcommand and return bookmark/tags/backend/snapshot.
processDevCommand(cmd):
  IF subcommand getCurrentBookmark: RETURN bookmarkRouter.getBookmarkForUrl(url) or current tab url
  IF getTagsForUrl: RETURN tags for url
  IF getStorageBackendForUrl: RETURN storageIndex.getBackendForUrl(url)
  IF getStorageSnapshot (SW): RETURN list of storage key names only
