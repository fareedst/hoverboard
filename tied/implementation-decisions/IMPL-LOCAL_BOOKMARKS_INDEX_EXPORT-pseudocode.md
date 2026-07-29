# [IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT] [ARCH-LOCAL_BOOKMARKS_INDEX_EXPORT] [REQ-LOCAL_BOOKMARKS_INDEX_EXPORT]
# Export all/displayed/selected to CSV; buildCsv and programmatic download.
# Contract: scope and bookmark sets; CSV download and column shape.
INPUT: scope ('all' | 'displayed' | 'selected'), allBookmarks, filteredBookmarks, selectedUrls (set)
OUTPUT: CSV file download (Blob -> object URL -> <a download> click -> revoke)
DATA: CSV header + rows; columns description, url, tags, time, storage, shared, toread, extended

# Pick source by scope, build CSV, trigger download and revoke URL.
exportBookmarks(scope):
  IF scope = 'all': source = allBookmarks
  IF scope = 'displayed': source = filteredBookmarks
  IF scope = 'selected': source = allBookmarks FILTER url IN selectedUrls
  csvString = buildCsv(source)   // header row + one row per bookmark; escape quotes; storage Local|File|Sync
  filename = "hoverboard-bookmarks-{scope}-{ISO date}.csv"
  blob = new Blob([csvString]); url = createObjectURL(blob)
  trigger <a download=filename href=url> click; revokeObjectURL(url)

# Disable export buttons when scope has no data.
updateExportButtonState():
  DISABLE "Export selected" when selectedUrls.size === 0
  DISABLE "Export displayed" when filteredBookmarks.length === 0
  DISABLE "Export all" when allBookmarks.length === 0
  (called when selection or filter changes, e.g. from updateMoveControlsState)
