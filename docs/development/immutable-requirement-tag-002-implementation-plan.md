# IMMUTABLE-REQ-TAG-002: Implementation Plan

## Overview
This document outlines the detailed implementation plan for the tab search feature, including code changes, tests, and architectural decisions specific to the Chrome extension platform.

## Phase 1: Core TabSearchService Implementation

### 1.1 Create TabSearchService
**File**: `src/features/search/tab-search-service.js`

```javascript
/**
 * [IMMUTABLE-REQ-TAG-002] TabSearchService - Core tab search functionality
 * Handles tab discovery, filtering, and navigation logic
 */

export class TabSearchService {
  constructor() {
    this.lastSearchText = null
    this.lastMatchedTabId = null
    this.searchHistory = []
  }

  /**
   * [TAB-SEARCH-CORE] Search tabs by title and navigate to next match
   * @param {string} searchText - Search string to find in tab titles
   * @param {number} currentTabId - ID of the current active tab
   * @returns {Promise<Object>} Search results with navigation info
   */
  async searchAndNavigate(searchText, currentTabId) {
    try {
      // [TAB-SEARCH-CORE] Normalize search text
      const normalizedSearch = searchText.toLowerCase().trim()
      
      // [TAB-SEARCH-CORE] Determine search continuation logic
      const isNewSearch = this.lastSearchText !== normalizedSearch
      const restartTabId = isNewSearch ? currentTabId : this.lastMatchedTabId || currentTabId
      
      // [TAB-SEARCH-CORE] Query all tabs
      const allTabs = await this.getAllTabs()
      
      // [TAB-SEARCH-CORE] Filter tabs by title
      const matchingTabs = allTabs.filter(tab => 
        tab.title.toLowerCase().includes(normalizedSearch)
      )
      
      // [TAB-SEARCH-CORE] Find next tab in sequence
      const nextTab = this.findNextTab(matchingTabs, restartTabId)
      
      if (nextTab && nextTab.id !== restartTabId) {
        // [TAB-SEARCH-NAV] Navigate to the found tab
        await this.activateTab(nextTab.id)
        await this.focusWindow(nextTab.windowId)
        
        // [TAB-SEARCH-STATE] Update search state
        this.lastSearchText = normalizedSearch
        this.lastMatchedTabId = nextTab.id
        
        // [TAB-SEARCH-STATE] Add to search history
        this.addToSearchHistory(normalizedSearch)
        
        return {
          success: true,
          matchCount: matchingTabs.length,
          currentMatch: matchingTabs.findIndex(tab => tab.id === nextTab.id) + 1,
          tabId: nextTab.id,
          tabTitle: nextTab.title
        }
      } else {
        return {
          success: false,
          matchCount: matchingTabs.length,
          message: matchingTabs.length === 0 ? 'No matching tabs found' : 'Already on last match'
        }
      }
    } catch (error) {
      console.error('[TAB-SEARCH-CORE] Search error:', error)
      throw new Error(`Tab search failed: ${error.message}`)
    }
  }

  /**
   * [TAB-SEARCH-CORE] Get all browser tabs
   * @returns {Promise<Array>} Array of tab objects
   */
  async getAllTabs() {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({}, (tabs) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
        } else {
          resolve(tabs)
        }
      })
    })
  }

  /**
   * [TAB-SEARCH-NAV] Find next tab in circular sequence
   * @param {Array} matchingTabs - Array of matching tab objects
   * @param {number} restartTabId - Tab ID to start search from
   * @returns {Object|null} Next tab object or null
   */
  findNextTab(matchingTabs, restartTabId) {
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
  async activateTab(tabId) {
    return new Promise((resolve, reject) => {
      chrome.tabs.update(tabId, { active: true }, (tab) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
        } else {
          resolve(tab)
        }
      })
    })
  }

  /**
   * [TAB-SEARCH-NAV] Focus the window containing the tab
   * @param {number} windowId - Window ID to focus
   */
  async focusWindow(windowId) {
    return new Promise((resolve, reject) => {
      chrome.windows.update(windowId, { focused: true }, (window) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
        } else {
          resolve(window)
        }
      })
    })
  }

  /**
   * [TAB-SEARCH-STATE] Add search term to history
   * @param {string} searchText - Search term to add
   */
  addToSearchHistory(searchText) {
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
  getSearchHistory() {
    return [...this.searchHistory]
  }

  /**
   * [TAB-SEARCH-STATE] Clear search state
   */
  clearSearchState() {
    this.lastSearchText = null
    this.lastMatchedTabId = null
  }
}
```

### 1.2 Add Message Types
**File**: `src/core/message-handler.js`

```javascript
// [IMMUTABLE-REQ-TAG-002] Add new message types for tab search
export const MESSAGE_TYPES = {
  // ... existing types ...
  
  // Tab search operations
  SEARCH_TABS: 'searchTabs',
  GET_SEARCH_HISTORY: 'getSearchHistory',
  CLEAR_SEARCH_STATE: 'clearSearchState'
}
```

### 1.3 Extend Message Handler
**File**: `src/core/message-handler.js`

```javascript
// [IMMUTABLE-REQ-TAG-002] Import TabSearchService
import { TabSearchService } from '../features/search/tab-search-service.js'

export class MessageHandler {
  constructor(pinboardService = null, tagService = null) {
    // ... existing initialization ...
    
    // [IMMUTABLE-REQ-TAG-002] Initialize tab search service
    this.tabSearchService = new TabSearchService()
  }

  async processMessage(message, sender) {
    const { type, data } = message
    const tabId = sender.tab?.id

    switch (type) {
      // ... existing cases ...
      
      // [IMMUTABLE-REQ-TAG-002] Handle tab search messages
      case MESSAGE_TYPES.SEARCH_TABS:
        return this.handleSearchTabs(data, tabId)
        
      case MESSAGE_TYPES.GET_SEARCH_HISTORY:
        return this.handleGetSearchHistory()
        
      case MESSAGE_TYPES.CLEAR_SEARCH_STATE:
        return this.handleClearSearchState()
        
      default:
        throw new Error(`Unknown message type: ${type}`)
    }
  }

  /**
   * [TAB-SEARCH-CORE] Handle tab search request
   */
  async handleSearchTabs(data, tabId) {
    try {
      const { searchText } = data
      
      if (!searchText || !searchText.trim()) {
        throw new Error('Search text is required')
      }
      
      if (!tabId) {
        throw new Error('Current tab ID is required')
      }
      
      const result = await this.tabSearchService.searchAndNavigate(searchText, tabId)
      return result
    } catch (error) {
      console.error('[TAB-SEARCH-CORE] Search tabs error:', error)
      throw error
    }
  }

  /**
   * [TAB-SEARCH-STATE] Handle get search history request
   */
  async handleGetSearchHistory() {
    try {
      const history = this.tabSearchService.getSearchHistory()
      return { history }
    } catch (error) {
      console.error('[TAB-SEARCH-STATE] Get search history error:', error)
      throw error
    }
  }

  /**
   * [TAB-SEARCH-STATE] Handle clear search state request
   */
  async handleClearSearchState() {
    try {
      this.tabSearchService.clearSearchState()
      return { success: true }
    } catch (error) {
      console.error('[TAB-SEARCH-STATE] Clear search state error:', error)
      throw error
    }
  }
}
```

## Phase 2: Popup Integration

### 2.1 Update Popup HTML
**File**: `src/ui/popup/popup.html`

```html
<!-- [IMMUTABLE-REQ-TAG-002] Update search section for tab search -->
<section class="search-section">
  <h3 class="section-title">Search</h3>
  <div class="search-container">
    <div class="input-group">
      <input 
        type="text" 
        id="tabSearchInput" 
        class="search-input" 
        placeholder="Search tabs by title..."
        aria-label="Search tabs by title">
      <button id="tabSearchBtn" class="button secondary">Search Tabs</button>
    </div>
    <div class="search-results" id="tabSearchResults">
      <!-- Search results will be populated here -->
    </div>
    <div class="search-history" id="tabSearchHistory">
      <!-- Search history will be populated here -->
    </div>
  </div>
</section>
```

### 2.2 Update PopupController
**File**: `src/ui/popup/PopupController.js`

```javascript
// [IMMUTABLE-REQ-TAG-002] Add tab search methods to PopupController

export class PopupController {
  // ... existing methods ...

  /**
   * [TAB-SEARCH-UI] Handle tab search action
   */
  async handleTabSearch(searchText) {
    if (!searchText || !searchText.trim()) {
      this.errorHandler.handleError('Please enter a search term')
      return
    }

    try {
      this.setLoading(true)

      const response = await this.sendMessage({
        type: 'searchTabs',
        data: { searchText: searchText.trim() }
      })

      if (response.success) {
        this.uiManager.showTabSearchResults(response)
        this.uiManager.showSuccess(`Found ${response.matchCount} matching tabs`)
      } else {
        this.uiManager.showError(response.message || 'No matching tabs found')
      }
    } catch (error) {
      this.errorHandler.handleError('Failed to search tabs', error)
    } finally {
      this.setLoading(false)
    }
  }

  /**
   * [TAB-SEARCH-UI] Load search history
   */
  async loadSearchHistory() {
    try {
      const response = await this.sendMessage({
        type: 'getSearchHistory'
      })

      if (response && response.history) {
        this.uiManager.updateSearchHistory(response.history)
      }
    } catch (error) {
      console.error('[TAB-SEARCH-UI] Failed to load search history:', error)
    }
  }
}
```

### 2.3 Update UIManager
**File**: `src/ui/popup/UIManager.js`

```javascript
// [IMMUTABLE-REQ-TAG-002] Add tab search UI methods to UIManager

export class UIManager {
  // ... existing methods ...

  /**
   * [TAB-SEARCH-UI] Show tab search results
   */
  showTabSearchResults(results) {
    const resultsContainer = this.elements.tabSearchResults
    if (!resultsContainer) return

    if (results.success) {
      resultsContainer.innerHTML = `
        <div class="search-result">
          <span class="result-count">${results.currentMatch} of ${results.matchCount}</span>
          <span class="result-title">${results.tabTitle}</span>
        </div>
      `
      resultsContainer.classList.remove('hidden')
    } else {
      resultsContainer.innerHTML = `
        <div class="search-result no-matches">
          <span class="result-message">${results.message}</span>
        </div>
      `
      resultsContainer.classList.remove('hidden')
    }
  }

  /**
   * [TAB-SEARCH-UI] Update search history display
   */
  updateSearchHistory(history) {
    const historyContainer = this.elements.tabSearchHistory
    if (!historyContainer || !history.length) return

    const historyHTML = history.map(term => `
      <button class="history-item" data-term="${term}">
        ${term}
      </button>
    `).join('')

    historyContainer.innerHTML = historyHTML
    historyContainer.classList.remove('hidden')
  }

  /**
   * [TAB-SEARCH-UI] Focus tab search input
   */
  focusTabSearchInput() {
    this.elements.tabSearchInput?.focus()
  }
}
```

## Phase 3: Overlay Integration

### 3.1 Update OverlayManager
**File**: `src/features/content/overlay-manager.js`

```javascript
// [IMMUTABLE-REQ-TAG-002] Add tab search to overlay

class OverlayManager {
  // ... existing methods ...

  /**
   * [TAB-SEARCH-UI] Add tab search section to overlay
   */
  addTabSearchSection(mainContainer) {
    const searchContainer = this.document.createElement('div')
    searchContainer.className = 'tab-search-container'
    searchContainer.style.cssText = `
      margin-bottom: 8px;
      padding: 4px;
      border-radius: 4px;
    `

    const searchLabel = this.document.createElement('span')
    searchLabel.className = 'label-primary tiny'
    searchLabel.textContent = 'Search Tabs:'
    searchLabel.style.cssText = 'padding: 0.2em 0.5em; margin-right: 4px;'
    searchContainer.appendChild(searchLabel)

    const searchInput = this.document.createElement('input')
    searchInput.className = 'tab-search-input'
    searchInput.placeholder = 'Enter tab title...'
    searchInput.style.cssText = `
      margin: 2px;
      padding: 2px 4px;
      font-size: 12px;
      width: 120px;
    `
    
    // [TAB-SEARCH-UI] Add search input event handlers
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const searchText = searchInput.value.trim()
        if (searchText) {
          this.handleTabSearch(searchText)
        }
      }
    })

    searchContainer.appendChild(searchInput)
    mainContainer.appendChild(searchContainer)
  }

  /**
   * [TAB-SEARCH-UI] Handle tab search from overlay
   */
  async handleTabSearch(searchText) {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'searchTabs',
        data: { searchText }
      })

      if (response.success) {
        this.showMessage(`Found ${response.matchCount} tabs - navigating to "${response.tabTitle}"`, 'success')
      } else {
        this.showMessage(response.message || 'No matching tabs found', 'error')
      }
    } catch (error) {
      console.error('[TAB-SEARCH-UI] Tab search error:', error)
      this.showMessage('Failed to search tabs', 'error')
    }
  }
}
```

## Phase 4: Testing Implementation

### 4.1 Unit Tests
**File**: `tests/unit/tab-search-service.test.js`

```javascript
/**
 * [IMMUTABLE-REQ-TAG-002] Unit tests for TabSearchService
 */

import { TabSearchService } from '../../src/features/search/tab-search-service.js'

describe('TabSearchService', () => {
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

      // First search
      const result1 = await tabSearchService.searchAndNavigate('Test Tab 1', 1)
      expect(result1.tabId).toBe(1)

      // Second search (should wrap around)
      const result2 = await tabSearchService.searchAndNavigate('Test Tab 1', 1)
      expect(result2.tabId).toBe(3)
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
  })
})
```

### 4.2 Integration Tests
**File**: `tests/integration/tab-search-integration.test.js`

```javascript
/**
 * [IMMUTABLE-REQ-TAG-002] Integration tests for tab search
 */

describe('Tab Search Integration', () => {
  beforeEach(() => {
    // Setup mock chrome APIs
    global.chrome = {
      tabs: {
        query: jest.fn(),
        update: jest.fn(),
        getCurrent: jest.fn()
      },
      windows: {
        update: jest.fn()
      },
      runtime: {
        sendMessage: jest.fn(),
        lastError: null
      }
    }
  })

  afterEach(() => {
    delete global.chrome
  })

  describe('[TAB-SEARCH-UI] Popup integration', () => {
    it('should handle search from popup', async () => {
      const mockResponse = {
        success: true,
        matchCount: 2,
        currentMatch: 1,
        tabId: 123,
        tabTitle: 'Test Tab'
      }

      chrome.runtime.sendMessage.mockResolvedValue(mockResponse)

      // Simulate popup search
      const result = await chrome.runtime.sendMessage({
        type: 'searchTabs',
        data: { searchText: 'test' }
      })

      expect(result).toEqual(mockResponse)
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'searchTabs',
        data: { searchText: 'test' }
      })
    })
  })

  describe('[TAB-SEARCH-UI] Overlay integration', () => {
    it('should handle search from overlay', async () => {
      const mockResponse = {
        success: true,
        matchCount: 1,
        currentMatch: 1,
        tabId: 456,
        tabTitle: 'Overlay Test'
      }

      chrome.runtime.sendMessage.mockResolvedValue(mockResponse)

      // Simulate overlay search
      const result = await chrome.runtime.sendMessage({
        type: 'searchTabs',
        data: { searchText: 'overlay' }
      })

      expect(result).toEqual(mockResponse)
    })
  })
})
```

## Phase 5: CSS Styling

### 5.1 Add Tab Search Styles
**File**: `src/ui/popup/popup.css`

```css
/* [IMMUTABLE-REQ-TAG-002] Tab search styles */

.tab-search-container {
  margin-bottom: 12px;
  padding: 8px;
  background: var(--bg-secondary);
  border-radius: var(--radius-medium);
  border: 1px solid var(--border-color);
}

.tab-search-input {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-small);
  font-size: var(--font-size-sm);
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: border-color 0.2s ease;
}

.tab-search-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(var(--primary-color-rgb), 0.2);
}

.search-results {
  margin-top: 8px;
  padding: 6px 8px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-small);
  font-size: var(--font-size-sm);
}

.search-result {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.result-count {
  font-weight: 600;
  color: var(--primary-color);
}

.result-title {
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search-history {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.history-item {
  padding: 2px 6px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-small);
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.history-item:hover {
  background: var(--bg-hover);
  border-color: var(--primary-color);
  color: var(--text-primary);
}
```

## Implementation Timeline

1. **Week 1**: Core TabSearchService implementation and unit tests
2. **Week 2**: Message handler integration and popup UI
3. **Week 3**: Overlay integration and styling
4. **Week 4**: Integration testing and bug fixes
5. **Week 5**: Performance optimization and documentation

## Success Metrics

- [ ] Tab search works from both popup and overlay
- [ ] Circular navigation functions correctly
- [ ] Search history is maintained and accessible
- [ ] Error states are handled gracefully
- [ ] All unit and integration tests pass
- [ ] Performance impact is minimal (< 100ms search time)
- [ ] Accessibility requirements are met 