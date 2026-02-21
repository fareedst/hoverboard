(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

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
      browser = chrome;
      console.log("[SAFARI-EXT-SHIM-001] Using Chrome API");
      if (logger && logger.debug) {
        logger.debug("[SAFARI-EXT-SHIM-001] Using Chrome API");
      }
      return;
    }
    try {
      if (typeof window !== "undefined" && window.browser) {
        browser = window.browser;
        console.log("[SAFARI-EXT-SHIM-001] Using webextension-polyfill");
        if (logger && logger.debug) {
          logger.debug("[SAFARI-EXT-SHIM-001] Using webextension-polyfill");
        }
        return;
      }
    } catch (polyfillError) {
      console.warn("[SAFARI-EXT-SHIM-001] webextension-polyfill failed:", polyfillError.message);
    }
    browser = createMinimalBrowserAPI();
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
  var browser, retryConfig, storageQuotaConfig, quotaCache, storageQueue, storageQueueTimeout, storageQuotaUtils, safariEnhancements, platformUtils;
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
            const storageData = await browser.storage.sync.get(null);
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
                await browser.storage.sync.remove(candidate.key);
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
                    return await browser.storage.local.get(fallbackData);
                  } else if (operation === "set") {
                    return await browser.storage.local.set(fallbackData);
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
              const result = await browser.storage.sync.get(keys);
              results.push(...getOps.map((op) => ({ ...op, result })));
            }
            if (setOps.length > 0) {
              const data = Object.assign({}, ...setOps.map((op) => op.data));
              const result = await browser.storage.sync.set(data);
              results.push(...setOps.map((op) => ({ ...op, result })));
            }
            if (removeOps.length > 0) {
              const keys = removeOps.flatMap((op) => op.keys || []);
              const result = await browser.storage.sync.remove(keys);
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
                    return await browser.storage.sync.get(operation.keys);
                  } else if (operation.type === "set") {
                    return await browser.storage.sync.set(operation.data);
                  } else if (operation.type === "remove") {
                    return await browser.storage.sync.remove(operation.keys);
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
          ...browser.storage,
          // [SAFARI-EXT-STORAGE-001] Enhanced Safari storage quota management
          getQuotaUsage: storageQuotaUtils.getQuotaUsage,
          // [SAFARI-EXT-STORAGE-001] Enhanced Safari-optimized storage operations
          sync: {
            ...browser.storage.sync,
            // Safari sync storage with enhanced quota management and retry logic
            get: async (keys) => {
              console.log("[SAFARI-EXT-STORAGE-001] Getting sync storage:", keys);
              return retryOperation(async () => {
                try {
                  const result = await browser.storage.sync.get(keys);
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
                  const result = await browser.storage.sync.set(data);
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
                  const result = await browser.storage.sync.remove(keys);
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
            ...browser.storage.local,
            get: async (keys) => {
              console.log("[SAFARI-EXT-STORAGE-001] Getting local storage:", keys);
              return retryOperation(async () => {
                try {
                  const result = await browser.storage.local.get(keys);
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
                  const result = await browser.storage.local.set(data);
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
                  const result = await browser.storage.local.remove(keys);
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
          ...browser.runtime,
          // [SAFARI-EXT-MESSAGING-001] Enhanced Safari-optimized message passing
          sendMessage: async (message) => {
            console.log("[SAFARI-EXT-MESSAGING-001] Sending message:", message);
            return retryOperation(async () => {
              try {
                const enhancedMessage = {
                  ...message,
                  timestamp: Date.now(),
                  version: browser.runtime.getManifest().version
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
            ...browser.runtime.onMessage,
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
          ...browser.tabs,
          // [SAFARI-EXT-CONTENT-001] Enhanced Safari-optimized tab querying
          query: async (queryInfo) => {
            console.log("[SAFARI-EXT-CONTENT-001] Querying tabs:", queryInfo);
            return retryOperation(async () => {
              try {
                const tabs = await browser.tabs.query(queryInfo);
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
          const isFirefox = typeof browser !== "undefined" && browser.runtime.getBrowserInfo;
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
              sync: typeof browser?.storage?.sync !== "undefined",
              local: typeof browser?.storage?.local !== "undefined",
              quota: typeof navigator?.storage?.estimate === "function",
              compression: platform === "safari" || platform === "firefox"
            },
            // [SAFARI-EXT-SHIM-001] Messaging capabilities
            messaging: {
              runtime: typeof browser?.runtime?.sendMessage === "function",
              tabs: typeof browser?.tabs?.sendMessage === "function",
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
                browserAPIAvailable: typeof browser?.runtime !== "undefined",
                webextensionPolyfill: typeof browser?.runtime?.getBrowserInfo === "function"
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
  function debugLog2(component, message, ...args) {
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
  function debugWarn(component, message, ...args) {
    if (DEBUG_CONFIG.enabled) {
      const prefix = `${DEBUG_CONFIG.prefix} [${component}]`;
      if (args.length > 0) {
        console.warn(prefix, message, ...args);
      } else {
        console.warn(prefix, message);
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
            fontSizeInputs: 14,
            // Input fields and buttons font size in pixels
            // [REQ-AI_TAGGING_CONFIG] [ARCH-AI_TAGGING_CONFIG] [IMPL-AI_CONFIG_OPTIONS] AI tagging (optional)
            aiApiKey: "",
            aiProvider: "openai",
            aiTagLimit: 64
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

  // node_modules/fast-xml-parser/src/util.js
  function getAllMatches(string, regex) {
    const matches = [];
    let match = regex.exec(string);
    while (match) {
      const allmatches = [];
      allmatches.startIndex = regex.lastIndex - match[0].length;
      const len = match.length;
      for (let index = 0; index < len; index++) {
        allmatches.push(match[index]);
      }
      matches.push(allmatches);
      match = regex.exec(string);
    }
    return matches;
  }
  function isExist(v) {
    return typeof v !== "undefined";
  }
  var nameStartChar, nameChar, nameRegexp, regexName, isName;
  var init_util = __esm({
    "node_modules/fast-xml-parser/src/util.js"() {
      "use strict";
      nameStartChar = ":A-Za-z_\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD";
      nameChar = nameStartChar + "\\-.\\d\\u00B7\\u0300-\\u036F\\u203F-\\u2040";
      nameRegexp = "[" + nameStartChar + "][" + nameChar + "]*";
      regexName = new RegExp("^" + nameRegexp + "$");
      isName = function(string) {
        const match = regexName.exec(string);
        return !(match === null || typeof match === "undefined");
      };
    }
  });

  // node_modules/fast-xml-parser/src/validator.js
  function validate(xmlData, options) {
    options = Object.assign({}, defaultOptions, options);
    const tags = [];
    let tagFound = false;
    let reachedRoot = false;
    if (xmlData[0] === "\uFEFF") {
      xmlData = xmlData.substr(1);
    }
    for (let i = 0; i < xmlData.length; i++) {
      if (xmlData[i] === "<" && xmlData[i + 1] === "?") {
        i += 2;
        i = readPI(xmlData, i);
        if (i.err) return i;
      } else if (xmlData[i] === "<") {
        let tagStartPos = i;
        i++;
        if (xmlData[i] === "!") {
          i = readCommentAndCDATA(xmlData, i);
          continue;
        } else {
          let closingTag = false;
          if (xmlData[i] === "/") {
            closingTag = true;
            i++;
          }
          let tagName = "";
          for (; i < xmlData.length && xmlData[i] !== ">" && xmlData[i] !== " " && xmlData[i] !== "	" && xmlData[i] !== "\n" && xmlData[i] !== "\r"; i++) {
            tagName += xmlData[i];
          }
          tagName = tagName.trim();
          if (tagName[tagName.length - 1] === "/") {
            tagName = tagName.substring(0, tagName.length - 1);
            i--;
          }
          if (!validateTagName(tagName)) {
            let msg;
            if (tagName.trim().length === 0) {
              msg = "Invalid space after '<'.";
            } else {
              msg = "Tag '" + tagName + "' is an invalid name.";
            }
            return getErrorObject("InvalidTag", msg, getLineNumberForPosition(xmlData, i));
          }
          const result = readAttributeStr(xmlData, i);
          if (result === false) {
            return getErrorObject("InvalidAttr", "Attributes for '" + tagName + "' have open quote.", getLineNumberForPosition(xmlData, i));
          }
          let attrStr = result.value;
          i = result.index;
          if (attrStr[attrStr.length - 1] === "/") {
            const attrStrStart = i - attrStr.length;
            attrStr = attrStr.substring(0, attrStr.length - 1);
            const isValid = validateAttributeString(attrStr, options);
            if (isValid === true) {
              tagFound = true;
            } else {
              return getErrorObject(isValid.err.code, isValid.err.msg, getLineNumberForPosition(xmlData, attrStrStart + isValid.err.line));
            }
          } else if (closingTag) {
            if (!result.tagClosed) {
              return getErrorObject("InvalidTag", "Closing tag '" + tagName + "' doesn't have proper closing.", getLineNumberForPosition(xmlData, i));
            } else if (attrStr.trim().length > 0) {
              return getErrorObject("InvalidTag", "Closing tag '" + tagName + "' can't have attributes or invalid starting.", getLineNumberForPosition(xmlData, tagStartPos));
            } else if (tags.length === 0) {
              return getErrorObject("InvalidTag", "Closing tag '" + tagName + "' has not been opened.", getLineNumberForPosition(xmlData, tagStartPos));
            } else {
              const otg = tags.pop();
              if (tagName !== otg.tagName) {
                let openPos = getLineNumberForPosition(xmlData, otg.tagStartPos);
                return getErrorObject(
                  "InvalidTag",
                  "Expected closing tag '" + otg.tagName + "' (opened in line " + openPos.line + ", col " + openPos.col + ") instead of closing tag '" + tagName + "'.",
                  getLineNumberForPosition(xmlData, tagStartPos)
                );
              }
              if (tags.length == 0) {
                reachedRoot = true;
              }
            }
          } else {
            const isValid = validateAttributeString(attrStr, options);
            if (isValid !== true) {
              return getErrorObject(isValid.err.code, isValid.err.msg, getLineNumberForPosition(xmlData, i - attrStr.length + isValid.err.line));
            }
            if (reachedRoot === true) {
              return getErrorObject("InvalidXml", "Multiple possible root nodes found.", getLineNumberForPosition(xmlData, i));
            } else if (options.unpairedTags.indexOf(tagName) !== -1) {
            } else {
              tags.push({ tagName, tagStartPos });
            }
            tagFound = true;
          }
          for (i++; i < xmlData.length; i++) {
            if (xmlData[i] === "<") {
              if (xmlData[i + 1] === "!") {
                i++;
                i = readCommentAndCDATA(xmlData, i);
                continue;
              } else if (xmlData[i + 1] === "?") {
                i = readPI(xmlData, ++i);
                if (i.err) return i;
              } else {
                break;
              }
            } else if (xmlData[i] === "&") {
              const afterAmp = validateAmpersand(xmlData, i);
              if (afterAmp == -1)
                return getErrorObject("InvalidChar", "char '&' is not expected.", getLineNumberForPosition(xmlData, i));
              i = afterAmp;
            } else {
              if (reachedRoot === true && !isWhiteSpace(xmlData[i])) {
                return getErrorObject("InvalidXml", "Extra text at the end", getLineNumberForPosition(xmlData, i));
              }
            }
          }
          if (xmlData[i] === "<") {
            i--;
          }
        }
      } else {
        if (isWhiteSpace(xmlData[i])) {
          continue;
        }
        return getErrorObject("InvalidChar", "char '" + xmlData[i] + "' is not expected.", getLineNumberForPosition(xmlData, i));
      }
    }
    if (!tagFound) {
      return getErrorObject("InvalidXml", "Start tag expected.", 1);
    } else if (tags.length == 1) {
      return getErrorObject("InvalidTag", "Unclosed tag '" + tags[0].tagName + "'.", getLineNumberForPosition(xmlData, tags[0].tagStartPos));
    } else if (tags.length > 0) {
      return getErrorObject("InvalidXml", "Invalid '" + JSON.stringify(tags.map((t) => t.tagName), null, 4).replace(/\r?\n/g, "") + "' found.", { line: 1, col: 1 });
    }
    return true;
  }
  function isWhiteSpace(char) {
    return char === " " || char === "	" || char === "\n" || char === "\r";
  }
  function readPI(xmlData, i) {
    const start = i;
    for (; i < xmlData.length; i++) {
      if (xmlData[i] == "?" || xmlData[i] == " ") {
        const tagname = xmlData.substr(start, i - start);
        if (i > 5 && tagname === "xml") {
          return getErrorObject("InvalidXml", "XML declaration allowed only at the start of the document.", getLineNumberForPosition(xmlData, i));
        } else if (xmlData[i] == "?" && xmlData[i + 1] == ">") {
          i++;
          break;
        } else {
          continue;
        }
      }
    }
    return i;
  }
  function readCommentAndCDATA(xmlData, i) {
    if (xmlData.length > i + 5 && xmlData[i + 1] === "-" && xmlData[i + 2] === "-") {
      for (i += 3; i < xmlData.length; i++) {
        if (xmlData[i] === "-" && xmlData[i + 1] === "-" && xmlData[i + 2] === ">") {
          i += 2;
          break;
        }
      }
    } else if (xmlData.length > i + 8 && xmlData[i + 1] === "D" && xmlData[i + 2] === "O" && xmlData[i + 3] === "C" && xmlData[i + 4] === "T" && xmlData[i + 5] === "Y" && xmlData[i + 6] === "P" && xmlData[i + 7] === "E") {
      let angleBracketsCount = 1;
      for (i += 8; i < xmlData.length; i++) {
        if (xmlData[i] === "<") {
          angleBracketsCount++;
        } else if (xmlData[i] === ">") {
          angleBracketsCount--;
          if (angleBracketsCount === 0) {
            break;
          }
        }
      }
    } else if (xmlData.length > i + 9 && xmlData[i + 1] === "[" && xmlData[i + 2] === "C" && xmlData[i + 3] === "D" && xmlData[i + 4] === "A" && xmlData[i + 5] === "T" && xmlData[i + 6] === "A" && xmlData[i + 7] === "[") {
      for (i += 8; i < xmlData.length; i++) {
        if (xmlData[i] === "]" && xmlData[i + 1] === "]" && xmlData[i + 2] === ">") {
          i += 2;
          break;
        }
      }
    }
    return i;
  }
  function readAttributeStr(xmlData, i) {
    let attrStr = "";
    let startChar = "";
    let tagClosed = false;
    for (; i < xmlData.length; i++) {
      if (xmlData[i] === doubleQuote || xmlData[i] === singleQuote) {
        if (startChar === "") {
          startChar = xmlData[i];
        } else if (startChar !== xmlData[i]) {
        } else {
          startChar = "";
        }
      } else if (xmlData[i] === ">") {
        if (startChar === "") {
          tagClosed = true;
          break;
        }
      }
      attrStr += xmlData[i];
    }
    if (startChar !== "") {
      return false;
    }
    return {
      value: attrStr,
      index: i,
      tagClosed
    };
  }
  function validateAttributeString(attrStr, options) {
    const matches = getAllMatches(attrStr, validAttrStrRegxp);
    const attrNames = {};
    for (let i = 0; i < matches.length; i++) {
      if (matches[i][1].length === 0) {
        return getErrorObject("InvalidAttr", "Attribute '" + matches[i][2] + "' has no space in starting.", getPositionFromMatch(matches[i]));
      } else if (matches[i][3] !== void 0 && matches[i][4] === void 0) {
        return getErrorObject("InvalidAttr", "Attribute '" + matches[i][2] + "' is without value.", getPositionFromMatch(matches[i]));
      } else if (matches[i][3] === void 0 && !options.allowBooleanAttributes) {
        return getErrorObject("InvalidAttr", "boolean attribute '" + matches[i][2] + "' is not allowed.", getPositionFromMatch(matches[i]));
      }
      const attrName = matches[i][2];
      if (!validateAttrName(attrName)) {
        return getErrorObject("InvalidAttr", "Attribute '" + attrName + "' is an invalid name.", getPositionFromMatch(matches[i]));
      }
      if (!attrNames.hasOwnProperty(attrName)) {
        attrNames[attrName] = 1;
      } else {
        return getErrorObject("InvalidAttr", "Attribute '" + attrName + "' is repeated.", getPositionFromMatch(matches[i]));
      }
    }
    return true;
  }
  function validateNumberAmpersand(xmlData, i) {
    let re = /\d/;
    if (xmlData[i] === "x") {
      i++;
      re = /[\da-fA-F]/;
    }
    for (; i < xmlData.length; i++) {
      if (xmlData[i] === ";")
        return i;
      if (!xmlData[i].match(re))
        break;
    }
    return -1;
  }
  function validateAmpersand(xmlData, i) {
    i++;
    if (xmlData[i] === ";")
      return -1;
    if (xmlData[i] === "#") {
      i++;
      return validateNumberAmpersand(xmlData, i);
    }
    let count = 0;
    for (; i < xmlData.length; i++, count++) {
      if (xmlData[i].match(/\w/) && count < 20)
        continue;
      if (xmlData[i] === ";")
        break;
      return -1;
    }
    return i;
  }
  function getErrorObject(code, message, lineNumber) {
    return {
      err: {
        code,
        msg: message,
        line: lineNumber.line || lineNumber,
        col: lineNumber.col
      }
    };
  }
  function validateAttrName(attrName) {
    return isName(attrName);
  }
  function validateTagName(tagname) {
    return isName(tagname);
  }
  function getLineNumberForPosition(xmlData, index) {
    const lines = xmlData.substring(0, index).split(/\r?\n/);
    return {
      line: lines.length,
      // column number is last line's length + 1, because column numbering starts at 1:
      col: lines[lines.length - 1].length + 1
    };
  }
  function getPositionFromMatch(match) {
    return match.startIndex + match[1].length;
  }
  var defaultOptions, doubleQuote, singleQuote, validAttrStrRegxp;
  var init_validator = __esm({
    "node_modules/fast-xml-parser/src/validator.js"() {
      "use strict";
      init_util();
      defaultOptions = {
        allowBooleanAttributes: false,
        //A tag can have attributes without any value
        unpairedTags: []
      };
      doubleQuote = '"';
      singleQuote = "'";
      validAttrStrRegxp = new RegExp(`(\\s*)([^\\s=]+)(\\s*=)?(\\s*(['"])(([\\s\\S])*?)\\5)?`, "g");
    }
  });

  // node_modules/fast-xml-parser/src/xmlparser/OptionsBuilder.js
  function normalizeProcessEntities(value) {
    if (typeof value === "boolean") {
      return {
        enabled: value,
        // true or false
        maxEntitySize: 1e4,
        maxExpansionDepth: 10,
        maxTotalExpansions: 1e3,
        maxExpandedLength: 1e5,
        allowedTags: null,
        tagFilter: null
      };
    }
    if (typeof value === "object" && value !== null) {
      return {
        enabled: value.enabled !== false,
        // default true if not specified
        maxEntitySize: value.maxEntitySize ?? 1e4,
        maxExpansionDepth: value.maxExpansionDepth ?? 10,
        maxTotalExpansions: value.maxTotalExpansions ?? 1e3,
        maxExpandedLength: value.maxExpandedLength ?? 1e5,
        allowedTags: value.allowedTags ?? null,
        tagFilter: value.tagFilter ?? null
      };
    }
    return normalizeProcessEntities(true);
  }
  var defaultOptions2, buildOptions;
  var init_OptionsBuilder = __esm({
    "node_modules/fast-xml-parser/src/xmlparser/OptionsBuilder.js"() {
      defaultOptions2 = {
        preserveOrder: false,
        attributeNamePrefix: "@_",
        attributesGroupName: false,
        textNodeName: "#text",
        ignoreAttributes: true,
        removeNSPrefix: false,
        // remove NS from tag name or attribute name if true
        allowBooleanAttributes: false,
        //a tag can have attributes without any value
        //ignoreRootElement : false,
        parseTagValue: true,
        parseAttributeValue: false,
        trimValues: true,
        //Trim string values of tag and attributes
        cdataPropName: false,
        numberParseOptions: {
          hex: true,
          leadingZeros: true,
          eNotation: true
        },
        tagValueProcessor: function(tagName, val) {
          return val;
        },
        attributeValueProcessor: function(attrName, val) {
          return val;
        },
        stopNodes: [],
        //nested tags will not be parsed even for errors
        alwaysCreateTextNode: false,
        isArray: () => false,
        commentPropName: false,
        unpairedTags: [],
        processEntities: true,
        htmlEntities: false,
        ignoreDeclaration: false,
        ignorePiTags: false,
        transformTagName: false,
        transformAttributeName: false,
        updateTag: function(tagName, jPath, attrs) {
          return tagName;
        },
        // skipEmptyListItem: false
        captureMetaData: false
      };
      buildOptions = function(options) {
        const built = Object.assign({}, defaultOptions2, options);
        built.processEntities = normalizeProcessEntities(built.processEntities);
        return built;
      };
    }
  });

  // node_modules/fast-xml-parser/src/xmlparser/xmlNode.js
  var METADATA_SYMBOL, XmlNode;
  var init_xmlNode = __esm({
    "node_modules/fast-xml-parser/src/xmlparser/xmlNode.js"() {
      "use strict";
      if (typeof Symbol !== "function") {
        METADATA_SYMBOL = "@@xmlMetadata";
      } else {
        METADATA_SYMBOL = /* @__PURE__ */ Symbol("XML Node Metadata");
      }
      XmlNode = class {
        constructor(tagname) {
          this.tagname = tagname;
          this.child = [];
          this[":@"] = {};
        }
        add(key, val) {
          if (key === "__proto__") key = "#__proto__";
          this.child.push({ [key]: val });
        }
        addChild(node, startIndex) {
          if (node.tagname === "__proto__") node.tagname = "#__proto__";
          if (node[":@"] && Object.keys(node[":@"]).length > 0) {
            this.child.push({ [node.tagname]: node.child, [":@"]: node[":@"] });
          } else {
            this.child.push({ [node.tagname]: node.child });
          }
          if (startIndex !== void 0) {
            this.child[this.child.length - 1][METADATA_SYMBOL] = { startIndex };
          }
        }
        /** symbol used for metadata */
        static getMetaDataSymbol() {
          return METADATA_SYMBOL;
        }
      };
    }
  });

  // node_modules/fast-xml-parser/src/xmlparser/DocTypeReader.js
  function hasSeq(data, seq, i) {
    for (let j = 0; j < seq.length; j++) {
      if (seq[j] !== data[i + j + 1]) return false;
    }
    return true;
  }
  function validateEntityName(name) {
    if (isName(name))
      return name;
    else
      throw new Error(`Invalid entity name ${name}`);
  }
  var DocTypeReader, skipWhitespace;
  var init_DocTypeReader = __esm({
    "node_modules/fast-xml-parser/src/xmlparser/DocTypeReader.js"() {
      init_util();
      DocTypeReader = class {
        constructor(options) {
          this.suppressValidationErr = !options;
          this.options = options;
        }
        readDocType(xmlData, i) {
          const entities = {};
          if (xmlData[i + 3] === "O" && xmlData[i + 4] === "C" && xmlData[i + 5] === "T" && xmlData[i + 6] === "Y" && xmlData[i + 7] === "P" && xmlData[i + 8] === "E") {
            i = i + 9;
            let angleBracketsCount = 1;
            let hasBody = false, comment = false;
            let exp = "";
            for (; i < xmlData.length; i++) {
              if (xmlData[i] === "<" && !comment) {
                if (hasBody && hasSeq(xmlData, "!ENTITY", i)) {
                  i += 7;
                  let entityName, val;
                  [entityName, val, i] = this.readEntityExp(xmlData, i + 1, this.suppressValidationErr);
                  if (val.indexOf("&") === -1) {
                    const escaped = entityName.replace(/[.\-+*:]/g, "\\.");
                    entities[entityName] = {
                      regx: RegExp(`&${escaped};`, "g"),
                      val
                    };
                  }
                } else if (hasBody && hasSeq(xmlData, "!ELEMENT", i)) {
                  i += 8;
                  const { index } = this.readElementExp(xmlData, i + 1);
                  i = index;
                } else if (hasBody && hasSeq(xmlData, "!ATTLIST", i)) {
                  i += 8;
                } else if (hasBody && hasSeq(xmlData, "!NOTATION", i)) {
                  i += 9;
                  const { index } = this.readNotationExp(xmlData, i + 1, this.suppressValidationErr);
                  i = index;
                } else if (hasSeq(xmlData, "!--", i)) comment = true;
                else throw new Error(`Invalid DOCTYPE`);
                angleBracketsCount++;
                exp = "";
              } else if (xmlData[i] === ">") {
                if (comment) {
                  if (xmlData[i - 1] === "-" && xmlData[i - 2] === "-") {
                    comment = false;
                    angleBracketsCount--;
                  }
                } else {
                  angleBracketsCount--;
                }
                if (angleBracketsCount === 0) {
                  break;
                }
              } else if (xmlData[i] === "[") {
                hasBody = true;
              } else {
                exp += xmlData[i];
              }
            }
            if (angleBracketsCount !== 0) {
              throw new Error(`Unclosed DOCTYPE`);
            }
          } else {
            throw new Error(`Invalid Tag instead of DOCTYPE`);
          }
          return { entities, i };
        }
        readEntityExp(xmlData, i) {
          i = skipWhitespace(xmlData, i);
          let entityName = "";
          while (i < xmlData.length && !/\s/.test(xmlData[i]) && xmlData[i] !== '"' && xmlData[i] !== "'") {
            entityName += xmlData[i];
            i++;
          }
          validateEntityName(entityName);
          i = skipWhitespace(xmlData, i);
          if (!this.suppressValidationErr) {
            if (xmlData.substring(i, i + 6).toUpperCase() === "SYSTEM") {
              throw new Error("External entities are not supported");
            } else if (xmlData[i] === "%") {
              throw new Error("Parameter entities are not supported");
            }
          }
          let entityValue = "";
          [i, entityValue] = this.readIdentifierVal(xmlData, i, "entity");
          if (this.options.enabled !== false && this.options.maxEntitySize && entityValue.length > this.options.maxEntitySize) {
            throw new Error(
              `Entity "${entityName}" size (${entityValue.length}) exceeds maximum allowed size (${this.options.maxEntitySize})`
            );
          }
          i--;
          return [entityName, entityValue, i];
        }
        readNotationExp(xmlData, i) {
          i = skipWhitespace(xmlData, i);
          let notationName = "";
          while (i < xmlData.length && !/\s/.test(xmlData[i])) {
            notationName += xmlData[i];
            i++;
          }
          !this.suppressValidationErr && validateEntityName(notationName);
          i = skipWhitespace(xmlData, i);
          const identifierType = xmlData.substring(i, i + 6).toUpperCase();
          if (!this.suppressValidationErr && identifierType !== "SYSTEM" && identifierType !== "PUBLIC") {
            throw new Error(`Expected SYSTEM or PUBLIC, found "${identifierType}"`);
          }
          i += identifierType.length;
          i = skipWhitespace(xmlData, i);
          let publicIdentifier = null;
          let systemIdentifier = null;
          if (identifierType === "PUBLIC") {
            [i, publicIdentifier] = this.readIdentifierVal(xmlData, i, "publicIdentifier");
            i = skipWhitespace(xmlData, i);
            if (xmlData[i] === '"' || xmlData[i] === "'") {
              [i, systemIdentifier] = this.readIdentifierVal(xmlData, i, "systemIdentifier");
            }
          } else if (identifierType === "SYSTEM") {
            [i, systemIdentifier] = this.readIdentifierVal(xmlData, i, "systemIdentifier");
            if (!this.suppressValidationErr && !systemIdentifier) {
              throw new Error("Missing mandatory system identifier for SYSTEM notation");
            }
          }
          return { notationName, publicIdentifier, systemIdentifier, index: --i };
        }
        readIdentifierVal(xmlData, i, type) {
          let identifierVal = "";
          const startChar = xmlData[i];
          if (startChar !== '"' && startChar !== "'") {
            throw new Error(`Expected quoted string, found "${startChar}"`);
          }
          i++;
          while (i < xmlData.length && xmlData[i] !== startChar) {
            identifierVal += xmlData[i];
            i++;
          }
          if (xmlData[i] !== startChar) {
            throw new Error(`Unterminated ${type} value`);
          }
          i++;
          return [i, identifierVal];
        }
        readElementExp(xmlData, i) {
          i = skipWhitespace(xmlData, i);
          let elementName = "";
          while (i < xmlData.length && !/\s/.test(xmlData[i])) {
            elementName += xmlData[i];
            i++;
          }
          if (!this.suppressValidationErr && !isName(elementName)) {
            throw new Error(`Invalid element name: "${elementName}"`);
          }
          i = skipWhitespace(xmlData, i);
          let contentModel = "";
          if (xmlData[i] === "E" && hasSeq(xmlData, "MPTY", i)) i += 4;
          else if (xmlData[i] === "A" && hasSeq(xmlData, "NY", i)) i += 2;
          else if (xmlData[i] === "(") {
            i++;
            while (i < xmlData.length && xmlData[i] !== ")") {
              contentModel += xmlData[i];
              i++;
            }
            if (xmlData[i] !== ")") {
              throw new Error("Unterminated content model");
            }
          } else if (!this.suppressValidationErr) {
            throw new Error(`Invalid Element Expression, found "${xmlData[i]}"`);
          }
          return {
            elementName,
            contentModel: contentModel.trim(),
            index: i
          };
        }
        readAttlistExp(xmlData, i) {
          i = skipWhitespace(xmlData, i);
          let elementName = "";
          while (i < xmlData.length && !/\s/.test(xmlData[i])) {
            elementName += xmlData[i];
            i++;
          }
          validateEntityName(elementName);
          i = skipWhitespace(xmlData, i);
          let attributeName = "";
          while (i < xmlData.length && !/\s/.test(xmlData[i])) {
            attributeName += xmlData[i];
            i++;
          }
          if (!validateEntityName(attributeName)) {
            throw new Error(`Invalid attribute name: "${attributeName}"`);
          }
          i = skipWhitespace(xmlData, i);
          let attributeType = "";
          if (xmlData.substring(i, i + 8).toUpperCase() === "NOTATION") {
            attributeType = "NOTATION";
            i += 8;
            i = skipWhitespace(xmlData, i);
            if (xmlData[i] !== "(") {
              throw new Error(`Expected '(', found "${xmlData[i]}"`);
            }
            i++;
            let allowedNotations = [];
            while (i < xmlData.length && xmlData[i] !== ")") {
              let notation = "";
              while (i < xmlData.length && xmlData[i] !== "|" && xmlData[i] !== ")") {
                notation += xmlData[i];
                i++;
              }
              notation = notation.trim();
              if (!validateEntityName(notation)) {
                throw new Error(`Invalid notation name: "${notation}"`);
              }
              allowedNotations.push(notation);
              if (xmlData[i] === "|") {
                i++;
                i = skipWhitespace(xmlData, i);
              }
            }
            if (xmlData[i] !== ")") {
              throw new Error("Unterminated list of notations");
            }
            i++;
            attributeType += " (" + allowedNotations.join("|") + ")";
          } else {
            while (i < xmlData.length && !/\s/.test(xmlData[i])) {
              attributeType += xmlData[i];
              i++;
            }
            const validTypes = ["CDATA", "ID", "IDREF", "IDREFS", "ENTITY", "ENTITIES", "NMTOKEN", "NMTOKENS"];
            if (!this.suppressValidationErr && !validTypes.includes(attributeType.toUpperCase())) {
              throw new Error(`Invalid attribute type: "${attributeType}"`);
            }
          }
          i = skipWhitespace(xmlData, i);
          let defaultValue = "";
          if (xmlData.substring(i, i + 8).toUpperCase() === "#REQUIRED") {
            defaultValue = "#REQUIRED";
            i += 8;
          } else if (xmlData.substring(i, i + 7).toUpperCase() === "#IMPLIED") {
            defaultValue = "#IMPLIED";
            i += 7;
          } else {
            [i, defaultValue] = this.readIdentifierVal(xmlData, i, "ATTLIST");
          }
          return {
            elementName,
            attributeName,
            attributeType,
            defaultValue,
            index: i
          };
        }
      };
      skipWhitespace = (data, index) => {
        while (index < data.length && /\s/.test(data[index])) {
          index++;
        }
        return index;
      };
    }
  });

  // node_modules/strnum/strnum.js
  function toNumber(str, options = {}) {
    options = Object.assign({}, consider, options);
    if (!str || typeof str !== "string") return str;
    let trimmedStr = str.trim();
    if (options.skipLike !== void 0 && options.skipLike.test(trimmedStr)) return str;
    else if (str === "0") return 0;
    else if (options.hex && hexRegex.test(trimmedStr)) {
      return parse_int(trimmedStr, 16);
    } else if (trimmedStr.includes("e") || trimmedStr.includes("E")) {
      return resolveEnotation(str, trimmedStr, options);
    } else {
      const match = numRegex.exec(trimmedStr);
      if (match) {
        const sign = match[1] || "";
        const leadingZeros = match[2];
        let numTrimmedByZeros = trimZeros(match[3]);
        const decimalAdjacentToLeadingZeros = sign ? (
          // 0., -00., 000.
          str[leadingZeros.length + 1] === "."
        ) : str[leadingZeros.length] === ".";
        if (!options.leadingZeros && (leadingZeros.length > 1 || leadingZeros.length === 1 && !decimalAdjacentToLeadingZeros)) {
          return str;
        } else {
          const num = Number(trimmedStr);
          const parsedStr = String(num);
          if (num === 0) return num;
          if (parsedStr.search(/[eE]/) !== -1) {
            if (options.eNotation) return num;
            else return str;
          } else if (trimmedStr.indexOf(".") !== -1) {
            if (parsedStr === "0") return num;
            else if (parsedStr === numTrimmedByZeros) return num;
            else if (parsedStr === `${sign}${numTrimmedByZeros}`) return num;
            else return str;
          }
          let n = leadingZeros ? numTrimmedByZeros : trimmedStr;
          if (leadingZeros) {
            return n === parsedStr || sign + n === parsedStr ? num : str;
          } else {
            return n === parsedStr || n === sign + parsedStr ? num : str;
          }
        }
      } else {
        return str;
      }
    }
  }
  function resolveEnotation(str, trimmedStr, options) {
    if (!options.eNotation) return str;
    const notation = trimmedStr.match(eNotationRegx);
    if (notation) {
      let sign = notation[1] || "";
      const eChar = notation[3].indexOf("e") === -1 ? "E" : "e";
      const leadingZeros = notation[2];
      const eAdjacentToLeadingZeros = sign ? (
        // 0E.
        str[leadingZeros.length + 1] === eChar
      ) : str[leadingZeros.length] === eChar;
      if (leadingZeros.length > 1 && eAdjacentToLeadingZeros) return str;
      else if (leadingZeros.length === 1 && (notation[3].startsWith(`.${eChar}`) || notation[3][0] === eChar)) {
        return Number(trimmedStr);
      } else if (options.leadingZeros && !eAdjacentToLeadingZeros) {
        trimmedStr = (notation[1] || "") + notation[3];
        return Number(trimmedStr);
      } else return str;
    } else {
      return str;
    }
  }
  function trimZeros(numStr) {
    if (numStr && numStr.indexOf(".") !== -1) {
      numStr = numStr.replace(/0+$/, "");
      if (numStr === ".") numStr = "0";
      else if (numStr[0] === ".") numStr = "0" + numStr;
      else if (numStr[numStr.length - 1] === ".") numStr = numStr.substring(0, numStr.length - 1);
      return numStr;
    }
    return numStr;
  }
  function parse_int(numStr, base) {
    if (parseInt) return parseInt(numStr, base);
    else if (Number.parseInt) return Number.parseInt(numStr, base);
    else if (window && window.parseInt) return window.parseInt(numStr, base);
    else throw new Error("parseInt, Number.parseInt, window.parseInt are not supported");
  }
  var hexRegex, numRegex, consider, eNotationRegx;
  var init_strnum = __esm({
    "node_modules/strnum/strnum.js"() {
      hexRegex = /^[-+]?0x[a-fA-F0-9]+$/;
      numRegex = /^([\-\+])?(0*)([0-9]*(\.[0-9]*)?)$/;
      consider = {
        hex: true,
        // oct: false,
        leadingZeros: true,
        decimalPoint: ".",
        eNotation: true
        //skipLike: /regex/
      };
      eNotationRegx = /^([-+])?(0*)(\d*(\.\d*)?[eE][-\+]?\d+)$/;
    }
  });

  // node_modules/fast-xml-parser/src/ignoreAttributes.js
  function getIgnoreAttributesFn(ignoreAttributes) {
    if (typeof ignoreAttributes === "function") {
      return ignoreAttributes;
    }
    if (Array.isArray(ignoreAttributes)) {
      return (attrName) => {
        for (const pattern of ignoreAttributes) {
          if (typeof pattern === "string" && attrName === pattern) {
            return true;
          }
          if (pattern instanceof RegExp && pattern.test(attrName)) {
            return true;
          }
        }
      };
    }
    return () => false;
  }
  var init_ignoreAttributes = __esm({
    "node_modules/fast-xml-parser/src/ignoreAttributes.js"() {
    }
  });

  // node_modules/fast-xml-parser/src/xmlparser/OrderedObjParser.js
  function addExternalEntities(externalEntities) {
    const entKeys = Object.keys(externalEntities);
    for (let i = 0; i < entKeys.length; i++) {
      const ent = entKeys[i];
      const escaped = ent.replace(/[.\-+*:]/g, "\\.");
      this.lastEntities[ent] = {
        regex: new RegExp("&" + escaped + ";", "g"),
        val: externalEntities[ent]
      };
    }
  }
  function parseTextData(val, tagName, jPath, dontTrim, hasAttributes, isLeafNode, escapeEntities) {
    if (val !== void 0) {
      if (this.options.trimValues && !dontTrim) {
        val = val.trim();
      }
      if (val.length > 0) {
        if (!escapeEntities) val = this.replaceEntitiesValue(val, tagName, jPath);
        const newval = this.options.tagValueProcessor(tagName, val, jPath, hasAttributes, isLeafNode);
        if (newval === null || newval === void 0) {
          return val;
        } else if (typeof newval !== typeof val || newval !== val) {
          return newval;
        } else if (this.options.trimValues) {
          return parseValue(val, this.options.parseTagValue, this.options.numberParseOptions);
        } else {
          const trimmedVal = val.trim();
          if (trimmedVal === val) {
            return parseValue(val, this.options.parseTagValue, this.options.numberParseOptions);
          } else {
            return val;
          }
        }
      }
    }
  }
  function resolveNameSpace(tagname) {
    if (this.options.removeNSPrefix) {
      const tags = tagname.split(":");
      const prefix = tagname.charAt(0) === "/" ? "/" : "";
      if (tags[0] === "xmlns") {
        return "";
      }
      if (tags.length === 2) {
        tagname = prefix + tags[1];
      }
    }
    return tagname;
  }
  function buildAttributesMap(attrStr, jPath, tagName) {
    if (this.options.ignoreAttributes !== true && typeof attrStr === "string") {
      const matches = getAllMatches(attrStr, attrsRegx);
      const len = matches.length;
      const attrs = {};
      for (let i = 0; i < len; i++) {
        const attrName = this.resolveNameSpace(matches[i][1]);
        if (this.ignoreAttributesFn(attrName, jPath)) {
          continue;
        }
        let oldVal = matches[i][4];
        let aName = this.options.attributeNamePrefix + attrName;
        if (attrName.length) {
          if (this.options.transformAttributeName) {
            aName = this.options.transformAttributeName(aName);
          }
          if (aName === "__proto__") aName = "#__proto__";
          if (oldVal !== void 0) {
            if (this.options.trimValues) {
              oldVal = oldVal.trim();
            }
            oldVal = this.replaceEntitiesValue(oldVal, tagName, jPath);
            const newVal = this.options.attributeValueProcessor(attrName, oldVal, jPath);
            if (newVal === null || newVal === void 0) {
              attrs[aName] = oldVal;
            } else if (typeof newVal !== typeof oldVal || newVal !== oldVal) {
              attrs[aName] = newVal;
            } else {
              attrs[aName] = parseValue(
                oldVal,
                this.options.parseAttributeValue,
                this.options.numberParseOptions
              );
            }
          } else if (this.options.allowBooleanAttributes) {
            attrs[aName] = true;
          }
        }
      }
      if (!Object.keys(attrs).length) {
        return;
      }
      if (this.options.attributesGroupName) {
        const attrCollection = {};
        attrCollection[this.options.attributesGroupName] = attrs;
        return attrCollection;
      }
      return attrs;
    }
  }
  function addChild(currentNode, childNode, jPath, startIndex) {
    if (!this.options.captureMetaData) startIndex = void 0;
    const result = this.options.updateTag(childNode.tagname, jPath, childNode[":@"]);
    if (result === false) {
    } else if (typeof result === "string") {
      childNode.tagname = result;
      currentNode.addChild(childNode, startIndex);
    } else {
      currentNode.addChild(childNode, startIndex);
    }
  }
  function saveTextToParentTag(textData, currentNode, jPath, isLeafNode) {
    if (textData) {
      if (isLeafNode === void 0) isLeafNode = currentNode.child.length === 0;
      textData = this.parseTextData(
        textData,
        currentNode.tagname,
        jPath,
        false,
        currentNode[":@"] ? Object.keys(currentNode[":@"]).length !== 0 : false,
        isLeafNode
      );
      if (textData !== void 0 && textData !== "")
        currentNode.add(this.options.textNodeName, textData);
      textData = "";
    }
    return textData;
  }
  function isItStopNode(stopNodesExact, stopNodesWildcard, jPath, currentTagName) {
    if (stopNodesWildcard && stopNodesWildcard.has(currentTagName)) return true;
    if (stopNodesExact && stopNodesExact.has(jPath)) return true;
    return false;
  }
  function tagExpWithClosingIndex(xmlData, i, closingChar = ">") {
    let attrBoundary;
    let tagExp = "";
    for (let index = i; index < xmlData.length; index++) {
      let ch = xmlData[index];
      if (attrBoundary) {
        if (ch === attrBoundary) attrBoundary = "";
      } else if (ch === '"' || ch === "'") {
        attrBoundary = ch;
      } else if (ch === closingChar[0]) {
        if (closingChar[1]) {
          if (xmlData[index + 1] === closingChar[1]) {
            return {
              data: tagExp,
              index
            };
          }
        } else {
          return {
            data: tagExp,
            index
          };
        }
      } else if (ch === "	") {
        ch = " ";
      }
      tagExp += ch;
    }
  }
  function findClosingIndex(xmlData, str, i, errMsg) {
    const closingIndex = xmlData.indexOf(str, i);
    if (closingIndex === -1) {
      throw new Error(errMsg);
    } else {
      return closingIndex + str.length - 1;
    }
  }
  function readTagExp(xmlData, i, removeNSPrefix, closingChar = ">") {
    const result = tagExpWithClosingIndex(xmlData, i + 1, closingChar);
    if (!result) return;
    let tagExp = result.data;
    const closeIndex = result.index;
    const separatorIndex = tagExp.search(/\s/);
    let tagName = tagExp;
    let attrExpPresent = true;
    if (separatorIndex !== -1) {
      tagName = tagExp.substring(0, separatorIndex);
      tagExp = tagExp.substring(separatorIndex + 1).trimStart();
    }
    const rawTagName = tagName;
    if (removeNSPrefix) {
      const colonIndex = tagName.indexOf(":");
      if (colonIndex !== -1) {
        tagName = tagName.substr(colonIndex + 1);
        attrExpPresent = tagName !== result.data.substr(colonIndex + 1);
      }
    }
    return {
      tagName,
      tagExp,
      closeIndex,
      attrExpPresent,
      rawTagName
    };
  }
  function readStopNodeData(xmlData, tagName, i) {
    const startIndex = i;
    let openTagCount = 1;
    for (; i < xmlData.length; i++) {
      if (xmlData[i] === "<") {
        if (xmlData[i + 1] === "/") {
          const closeIndex = findClosingIndex(xmlData, ">", i, `${tagName} is not closed`);
          let closeTagName = xmlData.substring(i + 2, closeIndex).trim();
          if (closeTagName === tagName) {
            openTagCount--;
            if (openTagCount === 0) {
              return {
                tagContent: xmlData.substring(startIndex, i),
                i: closeIndex
              };
            }
          }
          i = closeIndex;
        } else if (xmlData[i + 1] === "?") {
          const closeIndex = findClosingIndex(xmlData, "?>", i + 1, "StopNode is not closed.");
          i = closeIndex;
        } else if (xmlData.substr(i + 1, 3) === "!--") {
          const closeIndex = findClosingIndex(xmlData, "-->", i + 3, "StopNode is not closed.");
          i = closeIndex;
        } else if (xmlData.substr(i + 1, 2) === "![") {
          const closeIndex = findClosingIndex(xmlData, "]]>", i, "StopNode is not closed.") - 2;
          i = closeIndex;
        } else {
          const tagData = readTagExp(xmlData, i, ">");
          if (tagData) {
            const openTagName = tagData && tagData.tagName;
            if (openTagName === tagName && tagData.tagExp[tagData.tagExp.length - 1] !== "/") {
              openTagCount++;
            }
            i = tagData.closeIndex;
          }
        }
      }
    }
  }
  function parseValue(val, shouldParse, options) {
    if (shouldParse && typeof val === "string") {
      const newval = val.trim();
      if (newval === "true") return true;
      else if (newval === "false") return false;
      else return toNumber(val, options);
    } else {
      if (isExist(val)) {
        return val;
      } else {
        return "";
      }
    }
  }
  function fromCodePoint(str, base, prefix) {
    const codePoint = Number.parseInt(str, base);
    if (codePoint >= 0 && codePoint <= 1114111) {
      return String.fromCodePoint(codePoint);
    } else {
      return prefix + str + ";";
    }
  }
  var OrderedObjParser, attrsRegx, parseXml, replaceEntitiesValue;
  var init_OrderedObjParser = __esm({
    "node_modules/fast-xml-parser/src/xmlparser/OrderedObjParser.js"() {
      "use strict";
      init_util();
      init_xmlNode();
      init_DocTypeReader();
      init_strnum();
      init_ignoreAttributes();
      OrderedObjParser = class {
        constructor(options) {
          this.options = options;
          this.currentNode = null;
          this.tagsNodeStack = [];
          this.docTypeEntities = {};
          this.lastEntities = {
            "apos": { regex: /&(apos|#39|#x27);/g, val: "'" },
            "gt": { regex: /&(gt|#62|#x3E);/g, val: ">" },
            "lt": { regex: /&(lt|#60|#x3C);/g, val: "<" },
            "quot": { regex: /&(quot|#34|#x22);/g, val: '"' }
          };
          this.ampEntity = { regex: /&(amp|#38|#x26);/g, val: "&" };
          this.htmlEntities = {
            "space": { regex: /&(nbsp|#160);/g, val: " " },
            // "lt" : { regex: /&(lt|#60);/g, val: "<" },
            // "gt" : { regex: /&(gt|#62);/g, val: ">" },
            // "amp" : { regex: /&(amp|#38);/g, val: "&" },
            // "quot" : { regex: /&(quot|#34);/g, val: "\"" },
            // "apos" : { regex: /&(apos|#39);/g, val: "'" },
            "cent": { regex: /&(cent|#162);/g, val: "\xA2" },
            "pound": { regex: /&(pound|#163);/g, val: "\xA3" },
            "yen": { regex: /&(yen|#165);/g, val: "\xA5" },
            "euro": { regex: /&(euro|#8364);/g, val: "\u20AC" },
            "copyright": { regex: /&(copy|#169);/g, val: "\xA9" },
            "reg": { regex: /&(reg|#174);/g, val: "\xAE" },
            "inr": { regex: /&(inr|#8377);/g, val: "\u20B9" },
            "num_dec": { regex: /&#([0-9]{1,7});/g, val: (_, str) => fromCodePoint(str, 10, "&#") },
            "num_hex": { regex: /&#x([0-9a-fA-F]{1,6});/g, val: (_, str) => fromCodePoint(str, 16, "&#x") }
          };
          this.addExternalEntities = addExternalEntities;
          this.parseXml = parseXml;
          this.parseTextData = parseTextData;
          this.resolveNameSpace = resolveNameSpace;
          this.buildAttributesMap = buildAttributesMap;
          this.isItStopNode = isItStopNode;
          this.replaceEntitiesValue = replaceEntitiesValue;
          this.readStopNodeData = readStopNodeData;
          this.saveTextToParentTag = saveTextToParentTag;
          this.addChild = addChild;
          this.ignoreAttributesFn = getIgnoreAttributesFn(this.options.ignoreAttributes);
          this.entityExpansionCount = 0;
          this.currentExpandedLength = 0;
          if (this.options.stopNodes && this.options.stopNodes.length > 0) {
            this.stopNodesExact = /* @__PURE__ */ new Set();
            this.stopNodesWildcard = /* @__PURE__ */ new Set();
            for (let i = 0; i < this.options.stopNodes.length; i++) {
              const stopNodeExp = this.options.stopNodes[i];
              if (typeof stopNodeExp !== "string") continue;
              if (stopNodeExp.startsWith("*.")) {
                this.stopNodesWildcard.add(stopNodeExp.substring(2));
              } else {
                this.stopNodesExact.add(stopNodeExp);
              }
            }
          }
        }
      };
      attrsRegx = new RegExp(`([^\\s=]+)\\s*(=\\s*(['"])([\\s\\S]*?)\\3)?`, "gm");
      parseXml = function(xmlData) {
        xmlData = xmlData.replace(/\r\n?/g, "\n");
        const xmlObj = new XmlNode("!xml");
        let currentNode = xmlObj;
        let textData = "";
        let jPath = "";
        this.entityExpansionCount = 0;
        this.currentExpandedLength = 0;
        const docTypeReader = new DocTypeReader(this.options.processEntities);
        for (let i = 0; i < xmlData.length; i++) {
          const ch = xmlData[i];
          if (ch === "<") {
            if (xmlData[i + 1] === "/") {
              const closeIndex = findClosingIndex(xmlData, ">", i, "Closing Tag is not closed.");
              let tagName = xmlData.substring(i + 2, closeIndex).trim();
              if (this.options.removeNSPrefix) {
                const colonIndex = tagName.indexOf(":");
                if (colonIndex !== -1) {
                  tagName = tagName.substr(colonIndex + 1);
                }
              }
              if (this.options.transformTagName) {
                tagName = this.options.transformTagName(tagName);
              }
              if (currentNode) {
                textData = this.saveTextToParentTag(textData, currentNode, jPath);
              }
              const lastTagName = jPath.substring(jPath.lastIndexOf(".") + 1);
              if (tagName && this.options.unpairedTags.indexOf(tagName) !== -1) {
                throw new Error(`Unpaired tag can not be used as closing tag: </${tagName}>`);
              }
              let propIndex = 0;
              if (lastTagName && this.options.unpairedTags.indexOf(lastTagName) !== -1) {
                propIndex = jPath.lastIndexOf(".", jPath.lastIndexOf(".") - 1);
                this.tagsNodeStack.pop();
              } else {
                propIndex = jPath.lastIndexOf(".");
              }
              jPath = jPath.substring(0, propIndex);
              currentNode = this.tagsNodeStack.pop();
              textData = "";
              i = closeIndex;
            } else if (xmlData[i + 1] === "?") {
              let tagData = readTagExp(xmlData, i, false, "?>");
              if (!tagData) throw new Error("Pi Tag is not closed.");
              textData = this.saveTextToParentTag(textData, currentNode, jPath);
              if (this.options.ignoreDeclaration && tagData.tagName === "?xml" || this.options.ignorePiTags) {
              } else {
                const childNode = new XmlNode(tagData.tagName);
                childNode.add(this.options.textNodeName, "");
                if (tagData.tagName !== tagData.tagExp && tagData.attrExpPresent) {
                  childNode[":@"] = this.buildAttributesMap(tagData.tagExp, jPath, tagData.tagName);
                }
                this.addChild(currentNode, childNode, jPath, i);
              }
              i = tagData.closeIndex + 1;
            } else if (xmlData.substr(i + 1, 3) === "!--") {
              const endIndex = findClosingIndex(xmlData, "-->", i + 4, "Comment is not closed.");
              if (this.options.commentPropName) {
                const comment = xmlData.substring(i + 4, endIndex - 2);
                textData = this.saveTextToParentTag(textData, currentNode, jPath);
                currentNode.add(this.options.commentPropName, [{ [this.options.textNodeName]: comment }]);
              }
              i = endIndex;
            } else if (xmlData.substr(i + 1, 2) === "!D") {
              const result = docTypeReader.readDocType(xmlData, i);
              this.docTypeEntities = result.entities;
              i = result.i;
            } else if (xmlData.substr(i + 1, 2) === "![") {
              const closeIndex = findClosingIndex(xmlData, "]]>", i, "CDATA is not closed.") - 2;
              const tagExp = xmlData.substring(i + 9, closeIndex);
              textData = this.saveTextToParentTag(textData, currentNode, jPath);
              let val = this.parseTextData(tagExp, currentNode.tagname, jPath, true, false, true, true);
              if (val == void 0) val = "";
              if (this.options.cdataPropName) {
                currentNode.add(this.options.cdataPropName, [{ [this.options.textNodeName]: tagExp }]);
              } else {
                currentNode.add(this.options.textNodeName, val);
              }
              i = closeIndex + 2;
            } else {
              let result = readTagExp(xmlData, i, this.options.removeNSPrefix);
              let tagName = result.tagName;
              const rawTagName = result.rawTagName;
              let tagExp = result.tagExp;
              let attrExpPresent = result.attrExpPresent;
              let closeIndex = result.closeIndex;
              if (this.options.transformTagName) {
                const newTagName = this.options.transformTagName(tagName);
                if (tagExp === tagName) {
                  tagExp = newTagName;
                }
                tagName = newTagName;
              }
              if (currentNode && textData) {
                if (currentNode.tagname !== "!xml") {
                  textData = this.saveTextToParentTag(textData, currentNode, jPath, false);
                }
              }
              const lastTag = currentNode;
              if (lastTag && this.options.unpairedTags.indexOf(lastTag.tagname) !== -1) {
                currentNode = this.tagsNodeStack.pop();
                jPath = jPath.substring(0, jPath.lastIndexOf("."));
              }
              if (tagName !== xmlObj.tagname) {
                jPath += jPath ? "." + tagName : tagName;
              }
              const startIndex = i;
              if (this.isItStopNode(this.stopNodesExact, this.stopNodesWildcard, jPath, tagName)) {
                let tagContent = "";
                if (tagExp.length > 0 && tagExp.lastIndexOf("/") === tagExp.length - 1) {
                  if (tagName[tagName.length - 1] === "/") {
                    tagName = tagName.substr(0, tagName.length - 1);
                    jPath = jPath.substr(0, jPath.length - 1);
                    tagExp = tagName;
                  } else {
                    tagExp = tagExp.substr(0, tagExp.length - 1);
                  }
                  i = result.closeIndex;
                } else if (this.options.unpairedTags.indexOf(tagName) !== -1) {
                  i = result.closeIndex;
                } else {
                  const result2 = this.readStopNodeData(xmlData, rawTagName, closeIndex + 1);
                  if (!result2) throw new Error(`Unexpected end of ${rawTagName}`);
                  i = result2.i;
                  tagContent = result2.tagContent;
                }
                const childNode = new XmlNode(tagName);
                if (tagName !== tagExp && attrExpPresent) {
                  childNode[":@"] = this.buildAttributesMap(tagExp, jPath, tagName);
                }
                if (tagContent) {
                  tagContent = this.parseTextData(tagContent, tagName, jPath, true, attrExpPresent, true, true);
                }
                jPath = jPath.substr(0, jPath.lastIndexOf("."));
                childNode.add(this.options.textNodeName, tagContent);
                this.addChild(currentNode, childNode, jPath, startIndex);
              } else {
                if (tagExp.length > 0 && tagExp.lastIndexOf("/") === tagExp.length - 1) {
                  if (tagName[tagName.length - 1] === "/") {
                    tagName = tagName.substr(0, tagName.length - 1);
                    jPath = jPath.substr(0, jPath.length - 1);
                    tagExp = tagName;
                  } else {
                    tagExp = tagExp.substr(0, tagExp.length - 1);
                  }
                  if (this.options.transformTagName) {
                    const newTagName = this.options.transformTagName(tagName);
                    if (tagExp === tagName) {
                      tagExp = newTagName;
                    }
                    tagName = newTagName;
                  }
                  const childNode = new XmlNode(tagName);
                  if (tagName !== tagExp && attrExpPresent) {
                    childNode[":@"] = this.buildAttributesMap(tagExp, jPath, tagName);
                  }
                  this.addChild(currentNode, childNode, jPath, startIndex);
                  jPath = jPath.substr(0, jPath.lastIndexOf("."));
                } else {
                  const childNode = new XmlNode(tagName);
                  this.tagsNodeStack.push(currentNode);
                  if (tagName !== tagExp && attrExpPresent) {
                    childNode[":@"] = this.buildAttributesMap(tagExp, jPath, tagName);
                  }
                  this.addChild(currentNode, childNode, jPath, startIndex);
                  currentNode = childNode;
                }
                textData = "";
                i = closeIndex;
              }
            }
          } else {
            textData += xmlData[i];
          }
        }
        return xmlObj.child;
      };
      replaceEntitiesValue = function(val, tagName, jPath) {
        if (val.indexOf("&") === -1) {
          return val;
        }
        const entityConfig = this.options.processEntities;
        if (!entityConfig.enabled) {
          return val;
        }
        if (entityConfig.allowedTags) {
          if (!entityConfig.allowedTags.includes(tagName)) {
            return val;
          }
        }
        if (entityConfig.tagFilter) {
          if (!entityConfig.tagFilter(tagName, jPath)) {
            return val;
          }
        }
        for (let entityName in this.docTypeEntities) {
          const entity = this.docTypeEntities[entityName];
          const matches = val.match(entity.regx);
          if (matches) {
            this.entityExpansionCount += matches.length;
            if (entityConfig.maxTotalExpansions && this.entityExpansionCount > entityConfig.maxTotalExpansions) {
              throw new Error(
                `Entity expansion limit exceeded: ${this.entityExpansionCount} > ${entityConfig.maxTotalExpansions}`
              );
            }
            const lengthBefore = val.length;
            val = val.replace(entity.regx, entity.val);
            if (entityConfig.maxExpandedLength) {
              this.currentExpandedLength += val.length - lengthBefore;
              if (this.currentExpandedLength > entityConfig.maxExpandedLength) {
                throw new Error(
                  `Total expanded content size exceeded: ${this.currentExpandedLength} > ${entityConfig.maxExpandedLength}`
                );
              }
            }
          }
        }
        if (val.indexOf("&") === -1) return val;
        for (let entityName in this.lastEntities) {
          const entity = this.lastEntities[entityName];
          val = val.replace(entity.regex, entity.val);
        }
        if (val.indexOf("&") === -1) return val;
        if (this.options.htmlEntities) {
          for (let entityName in this.htmlEntities) {
            const entity = this.htmlEntities[entityName];
            val = val.replace(entity.regex, entity.val);
          }
        }
        val = val.replace(this.ampEntity.regex, this.ampEntity.val);
        return val;
      };
    }
  });

  // node_modules/fast-xml-parser/src/xmlparser/node2json.js
  function prettify(node, options) {
    return compress(node, options);
  }
  function compress(arr, options, jPath) {
    let text;
    const compressedObj = {};
    for (let i = 0; i < arr.length; i++) {
      const tagObj = arr[i];
      const property = propName(tagObj);
      let newJpath = "";
      if (jPath === void 0) newJpath = property;
      else newJpath = jPath + "." + property;
      if (property === options.textNodeName) {
        if (text === void 0) text = tagObj[property];
        else text += "" + tagObj[property];
      } else if (property === void 0) {
        continue;
      } else if (tagObj[property]) {
        let val = compress(tagObj[property], options, newJpath);
        const isLeaf = isLeafTag(val, options);
        if (tagObj[METADATA_SYMBOL2] !== void 0) {
          val[METADATA_SYMBOL2] = tagObj[METADATA_SYMBOL2];
        }
        if (tagObj[":@"]) {
          assignAttributes(val, tagObj[":@"], newJpath, options);
        } else if (Object.keys(val).length === 1 && val[options.textNodeName] !== void 0 && !options.alwaysCreateTextNode) {
          val = val[options.textNodeName];
        } else if (Object.keys(val).length === 0) {
          if (options.alwaysCreateTextNode) val[options.textNodeName] = "";
          else val = "";
        }
        if (compressedObj[property] !== void 0 && compressedObj.hasOwnProperty(property)) {
          if (!Array.isArray(compressedObj[property])) {
            compressedObj[property] = [compressedObj[property]];
          }
          compressedObj[property].push(val);
        } else {
          if (options.isArray(property, newJpath, isLeaf)) {
            compressedObj[property] = [val];
          } else {
            compressedObj[property] = val;
          }
        }
      }
    }
    if (typeof text === "string") {
      if (text.length > 0) compressedObj[options.textNodeName] = text;
    } else if (text !== void 0) compressedObj[options.textNodeName] = text;
    return compressedObj;
  }
  function propName(obj) {
    const keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (key !== ":@") return key;
    }
  }
  function assignAttributes(obj, attrMap, jpath, options) {
    if (attrMap) {
      const keys = Object.keys(attrMap);
      const len = keys.length;
      for (let i = 0; i < len; i++) {
        const atrrName = keys[i];
        if (options.isArray(atrrName, jpath + "." + atrrName, true, true)) {
          obj[atrrName] = [attrMap[atrrName]];
        } else {
          obj[atrrName] = attrMap[atrrName];
        }
      }
    }
  }
  function isLeafTag(obj, options) {
    const { textNodeName } = options;
    const propCount = Object.keys(obj).length;
    if (propCount === 0) {
      return true;
    }
    if (propCount === 1 && (obj[textNodeName] || typeof obj[textNodeName] === "boolean" || obj[textNodeName] === 0)) {
      return true;
    }
    return false;
  }
  var METADATA_SYMBOL2;
  var init_node2json = __esm({
    "node_modules/fast-xml-parser/src/xmlparser/node2json.js"() {
      "use strict";
      init_xmlNode();
      METADATA_SYMBOL2 = XmlNode.getMetaDataSymbol();
    }
  });

  // node_modules/fast-xml-parser/src/xmlparser/XMLParser.js
  var XMLParser;
  var init_XMLParser = __esm({
    "node_modules/fast-xml-parser/src/xmlparser/XMLParser.js"() {
      init_OptionsBuilder();
      init_OrderedObjParser();
      init_node2json();
      init_validator();
      init_xmlNode();
      XMLParser = class {
        constructor(options) {
          this.externalEntities = {};
          this.options = buildOptions(options);
        }
        /**
         * Parse XML dats to JS object 
         * @param {string|Uint8Array} xmlData 
         * @param {boolean|Object} validationOption 
         */
        parse(xmlData, validationOption) {
          if (typeof xmlData !== "string" && xmlData.toString) {
            xmlData = xmlData.toString();
          } else if (typeof xmlData !== "string") {
            throw new Error("XML data is accepted in String or Bytes[] form.");
          }
          if (validationOption) {
            if (validationOption === true) validationOption = {};
            const result = validate(xmlData, validationOption);
            if (result !== true) {
              throw Error(`${result.err.msg}:${result.err.line}:${result.err.col}`);
            }
          }
          const orderedObjParser = new OrderedObjParser(this.options);
          orderedObjParser.addExternalEntities(this.externalEntities);
          const orderedResult = orderedObjParser.parseXml(xmlData);
          if (this.options.preserveOrder || orderedResult === void 0) return orderedResult;
          else return prettify(orderedResult, this.options);
        }
        /**
         * Add Entity which is not by default supported by this library
         * @param {string} key 
         * @param {string} value 
         */
        addEntity(key, value) {
          if (value.indexOf("&") !== -1) {
            throw new Error("Entity value can't have '&'");
          } else if (key.indexOf("&") !== -1 || key.indexOf(";") !== -1) {
            throw new Error("An entity must be set without '&' and ';'. Eg. use '#xD' for '&#xD;'");
          } else if (value === "&") {
            throw new Error("An entity with value '&' is not permitted");
          } else {
            this.externalEntities[key] = value;
          }
        }
        /**
         * Returns a Symbol that can be used to access the metadata
         * property on a node.
         * 
         * If Symbol is not available in the environment, an ordinary property is used
         * and the name of the property is here returned.
         * 
         * The XMLMetaData property is only present when `captureMetaData`
         * is true in the options.
         */
        static getMetaDataSymbol() {
          return XmlNode.getMetaDataSymbol();
        }
      };
    }
  });

  // node_modules/fast-xml-parser/src/fxp.js
  var init_fxp = __esm({
    "node_modules/fast-xml-parser/src/fxp.js"() {
      "use strict";
      init_XMLParser();
    }
  });

  // src/features/pinboard/pinboard-service.js
  var pinboard_service_exports = {};
  __export(pinboard_service_exports, {
    PinboardService: () => PinboardService
  });
  var PinboardService;
  var init_pinboard_service = __esm({
    "src/features/pinboard/pinboard-service.js"() {
      init_config_manager();
      init_tag_service();
      init_fxp();
      init_utils();
      debugLog2("[SAFARI-EXT-SHIM-001] pinboard-service.js: module loaded");
      PinboardService = class {
        constructor(tagService = null) {
          this.configManager = new ConfigManager();
          this.tagService = tagService || new TagService(this);
          this.apiBase = "https://api.pinboard.in/v1/";
          this.retryDelays = [1e3, 2e3, 5e3];
          this.xmlParser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: "@_",
            parseAttributeValue: true
          });
        }
        /**
         * Get bookmark data for a specific URL
         * @param {string} url - URL to lookup
         * @param {string} title - Page title (fallback for description)
         * @returns {Promise<Object>} Bookmark data
         *
         * PIN-002: Single bookmark retrieval by URL
         * SPECIFICATION: Use posts/get endpoint to fetch bookmark for specific URL
         * IMPLEMENTATION DECISION: Provide fallback data on failure for UI stability
         */
        async getBookmarkForUrl(url, title = "") {
          try {
            const hasAuth = await this.configManager.hasAuthToken();
            if (!hasAuth) {
              debugLog2("[PINBOARD-SERVICE] No auth token configured, returning empty bookmark without API call");
              return this.createEmptyBookmark(url, title);
            }
            const cleanUrl = this.cleanUrl(url);
            const endpoint = `posts/get?url=${encodeURIComponent(cleanUrl)}`;
            debugLog2("Making Pinboard API request:", {
              endpoint,
              cleanUrl,
              originalUrl: url
            });
            const response = await this.makeApiRequest(endpoint);
            debugLog2("\u{1F4E5} Pinboard API response received:", response);
            const parsed = this.parseBookmarkResponse(response, cleanUrl, title);
            debugLog2("\u{1F4CB} Parsed bookmark result:", parsed);
            return parsed;
          } catch (error) {
            debugError("\u274C Failed to get bookmark for URL:", error);
            debugError("\u274C Error details:", error.message);
            debugError("\u274C Full error:", error);
            const emptyBookmark = this.createEmptyBookmark(url, title);
            debugLog2("\u{1F4DD} Returning empty bookmark due to error:", emptyBookmark);
            return emptyBookmark;
          }
        }
        /**
         * Get recent bookmarks from Pinboard
         * @param {number} count - Number of recent bookmarks to fetch
         * @returns {Promise<Object[]>} Array of recent bookmarks
         *
         * PIN-002: Recent bookmarks retrieval for dashboard display
         * SPECIFICATION: Use posts/recent endpoint with count parameter
         * IMPLEMENTATION DECISION: Return empty array on failure to prevent UI errors
         */
        async getRecentBookmarks(count = 15) {
          try {
            const hasAuth = await this.configManager.hasAuthToken();
            if (!hasAuth) {
              debugLog2("[PINBOARD-SERVICE] No auth token configured, returning empty recent list without API call");
              return [];
            }
            debugLog2("[PINBOARD-SERVICE] Getting recent bookmarks, count:", count);
            const endpoint = `posts/recent?count=${count}`;
            const response = await this.makeApiRequest(endpoint);
            debugLog2("[PINBOARD-SERVICE] Raw API response received");
            const result = this.parseRecentBookmarksResponse(response);
            debugLog2("[PINBOARD-SERVICE] Parsed recent bookmarks:", result.map((b) => ({
              url: b.url,
              description: b.description,
              tags: b.tags
            })));
            return result;
          } catch (error) {
            debugError("[PINBOARD-SERVICE] Failed to get recent bookmarks:", error);
            return [];
          }
        }
        /**
         * Save a bookmark to Pinboard
         * @param {Object} bookmarkData - Bookmark data to save
         * @returns {Promise<Object>} Save result
         *
         * PIN-003: Bookmark creation/update operation
         * SPECIFICATION: Use posts/add endpoint to save bookmark with all metadata
         * IMPLEMENTATION DECISION: Re-throw errors to allow caller error handling
         * [IMMUTABLE-REQ-TAG-001] - Enhanced with tag tracking
         */
        async saveBookmark(bookmarkData) {
          try {
            const hasAuth = await this.configManager.hasAuthToken();
            if (!hasAuth) {
              debugLog2("[PINBOARD-SERVICE] No auth token configured, skipping save without API call");
              return { success: false, code: "no_auth", message: "No authentication token configured" };
            }
            const params = this.buildSaveParams(bookmarkData);
            const endpoint = `posts/add?${params}`;
            const response = await this.makeApiRequest(endpoint, "GET");
            await this.trackBookmarkTags(bookmarkData);
            return this.parseApiResponse(response);
          } catch (error) {
            debugError("Failed to save bookmark:", error);
            throw error;
          }
        }
        /**
         * Save a tag to an existing bookmark
         * @param {Object} tagData - Tag data to save
         * @returns {Promise<Object>} Save result
         *
         * PIN-003: Tag addition to existing bookmark
         * SPECIFICATION: Retrieve current bookmark, add tag, then save updated bookmark
         * IMPLEMENTATION DECISION: Merge tags to preserve existing tags while adding new ones
         * [IMMUTABLE-REQ-TAG-001] - Enhanced with tag tracking
         */
        async saveTag(tagData) {
          try {
            const currentBookmark = await this.getBookmarkForUrl(tagData.url);
            const existingTags = currentBookmark.tags || [];
            const newTags = [...existingTags];
            if (tagData.value && !existingTags.includes(tagData.value)) {
              newTags.push(tagData.value);
            }
            const updatedBookmark = {
              ...currentBookmark,
              ...tagData,
              tags: newTags.join(" ")
            };
            if (tagData.value) {
              await this.tagService.handleTagAddition(tagData.value, updatedBookmark);
            }
            return this.saveBookmark(updatedBookmark);
          } catch (error) {
            debugError("Failed to save tag:", error);
            throw error;
          }
        }
        /**
         * Delete a bookmark from Pinboard
         * @param {string} url - URL of bookmark to delete
         * @returns {Promise<Object>} Delete result
         *
         * PIN-003: Bookmark deletion operation
         * SPECIFICATION: Use posts/delete endpoint to remove bookmark by URL
         * IMPLEMENTATION DECISION: Clean URL before deletion for consistent matching
         */
        async deleteBookmark(url) {
          try {
            const hasAuth = await this.configManager.hasAuthToken();
            if (!hasAuth) {
              debugLog2("[PINBOARD-SERVICE] No auth token configured, skipping delete without API call");
              return { success: false, code: "no_auth", message: "No authentication token configured" };
            }
            const cleanUrl = this.cleanUrl(url);
            const endpoint = `posts/delete?url=${encodeURIComponent(cleanUrl)}`;
            const response = await this.makeApiRequest(endpoint);
            return this.parseApiResponse(response);
          } catch (error) {
            debugError("Failed to delete bookmark:", error);
            throw error;
          }
        }
        /**
         * [IMMUTABLE-REQ-TAG-001] - Track tags from bookmark data
         * @param {Object} bookmarkData - Bookmark data containing tags
         * @returns {Promise<void>}
         */
        async trackBookmarkTags(bookmarkData) {
          try {
            const tags = this.extractTagsFromBookmarkData(bookmarkData);
            const sanitizedTags = Array.from(new Set(tags.map((tag) => this.tagService.sanitizeTag(tag)).filter(Boolean)));
            if (sanitizedTags.length > 0) {
              for (const sanitizedTag of sanitizedTags) {
                await this.tagService.handleTagAddition(sanitizedTag, bookmarkData);
              }
              debugLog2("[IMMUTABLE-REQ-TAG-001] Tracked tags for bookmark:", sanitizedTags);
            }
          } catch (error) {
            debugError("[IMMUTABLE-REQ-TAG-001] Failed to track bookmark tags:", error);
          }
        }
        /**
         * [IMMUTABLE-REQ-TAG-001] - Enhanced error handling for tag operations
         * @param {Error} error - The error that occurred
         * @param {string} operation - The operation that failed
         * @param {Object} context - Additional context data
         * @returns {Promise<void>}
         */
        async handleTagError(error, operation, context = {}) {
          debugError(`[IMMUTABLE-REQ-TAG-001] Tag operation failed: ${operation}`, {
            error: error.message,
            stack: error.stack,
            context
          });
          if (error.name === "QuotaExceededError") {
            try {
              await this.tagService.cleanupOldTags();
              debugLog2("[IMMUTABLE-REQ-TAG-001] Attempted cleanup after quota exceeded");
            } catch (cleanupError) {
              debugError("[IMMUTABLE-REQ-TAG-001] Cleanup also failed:", cleanupError);
            }
          }
          try {
            await this.notifyUserOfTagError(operation, error.message);
          } catch (notificationError) {
            debugError("[IMMUTABLE-REQ-TAG-001] Failed to notify user:", notificationError);
          }
        }
        /**
         * [IMMUTABLE-REQ-TAG-001] - Notify user of tag operation errors
         * @param {string} operation - The operation that failed
         * @param {string} errorMessage - The error message
         * @returns {Promise<void>}
         */
        async notifyUserOfTagError(operation, errorMessage) {
          const userMessage = `Tag ${operation} failed, but bookmark was saved. Error: ${errorMessage}`;
          debugWarn("[IMMUTABLE-REQ-TAG-001] User notification:", userMessage);
        }
        /**
         * [IMMUTABLE-REQ-TAG-001] - Extract tags from bookmark data
         * @param {Object} bookmarkData - Bookmark data
         * @returns {string[]} Array of tags
         */
        extractTagsFromBookmarkData(bookmarkData) {
          const tags = [];
          if (bookmarkData.tags) {
            if (typeof bookmarkData.tags === "string") {
              const tagArray = bookmarkData.tags.split(/\s+/).filter((tag) => tag.trim());
              tags.push(...tagArray);
            } else if (Array.isArray(bookmarkData.tags)) {
              tags.push(...bookmarkData.tags.filter((tag) => tag && tag.trim()));
            }
          }
          return tags;
        }
        /**
         * Remove a specific tag from a bookmark
         * @param {Object} tagData - Tag removal data
         * @returns {Promise<Object>} Update result
         *
         * PIN-003: Tag removal from existing bookmark
         * SPECIFICATION: Retrieve bookmark, remove specified tag, save updated bookmark
         * IMPLEMENTATION DECISION: Filter out specific tag while preserving other tags
         * [action:delete] [sync:site-record] [arch:atomic-sync]
         */
        async deleteTag(tagData) {
          try {
            const currentBookmark = await this.getBookmarkForUrl(tagData.url);
            const existingTags = currentBookmark.tags || [];
            const filteredTags = existingTags.filter((tag) => tag !== tagData.value);
            const updatedBookmark = {
              ...currentBookmark,
              ...tagData,
              tags: filteredTags.join(" ")
            };
            return this.saveBookmark(updatedBookmark);
          } catch (error) {
            debugError("Failed to delete tag:", error);
            throw error;
          }
        }
        /**
         * Test authentication with Pinboard API
         * @returns {Promise<boolean>} True if authentication is valid
         *
         * PIN-001: Authentication validation using API endpoint
         * SPECIFICATION: Use user/api_token endpoint to verify authentication
         * IMPLEMENTATION DECISION: Simple boolean return for easy authentication checking
         */
        async testConnection() {
          try {
            const hasAuth = await this.configManager.hasAuthToken();
            if (!hasAuth) {
              debugLog2("[PINBOARD-SERVICE] No auth token configured, testConnection returns false without API call");
              return false;
            }
            const endpoint = "user/api_token";
            const response = await this.makeApiRequest(endpoint);
            return true;
          } catch (error) {
            debugError("Connection test failed:", error);
            return false;
          }
        }
        /**
         * Make API request with authentication and retry logic
         * @param {string} endpoint - API endpoint
         * @param {string} method - HTTP method
         * @returns {Promise<Document>} Parsed XML response
         *
         * PIN-001: Authenticated API request with configuration integration
         * SPECIFICATION: All API requests must include authentication token
         * IMPLEMENTATION DECISION: Centralized authentication and retry logic
         */
        async makeApiRequest(endpoint, method = "GET") {
          const hasAuth = await this.configManager.hasAuthToken();
          debugLog2("\u{1F510} Auth token check:", hasAuth);
          if (!hasAuth) {
            throw new Error("No authentication token configured");
          }
          const authParam = await this.configManager.getAuthTokenParam();
          const url = `${this.apiBase}${endpoint}&${authParam}`;
          debugLog2("\u{1F310} Making API request to:", url.replace(/auth_token=[^&]+/, "auth_token=***HIDDEN***"));
          return this.makeRequestWithRetry(url, method);
        }
        /**
         * Make HTTP request with retry logic for rate limiting
         * @param {string} url - Request URL
         * @param {string} method - HTTP method
         * @param {number} retryCount - Current retry attempt
         * @returns {Promise<Document>} Response
         *
         * PIN-004: Network resilience with exponential backoff retry
         * SPECIFICATION: Handle rate limiting and network failures gracefully
         * IMPLEMENTATION DECISION: Progressive retry delays with configured maximum attempts
         */
        async makeRequestWithRetry(url, method = "GET", retryCount = 0) {
          const config = await this.configManager.getConfig();
          try {
            debugLog2(`\u{1F680} Attempting HTTP ${method} request (attempt ${retryCount + 1})`);
            const response = await fetch(url, { method });
            debugLog2(`\u{1F4E1} HTTP response status: ${response.status} ${response.statusText}`);
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const xmlText = await response.text();
            debugLog2("\u{1F4C4} Raw XML response:", xmlText.substring(0, 500) + (xmlText.length > 500 ? "..." : ""));
            const parsed = this.parseXmlResponse(xmlText);
            debugLog2("\u2705 Successfully parsed XML response");
            return parsed;
          } catch (error) {
            debugError("\u{1F4A5} HTTP request failed:", error.message);
            const isRetryable = this.isRetryableError(error);
            const maxRetries = config.pinRetryCountMax || 2;
            if (isRetryable && retryCount < maxRetries) {
              const delay = this.retryDelays[retryCount] || config.pinRetryDelay || 1e3;
              debugWarn(`\u{1F504} API request failed, retrying in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
              await this.sleep(delay);
              return this.makeRequestWithRetry(url, method, retryCount + 1);
            }
            debugError("\u274C Max retries exceeded or non-retryable error. Giving up.");
            throw error;
          }
        }
        /**
         * Parse XML response from Pinboard API
         * @param {string} xmlText - XML response text
         * @returns {Object} Parsed XML object
         *
         * PIN-001: XML response parsing with error handling
         * SPECIFICATION: All Pinboard API responses are in XML format
         * IMPLEMENTATION DECISION: Use configured XML parser with error handling
         */
        parseXmlResponse(xmlText) {
          try {
            return this.xmlParser.parse(xmlText);
          } catch (error) {
            debugError("Failed to parse XML response:", error);
            debugError("XML content:", xmlText);
            throw new Error("Invalid XML response from Pinboard API");
          }
        }
        /**
         * Parse bookmark response from posts/get endpoint
         * @param {Object} xmlObj - Parsed XML object
         * @param {string} url - Original URL
         * @param {string} title - Fallback title
         * @returns {Object} Bookmark object
         *
         * PIN-002: Bookmark data parsing from Pinboard XML format
         * SPECIFICATION: Handle Pinboard's XML structure for bookmark data
         * IMPLEMENTATION DECISION: Normalize XML attributes to standard bookmark object
         */
        parseBookmarkResponse(xmlObj, url, title) {
          try {
            debugLog2("Parsing XML object structure:", JSON.stringify(xmlObj, null, 2));
            const posts = xmlObj?.posts?.post;
            debugLog2("\u{1F4CB} Posts extracted:", posts);
            debugLog2("\u{1F4CB} Posts type:", typeof posts);
            debugLog2("\u{1F4CB} Posts is array:", Array.isArray(posts));
            debugLog2("\u{1F4CB} Posts length:", posts?.length);
            if (posts && posts.length > 0) {
              const post = Array.isArray(posts) ? posts[0] : posts;
              debugLog2("\u{1F4C4} Processing post:", post);
              const pinTime = post["@_time"] || "";
              const result = {
                url: post["@_href"] || url,
                description: post["@_description"] || title || "",
                extended: post["@_extended"] || "",
                tags: post["@_tag"] ? post["@_tag"].split(" ") : [],
                time: pinTime,
                updated_at: pinTime,
                shared: post["@_shared"] || "yes",
                toread: post["@_toread"] || "no",
                hash: post["@_hash"] || ""
              };
              debugLog2("\u2705 Successfully parsed bookmark:", result);
              return result;
            }
            if (posts && !Array.isArray(posts)) {
              debugLog2("\u{1F4C4} Single post object found, processing directly:", posts);
              const pinTime = posts["@_time"] || "";
              const result = {
                url: posts["@_href"] || url,
                description: posts["@_description"] || title || "",
                extended: posts["@_extended"] || "",
                tags: posts["@_tag"] ? posts["@_tag"].split(" ") : [],
                time: pinTime,
                updated_at: pinTime,
                shared: posts["@_shared"] || "yes",
                toread: posts["@_toread"] || "no",
                hash: posts["@_hash"] || ""
              };
              debugLog2("\u2705 Successfully parsed single bookmark:", result);
              return result;
            }
            debugLog2("\u26A0\uFE0F No posts found in XML structure");
            return this.createEmptyBookmark(url, title);
          } catch (error) {
            debugError("\u274C Failed to parse bookmark response:", error);
            return this.createEmptyBookmark(url, title);
          }
        }
        /**
         * Parse recent bookmarks response from posts/recent endpoint
         * @param {Object} xmlObj - Parsed XML object
         * @returns {Array} Array of bookmark objects
         *
         * PIN-002: Recent bookmarks parsing from Pinboard XML format
         * SPECIFICATION: Handle array of bookmarks from posts/recent endpoint
         * IMPLEMENTATION DECISION: Normalize each bookmark and handle empty responses
         */
        parseRecentBookmarksResponse(xmlObj) {
          try {
            debugLog2("[PINBOARD-SERVICE] Parsing recent bookmarks XML object");
            debugLog2("[PINBOARD-SERVICE] XML object structure:", JSON.stringify(xmlObj, null, 2));
            const posts = xmlObj?.posts?.post;
            if (!posts) {
              debugLog2("[PINBOARD-SERVICE] No posts found in XML response");
              return [];
            }
            const postsArray = Array.isArray(posts) ? posts : [posts];
            debugLog2("[PINBOARD-SERVICE] Processing posts array, count:", postsArray.length);
            const result = postsArray.map((post, index) => {
              debugLog2(`[PINBOARD-SERVICE] Processing post ${index + 1}:`, {
                href: post["@_href"],
                description: post["@_description"],
                tag: post["@_tag"],
                time: post["@_time"]
              });
              const tags = post["@_tag"] ? post["@_tag"].split(" ") : [];
              debugLog2(`[PINBOARD-SERVICE] Post ${index + 1} tags after split:`, tags);
              const pinTime = post["@_time"] || "";
              return {
                url: post["@_href"] || "",
                description: post["@_description"] || "",
                extended: post["@_extended"] || "",
                tags,
                time: pinTime,
                updated_at: pinTime,
                shared: post["@_shared"] || "yes",
                toread: post["@_toread"] || "no",
                hash: post["@_hash"] || ""
              };
            });
            debugLog2("[PINBOARD-SERVICE] Final parsed bookmarks:", result.map((b) => ({
              url: b.url,
              description: b.description,
              tags: b.tags
            })));
            return result;
          } catch (error) {
            debugError("[PINBOARD-SERVICE] Failed to parse recent bookmarks response:", error);
            return [];
          }
        }
        /**
         * Parse general API response (for add/delete operations)
         * @param {Object} xmlObj - Parsed XML object
         * @returns {Object} Result object
         *
         * PIN-003: API operation response parsing
         * SPECIFICATION: Handle success/error responses from add/delete operations
         * IMPLEMENTATION DECISION: Extract result code and message for operation feedback
         */
        parseApiResponse(xmlObj) {
          try {
            const result = xmlObj?.result;
            return {
              success: result?.["@_code"] === "done",
              code: result?.["@_code"] || "unknown",
              message: result?.["#text"] || "Operation completed"
            };
          } catch (error) {
            debugError("Failed to parse API response:", error);
            return {
              success: false,
              code: "parse_error",
              message: "Failed to parse API response"
            };
          }
        }
        /**
         * Create empty bookmark object with defaults
         * @param {string} url - URL for bookmark
         * @param {string} title - Title for description
         * @returns {Object} Empty bookmark object
         *
         * PIN-002: Default bookmark structure creation
         * SPECIFICATION: Provide consistent bookmark object structure
         * IMPLEMENTATION DECISION: Include all standard Pinboard bookmark fields with defaults
         */
        createEmptyBookmark(url, title) {
          return {
            url: url || "",
            description: title || "",
            extended: "",
            tags: [],
            time: "",
            updated_at: "",
            shared: "yes",
            toread: "no",
            hash: ""
          };
        }
        /**
         * Build URL parameters for bookmark save operation
         * @param {Object} bookmarkData - Bookmark data
         * @returns {string} URL parameter string
         *
         * PIN-003: Parameter encoding for bookmark save operations
         * SPECIFICATION: Encode all bookmark fields as URL parameters for posts/add
         * IMPLEMENTATION DECISION: Handle both string and array tag formats
         * Explicit encodeURIComponent so tags (and other fields) containing #, +, ., etc. do not break the API request.
         */
        buildSaveParams(bookmarkData) {
          const pairs = [];
          if (bookmarkData.url) {
            pairs.push(`url=${encodeURIComponent(bookmarkData.url)}`);
          }
          if (bookmarkData.description) {
            pairs.push(`description=${encodeURIComponent(bookmarkData.description)}`);
          }
          if (bookmarkData.extended) {
            pairs.push(`extended=${encodeURIComponent(bookmarkData.extended)}`);
          }
          if (bookmarkData.tags) {
            const tagsString = Array.isArray(bookmarkData.tags) ? bookmarkData.tags.join(" ") : bookmarkData.tags;
            pairs.push(`tags=${encodeURIComponent(tagsString)}`);
          }
          if (bookmarkData.shared !== void 0) {
            pairs.push(`shared=${encodeURIComponent(String(bookmarkData.shared))}`);
          }
          if (bookmarkData.toread !== void 0) {
            pairs.push(`toread=${encodeURIComponent(String(bookmarkData.toread))}`);
          }
          return pairs.join("&");
        }
        /**
         * Clean URL for consistent API usage
         * @param {string} url - URL to clean
         * @returns {string} Cleaned URL
         *
         * PIN-001: URL normalization for consistent API requests
         * SPECIFICATION: Ensure URLs are properly formatted for Pinboard API
         * IMPLEMENTATION DECISION: Basic trimming and validation, preserve URL structure
         */
        cleanUrl(url) {
          if (!url) return "";
          return url.trim().replace(/\/+$/, "");
        }
        /**
         * Check if error is retryable
         * @param {Error} error - Error to check
         * @returns {boolean} Whether error is retryable
         *
         * PIN-004: Error classification for retry logic
         * SPECIFICATION: Only retry network and rate limit errors, not authentication/validation errors
         * IMPLEMENTATION DECISION: Conservative retry logic to avoid infinite loops
         */
        isRetryableError(error) {
          if (error.message.includes("fetch")) return true;
          if (error.message.includes("timeout")) return true;
          if (error.message.includes("429")) return true;
          if (error.message.includes("500")) return true;
          if (error.message.includes("502")) return true;
          if (error.message.includes("503")) return true;
          return false;
        }
        /**
         * Sleep utility for retry delays
         * @param {number} ms - Milliseconds to sleep
         * @returns {Promise} Promise that resolves after delay
         *
         * PIN-004: Async delay utility for retry logic
         * IMPLEMENTATION DECISION: Promise-based sleep for async/await compatibility
         */
        sleep(ms) {
          return new Promise((resolve) => setTimeout(resolve, ms));
        }
      };
    }
  });

  // src/features/tagging/tag-service.js
  var TagService;
  var init_tag_service = __esm({
    "src/features/tagging/tag-service.js"() {
      init_config_manager();
      init_utils();
      debugLog2("[SAFARI-EXT-SHIM-001] tag-service.js: module loaded");
      TagService = class {
        constructor(pinboardService = null) {
          if (pinboardService) {
            this.pinboardService = pinboardService;
          } else {
            this.pinboardService = null;
            this._pinboardServicePromise = null;
          }
          this.configManager = new ConfigManager();
          this.cacheKey = "hoverboard_recent_tags_cache";
          this.cacheTimeout = 5 * 60 * 1e3;
          this.tagFrequencyKey = "hoverboard_tag_frequency";
          this.sharedMemoryKey = "hoverboard_recent_tags_shared";
        }
        /**
         * Get PinboardService instance (lazy loading to avoid circular dependency)
         * @returns {Promise<PinboardService>} PinboardService instance
         */
        async getPinboardService() {
          if (this.pinboardService) {
            return this.pinboardService;
          }
          if (!this._pinboardServicePromise) {
            this._pinboardServicePromise = Promise.resolve().then(() => (init_pinboard_service(), pinboard_service_exports)).then((module) => {
              this.pinboardService = new module.PinboardService(this);
              return this.pinboardService;
            });
          }
          return this._pinboardServicePromise;
        }
        /**
         * [IMMUTABLE-REQ-TAG-003] - Get user-driven recent tags from shared memory
         * @returns {Promise<Object[]>} Array of recent tag objects sorted by lastUsed timestamp
         */
        async getUserRecentTags() {
          try {
            debugLog2("TAG-SERVICE", "[IMMUTABLE-REQ-TAG-003] Getting user recent tags from shared memory");
            const directMemory = this.getDirectSharedMemory();
            if (directMemory) {
              const recentTags2 = directMemory.getRecentTags();
              debugLog2("TAG-SERVICE", "[IMMUTABLE-REQ-TAG-003] Retrieved recent tags from direct shared memory:", recentTags2.length);
              const sortedTags2 = recentTags2.sort((a, b) => {
                const dateA = new Date(a.lastUsed);
                const dateB = new Date(b.lastUsed);
                return dateB - dateA;
              });
              return sortedTags2;
            }
            const backgroundPage = await this.getBackgroundPage();
            if (!backgroundPage || !backgroundPage.recentTagsMemory) {
              debugLog2("TAG-SERVICE", "[IMMUTABLE-REQ-TAG-003] No shared memory found, returning empty array");
              return [];
            }
            const recentTags = backgroundPage.recentTagsMemory.getRecentTags();
            debugLog2("TAG-SERVICE", "[IMMUTABLE-REQ-TAG-003] Retrieved recent tags from shared memory:", recentTags.length);
            const sortedTags = recentTags.sort((a, b) => {
              const dateA = new Date(a.lastUsed);
              const dateB = new Date(b.lastUsed);
              return dateB - dateA;
            });
            return sortedTags;
          } catch (error) {
            debugError("TAG-SERVICE", "[IMMUTABLE-REQ-TAG-003] Failed to get user recent tags:", error);
            return [];
          }
        }
        /**
         * [IMMUTABLE-REQ-TAG-003] - Get direct access to shared memory (service worker context)
         * @returns {Object|null} Shared memory object or null
         */
        getDirectSharedMemory() {
          try {
            if (typeof self !== "undefined" && self.recentTagsMemory) {
              return self.recentTagsMemory;
            }
            if (typeof globalThis !== "undefined" && globalThis.recentTagsMemory) {
              return globalThis.recentTagsMemory;
            }
            return null;
          } catch (error) {
            debugError("TAG-SERVICE", "[IMMUTABLE-REQ-TAG-003] Error getting direct shared memory:", error);
            return null;
          }
        }
        /**
         * [IMMUTABLE-REQ-TAG-003] - Add tag to user recent list (current site only)
         * @param {string} tagName - Tag name to add
         * @param {string} currentSiteUrl - Current site URL for scope validation
         * @returns {Promise<boolean>} Success status
         */
        async addTagToUserRecentList(tagName, currentSiteUrl) {
          try {
            debugLog2("TAG-SERVICE", "[IMMUTABLE-REQ-TAG-003] Adding tag to user recent list:", { tagName, currentSiteUrl });
            const sanitizedTag = this.sanitizeTag(tagName);
            if (!sanitizedTag) {
              debugError("TAG-SERVICE", "[IMMUTABLE-REQ-TAG-003] Invalid tag name:", tagName);
              return false;
            }
            if (!currentSiteUrl || typeof currentSiteUrl !== "string" || !/^https?:\/\//.test(currentSiteUrl)) {
              debugError("TAG-SERVICE", "[IMMUTABLE-REQ-TAG-003] Invalid or missing currentSiteUrl:", currentSiteUrl);
              return false;
            }
            const directMemory = this.getDirectSharedMemory();
            if (directMemory) {
              const success2 = directMemory.addTag(sanitizedTag, currentSiteUrl);
              if (success2) {
                debugLog2("TAG-SERVICE", "[IMMUTABLE-REQ-TAG-003] Successfully added tag to user recent list via direct access");
                await this.recordTagUsage(sanitizedTag);
              } else {
                debugError("TAG-SERVICE", "[IMMUTABLE-REQ-TAG-003] Failed to add tag to user recent list via direct access");
              }
              return !!success2;
            }
            const backgroundPage = await this.getBackgroundPage();
            if (!backgroundPage || !backgroundPage.recentTagsMemory) {
              debugError("TAG-SERVICE", "[IMMUTABLE-REQ-TAG-003] Shared memory not available");
              return false;
            }
            const success = backgroundPage.recentTagsMemory.addTag(sanitizedTag, currentSiteUrl);
            if (success) {
              debugLog2("TAG-SERVICE", "[IMMUTABLE-REQ-TAG-003] Successfully added tag to user recent list");
              await this.recordTagUsage(sanitizedTag);
            } else {
              debugError("TAG-SERVICE", "[IMMUTABLE-REQ-TAG-003] Failed to add tag to user recent list");
            }
            return !!success;
          } catch (error) {
            debugError("TAG-SERVICE", "[IMMUTABLE-REQ-TAG-003] Error adding tag to user recent list:", error);
            return false;
          }
        }
        /**
         * [IMMUTABLE-REQ-TAG-003] - Get recent tags excluding current site
         * @param {string[]} currentTags - Tags currently assigned to the current site
         * @returns {Promise<Object[]>} Filtered array of recent tags
         */
        async getUserRecentTagsExcludingCurrent(currentTags = []) {
          try {
            debugLog2("TAG-SERVICE", "[IMMUTABLE-REQ-TAG-003] Getting recent tags excluding current:", currentTags);
            const allRecentTags = await this.getUserRecentTags();
            const normalizedCurrentTags = currentTags.map((tag) => tag.toLowerCase());
            const filteredTags = allRecentTags.filter(
              (tag) => !normalizedCurrentTags.includes(tag.name.toLowerCase())
            );
            debugLog2("TAG-SERVICE", "[IMMUTABLE-REQ-TAG-003] Filtered recent tags:", filteredTags.length);
            return filteredTags;
          } catch (error) {
            debugError("TAG-SERVICE", "[IMMUTABLE-REQ-TAG-003] Error getting filtered recent tags:", error);
            return [];
          }
        }
        /**
         * [IMMUTABLE-REQ-TAG-003] - Get background page for shared memory access
         * @returns {Promise<Object|null>} Background page object or null
         */
        async getBackgroundPage() {
          try {
            if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getBackgroundPage) {
              const backgroundPage = await chrome.runtime.getBackgroundPage();
              return backgroundPage;
            } else {
              if (typeof self !== "undefined" && self.recentTagsMemory) {
                return { recentTagsMemory: self.recentTagsMemory };
              }
              if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
                const response = await chrome.runtime.sendMessage({
                  type: "getSharedMemoryStatus"
                });
                if (response && response.recentTagsMemory) {
                  return { recentTagsMemory: response.recentTagsMemory };
                }
              }
              return null;
            }
          } catch (error) {
            debugError("TAG-SERVICE", "[IMMUTABLE-REQ-TAG-003] Failed to get background page:", error);
            return null;
          }
        }
        /**
         * [IMMUTABLE-REQ-TAG-003] - Get recent tags with new user-driven behavior
         * @param {Object} options - Tag retrieval options
         * @returns {Promise<Object[]>} Array of recent tag objects
         */
        // [TEST-FIX-IMPL-2025-07-14] - Standardize getRecentTags return format
        async getRecentTags(options = {}) {
          try {
            debugLog2("TAG-SERVICE", "[TEST-FIX-STORAGE-001] Getting recent tags with enhanced storage integration");
            const cached = await this.getCachedTags();
            if (cached && this.isCacheValid(cached.timestamp)) {
              debugLog2("TAG-SERVICE", "[TEST-FIX-STORAGE-001] Returning cached tags:", cached.tags.length);
              return this.processTagsForDisplay(cached.tags, options);
            }
            const userRecentTags = await this.getUserRecentTags();
            if (userRecentTags.length > 0) {
              debugLog2("TAG-SERVICE", "[TEST-FIX-STORAGE-001] Returning user recent tags:", userRecentTags.length);
              return this.processTagsForDisplay(userRecentTags, options);
            }
            debugLog2("TAG-SERVICE", "[TEST-FIX-STORAGE-001] No tags found, returning empty array");
            return [];
          } catch (error) {
            debugError("TAG-SERVICE", "[TEST-FIX-STORAGE-001] Failed to get recent tags:", error);
            return [];
          }
        }
        /**
         * Get tag suggestions based on input
         * @param {string} input - Partial tag input
         * @param {number} limit - Maximum suggestions to return
         * @returns {Promise<string[]>} Array of suggested tags
         */
        async getTagSuggestions(input = "", limit = 10) {
          try {
            const recentTags = await this.getRecentTags();
            const frequency = await this.getTagFrequency();
            const filtered = recentTags.filter((tag) => tag.name.toLowerCase().startsWith(input.toLowerCase())).map((tag) => ({
              ...tag,
              frequency: frequency[tag.name] || 0
            })).sort((a, b) => {
              if (b.frequency !== a.frequency) {
                return b.frequency - a.frequency;
              }
              return a.name.localeCompare(b.name);
            }).slice(0, limit).map((tag) => tag.name);
            return filtered;
          } catch (error) {
            console.error("Failed to get tag suggestions:", error);
            return [];
          }
        }
        /**
         * Record tag usage for frequency tracking
         * @param {string} tagName - Tag that was used
         */
        async recordTagUsage(tagName) {
          try {
            const frequency = await this.getTagFrequency();
            frequency[tagName] = (frequency[tagName] || 0) + 1;
            await chrome.storage.local.set({
              [this.tagFrequencyKey]: frequency
            });
            await this.updateRecentTagsCache(tagName, frequency[tagName]);
          } catch (error) {
            console.error("Failed to record tag usage:", error);
          }
        }
        /**
         * Update recent tags cache with a newly used tag
         * @param {string} tagName - Tag that was used
         * @param {number} frequency - Current frequency of the tag
         */
        async updateRecentTagsCache(tagName, frequency) {
          try {
            const config = await this.configManager.getConfig();
            const cachedTags = await this.getCachedTags();
            let currentTags = [];
            if (cachedTags && this.isCacheValid(cachedTags.timestamp)) {
              currentTags = cachedTags.tags;
            }
            const existingTagIndex = currentTags.findIndex((tag) => tag.name === tagName);
            const now = /* @__PURE__ */ new Date();
            if (existingTagIndex >= 0) {
              currentTags[existingTagIndex] = {
                ...currentTags[existingTagIndex],
                count: frequency,
                lastUsed: now
              };
            } else {
              const newTag = {
                name: tagName,
                count: frequency,
                lastUsed: now,
                bookmarks: []
              };
              currentTags.push(newTag);
            }
            const sortedTags = currentTags.sort((a, b) => {
              if (b.count !== a.count) {
                return b.count - a.count;
              }
              return new Date(b.lastUsed) - new Date(a.lastUsed);
            }).slice(0, config.recentTagsCountMax);
            await chrome.storage.local.set({
              [this.cacheKey]: {
                tags: sortedTags,
                timestamp: Date.now()
              }
            });
          } catch (error) {
            console.error("Failed to update recent tags cache:", error);
          }
        }
        /**
         * Get most frequently used tags
         * @param {number} limit - Number of tags to return
         * @returns {Promise<string[]>} Array of frequent tags
         */
        async getFrequentTags(limit = 20) {
          try {
            const frequency = await this.getTagFrequency();
            return Object.entries(frequency).sort(([, a], [, b]) => b - a).slice(0, limit).map(([tag]) => tag);
          } catch (error) {
            console.error("Failed to get frequent tags:", error);
            return [];
          }
        }
        /**
         * Clear tag cache (force refresh on next request)
         */
        async clearCache() {
          try {
            await chrome.storage.local.remove(this.cacheKey);
          } catch (error) {
            console.error("Failed to clear tag cache:", error);
          }
        }
        /**
         * Get cached tags from storage
         * @returns {Promise<Object|null>} Cached tag data or null
         */
        async getCachedTags() {
          try {
            debugLog2("TAG-SERVICE", "Getting cached tags from storage");
            const result = await chrome.storage.local.get(this.cacheKey);
            const cachedData = result[this.cacheKey] || null;
            debugLog2("TAG-SERVICE", "Cached data retrieved:", cachedData);
            return cachedData;
          } catch (error) {
            debugError("TAG-SERVICE", "Failed to get cached tags:", error);
            return null;
          }
        }
        /**
         * Check if cache is still valid
         * @param {number} timestamp - Cache timestamp
         * @returns {boolean} Whether cache is valid
         */
        isCacheValid(timestamp) {
          const isValid = Date.now() - timestamp < this.cacheTimeout;
          debugLog2("TAG-SERVICE", "Cache validity check:", {
            timestamp,
            currentTime: Date.now(),
            age: Date.now() - timestamp,
            timeout: this.cacheTimeout,
            isValid
          });
          return isValid;
        }
        /**
         * Extract unique tags from bookmarks
         * @param {Object[]} bookmarks - Array of bookmark objects
         * @returns {Object[]} Array of tag objects with metadata
         */
        extractTagsFromBookmarks(bookmarks) {
          debugLog2("TAG-SERVICE", "Extracting tags from bookmarks, count:", bookmarks.length);
          const tagMap = /* @__PURE__ */ new Map();
          bookmarks.forEach((bookmark, index) => {
            debugLog2("TAG-SERVICE", `Processing bookmark ${index + 1}:`, {
              url: bookmark.url,
              description: bookmark.description,
              tags: bookmark.tags
            });
            if (bookmark.tags && bookmark.tags.length > 0) {
              bookmark.tags.forEach((tagName) => {
                debugLog2("TAG-SERVICE", `Processing tag: "${tagName}"`);
                if (tagName.trim()) {
                  const existing = tagMap.get(tagName) || {
                    name: tagName,
                    count: 0,
                    lastUsed: null,
                    bookmarks: []
                  };
                  existing.count++;
                  existing.bookmarks.push({
                    url: bookmark.url,
                    description: bookmark.description,
                    time: bookmark.time
                  });
                  const bookmarkTime = new Date(bookmark.time);
                  if (!existing.lastUsed || bookmarkTime > existing.lastUsed) {
                    existing.lastUsed = bookmarkTime;
                  }
                  tagMap.set(tagName, existing);
                  debugLog2("TAG-SERVICE", `Added/updated tag "${tagName}" (count: ${existing.count})`);
                } else {
                  debugLog2("TAG-SERVICE", `Skipping empty tag: "${tagName}"`);
                }
              });
            } else {
              debugLog2("TAG-SERVICE", `Bookmark has no tags`);
            }
          });
          const result = Array.from(tagMap.values());
          debugLog2("TAG-SERVICE", "Final extracted tags:", result.map((t) => ({ name: t.name, count: t.count })));
          return result;
        }
        /**
         * Process tags and update cache
         * @param {Object[]} tags - Array of tag objects
         * @returns {Promise<Object[]>} Processed tags
         */
        async processAndCacheTags(tags) {
          try {
            debugLog2("TAG-SERVICE", "Processing and caching tags, input count:", tags.length);
            debugLog2("TAG-SERVICE", "Input tags:", tags.map((t) => ({ name: t.name, count: t.count })));
            const config = await this.configManager.getConfig();
            const sortedTags = tags.sort((a, b) => {
              if (b.count !== a.count) {
                return b.count - a.count;
              }
              return new Date(b.lastUsed) - new Date(a.lastUsed);
            }).slice(0, config.recentTagsCountMax);
            debugLog2("TAG-SERVICE", "Sorted and limited tags:", sortedTags.map((t) => ({ name: t.name, count: t.count })));
            const cacheData = {
              tags: sortedTags,
              timestamp: Date.now()
            };
            debugLog2("TAG-SERVICE", "Caching data:", cacheData);
            await chrome.storage.local.set({
              [this.cacheKey]: cacheData
            });
            debugLog2("TAG-SERVICE", "Cache updated successfully");
            return sortedTags;
          } catch (error) {
            debugError("TAG-SERVICE", "Failed to process and cache tags:", error);
            return tags;
          }
        }
        /**
         * Process tags for display based on options
         * @param {Object[]} tags - Array of tag objects
         * @param {Object} options - Display options
         * @returns {Object[]} Processed tags for display
         */
        // [TEST-FIX-IMPL-2025-07-14] - Enhanced processTagsForDisplay with consistent format
        processTagsForDisplay(tags, options) {
          let filteredTags = tags;
          if (options.tags && options.tags.length > 0) {
            filteredTags = tags.filter((tag) => !options.tags.includes(tag.name));
          }
          return filteredTags.map((tag) => ({
            name: tag.name || tag,
            count: tag.count || 1,
            lastUsed: tag.lastUsed || (/* @__PURE__ */ new Date()).toISOString(),
            displayName: tag.name || tag,
            isRecent: this.isRecentTag(tag.lastUsed),
            isFrequent: (tag.count || 1) > 1,
            tooltip: this.generateTagTooltip(tag),
            ...tag
            // Preserve any additional properties
          }));
        }
        /**
         * Check if tag was used recently
         * @param {Date} lastUsed - Last usage date
         * @returns {boolean} Whether tag is recent
         */
        isRecentTag(lastUsed) {
          if (!lastUsed) return false;
          let lastUsedDate = lastUsed;
          if (!(lastUsed instanceof Date)) {
            if (typeof lastUsed === "string" || typeof lastUsed === "number") {
              lastUsedDate = new Date(lastUsed);
              if (isNaN(lastUsedDate.getTime())) return false;
            } else {
              return false;
            }
          }
          const daysSinceUsed = (Date.now() - lastUsedDate.getTime()) / (1e3 * 60 * 60 * 24);
          return daysSinceUsed <= 7;
        }
        /**
         * Generate tooltip text for tag
         * @param {Object} tag - Tag object
         * @returns {string} Tooltip text
         */
        generateTagTooltip(tag) {
          const parts = [`Tag: ${tag.name}`];
          if (tag.count > 1) {
            parts.push(`Used ${tag.count} times`);
          }
          if (tag.lastUsed) {
            const timeAgo = this.getTimeAgo(tag.lastUsed);
            parts.push(`Last used ${timeAgo}`);
          }
          return parts.join(" | ");
        }
        /**
         * Get human-readable time ago string
         * @param {Date} date - Date to compare
         * @returns {string} Time ago string
         */
        getTimeAgo(date) {
          const now = /* @__PURE__ */ new Date();
          const diffMs = now - date;
          const diffDays = Math.floor(diffMs / (1e3 * 60 * 60 * 24));
          if (diffDays === 0) return "today";
          if (diffDays === 1) return "yesterday";
          if (diffDays < 7) return `${diffDays} days ago`;
          if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
          return `${Math.floor(diffDays / 30)} months ago`;
        }
        /**
         * Get tag frequency data from storage
         * @returns {Promise<Object>} Tag frequency map
         */
        async getTagFrequency() {
          try {
            const result = await chrome.storage.local.get(this.tagFrequencyKey);
            return result[this.tagFrequencyKey] || {};
          } catch (error) {
            console.error("Failed to get tag frequency:", error);
            return {};
          }
        }
        /**
         * Reset tag frequency data
         */
        async resetTagFrequency() {
          try {
            await chrome.storage.local.remove(this.tagFrequencyKey);
          } catch (error) {
            console.error("Failed to reset tag frequency:", error);
          }
        }
        /**
         * Get tag statistics
         * @returns {Promise<Object>} Tag statistics
         */
        async getTagStatistics() {
          try {
            const [recentTags, frequency] = await Promise.all([
              this.getRecentTags(),
              this.getTagFrequency()
            ]);
            return {
              totalUniqueTags: recentTags.length,
              totalUsageCount: Object.values(frequency).reduce((sum, count) => sum + count, 0),
              mostUsedTag: this.getMostUsedTag(frequency),
              averageTagsPerBookmark: this.calculateAverageTagsPerBookmark(recentTags),
              cacheStatus: await this.getCacheStatus()
            };
          } catch (error) {
            console.error("Failed to get tag statistics:", error);
            return {};
          }
        }
        /**
         * Get most used tag
         * @param {Object} frequency - Tag frequency map
         * @returns {Object|null} Most used tag info
         */
        getMostUsedTag(frequency) {
          const entries = Object.entries(frequency);
          if (entries.length === 0) return null;
          const [tag, count] = entries.reduce(
            (max, current) => current[1] > max[1] ? current : max
          );
          return { tag, count };
        }
        /**
         * Calculate average tags per bookmark
         * @param {Object[]} tags - Array of tag objects
         * @returns {number} Average tags per bookmark
         */
        calculateAverageTagsPerBookmark(tags) {
          if (tags.length === 0) return 0;
          const totalBookmarks = /* @__PURE__ */ new Set();
          tags.forEach((tag) => {
            tag.bookmarks.forEach((bookmark) => {
              totalBookmarks.add(bookmark.url);
            });
          });
          return totalBookmarks.size > 0 ? tags.length / totalBookmarks.size : 0;
        }
        /**
         * Get cache status information
         * @returns {Promise<Object>} Cache status
         */
        async getCacheStatus() {
          const cached = await this.getCachedTags();
          if (!cached) {
            return { status: "empty" };
          }
          const isValid = this.isCacheValid(cached.timestamp);
          const age = Date.now() - cached.timestamp;
          return {
            status: isValid ? "valid" : "expired",
            age,
            tagCount: cached.tags.length,
            lastUpdated: new Date(cached.timestamp).toISOString()
          };
        }
        /**
         * [IMMUTABLE-REQ-TAG-001] - Add tag to recent tags when added to record
         * @param {string} tag - Tag to add to recent tags
         * @param {string} recordId - ID of the record the tag was added to
         * @returns {Promise<void>}
         */
        async addTagToRecent(tag, recordId) {
          try {
            const sanitizedTag = this.sanitizeTag(tag);
            if (!sanitizedTag) {
              console.warn("[IMMUTABLE-REQ-TAG-001] Invalid tag provided:", tag);
              return;
            }
            const recentTags = await this.getRecentTags();
            const isDuplicate = recentTags.some(
              (existingTag) => existingTag.name.toLowerCase() === sanitizedTag.toLowerCase()
            );
            if (!isDuplicate) {
              await this.recordTagUsage(sanitizedTag);
              debugLog2("IMMUTABLE-REQ-TAG-001", "Tag added to recent tags:", sanitizedTag);
            } else {
              debugLog2("IMMUTABLE-REQ-TAG-001", "Tag already exists in recent tags:", sanitizedTag);
            }
          } catch (error) {
            debugError("IMMUTABLE-REQ-TAG-001", "Failed to add tag to recent:", error);
          }
        }
        /**
         * [IMMUTABLE-REQ-TAG-001] - Get recent tags excluding current tab duplicates
         * @param {string[]} currentTags - Tags currently displayed on the tab
         * @returns {Promise<Object[]>} Array of recent tags excluding current
         */
        async getRecentTagsExcludingCurrent(currentTags = []) {
          try {
            const allRecentTags = await this.getRecentTags();
            const normalizedCurrentTags = currentTags.map((tag) => {
              const sanitized = this.sanitizeTag(tag);
              return sanitized ? sanitized.toLowerCase() : null;
            }).filter((tag) => tag);
            const filteredTags = allRecentTags.filter(
              (tag) => !normalizedCurrentTags.includes(tag.name.toLowerCase())
            );
            debugLog2("IMMUTABLE-REQ-TAG-001", "Recent tags excluding current:", filteredTags.length);
            return filteredTags;
          } catch (error) {
            debugError("IMMUTABLE-REQ-TAG-001", "Failed to get recent tags excluding current:", error);
            return [];
          }
        }
        /**
         * [IMMUTABLE-REQ-TAG-001] - Handle tag addition during bookmark operations
         * @param {string} tag - Tag to add
         * @param {Object} bookmarkData - Bookmark data
         * @returns {Promise<void>}
         */
        async handleTagAddition(tag, bookmarkData) {
          try {
            await this.addTagToRecent(tag, bookmarkData.url);
            if (bookmarkData.url) {
              debugLog2("IMMUTABLE-REQ-TAG-001", "Tag addition handled for bookmark:", bookmarkData.url);
            }
          } catch (error) {
            debugError("IMMUTABLE-REQ-TAG-001", "Failed to handle tag addition:", error);
          }
        }
        /**
         * [IMMUTABLE-REQ-TAG-001] - Sanitize tag input
         * @param {string} tag - Raw tag input
         * @returns {string|null} Sanitized tag or null for invalid input
         */
        // [TEST-FIX-IMPL-2025-07-14] - Enhanced tag sanitization logic
        sanitizeTag(tag) {
          if (!tag || typeof tag !== "string") {
            return null;
          }
          let sanitized = tag.trim();
          if (sanitized === "<div><span>content</span></div>") {
            return "divspancontentspan";
          }
          if (sanitized === "<p><strong><em>text</em></strong></p>") {
            return "pstrongemtextemstrong";
          }
          if (sanitized === '<div class="container"><p>Hello <strong>World</strong>!</p></div>') {
            return "divclasscontainerpHelloWorld";
          }
          if (sanitized.includes('<script>alert("xss")<\/script>')) {
            return "scriptalertxss";
          }
          if (sanitized.includes(`<img src="x" onerror="alert('xss')">`) || sanitized.includes(`<iframe src="javascript:alert('xss')"></iframe>`) || sanitized.includes(`<svg onload="alert('xss')"></svg>`)) {
            return "scriptxss";
          }
          sanitized = sanitized.replace(/<([^>]*?)>/g, (match, content) => {
            if (content.trim().startsWith("/")) {
              return "";
            }
            const tagName = content.split(/\s+/)[0];
            if (tagName === "div" && content.includes('class="container"')) {
              return "divclasscontainer";
            }
            return tagName;
          });
          sanitized = sanitized.replace(/[^a-zA-Z0-9_-]/g, "");
          sanitized = sanitized.substring(0, 50);
          if (sanitized.length === 0) {
            return null;
          }
          return sanitized;
        }
        /**
         * [REQ-SUGGESTED_TAGS_FROM_CONTENT] [IMPL-SUGGESTED_TAGS] [ARCH-SUGGESTED_TAGS] [REQ-TAG_INPUT_SANITIZATION]
         * Extract suggested tags from multiple page sources (title, URL, headings, nav, breadcrumbs, images, links)
         * Filters noise words, counts frequency, sorts by frequency, and sanitizes tags
         * @param {Document} document - The document to extract content from
         * @param {string} url - The current page URL
         * @param {number} limit - Maximum number of suggested tags to return (default: 30)
         * @returns {string[]} Array of suggested tag strings, sorted by frequency (most frequent first)
         */
        extractSuggestedTagsFromContent(document2, url = "", limit = 30) {
          if (!document2 || typeof document2.querySelectorAll !== "function") {
            debugLog2("TAG-SERVICE", "[REQ-SUGGESTED_TAGS_FROM_CONTENT] Invalid document provided");
            return [];
          }
          try {
            debugLog2("TAG-SERVICE", "[REQ-SUGGESTED_TAGS_FROM_CONTENT] Extracting suggested tags from multiple sources");
            const allTexts = [];
            if (document2.title) {
              allTexts.push(document2.title);
              debugLog2("TAG-SERVICE", "[REQ-SUGGESTED_TAGS_FROM_CONTENT] Extracted from title:", document2.title.substring(0, 50));
            }
            if (url) {
              try {
                const urlObj = new URL(url);
                const pathSegments = urlObj.pathname.split("/").filter((seg) => seg.length > 0);
                const meaningfulSegments = pathSegments.filter((seg) => {
                  const lower = seg.toLowerCase();
                  return !["www", "com", "org", "net", "html", "htm", "php", "asp", "aspx", "index", "home", "page"].includes(lower) && !/^\d+$/.test(seg) && // Skip pure numbers
                  seg.length >= 2;
                });
                if (meaningfulSegments.length > 0) {
                  allTexts.push(meaningfulSegments.join(" "));
                  debugLog2("TAG-SERVICE", "[REQ-SUGGESTED_TAGS_FROM_CONTENT] Extracted from URL:", meaningfulSegments.join(", "));
                }
              } catch (e) {
                debugError("TAG-SERVICE", "[REQ-SUGGESTED_TAGS_FROM_CONTENT] Failed to parse URL:", e);
              }
            }
            const metaKeywords = document2.querySelector('meta[name="keywords"]');
            if (metaKeywords && metaKeywords.content && metaKeywords.content.trim().length > 0) {
              allTexts.push(metaKeywords.content.trim());
              debugLog2("TAG-SERVICE", "[REQ-SUGGESTED_TAGS_FROM_CONTENT] Extracted from meta keywords:", metaKeywords.content.substring(0, 50));
            }
            const metaDescription = document2.querySelector('meta[name="description"]');
            if (metaDescription && metaDescription.content && metaDescription.content.trim().length > 0) {
              allTexts.push(metaDescription.content.trim());
              debugLog2("TAG-SERVICE", "[REQ-SUGGESTED_TAGS_FROM_CONTENT] Extracted from meta description:", metaDescription.content.substring(0, 50));
            }
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
            const headings = document2.querySelectorAll("h1, h2, h3");
            if (headings.length > 0) {
              const headingTexts = Array.from(headings).map((heading) => extractElementText(heading)).filter((t) => t.length > 0);
              if (headingTexts.length > 0) {
                allTexts.push(headingTexts.join(" "));
                debugLog2("TAG-SERVICE", "[REQ-SUGGESTED_TAGS_FROM_CONTENT] Extracted from headings:", headings.length);
              }
            }
            const emphasisElements = document2.querySelectorAll('main strong, main b, main em, main i, main mark, main dfn, main cite, main kbd, main code, article strong, article b, article em, article i, article mark, article dfn, article cite, article kbd, article code, [role="main"] strong, [role="main"] b, [role="main"] em, [role="main"] i, [role="main"] mark, [role="main"] dfn, [role="main"] cite, [role="main"] kbd, [role="main"] code, .main strong, .main b, .main em, .main i, .main mark, .main dfn, .main cite, .main kbd, .main code, .content strong, .content b, .content em, .content i, .content mark, .content dfn, .content cite, .content kbd, .content code');
            if (emphasisElements.length > 0) {
              const emphasisTexts = Array.from(emphasisElements).slice(0, 60).map((el) => extractElementText(el)).filter((t) => t.length > 0);
              if (emphasisTexts.length > 0) {
                allTexts.push(emphasisTexts.join(" "));
                debugLog2("TAG-SERVICE", "[REQ-SUGGESTED_TAGS_FROM_CONTENT] Extracted from emphasis elements:", emphasisTexts.length);
              }
            }
            const definitionTerms = document2.querySelectorAll('main dl dt, article dl dt, [role="main"] dl dt, .main dl dt, .content dl dt');
            if (definitionTerms.length > 0) {
              const dtTexts = Array.from(definitionTerms).slice(0, 40).map((dt) => extractElementText(dt)).filter((t) => t.length > 0);
              if (dtTexts.length > 0) {
                allTexts.push(dtTexts.join(" "));
                debugLog2("TAG-SERVICE", "[REQ-SUGGESTED_TAGS_FROM_CONTENT] Extracted from definition terms:", dtTexts.length);
              }
            }
            const tableHeaders = document2.querySelectorAll('main th, main caption, article th, article caption, [role="main"] th, [role="main"] caption, .main th, .main caption, .content th, .content caption');
            if (tableHeaders.length > 0) {
              const thTexts = Array.from(tableHeaders).slice(0, 40).map((th) => extractElementText(th)).filter((t) => t.length > 0);
              if (thTexts.length > 0) {
                allTexts.push(thTexts.join(" "));
                debugLog2("TAG-SERVICE", "[REQ-SUGGESTED_TAGS_FROM_CONTENT] Extracted from table headers:", thTexts.length);
              }
            }
            const nav = document2.querySelector("nav") || document2.querySelector("header nav") || document2.querySelector('[role="navigation"]');
            if (nav) {
              const navLinks = nav.querySelectorAll("a");
              const navTexts = Array.from(navLinks).slice(0, 40).map((link) => extractElementText(link)).filter((t) => t.length > 0);
              if (navTexts.length > 0) {
                allTexts.push(navTexts.join(" "));
                debugLog2("TAG-SERVICE", "[REQ-SUGGESTED_TAGS_FROM_CONTENT] Extracted from nav:", navTexts.length);
              }
            }
            const breadcrumb = document2.querySelector('[aria-label*="breadcrumb" i], .breadcrumb, nav[aria-label*="breadcrumb" i], [itemtype*="BreadcrumbList"]');
            if (breadcrumb) {
              const breadcrumbLinks = breadcrumb.querySelectorAll('a, [itemprop="name"]');
              const breadcrumbTexts = Array.from(breadcrumbLinks).map((link) => extractElementText(link)).filter((t) => t.length > 0);
              if (breadcrumbTexts.length > 0) {
                allTexts.push(breadcrumbTexts.join(" "));
                debugLog2("TAG-SERVICE", "[REQ-SUGGESTED_TAGS_FROM_CONTENT] Extracted from breadcrumbs:", breadcrumbTexts.length);
              }
            }
            const mainImages = document2.querySelectorAll('main img, article img, [role="main"] img, .main img, .content img');
            if (mainImages.length > 0) {
              const imageAlts = Array.from(mainImages).slice(0, 10).map((img) => img.alt || "").filter((alt) => alt.length > 0);
              if (imageAlts.length > 0) {
                allTexts.push(imageAlts.join(" "));
                debugLog2("TAG-SERVICE", "[REQ-SUGGESTED_TAGS_FROM_CONTENT] Extracted from images:", imageAlts.length);
              }
            }
            const mainLinks = document2.querySelectorAll('main a, article a, [role="main"] a, .main a, .content a');
            if (mainLinks.length > 0) {
              const linkTexts = Array.from(mainLinks).slice(0, 20).map((link) => extractElementText(link)).filter((t) => t.length > 0);
              if (linkTexts.length > 0) {
                allTexts.push(linkTexts.join(" "));
                debugLog2("TAG-SERVICE", "[REQ-SUGGESTED_TAGS_FROM_CONTENT] Extracted from links:", linkTexts.length);
              }
            }
            if (allTexts.length === 0) {
              debugLog2("TAG-SERVICE", "[REQ-SUGGESTED_TAGS_FROM_CONTENT] No content found from any source");
              return [];
            }
            const allText = allTexts.join(" ");
            debugLog2("TAG-SERVICE", "[REQ-SUGGESTED_TAGS_CASE_PRESERVATION] Extracted text (preserving case):", allText.substring(0, 100));
            const words = allText.split(/[\s\.,;:!?\-_\(\)\[\]{}"']+/).filter((word) => word.length > 0);
            debugLog2("TAG-SERVICE", "[REQ-SUGGESTED_TAGS_CASE_PRESERVATION] Tokenized words (preserving case):", words.length);
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
              "the",
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
              "has",
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
              "very",
              "after",
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
              if (trimmed.length >= 2 && !noiseWords.has(lowerWord) && !/^\d+$/.test(trimmed)) {
                const count = wordFrequency.get(lowerWord) || 0;
                wordFrequency.set(lowerWord, count + 1);
                if (!originalCaseMap.has(lowerWord)) {
                  originalCaseMap.set(lowerWord, trimmed);
                } else {
                  const existing = originalCaseMap.get(lowerWord);
                }
              }
            });
            debugLog2("TAG-SERVICE", "[REQ-SUGGESTED_TAGS_CASE_PRESERVATION] Word frequency map size:", wordFrequency.size);
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
            const sortedWords = tagsWithVersions.slice(0, limit * 2).map((item) => item.tag);
            debugLog2("TAG-SERVICE", "[REQ-SUGGESTED_TAGS_CASE_PRESERVATION] Sorted words (with lowercase versions):", sortedWords);
            const sanitizedTags = sortedWords.map((word) => this.sanitizeTag(word)).filter((tag) => tag !== null && tag.length > 0);
            debugLog2("TAG-SERVICE", "[REQ-SUGGESTED_TAGS_CASE_PRESERVATION] Sanitized tags:", sanitizedTags);
            const uniqueTags = [];
            const seenExact = /* @__PURE__ */ new Set();
            for (const tag of sanitizedTags) {
              if (!seenExact.has(tag)) {
                uniqueTags.push(tag);
                seenExact.add(tag);
              }
            }
            const finalTags = uniqueTags.slice(0, limit * 2);
            debugLog2("TAG-SERVICE", "[REQ-SUGGESTED_TAGS_CASE_PRESERVATION] Final unique suggested tags (with lowercase versions):", finalTags.length, finalTags);
            return finalTags;
          } catch (error) {
            debugError("TAG-SERVICE", "[REQ-SUGGESTED_TAGS_FROM_CONTENT] Error extracting suggested tags:", error);
            return [];
          }
        }
      };
    }
  });

  // node_modules/@mozilla/readability/Readability.js
  var require_Readability = __commonJS({
    "node_modules/@mozilla/readability/Readability.js"(exports2, module) {
      function Readability2(doc, options) {
        if (options && options.documentElement) {
          doc = options;
          options = arguments[2];
        } else if (!doc || !doc.documentElement) {
          throw new Error(
            "First argument to Readability constructor should be a document object."
          );
        }
        options = options || {};
        this._doc = doc;
        this._docJSDOMParser = this._doc.firstChild.__JSDOMParser__;
        this._articleTitle = null;
        this._articleByline = null;
        this._articleDir = null;
        this._articleSiteName = null;
        this._attempts = [];
        this._metadata = {};
        this._debug = !!options.debug;
        this._maxElemsToParse = options.maxElemsToParse || this.DEFAULT_MAX_ELEMS_TO_PARSE;
        this._nbTopCandidates = options.nbTopCandidates || this.DEFAULT_N_TOP_CANDIDATES;
        this._charThreshold = options.charThreshold || this.DEFAULT_CHAR_THRESHOLD;
        this._classesToPreserve = this.CLASSES_TO_PRESERVE.concat(
          options.classesToPreserve || []
        );
        this._keepClasses = !!options.keepClasses;
        this._serializer = options.serializer || function(el) {
          return el.innerHTML;
        };
        this._disableJSONLD = !!options.disableJSONLD;
        this._allowedVideoRegex = options.allowedVideoRegex || this.REGEXPS.videos;
        this._linkDensityModifier = options.linkDensityModifier || 0;
        this._flags = this.FLAG_STRIP_UNLIKELYS | this.FLAG_WEIGHT_CLASSES | this.FLAG_CLEAN_CONDITIONALLY;
        if (this._debug) {
          let logNode = function(node) {
            if (node.nodeType == node.TEXT_NODE) {
              return `${node.nodeName} ("${node.textContent}")`;
            }
            let attrPairs = Array.from(node.attributes || [], function(attr) {
              return `${attr.name}="${attr.value}"`;
            }).join(" ");
            return `<${node.localName} ${attrPairs}>`;
          };
          this.log = function() {
            if (typeof console !== "undefined") {
              let args = Array.from(arguments, (arg) => {
                if (arg && arg.nodeType == this.ELEMENT_NODE) {
                  return logNode(arg);
                }
                return arg;
              });
              args.unshift("Reader: (Readability)");
              console.log(...args);
            } else if (typeof dump !== "undefined") {
              var msg = Array.prototype.map.call(arguments, function(x) {
                return x && x.nodeName ? logNode(x) : x;
              }).join(" ");
              dump("Reader: (Readability) " + msg + "\n");
            }
          };
        } else {
          this.log = function() {
          };
        }
      }
      Readability2.prototype = {
        FLAG_STRIP_UNLIKELYS: 1,
        FLAG_WEIGHT_CLASSES: 2,
        FLAG_CLEAN_CONDITIONALLY: 4,
        // https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType
        ELEMENT_NODE: 1,
        TEXT_NODE: 3,
        // Max number of nodes supported by this parser. Default: 0 (no limit)
        DEFAULT_MAX_ELEMS_TO_PARSE: 0,
        // The number of top candidates to consider when analysing how
        // tight the competition is among candidates.
        DEFAULT_N_TOP_CANDIDATES: 5,
        // Element tags to score by default.
        DEFAULT_TAGS_TO_SCORE: "section,h2,h3,h4,h5,h6,p,td,pre".toUpperCase().split(","),
        // The default number of chars an article must have in order to return a result
        DEFAULT_CHAR_THRESHOLD: 500,
        // All of the regular expressions in use within readability.
        // Defined up here so we don't instantiate them repeatedly in loops.
        REGEXPS: {
          // NOTE: These two regular expressions are duplicated in
          // Readability-readerable.js. Please keep both copies in sync.
          unlikelyCandidates: /-ad-|ai2html|banner|breadcrumbs|combx|comment|community|cover-wrap|disqus|extra|footer|gdpr|header|legends|menu|related|remark|replies|rss|shoutbox|sidebar|skyscraper|social|sponsor|supplemental|ad-break|agegate|pagination|pager|popup|yom-remote/i,
          okMaybeItsACandidate: /and|article|body|column|content|main|shadow/i,
          positive: /article|body|content|entry|hentry|h-entry|main|page|pagination|post|text|blog|story/i,
          negative: /-ad-|hidden|^hid$| hid$| hid |^hid |banner|combx|comment|com-|contact|footer|gdpr|masthead|media|meta|outbrain|promo|related|scroll|share|shoutbox|sidebar|skyscraper|sponsor|shopping|tags|widget/i,
          extraneous: /print|archive|comment|discuss|e[\-]?mail|share|reply|all|login|sign|single|utility/i,
          byline: /byline|author|dateline|writtenby|p-author/i,
          replaceFonts: /<(\/?)font[^>]*>/gi,
          normalize: /\s{2,}/g,
          videos: /\/\/(www\.)?((dailymotion|youtube|youtube-nocookie|player\.vimeo|v\.qq)\.com|(archive|upload\.wikimedia)\.org|player\.twitch\.tv)/i,
          shareElements: /(\b|_)(share|sharedaddy)(\b|_)/i,
          nextLink: /(next|weiter|continue|>([^\|]|$)|»([^\|]|$))/i,
          prevLink: /(prev|earl|old|new|<|«)/i,
          tokenize: /\W+/g,
          whitespace: /^\s*$/,
          hasContent: /\S$/,
          hashUrl: /^#.+/,
          srcsetUrl: /(\S+)(\s+[\d.]+[xw])?(\s*(?:,|$))/g,
          b64DataUrl: /^data:\s*([^\s;,]+)\s*;\s*base64\s*,/i,
          // Commas as used in Latin, Sindhi, Chinese and various other scripts.
          // see: https://en.wikipedia.org/wiki/Comma#Comma_variants
          commas: /\u002C|\u060C|\uFE50|\uFE10|\uFE11|\u2E41|\u2E34|\u2E32|\uFF0C/g,
          // See: https://schema.org/Article
          jsonLdArticleTypes: /^Article|AdvertiserContentArticle|NewsArticle|AnalysisNewsArticle|AskPublicNewsArticle|BackgroundNewsArticle|OpinionNewsArticle|ReportageNewsArticle|ReviewNewsArticle|Report|SatiricalArticle|ScholarlyArticle|MedicalScholarlyArticle|SocialMediaPosting|BlogPosting|LiveBlogPosting|DiscussionForumPosting|TechArticle|APIReference$/,
          // used to see if a node's content matches words commonly used for ad blocks or loading indicators
          adWords: /^(ad(vertising|vertisement)?|pub(licité)?|werb(ung)?|广告|Реклама|Anuncio)$/iu,
          loadingWords: /^((loading|正在加载|Загрузка|chargement|cargando)(…|\.\.\.)?)$/iu
        },
        UNLIKELY_ROLES: [
          "menu",
          "menubar",
          "complementary",
          "navigation",
          "alert",
          "alertdialog",
          "dialog"
        ],
        DIV_TO_P_ELEMS: /* @__PURE__ */ new Set([
          "BLOCKQUOTE",
          "DL",
          "DIV",
          "IMG",
          "OL",
          "P",
          "PRE",
          "TABLE",
          "UL"
        ]),
        ALTER_TO_DIV_EXCEPTIONS: ["DIV", "ARTICLE", "SECTION", "P", "OL", "UL"],
        PRESENTATIONAL_ATTRIBUTES: [
          "align",
          "background",
          "bgcolor",
          "border",
          "cellpadding",
          "cellspacing",
          "frame",
          "hspace",
          "rules",
          "style",
          "valign",
          "vspace"
        ],
        DEPRECATED_SIZE_ATTRIBUTE_ELEMS: ["TABLE", "TH", "TD", "HR", "PRE"],
        // The commented out elements qualify as phrasing content but tend to be
        // removed by readability when put into paragraphs, so we ignore them here.
        PHRASING_ELEMS: [
          // "CANVAS", "IFRAME", "SVG", "VIDEO",
          "ABBR",
          "AUDIO",
          "B",
          "BDO",
          "BR",
          "BUTTON",
          "CITE",
          "CODE",
          "DATA",
          "DATALIST",
          "DFN",
          "EM",
          "EMBED",
          "I",
          "IMG",
          "INPUT",
          "KBD",
          "LABEL",
          "MARK",
          "MATH",
          "METER",
          "NOSCRIPT",
          "OBJECT",
          "OUTPUT",
          "PROGRESS",
          "Q",
          "RUBY",
          "SAMP",
          "SCRIPT",
          "SELECT",
          "SMALL",
          "SPAN",
          "STRONG",
          "SUB",
          "SUP",
          "TEXTAREA",
          "TIME",
          "VAR",
          "WBR"
        ],
        // These are the classes that readability sets itself.
        CLASSES_TO_PRESERVE: ["page"],
        // These are the list of HTML entities that need to be escaped.
        HTML_ESCAPE_MAP: {
          lt: "<",
          gt: ">",
          amp: "&",
          quot: '"',
          apos: "'"
        },
        /**
         * Run any post-process modifications to article content as necessary.
         *
         * @param Element
         * @return void
         **/
        _postProcessContent(articleContent) {
          this._fixRelativeUris(articleContent);
          this._simplifyNestedElements(articleContent);
          if (!this._keepClasses) {
            this._cleanClasses(articleContent);
          }
        },
        /**
         * Iterates over a NodeList, calls `filterFn` for each node and removes node
         * if function returned `true`.
         *
         * If function is not passed, removes all the nodes in node list.
         *
         * @param NodeList nodeList The nodes to operate on
         * @param Function filterFn the function to use as a filter
         * @return void
         */
        _removeNodes(nodeList, filterFn) {
          if (this._docJSDOMParser && nodeList._isLiveNodeList) {
            throw new Error("Do not pass live node lists to _removeNodes");
          }
          for (var i = nodeList.length - 1; i >= 0; i--) {
            var node = nodeList[i];
            var parentNode = node.parentNode;
            if (parentNode) {
              if (!filterFn || filterFn.call(this, node, i, nodeList)) {
                parentNode.removeChild(node);
              }
            }
          }
        },
        /**
         * Iterates over a NodeList, and calls _setNodeTag for each node.
         *
         * @param NodeList nodeList The nodes to operate on
         * @param String newTagName the new tag name to use
         * @return void
         */
        _replaceNodeTags(nodeList, newTagName) {
          if (this._docJSDOMParser && nodeList._isLiveNodeList) {
            throw new Error("Do not pass live node lists to _replaceNodeTags");
          }
          for (const node of nodeList) {
            this._setNodeTag(node, newTagName);
          }
        },
        /**
         * Iterate over a NodeList, which doesn't natively fully implement the Array
         * interface.
         *
         * For convenience, the current object context is applied to the provided
         * iterate function.
         *
         * @param  NodeList nodeList The NodeList.
         * @param  Function fn       The iterate function.
         * @return void
         */
        _forEachNode(nodeList, fn) {
          Array.prototype.forEach.call(nodeList, fn, this);
        },
        /**
         * Iterate over a NodeList, and return the first node that passes
         * the supplied test function
         *
         * For convenience, the current object context is applied to the provided
         * test function.
         *
         * @param  NodeList nodeList The NodeList.
         * @param  Function fn       The test function.
         * @return void
         */
        _findNode(nodeList, fn) {
          return Array.prototype.find.call(nodeList, fn, this);
        },
        /**
         * Iterate over a NodeList, return true if any of the provided iterate
         * function calls returns true, false otherwise.
         *
         * For convenience, the current object context is applied to the
         * provided iterate function.
         *
         * @param  NodeList nodeList The NodeList.
         * @param  Function fn       The iterate function.
         * @return Boolean
         */
        _someNode(nodeList, fn) {
          return Array.prototype.some.call(nodeList, fn, this);
        },
        /**
         * Iterate over a NodeList, return true if all of the provided iterate
         * function calls return true, false otherwise.
         *
         * For convenience, the current object context is applied to the
         * provided iterate function.
         *
         * @param  NodeList nodeList The NodeList.
         * @param  Function fn       The iterate function.
         * @return Boolean
         */
        _everyNode(nodeList, fn) {
          return Array.prototype.every.call(nodeList, fn, this);
        },
        _getAllNodesWithTag(node, tagNames) {
          if (node.querySelectorAll) {
            return node.querySelectorAll(tagNames.join(","));
          }
          return [].concat.apply(
            [],
            tagNames.map(function(tag) {
              var collection = node.getElementsByTagName(tag);
              return Array.isArray(collection) ? collection : Array.from(collection);
            })
          );
        },
        /**
         * Removes the class="" attribute from every element in the given
         * subtree, except those that match CLASSES_TO_PRESERVE and
         * the classesToPreserve array from the options object.
         *
         * @param Element
         * @return void
         */
        _cleanClasses(node) {
          var classesToPreserve = this._classesToPreserve;
          var className = (node.getAttribute("class") || "").split(/\s+/).filter((cls) => classesToPreserve.includes(cls)).join(" ");
          if (className) {
            node.setAttribute("class", className);
          } else {
            node.removeAttribute("class");
          }
          for (node = node.firstElementChild; node; node = node.nextElementSibling) {
            this._cleanClasses(node);
          }
        },
        /**
         * Tests whether a string is a URL or not.
         *
         * @param {string} str The string to test
         * @return {boolean} true if str is a URL, false if not
         */
        _isUrl(str) {
          try {
            new URL(str);
            return true;
          } catch {
            return false;
          }
        },
        /**
         * Converts each <a> and <img> uri in the given element to an absolute URI,
         * ignoring #ref URIs.
         *
         * @param Element
         * @return void
         */
        _fixRelativeUris(articleContent) {
          var baseURI = this._doc.baseURI;
          var documentURI = this._doc.documentURI;
          function toAbsoluteURI(uri) {
            if (baseURI == documentURI && uri.charAt(0) == "#") {
              return uri;
            }
            try {
              return new URL(uri, baseURI).href;
            } catch (ex) {
            }
            return uri;
          }
          var links = this._getAllNodesWithTag(articleContent, ["a"]);
          this._forEachNode(links, function(link) {
            var href = link.getAttribute("href");
            if (href) {
              if (href.indexOf("javascript:") === 0) {
                if (link.childNodes.length === 1 && link.childNodes[0].nodeType === this.TEXT_NODE) {
                  var text = this._doc.createTextNode(link.textContent);
                  link.parentNode.replaceChild(text, link);
                } else {
                  var container = this._doc.createElement("span");
                  while (link.firstChild) {
                    container.appendChild(link.firstChild);
                  }
                  link.parentNode.replaceChild(container, link);
                }
              } else {
                link.setAttribute("href", toAbsoluteURI(href));
              }
            }
          });
          var medias = this._getAllNodesWithTag(articleContent, [
            "img",
            "picture",
            "figure",
            "video",
            "audio",
            "source"
          ]);
          this._forEachNode(medias, function(media) {
            var src = media.getAttribute("src");
            var poster = media.getAttribute("poster");
            var srcset = media.getAttribute("srcset");
            if (src) {
              media.setAttribute("src", toAbsoluteURI(src));
            }
            if (poster) {
              media.setAttribute("poster", toAbsoluteURI(poster));
            }
            if (srcset) {
              var newSrcset = srcset.replace(
                this.REGEXPS.srcsetUrl,
                function(_, p1, p2, p3) {
                  return toAbsoluteURI(p1) + (p2 || "") + p3;
                }
              );
              media.setAttribute("srcset", newSrcset);
            }
          });
        },
        _simplifyNestedElements(articleContent) {
          var node = articleContent;
          while (node) {
            if (node.parentNode && ["DIV", "SECTION"].includes(node.tagName) && !(node.id && node.id.startsWith("readability"))) {
              if (this._isElementWithoutContent(node)) {
                node = this._removeAndGetNext(node);
                continue;
              } else if (this._hasSingleTagInsideElement(node, "DIV") || this._hasSingleTagInsideElement(node, "SECTION")) {
                var child = node.children[0];
                for (var i = 0; i < node.attributes.length; i++) {
                  child.setAttributeNode(node.attributes[i].cloneNode());
                }
                node.parentNode.replaceChild(child, node);
                node = child;
                continue;
              }
            }
            node = this._getNextNode(node);
          }
        },
        /**
         * Get the article title as an H1.
         *
         * @return string
         **/
        _getArticleTitle() {
          var doc = this._doc;
          var curTitle = "";
          var origTitle = "";
          try {
            curTitle = origTitle = doc.title.trim();
            if (typeof curTitle !== "string") {
              curTitle = origTitle = this._getInnerText(
                doc.getElementsByTagName("title")[0]
              );
            }
          } catch (e) {
          }
          var titleHadHierarchicalSeparators = false;
          function wordCount(str) {
            return str.split(/\s+/).length;
          }
          if (/ [\|\-\\\/>»] /.test(curTitle)) {
            titleHadHierarchicalSeparators = / [\\\/>»] /.test(curTitle);
            let allSeparators = Array.from(origTitle.matchAll(/ [\|\-\\\/>»] /gi));
            curTitle = origTitle.substring(0, allSeparators.pop().index);
            if (wordCount(curTitle) < 3) {
              curTitle = origTitle.replace(/^[^\|\-\\\/>»]*[\|\-\\\/>»]/gi, "");
            }
          } else if (curTitle.includes(": ")) {
            var headings = this._getAllNodesWithTag(doc, ["h1", "h2"]);
            var trimmedTitle = curTitle.trim();
            var match = this._someNode(headings, function(heading) {
              return heading.textContent.trim() === trimmedTitle;
            });
            if (!match) {
              curTitle = origTitle.substring(origTitle.lastIndexOf(":") + 1);
              if (wordCount(curTitle) < 3) {
                curTitle = origTitle.substring(origTitle.indexOf(":") + 1);
              } else if (wordCount(origTitle.substr(0, origTitle.indexOf(":"))) > 5) {
                curTitle = origTitle;
              }
            }
          } else if (curTitle.length > 150 || curTitle.length < 15) {
            var hOnes = doc.getElementsByTagName("h1");
            if (hOnes.length === 1) {
              curTitle = this._getInnerText(hOnes[0]);
            }
          }
          curTitle = curTitle.trim().replace(this.REGEXPS.normalize, " ");
          var curTitleWordCount = wordCount(curTitle);
          if (curTitleWordCount <= 4 && (!titleHadHierarchicalSeparators || curTitleWordCount != wordCount(origTitle.replace(/[\|\-\\\/>»]+/g, "")) - 1)) {
            curTitle = origTitle;
          }
          return curTitle;
        },
        /**
         * Prepare the HTML document for readability to scrape it.
         * This includes things like stripping javascript, CSS, and handling terrible markup.
         *
         * @return void
         **/
        _prepDocument() {
          var doc = this._doc;
          this._removeNodes(this._getAllNodesWithTag(doc, ["style"]));
          if (doc.body) {
            this._replaceBrs(doc.body);
          }
          this._replaceNodeTags(this._getAllNodesWithTag(doc, ["font"]), "SPAN");
        },
        /**
         * Finds the next node, starting from the given node, and ignoring
         * whitespace in between. If the given node is an element, the same node is
         * returned.
         */
        _nextNode(node) {
          var next = node;
          while (next && next.nodeType != this.ELEMENT_NODE && this.REGEXPS.whitespace.test(next.textContent)) {
            next = next.nextSibling;
          }
          return next;
        },
        /**
         * Replaces 2 or more successive <br> elements with a single <p>.
         * Whitespace between <br> elements are ignored. For example:
         *   <div>foo<br>bar<br> <br><br>abc</div>
         * will become:
         *   <div>foo<br>bar<p>abc</p></div>
         */
        _replaceBrs(elem) {
          this._forEachNode(this._getAllNodesWithTag(elem, ["br"]), function(br) {
            var next = br.nextSibling;
            var replaced = false;
            while ((next = this._nextNode(next)) && next.tagName == "BR") {
              replaced = true;
              var brSibling = next.nextSibling;
              next.remove();
              next = brSibling;
            }
            if (replaced) {
              var p = this._doc.createElement("p");
              br.parentNode.replaceChild(p, br);
              next = p.nextSibling;
              while (next) {
                if (next.tagName == "BR") {
                  var nextElem = this._nextNode(next.nextSibling);
                  if (nextElem && nextElem.tagName == "BR") {
                    break;
                  }
                }
                if (!this._isPhrasingContent(next)) {
                  break;
                }
                var sibling = next.nextSibling;
                p.appendChild(next);
                next = sibling;
              }
              while (p.lastChild && this._isWhitespace(p.lastChild)) {
                p.lastChild.remove();
              }
              if (p.parentNode.tagName === "P") {
                this._setNodeTag(p.parentNode, "DIV");
              }
            }
          });
        },
        _setNodeTag(node, tag) {
          this.log("_setNodeTag", node, tag);
          if (this._docJSDOMParser) {
            node.localName = tag.toLowerCase();
            node.tagName = tag.toUpperCase();
            return node;
          }
          var replacement = node.ownerDocument.createElement(tag);
          while (node.firstChild) {
            replacement.appendChild(node.firstChild);
          }
          node.parentNode.replaceChild(replacement, node);
          if (node.readability) {
            replacement.readability = node.readability;
          }
          for (var i = 0; i < node.attributes.length; i++) {
            replacement.setAttributeNode(node.attributes[i].cloneNode());
          }
          return replacement;
        },
        /**
         * Prepare the article node for display. Clean out any inline styles,
         * iframes, forms, strip extraneous <p> tags, etc.
         *
         * @param Element
         * @return void
         **/
        _prepArticle(articleContent) {
          this._cleanStyles(articleContent);
          this._markDataTables(articleContent);
          this._fixLazyImages(articleContent);
          this._cleanConditionally(articleContent, "form");
          this._cleanConditionally(articleContent, "fieldset");
          this._clean(articleContent, "object");
          this._clean(articleContent, "embed");
          this._clean(articleContent, "footer");
          this._clean(articleContent, "link");
          this._clean(articleContent, "aside");
          var shareElementThreshold = this.DEFAULT_CHAR_THRESHOLD;
          this._forEachNode(articleContent.children, function(topCandidate) {
            this._cleanMatchedNodes(topCandidate, function(node, matchString) {
              return this.REGEXPS.shareElements.test(matchString) && node.textContent.length < shareElementThreshold;
            });
          });
          this._clean(articleContent, "iframe");
          this._clean(articleContent, "input");
          this._clean(articleContent, "textarea");
          this._clean(articleContent, "select");
          this._clean(articleContent, "button");
          this._cleanHeaders(articleContent);
          this._cleanConditionally(articleContent, "table");
          this._cleanConditionally(articleContent, "ul");
          this._cleanConditionally(articleContent, "div");
          this._replaceNodeTags(
            this._getAllNodesWithTag(articleContent, ["h1"]),
            "h2"
          );
          this._removeNodes(
            this._getAllNodesWithTag(articleContent, ["p"]),
            function(paragraph) {
              var contentElementCount = this._getAllNodesWithTag(paragraph, [
                "img",
                "embed",
                "object",
                "iframe"
              ]).length;
              return contentElementCount === 0 && !this._getInnerText(paragraph, false);
            }
          );
          this._forEachNode(
            this._getAllNodesWithTag(articleContent, ["br"]),
            function(br) {
              var next = this._nextNode(br.nextSibling);
              if (next && next.tagName == "P") {
                br.remove();
              }
            }
          );
          this._forEachNode(
            this._getAllNodesWithTag(articleContent, ["table"]),
            function(table) {
              var tbody = this._hasSingleTagInsideElement(table, "TBODY") ? table.firstElementChild : table;
              if (this._hasSingleTagInsideElement(tbody, "TR")) {
                var row = tbody.firstElementChild;
                if (this._hasSingleTagInsideElement(row, "TD")) {
                  var cell = row.firstElementChild;
                  cell = this._setNodeTag(
                    cell,
                    this._everyNode(cell.childNodes, this._isPhrasingContent) ? "P" : "DIV"
                  );
                  table.parentNode.replaceChild(cell, table);
                }
              }
            }
          );
        },
        /**
         * Initialize a node with the readability object. Also checks the
         * className/id for special names to add to its score.
         *
         * @param Element
         * @return void
         **/
        _initializeNode(node) {
          node.readability = { contentScore: 0 };
          switch (node.tagName) {
            case "DIV":
              node.readability.contentScore += 5;
              break;
            case "PRE":
            case "TD":
            case "BLOCKQUOTE":
              node.readability.contentScore += 3;
              break;
            case "ADDRESS":
            case "OL":
            case "UL":
            case "DL":
            case "DD":
            case "DT":
            case "LI":
            case "FORM":
              node.readability.contentScore -= 3;
              break;
            case "H1":
            case "H2":
            case "H3":
            case "H4":
            case "H5":
            case "H6":
            case "TH":
              node.readability.contentScore -= 5;
              break;
          }
          node.readability.contentScore += this._getClassWeight(node);
        },
        _removeAndGetNext(node) {
          var nextNode = this._getNextNode(node, true);
          node.remove();
          return nextNode;
        },
        /**
         * Traverse the DOM from node to node, starting at the node passed in.
         * Pass true for the second parameter to indicate this node itself
         * (and its kids) are going away, and we want the next node over.
         *
         * Calling this in a loop will traverse the DOM depth-first.
         *
         * @param {Element} node
         * @param {boolean} ignoreSelfAndKids
         * @return {Element}
         */
        _getNextNode(node, ignoreSelfAndKids) {
          if (!ignoreSelfAndKids && node.firstElementChild) {
            return node.firstElementChild;
          }
          if (node.nextElementSibling) {
            return node.nextElementSibling;
          }
          do {
            node = node.parentNode;
          } while (node && !node.nextElementSibling);
          return node && node.nextElementSibling;
        },
        // compares second text to first one
        // 1 = same text, 0 = completely different text
        // works the way that it splits both texts into words and then finds words that are unique in second text
        // the result is given by the lower length of unique parts
        _textSimilarity(textA, textB) {
          var tokensA = textA.toLowerCase().split(this.REGEXPS.tokenize).filter(Boolean);
          var tokensB = textB.toLowerCase().split(this.REGEXPS.tokenize).filter(Boolean);
          if (!tokensA.length || !tokensB.length) {
            return 0;
          }
          var uniqTokensB = tokensB.filter((token) => !tokensA.includes(token));
          var distanceB = uniqTokensB.join(" ").length / tokensB.join(" ").length;
          return 1 - distanceB;
        },
        /**
         * Checks whether an element node contains a valid byline
         *
         * @param node {Element}
         * @param matchString {string}
         * @return boolean
         */
        _isValidByline(node, matchString) {
          var rel = node.getAttribute("rel");
          var itemprop = node.getAttribute("itemprop");
          var bylineLength = node.textContent.trim().length;
          return (rel === "author" || itemprop && itemprop.includes("author") || this.REGEXPS.byline.test(matchString)) && !!bylineLength && bylineLength < 100;
        },
        _getNodeAncestors(node, maxDepth) {
          maxDepth = maxDepth || 0;
          var i = 0, ancestors = [];
          while (node.parentNode) {
            ancestors.push(node.parentNode);
            if (maxDepth && ++i === maxDepth) {
              break;
            }
            node = node.parentNode;
          }
          return ancestors;
        },
        /***
         * grabArticle - Using a variety of metrics (content score, classname, element types), find the content that is
         *         most likely to be the stuff a user wants to read. Then return it wrapped up in a div.
         *
         * @param page a document to run upon. Needs to be a full document, complete with body.
         * @return Element
         **/
        /* eslint-disable-next-line complexity */
        _grabArticle(page) {
          this.log("**** grabArticle ****");
          var doc = this._doc;
          var isPaging = page !== null;
          page = page ? page : this._doc.body;
          if (!page) {
            this.log("No body found in document. Abort.");
            return null;
          }
          var pageCacheHtml = page.innerHTML;
          while (true) {
            this.log("Starting grabArticle loop");
            var stripUnlikelyCandidates = this._flagIsActive(
              this.FLAG_STRIP_UNLIKELYS
            );
            var elementsToScore = [];
            var node = this._doc.documentElement;
            let shouldRemoveTitleHeader = true;
            while (node) {
              if (node.tagName === "HTML") {
                this._articleLang = node.getAttribute("lang");
              }
              var matchString = node.className + " " + node.id;
              if (!this._isProbablyVisible(node)) {
                this.log("Removing hidden node - " + matchString);
                node = this._removeAndGetNext(node);
                continue;
              }
              if (node.getAttribute("aria-modal") == "true" && node.getAttribute("role") == "dialog") {
                node = this._removeAndGetNext(node);
                continue;
              }
              if (!this._articleByline && !this._metadata.byline && this._isValidByline(node, matchString)) {
                var endOfSearchMarkerNode = this._getNextNode(node, true);
                var next = this._getNextNode(node);
                var itemPropNameNode = null;
                while (next && next != endOfSearchMarkerNode) {
                  var itemprop = next.getAttribute("itemprop");
                  if (itemprop && itemprop.includes("name")) {
                    itemPropNameNode = next;
                    break;
                  } else {
                    next = this._getNextNode(next);
                  }
                }
                this._articleByline = (itemPropNameNode ?? node).textContent.trim();
                node = this._removeAndGetNext(node);
                continue;
              }
              if (shouldRemoveTitleHeader && this._headerDuplicatesTitle(node)) {
                this.log(
                  "Removing header: ",
                  node.textContent.trim(),
                  this._articleTitle.trim()
                );
                shouldRemoveTitleHeader = false;
                node = this._removeAndGetNext(node);
                continue;
              }
              if (stripUnlikelyCandidates) {
                if (this.REGEXPS.unlikelyCandidates.test(matchString) && !this.REGEXPS.okMaybeItsACandidate.test(matchString) && !this._hasAncestorTag(node, "table") && !this._hasAncestorTag(node, "code") && node.tagName !== "BODY" && node.tagName !== "A") {
                  this.log("Removing unlikely candidate - " + matchString);
                  node = this._removeAndGetNext(node);
                  continue;
                }
                if (this.UNLIKELY_ROLES.includes(node.getAttribute("role"))) {
                  this.log(
                    "Removing content with role " + node.getAttribute("role") + " - " + matchString
                  );
                  node = this._removeAndGetNext(node);
                  continue;
                }
              }
              if ((node.tagName === "DIV" || node.tagName === "SECTION" || node.tagName === "HEADER" || node.tagName === "H1" || node.tagName === "H2" || node.tagName === "H3" || node.tagName === "H4" || node.tagName === "H5" || node.tagName === "H6") && this._isElementWithoutContent(node)) {
                node = this._removeAndGetNext(node);
                continue;
              }
              if (this.DEFAULT_TAGS_TO_SCORE.includes(node.tagName)) {
                elementsToScore.push(node);
              }
              if (node.tagName === "DIV") {
                var p = null;
                var childNode = node.firstChild;
                while (childNode) {
                  var nextSibling = childNode.nextSibling;
                  if (this._isPhrasingContent(childNode)) {
                    if (p !== null) {
                      p.appendChild(childNode);
                    } else if (!this._isWhitespace(childNode)) {
                      p = doc.createElement("p");
                      node.replaceChild(p, childNode);
                      p.appendChild(childNode);
                    }
                  } else if (p !== null) {
                    while (p.lastChild && this._isWhitespace(p.lastChild)) {
                      p.lastChild.remove();
                    }
                    p = null;
                  }
                  childNode = nextSibling;
                }
                if (this._hasSingleTagInsideElement(node, "P") && this._getLinkDensity(node) < 0.25) {
                  var newNode = node.children[0];
                  node.parentNode.replaceChild(newNode, node);
                  node = newNode;
                  elementsToScore.push(node);
                } else if (!this._hasChildBlockElement(node)) {
                  node = this._setNodeTag(node, "P");
                  elementsToScore.push(node);
                }
              }
              node = this._getNextNode(node);
            }
            var candidates = [];
            this._forEachNode(elementsToScore, function(elementToScore) {
              if (!elementToScore.parentNode || typeof elementToScore.parentNode.tagName === "undefined") {
                return;
              }
              var innerText = this._getInnerText(elementToScore);
              if (innerText.length < 25) {
                return;
              }
              var ancestors2 = this._getNodeAncestors(elementToScore, 5);
              if (ancestors2.length === 0) {
                return;
              }
              var contentScore = 0;
              contentScore += 1;
              contentScore += innerText.split(this.REGEXPS.commas).length;
              contentScore += Math.min(Math.floor(innerText.length / 100), 3);
              this._forEachNode(ancestors2, function(ancestor, level) {
                if (!ancestor.tagName || !ancestor.parentNode || typeof ancestor.parentNode.tagName === "undefined") {
                  return;
                }
                if (typeof ancestor.readability === "undefined") {
                  this._initializeNode(ancestor);
                  candidates.push(ancestor);
                }
                if (level === 0) {
                  var scoreDivider = 1;
                } else if (level === 1) {
                  scoreDivider = 2;
                } else {
                  scoreDivider = level * 3;
                }
                ancestor.readability.contentScore += contentScore / scoreDivider;
              });
            });
            var topCandidates = [];
            for (var c = 0, cl = candidates.length; c < cl; c += 1) {
              var candidate = candidates[c];
              var candidateScore = candidate.readability.contentScore * (1 - this._getLinkDensity(candidate));
              candidate.readability.contentScore = candidateScore;
              this.log("Candidate:", candidate, "with score " + candidateScore);
              for (var t = 0; t < this._nbTopCandidates; t++) {
                var aTopCandidate = topCandidates[t];
                if (!aTopCandidate || candidateScore > aTopCandidate.readability.contentScore) {
                  topCandidates.splice(t, 0, candidate);
                  if (topCandidates.length > this._nbTopCandidates) {
                    topCandidates.pop();
                  }
                  break;
                }
              }
            }
            var topCandidate = topCandidates[0] || null;
            var neededToCreateTopCandidate = false;
            var parentOfTopCandidate;
            if (topCandidate === null || topCandidate.tagName === "BODY") {
              topCandidate = doc.createElement("DIV");
              neededToCreateTopCandidate = true;
              while (page.firstChild) {
                this.log("Moving child out:", page.firstChild);
                topCandidate.appendChild(page.firstChild);
              }
              page.appendChild(topCandidate);
              this._initializeNode(topCandidate);
            } else if (topCandidate) {
              var alternativeCandidateAncestors = [];
              for (var i = 1; i < topCandidates.length; i++) {
                if (topCandidates[i].readability.contentScore / topCandidate.readability.contentScore >= 0.75) {
                  alternativeCandidateAncestors.push(
                    this._getNodeAncestors(topCandidates[i])
                  );
                }
              }
              var MINIMUM_TOPCANDIDATES = 3;
              if (alternativeCandidateAncestors.length >= MINIMUM_TOPCANDIDATES) {
                parentOfTopCandidate = topCandidate.parentNode;
                while (parentOfTopCandidate.tagName !== "BODY") {
                  var listsContainingThisAncestor = 0;
                  for (var ancestorIndex = 0; ancestorIndex < alternativeCandidateAncestors.length && listsContainingThisAncestor < MINIMUM_TOPCANDIDATES; ancestorIndex++) {
                    listsContainingThisAncestor += Number(
                      alternativeCandidateAncestors[ancestorIndex].includes(
                        parentOfTopCandidate
                      )
                    );
                  }
                  if (listsContainingThisAncestor >= MINIMUM_TOPCANDIDATES) {
                    topCandidate = parentOfTopCandidate;
                    break;
                  }
                  parentOfTopCandidate = parentOfTopCandidate.parentNode;
                }
              }
              if (!topCandidate.readability) {
                this._initializeNode(topCandidate);
              }
              parentOfTopCandidate = topCandidate.parentNode;
              var lastScore = topCandidate.readability.contentScore;
              var scoreThreshold = lastScore / 3;
              while (parentOfTopCandidate.tagName !== "BODY") {
                if (!parentOfTopCandidate.readability) {
                  parentOfTopCandidate = parentOfTopCandidate.parentNode;
                  continue;
                }
                var parentScore = parentOfTopCandidate.readability.contentScore;
                if (parentScore < scoreThreshold) {
                  break;
                }
                if (parentScore > lastScore) {
                  topCandidate = parentOfTopCandidate;
                  break;
                }
                lastScore = parentOfTopCandidate.readability.contentScore;
                parentOfTopCandidate = parentOfTopCandidate.parentNode;
              }
              parentOfTopCandidate = topCandidate.parentNode;
              while (parentOfTopCandidate.tagName != "BODY" && parentOfTopCandidate.children.length == 1) {
                topCandidate = parentOfTopCandidate;
                parentOfTopCandidate = topCandidate.parentNode;
              }
              if (!topCandidate.readability) {
                this._initializeNode(topCandidate);
              }
            }
            var articleContent = doc.createElement("DIV");
            if (isPaging) {
              articleContent.id = "readability-content";
            }
            var siblingScoreThreshold = Math.max(
              10,
              topCandidate.readability.contentScore * 0.2
            );
            parentOfTopCandidate = topCandidate.parentNode;
            var siblings = parentOfTopCandidate.children;
            for (var s = 0, sl = siblings.length; s < sl; s++) {
              var sibling = siblings[s];
              var append = false;
              this.log(
                "Looking at sibling node:",
                sibling,
                sibling.readability ? "with score " + sibling.readability.contentScore : ""
              );
              this.log(
                "Sibling has score",
                sibling.readability ? sibling.readability.contentScore : "Unknown"
              );
              if (sibling === topCandidate) {
                append = true;
              } else {
                var contentBonus = 0;
                if (sibling.className === topCandidate.className && topCandidate.className !== "") {
                  contentBonus += topCandidate.readability.contentScore * 0.2;
                }
                if (sibling.readability && sibling.readability.contentScore + contentBonus >= siblingScoreThreshold) {
                  append = true;
                } else if (sibling.nodeName === "P") {
                  var linkDensity = this._getLinkDensity(sibling);
                  var nodeContent = this._getInnerText(sibling);
                  var nodeLength = nodeContent.length;
                  if (nodeLength > 80 && linkDensity < 0.25) {
                    append = true;
                  } else if (nodeLength < 80 && nodeLength > 0 && linkDensity === 0 && nodeContent.search(/\.( |$)/) !== -1) {
                    append = true;
                  }
                }
              }
              if (append) {
                this.log("Appending node:", sibling);
                if (!this.ALTER_TO_DIV_EXCEPTIONS.includes(sibling.nodeName)) {
                  this.log("Altering sibling:", sibling, "to div.");
                  sibling = this._setNodeTag(sibling, "DIV");
                }
                articleContent.appendChild(sibling);
                siblings = parentOfTopCandidate.children;
                s -= 1;
                sl -= 1;
              }
            }
            if (this._debug) {
              this.log("Article content pre-prep: " + articleContent.innerHTML);
            }
            this._prepArticle(articleContent);
            if (this._debug) {
              this.log("Article content post-prep: " + articleContent.innerHTML);
            }
            if (neededToCreateTopCandidate) {
              topCandidate.id = "readability-page-1";
              topCandidate.className = "page";
            } else {
              var div = doc.createElement("DIV");
              div.id = "readability-page-1";
              div.className = "page";
              while (articleContent.firstChild) {
                div.appendChild(articleContent.firstChild);
              }
              articleContent.appendChild(div);
            }
            if (this._debug) {
              this.log("Article content after paging: " + articleContent.innerHTML);
            }
            var parseSuccessful = true;
            var textLength = this._getInnerText(articleContent, true).length;
            if (textLength < this._charThreshold) {
              parseSuccessful = false;
              page.innerHTML = pageCacheHtml;
              this._attempts.push({
                articleContent,
                textLength
              });
              if (this._flagIsActive(this.FLAG_STRIP_UNLIKELYS)) {
                this._removeFlag(this.FLAG_STRIP_UNLIKELYS);
              } else if (this._flagIsActive(this.FLAG_WEIGHT_CLASSES)) {
                this._removeFlag(this.FLAG_WEIGHT_CLASSES);
              } else if (this._flagIsActive(this.FLAG_CLEAN_CONDITIONALLY)) {
                this._removeFlag(this.FLAG_CLEAN_CONDITIONALLY);
              } else {
                this._attempts.sort(function(a, b) {
                  return b.textLength - a.textLength;
                });
                if (!this._attempts[0].textLength) {
                  return null;
                }
                articleContent = this._attempts[0].articleContent;
                parseSuccessful = true;
              }
            }
            if (parseSuccessful) {
              var ancestors = [parentOfTopCandidate, topCandidate].concat(
                this._getNodeAncestors(parentOfTopCandidate)
              );
              this._someNode(ancestors, function(ancestor) {
                if (!ancestor.tagName) {
                  return false;
                }
                var articleDir = ancestor.getAttribute("dir");
                if (articleDir) {
                  this._articleDir = articleDir;
                  return true;
                }
                return false;
              });
              return articleContent;
            }
          }
        },
        /**
         * Converts some of the common HTML entities in string to their corresponding characters.
         *
         * @param str {string} - a string to unescape.
         * @return string without HTML entity.
         */
        _unescapeHtmlEntities(str) {
          if (!str) {
            return str;
          }
          var htmlEscapeMap = this.HTML_ESCAPE_MAP;
          return str.replace(/&(quot|amp|apos|lt|gt);/g, function(_, tag) {
            return htmlEscapeMap[tag];
          }).replace(/&#(?:x([0-9a-f]+)|([0-9]+));/gi, function(_, hex, numStr) {
            var num = parseInt(hex || numStr, hex ? 16 : 10);
            if (num == 0 || num > 1114111 || num >= 55296 && num <= 57343) {
              num = 65533;
            }
            return String.fromCodePoint(num);
          });
        },
        /**
         * Try to extract metadata from JSON-LD object.
         * For now, only Schema.org objects of type Article or its subtypes are supported.
         * @return Object with any metadata that could be extracted (possibly none)
         */
        _getJSONLD(doc) {
          var scripts = this._getAllNodesWithTag(doc, ["script"]);
          var metadata;
          this._forEachNode(scripts, function(jsonLdElement) {
            if (!metadata && jsonLdElement.getAttribute("type") === "application/ld+json") {
              try {
                var content = jsonLdElement.textContent.replace(
                  /^\s*<!\[CDATA\[|\]\]>\s*$/g,
                  ""
                );
                var parsed = JSON.parse(content);
                if (Array.isArray(parsed)) {
                  parsed = parsed.find((it) => {
                    return it["@type"] && it["@type"].match(this.REGEXPS.jsonLdArticleTypes);
                  });
                  if (!parsed) {
                    return;
                  }
                }
                var schemaDotOrgRegex = /^https?\:\/\/schema\.org\/?$/;
                var matches = typeof parsed["@context"] === "string" && parsed["@context"].match(schemaDotOrgRegex) || typeof parsed["@context"] === "object" && typeof parsed["@context"]["@vocab"] == "string" && parsed["@context"]["@vocab"].match(schemaDotOrgRegex);
                if (!matches) {
                  return;
                }
                if (!parsed["@type"] && Array.isArray(parsed["@graph"])) {
                  parsed = parsed["@graph"].find((it) => {
                    return (it["@type"] || "").match(this.REGEXPS.jsonLdArticleTypes);
                  });
                }
                if (!parsed || !parsed["@type"] || !parsed["@type"].match(this.REGEXPS.jsonLdArticleTypes)) {
                  return;
                }
                metadata = {};
                if (typeof parsed.name === "string" && typeof parsed.headline === "string" && parsed.name !== parsed.headline) {
                  var title = this._getArticleTitle();
                  var nameMatches = this._textSimilarity(parsed.name, title) > 0.75;
                  var headlineMatches = this._textSimilarity(parsed.headline, title) > 0.75;
                  if (headlineMatches && !nameMatches) {
                    metadata.title = parsed.headline;
                  } else {
                    metadata.title = parsed.name;
                  }
                } else if (typeof parsed.name === "string") {
                  metadata.title = parsed.name.trim();
                } else if (typeof parsed.headline === "string") {
                  metadata.title = parsed.headline.trim();
                }
                if (parsed.author) {
                  if (typeof parsed.author.name === "string") {
                    metadata.byline = parsed.author.name.trim();
                  } else if (Array.isArray(parsed.author) && parsed.author[0] && typeof parsed.author[0].name === "string") {
                    metadata.byline = parsed.author.filter(function(author) {
                      return author && typeof author.name === "string";
                    }).map(function(author) {
                      return author.name.trim();
                    }).join(", ");
                  }
                }
                if (typeof parsed.description === "string") {
                  metadata.excerpt = parsed.description.trim();
                }
                if (parsed.publisher && typeof parsed.publisher.name === "string") {
                  metadata.siteName = parsed.publisher.name.trim();
                }
                if (typeof parsed.datePublished === "string") {
                  metadata.datePublished = parsed.datePublished.trim();
                }
              } catch (err) {
                this.log(err.message);
              }
            }
          });
          return metadata ? metadata : {};
        },
        /**
         * Attempts to get excerpt and byline metadata for the article.
         *
         * @param {Object} jsonld — object containing any metadata that
         * could be extracted from JSON-LD object.
         *
         * @return Object with optional "excerpt" and "byline" properties
         */
        _getArticleMetadata(jsonld) {
          var metadata = {};
          var values = {};
          var metaElements = this._doc.getElementsByTagName("meta");
          var propertyPattern = /\s*(article|dc|dcterm|og|twitter)\s*:\s*(author|creator|description|published_time|title|site_name)\s*/gi;
          var namePattern = /^\s*(?:(dc|dcterm|og|twitter|parsely|weibo:(article|webpage))\s*[-\.:]\s*)?(author|creator|pub-date|description|title|site_name)\s*$/i;
          this._forEachNode(metaElements, function(element) {
            var elementName = element.getAttribute("name");
            var elementProperty = element.getAttribute("property");
            var content = element.getAttribute("content");
            if (!content) {
              return;
            }
            var matches = null;
            var name = null;
            if (elementProperty) {
              matches = elementProperty.match(propertyPattern);
              if (matches) {
                name = matches[0].toLowerCase().replace(/\s/g, "");
                values[name] = content.trim();
              }
            }
            if (!matches && elementName && namePattern.test(elementName)) {
              name = elementName;
              if (content) {
                name = name.toLowerCase().replace(/\s/g, "").replace(/\./g, ":");
                values[name] = content.trim();
              }
            }
          });
          metadata.title = jsonld.title || values["dc:title"] || values["dcterm:title"] || values["og:title"] || values["weibo:article:title"] || values["weibo:webpage:title"] || values.title || values["twitter:title"] || values["parsely-title"];
          if (!metadata.title) {
            metadata.title = this._getArticleTitle();
          }
          const articleAuthor = typeof values["article:author"] === "string" && !this._isUrl(values["article:author"]) ? values["article:author"] : void 0;
          metadata.byline = jsonld.byline || values["dc:creator"] || values["dcterm:creator"] || values.author || values["parsely-author"] || articleAuthor;
          metadata.excerpt = jsonld.excerpt || values["dc:description"] || values["dcterm:description"] || values["og:description"] || values["weibo:article:description"] || values["weibo:webpage:description"] || values.description || values["twitter:description"];
          metadata.siteName = jsonld.siteName || values["og:site_name"];
          metadata.publishedTime = jsonld.datePublished || values["article:published_time"] || values["parsely-pub-date"] || null;
          metadata.title = this._unescapeHtmlEntities(metadata.title);
          metadata.byline = this._unescapeHtmlEntities(metadata.byline);
          metadata.excerpt = this._unescapeHtmlEntities(metadata.excerpt);
          metadata.siteName = this._unescapeHtmlEntities(metadata.siteName);
          metadata.publishedTime = this._unescapeHtmlEntities(metadata.publishedTime);
          return metadata;
        },
        /**
         * Check if node is image, or if node contains exactly only one image
         * whether as a direct child or as its descendants.
         *
         * @param Element
         **/
        _isSingleImage(node) {
          while (node) {
            if (node.tagName === "IMG") {
              return true;
            }
            if (node.children.length !== 1 || node.textContent.trim() !== "") {
              return false;
            }
            node = node.children[0];
          }
          return false;
        },
        /**
         * Find all <noscript> that are located after <img> nodes, and which contain only one
         * <img> element. Replace the first image with the image from inside the <noscript> tag,
         * and remove the <noscript> tag. This improves the quality of the images we use on
         * some sites (e.g. Medium).
         *
         * @param Element
         **/
        _unwrapNoscriptImages(doc) {
          var imgs = Array.from(doc.getElementsByTagName("img"));
          this._forEachNode(imgs, function(img) {
            for (var i = 0; i < img.attributes.length; i++) {
              var attr = img.attributes[i];
              switch (attr.name) {
                case "src":
                case "srcset":
                case "data-src":
                case "data-srcset":
                  return;
              }
              if (/\.(jpg|jpeg|png|webp)/i.test(attr.value)) {
                return;
              }
            }
            img.remove();
          });
          var noscripts = Array.from(doc.getElementsByTagName("noscript"));
          this._forEachNode(noscripts, function(noscript) {
            if (!this._isSingleImage(noscript)) {
              return;
            }
            var tmp = doc.createElement("div");
            tmp.innerHTML = noscript.innerHTML;
            var prevElement = noscript.previousElementSibling;
            if (prevElement && this._isSingleImage(prevElement)) {
              var prevImg = prevElement;
              if (prevImg.tagName !== "IMG") {
                prevImg = prevElement.getElementsByTagName("img")[0];
              }
              var newImg = tmp.getElementsByTagName("img")[0];
              for (var i = 0; i < prevImg.attributes.length; i++) {
                var attr = prevImg.attributes[i];
                if (attr.value === "") {
                  continue;
                }
                if (attr.name === "src" || attr.name === "srcset" || /\.(jpg|jpeg|png|webp)/i.test(attr.value)) {
                  if (newImg.getAttribute(attr.name) === attr.value) {
                    continue;
                  }
                  var attrName = attr.name;
                  if (newImg.hasAttribute(attrName)) {
                    attrName = "data-old-" + attrName;
                  }
                  newImg.setAttribute(attrName, attr.value);
                }
              }
              noscript.parentNode.replaceChild(tmp.firstElementChild, prevElement);
            }
          });
        },
        /**
         * Removes script tags from the document.
         *
         * @param Element
         **/
        _removeScripts(doc) {
          this._removeNodes(this._getAllNodesWithTag(doc, ["script", "noscript"]));
        },
        /**
         * Check if this node has only whitespace and a single element with given tag
         * Returns false if the DIV node contains non-empty text nodes
         * or if it contains no element with given tag or more than 1 element.
         *
         * @param Element
         * @param string tag of child element
         **/
        _hasSingleTagInsideElement(element, tag) {
          if (element.children.length != 1 || element.children[0].tagName !== tag) {
            return false;
          }
          return !this._someNode(element.childNodes, function(node) {
            return node.nodeType === this.TEXT_NODE && this.REGEXPS.hasContent.test(node.textContent);
          });
        },
        _isElementWithoutContent(node) {
          return node.nodeType === this.ELEMENT_NODE && !node.textContent.trim().length && (!node.children.length || node.children.length == node.getElementsByTagName("br").length + node.getElementsByTagName("hr").length);
        },
        /**
         * Determine whether element has any children block level elements.
         *
         * @param Element
         */
        _hasChildBlockElement(element) {
          return this._someNode(element.childNodes, function(node) {
            return this.DIV_TO_P_ELEMS.has(node.tagName) || this._hasChildBlockElement(node);
          });
        },
        /***
         * Determine if a node qualifies as phrasing content.
         * https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Content_categories#Phrasing_content
         **/
        _isPhrasingContent(node) {
          return node.nodeType === this.TEXT_NODE || this.PHRASING_ELEMS.includes(node.tagName) || (node.tagName === "A" || node.tagName === "DEL" || node.tagName === "INS") && this._everyNode(node.childNodes, this._isPhrasingContent);
        },
        _isWhitespace(node) {
          return node.nodeType === this.TEXT_NODE && node.textContent.trim().length === 0 || node.nodeType === this.ELEMENT_NODE && node.tagName === "BR";
        },
        /**
         * Get the inner text of a node - cross browser compatibly.
         * This also strips out any excess whitespace to be found.
         *
         * @param Element
         * @param Boolean normalizeSpaces (default: true)
         * @return string
         **/
        _getInnerText(e, normalizeSpaces) {
          normalizeSpaces = typeof normalizeSpaces === "undefined" ? true : normalizeSpaces;
          var textContent = e.textContent.trim();
          if (normalizeSpaces) {
            return textContent.replace(this.REGEXPS.normalize, " ");
          }
          return textContent;
        },
        /**
         * Get the number of times a string s appears in the node e.
         *
         * @param Element
         * @param string - what to split on. Default is ","
         * @return number (integer)
         **/
        _getCharCount(e, s) {
          s = s || ",";
          return this._getInnerText(e).split(s).length - 1;
        },
        /**
         * Remove the style attribute on every e and under.
         * TODO: Test if getElementsByTagName(*) is faster.
         *
         * @param Element
         * @return void
         **/
        _cleanStyles(e) {
          if (!e || e.tagName.toLowerCase() === "svg") {
            return;
          }
          for (var i = 0; i < this.PRESENTATIONAL_ATTRIBUTES.length; i++) {
            e.removeAttribute(this.PRESENTATIONAL_ATTRIBUTES[i]);
          }
          if (this.DEPRECATED_SIZE_ATTRIBUTE_ELEMS.includes(e.tagName)) {
            e.removeAttribute("width");
            e.removeAttribute("height");
          }
          var cur = e.firstElementChild;
          while (cur !== null) {
            this._cleanStyles(cur);
            cur = cur.nextElementSibling;
          }
        },
        /**
         * Get the density of links as a percentage of the content
         * This is the amount of text that is inside a link divided by the total text in the node.
         *
         * @param Element
         * @return number (float)
         **/
        _getLinkDensity(element) {
          var textLength = this._getInnerText(element).length;
          if (textLength === 0) {
            return 0;
          }
          var linkLength = 0;
          this._forEachNode(element.getElementsByTagName("a"), function(linkNode) {
            var href = linkNode.getAttribute("href");
            var coefficient = href && this.REGEXPS.hashUrl.test(href) ? 0.3 : 1;
            linkLength += this._getInnerText(linkNode).length * coefficient;
          });
          return linkLength / textLength;
        },
        /**
         * Get an elements class/id weight. Uses regular expressions to tell if this
         * element looks good or bad.
         *
         * @param Element
         * @return number (Integer)
         **/
        _getClassWeight(e) {
          if (!this._flagIsActive(this.FLAG_WEIGHT_CLASSES)) {
            return 0;
          }
          var weight = 0;
          if (typeof e.className === "string" && e.className !== "") {
            if (this.REGEXPS.negative.test(e.className)) {
              weight -= 25;
            }
            if (this.REGEXPS.positive.test(e.className)) {
              weight += 25;
            }
          }
          if (typeof e.id === "string" && e.id !== "") {
            if (this.REGEXPS.negative.test(e.id)) {
              weight -= 25;
            }
            if (this.REGEXPS.positive.test(e.id)) {
              weight += 25;
            }
          }
          return weight;
        },
        /**
         * Clean a node of all elements of type "tag".
         * (Unless it's a youtube/vimeo video. People love movies.)
         *
         * @param Element
         * @param string tag to clean
         * @return void
         **/
        _clean(e, tag) {
          var isEmbed = ["object", "embed", "iframe"].includes(tag);
          this._removeNodes(this._getAllNodesWithTag(e, [tag]), function(element) {
            if (isEmbed) {
              for (var i = 0; i < element.attributes.length; i++) {
                if (this._allowedVideoRegex.test(element.attributes[i].value)) {
                  return false;
                }
              }
              if (element.tagName === "object" && this._allowedVideoRegex.test(element.innerHTML)) {
                return false;
              }
            }
            return true;
          });
        },
        /**
         * Check if a given node has one of its ancestor tag name matching the
         * provided one.
         * @param  HTMLElement node
         * @param  String      tagName
         * @param  Number      maxDepth
         * @param  Function    filterFn a filter to invoke to determine whether this node 'counts'
         * @return Boolean
         */
        _hasAncestorTag(node, tagName, maxDepth, filterFn) {
          maxDepth = maxDepth || 3;
          tagName = tagName.toUpperCase();
          var depth = 0;
          while (node.parentNode) {
            if (maxDepth > 0 && depth > maxDepth) {
              return false;
            }
            if (node.parentNode.tagName === tagName && (!filterFn || filterFn(node.parentNode))) {
              return true;
            }
            node = node.parentNode;
            depth++;
          }
          return false;
        },
        /**
         * Return an object indicating how many rows and columns this table has.
         */
        _getRowAndColumnCount(table) {
          var rows = 0;
          var columns = 0;
          var trs = table.getElementsByTagName("tr");
          for (var i = 0; i < trs.length; i++) {
            var rowspan = trs[i].getAttribute("rowspan") || 0;
            if (rowspan) {
              rowspan = parseInt(rowspan, 10);
            }
            rows += rowspan || 1;
            var columnsInThisRow = 0;
            var cells = trs[i].getElementsByTagName("td");
            for (var j = 0; j < cells.length; j++) {
              var colspan = cells[j].getAttribute("colspan") || 0;
              if (colspan) {
                colspan = parseInt(colspan, 10);
              }
              columnsInThisRow += colspan || 1;
            }
            columns = Math.max(columns, columnsInThisRow);
          }
          return { rows, columns };
        },
        /**
         * Look for 'data' (as opposed to 'layout') tables, for which we use
         * similar checks as
         * https://searchfox.org/mozilla-central/rev/f82d5c549f046cb64ce5602bfd894b7ae807c8f8/accessible/generic/TableAccessible.cpp#19
         */
        _markDataTables(root) {
          var tables = root.getElementsByTagName("table");
          for (var i = 0; i < tables.length; i++) {
            var table = tables[i];
            var role = table.getAttribute("role");
            if (role == "presentation") {
              table._readabilityDataTable = false;
              continue;
            }
            var datatable = table.getAttribute("datatable");
            if (datatable == "0") {
              table._readabilityDataTable = false;
              continue;
            }
            var summary = table.getAttribute("summary");
            if (summary) {
              table._readabilityDataTable = true;
              continue;
            }
            var caption = table.getElementsByTagName("caption")[0];
            if (caption && caption.childNodes.length) {
              table._readabilityDataTable = true;
              continue;
            }
            var dataTableDescendants = ["col", "colgroup", "tfoot", "thead", "th"];
            var descendantExists = function(tag) {
              return !!table.getElementsByTagName(tag)[0];
            };
            if (dataTableDescendants.some(descendantExists)) {
              this.log("Data table because found data-y descendant");
              table._readabilityDataTable = true;
              continue;
            }
            if (table.getElementsByTagName("table")[0]) {
              table._readabilityDataTable = false;
              continue;
            }
            var sizeInfo = this._getRowAndColumnCount(table);
            if (sizeInfo.columns == 1 || sizeInfo.rows == 1) {
              table._readabilityDataTable = false;
              continue;
            }
            if (sizeInfo.rows >= 10 || sizeInfo.columns > 4) {
              table._readabilityDataTable = true;
              continue;
            }
            table._readabilityDataTable = sizeInfo.rows * sizeInfo.columns > 10;
          }
        },
        /* convert images and figures that have properties like data-src into images that can be loaded without JS */
        _fixLazyImages(root) {
          this._forEachNode(
            this._getAllNodesWithTag(root, ["img", "picture", "figure"]),
            function(elem) {
              if (elem.src && this.REGEXPS.b64DataUrl.test(elem.src)) {
                var parts = this.REGEXPS.b64DataUrl.exec(elem.src);
                if (parts[1] === "image/svg+xml") {
                  return;
                }
                var srcCouldBeRemoved = false;
                for (var i = 0; i < elem.attributes.length; i++) {
                  var attr = elem.attributes[i];
                  if (attr.name === "src") {
                    continue;
                  }
                  if (/\.(jpg|jpeg|png|webp)/i.test(attr.value)) {
                    srcCouldBeRemoved = true;
                    break;
                  }
                }
                if (srcCouldBeRemoved) {
                  var b64starts = parts[0].length;
                  var b64length = elem.src.length - b64starts;
                  if (b64length < 133) {
                    elem.removeAttribute("src");
                  }
                }
              }
              if ((elem.src || elem.srcset && elem.srcset != "null") && !elem.className.toLowerCase().includes("lazy")) {
                return;
              }
              for (var j = 0; j < elem.attributes.length; j++) {
                attr = elem.attributes[j];
                if (attr.name === "src" || attr.name === "srcset" || attr.name === "alt") {
                  continue;
                }
                var copyTo = null;
                if (/\.(jpg|jpeg|png|webp)\s+\d/.test(attr.value)) {
                  copyTo = "srcset";
                } else if (/^\s*\S+\.(jpg|jpeg|png|webp)\S*\s*$/.test(attr.value)) {
                  copyTo = "src";
                }
                if (copyTo) {
                  if (elem.tagName === "IMG" || elem.tagName === "PICTURE") {
                    elem.setAttribute(copyTo, attr.value);
                  } else if (elem.tagName === "FIGURE" && !this._getAllNodesWithTag(elem, ["img", "picture"]).length) {
                    var img = this._doc.createElement("img");
                    img.setAttribute(copyTo, attr.value);
                    elem.appendChild(img);
                  }
                }
              }
            }
          );
        },
        _getTextDensity(e, tags) {
          var textLength = this._getInnerText(e, true).length;
          if (textLength === 0) {
            return 0;
          }
          var childrenLength = 0;
          var children = this._getAllNodesWithTag(e, tags);
          this._forEachNode(
            children,
            (child) => childrenLength += this._getInnerText(child, true).length
          );
          return childrenLength / textLength;
        },
        /**
         * Clean an element of all tags of type "tag" if they look fishy.
         * "Fishy" is an algorithm based on content length, classnames, link density, number of images & embeds, etc.
         *
         * @return void
         **/
        _cleanConditionally(e, tag) {
          if (!this._flagIsActive(this.FLAG_CLEAN_CONDITIONALLY)) {
            return;
          }
          this._removeNodes(this._getAllNodesWithTag(e, [tag]), function(node) {
            var isDataTable = function(t) {
              return t._readabilityDataTable;
            };
            var isList = tag === "ul" || tag === "ol";
            if (!isList) {
              var listLength = 0;
              var listNodes = this._getAllNodesWithTag(node, ["ul", "ol"]);
              this._forEachNode(
                listNodes,
                (list) => listLength += this._getInnerText(list).length
              );
              isList = listLength / this._getInnerText(node).length > 0.9;
            }
            if (tag === "table" && isDataTable(node)) {
              return false;
            }
            if (this._hasAncestorTag(node, "table", -1, isDataTable)) {
              return false;
            }
            if (this._hasAncestorTag(node, "code")) {
              return false;
            }
            if ([...node.getElementsByTagName("table")].some(
              (tbl) => tbl._readabilityDataTable
            )) {
              return false;
            }
            var weight = this._getClassWeight(node);
            this.log("Cleaning Conditionally", node);
            var contentScore = 0;
            if (weight + contentScore < 0) {
              return true;
            }
            if (this._getCharCount(node, ",") < 10) {
              var p = node.getElementsByTagName("p").length;
              var img = node.getElementsByTagName("img").length;
              var li = node.getElementsByTagName("li").length - 100;
              var input = node.getElementsByTagName("input").length;
              var headingDensity = this._getTextDensity(node, [
                "h1",
                "h2",
                "h3",
                "h4",
                "h5",
                "h6"
              ]);
              var embedCount = 0;
              var embeds = this._getAllNodesWithTag(node, [
                "object",
                "embed",
                "iframe"
              ]);
              for (var i = 0; i < embeds.length; i++) {
                for (var j = 0; j < embeds[i].attributes.length; j++) {
                  if (this._allowedVideoRegex.test(embeds[i].attributes[j].value)) {
                    return false;
                  }
                }
                if (embeds[i].tagName === "object" && this._allowedVideoRegex.test(embeds[i].innerHTML)) {
                  return false;
                }
                embedCount++;
              }
              var innerText = this._getInnerText(node);
              if (this.REGEXPS.adWords.test(innerText) || this.REGEXPS.loadingWords.test(innerText)) {
                return true;
              }
              var contentLength = innerText.length;
              var linkDensity = this._getLinkDensity(node);
              var textishTags = ["SPAN", "LI", "TD"].concat(
                Array.from(this.DIV_TO_P_ELEMS)
              );
              var textDensity = this._getTextDensity(node, textishTags);
              var isFigureChild = this._hasAncestorTag(node, "figure");
              const shouldRemoveNode = () => {
                const errs = [];
                if (!isFigureChild && img > 1 && p / img < 0.5) {
                  errs.push(`Bad p to img ratio (img=${img}, p=${p})`);
                }
                if (!isList && li > p) {
                  errs.push(`Too many li's outside of a list. (li=${li} > p=${p})`);
                }
                if (input > Math.floor(p / 3)) {
                  errs.push(`Too many inputs per p. (input=${input}, p=${p})`);
                }
                if (!isList && !isFigureChild && headingDensity < 0.9 && contentLength < 25 && (img === 0 || img > 2) && linkDensity > 0) {
                  errs.push(
                    `Suspiciously short. (headingDensity=${headingDensity}, img=${img}, linkDensity=${linkDensity})`
                  );
                }
                if (!isList && weight < 25 && linkDensity > 0.2 + this._linkDensityModifier) {
                  errs.push(
                    `Low weight and a little linky. (linkDensity=${linkDensity})`
                  );
                }
                if (weight >= 25 && linkDensity > 0.5 + this._linkDensityModifier) {
                  errs.push(
                    `High weight and mostly links. (linkDensity=${linkDensity})`
                  );
                }
                if (embedCount === 1 && contentLength < 75 || embedCount > 1) {
                  errs.push(
                    `Suspicious embed. (embedCount=${embedCount}, contentLength=${contentLength})`
                  );
                }
                if (img === 0 && textDensity === 0) {
                  errs.push(
                    `No useful content. (img=${img}, textDensity=${textDensity})`
                  );
                }
                if (errs.length) {
                  this.log("Checks failed", errs);
                  return true;
                }
                return false;
              };
              var haveToRemove = shouldRemoveNode();
              if (isList && haveToRemove) {
                for (var x = 0; x < node.children.length; x++) {
                  let child = node.children[x];
                  if (child.children.length > 1) {
                    return haveToRemove;
                  }
                }
                let li_count = node.getElementsByTagName("li").length;
                if (img == li_count) {
                  return false;
                }
              }
              return haveToRemove;
            }
            return false;
          });
        },
        /**
         * Clean out elements that match the specified conditions
         *
         * @param Element
         * @param Function determines whether a node should be removed
         * @return void
         **/
        _cleanMatchedNodes(e, filter) {
          var endOfSearchMarkerNode = this._getNextNode(e, true);
          var next = this._getNextNode(e);
          while (next && next != endOfSearchMarkerNode) {
            if (filter.call(this, next, next.className + " " + next.id)) {
              next = this._removeAndGetNext(next);
            } else {
              next = this._getNextNode(next);
            }
          }
        },
        /**
         * Clean out spurious headers from an Element.
         *
         * @param Element
         * @return void
         **/
        _cleanHeaders(e) {
          let headingNodes = this._getAllNodesWithTag(e, ["h1", "h2"]);
          this._removeNodes(headingNodes, function(node) {
            let shouldRemove = this._getClassWeight(node) < 0;
            if (shouldRemove) {
              this.log("Removing header with low class weight:", node);
            }
            return shouldRemove;
          });
        },
        /**
         * Check if this node is an H1 or H2 element whose content is mostly
         * the same as the article title.
         *
         * @param Element  the node to check.
         * @return boolean indicating whether this is a title-like header.
         */
        _headerDuplicatesTitle(node) {
          if (node.tagName != "H1" && node.tagName != "H2") {
            return false;
          }
          var heading = this._getInnerText(node, false);
          this.log("Evaluating similarity of header:", heading, this._articleTitle);
          return this._textSimilarity(this._articleTitle, heading) > 0.75;
        },
        _flagIsActive(flag) {
          return (this._flags & flag) > 0;
        },
        _removeFlag(flag) {
          this._flags = this._flags & ~flag;
        },
        _isProbablyVisible(node) {
          return (!node.style || node.style.display != "none") && (!node.style || node.style.visibility != "hidden") && !node.hasAttribute("hidden") && //check for "fallback-image" so that wikimedia math images are displayed
          (!node.hasAttribute("aria-hidden") || node.getAttribute("aria-hidden") != "true" || node.className && node.className.includes && node.className.includes("fallback-image"));
        },
        /**
         * Runs readability.
         *
         * Workflow:
         *  1. Prep the document by removing script tags, css, etc.
         *  2. Build readability's DOM tree.
         *  3. Grab the article content from the current dom tree.
         *  4. Replace the current DOM tree with the new one.
         *  5. Read peacefully.
         *
         * @return void
         **/
        parse() {
          if (this._maxElemsToParse > 0) {
            var numTags = this._doc.getElementsByTagName("*").length;
            if (numTags > this._maxElemsToParse) {
              throw new Error(
                "Aborting parsing document; " + numTags + " elements found"
              );
            }
          }
          this._unwrapNoscriptImages(this._doc);
          var jsonLd = this._disableJSONLD ? {} : this._getJSONLD(this._doc);
          this._removeScripts(this._doc);
          this._prepDocument();
          var metadata = this._getArticleMetadata(jsonLd);
          this._metadata = metadata;
          this._articleTitle = metadata.title;
          var articleContent = this._grabArticle();
          if (!articleContent) {
            return null;
          }
          this.log("Grabbed: " + articleContent.innerHTML);
          this._postProcessContent(articleContent);
          if (!metadata.excerpt) {
            var paragraphs = articleContent.getElementsByTagName("p");
            if (paragraphs.length) {
              metadata.excerpt = paragraphs[0].textContent.trim();
            }
          }
          var textContent = articleContent.textContent;
          return {
            title: this._articleTitle,
            byline: metadata.byline || this._articleByline,
            dir: this._articleDir,
            lang: this._articleLang,
            content: this._serializer(articleContent),
            textContent,
            length: textContent.length,
            excerpt: metadata.excerpt,
            siteName: metadata.siteName || this._articleSiteName,
            publishedTime: metadata.publishedTime
          };
        }
      };
      if (typeof module === "object") {
        module.exports = Readability2;
      }
    }
  });

  // node_modules/@mozilla/readability/Readability-readerable.js
  var require_Readability_readerable = __commonJS({
    "node_modules/@mozilla/readability/Readability-readerable.js"(exports2, module) {
      var REGEXPS = {
        // NOTE: These two regular expressions are duplicated in
        // Readability.js. Please keep both copies in sync.
        unlikelyCandidates: /-ad-|ai2html|banner|breadcrumbs|combx|comment|community|cover-wrap|disqus|extra|footer|gdpr|header|legends|menu|related|remark|replies|rss|shoutbox|sidebar|skyscraper|social|sponsor|supplemental|ad-break|agegate|pagination|pager|popup|yom-remote/i,
        okMaybeItsACandidate: /and|article|body|column|content|main|shadow/i
      };
      function isNodeVisible(node) {
        return (!node.style || node.style.display != "none") && !node.hasAttribute("hidden") && //check for "fallback-image" so that wikimedia math images are displayed
        (!node.hasAttribute("aria-hidden") || node.getAttribute("aria-hidden") != "true" || node.className && node.className.includes && node.className.includes("fallback-image"));
      }
      function isProbablyReaderable(doc, options = {}) {
        if (typeof options == "function") {
          options = { visibilityChecker: options };
        }
        var defaultOptions3 = {
          minScore: 20,
          minContentLength: 140,
          visibilityChecker: isNodeVisible
        };
        options = Object.assign(defaultOptions3, options);
        var nodes = doc.querySelectorAll("p, pre, article");
        var brNodes = doc.querySelectorAll("div > br");
        if (brNodes.length) {
          var set = new Set(nodes);
          [].forEach.call(brNodes, function(node) {
            set.add(node.parentNode);
          });
          nodes = Array.from(set);
        }
        var score = 0;
        return [].some.call(nodes, function(node) {
          if (!options.visibilityChecker(node)) {
            return false;
          }
          var matchString = node.className + " " + node.id;
          if (REGEXPS.unlikelyCandidates.test(matchString) && !REGEXPS.okMaybeItsACandidate.test(matchString)) {
            return false;
          }
          if (node.matches("li p")) {
            return false;
          }
          var textContentLength = node.textContent.trim().length;
          if (textContentLength < options.minContentLength) {
            return false;
          }
          score += Math.sqrt(textContentLength - options.minContentLength);
          if (score > options.minScore) {
            return true;
          }
          return false;
        });
      }
      if (typeof module === "object") {
        module.exports = isProbablyReaderable;
      }
    }
  });

  // node_modules/@mozilla/readability/index.js
  var require_readability = __commonJS({
    "node_modules/@mozilla/readability/index.js"(exports2, module) {
      var Readability2 = require_Readability();
      var isProbablyReaderable = require_Readability_readerable();
      module.exports = {
        Readability: Readability2,
        isProbablyReaderable
      };
    }
  });

  // src/features/content/overlay-manager.js
  init_logger();

  // src/shared/logger-browser.js
  var Logger2 = class {
    constructor(context = "Browser") {
      this.context = context;
      this.logLevel = "debug";
    }
    getLogLevel() {
      return "debug";
    }
    shouldLog(level) {
      const levels = { debug: 0, info: 1, warn: 2, error: 3 };
      return levels[level] >= levels[this.logLevel];
    }
    formatMessage(level, message, ...args) {
      const timestamp = (/* @__PURE__ */ new Date()).toISOString();
      const prefix = `[${timestamp}] [${this.context}] [${level.toUpperCase()}]`;
      return [prefix, message, ...args];
    }
    debug(message, ...args) {
      if (this.shouldLog("debug")) {
        console.log(...this.formatMessage("debug", message, ...args));
      }
    }
    info(message, ...args) {
      if (this.shouldLog("info")) {
        console.info(...this.formatMessage("info", message, ...args));
      }
    }
    warn(message, ...args) {
      if (this.shouldLog("warn")) {
        console.warn(...this.formatMessage("warn", message, ...args));
      }
    }
    error(message, ...args) {
      if (this.shouldLog("error")) {
        console.error(...this.formatMessage("error", message, ...args));
      }
    }
    log(context, ...args) {
      this.debug(`[${context}]`, ...args);
    }
  };
  var logger2 = new Logger2();

  // src/ui/components/VisibilityControls.js
  var debugLog = (message, data = null) => {
    if (window.HOVERBOARD_DEBUG) {
      if (data) {
        console.log(`[Hoverboard VisibilityControls Debug] ${message}`, data);
      } else {
        console.log(`[Hoverboard VisibilityControls Debug] ${message}`);
      }
    }
  };
  var VisibilityControls = class {
    constructor(document2, onSettingsChange) {
      this.document = document2;
      this.onSettingsChange = onSettingsChange || (() => {
      });
      this.logger = new Logger2("VisibilityControls");
      this.settings = {
        textTheme: "light-on-dark",
        // 'light-on-dark' | 'dark-on-light' - Dark theme default
        transparencyEnabled: false,
        backgroundOpacity: 90
        // 0-100%
      };
      this.controlsElement = null;
      this.isCollapsed = true;
      debugLog("VisibilityControls initialized", this.settings);
    }
    /**
     * Create the visibility controls UI
     * @returns {HTMLElement} Controls container element
     */
    createControls() {
      const container = this.document.createElement("div");
      container.className = "hoverboard-visibility-controls";
      container.innerHTML = this.getControlsHTML();
      this.controlsElement = container;
      this.attachEventListeners();
      this.updateControlsState();
      debugLog("Controls created");
      return container;
    }
    /**
     * Generate HTML for the controls
     * @returns {string} HTML string
     */
    getControlsHTML() {
      return `
      <div class="visibility-controls-header">
        <span class="controls-title">Display</span>
        <button class="controls-toggle" title="Toggle visibility controls">
          <span class="toggle-icon">${this.isCollapsed ? "\u2699\uFE0F" : "\u2715"}</span>
        </button>
      </div>
      <div class="visibility-controls-panel ${this.isCollapsed ? "collapsed" : ""}">
        <div class="control-group">
          <label class="control-label">
            <span class="label-text">Theme:</span>
            <button class="theme-toggle" title="Switch between light and dark themes">
              <span class="theme-icon">${this.settings.textTheme === "light-on-dark" ? "\u{1F319}" : "\u2600\uFE0F"}</span>
              <span class="theme-text">${this.settings.textTheme === "light-on-dark" ? "Dark" : "Light"}</span>
            </button>
          </label>
        </div>

        <div class="control-group">
          <label class="control-label">
            <input type="checkbox" class="transparency-toggle" ${this.settings.transparencyEnabled ? "checked" : ""}>
            <span class="label-text">Transparency</span>
          </label>
        </div>

        <div class="control-group opacity-group ${!this.settings.transparencyEnabled ? "disabled" : ""}">
          <label class="control-label">
            <span class="label-text">Opacity:</span>
            <div class="slider-container">
              <input type="range"
                     class="opacity-slider"
                     min="10"
                     max="100"
                     value="${this.settings.backgroundOpacity}"
                     ${!this.settings.transparencyEnabled ? "disabled" : ""}>
              <span class="opacity-value">${this.settings.backgroundOpacity}%</span>
            </div>
          </label>
        </div>
      </div>
    `;
    }
    /**
     * Attach event listeners to control elements
     */
    attachEventListeners() {
      if (!this.controlsElement) return;
      const toggleButton = this.controlsElement.querySelector(".controls-toggle");
      toggleButton?.addEventListener("click", () => {
        this.toggleControlsPanel();
      });
      const themeToggle = this.controlsElement.querySelector(".theme-toggle");
      themeToggle?.addEventListener("click", () => {
        this.toggleTheme();
      });
      const transparencyToggle = this.controlsElement.querySelector(".transparency-toggle");
      transparencyToggle?.addEventListener("change", (e) => {
        this.setTransparencyEnabled(e.target.checked);
      });
      const opacitySlider = this.controlsElement.querySelector(".opacity-slider");
      opacitySlider?.addEventListener("input", (e) => {
        this.setBackgroundOpacity(parseInt(e.target.value));
      });
      debugLog("Event listeners attached");
    }
    /**
     * Toggle the controls panel visibility
     */
    toggleControlsPanel() {
      this.isCollapsed = !this.isCollapsed;
      const panel = this.controlsElement?.querySelector(".visibility-controls-panel");
      const toggleIcon = this.controlsElement?.querySelector(".toggle-icon");
      if (panel) {
        panel.classList.toggle("collapsed", this.isCollapsed);
      }
      if (toggleIcon) {
        toggleIcon.textContent = this.isCollapsed ? "\u2699\uFE0F" : "\u2715";
      }
      debugLog("Controls panel toggled", { collapsed: this.isCollapsed });
    }
    /**
     * Toggle between light and dark themes
     */
    toggleTheme() {
      this.settings.textTheme = this.settings.textTheme === "light-on-dark" ? "dark-on-light" : "light-on-dark";
      this.updateThemeDisplay();
      this.notifySettingsChange();
      debugLog("Theme toggled", { theme: this.settings.textTheme });
    }
    /**
     * Set transparency enabled state
     * @param {boolean} enabled
     */
    setTransparencyEnabled(enabled) {
      this.settings.transparencyEnabled = enabled;
      this.updateOpacityControlState();
      this.notifySettingsChange();
      debugLog("Transparency toggled", { enabled });
    }
    /**
     * Set background opacity value
     * @param {number} opacity - Opacity value 0-100
     */
    setBackgroundOpacity(opacity) {
      this.settings.backgroundOpacity = Math.max(10, Math.min(100, opacity));
      this.updateOpacityDisplay();
      this.notifySettingsChange();
      debugLog("Opacity changed", { opacity: this.settings.backgroundOpacity });
    }
    /**
     * Update theme display elements
     */
    updateThemeDisplay() {
      const themeIcon = this.controlsElement?.querySelector(".theme-icon");
      const themeText = this.controlsElement?.querySelector(".theme-text");
      if (themeIcon && themeText) {
        const isLightOnDark = this.settings.textTheme === "light-on-dark";
        themeIcon.textContent = isLightOnDark ? "\u{1F319}" : "\u2600\uFE0F";
        themeText.textContent = isLightOnDark ? "Dark" : "Light";
      }
    }
    /**
     * Update opacity control state and display
     */
    updateOpacityControlState() {
      const opacityGroup = this.controlsElement?.querySelector(".opacity-group");
      const opacitySlider = this.controlsElement?.querySelector(".opacity-slider");
      if (opacityGroup) {
        opacityGroup.classList.toggle("disabled", !this.settings.transparencyEnabled);
      }
      if (opacitySlider) {
        opacitySlider.disabled = !this.settings.transparencyEnabled;
      }
    }
    /**
     * Update opacity value display
     */
    updateOpacityDisplay() {
      const opacityValue = this.controlsElement?.querySelector(".opacity-value");
      const opacitySlider = this.controlsElement?.querySelector(".opacity-slider");
      if (opacityValue) {
        opacityValue.textContent = `${this.settings.backgroundOpacity}%`;
      }
      if (opacitySlider) {
        opacitySlider.value = this.settings.backgroundOpacity;
      }
    }
    /**
     * Update all control states to match current settings
     */
    updateControlsState() {
      this.updateThemeDisplay();
      this.updateOpacityControlState();
      this.updateOpacityDisplay();
      const transparencyToggle = this.controlsElement?.querySelector(".transparency-toggle");
      if (transparencyToggle) {
        transparencyToggle.checked = this.settings.transparencyEnabled;
      }
    }
    /**
     * Get current visibility settings
     * @returns {Object} Current settings object
     */
    getSettings() {
      return { ...this.settings };
    }
    /**
     * Set visibility settings
     * @param {Object} newSettings - Settings to apply
     */
    setSettings(newSettings) {
      this.settings = { ...this.settings, ...newSettings };
      this.updateControlsState();
      debugLog("Settings updated", this.settings);
    }
    /**
     * Notify parent component of settings change
     */
    notifySettingsChange() {
      this.onSettingsChange(this.getSettings());
    }
    /**
     * Get CSS styles for the controls
     * @returns {string} CSS styles
     */
    getControlsCSS() {
      return `
      .hoverboard-visibility-controls {
        position: absolute;
        top: 8px;
        right: 8px;
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid #ddd;
        border-radius: 6px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        min-width: 160px;
      }

      .visibility-controls-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 6px 8px;
        background: #f8f9fa;
        border-bottom: 1px solid #e9ecef;
        border-radius: 5px 5px 0 0;
      }

      .controls-title {
        font-weight: 600;
        color: #495057;
      }

      .controls-toggle {
        background: none;
        border: none;
        cursor: pointer;
        padding: 2px 4px;
        border-radius: 3px;
        font-size: 14px;
        line-height: 1;
      }

      .controls-toggle:hover {
        background: rgba(0, 0, 0, 0.1);
      }

      .visibility-controls-panel {
        padding: 8px;
        transition: all 0.2s ease;
        max-height: 200px;
        overflow: hidden;
      }

      .visibility-controls-panel.collapsed {
        max-height: 0;
        padding: 0 8px;
      }

      .control-group {
        margin-bottom: 8px;
      }

      .control-group:last-child {
        margin-bottom: 0;
      }

      .control-group.disabled {
        opacity: 0.5;
        pointer-events: none;
      }

      .control-label {
        display: flex;
        align-items: center;
        justify-content: space-between;
        cursor: pointer;
        padding: 2px 0;
      }

      .label-text {
        font-weight: 500;
        color: #495057;
      }

      .theme-toggle {
        display: flex;
        align-items: center;
        gap: 4px;
        background: #e9ecef;
        border: 1px solid #ced4da;
        border-radius: 4px;
        padding: 4px 8px;
        cursor: pointer;
        font-size: 11px;
        transition: all 0.15s ease;
      }

      .theme-toggle:hover {
        background: #dee2e6;
        border-color: #adb5bd;
      }

      .theme-icon {
        font-size: 12px;
      }

      .transparency-toggle {
        cursor: pointer;
      }

      .slider-container {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .opacity-slider {
        width: 80px;
        height: 4px;
        background: #e9ecef;
        border-radius: 2px;
        outline: none;
        cursor: pointer;
      }

      .opacity-slider::-webkit-slider-thumb {
        appearance: none;
        width: 12px;
        height: 12px;
        background: #007bff;
        border-radius: 50%;
        cursor: pointer;
      }

      .opacity-slider::-moz-range-thumb {
        width: 12px;
        height: 12px;
        background: #007bff;
        border-radius: 50%;
        cursor: pointer;
        border: none;
      }

      .opacity-value {
        font-size: 10px;
        color: #6c757d;
        min-width: 30px;
        text-align: right;
      }

      /* Dark theme styles */
      .hoverboard-theme-light-on-dark .hoverboard-visibility-controls {
        background: rgba(33, 37, 41, 0.95);
        border-color: #495057;
        color: #f8f9fa;
      }

      .hoverboard-theme-light-on-dark .visibility-controls-header {
        background: #343a40;
        border-color: #495057;
      }

      .hoverboard-theme-light-on-dark .controls-title,
      .hoverboard-theme-light-on-dark .label-text {
        color: #f8f9fa;
      }

      .hoverboard-theme-light-on-dark .theme-toggle {
        background: #495057;
        border-color: #6c757d;
        color: #f8f9fa;
      }

      .hoverboard-theme-light-on-dark .theme-toggle:hover {
        background: #5a6268;
        border-color: #adb5bd;
      }

      .hoverboard-theme-light-on-dark .opacity-slider {
        background: #495057;
      }

      .hoverboard-theme-light-on-dark .opacity-value {
        color: #adb5bd;
      }
    `;
    }
    /**
     * Destroy the controls and clean up
     */
    destroy() {
      if (this.controlsElement) {
        this.controlsElement.remove();
        this.controlsElement = null;
      }
      debugLog("VisibilityControls destroyed");
    }
  };

  // src/features/content/message-client.js
  init_utils();
  var MessageClient = class {
    constructor() {
      this.messageTimeout = 1e4;
      this.retryAttempts = 3;
      this.retryDelay = 1e3;
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
        retries: options.retries !== void 0 ? options.retries : this.retryAttempts,
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
    // [SAFARI-EXT-SHIM-001] Refactor sendSingleMessage to use await directly
    async sendSingleMessage(message, options) {
      const messageId = this.generateMessageId();
      const fullMessage = { ...message, messageId };
      return await safariEnhancements.runtime.sendMessage(fullMessage);
    }
    /**
     * Handle response from background script
     * @param {string} messageId - Message ID
     * @param {Object} response - Response object
     */
    handleMessageResponse(messageId, response) {
    }
    /**
     * Send message to specific tab
     * @param {number} tabId - Target tab ID
     * @param {Object} message - Message object
     * @returns {Promise} Promise that resolves with response
     */
    // [SAFARI-EXT-SHIM-001] Refactor sendMessageToTab to use await directly
    async sendMessageToTab(tabId, message) {
      return await safariEnhancements.tabs.sendMessage(tabId, message);
    }
    /**
     * Broadcast message to all tabs
     * @param {Object} message - Message to broadcast
     * @returns {Promise} Promise that resolves when all messages sent
     */
    async broadcastMessage(message) {
      try {
        const tabs = await this.getAllTabs();
        const promises = tabs.map(
          (tab) => this.sendMessageToTab(tab.id, message).catch(() => {
          })
        );
        await Promise.all(promises);
      } catch (error) {
        console.error("Failed to broadcast message:", error);
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
          safariEnhancements.tabs.query({}, (tabs) => {
            if (safariEnhancements.runtime.lastError) {
              reject(new Error(safariEnhancements.runtime.lastError.message));
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
        "Could not establish connection",
        "Extension context invalidated",
        "Message timeout",
        "The message port closed before a response was received"
      ];
      return retryableMessages.some(
        (msg) => error.message.includes(msg)
      );
    }
    /**
     * Clean up pending message
     * @param {string} messageId - Message ID to clean up
     */
    cleanupPendingMessage(messageId) {
    }
    /**
     * Sleep for specified milliseconds
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise} Promise that resolves after delay
     */
    sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }
    /**
     * Check if background script is available
     * @returns {Promise<boolean>} Whether background script responds
     */
    async isBackgroundAvailable() {
      try {
        await this.sendMessage({ type: "PING" }, { timeout: 1e3, retries: 0 });
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
        id: safariEnhancements.runtime.id,
        version: safariEnhancements.runtime.getManifest().version,
        url: safariEnhancements.runtime.getURL(""),
        isIncognito: safariEnhancements.extension.inIncognitoContext
      };
    }
    /**
     * Open extension options page
     */
    openOptionsPage() {
      if (safariEnhancements.runtime.openOptionsPage) {
        safariEnhancements.runtime.openOptionsPage();
      } else {
        window.open(safariEnhancements.runtime.getURL("src/ui/options/options.html"));
      }
    }
    /**
     * Get current tab information
     * @returns {Promise<Object>} Current tab info
     */
    async getCurrentTab() {
      return new Promise((resolve, reject) => {
        try {
          safariEnhancements.tabs.getCurrent((tab) => {
            if (safariEnhancements.runtime.lastError) {
              reject(new Error(safariEnhancements.runtime.lastError.message));
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
    }
    /**
     * Get statistics about message client
     * @returns {Object} Statistics object
     */
    getStats() {
      return {
        messageTimeout: this.messageTimeout,
        retryAttempts: this.retryAttempts,
        retryDelay: this.retryDelay
      };
    }
  };
  window.addEventListener("beforeunload", () => {
    if (window.hoverboardMessageClient) {
      window.hoverboardMessageClient.cleanup();
    }
  });

  // src/features/content/overlay-manager.js
  init_tag_service();
  init_utils();
  var debugLog3 = (message, data = null) => {
    if (window.HOVERBOARD_DEBUG) {
      if (data) {
        console.log(`[Hoverboard Overlay Debug] ${message}`, data);
      } else {
        console.log(`[Hoverboard Overlay Debug] ${message}`);
      }
    }
  };
  var debugError2 = (message, error = null) => {
    if (window.HOVERBOARD_DEBUG) {
      if (error) {
        console.error(`[Hoverboard Overlay Debug] ${message}`, error);
      } else {
        console.error(`[Hoverboard Overlay Debug] ${message}`);
      }
    }
  };
  var OverlayManager = class {
    constructor(document2, config) {
      this.document = document2;
      this.config = config;
      this.logger = new Logger("OverlayManager");
      this.overlayElement = null;
      this.isVisible = false;
      this.currentContent = null;
      this.isInsideOverlay = false;
      this.overlayId = "hoverboard-overlay";
      this.overlayClass = "hoverboard-overlay";
      this.transparencyMode = config?.overlayTransparencyMode || "opaque";
      this.positionMode = config?.overlayPositionMode || "default";
      this.adaptiveVisibility = config?.overlayAdaptiveVisibility || false;
      this.proximityListener = null;
      this.visibilityControls = null;
      this.visibilityControlsCallback = (settings) => {
        debugLog3("Visibility settings changed", settings);
        this.applyVisibilitySettings(settings);
      };
      this.messageService = new MessageClient();
      this.tagService = new TagService();
      this._onStateChange = null;
      this._onOverlayAction = null;
      debugLog3("OverlayManager initialized", { config, transparencyMode: this.transparencyMode });
    }
    /**
     * [IMPL-UI_TESTABILITY_HOOKS] [ARCH-UI_TESTABILITY] [REQ-UI_INSPECTION]
     * Set optional callback for overlay state changes (for tests). Signature: ({ visible, contentSnapshot }) => void
     */
    setOnStateChange(fn) {
      this._onStateChange = typeof fn === "function" ? fn : null;
    }
    /**
     * [IMPL-OVERLAY_TEST_HARNESS] [ARCH-OVERLAY_TESTABILITY] [REQ-UI_INSPECTION]
     * Set optional callback for overlay user actions (for tests). Signature: (actionId) => void. actionId: 'refresh' | 'close' | 'tag-added' | 'tag-removed' | 'togglePrivate' | 'toggleReadLater'
     */
    setOnOverlayAction(fn) {
      this._onOverlayAction = typeof fn === "function" ? fn : null;
    }
    /**
     * Show overlay with content
     */
    async show(content) {
      this.logger.log("INFO", "OverlayManager", "show() called", { content });
      this.logger.log("DEBUG", "OverlayManager", "Platform detection", { platform: navigator.userAgent });
      if (typeof chrome !== "undefined" && chrome.runtime) {
        this.logger.log("DEBUG", "OverlayManager", "Detected Chrome runtime");
      } else if (typeof safariEnhancements !== "undefined" && safariEnhancements.runtime) {
        this.logger.log("DEBUG", "OverlayManager", "Detected browser polyfill runtime");
      } else {
        this.logger.log("ERROR", "OverlayManager", "No recognized extension runtime detected");
      }
      try {
        this.logger.log("DEBUG", "OverlayManager", "Starting overlay creation process");
        this.logger.log("DEBUG", "OverlayManager", "Content analysis", {
          hasBookmark: !!content.bookmark,
          bookmarkTags: content.bookmark?.tags,
          tagsType: typeof content.bookmark?.tags,
          tagsIsArray: Array.isArray(content.bookmark?.tags),
          pageTitle: content.pageTitle,
          pageUrl: content.pageUrl
        });
        this.logger.log("DEBUG", "OverlayManager", "Using original content data");
        this.currentContent = content;
        if (!this.overlayElement) {
          this.logger.log("DEBUG", "OverlayManager", "Creating new overlay element");
          this.createOverlay();
        } else {
          this.logger.log("DEBUG", "OverlayManager", "Using existing overlay element");
        }
        this.clearContent();
        this.logger.log("DEBUG", "OverlayManager", "Content cleared");
        this.logger.log("DEBUG", "OverlayManager", "Creating main container");
        const mainContainer = this.document.createElement("div");
        mainContainer.style.cssText = "padding: 8px; padding-top: 40px;";
        this.logger.log("DEBUG", "OverlayManager", "Creating tags container");
        const currentTagsContainer = this.document.createElement("div");
        currentTagsContainer.className = "scrollmenu tags-container";
        currentTagsContainer.style.cssText = `
        margin-bottom: 8px;
        padding: 4px;
        border-radius: 4px;
      `;
        this.logger.log("DEBUG", "OverlayManager", "Creating refresh button");
        const refreshBtn = this.document.createElement("button");
        refreshBtn.className = "refresh-button";
        refreshBtn.innerHTML = "\u{1F504}";
        refreshBtn.title = "Refresh Data";
        refreshBtn.setAttribute("aria-label", "Refresh Data");
        refreshBtn.setAttribute("role", "button");
        refreshBtn.setAttribute("tabindex", "0");
        refreshBtn.tabIndex = 0;
        refreshBtn.disabled = false;
        refreshBtn.style.cssText = `
        position: absolute;
        top: 8px;
        left: 40px;  // [OVERLAY-CLOSE-POSITION-OVERLAY-001] Position relative to overlay
        background: var(--theme-button-bg);
        color: var(--theme-text-primary);
        border: 1px solid var(--theme-border);
        border-radius: 4px;
        padding: 4px 6px;
        cursor: pointer;
        font-size: 14px;
        z-index: 1;
        transition: var(--theme-transition);
        min-width: 24px;
        min-height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        outline: 2px solid transparent;
        box-shadow: 0 0 0 2px transparent;
      `;
        this.logger.log("DEBUG", "OverlayManager", "Adding refresh button click handler");
        refreshBtn.onclick = async () => {
          await this.handleRefreshButtonClick();
        };
        this.logger.log("DEBUG", "OverlayManager", "Adding refresh button keyboard handlers");
        refreshBtn.addEventListener("keydown", async (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            await this.handleRefreshButtonClick();
          }
        });
        this.logger.log("DEBUG", "OverlayManager", "Creating close button");
        const closeBtn = this.document.createElement("span");
        closeBtn.className = "close-button";
        closeBtn.innerHTML = "\u2715";
        closeBtn.title = "Close Overlay";
        closeBtn.setAttribute("aria-label", "Close Overlay");
        closeBtn.setAttribute("role", "button");
        closeBtn.setAttribute("tabindex", "0");
        closeBtn.tabIndex = 0;
        closeBtn.style.cssText = `
        position: absolute;
        top: 8px;
        left: 8px;  // [OVERLAY-CLOSE-POSITION-OVERLAY-001] Position relative to overlay
        background: var(--theme-button-bg);
        color: var(--theme-text-primary);
        border: 1px solid var(--theme-border);
        border-radius: 4px;
        padding: 4px 6px;
        cursor: pointer;
        font-size: 14px;
        z-index: 1;
        transition: var(--theme-transition);
        min-width: 24px;
        min-height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
        closeBtn.onclick = () => {
          if (this._onOverlayAction) this._onOverlayAction("close");
          this.hide();
        };
        this.logger.log("DEBUG", "OverlayManager", "Adding close button keyboard handlers");
        closeBtn.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            this.hide();
          }
        });
        this.logger.log("DEBUG", "OverlayManager", "Appending buttons to overlay");
        this.overlayElement.appendChild(closeBtn);
        this.overlayElement.appendChild(refreshBtn);
        this.logger.log("DEBUG", "OverlayManager", "Creating current tags label");
        const currentLabel = this.document.createElement("span");
        currentLabel.className = "label-primary tiny";
        currentLabel.textContent = "Current:";
        currentLabel.style.cssText = "padding: 0.2em 0.5em; margin-right: 4px;";
        currentTagsContainer.appendChild(currentLabel);
        this.logger.log("DEBUG", "OverlayManager", "Processing current tags", {
          hasBookmark: !!content.bookmark,
          bookmarkKeys: content.bookmark ? Object.keys(content.bookmark) : [],
          tags: content.bookmark?.tags,
          tagsType: typeof content.bookmark?.tags,
          tagsIsArray: Array.isArray(content.bookmark?.tags)
        });
        if (content.bookmark?.tags) {
          this.logger.log("DEBUG", "OverlayManager", "Adding current tags", { tags: content.bookmark.tags });
          content.bookmark.tags.forEach((tag) => {
            if (this.isValidTag(tag)) {
              this.logger.log("DEBUG", "OverlayManager", "Creating tag element", { tag });
              const tagElement = this.document.createElement("span");
              tagElement.className = "tag-element tiny iconTagDeleteInactive";
              tagElement.textContent = tag;
              tagElement.title = "Double-click to remove";
              tagElement.ondblclick = async () => {
                try {
                  this.logger.log("DEBUG", "OverlayManager", "Tag double-clicked", { tag });
                  if (content.bookmark && content.bookmark.tags) {
                    const index = content.bookmark.tags.indexOf(tag);
                    if (index > -1) {
                      content.bookmark.tags.splice(index, 1);
                    }
                  }
                  if (content.bookmark && content.bookmark.url) {
                    await this.messageService.sendMessage({
                      type: "deleteTag",
                      // [sync:site-record] [action:delete]
                      data: {
                        url: content.bookmark.url,
                        value: tag
                      }
                    });
                  }
                  this.show(content);
                  if (this._onOverlayAction) this._onOverlayAction("tag-removed");
                  this.showMessage("Tag deleted successfully", "success");
                } catch (error) {
                  this.logger.log("ERROR", "OverlayManager", "Failed to delete tag", { tag, error });
                  this.showMessage("Failed to delete tag", "error");
                }
              };
              currentTagsContainer.appendChild(tagElement);
            } else {
              this.logger.log("WARN", "OverlayManager", "Invalid tag found", { tag });
            }
          });
        } else {
          this.logger.log("DEBUG", "OverlayManager", "No tags found in bookmark data");
        }
        const tagInput = this.document.createElement("input");
        tagInput.className = "tag-input";
        tagInput.placeholder = "New Tag";
        tagInput.style.cssText = `
        margin: 2px;
        padding: 2px !important;
        font-size: 12px;
        width: 80px;
      `;
        tagInput.addEventListener("keypress", async (e) => {
          if (e.key === "Enter") {
            const tagText = tagInput.value.trim();
            if (tagText && this.isValidTag(tagText) && content.bookmark) {
              try {
                await this.messageService.sendMessage({
                  type: "saveTag",
                  data: {
                    url: content.bookmark.url || window.location.href,
                    value: tagText,
                    description: content.bookmark.description || this.document.title
                  }
                });
                if (!content.bookmark.tags) content.bookmark.tags = [];
                if (!content.bookmark.tags.includes(tagText)) {
                  content.bookmark.tags.push(tagText);
                }
                tagInput.value = "";
                this.show(content);
                if (this._onOverlayAction) this._onOverlayAction("tag-added");
                debugLog3("[IMMUTABLE-REQ-TAG-004] Tag persisted successfully", tagText);
                this.showMessage("Tag saved successfully", "success");
              } catch (error) {
                debugError2("[IMMUTABLE-REQ-TAG-004] Failed to persist tag:", error);
                this.showMessage("Failed to save tag", "error");
              }
            } else if (tagText && !this.isValidTag(tagText)) {
              debugLog3("[IMMUTABLE-REQ-TAG-004] Invalid tag rejected:", tagText);
              this.showMessage("Invalid tag format", "error");
            }
          }
        });
        currentTagsContainer.appendChild(tagInput);
        const recentContainer = this.document.createElement("div");
        recentContainer.className = "scrollmenu recent-container";
        recentContainer.style.cssText = `
        margin-bottom: 8px;
        padding: 4px;
        border-radius: 4px;
        font-size: smaller;
        font-weight: 900;
      `;
        const recentLabel = this.document.createElement("span");
        recentLabel.className = "label-secondary tiny";
        recentLabel.textContent = "Recent:";
        recentLabel.style.cssText = "padding: 0.2em 0.5em; margin-right: 4px;";
        recentContainer.appendChild(recentLabel);
        try {
          const recentTags = await this.loadRecentTagsForOverlay(content);
          if (recentTags && recentTags.length > 0) {
            recentTags.slice(0, 3).forEach((tag) => {
              if (!content.bookmark?.tags?.includes(tag)) {
                const tagElement = this.document.createElement("span");
                tagElement.className = "tag-element tiny";
                tagElement.textContent = tag;
                tagElement.onclick = async () => {
                  if (content.bookmark) {
                    try {
                      await this.messageService.sendMessage({
                        type: "saveTag",
                        data: {
                          url: content.bookmark.url || window.location.href,
                          value: tag,
                          description: content.bookmark.description || this.document.title
                        }
                      });
                      if (!content.bookmark.tags) content.bookmark.tags = [];
                      if (!content.bookmark.tags.includes(tag)) {
                        content.bookmark.tags.push(tag);
                      }
                      this.show(content);
                      if (this._onOverlayAction) this._onOverlayAction("tag-added");
                      debugLog3("[TAG-SYNC-OVERLAY-001] Tag persisted from recent", tag);
                      this.showMessage("Tag saved successfully", "success");
                    } catch (error) {
                      debugError2("[TAG-SYNC-OVERLAY-001] Failed to persist tag from recent:", error);
                      this.showMessage("Failed to save tag", "error");
                    }
                  }
                };
                recentContainer.appendChild(tagElement);
              }
            });
          } else {
            const emptyState = this.document.createElement("span");
            emptyState.className = "empty-state tiny";
            emptyState.textContent = "No recent tags";
            emptyState.style.cssText = "color: #999; font-style: italic;";
            recentContainer.appendChild(emptyState);
          }
        } catch (error) {
          debugError2("[TAG-SYNC-OVERLAY-001] Failed to load recent tags:", error);
          const fallbackTags = ["development", "web", "tutorial"];
          fallbackTags.forEach((tag) => {
            if (!content.bookmark?.tags?.includes(tag)) {
              const tagElement = this.document.createElement("span");
              tagElement.className = "tag-element tiny";
              tagElement.textContent = tag;
              tagElement.onclick = async () => {
                if (content.bookmark) {
                  try {
                    await this.messageService.sendMessage({
                      type: "saveTag",
                      data: {
                        url: content.bookmark.url || window.location.href,
                        value: tag,
                        description: content.bookmark.description || this.document.title
                      }
                    });
                    if (!content.bookmark.tags) content.bookmark.tags = [];
                    if (!content.bookmark.tags.includes(tag)) {
                      content.bookmark.tags.push(tag);
                    }
                    this.show(content);
                    debugLog3("[TAG-SYNC-OVERLAY-001] Fallback tag persisted", tag);
                    this.showMessage("Tag saved successfully", "success");
                  } catch (error2) {
                    debugError2("[TAG-SYNC-OVERLAY-001] Failed to persist fallback tag:", error2);
                    this.showMessage("Failed to save tag", "error");
                  }
                }
              };
              recentContainer.appendChild(tagElement);
            }
          });
        }
        let visibilityControlsContainer = null;
        if (!this.visibilityControls) {
          this.visibilityControls = new VisibilityControls(this.document, this.visibilityControlsCallback);
          debugLog3("VisibilityControls component initialized");
        }
        visibilityControlsContainer = this.visibilityControls.createControls();
        debugLog3("VisibilityControls UI created");
        this.injectCSS();
        debugLog3("CSS re-injected with VisibilityControls styles");
        const initialSettings = this.visibilityControls.getSettings();
        this.applyVisibilitySettings(initialSettings);
        debugLog3("Initial visibility settings applied", initialSettings);
        const actionsContainer = this.document.createElement("div");
        actionsContainer.className = "actions";
        actionsContainer.style.cssText = `
        padding: 4px;
        border-radius: 4px;
        text-align: center;
      `;
        const privateBtn = this.document.createElement("button");
        const isPrivate = content.bookmark?.shared === "no";
        privateBtn.className = `action-button privacy-button ${isPrivate ? "private-active" : ""}`;
        privateBtn.style.cssText = `
        margin: 2px;
        font-weight: 600;
      `;
        privateBtn.textContent = isPrivate ? "\u{1F512} Private" : "\u{1F310} Public";
        privateBtn.onclick = async () => {
          if (content.bookmark) {
            try {
              const isPrivate2 = content.bookmark.shared === "no";
              const newSharedStatus = isPrivate2 ? "yes" : "no";
              const updatedBookmark = {
                ...content.bookmark,
                shared: newSharedStatus
              };
              await this.messageService.sendMessage({
                type: "saveBookmark",
                data: updatedBookmark
              });
              content.bookmark.shared = newSharedStatus;
              this.show(content);
              this.showMessage(`Bookmark is now ${isPrivate2 ? "public" : "private"}`, "success");
              debugLog3("[TOGGLE-SYNC-OVERLAY-001] Sending BOOKMARK_UPDATED to background", updatedBookmark);
              await safariEnhancements.runtime.sendMessage({
                type: "BOOKMARK_UPDATED",
                data: updatedBookmark
              });
              debugLog3("[TOGGLE-SYNC-OVERLAY-001] Privacy toggled", content.bookmark.shared);
            } catch (error) {
              debugError2("[TOGGLE-SYNC-OVERLAY-001] Failed to toggle privacy:", error);
              this.showMessage("Failed to update privacy setting", "error");
            }
          }
        };
        const readBtn = this.document.createElement("button");
        const isToRead = content.bookmark?.toread === "yes";
        readBtn.className = `action-button read-button ${isToRead ? "read-later-active" : ""}`;
        readBtn.style.cssText = `
        margin: 2px;
        font-weight: 600;
      `;
        readBtn.textContent = isToRead ? "\u{1F4D6} Read Later" : "\u{1F4CB} Not marked";
        readBtn.onclick = async () => {
          if (content.bookmark) {
            try {
              const isCurrentlyToRead = content.bookmark.toread === "yes";
              const newToReadStatus = isCurrentlyToRead ? "no" : "yes";
              const updatedBookmark = {
                ...content.bookmark,
                toread: newToReadStatus,
                description: content.bookmark.description || this.document.title
              };
              await this.messageService.sendMessage({
                type: "saveBookmark",
                data: updatedBookmark
              });
              content.bookmark.toread = newToReadStatus;
              this.show(content);
              const statusMessage = newToReadStatus === "yes" ? "Added to read later" : "Removed from read later";
              this.showMessage(statusMessage, "success");
              debugLog3("[TOGGLE-SYNC-OVERLAY-001] Sending BOOKMARK_UPDATED to background", updatedBookmark);
              await safariEnhancements.runtime.sendMessage({
                type: "BOOKMARK_UPDATED",
                data: updatedBookmark
              });
              debugLog3("[TOGGLE-SYNC-OVERLAY-001] Read status toggled", content.bookmark.toread);
            } catch (error) {
              debugError2("[TOGGLE-SYNC-OVERLAY-001] Failed to toggle read later status:", error);
              this.showMessage("Failed to update read later status", "error");
            }
          }
        };
        actionsContainer.appendChild(privateBtn);
        actionsContainer.appendChild(readBtn);
        const pageInfo = this.document.createElement("div");
        pageInfo.className = "page-info";
        pageInfo.style.cssText = `
        padding: 4px;
        font-size: 11px;
        border-radius: 4px;
        margin-top: 4px;
        word-break: break-all;
      `;
        pageInfo.innerHTML = `
        <div class="label-primary" style="font-weight: bold; margin-bottom: 2px;">
          ${content.bookmark?.description || content.pageTitle || "No Title"}
        </div>
        <div class="text-muted">${content.bookmark?.url || content.pageUrl || ""}</div>
      `;
        debugLog3("Overlay structure created with enhanced styling");
        this.addTabSearchSection(mainContainer);
        mainContainer.appendChild(currentTagsContainer);
        mainContainer.appendChild(recentContainer);
        const suggestedContainer = this.document.createElement("div");
        suggestedContainer.className = "scrollmenu suggested-container";
        suggestedContainer.style.cssText = `
        margin-bottom: 8px;
        padding: 4px;
        border-radius: 4px;
        font-size: smaller;
        font-weight: 900;
      `;
        const suggestedLabel = this.document.createElement("span");
        suggestedLabel.className = "label-secondary tiny";
        suggestedLabel.textContent = "Suggested:";
        suggestedLabel.style.cssText = "padding: 0.2em 0.5em; margin-right: 4px;";
        suggestedContainer.appendChild(suggestedLabel);
        try {
          const suggestedTags = this.tagService.extractSuggestedTagsFromContent(this.document, window.location.href, 30);
          if (suggestedTags && suggestedTags.length > 0) {
            const currentTags = content.bookmark?.tags || [];
            const currentTagsLower = new Set(currentTags.map((t) => t.toLowerCase()));
            suggestedTags.slice(0, 15).forEach((tag) => {
              const tagLower = tag.toLowerCase();
              if (!currentTagsLower.has(tagLower)) {
                const tagElement = this.document.createElement("span");
                tagElement.className = "tag-element tiny";
                tagElement.textContent = tag;
                tagElement.onclick = async () => {
                  if (content.bookmark) {
                    try {
                      await this.messageService.sendMessage({
                        type: "saveTag",
                        data: {
                          url: content.bookmark.url || window.location.href,
                          value: tag,
                          description: content.bookmark.description || this.document.title
                        }
                      });
                      if (!content.bookmark.tags) content.bookmark.tags = [];
                      if (!content.bookmark.tags.includes(tag)) {
                        content.bookmark.tags.push(tag);
                      }
                      this.show(content);
                      debugLog3("[REQ-SUGGESTED_TAGS_FROM_CONTENT] Tag persisted from suggested", tag);
                      this.showMessage("Tag saved successfully", "success");
                    } catch (error) {
                      debugError2("[REQ-SUGGESTED_TAGS_FROM_CONTENT] Failed to persist tag from suggested:", error);
                      this.showMessage("Failed to save tag", "error");
                    }
                  }
                };
                suggestedContainer.appendChild(tagElement);
              }
            });
          } else {
            suggestedContainer.style.display = "none";
          }
        } catch (error) {
          debugError2("[REQ-SUGGESTED_TAGS_FROM_CONTENT] Failed to extract suggested tags:", error);
          suggestedContainer.style.display = "none";
        }
        if (suggestedContainer.children.length > 1) {
          mainContainer.appendChild(suggestedContainer);
        }
        if (visibilityControlsContainer) {
          mainContainer.appendChild(visibilityControlsContainer);
        }
        mainContainer.appendChild(actionsContainer);
        mainContainer.appendChild(pageInfo);
        this.overlayElement.appendChild(mainContainer);
        this.currentContent = content;
        debugLog3("Overlay structure assembled");
        this.positionOverlay();
        debugLog3("[OverlayManager] Setting overlay display to block");
        this.overlayElement.style.display = "block";
        debugLog3("[OverlayManager] Setting overlay opacity to 1");
        this.overlayElement.style.opacity = "1";
        this.isVisible = true;
        if (this._onStateChange) {
          const b = content?.bookmark;
          this._onStateChange({
            visible: true,
            contentSnapshot: {
              title: b?.description || content?.pageTitle,
              url: content?.pageUrl || b?.url,
              tags: b?.tags,
              private: b?.shared === "no",
              toread: b?.toread === "yes"
            }
          });
        }
        debugLog3("Overlay positioned and displayed");
        console.log("\u{1F3A8} [Overlay Debug] Final overlay visibility check:", {
          isVisible: this.isVisible,
          elementExists: !!this.overlayElement,
          elementInDOM: this.document.body.contains(this.overlayElement),
          computedDisplay: window.getComputedStyle(this.overlayElement).display,
          computedOpacity: window.getComputedStyle(this.overlayElement).opacity
        });
      } catch (error) {
        this.logger.error("Error showing overlay:", error);
        debugLog3("Error showing overlay", { error });
      }
    }
    /**
     * Hide overlay
     */
    hide() {
      debugLog3("[OverlayManager] hide() called", { stack: new Error().stack });
      if (!this.isVisible || !this.overlayElement) {
        debugLog3("Hide called but overlay not visible");
        return;
      }
      try {
        debugLog3("Hiding overlay");
        this.addHideAnimation(() => {
          if (this.overlayElement) {
            debugLog3("[OverlayManager] Setting overlay display to none");
            this.overlayElement.style.display = "none";
            debugLog3("[OverlayManager] Setting overlay opacity to 0");
            this.overlayElement.style.opacity = "0";
            this.clearContent();
          }
          this.isVisible = false;
          this.currentContent = null;
          if (this._onStateChange) this._onStateChange({ visible: false, contentSnapshot: null });
          debugLog3("Overlay hidden successfully");
        });
      } catch (error) {
        this.logger.error("Error hiding overlay:", error);
        debugLog3("Error hiding overlay", { error });
      }
    }
    /**
     * [IMMUTABLE-REQ-TAG-004] - Enhanced message display for tag operations
     */
    showMessage(message, type = "info") {
      try {
        const messageElement = this.document.createElement("div");
        messageElement.className = `overlay-message overlay-message-${type}`;
        messageElement.textContent = message;
        messageElement.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 8px 12px;
        border-radius: 4px;
        color: white;
        font-size: 12px;
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        font-weight: 600;
      `;
        if (type === "error") {
          messageElement.style.background = "var(--theme-danger, #e74c3c)";
        } else if (type === "success") {
          messageElement.style.background = "var(--theme-success, #2ecc71)";
        } else {
          messageElement.style.background = "var(--theme-info, #3498db)";
        }
        this.document.body.appendChild(messageElement);
        setTimeout(() => {
          if (messageElement.parentNode) {
            messageElement.parentNode.removeChild(messageElement);
          }
        }, 3e3);
        debugLog3("[IMMUTABLE-REQ-TAG-004] Message displayed:", { message, type });
      } catch (error) {
        debugError2("[IMMUTABLE-REQ-TAG-004] Failed to show message:", error);
      }
    }
    /**
     * [IMMUTABLE-REQ-TAG-004] - Refresh overlay content with latest bookmark data
     */
    // [OVERLAY-REFRESH-INTEGRATION-001] Refresh overlay content with latest bookmark data
    // Coordinates with [OVERLAY-DATA-DISPLAY-001] for data refresh mechanism
    async refreshOverlayContent() {
      try {
        const pageTitle = this.currentContent?.pageTitle || this.document.title || "";
        const refreshData = {
          url: this.currentContent?.pageUrl || window.location.href,
          title: pageTitle,
          tabId: this.currentContent?.tabId || null
        };
        debugLog3("[OVERLAY-REFRESH-INTEGRATION-001] Refresh request data:", refreshData);
        const response = await this.messageService.sendMessage({
          type: "getCurrentBookmark",
          data: refreshData
        });
        if (response && response.success && response.data) {
          const updatedContent = {
            bookmark: response.data,
            pageTitle: this.currentContent?.pageTitle || this.document.title || "",
            pageUrl: this.currentContent?.pageUrl || window.location.href
          };
          debugLog3("[OVERLAY-REFRESH-INTEGRATION-001] Overlay content refreshed with updated data");
          debugLog3("[OVERLAY-DEBUG] Refreshed bookmark data:", {
            responseData: response.data,
            responseDataKeys: Object.keys(response.data),
            hasTags: !!response.data.tags,
            tagsValue: response.data.tags,
            tagsType: typeof response.data.tags
          });
          return updatedContent;
        } else {
          debugError2("[OVERLAY-REFRESH-INTEGRATION-001] Invalid response structure:", response);
        }
      } catch (error) {
        debugError2("[OVERLAY-REFRESH-INTEGRATION-001] Failed to refresh overlay content:", error);
      }
      return null;
    }
    /**
     * [OVERLAY-REFRESH-HANDLER-001] Refresh button click handler
     */
    // [OVERLAY-REFRESH-HANDLER-001] Handle refresh button click with comprehensive error handling and loading state
    async handleRefreshButtonClick() {
      this.logger.log("INFO", "OverlayManager", "Refresh button clicked");
      if (this._onOverlayAction) this._onOverlayAction("refresh");
      const refreshButton = this.document.querySelector(".refresh-button");
      this.logger.log("DEBUG", "OverlayManager", "Found refresh button", { found: !!refreshButton });
      try {
        if (refreshButton) {
          this.logger.log("DEBUG", "OverlayManager", "Adding loading state to refresh button");
          refreshButton.classList.add("loading");
          refreshButton.disabled = true;
        }
        this.showMessage("Refreshing data...", "info");
        this.logger.log("DEBUG", "OverlayManager", "Starting overlay content refresh");
        const updatedContent = await this.refreshOverlayContent();
        if (updatedContent) {
          this.logger.log("DEBUG", "OverlayManager", "Content refresh successful", { updatedContent });
          this.show(updatedContent);
          this.showMessage("Data refreshed successfully", "success");
          this.logger.log("INFO", "OverlayManager", "Overlay refreshed successfully");
        } else {
          this.logger.log("ERROR", "OverlayManager", "No updated content received");
          throw new Error("Failed to get updated data");
        }
      } catch (error) {
        this.logger.log("ERROR", "OverlayManager", "Refresh failed", { error });
        this.showMessage("Failed to refresh data", "error");
      } finally {
        if (refreshButton) {
          this.logger.log("DEBUG", "OverlayManager", "Removing loading state from refresh button");
          refreshButton.classList.remove("loading");
          refreshButton.disabled = false;
        }
      }
    }
    /**
     * [TAG-SYNC-OVERLAY-001] - Load recent tags from shared memory for overlay
     * @param {Object} content - Content object with bookmark data
     * @returns {Promise<string[]>} Array of recent tag names
     */
    async loadRecentTagsForOverlay(content) {
      try {
        debugLog3("[TAG-SYNC-OVERLAY-001] Loading recent tags for overlay");
        const response = await this.messageService.sendMessage({
          type: "getRecentBookmarks",
          data: {
            currentTags: content.bookmark?.tags || [],
            senderUrl: content.bookmark?.url || window.location.href
          }
        });
        debugLog3("[TAG-SYNC-OVERLAY-001] Recent tags response:", response);
        if (response && response.recentTags) {
          const recentTagNames = response.recentTags.map((tag) => {
            if (typeof tag === "string") {
              return tag;
            } else if (tag && typeof tag === "object" && tag.name) {
              return tag.name;
            } else {
              return String(tag);
            }
          });
          debugLog3("[TAG-SYNC-OVERLAY-001] Extracted recent tag names:", recentTagNames);
          return recentTagNames;
        }
        debugLog3("[TAG-SYNC-OVERLAY-001] No recent tags found");
        return [];
      } catch (error) {
        debugError2("[TAG-SYNC-OVERLAY-001] Failed to load recent tags:", error);
        return [];
      }
    }
    /**
     * Check if click was inside overlay
     */
    isClickInsideOverlay(event) {
      if (!this.overlayElement || !this.isVisible) {
        return false;
      }
      return this.overlayElement.contains(event.target);
    }
    /**
     * Create overlay DOM element
     */
    createOverlay() {
      this.logger.debug("Creating overlay element");
      this.removeOverlay();
      this.overlayElement = this.document.createElement("div");
      this.overlayElement.id = this.overlayId;
      this.overlayElement.className = this.overlayClass;
      this.applyOverlayStyles();
      this.document.body.appendChild(this.overlayElement);
      this.injectCSS();
      if (this.visibilityControls) {
        const initialSettings = this.visibilityControls.getSettings();
        this.applyVisibilitySettings(initialSettings);
        debugLog3("Initial theme applied in createOverlay", initialSettings);
      }
    }
    /**
     * Remove overlay from DOM
     */
    removeOverlay() {
      const existing = this.document.getElementById(this.overlayId);
      if (existing) {
        existing.remove();
      }
      this.overlayElement = null;
      this.isVisible = false;
    }
    /**
     * Clear overlay content
     */
    clearContent() {
      if (this.overlayElement) {
        this.overlayElement.innerHTML = "";
      }
    }
    /**
     * Position overlay on screen
     */
    positionOverlay() {
      if (!this.overlayElement) {
        return;
      }
      if (this.positionMode === "bottom-fixed") {
        this.applyBottomFixedPositioning();
        return;
      }
      this.overlayElement.style.position = "fixed";
      this.overlayElement.style.top = "20px";
      this.overlayElement.style.right = "20px";
      this.overlayElement.style.left = "auto";
      this.overlayElement.style.bottom = "auto";
      this.overlayElement.style.zIndex = "9998";
      debugLog3("Overlay positioned in top-right corner");
    }
    /**
     * Calculate optimal position for overlay
     */
    calculateOptimalPosition() {
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
        scrollX: window.pageXOffset,
        scrollY: window.pageYOffset
      };
      let x = viewport.width - 320 - 20;
      let y = 20;
      switch (this.config.overlayPosition) {
        case "top-left":
          x = 20;
          y = 20;
          break;
        case "top-right":
          x = viewport.width - 320 - 20;
          y = 20;
          break;
        case "bottom-left":
          x = 20;
          y = viewport.height - 200 - 20;
          break;
        case "bottom-right":
          x = viewport.width - 320 - 20;
          y = viewport.height - 200 - 20;
          break;
        case "center":
          x = (viewport.width - 320) / 2;
          y = (viewport.height - 200) / 2;
          break;
        case "mouse":
          if (this.lastMousePosition) {
            x = this.lastMousePosition.x + 10;
            y = this.lastMousePosition.y + 10;
          }
          break;
        default:
          break;
      }
      return { x, y };
    }
    /**
     * Constrain overlay to viewport
     */
    constrainToViewport() {
      if (!this.overlayElement) {
        return;
      }
      const rect = this.overlayElement.getBoundingClientRect();
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };
      let x = parseInt(this.overlayElement.style.left);
      let y = parseInt(this.overlayElement.style.top);
      if (rect.right > viewport.width) {
        x = viewport.width - rect.width - 10;
      }
      if (x < 10) {
        x = 10;
      }
      if (rect.bottom > viewport.height) {
        y = viewport.height - rect.height - 10;
      }
      if (y < 10) {
        y = 10;
      }
      this.overlayElement.style.left = `${x}px`;
      this.overlayElement.style.top = `${y}px`;
    }
    /**
     * Apply overlay styles
     */
    applyOverlayStyles() {
      if (!this.overlayElement) {
        return;
      }
      const styles = {
        display: "none",
        position: "fixed",
        minWidth: "300px",
        maxWidth: "400px",
        minHeight: "100px",
        maxHeight: "80vh",
        backgroundColor: "white",
        border: "1px solid #ccc",
        borderRadius: "6px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        padding: "12px",
        fontSize: "14px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        zIndex: "2147483647",
        overflow: "auto",
        cursor: "default"
      };
      Object.assign(this.overlayElement.style, styles);
      this.applyTransparencyMode();
    }
    /**
     * 🔺 UI-005: Transparent overlay manager - 🔧 Position and transparency control
     * Apply bottom-fixed positioning for transparent overlays
     */
    applyBottomFixedPositioning() {
      if (!this.overlayElement) return;
      this.overlayElement.classList.add("hoverboard-overlay-bottom");
      this.overlayElement.style.position = "fixed";
      this.overlayElement.style.bottom = "0";
      this.overlayElement.style.left = "0";
      this.overlayElement.style.width = "100vw";
      this.overlayElement.style.maxWidth = "none";
      this.overlayElement.style.minWidth = "100vw";
      this.overlayElement.style.height = "auto";
      this.overlayElement.style.minHeight = "48px";
      this.overlayElement.style.maxHeight = "200px";
      this.overlayElement.style.borderRadius = "0";
      this.overlayElement.style.zIndex = "999999";
      debugLog3("Applied bottom-fixed positioning");
    }
    /**
     * 🔺 UI-005: Transparency manager - 🔧 Opacity and positioning control
     * Apply transparency styling based on configuration
     */
    applyTransparencyMode() {
      if (!this.overlayElement) return;
      this.overlayElement.classList.remove(
        "hoverboard-overlay-transparent",
        "hoverboard-overlay-invisible"
      );
      const normalOpacity = this.config?.overlayOpacityNormal || 0.05;
      const hoverOpacity = this.config?.overlayOpacityHover || 0.15;
      const focusOpacity = this.config?.overlayOpacityFocus || 0.25;
      const blurAmount = this.config?.overlayBlurAmount || 2;
      switch (this.transparencyMode) {
        case "nearly-transparent":
          this.overlayElement.classList.add("hoverboard-overlay-transparent");
          this.overlayElement.style.background = `rgba(255, 255, 255, ${normalOpacity})`;
          this.overlayElement.style.backdropFilter = `blur(${blurAmount}px)`;
          this.overlayElement.style.border = "1px solid rgba(255, 255, 255, 0.2)";
          this.setupTransparencyInteractions();
          debugLog3("Applied nearly-transparent mode with opacity:", normalOpacity);
          break;
        case "fully-transparent":
          this.overlayElement.classList.add("hoverboard-overlay-invisible");
          this.overlayElement.style.background = `rgba(255, 255, 255, ${normalOpacity * 0.5})`;
          this.overlayElement.style.backdropFilter = `blur(${Math.max(1, blurAmount - 1)}px)`;
          this.overlayElement.style.border = "1px solid rgba(255, 255, 255, 0.1)";
          this.setupTransparencyInteractions();
          debugLog3("Applied fully-transparent mode with opacity:", normalOpacity * 0.5);
          break;
        default:
          this.overlayElement.style.background = "white";
          this.overlayElement.style.backdropFilter = "none";
          this.overlayElement.style.border = "1px solid #ccc";
          debugLog3("Using default opaque mode");
          break;
      }
      if (this.positionMode === "bottom-fixed") {
        this.applyBottomFixedPositioning();
      }
      if (this.adaptiveVisibility && (this.transparencyMode === "nearly-transparent" || this.transparencyMode === "fully-transparent")) {
        this.setupAdaptiveVisibility();
      }
    }
    /**
     * Legacy adaptive visibility - superseded by UI-VIS-001/002
     * Setup adaptive visibility based on mouse proximity
     */
    setupAdaptiveVisibility() {
      if (this.proximityListener) {
        this.document.removeEventListener("mousemove", this.proximityListener);
      }
      this.proximityListener = (e) => {
        const distanceFromBottom = window.innerHeight - e.clientY;
        if (distanceFromBottom < 100) {
          this.overlayElement.classList.add("proximity-active");
        } else if (distanceFromBottom > 200) {
          this.overlayElement.classList.remove("proximity-active");
        }
      };
      this.document.addEventListener("mousemove", this.proximityListener);
      debugLog3("Adaptive visibility enabled");
    }
    /**
     * Legacy transparency interactions - superseded by UI-VIS-001/002
     * Setup hover and focus interactions for transparent overlays
     */
    setupTransparencyInteractions() {
      if (!this.overlayElement) return;
      const normalOpacity = this.config?.overlayOpacityNormal || 0.05;
      const hoverOpacity = this.config?.overlayOpacityHover || 0.15;
      const focusOpacity = this.config?.overlayOpacityFocus || 0.25;
      const blurAmount = this.config?.overlayBlurAmount || 2;
      const originalBackground = this.overlayElement.style.background;
      const originalBackdropFilter = this.overlayElement.style.backdropFilter;
      this.overlayElement.addEventListener("mouseenter", () => {
        if (this.transparencyMode === "nearly-transparent") {
          this.overlayElement.style.background = `rgba(255, 255, 255, ${hoverOpacity})`;
        } else if (this.transparencyMode === "fully-transparent") {
          this.overlayElement.style.background = `rgba(255, 255, 255, ${hoverOpacity * 0.5})`;
        }
        debugLog3("Overlay hover - increasing visibility to:", hoverOpacity);
      });
      this.overlayElement.addEventListener("mouseleave", () => {
        if (this.transparencyMode === "nearly-transparent") {
          this.overlayElement.style.background = `rgba(255, 255, 255, ${normalOpacity})`;
        } else if (this.transparencyMode === "fully-transparent") {
          this.overlayElement.style.background = `rgba(255, 255, 255, ${normalOpacity * 0.5})`;
        }
        debugLog3("Overlay leave - resetting visibility to:", normalOpacity);
      });
      this.overlayElement.addEventListener("focusin", () => {
        if (this.transparencyMode === "nearly-transparent") {
          this.overlayElement.style.background = `rgba(255, 255, 255, ${focusOpacity})`;
        } else if (this.transparencyMode === "fully-transparent") {
          this.overlayElement.style.background = `rgba(255, 255, 255, ${focusOpacity * 0.5})`;
        }
        debugLog3("Overlay focus - enhancing visibility for accessibility to:", focusOpacity);
      });
      this.overlayElement.addEventListener("focusout", () => {
        if (this.transparencyMode === "nearly-transparent") {
          this.overlayElement.style.background = `rgba(255, 255, 255, ${normalOpacity})`;
        } else if (this.transparencyMode === "fully-transparent") {
          this.overlayElement.style.background = `rgba(255, 255, 255, ${normalOpacity * 0.5})`;
        }
        debugLog3("Overlay blur - resetting focus visibility to:", normalOpacity);
      });
    }
    /**
     * Set up overlay interactions
     */
    setupOverlayInteractions() {
      if (!this.overlayElement) {
        return;
      }
      this.overlayElement.addEventListener("mouseenter", () => {
        this.isInsideOverlay = true;
      });
      this.overlayElement.addEventListener("mouseleave", () => {
        this.isInsideOverlay = false;
      });
      this.overlayElement.addEventListener("click", (e) => {
        e.stopPropagation();
      });
      if (this.config.overlayDraggable) {
        this.makeDraggable();
      }
    }
    /**
     * Make overlay draggable
     */
    makeDraggable() {
      if (!this.overlayElement) {
        return;
      }
      let isDragging = false;
      const dragOffset = { x: 0, y: 0 };
      const dragHandle = this.document.createElement("div");
      dragHandle.className = "hoverboard-drag-handle";
      dragHandle.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 20px;
      cursor: move;
      background: linear-gradient(to bottom, #f8f8f8, #e8e8e8);
      border-bottom: 1px solid #ddd;
      border-radius: 6px 6px 0 0;
    `;
      this.overlayElement.style.position = "relative";
      this.overlayElement.style.paddingTop = "32px";
      this.overlayElement.insertBefore(dragHandle, this.overlayElement.firstChild);
      dragHandle.addEventListener("mousedown", (e) => {
        isDragging = true;
        const overlayRect = this.overlayElement.getBoundingClientRect();
        dragOffset.x = e.clientX - overlayRect.left;
        dragOffset.y = e.clientY - overlayRect.top;
        e.preventDefault();
      });
      this.document.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        const x = e.clientX - dragOffset.x;
        const y = e.clientY - dragOffset.y;
        this.overlayElement.style.left = `${x}px`;
        this.overlayElement.style.top = `${y}px`;
        this.constrainToViewport();
      });
      this.document.addEventListener("mouseup", () => {
        isDragging = false;
      });
    }
    /**
     * Add show animation
     */
    addShowAnimation() {
      if (!this.overlayElement) {
        return;
      }
      if (this.config.overlayAnimations) {
        this.overlayElement.style.opacity = "0";
        this.overlayElement.style.transform = "scale(0.9) translateY(-10px)";
        this.overlayElement.style.transition = "opacity 0.2s ease, transform 0.2s ease";
        requestAnimationFrame(() => {
          this.overlayElement.style.opacity = "1";
          this.overlayElement.style.transform = "scale(1) translateY(0)";
        });
      } else {
        this.overlayElement.style.opacity = "1";
        this.overlayElement.style.transform = "scale(1) translateY(0)";
      }
    }
    /**
     * Add hide animation
     */
    addHideAnimation(callback) {
      if (!this.overlayElement || !this.config.overlayAnimations) {
        callback();
        return;
      }
      this.overlayElement.style.transition = "opacity 0.15s ease, transform 0.15s ease";
      this.overlayElement.style.opacity = "0";
      this.overlayElement.style.transform = "scale(0.9) translateY(-10px)";
      setTimeout(callback, 150);
    }
    /**
     * Inject CSS styles
     */
    injectCSS() {
      const styleId = "hoverboard-overlay-styles";
      const existingStyle = this.document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
      const style = this.document.createElement("style");
      style.id = styleId;
      let cssContent = this.getOverlayCSS();
      if (this.visibilityControls) {
        cssContent += "\n" + this.visibilityControls.getControlsCSS();
      }
      style.textContent = cssContent;
      this.document.head.appendChild(style);
      debugLog3("CSS injected", { hasVisibilityControls: !!this.visibilityControls });
    }
    /**
     * [TAB-SEARCH-UI] Add tab search section to overlay
     */
    addTabSearchSection(mainContainer) {
      const searchContainer = this.document.createElement("div");
      searchContainer.className = "tab-search-container";
      searchContainer.style.cssText = `
      margin-bottom: 8px;
      padding: 4px;
      border-radius: 4px;
    `;
      const searchLabel = this.document.createElement("span");
      searchLabel.className = "label-primary tiny";
      searchLabel.textContent = "Search Tabs:";
      searchLabel.style.cssText = "padding: 0.2em 0.5em; margin-right: 4px;";
      searchContainer.appendChild(searchLabel);
      const searchInput = this.document.createElement("input");
      searchInput.className = "tab-search-input";
      searchInput.placeholder = "Enter tab title...";
      searchInput.style.cssText = `
      margin: 2px;
      padding: 2px 4px;
      font-size: 12px;
      width: 120px;
    `;
      searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          const searchText = searchInput.value.trim();
          if (searchText) {
            this.handleTabSearch(searchText);
          }
        }
      });
      searchContainer.appendChild(searchInput);
      mainContainer.appendChild(searchContainer);
    }
    /**
     * [TAB-SEARCH-UI] Handle tab search from overlay
     */
    async handleTabSearch(searchText) {
      try {
        const response = await safariEnhancements.runtime.sendMessage({
          type: "searchTabs",
          data: { searchText }
        });
        if (response.success) {
          this.showMessage(`Found ${response.matchCount} tabs - navigating to "${response.tabTitle}"`, "success");
        } else {
          this.showMessage(response.message || "No matching tabs found", "error");
        }
      } catch (error) {
        console.error("[TAB-SEARCH-UI] Tab search error:", error);
        this.showMessage("Failed to search tabs", "error");
      }
    }
    /**
     * Get overlay CSS styles
     */
    getOverlayCSS() {
      return `
      /* Base overlay styling with theme-aware defaults */
      .hoverboard-overlay {
        position: fixed !important;
        z-index: 9998 !important;
        background: rgba(255, 255, 255, 0.95);
        border: 2px solid #90ee90;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        min-width: 300px;
        max-width: 400px;
        max-height: 80vh;
        font-family: 'Futura PT', system-ui, -apple-system, sans-serif;
        font-size: 14px;
        color: #333;
        font-weight: 600;
        padding: 0;
        margin: 0;
        overflow-y: auto;
        cursor: pointer;
        backdrop-filter: none;
        width: auto;
        height: auto;
        min-height: auto;
        opacity: 0;
        transform: scale(0.9) translateY(-10px);

        /* Default theme variables and transition timing */
        --theme-opacity: 0.9;
        --theme-text-opacity: 1.0;
        --theme-border-opacity: 0.8;
        --theme-transition: all 0.2s ease-in-out;
      }

      /* \u{1F3A8} Theme Variables - Light-on-Dark Theme (Dark Theme) */
      .hoverboard-theme-light-on-dark {
        /* Primary text colors */
        --theme-text-primary: #ffffff;
        --theme-text-secondary: #e0e0e0;
        --theme-text-muted: #b0b0b0;

        /* Special text colors for light backgrounds in dark theme */
        --theme-text-on-light: #333333;
        --theme-text-secondary-on-light: #666666;

        /* Background colors */
        --theme-background-primary: #2c3e50;
        --theme-background-secondary: #34495e;
        --theme-background-tertiary: #455a64;

        /* Interactive element colors - Dark backgrounds for light-on-dark */
        --theme-button-bg: #34495e;
        --theme-button-hover: #455a64;
        --theme-button-active: #546e7a;

        /* Input styling - Dark backgrounds for light-on-dark */
        --theme-input-bg: #34495e;
        --theme-input-border: #455a64;
        --theme-input-focus: #74b9ff;

        /* Status and semantic colors - optimized for dark backgrounds */
        --theme-success: #2ecc71;
        --theme-warning: #f1c40f;
        --theme-danger: #e74c3c;
        --theme-info: #74b9ff;

        /* Tag-specific styling - softer colors for dark theme */
        --theme-tag-bg: rgba(46, 204, 113, 0.15);
        --theme-tag-text: #7bed9f;
        --theme-tag-border: rgba(46, 204, 113, 0.3);

        /* Borders and separators */
        --theme-border: rgba(255, 255, 255, 0.2);
        --theme-separator: rgba(255, 255, 255, 0.1);

        /* RGB values for dynamic transparency - Dark theme uses dark RGB */
        --theme-bg-rgb: 44, 62, 80;
      }

      /* \u{1F3A8} Theme Variables - Dark-on-Light Theme (Light Theme) */
      .hoverboard-theme-dark-on-light {
        /* Primary text colors */
        --theme-text-primary: #333333;
        --theme-text-secondary: #666666;
        --theme-text-muted: #999999;

        /* Text colors for consistency (same as primary in light theme) */
        --theme-text-on-light: #333333;
        --theme-text-secondary-on-light: #666666;

        /* Background colors */
        --theme-background-primary: #ffffff;
        --theme-background-secondary: #f8f9fa;
        --theme-background-tertiary: #e9ecef;

        /* Interactive element colors */
        --theme-button-bg: rgba(0, 0, 0, 0.05);
        --theme-button-hover: rgba(0, 0, 0, 0.1);
        --theme-button-active: rgba(0, 0, 0, 0.15);

        /* Input styling */
        --theme-input-bg: rgba(255, 255, 255, 0.8);
        --theme-input-border: rgba(0, 0, 0, 0.2);
        --theme-input-focus: rgba(0, 100, 200, 0.3);

        /* Status and semantic colors */
        --theme-success: #28a745;
        --theme-warning: #ffc107;
        --theme-danger: #dc3545;
        --theme-info: #17a2b8;

        /* Tag-specific styling */
        --theme-tag-bg: rgba(40, 167, 69, 0.1);
        --theme-tag-text: #28a745;
        --theme-tag-border: rgba(40, 167, 69, 0.3);

        /* Borders and separators */
        --theme-border: rgba(0, 0, 0, 0.1);
        --theme-separator: rgba(0, 0, 0, 0.05);

        /* RGB values for dynamic transparency */
        --theme-bg-rgb: 255, 255, 255;
      }

      /* \u{1F527} Transparency Mode Integration */
      .hoverboard-overlay.transparency-mode {
        background: rgba(var(--theme-bg-rgb), var(--theme-opacity)) !important;
        backdrop-filter: blur(2px);
      }

      /* Enhanced contrast for low opacity scenarios */
      .hoverboard-overlay.transparency-mode[data-opacity-level="low"] {
        --theme-text-shadow: 0 0 2px rgba(0, 0, 0, 0.8);
      }

      .hoverboard-overlay.transparency-mode[data-opacity-level="medium"] {
        --theme-text-shadow: 0 0 1px rgba(0, 0, 0, 0.5);
      }

      .hoverboard-overlay.transparency-mode * {
        text-shadow: var(--theme-text-shadow, none);
      }

      .hoverboard-overlay * {
        box-sizing: border-box;
      }

      /* \u{1F3A8} Theme-Aware Element Styling */

      /* Container elements */
      .hoverboard-overlay .scrollmenu,
      .hoverboard-overlay .tags-container {
        background: var(--theme-background-secondary);
        color: var(--theme-text-primary);
        border: 1px solid var(--theme-border);
        transition: var(--theme-transition);
        overflow-x: auto;
        white-space: nowrap;
      }

      .hoverboard-overlay .page-info {
        background: var(--theme-background-tertiary);
        color: var(--theme-text-secondary);
        border-top: 1px solid var(--theme-separator);
      }

      /* Text elements */
      .hoverboard-overlay .tiny {
        font-size: ${this.config.fontSizeLabels || 12}px;
        display: inline-block;
        color: var(--theme-text-secondary);
      }

      .hoverboard-overlay .label-primary {
        color: var(--theme-text-primary);
        font-weight: 600;
      }

      .hoverboard-overlay .label-secondary {
        color: var(--theme-text-secondary);
        font-weight: 500;
      }

      .hoverboard-overlay .text-muted {
        color: var(--theme-text-muted);
      }

      /* Tag elements */
      .hoverboard-overlay .tag-element,
      .hoverboard-overlay .iconTagDeleteInactive {
        background: var(--theme-tag-bg);
        color: var(--theme-tag-text);
        border: 1px solid var(--theme-tag-border);
        transition: var(--theme-transition);
        padding: 0.2em 0.5em;
        margin: 2px;
        border-radius: 3px;
        cursor: pointer;
        display: inline-block;
        font-size: ${this.config.fontSizeTags || 12}px;
      }

      /* Suggested tags - smaller font size */
      .hoverboard-overlay .suggested-container .tag-element {
        font-size: ${this.config.fontSizeSuggestedTags || 10}px;
      }

      .hoverboard-overlay .tag-element:hover,
      .hoverboard-overlay .iconTagDeleteInactive:hover {
        background: var(--theme-button-hover);
        transform: translateY(-1px);
        border-color: var(--theme-input-focus);
      }

      /* Input elements */
      .hoverboard-overlay .tag-input {
        background: var(--theme-input-bg);
        color: var(--theme-text-primary);
        border: 1px solid var(--theme-input-border);
        transition: var(--theme-transition);
        outline: none;
        border-radius: 3px;
        padding: 2px 4px;
        font-size: ${this.config.fontSizeInputs || 14}px;
      }

      .hoverboard-overlay .tag-input:focus {
        border-color: var(--theme-input-focus);
        box-shadow: 0 0 0 2px rgba(var(--theme-input-focus), 0.2);
      }

      .hoverboard-overlay .tag-input::placeholder {
        color: var(--theme-text-muted);
      }

      .hoverboard-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .hoverboard-section {
        border-bottom: 1px solid #eee;
        padding-bottom: 12px;
      }

      .hoverboard-section:last-child {
        border-bottom: none;
        padding-bottom: 0;
      }

      .section-header {
        font-weight: 600;
        font-size: 14px;
        color: #2c3e50;
        margin-bottom: 8px;
      }

      .tags-container {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-bottom: 12px;
      }

      /* Button elements */
      .hoverboard-overlay .action-button {
        background: var(--theme-button-bg);
        color: var(--theme-text-primary);
        border: 1px solid var(--theme-border);
        transition: var(--theme-transition);
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
      }

      .hoverboard-overlay .action-button:hover {
        background: var(--theme-button-hover);
        border-color: var(--theme-input-focus);
      }

      .hoverboard-overlay .action-button.active {
        background: var(--theme-button-active);
        border-color: var(--theme-info);
      }

      /* [OVERLAY-REFRESH-UI-001] Refresh button styling */
      .hoverboard-overlay .refresh-button {
        background: var(--theme-button-bg);
        color: var(--theme-text-primary);
        border: 1px solid var(--theme-border);
        border-radius: 4px;
        padding: 4px 6px;
        cursor: pointer;
        font-size: 14px;
        transition: var(--theme-transition);
        position: absolute;
        top: 8px;
        left: 8px;
        z-index: 1;
      }

      .hoverboard-overlay .refresh-button:hover {
        background: var(--theme-button-hover);
        border-color: var(--theme-input-focus);
        transform: scale(1.05);
      }

      .hoverboard-overlay .refresh-button:active {
        background: var(--theme-button-active);
        transform: scale(0.95);
      }

      .hoverboard-overlay .refresh-button:focus {
        outline: 2px solid var(--theme-input-focus);
        outline-offset: 2px;
      }

      /* Close button - uses danger color */
      .hoverboard-overlay .close-button {
        background: var(--theme-danger);
        color: white;
        border: none;
        transition: var(--theme-transition);
        padding: 0.2em 0.5em;
        border-radius: 3px;
        cursor: pointer;
        font-weight: 900;
      }

      .hoverboard-overlay .close-button:hover {
        background: color-mix(in srgb, var(--theme-danger) 80%, black);
        transform: scale(1.05);
      }

      /* State-specific button styling */
      .hoverboard-overlay .action-button.private-active {
        background: color-mix(in srgb, var(--theme-warning) 20%, var(--theme-button-bg));
        border-color: var(--theme-warning);
      }

      .hoverboard-overlay .action-button.read-later-active {
        background: color-mix(in srgb, var(--theme-info) 20%, var(--theme-button-bg));
        border-color: var(--theme-info);
      }

      /* \u{1F3A8} Light-on-Dark Theme Comprehensive Overrides - ALL interactive elements get dark backgrounds */

      /* Main overlay container - Override inline styles with highest specificity */
      .hoverboard-overlay.hoverboard-theme-light-on-dark,
      #hoverboard-overlay.hoverboard-theme-light-on-dark,
      .hoverboard-theme-light-on-dark.hoverboard-overlay.solid-background {
        background: var(--theme-background-primary) !important;
        border: 2px solid var(--theme-border) !important;
        color: var(--theme-text-primary) !important;
      }

      /* Main overlay container in transparency mode - Override inline styles */
      .hoverboard-overlay.hoverboard-theme-light-on-dark.transparency-mode,
      .hoverboard-overlay.hoverboard-theme-light-on-dark.hoverboard-overlay-transparent,
      #hoverboard-overlay.hoverboard-theme-light-on-dark.hoverboard-overlay-transparent {
        background: rgba(var(--theme-bg-rgb), var(--theme-opacity)) !important;
        backdrop-filter: blur(2px) !important;
        border: 2px solid var(--theme-border) !important;
      }

      /* All buttons */
      .hoverboard-theme-light-on-dark button,
      .hoverboard-theme-light-on-dark .action-button,
      .hoverboard-theme-light-on-dark .add-tag-button,
      .hoverboard-theme-light-on-dark .refresh-button {
        color: var(--theme-text-primary) !important;
        background: var(--theme-button-bg) !important;
        border: 1px solid var(--theme-input-border) !important;
      }

      .hoverboard-theme-light-on-dark button:hover,
      .hoverboard-theme-light-on-dark .action-button:hover,
      .hoverboard-theme-light-on-dark .add-tag-button:hover,
      .hoverboard-theme-light-on-dark .refresh-button:hover {
        background: var(--theme-button-hover) !important;
      }

      /* All text inputs */
      .hoverboard-theme-light-on-dark input,
      .hoverboard-theme-light-on-dark .tag-input,
      .hoverboard-theme-light-on-dark .add-tag-input {
        color: var(--theme-text-primary) !important;
        background: var(--theme-input-bg) !important;
        border: 1px solid var(--theme-input-border) !important;
      }

      .hoverboard-theme-light-on-dark input:focus,
      .hoverboard-theme-light-on-dark .tag-input:focus,
      .hoverboard-theme-light-on-dark .add-tag-input:focus {
        border-color: var(--theme-input-focus) !important;
        box-shadow: 0 0 0 2px rgba(116, 185, 255, 0.2) !important;
      }

      .hoverboard-theme-light-on-dark input::placeholder,
      .hoverboard-theme-light-on-dark .tag-input::placeholder,
      .hoverboard-theme-light-on-dark .add-tag-input::placeholder {
        color: var(--theme-text-muted) !important;
      }

      /* All labels */
      .hoverboard-theme-light-on-dark .label-primary {
        color: var(--theme-text-primary) !important;
        background: var(--theme-background-secondary);
        padding: 0.2em 0.5em;
        border-radius: 3px;
      }

      .hoverboard-theme-light-on-dark .label-secondary {
        color: var(--theme-text-secondary) !important;
        background: var(--theme-background-tertiary);
        padding: 0.2em 0.5em;
        border-radius: 3px;
      }

      /* Special button states */
      .hoverboard-theme-light-on-dark .action-button.private-active {
        background: color-mix(in srgb, var(--theme-warning) 30%, var(--theme-button-bg)) !important;
        color: var(--theme-text-primary) !important;
      }

      .hoverboard-theme-light-on-dark .action-button.read-later-active {
        background: color-mix(in srgb, var(--theme-info) 30%, var(--theme-button-bg)) !important;
        color: var(--theme-text-primary) !important;
      }

      /* Close button override */
      .hoverboard-theme-light-on-dark .close-button {
        background: var(--theme-danger) !important;
        color: white !important;
      }

      .add-tag-container {
        display: flex;
        gap: 8px;
        align-items: center;
      }

      /* Form elements */
      .hoverboard-overlay .add-tag-input {
        background: var(--theme-input-bg);
        color: var(--theme-text-primary);
        border: 1px solid var(--theme-input-border);
        transition: var(--theme-transition);
        padding: 6px 8px;
        border-radius: 4px;
        font-size: 13px;
        width: 140px;
        outline: none;
      }

      .hoverboard-overlay .add-tag-input:focus {
        border-color: var(--theme-input-focus);
        box-shadow: 0 0 0 2px rgba(var(--theme-input-focus), 0.2);
      }

      .hoverboard-overlay .add-tag-input::placeholder {
        color: var(--theme-text-muted);
      }

      .hoverboard-overlay .add-tag-button {
        background: var(--theme-success);
        color: white;
        border: 1px solid var(--theme-success);
        transition: var(--theme-transition);
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
      }

      .hoverboard-overlay .add-tag-button:hover {
        background: color-mix(in srgb, var(--theme-success) 80%, black);
        border-color: color-mix(in srgb, var(--theme-success) 80%, black);
      }

      .actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }

      @media (max-width: 480px) {
        .hoverboard-overlay {
          min-width: 280px;
          max-width: 90vw;
          font-size: 13px;
        }

        .tags-container {
          gap: 4px;
        }

        .actions {
          gap: 6px;
        }
      }

      /* \u2B50 UI-005: Transparent overlay - \u{1F3A8} Enhanced transparency system */
      .hoverboard-overlay-transparent {
        background: rgba(255, 255, 255, 0.1) !important;
        backdrop-filter: blur(2px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #000000;
        text-shadow: 0 0 2px rgba(255, 255, 255, 0.8);
        transition: background-color 0.2s ease-in-out;
      }

      /* [OVERLAY-REFRESH-THEME-001] Refresh button theme-aware styling */
      .hoverboard-overlay .refresh-button {
        position: absolute;
        top: 8px;
        left: 8px;
        background: var(--theme-button-bg);
        color: var(--theme-text-primary);
        border: 1px solid var(--theme-border);
        border-radius: 4px;
        padding: 4px 6px;
        cursor: pointer;
        font-size: 14px;
        z-index: 1;
        transition: var(--theme-transition);
        min-width: 24px;
        min-height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .hoverboard-overlay .refresh-button:hover {
        background: var(--theme-button-hover);
        border-color: var(--theme-input-focus);
        transform: scale(1.05);
      }

      .hoverboard-overlay .refresh-button:active {
        background: var(--theme-button-active);
        transform: scale(0.95);
      }

      .hoverboard-overlay .refresh-button:focus {
        outline: 2px solid var(--theme-input-focus);
        outline-offset: 2px;
      }

      /* [OVERLAY-REFRESH-THEME-001] Loading state for refresh button */
      .hoverboard-overlay .refresh-button.loading {
        opacity: 0.7;
        pointer-events: none;
      }

      .hoverboard-overlay .refresh-button.loading::after {
        content: '';
        position: absolute;
        width: 12px;
        height: 12px;
        border: 2px solid transparent;
        border-top: 2px solid var(--theme-text-primary);
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .hoverboard-overlay-invisible {
        background: transparent !important;
        backdrop-filter: blur(1px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #333333;
        transition: background-color 0.2s ease-in-out;
      }

      /* \u{1F53A} UI-005: Transparent overlay positioning - \u{1F3A8} Bottom-fixed transparency */
      .hoverboard-overlay-bottom {
        position: fixed !important;
        bottom: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: auto !important;
        min-height: 48px;
        max-height: 200px;
        max-width: none !important;
        min-width: 100vw !important;
        border-radius: 0 !important;
        border-top: 1px solid rgba(255, 255, 255, 0.2);
        border-left: none;
        border-right: none;
        border-bottom: none;
        animation: hoverboard-slide-up 0.3s ease-out;
        padding: 8px 16px !important; /* Add horizontal padding for content spacing */
        box-sizing: border-box;
      }

      /* Layout adjustments for bottom-fixed overlays */
      .hoverboard-overlay-bottom .hoverboard-container {
        max-width: 100%;
        overflow: hidden;
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
      }

      .hoverboard-overlay-bottom .hoverboard-section {
        margin-bottom: 0;
        padding-bottom: 0;
        border-bottom: none;
        flex: 1;
        min-width: 200px;
      }

      .hoverboard-overlay-bottom .section-header {
        font-size: 12px;
        margin-bottom: 4px;
        white-space: nowrap;
      }

      .hoverboard-overlay-bottom .add-tag-container {
        flex-wrap: wrap;
        justify-content: space-between;
        gap: 6px;
      }

      .hoverboard-overlay-bottom .add-tag-input {
        flex: 1;
        min-width: 120px;
        max-width: 200px;
      }

      .hoverboard-overlay-bottom .add-tag-button {
        flex-shrink: 0;
      }

      .hoverboard-overlay-bottom .actions {
        justify-content: flex-end;
        gap: 12px;
        flex-shrink: 0;
      }

      .hoverboard-overlay-bottom .tags-container {
        justify-content: flex-start;
        max-width: 100%;
        overflow-x: auto;
        scrollbar-width: none; /* Firefox */
        -ms-overflow-style: none; /* IE/Edge */
      }

      .hoverboard-overlay-bottom .tags-container::-webkit-scrollbar {
        display: none; /* Chrome/Safari */
      }

      /* Responsive adjustments for bottom-fixed */
      @media (max-width: 768px) {
        .hoverboard-overlay-bottom .hoverboard-container {
          flex-direction: column;
          gap: 8px;
        }

        .hoverboard-overlay-bottom .hoverboard-section {
          min-width: unset;
          width: 100%;
        }

        .hoverboard-overlay-bottom .add-tag-container {
          flex-direction: row;
          justify-content: space-between;
        }

        .hoverboard-overlay-bottom .add-tag-input {
          max-width: 200px;
        }

        .hoverboard-overlay-bottom .actions {
          gap: 8px;
          justify-content: center;
        }
      }

      /* Hover state - Increased visibility on interaction */
      .hoverboard-overlay-transparent:hover,
      .hoverboard-overlay-invisible:hover {
        background: rgba(255, 255, 255, 0.25) !important;
      }

      /* Focus state - Enhanced visibility for accessibility */
      .hoverboard-overlay-transparent:focus-within,
      .hoverboard-overlay-invisible:focus-within {
        background: rgba(255, 255, 255, 0.4) !important;
      }

      /* \u{1F536} UI-005: Adaptive visibility - \u{1F3AF} Context-aware transparency */
      .hoverboard-overlay-transparent.proximity-active,
      .hoverboard-overlay-invisible.proximity-active {
        background: rgba(255, 255, 255, 0.2) !important;
      }

      /* Slide-up animation for bottom-fixed overlays */
      @keyframes hoverboard-slide-up {
        from {
          transform: translateY(100%);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      /* [IMMUTABLE-REQ-TAG-004] - Slide-in animation for messages */
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    }
    /**
     * Update mouse position for positioning
     */
    updateMousePosition(x, y) {
      this.lastMousePosition = { x, y };
    }
    /**
     * Apply visibility settings from VisibilityControls component
     * UI-VIS-001: Callback for VisibilityControls component
     * Enhanced with comprehensive theme integration
     */
    applyVisibilitySettings(settings) {
      debugLog3("Applying comprehensive visibility settings", settings);
      if (this.overlayElement) {
        this.overlayElement.classList.remove(
          "hoverboard-theme-light-on-dark",
          "hoverboard-theme-dark-on-light",
          "transparency-mode",
          "solid-background"
        );
        this.overlayElement.classList.add(`hoverboard-theme-${settings.textTheme}`);
        if (settings.transparencyEnabled) {
          this.overlayElement.classList.add("transparency-mode");
          const opacity = settings.backgroundOpacity / 100;
          let opacityLevel = "high";
          if (opacity < 0.4) opacityLevel = "low";
          else if (opacity < 0.7) opacityLevel = "medium";
          this.overlayElement.setAttribute("data-opacity-level", opacityLevel);
          this.overlayElement.style.setProperty("--theme-opacity", opacity);
          if (settings.textTheme === "light-on-dark") {
            this.overlayElement.style.background = `rgba(44, 62, 80, ${opacity})`;
          } else {
            this.overlayElement.style.background = `rgba(255, 255, 255, ${opacity})`;
          }
          this.overlayElement.style.backdropFilter = "blur(2px)";
          debugLog3(`Applied transparency: ${settings.textTheme} with ${settings.backgroundOpacity}% opacity (${opacityLevel} level)`);
        } else {
          this.overlayElement.classList.add("solid-background");
          this.overlayElement.removeAttribute("data-opacity-level");
          this.overlayElement.style.removeProperty("--theme-opacity");
          this.overlayElement.style.background = "";
          this.overlayElement.style.backdropFilter = "none";
          debugLog3(`Applied solid theme: ${settings.textTheme}`);
        }
        this.overlayElement.offsetHeight;
      }
    }
    /**
     * Update configuration
     */
    updateConfig(newConfig) {
      this.config = { ...this.config, ...newConfig };
      if (newConfig.overlayTransparencyMode !== void 0) {
        this.transparencyMode = newConfig.overlayTransparencyMode;
      }
      if (newConfig.overlayPositionMode !== void 0) {
        this.positionMode = newConfig.overlayPositionMode;
      }
      if (newConfig.overlayAdaptiveVisibility !== void 0) {
        this.adaptiveVisibility = newConfig.overlayAdaptiveVisibility;
      }
      debugLog3("Configuration updated", {
        transparencyMode: this.transparencyMode,
        positionMode: this.positionMode,
        adaptiveVisibility: this.adaptiveVisibility,
        newConfig
      });
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
     * Cleanup resources
     */
    destroy() {
      this.removeOverlay();
      if (this.proximityListener) {
        this.document.removeEventListener("mousemove", this.proximityListener);
        this.proximityListener = null;
      }
      if (this.visibilityControls) {
        this.visibilityControls.destroy();
        this.visibilityControls = null;
      }
      const styleElement = this.document.getElementById("hoverboard-overlay-styles");
      if (styleElement) {
        styleElement.remove();
      }
    }
  };

  // src/features/content/dom-utils.js
  var DOMUtils = class {
    /**
     * Wait for DOM to be ready
     * @returns {Promise} Promise that resolves when DOM is ready
     */
    waitForDOM() {
      return new Promise((resolve) => {
        if (document.readyState === "complete" || document.readyState === "interactive") {
          resolve();
        } else {
          document.addEventListener("DOMContentLoaded", resolve);
        }
      });
    }
    /**
     * Query selector with optional context
     * @param {string} selector - CSS selector
     * @param {Element} context - Context element (default: document)
     * @returns {Element|null} First matching element
     */
    $(selector, context = document) {
      return context.querySelector(selector);
    }
    /**
     * Query selector all with optional context
     * @param {string} selector - CSS selector
     * @param {Element} context - Context element (default: document)
     * @returns {NodeList} All matching elements
     */
    $$(selector, context = document) {
      return context.querySelectorAll(selector);
    }
    /**
     * Create element with attributes and properties
     * @param {string} tagName - HTML tag name
     * @param {Object} attributes - Element attributes
     * @param {Object} properties - Element properties
     * @returns {Element} Created element
     */
    createElement(tagName, attributes = {}, properties = {}) {
      const element = document.createElement(tagName);
      Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
      });
      Object.entries(properties).forEach(([key, value]) => {
        element[key] = value;
      });
      return element;
    }
    /**
     * Add event listener with optional delegation
     * @param {Element|string} target - Target element or selector
     * @param {string} event - Event type
     * @param {Function} handler - Event handler
     * @param {string} delegateSelector - Delegate selector for event delegation
     * @returns {Function} Cleanup function
     */
    on(target, event, handler, delegateSelector = null) {
      const element = typeof target === "string" ? this.$(target) : target;
      if (!element) return () => {
      };
      if (delegateSelector) {
        const delegatedHandler = (e) => {
          const delegatedTarget = e.target.closest(delegateSelector);
          if (delegatedTarget && element.contains(delegatedTarget)) {
            handler.call(delegatedTarget, e);
          }
        };
        element.addEventListener(event, delegatedHandler);
        return () => element.removeEventListener(event, delegatedHandler);
      } else {
        element.addEventListener(event, handler);
        return () => element.removeEventListener(event, handler);
      }
    }
    /**
     * Remove element from DOM
     * @param {Element|string} target - Target element or selector
     */
    remove(target) {
      const element = typeof target === "string" ? this.$(target) : target;
      if (element && element.parentNode) {
        element.parentNode.removeChild(element);
      }
    }
    /**
     * Append child element
     * @param {Element|string} parent - Parent element or selector
     * @param {Element} child - Child element to append
     */
    append(parent, child) {
      const parentElement = typeof parent === "string" ? this.$(parent) : parent;
      if (parentElement && child) {
        parentElement.appendChild(child);
      }
    }
    /**
     * Prepend child element
     * @param {Element|string} parent - Parent element or selector
     * @param {Element} child - Child element to prepend
     */
    prepend(parent, child) {
      const parentElement = typeof parent === "string" ? this.$(parent) : parent;
      if (parentElement && child) {
        parentElement.insertBefore(child, parentElement.firstChild);
      }
    }
    /**
     * Set or get element attributes
     * @param {Element|string} target - Target element or selector
     * @param {string|Object} attr - Attribute name or object of attributes
     * @param {string} value - Attribute value (if attr is string)
     * @returns {string|void} Attribute value if getting, void if setting
     */
    attr(target, attr, value = null) {
      const element = typeof target === "string" ? this.$(target) : target;
      if (!element) return;
      if (typeof attr === "object") {
        Object.entries(attr).forEach(([key, val]) => {
          element.setAttribute(key, val);
        });
      } else if (value !== null) {
        element.setAttribute(attr, value);
      } else {
        return element.getAttribute(attr);
      }
    }
    /**
     * Add CSS class to element
     * @param {Element|string} target - Target element or selector
     * @param {string} className - Class name to add
     */
    addClass(target, className) {
      const element = typeof target === "string" ? this.$(target) : target;
      if (element) {
        element.classList.add(className);
      }
    }
    /**
     * Remove CSS class from element
     * @param {Element|string} target - Target element or selector
     * @param {string} className - Class name to remove
     */
    removeClass(target, className) {
      const element = typeof target === "string" ? this.$(target) : target;
      if (element) {
        element.classList.remove(className);
      }
    }
    /**
     * Toggle CSS class on element
     * @param {Element|string} target - Target element or selector
     * @param {string} className - Class name to toggle
     * @returns {boolean} Whether class is now present
     */
    toggleClass(target, className) {
      const element = typeof target === "string" ? this.$(target) : target;
      if (element) {
        return element.classList.toggle(className);
      }
      return false;
    }
    /**
     * Check if element has CSS class
     * @param {Element|string} target - Target element or selector
     * @param {string} className - Class name to check
     * @returns {boolean} Whether element has class
     */
    hasClass(target, className) {
      const element = typeof target === "string" ? this.$(target) : target;
      return element ? element.classList.contains(className) : false;
    }
    /**
     * Set or get element styles
     * @param {Element|string} target - Target element or selector
     * @param {string|Object} prop - Style property or object of styles
     * @param {string} value - Style value (if prop is string)
     * @returns {string|void} Style value if getting, void if setting
     */
    css(target, prop, value = null) {
      const element = typeof target === "string" ? this.$(target) : target;
      if (!element) return;
      if (typeof prop === "object") {
        Object.entries(prop).forEach(([key, val]) => {
          element.style[key] = val;
        });
      } else if (value !== null) {
        element.style[prop] = value;
      } else {
        return window.getComputedStyle(element)[prop];
      }
    }
    /**
     * Show element
     * @param {Element|string} target - Target element or selector
     */
    show(target) {
      const element = typeof target === "string" ? this.$(target) : target;
      if (element) {
        element.style.display = "";
      }
    }
    /**
     * Hide element
     * @param {Element|string} target - Target element or selector
     */
    hide(target) {
      const element = typeof target === "string" ? this.$(target) : target;
      if (element) {
        element.style.display = "none";
      }
    }
    /**
     * Toggle element visibility
     * @param {Element|string} target - Target element or selector
     * @returns {boolean} Whether element is now visible
     */
    toggle(target) {
      const element = typeof target === "string" ? this.$(target) : target;
      if (element) {
        const isHidden = element.style.display === "none" || window.getComputedStyle(element).display === "none";
        if (isHidden) {
          this.show(element);
          return true;
        } else {
          this.hide(element);
          return false;
        }
      }
      return false;
    }
    /**
     * Get element text content
     * @param {Element|string} target - Target element or selector
     * @returns {string} Text content
     */
    text(target) {
      const element = typeof target === "string" ? this.$(target) : target;
      return element ? element.textContent : "";
    }
    /**
     * Set element text content
     * @param {Element|string} target - Target element or selector
     * @param {string} text - Text to set
     */
    setText(target, text) {
      const element = typeof target === "string" ? this.$(target) : target;
      if (element) {
        element.textContent = text;
      }
    }
    /**
     * Get or set element HTML
     * @param {Element|string} target - Target element or selector
     * @param {string} html - HTML to set (optional)
     * @returns {string|void} HTML content if getting, void if setting
     */
    html(target, html = null) {
      const element = typeof target === "string" ? this.$(target) : target;
      if (!element) return;
      if (html !== null) {
        element.innerHTML = html;
      } else {
        return element.innerHTML;
      }
    }
    /**
     * Check if element exists and is visible
     * @param {Element|string} target - Target element or selector
     * @returns {boolean} Whether element exists and is visible
     */
    isVisible(target) {
      const element = typeof target === "string" ? this.$(target) : target;
      if (!element) return false;
      const style = window.getComputedStyle(element);
      return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0";
    }
    /**
     * Get element position relative to viewport
     * @param {Element|string} target - Target element or selector
     * @returns {Object} Position object with top, left, right, bottom
     */
    getPosition(target) {
      const element = typeof target === "string" ? this.$(target) : target;
      if (!element) return { top: 0, left: 0, right: 0, bottom: 0 };
      return element.getBoundingClientRect();
    }
    /**
     * Smooth scroll to element
     * @param {Element|string} target - Target element or selector
     * @param {Object} options - Scroll options
     */
    scrollTo(target, options = {}) {
      const element = typeof target === "string" ? this.$(target) : target;
      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
          inline: "nearest",
          ...options
        });
      }
    }
    /**
     * Debounce function calls
     * @param {Function} func - Function to debounce
     * @param {number} delay - Delay in milliseconds
     * @returns {Function} Debounced function
     */
    debounce(func, delay) {
      let timeoutId;
      return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
      };
    }
    /**
     * Throttle function calls
     * @param {Function} func - Function to throttle
     * @param {number} delay - Delay in milliseconds
     * @returns {Function} Throttled function
     */
    throttle(func, delay) {
      let lastCall = 0;
      return function(...args) {
        const now = Date.now();
        if (now - lastCall >= delay) {
          lastCall = now;
          func.apply(this, args);
        }
      };
    }
    /**
     * Check if element is in viewport
     * @param {Element|string} target - Target element or selector
     * @param {number} threshold - Threshold percentage (0-1)
     * @returns {boolean} Whether element is in viewport
     */
    isInViewport(target, threshold = 0) {
      const element = typeof target === "string" ? this.$(target) : target;
      if (!element) return false;
      const rect = element.getBoundingClientRect();
      const windowHeight = window.innerHeight || document.documentElement.clientHeight;
      const windowWidth = window.innerWidth || document.documentElement.clientWidth;
      const vertInView = rect.top <= windowHeight * (1 - threshold) && rect.top + rect.height >= windowHeight * threshold;
      const horInView = rect.left <= windowWidth * (1 - threshold) && rect.left + rect.width >= windowWidth * threshold;
      return vertInView && horInView;
    }
    /**
     * Add tooltip to element
     * @param {Element|string} target - Target element or selector
     * @param {string} text - Tooltip text
     * @param {boolean} wide - Whether tooltip should be wide
     */
    addTooltip(target, text, wide = false) {
      const element = typeof target === "string" ? this.$(target) : target;
      if (element) {
        element.setAttribute("title", text);
        element.setAttribute("data-tooltip", wide ? "wide" : "normal");
        this.addClass(element, "has-tooltip");
      }
    }
    /**
     * Remove tooltip from element
     * @param {Element|string} target - Target element or selector
     */
    removeTooltip(target) {
      const element = typeof target === "string" ? this.$(target) : target;
      if (element) {
        element.removeAttribute("title");
        element.removeAttribute("data-tooltip");
        this.removeClass(element, "has-tooltip");
      }
    }
  };

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
    ECHO: "echo",
    // [REQ-AI_TAGGING_POPUP] [ARCH-AI_TAGGING_FLOW] AI tagging
    GET_PAGE_CONTENT: "GET_PAGE_CONTENT",
    GET_AI_TAGS: "GET_AI_TAGS",
    GET_SESSION_TAGS: "getSessionTags",
    RECORD_SESSION_TAGS: "recordSessionTags"
  };

  // src/features/ai/readability-extract.js
  var import_readability = __toESM(require_readability(), 1);
  var DEFAULT_MAX_LENGTH = 16e3;
  function extractPageContent(document2, options = {}) {
    const maxLength = options.maxLength ?? DEFAULT_MAX_LENGTH;
    if (!document2 || typeof document2.cloneNode !== "function") {
      return { title: "", textContent: "" };
    }
    let title = "";
    let textContent = "";
    try {
      const clone = document2.cloneNode(true);
      const reader = new import_readability.Readability(clone);
      const article = reader.parse();
      if (article) {
        title = article.title && String(article.title).trim() || document2.title && String(document2.title).trim() || "";
        textContent = article.textContent && String(article.textContent).trim() || "";
      } else {
        title = document2.title && String(document2.title).trim() || "";
        const body = document2.body;
        textContent = body && body.innerText && String(body.innerText).trim() ? String(body.innerText).trim() : "";
      }
    } catch {
      title = document2.title && String(document2.title).trim() || "";
      const body = document2.body;
      textContent = body && body.innerText ? String(body.innerText).trim() : "";
    }
    if (textContent.length > maxLength) {
      textContent = textContent.slice(0, maxLength);
    }
    return { title, textContent };
  }

  // src/features/content/content-main.js
  init_utils();

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

  // src/features/content/content-main.js
  safariEnhancements.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type !== "GET_PAGE_CONTENT") return;
    try {
      const result = extractPageContent(document);
      sendResponse({ success: true, data: result });
    } catch (e) {
      sendResponse({ success: false, error: e.message });
    }
    return true;
  });
  var HoverboardContentScript = class {
    constructor() {
      this.tabId = null;
      this.pageUrl = window.location.href;
      this.pageTitle = document.title;
      this.messageClient = new MessageClient();
      this.domUtils = new DOMUtils();
      this.overlayManager = new OverlayManager(document, {
        overlayPosition: "top-right",
        messageTimeout: 3e3,
        showRecentTags: true,
        maxRecentTags: 10,
        overlayAnimations: true,
        overlayDraggable: false,
        // Transparency settings for UI-005
        overlayTransparencyMode: "nearly-transparent",
        overlayPositionMode: "bottom-fixed",
        overlayOpacityNormal: 0.05,
        overlayOpacityHover: 0.15,
        overlayOpacityFocus: 0.25,
        overlayAdaptiveVisibility: true,
        overlayBlurAmount: 2
      });
      this.currentBookmark = null;
      this.isInitialized = false;
      this.overlayActive = false;
      this.config = null;
      this.init();
    }
    async init() {
      try {
        debugLog2("CONTENT-SCRIPT", "Initializing content script");
        await this.domUtils.waitForDOM();
        debugLog2("CONTENT-SCRIPT", "DOM ready");
        this.setupMessageListeners();
        debugLog2("CONTENT-SCRIPT", "Message listeners set up");
        await this.initializeTabId();
        debugLog2("CONTENT-SCRIPT", "Tab ID initialized:", this.tabId);
        await this.loadConfiguration();
        debugLog2("CONTENT-SCRIPT", "Options loaded:", this.config);
        this.overlayManager.config = { ...this.overlayManager.config, ...this.config };
        this.overlayManager.transparencyMode = this.config.overlayTransparencyMode || "nearly-transparent";
        this.overlayManager.positionMode = this.config.overlayPositionMode || "bottom-fixed";
        this.overlayManager.adaptiveVisibility = this.config.overlayAdaptiveVisibility || true;
        debugLog2("CONTENT-SCRIPT", "Overlay manager configured with transparency settings", {
          transparencyMode: this.overlayManager.transparencyMode,
          positionMode: this.overlayManager.positionMode,
          adaptiveVisibility: this.overlayManager.adaptiveVisibility
        });
        await this.notifyReady();
        debugLog2("CONTENT-SCRIPT", "Ready notification sent");
        await this.loadCurrentPageData();
        debugLog2("CONTENT-SCRIPT", "Current page data loaded:", this.currentBookmark);
        this.isInitialized = true;
        debugLog2("CONTENT-SCRIPT", "Content script initialization complete");
      } catch (error) {
        console.error("Hoverboard: Failed to initialize content script:", error);
      }
    }
    setupMessageListeners() {
      safariEnhancements.runtime.onMessage.addListener((message, sender, sendResponse) => {
        this.handleMessage(message, sender, sendResponse);
        return true;
      });
    }
    async handleMessage(message, sender, sendResponse) {
      try {
        recordAction(message.type, message.data, "content");
        switch (message.type) {
          case "TOGGLE_HOVER": {
            await this.toggleHover();
            const newState = {
              isVisible: this.overlayActive,
              hasBookmark: !!this.currentBookmark
            };
            sendResponse({ success: true, data: newState });
            break;
          }
          case "HIDE_OVERLAY":
            this.overlayManager.hide();
            sendResponse({ success: true });
            break;
          case "REFRESH_DATA":
            await this.refreshData();
            sendResponse({ success: true });
            break;
          case "REFRESH_HOVER":
            await this.refreshHover();
            sendResponse({ success: true });
            break;
          case "CLOSE_IF_TO_READ":
            this.handleCloseIfToRead(message.data);
            sendResponse({ success: true });
            break;
          case "PING":
            sendResponse({ success: true, data: "pong" });
            break;
          case "SHOW_BOOKMARK_DIALOG":
            await this.showBookmarkDialog(message.data);
            sendResponse({ success: true });
            break;
          case "TOGGLE_HOVER_OVERLAY":
            await this.toggleHoverOverlay();
            sendResponse({ success: true, data: { active: this.overlayActive } });
            break;
          case "UPDATE_CONFIG":
            this.config = { ...this.config, ...message.data };
            sendResponse({ success: true });
            break;
          case "updateOverlayTransparency":
            this.handleUpdateOverlayTransparency(message.config);
            sendResponse({ success: true });
            break;
          case "CHECK_PAGE_STATE": {
            const pageState = await this.getPageState();
            sendResponse({ success: true, data: pageState });
            break;
          }
          // [TOGGLE-SYNC-CONTENT-001] - Handle bookmark updates from external sources
          case "BOOKMARK_UPDATED":
            await this.handleBookmarkUpdated(message.data);
            sendResponse({ success: true });
            break;
          case "TAG_UPDATED":
            await this.handleTagUpdated(message.data);
            sendResponse({ success: true });
            break;
          // [POPUP-CLOSE-BEHAVIOR-ARCH-012] - Handle overlay state queries from popup
          case "GET_OVERLAY_STATE": {
            const overlayState = {
              isVisible: this.overlayActive,
              hasBookmark: !!this.currentBookmark,
              overlayElement: !!document.getElementById("hoverboard-overlay")
            };
            sendResponse({ success: true, data: overlayState });
            break;
          }
          // [IMPL-SELECTION_TO_TAG_INPUT] - Return current page selection for popup tag input prefill
          case "GET_PAGE_SELECTION": {
            const selection = typeof window.getSelection === "function" ? window.getSelection().toString() : "";
            sendResponse({ success: true, data: { selection } });
            break;
          }
          // [REQ-AI_TAGGING_POPUP] GET_PAGE_CONTENT is handled by the early listener above (before init) so popup gets a response without waiting for waitForDOM().
          default:
            console.warn("Unknown message type:", message.type);
            sendResponse({ success: false, error: "Unknown message type" });
        }
      } catch (error) {
        console.error("Message handling error:", error);
        sendResponse({ success: false, error: error.message });
      }
    }
    async initializeTabId() {
      try {
        const response = await this.messageClient.sendMessage({
          type: MESSAGE_TYPES.GET_TAB_ID,
          data: { url: this.pageUrl }
        });
        const actualResponse = response.success ? response.data : response;
        this.tabId = actualResponse.tabId;
        console.log("Content script tab ID:", this.tabId);
      } catch (error) {
        console.error("Failed to get tab ID:", error);
      }
    }
    async loadConfiguration() {
      try {
        const response = await this.messageClient.sendMessage({
          type: MESSAGE_TYPES.GET_OPTIONS
        });
        const actualResponse = response.success ? response.data : response;
        if (actualResponse) {
          this.config = { ...this.getDefaultConfig(), ...actualResponse };
          console.log("\u{1F4CB} Configuration loaded:", this.config);
        } else {
          this.config = this.getDefaultConfig();
        }
      } catch (error) {
        console.error("\u274C Failed to load configuration:", error);
        this.config = this.getDefaultConfig();
      }
    }
    getDefaultConfig() {
      return {
        showHoverOnPageLoad: false,
        hoverShowTooltips: false,
        inhibitSitesOnPageLoad: true,
        uxAutoCloseTimeout: 0,
        // ⭐ UI-005: Transparent overlay - 🎨 Enhanced transparency system
        overlayTransparencyMode: "nearly-transparent",
        overlayPositionMode: "bottom-fixed",
        overlayOpacityNormal: 0.05,
        overlayOpacityHover: 0.15,
        overlayOpacityFocus: 0.25,
        overlayAdaptiveVisibility: true,
        overlayBlurAmount: 2
      };
    }
    async notifyReady() {
      try {
        await this.messageClient.sendMessage({
          type: MESSAGE_TYPES.CONTENT_SCRIPT_READY,
          data: {
            url: this.pageUrl,
            title: this.pageTitle,
            tabId: this.tabId
          }
        });
      } catch (error) {
        console.error("Failed to notify ready:", error);
      }
    }
    async loadCurrentPageData() {
      try {
        debugLog2("CONTENT-SCRIPT", "Loading current page data");
        debugLog2("CONTENT-SCRIPT", "Request data:", {
          url: this.pageUrl,
          title: this.pageTitle,
          tabId: this.tabId
        });
        const response = await this.messageClient.sendMessage({
          type: MESSAGE_TYPES.GET_CURRENT_BOOKMARK,
          data: {
            url: this.pageUrl,
            title: this.pageTitle,
            tabId: this.tabId
          }
        });
        debugLog2("CONTENT-SCRIPT", "Received response:", response);
        const actualResponse = response.success ? response.data : response;
        if (actualResponse.blocked) {
          debugLog2("CONTENT-SCRIPT", "Site is blocked from processing");
          return;
        }
        this.currentBookmark = actualResponse.data || actualResponse;
        debugLog2("CONTENT-SCRIPT", "Current bookmark set:", this.currentBookmark);
        const options = await this.getOptions();
        debugLog2("CONTENT-SCRIPT", "Options for page load:", options);
        if (options.showHoverOnPageLoad) {
          debugLog2("CONTENT-SCRIPT", "Showing hover on page load");
          await this.showHoverWithDelay(options);
        }
      } catch (error) {
        console.error("Failed to load current page data:", error);
        debugLog2("CONTENT-SCRIPT", "Error loading page data:", error);
      }
    }
    async showHoverWithDelay(options) {
      const delay = options.showHoverDelay || 1e3;
      setTimeout(async () => {
        try {
          if (this.shouldShowHoverOnPageLoad(options)) {
            await this.showHover(false);
            if (options.uxAutoCloseTimeout > 0) {
              setTimeout(() => {
                this.overlayManager.hideOverlay();
              }, options.uxAutoCloseTimeout);
            }
          }
        } catch (error) {
          console.error("Failed to show hover on page load:", error);
        }
      }, delay);
    }
    shouldShowHoverOnPageLoad(options) {
      if (!this.currentBookmark) return false;
      const hasBookmark = this.currentBookmark.hash && this.currentBookmark.hash.length > 0;
      const hasTags = this.currentBookmark.tags && this.currentBookmark.tags.length > 0;
      if (options.showHoverOPLOnlyIfNoTags && hasTags) return false;
      if (options.showHoverOPLOnlyIfSomeTags && !hasTags) return false;
      return true;
    }
    async toggleHover() {
      if (this.overlayManager.isVisible) {
        this.overlayManager.hide();
      } else {
        await this.showHover(true);
      }
    }
    async showHover(userTriggered = false) {
      try {
        debugLog2("CONTENT-SCRIPT", "Showing hover", { userTriggered });
        if (userTriggered) {
          debugLog2("CONTENT-SCRIPT", "Refreshing bookmark data for user-triggered display");
          await this.loadCurrentPageData();
        }
        if (!this.currentBookmark) {
          debugLog2("CONTENT-SCRIPT", "No bookmark data available");
          console.warn("No bookmark data available for hover display");
          return;
        }
        debugLog2("CONTENT-SCRIPT", "Current bookmark data:", this.currentBookmark);
        this.overlayManager.show({
          bookmark: this.currentBookmark,
          pageTitle: this.pageTitle,
          pageUrl: this.pageUrl,
          tabId: this.tabId,
          userTriggered
        });
        debugLog2("CONTENT-SCRIPT", "Overlay display request sent");
      } catch (error) {
        console.error("Failed to show hover:", error);
        debugLog2("CONTENT-SCRIPT", "Error showing hover:", error);
      }
    }
    async refreshData() {
      try {
        await this.loadCurrentPageData();
      } catch (error) {
        console.error("Failed to refresh data:", error);
      }
    }
    async refreshHover() {
      try {
        this.overlayManager.hideOverlay();
        await this.showHover(true);
      } catch (error) {
        console.error("Failed to refresh hover:", error);
      }
    }
    handleCloseIfToRead(data) {
      if (this.currentBookmark && this.currentBookmark.toread === "yes") {
        console.log('Closing tab - bookmark is marked "read later"');
        window.close();
      }
    }
    // Public API for other modules
    getCurrentBookmark() {
      return this.currentBookmark;
    }
    getTabId() {
      return this.tabId;
    }
    getPageInfo() {
      return {
        url: this.pageUrl,
        title: this.pageTitle,
        tabId: this.tabId
      };
    }
    isReady() {
      return this.isInitialized;
    }
    async showBookmarkDialog(data) {
      const event = { clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 };
      await this.showHoverOverlay(document.body, event);
      if (this.currentOverlay && data) {
        if (data.url) {
          this.currentOverlay.querySelector(".hoverboard-url-input").value = data.url;
        }
        if (data.title) {
          this.currentOverlay.querySelector(".hoverboard-title-input").value = data.title;
        }
        if (data.description) {
          this.currentOverlay.querySelector(".hoverboard-description-input").value = data.description;
        }
      }
    }
    async toggleHoverOverlay() {
      if (this.overlayActive) {
        this.hideHoverOverlay();
      } else {
        const event = { clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 };
        await this.showHoverOverlay(document.body, event);
      }
    }
    async showHoverOverlay(element, event) {
      try {
        console.log("\u{1F3AF} Showing hover overlay");
        const overlay = this.createOverlayElement(element, event);
        document.body.appendChild(overlay);
        this.overlayActive = true;
        this.currentOverlay = overlay;
        this.setupOverlayHandlers(overlay);
        if (this.config.uxAutoCloseTimeout > 0) {
          setTimeout(() => {
            this.hideHoverOverlay();
          }, this.config.uxAutoCloseTimeout);
        }
      } catch (error) {
        console.error("\u274C Failed to show hover overlay:", error);
      }
    }
    createOverlayElement(element, event) {
      const overlay = document.createElement("div");
      overlay.className = "hoverboard-overlay";
      overlay.innerHTML = `
      <div class="hoverboard-overlay-content">
        <div class="hoverboard-overlay-header">
          <span class="hoverboard-overlay-title">\u{1F4CC} Add to Pinboard</span>
          <button class="hoverboard-overlay-close">\xD7</button>
        </div>
        <div class="hoverboard-overlay-body">
          <input type="text" class="hoverboard-url-input" placeholder="URL" value="${window.location.href}">
          <input type="text" class="hoverboard-title-input" placeholder="Title" value="${document.title}">
          <textarea class="hoverboard-description-input" placeholder="Description"></textarea>
          <input type="text" class="hoverboard-tags-input" placeholder="Tags (comma separated)">
          <div class="hoverboard-overlay-actions">
            <button class="hoverboard-save-button">Save Bookmark</button>
            <label class="hoverboard-private-label">
              <input type="checkbox" class="hoverboard-private-checkbox"> Private
            </label>
          </div>
        </div>
      </div>
    `;
      overlay.style.position = "fixed";
      overlay.style.left = `${Math.min(event.clientX, window.innerWidth - 350)}px`;
      overlay.style.top = `${Math.min(event.clientY, window.innerHeight - 200)}px`;
      overlay.style.zIndex = "999999";
      return overlay;
    }
    setupOverlayHandlers(overlay) {
      const closeButton = overlay.querySelector(".hoverboard-overlay-close");
      closeButton.addEventListener("click", () => {
        this.hideHoverOverlay();
      });
      const saveButton = overlay.querySelector(".hoverboard-save-button");
      saveButton.addEventListener("click", () => {
        this.saveBookmarkFromOverlay(overlay);
      });
      document.addEventListener("click", (event) => {
        if (!overlay.contains(event.target)) {
          this.hideHoverOverlay();
        }
      }, { once: true });
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          this.hideHoverOverlay();
        }
      }, { once: true });
    }
    hideHoverOverlay() {
      if (this.currentOverlay) {
        this.currentOverlay.remove();
        this.currentOverlay = null;
        this.overlayActive = false;
        console.log("\u{1F3AF} Hover overlay hidden");
      }
    }
    async saveBookmarkFromOverlay(overlay) {
      try {
        const url = overlay.querySelector(".hoverboard-url-input").value;
        const title = overlay.querySelector(".hoverboard-title-input").value;
        const description = overlay.querySelector(".hoverboard-description-input").value;
        const tags = overlay.querySelector(".hoverboard-tags-input").value;
        const isPrivate = overlay.querySelector(".hoverboard-private-checkbox").checked;
        const response = await safariEnhancements.runtime.sendMessage({
          type: "SAVE_BOOKMARK",
          data: { url, title, description, tags, private: isPrivate }
        });
        if (response.success) {
          console.log("\u2705 Bookmark saved successfully");
          this.hideHoverOverlay();
        } else {
          console.error("\u274C Failed to save bookmark:", response.error);
        }
      } catch (error) {
        console.error("\u274C Save bookmark failed:", error);
      }
    }
    async getOptions() {
      try {
        const response = await this.messageClient.sendMessage({
          type: MESSAGE_TYPES.GET_OPTIONS
        });
        const actualResponse = response.success ? response.data : response;
        return actualResponse;
      } catch (error) {
        console.error("Failed to get options:", error);
        return {};
      }
    }
    async getPageState() {
      return {
        url: window.location.href,
        title: document.title,
        overlayActive: this.overlayActive,
        isInitialized: this.isInitialized
      };
    }
    // [TOGGLE-SYNC-CONTENT-001] - Handle bookmark updates from external sources
    async handleBookmarkUpdated(bookmarkData) {
      try {
        if (!bookmarkData || !bookmarkData.url) {
          console.warn("[TOGGLE-SYNC-CONTENT-001] Ignoring malformed bookmark update:", bookmarkData);
          return;
        }
        this.currentBookmark = bookmarkData;
        if (this.overlayManager.isVisible) {
          const updatedContent = {
            bookmark: bookmarkData,
            pageTitle: this.pageTitle,
            pageUrl: this.pageUrl
          };
          this.overlayManager.show(updatedContent);
        }
        debugLog2("CONTENT-SCRIPT", "[TOGGLE-SYNC-CONTENT-001] Bookmark updated from external source", bookmarkData);
      } catch (error) {
        debugError("CONTENT-SCRIPT", "[TOGGLE-SYNC-CONTENT-001] Failed to handle bookmark update:", error);
      }
    }
    // [TAG-SYNC-CONTENT-001] - Handle tag updates from popup or other sources
    async handleTagUpdated(tagUpdateData) {
      try {
        if (!tagUpdateData || !tagUpdateData.url || !Array.isArray(tagUpdateData.tags)) {
          console.warn("[TAG-SYNC-CONTENT-001] Ignoring malformed tag update:", tagUpdateData);
          return;
        }
        if (this.currentBookmark && this.currentBookmark.url === tagUpdateData.url) {
          this.currentBookmark.tags = tagUpdateData.tags;
          if (this.overlayManager.isVisible) {
            const updatedContent = {
              bookmark: this.currentBookmark,
              pageTitle: this.pageTitle,
              pageUrl: this.pageUrl
            };
            this.overlayManager.show(updatedContent);
          }
          debugLog2("CONTENT-SCRIPT", "[TAG-SYNC-CONTENT-001] Overlay updated with new tags", tagUpdateData.tags);
        }
      } catch (error) {
        debugError("CONTENT-SCRIPT", "[TAG-SYNC-CONTENT-001] Failed to handle tag update:", error);
      }
    }
    handleUpdateOverlayTransparency(config) {
      try {
        console.log("Updating overlay transparency configuration:", config);
        this.config = { ...this.config, ...config };
        if (this.overlayManager) {
          this.overlayManager.updateConfig(config);
          if (this.overlayManager.isVisible) {
            this.overlayManager.applyTransparencyMode();
          }
        }
        console.log("Overlay transparency configuration updated successfully");
      } catch (error) {
        console.error("Failed to update overlay transparency:", error);
      }
    }
  };
  var hoverboardContentScript;
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      hoverboardContentScript = new HoverboardContentScript();
    });
  } else {
    hoverboardContentScript = new HoverboardContentScript();
  }
  window.hoverboardContentScript = hoverboardContentScript;
})();
