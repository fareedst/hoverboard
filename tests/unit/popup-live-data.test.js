/**
 * Popup Live Data Tests
 * [POPUP-LIVE-DATA-001] Test popup live data functionality
 */

import { PopupController } from '../../src/ui/popup/PopupController.js'
import { UIManager } from '../../src/ui/popup/UIManager.js'
import { StateManager } from '../../src/ui/popup/StateManager.js'
import { ErrorHandler } from '../../src/shared/ErrorHandler.js'
import { debugLog, debugError } from '../../src/shared/utils.js'

// Mock the utils module before importing PopupController
jest.mock('../../src/shared/utils.js', () => ({
  debugLog: jest.fn(),
  debugError: jest.fn(),
  browser: {
    runtime: {
      lastError: null
    }
  }
}))

// Mock chrome API
global.chrome = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn()
    },
    getManifest: jest.fn(() => ({ version: '1.0.0' }))
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn()
  },
  scripting: {
    executeScript: jest.fn(),
    insertCSS: jest.fn()
  }
}

describe('[POPUP-LIVE-DATA-001] Popup Live Data Tests', () => {
  let popupController
  let uiManager
  let stateManager
  let errorHandler

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()
    
    // Create test instances
    errorHandler = new ErrorHandler()
    stateManager = new StateManager()
    uiManager = new UIManager({
      errorHandler,
      stateManager,
      config: {}
    })
    
    popupController = new PopupController({
      errorHandler,
      stateManager,
      uiManager
    })
  })

  describe('[POPUP-DATA-FLOW-001] Data Flow Validation', () => {
    test('should extract bookmark data correctly from service worker response', async () => {
      const mockResponse = {
        success: true,
        data: {
          url: 'https://example.com',
          description: 'Test Bookmark',
          tags: ['test', 'example'],
          shared: 'yes',
          toread: 'no'
        }
      }
      
      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        callback(mockResponse)
      })
      
      chrome.tabs.query.mockImplementation((query, callback) => {
        callback([{ id: 1, url: 'https://example.com', title: 'Test Page' }])
      })
      
      const result = await popupController.getBookmarkData('https://example.com')
      
      expect(result).toEqual(mockResponse.data)
      expect(result.url).toBe('https://example.com')
      expect(result.tags).toEqual(['test', 'example'])
    })

    test('should return bookmark with tags when needsAuth is true (bookmark from local/file/sync)', async () => {
      const mockBookmarkWithTags = {
        url: 'https://example.com',
        description: 'Local bookmark',
        tags: ['saved-tag'],
        shared: 'yes',
        toread: 'no',
        needsAuth: true
      }
      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        callback({ success: true, data: mockBookmarkWithTags })
      })
      const result = await popupController.getBookmarkData('https://example.com')
      expect(result).not.toBeNull()
      expect(result.tags).toEqual(['saved-tag'])
      expect(result.needsAuth).toBe(true)
    })

    // [IMPL-URL_TAGS_DISPLAY] getBookmarkData only resolves null when blocked
    test('should return null when response.data.blocked is true [REQ-URL_TAGS_DISPLAY]', async () => {
      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        callback({ success: true, data: { blocked: true, url: 'https://example.com' } })
      })
      const result = await popupController.getBookmarkData('https://example.com')
      expect(result).toBeNull()
    })

    test('should validate bookmark data structure correctly', () => {
      const validBookmark = {
        url: 'https://example.com',
        description: 'Test Bookmark',
        tags: ['test', 'example'],
        shared: 'yes',
        toread: 'no'
      }
      // [IMPL-URL_TAGS_DISPLAY] Missing tags is normalized to [] and accepted
      const bookmarkWithMissingTags = {
        url: 'https://example.com',
        shared: 'yes'
      }
      const bookmarkWithStringTags = {
        url: 'https://example.com',
        tags: 'a b c',
        shared: 'yes'
      }

      expect(popupController.validateBookmarkData(validBookmark)).toBe(true)
      expect(popupController.validateBookmarkData(bookmarkWithMissingTags)).toBe(true)
      expect(bookmarkWithMissingTags.tags).toEqual([])
      expect(popupController.validateBookmarkData(bookmarkWithStringTags)).toBe(true)
      expect(bookmarkWithStringTags.tags).toEqual(['a', 'b', 'c'])
      expect(popupController.validateBookmarkData(null)).toBe(false)
      expect(popupController.validateBookmarkData(undefined)).toBe(false)
    })

    test('should load initial data with live bookmark information', async () => {
      const mockBookmark = {
        url: 'https://example.com',
        description: 'Test Bookmark',
        tags: ['test', 'live'],
        shared: 'no',
        toread: 'yes'
      }
      
      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        callback({ success: true, data: mockBookmark })
      })
      
      chrome.tabs.query.mockImplementation((query, callback) => {
        callback([{ id: 1, url: 'https://example.com', title: 'Test Page' }])
      })
      
      await popupController.loadInitialData()
      
      expect(popupController.currentPin).toEqual(mockBookmark)
      expect(popupController.isInitialized).toBe(true)
    })
  })

  describe('[POPUP-REFRESH-001] Refresh Mechanism', () => {
    test('should perform manual refresh successfully', async () => {
      const mockBookmark = {
        url: 'https://example.com',
        description: 'Updated Bookmark',
        tags: ['updated', 'refresh'],
        shared: 'yes',
        toread: 'no'
      }
      
      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        callback({ success: true, data: mockBookmark })
      })
      
      chrome.tabs.query.mockImplementation((query, callback) => {
        callback([{ id: 1, url: 'https://example.com', title: 'Test Page' }])
      })
      
      // Mock UI manager methods
      uiManager.showSuccess = jest.fn()
      uiManager.showError = jest.fn()
      
      await popupController.refreshPopupData()
      
      expect(popupController.currentPin).toEqual(mockBookmark)
      expect(uiManager.showSuccess).toHaveBeenCalledWith('Data refreshed successfully')
    })

    test('should throw error when getBookmarkData fails', async () => {
      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        callback({ success: false, error: 'API Error' })
      })
      
      chrome.tabs.query.mockImplementation((query, callback) => {
        callback([{ id: 1, url: 'https://example.com', title: 'Test Page' }])
      })
      
      // Test that getBookmarkData throws an error
      await expect(popupController.getBookmarkData('https://example.com')).rejects.toThrow('API Error')
    })

    test('should handle refresh errors gracefully', async () => {
      console.log('🔍 [TEST-DEBUG] Test starting')
      
      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        console.log('🔍 [TEST-DEBUG] Mock sendMessage called with:', message)
        callback({ success: false, error: 'API Error' })
      })
      
      chrome.tabs.query.mockImplementation((query, callback) => {
        callback([{ id: 1, url: 'https://example.com', title: 'Test Page' }])
      })
      
      // Mock UI manager methods
      uiManager.showError = jest.fn()
      
      console.log('🔍 [TEST-DEBUG] Before calling refreshPopupData')
      await popupController.refreshPopupData()
      console.log('🔍 [TEST-DEBUG] After calling refreshPopupData')
      console.log('🔍 [TEST-DEBUG] showError calls:', uiManager.showError.mock.calls)
      
      expect(uiManager.showError).toHaveBeenCalledWith('Failed to refresh data')
    })
  })

  describe('[POPUP-SYNC-001] Cross-Component Synchronization', () => {
    test('should validate badge synchronization correctly', async () => {
      const mockBookmark = {
        url: 'https://example.com',
        description: 'Test Bookmark',
        tags: ['test', 'sync'],
        shared: 'yes',
        toread: 'no'
      }
      
      popupController.currentPin = mockBookmark
      popupController.currentTab = { url: 'https://example.com' }
      
      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        callback({ success: true, data: mockBookmark })
      })
      
      chrome.tabs.query.mockImplementation((query, callback) => {
        callback([{ id: 1, url: 'https://example.com', title: 'Test Page' }])
      })
      
      const result = await popupController.validateBadgeSynchronization()
      
      expect(result.synchronized).toBe(true)
      expect(result.popupData).toEqual(mockBookmark)
      expect(result.badgeData).toEqual(mockBookmark)
    })

    test('should detect synchronization mismatches', async () => {
      const popupBookmark = {
        url: 'https://example.com',
        description: 'Test Bookmark',
        tags: ['test', 'popup'],
        shared: 'yes',
        toread: 'no'
      }
      
      const badgeBookmark = {
        url: 'https://example.com',
        description: 'Test Bookmark',
        tags: ['test', 'badge'], // Different tags
        shared: 'yes',
        toread: 'no'
      }
      
      popupController.currentPin = popupBookmark
      popupController.currentTab = { url: 'https://example.com' }
      
      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        callback({ success: true, data: badgeBookmark })
      })
      
      chrome.tabs.query.mockImplementation((query, callback) => {
        callback([{ id: 1, url: 'https://example.com', title: 'Test Page' }])
      })
      
      const result = await popupController.validateBadgeSynchronization()
      
      expect(result.synchronized).toBe(false)
      expect(result.popupData).toEqual(popupBookmark)
      expect(result.badgeData).toEqual(badgeBookmark)
    })
  })

  describe('[POPUP-DEBUG-001] Debug Logging', () => {
    test('should log comprehensive debug information', async () => {
      const mockBookmark = {
        url: 'https://example.com',
        description: 'Test Bookmark',
        tags: ['test', 'debug'],
        shared: 'no',
        toread: 'yes'
      }
      
      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        callback({ success: true, data: mockBookmark })
      })
      
      chrome.tabs.query.mockImplementation((query, callback) => {
        callback([{ id: 1, url: 'https://example.com', title: 'Test Page' }])
      })
      
      await popupController.loadInitialData()
      
      // Verify debug logs were called
      expect(debugLog).toHaveBeenCalledWith(
        '[POPUP-DATA-FLOW-001] loadInitialData: start'
      )
      expect(debugLog).toHaveBeenCalledWith(
        '[POPUP-DATA-FLOW-001] loadInitialData: calling getBookmarkData',
        'https://example.com'
      )
      expect(debugLog).toHaveBeenCalledWith(
        '[POPUP-DATA-FLOW-001] loadInitialData: got currentPin',
        mockBookmark
      )
    })
  })
}) 