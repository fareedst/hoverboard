/**
 * [IMPL-PINBOARD_API] [IMPL-PINBOARD_POSTS_ADD_ENCODING] [IMPL-BOOKMARK_ROUTER] [IMPL-STORAGE_INDEX] [ARCH-PINBOARD_API] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-PINBOARD_COMPATIBILITY] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Connects BookmarkRouter preferred-backend selection to Pinboard save and encoded posts/add parameters without a live network call.
 * Contract:
 *   INPUT: bookmark data, preferred backend, Pinboard provider, storage index
 *   PRE: Pinboard provider and router storage index are initialized
 *   OUTPUT: Pinboard save result and encoded request parameters
 *   POST:
 *     success => router delegates to Pinboard and encoded values preserve fragments and plus characters
 *   FAILURE_MODES: OperationFailed
 *   DATA: bookmark fields, encoded parameter pairs, storage-index backend mapping
 *   DATA_TRANSITION: successful router save records pinboard as the URL backend
 *   EFFECTS: Async, IO, State
 *   TERMINATION: total
 * PROCEDURE: ROUTER_STORAGE_PINBOARD
 *   Resolve pinboard from preferred backend
 *   AWAIT provider save
 *   Encode each posts/add value
 *   Update storage index after successful save
 *   RETURN provider result
 *
 * Pattern: ROUTER_STORAGE
 * Composition: BookmarkRouter preferred backend -> PinboardService save /
 * encoded posts/add payload. No external network call and no UI invocation.
 */

import { BookmarkRouter } from '../../src/features/storage/bookmark-router.js'
import { StorageIndex } from '../../src/features/storage/storage-index.js'
import { PinboardService } from '../../src/features/pinboard/pinboard-service.js'

function providerStub () {
  return {
    getBookmarkForUrl: jest.fn().mockResolvedValue(null),
    saveBookmark: jest.fn().mockResolvedValue({ success: true }),
    deleteBookmark: jest.fn().mockResolvedValue({ success: true }),
    getRecentBookmarks: jest.fn().mockResolvedValue([]),
    saveTag: jest.fn().mockResolvedValue({ success: true }),
    deleteTag: jest.fn().mockResolvedValue({ success: true }),
    getAllBookmarks: jest.fn().mockResolvedValue([])
  }
}

describe('[IMPL-PINBOARD_API] router/provider composition', () => {
  let indexStorage

  beforeEach(() => {
    indexStorage = {}
    global.chrome.storage.local.get.mockImplementation(async (keys) => {
      const key = typeof keys === 'object' && !Array.isArray(keys)
        ? Object.keys(keys)[0]
        : (Array.isArray(keys) ? keys[0] : keys)
      if (key === 'hoverboard_storage_index') return { hoverboard_storage_index: { ...indexStorage } }
      return {}
    })
    global.chrome.storage.local.set.mockImplementation((obj) => {
      if (obj.hoverboard_storage_index !== undefined) {
        indexStorage = { ...obj.hoverboard_storage_index }
      }
      return Promise.resolve()
    })
  })

  test('preferred pinboard backend receives the bookmark payload', async () => {
    const pinboard = new PinboardService({
      addTag: jest.fn(),
      removeTag: jest.fn()
    })
    pinboard.saveBookmark = jest.fn().mockResolvedValue({ success: true, code: 'done' })
    const index = new StorageIndex()
    const router = new BookmarkRouter(
      pinboard,
      providerStub(),
      providerStub(),
      providerStub(),
      index,
      () => Promise.resolve('local')
    )

    const data = {
      url: 'https://example.com/a#b',
      description: 'A + B',
      tags: ['tag+one'],
      preferredBackend: 'pinboard'
    }
    const result = await router.saveBookmark(data)

    expect(result).toEqual({ success: true, code: 'done' })
    expect(pinboard.saveBookmark).toHaveBeenCalledWith(data)
    expect(global.chrome.storage.local.set).toHaveBeenCalledWith({
      hoverboard_storage_index: { 'https://example.com/a#b': 'pinboard' }
    })
  })

  test('posts/add encoding keeps fragments and plus characters inside values', () => {
    const service = new PinboardService({
      addTag: jest.fn(),
      removeTag: jest.fn()
    })
    const encoded = service.buildSaveParams({
      url: 'https://example.com/a#b',
      description: 'A + B',
      tags: ['tag+one'],
      extended: ''
    })

    expect(encoded).toContain('url=https%3A%2F%2Fexample.com%2Fa%23b')
    expect(encoded).toContain('description=A%20%2B%20B')
    expect(encoded).toContain('tags=tag%2Bone')
  })
})
