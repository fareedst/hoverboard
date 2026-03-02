/**
 * [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS]
 * Unit tests: filterBrowserTabs (case-insensitive filter on title, URL, referrer), buildUrlListForCopy (URLs from visible tabs).
 */

import {
  filterBrowserTabs,
  buildUrlListForCopy,
  buildRecordsYamlForCopy,
  getReferrerDisplayText,
  initBrowserTabsTab,
  SEARCH_SCOPE_TAB_INFO,
  SEARCH_SCOPE_PAGE_TEXT,
  SEARCH_SCOPE_IMPORTANT_TAGS
} from '../../src/ui/side-panel/browser-tabs-panel.js'

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

  // [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] scope tabInfo (default): same as no scope
  test('scope tabInfo or omitted uses title, url, referrer', () => {
    expect(filterBrowserTabs(tabs, 'google', SEARCH_SCOPE_TAB_INFO).length).toBeGreaterThanOrEqual(1)
    expect(filterBrowserTabs(tabs, 'google').some(t => t.id === 1)).toBe(true)
  })
})

describe('[REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] filterBrowserTabs scope pageText', () => {
  const tabsWithPageText = [
    { id: 1, title: 'A', url: 'https://a.com', referrer: '', pageText: 'Welcome to Alpha product page' },
    { id: 2, title: 'B', url: 'https://b.com', referrer: '', pageText: 'Beta documentation and guides' },
    { id: 3, title: 'C', url: 'https://c.com', referrer: '', pageText: 'Contact us for support' }
  ]

  test('filters by pageText when scope is pageText', () => {
    const out = filterBrowserTabs(tabsWithPageText, 'Alpha', SEARCH_SCOPE_PAGE_TEXT)
    expect(out).toHaveLength(1)
    expect(out[0].id).toBe(1)
  })

  test('empty query returns all when scope pageText', () => {
    expect(filterBrowserTabs(tabsWithPageText, '', SEARCH_SCOPE_PAGE_TEXT)).toEqual(tabsWithPageText)
  })

  test('no match in pageText returns empty', () => {
    expect(filterBrowserTabs(tabsWithPageText, 'xyz', SEARCH_SCOPE_PAGE_TEXT)).toEqual([])
  })

  test('missing pageText treated as empty string', () => {
    const withMissing = [{ id: 1, title: 'T', url: 'https://x.com', referrer: '' }]
    expect(filterBrowserTabs(withMissing, 'anything', SEARCH_SCOPE_PAGE_TEXT)).toEqual([])
  })
})

describe('[REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] filterBrowserTabs scope importantTags', () => {
  const tabsWithTags = [
    { id: 1, title: 'A', url: 'https://a.com', referrer: '', importantTags: 'Home Page Main heading' },
    { id: 2, title: 'B', url: 'https://b.com', referrer: '', importantTags: 'Docs H1 Getting started' }
  ]

  test('filters by importantTags when scope is importantTags', () => {
    const out = filterBrowserTabs(tabsWithTags, 'Getting started', SEARCH_SCOPE_IMPORTANT_TAGS)
    expect(out).toHaveLength(1)
    expect(out[0].id).toBe(2)
  })

  test('empty query returns all when scope importantTags', () => {
    expect(filterBrowserTabs(tabsWithTags, '', SEARCH_SCOPE_IMPORTANT_TAGS)).toEqual(tabsWithTags)
  })

  test('missing importantTags treated as empty string', () => {
    const withMissing = [{ id: 1, title: 'T', url: 'https://x.com', referrer: '' }]
    expect(filterBrowserTabs(withMissing, 'heading', SEARCH_SCOPE_IMPORTANT_TAGS)).toEqual([])
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

/**
 * [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS]
 * Copy Records: buildRecordsYamlForCopy returns YAML list of full tab records (id, windowId, title, url, referrer).
 */
describe('[REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] buildRecordsYamlForCopy', () => {
  test('empty array returns minimal YAML list', () => {
    const yaml = buildRecordsYamlForCopy([])
    expect(yaml).toBeDefined()
    expect(typeof yaml).toBe('string')
    expect(yaml.trim()).toBe('')
  })

  test('one record includes all five fields id windowId title url referrer', () => {
    const list = [
      { id: 1, windowId: 100, title: 'Page', url: 'https://example.com', referrer: 'https://google.com' }
    ]
    const yaml = buildRecordsYamlForCopy(list)
    expect(yaml).toContain('id: 1')
    expect(yaml).toContain('windowId: 100')
    expect(yaml).toContain('title:')
    expect(yaml).toContain('Page')
    expect(yaml).toContain('url:')
    expect(yaml).toContain('https://example.com')
    expect(yaml).toContain('referrer:')
    expect(yaml).toContain('https://google.com')
  })

  test('multiple records produce valid YAML list', () => {
    const list = [
      { id: 1, windowId: 10, title: 'A', url: 'https://a.com', referrer: '' },
      { id: 2, windowId: 10, title: 'B', url: 'https://b.com', referrer: 'https://a.com' }
    ]
    const yaml = buildRecordsYamlForCopy(list)
    expect(yaml).toContain('id: 1')
    expect(yaml).toContain('id: 2')
    expect(yaml).toContain('windowId: 10')
    expect(yaml).toContain('https://a.com')
    expect(yaml).toContain('https://b.com')
  })

  test('strings with colons or quotes are safely serialized', () => {
    const list = [
      { id: 1, windowId: 1, title: 'Title: with colon', url: 'https://example.com', referrer: '' }
    ]
    const yaml = buildRecordsYamlForCopy(list)
    expect(yaml).toContain('Title: with colon')
    expect(yaml).toContain('id: 1')
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
  // [IMPL-SIDE_PANEL_BROWSER_TABS] loadTabs now fetches bookmark tags via getCurrentBookmark; mock so loadTabs completes
  beforeEach(() => {
    global.chrome = global.chrome || {}
    global.chrome.runtime = global.chrome.runtime || {}
    const prev = global.chrome.runtime.sendMessage
    global.chrome.runtime.sendMessage = function (msg, cb) {
      if (msg.type === 'getCurrentBookmark' && typeof cb === 'function') {
        cb({ success: true, data: { url: msg.data?.url, tags: [] } })
        return
      }
      if (typeof prev === 'function') return prev.call(this, msg, cb)
      if (typeof cb === 'function') cb({})
    }
  })

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
          sel === '[data-action="copyRecords"]' || sel === '#browserTabsCopyRecordsBtn' ||
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
})

/**
 * [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS]
 * Batch bookmark actions: Set to-read sends saveBookmark with toread yes for each visible tab; Clear to-read only for existing bookmarks; Add tags merges or creates.
 */
describe('[REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] batch bookmark actions', () => {
  function makePanelDocWithBatchButtons () {
    const listEl = document.createElement('div')
    listEl.id = 'browserTabsList'
    listEl.className = 'browser-tabs-list'
    const messageEl = document.createElement('div')
    messageEl.id = 'browserTabsMessage'
    const tagsInput = document.createElement('input')
    tagsInput.id = 'browserTabsTagsInput'
    const addTagsBtn = document.createElement('button')
    addTagsBtn.setAttribute('data-action', 'addTags')
    addTagsBtn.id = 'browserTabsAddTagsBtn'
    const setToReadBtn = document.createElement('button')
    setToReadBtn.setAttribute('data-action', 'setToRead')
    setToReadBtn.id = 'browserTabsSetToReadBtn'
    const clearToReadBtn = document.createElement('button')
    clearToReadBtn.setAttribute('data-action', 'clearToRead')
    clearToReadBtn.id = 'browserTabsClearToReadBtn'
    const panel = document.createElement('div')
    panel.id = 'browserTabsPanel'
    panel.appendChild(tagsInput)
    panel.appendChild(addTagsBtn)
    panel.appendChild(setToReadBtn)
    panel.appendChild(clearToReadBtn)
    panel.appendChild(messageEl)
    panel.appendChild(listEl)
    panel.querySelector = (sel) => {
      if (sel === '#browserTabsList' || sel === '.browser-tabs-list') return listEl
      if (sel === '#browserTabsMessage') return messageEl
      if (sel === '#browserTabsTagsInput') return tagsInput
      if (sel === '[data-action="addTags"]' || sel === '#browserTabsAddTagsBtn') return addTagsBtn
      if (sel === '[data-action="setToRead"]' || sel === '#browserTabsSetToReadBtn') return setToReadBtn
      if (sel === '[data-action="clearToRead"]' || sel === '#browserTabsClearToReadBtn') return clearToReadBtn
      if (sel === '#browserTabsFilterInput' || sel === '[data-action="copyUrls"]' || sel === '[data-action="copyRecords"]' || sel === '[data-action="closeTabs"]') return null
      return null
    }
    panel.querySelectorAll = (sel) => {
      if (sel === 'input[name="browserTabsWindowScope"]') return []
      if (sel === 'input[name="browserTabsSearchScope"]') return []
      return []
    }
    return {
      doc: {
        getElementById (id) { return id === 'browserTabsPanel' ? panel : null },
        createElement: document.createElement.bind(document)
      },
      listEl,
      messageEl,
      tagsInput,
      addTagsBtn,
      setToReadBtn,
      clearToReadBtn,
      panel
    }
  }

  test('Set to-read sends getCurrentBookmark then saveBookmark with toread yes for each visible tab', async () => {
    const { doc, listEl, setToReadBtn, messageEl } = makePanelDocWithBatchButtons()
    const tabList = [
      { id: 1, title: 'Tab A', url: 'https://a.com' },
      { id: 2, title: 'Tab B', url: 'https://b.com' }
    ]
    const saveCalls = []
    const mockTabs = { query: async () => tabList }
    const getReferrers = async () => ({ 1: '', 2: '' })
    const origRuntime = global.chrome?.runtime
    global.chrome = global.chrome || {}
    global.chrome.runtime = {
      sendMessage (msg, cb) {
        if (msg.type === 'getCurrentBookmark') {
          const url = msg.data?.url ?? ''
          cb({ success: true, data: { url, exists: true, toread: 'no', description: '', tags: [] } })
        } else if (msg.type === 'saveBookmark') {
          saveCalls.push(msg.data)
          cb({ success: true })
        } else {
          cb({ success: true })
        }
      }
    }
    try {
      initBrowserTabsTab(doc, mockTabs, null, getReferrers)
      await new Promise(r => setTimeout(r, 150))
      setToReadBtn.click()
      await new Promise(r => setTimeout(r, 200))
      expect(saveCalls.length).toBe(2)
      expect(saveCalls.every(d => d.toread === 'yes')).toBe(true)
      expect(saveCalls.map(d => d.url)).toEqual(['https://a.com', 'https://b.com'])
      expect(messageEl.textContent).toContain('Set to-read for 2 tabs')
    } finally {
      if (origRuntime) global.chrome.runtime = origRuntime
    }
  })

  test('Clear to-read sends getCurrentBookmark then saveBookmark only when exists', async () => {
    const { doc, listEl, clearToReadBtn, messageEl } = makePanelDocWithBatchButtons()
    const tabList = [
      { id: 1, title: 'Tab A', url: 'https://a.com' },
      { id: 2, title: 'Tab B', url: 'https://b.com' }
    ]
    const saveCalls = []
    const mockTabs = { query: async () => tabList }
    const getReferrers = async () => ({ 1: '', 2: '' })
    const origRuntime = global.chrome?.runtime
    global.chrome = global.chrome || {}
    global.chrome.runtime = {
      sendMessage (msg, cb) {
        if (msg.type === 'getCurrentBookmark') {
          const url = msg.data?.url
          const exists = url === 'https://a.com'
          cb({ success: true, data: { url: msg.data?.url, title: msg.data?.title, exists, toread: exists ? 'yes' : 'no' } })
        } else if (msg.type === 'saveBookmark') {
          saveCalls.push(msg.data)
          cb({ success: true })
        } else cb({ success: true })
      }
    }
    try {
      initBrowserTabsTab(doc, mockTabs, null, getReferrers)
      await new Promise(r => setTimeout(r, 150))
      clearToReadBtn.click()
      await new Promise(r => setTimeout(r, 250))
      expect(saveCalls.length).toBe(1)
      expect(saveCalls[0].url).toBe('https://a.com')
      expect(saveCalls[0].toread).toBe('no')
      expect(messageEl.textContent).toContain('Cleared to-read for 1 tab')
    } finally {
      if (origRuntime) global.chrome.runtime = origRuntime
    }
  })

  test('Add tags with empty input does nothing', async () => {
    const { doc, addTagsBtn } = makePanelDocWithBatchButtons()
    const mockTabs = { query: async () => [{ id: 1, title: 'T', url: 'https://x.com' }] }
    const getReferrers = async () => ({ 1: '' })
    const messages = []
    const origRuntime = global.chrome?.runtime
    global.chrome = global.chrome || {}
    global.chrome.runtime = {
      sendMessage (msg, cb) {
        messages.push(msg.type)
        if (msg.type === 'getCurrentBookmark') cb({ success: true, data: { url: msg.data?.url, tags: [] } })
        else cb({ success: true })
      }
    }
    try {
      initBrowserTabsTab(doc, mockTabs, null, getReferrers)
      await new Promise(r => setTimeout(r, 150))
      const getCurrentBookmarkCountAfterInit = messages.filter(t => t === 'getCurrentBookmark').length
      const saveBookmarkCountAfterInit = messages.filter(t => t === 'saveBookmark').length
      addTagsBtn.click()
      await new Promise(r => setTimeout(r, 50))
      expect(messages.filter(t => t === 'saveBookmark').length).toBe(saveBookmarkCountAfterInit)
      expect(messages.filter(t => t === 'getCurrentBookmark').length).toBe(getCurrentBookmarkCountAfterInit)
    } finally {
      if (origRuntime) global.chrome.runtime = origRuntime
    }
  })

  test('Add tags with input sends getCurrentBookmark then saveBookmark (create or merge)', async () => {
    const { doc, tagsInput, addTagsBtn, messageEl } = makePanelDocWithBatchButtons()
    const tabList = [{ id: 1, title: 'Tab One', url: 'https://one.com' }]
    const saveCalls = []
    const mockTabs = { query: async () => tabList }
    const getReferrers = async () => ({ 1: '' })
    const origRuntime = global.chrome?.runtime
    global.chrome = global.chrome || {}
    global.chrome.runtime = {
      sendMessage (msg, cb) {
        if (msg.type === 'getCurrentBookmark') {
          cb({ success: true, data: { url: msg.data?.url, exists: false, tags: [] } })
        } else if (msg.type === 'saveBookmark') {
          saveCalls.push(msg.data)
          cb({ success: true })
        } else cb({ success: true })
      }
    }
    try {
      initBrowserTabsTab(doc, mockTabs, null, getReferrers)
      await new Promise(r => setTimeout(r, 150))
      tagsInput.value = 'foo, bar'
      tagsInput.dispatchEvent(new Event('input', { bubbles: true }))
      addTagsBtn.click()
      await new Promise(r => setTimeout(r, 150))
      expect(saveCalls.length).toBe(1)
      expect(saveCalls[0].url).toBe('https://one.com')
      expect(saveCalls[0].tags).toEqual(['foo', 'bar'])
      expect(saveCalls[0].preferredBackend).toBe('local')
      expect(messageEl.textContent).toContain('Added tags for 1 tab')
    } finally {
      if (origRuntime) global.chrome.runtime = origRuntime
    }
  })

  test('Add tags with existing bookmark merges tags via buildAddTagsPayload', async () => {
    const { doc, tagsInput, addTagsBtn, messageEl } = makePanelDocWithBatchButtons()
    const tabList = [{ id: 1, title: 'Tab One', url: 'https://one.com' }]
    const saveCalls = []
    const mockTabs = { query: async () => tabList }
    const getReferrers = async () => ({ 1: '' })
    const origRuntime = global.chrome?.runtime
    global.chrome = global.chrome || {}
    global.chrome.runtime = {
      sendMessage (msg, cb) {
        if (msg.type === 'getCurrentBookmark') {
          cb({ success: true, data: { url: 'https://one.com', exists: true, tags: ['existing'], storage: 'local' } })
        } else if (msg.type === 'saveBookmark') {
          saveCalls.push(msg.data)
          cb({ success: true })
        } else cb({ success: true })
      }
    }
    try {
      initBrowserTabsTab(doc, mockTabs, null, getReferrers)
      await new Promise(r => setTimeout(r, 150))
      tagsInput.value = 'newTag'
      addTagsBtn.click()
      await new Promise(r => setTimeout(r, 150))
      expect(saveCalls.length).toBe(1)
      expect(saveCalls[0].tags).toContain('existing')
      expect(saveCalls[0].tags).toContain('newTag')
      expect(messageEl.textContent).toContain('Added tags for 1 tab')
    } finally {
      if (origRuntime) global.chrome.runtime = origRuntime
    }
  })
})

/**
 * [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS]
 * Referrer + Copy Records + card ids (continued from referrer from getReferrers).
 */
describe('[REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] referrer and Copy Records', () => {
  beforeEach(() => {
    global.chrome = global.chrome || {}
    global.chrome.runtime = global.chrome.runtime || {}
    const prev = global.chrome.runtime.sendMessage
    global.chrome.runtime.sendMessage = function (msg, cb) {
      if (msg.type === 'getCurrentBookmark' && typeof cb === 'function') {
        cb({ success: true, data: { url: msg.data?.url, tags: [] } })
        return
      }
      if (typeof prev === 'function') return prev.call(this, msg, cb)
      if (typeof cb === 'function') cb({})
    }
  })

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
          sel === '[data-action="copyRecords"]' || sel === '#browserTabsCopyRecordsBtn' ||
          sel === '[data-action="closeTabs"]' || sel === '#browserTabsCloseBtn' || sel === '#browserTabsMessage' ||
          sel === '#browserTabsTagsInput' || sel === '[data-action="addTags"]' || sel === '[data-action="setToRead"]' || sel === '[data-action="clearToRead"]') return null
      return null
    }
    panel.querySelectorAll = () => []
    return {
      doc: {
        getElementById (id) { return id === 'browserTabsPanel' ? panel : null },
        createElement: document.createElement.bind(document)
      },
      listEl,
      panel
    }
  }

  // [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] Copy Records button writes YAML to clipboard
  test('Copy Records button writes full tab records as YAML to clipboard', async () => {
    const listEl = document.createElement('div')
    listEl.id = 'browserTabsList'
    listEl.className = 'browser-tabs-list'
    const copyRecordsBtn = document.createElement('button')
    copyRecordsBtn.setAttribute('data-action', 'copyRecords')
    copyRecordsBtn.id = 'browserTabsCopyRecordsBtn'
    const messageEl = document.createElement('div')
    messageEl.id = 'browserTabsMessage'
    const panel = document.createElement('div')
    panel.id = 'browserTabsPanel'
    panel.appendChild(listEl)
    panel.appendChild(copyRecordsBtn)
    panel.appendChild(messageEl)
    panel.querySelector = (sel) => {
      if (sel === '#browserTabsList' || sel === '.browser-tabs-list') return listEl
      if (sel === '[data-action="copyRecords"]' || sel === '#browserTabsCopyRecordsBtn') return copyRecordsBtn
      if (sel === '#browserTabsMessage') return messageEl
      if (sel === '#browserTabsFilterInput' || sel === '[data-action="copyUrls"]' || sel === '#browserTabsCopyBtn' ||
          sel === '[data-action="closeTabs"]' || sel === '#browserTabsCloseBtn') return null
      return null
    }
    const doc = { getElementById: (id) => (id === 'browserTabsPanel' ? panel : null), createElement: document.createElement.bind(document) }
    let clipboardText = null
    const mockClipboard = { writeText: (text) => { clipboardText = text; return Promise.resolve() } }
    Object.defineProperty(global, 'navigator', { value: { clipboard: mockClipboard }, writable: true })
    const mockTabs = {
      query: async () => [
        { id: 5, windowId: 20, title: 'YAML Tab', url: 'https://yaml.example.com', referrer: '' }
      ]
    }
    const getReferrers = async () => ({ 5: '' })
    initBrowserTabsTab(doc, mockTabs, null, getReferrers)
    await new Promise(r => setTimeout(r, 100))
    copyRecordsBtn.click()
    await new Promise(r => setTimeout(r, 50))
    expect(clipboardText).toBeTruthy()
    expect(clipboardText).toContain('id: 5')
    expect(clipboardText).toContain('windowId: 20')
    expect(clipboardText).toContain('title:')
    expect(clipboardText).toContain('YAML Tab')
    expect(clipboardText).toContain('url:')
    expect(clipboardText).toContain('https://yaml.example.com')
    expect(clipboardText).toContain('referrer:')
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
 * [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS]
 * Clickable window/tab id: ids line is a button; on click calls chrome.windows.update and chrome.tabs.update.
 */
describe('[REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] clickable window/tab id (focus on click)', () => {
  beforeEach(() => {
    global.chrome = global.chrome || {}
    global.chrome.runtime = global.chrome.runtime || {}
    const prev = global.chrome.runtime.sendMessage
    global.chrome.runtime.sendMessage = function (msg, cb) {
      if (msg.type === 'getCurrentBookmark' && typeof cb === 'function') {
        cb({ success: true, data: { url: msg.data?.url, tags: [] } })
        return
      }
      if (typeof prev === 'function') return prev.call(this, msg, cb)
      if (typeof cb === 'function') cb({})
    }
  })

  function makePanelDoc () {
    const listEl = document.createElement('div')
    listEl.id = 'browserTabsList'
    listEl.className = 'browser-tabs-list'
    const panel = document.createElement('div')
    panel.id = 'browserTabsPanel'
    panel.appendChild(listEl)
    panel.querySelector = (sel) => {
      if (sel === '#browserTabsList' || sel === '.browser-tabs-list') return listEl
      return null
    }
    panel.querySelectorAll = () => []
    return {
      doc: {
        getElementById (id) { return id === 'browserTabsPanel' ? panel : null },
        createElement: document.createElement.bind(document)
      },
      listEl,
      panel
    }
  }

  test('card has clickable element with data-window-id and data-tab-id when windowId and tabId present', async () => {
    const { doc, listEl } = makePanelDoc()
    const mockTabs = {
      query: async () => [{ id: 42, windowId: 100, title: 'Tab A', url: 'https://a.com' }]
    }
    const getReferrers = async () => ({ 42: '' })
    initBrowserTabsTab(doc, mockTabs, null, getReferrers)
    await new Promise(r => setTimeout(r, 100))
    const link = listEl.querySelector('.browser-tabs-card-ids-link')
    expect(link).toBeTruthy()
    expect(link.getAttribute('data-window-id')).toBe('100')
    expect(link.getAttribute('data-tab-id')).toBe('42')
  })

  test('clicking ids button calls windows.update and tabs.update with correct args', async () => {
    const { doc, listEl } = makePanelDoc()
    const windowsUpdate = jest.fn().mockResolvedValue(undefined)
    const tabsUpdate = jest.fn().mockResolvedValue(undefined)
    const mockTabs = {
      query: async () => [{ id: 7, windowId: 3, title: 'T', url: 'https://x.com' }],
      update: tabsUpdate
    }
    const mockWindows = { update: windowsUpdate }
    const getReferrers = async () => ({ 7: '' })
    initBrowserTabsTab(doc, mockTabs, null, getReferrers, mockWindows)
    await new Promise(r => setTimeout(r, 100))
    const link = listEl.querySelector('.browser-tabs-card-ids-link')
    expect(link).toBeTruthy()
    link.click()
    expect(windowsUpdate).toHaveBeenCalledWith(3, { focused: true })
    expect(tabsUpdate).toHaveBeenCalledWith(7, { active: true })
  })
})

/**
 * [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS]
 * Bookmark tags: each tab row displays bookmark tags for that URL; — when none.
 */
describe('[REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] bookmark tags display', () => {
  function makePanelDoc () {
    const listEl = document.createElement('div')
    listEl.id = 'browserTabsList'
    listEl.className = 'browser-tabs-list'
    const panel = document.createElement('div')
    panel.id = 'browserTabsPanel'
    panel.appendChild(listEl)
    panel.querySelector = (sel) => {
      if (sel === '#browserTabsList' || sel === '.browser-tabs-list') return listEl
      return null
    }
    panel.querySelectorAll = () => []
    return {
      doc: {
        getElementById (id) { return id === 'browserTabsPanel' ? panel : null },
        createElement: document.createElement.bind(document)
      },
      listEl,
      panel
    }
  }

  test('card displays bookmark tags when tab has bookmarkTags', async () => {
    const { doc, listEl } = makePanelDoc()
    const mockTabs = {
      query: async () => [
        { id: 1, windowId: 10, title: 'A', url: 'https://a.com' }
      ]
    }
    const getReferrers = async () => ({ 1: '' })
    global.chrome = global.chrome || {}
    global.chrome.runtime = {
      sendMessage (msg, cb) {
        if (msg.type === 'getCurrentBookmark') {
          cb({ success: true, data: { url: msg.data?.url, tags: ['work', 'read-later'] } })
        } else cb({ success: true })
      }
    }
    try {
      initBrowserTabsTab(doc, mockTabs, null, getReferrers)
      await new Promise(r => setTimeout(r, 150))
      const card = listEl.querySelector('.browser-tabs-card')
      expect(card).toBeTruthy()
      const tagsEl = card.querySelector('.browser-tabs-card-tags')
      expect(tagsEl).toBeTruthy()
      expect(tagsEl.textContent).toContain('work')
      expect(tagsEl.textContent).toContain('read-later')
    } finally {
      if (global.chrome?.runtime) delete global.chrome.runtime
    }
  })

  test('card shows — for tags when no bookmark or empty tags', async () => {
    const { doc, listEl } = makePanelDoc()
    const mockTabs = {
      query: async () => [
        { id: 1, windowId: 10, title: 'B', url: 'https://b.com' }
      ]
    }
    const getReferrers = async () => ({ 1: '' })
    global.chrome = global.chrome || {}
    global.chrome.runtime = {
      sendMessage (msg, cb) {
        if (msg.type === 'getCurrentBookmark') {
          cb({ success: true, data: { url: msg.data?.url, tags: [] } })
        } else cb({ success: true })
      }
    }
    try {
      initBrowserTabsTab(doc, mockTabs, null, getReferrers)
      await new Promise(r => setTimeout(r, 150))
      const card = listEl.querySelector('.browser-tabs-card')
      expect(card).toBeTruthy()
      const tagsEl = card.querySelector('.browser-tabs-card-tags')
      expect(tagsEl).toBeTruthy()
      expect(tagsEl.textContent).toContain('Tags:')
      expect(tagsEl.textContent).toContain('—')
    } finally {
      if (global.chrome?.runtime) delete global.chrome.runtime
    }
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

/**
 * [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] Search scope: when scope is Page text, panel fetches getTabsPageText and merges into tabs; filter uses pageText.
 */
describe('[REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] search scope Page text (merge and filter)', () => {
  function makePanelDocWithSearchScope () {
    const listEl = document.createElement('div')
    listEl.id = 'browserTabsList'
    listEl.className = 'browser-tabs-list'
    const filterInput = document.createElement('input')
    filterInput.id = 'browserTabsFilterInput'
    const scopeTabInfo = document.createElement('input')
    scopeTabInfo.type = 'radio'
    scopeTabInfo.name = 'browserTabsSearchScope'
    scopeTabInfo.value = 'tabInfo'
    scopeTabInfo.id = 'browserTabsSearchScopeTabInfo'
    const scopePageText = document.createElement('input')
    scopePageText.type = 'radio'
    scopePageText.name = 'browserTabsSearchScope'
    scopePageText.value = 'pageText'
    scopePageText.id = 'browserTabsSearchScopePageText'
    const scopeImportantTags = document.createElement('input')
    scopeImportantTags.type = 'radio'
    scopeImportantTags.name = 'browserTabsSearchScope'
    scopeImportantTags.value = 'importantTags'
    scopeImportantTags.id = 'browserTabsSearchScopeImportantTags'
    scopePageText.checked = true
    const panel = document.createElement('div')
    panel.id = 'browserTabsPanel'
    panel.appendChild(scopeTabInfo)
    panel.appendChild(scopePageText)
    panel.appendChild(scopeImportantTags)
    panel.appendChild(filterInput)
    panel.appendChild(listEl)
    panel.querySelector = (sel) => {
      if (sel === '#browserTabsList' || sel === '.browser-tabs-list') return listEl
      if (sel === '#browserTabsFilterInput') return filterInput
      if (sel === '#browserTabsMessage' || sel === '[data-action="copyUrls"]' || sel === '#browserTabsCopyBtn' ||
          sel === '[data-action="copyRecords"]' || sel === '#browserTabsCopyRecordsBtn' ||
          sel === '[data-action="closeTabs"]' || sel === '#browserTabsCloseBtn') return null
      return null
    }
    panel.querySelectorAll = (sel) => {
      if (sel === 'input[name="browserTabsSearchScope"]') return [scopeTabInfo, scopePageText, scopeImportantTags]
      if (sel === 'input[name="browserTabsWindowScope"]') return []
      return []
    }
    return {
      doc: {
        getElementById (id) { return id === 'browserTabsPanel' ? panel : null },
        createElement: document.createElement.bind(document)
      },
      listEl,
      filterInput,
      scopePageText
    }
  }

  test('when scope Page text and sendMessage returns pageText map, filter matches pageText', async () => {
    const { doc, listEl, filterInput } = makePanelDocWithSearchScope()
    const tabList = [
      { id: 1, title: 'Tab One', url: 'https://one.com' },
      { id: 2, title: 'Tab Two', url: 'https://two.com' }
    ]
    const pageTextMap = { 1: 'Content about bananas', 2: 'Content about apples' }
    let sentType = null
    const mockTabs = { query: async () => tabList }
    const getReferrers = async () => ({ 1: '', 2: '' })
    const origRuntime = global.chrome?.runtime
    global.chrome = global.chrome || {}
    global.chrome.runtime = {
      sendMessage (msg, cb) {
        sentType = msg?.type
        cb({ success: true, data: pageTextMap })
      }
    }
    try {
      initBrowserTabsTab(doc, mockTabs, null, getReferrers)
      await new Promise(r => setTimeout(r, 150))
      expect(sentType).toBe('getTabsPageText')
      filterInput.value = 'bananas'
      filterInput.dispatchEvent(new Event('input', { bubbles: true }))
      await new Promise(r => setTimeout(r, 50))
      const cards = listEl.querySelectorAll('.browser-tabs-card')
      expect(cards).toHaveLength(1)
      expect(cards[0].querySelector('.browser-tabs-card-title')?.textContent?.trim()).toBe('Tab One')
    } finally {
      if (origRuntime) global.chrome.runtime = origRuntime
    }
  })
})
