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
 * [REQ-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] [IMPL-LOCAL_BOOKMARKS_INDEX_ADD_TAGS]
 * Build confirmation message for Add tags action.
 * @param {string[]} tagList - Tags to add
 * @param {number} count - Number of selected bookmarks
 * @returns {string}
 */
export function buildAddTagsConfirmMessage (tagList, count) {
  const tagsLabel = Array.isArray(tagList) && tagList.length > 0
    ? tagList.join(', ')
    : '(none)'
  return `Add tag(s) "${tagsLabel}" to ${count} bookmark${count !== 1 ? 's' : ''}?`
}

/**
 * [REQ-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] [IMPL-LOCAL_BOOKMARKS_INDEX_ADD_TAGS]
 * Build confirmation message for Delete tags action.
 * @param {string[]} tagList - Tags to remove
 * @param {number} count - Number of selected bookmarks
 * @returns {string}
 */
export function buildRemoveTagsConfirmMessage (tagList, count) {
  const tagsLabel = Array.isArray(tagList) && tagList.length > 0
    ? tagList.join(', ')
    : '(none)'
  return `Remove tag(s) "${tagsLabel}" from ${count} bookmark${count !== 1 ? 's' : ''}?`
}

/**
 * [REQ-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] [IMPL-LOCAL_BOOKMARKS_INDEX_ADD_TAGS]
 * Return Set of selected URLs that are still in the displayed list (intersection).
 * Used after Add tags / Delete tags to retain selection for still-visible rows; records no longer displayed are not included.
 * @param {Set<string>|Iterable<string>} selectedUrls - Previously selected bookmark URLs
 * @param {Array<{ url?: string }>} filteredBookmarks - Currently displayed bookmarks
 * @returns {Set<string>}
 */
export function selectionStillVisible (selectedUrls, filteredBookmarks) {
  const visibleUrls = new Set(
    (Array.isArray(filteredBookmarks) ? filteredBookmarks : [])
      .map(b => b && b.url)
      .filter(Boolean)
  )
  const selected = selectedUrls != null && typeof selectedUrls[Symbol.iterator] === 'function'
    ? [...selectedUrls]
    : []
  return new Set(selected.filter(url => visibleUrls.has(url)))
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

/**
 * [REQ-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] [IMPL-LOCAL_BOOKMARKS_INDEX_ADD_TAGS]
 * Parse comma-separated tag input to array of trimmed non-empty tags; dedupe case-insensitive (keep first).
 * @param {string} raw - User input (e.g. "a, b , A" -> ["a", "b"])
 * @returns {string[]}
 */
export function parseTagsInput (raw) {
  if (!raw || !String(raw).trim()) return []
  const parts = String(raw).split(',').map(s => s.trim()).filter(Boolean)
  const seen = new Set()
  const result = []
  for (const p of parts) {
    const low = p.toLowerCase()
    if (!seen.has(low)) {
      seen.add(low)
      result.push(p)
    }
  }
  return result
}

/**
 * [REQ-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] [IMPL-LOCAL_BOOKMARKS_INDEX_ADD_TAGS]
 * Merge new tags with existing; case-insensitive dedupe; preserve existing casing, append new.
 * @param {string[]} existingTags
 * @param {string[]} newTags
 * @returns {string[]}
 */
export function mergeTags (existingTags, newTags) {
  const existing = Array.isArray(existingTags) ? existingTags : []
  const newArr = Array.isArray(newTags) ? newTags : []
  const lowerSet = new Set(existing.map(t => String(t).toLowerCase()))
  const result = [...existing]
  for (const tag of newArr) {
    const t = String(tag).trim()
    if (t && !lowerSet.has(t.toLowerCase())) {
      result.push(t)
      lowerSet.add(t.toLowerCase())
    }
  }
  return result
}

/**
 * [REQ-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] [IMPL-LOCAL_BOOKMARKS_INDEX_ADD_TAGS]
 * Build payload for saveBookmark when adding tags to a bookmark (merge tags, set preferredBackend).
 * @param {{ url?: string, storage?: string, tags?: string[], [key: string]: unknown }} bookmark
 * @param {string[]} newTags
 * @returns {{ [key: string]: unknown }}
 */
export function buildAddTagsPayload (bookmark, newTags) {
  if (!bookmark || !bookmark.url) return null
  const existing = (bookmark.tags && Array.isArray(bookmark.tags)) ? bookmark.tags : []
  const merged = mergeTags(existing, newTags)
  return {
    ...bookmark,
    tags: merged,
    preferredBackend: (bookmark.storage && String(bookmark.storage).toLowerCase()) || 'local'
  }
}

/**
 * [REQ-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] [IMPL-LOCAL_BOOKMARKS_INDEX_ADD_TAGS]
 * Remove tags from existing list (case-insensitive match); preserve casing of remaining tags.
 * @param {string[]} existingTags
 * @param {string[]} tagsToRemove
 * @returns {string[]}
 */
export function removeTags (existingTags, tagsToRemove) {
  const existing = Array.isArray(existingTags) ? existingTags : []
  const toRemove = Array.isArray(tagsToRemove) ? tagsToRemove : []
  const removeSet = new Set(toRemove.map(t => String(t).trim().toLowerCase()).filter(Boolean))
  if (removeSet.size === 0) return existing
  return existing.filter(t => !removeSet.has(String(t).toLowerCase()))
}

/**
 * [REQ-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] [IMPL-LOCAL_BOOKMARKS_INDEX_ADD_TAGS]
 * Build payload for saveBookmark when removing tags from a bookmark (reduced tags, set preferredBackend).
 * @param {{ url?: string, storage?: string, tags?: string[], [key: string]: unknown }} bookmark
 * @param {string[]} tagsToRemove
 * @returns {{ [key: string]: unknown }}
 */
export function buildRemoveTagsPayload (bookmark, tagsToRemove) {
  if (!bookmark || !bookmark.url) return null
  const existing = (bookmark.tags && Array.isArray(bookmark.tags)) ? bookmark.tags : []
  const reduced = removeTags(existing, tagsToRemove)
  return {
    ...bookmark,
    tags: reduced,
    preferredBackend: (bookmark.storage && String(bookmark.storage).toLowerCase()) || 'local'
  }
}

/**
 * [REQ-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE] [ARCH-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE] [IMPL-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE]
 * Apply regex find-and-replace to a bookmark's text fields. Returns payload for saveBookmark or error.
 * Supports named groups, negative lookahead, backreferences (JavaScript RegExp and replacement semantics).
 * When no error, also returns changed: true iff at least one selected field's value actually changed (so caller can skip save to avoid updating updated_at).
 * @param {{ url?: string, description?: string, tags?: string[], extended?: string, storage?: string, [key: string]: unknown }} bookmark
 * @param {string} patternStr - Regular expression pattern (used with 'g' flag)
 * @param {string} replacementStr - Replacement string ($1, $<name>, $&, $$, etc.)
 * @param {{ title?: boolean, url?: boolean, tags?: boolean, notes?: boolean }} options - Which fields to replace
 * @returns {{ payload: { [key: string]: unknown } | null, error: string | null, changed?: boolean }}
 */
export function applyRegexReplace (bookmark, patternStr, replacementStr, options) {
  if (!bookmark || !bookmark.url) {
    return { payload: null, error: 'missing bookmark or url' }
  }
  if (!patternStr || !String(patternStr).trim()) {
    return { payload: null, error: 'empty pattern' }
  }
  const opts = options || {}
  if (!opts.title && !opts.url && !opts.tags && !opts.notes) {
    return { payload: null, error: 'no fields selected' }
  }
  let reg
  try {
    reg = new RegExp(String(patternStr).trim(), 'g')
  } catch (e) {
    return { payload: null, error: e instanceof Error ? e.message : String(e) }
  }
  const origDescription = String(bookmark.description ?? '')
  const origUrl = String(bookmark.url ?? '')
  const origTagsArr = Array.isArray(bookmark.tags) ? bookmark.tags.map(t => String(t)) : []
  const origExtended = String(bookmark.extended ?? '')
  let description = origDescription
  let url = origUrl
  let tagsArr = Array.isArray(bookmark.tags) ? [...bookmark.tags].map(t => String(t)) : []
  let extended = origExtended
  try {
    if (opts.title) description = description.replace(reg, replacementStr)
    if (opts.url) url = url.replace(reg, replacementStr)
    if (opts.tags) tagsArr = tagsArr.map(t => String(t).replace(reg, replacementStr))
    if (opts.notes) extended = extended.replace(reg, replacementStr)
  } catch (e) {
    return { payload: null, error: e instanceof Error ? e.message : String(e) }
  }
  const titleChanged = opts.title && description !== origDescription
  const urlChanged = opts.url && url !== origUrl
  const tagsChanged = opts.tags && (tagsArr.length !== origTagsArr.length || tagsArr.some((t, i) => t !== (origTagsArr[i] ?? '')))
  const notesChanged = opts.notes && extended !== origExtended
  const changed = titleChanged || urlChanged || tagsChanged || notesChanged
  const preferredBackend = (bookmark.storage && String(bookmark.storage).toLowerCase()) || 'local'
  const payload = {
    url: opts.url ? url : bookmark.url,
    description,
    tags: tagsArr,
    extended,
    preferredBackend,
    ...(bookmark.time != null && { time: bookmark.time }),
    ...(bookmark.updated_at != null && { updated_at: bookmark.updated_at }),
    ...(bookmark.shared != null && { shared: bookmark.shared }),
    ...(bookmark.toread != null && { toread: bookmark.toread })
  }
  return { payload, error: null, changed }
}
