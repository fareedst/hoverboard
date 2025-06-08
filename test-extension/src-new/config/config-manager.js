/**
 * Configuration Manager - Modern settings and authentication management
 * Replaces legacy config.js constants and AuthSettings class
 */

export class ConfigManager {
  constructor () {
    this.storageKeys = {
      AUTH_TOKEN: 'hoverboard_auth_token',
      SETTINGS: 'hoverboard_settings',
      INHIBIT_URLS: 'hoverboard_inhibit_urls'
    }

    this.defaultConfig = this.getDefaultConfiguration()
  }

  /**
   * Get default configuration values
   * Migrated from src/shared/config.js
   */
  getDefaultConfiguration () {
    return {
      // Feature flags
      hoverShowRecentTags: true,
      hoverShowTooltips: false,
      showHoverOnPageLoad: false,
      showHoverOPLOnlyIfNoTags: true,
      showHoverOPLOnlyIfSomeTags: false,
      inhibitSitesOnPageLoad: true,
      setIconOnLoad: true,

      // UI behavior
      recentTagsCountMax: 32,
      initRecentPostsCount: 15,
      uxAutoCloseTimeout: 0, // in ms, 0 to disable
      uxRecentRowWithBlock: true,
      uxRecentRowWithBookmarkButton: true,
      uxRecentRowWithCloseButton: true,
      uxRecentRowWithPrivateButton: true,
      uxRecentRowWithDeletePin: true,
      uxRecentRowWithInput: true,
      uxUrlStripHash: false,

      // Badge configuration
      badgeTextIfNotBookmarked: '-',
      badgeTextIfPrivate: '*',
      badgeTextIfQueued: '!',
      badgeTextIfBookmarkedNoTags: '0',

      // API retry configuration
      pinRetryCountMax: 2,
      pinRetryDelay: 1000 // in ms
    }
  }

  /**
   * Initialize default settings on first installation
   */
  async initializeDefaults () {
    const existingSettings = await this.getStoredSettings()
    if (!existingSettings || Object.keys(existingSettings).length === 0) {
      await this.saveSettings(this.defaultConfig)
    }
  }

  /**
   * Get complete configuration object
   * @returns {Promise<Object>} Configuration object
   */
  async getConfig () {
    const stored = await this.getStoredSettings()
    return { ...this.defaultConfig, ...stored }
  }

  /**
   * Get user-configurable options (subset of config for UI)
   * @returns {Promise<Object>} Options object
   */
  async getOptions () {
    const config = await this.getConfig()
    return {
      badgeTextIfBookmarkedNoTags: config.badgeTextIfBookmarkedNoTags,
      badgeTextIfNotBookmarked: config.badgeTextIfNotBookmarked,
      badgeTextIfPrivate: config.badgeTextIfPrivate,
      badgeTextIfQueued: config.badgeTextIfQueued,
      recentPostsCount: config.initRecentPostsCount,
      showHoverOnPageLoad: config.showHoverOnPageLoad,
      hoverShowTooltips: config.hoverShowTooltips
    }
  }

  /**
   * Update specific configuration values
   * @param {Object} updates - Configuration updates
   */
  async updateConfig (updates) {
    const current = await this.getConfig()
    const updated = { ...current, ...updates }
    await this.saveSettings(updated)
  }

  /**
   * Get authentication token
   * @returns {Promise<string>} Auth token or empty string
   */
  async getAuthToken () {
    try {
      const result = await chrome.storage.sync.get(this.storageKeys.AUTH_TOKEN)
      return result[this.storageKeys.AUTH_TOKEN] || ''
    } catch (error) {
      console.error('Failed to get auth token:', error)
      return ''
    }
  }

  /**
   * Set authentication token
   * @param {string} token - Pinboard API token
   */
  async setAuthToken (token) {
    try {
      await chrome.storage.sync.set({
        [this.storageKeys.AUTH_TOKEN]: token
      })
    } catch (error) {
      console.error('Failed to set auth token:', error)
      throw error
    }
  }

  /**
   * Check if authentication token exists
   * @returns {Promise<boolean>} Whether token exists
   */
  async hasAuthToken () {
    const token = await this.getAuthToken()
    return token.length > 0
  }

  /**
   * Get authentication token formatted for API requests
   * @returns {Promise<string>} Token formatted as URL parameter
   */
  async getAuthTokenParam () {
    const token = await this.getAuthToken()
    return `auth_token=${token}`
  }

  /**
   * Get inhibited URLs list
   * @returns {Promise<string[]>} Array of inhibited URLs
   */
  async getInhibitUrls () {
    try {
      const result = await chrome.storage.sync.get(this.storageKeys.INHIBIT_URLS)
      const inhibitString = result[this.storageKeys.INHIBIT_URLS] || ''
      return inhibitString.split('\n').filter(url => url.trim().length > 0)
    } catch (error) {
      console.error('Failed to get inhibit URLs:', error)
      return []
    }
  }

  /**
   * Add URL to inhibit list
   * @param {string} url - URL to inhibit
   */
  async addInhibitUrl (url) {
    try {
      const current = await this.getInhibitUrls()
      if (!current.includes(url)) {
        current.push(url)
        const inhibitString = current.join('\n')
        await chrome.storage.sync.set({
          [this.storageKeys.INHIBIT_URLS]: inhibitString
        })
      }
      return { inhibit: current.join('\n') }
    } catch (error) {
      console.error('Failed to add inhibit URL:', error)
      throw error
    }
  }

  /**
   * Check if URL is allowed (not in inhibit list)
   * @param {string} url - URL to check
   * @returns {Promise<boolean>} Whether URL is allowed
   */
  async isUrlAllowed (url) {
    try {
      const inhibitUrls = await this.getInhibitUrls()
      return !inhibitUrls.some(inhibitUrl =>
        url.includes(inhibitUrl) || inhibitUrl.includes(url)
      )
    } catch (error) {
      console.error('Failed to check URL allowance:', error)
      return true // Default to allowing if check fails
    }
  }

  /**
   * Get stored settings from storage
   * @returns {Promise<Object>} Stored settings
   */
  async getStoredSettings () {
    try {
      const result = await chrome.storage.sync.get(this.storageKeys.SETTINGS)
      return result[this.storageKeys.SETTINGS] || {}
    } catch (error) {
      console.error('Failed to get stored settings:', error)
      return {}
    }
  }

  /**
   * Save settings to storage
   * @param {Object} settings - Settings to save
   */
  async saveSettings (settings) {
    try {
      await chrome.storage.sync.set({
        [this.storageKeys.SETTINGS]: settings
      })
    } catch (error) {
      console.error('Failed to save settings:', error)
      throw error
    }
  }

  /**
   * Reset all settings to defaults
   */
  async resetToDefaults () {
    await this.saveSettings(this.defaultConfig)
  }

  /**
   * Export configuration for backup
   * @returns {Promise<Object>} Complete configuration export
   */
  async exportConfig () {
    const [settings, token, inhibitUrls] = await Promise.all([
      this.getStoredSettings(),
      this.getAuthToken(),
      this.getInhibitUrls()
    ])

    return {
      settings,
      authToken: token,
      inhibitUrls,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    }
  }

  /**
   * Import configuration from backup
   * @param {Object} configData - Configuration data to import
   */
  async importConfig (configData) {
    if (configData.settings) {
      await this.saveSettings(configData.settings)
    }

    if (configData.authToken) {
      await this.setAuthToken(configData.authToken)
    }

    if (configData.inhibitUrls) {
      const inhibitString = configData.inhibitUrls.join('\n')
      await chrome.storage.sync.set({
        [this.storageKeys.INHIBIT_URLS]: inhibitString
      })
    }
  }
}
