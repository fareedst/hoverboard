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
import {
  getDomainFromUrl,
  filterByTimeRange,
  filterByTagsInclude,
  filterByDomains,
  applyFilters,
  sortBookmarks,
  groupBookmarksBy,
  filterBookmarksBySearch
} from '../../src/ui/side-panel/tags-tree-filter.js'

describe('getDomainFromUrl [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]', () => {
  test('returns empty string for empty or invalid URL (implements no-throw, empty for invalid)', () => {
    expect(getDomainFromUrl('')).toBe('')
    expect(getDomainFromUrl(null)).toBe('')
    expect(getDomainFromUrl(undefined)).toBe('')
    expect(getDomainFromUrl('   ')).toBe('')
    expect(getDomainFromUrl('not-a-url')).toBe('')
  })

  test('returns hostname for valid http(s) URL (implements domain extraction for filter/group)', () => {
    expect(getDomainFromUrl('https://example.com/path')).toBe('example.com')
    expect(getDomainFromUrl('http://sub.example.org:8080/')).toBe('sub.example.org')
  })

  test('returns lowercase hostname (implements case-insensitive domain match)', () => {
    expect(getDomainFromUrl('https://Example.COM')).toBe('example.com')
  })
})

describe('filterByTimeRange [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]', () => {
  test('returns empty array for non-array input (implements safe input)', () => {
    expect(filterByTimeRange(null, 'time', null, null)).toEqual([])
    expect(filterByTimeRange(undefined, 'updated_at', 0, 100)).toEqual([])
  })

  test('keeps bookmarks within [startMs, endMs] inclusive for field time (implements time range filter)', () => {
    const t1 = new Date('2025-01-15T12:00:00Z').getTime()
    const t2 = new Date('2025-01-20T12:00:00Z').getTime()
    const t3 = new Date('2025-01-25T12:00:00Z').getTime()
    const start = new Date('2025-01-18Z').getTime()
    const end = new Date('2025-01-22Z').getTime()
    const bookmarks = [
      { url: 'u1', time: new Date(t1).toISOString() },
      { url: 'u2', time: new Date(t2).toISOString() },
      { url: 'u3', time: new Date(t3).toISOString() }
    ]
    const out = filterByTimeRange(bookmarks, 'time', start, end)
    expect(out).toHaveLength(1)
    expect(out[0].url).toBe('u2')
  })

  test('null start or end means no bound (implements optional bounds)', () => {
    const t = new Date('2025-01-20T12:00:00Z').getTime()
    const bookmarks = [{ url: 'u1', time: new Date(t).toISOString() }]
    expect(filterByTimeRange(bookmarks, 'time', null, null)).toHaveLength(1)
    expect(filterByTimeRange(bookmarks, 'time', t - 1, null)).toHaveLength(1)
    expect(filterByTimeRange(bookmarks, 'time', null, t + 1)).toHaveLength(1)
  })

  test('uses updated_at when field is updated_at (implements create vs update time)', () => {
    const time = new Date('2024-01-01Z').toISOString()
    const updated = new Date('2025-06-01Z').toISOString()
    const start = new Date('2025-05-01Z').getTime()
    const end = new Date('2025-07-01Z').getTime()
    const bookmarks = [{ url: 'u1', time, updated_at: updated }]
    const out = filterByTimeRange(bookmarks, 'updated_at', start, end)
    expect(out).toHaveLength(1)
  })
})

describe('filterByTagsInclude [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]', () => {
  test('returns empty array for non-array input (implements safe input)', () => {
    expect(filterByTagsInclude(null, new Set(['a']))).toEqual([])
  })

  test('empty tagSet returns all bookmarks (implements no filter when empty)', () => {
    const bookmarks = [{ url: 'u1', tags: ['x'] }]
    expect(filterByTagsInclude(bookmarks, new Set())).toHaveLength(1)
    expect(filterByTagsInclude(bookmarks, null)).toHaveLength(1)
  })

  test('keeps only bookmarks with at least one tag in set (implements tags include filter)', () => {
    const bookmarks = [
      { url: 'u1', tags: ['a', 'b'] },
      { url: 'u2', tags: ['b', 'c'] },
      { url: 'u3', tags: ['d'] }
    ]
    const out = filterByTagsInclude(bookmarks, new Set(['a', 'c']))
    expect(out).toHaveLength(2)
    expect(out.map(b => b.url)).toEqual(expect.arrayContaining(['u1', 'u2']))
  })

  test('case-insensitive tag match (implements case-insensitive include)', () => {
    const bookmarks = [{ url: 'u1', tags: ['Foo'] }]
    expect(filterByTagsInclude(bookmarks, new Set(['foo']))).toHaveLength(1)
  })
})

describe('filterByDomains [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]', () => {
  test('returns empty array for non-array input (implements safe input)', () => {
    expect(filterByDomains(null, new Set(['example.com']))).toEqual([])
  })

  test('empty domainSet returns all bookmarks (implements no filter when empty)', () => {
    const bookmarks = [{ url: 'https://example.com' }]
    expect(filterByDomains(bookmarks, new Set())).toHaveLength(1)
    expect(filterByDomains(bookmarks, null)).toHaveLength(1)
  })

  test('keeps only bookmarks whose URL hostname in domainSet (implements domain filter)', () => {
    const bookmarks = [
      { url: 'https://a.com/path' },
      { url: 'https://b.com' },
      { url: 'https://c.org' }
    ]
    const out = filterByDomains(bookmarks, new Set(['a.com', 'c.org']))
    expect(out).toHaveLength(2)
    expect(out.map(b => getDomainFromUrl(b.url))).toEqual(expect.arrayContaining(['a.com', 'c.org']))
  })
})

describe('applyFilters [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]', () => {
  test('applies time then tags then domains in sequence (implements filter pipeline order)', () => {
    const t = new Date('2025-01-15T12:00:00Z')
    const bookmarks = [
      { url: 'https://keep.com', tags: ['x'], time: t.toISOString() },
      { url: 'https://drop.com', tags: ['y'], time: t.toISOString() }
    ]
    const config = {
      timeField: 'time',
      timeStart: t.getTime() - 1,
      timeEnd: t.getTime() + 1,
      tagsInclude: new Set(['x']),
      domains: new Set(['keep.com'])
    }
    const out = applyFilters(bookmarks, config)
    expect(out).toHaveLength(1)
    expect(out[0].url).toBe('https://keep.com')
  })

  test('returns empty array for non-array bookmarks (implements safe input)', () => {
    expect(applyFilters(null, {})).toEqual([])
  })

  test('all filters empty returns bookmarks that have valid time (null bounds skip range check but time field must exist)', () => {
    const now = new Date().toISOString()
    const bookmarks = [
      { url: 'https://a.com', tags: ['x'], time: now },
      { url: 'https://b.com', tags: ['y'], time: now }
    ]
    const out = applyFilters(bookmarks, { timeField: 'time', timeStart: null, timeEnd: null, tagsInclude: new Set(), domains: new Set() })
    expect(out).toHaveLength(2)
  })
})

describe('sortBookmarks [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]', () => {
  test('sorts by time ascending/descending (implements sort by create time)', () => {
    const bookmarks = [
      { url: 'u1', time: new Date('2025-01-03Z').toISOString() },
      { url: 'u2', time: new Date('2025-01-01Z').toISOString() },
      { url: 'u3', time: new Date('2025-01-02Z').toISOString() }
    ]
    const asc = sortBookmarks(bookmarks, 'time', true)
    expect(asc[0].url).toBe('u2')
    expect(asc[2].url).toBe('u1')
    const desc = sortBookmarks(bookmarks, 'time', false)
    expect(desc[0].url).toBe('u1')
  })

  test('sorts by domain (implements sort by domain axis)', () => {
    const bookmarks = [
      { url: 'https://z.com' },
      { url: 'https://a.com' },
      { url: 'https://m.com' }
    ]
    const asc = sortBookmarks(bookmarks, 'domain', true)
    expect(getDomainFromUrl(asc[0].url)).toBe('a.com')
    expect(getDomainFromUrl(asc[2].url)).toBe('z.com')
  })

  test('sorts by tag (first tag) (implements sort by tag axis)', () => {
    const bookmarks = [
      { url: 'u1', tags: ['z'] },
      { url: 'u2', tags: ['a'] },
      { url: 'u3', tags: ['m'] }
    ]
    const asc = sortBookmarks(bookmarks, 'tag', true)
    expect(asc[0].url).toBe('u2')
    expect(asc[2].url).toBe('u1')
  })

  test('returns empty array for non-array input (implements safe input)', () => {
    expect(sortBookmarks(null, 'time', true)).toEqual([])
  })
})

describe('groupBookmarksBy [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]', () => {
  test('returns null for groupBy none or empty (implements flat list when no group)', () => {
    expect(groupBookmarksBy([], 'none')).toBeNull()
    expect(groupBookmarksBy([{ url: 'u1' }], 'none')).toBeNull()
  })

  test('groups by domain (implements group by domain for sectioned render)', () => {
    const bookmarks = [
      { url: 'https://a.com/1' },
      { url: 'https://a.com/2' },
      { url: 'https://b.com' }
    ]
    const map = groupBookmarksBy(bookmarks, 'domain')
    expect(map).toBeInstanceOf(Map)
    expect(map.get('a.com')).toHaveLength(2)
    expect(map.get('b.com')).toHaveLength(1)
  })

  test('groups by tag (first tag) (implements group by tag)', () => {
    const bookmarks = [
      { url: 'u1', tags: ['x'] },
      { url: 'u2', tags: ['x'] },
      { url: 'u3', tags: ['y'] }
    ]
    const map = groupBookmarksBy(bookmarks, 'tag')
    expect(map.get('x')).toHaveLength(2)
    expect(map.get('y')).toHaveLength(1)
  })

  test('groups by time date bucket (implements group by create date)', () => {
    const bookmarks = [
      { url: 'u1', time: new Date('2025-01-15T10:00:00Z').toISOString() },
      { url: 'u2', time: new Date('2025-01-15T20:00:00Z').toISOString() },
      { url: 'u3', time: new Date('2025-01-16Z').toISOString() }
    ]
    const map = groupBookmarksBy(bookmarks, 'time')
    expect(map.get('2025-01-15')).toHaveLength(2)
    expect(map.get('2025-01-16')).toHaveLength(1)
  })

  test('groups by updated_at date bucket (implements group by update date)', () => {
    const bookmarks = [
      { url: 'u1', updated_at: new Date('2025-02-10T12:00:00Z').toISOString() },
      { url: 'u2', updated_at: new Date('2025-02-10T18:00:00Z').toISOString() },
      { url: 'u3', updated_at: new Date('2025-02-11Z').toISOString() }
    ]
    const map = groupBookmarksBy(bookmarks, 'updated_at')
    expect(map.get('2025-02-10')).toHaveLength(2)
    expect(map.get('2025-02-11')).toHaveLength(1)
  })

  test('returns null for non-array input (implements safe input)', () => {
    expect(groupBookmarksBy(null, 'domain')).toBeNull()
  })
})

// [REQ-SIDE_PANEL_BOOKMARK_SEARCH] [ARCH-SIDE_PANEL_BOOKMARK_SEARCH] [IMPL-SIDE_PANEL_BOOKMARK_SEARCH]
// filterBookmarksBySearch: validates search over displayed list (title, URL, tags, extended); implements match count and Next/Prev data source.
describe('filterBookmarksBySearch [REQ-SIDE_PANEL_BOOKMARK_SEARCH] [ARCH-SIDE_PANEL_BOOKMARK_SEARCH] [IMPL-SIDE_PANEL_BOOKMARK_SEARCH]', () => {
  const sampleBookmarks = [
    { url: 'https://example.com', description: 'Example Page', tags: ['work'], extended: 'notes one' },
    { url: 'https://other.org', description: 'Other', tags: ['personal', 'blog'], extended: '' },
    { url: 'https://foo.net', description: 'Foo Net', tags: ['work'], extended: 'memo' }
  ]

  test('empty or whitespace query returns all bookmarks (implements no filter when no search)', () => {
    expect(filterBookmarksBySearch(sampleBookmarks, '')).toEqual(sampleBookmarks)
    expect(filterBookmarksBySearch(sampleBookmarks, '   ')).toEqual(sampleBookmarks)
    expect(filterBookmarksBySearch(sampleBookmarks, '\t')).toEqual(sampleBookmarks)
  })

  test('matches on description/title (implements search by title)', () => {
    const out = filterBookmarksBySearch(sampleBookmarks, 'Example')
    expect(out).toHaveLength(1)
    expect(out[0].url).toBe('https://example.com')
  })

  test('matches on url (implements search by URL)', () => {
    const out = filterBookmarksBySearch(sampleBookmarks, 'other.org')
    expect(out).toHaveLength(1)
    expect(out[0].description).toBe('Other')
  })

  test('matches on tags (implements search by tags)', () => {
    const out = filterBookmarksBySearch(sampleBookmarks, 'blog')
    expect(out).toHaveLength(1)
    expect(out[0].url).toBe('https://other.org')
  })

  test('matches on extended/notes (implements search by notes)', () => {
    const out = filterBookmarksBySearch(sampleBookmarks, 'memo')
    expect(out).toHaveLength(1)
    expect(out[0].url).toBe('https://foo.net')
  })

  test('case-insensitive match (implements case-insensitive search)', () => {
    expect(filterBookmarksBySearch(sampleBookmarks, 'EXAMPLE')).toHaveLength(1)
    expect(filterBookmarksBySearch(sampleBookmarks, 'Work')).toHaveLength(2)
  })

  test('no match returns empty array (implements count and Next/Prev when zero matches)', () => {
    expect(filterBookmarksBySearch(sampleBookmarks, 'xyznone')).toEqual([])
  })

  test('returns empty array for non-array bookmarks (implements safe input)', () => {
    expect(filterBookmarksBySearch(null, 'x')).toEqual([])
    expect(filterBookmarksBySearch(undefined, 'x')).toEqual([])
  })
})
