/**
 * [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-RECENT_TAGS_SYSTEM]
 * User-driven recent tags: shared across windows, persisted across service-worker restarts,
 * N-minute rolling window and N-minute Hoverboard inactivity expiry ([spec] side-panel-this-page order 4).
 */

export const RECENT_TAGS_USER_STATE_KEY = 'hoverboard_user_recent_tags_state_v2'

/**
 * Apply idle timeout (no Hoverboard activity for windowMs) and per-tag age (lastUsed within windowMs).
 * @param {Array<{ name: string, lastUsed: string, count?: number, addedFromSite?: string }>} tags
 * @param {number|null} lastActivityAt - ms since epoch; last tag-related Hoverboard activity
 * @param {number} nowMs
 * @param {number} windowMs - N minutes as ms (same N for idle and tag age per product rules)
 * @returns {{ tags: typeof tags, lastActivityAt: number|null, mutated: boolean }}
 */
export function applyRecentTagsIdleAndAge (tags, lastActivityAt, nowMs, windowMs) {
  if (lastActivityAt != null && nowMs - lastActivityAt > windowMs) {
    return { tags: [], lastActivityAt: null, mutated: tags.length > 0 || lastActivityAt != null }
  }
  const cutoff = nowMs - windowMs
  const kept = tags.filter((t) => {
    const tms = new Date(t.lastUsed).getTime()
    return !Number.isNaN(tms) && tms >= cutoff
  })
  return {
    tags: kept,
    lastActivityAt,
    mutated: kept.length !== tags.length
  }
}

function inferLastActivityFromTags (tags) {
  let max = 0
  for (const t of tags) {
    const ms = new Date(t.lastUsed).getTime()
    if (!Number.isNaN(ms) && ms > max) max = ms
  }
  return max > 0 ? max : null
}

/**
 * [IMMUTABLE-REQ-TAG-003] Recent tags: in-memory + chrome.storage.local; cross-window; SW-safe.
 */
export class RecentTagsMemoryManager {
  constructor () {
    this.recentTags = []
    this.maxListSize = 50
    /** @type {string|null} */
    this.lastUpdated = null
    /** @type {number|null} last Hoverboard tag activity (add to recent / bookmark tag save path) */
    this.lastActivityAt = null
    this._hydrated = false
    this._persistScheduled = false
  }

  _storageLocal () {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        return chrome.storage.local
      }
    } catch (_) {}
    return null
  }

  async hydrate () {
    if (this._hydrated) return
    const api = this._storageLocal()
    if (!api || typeof api.get !== 'function') {
      this._hydrated = true
      return
    }
    try {
      const data = await new Promise((resolve, reject) => {
        try {
          api.get([RECENT_TAGS_USER_STATE_KEY], (r) => {
            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message))
              return
            }
            resolve(r)
          })
        } catch (e) {
          reject(e)
        }
      })
      const row = data && data[RECENT_TAGS_USER_STATE_KEY]
      if (row && Array.isArray(row.tags)) {
        this.recentTags = row.tags.filter((t) => t && typeof t.name === 'string' && t.lastUsed)
        if (typeof row.lastActivityAt === 'number' && !Number.isNaN(row.lastActivityAt)) {
          this.lastActivityAt = row.lastActivityAt
        } else {
          this.lastActivityAt = inferLastActivityFromTags(this.recentTags)
        }
        this.lastUpdated = this.recentTags[0]?.lastUsed ?? null
      }
    } catch (e) {
      console.error('[IMMUTABLE-REQ-TAG-003] hydrate recent tags failed:', e)
    }
    this._hydrated = true
  }

  _enqueuePersist () {
    if (this._persistScheduled) return
    this._persistScheduled = true
    queueMicrotask(() => {
      this._persistScheduled = false
      this._flushPersist().catch((e) => console.error('[IMMUTABLE-REQ-TAG-003] persist failed:', e))
    })
  }

  async _flushPersist () {
    const api = this._storageLocal()
    if (!api || typeof api.set !== 'function') return
    const payload = {
      tags: this.recentTags,
      lastActivityAt: this.lastActivityAt
    }
    await new Promise((resolve, reject) => {
      try {
        api.set({ [RECENT_TAGS_USER_STATE_KEY]: payload }, () => {
          if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message))
            return
          }
          resolve(undefined)
        })
      } catch (e) {
        reject(e)
      }
    })
  }

  /**
   * Raw list (no TTL). Prefer getRecentTagsForUi for popup/side panel.
   */
  getRecentTags () {
    return [...this.recentTags]
  }

  /**
   * [REQ-RECENT_TAGS_SYSTEM] Load from storage, drop idle-expired and stale-by-lastUsed tags, persist if mutated.
   * @param {() => Promise<Record<string, unknown>>} getConfig
   * @returns {Promise<Array<{ name: string, lastUsed: string, count?: number, addedFromSite?: string }>>}
   */
  async getRecentTagsForUi (getConfig) {
    await this.hydrate()
    const config = await getConfig()
    const nMin = typeof config.recentTagsActivityWindowMinutes === 'number' && config.recentTagsActivityWindowMinutes > 0
      ? config.recentTagsActivityWindowMinutes
      : 15
    const windowMs = nMin * 60 * 1000
    const now = Date.now()

    const { tags, lastActivityAt, mutated } = applyRecentTagsIdleAndAge(
      this.recentTags,
      this.lastActivityAt,
      now,
      windowMs
    )
    if (mutated) {
      this.recentTags = tags
      this.lastActivityAt = lastActivityAt
      this.lastUpdated = tags[0]?.lastUsed ?? null
      await this._flushPersist()
    }

    const sorted = [...this.recentTags].sort((a, b) => {
      const dateA = new Date(a.lastUsed)
      const dateB = new Date(b.lastUsed)
      return dateB - dateA
    })
    return sorted
  }

  addTag (tagName, currentSiteUrl) {
    try {
      if (!tagName || !currentSiteUrl) {
        console.error('[IMMUTABLE-REQ-TAG-003] Invalid parameters for addTag:', { tagName, currentSiteUrl })
        return false
      }

      const now = new Date()
      const nowMs = now.getTime()

      const existingTagIndex = this.recentTags.findIndex((tag) => tag.name === tagName)

      if (existingTagIndex >= 0) {
        this.recentTags[existingTagIndex] = {
          ...this.recentTags[existingTagIndex],
          count: (this.recentTags[existingTagIndex].count || 0) + 1,
          lastUsed: now.toISOString()
        }
      } else {
        const newTag = {
          name: tagName,
          count: 1,
          lastUsed: now.toISOString(),
          addedFromSite: currentSiteUrl
        }
        this.recentTags.push(newTag)
      }

      this.recentTags.sort((a, b) => {
        const dateA = new Date(a.lastUsed)
        const dateB = new Date(b.lastUsed)
        return dateB - dateA
      })

      if (this.recentTags.length > this.maxListSize) {
        this.recentTags = this.recentTags.slice(0, this.maxListSize)
      }

      this.lastUpdated = now.toISOString()
      this.lastActivityAt = nowMs
      this._hydrated = true

      console.log('[IMMUTABLE-REQ-TAG-003] Successfully added tag to shared memory:', { tagName, currentSiteUrl })
      this._enqueuePersist()
      return true
    } catch (error) {
      console.error('[IMMUTABLE-REQ-TAG-003] Error adding tag to shared memory:', error)
      return false
    }
  }

  async clearRecentTags () {
    this.recentTags = []
    this.lastUpdated = null
    this.lastActivityAt = null
    this._hydrated = true
    console.log('[IMMUTABLE-REQ-TAG-003] Cleared recent tags from shared memory')
    const api = this._storageLocal()
    if (api && typeof api.remove === 'function') {
      try {
        await new Promise((resolve, reject) => {
          api.remove([RECENT_TAGS_USER_STATE_KEY], () => {
            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message))
              return
            }
            resolve(undefined)
          })
        })
      } catch (e) {
        console.error('[IMMUTABLE-REQ-TAG-003] clearRecentTags storage.remove failed:', e)
      }
    }
  }

  getMemoryStatus () {
    return {
      tagCount: this.recentTags.length,
      maxListSize: this.maxListSize,
      lastUpdated: this.lastUpdated,
      lastActivityAt: this.lastActivityAt,
      tags: this.recentTags.map((tag) => ({
        name: tag.name,
        count: tag.count,
        lastUsed: tag.lastUsed
      }))
    }
  }
}
