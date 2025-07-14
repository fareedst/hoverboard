/**
 * Popup JavaScript - Hoverboard Extension
 * Modern ES6+ module-based popup functionality with integrated UI system
 */

import { init, popup } from '../index.js'
import { ErrorHandler } from '../../shared/ErrorHandler.js'
import { ConfigManager } from '../../config/config-manager.js'

class HoverboardPopup {
  constructor () {
    this.isInitialized = false
    this.popupComponents = null
    this.errorHandler = null
    this.uiSystem = null
    this.configManager = new ConfigManager()

    // Bind context
    this.init = this.init.bind(this)
    this.handleError = this.handleError.bind(this)
    this.cleanup = this.cleanup.bind(this)
  }

  /**
   * Initialize the popup application
   */
  async init () {
    try {
      console.log('Initializing Hoverboard popup...')

      // Initialize error handler first
      this.errorHandler = new ErrorHandler()
      this.errorHandler.onError = (message, errorInfo) => {
        this.handleError(message, errorInfo)
      }

      console.log('Error handler initialized')

      // Initialize UI system
      this.uiSystem = await init({
        enableThemes: true,
        enableIcons: true,
        enableAssets: true,
        preloadCriticalAssets: true
      })

      console.log('UI system initialized')

      // Load configuration
      const config = await this.configManager.getConfig()
      console.log('Configuration loaded:', config)

      // Create popup with integrated UI system
      this.popupComponents = popup({
        errorHandler: this.errorHandler,
        enableKeyboard: true,
        enableState: true,
        config: config
      })

      console.log('Popup components created')

      // Load initial data
      await this.popupComponents.controller.loadInitialData()

      console.log('Initial data loaded')

      // Setup UI
      this.popupComponents.uiManager.setupEventListeners()
      if (this.popupComponents.keyboardManager) {
        this.popupComponents.keyboardManager.setupKeyboardNavigation()
      }

      console.log('Event listeners setup complete')

      // Mark as initialized
      this.isInitialized = true

      console.log('Hoverboard popup initialized successfully with modern UI system')
    } catch (error) {
      console.error('Failed to initialize popup:', error)
      this.handleError('Failed to initialize popup', error)
    }
  }

  /**
   * Handle errors from any component
   */
  async handleError (message, errorInfo = null) {
    // Handle different parameter formats
    let errorMessage = message
    let actualError = errorInfo

    // If first parameter is an error object, adjust parameters
    if (typeof message === 'object' && message !== null) {
      actualError = message
      errorMessage = actualError.message || 'An unexpected error occurred'
    }

    console.error('Popup Error:', errorMessage, actualError)

    // Check if this is an auth error
    const authErrorMessages = [
      'No authentication token configured',
      'Authentication failed',
      'Invalid API token'
    ]

    if (authErrorMessages.some(msg => errorMessage.includes(msg))) {
      if (this.popupComponents && this.popupComponents.uiManager) {
        this.popupComponents.uiManager.showError('Please configure your Pinboard API token in the extension options.')
      }
      return
    }

    // Check for network errors
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      if (this.popupComponents && this.popupComponents.uiManager) {
        this.popupComponents.uiManager.showError('Network error. Please check your connection and try again.')
      }
      return
    }

    // Check for permission errors
    if (errorMessage.includes('permission') || errorMessage.includes('denied')) {
      if (this.popupComponents && this.popupComponents.uiManager) {
        this.popupComponents.uiManager.showError('Permission denied. Please check extension permissions.')
      }
      return
    }

    // Generic error fallback
    if (this.popupComponents && this.popupComponents.uiManager) {
      this.popupComponents.uiManager.showError('An unexpected error occurred. Please try again.')
    }
  }

  /**
   * Cleanup resources when popup is closed
   */
  cleanup () {
    if (this.popupComponents) {
      if (this.popupComponents.keyboardManager) {
        this.popupComponents.keyboardManager.cleanup()
      }

      if (this.popupComponents.uiManager) {
        this.popupComponents.uiManager.cleanup()
      }

      if (this.popupComponents.controller) {
        this.popupComponents.controller.cleanup()
      }
    }

    if (this.uiSystem) {
      this.uiSystem.cleanup()
    }

    this.isInitialized = false
  }
}

// Application instance
let app = null

/**
 * Initialize the application when DOM is ready
 */
function initializeApp () {
  try {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeApp)
      return
    }

    console.log('DOM ready, creating Hoverboard popup...')
    app = new HoverboardPopup()
    app.init().catch(error => {
      console.error('Failed to initialize Hoverboard popup:', error)

      // Try to show error in UI if possible
      if (app && app.popupComponents && app.popupComponents.uiManager) {
        app.popupComponents.uiManager.showError('Failed to initialize popup. Please try reloading the extension.')
      }
    })
  } catch (error) {
    console.error('Critical error during popup initialization:', error)
  }
}

/**
 * Cleanup when window is about to close
 */
window.addEventListener('beforeunload', () => {
  if (app) {
    app.cleanup()
  }
})

/**
 * Handle extension reload
 */
window.addEventListener('unload', () => {
  if (app) {
    app.cleanup()
  }
})

// Initialize when script loads
initializeApp()

// Export for debugging
window.HoverboardPopup = { app }
