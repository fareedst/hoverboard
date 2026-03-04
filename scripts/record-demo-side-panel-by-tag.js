#!/usr/bin/env node
/**
 * [PROC-DEMO_RECORDING] [IMPL-DEMO_OVERLAY] [REQ-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]
 * Standalone script: launch extension with software rendering (SwiftShader), run By Tag-tab flow,
 * capture screenshot sequence per demo_gif_standard, assemble GIF via ffmpeg 3-part concat.
 * Run: node scripts/record-demo-side-panel-by-tag.js
 * Output: docs/demo-side-panel-by-tag.gif
 */

import path from 'path'
import fs from 'fs'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import { chromium } from 'playwright'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '..')
const pathToExtension = path.join(rootDir, 'dist')
const framesDir = path.join(rootDir, 'test-results', 'demo-frames-tags-tree')
const gifOut = path.join(rootDir, 'docs', 'demo-side-panel-by-tag.gif')

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

  // [IMPL-DEMO_OVERLAY] [REQ-SIDE_PANEL_TAGS_TREE] Persist By Tag tab so panel opens with By Tag visible from first frame (demo_gif_standard).
  const seedPage = await context.newPage()
  await seedPage.goto(`chrome-extension://${extensionId}/src/ui/options/options.html`, { waitUntil: 'domcontentloaded', timeout: 15000 })
  await seedPage.evaluate(async () => {
    if (typeof chrome === 'undefined' || !chrome.storage?.local?.set) return
    await new Promise((resolve) => {
      chrome.storage.local.set({ hoverboard_sidepanel_active_tab: 'tagsTree' }, () => resolve())
    })
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

  // [IMPL-DEMO_OVERLAY] [PROC-DEMO_RECORDING] [REQ-SIDE_PANEL_TAGS_TREE] Element highlight: scope to #tagsTreePanel so only By Tag tab content is highlighted.
  async function highlightElement (selector) {
    await page.evaluate((sel) => {
      const panel = document.getElementById('tagsTreePanel')
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

  // [IMPL-DEMO_OVERLAY] [REQ-SIDE_PANEL_TAGS_TREE] Open side panel; storage already set to By Tag tab so first frame shows By Tag.
  await page.goto(`chrome-extension://${extensionId}/src/ui/side-panel/side-panel.html?demo=1`)
  await page.waitForLoadState('domcontentloaded')
  await page.waitForSelector('#tagsTreePanel:not([hidden])', { timeout: 8000 }).catch(() => {})
  await page.waitForTimeout(Math.round(2000 * RATE))

  // [IMPL-DEMO_OVERLAY] 1 s with no overlay so the beginning is a useful static image (frame 0).
  await removeOverlay()
  await page.waitForTimeout(Math.round(1000 * RATE))
  await snap()

  // Step 1: By Tag loaded — overlay describes the tab (descriptions 30–50% longer per demo_gif_standard).
  await clearHighlight()
  const hasTags = await page.locator('#tagSelector input[type="checkbox"]').first().isVisible().catch(() => false)
  const hasEmpty = await page.locator('#emptyState:not(.hidden)').isVisible().catch(() => false)
  await setOverlay(
    'Viewing the By Tag tab',
    'The side panel opens on the By Tag tab so you can browse bookmarks by tag, filter the tree, and search.',
    'intro'
  )
  await page.waitForTimeout(Math.round(400 * RATE))
  await snap()
  await page.waitForTimeout(Math.round(400 * RATE))
  await snap()
  await page.waitForTimeout(Math.round(400 * RATE))
  await snap()

  // Step 2: Filtering by tag — highlight tag selector and explain; then select tag(s) [IMPL-DEMO_OVERLAY] [REQ-SIDE_PANEL_TAGS_TREE]
  await clearHighlight()
  await setOverlay(
    'Filtering by tag',
    'Only bookmarks that have at least one selected tag are shown in the tree. Check or uncheck tags to filter.',
    'state'
  )
  await highlightElement('.tag-selector-section')
  await page.waitForTimeout(Math.round(400 * RATE))
  await snap()
  await page.waitForTimeout(Math.round(400 * RATE))
  await snap()
  await page.waitForTimeout(Math.round(400 * RATE))
  await snap()
  if (hasTags) {
    await setOverlay(
      'Selecting tags',
      'Check one or more tags to filter the tree; the list updates to show only matching bookmarks.',
      'action'
    )
    const firstTag = page.locator('#tagSelector input[type="checkbox"]').first()
    await firstTag.click()
    await page.waitForTimeout(Math.round(400 * RATE))
    await snap()
    await page.waitForTimeout(Math.round(400 * RATE))
    await snap()
    await page.waitForTimeout(Math.round(400 * RATE))
    await snap()
  } else {
    await clearHighlight()
    await setOverlay(
      'Tag selector',
      'When you have bookmarks with tags, select tags here to filter the tree.',
      'state'
    )
    await page.waitForTimeout(Math.round(400 * RATE))
    await snap()
    await page.waitForTimeout(Math.round(400 * RATE))
    await snap()
  }

  // Step 3: Tree updated — [IMPL-DEMO_OVERLAY] highlight tree container for "Bookmarks under selected tags"
  await clearHighlight()
  const hasTreeLinks = await page.locator('#treeContainer .tree-bookmark-link').first().isVisible().catch(() => false)
  await setOverlay(
    'Tree updated',
    hasTreeLinks
      ? 'Bookmarks under the selected tags appear in the tree; expand sections to see titles and URLs.'
      : 'The tree shows bookmarks for the selected tags; add bookmarks and tags to see more.',
    'state'
  )
  await highlightElement('#treeContainer')
  await page.waitForTimeout(Math.round(400 * RATE))
  await snap()
  await page.waitForTimeout(Math.round(400 * RATE))
  await snap()
  await page.waitForTimeout(Math.round(400 * RATE))
  await snap()

  // Step 4: Search bookmarks and # matches — [IMPL-DEMO_OVERLAY] [REQ-SIDE_PANEL_BOOKMARK_SEARCH]
  await clearHighlight()
  await setOverlay(
    'Search bookmarks',
    'Type in the search box to filter the list by title, URL, tags, or notes (case-insensitive).',
    'action'
  )
  const searchInput = page.locator('#tagsTreePanel #searchInput')
  if (await searchInput.isVisible()) {
    await highlightElement('#searchInput')
    await page.waitForTimeout(Math.round(300 * RATE))
    await snap()
    await searchInput.focus()
    await searchInput.fill('example')
    await page.waitForTimeout(Math.round(600 * RATE))
    await snap()
    await clearHighlight()
    await setOverlay(
      'Match count',
      'The count updates as you type and shows how many bookmarks match your search; use Previous/Next to step through.',
      'action'
    )
    await highlightElement('#searchCount')
    await page.waitForTimeout(Math.round(400 * RATE))
    await snap()
    await page.waitForTimeout(Math.round(400 * RATE))
    await snap()
  } else {
    await page.waitForTimeout(Math.round(400 * RATE))
    await snap()
    await page.waitForTimeout(Math.round(400 * RATE))
    await snap()
  }

  // Step 5: Click URL (if any) — [IMPL-DEMO_OVERLAY] highlight first link for "Opens in new tab"
  const firstLink = page.locator('#treeContainer .tree-bookmark-link').first()
  await clearHighlight()
  if (await firstLink.isVisible()) {
    await highlightElement('.tree-bookmark-link')
    await setOverlay(
      'Opening URL',
      'Click any bookmark link to open it in a new tab; the link is highlighted here for the demo.',
      'result'
    )
    await firstLink.click()
    await page.waitForTimeout(Math.round(400 * RATE))
    await snap()
    await page.waitForTimeout(Math.round(400 * RATE))
    await snap()
    await page.waitForTimeout(Math.round(400 * RATE))
    await snap()
    await page.waitForTimeout(Math.round(400 * RATE))
    await snap()
  } else {
    await setOverlay(
      'Click a bookmark link',
      'When the tree has bookmarks, click a link to open it in a new tab.',
      'result'
    )
    await page.waitForTimeout(Math.round(400 * RATE))
    await snap()
    await page.waitForTimeout(Math.round(400 * RATE))
    await snap()
    await page.waitForTimeout(Math.round(400 * RATE))
    await snap()
  }

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
  const palettePath = path.join(rootDir, 'test-results', 'demo-palette-tags-tree.png')
  const framesPattern = path.join(framesDir, 'frame-%04d.png')
  const noOverlayGifPath = path.join(rootDir, 'test-results', 'demo-tags-tree-nooverlay.gif')
  const mainGifPath = path.join(rootDir, 'test-results', 'demo-tags-tree-main.gif')
  const endGifPath = path.join(rootDir, 'test-results', 'demo-tags-tree-end.gif')
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
