/**
 * [OVERLAY-REFRESH-TEST-001] Overlay Refresh Button Performance Tests
 * 
 * Performance tests for the overlay refresh button functionality
 * Tests response times, memory usage, and concurrent operations
 */

import { OverlayManager } from '../../src/features/content/overlay-manager.js'

// [OVERLAY-REFRESH-TEST-001] Mock utilities for performance testing
const createMockDocument = () => {
  const elements = new Map()
  
  return {
    createElement: jest.fn((tag) => {
      const element = {
        tagName: tag.toUpperCase(),
        className: '',
        innerHTML: '',
        style: { cssText: '' },
        setAttribute: jest.fn(),
        getAttribute: jest.fn(),
        addEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
        onclick: null,
        querySelector: jest.fn((selector) => {
          if (selector === '.refresh-button') {
            return elements.get('button') || null
          }
          return null
        }),
        querySelectorAll: jest.fn(() => []),
        appendChild: jest.fn(),
        contains: jest.fn(() => true),
        classList: {
          add: jest.fn(),
          remove: jest.fn(),
          contains: jest.fn()
        },
        disabled: false
      }
      elements.set(tag, element)
      return element
    }),
    querySelector: jest.fn((selector) => {
      if (selector === '.refresh-button') {
        return elements.get('button') || null
      }
      return null
    }),
    querySelectorAll: jest.fn(() => []),
    body: {
      appendChild: jest.fn(),
      removeChild: jest.fn()
    },
    getElementById: jest.fn(() => null)
  }
}

// [OVERLAY-REFRESH-TEST-001] Performance measurement utilities
const measureExecutionTime = async (fn) => {
  const start = performance.now()
  await fn()
  const end = performance.now()
  return end - start
}

const measureMemoryUsage = () => {
  if (global.gc) {
    global.gc()
  }
  return process.memoryUsage()
}

// [OVERLAY-REFRESH-TEST-001] Performance test suite for overlay refresh button
describe('[OVERLAY-REFRESH-001] Performance Tests', () => {
  let overlayManager
  let mockDocument

  beforeEach(() => {
    // [OVERLAY-REFRESH-TEST-001] Setup performance test environment
    mockDocument = createMockDocument()
    overlayManager = new OverlayManager(mockDocument, {})
    overlayManager.showMessage = jest.fn()
    overlayManager.show = jest.fn()
    overlayManager.refreshOverlayContent = jest.fn().mockResolvedValue({
      bookmark: { url: 'https://example.com', tags: ['test'] },
      pageTitle: 'Test Page',
      pageUrl: 'https://example.com'
    })
  })

  afterEach(() => {
    // [OVERLAY-REFRESH-TEST-001] Cleanup performance test environment
    jest.clearAllMocks()
  })

  // [OVERLAY-REFRESH-TEST-001] Response time tests
  describe('Response Time Performance', () => {
    test('[OVERLAY-REFRESH-PERFORMANCE-001] Should respond within 100ms for single refresh', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      
      // Act
      const executionTime = await measureExecutionTime(async () => {
        await refreshButton.onclick()
      })
      
      // Assert
      expect(executionTime).toBeLessThan(100)
    })

    test('[OVERLAY-REFRESH-PERFORMANCE-001] Should handle rapid successive clicks efficiently', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      
      // Act
      const executionTime = await measureExecutionTime(async () => {
        const promises = Array(5).fill().map(() => refreshButton.onclick())
        await Promise.all(promises)
      })
      
      // Assert
      expect(executionTime).toBeLessThan(500)
    })

    test('[OVERLAY-REFRESH-PERFORMANCE-001] Should maintain responsiveness during network delays', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      overlayManager.show(content)
      overlayManager.refreshOverlayContent = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 200))
      )
      const refreshButton = mockDocument.querySelector('.refresh-button')
      
      // Act
      const executionTime = await measureExecutionTime(async () => {
        await refreshButton.onclick()
      })
      
      // Assert
      expect(executionTime).toBeLessThan(250)
    })
  })

  // [OVERLAY-REFRESH-TEST-001] Memory usage tests
  describe('Memory Usage Performance', () => {
    test('[OVERLAY-REFRESH-PERFORMANCE-001] Should not cause memory leaks during refresh operations', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      
      // Act
      const initialMemory = measureMemoryUsage()
      
      for (let i = 0; i < 10; i++) {
        await refreshButton.onclick()
      }
      
      const finalMemory = measureMemoryUsage()
      
      // Assert
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed
      expect(memoryIncrease).toBeLessThan(1024 * 1024) // Less than 1MB increase
    })

    test('[OVERLAY-REFRESH-PERFORMANCE-001] Should clean up event listeners properly', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      
      // Act
      const initialListeners = refreshButton.addEventListener.mock.calls.length
      
      for (let i = 0; i < 5; i++) {
        await refreshButton.onclick()
      }
      
      const finalListeners = refreshButton.addEventListener.mock.calls.length
      
      // Assert
      expect(finalListeners).toBeLessThanOrEqual(initialListeners + 5)
    })
  })

  // [OVERLAY-REFRESH-TEST-001] Concurrent operation tests
  describe('Concurrent Operation Performance', () => {
    test('[OVERLAY-REFRESH-PERFORMANCE-001] Should handle concurrent refresh requests efficiently', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      
      // Act
      const startTime = performance.now()
      
      const promises = Array(10).fill().map(() => refreshButton.onclick())
      await Promise.all(promises)
      
      const endTime = performance.now()
      const totalTime = endTime - startTime
      
      // Assert
      expect(totalTime).toBeLessThan(1000)
      expect(overlayManager.refreshOverlayContent).toHaveBeenCalledTimes(10)
    })

    test('[OVERLAY-REFRESH-PERFORMANCE-001] Should prevent duplicate requests during processing', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      overlayManager.show(content)
      overlayManager.refreshOverlayContent = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      )
      const refreshButton = mockDocument.querySelector('.refresh-button')
      
      // Act
      const promises = Array(5).fill().map(() => refreshButton.onclick())
      await Promise.all(promises)
      
      // Assert
      expect(overlayManager.refreshOverlayContent).toHaveBeenCalledTimes(1)
    })

    test('[OVERLAY-REFRESH-PERFORMANCE-001] Should maintain UI responsiveness during concurrent operations', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      
      // Act
      const promises = Array(3).fill().map(async () => {
        const start = performance.now()
        await refreshButton.onclick()
        const end = performance.now()
        return end - start
      })
      
      const responseTimes = await Promise.all(promises)
      
      // Assert
      responseTimes.forEach(time => {
        expect(time).toBeLessThan(200)
      })
    })
  })

  // [OVERLAY-REFRESH-TEST-001] Large data set tests
  describe('Large Data Set Performance', () => {
    test('[OVERLAY-REFRESH-PERFORMANCE-001] Should handle large bookmark data efficiently', async () => {
      // Arrange
      const largeBookmark = {
        url: 'https://example.com',
        description: 'A'.repeat(1000),
        tags: Array(50).fill().map((_, i) => `tag${i}`),
        shared: 'yes',
        toread: 'no'
      }
      
      const content = {
        bookmark: largeBookmark,
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      overlayManager.show(content)
      overlayManager.refreshOverlayContent = jest.fn().mockResolvedValue({
        bookmark: largeBookmark,
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      })
      const refreshButton = mockDocument.querySelector('.refresh-button')
      
      // Act
      const executionTime = await measureExecutionTime(async () => {
        await refreshButton.onclick()
      })
      
      // Assert
      expect(executionTime).toBeLessThan(200)
    })

    test('[OVERLAY-REFRESH-PERFORMANCE-001] Should handle many concurrent refreshes with large data', async () => {
      // Arrange
      const largeBookmark = {
        url: 'https://example.com',
        description: 'A'.repeat(500),
        tags: Array(25).fill().map((_, i) => `tag${i}`),
        shared: 'yes',
        toread: 'no'
      }
      
      const content = {
        bookmark: largeBookmark,
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      overlayManager.show(content)
      overlayManager.refreshOverlayContent = jest.fn().mockResolvedValue({
        bookmark: largeBookmark,
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      })
      const refreshButton = mockDocument.querySelector('.refresh-button')
      
      // Act
      const executionTime = await measureExecutionTime(async () => {
        const promises = Array(5).fill().map(() => refreshButton.onclick())
        await Promise.all(promises)
      })
      
      // Assert
      expect(executionTime).toBeLessThan(1000)
    })
  })

  // [OVERLAY-REFRESH-TEST-001] Network simulation tests
  describe('Network Performance Simulation', () => {
    test('[OVERLAY-REFRESH-PERFORMANCE-001] Should handle slow network responses gracefully', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      overlayManager.show(content)
      overlayManager.refreshOverlayContent = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 500))
      )
      const refreshButton = mockDocument.querySelector('.refreshButton')
      
      // Act
      const executionTime = await measureExecutionTime(async () => {
        await refreshButton.onclick()
      })
      
      // Assert
      expect(executionTime).toBeLessThan(600)
    })

    test('[OVERLAY-REFRESH-PERFORMANCE-001] Should handle network timeouts efficiently', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      overlayManager.show(content)
      overlayManager.refreshOverlayContent = jest.fn().mockRejectedValue(new Error('Network timeout'))
      const refreshButton = mockDocument.querySelector('.refresh-button')
      
      // Act
      const executionTime = await measureExecutionTime(async () => {
        await refreshButton.onclick()
      })
      
      // Assert
      expect(executionTime).toBeLessThan(100)
    })

    test('[OVERLAY-REFRESH-PERFORMANCE-001] Should handle intermittent network failures', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      overlayManager.show(content)
      let callCount = 0
      overlayManager.refreshOverlayContent = jest.fn().mockImplementation(() => {
        callCount++
        if (callCount % 2 === 0) {
          return Promise.resolve({
            bookmark: { url: 'https://example.com', tags: ['test'] },
            pageTitle: 'Test Page',
            pageUrl: 'https://example.com'
          })
        } else {
          return Promise.reject(new Error('Network error'))
        }
      })
      const refreshButton = mockDocument.querySelector('.refresh-button')
      
      // Act
      const executionTime = await measureExecutionTime(async () => {
        const promises = Array(6).fill().map(() => refreshButton.onclick())
        await Promise.all(promises)
      })
      
      // Assert
      expect(executionTime).toBeLessThan(500)
    })
  })

  // [OVERLAY-REFRESH-TEST-001] UI responsiveness tests
  describe('UI Responsiveness Performance', () => {
    test('[OVERLAY-REFRESH-PERFORMANCE-001] Should maintain UI responsiveness during refresh', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      
      // Act
      const startTime = performance.now()
      
      // Simulate UI interactions during refresh
      const refreshPromise = refreshButton.onclick()
      
      // Simulate other UI operations
      for (let i = 0; i < 10; i++) {
        refreshButton.focus()
        refreshButton.blur()
      }
      
      await refreshPromise
      const endTime = performance.now()
      
      // Assert
      expect(endTime - startTime).toBeLessThan(200)
    })

    test('[OVERLAY-REFRESH-PERFORMANCE-001] Should not block other overlay operations', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      
      // Act
      const startTime = performance.now()
      
      // Start refresh operation
      const refreshPromise = refreshButton.onclick()
      
      // Simulate other overlay operations
      overlayManager.showMessage('Test message', 'info')
      overlayManager.hide()
      overlayManager.show(content)
      
      await refreshPromise
      const endTime = performance.now()
      
      // Assert
      expect(endTime - startTime).toBeLessThan(300)
    })
  })

  // [OVERLAY-REFRESH-TEST-001] Resource usage tests
  describe('Resource Usage Performance', () => {
    test('[OVERLAY-REFRESH-PERFORMANCE-001] Should minimize CPU usage during refresh', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      
      // Act
      const startUsage = process.cpuUsage()
      
      for (let i = 0; i < 5; i++) {
        await refreshButton.onclick()
      }
      
      const endUsage = process.cpuUsage()
      const cpuUsage = endUsage.user - startUsage.user
      
      // Assert
      expect(cpuUsage).toBeLessThan(1000000) // Less than 1 second of CPU time
    })

    test('[OVERLAY-REFRESH-PERFORMANCE-001] Should not cause excessive DOM manipulation', async () => {
      // Arrange
      const content = {
        bookmark: { url: 'https://example.com', tags: ['test'] },
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com'
      }
      
      overlayManager.show(content)
      const refreshButton = mockDocument.querySelector('.refresh-button')
      
      // Act
      const initialCalls = mockDocument.createElement.mock.calls.length
      
      for (let i = 0; i < 10; i++) {
        await refreshButton.onclick()
      }
      
      const finalCalls = mockDocument.createElement.mock.calls.length
      const newElements = finalCalls - initialCalls
      
      // Assert
      expect(newElements).toBeLessThan(50) // Should not create excessive new elements
    })
  })
})

// [OVERLAY-REFRESH-TEST-001] Export test utilities for other test files
export {
  createMockDocument,
  measureExecutionTime,
  measureMemoryUsage
} 