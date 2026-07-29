/**
 * [IMPL-FILE_BOOKMARK_SERVICE] [ARCH-FILE_BOOKMARK_PROVIDER] [REQ-FILE_BOOKMARK_STORAGE]
 * MessageFileBookmarkAdapter must not treat missing WRITE responses as durable success.
 */

import { MessageFileBookmarkAdapter } from '../../src/features/storage/message-file-bookmark-adapter.js'

describe('MessageFileBookmarkAdapter writeBookmarksFile [IMPL-FILE_BOOKMARK_SERVICE]', () => {
  beforeEach(() => {
    global.chrome = global.chrome || {}
    global.chrome.runtime = global.chrome.runtime || {}
    global.chrome.runtime.lastError = undefined
  })

  test('rejects when WRITE_FILE_BOOKMARKS response is undefined', async () => {
    global.chrome.runtime.sendMessage = jest.fn((_msg, cb) => {
      cb(undefined)
    })
    const adapter = new MessageFileBookmarkAdapter()
    await expect(adapter.writeBookmarksFile({ version: 1, bookmarks: {} })).rejects.toThrow()
  })

  test('rejects when WRITE_FILE_BOOKMARKS response lacks success', async () => {
    global.chrome.runtime.sendMessage = jest.fn((_msg, cb) => {
      cb({ error: null })
    })
    const adapter = new MessageFileBookmarkAdapter()
    await expect(adapter.writeBookmarksFile({ version: 1, bookmarks: {} })).rejects.toThrow()
  })

  test('resolves when WRITE_FILE_BOOKMARKS returns success', async () => {
    global.chrome.runtime.sendMessage = jest.fn((_msg, cb) => {
      cb({ error: null, success: true })
    })
    const adapter = new MessageFileBookmarkAdapter()
    await expect(adapter.writeBookmarksFile({ version: 1, bookmarks: {} })).resolves.toBeUndefined()
  })
})
