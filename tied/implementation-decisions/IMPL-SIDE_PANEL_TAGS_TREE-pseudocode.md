# [IMPL-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [REQ-SIDE_PANEL_TAGS_TREE]
# This block defines the overall feature: side panel tags tree opened from popup; panel shows tag→urls tree; click URL opens in new tab. Implements REQ by providing the side-panel entry and tag-tree UX; implements ARCH by following the open-flow and data-flow decisions.
INPUT: user click in popup (open Tags tree); panel page load; user actions in panel (select/reorder tags, expand/collapse, click URL)
OUTPUT: side panel visible; tag selector and hierarchical tree rendered; URL opens in new tab on click
DATA: bookmarks (from getAggregatedBookmarksForIndex), config (expanded, timeField, timeStart, timeEnd, tagsInclude, domains, groupBy, sortBy, sortAsc, selectedTagOrder, showAllTags), filtered bookmarks, tagToBookmarks (Map tag → [{ title, url }]), allTags (string[]), collapsedTags/collapsedSections (Set), panel DOM refs

# [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]
# Popup entry: implements requirement "open tags tree from popup" by sending OPEN_SIDE_PANEL. ARCH prescribes message-based open; this block is the popup side.
ON popup "Tags tree" click:
  recordAction(openTagsTree); IF _onAction THEN _onAction(openTagsTree)
  SEND message OPEN_SIDE_PANEL (no payload)
  ON success: showSuccess("Tags tree opened in side panel")
  ON error: errorHandler.handleError("Failed to open tags tree", error)

# [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]
# SW open in user gesture: implements requirement that side panel opens in response to user click. chrome.sidePanel.open() may only be called in user gesture (no await). So: maintain cached normal windowId; on OPEN_SIDE_PANEL handle in onMessage synchronously (no await before open). Implements ARCH open flow.
SW constructor:
  _sidePanelWindowId = null
  _seedSidePanelWindowCache()  // async seed from active tab's normal window
SW onMessage OPEN_SIDE_PANEL (before any await):
  windowId = _sidePanelWindowId; openFn = chrome.sidePanel?.open
  IF windowId != null AND openFn: chrome.sidePanel.open({ windowId }); sendResponse({ success: true })
  ELSE: sendResponse({ success: false, error: "No browser window..." })
  RETURN true
SW handleTabActivated: get tab.windowId; get window; IF type === 'normal' THEN _sidePanelWindowId = window.id  // implements cache maintenance
_seedSidePanelWindowCache: tabs.query({ active: true }); get window for tab.windowId; IF type === 'normal' THEN _sidePanelWindowId = window.id

# [IMPL-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [REQ-SIDE_PANEL_TAGS_TREE] [IMPL-LOCAL_BOOKMARKS_INDEX]
# Panel load: implements tag tree data flow; uses getAggregatedBookmarksForIndex then load config, apply filters, sort, group, build tag map and tag list, render. Implements REQ filters/sort/group and config persistence.
ON panel page load:
  config = loadPanelConfig()  // expanded, timeField, timeStart, timeEnd, tagsInclude, domains, groupBy, sortBy, sortAsc, selectedTagOrder
  renderConfigToggle(config.expanded)  // compact bar when collapsed; full controls when expanded
  SEND getAggregatedBookmarksForIndex
  ON response: bookmarks = response.bookmarks; filtered = applyFilters(bookmarks, config); sorted = sortBookmarks(filtered, config.sortBy, config.sortAsc); allTags = getAllTagsFromBookmarks(bookmarks); selectedTagOrder = config.selectedTagOrder OR allTags; IF config.groupBy !== 'none' THEN grouped = groupBookmarksBy(sorted, config.groupBy); renderGrouped(grouped, config) ELSE tagToBookmarks = buildTagToBookmarks(sorted); collapsedTags = loadCollapsedState(); renderTagSelector(); renderTree(selectedTagOrder, tagToBookmarks, collapsedTags); attachClickHandlers()

# [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [ARCH-SIDE_PANEL_TABS] [IMPL-SIDE_PANEL_TAGS_TREE]
# When panel is tabbed, Tags tree is second tab; load/render runs on tab select or first show. initTagsTreeTab(options) is callable from side-panel.js when user selects Tags tree tab; optional currentBookmarkTags syncs tag selector to current bookmark. Implements "Tags tree tab" in tabbed panel and "tag selector matches current bookmark; tree shows only bookmarks that share at least one tag".
WHEN panel is tabbed (side-panel.html): Tags tree content in #tagsTreePanel; initTagsTreeTab(options) exported; side-panel.js passes currentBookmarkTags from Bookmark tab controller when switching to Tags tree. initTagsTreeTab(options): IF options.currentBookmarkTags set pendingCurrentBookmarkTags. loadBookmarks(): after allTags and default selectedTagOrder, IF pendingCurrentBookmarkTags set THEN selectedTagOrder = intersectionTagOrder(allTags, pendingCurrentBookmarkTags); saveSelectedTagOrder(selectedTagOrder); pendingCurrentBookmarkTags = null. setSelectedTagsFromCurrentBookmark(tags): when Tags tree already loaded, selectedTagOrder = intersectionTagOrder(allTags, tags); save; refreshFromConfig(); renderTagSelector(). intersectionTagOrder(allTags, preferredTags): RETURN preferredTags filtered to tags that exist in allTags (order preserved). Implements "Tags tree displays only bookmarks that have at least one of the same tags as the current bookmark".

# [IMPL-SIDE_PANEL_TAGS_TREE] [PROC-DEMO_RECORDING] [REQ-SIDE_PANEL_TAGS_TREE]
# Placeholder/demo mode (?demo=1 or ?screenshot=1): loadPlaceholderForScreenshot uses tagsTreePlaceholderBookmarks (tags-tree-demo-data.js), a rich set (25+ bookmarks, 15+ tags, time/updated_at, extended) so the By Tag demo GIF shows tag selector, tree, filters and search. Set rawBookmarks so tag toggle invokes refreshFromConfig; then tagToBookmarks, allTags, selectedTagOrder; hide load error and empty state; renderTagSelector(); renderTree().
loadPlaceholderForScreenshot(): rawBookmarks = [...tagsTreePlaceholderBookmarks]; tagToBookmarks = buildTagToBookmarks(tagsTreePlaceholderBookmarks); allTags = getAllTagsFromBookmarks(tagsTreePlaceholderBookmarks); selectedTagOrder = [...allTags]; hide loadErrorEl and emptyStateEl; renderTagSelector(); renderTree()

# [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]
# buildTagToBookmarks: implements requirement "tag-based tree" by producing Map<tag, [{ title, url }]> from bookmarks. One pass; trim/dedupe per tag.
buildTagToBookmarks(bookmarks):
  result = new Map()
  FOR each b in bookmarks:
    tags = Array.isArray(b.tags) ? b.tags : []; title = b.description || b.url || ''
    FOR each tag in tags:
      tagKey = String(tag).trim(); IF empty skip
      IF result has no key tagKey THEN result[tagKey] = []; result[tagKey].push({ title, url: b.url })
  RETURN result

# [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]
# getAllTagsFromBookmarks: implements tag selector data by returning sorted unique tags from bookmarks.
getAllTagsFromBookmarks(bookmarks):
  set = new Set(); FOR each b in bookmarks: FOR each t in (b.tags || []): set.add(String(t).trim())
  RETURN sorted Array.from(set)

# [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]
# Tag list view mode: implements "user can switch between all tags and only checked tags; choice persisted". showAllTags boolean in config; when true display allTags, when false display selectedTagOrder filtered by allTags (avoid stale tags). Persisted in panel config.
getTagsToDisplay(allTags, selectedTagOrder, showAllTags):
  IF showAllTags THEN RETURN allTags
  allSet = Set(allTags); RETURN selectedTagOrder filtered to items IN allSet (preserve order)

# [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]
# renderTagSelector: implements tag selection and order UI and compact layout. Renders checkboxes for visibleTags = getTagsToDisplay(allTags, selectedTagOrder, config.showAllTags); on checkbox change save selectedTagOrder and refreshFromConfig; toggle change updates showAllTags, savePanelConfig, renderTagSelector only.
renderTagSelector():
  visibleTags = getTagsToDisplay(allTags, selectedTagOrder, config.showAllTags)
  render list of tags (visibleTags) with selection state (checked iff in selectedTagOrder) and compact layout; on change save selectedTagOrder and refreshFromConfig
ON tag list view toggle: config.showAllTags = NOT config.showAllTags; savePanelConfig(config); renderTagSelector()

# [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]
# renderTree: implements collapsible URL lists per tag; each section has tag label + toggle + list of title+URL.
renderTree(selectedTagOrder, tagToBookmarks, collapsedTags):
  FOR each tag in selectedTagOrder: entries = tagToBookmarks.get(tag) || []; render section (tag + toggle + list); store url for click

# [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]
# refreshFromConfig: syncConfigFromControls; savePanelConfig; IF !rawBookmarks or length 0 RETURN (no re-render). filterState = getFilterStateForTagsTree(panelConfig, selectedTagOrder); filtered = applyFilters(rawBookmarks, filterState); sorted = sortBookmarks(filtered, ...); matchingBookmarks = search filter or sorted; IF groupBy !== 'none' renderGrouped ELSE tagToBookmarks = buildTagToBookmarks(matchingBookmarks, allTags); renderTagSelector(); renderTree(); updateSearchCount; scrollToMatch.
refreshFromConfig(): syncConfigFromControls(); savePanelConfig(); IF !rawBookmarks or rawBookmarks.length === 0 RETURN; filterState = getFilterStateForTagsTree(panelConfig, selectedTagOrder); filtered = applyFilters(rawBookmarks, filterState); sorted = sortBookmarks(filtered, panelConfig.sortBy, panelConfig.sortAsc); matchingBookmarks = searchQuery ? filterBookmarksBySearch(sorted, searchQuery) : sorted; IF panelConfig.groupBy !== 'none' THEN renderGrouped(matchingBookmarks) ELSE tagToBookmarks = buildTagToBookmarks(matchingBookmarks, allTags); renderTagSelector(); renderTree(); updateSearchCount(); scrollToMatch(searchMatchIndex)

# [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]
# Config expand/collapse: implements requirement that config region is expandable for use and collapsible to maximize bookmarks space; toggle loads/saves expanded state; when collapsed only compact bar visible; when expanded show full filter and display controls.
ON config toggle click: config.expanded = NOT config.expanded; savePanelConfig(config); renderConfigToggle(config.expanded); show or hide config content

# [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]
# Filter pipeline: implements requirement to filter by create/update time range, tags include, and domain. Apply in sequence: time range (field + startMs/endMs), then tags include (bookmark must have at least one tag in set), then domains (URL hostname in set). Empty set or null bounds mean no filter for that step.
applyFilters(bookmarks, config): list = bookmarks; list = filterByTimeRange(list, config.timeField, config.timeStart, config.timeEnd); list = filterByTagsInclude(list, config.tagsInclude); list = filterByDomains(list, config.domains); RETURN list

# [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]
# getDomainFromUrl: implements domain filter/group by returning hostname from URL; invalid or empty URL returns empty string; no throw.
getDomainFromUrl(url): IF !url or !String(url).trim() RETURN ''; TRY parse url; RETURN hostname (lowercase) OR ''

# [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]
# filterByTimeRange: implements time range filter; uses bookmark time or updated_at per field; null start/end means no bound; inclusive.
filterByTimeRange(bookmarks, field, startMs, endMs): RETURN bookmarks WHERE inTimeRange(b, field, startMs, endMs)  // inTimeRange: get ms from b; if null return false; if startMs and ms < startMs return false; if endMs and ms > endMs return false; return true

# [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]
# filterByTagsInclude: implements tags include filter; empty tagSet = all pass; otherwise bookmark must have at least one tag (case-insensitive) in set.
filterByTagsInclude(bookmarks, tagSet): IF !tagSet or size 0 RETURN bookmarks; RETURN bookmarks WHERE (b.tags normalized) INTERSECT tagSet non-empty

# [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]
# filterByDomains: implements domain filter; empty domainSet = all pass; otherwise bookmark's getDomainFromUrl(url) in domainSet (case-insensitive).
filterByDomains(bookmarks, domainSet): IF !domainSet or size 0 RETURN bookmarks; RETURN bookmarks WHERE getDomainFromUrl(b.url) in domainSet

# [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]
# sortBookmarks: implements display sort by chosen axis (time, updated_at, tag, domain) and direction (sortAsc). For time use ms; for tag use first tag or ''; for domain use getDomainFromUrl.
sortBookmarks(bookmarks, sortBy, sortAsc): sort list by sortBy key; if sortAsc ascending else descending; RETURN sorted array

# [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]
# groupBookmarksBy: implements display group by; returns structure for sectioned render (e.g. Map<groupKey, bookmark[]>). groupBy in 'none' | 'time' | 'updated_at' | 'tag' | 'domain'; bucket keys for date (e.g. date string); per-tag or per-domain one key per value.
groupBookmarksBy(bookmarks, groupBy): IF groupBy === 'none' RETURN null or flat; result = Map(); FOR b in bookmarks: key = keyFor(b, groupBy); append b to result[key]; RETURN result

# [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]
# renderGrouped: implements collapsible sectioned display when groupBy not none; each section has header (toggle) and list of bookmark links; click URL opens in new tab.
renderGrouped(grouped, config): FOR each groupKey in grouped: render section header (groupKey + toggle); render list of title+URL; store url for click → openUrlInNewTab(url)

# [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]
# loadPanelConfig / savePanelConfig: implements config state persistence; read/write expanded, timeField, timeStart, timeEnd, tagsInclude, domains, groupBy, sortBy, sortAsc, selectedTagOrder, showAllTags to chrome.storage.local. showAllTags defaults true for backward compatibility.
loadPanelConfig(): get from chrome.storage.local; RETURN defaults for missing keys (showAllTags default true)
savePanelConfig(config): chrome.storage.local.set(config keyed by storage keys)

# [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]
# openUrlInNewTab / ON click URL: implements "click-to-open in new tab" requirement via chrome.tabs.create({ url }).
ON click URL in tree: url = event target url; openUrlInNewTab(url)  // openUrlInNewTab(url) => chrome.tabs.create({ url })

# [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [ARCH-SIDE_PANEL_TABS] [IMPL-SIDE_PANEL_TAGS_TREE]
# Tags tree panel layout: panel (#tagsTreePanel) is the scroll container so the above-list div can scroll off the page; .tree-section has min-height 100% so it consumes full visible height when the div is scrolled off and scrolls its list. Implements "tab content fills vertical space" for Tags tree tab.
# DOM: #tagsTreePanel > .tags-tree-above-list > (header, config-section, search-section, tag-selector-section) + .tree-section
CSS #tagsTreePanel: display block; flex 1 1 0; min-height 0; overflow-y auto; background var(--color-background)
CSS .tags-tree-above-list: flex none (natural height; scrolls off with panel scroll)
CSS .tree-section: min-height 100%; overflow-y auto
