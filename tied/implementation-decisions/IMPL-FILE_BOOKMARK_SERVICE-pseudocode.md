# [IMPL-FILE_BOOKMARK_SERVICE] [ARCH-FILE_BOOKMARK_PROVIDER] [REQ-FILE_BOOKMARK_STORAGE]
# File-based bookmark provider via adapter; same contract as Local/Pinboard.
# Contract: url/bookmark/tag inputs and provider-shaped outputs; adapter and file shape.
INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
OUTPUT: bookmark object or list of bookmarks or success/error; shape matches provider contract
DATA: adapter (readBookmarksFile, writeBookmarksFile); file shape = { version: 1, bookmarks: map url -> bookmark }

# Read file via adapter and return bookmarks map (or {}).
LOAD bookmarks from file:
  data = adapter.readBookmarksFile()
  RETURN data.bookmarks (or {} if missing); in-memory map urlNorm -> bookmark

# Lookup by normalized URL.
getBookmarkForUrl(url):
  bookmarks = LOAD bookmarks from file
  urlNorm = normalize(url)
  RETURN bookmarks[urlNorm] or null

# Merge data into bookmark shape and write file.
saveBookmark(data):
  bookmarks = LOAD bookmarks from file
  urlNorm = normalize(data.url)
  bookmarks[urlNorm] = merge(data into bookmark shape with url, description, extended, tags, time, shared, toread, hash)
  adapter.writeBookmarksFile({ version: 1, bookmarks })
  RETURN { success: true }

# Remove by normalized URL and write file.
deleteBookmark(url):
  bookmarks = LOAD bookmarks from file
  REMOVE bookmarks[normalize(url)]
  adapter.writeBookmarksFile({ version: 1, bookmarks })
  RETURN { success: true }

# Update tags on bookmark and persist.
saveTag(data), deleteTag(data):
  bookmark = getBookmarkForUrl(data.url); update tags; saveBookmark(bookmark) or equivalent
  RETURN { success: true }

# Sort by time descending and return first count.
getRecentBookmarks(count):
  bookmarks = LOAD bookmarks from file
  list = values(bookmarks)
  SORT list BY time DESCENDING
  RETURN list[0..count-1]
