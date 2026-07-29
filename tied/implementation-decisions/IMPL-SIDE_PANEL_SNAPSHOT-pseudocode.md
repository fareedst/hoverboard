# [IMPL-SIDE_PANEL_SNAPSHOT] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [REQ-SIDE_PANEL_TAGS_TREE]
# This block defines the side panel snapshot helper: one function returning bookmarkTab and tagsTreeTab shapes.
# Implements REQ-UI_INSPECTION by providing E2E-inspectable state for side panel; REQ-SIDE_PANEL_POPUP_EQUIVALENT (Bookmark tab) and REQ-SIDE_PANEL_TAGS_TREE (Tags tree tab) by capturing key elements per tab.

INPUT: page (Playwright/Puppeteer page navigated to side-panel.html)
OUTPUT: { bookmarkTab: {...}, tagsTreeTab: {...}, browserTabsTab: {...}, browserBookmarksTab: { panelPresent, hasSearchInput?, hasFolderSelect?, hasSortSelect?, hasListContainer?, hasSelectAllBtn?, hasUndoBar?, hasImportFolderSelect?, hasExportHtmlBtn?, hasExportCsvBtn? } }
DATA: document in page context

# [REQ-UI_INSPECTION] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_SNAPSHOT] [IMPL-SIDE_PANEL_BOOKMARK]
# Bookmark tab snapshot: root #bookmarkPanel; query by data-popup-ref for loadingState, errorState, mainInterface; derive visibility and screen. Implements "E2E can capture Bookmark tab state" and "Bookmark tab = popup-equivalent inspectable".
bookmarkTab = (function () {
  const root = document.getElementById('bookmarkPanel')
  if (!root) return { panelPresent: false }
  const loading = root.querySelector('[data-popup-ref="loadingState"]')
  const error = root.querySelector('[data-popup-ref="errorState"]')
  const main = root.querySelector('[data-popup-ref="mainInterface"]')
  const loadingVisible = loading && !loading.classList.contains('hidden')
  const errorVisible = error && !error.classList.contains('hidden')
  const mainVisible = main && !main.classList.contains('hidden')
  let screen = 'unknown'
  if (loadingVisible) screen = 'loading'
  else if (errorVisible) screen = 'error'
  else if (mainVisible) screen = 'mainInterface'
  const errorMsg = root.querySelector('[data-popup-ref="errorMessage"]')
  return { panelPresent: true, screen, loadingVisible, errorVisible, mainVisible, errorMessage: errorMsg ? errorMsg.textContent : undefined }
})()

# [REQ-UI_INSPECTION] [REQ-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_SNAPSHOT] [IMPL-SIDE_PANEL_TAGS_TREE]
# Tags tree tab snapshot: root #tagsTreePanel; presence of #tagSelector, #treeContainer, #searchInput, #configToggle, etc. Implements "E2E can capture Tags tree tab state" and "Tags tree tab structure inspectable".
tagsTreeTab = (function () {
  const root = document.getElementById('tagsTreePanel')
  if (!root) return { panelPresent: false }
  return {
    panelPresent: true,
    hasTagSelector: !!root.querySelector('#tagSelector') || !!document.getElementById('tagSelector'),
    hasTreeContainer: !!root.querySelector('#treeContainer') || !!document.getElementById('treeContainer'),
    hasSearchInput: !!root.querySelector('#searchInput') || !!document.getElementById('searchInput'),
    hasConfigToggle: !!root.querySelector('#configToggle') || !!document.getElementById('configToggle'),
    hasSearchCount: !!root.querySelector('#searchCount') || !!document.getElementById('searchCount'),
    hasEmptyState: !!root.querySelector('#emptyState') || !!document.getElementById('emptyState'),
    hasLoadError: !!root.querySelector('#loadError') || !!document.getElementById('loadError')
  }
})()

# [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_SNAPSHOT] [IMPL-SIDE_PANEL_BROWSER_TABS]
# browserTabsTab snapshot: root #browserTabsPanel; presence of filter input, Copy button, Close button, list container. Implements E2E-inspectable state for Tabs tab.
browserTabsTab = (function () {
  const root = document.getElementById('browserTabsPanel')
  if (!root) return { panelPresent: false }
  return {
    panelPresent: true,
    hasFilterInput: !!root.querySelector('#browserTabsFilterInput') || !!document.getElementById('browserTabsFilterInput'),
    hasCopyButton: !!root.querySelector('[data-action="copyUrls"]') || !!root.querySelector('#browserTabsCopyBtn'),
    hasCloseButton: !!root.querySelector('[data-action="closeTabs"]') || !!root.querySelector('#browserTabsCloseBtn'),
    hasListContainer: !!root.querySelector('#browserTabsList') || !!root.querySelector('.browser-tabs-list')
  }
})()

# [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [IMPL-SIDE_PANEL_SNAPSHOT] [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS]
# browserBookmarksTab snapshot: root #browserBookmarksPanel; presence of search input, folder select, sort select, list container, Select all, Undo bar, Import folder select, Export HTML/CSV buttons. Implements E2E-inspectable state for Bookmarks tab.
browserBookmarksTab = (function () {
  const root = document.getElementById('browserBookmarksPanel')
  if (!root) return { panelPresent: false }
  const byId = (id) => document.getElementById(id)
  return {
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
})()

RETURN { bookmarkTab, tagsTreeTab, browserTabsTab, browserBookmarksTab }
