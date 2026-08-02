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

import { BUILD_TIME_UTC } from './build-info.js'
import { getVisibilityForTab } from './side-panel-tab-state.js'

function getDocument (documentRef) {
  return documentRef ?? (typeof document !== 'undefined' ? document : null)
}

function getShellElements (documentRef) {
  const documentValue = getDocument(documentRef)
  return {
    bookmarkPanelEl: documentValue?.getElementById('bookmarkPanel') ?? null,
    tagsTreePanelEl: documentValue?.getElementById('tagsTreePanel') ?? null,
    browserTabsPanelEl: documentValue?.getElementById('browserTabsPanel') ?? null,
    tabButtons: documentValue?.querySelectorAll?.('.side-panel-tab[data-tab]') ?? []
  }
}

/**
 * [IMPL-SIDE_PANEL_TABS] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT]
 * SHOW_PANEL: make exactly one side-panel content root visible and mark its tab selected.
 */
export function showPanel (activeTab, elements = {}) {
  const resolved = {
    ...getShellElements(elements.documentRef),
    ...elements
  }
  const visibility = getVisibilityForTab(activeTab)
  if (resolved.bookmarkPanelEl) resolved.bookmarkPanelEl.hidden = !visibility.bookmarkVisible
  if (resolved.tagsTreePanelEl) resolved.tagsTreePanelEl.hidden = !visibility.tagsTreeVisible
  if (resolved.browserTabsPanelEl) resolved.browserTabsPanelEl.hidden = !visibility.browserTabsVisible
  resolved.tabButtons?.forEach((button) => {
    const tab = button.getAttribute('data-tab')
    button.setAttribute('aria-selected', tab === activeTab ? 'true' : 'false')
  })
}

/**
 * [IMPL-SIDE_PANEL_TABS] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT]
 * BIND_TAB_BUTTONS: connect each tab button to the controller's switchTab boundary.
 */
export function bindTabButtons (tabButtons, switchTab) {
  tabButtons?.forEach((button) => {
    button.addEventListener('click', () => {
      const tab = button.getAttribute('data-tab')
      if (tab) switchTab(tab)
    })
  })
}

/**
 * [IMPL-SIDE_PANEL_TABS] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT]
 * Set the side-panel header's version and UTC build time; missing test DOM is a no-op.
 */
export function setSidePanelVersion (version, buildTimeUtc, options = {}) {
  const documentValue = getDocument(options.documentRef)
  const rightEl = documentValue?.getElementById('side-panel-version')
  if (!rightEl) return
  const chromeRef = options.chromeRef ?? (typeof chrome !== 'undefined' ? chrome : undefined)
  const manifestVersion = chromeRef?.runtime?.getManifest?.()?.version
  const v = version ?? manifestVersion ?? ''
  const t = buildTimeUtc ?? BUILD_TIME_UTC
  const leftEl = documentValue.getElementById('side-panel-title-version')
  if (leftEl) leftEl.textContent = v ? `Hoverboard v${v}` : 'Hoverboard'
  rightEl.textContent = t
}

/**
 * [IMPL-SIDE_PANEL_TABS] [ARCH-SIDE_PANEL_TABS] [REQ-SIDE_PANEL_POPUP_EQUIVALENT]
 * Initialize the side-panel header on DOM ready.
 */
export function initSidePanelVersion (options = {}) {
  setSidePanelVersion(undefined, undefined, options)
}
