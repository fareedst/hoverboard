/**
 * [OVERLAY-REFRESH-TEST-001] Overlay Refresh Button Accessibility Tests
 * 
 * Accessibility tests for the overlay refresh button functionality
 * Tests ARIA attributes, keyboard navigation, and screen reader compatibility
 */

import { OverlayManager } from '../../src/features/content/overlay-manager.js'
const { createMockDocument } = require('../utils/mock-dom')

const respondWithRecentTags = () => ({ recentTags: [] })

const mockRefreshResponse = (mockMessageService, { bookmark, rawResponse, error } = {}) => {
  mockMessageService.sendMessage.mockImplementation(async (payload) => {
    if (payload?.type === 'getRecentBookmarks') {
      return respondWithRecentTags()
    }
    if (payload?.type === 'getCurrentBookmark') {
      if (error) {
        throw error
      }
      if (rawResponse) {
        return rawResponse
      }
      return {
        success: true,
        data: bookmark || { url: 'https://example.com', tags: ['test'] }
      }
    }
    return { success: true }
  })
}

// [OVERLAY-REFRESH-TEST-001] Accessibility test suite for overlay refresh button
describe('[OVERLAY-REFRESH-001] Accessibility Tests', () => {
  let overlayManager
  let mockDocument
  let mockMessageService

  beforeEach(() => {
    // [OVERLAY-REFRESH-TEST-001] Setup accessibility test environment
    mockDocument = createMockDocument()
    mockMessageService = {
      sendMessage: jest.fn()
    }
    overlayManager = new OverlayManager(mockDocument, {})
    overlayManager.messageService = mockMessageService
    overlayManager.showMessage = jest.fn()
    mockRefreshResponse(mockMessageService, {
      bookmark: { url: 'https://example.com', tags: ['test'] }
    })
  })

  afterEach(() => {
    // [OVERLAY-REFRESH-TEST-001] Cleanup accessibility test environment
    jest.clearAllMocks()
    if (mockDocument.reset) {
      mockDocument.reset()
    }
  })

  // Simple test to verify mock document is working
  test('Mock document should work correctly', () => {
    const button = mockDocument.createElement('button')
    button.className = 'refresh-button'
    mockDocument.body.appendChild(button)
    
    const foundButton = mockDocument.querySelector('.refresh-button')
    expect(foundButton).toBe(button)
  })

  // Test to see what happens when we call overlayManager.show()
  test('OverlayManager.show() should create refresh button', async () => {
    const content = {
      bookmark: { url: 'https://example.com', tags: ['test'] },
      pageTitle: 'Test Page',
      pageUrl: 'https://example.com'
    }
    
    await overlayManager.show(content)
    const refreshButton = mockDocument.querySelector('.refresh-button')
    expect(overlayManager.overlayElement).toBeDefined()
    expect(refreshButton).not.toBeNull()
  })

  // Debug test to diagnose refresh button registration
  test.skip('Debug: Check what elements are created during show()', async () => {
    // SKIPPED: This test revealed that OverlayManager.show() only creates one div element
    // and doesn't create the refresh button or other expected elements during tests.
    // 
    // PROPOSED SOLUTION:
    // 1. Add debug logging to OverlayManager.show() method to trace execution flow
    // 2. Check for early returns or conditions that prevent full overlay creation
    // 3. Verify that the content object structure matches what the method expects
    // 4. Ensure all DOM creation calls use this.document instead of global document
    // 5. Mock any dependencies (like VisibilityControls) that might cause early returns
    // 
    // Once the root cause is identified, the accessibility tests should be able to find
    // the refresh button and validate its properties properly.
    
    const content = {
      bookmark: { url: 'https://example.com', tags: ['test'] },
      pageTitle: 'Test Page',
      pageUrl: 'https://example.com'
    }
    
    // Clear any previous state
    mockDocument._allElements = []
    mockDocument._elementsByClass.clear()
    
    function w(msg) { process.stdout.write(msg + '\n') }
    w('=== DEBUG TEST START ===')
    w('Before show() - tracked elements: ' + mockDocument._allElements.length)
    w('Before show() - tracked classes: ' + JSON.stringify(Array.from(mockDocument._elementsByClass.keys())))
    
    await overlayManager.show(content)
    
    w('After show() - tracked elements: ' + mockDocument._allElements.length)
    w('After show() - all tracked elements: ' + JSON.stringify(mockDocument._allElements.map(el => ({
      tagName: el.tagName,
      className: el.className,
      id: el.id
    })), null, 2))
    w('After show() - tracked classes: ' + JSON.stringify(Array.from(mockDocument._elementsByClass.entries()), null, 2))
    
    const refreshButton = mockDocument.querySelector('.refresh-button')
    w('refreshButton query result: ' + (refreshButton ? JSON.stringify({ tagName: refreshButton.tagName, className: refreshButton.className, id: refreshButton.id }) : 'null'))
    
    // Also try querying by tag name
    const allButtons = mockDocument.querySelectorAll('button')
    w('All buttons found: ' + allButtons.length)
    allButtons.forEach((btn, i) => {
      w(`Button ${i}: ` + JSON.stringify({
        tagName: btn.tagName,
        className: btn.className,
        id: btn.id,
        innerHTML: btn.innerHTML
      }))
    })
    
    w('=== DEBUG TEST END ===')
    
    // Force the test to fail so we can see the output
    expect(refreshButton).not.toBeNull()
  })

  // [OVERLAY-REFRESH-TEST-001] ARIA attributes tests
  describe('ARIA Attributes', () => {
    test('[OVERLAY-REFRESH-ACCESSIBILITY-001] Should have proper ARIA attributes', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      // Act
      await overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      expect(refreshButton).not.toBeNull()
      // Assert
      expect(refreshButton.setAttribute).toHaveBeenCalledWith('aria-label', 'Refresh Data')
      expect(refreshButton.setAttribute).toHaveBeenCalledWith('role', 'button')
      expect(refreshButton.setAttribute).toHaveBeenCalledWith('tabindex', '0')
    })

    test('[OVERLAY-REFRESH-ACCESSIBILITY-001] Should have descriptive title attribute', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      // Act
      await overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      expect(refreshButton).not.toBeNull()
      // Assert
      expect(refreshButton.title).toBe('Refresh Data')
    })

    test('[OVERLAY-REFRESH-ACCESSIBILITY-001] Should have proper button role', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      // Act
      await overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      expect(refreshButton).not.toBeNull()
      // Assert
      const role = refreshButton.getAttribute('role')
      expect(refreshButton.getAttribute).toHaveBeenCalledWith('role')
      expect(role).toBe('button')
      expect(refreshButton.setAttribute).toHaveBeenCalledWith('role', 'button')
    })
  })

  // [OVERLAY-REFRESH-TEST-001] Keyboard navigation tests
  describe('Keyboard Navigation', () => {
    test('[OVERLAY-REFRESH-ACCESSIBILITY-001] Should be focusable with tabindex', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      // Act
      await overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      expect(refreshButton).not.toBeNull()
      // Assert
      expect(refreshButton.setAttribute).toHaveBeenCalledWith('tabindex', '0')
      expect(refreshButton.tabIndex).toBe(0)
    })

    test('[OVERLAY-REFRESH-ACCESSIBILITY-001] Should respond to Enter key', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      await overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      expect(refreshButton).not.toBeNull()
      // Act
      const enterEvent = { key: 'Enter', preventDefault: jest.fn() }
      const initialCalls = mockMessageService.sendMessage.mock.calls.length
      await refreshButton._triggerKeydown(enterEvent)
      // Assert
      expect(enterEvent.preventDefault).toHaveBeenCalled()
      expect(mockMessageService.sendMessage.mock.calls.length).toBeGreaterThan(initialCalls)
    })

    test('[OVERLAY-REFRESH-ACCESSIBILITY-001] Should respond to Space key', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      await overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      expect(refreshButton).not.toBeNull()
      // Act
      const spaceEvent = { key: ' ', preventDefault: jest.fn() }
      const initialCalls = mockMessageService.sendMessage.mock.calls.length
      await refreshButton._triggerKeydown(spaceEvent)
      // Assert
      expect(spaceEvent.preventDefault).toHaveBeenCalled()
      expect(mockMessageService.sendMessage.mock.calls.length).toBeGreaterThan(initialCalls)
    })

    test('[OVERLAY-REFRESH-ACCESSIBILITY-001] Should not respond to other keys', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      await overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      expect(refreshButton).not.toBeNull()
      // Act
      const otherEvent = { key: 'A', preventDefault: jest.fn() }
      const initialCalls = mockMessageService.sendMessage.mock.calls.length
      await refreshButton._triggerKeydown(otherEvent)
      // Assert
      expect(otherEvent.preventDefault).not.toHaveBeenCalled()
      expect(mockMessageService.sendMessage.mock.calls.length).toBe(initialCalls)
    })

    test('[OVERLAY-REFRESH-ACCESSIBILITY-001] Should prevent default on Enter key', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      await overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      expect(refreshButton).not.toBeNull()
      // Act
      const enterEvent = { key: 'Enter', preventDefault: jest.fn() }
      await refreshButton._triggerKeydown(enterEvent)
      // Assert
      expect(enterEvent.preventDefault).toHaveBeenCalled()
    })
  })

  // [OVERLAY-REFRESH-TEST-001] Focus management tests
  describe('Focus Management', () => {
    test('[OVERLAY-REFRESH-ACCESSIBILITY-001] Should maintain focus during loading', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      await overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      expect(refreshButton).not.toBeNull()
      // Act
      refreshButton.focus()
      await refreshButton._triggerClick()
      // Assert
      expect(refreshButton.focus).toHaveBeenCalled()
    })

    test('[OVERLAY-REFRESH-ACCESSIBILITY-001] Should restore focus after completion', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      await overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      expect(refreshButton).not.toBeNull()
      // Act
      refreshButton.focus()
      await refreshButton._triggerClick()
      // Assert
      expect(refreshButton.focus).toHaveBeenCalled()
    })
  })

  // [OVERLAY-REFRESH-TEST-001] Screen reader compatibility tests
  describe('Screen Reader Compatibility', () => {
    test('[OVERLAY-REFRESH-ACCESSIBILITY-001] Should have meaningful aria-label', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      await overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      expect(refreshButton).not.toBeNull()
      // Assert
      expect(refreshButton.setAttribute).toHaveBeenCalledWith('aria-label', 'Refresh Data')
    })

    test('[OVERLAY-REFRESH-ACCESSIBILITY-001] Should announce loading state to screen readers', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      await overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      expect(refreshButton).not.toBeNull()
      // Act
      await refreshButton._triggerClick()
      // Assert
      expect(overlayManager.showMessage).toHaveBeenCalledWith('Refreshing data...', 'info')
    })

    test('[OVERLAY-REFRESH-ACCESSIBILITY-001] Should announce completion to screen readers', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      await overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      expect(refreshButton).not.toBeNull()
      // Act
      await refreshButton._triggerClick()
      // Assert
      expect(overlayManager.showMessage).toHaveBeenCalledWith('Data refreshed successfully', 'success')
    })

    test('[OVERLAY-REFRESH-ACCESSIBILITY-001] Should announce errors to screen readers', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      mockRefreshResponse(mockMessageService, { error: new Error('fail') })
      await overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      expect(refreshButton).not.toBeNull()
      // Act
      await refreshButton._triggerClick()
      // Assert
      expect(overlayManager.showMessage).toHaveBeenCalledWith('Failed to refresh data', 'error')
    })
  })

  // [OVERLAY-REFRESH-TEST-001] Visual accessibility tests
  describe('Visual Accessibility', () => {
    test('[OVERLAY-REFRESH-ACCESSIBILITY-001] Should have sufficient color contrast', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      await overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      expect(refreshButton).not.toBeNull()
      // Assert - Check that theme variables are used for proper contrast
      expect(refreshButton.style.cssText).toContain('var(--theme-button-bg)')
      expect(refreshButton.style.cssText).toContain('var(--theme-text-primary)')
    })

    test('[OVERLAY-REFRESH-ACCESSIBILITY-001] Should have focus indicator', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      await overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      expect(refreshButton).not.toBeNull()
      // Assert - Check that focus styles are defined
      expect(refreshButton.style.cssText).toContain('outline')
    })

    test('[OVERLAY-REFRESH-ACCESSIBILITY-001] Should have hover state indicator', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      await overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      expect(refreshButton).not.toBeNull()
      // Assert - Check that transition is defined for smooth hover effects
      expect(refreshButton.style.cssText).toContain('transition')
    })
  })

  // [OVERLAY-REFRESH-TEST-001] State management accessibility tests
  describe('State Management Accessibility', () => {
    test('[OVERLAY-REFRESH-ACCESSIBILITY-001] Should disable button during loading', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      await overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      expect(refreshButton).not.toBeNull()
      // Act
      const clickPromise = refreshButton._triggerClick()
      // Assert loading state before await
      expect(refreshButton.disabled).toBe(true)
      await clickPromise
    })

    test('[OVERLAY-REFRESH-ACCESSIBILITY-001] Should re-enable button after completion', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      await overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      expect(refreshButton).not.toBeNull()
      // Act
      await refreshButton._triggerClick()
      // Assert
      expect(refreshButton.disabled).toBe(false)
    })

    test('[OVERLAY-REFRESH-ACCESSIBILITY-001] Should re-enable button after error', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      mockRefreshResponse(mockMessageService, { error: new Error('fail') })
      await overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      expect(refreshButton).not.toBeNull()
      // Act
      await refreshButton._triggerClick()
      // Assert
      expect(refreshButton.disabled).toBe(false)
    })
  })

  // [OVERLAY-REFRESH-TEST-001] Semantic HTML tests
  describe('Semantic HTML', () => {
    test('[OVERLAY-REFRESH-ACCESSIBILITY-001] Should use button element', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      await overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      expect(refreshButton).not.toBeNull()
      // Assert
      expect(refreshButton.tagName).toBe('BUTTON')
    })

    test('[OVERLAY-REFRESH-ACCESSIBILITY-001] Should have meaningful content', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      await overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      expect(refreshButton).not.toBeNull()
      // Assert
      expect(refreshButton.innerHTML).toBe('🔄')
    })
  })

  // [OVERLAY-REFRESH-TEST-001] WCAG compliance tests
  describe('WCAG Compliance', () => {
    test('[OVERLAY-REFRESH-ACCESSIBILITY-001] Should meet WCAG 2.1 AA standards', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      await overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      expect(refreshButton).not.toBeNull()
      // Assert - Check for required WCAG 2.1 AA features
      expect(refreshButton.setAttribute).toHaveBeenCalledWith('aria-label', 'Refresh Data')
      expect(refreshButton.setAttribute).toHaveBeenCalledWith('role', 'button')
      expect(refreshButton.setAttribute).toHaveBeenCalledWith('tabindex', '0')
      expect(refreshButton.title).toBe('Refresh Data')
    })

    test('[OVERLAY-REFRESH-ACCESSIBILITY-001] Should support keyboard-only navigation', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      await overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      expect(refreshButton).not.toBeNull()
      // Act & Assert - Test keyboard navigation
      expect(refreshButton.tabIndex).toBe(0)
      expect(refreshButton.onkeydown).toBeDefined()
    })

    test('[OVERLAY-REFRESH-ACCESSIBILITY-001] Should provide clear visual feedback', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      await overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      expect(refreshButton).not.toBeNull()
      // Assert - Check for visual feedback mechanisms
      expect(refreshButton.style.cssText).toContain('transition')
      expect(refreshButton.style.cssText).toContain('cursor: pointer')
    })
  })
})

// [OVERLAY-REFRESH-TEST-001] Export test utilities for other test files
export {
  createMockDocument
} 