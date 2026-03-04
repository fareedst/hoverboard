#!/usr/bin/env node
/**
 * [PROC-DEMO_RECORDING] [IMPL-DEMO_OVERLAY] [REQ-BOOKMARK_USAGE_TRACKING] [IMPL-BOOKMARK_USAGE_TRACKING_UI]
 * Standalone script: launch extension, seed usage/edges and persist Usage tab, open side panel,
 * capture screenshot sequence per demo_gif_standard, assemble GIF via ffmpeg 3-part concat.
 * Run: node scripts/record-demo-side-panel-usage.js
 * Output: docs/demo-side-panel-usage.gif
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
const gifOut = path.join(rootDir, 'docs', 'demo-side-panel-usage.gif')

/** [IMPL-DEMO_OVERLAY] [PROC-DEMO_RECORDING] Presentation rate 25% slower: multiply all wait durations by RATE */
const RATE = 1.25

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

  // [IMPL-BOOKMARK_USAGE_TRACKING_UI] [IMPL-DEMO_OVERLAY] Seed rich usage + nav edges and persist Usage tab so panel opens with Usage visible from first frame.
  const localSeed = {
    ...placeholderStorageSeed,
    ...getPlaceholderUsageSeed(),
    ...getPlaceholderEdgesSeed(),
    hoverboard_sidepanel_active_tab: 'usage',
  }
  const optionsPage = await context.newPage()
  await optionsPage.goto(`chrome-extension://${extensionId}/src/ui/options/options.html`, { waitUntil: 'domcontentloaded', timeout: 15000 })
  await optionsPage.evaluate(async (seed) => {
    await chrome.storage.local.set(seed)
  }, localSeed)
  await optionsPage.waitForTimeout(Math.round(500 * RATE))
  await optionsPage.close()

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

  // [IMPL-DEMO_OVERLAY] Header background slightly more opaque (0.78) per demo_gif_standard.
  async function setOverlay (action, achievement, textClass = 'intro') {
    const { color } = OVERLAY_CLASSES[textClass] || OVERLAY_CLASSES.intro
    await page.evaluate(({ action, achievement, color }) => {
      let el = document.getElementById('__demo_overlay__')
      if (!el) {
        el = document.createElement('div')
        el.id = '__demo_overlay__'
        el.style.cssText = [
          'position:fixed', 'top:0', 'left:0', 'right:0',
          'background:rgba(0,0,0,0.78)', 'color:#fff',
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

  // [IMPL-DEMO_OVERLAY] [PROC-DEMO_RECORDING] [REQ-BOOKMARK_USAGE_TRACKING] Element highlight: scope to #usagePanel
  async function highlightElement (selector) {
    await page.evaluate((sel) => {
      const panel = document.getElementById('usagePanel')
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

  // [IMPL-DEMO_OVERLAY] [REQ-BOOKMARK_USAGE_TRACKING] Open side panel; storage already set to Usage tab so first frame shows Usage.
  await page.goto(`chrome-extension://${extensionId}/src/ui/side-panel/side-panel.html`)
  await page.waitForLoadState('domcontentloaded')
  await page.waitForSelector('#usagePanel:not([hidden])', { timeout: 8000 }).catch(() => {})
  await page.waitForTimeout(Math.round(2000 * RATE))

  // [IMPL-DEMO_OVERLAY] 1 s with no overlay so the beginning is a useful static image (frame 0).
  await removeOverlay()
  await page.waitForTimeout(Math.round(1000 * RATE))
  await snap()

  // Step 1: Viewing the Usage tab — overlay describes the tab (descriptions 30–50% longer).
  await clearHighlight()
  await setOverlay(
    'Viewing the Usage tab',
    'The side panel opens on the Usage tab so you can see Most Visited, Recently Visited, and the Navigation Graph (referrer → URL edges).',
    'intro'
  )
  await highlightElement('.usage-panel-toolbar')
  await page.waitForTimeout(Math.round(400 * RATE))
  await snap()
  await page.waitForTimeout(Math.round(400 * RATE))
  await snap()
  await page.waitForTimeout(Math.round(400 * RATE))
  await snap()

  // Step 2: Most Visited section
  await clearHighlight()
  await setOverlay(
    'Most Visited',
    'Top bookmarks by visit count; each row shows rank, URL, and visit count. Data is stored locally.',
    'state'
  )
  await highlightElement('[data-usage-most-visited]')
  await page.waitForTimeout(Math.round(400 * RATE))
  await snap()
  await page.waitForTimeout(Math.round(400 * RATE))
  await snap()
  await page.waitForTimeout(Math.round(400 * RATE))
  await snap()

  // Step 3: Recently Visited section
  await clearHighlight()
  await setOverlay(
    'Recently Visited',
    'Bookmarks ordered by last visit time so you can quickly return to pages you opened recently.',
    'state'
  )
  await highlightElement('[data-usage-recently-visited]')
  await page.waitForTimeout(Math.round(400 * RATE))
  await snap()
  await page.waitForTimeout(Math.round(400 * RATE))
  await snap()
  await page.waitForTimeout(Math.round(400 * RATE))
  await snap()

  // Step 4: Refresh button
  await clearHighlight()
  await setOverlay(
    'Refresh',
    'Click Refresh to reload usage stats and the navigation graph from local storage.',
    'action'
  )
  await highlightElement('[data-usage-refresh]')
  await page.waitForTimeout(Math.round(400 * RATE))
  await snap()
  await page.waitForTimeout(Math.round(400 * RATE))
  await snap()
  await page.waitForTimeout(Math.round(400 * RATE))
  await snap()

  // Step 5: Navigation Graph section
  await clearHighlight()
  await setOverlay(
    'Navigation Graph',
    'Referrer → URL edges show how you move between bookmarked pages; each link is clickable to open in a new tab.',
    'navigation'
  )
  await page.locator('#usage-graph-heading').scrollIntoViewIfNeeded()
  await page.waitForTimeout(Math.round(200 * RATE))
  await highlightElement('[data-usage-graph]')
  await page.waitForTimeout(Math.round(400 * RATE))
  await snap()
  await page.waitForTimeout(Math.round(400 * RATE))
  await snap()
  await page.waitForTimeout(Math.round(400 * RATE))
  await snap()

  // [IMPL-DEMO_OVERLAY] End card: 0.5 s pause then Hoverboard icon centered for 0.5s (one frame; duration set when building GIF).
  await clearHighlight()
  await removeOverlay()
  await page.waitForTimeout(Math.round(500 * RATE))
  await page.evaluate(() => {
    const url = typeof chrome !== 'undefined' && chrome.runtime ? chrome.runtime.getURL('icons/hoverboard_128.png') : ''
    const el = document.createElement('div')
    el.id = '__demo_end_card__'
    el.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'right:0', 'bottom:0',
      'background:rgba(0,0,0,0.85)', 'display:flex', 'align-items:center', 'justify-content:center',
      'z-index:2147483647', 'pointer-events:none',
    ].join(';')
    if (url) {
      const img = document.createElement('img')
      img.src = url
      img.alt = 'Hoverboard'
      img.style.cssText = 'width:128px;height:128px;'
      el.appendChild(img)
    }
    document.body.appendChild(el)
  })
  await page.waitForTimeout(Math.round(400 * RATE))
  await snap()

  await page.evaluate(() => {
    const el = document.getElementById('__demo_end_card__')
    if (el) el.remove()
  })
  await context.close()

  if (frameIdx === 0) {
    console.error('No frames captured')
    process.exit(1)
  }

  const totalFrames = frameIdx
  const lastFrameIdx = totalFrames - 1
  const frame0Path = path.join(framesDir, 'frame-0000.png')
  const lastFramePath = path.join(framesDir, `frame-${String(lastFrameIdx).padStart(4, '0')}.png`)

  // [IMPL-DEMO_OVERLAY] 3-part concat: no-overlay (frame 0, 1 s) + main (frames 1..N-2, 1 fps) + end logo (frame N-1, 0.5 s).
  const palettePath = path.join(rootDir, 'test-results', 'demo-usage-palette.png')
  const framesPattern = path.join(framesDir, 'frame-%04d.png')
  const noOverlayGifPath = path.join(rootDir, 'test-results', 'demo-usage-nooverlay.gif')
  const mainGifPath = path.join(rootDir, 'test-results', 'demo-usage-main.gif')
  const endGifPath = path.join(rootDir, 'test-results', 'demo-usage-end.gif')
  const mainFrameCount = Math.max(0, totalFrames - 2)

  execSync(
    `ffmpeg -framerate 1 -i "${framesPattern}" -vf "fps=1,scale=400:-1:flags=lanczos,palettegen=max_colors=128" -y "${palettePath}"`,
    { cwd: rootDir, stdio: 'inherit' }
  )
  // No-overlay GIF: frame 0 only, duration 1 s (useful static image at start).
  execSync(
    `ffmpeg -loop 1 -i "${frame0Path}" -i "${palettePath}" -filter_complex "scale=400:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:diff_mode=rectangle" -t 1 -y "${noOverlayGifPath}"`,
    { cwd: rootDir, stdio: 'inherit' }
  )
  // Main GIF: frames 1 through N-2 (1 fps each).
  if (mainFrameCount > 0) {
    execSync(
      `ffmpeg -framerate 1 -start_number 1 -i "${framesPattern}" -i "${palettePath}" -filter_complex "fps=1,scale=400:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:diff_mode=rectangle" -frames:v ${mainFrameCount} -loop 0 -y "${mainGifPath}"`,
      { cwd: rootDir, stdio: 'inherit' }
    )
  }
  // End card GIF: last frame only, duration 0.5 s (interstitial between replays).
  execSync(
    `ffmpeg -loop 1 -i "${lastFramePath}" -i "${palettePath}" -filter_complex "scale=400:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:diff_mode=rectangle" -t 0.5 -y "${endGifPath}"`,
    { cwd: rootDir, stdio: 'inherit' }
  )
  // [IMPL-DEMO_OVERLAY] Use concat filter + re-encode so the output GIF has all frames (concat demuxer -c copy can yield a single-frame GIF).
  const concatParts = [noOverlayGifPath, mainGifPath, endGifPath]
  if (mainFrameCount === 0) concatParts.splice(1, 1)
  const n = concatParts.length
  const inputs = concatParts.map((p) => `-i "${p}"`).join(' ')
  const filterConcat = Array.from({ length: n }, (_, i) => `[${i}:v]`).join('') + `concat=n=${n}:v=1:a=0[out]`
  execSync(
    `ffmpeg ${inputs} -filter_complex "${filterConcat}" -map "[out]" -c:v gif -y "${gifOut}"`,
    { cwd: rootDir, stdio: 'inherit' }
  )

  console.log('GIF written:', gifOut)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
