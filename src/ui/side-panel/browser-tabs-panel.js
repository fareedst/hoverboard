/**
 * [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS]
 * Browser tabs panel: pure filter and URL list helpers; init and render (load tabs, referrer, UI).
 */

/**
 * [REQ-SIDE_PANEL_BROWSER_TABS] [ARCH-SIDE_PANEL_BROWSER_TABS] [IMPL-SIDE_PANEL_BROWSER_TABS]
 * Filter tabs by query (case-insensitive substring on title, url, referrer). Empty/whitespace returns all.
 * @param {{ id: number, title?: string, url?: string, referrer?: string }[]} tabs
 * @param {string} query
 * @returns {{ id: number, title?: string, url?: string, referrer?: string }[]}
 */
export function filterBrowserTabs (tabs, query) {
  const q = (query == null ? '' : String(query)).trim().toLowerCase()
  if (q === '') return tabs
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
 */
export function initBrowserTabsTab (doc, chromeTabs, chromeScripting, getReferrers) {
  const document = doc || (typeof globalThis.document !== 'undefined' ? globalThis.document : null)
  if (!document) return
  const panel = document.getElementById('browserTabsPanel')
  if (!panel) return

  const filterInput = panel.querySelector('#browserTabsFilterInput')
  const listEl = panel.querySelector('#browserTabsList') || panel.querySelector('.browser-tabs-list')
  const copyBtn = panel.querySelector('[data-action="copyUrls"]') || panel.querySelector('#browserTabsCopyBtn')
  const closeBtn = panel.querySelector('[data-action="closeTabs"]') || panel.querySelector('#browserTabsCloseBtn')
  const messageEl = panel.querySelector('#browserTabsMessage')

  /** @type {{ id: number, title?: string, url?: string, referrer?: string }[]} */
  let allTabs = []
  /** @type {{ id: number, title?: string, url?: string, referrer?: string }[]} */
  let visibleTabs = []

  function renderList () {
    if (!listEl) return
    listEl.innerHTML = ''
    visibleTabs.forEach((tab) => {
      const card = document.createElement('div')
      card.className = 'browser-tabs-card'
      card.innerHTML = `
        <div class="browser-tabs-card-title">${escapeHtml(tab.title || '(no title)')}</div>
        <div class="browser-tabs-card-url">${escapeHtml(tab.url || '')}</div>
        <div class="browser-tabs-card-referrer">${escapeHtml(getReferrerDisplayText(tab.referrer))}</div>
      `
      listEl.appendChild(card)
    })
  }

  function applyFilter () {
    const query = filterInput ? filterInput.value : ''
    visibleTabs = filterBrowserTabs(allTabs, query)
    renderList()
  }

  async function loadTabs () {
    const api = chromeTabs || (typeof chrome !== 'undefined' && chrome.tabs ? chrome.tabs : null) || (typeof browser !== 'undefined' && browser.tabs ? browser.tabs : null)
    if (!api) return
    const runtime = typeof chrome !== 'undefined' && chrome.runtime ? chrome.runtime : (typeof browser !== 'undefined' && browser.runtime ? browser.runtime : null)
    try {
      const list = await api.query({})
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
        title: tab.title ?? '',
        url: tab.url ?? '',
        referrer: (tab.id != null && referrersMap[tab.id] !== undefined) ? referrersMap[tab.id] : ''
      }))
      allTabs = withReferrer
      visibleTabs = filterBrowserTabs(allTabs, filterInput ? filterInput.value : '')
      renderList()
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

  if (filterInput) {
    filterInput.addEventListener('input', applyFilter)
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
