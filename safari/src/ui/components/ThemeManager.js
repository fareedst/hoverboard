/**
 * ThemeManager - Modern theme management system for Hoverboard Extension
 * Handles dark mode, theme switching, CSS variables, and system preferences
 * 
 * [SAFARI-EXT-UI-001] Safari-specific UI optimizations including:
 * - Platform detection and Safari-specific theme adaptations
 * - Safari-specific accessibility features (VoiceOver, high contrast, reduced motion)
 * - Safari-specific performance optimizations
 * - Safari-specific backdrop-filter and visual effects
 */

// [SAFARI-EXT-UI-001] Import platform utilities for Safari-specific optimizations
import { platformUtils } from '../../shared/safari-shim.js'

export class ThemeManager {
  constructor () {
    this.currentTheme = 'auto'
    this.resolvedTheme = 'light'
    this.mediaQuery = null
    this.listeners = new Set()
    this.storageKey = 'hoverboard_theme'

    // [SAFARI-EXT-UI-001] Safari-specific platform detection
    this.platform = platformUtils.getPlatform()
    this.platformConfig = platformUtils.getPlatformConfig()
    this.isSafari = this.platform === 'safari'
    this.runtimeFeatures = platformUtils.detectRuntimeFeatures()

    // [SAFARI-EXT-UI-001] Safari-specific accessibility features
    this.accessibilityFeatures = platformUtils.detectAccessibilityFeatures()
    this.supportsVoiceOver = this.isSafari && this.accessibilityFeatures.platformSpecific.safari?.voiceOver
    this.supportsHighContrast = this.accessibilityFeatures.highContrast.prefersContrast || this.accessibilityFeatures.highContrast.forcedColors
    this.supportsReducedMotion = this.accessibilityFeatures.reducedMotion.prefersReducedMotion

    // [SAFARI-EXT-UI-001] Safari-specific performance monitoring
    this.performanceMetrics = platformUtils.getPerformanceMetrics()
    this.monitoringInterval = null

    // Theme definitions with Safari-specific optimizations
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

    // [SAFARI-EXT-UI-001] Safari-specific theme enhancements
    if (this.isSafari) {
      this.enhanceThemesForSafari()
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
    
    // [SAFARI-EXT-UI-001] Safari-specific method bindings
    this.enhanceThemesForSafari = this.enhanceThemesForSafari.bind(this)
    this.applySafariSpecificOptimizations = this.applySafariSpecificOptimizations.bind(this)
    this.startPerformanceMonitoring = this.startPerformanceMonitoring.bind(this)
    this.stopPerformanceMonitoring = this.stopPerformanceMonitoring.bind(this)
    this.updateAccessibilityFeatures = this.updateAccessibilityFeatures.bind(this)
  }

  /**
   * [SAFARI-EXT-UI-001] Enhance themes with Safari-specific optimizations
   */
  enhanceThemesForSafari() {
    console.log('[SAFARI-EXT-UI-001] Enhancing themes for Safari platform')

    // [SAFARI-EXT-UI-001] Safari-specific backdrop-filter support
    const backdropFilterSupport = this.runtimeFeatures.ui.webkitBackdropFilter || this.runtimeFeatures.ui.backdropFilter
    const backdropFilterValue = backdropFilterSupport ? 'blur(10px) saturate(180%)' : 'none'

    // [SAFARI-EXT-UI-001] Safari-specific high contrast adjustments
    const highContrastMultiplier = this.supportsHighContrast ? 1.2 : 1.0

    // [SAFARI-EXT-UI-001] Safari-specific reduced motion adjustments
    const motionMultiplier = this.supportsReducedMotion ? 0.5 : 1.0

    // [SAFARI-EXT-UI-001] Apply Safari-specific enhancements to both themes
    Object.keys(this.themes).forEach(themeName => {
      const theme = this.themes[themeName]
      
      // [SAFARI-EXT-UI-001] Add Safari-specific CSS variables
      theme.variables['--hb-backdrop-filter'] = backdropFilterValue
      theme.variables['--hb-high-contrast-multiplier'] = highContrastMultiplier.toString()
      theme.variables['--hb-motion-multiplier'] = motionMultiplier.toString()
      
      // [SAFARI-EXT-UI-001] Safari-specific shadow adjustments for better performance
      if (this.isSafari) {
        theme.variables['--hb-shadow-1'] = theme.variables['--hb-shadow-1'].replace(/,\s*0\s*1px\s*3px\s*1px/, '')
        theme.variables['--hb-shadow-2'] = theme.variables['--hb-shadow-2'].replace(/,\s*0\s*2px\s*6px\s*2px/, '')
      }

      // [SAFARI-EXT-UI-001] Safari-specific color adjustments for better contrast
      if (this.supportsHighContrast) {
        const contrastBoost = 0.1
        Object.keys(theme.variables).forEach(key => {
          if (key.includes('--hb-text-') || key.includes('--hb-border-')) {
            const color = theme.variables[key]
            if (color.startsWith('#')) {
              // Simple contrast boost for hex colors
              theme.variables[key] = this.adjustColorContrast(color, contrastBoost)
            }
          }
        })
      }
    })

    console.log('[SAFARI-EXT-UI-001] Safari theme enhancements applied')
  }

  /**
   * [SAFARI-EXT-UI-001] Adjust color contrast for accessibility
   */
  adjustColorContrast(hexColor, boost) {
    // Simple contrast adjustment - in production, use a proper color library
    const r = parseInt(hexColor.slice(1, 3), 16)
    const g = parseInt(hexColor.slice(3, 5), 16)
    const b = parseInt(hexColor.slice(5, 7), 16)
    
    const adjustedR = Math.min(255, Math.max(0, r + (r > 128 ? boost * 255 : -boost * 255)))
    const adjustedG = Math.min(255, Math.max(0, g + (g > 128 ? boost * 255 : -boost * 255)))
    const adjustedB = Math.min(255, Math.max(0, b + (b > 128 ? boost * 255 : -boost * 255)))
    
    return `#${Math.round(adjustedR).toString(16).padStart(2, '0')}${Math.round(adjustedG).toString(16).padStart(2, '0')}${Math.round(adjustedB).toString(16).padStart(2, '0')}`
  }

  /**
   * Initialize theme manager with Safari-specific optimizations
   */
  async init () {
    try {
      console.log('[SAFARI-EXT-UI-001] Initializing ThemeManager for platform:', this.platform)

      // [SAFARI-EXT-UI-001] Start Safari-specific performance monitoring
      if (this.isSafari) {
        this.startPerformanceMonitoring()
      }

      // Load saved theme preference
      await this.loadThemePreference()

      // Setup system theme detection
      this.setupSystemThemeDetection()

      // [SAFARI-EXT-UI-001] Update accessibility features
      this.updateAccessibilityFeatures()

      // Apply initial theme
      this.resolveAndApplyTheme()

      // [SAFARI-EXT-UI-001] Apply Safari-specific optimizations
      if (this.isSafari) {
        this.applySafariSpecificOptimizations()
      }

      console.log('ThemeManager initialized with theme:', this.resolvedTheme, 'on platform:', this.platform)
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
          resolvedTheme: this.resolvedTheme,
          // [SAFARI-EXT-UI-001] Include Safari-specific information in notifications
          platform: this.platform,
          isSafari: this.isSafari,
          accessibilityFeatures: this.accessibilityFeatures
        })
      } catch (error) {
        console.error('Theme change listener error:', error)
      }
    })
  }

  /**
   * Get available themes
   */
  getAvailableThemes () {
    return Object.keys(this.themes).map(key => ({
      id: key,
      name: this.themes[key].name
    }))
  }

  /**
   * Check if system theme is supported
   */
  supportsSystemTheme () {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)')
  }

  /**
   * Get current system theme
   */
  getSystemTheme () {
    if (this.supportsSystemTheme()) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
  }

  /**
   * Create theme switcher element
   */
  createThemeSwitcher (options = {}) {
    const {
      container = document.body,
      showSystem = true,
      showLabels = true,
      className = 'hb-theme-switcher'
    } = options

    const switcher = document.createElement('div')
    switcher.className = className
    switcher.setAttribute('role', 'radiogroup')
    switcher.setAttribute('aria-label', 'Theme selection')

    const themes = this.getAvailableThemes()
    if (showSystem) {
      themes.push({ id: 'auto', name: 'System' })
    }

    themes.forEach(theme => {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'hb-theme-option'
      button.setAttribute('role', 'radio')
      button.setAttribute('aria-checked', this.currentTheme === theme.id ? 'true' : 'false')
      button.setAttribute('data-theme', theme.id)

      if (showLabels) {
        button.textContent = theme.name
      }

      button.addEventListener('click', () => {
        this.setTheme(theme.id)
        this.updateThemeSwitcher(switcher)
      })

      switcher.appendChild(button)
    })

    container.appendChild(switcher)
    return switcher
  }

  /**
   * Update theme switcher state
   */
  updateThemeSwitcher (switcher) {
    const buttons = switcher.querySelectorAll('.hb-theme-option')
    buttons.forEach(button => {
      const theme = button.getAttribute('data-theme')
      button.setAttribute('aria-checked', this.currentTheme === theme ? 'true' : 'false')
      button.classList.toggle('active', this.currentTheme === theme)
    })
  }

  /**
   * Detect preferred theme based on system and user preferences
   */
  detectPreferredTheme () {
    // [SAFARI-EXT-UI-001] Safari-specific theme detection
    if (this.isSafari) {
      // [SAFARI-EXT-UI-001] Consider Safari-specific accessibility preferences
      if (this.supportsHighContrast) {
        console.log('[SAFARI-EXT-UI-001] High contrast detected, preferring dark theme')
        return 'dark'
      }
    }

    // Default detection logic
    if (this.supportsSystemTheme()) {
      return this.getSystemTheme()
    }

    return 'light'
  }

  /**
   * Apply theme styles to specific element
   */
  applyThemeStyles (element, styles) {
    if (!element || !styles) return

    Object.entries(styles).forEach(([property, value]) => {
      element.style.setProperty(property, value)
    })
  }

  /**
   * Cleanup theme manager
   */
  cleanup () {
    // [SAFARI-EXT-UI-001] Stop Safari-specific performance monitoring
    this.stopPerformanceMonitoring()

    // Remove media query listener
    if (this.mediaQuery) {
      this.mediaQuery.removeEventListener('change', this.handleSystemThemeChange)
      this.mediaQuery = null
    }

    // Clear listeners
    this.listeners.clear()

    console.log('[SAFARI-EXT-UI-001] ThemeManager cleanup completed')
  }

  /**
   * [SAFARI-EXT-UI-001] Get Safari-specific theme information
   */
  getSafariThemeInfo() {
    return {
      platform: this.platform,
      isSafari: this.isSafari,
      platformConfig: this.platformConfig,
      runtimeFeatures: this.runtimeFeatures,
      accessibilityFeatures: this.accessibilityFeatures,
      performanceMetrics: this.performanceMetrics,
      currentTheme: this.currentTheme,
      resolvedTheme: this.resolvedTheme,
      supportsVoiceOver: this.supportsVoiceOver,
      supportsHighContrast: this.supportsHighContrast,
      supportsReducedMotion: this.supportsReducedMotion
    }
  }

  /**
   * [SAFARI-EXT-UI-001] Apply Safari-specific theme optimizations
   */
  applySafariThemeOptimizations() {
    if (!this.isSafari) return

    console.log('[SAFARI-EXT-UI-001] Applying Safari-specific theme optimizations')

    const root = document.documentElement

    // [SAFARI-EXT-UI-001] Safari-specific rendering optimizations
    root.style.setProperty('--hb-safari-rendering', 'optimizeSpeed')
    root.style.setProperty('--hb-safari-text-rendering', 'optimizeLegibility')

    // [SAFARI-EXT-UI-001] Safari-specific backdrop-filter optimizations
    if (this.runtimeFeatures.ui.webkitBackdropFilter) {
      root.style.setProperty('--hb-backdrop-filter', 'blur(10px) saturate(180%)')
    } else if (this.runtimeFeatures.ui.backdropFilter) {
      root.style.setProperty('--hb-backdrop-filter', 'blur(10px) saturate(180%)')
    } else {
      root.style.setProperty('--hb-backdrop-filter', 'none')
    }

    // [SAFARI-EXT-UI-001] Safari-specific accessibility optimizations
    if (this.supportsVoiceOver) {
      root.setAttribute('data-voiceover-optimized', 'true')
    }

    if (this.supportsHighContrast) {
      root.setAttribute('data-high-contrast', 'true')
    }

    if (this.supportsReducedMotion) {
      root.setAttribute('data-reduced-motion', 'true')
    }

    console.log('[SAFARI-EXT-UI-001] Safari theme optimizations applied')
  }

  /**
   * [SAFARI-EXT-UI-001] Update Safari-specific theme features
   */
  updateSafariThemeFeatures() {
    if (!this.isSafari) return

    console.log('[SAFARI-EXT-UI-001] Updating Safari-specific theme features')

    // [SAFARI-EXT-UI-001] Update runtime features
    this.runtimeFeatures = platformUtils.detectRuntimeFeatures()

    // [SAFARI-EXT-UI-001] Update accessibility features
    this.updateAccessibilityFeatures()

    // [SAFARI-EXT-UI-001] Update performance metrics
    this.performanceMetrics = platformUtils.getPerformanceMetrics()

    // [SAFARI-EXT-UI-001] Re-apply Safari-specific optimizations
    this.applySafariThemeOptimizations()

    console.log('[SAFARI-EXT-UI-001] Safari theme features updated')
  }

  /**
   * [SAFARI-EXT-UI-001] Start Safari-specific performance monitoring
   */
  startPerformanceMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
    }

    const interval = this.platformConfig.performanceMonitoringInterval || 30000
    this.monitoringInterval = setInterval(() => {
      const metrics = platformUtils.getPerformanceMetrics()
      console.log('[SAFARI-EXT-UI-001] Performance metrics:', metrics)
      
      // [SAFARI-EXT-UI-001] Adjust theme performance based on metrics
      if (metrics.memory.used > metrics.memory.limit * 0.8) {
        console.warn('[SAFARI-EXT-UI-001] High memory usage detected, applying performance optimizations')
        this.applyPerformanceOptimizations()
      }
    }, interval)

    console.log('[SAFARI-EXT-UI-001] Performance monitoring started with interval:', interval)
  }

  /**
   * [SAFARI-EXT-UI-001] Stop Safari-specific performance monitoring
   */
  stopPerformanceMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
      console.log('[SAFARI-EXT-UI-001] Performance monitoring stopped')
    }
  }

  /**
   * [SAFARI-EXT-UI-001] Apply Safari-specific performance optimizations
   */
  applyPerformanceOptimizations() {
    console.log('[SAFARI-EXT-UI-001] Applying Safari-specific performance optimizations')

    // [SAFARI-EXT-UI-001] Reduce shadow complexity for better performance
    const root = document.documentElement
    root.style.setProperty('--hb-shadow-1', '0 1px 2px 0 rgba(0,0,0,0.1)')
    root.style.setProperty('--hb-shadow-2', '0 1px 3px 0 rgba(0,0,0,0.1)')
    root.style.setProperty('--hb-shadow-3', '0 2px 4px 0 rgba(0,0,0,0.1)')
    root.style.setProperty('--hb-shadow-4', '0 3px 6px 0 rgba(0,0,0,0.1)')

    // [SAFARI-EXT-UI-001] Disable backdrop-filter for better performance
    if (this.runtimeFeatures.ui.webkitBackdropFilter || this.runtimeFeatures.ui.backdropFilter) {
      root.style.setProperty('--hb-backdrop-filter', 'none')
    }

    console.log('[SAFARI-EXT-UI-001] Performance optimizations applied')
  }

  /**
   * [SAFARI-EXT-UI-001] Update accessibility features
   */
  updateAccessibilityFeatures() {
    console.log('[SAFARI-EXT-UI-001] Updating accessibility features')

    // [SAFARI-EXT-UI-001] Update accessibility features from platform detection
    this.accessibilityFeatures = platformUtils.detectAccessibilityFeatures()
    this.supportsVoiceOver = this.isSafari && this.accessibilityFeatures.platformSpecific.safari?.voiceOver
    this.supportsHighContrast = this.accessibilityFeatures.highContrast.prefersContrast || this.accessibilityFeatures.highContrast.forcedColors
    this.supportsReducedMotion = this.accessibilityFeatures.reducedMotion.prefersReducedMotion

    // [SAFARI-EXT-UI-001] Apply accessibility-specific theme adjustments
    if (this.supportsHighContrast || this.supportsReducedMotion) {
      this.enhanceThemesForSafari()
      this.resolveAndApplyTheme()
    }

    console.log('[SAFARI-EXT-UI-001] Accessibility features updated:', {
      voiceOver: this.supportsVoiceOver,
      highContrast: this.supportsHighContrast,
      reducedMotion: this.supportsReducedMotion
    })
  }

  /**
   * [SAFARI-EXT-UI-001] Apply Safari-specific optimizations
   */
  applySafariSpecificOptimizations() {
    console.log('[SAFARI-EXT-UI-001] Applying Safari-specific optimizations')

    const root = document.documentElement

    // [SAFARI-EXT-UI-001] Safari-specific CSS optimizations
    if (this.isSafari) {
      // [SAFARI-EXT-UI-001] Enable Safari-specific rendering optimizations
      root.style.setProperty('--hb-safari-optimized', 'true')
      
      // [SAFARI-EXT-UI-001] Safari-specific font rendering
      root.style.setProperty('--hb-font-smoothing', '-webkit-font-smoothing: antialiased')
      
      // [SAFARI-EXT-UI-001] Safari-specific transform optimizations
      root.style.setProperty('--hb-transform-optimized', 'translateZ(0)')
    }

    // [SAFARI-EXT-UI-001] Apply accessibility optimizations
    if (this.supportsVoiceOver) {
      root.style.setProperty('--hb-voiceover-optimized', 'true')
      root.setAttribute('aria-live', 'polite')
    }

    if (this.supportsHighContrast) {
      root.style.setProperty('--hb-high-contrast', 'true')
    }

    if (this.supportsReducedMotion) {
      root.style.setProperty('--hb-reduced-motion', 'true')
      // [SAFARI-EXT-UI-001] Disable animations for reduced motion
      root.style.setProperty('--hb-animation-duration', '0s')
      root.style.setProperty('--hb-transition-duration', '0s')
    }

    console.log('[SAFARI-EXT-UI-001] Safari-specific optimizations applied')
  }
}
