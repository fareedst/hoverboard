/**
 * [REQ-THIS_PAGE_TAG_SORT] [ARCH-THIS_PAGE_TAG_SORT] [IMPL-THIS_PAGE_TAG_SORT]
 * Pure sort helpers for This Page tag chips: alphabetical, bookmark-frequency, relevance (DOM tier).
 */

/** @typedef {'alphabetical' | 'frequency' | 'relevance'} TagChipSortMode */

export const TAG_CHIP_SORT_MODES = /** @type {const} */ ([
  'alphabetical',
  'frequency',
  'relevance'
])

/**
 * @param {string} mode
 * @returns {mode is TagChipSortMode}
 */
export function isTagChipSortMode (mode) {
  return TAG_CHIP_SORT_MODES.includes(/** @type {TagChipSortMode} */ (mode))
}

/**
 * @param {Record<string, number> | null | undefined} frequencyMap
 * @param {string} tag
 * @returns {number}
 */
export function lookupBookmarkFrequency (frequencyMap, tag) {
  if (!frequencyMap || tag == null || typeof tag !== 'string') return 0
  const t = tag.trim()
  if (!t) return 0
  const n = frequencyMap[t]
  if (typeof n === 'number' && !Number.isNaN(n)) return n
  const lower = t.toLowerCase()
  for (const k of Object.keys(frequencyMap)) {
    if (k.toLowerCase() === lower) {
      const v = frequencyMap[k]
      return typeof v === 'number' && !Number.isNaN(v) ? v : 0
    }
  }
  return 0
}

/**
 * One row per chip before sort. canonical = stored tag string for add/remove; displayKey = case-folded display for ordering.
 * [IMPL-THIS_PAGE_TAG_SORT] Alphabetical: localeCompare(displayKey lower) then stableIndex.
 * Frequency: bookmarkFreq desc, then displayKey CI, then stableIndex.
 * Relevance: relevance desc; tie bookmarkFreq desc, inPageFreq desc, displayKey CI, stableIndex.
 *
 * @param {Array<{ canonical: string, displayKey: string, stableIndex: number, bookmarkFreq?: number, relevance?: number, inPageFreq?: number }>} rows
 * @param {TagChipSortMode} mode
 * @returns {Array<{ canonical: string, displayKey: string, stableIndex: number, bookmarkFreq?: number, relevance?: number, inPageFreq?: number }>} rows in render order
 */
export function sortTagChipRows (rows, mode) {
  if (!Array.isArray(rows) || rows.length === 0) return []
  const copy = rows.map((r) => ({ ...r }))
  const disp = (r) => (r.displayKey || '').toLowerCase()

  copy.sort((a, b) => {
    if (mode === 'alphabetical') {
      const c = disp(a).localeCompare(disp(b))
      if (c !== 0) return c
      return a.stableIndex - b.stableIndex
    }
    if (mode === 'frequency') {
      const fa = a.bookmarkFreq ?? 0
      const fb = b.bookmarkFreq ?? 0
      if (fb !== fa) return fb - fa
      const c = disp(a).localeCompare(disp(b))
      if (c !== 0) return c
      return a.stableIndex - b.stableIndex
    }
    // relevance
    const ra = a.relevance ?? 0
    const rb = b.relevance ?? 0
    if (rb !== ra) return rb - ra
    const fa = a.bookmarkFreq ?? 0
    const fb = b.bookmarkFreq ?? 0
    if (fb !== fa) return fb - fa
    const ia = a.inPageFreq ?? 0
    const ib = b.inPageFreq ?? 0
    if (ib !== ia) return ib - ia
    const c2 = disp(a).localeCompare(disp(b))
    if (c2 !== 0) return c2
    return a.stableIndex - b.stableIndex
  })

  return copy
}
