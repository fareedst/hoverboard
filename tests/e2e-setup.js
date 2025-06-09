/**
 * End-to-End Test Setup
 * Configures Puppeteer and browser environment for e2e testing
 */

import { jest } from '@jest/globals';

// Increase timeout for e2e tests
jest.setTimeout(30000);

// Global e2e test configuration
global.testConfig = {
  headless: process.env.CI === 'true', // Headless in CI, visible locally
  devtools: process.env.DEBUG === 'true',
  slowMo: process.env.SLOW_MO ? parseInt(process.env.SLOW_MO) : 0,
  
  // Browser launch arguments
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--disable-features=TranslateUI',
    '--disable-ipc-flooding-protection'
  ],
  
  // Test timeouts
  timeouts: {
    navigation: 10000,
    element: 5000,
    script: 5000
  }
};

// Global test utilities for e2e
global.e2eUtils = {
  /**
   * Wait for extension to be loaded
   * @param {Browser} browser - Puppeteer browser instance
   * @returns {Promise<string>} Extension ID
   */
  async waitForExtension(browser) {
    let extensionTarget;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (!extensionTarget && attempts < maxAttempts) {
      try {
        extensionTarget = await browser.waitForTarget(
          target => target.type() === 'service_worker' && 
                   target.url().includes('chrome-extension://'),
          { timeout: 3000 }
        );
      } catch (error) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    if (!extensionTarget) {
      throw new Error('Extension service worker not found');
    }
    
    return extensionTarget.url().split('/')[2];
  },
  
  /**
   * Create a page with error logging
   * @param {Browser} browser - Puppeteer browser instance
   * @returns {Promise<Page>} Page with error logging enabled
   */
  async createPageWithLogging(browser) {
    const page = await browser.newPage();
    
    // Log console messages
    page.on('console', msg => {
      const type = msg.type();
      if (type === 'error' || type === 'warning') {
        console.log(`Browser ${type}: ${msg.text()}`);
      }
    });
    
    // Log page errors
    page.on('pageerror', error => {
      console.error('Page error:', error.message);
    });
    
    // Log request failures
    page.on('requestfailed', request => {
      console.warn('Request failed:', request.url(), request.failure()?.errorText);
    });
    
    return page;
  },
  
  /**
   * Take screenshot on test failure
   * @param {Page} page - Puppeteer page instance
   * @param {string} testName - Name of the failing test
   */
  async takeScreenshotOnFailure(page, testName) {
    if (process.env.SCREENSHOT_ON_FAILURE !== 'false') {
      try {
        const screenshotPath = `test-results/screenshots/${testName.replace(/[^a-z0-9]/gi, '_')}.png`;
        await page.screenshot({
          path: screenshotPath,
          fullPage: true
        });
        console.log(`Screenshot saved: ${screenshotPath}`);
      } catch (error) {
        console.warn('Failed to take screenshot:', error.message);
      }
    }
  },
  
  /**
   * Check if element exists without throwing
   * @param {Page} page - Puppeteer page instance
   * @param {string} selector - CSS selector
   * @returns {Promise<boolean>} Whether element exists
   */
  async elementExists(page, selector) {
    try {
      await page.waitForSelector(selector, { timeout: 1000 });
      return true;
    } catch (error) {
      return false;
    }
  },
  
  /**
   * Get extension manifest
   * @param {Browser} browser - Puppeteer browser instance
   * @param {string} extensionId - Extension ID
   * @returns {Promise<Object>} Manifest object
   */
  async getExtensionManifest(browser, extensionId) {
    const page = await browser.newPage();
    try {
      await page.goto(`chrome-extension://${extensionId}/manifest.json`);
      const content = await page.evaluate(() => document.body.textContent);
      return JSON.parse(content);
    } finally {
      await page.close();
    }
  },
  
  /**
   * Wait for network idle
   * @param {Page} page - Puppeteer page instance
   * @param {number} timeout - Timeout in milliseconds
   */
  async waitForNetworkIdle(page, timeout = 2000) {
    await page.waitForLoadState?.('networkidle') || 
          page.waitForTimeout(timeout);
  }
};

// Setup test directories
import fs from 'fs';
import path from 'path';

const testResultsDir = 'test-results';
const screenshotsDir = path.join(testResultsDir, 'screenshots');

// Create directories if they don't exist
if (!fs.existsSync(testResultsDir)) {
  fs.mkdirSync(testResultsDir, { recursive: true });
}

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Global cleanup
global.beforeAll = global.beforeAll || (() => {});
global.afterAll = global.afterAll || (() => {});

// Enhanced error handling for e2e tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Cleanup browser instances on process exit
const browserInstances = new Set();

global.registerBrowser = (browser) => {
  browserInstances.add(browser);
};

global.unregisterBrowser = (browser) => {
  browserInstances.delete(browser);
};

process.on('exit', async () => {
  for (const browser of browserInstances) {
    try {
      await browser.close();
    } catch (error) {
      console.warn('Error closing browser:', error.message);
    }
  }
});

console.log('E2E test environment configured'); 