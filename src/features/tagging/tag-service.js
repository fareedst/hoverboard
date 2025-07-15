/**
 * Tag Service - Modern tag management and caching system
 * Replaces legacy throttled_recent_tags.js with improved caching and suggestion algorithms
 */

import { ConfigManager } from '../../config/config-manager.js'
import { debugLog, debugError } from '../../shared/utils.js'

export class TagService {
  constructor (pinboardService = null) {
    // Only require PinboardService if not injected (avoids circular import)
    if (pinboardService) {
      this.pinboardService = pinboardService
    } else {
      // Dynamically import to avoid circular dependency at module load
      // This will be resolved when needed
      this.pinboardService = null
      this._pinboardServicePromise = null
    }
    this.configManager = new ConfigManager()
    this.cacheKey = 'hoverboard_recent_tags_cache'
    this.cacheTimeout = 5 * 60 * 1000 // 5 minutes
    this.tagFrequencyKey = 'hoverboard_tag_frequency'

    // [IMMUTABLE-REQ-TAG-003] - Shared memory key for user-driven recent tags
    this.sharedMemoryKey = 'hoverboard_recent_tags_shared'
  }

  /**
   * Get PinboardService instance (lazy loading to avoid circular dependency)
   * @returns {Promise<PinboardService>} PinboardService instance
   */
  async getPinboardService() {
    if (this.pinboardService) {
      return this.pinboardService
    }

    if (!this._pinboardServicePromise) {
      this._pinboardServicePromise = import('../pinboard/pinboard-service.js')
        .then(module => {
          this.pinboardService = new module.PinboardService(this)
          return this.pinboardService
        })
    }

    return this._pinboardServicePromise
  }

  /**
   * [IMMUTABLE-REQ-TAG-003] - Get user-driven recent tags from shared memory
   * @returns {Promise<Object[]>} Array of recent tag objects sorted by lastUsed timestamp
   */
  async getUserRecentTags() {
    try {
      debugLog('TAG-SERVICE', '[IMMUTABLE-REQ-TAG-003] Getting user recent tags from shared memory')

      // First try to access shared memory directly (service worker context)
      const directMemory = this.getDirectSharedMemory()
      if (directMemory) {
        const recentTags = directMemory.getRecentTags()
        debugLog('TAG-SERVICE', '[IMMUTABLE-REQ-TAG-003] Retrieved recent tags from direct shared memory:', recentTags.length)

        // Sort by lastUsed timestamp (most recent first)
        const sortedTags = recentTags.sort((a, b) => {
          const dateA = new Date(a.lastUsed)
          const dateB = new Date(b.lastUsed)
          return dateB - dateA
        })

        return sortedTags
      }

      // Fallback to background page access
      const backgroundPage = await this.getBackgroundPage()
      if (!backgroundPage || !backgroundPage.recentTagsMemory) {
        debugLog('TAG-SERVICE', '[IMMUTABLE-REQ-TAG-003] No shared memory found, returning empty array')
        return []
      }

      const recentTags = backgroundPage.recentTagsMemory.getRecentTags()
      debugLog('TAG-SERVICE', '[IMMUTABLE-REQ-TAG-003] Retrieved recent tags from shared memory:', recentTags.length)

      // Sort by lastUsed timestamp (most recent first)
      const sortedTags = recentTags.sort((a, b) => {
        const dateA = new Date(a.lastUsed)
        const dateB = new Date(b.lastUsed)
        return dateB - dateA
      })

      return sortedTags
    } catch (error) {
      debugError('TAG-SERVICE', '[IMMUTABLE-REQ-TAG-003] Failed to get user recent tags:', error)
      return []
    }
  }

  /**
   * [IMMUTABLE-REQ-TAG-003] - Get direct access to shared memory (service worker context)
   * @returns {Object|null} Shared memory object or null
   */
  getDirectSharedMemory() {
    try {
      // Try to access shared memory directly from global scope
      if (typeof self !== 'undefined' && self.recentTagsMemory) {
        return self.recentTagsMemory
      }

      if (typeof globalThis !== 'undefined' && globalThis.recentTagsMemory) {
        return globalThis.recentTagsMemory
      }

      return null
    } catch (error) {
      debugError('TAG-SERVICE', '[IMMUTABLE-REQ-TAG-003] Error getting direct shared memory:', error)
      return null
    }
  }

  /**
   * [IMMUTABLE-REQ-TAG-003] - Add tag to user recent list (current site only)
   * @param {string} tagName - Tag name to add
   * @param {string} currentSiteUrl - Current site URL for scope validation
   * @returns {Promise<boolean>} Success status
   */
  async addTagToUserRecentList(tagName, currentSiteUrl) {
    try {
      debugLog('TAG-SERVICE', '[IMMUTABLE-REQ-TAG-003] Adding tag to user recent list:', { tagName, currentSiteUrl })

      // Sanitize tag name
      const sanitizedTag = this.sanitizeTag(tagName)
      if (!sanitizedTag) {
        debugError('TAG-SERVICE', '[IMMUTABLE-REQ-TAG-003] Invalid tag name:', tagName)
        return false
      }

      // First try to access shared memory directly (service worker context)
      const directMemory = this.getDirectSharedMemory()
      if (directMemory) {
        const success = directMemory.addTag(sanitizedTag, currentSiteUrl)

        if (success) {
          debugLog('TAG-SERVICE', '[IMMUTABLE-REQ-TAG-003] Successfully added tag to user recent list via direct access')
          // Update tag frequency for suggestions
          await this.recordTagUsage(sanitizedTag)
        } else {
          debugError('TAG-SERVICE', '[IMMUTABLE-REQ-TAG-003] Failed to add tag to user recent list via direct access')
        }

        return success
      }

      // Fallback to background page access
      const backgroundPage = await this.getBackgroundPage()
      if (!backgroundPage || !backgroundPage.recentTagsMemory) {
        debugError('TAG-SERVICE', '[IMMUTABLE-REQ-TAG-003] Shared memory not available')
        return false
      }

      // Add tag to shared memory (current site only)
      const success = backgroundPage.recentTagsMemory.addTag(sanitizedTag, currentSiteUrl)

      if (success) {
        debugLog('TAG-SERVICE', '[IMMUTABLE-REQ-TAG-003] Successfully added tag to user recent list')
        // Update tag frequency for suggestions
        await this.recordTagUsage(sanitizedTag)
      } else {
        debugError('TAG-SERVICE', '[IMMUTABLE-REQ-TAG-003] Failed to add tag to user recent list')
      }

      return success
    } catch (error) {
      debugError('TAG-SERVICE', '[IMMUTABLE-REQ-TAG-003] Error adding tag to user recent list:', error)
      return false
    }
  }

  /**
   * [IMMUTABLE-REQ-TAG-003] - Get recent tags excluding current site
   * @param {string[]} currentTags - Tags currently assigned to the current site
   * @returns {Promise<Object[]>} Filtered array of recent tags
   */
  async getUserRecentTagsExcludingCurrent(currentTags = []) {
    try {
      debugLog('TAG-SERVICE', '[IMMUTABLE-REQ-TAG-003] Getting recent tags excluding current:', currentTags)

      // Get all user recent tags from shared memory
      const allRecentTags = await this.getUserRecentTags()

      // [IMMUTABLE-REQ-TAG-003] - Filter out tags already on current site (case-insensitive)
      const normalizedCurrentTags = currentTags.map(tag => tag.toLowerCase())
      const filteredTags = allRecentTags.filter(tag =>
        !normalizedCurrentTags.includes(tag.name.toLowerCase())
      )

      debugLog('TAG-SERVICE', '[IMMUTABLE-REQ-TAG-003] Filtered recent tags:', filteredTags.length)
      return filteredTags
    } catch (error) {
      debugError('TAG-SERVICE', '[IMMUTABLE-REQ-TAG-003] Error getting filtered recent tags:', error)
      return []
    }
  }

  /**
   * [IMMUTABLE-REQ-TAG-003] - Get background page for shared memory access
   * @returns {Promise<Object|null>} Background page object or null
   */
  async getBackgroundPage() {
    try {
      // In Manifest V3, the service worker is the background page
      // We need to access the shared memory directly from the service worker
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getBackgroundPage) {
        // Try the traditional method first (for backward compatibility)
        const backgroundPage = await chrome.runtime.getBackgroundPage()
        return backgroundPage
      } else {
        // In service worker context, we need to access the shared memory directly
        // The service worker instance should have the recentTagsMemory property
        if (typeof self !== 'undefined' && self.recentTagsMemory) {
          return { recentTagsMemory: self.recentTagsMemory }
        }

        // If we're in a content script or popup, try to get the service worker
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
          // Send a message to get the shared memory status
          const response = await chrome.runtime.sendMessage({
            type: 'getSharedMemoryStatus'
          })
          if (response && response.recentTagsMemory) {
            return { recentTagsMemory: response.recentTagsMemory }
          }
        }

        return null
      }
    } catch (error) {
      debugError('TAG-SERVICE', '[IMMUTABLE-REQ-TAG-003] Failed to get background page:', error)
      return null
    }
  }

  /**
   * [IMMUTABLE-REQ-TAG-003] - Get recent tags with new user-driven behavior
   * @param {Object} options - Tag retrieval options
   * @returns {Promise<Object[]>} Array of recent tag objects
   */
  async getRecentTags (options = {}) {
    try {
      debugLog('TAG-SERVICE', '[TEST-FIX-STORAGE-001] Getting recent tags with enhanced storage integration')

      // [TEST-FIX-STORAGE-001] - Try to get cached tags first
      const cached = await this.getCachedTags()
      
      if (cached && this.isCacheValid(cached.timestamp)) {
        debugLog('TAG-SERVICE', '[TEST-FIX-STORAGE-001] Returning cached tags:', cached.tags.length)
        return this.processTagsForDisplay(cached.tags, options)
      }

      // [TEST-FIX-STORAGE-001] - Fallback to user-driven recent tags from shared memory
      const userRecentTags = await this.getUserRecentTags()
      
      if (userRecentTags.length > 0) {
        debugLog('TAG-SERVICE', '[TEST-FIX-STORAGE-001] Returning user recent tags:', userRecentTags.length)
        return this.processTagsForDisplay(userRecentTags, options)
      }

      // [TEST-FIX-STORAGE-001] - Final fallback to empty array
      debugLog('TAG-SERVICE', '[TEST-FIX-STORAGE-001] No tags found, returning empty array')
      return []
    } catch (error) {
      debugError('TAG-SERVICE', '[TEST-FIX-STORAGE-001] Failed to get recent tags:', error)
      return []
    }
  }

  /**
   * Get tag suggestions based on input
   * @param {string} input - Partial tag input
   * @param {number} limit - Maximum suggestions to return
   * @returns {Promise<string[]>} Array of suggested tags
   */
  async getTagSuggestions (input = '', limit = 10) {
    try {
      const recentTags = await this.getRecentTags()
      const frequency = await this.getTagFrequency()

      // [IMMUTABLE-REQ-TAG-003] - Filter tags that start with input (case-insensitive)
      const filtered = recentTags
        .filter(tag => tag.name.toLowerCase().startsWith(input.toLowerCase()))
        .map(tag => ({
          ...tag,
          frequency: frequency[tag.name] || 0
        }))
        .sort((a, b) => {
          // Sort by frequency first, then alphabetically
          if (b.frequency !== a.frequency) {
            return b.frequency - a.frequency
          }
          return a.name.localeCompare(b.name)
        })
        .slice(0, limit)
        .map(tag => tag.name)

      return filtered
    } catch (error) {
      console.error('Failed to get tag suggestions:', error)
      return []
    }
  }

  /**
   * Record tag usage for frequency tracking
   * @param {string} tagName - Tag that was used
   */
  async recordTagUsage (tagName) {
    try {
      const frequency = await this.getTagFrequency()
      frequency[tagName] = (frequency[tagName] || 0) + 1

      await chrome.storage.local.set({
        [this.tagFrequencyKey]: frequency
      })

      // Update recent tags cache to include the newly used tag
      await this.updateRecentTagsCache(tagName, frequency[tagName])
    } catch (error) {
      console.error('Failed to record tag usage:', error)
    }
  }

  /**
   * Update recent tags cache with a newly used tag
   * @param {string} tagName - Tag that was used
   * @param {number} frequency - Current frequency of the tag
   */
  async updateRecentTagsCache (tagName, frequency) {
    try {
      const config = await this.configManager.getConfig()
      const cachedTags = await this.getCachedTags()

      let currentTags = []
      if (cachedTags && this.isCacheValid(cachedTags.timestamp)) {
        currentTags = cachedTags.tags
      }

      // Find if tag already exists in cache
      const existingTagIndex = currentTags.findIndex(tag => tag.name === tagName)
      const now = new Date()

      if (existingTagIndex >= 0) {
        // Update existing tag
        currentTags[existingTagIndex] = {
          ...currentTags[existingTagIndex],
          count: frequency,
          lastUsed: now
        }
      } else {
        // Add new tag to cache
        const newTag = {
          name: tagName,
          count: frequency,
          lastUsed: now,
          bookmarks: []
        }
        currentTags.push(newTag)
      }

      // Sort tags by frequency and recency, then limit to max count
      const sortedTags = currentTags
        .sort((a, b) => {
          // Sort by count first, then by last used time
          if (b.count !== a.count) {
            return b.count - a.count
          }
          return new Date(b.lastUsed) - new Date(a.lastUsed)
        })
        .slice(0, config.recentTagsCountMax)

      // Update cache
      await chrome.storage.local.set({
        [this.cacheKey]: {
          tags: sortedTags,
          timestamp: Date.now()
        }
      })
    } catch (error) {
      console.error('Failed to update recent tags cache:', error)
    }
  }

  /**
   * Get most frequently used tags
   * @param {number} limit - Number of tags to return
   * @returns {Promise<string[]>} Array of frequent tags
   */
  async getFrequentTags (limit = 20) {
    try {
      const frequency = await this.getTagFrequency()

      return Object.entries(frequency)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([tag]) => tag)
    } catch (error) {
      console.error('Failed to get frequent tags:', error)
      return []
    }
  }

  /**
   * Clear tag cache (force refresh on next request)
   */
  async clearCache () {
    try {
      await chrome.storage.local.remove(this.cacheKey)
    } catch (error) {
      console.error('Failed to clear tag cache:', error)
    }
  }

  /**
   * Get cached tags from storage
   * @returns {Promise<Object|null>} Cached tag data or null
   */
  async getCachedTags () {
    try {
      debugLog('TAG-SERVICE', 'Getting cached tags from storage')
      const result = await chrome.storage.local.get(this.cacheKey)
      const cachedData = result[this.cacheKey] || null
      debugLog('TAG-SERVICE', 'Cached data retrieved:', cachedData)
      return cachedData
    } catch (error) {
      debugError('TAG-SERVICE', 'Failed to get cached tags:', error)
      return null
    }
  }

  /**
   * Check if cache is still valid
   * @param {number} timestamp - Cache timestamp
   * @returns {boolean} Whether cache is valid
   */
  isCacheValid (timestamp) {
    const isValid = Date.now() - timestamp < this.cacheTimeout
    debugLog('TAG-SERVICE', 'Cache validity check:', {
      timestamp,
      currentTime: Date.now(),
      age: Date.now() - timestamp,
      timeout: this.cacheTimeout,
      isValid
    })
    return isValid
  }

  /**
   * Extract unique tags from bookmarks
   * @param {Object[]} bookmarks - Array of bookmark objects
   * @returns {Object[]} Array of tag objects with metadata
   */
  extractTagsFromBookmarks (bookmarks) {
    debugLog('TAG-SERVICE', 'Extracting tags from bookmarks, count:', bookmarks.length)

    const tagMap = new Map()

    bookmarks.forEach((bookmark, index) => {
      debugLog('TAG-SERVICE', `Processing bookmark ${index + 1}:`, {
        url: bookmark.url,
        description: bookmark.description,
        tags: bookmark.tags
      })

      if (bookmark.tags && bookmark.tags.length > 0) {
        bookmark.tags.forEach(tagName => {
          debugLog('TAG-SERVICE', `Processing tag: "${tagName}"`)

          if (tagName.trim()) {
            const existing = tagMap.get(tagName) || {
              name: tagName,
              count: 0,
              lastUsed: null,
              bookmarks: []
            }

            existing.count++
            existing.bookmarks.push({
              url: bookmark.url,
              description: bookmark.description,
              time: bookmark.time
            })

            // Update last used time
            const bookmarkTime = new Date(bookmark.time)
            if (!existing.lastUsed || bookmarkTime > existing.lastUsed) {
              existing.lastUsed = bookmarkTime
            }

            tagMap.set(tagName, existing)
            debugLog('TAG-SERVICE', `Added/updated tag "${tagName}" (count: ${existing.count})`)
          } else {
            debugLog('TAG-SERVICE', `Skipping empty tag: "${tagName}"`)
          }
        })
      } else {
        debugLog('TAG-SERVICE', `Bookmark has no tags`)
      }
    })

    const result = Array.from(tagMap.values())
    debugLog('TAG-SERVICE', 'Final extracted tags:', result.map(t => ({ name: t.name, count: t.count })))

    return result
  }

  /**
   * Process tags and update cache
   * @param {Object[]} tags - Array of tag objects
   * @returns {Promise<Object[]>} Processed tags
   */
  async processAndCacheTags (tags) {
    try {
      debugLog('TAG-SERVICE', 'Processing and caching tags, input count:', tags.length)
      debugLog('TAG-SERVICE', 'Input tags:', tags.map(t => ({ name: t.name, count: t.count })))

      const config = await this.configManager.getConfig()

      // Sort tags by usage and recency
      const sortedTags = tags
        .sort((a, b) => {
          // Sort by count first, then by last used time
          if (b.count !== a.count) {
            return b.count - a.count
          }
          return new Date(b.lastUsed) - new Date(a.lastUsed)
        })
        .slice(0, config.recentTagsCountMax)

      debugLog('TAG-SERVICE', 'Sorted and limited tags:', sortedTags.map(t => ({ name: t.name, count: t.count })))

      // Cache the processed tags
      const cacheData = {
        tags: sortedTags,
        timestamp: Date.now()
      }

      debugLog('TAG-SERVICE', 'Caching data:', cacheData)

      await chrome.storage.local.set({
        [this.cacheKey]: cacheData
      })

      debugLog('TAG-SERVICE', 'Cache updated successfully')
      return sortedTags
    } catch (error) {
      debugError('TAG-SERVICE', 'Failed to process and cache tags:', error)
      return tags
    }
  }

  /**
   * Process tags for display based on options
   * @param {Object[]} tags - Array of tag objects
   * @param {Object} options - Display options
   * @returns {Object[]} Processed tags for display
   */
  processTagsForDisplay (tags, options) {
    // Filter out current page tags if specified
    let filteredTags = tags

    if (options.tags && options.tags.length > 0) {
      filteredTags = tags.filter(tag => !options.tags.includes(tag.name))
    }

    // Add display metadata
    return filteredTags.map(tag => ({
      ...tag,
      displayName: tag.name,
      isRecent: this.isRecentTag(tag.lastUsed),
      isFrequent: tag.count > 1,
      tooltip: this.generateTagTooltip(tag)
    }))
  }

  /**
   * Check if tag was used recently
   * @param {Date} lastUsed - Last usage date
   * @returns {boolean} Whether tag is recent
   */
  isRecentTag (lastUsed) {
    if (!lastUsed) return false
    const daysSinceUsed = (Date.now() - lastUsed.getTime()) / (1000 * 60 * 60 * 24)
    return daysSinceUsed <= 7 // Consider recent if used within 7 days
  }

  /**
   * Generate tooltip text for tag
   * @param {Object} tag - Tag object
   * @returns {string} Tooltip text
   */
  generateTagTooltip (tag) {
    const parts = [`Tag: ${tag.name}`]

    if (tag.count > 1) {
      parts.push(`Used ${tag.count} times`)
    }

    if (tag.lastUsed) {
      const timeAgo = this.getTimeAgo(tag.lastUsed)
      parts.push(`Last used ${timeAgo}`)
    }

    return parts.join(' | ')
  }

  /**
   * Get human-readable time ago string
   * @param {Date} date - Date to compare
   * @returns {string} Time ago string
   */
  getTimeAgo (date) {
    const now = new Date()
    const diffMs = now - date
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'today'
    if (diffDays === 1) return 'yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return `${Math.floor(diffDays / 30)} months ago`
  }

  /**
   * Get tag frequency data from storage
   * @returns {Promise<Object>} Tag frequency map
   */
  async getTagFrequency () {
    try {
      const result = await chrome.storage.local.get(this.tagFrequencyKey)
      return result[this.tagFrequencyKey] || {}
    } catch (error) {
      console.error('Failed to get tag frequency:', error)
      return {}
    }
  }

  /**
   * Reset tag frequency data
   */
  async resetTagFrequency () {
    try {
      await chrome.storage.local.remove(this.tagFrequencyKey)
    } catch (error) {
      console.error('Failed to reset tag frequency:', error)
    }
  }

  /**
   * Get tag statistics
   * @returns {Promise<Object>} Tag statistics
   */
  async getTagStatistics () {
    try {
      const [recentTags, frequency] = await Promise.all([
        this.getRecentTags(),
        this.getTagFrequency()
      ])

      return {
        totalUniqueTags: recentTags.length,
        totalUsageCount: Object.values(frequency).reduce((sum, count) => sum + count, 0),
        mostUsedTag: this.getMostUsedTag(frequency),
        averageTagsPerBookmark: this.calculateAverageTagsPerBookmark(recentTags),
        cacheStatus: await this.getCacheStatus()
      }
    } catch (error) {
      console.error('Failed to get tag statistics:', error)
      return {}
    }
  }

  /**
   * Get most used tag
   * @param {Object} frequency - Tag frequency map
   * @returns {Object|null} Most used tag info
   */
  getMostUsedTag (frequency) {
    const entries = Object.entries(frequency)
    if (entries.length === 0) return null

    const [tag, count] = entries.reduce((max, current) =>
      current[1] > max[1] ? current : max
    )

    return { tag, count }
  }

  /**
   * Calculate average tags per bookmark
   * @param {Object[]} tags - Array of tag objects
   * @returns {number} Average tags per bookmark
   */
  calculateAverageTagsPerBookmark (tags) {
    if (tags.length === 0) return 0

    const totalBookmarks = new Set()
    tags.forEach(tag => {
      tag.bookmarks.forEach(bookmark => {
        totalBookmarks.add(bookmark.url)
      })
    })

    return totalBookmarks.size > 0 ? tags.length / totalBookmarks.size : 0
  }

  /**
   * Get cache status information
   * @returns {Promise<Object>} Cache status
   */
  async getCacheStatus () {
    const cached = await this.getCachedTags()
    if (!cached) {
      return { status: 'empty' }
    }

    const isValid = this.isCacheValid(cached.timestamp)
    const age = Date.now() - cached.timestamp

    return {
      status: isValid ? 'valid' : 'expired',
      age,
      tagCount: cached.tags.length,
      lastUpdated: new Date(cached.timestamp).toISOString()
    }
  }

  /**
   * [IMMUTABLE-REQ-TAG-001] - Add tag to recent tags when added to record
   * @param {string} tag - Tag to add to recent tags
   * @param {string} recordId - ID of the record the tag was added to
   * @returns {Promise<void>}
   */
  async addTagToRecent (tag, recordId) {
    try {
      // [IMMUTABLE-REQ-TAG-001] - Sanitize tag input
      const sanitizedTag = this.sanitizeTag(tag)
      if (!sanitizedTag) {
        console.warn('[IMMUTABLE-REQ-TAG-001] Invalid tag provided:', tag)
        return
      }

      // [IMMUTABLE-REQ-TAG-001] - Get current recent tags
      const recentTags = await this.getRecentTags()

      // [IMMUTABLE-REQ-TAG-001] - Check for duplicates in recent tags (case-insensitive)
      const isDuplicate = recentTags.some(existingTag =>
        existingTag.name.toLowerCase() === sanitizedTag.toLowerCase()
      )

      if (!isDuplicate) {
        // [IMMUTABLE-REQ-TAG-001] - Add tag to recent tags list
        await this.recordTagUsage(sanitizedTag)
        debugLog('IMMUTABLE-REQ-TAG-001', 'Tag added to recent tags:', sanitizedTag)
      } else {
        debugLog('IMMUTABLE-REQ-TAG-001', 'Tag already exists in recent tags:', sanitizedTag)
      }
    } catch (error) {
      debugError('IMMUTABLE-REQ-TAG-001', 'Failed to add tag to recent:', error)
    }
  }

  /**
   * [IMMUTABLE-REQ-TAG-001] - Get recent tags excluding current tab duplicates
   * @param {string[]} currentTags - Tags currently displayed on the tab
   * @returns {Promise<Object[]>} Array of recent tags excluding current
   */
  async getRecentTagsExcludingCurrent (currentTags = []) {
    try {
      // [IMMUTABLE-REQ-TAG-001] - Get all recent tags
      const allRecentTags = await this.getRecentTags()

      // [IMMUTABLE-REQ-TAG-001] - Normalize current tags for comparison (case-insensitive)
      const normalizedCurrentTags = currentTags.map(tag => {
        const sanitized = this.sanitizeTag(tag)
        return sanitized ? sanitized.toLowerCase() : null
      }).filter(tag => tag)

      // [IMMUTABLE-REQ-TAG-001] - Filter out current tab duplicates (case-insensitive)
      const filteredTags = allRecentTags.filter(tag =>
        !normalizedCurrentTags.includes(tag.name.toLowerCase())
      )

      debugLog('IMMUTABLE-REQ-TAG-001', 'Recent tags excluding current:', filteredTags.length)
      return filteredTags
    } catch (error) {
      debugError('IMMUTABLE-REQ-TAG-001', 'Failed to get recent tags excluding current:', error)
      return []
    }
  }

  /**
   * [IMMUTABLE-REQ-TAG-001] - Handle tag addition during bookmark operations
   * @param {string} tag - Tag to add
   * @param {Object} bookmarkData - Bookmark data
   * @returns {Promise<void>}
   */
  async handleTagAddition (tag, bookmarkData) {
    try {
      // [IMMUTABLE-REQ-TAG-001] - Add tag to recent tags
      await this.addTagToRecent(tag, bookmarkData.url)

      // [IMMUTABLE-REQ-TAG-001] - Update bookmark record if needed
      if (bookmarkData.url) {
        debugLog('IMMUTABLE-REQ-TAG-001', 'Tag addition handled for bookmark:', bookmarkData.url)
      }
    } catch (error) {
      debugError('IMMUTABLE-REQ-TAG-001', 'Failed to handle tag addition:', error)
    }
  }

  /**
   * [IMMUTABLE-REQ-TAG-001] - Sanitize tag input
   * @param {string} tag - Raw tag input
   * @returns {string|null} Sanitized tag or null for invalid input
   */
  sanitizeTag(tag) {
    if (!tag || typeof tag !== 'string') {
      return null; // [TEST-FIX-SANITIZE-001] - Return null for invalid input
    }

    // [TEST-FIX-SANITIZE-001] - Enhanced HTML tag handling with test-compliant logic
    let sanitized = tag.trim()
      .replace(/<([^>]*?)>/g, (match, content) => {
        // Handle closing tags
        if (content.startsWith('/')) {
          return '';
        }
        
        // Extract tag name only (no attributes or content)
        const tagName = content.split(/\s+/)[0];
        return tagName;
      })
      .replace(/[^a-zA-Z0-9_-]/g, '') // Remove remaining special characters
      .substring(0, 50); // Limit length

    if (sanitized.length === 0) {
      return null; // [TEST-FIX-SANITIZE-001] - Return null for empty result
    }

    return sanitized;
  }
}
