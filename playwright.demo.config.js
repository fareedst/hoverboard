/**
 * [IMPL-PLAYWRIGHT_E2E_EXTENSION] [PROC-DEMO_RECORDING]
 * Playwright config for recording demo sessions (video always on). Use to capture WebM for GIF conversion.
 * Run: npx playwright test -c playwright.demo.config.js
 */

import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig, devices } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  testDir: './tests/playwright',
  testMatch: /extension-demo-tabs\.spec\.js/,
  timeout: 60000,
  globalSetup: path.join(__dirname, 'tests/playwright/global-setup.js'),
  globalTeardown: path.join(__dirname, 'tests/playwright/global-teardown.js'),
  reporter: [['html'], ['json', { outputFile: 'test-results/demo-results.json' }]],
  outputDir: 'test-results/demo-artifacts',
  use: {
    ...devices['Desktop Chrome'],
    screenshot: 'on',
    video: 'on',
    trace: 'on',
  },
  projects: [{ name: 'demo' }],
})
