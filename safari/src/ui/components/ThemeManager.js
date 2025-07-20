/**
 * ThemeManager - Modern theme management system for Hoverboard Extension
 * Handles dark mode, theme switching, CSS variables, and system preferences
 */

export class ThemeManager {
  constructor () {
    this.currentTheme = 'auto'
    this.resolvedTheme = 'light'
    this.mediaQuery = null
    this.listeners = new Set()
    this.storageKey = 'hoverboard_theme'

    // Theme definitions
    this.themes = {
      light: {
        name: 'Light',
        variables: {
          '--hb-bg-primary': '#ffffff',
          '--hb-bg-secondary': '#f8f9fa',
          '--hb-bg-tertiary': '#f1f3f4',
          '--hb-bg-overlay': 'rgba(255, 255, 255, 0.95)',
          '--hb-bg-hover': 'rgba(0, 0, 0, 0.04)',
          '--hb-bg-active': 'rgba(0, 0, 0, 0.08)',

          '--hb-text-primary': '#202124',
          '--hb-text-secondary': '#5f6368',
          '--hb-text-tertiary': '#80868b',
          '--hb-text-disabled': '#bdc1c6',
          '--hb-text-inverse': '#ffffff',

          '--hb-border-primary': '#dadce0',
          '--hb-border-secondary': '#e8eaed',
          '--hb-border-focus': '#1a73e8',
          '--hb-border-error': '#d93025',
          '--hb-border-success': '#137333',
          '--hb-border-warning': '#f29900',

          '--hb-accent-primary': '#1a73e8',
          '--hb-accent-primary-hover': '#1557b0',
          '--hb-accent-primary-active': '#0d47a1',
          '--hb-accent-secondary': '#ea4335',
          '--hb-accent-success': '#137333',
          '--hb-accent-warning': '#f29900',
          '--hb-accent-error': '#d93025',

          '--hb-shadow-1': '0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)',
          '--hb-shadow-2': '0 1px 2px 0 rgba(60,64,67,.3), 0 2px 6px 2px rgba(60,64,67,.15)',
          '--hb-shadow-3': '0 4px 8px 3px rgba(60,64,67,.15), 0 1px 3px rgba(60,64,67,.3)',
          '--hb-shadow-4': '0 6px 10px 4px rgba(60,64,67,.15), 0 2px 3px rgba(60,64,67,.3)'
        }
      },
      dark: {
        name: 'Dark',
        variables: {
          '--hb-bg-primary': '#202124',
          '--hb-bg-secondary': '#292a2d',
          '--hb-bg-tertiary': '#35363a',
          '--hb-bg-overlay': 'rgba(32, 33, 36, 0.95)',
          '--hb-bg-hover': 'rgba(255, 255, 255, 0.04)',
          '--hb-bg-active': 'rgba(255, 255, 255, 0.08)',

          '--hb-text-primary': '#e8eaed',
          '--hb-text-secondary': '#9aa0a6',
          '--hb-text-tertiary': '#80868b',
          '--hb-text-disabled': '#5f6368',
          '--hb-text-inverse': '#202124',

          '--hb-border-primary': '#5f6368',
          '--hb-border-secondary': '#3c4043',
          '--hb-border-focus': '#8ab4f8',
          '--hb-border-error': '#f28b82',
          '--hb-border-success': '#81c995',
          '--hb-border-warning': '#fdd663',

          '--hb-accent-primary': '#8ab4f8',
          '--hb-accent-primary-hover': '#aecbfa',
          '--hb-accent-primary-active': '#c8e6c9',
          '--hb-accent-secondary': '#f28b82',
          '--hb-accent-success': '#81c995',
          '--hb-accent-warning': '#fdd663',
          '--hb-accent-error': '#f28b82',

          '--hb-shadow-1': '0 1px 2px 0 rgba(0,0,0,.3), 0 1px 3px 1px rgba(0,0,0,.15)',
          '--hb-shadow-2': '0 1px 2px 0 rgba(0,0,0,.3), 0 2px 6px 2px rgba(0,0,0,.15)',
          '--hb-shadow-3': '0 4px 8px 3px rgba(0,0,0,.15), 0 1px 3px rgba(0,0,0,.3)',
          '--hb-shadow-4': '0 6px 10px 4px rgba(0,0,0,.15), 0 2px 3px rgba(0,0,0,.3)'
        }
      }
    }

    // Bind methods
    this.init = this.init.bind(this)
    this.setTheme = this.setTheme.bind(this)
    this.getTheme = this.getTheme.bind(this)
    this.getResolvedTheme = this.getResolvedTheme.bind(this)
    this.handleSystemThemeChange = this.handleSystemThemeChange.bind(this)
    this.applyTheme = this.applyTheme.bind(this)
    this.addListener = this.addListener.bind(this)
    this.removeListener = this.removeListener.bind(this)
  }

  /**
   * Initialize theme manager
   */
  async init () {
    try {
      // Load saved theme preference
      await this.loadThemePreference()

      // Setup system theme detection
      this.setupSystemThemeDetection()

      // Apply initial theme
      this.resolveAndApplyTheme()

      console.log('ThemeManager initialized with theme:', this.resolvedTheme)
    } catch (error) {
      console.error('Failed to initialize ThemeManager:', error)
      this.resolvedTheme = 'light'
      this.applyTheme('light')
    }
  }

  /**
   * Load theme preference from storage
   */
  async loadThemePreference () {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.storageKey], (result) => {
        if (chrome.runtime.lastError) {
          console.warn('Failed to load theme preference:', chrome.runtime.lastError)
          resolve()
          return
        }

        const savedTheme = result[this.storageKey]
        if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
          this.currentTheme = savedTheme
        }

        resolve()
      })
    })
  }

  /**
   * Save theme preference to storage
   */
  async saveThemePreference () {
    return new Promise((resolve) => {
      chrome.storage.local.set({
        [this.storageKey]: this.currentTheme
      }, () => {
        if (chrome.runtime.lastError) {
          console.warn('Failed to save theme preference:', chrome.runtime.lastError)
        }
        resolve()
      })
    })
  }

  /**
   * Setup system theme detection
   */
  setupSystemThemeDetection () {
    if (window.matchMedia) {
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      this.mediaQuery.addEventListener('change', this.handleSystemThemeChange)
    }
  }

  /**
   * Handle system theme change
   */
  handleSystemThemeChange (e) {
    if (this.currentTheme === 'auto') {
      const newResolvedTheme = e.matches ? 'dark' : 'light'
      if (newResolvedTheme !== this.resolvedTheme) {
        this.resolvedTheme = newResolvedTheme
        this.applyTheme(this.resolvedTheme)
        this.notifyListeners()
      }
    }
  }

  /**
   * Resolve theme based on current preference and system settings
   */
  resolveTheme () {
    if (this.currentTheme === 'auto') {
      if (this.mediaQuery && this.mediaQuery.matches) {
        return 'dark'
      }
      return 'light'
    }

    return this.currentTheme
  }

  /**
   * Resolve and apply theme
   */
  resolveAndApplyTheme () {
    const newResolvedTheme = this.resolveTheme()
    if (newResolvedTheme !== this.resolvedTheme) {
      this.resolvedTheme = newResolvedTheme
      this.notifyListeners()
    }

    this.applyTheme(this.resolvedTheme)
  }

  /**
   * Set theme preference
   */
  async setTheme (theme) {
    if (!['light', 'dark', 'auto'].includes(theme)) {
      throw new Error(`Invalid theme: ${theme}`)
    }

    this.currentTheme = theme
    await this.saveThemePreference()

    this.resolveAndApplyTheme()
  }

  /**
   * Get current theme preference
   */
  getTheme () {
    return this.currentTheme
  }

  /**
   * Get resolved theme (actual theme being used)
   */
  getResolvedTheme () {
    return this.resolvedTheme
  }

  /**
   * Apply theme to document
   */
  applyTheme (themeName) {
    const theme = this.themes[themeName]
    if (!theme) {
      console.warn(`Theme "${themeName}" not found`)
      return
    }

    // Apply CSS variables to document root
    const root = document.documentElement
    Object.entries(theme.variables).forEach(([property, value]) => {
      root.style.setProperty(property, value)
    })

    // Update theme class on document
    document.documentElement.className = document.documentElement.className
      .replace(/hb-theme-\w+/g, '')
      .trim()
    document.documentElement.classList.add(`hb-theme-${themeName}`)

    // Update meta theme color for mobile
    this.updateMetaThemeColor(theme.variables['--hb-bg-primary'])
  }

  /**
   * Update meta theme color for mobile browsers
   */
  updateMetaThemeColor (color) {
    let metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta')
      metaThemeColor.name = 'theme-color'
      document.head.appendChild(metaThemeColor)
    }
    metaThemeColor.content = color
  }

  /**
   * Get theme variable value
   */
  getThemeVariable (variableName) {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(variableName)
      .trim()
  }

  /**
   * Set custom theme variable
   */
  setThemeVariable (variableName, value) {
    document.documentElement.style.setProperty(variableName, value)
  }

  /**
   * Create theme-aware CSS
   */
  createThemeAwareCSS (lightCSS, darkCSS) {
    return `
      .hb-theme-light { ${lightCSS} }
      .hb-theme-dark { ${darkCSS} }
    `
  }

  /**
   * Add theme change listener
   */
  addListener (callback) {
    if (typeof callback === 'function') {
      this.listeners.add(callback)
    }
  }

  /**
   * Remove theme change listener
   */
  removeListener (callback) {
    this.listeners.delete(callback)
  }

  /**
   * Notify all listeners of theme change
   */
  notifyListeners () {
    this.listeners.forEach(callback => {
      try {
        callback({
          theme: this.currentTheme,
          resolvedTheme: this.resolvedTheme
        })
      } catch (error) {
        console.error('Error in theme listener:', error)
      }
    })
  }

  /**
   * Get available themes
   */
  getAvailableThemes () {
    return [
      { value: 'light', label: 'Light' },
      { value: 'dark', label: 'Dark' },
      { value: 'auto', label: 'System' }
    ]
  }

  /**
   * Check if system supports dark mode detection
   */
  supportsSystemTheme () {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)')
  }

  /**
   * Get system theme preference
   */
  getSystemTheme () {
    if (this.mediaQuery && this.mediaQuery.matches) {
      return 'dark'
    }
    return 'light'
  }

  /**
   * Create theme switcher element
   */
  createThemeSwitcher (options = {}) {
    const {
      className = '',
      showLabels = true,
      compact = false
    } = options

    const container = document.createElement('div')
    container.className = `hb-theme-switcher ${className}`.trim()

    if (compact) {
      container.classList.add('hb-theme-switcher--compact')
    }

    const themes = this.getAvailableThemes()

    themes.forEach(theme => {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'hb-theme-switcher__option'
      button.setAttribute('data-theme', theme.value)
      button.setAttribute('aria-label', `Switch to ${theme.label} theme`)

      if (showLabels) {
        button.textContent = theme.label
      }

      // Update active state
      if (theme.value === this.currentTheme) {
        button.classList.add('hb-theme-switcher__option--active')
        button.setAttribute('aria-pressed', 'true')
      } else {
        button.setAttribute('aria-pressed', 'false')
      }

      button.addEventListener('click', () => {
        this.setTheme(theme.value)
        this.updateThemeSwitcher(container)
      })

      container.appendChild(button)
    })

    return container
  }

  /**
   * Update theme switcher active state
   */
  updateThemeSwitcher (switcher) {
    const buttons = switcher.querySelectorAll('.hb-theme-switcher__option')
    buttons.forEach(button => {
      const isActive = button.getAttribute('data-theme') === this.currentTheme
      button.classList.toggle('hb-theme-switcher__option--active', isActive)
      button.setAttribute('aria-pressed', isActive ? 'true' : 'false')
    })
  }

  /**
   * Detect user's preferred theme from various sources
   */
  detectPreferredTheme () {
    // Check for saved preference
    if (this.currentTheme !== 'auto') {
      return this.currentTheme
    }

    // Check system preference
    if (this.supportsSystemTheme()) {
      return this.getSystemTheme()
    }

    // Default to light
    return 'light'
  }

  /**
   * Apply theme-specific styles to element
   */
  applyThemeStyles (element, styles) {
    if (!element || typeof styles !== 'object') {
      return
    }

    const themeStyles = styles[this.resolvedTheme] || styles.light || {}
    Object.entries(themeStyles).forEach(([property, value]) => {
      element.style.setProperty(property, value)
    })
  }

  /**
   * Cleanup theme manager
   */
  cleanup () {
    if (this.mediaQuery) {
      this.mediaQuery.removeEventListener('change', this.handleSystemThemeChange)
    }

    this.listeners.clear()
  }
}
