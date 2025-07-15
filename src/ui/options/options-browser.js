/**
 * Options Page Controller - Browser-compatible version for testing
 * Uses mock services to avoid Node.js dependencies
 */

import { ConfigManager } from '../../config/config-manager.js'
import { PinboardService } from '../../features/pinboard/pinboard-service-browser.js'
import { browser } from '../../shared/utils'; // [SAFARI-EXT-SHIM-001]

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
    // Authentication
    this.elements.authToken = document.getElementById('auth-token')
    this.elements.testAuth = document.getElementById('test-auth')

    // Display settings
    this.elements.showHoverOnLoad = document.getElementById('show-hover-on-load')
    this.elements.hoverShowTooltips = document.getElementById('hover-show-tooltips')
    this.elements.recentPostsCount = document.getElementById('recent-posts-count')

    // Visibility defaults
    this.elements.defaultThemeToggle = document.getElementById('default-theme-toggle')
    this.elements.defaultTransparencyEnabled = document.getElementById('default-transparency-enabled')
    this.elements.defaultBackgroundOpacity = document.getElementById('default-background-opacity')
    this.elements.visibilityPreview = document.getElementById('visibility-preview')
    this.elements.opacityValue = document.querySelector('.opacity-value')
    this.elements.opacitySetting = document.querySelector('.opacity-setting')

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

      // Populate form fields
      this.elements.authToken.value = authToken
      this.elements.showHoverOnLoad.checked = config.showHoverOnPageLoad
      this.elements.hoverShowTooltips.checked = config.hoverShowTooltips
      this.elements.recentPostsCount.value = config.initRecentPostsCount

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
      const settings = {
        showHoverOnPageLoad: this.elements.showHoverOnLoad.checked,
        hoverShowTooltips: this.elements.hoverShowTooltips.checked,
        initRecentPostsCount: parseInt(this.elements.recentPostsCount.value),

        badgeTextIfNotBookmarked: this.elements.badgeNotBookmarked.value,
        badgeTextIfBookmarkedNoTags: this.elements.badgeNoTags.value,
        badgeTextIfPrivate: this.elements.badgePrivate.value,
        badgeTextIfQueued: this.elements.badgeToRead.value,

        uxUrlStripHash: this.elements.stripUrlHash.checked,
        uxAutoCloseTimeout: parseInt(this.elements.autoCloseTimeout.value),

        // Visibility defaults
        defaultVisibilityTheme: this.currentTheme,
        defaultTransparencyEnabled: this.elements.defaultTransparencyEnabled.checked,
        defaultBackgroundOpacity: parseInt(this.elements.defaultBackgroundOpacity.value)
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
      const isValid = await this.pinboardService.testConnection()

      if (isValid) {
        this.showStatus('✅ Connection successful! Token is valid.', 'success')
      } else {
        this.showStatus('❌ Connection failed. Please check your token.', 'error')
      }
    } catch (error) {
      console.error('Authentication test failed:', error)
      this.showStatus('❌ Connection test failed: ' + error.message, 'error')
    } finally {
      this.setLoading(false)
    }
  }

  async exportSettings () {
    try {
      this.setLoading(true)

      const config = await this.configManager.exportConfig()

      const blob = new Blob([config], { type: 'application/json' })
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
    } finally {
      this.setLoading(false)
    }
  }

  async importSettings (event) {
    const file = event.target.files[0]
    if (!file) return

    try {
      this.setLoading(true)

      const text = await file.text()
      await this.configManager.importConfig(text)
      await this.loadSettings()

      this.showStatus('Settings imported successfully', 'success')
    } catch (error) {
      console.error('Failed to import settings:', error)
      this.showStatus('Failed to import settings: ' + error.message, 'error')
    } finally {
      this.setLoading(false)
      event.target.value = '' // Reset file input
    }
  }

  async autoSave () {
    // Auto-save implementation here if needed
    console.log('Auto-save triggered (not implemented in browser version)')
  }

  validateInputs () {
    const recentCount = parseInt(this.elements.recentPostsCount.value)
    if (isNaN(recentCount) || recentCount < 5 || recentCount > 50) {
      return {
        valid: false,
        message: 'Recent posts count must be between 5 and 50'
      }
    }

    const autoCloseTimeout = parseInt(this.elements.autoCloseTimeout.value)
    if (isNaN(autoCloseTimeout) || autoCloseTimeout < 0) {
      return {
        valid: false,
        message: 'Auto-close timeout must be 0 or greater'
      }
    }

    const opacity = parseInt(this.elements.defaultBackgroundOpacity.value)
    if (isNaN(opacity) || opacity < 10 || opacity > 100) {
      return {
        valid: false,
        message: 'Background opacity must be between 10% and 100%'
      }
    }

    return { valid: true }
  }

  setLoading (loading) {
    this.isLoading = loading

    // Update UI loading state
    const buttons = document.querySelectorAll('.btn')
    const inputs = document.querySelectorAll('input, textarea')

    buttons.forEach(btn => {
      btn.disabled = loading
      btn.classList.toggle('loading', loading)
    })

    inputs.forEach(input => {
      input.disabled = loading
    })

    document.body.classList.toggle('loading', loading)
  }

  showStatus (message, type = 'info') {
    const statusEl = this.elements.statusMessage
    if (!statusEl) return

    statusEl.textContent = message
    statusEl.className = `status ${type}`
    statusEl.style.display = 'block'

    // Auto-hide after 5 seconds for success/info messages
    if (type === 'success' || type === 'info') {
      setTimeout(() => {
        statusEl.style.display = 'none'
      }, 5000)
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

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  new OptionsController()
})