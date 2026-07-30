/**
 * === IMPL-FULL-BLOCK: IMPL-PLAYWRIGHT_E2E_EXTENSION ===
 * [IMPL-PLAYWRIGHT_E2E_EXTENSION] [ARCH-UI_TESTABILITY] [ARCH-MESSAGE_HANDLING] [REQ-UI_INSPECTION] [REQ-THIS_PAGE_TAG_SORT] [REQ-AI_TAGGING_POPUP] — How: build unpacked extension then drive Chromium persistent context for popup, messaging, overlay, options, side panel E2E.
 * 
 * ## LAUNCH_EXTENSION_CONTEXT
 * 
 * - [IMPL-PLAYWRIGHT_E2E_EXTENSION] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION] How: global setup builds extension; fixture launches persistent context and resolves extension id.
 * - Contract:
 *   - INPUT: npm run test:e2e:extension; playwright.extension.config.js; built dist/ extension
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: pass/fail Playwright reports for extension surfaces; getExtensionId for page evaluation | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: tests/playwright/global-setup.js; extension-fixture.js; extension-*.spec.js
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: LAUNCH_EXTENSION_CONTEXT
 *   - AWAIT buildExtensionDist()
 *   - context = launchPersistentContext(userDataDir, args with --load-extension)
 *   - extensionId = AWAIT getExtensionId(context)
 *   - RETURN { context, extensionId }
 *   - How (sub-block): How: specs open popup/side panel/options pages and assert messaging/UI contracts without rewriting product logic.
 * 
 * ## RUN_EXTENSION_SPECS
 * 
 * - [IMPL-PLAYWRIGHT_E2E_EXTENSION] [ARCH-UI_TESTABILITY] [ARCH-MESSAGE_HANDLING] [REQ-UI_INSPECTION] [REQ-THIS_PAGE_TAG_SORT] [REQ-AI_TAGGING_POPUP] How: Implements RUN_EXTENSION_SPECS behavior for IMPL-PLAYWRIGHT_E2E_EXTENSION.
 * - Contract:
 *   - INPUT: npm run test:e2e:extension; playwright.extension.config.js; built dist/ extension
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: pass/fail Playwright reports for extension surfaces; getExtensionId for page evaluation | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: tests/playwright/global-setup.js; extension-fixture.js; extension-*.spec.js
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: RUN_EXTENSION_SPECS
 *   - FOR each extension-*.spec: use LAUNCH_EXTENSION_CONTEXT; exercise surface; ASSERT expectations
 *   - RETURN
 * 
 * === END IMPL-FULL-BLOCK: IMPL-PLAYWRIGHT_E2E_EXTENSION ===
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
  const re = /chrome-extension:\/\/([a-z]{32})\//
  let extensionId = null

  // Check existing service workers first; event may have already fired when context was created.
  const existing = context.serviceWorkers()
  for (const sw of existing) {
    const url = sw && sw.url ? sw.url() : null
    if (url) {
      const match = url.match(re)
      if (match) {
        extensionId = match[1]
        break
      }
    }
  }

  if (!extensionId) {
    const worker = await context.waitForEvent('serviceworker', { timeout }).catch(() => null)
    if (worker && worker.url()) {
      const match = worker.url().match(re)
      if (match) extensionId = match[1]
    }
    if (!extensionId && context.serviceWorkers().length > 0) {
      const sw = context.serviceWorkers()[0]
      const swUrl = sw && sw.url ? sw.url() : null
      if (swUrl) {
        const m = swUrl.match(re)
        if (m) extensionId = m[1]
      }
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
