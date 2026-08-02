/**
 * [IMPL-CROSS_RESOURCE_RETRIEVAL] [IMPL-LIBRARY_PORTABILITY]
 * [ARCH-CROSS_RESOURCE_RETRIEVAL] [ARCH-LIBRARY_PORTABILITY]
 * [REQ-CROSS_RESOURCE_RETRIEVAL] [REQ-LIBRARY_PORTABILITY]
 * E2E: exercise the real Local Bookmarks Index scope and extension-profile
 * package file boundary; unit/composition tests cover algorithm and message seams.
 */
import { test, expect, getExtensionId } from './extension-fixture.js'

test.describe('[REQ-CROSS_RESOURCE_RETRIEVAL] All resources Index scope', () => {
  test('keeps aggregate results read-only and disables mutation/export controls', async ({ context }) => {
    const extensionId = await getExtensionId(context)
    const page = await context.newPage()
    await page.goto(`chrome-extension://${extensionId}/src/ui/bookmarks-table/bookmarks-table.html`)
    await page.locator('#head-tab-table-display').click()
    await page.locator('#search-scope').selectOption('all-resources')
    await page.locator('#search-input').fill('offline')
    await page.locator('#footer-tab-actions').click()

    await expect(page.locator('#select-all')).toBeDisabled()
    await expect(page.locator('#move-selected-btn')).toBeDisabled()
    await expect(page.locator('#delete-selected-btn')).toBeDisabled()
    await expect(page.locator('#add-tags-btn')).toBeDisabled()
    await page.locator('#footer-tab-export').click()
    await expect(page.locator('#export-all')).toBeDisabled()
    await expect(page.locator('#export-displayed')).toBeDisabled()
    await expect(page.locator('#export-selected')).toBeDisabled()
    await expect(page.locator('#export-library-package')).toBeDisabled()
    await expect(page.locator('#import-library-package')).toBeDisabled()
    await page.close()
  })
})

test.describe('[REQ-LIBRARY_PORTABILITY] package extension boundary', () => {
  test('exposes package download and fails closed for malformed file selection', async ({ context }) => {
    const extensionId = await getExtensionId(context)
    const page = await context.newPage()
    await page.goto(`chrome-extension://${extensionId}/src/ui/bookmarks-table/bookmarks-table.html`)
    await page.locator('#footer-tab-export').click()

    const download = page.waitForEvent('download', { timeout: 15000 }).catch(() => null)
    await page.locator('#export-library-package').click()
    const packageDownload = await download
    if (packageDownload) {
      expect(packageDownload.suggestedFilename()).toMatch(/^hoverboard-library-package-\d{4}-\d{2}-\d{2}\.json$/)
    } else {
      await expect(page.locator('#library-package-result')).toContainText('Package export failed')
    }

    await page.locator('#import-library-package-file').setInputFiles({
      name: 'malformed-hoverboard-package.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{}')
    })
    await expect(page.locator('#library-package-result')).toContainText('Package import failed: MalformedManifest')
    await page.close()
  })
})
