/**
 * [IMPL-SAFARI_ADAPTATION] [ARCH-SAFARI_ADAPTATION] [REQ-SAFARI_ADAPTATION]
 * Safari browser API abstraction; webextension-polyfill fallback; minimal mock when unavailable.
 * [SAFARI-EXT-SHIM-001] All extension code should import { browser } from './safari-shim.js' instead of chrome.*.
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

// [SAFARI-EXT-STORAGE-001] Enhanced storage quota management configuration
const storageQuotaConfig = {
  warningThreshold: 80, // Percentage threshold for warnings
  criticalThreshold: 95, // Percentage threshold for critical warnings
  cleanupThreshold: 90, // Percentage threshold for automatic cleanup
  maxRetries: 3,
  cacheTimeout: 30000, // 30 seconds cache timeout
  batchSize: 10, // Number of operations to batch
  compressionThreshold: 1024, // Minimum size for compression (1KB)
  fallbackStrategies: ['local', 'memory', 'none']
}

// [SAFARI-EXT-STORAGE-001] Storage quota cache for performance optimization
const quotaCache = {
  data: null,
  timestamp: 0,
  isValid: () => {
    return quotaCache.data && (Date.now() - quotaCache.timestamp) < storageQuotaConfig.cacheTimeout
  }
}

// [SAFARI-EXT-STORAGE-001] Storage operation queue for batching
let storageQueue = []
let storageQueueTimeout = null

// [SAFARI-EXT-STORAGE-001] Enhanced storage quota management utilities
const storageQuotaUtils = {
  // [SAFARI-EXT-STORAGE-001] Get platform-specific quota configuration
  getQuotaConfig: () => {
    const platform = platformUtils.getPlatform()
    const platformConfig = platformUtils.getPlatformConfig()

    return {
      ...storageQuotaConfig,
      warningThreshold: platformConfig.storageQuotaWarning || storageQuotaConfig.warningThreshold,
      criticalThreshold: platformConfig.storageQuotaCritical || storageQuotaConfig.criticalThreshold,
      cleanupThreshold: platformConfig.storageQuotaCleanup || storageQuotaConfig.cleanupThreshold,
      maxRetries: platformConfig.maxRetries || storageQuotaConfig.maxRetries,
      cacheTimeout: platformConfig.storageCacheTimeout || storageQuotaConfig.cacheTimeout,
      batchSize: platformConfig.storageBatchSize || storageQuotaConfig.batchSize,
      enableBatching: platformConfig.enableStorageBatching !== false,
      enableCompression: platformConfig.enableStorageCompression !== false
    }
  },

  // [SAFARI-EXT-STORAGE-001] Enhanced quota usage monitoring with caching
  getQuotaUsage: async (forceRefresh = false) => {
    console.log('[SAFARI-EXT-STORAGE-001] Getting storage quota usage (forceRefresh:', forceRefresh, ')')

    // [SAFARI-EXT-STORAGE-001] Use cached data if valid and not forcing refresh
    if (!forceRefresh && quotaCache.isValid()) {
      console.log('[SAFARI-EXT-STORAGE-001] Using cached quota data:', quotaCache.data)
      return quotaCache.data
    }

    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate()
        const quotaUsage = {
          used: estimate.usage || 0,
          quota: estimate.quota || 0,
          usagePercent: estimate.quota ? (estimate.usage / estimate.quota) * 100 : 0,
          available: estimate.quota ? (estimate.quota - estimate.usage) : 0,
          timestamp: Date.now()
        }

        // [SAFARI-EXT-STORAGE-001] Cache the quota data
        quotaCache.data = quotaUsage
        quotaCache.timestamp = Date.now()

        console.log('[SAFARI-EXT-STORAGE-001] Storage quota usage:', quotaUsage)

        // [SAFARI-EXT-STORAGE-001] Trigger quota monitoring alerts
        await storageQuotaUtils.monitorQuotaUsage(quotaUsage)

        return quotaUsage
      }

      console.warn('[SAFARI-EXT-STORAGE-001] Storage API not available, returning default values')
      const defaultUsage = { used: 0, quota: 0, usagePercent: 0, available: 0, timestamp: Date.now() }
      quotaCache.data = defaultUsage
      quotaCache.timestamp = Date.now()
      return defaultUsage
    } catch (error) {
      console.error('[SAFARI-EXT-STORAGE-001] Storage quota check failed:', error)

      if (logger && logger.error) {
        logger.error('[SAFARI-EXT-STORAGE-001] Storage quota check failed:', error)
      }

      const fallbackUsage = { used: 0, quota: 0, usagePercent: 0, available: 0, timestamp: Date.now() }
      quotaCache.data = fallbackUsage
      quotaCache.timestamp = Date.now()
      return fallbackUsage
    }
  },

  // [SAFARI-EXT-STORAGE-001] Enhanced quota monitoring with predictive warnings
  monitorQuotaUsage: async (quotaUsage) => {
    const config = storageQuotaUtils.getQuotaConfig()

    if (quotaUsage.usagePercent >= config.criticalThreshold) {
      const criticalWarning = `[SAFARI-EXT-STORAGE-001] CRITICAL: Storage quota usage at ${quotaUsage.usagePercent.toFixed(1)}%`
      console.error(criticalWarning)
      if (logger && logger.error) {
        logger.error(criticalWarning)
      }

      // [SAFARI-EXT-STORAGE-001] Trigger automatic cleanup for critical usage
      await storageQuotaUtils.triggerAutomaticCleanup()
    } else if (quotaUsage.usagePercent >= config.warningThreshold) {
      const warning = `[SAFARI-EXT-STORAGE-001] Storage quota usage high: ${quotaUsage.usagePercent.toFixed(1)}%`
      console.warn(warning)
      if (logger && logger.warn) {
        logger.warn(warning)
      }

      // [SAFARI-EXT-STORAGE-001] Predictive warning for approaching critical threshold
      if (quotaUsage.usagePercent >= config.cleanupThreshold) {
        const predictiveWarning = '[SAFARI-EXT-STORAGE-001] Approaching critical threshold, consider cleanup'
        console.warn(predictiveWarning)
        if (logger && logger.warn) {
          logger.warn(predictiveWarning)
        }
      }
    }
  },

  // [SAFARI-EXT-STORAGE-001] Automatic cleanup for storage quota management
  triggerAutomaticCleanup: async () => {
    console.log('[SAFARI-EXT-STORAGE-001] Triggering automatic storage cleanup')

    try {
      // [SAFARI-EXT-STORAGE-001] Get current storage data to identify cleanup candidates
      const storageData = await browser.storage.sync.get(null)
      const cleanupCandidates = []

      // [SAFARI-EXT-STORAGE-001] Identify large or old data for cleanup
      for (const [key, value] of Object.entries(storageData)) {
        const dataSize = JSON.stringify(value).length
        const dataAge = value.timestamp ? (Date.now() - value.timestamp) : 0

        if (dataSize > storageQuotaConfig.compressionThreshold || dataAge > 7 * 24 * 60 * 60 * 1000) {
          cleanupCandidates.push({ key, size: dataSize, age: dataAge })
        }
      }

      // [SAFARI-EXT-STORAGE-001] Sort by size and age for optimal cleanup
      cleanupCandidates.sort((a, b) => b.size - a.size || b.age - a.age)

      // [SAFARI-EXT-STORAGE-001] Remove oldest/largest items until we're under threshold
      const config = storageQuotaUtils.getQuotaConfig()
      let removedCount = 0

      for (const candidate of cleanupCandidates) {
        if (removedCount >= 5) break // Limit cleanup to prevent excessive removal

        try {
          await browser.storage.sync.remove(candidate.key)
          console.log(`[SAFARI-EXT-STORAGE-001] Cleaned up storage key: ${candidate.key} (${candidate.size} bytes)`)
          removedCount++
        } catch (error) {
          console.error(`[SAFARI-EXT-STORAGE-001] Failed to cleanup ${candidate.key}:`, error)
        }
      }

      if (removedCount > 0) {
        console.log(`[SAFARI-EXT-STORAGE-001] Automatic cleanup completed: removed ${removedCount} items`)
        // [SAFARI-EXT-STORAGE-001] Refresh quota cache after cleanup
        quotaCache.data = null
        await storageQuotaUtils.getQuotaUsage(true)
      }
    } catch (error) {
      console.error('[SAFARI-EXT-STORAGE-001] Automatic cleanup failed:', error)
      if (logger && logger.error) {
        logger.error('[SAFARI-EXT-STORAGE-001] Automatic cleanup failed:', error)
      }
    }
  },

  // [SAFARI-EXT-STORAGE-001] Graceful degradation for storage failures
  handleStorageFailure: async (error, operation, fallbackData = null) => {
    console.error(`[SAFARI-EXT-STORAGE-001] Storage operation failed: ${operation}`, error)

    if (logger && logger.error) {
      logger.error(`[SAFARI-EXT-STORAGE-001] Storage operation failed: ${operation}`, error)
    }

    const config = storageQuotaUtils.getQuotaConfig()

    // [SAFARI-EXT-STORAGE-001] Try fallback strategies
    for (const strategy of config.fallbackStrategies) {
      try {
        switch (strategy) {
          case 'local':
            console.log('[SAFARI-EXT-STORAGE-001] Trying local storage fallback')
            if (operation === 'get') {
              return await browser.storage.local.get(fallbackData)
            } else if (operation === 'set') {
              return await browser.storage.local.set(fallbackData)
            }
            break

          case 'memory':
            console.log('[SAFARI-EXT-STORAGE-001] Using memory fallback')
            // [SAFARI-EXT-STORAGE-001] In-memory fallback for critical operations
            return fallbackData

          case 'none':
            console.log('[SAFARI-EXT-STORAGE-001] No fallback available, throwing error')
            throw error
        }
      } catch (fallbackError) {
        console.warn(`[SAFARI-EXT-STORAGE-001] Fallback strategy '${strategy}' failed:`, fallbackError)
        continue
      }
    }

    // [SAFARI-EXT-STORAGE-001] All fallback strategies failed
    throw error
  },

  // [SAFARI-EXT-STORAGE-001] Batch storage operations for performance
  queueStorageOperation: (operation) => {
    storageQueue.push(operation)

    if (storageQueue.length >= storageQuotaConfig.batchSize) {
      storageQuotaUtils.processStorageQueue()
    } else if (!storageQueueTimeout) {
      storageQueueTimeout = setTimeout(() => {
        storageQuotaUtils.processStorageQueue()
      }, 100) // Process queue after 100ms if not full
    }
  },

  // [SAFARI-EXT-STORAGE-001] Process batched storage operations
  processStorageQueue: async () => {
    if (storageQueue.length === 0) return

    const operations = [...storageQueue]
    storageQueue = []
    storageQueueTimeout = null

    console.log(`[SAFARI-EXT-STORAGE-001] Processing ${operations.length} batched storage operations`)

    try {
      // [SAFARI-EXT-STORAGE-001] Group operations by type for efficiency
      const getOps = operations.filter(op => op.type === 'get')
      const setOps = operations.filter(op => op.type === 'set')
      const removeOps = operations.filter(op => op.type === 'remove')

      // [SAFARI-EXT-STORAGE-001] Execute operations in batches
      const results = []

      if (getOps.length > 0) {
        const keys = getOps.flatMap(op => op.keys || [])
        const result = await browser.storage.sync.get(keys)
        results.push(...getOps.map(op => ({ ...op, result })))
      }

      if (setOps.length > 0) {
        const data = Object.assign({}, ...setOps.map(op => op.data))
        const result = await browser.storage.sync.set(data)
        results.push(...setOps.map(op => ({ ...op, result })))
      }

      if (removeOps.length > 0) {
        const keys = removeOps.flatMap(op => op.keys || [])
        const result = await browser.storage.sync.remove(keys)
        results.push(...removeOps.map(op => ({ ...op, result })))
      }

      console.log(`[SAFARI-EXT-STORAGE-001] Successfully processed ${operations.length} batched operations`)

      // [SAFARI-EXT-STORAGE-001] Check quota after batch operations
      await storageQuotaUtils.getQuotaUsage(true)
    } catch (error) {
      console.error('[SAFARI-EXT-STORAGE-001] Batch storage operations failed:', error)
      if (logger && logger.error) {
        logger.error('[SAFARI-EXT-STORAGE-001] Batch storage operations failed:', error)
      }

      // [SAFARI-EXT-STORAGE-001] Retry individual operations on batch failure
      for (const operation of operations) {
        try {
          await retryOperation(async () => {
            if (operation.type === 'get') {
              return await browser.storage.sync.get(operation.keys)
            } else if (operation.type === 'set') {
              return await browser.storage.sync.set(operation.data)
            } else if (operation.type === 'remove') {
              return await browser.storage.sync.remove(operation.keys)
            }
          }, `individual ${operation.type} operation`)
        } catch (individualError) {
          console.error('[SAFARI-EXT-STORAGE-001] Individual operation failed:', individualError)
        }
      }
    }
  }
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
    getQuotaUsage: storageQuotaUtils.getQuotaUsage,

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

            // [SAFARI-EXT-STORAGE-001] Check quota usage after storage operations
            await storageQuotaUtils.getQuotaUsage()

            return result
          } catch (error) {
            console.error('[SAFARI-EXT-STORAGE-001] Sync storage get failed:', error)
            if (logger && logger.error) {
              logger.error('[SAFARI-EXT-STORAGE-001] Sync storage get failed:', error)
            }

            // [SAFARI-EXT-STORAGE-001] Try graceful degradation
            return await storageQuotaUtils.handleStorageFailure(error, 'get', keys)
          }
        }, 'sync storage get')
      },

      // Enhanced set operation with retry logic and graceful degradation
      set: async (data) => {
        console.log('[SAFARI-EXT-STORAGE-001] Setting sync storage:', data)

        return retryOperation(async () => {
          try {
            const result = await browser.storage.sync.set(data)
            console.log('[SAFARI-EXT-STORAGE-001] Sync storage set successful')

            // [SAFARI-EXT-STORAGE-001] Check quota usage after storage operations
            await storageQuotaUtils.getQuotaUsage()

            return result
          } catch (error) {
            console.error('[SAFARI-EXT-STORAGE-001] Sync storage set failed:', error)
            if (logger && logger.error) {
              logger.error('[SAFARI-EXT-STORAGE-001] Sync storage set failed:', error)
            }

            // [SAFARI-EXT-STORAGE-001] Try graceful degradation
            return await storageQuotaUtils.handleStorageFailure(error, 'set', data)
          }
        }, 'sync storage set')
      },

      // [SAFARI-EXT-STORAGE-001] Enhanced remove operation with graceful degradation
      remove: async (keys) => {
        console.log('[SAFARI-EXT-STORAGE-001] Removing sync storage keys:', keys)

        return retryOperation(async () => {
          try {
            const result = await browser.storage.sync.remove(keys)
            console.log('[SAFARI-EXT-STORAGE-001] Sync storage remove successful')

            // [SAFARI-EXT-STORAGE-001] Check quota usage after storage operations
            await storageQuotaUtils.getQuotaUsage()

            return result
          } catch (error) {
            console.error('[SAFARI-EXT-STORAGE-001] Sync storage remove failed:', error)
            if (logger && logger.error) {
              logger.error('[SAFARI-EXT-STORAGE-001] Sync storage remove failed:', error)
            }

            // [SAFARI-EXT-STORAGE-001] Try graceful degradation
            return await storageQuotaUtils.handleStorageFailure(error, 'remove', keys)
          }
        }, 'sync storage remove')
      }
    },

    // [SAFARI-EXT-STORAGE-001] Enhanced local storage with quota management
    local: {
      ...browser.storage.local,

      get: async (keys) => {
        console.log('[SAFARI-EXT-STORAGE-001] Getting local storage:', keys)

        return retryOperation(async () => {
          try {
            const result = await browser.storage.local.get(keys)
            console.log('[SAFARI-EXT-STORAGE-001] Local storage get successful:', result)

            // [SAFARI-EXT-STORAGE-001] Check quota usage after storage operations
            await storageQuotaUtils.getQuotaUsage()

            return result
          } catch (error) {
            console.error('[SAFARI-EXT-STORAGE-001] Local storage get failed:', error)
            if (logger && logger.error) {
              logger.error('[SAFARI-EXT-STORAGE-001] Local storage get failed:', error)
            }

            // [SAFARI-EXT-STORAGE-001] Try graceful degradation
            return await storageQuotaUtils.handleStorageFailure(error, 'get', keys)
          }
        }, 'local storage get')
      },

      set: async (data) => {
        console.log('[SAFARI-EXT-STORAGE-001] Setting local storage:', data)

        return retryOperation(async () => {
          try {
            const result = await browser.storage.local.set(data)
            console.log('[SAFARI-EXT-STORAGE-001] Local storage set successful')

            // [SAFARI-EXT-STORAGE-001] Check quota usage after storage operations
            await storageQuotaUtils.getQuotaUsage()

            return result
          } catch (error) {
            console.error('[SAFARI-EXT-STORAGE-001] Local storage set failed:', error)
            if (logger && logger.error) {
              logger.error('[SAFARI-EXT-STORAGE-001] Local storage set failed:', error)
            }

            // [SAFARI-EXT-STORAGE-001] Try graceful degradation
            return await storageQuotaUtils.handleStorageFailure(error, 'set', data)
          }
        }, 'local storage set')
      },

      remove: async (keys) => {
        console.log('[SAFARI-EXT-STORAGE-001] Removing local storage keys:', keys)

        return retryOperation(async () => {
          try {
            const result = await browser.storage.local.remove(keys)
            console.log('[SAFARI-EXT-STORAGE-001] Local storage remove successful')

            // [SAFARI-EXT-STORAGE-001] Check quota usage after storage operations
            await storageQuotaUtils.getQuotaUsage()

            return result
          } catch (error) {
            console.error('[SAFARI-EXT-STORAGE-001] Local storage remove failed:', error)
            if (logger && logger.error) {
              logger.error('[SAFARI-EXT-STORAGE-001] Local storage remove failed:', error)
            }

            // [SAFARI-EXT-STORAGE-001] Try graceful degradation
            return await storageQuotaUtils.handleStorageFailure(error, 'remove', keys)
          }
        }, 'local storage remove')
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
      },
      // [SAFARI-EXT-SHIM-001] Enhanced runtime feature detection
      runtimeFeatureDetection: {
        safari: true,
        chrome: true,
        firefox: true
      },
      performanceMonitoring: {
        safari: true,
        chrome: true,
        firefox: true
      },
      accessibilityFeatures: {
        safari: true,
        chrome: true,
        firefox: true
      },
      securityFeatures: {
        safari: true,
        chrome: true,
        firefox: true
      }
    }

    const isSupported = featureSupport[feature]?.[platform] || false
    console.log(`[SAFARI-EXT-SHIM-001] Feature ${feature} supported on ${platform}:`, isSupported)
    return isSupported
  },

  // [SAFARI-EXT-SHIM-001] Runtime feature detection for dynamic capabilities
  detectRuntimeFeatures: () => {
    const platform = platformUtils.getPlatform()
    console.log('[SAFARI-EXT-SHIM-001] Detecting runtime features for platform:', platform)

    const runtimeFeatures = {
      // [SAFARI-EXT-SHIM-001] Storage capabilities
      storage: {
        sync: typeof browser?.storage?.sync !== 'undefined',
        local: typeof browser?.storage?.local !== 'undefined',
        quota: typeof navigator?.storage?.estimate === 'function',
        compression: platform === 'safari' || platform === 'firefox'
      },
      // [SAFARI-EXT-SHIM-001] Messaging capabilities
      messaging: {
        runtime: typeof browser?.runtime?.sendMessage === 'function',
        tabs: typeof browser?.tabs?.sendMessage === 'function',
        retry: true, // All platforms support retry via our implementation
        timeout: true // All platforms support timeout via our implementation
      },
      // [SAFARI-EXT-SHIM-001] UI capabilities
      ui: {
        backdropFilter: CSS.supports('backdrop-filter', 'blur(10px)'),
        webkitBackdropFilter: CSS.supports('-webkit-backdrop-filter', 'blur(10px)'),
        visualViewport: typeof window?.visualViewport !== 'undefined',
        cssGrid: CSS.supports('display', 'grid'),
        cssFlexbox: CSS.supports('display', 'flex')
      },
      // [SAFARI-EXT-SHIM-001] Performance capabilities
      performance: {
        performanceObserver: typeof PerformanceObserver !== 'undefined',
        performanceMark: typeof performance?.mark === 'function',
        performanceMeasure: typeof performance?.measure === 'function',
        requestIdleCallback: typeof requestIdleCallback === 'function'
      },
      // [SAFARI-EXT-SHIM-001] Security capabilities
      security: {
        crypto: typeof crypto?.getRandomValues === 'function',
        subtle: typeof crypto?.subtle !== 'undefined',
        secureContext: window?.isSecureContext || false
      }
    }

    console.log('[SAFARI-EXT-SHIM-001] Runtime features detected:', runtimeFeatures)
    return runtimeFeatures
  },

  // [SAFARI-EXT-SHIM-001] Performance monitoring utilities
  getPerformanceMetrics: () => {
    const platform = platformUtils.getPlatform()
    console.log('[SAFARI-EXT-SHIM-001] Getting performance metrics for platform:', platform)

    const metrics = {
      platform,
      timestamp: Date.now(),
      memory: {
        used: performance?.memory?.usedJSHeapSize || 0,
        total: performance?.memory?.totalJSHeapSize || 0,
        limit: performance?.memory?.jsHeapSizeLimit || 0
      },
      timing: {
        navigationStart: performance?.timing?.navigationStart || 0,
        loadEventEnd: performance?.timing?.loadEventEnd || 0,
        domContentLoaded: performance?.timing?.domContentLoadedEventEnd || 0
      },
      // [SAFARI-EXT-SHIM-001] Platform-specific performance indicators
      platformSpecific: {
        safari: platform === 'safari'
          ? {
              extensionAPIAvailable: typeof safari?.extension !== 'undefined',
              globalPageAvailable: typeof safari?.extension?.globalPage !== 'undefined'
            }
          : {},
        chrome: platform === 'chrome'
          ? {
              runtimeAPIAvailable: typeof chrome?.runtime !== 'undefined',
              storageAPIAvailable: typeof chrome?.storage !== 'undefined'
            }
          : {},
        firefox: platform === 'firefox'
          ? {
              browserAPIAvailable: typeof browser?.runtime !== 'undefined',
              webextensionPolyfill: typeof browser?.runtime?.getBrowserInfo === 'function'
            }
          : {}
      }
    }

    console.log('[SAFARI-EXT-SHIM-001] Performance metrics:', metrics)
    return metrics
  },

  // [SAFARI-EXT-SHIM-001] Accessibility feature detection
  detectAccessibilityFeatures: () => {
    const platform = platformUtils.getPlatform()
    console.log('[SAFARI-EXT-SHIM-001] Detecting accessibility features for platform:', platform)

    const accessibilityFeatures = {
      // [SAFARI-EXT-SHIM-001] Screen reader support
      screenReader: {
        aria: typeof window?.document?.createElement === 'function',
        liveRegions: CSS.supports('aria-live', 'polite'),
        focusManagement: typeof window?.document?.activeElement !== 'undefined'
      },
      // [SAFARI-EXT-SHIM-001] High contrast support
      highContrast: {
        prefersContrast: window?.matchMedia?.('(prefers-contrast: high)')?.matches || false,
        forcedColors: window?.matchMedia?.('(forced-colors: active)')?.matches || false
      },
      // [SAFARI-EXT-SHIM-001] Reduced motion support
      reducedMotion: {
        prefersReducedMotion: window?.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches || false
      },
      // [SAFARI-EXT-SHIM-001] Platform-specific accessibility
      platformSpecific: {
        safari: platform === 'safari'
          ? {
              voiceOver: navigator?.userAgent?.includes('Mac OS X') || false,
              safariAccessibility: true
            }
          : {},

        chrome: platform === 'chrome'
          ? {
              chromeVox: false, // Would need specific detection
              chromeAccessibility: true
            }
          : {},

        firefox: platform === 'firefox'
          ? {
              nvda: false, // Would need specific detection
              firefoxAccessibility: true
            }
          : {}
      }
    }

    console.log('[SAFARI-EXT-SHIM-001] Accessibility features detected:', accessibilityFeatures)
    return accessibilityFeatures
  },

  // [SAFARI-EXT-SHIM-001] Security feature detection
  detectSecurityFeatures: () => {
    const platform = platformUtils.getPlatform()
    console.log('[SAFARI-EXT-SHIM-001] Detecting security features for platform:', platform)

    const securityFeatures = {
      // [SAFARI-EXT-SHIM-001] Crypto capabilities
      crypto: {
        getRandomValues: typeof crypto?.getRandomValues === 'function',
        subtle: typeof crypto?.subtle !== 'undefined',
        randomUUID: typeof crypto?.randomUUID === 'function'
      },
      // [SAFARI-EXT-SHIM-001] Security context
      context: {
        secureContext: window?.isSecureContext || false,
        https: window?.location?.protocol === 'https:',
        localhost: window?.location?.hostname === 'localhost'
      },
      // [SAFARI-EXT-SHIM-001] Content Security Policy
      csp: {
        supportsCSP: typeof window?.document?.querySelector === 'function'
        // Note: CSP detection would require more sophisticated analysis
      },
      // [SAFARI-EXT-SHIM-001] Platform-specific security
      platformSpecific: {
        safari: platform === 'safari'
          ? {
              safariSecurity: true,
              appSandbox: true
            }
          : {},
        chrome: platform === 'chrome'
          ? {
              chromeSecurity: true,
              extensionSandbox: true
            }
          : {},
        firefox: platform === 'firefox'
          ? {
              firefoxSecurity: true,
              webextensionSandbox: true
            }
          : {}
      }
    }

    console.log('[SAFARI-EXT-SHIM-001] Security features detected:', securityFeatures)
    return securityFeatures
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
        storageQuotaCritical: 95,
        storageQuotaCleanup: 90,
        enableTabFiltering: true,
        enableStorageBatching: true,
        enableStorageCompression: true,
        storageCacheTimeout: 30000,
        storageBatchSize: 10,
        // [SAFARI-EXT-SHIM-001] Enhanced Safari-specific optimizations
        enableRuntimeFeatureDetection: true,
        enablePerformanceMonitoring: true,
        enableAccessibilityFeatures: true,
        enableSecurityFeatures: true,
        performanceMonitoringInterval: 30000, // 30 seconds
        accessibilityCheckInterval: 60000, // 1 minute
        securityCheckInterval: 300000 // 5 minutes
      },
      chrome: {
        maxRetries: 2,
        baseDelay: 100,
        maxDelay: 1000,
        storageQuotaWarning: 90,
        storageQuotaCritical: 98,
        storageQuotaCleanup: 95,
        enableTabFiltering: false,
        enableStorageBatching: true,
        enableStorageCompression: false,
        storageCacheTimeout: 30000,
        storageBatchSize: 15,
        // [SAFARI-EXT-SHIM-001] Enhanced Chrome-specific optimizations
        enableRuntimeFeatureDetection: true,
        enablePerformanceMonitoring: true,
        enableAccessibilityFeatures: true,
        enableSecurityFeatures: true,
        performanceMonitoringInterval: 45000, // 45 seconds
        accessibilityCheckInterval: 90000, // 1.5 minutes
        securityCheckInterval: 600000 // 10 minutes
      },
      firefox: {
        maxRetries: 3,
        baseDelay: 200,
        maxDelay: 2000,
        storageQuotaWarning: 85,
        storageQuotaCritical: 95,
        storageQuotaCleanup: 90,
        enableTabFiltering: false,
        enableStorageBatching: true,
        enableStorageCompression: true,
        storageCacheTimeout: 45000,
        storageBatchSize: 8,
        // [SAFARI-EXT-SHIM-001] Enhanced Firefox-specific optimizations
        enableRuntimeFeatureDetection: true,
        enablePerformanceMonitoring: true,
        enableAccessibilityFeatures: true,
        enableSecurityFeatures: true,
        performanceMonitoringInterval: 60000, // 1 minute
        accessibilityCheckInterval: 120000, // 2 minutes
        securityCheckInterval: 900000 // 15 minutes
      }
    }

    return platformConfigs[platform] || platformConfigs.chrome
  },

  // [SAFARI-EXT-SHIM-001] Comprehensive platform analysis
  analyzePlatform: () => {
    const platform = platformUtils.getPlatform()
    console.log('[SAFARI-EXT-SHIM-001] Performing comprehensive platform analysis for:', platform)

    const analysis = {
      platform,
      timestamp: Date.now(),
      config: platformUtils.getPlatformConfig(),
      runtimeFeatures: platformUtils.detectRuntimeFeatures(),
      performanceMetrics: platformUtils.getPerformanceMetrics(),
      accessibilityFeatures: platformUtils.detectAccessibilityFeatures(),
      securityFeatures: platformUtils.detectSecurityFeatures(),
      // [SAFARI-EXT-SHIM-001] Platform-specific recommendations
      recommendations: {
        safari: platform === 'safari'
          ? {
              enableCompression: true,
              useTabFiltering: true,
              monitorStorageQuota: true,
              enableAccessibility: true
            }
          : {},
        chrome: platform === 'chrome'
          ? {
              enableCompression: false,
              useTabFiltering: false,
              monitorStorageQuota: true,
              enableAccessibility: true
            }
          : {},
        firefox: platform === 'firefox'
          ? {
              enableCompression: true,
              useTabFiltering: false,
              monitorStorageQuota: true,
              enableAccessibility: true
            }
          : {}
      }
    }

    console.log('[SAFARI-EXT-SHIM-001] Platform analysis completed:', analysis)
    return analysis
  }
}
