# [IMPL-SYNC_BOOKMARK_SERVICE] [ARCH-SYNC_STORAGE_PROVIDER] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-PER_BOOKMARK_STORAGE_BACKEND]
# chrome.storage.sync peer provider under five-provider BookmarkRouter; same contract as LocalBookmarkService; quota ~100 KB.
# Contract: url/bookmark/tag inputs and provider-shaped outputs; sync key and shape.
INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
OUTPUT: bookmark object or list of bookmarks or success/error; same provider contract as LocalBookmarkService
DATA: chrome.storage.sync key = hoverboard_sync_bookmarks; value = object keyed by URL -> bookmark (quota ~100 KB)

# Read from sync storage and return parsed object or {}.
LOAD bookmarks:
  READ from chrome.storage.sync under key
  RETURN parsed object (or {} if missing)

# Lookup by normalized URL.
getBookmarkForUrl(url):
  bookmarks = LOAD bookmarks
  RETURN bookmarks[normalize(url)] or null

# Merge data and persist to sync.
saveBookmark(data):
  bookmarks = LOAD bookmarks
  bookmarks[normalize(data.url)] = merge(data into bookmark shape)
  PERSIST bookmarks to chrome.storage.sync
  RETURN { success: true }

# Update bookmarks/tags and persist; return success.
deleteBookmark(url), saveTag(data), deleteTag(data):
  UPDATE bookmarks; PERSIST;       RETURN { success: true }

# Sort by time descending and return first count.
getRecentBookmarks(count):
  list = values(LOAD bookmarks); SORT BY time DESCENDING; RETURN list[0..count-1]
