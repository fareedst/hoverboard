/**
 * === IMPL-FULL-BLOCK: IMPL-SIDE_PANEL_SNAPSHOT ===
 * [IMPL-SIDE_PANEL_SNAPSHOT] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [REQ-SIDE_PANEL_TAGS_TREE] — Unit-testable DOM snapshot of This Page / By Tag / Tabs. Browser Bookmarks is an absence check when the standalone page is not part of side-panel.html ([IMPL-SIDE_PANEL_BROWSER_BOOKMARKS]).
 * - [IMPL-SIDE_PANEL_SNAPSHOT] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [REQ-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_BOOKMARK] [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS] How: Apply the same panel-presence and control-shape checks in JSDOM that the E2E helper applies against the live side panel.
 * - Contract: INPUT document; OUTPUT bookmarkTab, tagsTreeTab, browserTabsTab, browserBookmarksTab; EFFECTS none; TERMINATION total.
 * === END IMPL-FULL-BLOCK: IMPL-SIDE_PANEL_SNAPSHOT ===
 */

/** Pure snapshot matching IMPL-SIDE_PANEL_SNAPSHOT PROCEDURE MAIN (document in page context). */
function snapshotSidePanel (doc = document) {
  const bookmarkTab = (() => {
    const root = doc.getElementById('bookmarkPanel')
    if (!root) return { panelPresent: false }
    const loading = root.querySelector('[data-popup-ref="loadingState"]')
    const error = root.querySelector('[data-popup-ref="errorState"]')
    const main = root.querySelector('[data-popup-ref="mainInterface"]')
    const loadingVisible = !!(loading && !loading.classList.contains('hidden'))
    const errorVisible = !!(error && !error.classList.contains('hidden'))
    const mainVisible = !!(main && !main.classList.contains('hidden'))
    let screen = 'unknown'
    if (loadingVisible) screen = 'loading'
    else if (errorVisible) screen = 'error'
    else if (mainVisible) screen = 'mainInterface'
    const errorMsg = root.querySelector('[data-popup-ref="errorMessage"]')
    return {
      panelPresent: true,
      screen,
      loadingVisible,
      errorVisible,
      mainVisible,
      errorMessage: errorMsg ? errorMsg.textContent : undefined
    }
  })()
  const tagsTreeTab = (() => {
    const root = doc.getElementById('tagsTreePanel')
    if (!root) return { panelPresent: false }
    return {
      panelPresent: true,
      hasTagSelector: !!(root.querySelector('#tagSelector') || doc.getElementById('tagSelector')),
      hasTreeContainer: !!(root.querySelector('#treeContainer') || doc.getElementById('treeContainer')),
      hasSearchInput: !!(root.querySelector('#searchInput') || doc.getElementById('searchInput')),
      hasConfigToggle: !!(root.querySelector('#configToggle') || doc.getElementById('configToggle'))
    }
  })()
  const browserTabsTab = (() => {
    const root = doc.getElementById('browserTabsPanel')
    if (!root) return { panelPresent: false }
    return {
      panelPresent: true,
      hasFilterInput: !!root.querySelector('input'),
      hasListContainer: !!root.querySelector('[data-tabs-list], .tabs-list, ul')
    }
  })()
  const browserBookmarksTab = (() => {
    const root = doc.getElementById('browserBookmarksPanel')
    if (!root) return { panelPresent: false }
    return {
      panelPresent: true,
      hasSearchInput: !!root.querySelector('input[type="search"], #bookmarksSearch'),
      hasFolderSelect: !!root.querySelector('select'),
      hasListContainer: !!root.querySelector('[data-bookmarks-list], .bookmarks-list, ul')
    }
  })()
  return { bookmarkTab, tagsTreeTab, browserTabsTab, browserBookmarksTab }
}

describe('[IMPL-SIDE_PANEL_SNAPSHOT] snapshotSidePanel DOM PROCEDURE', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="bookmarkPanel">
        <div data-popup-ref="loadingState" class="hidden"></div>
        <div data-popup-ref="errorState" class="hidden"></div>
        <div data-popup-ref="mainInterface"></div>
      </div>
      <div id="tagsTreePanel">
        <div id="tagSelector"></div>
        <div id="treeContainer"></div>
        <input id="searchInput" />
        <button id="configToggle"></button>
      </div>
      <div id="browserTabsPanel"><input /><ul class="tabs-list"></ul></div>
    `
  })

  test('returns This Page/By Tag/Tabs present and Bookmarks absent [IMPL-SIDE_PANEL_SNAPSHOT]', () => {
    const snap = snapshotSidePanel()
    expect(snap.bookmarkTab).toMatchObject({
      panelPresent: true,
      screen: 'mainInterface',
      mainVisible: true,
      loadingVisible: false
    })
    expect(snap.tagsTreeTab).toMatchObject({
      panelPresent: true,
      hasTagSelector: true,
      hasTreeContainer: true,
      hasSearchInput: true,
      hasConfigToggle: true
    })
    expect(snap.browserTabsTab.panelPresent).toBe(true)
    // Browser Bookmarks is standalone — absent from side panel [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS]
    expect(snap.browserBookmarksTab.panelPresent).toBe(false)
  })

  test('missing bookmarkPanel yields panelPresent false [IMPL-SIDE_PANEL_SNAPSHOT]', () => {
    document.getElementById('bookmarkPanel').remove()
    const snap = snapshotSidePanel()
    expect(snap.bookmarkTab).toEqual({ panelPresent: false })
  })
})
