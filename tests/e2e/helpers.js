/**
 * === IMPL-FULL-BLOCK: IMPL-SIDE_PANEL_SNAPSHOT ===
 * [IMPL-SIDE_PANEL_SNAPSHOT] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [REQ-SIDE_PANEL_TAGS_TREE] — This block defines the side panel snapshot helper: one function returning bookmarkTab and tagsTreeTab shapes. Implements REQ-UI_INSPECTION by providing E2E-inspectable state for side panel; REQ-SIDE_PANEL_POPUP_EQUIVALENT (Bookmark tab) and REQ-SIDE_PANEL_TAGS_TREE (Tags tree tab) by capturing key elements per tab.
 * 
 * ## MAIN
 * 
 * - [REQ-UI_INSPECTION] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_SNAPSHOT] [IMPL-SIDE_PANEL_BOOKMARK] How: Bookmark tab snapshot: root #bookmarkPanel; query by data-popup-ref for loadingState, errorState, mainInterface; derive visibility and screen. Implements "E2E can capture Bookmark tab state" and "Bookmark tab = popup-equivalent inspectable". Tags tree tab snapshot: root #tagsTreePanel; presence of #tagSelector, #treeContainer, #searchInput, #configToggle, etc. Implements "E2E can capture Tags tree tab state" and "Tags tree tab structure inspectable". browserTabsTab snapshot: root #browserTabsPanel; presence of filter input, Copy button, Close button, list container. Implements E2E-inspectable state for Tabs tab. browserBookmarksTab snapshot: root #browserBookmarksPanel; presence of search input, folder select, sort select, list container, Select all, Undo bar, Import folder select, Export HTML/CSV buttons. Implements E2E-inspectable state for Bookmarks tab.
 * - Contract:
 *   - INPUT: page (Playwright/Puppeteer page navigated to side-panel.html)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: { bookmarkTab: {...}, tagsTreeTab: {...}, browserTabsTab: {...}, browserBookmarksTab: { panelPresent, hasSearchInput?, hasFolderSelect?, hasSortSelect?, hasListContainer?, hasSelectAllBtn?, hasUndoBar?, hasImportFolderSelect?, hasExportHtmlBtn?, hasExportCsvBtn? } } | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: document in page context
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: MAIN
 *   - 1. bookmarkTab = (function () {
 *   - 2.   const root = document.getElementById('bookmarkPanel')
 *   - 3.   if (!root) return { panelPresent: false }
 *   - 4.   const loading = root.querySelector('[data-popup-ref="loadingState"]')
 *   - 5.   const error = root.querySelector('[data-popup-ref="errorState"]')
 *   - 6.   const main = root.querySelector('[data-popup-ref="mainInterface"]')
 *   - 7.   const loadingVisible = loading && !loading.classList.contains('hidden')
 *   - 8.   const errorVisible = error && !error.classList.contains('hidden')
 *   - 9.   const mainVisible = main && !main.classList.contains('hidden')
 *   - 10.   let screen = 'unknown'
 *   - 11.   if (loadingVisible) screen = 'loading'
 *   - 12.   else if (errorVisible) screen = 'error'
 *   - 13.   else if (mainVisible) screen = 'mainInterface'
 *   - 14.   const errorMsg = root.querySelector('[data-popup-ref="errorMessage"]')
 *   - 15.   return { panelPresent: true, screen, loadingVisible, errorVisible, mainVisible, errorMessage: errorMsg ? errorMsg.textContent : undefined }
 *   - 16. })()
 *   - 17. tagsTreeTab = (function () {
 *   - 18.   const root = document.getElementById('tagsTreePanel')
 *   - 19.   if (!root) return { panelPresent: false }
 *   - 20.   return {
 *   - 21.     panelPresent: true,
 *   - 22.     hasTagSelector: !!root.querySelector('#tagSelector') || !!document.getElementById('tagSelector'),
 *   - 23.     hasTreeContainer: !!root.querySelector('#treeContainer') || !!document.getElementById('treeContainer'),
 *   - 24.     hasSearchInput: !!root.querySelector('#searchInput') || !!document.getElementById('searchInput'),
 *   - 25.     hasConfigToggle: !!root.querySelector('#configToggle') || !!document.getElementById('configToggle'),
 *   - 26.     hasSearchCount: !!root.querySelector('#searchCount') || !!document.getElementById('searchCount'),
 *   - 27.     hasEmptyState: !!root.querySelector('#emptyState') || !!document.getElementById('emptyState'),
 *   - 28.     hasLoadError: !!root.querySelector('#loadError') || !!document.getElementById('loadError')
 *   - 29.   }
 *   - 30. })()
 *   - 31. browserTabsTab = (function () {
 *   - 32.   const root = document.getElementById('browserTabsPanel')
 *   - 33.   if (!root) return { panelPresent: false }
 *   - 34.   return {
 *   - 35.     panelPresent: true,
 *   - 36.     hasFilterInput: !!root.querySelector('#browserTabsFilterInput') || !!document.getElementById('browserTabsFilterInput'),
 *   - 37.     hasCopyButton: !!root.querySelector('[data-action="copyUrls"]') || !!root.querySelector('#browserTabsCopyBtn'),
 *   - 38.     hasCloseButton: !!root.querySelector('[data-action="closeTabs"]') || !!root.querySelector('#browserTabsCloseBtn'),
 *   - 39.     hasListContainer: !!root.querySelector('#browserTabsList') || !!root.querySelector('.browser-tabs-list')
 *   - 40.   }
 *   - 41. })()
 *   - 42. browserBookmarksTab = (function () {
 *   - 43.   const root = document.getElementById('browserBookmarksPanel')
 *   - 44.   if (!root) return { panelPresent: false }
 *   - 45.   const byId = (id) => document.getElementById(id)
 *   - 46.   return {
 *   - 47.     panelPresent: true,
 *   - 48.     hasSearchInput: !!byId('browserBookmarksSearchInput'),
 *   - 49.     hasFolderSelect: !!byId('browserBookmarksFolderSelect'),
 *   - 50.     hasSortSelect: !!byId('browserBookmarksSortSelect'),
 *   - 51.     hasListContainer: !!byId('browserBookmarksList'),
 *   - 52.     hasSelectAllBtn: !!byId('browserBookmarksSelectAllBtn'),
 *   - 53.     hasUndoBar: !!byId('browserBookmarksUndoBar'),
 *   - 54.     hasImportFolderSelect: !!byId('browserBookmarksImportFolderSelect'),
 *   - 55.     hasExportHtmlBtn: !!byId('browserBookmarksExportHtmlBtn'),
 *   - 56.     hasExportCsvBtn: !!byId('browserBookmarksExportCsvBtn')
 *   - 57.   }
 *   - 58. })()
 *   - 59. RETURN { bookmarkTab, tagsTreeTab, browserTabsTab, browserBookmarksTab }
 * 
 * === END IMPL-FULL-BLOCK: IMPL-SIDE_PANEL_SNAPSHOT ===
 */
export async function snapshotPopup (page) {
  return await page.evaluate(() => {
    const loading = document.getElementById('loadingState')
    const error = document.getElementById('errorState')
    const main = document.getElementById('mainInterface')
    const errorMsg = document.getElementById('errorMessage')
    const loadingVisible = loading && !loading.classList.contains('hidden')
    const errorVisible = error && !error.classList.contains('hidden')
    const mainVisible = main && !main.classList.contains('hidden')
    let screen = 'unknown'
    if (loadingVisible) screen = 'loading'
    else if (errorVisible) screen = 'error'
    else if (mainVisible) screen = 'mainInterface'
    return {
      screen,
      loadingVisible,
      errorVisible,
      mainVisible,
      errorMessage: errorMsg ? errorMsg.textContent : undefined
    }
  })
}

/**
 * Snapshot overlay state from a content page that has the content script injected.
 * @param {import('puppeteer').Page} contentPage - Page with content script (e.g. a tab with the extension's content script)
 * @returns {Promise<{ visible: boolean, title?: string, url?: string, tags?: string[], overlayRootPresent: boolean }>}
 */
export async function snapshotOverlay (contentPage) {
  return await contentPage.evaluate(() => {
    const root = document.getElementById('hoverboard-overlay')
    const overlayRootPresent = !!root
    if (!root) {
      return { visible: false, overlayRootPresent: false }
    }
    const style = window.getComputedStyle(root)
    const visible = style.display !== 'none' && parseFloat(style.opacity) > 0
    const labelPrimary = root.querySelector('.label-primary')
    const textMuted = root.querySelector('.text-muted')
    const tagElements = root.querySelectorAll('.tags-container .tag-element')
    const title = labelPrimary ? labelPrimary.textContent : undefined
    const url = textMuted ? textMuted.textContent : undefined
    const tags = Array.from(tagElements).map((el) => el.textContent).filter(Boolean)
    return {
      visible,
      overlayRootPresent,
      title: title || undefined,
      url: url || undefined,
      tags: tags.length ? tags : undefined
    }
  })
}

/**
 * Snapshot options page key sections (storage mode, token present, etc.).
 * @param {import('puppeteer').Page} page - Page navigated to extension options
 * @returns {Promise<{ storageMode?: string, hasTokenField: boolean }>}
 */
export async function snapshotOptions (page) {
  return await page.evaluate(() => {
    const tokenInput = document.querySelector('input[type="password"], input[name="token"], input#token')
    const storageSelect = document.querySelector('select[name="storageMode"], #storageMode, .storage-mode')
    let storageMode
    if (storageSelect) {
      if (storageSelect.tagName === 'SELECT') storageMode = storageSelect.value
      else storageMode = storageSelect.textContent
    }
    return {
      hasTokenField: !!tokenInput,
      storageMode: storageMode || undefined
    }
  })
}

/**
 * [IMPL-SIDE_PANEL_SNAPSHOT] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [REQ-SIDE_PANEL_TAGS_TREE]
 * Snapshot side panel: two serializable state shapes (Bookmark tab, Tags tree tab) for E2E assertions.
 * @param {import('puppeteer').Page} page - Page navigated to side-panel.html (chrome-extension://id/.../side-panel.html)
 * @returns {Promise<{ bookmarkTab: object, tagsTreeTab: object, browserTabsTab: object, browserBookmarksTab: { panelPresent: boolean, hasSearchInput?: boolean, hasFolderSelect?: boolean, hasSortSelect?: boolean, hasListContainer?: boolean, hasSelectAllBtn?: boolean, hasUndoBar?: boolean, hasImportFolderSelect?: boolean, hasExportHtmlBtn?: boolean, hasExportCsvBtn?: boolean } }>}
 */
export async function snapshotSidePanel (page) {
  return await page.evaluate(() => {
    // [IMPL-SIDE_PANEL_SNAPSHOT] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_BOOKMARK] Bookmark tab: root #bookmarkPanel, data-popup-ref visibility and screen
    const bookmarkRoot = document.getElementById('bookmarkPanel')
    let bookmarkTab
    if (!bookmarkRoot) {
      bookmarkTab = { panelPresent: false }
    } else {
      const loading = bookmarkRoot.querySelector('[data-popup-ref="loadingState"]')
      const error = bookmarkRoot.querySelector('[data-popup-ref="errorState"]')
      const main = bookmarkRoot.querySelector('[data-popup-ref="mainInterface"]')
      const loadingVisible = !!(loading && !loading.classList.contains('hidden'))
      const errorVisible = !!(error && !error.classList.contains('hidden'))
      const mainVisible = !!(main && !main.classList.contains('hidden'))
      let screen = 'unknown'
      if (loadingVisible) screen = 'loading'
      else if (errorVisible) screen = 'error'
      else if (mainVisible) screen = 'mainInterface'
      const errorMsgEl = bookmarkRoot.querySelector('[data-popup-ref="errorMessage"]')
      bookmarkTab = {
        panelPresent: true,
        screen,
        loadingVisible,
        errorVisible,
        mainVisible,
        errorMessage: errorMsgEl ? errorMsgEl.textContent : undefined
      }
    }

    // [IMPL-SIDE_PANEL_SNAPSHOT] [REQ-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE] Tags tree tab: root #tagsTreePanel, key element presence
    const tagsTreeRoot = document.getElementById('tagsTreePanel')
    let tagsTreeTab
    if (!tagsTreeRoot) {
      tagsTreeTab = { panelPresent: false }
    } else {
      const byId = (id) => document.getElementById(id)
      tagsTreeTab = {
        panelPresent: true,
        hasTagSelector: !!byId('tagSelector'),
        hasTreeContainer: !!byId('treeContainer'),
        hasSearchInput: !!byId('searchInput'),
        hasConfigToggle: !!byId('configToggle'),
        hasSearchCount: !!byId('searchCount'),
        hasEmptyState: !!byId('emptyState'),
        hasLoadError: !!byId('loadError')
      }
    }

    // [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_SNAPSHOT] [IMPL-SIDE_PANEL_BROWSER_TABS] browserTabsTab: root #browserTabsPanel, layout (above-list + list-section), scope toggle, filter, copy/close, list, Gather/Distribute, Elements, sections
    const browserTabsRoot = document.getElementById('browserTabsPanel')
    let browserTabsTab
    if (!browserTabsRoot) {
      browserTabsTab = { panelPresent: false }
    } else {
      const scopeRadios = browserTabsRoot.querySelectorAll('input[name="browserTabsWindowScope"]')
      const firstCard = browserTabsRoot.querySelector('.browser-tabs-card')
      const hasIdsInFirstCard = firstCard && !!firstCard.querySelector('.browser-tabs-card-ids')
      const sections = browserTabsRoot.querySelectorAll('.browser-tabs-section, section[aria-label]')
      browserTabsTab = {
        panelPresent: true,
        hasAboveList: !!browserTabsRoot.querySelector('.browser-tabs-above-list'),
        hasListSection: !!browserTabsRoot.querySelector('.browser-tabs-list-section'),
        hasWindowScopeToggle: scopeRadios && scopeRadios.length >= 2,
        hasFilterInput: !!browserTabsRoot.querySelector('#browserTabsFilterInput') || !!document.getElementById('browserTabsFilterInput'),
        hasCopyButton: !!browserTabsRoot.querySelector('[data-action="copyUrls"]') || !!browserTabsRoot.querySelector('#browserTabsCopyBtn'),
        hasCloseButton: !!browserTabsRoot.querySelector('[data-action="closeTabs"]') || !!browserTabsRoot.querySelector('#browserTabsCloseBtn'),
        hasListContainer: !!browserTabsRoot.querySelector('#browserTabsList') || !!browserTabsRoot.querySelector('.browser-tabs-list'),
        hasIdsInFirstCard,
        hasGatherButton: !!browserTabsRoot.querySelector('[data-action="gatherTabs"]') || !!browserTabsRoot.querySelector('#browserTabsGatherBtn'),
        hasDistributeButton: !!browserTabsRoot.querySelector('[data-action="distributeTabs"]') || !!browserTabsRoot.querySelector('#browserTabsDistributeBtn'),
        hasImportantTagSourcesInput: !!browserTabsRoot.querySelector('#browserTabsImportantTagSources') || !!document.getElementById('browserTabsImportantTagSources'),
        hasControlGroups: !!browserTabsRoot.querySelector('.browser-tabs-control-group'),
        hasSections: sections && sections.length >= 2,
        hasDisplayModeAboveList: (() => {
          const listSection = browserTabsRoot.querySelector('.browser-tabs-list-section')
          return !!(listSection && listSection.querySelector('.browser-tabs-list-display-mode') && listSection.querySelector('#browserTabsList'))
        })(),
        hasStatsLine: !!browserTabsRoot.querySelector('#browserTabsStats') || !!document.getElementById('browserTabsStats')
      }
    }

    // [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [IMPL-SIDE_PANEL_SNAPSHOT] [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS] browserBookmarksTab: root #browserBookmarksPanel, key element presence
    const browserBookmarksRoot = document.getElementById('browserBookmarksPanel')
    let browserBookmarksTab
    if (!browserBookmarksRoot) {
      browserBookmarksTab = { panelPresent: false }
    } else {
      const byId = (id) => document.getElementById(id)
      browserBookmarksTab = {
        panelPresent: true,
        hasSearchInput: !!byId('browserBookmarksSearchInput'),
        hasFolderSelect: !!byId('browserBookmarksFolderSelect'),
        hasSortSelect: !!byId('browserBookmarksSortSelect'),
        hasListContainer: !!byId('browserBookmarksList'),
        hasSelectAllBtn: !!byId('browserBookmarksSelectAllBtn'),
        hasUndoBar: !!byId('browserBookmarksUndoBar'),
        hasImportFolderSelect: !!byId('browserBookmarksImportFolderSelect'),
        hasExportHtmlBtn: !!byId('browserBookmarksExportHtmlBtn'),
        hasExportCsvBtn: !!byId('browserBookmarksExportCsvBtn')
      }
    }

    return { bookmarkTab, tagsTreeTab, browserTabsTab, browserBookmarksTab }
  })
}
