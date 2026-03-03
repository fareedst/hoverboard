/**
 * [IMPL-BOOKMARK_USAGE_TRACKING_UI] [ARCH-BOOKMARK_USAGE_TRACKING_UI] [REQ-BOOKMARK_USAGE_TRACKING]
 * Usage side-panel tab: Most Visited, Recently Visited, Navigation Graph. Fetches via getBookmarkUsageStats and getBookmarkNavigationGraph.
 */

const MESSAGE_GET_STATS = 'getBookmarkUsageStats'
const MESSAGE_GET_GRAPH = 'getBookmarkNavigationGraph'
const DEFAULT_TOP_N = 10
const GRAPH_TOP_EDGES = 20

/**
 * [IMPL-BOOKMARK_USAGE_TRACKING_UI] [ARCH-BOOKMARK_USAGE_TRACKING_UI] [REQ-BOOKMARK_USAGE_TRACKING]
 * Build display list for "Most Visited" section from getBookmarkUsageStats response (mostFrequent array).
 * @param {{ mostFrequent?: { url: string, visitCount: number, lastVisitedAt: string }[] }} stats
 * @returns {{ url: string, visitCount: number, lastVisitedAt: string }[]}
 */
export function buildMostVisitedList (stats) {
  const list = stats && Array.isArray(stats.mostFrequent) ? stats.mostFrequent : []
  return list.map((u) => ({
    url: u.url || '',
    visitCount: u.visitCount ?? 0,
    lastVisitedAt: u.lastVisitedAt || ''
  }))
}

/**
 * [IMPL-BOOKMARK_USAGE_TRACKING_UI] [ARCH-BOOKMARK_USAGE_TRACKING_UI] [REQ-BOOKMARK_USAGE_TRACKING]
 * Build display list for "Recently Visited" section from getBookmarkUsageStats response (mostRecent array).
 * @param {{ mostRecent?: { url: string, visitCount: number, lastVisitedAt: string }[] }} stats
 * @returns {{ url: string, visitCount: number, lastVisitedAt: string }[]}
 */
export function buildRecentlyVisitedList (stats) {
  const list = stats && Array.isArray(stats.mostRecent) ? stats.mostRecent : []
  return list.map((u) => ({
    url: u.url || '',
    visitCount: u.visitCount ?? 0,
    lastVisitedAt: u.lastVisitedAt || ''
  }))
}

/**
 * [IMPL-BOOKMARK_USAGE_TRACKING_UI] [ARCH-BOOKMARK_USAGE_TRACKING_UI] [REQ-BOOKMARK_USAGE_TRACKING]
 * Group navigation edges by sourceUrl for display. Returns array of { sourceUrl, edges: { targetUrl, count }[] }, sorted by total count descending.
 * @param {{ sourceUrl: string, targetUrl: string, count: number }[]} edges
 * @param {{ limit?: number }} options - limit number of edge groups (default all)
 * @returns {{ sourceUrl: string, edges: { targetUrl: string, count: number }[] }[]}
 */
export function buildNavigationGraphGroups (edges, options = {}) {
  const limit = options.limit != null ? options.limit : undefined
  if (!Array.isArray(edges) || edges.length === 0) return []
  const bySource = new Map()
  for (const e of edges) {
    const src = e.sourceUrl || ''
    const tgt = e.targetUrl || ''
    const count = e.count ?? 0
    if (!src || !tgt) continue
    if (!bySource.has(src)) bySource.set(src, [])
    bySource.get(src).push({ targetUrl: tgt, count })
  }
  const groups = []
  for (const [sourceUrl, list] of bySource) {
    list.sort((a, b) => (b.count - a.count))
    groups.push({ sourceUrl, edges: list })
  }
  groups.sort((a, b) => {
    const sumA = a.edges.reduce((s, x) => s + x.count, 0)
    const sumB = b.edges.reduce((s, x) => s + x.count, 0)
    return sumB - sumA
  })
  if (limit != null && limit > 0) return groups.slice(0, limit)
  return groups
}

/**
 * [IMPL-BOOKMARK_USAGE_TRACKING_UI] [ARCH-BOOKMARK_USAGE_TRACKING_UI] [REQ-BOOKMARK_USAGE_TRACKING]
 * Initialize the Usage tab: fetch stats and graph, render three sections, bind Refresh.
 * @param {{ panelEl: HTMLElement, sendMessage: (msg: object) => Promise<object> }} options
 */
export function initUsageTab (options = {}) {
  const panelEl = options.panelEl || document.getElementById('usagePanel')
  const sendMessage = options.sendMessage || defaultSendMessage
  if (!panelEl) return

  const refreshBtn = panelEl.querySelector('[data-usage-refresh]')
  const mostVisitedEl = panelEl.querySelector('[data-usage-most-visited]')
  const recentlyVisitedEl = panelEl.querySelector('[data-usage-recently-visited]')
  const graphEl = panelEl.querySelector('[data-usage-graph]')

  async function load () {
    try {
      const [statsRes, graphRes] = await Promise.all([
        sendMessage({ type: MESSAGE_GET_STATS, data: { n: DEFAULT_TOP_N } }),
        sendMessage({ type: MESSAGE_GET_GRAPH })
      ])
      const stats = statsRes && statsRes.success && statsRes.data ? statsRes.data : { mostFrequent: [], mostRecent: [] }
      const edges = graphRes && graphRes.success && Array.isArray(graphRes.data) ? graphRes.data : []
      if (mostVisitedEl) {
        const list = buildMostVisitedList(stats)
        mostVisitedEl.innerHTML = list.length === 0
          ? '<p class="usage-empty">No visit data yet.</p>'
          : list.map((u, i) => `<div class="usage-row"><span class="usage-rank">${i + 1}.</span> <a href="${escapeAttr(u.url)}" target="_blank" rel="noopener" class="usage-link">${escapeText(shortUrl(u.url))}</a> <span class="usage-meta">${u.visitCount} visits</span></div>`).join('')
      }
      if (recentlyVisitedEl) {
        const list = buildRecentlyVisitedList(stats)
        recentlyVisitedEl.innerHTML = list.length === 0
          ? '<p class="usage-empty">No visit data yet.</p>'
          : list.map((u, i) => `<div class="usage-row"><span class="usage-rank">${i + 1}.</span> <a href="${escapeAttr(u.url)}" target="_blank" rel="noopener" class="usage-link">${escapeText(shortUrl(u.url))}</a> <span class="usage-meta">${u.visitCount} visits</span></div>`).join('')
      }
      if (graphEl) {
        const groups = buildNavigationGraphGroups(edges, { limit: GRAPH_TOP_EDGES })
        graphEl.innerHTML = groups.length === 0
          ? '<p class="usage-empty">No referrer data yet.</p>'
          : groups.map((g) => `<div class="usage-graph-group"><div class="usage-graph-source">${escapeText(shortUrl(g.sourceUrl))}</div>${g.edges.map((e) => `<div class="usage-graph-edge">→ <a href="${escapeAttr(e.targetUrl)}" target="_blank" rel="noopener" class="usage-link">${escapeText(shortUrl(e.targetUrl))}</a> <span class="usage-meta">(${e.count}×)</span></div>`).join('')}</div>`).join('')
      }
    } catch (err) {
      if (mostVisitedEl) mostVisitedEl.innerHTML = '<p class="usage-error">Failed to load usage data.</p>'
      if (recentlyVisitedEl) recentlyVisitedEl.innerHTML = ''
      if (graphEl) graphEl.innerHTML = ''
    }
  }

  if (refreshBtn) refreshBtn.addEventListener('click', () => load())
  load()
}

function defaultSendMessage (msg) {
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(msg, (res) => {
        if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message))
        else resolve(res || {})
      })
    })
  }
  return Promise.resolve({})
}

function escapeAttr (str) {
  if (str == null) return ''
  const s = String(str)
  const div = document.createElement('div')
  div.textContent = s
  return div.innerHTML.replace(/"/g, '&quot;')
}

function escapeText (str) {
  if (str == null) return ''
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

function shortUrl (url) {
  if (!url || typeof url !== 'string') return ''
  try {
    const u = new URL(url)
    return u.hostname + (u.pathname && u.pathname !== '/' ? u.pathname.slice(0, 40) + (u.pathname.length > 40 ? '…' : '') : '')
  } catch (_) {
    return url.slice(0, 50) + (url.length > 50 ? '…' : '')
  }
}
