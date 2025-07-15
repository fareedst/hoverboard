/**
 * Playwright Configuration for Hoverboard Extension E2E Testing
 * [TEST-FIX-001-PLAYWRIGHT] - Separate Playwright configuration for E2E tests
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Test environment
  testDir: './tests/playwright',
  
  // Use multiple browsers for testing
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
  ],
  
  // Test timeout
  timeout: 30000,
  
  // Global setup and teardown
  globalSetup: require.resolve('./tests/playwright/global-setup.js'),
  globalTeardown: require.resolve('./tests/playwright/global-teardown.js'),
  
  // Reporter configuration
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  
  // Use specific browser for Chrome extension testing
  use: {
    // Base URL for tests
    baseURL: 'http://localhost:3000',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video recording
    video: 'retain-on-failure',
    
    // Trace for debugging
    trace: 'retain-on-failure',
  },
  
  // Web server for testing
  webServer: {
    command: 'npm run dev:server',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
}); 