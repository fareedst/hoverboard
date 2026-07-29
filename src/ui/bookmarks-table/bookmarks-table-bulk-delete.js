/**
 * [REQ-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX] [IMPL-BOOKMARK_ROUTER]
 * Bulk Delete orchestrator: confirm → pending → deleteBookmark with preferredBackend → final counts.
 * Extracted for Phase G composition tests (bookmarks-table.js calls init() at load).
 */

import { buildDeleteConfirmMessage, buildDeletePayload } from './bookmarks-table-filter.js'
import {
  setDeleteResultPending,
  setDeleteResultFinal,
  formatDeleteResultMessage
} from './bookmarks-table-delete-status.js'

export const MESSAGE_TYPE_DELETE = 'deleteBookmark'

/**
 * Run Index Bulk Delete for the given URLs.
 * @param {object} opts
 * @param {string[]} opts.urls
 * @param {Map<string, object>|Record<string, object>} opts.bookmarksByUrl - url → bookmark (with storage)
 * @param {(msg: { type: string, data: object }) => Promise<{ success?: boolean }>} opts.sendMessage
 * @param {(message: string) => boolean} opts.confirmFn
 * @param {HTMLElement | null} opts.deleteResultEl
 * @param {() => Promise<void>|void} [opts.onAfterDelete] - e.g. loadBookmarks + clear selection
 * @returns {Promise<{ deleted: number, failed: number, cancelled: boolean }>}
 */
export async function runBulkDelete ({
  urls,
  bookmarksByUrl,
  sendMessage,
  confirmFn,
  deleteResultEl,
  onAfterDelete
}) {
  if (!urls || urls.length === 0) {
    return { deleted: 0, failed: 0, cancelled: false }
  }

  const lookup = bookmarksByUrl instanceof Map
    ? bookmarksByUrl
    : new Map(Object.entries(bookmarksByUrl || {}))

  const titles = urls.map(u => {
    const b = lookup.get(u)
    return (b && b.description) || '(no title)'
  })
  const message = buildDeleteConfirmMessage(urls.length, titles)
  if (!confirmFn(message)) {
    return { deleted: 0, failed: 0, cancelled: true }
  }

  setDeleteResultPending(deleteResultEl)
  let ok = 0
  let fail = 0
  for (const url of urls) {
    try {
      const bookmark = lookup.get(url) || { url }
      const payload = buildDeletePayload(bookmark)
      if (!payload) {
        fail++
        continue
      }
      const res = await sendMessage({ type: MESSAGE_TYPE_DELETE, data: payload })
      if (res && res.success) ok++
      else fail++
    } catch (e) {
      console.warn('[IMPL-LOCAL_BOOKMARKS_INDEX] deleteBookmark failed for', url, e)
      fail++
    }
  }

  if (typeof onAfterDelete === 'function') {
    await onAfterDelete({ deleted: ok, failed: fail })
  }

  setDeleteResultFinal(deleteResultEl, formatDeleteResultMessage({ deleted: ok, failed: fail }))
  if (fail > 0) {
    console.warn('[IMPL-LOCAL_BOOKMARKS_INDEX] Delete completed:', ok, 'deleted,', fail, 'failed')
  }
  return { deleted: ok, failed: fail, cancelled: false }
}
