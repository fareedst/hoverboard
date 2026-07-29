# [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-LOCAL_BOOKMARKS_INDEX]
# Index page: getAggregatedBookmarksForIndex (fallback getLocalBookmarksForIndex), filter pipeline, table with Storage column.
# Contract: page load and user actions; displayed table and filtered list; state data.
INPUT: none (page load); user actions (search, filter, sort, selection, export/move/delete/import)
OUTPUT: displayed table of bookmarks with Storage column; filtered/sorted list
DATA: allBookmarks (array with storage field), filteredBookmarks, selectedUrls (set), sortKey, timeColumnSource, timeDisplayMode

# [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [REQ-LOCAL_BOOKMARKS_INDEX]
# LOAD_LOCAL_BOOKMARKS_INDEX: aggregate first; treat error/success:false as failure even when bookmarks is []; then filter.
LOAD_LOCAL_BOOKMARKS_INDEX:
  SEND getAggregatedBookmarksForIndex
  IF response has error OR success is false OR bookmarks is not an array:
    SEND getLocalBookmarksForIndex
    SET allBookmarks = response.bookmarks with storage "local"
  ELSE:
    SET allBookmarks = response.bookmarks (each item has storage "local"|"file"|"sync")
  applySearchAndFilter()

ON page load:
  LOAD_LOCAL_BOOKMARKS_INDEX

# [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [REQ-LOCAL_BOOKMARKS_INDEX]
# Store checkbox change refilters; if cache empty and at least one store checked, reload (cold SW recovery).
ON store checkbox change:
  applySearchAndFilter()
  IF shouldReloadBookmarksOnStoreChange(allBookmarks.length, allowedStores.size):
    LOAD_LOCAL_BOOKMARKS_INDEX

shouldReloadBookmarksOnStoreChange(allBookmarksLength, allowedStoresSize):
  RETURN allBookmarksLength == 0 AND allowedStoresSize > 0

# Apply stores filter, search, show-only, exclude tags; sort and render.
applySearchAndFilter():
  filteredBookmarks = allBookmarks
  APPLY stores filter (matchStoresFilter, getAllowedStores)
  APPLY search (text)
  APPLY show-only (tags, toread, private, time range; getShowOnlyDefaultState for Clear)
  APPLY exclude tags (matchExcludeTags)
  SORT by sortKey (e.g. time desc)
  renderTableBody(filteredBookmarks); updateRowCount()

# [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [REQ-LOCAL_BOOKMARKS_INDEX] [IMPL-BOOKMARK_ROUTER]
# Bulk Delete uses row Storage column as preferredBackend; pending/final #delete-result mirrors Import status UX.
# Orchestrator: runBulkDelete (bookmarks-table-bulk-delete.js) for composition-testable wiring.
BULK_DELETE:
  IF selectedUrls empty: RETURN
  runBulkDelete(urls, bookmarksByUrl, sendMessage, confirmFn, #delete-result, onAfterDelete):
    titles = descriptions for selected URLs from bookmarksByUrl
    IF NOT confirmFn(buildDeleteConfirmMessage(count, titles)): RETURN cancelled
    setDeleteResultPending(#delete-result)  # "Deleting…" warning color
    FOR each url IN urls:
      bookmark = lookup url in bookmarksByUrl
      payload = buildDeletePayload(bookmark)  # { url, preferredBackend from storage }
      SEND deleteBookmark with data = payload
      COUNT ok / fail from response
    onAfterDelete()  # CLEAR selectedUrls; loadBookmarks(); updateMoveControlsState()
    setDeleteResultFinal(#delete-result, formatDeleteResultMessage({ deleted: ok, failed: fail }))

# buildDeletePayload(bookmark):
  IF bookmark missing or no url: RETURN null
  RETURN { url: bookmark.url, preferredBackend: lowercase(bookmark.storage) OR "local" }

# [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [REQ-LOCAL_BOOKMARKS_INDEX]
# How: concurrent cold-start messages share one in-flight initBookmarkProvider promise (createProviderInitMutex).
PROVIDER_INIT_MUTEX / ensureBookmarkProviderInitialized:
  IF provider already initialized: RETURN
  AWAIT shared in-flight init (or start initBookmarkProvider once)
  SET provider initialized

# [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [REQ-LOCAL_BOOKMARKS_INDEX] [IMPL-ICON_CLICK_BEHAVIOR]
# OPEN_BOOKMARKS_INDEX_TAB: create index tab then dismiss already-open side panel (tab-create only; not page refresh).
# How: SW owns create+broadcast so popup/command/menu share one path; panel closes via REQUEST_SIDE_PANEL_CLOSE (icon-toggle semantics).
OPEN_BOOKMARKS_INDEX_TAB:
  url = runtime.getURL('src/ui/bookmarks-table/bookmarks-table.html')
  tabs.create({ url })
  runtime.sendMessage({ type: REQUEST_SIDE_PANEL_CLOSE })

# Entry points that call OPEN_BOOKMARKS_INDEX_TAB (not options href):
ON OPEN_BOOKMARKS_INDEX message: OPEN_BOOKMARKS_INDEX_TAB
ON command open-bookmarks-index: OPEN_BOOKMARKS_INDEX_TAB
ON context menu hoverboard-open-bookmarks-index: OPEN_BOOKMARKS_INDEX_TAB
Popup: bookmarksIndexBtn -> openBookmarksIndex -> SEND OPEN_BOOKMARKS_INDEX
Options: bookmarks-index-link href -> extension URL (no dismiss; out of scope)
# Index page init must NOT send REQUEST_SIDE_PANEL_CLOSE (refresh must not re-dismiss after icon reopen).
