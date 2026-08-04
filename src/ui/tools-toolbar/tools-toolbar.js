/**
 * [REQ-NON_WEB_TOOLS_TOOLBAR] [ARCH-NON_WEB_TOOLS_TOOLBAR] [IMPL-NON_WEB_TOOLS_TOOLBAR] [REQ-BOOKMARK_USAGE_TRACKING]
 * Tools toolbar: launch Index, Browser Import source, Options, Browser Bookmarks, Visit History.
 * Do not import message-handler.js — it pulls pinboard/fast-xml-parser (bare specifier fails in unbundled popup).
 * OPEN_BOOKMARKS_INDEX string matches MESSAGE_TYPES.OPEN_BOOKMARKS_INDEX [REQ-EXTENSION_BUNDLED_ENTRY_POINTS].
 */
const OPEN_BOOKMARKS_INDEX = 'OPEN_BOOKMARKS_INDEX'

function getURL (path) {
  return typeof chrome !== 'undefined' && chrome.runtime?.getURL
    ? chrome.runtime.getURL(path)
    : path
}

function openTab (path) {
  const url = getURL(path)
  if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
    chrome.tabs.create({ url })
  }
}

/**
 * === IMPL-FULL-BLOCK: IMPL-NON_WEB_TOOLS_TOOLBAR ===
 * [IMPL-NON_WEB_TOOLS_TOOLBAR] [ARCH-NON_WEB_TOOLS_TOOLBAR] [REQ-NON_WEB_TOOLS_TOOLBAR] [REQ-BOOKMARK_USAGE_TRACKING] How: Wire five launchers; Index via sendMessage; Browser Import source/Browser Bookmarks/Visit History via tabs.create; Options via openOptionsPage.
 *
 * ## TOOLS_TOOLBAR_PAGE
 *
 * - Contract:
 *   - INPUT: toolbar button clicks
 *   - PRE: tools-toolbar.html buttons present in document
 *   - OUTPUT: Index via sendMessage OPEN_BOOKMARKS_INDEX; Browser Import source/Browser Bookmarks/Visit History via tabs.create; Options via openOptionsPage
 *   - POST: no bare npm module specifiers in tools-toolbar.js import graph
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: TOOLS_TOOLBAR_PAGE
 *   - IF typeof document === 'undefined': skip auto-bind (import-safe for composition tests)
 *   - ON btn-bookmarks-index: runtime.sendMessage({ type: OPEN_BOOKMARKS_INDEX })
 *   - ON btn-browser-import: tabs.create(getURL(bookmarks-table.html?source=browser))
 *   - ON btn-options: runtime.openOptionsPage()
 *   - ON btn-browser-bookmarks: tabs.create(getURL(browser-bookmarks.html))
 *   - ON btn-visit-history: tabs.create(getURL(visit-history.html))
 *
 * === END IMPL-FULL-BLOCK: IMPL-NON_WEB_TOOLS_TOOLBAR ===
 */
export function bindToolsToolbarLaunchers (doc) {
  const root = doc ?? (typeof document !== 'undefined' ? document : null)
  if (!root?.getElementById) return

  root.getElementById('btn-bookmarks-index')?.addEventListener('click', () => {
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ type: OPEN_BOOKMARKS_INDEX })
    }
  })

  root.getElementById('btn-browser-import')?.addEventListener('click', () => {
    openTab('src/ui/bookmarks-table/bookmarks-table.html?source=browser')
  })

  root.getElementById('btn-options')?.addEventListener('click', () => {
    if (typeof chrome !== 'undefined' && chrome.runtime?.openOptionsPage) {
      chrome.runtime.openOptionsPage()
    }
  })

  root.getElementById('btn-browser-bookmarks')?.addEventListener('click', () => {
    openTab('src/ui/browser-bookmarks/browser-bookmarks.html')
  })

  root.getElementById('btn-visit-history')?.addEventListener('click', () => {
    openTab('src/ui/visit-history/visit-history.html')
  })
}

if (typeof document !== 'undefined') {
  bindToolsToolbarLaunchers(document)
}
