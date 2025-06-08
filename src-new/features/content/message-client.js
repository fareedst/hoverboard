/**
 * Message Client - Modern content script communication with background
 * Replaces legacy sendToExtension/BRSendMessage with Promise-based messaging
 */

export class MessageClient {
  constructor() {
    this.pendingMessages = new Map();
    this.messageTimeout = 10000; // 10 seconds timeout
    this.retryAttempts = 3;
    this.retryDelay = 1000; // 1 second
  }

  /**
   * Send message to background script
   * @param {Object} message - Message object with type and data
   * @param {Object} options - Send options
   * @returns {Promise} Promise that resolves with response
   */
  async sendMessage(message, options = {}) {
    const messageOptions = {
      timeout: options.timeout || this.messageTimeout,
      retries: options.retries !== undefined ? options.retries : this.retryAttempts,
      retryDelay: options.retryDelay || this.retryDelay,
      ...options
    };

    return this.sendMessageWithRetry(message, messageOptions, 0);
  }

  /**
   * Send message with retry logic
   * @param {Object} message - Message object
   * @param {Object} options - Send options
   * @param {number} attempt - Current attempt number
   * @returns {Promise} Promise that resolves with response
   */
  async sendMessageWithRetry(message, options, attempt) {
    try {
      return await this.sendSingleMessage(message, options);
    } catch (error) {
      if (attempt < options.retries && this.isRetryableError(error)) {
        console.warn(`Message failed (attempt ${attempt + 1}), retrying:`, error.message);
        await this.sleep(options.retryDelay * (attempt + 1));
        return this.sendMessageWithRetry(message, options, attempt + 1);
      } else {
        throw error;
      }
    }
  }

  /**
   * Send single message to background
   * @param {Object} message - Message object
   * @param {Object} options - Send options
   * @returns {Promise} Promise that resolves with response
   */
  sendSingleMessage(message, options) {
    return new Promise((resolve, reject) => {
      const messageId = this.generateMessageId();
      const fullMessage = {
        ...message,
        messageId,
        timestamp: Date.now()
      };

      // Set up timeout
      const timeoutId = setTimeout(() => {
        this.pendingMessages.delete(messageId);
        reject(new Error(`Message timeout after ${options.timeout}ms`));
      }, options.timeout);

      // Store pending message info
      this.pendingMessages.set(messageId, {
        resolve,
        reject,
        timeoutId,
        message: fullMessage
      });

      try {
        chrome.runtime.sendMessage(fullMessage, (response) => {
          this.handleMessageResponse(messageId, response);
        });
      } catch (error) {
        this.cleanupPendingMessage(messageId);
        reject(error);
      }
    });
  }

  /**
   * Handle response from background script
   * @param {string} messageId - Message ID
   * @param {Object} response - Response object
   */
  handleMessageResponse(messageId, response) {
    const pendingMessage = this.pendingMessages.get(messageId);
    if (!pendingMessage) return;

    const { resolve, reject, timeoutId } = pendingMessage;

    // Clear timeout
    clearTimeout(timeoutId);
    this.pendingMessages.delete(messageId);

    // Check for Chrome runtime errors
    if (chrome.runtime.lastError) {
      reject(new Error(chrome.runtime.lastError.message));
      return;
    }

    // Check response format
    if (!response) {
      reject(new Error('No response received from background script'));
      return;
    }

    if (response.success) {
      resolve(response.data);
    } else {
      reject(new Error(response.error || 'Unknown error from background script'));
    }
  }

  /**
   * Send message to specific tab
   * @param {number} tabId - Target tab ID
   * @param {Object} message - Message object
   * @returns {Promise} Promise that resolves with response
   */
  async sendMessageToTab(tabId, message) {
    return new Promise((resolve, reject) => {
      try {
        chrome.tabs.sendMessage(tabId, message, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Broadcast message to all tabs
   * @param {Object} message - Message to broadcast
   * @returns {Promise} Promise that resolves when all messages sent
   */
  async broadcastMessage(message) {
    try {
      const tabs = await this.getAllTabs();
      const promises = tabs.map(tab => 
        this.sendMessageToTab(tab.id, message).catch(() => {
          // Ignore errors for inactive tabs
        })
      );
      
      await Promise.all(promises);
    } catch (error) {
      console.error('Failed to broadcast message:', error);
      throw error;
    }
  }

  /**
   * Get all open tabs
   * @returns {Promise<Array>} Promise that resolves with tab array
   */
  getAllTabs() {
    return new Promise((resolve, reject) => {
      try {
        chrome.tabs.query({}, (tabs) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(tabs);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate unique message ID
   * @returns {string} Unique message ID
   */
  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if error is retryable
   * @param {Error} error - Error to check
   * @returns {boolean} Whether error should be retried
   */
  isRetryableError(error) {
    const retryableMessages = [
      'Could not establish connection',
      'Extension context invalidated',
      'Message timeout',
      'The message port closed before a response was received'
    ];

    return retryableMessages.some(msg => 
      error.message.includes(msg)
    );
  }

  /**
   * Clean up pending message
   * @param {string} messageId - Message ID to clean up
   */
  cleanupPendingMessage(messageId) {
    const pendingMessage = this.pendingMessages.get(messageId);
    if (pendingMessage) {
      clearTimeout(pendingMessage.timeoutId);
      this.pendingMessages.delete(messageId);
    }
  }

  /**
   * Sleep for specified milliseconds
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise} Promise that resolves after delay
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if background script is available
   * @returns {Promise<boolean>} Whether background script responds
   */
  async isBackgroundAvailable() {
    try {
      await this.sendMessage({ type: 'PING' }, { timeout: 1000, retries: 0 });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get extension info
   * @returns {Object} Extension information
   */
  getExtensionInfo() {
    return {
      id: chrome.runtime.id,
      version: chrome.runtime.getManifest().version,
      url: chrome.runtime.getURL(''),
      isIncognito: chrome.extension.inIncognitoContext
    };
  }

  /**
   * Open extension options page
   */
  openOptionsPage() {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('src/ui/options/options.html'));
    }
  }

  /**
   * Get current tab information
   * @returns {Promise<Object>} Current tab info
   */
  async getCurrentTab() {
    return new Promise((resolve, reject) => {
      try {
        chrome.tabs.getCurrent((tab) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(tab);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Clean up all pending messages (for when script unloads)
   */
  cleanup() {
    for (const [messageId, pendingMessage] of this.pendingMessages) {
      clearTimeout(pendingMessage.timeoutId);
      pendingMessage.reject(new Error('Content script unloading'));
    }
    this.pendingMessages.clear();
  }

  /**
   * Get statistics about message client
   * @returns {Object} Statistics object
   */
  getStats() {
    return {
      pendingMessages: this.pendingMessages.size,
      messageTimeout: this.messageTimeout,
      retryAttempts: this.retryAttempts,
      retryDelay: this.retryDelay
    };
  }
}

// Set up cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (window.hoverboardMessageClient) {
    window.hoverboardMessageClient.cleanup();
  }
}); 