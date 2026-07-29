# [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE] [REQ-PER_BOOKMARK_STORAGE_BACKEND]
# chrome.bookmarks provider; same duck-typed contract as LocalBookmarkService; folder path ↔ tags with Chrome root strip; URL collapse.
# Contract: url/bookmark/tag inputs and provider-shaped outputs; native Chrome tree as backing store.
INPUT: url (string), bookmark data (for save), tag data (for saveTag/deleteTag), count (for getRecentBookmarks)
OUTPUT: bookmark object or list of bookmarks or success/error; same provider contract as LocalBookmarkService
DATA: chrome.bookmarks tree; Other Bookmarks folder id = "2"; Bookmarks Bar id = "1"; pin fields shared/toread/extended not stored in Chrome

# [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE]
# Normalize URL the same way as other providers (trim, strip trailing slash).
cleanUrl(url):
  RETURN trim(url) without trailing slashes

# [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE]
# Flatten chrome.bookmarks.getTree to URL items with folderPath and parentIds; strip root segments via ids 1/2 (fallback titles).
LOAD_FLAT_ITEMS:
  tree = chrome.bookmarks.getTree()
  items = flattenTree(tree)  # { id, url, title, dateAdded, folderPath, parentId }
  FOR each item:
    item.tags = folderPathToTags(item.folderPath, { stripRoots: true })
  RETURN items

# [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE]
# Collapse duplicate URLs into one pin-shaped bookmark; merge tags; use earliest dateAdded for time; description from first title.
collapseByUrl(items):
  map = {}
  FOR each item IN items WHERE item.url:
    key = cleanUrl(item.url)
    IF map lacks key:
      map[key] = pinShape(item)  # description=title, time=ISO(dateAdded), tags=item.tags, shared='yes', toread='no', extended='', nodeIds=[item.id]
    ELSE:
      merge tags into map[key].tags (dedupe)
      append item.id to map[key].nodeIds
      IF item.dateAdded earlier: map[key].time = ISO(item.dateAdded)
  RETURN values(map)

# [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE]
# Lookup by URL; return collapsed pin or empty stub.
getBookmarkForUrl(url, title):
  items = LOAD_FLAT_ITEMS filtered by cleanUrl(url)
  IF items empty: RETURN emptyStub(url, title)
  collapsed = collapseByUrl(items)
  RETURN collapsed[0]

# [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE]
# All URL bookmarks for index aggregation (router tags storage='browser').
getAllBookmarks():
  RETURN collapseByUrl(LOAD_FLAT_ITEMS)

# [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE]
# Recent by dateAdded descending.
getRecentBookmarks(count):
  list = getAllBookmarks(); SORT BY time DESCENDING; RETURN list[0..count-1]

# [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE]
# Ensure folder chain under Other Bookmarks (id 2) from tags; create or update all nodes for URL; ignore shared/toread/extended writes.
saveBookmark(data):
  key = cleanUrl(data.url)
  parentId = ENSURE_TAG_FOLDERS(data.tags)  # nested under id "2"; empty tags → parent id "2"
  existing = chrome.bookmarks.search({ url: data.url }) matching key
  IF existing empty:
    chrome.bookmarks.create({ parentId, title: data.description or '', url: data.url })
  ELSE:
    FOR each node IN existing:
      chrome.bookmarks.update(node.id, { title: data.description or node.title })
      IF node.parentId != parentId AND data.tags provided: chrome.bookmarks.move(node.id, { parentId })
  # shared, toread, extended: no-op (Chrome has no equivalents)
  RETURN { success: true }

# [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE]
# Remove every Chrome node whose URL matches.
deleteBookmark(url):
  key = cleanUrl(url)
  nodes = search matching key
  FOR each node: chrome.bookmarks.remove(node.id)
  RETURN { success: true }

# [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE]
# Tag ops mutate folder placement via saveBookmark with updated tags.
saveTag(tagData), deleteTag(tagData):
  bookmark = getBookmarkForUrl(tagData.url)
  UPDATE bookmark.tags per tagData
  RETURN saveBookmark(bookmark)

# [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE]
# Always available when bookmarks permission present.
testConnection():
  RETURN true

# [IMPL-BROWSER_BOOKMARK_SERVICE] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-BROWSER_BOOKMARK_STORAGE]
# Get-or-create nested folders under Other Bookmarks for each tag segment; return leaf folder id.
ENSURE_TAG_FOLDERS(tags):
  parentId = "2"  # Other Bookmarks
  FOR each tag IN tags:
    child = find folder under parentId titled tag OR create folder
    parentId = child.id
  RETURN parentId
