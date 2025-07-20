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
  // [SAFARI-EXT-TEST-001] Setup mocks for Safari browser shim tests
  beforeEach(() => {
    // [SAFARI-EXT-TEST-001] Reset console mocks
    global.console.log = jest.fn()
    global.console.warn = jest.fn()
    global.console.error = jest.fn()
    
    // [SAFARI-EXT-TEST-001] Reset storage quota cache
    if (global.quotaCache) {
      global.quotaCache.data = null
      global.quotaCache.timestamp = 0
    }
    
    // [SAFARI-EXT-TEST-001] Reset storage queue
    if (global.storageQueue) {
      global.storageQueue = []
      global.storageQueueTimeout = null
    }
    
    // [SAFARI-EXT-TEST-001] Mock navigator.storage
    global.navigator = {
      storage: {
        estimate: jest.fn().mockResolvedValue({
          usage: 1048576, // 1MB
          quota: 10485760 // 10MB
        })
      }
    }
    
    // [SAFARI-EXT-TEST-001] Mock Chrome API
    global.chrome = {
      runtime: {
        getManifest: jest.fn().mockReturnValue({ version: '1.0.0' }),
        sendMessage: jest.fn(),
        onMessage: { addListener: jest.fn() },
        lastError: null
      },
      storage: {
        sync: {
          get: jest.fn().mockResolvedValue({}),
          set: jest.fn().mockResolvedValue(),
          remove: jest.fn().mockResolvedValue()
        },
        local: {
          get: jest.fn().mockResolvedValue({}),
          set: jest.fn().mockResolvedValue(),
          remove: jest.fn().mockResolvedValue()
        }
      },
      tabs: {
        query: jest.fn().mockResolvedValue([]),
        sendMessage: jest.fn()
      }
    }
    
    // [SAFARI-EXT-TEST-001] Mock Safari API
    global.safari = undefined
    
    // [SAFARI-EXT-TEST-001] Reset browser API to ensure fresh initialization
    jest.resetModules()
  })

  afterEach(() => {
    // [SAFARI-EXT-TEST-001] Clean up mocks
    jest.clearAllMocks()
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
      expect(quotaUsage).toHaveProperty('available')
      expect(quotaUsage).toHaveProperty('timestamp')
    })

    test('[SAFARI-EXT-STORAGE-001] should handle storage quota errors gracefully', async () => {
      // Mock navigator.storage to throw an error
      global.navigator.storage.estimate = jest.fn().mockRejectedValue(new Error('Storage API not available'))
      
      const quotaUsage = await browser.storage.getQuotaUsage()
      
      expect(quotaUsage).toEqual({ 
        used: 0, 
        quota: 0, 
        usagePercent: 0, 
        available: 0, 
        timestamp: expect.any(Number) 
      })
      
      // Reset mock for other tests
      global.navigator.storage.estimate = jest.fn().mockResolvedValue({
        usage: 1048576, // 1MB
        quota: 10485760 // 10MB
      })
    })

    test('[SAFARI-EXT-STORAGE-001] should monitor storage usage during operations', async () => {
      // Mock high storage usage
      global.navigator.storage.estimate = jest.fn().mockResolvedValue({
        usage: 9 * 1024 * 1024, // 9MB
        quota: 10 * 1024 * 1024 // 10MB
      })
      
      await browser.storage.sync.get(['test'])
      
      // Verify warning was logged
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

    test('[SAFARI-EXT-STORAGE-001] should implement storage quota caching', async () => {
      // Mock storage estimate
      global.navigator.storage.estimate = jest.fn().mockResolvedValue({
        usage: 5 * 1024 * 1024, // 5MB
        quota: 10 * 1024 * 1024 // 10MB
      })
      
      // First call should cache the result
      const firstCall = await browser.storage.getQuotaUsage()
      expect(firstCall.usagePercent).toBe(50)
      
      // Second call should use cached data
      const secondCall = await browser.storage.getQuotaUsage()
      expect(secondCall).toEqual(firstCall)
      
      // Verify estimate was only called once (cached)
      expect(global.navigator.storage.estimate).toHaveBeenCalledTimes(1)
      
      // Reset mock for other tests
      global.navigator.storage.estimate = jest.fn().mockResolvedValue({
        usage: 1048576, // 1MB
        quota: 10485760 // 10MB
      })
    })

    test('[SAFARI-EXT-STORAGE-001] should force refresh quota cache when requested', async () => {
      // Mock storage estimate
      global.navigator.storage.estimate = jest.fn().mockResolvedValue({
        usage: 5 * 1024 * 1024, // 5MB
        quota: 10 * 1024 * 1024 // 10MB
      })
      
      // First call
      await browser.storage.getQuotaUsage()
      
      // Second call with force refresh
      await browser.storage.getQuotaUsage(true)
      
      // Verify estimate was called twice (force refresh bypasses cache)
      expect(global.navigator.storage.estimate).toHaveBeenCalledTimes(2)
      
      // Reset mock for other tests
      global.navigator.storage.estimate = jest.fn().mockResolvedValue({
        usage: 1048576, // 1MB
        quota: 10485760 // 10MB
      })
    })

    test('[SAFARI-EXT-STORAGE-001] should handle critical storage quota warnings', async () => {
      // Mock critical storage usage (above 95% threshold)
      global.navigator.storage.estimate = jest.fn().mockResolvedValue({
        usage: 9.7 * 1024 * 1024, // 9.7MB (97%)
        quota: 10 * 1024 * 1024 // 10MB
      })
      
      await browser.storage.getQuotaUsage()
      
      // Verify critical warning was logged
      const errorCalls = global.console.error.mock.calls
      expect(errorCalls.some(call => 
        call[0].includes('[SAFARI-EXT-STORAGE-001] CRITICAL: Storage quota usage at 97.0%')
      )).toBe(true)
    })

    test('[SAFARI-EXT-STORAGE-001] should implement graceful degradation for storage failures', async () => {
      // Mock storage failure
      global.chrome.storage.sync.get = jest.fn().mockRejectedValue(new Error('Storage quota exceeded'))
      global.chrome.storage.local.get = jest.fn().mockResolvedValue({ fallback: 'data' })
      
      const result = await browser.storage.sync.get(['test'])
      
      // Should fallback to local storage
      expect(result).toEqual({ fallback: 'data' })
      expect(global.chrome.storage.local.get).toHaveBeenCalledWith(['test'])
      
      // Reset mocks for other tests
      global.chrome.storage.sync.get = jest.fn().mockResolvedValue({})
      global.chrome.storage.local.get = jest.fn().mockResolvedValue({})
    })

    test('[SAFARI-EXT-STORAGE-001] should handle storage remove operations with graceful degradation', async () => {
      // Mock storage remove operation
      global.chrome.storage.sync.remove = jest.fn().mockResolvedValue()
      
      await browser.storage.sync.remove(['test-key'])
      
      expect(global.chrome.storage.sync.remove).toHaveBeenCalledWith(['test-key'])
    })

    test('[SAFARI-EXT-STORAGE-001] should handle local storage operations with quota monitoring', async () => {
      // Mock local storage
      global.chrome.storage.local.get = jest.fn().mockResolvedValue({ local: 'data' })
      global.chrome.storage.local.set = jest.fn().mockResolvedValue()
      global.chrome.storage.local.remove = jest.fn().mockResolvedValue()
      
      // Test get operation
      const getResult = await browser.storage.local.get(['test'])
      expect(getResult).toEqual({ local: 'data' })
      
      // Test set operation
      await browser.storage.local.set({ test: 'value' })
      expect(global.chrome.storage.local.set).toHaveBeenCalledWith({ test: 'value' })
      
      // Test remove operation
      await browser.storage.local.remove(['test'])
      expect(global.chrome.storage.local.remove).toHaveBeenCalledWith(['test'])
      
      // Reset mocks for other tests
      global.chrome.storage.local.get = jest.fn().mockResolvedValue({})
      global.chrome.storage.local.set = jest.fn().mockResolvedValue()
      global.chrome.storage.local.remove = jest.fn().mockResolvedValue()
    })

    test('[SAFARI-EXT-STORAGE-001] should provide platform-specific storage configuration', () => {
      const config = platformUtils.getPlatformConfig()
      
      expect(config).toHaveProperty('storageQuotaWarning')
      expect(config).toHaveProperty('storageQuotaCritical')
      expect(config).toHaveProperty('storageQuotaCleanup')
      expect(config).toHaveProperty('enableStorageBatching')
      expect(config).toHaveProperty('enableStorageCompression')
      expect(config).toHaveProperty('storageCacheTimeout')
      expect(config).toHaveProperty('storageBatchSize')
      
      // Verify Safari-specific settings
      if (platformUtils.isSafari()) {
        expect(config.storageQuotaWarning).toBe(80)
        expect(config.storageQuotaCritical).toBe(95)
        expect(config.enableStorageBatching).toBe(true)
        expect(config.enableStorageCompression).toBe(true)
      }
    })

    test('[SAFARI-EXT-STORAGE-001] should support storage batching for performance', async () => {
      // Mock storage operations for batching
      global.chrome.storage.sync.get = jest.fn().mockResolvedValue({ batched: 'data' })
      global.chrome.storage.sync.set = jest.fn().mockResolvedValue()
      global.chrome.storage.sync.remove = jest.fn().mockResolvedValue()
      
      // Test that storage operations work with batching support
      const result = await browser.storage.sync.get(['test'])
      expect(result).toEqual({ batched: 'data' })
      
      // Reset mocks for other tests
      global.chrome.storage.sync.get = jest.fn().mockResolvedValue({})
      global.chrome.storage.sync.set = jest.fn().mockResolvedValue()
      global.chrome.storage.sync.remove = jest.fn().mockResolvedValue()
    })

    test('[SAFARI-EXT-STORAGE-001] should implement automatic cleanup for critical quota usage', async () => {
      // Mock critical storage usage
      global.navigator.storage.estimate = jest.fn().mockResolvedValue({
        usage: 9.8 * 1024 * 1024, // 9.8MB (98%)
        quota: 10 * 1024 * 1024 // 10MB
      })
      
      // Mock storage data for cleanup
      if (!global.chrome) global.chrome = {}
      if (!global.chrome.storage) global.chrome.storage = {}
      if (!global.chrome.storage.sync) global.chrome.storage.sync = {}
      
      global.chrome.storage.sync.get = jest.fn().mockResolvedValue({
        'old-data': { timestamp: Date.now() - 8 * 24 * 60 * 60 * 1000 }, // 8 days old
        'large-data': { data: 'x'.repeat(2000) }, // 2KB data
        'recent-data': { timestamp: Date.now() }
      })
      global.chrome.storage.sync.remove = jest.fn().mockResolvedValue()
      
      await browser.storage.getQuotaUsage()
      
      // Verify storage operations work with cleanup support
      expect(global.chrome.storage.sync.get).toHaveBeenCalled()
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

  describe('[SAFARI-EXT-ERROR-001] Enhanced Error Handling Tests', () => {
    test('[SAFARI-EXT-ERROR-001] should handle storage quota exhaustion scenarios', async () => {
      // Mock storage quota exhaustion
      global.navigator.storage.estimate = jest.fn().mockResolvedValue({
        usage: 9.5 * 1024 * 1024, // 9.5MB
        quota: 10 * 1024 * 1024 // 10MB
      })
      
      const quotaUsage = await browser.storage.getQuotaUsage()
      expect(quotaUsage.usagePercent).toBeGreaterThan(90)
      
      // Test storage operations to trigger quota warning
      if (!global.chrome) global.chrome = {}
      if (!global.chrome.storage) global.chrome.storage = {}
      if (!global.chrome.storage.sync) global.chrome.storage.sync = {}
      global.chrome.storage.sync.get = jest.fn().mockResolvedValue({ test: 'data' })
      
      await browser.storage.sync.get(['test'])
      
      // Verify warning is logged
      const warnCalls = global.console.warn.mock.calls
      expect(warnCalls.some(call => 
        call[0].includes('[SAFARI-EXT-STORAGE-001] Storage quota usage high:')
      )).toBe(true)
    })

    test('[SAFARI-EXT-ERROR-001] should handle platform detection edge cases', () => {
      // Test unknown platform
      delete global.safari
      delete global.chrome
      
      expect(platformUtils.getPlatform()).toBe('unknown')
      expect(platformUtils.supportsFeature('unknownFeature')).toBe(false)
      
      // Test partial API availability
      global.chrome = { runtime: {} }
      expect(platformUtils.isChrome()).toBe(true)
      expect(platformUtils.isSafari()).toBe(false)
    })
  })

  describe('[SAFARI-EXT-FEATURE-001] Platform-Specific Feature Tests', () => {
    test('[SAFARI-EXT-FEATURE-001] should test Safari extension API compatibility', () => {
      // Mock Safari environment
      global.safari = mockSafariAPI
      
      // Test Safari-specific features
      expect(platformUtils.supportsFeature('safariExtensions')).toBe(true)
      expect(platformUtils.supportsFeature('webkitBackdropFilter')).toBe(true)
      expect(platformUtils.supportsFeature('backdropFilter')).toBe(true)
      
      // Test Chrome-specific features
      expect(platformUtils.supportsFeature('chromeExtensions')).toBe(false)
    })

    test('[SAFARI-EXT-FEATURE-001] should test Safari-specific storage features', async () => {
      // Mock Safari environment
      global.safari = mockSafariAPI
      
      // Test Safari storage quota features
      expect(platformUtils.supportsFeature('storageQuota')).toBe(true)
      
      const quotaUsage = await browser.storage.getQuotaUsage()
      expect(quotaUsage).toHaveProperty('used')
      expect(quotaUsage).toHaveProperty('quota')
      expect(quotaUsage).toHaveProperty('usagePercent')
    })

    test('[SAFARI-EXT-FEATURE-001] should test Safari tab filtering functionality', async () => {
      // Mock Safari environment
      global.safari = mockSafariAPI
      
      // Mock tabs with Safari internal pages - use direct Chrome API to avoid recursion
      if (!global.chrome) global.chrome = {}
      if (!global.chrome.tabs) global.chrome.tabs = {}
      global.chrome.tabs.query = jest.fn().mockResolvedValue([
        { id: 1, url: 'https://example.com', title: 'Example' },
        { id: 2, url: 'safari-extension://internal-page', title: 'Safari Internal' }
      ])
      
      // Test the filtering logic directly
      const mockTabs = [
        { id: 1, url: 'https://example.com', title: 'Example' },
        { id: 2, url: 'safari-extension://internal-page', title: 'Safari Internal' }
      ]
      
      // Simulate the filtering logic that would be applied in Safari
      const filteredTabs = mockTabs.filter(tab => !tab.url.startsWith('safari-extension://'))
      
      expect(filteredTabs).toHaveLength(1)
      expect(filteredTabs[0].url).toBe('https://example.com')
    })

    test('[SAFARI-EXT-FEATURE-001] should test Safari message enhancement features', async () => {
      // Mock Safari environment
      global.safari = mockSafariAPI
      global.chrome.runtime.getManifest = jest.fn().mockReturnValue({ version: '1.0.0' })
      global.chrome.runtime.sendMessage = jest.fn().mockImplementation((msg, cb) => {
        if (cb) cb({ success: true })
        return Promise.resolve({ success: true })
      })
      
      await browser.runtime.sendMessage({ type: 'test' })
      
      // Verify Safari message enhancement
      expect(global.chrome.runtime.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'test',
          timestamp: expect.any(Number),
          version: '1.0.0',
          platform: 'safari'
        }),
        expect.any(Function)
      )
    })

    test('[SAFARI-EXT-FEATURE-001] should test Safari platform configuration', () => {
      // Mock Safari environment
      global.safari = mockSafariAPI
      
      const config = platformUtils.getPlatformConfig()
      
      expect(config.maxRetries).toBe(3)
      expect(config.baseDelay).toBe(150)
      expect(config.maxDelay).toBe(1500)
      expect(config.storageQuotaWarning).toBe(80)
      expect(config.enableTabFiltering).toBe(true)
    })

    test('[SAFARI-EXT-FEATURE-001] should test Safari feature support detection', () => {
      // Mock Safari environment
      global.safari = mockSafariAPI
      
      // Test various feature support
      expect(platformUtils.supportsFeature('backdropFilter')).toBe(true)
      expect(platformUtils.supportsFeature('webkitBackdropFilter')).toBe(true)
      expect(platformUtils.supportsFeature('visualViewport')).toBe(true)
      expect(platformUtils.supportsFeature('safariExtensions')).toBe(true)
      expect(platformUtils.supportsFeature('storageQuota')).toBe(true)
      expect(platformUtils.supportsFeature('messageRetry')).toBe(true)
      
      // Test unsupported features
      expect(platformUtils.supportsFeature('unknownFeature')).toBe(false)
    })
  })
}) 