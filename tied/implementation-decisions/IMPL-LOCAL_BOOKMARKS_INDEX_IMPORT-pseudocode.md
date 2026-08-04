# [IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT] [ARCH-LOCAL_BOOKMARKS_INDEX_IMPORT] [REQ-LOCAL_BOOKMARKS_INDEX_IMPORT] — One Import control group with File CSV/JSON and live Browser sources; target-scoped file conflicts plus selective Browser-tree migration; saveBookmark per row; pending then final result in #import-result.

## RUN_FILE_IMPORT

- [IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT] [ARCH-LOCAL_BOOKMARKS_INDEX_IMPORT] [REQ-LOCAL_BOOKMARKS_INDEX_IMPORT] — group is independent of selection actions. How: Implements runImport(file) behavior for IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT.
- Contract:
  - INPUT: source (File | Browser), file when source=File, mode (Only new | Overwrite) for File, conflict mode (Skip | Overwrite | Merge tags) for Browser, preferredBackend, allBookmarks
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: imported count, skipped count, failed count; refreshed table; #import-result pending then final | { error: OperationFailed }
  - POST:
    - success => block outputs match OUTPUT success shape
    - error OperationFailed => no silent partial commit beyond documented best-effort
  - FAILURE_MODES: OperationFailed
  - DATA: file rows = array of { url, description, tags, time, updated_at, shared, toread, extended }; Browser rows = collapsed live tree records; existingByUrl = set of URLs from selected target only
  - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
  - EFFECTS: IO, State
  - TERMINATION: total
- PROCEDURE: RUN_FILE_IMPORT
  - text = read file as text
  - rows = parseImportFile(text, filename)   // CSV -> parseCsv; JSON -> normalize array; skip empty url
  - IF rows empty: SHOW error in #import-result (not pending/final success); RETURN
  - existingByUrl = BUILD_TARGET_BOOKMARKS_BY_URL(allBookmarks, preferredBackend)
  - IF mode = "Only new": rows = rows FILTER url NOT IN existingByUrl
  - SHOW "Importing…" in #import-result WITH class is-pending   // accepted; warning color
  - imported = 0; skipped = 0; failed = 0
  - FOR each row IN rows:
  - payload = { ...row, preferredBackend }   // includes time, updated_at from file when present
  - response = SEND saveBookmark(payload)
  - IF response.success: imported++
  - ELSE: failed++
  - loadBookmarks()   // refresh table
  - SHOW "Imported N, skipped M, K failed" in #import-result WITH class is-final   // success color; clear is-pending

## RUN_BROWSER_IMPORT

- [IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT] [ARCH-LOCAL_BOOKMARKS_INDEX_IMPORT] [REQ-LOCAL_BOOKMARKS_INDEX_IMPORT] How: The shared Index Import control delegates the live Browser source to IMPL-BROWSER_BOOKMARK_IMPORT while retaining one result/status surface.
- Contract:
  - INPUT: selected live Browser records, target Local|File|Sync, Skip|Overwrite|Merge tags, folder-tag toggle, extra tags
  - PRE: Browser source records are collapsed by cleaned URL; Browser is excluded as a destination
  - OUTPUT: imported/skipped/failed counts and refreshed Index
  - POST:
    - success => counts reflect best-effort per-row writes and the Index is refreshed
    - error OperationFailed => no writes occur after target conflict lookup failure
  - FAILURE_MODES: OperationFailed, InvalidTarget
  - DATA: existingByUrl = selected target rows only; selected Browser rows; import result counters
  - DATA_TRANSITION: each save outcome updates a result counter; completion refreshes the Index and result surface
  - EFFECTS: Async, IO, State
  - TERMINATION: total
- PROCEDURE: RUN_BROWSER_IMPORT
  - existingByUrl = BUILD_TARGET_BOOKMARKS_BY_URL(aggregate rows, target)
  - IF target conflict lookup fails: retry Local only for Local target; otherwise SHOW error and RETURN without writes
  - FOR each selected Browser record:
  - IF existingByUrl contains url AND mode = Skip: skipped++
  - ELSE BUILD payload with root-stripped folder tags and sanitized extra tags
  - SEND saveBookmark({ ...payload, preferredBackend: target })
  - loadBookmarks(); SHOW final counts
