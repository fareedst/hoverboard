/**
 * [IMPL-TAB_SEARCH_SERVICE] [REQ-SEARCH_FUNCTIONALITY]
 * Tab search by title; searchAndNavigate, findNextTab (circular), addToSearchHistory.
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
