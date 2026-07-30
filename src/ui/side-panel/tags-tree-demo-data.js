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
export const tagsTreePlaceholderBookmarks = [
  { url: 'https://pinboard.in', description: 'Pinboard: social bookmarking', extended: 'Main bookmarking service. Syncs with extension and file export.', tags: ['bookmarks', 'pinboard', 'reading', 'tools', 'sync', 'reference', 'favorites'], time: '2025-01-15T12:00:00Z', updated_at: '2025-01-15T12:00:00Z' },
  { url: 'https://example.com', description: 'Example Domain', extended: 'Placeholder for screenshots and demos.', tags: ['example', 'work', 'reference'], time: '2025-01-14T10:00:00Z', updated_at: '2025-01-14T10:00:00Z' },
  { url: 'https://example.org', description: 'Example Org', extended: '', tags: ['work', 'personal', 'reading'], time: '2025-01-14T09:00:00Z', updated_at: '2025-01-14T09:00:00Z' },
  { url: 'https://example.net', description: 'Sample Page', extended: 'Sample extended notes for search demo.', tags: ['personal', 'reading', 'reference'], time: '2025-01-13T16:00:00Z', updated_at: '2025-01-13T16:00:00Z' },
  { url: 'https://github.com', description: 'GitHub', extended: 'Code hosting and collaboration.', tags: ['development', 'code', 'git', 'repos', 'dev', 'tools'], time: '2025-01-13T09:00:00Z', updated_at: '2025-01-13T09:00:00Z' },
  { url: 'https://developer.mozilla.org', description: 'MDN Web Docs', extended: 'Web API and docs reference.', tags: ['docs', 'reference', 'web', 'javascript', 'html', 'css'], time: '2025-01-12T08:00:00Z', updated_at: '2025-01-12T08:00:00Z' },
  { url: 'https://www.npmjs.com', description: 'npm', extended: '', tags: ['javascript', 'packages', 'node', 'dev', 'docs'], time: '2025-01-11T07:00:00Z', updated_at: '2025-01-11T07:00:00Z' },
  { url: 'https://playwright.dev', description: 'Playwright', extended: 'Browser automation and E2E testing.', tags: ['testing', 'e2e', 'automation', 'dev', 'tutorial'], time: '2025-01-10T14:00:00Z', updated_at: '2025-01-10T14:00:00Z' },
  { url: 'https://nodejs.org', description: 'Node.js', extended: '', tags: ['node', 'javascript', 'runtime', 'dev', 'docs', 'tutorial'], time: '2025-01-09T11:00:00Z', updated_at: '2025-01-09T11:00:00Z' },
  { url: 'https://stackoverflow.com', description: 'Stack Overflow', extended: 'Q&A for developers.', tags: ['qa', 'programming', 'help', 'dev', 'reference', 'tutorial'], time: '2025-01-08T16:00:00Z', updated_at: '2025-01-08T16:00:00Z' },
  { url: 'https://docs.npmjs.com', description: 'npm documentation', extended: 'npm docs and API.', tags: ['npm', 'docs', 'packages', 'reference'], time: '2025-01-07T09:30:00Z', updated_at: '2025-01-07T09:30:00Z' },
  { url: 'https://web.dev', description: 'web.dev', extended: 'Web development guides and best practices.', tags: ['web', 'docs', 'performance', 'pwa', 'reference'], time: '2025-01-06T13:00:00Z', updated_at: '2025-01-06T13:00:00Z' },
  { url: 'https://www.typescriptlang.org', description: 'TypeScript', extended: '', tags: ['typescript', 'javascript', 'typing', 'dev'], time: '2025-01-05T10:00:00Z', updated_at: '2025-01-05T10:00:00Z' },
  { url: 'https://eslint.org', description: 'ESLint', extended: 'Linting for JavaScript.', tags: ['lint', 'javascript', 'tooling', 'dev'], time: '2025-01-04T08:00:00Z', updated_at: '2025-01-04T08:00:00Z' },
  { url: 'https://jestjs.io', description: 'Jest', extended: '', tags: ['testing', 'javascript', 'unit', 'dev', 'tutorial'], time: '2025-01-03T12:00:00Z', updated_at: '2025-01-03T12:00:00Z' },
  { url: 'https://nodejs.org/docs', description: 'Node.js docs', extended: 'Node API and guides.', tags: ['node', 'docs', 'api', 'reference'], time: '2025-01-02T14:00:00Z', updated_at: '2025-01-02T14:00:00Z' },
  { url: 'https://github.com/features', description: 'GitHub Features', extended: '', tags: ['github', 'features', 'ci', 'dev', 'tools'], time: '2025-01-01T09:00:00Z', updated_at: '2025-01-01T09:00:00Z' },
  { url: 'https://vuejs.org', description: 'Vue.js', extended: 'Progressive JavaScript framework.', tags: ['vue', 'javascript', 'frontend', 'framework', 'dev'], time: '2024-12-31T11:00:00Z', updated_at: '2024-12-31T11:00:00Z' },
  { url: 'https://react.dev', description: 'React', extended: 'Library for building user interfaces.', tags: ['react', 'javascript', 'frontend', 'dev', 'tutorial'], time: '2024-12-30T10:00:00Z', updated_at: '2024-12-30T10:00:00Z' },
  { url: 'https://tailwindcss.com', description: 'Tailwind CSS', extended: 'Utility-first CSS framework.', tags: ['css', 'frontend', 'tools', 'dev'], time: '2024-12-29T15:00:00Z', updated_at: '2024-12-29T15:00:00Z' },
  { url: 'https://vitejs.dev', description: 'Vite', extended: 'Next generation frontend tooling.', tags: ['vite', 'build', 'dev', 'javascript', 'tools'], time: '2024-12-28T09:00:00Z', updated_at: '2024-12-28T09:00:00Z' },
  { url: 'https://www.ecma-international.org', description: 'ECMAScript', extended: 'ECMAScript specification.', tags: ['javascript', 'spec', 'reference', 'docs'], time: '2024-12-27T14:00:00Z', updated_at: '2024-12-27T14:00:00Z' }
  // { url: 'https://css-tricks.com', description: 'CSS-Tricks', extended: 'Front-end development articles.', tags: ['css', 'web', 'reference', 'reading'], time: '2024-12-26T08:00:00Z', updated_at: '2024-12-26T08:00:00Z' },
  // { url: 'https://dev.to', description: 'DEV Community', extended: 'Developer community and articles.', tags: ['reading', 'dev', 'community', 'tutorial'], time: '2024-12-25T12:00:00Z', updated_at: '2024-12-25T12:00:00Z' },
  // { url: 'https://frontendmasters.com', description: 'Frontend Masters', extended: 'Front-end training courses.', tags: ['learning', 'frontend', 'tutorial', 'dev'], time: '2024-12-24T10:00:00Z', updated_at: '2024-12-24T10:00:00Z' },
  // { url: 'https://caniuse.com', description: 'Can I use', extended: 'Browser support tables.', tags: ['web', 'reference', 'compatibility', 'tools'], time: '2024-12-23T16:00:00Z', updated_at: '2024-12-23T16:00:00Z' },
  // { url: 'https://regex101.com', description: 'regex101', extended: 'Regex tester and debugger.', tags: ['regex', 'tools', 'dev', 'reference'], time: '2024-12-22T11:00:00Z', updated_at: '2024-12-22T11:00:00Z' },
  // { url: 'https://jsonplaceholder.typicode.com', description: 'JSONPlaceholder', extended: 'Fake API for testing.', tags: ['api', 'testing', 'dev', 'tools'], time: '2024-12-21T09:00:00Z', updated_at: '2024-12-21T09:00:00Z' },
  // { url: 'https://httpbin.org', description: 'httpbin', extended: 'HTTP request and response service.', tags: ['api', 'testing', 'http', 'dev'], time: '2024-12-20T14:00:00Z', updated_at: '2024-12-20T14:00:00Z' },
  // { url: 'https://postman.com', description: 'Postman', extended: 'API platform for development.', tags: ['api', 'tools', 'dev', 'testing'], time: '2024-12-19T08:00:00Z', updated_at: '2024-12-19T08:00:00Z' },
  // { url: 'https://git-scm.com', description: 'Git', extended: 'Distributed version control.', tags: ['git', 'dev', 'reference', 'docs'], time: '2024-12-18T10:00:00Z', updated_at: '2024-12-18T10:00:00Z' },
  // { url: 'https://github.com/docs', description: 'GitHub Docs', extended: 'GitHub documentation.', tags: ['github', 'docs', 'reference', 'dev'], time: '2024-12-17T12:00:00Z', updated_at: '2024-12-17T12:00:00Z' },
]
