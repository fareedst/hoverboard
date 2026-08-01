# [IMPL-BOOKMARK_USAGE_TRACKING_UI] [ARCH-BOOKMARK_USAGE_TRACKING_UI] [REQ-BOOKMARK_USAGE_TRACKING] — Three surfaces: This Page inline, Index columns, Visit History standalone page (not a side-panel tab).

## MAIN

- [IMPL-BOOKMARK_USAGE_TRACKING_UI] [ARCH-BOOKMARK_USAGE_TRACKING_UI] [REQ-BOOKMARK_USAGE_TRACKING] How: Coordinate Surface 1 (This Page) and Surface 2 (Index); Surface 3 is INIT_VISIT_HISTORY_PAGE.
- Contract:
  - INPUT: context / caller args
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: result
  - POST:
    - success => block outputs match OUTPUT shape
  - EFFECTS: Http, IO, State
  - TERMINATION: total
- PROCEDURE: MAIN
  - How (sub-block): Block 1: Surface 1 – This Page inline. After loadInitialData fetch getBookmarkUsage(url) and getInboundLinks(url); if visitCount>0 show usageStatsSection else hide.
  - How (sub-block): Block 2: Surface 2 – Index table Visits and Last Visited columns. ARCH: Index columns; IMPL: merge usage, render, sort.
  - How (sub-block): 2a. On load: after getAggregatedBookmarksForIndex, send getBookmarkUsage() (no url) to get all usage array.
  - How (sub-block): 2b. Build map url -> usage; for each bookmark b, set b.visits = map[b.url]?.visitCount ?? 0, b.lastVisited = map[b.url]?.lastVisitedAt ?? ''.
  - How (sub-block): 2c. renderTableBody: for each row add <td class="col-visits"> and <td class="col-last-visited">; lastVisited uses timeDisplayMode (absolute/age).
  - How (sub-block): 2d. Sort comparator: add visits (numeric), lastVisited (string compare).
  - How (sub-block): Block 3: Surface 3 – Visit History standalone page — see INIT_VISIT_HISTORY_PAGE; tools toolbar opens via tabs.create (TOOLS_TOOLBAR_PAGE).

## INIT_VISIT_HISTORY_PAGE

- [IMPL-BOOKMARK_USAGE_TRACKING_UI] [ARCH-BOOKMARK_USAGE_TRACKING_UI] [REQ-BOOKMARK_USAGE_TRACKING] [IMPL-NON_WEB_TOOLS_TOOLBAR] How: visit-history.js DOMContentLoaded → tool-page-version + initVisitHistoryPage(); not a side-panel tab; TAB_USAGE legacy fallback only.
- Contract:
  - INPUT: DOMContentLoaded on visit-history.html; or tools-toolbar btn-visit-history tabs.create
  - PRE: visit-history.html shell with #visitHistoryPanel in document when init runs
  - OUTPUT: page chrome versioned; Most Visited / Recently Visited / Navigation Graph initialized
  - POST: side panel has no Usage tab button; TAB_IDS exclude usage
  - EFFECTS: IO (tabs.create from toolbar; usage/graph messages from page)
  - TERMINATION: total
- PROCEDURE: INIT_VISIT_HISTORY_PAGE
  - ON DOMContentLoaded: initToolPageVersion(); initVisitHistoryPage()
  - initVisitHistoryPage(): send getBookmarkUsageStats({ n: 10 }), getBookmarkNavigationGraph(); render Most Visited (mostFrequent), Recently Visited (mostRecent), Navigation Graph (edges grouped by sourceUrl)
  - ON tools-toolbar btn-visit-history: tabs.create(getURL('src/ui/visit-history/visit-history.html'))
