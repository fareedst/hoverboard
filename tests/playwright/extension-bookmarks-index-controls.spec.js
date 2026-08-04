/**
 * [IMPL-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [REQ-LOCAL_BOOKMARKS_INDEX]
 * E2E: fixed head/footer control panels keep one selected tab and one visible panel per region;
 * the footer may also be collapsed without losing panel state.
 */

import { test, expect, getExtensionId } from './extension-fixture.js'

test.describe('[IMPL-LOCAL_BOOKMARKS_INDEX] fixed index control panels', () => {
  test('activates head and footer groups without exposing multiple panels', async ({ context }) => {
    const extensionId = await getExtensionId(context)
    const page = await context.newPage()
    await page.goto(`chrome-extension://${extensionId}/src/ui/bookmarks-table/bookmarks-table.html`)
    await page.waitForLoadState('domcontentloaded')

    const headTabs = page.locator('[data-control-region="head"] [data-control-tab="head"]')
    const footerTabs = page.locator('[data-control-region="footer"] [data-control-tab="footer"]')
    await expect(headTabs).toHaveCount(4)
    await expect(footerTabs).toHaveCount(3)
    await expect(page.locator('#head-panel-stores')).toBeVisible()
    await expect(page.locator('#footer-panel-actions')).toBeHidden()
    await expect(page.locator('[data-control-region="footer"] [aria-selected="true"]')).toHaveCount(0)
    await expect(page.locator('#footer-tab-actions')).toHaveAttribute('tabindex', '0')
    await expect.poll(async () => page.locator('.container').evaluate((container) => (
      container.style.getPropertyValue('--index-footer-sticky-height')
    ))).toMatch(/^\d+px$/)
    for (const store of ['local', 'file', 'sync', 'browser']) {
      await expect(page.locator(`#store-${store}`)).toBeChecked()
      await expect(page.locator(`#store-${store}-count`)).toHaveText(/\d+ \/ \d+|n\/a/)
    }

    await page.locator('#head-tab-show-only').click()
    await expect(page.locator('#head-tab-show-only')).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('#head-panel-show-only')).toBeVisible()
    await expect(page.locator('#head-panel-stores')).toBeHidden()
    await expect(page.locator('[data-control-region="head"] [aria-selected="true"]')).toHaveCount(1)
    await expect(page.locator('[data-control-region="head"] [data-control-panel]:not([hidden])')).toHaveCount(1)

    await page.locator('#footer-tab-actions').click()
    await expect(page.locator('#footer-panel-actions')).toBeVisible()
    await expect(page.locator('#footer-tab-actions')).toHaveAttribute('aria-selected', 'true')

    await page.locator('#footer-tab-actions').click()
    await expect(page.locator('#footer-panel-actions')).toBeHidden()
    await expect(page.locator('[data-control-region="footer"] [aria-selected="true"]')).toHaveCount(0)
    await expect(page.locator('[data-control-region="footer"] [data-control-panel]:not([hidden])')).toHaveCount(0)

    await page.locator('#footer-tab-export').click()
    await expect(page.locator('#footer-tab-export')).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('#footer-panel-export')).toBeVisible()
    await expect(page.locator('#footer-panel-actions')).toBeHidden()
    await expect(page.locator('[data-control-region="footer"] [aria-selected="true"]')).toHaveCount(1)
    await expect(page.locator('[data-control-region="footer"] [data-control-panel]:not([hidden])')).toHaveCount(1)
    await expect.poll(async () => page.locator('.container').evaluate((container) => (
      container.style.getPropertyValue('--index-footer-sticky-height')
    ))).toMatch(/^\d+px$/)

    await page.locator('#footer-tab-import').click()
    await page.locator('#import-target').selectOption('browser')
    await page.locator('#footer-tab-export').click()
    await page.locator('#footer-tab-import').click()
    await expect(page.locator('#import-target')).toHaveValue('browser')

    await page.close()
  })

  test('supports keyboard tab activation and sticky control positioning', async ({ context }) => {
    const extensionId = await getExtensionId(context)
    const page = await context.newPage()
    await page.goto(`chrome-extension://${extensionId}/src/ui/bookmarks-table/bookmarks-table.html`)
    await page.waitForLoadState('domcontentloaded')

    await page.locator('#head-tab-stores').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.locator('#head-tab-show-only')).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('#head-panel-show-only')).toBeVisible()
    await expect(page.locator('#head-tab-show-only')).toBeFocused()

    await page.locator('#footer-tab-import').focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('#footer-tab-import')).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('#footer-panel-import')).toBeVisible()
    await page.keyboard.press('Space')
    await expect(page.locator('#footer-tab-import')).toHaveAttribute('aria-selected', 'false')
    await expect(page.locator('#footer-panel-import')).toBeHidden()

    const stickyPositions = await page.evaluate(() => ({
      head: getComputedStyle(document.querySelector('.index-head-controls')).position,
      footer: getComputedStyle(document.querySelector('.index-footer')).position,
      tableHeader: getComputedStyle(document.querySelector('.bookmarks-table th')).position
    }))
    expect(stickyPositions).toEqual({
      head: 'sticky',
      footer: 'sticky',
      tableHeader: 'sticky'
    })

    await page.close()
  })
})
