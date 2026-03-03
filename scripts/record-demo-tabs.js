#!/usr/bin/env node
/**
 * [PROC-DEMO_RECORDING] [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] [IMPL-DEMO_OVERLAY]
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

  // Step 1: Load side panel; hold on This Page tab (3 frames)
  await page.goto(`chrome-extension://${extensionId}/src/ui/side-panel/side-panel.html`)
  await page.waitForLoadState('domcontentloaded')
  await page.waitForTimeout(1500)
  await setOverlay('Opening the side panel', 'Hoverboard: bookmarks, tabs & search', 'intro')
  await snap()
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()

  // Step 2: Panel ready (3 frames)
  await setOverlay('Side panel open', 'This Page tab visible; switch to Tabs next', 'intro')
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()

  // Step 3: Click Tabs tab; wait for list init (4 frames)
  await setOverlay('Switching to the Tabs tab', 'Lists all open browser tabs', 'navigation')
  await page.locator('.side-panel-tab[data-tab="browserTabs"]').click()
  await snap()
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()

  // Step 4: List loading (3 frames)
  await setOverlay('Tabs tab selected', 'Loading tab list…', 'navigation')
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()

  // Step 5: List populated (4 frames)
  await setOverlay('Tab list loaded', 'Each row: title, URL and referrer', 'state')
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()

  // Step 5a: Display mode — Title view
  await setOverlay('Switching to Title view', 'Each row shows only the tab title', 'state')
  await page.locator('#browserTabsListDisplayTitle').click()
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(300)
  await snap()
  await page.waitForTimeout(300)
  await snap()

  // Step 5b: Display mode — Block (restore)
  await setOverlay('Switching back to Block view', 'Full card with title, URL, referrer', 'state')
  await page.locator('#browserTabsListDisplayBlock').click()
  await page.waitForTimeout(300)
  await snap()
  await page.waitForTimeout(300)
  await snap()

  // Step 6: Before filter (2 frames)
  await setOverlay('Focusing filter', 'Type to narrow the list', 'state')
  const filterInput = page.locator('#browserTabsFilterInput')
  if (await filterInput.isVisible()) await filterInput.focus().catch(() => {})
  await page.waitForTimeout(300)
  await snap()
  await page.waitForTimeout(300)
  await snap()

  // Step 7: Type filter (4 frames)
  await setOverlay("Filtering: typing 'playwright'", 'Only matching tabs remain visible', 'action')
  if (await filterInput.isVisible()) {
    await filterInput.fill('playwright')
    await page.waitForTimeout(300)
    await snap()
    await page.waitForTimeout(300)
    await snap()
    await page.waitForTimeout(300)
    await snap()
    await page.waitForTimeout(300)
    await snap()
  }

  // Step 8: Filter applied (3 frames)
  await setOverlay('Filter applied', 'List shows matching tabs only', 'state')
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()

  // Step 8a: Remove from list (tab hidden, not closed)
  await setOverlay('Remove from list', 'Tab hidden from list (not closed)', 'action')
  await page.locator('#browserTabsPanel [data-action="removeFromDisplay"]').first().click()
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(300)
  await snap()
  await page.waitForTimeout(300)
  await snap()

  // Step 8b: Refresh (list reloaded; hidden tab reappears)
  await setOverlay('Refreshing tab list', 'List reloaded; hidden tabs reappear', 'action')
  await page.locator('#browserTabsPanel [data-action="refreshTabs"]').click()
  await page.waitForTimeout(700)
  await snap()
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()

  // Step 9: Copy Records (4 frames)
  await setOverlay('Clicking Copy Records', 'Exports visible tabs as YAML to clipboard', 'action')
  await page.locator('#browserTabsCopyRecordsBtn').click()
  await page.waitForTimeout(300)
  await snap()
  await page.waitForTimeout(300)
  await snap()
  await page.waitForTimeout(300)
  await snap()
  await page.waitForTimeout(300)
  await snap()

  // Step 10: Copy Records success (3 frames)
  await setOverlay('Export complete (YAML)', 'YAML records copied — ready to paste', 'result')
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()

  // Step 11: Copy URLs (3 frames)
  await setOverlay('Clicking Copy URLs', 'Exports visible tab URLs to clipboard', 'action')
  await page.locator('#browserTabsCopyBtn').click()
  await page.waitForTimeout(300)
  await snap()
  await page.waitForTimeout(300)
  await snap()
  await page.waitForTimeout(300)
  await snap()

  // Step 12: Copy URLs success (3 frames)
  await setOverlay('Export complete (URLs)', 'URLs copied — ready to paste', 'result')
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

  // Two-pass ffmpeg: palettegen then paletteuse (1 fps = 1/4 speed)
  const palettePath = path.join(rootDir, 'test-results', 'demo-palette.png')
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
