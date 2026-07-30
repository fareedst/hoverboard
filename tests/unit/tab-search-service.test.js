/**
 * === IMPL-FULL-BLOCK: IMPL-TAB_SEARCH_SERVICE ===
 * [IMPL-TAB_SEARCH_SERVICE] [REQ-SEARCH_FUNCTIONALITY] — Tab search by title; searchAndNavigate and findNextTab with circular wrap; search history. Contract: search text and current tab; result with matchCount and tabId/title or error.
 * 
 * ## SEARCH_AND_NAVIGATE
 * 
 * - [IMPL-TAB_SEARCH_SERVICE] [REQ-SEARCH_FUNCTIONALITY] How: Implements searchAndNavigate(searchText, currentTabId) behavior for IMPL-TAB_SEARCH_SERVICE.
 * - Contract:
 *   - INPUT: searchText (string), currentTabId (number)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: { success, matchCount, tabId?, tabTitle? } or { success: false, matchCount, message }
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: lastSearchText, lastMatchedTabId, searchHistory (list)
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: SEARCH_AND_NAVIGATE
 *   - normalized = TRIM(LOWERCASE(searchText))
 *   - isNewSearch = (lastSearchText !== normalized)
 *   - restartTabId = isNewSearch ? currentTabId : (lastMatchedTabId OR currentTabId)
 *   - allTabs = getAllTabs()
 *   - matchingTabs = FILTER allTabs WHERE title CONTAINS normalized
 *   - nextTab = findNextTab(matchingTabs, restartTabId)
 *   - IF nextTab AND nextTab.id !== restartTabId:
 *   - activateTab(nextTab.id)
 *   - focusWindow(nextTab.windowId)
 *   - lastSearchText = normalized
 *   - lastMatchedTabId = nextTab.id
 *   - addToSearchHistory(normalized)
 *   - RETURN { success: true, matchCount: LEN(matchingTabs), tabId: nextTab.id, tabTitle: nextTab.title }
 *   - ELSE:
 *   - RETURN { success: false, matchCount: LEN(matchingTabs), message: "No matching tabs found" OR "Already on last match" }
 *   - How (sub-block): Circular: next after restartTabId or wrap to first.
 * 
 * ## FIND_NEXT_TAB
 * 
 * - [IMPL-TAB_SEARCH_SERVICE] [REQ-SEARCH_FUNCTIONALITY] How: Implements findNextTab(matchingTabs, restartTabId) behavior for IMPL-TAB_SEARCH_SERVICE.
 * - Contract:
 *   - INPUT: searchText (string), currentTabId (number)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: { success, matchCount, tabId?, tabTitle? } or { success: false, matchCount, message }
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: lastSearchText, lastMatchedTabId, searchHistory (list)
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: FIND_NEXT_TAB
 *   - order tabs after restartTabId; wrap to start if none after
 *   - RETURN next tab in sequence or null
 *   - How (sub-block): Move term to front if present else prepend.
 * 
 * ## ADD_TO_SEARCH_HISTORY
 * 
 * - [IMPL-TAB_SEARCH_SERVICE] [REQ-SEARCH_FUNCTIONALITY] How: Implements addToSearchHistory(term) behavior for IMPL-TAB_SEARCH_SERVICE.
 * - Contract:
 *   - INPUT: searchText (string), currentTabId (number)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: { success, matchCount, tabId?, tabTitle? } or { success: false, matchCount, message }
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: lastSearchText, lastMatchedTabId, searchHistory (list)
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: ADD_TO_SEARCH_HISTORY
 *   - IF term in searchHistory: MOVE term to front
 *   - ELSE: PREPEND term to searchHistory
 * 
 * === END IMPL-FULL-BLOCK: IMPL-TAB_SEARCH_SERVICE ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-SEARCH ===
 * [IMPL-SEARCH] [ARCH-SEARCH] [REQ-SEARCH_FUNCTIONALITY] — How: search bookmarks/tabs by query across popup and side-panel surfaces with consistent no-match feedback.
 * 
 * ## RUN_SEARCH
 * 
 * - [IMPL-SEARCH] [ARCH-SEARCH] [REQ-SEARCH_FUNCTIONALITY] How: normalize query, filter candidates, return matches or empty-state signal.
 * - Contract:
 *   - INPUT: user query string; search scope (bookmarks, tabs, tags); TabSearchService / bookmark index readers
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: ordered match list or empty-state UI per REQ-TAB_SEARCH_NO_MATCH_UX
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: TabSearchService; side-panel bookmark search; popup search entry points
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: State
 *   - TERMINATION: total
 * - PROCEDURE: RUN_SEARCH
 *   - q = TRIM(query)
 *   - IF q empty: RETURN empty-state OR all-in-scope per surface policy
 *   - matches = FILTER candidates IN scope BY q
 *   - IF matches empty: RETURN NO_MATCH_UI
 *   - RETURN matches
 * 
 * === END IMPL-FULL-BLOCK: IMPL-SEARCH ===
 */
import { TabSearchService } from '../../src/features/search/tab-search-service.js'

describe('[REQ-SEARCH_FUNCTIONALITY] [IMPL-TAB_SEARCH_SERVICE] TabSearchService', () => {
  let tabSearchService
  let mockChrome

  beforeEach(() => {
    tabSearchService = new TabSearchService()
    
    // Mock chrome.tabs API
    mockChrome = {
      tabs: {
        query: jest.fn(),
        update: jest.fn()
      },
      windows: {
        update: jest.fn()
      },
      runtime: {
        lastError: null
      }
    }
    
    global.chrome = mockChrome
  })

  afterEach(() => {
    delete global.chrome
  })

  describe('[TAB-SEARCH-CORE] searchAndNavigate', () => {
    it('should find and navigate to matching tab', async () => {
      const mockTabs = [
        { id: 1, title: 'Google', windowId: 1 },
        { id: 2, title: 'GitHub', windowId: 1 },
        { id: 3, title: 'Stack Overflow', windowId: 1 }
      ]

      mockChrome.tabs.query.mockImplementation((query, callback) => {
        callback(mockTabs)
      })

      mockChrome.tabs.update.mockImplementation((tabId, options, callback) => {
        callback(mockTabs.find(tab => tab.id === tabId))
      })

      mockChrome.windows.update.mockImplementation((windowId, options, callback) => {
        callback({ id: windowId })
      })

      const result = await tabSearchService.searchAndNavigate('GitHub', 1)

      expect(result.success).toBe(true)
      expect(result.matchCount).toBe(1)
      expect(result.tabId).toBe(2)
      expect(result.tabTitle).toBe('GitHub')
    })

    it('should handle no matching tabs', async () => {
      const mockTabs = [
        { id: 1, title: 'Google', windowId: 1 },
        { id: 2, title: 'GitHub', windowId: 1 }
      ]

      mockChrome.tabs.query.mockImplementation((query, callback) => {
        callback(mockTabs)
      })

      const result = await tabSearchService.searchAndNavigate('Nonexistent', 1)

      expect(result.success).toBe(false)
      expect(result.matchCount).toBe(0)
      expect(result.message).toBe('No matching tabs found')
    })

    it('should implement circular navigation', async () => {
      const mockTabs = [
        { id: 1, title: 'Test Tab 1', windowId: 1 },
        { id: 2, title: 'Test Tab 2', windowId: 1 },
        { id: 3, title: 'Test Tab 1', windowId: 1 }
      ]

      mockChrome.tabs.query.mockImplementation((query, callback) => {
        callback(mockTabs)
      })

      mockChrome.tabs.update.mockImplementation((tabId, options, callback) => {
        callback(mockTabs.find(tab => tab.id === tabId))
      })

      mockChrome.windows.update.mockImplementation((windowId, options, callback) => {
        callback({ id: windowId })
      })

      // First search - should find next match after current tab (tab 3)
      const result1 = await tabSearchService.searchAndNavigate('Test Tab 1', 1)
      console.log('First search result:', result1)
      expect(result1.tabId).toBe(3)

      // Second search with same term - should wrap around to first match (tab 1)
      const result2 = await tabSearchService.searchAndNavigate('Test Tab 1', 1)
      console.log('Second search result:', result2)
      expect(result2.tabId).toBe(1)
    })

    it('should continue search from last position', async () => {
      const mockTabs = [
        { id: 1, title: 'Test Tab', windowId: 1 },
        { id: 2, title: 'Test Tab', windowId: 1 },
        { id: 3, title: 'Test Tab', windowId: 1 }
      ]

      mockChrome.tabs.query.mockImplementation((query, callback) => {
        callback(mockTabs)
      })

      mockChrome.tabs.update.mockImplementation((tabId, options, callback) => {
        callback(mockTabs.find(tab => tab.id === tabId))
      })

      mockChrome.windows.update.mockImplementation((windowId, options, callback) => {
        callback({ id: windowId })
      })

      // First search - should find next match after current tab (tab 2)
      const result1 = await tabSearchService.searchAndNavigate('Test Tab', 1)
      expect(result1.tabId).toBe(2)

      // Second search with same term - should continue from last match (tab 2) and find next (tab 3)
      const result2 = await tabSearchService.searchAndNavigate('Test Tab', 1)
      expect(result2.tabId).toBe(3)
    })

    it('should handle Chrome API errors', async () => {
      mockChrome.tabs.query.mockImplementation((query, callback) => {
        mockChrome.runtime.lastError = { message: 'Permission denied' }
        callback([])
      })

      await expect(tabSearchService.searchAndNavigate('test', 1))
        .rejects.toThrow('Tab search failed: Permission denied')
    })
  })

  describe('[TAB-SEARCH-STATE] search history', () => {
    it('should maintain search history', () => {
      tabSearchService.addToSearchHistory('test1')
      tabSearchService.addToSearchHistory('test2')
      tabSearchService.addToSearchHistory('test1') // Should move to front

      const history = tabSearchService.getSearchHistory()
      expect(history).toEqual(['test1', 'test2'])
    })

    it('should limit history to 10 items', () => {
      for (let i = 1; i <= 12; i++) {
        tabSearchService.addToSearchHistory(`test${i}`)
      }

      const history = tabSearchService.getSearchHistory()
      expect(history.length).toBe(10)
      expect(history[0]).toBe('test12')
    })

    it('should ignore empty search terms', () => {
      tabSearchService.addToSearchHistory('')
      tabSearchService.addToSearchHistory('   ')
      tabSearchService.addToSearchHistory('valid')

      const history = tabSearchService.getSearchHistory()
      expect(history).toEqual(['valid'])
    })

    it('should clear search state', () => {
      tabSearchService.addToSearchHistory('test')
      tabSearchService.searchAndNavigate('test', 1)
      
      tabSearchService.clearSearchState()
      
      expect(tabSearchService.lastSearchText).toBeNull()
      expect(tabSearchService.lastMatchedTabId).toBeNull()
      // History should remain
      expect(tabSearchService.getSearchHistory()).toEqual(['test'])
    })
  })

  describe('[TAB-SEARCH-NAV] navigation methods', () => {
    it('should activate tab successfully', async () => {
      const mockTab = { id: 123, title: 'Test Tab' }
      mockChrome.tabs.update.mockImplementation((tabId, options, callback) => {
        callback(mockTab)
      })

      const result = await tabSearchService.activateTab(123)
      expect(result).toEqual(mockTab)
    })

    it('should focus window successfully', async () => {
      const mockWindow = { id: 456 }
      mockChrome.windows.update.mockImplementation((windowId, options, callback) => {
        callback(mockWindow)
      })

      const result = await tabSearchService.focusWindow(456)
      expect(result).toEqual(mockWindow)
    })

    it('should handle tab activation errors', async () => {
      mockChrome.tabs.update.mockImplementation((tabId, options, callback) => {
        mockChrome.runtime.lastError = { message: 'Tab not found' }
        callback()
      })

      await expect(tabSearchService.activateTab(999))
        .rejects.toThrow('Tab not found')
    })

    it('should handle window focus errors', async () => {
      mockChrome.windows.update.mockImplementation((windowId, options, callback) => {
        mockChrome.runtime.lastError = { message: 'Window not found' }
        callback()
      })

      await expect(tabSearchService.focusWindow(999))
        .rejects.toThrow('Window not found')
    })
  })

  describe('[TAB-SEARCH-CORE] findNextTab', () => {
    it('should find next tab in sequence', () => {
      const tabs = [
        { id: 1, title: 'Tab 1' },
        { id: 2, title: 'Tab 2' },
        { id: 3, title: 'Tab 3' }
      ]

      const nextTab = tabSearchService.findNextTab(tabs, 1)
      expect(nextTab.id).toBe(2)
    })

    it('should wrap around to first tab when no next tab found', () => {
      const tabs = [
        { id: 1, title: 'Tab 1' },
        { id: 2, title: 'Tab 2' },
        { id: 3, title: 'Tab 3' }
      ]

      const nextTab = tabSearchService.findNextTab(tabs, 3)
      expect(nextTab.id).toBe(1)
    })

    it('should return null for empty tab list', () => {
      const nextTab = tabSearchService.findNextTab([], 1)
      expect(nextTab).toBeNull()
    })

    it('should return first tab when restart ID is higher than all tabs', () => {
      const tabs = [
        { id: 1, title: 'Tab 1' },
        { id: 2, title: 'Tab 2' }
      ]

      const nextTab = tabSearchService.findNextTab(tabs, 5)
      expect(nextTab.id).toBe(1)
    })
  })
}) 