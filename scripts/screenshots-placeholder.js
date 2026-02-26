#!/usr/bin/env node
/**
 * Generate README/docs screenshots with placeholder bookmark data.
 * [IMPL-SCREENSHOT_MODE] [REQ-LOCAL_BOOKMARKS_INDEX] Requires built extension in dist/. Run: npm run build:dev && node scripts/screenshots-placeholder.js
 * Popup is cropped to #mainInterface only. Pinboard image composites overlay page + cropped popup.
 *
 * Seed from file (optional):
 *   node scripts/screenshots-placeholder.js [--seed=path/to/seed.json]
 *   SCREENSHOT_SEED_FILE=path/to/seed.json node scripts/screenshots-placeholder.js
 * Seed JSON shape: { hoverboard_local_bookmarks: { [url]: bookmark }, hoverboard_storage_index: { [url]: "local" }, hoverboard_theme?: "dark"|"light", hoverboard_settings?: object }
 * See scripts/screenshot-placeholder-data.js for the default seed and bookmark shape.
 */

import path from 'path'
import fs from 'fs'
import os from 'os'
import { fileURLToPath } from 'url'
import { chromium } from '@playwright/test'
import sharp from 'sharp'
import {
  placeholderStorageSeed as defaultLocalSeed,
  placeholderSyncSeed as defaultSyncSeed,
  screenshotPopupUrl,
  screenshotPopupTitle
} from './screenshot-placeholder-data.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.join(__dirname, '..')
const extPath = path.join(projectRoot, 'dist')
const imagesDir = path.join(projectRoot, 'images')

function getSeedFilePath () {
  const env = process.env.SCREENSHOT_SEED_FILE
  if (env) return path.isAbsolute(env) ? env : path.join(projectRoot, env)
  const arg = process.argv.find(a => a.startsWith('--seed='))
  if (arg) return path.isAbsolute(arg.slice(7)) ? arg.slice(7) : path.join(projectRoot, arg.slice(7))
  return null
}

function loadSeedFromFile (filePath) {
  const raw = fs.readFileSync(filePath, 'utf8')
  const data = JSON.parse(raw)
  if (!data || typeof data.hoverboard_local_bookmarks !== 'object' || Array.isArray(data.hoverboard_local_bookmarks)) {
    throw new Error('Seed file must have hoverboard_local_bookmarks (object keyed by URL)')
  }
  const hoverboard_storage_index = data.hoverboard_storage_index && typeof data.hoverboard_storage_index === 'object' && !Array.isArray(data.hoverboard_storage_index)
    ? data.hoverboard_storage_index
    : Object.fromEntries(Object.keys(data.hoverboard_local_bookmarks).map(url => [url, 'local']))
  const placeholderStorageSeed = {
    hoverboard_local_bookmarks: data.hoverboard_local_bookmarks,
    hoverboard_storage_index,
    hoverboard_theme: data.hoverboard_theme || 'dark'
  }
  const placeholderSyncSeed = data.hoverboard_settings != null
    ? { hoverboard_settings: data.hoverboard_settings }
    : defaultSyncSeed
  return { placeholderStorageSeed, placeholderSyncSeed }
}

const PINBOARD_CONTENT_URL = 'https://pinboard.in/'
const SCREENSHOT_WAIT_MS = 3000
const OVERLAY_SELECTOR = '#hoverboard-overlay'
const POPUP_MAIN_SELECTOR = '#mainInterface'
const POPUP_READY_ATTR = '[data-screenshot-ready="true"]'
const OPTIONS_LOAD_SELECTOR = '#auth-token, #storage-mode-pinboard'
const TABLE_SELECTOR = '.bookmarks-table tbody, .empty-state'
const STORE_LOCAL_CHECKBOX = '#store-local'
const POPUP_COMPOSITE_INSET = 24 // px from top-right when compositing popup onto Pinboard image
const SIDE_PANEL_READY_SELECTOR = '#treeContainer, #emptyState'
const SIDE_PANEL_BOOKMARK_READY = '#bookmarkPanel [data-popup-ref="mainInterface"], #bookmarkPanel [data-popup-ref="loadingState"]'
const SIDE_PANEL_TAB_BOOKMARK = '.side-panel-tab[data-tab="bookmark"]'
const SIDE_PANEL_TAB_TAGS_TREE = '.side-panel-tab[data-tab="tagsTree"]'
// [IMPL-SCREENSHOT_MODE] Side panel captures at 240px width so README images match real Chrome side panel proportions
const SIDE_PANEL_VIEWPORT = { width: 240, height: 600 }

async function main () {
  if (!fs.existsSync(extPath) || !fs.existsSync(path.join(extPath, 'manifest.json'))) {
    console.error('Extension not built. Run: npm run build:dev')
    process.exit(1)
  }

  const seedPath = getSeedFilePath()
  let placeholderStorageSeed = defaultLocalSeed
  let placeholderSyncSeed = defaultSyncSeed
  if (seedPath) {
    if (!fs.existsSync(seedPath)) {
      console.error('Seed file not found:', seedPath)
      process.exit(1)
    }
    const loaded = loadSeedFromFile(seedPath)
    placeholderStorageSeed = loaded.placeholderStorageSeed
    placeholderSyncSeed = loaded.placeholderSyncSeed
    console.log('Using seed file:', seedPath)
  }

  const userDataDir = path.join(os.tmpdir(), `hoverboard-screenshots-${Date.now()}`)
  fs.mkdirSync(userDataDir, { recursive: true })
  fs.mkdirSync(imagesDir, { recursive: true })

  console.log('Launching Chromium with extension from', extPath)
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      `--disable-extensions-except=${extPath}`,
      `--load-extension=${extPath}`
    ]
  })

  let [serviceWorker] = context.serviceWorkers()
  if (!serviceWorker) {
    serviceWorker = await context.waitForEvent('serviceworker', { timeout: 15000 })
  }
  const extensionId = serviceWorker.url().split('/')[2]
  console.log('Extension ID:', extensionId)

  const baseUrl = `chrome-extension://${extensionId}`

  // Seed storage from extension context (options page has chrome.storage).
  // [IMPL-SCREENSHOT_MODE] Await storage set so popup/bookmarks-table see seeded data.
  const optionsPage = await context.newPage()
  await optionsPage.goto(`${baseUrl}/src/ui/options/options.html`, { waitUntil: 'domcontentloaded', timeout: 15000 })
  await optionsPage.evaluate(async ({ localSeed, syncSeed }) => {
    await chrome.storage.local.set(localSeed)
    if (syncSeed && typeof chrome.storage.sync !== 'undefined') {
      await chrome.storage.sync.set(syncSeed)
    }
  }, { localSeed: placeholderStorageSeed, syncSeed: placeholderSyncSeed })
  await optionsPage.waitForTimeout(500)

  // 1) Overlay on content page (Pinboard) – capture to temp for compositing
  const pinboardTempPath = path.join(os.tmpdir(), `hoverboard-pinboard-${Date.now()}.png`)
  const overlayPage = await context.newPage()
  await overlayPage.goto(PINBOARD_CONTENT_URL, { waitUntil: 'domcontentloaded', timeout: 20000 })
  await overlayPage.waitForTimeout(SCREENSHOT_WAIT_MS)
  const overlayEl = overlayPage.locator(OVERLAY_SELECTOR)
  try {
    await overlayEl.waitFor({ state: 'visible', timeout: 8000 })
  } catch (_) {
    console.warn('Overlay may not be visible; capturing page anyway.')
  }
  await overlayPage.screenshot({ path: pinboardTempPath, fullPage: false })
  await overlayPage.close()

  // 2) Popup (screenshot mode) – crop to #mainInterface only, then composite onto Pinboard and save standalone
  const popupUrl = `${baseUrl}/src/ui/popup/popup.html?screenshot=1&url=${encodeURIComponent(screenshotPopupUrl)}&title=${encodeURIComponent(screenshotPopupTitle)}`
  const popupPage = await context.newPage()
  await popupPage.goto(popupUrl, { waitUntil: 'domcontentloaded', timeout: 15000 })
  await popupPage.locator(POPUP_MAIN_SELECTOR).waitFor({ state: 'visible', timeout: 10000 })
  await popupPage.locator(POPUP_READY_ATTR).waitFor({ state: 'attached', timeout: 15000 })
  await popupPage.waitForTimeout(300)
  const popupBuffer = await popupPage.locator(POPUP_MAIN_SELECTOR).screenshot()
  await popupPage.close()

  // Save cropped popup (tight to content, no extra whitespace)
  const popupPath = path.join(imagesDir, 'Hoverboard_v1.0.7.0_Chrome_Popup.png')
  fs.writeFileSync(popupPath, popupBuffer)
  console.log('Saved: images/Hoverboard_v1.0.7.0_Chrome_Popup.png (cropped to popup content)')

  // Composite popup onto Pinboard page image (overlay + popup in one image)
  const pageImage = sharp(pinboardTempPath)
  const pageMeta = await pageImage.metadata()
  const popupImage = sharp(popupBuffer)
  const popupMeta = await popupImage.metadata()
  const left = pageMeta.width - popupMeta.width - POPUP_COMPOSITE_INSET
  const top = POPUP_COMPOSITE_INSET
  await pageImage
    .composite([{ input: popupBuffer, left: Math.max(0, left), top }])
    .toFile(path.join(imagesDir, 'Hoverboard_v1.0.7.0_Chrome_Pinboard.png'))
  console.log('Saved: images/Hoverboard_v1.0.7.0_Chrome_Pinboard.png (overlay + popup composited)')
  try { fs.unlinkSync(pinboardTempPath) } catch (_) {}

  // 3) Options
  await optionsPage.reload({ waitUntil: 'domcontentloaded', timeout: 15000 })
  await optionsPage.locator(OPTIONS_LOAD_SELECTOR).first().waitFor({ state: 'attached', timeout: 10000 })
  await optionsPage.waitForTimeout(500)
  await optionsPage.screenshot({
    path: path.join(imagesDir, 'Hoverboard_v1.0.7.0_Chrome_Options.png'),
    fullPage: true
  })
  console.log('Saved: images/Hoverboard_v1.0.7.0_Chrome_Options.png')
  await optionsPage.close()

  // 4) Local bookmarks index – check Local (L) so seeded bookmarks (storage: local) are visible
  const indexPage = await context.newPage()
  await indexPage.goto(`${baseUrl}/src/ui/bookmarks-table/bookmarks-table.html`, { waitUntil: 'domcontentloaded', timeout: 15000 })
  await indexPage.locator(TABLE_SELECTOR).first().waitFor({ state: 'attached', timeout: 10000 })
  await indexPage.locator(STORE_LOCAL_CHECKBOX).check()
  await indexPage.waitForTimeout(500)
  await indexPage.screenshot({
    path: path.join(imagesDir, 'local-bookmarks-index.png'),
    fullPage: true
  })
  console.log('Saved: images/local-bookmarks-index.png')
  await indexPage.close()

  // 5) Side panel – tabbed page (Bookmark + Tags tree); 240px viewport so capture matches real side panel width [IMPL-SCREENSHOT_MODE]
  const sidePanelPage = await context.newPage()
  await sidePanelPage.setViewportSize(SIDE_PANEL_VIEWPORT)
  await sidePanelPage.goto(`${baseUrl}/src/ui/side-panel/side-panel.html`, { waitUntil: 'domcontentloaded', timeout: 15000 })
  await sidePanelPage.waitForTimeout(2000)

  // 5a) Bookmark tab (default): wait for content then capture
  await sidePanelPage.locator(SIDE_PANEL_BOOKMARK_READY).first().waitFor({ state: 'attached', timeout: 10000 })
  await sidePanelPage.waitForTimeout(800)
  await sidePanelPage.screenshot({
    path: path.join(imagesDir, 'side-panel-bookmark.png'),
    fullPage: true
  })
  console.log('Saved: images/side-panel-bookmark.png')

  // 5b) Tags tree tab: switch tab, wait for tree content, capture
  await sidePanelPage.locator(SIDE_PANEL_TAB_TAGS_TREE).click()
  await sidePanelPage.waitForTimeout(2000)
  await sidePanelPage.locator(SIDE_PANEL_READY_SELECTOR).first().waitFor({ state: 'attached', timeout: 10000 })
  await sidePanelPage.waitForTimeout(500)
  await sidePanelPage.screenshot({
    path: path.join(imagesDir, 'side-panel-tags-tree.png'),
    fullPage: true
  })
  console.log('Saved: images/side-panel-tags-tree.png')
  await sidePanelPage.close()

  // 6) Browser Bookmark Import – table or empty state (uses chrome.bookmarks.getTree from profile)
  const importPage = await context.newPage()
  await importPage.goto(`${baseUrl}/src/ui/browser-bookmark-import/browser-bookmark-import.html`, {
    waitUntil: 'domcontentloaded',
    timeout: 15000
  })
  await importPage.locator('#table-wrapper, #empty-state').first().waitFor({ state: 'attached', timeout: 10000 })
  await importPage.waitForTimeout(1000)
  await importPage.screenshot({
    path: path.join(imagesDir, 'browser-bookmark-import.png'),
    fullPage: true
  })
  console.log('Saved: images/browser-bookmark-import.png')
  await importPage.close()

  await context.close()
  console.log('Done. Screenshots in images/')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
