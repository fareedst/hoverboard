/**
 * Delete result pending/final helpers — [REQ-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX]
 */

import {
  DELETE_PENDING_MESSAGE,
  DELETE_RESULT_PENDING_CLASS,
  DELETE_RESULT_FINAL_CLASS,
  setDeleteResultPending,
  setDeleteResultFinal,
  setDeleteResultError,
  formatDeleteResultMessage
} from '../../src/ui/bookmarks-table/bookmarks-table-delete-status.js'

describe('delete result status [REQ-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX]', () => {
  let el

  beforeEach(() => {
    el = document.createElement('span')
    el.id = 'delete-result'
  })

  test('setDeleteResultPending shows Deleting… with is-pending class', () => {
    setDeleteResultPending(el)
    expect(el.textContent).toBe(DELETE_PENDING_MESSAGE)
    expect(el.textContent).toBe('Deleting…')
    expect(el.classList.contains(DELETE_RESULT_PENDING_CLASS)).toBe(true)
    expect(el.classList.contains(DELETE_RESULT_FINAL_CLASS)).toBe(false)
  })

  test('setDeleteResultFinal replaces pending with final message and is-final class', () => {
    setDeleteResultPending(el)
    setDeleteResultFinal(el, 'Deleted 282.')
    expect(el.textContent).toBe('Deleted 282.')
    expect(el.classList.contains(DELETE_RESULT_PENDING_CLASS)).toBe(false)
    expect(el.classList.contains(DELETE_RESULT_FINAL_CLASS)).toBe(true)
  })

  test('setDeleteResultError clears pending/final classes', () => {
    setDeleteResultPending(el)
    setDeleteResultError(el, 'Delete failed.')
    expect(el.textContent).toBe('Delete failed.')
    expect(el.classList.contains(DELETE_RESULT_PENDING_CLASS)).toBe(false)
    expect(el.classList.contains(DELETE_RESULT_FINAL_CLASS)).toBe(false)
  })

  test('formatDeleteResultMessage builds count summary', () => {
    expect(formatDeleteResultMessage({ deleted: 282, failed: 0 })).toBe('Deleted 282.')
    expect(formatDeleteResultMessage({ deleted: 280, failed: 2 })).toBe('Deleted 280, 2 failed.')
    expect(formatDeleteResultMessage({ deleted: 0, failed: 0 })).toBe('Done.')
    expect(formatDeleteResultMessage({ deleted: 0, failed: 3 })).toBe('3 failed.')
  })
})
