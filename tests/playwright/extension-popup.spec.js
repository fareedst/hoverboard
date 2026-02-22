/**
 * [IMPL-PLAYWRIGHT_E2E_EXTENSION] [REQ-UI_INSPECTION] [ARCH-UI_TESTABILITY]
 * E2E: Load unpacked extension, open popup, assert popup loads and shows expected structure.
 * Run with: npx playwright test --project=extension
 */

import path from 'path'
import { fileURLToPath } from 'url'
import { test as base, expect } from '@playwright/test'
import { chromium } from 'playwright'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const pathToExtension = path.join(__dirname, '../../dist')

const test = base.extend({
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      channel: 'chromium',
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    })
    await use(context)
    await context.close()
  },
})

test.describe('[IMPL-PLAYWRIGHT_E2E_EXTENSION] Extension popup E2E', () => {
  test('popup opens and shows root structure after extension loads', async ({ context }) => {
    const worker = await context.waitForEvent('serviceworker', { timeout: 10000 }).catch(() => null)
    let extensionId = null
    if (worker && worker.url()) {
      const match = worker.url().match(/chrome-extension:\/\/([a-z]{32})\//)
      if (match) extensionId = match[1]
    }
    if (!extensionId && context.serviceWorkers().length > 0) {
      const sw = context.serviceWorkers()[0]
      if (sw && sw.url()) {
        const match = sw.url().match(/chrome-extension:\/\/([a-z]{32})\//)
        if (match) extensionId = match[1]
      }
    }
    expect(extensionId, 'Extension ID should be discoverable from service worker').toBeTruthy()
    const popupPage = await context.newPage()
    await popupPage.goto(`chrome-extension://${extensionId}/src/ui/popup/popup.html`)
    await popupPage.waitForLoadState('domcontentloaded')
    await popupPage.waitForTimeout(2000)
    await expect(popupPage.locator('body#hoverboard-popup')).toBeVisible()
    await expect(popupPage.locator('#popupMain, main.popup-main')).toBeVisible()
    await popupPage.close()
  })
})
