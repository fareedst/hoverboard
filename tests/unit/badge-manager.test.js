/**
 * [IMPL-BOOKMARK_STATE_SYNC] [IMPL-URL_TAGS_DISPLAY] [REQ-BADGE_INDICATORS] BadgeManager unit tests.
 * Tests calculateBadgeData and icon paths; updateBadge/clearBadge require chrome.action mocks.
 */

import { BadgeManager } from '../../src/core/badge-manager.js'

beforeEach(() => {
  global.chrome.runtime.getURL.mockImplementation((path) => `chrome-extension://test-id/${path}`)
})

describe('[IMPL-BOOKMARK_STATE_SYNC] [IMPL-URL_TAGS_DISPLAY] BadgeManager', () => {
  test('constructor sets iconPaths with getURL for default and bookmarked', () => {
    const manager = new BadgeManager()
    expect(manager.iconPaths.default[16]).toContain('hoverboard_16.png')
    expect(manager.iconPaths.bookmarked[19]).toContain('hoverboard_19b.png')
  })

  test('calculateBadgeData returns text, backgroundColor, iconPath, title from getBadgeDisplayValue', () => {
    const manager = new BadgeManager()
    const config = {
      badgeTextIfNotBookmarked: '-',
      badgeTextIfPrivate: '*',
      badgeTextIfQueued: '!',
      badgeTextIfBookmarkedNoTags: '0'
    }
    const noBookmark = null
    const dataNoBookmark = manager.calculateBadgeData(noBookmark, config)
    expect(dataNoBookmark).toHaveProperty('text')
    expect(dataNoBookmark).toHaveProperty('backgroundColor')
    expect(dataNoBookmark).toHaveProperty('iconPath')
    expect(dataNoBookmark).toHaveProperty('title')
    expect(dataNoBookmark.backgroundColor).toBe('#222')
    expect(dataNoBookmark.iconPath).toBe(manager.iconPaths.default)

    const withBookmark = { url: 'https://example.com', tags: ['a'], description: 'x', hash: 'abc' }
    const dataBookmark = manager.calculateBadgeData(withBookmark, config)
    expect(dataBookmark.backgroundColor).toBe('#000')
    expect(dataBookmark.iconPath).toBe(manager.iconPaths.bookmarked)
  })

  test('generateTitle returns title from getBadgeDisplayValue', () => {
    const manager = new BadgeManager()
    const title = manager.generateTitle({ url: 'https://x.com', tags: [] }, true)
    expect(typeof title).toBe('string')
    expect(title.length).toBeGreaterThanOrEqual(0)
  })
})
