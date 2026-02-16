/**
 * Unit tests for StorageIndex - [REQ-PER_BOOKMARK_STORAGE_BACKEND] [IMPL-STORAGE_INDEX]
 */

import { StorageIndex } from '../../src/features/storage/storage-index.js'

describe('StorageIndex [REQ-PER_BOOKMARK_STORAGE_BACKEND] [IMPL-STORAGE_INDEX]', () => {
  let index
  let stored

  beforeEach(() => {
    stored = {}
    global.chrome.storage.local.get.mockImplementation(async (key) => {
      if (key === 'hoverboard_storage_index') {
        return { hoverboard_storage_index: { ...stored } }
      }
      return { [key]: stored }
    })
    global.chrome.storage.local.set.mockImplementation((obj) => {
      if (obj.hoverboard_storage_index) {
        stored = { ...obj.hoverboard_storage_index }
      }
      return Promise.resolve()
    })
    index = new StorageIndex()
  })

  test('getIndex returns empty object when nothing stored', async () => {
    stored = {}
    const result = await index.getIndex()
    expect(result).toEqual({})
  })

  test('setBackendForUrl and getBackendForUrl round-trip [IMPL-STORAGE_INDEX]', async () => {
    await index.setBackendForUrl('https://example.com/page', 'local')
    const backend = await index.getBackendForUrl('https://example.com/page')
    expect(backend).toBe('local')
  })

  test('setBackendForUrl normalizes URL (trailing slash) [IMPL-STORAGE_INDEX]', async () => {
    await index.setBackendForUrl('https://example.com/path/', 'file')
    const backend = await index.getBackendForUrl('https://example.com/path')
    expect(backend).toBe('file')
  })

  test('getBackendForUrl returns null when URL not in index', async () => {
    const backend = await index.getBackendForUrl('https://example.com/unknown')
    expect(backend).toBe(null)
  })

  test('removeUrl removes entry', async () => {
    await index.setBackendForUrl('https://example.com/r', 'pinboard')
    await index.removeUrl('https://example.com/r')
    const backend = await index.getBackendForUrl('https://example.com/r')
    expect(backend).toBe(null)
  })

  test('setBackendForUrl rejects invalid backend', async () => {
    await expect(index.setBackendForUrl('https://x.com', 'invalid')).rejects.toThrow('Invalid backend')
  })

  test('accepts pinboard, local, file, sync [REQ-PER_BOOKMARK_STORAGE_BACKEND] [ARCH-SYNC_STORAGE_PROVIDER]', async () => {
    await index.setBackendForUrl('https://a.com', 'pinboard')
    await index.setBackendForUrl('https://b.com', 'local')
    await index.setBackendForUrl('https://c.com', 'file')
    await index.setBackendForUrl('https://d.com', 'sync')
    expect(await index.getBackendForUrl('https://a.com')).toBe('pinboard')
    expect(await index.getBackendForUrl('https://b.com')).toBe('local')
    expect(await index.getBackendForUrl('https://c.com')).toBe('file')
    expect(await index.getBackendForUrl('https://d.com')).toBe('sync')
  })
})
