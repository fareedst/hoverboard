/**
 * [IMMUTABLE-REQ-TAG-004] - Overlay tag integration tests
 * Integration tests for overlay window tag persistence functionality
 */

import { test, expect } from '@playwright/test'

test.describe('[IMMUTABLE-REQ-TAG-004] Overlay Tag Integration', () => {
  test('[IMMUTABLE-REQ-TAG-004] Should persist tag and update popup', async ({ page }) => {
    // [IMMUTABLE-REQ-TAG-004] - Navigate to test page
    await page.goto('https://example.com')
    
    // [IMMUTABLE-REQ-TAG-004] - Trigger overlay
    await page.evaluate(() => {
      const event = new CustomEvent('hoverboard-show', {
        detail: { url: window.location.href, title: document.title }
      })
      document.dispatchEvent(event)
    })
    
    // [IMMUTABLE-REQ-TAG-004] - Wait for overlay
    await page.waitForSelector('.hoverboard-overlay', { timeout: 5000 })
    
    // [IMMUTABLE-REQ-TAG-004] - Add tag via overlay
    const overlayTagInput = page.locator('.hoverboard-overlay .tag-input')
    await overlayTagInput.fill('overlay-persisted-tag')
    await overlayTagInput.press('Enter')
    
    // [IMMUTABLE-REQ-TAG-004] - Verify tag was persisted and displayed
    const overlayTags = page.locator('.hoverboard-overlay .tag-element')
    await expect(overlayTags).toHaveCount(1)
    await expect(overlayTags.first()).toHaveText('overlay-persisted-tag')
    
    // [IMMUTABLE-REQ-TAG-004] - Verify tag appears in current tags list
    const currentTags = page.locator('.hoverboard-overlay .tags-container .tag-element')
    await expect(currentTags).toHaveCount(1)
    await expect(currentTags.first()).toHaveText('overlay-persisted-tag')
    
    // [IMMUTABLE-REQ-TAG-004] - Open popup and verify tag appears
    await page.goto(`chrome-extension://${extensionId}/popup.html`)
    await page.waitForSelector('#currentTagsContainer', { timeout: 5000 })
    
    const popupTags = page.locator('#currentTagsContainer .tag-element')
    await expect(popupTags).toHaveCount(1)
    await expect(popupTags.first()).toHaveText('overlay-persisted-tag')
  })

  test('[IMMUTABLE-REQ-TAG-004] Should persist tag from recent tags list', async ({ page }) => {
    // [IMMUTABLE-REQ-TAG-004] - Navigate to test page
    await page.goto('https://example.com')
    
    // [IMMUTABLE-REQ-TAG-004] - Trigger overlay
    await page.evaluate(() => {
      const event = new CustomEvent('hoverboard-show', {
        detail: { url: window.location.href, title: document.title }
      })
      document.dispatchEvent(event)
    })
    
    // [IMMUTABLE-REQ-TAG-004] - Wait for overlay
    await page.waitForSelector('.hoverboard-overlay', { timeout: 5000 })
    
    // [IMMUTABLE-REQ-TAG-004] - Click recent tag
    const recentTag = page.locator('.hoverboard-overlay .recent-container .tag-element').first()
    await recentTag.click()
    
    // [IMMUTABLE-REQ-TAG-004] - Verify tag was added to current tags
    const currentTags = page.locator('.hoverboard-overlay .tags-container .tag-element')
    await expect(currentTags).toHaveCount(1)
    
    // [IMMUTABLE-REQ-TAG-004] - Verify tag was removed from recent tags
    const recentTags = page.locator('.hoverboard-overlay .recent-container .tag-element')
    await expect(recentTags).toHaveCount(2) // One less than before
  })

  test('[IMMUTABLE-REQ-TAG-004] Should show success message on tag persistence', async ({ page }) => {
    // [IMMUTABLE-REQ-TAG-004] - Navigate to test page
    await page.goto('https://example.com')
    
    // [IMMUTABLE-REQ-TAG-004] - Trigger overlay
    await page.evaluate(() => {
      const event = new CustomEvent('hoverboard-show', {
        detail: { url: window.location.href, title: document.title }
      })
      document.dispatchEvent(event)
    })
    
    // [IMMUTABLE-REQ-TAG-004] - Wait for overlay
    await page.waitForSelector('.hoverboard-overlay', { timeout: 5000 })
    
    // [IMMUTABLE-REQ-TAG-004] - Add tag via overlay
    const overlayTagInput = page.locator('.hoverboard-overlay .tag-input')
    await overlayTagInput.fill('success-test-tag')
    await overlayTagInput.press('Enter')
    
    // [IMMUTABLE-REQ-TAG-004] - Verify success message appears
    const successMessage = page.locator('.overlay-message.overlay-message-success')
    await expect(successMessage).toBeVisible()
    await expect(successMessage).toHaveText('Tag saved successfully')
  })

  test('[IMMUTABLE-REQ-TAG-004] Should show error message on tag persistence failure', async ({ page }) => {
    // [IMMUTABLE-REQ-TAG-004] - Navigate to test page
    await page.goto('https://example.com')
    
    // [IMMUTABLE-REQ-TAG-004] - Mock network failure
    await page.route('**/api/**', route => {
      route.abort('failed')
    })
    
    // [IMMUTABLE-REQ-TAG-004] - Trigger overlay
    await page.evaluate(() => {
      const event = new CustomEvent('hoverboard-show', {
        detail: { url: window.location.href, title: document.title }
      })
      document.dispatchEvent(event)
    })
    
    // [IMMUTABLE-REQ-TAG-004] - Wait for overlay
    await page.waitForSelector('.hoverboard-overlay', { timeout: 5000 })
    
    // [IMMUTABLE-REQ-TAG-004] - Add tag via overlay
    const overlayTagInput = page.locator('.hoverboard-overlay .tag-input')
    await overlayTagInput.fill('error-test-tag')
    await overlayTagInput.press('Enter')
    
    // [IMMUTABLE-REQ-TAG-004] - Verify error message appears
    const errorMessage = page.locator('.overlay-message.overlay-message-error')
    await expect(errorMessage).toBeVisible()
    await expect(errorMessage).toHaveText('Failed to save tag')
  })

  test('[IMMUTABLE-REQ-TAG-004] Should validate tag input format', async ({ page }) => {
    // [IMMUTABLE-REQ-TAG-004] - Navigate to test page
    await page.goto('https://example.com')
    
    // [IMMUTABLE-REQ-TAG-004] - Trigger overlay
    await page.evaluate(() => {
      const event = new CustomEvent('hoverboard-show', {
        detail: { url: window.location.href, title: document.title }
      })
      document.dispatchEvent(event)
    })
    
    // [IMMUTABLE-REQ-TAG-004] - Wait for overlay
    await page.waitForSelector('.hoverboard-overlay', { timeout: 5000 })
    
    // [IMMUTABLE-REQ-TAG-004] - Try to add invalid tag
    const overlayTagInput = page.locator('.hoverboard-overlay .tag-input')
    await overlayTagInput.fill('invalid<tag>')
    await overlayTagInput.press('Enter')
    
    // [IMMUTABLE-REQ-TAG-004] - Verify error message appears
    const errorMessage = page.locator('.overlay-message.overlay-message-error')
    await expect(errorMessage).toBeVisible()
    await expect(errorMessage).toHaveText('Invalid tag format')
  })

  test('[IMMUTABLE-REQ-TAG-004] Should prevent duplicate tags', async ({ page }) => {
    // [IMMUTABLE-REQ-TAG-004] - Navigate to test page
    await page.goto('https://example.com')
    
    // [IMMUTABLE-REQ-TAG-004] - Trigger overlay
    await page.evaluate(() => {
      const event = new CustomEvent('hoverboard-show', {
        detail: { url: window.location.href, title: document.title }
      })
      document.dispatchEvent(event)
    })
    
    // [IMMUTABLE-REQ-TAG-004] - Wait for overlay
    await page.waitForSelector('.hoverboard-overlay', { timeout: 5000 })
    
    // [IMMUTABLE-REQ-TAG-004] - Add first tag
    const overlayTagInput = page.locator('.hoverboard-overlay .tag-input')
    await overlayTagInput.fill('duplicate-tag')
    await overlayTagInput.press('Enter')
    
    // [IMMUTABLE-REQ-TAG-004] - Verify tag was added
    const overlayTags = page.locator('.hoverboard-overlay .tag-element')
    await expect(overlayTags).toHaveCount(1)
    
    // [IMMUTABLE-REQ-TAG-004] - Try to add same tag again
    await overlayTagInput.fill('duplicate-tag')
    await overlayTagInput.press('Enter')
    
    // [IMMUTABLE-REQ-TAG-004] - Verify tag count didn't increase
    await expect(overlayTags).toHaveCount(1)
  })

  test('[IMMUTABLE-REQ-TAG-004] Should refresh overlay content after tag addition', async ({ page }) => {
    // [IMMUTABLE-REQ-TAG-004] - Navigate to test page
    await page.goto('https://example.com')
    
    // [IMMUTABLE-REQ-TAG-004] - Trigger overlay
    await page.evaluate(() => {
      const event = new CustomEvent('hoverboard-show', {
        detail: { url: window.location.href, title: document.title }
      })
      document.dispatchEvent(event)
    })
    
    // [IMMUTABLE-REQ-TAG-004] - Wait for overlay
    await page.waitForSelector('.hoverboard-overlay', { timeout: 5000 })
    
    // [IMMUTABLE-REQ-TAG-004] - Add tag via overlay
    const overlayTagInput = page.locator('.hoverboard-overlay .tag-input')
    await overlayTagInput.fill('refresh-test-tag')
    await overlayTagInput.press('Enter')
    
    // [IMMUTABLE-REQ-TAG-004] - Verify overlay was refreshed (input should be cleared)
    await expect(overlayTagInput).toHaveValue('')
    
    // [IMMUTABLE-REQ-TAG-004] - Verify tag appears in current tags
    const currentTags = page.locator('.hoverboard-overlay .tags-container .tag-element')
    await expect(currentTags).toHaveCount(1)
    await expect(currentTags.first()).toHaveText('refresh-test-tag')
  })

  test('[IMMUTABLE-REQ-TAG-004] Should maintain tag state across overlay and popup', async ({ page }) => {
    // [IMMUTABLE-REQ-TAG-004] - Navigate to test page
    await page.goto('https://example.com')
    
    // [IMMUTABLE-REQ-TAG-004] - Add tag via popup first
    await page.goto(`chrome-extension://${extensionId}/popup.html`)
    await page.waitForSelector('#newTagInput', { timeout: 5000 })
    
    const popupTagInput = page.locator('#newTagInput')
    await popupTagInput.fill('popup-tag')
    await popupTagInput.press('Enter')
    
    // [IMMUTABLE-REQ-TAG-004] - Verify tag in popup
    const popupTags = page.locator('#currentTagsContainer .tag-element')
    await expect(popupTags).toHaveCount(1)
    await expect(popupTags.first()).toHaveText('popup-tag')
    
    // [IMMUTABLE-REQ-TAG-004] - Go back to page and check overlay
    await page.goto('https://example.com')
    
    // [IMMUTABLE-REQ-TAG-004] - Trigger overlay
    await page.evaluate(() => {
      const event = new CustomEvent('hoverboard-show', {
        detail: { url: window.location.href, title: document.title }
      })
      document.dispatchEvent(event)
    })
    
    // [IMMUTABLE-REQ-TAG-004] - Wait for overlay
    await page.waitForSelector('.hoverboard-overlay', { timeout: 5000 })
    
    // [IMMUTABLE-REQ-TAG-004] - Verify tag appears in overlay
    const overlayTags = page.locator('.hoverboard-overlay .tags-container .tag-element')
    await expect(overlayTags).toHaveCount(1)
    await expect(overlayTags.first()).toHaveText('popup-tag')
  })
}) 