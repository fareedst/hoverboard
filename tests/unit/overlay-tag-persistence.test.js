/**
 * [IMMUTABLE-REQ-TAG-004] - Overlay tag persistence unit tests
 * Tests for overlay window tag persistence functionality
 */

import { jest } from '@jest/globals'

// Mock MessageClient
const mockMessageService = {
  sendMessage: jest.fn()
}

// Mock document and window
const mockDocument = {
  createElement: jest.fn((tagName) => ({
    tagName,
    style: {},
    className: '',
    textContent: '',
    innerHTML: '',
    addEventListener: jest.fn(),
    onclick: null,
    ondblclick: null,
    appendChild: jest.fn(),
    removeChild: jest.fn(),
    parentNode: null,
    contains: jest.fn(() => false),
    getBoundingClientRect: jest.fn(() => ({ width: 300, height: 200 })),
    setAttribute: jest.fn(),
    removeAttribute: jest.fn(),
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
      contains: jest.fn(() => false)
    }
  })),
  getElementById: jest.fn(() => null),
  body: {
    appendChild: jest.fn(),
    removeChild: jest.fn()
  }
}

// Mock window
global.window = {
  location: {
    href: 'https://example.com'
  },
  innerWidth: 1920,
  innerHeight: 1080,
  pageXOffset: 0,
  pageYOffset: 0,
  HOVERBOARD_DEBUG: true
}

// Mock document
global.document = mockDocument

// Mock chrome runtime
global.chrome = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn()
    }
  }
}

describe('[IMMUTABLE-REQ-TAG-004] Overlay Tag Persistence', () => {
  let OverlayManager
  let overlayManager

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()
    
    // Mock the MessageClient import
    jest.doMock('../../../src/features/content/message-client.js', () => ({
      MessageClient: jest.fn(() => mockMessageService)
    }))

    // Import the class after mocking
    const module = require('../../../src/features/content/overlay-manager.js')
    OverlayManager = module.default || module.OverlayManager || module
    
    // Create overlay manager instance
    overlayManager = new OverlayManager(mockDocument, {
      overlayTransparencyMode: 'opaque',
      overlayPositionMode: 'default',
      overlayAdaptiveVisibility: false
    })
  })

  describe('[IMMUTABLE-REQ-TAG-004] Tag Input Persistence', () => {
    test('[IMMUTABLE-REQ-TAG-004] Should persist tag from new tag input', async () => {
      // [IMMUTABLE-REQ-TAG-004] - Mock successful message response
      mockMessageService.sendMessage.mockResolvedValue({
        success: true,
        data: { result_code: 'done' }
      })

      // [IMMUTABLE-REQ-TAG-004] - Create mock content with bookmark
      const content = {
        bookmark: {
          url: 'https://example.com',
          description: 'Test Page',
          tags: ['existing-tag']
        },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }

      // [IMMUTABLE-REQ-TAG-004] - Mock tag input element
      const tagInput = {
        value: 'test-tag',
        addEventListener: jest.fn((event, callback) => {
          if (event === 'keypress') {
            // Simulate Enter key press
            callback({ key: 'Enter' })
          }
        })
      }

      // [IMMUTABLE-REQ-TAG-004] - Mock document.createElement to return our tag input
      mockDocument.createElement.mockImplementation((tagName) => {
        if (tagName === 'input') {
          return tagInput
        }
        return {
          tagName,
          style: {},
          className: '',
          textContent: '',
          innerHTML: '',
          addEventListener: jest.fn(),
          onclick: null,
          ondblclick: null,
          appendChild: jest.fn(),
          removeChild: jest.fn(),
          parentNode: null,
          contains: jest.fn(() => false),
          getBoundingClientRect: jest.fn(() => ({ width: 300, height: 200 })),
          setAttribute: jest.fn(),
          removeAttribute: jest.fn(),
          classList: {
            add: jest.fn(),
            remove: jest.fn(),
            contains: jest.fn(() => false)
          }
        }
      })

      // [IMMUTABLE-REQ-TAG-004] - Call show method to trigger tag input creation
      overlayManager.show(content)

      // [IMMUTABLE-REQ-TAG-004] - Verify message was sent
      expect(mockMessageService.sendMessage).toHaveBeenCalledWith({
        type: 'saveTag',
        data: {
          url: 'https://example.com',
          value: 'test-tag',
          description: 'Test Page'
        }
      })

      // [IMMUTABLE-REQ-TAG-004] - Verify tag was added to local content
      expect(content.bookmark.tags).toContain('test-tag')
    })

    test('[IMMUTABLE-REQ-TAG-004] Should handle tag persistence errors', async () => {
      // [IMMUTABLE-REQ-TAG-004] - Mock failed message response
      mockMessageService.sendMessage.mockRejectedValue(new Error('Network error'))

      // [IMMUTABLE-REQ-TAG-004] - Create mock content
      const content = {
        bookmark: {
          url: 'https://example.com',
          description: 'Test Page',
          tags: []
        },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }

      // [IMMUTABLE-REQ-TAG-004] - Mock tag input element
      const tagInput = {
        value: 'test-tag',
        addEventListener: jest.fn((event, callback) => {
          if (event === 'keypress') {
            callback({ key: 'Enter' })
          }
        })
      }

      mockDocument.createElement.mockImplementation((tagName) => {
        if (tagName === 'input') {
          return tagInput
        }
        return {
          tagName,
          style: {},
          className: '',
          textContent: '',
          innerHTML: '',
          addEventListener: jest.fn(),
          onclick: null,
          ondblclick: null,
          appendChild: jest.fn(),
          removeChild: jest.fn(),
          parentNode: null,
          contains: jest.fn(() => false),
          getBoundingClientRect: jest.fn(() => ({ width: 300, height: 200 })),
          setAttribute: jest.fn(),
          removeAttribute: jest.fn(),
          classList: {
            add: jest.fn(),
            remove: jest.fn(),
            contains: jest.fn(() => false)
          }
        }
      })

      // [IMMUTABLE-REQ-TAG-004] - Call show method
      overlayManager.show(content)

      // [IMMUTABLE-REQ-TAG-004] - Verify error handling
      expect(mockMessageService.sendMessage).toHaveBeenCalled()
    })
  })

  describe('[IMMUTABLE-REQ-TAG-004] Recent Tags Persistence', () => {
    test('[IMMUTABLE-REQ-TAG-004] Should persist tag from recent tags', async () => {
      // [IMMUTABLE-REQ-TAG-004] - Mock successful message response
      mockMessageService.sendMessage.mockResolvedValue({
        success: true,
        data: { result_code: 'done' }
      })

      // [IMMUTABLE-REQ-TAG-004] - Create mock content
      const content = {
        bookmark: {
          url: 'https://example.com',
          description: 'Test Page',
          tags: []
        },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }

      // [IMMUTABLE-REQ-TAG-004] - Mock recent tag element
      const recentTagElement = {
        textContent: 'recent-tag',
        onclick: null,
        addEventListener: jest.fn(),
        appendChild: jest.fn()
      }

      mockDocument.createElement.mockImplementation((tagName) => {
        if (tagName === 'span') {
          return recentTagElement
        }
        return {
          tagName,
          style: {},
          className: '',
          textContent: '',
          innerHTML: '',
          addEventListener: jest.fn(),
          onclick: null,
          ondblclick: null,
          appendChild: jest.fn(),
          removeChild: jest.fn(),
          parentNode: null,
          contains: jest.fn(() => false),
          getBoundingClientRect: jest.fn(() => ({ width: 300, height: 200 })),
          setAttribute: jest.fn(),
          removeAttribute: jest.fn(),
          classList: {
            add: jest.fn(),
            remove: jest.fn(),
            contains: jest.fn(() => false)
          }
        }
      })

      // [IMMUTABLE-REQ-TAG-004] - Call show method to create recent tags
      overlayManager.show(content)

      // [IMMUTABLE-REQ-TAG-004] - Simulate recent tag click
      if (recentTagElement.onclick) {
        await recentTagElement.onclick()
      }

      // [IMMUTABLE-REQ-TAG-004] - Verify message was sent
      expect(mockMessageService.sendMessage).toHaveBeenCalledWith({
        type: 'saveTag',
        data: {
          url: 'https://example.com',
          value: 'recent-tag',
          description: 'Test Page'
        }
      })
    })
  })

  describe('[IMMUTABLE-REQ-TAG-004] Message Display', () => {
    test('[IMMUTABLE-REQ-TAG-004] Should display success message', () => {
      // [IMMUTABLE-REQ-TAG-004] - Mock message element
      const messageElement = {
        style: {},
        textContent: '',
        parentNode: { removeChild: jest.fn() }
      }

      mockDocument.createElement.mockImplementation((tagName) => {
        if (tagName === 'div') {
          return messageElement
        }
        return {
          tagName,
          style: {},
          className: '',
          textContent: '',
          innerHTML: '',
          addEventListener: jest.fn(),
          onclick: null,
          ondblclick: null,
          appendChild: jest.fn(),
          removeChild: jest.fn(),
          parentNode: null,
          contains: jest.fn(() => false),
          getBoundingClientRect: jest.fn(() => ({ width: 300, height: 200 })),
          setAttribute: jest.fn(),
          removeAttribute: jest.fn(),
          classList: {
            add: jest.fn(),
            remove: jest.fn(),
            contains: jest.fn(() => false)
          }
        }
      })

      // [IMMUTABLE-REQ-TAG-004] - Call showMessage
      overlayManager.showMessage('Tag saved successfully', 'success')

      // [IMMUTABLE-REQ-TAG-004] - Verify message element was created
      expect(mockDocument.createElement).toHaveBeenCalledWith('div')
      expect(messageElement.textContent).toBe('Tag saved successfully')
    })

    test('[IMMUTABLE-REQ-TAG-004] Should display error message', () => {
      // [IMMUTABLE-REQ-TAG-004] - Mock message element
      const messageElement = {
        style: {},
        textContent: '',
        parentNode: { removeChild: jest.fn() }
      }

      mockDocument.createElement.mockImplementation((tagName) => {
        if (tagName === 'div') {
          return messageElement
        }
        return {
          tagName,
          style: {},
          className: '',
          textContent: '',
          innerHTML: '',
          addEventListener: jest.fn(),
          onclick: null,
          ondblclick: null,
          appendChild: jest.fn(),
          removeChild: jest.fn(),
          parentNode: null,
          contains: jest.fn(() => false),
          getBoundingClientRect: jest.fn(() => ({ width: 300, height: 200 })),
          setAttribute: jest.fn(),
          removeAttribute: jest.fn(),
          classList: {
            add: jest.fn(),
            remove: jest.fn(),
            contains: jest.fn(() => false)
          }
        }
      })

      // [IMMUTABLE-REQ-TAG-004] - Call showMessage
      overlayManager.showMessage('Failed to save tag', 'error')

      // [IMMUTABLE-REQ-TAG-004] - Verify message element was created
      expect(mockDocument.createElement).toHaveBeenCalledWith('div')
      expect(messageElement.textContent).toBe('Failed to save tag')
    })
  })

  describe('[IMMUTABLE-REQ-TAG-004] Content Refresh', () => {
    test('[IMMUTABLE-REQ-TAG-004] Should refresh overlay content', async () => {
      // [IMMUTABLE-REQ-TAG-004] - Mock successful bookmark response
      mockMessageService.sendMessage.mockResolvedValue({
        success: true,
        data: {
          url: 'https://example.com',
          description: 'Updated Test Page',
          tags: ['existing-tag', 'new-tag']
        }
      })

      // [IMMUTABLE-REQ-TAG-004] - Mock show method
      overlayManager.show = jest.fn()

      // [IMMUTABLE-REQ-TAG-004] - Call refreshOverlayContent
      await overlayManager.refreshOverlayContent()

      // [IMMUTABLE-REQ-TAG-004] - Verify message was sent
      expect(mockMessageService.sendMessage).toHaveBeenCalledWith({
        type: 'getCurrentBookmark',
        data: {
          url: 'https://example.com'
        }
      })

      // [IMMUTABLE-REQ-TAG-004] - Verify show was called with updated content
      expect(overlayManager.show).toHaveBeenCalledWith({
        bookmark: {
          url: 'https://example.com',
          description: 'Updated Test Page',
          tags: ['existing-tag', 'new-tag']
        },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      })
    })

    test('[IMMUTABLE-REQ-TAG-004] Should handle refresh errors', async () => {
      // [IMMUTABLE-REQ-TAG-004] - Mock failed response
      mockMessageService.sendMessage.mockRejectedValue(new Error('Network error'))

      // [IMMUTABLE-REQ-TAG-004] - Mock show method
      overlayManager.show = jest.fn()

      // [IMMUTABLE-REQ-TAG-004] - Call refreshOverlayContent
      await overlayManager.refreshOverlayContent()

      // [IMMUTABLE-REQ-TAG-004] - Verify show was not called
      expect(overlayManager.show).not.toHaveBeenCalled()
    })
  })

  describe('[IMMUTABLE-REQ-TAG-004] Tag Validation', () => {
    test('[IMMUTABLE-REQ-TAG-004] Should validate valid tags', () => {
      // [IMMUTABLE-REQ-TAG-004] - Test valid tags
      expect(overlayManager.isValidTag('valid-tag')).toBe(true)
      expect(overlayManager.isValidTag('another_tag')).toBe(true)
      expect(overlayManager.isValidTag('tag with spaces')).toBe(true)
    })

    test('[IMMUTABLE-REQ-TAG-004] Should reject invalid tags', () => {
      // [IMMUTABLE-REQ-TAG-004] - Test invalid tags
      expect(overlayManager.isValidTag('')).toBe(false)
      expect(overlayManager.isValidTag('   ')).toBe(false)
      expect(overlayManager.isValidTag('tag<with>invalid')).toBe(false)
      expect(overlayManager.isValidTag('a'.repeat(51))).toBe(false) // Too long
      expect(overlayManager.isValidTag(null)).toBe(false)
      expect(overlayManager.isValidTag(undefined)).toBe(false)
    })
  })
}) 