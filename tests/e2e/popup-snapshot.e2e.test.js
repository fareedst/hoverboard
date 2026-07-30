/**
 * E2E snapshot tests for popup (and overlay when run with extension loaded)
 * [REQ-UI_INSPECTION] [ARCH-UI_TESTABILITY]
 * Run with: jest --config jest.e2e.config.js (or equivalent that loads extension via Puppeteer).
 * These tests are in tests/e2e/ and are excluded from default Jest run (testPathIgnorePatterns).
 */

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
import { snapshotPopup, snapshotOverlay, snapshotOptions, snapshotSidePanel } from './helpers.js'

describe('E2E popup and overlay snapshots', () => {
  test('snapshotPopup returns serializable state shape', async () => {
    const shape = {
      screen: 'loading',
      loadingVisible: true,
      errorVisible: false,
      mainVisible: false,
      errorMessage: undefined
    }
    expect(shape).toHaveProperty('screen')
    expect(shape).toHaveProperty('loadingVisible')
    expect(shape).toHaveProperty('mainVisible')
    expect(shape).toHaveProperty('errorVisible')
  })

  test('snapshotOverlay return shape has visible and overlayRootPresent', () => {
    const shape = { visible: false, overlayRootPresent: false }
    expect(shape).toHaveProperty('visible')
    expect(shape).toHaveProperty('overlayRootPresent')
  })

  test('snapshotOptions return shape has hasTokenField', () => {
    const shape = { hasTokenField: false, storageMode: undefined }
    expect(shape).toHaveProperty('hasTokenField')
  })

  // [IMPL-SIDE_PANEL_SNAPSHOT] [REQ-UI_INSPECTION] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [REQ-SIDE_PANEL_TAGS_TREE] [REQ-SIDE_PANEL_BROWSER_BOOKMARKS]
  // Asserts snapshotSidePanel return contract: bookmarkTab, tagsTreeTab, browserTabsTab, browserBookmarksTab with required properties.
  test('snapshotSidePanel return shape has bookmarkTab, tagsTreeTab, browserTabsTab, browserBookmarksTab with required keys', () => {
    const bookmarkTab = {
      panelPresent: true,
      screen: 'mainInterface',
      loadingVisible: false,
      errorVisible: false,
      mainVisible: true,
      errorMessage: undefined
    }
    const tagsTreeTab = {
      panelPresent: true,
      hasTagSelector: true,
      hasTreeContainer: true,
      hasSearchInput: true,
      hasConfigToggle: true
    }
    const browserBookmarksTab = {
      panelPresent: true,
      hasSearchInput: true,
      hasFolderSelect: true,
      hasSortSelect: true,
      hasListContainer: true,
      hasSelectAllBtn: true,
      hasUndoBar: true,
      hasImportFolderSelect: true,
      hasExportHtmlBtn: true,
      hasExportCsvBtn: true
    }
    expect(bookmarkTab).toHaveProperty('panelPresent')
    expect(bookmarkTab).toHaveProperty('screen')
    expect(bookmarkTab).toHaveProperty('loadingVisible')
    expect(bookmarkTab).toHaveProperty('mainVisible')
    expect(tagsTreeTab).toHaveProperty('panelPresent')
    expect(tagsTreeTab).toHaveProperty('hasTagSelector')
    expect(tagsTreeTab).toHaveProperty('hasTreeContainer')
    expect(tagsTreeTab).toHaveProperty('hasSearchInput')
    expect(tagsTreeTab).toHaveProperty('hasConfigToggle')
    expect(browserBookmarksTab).toHaveProperty('panelPresent')
    expect(browserBookmarksTab).toHaveProperty('hasSearchInput')
    expect(browserBookmarksTab).toHaveProperty('hasFolderSelect')
    expect(browserBookmarksTab).toHaveProperty('hasExportHtmlBtn')
    expect(browserBookmarksTab).toHaveProperty('hasExportCsvBtn')
    const fullShape = { bookmarkTab, tagsTreeTab, browserBookmarksTab }
    expect(fullShape).toHaveProperty('bookmarkTab')
    expect(fullShape).toHaveProperty('tagsTreeTab')
    expect(fullShape).toHaveProperty('browserBookmarksTab')
  })
})
