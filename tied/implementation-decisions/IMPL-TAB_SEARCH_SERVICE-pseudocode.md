# [IMPL-TAB_SEARCH_SERVICE] [REQ-SEARCH_FUNCTIONALITY] — Tab search by title; searchAndNavigate and findNextTab with circular wrap; search history. Contract: search text and current tab; result with matchCount and tabId/title or error.

## SEARCH_AND_NAVIGATE

- [IMPL-TAB_SEARCH_SERVICE] [REQ-SEARCH_FUNCTIONALITY] How: Implements searchAndNavigate(searchText, currentTabId) behavior for IMPL-TAB_SEARCH_SERVICE.
- Contract:
  - INPUT: searchText (string), currentTabId (number)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: { success, matchCount, tabId?, tabTitle? } or { success: false, matchCount, message }
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: lastSearchText, lastMatchedTabId, searchHistory (list)
  - EFFECTS: pure
  - TERMINATION: total
- PROCEDURE: SEARCH_AND_NAVIGATE
  - normalized = TRIM(LOWERCASE(searchText))
  - isNewSearch = (lastSearchText !== normalized)
  - restartTabId = isNewSearch ? currentTabId : (lastMatchedTabId OR currentTabId)
  - allTabs = getAllTabs()
  - matchingTabs = FILTER allTabs WHERE title CONTAINS normalized
  - nextTab = findNextTab(matchingTabs, restartTabId)
  - IF nextTab AND nextTab.id !== restartTabId:
  - activateTab(nextTab.id)
  - focusWindow(nextTab.windowId)
  - lastSearchText = normalized
  - lastMatchedTabId = nextTab.id
  - addToSearchHistory(normalized)
  - RETURN { success: true, matchCount: LEN(matchingTabs), tabId: nextTab.id, tabTitle: nextTab.title }
  - ELSE:
  - RETURN { success: false, matchCount: LEN(matchingTabs), message: "No matching tabs found" OR "Already on last match" }
  - How (sub-block): Circular: next after restartTabId or wrap to first.

## FIND_NEXT_TAB

- [IMPL-TAB_SEARCH_SERVICE] [REQ-SEARCH_FUNCTIONALITY] How: Implements findNextTab(matchingTabs, restartTabId) behavior for IMPL-TAB_SEARCH_SERVICE.
- Contract:
  - INPUT: searchText (string), currentTabId (number)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: { success, matchCount, tabId?, tabTitle? } or { success: false, matchCount, message }
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: lastSearchText, lastMatchedTabId, searchHistory (list)
  - EFFECTS: pure
  - TERMINATION: total
- PROCEDURE: FIND_NEXT_TAB
  - order tabs after restartTabId; wrap to start if none after
  - RETURN next tab in sequence or null
  - How (sub-block): Move term to front if present else prepend.

## ADD_TO_SEARCH_HISTORY

- [IMPL-TAB_SEARCH_SERVICE] [REQ-SEARCH_FUNCTIONALITY] How: Implements addToSearchHistory(term) behavior for IMPL-TAB_SEARCH_SERVICE.
- Contract:
  - INPUT: searchText (string), currentTabId (number)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: { success, matchCount, tabId?, tabTitle? } or { success: false, matchCount, message }
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: lastSearchText, lastMatchedTabId, searchHistory (list)
  - EFFECTS: pure
  - TERMINATION: total
- PROCEDURE: ADD_TO_SEARCH_HISTORY
  - IF term in searchHistory: MOVE term to front
  - ELSE: PREPEND term to searchHistory
