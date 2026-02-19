#!/usr/bin/env node
/**
 * Generate README/docs screenshots with placeholder bookmark data.
 * [IMPL-SCREENSHOT_MODE] Requires built extension in dist/. Run: npm run build:dev && node scripts/screenshots-placeholder.js
 * Popup is cropped to #mainInterface only. Pinboard image composites overlay page + cropped popup.
 */

import path from 'path'
import fs from 'fs'
import os from 'os'
import { fileURLToPath } from 'url'
import { chromium } from '@playwright/test'
import sharp from 'sharp'
import {
  placeholderStorageSeed,
  placeholderSyncSeed,
  screenshotPopupUrl,
  screenshotPopupTitle
} from './screenshot-placeholder-data.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.join(__dirname, '..')
const extPath = path.join(projectRoot, 'dist')
const imagesDir = path.join(projectRoot, 'images')

const PINBOARD_CONTENT_URL = 'https://pinboard.in/'
const SCREENSHOT_WAIT_MS = 3000
const OVERLAY_SELECTOR = '#hoverboard-overlay'
const POPUP_MAIN_SELECTOR = '#mainInterface'
const OPTIONS_LOAD_SELECTOR = '#auth-token, #storage-mode-pinboard'
const TABLE_SELECTOR = '.bookmarks-table tbody, .empty-state'
const POPUP_COMPOSITE_INSET = 24 // px from top-right when compositing popup onto Pinboard image

async function main () {
  if (!fs.existsSync(extPath) || !fs.existsSync(path.join(extPath, 'manifest.json'))) {
    console.error('Extension not built. Run: npm run build:dev')
    process.exit(1)
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

  // Seed storage from extension context (options page has chrome.storage)
  const optionsPage = await context.newPage()
  await optionsPage.goto(`${baseUrl}/src/ui/options/options.html`, { waitUntil: 'domcontentloaded', timeout: 15000 })
  await optionsPage.evaluate(({ localSeed, syncSeed }) => {
    chrome.storage.local.set(localSeed)
    if (syncSeed && typeof chrome.storage.sync !== 'undefined') {
      chrome.storage.sync.set(syncSeed)
    }
  }, { localSeed: placeholderStorageSeed, syncSeed: placeholderSyncSeed })
  await optionsPage.waitForTimeout(1000)

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
  await popupPage.waitForTimeout(500)
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

  // 4) Local bookmarks index
  const indexPage = await context.newPage()
  await indexPage.goto(`${baseUrl}/src/ui/bookmarks-table/bookmarks-table.html`, { waitUntil: 'domcontentloaded', timeout: 15000 })
  await indexPage.locator(TABLE_SELECTOR).first().waitFor({ state: 'attached', timeout: 10000 })
  await indexPage.waitForTimeout(1000)
  await indexPage.screenshot({
    path: path.join(imagesDir, 'local-bookmarks-index.png'),
    fullPage: true
  })
  console.log('Saved: images/local-bookmarks-index.png')
  await indexPage.close()

  await context.close()
  console.log('Done. Screenshots in images/')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
