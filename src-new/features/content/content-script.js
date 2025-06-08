/**
 * Content Script Main Module
 * Coordinates all content script functionality with modern architecture
 */

import { HoverSystem } from './hover-system.js';
import { OverlayManager } from './overlay-manager.js';
import { ContentInjector } from './content-injector.js';
import { MessageService } from '../../core/message-service.js';
import { ConfigService } from '../../config/config-service.js';
import { Logger } from '../../shared/logger.js';

class ContentScript {
  constructor() {
    this.logger = new Logger('ContentScript');
    this.messageService = new MessageService();
    this.configService = new ConfigService();
    
    this.hoverSystem = null;
    this.overlayManager = null;
    this.contentInjector = null;
    
    this.initialized = false;
    this.currentTab = {
      id: null,
      title: document.title,
      url: window.location.href
    };
  }

  /**
   * Initialize the content script system
   */
  async initialize() {
    try {
      this.logger.debug('Initializing content script system');
      
      // Load configuration
      const config = await this.configService.getInjectOptions();
      
      // Initialize core components
      this.contentInjector = new ContentInjector(document, config);
      this.overlayManager = new OverlayManager(document, config);
      this.hoverSystem = new HoverSystem(document, config, this.overlayManager);
      
      // Set up message handling
      this.setupMessageHandling();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Check if we should show hover on page load
      await this.handlePageLoad();
      
      this.initialized = true;
      this.logger.info('Content script system initialized successfully');
      
    } catch (error) {
      this.logger.error('Failed to initialize content script system:', error);
    }
  }

  /**
   * Set up message handling between content script and background
   */
  setupMessageHandling() {
    this.messageService.onMessage('showHover', (request) => {
      this.hoverSystem.displayHover({
        displayNow: true,
        pageLoad: false,
        tabId: this.currentTab.id,
        useBlock: false
      });
    });

    this.messageService.onMessage('hideHover', () => {
      this.hoverSystem.hideHover();
    });

    this.messageService.onMessage('toggleHover', () => {
      this.hoverSystem.toggleHover();
    });

    this.messageService.onMessage('refreshHover', () => {
      this.hoverSystem.refreshHover();
    });

    // Handle configuration updates
    this.messageService.onMessage('configUpdated', async (config) => {
      await this.handleConfigUpdate(config);
    });
  }

  /**
   * Set up DOM event listeners
   */
  setupEventListeners() {
    // Handle page navigation
    let lastUrl = window.location.href;
    
    const observer = new MutationObserver(() => {
      if (lastUrl !== window.location.href) {
        lastUrl = window.location.href;
        this.currentTab.url = lastUrl;
        this.currentTab.title = document.title;
        this.handlePageNavigation();
      }
    });

    observer.observe(document, {
      childList: true,
      subtree: true
    });

    // Handle escape key to close hover
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.hoverSystem.isHoverVisible()) {
        this.hoverSystem.hideHover();
      }
    });

    // Handle clicks outside overlay
    document.addEventListener('click', (event) => {
      if (this.hoverSystem.isHoverVisible() && !this.overlayManager.isClickInsideOverlay(event)) {
        this.hoverSystem.hideHover();
      }
    });
  }

  /**
   * Handle page load to potentially show hover
   */
  async handlePageLoad() {
    try {
      // Get current tab info
      const tabs = await this.messageService.sendMessage('getCurrentTab');
      if (tabs && tabs.length > 0) {
        this.currentTab.id = tabs[0].id;
      }

      // Check if we should display hover on page load
      const config = await this.configService.getInjectOptions();
      const shouldShow = await this.shouldShowHoverOnPageLoad(config);
      
      if (shouldShow) {
        // Add small delay to ensure page is ready
        setTimeout(() => {
          this.hoverSystem.displayHover({
            displayNow: true,
            pageLoad: true,
            tabId: this.currentTab.id,
            useBlock: true
          });
        }, config.pageLoadDelay || 1000);
      }
      
    } catch (error) {
      this.logger.error('Error handling page load:', error);
    }
  }

  /**
   * Handle page navigation events
   */
  async handlePageNavigation() {
    this.logger.debug('Page navigation detected:', this.currentTab.url);
    
    // Hide current hover if visible
    if (this.hoverSystem.isHoverVisible()) {
      this.hoverSystem.hideHover();
    }
    
    // Check if we should show hover for new page
    await this.handlePageLoad();
  }

  /**
   * Determine if hover should be shown on page load
   */
  async shouldShowHoverOnPageLoad(config) {
    try {
      // Check if URL is in inhibit list
      const isInhibited = await this.messageService.sendMessage('isUrlInhibited', {
        url: this.currentTab.url
      });
      
      if (isInhibited) {
        this.logger.debug('URL is inhibited, not showing hover');
        return false;
      }

      // Check page load settings
      if (!config.showHoverOnPageLoad) {
        return false;
      }

      // Get current pin data to check conditions
      const pinData = await this.messageService.sendMessage('getCurrentPin', {
        url: this.currentTab.url,
        title: this.currentTab.title,
        tabId: this.currentTab.id
      });

      if (!pinData) {
        return config.showHoverOnPageLoadForNewSites;
      }

      // Check tag-based conditions
      const hasExistingTags = pinData.tags && pinData.tags.length > 0;
      
      if (config.showHoverOnPageLoadOnlyIfNoTags && hasExistingTags) {
        return false;
      }
      
      if (config.showHoverOnPageLoadOnlyIfSomeTags && !hasExistingTags) {
        return false;
      }

      return true;
      
    } catch (error) {
      this.logger.error('Error determining if hover should show on page load:', error);
      return false;
    }
  }

  /**
   * Handle configuration updates
   */
  async handleConfigUpdate(newConfig) {
    try {
      this.logger.debug('Handling config update');
      
      // Update component configurations
      if (this.hoverSystem) {
        this.hoverSystem.updateConfig(newConfig);
      }
      
      if (this.overlayManager) {
        this.overlayManager.updateConfig(newConfig);
      }
      
      if (this.contentInjector) {
        this.contentInjector.updateConfig(newConfig);
      }
      
    } catch (error) {
      this.logger.error('Error handling config update:', error);
    }
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.hoverSystem) {
      this.hoverSystem.destroy();
    }
    
    if (this.overlayManager) {
      this.overlayManager.destroy();
    }
    
    if (this.contentInjector) {
      this.contentInjector.destroy();
    }
    
    this.messageService.destroy();
    this.initialized = false;
  }
}

// Initialize content script when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const contentScript = new ContentScript();
    contentScript.initialize();
  });
} else {
  const contentScript = new ContentScript();
  contentScript.initialize();
}

export { ContentScript }; 