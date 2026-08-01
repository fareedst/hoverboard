/**
 * [IMPL-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [IMPL-PAGE_ARCHIVE_STORAGE] [IMPL-MESSAGE_HANDLING]
 * [ARCH-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_STORAGE] [REQ-PAGE_ARCHIVE_STORAGE]
 * Composition test: MessageHandler dispatches selected-backend archive capture into real Local bookmark and archive stores.
 */
import { MessageHandler } from '../../src/core/message-handler.js'
import { BookmarkRouter } from '../../src/features/storage/bookmark-router.js'
import { StorageIndex } from '../../src/features/storage/storage-index.js'
import { LocalBookmarkService } from '../../src/features/storage/local-bookmark-service.js'
import { InMemoryPageArchiveStorageAdapter } from '../../src/features/archive/page-archive-storage-adapter.js'
import { PageArchiveStore } from '../../src/features/archive/page-archive-store.js'

const url = 'https://example.com/archive-association-composition'

const stubProvider = () => ({
  getBookmarkForUrl: jest.fn().mockResolvedValue(null),
  saveBookmark: jest.fn().mockResolvedValue({ success: true }),
  deleteBookmark: jest.fn().mockResolvedValue({ success: true }),
  getRecentBookmarks: jest.fn().mockResolvedValue([]),
  getAllBookmarks: jest.fn().mockResolvedValue([]),
  saveTag: jest.fn().mockResolvedValue({ success: true }),
  deleteTag: jest.fn().mockResolvedValue({ success: true })
})

describe('[IMPL-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] message dispatch composition', () => {
  beforeEach(() => {
    let localStorage = {}
    global.chrome.storage.local.get.mockImplementation(async key => {
      if (key === 'hoverboard_local_bookmarks') return { hoverboard_local_bookmarks: { ...localStorage } }
      return {}
    })
    global.chrome.storage.local.set.mockImplementation(async values => {
      if (values.hoverboard_local_bookmarks) localStorage = { ...values.hoverboard_local_bookmarks }
    })
    global.chrome.scripting.executeScript = jest.fn().mockResolvedValue([{
      result: {
        title: 'Composition article',
        html: '<article><h1>Composition article</h1><p>Stored body</p></article>',
        textContent: 'Composition article Stored body'
      }
    }])
  })

  test('CAPTURE_PAGE_ARCHIVE creates the Local bookmark and separate archive through dispatch', async () => {
    // [IMPL-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [REQ-PAGE_ARCHIVE_STORAGE] Expose one stable response shape to message and UI callers.
    const localProvider = new LocalBookmarkService(null)
    const archiveAdapter = new InMemoryPageArchiveStorageAdapter()
    const archiveStore = new PageArchiveStore({
      localAdapter: archiveAdapter,
      fileAdapter: new InMemoryPageArchiveStorageAdapter()
    })
    const storageIndex = new StorageIndex()
    const router = new BookmarkRouter(
      stubProvider(),
      localProvider,
      stubProvider(),
      stubProvider(),
      storageIndex,
      () => Promise.resolve('local')
    )
    const handler = new MessageHandler(router, null, archiveStore)
    handler.configManager.isUrlAllowed = jest.fn().mockResolvedValue(true)

    const result = await handler.processMessage({
      type: 'CAPTURE_PAGE_ARCHIVE',
      data: { tabId: 22, url, preferredBackend: 'local' }
    }, { tab: { id: 22, url } })

    expect(result).toMatchObject({
      success: true,
      bookmarkCreated: true,
      archiveRetained: true
    })
    expect((await localProvider.getAllBookmarks()).find(bookmark => bookmark.url === url)).toMatchObject({
      url,
      description: 'Composition article'
    })
    expect(await archiveStore.getArchive(url, 'local')).toMatchObject({
      url,
      sourceTitle: 'Composition article'
    })
  })
})
