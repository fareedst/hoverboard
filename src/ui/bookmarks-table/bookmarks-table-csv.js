/**
 * [IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT] [ARCH-LOCAL_BOOKMARKS_INDEX_EXPORT] [REQ-LOCAL_BOOKMARKS_INDEX_EXPORT]
 * [IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT] [ARCH-LOCAL_BOOKMARKS_INDEX_IMPORT] [REQ-LOCAL_BOOKMARKS_INDEX_IMPORT]
 * CSV helpers for Local Bookmarks Index export and import (all, displayed, selected).
 */

/**
 * Escape a field for CSV: wrap in double quotes, escape internal " as "".
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-BOOKMARK_CREATE_UPDATE_TIMES ===
 * [IMPL-BOOKMARK_CREATE_UPDATE_TIMES] [ARCH-BOOKMARK_CREATE_UPDATE_TIMES] [REQ-BOOKMARK_CREATE_UPDATE_TIMES] — Every bookmark has time (create) and updated_at (last update); provider-specific set/normalize; export/import include.
 *
 * ## PINBOARD
 *
 * - [IMPL-BOOKMARK_CREATE_UPDATE_TIMES] [ARCH-BOOKMARK_CREATE_UPDATE_TIMES] [REQ-BOOKMARK_CREATE_UPDATE_TIMES] — import create preserves CSV/JSON Time and Updated. How: Implements Pinboard behavior for IMPL-BOOKMARK_CREATE_UPDATE_TIMES.
 * - Contract:
 *   - INPUT: bookmark data (for save), API response (for Pinboard), raw record (for normalize)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark with time and updated_at set per provider and context
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: time = create time; updated_at = last update time
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: PINBOARD
 *   - parseBookmarkResponse / createEmptyBookmark: SET updated_at = time (API has no updated_at)
 *   - SEND to API: do NOT include updated_at
 *   - How (sub-block): If missing updated_at set to time (legacy); include updated_at in payload/CSV/JSON.
 *   - 1. Normalize (url-tags-manager, display, move, export/import):
 *   - IF bookmark has no updated_at: SET updated_at = time   // legacy
 *   - ELSE: keep updated_at
 *   - Include updated_at in payload/CSV/JSON
 *
 * === END IMPL-FULL-BLOCK: IMPL-BOOKMARK_CREATE_UPDATE_TIMES ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT ===
 * [IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT] [ARCH-LOCAL_BOOKMARKS_INDEX_EXPORT] [REQ-LOCAL_BOOKMARKS_INDEX_EXPORT] — Export all/displayed/selected to CSV; buildCsv and programmatic download. Contract: scope and bookmark sets; CSV download and column shape.
 *
 * ## EXPORT_BOOKMARKS
 *
 * - [IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT] [ARCH-LOCAL_BOOKMARKS_INDEX_EXPORT] [REQ-LOCAL_BOOKMARKS_INDEX_EXPORT] How: Implements exportBookmarks(scope) behavior for IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT.
 * - Contract:
 *   - INPUT: scope ('all' | 'displayed' | 'selected'), allBookmarks, filteredBookmarks, selectedUrls (set)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: CSV file download (Blob -> object URL -> <a download> click -> revoke)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: CSV header + rows; columns description, url, tags, time, storage, shared, toread, extended
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: EXPORT_BOOKMARKS
 *   - IF scope = 'all': source = allBookmarks
 *   - IF scope = 'displayed': source = filteredBookmarks
 *   - IF scope = 'selected': source = allBookmarks FILTER url IN selectedUrls
 *   - csvString = buildCsv(source)   // header row + one row per bookmark; escape quotes; storage Local|File|Sync|Browser
 *   - filename = "hoverboard-bookmarks-{scope}-{ISO date}.csv"
 *   - blob = new Blob([csvString]); url = createObjectURL(blob)
 *   - trigger <a download=filename href=url> click; revokeObjectURL(url)
 *   - How (sub-block): Disable export buttons when scope has no data.
 *
 * ## UPDATE_EXPORT_BUTTON_STATE
 *
 * - [IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT] [ARCH-LOCAL_BOOKMARKS_INDEX_EXPORT] [REQ-LOCAL_BOOKMARKS_INDEX_EXPORT] How: Implements updateExportButtonState() behavior for IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT.
 * - Contract:
 *   - INPUT: scope ('all' | 'displayed' | 'selected'), allBookmarks, filteredBookmarks, selectedUrls (set)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: CSV file download (Blob -> object URL -> <a download> click -> revoke)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: CSV header + rows; columns description, url, tags, time, storage, shared, toread, extended
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: UPDATE_EXPORT_BUTTON_STATE
 *   - DISABLE "Export selected" when selectedUrls.size === 0
 *   - DISABLE "Export displayed" when filteredBookmarks.length === 0
 *   - DISABLE "Export all" when allBookmarks.length === 0
 *   - (called when selection or filter changes, e.g. from updateMoveControlsState)
 *
 * === END IMPL-FULL-BLOCK: IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT ===
 * [IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT] [ARCH-LOCAL_BOOKMARKS_INDEX_IMPORT] [REQ-LOCAL_BOOKMARKS_INDEX_IMPORT] — Separate Import control group below Actions for selected; CSV/JSON import; Only new or Overwrite; saveBookmark per row; pending then final result in #import-result. Contract: file and mode and backend; counts and refreshed table; Import button is last control before result.
 *
 * ## RUN_IMPORT
 *
 * - [IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT] [ARCH-LOCAL_BOOKMARKS_INDEX_IMPORT] [REQ-LOCAL_BOOKMARKS_INDEX_IMPORT] — group is independent of selection actions. How: Implements runImport(file) behavior for IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT.
 * - Contract:
 *   - INPUT: file (CSV or JSON), mode (Only new | Overwrite), preferredBackend (Local | File | Sync | Browser), allBookmarks (existing set for "Only new")
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: imported count, skipped count, failed count; refreshed table; #import-result pending then final | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: rows = array of { url, description, tags, time, updated_at, shared, toread, extended }; existingByUrl = set of url from allBookmarks
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: RUN_IMPORT
 *   - text = read file as text
 *   - rows = parseImportFile(text, filename)   // CSV -> parseCsv; JSON -> normalize array; skip empty url
 *   - IF rows empty: SHOW error in #import-result (not pending/final success); RETURN
 *   - IF mode = "Only new": rows = rows FILTER url NOT IN existingByUrl
 *   - SHOW "Importing…" in #import-result WITH class is-pending   // accepted; warning color
 *   - imported = 0; skipped = 0; failed = 0
 *   - FOR each row IN rows:
 *   - payload = { ...row, preferredBackend }   // includes time, updated_at from file when present
 *   - response = SEND saveBookmark(payload)
 *   - IF response.success: imported++
 *   - ELSE: failed++
 *   - loadBookmarks()   // refresh table
 *   - SHOW "Imported N, skipped M, K failed" in #import-result WITH class is-final   // success color; clear is-pending
 *
 * === END IMPL-FULL-BLOCK: IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT ===
 */
export function escapeCsvField (str) {
  if (str == null) return '""'
  const s = String(str).replace(/"/g, '""')
  return `"${s}"`
}

/**
 * [IMPL-BOOKMARK_CREATE_UPDATE_TIMES] [IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT] [REQ-LOCAL_BOOKMARKS_INDEX_EXPORT]
 * Build CSV with Time (create) and Updated (most-recent-update-time).
 * Columns: Title, URL, Tags, Time, Updated, Storage, Shared, To read, Notes.
 * Storage column: Local | File | Sync | Browser.
 */
export function buildCsv (bookmarks) {
  const header = 'Title,URL,Tags,Time,Updated,Storage,Shared,To read,Notes'
  const rows = bookmarks.map(b => {
    const title = b.description ?? ''
    const url = b.url ?? ''
    const tags = Array.isArray(b.tags) ? b.tags.join(', ') : String(b.tags ?? '')
    const time = b.time ? new Date(b.time).toISOString() : ''
    const updated = (b.updated_at ?? b.time) ? new Date(b.updated_at ?? b.time).toISOString() : ''
    const storage = b.storage === 'browser'
      ? 'Browser'
      : (b.storage === 'sync' ? 'Sync' : (b.storage === 'file' ? 'File' : 'Local'))
    const shared = b.shared === 'no' ? 'Private' : 'Public'
    const toread = b.toread === 'yes' ? 'Yes' : 'No'
    const notes = b.extended ?? ''
    return [escapeCsvField(title), escapeCsvField(url), escapeCsvField(tags), escapeCsvField(time), escapeCsvField(updated), escapeCsvField(storage), escapeCsvField(shared), escapeCsvField(toread), escapeCsvField(notes)].join(',')
  })
  return [header, ...rows].join('\r\n')
}

/**
 * [IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT] [ARCH-LOCAL_BOOKMARKS_INDEX_IMPORT] [REQ-LOCAL_BOOKMARKS_INDEX_IMPORT]
 * [IMPL-BOOKMARK_CREATE_UPDATE_TIMES] Parse CSV (with or without Updated column); default updated_at = time when missing.
 * Columns: Title, URL, Tags, Time, [Updated], Storage, Shared, To read, Notes.
 * Handles quoted fields and "" as escaped quote. Skips header row; skips rows with empty URL.
 * @param {string} csvString - Full CSV text (header + data rows)
 * @returns {Array<{ description: string, url: string, tags: string[], time: string, updated_at?: string, shared: string, toread: string, extended: string }>}
 */
export function parseCsv (csvString) {
  if (!csvString || typeof csvString !== 'string') return []
  const lines = csvString.split(/\r?\n/).filter(line => line.trim().length > 0)
  if (lines.length < 2) return []
  const out = []
  const header = lines[0]
  const skipHeader = header.trim().toLowerCase().startsWith('title,url')
  const hasUpdatedColumn = header.trim().toLowerCase().includes('updated')
  const dataLines = skipHeader ? lines.slice(1) : lines
  for (const line of dataLines) {
    const fields = parseCsvLine(line)
    if (fields.length < 2) continue
    const time = (fields[3] || '').trim()
    let updatedAt = time
    let _storage, sharedStr, toreadStr, notes
    if (hasUpdatedColumn && fields.length >= 9) {
      updatedAt = (fields[4] || '').trim() || time
      _storage = fields[5]
      sharedStr = fields[6]
      toreadStr = fields[7]
      notes = fields[8]
    } else {
      _storage = fields[4]
      sharedStr = fields[5]
      toreadStr = fields[6]
      notes = fields[7]
    }
    const [title, url, tagsStr] = [fields[0], fields[1], fields[2]]
    const urlTrim = (url || '').trim()
    if (!urlTrim) continue
    const tags = (tagsStr || '')
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)
    const shared = (sharedStr || '').toLowerCase().includes('private') ? 'no' : 'yes'
    const toread = (toreadStr || '').toLowerCase().includes('yes') ? 'yes' : 'no'
    out.push({
      description: (title || '').trim(),
      url: urlTrim,
      tags,
      time,
      updated_at: updatedAt,
      shared,
      toread,
      extended: (notes || '').trim()
    })
  }
  return out
}

/**
 * Parse a single CSV line into fields. Handles quoted fields and "" escape.
 * @param {string} line
 * @returns {string[]}
 */
function parseCsvLine (line) {
  const fields = []
  let i = 0
  while (i < line.length) {
    if (line[i] === '"') {
      let value = ''
      i++
      while (i < line.length) {
        if (line[i] === '"') {
          if (line[i + 1] === '"') {
            value += '"'
            i += 2
          } else {
            i++
            break
          }
        } else {
          value += line[i]
          i++
        }
      }
      fields.push(value)
      if (line[i] === ',') i++
    } else {
      let value = ''
      while (i < line.length && line[i] !== ',') {
        value += line[i]
        i++
      }
      fields.push(value.trim())
      if (line[i] === ',') i++
    }
  }
  return fields
}
