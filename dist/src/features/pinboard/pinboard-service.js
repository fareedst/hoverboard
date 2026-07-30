/**
 * [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]
 * Token auth, endpoint wrappers (/posts/get, recent, add, delete), 429 retry, 401 handling.
 */

/**
 * === IMPL-FULL-BLOCK: IMPL-BOOKMARK_CREATE_UPDATE_TIMES ===
 * [IMPL-BOOKMARK_CREATE_UPDATE_TIMES] [ARCH-BOOKMARK_CREATE_UPDATE_TIMES] [REQ-BOOKMARK_CREATE_UPDATE_TIMES] — Every bookmark has time (create) and updated_at (last update); provider-specific set/normalize; export/import include.
 *
 * ## PINBOARD
 *
 * - [IMPL-BOOKMARK_CREATE_UPDATE_TIMES] [ARCH-BOOKMARK_CREATE_UPDATE_TIMES] [REQ-BOOKMARK_CREATE_UPDATE_TIMES] — import create preserves CSV/JSON Time and Updated. How: Implements Pinboard behavior for IMPL-BOOKMARK_CREATE_UPDATE_TIMES.
 * - Contract:
 *   - INPUT: bookmark data (for save), API response (for Pinboard), raw record (for normalize)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: bookmark with time and updated_at set per provider and context
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: time = create time; updated_at = last update time
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: PINBOARD
 *   - parseBookmarkResponse / createEmptyBookmark: SET updated_at = time (API has no updated_at)
 *   - SEND to API: do NOT include updated_at
 *   - How (sub-block): If missing updated_at set to time (legacy); include updated_at in payload/CSV/JSON.
 *   - 1. Normalize (url-tags-manager, display, move, export/import):
 *   - IF bookmark has no updated_at: SET updated_at = time   // legacy
 *   - ELSE: keep updated_at
 *   - Include updated_at in payload/CSV/JSON
 *
 * === END IMPL-FULL-BLOCK: IMPL-BOOKMARK_CREATE_UPDATE_TIMES ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-PINBOARD_API ===
 * [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY] — Token auth, endpoint wrappers, 429 retry, 401 handling; get/save/delete/recent. Contract: token and params; API response; base URL and endpoints.
 *
 * ## REQUEST
 *
 * - [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY] How: Implements request(endpoint, params) behavior for IMPL-PINBOARD_API.
 * - Contract:
 *   - INPUT: auth token; endpoint params (url, tag, etc.); optional retry policy
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: API response (bookmark list, success/error); 401/429 handled | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: base URL; token in query; endpoints /posts/get, /posts/recent, /posts/add, /posts/delete
 *   - EFFECTS: Http, IO
 *   - TERMINATION: total
 * - PROCEDURE: REQUEST
 *   - URL = base + endpoint + "?auth_token=" + token + queryString(params)
 *   - response = FETCH URL
 *   - IF 429: WAIT; RETRY with backoff
 *   - IF 401: RETURN error (auth failed)
 *   - RETURN parsed response
 *   - How (sub-block): Provider methods delegate to request with appropriate endpoint.
 *   - 1. getBookmarkForUrl(url): request("/posts/get", { url }); RETURN single post or null
 *   - 2. getRecentBookmarks(count): request("/posts/recent", { count }); RETURN list
 *   - 3. saveBookmark(data): request("/posts/add", data); RETURN result
 *   - 4. deleteBookmark(url): request("/posts/delete", { url }); RETURN result
 *
 * === END IMPL-FULL-BLOCK: IMPL-PINBOARD_API ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-PINBOARD_POSTS_ADD_ENCODING ===
 * [IMPL-PINBOARD_POSTS_ADD_ENCODING] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY] — buildSaveParams with encodeURIComponent for posts/add so #, +, etc. are safe. Contract: bookmarkData in; encoded query string out.
 *
 * ## BUILD_SAVE_PARAMS
 *
 * - [IMPL-PINBOARD_POSTS_ADD_ENCODING] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY] How: Implements buildSaveParams(bookmarkData) behavior for IMPL-PINBOARD_POSTS_ADD_ENCODING.
 * - Contract:
 *   - INPUT: bookmarkData (url, description, extended, tags, shared, toread)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: query string safe for posts/add URL (no raw #, +, &, = in values)
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: param names and values from bookmarkData
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: BUILD_SAVE_PARAMS
 *   - pairs = []
 *   - FOR each key in [url, description, extended, tags, shared, toread]:
 *   - value = bookmarkData[key] (or default)
 *   - encoded = encodeURIComponent(value)
 *   - pairs.push(key + "=" + encoded)
 *   - RETURN pairs.join("&")
 *   - How (sub-block): Use result in posts/add URL so fragment and plus are not misinterpreted.
 *   - 1. usage: BUILD posts/add request URL as baseUrl + "?" + buildSaveParams(bookmarkData) so fragment and plus are not misinterpreted by server or transport.
 *
 * === END IMPL-FULL-BLOCK: IMPL-PINBOARD_POSTS_ADD_ENCODING ===
 */
import { ConfigManager } from '../../config/config-manager.js'
import { TagService } from '../tagging/tag-service.js' // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Import TagService
import { XMLParser } from 'fast-xml-parser'
import { debugLog, debugError, debugWarn } from '../../shared/utils.js'

debugLog('[SAFARI-EXT-SHIM-001] pinboard-service.js: module loaded')

export class PinboardService {
  constructor (tagService = null) {
    // [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Configuration manager integration for authentication and settings
    this.configManager = new ConfigManager()
    // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Tag service integration for tag tracking
    this.tagService = tagService || new TagService(this)
    // [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Pinboard API base URL - official API endpoint
    // SPECIFICATION: Use official Pinboard API v1 endpoint for all operations
    this.apiBase = 'https://api.pinboard.in/v1/'
    // [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Progressive retry delays for rate limiting compliance
    // IMPLEMENTATION DECISION: Exponential backoff to respect API rate limits
    this.retryDelays = [1000, 2000, 5000] // Progressive retry delays

    // [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: XML parser configuration for Pinboard API responses
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
   * [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Single bookmark retrieval by URL
   * SPECIFICATION: Use posts/get endpoint to fetch bookmark for specific URL
   * IMPLEMENTATION DECISION: Provide fallback data on failure for UI stability
   */
  async getBookmarkForUrl (url, title = '') {
    try {
      // [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Do not call Pinboard API when credentials are not present
      const hasAuth = await this.configManager.hasAuthToken()
      if (!hasAuth) {
        debugLog('[PINBOARD-SERVICE] No auth token configured, returning empty bookmark without API call')
        return this.createEmptyBookmark(url, title)
      }

      // [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Clean URL before API request for consistent matching
      const cleanUrl = this.cleanUrl(url)
      const endpoint = `posts/get?url=${encodeURIComponent(cleanUrl)}`

      debugLog('Making Pinboard API request:', {
        endpoint,
        cleanUrl,
        originalUrl: url
      })

      const response = await this.makeApiRequest(endpoint)

      debugLog('📥 Pinboard API response received:', response)

      // [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Parse XML response into bookmark object
      const parsed = this.parseBookmarkResponse(response, cleanUrl, title)

      debugLog('📋 Parsed bookmark result:', parsed)

      return parsed
    } catch (error) {
      debugError('❌ Failed to get bookmark for URL:', error)
      debugError('❌ Error details:', error.message)
      debugError('❌ Full error:', error)

      // [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Return empty bookmark structure on failure for UI consistency
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
   * [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Recent bookmarks retrieval for dashboard display
   * SPECIFICATION: Use posts/recent endpoint with count parameter
   * IMPLEMENTATION DECISION: Return empty array on failure to prevent UI errors
   */
  async getRecentBookmarks (count = 15) {
    try {
      // [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Do not call Pinboard API when credentials are not present
      const hasAuth = await this.configManager.hasAuthToken()
      if (!hasAuth) {
        debugLog('[PINBOARD-SERVICE] No auth token configured, returning empty recent list without API call')
        return []
      }

      debugLog('[PINBOARD-SERVICE] Getting recent bookmarks, count:', count)

      // [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Fetch recent bookmarks with specified count
      const endpoint = `posts/recent?count=${count}`
      const response = await this.makeApiRequest(endpoint)

      debugLog('[PINBOARD-SERVICE] Raw API response received')

      // [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Parse XML response into bookmark array
      const result = this.parseRecentBookmarksResponse(response)
      debugLog('[PINBOARD-SERVICE] Parsed recent bookmarks:', result.map(b => ({
        url: b.url,
        description: b.description,
        tags: b.tags
      })))

      return result
    } catch (error) {
      debugError('[PINBOARD-SERVICE] Failed to get recent bookmarks:', error)
      // [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Return empty array on failure for UI stability
      return []
    }
  }

  /**
   * Save a bookmark to Pinboard
   * @param {Object} bookmarkData - Bookmark data to save
   * @returns {Promise<Object>} Save result
   *
   * [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Bookmark creation/update operation
   * SPECIFICATION: Use posts/add endpoint to save bookmark with all metadata
   * IMPLEMENTATION DECISION: Re-throw errors to allow caller error handling
   * [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Enhanced with tag tracking
   */
  async saveBookmark (bookmarkData) {
    try {
      // [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Do not call Pinboard API when credentials are not present
      const hasAuth = await this.configManager.hasAuthToken()
      if (!hasAuth) {
        debugLog('[PINBOARD-SERVICE] No auth token configured, skipping save without API call')
        return { success: false, code: 'no_auth', message: 'No authentication token configured' }
      }

      // [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Build URL parameters from bookmark data
      const params = this.buildSaveParams(bookmarkData)
      const endpoint = `posts/add?${params}`
      const response = await this.makeApiRequest(endpoint, 'GET')

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Track tags after successful save
      await this.trackBookmarkTags(bookmarkData)

      // [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Parse API response for save confirmation
      return this.parseApiResponse(response)
    } catch (error) {
      debugError('Failed to save bookmark:', error)
      // [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Re-throw to allow caller to handle save failures
      throw error
    }
  }

  /**
   * Save a tag to an existing bookmark
   * @param {Object} tagData - Tag data to save
   * @returns {Promise<Object>} Save result
   *
   * [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Tag addition to existing bookmark
   * SPECIFICATION: Retrieve current bookmark, add tag, then save updated bookmark
   * IMPLEMENTATION DECISION: Merge tags to preserve existing tags while adding new ones
   * [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Enhanced with tag tracking
   */
  async saveTag (tagData) {
    try {
      // [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Get current bookmark data to preserve existing tags
      const currentBookmark = await this.getBookmarkForUrl(tagData.url)

      // [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Add new tag to existing tags array
      const existingTags = currentBookmark.tags || []
      const newTags = [...existingTags]

      if (tagData.value && !existingTags.includes(tagData.value)) {
        // [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Only add tag if it doesn't already exist
        newTags.push(tagData.value)
      }

      // [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Save updated bookmark with merged tags
      const updatedBookmark = {
        ...currentBookmark,
        ...tagData,
        tags: newTags.join(' ')
      }

      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Track the new tag specifically
      if (tagData.value) {
        await this.tagService.handleTagAddition(tagData.value, updatedBookmark)
      }

      return this.saveBookmark(updatedBookmark)
    } catch (error) {
      debugError('Failed to save tag:', error)
      // [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Re-throw to allow caller error handling
      throw error
    }
  }

  /**
   * Delete a bookmark from Pinboard
   * @param {string} url - URL of bookmark to delete
   * @returns {Promise<Object>} Delete result
   *
   * [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Bookmark deletion operation
   * SPECIFICATION: Use posts/delete endpoint to remove bookmark by URL
   * IMPLEMENTATION DECISION: Clean URL before deletion for consistent matching
   */
  async deleteBookmark (url) {
    try {
      // [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Do not call Pinboard API when credentials are not present
      const hasAuth = await this.configManager.hasAuthToken()
      if (!hasAuth) {
        debugLog('[PINBOARD-SERVICE] No auth token configured, skipping delete without API call')
        return { success: false, code: 'no_auth', message: 'No authentication token configured' }
      }

      // [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Clean URL for consistent deletion matching
      const cleanUrl = this.cleanUrl(url)
      const endpoint = `posts/delete?url=${encodeURIComponent(cleanUrl)}`
      const response = await this.makeApiRequest(endpoint)

      // [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Parse API response for deletion confirmation
      return this.parseApiResponse(response)
    } catch (error) {
      debugError('Failed to delete bookmark:', error)
      // [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Re-throw to allow caller error handling
      throw error
    }
  }

  /**
   * [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Track tags from bookmark data
   * @param {Object} bookmarkData - Bookmark data containing tags
   * @returns {Promise<void>}
   */
  async trackBookmarkTags (bookmarkData) {
    try {
      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Extract tags from bookmark data
      const tags = this.extractTagsFromBookmarkData(bookmarkData)
      // Sanitize, deduplicate, and filter empty tags
      const sanitizedTags = Array.from(new Set(tags.map(tag => this.tagService.sanitizeTag(tag)).filter(Boolean)))
      if (sanitizedTags.length > 0) {
        // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Track each tag individually
        for (const sanitizedTag of sanitizedTags) {
          await this.tagService.handleTagAddition(sanitizedTag, bookmarkData)
        }
        debugLog('[IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] Tracked tags for bookmark:', sanitizedTags)
      }
    } catch (error) {
      debugError('[IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] Failed to track bookmark tags:', error)
      // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Don't throw error to avoid breaking bookmark save
    }
  }

  /**
   * [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Enhanced error handling for tag operations
   * @param {Error} error - The error that occurred
   * @param {string} operation - The operation that failed
   * @param {Object} context - Additional context data
   * @returns {Promise<void>}
   */
  async handleTagError (error, operation, context = {}) {
    // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Log error with context
    debugError(`[IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] Tag operation failed: ${operation}`, {
      error: error.message,
      stack: error.stack,
      context
    })

    // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Attempt recovery based on error type
    if (error.name === 'QuotaExceededError') {
      try {
        await this.tagService.cleanupOldTags()
        debugLog('[IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] Attempted cleanup after quota exceeded')
      } catch (cleanupError) {
        debugError('[IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] Cleanup also failed:', cleanupError)
      }
    }

    // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Notify user of tag operation failure
    try {
      await this.notifyUserOfTagError(operation, error.message)
    } catch (notificationError) {
      debugError('[IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] Failed to notify user:', notificationError)
    }
  }

  /**
   * [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Notify user of tag operation errors
   * @param {string} operation - The operation that failed
   * @param {string} errorMessage - The error message
   * @returns {Promise<void>}
   */
  async notifyUserOfTagError (operation, errorMessage) {
    // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Create user-friendly error message
    const userMessage = `Tag ${operation} failed, but bookmark was saved. Error: ${errorMessage}`

    // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Log user notification
    debugWarn('[IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] User notification:', userMessage)

    // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Could be extended to show browser notification
    // For now, just log the message
  }

  /**
   * [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Extract tags from bookmark data
   * @param {Object} bookmarkData - Bookmark data
   * @returns {string[]} Array of tags
   */
  extractTagsFromBookmarkData (bookmarkData) {
    const tags = []

    // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Extract tags from tags field
    if (bookmarkData.tags) {
      if (typeof bookmarkData.tags === 'string') {
        // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Split space-separated tags
        const tagArray = bookmarkData.tags.split(/\s+/).filter(tag => tag.trim())
        tags.push(...tagArray)
      } else if (Array.isArray(bookmarkData.tags)) {
        // [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_MANAGEMENT] - Use array of tags directly
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
   * [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Tag removal from existing bookmark
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
      // [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Re-throw to allow caller error handling
      throw error
    }
  }

  /**
   * Test authentication with Pinboard API
   * @returns {Promise<boolean>} True if authentication is valid
   *
   * [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Authentication validation using API endpoint
   * SPECIFICATION: Use user/api_token endpoint to verify authentication
   * IMPLEMENTATION DECISION: Simple boolean return for easy authentication checking
   */
  async testConnection () {
    try {
      // [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Do not call Pinboard API when credentials are not present
      const hasAuth = await this.configManager.hasAuthToken()
      if (!hasAuth) {
        debugLog('[PINBOARD-SERVICE] No auth token configured, testConnection returns false without API call')
        return false
      }

      // [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Use the user/api_token endpoint to test authentication
      const endpoint = 'user/api_token'
      const response = await this.makeApiRequest(endpoint)

      // [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: If the request succeeds without throwing an error, authentication is valid
      return true
    } catch (error) {
      debugError('Connection test failed:', error)
      // [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Return false on any authentication failure
      return false
    }
  }

  /**
   * Make API request with authentication and retry logic
   * @param {string} endpoint - API endpoint
   * @param {string} method - HTTP method
   * @returns {Promise<Document>} Parsed XML response
   *
   * [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Authenticated API request with configuration integration
   * SPECIFICATION: All API requests must include authentication token
   * IMPLEMENTATION DECISION: Centralized authentication and retry logic
   */
  async makeApiRequest (endpoint, method = 'GET') {
    // [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Verify authentication token exists before making request
    const hasAuth = await this.configManager.hasAuthToken()
    debugLog('🔐 Auth token check:', hasAuth)

    if (!hasAuth) {
      throw new Error('No authentication token configured')
    }

    // [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Get formatted authentication parameter from config manager
    const authParam = await this.configManager.getAuthTokenParam()
    const url = `${this.apiBase}${endpoint}&${authParam}`

    debugLog('🌐 Making API request to:', url.replace(/auth_token=[^&]+/, 'auth_token=***HIDDEN***'))

    // [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Use retry logic for network resilience
    return this.makeRequestWithRetry(url, method)
  }

  /**
   * Make HTTP request with retry logic for rate limiting
   * @param {string} url - Request URL
   * @param {string} method - HTTP method
   * @param {number} retryCount - Current retry attempt
   * @returns {Promise<Document>} Response
   *
   * [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Network resilience with exponential backoff retry
   * SPECIFICATION: Handle rate limiting and network failures gracefully
   * IMPLEMENTATION DECISION: Progressive retry delays with configured maximum attempts
   */
  async makeRequestWithRetry (url, method = 'GET', retryCount = 0) {
    // [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Get retry configuration from config manager
    const config = await this.configManager.getConfig()

    try {
      debugLog(`🚀 Attempting HTTP ${method} request (attempt ${retryCount + 1})`)

      // [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Make HTTP request using fetch API
      const response = await fetch(url, { method })

      debugLog(`📡 HTTP response status: ${response.status} ${response.statusText}`)

      // [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Check for HTTP error responses
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      // [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Parse XML response text
      const xmlText = await response.text()
      debugLog('📄 Raw XML response:', xmlText.substring(0, 500) + (xmlText.length > 500 ? '...' : ''))

      const parsed = this.parseXmlResponse(xmlText)
      debugLog('✅ Successfully parsed XML response')

      return parsed
    } catch (error) {
      debugError('💥 HTTP request failed:', error.message)

      // [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Determine if error is retryable (network/rate limit issues)
      const isRetryable = this.isRetryableError(error)
      const maxRetries = config.pinRetryCountMax || 2

      if (isRetryable && retryCount < maxRetries) {
        // [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Calculate delay for progressive backoff
        const delay = this.retryDelays[retryCount] || config.pinRetryDelay || 1000
        debugWarn(`🔄 API request failed, retrying in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`)

        // [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Wait before retry
        await this.sleep(delay)
        return this.makeRequestWithRetry(url, method, retryCount + 1)
      }

      debugError('❌ Max retries exceeded or non-retryable error. Giving up.')

      // [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Re-throw error if not retryable or max retries exceeded
      throw error
    }
  }

  /**
   * Parse XML response from Pinboard API
   * @param {string} xmlText - XML response text
   * @returns {Object} Parsed XML object
   *
   * [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: XML response parsing with error handling
   * SPECIFICATION: All Pinboard API responses are in XML format
   * IMPLEMENTATION DECISION: Use configured XML parser with error handling
   */
  parseXmlResponse (xmlText) {
    try {
      // [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Parse XML using configured parser
      return this.xmlParser.parse(xmlText)
    } catch (error) {
      debugError('Failed to parse XML response:', error)
      debugError('XML content:', xmlText)
      // [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Re-throw parsing errors for caller handling
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
   * [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Bookmark data parsing from Pinboard XML format
   * SPECIFICATION: Handle Pinboard's XML structure for bookmark data
   * IMPLEMENTATION DECISION: Normalize XML attributes to standard bookmark object
   */
  parseBookmarkResponse (xmlObj, url, title) {
    try {
      debugLog('Parsing XML object structure:', JSON.stringify(xmlObj, null, 2))

      // [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Extract posts array from XML structure
      const posts = xmlObj?.posts?.post

      debugLog('📋 Posts extracted:', posts)
      debugLog('📋 Posts type:', typeof posts)
      debugLog('📋 Posts is array:', Array.isArray(posts))
      debugLog('📋 Posts length:', posts?.length)

      if (posts && posts.length > 0) {
        // [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Get first post (should only be one for specific URL)
        const post = Array.isArray(posts) ? posts[0] : posts

        debugLog('📄 Processing post:', post)

        // [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Extract bookmark data from XML attributes. [IMPL-BOOKMARK_CREATE_UPDATE_TIMES] Pinboard has only create-time; updated_at = time.
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
      // [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Return empty bookmark if no posts found
      return this.createEmptyBookmark(url, title)
    } catch (error) {
      debugError('❌ Failed to parse bookmark response:', error)
      // [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Return empty bookmark on parsing error
      return this.createEmptyBookmark(url, title)
    }
  }

  /**
   * Parse recent bookmarks response from posts/recent endpoint
   * @param {Object} xmlObj - Parsed XML object
   * @returns {Array} Array of bookmark objects
   *
   * [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Recent bookmarks parsing from Pinboard XML format
   * SPECIFICATION: Handle array of bookmarks from posts/recent endpoint
   * IMPLEMENTATION DECISION: Normalize each bookmark and handle empty responses
   */
  parseRecentBookmarksResponse (xmlObj) {
    try {
      debugLog('[PINBOARD-SERVICE] Parsing recent bookmarks XML object')
      debugLog('[PINBOARD-SERVICE] XML object structure:', JSON.stringify(xmlObj, null, 2))

      // [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Extract posts array from XML structure
      const posts = xmlObj?.posts?.post

      if (!posts) {
        debugLog('[PINBOARD-SERVICE] No posts found in XML response')
        // [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Return empty array if no posts
        return []
      }

      // [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Ensure posts is an array for consistent processing
      const postsArray = Array.isArray(posts) ? posts : [posts]
      debugLog('[PINBOARD-SERVICE] Processing posts array, count:', postsArray.length)

      // [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Parse each post into normalized bookmark object
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
          tags,
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
      // [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Return empty array on parsing error
      return []
    }
  }

  /**
   * Parse general API response (for add/delete operations)
   * @param {Object} xmlObj - Parsed XML object
   * @returns {Object} Result object
   *
   * [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: API operation response parsing
   * SPECIFICATION: Handle success/error responses from add/delete operations
   * IMPLEMENTATION DECISION: Extract result code and message for operation feedback
   */
  parseApiResponse (xmlObj) {
    try {
      // [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Extract result from XML structure
      const result = xmlObj?.result

      // [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Return normalized result object
      return {
        success: result?.['@_code'] === 'done',
        code: result?.['@_code'] || 'unknown',
        message: result?.['#text'] || 'Operation completed'
      }
    } catch (error) {
      debugError('Failed to parse API response:', error)
      // [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Return failure result on parsing error
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
   * [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Default bookmark structure creation
   * SPECIFICATION: Provide consistent bookmark object structure
   * IMPLEMENTATION DECISION: Include all standard Pinboard bookmark fields with defaults
   */
  createEmptyBookmark (url, title) {
    // [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Create bookmark object with all standard fields. [IMPL-BOOKMARK_CREATE_UPDATE_TIMES] updated_at = time (empty here).
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
   * [IMPL-PINBOARD_POSTS_ADD_ENCODING] [IMPL-PINBOARD_API] [IMPL-TAG_SYSTEM] Build posts/add query string with encodeURIComponent for url, description, extended, tags, shared, toread.
   * @param {Object} bookmarkData - Bookmark data
   * @returns {string} URL parameter string (key=encodedValue&...)
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
   * [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: URL normalization for consistent API requests
   * SPECIFICATION: Ensure URLs are properly formatted for Pinboard API
   * IMPLEMENTATION DECISION: Basic trimming and validation, preserve URL structure
   */
  cleanUrl (url) {
    if (!url) return ''

    // [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Trim whitespace and remove trailing slashes for consistency
    return url.trim().replace(/\/+$/, '')
  }

  /**
   * Check if error is retryable
   * @param {Error} error - Error to check
   * @returns {boolean} Whether error is retryable
   *
   * [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Error classification for retry logic
   * SPECIFICATION: Only retry network and rate limit errors, not authentication/validation errors
   * IMPLEMENTATION DECISION: Conservative retry logic to avoid infinite loops
   */
  isRetryableError (error) {
    // [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Check for network-related errors that may be temporary
    if (error.message.includes('fetch')) return true
    if (error.message.includes('timeout')) return true
    if (error.message.includes('429')) return true // Rate limited
    if (error.message.includes('500')) return true // Server error
    if (error.message.includes('502')) return true // Bad gateway
    if (error.message.includes('503')) return true // Service unavailable

    // [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Don't retry authentication or validation errors
    return false
  }

  /**
   * Sleep utility for retry delays
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise} Promise that resolves after delay
   *
   * [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Async delay utility for retry logic
   * IMPLEMENTATION DECISION: Promise-based sleep for async/await compatibility
   */
  sleep (ms) {
    // [IMPL-PINBOARD_API] [ARCH-PINBOARD_API] [REQ-PINBOARD_COMPATIBILITY]: Promise-based delay for retry timing
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
