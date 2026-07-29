# [IMPL-SIDE_PANEL_BOOKMARK_SEARCH] [ARCH-SIDE_PANEL_BOOKMARK_SEARCH] [REQ-SIDE_PANEL_BOOKMARK_SEARCH]
# This block defines the search feature: pure filter plus panel UI. Implements REQ by providing search, count, and Next/Previous; implements ARCH by client-side filter and scroll/highlight.

# [REQ-SIDE_PANEL_BOOKMARK_SEARCH] [ARCH-SIDE_PANEL_BOOKMARK_SEARCH] [IMPL-SIDE_PANEL_BOOKMARK_SEARCH]
# filterBookmarksBySearch: implements "search displayed list by text" by returning bookmarks where query (trimmed, case-insensitive) appears in description, url, tags (joined), or extended. Empty/whitespace query returns full list.
filterBookmarksBySearch(bookmarks, query):
  q = String(query).trim().toLowerCase()
  IF q === '' RETURN bookmarks
  RETURN bookmarks WHERE bookmarkMatches(b, q)
bookmarkMatches(b, q):
  title = (b.description ?? '').toLowerCase()
  url = (b.url ?? '').toLowerCase()
  tags = (b.tags ?? []).join(' ').toLowerCase()
  extended = (b.extended ?? '').toLowerCase()
  RETURN title.includes(q) OR url.includes(q) OR tags.includes(q) OR extended.includes(q)

# [REQ-SIDE_PANEL_BOOKMARK_SEARCH] [ARCH-SIDE_PANEL_BOOKMARK_SEARCH] [IMPL-SIDE_PANEL_BOOKMARK_SEARCH]
# Pipeline integration: after applyFilters and sortBookmarks, if searchQuery.trim() then matchingBookmarks = filterBookmarksBySearch(displayedBookmarks, searchQuery); else matchingBookmarks = displayedBookmarks. Build tagToBookmarks or grouped from matchingBookmarks. Implements "filter displayed list" and "count of matching records".
ON refresh / load: displayedBookmarks = sortBookmarks(applyFilters(rawBookmarks, filterState), sortBy, sortAsc)
  IF searchQuery.trim(): matchingBookmarks = filterBookmarksBySearch(displayedBookmarks, searchQuery)
  ELSE: matchingBookmarks = displayedBookmarks
  build tree/grouped from matchingBookmarks; display count = matchingBookmarks.length

# [REQ-SIDE_PANEL_BOOKMARK_SEARCH] [ARCH-SIDE_PANEL_BOOKMARK_SEARCH] [IMPL-SIDE_PANEL_BOOKMARK_SEARCH]
# Search UI: search input, count span, Previous/Next buttons. Implements "display count" and "advance to next/previous record".
searchInput: on input/change set searchQuery; re-run pipeline; set searchMatchIndex = 0; update searchCount text ("N matches" or "No matches")
searchCount: textContent = matchingBookmarks.length === 0 ? "No matches" : matchingBookmarks.length + " matches"
searchPrev: searchMatchIndex = (searchMatchIndex - 1 + total) % total; scrollToMatch(searchMatchIndex); setHighlight(searchMatchIndex)
searchNext: searchMatchIndex = (searchMatchIndex + 1) % total; scrollToMatch(searchMatchIndex); setHighlight(searchMatchIndex)

# [REQ-SIDE_PANEL_BOOKMARK_SEARCH] [ARCH-SIDE_PANEL_BOOKMARK_SEARCH] [IMPL-SIDE_PANEL_BOOKMARK_SEARCH]
# Render: each bookmark link gets data-search-index = flat index in display order so Nth match can be found. Implements "scroll and highlight" by finding element with data-search-index === searchMatchIndex, scrollIntoView, classList.add('search-current'); clear previous highlight.
WHEN rendering tree or grouped: for each bookmark link set data-search-index = index (0-based in display order)
scrollToMatch(idx): links = querySelectorAll('.tree-bookmark-link[data-search-index]'); el = links[idx]; IF el THEN el.scrollIntoView({ block: 'nearest' }); remove .search-current from all; el.classList.add('search-current')
