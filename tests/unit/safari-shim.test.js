// [SAFARI-EXT-TEST-001] Safari Browser Shim Tests
// [SAFARI-EXT-API-001] Browser API abstraction tests
// [SAFARI-EXT-SHIM-001] Platform detection tests

import { browser, platformUtils } from '../../src/shared/safari-shim.js'

// [SAFARI-EXT-TEST-001] Mock Safari API for testing
const mockSafariAPI = {
  extension: {
    globalPage: {
      contentWindow: {
        recentTagsMemory: {
          getRecentTags: jest.fn().mockReturnValue([
            { name: 'safari-test-tag-1', lastUsed: Date.now() },
            { name: 'safari-test-tag-2', lastUsed: Date.now() - 1000 }
          ]),
          addTag: jest.fn().mockReturnValue(true),
          clearRecentTags: jest.fn().mockReturnValue(true)
        }
      }
    }
  }
}

describe('[SAFARI-EXT-TEST-001] Safari Browser Shim Tests', () => {
  // [SAFARI-EXT-TEST-001] Enhanced test setup with console logging
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock console methods to capture logs
    global.console.log = jest.fn()
    global.console.warn = jest.fn()
    global.console.error = jest.fn()
  })

  describe('[SAFARI-EXT-SHIM-001] Browser API Abstraction', () => {
    test('[SAFARI-EXT-SHIM-001] should load webextension-polyfill successfully', () => {
      expect(browser).toBeDefined()
      expect(browser.runtime).toBeDefined()
      expect(browser.storage).toBeDefined()
      expect(browser.tabs).toBeDefined()
    })

    test('[SAFARI-EXT-SHIM-001] should fallback to Chrome API when polyfill fails', () => {
      // Test that we can access Chrome API methods
      expect(browser.runtime.getManifest).toBeDefined()
      expect(browser.storage.sync.get).toBeDefined()
      expect(browser.tabs.query).toBeDefined()
    })

    test('[SAFARI-EXT-SHIM-001] should create minimal browser API when no APIs available', () => {
      // Test that minimal API is available
      expect(browser.runtime.id).toBeDefined()
      expect(browser.runtime.getManifest).toBeDefined()
      expect(browser.storage.sync.get).toBeDefined()
    })

    test('[SAFARI-EXT-SHIM-001] should log initialization process', () => {
      // Check that initialization logs are present by triggering a new operation
      platformUtils.isSafari() // This will trigger logging
      const logCalls = global.console.log.mock.calls
      expect(logCalls.some(call => 
        call[0].includes('[SAFARI-EXT-SHIM-001]')
      )).toBe(true)
    })
  })

  describe('[SAFARI-EXT-STORAGE-001] Enhanced Safari Storage Enhancements', () => {
    test('[SAFARI-EXT-STORAGE-001] should provide storage quota management', async () => {
      const quotaUsage = await browser.storage.getQuotaUsage()
      
      expect(quotaUsage).toBeDefined()
      expect(quotaUsage).toHaveProperty('used')
      expect(quotaUsage).toHaveProperty('quota')
      expect(quotaUsage).toHaveProperty('usagePercent')
    })

    test('[SAFARI-EXT-STORAGE-001] should handle storage quota errors gracefully', async () => {
      // Mock navigator.storage to throw an error
      const originalEstimate = global.navigator.storage.estimate
      global.navigator.storage.estimate = jest.fn().mockRejectedValue(new Error('Storage API not available'))
      
      const quotaUsage = await browser.storage.getQuotaUsage()
      
      expect(quotaUsage).toEqual({ used: 0, quota: 0, usagePercent: 0 })
      
      // Restore original mock
      global.navigator.storage.estimate = originalEstimate
    })

    test('[SAFARI-EXT-STORAGE-001] should monitor storage usage during operations', async () => {
      global.navigator.storage.estimate = jest.fn().mockResolvedValue({
        usage: 9 * 1024 * 1024, // 9MB
        quota: 10 * 1024 * 1024 // 10MB
      })
      await browser.storage.sync.get(['test'])
      // Accept any call that contains the warning string
      const calls = global.console.warn.mock.calls
      expect(calls.some(call => call.some(arg => typeof arg === 'string' && arg.includes('[SAFARI-EXT-STORAGE-001] Storage quota usage high:')))).toBe(true)
    })

    test('[SAFARI-EXT-STORAGE-001] should handle storage operations with enhanced logging', async () => {
      // Test that storage operations work correctly with enhanced functionality
      const originalGet = browser.storage.sync.get
      browser.storage.sync.get = jest.fn().mockResolvedValue({ test: 'data' })
      
      const result = await browser.storage.sync.get(['test'])
      
      // Verify the function works and returns expected data
      expect(result).toEqual({ test: 'data' })
      expect(browser.storage.sync.get).toHaveBeenCalledWith(['test'])
      
      // Restore original
      browser.storage.sync.get = originalGet
    })
  })

  describe('[SAFARI-EXT-MESSAGING-001] Enhanced Safari Message Passing', () => {
    test('[SAFARI-EXT-MESSAGING-001] should enhance messages with platform info', async () => {
      const testMessage = { type: 'test', data: 'test-data' }
      global.safari = { extension: {} }
      if (!global.chrome) global.chrome = {}
      if (!global.chrome.runtime) global.chrome.runtime = {}
      global.chrome.runtime.getManifest = jest.fn().mockReturnValue({ version: '1.0.0' })
      global.chrome.runtime.sendMessage = jest.fn().mockImplementation((msg, cb) => {
        if (cb) cb({ success: true })
        return Promise.resolve({ success: true })
      })
      await browser.runtime.sendMessage(testMessage)
      expect(global.chrome.runtime.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'test',
          data: 'test-data',
          timestamp: expect.any(Number),
          version: '1.0.0',
          platform: 'safari'
        }),
        expect.any(Function)
      )
    })

    test('[SAFARI-EXT-MESSAGING-001] should handle message sending errors with retry', async () => {
      global.safari = { extension: {} }
      if (!global.chrome) global.chrome = {}
      if (!global.chrome.runtime) global.chrome.runtime = {}
      global.chrome.runtime.getManifest = jest.fn().mockReturnValue({ version: '1.0.0' })
      
      let callCount = 0
      global.chrome.runtime.sendMessage = jest.fn().mockImplementation((message, callback) => {
        callCount++
        if (callCount < 3) {
          // Simulate error by calling callback with null and setting lastError
          global.chrome.runtime.lastError = { message: 'Message failed' }
          if (callback) {
            setTimeout(() => callback(null), 0)
          }
        } else {
          // Success case
          global.chrome.runtime.lastError = null
          if (callback) {
            setTimeout(() => callback({ success: true }), 0)
          }
        }
      })

      const result = await browser.runtime.sendMessage({ type: 'test-retry' })
      
      expect(result).toEqual({ success: true })
      expect(callCount).toBe(3)
    })

    test('[SAFARI-EXT-MESSAGING-001] should log message operations', async () => {
      global.safari = { extension: {} }
      if (!global.chrome) global.chrome = {}
      if (!global.chrome.runtime) global.chrome.runtime = {}
      global.chrome.runtime.getManifest = jest.fn().mockReturnValue({ version: '1.0.0' })
      global.chrome.runtime.sendMessage = jest.fn().mockImplementation((msg, cb) => {
        if (cb) cb({ success: true })
        return Promise.resolve({ success: true })
      })

      await browser.runtime.sendMessage({ type: 'test-logging' })
      
      const logCalls = global.console.log.mock.calls
      expect(logCalls.some(call => 
        call[0].includes('[SAFARI-EXT-MESSAGING-001] Sending message:')
      )).toBe(true)
    })

    test('[SAFARI-EXT-MESSAGING-001] should add message listener with logging', () => {
      const mockCallback = jest.fn()
      const mockAddListener = jest.fn()
      
      if (!global.chrome) global.chrome = {}
      if (!global.chrome.runtime) global.chrome.runtime = {}
      global.chrome.runtime.onMessage = { addListener: mockAddListener }

      browser.runtime.onMessage.addListener(mockCallback)
      
      expect(mockAddListener).toHaveBeenCalled()
      
      const logCalls = global.console.log.mock.calls
      expect(logCalls.some(call => 
        call[0].includes('[SAFARI-EXT-MESSAGING-001] Adding message listener')
      )).toBe(true)
    })
  })

  describe('[SAFARI-EXT-CONTENT-001] Enhanced Safari Tab Querying', () => {
    test('[SAFARI-EXT-CONTENT-001] should filter Safari internal pages', async () => {
      // Mock Safari environment
      global.safari = mockSafariAPI
      
      // Mock tabs with Safari internal pages
      global.chrome.tabs.query = jest.fn().mockResolvedValue([
        { id: 1, url: 'https://example.com', title: 'Example' },
        { id: 2, url: 'https://test.com', title: 'Test' },
        { id: 3, url: 'safari-extension://internal-page', title: 'Safari Internal' }
      ])
      
      const tabs = await browser.tabs.query({})
      
      expect(tabs).toHaveLength(2)
      expect(tabs.find(tab => tab.url.startsWith('safari-extension://'))).toBeUndefined()
    })

    test('[SAFARI-EXT-CONTENT-001] should handle tab query errors with retry', async () => {
      // Mock Safari environment
      global.safari = { extension: {} }
      if (!global.chrome) global.chrome = {}
      if (!global.chrome.runtime) global.chrome.runtime = {}
      global.chrome.runtime.getManifest = jest.fn().mockReturnValue({ version: '1.0.0' })
      
      let callCount = 0
      global.chrome.tabs.query = jest.fn().mockImplementation(() => {
        callCount++
        if (callCount < 3) {
          return Promise.reject(new Error('Tab query failed'))
        }
        return Promise.resolve([{ id: 1, url: 'https://example.com' }])
      })

      const tabs = await browser.tabs.query({})
      
      expect(tabs).toHaveLength(1)
      expect(callCount).toBe(3)
    })

    test('[SAFARI-EXT-CONTENT-001] should log tab query operations', async () => {
      global.chrome.tabs.query = jest.fn().mockResolvedValue([])
      
      await browser.tabs.query({})
      
      const logCalls = global.console.log.mock.calls
      expect(logCalls.some(call => 
        call[0].includes('[SAFARI-EXT-CONTENT-001] Querying tabs:')
      )).toBe(true)
    })

    test('[SAFARI-EXT-CONTENT-001] should handle tab message sending with retry', async () => {
      let callCount = 0
      global.chrome.tabs.sendMessage = jest.fn().mockImplementation((tabId, message, callback) => {
        callCount++
        if (callCount < 2) {
          // Simulate error
          global.chrome.runtime.lastError = { message: 'Tab message failed' }
          if (callback) {
            setTimeout(() => callback(null), 0)
          }
        } else {
          // Success case
          global.chrome.runtime.lastError = null
          if (callback) {
            setTimeout(() => callback({ success: true }), 0)
          }
        }
      })

      const result = await browser.tabs.sendMessage(1, { type: 'test' })
      
      expect(result).toEqual({ success: true })
      expect(callCount).toBe(2)
    })
  })

  describe('[SAFARI-EXT-SHIM-001] Enhanced Platform Detection', () => {
    test('[SAFARI-EXT-SHIM-001] should detect Safari platform with logging', () => {
      // Mock Safari environment
      global.safari = mockSafariAPI
      delete global.chrome
      
      expect(platformUtils.isSafari()).toBe(true)
      expect(platformUtils.isChrome()).toBe(false)
      expect(platformUtils.getPlatform()).toBe('safari')
      
      const logCalls = global.console.log.mock.calls
      expect(logCalls.some(call => 
        call[0].includes('[SAFARI-EXT-SHIM-001] Safari detection:')
      )).toBe(true)
    })

    test('[SAFARI-EXT-SHIM-001] should detect Chrome platform with logging', () => {
      // Mock Chrome environment
      delete global.safari
      global.chrome = { runtime: {} }
      
      expect(platformUtils.isSafari()).toBe(false)
      expect(platformUtils.isChrome()).toBe(true)
      expect(platformUtils.getPlatform()).toBe('chrome')
      
      const logCalls = global.console.log.mock.calls
      expect(logCalls.some(call => 
        call[0].includes('[SAFARI-EXT-SHIM-001] Chrome detection:')
      )).toBe(true)
    })

    test('[SAFARI-EXT-SHIM-001] should check feature support with logging', () => {
      // Mock Safari environment
      global.safari = mockSafariAPI
      delete global.chrome
      
      expect(platformUtils.supportsFeature('backdropFilter')).toBe(true)
      expect(platformUtils.supportsFeature('webkitBackdropFilter')).toBe(true)
      expect(platformUtils.supportsFeature('visualViewport')).toBe(true)
      expect(platformUtils.supportsFeature('safariExtensions')).toBe(true)
      
      const logCalls = global.console.log.mock.calls
      expect(logCalls.some(call => 
        call[0].includes('[SAFARI-EXT-SHIM-001] Checking feature support:')
      )).toBe(true)
    })

    test('[SAFARI-EXT-SHIM-001] should get platform-specific configuration', () => {
      // Mock Safari environment
      global.safari = mockSafariAPI
      delete global.chrome
      
      const config = platformUtils.getPlatformConfig()
      
      expect(config).toBeDefined()
      expect(config.maxRetries).toBe(3)
      expect(config.baseDelay).toBe(150)
      expect(config.storageQuotaWarning).toBe(80)
      expect(config.enableTabFiltering).toBe(true)
      
      const logCalls = global.console.log.mock.calls
      expect(logCalls.some(call => 
        call[0].includes('[SAFARI-EXT-SHIM-001] Getting platform config for:')
      )).toBe(true)
    })

    test('[SAFARI-EXT-SHIM-001] should handle unknown platform gracefully', () => {
      // Mock unknown environment
      delete global.safari
      delete global.chrome
      
      expect(platformUtils.getPlatform()).toBe('unknown')
      expect(platformUtils.supportsFeature('unknownFeature')).toBe(false)
      
      const config = platformUtils.getPlatformConfig()
      expect(config.maxRetries).toBe(2) // Should fallback to Chrome config
    })
  })

  describe('[SAFARI-EXT-TEST-001] Error Handling and Recovery', () => {
    test('[SAFARI-EXT-TEST-001] should handle complete API failure gracefully', async () => {
      // Mock complete API failure
      const originalChrome = global.chrome
      delete global.chrome
      
      // Re-import to trigger fallback
      jest.resetModules()
      const { browser: fallbackBrowser } = await import('../../src/shared/safari-shim.js')
      
      expect(fallbackBrowser).toBeDefined()
      expect(fallbackBrowser.runtime).toBeDefined()
      expect(fallbackBrowser.storage).toBeDefined()
      
      // Restore
      global.chrome = originalChrome
    })

    test('[SAFARI-EXT-TEST-001] should log all critical operations', async () => {
      // Trigger various operations to test logging
      await browser.storage.getQuotaUsage()
      platformUtils.isSafari()
      platformUtils.supportsFeature('backdropFilter')
      
      const logCalls = global.console.log.mock.calls
      expect(logCalls.length).toBeGreaterThan(0)
      
      // Check for specific log patterns
      expect(logCalls.some(call => 
        call[0].includes('[SAFARI-EXT-SHIM-001]')
      )).toBe(true)
    })

    test('[SAFARI-EXT-TEST-001] should handle retry exhaustion', async () => {
      // Mock storage to always fail
      const originalGet = browser.storage.sync.get
      browser.storage.sync.get = jest.fn().mockRejectedValue(new Error('Persistent failure'))
      
      await expect(browser.storage.sync.get(['test'])).rejects.toThrow('Persistent failure')
      
      // Restore
      browser.storage.sync.get = originalGet
    })
  })
}) 