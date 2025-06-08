/**
 * Overlay Manager Module
 * Handles DOM overlay creation, positioning, and interaction management
 */

import { Logger } from '../../shared/logger.js';

class OverlayManager {
  constructor(document, config) {
    this.document = document;
    this.config = config;
    this.logger = new Logger('OverlayManager');
    
    this.overlayElement = null;
    this.isVisible = false;
    this.currentContent = null;
    this.isInsideOverlay = false;
    
    this.overlayId = 'hoverboard-overlay';
    this.overlayClass = 'hoverboard-overlay';
  }

  /**
   * Show overlay with content
   */
  show(content) {
    try {
      this.logger.debug('Showing overlay');
      
      // Create overlay if it doesn't exist
      if (!this.overlayElement) {
        this.createOverlay();
      }
      
      // Clear existing content
      this.clearContent();
      
      // Add new content
      if (typeof content === 'string') {
        this.overlayElement.innerHTML = content;
      } else if (content instanceof Element) {
        this.overlayElement.appendChild(content);
      } else {
        this.logger.warn('Invalid content type for overlay');
        return;
      }
      
      this.currentContent = content;
      
      // Position and show overlay
      this.positionOverlay();
      this.overlayElement.style.display = 'block';
      this.isVisible = true;
      
      // Set up event handlers
      this.setupOverlayInteractions();
      
      // Add CSS animations
      this.addShowAnimation();
      
      this.logger.debug('Overlay shown successfully');
      
    } catch (error) {
      this.logger.error('Error showing overlay:', error);
    }
  }

  /**
   * Hide overlay
   */
  hide() {
    if (!this.isVisible || !this.overlayElement) {
      return;
    }
    
    try {
      this.logger.debug('Hiding overlay');
      
      // Add hide animation
      this.addHideAnimation(() => {
        if (this.overlayElement) {
          this.overlayElement.style.display = 'none';
          this.clearContent();
        }
        this.isVisible = false;
        this.currentContent = null;
      });
      
    } catch (error) {
      this.logger.error('Error hiding overlay:', error);
    }
  }

  /**
   * Show a simple message in overlay
   */
  showMessage(message, type = 'info') {
    const messageElement = this.document.createElement('div');
    messageElement.className = `hoverboard-message ${type}`;
    messageElement.textContent = message;
    
    this.show(messageElement);
    
    // Auto-hide message after timeout
    if (this.config.messageTimeout > 0) {
      setTimeout(() => {
        this.hide();
      }, this.config.messageTimeout || 3000);
    }
  }

  /**
   * Check if click was inside overlay
   */
  isClickInsideOverlay(event) {
    if (!this.overlayElement || !this.isVisible) {
      return false;
    }
    
    return this.overlayElement.contains(event.target);
  }

  /**
   * Create overlay DOM element
   */
  createOverlay() {
    this.logger.debug('Creating overlay element');
    
    // Remove existing overlay if any
    this.removeOverlay();
    
    // Create overlay container
    this.overlayElement = this.document.createElement('div');
    this.overlayElement.id = this.overlayId;
    this.overlayElement.className = this.overlayClass;
    
    // Set initial styles
    this.applyOverlayStyles();
    
    // Add overlay to document
    this.document.body.appendChild(this.overlayElement);
    
    // Inject CSS styles if not already present
    this.injectCSS();
  }

  /**
   * Remove overlay from DOM
   */
  removeOverlay() {
    const existing = this.document.getElementById(this.overlayId);
    if (existing) {
      existing.remove();
    }
    this.overlayElement = null;
    this.isVisible = false;
  }

  /**
   * Clear overlay content
   */
  clearContent() {
    if (this.overlayElement) {
      this.overlayElement.innerHTML = '';
    }
  }

  /**
   * Position overlay on screen
   */
  positionOverlay() {
    if (!this.overlayElement) {
      return;
    }
    
    const position = this.calculateOptimalPosition();
    
    this.overlayElement.style.position = 'fixed';
    this.overlayElement.style.left = `${position.x}px`;
    this.overlayElement.style.top = `${position.y}px`;
    this.overlayElement.style.zIndex = '2147483647'; // Maximum z-index
    
    // Ensure overlay stays within viewport
    this.constrainToViewport();
  }

  /**
   * Calculate optimal position for overlay
   */
  calculateOptimalPosition() {
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
      scrollX: window.pageXOffset,
      scrollY: window.pageYOffset
    };
    
    // Default position (top-right corner with margin)
    let x = viewport.width - 320 - 20; // 320px width + 20px margin
    let y = 20; // 20px from top
    
    // Adjust for different positioning strategies
    switch (this.config.overlayPosition) {
      case 'top-left':
        x = 20;
        y = 20;
        break;
      case 'top-right':
        x = viewport.width - 320 - 20;
        y = 20;
        break;
      case 'bottom-left':
        x = 20;
        y = viewport.height - 200 - 20; // Estimated height
        break;
      case 'bottom-right':
        x = viewport.width - 320 - 20;
        y = viewport.height - 200 - 20;
        break;
      case 'center':
        x = (viewport.width - 320) / 2;
        y = (viewport.height - 200) / 2;
        break;
      case 'mouse':
        // Position near mouse if available
        if (this.lastMousePosition) {
          x = this.lastMousePosition.x + 10;
          y = this.lastMousePosition.y + 10;
        }
        break;
      default:
        // Use top-right as default
        break;
    }
    
    return { x, y };
  }

  /**
   * Constrain overlay to viewport
   */
  constrainToViewport() {
    if (!this.overlayElement) {
      return;
    }
    
    const rect = this.overlayElement.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    
    let x = parseInt(this.overlayElement.style.left);
    let y = parseInt(this.overlayElement.style.top);
    
    // Constrain horizontally
    if (rect.right > viewport.width) {
      x = viewport.width - rect.width - 10;
    }
    if (x < 10) {
      x = 10;
    }
    
    // Constrain vertically
    if (rect.bottom > viewport.height) {
      y = viewport.height - rect.height - 10;
    }
    if (y < 10) {
      y = 10;
    }
    
    this.overlayElement.style.left = `${x}px`;
    this.overlayElement.style.top = `${y}px`;
  }

  /**
   * Apply overlay styles
   */
  applyOverlayStyles() {
    if (!this.overlayElement) {
      return;
    }
    
    const styles = {
      display: 'none',
      position: 'fixed',
      minWidth: '300px',
      maxWidth: '400px',
      minHeight: '100px',
      maxHeight: '80vh',
      backgroundColor: 'white',
      border: '1px solid #ccc',
      borderRadius: '6px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      padding: '12px',
      fontSize: '14px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      zIndex: '2147483647',
      overflow: 'auto',
      cursor: 'default'
    };
    
    Object.assign(this.overlayElement.style, styles);
  }

  /**
   * Set up overlay interactions
   */
  setupOverlayInteractions() {
    if (!this.overlayElement) {
      return;
    }
    
    // Track mouse enter/leave for overlay
    this.overlayElement.addEventListener('mouseenter', () => {
      this.isInsideOverlay = true;
    });
    
    this.overlayElement.addEventListener('mouseleave', () => {
      this.isInsideOverlay = false;
    });
    
    // Prevent overlay from capturing certain events
    this.overlayElement.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    
    // Make overlay draggable if enabled
    if (this.config.overlayDraggable) {
      this.makeDraggable();
    }
  }

  /**
   * Make overlay draggable
   */
  makeDraggable() {
    if (!this.overlayElement) {
      return;
    }
    
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };
    
    // Add drag handle
    const dragHandle = this.document.createElement('div');
    dragHandle.className = 'hoverboard-drag-handle';
    dragHandle.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 20px;
      cursor: move;
      background: linear-gradient(to bottom, #f8f8f8, #e8e8e8);
      border-bottom: 1px solid #ddd;
      border-radius: 6px 6px 0 0;
    `;
    
    this.overlayElement.style.position = 'relative';
    this.overlayElement.style.paddingTop = '32px';
    this.overlayElement.insertBefore(dragHandle, this.overlayElement.firstChild);
    
    dragHandle.addEventListener('mousedown', (e) => {
      isDragging = true;
      const overlayRect = this.overlayElement.getBoundingClientRect();
      dragOffset.x = e.clientX - overlayRect.left;
      dragOffset.y = e.clientY - overlayRect.top;
      
      e.preventDefault();
    });
    
    this.document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      const x = e.clientX - dragOffset.x;
      const y = e.clientY - dragOffset.y;
      
      this.overlayElement.style.left = `${x}px`;
      this.overlayElement.style.top = `${y}px`;
      
      this.constrainToViewport();
    });
    
    this.document.addEventListener('mouseup', () => {
      isDragging = false;
    });
  }

  /**
   * Add show animation
   */
  addShowAnimation() {
    if (!this.overlayElement || !this.config.overlayAnimations) {
      return;
    }
    
    this.overlayElement.style.opacity = '0';
    this.overlayElement.style.transform = 'scale(0.9) translateY(-10px)';
    this.overlayElement.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
    
    // Trigger animation on next frame
    requestAnimationFrame(() => {
      this.overlayElement.style.opacity = '1';
      this.overlayElement.style.transform = 'scale(1) translateY(0)';
    });
  }

  /**
   * Add hide animation
   */
  addHideAnimation(callback) {
    if (!this.overlayElement || !this.config.overlayAnimations) {
      callback();
      return;
    }
    
    this.overlayElement.style.transition = 'opacity 0.15s ease, transform 0.15s ease';
    this.overlayElement.style.opacity = '0';
    this.overlayElement.style.transform = 'scale(0.9) translateY(-10px)';
    
    setTimeout(callback, 150);
  }

  /**
   * Inject CSS styles
   */
  injectCSS() {
    const styleId = 'hoverboard-overlay-styles';
    
    if (this.document.getElementById(styleId)) {
      return; // Already injected
    }
    
    const style = this.document.createElement('style');
    style.id = styleId;
    style.textContent = this.getOverlayCSS();
    
    this.document.head.appendChild(style);
  }

  /**
   * Get overlay CSS styles
   */
  getOverlayCSS() {
    return `
      .hoverboard-overlay {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        line-height: 1.4;
        color: #333;
      }
      
      .hoverboard-overlay * {
        box-sizing: border-box;
      }
      
      .hoverboard-container {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .hoverboard-section {
        border-bottom: 1px solid #eee;
        padding-bottom: 8px;
      }
      
      .hoverboard-section:last-child {
        border-bottom: none;
        padding-bottom: 0;
      }
      
      .section-header {
        font-weight: 600;
        font-size: 13px;
        color: #555;
        margin-bottom: 6px;
      }
      
      .tags-container {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
      }
      
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        align-items: center;
      }
      
      .action-button {
        padding: 4px 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        background: white;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s ease;
      }
      
      .action-button:hover {
        background: #f5f5f5;
        border-color: #999;
      }
      
      .action-button.close-button {
        background: #f44336;
        color: white;
        border-color: #f44336;
      }
      
      .action-button.close-button:hover {
        background: #d32f2f;
      }
      
      .action-button.delete-button {
        background: #ff9800;
        color: white;
        border-color: #ff9800;
      }
      
      .action-button.delete-button:hover {
        background: #f57c00;
      }
      
      .add-tag-container {
        display: flex;
        gap: 4px;
        align-items: center;
      }
      
      .add-tag-input {
        padding: 4px 6px;
        border: 1px solid #ddd;
        border-radius: 3px;
        font-size: 12px;
        width: 120px;
      }
      
      .add-tag-button {
        padding: 4px 8px;
        border: 1px solid #4caf50;
        border-radius: 3px;
        background: #4caf50;
        color: white;
        cursor: pointer;
        font-size: 12px;
      }
      
      .add-tag-button:hover {
        background: #45a049;
      }
      
      .hoverboard-message {
        padding: 12px;
        border-radius: 4px;
        text-align: center;
      }
      
      .hoverboard-message.info {
        background: #e3f2fd;
        color: #1976d2;
        border: 1px solid #bbdefb;
      }
      
      .hoverboard-message.error {
        background: #ffebee;
        color: #d32f2f;
        border: 1px solid #ffcdd2;
      }
      
      .hoverboard-message.success {
        background: #e8f5e8;
        color: #388e3c;
        border: 1px solid #c8e6c9;
      }
      
      .hoverboard-drag-handle {
        user-select: none;
      }
      
      @media (max-width: 480px) {
        .hoverboard-overlay {
          min-width: 280px;
          max-width: 90vw;
          font-size: 13px;
        }
        
        .tags-container {
          gap: 3px;
        }
        
        .actions {
          gap: 4px;
        }
      }
    `;
  }

  /**
   * Update mouse position for positioning
   */
  updateMousePosition(x, y) {
    this.lastMousePosition = { x, y };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.config = newConfig;
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.removeOverlay();
    
    // Remove injected styles
    const styleElement = this.document.getElementById('hoverboard-overlay-styles');
    if (styleElement) {
      styleElement.remove();
    }
  }
}

export { OverlayManager }; 