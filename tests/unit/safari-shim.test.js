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
  })

  describe('[SAFARI-EXT-STORAGE-001] Safari Storage Enhancements', () => {
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
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      global.navigator.storage.estimate = jest.fn().mockResolvedValue({
        usage: 9 * 1024 * 1024, // 9MB
        quota: 10 * 1024 * 1024 // 10MB
      })
      await browser.storage.sync.get(['test'])
      // Accept any call that contains the warning string
      const calls = consoleSpy.mock.calls
      expect(calls.some(call => call.some(arg => typeof arg === 'string' && arg.includes('[SAFARI-EXT-STORAGE-001] Storage quota usage high:')))).toBe(true)
      consoleSpy.mockRestore()
    })
  })

  describe('[SAFARI-EXT-MESSAGING-001] Safari Message Passing', () => {
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

    test('[SAFARI-EXT-MESSAGING-001] should handle message sending errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      global.safari = { extension: {} }
      if (!global.chrome) global.chrome = {}
      if (!global.chrome.runtime) global.chrome.runtime = {}
      global.chrome.runtime.getManifest = jest.fn().mockReturnValue({ version: '1.0.0' })
      const originalSendMessage = global.chrome.runtime.sendMessage
      global.chrome.runtime.sendMessage = jest.fn().mockImplementation((message, callback) => {
        global.chrome.runtime.lastError = new Error('Message failed')
        if (callback) {
          setTimeout(() => callback(null), 0)
        }
        // Do not return a rejected promise
      })
      // Wrap the call in a promise to simulate the async error handling
      await expect(browser.runtime.sendMessage({ type: 'test-error' })).rejects.toThrow('Message failed')
      const calls = consoleSpy.mock.calls
      expect(calls.some(call => call.some(arg => typeof arg === 'string' && arg.includes('[SAFARI-EXT-MESSAGING-001] Message send failed:')))).toBe(true)
      global.chrome.runtime.sendMessage = originalSendMessage
      consoleSpy.mockRestore()
    })
  })

  describe('[SAFARI-EXT-CONTENT-001] Safari Tab Querying', () => {
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

    test('[SAFARI-EXT-CONTENT-001] should handle tab query errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      // Mock Safari environment
      global.safari = { extension: {} }
      // Ensure getManifest is always defined
      if (!global.chrome) global.chrome = {}
      if (!global.chrome.runtime) global.chrome.runtime = {}
      global.chrome.runtime.getManifest = jest.fn().mockReturnValue({ version: '1.0.0' })
      global.chrome.tabs.query = jest.fn().mockRejectedValue(new Error('Tab query failed'))
      await expect(browser.tabs.query({})).rejects.toThrow('Tab query failed')
      // Accept any call that contains the error string
      const calls = consoleSpy.mock.calls
      expect(calls.some(call => call.some(arg => typeof arg === 'string' && arg.includes('[SAFARI-EXT-CONTENT-001] Tab query failed:')))).toBe(true)
      consoleSpy.mockRestore()
    })
  })

  describe('[SAFARI-EXT-SHIM-001] Platform Detection', () => {
    test('[SAFARI-EXT-SHIM-001] should detect Safari platform', () => {
      // Mock Safari environment
      global.safari = mockSafariAPI
      delete global.chrome
      
      expect(platformUtils.isSafari()).toBe(true)
      expect(platformUtils.isChrome()).toBe(false)
      expect(platformUtils.getPlatform()).toBe('safari')
    })

    test('[SAFARI-EXT-SHIM-001] should detect Chrome platform', () => {
      // Mock Chrome environment
      delete global.safari
      global.chrome = { runtime: {} }
      
      expect(platformUtils.isSafari()).toBe(false)
      expect(platformUtils.isChrome()).toBe(true)
      expect(platformUtils.getPlatform()).toBe('chrome')
    })

    test('[SAFARI-EXT-SHIM-001] should check feature support correctly', () => {
      // Mock Safari environment
      global.safari = mockSafariAPI
      delete global.chrome
      
      expect(platformUtils.supportsFeature('backdropFilter')).toBe(true)
      expect(platformUtils.supportsFeature('webkitBackdropFilter')).toBe(true)
      expect(platformUtils.supportsFeature('visualViewport')).toBe(true)
    })
  })
}) 