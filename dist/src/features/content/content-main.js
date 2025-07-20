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
        // LOG-002: Environment-based log level determination
        // SPECIFICATION: Production builds should minimize console output for performance
        // IMPLEMENTATION DECISION: Debug logs in development, warnings+ in production
        getLogLevel() {
          if (typeof process === "undefined" || !process.env) {
            return "debug";
          }
          return false ? "warn" : "debug";
        }
        // LOG-001: Log level filtering logic
        // IMPLEMENTATION DECISION: Numeric level comparison for efficient filtering
        shouldLog(level) {
          const levels = { debug: 0, info: 1, warn: 2, error: 3 };
          return levels[level] >= levels[this.logLevel];
        }
        // LOG-001: Consistent message formatting with metadata
        // SPECIFICATION: Include timestamp, context, and level for log analysis
        // IMPLEMENTATION DECISION: ISO timestamp format for precise timing and parsing
        formatMessage(level, message, ...args) {
          const timestamp = (/* @__PURE__ */ new Date()).toISOString();
          const prefix = `[${timestamp}] [${this.context}] [${level.toUpperCase()}]`;
          return [prefix, message, ...args];
        }
        // LOG-001: Debug level logging - Development information
        // IMPLEMENTATION DECISION: Use console.log for debug to distinguish from info
        debug(message, ...args) {
          if (this.shouldLog("debug")) {
            console.log(...this.formatMessage("debug", message, ...args));
          }
        }
        // LOG-001: Info level logging - General information
        // IMPLEMENTATION DECISION: Use console.info for semantic clarity
        info(message, ...args) {
          if (this.shouldLog("info")) {
            console.info(...this.formatMessage("info", message, ...args));
          }
        }
        // LOG-001: Warning level logging - Non-critical issues
        // IMPLEMENTATION DECISION: Use console.warn for proper browser developer tools integration
        warn(message, ...args) {
          if (this.shouldLog("warn")) {
            console.warn(...this.formatMessage("warn", message, ...args));
          }
        }
        // LOG-001: Error level logging - Critical issues
        // IMPLEMENTATION DECISION: Use console.error for proper error tracking and debugging
        error(message, ...args) {
          if (this.shouldLog("error")) {
            console.error(...this.formatMessage("error", message, ...args));
          }
        }
        // LOG-003: Legacy compatibility methods
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
                  version: browser.runtime.getManifest?.()?.version || "1.0.0"
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
  var init_config_manager = __esm({
    "src/config/config-manager.js"() {
    }
  });

  // src/features/tagging/tag-service.js
  var init_tag_service = __esm({
    "src/features/tagging/tag-service.js"() {
      init_config_manager();
      init_utils();
      debugLog2("[SAFARI-EXT-SHIM-001] tag-service.js: module loaded");
    }
  });

  // node_modules/fast-xml-parser/src/util.js
  var require_util = __commonJS({
    "node_modules/fast-xml-parser/src/util.js"(exports) {
      "use strict";
      var nameStartChar = ":A-Za-z_\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD";
      var nameChar = nameStartChar + "\\-.\\d\\u00B7\\u0300-\\u036F\\u203F-\\u2040";
      var nameRegexp = "[" + nameStartChar + "][" + nameChar + "]*";
      var regexName = new RegExp("^" + nameRegexp + "$");
      var getAllMatches = function(string, regex) {
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
      };
      var isName = function(string) {
        const match = regexName.exec(string);
        return !(match === null || typeof match === "undefined");
      };
      exports.isExist = function(v) {
        return typeof v !== "undefined";
      };
      exports.isEmptyObject = function(obj) {
        return Object.keys(obj).length === 0;
      };
      exports.merge = function(target, a, arrayMode) {
        if (a) {
          const keys = Object.keys(a);
          const len = keys.length;
          for (let i = 0; i < len; i++) {
            if (arrayMode === "strict") {
              target[keys[i]] = [a[keys[i]]];
            } else {
              target[keys[i]] = a[keys[i]];
            }
          }
        }
      };
      exports.getValue = function(v) {
        if (exports.isExist(v)) {
          return v;
        } else {
          return "";
        }
      };
      exports.isName = isName;
      exports.getAllMatches = getAllMatches;
      exports.nameRegexp = nameRegexp;
    }
  });

  // node_modules/fast-xml-parser/src/validator.js
  var require_validator = __commonJS({
    "node_modules/fast-xml-parser/src/validator.js"(exports) {
      "use strict";
      var util = require_util();
      var defaultOptions = {
        allowBooleanAttributes: false,
        //A tag can have attributes without any value
        unpairedTags: []
      };
      exports.validate = function(xmlData, options) {
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
      };
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
      var doubleQuote = '"';
      var singleQuote = "'";
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
      var validAttrStrRegxp = new RegExp(`(\\s*)([^\\s=]+)(\\s*=)?(\\s*(['"])(([\\s\\S])*?)\\5)?`, "g");
      function validateAttributeString(attrStr, options) {
        const matches = util.getAllMatches(attrStr, validAttrStrRegxp);
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
        return util.isName(attrName);
      }
      function validateTagName(tagname) {
        return util.isName(tagname);
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
    }
  });

  // node_modules/fast-xml-parser/src/xmlparser/OptionsBuilder.js
  var require_OptionsBuilder = __commonJS({
    "node_modules/fast-xml-parser/src/xmlparser/OptionsBuilder.js"(exports) {
      var defaultOptions = {
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
        }
        // skipEmptyListItem: false
      };
      var buildOptions = function(options) {
        return Object.assign({}, defaultOptions, options);
      };
      exports.buildOptions = buildOptions;
      exports.defaultOptions = defaultOptions;
    }
  });

  // node_modules/fast-xml-parser/src/xmlparser/xmlNode.js
  var require_xmlNode = __commonJS({
    "node_modules/fast-xml-parser/src/xmlparser/xmlNode.js"(exports, module) {
      "use strict";
      var XmlNode = class {
        constructor(tagname) {
          this.tagname = tagname;
          this.child = [];
          this[":@"] = {};
        }
        add(key, val) {
          if (key === "__proto__") key = "#__proto__";
          this.child.push({ [key]: val });
        }
        addChild(node) {
          if (node.tagname === "__proto__") node.tagname = "#__proto__";
          if (node[":@"] && Object.keys(node[":@"]).length > 0) {
            this.child.push({ [node.tagname]: node.child, [":@"]: node[":@"] });
          } else {
            this.child.push({ [node.tagname]: node.child });
          }
        }
      };
      module.exports = XmlNode;
    }
  });

  // node_modules/fast-xml-parser/src/xmlparser/DocTypeReader.js
  var require_DocTypeReader = __commonJS({
    "node_modules/fast-xml-parser/src/xmlparser/DocTypeReader.js"(exports, module) {
      var util = require_util();
      function readDocType(xmlData, i) {
        const entities = {};
        if (xmlData[i + 3] === "O" && xmlData[i + 4] === "C" && xmlData[i + 5] === "T" && xmlData[i + 6] === "Y" && xmlData[i + 7] === "P" && xmlData[i + 8] === "E") {
          i = i + 9;
          let angleBracketsCount = 1;
          let hasBody = false, comment = false;
          let exp = "";
          for (; i < xmlData.length; i++) {
            if (xmlData[i] === "<" && !comment) {
              if (hasBody && isEntity(xmlData, i)) {
                i += 7;
                let entityName, val;
                [entityName, val, i] = readEntityExp(xmlData, i + 1);
                if (val.indexOf("&") === -1)
                  entities[validateEntityName(entityName)] = {
                    regx: RegExp(`&${entityName};`, "g"),
                    val
                  };
              } else if (hasBody && isElement(xmlData, i)) i += 8;
              else if (hasBody && isAttlist(xmlData, i)) i += 8;
              else if (hasBody && isNotation(xmlData, i)) i += 9;
              else if (isComment) comment = true;
              else throw new Error("Invalid DOCTYPE");
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
      function readEntityExp(xmlData, i) {
        let entityName = "";
        for (; i < xmlData.length && (xmlData[i] !== "'" && xmlData[i] !== '"'); i++) {
          entityName += xmlData[i];
        }
        entityName = entityName.trim();
        if (entityName.indexOf(" ") !== -1) throw new Error("External entites are not supported");
        const startChar = xmlData[i++];
        let val = "";
        for (; i < xmlData.length && xmlData[i] !== startChar; i++) {
          val += xmlData[i];
        }
        return [entityName, val, i];
      }
      function isComment(xmlData, i) {
        if (xmlData[i + 1] === "!" && xmlData[i + 2] === "-" && xmlData[i + 3] === "-") return true;
        return false;
      }
      function isEntity(xmlData, i) {
        if (xmlData[i + 1] === "!" && xmlData[i + 2] === "E" && xmlData[i + 3] === "N" && xmlData[i + 4] === "T" && xmlData[i + 5] === "I" && xmlData[i + 6] === "T" && xmlData[i + 7] === "Y") return true;
        return false;
      }
      function isElement(xmlData, i) {
        if (xmlData[i + 1] === "!" && xmlData[i + 2] === "E" && xmlData[i + 3] === "L" && xmlData[i + 4] === "E" && xmlData[i + 5] === "M" && xmlData[i + 6] === "E" && xmlData[i + 7] === "N" && xmlData[i + 8] === "T") return true;
        return false;
      }
      function isAttlist(xmlData, i) {
        if (xmlData[i + 1] === "!" && xmlData[i + 2] === "A" && xmlData[i + 3] === "T" && xmlData[i + 4] === "T" && xmlData[i + 5] === "L" && xmlData[i + 6] === "I" && xmlData[i + 7] === "S" && xmlData[i + 8] === "T") return true;
        return false;
      }
      function isNotation(xmlData, i) {
        if (xmlData[i + 1] === "!" && xmlData[i + 2] === "N" && xmlData[i + 3] === "O" && xmlData[i + 4] === "T" && xmlData[i + 5] === "A" && xmlData[i + 6] === "T" && xmlData[i + 7] === "I" && xmlData[i + 8] === "O" && xmlData[i + 9] === "N") return true;
        return false;
      }
      function validateEntityName(name) {
        if (util.isName(name))
          return name;
        else
          throw new Error(`Invalid entity name ${name}`);
      }
      module.exports = readDocType;
    }
  });

  // node_modules/strnum/strnum.js
  var require_strnum = __commonJS({
    "node_modules/strnum/strnum.js"(exports, module) {
      var hexRegex = /^[-+]?0x[a-fA-F0-9]+$/;
      var numRegex = /^([\-\+])?(0*)([0-9]*(\.[0-9]*)?)$/;
      var consider = {
        hex: true,
        // oct: false,
        leadingZeros: true,
        decimalPoint: ".",
        eNotation: true
        //skipLike: /regex/
      };
      function toNumber(str, options = {}) {
        options = Object.assign({}, consider, options);
        if (!str || typeof str !== "string") return str;
        let trimmedStr = str.trim();
        if (options.skipLike !== void 0 && options.skipLike.test(trimmedStr)) return str;
        else if (str === "0") return 0;
        else if (options.hex && hexRegex.test(trimmedStr)) {
          return parse_int(trimmedStr, 16);
        } else if (trimmedStr.search(/[eE]/) !== -1) {
          const notation = trimmedStr.match(/^([-\+])?(0*)([0-9]*(\.[0-9]*)?[eE][-\+]?[0-9]+)$/);
          if (notation) {
            if (options.leadingZeros) {
              trimmedStr = (notation[1] || "") + notation[3];
            } else {
              if (notation[2] === "0" && notation[3][0] === ".") {
              } else {
                return str;
              }
            }
            return options.eNotation ? Number(trimmedStr) : str;
          } else {
            return str;
          }
        } else {
          const match = numRegex.exec(trimmedStr);
          if (match) {
            const sign = match[1];
            const leadingZeros = match[2];
            let numTrimmedByZeros = trimZeros(match[3]);
            if (!options.leadingZeros && leadingZeros.length > 0 && sign && trimmedStr[2] !== ".") return str;
            else if (!options.leadingZeros && leadingZeros.length > 0 && !sign && trimmedStr[1] !== ".") return str;
            else if (options.leadingZeros && leadingZeros === str) return 0;
            else {
              const num = Number(trimmedStr);
              const numStr = "" + num;
              if (numStr.search(/[eE]/) !== -1) {
                if (options.eNotation) return num;
                else return str;
              } else if (trimmedStr.indexOf(".") !== -1) {
                if (numStr === "0" && numTrimmedByZeros === "") return num;
                else if (numStr === numTrimmedByZeros) return num;
                else if (sign && numStr === "-" + numTrimmedByZeros) return num;
                else return str;
              }
              if (leadingZeros) {
                return numTrimmedByZeros === numStr || sign + numTrimmedByZeros === numStr ? num : str;
              } else {
                return trimmedStr === numStr || trimmedStr === sign + numStr ? num : str;
              }
            }
          } else {
            return str;
          }
        }
      }
      function trimZeros(numStr) {
        if (numStr && numStr.indexOf(".") !== -1) {
          numStr = numStr.replace(/0+$/, "");
          if (numStr === ".") numStr = "0";
          else if (numStr[0] === ".") numStr = "0" + numStr;
          else if (numStr[numStr.length - 1] === ".") numStr = numStr.substr(0, numStr.length - 1);
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
      module.exports = toNumber;
    }
  });

  // node_modules/fast-xml-parser/src/ignoreAttributes.js
  var require_ignoreAttributes = __commonJS({
    "node_modules/fast-xml-parser/src/ignoreAttributes.js"(exports, module) {
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
      module.exports = getIgnoreAttributesFn;
    }
  });

  // node_modules/fast-xml-parser/src/xmlparser/OrderedObjParser.js
  var require_OrderedObjParser = __commonJS({
    "node_modules/fast-xml-parser/src/xmlparser/OrderedObjParser.js"(exports, module) {
      "use strict";
      var util = require_util();
      var xmlNode = require_xmlNode();
      var readDocType = require_DocTypeReader();
      var toNumber = require_strnum();
      var getIgnoreAttributesFn = require_ignoreAttributes();
      var OrderedObjParser = class {
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
            "num_dec": { regex: /&#([0-9]{1,7});/g, val: (_, str) => String.fromCharCode(Number.parseInt(str, 10)) },
            "num_hex": { regex: /&#x([0-9a-fA-F]{1,6});/g, val: (_, str) => String.fromCharCode(Number.parseInt(str, 16)) }
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
        }
      };
      function addExternalEntities(externalEntities) {
        const entKeys = Object.keys(externalEntities);
        for (let i = 0; i < entKeys.length; i++) {
          const ent = entKeys[i];
          this.lastEntities[ent] = {
            regex: new RegExp("&" + ent + ";", "g"),
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
            if (!escapeEntities) val = this.replaceEntitiesValue(val);
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
      var attrsRegx = new RegExp(`([^\\s=]+)\\s*(=\\s*(['"])([\\s\\S]*?)\\3)?`, "gm");
      function buildAttributesMap(attrStr, jPath, tagName) {
        if (this.options.ignoreAttributes !== true && typeof attrStr === "string") {
          const matches = util.getAllMatches(attrStr, attrsRegx);
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
                oldVal = this.replaceEntitiesValue(oldVal);
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
      var parseXml = function(xmlData) {
        xmlData = xmlData.replace(/\r\n?/g, "\n");
        const xmlObj = new xmlNode("!xml");
        let currentNode = xmlObj;
        let textData = "";
        let jPath = "";
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
                const childNode = new xmlNode(tagData.tagName);
                childNode.add(this.options.textNodeName, "");
                if (tagData.tagName !== tagData.tagExp && tagData.attrExpPresent) {
                  childNode[":@"] = this.buildAttributesMap(tagData.tagExp, jPath, tagData.tagName);
                }
                this.addChild(currentNode, childNode, jPath);
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
              const result = readDocType(xmlData, i);
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
                tagName = this.options.transformTagName(tagName);
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
              if (this.isItStopNode(this.options.stopNodes, jPath, tagName)) {
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
                const childNode = new xmlNode(tagName);
                if (tagName !== tagExp && attrExpPresent) {
                  childNode[":@"] = this.buildAttributesMap(tagExp, jPath, tagName);
                }
                if (tagContent) {
                  tagContent = this.parseTextData(tagContent, tagName, jPath, true, attrExpPresent, true, true);
                }
                jPath = jPath.substr(0, jPath.lastIndexOf("."));
                childNode.add(this.options.textNodeName, tagContent);
                this.addChild(currentNode, childNode, jPath);
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
                    tagName = this.options.transformTagName(tagName);
                  }
                  const childNode = new xmlNode(tagName);
                  if (tagName !== tagExp && attrExpPresent) {
                    childNode[":@"] = this.buildAttributesMap(tagExp, jPath, tagName);
                  }
                  this.addChild(currentNode, childNode, jPath);
                  jPath = jPath.substr(0, jPath.lastIndexOf("."));
                } else {
                  const childNode = new xmlNode(tagName);
                  this.tagsNodeStack.push(currentNode);
                  if (tagName !== tagExp && attrExpPresent) {
                    childNode[":@"] = this.buildAttributesMap(tagExp, jPath, tagName);
                  }
                  this.addChild(currentNode, childNode, jPath);
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
      function addChild(currentNode, childNode, jPath) {
        const result = this.options.updateTag(childNode.tagname, jPath, childNode[":@"]);
        if (result === false) {
        } else if (typeof result === "string") {
          childNode.tagname = result;
          currentNode.addChild(childNode);
        } else {
          currentNode.addChild(childNode);
        }
      }
      var replaceEntitiesValue = function(val) {
        if (this.options.processEntities) {
          for (let entityName in this.docTypeEntities) {
            const entity = this.docTypeEntities[entityName];
            val = val.replace(entity.regx, entity.val);
          }
          for (let entityName in this.lastEntities) {
            const entity = this.lastEntities[entityName];
            val = val.replace(entity.regex, entity.val);
          }
          if (this.options.htmlEntities) {
            for (let entityName in this.htmlEntities) {
              const entity = this.htmlEntities[entityName];
              val = val.replace(entity.regex, entity.val);
            }
          }
          val = val.replace(this.ampEntity.regex, this.ampEntity.val);
        }
        return val;
      };
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
      function isItStopNode(stopNodes, jPath, currentTagName) {
        const allNodesExp = "*." + currentTagName;
        for (const stopNodePath in stopNodes) {
          const stopNodeExp = stopNodes[stopNodePath];
          if (allNodesExp === stopNodeExp || jPath === stopNodeExp) return true;
        }
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
          if (util.isExist(val)) {
            return val;
          } else {
            return "";
          }
        }
      }
      module.exports = OrderedObjParser;
    }
  });

  // node_modules/fast-xml-parser/src/xmlparser/node2json.js
  var require_node2json = __commonJS({
    "node_modules/fast-xml-parser/src/xmlparser/node2json.js"(exports) {
      "use strict";
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
      exports.prettify = prettify;
    }
  });

  // node_modules/fast-xml-parser/src/xmlparser/XMLParser.js
  var require_XMLParser = __commonJS({
    "node_modules/fast-xml-parser/src/xmlparser/XMLParser.js"(exports, module) {
      var { buildOptions } = require_OptionsBuilder();
      var OrderedObjParser = require_OrderedObjParser();
      var { prettify } = require_node2json();
      var validator = require_validator();
      var XMLParser2 = class {
        constructor(options) {
          this.externalEntities = {};
          this.options = buildOptions(options);
        }
        /**
         * Parse XML dats to JS object 
         * @param {string|Buffer} xmlData 
         * @param {boolean|Object} validationOption 
         */
        parse(xmlData, validationOption) {
          if (typeof xmlData === "string") {
          } else if (xmlData.toString) {
            xmlData = xmlData.toString();
          } else {
            throw new Error("XML data is accepted in String or Bytes[] form.");
          }
          if (validationOption) {
            if (validationOption === true) validationOption = {};
            const result = validator.validate(xmlData, validationOption);
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
      };
      module.exports = XMLParser2;
    }
  });

  // node_modules/fast-xml-parser/src/xmlbuilder/orderedJs2Xml.js
  var require_orderedJs2Xml = __commonJS({
    "node_modules/fast-xml-parser/src/xmlbuilder/orderedJs2Xml.js"(exports, module) {
      var EOL = "\n";
      function toXml(jArray, options) {
        let indentation = "";
        if (options.format && options.indentBy.length > 0) {
          indentation = EOL;
        }
        return arrToStr(jArray, options, "", indentation);
      }
      function arrToStr(arr, options, jPath, indentation) {
        let xmlStr = "";
        let isPreviousElementTag = false;
        for (let i = 0; i < arr.length; i++) {
          const tagObj = arr[i];
          const tagName = propName(tagObj);
          if (tagName === void 0) continue;
          let newJPath = "";
          if (jPath.length === 0) newJPath = tagName;
          else newJPath = `${jPath}.${tagName}`;
          if (tagName === options.textNodeName) {
            let tagText = tagObj[tagName];
            if (!isStopNode(newJPath, options)) {
              tagText = options.tagValueProcessor(tagName, tagText);
              tagText = replaceEntitiesValue(tagText, options);
            }
            if (isPreviousElementTag) {
              xmlStr += indentation;
            }
            xmlStr += tagText;
            isPreviousElementTag = false;
            continue;
          } else if (tagName === options.cdataPropName) {
            if (isPreviousElementTag) {
              xmlStr += indentation;
            }
            xmlStr += `<![CDATA[${tagObj[tagName][0][options.textNodeName]}]]>`;
            isPreviousElementTag = false;
            continue;
          } else if (tagName === options.commentPropName) {
            xmlStr += indentation + `<!--${tagObj[tagName][0][options.textNodeName]}-->`;
            isPreviousElementTag = true;
            continue;
          } else if (tagName[0] === "?") {
            const attStr2 = attr_to_str(tagObj[":@"], options);
            const tempInd = tagName === "?xml" ? "" : indentation;
            let piTextNodeName = tagObj[tagName][0][options.textNodeName];
            piTextNodeName = piTextNodeName.length !== 0 ? " " + piTextNodeName : "";
            xmlStr += tempInd + `<${tagName}${piTextNodeName}${attStr2}?>`;
            isPreviousElementTag = true;
            continue;
          }
          let newIdentation = indentation;
          if (newIdentation !== "") {
            newIdentation += options.indentBy;
          }
          const attStr = attr_to_str(tagObj[":@"], options);
          const tagStart = indentation + `<${tagName}${attStr}`;
          const tagValue = arrToStr(tagObj[tagName], options, newJPath, newIdentation);
          if (options.unpairedTags.indexOf(tagName) !== -1) {
            if (options.suppressUnpairedNode) xmlStr += tagStart + ">";
            else xmlStr += tagStart + "/>";
          } else if ((!tagValue || tagValue.length === 0) && options.suppressEmptyNode) {
            xmlStr += tagStart + "/>";
          } else if (tagValue && tagValue.endsWith(">")) {
            xmlStr += tagStart + `>${tagValue}${indentation}</${tagName}>`;
          } else {
            xmlStr += tagStart + ">";
            if (tagValue && indentation !== "" && (tagValue.includes("/>") || tagValue.includes("</"))) {
              xmlStr += indentation + options.indentBy + tagValue + indentation;
            } else {
              xmlStr += tagValue;
            }
            xmlStr += `</${tagName}>`;
          }
          isPreviousElementTag = true;
        }
        return xmlStr;
      }
      function propName(obj) {
        const keys = Object.keys(obj);
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          if (!obj.hasOwnProperty(key)) continue;
          if (key !== ":@") return key;
        }
      }
      function attr_to_str(attrMap, options) {
        let attrStr = "";
        if (attrMap && !options.ignoreAttributes) {
          for (let attr in attrMap) {
            if (!attrMap.hasOwnProperty(attr)) continue;
            let attrVal = options.attributeValueProcessor(attr, attrMap[attr]);
            attrVal = replaceEntitiesValue(attrVal, options);
            if (attrVal === true && options.suppressBooleanAttributes) {
              attrStr += ` ${attr.substr(options.attributeNamePrefix.length)}`;
            } else {
              attrStr += ` ${attr.substr(options.attributeNamePrefix.length)}="${attrVal}"`;
            }
          }
        }
        return attrStr;
      }
      function isStopNode(jPath, options) {
        jPath = jPath.substr(0, jPath.length - options.textNodeName.length - 1);
        let tagName = jPath.substr(jPath.lastIndexOf(".") + 1);
        for (let index in options.stopNodes) {
          if (options.stopNodes[index] === jPath || options.stopNodes[index] === "*." + tagName) return true;
        }
        return false;
      }
      function replaceEntitiesValue(textValue, options) {
        if (textValue && textValue.length > 0 && options.processEntities) {
          for (let i = 0; i < options.entities.length; i++) {
            const entity = options.entities[i];
            textValue = textValue.replace(entity.regex, entity.val);
          }
        }
        return textValue;
      }
      module.exports = toXml;
    }
  });

  // node_modules/fast-xml-parser/src/xmlbuilder/json2xml.js
  var require_json2xml = __commonJS({
    "node_modules/fast-xml-parser/src/xmlbuilder/json2xml.js"(exports, module) {
      "use strict";
      var buildFromOrderedJs = require_orderedJs2Xml();
      var getIgnoreAttributesFn = require_ignoreAttributes();
      var defaultOptions = {
        attributeNamePrefix: "@_",
        attributesGroupName: false,
        textNodeName: "#text",
        ignoreAttributes: true,
        cdataPropName: false,
        format: false,
        indentBy: "  ",
        suppressEmptyNode: false,
        suppressUnpairedNode: true,
        suppressBooleanAttributes: true,
        tagValueProcessor: function(key, a) {
          return a;
        },
        attributeValueProcessor: function(attrName, a) {
          return a;
        },
        preserveOrder: false,
        commentPropName: false,
        unpairedTags: [],
        entities: [
          { regex: new RegExp("&", "g"), val: "&amp;" },
          //it must be on top
          { regex: new RegExp(">", "g"), val: "&gt;" },
          { regex: new RegExp("<", "g"), val: "&lt;" },
          { regex: new RegExp("'", "g"), val: "&apos;" },
          { regex: new RegExp('"', "g"), val: "&quot;" }
        ],
        processEntities: true,
        stopNodes: [],
        // transformTagName: false,
        // transformAttributeName: false,
        oneListGroup: false
      };
      function Builder(options) {
        this.options = Object.assign({}, defaultOptions, options);
        if (this.options.ignoreAttributes === true || this.options.attributesGroupName) {
          this.isAttribute = function() {
            return false;
          };
        } else {
          this.ignoreAttributesFn = getIgnoreAttributesFn(this.options.ignoreAttributes);
          this.attrPrefixLen = this.options.attributeNamePrefix.length;
          this.isAttribute = isAttribute;
        }
        this.processTextOrObjNode = processTextOrObjNode;
        if (this.options.format) {
          this.indentate = indentate;
          this.tagEndChar = ">\n";
          this.newLine = "\n";
        } else {
          this.indentate = function() {
            return "";
          };
          this.tagEndChar = ">";
          this.newLine = "";
        }
      }
      Builder.prototype.build = function(jObj) {
        if (this.options.preserveOrder) {
          return buildFromOrderedJs(jObj, this.options);
        } else {
          if (Array.isArray(jObj) && this.options.arrayNodeName && this.options.arrayNodeName.length > 1) {
            jObj = {
              [this.options.arrayNodeName]: jObj
            };
          }
          return this.j2x(jObj, 0, []).val;
        }
      };
      Builder.prototype.j2x = function(jObj, level, ajPath) {
        let attrStr = "";
        let val = "";
        const jPath = ajPath.join(".");
        for (let key in jObj) {
          if (!Object.prototype.hasOwnProperty.call(jObj, key)) continue;
          if (typeof jObj[key] === "undefined") {
            if (this.isAttribute(key)) {
              val += "";
            }
          } else if (jObj[key] === null) {
            if (this.isAttribute(key)) {
              val += "";
            } else if (key === this.options.cdataPropName) {
              val += "";
            } else if (key[0] === "?") {
              val += this.indentate(level) + "<" + key + "?" + this.tagEndChar;
            } else {
              val += this.indentate(level) + "<" + key + "/" + this.tagEndChar;
            }
          } else if (jObj[key] instanceof Date) {
            val += this.buildTextValNode(jObj[key], key, "", level);
          } else if (typeof jObj[key] !== "object") {
            const attr = this.isAttribute(key);
            if (attr && !this.ignoreAttributesFn(attr, jPath)) {
              attrStr += this.buildAttrPairStr(attr, "" + jObj[key]);
            } else if (!attr) {
              if (key === this.options.textNodeName) {
                let newval = this.options.tagValueProcessor(key, "" + jObj[key]);
                val += this.replaceEntitiesValue(newval);
              } else {
                val += this.buildTextValNode(jObj[key], key, "", level);
              }
            }
          } else if (Array.isArray(jObj[key])) {
            const arrLen = jObj[key].length;
            let listTagVal = "";
            let listTagAttr = "";
            for (let j = 0; j < arrLen; j++) {
              const item = jObj[key][j];
              if (typeof item === "undefined") {
              } else if (item === null) {
                if (key[0] === "?") val += this.indentate(level) + "<" + key + "?" + this.tagEndChar;
                else val += this.indentate(level) + "<" + key + "/" + this.tagEndChar;
              } else if (typeof item === "object") {
                if (this.options.oneListGroup) {
                  const result = this.j2x(item, level + 1, ajPath.concat(key));
                  listTagVal += result.val;
                  if (this.options.attributesGroupName && item.hasOwnProperty(this.options.attributesGroupName)) {
                    listTagAttr += result.attrStr;
                  }
                } else {
                  listTagVal += this.processTextOrObjNode(item, key, level, ajPath);
                }
              } else {
                if (this.options.oneListGroup) {
                  let textValue = this.options.tagValueProcessor(key, item);
                  textValue = this.replaceEntitiesValue(textValue);
                  listTagVal += textValue;
                } else {
                  listTagVal += this.buildTextValNode(item, key, "", level);
                }
              }
            }
            if (this.options.oneListGroup) {
              listTagVal = this.buildObjectNode(listTagVal, key, listTagAttr, level);
            }
            val += listTagVal;
          } else {
            if (this.options.attributesGroupName && key === this.options.attributesGroupName) {
              const Ks = Object.keys(jObj[key]);
              const L = Ks.length;
              for (let j = 0; j < L; j++) {
                attrStr += this.buildAttrPairStr(Ks[j], "" + jObj[key][Ks[j]]);
              }
            } else {
              val += this.processTextOrObjNode(jObj[key], key, level, ajPath);
            }
          }
        }
        return { attrStr, val };
      };
      Builder.prototype.buildAttrPairStr = function(attrName, val) {
        val = this.options.attributeValueProcessor(attrName, "" + val);
        val = this.replaceEntitiesValue(val);
        if (this.options.suppressBooleanAttributes && val === "true") {
          return " " + attrName;
        } else return " " + attrName + '="' + val + '"';
      };
      function processTextOrObjNode(object, key, level, ajPath) {
        const result = this.j2x(object, level + 1, ajPath.concat(key));
        if (object[this.options.textNodeName] !== void 0 && Object.keys(object).length === 1) {
          return this.buildTextValNode(object[this.options.textNodeName], key, result.attrStr, level);
        } else {
          return this.buildObjectNode(result.val, key, result.attrStr, level);
        }
      }
      Builder.prototype.buildObjectNode = function(val, key, attrStr, level) {
        if (val === "") {
          if (key[0] === "?") return this.indentate(level) + "<" + key + attrStr + "?" + this.tagEndChar;
          else {
            return this.indentate(level) + "<" + key + attrStr + this.closeTag(key) + this.tagEndChar;
          }
        } else {
          let tagEndExp = "</" + key + this.tagEndChar;
          let piClosingChar = "";
          if (key[0] === "?") {
            piClosingChar = "?";
            tagEndExp = "";
          }
          if ((attrStr || attrStr === "") && val.indexOf("<") === -1) {
            return this.indentate(level) + "<" + key + attrStr + piClosingChar + ">" + val + tagEndExp;
          } else if (this.options.commentPropName !== false && key === this.options.commentPropName && piClosingChar.length === 0) {
            return this.indentate(level) + `<!--${val}-->` + this.newLine;
          } else {
            return this.indentate(level) + "<" + key + attrStr + piClosingChar + this.tagEndChar + val + this.indentate(level) + tagEndExp;
          }
        }
      };
      Builder.prototype.closeTag = function(key) {
        let closeTag = "";
        if (this.options.unpairedTags.indexOf(key) !== -1) {
          if (!this.options.suppressUnpairedNode) closeTag = "/";
        } else if (this.options.suppressEmptyNode) {
          closeTag = "/";
        } else {
          closeTag = `></${key}`;
        }
        return closeTag;
      };
      Builder.prototype.buildTextValNode = function(val, key, attrStr, level) {
        if (this.options.cdataPropName !== false && key === this.options.cdataPropName) {
          return this.indentate(level) + `<![CDATA[${val}]]>` + this.newLine;
        } else if (this.options.commentPropName !== false && key === this.options.commentPropName) {
          return this.indentate(level) + `<!--${val}-->` + this.newLine;
        } else if (key[0] === "?") {
          return this.indentate(level) + "<" + key + attrStr + "?" + this.tagEndChar;
        } else {
          let textValue = this.options.tagValueProcessor(key, val);
          textValue = this.replaceEntitiesValue(textValue);
          if (textValue === "") {
            return this.indentate(level) + "<" + key + attrStr + this.closeTag(key) + this.tagEndChar;
          } else {
            return this.indentate(level) + "<" + key + attrStr + ">" + textValue + "</" + key + this.tagEndChar;
          }
        }
      };
      Builder.prototype.replaceEntitiesValue = function(textValue) {
        if (textValue && textValue.length > 0 && this.options.processEntities) {
          for (let i = 0; i < this.options.entities.length; i++) {
            const entity = this.options.entities[i];
            textValue = textValue.replace(entity.regex, entity.val);
          }
        }
        return textValue;
      };
      function indentate(level) {
        return this.options.indentBy.repeat(level);
      }
      function isAttribute(name) {
        if (name.startsWith(this.options.attributeNamePrefix) && name !== this.options.textNodeName) {
          return name.substr(this.attrPrefixLen);
        } else {
          return false;
        }
      }
      module.exports = Builder;
    }
  });

  // node_modules/fast-xml-parser/src/fxp.js
  var require_fxp = __commonJS({
    "node_modules/fast-xml-parser/src/fxp.js"(exports, module) {
      "use strict";
      var validator = require_validator();
      var XMLParser2 = require_XMLParser();
      var XMLBuilder = require_json2xml();
      module.exports = {
        XMLParser: XMLParser2,
        XMLValidator: validator,
        XMLBuilder
      };
    }
  });

  // src/features/pinboard/pinboard-service.js
  var import_fast_xml_parser;
  var init_pinboard_service = __esm({
    "src/features/pinboard/pinboard-service.js"() {
      init_config_manager();
      init_tag_service();
      import_fast_xml_parser = __toESM(require_fxp(), 1);
      init_utils();
      debugLog2("[SAFARI-EXT-SHIM-001] pinboard-service.js: module loaded");
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
      try {
        console.log("\u{1F50D} [MessageClient] Sending message:", fullMessage);
        const response = await safariEnhancements.runtime.sendMessage(fullMessage);
        console.log("\u{1F50D} [MessageClient] Received response:", response);
        return response;
      } catch (error) {
        console.error("\u{1F50D} [MessageClient] Message send failed:", error);
        throw error;
      }
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
      try {
        const response = await safariEnhancements.tabs.sendMessage(tabId, message);
        return response;
      } catch (error) {
        throw error;
      }
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
      debugLog3("OverlayManager initialized", { config, transparencyMode: this.transparencyMode });
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
        closeBtn.onclick = () => this.hide();
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
        const refreshData = {
          url: window.location.href,
          title: this.document.title,
          tabId: this.content?.tabId || null
        };
        debugLog3("[OVERLAY-REFRESH-INTEGRATION-001] Refresh request data:", refreshData);
        const response = await this.messageService.sendMessage({
          type: "getCurrentBookmark",
          data: refreshData
        });
        if (response && response.success && response.data) {
          const updatedContent = {
            bookmark: response.data,
            pageTitle: this.document.title,
            pageUrl: window.location.href
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
        font-size: 12px;
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
        font-size: 12px;
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
      const safeChars = /^[\w\s-]+$/;
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
  init_tag_service();
  init_config_manager();
  init_utils();
  var MESSAGE_TYPES = {
    // Data retrieval
    GET_CURRENT_BOOKMARK: "getCurrentBookmark",
    GET_RECENT_BOOKMARKS: "getRecentBookmarks",
    GET_OPTIONS: "getOptions",
    GET_TAB_ID: "getTabId",
    // Bookmark operations
    SAVE_BOOKMARK: "saveBookmark",
    DELETE_BOOKMARK: "deleteBookmark",
    SAVE_TAG: "saveTag",
    DELETE_TAG: "deleteTag",
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

  // src/features/content/content-main.js
  init_utils();
  window.HOVERBOARD_DEBUG = true;
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
        console.log("Content script received message:", message.type);
        switch (message.type) {
          case "TOGGLE_HOVER":
            await this.toggleHover();
            const newState = {
              isVisible: this.overlayActive,
              hasBookmark: !!this.currentBookmark
            };
            sendResponse({ success: true, data: newState });
            break;
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
          case "GET_OVERLAY_STATE":
            const overlayState = {
              isVisible: this.overlayActive,
              hasBookmark: !!this.currentBookmark,
              overlayElement: !!document.getElementById("hoverboard-overlay")
            };
            sendResponse({ success: true, data: overlayState });
            break;
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
        console.log("\u{1F50D} [Debug] Response structure:", response);
        console.log("\u{1F50D} [Debug] Actual response:", actualResponse);
        console.log("\u{1F50D} [Debug] Actual response type:", typeof actualResponse);
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
        debugLog2("CONTENT-SCRIPT", "[CHROME-DEBUG-001] showHover called", { userTriggered, platform: navigator.userAgent });
        if (typeof chrome !== "undefined" && chrome.runtime) {
          debugLog2("CONTENT-SCRIPT", "[CHROME-DEBUG-001] Detected Chrome runtime");
        } else if (typeof safariEnhancements !== "undefined" && safariEnhancements.runtime) {
          debugLog2("CONTENT-SCRIPT", "[CHROME-DEBUG-001] Detected browser polyfill runtime");
        } else {
          debugError("CONTENT-SCRIPT", "[CHROME-DEBUG-001] No recognized extension runtime detected");
        }
        if (!debugLog2 || !debugError) {
          console.error("[CHROME-DEBUG-001] utils.js functions missing");
        }
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
        console.log("\u{1F50D} [Debug] Bookmark data structure:");
        console.log("\u{1F50D} [Debug] - URL:", this.currentBookmark.url);
        console.log("\u{1F50D} [Debug] - Description:", this.currentBookmark.description);
        console.log("\u{1F50D} [Debug] - Tags:", this.currentBookmark.tags);
        console.log("\u{1F50D} [Debug] - Tags type:", typeof this.currentBookmark.tags);
        console.log("\u{1F50D} [Debug] - Tags length:", this.currentBookmark.tags?.length);
        console.log("\u{1F50D} [Debug] - Extended:", this.currentBookmark.extended);
        console.log("\u{1F50D} [Debug] - Hash:", this.currentBookmark.hash);
        console.log("\u{1F50D} [Debug] - Shared:", this.currentBookmark.shared);
        console.log("\u{1F50D} [Debug] - ToRead:", this.currentBookmark.toread);
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
        console.log("Bookmark data refreshed");
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
        if (!bookmarkData || !bookmarkData.url || !bookmarkData.tags) {
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
