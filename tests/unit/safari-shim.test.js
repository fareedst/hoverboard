/**
 * Safari Browser Shim Tests
 * 
 * [SAFARI-EXT-TEST-001] Test Safari browser API abstraction layer
 * Tests cross-browser compatibility and Safari-specific features
 */

import { jest } from '@jest/globals'

// Mock browser APIs for testing
const mockChromeAPI = {
  runtime: {
    id: 'test-extension-id',
    getManifest: () => ({ version: '1.0.0' }),
    sendMessage: jest.fn(() => Promise.resolve()),
    onMessage: { addListener: jest.fn() },
    onInstalled: { addListener: jest.fn() }
  },
  storage: {
    sync: {
      get: jest.fn(() => Promise.resolve({})),
      set: jest.fn(() => Promise.resolve()),
      remove: jest.fn(() => Promise.resolve())
    },
    local: {
      get: jest.fn(() => Promise.resolve({})),
      set: jest.fn(() => Promise.resolve()),
      remove: jest.fn(() => Promise.resolve())
    }
  },
  tabs: {
    query: jest.fn(() => Promise.resolve([])),
    sendMessage: jest.fn(() => Promise.resolve())
  }
}

const mockSafariAPI = {
  ...mockChromeAPI,
  // Safari-specific APIs
  application: {
    activeDocument: { window: { location: { href: 'https://example.com' } } }
  }
}

// Mock webextension-polyfill
const mockWebextensionPolyfill = {
  default: {
    runtime: mockChromeAPI.runtime,
    storage: mockChromeAPI.storage,
    tabs: mockChromeAPI.tabs
  }
}

// Mock navigator.storage for quota testing
const mockNavigatorStorage = {
  estimate: jest.fn(() => Promise.resolve({
    usage: 1024 * 1024, // 1MB
    quota: 10 * 1024 * 1024 // 10MB
  }))
}

describe('[SAFARI-EXT-TEST-001] Safari Browser Shim Tests', () => {
  let browser
  let platformUtils
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()
    
    // Reset global browser objects
    delete global.chrome
    delete global.safari
    delete global.browser
    
    // Mock dynamic import
    jest.doMock('webextension-polyfill', () => mockWebextensionPolyfill)
    
    // Mock navigator.storage
    Object.defineProperty(navigator, 'storage', {
      value: mockNavigatorStorage,
      writable: true
    })
  })
  
  afterEach(() => {
    // Clean up
    jest.dontMock('webextension-polyfill')
  })
  
  describe('[SAFARI-EXT-SHIM-001] Browser API Abstraction', () => {
    test('should load webextension-polyfill successfully', async () => {
      // Mock successful polyfill import
      const { browser } = await import('../../src/shared/safari-shim.js')
      
      expect(browser).toBeDefined()
      expect(browser.runtime).toBeDefined()
      expect(browser.storage).toBeDefined()
      expect(browser.tabs).toBeDefined()
    })
    
    test('should fallback to Chrome API when polyfill fails', async () => {
      // Mock polyfill failure
      jest.doMock('webextension-polyfill', () => {
        throw new Error('Polyfill not available')
      })
      
      // Mock Chrome API
      global.chrome = mockChromeAPI
      
      const { browser } = await import('../../src/shared/safari-shim.js')
      
      expect(browser).toBeDefined()
      expect(browser.runtime).toBeDefined()
    })
    
    test('should create minimal browser API when no APIs available', async () => {
      // Mock polyfill failure and no Chrome API
      jest.doMock('webextension-polyfill', () => {
        throw new Error('Polyfill not available')
      })
      
      const { browser } = await import('../../src/shared/safari-shim.js')
      
      expect(browser).toBeDefined()
      expect(browser.runtime.id).toBe('mock-extension-id')
    })
  })
  
  describe('[SAFARI-EXT-STORAGE-001] Safari Storage Enhancements', () => {
    test('should provide storage quota management', async () => {
      const { browser } = await import('../../src/shared/safari-shim.js')
      
      const quotaUsage = await browser.storage.getQuotaUsage()
      
      expect(quotaUsage).toBeDefined()
      expect(quotaUsage.used).toBe(1024 * 1024)
      expect(quotaUsage.quota).toBe(10 * 1024 * 1024)
      expect(quotaUsage.usagePercent).toBe(10) // 10%
    })
    
    test('should handle storage quota errors gracefully', async () => {
      // Mock storage estimate failure
      mockNavigatorStorage.estimate.mockRejectedValueOnce(new Error('Storage API not available'))
      
      const { browser } = await import('../../src/shared/safari-shim.js')
      
      const quotaUsage = await browser.storage.getQuotaUsage()
      
      expect(quotaUsage.used).toBe(0)
      expect(quotaUsage.quota).toBe(0)
      expect(quotaUsage.usagePercent).toBe(0)
    })
    
    test('should monitor storage usage during operations', async () => {
      const { browser } = await import('../../src/shared/safari-shim.js')
      
      // Mock high usage
      mockNavigatorStorage.estimate.mockResolvedValueOnce({
        usage: 8 * 1024 * 1024, // 8MB
        quota: 10 * 1024 * 1024 // 10MB
      })
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      await browser.storage.sync.get(['test'])
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[SAFARI-EXT-STORAGE-001] Storage quota usage high:')
      )
      
      consoleSpy.mockRestore()
    })
  })
  
  describe('[SAFARI-EXT-MESSAGING-001] Safari Message Passing', () => {
    test('should enhance messages with platform info', async () => {
      const { browser } = await import('../../src/shared/safari-shim.js')
      
      const testMessage = { type: 'test', data: 'test-data' }
      
      await browser.runtime.sendMessage(testMessage)
      
      expect(browser.runtime.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'test',
          data: 'test-data',
          platform: 'safari',
          timestamp: expect.any(Number),
          version: '1.0.0'
        })
      )
    })
    
    test('should handle message sending errors', async () => {
      const { browser } = await import('../../src/shared/safari-shim.js')
      
      // Mock message sending failure
      browser.runtime.sendMessage.mockRejectedValueOnce(new Error('Message failed'))
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      await expect(browser.runtime.sendMessage({ type: 'test' })).rejects.toThrow('Message failed')
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[SAFARI-EXT-MESSAGING-001] Message send failed:')
      )
      
      consoleSpy.mockRestore()
    })
  })
  
  describe('[SAFARI-EXT-CONTENT-001] Safari Tab Querying', () => {
    test('should filter Safari internal pages', async () => {
      const { browser } = await import('../../src/shared/safari-shim.js')
      
      // Mock Safari environment
      global.safari = mockSafariAPI
      
      // Mock tabs with Safari internal pages
      const mockTabs = [
        { id: 1, url: 'https://example.com' },
        { id: 2, url: 'safari-extension://test-extension-id/popup.html' },
        { id: 3, url: 'https://another-example.com' }
      ]
      
      browser.tabs.query.mockResolvedValueOnce(mockTabs)
      
      const tabs = await browser.tabs.query({})
      
      expect(tabs).toHaveLength(2)
      expect(tabs.find(tab => tab.url.startsWith('safari-extension://'))).toBeUndefined()
    })
    
    test('should handle tab query errors', async () => {
      const { browser } = await import('../../src/shared/safari-shim.js')
      
      // Mock tab query failure
      browser.tabs.query.mockRejectedValueOnce(new Error('Tab query failed'))
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      await expect(browser.tabs.query({})).rejects.toThrow('Tab query failed')
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[SAFARI-EXT-CONTENT-001] Tab query failed:')
      )
      
      consoleSpy.mockRestore()
    })
  })
  
  describe('[SAFARI-EXT-SHIM-001] Platform Detection', () => {
    test('should detect Safari platform', async () => {
      global.safari = mockSafariAPI
      
      const { platformUtils } = await import('../../src/shared/safari-shim.js')
      
      expect(platformUtils.isSafari()).toBe(true)
      expect(platformUtils.getPlatform()).toBe('safari')
    })
    
    test('should detect Chrome platform', async () => {
      global.chrome = mockChromeAPI
      
      const { platformUtils } = await import('../../src/shared/safari-shim.js')
      
      expect(platformUtils.isChrome()).toBe(true)
      expect(platformUtils.getPlatform()).toBe('chrome')
    })
    
    test('should check feature support correctly', async () => {
      const { platformUtils } = await import('../../src/shared/safari-shim.js')
      
      // Mock Safari platform
      global.safari = mockSafariAPI
      
      expect(platformUtils.supportsFeature('backdropFilter')).toBe(true)
      expect(platformUtils.supportsFeature('webkitBackdropFilter')).toBe(true)
      expect(platformUtils.supportsFeature('visualViewport')).toBe(true)
      
      // Mock Chrome platform
      delete global.safari
      global.chrome = mockChromeAPI
      
      expect(platformUtils.supportsFeature('backdropFilter')).toBe(true)
      expect(platformUtils.supportsFeature('webkitBackdropFilter')).toBe(false)
      expect(platformUtils.supportsFeature('visualViewport')).toBe(true)
    })
  })
}) 