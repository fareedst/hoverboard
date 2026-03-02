#!/usr/bin/env node
/**
 * [PROC-DEMO_RECORDING] [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS]
 * Standalone script: launch extension with software rendering (SwiftShader), run Tabs-tab flow,
 * capture screenshot sequence, assemble GIF via ffmpeg two-pass palette.
 * Run: node scripts/record-demo-tabs.js
 * Output: docs/demo-tabs-export.gif
 */

import path from 'path'
import fs from 'fs'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import { chromium } from 'playwright'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '..')
const pathToExtension = path.join(rootDir, 'dist')
const framesDir = path.join(rootDir, 'test-results', 'demo-frames')
const gifOut = path.join(rootDir, 'docs', 'demo-tabs-export.gif')

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

  // Open demo pages so the Tabs list has real content
  const p1 = await context.newPage()
  await p1.goto('https://playwright.dev', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {})
  const p2 = await context.newPage()
  await p2.goto('https://github.com', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {})

  const page = await context.newPage()
  let frameIdx = 0
  async function snap () {
    const p = path.join(framesDir, `frame-${String(frameIdx++).padStart(4, '0')}.png`)
    await page.screenshot({ path: p })
  }

  async function setOverlay (action, achievement) {
    await page.evaluate(({ action, achievement }) => {
      let el = document.getElementById('__demo_overlay__')
      if (!el) {
        el = document.createElement('div')
        el.id = '__demo_overlay__'
        el.style.cssText = [
          'position:fixed', 'bottom:0', 'left:0', 'right:0',
          'background:rgba(0,0,0,0.72)', 'color:#fff',
          'font-family:system-ui,sans-serif', 'font-size:12px',
          'line-height:1.4', 'padding:8px 12px',
          'z-index:2147483647', 'pointer-events:none',
        ].join(';')
        document.body.appendChild(el)
      }
      el.innerHTML =
        `<strong>${action}</strong><br>` +
        `<span style="opacity:0.8">${achievement}</span>`
    }, { action, achievement })
  }

  async function removeOverlay () {
    await page.evaluate(() => {
      const el = document.getElementById('__demo_overlay__')
      if (el) el.remove()
    })
  }

  // Step 1: Load side panel; hold on Bookmark tab
  await page.goto(`chrome-extension://${extensionId}/src/ui/side-panel/side-panel.html`)
  await page.waitForLoadState('domcontentloaded')
  await page.waitForTimeout(1500)
  await setOverlay('Opening the side panel', 'Hoverboard: bookmarks, tabs & search')
  await snap()
  await page.waitForTimeout(400)
  await snap()

  // Step 2: Click Tabs tab; wait for list init
  await setOverlay('Switching to the Tabs tab', 'Lists all open browser tabs')
  await page.locator('.side-panel-tab[data-tab="browserTabs"]').click()
  await snap()
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()

  // Step 3: List populated; hold for viewer
  await setOverlay('Tab list loaded', 'Each row: title, URL and referrer')
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()

  // Step 4: Fill filter with "playwright"; wait
  await setOverlay("Filtering: typing 'playwright'", 'Only matching tabs remain visible')
  const filterInput = page.locator('#browserTabsFilterInput')
  if (await filterInput.isVisible()) {
    await filterInput.fill('playwright')
    await page.waitForTimeout(300)
    await snap()
    await page.waitForTimeout(300)
    await snap()
    await page.waitForTimeout(300)
    await snap()
  }

  // Step 5: Click Copy Records; wait for feedback
  await setOverlay('Clicking Copy Records', 'Exports visible tabs as YAML to clipboard')
  await page.locator('[data-action="copyRecords"], #browserTabsCopyRecordsBtn').click()
  await page.waitForTimeout(300)
  await snap()
  await page.waitForTimeout(300)
  await snap()
  await page.waitForTimeout(300)
  await snap()

  // Step 6: Success message visible; hold
  await setOverlay('Export complete', 'YAML records copied — ready to paste')
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

  // Two-pass ffmpeg: palettegen then paletteuse
  const palettePath = path.join(rootDir, 'test-results', 'demo-palette.png')
  const framesPattern = path.join(framesDir, 'frame-%04d.png')
  execSync(
    `ffmpeg -framerate 4 -i "${framesPattern}" -vf "fps=4,scale=400:-1:flags=lanczos,palettegen=max_colors=128" -y "${palettePath}"`,
    { cwd: rootDir, stdio: 'inherit' }
  )
  execSync(
    `ffmpeg -framerate 4 -i "${framesPattern}" -i "${palettePath}" -filter_complex "fps=4,scale=400:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:diff_mode=rectangle" -loop 0 -y "${gifOut}"`,
    { cwd: rootDir, stdio: 'inherit' }
  )

  console.log('GIF written:', gifOut)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
