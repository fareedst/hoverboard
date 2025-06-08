/**
 * Content Injector Module
 * Handles injection of styles, scripts, and resources into page content
 */

import { Logger } from '../../shared/logger.js';

class ContentInjector {
  constructor(document, config) {
    this.document = document;
    this.config = config;
    this.logger = new Logger('ContentInjector');
    
    this.injectedElements = new Set();
    this.isInitialized = false;
  }

  /**
   * Initialize content injection
   */
  initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      this.logger.debug('Initializing content injector');
      
      // Inject base styles
      this.injectBaseStyles();
      
      // Inject tag styles
      this.injectTagStyles();
      
      // Set up dynamic resource injection
      this.setupDynamicInjection();
      
      this.isInitialized = true;
      this.logger.debug('Content injector initialized');
      
    } catch (error) {
      this.logger.error('Error initializing content injector:', error);
    }
  }

  /**
   * Inject base styles for hoverboard
   */
  injectBaseStyles() {
    const styleId = 'hoverboard-base-styles';
    
    if (this.document.getElementById(styleId)) {
      return; // Already injected
    }

    const styles = `
      /* Hoverboard Base Styles */
      .hoverboard-hidden {
        display: none !important;
      }
      
      .hoverboard-invisible {
        visibility: hidden !important;
      }
      
      .hoverboard-no-pointer {
        pointer-events: none !important;
      }
      
      .hoverboard-overlay-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.1);
        z-index: 2147483646;
        pointer-events: none;
      }
      
      /* Animation classes */
      .hoverboard-fade-in {
        animation: hoverboardFadeIn 0.2s ease-out;
      }
      
      .hoverboard-fade-out {
        animation: hoverboardFadeOut 0.15s ease-in;
      }
      
      .hoverboard-slide-in {
        animation: hoverboardSlideIn 0.3s ease-out;
      }
      
      .hoverboard-slide-out {
        animation: hoverboardSlideOut 0.2s ease-in;
      }
      
      @keyframes hoverboardFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes hoverboardFadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
      
      @keyframes hoverboardSlideIn {
        from { 
          opacity: 0; 
          transform: translateY(-10px) scale(0.95); 
        }
        to { 
          opacity: 1; 
          transform: translateY(0) scale(1); 
        }
      }
      
      @keyframes hoverboardSlideOut {
        from { 
          opacity: 1; 
          transform: translateY(0) scale(1); 
        }
        to { 
          opacity: 0; 
          transform: translateY(-5px) scale(0.98); 
        }
      }
      
      /* Accessibility improvements */
      .hoverboard-sr-only {
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        padding: 0 !important;
        margin: -1px !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        white-space: nowrap !important;
        border: 0 !important;
      }
      
      .hoverboard-focus-visible:focus {
        outline: 2px solid #0066cc;
        outline-offset: 2px;
      }
      
      /* High contrast mode support */
      @media (prefers-contrast: high) {
        .hoverboard-overlay {
          border: 2px solid !important;
        }
        
        .tag {
          border-width: 2px !important;
        }
      }
      
      /* Reduced motion support */
      @media (prefers-reduced-motion: reduce) {
        .hoverboard-fade-in,
        .hoverboard-fade-out,
        .hoverboard-slide-in,
        .hoverboard-slide-out {
          animation: none;
        }
        
        .tag,
        .action-button {
          transition: none !important;
        }
      }
      
      /* Dark mode support */
      @media (prefers-color-scheme: dark) {
        .hoverboard-overlay {
          background: #2d2d2d !important;
          color: #e0e0e0 !important;
          border-color: #555 !important;
        }
        
        .action-button {
          background: #3d3d3d !important;
          color: #e0e0e0 !important;
          border-color: #555 !important;
        }
        
        .action-button:hover {
          background: #4d4d4d !important;
        }
        
        .tag {
          background: #3d3d3d !important;
          color: #e0e0e0 !important;
          border-color: #555 !important;
        }
        
        .tag.current-tag {
          background: #1e3a8a !important;
          color: #93c5fd !important;
        }
        
        .tag.recent-tag {
          background: #581c87 !important;
          color: #c084fc !important;
        }
        
        .tag.content-tag {
          background: #14532d !important;
          color: #86efac !important;
        }
      }
    `;

    this.injectCSS(styleId, styles);
  }

  /**
   * Inject tag-specific styles
   */
  injectTagStyles() {
    const styleId = 'hoverboard-tag-styles';
    
    if (this.document.getElementById(styleId)) {
      return; // Already injected
    }

    const styles = `
      /* Tag Styles */
      .tag {
        display: inline-block;
        padding: 2px 8px;
        margin: 2px;
        background: #f0f0f0;
        border: 1px solid #ccc;
        border-radius: 12px;
        font-size: 12px;
        line-height: 1.4;
        cursor: default;
        user-select: none;
        transition: all 0.2s ease;
        font-family: system-ui, -apple-system, sans-serif;
      }

      .tag.clickable {
        cursor: pointer;
      }

      .tag.clickable:hover,
      .tag.hover {
        background: #e0e0e0;
        border-color: #999;
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .tag.current-tag {
        background: #e3f2fd;
        border-color: #1976d2;
        color: #1976d2;
        font-weight: 500;
      }

      .tag.recent-tag {
        background: #f3e5f5;
        border-color: #7b1fa2;
        color: #7b1fa2;
      }

      .tag.content-tag {
        background: #e8f5e8;
        border-color: #388e3c;
        color: #388e3c;
      }

      .tag.suggested::before {
        content: "💡 ";
        font-size: 10px;
        margin-right: 2px;
      }

      .tag-remove {
        margin-left: 4px;
        cursor: pointer;
        font-weight: bold;
        color: #999;
        font-size: 14px;
        line-height: 1;
        transition: color 0.2s ease;
      }

      .tag-remove:hover {
        color: #f44336;
      }

      .tag-input-container {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        margin: 2px;
        background: white;
        border: 1px solid #ddd;
        border-radius: 12px;
        padding: 2px;
      }

      .tag-input {
        border: none;
        outline: none;
        padding: 2px 6px;
        font-size: 12px;
        width: 100px;
        background: transparent;
      }

      .tag-input-submit,
      .tag-input-cancel {
        padding: 2px 6px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 11px;
        font-weight: bold;
        transition: background-color 0.2s ease;
      }

      .tag-input-submit {
        background: #4caf50;
        color: white;
      }

      .tag-input-submit:hover {
        background: #45a049;
      }

      .tag-input-cancel {
        background: #f44336;
        color: white;
      }

      .tag-input-cancel:hover {
        background: #d32f2f;
      }

      /* Tag group styles */
      .tag-group {
        margin: 8px 0;
      }

      .tag-group-header {
        font-weight: 600;
        margin-bottom: 4px;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: #555;
      }

      .tag-group-header.collapsible {
        cursor: pointer;
        transition: color 0.2s ease;
      }

      .tag-group-header.collapsible:hover {
        color: #333;
      }

      .tag-group-header.collapsible::before {
        content: "▼";
        font-size: 10px;
        transition: transform 0.2s ease;
        color: #999;
      }

      .tag-group.collapsed .tag-group-header::before {
        transform: rotate(-90deg);
      }

      .tag-group.collapsed .tag-group-tags {
        display: none;
      }

      .tag-group-count {
        font-size: 11px;
        color: #666;
        font-weight: normal;
        background: #f0f0f0;
        padding: 1px 6px;
        border-radius: 8px;
      }

      .tag-group-tags {
        transition: opacity 0.2s ease;
      }

      .tag-show-more {
        display: inline-block;
        padding: 2px 8px;
        margin: 2px;
        background: #f9f9f9;
        border: 1px dashed #ccc;
        border-radius: 12px;
        font-size: 11px;
        cursor: pointer;
        color: #666;
        transition: all 0.2s ease;
      }

      .tag-show-more:hover {
        background: #f0f0f0;
        border-color: #999;
        color: #333;
      }

      /* Filter styles */
      .tag-filter-container {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-bottom: 8px;
        background: white;
        border: 1px solid #ddd;
        border-radius: 6px;
        padding: 4px;
      }

      .tag-filter-input {
        flex: 1;
        border: none;
        outline: none;
        padding: 4px 8px;
        font-size: 12px;
        background: transparent;
      }

      .tag-filter-clear {
        padding: 4px 8px;
        border: none;
        border-radius: 4px;
        background: #f5f5f5;
        cursor: pointer;
        font-size: 12px;
        color: #666;
        transition: all 0.2s ease;
      }

      .tag-filter-clear:hover {
        background: #e0e0e0;
        color: #333;
      }
    `;

    this.injectCSS(styleId, styles);
  }

  /**
   * Inject custom CSS into the page
   */
  injectCSS(id, cssText) {
    try {
      // Remove existing style if it exists
      const existing = this.document.getElementById(id);
      if (existing) {
        existing.remove();
        this.injectedElements.delete(existing);
      }

      // Create and inject new style
      const style = this.document.createElement('style');
      style.id = id;
      style.textContent = cssText;
      
      this.document.head.appendChild(style);
      this.injectedElements.add(style);
      
      this.logger.debug(`Injected CSS: ${id}`);
      
    } catch (error) {
      this.logger.error(`Error injecting CSS ${id}:`, error);
    }
  }

  /**
   * Inject JavaScript into the page
   */
  injectScript(id, scriptText) {
    try {
      // Remove existing script if it exists
      const existing = this.document.getElementById(id);
      if (existing) {
        existing.remove();
        this.injectedElements.delete(existing);
      }

      // Create and inject new script
      const script = this.document.createElement('script');
      script.id = id;
      script.textContent = scriptText;
      
      this.document.head.appendChild(script);
      this.injectedElements.add(script);
      
      this.logger.debug(`Injected script: ${id}`);
      
    } catch (error) {
      this.logger.error(`Error injecting script ${id}:`, error);
    }
  }

  /**
   * Inject external resource (CSS or JS)
   */
  injectExternalResource(id, url, type = 'css') {
    try {
      // Remove existing resource if it exists
      const existing = this.document.getElementById(id);
      if (existing) {
        existing.remove();
        this.injectedElements.delete(existing);
      }

      let element;
      
      if (type === 'css') {
        element = this.document.createElement('link');
        element.rel = 'stylesheet';
        element.href = url;
      } else if (type === 'js') {
        element = this.document.createElement('script');
        element.src = url;
      } else {
        throw new Error(`Unsupported resource type: ${type}`);
      }
      
      element.id = id;
      
      // Add load/error handlers
      element.addEventListener('load', () => {
        this.logger.debug(`External resource loaded: ${url}`);
      });
      
      element.addEventListener('error', () => {
        this.logger.error(`Failed to load external resource: ${url}`);
      });
      
      this.document.head.appendChild(element);
      this.injectedElements.add(element);
      
    } catch (error) {
      this.logger.error(`Error injecting external resource ${url}:`, error);
    }
  }

  /**
   * Set up dynamic resource injection based on page content
   */
  setupDynamicInjection() {
    // Inject additional styles based on page characteristics
    this.injectPageSpecificStyles();
    
    // Set up content observer for dynamic changes
    this.setupContentObserver();
  }

  /**
   * Inject page-specific styles based on the current page
   */
  injectPageSpecificStyles() {
    const url = window.location.href;
    const hostname = window.location.hostname;
    
    // Site-specific style adjustments
    const siteStyles = this.getSiteSpecificStyles(hostname);
    if (siteStyles) {
      this.injectCSS(`hoverboard-site-${hostname.replace(/\./g, '-')}`, siteStyles);
    }
    
    // Dark mode detection and adjustments
    if (this.isDarkMode()) {
      this.injectDarkModeStyles();
    }
  }

  /**
   * Get site-specific styles for known websites
   */
  getSiteSpecificStyles(hostname) {
    const siteStyles = {
      'github.com': `
        .hoverboard-overlay {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif !important;
        }
      `,
      'stackoverflow.com': `
        .hoverboard-overlay {
          z-index: 1000001 !important;
        }
      `,
      'reddit.com': `
        .hoverboard-overlay {
          z-index: 1000001 !important;
          font-family: "Noto Sans", Arial, sans-serif !important;
        }
      `,
      'youtube.com': `
        .hoverboard-overlay {
          z-index: 3000 !important;
        }
      `
    };
    
    return siteStyles[hostname] || null;
  }

  /**
   * Inject dark mode specific styles
   */
  injectDarkModeStyles() {
    const darkStyles = `
      .hoverboard-overlay {
        background: #1e1e1e !important;
        color: #e0e0e0 !important;
        border-color: #404040 !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5) !important;
      }
      
      .section-header {
        color: #b0b0b0 !important;
      }
      
      .hoverboard-section {
        border-color: #404040 !important;
      }
    `;
    
    this.injectCSS('hoverboard-dark-mode', darkStyles);
  }

  /**
   * Detect if the page is using dark mode
   */
  isDarkMode() {
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return true;
    }
    
    // Check page background color
    const bodyBg = window.getComputedStyle(document.body).backgroundColor;
    const htmlBg = window.getComputedStyle(document.documentElement).backgroundColor;
    
    // Simple heuristic: if background is dark-ish
    const isDarkBg = (bg) => {
      const rgb = bg.match(/\d+/g);
      if (rgb && rgb.length >= 3) {
        const r = parseInt(rgb[0]);
        const g = parseInt(rgb[1]);
        const b = parseInt(rgb[2]);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness < 128;
      }
      return false;
    };
    
    return isDarkBg(bodyBg) || isDarkBg(htmlBg);
  }

  /**
   * Set up content observer for dynamic page changes
   */
  setupContentObserver() {
    if (this.contentObserver) {
      return; // Already set up
    }
    
    this.contentObserver = new MutationObserver((mutations) => {
      let shouldRecheck = false;
      
      mutations.forEach((mutation) => {
        // Check if page structure changed significantly
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Check for theme changes or major layout changes
              if (node.classList.contains('dark') || 
                  node.classList.contains('theme') ||
                  node.tagName === 'STYLE') {
                shouldRecheck = true;
                break;
              }
            }
          }
        }
      });
      
      if (shouldRecheck) {
        // Debounce rechecking
        clearTimeout(this.recheckTimeout);
        this.recheckTimeout = setTimeout(() => {
          this.injectPageSpecificStyles();
        }, 500);
      }
    });
    
    this.contentObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'data-theme']
    });
  }

  /**
   * Remove specific injected element
   */
  removeInjectedElement(id) {
    const element = this.document.getElementById(id);
    if (element && this.injectedElements.has(element)) {
      element.remove();
      this.injectedElements.delete(element);
      this.logger.debug(`Removed injected element: ${id}`);
    }
  }

  /**
   * Update configuration and reinject styles if needed
   */
  updateConfig(newConfig) {
    const oldConfig = this.config;
    this.config = newConfig;
    
    // Check if style-related config changed
    const styleConfigChanged = 
      oldConfig.theme !== newConfig.theme ||
      oldConfig.darkMode !== newConfig.darkMode ||
      oldConfig.animations !== newConfig.animations;
    
    if (styleConfigChanged) {
      this.logger.debug('Style configuration changed, reinjecting styles');
      this.injectBaseStyles();
      this.injectTagStyles();
      this.injectPageSpecificStyles();
    }
  }

  /**
   * Clean up all injected resources
   */
  cleanup() {
    try {
      // Remove all injected elements
      this.injectedElements.forEach(element => {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      });
      
      this.injectedElements.clear();
      
      // Disconnect content observer
      if (this.contentObserver) {
        this.contentObserver.disconnect();
        this.contentObserver = null;
      }
      
      // Clear timeouts
      if (this.recheckTimeout) {
        clearTimeout(this.recheckTimeout);
      }
      
      this.isInitialized = false;
      this.logger.debug('Content injector cleaned up');
      
    } catch (error) {
      this.logger.error('Error during content injector cleanup:', error);
    }
  }

  /**
   * Destroy content injector
   */
  destroy() {
    this.cleanup();
  }
}

export { ContentInjector }; 