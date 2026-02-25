/**
 * [IMPL-PLAYWRIGHT_E2E_EXTENSION] [REQ-UI_INSPECTION] [ARCH-UI_TESTABILITY]
 * Shared fixture and helpers for extension E2E: launch context with unpacked extension, resolve extension ID.
 */

import path from 'path'
import { fileURLToPath } from 'url'
import { test as base, expect } from '@playwright/test'
import { chromium } from 'playwright'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const pathToExtension = path.join(__dirname, '../../dist')

/**
 * Get the extension ID from a persistent context that has the extension loaded.
 * Waits for the service worker to be available and parses its URL.
 * @param {import('@playwright/test').BrowserContext} context
 * @param {{ timeout?: number }} [options]
 * @returns {Promise<string>} Extension ID (32-char string)
 */
export async function getExtensionId (context, options = {}) {
  const timeout = options.timeout ?? 15000
  const worker = await context.waitForEvent('serviceworker', { timeout }).catch(() => null)
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
  return extensionId
}

/**
 * Launch a persistent context with the Hoverboard extension loaded.
 * Use for tests that need a fresh context (e.g. messaging, evaluation).
 */
export async function launchExtensionContext (opts = {}) {
  const { headless = false } = opts
  return chromium.launchPersistentContext('', {
    headless,
    channel: 'chromium',
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
    ],
  })
}

/**
 * Base test with extension context. Use test.extend({ context: ... }) in specs.
 */
const extensionContextFixture = async ({}, use) => {
  const context = await launchExtensionContext()
  await use(context)
  await context.close()
}

export const test = base.extend({
  context: extensionContextFixture,
})

export { expect }
