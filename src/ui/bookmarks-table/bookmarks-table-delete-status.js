/**
 * [REQ-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX]
 * Pending vs final messaging for #delete-result on Local Bookmarks Index Delete action.
 */

export const DELETE_PENDING_MESSAGE = 'Deleting…'
export const DELETE_RESULT_PENDING_CLASS = 'is-pending'
export const DELETE_RESULT_FINAL_CLASS = 'is-final'

/**
 * Show accepted/pending state in #delete-result (warning color via CSS).
 * @param {HTMLElement | null} el
 */
export function setDeleteResultPending (el) {
  if (!el) return
  el.textContent = DELETE_PENDING_MESSAGE
  el.classList.add(DELETE_RESULT_PENDING_CLASS)
  el.classList.remove(DELETE_RESULT_FINAL_CLASS)
}

/**
 * Show final counts (or success message) in #delete-result (success color via CSS).
 * @param {HTMLElement | null} el
 * @param {string} message
 */
export function setDeleteResultFinal (el, message) {
  if (!el) return
  el.textContent = message
  el.classList.remove(DELETE_RESULT_PENDING_CLASS)
  el.classList.add(DELETE_RESULT_FINAL_CLASS)
}

/**
 * Show error / non-success message; clear pending/final success classes.
 * @param {HTMLElement | null} el
 * @param {string} message
 */
export function setDeleteResultError (el, message) {
  if (!el) return
  el.textContent = message
  el.classList.remove(DELETE_RESULT_PENDING_CLASS, DELETE_RESULT_FINAL_CLASS)
}

/**
 * Build final delete summary string from counts.
 * @param {{ deleted: number, failed: number }} counts
 * @returns {string}
 */
export function formatDeleteResultMessage ({ deleted, failed }) {
  const parts = []
  if (deleted > 0) parts.push(`Deleted ${deleted}`)
  if (failed > 0) parts.push(`${failed} failed`)
  return parts.length ? parts.join(', ') + '.' : 'Done.'
}
