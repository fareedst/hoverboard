/**
 * UI Module Index - Hoverboard Extension
 * Central export point for all UI components and systems
 *
 * UI-001: Centralized UI system architecture with component coordination
 * UI-002: Theme management and visual consistency system
 * UI-003: Icon management and asset loading system
 * UI-004: Popup creation and interaction management
 */

// Import all UI components
import { IconManager } from './components/IconManager.js'
import { ThemeManager } from './components/ThemeManager.js'
import { VisualAssetsManager } from './components/VisualAssetsManager.js'

// Import popup components
import { PopupController } from './popup/PopupController.js'
import { UIManager } from './popup/UIManager.js'
import { KeyboardManager } from './popup/KeyboardManager.js'
import { StateManager } from './popup/StateManager.js'

/**
 * UI System Manager - Central coordinator for all UI components
 *
 * UI-001: Main UI system orchestration class
 * SPECIFICATION: Coordinate themes, icons, assets, and popup components
 * IMPLEMENTATION DECISION: Initialization order ensures dependencies are resolved
 */
export class UISystem {
  constructor () {
    // UI-001: Component manager instances - initialized in proper order
    this.iconManager = null
    this.themeManager = null
    this.visualAssetsManager = null
    // UI-001: Initialization state tracking for safety checks
    this.isInitialized = false

    // UI-001: Bind methods for consistent context in async operations
    this.init = this.init.bind(this)
    this.createPopup = this.createPopup.bind(this)
    this.setTheme = this.setTheme.bind(this)
    this.preloadAssets = this.preloadAssets.bind(this)
  }

  /**
   * Initialize the UI system
   *
   * UI-001: System initialization with dependency management
   * SPECIFICATION: Initialize components in dependency order (themes → icons → assets)
   * IMPLEMENTATION DECISION: Options-based initialization for flexible component inclusion
   */
  async init (options = {}) {
    const {
      enableThemes = true,
      enableIcons = true,
      enableAssets = true,
      preloadCriticalAssets = true
    } = options

    try {
      // UI-002: Initialize theme manager first for CSS variables
      // IMPLEMENTATION DECISION: Themes provide foundation for all visual components
      if (enableThemes) {
        this.themeManager = new ThemeManager()
        await this.themeManager.init()
      }

      // UI-003: Initialize icon manager with theme integration
      if (enableIcons) {
        this.iconManager = new IconManager()
        if (this.themeManager) {
          // UI-003: Apply current theme to icon manager
          this.iconManager.setTheme(this.themeManager.getResolvedTheme())

          // UI-002: Listen for theme changes and update icons accordingly
          // IMPLEMENTATION DECISION: Automatic theme propagation for visual consistency
          this.themeManager.addListener(({ resolvedTheme }) => {
            this.iconManager.setTheme(resolvedTheme)
          })
        }
      }

      // UI-003: Initialize visual assets manager with preloading
      if (enableAssets) {
        this.visualAssetsManager = new VisualAssetsManager()

        // UI-003: Preload critical assets for performance
        // IMPLEMENTATION DECISION: Preload common assets to reduce loading delays
        if (preloadCriticalAssets) {
          await this.visualAssetsManager.preloadCriticalAssets()
        }
      }

      // UI-001: Mark system as fully initialized
      this.isInitialized = true
      console.log('UI System initialized successfully')
    } catch (error) {
      console.error('Failed to initialize UI System:', error)
      // UI-001: Re-throw initialization errors for caller handling
      throw error
    }
  }

  /**
   * Create popup application instance
   *
   * UI-004: Popup application factory with integrated components
   * SPECIFICATION: Create popup with all UI system components integrated
   * IMPLEMENTATION DECISION: Inject UI managers into popup for seamless integration
   */
  createPopup (options = {}) {
    // UI-001: Ensure UI system is initialized before creating popup
    if (!this.isInitialized) {
      throw new Error('UI System must be initialized before creating popup')
    }

    const {
      container = document.body,
      enableKeyboard = true,
      enableState = true
    } = options

    // UI-004: Create popup components with UI system integration
    // IMPLEMENTATION DECISION: Pass UI managers to popup for integrated functionality
    const popupOptions = {
      iconManager: this.iconManager,
      themeManager: this.themeManager,
      visualAssetsManager: this.visualAssetsManager,
      container,
      ...options
    }

    // UI-004: Create popup component instances based on options
    const stateManager = enableState ? new StateManager() : null
    const uiManager = new UIManager(popupOptions)
    const keyboardManager = enableKeyboard ? new KeyboardManager({ uiManager }) : null
    const controller = new PopupController({
      uiManager,
      stateManager,
      keyboardManager,
      ...popupOptions
    })

    // UI-004: Return all popup components for external control
    return {
      controller,
      uiManager,
      stateManager,
      keyboardManager
    }
  }

  /**
   * Get icon element
   *
   * UI-003: Icon retrieval through UI system
   * SPECIFICATION: Provide centralized icon access with error handling
   * IMPLEMENTATION DECISION: Return null on failure for safe UI operations
   */
  getIcon (iconName, options = {}) {
    if (!this.iconManager) {
      console.warn('Icon manager not initialized')
      // UI-003: Return null for safe fallback when icon manager unavailable
      return null
    }

    // UI-003: Delegate to icon manager for actual icon creation
    return this.iconManager.getIcon(iconName, options)
  }

  /**
   * Create icon button
   *
   * UI-003: Icon button creation through UI system
   * SPECIFICATION: Create interactive icon buttons with consistent styling
   * IMPLEMENTATION DECISION: Centralized button creation for consistency
   */
  createIconButton (iconName, options = {}) {
    if (!this.iconManager) {
      console.warn('Icon manager not initialized')
      // UI-003: Return null for safe fallback when icon manager unavailable
      return null
    }

    // UI-003: Delegate to icon manager for button creation
    return this.iconManager.createIconButton(iconName, options)
  }

  /**
   * Set theme
   *
   * UI-002: Theme switching through UI system
   * SPECIFICATION: Apply theme across all UI components
   * IMPLEMENTATION DECISION: Centralized theme control with automatic propagation
   */
  async setTheme (theme) {
    if (!this.themeManager) {
      console.warn('Theme manager not initialized')
      return
    }

    // UI-002: Apply theme through theme manager (triggers automatic propagation)
    await this.themeManager.setTheme(theme)
  }

  /**
   * Get current theme
   *
   * UI-002: Current theme retrieval
   * SPECIFICATION: Provide current resolved theme for component consistency
   * IMPLEMENTATION DECISION: Default to 'light' if theme manager unavailable
   */
  getTheme () {
    if (!this.themeManager) {
      // UI-002: Default to light theme if theme manager not available
      return 'light'
    }

    // UI-002: Return resolved theme (accounts for system preferences)
    return this.themeManager.getResolvedTheme()
  }

  /**
   * Create theme switcher
   *
   * UI-002: Theme switcher UI component creation
   * SPECIFICATION: Create theme switching control widget
   * IMPLEMENTATION DECISION: Delegate to theme manager for consistent behavior
   */
  createThemeSwitcher (options = {}) {
    if (!this.themeManager) {
      console.warn('Theme manager not initialized')
      // UI-002: Return null for safe fallback when theme manager unavailable
      return null
    }

    // UI-002: Delegate to theme manager for switcher creation
    return this.themeManager.createThemeSwitcher(options)
  }

  /**
   * Get asset
   *
   * UI-003: Asset retrieval through UI system
   * SPECIFICATION: Provide centralized asset access with loading management
   * IMPLEMENTATION DECISION: Return null on failure for safe UI operations
   */
  async getAsset (assetName, options = {}) {
    if (!this.visualAssetsManager) {
      console.warn('Visual assets manager not initialized')
      // UI-003: Return null for safe fallback when assets manager unavailable
      return null
    }

    // UI-003: Delegate to assets manager for asset loading
    return this.visualAssetsManager.getAsset(assetName, options)
  }

  /**
   * Create responsive image
   *
   * UI-003: Responsive image creation through UI system
   * SPECIFICATION: Create responsive image elements with proper sizing
   * IMPLEMENTATION DECISION: Centralized image creation for consistent behavior
   */
  createResponsiveImage (assetName, options = {}) {
    if (!this.visualAssetsManager) {
      console.warn('Visual assets manager not initialized')
      // UI-003: Return null for safe fallback when assets manager unavailable
      return null
    }

    // UI-003: Delegate to assets manager for responsive image creation
    return this.visualAssetsManager.createResponsiveImage(assetName, options)
  }

  /**
   * Preload assets
   *
   * UI-003: Asset preloading through UI system
   * SPECIFICATION: Preload specified assets for performance optimization
   * IMPLEMENTATION DECISION: Allow caller-specified asset lists for flexible preloading
   */
  async preloadAssets (assetList, options = {}) {
    if (!this.visualAssetsManager) {
      console.warn('Visual assets manager not initialized')
      return
    }

    // UI-003: Delegate to assets manager for preloading
    return this.visualAssetsManager.preloadAssets(assetList, options)
  }

  /**
   * Apply theme styles to element
   *
   * UI-002: Theme styling application utility
   * SPECIFICATION: Apply theme-specific styles to DOM elements
   * IMPLEMENTATION DECISION: Direct style application for dynamic theming
   */
  applyThemeStyles (element, styles) {
    if (!element || !styles) return

    // UI-002: Apply styles object to element style properties
    Object.entries(styles).forEach(([property, value]) => {
      element.style[property] = value
    })
  }

  /**
   * Inject CSS into document
   *
   * UI-001: CSS injection utility for dynamic styling
   * SPECIFICATION: Add CSS styles to document head with optional ID
   * IMPLEMENTATION DECISION: Support ID-based replacement for style updates
   */
  injectCSS (css, id = null) {
    // UI-001: Remove existing style element if ID provided
    if (id) {
      const existing = document.getElementById(id)
      if (existing) {
        existing.remove()
      }
    }

    // UI-001: Create and inject new style element
    const style = document.createElement('style')
    style.textContent = css
    if (id) {
      style.id = id
    }
    document.head.appendChild(style)

    return style
  }

  /**
   * Load CSS from URL
   *
   * UI-001: External CSS loading utility
   * SPECIFICATION: Load CSS from external URL with optional ID
   * IMPLEMENTATION DECISION: Promise-based loading for async integration
   */
  async loadCSS (url, id = null) {
    return new Promise((resolve, reject) => {
      // UI-001: Remove existing link element if ID provided
      if (id) {
        const existing = document.getElementById(id)
        if (existing) {
          existing.remove()
        }
      }

      // UI-001: Create and configure link element for CSS loading
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = url
      if (id) {
        link.id = id
      }

      // UI-001: Handle load success and error events
      link.onload = () => resolve(link)
      link.onerror = () => reject(new Error(`Failed to load CSS: ${url}`))

      // UI-001: Add link to document head to start loading
      document.head.appendChild(link)
    })
  }

  /**
   * Load default styles
   *
   * UI-001: Default styling system loader
   * SPECIFICATION: Load core extension styles for consistent appearance
   * IMPLEMENTATION DECISION: Centralized style loading for initialization
   */
  async loadStyles () {
    try {
      // UI-001: Load core extension styles
      // Note: In a real implementation, this would load actual CSS files
      const coreStyles = `
        .hoverboard-ui {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 14px;
          line-height: 1.4;
        }
      `

      // UI-001: Inject core styles with consistent ID
      this.injectCSS(coreStyles, 'hoverboard-core-styles')
    } catch (error) {
      console.error('Failed to load UI styles:', error)
    }
  }

  /**
   * Get system capabilities
   *
   * UI-001: System capability reporting
   * SPECIFICATION: Report available UI system features
   * IMPLEMENTATION DECISION: Boolean flags for feature detection
   */
  getCapabilities () {
    // UI-001: Report current system capabilities based on initialized components
    return {
      hasThemeManager: !!this.themeManager,
      hasIconManager: !!this.iconManager,
      hasVisualAssetsManager: !!this.visualAssetsManager,
      isInitialized: this.isInitialized
    }
  }

  /**
   * Get system statistics
   *
   * UI-001: System statistics reporting
   * SPECIFICATION: Provide system usage and performance statistics
   * IMPLEMENTATION DECISION: Aggregate statistics from all managers
   */
  getStats () {
    const stats = {
      // UI-001: Base system statistics
      isInitialized: this.isInitialized,
      componentsLoaded: 0
    }

    // UI-002: Add theme manager statistics
    if (this.themeManager) {
      stats.componentsLoaded++
      stats.currentTheme = this.themeManager.getResolvedTheme()
    }

    // UI-003: Add icon manager statistics
    if (this.iconManager) {
      stats.componentsLoaded++
      stats.iconsLoaded = this.iconManager.getLoadedCount?.() || 0
    }

    // UI-003: Add assets manager statistics
    if (this.visualAssetsManager) {
      stats.componentsLoaded++
      stats.assetsLoaded = this.visualAssetsManager.getLoadedCount?.() || 0
    }

    return stats
  }

  /**
   * Cleanup resources
   *
   * UI-001: Resource cleanup for proper disposal
   * SPECIFICATION: Clean up all UI system resources and event listeners
   * IMPLEMENTATION DECISION: Comprehensive cleanup to prevent memory leaks
   */
  cleanup () {
    try {
      // UI-002: Cleanup theme manager resources
      if (this.themeManager) {
        this.themeManager.cleanup?.()
        this.themeManager = null
      }

      // UI-003: Cleanup icon manager resources
      if (this.iconManager) {
        this.iconManager.cleanup?.()
        this.iconManager = null
      }

      // UI-003: Cleanup assets manager resources
      if (this.visualAssetsManager) {
        this.visualAssetsManager.cleanup?.()
        this.visualAssetsManager = null
      }

      // UI-001: Reset initialization state
      this.isInitialized = false
      console.log('UI System cleaned up successfully')
    } catch (error) {
      console.error('Error during UI System cleanup:', error)
    }
  }
}

/**
 * Legacy UI helper functions
 *
 * UI-001: Legacy compatibility functions for gradual migration
 * SPECIFICATION: Maintain backward compatibility with existing code
 * IMPLEMENTATION DECISION: Simple wrappers around UI system functionality
 */

// UI-001: Global UI system instance for legacy compatibility
let globalUISystem = null

/**
 * Initialize global UI system
 *
 * UI-001: Legacy initialization function
 * IMPLEMENTATION DECISION: Create global instance for backward compatibility
 */
export async function init (options = {}) {
  if (!globalUISystem) {
    // UI-001: Create global UI system instance
    globalUISystem = new UISystem()
  }

  // UI-001: Initialize with provided options
  return globalUISystem.init(options)
}

/**
 * Get icon using global system
 *
 * UI-003: Legacy icon access function
 * IMPLEMENTATION DECISION: Wrapper around global UI system
 */
export function icon (name, options = {}) {
  if (!globalUISystem) {
    console.warn('UI System not initialized')
    return null
  }

  // UI-003: Delegate to global UI system
  return globalUISystem.getIcon(name, options)
}

/**
 * Create icon button using global system
 *
 * UI-003: Legacy icon button creation
 * IMPLEMENTATION DECISION: Wrapper around global UI system
 */
export function button (iconName, options = {}) {
  if (!globalUISystem) {
    console.warn('UI System not initialized')
    return null
  }

  // UI-003: Delegate to global UI system
  return globalUISystem.createIconButton(iconName, options)
}

/**
 * Set theme using global system
 *
 * UI-002: Legacy theme setting function
 * IMPLEMENTATION DECISION: Wrapper around global UI system
 */
export async function theme (themeName) {
  if (!globalUISystem) {
    console.warn('UI System not initialized')
    return
  }

  // UI-002: Delegate to global UI system
  return globalUISystem.setTheme(themeName)
}

/**
 * Create image using global system
 *
 * UI-003: Legacy image creation function
 * IMPLEMENTATION DECISION: Wrapper around global UI system
 */
export function image (assetName, options = {}) {
  if (!globalUISystem) {
    console.warn('UI System not initialized')
    return null
  }

  // UI-003: Delegate to global UI system
  return globalUISystem.createResponsiveImage(assetName, options)
}

/**
 * Create popup using global system
 *
 * UI-004: Legacy popup creation function
 * IMPLEMENTATION DECISION: Wrapper around global UI system
 */
export function popup (options = {}) {
  if (!globalUISystem) {
    console.warn('UI System not initialized')
    return null
  }

  // UI-004: Delegate to global UI system
  return globalUISystem.createPopup(options)
}

// UI-001: Export UI system class as default
export default UISystem
