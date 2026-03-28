/**
 * [IMPL-SIDE_PANEL_TABS] [ARCH-SIDE_PANEL_TABS] [ARCH-TAG_SYSTEM] [REQ-RECENT_TAGS_SYSTEM] [IMPL-RECENT_TAGS_POPUP_REFRESH]
 * Phase G composition: chrome.windows.onFocusChanged → getCurrent (window id match) → shouldInvokeLoadRecentTagsOnWindowFocusSync
 * → PopupController.loadRecentTags. No Playwright / no side-panel.html UI invocation.
 */

import {
  bindWindowFocusRecentTagsRefresh,
  setPopupComponentsForTest,
  setActiveTabForTest
} from '../../src/ui/side-panel/side-panel.js'
import { TAB_BOOKMARK, TAB_TAGS_TREE } from '../../src/ui/side-panel/side-panel-tab-state.js'

const mockInitTagsTreeTab = jest.fn()
jest.mock('../../src/ui/side-panel/tags-tree.js', () => ({
  initTagsTreeTab: (...args) => mockInitTagsTreeTab(...args),
  setSelectedTagsFromCurrentBookmark: jest.fn()
}))
jest.mock('../../src/ui/index.js', () => ({
  init: jest.fn().mockResolvedValue(),
  popup: jest.fn()
}))
jest.mock('../../src/shared/ErrorHandler.js', () => ({
  ErrorHandler: jest.fn()
}))
jest.mock('../../src/config/config-manager.js', () => ({
  ConfigManager: jest.fn().mockImplementation(() => ({
    getConfig: jest.fn().mockResolvedValue({})
  }))
}))

describe('[REQ-RECENT_TAGS_SYSTEM] bindWindowFocusRecentTagsRefresh composition', () => {
  /** @type {((windowId: number) => void) | null} */
  let onFocusHandler = null

  beforeEach(() => {
    onFocusHandler = null
    global.chrome = {
      runtime: {
        lastError: undefined
      },
      windows: {
        WINDOW_ID_NONE: -1,
        onFocusChanged: {
          addListener: jest.fn((fn) => {
            onFocusHandler = fn
          })
        },
        getCurrent: jest.fn()
      }
    }
    setPopupComponentsForTest(null)
    setActiveTabForTest(TAB_BOOKMARK)
  })

  afterEach(() => {
    setPopupComponentsForTest(null)
  })

  /**
   * [IMPL-SIDE_PANEL_TABS] [ARCH-SIDE_PANEL_TABS] [ARCH-TAG_SYSTEM] [REQ-RECENT_TAGS_SYSTEM] [IMPL-RECENT_TAGS_POPUP_REFRESH]
   * Binding: onFocusChanged fires → getCurrent confirms focused window → sync guards pass → loadRecentTags().
   */
  test('onFocusChanged with matching window and bookmark tab calls controller.loadRecentTags', () => {
    const loadRecentTags = jest.fn().mockResolvedValue()
    setPopupComponentsForTest({
      controller: {
        isInitialized: true,
        isLoading: false,
        loadRecentTags
      }
    })
    global.chrome.windows.getCurrent.mockImplementation((cb) => {
      cb({ id: 7 })
    })

    bindWindowFocusRecentTagsRefresh()

    expect(global.chrome.windows.onFocusChanged.addListener).toHaveBeenCalledTimes(1)
    expect(typeof onFocusHandler).toBe('function')
    onFocusHandler(7)

    expect(global.chrome.windows.getCurrent).toHaveBeenCalled()
    expect(loadRecentTags).toHaveBeenCalledTimes(1)
  })

  /**
   * [IMPL-SIDE_PANEL_TABS] [ARCH-SIDE_PANEL_TABS] [ARCH-TAG_SYSTEM] [REQ-RECENT_TAGS_SYSTEM] [IMPL-RECENT_TAGS_POPUP_REFRESH]
   * Early return: WINDOW_ID_NONE must not call loadRecentTags.
   */
  test('onFocusChanged with WINDOW_ID_NONE does not call loadRecentTags', () => {
    const loadRecentTags = jest.fn().mockResolvedValue()
    setPopupComponentsForTest({
      controller: { isInitialized: true, isLoading: false, loadRecentTags }
    })
    global.chrome.windows.getCurrent.mockImplementation((cb) => {
      cb({ id: 1 })
    })

    bindWindowFocusRecentTagsRefresh()
    onFocusHandler(global.chrome.windows.WINDOW_ID_NONE)

    expect(loadRecentTags).not.toHaveBeenCalled()
    expect(global.chrome.windows.getCurrent).not.toHaveBeenCalled()
  })

  /**
   * [IMPL-SIDE_PANEL_TABS] [ARCH-SIDE_PANEL_TABS] [ARCH-TAG_SYSTEM] [REQ-RECENT_TAGS_SYSTEM] [IMPL-RECENT_TAGS_POPUP_REFRESH]
   * getCurrent window id mismatch → no loadRecentTags (pseudo RETURN).
   */
  test('when getCurrent window id does not match focus windowId loadRecentTags is not called', () => {
    const loadRecentTags = jest.fn().mockResolvedValue()
    setPopupComponentsForTest({
      controller: { isInitialized: true, isLoading: false, loadRecentTags }
    })
    global.chrome.windows.getCurrent.mockImplementation((cb) => {
      cb({ id: 99 })
    })

    bindWindowFocusRecentTagsRefresh()
    onFocusHandler(7)

    expect(global.chrome.windows.getCurrent).toHaveBeenCalled()
    expect(loadRecentTags).not.toHaveBeenCalled()
  })

  /**
   * [IMPL-SIDE_PANEL_TABS] [ARCH-SIDE_PANEL_TABS] [ARCH-TAG_SYSTEM] [REQ-RECENT_TAGS_SYSTEM] [IMPL-RECENT_TAGS_POPUP_REFRESH]
   * chrome.runtime.lastError after getCurrent → no loadRecentTags.
   */
  test('when runtime.lastError is set after getCurrent loadRecentTags is not called', () => {
    const loadRecentTags = jest.fn().mockResolvedValue()
    setPopupComponentsForTest({
      controller: { isInitialized: true, isLoading: false, loadRecentTags }
    })
    global.chrome.windows.getCurrent.mockImplementation((cb) => {
      global.chrome.runtime.lastError = { message: 'fail' }
      cb({ id: 7 })
      global.chrome.runtime.lastError = undefined
    })

    bindWindowFocusRecentTagsRefresh()
    onFocusHandler(7)

    expect(loadRecentTags).not.toHaveBeenCalled()
  })

  /**
   * [IMPL-SIDE_PANEL_TABS] [ARCH-SIDE_PANEL_TABS] [ARCH-TAG_SYSTEM] [REQ-RECENT_TAGS_SYSTEM] [IMPL-RECENT_TAGS_POPUP_REFRESH]
   * shouldInvokeLoadRecentTagsOnWindowFocusSync false when active tab is not bookmark → wiring respects tab-state helper.
   */
  test('when activeTab is not bookmark loadRecentTags is not called', () => {
    const loadRecentTags = jest.fn().mockResolvedValue()
    setPopupComponentsForTest({
      controller: { isInitialized: true, isLoading: false, loadRecentTags }
    })
    setActiveTabForTest(TAB_TAGS_TREE)
    global.chrome.windows.getCurrent.mockImplementation((cb) => {
      cb({ id: 4 })
    })

    bindWindowFocusRecentTagsRefresh()
    onFocusHandler(4)

    expect(loadRecentTags).not.toHaveBeenCalled()
  })

  /**
   * [IMPL-SIDE_PANEL_TABS] [ARCH-SIDE_PANEL_TABS] [ARCH-TAG_SYSTEM] [REQ-RECENT_TAGS_SYSTEM] [IMPL-RECENT_TAGS_POPUP_REFRESH]
   * Missing windows API: no listener registered (hasWindowsApi guard).
   */
  test('when windows API incomplete bindWindowFocusRecentTagsRefresh does not register listener', () => {
    global.chrome.windows = {
      WINDOW_ID_NONE: -1,
      onFocusChanged: { addListener: jest.fn() }
      // no getCurrent
    }

    bindWindowFocusRecentTagsRefresh()

    expect(global.chrome.windows.onFocusChanged.addListener).not.toHaveBeenCalled()
  })
})
