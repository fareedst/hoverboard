var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};

// src/shared/logger.js
var Logger, logger;
var init_logger = __esm({
  "src/shared/logger.js"() {
    Logger = class {
      constructor(context = "Hoverboard") {
        this.context = context;
        this.logLevel = this.getLogLevel();
      }
      // IMPL-LOG_LEVEL_CONFIG: Environment-based log level determination
      // SPECIFICATION: Production builds should minimize console output for performance
      // IMPLEMENTATION DECISION: Debug logs in development, warnings+ in production
      getLogLevel() {
        if (typeof process === "undefined" || !process.env) {
          return "debug";
        }
        return false ? "warn" : "debug";
      }
      // IMPL-LOGGER_CONTEXT_LEVELS: Log level filtering logic
      // IMPLEMENTATION DECISION: Numeric level comparison for efficient filtering
      shouldLog(level) {
        const levels = { debug: 0, info: 1, warn: 2, error: 3 };
        return levels[level] >= levels[this.logLevel];
      }
      // IMPL-LOGGER_CONTEXT_LEVELS: Consistent message formatting with metadata
      // SPECIFICATION: Include timestamp, context, and level for log analysis
      // IMPLEMENTATION DECISION: ISO timestamp format for precise timing and parsing
      formatMessage(level, message, ...args) {
        const timestamp = (/* @__PURE__ */ new Date()).toISOString();
        const prefix = `[${timestamp}] [${this.context}] [${level.toUpperCase()}]`;
        return [prefix, message, ...args];
      }
      // IMPL-LOGGER_CONTEXT_LEVELS: Debug level logging - Development information
      // IMPLEMENTATION DECISION: Use console.log for debug to distinguish from info
      debug(message, ...args) {
        if (this.shouldLog("debug")) {
          console.log(...this.formatMessage("debug", message, ...args));
        }
      }
      // IMPL-LOGGER_CONTEXT_LEVELS: Info level logging - General information
      // IMPLEMENTATION DECISION: Use console.info for semantic clarity
      info(message, ...args) {
        if (this.shouldLog("info")) {
          console.info(...this.formatMessage("info", message, ...args));
        }
      }
      // IMPL-LOGGER_CONTEXT_LEVELS: Warning level logging - Non-critical issues
      // IMPLEMENTATION DECISION: Use console.warn for proper browser developer tools integration
      warn(message, ...args) {
        if (this.shouldLog("warn")) {
          console.warn(...this.formatMessage("warn", message, ...args));
        }
      }
      // IMPL-LOGGER_CONTEXT_LEVELS: Error level logging - Critical issues
      // IMPLEMENTATION DECISION: Use console.error for proper error tracking and debugging
      error(message, ...args) {
        if (this.shouldLog("error")) {
          console.error(...this.formatMessage("error", message, ...args));
        }
      }
      // IMPL-LOGGER_LEGACY: Legacy compatibility methods
      // SPECIFICATION: Maintain backward compatibility during gradual migration
      // IMPLEMENTATION DECISION: Map legacy log calls to debug level
      log(context, ...args) {
        this.debug(`[${context}]`, ...args);
      }
    };
    logger = new Logger();
  }
});

// src/shared/safari-shim.js
function initializeBrowserAPI() {
  console.log("[SAFARI-EXT-SHIM-001] Initializing browser API abstraction");
  if (typeof chrome !== "undefined") {
    browser2 = chrome;
    console.log("[SAFARI-EXT-SHIM-001] Using Chrome API");
    if (logger && logger.debug) {
      logger.debug("[SAFARI-EXT-SHIM-001] Using Chrome API");
    }
    return;
  }
  try {
    if (typeof window !== "undefined" && window.browser) {
      browser2 = window.browser;
      console.log("[SAFARI-EXT-SHIM-001] Using webextension-polyfill");
      if (logger && logger.debug) {
        logger.debug("[SAFARI-EXT-SHIM-001] Using webextension-polyfill");
      }
      return;
    }
  } catch (polyfillError) {
    console.warn("[SAFARI-EXT-SHIM-001] webextension-polyfill failed:", polyfillError.message);
  }
  browser2 = createMinimalBrowserAPI();
  console.warn("[SAFARI-EXT-SHIM-001] No browser API available, using minimal mock");
  if (logger && logger.warn) {
    logger.warn("[SAFARI-EXT-SHIM-001] No browser API available, using minimal mock");
  }
}
async function retryOperation(operation, operationName, maxRetries = retryConfig.maxRetries) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[SAFARI-EXT-SHIM-001] ${operationName} attempt ${attempt}/${maxRetries}`);
      return await operation();
    } catch (error) {
      lastError = error;
      console.warn(`[SAFARI-EXT-SHIM-001] ${operationName} attempt ${attempt} failed:`, error.message);
      if (attempt < maxRetries) {
        const delay = Math.min(
          retryConfig.baseDelay * Math.pow(retryConfig.backoffMultiplier, attempt - 1),
          retryConfig.maxDelay
        );
        console.log(`[SAFARI-EXT-SHIM-001] Retrying ${operationName} in ${delay}ms`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  console.error(`[SAFARI-EXT-SHIM-001] ${operationName} failed after ${maxRetries} attempts:`, lastError);
  throw lastError;
}
function createMinimalBrowserAPI() {
  console.log("[SAFARI-EXT-SHIM-001] Creating minimal browser API mock");
  return {
    runtime: {
      id: "mock-extension-id",
      getManifest: () => ({ version: "1.0.0" }),
      sendMessage: () => Promise.resolve(),
      onMessage: { addListener: () => {
      } },
      onInstalled: { addListener: () => {
      } }
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
  };
}
var browser2, retryConfig, storageQuotaConfig, quotaCache, storageQueue, storageQueueTimeout, storageQuotaUtils, safariEnhancements, platformUtils;
var init_safari_shim = __esm({
  "src/shared/safari-shim.js"() {
    init_logger();
    initializeBrowserAPI();
    retryConfig = {
      maxRetries: 3,
      baseDelay: 100,
      maxDelay: 1e3,
      backoffMultiplier: 2
    };
    storageQuotaConfig = {
      warningThreshold: 80,
      // Percentage threshold for warnings
      criticalThreshold: 95,
      // Percentage threshold for critical warnings
      cleanupThreshold: 90,
      // Percentage threshold for automatic cleanup
      maxRetries: 3,
      cacheTimeout: 3e4,
      // 30 seconds cache timeout
      batchSize: 10,
      // Number of operations to batch
      compressionThreshold: 1024,
      // Minimum size for compression (1KB)
      fallbackStrategies: ["local", "memory", "none"]
    };
    quotaCache = {
      data: null,
      timestamp: 0,
      isValid: () => {
        return quotaCache.data && Date.now() - quotaCache.timestamp < storageQuotaConfig.cacheTimeout;
      }
    };
    storageQueue = [];
    storageQueueTimeout = null;
    storageQuotaUtils = {
      // [SAFARI-EXT-STORAGE-001] Get platform-specific quota configuration
      getQuotaConfig: () => {
        const platform = platformUtils.getPlatform();
        const platformConfig = platformUtils.getPlatformConfig();
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
        };
      },
      // [SAFARI-EXT-STORAGE-001] Enhanced quota usage monitoring with caching
      getQuotaUsage: async (forceRefresh = false) => {
        console.log("[SAFARI-EXT-STORAGE-001] Getting storage quota usage (forceRefresh:", forceRefresh, ")");
        if (!forceRefresh && quotaCache.isValid()) {
          console.log("[SAFARI-EXT-STORAGE-001] Using cached quota data:", quotaCache.data);
          return quotaCache.data;
        }
        try {
          if ("storage" in navigator && "estimate" in navigator.storage) {
            const estimate = await navigator.storage.estimate();
            const quotaUsage = {
              used: estimate.usage || 0,
              quota: estimate.quota || 0,
              usagePercent: estimate.quota ? estimate.usage / estimate.quota * 100 : 0,
              available: estimate.quota ? estimate.quota - estimate.usage : 0,
              timestamp: Date.now()
            };
            quotaCache.data = quotaUsage;
            quotaCache.timestamp = Date.now();
            console.log("[SAFARI-EXT-STORAGE-001] Storage quota usage:", quotaUsage);
            await storageQuotaUtils.monitorQuotaUsage(quotaUsage);
            return quotaUsage;
          }
          console.warn("[SAFARI-EXT-STORAGE-001] Storage API not available, returning default values");
          const defaultUsage = { used: 0, quota: 0, usagePercent: 0, available: 0, timestamp: Date.now() };
          quotaCache.data = defaultUsage;
          quotaCache.timestamp = Date.now();
          return defaultUsage;
        } catch (error) {
          console.error("[SAFARI-EXT-STORAGE-001] Storage quota check failed:", error);
          if (logger && logger.error) {
            logger.error("[SAFARI-EXT-STORAGE-001] Storage quota check failed:", error);
          }
          const fallbackUsage = { used: 0, quota: 0, usagePercent: 0, available: 0, timestamp: Date.now() };
          quotaCache.data = fallbackUsage;
          quotaCache.timestamp = Date.now();
          return fallbackUsage;
        }
      },
      // [SAFARI-EXT-STORAGE-001] Enhanced quota monitoring with predictive warnings
      monitorQuotaUsage: async (quotaUsage) => {
        const config = storageQuotaUtils.getQuotaConfig();
        if (quotaUsage.usagePercent >= config.criticalThreshold) {
          const criticalWarning = `[SAFARI-EXT-STORAGE-001] CRITICAL: Storage quota usage at ${quotaUsage.usagePercent.toFixed(1)}%`;
          console.error(criticalWarning);
          if (logger && logger.error) {
            logger.error(criticalWarning);
          }
          await storageQuotaUtils.triggerAutomaticCleanup();
        } else if (quotaUsage.usagePercent >= config.warningThreshold) {
          const warning = `[SAFARI-EXT-STORAGE-001] Storage quota usage high: ${quotaUsage.usagePercent.toFixed(1)}%`;
          console.warn(warning);
          if (logger && logger.warn) {
            logger.warn(warning);
          }
          if (quotaUsage.usagePercent >= config.cleanupThreshold) {
            const predictiveWarning = "[SAFARI-EXT-STORAGE-001] Approaching critical threshold, consider cleanup";
            console.warn(predictiveWarning);
            if (logger && logger.warn) {
              logger.warn(predictiveWarning);
            }
          }
        }
      },
      // [SAFARI-EXT-STORAGE-001] Automatic cleanup for storage quota management
      triggerAutomaticCleanup: async () => {
        console.log("[SAFARI-EXT-STORAGE-001] Triggering automatic storage cleanup");
        try {
          const storageData = await browser2.storage.sync.get(null);
          const cleanupCandidates = [];
          for (const [key, value] of Object.entries(storageData)) {
            const dataSize = JSON.stringify(value).length;
            const dataAge = value.timestamp ? Date.now() - value.timestamp : 0;
            if (dataSize > storageQuotaConfig.compressionThreshold || dataAge > 7 * 24 * 60 * 60 * 1e3) {
              cleanupCandidates.push({ key, size: dataSize, age: dataAge });
            }
          }
          cleanupCandidates.sort((a, b) => b.size - a.size || b.age - a.age);
          const config = storageQuotaUtils.getQuotaConfig();
          let removedCount = 0;
          for (const candidate of cleanupCandidates) {
            if (removedCount >= 5) break;
            try {
              await browser2.storage.sync.remove(candidate.key);
              console.log(`[SAFARI-EXT-STORAGE-001] Cleaned up storage key: ${candidate.key} (${candidate.size} bytes)`);
              removedCount++;
            } catch (error) {
              console.error(`[SAFARI-EXT-STORAGE-001] Failed to cleanup ${candidate.key}:`, error);
            }
          }
          if (removedCount > 0) {
            console.log(`[SAFARI-EXT-STORAGE-001] Automatic cleanup completed: removed ${removedCount} items`);
            quotaCache.data = null;
            await storageQuotaUtils.getQuotaUsage(true);
          }
        } catch (error) {
          console.error("[SAFARI-EXT-STORAGE-001] Automatic cleanup failed:", error);
          if (logger && logger.error) {
            logger.error("[SAFARI-EXT-STORAGE-001] Automatic cleanup failed:", error);
          }
        }
      },
      // [SAFARI-EXT-STORAGE-001] Graceful degradation for storage failures
      handleStorageFailure: async (error, operation, fallbackData = null) => {
        console.error(`[SAFARI-EXT-STORAGE-001] Storage operation failed: ${operation}`, error);
        if (logger && logger.error) {
          logger.error(`[SAFARI-EXT-STORAGE-001] Storage operation failed: ${operation}`, error);
        }
        const config = storageQuotaUtils.getQuotaConfig();
        for (const strategy of config.fallbackStrategies) {
          try {
            switch (strategy) {
              case "local":
                console.log("[SAFARI-EXT-STORAGE-001] Trying local storage fallback");
                if (operation === "get") {
                  return await browser2.storage.local.get(fallbackData);
                } else if (operation === "set") {
                  return await browser2.storage.local.set(fallbackData);
                }
                break;
              case "memory":
                console.log("[SAFARI-EXT-STORAGE-001] Using memory fallback");
                return fallbackData;
              case "none":
                console.log("[SAFARI-EXT-STORAGE-001] No fallback available, throwing error");
                throw error;
            }
          } catch (fallbackError) {
            console.warn(`[SAFARI-EXT-STORAGE-001] Fallback strategy '${strategy}' failed:`, fallbackError);
            continue;
          }
        }
        throw error;
      },
      // [SAFARI-EXT-STORAGE-001] Batch storage operations for performance
      queueStorageOperation: (operation) => {
        storageQueue.push(operation);
        if (storageQueue.length >= storageQuotaConfig.batchSize) {
          storageQuotaUtils.processStorageQueue();
        } else if (!storageQueueTimeout) {
          storageQueueTimeout = setTimeout(() => {
            storageQuotaUtils.processStorageQueue();
          }, 100);
        }
      },
      // [SAFARI-EXT-STORAGE-001] Process batched storage operations
      processStorageQueue: async () => {
        if (storageQueue.length === 0) return;
        const operations = [...storageQueue];
        storageQueue = [];
        storageQueueTimeout = null;
        console.log(`[SAFARI-EXT-STORAGE-001] Processing ${operations.length} batched storage operations`);
        try {
          const getOps = operations.filter((op) => op.type === "get");
          const setOps = operations.filter((op) => op.type === "set");
          const removeOps = operations.filter((op) => op.type === "remove");
          const results = [];
          if (getOps.length > 0) {
            const keys = getOps.flatMap((op) => op.keys || []);
            const result = await browser2.storage.sync.get(keys);
            results.push(...getOps.map((op) => ({ ...op, result })));
          }
          if (setOps.length > 0) {
            const data = Object.assign({}, ...setOps.map((op) => op.data));
            const result = await browser2.storage.sync.set(data);
            results.push(...setOps.map((op) => ({ ...op, result })));
          }
          if (removeOps.length > 0) {
            const keys = removeOps.flatMap((op) => op.keys || []);
            const result = await browser2.storage.sync.remove(keys);
            results.push(...removeOps.map((op) => ({ ...op, result })));
          }
          console.log(`[SAFARI-EXT-STORAGE-001] Successfully processed ${operations.length} batched operations`);
          await storageQuotaUtils.getQuotaUsage(true);
        } catch (error) {
          console.error("[SAFARI-EXT-STORAGE-001] Batch storage operations failed:", error);
          if (logger && logger.error) {
            logger.error("[SAFARI-EXT-STORAGE-001] Batch storage operations failed:", error);
          }
          for (const operation of operations) {
            try {
              await retryOperation(async () => {
                if (operation.type === "get") {
                  return await browser2.storage.sync.get(operation.keys);
                } else if (operation.type === "set") {
                  return await browser2.storage.sync.set(operation.data);
                } else if (operation.type === "remove") {
                  return await browser2.storage.sync.remove(operation.keys);
                }
              }, `individual ${operation.type} operation`);
            } catch (individualError) {
              console.error("[SAFARI-EXT-STORAGE-001] Individual operation failed:", individualError);
            }
          }
        }
      }
    };
    safariEnhancements = {
      // Safari storage quota management
      storage: {
        ...browser2.storage,
        // [SAFARI-EXT-STORAGE-001] Enhanced Safari storage quota management
        getQuotaUsage: storageQuotaUtils.getQuotaUsage,
        // [SAFARI-EXT-STORAGE-001] Enhanced Safari-optimized storage operations
        sync: {
          ...browser2.storage.sync,
          // Safari sync storage with enhanced quota management and retry logic
          get: async (keys) => {
            console.log("[SAFARI-EXT-STORAGE-001] Getting sync storage:", keys);
            return retryOperation(async () => {
              try {
                const result = await browser2.storage.sync.get(keys);
                console.log("[SAFARI-EXT-STORAGE-001] Sync storage get successful:", result);
                await storageQuotaUtils.getQuotaUsage();
                return result;
              } catch (error) {
                console.error("[SAFARI-EXT-STORAGE-001] Sync storage get failed:", error);
                if (logger && logger.error) {
                  logger.error("[SAFARI-EXT-STORAGE-001] Sync storage get failed:", error);
                }
                return await storageQuotaUtils.handleStorageFailure(error, "get", keys);
              }
            }, "sync storage get");
          },
          // Enhanced set operation with retry logic and graceful degradation
          set: async (data) => {
            console.log("[SAFARI-EXT-STORAGE-001] Setting sync storage:", data);
            return retryOperation(async () => {
              try {
                const result = await browser2.storage.sync.set(data);
                console.log("[SAFARI-EXT-STORAGE-001] Sync storage set successful");
                await storageQuotaUtils.getQuotaUsage();
                return result;
              } catch (error) {
                console.error("[SAFARI-EXT-STORAGE-001] Sync storage set failed:", error);
                if (logger && logger.error) {
                  logger.error("[SAFARI-EXT-STORAGE-001] Sync storage set failed:", error);
                }
                return await storageQuotaUtils.handleStorageFailure(error, "set", data);
              }
            }, "sync storage set");
          },
          // [SAFARI-EXT-STORAGE-001] Enhanced remove operation with graceful degradation
          remove: async (keys) => {
            console.log("[SAFARI-EXT-STORAGE-001] Removing sync storage keys:", keys);
            return retryOperation(async () => {
              try {
                const result = await browser2.storage.sync.remove(keys);
                console.log("[SAFARI-EXT-STORAGE-001] Sync storage remove successful");
                await storageQuotaUtils.getQuotaUsage();
                return result;
              } catch (error) {
                console.error("[SAFARI-EXT-STORAGE-001] Sync storage remove failed:", error);
                if (logger && logger.error) {
                  logger.error("[SAFARI-EXT-STORAGE-001] Sync storage remove failed:", error);
                }
                return await storageQuotaUtils.handleStorageFailure(error, "remove", keys);
              }
            }, "sync storage remove");
          }
        },
        // [SAFARI-EXT-STORAGE-001] Enhanced local storage with quota management
        local: {
          ...browser2.storage.local,
          get: async (keys) => {
            console.log("[SAFARI-EXT-STORAGE-001] Getting local storage:", keys);
            return retryOperation(async () => {
              try {
                const result = await browser2.storage.local.get(keys);
                console.log("[SAFARI-EXT-STORAGE-001] Local storage get successful:", result);
                await storageQuotaUtils.getQuotaUsage();
                return result;
              } catch (error) {
                console.error("[SAFARI-EXT-STORAGE-001] Local storage get failed:", error);
                if (logger && logger.error) {
                  logger.error("[SAFARI-EXT-STORAGE-001] Local storage get failed:", error);
                }
                return await storageQuotaUtils.handleStorageFailure(error, "get", keys);
              }
            }, "local storage get");
          },
          set: async (data) => {
            console.log("[SAFARI-EXT-STORAGE-001] Setting local storage:", data);
            return retryOperation(async () => {
              try {
                const result = await browser2.storage.local.set(data);
                console.log("[SAFARI-EXT-STORAGE-001] Local storage set successful");
                await storageQuotaUtils.getQuotaUsage();
                return result;
              } catch (error) {
                console.error("[SAFARI-EXT-STORAGE-001] Local storage set failed:", error);
                if (logger && logger.error) {
                  logger.error("[SAFARI-EXT-STORAGE-001] Local storage set failed:", error);
                }
                return await storageQuotaUtils.handleStorageFailure(error, "set", data);
              }
            }, "local storage set");
          },
          remove: async (keys) => {
            console.log("[SAFARI-EXT-STORAGE-001] Removing local storage keys:", keys);
            return retryOperation(async () => {
              try {
                const result = await browser2.storage.local.remove(keys);
                console.log("[SAFARI-EXT-STORAGE-001] Local storage remove successful");
                await storageQuotaUtils.getQuotaUsage();
                return result;
              } catch (error) {
                console.error("[SAFARI-EXT-STORAGE-001] Local storage remove failed:", error);
                if (logger && logger.error) {
                  logger.error("[SAFARI-EXT-STORAGE-001] Local storage remove failed:", error);
                }
                return await storageQuotaUtils.handleStorageFailure(error, "remove", keys);
              }
            }, "local storage remove");
          }
        }
      },
      // Enhanced Safari message passing optimizations
      runtime: {
        ...browser2.runtime,
        // [SAFARI-EXT-MESSAGING-001] Enhanced Safari-optimized message passing
        sendMessage: async (message) => {
          console.log("[SAFARI-EXT-MESSAGING-001] Sending message:", message);
          return retryOperation(async () => {
            try {
              const enhancedMessage = {
                ...message,
                timestamp: Date.now(),
                version: browser2.runtime.getManifest().version
              };
              if (typeof safari !== "undefined") {
                enhancedMessage.platform = "safari";
                console.log("[SAFARI-EXT-MESSAGING-001] Safari platform detected, adding platform info");
              }
              if (logger && logger.debug) {
                logger.debug("[SAFARI-EXT-MESSAGING-001] Sending message:", enhancedMessage);
              }
              return new Promise((resolve, reject) => {
                chrome.runtime.sendMessage(enhancedMessage, (response) => {
                  if (chrome.runtime.lastError) {
                    const error = new Error(chrome.runtime.lastError.message);
                    console.error("[SAFARI-EXT-MESSAGING-001] Message send failed:", error.message);
                    if (logger && logger.error) {
                      logger.error("[SAFARI-EXT-MESSAGING-001] Message send failed:", error);
                    }
                    reject(error);
                  } else {
                    console.log("[SAFARI-EXT-MESSAGING-001] Message sent successfully:", response);
                    resolve(response);
                  }
                });
              });
            } catch (error) {
              console.error("[SAFARI-EXT-MESSAGING-001] Message send failed:", error.message);
              if (logger && logger.error) {
                logger.error("[SAFARI-EXT-MESSAGING-001] Message send failed:", error);
              }
              throw error;
            }
          }, "runtime sendMessage");
        },
        // [SAFARI-EXT-MESSAGING-001] Enhanced Safari message listener with error handling
        onMessage: {
          ...browser2.runtime.onMessage,
          addListener: (callback) => {
            console.log("[SAFARI-EXT-MESSAGING-001] Adding message listener");
            const wrappedCallback = (message, sender, sendResponse) => {
              try {
                console.log("[SAFARI-EXT-MESSAGING-001] Received message:", message);
                if (logger && logger.debug) {
                  logger.debug("[SAFARI-EXT-MESSAGING-001] Received message:", message);
                }
                const result = callback(message, sender, sendResponse);
                if (result && typeof result.then === "function") {
                  result.then((response) => {
                    console.log("[SAFARI-EXT-MESSAGING-001] Async response:", response);
                    if (logger && logger.debug) {
                      logger.debug("[SAFARI-EXT-MESSAGING-001] Async response:", response);
                    }
                  }).catch((error) => {
                    console.error("[SAFARI-EXT-MESSAGING-001] Message handler error:", error);
                    if (logger && logger.error) {
                      logger.error("[SAFARI-EXT-MESSAGING-001] Message handler error:", error);
                    }
                  });
                }
                return result;
              } catch (error) {
                console.error("[SAFARI-EXT-MESSAGING-001] Message handler error:", error);
                if (logger && logger.error) {
                  logger.error("[SAFARI-EXT-MESSAGING-001] Message handler error:", error);
                }
                throw error;
              }
            };
            return chrome.runtime.onMessage.addListener(wrappedCallback);
          }
        }
      },
      // Enhanced Safari tabs API enhancements
      tabs: {
        ...browser2.tabs,
        // [SAFARI-EXT-CONTENT-001] Enhanced Safari-optimized tab querying
        query: async (queryInfo) => {
          console.log("[SAFARI-EXT-CONTENT-001] Querying tabs:", queryInfo);
          return retryOperation(async () => {
            try {
              const tabs = await browser2.tabs.query(queryInfo);
              console.log("[SAFARI-EXT-CONTENT-001] Tab query successful, found tabs:", tabs.length);
              if (typeof safari !== "undefined") {
                const filteredTabs = tabs.filter((tab) => !tab.url.startsWith("safari-extension://"));
                console.log("[SAFARI-EXT-CONTENT-001] Filtered tabs:", { original: tabs.length, filtered: filteredTabs.length });
                if (logger && logger.debug) {
                  logger.debug("[SAFARI-EXT-CONTENT-001] Filtered tabs:", { original: tabs.length, filtered: filteredTabs.length });
                }
                return filteredTabs;
              }
              return tabs;
            } catch (error) {
              console.error("[SAFARI-EXT-CONTENT-001] Tab query failed:", error.message);
              if (logger && logger.error) {
                logger.error("[SAFARI-EXT-CONTENT-001] Tab query failed:", error);
              }
              throw error;
            }
          }, "tabs query");
        },
        // [SAFARI-EXT-MESSAGING-001] Enhanced Safari-optimized tab message sending
        sendMessage: async (tabId, message) => {
          console.log("[SAFARI-EXT-MESSAGING-001] Sending message to tab:", { tabId, message });
          return retryOperation(async () => {
            try {
              if (logger && logger.debug) {
                logger.debug("[SAFARI-EXT-MESSAGING-001] Sending message to tab:", { tabId, message });
              }
              return new Promise((resolve, reject) => {
                chrome.tabs.sendMessage(tabId, message, (response) => {
                  if (chrome.runtime.lastError) {
                    const error = new Error(chrome.runtime.lastError.message);
                    console.error("[SAFARI-EXT-MESSAGING-001] Tab message send failed:", error.message);
                    reject(error);
                  } else {
                    console.log("[SAFARI-EXT-MESSAGING-001] Tab message sent successfully:", response);
                    resolve(response);
                  }
                });
              });
            } catch (error) {
              console.error("[SAFARI-EXT-MESSAGING-001] Tab message send failed:", error.message);
              if (logger && logger.error) {
                logger.error("[SAFARI-EXT-MESSAGING-001] Tab message send failed:", error);
              }
              throw error;
            }
          }, "tabs sendMessage");
        }
      }
    };
    platformUtils = {
      isSafari: () => {
        const isSafari = typeof safari !== "undefined";
        console.log("[SAFARI-EXT-SHIM-001] Safari detection:", isSafari);
        return isSafari;
      },
      isChrome: () => {
        const isChrome = typeof chrome !== "undefined" && !platformUtils.isSafari();
        console.log("[SAFARI-EXT-SHIM-001] Chrome detection:", isChrome);
        return isChrome;
      },
      isFirefox: () => {
        const isFirefox = typeof browser2 !== "undefined" && browser2.runtime.getBrowserInfo;
        console.log("[SAFARI-EXT-SHIM-001] Firefox detection:", isFirefox);
        return isFirefox;
      },
      // [SAFARI-EXT-SHIM-001] Get current platform for feature detection
      getPlatform: () => {
        if (platformUtils.isSafari()) return "safari";
        if (platformUtils.isChrome()) return "chrome";
        if (platformUtils.isFirefox()) return "firefox";
        return "unknown";
      },
      // [SAFARI-EXT-SHIM-001] Enhanced feature support detection
      supportsFeature: (feature) => {
        const platform = platformUtils.getPlatform();
        console.log(`[SAFARI-EXT-SHIM-001] Checking feature support: ${feature} on ${platform}`);
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
        };
        const isSupported = featureSupport[feature]?.[platform] || false;
        console.log(`[SAFARI-EXT-SHIM-001] Feature ${feature} supported on ${platform}:`, isSupported);
        return isSupported;
      },
      // [SAFARI-EXT-SHIM-001] Runtime feature detection for dynamic capabilities
      detectRuntimeFeatures: () => {
        const platform = platformUtils.getPlatform();
        console.log("[SAFARI-EXT-SHIM-001] Detecting runtime features for platform:", platform);
        const runtimeFeatures = {
          // [SAFARI-EXT-SHIM-001] Storage capabilities
          storage: {
            sync: typeof browser2?.storage?.sync !== "undefined",
            local: typeof browser2?.storage?.local !== "undefined",
            quota: typeof navigator?.storage?.estimate === "function",
            compression: platform === "safari" || platform === "firefox"
          },
          // [SAFARI-EXT-SHIM-001] Messaging capabilities
          messaging: {
            runtime: typeof browser2?.runtime?.sendMessage === "function",
            tabs: typeof browser2?.tabs?.sendMessage === "function",
            retry: true,
            // All platforms support retry via our implementation
            timeout: true
            // All platforms support timeout via our implementation
          },
          // [SAFARI-EXT-SHIM-001] UI capabilities
          ui: {
            backdropFilter: CSS.supports("backdrop-filter", "blur(10px)"),
            webkitBackdropFilter: CSS.supports("-webkit-backdrop-filter", "blur(10px)"),
            visualViewport: typeof window?.visualViewport !== "undefined",
            cssGrid: CSS.supports("display", "grid"),
            cssFlexbox: CSS.supports("display", "flex")
          },
          // [SAFARI-EXT-SHIM-001] Performance capabilities
          performance: {
            performanceObserver: typeof PerformanceObserver !== "undefined",
            performanceMark: typeof performance?.mark === "function",
            performanceMeasure: typeof performance?.measure === "function",
            requestIdleCallback: typeof requestIdleCallback === "function"
          },
          // [SAFARI-EXT-SHIM-001] Security capabilities
          security: {
            crypto: typeof crypto?.getRandomValues === "function",
            subtle: typeof crypto?.subtle !== "undefined",
            secureContext: window?.isSecureContext || false
          }
        };
        console.log("[SAFARI-EXT-SHIM-001] Runtime features detected:", runtimeFeatures);
        return runtimeFeatures;
      },
      // [SAFARI-EXT-SHIM-001] Performance monitoring utilities
      getPerformanceMetrics: () => {
        const platform = platformUtils.getPlatform();
        console.log("[SAFARI-EXT-SHIM-001] Getting performance metrics for platform:", platform);
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
            safari: platform === "safari" ? {
              extensionAPIAvailable: typeof safari?.extension !== "undefined",
              globalPageAvailable: typeof safari?.extension?.globalPage !== "undefined"
            } : {},
            chrome: platform === "chrome" ? {
              runtimeAPIAvailable: typeof chrome?.runtime !== "undefined",
              storageAPIAvailable: typeof chrome?.storage !== "undefined"
            } : {},
            firefox: platform === "firefox" ? {
              browserAPIAvailable: typeof browser2?.runtime !== "undefined",
              webextensionPolyfill: typeof browser2?.runtime?.getBrowserInfo === "function"
            } : {}
          }
        };
        console.log("[SAFARI-EXT-SHIM-001] Performance metrics:", metrics);
        return metrics;
      },
      // [SAFARI-EXT-SHIM-001] Accessibility feature detection
      detectAccessibilityFeatures: () => {
        const platform = platformUtils.getPlatform();
        console.log("[SAFARI-EXT-SHIM-001] Detecting accessibility features for platform:", platform);
        const accessibilityFeatures = {
          // [SAFARI-EXT-SHIM-001] Screen reader support
          screenReader: {
            aria: typeof window?.document?.createElement === "function",
            liveRegions: CSS.supports("aria-live", "polite"),
            focusManagement: typeof window?.document?.activeElement !== "undefined"
          },
          // [SAFARI-EXT-SHIM-001] High contrast support
          highContrast: {
            prefersContrast: window?.matchMedia?.("(prefers-contrast: high)")?.matches || false,
            forcedColors: window?.matchMedia?.("(forced-colors: active)")?.matches || false
          },
          // [SAFARI-EXT-SHIM-001] Reduced motion support
          reducedMotion: {
            prefersReducedMotion: window?.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches || false
          },
          // [SAFARI-EXT-SHIM-001] Platform-specific accessibility
          platformSpecific: {
            safari: platform === "safari" ? {
              voiceOver: navigator?.userAgent?.includes("Mac OS X") || false,
              safariAccessibility: true
            } : {},
            chrome: platform === "chrome" ? {
              chromeVox: false,
              // Would need specific detection
              chromeAccessibility: true
            } : {},
            firefox: platform === "firefox" ? {
              nvda: false,
              // Would need specific detection
              firefoxAccessibility: true
            } : {}
          }
        };
        console.log("[SAFARI-EXT-SHIM-001] Accessibility features detected:", accessibilityFeatures);
        return accessibilityFeatures;
      },
      // [SAFARI-EXT-SHIM-001] Security feature detection
      detectSecurityFeatures: () => {
        const platform = platformUtils.getPlatform();
        console.log("[SAFARI-EXT-SHIM-001] Detecting security features for platform:", platform);
        const securityFeatures = {
          // [SAFARI-EXT-SHIM-001] Crypto capabilities
          crypto: {
            getRandomValues: typeof crypto?.getRandomValues === "function",
            subtle: typeof crypto?.subtle !== "undefined",
            randomUUID: typeof crypto?.randomUUID === "function"
          },
          // [SAFARI-EXT-SHIM-001] Security context
          context: {
            secureContext: window?.isSecureContext || false,
            https: window?.location?.protocol === "https:",
            localhost: window?.location?.hostname === "localhost"
          },
          // [SAFARI-EXT-SHIM-001] Content Security Policy
          csp: {
            supportsCSP: typeof window?.document?.querySelector === "function"
            // Note: CSP detection would require more sophisticated analysis
          },
          // [SAFARI-EXT-SHIM-001] Platform-specific security
          platformSpecific: {
            safari: platform === "safari" ? {
              safariSecurity: true,
              appSandbox: true
            } : {},
            chrome: platform === "chrome" ? {
              chromeSecurity: true,
              extensionSandbox: true
            } : {},
            firefox: platform === "firefox" ? {
              firefoxSecurity: true,
              webextensionSandbox: true
            } : {}
          }
        };
        console.log("[SAFARI-EXT-SHIM-001] Security features detected:", securityFeatures);
        return securityFeatures;
      },
      // [SAFARI-EXT-SHIM-001] Get platform-specific configuration
      getPlatformConfig: () => {
        const platform = platformUtils.getPlatform();
        console.log("[SAFARI-EXT-SHIM-001] Getting platform config for:", platform);
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
            storageCacheTimeout: 3e4,
            storageBatchSize: 10,
            // [SAFARI-EXT-SHIM-001] Enhanced Safari-specific optimizations
            enableRuntimeFeatureDetection: true,
            enablePerformanceMonitoring: true,
            enableAccessibilityFeatures: true,
            enableSecurityFeatures: true,
            performanceMonitoringInterval: 3e4,
            // 30 seconds
            accessibilityCheckInterval: 6e4,
            // 1 minute
            securityCheckInterval: 3e5
            // 5 minutes
          },
          chrome: {
            maxRetries: 2,
            baseDelay: 100,
            maxDelay: 1e3,
            storageQuotaWarning: 90,
            storageQuotaCritical: 98,
            storageQuotaCleanup: 95,
            enableTabFiltering: false,
            enableStorageBatching: true,
            enableStorageCompression: false,
            storageCacheTimeout: 3e4,
            storageBatchSize: 15,
            // [SAFARI-EXT-SHIM-001] Enhanced Chrome-specific optimizations
            enableRuntimeFeatureDetection: true,
            enablePerformanceMonitoring: true,
            enableAccessibilityFeatures: true,
            enableSecurityFeatures: true,
            performanceMonitoringInterval: 45e3,
            // 45 seconds
            accessibilityCheckInterval: 9e4,
            // 1.5 minutes
            securityCheckInterval: 6e5
            // 10 minutes
          },
          firefox: {
            maxRetries: 3,
            baseDelay: 200,
            maxDelay: 2e3,
            storageQuotaWarning: 85,
            storageQuotaCritical: 95,
            storageQuotaCleanup: 90,
            enableTabFiltering: false,
            enableStorageBatching: true,
            enableStorageCompression: true,
            storageCacheTimeout: 45e3,
            storageBatchSize: 8,
            // [SAFARI-EXT-SHIM-001] Enhanced Firefox-specific optimizations
            enableRuntimeFeatureDetection: true,
            enablePerformanceMonitoring: true,
            enableAccessibilityFeatures: true,
            enableSecurityFeatures: true,
            performanceMonitoringInterval: 6e4,
            // 1 minute
            accessibilityCheckInterval: 12e4,
            // 2 minutes
            securityCheckInterval: 9e5
            // 15 minutes
          }
        };
        return platformConfigs[platform] || platformConfigs.chrome;
      },
      // [SAFARI-EXT-SHIM-001] Comprehensive platform analysis
      analyzePlatform: () => {
        const platform = platformUtils.getPlatform();
        console.log("[SAFARI-EXT-SHIM-001] Performing comprehensive platform analysis for:", platform);
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
            safari: platform === "safari" ? {
              enableCompression: true,
              useTabFiltering: true,
              monitorStorageQuota: true,
              enableAccessibility: true
            } : {},
            chrome: platform === "chrome" ? {
              enableCompression: false,
              useTabFiltering: false,
              monitorStorageQuota: true,
              enableAccessibility: true
            } : {},
            firefox: platform === "firefox" ? {
              enableCompression: true,
              useTabFiltering: false,
              monitorStorageQuota: true,
              enableAccessibility: true
            } : {}
          }
        };
        console.log("[SAFARI-EXT-SHIM-001] Platform analysis completed:", analysis);
        return analysis;
      }
    };
  }
});

// src/shared/utils.js
function normalizeSelectionForTagInput(selection, maxWords = 8) {
  if (!selection || typeof selection !== "string") return "";
  const stripped = selection.replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
  const words = stripped.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  return words.slice(0, maxWords).join(" ");
}
function debugLog(component, message, ...args) {
  if (DEBUG_CONFIG.enabled) {
    const prefix = `${DEBUG_CONFIG.prefix} [${component}]`;
    if (args.length > 0) {
      console.log(prefix, message, ...args);
    } else {
      console.log(prefix, message);
    }
  }
}
function debugError(component, message, ...args) {
  if (DEBUG_CONFIG.enabled) {
    const prefix = `${DEBUG_CONFIG.prefix} [${component}]`;
    if (args.length > 0) {
      console.error(prefix, message, ...args);
    } else {
      console.error(prefix, message);
    }
  }
}
var DEBUG_CONFIG;
var init_utils = __esm({
  "src/shared/utils.js"() {
    init_logger();
    init_safari_shim();
    DEBUG_CONFIG = {
      enabled: true,
      // Set to false to disable all debug output
      prefix: "[HOVERBOARD-DEBUG]"
    };
  }
});

// src/config/config-manager.js
var ConfigManager;
var init_config_manager = __esm({
  "src/config/config-manager.js"() {
    ConfigManager = class {
      constructor() {
        this.storageKeys = {
          AUTH_TOKEN: "hoverboard_auth_token",
          SETTINGS: "hoverboard_settings",
          STORAGE_MODE: "hoverboard_storage_mode",
          // [ARCH-LOCAL_STORAGE_PROVIDER] - Bookmark storage mode (pinboard | local)
          INHIBIT_URLS: "hoverboard_inhibit_urls",
          RECENT_TAGS: "hoverboard_recent_tags",
          // [IMMUTABLE-REQ-TAG-001] - Tag storage key
          TAG_FREQUENCY: "hoverboard_tag_frequency"
          // [IMMUTABLE-REQ-TAG-001] - Tag frequency storage key
        };
        this.defaultConfig = this.getDefaultConfiguration();
      }
      /**
       * Get default configuration values
       * Migrated from src/shared/config.js
       *
       * IMPL-FEATURE_FLAGS: Feature flags and UI behavior control defaults
       * SPECIFICATION: Each setting controls specific extension behavior
       * IMPLEMENTATION DECISION: Conservative defaults favor user privacy and minimal intrusion
       */
      getDefaultConfiguration() {
        return {
          // [ARCH-LOCAL_STORAGE_PROVIDER] [REQ-STORAGE_MODE_DEFAULT] - Default local: preferable for most users (no account/API required)
          storageMode: "local",
          // IMPL-FEATURE_FLAGS: Feature flags - Core functionality toggles
          // IMPLEMENTATION DECISION: Enable helpful features by default, disable potentially intrusive ones
          hoverShowRecentTags: true,
          // Show recent tags in hover overlay
          hoverShowTooltips: false,
          // Tooltips disabled by default to avoid visual clutter
          showHoverOnPageLoad: false,
          // No automatic hover to respect user intent
          showHoverOPLOnlyIfNoTags: true,
          // Smart overlay display logic
          showHoverOPLOnlyIfSomeTags: false,
          // Complementary to above setting
          inhibitSitesOnPageLoad: true,
          // Respect site-specific inhibition settings
          setIconOnLoad: true,
          // Update extension icon to reflect bookmark status
          // IMPL-FEATURE_FLAGS: UI behavior settings - User experience configuration
          // IMPLEMENTATION DECISION: Reasonable limits that balance functionality with performance
          recentTagsCountMax: 32,
          // Maximum recent tags to track
          initRecentPostsCount: 15,
          // Initial recent posts to load
          uxAutoCloseTimeout: 0,
          // in ms, 0 to disable auto-close (user control)
          uxRecentRowWithBlock: true,
          // Show block button in recent rows
          uxRecentRowWithBookmarkButton: true,
          // Show bookmark button
          uxRecentRowWithCloseButton: true,
          // Show close button for user control
          uxRecentRowWithPrivateButton: true,
          // Privacy control in interface
          uxRecentRowWithDeletePin: true,
          // Allow pin deletion from interface
          uxRecentRowWithInput: true,
          // Enable input controls
          uxUrlStripHash: false,
          // Preserve URL hash by default (maintain full URL context)
          uxShowSectionLabels: false,
          // Show section labels in popup (Quick Actions, Search Tabs)
          // [IMMUTABLE-REQ-TAG-003] - Recent tags configuration
          // IMPLEMENTATION DECISION: Conservative defaults for shared memory management
          recentTagsMaxListSize: 50,
          // Maximum recent tags in shared memory
          recentTagsMaxDisplayCount: 10,
          // Maximum tags to display in UI
          recentTagsSharedMemoryKey: "hoverboard_recent_tags_shared",
          // Shared memory key
          recentTagsEnableUserDriven: true,
          // Enable user-driven recent tags
          recentTagsClearOnReload: true,
          // Clear shared memory on extension reload
          // IMPL-FEATURE_FLAGS: Badge configuration - Extension icon indicator settings
          // IMPLEMENTATION DECISION: Clear visual indicators for different bookmark states
          badgeTextIfNotBookmarked: "-",
          // Clear indication of non-bookmarked state
          badgeTextIfPrivate: "*",
          // Privacy indicator
          badgeTextIfQueued: "!",
          // Pending action indicator
          badgeTextIfBookmarkedNoTags: "0",
          // Zero tags indicator
          // IMPL-CONFIG_MIGRATION: API retry configuration - Network resilience settings
          // IMPLEMENTATION DECISION: Conservative retry strategy to avoid API rate limiting
          pinRetryCountMax: 2,
          // Maximum retry attempts
          pinRetryDelay: 1e3,
          // in ms - delay between retries
          // ⭐ UI-006: Visibility Controls - 🎨 Per-window overlay appearance defaults
          // IMPLEMENTATION DECISION: Conservative defaults for broad compatibility and readability
          defaultVisibilityTheme: "light-on-dark",
          // 'light-on-dark' | 'dark-on-light' - Dark theme default
          defaultTransparencyEnabled: false,
          // Conservative default - solid background for readability
          defaultBackgroundOpacity: 90,
          // 10-100% - High opacity default for good contrast
          overlayPositionMode: "default",
          // 'default' | 'bottom-fixed' - Keep existing position setting
          // Font size configuration - User-customizable text sizes across UI
          // IMPLEMENTATION DECISION: Reasonable defaults with customization for accessibility
          fontSizeSuggestedTags: 10,
          // Suggested tags font size in pixels (smaller for less intrusion)
          fontSizeLabels: 12,
          // Label text (Current, Recent, Suggested) in pixels
          fontSizeTags: 12,
          // Current and recent tag elements in pixels
          fontSizeBase: 14,
          // Base UI text size in pixels
          fontSizeInputs: 14
          // Input fields and buttons font size in pixels
        };
      }
      /**
       * Initialize default settings on first installation
       *
       * IMPL-FEATURE_FLAGS: First-run initialization ensures extension works immediately
       * IMPLEMENTATION DECISION: Only initialize if no settings exist to preserve user customizations
       */
      async initializeDefaults() {
        const existingSettings = await this.getStoredSettings();
        if (!existingSettings || Object.keys(existingSettings).length === 0) {
          await this.saveSettings(this.defaultConfig);
        }
      }
      /**
       * Get complete configuration object
       * @returns {Promise<Object>} Configuration object
       *
       * IMPL-FEATURE_FLAGS: Configuration resolution with default fallback
       * IMPLEMENTATION DECISION: Merge defaults with stored settings to handle partial configurations
       */
      async getConfig() {
        const stored = await this.getStoredSettings();
        if (!stored || typeof stored !== "object" || Array.isArray(stored)) {
          return { ...this.defaultConfig };
        }
        return { ...this.defaultConfig, ...stored };
      }
      /**
       * Get user-configurable options (subset of config for UI)
       * @returns {Promise<Object>} Options object
       *
       * IMPL-FEATURE_FLAGS: UI-specific configuration subset
       * IMPLEMENTATION DECISION: Only expose user-relevant settings to avoid configuration complexity
       */
      async getOptions() {
        const config = await this.getConfig();
        return {
          badgeTextIfBookmarkedNoTags: config.badgeTextIfBookmarkedNoTags,
          badgeTextIfNotBookmarked: config.badgeTextIfNotBookmarked,
          badgeTextIfPrivate: config.badgeTextIfPrivate,
          badgeTextIfQueued: config.badgeTextIfQueued,
          recentPostsCount: config.initRecentPostsCount,
          showHoverOnPageLoad: config.showHoverOnPageLoad,
          hoverShowTooltips: config.hoverShowTooltips,
          // UI-006: Visibility defaults for configuration UI
          defaultVisibilityTheme: config.defaultVisibilityTheme,
          defaultTransparencyEnabled: config.defaultTransparencyEnabled,
          defaultBackgroundOpacity: config.defaultBackgroundOpacity,
          // Popup UI settings
          uxShowSectionLabels: config.uxShowSectionLabels,
          // Font size configuration
          fontSizeSuggestedTags: config.fontSizeSuggestedTags,
          fontSizeLabels: config.fontSizeLabels,
          fontSizeTags: config.fontSizeTags,
          fontSizeBase: config.fontSizeBase,
          fontSizeInputs: config.fontSizeInputs
        };
      }
      /**
       * Update specific configuration values
       * @param {Object} updates - Configuration updates
       *
       * IMPL-FEATURE_FLAGS: Partial configuration updates with persistence
       * IMPLEMENTATION DECISION: Merge updates to preserve unmodified settings
       */
      async updateConfig(updates) {
        const current = await this.getConfig();
        const updated = { ...current, ...updates };
        await this.saveSettings(updated);
      }
      /**
       * Get bookmark storage mode (default backend for new bookmarks when using router).
       * @returns {Promise<string>} 'pinboard', 'local', 'file', or 'sync'
       *
       * [ARCH-LOCAL_STORAGE_PROVIDER] [ARCH-STORAGE_INDEX_AND_ROUTER] Storage mode for provider selection and default for new bookmarks
       * IMPLEMENTATION DECISION: Stored in settings blob; invalid values fall back to 'local'
       */
      async getStorageMode() {
        const config = await this.getConfig();
        const mode = config.storageMode;
        return mode === "local" || mode === "pinboard" || mode === "file" || mode === "sync" ? mode : "local";
      }
      /**
       * Set bookmark storage mode
       * @param {string} mode - 'pinboard', 'local', 'file', or 'sync'
       *
       * [ARCH-LOCAL_STORAGE_PROVIDER] [ARCH-STORAGE_INDEX_AND_ROUTER] Persist storage mode
       */
      async setStorageMode(mode) {
        if (mode !== "pinboard" && mode !== "local" && mode !== "file" && mode !== "sync") {
          throw new Error(`Invalid storage mode: ${mode}. Use 'pinboard', 'local', 'file', or 'sync'.`);
        }
        await this.updateConfig({ storageMode: mode });
      }
      /**
       * Get visibility default settings
       * @returns {Promise<Object>} Visibility defaults object
       *
       * UI-006: Visibility defaults retrieval
       * IMPLEMENTATION DECISION: Dedicated method for overlay visibility configuration
       */
      async getVisibilityDefaults() {
        const config = await this.getConfig();
        return {
          textTheme: config.defaultVisibilityTheme,
          transparencyEnabled: config.defaultTransparencyEnabled,
          backgroundOpacity: config.defaultBackgroundOpacity
        };
      }
      /**
       * Update visibility default settings
       * @param {Object} visibilitySettings - New visibility defaults
       *
       * UI-006: Visibility defaults update
       * IMPLEMENTATION DECISION: Dedicated method for clean visibility settings management
       */
      async updateVisibilityDefaults(visibilitySettings) {
        const updates = {};
        if (visibilitySettings.textTheme !== void 0) {
          updates.defaultVisibilityTheme = visibilitySettings.textTheme;
        }
        if (visibilitySettings.transparencyEnabled !== void 0) {
          updates.defaultTransparencyEnabled = visibilitySettings.transparencyEnabled;
        }
        if (visibilitySettings.backgroundOpacity !== void 0) {
          updates.defaultBackgroundOpacity = visibilitySettings.backgroundOpacity;
        }
        await this.updateConfig(updates);
      }
      /**
       * Get authentication token
       * @returns {Promise<string>} Auth token or empty string
       *
       * IMPL-CONFIG_MIGRATION: Secure authentication token retrieval
       * IMPLEMENTATION DECISION: Return empty string on failure to ensure graceful degradation
       */
      async getAuthToken() {
        try {
          const result = await chrome.storage.sync.get(this.storageKeys.AUTH_TOKEN);
          return result[this.storageKeys.AUTH_TOKEN] || "";
        } catch (error) {
          console.error("Failed to get auth token:", error);
          return "";
        }
      }
      /**
       * Set authentication token
       * @param {string} token - Pinboard API token
       *
       * IMPL-CONFIG_MIGRATION: Secure authentication token storage
       * IMPLEMENTATION DECISION: Use sync storage for cross-device authentication
       */
      async setAuthToken(token) {
        try {
          await chrome.storage.sync.set({
            [this.storageKeys.AUTH_TOKEN]: token
          });
        } catch (error) {
          console.error("Failed to set auth token:", error);
          throw error;
        }
      }
      /**
       * Check if authentication token exists
       * @returns {Promise<boolean>} Whether token exists
       *
       * IMPL-CONFIG_MIGRATION: Authentication state validation
       * IMPLEMENTATION DECISION: Simple boolean check for authentication state
       */
      async hasAuthToken() {
        const token = await this.getAuthToken();
        return token.length > 0;
      }
      /**
       * Get authentication token formatted for API requests
       * @returns {Promise<string>} Token formatted as URL parameter
       *
       * IMPL-CONFIG_MIGRATION: API-ready authentication parameter formatting
       * IMPLEMENTATION DECISION: Pre-format token for consistent API usage
       */
      async getAuthTokenParam() {
        const token = await this.getAuthToken();
        return `auth_token=${token}`;
      }
      /**
       * Get inhibited URLs list
       * @returns {Promise<string[]>} Array of inhibited URLs
       *
       * IMPL-URL_INHIBITION: Site-specific behavior control through URL inhibition
       * IMPLEMENTATION DECISION: Store URLs as newline-separated string for user editing convenience
       */
      async getInhibitUrls() {
        try {
          const result = await chrome.storage.sync.get(this.storageKeys.INHIBIT_URLS);
          const inhibitString = result[this.storageKeys.INHIBIT_URLS] || "";
          return inhibitString.split("\n").filter((url) => url.trim().length > 0);
        } catch (error) {
          console.error("Failed to get inhibit URLs:", error);
          return [];
        }
      }
      /**
       * Add URL to inhibit list
       * @param {string} url - URL to inhibit
       *
       * IMPL-URL_INHIBITION: Dynamic inhibition list management
       * IMPLEMENTATION DECISION: Check for duplicates to maintain clean inhibition list
       */
      async addInhibitUrl(url) {
        try {
          const normalizedUrl = url.replace(/^https?:\/\//, "");
          const current = await this.getInhibitUrls();
          if (!current.includes(normalizedUrl)) {
            current.push(normalizedUrl);
            const inhibitString = current.join("\n");
            await chrome.storage.sync.set({
              [this.storageKeys.INHIBIT_URLS]: inhibitString
            });
          }
          return { inhibit: current.join("\n") };
        } catch (error) {
          console.error("Failed to add inhibit URL:", error);
          throw error;
        }
      }
      /**
       * Set inhibit URLs list (replaces existing list)
       * @param {string[]} urls - Array of URLs to inhibit
       *
       * IMPL-URL_INHIBITION: Complete inhibition list replacement
       * IMPLEMENTATION DECISION: Allow bulk replacement for configuration import/reset scenarios
       */
      async setInhibitUrls(urls) {
        try {
          const inhibitString = urls.join("\n");
          await chrome.storage.sync.set({
            [this.storageKeys.INHIBIT_URLS]: inhibitString
          });
        } catch (error) {
          console.error("Failed to set inhibit URLs:", error);
          throw error;
        }
      }
      /**
       * Check if URL is allowed (not in inhibit list)
       * @param {string} url - URL to check
       * @returns {Promise<boolean>} Whether URL is allowed
       *
       * IMPL-URL_INHIBITION: URL filtering logic for site-specific behavior
       * IMPLEMENTATION DECISION: Bidirectional substring matching for flexible URL patterns
       */
      async isUrlAllowed(url) {
        try {
          const inhibitUrls = await this.getInhibitUrls();
          const normalizedUrl = url.replace(/^https?:\/\//, "");
          return !inhibitUrls.some(
            (inhibitUrl) => normalizedUrl.includes(inhibitUrl) || inhibitUrl.includes(normalizedUrl)
          );
        } catch (error) {
          console.error("Failed to check URL allowance:", error);
          return true;
        }
      }
      /**
       * Get stored settings from storage
       * @returns {Promise<Object>} Stored settings
       *
       * IMPL-FEATURE_FLAGS: Core settings retrieval with error handling
       * IMPLEMENTATION DECISION: Return empty object on failure to allow default merging
       */
      async getStoredSettings() {
        try {
          const result = await chrome.storage.sync.get(this.storageKeys.SETTINGS);
          const stored = result[this.storageKeys.SETTINGS];
          if (typeof stored === "string") {
            try {
              return JSON.parse(stored);
            } catch (parseError) {
              console.error("Failed to parse stored settings:", parseError);
              return {};
            }
          }
          return stored || {};
        } catch (error) {
          console.error("Failed to get stored settings:", error);
          return {};
        }
      }
      /**
       * Save settings to storage
       * @param {Object} settings - Settings to save
       *
       * IMPL-FEATURE_FLAGS: Settings persistence with error propagation
       * IMPLEMENTATION DECISION: Let errors propagate to caller for proper error handling
       */
      async saveSettings(settings) {
        try {
          await chrome.storage.sync.set({
            [this.storageKeys.SETTINGS]: settings
          });
        } catch (error) {
          console.error("Failed to save settings:", error);
          throw error;
        }
      }
      /**
       * Reset all settings to defaults
       *
       * IMPL-FEATURE_FLAGS: Configuration reset functionality
       * IMPLEMENTATION DECISION: Simple replacement with defaults for clean reset
       */
      async resetToDefaults() {
        await this.saveSettings(this.defaultConfig);
      }
      /**
       * Export configuration for backup
       * @returns {Promise<Object>} Complete configuration export
       *
       * IMPL-CONFIG_BACKUP_RESTORE: Configuration backup and portability
       * IMPLEMENTATION DECISION: Include all configuration data with metadata for validation
       */
      async exportConfig() {
        const [settings, token, inhibitUrls] = await Promise.all([
          this.getStoredSettings(),
          this.getAuthToken(),
          this.getInhibitUrls()
        ]);
        return {
          settings,
          authToken: token,
          inhibitUrls,
          exportDate: (/* @__PURE__ */ new Date()).toISOString(),
          version: "1.0.0"
          // Version for import compatibility checking
        };
      }
      /**
       * Import configuration from backup
       * @param {Object} configData - Configuration data to import
       *
       * IMPL-CONFIG_BACKUP_RESTORE: Configuration restoration from backup
       * IMPLEMENTATION DECISION: Selective import allows partial configuration restoration
       */
      async importConfig(configData) {
        if (configData.settings) {
          await this.saveSettings(configData.settings);
        }
        if (configData.authToken) {
          await this.setAuthToken(configData.authToken);
        }
        if (configData.inhibitUrls) {
          const inhibitString = configData.inhibitUrls.join("\n");
          await chrome.storage.sync.set({
            [this.storageKeys.INHIBIT_URLS]: inhibitString
          });
        }
      }
      /**
       * [IMMUTABLE-REQ-TAG-001] - Enhanced tag storage management
       * @param {string[]} tags - Array of tags to store
       * @returns {Promise<void>}
       */
      async updateRecentTags(tags) {
        try {
          if (!Array.isArray(tags)) {
            console.warn("[IMMUTABLE-REQ-TAG-001] Invalid tags array provided");
            return;
          }
          const config = await this.getConfig();
          const maxTags = config.recentTagsCountMax || 50;
          const limitedTags = tags.slice(0, maxTags);
          await chrome.storage.sync.set({
            [this.storageKeys.RECENT_TAGS]: {
              tags: limitedTags,
              timestamp: Date.now(),
              count: limitedTags.length
            }
          });
        } catch (error) {
          console.error("[IMMUTABLE-REQ-TAG-001] Failed to update recent tags:", error);
          try {
            await chrome.storage.local.set({
              [this.storageKeys.RECENT_TAGS]: {
                tags: tags.slice(0, 50),
                timestamp: Date.now(),
                count: Math.min(tags.length, 50)
              }
            });
          } catch (fallbackError) {
            console.error("[IMMUTABLE-REQ-TAG-001] Fallback storage also failed:", fallbackError);
          }
        }
      }
      /**
       * [IMMUTABLE-REQ-TAG-001] - Get recent tags with deduplication
       * @returns {Promise<string[]>} Array of recent tags
       */
      async getRecentTags() {
        try {
          const syncResult = await chrome.storage.sync.get(this.storageKeys.RECENT_TAGS);
          if (syncResult[this.storageKeys.RECENT_TAGS]) {
            return syncResult[this.storageKeys.RECENT_TAGS].tags || [];
          }
          const localResult = await chrome.storage.local.get(this.storageKeys.RECENT_TAGS);
          if (localResult[this.storageKeys.RECENT_TAGS]) {
            return localResult[this.storageKeys.RECENT_TAGS].tags || [];
          }
          return [];
        } catch (error) {
          console.error("[IMMUTABLE-REQ-TAG-001] Failed to get recent tags:", error);
          return [];
        }
      }
      /**
       * [IMMUTABLE-REQ-TAG-001] - Get tag frequency data
       * @returns {Promise<Object>} Tag frequency map
       */
      async getTagFrequency() {
        try {
          const result = await chrome.storage.local.get(this.storageKeys.TAG_FREQUENCY);
          return result[this.storageKeys.TAG_FREQUENCY] || {};
        } catch (error) {
          console.error("[IMMUTABLE-REQ-TAG-001] Failed to get tag frequency:", error);
          return {};
        }
      }
      /**
       * [IMMUTABLE-REQ-TAG-001] - Update tag frequency
       * @param {Object} frequency - Updated frequency map
       * @returns {Promise<void>}
       */
      async updateTagFrequency(frequency) {
        try {
          await chrome.storage.local.set({
            [this.storageKeys.TAG_FREQUENCY]: frequency
          });
        } catch (error) {
          console.error("[IMMUTABLE-REQ-TAG-001] Failed to update tag frequency:", error);
        }
      }
      /**
       * [IMMUTABLE-REQ-TAG-001] - Clean up old tags to manage storage
       * @returns {Promise<void>}
       */
      async cleanupOldTags() {
        try {
          const config = await this.getConfig();
          const maxTags = config.recentTagsCountMax || 50;
          const recentTags = await this.getRecentTags();
          if (recentTags.length > maxTags) {
            const trimmedTags = recentTags.slice(0, maxTags);
            await this.updateRecentTags(trimmedTags);
          }
        } catch (error) {
          console.error("[IMMUTABLE-REQ-TAG-001] Failed to cleanup old tags:", error);
        }
      }
    };
  }
});

// src/features/tagging/tag-service.js
var init_tag_service = __esm({
  "src/features/tagging/tag-service.js"() {
    init_config_manager();
    init_utils();
    debugLog("[SAFARI-EXT-SHIM-001] tag-service.js: module loaded");
  }
});

// src/features/pinboard/pinboard-service.js
var init_pinboard_service = __esm({
  "src/features/pinboard/pinboard-service.js"() {
    init_config_manager();
    init_tag_service();
    init_utils();
    debugLog("[SAFARI-EXT-SHIM-001] pinboard-service.js: module loaded");
  }
});

// src/ui/components/IconManager.js
var IconManager = class {
  constructor() {
    this.iconCache = /* @__PURE__ */ new Map();
    this.preloadedIcons = /* @__PURE__ */ new Set();
    this.iconRegistry = this.getIconRegistry();
    this.currentTheme = "light";
    this.getIcon = this.getIcon.bind(this);
    this.preloadIcons = this.preloadIcons.bind(this);
    this.setTheme = this.setTheme.bind(this);
    this.createIconElement = this.createIconElement.bind(this);
  }
  /**
   * Get icon registry with all available icons
   */
  getIconRegistry() {
    return {
      // Navigation icons
      hoverboard: {
        svg: `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>`,
        fallback: "/icons/hoverboard_16.png"
      },
      pushpin: {
        svg: `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12Z"/>
        </svg>`,
        fallback: "/icons/push-pin_24.png"
      },
      reload: {
        svg: `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z"/>
        </svg>`,
        fallback: "/icons/reload_24.png"
      },
      search: {
        svg: `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z"/>
        </svg>`,
        fallback: "/icons/search_title_24.png"
      },
      // Action icons
      private: {
        svg: `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z"/>
        </svg>`,
        fallback: null
      },
      public: {
        svg: `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10A2,2 0 0,1 6,8H18M6,10V20H18V10H6Z"/>
        </svg>`,
        fallback: null
      },
      "read-later": {
        svg: `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z"/>
        </svg>`,
        fallback: null
      },
      delete: {
        svg: `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
        </svg>`,
        fallback: null
      },
      tag: {
        svg: `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M5.5,7A1.5,1.5 0 0,1 4,5.5A1.5,1.5 0 0,1 5.5,4A1.5,1.5 0 0,1 7,5.5A1.5,1.5 0 0,1 5.5,7M21.41,11.58L12.41,2.58C12.05,2.22 11.55,2 11,2H4C2.9,2 2,2.9 2,4V11C2,11.55 2.22,12.05 2.59,12.42L11.58,21.41C11.95,21.78 12.45,22 13,22C13.55,22 14.05,21.78 14.41,21.41L21.41,14.41C21.78,14.05 22,13.55 22,13C22,12.45 21.78,11.95 21.41,11.58Z"/>
        </svg>`,
        fallback: null
      },
      add: {
        svg: `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
        </svg>`,
        fallback: null
      },
      remove: {
        svg: `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19,13H5V11H19V13Z"/>
        </svg>`,
        fallback: null
      },
      close: {
        svg: `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
        </svg>`,
        fallback: null
      },
      // Status icons
      loading: {
        svg: `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z">
            <animateTransform attributeName="transform" attributeType="XML" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
          </path>
        </svg>`,
        fallback: null
      },
      connected: {
        svg: `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M11,16.5L18,9.5L16.59,8.09L11,13.67L7.91,10.59L6.5,12L11,16.5Z"/>
        </svg>`,
        fallback: null
      },
      disconnected: {
        svg: `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M14.5,9L12,11.5L9.5,9L8,10.5L10.5,13L8,15.5L9.5,17L12,14.5L14.5,17L16,15.5L13.5,13L16,10.5L14.5,9Z"/>
        </svg>`,
        fallback: null
      },
      warning: {
        svg: `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
        </svg>`,
        fallback: null
      },
      info: {
        svg: `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
        </svg>`,
        fallback: null
      },
      // UI controls
      "chevron-down": {
        svg: `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z"/>
        </svg>`,
        fallback: null
      },
      "chevron-up": {
        svg: `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M7.41,15.41L12,10.83L16.59,15.41L18,14L12,8L6,14L7.41,15.41Z"/>
        </svg>`,
        fallback: null
      },
      "chevron-right": {
        svg: `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z"/>
        </svg>`,
        fallback: null
      },
      "chevron-left": {
        svg: `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z"/>
        </svg>`,
        fallback: null
      },
      options: {
        svg: `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"/>
        </svg>`,
        fallback: null
      }
    };
  }
  /**
   * Get icon element by name
   */
  getIcon(iconName, options = {}) {
    const {
      size = 24,
      className = "",
      color = "currentColor",
      ariaLabel = null,
      useFallback = true
    } = options;
    const iconData = this.iconRegistry[iconName];
    if (!iconData) {
      console.warn(`Icon "${iconName}" not found in registry`);
      return this.createFallbackIcon(iconName, options);
    }
    if (iconData.svg) {
      return this.createSVGIcon(iconData.svg, {
        size,
        className,
        color,
        ariaLabel: ariaLabel || iconName,
        iconName
      });
    }
    if (useFallback && iconData.fallback) {
      return this.createImageIcon(iconData.fallback, {
        size,
        className,
        ariaLabel: ariaLabel || iconName,
        iconName
      });
    }
    return this.createFallbackIcon(iconName, options);
  }
  /**
   * Create SVG icon element
   */
  createSVGIcon(svgContent, options) {
    const {
      size,
      className,
      color,
      ariaLabel,
      iconName
    } = options;
    const container = document.createElement("span");
    container.className = `hb-icon hb-icon--${iconName} ${className}`.trim();
    container.style.cssText = `
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: ${size}px;
      height: ${size}px;
      color: ${color};
      flex-shrink: 0;
    `;
    container.innerHTML = svgContent;
    const svg = container.querySelector("svg");
    if (svg) {
      svg.setAttribute("width", size);
      svg.setAttribute("height", size);
      svg.setAttribute("aria-hidden", "true");
      svg.setAttribute("focusable", "false");
    }
    if (ariaLabel) {
      container.setAttribute("aria-label", ariaLabel);
      container.setAttribute("role", "img");
    }
    return container;
  }
  /**
   * Create image icon element
   */
  createImageIcon(imageSrc, options) {
    const {
      size,
      className,
      ariaLabel,
      iconName
    } = options;
    const img = document.createElement("img");
    img.src = chrome.runtime.getURL(imageSrc);
    img.width = size;
    img.height = size;
    img.className = `hb-icon hb-icon--${iconName} ${className}`.trim();
    img.style.cssText = `
      display: block;
      width: ${size}px;
      height: ${size}px;
      flex-shrink: 0;
    `;
    if (ariaLabel) {
      img.alt = ariaLabel;
    } else {
      img.alt = "";
      img.setAttribute("aria-hidden", "true");
    }
    return img;
  }
  /**
   * Create fallback icon when icon is not found
   */
  createFallbackIcon(iconName, options) {
    const {
      size = 24,
      className = "",
      color = "currentColor"
    } = options;
    const container = document.createElement("span");
    container.className = `hb-icon hb-icon--fallback ${className}`.trim();
    container.style.cssText = `
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: ${size}px;
      height: ${size}px;
      background-color: ${color};
      border-radius: 2px;
      opacity: 0.3;
      flex-shrink: 0;
    `;
    container.setAttribute("aria-label", `${iconName} icon`);
    container.setAttribute("title", `Missing icon: ${iconName}`);
    return container;
  }
  /**
   * Create icon element with automatic theme adaptation
   */
  createIconElement(iconName, options = {}) {
    const element = this.getIcon(iconName, options);
    element.classList.add("hb-icon--themed");
    this.updateIconTheme(element);
    return element;
  }
  /**
   * Update icon theme
   */
  updateIconTheme(iconElement) {
    if (!iconElement || !iconElement.classList.contains("hb-icon--themed")) {
      return;
    }
    const isDark = this.currentTheme === "dark";
    iconElement.classList.toggle("hb-icon--dark", isDark);
    iconElement.classList.toggle("hb-icon--light", !isDark);
  }
  /**
   * Set current theme
   */
  setTheme(theme) {
    this.currentTheme = theme;
    const themedIcons = document.querySelectorAll(".hb-icon--themed");
    themedIcons.forEach((icon) => this.updateIconTheme(icon));
  }
  /**
   * Preload commonly used icons
   */
  async preloadIcons(iconNames) {
    const promises = iconNames.map(async (iconName) => {
      if (!this.preloadedIcons.has(iconName)) {
        const iconData = this.iconRegistry[iconName];
        if (iconData?.fallback) {
          return this.preloadImage(iconData.fallback);
        }
      }
    });
    await Promise.allSettled(promises);
    iconNames.forEach((name) => this.preloadedIcons.add(name));
  }
  /**
   * Preload image
   */
  preloadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = resolve;
      img.onerror = reject;
      img.src = chrome.runtime.getURL(src);
    });
  }
  /**
   * Create button with icon
   */
  createIconButton(iconName, options = {}) {
    const {
      text = "",
      className = "",
      size = 20,
      variant = "default",
      disabled = false,
      ariaLabel = null,
      onClick = null
    } = options;
    const button = document.createElement("button");
    button.type = "button";
    button.className = `hb-btn hb-btn--${variant} hb-btn--icon ${className}`.trim();
    button.disabled = disabled;
    if (ariaLabel) {
      button.setAttribute("aria-label", ariaLabel);
    }
    const icon = this.createIconElement(iconName, { size });
    button.appendChild(icon);
    if (text) {
      const textSpan = document.createElement("span");
      textSpan.textContent = text;
      textSpan.className = "hb-btn__text";
      button.appendChild(textSpan);
    }
    if (onClick) {
      button.addEventListener("click", onClick);
    }
    return button;
  }
  /**
   * Get available icon names
   */
  getAvailableIcons() {
    return Object.keys(this.iconRegistry);
  }
  /**
   * Check if icon exists
   */
  hasIcon(iconName) {
    return iconName in this.iconRegistry;
  }
};

// src/ui/components/ThemeManager.js
var ThemeManager = class {
  constructor() {
    this.currentTheme = "auto";
    this.resolvedTheme = "light";
    this.mediaQuery = null;
    this.listeners = /* @__PURE__ */ new Set();
    this.storageKey = "hoverboard_theme";
    this.themes = {
      light: {
        name: "Light",
        variables: {
          "--hb-bg-primary": "#ffffff",
          "--hb-bg-secondary": "#f8f9fa",
          "--hb-bg-tertiary": "#f1f3f4",
          "--hb-bg-overlay": "rgba(255, 255, 255, 0.95)",
          "--hb-bg-hover": "rgba(0, 0, 0, 0.04)",
          "--hb-bg-active": "rgba(0, 0, 0, 0.08)",
          "--hb-text-primary": "#202124",
          "--hb-text-secondary": "#5f6368",
          "--hb-text-tertiary": "#80868b",
          "--hb-text-disabled": "#bdc1c6",
          "--hb-text-inverse": "#ffffff",
          "--hb-border-primary": "#dadce0",
          "--hb-border-secondary": "#e8eaed",
          "--hb-border-focus": "#1a73e8",
          "--hb-border-error": "#d93025",
          "--hb-border-success": "#137333",
          "--hb-border-warning": "#f29900",
          "--hb-accent-primary": "#1a73e8",
          "--hb-accent-primary-hover": "#1557b0",
          "--hb-accent-primary-active": "#0d47a1",
          "--hb-accent-secondary": "#ea4335",
          "--hb-accent-success": "#137333",
          "--hb-accent-warning": "#f29900",
          "--hb-accent-error": "#d93025",
          "--hb-shadow-1": "0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)",
          "--hb-shadow-2": "0 1px 2px 0 rgba(60,64,67,.3), 0 2px 6px 2px rgba(60,64,67,.15)",
          "--hb-shadow-3": "0 4px 8px 3px rgba(60,64,67,.15), 0 1px 3px rgba(60,64,67,.3)",
          "--hb-shadow-4": "0 6px 10px 4px rgba(60,64,67,.15), 0 2px 3px rgba(60,64,67,.3)"
        }
      },
      dark: {
        name: "Dark",
        variables: {
          "--hb-bg-primary": "#202124",
          "--hb-bg-secondary": "#292a2d",
          "--hb-bg-tertiary": "#35363a",
          "--hb-bg-overlay": "rgba(32, 33, 36, 0.95)",
          "--hb-bg-hover": "rgba(255, 255, 255, 0.04)",
          "--hb-bg-active": "rgba(255, 255, 255, 0.08)",
          "--hb-text-primary": "#e8eaed",
          "--hb-text-secondary": "#9aa0a6",
          "--hb-text-tertiary": "#80868b",
          "--hb-text-disabled": "#5f6368",
          "--hb-text-inverse": "#202124",
          "--hb-border-primary": "#5f6368",
          "--hb-border-secondary": "#3c4043",
          "--hb-border-focus": "#8ab4f8",
          "--hb-border-error": "#f28b82",
          "--hb-border-success": "#81c995",
          "--hb-border-warning": "#fdd663",
          "--hb-accent-primary": "#8ab4f8",
          "--hb-accent-primary-hover": "#aecbfa",
          "--hb-accent-primary-active": "#c8e6c9",
          "--hb-accent-secondary": "#f28b82",
          "--hb-accent-success": "#81c995",
          "--hb-accent-warning": "#fdd663",
          "--hb-accent-error": "#f28b82",
          "--hb-shadow-1": "0 1px 2px 0 rgba(0,0,0,.3), 0 1px 3px 1px rgba(0,0,0,.15)",
          "--hb-shadow-2": "0 1px 2px 0 rgba(0,0,0,.3), 0 2px 6px 2px rgba(0,0,0,.15)",
          "--hb-shadow-3": "0 4px 8px 3px rgba(0,0,0,.15), 0 1px 3px rgba(0,0,0,.3)",
          "--hb-shadow-4": "0 6px 10px 4px rgba(0,0,0,.15), 0 2px 3px rgba(0,0,0,.3)"
        }
      }
    };
    this.init = this.init.bind(this);
    this.setTheme = this.setTheme.bind(this);
    this.getTheme = this.getTheme.bind(this);
    this.getResolvedTheme = this.getResolvedTheme.bind(this);
    this.handleSystemThemeChange = this.handleSystemThemeChange.bind(this);
    this.applyTheme = this.applyTheme.bind(this);
    this.addListener = this.addListener.bind(this);
    this.removeListener = this.removeListener.bind(this);
  }
  /**
   * Initialize theme manager
   */
  async init() {
    try {
      await this.loadThemePreference();
      this.setupSystemThemeDetection();
      this.resolveAndApplyTheme();
      console.log("ThemeManager initialized with theme:", this.resolvedTheme);
    } catch (error) {
      console.error("Failed to initialize ThemeManager:", error);
      this.resolvedTheme = "light";
      this.applyTheme("light");
    }
  }
  /**
   * Load theme preference from storage
   */
  async loadThemePreference() {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.storageKey], (result) => {
        if (chrome.runtime.lastError) {
          console.warn("Failed to load theme preference:", chrome.runtime.lastError);
          resolve();
          return;
        }
        const savedTheme = result[this.storageKey];
        if (savedTheme && ["light", "dark", "auto"].includes(savedTheme)) {
          this.currentTheme = savedTheme;
        }
        resolve();
      });
    });
  }
  /**
   * Save theme preference to storage
   */
  async saveThemePreference() {
    return new Promise((resolve) => {
      chrome.storage.local.set({
        [this.storageKey]: this.currentTheme
      }, () => {
        if (chrome.runtime.lastError) {
          console.warn("Failed to save theme preference:", chrome.runtime.lastError);
        }
        resolve();
      });
    });
  }
  /**
   * Setup system theme detection
   */
  setupSystemThemeDetection() {
    if (window.matchMedia) {
      this.mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      this.mediaQuery.addEventListener("change", this.handleSystemThemeChange);
    }
  }
  /**
   * Handle system theme change
   */
  handleSystemThemeChange(e) {
    if (this.currentTheme === "auto") {
      const newResolvedTheme = e.matches ? "dark" : "light";
      if (newResolvedTheme !== this.resolvedTheme) {
        this.resolvedTheme = newResolvedTheme;
        this.applyTheme(this.resolvedTheme);
        this.notifyListeners();
      }
    }
  }
  /**
   * Resolve theme based on current preference and system settings
   */
  resolveTheme() {
    if (this.currentTheme === "auto") {
      if (this.mediaQuery && this.mediaQuery.matches) {
        return "dark";
      }
      return "light";
    }
    return this.currentTheme;
  }
  /**
   * Resolve and apply theme
   */
  resolveAndApplyTheme() {
    const newResolvedTheme = this.resolveTheme();
    if (newResolvedTheme !== this.resolvedTheme) {
      this.resolvedTheme = newResolvedTheme;
      this.notifyListeners();
    }
    this.applyTheme(this.resolvedTheme);
  }
  /**
   * Set theme preference
   */
  async setTheme(theme) {
    if (!["light", "dark", "auto"].includes(theme)) {
      throw new Error(`Invalid theme: ${theme}`);
    }
    this.currentTheme = theme;
    await this.saveThemePreference();
    this.resolveAndApplyTheme();
  }
  /**
   * Get current theme preference
   */
  getTheme() {
    return this.currentTheme;
  }
  /**
   * Get resolved theme (actual theme being used)
   */
  getResolvedTheme() {
    return this.resolvedTheme;
  }
  /**
   * Apply theme to document
   */
  applyTheme(themeName) {
    const theme = this.themes[themeName];
    if (!theme) {
      console.warn(`Theme "${themeName}" not found`);
      return;
    }
    const root = document.documentElement;
    Object.entries(theme.variables).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
    document.documentElement.className = document.documentElement.className.replace(/hb-theme-\w+/g, "").trim();
    document.documentElement.classList.add(`hb-theme-${themeName}`);
    this.updateMetaThemeColor(theme.variables["--hb-bg-primary"]);
  }
  /**
   * Update meta theme color for mobile browsers
   */
  updateMetaThemeColor(color) {
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement("meta");
      metaThemeColor.name = "theme-color";
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.content = color;
  }
  /**
   * Get theme variable value
   */
  getThemeVariable(variableName) {
    return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
  }
  /**
   * Set custom theme variable
   */
  setThemeVariable(variableName, value) {
    document.documentElement.style.setProperty(variableName, value);
  }
  /**
   * Create theme-aware CSS
   */
  createThemeAwareCSS(lightCSS, darkCSS) {
    return `
      .hb-theme-light { ${lightCSS} }
      .hb-theme-dark { ${darkCSS} }
    `;
  }
  /**
   * Add theme change listener
   */
  addListener(callback) {
    if (typeof callback === "function") {
      this.listeners.add(callback);
    }
  }
  /**
   * Remove theme change listener
   */
  removeListener(callback) {
    this.listeners.delete(callback);
  }
  /**
   * Notify all listeners of theme change
   */
  notifyListeners() {
    this.listeners.forEach((callback) => {
      try {
        callback({
          theme: this.currentTheme,
          resolvedTheme: this.resolvedTheme
        });
      } catch (error) {
        console.error("Error in theme listener:", error);
      }
    });
  }
  /**
   * Get available themes
   */
  getAvailableThemes() {
    return [
      { value: "light", label: "Light" },
      { value: "dark", label: "Dark" },
      { value: "auto", label: "System" }
    ];
  }
  /**
   * Check if system supports dark mode detection
   */
  supportsSystemTheme() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)");
  }
  /**
   * Get system theme preference
   */
  getSystemTheme() {
    if (this.mediaQuery && this.mediaQuery.matches) {
      return "dark";
    }
    return "light";
  }
  /**
   * Create theme switcher element
   */
  createThemeSwitcher(options = {}) {
    const {
      className = "",
      showLabels = true,
      compact = false
    } = options;
    const container = document.createElement("div");
    container.className = `hb-theme-switcher ${className}`.trim();
    if (compact) {
      container.classList.add("hb-theme-switcher--compact");
    }
    const themes = this.getAvailableThemes();
    themes.forEach((theme) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "hb-theme-switcher__option";
      button.setAttribute("data-theme", theme.value);
      button.setAttribute("aria-label", `Switch to ${theme.label} theme`);
      if (showLabels) {
        button.textContent = theme.label;
      }
      if (theme.value === this.currentTheme) {
        button.classList.add("hb-theme-switcher__option--active");
        button.setAttribute("aria-pressed", "true");
      } else {
        button.setAttribute("aria-pressed", "false");
      }
      button.addEventListener("click", () => {
        this.setTheme(theme.value);
        this.updateThemeSwitcher(container);
      });
      container.appendChild(button);
    });
    return container;
  }
  /**
   * Update theme switcher active state
   */
  updateThemeSwitcher(switcher) {
    const buttons = switcher.querySelectorAll(".hb-theme-switcher__option");
    buttons.forEach((button) => {
      const isActive = button.getAttribute("data-theme") === this.currentTheme;
      button.classList.toggle("hb-theme-switcher__option--active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  }
  /**
   * Detect user's preferred theme from various sources
   */
  detectPreferredTheme() {
    if (this.currentTheme !== "auto") {
      return this.currentTheme;
    }
    if (this.supportsSystemTheme()) {
      return this.getSystemTheme();
    }
    return "light";
  }
  /**
   * Apply theme-specific styles to element
   */
  applyThemeStyles(element, styles) {
    if (!element || typeof styles !== "object") {
      return;
    }
    const themeStyles = styles[this.resolvedTheme] || styles.light || {};
    Object.entries(themeStyles).forEach(([property, value]) => {
      element.style.setProperty(property, value);
    });
  }
  /**
   * Cleanup theme manager
   */
  cleanup() {
    if (this.mediaQuery) {
      this.mediaQuery.removeEventListener("change", this.handleSystemThemeChange);
    }
    this.listeners.clear();
  }
};

// src/ui/components/VisualAssetsManager.js
var VisualAssetsManager = class {
  constructor() {
    this.assetCache = /* @__PURE__ */ new Map();
    this.preloadedAssets = /* @__PURE__ */ new Set();
    this.loadingPromises = /* @__PURE__ */ new Map();
    this.retryAttempts = /* @__PURE__ */ new Map();
    this.maxRetries = 3;
    this.retryDelay = 1e3;
    this.assetRegistry = {
      // Extension icons
      extension: {
        16: "/icons/hoverboard_16.png",
        19: "/icons/hoverboard_19.png",
        32: "/icons/hoverboard_32.png",
        48: "/icons/hoverboard_48.png",
        64: "/icons/hoverboard_64.png",
        128: "/icons/hoverboard_128.png",
        256: "/icons/hoverboard_256.png",
        512: "/icons/hoverboard_512.png",
        svg: "/icons/hoverboard.svg"
      },
      // Action icons
      pushpin: {
        24: "/icons/push-pin_24.png",
        svg: "/icons/push-pin.svg"
      },
      reload: {
        24: "/icons/reload_24.png",
        80: "/icons/reload_80.svg",
        svg: "/icons/reload.svg"
      },
      search: {
        24: "/icons/search_title_24.png",
        svg: "/icons/search_title01.svg"
      },
      // Pin states
      bluepin: {
        16: "/icons/bluepin_16.png",
        gif: "/icons/bluepin_16.gif"
      }
    };
    this.getAsset = this.getAsset.bind(this);
    this.preloadAssets = this.preloadAssets.bind(this);
    this.createResponsiveImage = this.createResponsiveImage.bind(this);
    this.optimizeForDisplay = this.optimizeForDisplay.bind(this);
  }
  /**
   * Get asset URL for given name and size
   */
  getAssetUrl(assetName, size = "default", format = "auto") {
    const asset = this.assetRegistry[assetName];
    if (!asset) {
      console.warn(`Asset "${assetName}" not found in registry`);
      return null;
    }
    if (format === "auto") {
      format = this.selectOptimalFormat(asset, size);
    }
    const url = asset[size] || asset[format] || asset.svg || Object.values(asset)[0];
    if (url) {
      return chrome.runtime.getURL(url);
    }
    return null;
  }
  /**
   * Select optimal format based on context
   */
  selectOptimalFormat(asset, preferredSize) {
    if (asset.svg && this.supportsSVG()) {
      return "svg";
    }
    if (asset[preferredSize]) {
      return preferredSize;
    }
    const sizes = Object.keys(asset).filter((key) => !isNaN(key)).map((key) => parseInt(key)).sort((a, b) => a - b);
    if (sizes.length > 0) {
      const targetSize = parseInt(preferredSize) || 24;
      const closestSize = sizes.reduce(
        (prev, curr) => Math.abs(curr - targetSize) < Math.abs(prev - targetSize) ? curr : prev
      );
      return closestSize.toString();
    }
    return Object.keys(asset)[0];
  }
  /**
   * Check if browser supports SVG
   */
  supportsSVG() {
    return document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#Image", "1.1");
  }
  /**
   * Get asset with caching and error handling
   */
  async getAsset(assetName, options = {}) {
    const {
      size = "24",
      format = "auto",
      forceReload = false
    } = options;
    const cacheKey = `${assetName}-${size}-${format}`;
    if (!forceReload && this.assetCache.has(cacheKey)) {
      return this.assetCache.get(cacheKey);
    }
    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey);
    }
    const loadingPromise = this.loadAsset(assetName, size, format);
    this.loadingPromises.set(cacheKey, loadingPromise);
    try {
      const asset = await loadingPromise;
      this.assetCache.set(cacheKey, asset);
      this.preloadedAssets.add(cacheKey);
      return asset;
    } catch (error) {
      console.error(`Failed to load asset: ${assetName}`, error);
      throw error;
    } finally {
      this.loadingPromises.delete(cacheKey);
    }
  }
  /**
   * Load asset with retry logic
   */
  async loadAsset(assetName, size, format) {
    const url = this.getAssetUrl(assetName, size, format);
    if (!url) {
      throw new Error(`No URL found for asset: ${assetName}`);
    }
    const cacheKey = `${assetName}-${size}-${format}`;
    let attempts = 0;
    while (attempts < this.maxRetries) {
      try {
        const asset = await this.fetchAsset(url);
        this.retryAttempts.delete(cacheKey);
        return asset;
      } catch (error) {
        attempts++;
        this.retryAttempts.set(cacheKey, attempts);
        if (attempts >= this.maxRetries) {
          throw new Error(`Failed to load asset after ${this.maxRetries} attempts: ${url}`);
        }
        await this.delay(this.retryDelay * attempts);
      }
    }
  }
  /**
   * Fetch asset from URL
   */
  async fetchAsset(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          url,
          element: img,
          width: img.naturalWidth,
          height: img.naturalHeight,
          type: "image"
        });
      };
      img.onerror = () => {
        reject(new Error(`Failed to load image: ${url}`));
      };
      img.src = url;
    });
  }
  /**
   * Create responsive image element
   */
  createResponsiveImage(assetName, options = {}) {
    const {
      sizes = ["16", "24", "32", "48"],
      defaultSize = "24",
      className = "",
      alt = "",
      lazy = true
    } = options;
    const img = document.createElement("img");
    img.className = `hb-responsive-img ${className}`.trim();
    img.alt = alt;
    if (lazy) {
      img.loading = "lazy";
    }
    const defaultUrl = this.getAssetUrl(assetName, defaultSize);
    if (defaultUrl) {
      img.src = defaultUrl;
    }
    const asset = this.assetRegistry[assetName];
    if (asset) {
      const srcsetParts = [];
      sizes.forEach((size) => {
        const url = this.getAssetUrl(assetName, size);
        if (url) {
          srcsetParts.push(`${url} ${size}w`);
        }
      });
      if (srcsetParts.length > 0) {
        img.srcset = srcsetParts.join(", ");
        img.sizes = "(max-width: 24px) 16px, (max-width: 32px) 24px, (max-width: 48px) 32px, 48px";
      }
    }
    return img;
  }
  /**
   * Create optimized image for specific context
   */
  createOptimizedImage(assetName, context, options = {}) {
    const contextConfigs = {
      icon: { size: "24", className: "hb-icon-img" },
      logo: { size: "48", className: "hb-logo-img" },
      avatar: { size: "32", className: "hb-avatar-img" },
      badge: { size: "16", className: "hb-badge-img" },
      header: { size: "128", className: "hb-header-img" }
    };
    const config = contextConfigs[context] || contextConfigs.icon;
    const mergedOptions = { ...config, ...options };
    return this.createResponsiveImage(assetName, mergedOptions);
  }
  /**
   * Preload multiple assets
   */
  async preloadAssets(assetList, options = {}) {
    const {
      priority = "low",
      sizes = ["24"],
      formats = ["auto"]
    } = options;
    const preloadPromises = [];
    assetList.forEach((assetName) => {
      sizes.forEach((size) => {
        formats.forEach((format) => {
          const promise = this.getAsset(assetName, { size, format }).catch((error) => {
            console.warn(`Failed to preload asset: ${assetName}`, error);
            return null;
          });
          preloadPromises.push(promise);
        });
      });
    });
    const results = await Promise.allSettled(preloadPromises);
    const successful = results.filter((result) => result.status === "fulfilled").length;
    const failed = results.length - successful;
    console.log(`Asset preloading completed: ${successful} successful, ${failed} failed`);
    return { successful, failed, total: results.length };
  }
  /**
   * Preload critical assets for immediate use
   */
  async preloadCriticalAssets() {
    const criticalAssets = [
      "extension",
      "pushpin",
      "reload",
      "search"
    ];
    return this.preloadAssets(criticalAssets, {
      sizes: ["16", "24"],
      priority: "high"
    });
  }
  /**
   * Create CSS background image rule
   */
  createBackgroundImageCSS(assetName, size = "24") {
    const url = this.getAssetUrl(assetName, size);
    if (!url) {
      return "";
    }
    return `background-image: url('${url}');`;
  }
  /**
   * Optimize asset for display context
   */
  optimizeForDisplay(assetElement, context) {
    if (!assetElement) return;
    const optimizations = {
      "high-dpi": () => {
        if (window.devicePixelRatio > 1) {
          const currentSrc = assetElement.src;
          const scaledSrc = currentSrc.replace(/(\d+)(\.png|\.jpg)/, (match, size, ext) => {
            const newSize = parseInt(size) * window.devicePixelRatio;
            return `${newSize}${ext}`;
          });
          if (scaledSrc !== currentSrc) {
            assetElement.src = scaledSrc;
          }
        }
      },
      print: () => {
        assetElement.style.colorAdjust = "exact";
        assetElement.style.webkitColorAdjust = "exact";
      },
      accessibility: () => {
        if (!assetElement.alt) {
          assetElement.alt = "Hoverboard icon";
        }
        assetElement.setAttribute("role", "img");
      }
    };
    if (optimizations[context]) {
      optimizations[context]();
    }
  }
  /**
   * Get asset dimensions
   */
  async getAssetDimensions(assetName, size = "24") {
    try {
      const asset = await this.getAsset(assetName, { size });
      return {
        width: asset.width,
        height: asset.height
      };
    } catch (error) {
      console.warn(`Failed to get dimensions for asset: ${assetName}`, error);
      return { width: 24, height: 24 };
    }
  }
  /**
   * Check if asset exists
   */
  hasAsset(assetName, size = null) {
    const asset = this.assetRegistry[assetName];
    if (!asset) return false;
    if (size === null) return true;
    return size in asset;
  }
  /**
   * Get available sizes for asset
   */
  getAvailableSizes(assetName) {
    const asset = this.assetRegistry[assetName];
    if (!asset) return [];
    return Object.keys(asset).filter((key) => !isNaN(key) || key === "svg");
  }
  /**
   * Clear asset cache
   */
  clearCache() {
    this.assetCache.clear();
    this.preloadedAssets.clear();
    this.loadingPromises.clear();
    this.retryAttempts.clear();
  }
  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      cached: this.assetCache.size,
      preloaded: this.preloadedAssets.size,
      loading: this.loadingPromises.size,
      retrying: this.retryAttempts.size
    };
  }
  /**
   * Create favicon link element
   */
  createFavicon(size = "32") {
    const link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/png";
    link.href = this.getAssetUrl("extension", size);
    link.sizes = `${size}x${size}`;
    return link;
  }
  /**
   * Create Apple touch icon
   */
  createAppleTouchIcon(size = "180") {
    const link = document.createElement("link");
    link.rel = "apple-touch-icon";
    link.href = this.getAssetUrl("extension", size);
    link.sizes = `${size}x${size}`;
    return link;
  }
  /**
   * Generate asset manifest for PWA
   */
  generateAssetManifest() {
    const manifest = {
      icons: []
    };
    const extensionAsset = this.assetRegistry.extension;
    if (extensionAsset) {
      Object.entries(extensionAsset).forEach(([size, path]) => {
        if (!isNaN(size)) {
          manifest.icons.push({
            src: chrome.runtime.getURL(path),
            sizes: `${size}x${size}`,
            type: "image/png"
          });
        }
      });
    }
    return manifest;
  }
  /**
   * Utility: delay function
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  /**
   * Cleanup resources
   */
  cleanup() {
    this.clearCache();
    this.loadingPromises.forEach((promise, key) => {
      this.loadingPromises.delete(key);
    });
  }
};

// src/ui/popup/UIManager.js
var UIManager = class {
  constructor({ errorHandler, stateManager, config = {} }) {
    this.errorHandler = errorHandler;
    this.stateManager = stateManager;
    this.config = config;
    this.eventHandlers = /* @__PURE__ */ new Map();
    this.elements = {};
    this.cacheElements();
    this.applyConfiguration();
    this.emit = this.emit.bind(this);
    this.on = this.on.bind(this);
    this.off = this.off.bind(this);
  }
  /**
   * Apply configuration-based UI settings
   */
  applyConfiguration() {
    if (this.config.uxShowSectionLabels !== void 0) {
      this.updateSectionLabelsVisibility(this.config.uxShowSectionLabels);
    }
    this.applyFontSizeConfig();
  }
  /**
   * Apply font size configuration using CSS variables
   */
  applyFontSizeConfig() {
    const root = document.documentElement;
    const fontSizes = {
      suggestedTags: this.config.fontSizeSuggestedTags || 10,
      labels: this.config.fontSizeLabels || 12,
      tags: this.config.fontSizeTags || 12,
      base: this.config.fontSizeBase || 14,
      inputs: this.config.fontSizeInputs || 14
    };
    root.style.setProperty("--font-size-suggested-tags", `${fontSizes.suggestedTags}px`);
    root.style.setProperty("--font-size-labels", `${fontSizes.labels}px`);
    root.style.setProperty("--font-size-tags", `${fontSizes.tags}px`);
    root.style.setProperty("--font-size-base-custom", `${fontSizes.base}px`);
    root.style.setProperty("--font-size-inputs-custom", `${fontSizes.inputs}px`);
  }
  /**
   * Update section labels visibility based on configuration
   */
  updateSectionLabelsVisibility(showLabels) {
    const sectionTitles = document.querySelectorAll(".section-title");
    sectionTitles.forEach((title) => {
      if (showLabels) {
        title.style.display = "";
      } else {
        title.style.display = "none";
      }
    });
  }
  /**
   * Cache frequently used DOM elements
   */
  cacheElements() {
    this.elements = {
      // Container elements
      mainInterface: document.getElementById("mainInterface"),
      loadingState: document.getElementById("loadingState"),
      errorState: document.getElementById("errorState"),
      errorMessage: document.getElementById("errorMessage"),
      retryBtn: document.getElementById("retryBtn"),
      // Status elements
      bookmarkStatus: document.getElementById("bookmarkStatus"),
      versionInfo: document.getElementById("versionInfo"),
      // Action buttons
      showHoverBtn: document.getElementById("showHoverBtn"),
      togglePrivateBtn: document.getElementById("togglePrivateBtn"),
      toggleReadBtn: document.getElementById("toggleReadBtn"),
      deleteBtn: document.getElementById("deleteBtn"),
      reloadBtn: document.getElementById("reloadBtn"),
      optionsBtn: document.getElementById("optionsBtn"),
      bookmarksIndexBtn: document.getElementById("bookmarksIndexBtn"),
      browserBookmarkImportBtn: document.getElementById("browserBookmarkImportBtn"),
      settingsBtn: document.getElementById("settingsBtn"),
      // Input elements
      newTagInput: document.getElementById("newTagInput"),
      addTagBtn: document.getElementById("addTagBtn"),
      searchInput: document.getElementById("searchInput"),
      searchBtn: document.getElementById("searchBtn"),
      // Search elements
      searchInput: document.getElementById("searchInput"),
      searchBtn: document.getElementById("searchBtn"),
      searchSuggestions: document.getElementById("searchSuggestions"),
      // Tag display
      currentTagsContainer: document.getElementById("currentTagsContainer"),
      recentTagsContainer: document.getElementById("recentTagsContainer"),
      suggestedTagsContainer: document.getElementById("suggestedTagsContainer"),
      // Status displays
      privateIcon: document.getElementById("privateIcon"),
      privateStatus: document.getElementById("privateStatus"),
      readIcon: document.getElementById("readIcon"),
      readStatus: document.getElementById("readStatus"),
      // [SHOW-HOVER-CHECKBOX-UIMANAGER-001] - Add checkbox element reference
      showHoverOnPageLoad: document.getElementById("showHoverOnPageLoad"),
      // [REQ-MOVE_BOOKMARK_STORAGE_UI] [IMPL-MOVE_BOOKMARK_UI] Storage backend select-one buttons (pinboard | file | local | sync)
      storageBackendButtons: document.getElementById("storageBackendButtons")
    };
  }
  /**
   * Setup all event listeners
   */
  setupEventListeners() {
    this.elements.showHoverBtn?.addEventListener("click", () => {
      this.emit("showHoverboard");
    });
    this.elements.togglePrivateBtn?.addEventListener("click", () => {
      this.emit("togglePrivate");
    });
    this.elements.toggleReadBtn?.addEventListener("click", () => {
      this.emit("readLater");
    });
    this.elements.deleteBtn?.addEventListener("click", () => {
      this.emit("deletePin");
    });
    this.elements.reloadBtn?.addEventListener("click", () => {
      this.emit("refreshData");
      this.emit("reloadExtension");
    });
    this.elements.optionsBtn?.addEventListener("click", () => {
      this.emit("openOptions");
    });
    this.elements.bookmarksIndexBtn?.addEventListener("click", () => {
      this.emit("openBookmarksIndex");
    });
    this.elements.browserBookmarkImportBtn?.addEventListener("click", () => {
      this.emit("openBrowserBookmarkImport");
    });
    const storageBtns = this.elements.storageBackendButtons?.querySelectorAll(".storage-backend-btn");
    storageBtns?.forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = btn.getAttribute("data-backend");
        if (target) this.emit("storageBackendChange", target);
      });
    });
    this.elements.settingsBtn?.addEventListener("click", () => {
      this.emit("openOptions");
    });
    this.elements.addTagBtn?.addEventListener("click", () => {
      const tagText = this.elements.newTagInput?.value;
      if (tagText && this.isValidTag(tagText)) {
        this.emit("addTag", tagText);
        this.elements.newTagInput.value = "";
      } else if (tagText && !this.isValidTag(tagText)) {
        this.showError("Invalid tag format");
      }
    });
    this.elements.newTagInput?.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        const tagText = this.elements.newTagInput?.value;
        if (tagText && this.isValidTag(tagText)) {
          this.emit("addTag", tagText);
          this.elements.newTagInput.value = "";
        } else if (tagText && !this.isValidTag(tagText)) {
          this.showError("Invalid tag format");
        }
      }
    });
    this.elements.newTagInput?.addEventListener("blur", () => {
      const tagText = this.elements.newTagInput?.value;
      if (tagText && !this.isValidTag(tagText)) {
        this.showError("Invalid tag format");
      }
    });
    this.elements.newTagInput?.addEventListener("input", () => {
      const tagText = this.elements.newTagInput?.value;
      if (tagText && !this.isValidTag(tagText)) {
        this.elements.newTagInput.classList.add("invalid");
      } else {
        this.elements.newTagInput.classList.remove("invalid");
      }
    });
    this.elements.searchBtn?.addEventListener("click", () => {
      const searchText = this.elements.searchInput?.value;
      if (searchText) {
        this.emit("search", searchText);
      }
    });
    this.elements.searchInput?.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        const searchText = this.elements.searchInput?.value;
        if (searchText) {
          this.emit("search", searchText);
        }
      }
    });
    this.elements.retryBtn?.addEventListener("click", () => {
      this.emit("retry");
    });
    this.elements.showHoverOnPageLoad?.addEventListener("change", () => {
      this.emit("showHoverOnPageLoadChange");
    });
  }
  /**
   * Event emitter - emit custom events
   */
  emit(eventName, ...args) {
    const handlers = this.eventHandlers.get(eventName);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(...args);
        } catch (error) {
          this.errorHandler.handleError(`Error in event handler for ${eventName}`, error);
        }
      });
    }
  }
  /**
   * Event emitter - add event listener
   */
  on(eventName, handler) {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, []);
    }
    this.eventHandlers.get(eventName).push(handler);
  }
  /**
   * Event emitter - remove event listener
   */
  off(eventName, handler) {
    const handlers = this.eventHandlers.get(eventName);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }
  /**
   * Set loading state
   */
  setLoading(isLoading) {
    if (this.elements.loadingState) {
      this.elements.loadingState.classList.toggle("hidden", !isLoading);
    }
    if (this.elements.mainInterface) {
      this.elements.mainInterface.classList.toggle("hidden", isLoading);
    }
    const interactiveElements = [
      this.elements.showHoverBtn,
      this.elements.togglePrivateBtn,
      this.elements.toggleReadBtn,
      this.elements.deleteBtn,
      this.elements.addTagBtn,
      this.elements.newTagInput,
      this.elements.searchBtn,
      this.elements.searchInput
    ];
    interactiveElements.forEach((element) => {
      if (element) {
        element.disabled = isLoading;
      }
    });
  }
  /**
   * Update connection status indicator
   */
  updateConnectionStatus(isConnected) {
    if (this.elements.statusIndicator) {
      this.elements.statusIndicator.className = `status-indicator ${isConnected ? "online" : "offline"}`;
      this.elements.statusIndicator.title = isConnected ? "Connected to Pinboard" : "Disconnected from Pinboard";
    }
  }
  /**
   * Update private status button
   */
  updatePrivateStatus(isPrivate) {
    if (this.elements.togglePrivateBtn) {
      this.elements.togglePrivateBtn.classList.toggle("active", isPrivate);
      if (this.elements.privateIcon && this.elements.privateStatus) {
        if (isPrivate) {
          this.elements.privateIcon.textContent = "\u{1F512}";
          this.elements.privateStatus.textContent = "Private";
        } else {
          this.elements.privateIcon.textContent = "\u{1F513}";
          this.elements.privateStatus.textContent = "Public";
        }
      }
    }
  }
  /**
   * Update read later status display
   */
  updateReadLaterStatus(isReadLater) {
    if (this.elements.toggleReadBtn) {
      this.elements.toggleReadBtn.classList.toggle("active", isReadLater);
      if (this.elements.readIcon && this.elements.readStatus) {
        if (isReadLater) {
          this.elements.readIcon.textContent = "\u{1F4D6}";
          this.elements.readStatus.textContent = "Read Later";
        } else {
          this.elements.readIcon.textContent = "\u{1F4CB}";
          this.elements.readStatus.textContent = "Not marked";
        }
      }
    }
  }
  /**
   * [REQ-MOVE_BOOKMARK_STORAGE_UI] [IMPL-MOVE_BOOKMARK_UI] Update storage backend buttons: set aria-pressed on the selected backend (pinboard | local | file | sync).
   * [REQ-STORAGE_MODE_DEFAULT] If backend is falsy, use 'local' so one option is always selected.
   */
  updateStorageBackendValue(backend) {
    if (!backend) backend = "local";
    const container = this.elements.storageBackendButtons;
    if (!container) return;
    const buttons = container.querySelectorAll(".storage-backend-btn");
    buttons.forEach((btn) => {
      const isSelected = btn.getAttribute("data-backend") === backend;
      btn.setAttribute("aria-pressed", isSelected ? "true" : "false");
    });
  }
  /**
   * [REQ-MOVE_BOOKMARK_STORAGE_UI] No-op: move is done via storage backend buttons. Kept for API compatibility.
   * @param {string} _backend - 'pinboard'|'local'|'file'|'sync'
   * @param {boolean} _hasBookmark - whether current URL has a saved bookmark
   */
  updateStorageLocalToggle(_backend, _hasBookmark) {
  }
  /**
   * [REQ-MOVE_BOOKMARK_STORAGE_UI] Enable or disable Pinboard storage button based on API key configuration.
   * When disabled, button cannot be selected; title hints user to configure token in Options.
   * @param {boolean} hasApiKey - whether a Pinboard API token is configured
   */
  updateStoragePinboardEnabled(hasApiKey) {
    const container = this.elements.storageBackendButtons;
    if (!container) return;
    const btn = container.querySelector('.storage-backend-btn[data-backend="pinboard"]');
    if (!btn) return;
    btn.disabled = !hasApiKey;
    btn.title = hasApiKey ? "Pinboard (cloud)" : "Configure API token in Options to use Pinboard";
    btn.setAttribute("aria-label", hasApiKey ? "Pinboard (cloud)" : "Pinboard (cloud). Configure API token in Options to use.");
  }
  /**
   * Update version info
   */
  updateVersionInfo(version) {
    if (this.elements.versionInfo) {
      this.elements.versionInfo.textContent = `v${version}`;
    }
  }
  /**
   * Update current tags display
   */
  updateCurrentTags(tags) {
    if (!this.elements.currentTagsContainer) return;
    this.elements.currentTagsContainer.innerHTML = "";
    if (!tags || tags.length === 0) {
      this.elements.currentTagsContainer.innerHTML = '<div class="no-tags">No tags</div>';
      return;
    }
    const tagsArray = Array.isArray(tags) ? tags : tags.split(" ").filter((tag) => tag.length > 0);
    tagsArray.forEach((tag) => {
      const tagElement = this.createTagElement(tag);
      this.elements.currentTagsContainer.appendChild(tagElement);
    });
  }
  /**
   * [IMMUTABLE-REQ-TAG-003] - Update recent tags display with user-driven behavior
   * @param {string[]} recentTags - Array of recent tag names
   */
  updateRecentTags(recentTags) {
    if (!this.elements.recentTagsContainer) return;
    this.elements.recentTagsContainer.innerHTML = "";
    if (!recentTags || recentTags.length === 0) {
      this.elements.recentTagsContainer.innerHTML = '<div class="no-tags">No recent tags</div>';
      return;
    }
    recentTags.forEach((tag) => {
      const tagElement = this.createRecentTagElement(tag);
      this.elements.recentTagsContainer.appendChild(tagElement);
    });
  }
  /**
   * [IMMUTABLE-REQ-TAG-003] - Create a recent tag element (clickable to add to current site only)
   * @param {string} tag - Tag name
   * @returns {HTMLElement} Tag element
   */
  createRecentTagElement(tag) {
    const tagElement = document.createElement("div");
    tagElement.className = "tag recent clickable";
    tagElement.innerHTML = `
      <span class="tag-text">${this.escapeHtml(tag)}</span>
    `;
    tagElement.addEventListener("click", () => {
      this.emit("addTag", tag);
    });
    return tagElement;
  }
  /**
   * [REQ-SUGGESTED_TAGS_FROM_CONTENT] [IMPL-SUGGESTED_TAGS] [ARCH-SUGGESTED_TAGS]
   * Update suggested tags display
   * @param {string[]} suggestedTags - Array of suggested tag names
   */
  updateSuggestedTags(suggestedTags) {
    if (!this.elements.suggestedTagsContainer) return;
    this.elements.suggestedTagsContainer.innerHTML = "";
    if (!suggestedTags || suggestedTags.length === 0) {
      const suggestedTagsSection2 = document.getElementById("suggestedTags");
      if (suggestedTagsSection2) {
        suggestedTagsSection2.style.display = "none";
      }
      return;
    }
    const suggestedTagsSection = document.getElementById("suggestedTags");
    if (suggestedTagsSection) {
      suggestedTagsSection.style.display = "block";
    }
    suggestedTags.forEach((tag) => {
      const tagElement = this.createRecentTagElement(tag);
      this.elements.suggestedTagsContainer.appendChild(tagElement);
    });
  }
  /**
   * Create a tag element
   */
  createTagElement(tag) {
    const tagElement = document.createElement("div");
    tagElement.className = "tag";
    tagElement.innerHTML = `
      <span class="tag-text">${this.escapeHtml(tag)}</span>
      <button class="tag-remove" type="button" aria-label="Remove tag ${this.escapeHtml(tag)}" title="Remove tag">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
    `;
    const removeButton = tagElement.querySelector(".tag-remove");
    removeButton?.addEventListener("click", () => {
      this.emit("removeTag", tag);
    });
    return tagElement;
  }
  /**
   * Clear tag input
   */
  clearTagInput() {
    if (this.elements.newTagInput) {
      this.elements.newTagInput.value = "";
      this.elements.newTagInput.focus();
    }
  }
  /**
   * [IMPL-SELECTION_TO_TAG_INPUT] Set tag input value (e.g. from page selection).
   * Clears invalid class when setting a value.
   * @param {string} value - Text to set in the new-tag input
   */
  setTagInputValue(value) {
    if (!this.elements.newTagInput) return;
    this.elements.newTagInput.value = value ?? "";
    this.elements.newTagInput.classList.remove("invalid");
  }
  /**
   * Clear search input
   */
  clearSearchInput() {
    if (this.elements.searchInput) {
      this.elements.searchInput.value = "";
    }
  }
  /**
   * Focus tag input
   */
  focusTagInput() {
    if (this.elements.newTagInput) {
      this.elements.newTagInput.focus();
    }
  }
  /**
   * Focus search input
   */
  focusSearchInput() {
    if (this.elements.searchInput) {
      this.elements.searchInput.focus();
    }
  }
  /**
   * Show error message
   */
  showError(message) {
    if (this.elements.errorState && this.elements.errorMessage) {
      this.elements.errorMessage.textContent = message;
      this.elements.errorState.classList.remove("hidden");
      this.elements.loadingState?.classList.add("hidden");
      this.elements.mainInterface?.classList.add("hidden");
    }
  }
  /**
   * Hide error message
   */
  hideError() {
    if (this.elements.errorState) {
      this.elements.errorState.classList.add("hidden");
    }
  }
  /**
   * Show success message
   */
  showSuccess(message) {
    console.log("Success:", message);
  }
  /**
   * Show info message
   */
  showInfo(message) {
    console.log("Info:", message);
  }
  /**
   * Show/hide shortcuts help
   */
  toggleShortcutsHelp() {
    if (this.elements.shortcutsHelp) {
      const isHidden = this.elements.shortcutsHelp.hidden;
      this.elements.shortcutsHelp.hidden = !isHidden;
    }
  }
  /**
   * Hide shortcuts help
   */
  hideShortcutsHelp() {
    if (this.elements.shortcutsHelp) {
      this.elements.shortcutsHelp.hidden = true;
    }
  }
  /**
   * Update button states based on current data
   */
  updateButtonStates(hasBookmark) {
    const bookmarkRequiredButtons = [
      this.elements.togglePrivate,
      this.elements.deletePin
    ];
    bookmarkRequiredButtons.forEach((button) => {
      if (button) {
        button.disabled = !hasBookmark;
        button.classList.toggle("disabled", !hasBookmark);
      }
    });
    if (this.elements.showHoverboard) {
      const buttonText = this.elements.showHoverboard.querySelector(".button-text");
      if (buttonText) {
        buttonText.textContent = "Show Hoverboard";
      }
    }
  }
  /**
   * [POPUP-CLOSE-BEHAVIOR-005] Update Show Hover button state
   * @param {boolean} isOverlayVisible - Whether the overlay is currently visible
   */
  updateShowHoverButtonState(isOverlayVisible) {
    const showHoverBtn = this.elements.showHoverBtn;
    if (showHoverBtn) {
      const actionIcon = showHoverBtn.querySelector(".action-icon");
      if (isOverlayVisible) {
        actionIcon.textContent = "\u{1F648}";
        showHoverBtn.title = "Hide hoverboard overlay";
        showHoverBtn.setAttribute("aria-label", "Hide hoverboard overlay");
      } else {
        actionIcon.textContent = "\u{1F441}\uFE0F";
        showHoverBtn.title = "Show hoverboard overlay";
        showHoverBtn.setAttribute("aria-label", "Show hoverboard overlay");
      }
    }
  }
  /**
   * Set popup theme (light/dark)
   */
  setTheme(theme) {
    if (this.elements.popupContainer) {
      this.elements.popupContainer.classList.remove("light-mode", "dark-mode");
      this.elements.popupContainer.classList.add(`${theme}-mode`);
    }
  }
  /**
   * Add CSS animation class
   */
  addAnimation(element, animationClass) {
    if (element) {
      element.classList.add(animationClass);
      element.addEventListener("animationend", () => {
        element.classList.remove(animationClass);
      }, { once: true });
    }
  }
  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
  /**
   * Handle window resize (if needed for responsive design)
   */
  handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    if (width < 350) {
      this.elements.popupContainer?.classList.add("compact");
    } else {
      this.elements.popupContainer?.classList.remove("compact");
    }
  }
  /**
   * [IMMUTABLE-REQ-TAG-001] - Validate tag input
   * @param {string} tag - Tag to validate
   * @returns {boolean} Whether tag is valid
   */
  isValidTag(tag) {
    if (!tag || typeof tag !== "string") {
      return false;
    }
    const trimmedTag = tag.trim();
    if (trimmedTag.length === 0 || trimmedTag.length > 50) {
      return false;
    }
    const invalidChars = /[<>]/g;
    if (invalidChars.test(trimmedTag)) {
      return false;
    }
    const safeChars = /^[\w\s.#+-]+$/;
    if (!safeChars.test(trimmedTag)) {
      return false;
    }
    return true;
  }
  /**
   * Cleanup event listeners and resources
   */
  cleanup() {
    this.eventHandlers.clear();
    window.removeEventListener("resize", this.handleResize);
  }
  /**
   * [TAB-SEARCH-UI] Show tab search results
   */
  showTabSearchResults(results) {
    const resultsContainer = this.elements.tabSearchResults;
    if (!resultsContainer) return;
    if (results.success) {
      resultsContainer.innerHTML = `
        <div class="search-result">
          <span class="result-count">${results.currentMatch} of ${results.matchCount}</span>
          <span class="result-title">${results.tabTitle}</span>
        </div>
      `;
      resultsContainer.classList.remove("hidden");
    } else {
      resultsContainer.innerHTML = `
        <div class="search-result no-matches">
          <span class="result-message">${results.message}</span>
        </div>
      `;
      resultsContainer.classList.remove("hidden");
    }
  }
  /**
   * [TAB-SEARCH-UI] Update search history display
   */
  updateSearchHistory(history) {
    const historyContainer = this.elements.tabSearchHistory;
    if (!historyContainer || !history.length) return;
    const historyHTML = history.map((term) => `
      <button class="history-item" data-term="${term}">
        ${term}
      </button>
    `).join("");
    historyContainer.innerHTML = historyHTML;
    historyContainer.classList.remove("hidden");
  }
  /**
   * [TAB-SEARCH-UI] Focus tab search input
   */
  focusTabSearchInput() {
    this.elements.tabSearchInput?.focus();
  }
};

// src/ui/popup/StateManager.js
var StateManager = class {
  constructor() {
    this.state = {
      currentTab: null,
      currentPin: null,
      url: "",
      title: "",
      tags: [],
      isPrivate: false,
      isConnected: false,
      isLoading: false,
      searchHistory: [],
      preferences: {}
    };
    this.listeners = /* @__PURE__ */ new Map();
    this.stateHistory = [];
    this.maxHistorySize = 50;
    this.loadPersistedState();
  }
  /**
   * Get current state or specific property
   */
  getState(property = null) {
    if (property) {
      return this.state[property];
    }
    return { ...this.state };
  }
  /**
   * Set state with partial updates
   */
  setState(updates) {
    const previousState = { ...this.state };
    this.state = {
      ...this.state,
      ...updates
    };
    this.addToHistory(previousState);
    this.notifyListeners(updates, previousState);
    this.persistState();
  }
  /**
   * Subscribe to state changes
   */
  subscribe(listener, properties = null) {
    const id = Date.now() + Math.random();
    this.listeners.set(id, {
      callback: listener,
      properties: properties ? Array.isArray(properties) ? properties : [properties] : null
    });
    return () => this.listeners.delete(id);
  }
  /**
   * Notify all listeners of state changes
   */
  notifyListeners(updates, previousState) {
    this.listeners.forEach(({ callback, properties }) => {
      if (properties) {
        const hasRelevantChanges = properties.some(
          (prop) => Object.prototype.hasOwnProperty.call(updates, prop) && updates[prop] !== previousState[prop]
        );
        if (!hasRelevantChanges) return;
      }
      try {
        callback(this.state, updates, previousState);
      } catch (error) {
        console.error("Error in state listener:", error);
      }
    });
  }
  /**
   * Add state to history for undo functionality
   */
  addToHistory(state) {
    this.stateHistory.push({
      state: { ...state },
      timestamp: Date.now()
    });
    if (this.stateHistory.length > this.maxHistorySize) {
      this.stateHistory.shift();
    }
  }
  /**
   * Undo last state change
   */
  undo() {
    if (this.stateHistory.length > 0) {
      const previousState = this.stateHistory.pop();
      this.state = { ...previousState.state };
      this.notifyListeners(this.state, {});
      return true;
    }
    return false;
  }
  /**
   * Reset state to initial values
   */
  reset() {
    const initialState = {
      currentTab: null,
      currentPin: null,
      url: "",
      title: "",
      tags: [],
      isPrivate: false,
      isConnected: false,
      isLoading: false,
      searchHistory: this.state.searchHistory,
      // Preserve search history
      preferences: this.state.preferences
      // Preserve preferences
    };
    this.setState(initialState);
  }
  /**
   * Update current tab information
   */
  updateTab(tabInfo) {
    this.setState({
      currentTab: tabInfo,
      url: tabInfo?.url || "",
      title: tabInfo?.title || ""
    });
  }
  /**
   * Update current pin/bookmark information
   */
  updatePin(pinInfo) {
    const tags = pinInfo?.tags ? Array.isArray(pinInfo.tags) ? pinInfo.tags : pinInfo.tags.split(" ").filter((tag) => tag.length > 0) : [];
    this.setState({
      currentPin: pinInfo,
      tags,
      isPrivate: pinInfo?.shared === "no"
    });
  }
  /**
   * Add to search history
   */
  addToSearchHistory(searchTerm) {
    if (!searchTerm || searchTerm.trim().length === 0) return;
    const trimmedTerm = searchTerm.trim();
    const currentHistory = this.state.searchHistory;
    const filteredHistory = currentHistory.filter((term) => term !== trimmedTerm);
    const newHistory = [trimmedTerm, ...filteredHistory].slice(0, 10);
    this.setState({
      searchHistory: newHistory
    });
  }
  /**
   * Update user preferences
   */
  updatePreferences(preferences) {
    this.setState({
      preferences: {
        ...this.state.preferences,
        ...preferences
      }
    });
  }
  /**
   * Set loading state
   */
  setLoading(isLoading) {
    this.setState({ isLoading });
  }
  /**
   * Set connection status
   */
  setConnected(isConnected) {
    this.setState({ isConnected });
  }
  /**
   * Load persisted state from storage
   */
  async loadPersistedState() {
    try {
      const result = await chrome.storage.local.get(["popupState"]);
      if (result.popupState) {
        const persistedState = result.popupState;
        this.setState({
          searchHistory: persistedState.searchHistory || [],
          preferences: persistedState.preferences || {}
        });
      }
    } catch (error) {
      console.warn("Failed to load persisted state:", error);
    }
  }
  /**
   * Persist state to storage
   */
  async persistState() {
    try {
      const stateToPersist = {
        searchHistory: this.state.searchHistory,
        preferences: this.state.preferences,
        timestamp: Date.now()
      };
      await chrome.storage.local.set({
        popupState: stateToPersist
      });
    } catch (error) {
      console.warn("Failed to persist state:", error);
    }
  }
  /**
   * Compute derived state values
   */
  getDerivedState() {
    return {
      hasBookmark: !!this.state.currentPin,
      tagCount: this.state.tags.length,
      isValidUrl: this.isValidUrl(this.state.url),
      canSave: this.state.url && this.state.title,
      isEmpty: !this.state.currentPin && this.state.tags.length === 0
    };
  }
  /**
   * Validate URL
   */
  isValidUrl(url) {
    try {
      new URL(url);
      return url.startsWith("http://") || url.startsWith("https://");
    } catch {
      return false;
    }
  }
  /**
   * Get state summary for debugging
   */
  getStateSummary() {
    return {
      hasTab: !!this.state.currentTab,
      hasPin: !!this.state.currentPin,
      tagCount: this.state.tags.length,
      isPrivate: this.state.isPrivate,
      isConnected: this.state.isConnected,
      isLoading: this.state.isLoading,
      url: this.state.url ? this.state.url.substring(0, 50) + "..." : "",
      derived: this.getDerivedState()
    };
  }
  /**
   * Export state for backup
   */
  exportState() {
    return {
      ...this.state,
      exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
      version: "1.0"
    };
  }
  /**
   * Import state from backup
   */
  importState(importedState) {
    if (!importedState || typeof importedState !== "object") {
      throw new Error("Invalid state format");
    }
    const safeState = {
      searchHistory: Array.isArray(importedState.searchHistory) ? importedState.searchHistory : [],
      preferences: typeof importedState.preferences === "object" ? importedState.preferences : {}
    };
    this.setState(safeState);
  }
  /**
   * Clear all persisted data
   */
  async clearPersistedState() {
    try {
      await chrome.storage.local.remove(["popupState"]);
      this.setState({
        searchHistory: [],
        preferences: {}
      });
    } catch (error) {
      console.warn("Failed to clear persisted state:", error);
    }
  }
  /**
   * Cleanup state manager
   */
  cleanup() {
    this.listeners.clear();
    this.stateHistory = [];
  }
};

// src/shared/ErrorHandler.js
var ErrorHandler = class {
  constructor() {
    this.errorLog = [];
    this.maxLogSize = 100;
    this.onError = null;
    this.isDebugging = false;
    this.errorTypes = {
      NETWORK: "network",
      PERMISSION: "permission",
      VALIDATION: "validation",
      RUNTIME: "runtime",
      STORAGE: "storage",
      CONTENT_SCRIPT: "content_script",
      BACKGROUND: "background",
      USER_INPUT: "user_input"
    };
    this.setupGlobalHandlers();
  }
  /**
   * Setup global error handlers
   */
  setupGlobalHandlers() {
    window.addEventListener("unhandledrejection", (event) => {
      console.error("Unhandled Promise Rejection Details:", {
        reason: event.reason,
        promise: event.promise,
        stack: event.reason?.stack,
        message: event.reason?.message
      });
      this.handleError("Unhandled Promise Rejection", event.reason, this.errorTypes.RUNTIME);
      event.preventDefault();
    });
    window.addEventListener("error", (event) => {
      console.error("Global Error Details:", {
        error: event.error,
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
      this.handleError("Global Error", event.error || event.message, this.errorTypes.RUNTIME);
    });
  }
  /**
   * Main error handling method
   */
  handleError(message, error = null, type = this.errorTypes.RUNTIME, context = {}) {
    const errorInfo = this.createErrorInfo(message, error, type, context);
    this.addToLog(errorInfo);
    if (this.isDebugging) {
      console.error("ErrorHandler:", errorInfo);
    }
    this.reportError(errorInfo);
    if (this.onError) {
      try {
        this.onError(this.getUserFriendlyMessage(errorInfo), errorInfo);
      } catch (callbackError) {
        console.error("Error in error handler callback:", callbackError);
      }
    }
    return errorInfo;
  }
  /**
   * Create standardized error information
   */
  createErrorInfo(message, error, type, context) {
    const errorInfo = {
      id: this.generateErrorId(),
      message,
      type,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      context
    };
    if (error) {
      if (error instanceof Error) {
        errorInfo.stack = error.stack;
        errorInfo.name = error.name;
        errorInfo.originalMessage = error.message;
      } else if (typeof error === "string") {
        errorInfo.originalMessage = error;
      } else {
        errorInfo.originalMessage = JSON.stringify(error);
      }
    }
    if (typeof chrome !== "undefined" && chrome.runtime) {
      errorInfo.extensionId = chrome.runtime.id;
      if (chrome.runtime.lastError) {
        errorInfo.chromeError = chrome.runtime.lastError.message;
      }
    }
    return errorInfo;
  }
  /**
   * Add error to log
   */
  addToLog(errorInfo) {
    this.errorLog.unshift(errorInfo);
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }
  }
  /**
   * Generate unique error ID
   */
  generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  /**
   * Get user-friendly error message
   */
  getUserFriendlyMessage(errorInfo) {
    const typeMessages = {
      [this.errorTypes.NETWORK]: "Network connection problem. Please check your internet connection.",
      [this.errorTypes.PERMISSION]: "Permission denied. Please check extension permissions.",
      [this.errorTypes.VALIDATION]: "Invalid input. Please check your data and try again.",
      [this.errorTypes.STORAGE]: "Storage problem. Please try again later.",
      [this.errorTypes.CONTENT_SCRIPT]: "Page interaction problem. Please reload the page.",
      [this.errorTypes.BACKGROUND]: "Extension service problem. Please reload the extension.",
      [this.errorTypes.USER_INPUT]: "Invalid input. Please check your data.",
      [this.errorTypes.RUNTIME]: "An unexpected error occurred. Please try again."
    };
    if (errorInfo.originalMessage) {
      const message = errorInfo.originalMessage.toLowerCase();
      if (message.includes("network") || message.includes("fetch")) {
        return typeMessages[this.errorTypes.NETWORK];
      }
      if (message.includes("permission") || message.includes("denied")) {
        return typeMessages[this.errorTypes.PERMISSION];
      }
      if (message.includes("storage") || message.includes("quota")) {
        return typeMessages[this.errorTypes.STORAGE];
      }
    }
    return typeMessages[errorInfo.type] || typeMessages[this.errorTypes.RUNTIME];
  }
  /**
   * Report error to tracking service
   */
  async reportError(errorInfo) {
    try {
      if (this.isDebugging) {
        await this.storeErrorLocally(errorInfo);
      }
    } catch (reportingError) {
      console.warn("Failed to report error:", reportingError);
    }
  }
  /**
   * Store error locally for debugging
   */
  async storeErrorLocally(errorInfo) {
    try {
      const result = await chrome.storage.local.get(["errorLog"]);
      const existingLog = result.errorLog || [];
      existingLog.unshift(errorInfo);
      const trimmedLog = existingLog.slice(0, 50);
      await chrome.storage.local.set({ errorLog: trimmedLog });
    } catch (storageError) {
      console.warn("Failed to store error locally:", storageError);
    }
  }
  /**
   * Handle Chrome extension API errors
   */
  handleChromeError(operation, context = {}) {
    if (chrome.runtime.lastError) {
      this.handleError(
        `Chrome API Error in ${operation}`,
        chrome.runtime.lastError.message,
        this.errorTypes.RUNTIME,
        context
      );
      return true;
    }
    return false;
  }
  /**
   * Handle network/fetch errors
   */
  handleNetworkError(url, error, context = {}) {
    this.handleError(
      `Network Error: ${url}`,
      error,
      this.errorTypes.NETWORK,
      { url, ...context }
    );
  }
  /**
   * Handle validation errors
   */
  handleValidationError(field, value, rule, context = {}) {
    this.handleError(
      `Validation Error: ${field}`,
      `Value "${value}" failed validation rule: ${rule}`,
      this.errorTypes.VALIDATION,
      { field, value, rule, ...context }
    );
  }
  /**
   * Handle permission errors
   */
  handlePermissionError(permission, context = {}) {
    this.handleError(
      `Permission Error: ${permission}`,
      `Missing or denied permission: ${permission}`,
      this.errorTypes.PERMISSION,
      { permission, ...context }
    );
  }
  /**
   * Handle storage errors
   */
  handleStorageError(operation, error, context = {}) {
    this.handleError(
      `Storage Error: ${operation}`,
      error,
      this.errorTypes.STORAGE,
      { operation, ...context }
    );
  }
  /**
   * Set error callback
   */
  setErrorCallback(callback) {
    this.onError = callback;
  }
  /**
   * Enable/disable debugging
   */
  setDebugging(enabled) {
    this.isDebugging = enabled;
  }
  /**
   * Get error statistics
   */
  getErrorStats() {
    const stats = {
      total: this.errorLog.length,
      byType: {},
      recent: this.errorLog.slice(0, 5),
      oldest: this.errorLog.length > 0 ? this.errorLog[this.errorLog.length - 1].timestamp : null,
      newest: this.errorLog.length > 0 ? this.errorLog[0].timestamp : null
    };
    this.errorLog.forEach((error) => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
    });
    return stats;
  }
  /**
   * Get errors by type
   */
  getErrorsByType(type) {
    return this.errorLog.filter((error) => error.type === type);
  }
  /**
   * Get recent errors
   */
  getRecentErrors(count = 10) {
    return this.errorLog.slice(0, count);
  }
  /**
   * Clear error log
   */
  clearLog() {
    this.errorLog = [];
  }
  /**
   * Export error log
   */
  exportLog() {
    return {
      errors: this.errorLog,
      stats: this.getErrorStats(),
      exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
      version: "1.0"
    };
  }
  /**
   * Check if error should be retried
   */
  shouldRetry(errorInfo, attempt = 1, maxAttempts = 3) {
    if (errorInfo.type === this.errorTypes.VALIDATION || errorInfo.type === this.errorTypes.PERMISSION) {
      return false;
    }
    if (attempt >= maxAttempts) {
      return false;
    }
    return errorInfo.type === this.errorTypes.NETWORK || errorInfo.type === this.errorTypes.RUNTIME;
  }
  /**
   * Create retry delay (exponential backoff)
   */
  getRetryDelay(attempt) {
    return Math.min(1e3 * Math.pow(2, attempt - 1), 1e4);
  }
  /**
   * Cleanup error handler
   */
  cleanup() {
    this.errorLog = [];
    this.onError = null;
  }
};

// src/ui/popup/PopupController.js
init_utils();
init_config_manager();

// src/shared/ui-inspector.js
var MAX_ACTIONS = 50;
var _enabledOverride = false;
function hasLocalStorage() {
  try {
    return typeof localStorage !== "undefined";
  } catch {
    return false;
  }
}
function isEnabled() {
  if (_enabledOverride) return true;
  if (hasLocalStorage() && localStorage.getItem("DEBUG_HOVERBOARD_UI")) return true;
  return false;
}
var _actions = [];
function sanitize(data) {
  if (data == null) return data;
  if (typeof data !== "object") return data;
  const o = {};
  for (const [k, v] of Object.entries(data)) {
    if (k === "token" || k === "apiToken" || k.toLowerCase().includes("password")) {
      o[k] = "[REDACTED]";
    } else {
      o[k] = typeof v === "object" && v !== null && !Array.isArray(v) ? sanitize(v) : v;
    }
  }
  return o;
}
function recordAction(actionId, payload, surface) {
  if (!isEnabled()) return;
  _actions.push({
    actionId,
    payload: payload != null ? sanitize(typeof payload === "object" ? payload : { value: payload }) : void 0,
    surface: surface || "popup",
    ts: Date.now()
  });
  if (_actions.length > MAX_ACTIONS) _actions.shift();
}

// src/core/message-handler.js
init_pinboard_service();

// src/features/storage/local-bookmark-service.js
init_tag_service();
init_utils();

// src/core/message-handler.js
init_tag_service();
init_config_manager();
init_utils();
var MESSAGE_TYPES = {
  // Data retrieval
  GET_CURRENT_BOOKMARK: "getCurrentBookmark",
  GET_TAGS_FOR_URL: "getTagsForUrl",
  // [IMPL-URL_TAGS_DISPLAY] Centralized tag storage for tests and UI
  GET_RECENT_BOOKMARKS: "getRecentBookmarks",
  GET_LOCAL_BOOKMARKS_FOR_INDEX: "getLocalBookmarksForIndex",
  // [REQ-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX]
  GET_AGGREGATED_BOOKMARKS_FOR_INDEX: "getAggregatedBookmarksForIndex",
  // [ARCH-STORAGE_INDEX_AND_ROUTER] local + file with storage column
  GET_OPTIONS: "getOptions",
  GET_TAB_ID: "getTabId",
  // Bookmark operations
  SAVE_BOOKMARK: "saveBookmark",
  DELETE_BOOKMARK: "deleteBookmark",
  SAVE_TAG: "saveTag",
  DELETE_TAG: "deleteTag",
  // [ARCH-LOCAL_STORAGE_PROVIDER] Storage mode switch (handled by service worker)
  SWITCH_STORAGE_MODE: "switchStorageMode",
  // [REQ-PER_BOOKMARK_STORAGE_BACKEND] [IMPL-BOOKMARK_ROUTER] Per-bookmark storage (move UI)
  GET_STORAGE_BACKEND_FOR_URL: "getStorageBackendForUrl",
  MOVE_BOOKMARK_TO_STORAGE: "moveBookmarkToStorage",
  // UI operations
  TOGGLE_HOVER: "toggleHover",
  HIDE_OVERLAY: "hideOverlay",
  REFRESH_DATA: "refreshData",
  REFRESH_HOVER: "refreshHover",
  BOOKMARK_UPDATED: "bookmarkUpdated",
  // [TOGGLE-SYNC-MESSAGE-001] - New message type
  TAG_UPDATED: "TAG_UPDATED",
  // [TAG-SYNC-MESSAGE-001] - New message type for tag synchronization
  // Site management
  INHIBIT_URL: "inhibitUrl",
  // Search operations
  SEARCH_TITLE: "searchTitle",
  SEARCH_TITLE_TEXT: "searchTitleText",
  // [IMMUTABLE-REQ-TAG-002] Tab search operations
  SEARCH_TABS: "searchTabs",
  GET_SEARCH_HISTORY: "getSearchHistory",
  CLEAR_SEARCH_STATE: "clearSearchState",
  // [IMMUTABLE-REQ-TAG-003] Recent tags operations
  ADD_TAG_TO_RECENT: "addTagToRecent",
  GET_USER_RECENT_TAGS: "getUserRecentTags",
  GET_SHARED_MEMORY_STATUS: "getSharedMemoryStatus",
  // Content script lifecycle
  CONTENT_SCRIPT_READY: "contentScriptReady",
  // Overlay configuration
  UPDATE_OVERLAY_CONFIG: "updateOverlayConfig",
  GET_OVERLAY_CONFIG: "getOverlayConfig",
  // Development/debug
  DEV_COMMAND: "devCommand",
  ECHO: "echo"
};

// src/shared/ui-action-contract.js
var POPUP_ACTION_IDS = {
  showHoverboard: "showHoverboard",
  togglePrivate: "togglePrivate",
  readLater: "readLater",
  deletePin: "deletePin",
  addTag: "addTag",
  removeTag: "removeTag",
  search: "search",
  refreshData: "refreshData",
  reloadExtension: "reloadExtension",
  openOptions: "openOptions",
  openBookmarksIndex: "openBookmarksIndex",
  openBrowserBookmarkImport: "openBrowserBookmarkImport",
  storageBackendChange: "storageBackendChange",
  showHoverOnPageLoadChange: "showHoverOnPageLoadChange",
  retry: "retry"
};
var POPUP_ACTION_TO_MESSAGE = {
  [POPUP_ACTION_IDS.showHoverboard]: MESSAGE_TYPES.TOGGLE_HOVER,
  // sendToTab
  [POPUP_ACTION_IDS.togglePrivate]: MESSAGE_TYPES.SAVE_BOOKMARK,
  [POPUP_ACTION_IDS.readLater]: MESSAGE_TYPES.SAVE_BOOKMARK,
  [POPUP_ACTION_IDS.deletePin]: MESSAGE_TYPES.DELETE_BOOKMARK,
  [POPUP_ACTION_IDS.addTag]: MESSAGE_TYPES.SAVE_TAG,
  [POPUP_ACTION_IDS.removeTag]: MESSAGE_TYPES.DELETE_TAG,
  [POPUP_ACTION_IDS.search]: MESSAGE_TYPES.SEARCH_TABS,
  [POPUP_ACTION_IDS.refreshData]: "getCurrentBookmark",
  // popup refresh uses getCurrentBookmark + getTagsForUrl
  [POPUP_ACTION_IDS.reloadExtension]: null,
  // no message; chrome.tabs.reload
  [POPUP_ACTION_IDS.openOptions]: null,
  // chrome.runtime.openOptionsPage
  [POPUP_ACTION_IDS.openBookmarksIndex]: null,
  // chrome.tabs.create
  [POPUP_ACTION_IDS.openBrowserBookmarkImport]: null,
  // chrome.tabs.create [REQ-BROWSER_BOOKMARK_IMPORT]
  [POPUP_ACTION_IDS.storageBackendChange]: MESSAGE_TYPES.MOVE_BOOKMARK_TO_STORAGE,
  [POPUP_ACTION_IDS.showHoverOnPageLoadChange]: MESSAGE_TYPES.UPDATE_OVERLAY_CONFIG,
  [POPUP_ACTION_IDS.retry]: null
  // retry load
};

// src/ui/popup/PopupController.js
var PopupController = class {
  constructor(dependencies = {}) {
    this.errorHandler = dependencies.errorHandler || new ErrorHandler();
    this.stateManager = dependencies.stateManager || new StateManager();
    this.configManager = dependencies.configManager || new ConfigManager();
    this.uiManager = dependencies.uiManager || new UIManager({
      errorHandler: this.errorHandler,
      stateManager: this.stateManager,
      config: {}
    });
    this.currentTab = null;
    this.currentPin = null;
    this.isInitialized = false;
    this.isLoading = false;
    this._onAction = null;
    this._onStateChange = null;
    const isTestEnv = typeof process !== "undefined" && process?.env?.JEST_WORKER_ID;
    this.tabMessageTimeoutMs = dependencies.tabMessageTimeoutMs ?? (isTestEnv ? 100 : 2e3);
    this.loadInitialData = this.loadInitialData.bind(this);
    this.handleShowHoverboard = this.handleShowHoverboard.bind(this);
    this.handleTogglePrivate = this.handleTogglePrivate.bind(this);
    this.handleReadLater = this.handleReadLater.bind(this);
    this.handleAddTag = this.handleAddTag.bind(this);
    this.handleRemoveTag = this.handleRemoveTag.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
    this.handleDeletePin = this.handleDeletePin.bind(this);
    this.handleReloadExtension = this.handleReloadExtension.bind(this);
    this.handleOpenOptions = this.handleOpenOptions.bind(this);
    this.handleOpenBookmarksIndex = this.handleOpenBookmarksIndex.bind(this);
    this.handleOpenBrowserBookmarkImport = this.handleOpenBrowserBookmarkImport.bind(this);
    this.handleStorageBackendChange = this.handleStorageBackendChange.bind(this);
    this.normalizeTags = this.normalizeTags.bind(this);
    this.setupEventListeners();
    this.setupAutoRefresh();
    this.setupRealTimeUpdates();
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
        if (message.type === "BOOKMARK_UPDATED") {
          try {
            debugLog("[POPUP-REFRESH-001] Received BOOKMARK_UPDATED, refreshing data");
            if (this.currentTab && this.currentTab.url) {
              const updatedPin = await this.getBookmarkData(this.currentTab.url);
              this.currentPin = updatedPin;
              this.stateManager.setState({ currentPin: this.currentPin });
              this.uiManager.updatePrivateStatus(this.currentPin?.shared === "no");
              this.uiManager.updateReadLaterStatus(this.currentPin?.toread === "yes");
              const normalizedTags = this.normalizeTags(this.currentPin?.tags);
              this.uiManager.updateCurrentTags(normalizedTags);
              this.uiManager.showSuccess("Bookmark updated from another window");
            }
          } catch (error) {
            debugError("[TOGGLE_SYNC_POPUP] Failed to update popup on BOOKMARK_UPDATED:", error);
          }
        }
      });
    }
    debugLog("[CHROME-DEBUG-001] PopupController constructor called", { platform: navigator.userAgent });
    if (typeof chrome !== "undefined" && chrome.runtime) {
      debugLog("[CHROME-DEBUG-001] Detected Chrome runtime in PopupController");
    } else if (typeof browser !== "undefined" && browser.runtime) {
      debugLog("[CHROME-DEBUG-001] Detected browser polyfill runtime in PopupController");
    } else {
      debugError("[CHROME-DEBUG-001] No recognized extension runtime detected in PopupController");
    }
    if (!debugLog || !debugError) {
      console.error("[CHROME-DEBUG-001] utils.js functions missing in PopupController");
    }
  }
  /**
   * Normalize tags to array format regardless of input type
   */
  normalizeTags(tags) {
    if (!tags) {
      return [];
    }
    if (typeof tags === "string") {
      return tags.split(" ").filter((tag) => tag.trim());
    } else if (Array.isArray(tags)) {
      return tags.filter((tag) => tag && typeof tag === "string" && tag.trim());
    }
    return [];
  }
  /**
   * Setup event listeners for popup actions
   */
  setupEventListeners() {
    this.uiManager.on("showHoverboard", this.handleShowHoverboard);
    this.uiManager.on("togglePrivate", this.handleTogglePrivate);
    this.uiManager.on("readLater", this.handleReadLater);
    this.uiManager.on("addTag", this.handleAddTag);
    this.uiManager.on("removeTag", this.handleRemoveTag);
    this.uiManager.on("search", this.handleSearch);
    this.uiManager.on("deletePin", this.handleDeletePin);
    this.uiManager.on("reloadExtension", this.handleReloadExtension);
    this.uiManager.on("openOptions", this.handleOpenOptions);
    this.uiManager.on("openBookmarksIndex", this.handleOpenBookmarksIndex);
    this.uiManager.on("openBrowserBookmarkImport", this.handleOpenBrowserBookmarkImport);
    this.uiManager.on("storageBackendChange", this.handleStorageBackendChange);
    this.uiManager.on("storageLocalToggle", (targetBackend) => this.handleStorageBackendChange(targetBackend));
    this.uiManager.on("refreshData", this.refreshPopupData.bind(this));
    this.uiManager.on("showHoverOnPageLoadChange", this.handleShowHoverOnPageLoadChange.bind(this));
  }
  /**
   * [IMPL-UI_TESTABILITY_HOOKS] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION]
   * Set optional callback for UI actions (for tests). Signature: ({ actionId, payload }) => void
   */
  setOnAction(fn) {
    this._onAction = typeof fn === "function" ? fn : null;
  }
  /**
   * [IMPL-UI_TESTABILITY_HOOKS] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION]
   * Set optional callback for state/screen changes (for tests). Signature: ({ screen, state }) => void
   */
  setOnStateChange(fn) {
    this._onStateChange = typeof fn === "function" ? fn : null;
  }
  /**
   * Load initial data when popup opens
   * [POPUP-DATA-FLOW-001] Enhanced data flow validation
   */
  async loadInitialData() {
    debugLog("[POPUP-DATA-FLOW-001] loadInitialData: start");
    try {
      this.setLoading(true);
      const params = typeof window !== "undefined" && window.location && window.location.search ? new URLSearchParams(window.location.search) : null;
      const screenshotMode = params && params.get("screenshot") === "1";
      const screenshotUrl = params && params.get("url");
      const screenshotTitle = params && params.get("title");
      if (screenshotMode && screenshotUrl) {
        const decodedUrl = decodeURIComponent(screenshotUrl);
        const decodedTitle = screenshotTitle ? decodeURIComponent(screenshotTitle) : "";
        this.currentTab = { url: decodedUrl, title: decodedTitle };
        debugLog("[IMPL-SCREENSHOT_MODE] loadInitialData: using fake tab from params", this.currentTab);
      } else {
        debugLog("[POPUP-DATA-FLOW-001] loadInitialData: calling getCurrentTab");
        this.currentTab = await this.getCurrentTab();
        debugLog("[POPUP-DATA-FLOW-001] loadInitialData: got currentTab", this.currentTab);
      }
      if (!this.currentTab) {
        throw new Error("Unable to get current tab information");
      }
      this.stateManager.setState({
        currentTab: this.currentTab,
        url: this.currentTab.url,
        title: this.currentTab.title
      });
      debugLog("[POPUP-DATA-FLOW-001] loadInitialData: calling getBookmarkData", this.currentTab.url);
      this.currentPin = await this.getBookmarkData(this.currentTab.url);
      debugLog("[POPUP-DATA-FLOW-001] loadInitialData: got currentPin", this.currentPin);
      if (!this.currentPin) {
        debugLog("[POPUP-DATA-FLOW-001] loadInitialData: No bookmark data, creating empty bookmark for current site");
        this.currentPin = {
          url: this.currentTab.url,
          description: this.currentTab.title || "",
          tags: [],
          shared: "yes",
          toread: "no",
          time: "",
          updated_at: "",
          extended: "",
          hash: ""
        };
        debugLog("[POPUP-DATA-FLOW-001] loadInitialData: created empty bookmark", this.currentPin);
      }
      this.stateManager.setState({ currentPin: this.currentPin });
      debugLog("[POPUP-DATA-FLOW-001] loadInitialData: bookmark data validation:", {
        hasBookmark: !!this.currentPin,
        url: this.currentPin?.url,
        description: this.currentPin?.description,
        tagCount: this.currentPin?.tags?.length || 0,
        isPrivate: this.currentPin?.shared === "no",
        isReadLater: this.currentPin?.toread === "yes"
      });
      const normalizedTags = this.normalizeTags(this.currentPin?.tags);
      debugLog("[POPUP-DATA-FLOW-001] loadInitialData: tags processing:", {
        originalTags: this.currentPin?.tags,
        originalTagsType: typeof this.currentPin?.tags,
        normalizedTags,
        normalizedTagsLength: normalizedTags.length,
        normalizedTagsIsArray: Array.isArray(normalizedTags)
      });
      debugLog("[POPUP-DATA-FLOW-001] loadInitialData: calling updateCurrentTags with:", normalizedTags);
      this.uiManager.updateCurrentTags(normalizedTags);
      this.uiManager.updateConnectionStatus(true);
      this.uiManager.updatePrivateStatus(this.currentPin?.shared === "no");
      const hasReadLaterStatus = this.currentPin?.toread === "yes";
      this.uiManager.updateReadLaterStatus(hasReadLaterStatus);
      await this.loadRecentTags();
      await this.loadSuggestedTags();
      try {
        const selectionResponse = await this.sendToTab({ type: "GET_PAGE_SELECTION" });
        const data = selectionResponse?.data ?? selectionResponse;
        const raw = data?.selection;
        if (raw && typeof raw === "string") {
          const normalized = normalizeSelectionForTagInput(raw, 8);
          if (normalized) this.uiManager.setTagInputValue(normalized);
        }
      } catch (_) {
      }
      await this.loadShowHoverOnPageLoadSetting();
      const manifest = chrome.runtime.getManifest();
      this.uiManager.updateVersionInfo(manifest.version);
      const hasRealBookmark = !!this.currentPin?.time;
      const validBackends = ["pinboard", "local", "file", "sync"];
      let storageBackend;
      if (!hasRealBookmark) {
        storageBackend = await this.configManager.getStorageMode();
      } else {
        storageBackend = await this.getStorageBackendForUrl(this.currentTab?.url);
      }
      const backend = validBackends.includes(storageBackend) ? storageBackend : await this.configManager.getStorageMode() || "local";
      this.uiManager.updateStorageBackendValue(backend);
      this.uiManager.updateStorageLocalToggle(backend, hasRealBookmark);
      const token = await this.configManager.getAuthToken();
      this.uiManager.updateStoragePinboardEnabled(!!(token && token.trim()));
      this.isInitialized = true;
      debugLog("[POPUP-DATA-FLOW-001] Popup initialization completed successfully");
      if (this._onStateChange) {
        this._onStateChange({ screen: "mainInterface", state: { bookmark: this.currentPin } });
      }
    } catch (error) {
      debugError("[POPUP-DATA-FLOW-001] Failed to load initial data:", error);
      if (this._onStateChange) this._onStateChange({ screen: "error", state: {} });
      if (this.errorHandler) {
        this.errorHandler.handleError("Failed to load initial data", error);
      }
      this.uiManager.updateConnectionStatus(false);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }
  /**
   * [IMMUTABLE-REQ-TAG-003] - Load user-driven recent tags from shared memory
   * Excludes tags already assigned to the current site
   */
  async loadRecentTags() {
    try {
      debugLog("[POPUP-CONTROLLER] [IMMUTABLE-REQ-TAG-003] Loading user-driven recent tags");
      const currentTags = this.normalizeTags(this.currentPin?.tags || []);
      debugLog("[POPUP-CONTROLLER] [IMMUTABLE-REQ-TAG-003] Current tags to exclude:", currentTags);
      const response = await this.sendMessage({
        type: "getRecentBookmarks",
        data: {
          currentTags,
          // Pass current tags for exclusion
          senderUrl: this.currentTab?.url
        }
      });
      debugLog("[POPUP-CONTROLLER] [IMMUTABLE-REQ-TAG-003] Recent bookmarks response received:", response);
      if (response && response.recentTags) {
        debugLog("[POPUP-CONTROLLER] [IMMUTABLE-REQ-TAG-003] Recent tags from response:", response.recentTags);
        const recentTagNames = response.recentTags.map((tag) => {
          if (typeof tag === "string") {
            return tag;
          } else if (tag && typeof tag === "object" && tag.name) {
            return tag.name;
          } else {
            return String(tag);
          }
        });
        debugLog("[POPUP-CONTROLLER] [IMMUTABLE-REQ-TAG-003] Extracted recent tag names:", recentTagNames);
        const filteredRecentTags = recentTagNames.filter(
          (tag) => !currentTags.includes(tag)
        );
        debugLog("[POPUP-CONTROLLER] [IMMUTABLE-REQ-TAG-003] Final filtered recent tags:", filteredRecentTags);
        this.uiManager.updateRecentTags(filteredRecentTags);
      } else {
        debugLog("[POPUP-CONTROLLER] [IMMUTABLE-REQ-TAG-003] No recent tags in response, updating with empty array");
        this.uiManager.updateRecentTags([]);
      }
    } catch (error) {
      debugError("[POPUP-CONTROLLER] [IMMUTABLE-REQ-TAG-003] Failed to load recent tags:", error);
      this.uiManager.updateRecentTags([]);
    }
  }
  /**
   * [REQ-SUGGESTED_TAGS_FROM_CONTENT] [IMPL-SUGGESTED_TAGS] [ARCH-SUGGESTED_TAGS]
   * Load suggested tags from page headings
   */
  async loadSuggestedTags() {
    try {
      debugLog("[POPUP-CONTROLLER] [REQ-SUGGESTED_TAGS_FROM_CONTENT] Loading suggested tags from page content");
      if (!this.currentTab || !this.currentTab.id) {
        debugLog("[POPUP-CONTROLLER] [REQ-SUGGESTED_TAGS_FROM_CONTENT] No current tab, skipping suggested tags");
        this.uiManager.updateSuggestedTags([]);
        return;
      }
      const url = (this.currentTab.url || "").trim();
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        debugLog("[POPUP-CONTROLLER] [REQ-SUGGESTED_TAGS_FROM_CONTENT] Tab URL not injectable (chrome-extension://, chrome://, etc.), skipping suggested tags");
        this.uiManager.updateSuggestedTags([]);
        return;
      }
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: this.currentTab.id },
          world: "MAIN",
          // Run in page context so we read the page's DOM, not an isolated copy
          func: () => {
            const allTexts = [];
            const extractElementText = (element) => {
              if (element.title && element.title.trim().length > 0) {
                return element.title.trim();
              }
              const childWithTitle = element.querySelector("[title]");
              if (childWithTitle && childWithTitle.title && childWithTitle.title.trim().length > 0) {
                return childWithTitle.title.trim();
              }
              return (element.textContent || "").trim();
            };
            if (document.title) {
              allTexts.push(document.title);
            }
            try {
              const urlObj = new URL(window.location.href);
              const pathSegments = urlObj.pathname.split("/").filter((seg) => seg.length > 0);
              const meaningfulSegments = pathSegments.filter((seg) => {
                const lower = seg.toLowerCase();
                return !["www", "com", "org", "net", "html", "htm", "php", "asp", "aspx", "index", "home", "page"].includes(lower) && !/^\d+$/.test(seg) && seg.length >= 2;
              });
              if (meaningfulSegments.length > 0) {
                allTexts.push(meaningfulSegments.join(" "));
              }
            } catch (e) {
            }
            const metaKeywords = document.querySelector('meta[name="keywords"]');
            if (metaKeywords && metaKeywords.content && metaKeywords.content.trim().length > 0) {
              allTexts.push(metaKeywords.content.trim());
            }
            const metaDescription = document.querySelector('meta[name="description"]');
            if (metaDescription && metaDescription.content && metaDescription.content.trim().length > 0) {
              allTexts.push(metaDescription.content.trim());
            }
            const headings = document.querySelectorAll("h1, h2, h3");
            if (headings.length > 0) {
              const headingTexts = Array.from(headings).map((h) => extractElementText(h)).filter((t) => t.length > 0);
              if (headingTexts.length > 0) {
                allTexts.push(headingTexts.join(" "));
              }
            }
            const emphasisElements = document.querySelectorAll('main strong, main b, main em, main i, main mark, main dfn, main cite, main kbd, main code, article strong, article b, article em, article i, article mark, article dfn, article cite, article kbd, article code, [role="main"] strong, [role="main"] b, [role="main"] em, [role="main"] i, [role="main"] mark, [role="main"] dfn, [role="main"] cite, [role="main"] kbd, [role="main"] code, .main strong, .main b, .main em, .main i, .main mark, .main dfn, .main cite, .main kbd, .main code, .content strong, .content b, .content em, .content i, .content mark, .content dfn, .content cite, .content kbd, .content code');
            if (emphasisElements.length > 0) {
              const emphasisTexts = Array.from(emphasisElements).slice(0, 60).map((el) => extractElementText(el)).filter((t) => t.length > 0);
              if (emphasisTexts.length > 0) {
                allTexts.push(emphasisTexts.join(" "));
              }
            }
            const definitionTerms = document.querySelectorAll('main dl dt, article dl dt, [role="main"] dl dt, .main dl dt, .content dl dt');
            if (definitionTerms.length > 0) {
              const dtTexts = Array.from(definitionTerms).slice(0, 40).map((dt) => extractElementText(dt)).filter((t) => t.length > 0);
              if (dtTexts.length > 0) {
                allTexts.push(dtTexts.join(" "));
              }
            }
            const tableHeaders = document.querySelectorAll('main th, main caption, article th, article caption, [role="main"] th, [role="main"] caption, .main th, .main caption, .content th, .content caption');
            if (tableHeaders.length > 0) {
              const thTexts = Array.from(tableHeaders).slice(0, 40).map((th) => extractElementText(th)).filter((t) => t.length > 0);
              if (thTexts.length > 0) {
                allTexts.push(thTexts.join(" "));
              }
            }
            const nav = document.querySelector("nav") || document.querySelector("header nav") || document.querySelector('[role="navigation"]');
            if (nav) {
              const navLinks = nav.querySelectorAll("a");
              const navTexts = Array.from(navLinks).slice(0, 40).map((link) => extractElementText(link)).filter((t) => t.length > 0);
              if (navTexts.length > 0) {
                allTexts.push(navTexts.join(" "));
              }
            }
            const breadcrumb = document.querySelector('[aria-label*="breadcrumb" i], .breadcrumb, nav[aria-label*="breadcrumb" i], [itemtype*="BreadcrumbList"]');
            if (breadcrumb) {
              const breadcrumbLinks = breadcrumb.querySelectorAll('a, [itemprop="name"]');
              const breadcrumbTexts = Array.from(breadcrumbLinks).map((link) => extractElementText(link)).filter((t) => t.length > 0);
              if (breadcrumbTexts.length > 0) {
                allTexts.push(breadcrumbTexts.join(" "));
              }
            }
            const mainImages = document.querySelectorAll('main img, article img, [role="main"] img, .main img, .content img');
            if (mainImages.length > 0) {
              const imageAlts = Array.from(mainImages).slice(0, 10).map((img) => img.alt || "").filter((alt) => alt.length > 0);
              if (imageAlts.length > 0) {
                allTexts.push(imageAlts.join(" "));
              }
            }
            const mainLinks = document.querySelectorAll('main a, article a, [role="main"] a, .main a, .content a');
            if (mainLinks.length > 0) {
              const linkTexts = Array.from(mainLinks).slice(0, 20).map((link) => extractElementText(link)).filter((t) => t.length > 0);
              if (linkTexts.length > 0) {
                allTexts.push(linkTexts.join(" "));
              }
            }
            if (allTexts.length === 0 && document.body && document.body.innerText) {
              const bodyText = (document.body.innerText || "").trim();
              if (bodyText.length > 0) {
                allTexts.push(bodyText.slice(0, 5e3));
              }
            }
            if (allTexts.length === 0) return [];
            const allText = allTexts.join(" ");
            const words = allText.split(/[\s\.,;:!?\-_\(\)\[\]{}"']+/).filter((word) => word.length > 0);
            const noiseWords = /* @__PURE__ */ new Set([
              "a",
              "an",
              "and",
              "are",
              "as",
              "at",
              "be",
              "by",
              "for",
              "from",
              "has",
              "he",
              "in",
              "is",
              "it",
              "its",
              "of",
              "on",
              "that",
              "the",
              "to",
              "was",
              "will",
              "with",
              "this",
              "but",
              "they",
              "have",
              "had",
              "what",
              "said",
              "each",
              "which",
              "their",
              "time",
              "if",
              "up",
              "out",
              "many",
              "then",
              "them",
              "these",
              "so",
              "some",
              "her",
              "would",
              "make",
              "like",
              "into",
              "him",
              "two",
              "more",
              "very",
              "after",
              "words",
              "long",
              "than",
              "first",
              "been",
              "call",
              "who",
              "oil",
              "sit",
              "now",
              "find",
              "down",
              "day",
              "did",
              "get",
              "come",
              "made",
              "may",
              "part",
              "over",
              "new",
              "sound",
              "take",
              "only",
              "little",
              "work",
              "know",
              "place",
              "year",
              "live",
              "me",
              "back",
              "give",
              "most",
              "thing",
              "our",
              "just",
              "name",
              "good",
              "sentence",
              "man",
              "think",
              "say",
              "great",
              "where",
              "help",
              "through",
              "much",
              "before",
              "line",
              "right",
              "too",
              "mean",
              "old",
              "any",
              "same",
              "tell",
              "boy",
              "follow",
              "came",
              "want",
              "show",
              "also",
              "around",
              "form",
              "three",
              "small",
              "set",
              "put",
              "end",
              "does",
              "another",
              "well",
              "large",
              "must",
              "big",
              "even",
              "such",
              "because",
              "turn",
              "here",
              "why",
              "ask",
              "went",
              "men",
              "read",
              "need",
              "land",
              "different",
              "home",
              "us",
              "move",
              "try",
              "kind",
              "hand",
              "picture",
              "again",
              "change",
              "off",
              "play",
              "spell",
              "air",
              "away",
              "animal",
              "house",
              "point",
              "page",
              "letter",
              "mother",
              "answer",
              "found",
              "study",
              "still",
              "learn",
              "should",
              "america",
              "world",
              "high",
              "every",
              "near",
              "add",
              "food",
              "between",
              "own",
              "below",
              "country",
              "plant",
              "last",
              "school",
              "father",
              "keep",
              "tree",
              "never",
              "start",
              "city",
              "earth",
              "eye",
              "light",
              "thought",
              "head",
              "under",
              "story",
              "saw",
              "left",
              "don't",
              "few",
              "while",
              "along",
              "might",
              "close",
              "something",
              "seem",
              "next",
              "hard",
              "open",
              "example",
              "begin",
              "life",
              "always",
              "those",
              "both",
              "paper",
              "together",
              "got",
              "group",
              "often",
              "run",
              "important",
              "until",
              "children",
              "side",
              "feet",
              "car",
              "mile",
              "night",
              "walk",
              "white",
              "sea",
              "began",
              "grow",
              "took",
              "river",
              "four",
              "carry",
              "state",
              "once",
              "book",
              "hear",
              "stop",
              "without",
              "second",
              "later",
              "miss",
              "idea",
              "enough",
              "eat",
              "face",
              "watch",
              "far",
              "indian",
              "really",
              "almost",
              "let",
              "above",
              "girl",
              "sometimes",
              "mountain",
              "cut",
              "young",
              "talk",
              "soon",
              "list",
              "song",
              "leave",
              "family",
              "it's"
            ]);
            const wordFrequency = /* @__PURE__ */ new Map();
            const originalCaseMap = /* @__PURE__ */ new Map();
            words.forEach((word) => {
              const trimmed = word.trim();
              if (trimmed.length === 0) return;
              const lowerWord = trimmed.toLowerCase();
              const maxTagLen = 50;
              if (trimmed.length >= 2 && trimmed.length <= maxTagLen && !noiseWords.has(lowerWord) && !/^\d+$/.test(trimmed)) {
                const count = wordFrequency.get(lowerWord) || 0;
                wordFrequency.set(lowerWord, count + 1);
                if (!originalCaseMap.has(lowerWord)) {
                  originalCaseMap.set(lowerWord, trimmed);
                }
              }
            });
            const tagsWithVersions = [];
            const seenLowercase = /* @__PURE__ */ new Set();
            const sortedEntries = Array.from(wordFrequency.entries()).sort((a, b) => {
              if (b[1] !== a[1]) {
                return b[1] - a[1];
              }
              return a[0].localeCompare(b[0]);
            });
            for (const [lowerWord, frequency] of sortedEntries) {
              const originalCase = originalCaseMap.get(lowerWord) || lowerWord;
              tagsWithVersions.push({ tag: originalCase, lowerTag: lowerWord, frequency });
              if (originalCase !== lowerWord && !seenLowercase.has(lowerWord)) {
                tagsWithVersions.push({ tag: lowerWord, lowerTag: lowerWord, frequency });
                seenLowercase.add(lowerWord);
              } else if (originalCase === lowerWord) {
                seenLowercase.add(lowerWord);
              }
            }
            tagsWithVersions.sort((a, b) => {
              if (b.frequency !== a.frequency) {
                return b.frequency - a.frequency;
              }
              return a.lowerTag.localeCompare(b.lowerTag);
            });
            const sortedWords = tagsWithVersions.slice(0, 60).map((item) => item.tag);
            const sanitizedTags = sortedWords.map((word) => word.replace(/[^a-zA-Z0-9_-]/g, "").substring(0, 50)).filter((tag) => tag !== null && tag.length > 0);
            const uniqueTags = [];
            const seenExact = /* @__PURE__ */ new Set();
            for (const tag of sanitizedTags) {
              if (!seenExact.has(tag)) {
                uniqueTags.push(tag);
                seenExact.add(tag);
              }
            }
            return uniqueTags.slice(0, 60);
          }
        });
        if (results && results[0] && results[0].result) {
          const suggestedTags = results[0].result;
          const currentTags = this.normalizeTags(this.currentPin?.tags || []);
          const currentTagsLower = new Set(currentTags.map((t) => t.toLowerCase()));
          const filteredSuggestedTags = suggestedTags.filter(
            (tag) => tag && !currentTagsLower.has(tag.toLowerCase())
          );
          debugLog("[POPUP-CONTROLLER] [REQ-SUGGESTED_TAGS_FROM_CONTENT] Extracted suggested tags:", filteredSuggestedTags);
          this.uiManager.updateSuggestedTags(filteredSuggestedTags);
        } else {
          debugLog("[POPUP-CONTROLLER] [REQ-SUGGESTED_TAGS_FROM_CONTENT] No suggested tags extracted");
          this.uiManager.updateSuggestedTags([]);
        }
      } catch (scriptError) {
        debugError("[POPUP-CONTROLLER] [REQ-SUGGESTED_TAGS_FROM_CONTENT] Failed to extract suggested tags:", scriptError);
        this.uiManager.updateSuggestedTags([]);
      }
    } catch (error) {
      debugError("[POPUP-CONTROLLER] [REQ-SUGGESTED_TAGS_FROM_CONTENT] Failed to load suggested tags:", error);
      this.uiManager.updateSuggestedTags([]);
    }
  }
  /**
   * [IMMUTABLE-REQ-TAG-001] - Validate tag input
   * @param {string} tag - Tag to validate
   * @returns {boolean} Whether tag is valid
   */
  isValidTag(tag) {
    if (!tag || typeof tag !== "string") {
      return false;
    }
    const trimmedTag = tag.trim();
    if (trimmedTag.length === 0 || trimmedTag.length > 50) {
      return false;
    }
    const invalidChars = /[<>]/g;
    if (invalidChars.test(trimmedTag)) {
      return false;
    }
    const safeChars = /^[\w\s.#+-]+$/;
    if (!safeChars.test(trimmedTag)) {
      return false;
    }
    return true;
  }
  /**
   * Get current active tab
   */
  async getCurrentTab() {
    debugLog("[CHROME-DEBUG-001] getCurrentTab: calling chrome.tabs.query");
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        debugLog("[CHROME-DEBUG-001] getCurrentTab: chrome.tabs.query callback", tabs, chrome.runtime.lastError);
        if (chrome.runtime.lastError) {
          debugError("[CHROME-DEBUG-001] getCurrentTab: chrome.runtime.lastError", chrome.runtime.lastError);
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (tabs && tabs.length > 0) {
          resolve(tabs[0]);
        } else {
          debugError("[CHROME-DEBUG-001] getCurrentTab: No active tab found");
          reject(new Error("No active tab found"));
        }
      });
    });
  }
  /**
   * Get bookmark data for a URL
   * [POPUP-DATA-FLOW-001] Enhanced data extraction with validation
   */
  async getBookmarkData(url) {
    debugLog("[POPUP-DATA-FLOW-001] getBookmarkData: calling chrome.runtime.sendMessage", url);
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          type: "getCurrentBookmark",
          data: { url }
        },
        (response) => {
          debugLog("[POPUP-DATA-FLOW-001] getBookmarkData: chrome.runtime.sendMessage callback", response, chrome.runtime.lastError);
          if (chrome.runtime.lastError) {
            debugError("[POPUP-DATA-FLOW-001] getBookmarkData: chrome.runtime.lastError", chrome.runtime.lastError);
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          if (response && response.success) {
            debugLog("[POPUP-DATA-FLOW-001] getBookmarkData: response structure:", {
              response,
              responseSuccess: response.success,
              responseData: response.data,
              responseDataType: typeof response.data,
              responseDataKeys: response.data ? Object.keys(response.data) : null,
              hasUrl: !!response.data?.url,
              hasTags: !!response.data?.tags,
              tagCount: response.data?.tags ? Array.isArray(response.data.tags) ? response.data.tags.length : "not-array" : 0
            });
            const bookmarkData = response.data;
            if (bookmarkData?.blocked) {
              debugLog("[POPUP-DATA-FLOW-001] getBookmarkData: URL blocked", bookmarkData);
              resolve(null);
              return;
            }
            const isValid = this.validateBookmarkData(bookmarkData);
            if (!isValid) {
              debugLog("[POPUP-DATA-FLOW-001] getBookmarkData: Invalid bookmark data structure, treating as no bookmark", bookmarkData);
              resolve(null);
              return;
            }
            const extractedData = bookmarkData?.data || bookmarkData;
            debugLog("[POPUP-DATA-FLOW-001] getBookmarkData: extracted and validated bookmark data:", extractedData);
            resolve(extractedData);
          } else {
            debugError("[POPUP-DATA-FLOW-001] getBookmarkData: Failed to get bookmark data", response);
            reject(new Error(response?.error || "Failed to get bookmark data"));
          }
        }
      );
    });
  }
  /**
   * [REQ-MOVE_BOOKMARK_STORAGE_UI] [REQ-STORAGE_MODE_DEFAULT] Get the storage backend currently selected in the popup UI (highlighted button).
   * Used so save follows the highlight when creating or updating a bookmark.
   * @returns {string|null} 'pinboard'|'local'|'file'|'sync' or null if not determinable
   */
  getSelectedStorageBackend() {
    const btn = this.uiManager.elements.storageBackendButtons?.querySelector('.storage-backend-btn[aria-pressed="true"]');
    const backend = btn?.getAttribute("data-backend") || null;
    return backend && ["pinboard", "local", "file", "sync"].includes(backend) ? backend : null;
  }
  /**
   * [REQ-MOVE_BOOKMARK_STORAGE_UI] [IMPL-MOVE_BOOKMARK_UI] Get storage backend for URL (pinboard | local | file | sync).
   */
  async getStorageBackendForUrl(url) {
    if (!url || typeof chrome?.runtime?.sendMessage !== "function") return "local";
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { type: "getStorageBackendForUrl", data: { url } },
        (response) => {
          if (chrome.runtime.lastError || response === void 0) {
            resolve("local");
            return;
          }
          const backend = response?.data ?? response;
          resolve(typeof backend === "string" ? backend : "local");
        }
      );
    });
  }
  /**
   * [REQ-MOVE_BOOKMARK_STORAGE_UI] [IMPL-MOVE_BOOKMARK_UI] [IMPL-MOVE_BOOKMARK_RESPONSE_AND_URL] Move current bookmark to target storage backend.
   */
  async handleStorageBackendChange(targetBackend) {
    recordAction(POPUP_ACTION_IDS.storageBackendChange, { targetBackend }, "popup");
    if (this._onAction) this._onAction({ actionId: POPUP_ACTION_IDS.storageBackendChange, payload: { targetBackend } });
    const url = this.currentPin?.url || this.currentTab?.url;
    if (!url) return;
    try {
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          { type: "moveBookmarkToStorage", data: { url, targetBackend } },
          (r) => chrome.runtime.lastError ? reject(new Error(chrome.runtime.lastError.message)) : resolve(r)
        );
      });
      const result = response?.data ?? response;
      if (result?.success) {
        this.uiManager.showSuccess("Bookmark moved to " + targetBackend);
        const updated = await this.getBookmarkData(this.currentTab?.url || url);
        this.currentPin = updated;
        this.stateManager.setState({ currentPin: this.currentPin });
        this.uiManager.updateStorageBackendValue(targetBackend);
        this.uiManager.updateStorageLocalToggle(targetBackend, true);
        this.uiManager.updatePrivateStatus(this.currentPin?.shared === "no");
        this.uiManager.updateReadLaterStatus(this.currentPin?.toread === "yes");
        this.uiManager.updateCurrentTags(this.normalizeTags(this.currentPin?.tags));
      } else {
        this.uiManager.showError(result?.message || "Move failed");
      }
    } catch (e) {
      debugError("[IMPL-MOVE_BOOKMARK_UI] handleStorageBackendChange failed:", e);
      this.uiManager.showError(e.message || "Move failed");
    }
  }
  /**
   * [POPUP-DEBUG-001] Validate bookmark data structure
   * @param {Object} bookmarkData - Bookmark data to validate
   * @returns {boolean} Whether the data is valid
   */
  validateBookmarkData(bookmarkData) {
    if (bookmarkData === null || bookmarkData === void 0) {
      return false;
    }
    const data = bookmarkData?.data || bookmarkData;
    if (!data || typeof data !== "object" || !data.url) {
      debugLog("[POPUP-DEBUG-001] Bookmark data validation: missing url or invalid object");
      return false;
    }
    if (!Array.isArray(data.tags)) {
      data.tags = data.tags == null ? [] : typeof data.tags === "string" ? data.tags.split(/\s+/).filter((t) => t.trim()) : [];
    }
    const isValid = true;
    debugLog("[POPUP-DEBUG-001] Bookmark data validation:", {
      isValid,
      hasUrl: !!data?.url,
      hasTags: Array.isArray(data?.tags),
      tagCount: data?.tags?.length || 0,
      hasDescription: !!data?.description,
      hasShared: data?.shared !== void 0,
      hasToread: data?.toread !== void 0,
      dataStructure: {
        hasDataProperty: !!bookmarkData?.data,
        directData: !!bookmarkData?.url,
        dataKeys: data ? Object.keys(data) : null
      }
    });
    return isValid;
  }
  /**
   * Send message to background script
   */
  async sendMessage(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (response && response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response?.error || "Request failed"));
        }
      });
    });
  }
  /**
   * Send message to content script in current tab
   */
  async sendToTab(message) {
    if (!this.currentTab) {
      throw new Error("No current tab available");
    }
    if (!this.canInjectIntoTab(this.currentTab)) {
      throw new Error("Cannot inject into this tab");
    }
    const timeoutMs = this.tabMessageTimeoutMs ?? 2e3;
    return new Promise((resolve, reject) => {
      let settled = false;
      const startTimer = () => setTimeout(() => {
        if (settled) {
          return;
        }
        settled = true;
        debugError("[IMPL-POPUP_MESSAGE_TIMEOUT] sendToTab timed out", {
          timeoutMs,
          messageType: message?.type
        });
        reject(new Error("Timed out waiting for tab response"));
      }, timeoutMs);
      let timerId = startTimer();
      const refreshTimer = () => {
        if (settled) {
          return;
        }
        clearTimeout(timerId);
        timerId = startTimer();
      };
      const resolveOnce = (value) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timerId);
        resolve(value);
      };
      const rejectOnce = (error) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timerId);
        reject(error);
      };
      const handleResponse = (response) => {
        if (chrome.runtime.lastError) {
          if (chrome.runtime.lastError.message.includes("Receiving end does not exist")) {
            debugLog("Content script not found, attempting injection...");
            refreshTimer();
            this.injectContentScript(this.currentTab.id).then(() => {
              debugLog("Content script injected, waiting for initialization...");
              refreshTimer();
              setTimeout(() => {
                if (settled) {
                  return;
                }
                refreshTimer();
                chrome.tabs.sendMessage(this.currentTab.id, message, (retryResponse) => {
                  if (chrome.runtime.lastError) {
                    debugError("Retry failed, trying fallback injection:", chrome.runtime.lastError.message);
                    refreshTimer();
                    this.injectFallbackContentScript(this.currentTab.id).then(() => {
                      setTimeout(() => {
                        if (settled) {
                          return;
                        }
                        refreshTimer();
                        chrome.tabs.sendMessage(this.currentTab.id, message, (fallbackResponse) => {
                          if (chrome.runtime.lastError) {
                            debugError("Fallback also failed:", chrome.runtime.lastError.message);
                            rejectOnce(new Error(chrome.runtime.lastError.message));
                            return;
                          }
                          debugLog("Message sent successfully after fallback injection");
                          resolveOnce(fallbackResponse);
                        });
                      }, 500);
                    }).catch((fallbackError) => {
                      debugError("Fallback injection failed:", fallbackError);
                      rejectOnce(new Error(`Both injection methods failed: ${fallbackError.message}`));
                    });
                    return;
                  }
                  debugLog("Message sent successfully after injection");
                  resolveOnce(retryResponse);
                });
              }, 1e3);
            }).catch((error) => {
              debugError("Content script injection failed:", error);
              rejectOnce(new Error(`Failed to inject content script: ${error.message}`));
            });
            return;
          }
          rejectOnce(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolveOnce(response);
      };
      const sendMessageWithTimeout = () => {
        refreshTimer();
        let maybePromise;
        try {
          maybePromise = chrome.tabs.sendMessage(this.currentTab.id, message, handleResponse);
        } catch (error) {
          rejectOnce(error instanceof Error ? error : new Error(String(error)));
          return;
        }
        if (maybePromise && typeof maybePromise.then === "function") {
          maybePromise.then((response) => {
            handleResponse(response);
          }).catch((error) => {
            debugError("[IMPL-POPUP_MESSAGE_TIMEOUT] Promise-based sendMessage failed", error);
            rejectOnce(error instanceof Error ? error : new Error(String(error)));
          });
        }
      };
      sendMessageWithTimeout();
    });
  }
  /**
   * Check if we can inject into a tab
   */
  canInjectIntoTab(tab) {
    return tab.url && !tab.url.startsWith("chrome://") && !tab.url.startsWith("chrome-extension://") && !tab.url.startsWith("edge://") && !tab.url.startsWith("about:");
  }
  /**
   * Inject content script into tab
   */
  async injectContentScript(tabId) {
    try {
      debugLog("Injecting content script into tab:", tabId);
      await chrome.scripting.insertCSS({
        target: { tabId },
        files: ["src/features/content/overlay-styles.css"]
      });
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        files: ["src/features/content/content-main.js"]
      });
      debugLog("Content script injection completed:", results);
      return results;
    } catch (error) {
      debugError("Content script injection error:", error);
      throw error;
    }
  }
  /**
   * Inject fallback content script that doesn't use ES6 modules
   */
  async injectFallbackContentScript(tabId) {
    try {
      debugLog("Injecting fallback content script into tab:", tabId);
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          if (!window.hoverboardInjected) {
            window.hoverboardInjected = true;
            async function refreshOverlay() {
              try {
                const response = await new Promise((resolve) => {
                  chrome.runtime.sendMessage({
                    type: "getBookmark",
                    data: { url: window.location.href }
                  }, resolve);
                });
                if (response && response.success && response.bookmark) {
                  const existingOverlay = document.getElementById("hoverboard-overlay");
                  if (existingOverlay) {
                    existingOverlay.remove();
                  }
                  chrome.runtime.sendMessage({
                    type: "showHoverboard",
                    data: { url: window.location.href }
                  });
                }
              } catch (error) {
                debugError("Failed to refresh overlay:", error);
              }
            }
            chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
              debugLog("Hoverboard content script received message:", message);
              if (message.type === "TOGGLE_HOVER") {
                let overlay = document.getElementById("hoverboard-overlay");
                if (overlay) {
                  overlay.remove();
                  sendResponse({ success: true, action: "hidden" });
                } else {
                  const { bookmark, tab } = message.data || {};
                  overlay = document.createElement("div");
                  overlay.id = "hoverboard-overlay";
                  overlay.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    width: 400px;
                    max-height: 80vh;
                    background: rgba(255,255,255,0.95);
                    border: 2px solid #90ee90;
                    border-radius: 8px;
                    padding: 0;
                    z-index: 2147483647;
                    font-family: 'Futura PT', system-ui, -apple-system, sans-serif;
                    font-size: 14px;
                    color: black;
                    font-weight: 600;
                    overflow-y: auto;
                    cursor: pointer;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                  `;
                  const mainContainer = document.createElement("div");
                  mainContainer.style.cssText = "padding: 8px;";
                  const siteTagsContainer = document.createElement("div");
                  siteTagsContainer.className = "scrollmenu";
                  siteTagsContainer.style.cssText = `
                    margin-bottom: 8px;
                    padding: 4px;
                    background: white;
                    border-radius: 4px;
                  `;
                  const closeBtn = document.createElement("span");
                  closeBtn.className = "tiny";
                  closeBtn.innerHTML = "\u2715";
                  closeBtn.style.cssText = `
                    float: right;
                    cursor: pointer;
                    padding: 0.2em 0.5em;
                    color: red;
                    font-weight: 900;
                    background: rgba(255,255,255,0.8);
                    border-radius: 3px;
                    margin: 2px;
                  `;
                  closeBtn.onclick = () => overlay.remove();
                  siteTagsContainer.appendChild(closeBtn);
                  const currentLabel = document.createElement("span");
                  currentLabel.className = "tiny";
                  currentLabel.textContent = "Current:";
                  currentLabel.style.cssText = "padding: 0.2em 0.5em; margin-right: 4px;";
                  siteTagsContainer.appendChild(currentLabel);
                  const currentTags = bookmark?.tags ? Array.isArray(bookmark.tags) ? bookmark.tags : bookmark.tags.split(" ").filter((t) => t) : [];
                  currentTags.forEach((tag) => {
                    const tagElement = document.createElement("span");
                    tagElement.className = "tiny iconTagDeleteInactive";
                    tagElement.textContent = tag;
                    tagElement.style.cssText = `
                      padding: 0.2em 0.5em;
                      margin: 2px;
                      background: #f0f8f0;
                      border-radius: 3px;
                      cursor: pointer;
                      color: #90ee90;
                    `;
                    tagElement.title = "Double-click to remove";
                    tagElement.ondblclick = async () => {
                      if (confirm(`Delete tag "${tag}"?`)) {
                        chrome.runtime.sendMessage({
                          type: "deleteTag",
                          data: {
                            url: window.location.href,
                            value: tag,
                            ...bookmark
                          }
                        });
                        setTimeout(() => {
                          refreshOverlay();
                        }, 500);
                      }
                    };
                    siteTagsContainer.appendChild(tagElement);
                  });
                  const tagInput = document.createElement("input");
                  tagInput.className = "tag-input";
                  tagInput.placeholder = "New Tag";
                  tagInput.style.cssText = `
                    margin: 2px;
                    padding: 2px !important;
                    font-size: 12px;
                    width: 80px;
                    border: 1px solid #ccc;
                    border-radius: 3px;
                  `;
                  tagInput.addEventListener("keypress", async (e) => {
                    if (e.key === "Enter") {
                      const tagText = tagInput.value.trim();
                      if (tagText && !currentTags.includes(tagText)) {
                        chrome.runtime.sendMessage({
                          type: "saveTag",
                          data: {
                            url: window.location.href,
                            value: tagText,
                            ...bookmark
                          }
                        });
                        tagInput.value = "";
                        setTimeout(() => {
                          refreshOverlay();
                        }, 500);
                      }
                    }
                  });
                  siteTagsContainer.appendChild(tagInput);
                  const recentContainer = document.createElement("div");
                  recentContainer.className = "scrollmenu";
                  recentContainer.style.cssText = `
                    margin-bottom: 8px;
                    padding: 4px;
                    background: #f9f9f9;
                    border-radius: 4px;
                    font-size: smaller;
                    font-weight: 900;
                    color: green;
                  `;
                  const recentLabel = document.createElement("span");
                  recentLabel.className = "tiny";
                  recentLabel.textContent = "Recent:";
                  recentLabel.style.cssText = "padding: 0.2em 0.5em; margin-right: 4px;";
                  recentContainer.appendChild(recentLabel);
                  const sampleRecentTags = ["javascript", "development", "web", "tutorial", "reference", "programming", "tools", "documentation"];
                  sampleRecentTags.slice(0, 5).forEach((tag) => {
                    if (!currentTags.includes(tag)) {
                      const tagElement = document.createElement("span");
                      tagElement.className = "tiny";
                      tagElement.textContent = tag;
                      tagElement.style.cssText = `
                        padding: 0.2em 0.5em;
                        margin: 2px;
                        background: #f0f8f0;
                        border-radius: 3px;
                        cursor: pointer;
                        color: green;
                      `;
                      tagElement.onclick = async () => {
                        if (!currentTags.includes(tag)) {
                          chrome.runtime.sendMessage({
                            type: "saveTag",
                            data: {
                              url: window.location.href,
                              value: tag,
                              ...bookmark
                            }
                          });
                          setTimeout(() => {
                            refreshOverlay();
                          }, 500);
                        }
                      };
                      recentContainer.appendChild(tagElement);
                    }
                  });
                  const actionsContainer = document.createElement("div");
                  actionsContainer.style.cssText = `
                    padding: 4px;
                    background: white;
                    border-radius: 4px;
                    text-align: center;
                  `;
                  const isPrivate = bookmark?.shared === "no";
                  const privateBtn = document.createElement("button");
                  privateBtn.style.cssText = `
                    margin: 2px;
                    padding: 4px 8px;
                    font-size: 12px;
                    border: 1px solid #ccc;
                    border-radius: 3px;
                    background: ${isPrivate ? "#ffeeee" : "#eeffee"};
                    cursor: pointer;
                    font-weight: 600;
                  `;
                  privateBtn.textContent = isPrivate ? "\u{1F512} Private" : "\u{1F310} Public";
                  privateBtn.onclick = async () => {
                    chrome.runtime.sendMessage({
                      type: "saveBookmark",
                      data: {
                        ...bookmark,
                        url: window.location.href,
                        shared: isPrivate ? "yes" : "no"
                      }
                    });
                    setTimeout(() => {
                      refreshOverlay();
                    }, 500);
                  };
                  const isToRead = bookmark?.toread === "yes";
                  const readBtn = document.createElement("button");
                  readBtn.style.cssText = `
                    margin: 2px;
                    padding: 4px 8px;
                    font-size: 12px;
                    border: 1px solid #ccc;
                    border-radius: 3px;
                    background: ${isToRead ? "#ffffee" : "#eeeeff"};
                    cursor: pointer;
                    font-weight: 600;
                  `;
                  readBtn.textContent = isToRead ? "\u{1F4D6} Read Later" : "\u{1F4CB} Not marked";
                  readBtn.onclick = async () => {
                    chrome.runtime.sendMessage({
                      type: "saveBookmark",
                      data: {
                        ...bookmark,
                        url: window.location.href,
                        toread: isToRead ? "no" : "yes"
                      }
                    });
                    setTimeout(() => {
                      refreshOverlay();
                    }, 500);
                  };
                  actionsContainer.appendChild(privateBtn);
                  actionsContainer.appendChild(readBtn);
                  const pageInfo = document.createElement("div");
                  pageInfo.style.cssText = `
                    padding: 4px;
                    font-size: 11px;
                    color: #666;
                    background: #f9f9f9;
                    border-radius: 4px;
                    margin-top: 4px;
                    word-break: break-all;
                  `;
                  pageInfo.innerHTML = `
                    <div style="font-weight: bold; margin-bottom: 2px;">
                      ${bookmark?.description || document.title}
                    </div>
                    <div>${window.location.href}</div>
                  `;
                  mainContainer.appendChild(siteTagsContainer);
                  mainContainer.appendChild(recentContainer);
                  mainContainer.appendChild(actionsContainer);
                  mainContainer.appendChild(pageInfo);
                  overlay.appendChild(mainContainer);
                  document.body.appendChild(overlay);
                  sendResponse({ success: true, action: "shown" });
                }
              }
              return true;
            });
          }
        }
      });
      debugLog("Fallback content script injection completed:", results);
      return results;
    } catch (error) {
      debugError("Fallback content script injection error:", error);
      throw error;
    }
  }
  /**
   * Set loading state
   */
  setLoading(isLoading) {
    this.isLoading = isLoading;
    this.uiManager.setLoading(isLoading);
    if (this._onStateChange) {
      this._onStateChange({ screen: isLoading ? "loading" : "mainInterface", state: { bookmark: this.currentPin } });
    }
  }
  /**
   * Handle show/hide hoverboard action
   */
  /**
   * [POPUP-CLOSE-BEHAVIOR-004] Handle show/hide hoverboard action
   * Modified to NOT close popup after toggling overlay visibility
   */
  async handleShowHoverboard() {
    recordAction(POPUP_ACTION_IDS.showHoverboard, { tabId: this.currentTab?.id }, "popup");
    if (this._onAction) this._onAction({ actionId: POPUP_ACTION_IDS.showHoverboard, payload: { tabId: this.currentTab?.id } });
    try {
      if (!this.canInjectIntoTab(this.currentTab)) {
        this.uiManager.showError("Hoverboard is not available on this page (e.g., Chrome Web Store, New Tab, or Settings).");
        return;
      }
      const toggleResponse = await this.sendToTab({
        type: "TOGGLE_HOVER",
        data: {
          bookmark: this.currentPin,
          tab: this.currentTab
        }
      });
      if (toggleResponse && toggleResponse.data) {
        this.uiManager.updateShowHoverButtonState(toggleResponse.data.isVisible);
        debugLog("[POPUP-CLOSE-BEHAVIOR-ARCH-004] Updated UI with toggle response:", toggleResponse.data);
      } else {
        await this.updateOverlayState();
      }
    } catch (error) {
      debugError("Show hoverboard error:", error);
      this.errorHandler.handleError("Failed to toggle hoverboard", error);
    }
  }
  /**
   * Handle toggle private status
   */
  async handleTogglePrivate() {
    recordAction(POPUP_ACTION_IDS.togglePrivate, { hasBookmark: !!this.currentPin }, "popup");
    if (this._onAction) this._onAction({ actionId: POPUP_ACTION_IDS.togglePrivate, payload: { hasBookmark: !!this.currentPin } });
    try {
      this.setLoading(true);
      if (this.currentPin) {
        const isPrivate = this.currentPin.shared === "no";
        const newSharedStatus = isPrivate ? "yes" : "no";
        const updatedPin = {
          ...this.currentPin,
          shared: newSharedStatus
        };
        const preferredBackendToggle = this.getSelectedStorageBackend();
        if (preferredBackendToggle) updatedPin.preferredBackend = preferredBackendToggle;
        const response = await this.sendMessage({
          type: "saveBookmark",
          data: updatedPin
        });
        this.currentPin.shared = newSharedStatus;
        this.stateManager.setState({ currentPin: this.currentPin });
        this.uiManager.updatePrivateStatus(newSharedStatus === "no");
        this.uiManager.showSuccess(`Bookmark is now ${isPrivate ? "public" : "private"}`);
        try {
          await this.sendToTab({
            type: "BOOKMARK_UPDATED",
            data: updatedPin
          });
        } catch (error) {
          debugError("[TOGGLE-SYNC-POPUP-001] Failed to notify overlay:", error);
        }
      } else {
        await this.createBookmark([], "yes");
        this.uiManager.updatePrivateStatus(true);
        this.uiManager.showSuccess("Bookmark created as private");
      }
    } catch (error) {
      this.errorHandler.handleError("Failed to toggle private status", error);
    } finally {
      this.setLoading(false);
    }
  }
  /**
   * Handle read later action - toggles the toread attribute
   */
  async handleReadLater() {
    recordAction(POPUP_ACTION_IDS.readLater, { hasBookmark: !!this.currentPin }, "popup");
    if (this._onAction) this._onAction({ actionId: POPUP_ACTION_IDS.readLater, payload: { hasBookmark: !!this.currentPin } });
    try {
      this.setLoading(true);
      if (this.currentPin) {
        const isCurrentlyToRead = this.currentPin.toread === "yes";
        const newToReadStatus = isCurrentlyToRead ? "no" : "yes";
        const updatedPin = {
          ...this.currentPin,
          toread: newToReadStatus,
          description: this.getBetterDescription(this.currentPin?.description, this.currentTab?.title)
        };
        const preferredBackendRead = this.getSelectedStorageBackend();
        if (preferredBackendRead) updatedPin.preferredBackend = preferredBackendRead;
        const response = await this.sendMessage({
          type: "saveBookmark",
          data: updatedPin
        });
        this.currentPin.toread = newToReadStatus;
        this.stateManager.setState({ currentPin: this.currentPin });
        this.uiManager.updateReadLaterStatus(newToReadStatus === "yes");
        const statusMessage = newToReadStatus === "yes" ? "Added to read later" : "Removed from read later";
        this.uiManager.showSuccess(statusMessage);
        try {
          await this.sendToTab({
            type: "BOOKMARK_UPDATED",
            data: updatedPin
          });
        } catch (error) {
          debugError("[TOGGLE-SYNC-POPUP-001] Failed to notify overlay:", error);
        }
      } else {
        await this.createBookmark([], "yes", "yes");
        this.uiManager.updateReadLaterStatus(true);
        this.uiManager.showSuccess("Bookmark created and added to read later");
      }
    } catch (error) {
      this.errorHandler.handleError("Failed to toggle read later status", error);
    } finally {
      this.setLoading(false);
    }
  }
  /**
   * Handle add tag action
   * [IMMUTABLE-REQ-TAG-003] - Enhanced with user-driven recent tags tracking
   */
  async handleAddTag(tagText) {
    recordAction(POPUP_ACTION_IDS.addTag, { tag: tagText }, "popup");
    if (this._onAction) this._onAction({ actionId: POPUP_ACTION_IDS.addTag, payload: { tag: tagText } });
    if (!tagText || !tagText.trim()) {
      this.errorHandler.handleError("Please enter a tag");
      return;
    }
    try {
      this.setLoading(true);
      const newTags = tagText.trim().split(/\s+/).filter((tag) => tag.length > 0);
      for (const tag of newTags) {
        if (!this.isValidTag(tag)) {
          this.errorHandler.handleError(`Invalid tag: ${tag}`);
          return;
        }
      }
      if (this.currentPin) {
        const url = this.currentTab?.url || this.currentPin?.url;
        let currentTagsArray = this.normalizeTags(this.currentPin.tags);
        if (url) {
          try {
            const fresh = await this.getBookmarkData(url);
            if (fresh && (fresh.tags?.length || this.currentPin?.tags?.length)) {
              currentTagsArray = this.normalizeTags(fresh.tags);
            }
          } catch (e) {
            debugError("[IMPL-URL_TAGS_DISPLAY] getBookmarkData before add tag failed, using currentPin", e);
          }
        }
        const allTags = [.../* @__PURE__ */ new Set([...currentTagsArray, ...newTags])];
        await this.addTagsToBookmark(allTags);
      } else {
        await this.createBookmark(newTags);
      }
      for (const tag of newTags) {
        try {
          await this.sendMessage({
            type: "addTagToRecent",
            data: {
              tagName: tag,
              currentSiteUrl: this.currentTab?.url
            }
          });
        } catch (error) {
          debugError("[POPUP-CONTROLLER] [IMMUTABLE-REQ-TAG-003] Failed to track tag addition:", error);
        }
      }
      this.uiManager.clearTagInput();
      await this.loadRecentTags();
    } catch (error) {
      this.errorHandler.handleError("Failed to add tags", error);
      if (this.currentPin) {
        const currentTagsArray = this.normalizeTags(this.currentPin.tags);
        this.uiManager.updateCurrentTags(currentTagsArray);
      }
      await this.loadRecentTags();
    } finally {
      this.setLoading(false);
    }
  }
  /**
   * Handle remove tag action
   */
  async handleRemoveTag(tagToRemove) {
    recordAction(POPUP_ACTION_IDS.removeTag, { tag: tagToRemove }, "popup");
    if (this._onAction) this._onAction({ actionId: POPUP_ACTION_IDS.removeTag, payload: { tag: tagToRemove } });
    if (!this.currentPin) {
      this.errorHandler.handleError("No bookmark found");
      return;
    }
    try {
      this.setLoading(true);
      const url = this.currentTab?.url || this.currentPin?.url;
      let currentTagsArray = this.normalizeTags(this.currentPin.tags);
      if (url) {
        try {
          const fresh = await this.getBookmarkData(url);
          if (fresh?.tags?.length) currentTagsArray = this.normalizeTags(fresh.tags);
        } catch (e) {
          debugError("[IMPL-URL_TAGS_DISPLAY] getBookmarkData before remove tag failed", e);
        }
      }
      const tagsArray = currentTagsArray.filter((tag) => tag !== tagToRemove);
      await this.addTagsToBookmark(tagsArray);
    } catch (error) {
      this.errorHandler.handleError("Failed to remove tag", error);
    } finally {
      this.setLoading(false);
    }
  }
  /**
   * Add tags to bookmark
   * [IMMUTABLE-REQ-TAG-001] - Enhanced with tag tracking and validation
   */
  async addTagsToBookmark(tags) {
    for (const tag of tags) {
      if (!this.isValidTag(tag)) {
        this.errorHandler.handleError(`Invalid tag: ${tag}`);
        return;
      }
    }
    const tagsString = tags.join(" ");
    const pinData = {
      ...this.currentPin,
      tags: tagsString,
      description: this.getBetterDescription(this.currentPin?.description, this.currentTab?.title)
    };
    const preferredBackendTag = this.getSelectedStorageBackend();
    if (preferredBackendTag) pinData.preferredBackend = preferredBackendTag;
    const response = await this.sendMessage({
      type: "saveBookmark",
      data: pinData
    });
    this.currentPin.tags = tagsString;
    this.stateManager.setState({ currentPin: this.currentPin });
    this.uiManager.updateCurrentTags(tags);
    this.uiManager.showSuccess("Tags updated successfully");
    await this.loadRecentTags();
    await this.notifyOverlayOfTagChanges(tags);
    try {
      await this.sendToTab({
        type: "BOOKMARK_UPDATED",
        data: pinData
      });
    } catch (error) {
      debugError("[TAG-SYNC-POPUP-001] Failed to notify overlay of BOOKMARK_UPDATED after tag change:", error);
    }
  }
  /**
   * [TAG-SYNC-POPUP-001] - Notify overlay of tag changes
   * @param {string[]} tags - Array of updated tags
   */
  async notifyOverlayOfTagChanges(tags) {
    try {
      const updatedBookmark = {
        url: this.currentTab?.url,
        description: this.currentTab?.title,
        tags
      };
      await this.sendToTab({
        type: "TAG_UPDATED",
        data: updatedBookmark
      });
    } catch (error) {
      debugError("[TAG-SYNC-POPUP-001] Failed to notify overlay of TAG_UPDATED:", error);
    }
  }
  /**
   * Create new bookmark
   * [IMMUTABLE-REQ-TAG-001] - Enhanced with tag tracking and validation
   */
  async createBookmark(tags, sharedStatus = "yes", toreadStatus = "no") {
    for (const tag of tags) {
      if (!this.isValidTag(tag)) {
        this.errorHandler.handleError(`Invalid tag: ${tag}`);
        return;
      }
    }
    const tagsString = tags.join(" ");
    const pinData = {
      url: this.currentTab.url,
      description: this.currentTab.title,
      tags: tagsString,
      shared: sharedStatus,
      toread: toreadStatus
    };
    const preferredBackend = this.getSelectedStorageBackend();
    if (preferredBackend) pinData.preferredBackend = preferredBackend;
    const response = await this.sendMessage({
      type: "saveBookmark",
      data: pinData
    });
    this.currentPin = pinData;
    this.stateManager.setState({ currentPin: this.currentPin });
    this.uiManager.updateCurrentTags(tags);
    this.uiManager.showSuccess("Bookmark created successfully");
    await this.loadRecentTags();
  }
  /**
   * Handle search action - now uses tab search functionality
   */
  async handleSearch(searchText) {
    recordAction(POPUP_ACTION_IDS.search, { searchText }, "popup");
    if (this._onAction) this._onAction({ actionId: POPUP_ACTION_IDS.search, payload: { searchText } });
    debugLog("[SEARCH-UI] Starting search:", { searchText, currentTab: this.currentTab });
    if (!searchText || !searchText.trim()) {
      this.errorHandler.handleError("Please enter search terms");
      return;
    }
    if (!this.isInitialized) {
      debugLog("[SEARCH-UI] Popup not yet initialized, waiting...");
      this.errorHandler.handleError("Please wait for popup to finish loading");
      return;
    }
    if (!this.currentTab || !this.currentTab.id) {
      debugLog("[SEARCH-UI] No current tab available, attempting to get current tab");
      try {
        this.currentTab = await this.getCurrentTab();
        debugLog("[SEARCH-UI] Retrieved current tab:", this.currentTab);
      } catch (error) {
        debugError("[SEARCH-UI] Failed to get current tab:", error);
        this.errorHandler.handleError("Unable to get current tab information");
        return;
      }
    }
    if (!this.currentTab || !this.currentTab.id) {
      this.errorHandler.handleError("No current tab available");
      return;
    }
    try {
      this.setLoading(true);
      debugLog("[SEARCH-UI] Sending search message with tab ID:", this.currentTab.id);
      const response = await this.sendMessage({
        type: "searchTabs",
        data: { searchText: searchText.trim() }
      });
      debugLog("[SEARCH-UI] Received response:", response);
      if (response.success) {
        this.uiManager.showSuccess(`Found ${response.matchCount} matching tabs - navigating to "${response.tabTitle}"`);
      } else {
        this.uiManager.showError(response.message || "No matching tabs found");
      }
    } catch (error) {
      debugError("[SEARCH-UI] Search error:", error);
      this.errorHandler.handleError("Failed to search tabs", error);
    } finally {
      this.setLoading(false);
    }
  }
  /**
   * [POPUP-CLOSE-BEHAVIOR-FIX-001] Handle delete bookmark action
   * Modified to NOT close popup after deletion - popup stays open for continued interaction
   */
  async handleDeletePin() {
    recordAction(POPUP_ACTION_IDS.deletePin, { url: this.currentPin?.url }, "popup");
    if (this._onAction) this._onAction({ actionId: POPUP_ACTION_IDS.deletePin, payload: { url: this.currentPin?.url } });
    if (!this.currentPin) {
      this.errorHandler.handleError("No bookmark found to delete");
      return;
    }
    const globalConfirm = typeof globalThis !== "undefined" && typeof globalThis.confirm === "function" ? globalThis.confirm : typeof window !== "undefined" && typeof window.confirm === "function" ? window.confirm : null;
    if (globalConfirm && !globalConfirm("Are you sure you want to delete this bookmark?")) {
      return;
    }
    try {
      this.setLoading(true);
      const response = await this.sendMessage({
        type: "deleteBookmark",
        data: { url: this.currentPin.url }
      });
      this.currentPin = null;
      this.stateManager.setState({ currentPin: null });
      this.uiManager.updateCurrentTags([]);
      this.uiManager.updatePrivateStatus(false);
      this.uiManager.showSuccess("Bookmark deleted successfully");
      await this.sendToTab({ message: "refreshData" });
    } catch (error) {
      this.errorHandler.handleError("Failed to delete bookmark", error);
    } finally {
      this.setLoading(false);
    }
  }
  /**
   * [POPUP-CLOSE-BEHAVIOR-FIX-001] Handle reload extension action
   * Modified to NOT close popup after reload - popup stays open for continued interaction
   */
  async handleReloadExtension() {
    recordAction(POPUP_ACTION_IDS.reloadExtension, void 0, "popup");
    if (this._onAction) this._onAction({ actionId: POPUP_ACTION_IDS.reloadExtension, payload: void 0 });
    try {
      if (this.currentTab) {
        await chrome.tabs.reload(this.currentTab.id);
      }
      this.uiManager.showSuccess("Extension reloaded successfully");
    } catch (error) {
      this.errorHandler.handleError("Failed to reload extension", error);
    }
  }
  /**
   * [POPUP-CLOSE-BEHAVIOR-FIX-001] Handle open options action
   * Modified to NOT close popup after opening options - popup stays open for continued interaction
   */
  async handleOpenOptions() {
    recordAction(POPUP_ACTION_IDS.openOptions, void 0, "popup");
    if (this._onAction) this._onAction({ actionId: POPUP_ACTION_IDS.openOptions, payload: void 0 });
    try {
      chrome.runtime.openOptionsPage();
      this.uiManager.showSuccess("Options page opened in new tab");
    } catch (error) {
      this.errorHandler.handleError("Failed to open options", error);
    }
  }
  /**
   * [REQ-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX]
   * Open the local bookmarks index page in a new tab.
   */
  handleOpenBookmarksIndex() {
    recordAction(POPUP_ACTION_IDS.openBookmarksIndex, void 0, "popup");
    if (this._onAction) this._onAction({ actionId: POPUP_ACTION_IDS.openBookmarksIndex, payload: void 0 });
    try {
      const url = chrome.runtime.getURL("src/ui/bookmarks-table/bookmarks-table.html");
      chrome.tabs.create({ url });
      this.uiManager.showSuccess("Bookmarks index opened in new tab");
    } catch (error) {
      this.errorHandler.handleError("Failed to open bookmarks index", error);
    }
  }
  /**
   * [REQ-BROWSER_BOOKMARK_IMPORT] [ARCH-BROWSER_BOOKMARK_IMPORT] [IMPL-BROWSER_BOOKMARK_IMPORT]
   * Open the browser bookmark import page in a new tab.
   */
  handleOpenBrowserBookmarkImport() {
    recordAction(POPUP_ACTION_IDS.openBrowserBookmarkImport, void 0, "popup");
    if (this._onAction) this._onAction({ actionId: POPUP_ACTION_IDS.openBrowserBookmarkImport, payload: void 0 });
    try {
      const url = chrome.runtime.getURL("src/ui/browser-bookmark-import/browser-bookmark-import.html");
      chrome.tabs.create({ url });
      this.uiManager.showSuccess("Browser bookmark import opened in new tab");
    } catch (error) {
      this.errorHandler.handleError("Failed to open browser bookmark import", error);
    }
  }
  /**
   * Get better description for bookmark
   */
  getBetterDescription(currentDescription, pageTitle) {
    if (currentDescription && currentDescription.trim()) {
      return currentDescription;
    }
    return pageTitle || "Untitled";
  }
  /**
   * Close the popup
   */
  closePopup() {
    setTimeout(() => window.close(), 100);
  }
  /**
   * [POPUP-CLOSE-BEHAVIOR-005] Update popup UI to reflect overlay state
   */
  async updateOverlayState() {
    try {
      const overlayState = await this.sendToTab({
        type: "GET_OVERLAY_STATE"
      });
      const stateData = overlayState.data || overlayState;
      this.uiManager.updateShowHoverButtonState(stateData.isVisible);
      debugLog("[POPUP-CLOSE-BEHAVIOR-005] Updated overlay state:", stateData);
    } catch (error) {
      debugError("[POPUP-CLOSE-BEHAVIOR-005] Failed to update overlay state:", error);
      this.uiManager.updateShowHoverButtonState(false);
    }
  }
  /**
   * Cleanup resources
   */
  cleanup() {
    this.uiManager?.off("showHoverboard", this.handleShowHoverboard);
    this.uiManager?.off("togglePrivate", this.handleTogglePrivate);
    this.uiManager?.off("readLater", this.handleReadLater);
    this.uiManager?.off("addTag", this.handleAddTag);
    this.uiManager?.off("removeTag", this.handleRemoveTag);
    this.uiManager?.off("search", this.handleSearch);
    this.uiManager?.off("deletePin", this.handleDeletePin);
    this.uiManager?.off("reloadExtension", this.handleReloadExtension);
    this.uiManager?.off("openOptions", this.handleOpenOptions);
    this.uiManager?.off("openBookmarksIndex", this.handleOpenBookmarksIndex);
    this.uiManager?.off("openBrowserBookmarkImport", this.handleOpenBrowserBookmarkImport);
  }
  /**
   * [POPUP-REFRESH-001] Manual refresh capability
   */
  async refreshPopupData() {
    recordAction(POPUP_ACTION_IDS.refreshData, void 0, "popup");
    if (this._onAction) this._onAction({ actionId: POPUP_ACTION_IDS.refreshData, payload: void 0 });
    debugLog("[POPUP-REFRESH-001] Starting manual refresh");
    try {
      this.setLoading(true);
      await this.loadInitialData();
      await this.updateOverlayState();
      this.uiManager.showSuccess("Data refreshed successfully");
      debugLog("[POPUP-REFRESH-001] Manual refresh completed successfully");
    } catch (error) {
      debugError("[POPUP-REFRESH-001] Refresh failed:", error);
      this.uiManager.showError("Failed to refresh data");
    } finally {
      this.setLoading(false);
    }
  }
  /**
   * [POPUP-REFRESH-001] Setup auto-refresh on focus
   * [IMMUTABLE-REQ-TAG-003] [IMPL-RECENT_TAGS_POPUP_REFRESH] Refresh Recent Tags when popup becomes visible
   */
  setupAutoRefresh() {
    window.addEventListener("focus", () => {
      if (this.isInitialized && !this.isLoading) {
        debugLog("[POPUP-REFRESH-001] Auto-refresh on focus triggered");
        this.refreshPopupData();
      }
    });
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && this.isInitialized && !this.isLoading) {
        debugLog("[IMPL-RECENT_TAGS_POPUP_REFRESH] Popup visible, refreshing recent tags");
        this.loadRecentTags();
      }
    });
  }
  /**
   * [POPUP-REFRESH-001] Enhanced real-time update handling
   */
  setupRealTimeUpdates() {
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
        if (message.type === "BOOKMARK_UPDATED") {
          debugLog("[POPUP-REFRESH-001] Received BOOKMARK_UPDATED, refreshing data");
          try {
            await this.refreshPopupData();
            await this.updateOverlayState();
          } catch (error) {
            debugError("[POPUP-REFRESH-001] Failed to refresh on update:", error);
          }
        }
      });
    }
  }
  /**
   * [POPUP-SYNC-001] Ensure popup and badge show same data
   */
  async validateBadgeSynchronization() {
    try {
      const currentTab = await this.getCurrentTab();
      const popupData = this.currentPin;
      const badgeData = await this.sendMessage({
        type: "getCurrentBookmark",
        data: { url: currentTab.url }
      });
      debugLog("[POPUP-SYNC-001] Badge synchronization check:", {
        popupTags: popupData?.tags,
        badgeTags: badgeData?.tags,
        popupTagCount: popupData?.tags?.length || 0,
        badgeTagCount: badgeData?.tags?.length || 0,
        synchronized: JSON.stringify(popupData) === JSON.stringify(badgeData)
      });
      return {
        synchronized: JSON.stringify(popupData) === JSON.stringify(badgeData),
        popupData,
        badgeData
      };
    } catch (error) {
      debugError("[POPUP-SYNC-001] Badge synchronization check failed:", error);
      return { synchronized: false, error: error.message };
    }
  }
  /**
   * [POPUP-SYNC-001] Ensure popup and overlay show same data
   */
  async validateOverlaySynchronization() {
    try {
      const overlayData = await this.sendToTab({
        type: "getCurrentBookmark",
        data: { url: this.currentTab.url }
      });
      debugLog("[POPUP-SYNC-001] Overlay synchronization check:", {
        popupData: this.currentPin,
        overlayData,
        popupTagCount: this.currentPin?.tags?.length || 0,
        overlayTagCount: overlayData?.tags?.length || 0,
        synchronized: JSON.stringify(this.currentPin) === JSON.stringify(overlayData)
      });
      return {
        synchronized: JSON.stringify(this.currentPin) === JSON.stringify(overlayData),
        popupData: this.currentPin,
        overlayData
      };
    } catch (error) {
      debugError("[POPUP-SYNC-001] Overlay synchronization check failed:", error);
      return { synchronized: false, error: error.message };
    }
  }
  /**
   * [SHOW-HOVER-CHECKBOX-CONTROLLER-003] - Handle checkbox state change
   */
  async handleShowHoverOnPageLoadChange() {
    recordAction(POPUP_ACTION_IDS.showHoverOnPageLoadChange, void 0, "popup");
    if (this._onAction) this._onAction({ actionId: POPUP_ACTION_IDS.showHoverOnPageLoadChange, payload: void 0 });
    try {
      const isChecked = this.uiManager.elements.showHoverOnPageLoad.checked;
      await this.configManager.updateConfig({
        showHoverOnPageLoad: isChecked
      });
      this.uiManager.showSuccess(
        isChecked ? "Hover will show on page load" : "Hover will not show on page load"
      );
      await this.broadcastConfigUpdate();
    } catch (error) {
      this.errorHandler.handleError("Failed to update page load setting", error);
    }
  }
  /**
   * [SHOW-HOVER-CHECKBOX-CONTROLLER-004] - Load checkbox state from configuration
   */
  async loadShowHoverOnPageLoadSetting() {
    try {
      const config = await this.configManager.getConfig();
      this.uiManager.elements.showHoverOnPageLoad.checked = config.showHoverOnPageLoad;
    } catch (error) {
      this.errorHandler.handleError("Failed to load page load setting", error);
    }
  }
  /**
   * [SHOW-HOVER-CHECKBOX-CONTROLLER-005] - Broadcast configuration updates to content scripts
   */
  async broadcastConfigUpdate() {
    try {
      const config = await this.configManager.getConfig();
      if (this.currentTab) {
        await this.sendToTab({
          type: "UPDATE_CONFIG",
          data: { showHoverOnPageLoad: config.showHoverOnPageLoad }
        });
      }
      await this.sendMessage({
        type: "updateOverlayConfig",
        data: { showHoverOnPageLoad: config.showHoverOnPageLoad }
      });
    } catch (error) {
      this.errorHandler.handleError("Failed to broadcast config update", error);
    }
  }
};

// src/ui/popup/KeyboardManager.js
var KeyboardManager = class {
  constructor({ uiManager }) {
    this.uiManager = uiManager;
    this.isEnabled = true;
    this.shortcuts = {
      Space: () => this.uiManager.emit("showHoverboard"),
      KeyT: () => this.uiManager.focusTagInput(),
      KeyS: () => this.uiManager.focusSearchInput(),
      Escape: () => this.handleEscape(),
      KeyH: () => this.uiManager.toggleShortcutsHelp(),
      F1: () => this.uiManager.toggleShortcutsHelp()
    };
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleEscape = this.handleEscape.bind(this);
  }
  /**
   * Setup keyboard navigation and shortcuts
   */
  setupKeyboardNavigation() {
    document.addEventListener("keydown", this.handleKeyDown);
    this.setupFocusManagement();
    this.setupTabNavigation();
  }
  /**
   * Handle keydown events
   */
  handleKeyDown(event) {
    if (!this.isEnabled) return;
    if (this.isTypingInInput(event.target)) {
      this.handleInputKeydown(event);
      return;
    }
    const shortcutKey = this.getShortcutKey(event);
    const handler = this.shortcuts[shortcutKey];
    if (handler) {
      event.preventDefault();
      event.stopPropagation();
      handler();
    }
    this.handleNavigationKeys(event);
  }
  /**
   * Handle input-specific keydown events
   */
  handleInputKeydown(event) {
    const target = event.target;
    switch (event.key) {
      case "Escape":
        target.blur();
        event.preventDefault();
        break;
      case "ArrowDown":
      case "ArrowUp":
        break;
      case "Tab":
        break;
    }
  }
  /**
   * Handle navigation keys (arrows, tab, etc.)
   */
  handleNavigationKeys(event) {
    switch (event.key) {
      case "ArrowDown":
        this.focusNext();
        event.preventDefault();
        break;
      case "ArrowUp":
        this.focusPrevious();
        event.preventDefault();
        break;
      case "Home":
        this.focusFirst();
        event.preventDefault();
        break;
      case "End":
        this.focusLast();
        event.preventDefault();
        break;
      case "Enter":
        this.activateFocused(event);
        break;
    }
  }
  /**
   * Setup focus management for better accessibility
   */
  setupFocusManagement() {
    this.updateFocusableElements();
    this.setInitialFocus();
    this.addFocusIndicators();
  }
  /**
   * Setup tab navigation order
   */
  setupTabNavigation() {
    const focusableElements = this.getFocusableElements();
    focusableElements.forEach((element, index) => {
      if (!element.tabIndex || element.tabIndex === -1) {
        element.tabIndex = index + 1;
      }
    });
  }
  /**
   * Update the list of focusable elements
   */
  updateFocusableElements() {
    this.focusableElements = this.getFocusableElements();
    this.currentFocusIndex = -1;
  }
  /**
   * Get all focusable elements in tab order
   */
  getFocusableElements() {
    const selector = `
      button:not([disabled]):not([hidden]),
      input:not([disabled]):not([hidden]),
      textarea:not([disabled]):not([hidden]),
      select:not([disabled]):not([hidden]),
      a[href]:not([hidden]),
      [tabindex]:not([tabindex="-1"]):not([hidden])
    `;
    const elements = Array.from(document.querySelectorAll(selector));
    return elements.filter((el) => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
  }
  /**
   * Set initial focus when popup opens
   */
  setInitialFocus() {
    const showHoverboardButton = document.getElementById("showHoverboard");
    if (showHoverboardButton && !showHoverboardButton.disabled) {
      showHoverboardButton.focus();
    } else {
      this.focusFirst();
    }
  }
  /**
   * Focus the next focusable element
   */
  focusNext() {
    const elements = this.getFocusableElements();
    const currentIndex = elements.indexOf(document.activeElement);
    const nextIndex = (currentIndex + 1) % elements.length;
    if (elements[nextIndex]) {
      elements[nextIndex].focus();
    }
  }
  /**
   * Focus the previous focusable element
   */
  focusPrevious() {
    const elements = this.getFocusableElements();
    const currentIndex = elements.indexOf(document.activeElement);
    const prevIndex = currentIndex <= 0 ? elements.length - 1 : currentIndex - 1;
    if (elements[prevIndex]) {
      elements[prevIndex].focus();
    }
  }
  /**
   * Focus the first focusable element
   */
  focusFirst() {
    const elements = this.getFocusableElements();
    if (elements.length > 0) {
      elements[0].focus();
    }
  }
  /**
   * Focus the last focusable element
   */
  focusLast() {
    const elements = this.getFocusableElements();
    if (elements.length > 0) {
      elements[elements.length - 1].focus();
    }
  }
  /**
   * Activate the currently focused element
   */
  activateFocused(event) {
    const focused = document.activeElement;
    if (focused && focused.tagName === "BUTTON") {
      focused.click();
      event.preventDefault();
    }
  }
  /**
   * Handle escape key
   */
  handleEscape() {
    if (!this.uiManager.elements.shortcutsHelp?.hidden) {
      this.uiManager.hideShortcutsHelp();
      return;
    }
    if (!this.uiManager.elements.errorToast?.hidden) {
      this.uiManager.hideError();
      return;
    }
    if (this.isTypingInInput(document.activeElement)) {
      document.activeElement.blur();
      return;
    }
    window.close();
  }
  /**
   * Add visual focus indicators
   */
  addFocusIndicators() {
    const style = document.createElement("style");
    style.textContent = `
      .keyboard-navigation *:focus {
        outline: 2px solid var(--color-primary-500) !important;
        outline-offset: 2px !important;
      }

      .keyboard-navigation button:focus,
      .keyboard-navigation input:focus {
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2) !important;
      }
    `;
    document.head.appendChild(style);
    document.body.classList.add("keyboard-navigation");
  }
  /**
   * Check if user is typing in an input element
   */
  isTypingInInput(element) {
    if (!element) return false;
    const inputTypes = ["INPUT", "TEXTAREA", "SELECT"];
    return inputTypes.includes(element.tagName);
  }
  /**
   * Get shortcut key from event
   */
  getShortcutKey(event) {
    const modifiers = [];
    if (event.ctrlKey) modifiers.push("Ctrl");
    if (event.altKey) modifiers.push("Alt");
    if (event.shiftKey) modifiers.push("Shift");
    if (event.metaKey) modifiers.push("Meta");
    const key = event.code || event.key;
    return modifiers.length > 0 ? `${modifiers.join("+")}+${key}` : key;
  }
  /**
   * Enable keyboard management
   */
  enable() {
    this.isEnabled = true;
  }
  /**
   * Disable keyboard management
   */
  disable() {
    this.isEnabled = false;
  }
  /**
   * Add a custom keyboard shortcut
   */
  addShortcut(key, handler) {
    this.shortcuts[key] = handler;
  }
  /**
   * Remove a keyboard shortcut
   */
  removeShortcut(key) {
    delete this.shortcuts[key];
  }
  /**
   * Handle focus trap for modal elements
   */
  trapFocus(container) {
    const focusableElements = container.querySelectorAll(`
      button:not([disabled]),
      input:not([disabled]),
      textarea:not([disabled]),
      select:not([disabled]),
      a[href],
      [tabindex]:not([tabindex="-1"])
    `);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    container.addEventListener("keydown", (event) => {
      if (event.key === "Tab") {
        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    });
    if (firstElement) {
      firstElement.focus();
    }
  }
  /**
   * Announce to screen readers
   */
  announce(message, priority = "polite") {
    const announcement = document.createElement("div");
    announcement.setAttribute("aria-live", priority);
    announcement.setAttribute("aria-atomic", "true");
    announcement.className = "sr-only";
    announcement.textContent = message;
    document.body.appendChild(announcement);
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1e3);
  }
  /**
   * Cleanup keyboard management
   */
  cleanup() {
    document.removeEventListener("keydown", this.handleKeyDown);
    document.body.classList.remove("keyboard-navigation");
    this.isEnabled = false;
    this.focusableElements = [];
    this.currentFocusIndex = -1;
  }
};

// src/ui/index.js
var UISystem = class {
  constructor() {
    this.iconManager = null;
    this.themeManager = null;
    this.visualAssetsManager = null;
    this.isInitialized = false;
    this.init = this.init.bind(this);
    this.createPopup = this.createPopup.bind(this);
    this.setTheme = this.setTheme.bind(this);
    this.preloadAssets = this.preloadAssets.bind(this);
  }
  /**
   * Initialize the UI system
   *
   * UI-001: System initialization with dependency management
   * SPECIFICATION: Initialize components in dependency order (themes → icons → assets)
   * IMPLEMENTATION DECISION: Options-based initialization for flexible component inclusion
   */
  async init(options = {}) {
    const {
      enableThemes = true,
      enableIcons = true,
      enableAssets = true,
      preloadCriticalAssets = true
    } = options;
    try {
      if (enableThemes) {
        this.themeManager = new ThemeManager();
        await this.themeManager.init();
      }
      if (enableIcons) {
        this.iconManager = new IconManager();
        if (this.themeManager) {
          this.iconManager.setTheme(this.themeManager.getResolvedTheme());
          this.themeManager.addListener(({ resolvedTheme }) => {
            this.iconManager.setTheme(resolvedTheme);
          });
        }
      }
      if (enableAssets) {
        this.visualAssetsManager = new VisualAssetsManager();
        if (preloadCriticalAssets) {
          await this.visualAssetsManager.preloadCriticalAssets();
        }
      }
      this.isInitialized = true;
      console.log("UI System initialized successfully");
    } catch (error) {
      console.error("Failed to initialize UI System:", error);
      throw error;
    }
  }
  /**
   * Create popup application instance
   *
   * UI-004: Popup application factory with integrated components
   * SPECIFICATION: Create popup with all UI system components integrated
   * IMPLEMENTATION DECISION: Inject UI managers into popup for seamless integration
   */
  createPopup(options = {}) {
    if (!this.isInitialized) {
      throw new Error("UI System must be initialized before creating popup");
    }
    const {
      container = document.body,
      enableKeyboard = true,
      enableState = true
    } = options;
    const popupOptions = {
      iconManager: this.iconManager,
      themeManager: this.themeManager,
      visualAssetsManager: this.visualAssetsManager,
      container,
      ...options
    };
    const stateManager = enableState ? new StateManager() : null;
    const uiManager = new UIManager({
      errorHandler: popupOptions.errorHandler,
      stateManager,
      config: popupOptions.config || {}
    });
    const keyboardManager = enableKeyboard ? new KeyboardManager({ uiManager }) : null;
    const controller = new PopupController({
      uiManager,
      stateManager,
      keyboardManager,
      ...popupOptions
    });
    return {
      controller,
      uiManager,
      stateManager,
      keyboardManager
    };
  }
  /**
   * Get icon element
   *
   * UI-003: Icon retrieval through UI system
   * SPECIFICATION: Provide centralized icon access with error handling
   * IMPLEMENTATION DECISION: Return null on failure for safe UI operations
   */
  getIcon(iconName, options = {}) {
    if (!this.iconManager) {
      console.warn("Icon manager not initialized");
      return null;
    }
    return this.iconManager.getIcon(iconName, options);
  }
  /**
   * Create icon button
   *
   * UI-003: Icon button creation through UI system
   * SPECIFICATION: Create interactive icon buttons with consistent styling
   * IMPLEMENTATION DECISION: Centralized button creation for consistency
   */
  createIconButton(iconName, options = {}) {
    if (!this.iconManager) {
      console.warn("Icon manager not initialized");
      return null;
    }
    return this.iconManager.createIconButton(iconName, options);
  }
  /**
   * Set theme
   *
   * UI-002: Theme switching through UI system
   * SPECIFICATION: Apply theme across all UI components
   * IMPLEMENTATION DECISION: Centralized theme control with automatic propagation
   */
  async setTheme(theme) {
    if (!this.themeManager) {
      console.warn("Theme manager not initialized");
      return;
    }
    await this.themeManager.setTheme(theme);
  }
  /**
   * Get current theme
   *
   * UI-002: Current theme retrieval
   * SPECIFICATION: Provide current resolved theme for component consistency
   * IMPLEMENTATION DECISION: Default to 'light' if theme manager unavailable
   */
  getTheme() {
    if (!this.themeManager) {
      return "light";
    }
    return this.themeManager.getResolvedTheme();
  }
  /**
   * Create theme switcher
   *
   * UI-002: Theme switcher UI component creation
   * SPECIFICATION: Create theme switching control widget
   * IMPLEMENTATION DECISION: Delegate to theme manager for consistent behavior
   */
  createThemeSwitcher(options = {}) {
    if (!this.themeManager) {
      console.warn("Theme manager not initialized");
      return null;
    }
    return this.themeManager.createThemeSwitcher(options);
  }
  /**
   * Get asset
   *
   * UI-003: Asset retrieval through UI system
   * SPECIFICATION: Provide centralized asset access with loading management
   * IMPLEMENTATION DECISION: Return null on failure for safe UI operations
   */
  async getAsset(assetName, options = {}) {
    if (!this.visualAssetsManager) {
      console.warn("Visual assets manager not initialized");
      return null;
    }
    return this.visualAssetsManager.getAsset(assetName, options);
  }
  /**
   * Create responsive image
   *
   * UI-003: Responsive image creation through UI system
   * SPECIFICATION: Create responsive image elements with proper sizing
   * IMPLEMENTATION DECISION: Centralized image creation for consistent behavior
   */
  createResponsiveImage(assetName, options = {}) {
    if (!this.visualAssetsManager) {
      console.warn("Visual assets manager not initialized");
      return null;
    }
    return this.visualAssetsManager.createResponsiveImage(assetName, options);
  }
  /**
   * Preload assets
   *
   * UI-003: Asset preloading through UI system
   * SPECIFICATION: Preload specified assets for performance optimization
   * IMPLEMENTATION DECISION: Allow caller-specified asset lists for flexible preloading
   */
  async preloadAssets(assetList, options = {}) {
    if (!this.visualAssetsManager) {
      console.warn("Visual assets manager not initialized");
      return;
    }
    return this.visualAssetsManager.preloadAssets(assetList, options);
  }
  /**
   * Apply theme styles to element
   *
   * UI-002: Theme styling application utility
   * SPECIFICATION: Apply theme-specific styles to DOM elements
   * IMPLEMENTATION DECISION: Direct style application for dynamic theming
   */
  applyThemeStyles(element, styles) {
    if (!element || !styles) return;
    Object.entries(styles).forEach(([property, value]) => {
      element.style[property] = value;
    });
  }
  /**
   * Inject CSS into document
   *
   * UI-001: CSS injection utility for dynamic styling
   * SPECIFICATION: Add CSS styles to document head with optional ID
   * IMPLEMENTATION DECISION: Support ID-based replacement for style updates
   */
  injectCSS(css, id = null) {
    if (id) {
      const existing = document.getElementById(id);
      if (existing) {
        existing.remove();
      }
    }
    const style = document.createElement("style");
    style.textContent = css;
    if (id) {
      style.id = id;
    }
    document.head.appendChild(style);
    return style;
  }
  /**
   * Load CSS from URL
   *
   * UI-001: External CSS loading utility
   * SPECIFICATION: Load CSS from external URL with optional ID
   * IMPLEMENTATION DECISION: Promise-based loading for async integration
   */
  async loadCSS(url, id = null) {
    return new Promise((resolve, reject) => {
      if (id) {
        const existing = document.getElementById(id);
        if (existing) {
          existing.remove();
        }
      }
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = url;
      if (id) {
        link.id = id;
      }
      link.onload = () => resolve(link);
      link.onerror = () => reject(new Error(`Failed to load CSS: ${url}`));
      document.head.appendChild(link);
    });
  }
  /**
   * Load default styles
   *
   * UI-001: Default styling system loader
   * SPECIFICATION: Load core extension styles for consistent appearance
   * IMPLEMENTATION DECISION: Centralized style loading for initialization
   */
  async loadStyles() {
    try {
      const coreStyles = `
        .hoverboard-ui {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 14px;
          line-height: 1.4;
        }
      `;
      this.injectCSS(coreStyles, "hoverboard-core-styles");
    } catch (error) {
      console.error("Failed to load UI styles:", error);
    }
  }
  /**
   * Get system capabilities
   *
   * UI-001: System capability reporting
   * SPECIFICATION: Report available UI system features
   * IMPLEMENTATION DECISION: Boolean flags for feature detection
   */
  getCapabilities() {
    return {
      hasThemeManager: !!this.themeManager,
      hasIconManager: !!this.iconManager,
      hasVisualAssetsManager: !!this.visualAssetsManager,
      isInitialized: this.isInitialized
    };
  }
  /**
   * Get system statistics
   *
   * UI-001: System statistics reporting
   * SPECIFICATION: Provide system usage and performance statistics
   * IMPLEMENTATION DECISION: Aggregate statistics from all managers
   */
  getStats() {
    const stats = {
      // UI-001: Base system statistics
      isInitialized: this.isInitialized,
      componentsLoaded: 0
    };
    if (this.themeManager) {
      stats.componentsLoaded++;
      stats.currentTheme = this.themeManager.getResolvedTheme();
    }
    if (this.iconManager) {
      stats.componentsLoaded++;
      stats.iconsLoaded = this.iconManager.getLoadedCount?.() || 0;
    }
    if (this.visualAssetsManager) {
      stats.componentsLoaded++;
      stats.assetsLoaded = this.visualAssetsManager.getLoadedCount?.() || 0;
    }
    return stats;
  }
  /**
   * Cleanup resources
   *
   * UI-001: Resource cleanup for proper disposal
   * SPECIFICATION: Clean up all UI system resources and event listeners
   * IMPLEMENTATION DECISION: Comprehensive cleanup to prevent memory leaks
   */
  cleanup() {
    try {
      if (this.themeManager) {
        this.themeManager.cleanup?.();
        this.themeManager = null;
      }
      if (this.iconManager) {
        this.iconManager.cleanup?.();
        this.iconManager = null;
      }
      if (this.visualAssetsManager) {
        this.visualAssetsManager.cleanup?.();
        this.visualAssetsManager = null;
      }
      this.isInitialized = false;
      console.log("UI System cleaned up successfully");
    } catch (error) {
      console.error("Error during UI System cleanup:", error);
    }
  }
};
var globalUISystem = null;
async function init(options = {}) {
  if (!globalUISystem) {
    globalUISystem = new UISystem();
  }
  return globalUISystem.init(options);
}
function popup(options = {}) {
  if (!globalUISystem) {
    console.warn("UI System not initialized");
    return null;
  }
  return globalUISystem.createPopup(options);
}

// src/ui/popup/popup.js
init_config_manager();
var HoverboardPopup = class {
  constructor() {
    this.isInitialized = false;
    this.popupComponents = null;
    this.errorHandler = null;
    this.uiSystem = null;
    this.configManager = new ConfigManager();
    this.init = this.init.bind(this);
    this.handleError = this.handleError.bind(this);
    this.cleanup = this.cleanup.bind(this);
  }
  /**
   * Initialize the popup application
   */
  async init() {
    try {
      console.log("Initializing Hoverboard popup...");
      this.errorHandler = new ErrorHandler();
      this.errorHandler.onError = (message, errorInfo) => {
        this.handleError(message, errorInfo);
      };
      console.log("Error handler initialized");
      this.uiSystem = await init({
        enableThemes: true,
        enableIcons: true,
        enableAssets: true,
        preloadCriticalAssets: true
      });
      console.log("UI system initialized");
      const config = await this.configManager.getConfig();
      console.log("Configuration loaded:", config);
      this.popupComponents = popup({
        errorHandler: this.errorHandler,
        enableKeyboard: true,
        enableState: true,
        config
      });
      console.log("Popup components created");
      await this.popupComponents.controller.loadInitialData();
      console.log("Initial data loaded");
      this.popupComponents.uiManager.setupEventListeners();
      if (this.popupComponents.keyboardManager) {
        this.popupComponents.keyboardManager.setupKeyboardNavigation();
      }
      console.log("Event listeners setup complete");
      this.isInitialized = true;
      console.log("Hoverboard popup initialized successfully with modern UI system");
    } catch (error) {
      console.error("Failed to initialize popup:", error);
      this.handleError("Failed to initialize popup", error);
    }
  }
  /**
   * Handle errors from any component
   */
  async handleError(message, errorInfo = null) {
    let errorMessage = message;
    let actualError = errorInfo;
    if (typeof message === "object" && message !== null) {
      actualError = message;
      errorMessage = actualError.message || "An unexpected error occurred";
    }
    console.error("Popup Error:", errorMessage, actualError);
    const authErrorMessages = [
      "No authentication token configured",
      "Authentication failed",
      "Invalid API token"
    ];
    if (authErrorMessages.some((msg) => errorMessage.includes(msg))) {
      if (this.popupComponents && this.popupComponents.uiManager) {
        this.popupComponents.uiManager.showError("Please configure your Pinboard API token in the extension options.");
      }
      return;
    }
    if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
      if (this.popupComponents && this.popupComponents.uiManager) {
        this.popupComponents.uiManager.showError("Network error. Please check your connection and try again.");
      }
      return;
    }
    if (errorMessage.includes("permission") || errorMessage.includes("denied")) {
      if (this.popupComponents && this.popupComponents.uiManager) {
        this.popupComponents.uiManager.showError("Permission denied. Please check extension permissions.");
      }
      return;
    }
    if (this.popupComponents && this.popupComponents.uiManager) {
      this.popupComponents.uiManager.showError("An unexpected error occurred. Please try again.");
    }
  }
  /**
   * Cleanup resources when popup is closed
   */
  cleanup() {
    if (this.popupComponents) {
      if (this.popupComponents.keyboardManager) {
        this.popupComponents.keyboardManager.cleanup();
      }
      if (this.popupComponents.uiManager) {
        this.popupComponents.uiManager.cleanup();
      }
      if (this.popupComponents.controller) {
        this.popupComponents.controller.cleanup();
      }
    }
    if (this.uiSystem) {
      this.uiSystem.cleanup();
    }
    this.isInitialized = false;
  }
};
var app = null;
function initializeApp() {
  try {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initializeApp);
      return;
    }
    console.log("DOM ready, creating Hoverboard popup...");
    app = new HoverboardPopup();
    app.init().catch((error) => {
      console.error("Failed to initialize Hoverboard popup:", error);
      if (app && app.popupComponents && app.popupComponents.uiManager) {
        app.popupComponents.uiManager.showError("Failed to initialize popup. Please try reloading the extension.");
      }
    });
  } catch (error) {
    console.error("Critical error during popup initialization:", error);
  }
}
window.addEventListener("beforeunload", () => {
  if (app) {
    app.cleanup();
  }
});
window.addEventListener("unload", () => {
  if (app) {
    app.cleanup();
  }
});
initializeApp();
window.HoverboardPopup = { app };
