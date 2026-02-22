/**
 * [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]
 * Unit tests verify buildTagToBookmarks and getAllTagsFromBookmarks implement the data shapes required by the side panel tag tree: tag → [{ title, url }] and sorted unique tag list.
 */

import { buildTagToBookmarks, getAllTagsFromBookmarks } from '../../src/ui/side-panel/tags-tree-data.js'

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
