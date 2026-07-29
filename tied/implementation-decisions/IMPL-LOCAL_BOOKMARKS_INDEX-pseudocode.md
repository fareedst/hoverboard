# [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-LOCAL_BOOKMARKS_INDEX]
# Index page: getAggregatedBookmarksForIndex (fallback getLocalBookmarksForIndex), filter pipeline, table with Storage column.
# Contract: page load and user actions; displayed table and filtered list; state data.
INPUT: none (page load); user actions (search, filter, sort, selection, export/move/delete/import)
OUTPUT: displayed table of bookmarks with Storage column; filtered/sorted list
DATA: allBookmarks (array with storage field), filteredBookmarks, selectedUrls (set), sortKey, timeColumnSource, timeDisplayMode

# Request aggregated bookmarks; on failure fallback to local; then apply filter.
ON page load:
  SEND getAggregatedBookmarksForIndex
  ON response: SET allBookmarks = response.bookmarks (each item has storage "local"|"file"|"sync")
  ON failure: SEND getLocalBookmarksForIndex; SET allBookmarks = response.bookmarks with storage "local"
  applySearchAndFilter()

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

# Popup button and options link open bookmarks-table tab.
Entry points:
  Popup: bookmarksIndexBtn click -> openBookmarksIndex -> open tab to bookmarks-table.html
  Options: bookmarks-index-link href -> extension URL to bookmarks-table.html
