/**
 * Popup JavaScript - Hoverboard Extension
 * Modern ES6+ module-based popup functionality
 */

import { PopupController } from './PopupController.js';
import { UIManager } from './UIManager.js';
import { KeyboardManager } from './KeyboardManager.js';
import { StateManager } from './StateManager.js';
import { ErrorHandler } from '../../shared/ErrorHandler.js';

class HoverboardPopup {
  constructor() {
    this.isInitialized = false;
    this.controller = null;
    this.uiManager = null;
    this.keyboardManager = null;
    this.stateManager = null;
    this.errorHandler = null;
    
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

      // Initialize state manager
      this.stateManager = new StateManager();
      
      // Initialize UI manager
      this.uiManager = new UIManager({
        errorHandler: this.errorHandler,
        stateManager: this.stateManager
      });

      // Initialize keyboard manager
      this.keyboardManager = new KeyboardManager({
        uiManager: this.uiManager
      });

      // Initialize main controller
      this.controller = new PopupController({
        uiManager: this.uiManager,
        stateManager: this.stateManager,
        errorHandler: this.errorHandler
      });

      // Load initial data
      await this.controller.loadInitialData();
      
      // Setup UI
      this.uiManager.setupEventListeners();
      this.keyboardManager.setupKeyboardNavigation();
      
      // Mark as initialized
      this.isInitialized = true;
      
      console.log('Hoverboard popup initialized successfully');
      
    } catch (error) {
      this.handleError('Failed to initialize popup', error);
    }
  }

  /**
   * Handle errors from any component
   */
  handleError(message, error = null) {
    console.error('Popup Error:', message, error);
    
    if (this.uiManager) {
      this.uiManager.showError(message);
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
    if (this.keyboardManager) {
      this.keyboardManager.cleanup();
    }
    
    if (this.uiManager) {
      this.uiManager.cleanup();
    }
    
    if (this.controller) {
      this.controller.cleanup();
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