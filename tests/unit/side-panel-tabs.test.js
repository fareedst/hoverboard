/**
 * [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [ARCH-SIDE_PANEL_TABS] [IMPL-SIDE_PANEL_TABS]
 * Unit tests: side panel tab state (storage key, tab ids, default tab, visibility).
 */

import {
  SIDE_PANEL_TAB_STORAGE_KEY,
  TAB_BOOKMARK,
  TAB_TAGS_TREE,
  TAB_IDS,
  getDefaultTab,
  getVisibilityForTab,
  getTagsTreeInitOptions,
  shouldRefreshBookmarkTabWhenSwitching,
  shouldRefreshBookmarkTabOnTabChange,
  shouldRefreshTagsTreeTabOnTabChange
} from '../../src/ui/side-panel/side-panel-tab-state.js'

describe('[IMPL-SIDE_PANEL_TABS] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] Side panel tab state', () => {
  test('storage key is defined and string', () => {
    expect(typeof SIDE_PANEL_TAB_STORAGE_KEY).toBe('string')
    expect(SIDE_PANEL_TAB_STORAGE_KEY).toBe('hoverboard_sidepanel_active_tab')
  })

  test('tab ids are bookmark and tagsTree', () => {
    expect(TAB_BOOKMARK).toBe('bookmark')
    expect(TAB_TAGS_TREE).toBe('tagsTree')
    expect(TAB_IDS).toEqual(['bookmark', 'tagsTree'])
  })

  test('getDefaultTab returns bookmark', () => {
    expect(getDefaultTab()).toBe('bookmark')
  })

  test('getVisibilityForTab(bookmark) shows only bookmark panel', () => {
    const v = getVisibilityForTab('bookmark')
    expect(v.bookmarkVisible).toBe(true)
    expect(v.tagsTreeVisible).toBe(false)
  })

  test('getVisibilityForTab(tagsTree) shows only tags tree panel', () => {
    const v = getVisibilityForTab('tagsTree')
    expect(v.bookmarkVisible).toBe(false)
    expect(v.tagsTreeVisible).toBe(true)
  })

  test('getVisibilityForTab unknown defaults to neither', () => {
    const v = getVisibilityForTab('other')
    expect(v.bookmarkVisible).toBe(false)
    expect(v.tagsTreeVisible).toBe(false)
  })

  describe('[REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_BOOKMARK] refresh when switching to Bookmark tab', () => {
    test('shouldRefreshBookmarkTabWhenSwitching(true) when tab is Bookmark and already inited', () => {
      expect(shouldRefreshBookmarkTabWhenSwitching(TAB_BOOKMARK, true)).toBe(true)
    })
    test('shouldRefreshBookmarkTabWhenSwitching(false) when Bookmark tab but not yet inited', () => {
      expect(shouldRefreshBookmarkTabWhenSwitching(TAB_BOOKMARK, false)).toBe(false)
    })
    test('shouldRefreshBookmarkTabWhenSwitching(false) when switching to Tags tree', () => {
      expect(shouldRefreshBookmarkTabWhenSwitching(TAB_TAGS_TREE, true)).toBe(false)
      expect(shouldRefreshBookmarkTabWhenSwitching(TAB_TAGS_TREE, false)).toBe(false)
    })
  })

  describe('[REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_BOOKMARK] refresh on tab change (prompt like badge)', () => {
    test('shouldRefreshBookmarkTabOnTabChange(true) when Bookmark tab visible and has controller', () => {
      expect(shouldRefreshBookmarkTabOnTabChange(TAB_BOOKMARK, true)).toBe(true)
    })
    test('shouldRefreshBookmarkTabOnTabChange(false) when Bookmark tab visible but no controller', () => {
      expect(shouldRefreshBookmarkTabOnTabChange(TAB_BOOKMARK, false)).toBe(false)
    })
    test('shouldRefreshBookmarkTabOnTabChange(false) when Tags tree tab visible', () => {
      expect(shouldRefreshBookmarkTabOnTabChange(TAB_TAGS_TREE, true)).toBe(false)
      expect(shouldRefreshBookmarkTabOnTabChange(TAB_TAGS_TREE, false)).toBe(false)
    })
  })

  describe('[REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_TABS] [IMPL-SIDE_PANEL_TAGS_TREE] refresh Tags tree on tab change', () => {
    test('shouldRefreshTagsTreeTabOnTabChange(true) when Tags tree tab visible and inited', () => {
      expect(shouldRefreshTagsTreeTabOnTabChange(TAB_TAGS_TREE, true)).toBe(true)
    })
    test('shouldRefreshTagsTreeTabOnTabChange(false) when Tags tree tab visible but not yet inited', () => {
      expect(shouldRefreshTagsTreeTabOnTabChange(TAB_TAGS_TREE, false)).toBe(false)
    })
    test('shouldRefreshTagsTreeTabOnTabChange(false) when Bookmark tab visible', () => {
      expect(shouldRefreshTagsTreeTabOnTabChange(TAB_BOOKMARK, true)).toBe(false)
      expect(shouldRefreshTagsTreeTabOnTabChange(TAB_BOOKMARK, false)).toBe(false)
    })
  })

  // [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_TABS] [IMPL-SIDE_PANEL_TAGS_TREE]
  // getTagsTreeInitOptions: returns { currentBookmarkTags } for initTagsTreeTab so Tags tree on open displays current URL's record.
  describe('[REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_TABS] [IMPL-SIDE_PANEL_TAGS_TREE] getTagsTreeInitOptions', () => {
    test('getTagsTreeInitOptions(null) returns empty currentBookmarkTags', () => {
      expect(getTagsTreeInitOptions(null)).toEqual({ currentBookmarkTags: [] })
    })
    test('getTagsTreeInitOptions(undefined) returns empty currentBookmarkTags', () => {
      expect(getTagsTreeInitOptions(undefined)).toEqual({ currentBookmarkTags: [] })
    })
    test('getTagsTreeInitOptions(controller with currentPin.tags) returns normalized tags', () => {
      const controller = {
        currentPin: { tags: 'a,b' },
        normalizeTags: (t) => (t ? t.split(',').map((s) => s.trim()) : [])
      }
      expect(getTagsTreeInitOptions(controller)).toEqual({ currentBookmarkTags: ['a', 'b'] })
    })
    test('getTagsTreeInitOptions(controller with tags "work, personal") returns [work, personal]', () => {
      const controller = {
        currentPin: { tags: 'work, personal' },
        normalizeTags: (t) => (t ? t.split(',').map((s) => s.trim()) : [])
      }
      expect(getTagsTreeInitOptions(controller)).toEqual({ currentBookmarkTags: ['work', 'personal'] })
    })
  })
})
