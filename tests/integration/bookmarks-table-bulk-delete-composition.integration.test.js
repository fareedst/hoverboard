/**
 * [REQ-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX] [IMPL-BOOKMARK_ROUTER]
 * Phase G composition: runBulkDelete wires buildDeletePayload → sendMessage → delete-status helpers.
 * No Playwright / no bookmarks-table.js init().
 */

import { runBulkDelete, MESSAGE_TYPE_DELETE } from '../../src/ui/bookmarks-table/bookmarks-table-bulk-delete.js'
import {
  DELETE_PENDING_MESSAGE,
  DELETE_RESULT_PENDING_CLASS,
  DELETE_RESULT_FINAL_CLASS
} from '../../src/ui/bookmarks-table/bookmarks-table-delete-status.js'

describe('[REQ-LOCAL_BOOKMARKS_INDEX] runBulkDelete composition', () => {
  /** @type {HTMLElement} */
  let deleteResultEl

  beforeEach(() => {
    document.body.innerHTML = '<span id="delete-result" class="delete-result" aria-live="polite"></span>'
    deleteResultEl = document.getElementById('delete-result')
  })

  test('confirm cancel leaves status unchanged and does not sendMessage', async () => {
    const sendMessage = jest.fn()
    const onAfterDelete = jest.fn()
    deleteResultEl.textContent = 'prior'

    const result = await runBulkDelete({
      urls: ['https://example.com/a'],
      bookmarksByUrl: new Map([
        ['https://example.com/a', { url: 'https://example.com/a', storage: 'file', description: 'A' }]
      ]),
      sendMessage,
      confirmFn: () => false,
      deleteResultEl,
      onAfterDelete
    })

    expect(result).toEqual({ deleted: 0, failed: 0, cancelled: true })
    expect(sendMessage).not.toHaveBeenCalled()
    expect(onAfterDelete).not.toHaveBeenCalled()
    expect(deleteResultEl.textContent).toBe('prior')
    expect(deleteResultEl.classList.contains(DELETE_RESULT_PENDING_CLASS)).toBe(false)
  })

  test('confirm sends preferredBackend file then shows pending then final Deleted 1.', async () => {
    const sendMessage = jest.fn().mockResolvedValue({ success: true })
    const onAfterDelete = jest.fn().mockResolvedValue()
    const url = 'https://example.com/file-row'

    const result = await runBulkDelete({
      urls: [url],
      bookmarksByUrl: new Map([
        [url, { url, storage: 'file', description: 'File row' }]
      ]),
      sendMessage,
      confirmFn: () => true,
      deleteResultEl,
      onAfterDelete
    })

    expect(sendMessage).toHaveBeenCalledWith({
      type: MESSAGE_TYPE_DELETE,
      data: { url, preferredBackend: 'file' }
    })
    expect(onAfterDelete).toHaveBeenCalled()
    expect(result).toEqual({ deleted: 1, failed: 0, cancelled: false })
    expect(deleteResultEl.textContent).toBe('Deleted 1.')
    expect(deleteResultEl.classList.contains(DELETE_RESULT_FINAL_CLASS)).toBe(true)
    expect(deleteResultEl.classList.contains(DELETE_RESULT_PENDING_CLASS)).toBe(false)
  })

  test('sets pending Deleting… before sendMessage resolves', async () => {
    let pendingDuringSend = ''
    const sendMessage = jest.fn().mockImplementation(async () => {
      pendingDuringSend = deleteResultEl.textContent
      return { success: true }
    })

    await runBulkDelete({
      urls: ['https://example.com/b'],
      bookmarksByUrl: { 'https://example.com/b': { url: 'https://example.com/b', storage: 'local' } },
      sendMessage,
      confirmFn: () => true,
      deleteResultEl
    })

    expect(pendingDuringSend).toBe(DELETE_PENDING_MESSAGE)
  })
})
