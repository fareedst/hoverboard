/**
 * === IMPL-FULL-BLOCK: IMPL-URL_TAGS_DISPLAY ===
 * [IMPL-URL_TAGS_DISPLAY] [ARCH-URL_TAGS_DISPLAY] [REQ-URL_TAGS_DISPLAY] [REQ-BADGE_INDICATORS] [REQ-PER_BOOKMARK_STORAGE_BACKEND] — normalizeBookmarkForDisplay, getBookmarkForDisplay, getTagsForUrl, getBadgeDisplayValue; handler and popup use router and re-fetch. Contract: bookmark or provider+url; normalized bookmark, tags, or badge value.
 * 
 * ## NORMALIZE_BOOKMARK_FOR_DISPLAY
 * 
 * - [IMPL-URL_TAGS_DISPLAY] [ARCH-URL_TAGS_DISPLAY] [REQ-URL_TAGS_DISPLAY] [REQ-BADGE_INDICATORS] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Implements normalizeBookmarkForDisplay(bookmark) behavior for IMPL-URL_TAGS_DISPLAY.
 * - Contract:
 *   - INPUT: bookmark (raw from provider), provider + url + title (for getBookmarkForDisplay), provider + url (for getTagsForUrl)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: normalized bookmark (tags array), tags array, badge display value (text, tagCount, flags)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: single module url-tags-manager; used by message-handler, service-worker, badge-manager, popup, bookmark-router
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: NORMALIZE_BOOKMARK_FOR_DISPLAY
 *   - IF bookmark null: RETURN null or empty shape
 *   - tags = bookmark.tags IF array ELSE (bookmark.tags split by spaces or [])
 *   - RETURN { ...bookmark, tags, ...requiredDefaults }
 *   - How (sub-block): Get raw from provider and normalize; caller sets needsAuth.
 * 
 * ## GET_BOOKMARK_FOR_DISPLAY
 * 
 * - [IMPL-URL_TAGS_DISPLAY] [ARCH-URL_TAGS_DISPLAY] [REQ-URL_TAGS_DISPLAY] [REQ-BADGE_INDICATORS] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Implements getBookmarkForDisplay(provider, url, title) behavior for IMPL-URL_TAGS_DISPLAY.
 * - Contract:
 *   - INPUT: bookmark (raw from provider), provider + url + title (for getBookmarkForDisplay), provider + url (for getTagsForUrl)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: normalized bookmark (tags array), tags array, badge display value (text, tagCount, flags)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: single module url-tags-manager; used by message-handler, service-worker, badge-manager, popup, bookmark-router
 *   - EFFECTS: Async
 *   - TERMINATION: total
 * - PROCEDURE: GET_BOOKMARK_FOR_DISPLAY
 *   - raw = AWAIT provider.getBookmarkForUrl(url)
 *   - RETURN normalizeBookmarkForDisplay(raw); caller sets needsAuth when !hasAuth
 *   - How (sub-block): Get bookmark for url and return tags array.
 * 
 * ## GET_TAGS_FOR_URL
 * 
 * - [IMPL-URL_TAGS_DISPLAY] [ARCH-URL_TAGS_DISPLAY] [REQ-URL_TAGS_DISPLAY] [REQ-BADGE_INDICATORS] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Implements getTagsForUrl(provider, url) behavior for IMPL-URL_TAGS_DISPLAY.
 * - Contract:
 *   - INPUT: bookmark (raw from provider), provider + url + title (for getBookmarkForDisplay), provider + url (for getTagsForUrl)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: normalized bookmark (tags array), tags array, badge display value (text, tagCount, flags)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: single module url-tags-manager; used by message-handler, service-worker, badge-manager, popup, bookmark-router
 *   - EFFECTS: Async
 *   - TERMINATION: total
 * - PROCEDURE: GET_TAGS_FOR_URL
 *   - bookmark = AWAIT getBookmarkForDisplay(provider, url, null)
 *   - RETURN bookmark?.tags ?? []
 *   - How (sub-block): Normalize and return text, tagCount, isPrivate, isToRead, isBookmarked, title.
 * 
 * ## GET_BADGE_DISPLAY_VALUE
 * 
 * - [IMPL-URL_TAGS_DISPLAY] [ARCH-URL_TAGS_DISPLAY] [REQ-URL_TAGS_DISPLAY] [REQ-BADGE_INDICATORS] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Implements getBadgeDisplayValue(bookmark, config) behavior for IMPL-URL_TAGS_DISPLAY.
 * - Contract:
 *   - INPUT: bookmark (raw from provider), provider + url + title (for getBookmarkForDisplay), provider + url (for getTagsForUrl)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: normalized bookmark (tags array), tags array, badge display value (text, tagCount, flags)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: single module url-tags-manager; used by message-handler, service-worker, badge-manager, popup, bookmark-router
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Http, State
 *   - TERMINATION: total
 * - PROCEDURE: GET_BADGE_DISPLAY_VALUE
 *   - normalized = normalizeBookmarkForDisplay(bookmark)
 *   - RETURN { text, tagCount, isPrivate, isToRead, isBookmarked, title }
 *   - How (sub-block): Handler and popup and router usage (same IMPL set).
 *   - 1. Message handler: handleGetCurrentBookmark always via getBookmarkForDisplay(router)
 *   - 2. Message handler: handleGetTagsForUrl returns getTagsForUrl
 *   - 3. Popup: getBookmarkData null only when blocked; re-fetch tags before add/remove
 *   - 4. Router: _hasTags/_isEmptyBookmark use normalizeBookmarkForDisplay
 * 
 * === END IMPL-FULL-BLOCK: IMPL-URL_TAGS_DISPLAY ===
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
