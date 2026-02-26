/**
 * [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]
 * Pure helpers for side panel tags tree. This module implements the data shape required by the tag tree: tag → bookmarks map and unique tag list from index bookmarks; and click-URL-opens-in-new-tab.
 */

/**
 * [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]
 * Build a map of tag → array of { title, url } from aggregated bookmarks. Implements requirement "tag-based tree" by producing the structure the panel uses to render tag → URL lists.
 * When canonicalTags is provided, keys use that spelling (case-insensitive match) so tree keys match the displayed tag list.
 * @param {Array<{ tags?: string[], url?: string, description?: string }>} bookmarks
 * @param {string[]} [canonicalTags] - Optional list of tag spellings to use as keys (e.g. allTags after mergePreferredTagSpelling).
 * @returns {Map<string, Array<{ title: string, url: string }>>}
 */
export function buildTagToBookmarks (bookmarks, canonicalTags) {
  const result = new Map()
  if (!Array.isArray(bookmarks)) return result
  for (const b of bookmarks) {
    const tags = Array.isArray(b.tags) ? b.tags : []
    const title = (b.description != null && b.description !== '') ? String(b.description) : (b.url ? String(b.url) : '')
    const url = b.url ? String(b.url) : ''
    for (const tag of tags) {
      const tagKey = Array.isArray(canonicalTags) && canonicalTags.length > 0
        ? getCanonicalTag(String(tag).trim(), canonicalTags)
        : String(tag).trim()
      if (!tagKey) continue
      if (!result.has(tagKey)) result.set(tagKey, [])
      result.get(tagKey).push({ title, url })
    }
  }
  return result
}

/**
 * [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_TAGS_TREE]
 * Return the spelling of tag that appears in allTags (case-insensitive match), or tag if not found. Used so tag list and tree keys share one spelling.
 * @param {string} tag
 * @param {string[]} allTags
 * @returns {string}
 */
export function getCanonicalTag (tag, allTags) {
  if (!tag || !Array.isArray(allTags)) return tag || ''
  const lower = tag.trim().toLowerCase()
  const found = allTags.find(t => String(t).trim().toLowerCase() === lower)
  return found != null ? found : tag
}

/**
 * [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_TAGS_TREE]
 * Merge preferred tag spellings (e.g. current bookmark tags) into allTags so the list shows the bookmark's tags and is complete. Case-insensitive dedupe; preferred spelling wins.
 * @param {string[]} allTags - Tags from index (getAllTagsFromBookmarks).
 * @param {string[]} preferredTags - Preferred spellings (e.g. current bookmark tags).
 * @returns {string[]}
 */
export function mergePreferredTagSpelling (allTags, preferredTags) {
  if (!Array.isArray(allTags)) return Array.isArray(preferredTags) ? [...new Set(preferredTags.map(p => String(p).trim()).filter(Boolean))].sort() : []
  if (!Array.isArray(preferredTags) || preferredTags.length === 0) return [...allTags]
  const byLower = new Map()
  for (const t of allTags) {
    const s = String(t).trim()
    if (!s) continue
    const key = s.toLowerCase()
    if (byLower.has(key)) continue
    const pref = preferredTags.find(p => String(p).trim().toLowerCase() === key)
    byLower.set(key, pref !== undefined ? pref : s)
  }
  for (const p of preferredTags) {
    const s = String(p).trim()
    if (!s) continue
    const key = s.toLowerCase()
    if (!byLower.has(key)) byLower.set(key, s)
  }
  return Array.from(byLower.values()).sort()
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
 * [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_TAGS_TREE]
 * Intersection of preferredTags with allTags (case-insensitive), preserving order of preferredTags.
 * Returns preferred spellings so the tag list shows the bookmark's tags; use mergePreferredTagSpelling(allTags, preferredTags) before buildTagToBookmarks so keys match.
 * @param {string[]} allTags - Tags known in the index (e.g. from getAllTagsFromBookmarks).
 * @param {string[]} preferredTags - Preferred selection (e.g. current bookmark tags); order preserved for those that exist in allTags.
 * @returns {string[]}
 */
export function intersectionTagOrder (allTags, preferredTags) {
  if (!Array.isArray(allTags) || !Array.isArray(preferredTags)) return []
  const allLower = new Set(allTags.map(t => String(t).trim().toLowerCase()))
  return preferredTags.filter(p => allLower.has(String(p).trim().toLowerCase()))
}

/**
 * [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_TAGS_TREE]
 * Build filter state for Tags tree. When tags come from selection (tagsInclude empty), domains and time range are forced empty so the tag-filtered list is not zeroed.
 * @param {{ timeField?: string, timeStart?: number|null, timeEnd?: number|null, tagsInclude?: Set<string>, domains?: Set<string> }} panelConfig
 * @param {string[]} selectedTagOrder
 * @returns {{ timeField: string, timeStart: number|null, timeEnd: number|null, tagsInclude: Set<string>, domains: Set<string> }}
 */
export function getFilterStateForTagsTree (panelConfig, selectedTagOrder) {
  const tagsFromSelection = !panelConfig?.tagsInclude?.size
  return {
    timeField: panelConfig?.timeField ?? 'updated_at',
    timeStart: tagsFromSelection ? null : (panelConfig?.timeStart ?? null),
    timeEnd: tagsFromSelection ? null : (panelConfig?.timeEnd ?? null),
    tagsInclude: (panelConfig?.tagsInclude?.size > 0) ? panelConfig.tagsInclude : new Set(selectedTagOrder ?? []),
    domains: tagsFromSelection ? new Set() : (panelConfig?.domains ?? new Set())
  }
}

/**
 * [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]
 * Return the list of tags to show in the tag selector: all tags when showAllTags is true, else only selected tags that still exist in allTags (avoids stale tags). Implements tag list view mode (all vs only checked) for compact selector.
 * @param {string[]} allTags
 * @param {string[]} selectedTagOrder
 * @param {boolean} showAllTags
 * @returns {string[]}
 */
export function getTagsToDisplay (allTags, selectedTagOrder, showAllTags) {
  if (!Array.isArray(allTags)) return []
  if (showAllTags) return allTags
  if (!Array.isArray(selectedTagOrder) || selectedTagOrder.length === 0) return []
  const allSet = new Set(allTags)
  return selectedTagOrder.filter(t => allSet.has(t))
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
