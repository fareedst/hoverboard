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
import {
  IMPORT_PENDING_MESSAGE,
  IMPORT_RESULT_PENDING_CLASS,
  IMPORT_RESULT_FINAL_CLASS,
  setImportResultPending,
  setImportResultFinal,
  setImportResultError,
  formatImportResultMessage
} from '../../src/ui/bookmarks-table/bookmarks-table-import-status.js'

describe('import result status [REQ-LOCAL_BOOKMARKS_INDEX_IMPORT] [IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT]', () => {
  let el

  beforeEach(() => {
    el = document.createElement('span')
    el.id = 'import-result'
  })

  test('setImportResultPending shows Importing… with is-pending class', () => {
    setImportResultPending(el)
    expect(el.textContent).toBe(IMPORT_PENDING_MESSAGE)
    expect(el.textContent).toBe('Importing…')
    expect(el.classList.contains(IMPORT_RESULT_PENDING_CLASS)).toBe(true)
    expect(el.classList.contains(IMPORT_RESULT_FINAL_CLASS)).toBe(false)
  })

  test('setImportResultFinal replaces pending with final message and is-final class', () => {
    setImportResultPending(el)
    setImportResultFinal(el, 'Imported 287.')
    expect(el.textContent).toBe('Imported 287.')
    expect(el.classList.contains(IMPORT_RESULT_PENDING_CLASS)).toBe(false)
    expect(el.classList.contains(IMPORT_RESULT_FINAL_CLASS)).toBe(true)
  })

  test('setImportResultError clears pending/final classes', () => {
    setImportResultPending(el)
    setImportResultError(el, 'Could not read file.')
    expect(el.textContent).toBe('Could not read file.')
    expect(el.classList.contains(IMPORT_RESULT_PENDING_CLASS)).toBe(false)
    expect(el.classList.contains(IMPORT_RESULT_FINAL_CLASS)).toBe(false)
  })

  test('formatImportResultMessage builds count summary', () => {
    expect(formatImportResultMessage({ imported: 287, skipped: 0, failed: 0 })).toBe('Imported 287.')
    expect(formatImportResultMessage({ imported: 2, skipped: 1, failed: 3 })).toBe('Imported 2, skipped 1, 3 failed.')
    expect(formatImportResultMessage({ imported: 0, skipped: 0, failed: 0 })).toBe('Done.')
  })
})
