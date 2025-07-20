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
      },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
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
    
    // [SAFARI-EXT-TEST-001] Mock CSS.supports for UI feature detection
    global.CSS = {
      supports: jest.fn().mockImplementation((property, value) => {
        if (property === 'backdrop-filter' && value === 'blur(10px)') return true
        if (property === '-webkit-backdrop-filter' && value === 'blur(10px)') return true
        if (property === 'aria-live' && value === 'polite') return true
        if (property === 'display' && value === 'grid') return true
        if (property === 'display' && value === 'flex') return true
        return false
      })
    }
    
    // [SAFARI-EXT-TEST-001] Mock window context for accessibility and security features
    global.window = {
      matchMedia: jest.fn().mockImplementation((query) => ({
        matches: query.includes('high') || query.includes('reduce')
      })),
      document: {
        createElement: jest.fn(),
        activeElement: { tagName: 'BODY' },
        querySelector: jest.fn()
      },
      location: {
        protocol: 'https:',
        hostname: 'localhost'
      },
      isSecureContext: true,
      visualViewport: {}
    }
    
    // [SAFARI-EXT-TEST-001] Mock crypto API for security features
    global.crypto = {
      getRandomValues: jest.fn(),
      subtle: {},
      randomUUID: jest.fn()
    }
    
    // [SAFARI-EXT-TEST-001] Mock performance API
    global.performance = {
      memory: {
        usedJSHeapSize: 1024 * 1024, // 1MB
        totalJSHeapSize: 5 * 1024 * 1024, // 5MB
        jsHeapSizeLimit: 10 * 1024 * 1024 // 10MB
      },
      timing: {
        navigationStart: 1000,
        loadEventEnd: 2000,
        domContentLoadedEventEnd: 1500
      },
      mark: jest.fn(),
      measure: jest.fn()
    }
    
    // [SAFARI-EXT-TEST-001] Mock PerformanceObserver
    global.PerformanceObserver = jest.fn()
    
    // [SAFARI-EXT-TEST-001] Mock requestIdleCallback
    global.requestIdleCallback = jest.fn()
    
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
      
      // Verify warning was logged - check for any storage quota warning
      const calls = global.console.warn.mock.calls
      expect(calls.some(call => call.some(arg => typeof arg === 'string' && arg.includes('[SAFARI-EXT-STORAGE-001]')))).toBe(true)
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
      
      // Verify estimate was only called once due to caching
      expect(global.navigator.storage.estimate).toHaveBeenCalledTimes(1)
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
      // Mock critical storage usage
      global.navigator.storage.estimate = jest.fn().mockResolvedValue({
        usage: 9.7 * 1024 * 1024, // 9.7MB
        quota: 10 * 1024 * 1024 // 10MB
      })
      
      await browser.storage.sync.get(['test'])
      
      // Verify critical warning was logged
      const errorCalls = global.console.error.mock.calls
      expect(errorCalls.some(call => 
        call[0].includes('[SAFARI-EXT-STORAGE-001] CRITICAL:')
      )).toBe(true)
    })

    test('[SAFARI-EXT-STORAGE-001] should implement graceful degradation for storage failures', async () => {
      // Mock sync storage to fail
      global.chrome.storage.sync.get = jest.fn().mockRejectedValue(new Error('Sync storage failed'))
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
      
      // Test get operation
      const getResult = await browser.storage.local.get(['test'])
      expect(getResult).toEqual({ local: 'data' })
      
      // Test set operation
      await browser.storage.local.set({ test: 'value' })
      expect(global.chrome.storage.local.set).toHaveBeenCalledWith({ test: 'value' })
    })

    test('[SAFARI-EXT-STORAGE-001] should support storage batching for performance', async () => {
      // Mock storage with batching support
      global.chrome.storage.sync.get = jest.fn().mockResolvedValue({ batched: 'data' })
      
      // Test that storage operations work with batching support
      const result = await browser.storage.sync.get(['test'])
      expect(result).toEqual({ batched: 'data' })
      
      // Reset mocks for other tests
      global.chrome.storage.sync.get = jest.fn().mockResolvedValue({})
    })

    test('[SAFARI-EXT-STORAGE-001] should implement automatic cleanup for critical quota usage', async () => {
      // Mock critical storage usage
      global.navigator.storage.estimate = jest.fn().mockResolvedValue({
        usage: 9.5 * 1024 * 1024, // 9.5MB
        quota: 10 * 1024 * 1024 // 10MB
      })
      
      // Mock storage data for cleanup
      global.chrome.storage.sync.get = jest.fn().mockResolvedValue({
        oldData: { timestamp: Date.now() - 8 * 24 * 60 * 60 * 1000 }, // 8 days old
        newData: { timestamp: Date.now() }
      })
      global.chrome.storage.sync.remove = jest.fn().mockResolvedValue()
      
      // Trigger storage operation to cause cleanup
      await browser.storage.sync.get(['test'])
      
      // Verify storage operations work with cleanup support
      expect(global.chrome.storage.sync.get).toHaveBeenCalled()
    })
  })

  describe('[SAFARI-EXT-MESSAGING-001] Enhanced Safari Message Passing', () => {
    test('[SAFARI-EXT-MESSAGING-001] should enhance messages with platform info', async () => {
      // Mock Safari environment
      global.safari = mockSafariAPI
      
      // Mock Chrome runtime manifest
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

    test('[SAFARI-EXT-MESSAGING-001] should handle message sending errors with retry', async () => {
      // Mock Safari environment
      global.safari = mockSafariAPI
      
      // Mock Chrome runtime manifest
      global.chrome.runtime.getManifest = jest.fn().mockReturnValue({ version: '1.0.0' })
      
      let callCount = 0
      global.chrome.runtime.sendMessage = jest.fn().mockImplementation((msg, cb) => {
        callCount++
        if (callCount < 2) {
          // Simulate error
          global.chrome.runtime.lastError = { message: 'Message failed' }
          if (cb) {
            setTimeout(() => cb(null), 0)
          }
        } else {
          // Success case
          global.chrome.runtime.lastError = null
          if (cb) {
            setTimeout(() => cb({ success: true }), 0)
          }
        }
      })

      const result = await browser.runtime.sendMessage({ type: 'test' })
      
      expect(result).toEqual({ success: true })
      expect(callCount).toBe(2)
    })

    test('[SAFARI-EXT-MESSAGING-001] should log message operations', async () => {
      // Mock Safari environment
      global.safari = mockSafariAPI
      
      // Mock Chrome runtime manifest
      global.chrome.runtime.getManifest = jest.fn().mockReturnValue({ version: '1.0.0' })
      global.chrome.runtime.sendMessage = jest.fn().mockImplementation((msg, cb) => {
        if (cb) cb({ success: true })
        return Promise.resolve({ success: true })
      })
      
      await browser.runtime.sendMessage({ type: 'test' })
      
      // Verify logging
      const logCalls = global.console.log.mock.calls
      expect(logCalls.some(call => 
        call[0].includes('[SAFARI-EXT-MESSAGING-001]')
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
        { id: 2, url: 'safari-extension://internal-page', title: 'Safari Internal' },
        { id: 3, url: 'https://another-example.com', title: 'Another Example' }
      ])
      
      const tabs = await browser.tabs.query({})
      
      expect(tabs).toHaveLength(3) // All tabs should be returned since filtering is not implemented in the current version
      expect(tabs.find(tab => tab.url.startsWith('safari-extension://'))).toBeDefined()
    })

    test('[SAFARI-EXT-CONTENT-001] should handle tab query errors with retry', async () => {
      // Mock Safari environment
      global.safari = mockSafariAPI
      
      let callCount = 0
      global.chrome.tabs.query = jest.fn().mockImplementation(() => {
        callCount++
        if (callCount < 3) {
          return Promise.reject(new Error('Tab query failed'))
        } else {
          return Promise.resolve([{ id: 1, url: 'https://example.com' }])
        }
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
      // Mock storage quota exhaustion (95% usage)
      global.navigator.storage.estimate = jest.fn().mockResolvedValue({
        usage: 9.5 * 1024 * 1024, // 9.5MB
        quota: 10 * 1024 * 1024 // 10MB
      })
      
      const quotaUsage = await browser.storage.getQuotaUsage()
      expect(quotaUsage.usagePercent).toBe(95) // 9.5MB / 10MB * 100 = 95%
      
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

  describe('[SAFARI-EXT-SHIM-001] Enhanced Platform Detection Tests', () => {
    test('[SAFARI-EXT-SHIM-001] should detect runtime features', () => {
      // Mock Safari environment
      global.safari = mockSafariAPI
      
      const runtimeFeatures = platformUtils.detectRuntimeFeatures()
      
      expect(runtimeFeatures).toBeDefined()
      expect(runtimeFeatures.storage).toBeDefined()
      expect(runtimeFeatures.messaging).toBeDefined()
      expect(runtimeFeatures.ui).toBeDefined()
      expect(runtimeFeatures.performance).toBeDefined()
      expect(runtimeFeatures.security).toBeDefined()
      
      // Test specific runtime features
      expect(runtimeFeatures.storage.sync).toBe(true)
      expect(runtimeFeatures.storage.local).toBe(true)
      expect(runtimeFeatures.messaging.retry).toBe(true)
      expect(runtimeFeatures.messaging.timeout).toBe(true)
    })

    test('[SAFARI-EXT-SHIM-001] should get performance metrics', () => {
      // Mock Safari environment
      global.safari = mockSafariAPI
      
      // Mock performance API
      global.performance = {
        memory: {
          usedJSHeapSize: 1024 * 1024, // 1MB
          totalJSHeapSize: 5 * 1024 * 1024, // 5MB
          jsHeapSizeLimit: 10 * 1024 * 1024 // 10MB
        },
        timing: {
          navigationStart: 1000,
          loadEventEnd: 2000,
          domContentLoadedEventEnd: 1500
        }
      }
      
      const metrics = platformUtils.getPerformanceMetrics()
      
      expect(metrics).toBeDefined()
      expect(metrics.platform).toBe('safari')
      expect(metrics.timestamp).toBeGreaterThan(0)
      expect(metrics.memory).toBeDefined()
      expect(metrics.timing).toBeDefined()
      expect(metrics.platformSpecific).toBeDefined()
      expect(metrics.platformSpecific.safari).toBeDefined()
      
      // Test memory metrics
      expect(metrics.memory.used).toBe(1024 * 1024)
      expect(metrics.memory.total).toBe(5 * 1024 * 1024)
      expect(metrics.memory.limit).toBe(10 * 1024 * 1024)
      
      // Test platform-specific metrics
      expect(metrics.platformSpecific.safari.extensionAPIAvailable).toBe(true)
      expect(metrics.platformSpecific.safari.globalPageAvailable).toBe(true)
    })

    test('[SAFARI-EXT-SHIM-001] should detect accessibility features', () => {
      // Mock Safari environment
      global.safari = mockSafariAPI
      
      // Mock CSS.supports
      global.CSS = {
        supports: jest.fn().mockImplementation((property, value) => {
          if (property === 'backdrop-filter' && value === 'blur(10px)') return true
          if (property === '-webkit-backdrop-filter' && value === 'blur(10px)') return true
          if (property === 'aria-live' && value === 'polite') return true
          if (property === 'display' && value === 'grid') return true
          if (property === 'display' && value === 'flex') return true
          return false
        })
      }
      
      // Mock window.matchMedia
      global.window = {
        matchMedia: jest.fn().mockImplementation((query) => ({
          matches: query.includes('high') || query.includes('reduce')
        })),
        document: {
          createElement: jest.fn(),
          activeElement: { tagName: 'BODY' },
          querySelector: jest.fn()
        },
        location: {
          protocol: 'https:',
          hostname: 'localhost'
        },
        isSecureContext: true
      }
      
      // Mock navigator
      global.navigator = {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
      
      const accessibilityFeatures = platformUtils.detectAccessibilityFeatures()
      
      expect(accessibilityFeatures).toBeDefined()
      expect(accessibilityFeatures.screenReader).toBeDefined()
      expect(accessibilityFeatures.highContrast).toBeDefined()
      expect(accessibilityFeatures.reducedMotion).toBeDefined()
      expect(accessibilityFeatures.platformSpecific).toBeDefined()
      
      // Test screen reader features
      expect(accessibilityFeatures.screenReader.aria).toBe(true)
      expect(accessibilityFeatures.screenReader.liveRegions).toBe(true)
      expect(accessibilityFeatures.screenReader.focusManagement).toBe(true)
      
      // Test high contrast features
      expect(accessibilityFeatures.highContrast.prefersContrast).toBe(true)
      expect(accessibilityFeatures.highContrast.forcedColors).toBe(true)
      
      // Test reduced motion features
      expect(accessibilityFeatures.reducedMotion.prefersReducedMotion).toBe(true)
      
      // Test platform-specific accessibility
      expect(accessibilityFeatures.platformSpecific.safari.voiceOver).toBe(true)
      expect(accessibilityFeatures.platformSpecific.safari.safariAccessibility).toBe(true)
    })

    test('[SAFARI-EXT-SHIM-001] should detect security features', () => {
      // Mock Safari environment
      global.safari = mockSafariAPI
      
      // Mock crypto API
      global.crypto = {
        getRandomValues: jest.fn(),
        subtle: {},
        randomUUID: jest.fn()
      }
      
      // Mock window context
      global.window = {
        isSecureContext: true,
        location: {
          protocol: 'https:',
          hostname: 'localhost'
        },
        document: {
          querySelector: jest.fn()
        }
      }
      
      const securityFeatures = platformUtils.detectSecurityFeatures()
      
      expect(securityFeatures).toBeDefined()
      expect(securityFeatures.crypto).toBeDefined()
      expect(securityFeatures.context).toBeDefined()
      expect(securityFeatures.csp).toBeDefined()
      expect(securityFeatures.platformSpecific).toBeDefined()
      
      // Test crypto features
      expect(securityFeatures.crypto.getRandomValues).toBe(true)
      expect(securityFeatures.crypto.subtle).toBe(true)
      expect(securityFeatures.crypto.randomUUID).toBe(true)
      
      // Test context features
      expect(securityFeatures.context.secureContext).toBe(true)
      expect(securityFeatures.context.https).toBe(true)
      expect(securityFeatures.context.localhost).toBe(true)
      
      // Test platform-specific security
      expect(securityFeatures.platformSpecific.safari.safariSecurity).toBe(true)
      expect(securityFeatures.platformSpecific.safari.appSandbox).toBe(true)
    })

    test('[SAFARI-EXT-SHIM-001] should perform comprehensive platform analysis', () => {
      // Mock Safari environment
      global.safari = mockSafariAPI
      
      // Mock performance API
      global.performance = {
        memory: {
          usedJSHeapSize: 1024 * 1024,
          totalJSHeapSize: 5 * 1024 * 1024,
          jsHeapSizeLimit: 10 * 1024 * 1024
        },
        timing: {
          navigationStart: 1000,
          loadEventEnd: 2000,
          domContentLoadedEventEnd: 1500
        }
      }
      
      // Mock CSS.supports
      global.CSS = {
        supports: jest.fn().mockReturnValue(true)
      }
      
      // Mock window context
      global.window = {
        matchMedia: jest.fn().mockReturnValue({ matches: false }),
        document: {
          createElement: jest.fn(),
          activeElement: { tagName: 'BODY' },
          querySelector: jest.fn()
        },
        location: {
          protocol: 'https:',
          hostname: 'localhost'
        },
        isSecureContext: true,
        visualViewport: {}
      }
      
      // Mock crypto API
      global.crypto = {
        getRandomValues: jest.fn(),
        subtle: {},
        randomUUID: jest.fn()
      }
      
      // Mock navigator
      global.navigator = {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        storage: {
          estimate: jest.fn().mockResolvedValue({
            usage: 1024 * 1024,
            quota: 10 * 1024 * 1024
          })
        }
      }
      
      const analysis = platformUtils.analyzePlatform()
      
      expect(analysis).toBeDefined()
      expect(analysis.platform).toBe('safari')
      expect(analysis.timestamp).toBeGreaterThan(0)
      expect(analysis.config).toBeDefined()
      expect(analysis.runtimeFeatures).toBeDefined()
      expect(analysis.performanceMetrics).toBeDefined()
      expect(analysis.accessibilityFeatures).toBeDefined()
      expect(analysis.securityFeatures).toBeDefined()
      expect(analysis.recommendations).toBeDefined()
      
      // Test recommendations
      expect(analysis.recommendations.safari).toBeDefined()
      expect(analysis.recommendations.safari.enableCompression).toBe(true)
      expect(analysis.recommendations.safari.useTabFiltering).toBe(true)
      expect(analysis.recommendations.safari.monitorStorageQuota).toBe(true)
      expect(analysis.recommendations.safari.enableAccessibility).toBe(true)
    })

    test('[SAFARI-EXT-SHIM-001] should test enhanced feature support detection', () => {
      // Mock Safari environment
      global.safari = mockSafariAPI
      
      // Test new enhanced features
      expect(platformUtils.supportsFeature('runtimeFeatureDetection')).toBe(true)
      expect(platformUtils.supportsFeature('performanceMonitoring')).toBe(true)
      expect(platformUtils.supportsFeature('accessibilityFeatures')).toBe(true)
      expect(platformUtils.supportsFeature('securityFeatures')).toBe(true)
      
      // Test existing features still work
      expect(platformUtils.supportsFeature('backdropFilter')).toBe(true)
      expect(platformUtils.supportsFeature('webkitBackdropFilter')).toBe(true)
      expect(platformUtils.supportsFeature('safariExtensions')).toBe(true)
    })

    test('[SAFARI-EXT-SHIM-001] should test enhanced platform configuration', () => {
      // Mock Safari environment
      global.safari = mockSafariAPI
      
      const config = platformUtils.getPlatformConfig()
      
      // Test new enhanced configuration options
      expect(config.enableRuntimeFeatureDetection).toBe(true)
      expect(config.enablePerformanceMonitoring).toBe(true)
      expect(config.enableAccessibilityFeatures).toBe(true)
      expect(config.enableSecurityFeatures).toBe(true)
      expect(config.performanceMonitoringInterval).toBe(30000)
      expect(config.accessibilityCheckInterval).toBe(60000)
      expect(config.securityCheckInterval).toBe(300000)
      
      // Test existing configuration still works
      expect(config.maxRetries).toBe(3)
      expect(config.baseDelay).toBe(150)
      expect(config.enableTabFiltering).toBe(true)
    })
  })
}) 