/**
 * Pinboard Service - Modern API integration for Pinboard bookmarking service
 * Replaces legacy Pb class with Promise-based, error-handled architecture
 *
 * PIN-001: Pinboard API integration with authentication and rate limiting
 * PIN-002: Bookmark retrieval and management operations
 * PIN-003: Tag management and bookmark modification operations
 * PIN-004: Error handling and retry logic for network resilience
 */

import { ConfigManager } from '../../config/config-manager.js'
import { TagService } from '../tagging/tag-service.js' // [IMMUTABLE-REQ-TAG-001] - Import TagService
import { XMLParser } from 'fast-xml-parser'
import { debugLog, debugError, debugWarn } from '../../shared/utils.js'

debugLog('[SAFARI-EXT-SHIM-001] pinboard-service.js: module loaded');

export class PinboardService {
  constructor (tagService = null) {
    // PIN-001: Configuration manager integration for authentication and settings
    this.configManager = new ConfigManager()
    // [IMMUTABLE-REQ-TAG-001] - Tag service integration for tag tracking
    this.tagService = tagService || new TagService(this)
    // PIN-001: Pinboard API base URL - official API endpoint
    // SPECIFICATION: Use official Pinboard API v1 endpoint for all operations
    this.apiBase = 'https://api.pinboard.in/v1/'
    // PIN-004: Progressive retry delays for rate limiting compliance
    // IMPLEMENTATION DECISION: Exponential backoff to respect API rate limits
    this.retryDelays = [1000, 2000, 5000] // Progressive retry delays

    // PIN-001: XML parser configuration for Pinboard API responses
    // SPECIFICATION: Pinboard API returns XML, parse with attribute support
    // IMPLEMENTATION DECISION: Configure parser for Pinboard's XML structure
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      parseAttributeValue: true
    })
  }

  /**
   * Get bookmark data for a specific URL
   * @param {string} url - URL to lookup
   * @param {string} title - Page title (fallback for description)
   * @returns {Promise<Object>} Bookmark data
   *
   * PIN-002: Single bookmark retrieval by URL
   * SPECIFICATION: Use posts/get endpoint to fetch bookmark for specific URL
   * IMPLEMENTATION DECISION: Provide fallback data on failure for UI stability
   */
  async getBookmarkForUrl (url, title = '') {
    try {
      // PIN-001: Do not call Pinboard API when credentials are not present
      const hasAuth = await this.configManager.hasAuthToken()
      if (!hasAuth) {
        debugLog('[PINBOARD-SERVICE] No auth token configured, returning empty bookmark without API call')
        return this.createEmptyBookmark(url, title)
      }

      // PIN-002: Clean URL before API request for consistent matching
      const cleanUrl = this.cleanUrl(url)
      const endpoint = `posts/get?url=${encodeURIComponent(cleanUrl)}`

      debugLog('🔍 Making Pinboard API request:', {
        endpoint,
        cleanUrl,
        originalUrl: url
      })

      const response = await this.makeApiRequest(endpoint)

      debugLog('📥 Pinboard API response received:', response)

      // PIN-002: Parse XML response into bookmark object
      const parsed = this.parseBookmarkResponse(response, cleanUrl, title)

      debugLog('📋 Parsed bookmark result:', parsed)

      return parsed
    } catch (error) {
      debugError('❌ Failed to get bookmark for URL:', error)
      debugError('❌ Error details:', error.message)
      debugError('❌ Full error:', error)

      // PIN-002: Return empty bookmark structure on failure for UI consistency
      const emptyBookmark = this.createEmptyBookmark(url, title)
      debugLog('📝 Returning empty bookmark due to error:', emptyBookmark)

      return emptyBookmark
    }
  }

  /**
   * Get recent bookmarks from Pinboard
   * @param {number} count - Number of recent bookmarks to fetch
   * @returns {Promise<Object[]>} Array of recent bookmarks
   *
   * PIN-002: Recent bookmarks retrieval for dashboard display
   * SPECIFICATION: Use posts/recent endpoint with count parameter
   * IMPLEMENTATION DECISION: Return empty array on failure to prevent UI errors
   */
  async getRecentBookmarks (count = 15) {
    try {
      // PIN-001: Do not call Pinboard API when credentials are not present
      const hasAuth = await this.configManager.hasAuthToken()
      if (!hasAuth) {
        debugLog('[PINBOARD-SERVICE] No auth token configured, returning empty recent list without API call')
        return []
      }

      debugLog('[PINBOARD-SERVICE] Getting recent bookmarks, count:', count)

      // PIN-002: Fetch recent bookmarks with specified count
      const endpoint = `posts/recent?count=${count}`
      const response = await this.makeApiRequest(endpoint)

      debugLog('[PINBOARD-SERVICE] Raw API response received')

      // PIN-002: Parse XML response into bookmark array
      const result = this.parseRecentBookmarksResponse(response)
      debugLog('[PINBOARD-SERVICE] Parsed recent bookmarks:', result.map(b => ({
        url: b.url,
        description: b.description,
        tags: b.tags
      })))

      return result
    } catch (error) {
      debugError('[PINBOARD-SERVICE] Failed to get recent bookmarks:', error)
      // PIN-002: Return empty array on failure for UI stability
      return []
    }
  }

  /**
   * Save a bookmark to Pinboard
   * @param {Object} bookmarkData - Bookmark data to save
   * @returns {Promise<Object>} Save result
   *
   * PIN-003: Bookmark creation/update operation
   * SPECIFICATION: Use posts/add endpoint to save bookmark with all metadata
   * IMPLEMENTATION DECISION: Re-throw errors to allow caller error handling
   * [IMMUTABLE-REQ-TAG-001] - Enhanced with tag tracking
   */
  async saveBookmark (bookmarkData) {
    try {
      // PIN-001: Do not call Pinboard API when credentials are not present
      const hasAuth = await this.configManager.hasAuthToken()
      if (!hasAuth) {
        debugLog('[PINBOARD-SERVICE] No auth token configured, skipping save without API call')
        return { success: false, code: 'no_auth', message: 'No authentication token configured' }
      }

      // PIN-003: Build URL parameters from bookmark data
      const params = this.buildSaveParams(bookmarkData)
      const endpoint = `posts/add?${params}`
      const response = await this.makeApiRequest(endpoint, 'GET')

      // [IMMUTABLE-REQ-TAG-001] - Track tags after successful save
      await this.trackBookmarkTags(bookmarkData)

      // PIN-003: Parse API response for save confirmation
      return this.parseApiResponse(response)
    } catch (error) {
      debugError('Failed to save bookmark:', error)
      // PIN-003: Re-throw to allow caller to handle save failures
      throw error
    }
  }

  /**
   * Save a tag to an existing bookmark
   * @param {Object} tagData - Tag data to save
   * @returns {Promise<Object>} Save result
   *
   * PIN-003: Tag addition to existing bookmark
   * SPECIFICATION: Retrieve current bookmark, add tag, then save updated bookmark
   * IMPLEMENTATION DECISION: Merge tags to preserve existing tags while adding new ones
   * [IMMUTABLE-REQ-TAG-001] - Enhanced with tag tracking
   */
  async saveTag (tagData) {
    try {
      // PIN-003: Get current bookmark data to preserve existing tags
      const currentBookmark = await this.getBookmarkForUrl(tagData.url)

      // PIN-003: Add new tag to existing tags array
      const existingTags = currentBookmark.tags || []
      const newTags = [...existingTags]

      if (tagData.value && !existingTags.includes(tagData.value)) {
        // PIN-003: Only add tag if it doesn't already exist
        newTags.push(tagData.value)
      }

      // PIN-003: Save updated bookmark with merged tags
      const updatedBookmark = {
        ...currentBookmark,
        ...tagData,
        tags: newTags.join(' ')
      }

      // [IMMUTABLE-REQ-TAG-001] - Track the new tag specifically
      if (tagData.value) {
        await this.tagService.handleTagAddition(tagData.value, updatedBookmark)
      }

      return this.saveBookmark(updatedBookmark)
    } catch (error) {
      debugError('Failed to save tag:', error)
      // PIN-003: Re-throw to allow caller error handling
      throw error
    }
  }

  /**
   * Delete a bookmark from Pinboard
   * @param {string} url - URL of bookmark to delete
   * @returns {Promise<Object>} Delete result
   *
   * PIN-003: Bookmark deletion operation
   * SPECIFICATION: Use posts/delete endpoint to remove bookmark by URL
   * IMPLEMENTATION DECISION: Clean URL before deletion for consistent matching
   */
  async deleteBookmark (url) {
    try {
      // PIN-001: Do not call Pinboard API when credentials are not present
      const hasAuth = await this.configManager.hasAuthToken()
      if (!hasAuth) {
        debugLog('[PINBOARD-SERVICE] No auth token configured, skipping delete without API call')
        return { success: false, code: 'no_auth', message: 'No authentication token configured' }
      }

      // PIN-003: Clean URL for consistent deletion matching
      const cleanUrl = this.cleanUrl(url)
      const endpoint = `posts/delete?url=${encodeURIComponent(cleanUrl)}`
      const response = await this.makeApiRequest(endpoint)

      // PIN-003: Parse API response for deletion confirmation
      return this.parseApiResponse(response)
    } catch (error) {
      debugError('Failed to delete bookmark:', error)
      // PIN-003: Re-throw to allow caller error handling
      throw error
    }
  }

  /**
   * [IMMUTABLE-REQ-TAG-001] - Track tags from bookmark data
   * @param {Object} bookmarkData - Bookmark data containing tags
   * @returns {Promise<void>}
   */
  async trackBookmarkTags (bookmarkData) {
    try {
      // [IMMUTABLE-REQ-TAG-001] - Extract tags from bookmark data
      const tags = this.extractTagsFromBookmarkData(bookmarkData)
      // Sanitize, deduplicate, and filter empty tags
      const sanitizedTags = Array.from(new Set(tags.map(tag => this.tagService.sanitizeTag(tag)).filter(Boolean)))
      if (sanitizedTags.length > 0) {
        // [IMMUTABLE-REQ-TAG-001] - Track each tag individually
        for (const sanitizedTag of sanitizedTags) {
          await this.tagService.handleTagAddition(sanitizedTag, bookmarkData)
        }
        debugLog('[IMMUTABLE-REQ-TAG-001] Tracked tags for bookmark:', sanitizedTags)
      }
    } catch (error) {
      debugError('[IMMUTABLE-REQ-TAG-001] Failed to track bookmark tags:', error)
      // [IMMUTABLE-REQ-TAG-001] - Don't throw error to avoid breaking bookmark save
    }
  }

  /**
   * [IMMUTABLE-REQ-TAG-001] - Enhanced error handling for tag operations
   * @param {Error} error - The error that occurred
   * @param {string} operation - The operation that failed
   * @param {Object} context - Additional context data
   * @returns {Promise<void>}
   */
  async handleTagError (error, operation, context = {}) {
    // [IMMUTABLE-REQ-TAG-001] - Log error with context
    debugError(`[IMMUTABLE-REQ-TAG-001] Tag operation failed: ${operation}`, {
      error: error.message,
      stack: error.stack,
      context
    })

    // [IMMUTABLE-REQ-TAG-001] - Attempt recovery based on error type
    if (error.name === 'QuotaExceededError') {
      try {
        await this.tagService.cleanupOldTags()
        debugLog('[IMMUTABLE-REQ-TAG-001] Attempted cleanup after quota exceeded')
      } catch (cleanupError) {
        debugError('[IMMUTABLE-REQ-TAG-001] Cleanup also failed:', cleanupError)
      }
    }

    // [IMMUTABLE-REQ-TAG-001] - Notify user of tag operation failure
    try {
      await this.notifyUserOfTagError(operation, error.message)
    } catch (notificationError) {
      debugError('[IMMUTABLE-REQ-TAG-001] Failed to notify user:', notificationError)
    }
  }

  /**
   * [IMMUTABLE-REQ-TAG-001] - Notify user of tag operation errors
   * @param {string} operation - The operation that failed
   * @param {string} errorMessage - The error message
   * @returns {Promise<void>}
   */
  async notifyUserOfTagError (operation, errorMessage) {
    // [IMMUTABLE-REQ-TAG-001] - Create user-friendly error message
    const userMessage = `Tag ${operation} failed, but bookmark was saved. Error: ${errorMessage}`

    // [IMMUTABLE-REQ-TAG-001] - Log user notification
    debugWarn('[IMMUTABLE-REQ-TAG-001] User notification:', userMessage)

    // [IMMUTABLE-REQ-TAG-001] - Could be extended to show browser notification
    // For now, just log the message
  }

  /**
   * [IMMUTABLE-REQ-TAG-001] - Extract tags from bookmark data
   * @param {Object} bookmarkData - Bookmark data
   * @returns {string[]} Array of tags
   */
  extractTagsFromBookmarkData (bookmarkData) {
    const tags = []

    // [IMMUTABLE-REQ-TAG-001] - Extract tags from tags field
    if (bookmarkData.tags) {
      if (typeof bookmarkData.tags === 'string') {
        // [IMMUTABLE-REQ-TAG-001] - Split space-separated tags
        const tagArray = bookmarkData.tags.split(/\s+/).filter(tag => tag.trim())
        tags.push(...tagArray)
      } else if (Array.isArray(bookmarkData.tags)) {
        // [IMMUTABLE-REQ-TAG-001] - Use array of tags directly
        tags.push(...bookmarkData.tags.filter(tag => tag && tag.trim()))
      }
    }

    return tags
  }

  /**
   * Remove a specific tag from a bookmark
   * @param {Object} tagData - Tag removal data
   * @returns {Promise<Object>} Update result
   *
   * PIN-003: Tag removal from existing bookmark
   * SPECIFICATION: Retrieve bookmark, remove specified tag, save updated bookmark
   * IMPLEMENTATION DECISION: Filter out specific tag while preserving other tags
   * [action:delete] [sync:site-record] [arch:atomic-sync]
   */
  async deleteTag (tagData) {
    try {
      // [sync:site-record] - Get current bookmark data to access existing tags
      const currentBookmark = await this.getBookmarkForUrl(tagData.url)

      // [action:delete] - Remove specified tag from existing tags
      const existingTags = currentBookmark.tags || []
      const filteredTags = existingTags.filter(tag => tag !== tagData.value)

      // [arch:atomic-sync] - Save bookmark with filtered tags
      const updatedBookmark = {
        ...currentBookmark,
        ...tagData,
        tags: filteredTags.join(' ')
      }

      // [arch:atomic-sync] [test:tag-deletion] - Save updated bookmark to persistent storage
      return this.saveBookmark(updatedBookmark)
    } catch (error) {
      debugError('Failed to delete tag:', error) // [test:tag-deletion]
      // PIN-003: Re-throw to allow caller error handling
      throw error
    }
  }

  /**
   * Test authentication with Pinboard API
   * @returns {Promise<boolean>} True if authentication is valid
   *
   * PIN-001: Authentication validation using API endpoint
   * SPECIFICATION: Use user/api_token endpoint to verify authentication
   * IMPLEMENTATION DECISION: Simple boolean return for easy authentication checking
   */
  async testConnection () {
    try {
      // PIN-001: Do not call Pinboard API when credentials are not present
      const hasAuth = await this.configManager.hasAuthToken()
      if (!hasAuth) {
        debugLog('[PINBOARD-SERVICE] No auth token configured, testConnection returns false without API call')
        return false
      }

      // PIN-001: Use the user/api_token endpoint to test authentication
      const endpoint = 'user/api_token'
      const response = await this.makeApiRequest(endpoint)

      // PIN-001: If the request succeeds without throwing an error, authentication is valid
      return true
    } catch (error) {
      debugError('Connection test failed:', error)
      // PIN-001: Return false on any authentication failure
      return false
    }
  }

  /**
   * Make API request with authentication and retry logic
   * @param {string} endpoint - API endpoint
   * @param {string} method - HTTP method
   * @returns {Promise<Document>} Parsed XML response
   *
   * PIN-001: Authenticated API request with configuration integration
   * SPECIFICATION: All API requests must include authentication token
   * IMPLEMENTATION DECISION: Centralized authentication and retry logic
   */
  async makeApiRequest (endpoint, method = 'GET') {
    // PIN-001: Verify authentication token exists before making request
    const hasAuth = await this.configManager.hasAuthToken()
    debugLog('🔐 Auth token check:', hasAuth)

    if (!hasAuth) {
      throw new Error('No authentication token configured')
    }

    // PIN-001: Get formatted authentication parameter from config manager
    const authParam = await this.configManager.getAuthTokenParam()
    const url = `${this.apiBase}${endpoint}&${authParam}`

    debugLog('🌐 Making API request to:', url.replace(/auth_token=[^&]+/, 'auth_token=***HIDDEN***'))

    // PIN-004: Use retry logic for network resilience
    return this.makeRequestWithRetry(url, method)
  }

  /**
   * Make HTTP request with retry logic for rate limiting
   * @param {string} url - Request URL
   * @param {string} method - HTTP method
   * @param {number} retryCount - Current retry attempt
   * @returns {Promise<Document>} Response
   *
   * PIN-004: Network resilience with exponential backoff retry
   * SPECIFICATION: Handle rate limiting and network failures gracefully
   * IMPLEMENTATION DECISION: Progressive retry delays with configured maximum attempts
   */
  async makeRequestWithRetry (url, method = 'GET', retryCount = 0) {
    // PIN-004: Get retry configuration from config manager
    const config = await this.configManager.getConfig()

    try {
      debugLog(`🚀 Attempting HTTP ${method} request (attempt ${retryCount + 1})`)

      // PIN-004: Make HTTP request using fetch API
      const response = await fetch(url, { method })

      debugLog(`📡 HTTP response status: ${response.status} ${response.statusText}`)

      // PIN-004: Check for HTTP error responses
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      // PIN-004: Parse XML response text
      const xmlText = await response.text()
      debugLog('📄 Raw XML response:', xmlText.substring(0, 500) + (xmlText.length > 500 ? '...' : ''))

      const parsed = this.parseXmlResponse(xmlText)
      debugLog('✅ Successfully parsed XML response')

      return parsed
    } catch (error) {
      debugError(`💥 HTTP request failed:`, error.message)

      // PIN-004: Determine if error is retryable (network/rate limit issues)
      const isRetryable = this.isRetryableError(error)
      const maxRetries = config.pinRetryCountMax || 2

      if (isRetryable && retryCount < maxRetries) {
        // PIN-004: Calculate delay for progressive backoff
        const delay = this.retryDelays[retryCount] || config.pinRetryDelay || 1000
        debugWarn(`🔄 API request failed, retrying in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`)

        // PIN-004: Wait before retry
        await this.sleep(delay)
        return this.makeRequestWithRetry(url, method, retryCount + 1)
      }

      debugError(`❌ Max retries exceeded or non-retryable error. Giving up.`)

      // PIN-004: Re-throw error if not retryable or max retries exceeded
      throw error
    }
  }

  /**
   * Parse XML response from Pinboard API
   * @param {string} xmlText - XML response text
   * @returns {Object} Parsed XML object
   *
   * PIN-001: XML response parsing with error handling
   * SPECIFICATION: All Pinboard API responses are in XML format
   * IMPLEMENTATION DECISION: Use configured XML parser with error handling
   */
  parseXmlResponse (xmlText) {
    try {
      // PIN-001: Parse XML using configured parser
      return this.xmlParser.parse(xmlText)
    } catch (error) {
      debugError('Failed to parse XML response:', error)
      debugError('XML content:', xmlText)
      // PIN-001: Re-throw parsing errors for caller handling
      throw new Error('Invalid XML response from Pinboard API')
    }
  }

  /**
   * Parse bookmark response from posts/get endpoint
   * @param {Object} xmlObj - Parsed XML object
   * @param {string} url - Original URL
   * @param {string} title - Fallback title
   * @returns {Object} Bookmark object
   *
   * PIN-002: Bookmark data parsing from Pinboard XML format
   * SPECIFICATION: Handle Pinboard's XML structure for bookmark data
   * IMPLEMENTATION DECISION: Normalize XML attributes to standard bookmark object
   */
  parseBookmarkResponse (xmlObj, url, title) {
    try {
      debugLog('🔍 Parsing XML object structure:', JSON.stringify(xmlObj, null, 2))

      // PIN-002: Extract posts array from XML structure
      const posts = xmlObj?.posts?.post

      debugLog('📋 Posts extracted:', posts)
      debugLog('📋 Posts type:', typeof posts)
      debugLog('📋 Posts is array:', Array.isArray(posts))
      debugLog('📋 Posts length:', posts?.length)

      if (posts && posts.length > 0) {
        // PIN-002: Get first post (should only be one for specific URL)
        const post = Array.isArray(posts) ? posts[0] : posts

        debugLog('📄 Processing post:', post)

        // PIN-002: Extract bookmark data from XML attributes. [IMPL-BOOKMARK_CREATE_UPDATE_TIMES] Pinboard has only create-time; updated_at = time.
        const pinTime = post['@_time'] || ''
        const result = {
          url: post['@_href'] || url,
          description: post['@_description'] || title || '',
          extended: post['@_extended'] || '',
          tags: post['@_tag'] ? post['@_tag'].split(' ') : [],
          time: pinTime,
          updated_at: pinTime,
          shared: post['@_shared'] || 'yes',
          toread: post['@_toread'] || 'no',
          hash: post['@_hash'] || ''
        }

        debugLog('✅ Successfully parsed bookmark:', result)
        return result
      }

      if (posts && !Array.isArray(posts)) {
        // Handle case where posts is a single object, not array
        debugLog('📄 Single post object found, processing directly:', posts)

        const pinTime = posts['@_time'] || ''
        const result = {
          url: posts['@_href'] || url,
          description: posts['@_description'] || title || '',
          extended: posts['@_extended'] || '',
          tags: posts['@_tag'] ? posts['@_tag'].split(' ') : [],
          time: pinTime,
          updated_at: pinTime,
          shared: posts['@_shared'] || 'yes',
          toread: posts['@_toread'] || 'no',
          hash: posts['@_hash'] || ''
        }

        debugLog('✅ Successfully parsed single bookmark:', result)
        return result
      }

      debugLog('⚠️ No posts found in XML structure')
      // PIN-002: Return empty bookmark if no posts found
      return this.createEmptyBookmark(url, title)
    } catch (error) {
      debugError('❌ Failed to parse bookmark response:', error)
      // PIN-002: Return empty bookmark on parsing error
      return this.createEmptyBookmark(url, title)
    }
  }

  /**
   * Parse recent bookmarks response from posts/recent endpoint
   * @param {Object} xmlObj - Parsed XML object
   * @returns {Array} Array of bookmark objects
   *
   * PIN-002: Recent bookmarks parsing from Pinboard XML format
   * SPECIFICATION: Handle array of bookmarks from posts/recent endpoint
   * IMPLEMENTATION DECISION: Normalize each bookmark and handle empty responses
   */
  parseRecentBookmarksResponse (xmlObj) {
    try {
      debugLog('[PINBOARD-SERVICE] Parsing recent bookmarks XML object')
      debugLog('[PINBOARD-SERVICE] XML object structure:', JSON.stringify(xmlObj, null, 2))

      // PIN-002: Extract posts array from XML structure
      const posts = xmlObj?.posts?.post

      if (!posts) {
        debugLog('[PINBOARD-SERVICE] No posts found in XML response')
        // PIN-002: Return empty array if no posts
        return []
      }

      // PIN-002: Ensure posts is an array for consistent processing
      const postsArray = Array.isArray(posts) ? posts : [posts]
      debugLog('[PINBOARD-SERVICE] Processing posts array, count:', postsArray.length)

      // PIN-002: Parse each post into normalized bookmark object
      const result = postsArray.map((post, index) => {
        debugLog(`[PINBOARD-SERVICE] Processing post ${index + 1}:`, {
          href: post['@_href'],
          description: post['@_description'],
          tag: post['@_tag'],
          time: post['@_time']
        })

        const tags = post['@_tag'] ? post['@_tag'].split(' ') : []
        debugLog(`[PINBOARD-SERVICE] Post ${index + 1} tags after split:`, tags)

        const pinTime = post['@_time'] || ''
        return {
          url: post['@_href'] || '',
          description: post['@_description'] || '',
          extended: post['@_extended'] || '',
          tags: tags,
          time: pinTime,
          updated_at: pinTime,
          shared: post['@_shared'] || 'yes',
          toread: post['@_toread'] || 'no',
          hash: post['@_hash'] || ''
        }
      })

      debugLog('[PINBOARD-SERVICE] Final parsed bookmarks:', result.map(b => ({
        url: b.url,
        description: b.description,
        tags: b.tags
      })))

      return result
    } catch (error) {
      debugError('[PINBOARD-SERVICE] Failed to parse recent bookmarks response:', error)
      // PIN-002: Return empty array on parsing error
      return []
    }
  }

  /**
   * Parse general API response (for add/delete operations)
   * @param {Object} xmlObj - Parsed XML object
   * @returns {Object} Result object
   *
   * PIN-003: API operation response parsing
   * SPECIFICATION: Handle success/error responses from add/delete operations
   * IMPLEMENTATION DECISION: Extract result code and message for operation feedback
   */
  parseApiResponse (xmlObj) {
    try {
      // PIN-003: Extract result from XML structure
      const result = xmlObj?.result

      // PIN-003: Return normalized result object
      return {
        success: result?.['@_code'] === 'done',
        code: result?.['@_code'] || 'unknown',
        message: result?.['#text'] || 'Operation completed'
      }
    } catch (error) {
      debugError('Failed to parse API response:', error)
      // PIN-003: Return failure result on parsing error
      return {
        success: false,
        code: 'parse_error',
        message: 'Failed to parse API response'
      }
    }
  }

  /**
   * Create empty bookmark object with defaults
   * @param {string} url - URL for bookmark
   * @param {string} title - Title for description
   * @returns {Object} Empty bookmark object
   *
   * PIN-002: Default bookmark structure creation
   * SPECIFICATION: Provide consistent bookmark object structure
   * IMPLEMENTATION DECISION: Include all standard Pinboard bookmark fields with defaults
   */
  createEmptyBookmark (url, title) {
    // PIN-002: Create bookmark object with all standard fields. [IMPL-BOOKMARK_CREATE_UPDATE_TIMES] updated_at = time (empty here).
    return {
      url: url || '',
      description: title || '',
      extended: '',
      tags: [],
      time: '',
      updated_at: '',
      shared: 'yes',
      toread: 'no',
      hash: ''
    }
  }

  /**
   * Build URL parameters for bookmark save operation
   * @param {Object} bookmarkData - Bookmark data
   * @returns {string} URL parameter string
   *
   * PIN-003: Parameter encoding for bookmark save operations
   * SPECIFICATION: Encode all bookmark fields as URL parameters for posts/add
   * IMPLEMENTATION DECISION: Handle both string and array tag formats
   * Explicit encodeURIComponent so tags (and other fields) containing #, +, ., etc. do not break the API request.
   */
  buildSaveParams (bookmarkData) {
    const pairs = []

    if (bookmarkData.url) {
      pairs.push(`url=${encodeURIComponent(bookmarkData.url)}`)
    }
    if (bookmarkData.description) {
      pairs.push(`description=${encodeURIComponent(bookmarkData.description)}`)
    }
    if (bookmarkData.extended) {
      pairs.push(`extended=${encodeURIComponent(bookmarkData.extended)}`)
    }
    if (bookmarkData.tags) {
      const tagsString = Array.isArray(bookmarkData.tags)
        ? bookmarkData.tags.join(' ')
        : bookmarkData.tags
      pairs.push(`tags=${encodeURIComponent(tagsString)}`)
    }
    if (bookmarkData.shared !== undefined) {
      pairs.push(`shared=${encodeURIComponent(String(bookmarkData.shared))}`)
    }
    if (bookmarkData.toread !== undefined) {
      pairs.push(`toread=${encodeURIComponent(String(bookmarkData.toread))}`)
    }

    return pairs.join('&')
  }

  /**
   * Clean URL for consistent API usage
   * @param {string} url - URL to clean
   * @returns {string} Cleaned URL
   *
   * PIN-001: URL normalization for consistent API requests
   * SPECIFICATION: Ensure URLs are properly formatted for Pinboard API
   * IMPLEMENTATION DECISION: Basic trimming and validation, preserve URL structure
   */
  cleanUrl (url) {
    if (!url) return ''

    // PIN-001: Trim whitespace and remove trailing slashes for consistency
    return url.trim().replace(/\/+$/, '')
  }

  /**
   * Check if error is retryable
   * @param {Error} error - Error to check
   * @returns {boolean} Whether error is retryable
   *
   * PIN-004: Error classification for retry logic
   * SPECIFICATION: Only retry network and rate limit errors, not authentication/validation errors
   * IMPLEMENTATION DECISION: Conservative retry logic to avoid infinite loops
   */
  isRetryableError (error) {
    // PIN-004: Check for network-related errors that may be temporary
    if (error.message.includes('fetch')) return true
    if (error.message.includes('timeout')) return true
    if (error.message.includes('429')) return true // Rate limited
    if (error.message.includes('500')) return true // Server error
    if (error.message.includes('502')) return true // Bad gateway
    if (error.message.includes('503')) return true // Service unavailable

    // PIN-004: Don't retry authentication or validation errors
    return false
  }

  /**
   * Sleep utility for retry delays
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise} Promise that resolves after delay
   *
   * PIN-004: Async delay utility for retry logic
   * IMPLEMENTATION DECISION: Promise-based sleep for async/await compatibility
   */
  sleep (ms) {
    // PIN-004: Promise-based delay for retry timing
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
