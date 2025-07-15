/**
 * Message Service - Wrapper for MessageClient with event handling
 * Provides onMessage functionality for content scripts
 */

import { MessageClient } from '../features/content/message-client.js'

export class MessageService {
  constructor () {
    this.messageClient = new MessageClient()
    this.messageListeners = new Map()
    this.setupMessageListener()
  }

  /**
   * Set up message listener for incoming messages
   */
  setupMessageListener () {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        this.handleIncomingMessage(message, sender, sendResponse)
        return true // Keep message channel open for async response
      })
    }
  }

  /**
   * Handle incoming messages and dispatch to listeners
   */
  handleIncomingMessage (message, sender, sendResponse) {
    const { type, data } = message

    if (this.messageListeners.has(type)) {
      const listeners = this.messageListeners.get(type)
      listeners.forEach(listener => {
        try {
          const result = listener(data, sender)
          if (result instanceof Promise) {
            result.then(sendResponse).catch(error => {
              console.error('Message listener error:', error)
              sendResponse({ success: false, error: error.message })
            })
          } else {
            sendResponse({ success: true, data: result })
          }
        } catch (error) {
          console.error('Message listener error:', error)
          sendResponse({ success: false, error: error.message })
        }
      })
    } else {
      // No listeners for this message type
      sendResponse({ success: false, error: 'No listeners for message type: ' + type })
    }
  }

  /**
   * Register a listener for a specific message type
   * @param {string} type - Message type to listen for
   * @param {Function} listener - Function to call when message received
   */
  onMessage (type, listener) {
    if (!this.messageListeners.has(type)) {
      this.messageListeners.set(type, [])
    }
    this.messageListeners.get(type).push(listener)
  }

  /**
   * Remove a listener for a specific message type
   * @param {string} type - Message type
   * @param {Function} listener - Listener to remove
   */
  removeListener (type, listener) {
    if (this.messageListeners.has(type)) {
      const listeners = this.messageListeners.get(type)
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  /**
   * Send message using the underlying MessageClient
   * @param {string|Object} message - Message to send
   * @param {Object} data - Optional data
   * @returns {Promise} Promise that resolves with response
   */
  async sendMessage (message, data = null) {
    if (typeof message === 'string') {
      return this.messageClient.sendMessage({
        type: message,
        data
      })
    } else {
      return this.messageClient.sendMessage(message)
    }
  }

  /**
   * Clean up resources
   */
  destroy () {
    this.messageListeners.clear()
    if (this.messageClient) {
      this.messageClient.cleanup()
    }
  }
}
