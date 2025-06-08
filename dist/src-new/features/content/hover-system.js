/**
 * Hover System - Modern hover detection and overlay trigger system
 * Replaces legacy hoverInjector.js with improved event handling and accessibility
 */

import { DOMUtils } from './dom-utils.js';

export class HoverSystem {
  constructor() {
    this.domUtils = new DOMUtils();
    this.options = {};
    this.isInitialized = false;
    this.isEnabled = true;
    
    // Event handlers
    this.handlers = {
      mouseover: null,
      mouseout: null,
      click: null,
      keydown: null,
      focus: null,
      blur: null
    };
    
    // Hover state tracking
    this.hoverTimeout = null;
    this.isHovering = false;
    this.lastHoverTarget = null;
    
    // Configuration defaults
    this.config = {
      hoverDelay: 500,
      hoverExitDelay: 200,
      enableKeyboardNavigation: true,
      enableMouseHover: true,
      enableClickTrigger: true,
      accessibilityEnabled: true
    };
  }

  /**
   * Initialize hover system with options
   * @param {Object} options - Configuration options
   */
  initialize(options = {}) {
    this.options = { ...this.config, ...options };
    
    if (!this.isInitialized) {
      this.setupEventListeners();
      this.setupAccessibility();
      this.isInitialized = true;
      console.log('Hover system initialized');
    }
  }

  /**
   * Set up event listeners for hover detection
   */
  setupEventListeners() {
    if (!this.options.enableMouseHover && !this.options.enableClickTrigger) {
      return;
    }

    // Mouse events for hover detection
    if (this.options.enableMouseHover) {
      this.handlers.mouseover = this.domUtils.debounce(
        (e) => this.handleMouseOver(e),
        100
      );
      
      this.handlers.mouseout = this.domUtils.debounce(
        (e) => this.handleMouseOut(e),
        100
      );

      document.addEventListener('mouseover', this.handlers.mouseover, true);
      document.addEventListener('mouseout', this.handlers.mouseout, true);
    }

    // Click events for manual trigger
    if (this.options.enableClickTrigger) {
      this.handlers.click = (e) => this.handleClick(e);
      document.addEventListener('click', this.handlers.click, true);
    }

    // Keyboard navigation support
    if (this.options.enableKeyboardNavigation) {
      this.setupKeyboardNavigation();
    }
  }

  /**
   * Set up keyboard navigation support
   */
  setupKeyboardNavigation() {
    this.handlers.keydown = (e) => this.handleKeyDown(e);
    this.handlers.focus = (e) => this.handleFocus(e);
    this.handlers.blur = (e) => this.handleBlur(e);

    document.addEventListener('keydown', this.handlers.keydown);
    document.addEventListener('focusin', this.handlers.focus);
    document.addEventListener('focusout', this.handlers.blur);
  }

  /**
   * Set up accessibility features
   */
  setupAccessibility() {
    if (!this.options.accessibilityEnabled) return;

    // Add ARIA attributes for screen readers
    const style = document.createElement('style');
    style.textContent = `
      .hoverboard-hoverable {
        position: relative;
      }
      
      .hoverboard-hoverable:focus-visible {
        outline: 2px solid #0066cc;
        outline-offset: 2px;
      }
      
      .hoverboard-hover-hint {
        position: absolute;
        left: -9999px;
        width: 1px;
        height: 1px;
        overflow: hidden;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Handle mouse over events
   * @param {Event} e - Mouse event
   */
  handleMouseOver(e) {
    if (!this.isEnabled || !this.shouldTriggerHover(e.target)) {
      return;
    }

    this.clearHoverTimeout();
    this.lastHoverTarget = e.target;

    // Set hover delay
    this.hoverTimeout = setTimeout(() => {
      if (this.lastHoverTarget === e.target && !this.isHovering) {
        this.triggerHover(e.target, 'mouseover');
      }
    }, this.options.hoverDelay);
  }

  /**
   * Handle mouse out events
   * @param {Event} e - Mouse event
   */
  handleMouseOut(e) {
    if (!this.isEnabled) return;

    this.clearHoverTimeout();

    // Check if we're still within a hoverable area
    if (!this.shouldTriggerHover(e.relatedTarget)) {
      this.scheduleHoverExit();
    }
  }

  /**
   * Handle click events
   * @param {Event} e - Click event
   */
  handleClick(e) {
    if (!this.isEnabled) return;

    // Check for special click triggers (e.g., Alt+Click)
    if (e.altKey && this.shouldTriggerHover(e.target)) {
      e.preventDefault();
      this.triggerHover(e.target, 'click');
    }
  }

  /**
   * Handle keyboard events
   * @param {Event} e - Keyboard event
   */
  handleKeyDown(e) {
    if (!this.isEnabled || !this.options.enableKeyboardNavigation) return;

    // Escape key to hide hover
    if (e.key === 'Escape') {
      this.hideHover();
      return;
    }

    // Ctrl/Cmd + H to toggle hover on focused element
    if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
      const activeElement = document.activeElement;
      if (activeElement && this.shouldTriggerHover(activeElement)) {
        e.preventDefault();
        this.triggerHover(activeElement, 'keyboard');
      }
    }
  }

  /**
   * Handle focus events
   * @param {Event} e - Focus event
   */
  handleFocus(e) {
    if (!this.isEnabled || !this.shouldTriggerHover(e.target)) {
      return;
    }

    // Add accessibility hints
    this.addAccessibilityHints(e.target);
  }

  /**
   * Handle blur events
   * @param {Event} e - Blur event
   */
  handleBlur(e) {
    if (!this.isEnabled) return;
    
    // Remove accessibility hints
    this.removeAccessibilityHints(e.target);
  }

  /**
   * Determine if hover should be triggered for target element
   * @param {Element} target - Target element
   * @returns {boolean} Whether hover should trigger
   */
  shouldTriggerHover(target) {
    if (!target || target === document || target === document.body) {
      return false;
    }

    // Check for excluded elements
    const excludedSelectors = [
      '.hoverboard-overlay',
      '.hoverboard-no-hover',
      'input[type="password"]',
      'iframe',
      'video',
      'audio'
    ];

    for (const selector of excludedSelectors) {
      if (target.matches && target.matches(selector)) {
        return false;
      }
    }

    // Check if element or parent has hoverable content
    return this.hasHoverableContent(target);
  }

  /**
   * Check if element has hoverable content
   * @param {Element} element - Element to check
   * @returns {boolean} Whether element has hoverable content
   */
  hasHoverableContent(element) {
    // Check for links
    if (element.tagName === 'A' && element.href) {
      return true;
    }

    // Check for elements with title attribute
    if (element.title) {
      return true;
    }

    // Check for data attributes that indicate hoverable content
    if (element.dataset.hoverboard || element.dataset.bookmark) {
      return true;
    }

    // Check parent elements (up to 3 levels)
    let parent = element.parentElement;
    let level = 0;
    while (parent && level < 3) {
      if (parent.tagName === 'A' && parent.href) {
        return true;
      }
      parent = parent.parentElement;
      level++;
    }

    return false;
  }

  /**
   * Trigger hover display
   * @param {Element} target - Target element
   * @param {string} triggerType - Type of trigger (mouseover, click, keyboard)
   */
  async triggerHover(target, triggerType) {
    try {
      this.isHovering = true;
      this.clearHoverTimeout();

      // Get URL for hover target
      const url = this.extractUrlFromElement(target);
      if (!url) {
        console.log('No URL found for hover target');
        return;
      }

      // Dispatch custom event for hover trigger
      const hoverEvent = new CustomEvent('hoverboard:hover-trigger', {
        detail: {
          target,
          url,
          triggerType,
          position: this.getElementPosition(target)
        }
      });

      document.dispatchEvent(hoverEvent);
      
      console.log(`Hover triggered on ${url} via ${triggerType}`);
    } catch (error) {
      console.error('Failed to trigger hover:', error);
      this.isHovering = false;
    }
  }

  /**
   * Hide current hover
   */
  hideHover() {
    if (!this.isHovering) return;

    this.isHovering = false;
    this.clearHoverTimeout();

    // Dispatch hide event
    const hideEvent = new CustomEvent('hoverboard:hover-hide', {
      detail: { reason: 'manual' }
    });

    document.dispatchEvent(hideEvent);
  }

  /**
   * Schedule hover exit with delay
   */
  scheduleHoverExit() {
    this.clearHoverTimeout();
    
    this.hoverTimeout = setTimeout(() => {
      if (this.isHovering) {
        const hideEvent = new CustomEvent('hoverboard:hover-hide', {
          detail: { reason: 'timeout' }
        });
        document.dispatchEvent(hideEvent);
        this.isHovering = false;
      }
    }, this.options.hoverExitDelay);
  }

  /**
   * Extract URL from element
   * @param {Element} element - Target element
   * @returns {string|null} Extracted URL
   */
  extractUrlFromElement(element) {
    // Direct href
    if (element.href) {
      return element.href;
    }

    // Parent link
    const parentLink = element.closest('a[href]');
    if (parentLink) {
      return parentLink.href;
    }

    // Data attributes
    if (element.dataset.url) {
      return element.dataset.url;
    }

    // Current page URL as fallback
    return window.location.href;
  }

  /**
   * Get element position for overlay positioning
   * @param {Element} element - Target element
   * @returns {Object} Position data
   */
  getElementPosition(element) {
    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    return {
      top: rect.top + scrollTop,
      left: rect.left + scrollLeft,
      right: rect.right + scrollLeft,
      bottom: rect.bottom + scrollTop,
      width: rect.width,
      height: rect.height,
      viewport: {
        top: rect.top,
        left: rect.left,
        right: rect.right,
        bottom: rect.bottom
      }
    };
  }

  /**
   * Add accessibility hints to element
   * @param {Element} element - Target element
   */
  addAccessibilityHints(element) {
    if (!this.options.accessibilityEnabled) return;

    const hint = document.createElement('span');
    hint.className = 'hoverboard-hover-hint';
    hint.textContent = 'Press Ctrl+H to view bookmark information';
    hint.id = `hoverboard-hint-${Date.now()}`;

    element.appendChild(hint);
    element.setAttribute('aria-describedby', hint.id);
    element.classList.add('hoverboard-hoverable');
  }

  /**
   * Remove accessibility hints from element
   * @param {Element} element - Target element
   */
  removeAccessibilityHints(element) {
    const hint = element.querySelector('.hoverboard-hover-hint');
    if (hint) {
      hint.remove();
    }
    
    element.removeAttribute('aria-describedby');
    element.classList.remove('hoverboard-hoverable');
  }

  /**
   * Clear hover timeout
   */
  clearHoverTimeout() {
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }
  }

  /**
   * Enable hover system
   */
  enable() {
    this.isEnabled = true;
    console.log('Hover system enabled');
  }

  /**
   * Disable hover system
   */
  disable() {
    this.isEnabled = false;
    this.clearHoverTimeout();
    this.hideHover();
    console.log('Hover system disabled');
  }

  /**
   * Update configuration
   * @param {Object} newOptions - New configuration options
   */
  updateConfig(newOptions) {
    this.options = { ...this.options, ...newOptions };
    console.log('Hover system configuration updated');
  }

  /**
   * Clean up event listeners
   */
  cleanup() {
    // Remove event listeners
    Object.entries(this.handlers).forEach(([event, handler]) => {
      if (handler) {
        const eventMap = {
          mouseover: 'mouseover',
          mouseout: 'mouseout',
          click: 'click',
          keydown: 'keydown',
          focus: 'focusin',
          blur: 'focusout'
        };
        
        document.removeEventListener(eventMap[event], handler);
      }
    });

    this.clearHoverTimeout();
    this.isInitialized = false;
    console.log('Hover system cleaned up');
  }

  /**
   * Get hover system statistics
   * @returns {Object} Statistics object
   */
  getStats() {
    return {
      isInitialized: this.isInitialized,
      isEnabled: this.isEnabled,
      isHovering: this.isHovering,
      hasTimeout: !!this.hoverTimeout,
      options: this.options
    };
  }
} 