/**
 * [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_TABS] [IMPL-SIDE_PANEL_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS]
 * Phase G composition: runInitialTabInit / switchTab → initTabIfNeeded(TAB_BROWSER_TABS) → initBrowserTabsTab().
 * Verifies binding and one-shot guard; no Playwright / no tab-bar UI click.
 */

import {
  runInitialTabInit,
  switchTabForTest,
  resetBrowserTabsTabInitedForTest,
  setPopupComponentsForTest
} from '../../src/ui/side-panel/side-panel.js'
import { SIDE_PANEL_TAB_STORAGE_KEY, TAB_BROWSER_TABS } from '../../src/ui/side-panel/side-panel-tab-state.js'

const mockInitBrowserTabsTab = jest.fn()
jest.mock('../../src/ui/side-panel/browser-tabs-panel.js', () => ({
  initBrowserTabsTab: (...args) => mockInitBrowserTabsTab(...args)
}))
jest.mock('../../src/ui/side-panel/tags-tree.js', () => ({
  initTagsTreeTab: jest.fn(),
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

describe('[REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] browser Tabs tab composition', () => {
  beforeEach(() => {
    mockInitBrowserTabsTab.mockClear()
    resetBrowserTabsTabInitedForTest()
    setPopupComponentsForTest(null)
    global.chrome = global.chrome || {}
    global.chrome.storage = global.chrome.storage || {}
    global.chrome.storage.local = global.chrome.storage.local || {}
    global.chrome.storage.local.set = jest.fn()
  })

  /**
   * Binding: runInitialTabInit(TAB_BROWSER_TABS) → initTabIfNeeded → initBrowserTabsTabIfNeeded → initBrowserTabsTab() once.
   */
  test('runInitialTabInit(browserTabs) calls initBrowserTabsTab once with no arguments', async () => {
    await runInitialTabInit(TAB_BROWSER_TABS)
    expect(mockInitBrowserTabsTab).toHaveBeenCalledTimes(1)
    expect(mockInitBrowserTabsTab).toHaveBeenCalledWith()
  })

  /**
   * Binding: switchTabForTest(TAB_BROWSER_TABS) persists active tab and delegates to same init path as tab button click handler.
   */
  test('switchTabForTest(browserTabs) calls initBrowserTabsTab once and writes storage key', () => {
    switchTabForTest(TAB_BROWSER_TABS)
    expect(global.chrome.storage.local.set).toHaveBeenCalledWith(
      expect.objectContaining({ [SIDE_PANEL_TAB_STORAGE_KEY]: TAB_BROWSER_TABS })
    )
    expect(mockInitBrowserTabsTab).toHaveBeenCalledTimes(1)
    expect(mockInitBrowserTabsTab).toHaveBeenCalledWith()
  })

  /**
   * Effect: browserTabsTabInited guard — second switch does not call initBrowserTabsTab again.
   */
  test('second switchTabForTest(browserTabs) without reset does not call initBrowserTabsTab again', () => {
    switchTabForTest(TAB_BROWSER_TABS)
    mockInitBrowserTabsTab.mockClear()
    switchTabForTest(TAB_BROWSER_TABS)
    expect(mockInitBrowserTabsTab).not.toHaveBeenCalled()
  })
})
