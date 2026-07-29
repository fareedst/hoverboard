# [IMPL-BOOKMARK_ROUTER] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-PER_BOOKMARK_STORAGE_BACKEND] [REQ-STORAGE_MODE_DEFAULT] [REQ-MOVE_BOOKMARK_STORAGE_UI] [REQ-LOCAL_BOOKMARKS_INDEX]
# Delegate by URL via storage index; preferredBackend for save and delete; aggregate getRecentBookmarks; moveBookmarkToStorage.

# Contract: inputs = url, data (optional preferredBackend), count; output = bookmark or list or success/error.
INPUT: url, data (for save/tag/delete), count (for getRecentBookmarks); optional data.preferredBackend
OUTPUT: bookmark or list of bookmarks or success/error; providers = { pinboard, local, file, sync }
DATA: storageIndex, defaultStorageMode, providerMap (backend name -> provider instance)

# [IMPL-BOOKMARK_ROUTER] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-PER_BOOKMARK_STORAGE_BACKEND] [REQ-STORAGE_MODE_DEFAULT]
# preferredBackend (or legacy data.backend alias) if valid, else index.getBackendForUrl(url), else defaultStorageMode.
resolveProvider(url, data):
  preferred = data.preferredBackend OR data.backend
  IF preferred is valid (pinboard|local|file|sync): RETURN providerMap[preferred]
  backend = storageIndex.getBackendForUrl(url)
  IF backend: RETURN providerMap[backend]
  RETURN providerMap[defaultStorageMode]

# [IMPL-BOOKMARK_ROUTER] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-PER_BOOKMARK_STORAGE_BACKEND]
# Resolve provider; delegate get/save/delete/saveTag/deleteTag; on save success update index; on delete success remove index.
getBookmarkForUrl(url):
  provider = resolveProvider(url, {})
  RETURN provider.getBookmarkForUrl(url)

saveBookmark(data):
  url = data.url
  provider = resolveProvider(url, data)
  result = provider.saveBookmark(data)
  IF result.success: storageIndex.setBackendForUrl(url, providerBackend)
  RETURN result

# [IMPL-BOOKMARK_ROUTER] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-PER_BOOKMARK_STORAGE_BACKEND] [REQ-LOCAL_BOOKMARKS_INDEX]
# Accept url string or { url, preferredBackend }; Index Delete passes preferredBackend from Storage column so File/Sync rows delete even when index is wrong.
deleteBookmark(urlOrData):
  IF urlOrData is object: data = urlOrData; url = data.url
  ELSE: data = {}; url = urlOrData
  provider = resolveProvider(url, data)
  result = provider.deleteBookmark(url)
  IF result.success: storageIndex.removeUrl(url)
  RETURN result

saveTag(data), deleteTag(data):
  provider = resolveProvider(data.url, data)
  RETURN provider.<operation>(...)

# [IMPL-BOOKMARK_ROUTER] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-PER_BOOKMARK_STORAGE_BACKEND]
# Aggregate all four providers; sort by time descending; return top count.
getRecentBookmarks(count):
  merged = []
  FOR each provider IN [pinboard, local, file, sync]:
    merged = merged CONCAT provider.getRecentBookmarks(count)
  SORT merged BY time DESCENDING
  RETURN merged[0..count-1]

# [IMPL-BOOKMARK_ROUTER] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-MOVE_BOOKMARK_STORAGE_UI] [REQ-PER_BOOKMARK_STORAGE_BACKEND]
# Get from source; ensure time; save to target; delete from source; update index.
moveBookmarkToStorage(url, targetBackend):
  sourceBackend = storageIndex.getBackendForUrl(url)
  sourceProvider = providerMap[sourceBackend]
  targetProvider = providerMap[targetBackend]
  bookmark = sourceProvider.getBookmarkForUrl(url)
  IF bookmark lacks time: SET bookmark.time = now
  targetProvider.saveBookmark(bookmark)
  sourceProvider.deleteBookmark(url)
  storageIndex.setBackendForUrl(url, targetBackend)
