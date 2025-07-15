/**
 * [IMMUTABLE-REQ-TAG-003] - Unit tests for user-driven recent tags behavior
 */

import { TagService } from '../../src/features/tagging/tag-service.js'
import { MessageHandler } from '../../src/core/message-handler.js'
import { ConfigManager } from '../../src/config/config-manager.js'

// Mock chrome.runtime.getBackgroundPage
global.chrome = {
  runtime: {
    getBackgroundPage: jest.fn()
  },
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn()
    }
  }
}

describe('[IMMUTABLE-REQ-TAG-003] Recent Tags Behavior', () => {
  let tagService
  let messageHandler
  let configManager
  let mockBackgroundPage

  beforeEach(() => {
    // Reset mocks
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
    
    // Mock direct shared memory access (returns null to force fallback to background page)
    global.self = { recentTagsMemory: null }
    global.globalThis = { recentTagsMemory: null }
    
    chrome.runtime.getBackgroundPage.mockResolvedValue(mockBackgroundPage)
    
    // Initialize services
    configManager = new ConfigManager()
    tagService = new TagService()
    messageHandler = new MessageHandler()
  })

  describe('TagService - User-Driven Recent Tags', () => {
    test('should return empty array when no shared memory available', async () => {
      chrome.runtime.getBackgroundPage.mockResolvedValue(null)
      
      const result = await tagService.getUserRecentTags()
      
      expect(result).toEqual([])
    })

    test('should return empty array when shared memory has no tags', async () => {
      mockBackgroundPage.recentTagsMemory.getRecentTags.mockReturnValue([])
      
      const result = await tagService.getUserRecentTags()
      
      expect(result).toEqual([])
    })

    test('should return sorted tags from shared memory', async () => {
      const mockTags = [
        { name: 'javascript', lastUsed: '2024-12-19T10:30:00Z', count: 5 },
        { name: 'web', lastUsed: '2024-12-19T11:00:00Z', count: 3 },
        { name: 'development', lastUsed: '2024-12-19T09:00:00Z', count: 2 }
      ]
      
      mockBackgroundPage.recentTagsMemory.getRecentTags.mockReturnValue(mockTags)
      
      const result = await tagService.getUserRecentTags()
      
      expect(result).toHaveLength(3)
      expect(result[0].name).toBe('web') // Most recent first
      expect(result[1].name).toBe('javascript')
      expect(result[2].name).toBe('development')
    })

    test('should add tag to user recent list for current site only', async () => {
      mockBackgroundPage.recentTagsMemory.addTag.mockReturnValue(true)
      
      const result = await tagService.addTagToUserRecentList('javascript', 'https://example.com')
      
      expect(result).toBe(true)
      expect(mockBackgroundPage.recentTagsMemory.addTag).toHaveBeenCalledWith('javascript', 'https://example.com')
    })

    test('should fail to add invalid tag', async () => {
      const result = await tagService.addTagToUserRecentList('', 'https://example.com')
      
      expect(result).toBe(false)
      expect(mockBackgroundPage.recentTagsMemory.addTag).not.toHaveBeenCalled()
    })

    test('should filter out current site tags', async () => {
      const mockTags = [
        { name: 'javascript', lastUsed: '2024-12-19T10:30:00Z', count: 5 },
        { name: 'web', lastUsed: '2024-12-19T11:00:00Z', count: 3 },
        { name: 'development', lastUsed: '2024-12-19T09:00:00Z', count: 2 }
      ]
      
      mockBackgroundPage.recentTagsMemory.getRecentTags.mockReturnValue(mockTags)
      
      const currentTags = ['javascript', 'react']
      const result = await tagService.getUserRecentTagsExcludingCurrent(currentTags)
      
      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('web')
      expect(result[1].name).toBe('development')
      expect(result.find(tag => tag.name === 'javascript')).toBeUndefined()
    })

    test('should return empty array when all tags are filtered out', async () => {
      const mockTags = [
        { name: 'javascript', lastUsed: '2024-12-19T10:30:00Z', count: 5 },
        { name: 'web', lastUsed: '2024-12-19T11:00:00Z', count: 3 }
      ]
      
      mockBackgroundPage.recentTagsMemory.getRecentTags.mockReturnValue(mockTags)
      
      const currentTags = ['javascript', 'web']
      const result = await tagService.getUserRecentTagsExcludingCurrent(currentTags)
      
      expect(result).toEqual([])
    })
  })

  describe('MessageHandler - Recent Tags Integration', () => {
    test('should handle getRecentBookmarks with user-driven tags', async () => {
      const mockTags = [
        { name: 'javascript', lastUsed: '2024-12-19T10:30:00Z', count: 5 },
        { name: 'web', lastUsed: '2024-12-19T11:00:00Z', count: 3 }
      ]
      
      mockBackgroundPage.recentTagsMemory.getRecentTags.mockReturnValue(mockTags)
      
      const data = { currentTags: ['javascript'] }
      const result = await messageHandler.handleGetRecentBookmarks(data, 'https://example.com')
      
      expect(result.recentTags).toHaveLength(1)
      expect(result.recentTags[0].name).toBe('web')
    })

    test('should handle addTagToRecent message', async () => {
      mockBackgroundPage.recentTagsMemory.addTag.mockReturnValue(true)
      
      const data = {
        tagName: 'javascript',
        currentSiteUrl: 'https://example.com'
      }
      
      const result = await messageHandler.handleAddTagToRecent(data)
      
      expect(result.success).toBe(true)
    })

    test('should fail addTagToRecent with missing parameters', async () => {
      const data = { tagName: 'javascript' } // Missing currentSiteUrl
      
      const result = await messageHandler.handleAddTagToRecent(data)
      
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    test('should handle getUserRecentTags message', async () => {
      const mockTags = [
        { name: 'javascript', lastUsed: '2024-12-19T10:30:00Z', count: 5 }
      ]
      
      mockBackgroundPage.recentTagsMemory.getRecentTags.mockReturnValue(mockTags)
      
      const result = await messageHandler.handleGetUserRecentTags({})
      
      expect(result.recentTags).toEqual(mockTags)
    })
  })

  describe('Configuration - Recent Tags Settings', () => {
    test('should have recent tags configuration defaults', async () => {
      const config = await configManager.getConfig()
      
      expect(config.recentTagsMaxListSize).toBe(50)
      expect(config.recentTagsMaxDisplayCount).toBe(10)
      expect(config.recentTagsSharedMemoryKey).toBe('hoverboard_recent_tags_shared')
      expect(config.recentTagsEnableUserDriven).toBe(true)
      expect(config.recentTagsClearOnReload).toBe(true)
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

    test('should sanitize tag names before adding', async () => {
      const sanitizedTag = tagService.sanitizeTag('  javascript  ')
      
      expect(sanitizedTag).toBe('javascript')
    })

    test('should reject invalid tag names', async () => {
      const invalidTags = ['', '   ', null, undefined]
      
      for (const tag of invalidTags) {
        const result = await tagService.addTagToUserRecentList(tag, 'https://example.com')
        expect(result).toBe(false)
      }
    })
  })

  describe('Shared Memory Management', () => {
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
  })
}) 