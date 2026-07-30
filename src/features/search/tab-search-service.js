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
export class TabSearchService {
  constructor () {
    this.lastSearchText = null
    this.lastMatchedTabId = null
    this.searchHistory = []
  }

  /**
   * [IMPL-TAB_SEARCH_SERVICE] [REQ-SEARCH_FUNCTIONALITY] Search tabs by title and navigate to next match.
   * @param {string} searchText - Search string to find in tab titles
   * @param {number} currentTabId - ID of the current active tab
   * @returns {Promise<Object>} Search results with navigation info
   */
  async searchAndNavigate (searchText, currentTabId) {
    try {
      console.log('[TAB-SEARCH-CORE] Starting search with:', { searchText, currentTabId })

      // [TAB-SEARCH-CORE] Normalize search text
      const normalizedSearch = searchText.toLowerCase().trim()
      console.log('[TAB-SEARCH-CORE] Normalized search:', normalizedSearch)

      // [TAB-SEARCH-CORE] Determine search continuation logic
      const isNewSearch = this.lastSearchText !== normalizedSearch
      const restartTabId = isNewSearch ? currentTabId : this.lastMatchedTabId || currentTabId
      console.log('[TAB-SEARCH-CORE] Search state:', { isNewSearch, restartTabId, lastSearchText: this.lastSearchText, lastMatchedTabId: this.lastMatchedTabId })

      // [TAB-SEARCH-CORE] Query all tabs
      console.log('[TAB-SEARCH-CORE] Querying all tabs...')
      const allTabs = await this.getAllTabs()
      console.log('[TAB-SEARCH-CORE] Found tabs:', allTabs.length)

      // [TAB-SEARCH-CORE] Filter tabs by title
      const matchingTabs = allTabs.filter(tab =>
        tab.title.toLowerCase().includes(normalizedSearch)
      )
      console.log('[TAB-SEARCH-CORE] Matching tabs:', matchingTabs.length, matchingTabs.map(t => ({ id: t.id, title: t.title })))

      // [TAB-SEARCH-CORE] Find next tab in sequence
      const nextTab = this.findNextTab(matchingTabs, restartTabId)
      console.log('[TAB-SEARCH-CORE] Next tab:', nextTab ? { id: nextTab.id, title: nextTab.title } : null)

      if (nextTab && nextTab.id !== restartTabId) {
        // [TAB-SEARCH-NAV] Navigate to the found tab
        console.log('[TAB-SEARCH-CORE] Activating tab:', nextTab.id)
        await this.activateTab(nextTab.id)

        console.log('[TAB-SEARCH-CORE] Focusing window:', nextTab.windowId)
        await this.focusWindow(nextTab.windowId)

        // [TAB-SEARCH-STATE] Update search state
        this.lastSearchText = normalizedSearch
        this.lastMatchedTabId = nextTab.id

        // [TAB-SEARCH-STATE] Add to search history
        this.addToSearchHistory(normalizedSearch)

        const result = {
          success: true,
          matchCount: matchingTabs.length,
          currentMatch: matchingTabs.findIndex(tab => tab.id === nextTab.id) + 1,
          tabId: nextTab.id,
          tabTitle: nextTab.title
        }
        console.log('[TAB-SEARCH-CORE] Search completed successfully:', result)
        return result
      } else {
        const result = {
          success: false,
          matchCount: matchingTabs.length,
          message: matchingTabs.length === 0 ? 'No matching tabs found' : 'Already on last match'
        }
        console.log('[TAB-SEARCH-CORE] Search completed with no navigation:', result)
        return result
      }
    } catch (error) {
      console.error('[TAB-SEARCH-CORE] Search error:', error)
      console.error('[TAB-SEARCH-CORE] Error stack:', error.stack)
      throw new Error(`Tab search failed: ${error.message}`)
    }
  }

  /**
   * [TAB-SEARCH-CORE] Get all browser tabs
   * @returns {Promise<Array>} Array of tab objects
   */
  async getAllTabs () {
    return new Promise((resolve, reject) => {
      console.log('[TAB-SEARCH-SERVICE] Querying all tabs')
      chrome.tabs.query({}, (tabs) => {
        if (chrome.runtime.lastError) {
          console.error('[TAB-SEARCH-SERVICE] Chrome API error:', chrome.runtime.lastError)
          reject(new Error(chrome.runtime.lastError.message))
        } else {
          console.log('[TAB-SEARCH-SERVICE] Found tabs:', tabs.length)
          resolve(tabs)
        }
      })
    })
  }

  /**
   * [IMPL-TAB_SEARCH_SERVICE] [REQ-SEARCH_FUNCTIONALITY] Find next tab in circular sequence.
   * @param {Array} matchingTabs - Array of matching tab objects
   * @param {number} restartTabId - Tab ID to start search from
   * @returns {Object|null} Next tab object or null
   */
  findNextTab (matchingTabs, restartTabId) {
    if (matchingTabs.length === 0) return null

    // [TAB-SEARCH-NAV] Find tab with ID greater than restart point
    const nextTab = matchingTabs.find(tab => tab.id > restartTabId)

    // [TAB-SEARCH-NAV] If no "next" tab found, wrap around to first
    return nextTab || matchingTabs[0]
  }

  /**
   * [TAB-SEARCH-NAV] Activate a specific tab
   * @param {number} tabId - Tab ID to activate
   */
  async activateTab (tabId) {
    return new Promise((resolve, reject) => {
      console.log('[TAB-SEARCH-SERVICE] Activating tab:', tabId)
      chrome.tabs.update(tabId, { active: true }, (tab) => {
        if (chrome.runtime.lastError) {
          console.error('[TAB-SEARCH-SERVICE] Tab activation error:', chrome.runtime.lastError)
          reject(new Error(chrome.runtime.lastError.message))
        } else {
          console.log('[TAB-SEARCH-SERVICE] Tab activated successfully:', tabId)
          resolve(tab)
        }
      })
    })
  }

  /**
   * [TAB-SEARCH-NAV] Focus the window containing the tab
   * @param {number} windowId - Window ID to focus
   */
  async focusWindow (windowId) {
    return new Promise((resolve, reject) => {
      console.log('[TAB-SEARCH-SERVICE] Focusing window:', windowId)
      chrome.windows.update(windowId, { focused: true }, (window) => {
        if (chrome.runtime.lastError) {
          console.error('[TAB-SEARCH-SERVICE] Window focus error:', chrome.runtime.lastError)
          reject(new Error(chrome.runtime.lastError.message))
        } else {
          console.log('[TAB-SEARCH-SERVICE] Window focused successfully:', windowId)
          resolve(window)
        }
      })
    })
  }

  /**
   * [IMPL-TAB_SEARCH_SERVICE] [REQ-SEARCH_FUNCTIONALITY] Add search term to history (move to front if duplicate).
   * @param {string} searchText - Search term to add
   */
  addToSearchHistory (searchText) {
    if (!searchText || searchText.trim().length === 0) return

    const trimmedText = searchText.trim()
    const currentHistory = this.searchHistory

    // Remove if already exists
    const filteredHistory = currentHistory.filter(term => term !== trimmedText)

    // Add to beginning and limit to 10 items
    this.searchHistory = [trimmedText, ...filteredHistory].slice(0, 10)
  }

  /**
   * [TAB-SEARCH-STATE] Get search history
   * @returns {Array} Array of recent search terms
   */
  getSearchHistory () {
    return [...this.searchHistory]
  }

  /**
   * [TAB-SEARCH-STATE] Clear search state
   */
  clearSearchState () {
    this.lastSearchText = null
    this.lastMatchedTabId = null
  }
}
