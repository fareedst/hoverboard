/**
 * E2E Tests for Tag Functionality `[IMMUTABLE-REQ-TAG-001]`
 * Tests the complete tag workflow including popup and overlay interactions
 */

import { test, expect } from '@playwright/test'

/**
 * [IMMUTABLE-REQ-TAG-001] - E2E Test Suite for Tag Management
 * Tests the complete tag workflow from popup to overlay interactions
 */
test.describe('[IMMUTABLE-REQ-TAG-001] Tag Management E2E Tests', () => {
  let extensionId

  test.beforeAll(async ({ browser }) => {
    // [IMMUTABLE-REQ-TAG-001] - Setup extension for testing
    const context = await browser.newContext()
    const page = await context.newPage()
    
    // Load extension
    await page.goto('chrome://extensions/')
    await page.evaluate(() => {
      // Enable developer mode
      const devModeToggle = document.querySelector('extensions-manager')
      if (devModeToggle) {
        devModeToggle.shadowRoot.querySelector('#devMode').click()
      }
    })
    
    // Get extension ID
    extensionId = await page.evaluate(() => {
      const extensions = document.querySelectorAll('extensions-item')
      for (const ext of extensions) {
        const name = ext.shadowRoot.querySelector('#name')?.textContent
        if (name && name.includes('Hoverboard')) {
          return ext.getAttribute('id')
        }
      }
      return null
    })
    
    expect(extensionId).toBeTruthy()
  })

  test('[IMMUTABLE-REQ-TAG-001] Should add tag to bookmark via popup', async ({ page }) => {
    // [IMMUTABLE-REQ-TAG-001] - Navigate to test page
    await page.goto('https://example.com')
    
    // [IMMUTABLE-REQ-TAG-001] - Open popup
    await page.goto(`chrome-extension://${extensionId}/popup.html`)
    
    // [IMMUTABLE-REQ-TAG-001] - Wait for popup to load
    await page.waitForSelector('#tag-input', { timeout: 5000 })
    
    // [IMMUTABLE-REQ-TAG-001] - Add tag
    const tagInput = page.locator('#tag-input')
    await tagInput.fill('test-tag')
    await tagInput.press('Enter')
    
    // [IMMUTABLE-REQ-TAG-001] - Verify tag was added
    const currentTags = page.locator('.current-tags .tag-element')
    await expect(currentTags).toHaveCount(1)
    await expect(currentTags.first()).toHaveText('test-tag')
    
    // [IMMUTABLE-REQ-TAG-001] - Verify success message
    const successMessage = page.locator('.success-message')
    await expect(successMessage).toBeVisible()
  })

  test('[IMMUTABLE-REQ-TAG-001] Should prevent duplicate tags in popup', async ({ page }) => {
    // [IMMUTABLE-REQ-TAG-001] - Navigate to test page
    await page.goto('https://example.com')
    
    // [IMMUTABLE-REQ-TAG-001] - Open popup
    await page.goto(`chrome-extension://${extensionId}/popup.html`)
    
    // [IMMUTABLE-REQ-TAG-001] - Wait for popup to load
    await page.waitForSelector('#tag-input', { timeout: 5000 })
    
    // [IMMUTABLE-REQ-TAG-001] - Add first tag
    const tagInput = page.locator('#tag-input')
    await tagInput.fill('duplicate-tag')
    await tagInput.press('Enter')
    
    // [IMMUTABLE-REQ-TAG-001] - Try to add same tag again
    await tagInput.fill('duplicate-tag')
    await tagInput.press('Enter')
    
    // [IMMUTABLE-REQ-TAG-001] - Verify only one tag exists
    const currentTags = page.locator('.current-tags .tag-element')
    await expect(currentTags).toHaveCount(1)
    
    // [IMMUTABLE-REQ-TAG-001] - Verify error message for duplicate
    const errorMessage = page.locator('.error-message')
    await expect(errorMessage).toBeVisible()
  })

  test('[IMMUTABLE-REQ-TAG-001] Should add tag via overlay', async ({ page }) => {
    // [IMMUTABLE-REQ-TAG-001] - Navigate to test page
    await page.goto('https://example.com')
    
    // [IMMUTABLE-REQ-TAG-001] - Trigger overlay (simulate hover or click)
    await page.evaluate(() => {
      // Simulate hoverboard trigger
      const event = new CustomEvent('hoverboard-show', {
        detail: { url: window.location.href, title: document.title }
      })
      document.dispatchEvent(event)
    })
    
    // [IMMUTABLE-REQ-TAG-001] - Wait for overlay to appear
    await page.waitForSelector('.hoverboard-overlay', { timeout: 5000 })
    
    // [IMMUTABLE-REQ-TAG-001] - Add tag via overlay
    const overlayTagInput = page.locator('.hoverboard-overlay .tag-input')
    await overlayTagInput.fill('overlay-tag')
    await overlayTagInput.press('Enter')
    
    // [IMMUTABLE-REQ-TAG-001] - Verify tag was added to overlay
    const overlayTags = page.locator('.hoverboard-overlay .tag-element')
    await expect(overlayTags).toHaveCount(1)
    await expect(overlayTags.first()).toHaveText('overlay-tag')
  })

  test('[IMMUTABLE-REQ-TAG-001] Should show recent tags in popup', async ({ page }) => {
    // [IMMUTABLE-REQ-TAG-001] - Navigate to test page
    await page.goto('https://example.com')
    
    // [IMMUTABLE-REQ-TAG-001] - Open popup
    await page.goto(`chrome-extension://${extensionId}/popup.html`)
    
    // [IMMUTABLE-REQ-TAG-001] - Wait for popup to load
    await page.waitForSelector('#tag-input', { timeout: 5000 })
    
    // [IMMUTABLE-REQ-TAG-001] - Add a tag to create recent tag
    const tagInput = page.locator('#tag-input')
    await tagInput.fill('recent-tag')
    await tagInput.press('Enter')
    
    // [IMMUTABLE-REQ-TAG-001] - Navigate to different page
    await page.goto('https://example.org')
    
    // [IMMUTABLE-REQ-TAG-001] - Open popup again
    await page.goto(`chrome-extension://${extensionId}/popup.html`)
    
    // [IMMUTABLE-REQ-TAG-001] - Wait for popup to load
    await page.waitForSelector('#tag-input', { timeout: 5000 })
    
    // [IMMUTABLE-REQ-TAG-001] - Verify recent tags are shown
    const recentTags = page.locator('.recent-tags .tag-element')
    await expect(recentTags).toHaveCount(1)
    await expect(recentTags.first()).toHaveText('recent-tag')
  })

  test('[IMMUTABLE-REQ-TAG-001] Should not show current tags in recent tags', async ({ page }) => {
    // [IMMUTABLE-REQ-TAG-001] - Navigate to test page
    await page.goto('https://example.com')
    
    // [IMMUTABLE-REQ-TAG-001] - Open popup
    await page.goto(`chrome-extension://${extensionId}/popup.html`)
    
    // [IMMUTABLE-REQ-TAG-001] - Wait for popup to load
    await page.waitForSelector('#tag-input', { timeout: 5000 })
    
    // [IMMUTABLE-REQ-TAG-001] - Add a tag
    const tagInput = page.locator('#tag-input')
    await tagInput.fill('current-tag')
    await tagInput.press('Enter')
    
    // [IMMUTABLE-REQ-TAG-001] - Verify tag is in current tags
    const currentTags = page.locator('.current-tags .tag-element')
    await expect(currentTags).toHaveCount(1)
    await expect(currentTags.first()).toHaveText('current-tag')
    
    // [IMMUTABLE-REQ-TAG-001] - Verify tag is NOT in recent tags
    const recentTags = page.locator('.recent-tags .tag-element')
    await expect(recentTags).toHaveCount(0)
  })

  test('[IMMUTABLE-REQ-TAG-001] Should validate tag input format', async ({ page }) => {
    // [IMMUTABLE-REQ-TAG-001] - Navigate to test page
    await page.goto('https://example.com')
    
    // [IMMUTABLE-REQ-TAG-001] - Open popup
    await page.goto(`chrome-extension://${extensionId}/popup.html`)
    
    // [IMMUTABLE-REQ-TAG-001] - Wait for popup to load
    await page.waitForSelector('#tag-input', { timeout: 5000 })
    
    // [IMMUTABLE-REQ-TAG-001] - Try to add invalid tag
    const tagInput = page.locator('#tag-input')
    await tagInput.fill('invalid<tag>')
    await tagInput.press('Enter')
    
    // [IMMUTABLE-REQ-TAG-001] - Verify error message
    const errorMessage = page.locator('.error-message')
    await expect(errorMessage).toBeVisible()
    await expect(errorMessage).toContainText('Invalid tag')
    
    // [IMMUTABLE-REQ-TAG-001] - Verify no tag was added
    const currentTags = page.locator('.current-tags .tag-element')
    await expect(currentTags).toHaveCount(0)
  })

  test('[IMMUTABLE-REQ-TAG-001] Should remove tag from popup', async ({ page }) => {
    // [IMMUTABLE-REQ-TAG-001] - Navigate to test page
    await page.goto('https://example.com')
    
    // [IMMUTABLE-REQ-TAG-001] - Open popup
    await page.goto(`chrome-extension://${extensionId}/popup.html`)
    
    // [IMMUTABLE-REQ-TAG-001] - Wait for popup to load
    await page.waitForSelector('#tag-input', { timeout: 5000 })
    
    // [IMMUTABLE-REQ-TAG-001] - Add a tag
    const tagInput = page.locator('#tag-input')
    await tagInput.fill('removable-tag')
    await tagInput.press('Enter')
    
    // [IMMUTABLE-REQ-TAG-001] - Verify tag was added
    const currentTags = page.locator('.current-tags .tag-element')
    await expect(currentTags).toHaveCount(1)
    
    // [IMMUTABLE-REQ-TAG-001] - Remove tag by clicking remove button
    const removeButton = page.locator('.current-tags .tag-element .remove-button')
    await removeButton.click()
    
    // [IMMUTABLE-REQ-TAG-001] - Verify tag was removed
    await expect(currentTags).toHaveCount(0)
  })

  test('[IMMUTABLE-REQ-TAG-001] Should remove tag from overlay', async ({ page }) => {
    // [IMMUTABLE-REQ-TAG-001] - Navigate to test page
    await page.goto('https://example.com')
    
    // [IMMUTABLE-REQ-TAG-001] - Trigger overlay
    await page.evaluate(() => {
      const event = new CustomEvent('hoverboard-show', {
        detail: { url: window.location.href, title: document.title }
      })
      document.dispatchEvent(event)
    })
    
    // [IMMUTABLE-REQ-TAG-001] - Wait for overlay to appear
    await page.waitForSelector('.hoverboard-overlay', { timeout: 5000 })
    
    // [IMMUTABLE-REQ-TAG-001] - Add a tag
    const overlayTagInput = page.locator('.hoverboard-overlay .tag-input')
    await overlayTagInput.fill('overlay-removable-tag')
    await overlayTagInput.press('Enter')
    
    // [IMMUTABLE-REQ-TAG-001] - Verify tag was added
    const overlayTags = page.locator('.hoverboard-overlay .tag-element')
    await expect(overlayTags).toHaveCount(1)
    
    // [IMMUTABLE-REQ-TAG-001] - Remove tag by double-clicking
    await overlayTags.first().dblclick()
    
    // [IMMUTABLE-REQ-TAG-001] - Verify tag was removed
    await expect(overlayTags).toHaveCount(0)
  })

  test('[IMMUTABLE-REQ-TAG-001] Should handle multiple tags correctly', async ({ page }) => {
    // [IMMUTABLE-REQ-TAG-001] - Navigate to test page
    await page.goto('https://example.com')
    
    // [IMMUTABLE-REQ-TAG-001] - Open popup
    await page.goto(`chrome-extension://${extensionId}/popup.html`)
    
    // [IMMUTABLE-REQ-TAG-001] - Wait for popup to load
    await page.waitForSelector('#tag-input', { timeout: 5000 })
    
    // [IMMUTABLE-REQ-TAG-001] - Add multiple tags
    const tagInput = page.locator('#tag-input')
    const tags = ['tag1', 'tag2', 'tag3']
    
    for (const tag of tags) {
      await tagInput.fill(tag)
      await tagInput.press('Enter')
    }
    
    // [IMMUTABLE-REQ-TAG-001] - Verify all tags were added
    const currentTags = page.locator('.current-tags .tag-element')
    await expect(currentTags).toHaveCount(3)
    
    // [IMMUTABLE-REQ-TAG-001] - Verify tag order
    for (let i = 0; i < tags.length; i++) {
      await expect(currentTags.nth(i)).toHaveText(tags[i])
    }
  })

  test('[IMMUTABLE-REQ-TAG-001] Should handle tag input with spaces', async ({ page }) => {
    // [IMMUTABLE-REQ-TAG-001] - Navigate to test page
    await page.goto('https://example.com')
    
    // [IMMUTABLE-REQ-TAG-001] - Open popup
    await page.goto(`chrome-extension://${extensionId}/popup.html`)
    
    // [IMMUTABLE-REQ-TAG-001] - Wait for popup to load
    await page.waitForSelector('#tag-input', { timeout: 5000 })
    
    // [IMMUTABLE-REQ-TAG-001] - Add tag with spaces
    const tagInput = page.locator('#tag-input')
    await tagInput.fill('tag with spaces')
    await tagInput.press('Enter')
    
    // [IMMUTABLE-REQ-TAG-001] - Verify tag was added with spaces
    const currentTags = page.locator('.current-tags .tag-element')
    await expect(currentTags).toHaveCount(1)
    await expect(currentTags.first()).toHaveText('tag with spaces')
  })

  test('[IMMUTABLE-REQ-TAG-001] Should handle empty tag input gracefully', async ({ page }) => {
    // [IMMUTABLE-REQ-TAG-001] - Navigate to test page
    await page.goto('https://example.com')
    
    // [IMMUTABLE-REQ-TAG-001] - Open popup
    await page.goto(`chrome-extension://${extensionId}/popup.html`)
    
    // [IMMUTABLE-REQ-TAG-001] - Wait for popup to load
    await page.waitForSelector('#tag-input', { timeout: 5000 })
    
    // [IMMUTABLE-REQ-TAG-001] - Try to add empty tag
    const tagInput = page.locator('#tag-input')
    await tagInput.press('Enter')
    
    // [IMMUTABLE-REQ-TAG-001] - Verify no tag was added
    const currentTags = page.locator('.current-tags .tag-element')
    await expect(currentTags).toHaveCount(0)
    
    // [IMMUTABLE-REQ-TAG-001] - Try to add whitespace-only tag
    await tagInput.fill('   ')
    await tagInput.press('Enter')
    
    // [IMMUTABLE-REQ-TAG-001] - Verify no tag was added
    await expect(currentTags).toHaveCount(0)
  })

  test('[IMMUTABLE-REQ-TAG-001] Should handle keyboard navigation in popup', async ({ page }) => {
    // [IMMUTABLE-REQ-TAG-001] - Navigate to test page
    await page.goto('https://example.com')
    
    // [IMMUTABLE-REQ-TAG-001] - Open popup
    await page.goto(`chrome-extension://${extensionId}/popup.html`)
    
    // [IMMUTABLE-REQ-TAG-001] - Wait for popup to load
    await page.waitForSelector('#tag-input', { timeout: 5000 })
    
    // [IMMUTABLE-REQ-TAG-001] - Test keyboard navigation
    const tagInput = page.locator('#tag-input')
    await tagInput.focus()
    
    // [IMMUTABLE-REQ-TAG-001] - Test Tab navigation
    await page.keyboard.press('Tab')
    
    // [IMMUTABLE-REQ-TAG-001] - Test Escape key
    await tagInput.fill('test-tag')
    await page.keyboard.press('Escape')
    
    // [IMMUTABLE-REQ-TAG-001] - Verify input was cleared
    await expect(tagInput).toHaveValue('')
  })

  test('[IMMUTABLE-REQ-TAG-001] Should handle accessibility features', async ({ page }) => {
    // [IMMUTABLE-REQ-TAG-001] - Navigate to test page
    await page.goto('https://example.com')
    
    // [IMMUTABLE-REQ-TAG-001] - Open popup
    await page.goto(`chrome-extension://${extensionId}/popup.html`)
    
    // [IMMUTABLE-REQ-TAG-001] - Wait for popup to load
    await page.waitForSelector('#tag-input', { timeout: 5000 })
    
    // [IMMUTABLE-REQ-TAG-001] - Test ARIA labels
    const tagInput = page.locator('#tag-input')
    await expect(tagInput).toHaveAttribute('aria-label')
    
    // [IMMUTABLE-REQ-TAG-001] - Test screen reader support
    const addTagButton = page.locator('#add-tag-btn')
    await expect(addTagButton).toHaveAttribute('aria-label')
  })

  test('[IMMUTABLE-REQ-TAG-001] Should handle performance under load', async ({ page }) => {
    // [IMMUTABLE-REQ-TAG-001] - Navigate to test page
    await page.goto('https://example.com')
    
    // [IMMUTABLE-REQ-TAG-001] - Open popup
    await page.goto(`chrome-extension://${extensionId}/popup.html`)
    
    // [IMMUTABLE-REQ-TAG-001] - Wait for popup to load
    await page.waitForSelector('#tag-input', { timeout: 5000 })
    
    // [IMMUTABLE-REQ-TAG-001] - Test rapid tag additions
    const tagInput = page.locator('#tag-input')
    const startTime = Date.now()
    
    for (let i = 0; i < 10; i++) {
      await tagInput.fill(`perf-tag-${i}`)
      await tagInput.press('Enter')
    }
    
    const endTime = Date.now()
    
    // [IMMUTABLE-REQ-TAG-001] - Verify performance is acceptable (< 5 seconds for 10 tags)
    expect(endTime - startTime).toBeLessThan(5000)
    
    // [IMMUTABLE-REQ-TAG-001] - Verify all tags were added
    const currentTags = page.locator('.current-tags .tag-element')
    await expect(currentTags).toHaveCount(10)
  })

  test('[IMMUTABLE-REQ-TAG-001] Should handle cross-browser compatibility', async ({ page, browserName }) => {
    // [IMMUTABLE-REQ-TAG-001] - Navigate to test page
    await page.goto('https://example.com')
    
    // [IMMUTABLE-REQ-TAG-001] - Open popup
    await page.goto(`chrome-extension://${extensionId}/popup.html`)
    
    // [IMMUTABLE-REQ-TAG-001] - Wait for popup to load
    await page.waitForSelector('#tag-input', { timeout: 5000 })
    
    // [IMMUTABLE-REQ-TAG-001] - Test basic functionality across browsers
    const tagInput = page.locator('#tag-input')
    await tagInput.fill('cross-browser-tag')
    await tagInput.press('Enter')
    
    // [IMMUTABLE-REQ-TAG-001] - Verify tag was added
    const currentTags = page.locator('.current-tags .tag-element')
    await expect(currentTags).toHaveCount(1)
    await expect(currentTags.first()).toHaveText('cross-browser-tag')
    
    // [IMMUTABLE-REQ-TAG-001] - Log browser-specific behavior
    console.log(`[IMMUTABLE-REQ-TAG-001] Test completed on ${browserName}`)
  })
}) 