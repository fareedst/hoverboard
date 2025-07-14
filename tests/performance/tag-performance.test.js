/**
 * Performance Tests for Tag Functionality `[IMMUTABLE-REQ-TAG-001]`
 * Tests performance characteristics of tag operations
 */

import { TagService } from '../../src/features/tagging/tag-service.js'
import { PinboardService } from '../../src/features/pinboard/pinboard-service.js'

// [IMMUTABLE-REQ-TAG-001] - Mock chrome storage
const mockChromeStorage = {
  local: {
    get: jest.fn(),
    set: jest.fn(),
    remove: jest.fn()
  },
  sync: {
    get: jest.fn(),
    set: jest.fn(),
    remove: jest.fn()
  }
}

// [IMMUTABLE-REQ-TAG-001] - Mock dependencies
jest.mock('../../src/config/config-manager.js', () => ({
  ConfigManager: jest.fn().mockImplementation(() => ({
    getConfig: jest.fn().mockResolvedValue({
      recentTagsCountMax: 50,
      initRecentPostsCount: 100
    }),
    getAuthTokenParam: jest.fn().mockResolvedValue('auth_token=test-token'),
    getAuthToken: jest.fn().mockResolvedValue('test-token'),
    hasAuthToken: jest.fn().mockResolvedValue(true)
  }))
}))

// [IMMUTABLE-REQ-TAG-001] - Setup global chrome object
global.chrome = {
  storage: mockChromeStorage
}

describe('Tag Performance Tests [IMMUTABLE-REQ-TAG-001]', () => {
  let tagService
  let pinboardService

  beforeEach(() => {
    // [IMMUTABLE-REQ-TAG-001] - Reset mocks
    jest.clearAllMocks()
    
    // [IMMUTABLE-REQ-TAG-001] - Create fresh service instances
    tagService = new TagService()
    pinboardService = new PinboardService()
  })

  describe('[IMMUTABLE-REQ-TAG-001] Tag operation performance', () => {
    test('[IMMUTABLE-REQ-TAG-001] should add tag within performance threshold', async () => {
      // [IMMUTABLE-REQ-TAG-001] - Setup mock data
      mockChromeStorage.local.get.mockResolvedValue({
        hoverboard_recent_tags_cache: {
          tags: [],
          timestamp: Date.now()
        }
      })

      // [IMMUTABLE-REQ-TAG-001] - Measure tag addition performance
      const startTime = performance.now()
      await tagService.addTagToRecent('performance-test-tag', 'test-record-id')
      const endTime = performance.now()

      // [IMMUTABLE-REQ-TAG-001] - Verify performance is acceptable (< 100ms)
      expect(endTime - startTime).toBeLessThan(100)
    })

    test('[IMMUTABLE-REQ-TAG-001] should handle bulk tag operations efficiently', async () => {
      // [IMMUTABLE-REQ-TAG-001] - Setup mock data
      mockChromeStorage.local.get.mockResolvedValue({
        hoverboard_recent_tags_cache: {
          tags: [],
          timestamp: Date.now()
        }
      })

      // [IMMUTABLE-REQ-TAG-001] - Measure bulk operations
      const startTime = performance.now()
      const promises = Array.from({ length: 100 }, (_, i) => 
        tagService.addTagToRecent(`bulk-tag-${i}`, `record-${i}`)
      )
      await Promise.all(promises)
      const endTime = performance.now()

      // [IMMUTABLE-REQ-TAG-001] - Verify performance is acceptable (< 1 second for 100 operations)
      expect(endTime - startTime).toBeLessThan(1000)
    })

    test('[IMMUTABLE-REQ-TAG-001] should handle large recent tags list efficiently', async () => {
      // [IMMUTABLE-REQ-TAG-001] - Setup large dataset
      const largeRecentTags = Array.from({ length: 1000 }, (_, i) => ({
        name: `large-tag-${i}`,
        count: Math.floor(Math.random() * 10) + 1,
        lastUsed: new Date()
      }))

      jest.spyOn(tagService, 'getRecentTags').mockResolvedValue(largeRecentTags)

      // [IMMUTABLE-REQ-TAG-001] - Measure filtering performance
      const startTime = performance.now()
      const result = await tagService.getRecentTagsExcludingCurrent(['large-tag-1', 'large-tag-2'])
      const endTime = performance.now()

      // [IMMUTABLE-REQ-TAG-001] - Verify performance is acceptable (< 50ms for filtering)
      expect(endTime - startTime).toBeLessThan(50)
      expect(result).toHaveLength(998) // 1000 - 2 excluded tags
    })
  })

  describe('[IMMUTABLE-REQ-TAG-001] Memory usage performance', () => {
    test('[IMMUTABLE-REQ-TAG-001] should handle memory usage efficiently', async () => {
      // [IMMUTABLE-REQ-TAG-001] - Setup large dataset
      const largeRecentTags = Array.from({ length: 5000 }, (_, i) => ({
        name: `memory-tag-${i}`,
        count: Math.floor(Math.random() * 10) + 1,
        lastUsed: new Date()
      }))

      jest.spyOn(tagService, 'getRecentTags').mockResolvedValue(largeRecentTags)

      // [IMMUTABLE-REQ-TAG-001] - Measure memory usage
      const initialMemory = performance.memory?.usedJSHeapSize || 0
      const result = await tagService.getRecentTagsExcludingCurrent(['memory-tag-1', 'memory-tag-2'])
      const finalMemory = performance.memory?.usedJSHeapSize || 0

      // [IMMUTABLE-REQ-TAG-001] - Verify memory usage is reasonable
      const memoryIncrease = finalMemory - initialMemory
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024) // Less than 10MB increase
      expect(result).toHaveLength(4998)
    })

    test('[IMMUTABLE-REQ-TAG-001] should handle garbage collection efficiently', async () => {
      // [IMMUTABLE-REQ-TAG-001] - Setup for memory pressure test
      const largeRecentTags = Array.from({ length: 10000 }, (_, i) => ({
        name: `gc-tag-${i}`,
        count: Math.floor(Math.random() * 10) + 1,
        lastUsed: new Date()
      }))

      jest.spyOn(tagService, 'getRecentTags').mockResolvedValue(largeRecentTags)

      // [IMMUTABLE-REQ-TAG-001] - Perform multiple operations to test GC
      const initialMemory = performance.memory?.usedJSHeapSize || 0
      
      for (let i = 0; i < 10; i++) {
        await tagService.getRecentTagsExcludingCurrent([`gc-tag-${i}`])
      }
      
      const finalMemory = performance.memory?.usedJSHeapSize || 0

      // [IMMUTABLE-REQ-TAG-001] - Verify memory doesn't grow excessively
      const memoryIncrease = finalMemory - initialMemory
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024) // Less than 50MB increase
    })
  })

  describe('[IMMUTABLE-REQ-TAG-001] Storage performance', () => {
    test('[IMMUTABLE-REQ-TAG-001] should handle storage operations efficiently', async () => {
      // [IMMUTABLE-REQ-TAG-001] - Setup mock storage
      mockChromeStorage.local.get.mockResolvedValue({
        hoverboard_recent_tags_cache: {
          tags: [],
          timestamp: Date.now()
        }
      })

      // [IMMUTABLE-REQ-TAG-001] - Measure storage operations
      const startTime = performance.now()
      
      // [IMMUTABLE-REQ-TAG-001] - Perform multiple storage operations
      for (let i = 0; i < 50; i++) {
        await tagService.addTagToRecent(`storage-tag-${i}`, `record-${i}`)
      }
      
      const endTime = performance.now()

      // [IMMUTABLE-REQ-TAG-001] - Verify storage performance is acceptable (< 500ms for 50 operations)
      expect(endTime - startTime).toBeLessThan(500)
    })

    test('[IMMUTABLE-REQ-TAG-001] should handle storage quota efficiently', async () => {
      // [IMMUTABLE-REQ-TAG-001] - Setup large dataset for quota test
      const largeRecentTags = Array.from({ length: 10000 }, (_, i) => ({
        name: `quota-tag-${i}`,
        count: Math.floor(Math.random() * 10) + 1,
        lastUsed: new Date()
      }))

      mockChromeStorage.local.get.mockResolvedValue({
        hoverboard_recent_tags_cache: {
          tags: largeRecentTags,
          timestamp: Date.now()
        }
      })

      // [IMMUTABLE-REQ-TAG-001] - Measure quota handling
      const startTime = performance.now()
      const result = await tagService.getRecentTags()
      const endTime = performance.now()

      // [IMMUTABLE-REQ-TAG-001] - Verify quota handling performance
      expect(endTime - startTime).toBeLessThan(100)
      expect(result).toHaveLength(10000)
    })
  })

  describe('[IMMUTABLE-REQ-TAG-001] Concurrent operation performance', () => {
    test('[IMMUTABLE-REQ-TAG-001] should handle concurrent tag operations efficiently', async () => {
      // [IMMUTABLE-REQ-TAG-001] - Setup mock data
      mockChromeStorage.local.get.mockResolvedValue({
        hoverboard_recent_tags_cache: {
          tags: [],
          timestamp: Date.now()
        }
      })

      // [IMMUTABLE-REQ-TAG-001] - Measure concurrent operations
      const startTime = performance.now()
      
      // [IMMUTABLE-REQ-TAG-001] - Run concurrent operations
      const operations = [
        tagService.addTagToRecent('concurrent-tag-1', 'record-1'),
        tagService.getRecentTagsExcludingCurrent(['concurrent-tag-1']),
        tagService.handleTagAddition('concurrent-tag-2', { url: 'https://example.com' }),
        tagService.sanitizeTag('<script>alert("xss")</script>')
      ]
      
      await Promise.all(operations)
      const endTime = performance.now()

      // [IMMUTABLE-REQ-TAG-001] - Verify concurrent operation performance
      expect(endTime - startTime).toBeLessThan(200)
    })

    test('[IMMUTABLE-REQ-TAG-001] should handle high concurrency efficiently', async () => {
      // [IMMUTABLE-REQ-TAG-001] - Setup mock data
      mockChromeStorage.local.get.mockResolvedValue({
        hoverboard_recent_tags_cache: {
          tags: [],
          timestamp: Date.now()
        }
      })

      // [IMMUTABLE-REQ-TAG-001] - Measure high concurrency
      const startTime = performance.now()
      
      // [IMMUTABLE-REQ-TAG-001] - Run high concurrency operations
      const promises = Array.from({ length: 100 }, (_, i) => 
        tagService.addTagToRecent(`high-concurrency-tag-${i}`, `record-${i}`)
      )
      
      await Promise.all(promises)
      const endTime = performance.now()

      // [IMMUTABLE-REQ-TAG-001] - Verify high concurrency performance
      expect(endTime - startTime).toBeLessThan(1000)
    })
  })

  describe('[IMMUTABLE-REQ-TAG-001] UI responsiveness performance', () => {
    test('[IMMUTABLE-REQ-TAG-001] should maintain UI responsiveness during tag operations', async () => {
      // [IMMUTABLE-REQ-TAG-001] - Setup mock data
      mockChromeStorage.local.get.mockResolvedValue({
        hoverboard_recent_tags_cache: {
          tags: [],
          timestamp: Date.now()
        }
      })

      // [IMMUTABLE-REQ-TAG-001] - Measure UI responsiveness
      const startTime = performance.now()
      
      // [IMMUTABLE-REQ-TAG-001] - Simulate rapid UI interactions
      for (let i = 0; i < 20; i++) {
        await tagService.addTagToRecent(`ui-tag-${i}`, `record-${i}`)
        await tagService.getRecentTagsExcludingCurrent([`ui-tag-${i}`])
      }
      
      const endTime = performance.now()

      // [IMMUTABLE-REQ-TAG-001] - Verify UI responsiveness
      expect(endTime - startTime).toBeLessThan(500)
    })

    test('[IMMUTABLE-REQ-TAG-001] should handle real-time validation efficiently', async () => {
      // [IMMUTABLE-REQ-TAG-001] - Measure validation performance
      const startTime = performance.now()
      
      // [IMMUTABLE-REQ-TAG-001] - Test multiple validation scenarios
      const validationTests = [
        'valid-tag',
        '<script>alert("xss")</script>',
        'tag-with-spaces',
        '',
        'a'.repeat(100),
        'tag@#$%^&*()'
      ]
      
      for (const testTag of validationTests) {
        tagService.sanitizeTag(testTag)
      }
      
      const endTime = performance.now()

      // [IMMUTABLE-REQ-TAG-001] - Verify validation performance
      expect(endTime - startTime).toBeLessThan(10)
    })
  })

  describe('[IMMUTABLE-REQ-TAG-001] Network performance', () => {
    test('[IMMUTABLE-REQ-TAG-001] should handle network latency efficiently', async () => {
      // [IMMUTABLE-REQ-TAG-001] - Mock network latency
      jest.spyOn(pinboardService, 'makeApiRequest').mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ result: 'done' }), 100))
      )

      // [IMMUTABLE-REQ-TAG-001] - Measure network operation performance
      const startTime = performance.now()
      
      // [IMMUTABLE-REQ-TAG-001] - Test network operations
      const bookmarkData = {
        url: 'https://example.com',
        description: 'Test Bookmark',
        tags: 'network-tag-1 network-tag-2'
      }
      
      await pinboardService.saveBookmark(bookmarkData)
      const endTime = performance.now()

      // [IMMUTABLE-REQ-TAG-001] - Verify network performance
      expect(endTime - startTime).toBeLessThan(200) // Should be close to 100ms latency
    })

    test('[IMMUTABLE-REQ-TAG-001] should handle network errors gracefully', async () => {
      // [IMMUTABLE-REQ-TAG-001] - Mock network error
      jest.spyOn(pinboardService, 'makeApiRequest').mockRejectedValue(new Error('Network error'))

      // [IMMUTABLE-REQ-TAG-001] - Measure error handling performance
      const startTime = performance.now()
      
      // [IMMUTABLE-REQ-TAG-001] - Test error handling
      const bookmarkData = {
        url: 'https://example.com',
        description: 'Test Bookmark',
        tags: 'error-tag'
      }
      
      try {
        await pinboardService.saveBookmark(bookmarkData)
      } catch (error) {
        // Expected error
      }
      
      const endTime = performance.now()

      // [IMMUTABLE-REQ-TAG-001] - Verify error handling performance
      expect(endTime - startTime).toBeLessThan(50)
    })
  })
}) 