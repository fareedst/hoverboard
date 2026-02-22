/**
 * Playwright Configuration for Hoverboard Extension E2E Testing
 * [TEST-FIX-001-PLAYWRIGHT] - Separate Playwright configuration for E2E tests
 * [IMPL-PLAYWRIGHT_E2E_EXTENSION] - Extension project loads unpacked dist/ and runs extension E2E spec
 */

import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig, devices } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  testDir: './tests/playwright',
  timeout: 30000,
  globalSetup: path.join(__dirname, 'tests/playwright/global-setup.js'),
  globalTeardown: path.join(__dirname, 'tests/playwright/global-teardown.js'),
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'extension',
      testMatch: /extension.*\.spec\.js/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev:server',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
}); 