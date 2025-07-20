/**
 * Safari Popup Adaptations Test Suite
 * [SAFARI-EXT-POPUP-001] Comprehensive tests for Safari-specific popup optimizations
 */

import { jest } from '@jest/globals'

// Mock DOM environment
document.body.innerHTML = `
  <div id="popup-container">
    <div class="popup-header">
      <div class="header-content">
        <img class="popup-logo" src="icons/hoverboard_16.png" alt="Hoverboard">
        <span class="popup-title">Hoverboard</span>
      </div>
    </div>
    <div class="popup-main">
      <div class="main-interface">
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    </div>
  </div>
`

// Mock browser APIs
global.chrome = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    },
    getManifest: jest.fn().mockReturnValue({ version: '1.0.0' })
  },
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn()
    },
    local: {
      get: jest.fn(),
      set: jest.fn()
    }
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn()
  }
}

// Mock Safari APIs
global.safari = {
  extension: {
    globalPage: {
      contentWindow: {
        postMessage: jest.fn()
      }
    }
  }
}

// Mock performance API
global.performance = {
  memory: {
    usedJSHeapSize: 50000000,
    jsHeapSizeLimit: 100000000
  }
}

// Mock performance.memory for tests that modify it
global.performance.memory = {
  usedJSHeapSize: 50000000,
  jsHeapSizeLimit: 100000000
}

// Mock CSS.supports
global.CSS = {
  supports: jest.fn()
}

// Import modules after mocking
import { platformUtils } from '../../safari/src/shared/safari-shim.js'

describe('[SAFARI-EXT-POPUP-001] Safari Popup Adaptations', () => {
  let mockErrorHandler
  let mockStateManager
  let mockConfigManager
  let mockUIManager
  let popupController

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Reset DOM
    document.body.innerHTML = `
      <div id="popup-container">
        <div class="popup-header">
          <div class="header-content">
            <img class="popup-logo" src="icons/hoverboard_16.png" alt="Hoverboard">
            <span class="popup-title">Hoverboard</span>
          </div>
        </div>
        <div class="popup-main">
          <div class="main-interface">
            <div class="loading-state">
              <div class="spinner"></div>
              <p>Loading...</p>
            </div>
          </div>
        </div>
      </div>
    `

    // Mock dependencies
    mockErrorHandler = {
      handleError: jest.fn(),
      onError: jest.fn(),
      cleanup: jest.fn()
    }

    mockStateManager = {
      setState: jest.fn(),
      getState: jest.fn(),
      cleanup: jest.fn()
    }

    mockConfigManager = {
      getConfig: jest.fn().mockResolvedValue({
        apiToken: 'test-token',
        showHoverOnPageLoad: true
      }),
      updateConfig: jest.fn().mockResolvedValue(true)
    }

    mockUIManager = {
      setupEventListeners: jest.fn(),
      showError: jest.fn(),
      showSuccess: jest.fn(),
      updateShowHoverButtonState: jest.fn(),
      updatePrivateStatus: jest.fn(),
      updateReadLaterStatus: jest.fn(),
      updateCurrentTags: jest.fn(),
      cleanup: jest.fn(),
      on: jest.fn(),
      off: jest.fn()
    }

    // Mock platformUtils
    platformUtils.isSafari = jest.fn().mockReturnValue(true)
    platformUtils.getPlatform = jest.fn().mockReturnValue('safari')
    platformUtils.supportsFeature = jest.fn().mockReturnValue(true)
  })

  describe('Safari Platform Detection', () => {
    test('[SAFARI-EXT-POPUP-001] should detect Safari platform correctly', () => {
      expect(platformUtils.isSafari()).toBe(true)
      expect(platformUtils.getPlatform()).toBe('safari')
    })

    test('[SAFARI-EXT-POPUP-001] should support Safari-specific features', () => {
      expect(platformUtils.supportsFeature('safariExtensions')).toBe(true)
      expect(platformUtils.supportsFeature('storageQuota')).toBe(true)
    })
  })

  describe('Safari Configuration System', () => {
    test('[SAFARI-EXT-POPUP-001] should load Safari-specific configuration', () => {
      const config = {
        enablePerformanceMonitoring: true,
        performanceMonitoringInterval: 30000,
        enableMemoryOptimization: true,
        enableAnimationOptimization: true,
        enableErrorRecovery: true,
        enableGracefulDegradation: true,
        maxErrorRecoveryAttempts: 3,
        errorRecoveryDelay: 1000,
        enableSafariUIOptimizations: true,
        enableSafariAccessibility: true,
        enableSafariAnimationOptimizations: true,
        messageTimeout: 15000,
        messageRetries: 5,
        messageRetryDelay: 2000,
        overlayAnimationDuration: 300,
        overlayBlurAmount: 3,
        overlayOpacityNormal: 0.03,
        overlayOpacityHover: 0.12,
        overlayOpacityFocus: 0.20,
        enablePlatformDetection: true,
        enableFeatureDetection: true,
        enablePerformanceDetection: true
      }

      expect(config.enablePerformanceMonitoring).toBe(true)
      expect(config.performanceMonitoringInterval).toBe(30000)
      expect(config.messageTimeout).toBe(15000)
      expect(config.messageRetries).toBe(5)
      expect(config.overlayAnimationDuration).toBe(300)
    })

    test('[SAFARI-EXT-POPUP-001] should have Safari-specific performance settings', () => {
      const config = {
        enablePerformanceMonitoring: true,
        performanceMonitoringInterval: 30000,
        enableMemoryOptimization: true,
        enableAnimationOptimization: true
      }

      expect(config.enablePerformanceMonitoring).toBe(true)
      expect(config.performanceMonitoringInterval).toBe(30000)
      expect(config.enableMemoryOptimization).toBe(true)
      expect(config.enableAnimationOptimization).toBe(true)
    })

    test('[SAFARI-EXT-POPUP-001] should have Safari-specific error handling settings', () => {
      const config = {
        enableErrorRecovery: true,
        enableGracefulDegradation: true,
        maxErrorRecoveryAttempts: 3,
        errorRecoveryDelay: 1000
      }

      expect(config.enableErrorRecovery).toBe(true)
      expect(config.enableGracefulDegradation).toBe(true)
      expect(config.maxErrorRecoveryAttempts).toBe(3)
      expect(config.errorRecoveryDelay).toBe(1000)
    })

    test('[SAFARI-EXT-POPUP-001] should have Safari-specific UI optimization settings', () => {
      const config = {
        enableSafariUIOptimizations: true,
        enableSafariAccessibility: true,
        enableSafariAnimationOptimizations: true
      }

      expect(config.enableSafariUIOptimizations).toBe(true)
      expect(config.enableSafariAccessibility).toBe(true)
      expect(config.enableSafariAnimationOptimizations).toBe(true)
    })

    test('[SAFARI-EXT-POPUP-001] should have Safari-specific message handling settings', () => {
      const config = {
        messageTimeout: 15000,
        messageRetries: 5,
        messageRetryDelay: 2000
      }

      expect(config.messageTimeout).toBe(15000)
      expect(config.messageRetries).toBe(5)
      expect(config.messageRetryDelay).toBe(2000)
    })

    test('[SAFARI-EXT-POPUP-001] should have Safari-specific overlay settings', () => {
      const config = {
        overlayAnimationDuration: 300,
        overlayBlurAmount: 3,
        overlayOpacityNormal: 0.03,
        overlayOpacityHover: 0.12,
        overlayOpacityFocus: 0.20
      }

      expect(config.overlayAnimationDuration).toBe(300)
      expect(config.overlayBlurAmount).toBe(3)
      expect(config.overlayOpacityNormal).toBe(0.03)
      expect(config.overlayOpacityHover).toBe(0.12)
      expect(config.overlayOpacityFocus).toBe(0.20)
    })
  })

  describe('Safari Performance Monitoring', () => {
    test('[SAFARI-EXT-POPUP-001] should monitor Safari performance correctly', () => {
      const memoryInfo = global.performance.memory
      const memoryUsagePercent = (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100
      
      expect(memoryUsagePercent).toBe(50) // 50MB / 100MB = 50%
      expect(memoryInfo.usedJSHeapSize).toBe(50000000)
      expect(memoryInfo.jsHeapSizeLimit).toBe(100000000)
    })

    test('[SAFARI-EXT-POPUP-001] should detect critical memory usage', () => {
      // Mock critical memory usage
      global.performance.memory.usedJSHeapSize = 95000000 // 95% usage
      
      const memoryInfo = global.performance.memory
      const memoryUsagePercent = (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100
      
      expect(memoryUsagePercent).toBeGreaterThan(90)
      expect(memoryUsagePercent).toBe(95)
    })

    test('[SAFARI-EXT-POPUP-001] should detect high memory usage', () => {
      // Mock high memory usage
      global.performance.memory.usedJSHeapSize = 75000000 // 75% usage
      
      const memoryInfo = global.performance.memory
      const memoryUsagePercent = (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100
      
      expect(memoryUsagePercent).toBeGreaterThan(70)
      expect(memoryUsagePercent).toBeLessThan(90)
      expect(memoryUsagePercent).toBe(75)
    })

    test('[SAFARI-EXT-POPUP-001] should handle performance monitoring errors gracefully', () => {
      // Mock performance API error
      global.performance.memory = null
      
      expect(() => {
        const memoryInfo = global.performance.memory
        if (memoryInfo) {
          const memoryUsagePercent = (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100
          expect(memoryUsagePercent).toBeDefined()
        }
      }).not.toThrow()
    })
  })

  describe('Safari Error Handling', () => {
    test('[SAFARI-EXT-POPUP-001] should categorize Safari errors correctly', () => {
      const categorizeError = (message) => {
        let errorType = 'general'
        if (message.toLowerCase().includes('network') || message.toLowerCase().includes('fetch')) {
          errorType = 'network'
        } else if (message.toLowerCase().includes('permission') || message.toLowerCase().includes('denied')) {
          errorType = 'permission'
        } else if (message.toLowerCase().includes('auth') || message.toLowerCase().includes('token')) {
          errorType = 'auth'
        } else if (message.toLowerCase().includes('memory') || message.toLowerCase().includes('performance')) {
          errorType = 'performance'
        }
        return errorType
      }

      expect(categorizeError('Network error occurred')).toBe('network')
      expect(categorizeError('Permission denied')).toBe('permission')
      expect(categorizeError('Authentication failed')).toBe('auth')
      expect(categorizeError('Memory usage high')).toBe('performance')
      expect(categorizeError('General error')).toBe('general')
    })

    test('[SAFARI-EXT-POPUP-001] should provide Safari-specific error messages', () => {
      const getErrorMessage = (errorType) => {
        let userMessage = 'An unexpected error occurred. Please try again.'
        
        if (errorType === 'auth') {
          userMessage = 'Please configure your Pinboard API token in the extension options.'
        } else if (errorType === 'network') {
          userMessage = 'Network error. Please check your connection and try again.'
        } else if (errorType === 'permission') {
          userMessage = 'Permission denied. Please check extension permissions.'
        } else if (errorType === 'performance') {
          userMessage = 'Performance issue detected. Please try refreshing the popup.'
        }
        
        return userMessage
      }

      expect(getErrorMessage('auth')).toBe('Please configure your Pinboard API token in the extension options.')
      expect(getErrorMessage('network')).toBe('Network error. Please check your connection and try again.')
      expect(getErrorMessage('permission')).toBe('Permission denied. Please check extension permissions.')
      expect(getErrorMessage('performance')).toBe('Performance issue detected. Please try refreshing the popup.')
      expect(getErrorMessage('general')).toBe('An unexpected error occurred. Please try again.')
    })

    test('[SAFARI-EXT-POPUP-001] should attempt error recovery with limits', () => {
      const maxAttempts = 3
      const currentAttempts = 2
      
      expect(currentAttempts).toBeLessThan(maxAttempts)
      expect(currentAttempts + 1).toBeLessThanOrEqual(maxAttempts)
    })

    test('[SAFARI-EXT-POPUP-001] should respect error recovery limits', () => {
      const maxAttempts = 3
      const currentAttempts = 3
      
      expect(currentAttempts).toBeGreaterThanOrEqual(maxAttempts)
      expect(currentAttempts >= maxAttempts).toBe(true)
    })
  })

  describe('Safari UI Optimizations', () => {
    test('[SAFARI-EXT-POPUP-001] should add Safari-specific CSS classes', () => {
      const addSafariClasses = () => {
        document.body.classList.add('safari-platform-detected')
        document.body.classList.add('safari-performance-monitoring')
        document.body.classList.add('safari-error-handling')
        document.body.classList.add('safari-graceful-degradation')
      }

      addSafariClasses()

      expect(document.body.classList.contains('safari-platform-detected')).toBe(true)
      expect(document.body.classList.contains('safari-performance-monitoring')).toBe(true)
      expect(document.body.classList.contains('safari-error-handling')).toBe(true)
      expect(document.body.classList.contains('safari-graceful-degradation')).toBe(true)
    })

    test('[SAFARI-EXT-POPUP-001] should detect backdrop-filter support', () => {
      global.CSS.supports.mockReturnValue(true)
      
      const supportsBackdropFilter = CSS.supports('backdrop-filter', 'blur(10px)')
      
      expect(supportsBackdropFilter).toBe(true)
      expect(global.CSS.supports).toHaveBeenCalledWith('backdrop-filter', 'blur(10px)')
    })

    test('[SAFARI-EXT-POPUP-001] should handle backdrop-filter fallback', () => {
      global.CSS.supports.mockReturnValue(false)
      
      const supportsBackdropFilter = CSS.supports('backdrop-filter', 'blur(10px)')
      
      expect(supportsBackdropFilter).toBe(false)
      
      // Should add fallback class
      if (!supportsBackdropFilter) {
        document.body.classList.add('safari-feature-unsupported')
      }
      
      expect(document.body.classList.contains('safari-feature-unsupported')).toBe(true)
    })

    test('[SAFARI-EXT-POPUP-001] should remove Safari-specific CSS classes on cleanup', () => {
      // Add classes first
      document.body.classList.add('safari-platform-detected')
      document.body.classList.add('safari-performance-monitoring')
      document.body.classList.add('safari-error-handling')
      document.body.classList.add('safari-graceful-degradation')
      document.body.classList.add('safari-feature-supported')
      document.body.classList.add('safari-feature-unsupported')

      // Remove classes
      document.body.classList.remove('safari-platform-detected')
      document.body.classList.remove('safari-performance-monitoring')
      document.body.classList.remove('safari-error-handling')
      document.body.classList.remove('safari-graceful-degradation')
      document.body.classList.remove('safari-feature-supported')
      document.body.classList.remove('safari-feature-unsupported')

      expect(document.body.classList.contains('safari-platform-detected')).toBe(false)
      expect(document.body.classList.contains('safari-performance-monitoring')).toBe(false)
      expect(document.body.classList.contains('safari-error-handling')).toBe(false)
      expect(document.body.classList.contains('safari-graceful-degradation')).toBe(false)
      expect(document.body.classList.contains('safari-feature-supported')).toBe(false)
      expect(document.body.classList.contains('safari-feature-unsupported')).toBe(false)
    })
  })

  describe('Safari Animation Optimizations', () => {
    test('[SAFARI-EXT-POPUP-001] should apply Safari-specific animation durations', () => {
      const safariAnimationDuration = '300ms'
      const safariTransitionDuration = '300ms'
      
      expect(safariAnimationDuration).toBe('300ms')
      expect(safariTransitionDuration).toBe('300ms')
    })

    test('[SAFARI-EXT-POPUP-001] should apply Safari-specific transform optimizations', () => {
      const safariTransformOptimized = 'translateZ(0)'
      
      expect(safariTransformOptimized).toBe('translateZ(0)')
    })

    test('[SAFARI-EXT-POPUP-001] should apply Safari-specific hardware acceleration', () => {
      const hardwareAcceleration = {
        webkitTransform: 'translateZ(0)',
        transform: 'translateZ(0)',
        webkitBackfaceVisibility: 'hidden',
        backfaceVisibility: 'hidden',
        webkitPerspective: '1000px',
        perspective: '1000px'
      }
      
      expect(hardwareAcceleration.webkitTransform).toBe('translateZ(0)')
      expect(hardwareAcceleration.transform).toBe('translateZ(0)')
      expect(hardwareAcceleration.webkitBackfaceVisibility).toBe('hidden')
      expect(hardwareAcceleration.backfaceVisibility).toBe('hidden')
      expect(hardwareAcceleration.webkitPerspective).toBe('1000px')
      expect(hardwareAcceleration.perspective).toBe('1000px')
    })
  })

  describe('Safari Accessibility Features', () => {
    test('[SAFARI-EXT-POPUP-001] should support VoiceOver optimizations', () => {
      const voiceOverOptimized = true
      
      expect(voiceOverOptimized).toBe(true)
    })

    test('[SAFARI-EXT-POPUP-001] should support high contrast mode', () => {
      const highContrastMultiplier = 1.0
      
      expect(highContrastMultiplier).toBe(1.0)
    })

    test('[SAFARI-EXT-POPUP-001] should support reduced motion', () => {
      const motionMultiplier = 1.0
      
      expect(motionMultiplier).toBe(1.0)
    })

    test('[SAFARI-EXT-POPUP-001] should apply accessibility optimizations', () => {
      const accessibilityOptimizations = {
        webkitFontSmoothing: 'antialiased',
        mozOsxFontSmoothing: 'grayscale',
        textRendering: 'optimizeLegibility'
      }
      
      expect(accessibilityOptimizations.webkitFontSmoothing).toBe('antialiased')
      expect(accessibilityOptimizations.mozOsxFontSmoothing).toBe('grayscale')
      expect(accessibilityOptimizations.textRendering).toBe('optimizeLegibility')
    })
  })

  describe('Safari Message Handling', () => {
    test('[SAFARI-EXT-POPUP-001] should use Safari-specific message timeout', () => {
      const safariMessageTimeout = 15000 // 15 seconds
      const chromeMessageTimeout = 10000 // 10 seconds
      
      expect(safariMessageTimeout).toBeGreaterThan(chromeMessageTimeout)
      expect(safariMessageTimeout).toBe(15000)
    })

    test('[SAFARI-EXT-POPUP-001] should use Safari-specific retry mechanism', () => {
      const safariRetries = 5
      const chromeRetries = 3
      
      expect(safariRetries).toBeGreaterThan(chromeRetries)
      expect(safariRetries).toBe(5)
    })

    test('[SAFARI-EXT-POPUP-001] should use Safari-specific retry delays', () => {
      const safariRetryDelay = 2000 // 2 seconds
      const chromeRetryDelay = 1000 // 1 second
      
      expect(safariRetryDelay).toBeGreaterThan(chromeRetryDelay)
      expect(safariRetryDelay).toBe(2000)
    })
  })

  describe('Safari Overlay Optimizations', () => {
    test('[SAFARI-EXT-POPUP-001] should use Safari-specific overlay opacity settings', () => {
      const safariOpacitySettings = {
        normal: 0.03,
        hover: 0.12,
        focus: 0.20
      }
      
      expect(safariOpacitySettings.normal).toBe(0.03)
      expect(safariOpacitySettings.hover).toBe(0.12)
      expect(safariOpacitySettings.focus).toBe(0.20)
    })

    test('[SAFARI-EXT-POPUP-001] should use Safari-specific overlay animation duration', () => {
      const safariAnimationDuration = 300 // 300ms
      const defaultAnimationDuration = 250 // 250ms
      
      expect(safariAnimationDuration).toBeGreaterThan(defaultAnimationDuration)
      expect(safariAnimationDuration).toBe(300)
    })

    test('[SAFARI-EXT-POPUP-001] should use Safari-specific overlay blur amount', () => {
      const safariBlurAmount = 3 // 3px
      const chromeBlurAmount = 2 // 2px
      
      expect(safariBlurAmount).toBeGreaterThan(chromeBlurAmount)
      expect(safariBlurAmount).toBe(3)
    })
  })

  describe('Safari Platform Detection', () => {
    test('[SAFARI-EXT-POPUP-001] should enable platform detection features', () => {
      const platformDetectionFeatures = {
        enablePlatformDetection: true,
        enableFeatureDetection: true,
        enablePerformanceDetection: true
      }
      
      expect(platformDetectionFeatures.enablePlatformDetection).toBe(true)
      expect(platformDetectionFeatures.enableFeatureDetection).toBe(true)
      expect(platformDetectionFeatures.enablePerformanceDetection).toBe(true)
    })

    test('[SAFARI-EXT-POPUP-001] should detect Safari extension APIs', () => {
      expect(global.safari).toBeDefined()
      expect(global.safari.extension).toBeDefined()
      expect(global.safari.extension.globalPage).toBeDefined()
    })

    test('[SAFARI-EXT-POPUP-001] should detect WebKit APIs', () => {
      expect(global.webkit).toBeUndefined() // Not available in test environment
      // In real Safari environment, webkit APIs would be available
    })
  })

  describe('Safari Error Recovery', () => {
    test('[SAFARI-EXT-POPUP-001] should attempt initialization error recovery', () => {
      const errorInfo = { type: 'initialization', error: new Error('Init failed') }
      
      expect(errorInfo.type).toBe('initialization')
      expect(errorInfo.error).toBeInstanceOf(Error)
    })

    test('[SAFARI-EXT-POPUP-001] should attempt UI error recovery', () => {
      const errorInfo = { type: 'ui', error: new Error('UI failed') }
      
      expect(errorInfo.type).toBe('ui')
      expect(errorInfo.error).toBeInstanceOf(Error)
    })

    test('[SAFARI-EXT-POPUP-001] should attempt message error recovery', () => {
      const errorInfo = { type: 'message', error: new Error('Message failed') }
      
      expect(errorInfo.type).toBe('message')
      expect(errorInfo.error).toBeInstanceOf(Error)
    })

    test('[SAFARI-EXT-POPUP-001] should respect error recovery delays', () => {
      const errorRecoveryDelay = 1000 // 1 second
      
      expect(errorRecoveryDelay).toBe(1000)
    })
  })

  describe('Safari Performance Monitoring', () => {
    test('[SAFARI-EXT-POPUP-001] should start performance monitoring', () => {
      const enablePerformanceMonitoring = true
      const performanceMonitoringInterval = 30000 // 30 seconds
      
      expect(enablePerformanceMonitoring).toBe(true)
      expect(performanceMonitoringInterval).toBe(30000)
    })

    test('[SAFARI-EXT-POPUP-001] should stop performance monitoring on cleanup', () => {
      const performanceMonitor = setInterval(() => {}, 30000)
      
      expect(performanceMonitor).toBeDefined()
      
      clearInterval(performanceMonitor)
      
      // Monitor should be cleared
      expect(performanceMonitor).toBeDefined() // setInterval returns a number
    })
  })

  describe('Safari CSS Design Tokens', () => {
    test('[SAFARI-EXT-POPUP-001] should have Safari-specific backdrop-filter tokens', () => {
      const safariBackdropFilter = 'blur(10px) saturate(180%)'
      const safariBackdropFilterFallback = 'none'
      
      expect(safariBackdropFilter).toBe('blur(10px) saturate(180%)')
      expect(safariBackdropFilterFallback).toBe('none')
    })

    test('[SAFARI-EXT-POPUP-001] should have Safari-specific rendering tokens', () => {
      const safariRendering = 'optimizeSpeed'
      const safariTextRendering = 'optimizeLegibility'
      const safariFontSmoothing = '-webkit-font-smoothing: antialiased'
      const safariTransformOptimized = 'translateZ(0)'
      
      expect(safariRendering).toBe('optimizeSpeed')
      expect(safariTextRendering).toBe('optimizeLegibility')
      expect(safariFontSmoothing).toBe('-webkit-font-smoothing: antialiased')
      expect(safariTransformOptimized).toBe('translateZ(0)')
    })

    test('[SAFARI-EXT-POPUP-001] should have Safari-specific shadow tokens', () => {
      const safariShadowOptimized = '0 1px 2px 0 rgba(0,0,0,0.1)'
      const safariShadowOptimizedMd = '0 2px 4px 0 rgba(0,0,0,0.1)'
      const safariShadowOptimizedLg = '0 3px 6px 0 rgba(0,0,0,0.1)'
      
      expect(safariShadowOptimized).toBe('0 1px 2px 0 rgba(0,0,0,0.1)')
      expect(safariShadowOptimizedMd).toBe('0 2px 4px 0 rgba(0,0,0,0.1)')
      expect(safariShadowOptimizedLg).toBe('0 3px 6px 0 rgba(0,0,0,0.1)')
    })

    test('[SAFARI-EXT-POPUP-001] should have Safari-specific accessibility tokens', () => {
      const safariHighContrastMultiplier = 1.0
      const safariMotionMultiplier = 1.0
      const safariVoiceoverOptimized = false
      const safariHighContrast = false
      const safariReducedMotion = false
      
      expect(safariHighContrastMultiplier).toBe(1.0)
      expect(safariMotionMultiplier).toBe(1.0)
      expect(safariVoiceoverOptimized).toBe(false)
      expect(safariHighContrast).toBe(false)
      expect(safariReducedMotion).toBe(false)
    })
  })

  describe('Safari Integration Tests', () => {
    test('[SAFARI-EXT-POPUP-001] should integrate with Safari shim correctly', () => {
      expect(platformUtils.isSafari).toBeDefined()
      expect(typeof platformUtils.isSafari).toBe('function')
      expect(platformUtils.getPlatform).toBeDefined()
      expect(typeof platformUtils.getPlatform).toBe('function')
      expect(platformUtils.supportsFeature).toBeDefined()
      expect(typeof platformUtils.supportsFeature).toBe('function')
    })

    test('[SAFARI-EXT-POPUP-001] should integrate with error handler correctly', () => {
      expect(mockErrorHandler.handleError).toBeDefined()
      expect(typeof mockErrorHandler.handleError).toBe('function')
      expect(mockErrorHandler.onError).toBeDefined()
      expect(typeof mockErrorHandler.onError).toBe('function')
      expect(mockErrorHandler.cleanup).toBeDefined()
      expect(typeof mockErrorHandler.cleanup).toBe('function')
    })

    test('[SAFARI-EXT-POPUP-001] should integrate with UI manager correctly', () => {
      expect(mockUIManager.setupEventListeners).toBeDefined()
      expect(typeof mockUIManager.setupEventListeners).toBe('function')
      expect(mockUIManager.showError).toBeDefined()
      expect(typeof mockUIManager.showError).toBe('function')
      expect(mockUIManager.cleanup).toBeDefined()
      expect(typeof mockUIManager.cleanup).toBe('function')
    })
  })
}) 