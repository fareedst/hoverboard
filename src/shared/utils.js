/**
 * Modern Utilities - Replaces legacy tools.js
 * Provides common utility functions with modern patterns
 *
 * [IMPL-URL_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] URL processing and validation
 * [IMPL-TEXT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] String manipulation and text processing
 * [IMPL-ARRAY_OBJECT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] Array and object manipulation
 * [IMPL-TIME_ASYNC_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] Time and async utilities for UI and API operations
 * [IMPL-DOM_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] DOM utilities for extension content scripts
 */

// [SAFARI-EXT-SHIM-001] 2025-07-15: Safari/Firefox/Chrome browser API abstraction for cross-browser extension support
// This module provides a unified browser API using webextension-polyfill for cross-browser compatibility.
// All extension code should import { browser } from './utils' instead of using chrome.* directly.

import { logger } from './logger.js'
import { browser } from './safari-shim.js'

// [SAFARI-EXT-SHIM-001] Export browser API from Safari shim
export { browser }

/**
 * [IMPL-URL_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] URL utilities: processUrl, isValidUrl, getDomain.
 */
export const urlUtils = {
  /**
   * [IMPL-URL_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] Strip hash from URL if configured.
   * @param {string} url - Original URL
   * @param {boolean} stripHash - Whether to strip hash
   * @returns {string} - Processed URL
   */
  processUrl (url, stripHash = false) {
    if (!url) return ''

    try {
      // IMPL-URL_UTILITIES: Use native URL constructor for reliable URL parsing
      const urlObj = new URL(url)
      if (stripHash) {
        // IMPL-URL_UTILITIES: Remove hash fragment if requested (for URL matching)
        urlObj.hash = ''
      }
      return urlObj.toString()
    } catch (error) {
      // IMPL-URL_UTILITIES: Log warning but preserve original URL for graceful degradation
      logger.warn('Invalid URL provided:', url)
      return url
    }
  },

  /**
   * [IMPL-URL_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] Check if URL is valid.
   * @param {string} url - URL to validate
   * @returns {boolean} - Whether URL is valid
   */
  isValidUrl (url) {
    try {
      // IMPL-URL_UTILITIES: URL constructor throws on invalid URLs - reliable validation
      const urlObj = new URL(url)
      return !!urlObj
    } catch {
      // IMPL-URL_UTILITIES: Any exception indicates invalid URL
      return false
    }
  },

  /**
   * [IMPL-URL_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] Extract domain from URL.
   * @param {string} url - URL to process
   * @returns {string} - Domain or empty string
   */
  getDomain (url) {
    try {
      // IMPL-URL_UTILITIES: Extract hostname property for clean domain identification
      return new URL(url).hostname
    } catch {
      // IMPL-URL_UTILITIES: Return empty string for safe string operations
      return ''
    }
  }
}

/**
 * [IMPL-TEXT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] String utilities: truncate, cleanText, escapeHtml.
 */
export const stringUtils = {
  /**
   * [IMPL-TEXT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] Truncate string to maxLength with suffix.
   * @param {string} str - String to truncate
   * @param {number} maxLength - Maximum length
   * @param {string} suffix - Suffix to add if truncated
   * @returns {string} - Truncated string
   */
  truncate (str, maxLength = 100, suffix = '...') {
    if (!str || str.length <= maxLength) return str || ''
    // IMPL-TEXT_UTILITIES: Subtract suffix length to maintain total length constraint
    return str.substring(0, maxLength - suffix.length) + suffix
  },

  /**
   * [IMPL-TEXT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] Clean and normalize text (trim, collapse spaces).
   * @param {string} text - Text to clean
   * @returns {string} - Cleaned text
   */
  cleanText (text) {
    if (!text) return ''
    // IMPL-TEXT_UTILITIES: Trim and collapse whitespace for clean text processing
    return text.trim().replace(/\s+/g, ' ')
  },

  /**
   * [IMPL-TEXT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] Escape HTML entities (textContent).
   * @param {string} text - Text to escape
   * @returns {string} - Escaped text
   */
  escapeHtml (text) {
    if (!text) return ''
    // IMPL-TEXT_UTILITIES: Use DOM element textContent for reliable HTML escaping
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }
}

/**
 * [IMPL-ARRAY_OBJECT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES]
 * Array utilities: unique, chunk, compact; pure, no mutation.
 */
export const arrayUtils = {
  /**
   * [IMPL-ARRAY_OBJECT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] Dedupe; order by first occurrence.
   */
  unique (arr) {
    return [...new Set(arr)]
  },

  /**
   * [IMPL-ARRAY_OBJECT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] Split into size-sized chunks; last may be shorter.
   */
  chunk (arr, size) {
    const chunks = []
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size))
    }
    return chunks
  },

  /**
   * [IMPL-ARRAY_OBJECT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] Remove falsy (false, null, undefined, 0, "", NaN).
   */
  compact (arr) {
    return arr.filter(item => item != null && item !== '')
  }
}

/**
 * [IMPL-ARRAY_OBJECT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES]
 * Object utilities: deepClone, isEmpty, pick; pure, no mutation.
 */
export const objectUtils = {
  /**
   * [IMPL-ARRAY_OBJECT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] Deep copy; Date/Array/plain object recursively.
   */
  deepClone (obj) {
    if (obj === null || typeof obj !== 'object') return obj
    if (obj instanceof Date) return new Date(obj.getTime())
    if (obj instanceof Array) return obj.map(item => this.deepClone(item))
    const cloned = {}
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        cloned[key] = this.deepClone(obj[key])
      }
    }
    return cloned
  },

  /**
   * [IMPL-ARRAY_OBJECT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] True if null/undefined or no enumerable keys.
   */
  isEmpty (obj) {
    return obj == null || Object.keys(obj).length === 0
  },

  /**
   * [IMPL-ARRAY_OBJECT_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] Subset of object with only specified keys.
   */
  pick (obj, keys) {
    const result = {}
    keys.forEach(key => {
      if (key in obj) {
        result[key] = obj[key]
      }
    })
    return result
  }
}

/**
 * [IMPL-TIME_ASYNC_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] Time utilities: sleep (delay), formatTimestamp, getRelativeTime.
 */
export const timeUtils = {
  /**
   * [IMPL-TIME_ASYNC_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] Sleep for specified milliseconds.
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise} - Promise that resolves after delay
   */
  sleep (ms) {
    // IMPL-TIME_ASYNC_UTILITIES: Promise-based delay for async/await patterns
    return new Promise(resolve => setTimeout(resolve, ms))
  },

  /**
   * [IMPL-TIME_ASYNC_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] Format timestamp for display (toLocaleString).
   * @param {number|string|Date} timestamp - Timestamp to format
   * @returns {string} - Formatted timestamp
   */
  formatTimestamp (timestamp) {
    const date = new Date(timestamp)
    // IMPL-TIME_ASYNC_UTILITIES: Use toLocaleString for user's locale-appropriate formatting
    return date.toLocaleString()
  },

  /**
   * [IMPL-TIME_ASYNC_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] Get relative time string (e.g. "2 hours ago").
   * @param {number|string|Date} timestamp - Timestamp to process
   * @returns {string} - Relative time string
   */
  getRelativeTime (timestamp) {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMinutes = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)

    // IMPL-TIME_ASYNC_UTILITIES: Progressive time unit selection for optimal readability
    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
    // IMPL-TIME_ASYNC_UTILITIES: Fall back to formatted date for older timestamps
    return this.formatTimestamp(timestamp)
  }
}

/**
 * [IMPL-DOM_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] DOM utilities: waitForElement (MutationObserver), createElement, legacy pin helpers.
 */
export const domUtils = {
  /**
   * [IMPL-DOM_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] Wait for selector in DOM via MutationObserver with timeout.
   */
  waitForElement (selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      // [IMPL-DOM_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] Check if element already exists
      const existingElement = document.querySelector(selector)
      if (existingElement) {
        resolve(existingElement)
        return
      }

      // [IMPL-DOM_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] Timeout for promise rejection
      const timeoutId = setTimeout(() => {
        observer.disconnect()
        reject(new Error(`Element ${selector} not found within ${timeout}ms`))
      }, timeout)

      // [IMPL-DOM_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] MutationObserver for DOM watching
      const observer = new MutationObserver((mutations, obs) => {
        const element = document.querySelector(selector)
        if (element) {
          clearTimeout(timeoutId)
          obs.disconnect()
          resolve(element)
        }
      })

      // [IMPL-DOM_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] Observe document.body for new elements
      observer.observe(document.body, {
        childList: true,
        subtree: true
      })
    })
  },

  /**
   * [IMPL-DOM_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] Create element with tag, attributes, and content.
   */
  createElement (tag, attributes = {}, content = '') {
    const element = document.createElement(tag)
    Object.entries(attributes).forEach(([key, value]) => {
      if (key.startsWith('on') && typeof value === 'function') {
        element.addEventListener(key.substring(2).toLowerCase(), value)
      } else if (key === 'className') {
        element.className = value
      } else if (key === 'style' && typeof value === 'object') {
        Object.assign(element.style, value)
      } else {
        element.setAttribute(key, value)
      }
    })
    if (content) {
      element.textContent = content
    }

    return element
  }
}

// [IMPL-DOM_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] Legacy createPinFromFormData-style: new pin with merged data and timestamp.
export function newPin (existing = {}, additional = {}) {
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

// [IMPL-DOM_UTILITIES] [ARCH-SHARED_UTILITIES] [REQ-SHARED_UTILITIES] Legacy validatePinFormData-style: minimal bookmark structure with fallback title.
export function minEmpty (data, title = '') {
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
 * [IMPL-SELECTION_TO_TAG_INPUT] [ARCH-SELECTION_TO_TAG_INPUT] [REQ-SELECTION_TO_TAG_INPUT] [REQ-TAG_MANAGEMENT] Normalize page selection for tag input prefill (strip punctuation, first maxWords).
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
