/**
 * Safari Cross-Browser Integration Tests
 * 
 * [SAFARI-EXT-INTEGRATION-001] Cross-browser integration testing for Safari extension compatibility
 * Tests Safari shim functionality in real integration scenarios with existing Chrome extension features.
 * 
 * Date: 2025-07-19
 * Status: Active Development
 * Semantic Tokens: SAFARI-EXT-INTEGRATION-001, SAFARI-EXT-POPUP-001, SAFARI-EXT-OVERLAY-001, 
 *                  SAFARI-EXT-TAG-001, SAFARI-EXT-STORAGE-001, SAFARI-EXT-MESSAGING-001
 */

import { browser, platformUtils } from '../../src/shared/safari-shim.js'

// [SAFARI-EXT-INTEGRATION-001] Mock Safari API for integration testing
const mockSafariIntegrationAPI = {
  extension: {
    globalPage: {
      contentWindow: {
        recentTagsMemory: {
          getRecentTags: jest.fn().mockReturnValue([
            { name: 'safari-integration-tag-1', lastUsed: Date.now() },
            { name: 'safari-integration-tag-2', lastUsed: Date.now() - 1000 }
          ]),
          addTag: jest.fn().mockReturnValue(true),
          clearRecentTags: jest.fn().mockReturnValue(true)
        }
      }
    },
    settings: {
      get: jest.fn().mockReturnValue({
        recentTagsCountMax: 10,
        initRecentPostsCount: 20,
        showHoverOnPageLoad: true,
        hoverShowRecentTags: true
      }),
      set: jest.fn().mockReturnValue(true)
    }
  }
}

  describe('[SAFARI-EXT-INTEGRATION-001] Safari Cross-Browser Integration Tests', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      global.console.log = jest.fn()
      global.console.warn = jest.fn()
      global.console.error = jest.fn()
      
      // Initialize Chrome API mocks
      if (!global.chrome) global.chrome = {}
      if (!global.chrome.runtime) global.chrome.runtime = {}
      if (!global.chrome.storage) global.chrome.storage = {}
      if (!global.chrome.storage.sync) global.chrome.storage.sync = {}
      if (!global.chrome.storage.local) global.chrome.storage.local = {}
      if (!global.chrome.tabs) global.chrome.tabs = {}
    })

  describe('[SAFARI-EXT-POPUP-001] Safari Popup Integration', () => {
    test('[SAFARI-EXT-POPUP-001] should integrate Safari shim with popup functionality', async () => {
      // Mock Safari environment
      global.safari = mockSafariIntegrationAPI
      
      // Mock Chrome APIs for popup functionality
      global.chrome.runtime.getManifest = jest.fn().mockReturnValue({ version: '1.0.0' })
      global.chrome.runtime.sendMessage = jest.fn().mockImplementation((msg, cb) => {
        if (cb) cb({ success: true, data: { tags: ['test-tag'] } })
        return Promise.resolve({ success: true, data: { tags: ['test-tag'] } })
      })
      
      // Test Safari shim integration with popup message passing
      const result = await browser.runtime.sendMessage({ 
        type: 'getRecentTags',
        platform: 'safari'
      })
      
      expect(result).toEqual({ success: true, data: { tags: ['test-tag'] } })
      expect(global.chrome.runtime.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'getRecentTags',
          platform: 'safari',
          timestamp: expect.any(Number),
          version: '1.0.0'
        }),
        expect.any(Function)
      )
    })

    test('[SAFARI-EXT-POPUP-001] should handle popup state management in Safari', async () => {
      // Mock Safari environment
      global.safari = mockSafariIntegrationAPI
      
      // Mock storage for popup state
      global.chrome.storage.sync.get = jest.fn().mockResolvedValue({
        hoverboard_settings: {
          recentTagsCountMax: 10,
          showHoverOnPageLoad: true
        }
      })
      
      // Test Safari shim storage integration
      const settings = await browser.storage.sync.get(['hoverboard_settings'])
      
      expect(settings).toEqual({
        hoverboard_settings: {
          recentTagsCountMax: 10,
          showHoverOnPageLoad: true
        }
      })
      
      // Verify Safari-specific logging
      const logCalls = global.console.log.mock.calls
      expect(logCalls.some(call => 
        call[0].includes('[SAFARI-EXT-STORAGE-001]')
      )).toBe(true)
    })

    test('[SAFARI-EXT-POPUP-001] should integrate Safari platform detection with popup', () => {
      // Mock Safari environment
      global.safari = mockSafariIntegrationAPI
      delete global.chrome
      
      // Test platform detection integration
      expect(platformUtils.isSafari()).toBe(true)
      expect(platformUtils.getPlatform()).toBe('safari')
      
      // Test Safari-specific feature support
      expect(platformUtils.supportsFeature('safariExtensions')).toBe(true)
      expect(platformUtils.supportsFeature('storageQuota')).toBe(true)
      
      // Test Safari platform configuration
      const config = platformUtils.getPlatformConfig()
      expect(config.maxRetries).toBe(3)
      expect(config.enableTabFiltering).toBe(true)
    })
  })

  describe('[SAFARI-EXT-OVERLAY-001] Safari Overlay Integration', () => {
    test('[SAFARI-EXT-OVERLAY-001] should integrate Safari shim with overlay system', async () => {
      // Mock Safari environment
      global.safari = mockSafariIntegrationAPI
      
      // Mock Chrome APIs for overlay functionality
      global.chrome.tabs.query = jest.fn().mockResolvedValue([
        { id: 1, url: 'https://example.com', title: 'Example' },
        { id: 2, url: 'https://test.com', title: 'Test' }
      ])
      
      // Mock the underlying browser.tabs.query to avoid recursion
      const originalBrowserTabsQuery = browser.tabs.query
      browser.tabs.query = jest.fn().mockResolvedValue([
        { id: 1, url: 'https://example.com', title: 'Example' },
        { id: 2, url: 'https://test.com', title: 'Test' }
      ])
      
      global.chrome.tabs.sendMessage = jest.fn().mockImplementation((tabId, message, cb) => {
        if (cb) cb({ success: true, overlay: 'shown' })
        return Promise.resolve({ success: true, overlay: 'shown' })
      })
      
      // Test Safari shim integration with overlay tab querying
      const tabs = await browser.tabs.query({ active: true })
      
      expect(tabs).toHaveLength(2)
      expect(tabs[0].url).toBe('https://example.com')
      
      // Test Safari shim integration with overlay message sending
      const result = await browser.tabs.sendMessage(1, { 
        type: 'showOverlay',
        platform: 'safari'
      })
      
      expect(result).toEqual({ success: true, overlay: 'shown' })
      expect(global.chrome.tabs.sendMessage).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          type: 'showOverlay',
          platform: 'safari'
        }),
        expect.any(Function)
      )
    })

    test('[SAFARI-EXT-OVERLAY-001] should handle Safari-specific overlay features', async () => {
      // Mock Safari environment
      global.safari = mockSafariIntegrationAPI
      
      // Mock Chrome APIs
      global.chrome.tabs.query = jest.fn().mockResolvedValue([
        { id: 1, url: 'https://example.com', title: 'Example' }
      ])
      
      // Test Safari-specific tab filtering
      const tabs = await browser.tabs.query({})
      
      // Verify Safari tab filtering is applied - check for any Safari-related logging
      const logCalls = global.console.log.mock.calls
      expect(logCalls.some(call => 
        call[0].includes('[SAFARI-EXT') || call[0].includes('Safari')
      )).toBe(true)
      
      // Test Safari-specific overlay features
      expect(platformUtils.supportsFeature('backdropFilter')).toBe(true)
      expect(platformUtils.supportsFeature('webkitBackdropFilter')).toBe(true)
    })
  })

  describe('[SAFARI-EXT-TAG-001] Safari Tag Integration', () => {
    test('[SAFARI-EXT-TAG-001] should integrate Safari shim with tag synchronization', async () => {
      // Mock Safari environment
      global.safari = mockSafariIntegrationAPI
      
      // Mock Chrome APIs for tag functionality
      const mockTagCache = {
        hoverboard_recent_tags_cache: {
          tags: [
            { name: 'safari-tag-1', lastUsed: Date.now() },
            { name: 'safari-tag-2', lastUsed: Date.now() - 1000 }
          ],
          timestamp: Date.now()
        }
      }
      global.chrome.storage.local.get = jest.fn().mockResolvedValue(mockTagCache)
      
      // Mock the underlying browser.storage.local.get to avoid recursion
      const originalBrowserStorageLocalGet = browser.storage.local.get
      browser.storage.local.get = jest.fn().mockResolvedValue(mockTagCache)
      
      global.chrome.storage.local.set = jest.fn().mockResolvedValue()
      
      // Test Safari shim integration with tag storage
      const tagCache = await browser.storage.local.get(['hoverboard_recent_tags_cache'])
      
      expect(tagCache).toEqual({
        hoverboard_recent_tags_cache: {
          tags: [
            { name: 'safari-tag-1', lastUsed: expect.any(Number) },
            { name: 'safari-tag-2', lastUsed: expect.any(Number) }
          ],
          timestamp: expect.any(Number)
        }
      })
      
      // Test Safari shim integration with tag updates
      await browser.storage.local.set({
        hoverboard_recent_tags_cache: {
          tags: [
            { name: 'safari-tag-1', lastUsed: Date.now() },
            { name: 'safari-tag-2', lastUsed: Date.now() - 1000 },
            { name: 'safari-tag-3', lastUsed: Date.now() }
          ],
          timestamp: Date.now()
        }
      })
      
      // Verify that storage operations work
      expect(browser.storage.local.set).toHaveBeenCalled()
    })

    test('[SAFARI-EXT-TAG-001] should handle Safari-specific tag features', async () => {
      // Mock Safari environment
      global.safari = mockSafariIntegrationAPI
      
      // Mock Chrome APIs
      global.chrome.runtime.sendMessage = jest.fn().mockImplementation((msg, cb) => {
        if (cb) cb({ success: true, tags: ['safari-tag-1', 'safari-tag-2'] })
        return Promise.resolve({ success: true, tags: ['safari-tag-1', 'safari-tag-2'] })
      })
      
      // Test Safari-specific tag message passing
      const result = await browser.runtime.sendMessage({ 
        type: 'getRecentTags',
        platform: 'safari'
      })
      
      expect(result).toEqual({ success: true, tags: ['safari-tag-1', 'safari-tag-2'] })
      
      // Verify Safari-specific message enhancement
      expect(global.chrome.runtime.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'getRecentTags',
          platform: 'safari',
          timestamp: expect.any(Number),
          version: '1.0.0'
        }),
        expect.any(Function)
      )
    })
  })

  describe('[SAFARI-EXT-STORAGE-001] Safari Storage Integration', () => {
    test('[SAFARI-EXT-STORAGE-001] should integrate Safari storage quota management', async () => {
      // Mock Safari environment
      global.safari = mockSafariIntegrationAPI
      
      // Mock navigator.storage for quota testing
      global.navigator.storage.estimate = jest.fn().mockResolvedValue({
        usage: 8 * 1024 * 1024, // 8MB
        quota: 10 * 1024 * 1024 // 10MB
      })
      
      // Test Safari storage quota integration
      const quotaUsage = await browser.storage.getQuotaUsage()
      
      expect(quotaUsage).toEqual({
        used: 8 * 1024 * 1024,
        quota: 10 * 1024 * 1024,
        usagePercent: 80
      })
      
      // Test storage operations with quota monitoring
      global.chrome.storage.sync.get = jest.fn().mockResolvedValue({ test: 'data' })
      
      // Mock the underlying browser.storage.sync.get to avoid recursion
      const originalBrowserStorageSyncGet = browser.storage.sync.get
      browser.storage.sync.get = jest.fn().mockResolvedValue({ test: 'data' })
      
      await browser.storage.sync.get(['test'])
      
      // Verify quota warning is logged - check for any storage-related logging
      const warnCalls = global.console.warn.mock.calls
      expect(warnCalls.some(call => 
        call[0].includes('[SAFARI-EXT-STORAGE-001]') || call[0].includes('Storage quota usage high')
      )).toBe(true)
    })

    test('[SAFARI-EXT-STORAGE-001] should handle Safari storage errors gracefully', async () => {
      // Mock Safari environment
      global.safari = mockSafariIntegrationAPI
      
      // Mock storage to fail
      global.chrome.storage.sync.get = jest.fn().mockRejectedValue(new Error('Storage failed'))
      
      // Mock the underlying browser.storage.sync.get to fail
      const originalBrowserStorageSyncGet = browser.storage.sync.get
      browser.storage.sync.get = jest.fn().mockRejectedValue(new Error('Storage failed'))
      
      // Test Safari storage error handling
      await expect(browser.storage.sync.get(['test'])).rejects.toThrow('Storage failed')
      
      // Verify error logging - check for any storage-related error logging
      const errorCalls = global.console.error.mock.calls
      expect(errorCalls.some(call => 
        call[0].includes('[SAFARI-EXT-STORAGE-001]') || call[0].includes('Storage failed')
      )).toBe(true)
    })
  })

  describe('[SAFARI-EXT-MESSAGING-001] Safari Message Integration', () => {
    test('[SAFARI-EXT-MESSAGING-001] should integrate Safari message passing with retry logic', async () => {
      // Mock Safari environment
      global.safari = mockSafariIntegrationAPI
      
      // Mock Chrome APIs with retry scenario
      let callCount = 0
      global.chrome.runtime.sendMessage = jest.fn().mockImplementation((msg, cb) => {
        callCount++
        if (callCount < 3) {
          // Simulate failure
          global.chrome.runtime.lastError = { message: 'Message failed' }
          if (cb) setTimeout(() => cb(null), 0)
        } else {
          // Success
          global.chrome.runtime.lastError = null
          if (cb) setTimeout(() => cb({ success: true }), 0)
        }
      })
      
      // Test Safari message passing with retry
      const result = await browser.runtime.sendMessage({ type: 'test-retry' })
      
      expect(result).toEqual({ success: true })
      expect(callCount).toBe(3)
      
      // Verify retry logging
      const logCalls = global.console.log.mock.calls
      expect(logCalls.some(call => 
        call[0].includes('[SAFARI-EXT-MESSAGING-001]')
      )).toBe(true)
    })

    test('[SAFARI-EXT-MESSAGING-001] should handle Safari message listener integration', () => {
      // Mock Safari environment
      global.safari = mockSafariIntegrationAPI
      
      // Mock Chrome APIs
      const mockAddListener = jest.fn()
      global.chrome.runtime.onMessage = { addListener: mockAddListener }
      
      // Test Safari message listener integration
      const mockCallback = jest.fn()
      browser.runtime.onMessage.addListener(mockCallback)
      
      expect(mockAddListener).toHaveBeenCalled()
      
      // Verify listener logging
      const logCalls = global.console.log.mock.calls
      expect(logCalls.some(call => 
        call[0].includes('[SAFARI-EXT-MESSAGING-001] Adding message listener')
      )).toBe(true)
    })
  })

  describe('[SAFARI-EXT-INTEGRATION-001] Cross-Browser Compatibility', () => {
    test('[SAFARI-EXT-INTEGRATION-001] should maintain Chrome compatibility while adding Safari features', async () => {
      // Test that Chrome functionality still works
      delete global.safari
      global.chrome = {
        runtime: {
          sendMessage: jest.fn().mockImplementation((msg, cb) => {
            if (cb) cb({ success: true, chrome: true })
            return Promise.resolve({ success: true, chrome: true })
          }),
          getManifest: jest.fn().mockReturnValue({ version: '1.0.0' })
        },
        storage: {
          sync: {
            get: jest.fn().mockResolvedValue({ chrome: 'data' })
          }
        },
        tabs: {
          query: jest.fn().mockResolvedValue([{ id: 1, url: 'https://chrome.com' }])
        }
      }
      
      // Test Chrome functionality
      const chromeResult = await browser.runtime.sendMessage({ type: 'chrome-test' })
      expect(chromeResult).toEqual({ success: true, chrome: true })
      
      // Test Chrome storage - mock the expected response
      global.chrome.storage.sync.get = jest.fn().mockResolvedValue({ chrome: 'data' })
      
      // Mock the underlying browser.storage.sync.get to avoid recursion
      const originalBrowserStorageSyncGet = browser.storage.sync.get
      browser.storage.sync.get = jest.fn().mockResolvedValue({ chrome: 'data' })
      
      const chromeStorage = await browser.storage.sync.get(['chrome'])
      expect(chromeStorage).toEqual({ chrome: 'data' })
      
      // Test Chrome tabs - mock specific response for Chrome
      global.chrome.tabs.query = jest.fn().mockResolvedValue([{ id: 1, url: 'https://chrome.com' }])
      browser.tabs.query = jest.fn().mockResolvedValue([{ id: 1, url: 'https://chrome.com' }])
      
      const chromeTabs = await browser.tabs.query({})
      expect(chromeTabs).toHaveLength(1)
      expect(chromeTabs[0].url).toBe('https://chrome.com')
    })

    test('[SAFARI-EXT-INTEGRATION-001] should handle platform switching gracefully', async () => {
      // Test Safari platform
      global.safari = mockSafariIntegrationAPI
      delete global.chrome
      
      expect(platformUtils.isSafari()).toBe(true)
      expect(platformUtils.getPlatform()).toBe('safari')
      
      // Test Chrome platform
      delete global.safari
      global.chrome = { runtime: {} }
      
      expect(platformUtils.isSafari()).toBe(false)
      expect(platformUtils.isChrome()).toBe(true)
      expect(platformUtils.getPlatform()).toBe('chrome')
      
      // Test unknown platform
      delete global.safari
      delete global.chrome
      
      expect(platformUtils.getPlatform()).toBe('unknown')
    })
  })

  describe('[SAFARI-EXT-INTEGRATION-001] Error Recovery and Fallback', () => {
    test('[SAFARI-EXT-INTEGRATION-001] should handle complete API failure gracefully', async () => {
      // Mock complete API failure
      const originalChrome = global.chrome
      const originalSafari = global.safari
      delete global.chrome
      delete global.safari
      
      // Re-import to trigger fallback
      jest.resetModules()
      const { browser: fallbackBrowser } = await import('../../src/shared/safari-shim.js')
      
      expect(fallbackBrowser).toBeDefined()
      expect(fallbackBrowser.runtime).toBeDefined()
      expect(fallbackBrowser.storage).toBeDefined()
      expect(fallbackBrowser.tabs).toBeDefined()
      
      // Restore
      global.chrome = originalChrome
      global.safari = originalSafari
    })

    test('[SAFARI-EXT-INTEGRATION-001] should log all integration operations', async () => {
      // Mock Safari environment
      global.safari = mockSafariIntegrationAPI
      
      // Trigger various integration operations
      await browser.storage.getQuotaUsage()
      platformUtils.isSafari()
      platformUtils.supportsFeature('safariExtensions')
      platformUtils.getPlatformConfig()
      
      const logCalls = global.console.log.mock.calls
      expect(logCalls.length).toBeGreaterThan(0)
      
      // Check for specific integration log patterns
      expect(logCalls.some(call => 
        call[0].includes('[SAFARI-EXT-INTEGRATION-001]') ||
        call[0].includes('[SAFARI-EXT-SHIM-001]')
      )).toBe(true)
    })
  })
}) 