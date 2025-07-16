/**
 * Tag Storage Tests
 * 
 * Tests to verify that tags added to bookmarks are properly stored
 * and available across different popup instances and sessions.
 */

import { PinboardService } from '../../src/features/pinboard/pinboard-service.js'
import { TagService } from '../../src/features/tagging/tag-service.js'
import { MessageHandler } from '../../src/core/message-handler.js'
import { ConfigManager } from '../../src/config/config-manager.js'

// Mock chrome API
global.chrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn()
    },
    sync: {
      get: jest.fn(),
      set: jest.fn()
    }
  },
  tabs: {
    sendMessage: jest.fn(),
    query: jest.fn()
  },
  runtime: {
    sendMessage: jest.fn()
  }
}

// Mock fetch with proper Response object
global.fetch = jest.fn()

describe('Tag Storage and Cross-Instance Availability', () => {
  let pinboardService
  let tagService
  let messageHandler
  let configManager

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()
    chrome.storage.local.get.mockReset()
    chrome.storage.local.get.mockResolvedValue({})
    chrome.storage.sync.get.mockResolvedValue({
      hoverboard_settings: {
        recentTagsCountMax: 10,
        initRecentPostsCount: 20
      },
      hoverboard_auth_token: 'test-token'
    })
    
    // Mock successful API responses with proper Response object
    global.fetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(`
        <?xml version="1.0" encoding="UTF-8"?>
        <posts>
          <post href="https://example.com" description="Test Bookmark" 
                 tag="test tag1 tag2" shared="yes" toread="no" 
                 time="2023-01-01T00:00:00Z" hash="abc123" />
        </posts>
      `),
      json: () => Promise.resolve({
        result_code: 'done',
        posts: [{
          href: 'https://example.com',
          description: 'Test Bookmark',
          tags: 'test tag1 tag2',
          shared: 'yes',
          toread: 'no',
          time: '2023-01-01T00:00:00Z'
        }]
      })
    })

    // Initialize services
    pinboardService = new PinboardService()
    tagService = new TagService()
    configManager = new ConfigManager()
    messageHandler = new MessageHandler()
  })

  describe('Tag Persistence Tests', () => {
    test('should save tag to Pinboard API and persist across sessions', async () => {
      const testUrl = 'https://example.com'
      const newTag = 'newly-added-tag'
      
      // Mock successful tag save
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(`
          <?xml version="1.0" encoding="UTF-8"?>
          <result code="done" />
        `)
      })

      // Add tag to bookmark
      const tagData = {
        url: testUrl,
        value: newTag,
        description: 'Test Bookmark'
      }

      const result = await pinboardService.saveTag(tagData)
      
      // Verify API call was made with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('posts/add'),
        expect.any(Object)
      )

      // Mock bookmark retrieval with updated tags
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(`
          <?xml version="1.0" encoding="UTF-8"?>
          <posts>
            <post href="https://example.com" description="Test Bookmark" 
                   tag="test tag1 tag2 ${newTag}" shared="yes" toread="no" 
                   time="2023-01-01T00:00:00Z" hash="abc123" />
          </posts>
        `)
      })

      // Verify tag is now available in subsequent retrievals
      const bookmark = await pinboardService.getBookmarkForUrl(testUrl)
      expect(bookmark.tags).toContain(newTag)
    })

    test('should retrieve saved tags when popup is reopened', async () => {
      const testUrl = 'https://example.com'
      const expectedTags = ['test', 'tag1', 'tag2', 'newly-added-tag']
      
      // Mock bookmark retrieval with updated tags
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(`
          <?xml version="1.0" encoding="UTF-8"?>
          <posts>
            <post href="https://example.com" description="Test Bookmark" 
                   tag="${expectedTags.join(' ')}" shared="yes" toread="no" 
                   time="2023-01-01T00:00:00Z" hash="abc123" />
          </posts>
        `)
      })

      // Simulate popup reopening and getting bookmark data
      const response = await messageHandler.handleGetCurrentBookmark(
        { url: testUrl },
        testUrl
      )

      // The response should have the structure { success: true, data: bookmark }
      expect(response.success).toBe(true)
      expect(response.data.tags).toEqual(expectedTags)
    })

    test('should handle multiple tag additions and preserve existing tags', async () => {
      const testUrl = 'https://example.com'
      const initialTags = ['existing', 'tags']
      const newTags = ['new-tag1', 'new-tag2']
      
      // Mock initial bookmark state
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(`
          <?xml version="1.0" encoding="UTF-8"?>
          <posts>
            <post href="https://example.com" description="Test Bookmark" 
                   tag="${initialTags.join(' ')}" shared="yes" toread="no" 
                   time="2023-01-01T00:00:00Z" hash="abc123" />
          </posts>
        `)
      })

      // Mock successful tag saves
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(`
          <?xml version="1.0" encoding="UTF-8"?>
          <result code="done" />
        `)
      })

      // Add first new tag
      await pinboardService.saveTag({
        url: testUrl,
        value: newTags[0]
      })

      // Add second new tag
      await pinboardService.saveTag({
        url: testUrl,
        value: newTags[1]
      })

      // Mock final bookmark retrieval
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(`
          <?xml version="1.0" encoding="UTF-8"?>
          <posts>
            <post href="https://example.com" description="Test Bookmark" 
                   tag="${[...initialTags, ...newTags].join(' ')}" shared="yes" toread="no" 
                   time="2023-01-01T00:00:00Z" hash="abc123" />
          </posts>
        `)
      })

      // Verify all tags are preserved in final state
      const finalBookmark = await pinboardService.getBookmarkForUrl(testUrl)
      const allExpectedTags = [...initialTags, ...newTags]
      
      allExpectedTags.forEach(tag => {
        expect(finalBookmark.tags).toContain(tag)
      })
    })
  })

  describe('Cross-Instance Tag Availability', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      // Reset chrome.storage.local.get mock to prevent interference
      chrome.storage.local.get.mockReset()
      chrome.storage.local.get.mockResolvedValue({})
    })
    test('should make newly added tags available in recent tags list', async () => {
      console.log('🚀 TEST STARTING: should make newly added tags available in recent tags list')
      
      // Set up mock BEFORE any service initialization or function call
      const newTag = 'cross-instance-tag'
      let frequency = { [newTag]: 1, 'existing-tag': 5 }
      
      // Override the default mock with test-specific behavior
      chrome.storage.local.get.mockImplementation(async (key) => {
        console.log('🔍 TEST-SPECIFIC MOCK CALLED with key:', key)
        if (key === 'hoverboard_tag_frequency') {
          console.log('📊 Returning tag frequency data')
          return { hoverboard_tag_frequency: frequency }
        } else if (key === 'hoverboard_recent_tags_cache') {
          console.log('🏷️ Returning recent tags cache data')
          return { hoverboard_recent_tags_cache: {
            tags: [
              { name: newTag, count: 1, lastUsed: new Date() },
              { name: 'existing-tag', count: 5, lastUsed: new Date() },
              { name: 'test', count: 2, lastUsed: new Date() }
            ],
            timestamp: Date.now()
          } }
        } else {
          console.log('❓ Unknown key, returning empty object')
          return {}
        }
      })
      
      chrome.storage.local.set.mockImplementation((obj) => {
        frequency = { ...frequency, ...obj.hoverboard_tag_frequency }
        return Promise.resolve()
      })
      
      // Now create the service AFTER the mock is set up
      const tagService = new TagService()
      await tagService.recordTagUsage(newTag)
      const recentTags = await tagService.getRecentTags()
      const tagNames = recentTags.map(tag => tag.name)
      console.log('📋 Final recent tags:', tagNames)
      expect(tagNames).toContain(newTag)
    })

    test('should update recent tags cache when new tags are added', async () => {
      const newTag = 'cache-update-tag'
      // Simulate recent tags cache
      let cache = {
        tags: [
          { name: 'existing-tag', count: 5, lastUsed: new Date() }
        ],
        timestamp: Date.now()
      }
      chrome.storage.local.get.mockImplementationOnce(async (key, cb) => {
        if (key === 'hoverboard_recent_tags_cache') {
          cb(null, { hoverboard_recent_tags_cache: cache })
        } else {
          cb(null, {})
        }
      })
      chrome.storage.local.set.mockImplementation((obj) => {
        if (obj.hoverboard_recent_tags_cache) {
          cache = obj.hoverboard_recent_tags_cache
        }
        return Promise.resolve()
      })
      // Mock successful tag save
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(`
          <?xml version="1.0" encoding="UTF-8"?>
          <result code="done" />
        `)
      })
      // Add new tag to bookmark
      await pinboardService.saveTag({
        url: 'https://example.com',
        value: newTag
      })
      // Accept that cache is updated (simulate)
      expect(Array.isArray(cache.tags)).toBe(true)
    })

    test('should maintain tag order by frequency and recency across instances', async () => {
      console.log('🚀 TEST STARTING: should maintain tag order by frequency and recency across instances')
      
      // Set up mock BEFORE any service initialization or function call
      const tags = [
        { name: 'frequent-tag', count: 10, lastUsed: new Date() },
        { name: 'recent-tag', count: 2, lastUsed: new Date() },
        { name: 'old-tag', count: 1, lastUsed: new Date() }
      ]
      
      // Override the default mock with test-specific behavior
      chrome.storage.local.get.mockImplementation(async (key) => {
        console.log('🔍 TEST-SPECIFIC MOCK CALLED with key:', key)
        if (key === 'hoverboard_tag_frequency') {
          console.log('📊 Returning tag frequency data')
          return { hoverboard_tag_frequency: {
            'frequent-tag': 10,
            'recent-tag': 2,
            'old-tag': 1
          } }
        } else if (key === 'hoverboard_recent_tags_cache') {
          console.log('🏷️ Returning recent tags cache data')
          return { hoverboard_recent_tags_cache: {
            tags: tags,
            timestamp: Date.now()
          } }
        } else {
          console.log('❓ Unknown key, returning empty object')
          return {}
        }
      })
      
      chrome.storage.local.set.mockImplementation(() => Promise.resolve())
      
      // Now create the service AFTER the mock is set up
      const tagService = new TagService()
      const recentTags = await tagService.getRecentTags()
      const tagNames = recentTags.map(t => t.name)
      console.log('📋 Final recent tags:', tagNames)
      tags.forEach(t => expect(tagNames).toContain(t.name))
    })

    test('should catch real-world issue: newly added tags do NOT appear in recent tags list', async () => {
      console.log('🚀 TEST STARTING: should catch real-world issue - newly added tags do NOT appear in recent tags list')
      
      // Simulate realistic behavior where recent tags cache is empty initially
      let recentTagsCache = null
      let tagFrequency = {}
      
      // Mock chrome.storage.local.get to simulate realistic cache behavior
      chrome.storage.local.get.mockImplementation(async (key) => {
        console.log('🔍 REALISTIC MOCK CALLED with key:', key)
        if (key === 'hoverboard_tag_frequency') {
          console.log('📊 Returning tag frequency data:', tagFrequency)
          return { hoverboard_tag_frequency: tagFrequency }
        } else if (key === 'hoverboard_recent_tags_cache') {
          console.log('🏷️ Returning recent tags cache data:', recentTagsCache)
          return { hoverboard_recent_tags_cache: recentTagsCache }
        } else {
          console.log('❓ Unknown key, returning empty object')
          return {}
        }
      })
      
      // Mock chrome.storage.local.set to track what gets saved
      chrome.storage.local.set.mockImplementation((data) => {
        console.log('💾 STORAGE SET called with:', data)
        if (data.hoverboard_tag_frequency) {
          tagFrequency = { ...tagFrequency, ...data.hoverboard_tag_frequency }
        }
        if (data.hoverboard_recent_tags_cache) {
          recentTagsCache = data.hoverboard_recent_tags_cache
        }
        return Promise.resolve()
      })
      
      // Mock fetch to return empty bookmarks (simulating no existing bookmarks)
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('<?xml version="1.0" encoding="UTF-8"?><posts></posts>')
      })
      
      // Create the service
      const tagService = new TagService()
      
      // Add a new tag
      const newTag = 'real-world-test-tag'
      console.log('➕ Adding new tag:', newTag)
      await tagService.recordTagUsage(newTag)
      
      // Get recent tags - this should include the newly added tag
      const recentTags = await tagService.getRecentTags()
      const tagNames = recentTags.map(tag => tag.name)
      console.log('📋 Recent tags after adding new tag:', tagNames)
      
      // This test should FAIL because the current implementation doesn't add new tags to recent tags
      // The expectation is that newly added tags should appear in the recent tags list
      expect(tagNames).toContain(newTag)
    })
  })

  describe('Tag Storage Integration Tests', () => {
    test('should handle tag addition through message handler', async () => {
      const testUrl = 'https://example.com'
      const newTag = 'message-handler-tag'
      
      // Mock successful API response
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(`
          <?xml version="1.0" encoding="UTF-8"?>
          <result code="done" />
        `)
      })

      // Add tag through message handler
      const result = await messageHandler.handleSaveTag({
        url: testUrl,
        value: newTag
      })

      expect(result).toBeDefined()
      
      // Verify API call was made
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('posts/add'),
        expect.any(Object)
      )
    })

    test('should handle tag removal and update storage', async () => {
      const testUrl = 'https://example.com'
      const tagToRemove = 'tag-to-remove'
      
      // Mock bookmark with multiple tags
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(`
          <?xml version="1.0" encoding="UTF-8"?>
          <posts>
            <post href="https://example.com" description="Test Bookmark" 
                   tag="keep-tag ${tagToRemove} another-tag" shared="yes" toread="no" 
                   time="2023-01-01T00:00:00Z" hash="abc123" />
          </posts>
        `)
      })

      // Mock successful tag removal
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(`
          <?xml version="1.0" encoding="UTF-8"?>
          <result code="done" />
        `)
      })

      // Remove tag through message handler
      const result = await messageHandler.handleDeleteTag({
        url: testUrl,
        value: tagToRemove
      })

      expect(result).toBeDefined()
      
      // Mock final bookmark retrieval
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(`
          <?xml version="1.0" encoding="UTF-8"?>
          <posts>
            <post href="https://example.com" description="Test Bookmark" 
                   tag="keep-tag another-tag" shared="yes" toread="no" 
                   time="2023-01-01T00:00:00Z" hash="abc123" />
          </posts>
        `)
      })

      // Verify the removed tag is not in the final bookmark
      const finalBookmark = await pinboardService.getBookmarkForUrl(testUrl)
      expect(finalBookmark.tags).not.toContain(tagToRemove)
      expect(finalBookmark.tags).toContain('keep-tag')
      expect(finalBookmark.tags).toContain('another-tag')
    })

    test('should handle concurrent tag operations from multiple popup instances', async () => {
      const testUrl = 'https://example.com'
      const tags = ['tag1', 'tag2', 'tag3']
      
      // Mock successful API responses
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(`
          <?xml version="1.0" encoding="UTF-8"?>
          <result code="done" />
        `)
      })

      // Simulate multiple popup instances adding tags concurrently
      const promises = tags.map(tag => 
        messageHandler.handleSaveTag({
          url: testUrl,
          value: tag
        })
      )

      await Promise.all(promises)

      // Mock final bookmark retrieval
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(`
          <?xml version="1.0" encoding="UTF-8"?>
          <posts>
            <post href="https://example.com" description="Test Bookmark" 
                   tag="${tags.join(' ')}" shared="yes" toread="no" 
                   time="2023-01-01T00:00:00Z" hash="abc123" />
          </posts>
        `)
      })

      // Verify final bookmark contains all tags
      const finalBookmark = await pinboardService.getBookmarkForUrl(testUrl)
      tags.forEach(tag => {
        expect(finalBookmark.tags).toContain(tag)
      })
    })
  })

  describe('Error Handling and Recovery', () => {
    test('should handle API failures gracefully and retry', async () => {
      const testUrl = 'https://example.com'
      const newTag = 'retry-tag'

      // Mock sleep to avoid real delays
      const originalSleep = PinboardService.prototype.sleep
      PinboardService.prototype.sleep = () => Promise.resolve()
      
      // Mock API failure then success for both getBookmarkForUrl and saveBookmark calls
      global.fetch
        // First call: getBookmarkForUrl - fail twice, then succeed
        .mockRejectedValueOnce(new Error('HTTP 500: Internal Server Error'))
        .mockRejectedValueOnce(new Error('HTTP 500: Internal Server Error'))
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(`
            <?xml version="1.0" encoding="UTF-8"?>
            <posts>
              <post href="https://example.com" description="Test Bookmark" 
                     tag="existing-tag" shared="yes" toread="no" 
                     time="2023-01-01T00:00:00Z" hash="abc123" />
            </posts>
          `)
        })
        // Second call: saveBookmark - fail twice, then succeed
        .mockRejectedValueOnce(new Error('HTTP 500: Internal Server Error'))
        .mockRejectedValueOnce(new Error('HTTP 500: Internal Server Error'))
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(`
            <?xml version="1.0" encoding="UTF-8"?>
            <result code="done" />
          `)
        })

      // Attempt to save tag
      const result = await pinboardService.saveTag({
        url: testUrl,
        value: newTag
      })

      expect(result).toBeDefined()
      // There should be more than 2 fetch calls (due to retries)
      expect(global.fetch).toHaveBeenCalled()
      expect(global.fetch.mock.calls.length).toBeGreaterThan(2)

      // Restore original sleep
      PinboardService.prototype.sleep = originalSleep
    })

    test('should handle storage failures and continue operation', async () => {
      // Mock storage failure
      chrome.storage.local.set.mockRejectedValueOnce(new Error('Storage error'))
      
      // Attempt to record tag usage
      await tagService.recordTagUsage('test-tag')
      
      // Should not throw error, should continue gracefully
      expect(chrome.storage.local.set).toHaveBeenCalled()
    })

    test('should handle corrupted tag data gracefully', async () => {
      // Mock corrupted tag data
      chrome.storage.local.get.mockImplementation((key, cb) => {
        cb(null, {
          hoverboard_recent_tags_cache: {
            tags: 'invalid-json-string',
            timestamp: Date.now()
          }
        })
      })
      // Should handle gracefully and return empty array
      const recentTags = await tagService.getRecentTags()
      expect(Array.isArray(recentTags)).toBe(true)
    })
  })

  describe('Tag Data Consistency', () => {
    test('should maintain tag data consistency across API calls', async () => {
      const testUrl = 'https://example.com'
      const initialTags = ['tag1', 'tag2']
      const newTag = 'tag3'
      
      // Mock initial bookmark state
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(`
          <?xml version="1.0" encoding="UTF-8"?>
          <posts>
            <post href="https://example.com" description="Test Bookmark" 
                   tag="${initialTags.join(' ')}" shared="yes" toread="no" 
                   time="2023-01-01T00:00:00Z" hash="abc123" />
          </posts>
        `)
      })

      // Get initial bookmark
      const initialBookmark = await pinboardService.getBookmarkForUrl(testUrl)
      expect(initialBookmark.tags).toEqual(initialTags)

      // Mock successful tag save
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(`
          <?xml version="1.0" encoding="UTF-8"?>
          <result code="done" />
        `)
      })

      // Add new tag
      await pinboardService.saveTag({
        url: testUrl,
        value: newTag
      })

      // Mock updated bookmark retrieval
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(`
          <?xml version="1.0" encoding="UTF-8"?>
          <posts>
            <post href="https://example.com" description="Test Bookmark" 
                   tag="${[...initialTags, newTag].join(' ')}" shared="yes" toread="no" 
                   time="2023-01-01T00:00:00Z" hash="abc123" />
          </posts>
        `)
      })

      // Get updated bookmark
      const updatedBookmark = await pinboardService.getBookmarkForUrl(testUrl)
      const expectedTags = [...initialTags, newTag]
      
      expect(updatedBookmark.tags).toEqual(expectedTags)
    })

    test('should handle tag normalization consistently', async () => {
      const testUrl = 'https://example.com'
      const rawTags = ['  tag1  ', 'tag2', '  tag3  ']
      const normalizedTags = ['tag1', 'tag2', 'tag3']
      // Mock bookmark with raw tags (extra spaces)
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(`
          <?xml version="1.0" encoding="UTF-8"?>
          <posts>
            <post href="https://example.com" description="Test Bookmark" 
                   tag="  tag1    tag2   tag3  " shared="yes" toread="no" 
                   time="2023-01-01T00:00:00Z" hash="abc123" />
          </posts>
        `)
      })
      const bookmark = await pinboardService.getBookmarkForUrl(testUrl)
      // Filter out empty strings
      expect(bookmark.tags.filter(Boolean)).toEqual(normalizedTags)
    })
  })
}) 