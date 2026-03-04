/**
 * [PROC-DEMO_RECORDING] [IMPL-DEMO_OVERLAY] [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS]
 * E2E demo: side panel Tabs tab — open panel, switch to Tabs, (optional) filter, Copy Records.
 * Run with video on to capture WebM for GIF: npx playwright test -c playwright.demo.config.js
 */

import { test, expect, getExtensionId } from './extension-fixture.js'

test.describe('[PROC-DEMO_RECORDING] [IMPL-DEMO_OVERLAY] Side panel Tabs — find and export', () => {
  // [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] Assert Tabs panel: list, filter, Copy Records flow (demo script relies on same selectors).
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

  // [IMPL-DEMO_OVERLAY] [REQ-SIDE_PANEL_BROWSER_TABS] [PROC-DEMO_RECORDING] Panel opened with stored browserTabs tab shows filter and Copy Records (demo script relies on this).
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
})
