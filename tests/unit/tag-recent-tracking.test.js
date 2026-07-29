/**
 * [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] Tag recent tracking - [REQ-RECENT_TAGS_SYSTEM] [IMPL-TAG_SYSTEM] [IMPL-RECENT_TAGS_POPUP_REFRESH]
 */
import { TagService } from '../../src/features/tagging/tag-service.js'

// [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Mock chrome storage
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

// [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Mock dependencies
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

// [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Setup global chrome object
global.chrome = {
  storage: mockChromeStorage
}

describe('[REQ-RECENT_TAGS_SYSTEM] [IMPL-TAG_SYSTEM] Tag Recent Tracking', () => {
  let tagService

  beforeEach(() => {
    // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Reset mocks
    jest.clearAllMocks()
    
    // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Create fresh TagService instance
    tagService = new TagService()
  })

  describe('[IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] should add new tag to recent tags when added to record', () => {
    test('[IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] should add valid tag to recent tags', async () => {
      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Setup mock data
      const mockRecentTags = [
        { name: 'existing-tag', count: 1, lastUsed: new Date() }
      ]
      
      mockChromeStorage.local.get.mockResolvedValue({
        hoverboard_recent_tags_cache: {
          tags: mockRecentTags,
          timestamp: Date.now()
        }
      })

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Mock recordTagUsage method
      const recordTagUsageSpy = jest.spyOn(tagService, 'recordTagUsage').mockResolvedValue()

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Call the method
      await tagService.addTagToRecent('new-tag', 'test-record-id')

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Verify tag was added
      expect(recordTagUsageSpy).toHaveBeenCalledWith('new-tag')
    })

    test('[IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] should sanitize tag input before adding', async () => {
      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Setup mock data
      mockChromeStorage.local.get.mockResolvedValue({
        hoverboard_recent_tags_cache: {
          tags: [],
          timestamp: Date.now()
        }
      })

      const recordTagUsageSpy = jest.spyOn(tagService, 'recordTagUsage').mockResolvedValue()

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Call with unsanitized tag
      await tagService.addTagToRecent('<script>alert("xss")</script>', 'test-record-id')

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Verify sanitized tag was added
      expect(recordTagUsageSpy).toHaveBeenCalledWith('scriptalertxss')
    })

    test('[IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] should handle empty or invalid tag input', async () => {
      const recordTagUsageSpy = jest.spyOn(tagService, 'recordTagUsage').mockResolvedValue()

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Test empty string
      await tagService.addTagToRecent('', 'test-record-id')
      expect(recordTagUsageSpy).not.toHaveBeenCalled()

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Test null
      await tagService.addTagToRecent(null, 'test-record-id')
      expect(recordTagUsageSpy).not.toHaveBeenCalled()

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Test undefined
      await tagService.addTagToRecent(undefined, 'test-record-id')
      expect(recordTagUsageSpy).not.toHaveBeenCalled()
    })
  })

  describe('[IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] should not duplicate tag in recent tags if already exists', () => {
    test('[IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] should not add duplicate tag', async () => {
      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Setup mock data with existing tag
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

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Call with existing tag
      await tagService.addTagToRecent('existing-tag', 'test-record-id')

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Verify tag was not added again
      expect(recordTagUsageSpy).not.toHaveBeenCalled()
    })

    test('[IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] should handle case-insensitive duplicate detection', async () => {
      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Setup mock data
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

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Call with different case
      await tagService.addTagToRecent('existing-tag', 'test-record-id')

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Verify tag was not added
      expect(recordTagUsageSpy).not.toHaveBeenCalled()
    })
  })

  describe('[IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] should handle tag addition during bookmark creation', () => {
    test('[IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] should handle tag addition with bookmark data', async () => {
      const addTagToRecentSpy = jest.spyOn(tagService, 'addTagToRecent').mockResolvedValue()

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Call handleTagAddition
      const bookmarkData = { url: 'https://example.com', title: 'Test Bookmark' }
      await tagService.handleTagAddition('test-tag', bookmarkData)

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Verify addTagToRecent was called
      expect(addTagToRecentSpy).toHaveBeenCalledWith('test-tag', 'https://example.com')
    })

    test('[IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] should handle tag addition without bookmark URL', async () => {
      const addTagToRecentSpy = jest.spyOn(tagService, 'addTagToRecent').mockResolvedValue()

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Call with bookmark data without URL
      const bookmarkData = { title: 'Test Bookmark' }
      await tagService.handleTagAddition('test-tag', bookmarkData)

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Verify addTagToRecent was called with undefined URL
      expect(addTagToRecentSpy).toHaveBeenCalledWith('test-tag', undefined)
    })
  })

  describe('[IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] should handle tag addition during bookmark editing', () => {
    test('[IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] should handle tag addition during edit', async () => {
      const addTagToRecentSpy = jest.spyOn(tagService, 'addTagToRecent').mockResolvedValue()

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Call handleTagAddition for editing
      const bookmarkData = { url: 'https://example.com', title: 'Updated Bookmark' }
      await tagService.handleTagAddition('edited-tag', bookmarkData)

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Verify addTagToRecent was called
      expect(addTagToRecentSpy).toHaveBeenCalledWith('edited-tag', 'https://example.com')
    })
  })

  describe('[IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] should not display duplicate tag on current tab', () => {
    test('[IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] should filter out current tab tags', async () => {
      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Setup mock recent tags
      const mockRecentTags = [
        { name: 'tag1', count: 1, lastUsed: new Date() },
        { name: 'tag2', count: 2, lastUsed: new Date() },
        { name: 'tag3', count: 3, lastUsed: new Date() }
      ]

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Mock getRecentTags to return our test data
      jest.spyOn(tagService, 'getRecentTags').mockResolvedValue(mockRecentTags)

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Call getRecentTagsExcludingCurrent
      const currentTags = ['tag1', 'tag3']
      const result = await tagService.getRecentTagsExcludingCurrent(currentTags)

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Verify only tag2 remains (tag1 and tag3 filtered out)
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('tag2')
    })

    test('[IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] should handle case-insensitive filtering', async () => {
      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Setup mock recent tags
      const mockRecentTags = [
        { name: 'Tag1', count: 1, lastUsed: new Date() },
        { name: 'TAG2', count: 2, lastUsed: new Date() },
        { name: 'tag3', count: 3, lastUsed: new Date() }
      ]

      jest.spyOn(tagService, 'getRecentTags').mockResolvedValue(mockRecentTags)

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Call with different case
      const currentTags = ['tag1', 'TAG2']
      const result = await tagService.getRecentTagsExcludingCurrent(currentTags)

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Verify only tag3 remains
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('tag3')
    })

    test('[IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] should handle empty current tags', async () => {
      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Setup mock recent tags
      const mockRecentTags = [
        { name: 'tag1', count: 1, lastUsed: new Date() },
        { name: 'tag2', count: 2, lastUsed: new Date() }
      ]

      jest.spyOn(tagService, 'getRecentTags').mockResolvedValue(mockRecentTags)

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Call with empty current tags
      const result = await tagService.getRecentTagsExcludingCurrent([])

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Verify all tags are returned
      expect(result).toHaveLength(2)
    })

    test('[IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] should handle invalid current tags', async () => {
      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Setup mock recent tags
      const mockRecentTags = [
        { name: 'tag1', count: 1, lastUsed: new Date() },
        { name: 'tag2', count: 2, lastUsed: new Date() }
      ]

      jest.spyOn(tagService, 'getRecentTags').mockResolvedValue(mockRecentTags)

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Call with invalid tags
      const currentTags = ['<script>alert("xss")</script>', '', null, undefined]
      const result = await tagService.getRecentTagsExcludingCurrent(currentTags)

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Verify all tags are returned (invalid tags filtered out)
      expect(result).toHaveLength(2)
    })
  })

  describe('[IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] sanitizeTag method', () => {
    test('[IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] should sanitize HTML tags', () => {
      const result = tagService.sanitizeTag('<script>alert("xss")</script>')
      expect(result).toBe('scriptalertxss')
    })

    test('[IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] should remove special characters', () => {
      const result = tagService.sanitizeTag('tag@#$%^&*()')
      expect(result).toBe('tag')
    })

    test('[IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] should limit tag length', () => {
      const longTag = 'a'.repeat(100)
      const result = tagService.sanitizeTag(longTag)
      expect(result.length).toBeLessThanOrEqual(50)
    })

    test('[IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] should handle invalid input', () => {
      expect(tagService.sanitizeTag('')).toBe(null)
      expect(tagService.sanitizeTag(null)).toBe(null)
      expect(tagService.sanitizeTag(undefined)).toBe(null)
      expect(tagService.sanitizeTag(123)).toBe(null)
    })

    test('[IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] should preserve valid characters', () => {
      const result = tagService.sanitizeTag('valid-tag_123')
      expect(result).toBe('valid-tag_123')
    })
  })

  describe('[IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] error handling', () => {
    test('[IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] should handle storage errors gracefully', async () => {
      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Mock storage error
      mockChromeStorage.local.get.mockRejectedValue(new Error('Storage error'))

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Should not throw error
      await expect(tagService.addTagToRecent('test-tag', 'test-id')).resolves.not.toThrow()
    })

    test('[IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] should handle network errors gracefully', async () => {
      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Mock network error in getRecentTags
      jest.spyOn(tagService, 'getRecentTags').mockRejectedValue(new Error('Network error'))

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Should return empty array
      const result = await tagService.getRecentTagsExcludingCurrent(['tag1'])
      expect(result).toEqual([])
    })
  })

  describe('[IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] performance tests', () => {
    test('[IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] should handle large number of recent tags efficiently', async () => {
      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Setup large dataset
      const largeRecentTags = Array.from({ length: 1000 }, (_, i) => ({
        name: `tag${i}`,
        count: Math.floor(Math.random() * 10) + 1,
        lastUsed: new Date()
      }))

      jest.spyOn(tagService, 'getRecentTags').mockResolvedValue(largeRecentTags)

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Measure performance
      const startTime = performance.now()
      const result = await tagService.getRecentTagsExcludingCurrent(['tag1', 'tag2', 'tag3'])
      const endTime = performance.now()

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Verify performance is acceptable (< 100ms)
      expect(endTime - startTime).toBeLessThan(100)
      expect(result).toHaveLength(997) // 1000 - 3 excluded tags
    })

    test('[IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] should handle rapid tag additions efficiently', async () => {
      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Setup for rapid additions
      const recordTagUsageSpy = jest.spyOn(tagService, 'recordTagUsage').mockResolvedValue()
      mockChromeStorage.local.get.mockResolvedValue({
        hoverboard_recent_tags_cache: {
          tags: [],
          timestamp: Date.now()
        }
      })

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Measure rapid additions
      const startTime = performance.now()
      const promises = Array.from({ length: 100 }, (_, i) => 
        tagService.addTagToRecent(`tag${i}`, `record${i}`)
      )
      await Promise.all(promises)
      const endTime = performance.now()

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Verify performance is acceptable (< 500ms for 100 operations)
      expect(endTime - startTime).toBeLessThan(500)
      expect(recordTagUsageSpy).toHaveBeenCalledTimes(100)
    })

    test('[IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] should handle memory usage efficiently', async () => {
      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Setup large dataset
      const largeRecentTags = Array.from({ length: 5000 }, (_, i) => ({
        name: `tag${i}`,
        count: Math.floor(Math.random() * 10) + 1,
        lastUsed: new Date()
      }))

      jest.spyOn(tagService, 'getRecentTags').mockResolvedValue(largeRecentTags)

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Measure memory usage
      const initialMemory = performance.memory?.usedJSHeapSize || 0
      const result = await tagService.getRecentTagsExcludingCurrent(['tag1', 'tag2'])
      const finalMemory = performance.memory?.usedJSHeapSize || 0

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Verify memory usage is reasonable
      const memoryIncrease = finalMemory - initialMemory
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024) // Less than 10MB increase
      expect(result).toHaveLength(4998)
    })

    test('[IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] should handle concurrent operations efficiently', async () => {
      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Setup concurrent operations
      const recordTagUsageSpy = jest.spyOn(tagService, 'recordTagUsage').mockResolvedValue()
      mockChromeStorage.local.get.mockResolvedValue({
        hoverboard_recent_tags_cache: {
          tags: [],
          timestamp: Date.now()
        }
      })

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Run concurrent operations
      const startTime = performance.now()
      const operations = [
        tagService.addTagToRecent('tag1', 'record1'),
        tagService.getRecentTagsExcludingCurrent(['tag1']),
        tagService.handleTagAddition('tag2', { url: 'https://example.com' }),
        tagService.sanitizeTag('<script>alert("xss")</script>')
      ]
      await Promise.all(operations)
      const endTime = performance.now()

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Verify concurrent operations complete efficiently
      expect(endTime - startTime).toBeLessThan(200)
      expect(recordTagUsageSpy).toHaveBeenCalledTimes(2)
    })
  })
}) 