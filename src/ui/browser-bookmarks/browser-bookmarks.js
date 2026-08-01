/**
 * [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS]
 * Standalone Browser Bookmarks page entry.
 */
import { initBrowserBookmarksTab } from './browser-bookmarks-panel.js'
import { initToolPageVersion } from '../styles/tool-page-version.js'

/**
 * === IMPL-FULL-BLOCK: IMPL-SIDE_PANEL_BROWSER_BOOKMARKS ===
 * [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [ARCH-SIDE_PANEL_BROWSER_BOOKMARKS] [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS] [IMPL-NON_WEB_TOOLS_TOOLBAR] How: browser-bookmarks.js DOMContentLoaded → initToolPageVersion + initBrowserBookmarksTab(); SW/command/tools toolbar open via tabs.create.
 *
 * ## INIT_BROWSER_BOOKMARKS_PAGE
 *
 * - Contract:
 *   - INPUT: DOMContentLoaded on browser-bookmarks.html; or SW tabs.create URL
 *   - PRE: tool page shell with #browserBookmarksPanel in DOM when init runs
 *   - OUTPUT: page chrome versioned; Chrome tree UI initialized on standalone page
 *   - POST: side panel has no Bookmarks tab button
 *   - EFFECTS: IO (tabs.create from SW/toolbar; bookmarks API from page)
 *   - TERMINATION: total
 * - PROCEDURE: INIT_BROWSER_BOOKMARKS_PAGE
 *   - ON DOMContentLoaded: initToolPageVersion(); initBrowserBookmarksTab()
 *   - ON command open-side-panel-browser-bookmarks OR tools-toolbar btn-browser-bookmarks: tabs.create(getURL('src/ui/browser-bookmarks/browser-bookmarks.html'))
 *
 * === END IMPL-FULL-BLOCK: IMPL-SIDE_PANEL_BROWSER_BOOKMARKS ===
 */
export function bindBrowserBookmarksPage () {
  initToolPageVersion()
  initBrowserBookmarksTab()
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', bindBrowserBookmarksPage)
}
