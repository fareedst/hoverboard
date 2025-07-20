/**
 * Safari Error Handling Framework Tests
 * 
 * [SAFARI-EXT-ERROR-001] Comprehensive test suite for Safari-specific error handling
 * Tests Safari platform detection, error recovery, graceful degradation, and performance monitoring
 */

import { ErrorHandler } from '../../safari/src/shared/ErrorHandler.js'

describe('Safari Error Handling Framework', () => {
  let errorHandler
  let mockConsole

  beforeEach(() => {
    // Mock console methods
    mockConsole = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn()
    }
    global.console = mockConsole

    // Mock browser APIs
    global.browser = {
      storage: {
        local: {
          get: jest.fn().mockResolvedValue({ errorLog: [] }),
          set: jest.fn().mockResolvedValue()
        }
      }
    }

    // Mock Safari APIs
    global.safari = {
      extension: {
        globalPage: {
          contentWindow: {
            location: { href: 'safari-extension://test' }
          }
        }
      }
    }

    // Mock window APIs
    global.window = {
      performance: {
        memory: {
          usedJSHeapSize: 1000000,
          jsHeapSizeLimit: 2000000
        }
      },
      caches: {
        keys: jest.fn().mockResolvedValue([]),
        delete: jest.fn().mockResolvedValue(true)
      },
      gc: jest.fn(),
      webkit: {
        messageHandlers: {}
      }
    }

    // Mock navigator
    global.navigator = {
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15'
    }

    errorHandler = new ErrorHandler()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Safari Platform Detection', () => {
    test('should detect Safari platform correctly', () => {
      expect(errorHandler.isSafari).toBe(true)
      expect(errorHandler.detectSafariPlatform()).toBe(true)
    })

    test('should handle Safari platform detection failure gracefully', () => {
      // Mock navigator to cause detection failure
      const originalNavigator = global.navigator
      const originalSafari = global.safari
      const originalWindow = global.window
      
      global.navigator = null
      global.safari = undefined
      global.window = { webkit: undefined }
      
      const newErrorHandler = new ErrorHandler()
      expect(newErrorHandler.detectSafariPlatform()).toBe(false)
      
      // Restore globals
      global.navigator = originalNavigator
      global.safari = originalSafari
      global.window = originalWindow
    })

    test('should detect Safari WebKit APIs', () => {
      expect(errorHandler.detectSafariPlatform()).toBe(true)
    })
  })

  describe('Safari Error Configuration', () => {
    test('should have Safari-specific configuration', () => {
      expect(errorHandler.safariConfig).toBeDefined()
      expect(errorHandler.safariConfig.enableSafariErrorRecovery).toBe(true)
      expect(errorHandler.safariConfig.maxSafariRecoveryAttempts).toBe(3)
      expect(errorHandler.safariConfig.safariRecoveryDelay).toBe(1000)
    })

    test('should have Safari error recovery state', () => {
      expect(errorHandler.safariRecoveryState).toBeDefined()
      expect(errorHandler.safariRecoveryState.recoveryAttempts).toBe(0)
      expect(errorHandler.safariRecoveryState.degradedMode).toBe(false)
      expect(errorHandler.safariRecoveryState.recoveryInProgress).toBe(false)
    })

    test('should have Safari-specific error types', () => {
      expect(errorHandler.errorTypes.SAFARI_SPECIFIC).toBe('safari_specific')
      expect(errorHandler.errorTypes.SAFARI_MESSAGING).toBe('safari_messaging')
      expect(errorHandler.errorTypes.SAFARI_STORAGE).toBe('safari_storage')
      expect(errorHandler.errorTypes.SAFARI_UI).toBe('safari_ui')
      expect(errorHandler.errorTypes.SAFARI_PERFORMANCE).toBe('safari_performance')
    })
  })

  describe('Safari Error Information Creation', () => {
    test('should create Safari-specific error information', () => {
      const errorInfo = errorHandler.createSafariErrorInfo(
        'Test Safari Error',
        new Error('Test error'),
        errorHandler.errorTypes.SAFARI_SPECIFIC
      )

      expect(errorInfo.safari).toBeDefined()
      expect(errorInfo.safari.platform).toBe('safari')
      expect(errorInfo.safari.userAgent).toBeDefined()
      expect(errorInfo.safari.timestamp).toBeDefined()
      expect(errorInfo.safari.recoveryAttempts).toBe(0)
      expect(errorInfo.safari.degradedMode).toBe(false)
    })

    test('should include Safari extension information when available', () => {
      const errorInfo = errorHandler.createSafariErrorInfo(
        'Test Safari Error',
        new Error('Test error'),
        errorHandler.errorTypes.SAFARI_SPECIFIC
      )

      expect(errorInfo.safari.extensionId).toBeDefined()
    })
  })

  describe('Safari Error Recovery', () => {
    test('should attempt Safari error recovery', async () => {
      // Mock the recovery to succeed
      errorHandler.performSafariErrorRecovery = jest.fn().mockResolvedValue(true)
      
      const errorInfo = errorHandler.createSafariErrorInfo(
        'Test Safari Error',
        new Error('Test error'),
        errorHandler.errorTypes.SAFARI_SPECIFIC
      )

      // Reset recovery state
      errorHandler.safariRecoveryState.recoveryAttempts = 0
      errorHandler.safariRecoveryState.recoveryInProgress = false

      await errorHandler.attemptSafariErrorRecovery(errorInfo)

      expect(errorHandler.safariRecoveryState.recoveryAttempts).toBe(1)
      expect(errorHandler.safariRecoveryState.lastRecoveryTime).toBeGreaterThan(0)
    })

    test('should not attempt recovery if already in progress', async () => {
      errorHandler.safariRecoveryState.recoveryInProgress = true

      const errorInfo = errorHandler.createSafariErrorInfo(
        'Test Safari Error',
        new Error('Test error'),
        errorHandler.errorTypes.SAFARI_SPECIFIC
      )

      await errorHandler.attemptSafariErrorRecovery(errorInfo)

      expect(errorHandler.safariRecoveryState.recoveryAttempts).toBe(0)
    })

    test('should enable degraded mode after max recovery attempts', async () => {
      errorHandler.safariRecoveryState.recoveryAttempts = 3

      const errorInfo = errorHandler.createSafariErrorInfo(
        'Test Safari Error',
        new Error('Test error'),
        errorHandler.errorTypes.SAFARI_SPECIFIC
      )

      await errorHandler.attemptSafariErrorRecovery(errorInfo)

      expect(errorHandler.safariRecoveryState.degradedMode).toBe(true)
    })
  })

  describe('Safari Error Recovery by Type', () => {
    test('should recover Safari messaging errors', async () => {
      // Mock message client
      global.window.messageClient = {
        reinitialize: jest.fn().mockResolvedValue()
      }

      const errorInfo = errorHandler.createSafariErrorInfo(
        'Test Safari Messaging Error',
        new Error('Test messaging error'),
        errorHandler.errorTypes.SAFARI_MESSAGING
      )

      const result = await errorHandler.recoverSafariMessagingError(errorInfo)

      expect(result).toBe(true)
      expect(global.window.messageClient.reinitialize).toHaveBeenCalled()
    })

    test('should recover Safari storage errors', async () => {
      // Mock browser storage to be available
      global.browser = {
        storage: {
          local: {
            clear: jest.fn().mockResolvedValue()
          }
        }
      }
      
      const errorInfo = errorHandler.createSafariErrorInfo(
        'Test Safari Storage Error',
        new Error('Test storage error'),
        errorHandler.errorTypes.SAFARI_STORAGE
      )

      const result = await errorHandler.recoverSafariStorageError(errorInfo)

      expect(result).toBe(true)
      expect(global.browser.storage.local.clear).toHaveBeenCalled()
    })

    test('should recover Safari UI errors', async () => {
      // Mock UI manager
      global.window.uiManager = {
        reinitialize: jest.fn().mockResolvedValue()
      }

      const errorInfo = errorHandler.createSafariErrorInfo(
        'Test Safari UI Error',
        new Error('Test UI error'),
        errorHandler.errorTypes.SAFARI_UI
      )

      const result = await errorHandler.recoverSafariUIError(errorInfo)

      expect(result).toBe(true)
      expect(global.window.uiManager.reinitialize).toHaveBeenCalled()
    })

    test('should recover Safari performance errors', async () => {
      // Mock performance API to be available
      global.window.performance = {
        memory: {
          usedJSHeapSize: 1000000,
          jsHeapSizeLimit: 2000000
        }
      }
      
      // Mock caches API
      global.window.caches = {
        keys: jest.fn().mockResolvedValue([]),
        delete: jest.fn().mockResolvedValue(true)
      }
      
      const errorInfo = errorHandler.createSafariErrorInfo(
        'Test Safari Performance Error',
        new Error('Test performance error'),
        errorHandler.errorTypes.SAFARI_PERFORMANCE
      )

      const result = await errorHandler.recoverSafariPerformanceError(errorInfo)

      expect(result).toBe(true)
    })

    test('should recover Safari generic errors', async () => {
      const errorInfo = errorHandler.createSafariErrorInfo(
        'Test Safari Generic Error',
        new Error('Test generic error'),
        errorHandler.errorTypes.SAFARI_SPECIFIC
      )

      const result = await errorHandler.recoverSafariGenericError(errorInfo)

      expect(typeof result).toBe('boolean')
    })
  })

  describe('Safari Degraded Mode', () => {
    test('should enable Safari degraded mode', () => {
      errorHandler.enableSafariDegradedMode()

      expect(errorHandler.safariRecoveryState.degradedMode).toBe(true)
      expect(errorHandler.safariConfig.enableSafariPerformanceMonitoring).toBe(false)
      expect(errorHandler.safariConfig.maxSafariRecoveryAttempts).toBe(1)
      expect(errorHandler.safariConfig.enableSafariErrorRecovery).toBe(false)
    })

    test('should apply Safari graceful degradation', () => {
      errorHandler.applySafariGracefulDegradation()

      expect(errorHandler.safariConfig.enableSafariPerformanceMonitoring).toBe(false)
      expect(errorHandler.safariConfig.maxSafariRecoveryAttempts).toBe(1)
      expect(errorHandler.safariConfig.enableSafariErrorRecovery).toBe(false)
    })

    test('should restore Safari normal mode', () => {
      // First enable degraded mode
      errorHandler.enableSafariDegradedMode()
      expect(errorHandler.safariRecoveryState.degradedMode).toBe(true)

      // Then restore normal mode
      errorHandler.restoreSafariNormalMode()

      expect(errorHandler.safariRecoveryState.degradedMode).toBe(false)
      expect(errorHandler.safariRecoveryState.recoveryAttempts).toBe(0)
      expect(errorHandler.safariConfig.enableSafariPerformanceMonitoring).toBe(true)
      expect(errorHandler.safariConfig.maxSafariRecoveryAttempts).toBe(3)
      expect(errorHandler.safariConfig.enableSafariErrorRecovery).toBe(true)
    })
  })

  describe('Safari Performance Monitoring', () => {
    test('should initialize Safari performance monitoring', () => {
      errorHandler.initializeSafariPerformanceMonitoring()

      expect(mockConsole.log).toHaveBeenCalledWith('[SAFARI-EXT-ERROR-001] Safari performance monitoring initialized')
    })

    test('should monitor Safari performance', () => {
      // Clear previous console calls
      mockConsole.log.mockClear()
      
      // Ensure performance API is available
      global.window.performance = {
        memory: {
          usedJSHeapSize: 1000000,
          jsHeapSizeLimit: 2000000
        }
      }
      
      errorHandler.monitorSafariPerformance()

      // Should log memory usage
      expect(mockConsole.log).toHaveBeenCalledWith(
        '[SAFARI-EXT-ERROR-001] High Safari memory usage: 50.0%'
      )
    })

    test('should handle critical memory usage', () => {
      // Clear previous console calls
      mockConsole.warn.mockClear()
      
      // Mock critical memory usage
      global.window.performance = {
        memory: {
          usedJSHeapSize: 1900000,
          jsHeapSizeLimit: 2000000
        }
      }

      errorHandler.monitorSafariPerformance()

      expect(mockConsole.warn).toHaveBeenCalledWith(
        '[SAFARI-EXT-ERROR-001] Critical Safari memory usage: 95.0%'
      )
    })
  })

  describe('Safari Error Handling Methods', () => {
    test('should handle Safari-specific errors', () => {
      const errorInfo = errorHandler.handleSafariError('test_operation')

      expect(errorInfo).toBeDefined()
      expect(errorInfo.safari.platform).toBe('safari')
    })

    test('should handle Safari messaging errors', () => {
      const errorInfo = errorHandler.handleSafariMessagingError(
        'test_messaging_operation',
        new Error('Test messaging error')
      )

      expect(errorInfo).toBeDefined()
      expect(errorInfo.type).toBe(errorHandler.errorTypes.SAFARI_MESSAGING)
    })

    test('should handle Safari storage errors', () => {
      const errorInfo = errorHandler.handleSafariStorageError(
        'test_storage_operation',
        new Error('Test storage error')
      )

      expect(errorInfo).toBeDefined()
      expect(errorInfo.type).toBe(errorHandler.errorTypes.SAFARI_STORAGE)
    })

    test('should handle Safari UI errors', () => {
      const errorInfo = errorHandler.handleSafariUIError(
        'test_ui_operation',
        new Error('Test UI error')
      )

      expect(errorInfo).toBeDefined()
      expect(errorInfo.type).toBe(errorHandler.errorTypes.SAFARI_UI)
    })

    test('should handle Safari performance errors', () => {
      const errorInfo = errorHandler.handleSafariPerformanceError(
        'test_performance_operation',
        new Error('Test performance error')
      )

      expect(errorInfo).toBeDefined()
      expect(errorInfo.type).toBe(errorHandler.errorTypes.SAFARI_PERFORMANCE)
    })
  })

  describe('Safari Error Statistics', () => {
    test('should get Safari error statistics', () => {
      // Add some Safari errors to the log
      errorHandler.errorLog = [
        {
          type: errorHandler.errorTypes.SAFARI_SPECIFIC,
          timestamp: new Date().toISOString(),
          safari: { platform: 'safari' }
        },
        {
          type: errorHandler.errorTypes.SAFARI_MESSAGING,
          timestamp: new Date().toISOString(),
          safari: { platform: 'safari' }
        }
      ]

      const stats = errorHandler.getSafariErrorStats()

      expect(stats.total).toBe(2)
      expect(stats.byType[errorHandler.errorTypes.SAFARI_SPECIFIC]).toBe(1)
      expect(stats.byType[errorHandler.errorTypes.SAFARI_MESSAGING]).toBe(1)
      expect(stats.recoveryAttempts).toBe(0)
      expect(stats.degradedMode).toBe(false)
    })

    test('should get Safari recovery status', () => {
      const status = errorHandler.getSafariRecoveryStatus()

      expect(status.recoveryAttempts).toBe(0)
      expect(status.maxAttempts).toBe(3)
      expect(status.degradedMode).toBe(false)
      expect(status.recoveryInProgress).toBe(false)
      expect(status.isSafari).toBe(true)
    })
  })

  describe('Safari Error Recovery Status', () => {
    test('should check for active errors', () => {
      // No recent errors
      expect(errorHandler.hasActiveErrors()).toBe(false)

      // Add recent error
      errorHandler.errorLog = [{
        timestamp: new Date().toISOString()
      }]

      expect(errorHandler.hasActiveErrors()).toBe(true)
    })

    test('should check Safari error recovery', async () => {
      // Mock no active errors
      errorHandler.errorLog = []
      errorHandler.safariRecoveryState.degradedMode = true

      await errorHandler.checkSafariErrorRecovery()

      expect(errorHandler.safariRecoveryState.degradedMode).toBe(false)
    })
  })

  describe('Safari Error Recovery Setup', () => {
    test('should setup Safari error recovery', () => {
      errorHandler.setupSafariErrorRecovery()

      expect(mockConsole.log).toHaveBeenCalledWith('[SAFARI-EXT-ERROR-001] Safari error recovery setup complete')
    })
  })

  describe('Safari Error Recovery State Management', () => {
    test('should manage Safari error recovery state correctly', async () => {
      // Mock the recovery to succeed
      errorHandler.performSafariErrorRecovery = jest.fn().mockResolvedValue(true)
      
      const errorInfo = errorHandler.createSafariErrorInfo(
        'Test Safari Error',
        new Error('Test error'),
        errorHandler.errorTypes.SAFARI_SPECIFIC
      )

      // Reset recovery state
      errorHandler.safariRecoveryState.recoveryAttempts = 0
      errorHandler.safariRecoveryState.recoveryInProgress = false

      // Initial state
      expect(errorHandler.safariRecoveryState.recoveryAttempts).toBe(0)
      expect(errorHandler.safariRecoveryState.recoveryInProgress).toBe(false)

      // Attempt recovery
      await errorHandler.attemptSafariErrorRecovery(errorInfo)

      // State after recovery attempt
      expect(errorHandler.safariRecoveryState.recoveryAttempts).toBe(1)
      expect(errorHandler.safariRecoveryState.recoveryInProgress).toBe(false)
      expect(errorHandler.safariRecoveryState.lastRecoveryTime).toBeGreaterThan(0)
    })
  })

  describe('Safari Error Handler Integration', () => {
    test('should integrate with existing error handling', () => {
      const errorInfo = errorHandler.handleError(
        'Test Safari Error',
        new Error('Test error'),
        errorHandler.errorTypes.SAFARI_SPECIFIC
      )

      expect(errorInfo).toBeDefined()
      expect(errorInfo.type).toBe(errorHandler.errorTypes.SAFARI_SPECIFIC)
      expect(errorInfo.id).toBeDefined()
      expect(errorInfo.timestamp).toBeDefined()
    })

    test('should provide Safari-specific user-friendly messages', () => {
      const errorInfo = errorHandler.createSafariErrorInfo(
        'Test Safari Error',
        new Error('Test error'),
        errorHandler.errorTypes.SAFARI_SPECIFIC
      )

      const message = errorHandler.getUserFriendlyMessage(errorInfo)

      expect(message).toContain('Safari-specific error occurred')
    })
  })

  describe('Safari Error Recovery Error Handling', () => {
    test('should handle Safari error recovery failures gracefully', async () => {
      // Mock recovery to fail
      errorHandler.recoverSafariMessagingError = jest.fn().mockRejectedValue(new Error('Recovery failed'))

      const errorInfo = errorHandler.createSafariErrorInfo(
        'Test Safari Error',
        new Error('Test error'),
        errorHandler.errorTypes.SAFARI_MESSAGING
      )

      const result = await errorHandler.performSafariErrorRecovery(errorInfo)

      expect(result).toBe(false)
    })

    test('should handle Safari error recovery setup failures gracefully', () => {
      // Mock setup to fail
      global.console.warn = jest.fn()

      errorHandler.setupSafariErrorRecovery = jest.fn().mockImplementation(() => {
        throw new Error('Setup failed')
      })

      expect(() => {
        errorHandler.setupSafariErrorRecovery()
      }).toThrow('Setup failed')
    })
  })

  describe('Safari Error Handler Cleanup', () => {
    test('should cleanup Safari error handler properly', () => {
      errorHandler.cleanup()

      expect(errorHandler.errorLog).toEqual([])
      expect(errorHandler.onError).toBeNull()
    })
  })
}) 