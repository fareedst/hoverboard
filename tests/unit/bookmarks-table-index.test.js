/**
 * Local Bookmarks Index storage filter logic - [REQ-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX]
 * Pure function matchStorageFilter: All (empty) vs local | file | sync.
 */

import { matchStorageFilter } from '../../src/ui/bookmarks-table/bookmarks-table-filter.js'

describe('matchStorageFilter [REQ-LOCAL_BOOKMARKS_INDEX]', () => {
  test('returns true for any bookmark when value is empty (All)', () => {
    expect(matchStorageFilter({ storage: 'local' }, '')).toBe(true)
    expect(matchStorageFilter({ storage: 'file' }, '')).toBe(true)
    expect(matchStorageFilter({ storage: 'sync' }, '')).toBe(true)
    expect(matchStorageFilter({}, '')).toBe(true)
    expect(matchStorageFilter({ storage: 'local' }, '   ')).toBe(true)
  })

  test('returns true only when storage matches value for local', () => {
    expect(matchStorageFilter({ storage: 'local' }, 'local')).toBe(true)
    expect(matchStorageFilter({ storage: 'file' }, 'local')).toBe(false)
    expect(matchStorageFilter({ storage: 'sync' }, 'local')).toBe(false)
    expect(matchStorageFilter({}, 'local')).toBe(true)
  })

  test('returns true only when storage matches value for file', () => {
    expect(matchStorageFilter({ storage: 'file' }, 'file')).toBe(true)
    expect(matchStorageFilter({ storage: 'local' }, 'file')).toBe(false)
    expect(matchStorageFilter({ storage: 'sync' }, 'file')).toBe(false)
  })

  test('returns true only when storage matches value for sync', () => {
    expect(matchStorageFilter({ storage: 'sync' }, 'sync')).toBe(true)
    expect(matchStorageFilter({ storage: 'local' }, 'sync')).toBe(false)
    expect(matchStorageFilter({ storage: 'file' }, 'sync')).toBe(false)
  })

  test('is case-insensitive', () => {
    expect(matchStorageFilter({ storage: 'Local' }, 'local')).toBe(true)
    expect(matchStorageFilter({ storage: 'FILE' }, 'file')).toBe(true)
    expect(matchStorageFilter({ storage: 'Sync' }, 'SYNC')).toBe(true)
  })
})
