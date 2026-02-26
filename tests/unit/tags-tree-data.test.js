/**
 * [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]
 * Unit tests verify buildTagToBookmarks, getAllTagsFromBookmarks, and intersectionTagOrder implement the data shapes and helpers required by the side panel tag tree.
 * [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_TAGS_TREE] intersectionTagOrder: used to set Tags tree selected tags from current bookmark tags.
 */

import {
  buildTagToBookmarks,
  getAllTagsFromBookmarks,
  getCanonicalTag,
  getFilterStateForTagsTree,
  intersectionTagOrder,
  mergePreferredTagSpelling
} from '../../src/ui/side-panel/tags-tree-data.js'

describe('buildTagToBookmarks [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]', () => {
  test('returns empty Map for empty list', () => {
    const out = buildTagToBookmarks([])
    expect(out).toBeInstanceOf(Map)
    expect(out.size).toBe(0)
  })

  test('returns empty Map for non-array input', () => {
    expect(buildTagToBookmarks(null).size).toBe(0)
    expect(buildTagToBookmarks(undefined).size).toBe(0)
    expect(buildTagToBookmarks({}).size).toBe(0)
  })

  test('ignores bookmarks with no tags', () => {
    const out = buildTagToBookmarks([
      { url: 'https://a.com', description: 'A' }
    ])
    expect(out.size).toBe(0)
  })

  test('builds one tag with one bookmark', () => {
    const out = buildTagToBookmarks([
      { url: 'https://a.com', description: 'Site A', tags: ['foo'] }
    ])
    expect(out.size).toBe(1)
    expect(out.get('foo')).toEqual([{ title: 'Site A', url: 'https://a.com' }])
  })

  test('same tag across multiple bookmarks aggregates entries', () => {
    const out = buildTagToBookmarks([
      { url: 'https://a.com', description: 'A', tags: ['foo'] },
      { url: 'https://b.com', description: 'B', tags: ['foo'] }
    ])
    expect(out.size).toBe(1)
    expect(out.get('foo')).toHaveLength(2)
    expect(out.get('foo')).toEqual([
      { title: 'A', url: 'https://a.com' },
      { title: 'B', url: 'https://b.com' }
    ])
  })

  test('same URL in multiple tags appears under each tag', () => {
    const out = buildTagToBookmarks([
      { url: 'https://x.com', description: 'X', tags: ['tag1', 'tag2'] }
    ])
    expect(out.size).toBe(2)
    expect(out.get('tag1')).toEqual([{ title: 'X', url: 'https://x.com' }])
    expect(out.get('tag2')).toEqual([{ title: 'X', url: 'https://x.com' }])
  })

  test('trims tag names and skips empty tags', () => {
    const out = buildTagToBookmarks([
      { url: 'https://a.com', description: 'A', tags: ['  bar  ', '', 'baz'] }
    ])
    expect(out.size).toBe(2)
    expect(out.get('bar')).toEqual([{ title: 'A', url: 'https://a.com' }])
    expect(out.get('baz')).toEqual([{ title: 'A', url: 'https://a.com' }])
  })

  test('uses url as title when description is missing or empty', () => {
    const out = buildTagToBookmarks([
      { url: 'https://u.com', tags: ['t'] },
      { url: 'https://v.com', description: '', tags: ['t'] }
    ])
    expect(out.get('t')).toEqual([
      { title: 'https://u.com', url: 'https://u.com' },
      { title: 'https://v.com', url: 'https://v.com' }
    ])
  })

  test('handles missing tags property', () => {
    const out = buildTagToBookmarks([
      { url: 'https://a.com', description: 'A' }
    ])
    expect(out.size).toBe(0)
  })

  test('handles non-array tags gracefully', () => {
    const out = buildTagToBookmarks([
      { url: 'https://a.com', description: 'A', tags: 'single' }
    ])
    expect(out.size).toBe(0)
  })

  test('with canonicalTags uses canonical spelling as map key [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_TAGS_TREE]', () => {
    const bookmarks = [
      { url: 'https://a.com', description: 'A', tags: ['extension'] }
    ]
    const canonicalTags = ['Extension', 'github']
    const out = buildTagToBookmarks(bookmarks, canonicalTags)
    expect(out.size).toBe(1)
    expect(out.has('Extension')).toBe(true)
    expect(out.get('Extension')).toEqual([{ title: 'A', url: 'https://a.com' }])
  })

  test('with canonicalTags aggregates same tag different case under one key [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_TAGS_TREE]', () => {
    const bookmarks = [
      { url: 'https://a.com', description: 'A', tags: ['extension'] },
      { url: 'https://b.com', description: 'B', tags: ['Extension'] }
    ]
    const canonicalTags = ['Extension']
    const out = buildTagToBookmarks(bookmarks, canonicalTags)
    expect(out.size).toBe(1)
    expect(out.get('Extension')).toHaveLength(2)
    expect(out.get('Extension')).toEqual([
      { title: 'A', url: 'https://a.com' },
      { title: 'B', url: 'https://b.com' }
    ])
  })

  test('without second arg or undefined uses tag as-is (unchanged behavior)', () => {
    const bookmarks = [{ url: 'https://a.com', description: 'A', tags: ['foo'] }]
    expect(buildTagToBookmarks(bookmarks).get('foo')).toHaveLength(1)
    expect(buildTagToBookmarks(bookmarks, undefined).get('foo')).toHaveLength(1)
  })

  test('canonicalTags empty array uses tag as-is (no canonical)', () => {
    const bookmarks = [{ url: 'https://a.com', description: 'A', tags: ['extension'] }]
    const out = buildTagToBookmarks(bookmarks, [])
    expect(out.size).toBe(1)
    expect(out.has('extension')).toBe(true)
  })
})

describe('getAllTagsFromBookmarks [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]', () => {
  test('returns empty array for empty list', () => {
    expect(getAllTagsFromBookmarks([])).toEqual([])
  })

  test('returns empty array for non-array input', () => {
    expect(getAllTagsFromBookmarks(null)).toEqual([])
    expect(getAllTagsFromBookmarks(undefined)).toEqual([])
  })

  test('returns sorted unique tags', () => {
    const out = getAllTagsFromBookmarks([
      { tags: ['z', 'a'] },
      { tags: ['a', 'm'] }
    ])
    expect(out).toEqual(['a', 'm', 'z'])
  })

  test('trims and dedupes tags', () => {
    const out = getAllTagsFromBookmarks([
      { tags: ['  x  ', 'x', 'y'] }
    ])
    expect(out).toEqual(['x', 'y'])
  })

  test('skips empty strings after trim', () => {
    const out = getAllTagsFromBookmarks([
      { tags: ['a', '', '  ', 'b'] }
    ])
    expect(out).toEqual(['a', 'b'])
  })
})

describe('mergePreferredTagSpelling [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_TAGS_TREE]', () => {
  test('allTags null returns sorted unique preferred or empty array', () => {
    expect(mergePreferredTagSpelling(null, ['z', 'a'])).toEqual(['a', 'z'])
    expect(mergePreferredTagSpelling(null, [])).toEqual([])
    expect(mergePreferredTagSpelling(null, null)).toEqual([])
  })

  test('preferredTags empty or null returns copy of allTags', () => {
    const allTags = ['a', 'b']
    expect(mergePreferredTagSpelling(allTags, [])).toEqual(['a', 'b'])
    expect(mergePreferredTagSpelling(allTags, null)).toEqual(['a', 'b'])
  })

  test('preferred spelling wins on case-insensitive match; one per tag', () => {
    const allTags = ['extension', 'github']
    const preferredTags = ['Extension', 'github']
    const result = mergePreferredTagSpelling(allTags, preferredTags)
    expect(result).toContain('Extension')
    expect(result).toContain('github')
    expect(result).toHaveLength(2)
    expect(result).toEqual(['Extension', 'github'])
  })

  test('no duplicates when index has same tag different case', () => {
    const allTags = ['extension', 'Extension']
    const preferredTags = ['Extension']
    const result = mergePreferredTagSpelling(allTags, preferredTags)
    expect(result).toHaveLength(1)
    expect(result[0]).toBe('Extension')
  })

  test('preferred tag not in allTags is added', () => {
    const allTags = ['a']
    const preferredTags = ['A', 'new']
    const result = mergePreferredTagSpelling(allTags, preferredTags)
    expect(result).toContain('A')
    expect(result).toContain('new')
    expect(result).toHaveLength(2)
    expect(result).toEqual(['A', 'new'])
  })

  test('result is sorted', () => {
    const allTags = ['z', 'a']
    const preferredTags = ['z', 'a']
    expect(mergePreferredTagSpelling(allTags, preferredTags)).toEqual(['a', 'z'])
  })

  test('trim and skip empty strings', () => {
    const allTags = ['  a  ', 'b']
    const preferredTags = ['', 'c']
    const result = mergePreferredTagSpelling(allTags, preferredTags)
    expect(result).toEqual(['a', 'b', 'c'])
  })
})

describe('getCanonicalTag [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_TAGS_TREE]', () => {
  test('exact match returns that spelling from allTags', () => {
    expect(getCanonicalTag('foo', ['foo', 'bar'])).toBe('foo')
  })

  test('case-insensitive match returns allTags spelling', () => {
    expect(getCanonicalTag('extension', ['Extension', 'github'])).toBe('Extension')
    expect(getCanonicalTag('Extension', ['extension', 'github'])).toBe('extension')
  })

  test('tag not in allTags returns tag unchanged', () => {
    expect(getCanonicalTag('unknown', ['a', 'b'])).toBe('unknown')
  })

  test('falsy or empty tag returns empty string', () => {
    expect(getCanonicalTag('', ['a'])).toBe('')
  })

  test('empty or non-array allTags returns tag as-is', () => {
    expect(getCanonicalTag('x', [])).toBe('x')
    expect(getCanonicalTag('x', null)).toBe('x')
  })
})

describe('intersectionTagOrder [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_TAGS_TREE]', () => {
  test('returns intersection preserving order of preferredTags', () => {
    const allTags = ['a', 'b', 'c', 'd']
    const preferred = ['c', 'a', 'x']
    expect(intersectionTagOrder(allTags, preferred)).toEqual(['c', 'a'])
  })

  test('returns empty for empty preferredTags', () => {
    expect(intersectionTagOrder(['a', 'b'], [])).toEqual([])
  })

  test('returns empty for empty allTags', () => {
    expect(intersectionTagOrder([], ['a', 'b'])).toEqual([])
  })

  test('returns empty for non-array inputs', () => {
    expect(intersectionTagOrder(null, ['a'])).toEqual([])
    expect(intersectionTagOrder(['a'], null)).toEqual([])
    expect(intersectionTagOrder(undefined, [])).toEqual([])
  })

  test('when all preferred exist in allTags returns preferred order', () => {
    const allTags = ['work', 'personal', 'read-later']
    const preferred = ['read-later', 'work']
    expect(intersectionTagOrder(allTags, preferred)).toEqual(['read-later', 'work'])
  })

  test('drops preferred tags not in allTags', () => {
    const allTags = ['work']
    const preferred = ['work', 'missing', 'work']
    expect(intersectionTagOrder(allTags, preferred)).toEqual(['work', 'work'])
  })

  test('returns preferred spellings with case-insensitive membership in allTags [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_TAGS_TREE]', () => {
    const allTags = ['extension', 'github', 'x']
    const preferredTags = ['Extension', 'github']
    expect(intersectionTagOrder(allTags, preferredTags)).toEqual(['Extension', 'github'])
  })
})

describe('getFilterStateForTagsTree [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_TAGS_TREE]', () => {
  test('when tagsInclude empty (tags from selection) forces empty domains and null time', () => {
    const panelConfig = {
      timeField: 'updated_at',
      timeStart: 1000,
      timeEnd: 2000,
      tagsInclude: new Set(),
      domains: new Set(['example.com'])
    }
    const selectedTagOrder = ['Extension', 'github']
    const state = getFilterStateForTagsTree(panelConfig, selectedTagOrder)
    expect(state.domains.size).toBe(0)
    expect(state.timeStart).toBeNull()
    expect(state.timeEnd).toBeNull()
    expect(state.tagsInclude).toEqual(new Set(['Extension', 'github']))
    expect(state.timeField).toBe('updated_at')
  })

  test('when tagsInclude has entries uses panelConfig domains and time', () => {
    const panelConfig = {
      timeField: 'time',
      timeStart: 1000,
      timeEnd: 2000,
      tagsInclude: new Set(['work']),
      domains: new Set(['example.com'])
    }
    const selectedTagOrder = ['other']
    const state = getFilterStateForTagsTree(panelConfig, selectedTagOrder)
    expect(state.domains).toEqual(new Set(['example.com']))
    expect(state.timeStart).toBe(1000)
    expect(state.timeEnd).toBe(2000)
    expect(state.tagsInclude).toEqual(new Set(['work']))
    expect(state.timeField).toBe('time')
  })

  test('handles null or undefined panelConfig with defaults', () => {
    const state = getFilterStateForTagsTree(null, ['a'])
    expect(state.timeField).toBe('updated_at')
    expect(state.timeStart).toBeNull()
    expect(state.timeEnd).toBeNull()
    expect(state.tagsInclude).toEqual(new Set(['a']))
    expect(state.domains.size).toBe(0)
  })

  test('handles null or undefined selectedTagOrder when tags from selection', () => {
    const panelConfig = { timeField: 'time', timeStart: null, timeEnd: null, tagsInclude: new Set(), domains: new Set(['x']) }
    const state = getFilterStateForTagsTree(panelConfig, null)
    expect(state.tagsInclude).toEqual(new Set())
    expect(state.domains.size).toBe(0)
  })
})
