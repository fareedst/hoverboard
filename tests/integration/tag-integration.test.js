// [IMMUTABLE-REQ-TAG-001] - Setup global fetch mock (must be before imports)
global.fetch = jest.fn().mockResolvedValue({
  status: 200,
  statusText: 'OK',
  ok: true,
  text: jest.fn().mockResolvedValue('<result>done</result>'),
})

// [IMMUTABLE-REQ-TAG-001] - Tag Integration Tests
import { PinboardService } from '../../src/features/pinboard/pinboard-service.js'
import { TagService } from '../../src/features/tagging/tag-service.js'
import { MessageHandler } from '../../src/core/message-handler.js'

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
    hasAuthToken: jest.fn().mockResolvedValue(true),
    isUrlAllowed: jest.fn().mockResolvedValue(true),
    getAuthTokenParam: jest.fn().mockResolvedValue('auth_token=test-token')
  }))
}))

jest.mock('fast-xml-parser', () => ({
  XMLParser: jest.fn().mockImplementation(() => ({
    parse: jest.fn().mockReturnValue({})
  }))
}))

// [IMMUTABLE-REQ-TAG-001] - Setup global chrome object
global.chrome = {
  storage: mockChromeStorage,
  tabs: {
    query: jest.fn().mockResolvedValue([]),
    sendMessage: jest.fn().mockResolvedValue()
  }
}

describe('Tag Integration [IMMUTABLE-REQ-TAG-001]', () => {
  let pinboardService
  let tagService
  let messageHandler

  beforeEach(() => {
    // [IMMUTABLE-REQ-TAG-001] - Reset mocks
    jest.clearAllMocks()
    
    // [IMMUTABLE-REQ-TAG-001] - Reset storage mocks to default empty state
    mockChromeStorage.sync.get.mockResolvedValue({})
    mockChromeStorage.local.get.mockResolvedValue({})
    mockChromeStorage.sync.set.mockResolvedValue()
    mockChromeStorage.local.set.mockResolvedValue()
    
    // [IMMUTABLE-REQ-TAG-001] - Create fresh service instances
    tagService = new TagService()
    pinboardService = new PinboardService(tagService)
    messageHandler = new MessageHandler(pinboardService, tagService)
  })

  describe('[IMMUTABLE-REQ-TAG-001] should integrate with pinboard service for tag tracking', () => {
    test('[IMMUTABLE-REQ-TAG-001] should track tags when saving bookmark', async () => {
      // [IMMUTABLE-REQ-TAG-001] - Mock API response
      const mockApiResponse = { result: 'done' }
      jest.spyOn(pinboardService, 'makeApiRequest').mockResolvedValue(mockApiResponse)
      
      // [IMMUTABLE-REQ-TAG-001] - Mock tag service
      const handleTagAdditionSpy = jest.spyOn(tagService, 'handleTagAddition').mockResolvedValue()

      // [IMMUTABLE-REQ-TAG-001] - Test bookmark data with tags
      const bookmarkData = {
        url: 'https://example.com',
        description: 'Test Bookmark',
        tags: 'test-tag another-tag'
      }

      // [IMMUTABLE-REQ-TAG-001] - Call saveBookmark
      await pinboardService.saveBookmark(bookmarkData)

      // [IMMUTABLE-REQ-TAG-001] - Verify tags were tracked
      expect(handleTagAdditionSpy).toHaveBeenCalledTimes(2)
      expect(handleTagAdditionSpy).toHaveBeenCalledWith('test-tag', bookmarkData)
      expect(handleTagAdditionSpy).toHaveBeenCalledWith('another-tag', bookmarkData)
    })

    test('[IMMUTABLE-REQ-TAG-001] should track tags when saving individual tag', async () => {
      // [IMMUTABLE-REQ-TAG-001] - Mock API responses
      const mockBookmarkResponse = {
        url: 'https://example.com',
        tags: ['existing-tag']
      }
      const mockSaveResponse = { result: 'done' }
      
      jest.spyOn(pinboardService, 'getBookmarkForUrl').mockResolvedValue(mockBookmarkResponse)
      jest.spyOn(pinboardService, 'makeApiRequest').mockResolvedValue(mockSaveResponse)
      
      // [IMMUTABLE-REQ-TAG-001] - Mock tag service
      const handleTagAdditionSpy = jest.spyOn(tagService, 'handleTagAddition').mockResolvedValue()

      // [IMMUTABLE-REQ-TAG-001] - Test tag data
      const tagData = {
        url: 'https://example.com',
        value: 'new-tag'
      }

      // [IMMUTABLE-REQ-TAG-001] - Call saveTag
      await pinboardService.saveTag(tagData)

      // [IMMUTABLE-REQ-TAG-001] - Verify tag was tracked
      expect(handleTagAdditionSpy).toHaveBeenCalledWith('new-tag', expect.objectContaining({
        url: 'https://example.com',
        tags: 'existing-tag new-tag'
      }))
    })

    test('[IMMUTABLE-REQ-TAG-001] should handle tag extraction from various formats', async () => {
      // [IMMUTABLE-REQ-TAG-001] - Test different tag formats
      const testCases = [
        {
          input: { tags: 'tag1 tag2 tag3' },
          expected: ['tag1', 'tag2', 'tag3']
        },
        {
          input: { tags: ['tag1', 'tag2', 'tag3'] },
          expected: ['tag1', 'tag2', 'tag3']
        },
        {
          input: { tags: 'single-tag' },
          expected: ['single-tag']
        },
        {
          input: { tags: '' },
          expected: []
        },
        {
          input: { tags: null },
          expected: []
        }
      ]

      for (const testCase of testCases) {
        const extractedTags = pinboardService.extractTagsFromBookmarkData(testCase.input)
        expect(extractedTags).toEqual(testCase.expected)
      }
    })
  })

  describe('[IMMUTABLE-REQ-TAG-001] should maintain tag history across sessions', () => {
    test('[IMMUTABLE-REQ-TAG-001] should persist tags across browser sessions', async () => {
      // [IMMUTABLE-REQ-TAG-001] - Mock storage with existing tags
      const existingTags = ['tag1', 'tag2', 'tag3']
      mockChromeStorage.local.get.mockResolvedValue({
        hoverboard_recent_tags_cache: {
          tags: existingTags,
          timestamp: Date.now(),
          count: existingTags.length
        }
      })

      // [IMMUTABLE-REQ-TAG-001] - Test that tags persist
      const recentTags = await tagService.getRecentTags()
      expect(recentTags).toHaveLength(3)
      expect(recentTags.map(tag => tag.name)).toEqual(existingTags)
      expect(recentTags.every(tag => typeof tag === 'object' && 'name' in tag)).toBe(true)
    })

    test('[IMMUTABLE-REQ-TAG-001] should handle storage fallback gracefully', async () => {
      // [IMMUTABLE-REQ-TAG-001] - Mock sync storage failure
      mockChromeStorage.sync.get.mockRejectedValue(new Error('Sync storage error'))
      
      // [IMMUTABLE-REQ-TAG-001] - Mock local storage with fallback data
      const fallbackTags = ['fallback-tag1', 'fallback-tag2']
      mockChromeStorage.local.get.mockResolvedValue({
        hoverboard_recent_tags_cache: {
          tags: fallbackTags,
          timestamp: Date.now(),
          count: fallbackTags.length
        }
      })

      // [IMMUTABLE-REQ-TAG-001] - Test fallback functionality
      const recentTags = await tagService.getRecentTags()
      expect(recentTags).toHaveLength(2)
      expect(recentTags.map(tag => tag.name)).toEqual(fallbackTags)
      expect(recentTags.every(tag => typeof tag === 'object' && 'name' in tag)).toBe(true)
    })
  })

  describe('[IMMUTABLE-REQ-TAG-001] should handle message handler integration', () => {
    test('[IMMUTABLE-REQ-TAG-001] should track tags in message handler save bookmark', async () => {
      // [IMMUTABLE-REQ-TAG-001] - Mock pinboard service
      const mockSaveResult = { result: 'done' }
      jest.spyOn(pinboardService, 'saveBookmark').mockResolvedValue(mockSaveResult)
      
      // [IMMUTABLE-REQ-TAG-001] - Mock tag service
      const handleTagAdditionSpy = jest.spyOn(tagService, 'handleTagAddition').mockResolvedValue()

      // [IMMUTABLE-REQ-TAG-001] - Test bookmark data
      const bookmarkData = {
        url: 'https://example.com',
        description: 'Test Bookmark',
        tags: 'message-tag1 message-tag2'
      }

      // [IMMUTABLE-REQ-TAG-001] - Call message handler
      await messageHandler.handleSaveBookmark(bookmarkData)

      // [IMMUTABLE-REQ-TAG-001] - Verify tags were tracked
      expect(handleTagAdditionSpy).toHaveBeenCalledTimes(2)
      expect(handleTagAdditionSpy).toHaveBeenCalledWith('message-tag1', bookmarkData)
      expect(handleTagAdditionSpy).toHaveBeenCalledWith('message-tag2', bookmarkData)
    })

    test('[IMMUTABLE-REQ-TAG-001] should track tags in message handler save tag', async () => {
      // [IMMUTABLE-REQ-TAG-001] - Mock pinboard service
      const mockSaveResult = { result: 'done' }
      jest.spyOn(pinboardService, 'saveTag').mockResolvedValue(mockSaveResult)
      
      // [IMMUTABLE-REQ-TAG-001] - Mock tag service
      const handleTagAdditionSpy = jest.spyOn(tagService, 'handleTagAddition').mockResolvedValue()

      // [IMMUTABLE-REQ-TAG-001] - Test tag data
      const tagData = {
        url: 'https://example.com',
        value: 'message-tag'
      }

      // [IMMUTABLE-REQ-TAG-001] - Call message handler
      await messageHandler.handleSaveTag(tagData)

      // [IMMUTABLE-REQ-TAG-001] - Verify tag was tracked
      expect(handleTagAdditionSpy).toHaveBeenCalledWith('message-tag', tagData)
    })
  })

  describe('[IMMUTABLE-REQ-TAG-001] should handle error scenarios gracefully', () => {
    test('[IMMUTABLE-REQ-TAG-001] should handle tag tracking errors without breaking bookmark save', async () => {
      // [IMMUTABLE-REQ-TAG-001] - Mock tag service to throw error
      jest.spyOn(tagService, 'handleTagAddition').mockRejectedValue(new Error('Tag tracking error'))
      const mockApiResponse = {
        code: 'unknown',
        message: 'Operation completed',
        success: false
      }
      // [IMMUTABLE-REQ-TAG-001] - Test bookmark data
      const bookmarkData = {
        url: 'https://example.com',
        description: 'Test Bookmark',
        tags: 'test-tag'
      }
      // [IMMUTABLE-REQ-TAG-001] - Should not throw error
      await expect(pinboardService.saveBookmark(bookmarkData)).resolves.toEqual(mockApiResponse)
    })

    test('[IMMUTABLE-REQ-TAG-001] should handle storage errors gracefully', async () => {
      // [IMMUTABLE-REQ-TAG-001] - Mock storage errors
      mockChromeStorage.sync.get.mockRejectedValue(new Error('Storage error'))
      mockChromeStorage.local.get.mockRejectedValue(new Error('Local storage error'))

      // [IMMUTABLE-REQ-TAG-001] - Should return empty array on storage errors
      const recentTags = await tagService.getRecentTagsExcludingCurrent(['tag1'])
      expect(recentTags).toEqual([])
    })
  })

  describe('[IMMUTABLE-REQ-TAG-001] should handle edge cases', () => {
    test('[IMMUTABLE-REQ-TAG-001] should handle empty tag strings', async () => {
      // [IMMUTABLE-REQ-TAG-001] - Test bookmark with empty tags
      const bookmarkData = {
        url: 'https://example.com',
        description: 'Test Bookmark',
        tags: '   '  // Empty tags
      }

      const extractedTags = pinboardService.extractTagsFromBookmarkData(bookmarkData)
      expect(extractedTags).toEqual([])
    })

    test('[IMMUTABLE-REQ-TAG-001] should handle malformed tag data', async () => {
      // [IMMUTABLE-REQ-TAG-001] - Test various malformed tag data
      const testCases = [
        { tags: null },
        { tags: undefined },
        { tags: 123 },
        { tags: {} },
        { tags: [] }
      ]

      for (const testCase of testCases) {
        const extractedTags = pinboardService.extractTagsFromBookmarkData(testCase)
        expect(extractedTags).toEqual([])
      }
    })

    test('[IMMUTABLE-REQ-TAG-001] should handle duplicate tags in input', async () => {
      // [IMMUTABLE-REQ-TAG-001] - Test bookmark with duplicate tags
      const bookmarkData = {
        url: 'https://example.com',
        description: 'Test Bookmark',
        tags: 'tag1 tag1 tag2 tag1'
      }

      const extractedTags = pinboardService.extractTagsFromBookmarkData(bookmarkData)
      expect(extractedTags).toEqual(['tag1', 'tag1', 'tag2', 'tag1'])
    })

    test('[IMMUTABLE-REQ-TAG-001] should handle concurrent tag operations', async () => {
      // [IMMUTABLE-REQ-TAG-001] - Mock API responses
      const mockApiResponse = { result: 'done' }
      jest.spyOn(pinboardService, 'makeApiRequest').mockResolvedValue(mockApiResponse)
      
      // [IMMUTABLE-REQ-TAG-001] - Mock tag service
      const handleTagAdditionSpy = jest.spyOn(tagService, 'handleTagAddition').mockResolvedValue()

      // [IMMUTABLE-REQ-TAG-001] - Test concurrent operations
      const operations = [
        pinboardService.saveBookmark({ url: 'https://example1.com', tags: 'tag1' }),
        pinboardService.saveBookmark({ url: 'https://example2.com', tags: 'tag2' }),
        pinboardService.saveTag({ url: 'https://example3.com', value: 'tag3' })
      ]

      // [IMMUTABLE-REQ-TAG-001] - Execute concurrent operations
      await Promise.all(operations)

      // [IMMUTABLE-REQ-TAG-001] - Verify all tags were tracked (4 calls: 2 from saveBookmark + 2 from saveTag)
      expect(handleTagAdditionSpy).toHaveBeenCalledTimes(4)
    })

    test('[IMMUTABLE-REQ-TAG-001] should handle tag sanitization in integration', async () => {
      // [IMMUTABLE-REQ-TAG-001] - Mock API response
      const mockApiResponse = { result: 'done' }
      jest.spyOn(pinboardService, 'makeApiRequest').mockResolvedValue(mockApiResponse)
      
      // [IMMUTABLE-REQ-TAG-001] - Mock tag service
      const handleTagAdditionSpy = jest.spyOn(tagService, 'handleTagAddition').mockResolvedValue()

      // [IMMUTABLE-REQ-TAG-001] - Test bookmark with unsanitized tags
      const bookmarkData = {
        url: 'https://example.com',
        description: 'Test Bookmark',
        tags: '<script>alert("xss")</script> @#$%^&*()'
      }

      // [IMMUTABLE-REQ-TAG-001] - Call saveBookmark
      await pinboardService.saveBookmark(bookmarkData)

      // [IMMUTABLE-REQ-TAG-001] - Verify sanitized tags were tracked
      expect(handleTagAdditionSpy).toHaveBeenCalledWith('scriptalertxss', bookmarkData)
    })

    test('[IMMUTABLE-REQ-TAG-001] should handle tag exclusion logic in integration', async () => {
      // [IMMUTABLE-REQ-TAG-001] - Mock recent tags
      const mockRecentTags = [
        { name: 'tag1', count: 1, lastUsed: new Date() },
        { name: 'tag2', count: 2, lastUsed: new Date() },
        { name: 'tag3', count: 3, lastUsed: new Date() }
      ]
      jest.spyOn(tagService, 'getRecentTags').mockResolvedValue(mockRecentTags)

      // [IMMUTABLE-REQ-TAG-001] - Test exclusion logic
      const currentTags = ['tag1', 'tag3']
      const excludedTags = await tagService.getRecentTagsExcludingCurrent(currentTags)

      // [IMMUTABLE-REQ-TAG-001] - Verify only tag2 remains
      expect(excludedTags).toHaveLength(1)
      expect(excludedTags[0].name).toBe('tag2')
    })
  })
}) 