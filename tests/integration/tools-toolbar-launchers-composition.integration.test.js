/**
 * [REQ-NON_WEB_TOOLS_TOOLBAR] [ARCH-NON_WEB_TOOLS_TOOLBAR] [IMPL-NON_WEB_TOOLS_TOOLBAR] [REQ-BOOKMARK_USAGE_TRACKING]
 * Composition: tools-toolbar button click → sendMessage / tabs.create / openOptionsPage.
 * No Playwright / no action.openPopup gesture.
 */

import { jest, describe, test, expect, beforeEach } from '@jest/globals'
import { bindToolsToolbarLaunchers } from '../../src/ui/tools-toolbar/tools-toolbar.js'

describe('[REQ-NON_WEB_TOOLS_TOOLBAR] tools toolbar launcher composition', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <button id="btn-bookmarks-index" type="button">Local Bookmarks Index</button>
      <button id="btn-browser-import" type="button">Browser Bookmark Import</button>
      <button id="btn-options" type="button">Options</button>
      <button id="btn-browser-bookmarks" type="button">Browser Bookmarks</button>
      <button id="btn-visit-history" type="button">Visit History</button>
    `
    global.chrome.runtime.sendMessage = jest.fn()
    global.chrome.runtime.openOptionsPage = jest.fn()
    global.chrome.runtime.getURL = jest.fn((p) => `chrome-extension://test-id/${p}`)
    global.chrome.tabs.create = jest.fn()
  })

  test('Index button sends OPEN_BOOKMARKS_INDEX', () => {
    bindToolsToolbarLaunchers(document)
    document.getElementById('btn-bookmarks-index').click()
    expect(global.chrome.runtime.sendMessage).toHaveBeenCalledWith({ type: 'OPEN_BOOKMARKS_INDEX' })
  })

  test('Import button opens the Index Browser source', () => {
    bindToolsToolbarLaunchers(document)
    document.getElementById('btn-browser-import').click()
    expect(global.chrome.tabs.create).toHaveBeenCalledWith({
      url: 'chrome-extension://test-id/src/ui/bookmarks-table/bookmarks-table.html?source=browser'
    })
  })

  test('Options button calls openOptionsPage', () => {
    bindToolsToolbarLaunchers(document)
    document.getElementById('btn-options').click()
    expect(global.chrome.runtime.openOptionsPage).toHaveBeenCalled()
  })

  test('Browser Bookmarks button opens browser-bookmarks.html', () => {
    bindToolsToolbarLaunchers(document)
    document.getElementById('btn-browser-bookmarks').click()
    expect(global.chrome.tabs.create).toHaveBeenCalledWith({
      url: 'chrome-extension://test-id/src/ui/browser-bookmarks/browser-bookmarks.html'
    })
  })

  test('Visit History button opens visit-history.html', () => {
    bindToolsToolbarLaunchers(document)
    document.getElementById('btn-visit-history').click()
    expect(global.chrome.tabs.create).toHaveBeenCalledWith({
      url: 'chrome-extension://test-id/src/ui/visit-history/visit-history.html'
    })
  })
})
