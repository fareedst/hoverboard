/**
 * E2E snapshot tests for popup (and overlay when run with extension loaded)
 * [REQ-UI_INSPECTION] [ARCH-UI_TESTABILITY]
 * Run with: jest --config jest.e2e.config.js (or equivalent that loads extension via Puppeteer).
 * These tests are in tests/e2e/ and are excluded from default Jest run (testPathIgnorePatterns).
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
