/**
 * Overlay Manager - Modern bookmark overlay display and interaction
 * Replaces legacy in_overlay.js with component-based UI and improved state management
 */

import { DOMUtils } from './dom-utils.js';
import { MessageClient } from './message-client.js';
import { MESSAGE_TYPES } from '../../core/message-handler.js';

export class OverlayManager {
  constructor() {
    this.domUtils = new DOMUtils();
    this.messageClient = new MessageClient();
    
    // State management
    this.isVisible = false;
    this.currentBookmark = null;
    this.overlayElement = null;
    
    // Configuration
    this.config = {
      overlayId: 'hoverboard-overlay',
      animationDuration: 300,
      showRecentTags: true,
      maxRecentTags: 10
    };
    
    this.setupEventListeners();
  }

  /**
   * Set up global event listeners
   */
  setupEventListeners() {
    // Listen for hover trigger events
    document.addEventListener('hoverboard:hover-trigger', (e) => this.handleHoverTrigger(e));
    document.addEventListener('hoverboard:hover-hide', (e) => this.handleHoverHide(e));
    
    // Global escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible) {
        this.hideOverlay();
      }
    });
  }

  /**
   * Handle hover trigger event
   * @param {CustomEvent} e - Hover trigger event
   */
  async handleHoverTrigger(e) {
    const { url } = e.detail;
    
    try {
      const bookmarkData = await this.getBookmarkData(url);
      if (bookmarkData) {
        await this.showOverlay({ bookmark: bookmarkData });
      }
    } catch (error) {
      console.error('Failed to handle hover trigger:', error);
    }
  }

  /**
   * Handle hover hide event
   */
  handleHoverHide() {
    this.hideOverlay();
  }

  /**
   * Show overlay with bookmark data
   * @param {Object} options - Display options
   */
  async showOverlay(options) {
    try {
      if (this.isVisible) {
        this.hideOverlay(false);
      }

      this.currentBookmark = options.bookmark;
      this.isVisible = true;

      await this.createOverlay(options);
      this.domUtils.append('body', this.overlayElement);
      
      console.log('Overlay shown for:', options.bookmark?.url);
    } catch (error) {
      console.error('Failed to show overlay:', error);
      this.isVisible = false;
    }
  }

  /**
   * Hide overlay
   * @param {boolean} animate - Whether to animate the hide
   */
  hideOverlay(animate = true) {
    if (!this.isVisible || !this.overlayElement) return;

    this.isVisible = false;
    this.removeOverlay();
    console.log('Overlay hidden');
  }

  /**
   * Create overlay DOM structure
   * @param {Object} options - Display options
   */
  async createOverlay(options) {
    const { bookmark } = options;
    
    this.overlayElement = this.domUtils.createElement('div', {
      id: this.config.overlayId,
      class: 'hoverboard-overlay'
    });

    // Basic structure with title and tags
    const title = this.domUtils.createElement('h3', {}, {
      textContent: bookmark.description || bookmark.url
    });

    const tagsContainer = this.domUtils.createElement('div', {
      class: 'hoverboard-tags'
    });

    if (bookmark.tags) {
      bookmark.tags.forEach(tag => {
        const tagEl = this.domUtils.createElement('span', {
          class: 'hoverboard-tag'
        }, { textContent: tag });
        this.domUtils.append(tagsContainer, tagEl);
      });
    }

    this.domUtils.append(this.overlayElement, title);
    this.domUtils.append(this.overlayElement, tagsContainer);

    // Basic styling
    this.domUtils.css(this.overlayElement, {
      position: 'fixed',
      top: '50px',
      right: '50px',
      background: 'white',
      border: '1px solid #ccc',
      padding: '15px',
      borderRadius: '5px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: '999999',
      maxWidth: '300px'
    });

    this.setupOverlayEvents();
  }

  /**
   * Set up overlay-specific event handlers
   */
  setupOverlayEvents() {
    if (!this.overlayElement) return;

    // Click outside to close
    setTimeout(() => {
      const handler = (e) => {
        if (!this.overlayElement.contains(e.target)) {
          this.hideOverlay();
          document.removeEventListener('click', handler);
        }
      };
      document.addEventListener('click', handler);
    }, 100);
  }

  /**
   * Get bookmark data for URL
   * @param {string} url - URL to get bookmark for
   * @returns {Promise<Object>} Bookmark data
   */
  async getBookmarkData(url) {
    try {
      const response = await this.messageClient.sendMessage({
        type: MESSAGE_TYPES.GET_CURRENT_BOOKMARK,
        data: { url }
      });
      return response;
    } catch (error) {
      console.error('Failed to get bookmark data:', error);
      return null;
    }
  }

  /**
   * Remove overlay from DOM
   */
  removeOverlay() {
    if (this.overlayElement) {
      this.domUtils.remove(this.overlayElement);
      this.overlayElement = null;
    }
    this.currentBookmark = null;
  }

  /**
   * Check if overlay is visible
   * @returns {boolean} Whether overlay is visible
   */
  isVisible() {
    return this.isVisible;
  }

  /**
   * Clean up overlay manager
   */
  cleanup() {
    this.hideOverlay(false);
    console.log('Overlay manager cleaned up');
  }
} 