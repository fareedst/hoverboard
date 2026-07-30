# [IMPL-SIDE_PANEL_BOOKMARK_SEARCH] [ARCH-SIDE_PANEL_BOOKMARK_SEARCH] [REQ-SIDE_PANEL_BOOKMARK_SEARCH] — This block defines the search feature: pure filter plus panel UI. Implements REQ by providing search, count, and Next/Previous; implements ARCH by client-side filter and scroll/highlight.

## FILTER_BOOKMARKS_BY_SEARCH

- [REQ-SIDE_PANEL_BOOKMARK_SEARCH] [ARCH-SIDE_PANEL_BOOKMARK_SEARCH] [IMPL-SIDE_PANEL_BOOKMARK_SEARCH] How: filterBookmarksBySearch: implements "search displayed list by text" by returning bookmarks where query (trimmed, case-insensitive) appears in description, url, tags (joined), or extended. Empty/whitespace query returns full list.
- Contract:
  - INPUT: context / caller args
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: result
  - POST:
    - success => block outputs match OUTPUT shape
  - EFFECTS: pure
  - TERMINATION: total
- PROCEDURE: FILTER_BOOKMARKS_BY_SEARCH
  - q = String(query).trim().toLowerCase()
  - IF q === '' RETURN bookmarks
  - RETURN bookmarks WHERE bookmarkMatches(b, q)

## BOOKMARK_MATCHES

- [IMPL-SIDE_PANEL_BOOKMARK_SEARCH] [ARCH-SIDE_PANEL_BOOKMARK_SEARCH] [REQ-SIDE_PANEL_BOOKMARK_SEARCH] How: Implements bookmarkMatches(b, q) behavior for IMPL-SIDE_PANEL_BOOKMARK_SEARCH.
- Contract:
  - INPUT: context / caller args
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: result
  - POST:
    - success => block outputs match OUTPUT shape
  - EFFECTS: pure
  - TERMINATION: total
- PROCEDURE: BOOKMARK_MATCHES
  - title = (b.description ?? '').toLowerCase()
  - url = (b.url ?? '').toLowerCase()
  - tags = (b.tags ?? []).join(' ').toLowerCase()
  - extended = (b.extended ?? '').toLowerCase()
  - RETURN title.includes(q) OR url.includes(q) OR tags.includes(q) OR extended.includes(q)

## BLOCK_3

- [REQ-SIDE_PANEL_BOOKMARK_SEARCH] [ARCH-SIDE_PANEL_BOOKMARK_SEARCH] [IMPL-SIDE_PANEL_BOOKMARK_SEARCH] How: Pipeline integration: after applyFilters and sortBookmarks, if searchQuery.trim() then matchingBookmarks = filterBookmarksBySearch(displayedBookmarks, searchQuery); else matchingBookmarks = displayedBookmarks. Build tagToBookmarks or grouped from matchingBookmarks. Implements "filter displayed list" and "count of matching records". Search UI: search input, count span, Previous/Next buttons. Implements "display count" and "advance to next/previous record". Render: each bookmark link gets data-search-index = flat index in display order so Nth match can be found. Implements "scroll and highlight" by finding element with data-search-index === searchMatchIndex, scrollIntoView, classList.add('search-current'); clear previous highlight.
- Contract:
  - INPUT: context / caller args
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: result
  - POST:
    - success => block outputs match OUTPUT shape
  - EFFECTS: IO, State
  - TERMINATION: total
- PROCEDURE: BLOCK_3
  - 1. ON refresh / load: displayedBookmarks = sortBookmarks(applyFilters(rawBookmarks, filterState), sortBy, sortAsc)
  - 2.   IF searchQuery.trim(): matchingBookmarks = filterBookmarksBySearch(displayedBookmarks, searchQuery)
  - 3.   ELSE: matchingBookmarks = displayedBookmarks
  - 4.   build tree/grouped from matchingBookmarks; display count = matchingBookmarks.length
  - 5. searchInput: on input/change set searchQuery; re-run pipeline; set searchMatchIndex = 0; update searchCount text ("N matches" or "No matches")
  - 6. searchCount: textContent = matchingBookmarks.length === 0 ? "No matches" : matchingBookmarks.length + " matches"
  - 7. searchPrev: searchMatchIndex = (searchMatchIndex - 1 + total) % total; scrollToMatch(searchMatchIndex); setHighlight(searchMatchIndex)
  - 8. searchNext: searchMatchIndex = (searchMatchIndex + 1) % total; scrollToMatch(searchMatchIndex); setHighlight(searchMatchIndex)
  - 9. WHEN rendering tree or grouped: for each bookmark link set data-search-index = index (0-based in display order)
  - 10. scrollToMatch(idx): links = querySelectorAll('.tree-bookmark-link[data-search-index]'); el = links[idx]; IF el THEN el.scrollIntoView({ block: 'nearest' }); remove .search-current from all; el.classList.add('search-current')
