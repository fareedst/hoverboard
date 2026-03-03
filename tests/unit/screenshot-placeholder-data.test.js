/**
 * [IMPL-SCREENSHOT_MODE] [REQ-LOCAL_BOOKMARKS_INDEX] Unit tests for screenshot placeholder data:
 * seed shape, Pinboard hero entry richness, storageIndex consistency, usage/edges seeds.
 */

import {
  localBookmarks,
  storageIndex,
  placeholderStorageSeed,
  placeholderSuggestedTags,
  placeholderRecentTags,
  screenshotPopupUrl,
  screenshotPopupTitle,
  getPlaceholderUsageSeed,
  getPlaceholderEdgesSeed,
  cleanUrl
} from '../../scripts/screenshot-placeholder-data.js'

const REQUIRED_BOOKMARK_KEYS = ['url', 'description', 'extended', 'tags', 'time', 'updated_at', 'shared', 'toread', 'hash']

describe('screenshot-placeholder-data [IMPL-SCREENSHOT_MODE] [REQ-LOCAL_BOOKMARKS_INDEX]', () => {
  describe('localBookmarks', () => {
    test('has at least 14 entries for robust index/tree screenshots', () => {
      const urls = Object.keys(localBookmarks)
      expect(urls.length).toBeGreaterThanOrEqual(14)
    })

    test('every entry has required bookmark shape', () => {
      for (const [url, b] of Object.entries(localBookmarks)) {
        for (const key of REQUIRED_BOOKMARK_KEYS) {
          expect(b).toHaveProperty(key)
        }
        expect(b.url).toBe(url)
        expect(Array.isArray(b.tags)).toBe(true)
      }
    })

    test('Pinboard entry is hero: 6+ tags and non-empty extended for This Page view', () => {
      const pinboard = localBookmarks[screenshotPopupUrl]
      expect(pinboard).toBeDefined()
      expect(pinboard.tags.length).toBeGreaterThanOrEqual(6)
      expect(typeof pinboard.extended).toBe('string')
      expect(pinboard.extended.length).toBeGreaterThan(0)
      expect(pinboard.toread).toBe('yes')
    })

    test('has mix of toread yes and no', () => {
      const withToread = Object.values(localBookmarks).filter(b => b.toread === 'yes')
      const withoutToread = Object.values(localBookmarks).filter(b => b.toread === 'no')
      expect(withToread.length).toBeGreaterThanOrEqual(1)
      expect(withoutToread.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('storageIndex', () => {
    test('has one entry per localBookmarks URL', () => {
      expect(Object.keys(storageIndex).sort()).toEqual(Object.keys(localBookmarks).sort())
    })

    test('every value is "local"', () => {
      for (const v of Object.values(storageIndex)) {
        expect(v).toBe('local')
      }
    })
  })

  describe('placeholderStorageSeed', () => {
    test('includes hoverboard_local_bookmarks, hoverboard_storage_index, hoverboard_theme', () => {
      expect(placeholderStorageSeed).toHaveProperty('hoverboard_local_bookmarks', localBookmarks)
      expect(placeholderStorageSeed).toHaveProperty('hoverboard_storage_index', storageIndex)
      expect(placeholderStorageSeed.hoverboard_theme).toBe('dark')
    })

    test('[IMPL-SCREENSHOT_MODE] [REQ-SUGGESTED_TAGS_FROM_CONTENT] includes hoverboard_demo_suggested_tags as array of strings for screenshot/demo', () => {
      expect(placeholderStorageSeed).toHaveProperty('hoverboard_demo_suggested_tags')
      const tags = placeholderStorageSeed.hoverboard_demo_suggested_tags
      expect(Array.isArray(tags)).toBe(true)
      expect(tags.length).toBeGreaterThan(0)
      tags.forEach((t) => expect(typeof t).toBe('string'))
      expect(placeholderStorageSeed.hoverboard_demo_suggested_tags).toEqual(placeholderSuggestedTags)
    })

    test('[IMPL-SCREENSHOT_MODE] [REQ-RECENT_TAGS_SYSTEM] includes hoverboard_demo_recent_tags as array of strings for screenshot/demo', () => {
      expect(placeholderStorageSeed).toHaveProperty('hoverboard_demo_recent_tags')
      const tags = placeholderStorageSeed.hoverboard_demo_recent_tags
      expect(Array.isArray(tags)).toBe(true)
      expect(tags.length).toBeGreaterThan(0)
      tags.forEach((t) => expect(typeof t).toBe('string'))
      expect(placeholderStorageSeed.hoverboard_demo_recent_tags).toEqual(placeholderRecentTags)
    })
  })

  describe('placeholderSuggestedTags', () => {
    test('is non-empty array of strings for demo Suggested Tags section', () => {
      expect(Array.isArray(placeholderSuggestedTags)).toBe(true)
      expect(placeholderSuggestedTags.length).toBeGreaterThan(0)
      placeholderSuggestedTags.forEach((t) => expect(typeof t).toBe('string'))
    })
  })

  describe('placeholderRecentTags', () => {
    test('[IMPL-SCREENSHOT_MODE] [REQ-RECENT_TAGS_SYSTEM] is non-empty array of strings for demo Recent Tags section', () => {
      expect(Array.isArray(placeholderRecentTags)).toBe(true)
      expect(placeholderRecentTags.length).toBeGreaterThan(0)
      placeholderRecentTags.forEach((t) => expect(typeof t).toBe('string'))
    })
  })

  describe('screenshotPopupUrl / screenshotPopupTitle', () => {
    test('point to Pinboard so popup/side-panel screenshot mode shows Pinboard bookmark', () => {
      expect(screenshotPopupUrl).toBe('https://pinboard.in')
      expect(screenshotPopupTitle).toMatch(/pinboard|bookmark/i)
      expect(localBookmarks[screenshotPopupUrl]).toBeDefined()
    })
  })

  describe('getPlaceholderUsageSeed', () => {
    test('returns hoverboard_bookmark_usage with expected shape per URL', () => {
      const base = Date.now()
      const out = getPlaceholderUsageSeed(base)
      expect(out).toHaveProperty('hoverboard_bookmark_usage')
      const usage = out.hoverboard_bookmark_usage
      for (const [url, u] of Object.entries(usage)) {
        expect(u).toHaveProperty('url', url)
        expect(u).toHaveProperty('visitCount')
        expect(u).toHaveProperty('lastVisitedAt')
        expect(u).toHaveProperty('firstVisitedAt')
        expect(u).toHaveProperty('recentVisits')
        expect(Array.isArray(u.recentVisits)).toBe(true)
      }
    })
  })

  describe('getPlaceholderEdgesSeed', () => {
    test('returns hoverboard_bookmark_nav_edges with edges array per target', () => {
      const base = Date.now()
      const out = getPlaceholderEdgesSeed(base)
      expect(out).toHaveProperty('hoverboard_bookmark_nav_edges')
      const edges = out.hoverboard_bookmark_nav_edges
      for (const arr of Object.values(edges)) {
        expect(Array.isArray(arr)).toBe(true)
        for (const e of arr) {
          expect(e).toHaveProperty('sourceUrl')
          expect(e).toHaveProperty('targetUrl')
          expect(e).toHaveProperty('count')
          expect(e).toHaveProperty('lastTraversedAt')
          expect(e).toHaveProperty('firstTraversedAt')
        }
      }
    })
  })

  describe('cleanUrl', () => {
    test('trims and strips trailing slashes', () => {
      expect(cleanUrl('  https://example.com/  ')).toBe('https://example.com')
      expect(cleanUrl('https://example.com///')).toBe('https://example.com')
    })
    test('returns empty string for empty input', () => {
      expect(cleanUrl('')).toBe('')
      expect(cleanUrl(null)).toBe('')
    })
  })
})
