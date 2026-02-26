/**
 * E2E snapshot helpers for popup, overlay, options, and side panel pages
 * [REQ-UI_INSPECTION] [ARCH-UI_TESTABILITY] [IMPL-SIDE_PANEL_SNAPSHOT]
 * Use with Puppeteer/Playwright page instances when extension is loaded.
 */

/**
 * Snapshot popup UI state (loading, error, or main interface with key elements).
 * @param {import('puppeteer').Page} page - Page that has been navigated to the popup (chrome-extension://id/.../popup.html)
 * @returns {Promise<{ screen: string, loadingVisible: boolean, errorVisible: boolean, mainVisible: boolean, errorMessage?: string }>}
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
 * @returns {Promise<{ bookmarkTab: { panelPresent: boolean, screen?: string, loadingVisible?: boolean, errorVisible?: boolean, mainVisible?: boolean, errorMessage?: string }, tagsTreeTab: { panelPresent: boolean, hasTagSelector?: boolean, hasTreeContainer?: boolean, hasSearchInput?: boolean, hasConfigToggle?: boolean, hasSearchCount?: boolean, hasEmptyState?: boolean, hasLoadError?: boolean } }>}
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

    return { bookmarkTab, tagsTreeTab }
  })
}
