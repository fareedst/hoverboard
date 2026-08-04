# [IMPL-BROWSER_BOOKMARK_IMPORT] [ARCH-BROWSER_BOOKMARK_IMPORT] [REQ-BROWSER_BOOKMARK_IMPORT] — Local Bookmarks Index live Browser source: getTree, flatten/collapse, search/folder filter, selection, target-scoped conflicts, root-stripped folder tags, extra tags, and saveBookmark.

## LOAD_BROWSER_SOURCE

- [IMPL-BROWSER_BOOKMARK_IMPORT] [ARCH-BROWSER_BOOKMARK_IMPORT] [REQ-BROWSER_BOOKMARK_IMPORT] How: Implements live Browser source loading in the Local Bookmarks Index.
- Contract:
  - INPUT: chrome.bookmarks.getTree()
  - PRE: `chrome.bookmarks.getTree` is available through the bookmarks permission
  - OUTPUT: one import row per cleaned URL with title, URL, folderPaths, folderPath, dateAdded, and root-stripped folder tags
  - POST:
    - success => duplicate URL nodes are collapsed; folder paths and tags are unioned; earliest dateAdded is retained
    - failure => empty source with an explanatory message
  - FAILURE_MODES: OperationFailed
  - DATA: browserImportRecords, folderList, selectedBrowserImportUrls
  - DATA_TRANSITION: load success replaces source records and folder choices and clears prior selection; load failure replaces them with an empty source and explanatory message
  - EFFECTS: Async, IO, State
  - TERMINATION: total
- PROCEDURE: LOAD_BROWSER_SOURCE
  - tree = AWAIT chrome.bookmarks.getTree()
  - flattened = flattenTree(tree)
  - records = NORMALIZE_BROWSER_IMPORT_RECORDS(flattened)
  - folderList = BUILD_BROWSER_IMPORT_FOLDER_LIST(records)
  - CLEAR selectedBrowserImportUrls
  - APPLY_BROWSER_IMPORT_FILTER()
  - ON error: SET browserImportRecords and filtered records to empty; SHOW explanatory message; APPLY_BROWSER_IMPORT_FILTER()

## NORMALIZE_BROWSER_IMPORT_RECORDS

- [IMPL-BROWSER_BOOKMARK_IMPORT] [ARCH-BROWSER_BOOKMARK_IMPORT] [REQ-BROWSER_BOOKMARK_IMPORT] How: Implements Browser provider-compatible duplicate handling and root stripping.
- Contract:
  - INPUT: flattened Browser bookmark nodes
  - PRE: each node may contain id, url, title, dateAdded, and folderPath
  - OUTPUT: collapsed record list keyed by cleaned URL
  - EFFECTS: pure
  - TERMINATION: total
- PROCEDURE: NORMALIZE_BROWSER_IMPORT_RECORDS
  - FOR each node WITH url:
  - key = cleanUrl(node.url)
  - folderTags = folderPathToTags(node.folderPath, { stripRoots: true })
  - IF key is new: create record with node title, dateAdded, folderPaths, folderTags, and sourceIds
  - ELSE: union folderPaths, folderTags, and sourceIds; retain earliest dateAdded; fill an empty title from a later node
  - RETURN records

## APPLY_BROWSER_IMPORT_FILTER

- [IMPL-BROWSER_BOOKMARK_IMPORT] [ARCH-BROWSER_BOOKMARK_IMPORT] [REQ-BROWSER_BOOKMARK_IMPORT] How: Implements selective live-tree browsing in the Index Import group.
- Contract:
  - INPUT: records, search query, selected folder
  - PRE: records have collapsed folderPaths
  - OUTPUT: filtered records and selectable rows
  - DATA: filteredBrowserImportRecords, selectedBrowserImportUrls, count and empty-state DOM
  - DATA_TRANSITION: filtering replaces visible rows and count/empty-state state while retaining selected URLs outside the current filter
  - EFFECTS: State, DOM
  - TERMINATION: total
- PROCEDURE: APPLY_BROWSER_IMPORT_FILTER
  - IF selected folder is non-empty: keep records containing that exact folder path
  - IF search is non-empty: keep records whose title, URL, or folder path contains the case-folded query
  - RENDER rows with Select, Title, URL, Folder, and Date added
  - Preserve selected URLs while filters change

## RUN_BROWSER_IMPORT

- [IMPL-BROWSER_BOOKMARK_IMPORT] [ARCH-BROWSER_BOOKMARK_IMPORT] [REQ-BROWSER_BOOKMARK_IMPORT] How: Implements target-specific live Browser migration through the shared Index saveBookmark route.
- Contract:
  - INPUT: selected browser records, conflict mode (Skip|Overwrite|Merge), folder-tag toggle, extra tags, target (Local|File|Sync)
  - PRE: at least one record is selected; Browser is not a valid live-source target
  - OUTPUT: imported/skipped/failed counts and refreshed Index
  - POST:
    - success => counts reflect best-effort per-record writes
    - failure => no silent partial commit beyond documented best-effort
  - FAILURE_MODES: OperationFailed, InvalidTarget
  - DATA: existingByUrl = selected target rows only; Browser source rows are excluded
  - DATA_TRANSITION: each save outcome increments its result counter; completion clears source selection and refreshes the Index
  - EFFECTS: Async, IO, State
  - TERMINATION: total
- PROCEDURE: RUN_BROWSER_IMPORT
  - target = selected Local|File|Sync target; IF invalid: use Local
  - existingByUrl = BUILD_TARGET_BOOKMARKS_BY_URL(aggregate rows, target)
  - IF aggregate lookup fails AND target = Local: retry getLocalBookmarksForIndex; IF target is File|Sync or retry fails: SHOW conflict-detection error and RETURN without writes
  - FOR each selected record:
  - IF existingByUrl contains record.url AND mode = Skip: skipped++
  - ELSE payload = BUILD_BROWSER_IMPORT_PAYLOAD(record, existingByUrl[record.url], mode, tags)
  - SEND saveBookmark({ ...payload, preferredBackend: target })
  - IF response.success: imported++ ELSE failed++
  - CLEAR selectedBrowserImportUrls; loadBookmarks(); SHOW final counts

## LEGACY_IMPORT_COMPATIBILITY_REDIRECT

- [IMPL-BROWSER_BOOKMARK_IMPORT] [ARCH-BROWSER_BOOKMARK_IMPORT] [REQ-BROWSER_BOOKMARK_IMPORT] How: Retains the former standalone page URL as a compatibility entry that routes users to the Index-owned live Browser source.
- Contract:
  - INPUT: navigation to browser-bookmark-import.html
  - PRE: extension runtime URL resolution is available
  - OUTPUT: Index tab with source=browser selected
  - POST:
    - success => user lands on bookmarks-table.html?source=browser with Import group and live Browser source selected
  - EFFECTS: Navigation
  - TERMINATION: total
- PROCEDURE: LEGACY_IMPORT_COMPATIBILITY_REDIRECT
  - ON load of browser-bookmark-import.html:
  - REPLACE location with chrome.runtime.getURL('src/ui/bookmarks-table/bookmarks-table.html?source=browser')
