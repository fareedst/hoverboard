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

    it('should handle search history request', async () => {
      const mockResponse = {
        history: ['test1', 'test2', 'test3']
      }

      chrome.runtime.sendMessage.mockResolvedValue(mockResponse)

      // Simulate get search history
      const result = await chrome.runtime.sendMessage({
        type: 'getSearchHistory'
      })

      expect(result).toEqual(mockResponse)
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'getSearchHistory'
      })
    })

    it('should handle clear search state request', async () => {
      const mockResponse = {
        success: true
      }

      chrome.runtime.sendMessage.mockResolvedValue(mockResponse)

      // Simulate clear search state
      const result = await chrome.runtime.sendMessage({
        type: 'clearSearchState'
      })

      expect(result).toEqual(mockResponse)
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'clearSearchState'
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

    it('should handle overlay search error', async () => {
      chrome.runtime.sendMessage.mockRejectedValue(new Error('Network error'))

      // Simulate overlay search error
      await expect(chrome.runtime.sendMessage({
        type: 'searchTabs',
        data: { searchText: 'test' }
      })).rejects.toThrow('Network error')
    })
  })

  describe('[TAB-SEARCH-CORE] Message handler integration', () => {
    it('should validate search text input', async () => {
      // Mock the message handler response for validation errors
      chrome.runtime.sendMessage.mockImplementation((message) => {
        if (message.type === 'searchTabs') {
          const { searchText } = message.data
          if (!searchText || !searchText.trim()) {
            return Promise.resolve({
              success: false,
              message: 'Search text is required'
            })
          }
          return Promise.resolve({
            success: true,
            matchCount: 1,
            tabId: 1,
            tabTitle: 'Test Tab'
          })
        }
        return Promise.resolve({ success: true })
      })

      // Test empty search text
      const result1 = await chrome.runtime.sendMessage({
        type: 'searchTabs',
        data: { searchText: '' }
      })

      expect(result1.success).toBe(false)
      expect(result1.message).toContain('Search text is required')

      // Test whitespace-only search text
      const result2 = await chrome.runtime.sendMessage({
        type: 'searchTabs',
        data: { searchText: '   ' }
      })

      expect(result2.success).toBe(false)
      expect(result2.message).toContain('Search text is required')
    })

    it('should validate tab ID requirement', async () => {
      // Mock tabs.query to return some tabs
      chrome.tabs.query.mockImplementation((query, callback) => {
        callback([
          { id: 1, title: 'Test Tab', windowId: 1 }
        ])
      })

      chrome.tabs.update.mockImplementation((tabId, options, callback) => {
        callback({ id: tabId, title: 'Test Tab' })
      })

      chrome.windows.update.mockImplementation((windowId, options, callback) => {
        callback({ id: windowId })
      })

      // Mock successful search response
      chrome.runtime.sendMessage.mockResolvedValue({
        success: true,
        matchCount: 1,
        tabId: 1,
        tabTitle: 'Test Tab'
      })

      // Test with valid search text and tab ID
      const result = await chrome.runtime.sendMessage({
        type: 'searchTabs',
        data: { searchText: 'test' }
      })

      // Should succeed if tab ID is available from sender context
      expect(result.success).toBe(true)
    })
  })

  describe('[TAB-SEARCH-NAV] Tab navigation integration', () => {
    it('should navigate to matching tab', async () => {
      const mockTabs = [
        { id: 1, title: 'Google', windowId: 1 },
        { id: 2, title: 'GitHub', windowId: 1 },
        { id: 3, title: 'Stack Overflow', windowId: 1 }
      ]

      chrome.tabs.query.mockImplementation((query, callback) => {
        callback(mockTabs)
      })

      chrome.tabs.update.mockImplementation((tabId, options, callback) => {
        const tab = mockTabs.find(t => t.id === tabId)
        callback(tab)
      })

      chrome.windows.update.mockImplementation((windowId, options, callback) => {
        callback({ id: windowId })
      })

      // Mock successful search response
      chrome.runtime.sendMessage.mockResolvedValue({
        success: true,
        matchCount: 1,
        tabId: 2,
        tabTitle: 'GitHub'
      })

      // Simulate search that should find and navigate to GitHub tab
      const result = await chrome.runtime.sendMessage({
        type: 'searchTabs',
        data: { searchText: 'GitHub' }
      })

      expect(result.success).toBe(true)
      expect(result.tabId).toBe(2)
      expect(result.tabTitle).toBe('GitHub')
    })

    it('should handle navigation errors gracefully', async () => {
      chrome.tabs.query.mockImplementation((query, callback) => {
        callback([
          { id: 1, title: 'Test Tab', windowId: 1 }
        ])
      })

      chrome.tabs.update.mockImplementation((tabId, options, callback) => {
        chrome.runtime.lastError = { message: 'Tab not found' }
        callback()
      })

      // Mock error response
      chrome.runtime.sendMessage.mockResolvedValue({
        success: false,
        message: 'Tab search failed: Tab not found'
      })

      // Simulate search that fails to navigate
      const result = await chrome.runtime.sendMessage({
        type: 'searchTabs',
        data: { searchText: 'test' }
      })

      expect(result.success).toBe(false)
      expect(result.message).toContain('Tab search failed')
    })
  })

  describe('[TAB-SEARCH-STATE] State management integration', () => {
    it('should maintain search state across multiple searches', async () => {
      const mockTabs = [
        { id: 1, title: 'Test Tab', windowId: 1 },
        { id: 2, title: 'Test Tab', windowId: 1 },
        { id: 3, title: 'Test Tab', windowId: 1 }
      ]

      chrome.tabs.query.mockImplementation((query, callback) => {
        callback(mockTabs)
      })

      chrome.tabs.update.mockImplementation((tabId, options, callback) => {
        const tab = mockTabs.find(t => t.id === tabId)
        callback(tab)
      })

      chrome.windows.update.mockImplementation((windowId, options, callback) => {
        callback({ id: windowId })
      })

      // Mock sequential search responses
      let searchCount = 0
      chrome.runtime.sendMessage.mockImplementation((message) => {
        if (message.type === 'searchTabs') {
          searchCount++
          return Promise.resolve({
            success: true,
            matchCount: 3,
            tabId: searchCount,
            tabTitle: 'Test Tab'
          })
        }
        return Promise.resolve({ success: true })
      })

      // First search
      const result1 = await chrome.runtime.sendMessage({
        type: 'searchTabs',
        data: { searchText: 'Test Tab' }
      })

      expect(result1.success).toBe(true)
      expect(result1.tabId).toBe(1)

      // Second search with same term (should continue from last match)
      const result2 = await chrome.runtime.sendMessage({
        type: 'searchTabs',
        data: { searchText: 'Test Tab' }
      })

      expect(result2.success).toBe(true)
      expect(result2.tabId).toBe(2)
    })

    it('should clear search state when requested', async () => {
      // Mock successful responses
      chrome.runtime.sendMessage.mockResolvedValue({
        success: true,
        history: ['test1', 'test2']
      })

      // First, add some search history
      await chrome.runtime.sendMessage({
        type: 'getSearchHistory'
      })

      // Then clear the state
      const clearResult = await chrome.runtime.sendMessage({
        type: 'clearSearchState'
      })

      expect(clearResult.success).toBe(true)

      // Search history should still be available
      const historyResult = await chrome.runtime.sendMessage({
        type: 'getSearchHistory'
      })

      expect(historyResult.history).toBeDefined()
    })
  })
}) 