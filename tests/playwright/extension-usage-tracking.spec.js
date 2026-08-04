/**
 * [IMPL-PLAYWRIGHT_E2E_EXTENSION] [REQ-BOOKMARK_USAGE_TRACKING] [ARCH-BOOKMARK_USAGE_TRACKING_UI] [IMPL-BOOKMARK_USAGE_TRACKING_UI]
 * E2E: Visit History standalone page, bookmarks index Visits/Last Visited columns, and This Page usage section.
 * Run with: npm run test:e2e:extension
 */

import { test, expect, getExtensionId } from './extension-fixture.js'

test.describe('[IMPL-PLAYWRIGHT_E2E_EXTENSION] [REQ-BOOKMARK_USAGE_TRACKING] [IMPL-BOOKMARK_USAGE_TRACKING_UI] Visit History page', () => {
  test('load Visit History page, assert Most Visited / Recently Visited / Navigation Graph sections and Refresh button', async ({ context }) => {
    const extensionId = await getExtensionId(context)
    const page = await context.newPage()
    await page.goto(`chrome-extension://${extensionId}/src/ui/visit-history/visit-history.html`)
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1500)

    await expect(page.locator('#visitHistoryPanel')).toBeVisible()
    await expect(page.locator('.visit-history-title')).toHaveText('Visit History')
    await expect(page.locator('#usage-most-visited-heading')).toHaveText('Most Visited')
    await expect(page.locator('#usage-recently-visited-heading')).toHaveText('Recently Visited')
    await expect(page.locator('#usage-graph-heading')).toHaveText('Navigation Graph')
    await expect(page.locator('[data-usage-refresh]')).toBeVisible()

    await page.close()
  })

  test('side panel has no Visit History tab; legacy usage storage falls back to This Page', async ({ context }) => {
    const extensionId = await getExtensionId(context)
    const optionsPage = await context.newPage()
    await optionsPage.goto(`chrome-extension://${extensionId}/src/ui/options/options.html`, { waitUntil: 'domcontentloaded' })
    await optionsPage.evaluate(() => {
      return new Promise((resolve) => {
        chrome.storage.local.set({ hoverboard_sidepanel_active_tab: 'usage' }, () => resolve())
      })
    })
    await optionsPage.close()

    const sidePanelPage = await context.newPage()
    await sidePanelPage.goto(`chrome-extension://${extensionId}/src/ui/side-panel/side-panel.html`)
    await sidePanelPage.waitForLoadState('domcontentloaded')
    await sidePanelPage.waitForTimeout(2000)

    await expect(sidePanelPage.locator('.side-panel-tab[data-tab="usage"]')).toHaveCount(0)
    await expect(sidePanelPage.locator('#usagePanel')).toHaveCount(0)
    await expect(sidePanelPage.locator('#bookmarkPanel:not([hidden])')).toBeVisible()

    await sidePanelPage.close()
  })
})

// [REQ-NON_WEB_TOOLS_TOOLBAR] [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] Standalone Browser Bookmarks page;
// gesture-bound action.openPopup / sidePanel.open deferred when fixture cannot invoke toolbar click.
test.describe('[IMPL-PLAYWRIGHT_E2E_EXTENSION] [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS] [REQ-NON_WEB_TOOLS_TOOLBAR] Browser Bookmarks page', () => {
  test('load Browser Bookmarks page and assert panel chrome', async ({ context }) => {
    const extensionId = await getExtensionId(context)
    const page = await context.newPage()
    await page.goto(`chrome-extension://${extensionId}/src/ui/browser-bookmarks/browser-bookmarks.html`)
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1500)

    await expect(page.locator('#browserBookmarksPanel')).toBeVisible()
    await expect(page.locator('#browserBookmarksSearchInput')).toBeVisible()
    await expect(page.locator('#browserBookmarksList')).toBeAttached()

    await page.close()
  })

  test('side panel has no Browser Bookmarks tab; legacy browserBookmarks storage falls back to This Page', async ({ context }) => {
    const extensionId = await getExtensionId(context)
    const optionsPage = await context.newPage()
    await optionsPage.goto(`chrome-extension://${extensionId}/src/ui/options/options.html`, { waitUntil: 'domcontentloaded' })
    await optionsPage.evaluate(() => {
      return new Promise((resolve) => {
        chrome.storage.local.set({ hoverboard_sidepanel_active_tab: 'browserBookmarks' }, () => resolve())
      })
    })
    await optionsPage.close()

    const sidePanelPage = await context.newPage()
    await sidePanelPage.goto(`chrome-extension://${extensionId}/src/ui/side-panel/side-panel.html`)
    await sidePanelPage.waitForLoadState('domcontentloaded')
    await sidePanelPage.waitForTimeout(2000)

    await expect(sidePanelPage.locator('.side-panel-tab[data-tab="browserBookmarks"]')).toHaveCount(0)
    await expect(sidePanelPage.locator('#browserBookmarksPanel')).toHaveCount(0)
    await expect(sidePanelPage.locator('#bookmarkPanel:not([hidden])')).toBeVisible()

    await sidePanelPage.close()
  })

  test('tools-toolbar.html exposes five launchers including Browser Bookmarks and Visit History', async ({ context }) => {
    const extensionId = await getExtensionId(context)
    const page = await context.newPage()
    await page.goto(`chrome-extension://${extensionId}/src/ui/tools-toolbar/tools-toolbar.html`)
    await page.waitForLoadState('domcontentloaded')

    await expect(page.locator('#btn-bookmarks-index')).toBeVisible()
    await expect(page.locator('#btn-browser-import')).toBeVisible()
    await expect(page.locator('#btn-options')).toBeVisible()
    await expect(page.locator('#btn-browser-bookmarks')).toBeVisible()
    await expect(page.locator('#btn-visit-history')).toBeVisible()

    await page.close()
  })
})

test.describe('[IMPL-PLAYWRIGHT_E2E_EXTENSION] [REQ-BOOKMARK_USAGE_TRACKING] [IMPL-BOOKMARK_USAGE_TRACKING_UI] Bookmarks index table columns', () => {
  test('open bookmarks index page, assert table has Visits and Last Visited column headers', async ({ context }) => {
    const extensionId = await getExtensionId(context)
    const page = await context.newPage()
    await page.goto(`chrome-extension://${extensionId}/src/ui/bookmarks-table/bookmarks-table.html`)
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(3000)

    const visitsHeader = page.locator('th[data-sort="visits"]')
    const lastVisitedHeader = page.locator('th[data-sort="lastVisited"]')
    await expect(visitsHeader).toBeAttached()
    await expect(lastVisitedHeader).toBeAttached()
    await expect(visitsHeader).toContainText('Visits')
    await expect(lastVisitedHeader).toContainText('Last Visited')

    await page.close()
  })
})

test.describe('[IMPL-PLAYWRIGHT_E2E_EXTENSION] [REQ-BOOKMARK_USAGE_TRACKING] [IMPL-BOOKMARK_USAGE_TRACKING_UI] This Page usage section', () => {
  test('This Page tab has Usage section element (visible when visit data present, hidden otherwise)', async ({ context }) => {
    const extensionId = await getExtensionId(context)
    const sidePanelPage = await context.newPage()
    await sidePanelPage.goto(`chrome-extension://${extensionId}/src/ui/side-panel/side-panel.html`)
    await sidePanelPage.waitForLoadState('domcontentloaded')
    await sidePanelPage.waitForTimeout(2000)

    const bookmarkPanel = sidePanelPage.locator('#bookmarkPanel')
    await expect(bookmarkPanel).toBeVisible()
    const usageSection = sidePanelPage.locator('#bookmarkPanel [data-popup-ref="usageStatsSection"]')
    await expect(usageSection).toBeAttached()
    await expect(usageSection).toHaveAttribute('class', /usage-stats-section/)

    await sidePanelPage.close()
  })
})

// [IMPL-DEMO_OVERLAY] [PROC-DEMO_RECORDING] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_BOOKMARK] Smoke: This Page panel has Quick Actions, Save to, tags, Search Tabs (no footer in side panel).
test.describe('[IMPL-DEMO_OVERLAY] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] This Page panel sections', () => {
  test('bookmark panel has Quick Actions, Storage (Save to), tag sections, Search Tabs; no footer', async ({ context }) => {
    const extensionId = await getExtensionId(context)
    const sidePanelPage = await context.newPage()
    await sidePanelPage.goto(`chrome-extension://${extensionId}/src/ui/side-panel/side-panel.html`)
    await sidePanelPage.waitForLoadState('domcontentloaded')
    await sidePanelPage.waitForTimeout(2000)

    const panel = sidePanelPage.locator('#bookmarkPanel')
    await expect(panel).toBeVisible()
    await sidePanelPage.locator('#bookmarkPanel [data-popup-ref="mainInterface"]:not(.hidden)').waitFor({ state: 'visible', timeout: 10000 }).catch(() => {})
    await expect(panel.locator('[data-popup-ref="mainInterface"]')).toBeAttached()

    await expect(panel.locator('.quick-actions')).toBeAttached()
    await expect(panel.locator('[data-popup-ref="showHoverBtn"]')).toBeAttached()
    await expect(panel.locator('[data-popup-ref="togglePrivateBtn"]')).toBeAttached()
    await expect(panel.locator('[data-popup-ref="toggleReadBtn"]')).toBeAttached()
    await expect(panel.locator('[data-popup-ref="deleteBtn"]')).toBeAttached()

    await expect(panel.locator('.storage-section')).toBeAttached()
    await expect(panel.locator('.storage-label')).toContainText('Save to')
    await expect(panel.locator('[data-popup-ref="storageBackendButtons"]')).toBeAttached()

    await expect(panel.locator('.recent-tags')).toBeAttached()
    await expect(panel.locator('[data-popup-ref="recentTagsContainer"]')).toBeAttached()
    await expect(panel.locator('[data-popup-ref="suggestedTags"]')).toBeAttached()
    await expect(panel.locator('[data-popup-ref="suggestedTagsContainer"]')).toBeAttached()

    await expect(panel.locator('.search-section:not(.library-search-section)')).toBeAttached()
    await expect(panel.locator('[data-popup-ref="searchInput"]')).toBeAttached()
    await expect(panel.locator('[data-popup-ref="searchBtn"]')).toBeAttached()

    await expect(panel.locator('.popup-footer')).toHaveCount(0)

    await sidePanelPage.close()
  })
})
