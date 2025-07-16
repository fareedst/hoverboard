/**
 * [OVERLAY-REFRESH-TEST-001] Overlay Refresh Button Unit Tests
 * 
 * Comprehensive unit tests for the overlay refresh button functionality
 * Tests button rendering, click handling, error scenarios, accessibility, and theme integration
 */

import { OverlayManager } from '../../src/features/content/overlay-manager.js'

// [OVERLAY-REFRESH-TEST-001] Mock utilities for testing
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
        querySelector: jest.fn(),
        querySelectorAll: jest.fn(),
        appendChild: jest.fn(),
        contains: jest.fn(() => true)
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

const createMockMessageService = () => {
  return {
    sendMessage: jest.fn()
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

// [OVERLAY-REFRESH-TEST-001] Test suite for overlay refresh button
describe('[OVERLAY-REFRESH-001] Overlay Refresh Button', () => {
  let overlayManager
  let mockMessageService
  let mockDocument

  beforeEach(() => {
    // [OVERLAY-REFRESH-TEST-001] Setup test environment
    mockDocument = createMockDocument()
    mockMessageService = createMockMessageService()
    overlayManager = new OverlayManager(mockDocument, {})
    overlayManager.messageService = mockMessageService
    overlayManager.showMessage = jest.fn()
    overlayManager.show = jest.fn()
  })

  afterEach(() => {
    // [OVERLAY-REFRESH-TEST-001] Cleanup test environment
    jest.clearAllMocks()
  })

  // [OVERLAY-REFRESH-TEST-001] Button rendering tests
  describe('Button Rendering', () => {
    test('[OVERLAY-REFRESH-UI-001] Should render refresh button correctly', () => {
      // Arrange
      const content = createMockBookmarkContent()
      
      // Act
      overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      
      // Assert
      expect(refreshButton).toBeTruthy()
      expect(refreshButton.innerHTML).toBe('🔄')
      expect(refreshButton.title).toBe('Refresh Data')
      expect(refreshButton.getAttribute('aria-label')).toBe('Refresh Data')
      expect(refreshButton.getAttribute('role')).toBe('button')
      expect(refreshButton.getAttribute('tabindex')).toBe('0')
    })

    test('[OVERLAY-REFRESH-UI-001] Should position refresh button in top-left corner', () => {
      // Arrange
      const content = createMockBookmarkContent()
      
      // Act
      overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      
      // Assert
      expect(refreshButton.style.cssText).toContain('position: absolute')
      expect(refreshButton.style.cssText).toContain('top: 8px')
      expect(refreshButton.style.cssText).toContain('left: 8px')
    })

    test('[OVERLAY-REFRESH-UI-001] Should apply correct CSS classes', () => {
      // Arrange
      const content = createMockBookmarkContent()
      
      // Act
      overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      
      // Assert
      expect(refreshButton.className).toContain('refresh-button')
    })

    test('[OVERLAY-REFRESH-THEME-001] Should use theme-aware CSS variables', () => {
      // Arrange
      const content = createMockBookmarkContent()
      
      // Act
      overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      
      // Assert
      expect(refreshButton.style.cssText).toContain('var(--theme-button-bg)')
      expect(refreshButton.style.cssText).toContain('var(--theme-text-primary)')
      expect(refreshButton.style.cssText).toContain('var(--theme-border)')
      expect(refreshButton.style.cssText).toContain('var(--theme-transition)')
    })
  })

  // [OVERLAY-REFRESH-TEST-001] Click handler tests
  describe('Click Handler', () => {
    test('[OVERLAY-REFRESH-HANDLER-001] Should handle successful refresh', async () => {
      // Arrange
      const content = createMockBookmarkContent()
      const updatedContent = createMockUpdatedBookmarkContent()
      mockMessageService.sendMessage.mockResolvedValue({
        success: true,
        data: updatedContent.bookmark
      })
      
      // Act
      overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      await refreshButton.onclick()
      
      // Assert
      expect(mockMessageService.sendMessage).toHaveBeenCalledWith({
        type: 'getCurrentBookmark',
        data: {
          url: 'https://example.com',
          title: 'Test Page',
          tabId: null
        }
      })
      expect(overlayManager.show).toHaveBeenCalledWith(updatedContent)
    })

    test('[OVERLAY-REFRESH-HANDLER-001] Should show loading message during refresh', async () => {
      // Arrange
      const content = createMockBookmarkContent()
      mockMessageService.sendMessage.mockResolvedValue({
        success: true,
        data: content.bookmark
      })
      
      // Act
      overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      await refreshButton.onclick()
      
      // Assert
      expect(overlayManager.showMessage).toHaveBeenCalledWith('Refreshing data...', 'info')
    })

    test('[OVERLAY-REFRESH-HANDLER-001] Should show success message after refresh', async () => {
      // Arrange
      const content = createMockBookmarkContent()
      mockMessageService.sendMessage.mockResolvedValue({
        success: true,
        data: content.bookmark
      })
      
      // Act
      overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      await refreshButton.onclick()
      
      // Assert
      expect(overlayManager.showMessage).toHaveBeenCalledWith('Data refreshed successfully', 'success')
    })
  })

  // [OVERLAY-REFRESH-TEST-001] Error handling tests
  describe('Error Handling', () => {
    test('[OVERLAY-REFRESH-ERROR-001] Should handle network errors gracefully', async () => {
      // Arrange
      const content = createMockBookmarkContent()
      mockMessageService.sendMessage.mockRejectedValue(new Error('Network error'))
      
      // Act
      overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      await refreshButton.onclick()
      
      // Assert
      expect(overlayManager.showMessage).toHaveBeenCalledWith('Failed to refresh data', 'error')
    })

    test('[OVERLAY-REFRESH-ERROR-001] Should handle invalid response data', async () => {
      // Arrange
      const content = createMockBookmarkContent()
      mockMessageService.sendMessage.mockResolvedValue({
        success: false,
        data: null
      })
      
      // Act
      overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      await refreshButton.onclick()
      
      // Assert
      expect(overlayManager.showMessage).toHaveBeenCalledWith('Failed to refresh data', 'error')
    })

    test('[OVERLAY-REFRESH-ERROR-001] Should handle missing response data', async () => {
      // Arrange
      const content = createMockBookmarkContent()
      mockMessageService.sendMessage.mockResolvedValue(null)
      
      // Act
      overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      await refreshButton.onclick()
      
      // Assert
      expect(overlayManager.showMessage).toHaveBeenCalledWith('Failed to refresh data', 'error')
    })

    test('[OVERLAY-REFRESH-ERROR-001] Should handle empty response data', async () => {
      // Arrange
      const content = createMockBookmarkContent()
      mockMessageService.sendMessage.mockResolvedValue({
        success: true,
        data: null
      })
      
      // Act
      overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      await refreshButton.onclick()
      
      // Assert
      expect(overlayManager.showMessage).toHaveBeenCalledWith('Failed to refresh data', 'error')
    })
  })

  // [OVERLAY-REFRESH-TEST-001] Accessibility tests
  describe('Accessibility', () => {
    test('[OVERLAY-REFRESH-ACCESSIBILITY-001] Should have correct ARIA attributes', () => {
      // Arrange
      const content = createMockBookmarkContent()
      
      // Act
      overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      
      // Assert
      expect(refreshButton.getAttribute('aria-label')).toBe('Refresh Data')
      expect(refreshButton.getAttribute('role')).toBe('button')
      expect(refreshButton.getAttribute('tabindex')).toBe('0')
    })

    test('[OVERLAY-REFRESH-ACCESSIBILITY-001] Should have descriptive tooltip', () => {
      // Arrange
      const content = createMockBookmarkContent()
      
      // Act
      overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      
      // Assert
      expect(refreshButton.title).toBe('Refresh Data')
    })

    test('[OVERLAY-REFRESH-ACCESSIBILITY-001] Should handle Enter key press', async () => {
      // Arrange
      const content = createMockBookmarkContent()
      mockMessageService.sendMessage.mockResolvedValue({
        success: true,
        data: content.bookmark
      })
      
      // Act
      overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      const enterEvent = { key: 'Enter', preventDefault: jest.fn() }
      await refreshButton.addEventListener.mock.calls[0][1](enterEvent)
      
      // Assert
      expect(enterEvent.preventDefault).toHaveBeenCalled()
      expect(mockMessageService.sendMessage).toHaveBeenCalled()
    })

    test('[OVERLAY-REFRESH-ACCESSIBILITY-001] Should handle Space key press', async () => {
      // Arrange
      const content = createMockBookmarkContent()
      mockMessageService.sendMessage.mockResolvedValue({
        success: true,
        data: content.bookmark
      })
      
      // Act
      overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      const spaceEvent = { key: ' ', preventDefault: jest.fn() }
      await refreshButton.addEventListener.mock.calls[0][1](spaceEvent)
      
      // Assert
      expect(spaceEvent.preventDefault).toHaveBeenCalled()
      expect(mockMessageService.sendMessage).toHaveBeenCalled()
    })

    test('[OVERLAY-REFRESH-ACCESSIBILITY-001] Should not handle other key presses', async () => {
      // Arrange
      const content = createMockBookmarkContent()
      
      // Act
      overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      const otherEvent = { key: 'Tab', preventDefault: jest.fn() }
      await refreshButton.addEventListener.mock.calls[0][1](otherEvent)
      
      // Assert
      expect(otherEvent.preventDefault).not.toHaveBeenCalled()
      expect(mockMessageService.sendMessage).not.toHaveBeenCalled()
    })
  })

  // [OVERLAY-REFRESH-TEST-001] Integration tests
  describe('Integration', () => {
    test('[OVERLAY-REFRESH-INTEGRATION-001] Should integrate with message service', async () => {
      // Arrange
      const content = createMockBookmarkContent()
      const updatedContent = createMockUpdatedBookmarkContent()
      mockMessageService.sendMessage.mockResolvedValue({
        success: true,
        data: updatedContent.bookmark
      })
      
      // Act
      overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      await refreshButton.onclick()
      
      // Assert
      expect(mockMessageService.sendMessage).toHaveBeenCalledWith({
        type: 'getCurrentBookmark',
        data: {
          url: 'https://example.com',
          title: 'Test Page',
          tabId: null
        }
      })
    })

    test('[OVERLAY-REFRESH-INTEGRATION-001] Should update overlay with fresh data', async () => {
      // Arrange
      const content = createMockBookmarkContent()
      const updatedContent = createMockUpdatedBookmarkContent()
      mockMessageService.sendMessage.mockResolvedValue({
        success: true,
        data: updatedContent.bookmark
      })
      
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

    test('[OVERLAY-REFRESH-INTEGRATION-001] Should preserve existing content on refresh failure', async () => {
      // Arrange
      const content = createMockBookmarkContent()
      mockMessageService.sendMessage.mockRejectedValue(new Error('Network error'))
      
      // Act
      overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      await refreshButton.onclick()
      
      // Assert
      expect(overlayManager.show).not.toHaveBeenCalledWith(content)
    })
  })

  // [OVERLAY-REFRESH-TEST-001] Performance tests
  describe('Performance', () => {
    test('[OVERLAY-REFRESH-PERFORMANCE-001] Should complete refresh within reasonable time', async () => {
      // Arrange
      const content = createMockBookmarkContent()
      mockMessageService.sendMessage.mockResolvedValue({
        success: true,
        data: content.bookmark
      })
      
      // Act
      const startTime = performance.now()
      overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      await refreshButton.onclick()
      const endTime = performance.now()
      
      // Assert
      const duration = endTime - startTime
      expect(duration).toBeLessThan(1000) // Should complete within 1 second
    })

    test('[OVERLAY-REFRESH-PERFORMANCE-001] Should not create unnecessary DOM elements', () => {
      // Arrange
      const content = createMockBookmarkContent()
      const createElementSpy = jest.spyOn(mockDocument, 'createElement')
      
      // Act
      overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      refreshButton.onclick()
      
      // Assert
      expect(createElementSpy).not.toHaveBeenCalled() // Should not create new elements during refresh
    })
  })

  // [OVERLAY-REFRESH-TEST-001] Edge case tests
  describe('Edge Cases', () => {
    test('[OVERLAY-REFRESH-ERROR-001] Should handle undefined content', async () => {
      // Arrange
      const content = undefined
      mockMessageService.sendMessage.mockResolvedValue({
        success: true,
        data: { url: 'https://example.com' }
      })
      
      // Act
      overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      await refreshButton.onclick()
      
      // Assert
      expect(mockMessageService.sendMessage).toHaveBeenCalled()
    })

    test('[OVERLAY-REFRESH-ERROR-001] Should handle null bookmark data', async () => {
      // Arrange
      const content = { bookmark: null, pageTitle: 'Test', pageUrl: 'https://example.com' }
      mockMessageService.sendMessage.mockResolvedValue({
        success: true,
        data: null
      })
      
      // Act
      overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      await refreshButton.onclick()
      
      // Assert
      expect(overlayManager.showMessage).toHaveBeenCalledWith('Failed to refresh data', 'error')
    })

    test('[OVERLAY-REFRESH-ERROR-001] Should handle empty bookmark data', async () => {
      // Arrange
      const content = { bookmark: {}, pageTitle: 'Test', pageUrl: 'https://example.com' }
      mockMessageService.sendMessage.mockResolvedValue({
        success: true,
        data: {}
      })
      
      // Act
      overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      await refreshButton.onclick()
      
      // Assert
      expect(overlayManager.show).toHaveBeenCalled()
    })
  })
})

// [OVERLAY-REFRESH-TEST-001] Export test utilities for other test files
export {
  createMockDocument,
  createMockMessageService,
  createMockBookmarkContent,
  createMockUpdatedBookmarkContent
} 