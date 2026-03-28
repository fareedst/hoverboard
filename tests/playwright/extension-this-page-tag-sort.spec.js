/**
 * [REQ-THIS_PAGE_TAG_SORT] [IMPL-THIS_PAGE_TAG_SORT] [IMPL-PLAYWRIGHT_E2E_EXTENSION]
 *
 * Phase H — E2E-only surface: real Chromium MV3 extension side panel page
 * (chrome-extension://…/side-panel.html) with production side-panel.js/css and extension origin.
 *
 * e2e_only_reason (named platform constraint): JSDOM and Node composition tests cannot load
 * unpacked extension documents, reproduce the Chromium side-panel host, or run the bundled panel
 * entry against real chrome.* in that context. Sort-toggle *binding* logic is covered without UI
 * in tests/integration/this-page-tag-sort-composition.integration.test.js.
 *
 * This spec asserts the toolbar is visible after mainInterface shows and that clicking Frequency
 * updates aria-pressed (real pointer + layout + bundled UIManager event path).
 */

import { test, expect, getExtensionId } from './extension-fixture.js'

test.describe('[REQ-THIS_PAGE_TAG_SORT] [IMPL-THIS_PAGE_TAG_SORT] Side panel tag sort toolbar', () => {
  test('tag sort toggle visible in extension panel; Frequency click updates aria-pressed', async ({ context }) => {
    const extensionId = await getExtensionId(context)

    const contentPage = await context.newPage()
    await contentPage.goto('https://example.com/')
    await contentPage.waitForLoadState('domcontentloaded')

    const sidePanelPage = await context.newPage()
    await sidePanelPage.goto(`chrome-extension://${extensionId}/src/ui/side-panel/side-panel.html`)
    await sidePanelPage.waitForLoadState('domcontentloaded')

    await sidePanelPage.locator('#bookmarkPanel [data-popup-ref="mainInterface"]:not(.hidden)').waitFor({
      state: 'visible',
      timeout: 15000
    })

    const toggle = sidePanelPage.locator('[data-popup-ref="tagSortToggle"]')
    await expect(toggle).toBeVisible()

    const az = sidePanelPage.locator('[data-sort-mode="alphabetical"]')
    const freq = sidePanelPage.locator('[data-sort-mode="frequency"]')
    await expect(az).toHaveAttribute('aria-pressed', 'true')
    await expect(freq).toHaveAttribute('aria-pressed', 'false')

    await freq.click()
    await expect(freq).toHaveAttribute('aria-pressed', 'true')
    await expect(az).toHaveAttribute('aria-pressed', 'false')

    await sidePanelPage.close()
    await contentPage.close()
  })
})
