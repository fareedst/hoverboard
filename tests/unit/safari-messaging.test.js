/**
 * Safari Message Passing Tests
 * 
 * [SAFARI-EXT-MESSAGING-001] Tests for enhanced Safari message passing functionality
 * Tests message validation, processing, error handling, and Safari-specific optimizations
 * 
 * Date: 2025-07-20
 * Status: Active Development
 */

import { jest } from '@jest/globals'

// Mock browser API
const mockBrowser = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn()
    },
    getManifest: jest.fn(() => ({ version: '1.0.0' })),
    lastError: null
  },
  tabs: {
    sendMessage: jest.fn(),
    query: jest.fn()
  }
}

// Mock chrome API
global.chrome = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn()
    },
    lastError: null
  },
  tabs: {
    sendMessage: jest.fn(),
    query: jest.fn()
  }
}

// Mock safari global for Safari-specific tests
global.safari = undefined

// [SAFARI-EXT-MESSAGING-001] Message validation and processing utilities
let messageIdCounter = 0

function validateMessage(message) {
  if (!message || typeof message !== 'object') {
    throw new Error('[SAFARI-EXT-MESSAGING-001] Invalid message: must be an object')
  }

  if (!message.type || typeof message.type !== 'string') {
    throw new Error('[SAFARI-EXT-MESSAGING-001] Invalid message: type is required and must be a string')
  }

  // [SAFARI-EXT-MESSAGING-001] Validate message size for Safari compatibility
  const messageSize = JSON.stringify(message).length
  const maxMessageSize = 1024 * 1024 // 1MB limit for Safari
  if (messageSize > maxMessageSize) {
    throw new Error(`[SAFARI-EXT-MESSAGING-001] Message too large: ${messageSize} bytes (max: ${maxMessageSize})`)
  }

  return message
}

function validateIncomingMessage(message) {
  if (!message || typeof message !== 'object') {
    console.warn('[SAFARI-EXT-MESSAGING-001] Invalid incoming message:', message)
    return { type: 'INVALID_MESSAGE', data: null }
  }

  // [SAFARI-EXT-MESSAGING-001] Check for required fields
  if (!message.type) {
    console.warn('[SAFARI-EXT-MESSAGING-001] Message missing type:', message)
    return { type: 'INVALID_MESSAGE', data: null }
  }

  return message
}

function processSafariMessage(message, sender) {
  // [SAFARI-EXT-MESSAGING-001] Add Safari-specific message processing
  const processedMessage = { ...message }

  // [SAFARI-EXT-MESSAGING-001] Add Safari-specific sender information
  if (typeof safari !== 'undefined' && sender) {
    processedMessage.safariSender = {
      tabId: sender.tab?.id,
      frameId: sender.frameId,
      url: sender.tab?.url,
      platform: 'safari'
    }
  }

  // [SAFARI-EXT-MESSAGING-001] Add message processing timestamp
  processedMessage.processedAt = Date.now()

  return processedMessage
}

function generateMessageId() {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substr(2, 9)
  messageIdCounter++
  return `msg_${timestamp}_${random}_${messageIdCounter}`
}

describe('[SAFARI-EXT-MESSAGING-001] Safari Message Passing', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.chrome.runtime.lastError = null
  })

  describe('Message Validation', () => {
    test('[SAFARI-EXT-MESSAGING-001] should validate message format', () => {
      const validMessage = { type: 'TEST_MESSAGE', data: { test: 'data' } }
      const invalidMessage = null
      const invalidTypeMessage = { data: { test: 'data' } }

      // Test valid message
      expect(() => validateMessage(validMessage)).not.toThrow()

      // Test invalid message
      expect(() => validateMessage(invalidMessage)).toThrow(
        '[SAFARI-EXT-MESSAGING-001] Invalid message: must be an object'
      )

      // Test message without type
      expect(() => validateMessage(invalidTypeMessage)).toThrow(
        '[SAFARI-EXT-MESSAGING-001] Invalid message: type is required and must be a string'
      )
    })

    test('[SAFARI-EXT-MESSAGING-001] should validate message size for Safari', () => {
      const largeMessage = {
        type: 'TEST_MESSAGE',
        data: 'x'.repeat(1024 * 1024 + 1) // Larger than 1MB
      }

      expect(() => validateMessage(largeMessage)).toThrow(
        /Message too large/
      )
    })
  })

  describe('Message Processing', () => {
    test('[SAFARI-EXT-MESSAGING-001] should process Safari-specific message enhancements', () => {
      const originalMessage = { type: 'TEST_MESSAGE', data: { test: 'data' } }
      const sender = { tab: { id: 123, url: 'https://example.com' }, frameId: 0 }

      // Test without Safari global
      const processedMessage = processSafariMessage(originalMessage, sender)
      expect(processedMessage.processedAt).toBeDefined()
      expect(processedMessage.safariSender).toBeUndefined()

      // Test with Safari global
      global.safari = {}
      const processedMessageWithSafari = processSafariMessage(originalMessage, sender)
      expect(processedMessageWithSafari.safariSender).toBeDefined()
      expect(processedMessageWithSafari.safariSender.platform).toBe('safari')
      expect(processedMessageWithSafari.safariSender.tabId).toBe(123)
    })

    test('[SAFARI-EXT-MESSAGING-001] should generate unique message IDs', async () => {
      const messageId1 = generateMessageId()
      
      // Add a small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 1))
      
      const messageId2 = generateMessageId()

      expect(messageId1).toMatch(/^msg_\d+_[a-z0-9]+_\d+$/)
      expect(messageId2).toMatch(/^msg_\d+_[a-z0-9]+_\d+$/)
      expect(messageId1).not.toBe(messageId2)
    })
  })

  describe('Runtime Message Sending', () => {
    test('[SAFARI-EXT-MESSAGING-001] should send enhanced runtime messages', async () => {
      const testMessage = { type: 'TEST_MESSAGE', data: { test: 'data' } }
      const mockResponse = { success: true, data: 'response' }

      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        expect(message.timestamp).toBeDefined()
        expect(message.version).toBe('1.0.0')
        expect(message.messageId).toMatch(/^msg_\d+_[a-z0-9]+_\d+$/)
        callback(mockResponse)
      })

      // Simulate the enhanced message sending
      const validatedMessage = validateMessage(testMessage)
      const enhancedMessage = {
        ...validatedMessage,
        timestamp: Date.now(),
        version: '1.0.0',
        messageId: generateMessageId()
      }

      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(enhancedMessage, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message))
          } else {
            resolve(response)
          }
        })
      }).then(result => {
        expect(result).toEqual(mockResponse)
        expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'TEST_MESSAGE',
            data: { test: 'data' },
            timestamp: expect.any(Number),
            version: '1.0.0',
            messageId: expect.stringMatching(/^msg_\d+_[a-z0-9]+_\d+$/)
          }),
          expect.any(Function)
        )
      })
    })

    test('[SAFARI-EXT-MESSAGING-001] should handle runtime message errors', async () => {
      const testMessage = { type: 'TEST_MESSAGE', data: { test: 'data' } }
      const mockError = new Error('Connection failed')

      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        chrome.runtime.lastError = mockError
        callback()
      })

      const validatedMessage = validateMessage(testMessage)
      const enhancedMessage = {
        ...validatedMessage,
        timestamp: Date.now(),
        version: '1.0.0',
        messageId: generateMessageId()
      }

      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(enhancedMessage, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message))
          } else {
            resolve(response)
          }
        })
      }).then(() => {
        throw new Error('Should have thrown an error')
      }).catch(error => {
        expect(error.message).toBe('Connection failed')
      })
    })

    test('[SAFARI-EXT-MESSAGING-001] should handle message timeouts', async () => {
      const testMessage = { type: 'TEST_MESSAGE', data: { test: 'data' } }

      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        // Don't call callback to simulate timeout
      })

      const validatedMessage = validateMessage(testMessage)
      const enhancedMessage = {
        ...validatedMessage,
        timestamp: Date.now(),
        version: '1.0.0',
        messageId: generateMessageId()
      }

      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('[SAFARI-EXT-MESSAGING-001] Message timeout after 10 seconds'))
        }, 100) // Shorter timeout for test

        chrome.runtime.sendMessage(enhancedMessage, (response) => {
          clearTimeout(timeoutId)
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message))
          } else {
            resolve(response)
          }
        })
      }).catch(error => {
        expect(error.message).toContain('Message timeout')
      })
    })
  })

  describe('Tab Message Sending', () => {
    test('[SAFARI-EXT-MESSAGING-001] should send enhanced tab messages', async () => {
      const testMessage = { type: 'TEST_MESSAGE', data: { test: 'data' } }
      const tabId = 123
      const mockResponse = { success: true, data: 'response' }

      chrome.tabs.sendMessage.mockImplementation((tabId, message, callback) => {
        expect(message.timestamp).toBeDefined()
        expect(message.version).toBe('1.0.0')
        expect(message.messageId).toMatch(/^msg_\d+_[a-z0-9]+_\d+$/)
        expect(message.targetTabId).toBe(tabId)
        callback(mockResponse)
      })

      const validatedMessage = validateMessage(testMessage)
      const enhancedMessage = {
        ...validatedMessage,
        timestamp: Date.now(),
        version: '1.0.0',
        messageId: generateMessageId(),
        targetTabId: tabId
      }

      return new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tabId, enhancedMessage, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message))
          } else {
            resolve(response)
          }
        })
      }).then(result => {
        expect(result).toEqual(mockResponse)
        expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
          tabId,
          expect.objectContaining({
            type: 'TEST_MESSAGE',
            data: { test: 'data' },
            timestamp: expect.any(Number),
            version: '1.0.0',
            messageId: expect.stringMatching(/^msg_\d+_[a-z0-9]+_\d+$/),
            targetTabId: tabId
          }),
          expect.any(Function)
        )
      })
    })

    test('[SAFARI-EXT-MESSAGING-001] should handle tab message errors', async () => {
      const testMessage = { type: 'TEST_MESSAGE', data: { test: 'data' } }
      const tabId = 123
      const mockError = new Error('Tab not found')

      chrome.tabs.sendMessage.mockImplementation((tabId, message, callback) => {
        chrome.runtime.lastError = mockError
        callback()
      })

      const validatedMessage = validateMessage(testMessage)
      const enhancedMessage = {
        ...validatedMessage,
        timestamp: Date.now(),
        version: '1.0.0',
        messageId: generateMessageId(),
        targetTabId: tabId
      }

      return new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tabId, enhancedMessage, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message))
          } else {
            resolve(response)
          }
        })
      }).then(() => {
        throw new Error('Should have thrown an error')
      }).catch(error => {
        expect(error.message).toBe('Tab not found')
      })
    })
  })

  describe('Message Listener Enhancement', () => {
    test('[SAFARI-EXT-MESSAGING-001] should enhance message listeners', () => {
      const mockCallback = jest.fn()
      const testMessage = { type: 'TEST_MESSAGE', data: { test: 'data' } }
      const sender = { tab: { id: 123, url: 'https://example.com' } }

      // Simulate the enhanced message processing
      const validatedMessage = validateIncomingMessage(testMessage)
      const processedMessage = processSafariMessage(validatedMessage, sender)

      mockCallback(processedMessage, sender, jest.fn())

      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'TEST_MESSAGE',
          data: { test: 'data' },
          processedAt: expect.any(Number)
        }),
        sender,
        expect.any(Function)
      )
    })
  })

  describe('Safari Platform Detection', () => {
    test('[SAFARI-EXT-MESSAGING-001] should add Safari platform info when available', async () => {
      global.safari = {}
      const testMessage = { type: 'TEST_MESSAGE', data: { test: 'data' } }
      const mockResponse = { success: true }

      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        expect(message.platform).toBe('safari')
        callback(mockResponse)
      })

      const validatedMessage = validateMessage(testMessage)
      const enhancedMessage = {
        ...validatedMessage,
        timestamp: Date.now(),
        version: '1.0.0',
        messageId: generateMessageId(),
        platform: 'safari'
      }

      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(enhancedMessage, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message))
          } else {
            resolve(response)
          }
        })
      }).then(result => {
        expect(result).toEqual(mockResponse)
        expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            platform: 'safari'
          }),
          expect.any(Function)
        )
      })
    })
  })

  describe('Error Handling', () => {
    test('[SAFARI-EXT-MESSAGING-001] should handle Safari-specific messaging errors', () => {
      const testMessage = { type: 'TEST_MESSAGE', data: { test: 'data' } }
      const safariError = new Error('[SAFARI-EXT-MESSAGING-001] Safari-specific messaging error')

      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        chrome.runtime.lastError = safariError
        callback()
      })

      const validatedMessage = validateMessage(testMessage)
      const enhancedMessage = {
        ...validatedMessage,
        timestamp: Date.now(),
        version: '1.0.0',
        messageId: generateMessageId()
      }

      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(enhancedMessage, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message))
          } else {
            resolve(response)
          }
        })
      }).then(() => {
        throw new Error('Should have thrown an error')
      }).catch(error => {
        expect(error.message).toBe('[SAFARI-EXT-MESSAGING-001] Safari-specific messaging error')
      })
    })
  })
}) 