/**
 * [REQ-THIS_PAGE_TAG_SORT] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [ARCH-THIS_PAGE_TAG_SORT] [IMPL-THIS_PAGE_TAG_SORT] [IMPL-PLAYWRIGHT_E2E_EXTENSION]
 *
 * Phase H (PROC-IMPL_CODE_TEST_SYNC): behavior that requires real UI invocation — not a substitute
 * for composition tests (Phase G).
 *
 * IMPL-THIS_PAGE_TAG_SORT.phase_h_e2e_only_surface: testability e2e_only; e2e_only_reason names the
 * platform constraint: Chromium MV3 chrome-extension:// side panel loads the production bundle in
 * the extension origin; JSDOM cannot load unpacked extension HTML, reproduce the side-panel host
 * (layout, hit targets, focus), or exercise chrome.runtime in that document.
 *
 * Essence_pseudocode procedure: side_panel_tag_sort_toolbar_e2e (toolbar visible; aria-pressed on segment click).
 *
 * Composition-level coverage (insufficient here): tests/integration/this-page-tag-sort-composition.integration.test.js
 * (PopupController ordering; [data-sort-mode] → setTagSortMode without chrome-extension:// document).
 */

import { test, expect, getExtensionId } from './extension-fixture.js'

test.describe('[REQ-THIS_PAGE_TAG_SORT] [IMPL-THIS_PAGE_TAG_SORT] Side panel tag sort toolbar', () => {
  /** Maps to IMPL essence_pseudocode side_panel_tag_sort_toolbar_e2e; requires real extension page + pointer. */
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
