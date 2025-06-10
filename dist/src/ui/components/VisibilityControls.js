/**
 * VisibilityControls Component
 * Provides per-window visibility controls for overlay appearance
 */

import { Logger } from '../../shared/logger-browser.js'

const debugLog = (message, data = null) => {
  if (window.HOVERBOARD_DEBUG) {
    if (data) {
      console.log(`[Hoverboard VisibilityControls Debug] ${message}`, data)
    } else {
      console.log(`[Hoverboard VisibilityControls Debug] ${message}`)
    }
  }
}

export class VisibilityControls {
  constructor(document, onSettingsChange) {
    this.document = document
    this.onSettingsChange = onSettingsChange || (() => {})
    this.logger = new Logger('VisibilityControls')
    
    // Default settings
    this.settings = {
      textTheme: 'light-on-dark', // 'light-on-dark' | 'dark-on-light' - Dark theme default
      transparencyEnabled: false,
      backgroundOpacity: 90 // 0-100%
    }
    
    this.controlsElement = null
    this.isCollapsed = true
    
    debugLog('VisibilityControls initialized', this.settings)
  }
  
  /**
   * Create the visibility controls UI
   * @returns {HTMLElement} Controls container element
   */
  createControls() {
    const container = this.document.createElement('div')
    container.className = 'hoverboard-visibility-controls'
    container.innerHTML = this.getControlsHTML()
    
    this.controlsElement = container
    this.attachEventListeners()
    this.updateControlsState()
    
    debugLog('Controls created')
    return container
  }
  
  /**
   * Generate HTML for the controls
   * @returns {string} HTML string
   */
  getControlsHTML() {
    return `
      <div class="visibility-controls-header">
        <span class="controls-title">Display</span>
        <button class="controls-toggle" title="Toggle visibility controls">
          <span class="toggle-icon">${this.isCollapsed ? '⚙️' : '✕'}</span>
        </button>
      </div>
      <div class="visibility-controls-panel ${this.isCollapsed ? 'collapsed' : ''}">
        <div class="control-group">
          <label class="control-label">
            <span class="label-text">Theme:</span>
            <button class="theme-toggle" title="Switch between light and dark themes">
              <span class="theme-icon">${this.settings.textTheme === 'light-on-dark' ? '🌙' : '☀️'}</span>
              <span class="theme-text">${this.settings.textTheme === 'light-on-dark' ? 'Dark' : 'Light'}</span>
            </button>
          </label>
        </div>
        
        <div class="control-group">
          <label class="control-label">
            <input type="checkbox" class="transparency-toggle" ${this.settings.transparencyEnabled ? 'checked' : ''}>
            <span class="label-text">Transparency</span>
          </label>
        </div>
        
        <div class="control-group opacity-group ${!this.settings.transparencyEnabled ? 'disabled' : ''}">
          <label class="control-label">
            <span class="label-text">Opacity:</span>
            <div class="slider-container">
              <input type="range" 
                     class="opacity-slider" 
                     min="10" 
                     max="100" 
                     value="${this.settings.backgroundOpacity}"
                     ${!this.settings.transparencyEnabled ? 'disabled' : ''}>
              <span class="opacity-value">${this.settings.backgroundOpacity}%</span>
            </div>
          </label>
        </div>
      </div>
    `
  }
  
  /**
   * Attach event listeners to control elements
   */
  attachEventListeners() {
    if (!this.controlsElement) return
    
    // Toggle controls panel
    const toggleButton = this.controlsElement.querySelector('.controls-toggle')
    toggleButton?.addEventListener('click', () => {
      this.toggleControlsPanel()
    })
    
    // Theme toggle
    const themeToggle = this.controlsElement.querySelector('.theme-toggle')
    themeToggle?.addEventListener('click', () => {
      this.toggleTheme()
    })
    
    // Transparency toggle
    const transparencyToggle = this.controlsElement.querySelector('.transparency-toggle')
    transparencyToggle?.addEventListener('change', (e) => {
      this.setTransparencyEnabled(e.target.checked)
    })
    
    // Opacity slider
    const opacitySlider = this.controlsElement.querySelector('.opacity-slider')
    opacitySlider?.addEventListener('input', (e) => {
      this.setBackgroundOpacity(parseInt(e.target.value))
    })
    
    debugLog('Event listeners attached')
  }
  
  /**
   * Toggle the controls panel visibility
   */
  toggleControlsPanel() {
    this.isCollapsed = !this.isCollapsed
    const panel = this.controlsElement?.querySelector('.visibility-controls-panel')
    const toggleIcon = this.controlsElement?.querySelector('.toggle-icon')
    
    if (panel) {
      panel.classList.toggle('collapsed', this.isCollapsed)
    }
    
    if (toggleIcon) {
      toggleIcon.textContent = this.isCollapsed ? '⚙️' : '✕'
    }
    
    debugLog('Controls panel toggled', { collapsed: this.isCollapsed })
  }
  
  /**
   * Toggle between light and dark themes
   */
  toggleTheme() {
    this.settings.textTheme = this.settings.textTheme === 'light-on-dark' 
      ? 'dark-on-light' 
      : 'light-on-dark'
    
    this.updateThemeDisplay()
    this.notifySettingsChange()
    
    debugLog('Theme toggled', { theme: this.settings.textTheme })
  }
  
  /**
   * Set transparency enabled state
   * @param {boolean} enabled 
   */
  setTransparencyEnabled(enabled) {
    this.settings.transparencyEnabled = enabled
    this.updateOpacityControlState()
    this.notifySettingsChange()
    
    debugLog('Transparency toggled', { enabled })
  }
  
  /**
   * Set background opacity value
   * @param {number} opacity - Opacity value 0-100
   */
  setBackgroundOpacity(opacity) {
    this.settings.backgroundOpacity = Math.max(10, Math.min(100, opacity))
    this.updateOpacityDisplay()
    this.notifySettingsChange()
    
    debugLog('Opacity changed', { opacity: this.settings.backgroundOpacity })
  }
  
  /**
   * Update theme display elements
   */
  updateThemeDisplay() {
    const themeIcon = this.controlsElement?.querySelector('.theme-icon')
    const themeText = this.controlsElement?.querySelector('.theme-text')
    
    if (themeIcon && themeText) {
      const isLightOnDark = this.settings.textTheme === 'light-on-dark'
      themeIcon.textContent = isLightOnDark ? '🌙' : '☀️'
      themeText.textContent = isLightOnDark ? 'Dark' : 'Light'
    }
  }
  
  /**
   * Update opacity control state and display
   */
  updateOpacityControlState() {
    const opacityGroup = this.controlsElement?.querySelector('.opacity-group')
    const opacitySlider = this.controlsElement?.querySelector('.opacity-slider')
    
    if (opacityGroup) {
      opacityGroup.classList.toggle('disabled', !this.settings.transparencyEnabled)
    }
    
    if (opacitySlider) {
      opacitySlider.disabled = !this.settings.transparencyEnabled
    }
  }
  
  /**
   * Update opacity value display
   */
  updateOpacityDisplay() {
    const opacityValue = this.controlsElement?.querySelector('.opacity-value')
    const opacitySlider = this.controlsElement?.querySelector('.opacity-slider')
    
    if (opacityValue) {
      opacityValue.textContent = `${this.settings.backgroundOpacity}%`
    }
    
    if (opacitySlider) {
      opacitySlider.value = this.settings.backgroundOpacity
    }
  }
  
  /**
   * Update all control states to match current settings
   */
  updateControlsState() {
    this.updateThemeDisplay()
    this.updateOpacityControlState()
    this.updateOpacityDisplay()
    
    const transparencyToggle = this.controlsElement?.querySelector('.transparency-toggle')
    if (transparencyToggle) {
      transparencyToggle.checked = this.settings.transparencyEnabled
    }
  }
  
  /**
   * Get current visibility settings
   * @returns {Object} Current settings object
   */
  getSettings() {
    return { ...this.settings }
  }
  
  /**
   * Set visibility settings
   * @param {Object} newSettings - Settings to apply
   */
  setSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings }
    this.updateControlsState()
    debugLog('Settings updated', this.settings)
  }
  
  /**
   * Notify parent component of settings change
   */
  notifySettingsChange() {
    this.onSettingsChange(this.getSettings())
  }
  
  /**
   * Get CSS styles for the controls
   * @returns {string} CSS styles
   */
  getControlsCSS() {
    return `
      .hoverboard-visibility-controls {
        position: absolute;
        top: 8px;
        right: 8px;
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid #ddd;
        border-radius: 6px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        min-width: 160px;
      }
      
      .visibility-controls-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 6px 8px;
        background: #f8f9fa;
        border-bottom: 1px solid #e9ecef;
        border-radius: 5px 5px 0 0;
      }
      
      .controls-title {
        font-weight: 600;
        color: #495057;
      }
      
      .controls-toggle {
        background: none;
        border: none;
        cursor: pointer;
        padding: 2px 4px;
        border-radius: 3px;
        font-size: 14px;
        line-height: 1;
      }
      
      .controls-toggle:hover {
        background: rgba(0, 0, 0, 0.1);
      }
      
      .visibility-controls-panel {
        padding: 8px;
        transition: all 0.2s ease;
        max-height: 200px;
        overflow: hidden;
      }
      
      .visibility-controls-panel.collapsed {
        max-height: 0;
        padding: 0 8px;
      }
      
      .control-group {
        margin-bottom: 8px;
      }
      
      .control-group:last-child {
        margin-bottom: 0;
      }
      
      .control-group.disabled {
        opacity: 0.5;
        pointer-events: none;
      }
      
      .control-label {
        display: flex;
        align-items: center;
        justify-content: space-between;
        cursor: pointer;
        padding: 2px 0;
      }
      
      .label-text {
        font-weight: 500;
        color: #495057;
      }
      
      .theme-toggle {
        display: flex;
        align-items: center;
        gap: 4px;
        background: #e9ecef;
        border: 1px solid #ced4da;
        border-radius: 4px;
        padding: 4px 8px;
        cursor: pointer;
        font-size: 11px;
        transition: all 0.15s ease;
      }
      
      .theme-toggle:hover {
        background: #dee2e6;
        border-color: #adb5bd;
      }
      
      .theme-icon {
        font-size: 12px;
      }
      
      .transparency-toggle {
        cursor: pointer;
      }
      
      .slider-container {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      
      .opacity-slider {
        width: 80px;
        height: 4px;
        background: #e9ecef;
        border-radius: 2px;
        outline: none;
        cursor: pointer;
      }
      
      .opacity-slider::-webkit-slider-thumb {
        appearance: none;
        width: 12px;
        height: 12px;
        background: #007bff;
        border-radius: 50%;
        cursor: pointer;
      }
      
      .opacity-slider::-moz-range-thumb {
        width: 12px;
        height: 12px;
        background: #007bff;
        border-radius: 50%;
        cursor: pointer;
        border: none;
      }
      
      .opacity-value {
        font-size: 10px;
        color: #6c757d;
        min-width: 30px;
        text-align: right;
      }
      
      /* Dark theme styles */
      .hoverboard-theme-light-on-dark .hoverboard-visibility-controls {
        background: rgba(33, 37, 41, 0.95);
        border-color: #495057;
        color: #f8f9fa;
      }
      
      .hoverboard-theme-light-on-dark .visibility-controls-header {
        background: #343a40;
        border-color: #495057;
      }
      
      .hoverboard-theme-light-on-dark .controls-title,
      .hoverboard-theme-light-on-dark .label-text {
        color: #f8f9fa;
      }
      
      .hoverboard-theme-light-on-dark .theme-toggle {
        background: #495057;
        border-color: #6c757d;
        color: #f8f9fa;
      }
      
      .hoverboard-theme-light-on-dark .theme-toggle:hover {
        background: #5a6268;
        border-color: #adb5bd;
      }
      
      .hoverboard-theme-light-on-dark .opacity-slider {
        background: #495057;
      }
      
      .hoverboard-theme-light-on-dark .opacity-value {
        color: #adb5bd;
      }
    `
  }
  
  /**
   * Destroy the controls and clean up
   */
  destroy() {
    if (this.controlsElement) {
      this.controlsElement.remove()
      this.controlsElement = null
    }
    debugLog('VisibilityControls destroyed')
  }
} 