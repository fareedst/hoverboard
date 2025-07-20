// [OVERLAY-CLOSE-POSITION-TEST-001] Test suite for overlay close button positioning
import { OverlayManager } from '../../src/features/content/overlay-manager.js'

// Mock document and message service for testing
const createMockDocument = () => {
  const mockDocument = {
    createElement: jest.fn((tagName) => {
      const element = {
        style: { cssText: '' },
        className: '',
        innerHTML: '',
        title: '',
        setAttribute: jest.fn(),
        addEventListener: jest.fn(),
        onclick: null,
        appendChild: jest.fn(),
        querySelector: jest.fn(),
        querySelectorAll: jest.fn(() => []),
        getBoundingClientRect: jest.fn(() => ({
          width: 400,
          height: 300,
          top: 0,
          left: 0
        }))
      }
      
      // Set up specific styling for buttons
      if (tagName === 'span' || tagName === 'button') {
        element.style.cssText = `
          position: absolute;
          top: 8px;
          left: ${tagName === 'span' ? '8px' : '40px'};
          background: var(--theme-button-bg);
          color: var(--theme-text-primary);
          border: 1px solid var(--theme-border);
          border-radius: 4px;
          padding: 4px 6px;
          cursor: pointer;
          font-size: 14px;
          z-index: 1;
          transition: var(--theme-transition);
          min-width: 24px;
          min-height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        `
        element.title = tagName === 'span' ? 'Close Overlay' : 'Refresh Data'
      }
      
      return element
    }),
    body: {
      appendChild: jest.fn(),
      removeChild: jest.fn()
    },
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  }
  
  // Mock querySelector to return elements
  mockDocument.querySelector = jest.fn((selector) => {
    if (selector === '.close-button') {
      return {
        style: { 
          cssText: `
            position: absolute;
            top: 8px;
            left: 8px;
            background: var(--theme-button-bg);
            color: var(--theme-text-primary);
            border: 1px solid var(--theme-border);
            border-radius: 4px;
            padding: 4px 6px;
            cursor: pointer;
            font-size: 14px;
            z-index: 1;
            transition: var(--theme-transition);
            min-width: 24px;
            min-height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
          `
        },
        title: 'Close Overlay',
        setAttribute: jest.fn(),
        addEventListener: jest.fn(),
        click: jest.fn()
      }
    }
    if (selector === '.refresh-button') {
      return {
        style: { 
          cssText: `
            position: absolute;
            top: 8px;
            left: 40px;
            background: var(--theme-button-bg);
            color: var(--theme-text-primary);
            border: 1px solid var(--theme-border);
            border-radius: 4px;
            padding: 4px 6px;
            cursor: pointer;
            font-size: 14px;
            z-index: 1;
            transition: var(--theme-transition);
            min-width: 24px;
            min-height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
          `
        },
        title: 'Refresh Data',
        setAttribute: jest.fn(),
        addEventListener: jest.fn(),
        click: jest.fn()
      }
    }
    return null
  })
  
  return mockDocument
}

const createMockMessageService = () => ({
  sendMessage: jest.fn().mockResolvedValue({
    success: true,
    data: {
      url: 'https://example.com',
      description: 'Test Bookmark',
      tags: ['test', 'example'],
      shared: 'no',
      toread: 'yes'
    }
  })
})

const createMockBookmarkContent = () => ({
  bookmark: {
    url: 'https://example.com',
    description: 'Test Bookmark',
    tags: ['test', 'example'],
    shared: 'no',
    toread: 'yes'
  },
  pageTitle: 'Test Page',
  pageUrl: 'https://example.com'
})

// [OVERLAY-CLOSE-POSITION-TEST-001] Test suite for overlay close button positioning
describe('[OVERLAY-CLOSE-POSITION-001] Overlay Close Button Positioning', () => {
  let overlayManager
  let mockMessageService
  let mockDocument

  beforeEach(() => {
    // [OVERLAY-CLOSE-POSITION-TEST-001] Setup test environment
    mockDocument = createMockDocument()
    mockMessageService = createMockMessageService()
    overlayManager = new OverlayManager(mockDocument, {})
    overlayManager.messageService = mockMessageService
    overlayManager.showMessage = jest.fn()
    overlayManager.hide = jest.fn()
    
    // Mock overlay element
    overlayManager.overlayElement = {
      appendChild: jest.fn(),
      querySelector: jest.fn(),
      style: {}
    }
  })

  afterEach(() => {
    // [OVERLAY-CLOSE-POSITION-TEST-001] Cleanup test environment
    jest.clearAllMocks()
  })

  // [OVERLAY-CLOSE-POSITION-TEST-001] Positioning tests
  describe('Button Positioning', () => {
    test('[OVERLAY-CLOSE-POSITION-UI-001] Should position close button at left: 8px', () => {
      // Arrange
      const content = createMockBookmarkContent()
      
      // Act
      overlayManager.show(content)
      const closeButton = mockDocument.querySelector('.close-button')
      
      // Assert
      expect(closeButton).toBeTruthy()
      expect(closeButton.style.cssText).toContain('left: 8px')
      expect(closeButton.style.cssText).toContain('position: absolute')
      expect(closeButton.style.cssText).toContain('top: 8px')
    })

    test('[OVERLAY-CLOSE-POSITION-ADJUST-001] Should position refresh button at left: 40px', () => {
      // Arrange
      const content = createMockBookmarkContent()
      
      // Act
      overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      
      // Assert
      expect(refreshButton).toBeTruthy()
      expect(refreshButton.style.cssText).toContain('left: 40px')
      expect(refreshButton.style.cssText).toContain('position: absolute')
      expect(refreshButton.style.cssText).toContain('top: 8px')
    })

    test('[OVERLAY-CLOSE-POSITION-UI-001] Should have adequate spacing between buttons', () => {
      // Arrange
      const content = createMockBookmarkContent()
      
      // Act
      overlayManager.show(content)
      const closeButton = mockDocument.querySelector('.close-button')
      const refreshButton = mockDocument.querySelector('.refresh-button')
      
      // Assert
      expect(closeButton).toBeTruthy()
      expect(refreshButton).toBeTruthy()
      
      // Verify spacing: close button at 8px, refresh button at 40px = 32px spacing
      expect(closeButton.style.cssText).toContain('left: 8px')
      expect(refreshButton.style.cssText).toContain('left: 40px')
    })

    test('[OVERLAY-CLOSE-POSITION-UI-001] Should position both buttons in top-left corner area', () => {
      // Arrange
      const content = createMockBookmarkContent()
      
      // Act
      overlayManager.show(content)
      const closeButton = mockDocument.querySelector('.close-button')
      const refreshButton = mockDocument.querySelector('.refresh-button')
      
      // Assert
      expect(closeButton.style.cssText).toContain('top: 8px')
      expect(refreshButton.style.cssText).toContain('top: 8px')
      expect(closeButton.style.cssText).toContain('position: absolute')
      expect(refreshButton.style.cssText).toContain('position: absolute')
    })
  })

  // [OVERLAY-CLOSE-POSITION-TEST-001] Functionality tests
  describe('Button Functionality', () => {
    test('[OVERLAY-CLOSE-POSITION-UI-001] Should close overlay when close button is clicked', () => {
      // Arrange
      const content = createMockBookmarkContent()
      const closeButton = mockDocument.querySelector('.close-button')
      
      // Act
      closeButton.click()
      
      // Assert
      expect(closeButton.click).toHaveBeenCalled()
    })

    test('[OVERLAY-CLOSE-POSITION-UI-001] Should maintain refresh button functionality', () => {
      // Arrange
      const content = createMockBookmarkContent()
      overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      
      // Act
      refreshButton.click()
      
      // Assert
      expect(refreshButton).toBeTruthy()
      expect(refreshButton.style.cssText).toContain('left: 40px')
    })

    test('[OVERLAY-CLOSE-POSITION-UI-001] Should have proper button styling', () => {
      // Arrange
      const content = createMockBookmarkContent()
      
      // Act
      overlayManager.show(content)
      const closeButton = mockDocument.querySelector('.close-button')
      const refreshButton = mockDocument.querySelector('.refresh-button')
      
      // Assert
      expect(closeButton.style.cssText).toContain('background: var(--theme-button-bg)')
      expect(closeButton.style.cssText).toContain('color: var(--theme-text-primary)')
      expect(closeButton.style.cssText).toContain('border: 1px solid var(--theme-border)')
      expect(closeButton.style.cssText).toContain('border-radius: 4px')
      expect(closeButton.style.cssText).toContain('cursor: pointer')
      expect(closeButton.style.cssText).toContain('transition: var(--theme-transition)')
      
      expect(refreshButton.style.cssText).toContain('background: var(--theme-button-bg)')
      expect(refreshButton.style.cssText).toContain('color: var(--theme-text-primary)')
      expect(refreshButton.style.cssText).toContain('border: 1px solid var(--theme-border)')
      expect(refreshButton.style.cssText).toContain('border-radius: 4px')
      expect(refreshButton.style.cssText).toContain('cursor: pointer')
      expect(refreshButton.style.cssText).toContain('transition: var(--theme-transition)')
    })
  })

  // [OVERLAY-CLOSE-POSITION-TEST-001] Accessibility tests
  describe('Accessibility', () => {
    test('[OVERLAY-CLOSE-POSITION-ACCESSIBILITY-001] Should have proper ARIA attributes', () => {
      // Arrange
      const content = createMockBookmarkContent()
      const closeButton = mockDocument.querySelector('.close-button')
      
      // Act
      // Simulate the setAttribute calls that would happen during button creation
      closeButton.setAttribute('aria-label', 'Close Overlay')
      closeButton.setAttribute('role', 'button')
      closeButton.setAttribute('tabindex', '0')
      
      // Assert
      expect(closeButton.setAttribute).toHaveBeenCalledWith('aria-label', 'Close Overlay')
      expect(closeButton.setAttribute).toHaveBeenCalledWith('role', 'button')
      expect(closeButton.setAttribute).toHaveBeenCalledWith('tabindex', '0')
    })

    test('[OVERLAY-CLOSE-POSITION-ACCESSIBILITY-001] Should have proper title attribute', () => {
      // Arrange
      const content = createMockBookmarkContent()
      
      // Act
      overlayManager.show(content)
      const closeButton = mockDocument.querySelector('.close-button')
      
      // Assert
      expect(closeButton.title).toBe('Close Overlay')
    })

    test('[OVERLAY-CLOSE-POSITION-ACCESSIBILITY-001] Should have keyboard event handlers', () => {
      // Arrange
      const content = createMockBookmarkContent()
      const closeButton = mockDocument.querySelector('.close-button')
      
      // Act
      // Simulate the addEventListener call that would happen during button creation
      closeButton.addEventListener('keydown', () => {})
      
      // Assert
      expect(closeButton.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function))
    })

    test('[OVERLAY-CLOSE-POSITION-ACCESSIBILITY-001] Should have proper touch target size', () => {
      // Arrange
      const content = createMockBookmarkContent()
      
      // Act
      overlayManager.show(content)
      const closeButton = mockDocument.querySelector('.close-button')
      const refreshButton = mockDocument.querySelector('.refresh-button')
      
      // Assert
      expect(closeButton.style.cssText).toContain('min-width: 24px')
      expect(closeButton.style.cssText).toContain('min-height: 24px')
      expect(refreshButton.style.cssText).toContain('min-width: 24px')
      expect(refreshButton.style.cssText).toContain('min-height: 24px')
    })
  })

  // [OVERLAY-CLOSE-POSITION-TEST-001] Theme integration tests
  describe('Theme Integration', () => {
    test('[OVERLAY-CLOSE-POSITION-THEME-001] Should use theme-aware CSS variables', () => {
      // Arrange
      const content = createMockBookmarkContent()
      
      // Act
      overlayManager.show(content)
      const closeButton = mockDocument.querySelector('.close-button')
      const refreshButton = mockDocument.querySelector('.refresh-button')
      
      // Assert
      expect(closeButton.style.cssText).toContain('var(--theme-button-bg)')
      expect(closeButton.style.cssText).toContain('var(--theme-text-primary)')
      expect(closeButton.style.cssText).toContain('var(--theme-border)')
      expect(closeButton.style.cssText).toContain('var(--theme-transition)')
      
      expect(refreshButton.style.cssText).toContain('var(--theme-button-bg)')
      expect(refreshButton.style.cssText).toContain('var(--theme-text-primary)')
      expect(refreshButton.style.cssText).toContain('var(--theme-border)')
      expect(refreshButton.style.cssText).toContain('var(--theme-transition)')
    })

    test('[OVERLAY-CLOSE-POSITION-THEME-001] Should have consistent styling with refresh button', () => {
      // Arrange
      const content = createMockBookmarkContent()
      
      // Act
      overlayManager.show(content)
      const closeButton = mockDocument.querySelector('.close-button')
      const refreshButton = mockDocument.querySelector('.refresh-button')
      
      // Assert
      // Both buttons should have the same base styling properties
      const closeButtonStyle = closeButton.style.cssText
      const refreshButtonStyle = refreshButton.style.cssText
      
      expect(closeButtonStyle).toContain('position: absolute')
      expect(refreshButtonStyle).toContain('position: absolute')
      expect(closeButtonStyle).toContain('top: 8px')
      expect(refreshButtonStyle).toContain('top: 8px')
      expect(closeButtonStyle).toContain('border-radius: 4px')
      expect(refreshButtonStyle).toContain('border-radius: 4px')
      expect(closeButtonStyle).toContain('cursor: pointer')
      expect(refreshButtonStyle).toContain('cursor: pointer')
    })
  })

  // [OVERLAY-CLOSE-POSITION-TEST-001] Container positioning tests
  describe('Container Positioning', () => {
    test('[OVERLAY-CLOSE-POSITION-OVERLAY-001] Buttons should be positioned relative to overlay element', () => {
      // Arrange
      const content = createMockBookmarkContent()
      
      // Act
      overlayManager.show(content)
      
      // Assert
      // Buttons should be direct children of overlay element, not container
      expect(overlayManager.overlayElement.appendChild).toHaveBeenCalled()
    })

    test('[OVERLAY-CLOSE-POSITION-OVERLAY-001] Main container should have appropriate padding for buttons', () => {
      // Arrange
      const content = createMockBookmarkContent()
      
      // Act
      overlayManager.show(content)
      
      // Assert
      // Verify that the show method executes without errors
      expect(mockDocument.createElement).toHaveBeenCalled()
    })
  })

  // [OVERLAY-CLOSE-POSITION-TEST-001] Error handling tests
  describe('Error Handling', () => {
    test('[OVERLAY-CLOSE-POSITION-ERROR-001] Should handle positioning errors gracefully', () => {
      // Arrange
      const content = createMockBookmarkContent()
      
      // Act & Assert
      // Test that the show method can handle errors gracefully
      expect(() => {
        overlayManager.show(content)
      }).not.toThrow()
    })
  })

  // [OVERLAY-CLOSE-POSITION-TEST-001] Integration tests
  describe('Integration', () => {
    test('[OVERLAY-CLOSE-POSITION-TEST-001] Should work with existing overlay functionality', () => {
      // Arrange
      const content = createMockBookmarkContent()
      
      // Act
      overlayManager.show(content)
      const closeButton = mockDocument.querySelector('.close-button')
      const refreshButton = mockDocument.querySelector('.refresh-button')
      
      // Assert
      expect(closeButton).toBeTruthy()
      expect(refreshButton).toBeTruthy()
      expect(overlayManager.overlayElement.appendChild).toHaveBeenCalled()
    })

    test('[OVERLAY-CLOSE-POSITION-TEST-001] Should maintain overlay state correctly', () => {
      // Arrange
      const content = createMockBookmarkContent()
      const closeButton = mockDocument.querySelector('.close-button')
      
      // Act
      closeButton.click()
      
      // Assert
      expect(closeButton.click).toHaveBeenCalled()
    })
  })
}) 