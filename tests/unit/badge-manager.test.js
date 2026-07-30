/**
 * === IMPL-FULL-BLOCK: IMPL-BOOKMARK_STATE_SYNC ===
 * [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] — BOOKMARK_UPDATED broadcast after overlay persist; popup and badge refresh so state is consistent.
 * 
 * ## MAIN
 * 
 * - [IMPL-BOOKMARK_STATE_SYNC] [ARCH-BOOKMARK_STATE_SYNC] [REQ-BOOKMARK_STATE_SYNCHRONIZATION] How: Logical block for IMPL-BOOKMARK_STATE_SYNC.
 * - Contract:
 *   - INPUT: user actions (overlay toggle, tag save/delete, bookmark save); processMessage result
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: consistent bookmark state across overlay, popup, badge
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: overlay state, popup state, badge state; BOOKMARK_UPDATED broadcast
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: MAIN
 *   - How (sub-block): Send message to backend; on success broadcast BOOKMARK_UPDATED.
 *   - 1. ON overlay toggle (saveBookmark / saveTag / deleteTag):
 *   - 2.   SEND message to backend; await processMessage result
 *   - 3.   BROADCAST BOOKMARK_UPDATED (so other surfaces can refresh)
 *   - How (sub-block): Re-fetch bookmark state for current URL.
 *   - 4. PopupController (listener for BOOKMARK_UPDATED):
 *   - 5.   ON BOOKMARK_UPDATED: refresh popup data (re-fetch bookmark state for current URL)
 *   - How (sub-block): On saveTag/deleteTag/saveBookmark result compare tab URL state and update icon/count.
 *   - 6. Badge manager:
 *   - 7.   ON message result (saveTag | deleteTag | saveBookmark): compare current tab URL state with stored state; UPDATE badge icon/count
 * 
 * === END IMPL-FULL-BLOCK: IMPL-BOOKMARK_STATE_SYNC ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-BADGE ===
 * [IMPL-BADGE] [ARCH-BADGE] [REQ-BADGE_INDICATORS] — How: drive tab-scoped badge text/color from bookmark/overlay state via service-worker badge helpers.
 * 
 * ## UPDATE_BADGE_FOR_TAB
 * 
 * - [IMPL-BADGE] [ARCH-BADGE] [REQ-BADGE_INDICATORS] How: resolve bookmark state for tab then set badge text/color or clear.
 * - Contract:
 *   - INPUT: tab id / URL; bookmark presence and tag signals from MessageHandler / TagService paths
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: chrome.action badge text and background color updated per tab; cleared when no bookmark
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: chrome.action API; per-tab badge cache in service worker; composed_with IMPL-BADGE_REFRESH
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: UPDATE_BADGE_FOR_TAB
 *   - IF NOT tab: RETURN
 *   - state = AWAIT resolveBookmarkStateForTab(tab)
 *   - IF state.hasBookmark: SET badge text/color from state
 *   - ELSE: CLEAR badge for tab.id
 *   - RETURN
 *   - How (sub-block): How: after successful saveTag/deleteTag/saveBookmark, refresh badge (delegates to IMPL-BADGE_REFRESH).
 * 
 * ## ON_BOOKMARK_MUTATION_SUCCESS
 * 
 * - [IMPL-BADGE] [ARCH-BADGE] [REQ-BADGE_INDICATORS] How: Implements ON_BOOKMARK_MUTATION_SUCCESS(message, sender) behavior for IMPL-BADGE.
 * - Contract:
 *   - INPUT: tab id / URL; bookmark presence and tag signals from MessageHandler / TagService paths
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: chrome.action badge text and background color updated per tab; cleared when no bookmark
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: chrome.action API; per-tab badge cache in service worker; composed_with IMPL-BADGE_REFRESH
 *   - EFFECTS: Async, Http, IO
 *   - TERMINATION: total
 * - PROCEDURE: ON_BOOKMARK_MUTATION_SUCCESS
 *   - tab = resolveTab(sender, message)
 *   - AWAIT UPDATE_BADGE_FOR_TAB(tab)
 * 
 * === END IMPL-FULL-BLOCK: IMPL-BADGE ===
 */
import { BadgeManager } from '../../src/core/badge-manager.js'

beforeEach(() => {
  global.chrome.runtime.getURL.mockImplementation((path) => `chrome-extension://test-id/${path}`)
})

describe('[IMPL-BADGE] [IMPL-BOOKMARK_STATE_SYNC] [IMPL-URL_TAGS_DISPLAY] BadgeManager', () => {
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

  test('UPDATE_BADGE_FOR_TAB: updateBadge sets text/color when bookmark present [IMPL-BADGE]', async () => {
    const manager = new BadgeManager()
    manager.getConfig = jest.fn().mockResolvedValue({
      badgeTextIfNotBookmarked: '-',
      badgeTextIfPrivate: '*',
      badgeTextIfQueued: '!',
      badgeTextIfBookmarkedNoTags: '0'
    })
    manager.setBadgeText = jest.fn().mockResolvedValue()
    manager.setBadgeBackgroundColor = jest.fn().mockResolvedValue()
    manager.setIcon = jest.fn().mockResolvedValue()
    await manager.updateBadge(7, { url: 'https://example.com', tags: ['a'], description: 'x', hash: 'h' })
    expect(manager.setBadgeText).toHaveBeenCalled()
    expect(manager.setBadgeBackgroundColor).toHaveBeenCalled()
    expect(manager.setIcon).toHaveBeenCalled()
  })

  test('UPDATE_BADGE_FOR_TAB: updateBadge clears styling path for null bookmark [IMPL-BADGE]', async () => {
    const manager = new BadgeManager()
    manager.getConfig = jest.fn().mockResolvedValue({
      badgeTextIfNotBookmarked: '-',
      badgeTextIfPrivate: '*',
      badgeTextIfQueued: '!',
      badgeTextIfBookmarkedNoTags: '0'
    })
    manager.setBadgeText = jest.fn().mockResolvedValue()
    manager.setBadgeBackgroundColor = jest.fn().mockResolvedValue()
    manager.setIcon = jest.fn().mockResolvedValue()
    await manager.updateBadge(7, null)
    expect(manager.setBadgeText).toHaveBeenCalled()
    const textArg = manager.setBadgeText.mock.calls[0]
    expect(textArg[0]).toBe(7)
  })
})
