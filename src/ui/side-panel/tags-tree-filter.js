/**
 * === IMPL-FULL-BLOCK: IMPL-SIDE_PANEL_BOOKMARK_SEARCH ===
 * [IMPL-SIDE_PANEL_BOOKMARK_SEARCH] [ARCH-SIDE_PANEL_BOOKMARK_SEARCH] [REQ-SIDE_PANEL_BOOKMARK_SEARCH] — This block defines the search feature: pure filter plus panel UI. Implements REQ by providing search, count, and Next/Previous; implements ARCH by client-side filter and scroll/highlight.
 *
 * ## FILTER_BOOKMARKS_BY_SEARCH
 *
 * - [REQ-SIDE_PANEL_BOOKMARK_SEARCH] [ARCH-SIDE_PANEL_BOOKMARK_SEARCH] [IMPL-SIDE_PANEL_BOOKMARK_SEARCH] How: filterBookmarksBySearch: implements "search displayed list by text" by returning bookmarks where query (trimmed, case-insensitive) appears in description, url, tags (joined), or extended. Empty/whitespace query returns full list.
 * - Contract:
 *   - INPUT: context / caller args
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: result
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: FILTER_BOOKMARKS_BY_SEARCH
 *   - q = String(query).trim().toLowerCase()
 *   - IF q === '' RETURN bookmarks
 *   - RETURN bookmarks WHERE bookmarkMatches(b, q)
 *
 * ## BOOKMARK_MATCHES
 *
 * - [IMPL-SIDE_PANEL_BOOKMARK_SEARCH] [ARCH-SIDE_PANEL_BOOKMARK_SEARCH] [REQ-SIDE_PANEL_BOOKMARK_SEARCH] How: Implements bookmarkMatches(b, q) behavior for IMPL-SIDE_PANEL_BOOKMARK_SEARCH.
 * - Contract:
 *   - INPUT: context / caller args
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: result
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: BOOKMARK_MATCHES
 *   - title = (b.description ?? '').toLowerCase()
 *   - url = (b.url ?? '').toLowerCase()
 *   - tags = (b.tags ?? []).join(' ').toLowerCase()
 *   - extended = (b.extended ?? '').toLowerCase()
 *   - RETURN title.includes(q) OR url.includes(q) OR tags.includes(q) OR extended.includes(q)
 *
 * ## BLOCK_3
 *
 * - [REQ-SIDE_PANEL_BOOKMARK_SEARCH] [ARCH-SIDE_PANEL_BOOKMARK_SEARCH] [IMPL-SIDE_PANEL_BOOKMARK_SEARCH] How: Pipeline integration: after applyFilters and sortBookmarks, if searchQuery.trim() then matchingBookmarks = filterBookmarksBySearch(displayedBookmarks, searchQuery); else matchingBookmarks = displayedBookmarks. Build tagToBookmarks or grouped from matchingBookmarks. Implements "filter displayed list" and "count of matching records". Search UI: search input, count span, Previous/Next buttons. Implements "display count" and "advance to next/previous record". Render: each bookmark link gets data-search-index = flat index in display order so Nth match can be found. Implements "scroll and highlight" by finding element with data-search-index === searchMatchIndex, scrollIntoView, classList.add('search-current'); clear previous highlight.
 * - Contract:
 *   - INPUT: context / caller args
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: result
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: BLOCK_3
 *   - 1. ON refresh / load: displayedBookmarks = sortBookmarks(applyFilters(rawBookmarks, filterState), sortBy, sortAsc)
 *   - 2.   IF searchQuery.trim(): matchingBookmarks = filterBookmarksBySearch(displayedBookmarks, searchQuery)
 *   - 3.   ELSE: matchingBookmarks = displayedBookmarks
 *   - 4.   build tree/grouped from matchingBookmarks; display count = matchingBookmarks.length
 *   - 5. searchInput: on input/change set searchQuery; re-run pipeline; set searchMatchIndex = 0; update searchCount text ("N matches" or "No matches")
 *   - 6. searchCount: textContent = matchingBookmarks.length === 0 ? "No matches" : matchingBookmarks.length + " matches"
 *   - 7. searchPrev: searchMatchIndex = (searchMatchIndex - 1 + total) % total; scrollToMatch(searchMatchIndex); setHighlight(searchMatchIndex)
 *   - 8. searchNext: searchMatchIndex = (searchMatchIndex + 1) % total; scrollToMatch(searchMatchIndex); setHighlight(searchMatchIndex)
 *   - 9. WHEN rendering tree or grouped: for each bookmark link set data-search-index = index (0-based in display order)
 *   - 10. scrollToMatch(idx): links = querySelectorAll('.tree-bookmark-link[data-search-index]'); el = links[idx]; IF el THEN el.scrollIntoView({ block: 'nearest' }); remove .search-current from all; el.classList.add('search-current')
 *
 * === END IMPL-FULL-BLOCK: IMPL-SIDE_PANEL_BOOKMARK_SEARCH ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-SIDE_PANEL_TAGS_TREE ===
 * [IMPL-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [REQ-SIDE_PANEL_TAGS_TREE] — This block defines the overall feature: side panel tags tree opened from popup; panel shows tag→urls tree; click URL opens in new tab. Implements REQ by providing the side-panel entry and tag-tree UX; implements ARCH by following the open-flow and data-flow decisions.
 *
 * ## BUILD_TAG_TO_BOOKMARKS
 *
 * - [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE] How: Popup entry: implements requirement "open tags tree from popup" by sending OPEN_SIDE_PANEL. ARCH prescribes message-based open; this block is the popup side. SW open in user gesture: implements requirement that side panel opens in response to user click. chrome.sidePanel.open() may only be called in user gesture (no await). So: maintain cached normal windowId; on OPEN_SIDE_PANEL handle in onMessage synchronously (no await before open). Implements ARCH open flow. Panel load: implements tag tree data flow; uses getAggregatedBookmarksForIndex (local+file+sync+browser; no Pinboard) then load config, apply filters, sort, group, build tag map and tag list, render. Implements REQ filters/sort/group and config persistence. When panel is tabbed, Tags tree is second tab; load/render runs on tab select or first show. initTagsTreeTab(options) is callable from side-panel.js when user selects Tags tree tab; optional currentBookmarkTags syncs tag selector to current bookmark. Implements "Tags tree tab" in tabbed panel and "tag selector matches current bookmark; tree shows only bookmarks that share at least one tag". Placeholder/demo mode (?demo=1 or ?screenshot=1): loadPlaceholderForScreenshot uses tagsTreePlaceholderBookmarks (tags-tree-demo-data.js), a rich set (25+ bookmarks, 15+ tags, time/updated_at, extended) so the By Tag demo GIF shows tag selector, tree, filters and search. Set rawBookmarks so tag toggle invokes refreshFromConfig; then tagToBookmarks, allTags, selectedTagOrder; hide load error and empty state; renderTagSelector(); renderTree(). buildTagToBookmarks: implements requirement "tag-based tree" by producing Map<tag, [{ title, url }]> from bookmarks. One pass; trim/dedupe per tag.
 * - Contract:
 *   - INPUT: user click in popup (open Tags tree); panel page load; user actions in panel (select/reorder tags, expand/collapse, click URL)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: side panel visible; tag selector and hierarchical tree rendered; URL opens in new tab on click | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: bookmarks (from getAggregatedBookmarksForIndex = local+file+sync+browser; no Pinboard), config (expanded, timeField, timeStart, timeEnd, tagsInclude, domains, groupBy, sortBy, sortAsc, selectedTagOrder, showAllTags), filtered bookmarks, tagToBookmarks (Map tag → [{ title, url }]), allTags (string[]), collapsedTags/collapsedSections (Set), panel DOM refs
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: BUILD_TAG_TO_BOOKMARKS
 *   - result = new Map()
 *   - FOR each b in bookmarks:
 *   - tags = Array.isArray(b.tags) ? b.tags : []; title = b.description || b.url || ''
 *   - FOR each tag in tags:
 *   - tagKey = String(tag).trim(); IF empty skip
 *   - IF result has no key tagKey THEN result[tagKey] = []; result[tagKey].push({ title, url: b.url })
 *   - RETURN result
 *
 * ## GET_ALL_TAGS_FROM_BOOKMARKS
 *
 * - [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE] How: getAllTagsFromBookmarks: implements tag selector data by returning sorted unique tags from bookmarks.
 * - Contract:
 *   - INPUT: user click in popup (open Tags tree); panel page load; user actions in panel (select/reorder tags, expand/collapse, click URL)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: side panel visible; tag selector and hierarchical tree rendered; URL opens in new tab on click
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: bookmarks (from getAggregatedBookmarksForIndex = local+file+sync+browser; no Pinboard), config (expanded, timeField, timeStart, timeEnd, tagsInclude, domains, groupBy, sortBy, sortAsc, selectedTagOrder, showAllTags), filtered bookmarks, tagToBookmarks (Map tag → [{ title, url }]), allTags (string[]), collapsedTags/collapsedSections (Set), panel DOM refs
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: GET_ALL_TAGS_FROM_BOOKMARKS
 *   - set = new Set(); FOR each b in bookmarks: FOR each t in (b.tags || []): set.add(String(t).trim())
 *   - RETURN sorted Array.from(set)
 *
 * ## GET_TAGS_TO_DISPLAY
 *
 * - [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE] How: Tag list view mode: implements "user can switch between all tags and only checked tags; choice persisted". showAllTags boolean in config; when true display allTags, when false display selectedTagOrder filtered by allTags (avoid stale tags). Persisted in panel config.
 * - Contract:
 *   - INPUT: user click in popup (open Tags tree); panel page load; user actions in panel (select/reorder tags, expand/collapse, click URL)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: side panel visible; tag selector and hierarchical tree rendered; URL opens in new tab on click
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: bookmarks (from getAggregatedBookmarksForIndex = local+file+sync+browser; no Pinboard), config (expanded, timeField, timeStart, timeEnd, tagsInclude, domains, groupBy, sortBy, sortAsc, selectedTagOrder, showAllTags), filtered bookmarks, tagToBookmarks (Map tag → [{ title, url }]), allTags (string[]), collapsedTags/collapsedSections (Set), panel DOM refs
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: GET_TAGS_TO_DISPLAY
 *   - IF showAllTags THEN RETURN allTags
 *   - allSet = Set(allTags); RETURN selectedTagOrder filtered to items IN allSet (preserve order)
 *
 * ## RENDER_TAG_SELECTOR
 *
 * - [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE] How: renderTagSelector: implements tag selection and order UI and compact layout. Renders checkboxes for visibleTags = getTagsToDisplay(allTags, selectedTagOrder, config.showAllTags); on checkbox change save selectedTagOrder and refreshFromConfig; toggle change updates showAllTags, savePanelConfig, renderTagSelector only.
 * - Contract:
 *   - INPUT: user click in popup (open Tags tree); panel page load; user actions in panel (select/reorder tags, expand/collapse, click URL)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: side panel visible; tag selector and hierarchical tree rendered; URL opens in new tab on click
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: bookmarks (from getAggregatedBookmarksForIndex = local+file+sync+browser; no Pinboard), config (expanded, timeField, timeStart, timeEnd, tagsInclude, domains, groupBy, sortBy, sortAsc, selectedTagOrder, showAllTags), filtered bookmarks, tagToBookmarks (Map tag → [{ title, url }]), allTags (string[]), collapsedTags/collapsedSections (Set), panel DOM refs
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: RENDER_TAG_SELECTOR
 *   - visibleTags = getTagsToDisplay(allTags, selectedTagOrder, config.showAllTags)
 *   - render list of tags (visibleTags) with selection state (checked iff in selectedTagOrder) and compact layout; on change save selectedTagOrder and refreshFromConfig
 *   - 1. ON tag list view toggle: config.showAllTags = NOT config.showAllTags; savePanelConfig(config); renderTagSelector()
 *
 * ## RENDER_TREE
 *
 * - [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE] How: renderTree: implements collapsible URL lists per tag; each section has tag label + toggle + list of title+URL.
 * - Contract:
 *   - INPUT: user click in popup (open Tags tree); panel page load; user actions in panel (select/reorder tags, expand/collapse, click URL)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: side panel visible; tag selector and hierarchical tree rendered; URL opens in new tab on click
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: bookmarks (from getAggregatedBookmarksForIndex = local+file+sync+browser; no Pinboard), config (expanded, timeField, timeStart, timeEnd, tagsInclude, domains, groupBy, sortBy, sortAsc, selectedTagOrder, showAllTags), filtered bookmarks, tagToBookmarks (Map tag → [{ title, url }]), allTags (string[]), collapsedTags/collapsedSections (Set), panel DOM refs
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: RENDER_TREE
 *   - FOR each tag in selectedTagOrder: entries = tagToBookmarks.get(tag) || []; render section (tag + toggle + list); store url for click
 *
 * ## BLOCK_6
 *
 * - [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE] How: refreshFromConfig: syncConfigFromControls; savePanelConfig; IF !rawBookmarks or length 0 RETURN (no re-render). filterState = getFilterStateForTagsTree(panelConfig, selectedTagOrder); filtered = applyFilters(rawBookmarks, filterState); sorted = sortBookmarks(filtered, ...); matchingBookmarks = search filter or sorted; IF groupBy !== 'none' renderGrouped ELSE tagToBookmarks = buildTagToBookmarks(matchingBookmarks, allTags); renderTagSelector(); renderTree(); updateSearchCount; scrollToMatch. Config expand/collapse: implements requirement that config region is expandable for use and collapsible to maximize bookmarks space; toggle loads/saves expanded state; when collapsed only compact bar visible; when expanded show full filter and display controls. Filter pipeline: implements requirement to filter by create/update time range, tags include, and domain. Apply in sequence: time range (field + startMs/endMs), then tags include (bookmark must have at least one tag in set), then domains (URL hostname in set). Empty set or null bounds mean no filter for that step. getDomainFromUrl: implements domain filter/group by returning hostname from URL; invalid or empty URL returns empty string; no throw. filterByTimeRange: implements time range filter; uses bookmark time or updated_at per field; null start/end means no bound; inclusive. filterByTagsInclude: implements tags include filter; empty tagSet = all pass; otherwise bookmark must have at least one tag (case-insensitive) in set. filterByDomains: implements domain filter; empty domainSet = all pass; otherwise bookmark's getDomainFromUrl(url) in domainSet (case-insensitive). sortBookmarks: implements display sort by chosen axis (time, updated_at, tag, domain) and direction (sortAsc). For time use ms; for tag use first tag or ''; for domain use getDomainFromUrl. groupBookmarksBy: implements display group by; returns structure for sectioned render (e.g. Map<groupKey, bookmark[]>). groupBy in 'none' | 'time' | 'updated_at' | 'tag' | 'domain'; bucket keys for date (e.g. date string); per-tag or per-domain one key per value. renderGrouped: implements collapsible sectioned display when groupBy not none; each section has header (toggle) and list of bookmark links; click URL opens in new tab. loadPanelConfig / savePanelConfig: implements config state persistence; read/write expanded, timeField, timeStart, timeEnd, tagsInclude, domains, groupBy, sortBy, sortAsc, selectedTagOrder, showAllTags to chrome.storage.local. showAllTags defaults true for backward compatibility. openUrlInNewTab / ON click URL: implements "click-to-open in new tab" requirement via chrome.tabs.create({ url }). Tags tree panel layout: panel (#tagsTreePanel) is the scroll container so the above-list div can scroll off the page; .tree-section has min-height 100% so it consumes full visible height when the div is scrolled off and scrolls its list. Implements "tab content fills vertical space" for Tags tree tab. DOM: #tagsTreePanel > .tags-tree-above-list > (header, config-section, search-section, tag-selector-section) + .tree-section
 * - Contract:
 *   - INPUT: user click in popup (open Tags tree); panel page load; user actions in panel (select/reorder tags, expand/collapse, click URL)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: side panel visible; tag selector and hierarchical tree rendered; URL opens in new tab on click
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: bookmarks (from getAggregatedBookmarksForIndex = local+file+sync+browser; no Pinboard), config (expanded, timeField, timeStart, timeEnd, tagsInclude, domains, groupBy, sortBy, sortAsc, selectedTagOrder, showAllTags), filtered bookmarks, tagToBookmarks (Map tag → [{ title, url }]), allTags (string[]), collapsedTags/collapsedSections (Set), panel DOM refs
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: BLOCK_6
 *   - 1. refreshFromConfig(): syncConfigFromControls(); savePanelConfig(); IF !rawBookmarks or rawBookmarks.length === 0 RETURN; filterState = getFilterStateForTagsTree(panelConfig, selectedTagOrder); filtered = applyFilters(rawBookmarks, filterState); sorted = sortBookmarks(filtered, panelConfig.sortBy, panelConfig.sortAsc); matchingBookmarks = searchQuery ? filterBookmarksBySearch(sorted, searchQuery) : sorted; IF panelConfig.groupBy !== 'none' THEN renderGrouped(matchingBookmarks) ELSE tagToBookmarks = buildTagToBookmarks(matchingBookmarks, allTags); renderTagSelector(); renderTree(); updateSearchCount(); scrollToMatch(searchMatchIndex)
 *   - 2. ON config toggle click: config.expanded = NOT config.expanded; savePanelConfig(config); renderConfigToggle(config.expanded); show or hide config content
 *   - 3. applyFilters(bookmarks, config): list = bookmarks; list = filterByTimeRange(list, config.timeField, config.timeStart, config.timeEnd); list = filterByTagsInclude(list, config.tagsInclude); list = filterByDomains(list, config.domains); RETURN list
 *   - 4. getDomainFromUrl(url): IF !url or !String(url).trim() RETURN ''; TRY parse url; RETURN hostname (lowercase) OR ''
 *   - 5. filterByTimeRange(bookmarks, field, startMs, endMs): RETURN bookmarks WHERE inTimeRange(b, field, startMs, endMs)  // inTimeRange: get ms from b; if null return false; if startMs and ms < startMs return false; if endMs and ms > endMs return false; return true
 *   - 6. filterByTagsInclude(bookmarks, tagSet): IF !tagSet or size 0 RETURN bookmarks; RETURN bookmarks WHERE (b.tags normalized) INTERSECT tagSet non-empty
 *   - 7. filterByDomains(bookmarks, domainSet): IF !domainSet or size 0 RETURN bookmarks; RETURN bookmarks WHERE getDomainFromUrl(b.url) in domainSet
 *   - 8. sortBookmarks(bookmarks, sortBy, sortAsc): sort list by sortBy key; if sortAsc ascending else descending; RETURN sorted array
 *   - 9. groupBookmarksBy(bookmarks, groupBy): IF groupBy === 'none' RETURN null or flat; result = Map(); FOR b in bookmarks: key = keyFor(b, groupBy); append b to result[key]; RETURN result
 *   - 10. renderGrouped(grouped, config): FOR each groupKey in grouped: render section header (groupKey + toggle); render list of title+URL; store url for click → openUrlInNewTab(url)
 *   - 11. loadPanelConfig(): get from chrome.storage.local; RETURN defaults for missing keys (showAllTags default true)
 *   - 12. savePanelConfig(config): chrome.storage.local.set(config keyed by storage keys)
 *   - 13. ON click URL in tree: url = event target url; openUrlInNewTab(url)  // openUrlInNewTab(url) => chrome.tabs.create({ url })
 *   - 14. CSS #tagsTreePanel: display block; flex 1 1 0; min-height 0; overflow-y auto; background var(--color-background)
 *   - 15. CSS .tags-tree-above-list: flex none (natural height; scrolls off with panel scroll)
 *   - 16. CSS .tree-section: min-height 100%; overflow-y auto
 *
 * === END IMPL-FULL-BLOCK: IMPL-SIDE_PANEL_TAGS_TREE ===
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
