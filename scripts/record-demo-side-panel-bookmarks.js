#!/usr/bin/env node
/**
 * [PROC-DEMO_RECORDING] [IMPL-DEMO_OVERLAY] [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS]
 * Standalone script: launch extension with software rendering (SwiftShader), seed Chrome bookmarks (medium-complexity),
 * run Bookmarks-tab flow, capture screenshot sequence, assemble GIF via ffmpeg two-pass palette.
 * Run: node scripts/record-demo-side-panel-bookmarks.js
 * Output: docs/demo-side-panel-bookmarks.gif
 */

import path from 'path'
import fs from 'fs'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import { chromium } from 'playwright'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '..')
const pathToExtension = path.join(rootDir, 'dist')
const framesDir = path.join(rootDir, 'test-results', 'demo-frames-bookmarks')
const gifOut = path.join(rootDir, 'docs', 'demo-side-panel-bookmarks.gif')

/** [IMPL-DEMO_OVERLAY] [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] Medium-complexity demo data: one folder + 5–10 bookmarks */
const DEMO_BOOKMARKS = [
  { title: 'MDN Web Docs', url: 'https://developer.mozilla.org' },
  { title: 'GitHub', url: 'https://github.com' },
  { title: 'Playwright', url: 'https://playwright.dev' },
  { title: 'Chrome Extensions', url: 'https://developer.chrome.com/docs/extensions' },
  { title: 'Node.js', url: 'https://nodejs.org' },
  { title: 'npm', url: 'https://www.npmjs.com' },
  { title: 'Web APIs', url: 'https://developer.mozilla.org/en-US/docs/Web/API' },
  { title: 'JavaScript.info', url: 'https://javascript.info' },
]

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

  // [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] Seed Chrome bookmarks from extension context (medium-complexity: folder + 5–10 items).
  const seedPage = await context.newPage()
  await seedPage.goto(`chrome-extension://${extensionId}/src/ui/options/options.html`, { waitUntil: 'domcontentloaded', timeout: 15000 })
  await seedPage.evaluate(async (items) => {
    if (typeof chrome === 'undefined' || !chrome.bookmarks || !chrome.bookmarks.create) return
    const bar = (await chrome.bookmarks.getTree())[0]?.children?.find((n) => n.id === '1' || (n.title && n.title.includes('Bookmarks Bar')))
    const parentId = bar?.id || '1'
    const folder = await chrome.bookmarks.create({ parentId, title: 'Hoverboard Demo' })
    for (const { title, url } of items) {
      await chrome.bookmarks.create({ parentId: folder.id, title, url })
    }
  }, DEMO_BOOKMARKS)
  await seedPage.waitForTimeout(500)
  await seedPage.close()

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

  // [IMPL-DEMO_OVERLAY] [PROC-DEMO_RECORDING] Element highlight: scope to #browserBookmarksPanel
  async function highlightElement (selector) {
    await page.evaluate((sel) => {
      const panel = document.getElementById('browserBookmarksPanel')
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

  // Step 1: Open side panel (This Page tab first)
  await page.goto(`chrome-extension://${extensionId}/src/ui/side-panel/side-panel.html`)
  await page.waitForLoadState('domcontentloaded')
  await page.waitForTimeout(1500)
  await clearHighlight()
  await setOverlay('Opening the side panel', 'Hoverboard: switch to Bookmarks tab', 'intro')
  await snap()
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()

  // Step 2: Switch to Bookmarks tab
  await clearHighlight()
  await setOverlay('Switching to Bookmarks', 'Chrome bookmarks: search, folder, sort', 'navigation')
  await page.locator('.side-panel-tab[data-tab="browserBookmarks"]').click()
  await snap()
  await page.waitForTimeout(500)
  await snap()
  await page.waitForTimeout(500)
  await snap()

  // Wait for Bookmarks panel and list to load
  await page.waitForSelector('#browserBookmarksPanel:not([hidden])', { timeout: 5000 }).catch(() => {})
  await page.waitForTimeout(2000)

  // Step 3: List loaded
  await clearHighlight()
  await setOverlay('Bookmarks tab loaded', 'List shows Chrome bookmarks with favicon, title, URL', 'state')
  await highlightElement('#browserBookmarksList')
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()

  // Step 4: Search — highlight input
  await clearHighlight()
  await setOverlay('Search', 'Filter by title, URL, or folder path', 'action')
  await highlightElement('#browserBookmarksSearchInput')
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()

  // Step 5: Folder filter
  await clearHighlight()
  await setOverlay('Folder filter', 'Show only bookmarks in selected folder', 'state')
  await highlightElement('#browserBookmarksFolderSelect')
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()

  // Step 6: Sort
  await clearHighlight()
  await setOverlay('Sort', 'Date, name, or Chrome default order', 'state')
  await highlightElement('#browserBookmarksSortSelect')
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()

  // Step 7: Match count
  await clearHighlight()
  await setOverlay('Match count', 'Number of visible bookmarks', 'state')
  await highlightElement('#browserBookmarksCount')
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()

  // Step 8: Click URL — opens in new tab
  const firstUrlLink = page.locator('#browserBookmarksPanel .browser-bookmarks-row-url').first()
  await clearHighlight()
  if (await firstUrlLink.isVisible()) {
    await highlightElement('.browser-bookmarks-row-url')
    await setOverlay('Click a bookmark URL', 'Opens in new tab', 'result')
    await firstUrlLink.click()
    await page.waitForTimeout(400)
    await snap()
    await page.waitForTimeout(400)
    await snap()
    await page.waitForTimeout(400)
    await snap()
  } else {
    await setOverlay('Click a bookmark URL', 'Opens in new tab', 'result')
    await page.waitForTimeout(400)
    await snap()
    await page.waitForTimeout(400)
    await snap()
  }

  await clearHighlight()
  await removeOverlay()
  await context.close()

  if (frameIdx === 0) {
    console.error('No frames captured')
    process.exit(1)
  }

  // Two-pass ffmpeg: same as other demos (1 fps, scale 400, palette 128)
  const palettePath = path.join(rootDir, 'test-results', 'demo-palette-bookmarks.png')
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
