/**
 * === IMPL-FULL-BLOCK: IMPL-SCREENSHOT_MODE ===
 * [IMPL-SCREENSHOT_MODE] [REQ-LOCAL_BOOKMARKS_INDEX] — Placeholder screenshot flow: seed storage, fake tab params, data-screenshot-ready, handleGetCurrentBookmark prefers data.url. Contract: URL params and seed; placeholder UI and script capture.
 *
 * ## MAIN
 *
 * - [IMPL-SCREENSHOT_MODE] [REQ-LOCAL_BOOKMARKS_INDEX] How: Rich placeholder data: 15+ bookmarks so index and By Tag tree look robust; hero Pinboard entry with 6+ tags and non-empty extended for This Page view. Side panel: open with ?screenshot=1&url=screenshotPopupUrl&title=screenshotPopupTitle so Bookmark tab shows Pinboard bookmark (same doc, PopupController reads window.location.search).
 * - Contract:
 *   - INPUT: ?screenshot=1&url=...&title=... (popup/side panel); seed JSON (local bookmarks, storage index, theme); optional --seed=path
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: popup/index/side panel rendered with placeholder data; data-screenshot-ready attribute; script can capture screenshot
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: PopupController._screenshotMode; handleGetCurrentBookmark prefers data.url when http(s); placeholderStorageSeed
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: MAIN
 *   - 1. localBookmarks: BUILD object keyed by URL; Pinboard entry HAS tags.length >= 6, extended non-empty, toread 'yes'; total entries >= 15; mix of toread yes/no; storageIndex one key per localBookmarks URL, value 'local'
 *   - How (sub-block): Await seed; open popup/index; wait for ready; check store-local for index; capture.
 *   - 2. Script: SEED chrome.storage.local/sync (await set); optional LOAD seed from file; OPEN popup or index; WAIT for [data-screenshot-ready="true"]; CHECK #store-local for index; CAPTURE screenshot
 *   - How (sub-block): Use URL params as fake tab; set data-screenshot-ready in finally.
 *   - 3. Popup load: IF screenshot=1 and url param: USE param as fake tab url/title; SKIP getCurrentTab; IN finally SET data-screenshot-ready on #mainInterface
 *   - How (sub-block): Prefer data.url as targetUrl when http(s) so popup-as-tab gets correct bookmark.
 *   - 4. handleGetCurrentBookmark: IF data.url present and http(s): USE as targetUrl so popup-as-tab gets bookmark for screenshot URL
 *   - 5. Side panel URL: GOTO side-panel.html?screenshot=1&url=encode(screenshotPopupUrl)&title=encode(screenshotPopupTitle); SET viewport width 360 (or 240); WAIT for tab content; CAPTURE screenshot (This Page, then By Tag, Tabs, etc.); output side-panel-bookmark.png, side-panel-tags-tree.png, side-panel-tabs.png
 *   - 6. record-demo-side-panel-this-page: SEED chrome.storage.local with placeholderStorageSeed via options page; GOTO side-panel.html?screenshot=1&url=...&title=...; record frames; assemble GIF
 *
 * ## SCREENSHOT_THEME_CONTRACT
 *
 * - [IMPL-SCREENSHOT_MODE] [IMPL-POPUP_THEME_CSS] [ARCH-THEME] [REQ-DARK_THEME] How: Connects screenshot seed theme selection to the popup stylesheet contract before browser capture.
 * - Contract:
 *   - INPUT: screenshot seed, selected theme, popup stylesheet
 *   - PRE: screenshot seed and popup stylesheet are readable
 *   - OUTPUT: screenshot capture configuration with a supported theme
 *   - POST:
 *     - success => selected/default theme has a matching popup CSS rule
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: SCREENSHOT_THEME_CONTRACT
 *   - Read selected/default theme from screenshot seed
 *   - Read theme selectors from popup stylesheet
 *   - ASSERT selected/default theme is supported
 *
 * === END IMPL-FULL-BLOCK: IMPL-SCREENSHOT_MODE ===
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
