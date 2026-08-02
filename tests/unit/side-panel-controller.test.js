/**
 * === IMPL-FULL-BLOCK: IMPL-SIDE_PANEL_TABS ===
 * ## SWITCH_TAB
 *
 * - [IMPL-SIDE_PANEL_TABS] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_TAGS_TREE] How: persist activeTab; showPanel; tagsTree branch passes currentBookmarkTags / setSelectedTagsFromCurrentBookmark; returning to bookmark when already inited → refreshPopupData. Tab-change refresh contract is BIND_TAB_CHANGE_REFRESH (below).
 * - Contract:
 *   - INPUT: panel page load; user click on tab ("This Page", "By Tag", or "Tabs")
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: one panel visible; This Page, By Tag, or browser Tabs content shown; selected tab persisted
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: activeTab ("bookmark" | "tagsTree" | "browserTabs"), bookmarkTabInited (boolean), tagsTreeTabInited (boolean), browserTabsTabInited (boolean), storage key hoverboard_sidepanel_active_tab. TAB_BROWSER_TABS = "browserTabs"; TAB_IDS includes browserTabs.
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: SWITCH_TAB
 *   - wasBookmarkInited = bookmarkTabInited
 *   - activeTab = tabId
 *   - chrome.storage.local.set({ hoverboard_sidepanel_active_tab: tabId })
 *   - showPanel(activeTab)
 *   - IF tabId === "tagsTree": currentTags = controller.normalizeTags(controller.currentPin?.tags) OR []; wasTagsTreeInited = tagsTreeTabInited; initTabIfNeeded(tabId, { currentBookmarkTags: currentTags }); IF wasTagsTreeInited: setSelectedTagsFromCurrentBookmark(currentTags)
 *   - ELSE IF tabId === "browserTabs": initTabIfNeeded("browserTabs")
 *   - ELSE: initTabIfNeeded(tabId)
 *   - IF tabId === "bookmark" AND wasBookmarkInited AND popupComponents.controller: popupComponents.controller.refreshPopupData()
 * === END IMPL-FULL-BLOCK: IMPL-SIDE_PANEL_TABS
 */

import {
  createSidePanelController
} from '../../src/ui/side-panel/side-panel-controller.js'
import { TAB_BOOKMARK, TAB_BROWSER_TABS, TAB_TAGS_TREE } from '../../src/ui/side-panel/side-panel-tab-state.js'

describe('[REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_TABS] controller', () => {
  test('switchTab REQ-SIDE_PANEL_POPUP_EQUIVALENT persists and lazily initializes Browser Tabs', () => {
    const storageSet = jest.fn()
    const showPanel = jest.fn()
    const initBrowserTabsTab = jest.fn()
    const controller = createSidePanelController({
      chromeRef: { storage: { local: { set: storageSet } } },
      showPanel,
      initBrowserTabsTab
    })

    controller.switchTab(TAB_BROWSER_TABS)
    controller.switchTab(TAB_BROWSER_TABS)

    expect(storageSet).toHaveBeenCalledWith({ hoverboard_sidepanel_active_tab: TAB_BROWSER_TABS })
    expect(showPanel).toHaveBeenCalledWith(TAB_BROWSER_TABS)
    expect(initBrowserTabsTab).toHaveBeenCalledTimes(1)
  })

  test('runInitialTabInit REQ-SIDE_PANEL_POPUP_EQUIVALENT initializes Bookmark before Tags tree', async () => {
    const initBookmarkTab = jest.fn().mockResolvedValue({
      controller: {
        currentPin: { tags: 'work, personal' },
        normalizeTags: (tags) => tags.split(',').map((tag) => tag.trim())
      }
    })
    const initTagsTreeTab = jest.fn()
    const controller = createSidePanelController({
      initBookmarkTab,
      initTagsTreeTab,
      showPanel: jest.fn()
    })

    await controller.runInitialTabInit(TAB_TAGS_TREE)

    expect(initBookmarkTab).toHaveBeenCalledTimes(1)
    expect(initTagsTreeTab).toHaveBeenCalledWith({ currentBookmarkTags: ['work', 'personal'] })
  })

  test('switchTab REQ-SIDE_PANEL_POPUP_EQUIVALENT refreshes an initialized Bookmark controller', async () => {
    const refreshPopupData = jest.fn()
    const controller = createSidePanelController({
      showPanel: jest.fn(),
      initBookmarkTab: jest.fn().mockResolvedValue({
        controller: {
          refreshPopupData,
          currentPin: null,
          normalizeTags: () => []
        }
      }),
      initTagsTreeTab: jest.fn()
    })

    await controller.runInitialTabInit(TAB_BOOKMARK)
    controller.switchTab(TAB_TAGS_TREE)
    controller.switchTab(TAB_BOOKMARK)

    expect(refreshPopupData).toHaveBeenCalledTimes(1)
  })
})
