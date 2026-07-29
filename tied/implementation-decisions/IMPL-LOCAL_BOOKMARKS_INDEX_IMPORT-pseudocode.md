# [IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT] [ARCH-LOCAL_BOOKMARKS_INDEX_IMPORT] [REQ-LOCAL_BOOKMARKS_INDEX_IMPORT]
# Separate Import control group below Actions for selected; CSV/JSON import; Only new or Overwrite; saveBookmark per row; pending then final result in #import-result.
# Contract: file and mode and backend; counts and refreshed table; Import button is last control before result.
INPUT: file (CSV or JSON), mode (Only new | Overwrite), preferredBackend (Local | File | Sync), allBookmarks (existing set for "Only new")
OUTPUT: imported count, skipped count, failed count; refreshed table; #import-result pending then final
DATA: rows = array of { url, description, tags, time, updated_at, shared, toread, extended }; existingByUrl = set of url from allBookmarks

# UI: Import fieldset (sibling of Actions for selected). Control order: mode radios, Import to, Import button, #import-result.
# [IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT] [ARCH-LOCAL_BOOKMARKS_INDEX_IMPORT] [REQ-LOCAL_BOOKMARKS_INDEX_IMPORT] — group is independent of selection actions.

# Parse file, show pending, filter if Only new, send saveBookmark per row, refresh and show final result.
runImport(file):
  text = read file as text
  rows = parseImportFile(text, filename)   // CSV -> parseCsv; JSON -> normalize array; skip empty url
  IF rows empty: SHOW error in #import-result (not pending/final success); RETURN
  IF mode = "Only new": rows = rows FILTER url NOT IN existingByUrl
  SHOW "Importing…" in #import-result WITH class is-pending   // accepted; warning color
  imported = 0; skipped = 0; failed = 0
  FOR each row IN rows:
    payload = { ...row, preferredBackend }   // includes time, updated_at from file when present
    response = SEND saveBookmark(payload)
    IF response.success: imported++
    ELSE: failed++
  loadBookmarks()   // refresh table
  SHOW "Imported N, skipped M, K failed" in #import-result WITH class is-final   // success color; clear is-pending
