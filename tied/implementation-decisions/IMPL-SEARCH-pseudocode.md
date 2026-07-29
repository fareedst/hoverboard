# [IMPL-SEARCH] [ARCH-SEARCH] [REQ-SEARCH_FUNCTIONALITY]
# How: search bookmarks/tabs by query across popup and side-panel surfaces with consistent no-match feedback.
INPUT: user query string; search scope (bookmarks, tabs, tags); TabSearchService / bookmark index readers
OUTPUT: ordered match list or empty-state UI per REQ-TAB_SEARCH_NO_MATCH_UX
DATA: TabSearchService; side-panel bookmark search; popup search entry points

# [IMPL-SEARCH] [ARCH-SEARCH] [REQ-SEARCH_FUNCTIONALITY]
# How: normalize query, filter candidates, return matches or empty-state signal.
RUN_SEARCH(query, scope):
  q = TRIM(query)
  IF q empty: RETURN empty-state OR all-in-scope per surface policy
  matches = FILTER candidates IN scope BY q
  IF matches empty: RETURN NO_MATCH_UI
  RETURN matches
