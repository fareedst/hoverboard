/**
 * Popup JavaScript - Hoverboard Extension
 * Modern ES6+ module-based popup functionality with integrated UI system
 */

import { ui } from '../index.js';
import { ErrorHandler } from '../../shared/ErrorHandler.js';

class HoverboardPopup {
  constructor() {
    this.isInitialized = false;
    this.popupComponents = null;
    this.errorHandler = null;
    this.uiSystem = null;
    
    // Bind context
    this.init = this.init.bind(this);
    this.handleError = this.handleError.bind(this);
    this.cleanup = this.cleanup.bind(this);
  }

  /**
   * Initialize the popup application
   */
  async init() {
    try {
      // Initialize error handler first
      this.errorHandler = new ErrorHandler();
      this.errorHandler.onError = this.handleError;

      // Initialize UI system
      this.uiSystem = await ui.init({
        enableThemes: true,
        enableIcons: true,
        enableAssets: true,
        preloadCriticalAssets: true
      });

      // Create popup with integrated UI system
      this.popupComponents = ui.popup({
        errorHandler: this.errorHandler,
        enableKeyboard: true,
        enableState: true
      });

      // Load initial data
      await this.popupComponents.controller.loadInitialData();
      
      // Setup UI
      this.popupComponents.uiManager.setupEventListeners();
      if (this.popupComponents.keyboardManager) {
        this.popupComponents.keyboardManager.setupKeyboardNavigation();
      }
      
      // Mark as initialized
      this.isInitialized = true;
      
      console.log('Hoverboard popup initialized successfully with modern UI system');
      
    } catch (error) {
      this.handleError('Failed to initialize popup', error);
    }
  }

  /**
   * Handle errors from any component
   */
  handleError(message, error = null) {
    console.error('Popup Error:', message, error);
    
    if (this.popupComponents?.uiManager) {
      this.popupComponents.uiManager.showError(message);
    } else {
      // Fallback error display if UI manager not available
      const errorToast = document.getElementById('errorToast');
      const errorContent = document.getElementById('errorContent');
      
      if (errorToast && errorContent) {
        errorContent.textContent = message;
        errorToast.hidden = false;
        
        setTimeout(() => {
          errorToast.hidden = true;
        }, 5000);
      }
    }
  }

  /**
   * Cleanup resources when popup is closed
   */
  cleanup() {
    if (this.popupComponents) {
      if (this.popupComponents.keyboardManager) {
        this.popupComponents.keyboardManager.cleanup();
      }
      
      if (this.popupComponents.uiManager) {
        this.popupComponents.uiManager.cleanup();
      }
      
      if (this.popupComponents.controller) {
        this.popupComponents.controller.cleanup();
      }
    }
    
    if (this.uiSystem) {
      this.uiSystem.cleanup();
    }
    
    this.isInitialized = false;
  }
}

// Application instance
let app = null;

/**
 * Initialize the application when DOM is ready
 */
function initializeApp() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
    return;
  }
  
  app = new HoverboardPopup();
  app.init().catch(error => {
    console.error('Failed to initialize Hoverboard popup:', error);
  });
}

/**
 * Cleanup when window is about to close
 */
window.addEventListener('beforeunload', () => {
  if (app) {
    app.cleanup();
  }
});

/**
 * Handle extension reload
 */
window.addEventListener('unload', () => {
  if (app) {
    app.cleanup();
  }
});

// Start the application
initializeApp();

// Export for debugging
window.HoverboardPopup = { app }; 