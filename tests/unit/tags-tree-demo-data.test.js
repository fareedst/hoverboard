/**
 * [IMPL-SIDE_PANEL_TAGS_TREE] [PROC-DEMO_RECORDING] [REQ-SIDE_PANEL_TAGS_TREE]
 * Unit tests for tags-tree placeholder bookmarks: shape, minimum size, tag count, time/extended for demo GIF.
 */

import { tagsTreePlaceholderBookmarks } from '../../src/ui/side-panel/tags-tree-demo-data.js'
import { getAllTagsFromBookmarks } from '../../src/ui/side-panel/tags-tree-data.js'

describe('tags-tree-demo-data [IMPL-SIDE_PANEL_TAGS_TREE] [PROC-DEMO_RECORDING] [REQ-SIDE_PANEL_TAGS_TREE]', () => {
  describe('tagsTreePlaceholderBookmarks', () => {
    test('has at least 20 bookmarks for robust By Tag demo GIF', () => {
      expect(Array.isArray(tagsTreePlaceholderBookmarks)).toBe(true)
      expect(tagsTreePlaceholderBookmarks.length).toBeGreaterThanOrEqual(20)
    })

    test('has at least 12 unique tags for tag selector and tree demo', () => {
      const allTags = getAllTagsFromBookmarks(tagsTreePlaceholderBookmarks)
      expect(allTags.length).toBeGreaterThanOrEqual(12)
    })

    test('every entry has url, description, tags (array); optional time, updated_at, extended', () => {
      for (const b of tagsTreePlaceholderBookmarks) {
        expect(b).toHaveProperty('url')
        expect(typeof b.url).toBe('string')
        expect(b.url.length).toBeGreaterThan(0)
        expect(b).toHaveProperty('description')
        expect(b).toHaveProperty('tags')
        expect(Array.isArray(b.tags)).toBe(true)
        if (b.time != null) expect(typeof b.time).toBe('string')
        if (b.updated_at != null) expect(typeof b.updated_at).toBe('string')
        if (b.extended != null) expect(typeof b.extended).toBe('string')
      }
    })

    test('at least one bookmark has non-empty extended for search demo', () => {
      const withExtended = tagsTreePlaceholderBookmarks.filter(b => (b.extended ?? '').trim().length > 0)
      expect(withExtended.length).toBeGreaterThanOrEqual(1)
    })

    test('at least one bookmark has time and updated_at for time filter/group demo', () => {
      const withTime = tagsTreePlaceholderBookmarks.filter(b => b.time != null && b.updated_at != null)
      expect(withTime.length).toBeGreaterThanOrEqual(1)
    })

    test('multiple bookmarks share tags so tree shows multiple URLs per tag', () => {
      const tagCounts = new Map()
      for (const b of tagsTreePlaceholderBookmarks) {
        for (const t of (b.tags || [])) {
          tagCounts.set(t, (tagCounts.get(t) || 0) + 1)
        }
      }
      const tagsWithMultiple = [...tagCounts.entries()].filter(([, count]) => count >= 2)
      expect(tagsWithMultiple.length).toBeGreaterThanOrEqual(1)
    })
  })
})
