/**
 * UI Module Index - Hoverboard Extension
 * Central export point for all UI components and systems
 *
 * [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Centralized UI system architecture with component coordination
 * [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Theme management and visual consistency system
 * [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Icon management and asset loading system
 * [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Popup creation and interaction management
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
 * [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Main UI system orchestration class
 * SPECIFICATION: Coordinate themes, icons, assets, and popup components
 * IMPLEMENTATION DECISION: Initialization order ensures dependencies are resolved
 */
export class UISystem {
  constructor () {
    // [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Component manager instances - initialized in proper order
    this.iconManager = null
    this.themeManager = null
    this.visualAssetsManager = null
    // [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Initialization state tracking for safety checks
    this.isInitialized = false

    // [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Bind methods for consistent context in async operations
    this.init = this.init.bind(this)
    this.createPopup = this.createPopup.bind(this)
    this.setTheme = this.setTheme.bind(this)
    this.preloadAssets = this.preloadAssets.bind(this)
  }

  /**
   * Initialize the UI system
   *
   * [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: System initialization with dependency management
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
      // [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Initialize theme manager first for CSS variables
      // IMPLEMENTATION DECISION: Themes provide foundation for all visual components
      if (enableThemes) {
        this.themeManager = new ThemeManager()
        await this.themeManager.init()
      }

      // [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Initialize icon manager with theme integration
      if (enableIcons) {
        this.iconManager = new IconManager()
        if (this.themeManager) {
          // [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Apply current theme to icon manager
          this.iconManager.setTheme(this.themeManager.getResolvedTheme())

          // [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Listen for theme changes and update icons accordingly
          // IMPLEMENTATION DECISION: Automatic theme propagation for visual consistency
          this.themeManager.addListener(({ resolvedTheme }) => {
            this.iconManager.setTheme(resolvedTheme)
          })
        }
      }

      // [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Initialize visual assets manager with preloading
      if (enableAssets) {
        this.visualAssetsManager = new VisualAssetsManager()

        // [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Preload critical assets for performance
        // IMPLEMENTATION DECISION: Preload common assets to reduce loading delays
        if (preloadCriticalAssets) {
          await this.visualAssetsManager.preloadCriticalAssets()
        }
      }

      // [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Mark system as fully initialized
      this.isInitialized = true
      console.log('UI System initialized successfully')
    } catch (error) {
      console.error('Failed to initialize UI System:', error)
      // [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Re-throw initialization errors for caller handling
      throw error
    }
  }

  /**
   * Create popup application instance
   *
   * [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Popup application factory with integrated components
   * SPECIFICATION: Create popup with all UI system components integrated
   * IMPLEMENTATION DECISION: Inject UI managers into popup for seamless integration
   */
  createPopup (options = {}) {
    // [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Ensure UI system is initialized before creating popup
    if (!this.isInitialized) {
      throw new Error('UI System must be initialized before creating popup')
    }

    const {
      container = document.body,
      enableKeyboard = true,
      enableState = true
    } = options

    // [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Create popup components with UI system integration
    // IMPLEMENTATION DECISION: Pass UI managers to popup for integrated functionality
    const popupOptions = {
      iconManager: this.iconManager,
      themeManager: this.themeManager,
      visualAssetsManager: this.visualAssetsManager,
      container,
      ...options
    }

    // [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Create popup component instances based on options
    // [IMPL-SIDE_PANEL_BOOKMARK] [IMPL-UIManager_SCOPED_ROOT] Pass container when provided (side panel Bookmark tab) so UIManager resolves elements via data-popup-ref.
    const stateManager = enableState ? new StateManager() : null
    const uiManager = new UIManager({
      errorHandler: popupOptions.errorHandler,
      stateManager,
      config: popupOptions.config || {},
      container: popupOptions.container !== undefined && popupOptions.container !== document.body ? popupOptions.container : null
    })
    const keyboardManager = enableKeyboard ? new KeyboardManager({ uiManager }) : null
    const controller = new PopupController({
      uiManager,
      stateManager,
      keyboardManager,
      ...popupOptions
    })

    // [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Return all popup components for external control
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
   * [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Icon retrieval through UI system
   * SPECIFICATION: Provide centralized icon access with error handling
   * IMPLEMENTATION DECISION: Return null on failure for safe UI operations
   */
  getIcon (iconName, options = {}) {
    if (!this.iconManager) {
      console.warn('Icon manager not initialized')
      // [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Return null for safe fallback when icon manager unavailable
      return null
    }

    // [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Delegate to icon manager for actual icon creation
    return this.iconManager.getIcon(iconName, options)
  }

  /**
   * Create icon button
   *
   * [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Icon button creation through UI system
   * SPECIFICATION: Create interactive icon buttons with consistent styling
   * IMPLEMENTATION DECISION: Centralized button creation for consistency
   */
  createIconButton (iconName, options = {}) {
    if (!this.iconManager) {
      console.warn('Icon manager not initialized')
      // [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Return null for safe fallback when icon manager unavailable
      return null
    }

    // [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Delegate to icon manager for button creation
    return this.iconManager.createIconButton(iconName, options)
  }

  /**
   * Set theme
   *
   * [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Theme switching through UI system
   * SPECIFICATION: Apply theme across all UI components
   * IMPLEMENTATION DECISION: Centralized theme control with automatic propagation
   */
  async setTheme (theme) {
    if (!this.themeManager) {
      console.warn('Theme manager not initialized')
      return
    }

    // [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Apply theme through theme manager (triggers automatic propagation)
    await this.themeManager.setTheme(theme)
  }

  /**
   * Get current theme
   *
   * [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Current theme retrieval
   * SPECIFICATION: Provide current resolved theme for component consistency
   * IMPLEMENTATION DECISION: Default to 'light' if theme manager unavailable
   */
  getTheme () {
    if (!this.themeManager) {
      // [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Default to light theme if theme manager not available
      return 'light'
    }

    // [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Return resolved theme (accounts for system preferences)
    return this.themeManager.getResolvedTheme()
  }

  /**
   * Create theme switcher
   *
   * [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Theme switcher UI component creation
   * SPECIFICATION: Create theme switching control widget
   * IMPLEMENTATION DECISION: Delegate to theme manager for consistent behavior
   */
  createThemeSwitcher (options = {}) {
    if (!this.themeManager) {
      console.warn('Theme manager not initialized')
      // [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Return null for safe fallback when theme manager unavailable
      return null
    }

    // [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Delegate to theme manager for switcher creation
    return this.themeManager.createThemeSwitcher(options)
  }

  /**
   * Get asset
   *
   * [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Asset retrieval through UI system
   * SPECIFICATION: Provide centralized asset access with loading management
   * IMPLEMENTATION DECISION: Return null on failure for safe UI operations
   */
  async getAsset (assetName, options = {}) {
    if (!this.visualAssetsManager) {
      console.warn('Visual assets manager not initialized')
      // [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Return null for safe fallback when assets manager unavailable
      return null
    }

    // [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Delegate to assets manager for asset loading
    return this.visualAssetsManager.getAsset(assetName, options)
  }

  /**
   * Create responsive image
   *
   * [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Responsive image creation through UI system
   * SPECIFICATION: Create responsive image elements with proper sizing
   * IMPLEMENTATION DECISION: Centralized image creation for consistent behavior
   */
  createResponsiveImage (assetName, options = {}) {
    if (!this.visualAssetsManager) {
      console.warn('Visual assets manager not initialized')
      // [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Return null for safe fallback when assets manager unavailable
      return null
    }

    // [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Delegate to assets manager for responsive image creation
    return this.visualAssetsManager.createResponsiveImage(assetName, options)
  }

  /**
   * Preload assets
   *
   * [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Asset preloading through UI system
   * SPECIFICATION: Preload specified assets for performance optimization
   * IMPLEMENTATION DECISION: Allow caller-specified asset lists for flexible preloading
   */
  async preloadAssets (assetList, options = {}) {
    if (!this.visualAssetsManager) {
      console.warn('Visual assets manager not initialized')
      return
    }

    // [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Delegate to assets manager for preloading
    return this.visualAssetsManager.preloadAssets(assetList, options)
  }

  /**
   * Apply theme styles to element
   *
   * [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Theme styling application utility
   * SPECIFICATION: Apply theme-specific styles to DOM elements
   * IMPLEMENTATION DECISION: Direct style application for dynamic theming
   */
  applyThemeStyles (element, styles) {
    if (!element || !styles) return

    // [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Apply styles object to element style properties
    Object.entries(styles).forEach(([property, value]) => {
      element.style[property] = value
    })
  }

  /**
   * Inject CSS into document
   *
   * [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: CSS injection utility for dynamic styling
   * SPECIFICATION: Add CSS styles to document head with optional ID
   * IMPLEMENTATION DECISION: Support ID-based replacement for style updates
   */
  injectCSS (css, id = null) {
    // [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Remove existing style element if ID provided
    if (id) {
      const existing = document.getElementById(id)
      if (existing) {
        existing.remove()
      }
    }

    // [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Create and inject new style element
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
   * [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: External CSS loading utility
   * SPECIFICATION: Load CSS from external URL with optional ID
   * IMPLEMENTATION DECISION: Promise-based loading for async integration
   */
  async loadCSS (url, id = null) {
    return new Promise((resolve, reject) => {
      // [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Remove existing link element if ID provided
      if (id) {
        const existing = document.getElementById(id)
        if (existing) {
          existing.remove()
        }
      }

      // [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Create and configure link element for CSS loading
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = url
      if (id) {
        link.id = id
      }

      // [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Handle load success and error events
      link.onload = () => resolve(link)
      link.onerror = () => reject(new Error(`Failed to load CSS: ${url}`))

      // [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Add link to document head to start loading
      document.head.appendChild(link)
    })
  }

  /**
   * Load default styles
   *
   * [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Default styling system loader
   * SPECIFICATION: Load core extension styles for consistent appearance
   * IMPLEMENTATION DECISION: Centralized style loading for initialization
   */
  async loadStyles () {
    try {
      // [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Load core extension styles
      // Note: In a real implementation, this would load actual CSS files
      const coreStyles = `
        .hoverboard-ui {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 14px;
          line-height: 1.4;
        }
      `

      // [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Inject core styles with consistent ID
      this.injectCSS(coreStyles, 'hoverboard-core-styles')
    } catch (error) {
      console.error('Failed to load UI styles:', error)
    }
  }

  /**
   * Get system capabilities
   *
   * [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: System capability reporting
   * SPECIFICATION: Report available UI system features
   * IMPLEMENTATION DECISION: Boolean flags for feature detection
   */
  getCapabilities () {
    // [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Report current system capabilities based on initialized components
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
   * [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: System statistics reporting
   * SPECIFICATION: Provide system usage and performance statistics
   * IMPLEMENTATION DECISION: Aggregate statistics from all managers
   */
  getStats () {
    const stats = {
      // [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Base system statistics
      isInitialized: this.isInitialized,
      componentsLoaded: 0
    }

    // [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Add theme manager statistics
    if (this.themeManager) {
      stats.componentsLoaded++
      stats.currentTheme = this.themeManager.getResolvedTheme()
    }

    // [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Add icon manager statistics
    if (this.iconManager) {
      stats.componentsLoaded++
      stats.iconsLoaded = this.iconManager.getLoadedCount?.() || 0
    }

    // [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Add assets manager statistics
    if (this.visualAssetsManager) {
      stats.componentsLoaded++
      stats.assetsLoaded = this.visualAssetsManager.getLoadedCount?.() || 0
    }

    return stats
  }

  /**
   * Cleanup resources
   *
   * [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Resource cleanup for proper disposal
   * SPECIFICATION: Clean up all UI system resources and event listeners
   * IMPLEMENTATION DECISION: Comprehensive cleanup to prevent memory leaks
   */
  cleanup () {
    try {
      // [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Cleanup theme manager resources
      if (this.themeManager) {
        this.themeManager.cleanup?.()
        this.themeManager = null
      }

      // [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Cleanup icon manager resources
      if (this.iconManager) {
        this.iconManager.cleanup?.()
        this.iconManager = null
      }

      // [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Cleanup assets manager resources
      if (this.visualAssetsManager) {
        this.visualAssetsManager.cleanup?.()
        this.visualAssetsManager = null
      }

      // [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Reset initialization state
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
 * [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Legacy compatibility functions for gradual migration
 * SPECIFICATION: Maintain backward compatibility with existing code
 * IMPLEMENTATION DECISION: Simple wrappers around UI system functionality
 */

// [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Global UI system instance for legacy compatibility
let globalUISystem = null

/**
 * Initialize global UI system
 *
 * [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Legacy initialization function
 * IMPLEMENTATION DECISION: Create global instance for backward compatibility
 */
export async function init (options = {}) {
  if (!globalUISystem) {
    // [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Create global UI system instance
    globalUISystem = new UISystem()
  }

  // [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Initialize with provided options
  return globalUISystem.init(options)
}

/**
 * Get icon using global system
 *
 * [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Legacy icon access function
 * IMPLEMENTATION DECISION: Wrapper around global UI system
 */
export function icon (name, options = {}) {
  if (!globalUISystem) {
    console.warn('UI System not initialized')
    return null
  }

  // [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Delegate to global UI system
  return globalUISystem.getIcon(name, options)
}

/**
 * Create icon button using global system
 *
 * [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Legacy icon button creation
 * IMPLEMENTATION DECISION: Wrapper around global UI system
 */
export function button (iconName, options = {}) {
  if (!globalUISystem) {
    console.warn('UI System not initialized')
    return null
  }

  // [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Delegate to global UI system
  return globalUISystem.createIconButton(iconName, options)
}

/**
 * Set theme using global system
 *
 * [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Legacy theme setting function
 * IMPLEMENTATION DECISION: Wrapper around global UI system
 */
export async function theme (themeName) {
  if (!globalUISystem) {
    console.warn('UI System not initialized')
    return
  }

  // [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Delegate to global UI system
  return globalUISystem.setTheme(themeName)
}

/**
 * Create image using global system
 *
 * [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Legacy image creation function
 * IMPLEMENTATION DECISION: Wrapper around global UI system
 */
export function image (assetName, options = {}) {
  if (!globalUISystem) {
    console.warn('UI System not initialized')
    return null
  }

  // [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Delegate to global UI system
  return globalUISystem.createResponsiveImage(assetName, options)
}

/**
 * Create popup using global system
 *
 * [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Legacy popup creation function
 * IMPLEMENTATION DECISION: Wrapper around global UI system
 */
export function popup (options = {}) {
  if (!globalUISystem) {
    console.warn('UI System not initialized')
    return null
  }

  // [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Delegate to global UI system
  return globalUISystem.createPopup(options)
}

// [IMPL-OVERLAY] [ARCH-OVERLAY] [REQ-CORE_UX_PRESERVATION]: Export UI system class as default
export default UISystem
