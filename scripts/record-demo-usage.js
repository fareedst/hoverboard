#!/usr/bin/env node
/**
 * [PROC-DEMO_RECORDING] [REQ-BOOKMARK_USAGE_TRACKING] [IMPL-BOOKMARK_USAGE_TRACKING_UI]
 * Standalone script: launch extension, open side panel, switch to Usage tab,
 * capture screenshot sequence, assemble GIF via ffmpeg two-pass palette.
 * Run: node scripts/record-demo-usage.js
 * Output: docs/demo-usage.gif
 */

import path from 'path'
import fs from 'fs'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import { chromium } from 'playwright'
import {
  placeholderStorageSeed,
  getPlaceholderUsageSeed,
  getPlaceholderEdgesSeed
} from './screenshot-placeholder-data.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '..')
const pathToExtension = path.join(rootDir, 'dist')
const framesDir = path.join(rootDir, 'test-results', 'demo-usage-frames')
const gifOut = path.join(rootDir, 'docs', 'demo-usage.gif')

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

  // [IMPL-BOOKMARK_USAGE_TRACKING_UI] Seed rich usage + nav edges so demo GIF shows robust Usage tab data.
  const localSeed = {
    ...placeholderStorageSeed,
    ...getPlaceholderUsageSeed(),
    ...getPlaceholderEdgesSeed()
  }
  const optionsPage = await context.newPage()
  await optionsPage.goto(`chrome-extension://${extensionId}/src/ui/options/options.html`, { waitUntil: 'domcontentloaded', timeout: 15000 })
  await optionsPage.evaluate(async (seed) => {
    await chrome.storage.local.set(seed)
  }, localSeed)
  await optionsPage.waitForTimeout(500)
  await optionsPage.close()

  const page = await context.newPage()
  let frameIdx = 0
  async function snap () {
    const p = path.join(framesDir, `frame-${String(frameIdx++).padStart(4, '0')}.png`)
    await page.screenshot({ path: p })
  }

  const OVERLAY_CLASSES = {
    intro: { color: '#e0e0e0' },
    navigation: { color: '#42a5f5' },
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

  // Step 1: Load side panel (This Page tab)
  await page.goto(`chrome-extension://${extensionId}/src/ui/side-panel/side-panel.html`)
  await page.waitForLoadState('domcontentloaded')
  await page.waitForTimeout(1500)
  await setOverlay('Opening the side panel', 'Switching to Usage tab next', 'intro')
  await snap()
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()

  // Step 2: Switch to Usage tab
  await setOverlay('Switching to the Usage tab', 'Most Visited, Recently Visited, Navigation Graph', 'navigation')
  await page.locator('.side-panel-tab[data-tab="usage"]').click()
  await snap()
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()

  // Step 3: Wait for Usage panel to load
  await page.locator('#usagePanel #usage-most-visited-heading, #usagePanel [data-usage-refresh]').first().waitFor({ state: 'attached', timeout: 10000 })
  await page.waitForTimeout(500)
  await setOverlay('Usage tab loaded', 'Most Visited, Recently Visited, Navigation Graph', 'result')
  await snap()
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()

  // Step 4: Click Refresh
  await setOverlay('Clicking Refresh', 'Reloads usage stats and graph', 'navigation')
  await page.locator('[data-usage-refresh]').click()
  await page.waitForTimeout(600)
  await snap()
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()

  // Step 5: Scroll to Navigation Graph so it appears in the GIF
  await setOverlay('Navigation Graph', 'Referrer → URL edges at the bottom', 'navigation')
  await page.locator('#usage-graph-heading').scrollIntoViewIfNeeded()
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

  // Two-pass ffmpeg: palettegen then paletteuse (same as record-demo-tabs.js)
  const palettePath = path.join(rootDir, 'test-results', 'demo-usage-palette.png')
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
