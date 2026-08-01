/**
 * [REQ-NON_WEB_TOOLS_TOOLBAR] [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [REQ-BOOKMARK_USAGE_TRACKING]
 * [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS] [IMPL-BOOKMARK_USAGE_TRACKING_UI]
 * Composition: standalone page bind helpers → initToolPageVersion + page init.
 * No Playwright / no HTML navigation.
 */

import { jest, describe, test, expect, beforeEach } from '@jest/globals'

const mockInitBrowserBookmarksTab = jest.fn()
const mockInitVisitHistoryPage = jest.fn()
const mockInitToolPageVersion = jest.fn()

jest.mock('../../src/ui/browser-bookmarks/browser-bookmarks-panel.js', () => ({
  initBrowserBookmarksTab: (...args) => mockInitBrowserBookmarksTab(...args)
}))
jest.mock('../../src/ui/visit-history/visit-history-panel.js', () => ({
  initVisitHistoryPage: (...args) => mockInitVisitHistoryPage(...args)
}))
jest.mock('../../src/ui/styles/tool-page-version.js', () => ({
  initToolPageVersion: (...args) => mockInitToolPageVersion(...args)
}))

import { bindBrowserBookmarksPage } from '../../src/ui/browser-bookmarks/browser-bookmarks.js'
import { bindVisitHistoryPage } from '../../src/ui/visit-history/visit-history.js'

describe('[REQ-SIDE_PANEL_BROWSER_BOOKMARKS] Browser Bookmarks page entry composition', () => {
  beforeEach(() => {
    mockInitBrowserBookmarksTab.mockClear()
    mockInitToolPageVersion.mockClear()
  })

  test('bindBrowserBookmarksPage calls initToolPageVersion and initBrowserBookmarksTab', () => {
    bindBrowserBookmarksPage()
    expect(mockInitToolPageVersion).toHaveBeenCalledTimes(1)
    expect(mockInitBrowserBookmarksTab).toHaveBeenCalledTimes(1)
  })
})

describe('[REQ-BOOKMARK_USAGE_TRACKING] Visit History page entry composition', () => {
  beforeEach(() => {
    mockInitVisitHistoryPage.mockClear()
    mockInitToolPageVersion.mockClear()
  })

  test('bindVisitHistoryPage calls initToolPageVersion and initVisitHistoryPage', () => {
    bindVisitHistoryPage()
    expect(mockInitToolPageVersion).toHaveBeenCalledTimes(1)
    expect(mockInitVisitHistoryPage).toHaveBeenCalledTimes(1)
  })
})
