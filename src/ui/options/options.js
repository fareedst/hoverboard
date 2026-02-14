/**
 * Options Page Controller - Modern settings management
 * Handles user configuration with validation and persistence
 */

import { ConfigManager } from '../../config/config-manager.js'
import { PinboardService } from '../../features/pinboard/pinboard-service.js'

class OptionsController {
  constructor () {
    this.configManager = new ConfigManager()
    this.pinboardService = new PinboardService()
    this.elements = {}
    this.isLoading = false

    this.init()
  }

  async init () {
    this.bindElements()
    this.attachEventListeners()
    await this.loadSettings()
  }

  bindElements () {
    // [ARCH-LOCAL_STORAGE_PROVIDER] Storage mode
    this.elements.storageModePinboard = document.getElementById('storage-mode-pinboard')
    this.elements.storageModeLocal = document.getElementById('storage-mode-local')
    this.elements.authSection = document.getElementById('auth-section')

    // Authentication
    this.elements.authToken = document.getElementById('auth-token')
    this.elements.testAuth = document.getElementById('test-auth')

    // Display settings
    this.elements.showHoverOnLoad = document.getElementById('show-hover-on-load')
    this.elements.hoverShowTooltips = document.getElementById('hover-show-tooltips')
    this.elements.recentPostsCount = document.getElementById('recent-posts-count')
    this.elements.showSectionLabels = document.getElementById('show-section-labels')

    // Visibility defaults
    this.elements.defaultThemeToggle = document.getElementById('default-theme-toggle')
    this.elements.defaultTransparencyEnabled = document.getElementById('default-transparency-enabled')
    this.elements.defaultBackgroundOpacity = document.getElementById('default-background-opacity')
    this.elements.visibilityPreview = document.getElementById('visibility-preview')
    this.elements.opacityValue = document.querySelector('.opacity-value')
    this.elements.opacitySetting = document.querySelector('.opacity-setting')

    // Font size settings
    this.elements.fontSizeSuggestedTags = document.getElementById('font-size-suggested-tags')
    this.elements.fontSizeLabels = document.getElementById('font-size-labels')
    this.elements.fontSizeTags = document.getElementById('font-size-tags')
    this.elements.fontSizeBase = document.getElementById('font-size-base')
    this.elements.fontSizeInputs = document.getElementById('font-size-inputs')

    // Badge settings
    this.elements.badgeNotBookmarked = document.getElementById('badge-not-bookmarked')
    this.elements.badgeNoTags = document.getElementById('badge-no-tags')
    this.elements.badgePrivate = document.getElementById('badge-private')
    this.elements.badgeToRead = document.getElementById('badge-to-read')

    // Site management
    this.elements.inhibitUrls = document.getElementById('inhibit-urls')

    // Advanced settings
    this.elements.stripUrlHash = document.getElementById('strip-url-hash')
    this.elements.autoCloseTimeout = document.getElementById('auto-close-timeout')

    // Actions
    this.elements.saveSettings = document.getElementById('save-settings')
    this.elements.resetSettings = document.getElementById('reset-settings')
    this.elements.exportSettings = document.getElementById('export-settings')
    this.elements.importSettings = document.getElementById('import-settings')
    this.elements.importFile = document.getElementById('import-file')

    // Status
    this.elements.statusMessage = document.getElementById('status-message')
  }

  attachEventListeners () {
    // [ARCH-LOCAL_STORAGE_PROVIDER] Storage mode change: save and notify service worker
    this.elements.storageModePinboard.addEventListener('change', () => this.onStorageModeChange('pinboard'))
    this.elements.storageModeLocal.addEventListener('change', () => this.onStorageModeChange('local'))

    // Authentication
    this.elements.testAuth.addEventListener('click', () => this.testAuthentication())

    // Visibility defaults
    this.elements.defaultThemeToggle.addEventListener('click', () => this.toggleDefaultTheme())
    this.elements.defaultTransparencyEnabled.addEventListener('change', () => this.updateTransparencyState())
    this.elements.defaultBackgroundOpacity.addEventListener('input', () => this.updateOpacityDisplay())

    // Actions
    this.elements.saveSettings.addEventListener('click', () => this.saveSettings())
    this.elements.resetSettings.addEventListener('click', () => this.resetSettings())
    this.elements.exportSettings.addEventListener('click', () => this.exportSettings())
    this.elements.importSettings.addEventListener('click', () => this.elements.importFile.click())
    this.elements.importFile.addEventListener('change', (e) => this.importSettings(e))

    // Auto-save on input changes (debounced)
    const inputs = document.querySelectorAll('input, textarea')
    inputs.forEach(input => {
      input.addEventListener('input', this.debounce(() => this.autoSave(), 1000))
    })
  }

  async loadSettings () {
    try {
      this.setLoading(true)

      // Ensure defaults are initialized (helps with existing installations)
      await this.configManager.initializeDefaults()

      // Load configuration
      const config = await this.configManager.getConfig()
      const authToken = await this.configManager.getAuthToken()
      const inhibitUrls = await this.configManager.getInhibitUrls()

      // [ARCH-LOCAL_STORAGE_PROVIDER] Storage mode
      const storageMode = config.storageMode === 'local' ? 'local' : 'pinboard'
      this.elements.storageModePinboard.checked = (storageMode === 'pinboard')
      this.elements.storageModeLocal.checked = (storageMode === 'local')
      this.updateAuthSectionVisibility(storageMode)

      // Populate form fields
      this.elements.authToken.value = authToken
      this.elements.showHoverOnLoad.checked = config.showHoverOnPageLoad
      this.elements.hoverShowTooltips.checked = config.hoverShowTooltips
      this.elements.recentPostsCount.value = config.initRecentPostsCount
      this.elements.showSectionLabels.checked = config.uxShowSectionLabels

      this.elements.badgeNotBookmarked.value = config.badgeTextIfNotBookmarked
      this.elements.badgeNoTags.value = config.badgeTextIfBookmarkedNoTags
      this.elements.badgePrivate.value = config.badgeTextIfPrivate
      this.elements.badgeToRead.value = config.badgeTextIfQueued

      this.elements.inhibitUrls.value = inhibitUrls.join('\n')

      this.elements.stripUrlHash.checked = config.uxUrlStripHash
      this.elements.autoCloseTimeout.value = config.uxAutoCloseTimeout

      // Load visibility defaults
      this.elements.defaultTransparencyEnabled.checked = config.defaultTransparencyEnabled
      this.elements.defaultBackgroundOpacity.value = config.defaultBackgroundOpacity

      // Load font size settings
      this.elements.fontSizeSuggestedTags.value = config.fontSizeSuggestedTags || 10
      this.elements.fontSizeLabels.value = config.fontSizeLabels || 12
      this.elements.fontSizeTags.value = config.fontSizeTags || 12
      this.elements.fontSizeBase.value = config.fontSizeBase || 14
      this.elements.fontSizeInputs.value = config.fontSizeInputs || 14

      // Update visibility UI
      this.currentTheme = config.defaultVisibilityTheme
      this.updateThemeDisplay()
      this.updateTransparencyState()
      this.updateOpacityDisplay()
      this.updateVisibilityPreview()

      this.showStatus('Settings loaded successfully', 'success')
    } catch (error) {
      console.error('Failed to load settings:', error)
      this.showStatus('Failed to load settings: ' + error.message, 'error')
    } finally {
      this.setLoading(false)
    }
  }

  async saveSettings () {
    try {
      this.setLoading(true)

      // Validate inputs
      const validation = this.validateInputs()
      if (!validation.valid) {
        this.showStatus(validation.message, 'error')
        return
      }

      // Collect settings
      const storageMode = this.elements.storageModeLocal.checked ? 'local' : 'pinboard'
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
        fontSizeInputs: parseInt(this.elements.fontSizeInputs.value)
      }

      // Save configuration
      await this.configManager.updateConfig(settings)

      // Save auth token
      const authToken = this.elements.authToken.value.trim()
      if (authToken) {
        await this.configManager.setAuthToken(authToken)
      }

      // Save inhibit URLs
      const inhibitUrls = this.elements.inhibitUrls.value
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0)

      // Save the inhibit URLs using ConfigManager
      await this.configManager.setInhibitUrls(inhibitUrls)

      this.showStatus('Settings saved successfully!', 'success')
    } catch (error) {
      console.error('Failed to save settings:', error)
      this.showStatus('Failed to save settings: ' + error.message, 'error')
    } finally {
      this.setLoading(false)
    }
  }

  async resetSettings () {
    if (!confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      return
    }

    try {
      this.setLoading(true)

      await this.configManager.resetToDefaults()
      await this.loadSettings()

      this.showStatus('Settings reset to defaults', 'success')
    } catch (error) {
      console.error('Failed to reset settings:', error)
      this.showStatus('Failed to reset settings: ' + error.message, 'error')
    } finally {
      this.setLoading(false)
    }
  }

  /**
   * [ARCH-LOCAL_STORAGE_PROVIDER] Update auth section visibility based on storage mode.
   * @param {string} mode - 'pinboard' or 'local'
   */
  updateAuthSectionVisibility (mode) {
    if (!this.elements.authSection) return
    if (mode === 'local') {
      this.elements.authSection.classList.add('auth-section--disabled')
    } else {
      this.elements.authSection.classList.remove('auth-section--disabled')
    }
  }

  /**
   * [ARCH-LOCAL_STORAGE_PROVIDER] Handle storage mode radio change: persist and notify service worker.
   * @param {string} mode - 'pinboard' or 'local'
   */
  async onStorageModeChange (mode) {
    try {
      await this.configManager.setStorageMode(mode)
      this.updateAuthSectionVisibility(mode)
      chrome.runtime.sendMessage({ type: 'switchStorageMode' }).catch(() => {})
      this.showStatus('Storage mode updated. Using ' + (mode === 'local' ? 'local storage' : 'Pinboard') + '.', 'success')
    } catch (error) {
      console.error('Storage mode change failed:', error)
      this.showStatus('Failed to update storage mode: ' + error.message, 'error')
    }
  }

  async testAuthentication () {
    const authToken = this.elements.authToken.value.trim()

    if (!authToken) {
      this.showStatus('Please enter an API token first', 'warning')
      return
    }

    try {
      this.setLoading(true)
      this.showStatus('Testing connection...', 'info')

      // Temporarily set the token for testing
      await this.configManager.setAuthToken(authToken)

      // Test the connection
      console.log('Testing Pinboard connection...')
      const isValid = await this.pinboardService.testConnection()
      console.log('Connection test result:', isValid)

      if (isValid) {
        this.showStatus('Authentication successful! ✓', 'success')
      } else {
        this.showStatus('Authentication failed. Please check your token.', 'error')
      }
    } catch (error) {
      console.error('Authentication test failed:', error)
      this.showStatus('Authentication test failed: ' + error.message, 'error')
    } finally {
      this.setLoading(false)
    }
  }

  async exportSettings () {
    try {
      const config = await this.configManager.exportConfig()

      const blob = new Blob([JSON.stringify(config, null, 2)], {
        type: 'application/json'
      })

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `hoverboard-settings-${new Date().toISOString().split('T')[0]}.json`
      a.click()

      URL.revokeObjectURL(url)

      this.showStatus('Settings exported successfully', 'success')
    } catch (error) {
      console.error('Failed to export settings:', error)
      this.showStatus('Failed to export settings: ' + error.message, 'error')
    }
  }

  async importSettings (event) {
    const file = event.target.files[0]
    if (!file) return

    try {
      this.setLoading(true)

      const text = await file.text()
      const config = JSON.parse(text)

      await this.configManager.importConfig(config)
      await this.loadSettings()

      this.showStatus('Settings imported successfully', 'success')
    } catch (error) {
      console.error('Failed to import settings:', error)
      this.showStatus('Failed to import settings: ' + error.message, 'error')
    } finally {
      this.setLoading(false)
      // Clear the file input
      event.target.value = ''
    }
  }

  async autoSave () {
    if (this.isLoading) return

    try {
      await this.saveSettings()
    } catch (error) {
      // Silent fail for auto-save
      console.warn('Auto-save failed:', error)
    }
  }

  validateInputs () {
    // Validate recent posts count
    const recentPostsCount = parseInt(this.elements.recentPostsCount.value)
    if (isNaN(recentPostsCount) || recentPostsCount < 5 || recentPostsCount > 50) {
      return {
        valid: false,
        message: 'Recent posts count must be between 5 and 50'
      }
    }

    // Validate auto-close timeout
    const autoCloseTimeout = parseInt(this.elements.autoCloseTimeout.value)
    if (isNaN(autoCloseTimeout) || autoCloseTimeout < 0) {
      return {
        valid: false,
        message: 'Auto-close timeout must be 0 or greater'
      }
    }

    // Validate badge text lengths
    const badgeFields = [
      this.elements.badgeNotBookmarked,
      this.elements.badgeNoTags,
      this.elements.badgePrivate,
      this.elements.badgeToRead
    ]

    for (const field of badgeFields) {
      if (field.value.length > 4) {
        return {
          valid: false,
          message: 'Badge text must be 4 characters or less'
        }
      }
    }

    return { valid: true }
  }

  setLoading (loading) {
    this.isLoading = loading

    const buttons = document.querySelectorAll('.btn')
    const inputs = document.querySelectorAll('input, textarea')

    buttons.forEach(btn => {
      btn.disabled = loading
      btn.classList.toggle('loading', loading)
    })

    inputs.forEach(input => {
      input.disabled = loading
    })
  }

  showStatus (message, type = 'info') {
    this.elements.statusMessage.textContent = message
    this.elements.statusMessage.className = `status ${type}`

    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
      setTimeout(() => {
        this.elements.statusMessage.textContent = ''
        this.elements.statusMessage.className = 'status'
      }, 5000)
    }

    // Auto-hide info messages after 3 seconds
    if (type === 'info') {
      setTimeout(() => {
        this.elements.statusMessage.textContent = ''
        this.elements.statusMessage.className = 'status'
      }, 3000)
    }
  }

  debounce (func, wait) {
    let timeout
    return function executedFunction (...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }

  // Visibility controls methods
  toggleDefaultTheme () {
    this.currentTheme = this.currentTheme === 'light-on-dark' ? 'dark-on-light' : 'light-on-dark'
    this.updateThemeDisplay()
    this.updateVisibilityPreview()
  }

  updateThemeDisplay () {
    const themeIcon = this.elements.defaultThemeToggle.querySelector('.theme-icon')
    const themeText = this.elements.defaultThemeToggle.querySelector('.theme-text')

    if (themeIcon && themeText) {
      const isLightOnDark = this.currentTheme === 'light-on-dark'
      themeIcon.textContent = isLightOnDark ? '🌙' : '☀️'
      themeText.textContent = isLightOnDark ? 'Dark' : 'Light'
    }
  }

  updateTransparencyState () {
    const isEnabled = this.elements.defaultTransparencyEnabled.checked
    this.elements.opacitySetting.classList.toggle('disabled', !isEnabled)
    this.elements.defaultBackgroundOpacity.disabled = !isEnabled
    this.updateVisibilityPreview()
  }

  updateOpacityDisplay () {
    const opacity = this.elements.defaultBackgroundOpacity.value
    this.elements.opacityValue.textContent = `${opacity}%`
    this.updateVisibilityPreview()
  }

  updateVisibilityPreview () {
    const preview = this.elements.visibilityPreview
    const isTransparent = this.elements.defaultTransparencyEnabled.checked
    const opacity = parseInt(this.elements.defaultBackgroundOpacity.value) / 100

    // Remove existing theme classes
    preview.classList.remove('theme-light-on-dark', 'theme-dark-on-light')
    preview.classList.add(`theme-${this.currentTheme}`)

    // Apply transparency and opacity
    if (isTransparent) {
      if (this.currentTheme === 'light-on-dark') {
        preview.style.background = `rgba(44, 62, 80, ${opacity})`
      } else {
        preview.style.background = `rgba(255, 255, 255, ${opacity})`
      }
      preview.style.backdropFilter = 'blur(2px)'
    } else {
      preview.style.background = ''
      preview.style.backdropFilter = 'none'
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // eslint-disable-next-line no-new
    new OptionsController()
  })
} else {
  // eslint-disable-next-line no-new
  new OptionsController()
}
