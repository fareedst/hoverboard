/**
 * === IMPL-FULL-BLOCK: IMPL-SCREENSHOT_MODE ===
 * [IMPL-SCREENSHOT_MODE] [REQ-LOCAL_BOOKMARKS_INDEX] — Generate repeatable README screenshots from seeded extension data across the current side-panel tabs and standalone tools.
 *
 * ## CAPTURE_README_MEDIA
 *
 * - [IMPL-SCREENSHOT_MODE] [REQ-LOCAL_BOOKMARKS_INDEX] How: Seed deterministic bookmark, usage, and native Chrome bookmark data, then capture only current product surfaces so README media cannot drift back to the removed popup or legacy side-panel tabs.
 * - Contract:
 *   - INPUT: optional --seed JSON file; built dist/ extension
 *   - PRE: dist/manifest.json exists; seed JSON has hoverboard_local_bookmarks when supplied
 *   - OUTPUT: current side-panel and standalone-tool PNG files under images/
 *   - POST:
 *     - success => every expected image exists and represents seeded data
 *   - FAILURE_MODES: missing_build, missing_seed, capture_timeout
 *   - EFFECTS: Async, IO, State
 *   - TERMINATION: total
 *
 * ## BUILD_STABLE_USAGE_FIXTURES
 *
 * - [IMPL-SCREENSHOT_MODE] [REQ-BOOKMARK_USAGE_TRACKING] How: Add stable usage and navigation-edge fixtures only when the caller did not provide them.
 */
import os from 'os'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { chromium } from '@playwright/test'
import {
  placeholderStorageSeed as defaultLocalSeed,
  placeholderSyncSeed as defaultSyncSeed,
  placeholderSuggestedTags,
  placeholderRecentTags,
  placeholderSeedTimestamp,
  getPlaceholderUsageSeed,
  getPlaceholderEdgesSeed
} from './screenshot-placeholder-data.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.join(__dirname, '..')
const extPath = path.join(projectRoot, 'dist')
const imagesDir = path.join(projectRoot, 'images')
const SIDE_PANEL_VIEWPORT = { width: 360, height: 800 }
const TOOL_VIEWPORT = { width: 1200, height: 900 }

/**
 * [IMPL-SCREENSHOT_MODE] [REQ-LOCAL_BOOKMARKS_INDEX] LOAD_SCREENSHOT_SEED
 * INPUT: optional seed path. OUTPUT: normalized local and sync seed.
 * PRE: supplied JSON contains hoverboard_local_bookmarks. EFFECTS: filesystem IO.
 */
function getSeedFilePath () {
  const env = process.env.SCREENSHOT_SEED_FILE
  if (env) return path.isAbsolute(env) ? env : path.join(projectRoot, env)
  const arg = process.argv.find((value) => value.startsWith('--seed='))
  if (arg) return path.isAbsolute(arg.slice(7)) ? arg.slice(7) : path.join(projectRoot, arg.slice(7))
  return null
}

function loadSeedFromFile (filePath) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  if (!data || typeof data.hoverboard_local_bookmarks !== 'object' || Array.isArray(data.hoverboard_local_bookmarks)) {
    throw new Error('Seed file must have hoverboard_local_bookmarks (object keyed by URL)')
  }
  const storageIndex = data.hoverboard_storage_index && typeof data.hoverboard_storage_index === 'object' && !Array.isArray(data.hoverboard_storage_index)
    ? data.hoverboard_storage_index
    : Object.fromEntries(Object.keys(data.hoverboard_local_bookmarks).map((url) => [url, 'local']))
  return {
    local: {
      hoverboard_local_bookmarks: data.hoverboard_local_bookmarks,
      hoverboard_storage_index: storageIndex,
      hoverboard_theme: data.hoverboard_theme || 'dark',
      hoverboard_demo_suggested_tags: Array.isArray(data.hoverboard_demo_suggested_tags) ? data.hoverboard_demo_suggested_tags : placeholderSuggestedTags,
      hoverboard_demo_recent_tags: Array.isArray(data.hoverboard_demo_recent_tags) ? data.hoverboard_demo_recent_tags : placeholderRecentTags,
      ...(data.hoverboard_bookmark_usage && typeof data.hoverboard_bookmark_usage === 'object' && !Array.isArray(data.hoverboard_bookmark_usage)
        ? { hoverboard_bookmark_usage: data.hoverboard_bookmark_usage }
        : {}),
      ...(data.hoverboard_bookmark_nav_edges && typeof data.hoverboard_bookmark_nav_edges === 'object' && !Array.isArray(data.hoverboard_bookmark_nav_edges)
        ? { hoverboard_bookmark_nav_edges: data.hoverboard_bookmark_nav_edges }
        : {})
    },
    sync: data.hoverboard_settings != null ? { hoverboard_settings: data.hoverboard_settings } : defaultSyncSeed
  }
}

async function getExtensionId (context) {
  const serviceWorker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker', { timeout: 15000 })
  return serviceWorker.url().split('/')[2]
}

/**
 * [IMPL-SCREENSHOT_MODE] [REQ-LOCAL_BOOKMARKS_INDEX] [REQ-BOOKMARK_USAGE_TRACKING] SEED_EXTENSION_DATA
 * INPUT: extension context, id, normalized local/sync seed. OUTPUT: completed writes.
 * PRE: Options page is reachable. EFFECTS: asynchronous extension storage IO.
 */
async function seedExtension (context, extensionId, localSeed, syncSeed) {
  // [IMPL-SCREENSHOT_MODE] [REQ-LOCAL_BOOKMARKS_INDEX] Await extension storage writes before opening any capture surface.
  const optionsPage = await context.newPage()
  await optionsPage.goto(`chrome-extension://${extensionId}/src/ui/options/options.html`, { waitUntil: 'domcontentloaded', timeout: 15000 })
  await optionsPage.evaluate(async ({ local, sync }) => {
    await chrome.storage.local.set(local)
    if (sync && chrome.storage.sync) await chrome.storage.sync.set(sync)
  }, { local: localSeed, sync: syncSeed })
  await optionsPage.close()
}

async function seedBrowserBookmarks (context, extensionId) {
  // [IMPL-SCREENSHOT_MODE] [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] Seed a small native bookmark tree for the standalone Browser Bookmarks page.
  const seedPage = await context.newPage()
  await seedPage.goto(`chrome-extension://${extensionId}/src/ui/options/options.html`, { waitUntil: 'domcontentloaded', timeout: 15000 })
  await seedPage.evaluate(async () => {
    const tree = await chrome.bookmarks.getTree()
    const bookmarksBar = tree[0]?.children?.find((node) => node.id === '1' || node.title?.includes('Bookmarks Bar'))
    const folder = await chrome.bookmarks.create({ parentId: bookmarksBar?.id || '1', title: 'Hoverboard README' })
    const records = [
      ['MDN Web Docs', 'https://developer.mozilla.org'],
      ['GitHub', 'https://github.com'],
      ['Playwright', 'https://playwright.dev'],
      ['Chrome Extensions', 'https://developer.chrome.com/docs/extensions'],
      ['Node.js', 'https://nodejs.org'],
      ['npm', 'https://www.npmjs.com'],
      ['JavaScript.info', 'https://javascript.info']
    ]
    for (const [title, url] of records) await chrome.bookmarks.create({ parentId: folder.id, title, url })
  })
  await seedPage.close()
}

/**
 * [IMPL-SCREENSHOT_MODE] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [REQ-SIDE_PANEL_TAGS_TREE] [REQ-SIDE_PANEL_BROWSER_TABS] CAPTURE_SIDE_PANEL_SURFACES
 * INPUT: extension context and id. OUTPUT: current side-panel PNG files. EFFECTS: browser navigation and filesystem IO.
 */
async function captureSidePanel (context, extensionId) {
  // [IMPL-SCREENSHOT_MODE] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] Capture exactly This Page, By Tag, and Tabs.
  const auxOne = await context.newPage()
  const auxTwo = await context.newPage()
  await Promise.all([
    auxOne.goto('https://playwright.dev', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {}),
    auxTwo.goto('https://github.com', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {})
  ])

  const page = await context.newPage()
  await page.setViewportSize(SIDE_PANEL_VIEWPORT)
  const params = `?screenshot=1&url=${encodeURIComponent('https://pinboard.in')}&title=${encodeURIComponent('Pinboard: social bookmarking')}`
  await page.goto(`chrome-extension://${extensionId}/src/ui/side-panel/side-panel.html${params}`, { waitUntil: 'domcontentloaded', timeout: 15000 })
  await page.locator('#bookmarkPanel [data-popup-ref="mainInterface"], #bookmarkPanel [data-popup-ref="loadingState"]').first().waitFor({ state: 'attached', timeout: 10000 })
  await page.waitForTimeout(800)
  await page.screenshot({ path: path.join(imagesDir, 'side-panel-bookmark.png'), fullPage: true })

  await page.locator('.side-panel-tab[data-tab="tagsTree"]').click()
  await page.waitForSelector('#tagsTreePanel:not([hidden])', { timeout: 10000 })
  await page.waitForTimeout(700)
  await page.screenshot({ path: path.join(imagesDir, 'side-panel-tags-tree.png'), fullPage: true })

  await page.locator('.side-panel-tab[data-tab="browserTabs"]').click()
  await page.waitForSelector('#browserTabsPanel:not([hidden])', { timeout: 10000 })
  await page.waitForTimeout(700)
  await page.screenshot({ path: path.join(imagesDir, 'side-panel-tabs.png'), fullPage: true })

  await page.close()
  await auxOne.close()
  await auxTwo.close()
}

async function captureLocalBookmarksIndex (context, extensionId) {
  // [IMPL-SCREENSHOT_MODE] [REQ-LOCAL_BOOKMARKS_INDEX] Select the Local store because seeded records are local-backed.
  const page = await context.newPage()
  await page.setViewportSize(TOOL_VIEWPORT)
  await page.goto(`chrome-extension://${extensionId}/src/ui/bookmarks-table/bookmarks-table.html`, { waitUntil: 'domcontentloaded', timeout: 15000 })
  await page.locator('.bookmarks-table tbody, .empty-state').first().waitFor({ state: 'attached', timeout: 10000 })
  await page.locator('#store-local').check()
  await page.waitForTimeout(700)
  await page.screenshot({ path: path.join(imagesDir, 'local-bookmarks-index.png'), fullPage: true })
  await page.close()
}

/**
 * [IMPL-SCREENSHOT_MODE] [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] CAPTURE_STANDALONE_TOOL
 * INPUT: extension context and id. OUTPUT: browser-bookmarks.png. EFFECTS: full-page browser capture.
 */
async function captureBrowserBookmarks (context, extensionId) {
  // [IMPL-SCREENSHOT_MODE] [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] Capture the standalone Browser Bookmarks page, not a removed side-panel tab.
  const page = await context.newPage()
  await page.setViewportSize(TOOL_VIEWPORT)
  await page.goto(`chrome-extension://${extensionId}/src/ui/browser-bookmarks/browser-bookmarks.html`, { waitUntil: 'domcontentloaded', timeout: 15000 })
  await page.locator('#browserBookmarksPanel').waitFor({ state: 'visible', timeout: 10000 })
  await page.waitForTimeout(1000)
  await page.screenshot({ path: path.join(imagesDir, 'browser-bookmarks.png'), fullPage: true })
  await page.close()
}

/**
 * [IMPL-SCREENSHOT_MODE] [REQ-BOOKMARK_USAGE_TRACKING] CAPTURE_STANDALONE_TOOL
 * INPUT: extension context and id. OUTPUT: visit-history.png. EFFECTS: full-page browser capture.
 */
async function captureVisitHistory (context, extensionId) {
  // [IMPL-SCREENSHOT_MODE] [REQ-BOOKMARK_USAGE_TRACKING] Capture the standalone Visit History page from seeded usage and navigation data.
  const page = await context.newPage()
  await page.setViewportSize(TOOL_VIEWPORT)
  await page.goto(`chrome-extension://${extensionId}/src/ui/visit-history/visit-history.html`, { waitUntil: 'domcontentloaded', timeout: 15000 })
  await page.locator('#visitHistoryPanel').waitFor({ state: 'visible', timeout: 10000 })
  await page.waitForTimeout(1000)
  await page.screenshot({ path: path.join(imagesDir, 'visit-history.png'), fullPage: true })
  await page.close()
}

/**
 * [IMPL-SCREENSHOT_MODE] [REQ-LOCAL_BOOKMARKS_INDEX] [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [REQ-BOOKMARK_USAGE_TRACKING] CAPTURE_README_MEDIA
 * INPUT: built dist/ extension and optional seed. OUTPUT: current README image set.
 * PRE: dist/manifest.json exists. FAILURE_MODES: missing build, seed, timeout, or capture.
 */
async function main () {
  if (!fs.existsSync(path.join(extPath, 'manifest.json'))) {
    throw new Error('Extension not built. Run: npm run build:dev')
  }
  fs.mkdirSync(imagesDir, { recursive: true })

  const seedPath = getSeedFilePath()
  const loaded = seedPath ? loadSeedFromFile(seedPath) : { local: defaultLocalSeed, sync: defaultSyncSeed }
  const localSeed = {
    ...loaded.local,
    ...(loaded.local.hoverboard_bookmark_usage ? {} : getPlaceholderUsageSeed(placeholderSeedTimestamp)),
    ...(loaded.local.hoverboard_bookmark_nav_edges ? {} : getPlaceholderEdgesSeed(placeholderSeedTimestamp))
  }

  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hoverboard-screenshots-'))
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [`--disable-extensions-except=${extPath}`, `--load-extension=${extPath}`]
  })

  try {
    const extensionId = await getExtensionId(context)
    await seedExtension(context, extensionId, localSeed, loaded.sync)
    await seedBrowserBookmarks(context, extensionId)
    await captureLocalBookmarksIndex(context, extensionId)
    await captureSidePanel(context, extensionId)
    await captureBrowserBookmarks(context, extensionId)
    await captureVisitHistory(context, extensionId)
    console.log('README screenshots written to images/')
  } finally {
    await context.close()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
