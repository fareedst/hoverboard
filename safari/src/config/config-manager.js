/**
 * Configuration Manager - Modern settings and authentication management
 * Replaces legacy config.js constants and AuthSettings class
 *
 * CFG-001: Central configuration management system
 * CFG-002: Authentication token secure storage and validation
 * CFG-003: User settings persistence and synchronization
 * CFG-004: URL inhibition management for site-specific behavior
 */

export class ConfigManager {
  constructor () {
    // CFG-001: Standardized storage key naming convention
    // SPECIFICATION: Use prefixed keys to avoid conflicts with other extensions
    this.storageKeys = {
      AUTH_TOKEN: 'hoverboard_auth_token',
      SETTINGS: 'hoverboard_settings',
      INHIBIT_URLS: 'hoverboard_inhibit_urls',
      RECENT_TAGS: 'hoverboard_recent_tags', // [IMMUTABLE-REQ-TAG-001] - Tag storage key
      TAG_FREQUENCY: 'hoverboard_tag_frequency' // [IMMUTABLE-REQ-TAG-001] - Tag frequency storage key
    }

    // CFG-003: Default configuration provides baseline behavior
    // IMPLEMENTATION DECISION: All settings have sensible defaults to ensure functionality without user configuration
    this.defaultConfig = this.getDefaultConfiguration()
  }

  /**
   * Get default configuration values
   * Migrated from src/shared/config.js
   *
   * CFG-003: Feature flags and UI behavior control defaults
   * SPECIFICATION: Each setting controls specific extension behavior
   * IMPLEMENTATION DECISION: Conservative defaults favor user privacy and minimal intrusion
   */
  getDefaultConfiguration () {
    return {
      // CFG-003: Feature flags - Core functionality toggles
      // IMPLEMENTATION DECISION: Enable helpful features by default, disable potentially intrusive ones
      hoverShowRecentTags: true, // Show recent tags in hover overlay
      hoverShowTooltips: false, // Tooltips disabled by default to avoid visual clutter
      showHoverOnPageLoad: false, // No automatic hover to respect user intent
      showHoverOPLOnlyIfNoTags: true, // Smart overlay display logic
      showHoverOPLOnlyIfSomeTags: false, // Complementary to above setting
      inhibitSitesOnPageLoad: true, // Respect site-specific inhibition settings
      setIconOnLoad: true, // Update extension icon to reflect bookmark status

      // CFG-003: UI behavior settings - User experience configuration
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

      // CFG-003: Badge configuration - Extension icon indicator settings
      // IMPLEMENTATION DECISION: Clear visual indicators for different bookmark states
      badgeTextIfNotBookmarked: '-', // Clear indication of non-bookmarked state
      badgeTextIfPrivate: '*', // Privacy indicator
      badgeTextIfQueued: '!', // Pending action indicator
      badgeTextIfBookmarkedNoTags: '0', // Zero tags indicator

      // CFG-002: API retry configuration - Network resilience settings
      // IMPLEMENTATION DECISION: Conservative retry strategy to avoid API rate limiting
      pinRetryCountMax: 2, // Maximum retry attempts
      pinRetryDelay: 1000, // in ms - delay between retries

      // ⭐ UI-006: Visibility Controls - 🎨 Per-window overlay appearance defaults
      // IMPLEMENTATION DECISION: Conservative defaults for broad compatibility and readability
      defaultVisibilityTheme: 'light-on-dark', // 'light-on-dark' | 'dark-on-light' - Dark theme default
      defaultTransparencyEnabled: false, // Conservative default - solid background for readability
      defaultBackgroundOpacity: 90, // 10-100% - High opacity default for good contrast
      overlayPositionMode: 'default' // 'default' | 'bottom-fixed' - Keep existing position setting
    }
  }

  /**
   * Initialize default settings on first installation
   *
   * CFG-003: First-run initialization ensures extension works immediately
   * IMPLEMENTATION DECISION: Only initialize if no settings exist to preserve user customizations
   */
  async initializeDefaults () {
    const existingSettings = await this.getStoredSettings()
    if (!existingSettings || Object.keys(existingSettings).length === 0) {
      // CFG-003: Store defaults only on first run
      await this.saveSettings(this.defaultConfig)
    }
  }

  /**
   * Get complete configuration object
   * @returns {Promise<Object>} Configuration object
   *
   * CFG-003: Configuration resolution with default fallback
   * IMPLEMENTATION DECISION: Merge defaults with stored settings to handle partial configurations
   */
  async getConfig () {
    const stored = await this.getStoredSettings()
    // If stored is not a plain object, treat as corrupted and use defaults
    if (!stored || typeof stored !== 'object' || Array.isArray(stored)) {
      return { ...this.defaultConfig }
    }
    // CFG-003: Defaults ensure all required configuration keys are present
    return { ...this.defaultConfig, ...stored }
  }

  /**
   * Get user-configurable options (subset of config for UI)
   * @returns {Promise<Object>} Options object
   *
   * CFG-003: UI-specific configuration subset
   * IMPLEMENTATION DECISION: Only expose user-relevant settings to avoid configuration complexity
   */
  async getOptions () {
    const config = await this.getConfig()
    // CFG-003: Filtered configuration for user interface display
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
      uxShowSectionLabels: config.uxShowSectionLabels
    }
  }

  /**
   * Update specific configuration values
   * @param {Object} updates - Configuration updates
   *
   * CFG-003: Partial configuration updates with persistence
   * IMPLEMENTATION DECISION: Merge updates to preserve unmodified settings
   */
  async updateConfig (updates) {
    const current = await this.getConfig()
    const updated = { ...current, ...updates }
    // CFG-003: Persist merged configuration
    await this.saveSettings(updated)
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
   * CFG-002: Secure authentication token retrieval
   * IMPLEMENTATION DECISION: Return empty string on failure to ensure graceful degradation
   */
  async getAuthToken () {
    try {
      // CFG-002: Use sync storage for authentication data synchronization across devices
      const result = await chrome.storage.sync.get(this.storageKeys.AUTH_TOKEN)
      return result[this.storageKeys.AUTH_TOKEN] || ''
    } catch (error) {
      console.error('Failed to get auth token:', error)
      // CFG-002: Graceful degradation - return empty string to allow detection of no-auth state
      return ''
    }
  }

  /**
   * Set authentication token
   * @param {string} token - Pinboard API token
   *
   * CFG-002: Secure authentication token storage
   * IMPLEMENTATION DECISION: Use sync storage for cross-device authentication
   */
  async setAuthToken (token) {
    try {
      // CFG-002: Store token in sync storage for device synchronization
      await chrome.storage.sync.set({
        [this.storageKeys.AUTH_TOKEN]: token
      })
    } catch (error) {
      console.error('Failed to set auth token:', error)
      // CFG-002: Re-throw to allow caller to handle authentication failures
      throw error
    }
  }

  /**
   * Check if authentication token exists
   * @returns {Promise<boolean>} Whether token exists
   *
   * CFG-002: Authentication state validation
   * IMPLEMENTATION DECISION: Simple boolean check for authentication state
   */
  async hasAuthToken () {
    const token = await this.getAuthToken()
    // CFG-002: Token existence check - non-empty string indicates configured authentication
    return token.length > 0
  }

  /**
   * Get authentication token formatted for API requests
   * @returns {Promise<string>} Token formatted as URL parameter
   *
   * CFG-002: API-ready authentication parameter formatting
   * IMPLEMENTATION DECISION: Pre-format token for consistent API usage
   */
  async getAuthTokenParam () {
    const token = await this.getAuthToken()
    // CFG-002: Format token as URL parameter for Pinboard API compatibility
    return `auth_token=${token}`
  }

  /**
   * Get inhibited URLs list
   * @returns {Promise<string[]>} Array of inhibited URLs
   *
   * CFG-004: Site-specific behavior control through URL inhibition
   * IMPLEMENTATION DECISION: Store URLs as newline-separated string for user editing convenience
   */
  async getInhibitUrls () {
    try {
      // CFG-004: Retrieve inhibition list from storage
      const result = await chrome.storage.sync.get(this.storageKeys.INHIBIT_URLS)
      const inhibitString = result[this.storageKeys.INHIBIT_URLS] || ''
      // CFG-004: Parse newline-separated URLs and filter empty entries
      return inhibitString.split('\n').filter(url => url.trim().length > 0)
    } catch (error) {
      console.error('Failed to get inhibit URLs:', error)
      // CFG-004: Return empty array on failure to allow normal operation
      return []
    }
  }

  /**
   * Add URL to inhibit list
   * @param {string} url - URL to inhibit
   *
   * CFG-004: Dynamic inhibition list management
   * IMPLEMENTATION DECISION: Check for duplicates to maintain clean inhibition list
   */
  async addInhibitUrl (url) {
    try {
      // Normalize: strip protocol (http/https) for matching
      const normalizedUrl = url.replace(/^https?:\/\//, '')
      const current = await this.getInhibitUrls()
      if (!current.includes(normalizedUrl)) {
        // CFG-004: Add URL only if not already present
        current.push(normalizedUrl)
        const inhibitString = current.join('\n')
        // CFG-004: Store updated inhibition list
        await chrome.storage.sync.set({
          [this.storageKeys.INHIBIT_URLS]: inhibitString
        })
      }
      // CFG-004: Return formatted inhibition string for legacy compatibility
      return { inhibit: current.join('\n') }
    } catch (error) {
      console.error('Failed to add inhibit URL:', error)
      throw error
    }
  }

  /**
   * Set inhibit URLs list (replaces existing list)
   * @param {string[]} urls - Array of URLs to inhibit
   *
   * CFG-004: Complete inhibition list replacement
   * IMPLEMENTATION DECISION: Allow bulk replacement for configuration import/reset scenarios
   */
  async setInhibitUrls (urls) {
    try {
      // CFG-004: Replace entire inhibition list
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
   * Check if URL is allowed (not in inhibit list)
   * @param {string} url - URL to check
   * @returns {Promise<boolean>} Whether URL is allowed
   *
   * CFG-004: URL filtering logic for site-specific behavior
   * IMPLEMENTATION DECISION: Bidirectional substring matching for flexible URL patterns
   */
  async isUrlAllowed (url) {
    try {
      const inhibitUrls = await this.getInhibitUrls()
      // Normalize: strip protocol for matching
      const normalizedUrl = url.replace(/^https?:\/\//, '')
      // CFG-004: Check both directions for substring matching (flexible pattern matching)
      return !inhibitUrls.some(inhibitUrl =>
        normalizedUrl.includes(inhibitUrl) || inhibitUrl.includes(normalizedUrl)
      )
    } catch (error) {
      console.error('Failed to check URL allowance:', error)
      // CFG-004: Default to allowing on error to avoid breaking functionality
      return true // Default to allowing if check fails
    }
  }

  /**
   * Get stored settings from storage
   * @returns {Promise<Object>} Stored settings
   *
   * CFG-003: Core settings retrieval with error handling
   * IMPLEMENTATION DECISION: Return empty object on failure to allow default merging
   */
  async getStoredSettings () {
    try {
      // CFG-003: Retrieve settings from sync storage
      const result = await chrome.storage.sync.get(this.storageKeys.SETTINGS)
      const stored = result[this.storageKeys.SETTINGS]

      // CFG-003: Handle corrupted data (string instead of object)
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
      // CFG-003: Return empty object to trigger default configuration usage
      return {}
    }
  }

  /**
   * Save settings to storage
   * @param {Object} settings - Settings to save
   *
   * CFG-003: Settings persistence with error propagation
   * IMPLEMENTATION DECISION: Let errors propagate to caller for proper error handling
   */
  async saveSettings (settings) {
    try {
      // CFG-003: Store settings in sync storage for cross-device synchronization
      await chrome.storage.sync.set({
        [this.storageKeys.SETTINGS]: settings
      })
    } catch (error) {
      console.error('Failed to save settings:', error)
      // CFG-003: Re-throw to allow caller to handle save failures
      throw error
    }
  }

  /**
   * Reset all settings to defaults
   *
   * CFG-003: Configuration reset functionality
   * IMPLEMENTATION DECISION: Simple replacement with defaults for clean reset
   */
  async resetToDefaults () {
    // CFG-003: Replace all settings with default configuration
    await this.saveSettings(this.defaultConfig)
  }

  /**
   * Export configuration for backup
   * @returns {Promise<Object>} Complete configuration export
   *
   * CFG-001: Configuration backup and portability
   * IMPLEMENTATION DECISION: Include all configuration data with metadata for validation
   */
  async exportConfig () {
    // CFG-001: Gather all configuration data in parallel for efficiency
    const [settings, token, inhibitUrls] = await Promise.all([
      this.getStoredSettings(),
      this.getAuthToken(),
      this.getInhibitUrls()
    ])

    // CFG-001: Create comprehensive configuration export with metadata
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
   * CFG-001: Configuration restoration from backup
   * IMPLEMENTATION DECISION: Selective import allows partial configuration restoration
   */
  async importConfig (configData) {
    // CFG-001: Import settings if present in backup
    if (configData.settings) {
      await this.saveSettings(configData.settings)
    }

    // CFG-002: Import authentication token if present
    if (configData.authToken) {
      await this.setAuthToken(configData.authToken)
    }

    // CFG-004: Import inhibition list if present
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

      console.log('[IMMUTABLE-REQ-TAG-001] Recent tags updated:', limitedTags.length)
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
        console.log('[IMMUTABLE-REQ-TAG-001] Fallback to local storage successful')
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
        console.log('[IMMUTABLE-REQ-TAG-001] Cleaned up old tags, kept:', trimmedTags.length)
      }
    } catch (error) {
      console.error('[IMMUTABLE-REQ-TAG-001] Failed to cleanup old tags:', error)
    }
  }
}
