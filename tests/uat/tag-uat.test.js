/**
 * User Acceptance Tests for Tag Functionality `[IMMUTABLE-REQ-TAG-001]`
 * Tests user workflows and scenarios for tag management
 */

import { test, expect } from '@playwright/test'

/**
 * [IMMUTABLE-REQ-TAG-001] - User Acceptance Test Suite for Tag Management
 * Tests real user workflows and scenarios
 */
test.describe('[IMMUTABLE-REQ-TAG-001] Tag Management UAT Tests', () => {
  let extensionId

  test.beforeAll(async ({ browser }) => {
    // [IMMUTABLE-REQ-TAG-001] - Setup extension for UAT testing
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

  test('[IMMUTABLE-REQ-TAG-001] User Story: Add tag to bookmark via popup', async ({ page }) => {
    // [IMMUTABLE-REQ-TAG-001] - User Story: As a user, I want to add tags to bookmarks via popup
    // so that I can organize my bookmarks effectively
    
    // [IMMUTABLE-REQ-TAG-001] - Navigate to test page
    await page.goto('https://example.com')
    
    // [IMMUTABLE-REQ-TAG-001] - Open popup (user action)
    await page.goto(`chrome-extension://${extensionId}/popup.html`)
    
    // [IMMUTABLE-REQ-TAG-001] - Wait for popup to load
    await page.waitForSelector('#tag-input', { timeout: 5000 })
    
    // [IMMUTABLE-REQ-TAG-001] - User enters tag (user action)
    const tagInput = page.locator('#tag-input')
    await tagInput.fill('user-tag')
    await tagInput.press('Enter')
    
    // [IMMUTABLE-REQ-TAG-001] - Verify tag was added (user expectation)
    const currentTags = page.locator('.current-tags .tag-element')
    await expect(currentTags).toHaveCount(1)
    await expect(currentTags.first()).toHaveText('user-tag')
    
    // [IMMUTABLE-REQ-TAG-001] - Verify success feedback (user expectation)
    const successMessage = page.locator('.success-message')
    await expect(successMessage).toBeVisible()
  })

  test('[IMMUTABLE-REQ-TAG-001] User Story: Prevent duplicate tags on current tab', async ({ page }) => {
    // [IMMUTABLE-REQ-TAG-001] - User Story: As a user, I want to avoid seeing duplicate tags
    // so that my tag list remains clean and organized
    
    // [IMMUTABLE-REQ-TAG-001] - Navigate to test page
    await page.goto('https://example.com')
    
    // [IMMUTABLE-REQ-TAG-001] - Open popup
    await page.goto(`chrome-extension://${extensionId}/popup.html`)
    
    // [IMMUTABLE-REQ-TAG-001] - Wait for popup to load
    await page.waitForSelector('#tag-input', { timeout: 5000 })
    
    // [IMMUTABLE-REQ-TAG-001] - User adds first tag
    const tagInput = page.locator('#tag-input')
    await tagInput.fill('duplicate-test-tag')
    await tagInput.press('Enter')
    
    // [IMMUTABLE-REQ-TAG-001] - User tries to add same tag again
    await tagInput.fill('duplicate-test-tag')
    await tagInput.press('Enter')
    
    // [IMMUTABLE-REQ-TAG-001] - Verify only one tag exists (user expectation)
    const currentTags = page.locator('.current-tags .tag-element')
    await expect(currentTags).toHaveCount(1)
    
    // [IMMUTABLE-REQ-TAG-001] - Verify tag appears in recent tags but not current
    const recentTags = page.locator('.recent-tags .tag-element')
    await expect(recentTags).toHaveCount(0) // Should not show in recent if it's current
  })

  test('[IMMUTABLE-REQ-TAG-001] User Story: Add tag via overlay interface', async ({ page }) => {
    // [IMMUTABLE-REQ-TAG-001] - User Story: As a user, I want to add tags via overlay
    // so that I can tag bookmarks without opening popup
    
    // [IMMUTABLE-REQ-TAG-001] - Navigate to test page
    await page.goto('https://example.com')
    
    // [IMMUTABLE-REQ-TAG-001] - User triggers overlay (user action)
    await page.evaluate(() => {
      const event = new CustomEvent('hoverboard-show', {
        detail: { url: window.location.href, title: document.title }
      })
      document.dispatchEvent(event)
    })
    
    // [IMMUTABLE-REQ-TAG-001] - Wait for overlay to appear
    await page.waitForSelector('.hoverboard-overlay', { timeout: 5000 })
    
    // [IMMUTABLE-REQ-TAG-001] - User adds tag via overlay
    const overlayTagInput = page.locator('.hoverboard-overlay .tag-input')
    await overlayTagInput.fill('overlay-user-tag')
    await overlayTagInput.press('Enter')
    
    // [IMMUTABLE-REQ-TAG-001] - Verify tag was added to overlay
    const overlayTags = page.locator('.hoverboard-overlay .tag-element')
    await expect(overlayTags).toHaveCount(1)
    await expect(overlayTags.first()).toHaveText('overlay-user-tag')
  })

  test('[IMMUTABLE-REQ-TAG-001] User Story: See recent tags for quick access', async ({ page }) => {
    // [IMMUTABLE-REQ-TAG-001] - User Story: As a user, I want to see recent tags
    // so that I can quickly reuse frequently used tags
    
    // [IMMUTABLE-REQ-TAG-001] - Navigate to test page
    await page.goto('https://example.com')
    
    // [IMMUTABLE-REQ-TAG-001] - Open popup
    await page.goto(`chrome-extension://${extensionId}/popup.html`)
    
    // [IMMUTABLE-REQ-TAG-001] - Wait for popup to load
    await page.waitForSelector('#tag-input', { timeout: 5000 })
    
    // [IMMUTABLE-REQ-TAG-001] - User adds a tag to create recent tag
    const tagInput = page.locator('#tag-input')
    await tagInput.fill('recent-user-tag')
    await tagInput.press('Enter')
    
    // [IMMUTABLE-REQ-TAG-001] - User navigates to different page
    await page.goto('https://example.org')
    
    // [IMMUTABLE-REQ-TAG-001] - User opens popup again
    await page.goto(`chrome-extension://${extensionId}/popup.html`)
    
    // [IMMUTABLE-REQ-TAG-001] - Wait for popup to load
    await page.waitForSelector('#tag-input', { timeout: 5000 })
    
    // [IMMUTABLE-REQ-TAG-001] - Verify recent tags are shown (user expectation)
    const recentTags = page.locator('.recent-tags .tag-element')
    await expect(recentTags).toHaveCount(1)
    await expect(recentTags.first()).toHaveText('recent-user-tag')
  })

  test('[IMMUTABLE-REQ-TAG-001] User Story: Validate tag input format', async ({ page }) => {
    // [IMMUTABLE-REQ-TAG-001] - User Story: As a user, I want invalid tags to be rejected
    // so that my tag list remains clean and functional
    
    // [IMMUTABLE-REQ-TAG-001] - Navigate to test page
    await page.goto('https://example.com')
    
    // [IMMUTABLE-REQ-TAG-001] - Open popup
    await page.goto(`chrome-extension://${extensionId}/popup.html`)
    
    // [IMMUTABLE-REQ-TAG-001] - Wait for popup to load
    await page.waitForSelector('#tag-input', { timeout: 5000 })
    
    // [IMMUTABLE-REQ-TAG-001] - User tries to add invalid tag
    const tagInput = page.locator('#tag-input')
    await tagInput.fill('invalid<tag>')
    await tagInput.press('Enter')
    
    // [IMMUTABLE-REQ-TAG-001] - Verify error message is shown (user expectation)
    const errorMessage = page.locator('.error-message')
    await expect(errorMessage).toBeVisible()
    await expect(errorMessage).toContainText('Invalid tag')
    
    // [IMMUTABLE-REQ-TAG-001] - Verify no tag was added
    const currentTags = page.locator('.current-tags .tag-element')
    await expect(currentTags).toHaveCount(0)
  })

  test('[IMMUTABLE-REQ-TAG-001] User Story: Remove tag from bookmark', async ({ page }) => {
    // [IMMUTABLE-REQ-TAG-001] - User Story: As a user, I want to remove tags from bookmarks
    // so that I can keep my bookmarks organized
    
    // [IMMUTABLE-REQ-TAG-001] - Navigate to test page
    await page.goto('https://example.com')
    
    // [IMMUTABLE-REQ-TAG-001] - Open popup
    await page.goto(`chrome-extension://${extensionId}/popup.html`)
    
    // [IMMUTABLE-REQ-TAG-001] - Wait for popup to load
    await page.waitForSelector('#tag-input', { timeout: 5000 })
    
    // [IMMUTABLE-REQ-TAG-001] - User adds a tag
    const tagInput = page.locator('#tag-input')
    await tagInput.fill('removable-user-tag')
    await tagInput.press('Enter')
    
    // [IMMUTABLE-REQ-TAG-001] - Verify tag was added
    const currentTags = page.locator('.current-tags .tag-element')
    await expect(currentTags).toHaveCount(1)
    
    // [IMMUTABLE-REQ-TAG-001] - User removes tag by clicking remove button
    const removeButton = page.locator('.current-tags .tag-element .remove-button')
    await removeButton.click()
    
    // [IMMUTABLE-REQ-TAG-001] - Verify tag was removed (user expectation)
    await expect(currentTags).toHaveCount(0)
  })

  test('[IMMUTABLE-REQ-TAG-001] User Story: Handle multiple tags efficiently', async ({ page }) => {
    // [IMMUTABLE-REQ-TAG-001] - User Story: As a user, I want to add multiple tags
    // so that I can categorize my bookmarks comprehensively
    
    // [IMMUTABLE-REQ-TAG-001] - Navigate to test page
    await page.goto('https://example.com')
    
    // [IMMUTABLE-REQ-TAG-001] - Open popup
    await page.goto(`chrome-extension://${extensionId}/popup.html`)
    
    // [IMMUTABLE-REQ-TAG-001] - Wait for popup to load
    await page.waitForSelector('#tag-input', { timeout: 5000 })
    
    // [IMMUTABLE-REQ-TAG-001] - User adds multiple tags
    const tagInput = page.locator('#tag-input')
    const tags = ['user-tag1', 'user-tag2', 'user-tag3']
    
    for (const tag of tags) {
      await tagInput.fill(tag)
      await tagInput.press('Enter')
    }
    
    // [IMMUTABLE-REQ-TAG-001] - Verify all tags were added (user expectation)
    const currentTags = page.locator('.current-tags .tag-element')
    await expect(currentTags).toHaveCount(3)
    
    // [IMMUTABLE-REQ-TAG-001] - Verify tag order
    for (let i = 0; i < tags.length; i++) {
      await expect(currentTags.nth(i)).toHaveText(tags[i])
    }
  })

  test('[IMMUTABLE-REQ-TAG-001] User Story: Handle tag input with spaces', async ({ page }) => {
    // [IMMUTABLE-REQ-TAG-001] - User Story: As a user, I want to use tags with spaces
    // so that I can create descriptive tag names
    
    // [IMMUTABLE-REQ-TAG-001] - Navigate to test page
    await page.goto('https://example.com')
    
    // [IMMUTABLE-REQ-TAG-001] - Open popup
    await page.goto(`chrome-extension://${extensionId}/popup.html`)
    
    // [IMMUTABLE-REQ-TAG-001] - Wait for popup to load
    await page.waitForSelector('#tag-input', { timeout: 5000 })
    
    // [IMMUTABLE-REQ-TAG-001] - User adds tag with spaces
    const tagInput = page.locator('#tag-input')
    await tagInput.fill('user tag with spaces')
    await tagInput.press('Enter')
    
    // [IMMUTABLE-REQ-TAG-001] - Verify tag was added with spaces (user expectation)
    const currentTags = page.locator('.current-tags .tag-element')
    await expect(currentTags).toHaveCount(1)
    await expect(currentTags.first()).toHaveText('user tag with spaces')
  })

  test('[IMMUTABLE-REQ-TAG-001] User Story: Handle empty tag input gracefully', async ({ page }) => {
    // [IMMUTABLE-REQ-TAG-001] - User Story: As a user, I want the system to handle empty input gracefully
    // so that I don't accidentally create empty tags
    
    // [IMMUTABLE-REQ-TAG-001] - Navigate to test page
    await page.goto('https://example.com')
    
    // [IMMUTABLE-REQ-TAG-001] - Open popup
    await page.goto(`chrome-extension://${extensionId}/popup.html`)
    
    // [IMMUTABLE-REQ-TAG-001] - Wait for popup to load
    await page.waitForSelector('#tag-input', { timeout: 5000 })
    
    // [IMMUTABLE-REQ-TAG-001] - User tries to add empty tag
    const tagInput = page.locator('#tag-input')
    await tagInput.press('Enter')
    
    // [IMMUTABLE-REQ-TAG-001] - Verify no tag was added (user expectation)
    const currentTags = page.locator('.current-tags .tag-element')
    await expect(currentTags).toHaveCount(0)
    
    // [IMMUTABLE-REQ-TAG-001] - User tries to add whitespace-only tag
    await tagInput.fill('   ')
    await tagInput.press('Enter')
    
    // [IMMUTABLE-REQ-TAG-001] - Verify no tag was added
    await expect(currentTags).toHaveCount(0)
  })

  test('[IMMUTABLE-REQ-TAG-001] User Story: Complete tag workflow', async ({ page }) => {
    // [IMMUTABLE-REQ-TAG-001] - User Story: As a user, I want to complete a full tag workflow
    // so that I can effectively organize my bookmarks
    
    // [IMMUTABLE-REQ-TAG-001] - Navigate to test page
    await page.goto('https://example.com')
    
    // [IMMUTABLE-REQ-TAG-001] - Open popup
    await page.goto(`chrome-extension://${extensionId}/popup.html`)
    
    // [IMMUTABLE-REQ-TAG-001] - Wait for popup to load
    await page.waitForSelector('#tag-input', { timeout: 5000 })
    
    // [IMMUTABLE-REQ-TAG-001] - User adds multiple tags
    const tagInput = page.locator('#tag-input')
    const tags = ['workflow-tag1', 'workflow-tag2', 'workflow-tag3']
    
    for (const tag of tags) {
      await tagInput.fill(tag)
      await tagInput.press('Enter')
    }
    
    // [IMMUTABLE-REQ-TAG-001] - Verify all tags were added
    const currentTags = page.locator('.current-tags .tag-element')
    await expect(currentTags).toHaveCount(3)
    
    // [IMMUTABLE-REQ-TAG-001] - User removes one tag
    const removeButton = page.locator('.current-tags .tag-element .remove-button').first()
    await removeButton.click()
    
    // [IMMUTABLE-REQ-TAG-001] - Verify tag was removed
    await expect(currentTags).toHaveCount(2)
    
    // [IMMUTABLE-REQ-TAG-001] - User adds another tag
    await tagInput.fill('workflow-tag4')
    await tagInput.press('Enter')
    
    // [IMMUTABLE-REQ-TAG-001] - Verify new tag was added
    await expect(currentTags).toHaveCount(3)
    
    // [IMMUTABLE-REQ-TAG-001] - User tries to add duplicate
    await tagInput.fill('workflow-tag2')
    await tagInput.press('Enter')
    
    // [IMMUTABLE-REQ-TAG-001] - Verify duplicate was prevented
    await expect(currentTags).toHaveCount(3)
  })

  test('[IMMUTABLE-REQ-TAG-001] User Story: Accessibility compliance', async ({ page }) => {
    // [IMMUTABLE-REQ-TAG-001] - User Story: As a user with accessibility needs, I want the tag interface to be accessible
    // so that I can use the tag functionality effectively
    
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
    
    // [IMMUTABLE-REQ-TAG-001] - Test ARIA labels
    await expect(tagInput).toHaveAttribute('aria-label')
    
    // [IMMUTABLE-REQ-TAG-001] - Test screen reader support
    const addTagButton = page.locator('#add-tag-btn')
    await expect(addTagButton).toHaveAttribute('aria-label')
  })
}) 