/**
 * Import result pending/final helpers — [REQ-LOCAL_BOOKMARKS_INDEX_IMPORT] [ARCH-LOCAL_BOOKMARKS_INDEX_IMPORT] [IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT]
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
