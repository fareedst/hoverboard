# [IMPL-LOCAL_BOOKMARK_SERVICE] [ARCH-LOCAL_STORAGE_PROVIDER] [REQ-STORAGE_MODE_DEFAULT] [REQ-PER_BOOKMARK_STORAGE_BACKEND]
# chrome.storage.local bookmark provider (one of five BookmarkRouter peers); same contract as Pinboard; keyed by URL.
# ARCH-STORAGE is settings/portability only — not this bookmark backend.
# Contract: url/bookmark/tag inputs and provider-shaped outputs; storage key and shape.
INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
OUTPUT: bookmark object or list of bookmarks or success/error; shape matches provider contract
DATA: storage key = hoverboard_local_bookmarks; value = object keyed by normalized URL -> bookmark

# Read from storage and return parsed object or {}.
LOAD bookmarks:
  READ from storage under key
  RETURN parsed object (or {} if missing)

# Lookup by normalized URL.
getBookmarkForUrl(url):
  bookmarks = LOAD bookmarks
  urlNorm = normalize(url)
  RETURN bookmarks[urlNorm] or null

# Merge data into bookmark shape and persist to storage.
saveBookmark(data):
  bookmarks = LOAD bookmarks
  urlNorm = normalize(data.url)
  bookmarks[urlNorm] = merge(data into bookmark shape with url, description, extended, tags, time, shared, toread, hash)
  PERSIST bookmarks to storage under key
  RETURN { success: true }

# Remove by normalized URL and persist.
deleteBookmark(url):
  bookmarks = LOAD bookmarks
  REMOVE bookmarks[normalize(url)]
  PERSIST bookmarks to storage
  RETURN { success: true }

# Update tags on bookmark and persist.
saveTag(data), deleteTag(data):
  bookmark = getBookmarkForUrl(data.url)
  update tags on bookmark
  saveBookmark(bookmark) or equivalent
  RETURN { success: true }

# Sort by time descending and return first count.
getRecentBookmarks(count):
  bookmarks = LOAD bookmarks
  list = values(bookmarks)
  SORT list BY time DESCENDING
  RETURN list[0..count-1]
