/**
 * [IMPL-PLAYWRIGHT_E2E_EXTENSION] Playwright config for extension E2E only (no web server).
 * Run: npx playwright test -c playwright.extension.config.js
 */

import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig, devices } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  testDir: './tests/playwright',
  testMatch: /extension.*\.spec\.js/,
  timeout: 30000,
  globalSetup: path.join(__dirname, 'tests/playwright/global-setup.js'),
  globalTeardown: path.join(__dirname, 'tests/playwright/global-teardown.js'),
  reporter: [['html'], ['json', { outputFile: 'test-results/extension-results.json' }]],
  use: {
    ...devices['Desktop Chrome'],
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'extension' }],
})
