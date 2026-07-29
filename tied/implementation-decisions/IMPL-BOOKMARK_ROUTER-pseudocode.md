# [IMPL-BOOKMARK_ROUTER] [ARCH-STORAGE_INDEX_AND_ROUTER] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-PER_BOOKMARK_STORAGE_BACKEND] [REQ-STORAGE_MODE_DEFAULT] [REQ-MOVE_BOOKMARK_STORAGE_UI] [REQ-LOCAL_BOOKMARKS_INDEX] [REQ-BROWSER_BOOKMARK_STORAGE]
# Delegate by URL via storage index; preferredBackend for save and delete; aggregate getRecentBookmarks; moveBookmarkToStorage; fifth provider browser with 2C getBookmarkForUrl rule.

# Contract: inputs = url, data (optional preferredBackend), count; output = bookmark or list or success/error.
INPUT: url, data (for save/tag/delete), count (for getRecentBookmarks); optional data.preferredBackend
OUTPUT: bookmark or list of bookmarks or success/error; providers = { pinboard, local, file, sync, browser }
DATA: storageIndex, defaultStorageMode, providerMap (backend name -> provider instance)

# [IMPL-BOOKMARK_ROUTER] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-PER_BOOKMARK_STORAGE_BACKEND] [REQ-STORAGE_MODE_DEFAULT] [REQ-BROWSER_BOOKMARK_STORAGE]
# preferredBackend (or legacy data.backend alias) if valid, else index.getBackendForUrl(url), else defaultStorageMode.
resolveProvider(url, data):
  preferred = data.preferredBackend OR data.backend
  IF preferred is valid (pinboard|local|file|sync|browser): RETURN providerMap[preferred]
  backend = storageIndex.getBackendForUrl(url)
  IF backend: RETURN providerMap[backend]
  RETURN providerMap[defaultStorageMode]

# [IMPL-BOOKMARK_ROUTER] [ARCH-STORAGE_INDEX_AND_ROUTER] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-PER_BOOKMARK_STORAGE_BACKEND] [REQ-BROWSER_BOOKMARK_STORAGE]
# Parallel best-of among pinboard/local/file/sync only (2C: exclude browser from race). Prefer tags then newer time; update index.
# Consult browser only when preferred/index/default resolves to browser, OR when no other non-empty candidate exists.
getBookmarkForUrl(url, title):
  candidates = PARALLEL query [pinboard, local, file, sync] filtered non-empty
  IF candidates empty:
    resolved = resolveProvider(url, {})  # may be browser via index/default
    RETURN resolved.getBookmarkForUrl(url, title)
  best = reduce candidates by (hasTags wins, else newer time)
  IF index missing or differs: storageIndex.setBackendForUrl(url, best.backend)
  RETURN best.bookmark
  # Note: browser is never in the parallel race; if caller needs browser ownership, preferredBackend or index must already say browser (save/delete/move paths use resolveProvider).

# [IMPL-BOOKMARK_ROUTER] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-PER_BOOKMARK_STORAGE_BACKEND] [REQ-BROWSER_BOOKMARK_STORAGE]
# Resolve provider; delegate get/save/delete/saveTag/deleteTag; on save success update index; on delete success remove index.
saveBookmark(data):
  url = data.url
  provider = resolveProvider(url, data)  # preferredBackend may be browser
  result = provider.saveBookmark(data)
  IF result.success: storageIndex.setBackendForUrl(url, providerBackend)
  RETURN result

# [IMPL-BOOKMARK_ROUTER] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-PER_BOOKMARK_STORAGE_BACKEND] [REQ-LOCAL_BOOKMARKS_INDEX] [REQ-BROWSER_BOOKMARK_STORAGE]
# Accept url string or { url, preferredBackend }; Index Delete passes preferredBackend from Storage column so File/Sync/Browser rows delete even when index is wrong.
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

# [IMPL-BOOKMARK_ROUTER] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-PER_BOOKMARK_STORAGE_BACKEND] [REQ-BROWSER_BOOKMARK_STORAGE]
# Aggregate all five providers; sort by time descending; return top count.
getRecentBookmarks(count):
  merged = []
  FOR each provider IN [pinboard, local, file, sync, browser]:
    merged = merged CONCAT provider.getRecentBookmarks(count)
  SORT merged BY time DESCENDING
  RETURN merged[0..count-1]

# [IMPL-BOOKMARK_ROUTER] [ARCH-STORAGE_INDEX_AND_ROUTER] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-LOCAL_BOOKMARKS_INDEX] [REQ-BROWSER_BOOKMARK_STORAGE]
# Aggregate local + file + sync + browser with storage field; pinboard excluded from index aggregation.
getAllBookmarksForIndex():
  lists = PARALLEL [local, file, sync, browser].getAllBookmarks()
  RETURN concat with storage tags 'local'|'file'|'sync'|'browser', SORT BY time DESC

# [IMPL-BOOKMARK_ROUTER] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-MOVE_BOOKMARK_STORAGE_UI] [REQ-PER_BOOKMARK_STORAGE_BACKEND] [REQ-BROWSER_BOOKMARK_STORAGE]
# Get from source; ensure time; save to target; delete from source; update index. targetBackend may be browser.
moveBookmarkToStorage(url, targetBackend):
  sourceBackend = storageIndex.getBackendForUrl(url) OR defaultStorageMode
  sourceProvider = providerMap[sourceBackend]
  targetProvider = providerMap[targetBackend]
  bookmark = sourceProvider.getBookmarkForUrl(url)
  IF bookmark lacks time: SET bookmark.time = now
  targetProvider.saveBookmark(bookmark)
  sourceProvider.deleteBookmark(url)
  storageIndex.setBackendForUrl(url, targetBackend)
