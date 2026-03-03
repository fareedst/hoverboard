#!/usr/bin/env node
/**
 * [PROC-DEMO_RECORDING] [IMPL-DEMO_OVERLAY] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_BOOKMARK] [IMPL-SCREENSHOT_MODE]
 * Standalone script: launch extension with software rendering (SwiftShader), seed placeholder bookmark data,
 * run This Page-tab flow with ?screenshot=1&url&title so panel shows rich Pinboard bookmark, capture sequence, assemble GIF.
 * Run: node scripts/record-demo-bookmark.js
 * Output: docs/demo-bookmark.gif
 */

import path from 'path'
import fs from 'fs'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import { chromium } from 'playwright'
import {
  placeholderStorageSeed,
  screenshotPopupUrl,
  screenshotPopupTitle
} from './screenshot-placeholder-data.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '..')
const pathToExtension = path.join(rootDir, 'dist')
const framesDir = path.join(rootDir, 'test-results', 'demo-frames-bookmark')
const gifOut = path.join(rootDir, 'docs', 'demo-bookmark.gif')

fs.mkdirSync(framesDir, { recursive: true })
fs.mkdirSync(path.dirname(gifOut), { recursive: true })

async function main () {
  const context = await chromium.launchPersistentContext('', {
    headless: false,
    channel: 'chromium',
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
      '--use-angle=swiftshader',
      '--disable-gpu-sandbox',
    ],
    viewport: { width: 400, height: 700 },
  })

  const re = /chrome-extension:\/\/([a-z]{32})\//
  let extensionId = null
  const existing = context.serviceWorkers()
  for (const sw of existing) {
    const url = sw?.url?.()
    if (url) {
      const match = url.match(re)
      if (match) {
        extensionId = match[1]
        break
      }
    }
  }
  if (!extensionId) {
    const worker = await context.waitForEvent('serviceworker', { timeout: 15000 }).catch(() => null)
    if (worker?.url()) {
      const match = worker.url().match(re)
      if (match) extensionId = match[1]
    }
  }
  if (!extensionId) {
    await context.close()
    throw new Error('Extension ID not found')
  }

  // [IMPL-SCREENSHOT_MODE] [REQ-LOCAL_BOOKMARKS_INDEX] Seed storage so This Page tab shows rich Pinboard bookmark in demo GIF.
  const optionsPage = await context.newPage()
  await optionsPage.goto(`chrome-extension://${extensionId}/src/ui/options/options.html`, { waitUntil: 'domcontentloaded', timeout: 15000 })
  await optionsPage.evaluate(async (seed) => {
    await chrome.storage.local.set(seed)
  }, placeholderStorageSeed)
  await optionsPage.waitForTimeout(500)
  await optionsPage.close()

  // Open a page so the extension has an active tab for bookmark context
  const auxPage = await context.newPage()
  await auxPage.goto('https://playwright.dev', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {})

  const page = await context.newPage()
  let frameIdx = 0
  async function snap () {
    const p = path.join(framesDir, `frame-${String(frameIdx++).padStart(4, '0')}.png`)
    await page.screenshot({ path: p })
  }

  // [IMPL-DEMO_OVERLAY] [PROC-DEMO_RECORDING] Overlay at top; larger font; five text classes with colors
  const OVERLAY_CLASSES = {
    intro: { color: '#e0e0e0' },
    navigation: { color: '#42a5f5' },
    state: { color: '#ffa726' },
    action: { color: '#26c6da' },
    result: { color: '#66bb6a' },
  }

  async function setOverlay (action, achievement, textClass = 'intro') {
    const { color } = OVERLAY_CLASSES[textClass] || OVERLAY_CLASSES.intro
    await page.evaluate(({ action, achievement, color }) => {
      let el = document.getElementById('__demo_overlay__')
      if (!el) {
        el = document.createElement('div')
        el.id = '__demo_overlay__'
        el.style.cssText = [
          'position:fixed', 'top:0', 'left:0', 'right:0',
          'background:rgba(0,0,0,0.72)', 'color:#fff',
          'font-family:system-ui,sans-serif', 'font-size:18px',
          'line-height:1.4', 'padding:8px 12px',
          'z-index:2147483647', 'pointer-events:none',
        ].join(';')
        document.body.appendChild(el)
      }
      el.innerHTML =
        `<strong style="color:${color}">${action}</strong><br>` +
        `<span style="opacity:0.8;color:${color}">${achievement}</span>`
    }, { action, achievement, color })
  }

  async function removeOverlay () {
    await page.evaluate(() => {
      const el = document.getElementById('__demo_overlay__')
      if (el) el.remove()
    })
  }

  // [IMPL-DEMO_OVERLAY] [PROC-DEMO_RECORDING] Element highlight: apply outline/box-shadow to selector inside #bookmarkPanel; clear before next highlight.
  async function highlightElement (selector) {
    await page.evaluate((sel) => {
      const panel = document.getElementById('bookmarkPanel')
      if (!panel) return
      const el = panel.querySelector(sel)
      if (!el) return
      const prev = document.querySelector('[data-demo-highlight="1"]')
      if (prev) {
        prev.removeAttribute('data-demo-highlight')
        prev.style.outline = ''
        prev.style.boxShadow = ''
      }
      el.setAttribute('data-demo-highlight', '1')
      el.style.outline = '3px solid #42a5f5'
      el.style.boxShadow = '0 0 0 3px rgba(66,165,245,0.4)'
    }, selector)
  }

  async function clearHighlight () {
    await page.evaluate(() => {
      const prev = document.querySelector('[data-demo-highlight="1"]')
      if (prev) {
        prev.removeAttribute('data-demo-highlight')
        prev.style.outline = ''
        prev.style.boxShadow = ''
      }
    })
  }

  // Step 1: Load side panel with screenshot params so This Page tab shows Pinboard bookmark [IMPL-SCREENSHOT_MODE]
  const sidePanelUrl = `chrome-extension://${extensionId}/src/ui/side-panel/side-panel.html?screenshot=1&url=${encodeURIComponent(screenshotPopupUrl)}&title=${encodeURIComponent(screenshotPopupTitle)}`
  await page.goto(sidePanelUrl)
  await page.waitForLoadState('domcontentloaded')
  await page.waitForTimeout(1500)
  await setOverlay('Opening the side panel', 'Hoverboard: This Page tab', 'intro')
  await snap()
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()

  // Wait for This Page panel main interface (loading state may show first)
  await page.waitForSelector('#bookmarkPanel [data-popup-ref="mainInterface"]:not(.hidden)', { timeout: 8000 }).catch(() => {})

  // Step 2: Panel ready — 3 frames
  await setOverlay('This Page tab', 'Quick actions, storage, tags for current tab', 'intro')
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()

  // Step 3: Quick Actions — highlight entire row [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_BOOKMARK]
  await clearHighlight()
  await setOverlay('Quick Actions', 'Show Hover, Toggle Privacy, Read Later, Delete', 'state')
  await highlightElement('.quick-actions')
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()

  // Step 4: Save to (Storage) — highlight Storage row [REQ-MOVE_BOOKMARK_STORAGE_UI]
  await clearHighlight()
  await setOverlay('Save to', 'Pinboard, File, Local, Sync', 'state')
  await highlightElement('.storage-section')
  await page.locator('#bookmarkPanel [data-popup-ref="storageBackendButtons"]').scrollIntoViewIfNeeded().catch(() => {})
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()

  // Step 5: Add tags to populate Recent Tags [REQ-RECENT_TAGS_SYSTEM]
  await clearHighlight()
  await setOverlay('Adding tags', 'Type tag and click Add — populates Recent Tags', 'action')
  const newTagInput = page.locator('#bookmarkPanel [data-popup-ref="newTagInput"]')
  const addTagBtn = page.locator('#bookmarkPanel [data-popup-ref="addTagBtn"]')
  for (const tag of ['demo', 'reading', 'tools']) {
    if (await newTagInput.isVisible()) {
      await newTagInput.fill(tag)
      await page.waitForTimeout(300)
      await snap()
      if (await addTagBtn.isEnabled()) {
        await addTagBtn.click()
        await page.waitForTimeout(400)
        await snap()
      }
    }
  }

  // Step 6: Tag with AI — highlight and describe [REQ-AI_TAGGING_POPUP] [IMPL-DEMO_OVERLAY]
  await clearHighlight()
  await setOverlay('Tag with AI', 'Get AI-suggested tags for this page (set API key in Options)', 'action')
  await highlightElement('[data-popup-ref="tagWithAiBtn"]')
  await page.locator('#bookmarkPanel [data-popup-ref="tagWithAiBtn"]').scrollIntoViewIfNeeded().catch(() => {})
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()

  // Step 7: Recent Tags — highlight and describe [REQ-RECENT_TAGS_SYSTEM]
  await clearHighlight()
  await setOverlay('Recent Tags', 'Recently used tags for quick add', 'state')
  await highlightElement('.recent-tags')
  await page.locator('#bookmarkPanel .recent-tags').scrollIntoViewIfNeeded().catch(() => {})
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()

  // Step 8: Suggested (Recommended) Tags — highlight and describe [REQ-SUGGESTED_TAGS_FROM_CONTENT]
  await clearHighlight()
  await setOverlay('Suggested Tags', 'Recommended from page content (headings, etc.)', 'state')
  await highlightElement('[data-popup-ref="suggestedTags"]')
  await page.locator('#bookmarkPanel [data-popup-ref="suggestedTags"]').scrollIntoViewIfNeeded().catch(() => {})
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()

  // Step 9: Search Tabs — highlight and describe
  await clearHighlight()
  await setOverlay('Search Tabs', 'Search open tabs by title', 'navigation')
  await highlightElement('.search-section')
  await page.locator('#bookmarkPanel .search-section').scrollIntoViewIfNeeded().catch(() => {})
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()

  // Step 10: Footer — highlight and describe
  await clearHighlight()
  await setOverlay('Footer', 'Reload, Options, Bookmarks index, By Tag, Browser bookmark import', 'state')
  await highlightElement('.popup-footer')
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()

  // Step 11: Result
  await clearHighlight()
  await setOverlay('Tag added', 'Current tags and Recent Tags updated', 'result')
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()

  await clearHighlight()
  await removeOverlay()
  await context.close()

  if (frameIdx === 0) {
    console.error('No frames captured')
    process.exit(1)
  }

  // Two-pass ffmpeg: palettegen then paletteuse (1 fps, scale 400, same as Tabs demo)
  const palettePath = path.join(rootDir, 'test-results', 'demo-palette-bookmark.png')
  const framesPattern = path.join(framesDir, 'frame-%04d.png')
  execSync(
    `ffmpeg -framerate 1 -i "${framesPattern}" -vf "fps=1,scale=400:-1:flags=lanczos,palettegen=max_colors=128" -y "${palettePath}"`,
    { cwd: rootDir, stdio: 'inherit' }
  )
  execSync(
    `ffmpeg -framerate 1 -i "${framesPattern}" -i "${palettePath}" -filter_complex "fps=1,scale=400:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:diff_mode=rectangle" -loop 0 -y "${gifOut}"`,
    { cwd: rootDir, stdio: 'inherit' }
  )

  console.log('GIF written:', gifOut)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
