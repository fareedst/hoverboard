/**
 * Popup JavaScript - Hoverboard Extension
 * Modern ES6+ module-based popup functionality with integrated UI system
 */

import { init, popup } from '../index.js'
import { ErrorHandler } from '../../shared/ErrorHandler.js'
import { ConfigManager } from '../../config/config-manager.js'
import { normalizePopupErrorInput, getPopupErrorMessage } from './popup-error-message.js'

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
        config
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
   * Handle errors from any component. [IMPL-POPUP_BUNDLE] Delegates message to getPopupErrorMessage for testable logic.
   */
  async handleError (message, errorInfo = null) {
    const errorMessage = normalizePopupErrorInput(message, errorInfo)
    console.error('Popup Error:', errorMessage, errorInfo ?? message)

    if (this.popupComponents && this.popupComponents.uiManager) {
      this.popupComponents.uiManager.showError(getPopupErrorMessage(errorMessage))
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
