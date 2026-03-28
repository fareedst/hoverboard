/**
 * [PROC-DEMO_RECORDING] [IMPL-DEMO_OVERLAY] [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS]
 * E2E demo + Phase H (phase_h_browser_tabs_extension_side_panel): real chrome-extension:// side-panel.html,
 * live chrome.tabs + SW messaging, extension layout/scroll — see IMPL-SIDE_PANEL_BROWSER_TABS.e2e_only_reason.
 * Composition tests cannot substitute: they mock chrome and panel init; they do not load the MV3 extension document.
 * Run with video on to capture WebM for GIF: npx playwright test -c playwright.demo.config.js
 */

import { test, expect, getExtensionId } from './extension-fixture.js'

test.describe('[PROC-DEMO_RECORDING] [IMPL-DEMO_OVERLAY] Side panel Tabs — find and export', () => {
  // [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] phase_h_browser_tabs_extension_side_panel — E2E-only (named platform: real extension page + live APIs). Composition mocks panel/chrome; cannot assert clipboard feedback in real side panel document.
  test('Tabs tab: open panel, switch to Tabs, wait for list, optional filter, Copy Records', async ({
    context,
  }) => {
    const extensionId = await getExtensionId(context)
    const sidePanelPage = await context.newPage()

    // 1. Open side panel (as standalone page)
    await sidePanelPage.goto(
      `chrome-extension://${extensionId}/src/ui/side-panel/side-panel.html`
    )
    await sidePanelPage.waitForLoadState('domcontentloaded')
    await sidePanelPage.waitForTimeout(1500)

    // 2. Click Tabs tab
    await sidePanelPage.locator('.side-panel-tab[data-tab="browserTabs"]').click()
    await sidePanelPage.waitForTimeout(2000)

    // 3. Wait for tab list or empty state
    const list = sidePanelPage.locator('#browserTabsList')
    const message = sidePanelPage.locator('#browserTabsMessage')
    await expect(
      sidePanelPage.locator('#browserTabsPanel:not([hidden])')
    ).toBeVisible()
    await expect(
      sidePanelPage.locator('#browserTabsList, .browser-tabs-list')
    ).toBeAttached()

    // 4. Optional: type in filter to "find" a subset (brief query)
    const filterInput = sidePanelPage.locator('#browserTabsFilterInput')
    if (await filterInput.isVisible()) {
      await filterInput.fill('')
      await sidePanelPage.waitForTimeout(300)
    }

    // 5. Click Copy Records (export visible tabs as YAML)
    const copyRecordsBtn = sidePanelPage.locator(
      '[data-action="copyRecords"], #browserTabsCopyRecordsBtn'
    )
    await expect(copyRecordsBtn).toBeVisible()
    await copyRecordsBtn.click()
    await sidePanelPage.waitForTimeout(800)

    // 6. Assert feedback (Copied N records, or Clipboard not available in headless)
    const messageText = (await message.textContent()) || ''
    const hasFeedback =
      /Copied \d+ record/.test(messageText) ||
      messageText.includes('Clipboard not available') ||
      messageText.includes('record')
    expect(hasFeedback).toBe(true)

    await sidePanelPage.close()
  })

  // [IMPL-DEMO_OVERLAY] [REQ-SIDE_PANEL_BROWSER_TABS] [PROC-DEMO_RECORDING] phase_h_browser_tabs_extension_side_panel — E2E-only: chrome.storage.local + full page load order for default tab; composition does not run options→storage→side-panel.html as one extension session.
  test('Tabs panel shows filter and Copy Records when opened with hoverboard_sidepanel_active_tab=browserTabs', async ({ context }) => {
    const extensionId = await getExtensionId(context)
    const optionsPage = await context.newPage()
    await optionsPage.goto(`chrome-extension://${extensionId}/src/ui/options/options.html`, { waitUntil: 'domcontentloaded' })
    await optionsPage.evaluate(() => {
      return new Promise((resolve) => {
        chrome.storage.local.set({ hoverboard_sidepanel_active_tab: 'browserTabs' }, () => resolve())
      })
    })
    await optionsPage.close()

    const sidePanelPage = await context.newPage()
    await sidePanelPage.goto(`chrome-extension://${extensionId}/src/ui/side-panel/side-panel.html`)
    await sidePanelPage.waitForLoadState('domcontentloaded')
    await sidePanelPage.waitForTimeout(2000)

    await expect(sidePanelPage.locator('#browserTabsPanel:not([hidden])')).toBeVisible()
    await expect(sidePanelPage.locator('#browserTabsFilterInput')).toBeVisible()
    await expect(sidePanelPage.locator('[data-action="copyRecords"], #browserTabsCopyRecordsBtn')).toBeVisible()
    await sidePanelPage.close()
  })

  // [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] phase_h_browser_tabs_extension_side_panel — E2E-only (IMPL e2e_only_reason: real chrome-extension:// bundle, live chrome.tabs + messaging, flex/scroll DOM). Composition tests wire initBrowserTabsTab with mocks and never render list against real browser tab IDs or re-paint display mode in an MV3 side panel.
  test('Tabs tab: stats line, batch Tags row, and display mode Title vs Block in extension page', async ({
    context,
  }) => {
    const extensionId = await getExtensionId(context)
    const sidePanelPage = await context.newPage()
    await sidePanelPage.goto(
      `chrome-extension://${extensionId}/src/ui/side-panel/side-panel.html`
    )
    await sidePanelPage.waitForLoadState('domcontentloaded')
    await sidePanelPage.waitForTimeout(1500)

    await sidePanelPage.locator('.side-panel-tab[data-tab="browserTabs"]').click()
    await sidePanelPage.waitForTimeout(2000)

    await expect(sidePanelPage.locator('#browserTabsPanel:not([hidden])')).toBeVisible()
    const stats = sidePanelPage.locator('#browserTabsStats')
    await expect(stats).toBeVisible()
    await expect(stats).toContainText(/Windows:/i)
    await expect(stats).toContainText(/Tabs:/i)

    await expect(sidePanelPage.locator('#browserTabsTagsInput')).toBeVisible()
    await expect(
      sidePanelPage.locator('input[name="browserTabsListDisplayMode"]')
    ).toHaveCount(3)

    const cardCount = await sidePanelPage.locator('#browserTabsList .browser-tabs-card').count()
    if (cardCount > 0) {
      const blockCard = sidePanelPage.locator('#browserTabsList .browser-tabs-card').first()
      await expect(blockCard.locator('.browser-tabs-card-tags')).toBeVisible()
      await sidePanelPage.locator('#browserTabsListDisplayTitle').click()
      await sidePanelPage.waitForTimeout(400)
      const titleCard = sidePanelPage.locator('#browserTabsList .browser-tabs-card').first()
      await expect(titleCard.locator('.browser-tabs-card-tags')).toHaveCount(0)
      await expect(
        titleCard.locator('.browser-tabs-card-title.browser-tabs-card-focus-link, .browser-tabs-card-title')
      ).toBeVisible()

      await sidePanelPage.locator('#browserTabsListDisplayBlock').click()
      await sidePanelPage.waitForTimeout(400)
      const blockAgain = sidePanelPage.locator('#browserTabsList .browser-tabs-card').first()
      await expect(blockAgain.locator('.browser-tabs-card-tags')).toBeVisible()
    }

    await sidePanelPage.close()
  })
})
