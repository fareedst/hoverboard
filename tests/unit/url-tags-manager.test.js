/**
 * Unit tests for URL Tags Manager - [IMPL-URL_TAGS_DISPLAY] [ARCH-URL_TAGS_DISPLAY]
 * [REQ-BADGE_INDICATORS] Single source for tags and badge value.
 */

/**
 * === IMPL-FULL-BLOCK: IMPL-BOOKMARK_CREATE_UPDATE_TIMES ===
 * [IMPL-BOOKMARK_CREATE_UPDATE_TIMES] [ARCH-BOOKMARK_CREATE_UPDATE_TIMES] [REQ-BOOKMARK_CREATE_UPDATE_TIMES] — Every bookmark has time (create) and updated_at (last update); provider-specific set/normalize; export/import include.
 *
 * ## PINBOARD
 *
 * - [IMPL-BOOKMARK_CREATE_UPDATE_TIMES] [ARCH-BOOKMARK_CREATE_UPDATE_TIMES] [REQ-BOOKMARK_CREATE_UPDATE_TIMES] — import create preserves CSV/JSON Time and Updated. How: Implements Pinboard behavior for IMPL-BOOKMARK_CREATE_UPDATE_TIMES.
 * - Contract:
 *   - INPUT: bookmark data (for save), API response (for Pinboard), raw record (for normalize)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark with time and updated_at set per provider and context
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: time = create time; updated_at = last update time
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: PINBOARD
 *   - parseBookmarkResponse / createEmptyBookmark: SET updated_at = time (API has no updated_at)
 *   - SEND to API: do NOT include updated_at
 *   - How (sub-block): If missing updated_at set to time (legacy); include updated_at in payload/CSV/JSON.
 *   - 1. Normalize (url-tags-manager, display, move, export/import):
 *   - IF bookmark has no updated_at: SET updated_at = time   // legacy
 *   - ELSE: keep updated_at
 *   - Include updated_at in payload/CSV/JSON
 *
 * ## ROUTER_STORAGE_BOOKMARK_TIMES
 *
 * - [IMPL-BOOKMARK_CREATE_UPDATE_TIMES] [IMPL-BOOKMARK_ROUTER] [IMPL-STORAGE_INDEX] [ARCH-BOOKMARK_CREATE_UPDATE_TIMES] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-BOOKMARK_CREATE_UPDATE_TIMES] [REQ-RELIABILITY] How: Preserves bookmark time fields while router storage operations select a provider and update the storage index.
 * - Contract:
 *   - INPUT: bookmark data, preferred backend, storage providers, storage index
 *   - PRE: bookmark URL and provider map are available
 *   - OUTPUT: provider result with normalized time fields and updated storage index
 *   - POST:
 *     - success => saved bookmark retains time and updated_at; index points to the selected backend
 *   - FAILURE_MODES: ProviderSaveFailed
 *   - DATA: bookmark time fields and storage-index backend mapping
 *   - DATA_TRANSITION: successful save updates the selected URL mapping; failed save leaves the mapping unchanged
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: ROUTER_STORAGE_BOOKMARK_TIMES
 *   - Normalize missing updated_at from time
 *   - Resolve provider from preferred backend
 *   - AWAIT provider save
 *   - IF save succeeds: update storage index for the URL
 *   - RETURN provider result
 *
 * === END IMPL-FULL-BLOCK: IMPL-BOOKMARK_CREATE_UPDATE_TIMES ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-URL_TAGS_DISPLAY ===
 * [IMPL-URL_TAGS_DISPLAY] [ARCH-URL_TAGS_DISPLAY] [REQ-URL_TAGS_DISPLAY] [REQ-BADGE_INDICATORS] [REQ-PER_BOOKMARK_STORAGE_BACKEND] — normalizeBookmarkForDisplay, getBookmarkForDisplay, getTagsForUrl, getBadgeDisplayValue; handler and popup use router and re-fetch. Contract: bookmark or provider+url; normalized bookmark, tags, or badge value.
 * 
 * ## NORMALIZE_BOOKMARK_FOR_DISPLAY
 * 
 * - [IMPL-URL_TAGS_DISPLAY] [ARCH-URL_TAGS_DISPLAY] [REQ-URL_TAGS_DISPLAY] [REQ-BADGE_INDICATORS] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Implements normalizeBookmarkForDisplay(bookmark) behavior for IMPL-URL_TAGS_DISPLAY.
 * - Contract:
 *   - INPUT: bookmark (raw from provider), provider + url + title (for getBookmarkForDisplay), provider + url (for getTagsForUrl)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: normalized bookmark (tags array), tags array, badge display value (text, tagCount, flags)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: single module url-tags-manager; used by message-handler, service-worker, badge-manager, popup, bookmark-router
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: NORMALIZE_BOOKMARK_FOR_DISPLAY
 *   - IF bookmark null: RETURN null or empty shape
 *   - tags = bookmark.tags IF array ELSE (bookmark.tags split by spaces or [])
 *   - RETURN { ...bookmark, tags, ...requiredDefaults }
 *   - How (sub-block): Get raw from provider and normalize; caller sets needsAuth.
 * 
 * ## GET_BOOKMARK_FOR_DISPLAY
 * 
 * - [IMPL-URL_TAGS_DISPLAY] [ARCH-URL_TAGS_DISPLAY] [REQ-URL_TAGS_DISPLAY] [REQ-BADGE_INDICATORS] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Implements getBookmarkForDisplay(provider, url, title) behavior for IMPL-URL_TAGS_DISPLAY.
 * - Contract:
 *   - INPUT: bookmark (raw from provider), provider + url + title (for getBookmarkForDisplay), provider + url (for getTagsForUrl)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: normalized bookmark (tags array), tags array, badge display value (text, tagCount, flags)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: single module url-tags-manager; used by message-handler, service-worker, badge-manager, popup, bookmark-router
 *   - EFFECTS: Async
 *   - TERMINATION: total
 * - PROCEDURE: GET_BOOKMARK_FOR_DISPLAY
 *   - raw = AWAIT provider.getBookmarkForUrl(url)
 *   - RETURN normalizeBookmarkForDisplay(raw); caller sets needsAuth when !hasAuth
 *   - How (sub-block): Get bookmark for url and return tags array.
 * 
 * ## GET_TAGS_FOR_URL
 * 
 * - [IMPL-URL_TAGS_DISPLAY] [ARCH-URL_TAGS_DISPLAY] [REQ-URL_TAGS_DISPLAY] [REQ-BADGE_INDICATORS] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Implements getTagsForUrl(provider, url) behavior for IMPL-URL_TAGS_DISPLAY.
 * - Contract:
 *   - INPUT: bookmark (raw from provider), provider + url + title (for getBookmarkForDisplay), provider + url (for getTagsForUrl)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: normalized bookmark (tags array), tags array, badge display value (text, tagCount, flags)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: single module url-tags-manager; used by message-handler, service-worker, badge-manager, popup, bookmark-router
 *   - EFFECTS: Async
 *   - TERMINATION: total
 * - PROCEDURE: GET_TAGS_FOR_URL
 *   - bookmark = AWAIT getBookmarkForDisplay(provider, url, null)
 *   - RETURN bookmark?.tags ?? []
 *   - How (sub-block): Normalize and return text, tagCount, isPrivate, isToRead, isBookmarked, title.
 * 
 * ## GET_BADGE_DISPLAY_VALUE
 * 
 * - [IMPL-URL_TAGS_DISPLAY] [ARCH-URL_TAGS_DISPLAY] [REQ-URL_TAGS_DISPLAY] [REQ-BADGE_INDICATORS] [REQ-PER_BOOKMARK_STORAGE_BACKEND] How: Implements getBadgeDisplayValue(bookmark, config) behavior for IMPL-URL_TAGS_DISPLAY.
 * - Contract:
 *   - INPUT: bookmark (raw from provider), provider + url + title (for getBookmarkForDisplay), provider + url (for getTagsForUrl)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: normalized bookmark (tags array), tags array, badge display value (text, tagCount, flags)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: single module url-tags-manager; used by message-handler, service-worker, badge-manager, popup, bookmark-router
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Http, State
 *   - TERMINATION: total
 * - PROCEDURE: GET_BADGE_DISPLAY_VALUE
 *   - normalized = normalizeBookmarkForDisplay(bookmark)
 *   - RETURN { text, tagCount, isPrivate, isToRead, isBookmarked, title }
 *   - How (sub-block): Handler and popup and router usage (same IMPL set).
 *   - 1. Message handler: handleGetCurrentBookmark always via getBookmarkForDisplay(router)
 *   - 2. Message handler: handleGetTagsForUrl returns getTagsForUrl
 *   - 3. Popup: getBookmarkData null only when blocked; re-fetch tags before add/remove
 *   - 4. Router: _hasTags/_isEmptyBookmark use normalizeBookmarkForDisplay
 * 
 * === END IMPL-FULL-BLOCK: IMPL-URL_TAGS_DISPLAY ===
 */
import {
  normalizeBookmarkForDisplay,
  getBookmarkForDisplay,
  getTagsForUrl,
  getBadgeDisplayValue
} from '../../src/features/storage/url-tags-manager.js'

describe('url-tags-manager [IMPL-URL_TAGS_DISPLAY] [REQ-BADGE_INDICATORS]', () => {
  describe('normalizeBookmarkForDisplay', () => {
    test('returns default shape for null/undefined [IMPL-BOOKMARK_CREATE_UPDATE_TIMES]', () => {
      expect(normalizeBookmarkForDisplay(null)).toMatchObject({
        url: '',
        tags: [],
        time: '',
        updated_at: '',
        shared: 'yes',
        toread: 'no'
      })
      expect(normalizeBookmarkForDisplay(undefined)).toMatchObject({ tags: [], updated_at: '' })
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
      expect(out.updated_at).toBe('2026-02-14T00:00:00Z')
    })

    test('bookmark without updated_at gets updated_at = time [REQ-BOOKMARK_CREATE_UPDATE_TIMES]', () => {
      const b = { url: 'https://x.com', time: '2026-02-14T12:00:00.000Z', tags: [] }
      const out = normalizeBookmarkForDisplay(b)
      expect(out.time).toBe('2026-02-14T12:00:00.000Z')
      expect(out.updated_at).toBe('2026-02-14T12:00:00.000Z')
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
