# [IMPL-STORAGE_INDEX] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-PER_BOOKMARK_STORAGE_BACKEND] [REQ-BROWSER_BOOKMARK_STORAGE]
# Per-URL backend in chrome.storage.local; getIndex, getBackendForUrl, setBackendForUrl, removeUrl; migration from local bookmarks.
# Contract: storage key and optional provider; index map and persistence.
INPUT: storage key (hoverboard_storage_index), optional localBookmarkProvider for migration
OUTPUT: index map url -> backend (pinboard|local|file|sync|browser)
DATA: index = map of url string to backend string; persisted in chrome.storage.local; VALID_BACKENDS includes browser

# Load and return index from storage (or {}).
getIndex():
  LOAD index from storage under key
  RETURN index (or empty map if missing)

# Lookup backend for URL.
getBackendForUrl(url):
  index = getIndex()
  RETURN index[url] or null

# Set backend for URL and persist.
setBackendForUrl(url, backend):
  index = getIndex()
  SET index[url] = backend
  PERSIST index to storage

# Remove URL from index and persist.
removeUrl(url):
  index = getIndex()
  REMOVE index[url]
  PERSIST index to storage

# Seed index from local bookmarks when empty.
migration (on first use or when index empty):
  IF getIndex() is empty AND localBookmarkProvider given:
    bookmarks = localBookmarkProvider.getAllBookmarks()
    FOR each bookmark WITH url:
      setBackendForUrl(url, "local")
