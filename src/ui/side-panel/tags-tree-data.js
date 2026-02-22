/**
 * [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]
 * Pure helpers for side panel tags tree. This module implements the data shape required by the tag tree: tag → bookmarks map and unique tag list from index bookmarks; and click-URL-opens-in-new-tab.
 */

/**
 * [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]
 * Build a map of tag → array of { title, url } from aggregated bookmarks. Implements requirement "tag-based tree" by producing the structure the panel uses to render tag → URL lists.
 * @param {Array<{ tags?: string[], url?: string, description?: string }>} bookmarks
 * @returns {Map<string, Array<{ title: string, url: string }>>}
 */
export function buildTagToBookmarks (bookmarks) {
  const result = new Map()
  if (!Array.isArray(bookmarks)) return result
  for (const b of bookmarks) {
    const tags = Array.isArray(b.tags) ? b.tags : []
    const title = (b.description != null && b.description !== '') ? String(b.description) : (b.url ? String(b.url) : '')
    const url = b.url ? String(b.url) : ''
    for (const tag of tags) {
      const tagKey = String(tag).trim()
      if (!tagKey) continue
      if (!result.has(tagKey)) result.set(tagKey, [])
      result.get(tagKey).push({ title, url })
    }
  }
  return result
}

/**
 * [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]
 * Return sorted unique tags from bookmarks. Implements tag selector data: list of all tags for selection/order in the panel.
 * @param {Array<{ tags?: string[] }>} bookmarks
 * @returns {string[]}
 */
export function getAllTagsFromBookmarks (bookmarks) {
  const set = new Set()
  if (!Array.isArray(bookmarks)) return []
  for (const b of bookmarks) {
    const tags = Array.isArray(b.tags) ? b.tags : []
    for (const t of tags) {
      const s = String(t).trim()
      if (s) set.add(s)
    }
  }
  return Array.from(set).sort()
}

/**
 * [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]
 * Open a URL in a new tab. Implements requirement "click URL opens in new tab" by calling chrome.tabs.create({ url }); used when user clicks a bookmark link in the panel.
 * @param {string} url
 */
export function openUrlInNewTab (url) {
  if (typeof globalThis.chrome?.tabs?.create === 'function') {
    globalThis.chrome.tabs.create({ url })
  }
}
