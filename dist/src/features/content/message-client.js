/**
 * Message Client - Modern content script communication with background
 * Replaces legacy sendToExtension/BRSendMessage with Promise-based messaging
 * @ts-check
 */

// [SAFARI-EXT-SHIM-001] Import browser API abstraction for cross-browser support
import { browser } from '../../shared/utils.js' // [SAFARI-EXT-SHIM-001]

/** @typedef {import('../../shared/message-types').MessageEnvelope} MessageEnvelope */

export class MessageClient {
  constructor () {
    this.messageTimeout = 10000 // 10 seconds timeout
    this.retryAttempts = 3
    this.retryDelay = 1000 // 1 second
  }

  /**
   * Send message to background script
   * @param {MessageEnvelope} message - Message object with type and data
   * @param {{ timeout?: number, retries?: number, retryDelay?: number }} [options] - Send options
   * @returns {Promise<unknown>} Promise that resolves with response
   */
  async sendMessage (message, options = {}) {
    const messageOptions = {
      timeout: options.timeout || this.messageTimeout,
      retries: options.retries !== undefined ? options.retries : this.retryAttempts,
      retryDelay: options.retryDelay || this.retryDelay,
      ...options
    }

    return this.sendMessageWithRetry(message, messageOptions, 0)
  }

  /**
   * Send message with retry logic
   * @param {MessageEnvelope} message - Message object
   * @param {{ timeout?: number, retries?: number, retryDelay?: number }} options - Send options
   * @param {number} attempt - Current attempt number
   * @returns {Promise<unknown>} Promise that resolves with response
   */
  async sendMessageWithRetry (message, options, attempt) {
    try {
      return await this.sendSingleMessage(message, options)
    } catch (error) {
      if (attempt < options.retries && this.isRetryableError(error)) {
        console.warn(`Message failed (attempt ${attempt + 1}), retrying:`, error.message)
        await this.sleep(options.retryDelay * (attempt + 1))
        return this.sendMessageWithRetry(message, options, attempt + 1)
      } else {
        throw error
      }
    }
  }

  /**
   * Send single message to background
   * @param {MessageEnvelope} message - Message object
   * @param {{ timeout?: number, retries?: number, retryDelay?: number }} options - Send options
   * @returns {Promise<unknown>} Promise that resolves with response
   */
  // [SAFARI-EXT-SHIM-001] Refactor sendSingleMessage to use await directly
  async sendSingleMessage (message, options) {
    const messageId = this.generateMessageId()
    const fullMessage = { ...message, messageId }
    return await browser.runtime.sendMessage(fullMessage)
  }

  /**
   * Handle response from background script
   * @param {string} messageId - Message ID
   * @param {Object} response - Response object
   */
  handleMessageResponse (messageId, response) {
    // No-op or just log/handle response if needed
    // Previously this would resolve a Promise, but now we just return the response directly
    // Optionally, you can remove this method if not needed
  }

  /**
   * Send message to specific tab
   * @param {number} tabId - Target tab ID
   * @param {Object} message - Message object
   * @returns {Promise} Promise that resolves with response
   */
  // [SAFARI-EXT-SHIM-001] Refactor sendMessageToTab to use await directly
  async sendMessageToTab (tabId, message) {
    return await browser.tabs.sendMessage(tabId, message)
  }

  /**
   * Broadcast message to all tabs
   * @param {Object} message - Message to broadcast
   * @returns {Promise} Promise that resolves when all messages sent
   */
  async broadcastMessage (message) {
    try {
      const tabs = await this.getAllTabs()
      const promises = tabs.map(tab =>
        this.sendMessageToTab(tab.id, message).catch(() => {
          // Ignore errors for inactive tabs
        })
      )

      await Promise.all(promises)
    } catch (error) {
      console.error('Failed to broadcast message:', error)
      throw error
    }
  }

  /**
   * Get all open tabs
   * @returns {Promise<Array>} Promise that resolves with tab array
   */
  getAllTabs () {
    return new Promise((resolve, reject) => {
      try {
        browser.tabs.query({}, (tabs) => {
          if (browser.runtime.lastError) {
            reject(new Error(browser.runtime.lastError.message))
          } else {
            resolve(tabs)
          }
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Generate unique message ID
   * @returns {string} Unique message ID
   */
  generateMessageId () {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Check if error is retryable
   * @param {Error} error - Error to check
   * @returns {boolean} Whether error should be retried
   */
  isRetryableError (error) {
    const retryableMessages = [
      'Could not establish connection',
      'Extension context invalidated',
      'Message timeout',
      'The message port closed before a response was received'
    ]

    return retryableMessages.some(msg =>
      error.message.includes(msg)
    )
  }

  /**
   * Clean up pending message
   * @param {string} messageId - Message ID to clean up
   */
  cleanupPendingMessage (messageId) {
    // No-op or remove if not needed
  }

  /**
   * Sleep for specified milliseconds
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise} Promise that resolves after delay
   */
  sleep (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Check if background script is available
   * @returns {Promise<boolean>} Whether background script responds
   */
  async isBackgroundAvailable () {
    try {
      await this.sendMessage({ type: 'PING' }, { timeout: 1000, retries: 0 })
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Get extension info
   * @returns {Object} Extension information
   */
  getExtensionInfo () {
    return {
      id: browser.runtime.id,
      version: browser.runtime.getManifest().version,
      url: browser.runtime.getURL(''),
      isIncognito: browser.extension.inIncognitoContext
    }
  }

  /**
   * Open extension options page
   */
  openOptionsPage () {
    if (browser.runtime.openOptionsPage) {
      browser.runtime.openOptionsPage()
    } else {
      window.open(browser.runtime.getURL('src/ui/options/options.html'))
    }
  }

  /**
   * Get current tab information
   * @returns {Promise<Object>} Current tab info
   */
  async getCurrentTab () {
    return new Promise((resolve, reject) => {
      try {
        browser.tabs.getCurrent((tab) => {
          if (browser.runtime.lastError) {
            reject(new Error(browser.runtime.lastError.message))
          } else {
            resolve(tab)
          }
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Clean up all pending messages (for when script unloads)
   */
  cleanup () {
    // No-op or remove if not needed
  }

  /**
   * Get statistics about message client
   * @returns {Object} Statistics object
   */
  getStats () {
    return {
      messageTimeout: this.messageTimeout,
      retryAttempts: this.retryAttempts,
      retryDelay: this.retryDelay
    }
  }
}

// Set up cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (window.hoverboardMessageClient) {
    window.hoverboardMessageClient.cleanup()
  }
})
