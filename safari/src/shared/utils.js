/**
 * Modern Utilities - Replaces legacy tools.js
 * Provides common utility functions with modern patterns
 *
 * UTIL-001: URL processing and validation utilities
 * UTIL-002: String manipulation and text processing utilities
 * UTIL-003: Array and object manipulation utilities
 * UTIL-004: Time and async utilities for UI and API operations
 * UTIL-005: DOM utilities for extension content scripts
 */

// [SAFARI-EXT-SHIM-001] 2025-07-15: Safari/Firefox/Chrome browser API abstraction for cross-browser extension support
// This module provides a unified browser API using webextension-polyfill for cross-browser compatibility.
// All extension code should import { browser } from './utils' instead of using chrome.* directly.

import { logger } from './logger.js'
import { browser } from './safari-shim.js'

// [SAFARI-EXT-SHIM-001] Export browser API from Safari shim
export { browser }

/**
 * URL utilities
 *
 * UTIL-001: URL processing system for bookmark management
 * SPECIFICATION: Handle URL normalization, validation, and domain extraction
 */
export const urlUtils = {
  /**
   * Strip hash from URL if configured
   * @param {string} url - Original URL
   * @param {boolean} stripHash - Whether to strip hash
   * @returns {string} - Processed URL
   *
   * UTIL-001: URL normalization with optional hash removal
   * IMPLEMENTATION DECISION: Use URL constructor for reliable parsing, preserve original on error
   */
  processUrl (url, stripHash = false) {
    if (!url) return ''

    try {
      // UTIL-001: Use native URL constructor for reliable URL parsing
      const urlObj = new URL(url)
      if (stripHash) {
        // UTIL-001: Remove hash fragment if requested (for URL matching)
        urlObj.hash = ''
      }
      return urlObj.toString()
    } catch (error) {
      // UTIL-001: Log warning but preserve original URL for graceful degradation
      logger.warn('Invalid URL provided:', url)
      return url
    }
  },

  /**
   * Check if URL is valid
   * @param {string} url - URL to validate
   * @returns {boolean} - Whether URL is valid
   *
   * UTIL-001: URL validation using native URL constructor
   * IMPLEMENTATION DECISION: Simple try/catch validation for broad compatibility
   */
  isValidUrl (url) {
    try {
      // UTIL-001: URL constructor throws on invalid URLs - reliable validation
      const urlObj = new URL(url)
      return !!urlObj
    } catch {
      // UTIL-001: Any exception indicates invalid URL
      return false
    }
  },

  /**
   * Extract domain from URL
   * @param {string} url - URL to process
   * @returns {string} - Domain or empty string
   *
   * UTIL-001: Domain extraction for site-specific features
   * IMPLEMENTATION DECISION: Return empty string on error for safe string operations
   */
  getDomain (url) {
    try {
      // UTIL-001: Extract hostname property for clean domain identification
      return new URL(url).hostname
    } catch {
      // UTIL-001: Return empty string for safe string operations
      return ''
    }
  }
}

/**
 * String utilities
 *
 * UTIL-002: Text processing system for UI display and user input
 * SPECIFICATION: Handle text truncation, cleaning, and HTML escaping
 */
export const stringUtils = {
  /**
   * Truncate string to specified length
   * @param {string} str - String to truncate
   * @param {number} maxLength - Maximum length
   * @param {string} suffix - Suffix to add if truncated
   * @returns {string} - Truncated string
   *
   * UTIL-002: Text truncation for UI display constraints
   * IMPLEMENTATION DECISION: Account for suffix length to maintain total length limit
   */
  truncate (str, maxLength = 100, suffix = '...') {
    if (!str || str.length <= maxLength) return str || ''
    // UTIL-002: Subtract suffix length to maintain total length constraint
    return str.substring(0, maxLength - suffix.length) + suffix
  },

  /**
   * Clean and normalize text
   * @param {string} text - Text to clean
   * @returns {string} - Cleaned text
   *
   * UTIL-002: Text normalization for consistent processing
   * IMPLEMENTATION DECISION: Trim whitespace and collapse multiple spaces
   */
  cleanText (text) {
    if (!text) return ''
    // UTIL-002: Trim and collapse whitespace for clean text processing
    return text.trim().replace(/\s+/g, ' ')
  },

  /**
   * Escape HTML entities
   * @param {string} text - Text to escape
   * @returns {string} - Escaped text
   *
   * UTIL-002: HTML entity escaping for XSS prevention
   * IMPLEMENTATION DECISION: Use DOM textContent for browser-native escaping
   */
  escapeHtml (text) {
    if (!text) return ''
    // UTIL-002: Use DOM element textContent for reliable HTML escaping
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }
}

/**
 * Array utilities
 *
 * UTIL-003: Array manipulation system for data processing
 * SPECIFICATION: Handle deduplication, chunking, and filtering operations
 */
export const arrayUtils = {
  /**
   * Remove duplicates from array
   * @param {Array} arr - Array to deduplicate
   * @returns {Array} - Array without duplicates
   *
   * UTIL-003: Array deduplication using Set
   * IMPLEMENTATION DECISION: Use Set for efficient O(n) deduplication
   */
  unique (arr) {
    // UTIL-003: Set automatically handles deduplication, spread back to array
    return [...new Set(arr)]
  },

  /**
   * Chunk array into smaller arrays
   * @param {Array} arr - Array to chunk
   * @param {number} size - Chunk size
   * @returns {Array[]} - Array of chunks
   *
   * UTIL-003: Array chunking for pagination and batch processing
   * IMPLEMENTATION DECISION: Use slice for efficient chunking without mutation
   */
  chunk (arr, size) {
    const chunks = []
    for (let i = 0; i < arr.length; i += size) {
      // UTIL-003: Slice creates chunks without modifying original array
      chunks.push(arr.slice(i, i + size))
    }
    return chunks
  },

  /**
   * Filter out empty/null/undefined values
   * @param {Array} arr - Array to filter
   * @returns {Array} - Filtered array
   *
   * UTIL-003: Array compaction to remove falsy values
   * IMPLEMENTATION DECISION: Filter null, undefined, and empty strings specifically
   */
  compact (arr) {
    // UTIL-003: Filter out null, undefined, and empty string values
    return arr.filter(item => item != null && item !== '')
  }
}

/**
 * Object utilities
 *
 * UTIL-003: Object manipulation system for configuration and state management
 * SPECIFICATION: Handle deep cloning, emptiness checks, and property selection
 */
export const objectUtils = {
  /**
   * Deep clone an object
   * @param {Object} obj - Object to clone
   * @returns {Object} - Cloned object
   *
   * UTIL-003: Deep object cloning for immutable operations
   * IMPLEMENTATION DECISION: Handle special cases (Date, Array) and recursive structures
   */
  deepClone (obj) {
    if (obj === null || typeof obj !== 'object') return obj
    // UTIL-003: Handle Date objects specially to preserve time values
    if (obj instanceof Date) return new Date(obj.getTime())
    // UTIL-003: Handle Array objects with recursive cloning
    if (obj instanceof Array) return obj.map(item => this.deepClone(item))

    // UTIL-003: Clone plain objects recursively
    const cloned = {}
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        cloned[key] = this.deepClone(obj[key])
      }
    }
    return cloned
  },

  /**
   * Check if object is empty
   * @param {Object} obj - Object to check
   * @returns {boolean} - Whether object is empty
   *
   * UTIL-003: Object emptiness validation
   * IMPLEMENTATION DECISION: Check for null and zero keys for comprehensive emptiness
   */
  isEmpty (obj) {
    // UTIL-003: Check null/undefined and object key count for emptiness
    return obj == null || Object.keys(obj).length === 0
  },

  /**
   * Pick specific keys from object
   * @param {Object} obj - Source object
   * @param {string[]} keys - Keys to pick
   * @returns {Object} - Object with only specified keys
   *
   * UTIL-003: Object property selection for data filtering
   * IMPLEMENTATION DECISION: Only include keys that exist in source object
   */
  pick (obj, keys) {
    const result = {}
    keys.forEach(key => {
      // UTIL-003: Only include keys that exist in source object
      if (key in obj) {
        result[key] = obj[key]
      }
    })
    return result
  }
}

/**
 * Time utilities
 *
 * UTIL-004: Time and async operations for API and UI timing
 * SPECIFICATION: Handle delays, formatting, and relative time calculations
 */
export const timeUtils = {
  /**
   * Sleep for specified milliseconds
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise} - Promise that resolves after delay
   *
   * UTIL-004: Async delay utility for API rate limiting and UI timing
   * IMPLEMENTATION DECISION: Promise-based sleep for modern async/await compatibility
   */
  sleep (ms) {
    // UTIL-004: Promise-based delay for async/await patterns
    return new Promise(resolve => setTimeout(resolve, ms))
  },

  /**
   * Format timestamp for display
   * @param {number|string|Date} timestamp - Timestamp to format
   * @returns {string} - Formatted timestamp
   *
   * UTIL-004: Timestamp formatting for UI display
   * IMPLEMENTATION DECISION: Localized date/time format for user readability
   */
  formatTimestamp (timestamp) {
    const date = new Date(timestamp)
    // UTIL-004: Use toLocaleString for user's locale-appropriate formatting
    return date.toLocaleString()
  },

  /**
   * Get relative time string (e.g., "2 hours ago")
   * @param {number|string|Date} timestamp - Timestamp to process
   * @returns {string} - Relative time string
   *
   * UTIL-004: Relative time calculation for recent activity display
   * IMPLEMENTATION DECISION: Human-readable time differences with fallback formatting
   */
  getRelativeTime (timestamp) {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMinutes = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)

    // UTIL-004: Progressive time unit selection for optimal readability
    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
    // UTIL-004: Fall back to formatted date for older timestamps
    return this.formatTimestamp(timestamp)
  }
}

/**
 * DOM utilities
 *
 * UTIL-005: DOM manipulation system for content scripts and UI
 * SPECIFICATION: Handle element waiting, creation, and attribute management
 */
export const domUtils = {
  /**
   * Wait for element to appear in DOM
   * @param {string} selector - CSS selector
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<Element>} - Found element
   *
   * UTIL-005: DOM element waiting utility for dynamic content
   * IMPLEMENTATION DECISION: MutationObserver for efficient DOM watching with timeout
   */
  waitForElement (selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      // UTIL-005: Check if element already exists
      const existingElement = document.querySelector(selector)
      if (existingElement) {
        resolve(existingElement)
        return
      }

      // UTIL-005: Set up timeout for promise rejection
      const timeoutId = setTimeout(() => {
        observer.disconnect()
        reject(new Error(`Element ${selector} not found within ${timeout}ms`))
      }, timeout)

      // UTIL-005: Use MutationObserver for efficient DOM watching
      const observer = new MutationObserver((mutations, obs) => {
        const element = document.querySelector(selector)
        if (element) {
          clearTimeout(timeoutId)
          obs.disconnect()
          resolve(element)
        }
      })

      // UTIL-005: Observe DOM changes for new elements
      observer.observe(document.body, {
        childList: true,
        subtree: true
      })
    })
  },

  /**
   * Create element with attributes and content
   * @param {string} tag - HTML tag name
   * @param {Object} attributes - Element attributes
   * @param {string} content - Element content
   * @returns {Element} - Created element
   *
   * UTIL-005: DOM element creation utility with full attribute support
   * IMPLEMENTATION DECISION: Comprehensive attribute handling including data attributes and events
   */
  createElement (tag, attributes = {}, content = '') {
    // UTIL-005: Create element with specified tag
    const element = document.createElement(tag)

    // UTIL-005: Set all provided attributes
    Object.entries(attributes).forEach(([key, value]) => {
      if (key.startsWith('on') && typeof value === 'function') {
        // UTIL-005: Handle event listeners
        element.addEventListener(key.substring(2).toLowerCase(), value)
      } else if (key === 'className') {
        // UTIL-005: Handle className property
        element.className = value
      } else if (key === 'style' && typeof value === 'object') {
        // UTIL-005: Handle style object
        Object.assign(element.style, value)
      } else {
        // UTIL-005: Handle standard attributes
        element.setAttribute(key, value)
      }
    })

    // UTIL-005: Set content if provided
    if (content) {
      element.textContent = content
    }

    return element
  }
}

// UTIL-005: Legacy bookmark creation utility
// SPECIFICATION: Maintain compatibility with existing bookmark creation patterns
// IMPLEMENTATION DECISION: Merge existing and additional data with sensible defaults
export function newPin (existing = {}, additional = {}) {
  // UTIL-005: Create new pin object with merged data and timestamp
  return {
    url: '',
    description: '',
    extended: '',
    tags: '',
    dt: new Date().toISOString(),
    hash: '',
    meta: '',
    others: '',
    shared: 'yes',
    toread: 'no',
    ...existing,
    ...additional
  }
}

// UTIL-005: Legacy data validation utility
// SPECIFICATION: Provide fallback values for minimal data requirements
// IMPLEMENTATION DECISION: Return minimal valid object structure with title fallback
export function minEmpty (data, title = '') {
  // UTIL-005: Return minimal bookmark structure with fallback title
  return {
    url: data?.url || '',
    description: data?.description || title || 'Untitled',
    tags: data?.tags || '',
    extended: data?.extended || '',
    shared: data?.shared || 'yes',
    toread: data?.toread || 'no'
  }
}

/**
 * [IMPL-SELECTION_TO_TAG_INPUT] Normalize page selection for tag input prefill.
 * Strips punctuation, takes first 8 words, returns empty string if no words.
 * @param {string} selection - Raw selection text
 * @param {number} maxWords - Max words to keep (default 8)
 * @returns {string} - Normalized string or ''
 */
export function normalizeSelectionForTagInput (selection, maxWords = 8) {
  if (!selection || typeof selection !== 'string') return ''
  const stripped = selection.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim()
  const words = stripped.split(/\s+/).filter(Boolean)
  if (words.length === 0) return ''
  return words.slice(0, maxWords).join(' ')
}

/**
 * Global debug configuration
 * Controls debug output throughout the application
 */
export const DEBUG_CONFIG = {
  enabled: true, // Set to false to disable all debug output
  prefix: '[HOVERBOARD-DEBUG]'
}

/**
 * Debug logging utility
 * Only outputs to console when DEBUG_CONFIG.enabled is true
 * @param {string} component - Component name for the log
 * @param {string} message - Debug message
 * @param {...any} args - Additional arguments to log
 */
export function debugLog (component, message, ...args) {
  if (DEBUG_CONFIG.enabled) {
    const prefix = `${DEBUG_CONFIG.prefix} [${component}]`
    if (args.length > 0) {
      console.log(prefix, message, ...args)
    } else {
      console.log(prefix, message)
    }
  }
}

/**
 * Debug error logging utility
 * Only outputs to console when DEBUG_CONFIG.enabled is true
 * @param {string} component - Component name for the log
 * @param {string} message - Debug message
 * @param {...any} args - Additional arguments to log
 */
export function debugError (component, message, ...args) {
  if (DEBUG_CONFIG.enabled) {
    const prefix = `${DEBUG_CONFIG.prefix} [${component}]`
    if (args.length > 0) {
      console.error(prefix, message, ...args)
    } else {
      console.error(prefix, message)
    }
  }
}

/**
 * Debug warning logging utility
 * Only outputs to console when DEBUG_CONFIG.enabled is true
 * @param {string} component - Component name for the log
 * @param {string} message - Debug message
 * @param {...any} args - Additional arguments to log
 */
export function debugWarn (component, message, ...args) {
  if (DEBUG_CONFIG.enabled) {
    const prefix = `${DEBUG_CONFIG.prefix} [${component}]`
    if (args.length > 0) {
      console.warn(prefix, message, ...args)
    } else {
      console.warn(prefix, message)
    }
  }
}
