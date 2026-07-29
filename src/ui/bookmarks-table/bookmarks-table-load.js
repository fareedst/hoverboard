/**
 * [REQ-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX]
 * Index load helpers: aggregate failure detection, store-change reload.
 * Extracted for unit tests (bookmarks-table.js calls init() at load).
 * Provider init mutex: re-export from shared for SW + unit tests.
 */

export { createProviderInitMutex } from '../../shared/async-init-mutex.js'

/**
 * True when aggregated index response should trigger local fallback.
 * Empty bookmarks alone is not failure; error / success:false is (even with []).
 * @param {unknown} response
 * @returns {boolean}
 */
export function isAggregatedIndexLoadFailure (response) {
  if (response == null || typeof response !== 'object') return true
  const r = /** @type {Record<string, unknown>} */ (response)
  if (r.success === false) return true
  if (r.error != null && r.error !== '') return true
  const data = r.data
  if (data != null && typeof data === 'object') {
    const d = /** @type {Record<string, unknown>} */ (data)
    if (d.success === false) return true
    if (d.error != null && d.error !== '') return true
  }
  return false
}

/**
 * @param {unknown} response
 * @returns {unknown}
 */
export function extractBookmarksList (response) {
  if (response == null || typeof response !== 'object') return undefined
  const r = /** @type {Record<string, unknown>} */ (response)
  const data = r.data
  if (data != null && typeof data === 'object' && 'bookmarks' in /** @type {object} */ (data)) {
    return /** @type {Record<string, unknown>} */ (data).bookmarks
  }
  return r.bookmarks
}

/**
 * @param {{ allBookmarksLength: number, allowedStoresSize: number }} opts
 * @returns {boolean}
 */
export function shouldReloadBookmarksOnStoreChange ({ allBookmarksLength, allowedStoresSize }) {
  return allBookmarksLength === 0 && allowedStoresSize > 0
}

/**
 * Store checkbox change: refilter; reload when cache empty and a store is selected.
 * @param {object} opts
 * @param {number} opts.allBookmarksLength
 * @param {number} opts.allowedStoresSize
 * @param {() => void} opts.applySearchAndFilter
 * @param {() => Promise<void>|void} opts.loadBookmarks
 */
export async function onStoreFilterChange ({
  allBookmarksLength,
  allowedStoresSize,
  applySearchAndFilter,
  loadBookmarks
}) {
  applySearchAndFilter()
  if (shouldReloadBookmarksOnStoreChange({ allBookmarksLength, allowedStoresSize })) {
    console.debug('[IMPL-LOCAL_BOOKMARKS_INDEX] store-change reload: allBookmarks empty, re-fetching')
    await loadBookmarks()
  }
}
