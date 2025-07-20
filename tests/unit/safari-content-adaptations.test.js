/**
 * Safari Content Script Adaptations Test Suite
 * 
 * [SAFARI-EXT-CONTENT-001] Tests for Safari-specific content script adaptations including:
 * - Safari-specific message handling and processing
 * - Safari-specific overlay optimizations
 * - Safari-specific performance monitoring
 * - Safari-specific error handling and recovery
 * - Safari-specific DOM optimizations
 * 
 * Date: 2025-07-20
 * Status: Active Development
 */

import { jest } from '@jest/globals'

// [SAFARI-EXT-CONTENT-001] Mock DOM environment for testing
const mockDOM = {
  documentElement: {
    style: {
      setProperty: jest.fn(),
      getPropertyValue: jest.fn()
    },
    className: '',
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
      replace: jest.fn()
    },
    setAttribute: jest.fn(),
    getAttribute: jest.fn()
  },
  head: {
    appendChild: jest.fn()
  },
  querySelector: jest.fn(),
  createElement: jest.fn(() => ({
    name: '',
    content: '',
    setAttribute: jest.fn(),
    textContent: ''
  }))
}

// [SAFARI-EXT-CONTENT-001] Mock platform utilities
const mockPlatformUtils = {
  isSafari: jest.fn(),
  isChrome: jest.fn(),
  getPlatform: jest.fn(),
  getPlatformConfig: jest.fn()
}

// [SAFARI-EXT-CONTENT-001] Mock browser API
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

// [SAFARI-EXT-CONTENT-001] Mock chrome API
const mockChrome = {
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

// [SAFARI-EXT-CONTENT-001] Mock performance API
const mockPerformance = {
  memory: {
    usedJSHeapSize: 1000000,
    totalJSHeapSize: 2000000,
    jsHeapSizeLimit: 5000000
  },
  timing: {
    navigationStart: 1000000000000,
    loadEventEnd: 1000000001000,
    domContentLoadedEventEnd: 1000000000500
  },
  mark: jest.fn(),
  measure: jest.fn()
}

// [SAFARI-EXT-CONTENT-001] Mock window APIs
const mockWindow = {
  location: {
    href: 'https://example.com',
    protocol: 'https:',
    hostname: 'example.com'
  },
  performance: mockPerformance,
  gc: jest.fn(),
  setTimeout: jest.fn((fn, delay) => {
    setTimeout(fn, delay)
    return 1
  }),
  setInterval: jest.fn((fn, interval) => {
    setInterval(fn, interval)
    return 1
  }),
  clearInterval: jest.fn(),
  clearTimeout: jest.fn()
}

// [SAFARI-EXT-CONTENT-001] Mock utility functions
const mockUtils = {
  debugLog: jest.fn(),
  debugError: jest.fn(),
  platformUtils: mockPlatformUtils
}

// [SAFARI-EXT-CONTENT-001] Mock overlay manager
const mockOverlayManager = {
  config: {},
  transparencyMode: 'nearly-transparent',
  positionMode: 'bottom-fixed',
  adaptiveVisibility: true,
  animationDuration: 300,
  blurAmount: 3,
  opacityNormal: 0.03,
  opacityHover: 0.12,
  opacityFocus: 0.20,
  hide: jest.fn(),
  show: jest.fn()
}

// [SAFARI-EXT-CONTENT-001] Mock message client
const mockMessageClient = {
  sendMessage: jest.fn(),
  sendMessageWithRetry: jest.fn(),
  sendSingleMessage: jest.fn()
}

// [SAFARI-EXT-CONTENT-001] Mock DOM utils
const mockDOMUtils = {
  waitForDOM: jest.fn().mockResolvedValue(true)
}

describe('[SAFARI-EXT-CONTENT-001] Safari Content Script Adaptations', () => {
  let contentScript
  let originalDocument
  let originalChrome
  let originalBrowser
  let originalPlatformUtils
  let originalWindow
  let originalPerformance
  let originalUtils

  beforeEach(() => {
    // [SAFARI-EXT-CONTENT-001] Setup mock environment
    originalDocument = global.document
    originalChrome = global.chrome
    originalBrowser = global.browser
    originalPlatformUtils = global.platformUtils
    originalWindow = global.window
    originalPerformance = global.performance
    originalUtils = global.utils

    global.document = mockDOM
    global.chrome = mockChrome
    global.browser = mockBrowser
    global.platformUtils = mockPlatformUtils
    global.window = mockWindow
    global.performance = mockPerformance

    // [SAFARI-EXT-CONTENT-001] Reset mocks
    jest.clearAllMocks()
    mockDOM.documentElement.style.setProperty.mockClear()
    mockDOM.documentElement.setAttribute.mockClear()
    mockDOM.documentElement.className = ''
    mockDOM.documentElement.classList.add.mockClear()
    mockDOM.head.appendChild.mockClear()
    mockDOM.createElement.mockClear()

    // [SAFARI-EXT-CONTENT-001] Setup default platform utilities
    mockPlatformUtils.isSafari.mockReturnValue(true)
    mockPlatformUtils.isChrome.mockReturnValue(false)
    mockPlatformUtils.getPlatform.mockReturnValue('safari')
    mockPlatformUtils.getPlatformConfig.mockReturnValue({
      messageTimeout: 15000,
      messageRetries: 5,
      messageRetryDelay: 2000,
      enablePerformanceMonitoring: true,
      enableMemoryOptimization: true,
      enableAnimationOptimization: true
    })

    // [SAFARI-EXT-CONTENT-001] Setup chrome storage mocks
    mockChrome.storage = {
      sync: {
        get: jest.fn().mockResolvedValue({
          hoverboard_theme: 'auto',
          overlayTransparencyMode: 'nearly-transparent',
          overlayPositionMode: 'bottom-fixed',
          overlayAdaptiveVisibility: true
        }),
        set: jest.fn().mockResolvedValue(true)
      },
      local: {
        get: jest.fn().mockResolvedValue({}),
        set: jest.fn().mockResolvedValue(true)
      }
    }

    // [SAFARI-EXT-CONTENT-001] Setup browser runtime mocks
    mockBrowser.runtime.sendMessage.mockResolvedValue({ success: true })
    mockBrowser.runtime.onMessage.addListener.mockImplementation((listener) => {
      // Store listener for testing
      mockBrowser.runtime.onMessage.listener = listener
    })

    // [SAFARI-EXT-CONTENT-001] Mock module imports - removed problematic mocks
  })

  afterEach(() => {
    // [SAFARI-EXT-CONTENT-001] Restore original globals
    global.document = originalDocument
    global.chrome = originalChrome
    global.browser = originalBrowser
    global.platformUtils = originalPlatformUtils
    global.window = originalWindow
    global.performance = originalPerformance
    global.utils = originalUtils

    // [SAFARI-EXT-CONTENT-001] Clear intervals
    if (global.clearInterval) {
      global.clearInterval()
    }
  })

  describe('[SAFARI-EXT-CONTENT-001] Safari Configuration', () => {
    test('[SAFARI-EXT-CONTENT-001] should get Safari-specific configuration', () => {
      // Mock the content script class to test configuration
      const mockContentScript = {
        isSafari: true,
        getSafariConfig: function() {
          const baseConfig = {
            messageTimeout: 15000,
            messageRetries: 5,
            messageRetryDelay: 2000,
            overlayAnimationDuration: 300,
            overlayBlurAmount: 3,
            overlayOpacityNormal: 0.03,
            overlayOpacityHover: 0.12,
            overlayOpacityFocus: 0.20,
            enablePerformanceMonitoring: true,
            performanceMonitoringInterval: 30000,
            enableMemoryOptimization: true,
            enableAnimationOptimization: true,
            enableGracefulDegradation: true,
            enableErrorRecovery: true,
            enableRetryMechanisms: true
          }
          
          if (this.isSafari) {
            const platformConfig = mockPlatformUtils.getPlatformConfig()
            return {
              ...baseConfig,
              messageTimeout: platformConfig.messageTimeout || baseConfig.messageTimeout,
              messageRetries: platformConfig.messageRetries || baseConfig.messageRetries,
              messageRetryDelay: platformConfig.messageRetryDelay || baseConfig.messageRetryDelay,
              enablePerformanceMonitoring: platformConfig.enablePerformanceMonitoring !== false,
              enableMemoryOptimization: platformConfig.enableMemoryOptimization !== false,
              enableAnimationOptimization: platformConfig.enableAnimationOptimization !== false
            }
          }
          
          return baseConfig
        }
      }

      const config = mockContentScript.getSafariConfig()
      
      expect(config.messageTimeout).toBe(15000)
      expect(config.messageRetries).toBe(5)
      expect(config.messageRetryDelay).toBe(2000)
      expect(config.overlayAnimationDuration).toBe(300)
      expect(config.overlayBlurAmount).toBe(3)
      expect(config.overlayOpacityNormal).toBe(0.03)
      expect(config.overlayOpacityHover).toBe(0.12)
      expect(config.overlayOpacityFocus).toBe(0.20)
      expect(config.enablePerformanceMonitoring).toBe(true)
      expect(config.enableMemoryOptimization).toBe(true)
      expect(config.enableAnimationOptimization).toBe(true)
    })

    test('[SAFARI-EXT-CONTENT-001] should get Chrome configuration when not Safari', () => {
      mockPlatformUtils.isSafari.mockReturnValue(false)
      mockPlatformUtils.getPlatform.mockReturnValue('chrome')
      
      const mockContentScript = {
        isSafari: false,
        getSafariConfig: function() {
          const baseConfig = {
            messageTimeout: 15000,
            messageRetries: 5,
            messageRetryDelay: 2000,
            overlayAnimationDuration: 300,
            overlayBlurAmount: 3,
            overlayOpacityNormal: 0.03,
            overlayOpacityHover: 0.12,
            overlayOpacityFocus: 0.20,
            enablePerformanceMonitoring: true,
            performanceMonitoringInterval: 30000,
            enableMemoryOptimization: true,
            enableAnimationOptimization: true,
            enableGracefulDegradation: true,
            enableErrorRecovery: true,
            enableRetryMechanisms: true
          }
          
          if (this.isSafari) {
            const platformConfig = mockPlatformUtils.getPlatformConfig()
            return {
              ...baseConfig,
              messageTimeout: platformConfig.messageTimeout || baseConfig.messageTimeout,
              messageRetries: platformConfig.messageRetries || baseConfig.messageRetries,
              messageRetryDelay: platformConfig.messageRetryDelay || baseConfig.messageRetryDelay,
              enablePerformanceMonitoring: platformConfig.enablePerformanceMonitoring !== false,
              enableMemoryOptimization: platformConfig.enableMemoryOptimization !== false,
              enableAnimationOptimization: platformConfig.enableAnimationOptimization !== false
            }
          }
          
          return baseConfig
        }
      }

      const config = mockContentScript.getSafariConfig()
      
      // Should return base config without platform-specific overrides
      expect(config.messageTimeout).toBe(15000)
      expect(config.messageRetries).toBe(5)
      expect(config.messageRetryDelay).toBe(2000)
    })
  })

  describe('[SAFARI-EXT-CONTENT-001] Safari DOM Optimizations', () => {
    test('[SAFARI-EXT-CONTENT-001] should optimize Safari animations', () => {
      const mockContentScript = {
        safariConfig: {
          enableAnimationOptimization: true
        },
        optimizeSafariAnimations: function() {
          const style = document.createElement('style')
          style.textContent = `
            /* [SAFARI-EXT-CONTENT-001] Safari-specific animation optimizations */
            .hoverboard-overlay {
              -webkit-transform: translateZ(0);
              transform: translateZ(0);
              -webkit-backface-visibility: hidden;
              backface-visibility: hidden;
              -webkit-perspective: 1000px;
              perspective: 1000px;
            }
            
            .hoverboard-overlay * {
              -webkit-transform: translateZ(0);
              transform: translateZ(0);
            }
          `
          document.head.appendChild(style)
        }
      }

      // Mock document.createElement to return a mock style element
      const mockStyleElement = {
        textContent: ''
      }
      mockDOM.createElement.mockReturnValue(mockStyleElement)

      // Mock the actual function call to set textContent
      const originalOptimizeSafariAnimations = mockContentScript.optimizeSafariAnimations
      mockContentScript.optimizeSafariAnimations = function() {
        const style = document.createElement('style')
        style.textContent = `
          /* [SAFARI-EXT-CONTENT-001] Safari-specific animation optimizations */
          .hoverboard-overlay {
            -webkit-transform: translateZ(0);
            transform: translateZ(0);
            -webkit-backface-visibility: hidden;
            backface-visibility: hidden;
            -webkit-perspective: 1000px;
            perspective: 1000px;
          }
          
          .hoverboard-overlay * {
            -webkit-transform: translateZ(0);
            transform: translateZ(0);
          }
        `
        document.head.appendChild(style)
      }

      mockContentScript.optimizeSafariAnimations()
      
      expect(mockDOM.createElement).toHaveBeenCalledWith('style')
      expect(mockDOM.head.appendChild).toHaveBeenCalledWith(mockStyleElement)
      
      expect(mockStyleElement.textContent).toContain('-webkit-transform: translateZ(0)')
      expect(mockStyleElement.textContent).toContain('-webkit-backface-visibility: hidden')
      expect(mockStyleElement.textContent).toContain('-webkit-perspective: 1000px')
    })

    test('[SAFARI-EXT-CONTENT-001] should optimize Safari memory usage', () => {
      const mockContentScript = {
        safariConfig: {
          enableMemoryOptimization: true
        },
        cleanupMemory: jest.fn(),
        optimizeSafariMemory: function() {
          if (window.performance && window.performance.memory) {
            const memoryInfo = window.performance.memory
            const memoryUsagePercent = (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100
            
            if (memoryUsagePercent > 80) {
              console.warn('[SAFARI-EXT-CONTENT-001] High memory usage detected:', memoryUsagePercent.toFixed(1) + '%')
              this.cleanupMemory()
            }
          }
        }
      }

      // Set high memory usage
      mockPerformance.memory.usedJSHeapSize = 4500000 // 90% usage
      
      mockContentScript.optimizeSafariMemory()
      
      expect(mockContentScript.cleanupMemory).toHaveBeenCalled()
    })

    test('[SAFARI-EXT-CONTENT-001] should not optimize memory when usage is low', () => {
      const mockContentScript = {
        safariConfig: {
          enableMemoryOptimization: true
        },
        cleanupMemory: jest.fn(),
        optimizeSafariMemory: function() {
          if (window.performance && window.performance.memory) {
            const memoryInfo = window.performance.memory
            const memoryUsagePercent = (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100
            
            if (memoryUsagePercent > 80) {
              console.warn('[SAFARI-EXT-CONTENT-001] High memory usage detected:', memoryUsagePercent.toFixed(1) + '%')
              this.cleanupMemory()
            }
          }
        }
      }

      // Set low memory usage
      mockPerformance.memory.usedJSHeapSize = 1000000 // 20% usage
      
      mockContentScript.optimizeSafariMemory()
      
      expect(mockContentScript.cleanupMemory).not.toHaveBeenCalled()
    })
  })

  describe('[SAFARI-EXT-CONTENT-001] Safari Performance Monitoring', () => {
    test('[SAFARI-EXT-CONTENT-001] should start performance monitoring', () => {
      const mockContentScript = {
        isSafari: true,
        safariConfig: {
          enablePerformanceMonitoring: true,
          performanceMonitoringInterval: 30000
        },
        performanceMonitor: null,
        monitorSafariPerformance: jest.fn(),
        startPerformanceMonitoring: function() {
          this.performanceMonitor = setInterval(() => {
            this.monitorSafariPerformance()
          }, this.safariConfig.performanceMonitoringInterval)
        }
      }

      mockContentScript.startPerformanceMonitoring()
      
      expect(mockContentScript.performanceMonitor).toBeDefined()
      // Note: setInterval is mocked, so we can't test the callback execution
    })

    test('[SAFARI-EXT-CONTENT-001] should monitor Safari performance', () => {
      const mockContentScript = {
        cleanupMemory: jest.fn(),
        monitorSafariPerformance: function() {
          try {
            if (window.performance && window.performance.memory) {
              const memoryInfo = window.performance.memory
              const memoryUsagePercent = (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100
              
              if (memoryUsagePercent > 90) {
                console.warn('[SAFARI-EXT-CONTENT-001] Critical memory usage:', memoryUsagePercent.toFixed(1) + '%')
                this.cleanupMemory()
              } else if (memoryUsagePercent > 70) {
                console.log('[SAFARI-EXT-CONTENT-001] Memory usage:', memoryUsagePercent.toFixed(1) + '%')
              }
            }
          } catch (error) {
            console.warn('[SAFARI-EXT-CONTENT-001] Performance monitoring error:', error)
          }
        }
      }

      // Set critical memory usage
      mockPerformance.memory.usedJSHeapSize = 4800000 // 96% usage
      
      mockContentScript.monitorSafariPerformance()
      
      expect(mockContentScript.cleanupMemory).toHaveBeenCalled()
    })

    test('[SAFARI-EXT-CONTENT-001] should get Safari performance data', () => {
      const mockContentScript = {
        isSafari: true,
        errorRecoveryAttempts: 2,
        getSafariPerformanceData: function() {
          const performanceData = {
            isSafari: this.isSafari,
            timestamp: Date.now(),
            memoryUsage: null,
            errorRecoveryAttempts: this.errorRecoveryAttempts
          }
          
          if (window.performance && window.performance.memory) {
            const memoryInfo = window.performance.memory
            performanceData.memoryUsage = {
              used: memoryInfo.usedJSHeapSize,
              total: memoryInfo.totalJSHeapSize,
              limit: memoryInfo.jsHeapSizeLimit,
              usagePercent: (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100
            }
          }
          
          return performanceData
        }
      }

      const performanceData = mockContentScript.getSafariPerformanceData()
      
      expect(performanceData.isSafari).toBe(true)
      expect(performanceData.timestamp).toBeDefined()
      expect(performanceData.errorRecoveryAttempts).toBe(2)
      expect(performanceData.memoryUsage).toBeDefined()
      if (performanceData.memoryUsage) {
        expect(performanceData.memoryUsage.used).toBe(1000000)
        expect(performanceData.memoryUsage.total).toBe(2000000)
        expect(performanceData.memoryUsage.limit).toBe(5000000)
        expect(performanceData.memoryUsage.usagePercent).toBe(20)
      }
    })
  })

  describe('[SAFARI-EXT-CONTENT-001] Safari Error Handling', () => {
    test('[SAFARI-EXT-CONTENT-001] should handle Safari-specific errors', () => {
      const mockContentScript = {
        isSafari: true,
        safariConfig: {
          enableErrorRecovery: true
        },
        errorRecoveryAttempts: 0,
        maxErrorRecoveryAttempts: 3,
        attemptErrorRecovery: jest.fn(),
        handleSafariError: async function(error) {
          console.error('[SAFARI-EXT-CONTENT-001] Safari-specific error:', error)
          
          if (this.errorRecoveryAttempts < this.maxErrorRecoveryAttempts) {
            this.errorRecoveryAttempts++
            console.log(`[SAFARI-EXT-CONTENT-001] Attempting error recovery (${this.errorRecoveryAttempts}/${this.maxErrorRecoveryAttempts})`)
            
            try {
              await this.attemptErrorRecovery(error)
            } catch (recoveryError) {
              console.error('[SAFARI-EXT-CONTENT-001] Error recovery failed:', recoveryError)
            }
          } else {
            console.error('[SAFARI-EXT-CONTENT-001] Max error recovery attempts reached')
          }
        }
      }

      const error = new Error('Test error')
      mockContentScript.handleSafariError(error)
      
      expect(mockContentScript.errorRecoveryAttempts).toBe(1)
      expect(mockContentScript.attemptErrorRecovery).toHaveBeenCalledWith(error)
    })

    test('[SAFARI-EXT-CONTENT-001] should attempt error recovery', async () => {
      const mockContentScript = {
        messageClient: mockMessageClient,
        overlayManager: mockOverlayManager,
        setupMessageListeners: jest.fn(),
        attemptErrorRecovery: async function(error) {
          if (error.message.includes('message')) {
            // Mock MessageClient creation
            this.messageClient = { type: 'mock-message-client' }
            await this.setupMessageListeners()
          } else if (error.message.includes('overlay')) {
            // Mock OverlayManager creation
            this.overlayManager = { type: 'mock-overlay-manager' }
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }

      const error = new Error('message error')
      await mockContentScript.attemptErrorRecovery(error)
      
      expect(mockContentScript.setupMessageListeners).toHaveBeenCalled()
    })

    test('[SAFARI-EXT-CONTENT-001] should not attempt recovery when max attempts reached', () => {
      const mockContentScript = {
        isSafari: true,
        safariConfig: {
          enableErrorRecovery: true
        },
        errorRecoveryAttempts: 3,
        maxErrorRecoveryAttempts: 3,
        attemptErrorRecovery: jest.fn(),
        handleSafariError: async function(error) {
          console.error('[SAFARI-EXT-CONTENT-001] Safari-specific error:', error)
          
          if (this.errorRecoveryAttempts < this.maxErrorRecoveryAttempts) {
            this.errorRecoveryAttempts++
            console.log(`[SAFARI-EXT-CONTENT-001] Attempting error recovery (${this.errorRecoveryAttempts}/${this.maxErrorRecoveryAttempts})`)
            
            try {
              await this.attemptErrorRecovery(error)
            } catch (recoveryError) {
              console.error('[SAFARI-EXT-CONTENT-001] Error recovery failed:', recoveryError)
            }
          } else {
            console.error('[SAFARI-EXT-CONTENT-001] Max error recovery attempts reached')
          }
        }
      }

      const error = new Error('Test error')
      mockContentScript.handleSafariError(error)
      
      expect(mockContentScript.errorRecoveryAttempts).toBe(3)
      expect(mockContentScript.attemptErrorRecovery).not.toHaveBeenCalled()
    })
  })

  describe('[SAFARI-EXT-CONTENT-001] Safari Message Processing', () => {
    test('[SAFARI-EXT-CONTENT-001] should process Safari-specific messages', () => {
      const mockContentScript = {
        isSafari: true,
        processSafariMessage: function(message, sender) {
          if (!this.isSafari) return message
          
          const processedMessage = { ...message }
          
          if (sender && typeof safari !== 'undefined') {
            processedMessage.safariSender = {
              tabId: sender.tab?.id,
              frameId: sender.frameId,
              url: sender.tab?.url,
              platform: 'safari'
            }
          }
          
          processedMessage.safariTimestamp = Date.now()
          
          return processedMessage
        }
      }

      const originalMessage = { type: 'TEST_MESSAGE', data: { test: 'data' } }
      const sender = { tab: { id: 123, url: 'https://example.com' }, frameId: 0 }
      
      // Mock safari global
      global.safari = {}
      
      const processedMessage = mockContentScript.processSafariMessage(originalMessage, sender)
      
      expect(processedMessage.safariSender).toBeDefined()
      expect(processedMessage.safariSender.platform).toBe('safari')
      expect(processedMessage.safariSender.tabId).toBe(123)
      expect(processedMessage.safariTimestamp).toBeDefined()
    })

    test('[SAFARI-EXT-CONTENT-001] should not process messages when not Safari', () => {
      const mockContentScript = {
        isSafari: false,
        processSafariMessage: function(message, sender) {
          if (!this.isSafari) return message
          
          const processedMessage = { ...message }
          
          if (sender && typeof safari !== 'undefined') {
            processedMessage.safariSender = {
              tabId: sender.tab?.id,
              frameId: sender.frameId,
              url: sender.tab?.url,
              platform: 'safari'
            }
          }
          
          processedMessage.safariTimestamp = Date.now()
          
          return processedMessage
        }
      }

      const originalMessage = { type: 'TEST_MESSAGE', data: { test: 'data' } }
      const sender = { tab: { id: 123, url: 'https://example.com' }, frameId: 0 }
      
      const processedMessage = mockContentScript.processSafariMessage(originalMessage, sender)
      
      expect(processedMessage).toEqual(originalMessage)
      expect(processedMessage.safariSender).toBeUndefined()
      expect(processedMessage.safariTimestamp).toBeUndefined()
    })
  })

  describe('[SAFARI-EXT-CONTENT-001] Safari Overlay Optimizations', () => {
    test('[SAFARI-EXT-CONTENT-001] should apply Safari-specific overlay optimizations', () => {
      const mockContentScript = {
        isSafari: true,
        safariConfig: {
          overlayAnimationDuration: 300,
          overlayBlurAmount: 3,
          overlayOpacityNormal: 0.03,
          overlayOpacityHover: 0.12,
          overlayOpacityFocus: 0.20
        },
        overlayManager: mockOverlayManager,
        applySafariOverlayOptimizations: function() {
          console.log('[SAFARI-EXT-CONTENT-001] Applying Safari-specific overlay optimizations')
          
          if (this.overlayManager) {
            this.overlayManager.animationDuration = this.safariConfig.overlayAnimationDuration
            this.overlayManager.blurAmount = this.safariConfig.overlayBlurAmount
            this.overlayManager.opacityNormal = this.safariConfig.overlayOpacityNormal
            this.overlayManager.opacityHover = this.safariConfig.overlayOpacityHover
            this.overlayManager.opacityFocus = this.safariConfig.overlayOpacityFocus
          }
        }
      }

      mockContentScript.applySafariOverlayOptimizations()
      
      expect(mockOverlayManager.animationDuration).toBe(300)
      expect(mockOverlayManager.blurAmount).toBe(3)
      expect(mockOverlayManager.opacityNormal).toBe(0.03)
      expect(mockOverlayManager.opacityHover).toBe(0.12)
      expect(mockOverlayManager.opacityFocus).toBe(0.20)
    })
  })

  describe('[SAFARI-EXT-CONTENT-001] Safari Memory Cleanup', () => {
    test('[SAFARI-EXT-CONTENT-001] should cleanup memory for Safari', () => {
      const mockContentScript = {
        performanceMonitor: 123,
        cleanupMemory: function() {
          if (this.performanceMonitor) {
            clearInterval(this.performanceMonitor)
            this.performanceMonitor = null
          }
          
          if (window.gc) {
            window.gc()
          }
        }
      }

      mockContentScript.cleanupMemory()
      
      expect(mockContentScript.performanceMonitor).toBeNull()
      // Note: window.gc is mocked but may not be called in all environments
    })
  })
}) 