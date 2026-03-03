/**
 * [IMPL-BOOKMARK_USAGE_TRACKING] [ARCH-BOOKMARK_USAGE_TRACKING] [REQ-BOOKMARK_USAGE_TRACKING]
 * Tracks visit frequency/recency and referrer-based navigation edges for bookmarked URLs.
 * All data stored in chrome.storage.local; no external collection.
 */

import { debugLog, debugError } from '../../shared/utils.js'

const STORAGE_KEY_USAGE = 'hoverboard_bookmark_usage'
const STORAGE_KEY_EDGES = 'hoverboard_bookmark_nav_edges'
const RECENT_VISITS_CAP = 10
const DEBOUNCE_MS = 60000

/**
 * [IMPL-BOOKMARK_USAGE_TRACKING] Normalize URL for storage key (match bookmark-router cleanUrl).
 * @param {string} url
 * @returns {string}
 */
function cleanUrl (url) {
  if (!url || typeof url !== 'string') return ''
  return url.trim().replace(/\/+$/, '')
}

/**
 * @typedef {{ url: string, visitCount: number, lastVisitedAt: string, firstVisitedAt: string, recentVisits: string[] }} UsageRecord
 * @typedef {{ sourceUrl: string, targetUrl: string, count: number, lastTraversedAt: string, firstTraversedAt: string }} NavigationEdge
 */

export class BookmarkUsageTracker {
  constructor (storage = null) {
    this._storage = storage || (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local ? chrome.storage.local : null)
    /** @type {Record<string, number>} In-memory debounce: url -> last recorded timestamp */
    this._lastRecordedVisit = {}
  }

  /**
   * [IMPL-BOOKMARK_USAGE_TRACKING] Record a visit to a bookmarked URL; optionally record referrer as navigation edge.
   * Debounced per URL (DEBOUNCE_MS). Referrer is only stored if non-empty, different from url, and http(s).
   * @param {string} url - Visited URL (bookmarked)
   * @param {string} [referrer] - document.referrer (optional)
   */
  async recordVisit (url, referrer = '') {
    const key = cleanUrl(url)
    if (!key) {
      debugLog('[IMPL-BOOKMARK_USAGE_TRACKING] recordVisit: empty url, skip')
      return
    }
    const now = new Date().toISOString()
    const last = this._lastRecordedVisit[key]
    if (last != null && (Date.now() - last) < DEBOUNCE_MS) {
      debugLog('[IMPL-BOOKMARK_USAGE_TRACKING] recordVisit: debounced', key)
      return
    }
    this._lastRecordedVisit[key] = Date.now()

    try {
      const result = await this._storage.get([STORAGE_KEY_USAGE, STORAGE_KEY_EDGES])
      const usageMap = result[STORAGE_KEY_USAGE] && typeof result[STORAGE_KEY_USAGE] === 'object' && !Array.isArray(result[STORAGE_KEY_USAGE])
        ? { ...result[STORAGE_KEY_USAGE] }
        : {}
      const edgesMap = result[STORAGE_KEY_EDGES] && typeof result[STORAGE_KEY_EDGES] === 'object' && !Array.isArray(result[STORAGE_KEY_EDGES])
        ? { ...result[STORAGE_KEY_EDGES] }
        : {}

      const existing = usageMap[key]
      const visitCount = (existing?.visitCount ?? 0) + 1
      const firstVisitedAt = existing?.firstVisitedAt || now
      const recentVisits = [now, ...(existing?.recentVisits || [])].slice(0, RECENT_VISITS_CAP)
      usageMap[key] = {
        url: key,
        visitCount,
        lastVisitedAt: now,
        firstVisitedAt,
        recentVisits
      }
      await this._storage.set({ [STORAGE_KEY_USAGE]: usageMap })

      const ref = cleanUrl(referrer)
      if (ref && ref !== key && /^https?:\/\//i.test(ref)) {
        const targetEdges = Array.isArray(edgesMap[key]) ? [...edgesMap[key]] : []
        const idx = targetEdges.findIndex(e => e.sourceUrl === ref)
        const nowEdge = { sourceUrl: ref, targetUrl: key, lastTraversedAt: now, firstTraversedAt: '', count: 1 }
        if (idx >= 0) {
          const e = targetEdges[idx]
          nowEdge.count = (e.count || 0) + 1
          nowEdge.firstTraversedAt = e.firstTraversedAt || now
          targetEdges[idx] = nowEdge
        } else {
          nowEdge.firstTraversedAt = now
          targetEdges.push(nowEdge)
        }
        edgesMap[key] = targetEdges
        await this._storage.set({ [STORAGE_KEY_EDGES]: edgesMap })
        debugLog('[IMPL-BOOKMARK_USAGE_TRACKING] recordVisit: edge', ref, '->', key)
      }
    } catch (e) {
      debugError('[IMPL-BOOKMARK_USAGE_TRACKING] recordVisit failed:', e)
    }
  }

  /**
   * [IMPL-BOOKMARK_USAGE_TRACKING] Get usage record for a single URL.
   * @param {string} url
   * @returns {Promise<UsageRecord | null>}
   */
  async getUsage (url) {
    const key = cleanUrl(url)
    if (!key) return null
    try {
      const result = await this._storage.get(STORAGE_KEY_USAGE)
      const map = result[STORAGE_KEY_USAGE]
      const raw = map && map[key]
      return raw ? this._normalizeUsage(raw, key) : null
    } catch (e) {
      debugError('[IMPL-BOOKMARK_USAGE_TRACKING] getUsage failed:', e)
      return null
    }
  }

  /**
   * [IMPL-BOOKMARK_USAGE_TRACKING] Get all usage records.
   * @returns {Promise<UsageRecord[]>}
   */
  async getAllUsage () {
    try {
      const result = await this._storage.get(STORAGE_KEY_USAGE)
      const map = result[STORAGE_KEY_USAGE]
      if (!map || typeof map !== 'object' || Array.isArray(map)) return []
      return Object.entries(map).map(([u, r]) => this._normalizeUsage(r, u))
    } catch (e) {
      debugError('[IMPL-BOOKMARK_USAGE_TRACKING] getAllUsage failed:', e)
      return []
    }
  }

  /**
   * [IMPL-BOOKMARK_USAGE_TRACKING] Top N by visit count.
   * @param {number} n
   * @returns {Promise<UsageRecord[]>}
   */
  async getMostFrequent (n = 10) {
    const all = await this.getAllUsage()
    return all.sort((a, b) => (b.visitCount || 0) - (a.visitCount || 0)).slice(0, n)
  }

  /**
   * [IMPL-BOOKMARK_USAGE_TRACKING] Top N by last visited (most recent first).
   * @param {number} n
   * @returns {Promise<UsageRecord[]>}
   */
  async getMostRecent (n = 10) {
    const all = await this.getAllUsage()
    return all
      .filter(r => r.lastVisitedAt)
      .sort((a, b) => (b.lastVisitedAt || '').localeCompare(a.lastVisitedAt || ''))
      .slice(0, n)
  }

  /**
   * [IMPL-BOOKMARK_USAGE_TRACKING] Edges whose target is this URL (who referred to this page).
   * @param {string} url
   * @returns {Promise<NavigationEdge[]>}
   */
  async getInboundLinks (url) {
    const key = cleanUrl(url)
    if (!key) return []
    try {
      const result = await this._storage.get(STORAGE_KEY_EDGES)
      const map = result[STORAGE_KEY_EDGES]
      const edges = map && map[key] && Array.isArray(map[key]) ? map[key] : []
      return edges.map(e => ({
        sourceUrl: e.sourceUrl || '',
        targetUrl: e.targetUrl || key,
        count: e.count ?? 0,
        lastTraversedAt: e.lastTraversedAt || '',
        firstTraversedAt: e.firstTraversedAt || ''
      }))
    } catch (e) {
      debugError('[IMPL-BOOKMARK_USAGE_TRACKING] getInboundLinks failed:', e)
      return []
    }
  }

  /**
   * [IMPL-BOOKMARK_USAGE_TRACKING] Edges whose source is this URL (pages this URL referred to).
   * @param {string} url
   * @returns {Promise<NavigationEdge[]>}
   */
  async getOutboundLinks (url) {
    const key = cleanUrl(url)
    if (!key) return []
    try {
      const result = await this._storage.get(STORAGE_KEY_EDGES)
      const map = result[STORAGE_KEY_EDGES]
      if (!map || typeof map !== 'object' || Array.isArray(map)) return []
      const out = []
      for (const [target, edges] of Object.entries(map)) {
        if (!Array.isArray(edges)) continue
        for (const e of edges) {
          if (e.sourceUrl === key) {
            out.push({
              sourceUrl: key,
              targetUrl: e.targetUrl || target,
              count: e.count ?? 0,
              lastTraversedAt: e.lastTraversedAt || '',
              firstTraversedAt: e.firstTraversedAt || ''
            })
          }
        }
      }
      return out
    } catch (e) {
      debugError('[IMPL-BOOKMARK_USAGE_TRACKING] getOutboundLinks failed:', e)
      return []
    }
  }

  /**
   * [IMPL-BOOKMARK_USAGE_TRACKING] Full list of navigation edges for graph visualization.
   * @returns {Promise<NavigationEdge[]>}
   */
  async getNavigationGraph () {
    try {
      const result = await this._storage.get(STORAGE_KEY_EDGES)
      const map = result[STORAGE_KEY_EDGES]
      if (!map || typeof map !== 'object' || Array.isArray(map)) return []
      const out = []
      for (const [targetUrl, edges] of Object.entries(map)) {
        if (!Array.isArray(edges)) continue
        for (const e of edges) {
          out.push({
            sourceUrl: e.sourceUrl || '',
            targetUrl: e.targetUrl || targetUrl,
            count: e.count ?? 0,
            lastTraversedAt: e.lastTraversedAt || '',
            firstTraversedAt: e.firstTraversedAt || ''
          })
        }
      }
      return out
    } catch (e) {
      debugError('[IMPL-BOOKMARK_USAGE_TRACKING] getNavigationGraph failed:', e)
      return []
    }
  }

  /**
   * [IMPL-BOOKMARK_USAGE_TRACKING] Remove usage and all edges for a URL (e.g. on bookmark delete).
   * @param {string} url
   */
  async clearUsage (url) {
    const key = cleanUrl(url)
    if (!key) return
    try {
      delete this._lastRecordedVisit[key]
      const result = await this._storage.get([STORAGE_KEY_USAGE, STORAGE_KEY_EDGES])
      const usageMap = result[STORAGE_KEY_USAGE] && typeof result[STORAGE_KEY_USAGE] === 'object' && !Array.isArray(result[STORAGE_KEY_USAGE])
        ? { ...result[STORAGE_KEY_USAGE] }
        : {}
      const edgesMap = result[STORAGE_KEY_EDGES] && typeof result[STORAGE_KEY_EDGES] === 'object' && !Array.isArray(result[STORAGE_KEY_EDGES])
        ? { ...result[STORAGE_KEY_EDGES] }
        : {}
      delete usageMap[key]
      delete edgesMap[key]
      for (const target of Object.keys(edgesMap)) {
        const edges = edgesMap[target]
        if (Array.isArray(edges)) {
          const filtered = edges.filter(e => e.sourceUrl !== key)
          if (filtered.length === 0) delete edgesMap[target]
          else edgesMap[target] = filtered
        }
      }
      await this._storage.set({ [STORAGE_KEY_USAGE]: usageMap, [STORAGE_KEY_EDGES]: edgesMap })
    } catch (e) {
      debugError('[IMPL-BOOKMARK_USAGE_TRACKING] clearUsage failed:', e)
    }
  }

  /**
   * @param {Record<string, unknown>} r
   * @param {string} url
   * @returns {UsageRecord}
   */
  _normalizeUsage (r, url) {
    const recent = Array.isArray(r.recentVisits) ? r.recentVisits : []
    return {
      url: r.url || url,
      visitCount: typeof r.visitCount === 'number' ? r.visitCount : 0,
      lastVisitedAt: typeof r.lastVisitedAt === 'string' ? r.lastVisitedAt : '',
      firstVisitedAt: typeof r.firstVisitedAt === 'string' ? r.firstVisitedAt : '',
      recentVisits: recent.filter(x => typeof x === 'string')
    }
  }
}
