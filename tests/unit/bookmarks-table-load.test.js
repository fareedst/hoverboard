/**
 * Index load failure detection and store-change reload —
 * [REQ-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX]
 */

import {
  isAggregatedIndexLoadFailure,
  extractBookmarksList,
  shouldReloadBookmarksOnStoreChange,
  onStoreFilterChange,
  createProviderInitMutex
} from '../../src/ui/bookmarks-table/bookmarks-table-load.js'

describe('isAggregatedIndexLoadFailure [REQ-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX]', () => {
  test('treats null response as failure', () => {
    expect(isAggregatedIndexLoadFailure(null)).toBe(true)
    expect(isAggregatedIndexLoadFailure(undefined)).toBe(true)
  })

  test('treats success:false as failure', () => {
    expect(isAggregatedIndexLoadFailure({ success: false, error: 'boom' })).toBe(true)
  })

  test('treats top-level error with empty bookmarks as failure', () => {
    expect(isAggregatedIndexLoadFailure({ bookmarks: [], error: 'aggregate failed' })).toBe(true)
  })

  test('treats data.error with empty bookmarks as failure (SW wrap)', () => {
    expect(isAggregatedIndexLoadFailure({
      success: true,
      data: { bookmarks: [], error: 'aggregate failed' }
    })).toBe(true)
  })

  test('healthy bookmarks array is not failure', () => {
    expect(isAggregatedIndexLoadFailure({
      success: true,
      data: { bookmarks: [{ url: 'https://a.example', storage: 'local' }] }
    })).toBe(false)
  })

  test('genuine empty success without error is not failure', () => {
    expect(isAggregatedIndexLoadFailure({
      success: true,
      data: { bookmarks: [] }
    })).toBe(false)
  })
})

describe('extractBookmarksList [REQ-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX]', () => {
  test('reads data.bookmarks from SW wrap', () => {
    expect(extractBookmarksList({ success: true, data: { bookmarks: [1] } })).toEqual([1])
  })

  test('reads top-level bookmarks', () => {
    expect(extractBookmarksList({ bookmarks: [2] })).toEqual([2])
  })
})

describe('shouldReloadBookmarksOnStoreChange [REQ-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX]', () => {
  test('true when cache empty and at least one store checked', () => {
    expect(shouldReloadBookmarksOnStoreChange({ allBookmarksLength: 0, allowedStoresSize: 1 })).toBe(true)
  })

  test('false when cache already populated', () => {
    expect(shouldReloadBookmarksOnStoreChange({ allBookmarksLength: 3, allowedStoresSize: 1 })).toBe(false)
  })

  test('false when no store checked', () => {
    expect(shouldReloadBookmarksOnStoreChange({ allBookmarksLength: 0, allowedStoresSize: 0 })).toBe(false)
  })
})

describe('onStoreFilterChange [REQ-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX]', () => {
  test('applies filter and reloads when cache empty and store checked', async () => {
    const applySearchAndFilter = jest.fn()
    const loadBookmarks = jest.fn().mockResolvedValue(undefined)
    await onStoreFilterChange({
      allBookmarksLength: 0,
      allowedStoresSize: 1,
      applySearchAndFilter,
      loadBookmarks
    })
    expect(applySearchAndFilter).toHaveBeenCalledTimes(1)
    expect(loadBookmarks).toHaveBeenCalledTimes(1)
  })

  test('applies filter only when cache populated', async () => {
    const applySearchAndFilter = jest.fn()
    const loadBookmarks = jest.fn().mockResolvedValue(undefined)
    await onStoreFilterChange({
      allBookmarksLength: 5,
      allowedStoresSize: 2,
      applySearchAndFilter,
      loadBookmarks
    })
    expect(applySearchAndFilter).toHaveBeenCalledTimes(1)
    expect(loadBookmarks).not.toHaveBeenCalled()
  })

  test('does not reload when no store checked', async () => {
    const applySearchAndFilter = jest.fn()
    const loadBookmarks = jest.fn().mockResolvedValue(undefined)
    await onStoreFilterChange({
      allBookmarksLength: 0,
      allowedStoresSize: 0,
      applySearchAndFilter,
      loadBookmarks
    })
    expect(applySearchAndFilter).toHaveBeenCalledTimes(1)
    expect(loadBookmarks).not.toHaveBeenCalled()
  })
})

describe('createProviderInitMutex [REQ-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX]', () => {
  test('concurrent ensure calls share one in-flight init', async () => {
    let concurrent = 0
    let maxConcurrent = 0
    const initFn = jest.fn(async () => {
      concurrent++
      maxConcurrent = Math.max(maxConcurrent, concurrent)
      await new Promise(r => setTimeout(r, 20))
      concurrent--
    })
    const ensure = createProviderInitMutex(initFn)
    await Promise.all([ensure(), ensure(), ensure()])
    expect(initFn).toHaveBeenCalledTimes(1)
    expect(maxConcurrent).toBe(1)
  })

  test('after success, further ensure calls are no-ops', async () => {
    const initFn = jest.fn(async () => {})
    const ensure = createProviderInitMutex(initFn)
    await ensure()
    await ensure()
    expect(initFn).toHaveBeenCalledTimes(1)
  })

  test('failed init allows retry', async () => {
    const initFn = jest.fn()
      .mockRejectedValueOnce(new Error('cold'))
      .mockResolvedValueOnce(undefined)
    const ensure = createProviderInitMutex(initFn)
    await expect(ensure()).rejects.toThrow('cold')
    await ensure()
    expect(initFn).toHaveBeenCalledTimes(2)
  })
})
