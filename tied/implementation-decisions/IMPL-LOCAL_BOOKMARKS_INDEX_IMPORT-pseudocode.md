# [IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT] [ARCH-LOCAL_BOOKMARKS_INDEX_IMPORT] [REQ-LOCAL_BOOKMARKS_INDEX_IMPORT]
# Import from CSV/JSON; Only new or Overwrite; saveBookmark per row; result message.
# Contract: file and mode and backend; counts and refreshed table.
INPUT: file (CSV or JSON), mode (Only new | Overwrite), preferredBackend (Local | File | Sync), allBookmarks (existing set for "Only new")
OUTPUT: imported count, skipped count, failed count; refreshed table
DATA: rows = array of { url, description, tags, time, shared, toread, extended }; existingByUrl = set of url from allBookmarks

# Parse file, filter if Only new, send saveBookmark per row, refresh and show result.
runImport(file):
  text = read file as text
  rows = parseImportFile(text, filename)   // CSV -> parseCsv; JSON -> normalize array; skip empty url
  IF mode = "Only new": rows = rows FILTER url NOT IN existingByUrl
  imported = 0; skipped = 0; failed = 0
  FOR each row IN rows:
    payload = { ...row, preferredBackend }
    response = SEND saveBookmark(payload)
    IF response.success: imported++
    ELSE IF skipped (e.g. duplicate): skipped++
    ELSE: failed++
  loadBookmarks()   // refresh table
  SHOW "Imported N, skipped M, K failed" in #import-result
