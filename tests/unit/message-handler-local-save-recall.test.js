/**
 * [IMPL-RUNTIME_VALIDATION] [IMPL-LOCAL_BOOKMARK_SERVICE] Save-and-recall integration:
 * processMessage(saveBookmark) then processMessage(getCurrentBookmark) returns the saved bookmark
 * when using LocalBookmarkService with mocked chrome.storage.local.
 */

import { MessageHandler } from '../../src/core/message-handler.js'
import { LocalBookmarkService } from '../../src/features/storage/local-bookmark-service.js'

let stored

beforeEach(() => {
  stored = {}
  global.chrome.storage.local.get.mockImplementation(async (keys) => {
    const key = typeof keys === 'object' && !Array.isArray(keys) ? Object.keys(keys)[0] : (Array.isArray(keys) ? keys[0] : keys)
    if (key === 'hoverboard_local_bookmarks') {
      return { hoverboard_local_bookmarks: { ...stored } }
    }
    return {}
  })
  global.chrome.storage.local.set.mockImplementation((obj) => {
    if (obj.hoverboard_local_bookmarks !== undefined) {
      stored = typeof obj.hoverboard_local_bookmarks === 'object' && !Array.isArray(obj.hoverboard_local_bookmarks)
        ? { ...obj.hoverboard_local_bookmarks }
        : {}
    }
    return Promise.resolve()
  })
  global.chrome.storage.sync.get.mockResolvedValue({
    hoverboard_auth_token: '',
    hoverboard_settings: {},
    hoverboard_inhibit_urls: ''
  })
  global.chrome.tabs.query.mockResolvedValue([])
})

describe('MessageHandler + LocalBookmarkService save then getCurrentBookmark [IMPL-LOCAL_BOOKMARK_SERVICE]', () => {
  test('saveBookmark via processMessage then getCurrentBookmark returns saved bookmark (local storage path)', async () => {
    const localService = new LocalBookmarkService(null)
    const handler = new MessageHandler(localService)

    const saveResult = await handler.processMessage(
      {
        type: 'saveBookmark',
        data: {
          url: 'https://example.com/saved',
          description: 'Saved',
          tags: 'x y',
          shared: 'yes',
          toread: 'no'
        }
      },
      {}
    )
    expect(saveResult.error).toBeUndefined()
    expect(saveResult.success).toBe(true)

    const getResult = await handler.processMessage(
      { type: 'getCurrentBookmark', data: { url: 'https://example.com/saved' } },
      {}
    )
    expect(getResult.success).toBe(true)
    expect(getResult.data).toBeDefined()
    expect(getResult.data.url).toBe('https://example.com/saved')
    expect(getResult.data.description).toBe('Saved')
    expect(Array.isArray(getResult.data.tags)).toBe(true)
    expect(getResult.data.tags).toContain('x')
    expect(getResult.data.tags).toContain('y')
    expect(getResult.data.shared).toBe('yes')
    expect(getResult.data.toread).toBe('no')
  })

  test('getCurrentBookmark for different URL does not return bookmark saved under another URL', async () => {
    const localService = new LocalBookmarkService(null)
    const handler = new MessageHandler(localService)

    await handler.processMessage(
      {
        type: 'saveBookmark',
        data: {
          url: 'https://example.com/one',
          description: 'First',
          tags: [],
          shared: 'yes',
          toread: 'no'
        }
      },
      {}
    )

    const getResult = await handler.processMessage(
      { type: 'getCurrentBookmark', data: { url: 'https://example.com/other' } },
      {}
    )
    expect(getResult.success).toBe(true)
    expect(getResult.data.url).toBe('https://example.com/other')
    expect(getResult.data.description).toBe('')
    expect(getResult.data.tags).toEqual([])
  })
})
