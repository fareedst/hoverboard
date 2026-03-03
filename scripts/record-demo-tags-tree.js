#!/usr/bin/env node
/**
 * [PROC-DEMO_RECORDING] [IMPL-DEMO_OVERLAY] [REQ-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]
 * Standalone script: launch extension with software rendering (SwiftShader), run By Tag-tab flow,
 * capture screenshot sequence, assemble GIF via ffmpeg two-pass palette.
 * Run: node scripts/record-demo-tags-tree.js
 * Output: docs/demo-tags-tree.gif
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
const gifOut = path.join(rootDir, 'docs', 'demo-tags-tree.gif')

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

  // Step 1: Open side panel (This Page tab first) — 3 frames
  await page.goto(`chrome-extension://${extensionId}/src/ui/side-panel/side-panel.html?demo=1`)
  await page.waitForLoadState('domcontentloaded')
  await page.waitForTimeout(1500)
  await setOverlay('Opening the side panel', 'Hoverboard: switch to By Tag', 'intro')
  await snap()
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()

  // Step 2: Switch to By Tag tab — 4 frames
  await setOverlay('Switching to By Tag', 'Tags & bookmarks', 'navigation')
  await page.locator('.side-panel-tab[data-tab="tagsTree"]').click()
  await snap()
  await page.waitForTimeout(500)
  await snap()
  await page.waitForTimeout(500)
  await snap()
  await page.waitForTimeout(500)
  await snap()

  // Wait for By Tag panel to be visible and data to load (tag selector or empty state)
  await page.waitForSelector('#tagsTreePanel:not([hidden])', { timeout: 3000 }).catch(() => {})
  await page.waitForTimeout(2000)

  // Step 3: By Tag loaded — 3 frames
  const hasTags = await page.locator('#tagSelector input[type="checkbox"]').first().isVisible().catch(() => false)
  const hasEmpty = await page.locator('#emptyState:not(.hidden)').isVisible().catch(() => false)
  await setOverlay(
    'By Tag loaded',
    hasTags ? 'Select tags to see bookmarks' : (hasEmpty ? 'No bookmarks yet' : 'Select tags to see bookmarks'),
    'navigation'
  )
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()

  // Step 4: Select tag(s) — action (if we have tags)
  if (hasTags) {
    await setOverlay('Selecting tags', 'Filtering by tag', 'action')
    const firstTag = page.locator('#tagSelector input[type="checkbox"]').first()
    await firstTag.click()
    await page.waitForTimeout(400)
    await snap()
    await page.waitForTimeout(400)
    await snap()
    await page.waitForTimeout(400)
    await snap()
  } else {
    await setOverlay('Tag selector', 'Select tags when you have bookmarks', 'state')
    await page.waitForTimeout(400)
    await snap()
    await page.waitForTimeout(400)
    await snap()
  }

  // Step 5: Tree updated — state
  const hasTreeLinks = await page.locator('#treeContainer .tree-bookmark-link').first().isVisible().catch(() => false)
  await setOverlay(
    'Tree updated',
    hasTreeLinks ? 'Bookmarks under selected tags' : 'Tree shows bookmarks for selected tags',
    'state'
  )
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()
  await page.waitForTimeout(400)
  await snap()

  // Step 6: Optional search — action
  await setOverlay('Search bookmarks', 'Type to filter the list', 'action')
  const searchInput = page.locator('#tagsTreePanel #searchInput')
  if (await searchInput.isVisible()) {
    await searchInput.focus()
    await searchInput.fill('example')
    await page.waitForTimeout(400)
    await snap()
    await page.waitForTimeout(400)
    await snap()
  } else {
    await page.waitForTimeout(400)
    await snap()
    await page.waitForTimeout(400)
    await snap()
  }

  // Step 7: Click URL (if any) — result
  const firstLink = page.locator('#treeContainer .tree-bookmark-link').first()
  if (await firstLink.isVisible()) {
    await setOverlay('Opening URL', 'Opens in new tab', 'result')
    await firstLink.click()
    await page.waitForTimeout(400)
    await snap()
    await page.waitForTimeout(400)
    await snap()
  } else {
    await setOverlay('Click a bookmark link', 'Opens in new tab', 'result')
    await page.waitForTimeout(400)
    await snap()
    await page.waitForTimeout(400)
    await snap()
  }

  await removeOverlay()
  await context.close()

  if (frameIdx === 0) {
    console.error('No frames captured')
    process.exit(1)
  }

  // Two-pass ffmpeg: same as Tabs and This Page demos (1 fps, scale 400, palette 128)
  const palettePath = path.join(rootDir, 'test-results', 'demo-palette-tags-tree.png')
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
