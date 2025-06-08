/**
 * Modern Utilities - Replaces legacy tools.js
 * Provides common utility functions with modern patterns
 */

import { logger } from './logger.js'

/**
 * URL utilities
 */
export const urlUtils = {
  /**
   * Strip hash from URL if configured
   * @param {string} url - Original URL
   * @param {boolean} stripHash - Whether to strip hash
   * @returns {string} - Processed URL
   */
  processUrl (url, stripHash = false) {
    if (!url) return ''

    try {
      const urlObj = new URL(url)
      if (stripHash) {
        urlObj.hash = ''
      }
      return urlObj.toString()
    } catch (error) {
      logger.warn('Invalid URL provided:', url)
      return url
    }
  },

  /**
   * Check if URL is valid
   * @param {string} url - URL to validate
   * @returns {boolean} - Whether URL is valid
   */
  isValidUrl (url) {
    try {
      const urlObj = new URL(url)
      return !!urlObj
    } catch {
      return false
    }
  },

  /**
   * Extract domain from URL
   * @param {string} url - URL to process
   * @returns {string} - Domain or empty string
   */
  getDomain (url) {
    try {
      return new URL(url).hostname
    } catch {
      return ''
    }
  }
}

/**
 * String utilities
 */
export const stringUtils = {
  /**
   * Truncate string to specified length
   * @param {string} str - String to truncate
   * @param {number} maxLength - Maximum length
   * @param {string} suffix - Suffix to add if truncated
   * @returns {string} - Truncated string
   */
  truncate (str, maxLength = 100, suffix = '...') {
    if (!str || str.length <= maxLength) return str || ''
    return str.substring(0, maxLength - suffix.length) + suffix
  },

  /**
   * Clean and normalize text
   * @param {string} text - Text to clean
   * @returns {string} - Cleaned text
   */
  cleanText (text) {
    if (!text) return ''
    return text.trim().replace(/\s+/g, ' ')
  },

  /**
   * Escape HTML entities
   * @param {string} text - Text to escape
   * @returns {string} - Escaped text
   */
  escapeHtml (text) {
    if (!text) return ''
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }
}

/**
 * Array utilities
 */
export const arrayUtils = {
  /**
   * Remove duplicates from array
   * @param {Array} arr - Array to deduplicate
   * @returns {Array} - Array without duplicates
   */
  unique (arr) {
    return [...new Set(arr)]
  },

  /**
   * Chunk array into smaller arrays
   * @param {Array} arr - Array to chunk
   * @param {number} size - Chunk size
   * @returns {Array[]} - Array of chunks
   */
  chunk (arr, size) {
    const chunks = []
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size))
    }
    return chunks
  },

  /**
   * Filter out empty/null/undefined values
   * @param {Array} arr - Array to filter
   * @returns {Array} - Filtered array
   */
  compact (arr) {
    return arr.filter(item => item != null && item !== '')
  }
}

/**
 * Object utilities
 */
export const objectUtils = {
  /**
   * Deep clone an object
   * @param {Object} obj - Object to clone
   * @returns {Object} - Cloned object
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
   * Check if object is empty
   * @param {Object} obj - Object to check
   * @returns {boolean} - Whether object is empty
   */
  isEmpty (obj) {
    return obj == null || Object.keys(obj).length === 0
  },

  /**
   * Pick specific keys from object
   * @param {Object} obj - Source object
   * @param {string[]} keys - Keys to pick
   * @returns {Object} - Object with only specified keys
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
 * Time utilities
 */
export const timeUtils = {
  /**
   * Sleep for specified milliseconds
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise} - Promise that resolves after delay
   */
  sleep (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  },

  /**
   * Format timestamp for display
   * @param {number|Date} timestamp - Timestamp to format
   * @returns {string} - Formatted timestamp
   */
  formatTimestamp (timestamp) {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp)
    return date.toLocaleString()
  },

  /**
   * Get relative time string (e.g., "2 minutes ago")
   * @param {number|Date} timestamp - Timestamp to compare
   * @returns {string} - Relative time string
   */
  getRelativeTime (timestamp) {
    const now = Date.now()
    const time = timestamp instanceof Date ? timestamp.getTime() : timestamp
    const diff = now - time

    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    return 'Just now'
  }
}

/**
 * DOM utilities (for content scripts)
 */
export const domUtils = {
  /**
   * Wait for element to exist in DOM
   * @param {string} selector - CSS selector
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<Element>} - Promise that resolves with element
   */
  waitForElement (selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector)
      if (element) {
        resolve(element)
        return
      }

      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector)
        if (element) {
          observer.disconnect()
          resolve(element)
        }
      })

      observer.observe(document.body, {
        childList: true,
        subtree: true
      })

      setTimeout(() => {
        observer.disconnect()
        reject(new Error(`Element ${selector} not found within ${timeout}ms`))
      }, timeout)
    })
  },

  /**
   * Create element with attributes and content
   * @param {string} tag - HTML tag name
   * @param {Object} attributes - Element attributes
   * @param {string|Node} content - Element content
   * @returns {Element} - Created element
   */
  createElement (tag, attributes = {}, content = '') {
    const element = document.createElement(tag)

    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'className') {
        element.className = value
      } else if (key === 'style' && typeof value === 'object') {
        Object.assign(element.style, value)
      } else {
        element.setAttribute(key, value)
      }
    })

    if (typeof content === 'string') {
      element.textContent = content
    } else if (content instanceof Node) {
      element.appendChild(content)
    }

    return element
  }
}

/**
 * Legacy compatibility - create empty pin object
 * Migrated from original tools.js
 */
export function newPin (existing = {}, additional = {}) {
  return {
    url: '',
    description: '',
    extended: '',
    tags: '',
    time: '',
    shared: 'yes',
    toread: 'no',
    saved: false,
    ...existing,
    ...additional
  }
}

/**
 * Legacy compatibility - minimize empty fields
 * Migrated from original tools.js
 */
export function minEmpty (data, title = '') {
  if (!data || typeof data !== 'object') {
    return newPin({ description: title })
  }

  const result = { ...data }

  // Set description from title if empty
  if (!result.description && title) {
    result.description = title
  }

  return result
}
