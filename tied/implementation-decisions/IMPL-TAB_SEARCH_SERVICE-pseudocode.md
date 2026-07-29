# [IMPL-TAB_SEARCH_SERVICE] [REQ-SEARCH_FUNCTIONALITY]
# Tab search by title; searchAndNavigate and findNextTab with circular wrap; search history.
# Contract: search text and current tab; result with matchCount and tabId/title or error.
INPUT: searchText (string), currentTabId (number)
OUTPUT: { success, matchCount, tabId?, tabTitle? } or { success: false, matchCount, message }
DATA: lastSearchText, lastMatchedTabId, searchHistory (list)

# Normalize search; filter tabs by title; find next with wrap; activate and focus; update state.
searchAndNavigate(searchText, currentTabId):
  normalized = TRIM(LOWERCASE(searchText))
  isNewSearch = (lastSearchText !== normalized)
  restartTabId = isNewSearch ? currentTabId : (lastMatchedTabId OR currentTabId)
  allTabs = getAllTabs()
  matchingTabs = FILTER allTabs WHERE title CONTAINS normalized
  nextTab = findNextTab(matchingTabs, restartTabId)
  IF nextTab AND nextTab.id !== restartTabId:
    activateTab(nextTab.id)
    focusWindow(nextTab.windowId)
    lastSearchText = normalized
    lastMatchedTabId = nextTab.id
    addToSearchHistory(normalized)
    RETURN { success: true, matchCount: LEN(matchingTabs), tabId: nextTab.id, tabTitle: nextTab.title }
  ELSE:
    RETURN { success: false, matchCount: LEN(matchingTabs), message: "No matching tabs found" OR "Already on last match" }

# Circular: next after restartTabId or wrap to first.
findNextTab(matchingTabs, restartTabId):
  order tabs after restartTabId; wrap to start if none after
  RETURN next tab in sequence or null

# Move term to front if present else prepend.
addToSearchHistory(term):
  IF term in searchHistory: MOVE term to front
  ELSE: PREPEND term to searchHistory
