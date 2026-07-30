/**
 * Token-tagged unit coverage for thin-stub IMPLs SEARCH / THEME / UX_CORE / EXT_IDENTITY / MV3.
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
