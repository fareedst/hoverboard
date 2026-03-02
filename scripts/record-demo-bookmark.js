#!/usr/bin/env node
/**
 * [PROC-DEMO_RECORDING] [IMPL-DEMO_OVERLAY] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [IMPL-SIDE_PANEL_BOOKMARK]
 * Standalone script: launch extension with software rendering (SwiftShader), run Bookmark-tab flow,
 * capture screenshot sequence, assemble GIF via ffmpeg two-pass palette.
 * Run: node scripts/record-demo-bookmark.js
 * Output: docs/demo-bookmark.gif
 */

import path from 'path'
import fs from 'fs'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import { chromium } from 'playwright'

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

  // Step 1: Load side panel (Bookmark tab is default) — 3 frames
  await page.goto(`chrome-extension://${extensionId}/src/ui/side-panel/side-panel.html`)
  await page.waitForLoadState('domcontentloaded')
  await page.waitForTimeout(1500)
  await setOverlay('Opening the side panel', 'Hoverboard: Bookmark tab', 'intro')
  await snap()
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()

  // Wait for Bookmark panel main interface (loading state may show first)
  await page.waitForSelector('#bookmarkPanel [data-popup-ref="mainInterface"]:not(.hidden)', { timeout: 8000 }).catch(() => {})

  // Step 2: Panel ready — 3 frames
  await setOverlay('Bookmark tab', 'Quick actions, storage, tags for current tab', 'intro')
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()

  // Step 3: Show Quick Actions — state
  await setOverlay('Quick Actions', 'Show Hover, Toggle Privacy, Read later, Delete', 'state')
  const showHover = page.locator('#bookmarkPanel [data-popup-ref="showHoverBtn"]')
  if (await showHover.isVisible()) await showHover.focus().catch(() => {})
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()

  // Step 4: Show Storage — state
  await setOverlay('Storage', 'Pinboard, File, Local, Sync', 'state')
  const storageWrap = page.locator('#bookmarkPanel [data-popup-ref="storageBackendButtons"]')
  if (await storageWrap.isVisible()) await storageWrap.scrollIntoViewIfNeeded().catch(() => {})
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()

  // Step 5: Add tag — action
  await setOverlay('Adding a tag', 'Type tag and click Add', 'action')
  const newTagInput = page.locator('#bookmarkPanel [data-popup-ref="newTagInput"]')
  const addTagBtn = page.locator('#bookmarkPanel [data-popup-ref="addTagBtn"]')
  if (await newTagInput.isVisible()) {
    await newTagInput.fill('demo')
    await page.waitForTimeout(300)
    await snap()
    await page.waitForTimeout(300)
    await snap()
    if (await addTagBtn.isEnabled()) {
      await addTagBtn.click()
      await page.waitForTimeout(400)
      await snap()
      await page.waitForTimeout(300)
      await snap()
    }
  } else {
    await page.waitForTimeout(400)
    await snap()
    await page.waitForTimeout(400)
    await snap()
  }

  // Step 6: Result — result
  await setOverlay('Tag added', 'Current tags updated', 'result')
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()

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
