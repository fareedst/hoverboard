/**
 * [IMMUTABLE-REQ-TAG-004] - Overlay tag E2E tests
 * End-to-end tests for overlay window tag persistence functionality
 */

import { test, expect } from '@playwright/test'

test.describe('[IMMUTABLE-REQ-TAG-004] Overlay Tag E2E', () => {
  test('[IMMUTABLE-REQ-TAG-004] Should complete full tag persistence workflow', async ({ page }) => {
    // [IMMUTABLE-REQ-TAG-004] - Navigate to test page
    await page.goto('https://example.com')
    
    // [IMMUTABLE-REQ-TAG-004] - Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // [IMMUTABLE-REQ-TAG-004] - Trigger overlay via keyboard shortcut
    await page.keyboard.press('Alt+H')
    
    // [IMMUTABLE-REQ-TAG-004] - Wait for overlay to appear
    await page.waitForSelector('.hoverboard-overlay', { timeout: 5000 })
    
    // [IMMUTABLE-REQ-TAG-004] - Verify overlay is visible
    const overlay = page.locator('.hoverboard-overlay')
    await expect(overlay).toBeVisible()
    
    // [IMMUTABLE-REQ-TAG-004] - Add tag via new tag input
    const tagInput = page.locator('.hoverboard-overlay .tag-input')
    await tagInput.fill('e2e-persisted-tag')
    await tagInput.press('Enter')
    
    // [IMMUTABLE-REQ-TAG-004] - Verify success message appears
    const successMessage = page.locator('.overlay-message.overlay-message-success')
    await expect(successMessage).toBeVisible()
    await expect(successMessage).toHaveText('Tag saved successfully')
    
    // [IMMUTABLE-REQ-TAG-004] - Verify tag appears in current tags
    const currentTags = page.locator('.hoverboard-overlay .tags-container .tag-element')
    await expect(currentTags).toHaveCount(1)
    await expect(currentTags.first()).toHaveText('e2e-persisted-tag')
    
    // [IMMUTABLE-REQ-TAG-004] - Add tag from recent tags
    const recentTag = page.locator('.hoverboard-overlay .recent-container .tag-element').first()
    await recentTag.click()
    
    // [IMMUTABLE-REQ-TAG-004] - Verify second tag was added
    await expect(currentTags).toHaveCount(2)
    
    // [IMMUTABLE-REQ-TAG-004] - Close overlay
    const closeButton = page.locator('.hoverboard-overlay .close-button')
    await closeButton.click()
    
    // [IMMUTABLE-REQ-TAG-004] - Verify overlay is hidden
    await expect(overlay).not.toBeVisible()
    
    // [IMMUTABLE-REQ-TAG-004] - Open popup to verify persistence
    await page.goto(`chrome-extension://${extensionId}/popup.html`)
    await page.waitForSelector('#currentTagsContainer', { timeout: 5000 })
    
    // [IMMUTABLE-REQ-TAG-004] - Verify tags appear in popup
    const popupTags = page.locator('#currentTagsContainer .tag-element')
    await expect(popupTags).toHaveCount(2)
    
    // [IMMUTABLE-REQ-TAG-004] - Verify specific tags are present
    const tagTexts = await popupTags.allTextContents()
    expect(tagTexts).toContain('e2e-persisted-tag')
  })

  test('[IMMUTABLE-REQ-TAG-004] Should handle network failures gracefully', async ({ page }) => {
    // [IMMUTABLE-REQ-TAG-004] - Navigate to test page
    await page.goto('https://example.com')
    
    // [IMMUTABLE-REQ-TAG-004] - Mock network failure
    await page.route('**/api/**', route => {
      route.abort('failed')
    })
    
    // [IMMUTABLE-REQ-TAG-004] - Trigger overlay
    await page.keyboard.press('Alt+H')
    await page.waitForSelector('.hoverboard-overlay', { timeout: 5000 })
    
    // [IMMUTABLE-REQ-TAG-004] - Try to add tag
    const tagInput = page.locator('.hoverboard-overlay .tag-input')
    await tagInput.fill('network-error-tag')
    await tagInput.press('Enter')
    
    // [IMMUTABLE-REQ-TAG-004] - Verify error message appears
    const errorMessage = page.locator('.overlay-message.overlay-message-error')
    await expect(errorMessage).toBeVisible()
    await expect(errorMessage).toHaveText('Failed to save tag')
    
    // [IMMUTABLE-REQ-TAG-004] - Verify tag was not added
    const currentTags = page.locator('.hoverboard-overlay .tags-container .tag-element')
    await expect(currentTags).toHaveCount(0)
  })

  test('[IMMUTABLE-REQ-TAG-004] Should validate tag input in real-time', async ({ page }) => {
    // [IMMUTABLE-REQ-TAG-004] - Navigate to test page
    await page.goto('https://example.com')
    
    // [IMMUTABLE-REQ-TAG-004] - Trigger overlay
    await page.keyboard.press('Alt+H')
    await page.waitForSelector('.hoverboard-overlay', { timeout: 5000 })
    
    // [IMMUTABLE-REQ-TAG-004] - Test various invalid tag formats
    const tagInput = page.locator('.hoverboard-overlay .tag-input')
    
    // [IMMUTABLE-REQ-TAG-004] - Test empty tag
    await tagInput.fill('')
    await tagInput.press('Enter')
    
    // [IMMUTABLE-REQ-TAG-004] - Verify no error message for empty input
    const errorMessage = page.locator('.overlay-message.overlay-message-error')
    await expect(errorMessage).not.toBeVisible()
    
    // [IMMUTABLE-REQ-TAG-004] - Test tag with invalid characters
    await tagInput.fill('invalid<tag>')
    await tagInput.press('Enter')
    
    // [IMMUTABLE-REQ-TAG-004] - Verify error message appears
    await expect(errorMessage).toBeVisible()
    await expect(errorMessage).toHaveText('Invalid tag format')
    
    // [IMMUTABLE-REQ-TAG-004] - Test valid tag
    await tagInput.fill('valid-tag')
    await tagInput.press('Enter')
    
    // [IMMUTABLE-REQ-TAG-004] - Verify success message appears
    const successMessage = page.locator('.overlay-message.overlay-message-success')
    await expect(successMessage).toBeVisible()
    await expect(successMessage).toHaveText('Tag saved successfully')
  })

  test('[IMMUTABLE-REQ-TAG-004] Should maintain state across browser sessions', async ({ page, context }) => {
    // [IMMUTABLE-REQ-TAG-004] - Navigate to test page
    await page.goto('https://example.com')
    
    // [IMMUTABLE-REQ-TAG-004] - Trigger overlay
    await page.keyboard.press('Alt+H')
    await page.waitForSelector('.hoverboard-overlay', { timeout: 5000 })
    
    // [IMMUTABLE-REQ-TAG-004] - Add tag
    const tagInput = page.locator('.hoverboard-overlay .tag-input')
    await tagInput.fill('session-persisted-tag')
    await tagInput.press('Enter')
    
    // [IMMUTABLE-REQ-TAG-004] - Verify tag was added
    const currentTags = page.locator('.hoverboard-overlay .tags-container .tag-element')
    await expect(currentTags).toHaveCount(1)
    await expect(currentTags.first()).toHaveText('session-persisted-tag')
    
    // [IMMUTABLE-REQ-TAG-004] - Close browser context
    await context.close()
    
    // [IMMUTABLE-REQ-TAG-004] - Create new context and navigate to same page
    const newContext = await context.browser().newContext()
    const newPage = await newContext.newPage()
    await newPage.goto('https://example.com')
    
    // [IMMUTABLE-REQ-TAG-004] - Trigger overlay in new session
    await newPage.keyboard.press('Alt+H')
    await newPage.waitForSelector('.hoverboard-overlay', { timeout: 5000 })
    
    // [IMMUTABLE-REQ-TAG-004] - Verify tag persists across sessions
    const newCurrentTags = newPage.locator('.hoverboard-overlay .tags-container .tag-element')
    await expect(newCurrentTags).toHaveCount(1)
    await expect(newCurrentTags.first()).toHaveText('session-persisted-tag')
  })

  test('[IMMUTABLE-REQ-TAG-004] Should handle concurrent tag operations', async ({ page }) => {
    // [IMMUTABLE-REQ-TAG-004] - Navigate to test page
    await page.goto('https://example.com')
    
    // [IMMUTABLE-REQ-TAG-004] - Trigger overlay
    await page.keyboard.press('Alt+H')
    await page.waitForSelector('.hoverboard-overlay', { timeout: 5000 })
    
    // [IMMUTABLE-REQ-TAG-004] - Rapidly add multiple tags
    const tagInput = page.locator('.hoverboard-overlay .tag-input')
    
    await tagInput.fill('concurrent-tag-1')
    await tagInput.press('Enter')
    
    await tagInput.fill('concurrent-tag-2')
    await tagInput.press('Enter')
    
    await tagInput.fill('concurrent-tag-3')
    await tagInput.press('Enter')
    
    // [IMMUTABLE-REQ-TAG-004] - Verify all tags were added
    const currentTags = page.locator('.hoverboard-overlay .tags-container .tag-element')
    await expect(currentTags).toHaveCount(3)
    
    // [IMMUTABLE-REQ-TAG-004] - Verify no duplicate tags
    const tagTexts = await currentTags.allTextContents()
    expect(tagTexts).toContain('concurrent-tag-1')
    expect(tagTexts).toContain('concurrent-tag-2')
    expect(tagTexts).toContain('concurrent-tag-3')
    expect(tagTexts.length).toBe(3)
  })

  test('[IMMUTABLE-REQ-TAG-004] Should provide user feedback for all operations', async ({ page }) => {
    // [IMMUTABLE-REQ-TAG-004] - Navigate to test page
    await page.goto('https://example.com')
    
    // [IMMUTABLE-REQ-TAG-004] - Trigger overlay
    await page.keyboard.press('Alt+H')
    await page.waitForSelector('.hoverboard-overlay', { timeout: 5000 })
    
    // [IMMUTABLE-REQ-TAG-004] - Test success feedback
    const tagInput = page.locator('.hoverboard-overlay .tag-input')
    await tagInput.fill('feedback-test-tag')
    await tagInput.press('Enter')
    
    // [IMMUTABLE-REQ-TAG-004] - Verify success message
    const successMessage = page.locator('.overlay-message.overlay-message-success')
    await expect(successMessage).toBeVisible()
    await expect(successMessage).toHaveText('Tag saved successfully')
    
    // [IMMUTABLE-REQ-TAG-004] - Wait for message to disappear
    await expect(successMessage).not.toBeVisible({ timeout: 5000 })
    
    // [IMMUTABLE-REQ-TAG-004] - Test error feedback
    await tagInput.fill('invalid<tag>')
    await tagInput.press('Enter')
    
    // [IMMUTABLE-REQ-TAG-004] - Verify error message
    const errorMessage = page.locator('.overlay-message.overlay-message-error')
    await expect(errorMessage).toBeVisible()
    await expect(errorMessage).toHaveText('Invalid tag format')
    
    // [IMMUTABLE-REQ-TAG-004] - Wait for message to disappear
    await expect(errorMessage).not.toBeVisible({ timeout: 5000 })
  })
}) 