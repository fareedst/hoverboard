/**
 * UI Module Index - Hoverboard Extension
 * Central export point for all UI components and systems
 */

// Import all UI components
import { IconManager } from './components/IconManager.js';
import { ThemeManager } from './components/ThemeManager.js';
import { VisualAssetsManager } from './components/VisualAssetsManager.js';

// Import popup components
import { PopupController } from './popup/PopupController.js';
import { UIManager } from './popup/UIManager.js';
import { KeyboardManager } from './popup/KeyboardManager.js';
import { StateManager } from './popup/StateManager.js';

/**
 * UI System Manager - Central coordinator for all UI components
 */
export class UISystem {
  constructor() {
    this.iconManager = null;
    this.themeManager = null;
    this.visualAssetsManager = null;
    this.isInitialized = false;
    
    // Bind methods
    this.init = this.init.bind(this);
    this.createPopup = this.createPopup.bind(this);
    this.setTheme = this.setTheme.bind(this);
    this.preloadAssets = this.preloadAssets.bind(this);
  }

  /**
   * Initialize the UI system
   */
  async init(options = {}) {
    const {
      enableThemes = true,
      enableIcons = true,
      enableAssets = true,
      preloadCriticalAssets = true
    } = options;

    try {
      // Initialize theme manager first for CSS variables
      if (enableThemes) {
        this.themeManager = new ThemeManager();
        await this.themeManager.init();
      }

      // Initialize icon manager
      if (enableIcons) {
        this.iconManager = new IconManager();
        if (this.themeManager) {
          this.iconManager.setTheme(this.themeManager.getResolvedTheme());
          
          // Listen for theme changes
          this.themeManager.addListener(({ resolvedTheme }) => {
            this.iconManager.setTheme(resolvedTheme);
          });
        }
      }

      // Initialize visual assets manager
      if (enableAssets) {
        this.visualAssetsManager = new VisualAssetsManager();
        
        // Preload critical assets
        if (preloadCriticalAssets) {
          await this.visualAssetsManager.preloadCriticalAssets();
        }
      }

      this.isInitialized = true;
      console.log('UI System initialized successfully');

    } catch (error) {
      console.error('Failed to initialize UI System:', error);
      throw error;
    }
  }

  /**
   * Create popup application instance
   */
  createPopup(options = {}) {
    if (!this.isInitialized) {
      throw new Error('UI System must be initialized before creating popup');
    }

    const {
      container = document.body,
      enableKeyboard = true,
      enableState = true
    } = options;

    // Create popup components with UI system integration
    const popupOptions = {
      iconManager: this.iconManager,
      themeManager: this.themeManager,
      visualAssetsManager: this.visualAssetsManager,
      container,
      ...options
    };

    const stateManager = enableState ? new StateManager() : null;
    const uiManager = new UIManager(popupOptions);
    const keyboardManager = enableKeyboard ? new KeyboardManager({ uiManager }) : null;
    const controller = new PopupController({
      uiManager,
      stateManager,
      keyboardManager,
      ...popupOptions
    });

    return {
      controller,
      uiManager,
      stateManager,
      keyboardManager
    };
  }

  /**
   * Get icon element
   */
  getIcon(iconName, options = {}) {
    if (!this.iconManager) {
      console.warn('Icon manager not initialized');
      return null;
    }
    
    return this.iconManager.getIcon(iconName, options);
  }

  /**
   * Create icon button
   */
  createIconButton(iconName, options = {}) {
    if (!this.iconManager) {
      console.warn('Icon manager not initialized');
      return null;
    }
    
    return this.iconManager.createIconButton(iconName, options);
  }

  /**
   * Set theme
   */
  async setTheme(theme) {
    if (!this.themeManager) {
      console.warn('Theme manager not initialized');
      return;
    }
    
    await this.themeManager.setTheme(theme);
  }

  /**
   * Get current theme
   */
  getTheme() {
    if (!this.themeManager) {
      return 'light';
    }
    
    return this.themeManager.getResolvedTheme();
  }

  /**
   * Create theme switcher
   */
  createThemeSwitcher(options = {}) {
    if (!this.themeManager) {
      console.warn('Theme manager not initialized');
      return null;
    }
    
    return this.themeManager.createThemeSwitcher(options);
  }

  /**
   * Get asset
   */
  async getAsset(assetName, options = {}) {
    if (!this.visualAssetsManager) {
      console.warn('Visual assets manager not initialized');
      return null;
    }
    
    return this.visualAssetsManager.getAsset(assetName, options);
  }

  /**
   * Create responsive image
   */
  createResponsiveImage(assetName, options = {}) {
    if (!this.visualAssetsManager) {
      console.warn('Visual assets manager not initialized');
      return null;
    }
    
    return this.visualAssetsManager.createResponsiveImage(assetName, options);
  }

  /**
   * Preload assets
   */
  async preloadAssets(assetList, options = {}) {
    if (!this.visualAssetsManager) {
      console.warn('Visual assets manager not initialized');
      return;
    }
    
    return this.visualAssetsManager.preloadAssets(assetList, options);
  }

  /**
   * Apply theme styles to element
   */
  applyThemeStyles(element, styles) {
    if (!this.themeManager) {
      console.warn('Theme manager not initialized');
      return;
    }
    
    this.themeManager.applyThemeStyles(element, styles);
  }

  /**
   * Inject CSS into document
   */
  injectCSS(css, id = null) {
    const style = document.createElement('style');
    style.textContent = css;
    
    if (id) {
      style.id = id;
      
      // Remove existing style with same ID
      const existing = document.getElementById(id);
      if (existing) {
        existing.remove();
      }
    }
    
    document.head.appendChild(style);
    return style;
  }

  /**
   * Load CSS file
   */
  async loadCSS(url, id = null) {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = chrome.runtime.getURL(url);
      
      if (id) {
        link.id = id;
        
        // Remove existing link with same ID
        const existing = document.getElementById(id);
        if (existing) {
          existing.remove();
        }
      }
      
      link.onload = resolve;
      link.onerror = reject;
      
      document.head.appendChild(link);
    });
  }

  /**
   * Load all UI styles
   */
  async loadStyles() {
    const styleFiles = [
      'src-new/ui/styles/design-tokens.css',
      'src-new/ui/styles/components.css',
      'src-new/ui/styles/icons.css',
      'src-new/ui/popup/popup.css'
    ];

    const loadPromises = styleFiles.map((file, index) => {
      return this.loadCSS(file, `hb-ui-styles-${index}`);
    });

    await Promise.all(loadPromises);
    console.log('UI styles loaded successfully');
  }

  /**
   * Get system capabilities
   */
  getCapabilities() {
    return {
      themes: !!this.themeManager,
      icons: !!this.iconManager,
      assets: !!this.visualAssetsManager,
      darkMode: this.themeManager?.supportsSystemTheme() || false,
      svg: this.visualAssetsManager?.supportsSVG() || false
    };
  }

  /**
   * Get system statistics
   */
  getStats() {
    const stats = {
      initialized: this.isInitialized
    };

    if (this.iconManager) {
      stats.icons = this.iconManager.getAvailableIcons().length;
    }

    if (this.themeManager) {
      stats.theme = this.themeManager.getResolvedTheme();
    }

    if (this.visualAssetsManager) {
      stats.assets = this.visualAssetsManager.getCacheStats();
    }

    return stats;
  }

  /**
   * Cleanup UI system
   */
  cleanup() {
    if (this.themeManager) {
      this.themeManager.cleanup();
    }

    if (this.visualAssetsManager) {
      this.visualAssetsManager.cleanup();
    }

    this.isInitialized = false;
    console.log('UI System cleaned up');
  }
}

// Create default UI system instance
export const uiSystem = new UISystem();

// Individual component exports
export {
  IconManager,
  ThemeManager,
  VisualAssetsManager,
  PopupController,
  UIManager,
  KeyboardManager,
  StateManager
};

// Utility functions for common UI operations
export const ui = {
  /**
   * Initialize UI system with default settings
   */
  async init(options = {}) {
    await uiSystem.init(options);
    await uiSystem.loadStyles();
    return uiSystem;
  },

  /**
   * Quick icon creation
   */
  icon(name, options = {}) {
    return uiSystem.getIcon(name, options);
  },

  /**
   * Quick button creation
   */
  button(iconName, options = {}) {
    return uiSystem.createIconButton(iconName, options);
  },

  /**
   * Quick theme setting
   */
  async theme(themeName) {
    await uiSystem.setTheme(themeName);
  },

  /**
   * Quick image creation
   */
  image(assetName, options = {}) {
    return uiSystem.createResponsiveImage(assetName, options);
  },

  /**
   * Quick popup creation
   */
  popup(options = {}) {
    return uiSystem.createPopup(options);
  }
};

// Export default UI system
export default uiSystem; 