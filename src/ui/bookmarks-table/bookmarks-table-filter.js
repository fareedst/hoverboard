/**
 * [REQ-LOCAL_BOOKMARKS_INDEX] Pure storage-type filter for Local Bookmarks Index.
 * True when value is empty (All) or matches bookmark storage. Used by bookmarks-table.js and unit tests.
 * @param {{ storage?: string }} bookmark
 * @param {string} storageFilterValue - '' (All) | 'local' | 'file' | 'sync'
 * @returns {boolean}
 */
export function matchStorageFilter (bookmark, storageFilterValue) {
  if (!storageFilterValue || !storageFilterValue.trim()) return true
  const effective = (bookmark.storage || 'local').trim().toLowerCase()
  const value = storageFilterValue.trim().toLowerCase()
  return effective === value
}
