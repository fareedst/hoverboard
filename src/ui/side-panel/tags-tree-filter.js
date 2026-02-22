/**
 * [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]
 * Pure filter/sort/group helpers for side panel. Implements selection by time range, tags include, domain;
 * display sort and group by create date, update date, tags, domain. All functions pure and testable.
 *
 * [REQ-SIDE_PANEL_BOOKMARK_SEARCH] [ARCH-SIDE_PANEL_BOOKMARK_SEARCH] [IMPL-SIDE_PANEL_BOOKMARK_SEARCH]
 * filterBookmarksBySearch: text filter on displayed list (title, URL, tags, notes); implements search and match count data source.
 */

import { getBookmarkTimeMs, inTimeRange } from '../bookmarks-table/bookmarks-table-filter.js'

/**
 * [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]
 * Returns hostname from URL for domain filter/group. Invalid or empty URL returns ''. No throw. Implements domain axis.
 * @param {string} url
 * @returns {string}
 */
export function getDomainFromUrl (url) {
  if (!url || !String(url).trim()) return ''
  try {
    const u = new URL(url)
    return (u.hostname || '').toLowerCase()
  } catch {
    return ''
  }
}

/**
 * [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]
 * Keeps bookmarks whose time (field time or updated_at) is within [startMs, endMs] inclusive. Null bounds ignored. Implements time range filter.
 * @param {Array<{ time?: string, updated_at?: string }>} bookmarks
 * @param {string} field - 'time' | 'updated_at'
 * @param {number|null} startMs
 * @param {number|null} endMs
 * @returns {Array<{ time?: string, updated_at?: string }>}
 */
export function filterByTimeRange (bookmarks, field, startMs, endMs) {
  if (!Array.isArray(bookmarks)) return []
  return bookmarks.filter(b => inTimeRange(b, field, startMs, endMs))
}

/**
 * [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]
 * Keeps bookmarks that have at least one tag in tagSet (case-insensitive). Empty tagSet = all pass. Implements tags include filter.
 * @param {Array<{ tags?: string[] }>} bookmarks
 * @param {Set<string>} tagSet
 * @returns {Array<{ tags?: string[] }>}
 */
export function filterByTagsInclude (bookmarks, tagSet) {
  if (!Array.isArray(bookmarks)) return []
  if (!tagSet || tagSet.size === 0) return [...bookmarks]
  const lower = new Set([...tagSet].map(t => String(t).toLowerCase()))
  return bookmarks.filter(b => {
    const bTags = (b.tags || []).map(t => String(t).toLowerCase())
    return bTags.some(t => lower.has(t))
  })
}

/**
 * [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]
 * Keeps bookmarks whose URL hostname is in domainSet (case-insensitive). Empty domainSet = all pass. Implements domain filter.
 * @param {Array<{ url?: string }>} bookmarks
 * @param {Set<string>} domainSet
 * @returns {Array<{ url?: string }>}
 */
export function filterByDomains (bookmarks, domainSet) {
  if (!Array.isArray(bookmarks)) return []
  if (!domainSet || domainSet.size === 0) return [...bookmarks]
  const lower = new Set([...domainSet].map(d => String(d).toLowerCase()))
  return bookmarks.filter(b => {
    const domain = getDomainFromUrl(b.url)
    return domain && lower.has(domain)
  })
}

/**
 * [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]
 * Default config keys for filter state. Sub-block: documents config shape for applyFilters.
 */
const DEFAULT_TIME_FIELD = 'updated_at'
const DEFAULT_SORT_BY = 'updated_at'
const DEFAULT_SORT_ASC = false
const DEFAULT_GROUP_BY = 'none'

/**
 * [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]
 * Applies time, tags, domain filters in sequence. filterState: { timeField, timeStart, timeEnd, tagsInclude (Set), domains (Set) }. Implements filter pipeline.
 * @param {Array<object>} bookmarks
 * @param {{ timeField?: string, timeStart?: number|null, timeEnd?: number|null, tagsInclude?: Set<string>, domains?: Set<string> }} filterState
 * @returns {Array<object>}
 */
export function applyFilters (bookmarks, filterState) {
  if (!Array.isArray(bookmarks)) return []
  const field = filterState?.timeField ?? DEFAULT_TIME_FIELD
  const start = filterState?.timeStart ?? null
  const end = filterState?.timeEnd ?? null
  let list = filterByTimeRange(bookmarks, field, start, end)
  list = filterByTagsInclude(list, filterState?.tagsInclude)
  list = filterByDomains(list, filterState?.domains)
  return list
}

/**
 * [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]
 * Gets sort key value for a bookmark for the given axis. Sub-block: implements key extraction for sort.
 */
function getSortKey (bookmark, sortBy) {
  if (sortBy === 'time' || sortBy === 'updated_at') {
    const ms = getBookmarkTimeMs(bookmark, sortBy)
    return ms != null ? ms : 0
  }
  if (sortBy === 'tag') {
    const tags = Array.isArray(bookmark.tags) ? bookmark.tags : []
    const first = tags[0]
    return (first != null ? String(first) : '').toLowerCase()
  }
  if (sortBy === 'domain') {
    return getDomainFromUrl(bookmark.url)
  }
  return ''
}

/**
 * [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]
 * Sorts bookmarks by chosen axis (time, updated_at, tag, domain) and direction. Implements display sort.
 * @param {Array<object>} bookmarks
 * @param {string} sortBy - 'time' | 'updated_at' | 'tag' | 'domain'
 * @param {boolean} sortAsc
 * @returns {Array<object>}
 */
export function sortBookmarks (bookmarks, sortBy, sortAsc) {
  if (!Array.isArray(bookmarks)) return []
  const by = sortBy || DEFAULT_SORT_BY
  const arr = [...bookmarks]
  arr.sort((a, b) => {
    const va = getSortKey(a, by)
    const vb = getSortKey(b, by)
    let cmp
    if (typeof va === 'number' && typeof vb === 'number') cmp = va - vb
    else cmp = String(va).localeCompare(String(vb))
    return sortAsc ? cmp : -cmp
  })
  return arr
}

/**
 * [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]
 * Gets group key for a bookmark for the given groupBy axis. Sub-block: implements key extraction for group.
 */
function getGroupKey (bookmark, groupBy) {
  if (groupBy === 'time' || groupBy === 'updated_at') {
    const ms = getBookmarkTimeMs(bookmark, groupBy)
    if (ms == null) return ''
    const d = new Date(ms)
    return d.toISOString().slice(0, 10)
  }
  if (groupBy === 'tag') {
    const tags = Array.isArray(bookmark.tags) ? bookmark.tags : []
    return tags.length ? String(tags[0]).trim() : ''
  }
  if (groupBy === 'domain') {
    return getDomainFromUrl(bookmark.url)
  }
  return ''
}

/**
 * [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]
 * Groups sorted bookmarks by axis; returns Map<groupKey, bookmark[]>. groupBy 'none' returns null. Implements display group by.
 * @param {Array<object>} bookmarks
 * @param {string} groupBy - 'none' | 'time' | 'updated_at' | 'tag' | 'domain'
 * @returns {Map<string, Array<object>>|null}
 */
export function groupBookmarksBy (bookmarks, groupBy) {
  if (!Array.isArray(bookmarks)) return null
  if (!groupBy || groupBy === 'none') return null
  const map = new Map()
  for (const b of bookmarks) {
    const key = getGroupKey(b, groupBy) || '(none)'
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(b)
  }
  return map
}

/**
 * [REQ-SIDE_PANEL_BOOKMARK_SEARCH] [ARCH-SIDE_PANEL_BOOKMARK_SEARCH] [IMPL-SIDE_PANEL_BOOKMARK_SEARCH]
 * Returns bookmarks where query (trimmed, case-insensitive) appears in description, url, tags (joined), or extended.
 * Empty/whitespace query returns full list. Implements "search displayed list by text" and match count source.
 * @param {Array<{ url?: string, description?: string, tags?: string[], extended?: string }>} bookmarks
 * @param {string} query
 * @returns {Array<object>}
 */
export function filterBookmarksBySearch (bookmarks, query) {
  if (!Array.isArray(bookmarks)) return []
  const q = String(query ?? '').trim().toLowerCase()
  if (q === '') return [...bookmarks]
  return bookmarks.filter(b => {
    const title = (b.description ?? '').toLowerCase()
    const url = (b.url ?? '').toLowerCase()
    const tags = (Array.isArray(b.tags) ? b.tags : []).map(t => String(t)).join(' ').toLowerCase()
    const extended = (b.extended ?? '').toLowerCase()
    return title.includes(q) || url.includes(q) || tags.includes(q) || extended.includes(q)
  })
}
