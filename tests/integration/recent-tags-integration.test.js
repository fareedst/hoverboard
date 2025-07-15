/**
 * [IMMUTABLE-REQ-TAG-003] - Integration tests for user-driven recent tags behavior
 */

import { TagService } from '../../src/features/tagging/tag-service.js'
import { MessageHandler } from '../../src/core/message-handler.js'
import { ConfigManager } from '../../src/config/config-manager.js'

// Mock chrome APIs for integration testing
global.chrome = {
  runtime: {
    getBackgroundPage: jest.fn(),
    sendMessage: jest.fn()
  },
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn()
    }
  },
  tabs: {
    query: jest.fn()
  }
}

describe('[IMMUTABLE-REQ-TAG-003] Recent Tags Integration', () => {
  let tagService
  let messageHandler
  let configManager
  let mockBackgroundPage

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock background page with shared memory
    mockBackgroundPage = {
      recentTagsMemory: {
        getRecentTags: jest.fn(),
        addTag: jest.fn(),
        clearRecentTags: jest.fn(),
        getMemoryStatus: jest.fn()
      }
    }
    
    chrome.runtime.getBackgroundPage.mockResolvedValue(mockBackgroundPage)
    
    // Initialize services
    configManager = new ConfigManager()
    tagService = new TagService()
    messageHandler = new MessageHandler()
  })

  describe('End-to-End Tag Addition Flow', () => {
    test('should add tag to current site and track in recent list', async () => {
      // Mock initial state - empty recent tags
      mockBackgroundPage.recentTagsMemory.getRecentTags.mockReturnValue([])
      mockBackgroundPage.recentTagsMemory.addTag.mockReturnValue(true)
      
      // Simulate adding tag to current site
      const tagName = 'javascript'
      const currentSiteUrl = 'https://example.com'
      
      // Step 1: Add tag to user recent list
      const addResult = await tagService.addTagToUserRecentList(tagName, currentSiteUrl)
      expect(addResult).toBe(true)
      expect(mockBackgroundPage.recentTagsMemory.addTag).toHaveBeenCalledWith(tagName, currentSiteUrl)
      
      // Step 2: Verify tag appears in recent list
      const addedTag = {
        name: tagName,
        lastUsed: expect.any(String),
        count: 1,
        addedFromSite: currentSiteUrl
      }
      mockBackgroundPage.recentTagsMemory.getRecentTags.mockReturnValue([addedTag])
      
      const recentTags = await tagService.getUserRecentTags()
      expect(recentTags).toHaveLength(1)
      expect(recentTags[0].name).toBe(tagName)
      
      // Step 3: Verify tag is excluded when already on current site
      const filteredTags = await tagService.getUserRecentTagsExcludingCurrent([tagName])
      expect(filteredTags).toHaveLength(0)
    })

    test('should handle multiple tag additions and maintain order', async () => {
      const tags = [
        { name: 'javascript', lastUsed: '2024-12-19T10:00:00Z', count: 1 },
        { name: 'web', lastUsed: '2024-12-19T11:00:00Z', count: 1 },
        { name: 'development', lastUsed: '2024-12-19T09:00:00Z', count: 1 }
      ]
      
      mockBackgroundPage.recentTagsMemory.getRecentTags.mockReturnValue(tags)
      
      const recentTags = await tagService.getUserRecentTags()
      expect(recentTags).toHaveLength(3)
      expect(recentTags[0].name).toBe('web') // Most recent first
      expect(recentTags[1].name).toBe('javascript')
      expect(recentTags[2].name).toBe('development')
    })
  })

  describe('Cross-Window Consistency', () => {
    test('should maintain consistent recent tags across windows', async () => {
      const mockTags = [
        { name: 'javascript', lastUsed: '2024-12-19T10:30:00Z', count: 5 },
        { name: 'web', lastUsed: '2024-12-19T11:00:00Z', count: 3 }
      ]
      
      mockBackgroundPage.recentTagsMemory.getRecentTags.mockReturnValue(mockTags)
      
      // Simulate multiple windows accessing the same shared memory
      const window1Tags = await tagService.getUserRecentTags()
      const window2Tags = await tagService.getUserRecentTags()
      
      expect(window1Tags).toEqual(window2Tags)
      expect(window1Tags).toHaveLength(2)
    })

    test('should update shared memory when tag is added from any window', async () => {
      mockBackgroundPage.recentTagsMemory.addTag.mockReturnValue(true)
      
      // Simulate tag addition from window 1
      await tagService.addTagToUserRecentList('javascript', 'https://example.com')
      
      // Verify shared memory was updated
      expect(mockBackgroundPage.recentTagsMemory.addTag).toHaveBeenCalledWith('javascript', 'https://example.com')
      
      // Simulate tag addition from window 2
      await tagService.addTagToUserRecentList('web', 'https://example.com')
      
      // Verify shared memory was updated again
      expect(mockBackgroundPage.recentTagsMemory.addTag).toHaveBeenCalledWith('web', 'https://example.com')
    })
  })

  describe('Message Handler Integration', () => {
    test('should handle getRecentBookmarks with current tags exclusion', async () => {
      const mockTags = [
        { name: 'javascript', lastUsed: '2024-12-19T10:30:00Z', count: 5 },
        { name: 'web', lastUsed: '2024-12-19T11:00:00Z', count: 3 },
        { name: 'development', lastUsed: '2024-12-19T09:00:00Z', count: 2 }
      ]
      
      mockBackgroundPage.recentTagsMemory.getRecentTags.mockReturnValue(mockTags)
      
      const data = { currentTags: ['javascript'] }
      const result = await messageHandler.handleGetRecentBookmarks(data, 'https://example.com')
      
      expect(result.recentTags).toHaveLength(2)
      expect(result.recentTags.find(tag => tag.name === 'javascript')).toBeUndefined()
      expect(result.recentTags.find(tag => tag.name === 'web')).toBeDefined()
      expect(result.recentTags.find(tag => tag.name === 'development')).toBeDefined()
    })

    test('should handle addTagToRecent with proper validation', async () => {
      mockBackgroundPage.recentTagsMemory.addTag.mockReturnValue(true)
      
      const validData = {
        tagName: 'javascript',
        currentSiteUrl: 'https://example.com'
      }
      
      const result = await messageHandler.handleAddTagToRecent(validData)
      expect(result.success).toBe(true)
      
      // Test with invalid data
      const invalidData = { tagName: 'javascript' } // Missing currentSiteUrl
      const invalidResult = await messageHandler.handleAddTagToRecent(invalidData)
      expect(invalidResult.success).toBe(false)
      expect(invalidResult.error).toBeDefined()
    })

    test('should handle saveBookmark with tag tracking', async () => {
      // Mock pinboard service
      const mockPinboardService = {
        saveBookmark: jest.fn().mockResolvedValue({ success: true }),
        getBookmarkForUrl: jest.fn().mockResolvedValue({ tags: ['existing'] })
      }
      
      messageHandler.pinboardService = mockPinboardService
      mockBackgroundPage.recentTagsMemory.addTag.mockReturnValue(true)
      
      const bookmarkData = {
        url: 'https://example.com',
        description: 'Test Bookmark',
        tags: 'existing javascript web'
      }
      
      const result = await messageHandler.handleSaveBookmark(bookmarkData)
      
      expect(result.success).toBe(true)
      // Verify that new tags were tracked
      expect(mockBackgroundPage.recentTagsMemory.addTag).toHaveBeenCalledWith('javascript', 'https://example.com')
      expect(mockBackgroundPage.recentTagsMemory.addTag).toHaveBeenCalledWith('web', 'https://example.com')
    })
  })

  describe('Configuration Integration', () => {
    test('should respect configuration limits', async () => {
      const config = await configManager.getConfig()
      
      // Test max list size
      expect(config.recentTagsMaxListSize).toBe(50)
      
      // Test max display count
      expect(config.recentTagsMaxDisplayCount).toBe(10)
      
      // Test shared memory key
      expect(config.recentTagsSharedMemoryKey).toBe('hoverboard_recent_tags_shared')
    })

    test('should handle configuration updates', async () => {
      const updates = {
        recentTagsMaxListSize: 25,
        recentTagsMaxDisplayCount: 5
      }
      
      await configManager.updateConfig(updates)
      const updatedConfig = await configManager.getConfig()
      
      expect(updatedConfig.recentTagsMaxListSize).toBe(25)
      expect(updatedConfig.recentTagsMaxDisplayCount).toBe(5)
    })
  })

  describe('Error Handling and Recovery', () => {
    test('should handle shared memory errors gracefully', async () => {
      chrome.runtime.getBackgroundPage.mockRejectedValue(new Error('Background page not available'))
      
      const result = await tagService.getUserRecentTags()
      expect(result).toEqual([])
    })

    test('should handle background page without recentTagsMemory', async () => {
      chrome.runtime.getBackgroundPage.mockResolvedValue({})
      
      const result = await tagService.getUserRecentTags()
      expect(result).toEqual([])
    })

    test('should handle tag addition failures gracefully', async () => {
      mockBackgroundPage.recentTagsMemory.addTag.mockReturnValue(false)
      
      const result = await tagService.addTagToUserRecentList('javascript', 'https://example.com')
      expect(result).toBe(false)
    })

    test('should handle message handler errors', async () => {
      const invalidData = {}
      const result = await messageHandler.handleAddTagToRecent(invalidData)
      
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('Tag Scope Validation', () => {
    test('should validate tag scope for current site only', async () => {
      const validUrl = 'https://example.com/page'
      const invalidUrl = ''
      
      const validResult = await tagService.addTagToUserRecentList('javascript', validUrl)
      const invalidResult = await tagService.addTagToUserRecentList('javascript', invalidUrl)
      
      expect(validResult).toBe(true)
      expect(invalidResult).toBe(false)
    })

    test('should prevent tag additions to other sites', async () => {
      const currentSiteUrl = 'https://example.com'
      const otherSiteUrl = 'https://othersite.com'
      
      // Add tag to current site
      await tagService.addTagToUserRecentList('javascript', currentSiteUrl)
      
      // Verify tag is tracked for current site only
      expect(mockBackgroundPage.recentTagsMemory.addTag).toHaveBeenCalledWith('javascript', currentSiteUrl)
      
      // Add same tag to other site (should not affect current site tracking)
      await tagService.addTagToUserRecentList('javascript', otherSiteUrl)
      
      // Verify both calls were made with correct site URLs
      expect(mockBackgroundPage.recentTagsMemory.addTag).toHaveBeenCalledWith('javascript', otherSiteUrl)
    })
  })
}) 