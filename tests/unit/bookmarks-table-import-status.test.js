/**
 * === IMPL-FULL-BLOCK: IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT ===
 * [IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT] [ARCH-LOCAL_BOOKMARKS_INDEX_IMPORT] [REQ-LOCAL_BOOKMARKS_INDEX_IMPORT] — One Import control group with File CSV/JSON and live Browser sources; target-scoped file conflicts plus selective Browser-tree migration; saveBookmark per row; pending then final result in #import-result.
 *
 * ## RUN_FILE_IMPORT
 *
 * - [IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT] [ARCH-LOCAL_BOOKMARKS_INDEX_IMPORT] [REQ-LOCAL_BOOKMARKS_INDEX_IMPORT] — group is independent of selection actions. How: Implements runImport(file) behavior for IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT.
 * - Contract:
 *   - INPUT: source (File | Browser), file when source=File, mode (Only new | Overwrite) for File, conflict mode (Skip | Overwrite | Merge tags) for Browser, preferredBackend, allBookmarks
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: imported count, skipped count, failed count; refreshed table; #import-result pending then final | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: file rows = array of { url, description, tags, time, updated_at, shared, toread, extended }; Browser rows = collapsed live tree records; existingByUrl = set of URLs from selected target only
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: RUN_FILE_IMPORT
 *   - text = read file as text
 *   - rows = parseImportFile(text, filename)   // CSV -> parseCsv; JSON -> normalize array; skip empty url
 *   - IF rows empty: SHOW error in #import-result (not pending/final success); RETURN
 *   - existingByUrl = BUILD_TARGET_BOOKMARKS_BY_URL(allBookmarks, preferredBackend)
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
 * ## RUN_BROWSER_IMPORT
 *
 * - [IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT] [ARCH-LOCAL_BOOKMARKS_INDEX_IMPORT] [REQ-LOCAL_BOOKMARKS_INDEX_IMPORT] How: The shared Index Import control delegates the live Browser source to IMPL-BROWSER_BOOKMARK_IMPORT while retaining one result/status surface.
 * - Contract:
 *   - INPUT: selected live Browser records, target Local|File|Sync, Skip|Overwrite|Merge tags, folder-tag toggle, extra tags
 *   - PRE: Browser source records are collapsed by cleaned URL; Browser is excluded as a destination
 *   - OUTPUT: imported/skipped/failed counts and refreshed Index
 *   - POST:
 *     - success => counts reflect best-effort per-row writes and the Index is refreshed
 *     - error OperationFailed => no writes occur after target conflict lookup failure
 *   - FAILURE_MODES: OperationFailed, InvalidTarget
 *   - DATA: existingByUrl = selected target rows only; selected Browser rows; import result counters
 *   - DATA_TRANSITION: each save outcome updates a result counter; completion refreshes the Index and result surface
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: RUN_BROWSER_IMPORT
 *   - existingByUrl = BUILD_TARGET_BOOKMARKS_BY_URL(aggregate rows, target)
 *   - IF target conflict lookup fails: retry Local only for Local target; otherwise SHOW error and RETURN without writes
 *   - FOR each selected Browser record:
 *   - IF existingByUrl contains url AND mode = Skip: skipped++
 *   - ELSE BUILD payload with root-stripped folder tags and sanitized extra tags
 *   - SEND saveBookmark({ ...payload, preferredBackend: target })
 *   - loadBookmarks(); SHOW final counts
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
