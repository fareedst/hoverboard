/**
 * [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS]
 * Unit tests: filterBrowserTabs (case-insensitive filter on title, URL, referrer), buildUrlListForCopy (URLs from visible tabs).
 */

import { filterBrowserTabs, buildUrlListForCopy, getReferrerDisplayText, initBrowserTabsTab } from '../../src/ui/side-panel/browser-tabs-panel.js'

const tabs = [
  { id: 1, title: 'Google', url: 'https://google.com', referrer: '' },
  { id: 2, title: 'Example Page', url: 'https://example.com/page', referrer: 'https://google.com/' },
  { id: 3, title: 'GitHub Docs', url: 'https://docs.github.com', referrer: 'https://example.com' }
]

describe('[REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] filterBrowserTabs', () => {
  test('empty query returns all tabs', () => {
    expect(filterBrowserTabs(tabs, '')).toEqual(tabs)
    expect(filterBrowserTabs(tabs, '   ')).toEqual(tabs)
  })

  test('case-insensitive match on title', () => {
    const googleMatch = filterBrowserTabs(tabs, 'google')
    expect(googleMatch.length).toBeGreaterThanOrEqual(1)
    expect(googleMatch.some(t => t.id === 1)).toBe(true)
    expect(filterBrowserTabs(tabs, 'GOOGLE').some(t => t.id === 1)).toBe(true)
    expect(filterBrowserTabs(tabs, 'Example').some(t => t.id === 2)).toBe(true)
    expect(filterBrowserTabs(tabs, 'example page')[0].id).toBe(2)
  })

  test('case-insensitive match on URL', () => {
    const exampleMatch = filterBrowserTabs(tabs, 'example.com')
    expect(exampleMatch.length).toBeGreaterThanOrEqual(1)
    expect(exampleMatch.some(t => t.id === 2)).toBe(true)
    expect(filterBrowserTabs(tabs, 'docs.github')).toHaveLength(1)
    expect(filterBrowserTabs(tabs, 'HTTPS://GOOGLE').some(t => t.id === 1)).toBe(true)
  })

  test('case-insensitive match on referrer', () => {
    expect(filterBrowserTabs(tabs, 'google.com')).toHaveLength(2) // title of 1, referrer of 2
    const withRef = filterBrowserTabs(tabs, 'example.com')
    expect(withRef.length).toBeGreaterThanOrEqual(1)
    expect(withRef.some(t => t.referrer && t.referrer.toLowerCase().includes('example'))).toBe(true)
  })

  test('no match returns empty array', () => {
    expect(filterBrowserTabs(tabs, 'xyznone')).toEqual([])
  })

  test('null or undefined query treated as empty (returns all)', () => {
    expect(filterBrowserTabs(tabs, null)).toEqual(tabs)
    expect(filterBrowserTabs(tabs, undefined)).toEqual(tabs)
  })
})

describe('[REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] buildUrlListForCopy', () => {
  test('returns URLs joined by newline', () => {
    const list = [
      { id: 1, url: 'https://a.com', title: '', referrer: '' },
      { id: 2, url: 'https://b.com', title: '', referrer: '' }
    ]
    expect(buildUrlListForCopy(list)).toBe('https://a.com\nhttps://b.com')
  })

  test('empty array returns empty string', () => {
    expect(buildUrlListForCopy([])).toBe('')
  })

  test('single tab returns single URL without trailing newline', () => {
    expect(buildUrlListForCopy([{ id: 1, url: 'https://one.com', title: '', referrer: '' }])).toBe('https://one.com')
  })
})

describe('[REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] getReferrerDisplayText (referrer display)', () => {
  test('null returns placeholder (not the string "null")', () => {
    expect(getReferrerDisplayText(null)).toBe('—')
  })

  test('undefined returns placeholder', () => {
    expect(getReferrerDisplayText(undefined)).toBe('—')
  })

  test('empty string returns placeholder', () => {
    expect(getReferrerDisplayText('')).toBe('—')
  })

  test('string "null" returns placeholder (must not be shown as literal)', () => {
    expect(getReferrerDisplayText('null')).toBe('—')
  })

  test('valid referrer URL is displayed as-is', () => {
    expect(getReferrerDisplayText('https://example.com/')).toBe('https://example.com/')
  })
})

/**
 * [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS]
 * Integration: referrer is merged from GET_TAB_REFERRERS response (SW); when getReferrers returns a map, panel displays it (not placeholder).
 */
describe('[REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] referrer from getReferrers (SW path)', () => {
  function makePanelDoc () {
    const listEl = document.createElement('div')
    listEl.id = 'browserTabsList'
    listEl.className = 'browser-tabs-list'
    const panel = document.createElement('div')
    panel.id = 'browserTabsPanel'
    panel.appendChild(listEl)
    panel.querySelector = (sel) => {
      if (sel === '#browserTabsList' || sel === '.browser-tabs-list') return listEl
      if (sel === '#browserTabsFilterInput' || sel === '[data-action="copyUrls"]' || sel === '#browserTabsCopyBtn' ||
          sel === '[data-action="closeTabs"]' || sel === '#browserTabsCloseBtn' || sel === '#browserTabsMessage') return null
      return null
    }
    return {
      doc: {
        getElementById (id) { return id === 'browserTabsPanel' ? panel : null },
        createElement: document.createElement.bind(document)
      },
      listEl,
      panel
    }
  }

  test('when getReferrers returns referrer map, card displays URL not placeholder', async () => {
    const referrerUrl = 'https://referrer.example.com/'
    const { doc, listEl } = makePanelDoc()
    const mockTabs = { query: async () => [{ id: 1, title: 'Test Tab', url: 'https://example.com' }] }
    const getReferrers = async () => ({ 1: referrerUrl })
    initBrowserTabsTab(doc, mockTabs, null, getReferrers)
    await new Promise(r => setTimeout(r, 100))
    const card = listEl.querySelector('.browser-tabs-card')
    expect(card).toBeTruthy()
    const referrerEl = card.querySelector('.browser-tabs-card-referrer')
    expect(referrerEl).toBeTruthy()
    expect(referrerEl.textContent.trim()).toBe(referrerUrl)
  })

  test('multiple tabs get correct referrers from getReferrers map', async () => {
    const { doc, listEl } = makePanelDoc()
    const mockTabs = {
      query: async () => [
        { id: 10, title: 'A', url: 'https://a.com' },
        { id: 20, title: 'B', url: 'https://b.com' }
      ]
    }
    const getReferrers = async () => ({ 10: 'https://google.com/', 20: 'https://a.com/' })
    initBrowserTabsTab(doc, mockTabs, null, getReferrers)
    await new Promise(r => setTimeout(r, 100))
    const cards = listEl.querySelectorAll('.browser-tabs-card')
    expect(cards).toHaveLength(2)
    expect(cards[0].querySelector('.browser-tabs-card-referrer')?.textContent?.trim()).toBe('https://google.com/')
    expect(cards[1].querySelector('.browser-tabs-card-referrer')?.textContent?.trim()).toBe('https://a.com/')
  })

  test('when getReferrers is not provided and no runtime, referrer displays placeholder', async () => {
    const { doc, listEl } = makePanelDoc()
    const mockTabs = { query: async () => [{ id: 1, title: 'Test Tab', url: 'https://example.com' }] }
    const origRuntime = global.chrome.runtime
    global.chrome.runtime = null
    try {
      initBrowserTabsTab(doc, mockTabs, null)
      await new Promise(r => setTimeout(r, 100))
      const card = listEl.querySelector('.browser-tabs-card')
      expect(card).toBeTruthy()
      const referrerEl = card.querySelector('.browser-tabs-card-referrer')
      expect(referrerEl).toBeTruthy()
      expect(referrerEl.textContent.trim()).toBe('—')
    } finally {
      global.chrome.runtime = origRuntime
    }
  })

  test('when getReferrers returns empty map, referrer displays placeholder', async () => {
    const { doc, listEl } = makePanelDoc()
    const mockTabs = { query: async () => [{ id: 1, title: 'Test Tab', url: 'https://example.com' }] }
    const getReferrers = async () => ({})
    initBrowserTabsTab(doc, mockTabs, null, getReferrers)
    await new Promise(r => setTimeout(r, 100))
    const card = listEl.querySelector('.browser-tabs-card')
    expect(card).toBeTruthy()
    expect(card.querySelector('.browser-tabs-card-referrer')?.textContent?.trim()).toBe('—')
  })

  // [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] Each tab row displays window id and tab id
  test('card displays window id and tab id', async () => {
    const { doc, listEl } = makePanelDoc()
    const mockTabs = {
      query: async () => [
        { id: 42, windowId: 100, title: 'Tab A', url: 'https://a.com' }
      ]
    }
    const getReferrers = async () => ({ 42: '' })
    initBrowserTabsTab(doc, mockTabs, null, getReferrers)
    await new Promise(r => setTimeout(r, 100))
    const card = listEl.querySelector('.browser-tabs-card')
    expect(card).toBeTruthy()
    const idsEl = card.querySelector('.browser-tabs-card-ids')
    expect(idsEl).toBeTruthy()
    const text = idsEl.textContent.trim()
    expect(text).toContain('100')
    expect(text).toContain('42')
  })
})

/**
 * [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] Window scope: default current window, toggle to all windows
 */
describe('[REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] window scope (current vs all)', () => {
  function makePanelDocWithScopeToggle () {
    const listEl = document.createElement('div')
    listEl.id = 'browserTabsList'
    listEl.className = 'browser-tabs-list'
    const scopeCurrent = document.createElement('input')
    scopeCurrent.type = 'radio'
    scopeCurrent.name = 'browserTabsWindowScope'
    scopeCurrent.value = 'currentWindow'
    scopeCurrent.id = 'browserTabsScopeCurrent'
    const scopeAll = document.createElement('input')
    scopeAll.type = 'radio'
    scopeAll.name = 'browserTabsWindowScope'
    scopeAll.value = 'all'
    scopeAll.id = 'browserTabsScopeAll'
    const panel = document.createElement('div')
    panel.id = 'browserTabsPanel'
    panel.appendChild(scopeCurrent)
    panel.appendChild(scopeAll)
    panel.appendChild(listEl)
    panel.querySelector = (sel) => {
      if (sel === '#browserTabsList' || sel === '.browser-tabs-list') return listEl
      if (sel === '#browserTabsFilterInput' || sel === '[data-action="copyUrls"]' || sel === '#browserTabsCopyBtn' ||
          sel === '[data-action="closeTabs"]' || sel === '#browserTabsMessage') return null
      if (sel === '#browserTabsScopeCurrent' || sel === 'input[name="browserTabsWindowScope"][value="currentWindow"]') return scopeCurrent
      if (sel === '#browserTabsScopeAll' || sel === 'input[name="browserTabsWindowScope"][value="all"]') return scopeAll
      return null
    }
    panel.querySelectorAll = (sel) => {
      if (sel === 'input[name="browserTabsWindowScope"]') return [scopeCurrent, scopeAll]
      return []
    }
    return {
      doc: {
        getElementById (id) { return id === 'browserTabsPanel' ? panel : null },
        createElement: document.createElement.bind(document)
      },
      listEl,
      panel,
      scopeCurrent,
      scopeAll
    }
  }

  test('default scope calls query with currentWindow true', async () => {
    let capturedOpts = null
    const { doc } = makePanelDocWithScopeToggle()
    const mockTabs = {
      query: async (opts) => {
        capturedOpts = opts
        return []
      }
    }
    initBrowserTabsTab(doc, mockTabs, null, async () => ({}))
    await new Promise(r => setTimeout(r, 100))
    expect(capturedOpts).toEqual({ currentWindow: true })
  })

  test('when All windows selected, query called with empty object', async () => {
    let capturedOpts = null
    const { doc, scopeAll } = makePanelDocWithScopeToggle()
    const mockTabs = {
      query: async (opts) => {
        capturedOpts = opts
        return []
      }
    }
    initBrowserTabsTab(doc, mockTabs, null, async () => ({}))
    await new Promise(r => setTimeout(r, 50))
    capturedOpts = null
    scopeAll.checked = true
    scopeAll.dispatchEvent(new Event('change', { bubbles: true }))
    await new Promise(r => setTimeout(r, 100))
    expect(capturedOpts).toEqual({})
  })
})
