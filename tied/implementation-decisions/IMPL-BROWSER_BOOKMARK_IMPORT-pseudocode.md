# [IMPL-BROWSER_BOOKMARK_IMPORT] [ARCH-BROWSER_BOOKMARK_IMPORT] [REQ-BROWSER_BOOKMARK_IMPORT] — getTree, flattenTree, filters, selection, conflict resolution (Skip/Overwrite/Merge), folder+extra tags, saveBookmark per row. Import to is Local|File|Sync only: Browser excluded as target because source is already chrome.bookmarks (distinct from Index Import which allows Store B).

## RUN_IMPORT

- [IMPL-BROWSER_BOOKMARK_IMPORT] [ARCH-BROWSER_BOOKMARK_IMPORT] [REQ-BROWSER_BOOKMARK_IMPORT] How: Implements runImport() behavior for IMPL-BROWSER_BOOKMARK_IMPORT.
- Contract:
  - INPUT: chrome.bookmarks.getTree(), user selection (selectedUrls), conflict mode (Skip|Overwrite|Merge), Use folder names as tags, Add tags, Import to (Local|File|Sync; Browser excluded)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: imported/skipped/failed counts; table of browser bookmarks with Select, Title, URL, Folder, Date | { error: OperationFailed }
  - POST:
    - success => block outputs match OUTPUT success shape
    - error OperationFailed => no silent partial commit beyond documented best-effort
  - FAILURE_MODES: OperationFailed
  - DATA: allBookmarks (flattened), folderList, existingByUrl (from getAggregatedBookmarksForIndex), selectedUrls (set)
  - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
  - EFFECTS: IO, State
  - TERMINATION: total
- PROCEDURE: RUN_IMPORT
  - existingByUrl = getAggregatedBookmarksForIndex() keyed by url (or getLocalBookmarksForIndex)
  - folderTags = folderPathToTags(selected folder paths) if "Use folder names as tags"; extraTags = parseExtraTags(input)
  - FOR each selected item IN allBookmarks WHERE url IN selectedUrls:
  - payload = { url, description: title, time: dateAdded ISO, tags: folderTags + extraTags, preferredBackend }
  - IF url IN existingByUrl:
  - IF Skip: skip; skipped++
  - IF Overwrite: SEND saveBookmark(payload); imported++
  - IF Merge: merge tags + keep existing description/extended; SEND saveBookmark(merged); imported++
  - ELSE: SEND saveBookmark(payload); imported++ (or failed++ on error)
  - SHOW "Imported N, skipped M, K failed"
