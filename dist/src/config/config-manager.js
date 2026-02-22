/**
 * Configuration Manager - Modern settings and authentication management
 * Replaces legacy config.js constants and AuthSettings class
 *
 * [IMPL-CONFIG_BACKUP_RESTORE] [ARCH-CONFIG_STRUCTURE] [REQ-CONFIG_PORTABILITY] exportConfig/importConfig for backup and portability.
 * [IMPL-CONFIG_MIGRATION] [ARCH-CONFIG_STRUCTURE] [REQ-CONFIG_PORTABILITY] Auth token in sync storage; getAuthToken, setAuthToken, hasAuth, getAuthParam.
 * [IMPL-FEATURE_FLAGS] [ARCH-CONFIG_STRUCTURE] [REQ-CONFIG_PORTABILITY] getDefaultConfiguration, ensureDefaults, getConfigForUI, updateConfig, getSettings/setSettings, resetToDefaults.
 * [IMPL-FEATURE_FLAGS] User settings persistence and synchronization
 * [IMPL-URL_INHIBITION] [ARCH-CONFIG_STRUCTURE] [REQ-SITE_MANAGEMENT] getInhibitUrls, addInhibitUrl, setInhibitUrls, isUrlAllowed (substring match).
 */

export class ConfigManager {
  constructor () {
    // IMPL-CONFIG_BACKUP_RESTORE: Standardized storage key naming convention
    // SPECIFICATION: Use prefixed keys to avoid conflicts with other extensions
    this.storageKeys = {
      AUTH_TOKEN: 'hoverboard_auth_token',
      SETTINGS: 'hoverboard_settings',
      STORAGE_MODE: 'hoverboard_storage_mode', // [ARCH-LOCAL_STORAGE_PROVIDER] - Bookmark storage mode (pinboard | local)
      INHIBIT_URLS: 'hoverboard_inhibit_urls',
      RECENT_TAGS: 'hoverboard_recent_tags', // [IMMUTABLE-REQ-TAG-001] - Tag storage key
      TAG_FREQUENCY: 'hoverboard_tag_frequency' // [IMMUTABLE-REQ-TAG-001] - Tag frequency storage key
    }

    // IMPL-FEATURE_FLAGS: Default configuration provides baseline behavior
    // IMPLEMENTATION DECISION: All settings have sensible defaults to ensure functionality without user configuration
    this.defaultConfig = this.getDefaultConfiguration()
  }

  /**
   * Get default configuration values
   * Migrated from src/shared/config.js
   *
   * IMPL-FEATURE_FLAGS: Feature flags and UI behavior control defaults
   * SPECIFICATION: Each setting controls specific extension behavior
   * IMPLEMENTATION DECISION: Conservative defaults favor user privacy and minimal intrusion
   */
  getDefaultConfiguration () {
    return {
      // [ARCH-LOCAL_STORAGE_PROVIDER] [REQ-STORAGE_MODE_DEFAULT] - Default local: preferable for most users (no account/API required)
      storageMode: 'local',

      // IMPL-FEATURE_FLAGS: Feature flags - Core functionality toggles
      // IMPLEMENTATION DECISION: Enable helpful features by default, disable potentially intrusive ones
      hoverShowRecentTags: true, // Show recent tags in hover overlay
      hoverShowTooltips: false, // Tooltips disabled by default to avoid visual clutter
      showHoverOnPageLoad: false, // No automatic hover to respect user intent
      showHoverOPLOnlyIfNoTags: true, // Smart overlay display logic
      showHoverOPLOnlyIfSomeTags: false, // Complementary to above setting
      inhibitSitesOnPageLoad: true, // Respect site-specific inhibition settings
      setIconOnLoad: true, // Update extension icon to reflect bookmark status

      // IMPL-FEATURE_FLAGS: UI behavior settings - User experience configuration
      // IMPLEMENTATION DECISION: Reasonable limits that balance functionality with performance
      recentTagsCountMax: 32, // Maximum recent tags to track
      initRecentPostsCount: 15, // Initial recent posts to load
      uxAutoCloseTimeout: 0, // in ms, 0 to disable auto-close (user control)
      uxRecentRowWithBlock: true, // Show block button in recent rows
      uxRecentRowWithBookmarkButton: true, // Show bookmark button
      uxRecentRowWithCloseButton: true, // Show close button for user control
      uxRecentRowWithPrivateButton: true, // Privacy control in interface
      uxRecentRowWithDeletePin: true, // Allow pin deletion from interface
      uxRecentRowWithInput: true, // Enable input controls
      uxUrlStripHash: false, // Preserve URL hash by default (maintain full URL context)
      uxShowSectionLabels: false, // Show section labels in popup (Quick Actions, Search Tabs)

      // [IMMUTABLE-REQ-TAG-003] - Recent tags configuration
      // IMPLEMENTATION DECISION: Conservative defaults for shared memory management
      recentTagsMaxListSize: 50, // Maximum recent tags in shared memory
      recentTagsMaxDisplayCount: 10, // Maximum tags to display in UI
      recentTagsSharedMemoryKey: 'hoverboard_recent_tags_shared', // Shared memory key
      recentTagsEnableUserDriven: true, // Enable user-driven recent tags
      recentTagsClearOnReload: true, // Clear shared memory on extension reload

      // IMPL-FEATURE_FLAGS: Badge configuration - Extension icon indicator settings
      // IMPLEMENTATION DECISION: Clear visual indicators for different bookmark states
      badgeTextIfNotBookmarked: '-', // Clear indication of non-bookmarked state
      badgeTextIfPrivate: '*', // Privacy indicator
      badgeTextIfQueued: '!', // Pending action indicator
      badgeTextIfBookmarkedNoTags: '0', // Zero tags indicator

      // IMPL-CONFIG_MIGRATION: API retry configuration - Network resilience settings
      // IMPLEMENTATION DECISION: Conservative retry strategy to avoid API rate limiting
      pinRetryCountMax: 2, // Maximum retry attempts
      pinRetryDelay: 1000, // in ms - delay between retries

      // ⭐ UI-006: Visibility Controls - 🎨 Per-window overlay appearance defaults
      // IMPLEMENTATION DECISION: Conservative defaults for broad compatibility and readability
      defaultVisibilityTheme: 'light-on-dark', // 'light-on-dark' | 'dark-on-light' - Dark theme default
      defaultTransparencyEnabled: false, // Conservative default - solid background for readability
      defaultBackgroundOpacity: 90, // 10-100% - High opacity default for good contrast
      overlayPositionMode: 'default', // 'default' | 'bottom-fixed' - Keep existing position setting

      // Font size configuration - User-customizable text sizes across UI
      // IMPLEMENTATION DECISION: Reasonable defaults with customization for accessibility
      fontSizeSuggestedTags: 10, // Suggested tags font size in pixels (smaller for less intrusion)
      fontSizeLabels: 12, // Label text (Current, Recent, Suggested) in pixels
      fontSizeTags: 12, // Current and recent tag elements in pixels
      fontSizeBase: 14, // Base UI text size in pixels
      fontSizeInputs: 14, // Input fields and buttons font size in pixels

      // [REQ-AI_TAGGING_CONFIG] [ARCH-AI_TAGGING_CONFIG] [IMPL-AI_CONFIG_OPTIONS] AI tagging defaults for options and storage; empty key disables feature.
      aiApiKey: '',
      aiProvider: 'openai',
      aiTagLimit: 64
    }
  }

  /**
   * Initialize default settings on first installation
   *
   * IMPL-FEATURE_FLAGS: First-run initialization ensures extension works immediately
   * IMPLEMENTATION DECISION: Only initialize if no settings exist to preserve user customizations
   */
  async initializeDefaults () {
    const existingSettings = await this.getStoredSettings()
    if (!existingSettings || Object.keys(existingSettings).length === 0) {
      // IMPL-FEATURE_FLAGS: Store defaults only on first run
      await this.saveSettings(this.defaultConfig)
    }
  }

  /**
   * Get complete configuration object
   * @returns {Promise<Object>} Configuration object
   *
   * IMPL-FEATURE_FLAGS: Configuration resolution with default fallback
   * IMPLEMENTATION DECISION: Merge defaults with stored settings to handle partial configurations
   */
  async getConfig () {
    const stored = await this.getStoredSettings()
    // If stored is not a plain object, treat as corrupted and use defaults
    if (!stored || typeof stored !== 'object' || Array.isArray(stored)) {
      return { ...this.defaultConfig }
    }
    // IMPL-FEATURE_FLAGS: Defaults ensure all required configuration keys are present
    return { ...this.defaultConfig, ...stored }
  }

  /**
   * Get user-configurable options (subset of config for UI)
   * @returns {Promise<Object>} Options object
   *
   * IMPL-FEATURE_FLAGS: UI-specific configuration subset
   * IMPLEMENTATION DECISION: Only expose user-relevant settings to avoid configuration complexity
   */
  async getOptions () {
    const config = await this.getConfig()
    // IMPL-FEATURE_FLAGS: Filtered configuration for user interface display
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
    }
  }

  /**
   * Update specific configuration values
   * @param {Object} updates - Configuration updates
   *
   * IMPL-FEATURE_FLAGS: Partial configuration updates with persistence
   * IMPLEMENTATION DECISION: Merge updates to preserve unmodified settings
   */
  async updateConfig (updates) {
    const current = await this.getConfig()
    const updated = { ...current, ...updates }
    // IMPL-FEATURE_FLAGS: Persist merged configuration
    await this.saveSettings(updated)
  }

  /**
   * Get bookmark storage mode (default backend for new bookmarks when using router).
   * @returns {Promise<string>} 'pinboard', 'local', 'file', or 'sync'
   *
   * [ARCH-LOCAL_STORAGE_PROVIDER] [ARCH-STORAGE_INDEX_AND_ROUTER] Storage mode for provider selection and default for new bookmarks
   * IMPLEMENTATION DECISION: Stored in settings blob; invalid values fall back to 'local'
   */
  async getStorageMode () {
    const config = await this.getConfig()
    const mode = config.storageMode
    return (mode === 'local' || mode === 'pinboard' || mode === 'file' || mode === 'sync') ? mode : 'local'
  }

  /**
   * Set bookmark storage mode
   * @param {string} mode - 'pinboard', 'local', 'file', or 'sync'
   *
   * [ARCH-LOCAL_STORAGE_PROVIDER] [ARCH-STORAGE_INDEX_AND_ROUTER] Persist storage mode
   */
  async setStorageMode (mode) {
    if (mode !== 'pinboard' && mode !== 'local' && mode !== 'file' && mode !== 'sync') {
      throw new Error(`Invalid storage mode: ${mode}. Use 'pinboard', 'local', 'file', or 'sync'.`)
    }
    await this.updateConfig({ storageMode: mode })
  }

  /**
   * Get visibility default settings
   * @returns {Promise<Object>} Visibility defaults object
   *
   * UI-006: Visibility defaults retrieval
   * IMPLEMENTATION DECISION: Dedicated method for overlay visibility configuration
   */
  async getVisibilityDefaults () {
    const config = await this.getConfig()
    return {
      textTheme: config.defaultVisibilityTheme,
      transparencyEnabled: config.defaultTransparencyEnabled,
      backgroundOpacity: config.defaultBackgroundOpacity
    }
  }

  /**
   * Update visibility default settings
   * @param {Object} visibilitySettings - New visibility defaults
   *
   * UI-006: Visibility defaults update
   * IMPLEMENTATION DECISION: Dedicated method for clean visibility settings management
   */
  async updateVisibilityDefaults (visibilitySettings) {
    const updates = {}

    if (visibilitySettings.textTheme !== undefined) {
      updates.defaultVisibilityTheme = visibilitySettings.textTheme
    }
    if (visibilitySettings.transparencyEnabled !== undefined) {
      updates.defaultTransparencyEnabled = visibilitySettings.transparencyEnabled
    }
    if (visibilitySettings.backgroundOpacity !== undefined) {
      updates.defaultBackgroundOpacity = visibilitySettings.backgroundOpacity
    }

    await this.updateConfig(updates)
  }

  /**
   * Get authentication token
   * @returns {Promise<string>} Auth token or empty string
   *
   * IMPL-CONFIG_MIGRATION: Secure authentication token retrieval
   * IMPLEMENTATION DECISION: Return empty string on failure to ensure graceful degradation
   */
  async getAuthToken () {
    try {
      // IMPL-CONFIG_MIGRATION: Use sync storage for authentication data synchronization across devices
      const result = await chrome.storage.sync.get(this.storageKeys.AUTH_TOKEN)
      return result[this.storageKeys.AUTH_TOKEN] || ''
    } catch (error) {
      console.error('Failed to get auth token:', error)
      // IMPL-CONFIG_MIGRATION: Graceful degradation - return empty string to allow detection of no-auth state
      return ''
    }
  }

  /**
   * Set authentication token
   * @param {string} token - Pinboard API token
   *
   * IMPL-CONFIG_MIGRATION: Secure authentication token storage
   * IMPLEMENTATION DECISION: Use sync storage for cross-device authentication
   */
  async setAuthToken (token) {
    try {
      // IMPL-CONFIG_MIGRATION: Store token in sync storage for device synchronization
      await chrome.storage.sync.set({
        [this.storageKeys.AUTH_TOKEN]: token
      })
    } catch (error) {
      console.error('Failed to set auth token:', error)
      // IMPL-CONFIG_MIGRATION: Re-throw to allow caller to handle authentication failures
      throw error
    }
  }

  /**
   * Check if authentication token exists
   * @returns {Promise<boolean>} Whether token exists
   *
   * IMPL-CONFIG_MIGRATION: Authentication state validation
   * IMPLEMENTATION DECISION: Simple boolean check for authentication state
   */
  async hasAuthToken () {
    const token = await this.getAuthToken()
    // IMPL-CONFIG_MIGRATION: Token existence check - non-empty string indicates configured authentication
    return token.length > 0
  }

  /**
   * Get authentication token formatted for API requests
   * @returns {Promise<string>} Token formatted as URL parameter
   *
   * IMPL-CONFIG_MIGRATION: API-ready authentication parameter formatting
   * IMPLEMENTATION DECISION: Pre-format token for consistent API usage
   */
  async getAuthTokenParam () {
    const token = await this.getAuthToken()
    // IMPL-CONFIG_MIGRATION: Format token as URL parameter for Pinboard API compatibility
    return `auth_token=${token}`
  }

  /**
   * [IMPL-URL_INHIBITION] [ARCH-CONFIG_STRUCTURE] [REQ-SITE_MANAGEMENT] Get inhibited URLs list (newline-separated).
   * @returns {Promise<string[]>} Array of inhibited URLs
   */
  async getInhibitUrls () {
    try {
      // IMPL-URL_INHIBITION: Retrieve inhibition list from storage
      const result = await chrome.storage.sync.get(this.storageKeys.INHIBIT_URLS)
      const inhibitString = result[this.storageKeys.INHIBIT_URLS] || ''
      // IMPL-URL_INHIBITION: Parse newline-separated URLs and filter empty entries
      return inhibitString.split('\n').filter(url => url.trim().length > 0)
    } catch (error) {
      console.error('Failed to get inhibit URLs:', error)
      // IMPL-URL_INHIBITION: Return empty array on failure to allow normal operation
      return []
    }
  }

  /**
   * [IMPL-URL_INHIBITION] [ARCH-CONFIG_STRUCTURE] [REQ-SITE_MANAGEMENT] Add URL to inhibit list (no duplicate).
   * @param {string} url - URL to inhibit
   */
  async addInhibitUrl (url) {
    try {
      // Normalize: strip protocol (http/https) for matching
      const normalizedUrl = url.replace(/^https?:\/\//, '')
      const current = await this.getInhibitUrls()
      if (!current.includes(normalizedUrl)) {
        // IMPL-URL_INHIBITION: Add URL only if not already present
        current.push(normalizedUrl)
        const inhibitString = current.join('\n')
        // IMPL-URL_INHIBITION: Store updated inhibition list
        await chrome.storage.sync.set({
          [this.storageKeys.INHIBIT_URLS]: inhibitString
        })
      }
      // IMPL-URL_INHIBITION: Return formatted inhibition string for legacy compatibility
      return { inhibit: current.join('\n') }
    } catch (error) {
      console.error('Failed to add inhibit URL:', error)
      throw error
    }
  }

  /**
   * [IMPL-URL_INHIBITION] [ARCH-CONFIG_STRUCTURE] [REQ-SITE_MANAGEMENT] Set inhibit URLs list (replaces existing).
   * @param {string[]} urls - Array of URLs to inhibit
   */
  async setInhibitUrls (urls) {
    try {
      // IMPL-URL_INHIBITION: Replace entire inhibition list
      const inhibitString = urls.join('\n')
      await chrome.storage.sync.set({
        [this.storageKeys.INHIBIT_URLS]: inhibitString
      })
    } catch (error) {
      console.error('Failed to set inhibit URLs:', error)
      throw error
    }
  }

  /**
   * [IMPL-URL_INHIBITION] [ARCH-CONFIG_STRUCTURE] [REQ-SITE_MANAGEMENT] Check if URL is allowed (not in inhibit list; substring match).
   * @param {string} url - URL to check
   * @returns {Promise<boolean>} Whether URL is allowed
   */
  async isUrlAllowed (url) {
    try {
      const inhibitUrls = await this.getInhibitUrls()
      // Normalize: strip protocol for matching
      const normalizedUrl = url.replace(/^https?:\/\//, '')
      // IMPL-URL_INHIBITION: Check both directions for substring matching (flexible pattern matching)
      return !inhibitUrls.some(inhibitUrl =>
        normalizedUrl.includes(inhibitUrl) || inhibitUrl.includes(normalizedUrl)
      )
    } catch (error) {
      console.error('Failed to check URL allowance:', error)
      // IMPL-URL_INHIBITION: Default to allowing on error to avoid breaking functionality
      return true // Default to allowing if check fails
    }
  }

  /**
   * Get stored settings from storage
   * @returns {Promise<Object>} Stored settings
   *
   * IMPL-FEATURE_FLAGS: Core settings retrieval with error handling
   * IMPLEMENTATION DECISION: Return empty object on failure to allow default merging
   */
  async getStoredSettings () {
    try {
      // IMPL-FEATURE_FLAGS: Retrieve settings from sync storage
      const result = await chrome.storage.sync.get(this.storageKeys.SETTINGS)
      const stored = result[this.storageKeys.SETTINGS]

      // IMPL-FEATURE_FLAGS: Handle corrupted data (string instead of object)
      if (typeof stored === 'string') {
        try {
          return JSON.parse(stored)
        } catch (parseError) {
          console.error('Failed to parse stored settings:', parseError)
          return {}
        }
      }

      return stored || {}
    } catch (error) {
      console.error('Failed to get stored settings:', error)
      // IMPL-FEATURE_FLAGS: Return empty object to trigger default configuration usage
      return {}
    }
  }

  /**
   * Save settings to storage
   * @param {Object} settings - Settings to save
   *
   * IMPL-FEATURE_FLAGS: Settings persistence with error propagation
   * IMPLEMENTATION DECISION: Let errors propagate to caller for proper error handling
   */
  async saveSettings (settings) {
    try {
      // IMPL-FEATURE_FLAGS: Store settings in sync storage for cross-device synchronization
      await chrome.storage.sync.set({
        [this.storageKeys.SETTINGS]: settings
      })
    } catch (error) {
      console.error('Failed to save settings:', error)
      // IMPL-FEATURE_FLAGS: Re-throw to allow caller to handle save failures
      throw error
    }
  }

  /**
   * Reset all settings to defaults
   *
   * IMPL-FEATURE_FLAGS: Configuration reset functionality
   * IMPLEMENTATION DECISION: Simple replacement with defaults for clean reset
   */
  async resetToDefaults () {
    // IMPL-FEATURE_FLAGS: Replace all settings with default configuration
    await this.saveSettings(this.defaultConfig)
  }

  /**
   * Export configuration for backup
   * @returns {Promise<Object>} Complete configuration export
   *
   * IMPL-CONFIG_BACKUP_RESTORE: Configuration backup and portability
   * IMPLEMENTATION DECISION: Include all configuration data with metadata for validation
   */
  async exportConfig () {
    // IMPL-CONFIG_BACKUP_RESTORE: Gather all configuration data in parallel for efficiency
    const [settings, token, inhibitUrls] = await Promise.all([
      this.getStoredSettings(),
      this.getAuthToken(),
      this.getInhibitUrls()
    ])

    // IMPL-CONFIG_BACKUP_RESTORE: Create comprehensive configuration export with metadata
    return {
      settings,
      authToken: token,
      inhibitUrls,
      exportDate: new Date().toISOString(),
      version: '1.0.0' // Version for import compatibility checking
    }
  }

  /**
   * Import configuration from backup
   * @param {Object} configData - Configuration data to import
   *
   * IMPL-CONFIG_BACKUP_RESTORE: Configuration restoration from backup
   * IMPLEMENTATION DECISION: Selective import allows partial configuration restoration
   */
  async importConfig (configData) {
    // IMPL-CONFIG_BACKUP_RESTORE: Import settings if present in backup
    if (configData.settings) {
      await this.saveSettings(configData.settings)
    }

    // IMPL-CONFIG_MIGRATION: Import authentication token if present
    if (configData.authToken) {
      await this.setAuthToken(configData.authToken)
    }

    // IMPL-URL_INHIBITION: Import inhibition list if present
    if (configData.inhibitUrls) {
      const inhibitString = configData.inhibitUrls.join('\n')
      await chrome.storage.sync.set({
        [this.storageKeys.INHIBIT_URLS]: inhibitString
      })
    }
  }

  /**
   * [IMMUTABLE-REQ-TAG-001] - Enhanced tag storage management
   * @param {string[]} tags - Array of tags to store
   * @returns {Promise<void>}
   */
  async updateRecentTags (tags) {
    try {
      // [IMMUTABLE-REQ-TAG-001] - Validate tags array
      if (!Array.isArray(tags)) {
        console.warn('[IMMUTABLE-REQ-TAG-001] Invalid tags array provided')
        return
      }

      // [IMMUTABLE-REQ-TAG-001] - Enforce storage limits
      const config = await this.getConfig()
      const maxTags = config.recentTagsCountMax || 50
      const limitedTags = tags.slice(0, maxTags)

      // [IMMUTABLE-REQ-TAG-001] - Store tags with timestamp
      await chrome.storage.sync.set({
        [this.storageKeys.RECENT_TAGS]: {
          tags: limitedTags,
          timestamp: Date.now(),
          count: limitedTags.length
        }
      })
    } catch (error) {
      console.error('[IMMUTABLE-REQ-TAG-001] Failed to update recent tags:', error)

      // [IMMUTABLE-REQ-TAG-001] - Fallback to local storage
      try {
        await chrome.storage.local.set({
          [this.storageKeys.RECENT_TAGS]: {
            tags: tags.slice(0, 50),
            timestamp: Date.now(),
            count: Math.min(tags.length, 50)
          }
        })
      } catch (fallbackError) {
        console.error('[IMMUTABLE-REQ-TAG-001] Fallback storage also failed:', fallbackError)
      }
    }
  }

  /**
   * [IMMUTABLE-REQ-TAG-001] - Get recent tags with deduplication
   * @returns {Promise<string[]>} Array of recent tags
   */
  async getRecentTags () {
    try {
      // [IMMUTABLE-REQ-TAG-001] - Try sync storage first
      const syncResult = await chrome.storage.sync.get(this.storageKeys.RECENT_TAGS)
      if (syncResult[this.storageKeys.RECENT_TAGS]) {
        return syncResult[this.storageKeys.RECENT_TAGS].tags || []
      }

      // [IMMUTABLE-REQ-TAG-001] - Fallback to local storage
      const localResult = await chrome.storage.local.get(this.storageKeys.RECENT_TAGS)
      if (localResult[this.storageKeys.RECENT_TAGS]) {
        return localResult[this.storageKeys.RECENT_TAGS].tags || []
      }

      return []
    } catch (error) {
      console.error('[IMMUTABLE-REQ-TAG-001] Failed to get recent tags:', error)
      return []
    }
  }

  /**
   * [IMMUTABLE-REQ-TAG-001] - Get tag frequency data
   * @returns {Promise<Object>} Tag frequency map
   */
  async getTagFrequency () {
    try {
      const result = await chrome.storage.local.get(this.storageKeys.TAG_FREQUENCY)
      return result[this.storageKeys.TAG_FREQUENCY] || {}
    } catch (error) {
      console.error('[IMMUTABLE-REQ-TAG-001] Failed to get tag frequency:', error)
      return {}
    }
  }

  /**
   * [IMMUTABLE-REQ-TAG-001] - Update tag frequency
   * @param {Object} frequency - Updated frequency map
   * @returns {Promise<void>}
   */
  async updateTagFrequency (frequency) {
    try {
      await chrome.storage.local.set({
        [this.storageKeys.TAG_FREQUENCY]: frequency
      })
    } catch (error) {
      console.error('[IMMUTABLE-REQ-TAG-001] Failed to update tag frequency:', error)
    }
  }

  /**
   * [IMMUTABLE-REQ-TAG-001] - Clean up old tags to manage storage
   * @returns {Promise<void>}
   */
  async cleanupOldTags () {
    try {
      const config = await this.getConfig()
      const maxTags = config.recentTagsCountMax || 50

      const recentTags = await this.getRecentTags()
      if (recentTags.length > maxTags) {
        const trimmedTags = recentTags.slice(0, maxTags)
        await this.updateRecentTags(trimmedTags)
      }
    } catch (error) {
      console.error('[IMMUTABLE-REQ-TAG-001] Failed to cleanup old tags:', error)
    }
  }
}
