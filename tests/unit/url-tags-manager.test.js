/**
 * Unit tests for URL Tags Manager - [IMPL-URL_TAGS_DISPLAY] [ARCH-URL_TAGS_DISPLAY]
 * [REQ-BADGE_INDICATORS] Single source for tags and badge value.
 */

import {
  normalizeBookmarkForDisplay,
  getBookmarkForDisplay,
  getTagsForUrl,
  getBadgeDisplayValue
} from '../../src/features/storage/url-tags-manager.js'

describe('url-tags-manager [IMPL-URL_TAGS_DISPLAY] [REQ-BADGE_INDICATORS]', () => {
  describe('normalizeBookmarkForDisplay', () => {
    test('returns default shape for null/undefined', () => {
      expect(normalizeBookmarkForDisplay(null)).toMatchObject({
        url: '',
        tags: [],
        shared: 'yes',
        toread: 'no'
      })
      expect(normalizeBookmarkForDisplay(undefined)).toMatchObject({ tags: [] })
    })

    test('converts tags string to array', () => {
      const out = normalizeBookmarkForDisplay({
        url: 'https://a.com',
        tags: 'foo bar baz',
        hash: 'x'
      })
      expect(out.tags).toEqual(['foo', 'bar', 'baz'])
      expect(Array.isArray(out.tags)).toBe(true)
    })

    test('keeps tags array and filters empty', () => {
      const out = normalizeBookmarkForDisplay({
        url: 'https://a.com',
        tags: ['a', '', 'b', '  ', 'c'],
        hash: 'x'
      })
      expect(out.tags).toEqual(['a', 'b', 'c'])
    })

    test('defaults missing tags to empty array', () => {
      const out = normalizeBookmarkForDisplay({ url: 'https://a.com', hash: 'h' })
      expect(out.tags).toEqual([])
    })

    test('preserves url, description, time, shared, toread, hash', () => {
      const b = {
        url: 'https://example.com',
        description: 'Desc',
        extended: 'ext',
        tags: ['t1'],
        time: '2026-02-14T00:00:00Z',
        shared: 'no',
        toread: 'yes',
        hash: 'abc'
      }
      const out = normalizeBookmarkForDisplay(b)
      expect(out.url).toBe('https://example.com')
      expect(out.description).toBe('Desc')
      expect(out.extended).toBe('ext')
      expect(out.tags).toEqual(['t1'])
      expect(out.time).toBe('2026-02-14T00:00:00Z')
      expect(out.shared).toBe('no')
      expect(out.toread).toBe('yes')
      expect(out.hash).toBe('abc')
    })
  })

  describe('getBookmarkForDisplay', () => {
    test('returns normalized empty bookmark when provider missing getBookmarkForUrl', async () => {
      const out = await getBookmarkForDisplay({}, 'https://a.com')
      expect(out).toMatchObject({ url: '', tags: [] })
      expect(Array.isArray(out.tags)).toBe(true)
    })

    test('calls provider.getBookmarkForUrl and normalizes result', async () => {
      const provider = {
        getBookmarkForUrl: jest.fn().mockResolvedValue({
          url: 'https://b.com',
          tags: 'x y',
          hash: 'h'
        })
      }
      const out = await getBookmarkForDisplay(provider, 'https://b.com', 'Title')
      expect(provider.getBookmarkForUrl).toHaveBeenCalledWith('https://b.com', 'Title')
      expect(out.tags).toEqual(['x', 'y'])
    })
  })

  describe('getTagsForUrl', () => {
    test('returns tags array from getBookmarkForDisplay', async () => {
      const provider = {
        getBookmarkForUrl: jest.fn().mockResolvedValue({
          url: 'https://c.com',
          tags: ['a', 'b'],
          hash: 'h'
        })
      }
      const tags = await getTagsForUrl(provider, 'https://c.com')
      expect(tags).toEqual(['a', 'b'])
    })

    // [REQ-URL_TAGS_DISPLAY] Single-source contract: empty or null bookmark yields empty tags array
    test('returns empty array when provider returns null or bookmark with no tags [REQ-URL_TAGS_DISPLAY]', async () => {
      const providerNull = { getBookmarkForUrl: jest.fn().mockResolvedValue(null) }
      expect(await getTagsForUrl(providerNull, 'https://empty.com')).toEqual([])

      const providerNoTags = {
        getBookmarkForUrl: jest.fn().mockResolvedValue({ url: 'https://x.com', hash: 'h', tags: [] })
      }
      expect(await getTagsForUrl(providerNoTags, 'https://x.com')).toEqual([])
    })
  })

  describe('getBadgeDisplayValue', () => {
    test('not bookmarked: text is config badgeTextIfNotBookmarked', () => {
      const v = getBadgeDisplayValue(
        { url: 'https://a.com', hash: '', tags: [] },
        { badgeTextIfNotBookmarked: '-' }
      )
      expect(v.text).toBe('-')
      expect(v.tagCount).toBe(0)
      expect(v.isBookmarked).toBe(false)
    })

    test('bookmarked with tags: text includes tag count', () => {
      const v = getBadgeDisplayValue(
        { url: 'https://a.com', hash: 'x', tags: ['a', 'b', 'c'] },
        {}
      )
      expect(v.text).toBe('3')
      expect(v.tagCount).toBe(3)
      expect(v.isBookmarked).toBe(true)
    })

    test('bookmarked private: text has prefix', () => {
      const v = getBadgeDisplayValue(
        { url: 'https://a.com', hash: 'x', tags: ['t'], shared: 'no' },
        { badgeTextIfPrivate: '*' }
      )
      expect(v.text).toBe('*1')
    })

    test('bookmarked toread: text has suffix', () => {
      const v = getBadgeDisplayValue(
        { url: 'https://a.com', hash: 'x', tags: ['t'], toread: 'yes' },
        { badgeTextIfQueued: '!' }
      )
      expect(v.text).toBe('1!')
    })

    test('title includes tags when present', () => {
      const v = getBadgeDisplayValue(
        { url: 'https://a.com', hash: 'x', description: 'D', tags: ['t1', 't2'], shared: 'no' },
        {}
      )
      expect(v.title).toContain('Tags: t1, t2')
      expect(v.title).toContain('(Private)')
    })
  })
})
