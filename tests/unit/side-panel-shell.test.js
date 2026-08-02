/**
 * === IMPL-FULL-BLOCK: IMPL-SIDE_PANEL_TABS ===
 * ## SHOW_PANEL
 *
 * - [IMPL-SIDE_PANEL_TABS] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [REQ-SIDE_PANEL_BROWSER_TABS] How: toggle visibility of #bookmarkPanel / #tagsTreePanel / #browserTabsPanel so exactly one content panel shows.
 * - Contract:
 *   - INPUT: panel page load; user click on tab ("This Page", "By Tag", or "Tabs")
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: one panel visible; This Page, By Tag, or browser Tabs content shown; selected tab persisted
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: activeTab ("bookmark" | "tagsTree" | "browserTabs"), bookmarkTabInited (boolean), tagsTreeTabInited (boolean), browserTabsTabInited (boolean), storage key hoverboard_sidepanel_active_tab. TAB_BROWSER_TABS = "browserTabs"; TAB_IDS includes browserTabs.
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: SHOW_PANEL
 *   - IF activeTab === "bookmark": #bookmarkPanel visible, #tagsTreePanel hidden, #browserTabsPanel hidden
 *   - ELSE IF activeTab === "tagsTree": #tagsTreePanel visible, #bookmarkPanel hidden, #browserTabsPanel hidden
 *   - ELSE IF activeTab === "browserTabs": #browserTabsPanel visible, #bookmarkPanel hidden, #tagsTreePanel hidden
 * === END IMPL-FULL-BLOCK: IMPL-SIDE_PANEL_TABS
 */

import {
  bindTabButtons,
  setSidePanelVersion,
  showPanel
} from '../../src/ui/side-panel/side-panel-shell.js'

describe('[REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_TABS] side-panel shell', () => {
  test('showPanel REQ-SIDE_PANEL_POPUP_EQUIVALENT shows exactly the selected panel', () => {
    const bookmarkPanel = { hidden: false }
    const tagsTreePanel = { hidden: false }
    const browserTabsPanel = { hidden: false }
    const bookmarkButton = {
      getAttribute: () => 'bookmark',
      setAttribute: jest.fn()
    }
    const tagsButton = {
      getAttribute: () => 'tagsTree',
      setAttribute: jest.fn()
    }

    showPanel('tagsTree', {
      bookmarkPanelEl: bookmarkPanel,
      tagsTreePanelEl: tagsTreePanel,
      browserTabsPanelEl: browserTabsPanel,
      tabButtons: [bookmarkButton, tagsButton]
    })

    expect(bookmarkPanel.hidden).toBe(true)
    expect(tagsTreePanel.hidden).toBe(false)
    expect(browserTabsPanel.hidden).toBe(true)
    expect(tagsButton.setAttribute).toHaveBeenCalledWith('aria-selected', 'true')
  })

  test('bindTabButtons REQ-SIDE_PANEL_POPUP_EQUIVALENT delegates the clicked tab', () => {
    const switchTab = jest.fn()
    const button = {
      getAttribute: () => 'browserTabs',
      addEventListener: jest.fn((event, listener) => listener())
    }

    bindTabButtons([button], switchTab)

    expect(switchTab).toHaveBeenCalledWith('browserTabs')
  })

  test('setSidePanelVersion REQ-SIDE_PANEL_POPUP_EQUIVALENT renders both header values', () => {
    const title = { textContent: '' }
    const time = { textContent: '' }
    const documentRef = {
      getElementById: jest.fn((id) => id === 'side-panel-title-version' ? title : time)
    }

    setSidePanelVersion('1.2.3', '2026-08-01 19:10', { documentRef })

    expect(title.textContent).toBe('Hoverboard v1.2.3')
    expect(time.textContent).toBe('2026-08-01 19:10')
  })
})
