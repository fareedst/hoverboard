/**
 * [IMPL-PLAYWRIGHT_E2E_EXTENSION] [REQ-UI_INSPECTION] [ARCH-UI_TESTABILITY]
 * E2E: Load unpacked extension, open popup, assert popup loads and shows expected structure.
 * Run with: npx playwright test --project=extension
 */

import { test, expect, getExtensionId } from './extension-fixture.js'

test.describe('[IMPL-PLAYWRIGHT_E2E_EXTENSION] Extension popup E2E', () => {
  test('popup opens and shows root structure after extension loads', async ({ context }) => {
    const extensionId = await getExtensionId(context)
    const popupPage = await context.newPage()
    await popupPage.goto(`chrome-extension://${extensionId}/src/ui/popup/popup.html`)
    await popupPage.waitForLoadState('domcontentloaded')
    await popupPage.waitForTimeout(2000)
    await expect(popupPage.locator('body#hoverboard-popup')).toBeVisible()
    await expect(popupPage.locator('#popupMain, main.popup-main')).toBeVisible()
    await popupPage.close()
  })
})
