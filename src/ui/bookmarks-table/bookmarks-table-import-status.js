/**
 * [REQ-LOCAL_BOOKMARKS_INDEX_IMPORT] [ARCH-LOCAL_BOOKMARKS_INDEX_IMPORT] [IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT]
 * Pending vs final messaging for #import-result on Local Bookmarks Index Import control group.
 */

export const IMPORT_PENDING_MESSAGE = 'Importing…'
export const IMPORT_RESULT_PENDING_CLASS = 'is-pending'
export const IMPORT_RESULT_FINAL_CLASS = 'is-final'

/**
 * Show accepted/pending state in #import-result (warning color via CSS).
 * @param {HTMLElement | null} el
 */
export function setImportResultPending (el) {
  if (!el) return
  el.textContent = IMPORT_PENDING_MESSAGE
  el.classList.add(IMPORT_RESULT_PENDING_CLASS)
  el.classList.remove(IMPORT_RESULT_FINAL_CLASS)
}

/**
 * Show final counts (or success message) in #import-result (success color via CSS).
 * @param {HTMLElement | null} el
 * @param {string} message
 */
export function setImportResultFinal (el, message) {
  if (!el) return
  el.textContent = message
  el.classList.remove(IMPORT_RESULT_PENDING_CLASS)
  el.classList.add(IMPORT_RESULT_FINAL_CLASS)
}

/**
 * Show error / non-success message; clear pending/final success classes.
 * @param {HTMLElement | null} el
 * @param {string} message
 */
export function setImportResultError (el, message) {
  if (!el) return
  el.textContent = message
  el.classList.remove(IMPORT_RESULT_PENDING_CLASS, IMPORT_RESULT_FINAL_CLASS)
}

/**
 * Build final import summary string from counts.
 * @param {{ imported: number, skipped: number, failed: number }} counts
 * @returns {string}
 */
export function formatImportResultMessage ({ imported, skipped, failed }) {
  const parts = []
  if (imported > 0) parts.push(`Imported ${imported}`)
  if (skipped > 0) parts.push(`skipped ${skipped}`)
  if (failed > 0) parts.push(`${failed} failed`)
  return parts.length ? parts.join(', ') + '.' : 'Done.'
}
