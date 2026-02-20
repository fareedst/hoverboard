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

/**
 * [REQ-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX] Store checkboxes filter.
 * Include only bookmarks whose storage is in the allowed set. If allowedStores is empty, no bookmark passes.
 * @param {{ storage?: string }} bookmark
 * @param {Set<string>} allowedStores - Set of 'local' | 'file' | 'sync' (from checked store checkboxes)
 * @returns {boolean}
 */
export function matchStoresFilter (bookmark, allowedStores) {
  if (!allowedStores || allowedStores.size === 0) return false
  const effective = (bookmark.storage || 'local').trim().toLowerCase()
  return allowedStores.has(effective)
}

/**
 * [IMPL-LOCAL_BOOKMARKS_INDEX] Parse optional datetime value (e.g. from datetime-local input) to timestamp ms; null if empty/invalid.
 * @param {string} val
 * @returns {number|null}
 */
export function parseTimeRangeValue (val) {
  if (!val || !String(val).trim()) return null
  const date = new Date(val)
  return isNaN(date.getTime()) ? null : date.getTime()
}

/**
 * [IMPL-LOCAL_BOOKMARKS_INDEX] Get bookmark time as timestamp for range comparison (time or updated_at).
 * @param {{ time?: string, updated_at?: string }} bookmark
 * @param {string} field - 'time' | 'updated_at'
 * @returns {number|null}
 */
export function getBookmarkTimeMs (bookmark, field) {
  const raw = field === 'updated_at' ? (bookmark.updated_at ?? bookmark.time) : (bookmark.time ?? bookmark.updated_at)
  if (!raw) return null
  const date = new Date(raw)
  return isNaN(date.getTime()) ? null : date.getTime()
}

/**
 * [IMPL-LOCAL_BOOKMARKS_INDEX] True if bookmark's time (for field) is within [startMs, endMs] (inclusive). Null bounds are ignored.
 * @param {{ time?: string, updated_at?: string }} bookmark
 * @param {string} field - 'time' | 'updated_at'
 * @param {number|null} startMs
 * @param {number|null} endMs
 * @returns {boolean}
 */
export function inTimeRange (bookmark, field, startMs, endMs) {
  const ms = getBookmarkTimeMs(bookmark, field)
  if (ms == null) return false
  if (startMs != null && ms < startMs) return false
  if (endMs != null && ms > endMs) return false
  return true
}

/**
 * [IMPL-LOCAL_BOOKMARKS_INDEX] Exclude bookmarks that have any of the exclude tags (case-insensitive). Empty string = include all.
 * @param {{ tags?: string[] }} bookmark
 * @param {string} excludeTagString - Comma-separated tags to exclude
 * @returns {boolean} true to keep (no exclude tag matched), false to hide
 */
export function matchExcludeTags (bookmark, excludeTagString) {
  const trimmed = (excludeTagString || '').trim()
  if (!trimmed) return true
  const excludeTags = trimmed.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
  if (excludeTags.length === 0) return true
  const bTags = (bookmark.tags || []).map(t => String(t).toLowerCase())
  const hasAny = excludeTags.some(t => bTags.includes(t))
  return !hasAny
}

/**
 * [IMPL-LOCAL_BOOKMARKS_INDEX] Build delete confirmation message: count and optionally titles (if count ≤ 8).
 * @param {number} count
 * @param {string[]} titles
 * @returns {string}
 */
export function buildDeleteConfirmMessage (count, titles) {
  let message = `Delete ${count} bookmark${count !== 1 ? 's' : ''}?`
  if (count <= 8 && Array.isArray(titles) && titles.length > 0) {
    message += '\n\n' + titles.map(t => (t && String(t).trim()) || '(no title)').join('\n')
  }
  return message
}

/**
 * [REQ-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX]
 * Default state for the "Show only" group. Used by Clear button to reset controls.
 * @returns {{ tags: string, toread: boolean, private: boolean, timeRangeStart: string, timeRangeEnd: string, timeRangeField: string }}
 */
export function getShowOnlyDefaultState () {
  return {
    tags: '',
    toread: false,
    private: false,
    timeRangeStart: '',
    timeRangeEnd: '',
    timeRangeField: 'updated_at'
  }
}
