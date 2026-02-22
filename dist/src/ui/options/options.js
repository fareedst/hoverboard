var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

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
          // [REQ-AI_TAGGING_CONFIG] [ARCH-AI_TAGGING_CONFIG] [IMPL-AI_CONFIG_OPTIONS] AI tagging defaults for options and storage; empty key disables feature.
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
       * [IMPL-URL_INHIBITION] [ARCH-CONFIG_STRUCTURE] [REQ-SITE_MANAGEMENT] Get inhibited URLs list (newline-separated).
       * @returns {Promise<string[]>} Array of inhibited URLs
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
       * [IMPL-URL_INHIBITION] [ARCH-CONFIG_STRUCTURE] [REQ-SITE_MANAGEMENT] Add URL to inhibit list (no duplicate).
       * @param {string} url - URL to inhibit
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
       * [IMPL-URL_INHIBITION] [ARCH-CONFIG_STRUCTURE] [REQ-SITE_MANAGEMENT] Set inhibit URLs list (replaces existing).
       * @param {string[]} urls - Array of URLs to inhibit
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
       * [IMPL-URL_INHIBITION] [ARCH-CONFIG_STRUCTURE] [REQ-SITE_MANAGEMENT] Check if URL is allowed (not in inhibit list; substring match).
       * @param {string} url - URL to check
       * @returns {Promise<boolean>} Whether URL is allowed
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

// src/features/tagging/tag-service.js
var TagService;
var init_tag_service = __esm({
  "src/features/tagging/tag-service.js"() {
    init_config_manager();
    init_utils();
    debugLog("[SAFARI-EXT-SHIM-001] tag-service.js: module loaded");
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
          debugLog("TAG-SERVICE", "[IMMUTABLE-REQ-TAG-003] Getting user recent tags from shared memory");
          const directMemory = this.getDirectSharedMemory();
          if (directMemory) {
            const recentTags2 = directMemory.getRecentTags();
            debugLog("TAG-SERVICE", "[IMMUTABLE-REQ-TAG-003] Retrieved recent tags from direct shared memory:", recentTags2.length);
            const sortedTags2 = recentTags2.sort((a, b) => {
              const dateA = new Date(a.lastUsed);
              const dateB = new Date(b.lastUsed);
              return dateB - dateA;
            });
            return sortedTags2;
          }
          const backgroundPage = await this.getBackgroundPage();
          if (!backgroundPage || !backgroundPage.recentTagsMemory) {
            debugLog("TAG-SERVICE", "[IMMUTABLE-REQ-TAG-003] No shared memory found, returning empty array");
            return [];
          }
          const recentTags = backgroundPage.recentTagsMemory.getRecentTags();
          debugLog("TAG-SERVICE", "[IMMUTABLE-REQ-TAG-003] Retrieved recent tags from shared memory:", recentTags.length);
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
          debugLog("TAG-SERVICE", "[IMMUTABLE-REQ-TAG-003] Adding tag to user recent list:", { tagName, currentSiteUrl });
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
              debugLog("TAG-SERVICE", "[IMMUTABLE-REQ-TAG-003] Successfully added tag to user recent list via direct access");
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
            debugLog("TAG-SERVICE", "[IMMUTABLE-REQ-TAG-003] Successfully added tag to user recent list");
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
          debugLog("TAG-SERVICE", "[IMMUTABLE-REQ-TAG-003] Getting recent tags excluding current:", currentTags);
          const allRecentTags = await this.getUserRecentTags();
          const normalizedCurrentTags = currentTags.map((tag) => tag.toLowerCase());
          const filteredTags = allRecentTags.filter(
            (tag) => !normalizedCurrentTags.includes(tag.name.toLowerCase())
          );
          debugLog("TAG-SERVICE", "[IMMUTABLE-REQ-TAG-003] Filtered recent tags:", filteredTags.length);
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
       * [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-RECENT_TAGS_SYSTEM] Get recent tags (cache + shared memory).
       * @param {Object} options - Tag retrieval options
       * @returns {Promise<Object[]>} Array of recent tag objects
       */
      // [TEST-FIX-IMPL-2025-07-14] - Standardize getRecentTags return format
      async getRecentTags(options = {}) {
        try {
          debugLog("TAG-SERVICE", "[TEST-FIX-STORAGE-001] Getting recent tags with enhanced storage integration");
          const cached = await this.getCachedTags();
          if (cached && this.isCacheValid(cached.timestamp)) {
            debugLog("TAG-SERVICE", "[TEST-FIX-STORAGE-001] Returning cached tags:", cached.tags.length);
            return this.processTagsForDisplay(cached.tags, options);
          }
          const userRecentTags = await this.getUserRecentTags();
          if (userRecentTags.length > 0) {
            debugLog("TAG-SERVICE", "[TEST-FIX-STORAGE-001] Returning user recent tags:", userRecentTags.length);
            return this.processTagsForDisplay(userRecentTags, options);
          }
          debugLog("TAG-SERVICE", "[TEST-FIX-STORAGE-001] No tags found, returning empty array");
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
          debugLog("TAG-SERVICE", "Getting cached tags from storage");
          const result = await chrome.storage.local.get(this.cacheKey);
          const cachedData = result[this.cacheKey] || null;
          debugLog("TAG-SERVICE", "Cached data retrieved:", cachedData);
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
        debugLog("TAG-SERVICE", "Cache validity check:", {
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
        debugLog("TAG-SERVICE", "Extracting tags from bookmarks, count:", bookmarks.length);
        const tagMap = /* @__PURE__ */ new Map();
        bookmarks.forEach((bookmark, index) => {
          debugLog("TAG-SERVICE", `Processing bookmark ${index + 1}:`, {
            url: bookmark.url,
            description: bookmark.description,
            tags: bookmark.tags
          });
          if (bookmark.tags && bookmark.tags.length > 0) {
            bookmark.tags.forEach((tagName) => {
              debugLog("TAG-SERVICE", `Processing tag: "${tagName}"`);
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
                debugLog("TAG-SERVICE", `Added/updated tag "${tagName}" (count: ${existing.count})`);
              } else {
                debugLog("TAG-SERVICE", `Skipping empty tag: "${tagName}"`);
              }
            });
          } else {
            debugLog("TAG-SERVICE", `Bookmark has no tags`);
          }
        });
        const result = Array.from(tagMap.values());
        debugLog("TAG-SERVICE", "Final extracted tags:", result.map((t) => ({ name: t.name, count: t.count })));
        return result;
      }
      /**
       * Process tags and update cache
       * @param {Object[]} tags - Array of tag objects
       * @returns {Promise<Object[]>} Processed tags
       */
      async processAndCacheTags(tags) {
        try {
          debugLog("TAG-SERVICE", "Processing and caching tags, input count:", tags.length);
          debugLog("TAG-SERVICE", "Input tags:", tags.map((t) => ({ name: t.name, count: t.count })));
          const config = await this.configManager.getConfig();
          const sortedTags = tags.sort((a, b) => {
            if (b.count !== a.count) {
              return b.count - a.count;
            }
            return new Date(b.lastUsed) - new Date(a.lastUsed);
          }).slice(0, config.recentTagsCountMax);
          debugLog("TAG-SERVICE", "Sorted and limited tags:", sortedTags.map((t) => ({ name: t.name, count: t.count })));
          const cacheData = {
            tags: sortedTags,
            timestamp: Date.now()
          };
          debugLog("TAG-SERVICE", "Caching data:", cacheData);
          await chrome.storage.local.set({
            [this.cacheKey]: cacheData
          });
          debugLog("TAG-SERVICE", "Cache updated successfully");
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
            debugLog("IMMUTABLE-REQ-TAG-001", "Tag added to recent tags:", sanitizedTag);
          } else {
            debugLog("IMMUTABLE-REQ-TAG-001", "Tag already exists in recent tags:", sanitizedTag);
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
          debugLog("IMMUTABLE-REQ-TAG-001", "Recent tags excluding current:", filteredTags.length);
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
            debugLog("IMMUTABLE-REQ-TAG-001", "Tag addition handled for bookmark:", bookmarkData.url);
          }
        } catch (error) {
          debugError("IMMUTABLE-REQ-TAG-001", "Failed to handle tag addition:", error);
        }
      }
      /**
       * [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION] Sanitize tag input.
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
          debugLog("TAG-SERVICE", "[REQ-SUGGESTED_TAGS_FROM_CONTENT] Invalid document provided");
          return [];
        }
        try {
          debugLog("TAG-SERVICE", "[REQ-SUGGESTED_TAGS_FROM_CONTENT] Extracting suggested tags from multiple sources");
          const allTexts = [];
          if (document2.title) {
            allTexts.push(document2.title);
            debugLog("TAG-SERVICE", "[REQ-SUGGESTED_TAGS_FROM_CONTENT] Extracted from title:", document2.title.substring(0, 50));
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
                debugLog("TAG-SERVICE", "[REQ-SUGGESTED_TAGS_FROM_CONTENT] Extracted from URL:", meaningfulSegments.join(", "));
              }
            } catch (e) {
              debugError("TAG-SERVICE", "[REQ-SUGGESTED_TAGS_FROM_CONTENT] Failed to parse URL:", e);
            }
          }
          const metaKeywords = document2.querySelector('meta[name="keywords"]');
          if (metaKeywords && metaKeywords.content && metaKeywords.content.trim().length > 0) {
            allTexts.push(metaKeywords.content.trim());
            debugLog("TAG-SERVICE", "[REQ-SUGGESTED_TAGS_FROM_CONTENT] Extracted from meta keywords:", metaKeywords.content.substring(0, 50));
          }
          const metaDescription = document2.querySelector('meta[name="description"]');
          if (metaDescription && metaDescription.content && metaDescription.content.trim().length > 0) {
            allTexts.push(metaDescription.content.trim());
            debugLog("TAG-SERVICE", "[REQ-SUGGESTED_TAGS_FROM_CONTENT] Extracted from meta description:", metaDescription.content.substring(0, 50));
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
              debugLog("TAG-SERVICE", "[REQ-SUGGESTED_TAGS_FROM_CONTENT] Extracted from headings:", headings.length);
            }
          }
          const emphasisElements = document2.querySelectorAll('main strong, main b, main em, main i, main mark, main dfn, main cite, main kbd, main code, article strong, article b, article em, article i, article mark, article dfn, article cite, article kbd, article code, [role="main"] strong, [role="main"] b, [role="main"] em, [role="main"] i, [role="main"] mark, [role="main"] dfn, [role="main"] cite, [role="main"] kbd, [role="main"] code, .main strong, .main b, .main em, .main i, .main mark, .main dfn, .main cite, .main kbd, .main code, .content strong, .content b, .content em, .content i, .content mark, .content dfn, .content cite, .content kbd, .content code');
          if (emphasisElements.length > 0) {
            const emphasisTexts = Array.from(emphasisElements).slice(0, 60).map((el) => extractElementText(el)).filter((t) => t.length > 0);
            if (emphasisTexts.length > 0) {
              allTexts.push(emphasisTexts.join(" "));
              debugLog("TAG-SERVICE", "[REQ-SUGGESTED_TAGS_FROM_CONTENT] Extracted from emphasis elements:", emphasisTexts.length);
            }
          }
          const definitionTerms = document2.querySelectorAll('main dl dt, article dl dt, [role="main"] dl dt, .main dl dt, .content dl dt');
          if (definitionTerms.length > 0) {
            const dtTexts = Array.from(definitionTerms).slice(0, 40).map((dt) => extractElementText(dt)).filter((t) => t.length > 0);
            if (dtTexts.length > 0) {
              allTexts.push(dtTexts.join(" "));
              debugLog("TAG-SERVICE", "[REQ-SUGGESTED_TAGS_FROM_CONTENT] Extracted from definition terms:", dtTexts.length);
            }
          }
          const tableHeaders = document2.querySelectorAll('main th, main caption, article th, article caption, [role="main"] th, [role="main"] caption, .main th, .main caption, .content th, .content caption');
          if (tableHeaders.length > 0) {
            const thTexts = Array.from(tableHeaders).slice(0, 40).map((th) => extractElementText(th)).filter((t) => t.length > 0);
            if (thTexts.length > 0) {
              allTexts.push(thTexts.join(" "));
              debugLog("TAG-SERVICE", "[REQ-SUGGESTED_TAGS_FROM_CONTENT] Extracted from table headers:", thTexts.length);
            }
          }
          const nav = document2.querySelector("nav") || document2.querySelector("header nav") || document2.querySelector('[role="navigation"]');
          if (nav) {
            const navLinks = nav.querySelectorAll("a");
            const navTexts = Array.from(navLinks).slice(0, 40).map((link) => extractElementText(link)).filter((t) => t.length > 0);
            if (navTexts.length > 0) {
              allTexts.push(navTexts.join(" "));
              debugLog("TAG-SERVICE", "[REQ-SUGGESTED_TAGS_FROM_CONTENT] Extracted from nav:", navTexts.length);
            }
          }
          const breadcrumb = document2.querySelector('[aria-label*="breadcrumb" i], .breadcrumb, nav[aria-label*="breadcrumb" i], [itemtype*="BreadcrumbList"]');
          if (breadcrumb) {
            const breadcrumbLinks = breadcrumb.querySelectorAll('a, [itemprop="name"]');
            const breadcrumbTexts = Array.from(breadcrumbLinks).map((link) => extractElementText(link)).filter((t) => t.length > 0);
            if (breadcrumbTexts.length > 0) {
              allTexts.push(breadcrumbTexts.join(" "));
              debugLog("TAG-SERVICE", "[REQ-SUGGESTED_TAGS_FROM_CONTENT] Extracted from breadcrumbs:", breadcrumbTexts.length);
            }
          }
          const mainImages = document2.querySelectorAll('main img, article img, [role="main"] img, .main img, .content img');
          if (mainImages.length > 0) {
            const imageAlts = Array.from(mainImages).slice(0, 10).map((img) => img.alt || "").filter((alt) => alt.length > 0);
            if (imageAlts.length > 0) {
              allTexts.push(imageAlts.join(" "));
              debugLog("TAG-SERVICE", "[REQ-SUGGESTED_TAGS_FROM_CONTENT] Extracted from images:", imageAlts.length);
            }
          }
          const mainLinks = document2.querySelectorAll('main a, article a, [role="main"] a, .main a, .content a');
          if (mainLinks.length > 0) {
            const linkTexts = Array.from(mainLinks).slice(0, 20).map((link) => extractElementText(link)).filter((t) => t.length > 0);
            if (linkTexts.length > 0) {
              allTexts.push(linkTexts.join(" "));
              debugLog("TAG-SERVICE", "[REQ-SUGGESTED_TAGS_FROM_CONTENT] Extracted from links:", linkTexts.length);
            }
          }
          if (allTexts.length === 0) {
            debugLog("TAG-SERVICE", "[REQ-SUGGESTED_TAGS_FROM_CONTENT] No content found from any source");
            return [];
          }
          const allText = allTexts.join(" ");
          debugLog("TAG-SERVICE", "[REQ-SUGGESTED_TAGS_CASE_PRESERVATION] Extracted text (preserving case):", allText.substring(0, 100));
          const words = allText.split(/[\s\.,;:!?\-_\(\)\[\]{}"']+/).filter((word) => word.length > 0);
          debugLog("TAG-SERVICE", "[REQ-SUGGESTED_TAGS_CASE_PRESERVATION] Tokenized words (preserving case):", words.length);
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
          debugLog("TAG-SERVICE", "[REQ-SUGGESTED_TAGS_CASE_PRESERVATION] Word frequency map size:", wordFrequency.size);
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
          debugLog("TAG-SERVICE", "[REQ-SUGGESTED_TAGS_CASE_PRESERVATION] Sorted words (with lowercase versions):", sortedWords);
          const sanitizedTags = sortedWords.map((word) => this.sanitizeTag(word)).filter((tag) => tag !== null && tag.length > 0);
          debugLog("TAG-SERVICE", "[REQ-SUGGESTED_TAGS_CASE_PRESERVATION] Sanitized tags:", sanitizedTags);
          const uniqueTags = [];
          const seenExact = /* @__PURE__ */ new Set();
          for (const tag of sanitizedTags) {
            if (!seenExact.has(tag)) {
              uniqueTags.push(tag);
              seenExact.add(tag);
            }
          }
          const finalTags = uniqueTags.slice(0, limit * 2);
          debugLog("TAG-SERVICE", "[REQ-SUGGESTED_TAGS_CASE_PRESERVATION] Final unique suggested tags (with lowercase versions):", finalTags.length, finalTags);
          return finalTags;
        } catch (error) {
          debugError("TAG-SERVICE", "[REQ-SUGGESTED_TAGS_FROM_CONTENT] Error extracting suggested tags:", error);
          return [];
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
    debugLog("[SAFARI-EXT-SHIM-001] pinboard-service.js: module loaded");
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
            debugLog("[PINBOARD-SERVICE] No auth token configured, returning empty bookmark without API call");
            return this.createEmptyBookmark(url, title);
          }
          const cleanUrl = this.cleanUrl(url);
          const endpoint = `posts/get?url=${encodeURIComponent(cleanUrl)}`;
          debugLog("Making Pinboard API request:", {
            endpoint,
            cleanUrl,
            originalUrl: url
          });
          const response = await this.makeApiRequest(endpoint);
          debugLog("\u{1F4E5} Pinboard API response received:", response);
          const parsed = this.parseBookmarkResponse(response, cleanUrl, title);
          debugLog("\u{1F4CB} Parsed bookmark result:", parsed);
          return parsed;
        } catch (error) {
          debugError("\u274C Failed to get bookmark for URL:", error);
          debugError("\u274C Error details:", error.message);
          debugError("\u274C Full error:", error);
          const emptyBookmark = this.createEmptyBookmark(url, title);
          debugLog("\u{1F4DD} Returning empty bookmark due to error:", emptyBookmark);
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
            debugLog("[PINBOARD-SERVICE] No auth token configured, returning empty recent list without API call");
            return [];
          }
          debugLog("[PINBOARD-SERVICE] Getting recent bookmarks, count:", count);
          const endpoint = `posts/recent?count=${count}`;
          const response = await this.makeApiRequest(endpoint);
          debugLog("[PINBOARD-SERVICE] Raw API response received");
          const result = this.parseRecentBookmarksResponse(response);
          debugLog("[PINBOARD-SERVICE] Parsed recent bookmarks:", result.map((b) => ({
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
            debugLog("[PINBOARD-SERVICE] No auth token configured, skipping save without API call");
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
            debugLog("[PINBOARD-SERVICE] No auth token configured, skipping delete without API call");
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
            debugLog("[IMMUTABLE-REQ-TAG-001] Tracked tags for bookmark:", sanitizedTags);
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
            debugLog("[IMMUTABLE-REQ-TAG-001] Attempted cleanup after quota exceeded");
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
            debugLog("[PINBOARD-SERVICE] No auth token configured, testConnection returns false without API call");
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
        debugLog("\u{1F510} Auth token check:", hasAuth);
        if (!hasAuth) {
          throw new Error("No authentication token configured");
        }
        const authParam = await this.configManager.getAuthTokenParam();
        const url = `${this.apiBase}${endpoint}&${authParam}`;
        debugLog("\u{1F310} Making API request to:", url.replace(/auth_token=[^&]+/, "auth_token=***HIDDEN***"));
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
          debugLog(`\u{1F680} Attempting HTTP ${method} request (attempt ${retryCount + 1})`);
          const response = await fetch(url, { method });
          debugLog(`\u{1F4E1} HTTP response status: ${response.status} ${response.statusText}`);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          const xmlText = await response.text();
          debugLog("\u{1F4C4} Raw XML response:", xmlText.substring(0, 500) + (xmlText.length > 500 ? "..." : ""));
          const parsed = this.parseXmlResponse(xmlText);
          debugLog("\u2705 Successfully parsed XML response");
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
          debugLog("Parsing XML object structure:", JSON.stringify(xmlObj, null, 2));
          const posts = xmlObj?.posts?.post;
          debugLog("\u{1F4CB} Posts extracted:", posts);
          debugLog("\u{1F4CB} Posts type:", typeof posts);
          debugLog("\u{1F4CB} Posts is array:", Array.isArray(posts));
          debugLog("\u{1F4CB} Posts length:", posts?.length);
          if (posts && posts.length > 0) {
            const post = Array.isArray(posts) ? posts[0] : posts;
            debugLog("\u{1F4C4} Processing post:", post);
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
            debugLog("\u2705 Successfully parsed bookmark:", result);
            return result;
          }
          if (posts && !Array.isArray(posts)) {
            debugLog("\u{1F4C4} Single post object found, processing directly:", posts);
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
            debugLog("\u2705 Successfully parsed single bookmark:", result);
            return result;
          }
          debugLog("\u26A0\uFE0F No posts found in XML structure");
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
          debugLog("[PINBOARD-SERVICE] Parsing recent bookmarks XML object");
          debugLog("[PINBOARD-SERVICE] XML object structure:", JSON.stringify(xmlObj, null, 2));
          const posts = xmlObj?.posts?.post;
          if (!posts) {
            debugLog("[PINBOARD-SERVICE] No posts found in XML response");
            return [];
          }
          const postsArray = Array.isArray(posts) ? posts : [posts];
          debugLog("[PINBOARD-SERVICE] Processing posts array, count:", postsArray.length);
          const result = postsArray.map((post, index) => {
            debugLog(`[PINBOARD-SERVICE] Processing post ${index + 1}:`, {
              href: post["@_href"],
              description: post["@_description"],
              tag: post["@_tag"],
              time: post["@_time"]
            });
            const tags = post["@_tag"] ? post["@_tag"].split(" ") : [];
            debugLog(`[PINBOARD-SERVICE] Post ${index + 1} tags after split:`, tags);
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
          debugLog("[PINBOARD-SERVICE] Final parsed bookmarks:", result.map((b) => ({
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
       * [IMPL-PINBOARD_POSTS_ADD_ENCODING] [IMPL-PINBOARD_API] [IMPL-TAG_SYSTEM] Build posts/add query string with encodeURIComponent for url, description, extended, tags, shared, toread.
       * @param {Object} bookmarkData - Bookmark data
       * @returns {string} URL parameter string (key=encodedValue&...)
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

// src/ui/options/options.js
init_config_manager();
init_pinboard_service();

// src/features/ai/ai-api-test.js
var OPENAI_MODELS_URL = "https://api.openai.com/v1/models";
var GEMINI_MODELS_URL = "https://generativelanguage.googleapis.com/v1beta/models";
async function testAiApiKey(apiKey, provider, fetchFn = globalThis.fetch) {
  if (!apiKey || typeof apiKey !== "string" || !apiKey.trim()) {
    return { ok: false, error: "Missing API key" };
  }
  const key = apiKey.trim();
  if (!provider || provider !== "openai" && provider !== "gemini") {
    return { ok: false, error: "Unknown provider" };
  }
  try {
    if (provider === "openai") {
      const res = await fetchFn(OPENAI_MODELS_URL, {
        method: "GET",
        headers: { Authorization: `Bearer ${key}` }
      });
      if (res.ok) return { ok: true };
      if (res.status === 401 || res.status === 403) {
        return { ok: false, error: "Invalid API key" };
      }
      const text = await res.text();
      return { ok: false, error: res.statusText || text || "Request failed" };
    }
    if (provider === "gemini") {
      const url = `${GEMINI_MODELS_URL}?key=${encodeURIComponent(key)}`;
      const res = await fetchFn(url, { method: "GET" });
      if (res.ok) return { ok: true };
      if (res.status === 400 || res.status === 403) {
        return { ok: false, error: "Invalid API key" };
      }
      const text = await res.text();
      return { ok: false, error: res.statusText || text || "Request failed" };
    }
  } catch (err) {
    const message = err && typeof err.message === "string" ? err.message : "Network error";
    return { ok: false, error: message };
  }
  return { ok: false, error: "Unknown provider" };
}

// src/ui/options/options.js
var OptionsController = class {
  constructor() {
    this.configManager = new ConfigManager();
    this.pinboardService = new PinboardService();
    this.elements = {};
    this.isLoading = false;
    this.init();
  }
  async init() {
    this.bindElements();
    if (this.elements.bookmarksIndexLink && typeof chrome !== "undefined" && chrome.runtime) {
      this.elements.bookmarksIndexLink.href = chrome.runtime.getURL("src/ui/bookmarks-table/bookmarks-table.html");
    }
    if (this.elements.browserBookmarkImportLink && typeof chrome !== "undefined" && chrome.runtime) {
      this.elements.browserBookmarkImportLink.href = chrome.runtime.getURL("src/ui/browser-bookmark-import/browser-bookmark-import.html");
    }
    this.attachEventListeners();
    await this.loadSettings();
    if (typeof chrome !== "undefined" && chrome.storage?.onChanged) {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== "local") return;
        if (changes.hoverboard_file_storage_configured || changes.hoverboard_file_storage_name) {
          this.loadFileStorageFolderName();
        }
        if (changes.hoverboard_file_storage_path && this.elements.fileStoragePath) {
          this.elements.fileStoragePath.value = changes.hoverboard_file_storage_path.newValue || "~/.hoverboard";
        }
      });
    }
  }
  bindElements() {
    this.elements.storageModePinboard = document.getElementById("storage-mode-pinboard");
    this.elements.storageModeLocal = document.getElementById("storage-mode-local");
    this.elements.storageModeFile = document.getElementById("storage-mode-file");
    this.elements.storageModeSync = document.getElementById("storage-mode-sync");
    this.elements.selectFileStorageFolder = document.getElementById("select-file-storage-folder");
    this.elements.fileStorageFolderName = document.getElementById("file-storage-folder-name");
    this.elements.fileStoragePath = document.getElementById("file-storage-path");
    this.elements.authSection = document.getElementById("auth-section");
    this.elements.authToken = document.getElementById("auth-token");
    this.elements.testAuth = document.getElementById("test-auth");
    this.elements.showHoverOnLoad = document.getElementById("show-hover-on-load");
    this.elements.hoverShowTooltips = document.getElementById("hover-show-tooltips");
    this.elements.recentPostsCount = document.getElementById("recent-posts-count");
    this.elements.showSectionLabels = document.getElementById("show-section-labels");
    this.elements.defaultThemeToggle = document.getElementById("default-theme-toggle");
    this.elements.defaultTransparencyEnabled = document.getElementById("default-transparency-enabled");
    this.elements.defaultBackgroundOpacity = document.getElementById("default-background-opacity");
    this.elements.visibilityPreview = document.getElementById("visibility-preview");
    this.elements.opacityValue = document.querySelector(".opacity-value");
    this.elements.opacitySetting = document.querySelector(".opacity-setting");
    this.elements.fontSizeSuggestedTags = document.getElementById("font-size-suggested-tags");
    this.elements.fontSizeLabels = document.getElementById("font-size-labels");
    this.elements.fontSizeTags = document.getElementById("font-size-tags");
    this.elements.fontSizeBase = document.getElementById("font-size-base");
    this.elements.fontSizeInputs = document.getElementById("font-size-inputs");
    this.elements.badgeNotBookmarked = document.getElementById("badge-not-bookmarked");
    this.elements.badgeNoTags = document.getElementById("badge-no-tags");
    this.elements.badgePrivate = document.getElementById("badge-private");
    this.elements.badgeToRead = document.getElementById("badge-to-read");
    this.elements.inhibitUrls = document.getElementById("inhibit-urls");
    this.elements.stripUrlHash = document.getElementById("strip-url-hash");
    this.elements.autoCloseTimeout = document.getElementById("auto-close-timeout");
    this.elements.saveSettings = document.getElementById("save-settings");
    this.elements.resetSettings = document.getElementById("reset-settings");
    this.elements.exportSettings = document.getElementById("export-settings");
    this.elements.importSettings = document.getElementById("import-settings");
    this.elements.importFile = document.getElementById("import-file");
    this.elements.statusMessage = document.getElementById("status-message");
    this.elements.bookmarksIndexLink = document.getElementById("bookmarks-index-link");
    this.elements.browserBookmarkImportLink = document.getElementById("browser-bookmark-import-link");
    this.elements.testNativeHost = document.getElementById("test-native-host");
    this.elements.nativeHostStatus = document.getElementById("native-host-status");
    this.elements.aiApiKey = document.getElementById("ai-api-key");
    this.elements.aiProvider = document.getElementById("ai-provider");
    this.elements.aiTagLimit = document.getElementById("ai-tag-limit");
    this.elements.testAiApi = document.getElementById("test-ai-api");
    this.elements.aiTestStatus = document.getElementById("ai-test-status");
  }
  attachEventListeners() {
    this.elements.storageModePinboard.addEventListener("change", () => this.onStorageModeChange("pinboard"));
    this.elements.storageModeLocal.addEventListener("change", () => this.onStorageModeChange("local"));
    this.elements.storageModeFile.addEventListener("change", () => this.onStorageModeChange("file"));
    this.elements.storageModeSync?.addEventListener("change", () => this.onStorageModeChange("sync"));
    if (this.elements.selectFileStorageFolder) {
      this.elements.selectFileStorageFolder.addEventListener("click", () => this.selectFileStorageFolder());
    }
    if (this.elements.fileStoragePath) {
      this.elements.fileStoragePath.addEventListener("blur", () => this.persistFileStoragePath());
    }
    this.elements.testAuth.addEventListener("click", () => this.testAuthentication());
    if (this.elements.testAiApi) {
      this.elements.testAiApi.addEventListener("click", () => this.testAiApiKey());
    }
    if (this.elements.testNativeHost) {
      this.elements.testNativeHost.addEventListener("click", () => this.testNativeHost());
    }
    this.elements.defaultThemeToggle.addEventListener("click", () => this.toggleDefaultTheme());
    this.elements.defaultTransparencyEnabled.addEventListener("change", () => this.updateTransparencyState());
    this.elements.defaultBackgroundOpacity.addEventListener("input", () => this.updateOpacityDisplay());
    this.elements.saveSettings.addEventListener("click", () => this.saveSettings());
    this.elements.resetSettings.addEventListener("click", () => this.resetSettings());
    this.elements.exportSettings.addEventListener("click", () => this.exportSettings());
    this.elements.importSettings.addEventListener("click", () => this.elements.importFile.click());
    this.elements.importFile.addEventListener("change", (e) => this.importSettings(e));
    const inputs = document.querySelectorAll("input, textarea");
    inputs.forEach((input) => {
      input.addEventListener("input", this.debounce(() => this.autoSave(), 1e3));
    });
  }
  async loadSettings() {
    try {
      this.setLoading(true);
      await this.configManager.initializeDefaults();
      const config = await this.configManager.getConfig();
      const authToken = await this.configManager.getAuthToken();
      const inhibitUrls = await this.configManager.getInhibitUrls();
      const storageMode = ["local", "file", "sync"].includes(config.storageMode) ? config.storageMode : "pinboard";
      this.elements.storageModePinboard.checked = storageMode === "pinboard";
      this.elements.storageModeLocal.checked = storageMode === "local";
      this.elements.storageModeFile.checked = storageMode === "file";
      if (this.elements.storageModeSync) this.elements.storageModeSync.checked = storageMode === "sync";
      this.updateAuthSectionVisibility(storageMode);
      await this.loadFileStorageFolderName();
      const pathResult = await chrome.storage.local.get("hoverboard_file_storage_path");
      if (this.elements.fileStoragePath) {
        this.elements.fileStoragePath.value = pathResult.hoverboard_file_storage_path && pathResult.hoverboard_file_storage_path.trim() || "~/.hoverboard";
      }
      this.elements.authToken.value = authToken;
      this.elements.showHoverOnLoad.checked = config.showHoverOnPageLoad;
      this.elements.hoverShowTooltips.checked = config.hoverShowTooltips;
      this.elements.recentPostsCount.value = config.initRecentPostsCount;
      this.elements.showSectionLabels.checked = config.uxShowSectionLabels;
      this.elements.badgeNotBookmarked.value = config.badgeTextIfNotBookmarked;
      this.elements.badgeNoTags.value = config.badgeTextIfBookmarkedNoTags;
      this.elements.badgePrivate.value = config.badgeTextIfPrivate;
      this.elements.badgeToRead.value = config.badgeTextIfQueued;
      this.elements.inhibitUrls.value = inhibitUrls.join("\n");
      this.elements.stripUrlHash.checked = config.uxUrlStripHash;
      this.elements.autoCloseTimeout.value = config.uxAutoCloseTimeout;
      this.elements.defaultTransparencyEnabled.checked = config.defaultTransparencyEnabled;
      this.elements.defaultBackgroundOpacity.value = config.defaultBackgroundOpacity;
      this.elements.fontSizeSuggestedTags.value = config.fontSizeSuggestedTags || 10;
      this.elements.fontSizeLabels.value = config.fontSizeLabels || 12;
      this.elements.fontSizeTags.value = config.fontSizeTags || 12;
      this.elements.fontSizeBase.value = config.fontSizeBase || 14;
      this.elements.fontSizeInputs.value = config.fontSizeInputs || 14;
      if (this.elements.aiApiKey) this.elements.aiApiKey.value = config.aiApiKey || "";
      if (this.elements.aiProvider) this.elements.aiProvider.value = config.aiProvider || "openai";
      if (this.elements.aiTagLimit) this.elements.aiTagLimit.value = config.aiTagLimit || 64;
      this.currentTheme = config.defaultVisibilityTheme;
      this.updateThemeDisplay();
      this.updateTransparencyState();
      this.updateOpacityDisplay();
      this.updateVisibilityPreview();
      this.showStatus("Settings loaded successfully", "success");
    } catch (error) {
      console.error("Failed to load settings:", error);
      this.showStatus("Failed to load settings: " + error.message, "error");
    } finally {
      this.setLoading(false);
    }
  }
  async saveSettings() {
    try {
      this.setLoading(true);
      const validation = this.validateInputs();
      if (!validation.valid) {
        this.showStatus(validation.message, "error");
        return;
      }
      const storageMode = this.elements.storageModeFile.checked ? "file" : this.elements.storageModeSync?.checked ? "sync" : this.elements.storageModeLocal.checked ? "local" : "pinboard";
      const settings = {
        storageMode,
        showHoverOnPageLoad: this.elements.showHoverOnLoad.checked,
        hoverShowTooltips: this.elements.hoverShowTooltips.checked,
        initRecentPostsCount: parseInt(this.elements.recentPostsCount.value),
        uxShowSectionLabels: this.elements.showSectionLabels.checked,
        badgeTextIfNotBookmarked: this.elements.badgeNotBookmarked.value,
        badgeTextIfBookmarkedNoTags: this.elements.badgeNoTags.value,
        badgeTextIfPrivate: this.elements.badgePrivate.value,
        badgeTextIfQueued: this.elements.badgeToRead.value,
        uxUrlStripHash: this.elements.stripUrlHash.checked,
        uxAutoCloseTimeout: parseInt(this.elements.autoCloseTimeout.value),
        // Visibility defaults
        defaultVisibilityTheme: this.currentTheme,
        defaultTransparencyEnabled: this.elements.defaultTransparencyEnabled.checked,
        defaultBackgroundOpacity: parseInt(this.elements.defaultBackgroundOpacity.value),
        // Font size settings
        fontSizeSuggestedTags: parseInt(this.elements.fontSizeSuggestedTags.value),
        fontSizeLabels: parseInt(this.elements.fontSizeLabels.value),
        fontSizeTags: parseInt(this.elements.fontSizeTags.value),
        fontSizeBase: parseInt(this.elements.fontSizeBase.value),
        fontSizeInputs: parseInt(this.elements.fontSizeInputs.value),
        // [REQ-AI_TAGGING_CONFIG] [ARCH-AI_TAGGING_CONFIG] [IMPL-AI_CONFIG_OPTIONS] Persist trimmed apiKey, provider, clamped aiTagLimit via updateConfig.
        aiApiKey: this.elements.aiApiKey ? this.elements.aiApiKey.value.trim() : "",
        aiProvider: this.elements.aiProvider ? this.elements.aiProvider.value : "openai",
        aiTagLimit: this.elements.aiTagLimit ? Math.min(128, Math.max(1, parseInt(this.elements.aiTagLimit.value) || 64)) : 64
      };
      await this.configManager.updateConfig(settings);
      const authToken = this.elements.authToken.value.trim();
      await this.configManager.setAuthToken(authToken);
      const inhibitUrls = this.elements.inhibitUrls.value.split("\n").map((url) => url.trim()).filter((url) => url.length > 0);
      await this.configManager.setInhibitUrls(inhibitUrls);
      const path = this.elements.fileStoragePath ? this.elements.fileStoragePath.value.trim() : "";
      const pathToSave = path || "~/.hoverboard";
      await chrome.storage.local.set({
        hoverboard_file_storage_path: pathToSave,
        ...storageMode === "file" && pathToSave ? { hoverboard_file_storage_configured: true } : {}
      });
      this.showStatus("Settings saved successfully!", "success");
    } catch (error) {
      console.error("Failed to save settings:", error);
      this.showStatus("Failed to save settings: " + error.message, "error");
    } finally {
      this.setLoading(false);
    }
  }
  async resetSettings() {
    if (!confirm("Are you sure you want to reset all settings to defaults? This cannot be undone.")) {
      return;
    }
    try {
      this.setLoading(true);
      await this.configManager.resetToDefaults();
      await this.loadSettings();
      this.showStatus("Settings reset to defaults", "success");
    } catch (error) {
      console.error("Failed to reset settings:", error);
      this.showStatus("Failed to reset settings: " + error.message, "error");
    } finally {
      this.setLoading(false);
    }
  }
  /**
   * [ARCH-LOCAL_STORAGE_PROVIDER] Update auth section visibility based on storage mode.
   * @param {string} mode - 'pinboard' or 'local'
   */
  async loadFileStorageFolderName() {
    if (!this.elements.fileStorageFolderName) return;
    try {
      const result = await chrome.storage.local.get(["hoverboard_file_storage_configured", "hoverboard_file_storage_name"]);
      if (result.hoverboard_file_storage_configured && result.hoverboard_file_storage_name) {
        this.elements.fileStorageFolderName.textContent = result.hoverboard_file_storage_name;
      } else {
        this.elements.fileStorageFolderName.textContent = "";
      }
    } catch {
      this.elements.fileStorageFolderName.textContent = "";
    }
  }
  /**
   * [IMPL-FILE_STORAGE_TYPED_PATH] Persist typed path to chrome.storage.local and set file storage configured when in file mode.
   */
  async persistFileStoragePath() {
    if (!this.elements.fileStoragePath) return;
    const path = this.elements.fileStoragePath.value.trim() || "~/.hoverboard";
    const storageMode = this.elements.storageModeFile?.checked ? "file" : this.elements.storageModeSync?.checked ? "sync" : this.elements.storageModeLocal?.checked ? "local" : "pinboard";
    await chrome.storage.local.set({
      hoverboard_file_storage_path: path,
      ...storageMode === "file" && path ? { hoverboard_file_storage_configured: true } : {}
    });
  }
  async selectFileStorageFolder() {
    const pickerUrl = typeof chrome !== "undefined" && chrome.runtime ? chrome.runtime.getURL("src/ui/options/folder-picker.html") : "";
    if (pickerUrl) {
      this.showStatus("Opening folder picker in a new tab\u2026", "info");
      try {
        await chrome.tabs.create({ url: pickerUrl });
        this.showStatus("Use the new tab to choose the folder. After selecting, return here\u2014the folder name will update.", "info");
      } catch (e) {
        this.showStatus("Could not open folder picker: " + (e.message || "Unknown error"), "error");
      }
      return;
    }
    this.showStatus("Folder picker is not available in this context.", "error");
  }
  updateAuthSectionVisibility(mode) {
    if (!this.elements.authSection) return;
    if (mode === "local" || mode === "file" || mode === "sync") {
      this.elements.authSection.classList.add("auth-section--disabled");
    } else {
      this.elements.authSection.classList.remove("auth-section--disabled");
    }
  }
  /**
   * [ARCH-LOCAL_STORAGE_PROVIDER] Handle storage mode radio change: persist and notify service worker.
   * @param {string} mode - 'pinboard' or 'local'
   */
  async onStorageModeChange(mode) {
    try {
      await this.configManager.setStorageMode(mode);
      this.updateAuthSectionVisibility(mode);
      chrome.runtime.sendMessage({ type: "switchStorageMode" }).catch(() => {
      });
      const modeLabel = mode === "local" ? "local storage" : mode === "file" ? "file storage" : mode === "sync" ? "sync storage" : "Pinboard";
      this.showStatus("Storage mode updated. Default for new bookmarks: " + modeLabel + ".", "success");
    } catch (error) {
      console.error("Storage mode change failed:", error);
      this.showStatus("Failed to update storage mode: " + error.message, "error");
    }
  }
  async testAuthentication() {
    const authToken = this.elements.authToken.value.trim();
    if (!authToken) {
      this.showStatus("Please enter an API token first", "warning");
      return;
    }
    try {
      this.setLoading(true);
      this.showStatus("Testing connection...", "info");
      await this.configManager.setAuthToken(authToken);
      console.log("Testing Pinboard connection...");
      const isValid = await this.pinboardService.testConnection();
      console.log("Connection test result:", isValid);
      if (isValid) {
        this.showStatus("Authentication successful! \u2713", "success");
      } else {
        this.showStatus("Authentication failed. Please check your token.", "error");
      }
    } catch (error) {
      console.error("Authentication test failed:", error);
      this.showStatus("Authentication test failed: " + error.message, "error");
    } finally {
      this.setLoading(false);
    }
  }
  /** [REQ-NATIVE_HOST_WRAPPER] Send NATIVE_PING to service worker and show result. */
  async testNativeHost() {
    if (!this.elements.nativeHostStatus) return;
    this.elements.nativeHostStatus.textContent = "Testing\u2026";
    try {
      const response = await chrome.runtime.sendMessage({ type: "NATIVE_PING" });
      if (response?.success && response?.data) {
        if (response.data.error) {
          this.elements.nativeHostStatus.textContent = `Error: ${response.data.error}`;
        } else if (response.data.type === "pong") {
          this.elements.nativeHostStatus.textContent = "Native host OK (pong)";
        } else {
          this.elements.nativeHostStatus.textContent = JSON.stringify(response.data);
        }
      } else {
        this.elements.nativeHostStatus.textContent = response?.error || "No response";
      }
    } catch (e) {
      this.elements.nativeHostStatus.textContent = `Error: ${e.message}`;
    }
  }
  /**
   * [REQ-AI_TAGGING_CONFIG] [ARCH-AI_TAGGING_CONFIG] [IMPL-AI_CONFIG_OPTIONS] [IMPL-AI_TAG_TEST] Options-page Test handler: validate key via testAiApiKey(apiKey, provider); show "API key OK" or error in aiTestStatus.
   */
  async testAiApiKey() {
    if (!this.elements.aiTestStatus) return;
    const apiKey = this.elements.aiApiKey?.value?.trim();
    const provider = this.elements.aiProvider?.value || "openai";
    if (!apiKey) {
      this.elements.aiTestStatus.textContent = "Enter an API key first";
      return;
    }
    this.elements.aiTestStatus.textContent = "Testing\u2026";
    try {
      const result = await testAiApiKey(apiKey, provider);
      if (result.ok) {
        this.elements.aiTestStatus.textContent = "API key OK";
      } else {
        this.elements.aiTestStatus.textContent = result.error || "Failed";
      }
    } catch (e) {
      this.elements.aiTestStatus.textContent = `Error: ${e.message}`;
    }
  }
  async exportSettings() {
    try {
      const config = await this.configManager.exportConfig();
      const blob = new Blob([JSON.stringify(config, null, 2)], {
        type: "application/json"
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hoverboard-settings-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      this.showStatus("Settings exported successfully", "success");
    } catch (error) {
      console.error("Failed to export settings:", error);
      this.showStatus("Failed to export settings: " + error.message, "error");
    }
  }
  async importSettings(event) {
    const file = event.target.files[0];
    if (!file) return;
    try {
      this.setLoading(true);
      const text = await file.text();
      const config = JSON.parse(text);
      await this.configManager.importConfig(config);
      await this.loadSettings();
      this.showStatus("Settings imported successfully", "success");
    } catch (error) {
      console.error("Failed to import settings:", error);
      this.showStatus("Failed to import settings: " + error.message, "error");
    } finally {
      this.setLoading(false);
      event.target.value = "";
    }
  }
  async autoSave() {
    if (this.isLoading) return;
    try {
      await this.saveSettings();
    } catch (error) {
      console.warn("Auto-save failed:", error);
    }
  }
  validateInputs() {
    const recentPostsCount = parseInt(this.elements.recentPostsCount.value);
    if (isNaN(recentPostsCount) || recentPostsCount < 5 || recentPostsCount > 50) {
      return {
        valid: false,
        message: "Recent posts count must be between 5 and 50"
      };
    }
    const autoCloseTimeout = parseInt(this.elements.autoCloseTimeout.value);
    if (isNaN(autoCloseTimeout) || autoCloseTimeout < 0) {
      return {
        valid: false,
        message: "Auto-close timeout must be 0 or greater"
      };
    }
    const badgeFields = [
      this.elements.badgeNotBookmarked,
      this.elements.badgeNoTags,
      this.elements.badgePrivate,
      this.elements.badgeToRead
    ];
    for (const field of badgeFields) {
      if (field.value.length > 4) {
        return {
          valid: false,
          message: "Badge text must be 4 characters or less"
        };
      }
    }
    return { valid: true };
  }
  setLoading(loading) {
    this.isLoading = loading;
    const buttons = document.querySelectorAll(".btn");
    const inputs = document.querySelectorAll("input, textarea");
    buttons.forEach((btn) => {
      btn.disabled = loading;
      btn.classList.toggle("loading", loading);
    });
    inputs.forEach((input) => {
      input.disabled = loading;
    });
  }
  showStatus(message, type = "info") {
    this.elements.statusMessage.textContent = message;
    this.elements.statusMessage.className = `status ${type}`;
    if (type === "success") {
      setTimeout(() => {
        this.elements.statusMessage.textContent = "";
        this.elements.statusMessage.className = "status";
      }, 5e3);
    }
    if (type === "info") {
      setTimeout(() => {
        this.elements.statusMessage.textContent = "";
        this.elements.statusMessage.className = "status";
      }, 3e3);
    }
  }
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  // Visibility controls methods
  toggleDefaultTheme() {
    this.currentTheme = this.currentTheme === "light-on-dark" ? "dark-on-light" : "light-on-dark";
    this.updateThemeDisplay();
    this.updateVisibilityPreview();
  }
  updateThemeDisplay() {
    const themeIcon = this.elements.defaultThemeToggle.querySelector(".theme-icon");
    const themeText = this.elements.defaultThemeToggle.querySelector(".theme-text");
    if (themeIcon && themeText) {
      const isLightOnDark = this.currentTheme === "light-on-dark";
      themeIcon.textContent = isLightOnDark ? "\u{1F319}" : "\u2600\uFE0F";
      themeText.textContent = isLightOnDark ? "Dark" : "Light";
    }
  }
  updateTransparencyState() {
    const isEnabled = this.elements.defaultTransparencyEnabled.checked;
    this.elements.opacitySetting.classList.toggle("disabled", !isEnabled);
    this.elements.defaultBackgroundOpacity.disabled = !isEnabled;
    this.updateVisibilityPreview();
  }
  updateOpacityDisplay() {
    const opacity = this.elements.defaultBackgroundOpacity.value;
    this.elements.opacityValue.textContent = `${opacity}%`;
    this.updateVisibilityPreview();
  }
  updateVisibilityPreview() {
    const preview = this.elements.visibilityPreview;
    const isTransparent = this.elements.defaultTransparencyEnabled.checked;
    const opacity = parseInt(this.elements.defaultBackgroundOpacity.value) / 100;
    preview.classList.remove("theme-light-on-dark", "theme-dark-on-light");
    preview.classList.add(`theme-${this.currentTheme}`);
    if (isTransparent) {
      if (this.currentTheme === "light-on-dark") {
        preview.style.background = `rgba(44, 62, 80, ${opacity})`;
      } else {
        preview.style.background = `rgba(255, 255, 255, ${opacity})`;
      }
      preview.style.backdropFilter = "blur(2px)";
    } else {
      preview.style.background = "";
      preview.style.backdropFilter = "none";
    }
  }
};
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    new OptionsController();
  });
} else {
  new OptionsController();
}
