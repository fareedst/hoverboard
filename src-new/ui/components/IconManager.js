/**
 * IconManager - Modern icon management system for Hoverboard Extension
 * Handles scalable icons, dynamic theming, and provides clean API
 */

export class IconManager {
  constructor() {
    this.iconCache = new Map();
    this.preloadedIcons = new Set();
    this.iconRegistry = this.getIconRegistry();
    this.currentTheme = 'light';
    
    // Bind methods
    this.getIcon = this.getIcon.bind(this);
    this.preloadIcons = this.preloadIcons.bind(this);
    this.setTheme = this.setTheme.bind(this);
    this.createIconElement = this.createIconElement.bind(this);
  }

  /**
   * Get icon registry with all available icons
   */
  getIconRegistry() {
    return {
      // Navigation icons
      'hoverboard': {
        svg: `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>`,
        fallback: '/icons/hoverboard_16.png'
      },
      'pushpin': {
        svg: `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12Z"/>
        </svg>`,
        fallback: '/icons/push-pin_24.png'
      },
      'reload': {
        svg: `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z"/>
        </svg>`,
        fallback: '/icons/reload_24.png'
      },
      'search': {
        svg: `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z"/>
        </svg>`,
        fallback: '/icons/search_title_24.png'
      },
      
      // Action icons
      'private': {
        svg: `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z"/>
        </svg>`,
        fallback: null
      },
      'public': {
        svg: `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10A2,2 0 0,1 6,8H18M6,10V20H18V10H6Z"/>
        </svg>`,
        fallback: null
      },
      'read-later': {
        svg: `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z"/>
        </svg>`,
        fallback: null
      },
      'delete': {
        svg: `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
        </svg>`,
        fallback: null
      },
      'tag': {
        svg: `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M5.5,7A1.5,1.5 0 0,1 4,5.5A1.5,1.5 0 0,1 5.5,4A1.5,1.5 0 0,1 7,5.5A1.5,1.5 0 0,1 5.5,7M21.41,11.58L12.41,2.58C12.05,2.22 11.55,2 11,2H4C2.9,2 2,2.9 2,4V11C2,11.55 2.22,12.05 2.59,12.42L11.58,21.41C11.95,21.78 12.45,22 13,22C13.55,22 14.05,21.78 14.41,21.41L21.41,14.41C21.78,14.05 22,13.55 22,13C22,12.45 21.78,11.95 21.41,11.58Z"/>
        </svg>`,
        fallback: null
      },
      'add': {
        svg: `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
        </svg>`,
        fallback: null
      },
      'remove': {
        svg: `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19,13H5V11H19V13Z"/>
        </svg>`,
        fallback: null
      },
      'close': {
        svg: `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
        </svg>`,
        fallback: null
      },
      
      // Status icons
      'loading': {
        svg: `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z">
            <animateTransform attributeName="transform" attributeType="XML" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
          </path>
        </svg>`,
        fallback: null
      },
      'connected': {
        svg: `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M11,16.5L18,9.5L16.59,8.09L11,13.67L7.91,10.59L6.5,12L11,16.5Z"/>
        </svg>`,
        fallback: null
      },
      'disconnected': {
        svg: `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M14.5,9L12,11.5L9.5,9L8,10.5L10.5,13L8,15.5L9.5,17L12,14.5L14.5,17L16,15.5L13.5,13L16,10.5L14.5,9Z"/>
        </svg>`,
        fallback: null
      },
      'warning': {
        svg: `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
        </svg>`,
        fallback: null
      },
      'info': {
        svg: `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
        </svg>`,
        fallback: null
      },
      
      // UI controls
      'chevron-down': {
        svg: `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z"/>
        </svg>`,
        fallback: null
      },
      'chevron-up': {
        svg: `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M7.41,15.41L12,10.83L16.59,15.41L18,14L12,8L6,14L7.41,15.41Z"/>
        </svg>`,
        fallback: null
      },
      'chevron-right': {
        svg: `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z"/>
        </svg>`,
        fallback: null
      },
      'chevron-left': {
        svg: `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z"/>
        </svg>`,
        fallback: null
      },
      'options': {
        svg: `<svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"/>
        </svg>`,
        fallback: null
      }
    };
  }

  /**
   * Get icon element by name
   */
  getIcon(iconName, options = {}) {
    const {
      size = 24,
      className = '',
      color = 'currentColor',
      ariaLabel = null,
      useFallback = true
    } = options;

    const iconData = this.iconRegistry[iconName];
    if (!iconData) {
      console.warn(`Icon "${iconName}" not found in registry`);
      return this.createFallbackIcon(iconName, options);
    }

    // Try to create SVG icon first
    if (iconData.svg) {
      return this.createSVGIcon(iconData.svg, {
        size,
        className,
        color,
        ariaLabel: ariaLabel || iconName,
        iconName
      });
    }

    // Fall back to image icon if available
    if (useFallback && iconData.fallback) {
      return this.createImageIcon(iconData.fallback, {
        size,
        className,
        ariaLabel: ariaLabel || iconName,
        iconName
      });
    }

    return this.createFallbackIcon(iconName, options);
  }

  /**
   * Create SVG icon element
   */
  createSVGIcon(svgContent, options) {
    const {
      size,
      className,
      color,
      ariaLabel,
      iconName
    } = options;

    const container = document.createElement('span');
    container.className = `hb-icon hb-icon--${iconName} ${className}`.trim();
    container.style.cssText = `
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: ${size}px;
      height: ${size}px;
      color: ${color};
      flex-shrink: 0;
    `;
    
    container.innerHTML = svgContent;
    
    const svg = container.querySelector('svg');
    if (svg) {
      svg.setAttribute('width', size);
      svg.setAttribute('height', size);
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');
    }

    if (ariaLabel) {
      container.setAttribute('aria-label', ariaLabel);
      container.setAttribute('role', 'img');
    }

    return container;
  }

  /**
   * Create image icon element
   */
  createImageIcon(imageSrc, options) {
    const {
      size,
      className,
      ariaLabel,
      iconName
    } = options;

    const img = document.createElement('img');
    img.src = chrome.runtime.getURL(imageSrc);
    img.width = size;
    img.height = size;
    img.className = `hb-icon hb-icon--${iconName} ${className}`.trim();
    img.style.cssText = `
      display: block;
      width: ${size}px;
      height: ${size}px;
      flex-shrink: 0;
    `;

    if (ariaLabel) {
      img.alt = ariaLabel;
    } else {
      img.alt = '';
      img.setAttribute('aria-hidden', 'true');
    }

    return img;
  }

  /**
   * Create fallback icon when icon is not found
   */
  createFallbackIcon(iconName, options) {
    const {
      size = 24,
      className = '',
      color = 'currentColor'
    } = options;

    const container = document.createElement('span');
    container.className = `hb-icon hb-icon--fallback ${className}`.trim();
    container.style.cssText = `
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: ${size}px;
      height: ${size}px;
      background-color: ${color};
      border-radius: 2px;
      opacity: 0.3;
      flex-shrink: 0;
    `;
    
    container.setAttribute('aria-label', `${iconName} icon`);
    container.setAttribute('title', `Missing icon: ${iconName}`);

    return container;
  }

  /**
   * Create icon element with automatic theme adaptation
   */
  createIconElement(iconName, options = {}) {
    const element = this.getIcon(iconName, options);
    
    // Add theme-aware classes
    element.classList.add('hb-icon--themed');
    
    // Update icon theme
    this.updateIconTheme(element);
    
    return element;
  }

  /**
   * Update icon theme
   */
  updateIconTheme(iconElement) {
    if (!iconElement || !iconElement.classList.contains('hb-icon--themed')) {
      return;
    }

    const isDark = this.currentTheme === 'dark';
    iconElement.classList.toggle('hb-icon--dark', isDark);
    iconElement.classList.toggle('hb-icon--light', !isDark);
  }

  /**
   * Set current theme
   */
  setTheme(theme) {
    this.currentTheme = theme;
    
    // Update all themed icons
    const themedIcons = document.querySelectorAll('.hb-icon--themed');
    themedIcons.forEach(icon => this.updateIconTheme(icon));
  }

  /**
   * Preload commonly used icons
   */
  async preloadIcons(iconNames) {
    const promises = iconNames.map(async (iconName) => {
      if (!this.preloadedIcons.has(iconName)) {
        const iconData = this.iconRegistry[iconName];
        if (iconData?.fallback) {
          // Preload image if it has a fallback
          return this.preloadImage(iconData.fallback);
        }
      }
    });

    await Promise.allSettled(promises);
    iconNames.forEach(name => this.preloadedIcons.add(name));
  }

  /**
   * Preload image
   */
  preloadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = resolve;
      img.onerror = reject;
      img.src = chrome.runtime.getURL(src);
    });
  }

  /**
   * Create button with icon
   */
  createIconButton(iconName, options = {}) {
    const {
      text = '',
      className = '',
      size = 20,
      variant = 'default',
      disabled = false,
      ariaLabel = null,
      onClick = null
    } = options;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = `hb-btn hb-btn--${variant} hb-btn--icon ${className}`.trim();
    button.disabled = disabled;

    if (ariaLabel) {
      button.setAttribute('aria-label', ariaLabel);
    }

    // Create icon
    const icon = this.createIconElement(iconName, { size });
    button.appendChild(icon);

    // Add text if provided
    if (text) {
      const textSpan = document.createElement('span');
      textSpan.textContent = text;
      textSpan.className = 'hb-btn__text';
      button.appendChild(textSpan);
    }

    // Add click handler
    if (onClick) {
      button.addEventListener('click', onClick);
    }

    return button;
  }

  /**
   * Get available icon names
   */
  getAvailableIcons() {
    return Object.keys(this.iconRegistry);
  }

  /**
   * Check if icon exists
   */
  hasIcon(iconName) {
    return iconName in this.iconRegistry;
  }
} 