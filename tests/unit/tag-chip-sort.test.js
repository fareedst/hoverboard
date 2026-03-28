/**
 * [REQ-THIS_PAGE_TAG_SORT] [IMPL-THIS_PAGE_TAG_SORT]
 */
import {
  isTagChipSortMode,
  lookupBookmarkFrequency,
  sortTagChipRows,
  TAG_CHIP_SORT_MODES
} from '../../src/shared/tag-chip-sort.js'

describe('[REQ-THIS_PAGE_TAG_SORT] tag-chip-sort', () => {
  test('TAG_CHIP_SORT_MODES lists three modes', () => {
    expect(TAG_CHIP_SORT_MODES).toEqual(['alphabetical', 'frequency', 'relevance'])
    expect(isTagChipSortMode('alphabetical')).toBe(true)
    expect(isTagChipSortMode('xy')).toBe(false)
  })

  test('lookupBookmarkFrequency matches case-insensitively', () => {
    expect(lookupBookmarkFrequency({ Read: 3 }, 'read')).toBe(3)
    expect(lookupBookmarkFrequency({ read: 3 }, 'Read')).toBe(3)
    expect(lookupBookmarkFrequency({}, 'read')).toBe(0)
  })

  test('alphabetical: case-insensitive display order; stableIndex tie-break', () => {
    const rows = [
      { canonical: 'zebra', displayKey: 'zebra', stableIndex: 0 },
      { canonical: 'Apple', displayKey: 'Apple', stableIndex: 1 },
      { canonical: 'banana', displayKey: 'banana', stableIndex: 2 }
    ]
    const sorted = sortTagChipRows(rows, 'alphabetical')
    expect(sorted.map((r) => r.canonical)).toEqual(['Apple', 'banana', 'zebra'])
  })

  test('frequency: higher bookmark frequency first; alphabetical tie', () => {
    const rows = [
      { canonical: 'work', displayKey: 'work', stableIndex: 0, bookmarkFreq: 1 },
      { canonical: 'read', displayKey: 'read', stableIndex: 1, bookmarkFreq: 3 }
    ]
    const sorted = sortTagChipRows(rows, 'frequency')
    expect(sorted.map((r) => r.canonical)).toEqual(['read', 'work'])
  })

  test('frequency: equal frequency uses alphabetical display then stableIndex', () => {
    const rows = [
      { canonical: 'b', displayKey: 'b', stableIndex: 1, bookmarkFreq: 2 },
      { canonical: 'a', displayKey: 'a', stableIndex: 0, bookmarkFreq: 2 }
    ]
    const sorted = sortTagChipRows(rows, 'frequency')
    expect(sorted.map((r) => r.canonical)).toEqual(['a', 'b'])
  })

  test('relevance: higher relevance first; tie uses bookmark then inPage then alpha', () => {
    const rows = [
      { canonical: 'footer', displayKey: 'footer', stableIndex: 0, relevance: 250, bookmarkFreq: 0, inPageFreq: 2 },
      { canonical: 'nav', displayKey: 'nav', stableIndex: 1, relevance: 600, bookmarkFreq: 0, inPageFreq: 1 }
    ]
    const sorted = sortTagChipRows(rows, 'relevance')
    expect(sorted.map((r) => r.canonical)).toEqual(['nav', 'footer'])
  })

  test('relevance: equal relevance uses bookmark frequency', () => {
    const rows = [
      { canonical: 'z', displayKey: 'z', stableIndex: 0, relevance: 100, bookmarkFreq: 1, inPageFreq: 5 },
      { canonical: 'a', displayKey: 'a', stableIndex: 1, relevance: 100, bookmarkFreq: 5, inPageFreq: 1 }
    ]
    const sorted = sortTagChipRows(rows, 'relevance')
    expect(sorted.map((r) => r.canonical)).toEqual(['a', 'z'])
  })
})
