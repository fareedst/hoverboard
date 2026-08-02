/**
 * [IMPL-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [IMPL-OFFLINE_READER_MODE] [IMPL-ARCHIVED_CONTENT_SEARCH] [IMPL-PAGE_SCREENSHOT_ARCHIVE]
 * [ARCH-PAGE_ARCHIVE_BOOKMARK_ASSOCIATION] [ARCH-OFFLINE_READER_MODE] [ARCH-ARCHIVED_CONTENT_SEARCH] [ARCH-PAGE_SCREENSHOT_ARCHIVE]
 * [REQ-PAGE_ARCHIVE_STORAGE] [REQ-OFFLINE_READER_MODE] [REQ-ARCHIVED_CONTENT_SEARCH] [REQ-PAGE_SCREENSHOT_ARCHIVE]
 * E2E: exercise the real extension-page boundary for Reader rendering, archive search scope,
 * and persisted screenshot presentation. Unit/composition tests cover algorithm and message seams.
 */

/* global chrome */
import { test, expect, getExtensionId } from './extension-fixture.js'

const archiveUrl = 'https://archive-feature.example/article'
const archive = {
  archiveId: 'archive-feature-1',
  url: archiveUrl,
  title: 'Archived feature article',
  sourceTitle: 'Archived feature article',
  capturedAt: '2026-07-31T12:00:00.000Z',
  status: 'available',
  sanitizedHtml: '<h2>Offline article</h2><p>Durable archive content with <a href="https://archive-feature.example/reference">a source link</a>.</p><script>window.__archiveScriptRan = true</script>',
  textContent: 'Offline article Durable archive content.',
  contentHash: 'archive-content-hash',
  version: 1,
  sourcePresentationProfile: {
    background: '#ffffff',
    text: '#202124',
    link: '#0000ee',
    colorScheme: 'light'
  }
}

const screenshot = {
  artifactId: 'archive-shot-1',
  url: archiveUrl,
  capturedAt: '2026-07-31T12:00:00.000Z',
  format: 'image/png',
  contentHash: 'screenshot-content-hash',
  dataUrl: 'data:image/png;base64,iVBORw0KGgo=',
  status: 'available',
  storage: 'local'
}

async function seedArchiveState (page) {
  await page.evaluate(({ archive, screenshot, archiveUrl }) => {
    return new Promise((resolve) => {
      chrome.storage.local.set({
        hoverboard_page_archives: {
          version: 1,
          archives: { [archiveUrl]: archive },
          screenshots: { [screenshot.artifactId]: screenshot }
        },
        hoverboard_local_bookmarks: {
          [archiveUrl]: {
            url: archiveUrl,
            description: archive.title,
            extended: '',
            tags: ['archive'],
            time: archive.capturedAt,
            updated_at: archive.capturedAt,
            shared: 'yes',
            toread: 'no'
          }
        }
      }, resolve)
    })
  }, { archive, screenshot, archiveUrl })
}

async function seedStatusVariant (page, {
  hasArchive = false,
  hasScreenshot = false,
  backend = 'local',
  archiveStatus = archive.status
} = {}) {
  await page.evaluate(({ archive, screenshot, archiveUrl, hasArchive, hasScreenshot, backend, archiveStatus }) => {
    return new Promise((resolve) => {
      chrome.storage.local.set({
        hoverboard_storage_mode: backend,
        hoverboard_page_archives: {
          version: 1,
          archives: hasArchive ? { [archiveUrl]: { ...archive, status: archiveStatus } } : {},
          screenshots: hasScreenshot ? { [screenshot.artifactId]: screenshot } : {}
        },
        hoverboard_local_bookmarks: backend === 'local'
          ? {
              [archiveUrl]: {
                url: archiveUrl,
                description: archive.title,
                extended: '',
                tags: [],
                time: archive.capturedAt,
                updated_at: archive.capturedAt,
                shared: 'yes',
                toread: 'no'
              }
            }
          : {}
      }, resolve)
    })
  }, { archive, screenshot, archiveUrl, hasArchive, hasScreenshot, backend, archiveStatus })
}

async function openStatusPopup (context, extensionId, options) {
  const seedPage = await context.newPage()
  await seedPage.goto(`chrome-extension://${extensionId}/src/ui/reader/reader.html`)
  await seedStatusVariant(seedPage, options)
  await seedPage.close()

  const popup = await context.newPage()
  await popup.goto(`chrome-extension://${extensionId}/src/ui/popup/popup.html?screenshot=1&url=${encodeURIComponent(archiveUrl)}&title=${encodeURIComponent(archive.title)}`)
  await popup.locator('#mainInterface:not(.hidden)').waitFor({ state: 'visible', timeout: 15000 })
  return popup
}

test.describe('[REQ-OFFLINE_READER_MODE] archive feature extension pages', () => {
  // - [IMPL-OFFLINE_READER_MODE] [ARCH-OFFLINE_READER_MODE] [REQ-OFFLINE_READER_MODE] How: render only sanitized stored HTML and apply a validated source presentation profile without loading live HTML.
  test('renders stored Reader content and screenshot without executing archived scripts', async ({ context }) => {
    const extensionId = await getExtensionId(context)
    const seedPage = await context.newPage()
    await seedPage.goto(`chrome-extension://${extensionId}/src/ui/reader/reader.html`)
    await seedArchiveState(seedPage)

    const reader = await context.newPage()
    reader.on('console', message => console.log(`[E2E reader console] ${message.type()}: ${message.text()}`))
    reader.on('pageerror', error => console.log(`[E2E reader error] ${error.message}`))
    await reader.goto(`chrome-extension://${extensionId}/src/ui/reader/reader.html?url=${encodeURIComponent(archiveUrl)}`)
    await reader.waitForTimeout(250)
    await expect(reader.locator('#reader-title')).toHaveText('Archived feature article')
    await expect(reader.locator('#reader-content')).toContainText('Offline article')
    await expect(reader.locator('#reader-content script')).toHaveCount(0)
    await expect(reader.locator('#reader-screenshot-list img')).toHaveCount(1)
    const sourcePresentation = await reader.locator('.reader-shell').evaluate(element => {
      const style = getComputedStyle(element)
      return {
        background: style.backgroundColor,
        text: style.color,
        link: getComputedStyle(element.querySelector('.reader-live-link')).color,
        contentLink: getComputedStyle(element.querySelector('.reader-content a')).color,
        colorScheme: style.colorScheme
      }
    })
    expect(sourcePresentation).toEqual({
      background: 'rgb(255, 255, 255)',
      text: 'rgb(32, 33, 36)',
      link: 'rgb(0, 0, 238)',
      contentLink: 'rgb(0, 0, 238)',
      colorScheme: 'light'
    })
    expect(await reader.evaluate(() => globalThis.__archiveScriptRan)).toBeUndefined()

    await reader.close()
    await seedPage.close()
  })

  test('clicking Save page archive creates the selected-backend bookmark and archive', async ({ context }) => {
    const extensionId = await getExtensionId(context)
    const archiveUrl = 'https://example.com/hoverboard-archive-association'
    const resetPage = await context.newPage()
    await resetPage.goto(`chrome-extension://${extensionId}/src/ui/reader/reader.html`)
    await resetPage.evaluate(() => new Promise(resolve => {
      chrome.storage.local.remove(['hoverboard_page_archives', 'hoverboard_local_bookmarks', 'hoverboard_storage_index'], resolve)
    }))
    await resetPage.close()

    const contentPage = await context.newPage()
    await contentPage.goto(archiveUrl)
    await contentPage.waitForLoadState('domcontentloaded')
    await contentPage.bringToFront()

    const popupPage = await context.newPage()
    await popupPage.goto(`chrome-extension://${extensionId}/src/ui/popup/popup.html`)
    await popupPage.waitForLoadState('domcontentloaded')
    await popupPage.waitForTimeout(1500)
    await contentPage.bringToFront()
    await popupPage.locator('#reloadBtn').click()
    await popupPage.waitForTimeout(1500)
    await contentPage.bringToFront()
    await popupPage.locator('#captureArchiveBtn').click()
    await expect(popupPage.locator('#actionFeedbackMessage')).toContainText('Bookmark and page archive saved', { timeout: 10000 })

    const state = await popupPage.evaluate(() => new Promise(resolve => {
      chrome.storage.local.get(['hoverboard_page_archives', 'hoverboard_local_bookmarks'], resolve)
    }))
    const bookmarks = state.hoverboard_local_bookmarks || {}
    const archives = state.hoverboard_page_archives?.archives || {}
    expect(Object.values(bookmarks).some(bookmark => bookmark.url === archiveUrl)).toBe(true)
    expect(archives[archiveUrl]).toMatchObject({ url: archiveUrl, sanitizedHtml: expect.any(String) })

    await popupPage.close()
    await contentPage.close()
  })

  test.describe('[REQ-PAGE_ARCHIVE_STATUS_UI] selected-backend artifact status controls', () => {
    test('renders neither, archive-only, screenshot-only, and both states independently', async ({ context }) => {
      const extensionId = await getExtensionId(context)
      const cases = [
        { name: 'neither', hasArchive: false, hasScreenshot: false, archiveSaved: 'false', screenshotSaved: 'false', readerDisabled: true },
        { name: 'archive-only', hasArchive: true, hasScreenshot: false, archiveSaved: 'true', screenshotSaved: 'false', readerDisabled: false },
        { name: 'screenshot-only', hasArchive: false, hasScreenshot: true, archiveSaved: 'false', screenshotSaved: 'true', readerDisabled: true },
        { name: 'both', hasArchive: true, hasScreenshot: true, archiveSaved: 'true', screenshotSaved: 'true', readerDisabled: false }
      ]

      for (const statusCase of cases) {
        const popup = await openStatusPopup(context, extensionId, statusCase)
        await expect(popup.locator('#captureArchiveBtn')).toHaveAttribute('data-archive-saved', statusCase.archiveSaved)
        await expect(popup.locator('#captureScreenshotBtn')).toHaveAttribute('data-screenshot-saved', statusCase.screenshotSaved)
        if (statusCase.readerDisabled) {
          await expect(popup.locator('#openReaderBtn')).toBeDisabled()
        } else {
          await expect(popup.locator('#openReaderBtn')).not.toBeDisabled()
        }
        await expect(popup.locator('#captureArchiveBtn')).not.toBeDisabled()
        await expect(popup.locator('#captureScreenshotBtn')).not.toBeDisabled()
        await popup.close()
      }
    })

    test('fails closed for an unsupported selected backend', async ({ context }) => {
      const extensionId = await getExtensionId(context)
      const popup = await openStatusPopup(context, extensionId, { backend: 'sync' })
      await expect(popup.locator('#captureArchiveBtn')).toHaveAttribute('data-archive-saved', 'false')
      await expect(popup.locator('#captureScreenshotBtn')).toHaveAttribute('data-screenshot-saved', 'false')
      await expect(popup.locator('#openReaderBtn')).toBeDisabled()
      await expect(popup.locator('#archiveStatusDescription')).toContainText('unavailable')
      await popup.close()
    })

    test('keeps a stale readable archive available to Offline Reader', async ({ context }) => {
      const extensionId = await getExtensionId(context)
      const popup = await openStatusPopup(context, extensionId, {
        hasArchive: true,
        archiveStatus: 'stale'
      })
      await expect(popup.locator('#captureArchiveBtn')).toHaveAttribute('data-archive-saved', 'true')
      await expect(popup.locator('#openReaderBtn')).not.toBeDisabled()
      await popup.close()
    })

    test('This Page exposes the same scoped status controls and accessible Reader explanation hook', async ({ context }) => {
      const extensionId = await getExtensionId(context)
      const sidePanel = await context.newPage()
      await sidePanel.goto(`chrome-extension://${extensionId}/src/ui/side-panel/side-panel.html`)
      const refs = await sidePanel.locator('#bookmarkPanel [data-popup-ref]').evaluateAll(elements => {
        return elements
          .map(element => element.getAttribute('data-popup-ref'))
          .filter(value => ['captureArchiveBtn', 'captureScreenshotBtn', 'openReaderBtn', 'archiveStatusDescription'].includes(value))
      })
      expect(refs).toEqual(expect.arrayContaining([
        'captureArchiveBtn',
        'captureScreenshotBtn',
        'openReaderBtn',
        'archiveStatusDescription'
      ]))
      await expect(sidePanel.locator('#bookmarkPanel [data-popup-ref="archiveStatusDescription"]')).toHaveAttribute('aria-live', 'polite')
      await expect(sidePanel.locator('#bookmarkPanel [data-popup-ref="captureArchiveBtn"]')).toHaveAttribute('data-archive-saved', 'false')
      await expect(sidePanel.locator('#bookmarkPanel [data-popup-ref="captureScreenshotBtn"]')).toHaveAttribute('data-screenshot-saved', 'false')
      await sidePanel.close()
    })
  })
})

test.describe('[REQ-ARCHIVED_CONTENT_SEARCH] Local Bookmarks Index archive scope', () => {
  test('exposes archive scope independently from metadata search', async ({ context }) => {
    const extensionId = await getExtensionId(context)
    const page = await context.newPage()
    await page.goto(`chrome-extension://${extensionId}/src/ui/bookmarks-table/bookmarks-table.html`)
    await seedArchiveState(page)
    await page.reload()
    await expect(page.locator('#search-scope option[value="metadata"]')).toHaveText('Metadata')
    await expect(page.locator('#search-scope option[value="archive"]')).toHaveText('Archived content')
    await expect(page.locator('#search-scope')).toHaveValue('metadata')
    await page.close()
  })

  test('opens a real Reader result from archive search', async ({ context }) => {
    const extensionId = await getExtensionId(context)
    const page = await context.newPage()
    await page.goto(`chrome-extension://${extensionId}/src/ui/bookmarks-table/bookmarks-table.html`)
    await seedArchiveState(page)
    await page.reload()
    await page.locator('#head-tab-table-display').click()
    await page.locator('#search-scope').selectOption('archive')
    await page.locator('#search-input').fill('Durable archive')
    const readerLink = page.locator('.archive-reader-link').first()
    await expect(readerLink).toBeVisible()
    const readerTarget = await readerLink.getAttribute('href')
    expect(readerTarget).toContain(`chrome-extension://${extensionId}/src/ui/reader/reader.html`)
    await readerLink.click()
    await expect(page).toHaveURL(/src\/ui\/reader\/reader\.html\?url=/)
    await expect(page.locator('#reader-title')).toHaveText('Archived feature article')
    await expect(page.locator('#reader-content')).toContainText('Durable archive content with a source link.')
    await page.close()
  })
})
