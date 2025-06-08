/**
 * DOM Utilities - Modern vanilla JavaScript DOM manipulation
 * Replaces jQuery functionality with optimized, lightweight alternatives
 */

export class DOMUtils {
  /**
   * Wait for DOM to be ready
   * @returns {Promise} Promise that resolves when DOM is ready
   */
  waitForDOM() {
    return new Promise((resolve) => {
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        resolve();
      } else {
        document.addEventListener('DOMContentLoaded', resolve);
      }
    });
  }

  /**
   * Query selector with optional context
   * @param {string} selector - CSS selector
   * @param {Element} context - Context element (default: document)
   * @returns {Element|null} First matching element
   */
  $(selector, context = document) {
    return context.querySelector(selector);
  }

  /**
   * Query selector all with optional context
   * @param {string} selector - CSS selector
   * @param {Element} context - Context element (default: document)
   * @returns {NodeList} All matching elements
   */
  $$(selector, context = document) {
    return context.querySelectorAll(selector);
  }

  /**
   * Create element with attributes and properties
   * @param {string} tagName - HTML tag name
   * @param {Object} attributes - Element attributes
   * @param {Object} properties - Element properties
   * @returns {Element} Created element
   */
  createElement(tagName, attributes = {}, properties = {}) {
    const element = document.createElement(tagName);
    
    // Set attributes
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
    
    // Set properties
    Object.entries(properties).forEach(([key, value]) => {
      element[key] = value;
    });
    
    return element;
  }

  /**
   * Add event listener with optional delegation
   * @param {Element|string} target - Target element or selector
   * @param {string} event - Event type
   * @param {Function} handler - Event handler
   * @param {string} delegateSelector - Delegate selector for event delegation
   * @returns {Function} Cleanup function
   */
  on(target, event, handler, delegateSelector = null) {
    const element = typeof target === 'string' ? this.$(target) : target;
    if (!element) return () => {};

    if (delegateSelector) {
      // Event delegation
      const delegatedHandler = (e) => {
        const delegatedTarget = e.target.closest(delegateSelector);
        if (delegatedTarget && element.contains(delegatedTarget)) {
          handler.call(delegatedTarget, e);
        }
      };
      
      element.addEventListener(event, delegatedHandler);
      return () => element.removeEventListener(event, delegatedHandler);
    } else {
      // Direct event listener
      element.addEventListener(event, handler);
      return () => element.removeEventListener(event, handler);
    }
  }

  /**
   * Remove element from DOM
   * @param {Element|string} target - Target element or selector
   */
  remove(target) {
    const element = typeof target === 'string' ? this.$(target) : target;
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
    }
  }

  /**
   * Append child element
   * @param {Element|string} parent - Parent element or selector
   * @param {Element} child - Child element to append
   */
  append(parent, child) {
    const parentElement = typeof parent === 'string' ? this.$(parent) : parent;
    if (parentElement && child) {
      parentElement.appendChild(child);
    }
  }

  /**
   * Prepend child element
   * @param {Element|string} parent - Parent element or selector
   * @param {Element} child - Child element to prepend
   */
  prepend(parent, child) {
    const parentElement = typeof parent === 'string' ? this.$(parent) : parent;
    if (parentElement && child) {
      parentElement.insertBefore(child, parentElement.firstChild);
    }
  }

  /**
   * Set or get element attributes
   * @param {Element|string} target - Target element or selector
   * @param {string|Object} attr - Attribute name or object of attributes
   * @param {string} value - Attribute value (if attr is string)
   * @returns {string|void} Attribute value if getting, void if setting
   */
  attr(target, attr, value = null) {
    const element = typeof target === 'string' ? this.$(target) : target;
    if (!element) return;

    if (typeof attr === 'object') {
      // Set multiple attributes
      Object.entries(attr).forEach(([key, val]) => {
        element.setAttribute(key, val);
      });
    } else if (value !== null) {
      // Set single attribute
      element.setAttribute(attr, value);
    } else {
      // Get attribute
      return element.getAttribute(attr);
    }
  }

  /**
   * Add CSS class to element
   * @param {Element|string} target - Target element or selector
   * @param {string} className - Class name to add
   */
  addClass(target, className) {
    const element = typeof target === 'string' ? this.$(target) : target;
    if (element) {
      element.classList.add(className);
    }
  }

  /**
   * Remove CSS class from element
   * @param {Element|string} target - Target element or selector
   * @param {string} className - Class name to remove
   */
  removeClass(target, className) {
    const element = typeof target === 'string' ? this.$(target) : target;
    if (element) {
      element.classList.remove(className);
    }
  }

  /**
   * Toggle CSS class on element
   * @param {Element|string} target - Target element or selector
   * @param {string} className - Class name to toggle
   * @returns {boolean} Whether class is now present
   */
  toggleClass(target, className) {
    const element = typeof target === 'string' ? this.$(target) : target;
    if (element) {
      return element.classList.toggle(className);
    }
    return false;
  }

  /**
   * Check if element has CSS class
   * @param {Element|string} target - Target element or selector
   * @param {string} className - Class name to check
   * @returns {boolean} Whether element has class
   */
  hasClass(target, className) {
    const element = typeof target === 'string' ? this.$(target) : target;
    return element ? element.classList.contains(className) : false;
  }

  /**
   * Set or get element styles
   * @param {Element|string} target - Target element or selector
   * @param {string|Object} prop - Style property or object of styles
   * @param {string} value - Style value (if prop is string)
   * @returns {string|void} Style value if getting, void if setting
   */
  css(target, prop, value = null) {
    const element = typeof target === 'string' ? this.$(target) : target;
    if (!element) return;

    if (typeof prop === 'object') {
      // Set multiple styles
      Object.entries(prop).forEach(([key, val]) => {
        element.style[key] = val;
      });
    } else if (value !== null) {
      // Set single style
      element.style[prop] = value;
    } else {
      // Get computed style
      return window.getComputedStyle(element)[prop];
    }
  }

  /**
   * Show element
   * @param {Element|string} target - Target element or selector
   */
  show(target) {
    const element = typeof target === 'string' ? this.$(target) : target;
    if (element) {
      element.style.display = '';
    }
  }

  /**
   * Hide element
   * @param {Element|string} target - Target element or selector
   */
  hide(target) {
    const element = typeof target === 'string' ? this.$(target) : target;
    if (element) {
      element.style.display = 'none';
    }
  }

  /**
   * Toggle element visibility
   * @param {Element|string} target - Target element or selector
   * @returns {boolean} Whether element is now visible
   */
  toggle(target) {
    const element = typeof target === 'string' ? this.$(target) : target;
    if (element) {
      const isHidden = element.style.display === 'none' || 
                      window.getComputedStyle(element).display === 'none';
      
      if (isHidden) {
        this.show(element);
        return true;
      } else {
        this.hide(element);
        return false;
      }
    }
    return false;
  }

  /**
   * Get element text content
   * @param {Element|string} target - Target element or selector
   * @returns {string} Text content
   */
  text(target) {
    const element = typeof target === 'string' ? this.$(target) : target;
    return element ? element.textContent : '';
  }

  /**
   * Set element text content
   * @param {Element|string} target - Target element or selector
   * @param {string} text - Text to set
   */
  setText(target, text) {
    const element = typeof target === 'string' ? this.$(target) : target;
    if (element) {
      element.textContent = text;
    }
  }

  /**
   * Get or set element HTML
   * @param {Element|string} target - Target element or selector
   * @param {string} html - HTML to set (optional)
   * @returns {string|void} HTML content if getting, void if setting
   */
  html(target, html = null) {
    const element = typeof target === 'string' ? this.$(target) : target;
    if (!element) return;

    if (html !== null) {
      element.innerHTML = html;
    } else {
      return element.innerHTML;
    }
  }

  /**
   * Check if element exists and is visible
   * @param {Element|string} target - Target element or selector
   * @returns {boolean} Whether element exists and is visible
   */
  isVisible(target) {
    const element = typeof target === 'string' ? this.$(target) : target;
    if (!element) return false;

    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0';
  }

  /**
   * Get element position relative to viewport
   * @param {Element|string} target - Target element or selector
   * @returns {Object} Position object with top, left, right, bottom
   */
  getPosition(target) {
    const element = typeof target === 'string' ? this.$(target) : target;
    if (!element) return { top: 0, left: 0, right: 0, bottom: 0 };

    return element.getBoundingClientRect();
  }

  /**
   * Smooth scroll to element
   * @param {Element|string} target - Target element or selector
   * @param {Object} options - Scroll options
   */
  scrollTo(target, options = {}) {
    const element = typeof target === 'string' ? this.$(target) : target;
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest',
        ...options
      });
    }
  }

  /**
   * Debounce function calls
   * @param {Function} func - Function to debounce
   * @param {number} delay - Delay in milliseconds
   * @returns {Function} Debounced function
   */
  debounce(func, delay) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  /**
   * Throttle function calls
   * @param {Function} func - Function to throttle
   * @param {number} delay - Delay in milliseconds
   * @returns {Function} Throttled function
   */
  throttle(func, delay) {
    let lastCall = 0;
    return function (...args) {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        func.apply(this, args);
      }
    };
  }

  /**
   * Check if element is in viewport
   * @param {Element|string} target - Target element or selector
   * @param {number} threshold - Threshold percentage (0-1)
   * @returns {boolean} Whether element is in viewport
   */
  isInViewport(target, threshold = 0) {
    const element = typeof target === 'string' ? this.$(target) : target;
    if (!element) return false;

    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;

    const vertInView = (rect.top <= windowHeight * (1 - threshold)) && 
                       ((rect.top + rect.height) >= windowHeight * threshold);
    const horInView = (rect.left <= windowWidth * (1 - threshold)) && 
                      ((rect.left + rect.width) >= windowWidth * threshold);

    return vertInView && horInView;
  }

  /**
   * Add tooltip to element
   * @param {Element|string} target - Target element or selector
   * @param {string} text - Tooltip text
   * @param {boolean} wide - Whether tooltip should be wide
   */
  addTooltip(target, text, wide = false) {
    const element = typeof target === 'string' ? this.$(target) : target;
    if (element) {
      element.setAttribute('title', text);
      element.setAttribute('data-tooltip', wide ? 'wide' : 'normal');
      this.addClass(element, 'has-tooltip');
    }
  }

  /**
   * Remove tooltip from element
   * @param {Element|string} target - Target element or selector
   */
  removeTooltip(target) {
    const element = typeof target === 'string' ? this.$(target) : target;
    if (element) {
      element.removeAttribute('title');
      element.removeAttribute('data-tooltip');
      this.removeClass(element, 'has-tooltip');
    }
  }
} 