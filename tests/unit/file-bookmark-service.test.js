/**
 * Unit tests for FileBookmarkService - [REQ-FILE_BOOKMARK_STORAGE] [IMPL-FILE_BOOKMARK_SERVICE]
 * Validates file-based bookmark provider with mocked adapter (in-memory).
 */

import { FileBookmarkService } from '../../src/features/storage/file-bookmark-service.js'
import { InMemoryFileBookmarkAdapter, FILE_FORMAT_VERSION } from '../../src/features/storage/file-bookmark-storage-adapter.js'

describe('FileBookmarkService [REQ-FILE_BOOKMARK_STORAGE] [IMPL-FILE_BOOKMARK_SERVICE]', () => {
  let service
  let adapter
  let mockTagService

  beforeEach(() => {
    adapter = new InMemoryFileBookmarkAdapter()
    mockTagService = {
      sanitizeTag: (t) => (t && t.trim ? t.trim() : t),
      handleTagAddition: jest.fn().mockResolvedValue(undefined)
    }
    service = new FileBookmarkService(adapter, mockTagService)
  })

  describe('getBookmarkForUrl', () => {
    test('returns empty bookmark when URL not in file [REQ-FILE_BOOKMARK_STORAGE] [IMPL-BOOKMARK_CREATE_UPDATE_TIMES]', async () => {
      const result = await service.getBookmarkForUrl('https://example.com/foo', 'Example')
      expect(result).toMatchObject({
        url: 'https://example.com/foo',
        description: 'Example',
        extended: '',
        tags: [],
        time: '',
        updated_at: '',
        shared: 'yes',
        toread: 'no'
      })
      expect(result.hash).toBe('')
    })

    test('returns normalized bookmark when URL exists [IMPL-FILE_BOOKMARK_SERVICE]', async () => {
      await adapter.writeBookmarksFile({
        version: FILE_FORMAT_VERSION,
        bookmarks: {
          'https://example.com/page': {
            url: 'https://example.com/page',
            description: 'My Title',
            extended: 'notes',
            tags: ['a', 'b'],
            time: '2026-02-14T12:00:00.000Z',
            shared: 'yes',
            toread: 'no',
            hash: 'file-abc'
          }
        }
      })
      const result = await service.getBookmarkForUrl('https://example.com/page')
      expect(result).toMatchObject({
        url: 'https://example.com/page',
        description: 'My Title',
        extended: 'notes',
        tags: ['a', 'b'],
        time: '2026-02-14T12:00:00.000Z',
        shared: 'yes',
        toread: 'no',
        hash: 'file-abc'
      })
      expect(result.updated_at).toBe('2026-02-14T12:00:00.000Z')
    })

    test('legacy bookmark without updated_at normalizes updated_at to time [REQ-BOOKMARK_CREATE_UPDATE_TIMES]', async () => {
      await adapter.writeBookmarksFile({
        version: FILE_FORMAT_VERSION,
        bookmarks: {
          'https://example.com/legacy': {
            url: 'https://example.com/legacy',
            description: 'Legacy',
            tags: [],
            time: '2026-02-10T08:00:00.000Z',
            shared: 'yes',
            toread: 'no',
            hash: 'h'
          }
        }
      })
      const result = await service.getBookmarkForUrl('https://example.com/legacy')
      expect(result.time).toBe('2026-02-10T08:00:00.000Z')
      expect(result.updated_at).toBe('2026-02-10T08:00:00.000Z')
    })

    test('normalizes URL (trim trailing slash) [IMPL-FILE_BOOKMARK_SERVICE]', async () => {
      await adapter.writeBookmarksFile({
        version: FILE_FORMAT_VERSION,
        bookmarks: {
          'https://example.com/path': {
            url: 'https://example.com/path',
            description: 'X',
            tags: [],
            time: '2026-02-14T12:00:00.000Z',
            shared: 'yes',
            toread: 'no',
            hash: 'h'
          }
        }
      })
      const result = await service.getBookmarkForUrl('https://example.com/path/')
      expect(result.url).toBe('https://example.com/path')
      expect(result.description).toBe('X')
    })
  })

  describe('saveBookmark', () => {
    test('saves new bookmark and returns success [REQ-FILE_BOOKMARK_STORAGE] [REQ-BOOKMARK_CREATE_UPDATE_TIMES]', async () => {
      const result = await service.saveBookmark({
        url: 'https://example.com/new',
        description: 'New Page',
        tags: ['tag1']
      })
      expect(result).toEqual({ success: true, code: 'done', message: 'Operation completed' })

      const data = await adapter.readBookmarksFile()
      expect(data.bookmarks['https://example.com/new']).toBeDefined()
      expect(data.bookmarks['https://example.com/new'].description).toBe('New Page')
      expect(data.bookmarks['https://example.com/new'].tags).toEqual(['tag1'])
      expect(data.bookmarks['https://example.com/new'].time).toBeDefined()
      expect(data.bookmarks['https://example.com/new'].updated_at).toBeDefined()
      expect(data.bookmarks['https://example.com/new'].time).toBe(data.bookmarks['https://example.com/new'].updated_at)
      expect(data.bookmarks['https://example.com/new'].hash).toMatch(/^file-/)
    })

    test('rejects when URL is missing [IMPL-FILE_BOOKMARK_SERVICE]', async () => {
      const result = await service.saveBookmark({ description: 'No URL' })
      expect(result).toEqual({ success: false, code: 'invalid', message: 'URL is required' })
    })

    test('updates existing bookmark [IMPL-FILE_BOOKMARK_SERVICE]', async () => {
      await service.saveBookmark({
        url: 'https://example.com/update',
        description: 'First',
        tags: ['a']
      })
      await service.saveBookmark({
        url: 'https://example.com/update',
        description: 'Second',
        tags: ['a', 'b']
      })
      const b = await service.getBookmarkForUrl('https://example.com/update')
      expect(b.description).toBe('Second')
      expect(b.tags).toEqual(['a', 'b'])
    })

    test('update preserves create time and sets new updated_at [REQ-BOOKMARK_CREATE_UPDATE_TIMES]', async () => {
      await service.saveBookmark({ url: 'https://example.com/ut', description: 'First', tags: [] })
      const afterFirst = await service.getBookmarkForUrl('https://example.com/ut')
      const createTime = afterFirst.time
      expect(createTime).toBeTruthy()
      expect(afterFirst.updated_at).toBe(createTime)
      await new Promise(r => setTimeout(r, 5))
      await service.saveBookmark({ url: 'https://example.com/ut', description: 'Second', tags: ['x'] })
      const afterSecond = await service.getBookmarkForUrl('https://example.com/ut')
      expect(afterSecond.time).toBe(createTime)
      expect(afterSecond.updated_at).toBeTruthy()
      expect(afterSecond.updated_at).not.toBe(createTime)
    })
  })

  describe('deleteBookmark', () => {
    test('removes bookmark and returns success [REQ-FILE_BOOKMARK_STORAGE]', async () => {
      await service.saveBookmark({ url: 'https://example.com/del', description: 'To delete' })
      const result = await service.deleteBookmark('https://example.com/del')
      expect(result).toEqual({ success: true, code: 'done', message: 'Operation completed' })
      const b = await service.getBookmarkForUrl('https://example.com/del')
      expect(b.time).toBe('')
      expect(b.description).toBe('')
    })

    test('idempotent when URL not found [IMPL-FILE_BOOKMARK_SERVICE]', async () => {
      const result = await service.deleteBookmark('https://example.com/nonexistent')
      expect(result).toEqual({ success: true, code: 'done', message: 'Operation completed' })
    })
  })

  describe('getRecentBookmarks', () => {
    test('returns list sorted by time descending [REQ-FILE_BOOKMARK_STORAGE]', async () => {
      await adapter.writeBookmarksFile({
        version: FILE_FORMAT_VERSION,
        bookmarks: {
          'https://example.com/old': { url: 'https://example.com/old', description: 'Old', tags: [], time: '2026-02-14T10:00:00.000Z', updated_at: '2026-02-14T10:00:00.000Z', shared: 'yes', toread: 'no', hash: 'file-o' },
          'https://example.com/new': { url: 'https://example.com/new', description: 'New', tags: [], time: '2026-02-14T12:00:00.000Z', updated_at: '2026-02-14T12:00:00.000Z', shared: 'yes', toread: 'no', hash: 'file-n' }
        }
      })
      const list = await service.getRecentBookmarks(10)
      expect(list.length).toBe(2)
      expect(list[0].url).toBe('https://example.com/new')
      expect(list[1].url).toBe('https://example.com/old')
    })

    test('respects count limit [IMPL-FILE_BOOKMARK_SERVICE]', async () => {
      for (let i = 0; i < 5; i++) {
        await service.saveBookmark({
          url: `https://example.com/page${i}`,
          description: `Page ${i}`,
          time: `2026-02-14T${10 + i}:00:00.000Z`
        })
      }
      const list = await service.getRecentBookmarks(2)
      expect(list.length).toBe(2)
    })

    test('returns empty array when file empty [IMPL-FILE_BOOKMARK_SERVICE]', async () => {
      const list = await service.getRecentBookmarks(15)
      expect(list).toEqual([])
    })
  })

  describe('saveTag and deleteTag', () => {
    test('saveTag adds tag and persists [REQ-FILE_BOOKMARK_STORAGE]', async () => {
      await service.saveBookmark({ url: 'https://example.com/t', description: 'T', tags: [] })
      await service.saveTag({ url: 'https://example.com/t', value: 'newtag' })
      const b = await service.getBookmarkForUrl('https://example.com/t')
      expect(b.tags).toContain('newtag')
    })

    test('deleteTag removes tag [IMPL-FILE_BOOKMARK_SERVICE]', async () => {
      await service.saveBookmark({ url: 'https://example.com/t2', description: 'T2', tags: ['x', 'y'] })
      await service.deleteTag({ url: 'https://example.com/t2', value: 'x' })
      const b = await service.getBookmarkForUrl('https://example.com/t2')
      expect(b.tags).toEqual(['y'])
    })
  })

  describe('edge cases', () => {
    test('handles empty file (adapter returns empty bookmarks) [IMPL-FILE_BOOKMARK_SERVICE]', async () => {
      const b = await service.getBookmarkForUrl('https://any.com')
      expect(b.url).toBe('https://any.com')
      expect(b.tags).toEqual([])
    })

    test('handles tags as space-separated string in stored data [IMPL-FILE_BOOKMARK_SERVICE]', async () => {
      await adapter.writeBookmarksFile({
        version: FILE_FORMAT_VERSION,
        bookmarks: {
          'https://example.com/str': {
            url: 'https://example.com/str',
            description: 'S',
            tags: 'foo bar',
            time: '2026-02-14T12:00:00.000Z',
            shared: 'yes',
            toread: 'no',
            hash: 'h'
          }
        }
      })
      const b = await service.getBookmarkForUrl('https://example.com/str')
      expect(b.tags).toEqual(['foo', 'bar'])
    })

    test('testConnection returns true when adapter read succeeds [REQ-FILE_BOOKMARK_STORAGE]', async () => {
      const ok = await service.testConnection()
      expect(ok).toBe(true)
    })
  })

  describe('getAllBookmarks', () => {
    test('returns full list sorted by time descending [IMPL-FILE_BOOKMARK_SERVICE]', async () => {
      await adapter.writeBookmarksFile({
        version: FILE_FORMAT_VERSION,
        bookmarks: {
          'https://example.com/a': { url: 'https://example.com/a', description: 'A', tags: [], time: '2026-02-14T09:00:00.000Z', updated_at: '2026-02-14T09:00:00.000Z', shared: 'yes', toread: 'no', hash: 'file-a' },
          'https://example.com/b': { url: 'https://example.com/b', description: 'B', tags: [], time: '2026-02-14T11:00:00.000Z', updated_at: '2026-02-14T11:00:00.000Z', shared: 'yes', toread: 'no', hash: 'file-b' }
        }
      })
      const list = await service.getAllBookmarks()
      expect(list.length).toBe(2)
      expect(list[0].url).toBe('https://example.com/b')
      expect(list[1].url).toBe('https://example.com/a')
    })
  })
})
