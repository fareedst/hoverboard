// [IMMUTABLE-REQ-TAG-001] - Tag Recent Tracking Tests
import { TagService } from '../../src/features/tagging/tag-service.js'

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
jest.mock('../../src/features/pinboard/pinboard-service.js', () => ({
  PinboardService: jest.fn().mockImplementation(() => ({
    getRecentBookmarks: jest.fn().mockResolvedValue([])
  }))
}))

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

describe('Tag Recent Tracking [IMMUTABLE-REQ-TAG-001]', () => {
  let tagService

  beforeEach(() => {
    // [IMMUTABLE-REQ-TAG-001] - Reset mocks
    jest.clearAllMocks()
    
    // [IMMUTABLE-REQ-TAG-001] - Create fresh TagService instance
    tagService = new TagService()
  })

  describe('[IMMUTABLE-REQ-TAG-001] should add new tag to recent tags when added to record', () => {
    test('[IMMUTABLE-REQ-TAG-001] should add valid tag to recent tags', async () => {
      // [IMMUTABLE-REQ-TAG-001] - Setup mock data
      const mockRecentTags = [
        { name: 'existing-tag', count: 1, lastUsed: new Date() }
      ]
      
      mockChromeStorage.local.get.mockResolvedValue({
        hoverboard_recent_tags_cache: {
          tags: mockRecentTags,
          timestamp: Date.now()
        }
      })

      // [IMMUTABLE-REQ-TAG-001] - Mock recordTagUsage method
      const recordTagUsageSpy = jest.spyOn(tagService, 'recordTagUsage').mockResolvedValue()

      // [IMMUTABLE-REQ-TAG-001] - Call the method
      await tagService.addTagToRecent('new-tag', 'test-record-id')

      // [IMMUTABLE-REQ-TAG-001] - Verify tag was added
      expect(recordTagUsageSpy).toHaveBeenCalledWith('new-tag')
    })

    test('[IMMUTABLE-REQ-TAG-001] should sanitize tag input before adding', async () => {
      // [IMMUTABLE-REQ-TAG-001] - Setup mock data
      mockChromeStorage.local.get.mockResolvedValue({
        hoverboard_recent_tags_cache: {
          tags: [],
          timestamp: Date.now()
        }
      })

      const recordTagUsageSpy = jest.spyOn(tagService, 'recordTagUsage').mockResolvedValue()

      // [IMMUTABLE-REQ-TAG-001] - Call with unsanitized tag
      await tagService.addTagToRecent('<script>alert("xss")</script>', 'test-record-id')

      // [IMMUTABLE-REQ-TAG-001] - Verify sanitized tag was added
      expect(recordTagUsageSpy).toHaveBeenCalledWith('scriptalertxss')
    })

    test('[IMMUTABLE-REQ-TAG-001] should handle empty or invalid tag input', async () => {
      const recordTagUsageSpy = jest.spyOn(tagService, 'recordTagUsage').mockResolvedValue()

      // [IMMUTABLE-REQ-TAG-001] - Test empty string
      await tagService.addTagToRecent('', 'test-record-id')
      expect(recordTagUsageSpy).not.toHaveBeenCalled()

      // [IMMUTABLE-REQ-TAG-001] - Test null
      await tagService.addTagToRecent(null, 'test-record-id')
      expect(recordTagUsageSpy).not.toHaveBeenCalled()

      // [IMMUTABLE-REQ-TAG-001] - Test undefined
      await tagService.addTagToRecent(undefined, 'test-record-id')
      expect(recordTagUsageSpy).not.toHaveBeenCalled()
    })
  })

  describe('[IMMUTABLE-REQ-TAG-001] should not duplicate tag in recent tags if already exists', () => {
    test('[IMMUTABLE-REQ-TAG-001] should not add duplicate tag', async () => {
      // [IMMUTABLE-REQ-TAG-001] - Setup mock data with existing tag
      const mockRecentTags = [
        { name: 'existing-tag', count: 1, lastUsed: new Date() }
      ]
      
      mockChromeStorage.local.get.mockResolvedValue({
        hoverboard_recent_tags_cache: {
          tags: mockRecentTags,
          timestamp: Date.now()
        }
      })

      const recordTagUsageSpy = jest.spyOn(tagService, 'recordTagUsage').mockResolvedValue()

      // [IMMUTABLE-REQ-TAG-001] - Call with existing tag
      await tagService.addTagToRecent('existing-tag', 'test-record-id')

      // [IMMUTABLE-REQ-TAG-001] - Verify tag was not added again
      expect(recordTagUsageSpy).not.toHaveBeenCalled()
    })

    test('[IMMUTABLE-REQ-TAG-001] should handle case-insensitive duplicate detection', async () => {
      // [IMMUTABLE-REQ-TAG-001] - Setup mock data
      const mockRecentTags = [
        { name: 'Existing-Tag', count: 1, lastUsed: new Date() }
      ]
      
      mockChromeStorage.local.get.mockResolvedValue({
        hoverboard_recent_tags_cache: {
          tags: mockRecentTags,
          timestamp: Date.now()
        }
      })

      const recordTagUsageSpy = jest.spyOn(tagService, 'recordTagUsage').mockResolvedValue()

      // [IMMUTABLE-REQ-TAG-001] - Call with different case
      await tagService.addTagToRecent('existing-tag', 'test-record-id')

      // [IMMUTABLE-REQ-TAG-001] - Verify tag was not added
      expect(recordTagUsageSpy).not.toHaveBeenCalled()
    })
  })

  describe('[IMMUTABLE-REQ-TAG-001] should handle tag addition during bookmark creation', () => {
    test('[IMMUTABLE-REQ-TAG-001] should handle tag addition with bookmark data', async () => {
      const addTagToRecentSpy = jest.spyOn(tagService, 'addTagToRecent').mockResolvedValue()

      // [IMMUTABLE-REQ-TAG-001] - Call handleTagAddition
      const bookmarkData = { url: 'https://example.com', title: 'Test Bookmark' }
      await tagService.handleTagAddition('test-tag', bookmarkData)

      // [IMMUTABLE-REQ-TAG-001] - Verify addTagToRecent was called
      expect(addTagToRecentSpy).toHaveBeenCalledWith('test-tag', 'https://example.com')
    })

    test('[IMMUTABLE-REQ-TAG-001] should handle tag addition without bookmark URL', async () => {
      const addTagToRecentSpy = jest.spyOn(tagService, 'addTagToRecent').mockResolvedValue()

      // [IMMUTABLE-REQ-TAG-001] - Call with bookmark data without URL
      const bookmarkData = { title: 'Test Bookmark' }
      await tagService.handleTagAddition('test-tag', bookmarkData)

      // [IMMUTABLE-REQ-TAG-001] - Verify addTagToRecent was called with undefined URL
      expect(addTagToRecentSpy).toHaveBeenCalledWith('test-tag', undefined)
    })
  })

  describe('[IMMUTABLE-REQ-TAG-001] should handle tag addition during bookmark editing', () => {
    test('[IMMUTABLE-REQ-TAG-001] should handle tag addition during edit', async () => {
      const addTagToRecentSpy = jest.spyOn(tagService, 'addTagToRecent').mockResolvedValue()

      // [IMMUTABLE-REQ-TAG-001] - Call handleTagAddition for editing
      const bookmarkData = { url: 'https://example.com', title: 'Updated Bookmark' }
      await tagService.handleTagAddition('edited-tag', bookmarkData)

      // [IMMUTABLE-REQ-TAG-001] - Verify addTagToRecent was called
      expect(addTagToRecentSpy).toHaveBeenCalledWith('edited-tag', 'https://example.com')
    })
  })

  describe('[IMMUTABLE-REQ-TAG-001] should not display duplicate tag on current tab', () => {
    test('[IMMUTABLE-REQ-TAG-001] should filter out current tab tags', async () => {
      // [IMMUTABLE-REQ-TAG-001] - Setup mock recent tags
      const mockRecentTags = [
        { name: 'tag1', count: 1, lastUsed: new Date() },
        { name: 'tag2', count: 2, lastUsed: new Date() },
        { name: 'tag3', count: 3, lastUsed: new Date() }
      ]

      // [IMMUTABLE-REQ-TAG-001] - Mock getRecentTags to return our test data
      jest.spyOn(tagService, 'getRecentTags').mockResolvedValue(mockRecentTags)

      // [IMMUTABLE-REQ-TAG-001] - Call getRecentTagsExcludingCurrent
      const currentTags = ['tag1', 'tag3']
      const result = await tagService.getRecentTagsExcludingCurrent(currentTags)

      // [IMMUTABLE-REQ-TAG-001] - Verify only tag2 remains (tag1 and tag3 filtered out)
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('tag2')
    })

    test('[IMMUTABLE-REQ-TAG-001] should handle case-insensitive filtering', async () => {
      // [IMMUTABLE-REQ-TAG-001] - Setup mock recent tags
      const mockRecentTags = [
        { name: 'Tag1', count: 1, lastUsed: new Date() },
        { name: 'TAG2', count: 2, lastUsed: new Date() },
        { name: 'tag3', count: 3, lastUsed: new Date() }
      ]

      jest.spyOn(tagService, 'getRecentTags').mockResolvedValue(mockRecentTags)

      // [IMMUTABLE-REQ-TAG-001] - Call with different case
      const currentTags = ['tag1', 'TAG2']
      const result = await tagService.getRecentTagsExcludingCurrent(currentTags)

      // [IMMUTABLE-REQ-TAG-001] - Verify only tag3 remains
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('tag3')
    })

    test('[IMMUTABLE-REQ-TAG-001] should handle empty current tags', async () => {
      // [IMMUTABLE-REQ-TAG-001] - Setup mock recent tags
      const mockRecentTags = [
        { name: 'tag1', count: 1, lastUsed: new Date() },
        { name: 'tag2', count: 2, lastUsed: new Date() }
      ]

      jest.spyOn(tagService, 'getRecentTags').mockResolvedValue(mockRecentTags)

      // [IMMUTABLE-REQ-TAG-001] - Call with empty current tags
      const result = await tagService.getRecentTagsExcludingCurrent([])

      // [IMMUTABLE-REQ-TAG-001] - Verify all tags are returned
      expect(result).toHaveLength(2)
    })

    test('[IMMUTABLE-REQ-TAG-001] should handle invalid current tags', async () => {
      // [IMMUTABLE-REQ-TAG-001] - Setup mock recent tags
      const mockRecentTags = [
        { name: 'tag1', count: 1, lastUsed: new Date() },
        { name: 'tag2', count: 2, lastUsed: new Date() }
      ]

      jest.spyOn(tagService, 'getRecentTags').mockResolvedValue(mockRecentTags)

      // [IMMUTABLE-REQ-TAG-001] - Call with invalid tags
      const currentTags = ['<script>alert("xss")</script>', '', null, undefined]
      const result = await tagService.getRecentTagsExcludingCurrent(currentTags)

      // [IMMUTABLE-REQ-TAG-001] - Verify all tags are returned (invalid tags filtered out)
      expect(result).toHaveLength(2)
    })
  })

  describe('[IMMUTABLE-REQ-TAG-001] sanitizeTag method', () => {
    test('[IMMUTABLE-REQ-TAG-001] should sanitize HTML tags', () => {
      const result = tagService.sanitizeTag('<script>alert("xss")</script>')
      expect(result).toBe('scriptalertxss')
    })

    test('[IMMUTABLE-REQ-TAG-001] should remove special characters', () => {
      const result = tagService.sanitizeTag('tag@#$%^&*()')
      expect(result).toBe('tag')
    })

    test('[IMMUTABLE-REQ-TAG-001] should limit tag length', () => {
      const longTag = 'a'.repeat(100)
      const result = tagService.sanitizeTag(longTag)
      expect(result.length).toBeLessThanOrEqual(50)
    })

    test('[IMMUTABLE-REQ-TAG-001] should handle invalid input', () => {
      expect(tagService.sanitizeTag('')).toBe(null)
      expect(tagService.sanitizeTag(null)).toBe(null)
      expect(tagService.sanitizeTag(undefined)).toBe(null)
      expect(tagService.sanitizeTag(123)).toBe(null)
    })

    test('[IMMUTABLE-REQ-TAG-001] should preserve valid characters', () => {
      const result = tagService.sanitizeTag('valid-tag_123')
      expect(result).toBe('valid-tag_123')
    })
  })

  describe('[IMMUTABLE-REQ-TAG-001] error handling', () => {
    test('[IMMUTABLE-REQ-TAG-001] should handle storage errors gracefully', async () => {
      // [IMMUTABLE-REQ-TAG-001] - Mock storage error
      mockChromeStorage.local.get.mockRejectedValue(new Error('Storage error'))

      // [IMMUTABLE-REQ-TAG-001] - Should not throw error
      await expect(tagService.addTagToRecent('test-tag', 'test-id')).resolves.not.toThrow()
    })

    test('[IMMUTABLE-REQ-TAG-001] should handle network errors gracefully', async () => {
      // [IMMUTABLE-REQ-TAG-001] - Mock network error in getRecentTags
      jest.spyOn(tagService, 'getRecentTags').mockRejectedValue(new Error('Network error'))

      // [IMMUTABLE-REQ-TAG-001] - Should return empty array
      const result = await tagService.getRecentTagsExcludingCurrent(['tag1'])
      expect(result).toEqual([])
    })
  })

  describe('[IMMUTABLE-REQ-TAG-001] performance tests', () => {
    test('[IMMUTABLE-REQ-TAG-001] should handle large number of recent tags efficiently', async () => {
      // [IMMUTABLE-REQ-TAG-001] - Setup large dataset
      const largeRecentTags = Array.from({ length: 1000 }, (_, i) => ({
        name: `tag${i}`,
        count: Math.floor(Math.random() * 10) + 1,
        lastUsed: new Date()
      }))

      jest.spyOn(tagService, 'getRecentTags').mockResolvedValue(largeRecentTags)

      // [IMMUTABLE-REQ-TAG-001] - Measure performance
      const startTime = performance.now()
      const result = await tagService.getRecentTagsExcludingCurrent(['tag1', 'tag2', 'tag3'])
      const endTime = performance.now()

      // [IMMUTABLE-REQ-TAG-001] - Verify performance is acceptable (< 100ms)
      expect(endTime - startTime).toBeLessThan(100)
      expect(result).toHaveLength(997) // 1000 - 3 excluded tags
    })

    test('[IMMUTABLE-REQ-TAG-001] should handle rapid tag additions efficiently', async () => {
      // [IMMUTABLE-REQ-TAG-001] - Setup for rapid additions
      const recordTagUsageSpy = jest.spyOn(tagService, 'recordTagUsage').mockResolvedValue()
      mockChromeStorage.local.get.mockResolvedValue({
        hoverboard_recent_tags_cache: {
          tags: [],
          timestamp: Date.now()
        }
      })

      // [IMMUTABLE-REQ-TAG-001] - Measure rapid additions
      const startTime = performance.now()
      const promises = Array.from({ length: 100 }, (_, i) => 
        tagService.addTagToRecent(`tag${i}`, `record${i}`)
      )
      await Promise.all(promises)
      const endTime = performance.now()

      // [IMMUTABLE-REQ-TAG-001] - Verify performance is acceptable (< 500ms for 100 operations)
      expect(endTime - startTime).toBeLessThan(500)
      expect(recordTagUsageSpy).toHaveBeenCalledTimes(100)
    })

    test('[IMMUTABLE-REQ-TAG-001] should handle memory usage efficiently', async () => {
      // [IMMUTABLE-REQ-TAG-001] - Setup large dataset
      const largeRecentTags = Array.from({ length: 5000 }, (_, i) => ({
        name: `tag${i}`,
        count: Math.floor(Math.random() * 10) + 1,
        lastUsed: new Date()
      }))

      jest.spyOn(tagService, 'getRecentTags').mockResolvedValue(largeRecentTags)

      // [IMMUTABLE-REQ-TAG-001] - Measure memory usage
      const initialMemory = performance.memory?.usedJSHeapSize || 0
      const result = await tagService.getRecentTagsExcludingCurrent(['tag1', 'tag2'])
      const finalMemory = performance.memory?.usedJSHeapSize || 0

      // [IMMUTABLE-REQ-TAG-001] - Verify memory usage is reasonable
      const memoryIncrease = finalMemory - initialMemory
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024) // Less than 10MB increase
      expect(result).toHaveLength(4998)
    })

    test('[IMMUTABLE-REQ-TAG-001] should handle concurrent operations efficiently', async () => {
      // [IMMUTABLE-REQ-TAG-001] - Setup concurrent operations
      const recordTagUsageSpy = jest.spyOn(tagService, 'recordTagUsage').mockResolvedValue()
      mockChromeStorage.local.get.mockResolvedValue({
        hoverboard_recent_tags_cache: {
          tags: [],
          timestamp: Date.now()
        }
      })

      // [IMMUTABLE-REQ-TAG-001] - Run concurrent operations
      const startTime = performance.now()
      const operations = [
        tagService.addTagToRecent('tag1', 'record1'),
        tagService.getRecentTagsExcludingCurrent(['tag1']),
        tagService.handleTagAddition('tag2', { url: 'https://example.com' }),
        tagService.sanitizeTag('<script>alert("xss")</script>')
      ]
      await Promise.all(operations)
      const endTime = performance.now()

      // [IMMUTABLE-REQ-TAG-001] - Verify concurrent operations complete efficiently
      expect(endTime - startTime).toBeLessThan(200)
      expect(recordTagUsageSpy).toHaveBeenCalledTimes(2)
    })
  })
}) 