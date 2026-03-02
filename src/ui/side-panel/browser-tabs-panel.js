/**
 * [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS]
 * Browser tabs panel: pure filter and URL list helpers; init and render (load tabs, referrer, UI); batch bookmark actions (set/clear to-read, add tags).
 */

import { parseTagsInput, buildAddTagsPayload } from '../bookmarks-table/bookmarks-table-filter.js'

/** [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] Search scope: tabInfo = title/url/referrer; pageText = body text; importantTags = alt, h1–h3, meta, etc. */
export const SEARCH_SCOPE_TAB_INFO = 'tabInfo'
export const SEARCH_SCOPE_PAGE_TEXT = 'pageText'
export const SEARCH_SCOPE_IMPORTANT_TAGS = 'importantTags'

/**
 * [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS]
 * Filter tabs by query (case-insensitive substring). Scope: tabInfo = title/url/referrer; pageText = tab.pageText; importantTags = tab.importantTags. Empty/whitespace returns all.
 * @param {{ id: number, title?: string, url?: string, referrer?: string, pageText?: string, importantTags?: string }[]} tabs
 * @param {string} query
 * @param {string} [scope] - 'tabInfo' (default), 'pageText', or 'importantTags'
 * @returns {typeof tabs}
 */
export function filterBrowserTabs (tabs, query, scope) {
  const q = (query == null ? '' : String(query)).trim().toLowerCase()
  if (q === '') return tabs
  const s = scope === SEARCH_SCOPE_PAGE_TEXT ? SEARCH_SCOPE_PAGE_TEXT : scope === SEARCH_SCOPE_IMPORTANT_TAGS ? SEARCH_SCOPE_IMPORTANT_TAGS : SEARCH_SCOPE_TAB_INFO
  if (s === SEARCH_SCOPE_PAGE_TEXT) {
    return tabs.filter((t) => (t.pageText ?? '').toLowerCase().includes(q))
  }
  if (s === SEARCH_SCOPE_IMPORTANT_TAGS) {
    return tabs.filter((t) => (t.importantTags ?? '').toLowerCase().includes(q))
  }
  return tabs.filter((t) => {
    const title = (t.title ?? '').toLowerCase()
    const url = (t.url ?? '').toLowerCase()
    const referrer = (t.referrer ?? '').toLowerCase()
    return title.includes(q) || url.includes(q) || referrer.includes(q)
  })
}

/**
 * [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS]
 * Build newline-separated URL list from visible tabs for clipboard copy.
 * @param {{ url?: string }[]} visibleTabs
 * @returns {string}
 */
export function buildUrlListForCopy (visibleTabs) {
  return (visibleTabs || []).map((t) => t.url ?? '').filter(Boolean).join('\n')
}

/**
 * [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS]
 * Build YAML string of full tab records (id, windowId, title, url, referrer) for clipboard copy.
 * @param {{ id: number, windowId?: number, title?: string, url?: string, referrer?: string }[]} visibleTabs
 * @returns {string}
 */
export function buildRecordsYamlForCopy (visibleTabs) {
  if (!visibleTabs || visibleTabs.length === 0) return ''
  const lines = []
  for (const tab of visibleTabs) {
    lines.push('- id: ' + Number(tab.id))
    lines.push('  windowId: ' + (tab.windowId != null ? Number(tab.windowId) : ''))
    lines.push('  title: ' + yamlQuoted(String(tab.title ?? '')))
    lines.push('  url: ' + yamlQuoted(String(tab.url ?? '')))
    lines.push('  referrer: ' + yamlQuoted(String(tab.referrer ?? '')))
  }
  return lines.join('\n')
}

function yamlQuoted (s) {
  if (s.includes('"') || s.includes('\n') || s.includes('\\') || s.includes(':')) {
    return '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"'
  }
  return '"' + s + '"'
}

/**
 * [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS]
 * Return the string to display for a tab's referrer: '—' for null, undefined, empty, or the literal "null"; else the referrer URL.
 * @param {string | null | undefined} referrer
 * @returns {string}
 */
export function getReferrerDisplayText (referrer) {
  if (referrer == null || referrer === '' || referrer === 'null') return '—'
  return referrer
}

/**
 * [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS]
 * Initialize the browser Tabs panel: load tabs, optionally referrers, render list, bind filter/copy/close.
 * Uses global document and chrome when doc/api not passed (e.g. from side-panel.js).
 * @param {Document | { getElementById: (id: string) => HTMLElement | null }} [doc]
 * @param {{ query: (opts: object) => Promise<object[]>, remove: (id: number) => Promise<void> }} [chromeTabs]
 * @param {{ executeScript?: (opts: object) => Promise<object[]> }} [chromeScripting] - unused; referrer is fetched via GET_TAB_REFERRERS from SW
 * @param {(tabs: { id?: number, url?: string }[]) => Promise<Record<number, string>>} [getReferrers] - optional for tests; when provided, used instead of sendMessage
 * @param {{ update: (windowId: number, opts: object) => Promise<unknown> }} [chromeWindows] - optional for tests; when provided, used for focus-on-click
 */
export function initBrowserTabsTab (doc, chromeTabs, chromeScripting, getReferrers, chromeWindows) {
  const document = doc || (typeof globalThis.document !== 'undefined' ? globalThis.document : null)
  if (!document) return
  const panel = document.getElementById('browserTabsPanel')
  if (!panel) return

  const filterInput = panel.querySelector('#browserTabsFilterInput')
  const listEl = panel.querySelector('#browserTabsList') || panel.querySelector('.browser-tabs-list')
  const copyBtn = panel.querySelector('[data-action="copyUrls"]') || panel.querySelector('#browserTabsCopyBtn')
  const copyRecordsBtn = panel.querySelector('[data-action="copyRecords"]') || panel.querySelector('#browserTabsCopyRecordsBtn')
  const closeBtn = panel.querySelector('[data-action="closeTabs"]') || panel.querySelector('#browserTabsCloseBtn')
  const messageEl = panel.querySelector('#browserTabsMessage')
  const scopeRadios = panel.querySelectorAll && panel.querySelectorAll('input[name="browserTabsWindowScope"]')
  const searchScopeRadios = panel.querySelectorAll && panel.querySelectorAll('input[name="browserTabsSearchScope"]')
  // [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] batch bookmark UI
  const tagsInput = panel.querySelector('#browserTabsTagsInput')
  const addTagsBtn = panel.querySelector('[data-action="addTags"]') || panel.querySelector('#browserTabsAddTagsBtn')
  const setToReadBtn = panel.querySelector('[data-action="setToRead"]') || panel.querySelector('#browserTabsSetToReadBtn')
  const clearToReadBtn = panel.querySelector('[data-action="clearToRead"]') || panel.querySelector('#browserTabsClearToReadBtn')

  // [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] windowScope: currentWindow (default) or all; searchScope: tabInfo (default), pageText, or importantTags
  let windowScope = 'currentWindow'
  let searchScope = SEARCH_SCOPE_TAB_INFO

  /** @type {{ id: number, windowId?: number, title?: string, url?: string, referrer?: string, pageText?: string, importantTags?: string, bookmarkTags?: string[] }[]} */
  let allTabs = []
  /** @type {{ id: number, windowId?: number, title?: string, url?: string, referrer?: string, pageText?: string, importantTags?: string, bookmarkTags?: string[] }[]} */
  let visibleTabs = []

  function getWindowScope () {
    if (scopeRadios && scopeRadios.length) {
      for (let i = 0; i < scopeRadios.length; i++) {
        if (scopeRadios[i].checked) return scopeRadios[i].value
      }
    }
    return 'currentWindow'
  }

  function getSearchScope () {
    if (searchScopeRadios && searchScopeRadios.length) {
      for (let i = 0; i < searchScopeRadios.length; i++) {
        if (searchScopeRadios[i].checked) return searchScopeRadios[i].value
      }
    }
    return SEARCH_SCOPE_TAB_INFO
  }

  // [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] Focus window and tab on click (ids line clickable)
  function focusWindowAndTab (windowId, tabId) {
    const w = Number(windowId)
    const t = Number(tabId)
    if (Number.isNaN(w) || Number.isNaN(t)) return
    const apiTabs = chromeTabs || (typeof chrome !== 'undefined' && chrome.tabs ? chrome.tabs : null) || (typeof browser !== 'undefined' && browser.tabs ? browser.tabs : null)
    const apiWindows = chromeWindows || (typeof chrome !== 'undefined' && chrome.windows ? chrome.windows : null) || (typeof browser !== 'undefined' && browser.windows ? browser.windows : null)
    if (apiWindows && typeof apiWindows.update === 'function') {
      apiWindows.update(w, { focused: true }).catch(() => {})
    }
    if (apiTabs && typeof apiTabs.update === 'function') {
      apiTabs.update(t, { active: true }).catch(() => {})
    }
  }

  function renderList () {
    if (!listEl) return
    listEl.innerHTML = ''
    visibleTabs.forEach((tab) => {
      const card = document.createElement('div')
      card.className = 'browser-tabs-card'
      const windowId = tab.windowId != null ? String(tab.windowId) : ''
      const tabId = tab.id != null ? String(tab.id) : ''
      const idsDisplay = `Window ${escapeHtml(windowId)} · Tab ${escapeHtml(tabId)}`
      const hasValidIds = windowId !== '' && tabId !== ''
      const tagsArr = Array.isArray(tab.bookmarkTags) ? tab.bookmarkTags : []
      const tagsDisplay = tagsArr.length > 0 ? escapeHtml(tagsArr.join(', ')) : '—'
      const idsMarkup = hasValidIds
        ? `<button type="button" class="browser-tabs-card-ids browser-tabs-card-ids-link" data-window-id="${escapeHtml(windowId)}" data-tab-id="${escapeHtml(tabId)}">${idsDisplay}</button>`
        : `<div class="browser-tabs-card-ids">${idsDisplay}</div>`
      card.innerHTML = `
        <div class="browser-tabs-card-title">${escapeHtml(tab.title || '(no title)')}</div>
        <div class="browser-tabs-card-url">${escapeHtml(tab.url || '')}</div>
        <div class="browser-tabs-card-referrer">${escapeHtml(getReferrerDisplayText(tab.referrer))}</div>
        ${idsMarkup}
        <div class="browser-tabs-card-tags">Tags: ${tagsDisplay}</div>
      `
      listEl.appendChild(card)
    })
  }

  function applyFilter () {
    const query = filterInput ? filterInput.value : ''
    searchScope = getSearchScope()
    visibleTabs = filterBrowserTabs(allTabs, query, searchScope)
    renderList()
  }

  function setFilterPlaceholder () {
    if (!filterInput) return
    if (searchScope === SEARCH_SCOPE_PAGE_TEXT) filterInput.placeholder = 'Filter by page text…'
    else if (searchScope === SEARCH_SCOPE_IMPORTANT_TAGS) filterInput.placeholder = 'Filter by headings, alt, meta…'
    else filterInput.placeholder = 'Filter by title, URL, referrer…'
  }

  // [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] Fetch page text or important tags from SW and merge into allTabs; show loading state.
  async function loadExtraForScope () {
    const scope = getSearchScope()
    if (scope !== SEARCH_SCOPE_PAGE_TEXT && scope !== SEARCH_SCOPE_IMPORTANT_TAGS) return
    const runtime = typeof chrome !== 'undefined' && chrome.runtime ? chrome.runtime : (typeof browser !== 'undefined' && browser.runtime ? browser.runtime : null)
    if (!runtime || !runtime.sendMessage || allTabs.length === 0) return
    if (listEl) listEl.innerHTML = '<div class="browser-tabs-loading">Loading…</div>'
    const msgType = scope === SEARCH_SCOPE_PAGE_TEXT ? 'getTabsPageText' : 'getTabsImportantTags'
    const msg = { type: msgType, data: { tabs: allTabs.map((t) => ({ id: t.id, url: t.url })) } }
    try {
      const reply = await new Promise((resolve, reject) => {
        runtime.sendMessage(msg, (r) => { if (chrome.runtime?.lastError) reject(new Error(chrome.runtime.lastError?.message)); else resolve(r) })
      })
      const data = reply && typeof reply === 'object' && reply.success && reply.data && typeof reply.data === 'object' ? reply.data : {}
      for (let i = 0; i < allTabs.length; i++) {
        const id = allTabs[i].id
        if (scope === SEARCH_SCOPE_PAGE_TEXT) allTabs[i] = { ...allTabs[i], pageText: data[id] !== undefined ? data[id] : '' }
        else allTabs[i] = { ...allTabs[i], importantTags: data[id] !== undefined ? data[id] : '' }
      }
    } catch (_) {
      for (let i = 0; i < allTabs.length; i++) {
        if (scope === SEARCH_SCOPE_PAGE_TEXT) allTabs[i] = { ...allTabs[i], pageText: '' }
        else allTabs[i] = { ...allTabs[i], importantTags: '' }
      }
    }
    applyFilter()
  }

  async function loadTabs () {
    const api = chromeTabs || (typeof chrome !== 'undefined' && chrome.tabs ? chrome.tabs : null) || (typeof browser !== 'undefined' && browser.tabs ? browser.tabs : null)
    if (!api) return
    windowScope = getWindowScope()
    const runtime = typeof chrome !== 'undefined' && chrome.runtime ? chrome.runtime : (typeof browser !== 'undefined' && browser.runtime ? browser.runtime : null)
    try {
      const queryOpts = windowScope === 'currentWindow' ? { currentWindow: true } : {}
      const list = await api.query(queryOpts)
      // [REQ-SIDE_PANEL_BROWSER_TABS] Get referrers from service worker so executeScript runs in tab context (side panel context cannot inject into tabs).
      let referrersMap = /** @type {Record<number, string>} */ ({})
      if (typeof getReferrers === 'function') {
        referrersMap = await getReferrers(list) || {}
      } else if (runtime && runtime.sendMessage) {
        try {
          const msg = { type: 'getTabReferrers', data: { tabs: list.map((t) => ({ id: t.id, url: t.url })) } }
          const reply = await new Promise((resolve, reject) => {
            runtime.sendMessage(msg, (r) => { if (chrome.runtime?.lastError) reject(new Error(chrome.runtime.lastError?.message)); else resolve(r) })
          })
          const data = reply && typeof reply === 'object' && reply.success && reply.data && typeof reply.data === 'object' ? reply.data : {}
          referrersMap = data
        } catch (_) {
          referrersMap = {}
        }
      }
      const withReferrer = list.map((tab) => ({
        id: tab.id,
        windowId: tab.windowId,
        title: tab.title ?? '',
        url: tab.url ?? '',
        referrer: (tab.id != null && referrersMap[tab.id] !== undefined) ? referrersMap[tab.id] : ''
      }))
      allTabs = withReferrer
      // [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] Fetch bookmark tags per tab (same source as popup)
      if (runtime && typeof runtime.sendMessage === 'function') {
        try {
          await Promise.all(allTabs.map(async (tab) => {
            const url = (tab.url ?? '').trim()
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
              tab.bookmarkTags = []
              return
            }
            try {
              const reply = await new Promise((resolve, reject) => {
                runtime.sendMessage({ type: 'getCurrentBookmark', data: { url: tab.url, title: tab.title } }, (r) => {
                  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError?.message))
                  else resolve(r)
                })
              })
              tab.bookmarkTags = reply && reply.success && reply.data && Array.isArray(reply.data.tags) ? reply.data.tags : []
            } catch (_) {
              tab.bookmarkTags = []
            }
          }))
        } catch (_) {
          allTabs.forEach((t) => { t.bookmarkTags = t.bookmarkTags ?? [] })
        }
      } else {
        allTabs.forEach((t) => { t.bookmarkTags = [] })
      }
      searchScope = getSearchScope()
      setFilterPlaceholder()
      if (searchScope === SEARCH_SCOPE_PAGE_TEXT || searchScope === SEARCH_SCOPE_IMPORTANT_TAGS) {
        await loadExtraForScope()
      } else {
        visibleTabs = filterBrowserTabs(allTabs, filterInput ? filterInput.value : '', searchScope)
        renderList()
      }
    } catch (e) {
      if (listEl) listEl.innerHTML = `<div class="browser-tabs-error">Failed to load tabs: ${escapeHtml(String((e && e.message) || e))}</div>`
    }
  }

  function showMessage (text) {
    if (messageEl) {
      messageEl.textContent = text
      messageEl.classList.remove('hidden')
      if (messageEl.dataset) messageEl.dataset.visible = 'true'
      setTimeout(() => {
        messageEl.classList.add('hidden')
        if (messageEl.dataset) messageEl.dataset.visible = 'false'
      }, 3000)
    }
  }

  if (scopeRadios && scopeRadios.length) {
    for (let i = 0; i < scopeRadios.length; i++) {
      scopeRadios[i].addEventListener('change', () => {
        windowScope = getWindowScope()
        loadTabs()
      })
    }
  }

  // [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] On search-scope change: fetch page text or important tags if needed, then re-apply filter.
  if (searchScopeRadios && searchScopeRadios.length) {
    for (let i = 0; i < searchScopeRadios.length; i++) {
      searchScopeRadios[i].addEventListener('change', async () => {
        searchScope = getSearchScope()
        setFilterPlaceholder()
        if (searchScope === SEARCH_SCOPE_PAGE_TEXT || searchScope === SEARCH_SCOPE_IMPORTANT_TAGS) {
          await loadExtraForScope()
        } else {
          applyFilter()
        }
      })
    }
  }

  if (filterInput) {
    filterInput.addEventListener('input', applyFilter)
  }

  // [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] Delegated click: focus window and tab when ids line is clicked
  if (listEl) {
    listEl.addEventListener('click', (e) => {
      const btn = e.target && e.target.closest && e.target.closest('.browser-tabs-card-ids-link')
      if (!btn) return
      const windowId = btn.getAttribute('data-window-id')
      const tabId = btn.getAttribute('data-tab-id')
      if (windowId != null && tabId != null) focusWindowAndTab(windowId, tabId)
    })
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const urls = buildUrlListForCopy(visibleTabs)
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(urls)
          const count = visibleTabs.length
          showMessage(`Copied ${count} URL${count !== 1 ? 's' : ''}`)
        } else {
          showMessage('Clipboard not available')
        }
      } catch (_) {
        showMessage('Copy failed')
      }
    })
  }

  // [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] Copy Records: full tab records as YAML to clipboard
  if (copyRecordsBtn) {
    copyRecordsBtn.addEventListener('click', async () => {
      const yamlString = buildRecordsYamlForCopy(visibleTabs)
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(yamlString)
          const count = visibleTabs.length
          showMessage(`Copied ${count} record${count !== 1 ? 's' : ''}`)
        } else {
          showMessage('Clipboard not available')
        }
      } catch (_) {
        showMessage('Copy failed')
      }
    })
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', async () => {
      if (visibleTabs.length === 0) return
      if (!confirm(`Close ${visibleTabs.length} tab${visibleTabs.length !== 1 ? 's' : ''}?`)) return
      const api = (typeof chrome !== 'undefined' && chrome.tabs ? chrome.tabs : null) || (typeof browser !== 'undefined' && browser.tabs ? browser.tabs : null) || chromeTabs
      let closed = 0
      for (const tab of visibleTabs) {
        try {
          await api.remove(tab.id)
          closed++
        } catch (_) { /* skip */ }
      }
      showMessage(`Closed ${closed} tab${closed !== 1 ? 's' : ''}`)
      await loadTabs()
    })
  }

  // [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] Batch bookmark actions: set to-read (create if missing), clear to-read (skip if no bookmark), add tags (create if missing).
  const runtime = typeof chrome !== 'undefined' && chrome.runtime ? chrome.runtime : (typeof browser !== 'undefined' && browser.runtime ? browser.runtime : null)
  function sendMessage (msg) {
    if (!runtime || !runtime.sendMessage) return Promise.reject(new Error('No runtime'))
    return new Promise((resolve, reject) => {
      runtime.sendMessage(msg, (r) => {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError?.message))
        else resolve(r)
      })
    })
  }

  if (setToReadBtn) {
    setToReadBtn.addEventListener('click', async () => {
      if (visibleTabs.length === 0) return
      const buttons = [setToReadBtn, clearToReadBtn, addTagsBtn].filter(Boolean)
      buttons.forEach(b => { b.disabled = true })
      let ok = 0
      for (const tab of visibleTabs) {
        const tabUrl = (tab.url ?? '').trim()
        if (!tabUrl.startsWith('http://') && !tabUrl.startsWith('https://')) continue
        try {
          const reply = await sendMessage({ type: 'getCurrentBookmark', data: { url: tabUrl, title: tab.title } })
          if (!reply || !reply.success || !reply.data || reply.data.blocked) continue
          if (reply.data.exists && reply.data.url) {
            // [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] Preserve existing tags (and other fields); API may replace bookmark if we only send toread.
            const res = await sendMessage({
              type: 'saveBookmark',
              data: { ...reply.data, toread: 'yes' }
            })
            if (res && res.success) ok++
          } else {
            const urlToSave = (reply.data && reply.data.url) || tabUrl
            if (!urlToSave) continue
            const res = await sendMessage({
              type: 'saveBookmark',
              data: {
                url: urlToSave,
                description: (tab.title ?? '').trim() || urlToSave,
                tags: [],
                toread: 'yes',
                preferredBackend: 'local'
              }
            })
            if (res && res.success) ok++
          }
        } catch (_) { /* skip */ }
      }
      buttons.forEach(b => { b.disabled = false })
      showMessage(`Set to-read for ${ok} tab${ok !== 1 ? 's' : ''}`)
    })
  }

  if (clearToReadBtn) {
    clearToReadBtn.addEventListener('click', async () => {
      if (visibleTabs.length === 0) return
      const buttons = [setToReadBtn, clearToReadBtn, addTagsBtn].filter(Boolean)
      buttons.forEach(b => { b.disabled = true })
      let ok = 0
      for (const tab of visibleTabs) {
        try {
          const reply = await sendMessage({ type: 'getCurrentBookmark', data: { url: tab.url, title: tab.title } })
          if (reply && reply.success && reply.data && !reply.data.blocked && reply.data.exists) {
            const res = await sendMessage({
              type: 'saveBookmark',
              data: { ...reply.data, toread: 'no' }
            })
            if (res && res.success) ok++
          }
        } catch (_) { /* skip */ }
      }
      buttons.forEach(b => { b.disabled = false })
      showMessage(`Cleared to-read for ${ok} tab${ok !== 1 ? 's' : ''}`)
    })
  }

  if (addTagsBtn && tagsInput) {
    addTagsBtn.addEventListener('click', async () => {
      const newTags = parseTagsInput(tagsInput.value)
      if (newTags.length === 0) return
      if (visibleTabs.length === 0) return
      const buttons = [setToReadBtn, clearToReadBtn, addTagsBtn].filter(Boolean)
      buttons.forEach(b => { b.disabled = true })
      let ok = 0
      for (const tab of visibleTabs) {
        const tabUrl = (tab.url ?? '').trim()
        if (!tabUrl.startsWith('http://') && !tabUrl.startsWith('https://')) continue
        try {
          const reply = await sendMessage({ type: 'getCurrentBookmark', data: { url: tabUrl, title: tab.title } })
          if (reply && reply.success && reply.data && !reply.data.blocked && reply.data.url) {
            if (reply.data.exists) {
              const payload = buildAddTagsPayload(reply.data, newTags)
              if (payload) {
                const res = await sendMessage({ type: 'saveBookmark', data: payload })
                if (res && res.success) ok++
              }
            } else {
              // [REQ-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS] Use reply.data.url so we never send empty url (handler resolves targetUrl; tab.url may be empty for some tabs).
              const urlToSave = (reply.data && reply.data.url) || tabUrl
              if (!urlToSave) continue
              const res = await sendMessage({
                type: 'saveBookmark',
                data: {
                  url: urlToSave,
                  description: (tab.title ?? '').trim() || urlToSave,
                  tags: newTags,
                  preferredBackend: 'local'
                }
              })
              if (res && res.success) ok++
            }
          }
        } catch (e) {
          // ignore per-tab errors
        }
      }
      buttons.forEach(b => { b.disabled = false })
      tagsInput.value = ''
      showMessage(`Added tags for ${ok} tab${ok !== 1 ? 's' : ''}`)
    })
  }

  loadTabs()
}

function escapeHtml (s) {
  const div = typeof document !== 'undefined' && document.createElement ? document.createElement('div') : null
  if (div) {
    div.textContent = s
    return div.innerHTML
  }
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
