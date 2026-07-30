# [IMPL-BROWSER_BOOKMARK_IMPORT] [ARCH-BROWSER_BOOKMARK_IMPORT] [REQ-BROWSER_BOOKMARK_IMPORT]
# getTree, flattenTree, filters, selection, conflict resolution (Skip/Overwrite/Merge), folder+extra tags, saveBookmark per row.
# Import to is Local|File|Sync only: Browser excluded as target because source is already chrome.bookmarks (distinct from Index Import which allows Store B).

# Contract: inputs = getTree, selection, conflict mode, tag options, Import to; output = counts and table.
INPUT: chrome.bookmarks.getTree(), user selection (selectedUrls), conflict mode (Skip|Overwrite|Merge), Use folder names as tags, Add tags, Import to (Local|File|Sync; Browser excluded)
OUTPUT: imported/skipped/failed counts; table of browser bookmarks with Select, Title, URL, Folder, Date
DATA: allBookmarks (flattened), folderList, existingByUrl (from getAggregatedBookmarksForIndex), selectedUrls (set)

# getTree -> flattenTree -> allBookmarks; build folderList; applySearchAndFilter; render table.
ON load:
  chrome.bookmarks.getTree() -> flattenTree -> allBookmarks (each { id, url, title, dateAdded, folderPath })
  folderList = unique folder paths; applySearchAndFilter(); render table

# existingByUrl; folderTags + extraTags; per selected URL apply conflict mode; saveBookmark; show counts.
runImport():
  existingByUrl = getAggregatedBookmarksForIndex() keyed by url (or getLocalBookmarksForIndex)
  folderTags = folderPathToTags(selected folder paths) if "Use folder names as tags"; extraTags = parseExtraTags(input)
  FOR each selected item IN allBookmarks WHERE url IN selectedUrls:
    payload = { url, description: title, time: dateAdded ISO, tags: folderTags + extraTags, preferredBackend }
    IF url IN existingByUrl:
      IF Skip: skip; skipped++
      IF Overwrite: SEND saveBookmark(payload); imported++
      IF Merge: merge tags + keep existing description/extended; SEND saveBookmark(merged); imported++
    ELSE: SEND saveBookmark(payload); imported++ (or failed++ on error)
  SHOW "Imported N, skipped M, K failed"
