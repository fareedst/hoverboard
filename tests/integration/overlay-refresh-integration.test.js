/**
 * [OVERLAY-REFRESH-TEST-001] Overlay Refresh Button Integration Tests
 * 
 * Integration tests for the overlay refresh button functionality
 * Tests end-to-end functionality with message service integration
 */

import { OverlayManager } from '../../src/features/content/overlay-manager.js'
import { MessageClient } from '../../src/features/content/message-client.js'

// [OVERLAY-REFRESH-TEST-001] Mock utilities for integration testing
const createMockDocument = () => {
  const elements = new Map()
  
  return {
    createElement: jest.fn((tag) => {
      const element = {
        tagName: tag.toUpperCase(),
        className: '',
        innerHTML: '',
        style: { cssText: '' },
        setAttribute: jest.fn(),
        getAttribute: jest.fn(),
        addEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
        onclick: null,
        querySelector: jest.fn((selector) => {
          if (selector === '.refresh-button') {
            return elements.get('button') || null
          }
          return null
        }),
        querySelectorAll: jest.fn(() => []),
        appendChild: jest.fn(),
        contains: jest.fn(() => true),
        classList: {
          add: jest.fn(),
          remove: jest.fn(),
          contains: jest.fn()
        },
        disabled: false
      }
      elements.set(tag, element)
      return element
    }),
    querySelector: jest.fn((selector) => {
      if (selector === '.refresh-button') {
        return elements.get('button') || null
      }
      return null
    }),
    querySelectorAll: jest.fn(() => []),
    body: {
      appendChild: jest.fn(),
      removeChild: jest.fn()
    },
    getElementById: jest.fn(() => null)
  }
}

const createMockBookmarkContent = () => {
  return {
    bookmark: {
      url: 'https://example.com',
      description: 'Test Bookmark',
      tags: ['test', 'example'],
      shared: 'yes',
      toread: 'no'
    },
    pageTitle: 'Test Page',
    pageUrl: 'https://example.com'
  }
}

const createMockUpdatedBookmarkContent = () => {
  return {
    bookmark: {
      url: 'https://example.com',
      description: 'Updated Test Bookmark',
      tags: ['test', 'example', 'updated'],
      shared: 'no',
      toread: 'yes'
    },
    pageTitle: 'Updated Test Page',
    pageUrl: 'https://example.com'
  }
}

// [OVERLAY-REFRESH-TEST-001] Integration test suite for overlay refresh button
describe('[OVERLAY-REFRESH-001] Integration Tests', () => {
  let overlayManager
  let messageService
  let mockDocument

  beforeEach(() => {
    // [OVERLAY-REFRESH-TEST-001] Setup integration test environment
    mockDocument = createMockDocument()
    messageService = new MessageClient()
    overlayManager = new OverlayManager(mockDocument, {})
    overlayManager.messageService = messageService
    overlayManager.showMessage = jest.fn()
    overlayManager.show = jest.fn()
    
    // Mock window.location for testing
    Object.defineProperty(window, 'location', {
      value: {
        href: 'https://example.com'
      },
      writable: true
    })
    
    // Mock document.title
    Object.defineProperty(document, 'title', {
      value: 'Test Page',
      writable: true
    })
  })

  afterEach(() => {
    // [OVERLAY-REFRESH-TEST-001] Cleanup integration test environment
    jest.clearAllMocks()
  })

  // [OVERLAY-REFRESH-TEST-001] Message service integration tests
  describe('Message Service Integration', () => {
    test('[OVERLAY-REFRESH-INTEGRATION-001] Should communicate with background script', async () => {
      // Arrange
      const mockBookmarkData = createMockUpdatedBookmarkContent().bookmark
      const mockResponse = {
        success: true,
        data: mockBookmarkData
      }
      
      // Mock the message service
      jest.spyOn(messageService, 'sendMessage').mockResolvedValue(mockResponse)
      
      // Act
      const result = await overlayManager.refreshOverlayContent()
      
      // Assert
      expect(messageService.sendMessage).toHaveBeenCalledWith({
        type: 'getCurrentBookmark',
        data: {
          url: 'https://example.com',
          title: 'Test Page',
          tabId: null
        }
      })
      
      expect(result).toEqual({
        bookmark: mockBookmarkData,
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      })
    })

    test('[OVERLAY-REFRESH-INTEGRATION-001] Should handle background script errors', async () => {
      // Arrange
      jest.spyOn(messageService, 'sendMessage').mockRejectedValue(new Error('Background script error'))
      
      // Act
      const result = await overlayManager.refreshOverlayContent()
      
      // Assert
      expect(result).toBeNull()
    })

    test('[OVERLAY-REFRESH-INTEGRATION-001] Should handle invalid response structure', async () => {
      // Arrange
      const mockResponse = {
        success: false,
        data: null
      }
      
      jest.spyOn(messageService, 'sendMessage').mockResolvedValue(mockResponse)
      
      // Act
      const result = await overlayManager.refreshOverlayContent()
      
      // Assert
      expect(result).toBeNull()
    })
  })

  // [OVERLAY-REFRESH-TEST-001] Data flow integration tests
  describe('Data Flow Integration', () => {
    test('[OVERLAY-REFRESH-INTEGRATION-001] Should update overlay with fresh data', async () => {
      // Arrange
      const originalContent = createMockBookmarkContent()
      const updatedBookmarkData = createMockUpdatedBookmarkContent().bookmark
      const mockResponse = {
        success: true,
        data: updatedBookmarkData
      }
      
      jest.spyOn(messageService, 'sendMessage').mockResolvedValue(mockResponse)
      
      // Act
      overlayManager.show(originalContent)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      await refreshButton.onclick()
      
      // Assert
      expect(overlayManager.show).toHaveBeenCalledWith({
        bookmark: updatedBookmarkData,
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      })
    })

    test('[OVERLAY-REFRESH-INTEGRATION-001] Should preserve existing content on refresh failure', async () => {
      // Arrange
      const originalContent = createMockBookmarkContent()
      jest.spyOn(messageService, 'sendMessage').mockRejectedValue(new Error('Network error'))
      
      // Act
      overlayManager.show(originalContent)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      await refreshButton.onclick()
      
      // Assert
      expect(overlayManager.show).not.toHaveBeenCalledWith(originalContent)
    })

    test('[OVERLAY-REFRESH-INTEGRATION-001] Should handle empty response data', async () => {
      // Arrange
      const originalContent = createMockBookmarkContent()
      const mockResponse = {
        success: true,
        data: null
      }
      
      jest.spyOn(messageService, 'sendMessage').mockResolvedValue(mockResponse)
      
      // Act
      overlayManager.show(originalContent)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      await refreshButton.onclick()
      
      // Assert
      expect(overlayManager.showMessage).toHaveBeenCalledWith('Failed to refresh data', 'error')
    })
  })

  // [OVERLAY-REFRESH-TEST-001] Loading state integration tests
  describe('Loading State Integration', () => {
    test('[OVERLAY-REFRESH-INTEGRATION-001] Should add loading state during refresh', async () => {
      // Arrange
      const content = createMockBookmarkContent()
      const mockResponse = {
        success: true,
        data: content.bookmark
      }
      
      jest.spyOn(messageService, 'sendMessage').mockResolvedValue(mockResponse)
      
      // Act
      overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      const loadingPromise = refreshButton.onclick()
      
      // Assert - Check loading state is added
      expect(refreshButton.classList.add).toHaveBeenCalledWith('loading')
      expect(refreshButton.disabled).toBe(true)
      
      // Wait for completion
      await loadingPromise
      
      // Assert - Check loading state is removed
      expect(refreshButton.classList.remove).toHaveBeenCalledWith('loading')
      expect(refreshButton.disabled).toBe(false)
    })

    test('[OVERLAY-REFRESH-INTEGRATION-001] Should remove loading state on error', async () => {
      // Arrange
      const content = createMockBookmarkContent()
      jest.spyOn(messageService, 'sendMessage').mockRejectedValue(new Error('Network error'))
      
      // Act
      overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      await refreshButton.onclick()
      
      // Assert
      expect(refreshButton.classList.remove).toHaveBeenCalledWith('loading')
      expect(refreshButton.disabled).toBe(false)
    })
  })

  // [OVERLAY-REFRESH-TEST-001] User feedback integration tests
  describe('User Feedback Integration', () => {
    test('[OVERLAY-REFRESH-INTEGRATION-001] Should show loading message during refresh', async () => {
      // Arrange
      const content = createMockBookmarkContent()
      const mockResponse = {
        success: true,
        data: content.bookmark
      }
      
      jest.spyOn(messageService, 'sendMessage').mockResolvedValue(mockResponse)
      
      // Act
      overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      await refreshButton.onclick()
      
      // Assert
      expect(overlayManager.showMessage).toHaveBeenCalledWith('Refreshing data...', 'info')
    })

    test('[OVERLAY-REFRESH-INTEGRATION-001] Should show success message after refresh', async () => {
      // Arrange
      const content = createMockBookmarkContent()
      const mockResponse = {
        success: true,
        data: content.bookmark
      }
      
      jest.spyOn(messageService, 'sendMessage').mockResolvedValue(mockResponse)
      
      // Act
      overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      await refreshButton.onclick()
      
      // Assert
      expect(overlayManager.showMessage).toHaveBeenCalledWith('Data refreshed successfully', 'success')
    })

    test('[OVERLAY-REFRESH-INTEGRATION-001] Should show error message on failure', async () => {
      // Arrange
      const content = createMockBookmarkContent()
      jest.spyOn(messageService, 'sendMessage').mockRejectedValue(new Error('Network error'))
      
      // Act
      overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      await refreshButton.onclick()
      
      // Assert
      expect(overlayManager.showMessage).toHaveBeenCalledWith('Failed to refresh data', 'error')
    })
  })

  // [OVERLAY-REFRESH-TEST-001] Cross-component integration tests
  describe('Cross-Component Integration', () => {
    test('[OVERLAY-REFRESH-INTEGRATION-001] Should coordinate with popup refresh', async () => {
      // Arrange
      const content = createMockBookmarkContent()
      const updatedContent = createMockUpdatedBookmarkContent()
      const mockResponse = {
        success: true,
        data: updatedContent.bookmark
      }
      
      jest.spyOn(messageService, 'sendMessage').mockResolvedValue(mockResponse)
      
      // Act
      overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      await refreshButton.onclick()
      
      // Assert
      expect(overlayManager.show).toHaveBeenCalledWith({
        bookmark: updatedContent.bookmark,
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      })
    })

    test('[OVERLAY-REFRESH-INTEGRATION-001] Should handle concurrent refresh requests', async () => {
      // Arrange
      const content = createMockBookmarkContent()
      const mockResponse = {
        success: true,
        data: content.bookmark
      }
      
      jest.spyOn(messageService, 'sendMessage').mockResolvedValue(mockResponse)
      
      // Act
      overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      
      // Simulate concurrent clicks
      const promise1 = refreshButton.onclick()
      const promise2 = refreshButton.onclick()
      
      await Promise.all([promise1, promise2])
      
      // Assert
      expect(messageService.sendMessage).toHaveBeenCalledTimes(2)
    })
  })

  // [OVERLAY-REFRESH-TEST-001] Error recovery integration tests
  describe('Error Recovery Integration', () => {
    test('[OVERLAY-REFRESH-INTEGRATION-001] Should recover from network errors', async () => {
      // Arrange
      const content = createMockBookmarkContent()
      const mockResponse = {
        success: true,
        data: content.bookmark
      }
      
      // First call fails, second call succeeds
      jest.spyOn(messageService, 'sendMessage')
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockResponse)
      
      // Act
      overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      
      // First attempt fails
      await refreshButton.onclick()
      expect(overlayManager.showMessage).toHaveBeenCalledWith('Failed to refresh data', 'error')
      
      // Second attempt succeeds
      await refreshButton.onclick()
      expect(overlayManager.showMessage).toHaveBeenCalledWith('Data refreshed successfully', 'success')
    })

    test('[OVERLAY-REFRESH-INTEGRATION-001] Should handle service unavailability', async () => {
      // Arrange
      const content = createMockBookmarkContent()
      jest.spyOn(messageService, 'sendMessage').mockRejectedValue(new Error('Service unavailable'))
      
      // Act
      overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      await refreshButton.onclick()
      
      // Assert
      expect(overlayManager.showMessage).toHaveBeenCalledWith('Failed to refresh data', 'error')
      expect(overlayManager.show).not.toHaveBeenCalled()
    })
  })
})

// [OVERLAY-REFRESH-TEST-001] Export test utilities for other test files
export {
  createMockDocument,
  createMockBookmarkContent,
  createMockUpdatedBookmarkContent
} 