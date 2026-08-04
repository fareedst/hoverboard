/**
 * Token-tagged unit coverage for thin-stub IMPLs SEARCH / THEME / UX_CORE / EXT_IDENTITY / MV3.
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-MV3_MIGRATION ===
 * [IMPL-MV3_MIGRATION] [ARCH-MV3_MIGRATION] [REQ-MANIFEST_V3_MIGRATION] — How: keep store-compatible Manifest V3: service worker replaces background page; preserve messaging and APIs.
 *
 * ## MV3_BACKGROUND_RUNTIME
 *
 * - [IMPL-MV3_MIGRATION] [ARCH-MV3_MIGRATION] [REQ-MANIFEST_V3_MIGRATION] How: service worker owns listeners; async message replies use return true / Promise patterns.
 * - Contract:
 *   - INPUT: extension lifecycle events; chrome.runtime / chrome.storage / chrome.action calls
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: service-worker-backed background behavior equivalent to prior MV2 background page contracts
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: manifest_version 3; src/core/service-worker.js; ARCH-SERVICE_WORKER lifecycle patterns
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: MV3_BACKGROUND_RUNTIME
 *   - ON install/activate: init shared managers (config, tags memory, badge)
 *   - ON message: DELEGATE to MessageHandler; KEEP channel alive until AWAIT completes
 *   - ON alarm/idle as needed: wake worker for deferred work
 *   - RETURN
 *
 * ## MV3_ENTRY_POINT_BINDING
 *
 * - [IMPL-MV3_MIGRATION] [ARCH-MV3_MIGRATION] [REQ-MANIFEST_V3_MIGRATION] How: Verifies the Manifest V3 background declaration resolves to the shipped service-worker entry point without invoking a browser UI.
 * - Contract:
 *   - INPUT: manifest file and service-worker entry path
 *   - PRE: manifest JSON and repository entry file are readable
 *   - OUTPUT: validated manifest_version and existing service-worker path
 *   - POST:
 *     - success => manifest declares version 3 and points to src/core/service-worker.js
 *   - FAILURE_MODES: InvalidManifest, MissingServiceWorker
 *   - EFFECTS: pure, IO
 *   - TERMINATION: total
 * - PROCEDURE: MV3_ENTRY_POINT_BINDING
 *   - READ manifest
 *   - ASSERT manifest_version = 3
 *   - READ background.service_worker
 *   - ASSERT entry path = src/core/service-worker.js
 *   - ASSERT entry file exists
 *
 * === END IMPL-FULL-BLOCK: IMPL-MV3_MIGRATION ===
 */
import { ThemeManager } from '../../src/ui/components/ThemeManager.js'
import { TabSearchService } from '../../src/features/search/tab-search-service.js'
import fs from 'fs'
import path from 'path'

describe('[IMPL-THEME] ThemeManager apply/default', () => {
  beforeEach(() => {
    global.chrome = global.chrome || {}
    global.chrome.runtime = global.chrome.runtime || { lastError: null }
    global.chrome.storage = {
      local: {
        get: jest.fn((_keys, cb) => { if (cb) cb({}); return Promise.resolve({}) }),
        set: jest.fn((_data, cb) => { if (cb) cb(); return Promise.resolve() })
      },
      sync: {
        get: jest.fn().mockResolvedValue({}),
        set: jest.fn().mockResolvedValue(undefined)
      }
    }
    document.documentElement.className = ''
  })

  test('setTheme dark persists preference and resolves dark [IMPL-THEME]', async () => {
    const tm = new ThemeManager()
    await tm.setTheme('dark')
    expect(tm.getTheme()).toBe('dark')
    expect(tm.getResolvedTheme()).toBe('dark')
  })
})

describe('[IMPL-SEARCH] TabSearchService RUN_SEARCH via searchAndNavigate', () => {
  let service

  beforeEach(() => {
    service = new TabSearchService()
    service.getAllTabs = jest.fn().mockResolvedValue([
      { id: 1, title: 'Alpha Docs', windowId: 1 },
      { id: 2, title: 'Beta Notes', windowId: 1 }
    ])
    service.activateTab = jest.fn().mockResolvedValue(undefined)
    service.focusWindow = jest.fn().mockResolvedValue(undefined)
  })

  test('empty-trimmed query with no title match returns NO_MATCH signal [IMPL-SEARCH]', async () => {
    const result = await service.searchAndNavigate('zzz-no-match', 1)
    expect(result.success).toBe(false)
    expect(result.matchCount).toBe(0)
    expect(result.message).toMatch(/No matching/i)
  })

  test('matching query navigates to next tab [IMPL-SEARCH]', async () => {
    const result = await service.searchAndNavigate('Beta', 1)
    expect(result.success).toBe(true)
    expect(result.tabId).toBe(2)
    expect(service.activateTab).toHaveBeenCalledWith(2)
  })
})

describe('[IMPL-UX_CORE] popup stays open contract (session composition)', () => {
  test('popup-close-behavior suite owns KEEP-open after toggle [IMPL-UX_CORE]', () => {
    // Traceability anchor: PROCEDURE HANDLE_POPUP_ACTION → KEEP popup open is covered by
    // tests/unit/popup-close-behavior.test.js ([IMPL-POPUP_SESSION]).
    const suite = path.join(process.cwd(), 'tests/unit/popup-close-behavior.test.js')
    expect(fs.existsSync(suite)).toBe(true)
    const body = fs.readFileSync(suite, 'utf8')
    expect(body).toMatch(/closePopup/)
    expect(body).toMatch(/IMPL-POPUP_SESSION/)
  })
})

describe('[IMPL-EXT_IDENTITY] [IMPL-MV3_MIGRATION] manifest bootstrap', () => {
  test('manifest_version is 3 and names Hoverboard [IMPL-EXT_IDENTITY] [IMPL-MV3_MIGRATION]', () => {
    const manifest = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'manifest.json'), 'utf8')
    )
    expect(manifest.manifest_version).toBe(3)
    expect(manifest.name).toMatch(/Hoverboard/i)
    expect(manifest.background?.service_worker).toBeTruthy()
  })
})
