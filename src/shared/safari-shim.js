/**
 * Safari Browser API Abstraction Layer
 *
 * [SAFARI-EXT-SHIM-001] Safari/Firefox/Chrome browser API abstraction for cross-browser extension support
 * This module provides a unified browser API using webextension-polyfill for cross-browser compatibility.
 * All extension code should import { browser } from './safari-shim.js' instead of using chrome.* directly.
 *
 * Date: 2025-07-19
 * Status: Active Development
 */

import { logger } from './logger.js'

// [SAFARI-EXT-SHIM-001] Browser API abstraction with fallback strategy
let browser

// [SAFARI-EXT-SHIM-001] Initialize browser API synchronously for Jest compatibility
function initializeBrowserAPI () {
  console.log('[SAFARI-EXT-SHIM-001] Initializing browser API abstraction')

  // [SAFARI-EXT-SHIM-001] Primary: Use Chrome API directly (most reliable for testing)
  if (typeof chrome !== 'undefined') {
    browser = chrome
    console.log('[SAFARI-EXT-SHIM-001] Using Chrome API')

    if (logger && logger.debug) {
      logger.debug('[SAFARI-EXT-SHIM-001] Using Chrome API')
    }
    return
  }

  // [SAFARI-EXT-SHIM-001] Fallback: Try webextension-polyfill
  try {
    // Note: In production, this would be async, but for Jest compatibility we use sync fallback
    if (typeof window !== 'undefined' && window.browser) {
      browser = window.browser
      console.log('[SAFARI-EXT-SHIM-001] Using webextension-polyfill')

      if (logger && logger.debug) {
        logger.debug('[SAFARI-EXT-SHIM-001] Using webextension-polyfill')
      }
      return
    }
  } catch (polyfillError) {
    console.warn('[SAFARI-EXT-SHIM-001] webextension-polyfill failed:', polyfillError.message)
    // Continue to fallback
  }

  // [SAFARI-EXT-SHIM-001] Last resort: Create minimal browser API mock
  browser = createMinimalBrowserAPI()
  console.warn('[SAFARI-EXT-SHIM-001] No browser API available, using minimal mock')

  if (logger && logger.warn) {
    logger.warn('[SAFARI-EXT-SHIM-001] No browser API available, using minimal mock')
  }
}

// Initialize immediately
initializeBrowserAPI()

// [SAFARI-EXT-SHIM-001] Enhanced retry mechanism for failed operations
const retryConfig = {
  maxRetries: 3,
  baseDelay: 100,
  maxDelay: 1000,
  backoffMultiplier: 2
}

// [SAFARI-EXT-SHIM-001] Retry utility function
async function retryOperation (operation, operationName, maxRetries = retryConfig.maxRetries) {
  let lastError

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[SAFARI-EXT-SHIM-001] ${operationName} attempt ${attempt}/${maxRetries}`)
      return await operation()
    } catch (error) {
      lastError = error
      console.warn(`[SAFARI-EXT-SHIM-001] ${operationName} attempt ${attempt} failed:`, error.message)

      if (attempt < maxRetries) {
        const delay = Math.min(
          retryConfig.baseDelay * Math.pow(retryConfig.backoffMultiplier, attempt - 1),
          retryConfig.maxDelay
        )
        console.log(`[SAFARI-EXT-SHIM-001] Retrying ${operationName} in ${delay}ms`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  console.error(`[SAFARI-EXT-SHIM-001] ${operationName} failed after ${maxRetries} attempts:`, lastError)
  throw lastError
}

// [SAFARI-EXT-SHIM-001] Safari-specific API enhancements
const safariEnhancements = {
  // Safari storage quota management
  storage: {
    ...browser.storage,

    // [SAFARI-EXT-STORAGE-001] Enhanced Safari storage quota management
    getQuotaUsage: async () => {
      console.log('[SAFARI-EXT-STORAGE-001] Checking storage quota usage')

      try {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
          const estimate = await navigator.storage.estimate()
          const quotaUsage = {
            used: estimate.usage || 0,
            quota: estimate.quota || 0,
            usagePercent: estimate.quota ? (estimate.usage / estimate.quota) * 100 : 0
          }

          console.log('[SAFARI-EXT-STORAGE-001] Storage quota usage:', quotaUsage)
          return quotaUsage
        }

        console.warn('[SAFARI-EXT-STORAGE-001] Storage API not available, returning default values')
        return { used: 0, quota: 0, usagePercent: 0 }
      } catch (error) {
        console.error('[SAFARI-EXT-STORAGE-001] Storage quota check failed:', error)

        if (logger && logger.error) {
          logger.error('[SAFARI-EXT-STORAGE-001] Storage quota check failed:', error)
        }
        return { used: 0, quota: 0, usagePercent: 0 }
      }
    },

    // [SAFARI-EXT-STORAGE-001] Enhanced Safari-optimized storage operations
    sync: {
      ...browser.storage.sync,

      // Safari sync storage with enhanced quota management and retry logic
      get: async (keys) => {
        console.log('[SAFARI-EXT-STORAGE-001] Getting sync storage:', keys)

        return retryOperation(async () => {
          try {
            const result = await browser.storage.sync.get(keys)
            console.log('[SAFARI-EXT-STORAGE-001] Sync storage get successful:', result)

            // Check quota usage after storage operations
            const quotaUsage = await safariEnhancements.storage.getQuotaUsage()
            if (quotaUsage.usagePercent > 80) {
              const warning = `[SAFARI-EXT-STORAGE-001] Storage quota usage high: ${quotaUsage.usagePercent.toFixed(1)}%`
              console.warn(warning)
              if (logger && logger.warn) {
                logger.warn(warning)
              }
            }

            return result
          } catch (error) {
            console.error('[SAFARI-EXT-STORAGE-001] Sync storage get failed:', error)
            if (logger && logger.error) {
              logger.error('[SAFARI-EXT-STORAGE-001] Sync storage get failed:', error)
            }
            throw error
          }
        }, 'sync storage get')
      },

      // Enhanced set operation with retry logic
      set: async (data) => {
        console.log('[SAFARI-EXT-STORAGE-001] Setting sync storage:', data)

        return retryOperation(async () => {
          try {
            const result = await browser.storage.sync.set(data)
            console.log('[SAFARI-EXT-STORAGE-001] Sync storage set successful')

            // Check quota usage after storage operations
            const quotaUsage = await safariEnhancements.storage.getQuotaUsage()
            if (quotaUsage.usagePercent > 80) {
              const warning = `[SAFARI-EXT-STORAGE-001] Storage quota usage high: ${quotaUsage.usagePercent.toFixed(1)}%`
              console.warn(warning)
              if (logger && logger.warn) {
                logger.warn(warning)
              }
            }

            return result
          } catch (error) {
            console.error('[SAFARI-EXT-STORAGE-001] Sync storage set failed:', error)
            if (logger && logger.error) {
              logger.error('[SAFARI-EXT-STORAGE-001] Sync storage set failed:', error)
            }
            throw error
          }
        }, 'sync storage set')
      }
    }
  },

  // Enhanced Safari message passing optimizations
  runtime: {
    ...browser.runtime,

    // [SAFARI-EXT-MESSAGING-001] Enhanced Safari-optimized message passing
    sendMessage: async (message) => {
      console.log('[SAFARI-EXT-MESSAGING-001] Sending message:', message)

      return retryOperation(async () => {
        try {
          const enhancedMessage = {
            ...message,
            timestamp: Date.now(),
            version: browser.runtime.getManifest().version
          }

          // [SAFARI-EXT-MESSAGING-001] Only add platform property if actually running in Safari
          if (typeof safari !== 'undefined') {
            enhancedMessage.platform = 'safari'
            console.log('[SAFARI-EXT-MESSAGING-001] Safari platform detected, adding platform info')
          }

          if (logger && logger.debug) {
            logger.debug('[SAFARI-EXT-MESSAGING-001] Sending message:', enhancedMessage)
          }

          // [SAFARI-EXT-MESSAGING-001] Use Promise-based message sending for proper async handling
          return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(enhancedMessage, (response) => {
              if (chrome.runtime.lastError) {
                const error = new Error(chrome.runtime.lastError.message)
                console.error('[SAFARI-EXT-MESSAGING-001] Message send failed:', error.message)
                if (logger && logger.error) {
                  logger.error('[SAFARI-EXT-MESSAGING-001] Message send failed:', error)
                }
                reject(error)
              } else {
                console.log('[SAFARI-EXT-MESSAGING-001] Message sent successfully:', response)
                resolve(response)
              }
            })
          })
        } catch (error) {
          console.error('[SAFARI-EXT-MESSAGING-001] Message send failed:', error.message)
          if (logger && logger.error) {
            logger.error('[SAFARI-EXT-MESSAGING-001] Message send failed:', error)
          }
          throw error
        }
      }, 'runtime sendMessage')
    },

    // [SAFARI-EXT-MESSAGING-001] Enhanced Safari message listener with error handling
    onMessage: {
      ...browser.runtime.onMessage,

      addListener: (callback) => {
        console.log('[SAFARI-EXT-MESSAGING-001] Adding message listener')

        const wrappedCallback = (message, sender, sendResponse) => {
          try {
            console.log('[SAFARI-EXT-MESSAGING-001] Received message:', message)

            if (logger && logger.debug) {
              logger.debug('[SAFARI-EXT-MESSAGING-001] Received message:', message)
            }

            // Handle async callback properly
            const result = callback(message, sender, sendResponse)

            // If the callback returns a Promise, handle it properly
            if (result && typeof result.then === 'function') {
              result.then(response => {
                console.log('[SAFARI-EXT-MESSAGING-001] Async response:', response)
                if (logger && logger.debug) {
                  logger.debug('[SAFARI-EXT-MESSAGING-001] Async response:', response)
                }
              }).catch(error => {
                console.error('[SAFARI-EXT-MESSAGING-001] Message handler error:', error)
                if (logger && logger.error) {
                  logger.error('[SAFARI-EXT-MESSAGING-001] Message handler error:', error)
                }
              })
            }

            return result
          } catch (error) {
            console.error('[SAFARI-EXT-MESSAGING-001] Message handler error:', error)
            if (logger && logger.error) {
              logger.error('[SAFARI-EXT-MESSAGING-001] Message handler error:', error)
            }
            throw error
          }
        }

        // [SAFARI-EXT-MESSAGING-001] Call the original Chrome API to avoid infinite recursion
        return chrome.runtime.onMessage.addListener(wrappedCallback)
      }
    }
  },

  // Enhanced Safari tabs API enhancements
  tabs: {
    ...browser.tabs,

    // [SAFARI-EXT-CONTENT-001] Enhanced Safari-optimized tab querying
    query: async (queryInfo) => {
      console.log('[SAFARI-EXT-CONTENT-001] Querying tabs:', queryInfo)

      return retryOperation(async () => {
        try {
          const tabs = await browser.tabs.query(queryInfo)
          console.log('[SAFARI-EXT-CONTENT-001] Tab query successful, found tabs:', tabs.length)

          // Safari-specific tab filtering
          if (typeof safari !== 'undefined') {
            // Filter out Safari's internal pages if needed
            const filteredTabs = tabs.filter(tab => !tab.url.startsWith('safari-extension://'))
            console.log('[SAFARI-EXT-CONTENT-001] Filtered tabs:', { original: tabs.length, filtered: filteredTabs.length })

            if (logger && logger.debug) {
              logger.debug('[SAFARI-EXT-CONTENT-001] Filtered tabs:', { original: tabs.length, filtered: filteredTabs.length })
            }
            return filteredTabs
          }

          return tabs
        } catch (error) {
          console.error('[SAFARI-EXT-CONTENT-001] Tab query failed:', error.message)
          if (logger && logger.error) {
            logger.error('[SAFARI-EXT-CONTENT-001] Tab query failed:', error)
          }
          throw error
        }
      }, 'tabs query')
    },

    // [SAFARI-EXT-MESSAGING-001] Enhanced Safari-optimized tab message sending
    sendMessage: async (tabId, message) => {
      console.log('[SAFARI-EXT-MESSAGING-001] Sending message to tab:', { tabId, message })

      return retryOperation(async () => {
        try {
          if (logger && logger.debug) {
            logger.debug('[SAFARI-EXT-MESSAGING-001] Sending message to tab:', { tabId, message })
          }

          // Use Promise-based message sending for proper async handling
          return new Promise((resolve, reject) => {
            chrome.tabs.sendMessage(tabId, message, (response) => {
              if (chrome.runtime.lastError) {
                const error = new Error(chrome.runtime.lastError.message)
                console.error('[SAFARI-EXT-MESSAGING-001] Tab message send failed:', error.message)
                reject(error)
              } else {
                console.log('[SAFARI-EXT-MESSAGING-001] Tab message sent successfully:', response)
                resolve(response)
              }
            })
          })
        } catch (error) {
          console.error('[SAFARI-EXT-MESSAGING-001] Tab message send failed:', error.message)
          if (logger && logger.error) {
            logger.error('[SAFARI-EXT-MESSAGING-001] Tab message send failed:', error)
          }
          throw error
        }
      }, 'tabs sendMessage')
    }
  }
}

// [SAFARI-EXT-SHIM-001] Create minimal browser API mock for development
function createMinimalBrowserAPI () {
  console.log('[SAFARI-EXT-SHIM-001] Creating minimal browser API mock')

  return {
    runtime: {
      id: 'mock-extension-id',
      getManifest: () => ({ version: '1.0.0' }),
      sendMessage: () => Promise.resolve(),
      onMessage: { addListener: () => {} },
      onInstalled: { addListener: () => {} }
    },
    storage: {
      sync: {
        get: () => Promise.resolve({}),
        set: () => Promise.resolve(),
        remove: () => Promise.resolve()
      },
      local: {
        get: () => Promise.resolve({}),
        set: () => Promise.resolve(),
        remove: () => Promise.resolve()
      }
    },
    tabs: {
      query: () => Promise.resolve([]),
      sendMessage: () => Promise.resolve()
    }
  }
}

// [SAFARI-EXT-SHIM-001] Export enhanced browser API
export { safariEnhancements as browser }

// [SAFARI-EXT-SHIM-001] Enhanced platform detection utilities
export const platformUtils = {
  isSafari: () => {
    const isSafari = typeof safari !== 'undefined'
    console.log('[SAFARI-EXT-SHIM-001] Safari detection:', isSafari)
    return isSafari
  },

  isChrome: () => {
    const isChrome = typeof chrome !== 'undefined' && !platformUtils.isSafari()
    console.log('[SAFARI-EXT-SHIM-001] Chrome detection:', isChrome)
    return isChrome
  },

  isFirefox: () => {
    const isFirefox = typeof browser !== 'undefined' && browser.runtime.getBrowserInfo
    console.log('[SAFARI-EXT-SHIM-001] Firefox detection:', isFirefox)
    return isFirefox
  },

  // [SAFARI-EXT-SHIM-001] Get current platform for feature detection
  getPlatform: () => {
    if (platformUtils.isSafari()) return 'safari'
    if (platformUtils.isChrome()) return 'chrome'
    if (platformUtils.isFirefox()) return 'firefox'
    return 'unknown'
  },

  // [SAFARI-EXT-SHIM-001] Enhanced feature support detection
  supportsFeature: (feature) => {
    const platform = platformUtils.getPlatform()
    console.log(`[SAFARI-EXT-SHIM-001] Checking feature support: ${feature} on ${platform}`)

    const featureSupport = {
      backdropFilter: {
        safari: true,
        chrome: true,
        firefox: false
      },
      webkitBackdropFilter: {
        safari: true,
        chrome: false,
        firefox: false
      },
      visualViewport: {
        safari: true,
        chrome: true,
        firefox: false
      },
      // [SAFARI-EXT-SHIM-001] Add Safari-specific features
      safariExtensions: {
        safari: true,
        chrome: false,
        firefox: false
      },
      storageQuota: {
        safari: true,
        chrome: true,
        firefox: true
      },
      messageRetry: {
        safari: true,
        chrome: true,
        firefox: true
      }
    }

    const isSupported = featureSupport[feature]?.[platform] || false
    console.log(`[SAFARI-EXT-SHIM-001] Feature ${feature} supported on ${platform}:`, isSupported)
    return isSupported
  },

  // [SAFARI-EXT-SHIM-001] Get platform-specific configuration
  getPlatformConfig: () => {
    const platform = platformUtils.getPlatform()
    console.log('[SAFARI-EXT-SHIM-001] Getting platform config for:', platform)

    const platformConfigs = {
      safari: {
        maxRetries: 3,
        baseDelay: 150,
        maxDelay: 1500,
        storageQuotaWarning: 80,
        enableTabFiltering: true
      },
      chrome: {
        maxRetries: 2,
        baseDelay: 100,
        maxDelay: 1000,
        storageQuotaWarning: 90,
        enableTabFiltering: false
      },
      firefox: {
        maxRetries: 3,
        baseDelay: 200,
        maxDelay: 2000,
        storageQuotaWarning: 85,
        enableTabFiltering: false
      }
    }

    return platformConfigs[platform] || platformConfigs.chrome
  }
}
