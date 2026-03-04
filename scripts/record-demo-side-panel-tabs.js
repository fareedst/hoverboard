#!/usr/bin/env node
/**
 * [PROC-DEMO_RECORDING] [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] [IMPL-DEMO_OVERLAY]
 * Standalone script: launch extension with software rendering (SwiftShader), run Tabs-tab flow,
 * capture screenshot sequence, assemble GIF via ffmpeg two-pass palette.
 * Run: node scripts/record-demo-side-panel-tabs.js
 * Output: docs/demo-side-panel-tabs.gif
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
const gifOut = path.join(rootDir, 'docs', 'demo-side-panel-tabs.gif')

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

  // Open demo pages so the Tabs list has real content
  const p1 = await context.newPage()
  await p1.goto('https://playwright.dev', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {})
  const p2 = await context.newPage()
  await p2.goto('https://github.com', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {})

  // [IMPL-DEMO_OVERLAY] [REQ-SIDE_PANEL_BROWSER_TABS] Optional: persist Tabs tab so panel opens with Tabs visible from first frame (like Bookmarks demo).
  const seedPage = await context.newPage()
  await seedPage.goto(`chrome-extension://${extensionId}/src/ui/options/options.html`, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {})
  await seedPage.evaluate(async () => {
    if (typeof chrome !== 'undefined' && chrome.storage?.local?.set) {
      await new Promise((resolve) => {
        chrome.storage.local.set({ hoverboard_sidepanel_active_tab: 'browserTabs' }, () => resolve())
      })
    }
  })
  await seedPage.waitForTimeout(Math.round(500 * RATE))
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

  // [IMPL-DEMO_OVERLAY] [PROC-DEMO_RECORDING] Element highlight: panelId 'browserTabsPanel' scopes to #browserTabsPanel; null = document (tab bar/header).
  async function highlightElement (selector, panelId = 'browserTabsPanel') {
    await page.evaluate(({ sel, panelId }) => {
      const root = panelId ? document.getElementById(panelId) : document
      if (!root) return
      const el = root.querySelector(sel)
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
    }, { sel: selector, panelId })
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

  // [IMPL-DEMO_OVERLAY] [REQ-SIDE_PANEL_BROWSER_TABS] Open side panel; storage already set to Tabs tab so first frame shows Tabs.
  await page.goto(`chrome-extension://${extensionId}/src/ui/side-panel/side-panel.html`)
  await page.waitForLoadState('domcontentloaded')
  await page.waitForSelector('#browserTabsPanel:not([hidden])', { timeout: 8000 }).catch(() => {})
  await page.waitForTimeout(Math.round(2000 * RATE))

  // [IMPL-DEMO_OVERLAY] 1 s with no overlay so the beginning is a useful static image (frame 0).
  await removeOverlay()
  await page.waitForTimeout(Math.round(1000 * RATE))
  await snap()

  // Step 1: Opening the side panel (3 frames) — overlay describes the panel; descriptions 30–50% longer per demo_gif_standard.
  await clearHighlight()
  await setOverlay(
    'Opening the side panel',
    'The side panel opens on the Tabs tab so you can see all browser tabs, filter by title or URL, and copy records or URLs.',
    'intro'
  )
  await highlightElement('.side-panel-tabs', null)
  await page.waitForTimeout(Math.round(400 * RATE))
  await snap()
  await page.waitForTimeout(Math.round(400 * RATE))
  await snap()
  await page.waitForTimeout(Math.round(400 * RATE))
  await snap()

  // Step 2: Panel ready (3 frames)
  await clearHighlight()
  await setOverlay(
    'Side panel open on Tabs tab',
    'The Tabs tab is already selected so you can see the list of open browser tabs with title, URL, and referrer.',
    'intro'
  )
  await highlightElement('.side-panel-tab[data-tab="browserTabs"]', null)
  await page.waitForTimeout(Math.round(400 * RATE))
  await snap()
  await page.waitForTimeout(Math.round(400 * RATE))
  await snap()
  await page.waitForTimeout(Math.round(400 * RATE))
  await snap()

  // Step 3: List visible (4 frames) — Tabs tab already active from persist; list loads.
  await clearHighlight()
  await setOverlay(
    'Tabs tab selected',
    'The list shows all open browser tabs; each row has title, URL, and referrer. Use the filter to narrow the list.',
    'navigation'
  )
  await highlightElement('#browserTabsList')
  await page.waitForTimeout(Math.round(400 * RATE))
  await snap()
  await page.waitForTimeout(Math.round(400 * RATE))
  await snap()
  await page.waitForTimeout(Math.round(400 * RATE))
  await snap()
  await page.waitForTimeout(Math.round(400 * RATE))
  await snap()

  // Step 4: List populated (3 frames)
  await clearHighlight()
  await setOverlay(
    'Tab list loaded',
    'Each row shows title, URL, and referrer. You can switch display to Title only, URL only, or full Block view.',
    'navigation'
  )
  await highlightElement('#browserTabsList')
  await page.waitForTimeout(Math.round(400 * RATE))
  await snap()
  await page.waitForTimeout(Math.round(400 * RATE))
  await snap()
  await page.waitForTimeout(Math.round(400 * RATE))
  await snap()

  // Step 5: List content (4 frames)
  await clearHighlight()
  await setOverlay(
    'Viewing tab list',
    'Each row displays title, URL and referrer. Use the display mode controls to show Title only, URL only, or the full card (Block).',
    'state'
  )
  await highlightElement('#browserTabsList')
  await page.waitForTimeout(Math.round(400 * RATE))
  await snap()
  await page.waitForTimeout(Math.round(400 * RATE))
  await snap()
  await page.waitForTimeout(Math.round(400 * RATE))
  await snap()
  await page.waitForTimeout(Math.round(400 * RATE))
  await snap()

  // [IMPL-DEMO_OVERLAY] [REQ-SIDE_PANEL_BROWSER_TABS] Step 5a: Display mode — Title view
  await clearHighlight()
  await setOverlay(
    'Switching to Title view',
    'Each row shows only the tab title so you can scan quickly. The remove icon appears after the title.',
    'state'
  )
  await highlightElement('#browserTabsListDisplayTitle')
  await page.locator('#browserTabsListDisplayTitle').click()
  await page.waitForTimeout(Math.round(400 * RATE))
  await snap()
  await page.waitForTimeout(Math.round(300 * RATE))
  await snap()
  await page.waitForTimeout(Math.round(300 * RATE))
  await snap()

  // [IMPL-DEMO_OVERLAY] [REQ-SIDE_PANEL_BROWSER_TABS] Step 5b: Display mode — Block (restore)
  await clearHighlight()
  await setOverlay(
    'Switching back to Block view',
    'Full card view shows title, URL, referrer, window and tab ids, and bookmark tags for each tab.',
    'state'
  )
  await highlightElement('#browserTabsListDisplayBlock')
  await page.locator('#browserTabsListDisplayBlock').click()
  await page.waitForTimeout(Math.round(300 * RATE))
  await snap()
  await page.waitForTimeout(Math.round(300 * RATE))
  await snap()

  // Step 6: Before filter (2 frames)
  await clearHighlight()
  await setOverlay(
    'Focusing filter',
    'Type in the filter box to narrow the list by tab title, URL, or (if scope allows) page text or elements.',
    'state'
  )
  await highlightElement('#browserTabsFilterInput')
  const filterInput = page.locator('#browserTabsFilterInput')
  if (await filterInput.isVisible()) await filterInput.focus().catch(() => {})
  await page.waitForTimeout(Math.round(300 * RATE))
  await snap()
  await page.waitForTimeout(Math.round(300 * RATE))
  await snap()

  // Step 7: Type filter (4 frames)
  await clearHighlight()
  await setOverlay(
    "Filtering: typing 'playwright'",
    'Only tabs whose title or URL matches the filter remain visible. The list updates as you type.',
    'action'
  )
  await highlightElement('#browserTabsFilterInput')
  if (await filterInput.isVisible()) {
    await filterInput.fill('playwright')
    await page.waitForTimeout(Math.round(300 * RATE))
    await snap()
    await page.waitForTimeout(Math.round(300 * RATE))
    await snap()
    await page.waitForTimeout(Math.round(300 * RATE))
    await snap()
    await page.waitForTimeout(Math.round(300 * RATE))
    await snap()
  }

  // Step 8: Filter applied (3 frames)
  await clearHighlight()
  await setOverlay(
    'Filter applied',
    'The list now shows only matching tabs. You can remove a tab from the list (without closing it) or refresh to reload.',
    'state'
  )
  await highlightElement('#browserTabsList')
  await page.waitForTimeout(Math.round(400 * RATE))
  await snap()
  await page.waitForTimeout(Math.round(400 * RATE))
  await snap()
  await page.waitForTimeout(Math.round(400 * RATE))
  await snap()

  // [IMPL-DEMO_OVERLAY] [REQ-SIDE_PANEL_BROWSER_TABS] Step 8a: Remove from list (tab hidden, not closed)
  await clearHighlight()
  await setOverlay(
    'Remove from list',
    'Click the remove icon to hide a tab from the list without closing it. Refresh brings it back.',
    'action'
  )
  await highlightElement('[data-action="removeFromDisplay"]')
  await page.locator('#browserTabsPanel [data-action="removeFromDisplay"]').first().click()
  await page.waitForTimeout(Math.round(400 * RATE))
  await snap()
  await page.waitForTimeout(Math.round(300 * RATE))
  await snap()
  await page.waitForTimeout(Math.round(300 * RATE))
  await snap()

  // [IMPL-DEMO_OVERLAY] [REQ-SIDE_PANEL_BROWSER_TABS] Step 8b: Refresh (list reloaded; hidden tab reappears)
  await clearHighlight()
  await setOverlay(
    'Refreshing tab list',
    'Refresh clears the hidden set and reloads the list so all tabs can reappear.',
    'action'
  )
  await highlightElement('#browserTabsRefreshBtn')
  await page.locator('#browserTabsPanel [data-action="refreshTabs"]').click()
  await page.waitForTimeout(Math.round(700 * RATE))
  await snap()
  await page.waitForTimeout(Math.round(400 * RATE))
  await snap()
  await page.waitForTimeout(Math.round(400 * RATE))
  await snap()

  // Step 9: Copy Records (4 frames)
  await clearHighlight()
  await setOverlay(
    'Clicking Copy Records',
    'Copy Records exports the visible tabs as YAML (title, URL, referrer, ids) to the clipboard for pasting elsewhere.',
    'action'
  )
  await highlightElement('#browserTabsCopyRecordsBtn')
  await page.locator('#browserTabsCopyRecordsBtn').click()
  await page.waitForTimeout(Math.round(300 * RATE))
  await snap()
  await page.waitForTimeout(Math.round(300 * RATE))
  await snap()
  await page.waitForTimeout(Math.round(300 * RATE))
  await snap()
  await page.waitForTimeout(Math.round(300 * RATE))
  await snap()

  // Step 10: Copy Records success (3 frames)
  await clearHighlight()
  await setOverlay(
    'Export complete (YAML)',
    'YAML records have been copied to the clipboard. Paste into a file or another app as needed.',
    'result'
  )
  await highlightElement('#browserTabsCopyRecordsBtn')
  await page.waitForTimeout(Math.round(400 * RATE))
  await snap()
  await page.waitForTimeout(Math.round(400 * RATE))
  await snap()
  await page.waitForTimeout(Math.round(400 * RATE))
  await snap()

  // Step 11: Copy URLs (3 frames)
  await clearHighlight()
  await setOverlay(
    'Clicking Copy URLs',
    'Copy URLs exports only the URLs of the visible tabs to the clipboard, one per line.',
    'action'
  )
  await highlightElement('#browserTabsCopyBtn')
  await page.locator('#browserTabsCopyBtn').click()
  await page.waitForTimeout(Math.round(300 * RATE))
  await snap()
  await page.waitForTimeout(Math.round(300 * RATE))
  await snap()
  await page.waitForTimeout(Math.round(300 * RATE))
  await snap()

  // Step 12: Copy URLs success (3 frames)
  await clearHighlight()
  await setOverlay(
    'Export complete (URLs)',
    'URLs have been copied to the clipboard. Paste into a document or use with other tools.',
    'result'
  )
  await highlightElement('#browserTabsCopyBtn')
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
  const palettePath = path.join(rootDir, 'test-results', 'demo-palette-tabs.png')
  const framesPattern = path.join(framesDir, 'frame-%04d.png')
  const noOverlayGifPath = path.join(rootDir, 'test-results', 'demo-tabs-nooverlay.gif')
  const mainGifPath = path.join(rootDir, 'test-results', 'demo-tabs-main.gif')
  const endGifPath = path.join(rootDir, 'test-results', 'demo-tabs-end.gif')
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
