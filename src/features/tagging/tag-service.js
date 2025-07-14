/**
 * Tag Service - Modern tag management and caching system
 * Replaces legacy throttled_recent_tags.js with improved caching and suggestion algorithms
 */

import { ConfigManager } from '../../config/config-manager.js'

export class TagService {
  constructor (pinboardService = null) {
    // Only require PinboardService if not injected (avoids circular import)
    if (pinboardService) {
      this.pinboardService = pinboardService
    } else {
      // Dynamically require to avoid circular dependency at module load
      const { PinboardService } = require('../pinboard/pinboard-service.js')
      this.pinboardService = new PinboardService()
    }
    this.configManager = new ConfigManager()
    this.cacheKey = 'hoverboard_recent_tags_cache'
    this.cacheTimeout = 5 * 60 * 1000 // 5 minutes
    this.tagFrequencyKey = 'hoverboard_tag_frequency'
  }

  /**
   * Get recent tags with caching and throttling
   * @param {Object} options - Tag retrieval options
   * @returns {Promise<Object[]>} Array of recent tag objects
   */
  async getRecentTags (options = {}) {
    try {
      // Check cache first
      const cachedTags = await this.getCachedTags()
      let tagsArr = []
      if (cachedTags && this.isCacheValid(cachedTags.timestamp)) {
        tagsArr = cachedTags.tags
      } else {
        // Fetch fresh tags from Pinboard
        const config = await this.configManager.getConfig()
        const recentBookmarks = await this.pinboardService.getRecentBookmarks(
          config.initRecentPostsCount
        )
        // Extract and process tags
        tagsArr = this.extractTagsFromBookmarks(recentBookmarks)
        await this.processAndCacheTags(tagsArr)
      }
      // Always return array of objects with 'name' property
      return tagsArr.map(tag => typeof tag === 'string' ? { name: tag } : tag)
    } catch (error) {
      console.error('Failed to get recent tags:', error)
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

      // Filter tags that start with input
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
      const result = await chrome.storage.local.get(this.cacheKey)
      return result[this.cacheKey] || null
    } catch (error) {
      console.error('Failed to get cached tags:', error)
      return null
    }
  }

  /**
   * Check if cache is still valid
   * @param {number} timestamp - Cache timestamp
   * @returns {boolean} Whether cache is valid
   */
  isCacheValid (timestamp) {
    return Date.now() - timestamp < this.cacheTimeout
  }

  /**
   * Extract unique tags from bookmarks
   * @param {Object[]} bookmarks - Array of bookmark objects
   * @returns {Object[]} Array of tag objects with metadata
   */
  extractTagsFromBookmarks (bookmarks) {
    const tagMap = new Map()

    bookmarks.forEach(bookmark => {
      if (bookmark.tags && bookmark.tags.length > 0) {
        bookmark.tags.forEach(tagName => {
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
          }
        })
      }
    })

    return Array.from(tagMap.values())
  }

  /**
   * Process tags and update cache
   * @param {Object[]} tags - Array of tag objects
   * @returns {Promise<Object[]>} Processed tags
   */
  async processAndCacheTags (tags) {
    try {
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

      // Cache the processed tags
      await chrome.storage.local.set({
        [this.cacheKey]: {
          tags: sortedTags,
          timestamp: Date.now()
        }
      })

      return sortedTags
    } catch (error) {
      console.error('Failed to process and cache tags:', error)
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
      
      // [IMMUTABLE-REQ-TAG-001] - Check for duplicates in recent tags
      const isDuplicate = recentTags.some(existingTag => 
        existingTag.name.toLowerCase() === sanitizedTag.toLowerCase()
      )

      if (!isDuplicate) {
        // [IMMUTABLE-REQ-TAG-001] - Add tag to recent tags list
        await this.recordTagUsage(sanitizedTag)
        console.log('[IMMUTABLE-REQ-TAG-001] Tag added to recent tags:', sanitizedTag)
      } else {
        console.log('[IMMUTABLE-REQ-TAG-001] Tag already exists in recent tags:', sanitizedTag)
      }
    } catch (error) {
      console.error('[IMMUTABLE-REQ-TAG-001] Failed to add tag to recent:', error)
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
      
      // [IMMUTABLE-REQ-TAG-001] - Normalize current tags for comparison
      const normalizedCurrentTags = currentTags.map(tag => 
        this.sanitizeTag(tag).toLowerCase()
      ).filter(tag => tag)

      // [IMMUTABLE-REQ-TAG-001] - Filter out current tab duplicates
      const filteredTags = allRecentTags.filter(tag => 
        !normalizedCurrentTags.includes(tag.name.toLowerCase())
      )

      console.log('[IMMUTABLE-REQ-TAG-001] Recent tags excluding current:', filteredTags.length)
      return filteredTags
    } catch (error) {
      console.error('[IMMUTABLE-REQ-TAG-001] Failed to get recent tags excluding current:', error)
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
        console.log('[IMMUTABLE-REQ-TAG-001] Tag addition handled for bookmark:', bookmarkData.url)
      }
    } catch (error) {
      console.error('[IMMUTABLE-REQ-TAG-001] Failed to handle tag addition:', error)
    }
  }

  /**
   * [IMMUTABLE-REQ-TAG-001] - Sanitize tag input
   * @param {string} tag - Raw tag input
   * @returns {string} Sanitized tag
   */
  sanitizeTag(tag) {
    if (!tag || typeof tag !== 'string') {
      return '';
    }

    let tagName = '';
    const tagStartMatch = tag.match(/^<([a-zA-Z0-9_-]+)>/);
    if (tagStartMatch) {
      tagName = tagStartMatch[1];
    }
    // Remove all HTML tags
    let sanitized = tag.replace(/<[^>]+>/g, '');
    // Prepend tagName if found
    if (tagName) {
      sanitized = tagName + sanitized;
    }
    // Remove non-word characters (except space and dash)
    sanitized = sanitized.replace(/[^\w\s-]/g, '');
    // Remove extra spaces
    sanitized = sanitized.replace(/\s+/g, '');
    // Limit length
    return sanitized.substring(0, 50);
  }
}
