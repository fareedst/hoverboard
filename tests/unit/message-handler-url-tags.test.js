/**
 * Message handler URL tags and getCurrentBookmark tests - [REQ-URL_TAGS_DISPLAY] [IMPL-URL_TAGS_DISPLAY]
 * Single source for tags: handleGetTagsForUrl, handleGetCurrentBookmark normalization, needsAuth, blocked.
 */

import { MessageHandler } from '../../src/core/message-handler.js'
import { ConfigManager } from '../../src/config/config-manager.js'

// Mock chrome API
global.chrome = {
  storage: {
    local: { get: jest.fn(), set: jest.fn() },
    sync: { get: jest.fn(), set: jest.fn() }
  },
  tabs: { sendMessage: jest.fn(), query: jest.fn() },
  runtime: { sendMessage: jest.fn() }
}

describe('MessageHandler [REQ-URL_TAGS_DISPLAY] [IMPL-URL_TAGS_DISPLAY]', () => {
  describe('handleGetTagsForUrl', () => {
    test('returns normalized tags array when data.url is set [REQ-URL_TAGS_DISPLAY]', async () => {
      const mockProvider = {
        getBookmarkForUrl: jest.fn().mockResolvedValue({
          url: 'https://example.com',
          tags: 'a b c',
          hash: 'h'
        })
      }
      const handler = new MessageHandler(mockProvider)
      const result = await handler.handleGetTagsForUrl({ url: 'https://example.com' })
      expect(result).toEqual({ tags: ['a', 'b', 'c'] })
      expect(mockProvider.getBookmarkForUrl).toHaveBeenCalledWith('https://example.com', '')
    })

    test('returns tags array when provider returns array [REQ-URL_TAGS_DISPLAY]', async () => {
      const mockProvider = {
        getBookmarkForUrl: jest.fn().mockResolvedValue({
          url: 'https://x.com',
          tags: ['x', 'y'],
          hash: 'h'
        })
      }
      const handler = new MessageHandler(mockProvider)
      const result = await handler.handleGetTagsForUrl({ url: 'https://x.com' })
      expect(result).toEqual({ tags: ['x', 'y'] })
    })

    test('returns empty tags when data.url is missing or empty', async () => {
      const handler = new MessageHandler()
      expect(await handler.handleGetTagsForUrl({})).toEqual({ tags: [] })
      expect(await handler.handleGetTagsForUrl({ url: '' })).toEqual({ tags: [] })
      expect(await handler.handleGetTagsForUrl()).toEqual({ tags: [] })
    })
  })

  describe('handleGetCurrentBookmark', () => {
    test('normalizes tags to array when provider returns string [REQ-URL_TAGS_DISPLAY]', async () => {
      const mockProvider = {
        getBookmarkForUrl: jest.fn().mockResolvedValue({
          url: 'https://example.com',
          description: 'Test',
          tags: 'foo bar',
          hash: 'h',
          time: '2026-01-01T00:00:00Z'
        })
      }
      chrome.storage.sync.get.mockResolvedValue({
        hoverboard_auth_token: 'token',
        hoverboard_settings: {},
        hoverboard_inhibit_urls: ''
      })
      const handler = new MessageHandler(mockProvider)
      const response = await handler.handleGetCurrentBookmark(
        { url: 'https://example.com' },
        'https://example.com',
        null
      )
      expect(response.success).toBe(true)
      expect(Array.isArray(response.data.tags)).toBe(true)
      expect(response.data.tags).toEqual(['foo', 'bar'])
    })

    test('sets needsAuth when hasAuthToken is false and bookmark exists [REQ-URL_TAGS_DISPLAY]', async () => {
      const mockProvider = {
        getBookmarkForUrl: jest.fn().mockResolvedValue({
          url: 'https://local.com',
          description: 'Local bookmark',
          tags: ['saved-tag'],
          hash: 'h',
          time: '2026-01-01T00:00:00Z'
        })
      }
      chrome.storage.sync.get.mockResolvedValue({
        hoverboard_auth_token: '',
        hoverboard_settings: {},
        hoverboard_inhibit_urls: ''
      })
      const handler = new MessageHandler(mockProvider)
      const response = await handler.handleGetCurrentBookmark(
        { url: 'https://local.com' },
        'https://local.com',
        null
      )
      expect(response.success).toBe(true)
      expect(response.data.needsAuth).toBe(true)
      expect(response.data.tags).toEqual(['saved-tag'])
    })

    test('returns blocked when isUrlAllowed is false [REQ-URL_TAGS_DISPLAY]', async () => {
      chrome.storage.sync.get.mockResolvedValue({
        hoverboard_auth_token: 'token',
        hoverboard_settings: {},
        hoverboard_inhibit_urls: 'example.com'
      })
      const mockProvider = { getBookmarkForUrl: jest.fn() }
      const handler = new MessageHandler(mockProvider)
      const response = await handler.handleGetCurrentBookmark(
        { url: 'https://example.com' },
        'https://example.com',
        null
      )
      expect(response).toEqual({
        success: true,
        data: { blocked: true, url: 'https://example.com' }
      })
      expect(mockProvider.getBookmarkForUrl).not.toHaveBeenCalled()
    })
  })
})
