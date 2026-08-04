/**
 * [REQ-LOCAL_BOOKMARKS_INDEX] Pure storage-type filter for Local Bookmarks Index.
 * True when value is empty (All) or matches bookmark storage. Used by bookmarks-table.js and unit tests.
 * @param {{ storage?: string }} bookmark
 * @param {string} storageFilterValue - '' (All) | 'local' | 'file' | 'sync'
 * @returns {boolean}
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-LOCAL_BOOKMARKS_INDEX_ADD_TAGS ===
 * [IMPL-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] [ARCH-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] [REQ-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] — Add/delete tags to selected bookmarks; parseTagsInput, mergeTags, removeTags, selectionStillVisible; saveBookmark per row. Parse comma-separated input; trim and dedupe case-insensitive.
 *
 * ## MAIN
 *
 * - [IMPL-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] [ARCH-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] [REQ-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] How: Logical block for IMPL-LOCAL_BOOKMARKS_INDEX_ADD_TAGS.
 * - Contract:
 *   - INPUT: context / caller args
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: result
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: MAIN
 *   - 1. parseTagsInput(raw): IF !raw || !raw.trim() RETURN []; parts = raw.split(',').map(s => s.trim()).filter(Boolean); seen = Set(); result = []; FOR p IN parts: low = p.toLowerCase(); IF !seen.has(low): seen.add(low); result.push(p); RETURN result
 *   - How (sub-block): Merge new tags with existing; case-insensitive dedupe.
 *   - 2. mergeTags(existingTags, newTags): existing = existingTags || []; new = newTags || []; lowerSet = Set(existing.map(t => String(t).toLowerCase())); result = [...existing]; FOR tag IN new: t = tag.trim(); IF t && !lowerSet.has(t.toLowerCase()): result.push(t); lowerSet.add(t.toLowerCase()); RETURN result
 *   - How (sub-block): Remove given tags from existing list (case-insensitive).
 *   - 3. removeTags(existingTags, tagsToRemove): removeSet = Set(tagsToRemove.map(t => String(t).trim().toLowerCase()).filter(Boolean)); RETURN existing.filter(t => !removeSet.has(String(t).toLowerCase()))
 *   - How (sub-block): Return set of selected URLs that remain in filtered list.
 *   - 4. selectionStillVisible(selectedUrls, filteredBookmarks): visibleUrls = Set(filteredBookmarks.map(b => b.url).filter(Boolean)); RETURN new Set([...selectedUrls].filter(url => visibleUrls.has(url)))
 *   - How (sub-block): For each selected URL merge new tags and send saveBookmark; refresh and restore selection for still-visible.
 *   - 5. addTagsToSelected(): newTags = parseTagsInput(addTagsInput.value); IF newTags.length === 0 RETURN; urls = Array.from(selectedUrls); byUrl = Map(allBookmarks: url -> bookmark); FOR url IN urls: b = byUrl.get(url); IF !b CONTINUE; payload = buildAddTagsPayload(b, newTags); IF payload SEND saveBookmark(payload); urlsToRestore = Set(selectedUrls); selectedUrls.clear(); loadBookmarks(); FOR url IN selectionStillVisible(urlsToRestore, filteredBookmarks): selectedUrls.add(url); renderTableBody(); addTagsInput.value = ""; updateMoveControlsState()
 *   - How (sub-block): For each selected URL remove tags and send saveBookmark; refresh and restore selection for still-visible.
 *   - 6. deleteTagsFromSelected(): tagsToRemove = parseTagsInput(addTagsInput.value); IF tagsToRemove.length === 0 RETURN; urls = Array.from(selectedUrls); byUrl = Map(allBookmarks: url -> bookmark); FOR url IN urls: b = byUrl.get(url); IF !b CONTINUE; payload = buildRemoveTagsPayload(b, tagsToRemove); IF payload SEND saveBookmark(payload); urlsToRestore = Set(selectedUrls); selectedUrls.clear(); loadBookmarks(); FOR url IN selectionStillVisible(urlsToRestore, filteredBookmarks): selectedUrls.add(url); renderTableBody(); addTagsInput.value = ""; updateMoveControlsState()
 *
 * === END IMPL-FULL-BLOCK: IMPL-LOCAL_BOOKMARKS_INDEX_ADD_TAGS ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE ===
 * [IMPL-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE] [ARCH-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE] [REQ-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE] — Regex find-and-replace on selected fields; applyRegexReplace (pure); regexReplaceSelected sends saveBookmark when changed. Pure function: build payload and set changed iff any selected field value changed.
 *
 * ## APPLY_REGEX_REPLACE
 *
 * - [IMPL-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE] [ARCH-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE] [REQ-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE] How: Implements applyRegexReplace(bookmark, patternStr, replacementStr, options { title, url, tags, notes }) behavior for IMPL-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE.
 * - Contract:
 *   - INPUT: context / caller args
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: result | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: APPLY_REGEX_REPLACE
 *   - TRY reg = new RegExp(patternStr, 'g')
 *   - CATCH e RETURN { payload: null, error: e.message }
 *   - IF !bookmark || !bookmark.url RETURN { payload: null, error: 'missing bookmark or url' }
 *   - IF !patternStr || !patternStr.trim() RETURN { payload: null, error: 'empty pattern' }
 *   - IF !options.title && !options.url && !options.tags && !options.notes RETURN { payload: null, error: 'no fields selected' }
 *   - origDesc = String(bookmark.description ?? ''); origUrl = String(bookmark.url ?? ''); origTags = [...]; origExt = String(bookmark.extended ?? '')
 *   - desc = origDesc; u = origUrl; tagsArr = [...]; ext = origExt
 *   - TRY IF options.title: desc = desc.replace(reg, replacementStr); IF options.url: u = u.replace(reg, replacementStr); IF options.tags: tagsArr = ...; IF options.notes: ext = ext.replace(reg, replacementStr)
 *   - CATCH e RETURN { payload: null, error: e.message }
 *   - changed = (opts.title && desc !== origDesc) || (opts.url && u !== origUrl) || (opts.tags && tagsArr differs from origTags) || (opts.notes && ext !== origExt)
 *   - payload = { url, description: desc, tags: tagsArr, extended: ext, preferredBackend, ...time/updated_at/shared/toread }
 *   - RETURN { payload, error: null, changed }
 *   - How (sub-block): Per selected URL apply regex; save only when changed; refresh and restore selection.
 *
 * ## REGEX_REPLACE_SELECTED
 *
 * - [IMPL-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE] [ARCH-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE] [REQ-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE] How: Implements regexReplaceSelected() behavior for IMPL-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE.
 * - Contract:
 *   - INPUT: context / caller args
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: result | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: REGEX_REPLACE_SELECTED
 *   - patternStr = regexInput.value.trim(); replacementStr = replacementInput.value
 *   - IF !patternStr || selectedUrls.size === 0 RETURN
 *   - options = { title, url, tags, notes } from checkboxes
 *   - IF no field selected: show error; RETURN
 *   - TRY RegExp(patternStr); CATCH: show error; RETURN
 *   - byUrl = Map(allBookmarks: url -> bookmark)
 *   - FOR url IN selectedUrls: b = byUrl.get(url); IF !b CONTINUE; result = applyRegexReplace(b, patternStr, replacementStr, options); IF result.error show and RETURN; IF !result.payload CONTINUE; IF result.changed === false CONTINUE; SEND saveBookmark(result.payload)
 *   - urlsToRestore = Set(selectedUrls); selectedUrls.clear(); loadBookmarks(); selectionStillVisible; renderTableBody(); clear error; updateMoveControlsState()
 *
 * ## ROUTER_STORAGE_REGEX_SAVE
 *
 * - [IMPL-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE] [IMPL-BOOKMARK_ROUTER] [IMPL-LOCAL_BOOKMARKS_INDEX] [IMPL-STORAGE_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE] [REQ-RELIABILITY] How: Connects selected-bookmark regex replacement to preferred-backend router persistence and storage-index refresh.
 * - Contract:
 *   - INPUT: selected URLs, bookmark map, regex options, router save operation
 *   - PRE: selected URLs and replacement options are available
 *   - OUTPUT: refreshed bookmark rows with unchanged selections restored
 *   - POST:
 *     - success => only changed payloads are sent to the router and the display is reloaded
 *   - FAILURE_MODES: InvalidPattern, BookmarkSaveFailed
 *   - DATA: selected URL set and displayed bookmark rows
 *   - DATA_TRANSITION: changed rows are persisted; selection is cleared during reload and restored for visible URLs
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: ROUTER_STORAGE_REGEX_SAVE
 *   - Build replacement payload for each selected URL
 *   - IF replacement is unchanged: skip router save
 *   - AWAIT router save for each changed payload
 *   - Reload bookmark rows
 *   - Restore visible selections
 *
 * === END IMPL-FULL-BLOCK: IMPL-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE ===
 */
/** [REQ-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX] Known Stores used by the Local Bookmarks Index count and filter model. */
export const INDEX_STORE_KEYS = ['local', 'file', 'sync', 'browser']

/**
 * ## COUNT_INDEX_ROWS_BY_STORE
 * - [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [ARCH-STORAGE_INDEX_AND_ROUTER] [ARCH-BROWSER_BOOKMARK_PROVIDER] [REQ-LOCAL_BOOKMARKS_INDEX] [REQ-BROWSER_BOOKMARK_STORAGE] How: Normalize provider storage values, count rows directly, and derive filtered / total counts before applying Store checkbox selection.
 * - Contract:
 *   - INPUT: allBookmarks (provider-row[]), metadataFilteredBookmarks (provider-row[])
 *   - PRE: arrays may be empty; rows may omit storage; storage values may vary in case or contain whitespace; duplicate URLs remain distinct rows
 *   - OUTPUT: { local: { filtered, total }, file: { filtered, total }, sync: { filtered, total }, browser: { filtered, total } }
 *   - POST:
 *     - success => total counts include every loaded row assigned to a known Store
 *     - success => filtered counts include rows surviving search, Show only, Hide, and Health filters, before Store checkbox selection
 *     - success => unknown storage is not attributed to a named Store; missing storage uses Local only for Local fallback rows
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: COUNT_INDEX_ROWS_BY_STORE
 *   - 1. INITIALIZE counts for local, file, sync, browser with filtered = 0 and total = 0
 *   - 2. FOR each row IN allBookmarks: store = NORMALIZE_INDEX_STORAGE(row.storage); IF store is known THEN counts[store].total += 1
 *   - 3. FOR each row IN metadataFilteredBookmarks: store = NORMALIZE_INDEX_STORAGE(row.storage); IF store is known THEN counts[store].filtered += 1
 *   - 4. RETURN counts
 *   - How (sub-block): NORMALIZE_INDEX_STORAGE trims and lowercases local|file|sync|browser; missing storage becomes local only for explicitly marked Local fallback rows; unknown values remain unassigned.
 */
export function normalizeIndexStorage (storage, options = {}) {
  const value = String(storage ?? '').trim().toLowerCase()
  if (INDEX_STORE_KEYS.includes(value)) return value
  if (!value && options.fallbackLocal === true) return 'local'
  return null
}

export function getIndexStoreCounts (allBookmarks, metadataFilteredBookmarks, options = {}) {
  const counts = Object.fromEntries(
    INDEX_STORE_KEYS.map((store) => [store, { filtered: 0, total: 0 }])
  )
  const countRows = (rows, field) => {
    if (!Array.isArray(rows)) return
    for (const row of rows) {
      const store = normalizeIndexStorage(row?.storage, options)
      if (store) counts[store][field] += 1
    }
  }
  countRows(allBookmarks, 'total')
  countRows(metadataFilteredBookmarks, 'filtered')
  return counts
}

export function matchStorageFilter (bookmark, storageFilterValue) {
  if (!storageFilterValue || !storageFilterValue.trim()) return true
  const effective = normalizeIndexStorage(bookmark?.storage, { fallbackLocal: true })
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
  const effective = normalizeIndexStorage(bookmark?.storage, { fallbackLocal: true })
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
 * [IMPL-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] [ARCH-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] [REQ-LOCAL_BOOKMARKS_INDEX_ADD_TAGS]
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
 * [IMPL-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] [ARCH-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] [REQ-LOCAL_BOOKMARKS_INDEX_ADD_TAGS]
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
 * [IMPL-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] [ARCH-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] [REQ-LOCAL_BOOKMARKS_INDEX_ADD_TAGS]
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
 * [IMPL-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] [ARCH-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] [REQ-LOCAL_BOOKMARKS_INDEX_ADD_TAGS]
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
 * [IMPL-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] [ARCH-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] [REQ-LOCAL_BOOKMARKS_INDEX_ADD_TAGS]
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
 * [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [REQ-LOCAL_BOOKMARKS_INDEX]
 * Build deleteBookmark payload with preferredBackend from row Storage column.
 * @param {{ url?: string, storage?: string, [key: string]: unknown }} bookmark
 * @returns {{ url: string, preferredBackend: string } | null}
 */
export function buildDeletePayload (bookmark) {
  if (!bookmark || !bookmark.url) return null
  return {
    url: bookmark.url,
    preferredBackend: (bookmark.storage && String(bookmark.storage).toLowerCase()) || 'local'
  }
}

/**
 * [IMPL-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] [ARCH-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] [REQ-LOCAL_BOOKMARKS_INDEX_ADD_TAGS]
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
 * [IMPL-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] [ARCH-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] [REQ-LOCAL_BOOKMARKS_INDEX_ADD_TAGS]
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
 * [IMPL-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] [ARCH-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] [REQ-LOCAL_BOOKMARKS_INDEX_ADD_TAGS]
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

/**
 * [REQ-BOOKMARK_USAGE_TRACKING] [ARCH-BOOKMARK_USAGE_TRACKING_UI] [IMPL-BOOKMARK_USAGE_TRACKING_UI]
 * Merge usage data (from getBookmarkUsage with no url) into bookmarks array. Adds .visits and .lastVisited to each bookmark.
 * URL matching uses same normalization as tracker (trim, strip trailing slash).
 * @param {{ url?: string }[]} bookmarks
 * @param {{ url?: string, visitCount?: number, lastVisitedAt?: string }[]} usageArray - from getBookmarkUsage() (all)
 * @returns {{ url?: string, visits?: number, lastVisited?: string }[]}
 */
export function mergeUsageIntoBookmarks (bookmarks, usageArray) {
  const clean = (u) => (u && String(u).trim().replace(/\/+$/, '')) || ''
  const map = new Map()
  if (Array.isArray(usageArray)) {
    for (const u of usageArray) {
      const key = clean(u.url)
      if (key) map.set(key, { visitCount: u.visitCount ?? 0, lastVisitedAt: u.lastVisitedAt ?? '' })
    }
  }
  if (!Array.isArray(bookmarks)) return []
  return bookmarks.map((b) => {
    const key = clean(b.url)
    const usage = key ? map.get(key) : null
    return {
      ...b,
      visits: usage ? usage.visitCount : 0,
      lastVisited: usage ? usage.lastVisitedAt : ''
    }
  })
}
