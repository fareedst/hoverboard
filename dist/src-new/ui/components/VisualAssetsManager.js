/**
 * VisualAssetsManager - Modern visual assets management system for Hoverboard Extension
 * Handles icon optimization, responsive images, asset preloading, and resource management
 */

export class VisualAssetsManager {
  constructor () {
    this.assetCache = new Map()
    this.preloadedAssets = new Set()
    this.loadingPromises = new Map()
    this.retryAttempts = new Map()
    this.maxRetries = 3
    this.retryDelay = 1000

    // Asset registry with different sizes and formats
    this.assetRegistry = {
      // Extension icons
      extension: {
        16: '/icons/hoverboard_16.png',
        19: '/icons/hoverboard_19.png',
        32: '/icons/hoverboard_32.png',
        48: '/icons/hoverboard_48.png',
        64: '/icons/hoverboard_64.png',
        128: '/icons/hoverboard_128.png',
        256: '/icons/hoverboard_256.png',
        512: '/icons/hoverboard_512.png',
        svg: '/icons/hoverboard.svg'
      },

      // Action icons
      pushpin: {
        24: '/icons/push-pin_24.png',
        svg: '/icons/push-pin.svg'
      },

      reload: {
        24: '/icons/reload_24.png',
        80: '/icons/reload_80.svg',
        svg: '/icons/reload.svg'
      },

      search: {
        24: '/icons/search_title_24.png',
        svg: '/icons/search_title01.svg'
      },

      // Pin states
      bluepin: {
        16: '/icons/bluepin_16.png',
        gif: '/icons/bluepin_16.gif'
      }
    }

    // Bind methods
    this.getAsset = this.getAsset.bind(this)
    this.preloadAssets = this.preloadAssets.bind(this)
    this.createResponsiveImage = this.createResponsiveImage.bind(this)
    this.optimizeForDisplay = this.optimizeForDisplay.bind(this)
  }

  /**
   * Get asset URL for given name and size
   */
  getAssetUrl (assetName, size = 'default', format = 'auto') {
    const asset = this.assetRegistry[assetName]
    if (!asset) {
      console.warn(`Asset "${assetName}" not found in registry`)
      return null
    }

    // Auto-select format based on browser support and context
    if (format === 'auto') {
      format = this.selectOptimalFormat(asset, size)
    }

    // Get URL for specific size/format
    const url = asset[size] || asset[format] || asset.svg || Object.values(asset)[0]

    if (url) {
      return chrome.runtime.getURL(url)
    }

    return null
  }

  /**
   * Select optimal format based on context
   */
  selectOptimalFormat (asset, preferredSize) {
    // Prefer SVG for scalability if available
    if (asset.svg && this.supportsSVG()) {
      return 'svg'
    }

    // Try exact size match
    if (asset[preferredSize]) {
      return preferredSize
    }

    // Find closest size
    const sizes = Object.keys(asset)
      .filter(key => !isNaN(key))
      .map(key => parseInt(key))
      .sort((a, b) => a - b)

    if (sizes.length > 0) {
      const targetSize = parseInt(preferredSize) || 24
      const closestSize = sizes.reduce((prev, curr) =>
        Math.abs(curr - targetSize) < Math.abs(prev - targetSize) ? curr : prev
      )
      return closestSize.toString()
    }

    // Fallback to first available
    return Object.keys(asset)[0]
  }

  /**
   * Check if browser supports SVG
   */
  supportsSVG () {
    return document.implementation.hasFeature('http://www.w3.org/TR/SVG11/feature#Image', '1.1')
  }

  /**
   * Get asset with caching and error handling
   */
  async getAsset (assetName, options = {}) {
    const {
      size = '24',
      format = 'auto',
      forceReload = false
    } = options

    const cacheKey = `${assetName}-${size}-${format}`

    // Return cached asset if available and not forcing reload
    if (!forceReload && this.assetCache.has(cacheKey)) {
      return this.assetCache.get(cacheKey)
    }

    // Return existing loading promise if in progress
    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey)
    }

    // Start loading asset
    const loadingPromise = this.loadAsset(assetName, size, format)
    this.loadingPromises.set(cacheKey, loadingPromise)

    try {
      const asset = await loadingPromise
      this.assetCache.set(cacheKey, asset)
      this.preloadedAssets.add(cacheKey)
      return asset
    } catch (error) {
      console.error(`Failed to load asset: ${assetName}`, error)
      throw error
    } finally {
      this.loadingPromises.delete(cacheKey)
    }
  }

  /**
   * Load asset with retry logic
   */
  async loadAsset (assetName, size, format) {
    const url = this.getAssetUrl(assetName, size, format)
    if (!url) {
      throw new Error(`No URL found for asset: ${assetName}`)
    }

    const cacheKey = `${assetName}-${size}-${format}`
    let attempts = 0

    while (attempts < this.maxRetries) {
      try {
        const asset = await this.fetchAsset(url)
        this.retryAttempts.delete(cacheKey)
        return asset
      } catch (error) {
        attempts++
        this.retryAttempts.set(cacheKey, attempts)

        if (attempts >= this.maxRetries) {
          throw new Error(`Failed to load asset after ${this.maxRetries} attempts: ${url}`)
        }

        // Wait before retrying
        await this.delay(this.retryDelay * attempts)
      }
    }
  }

  /**
   * Fetch asset from URL
   */
  async fetchAsset (url) {
    return new Promise((resolve, reject) => {
      const img = new Image()

      img.onload = () => {
        resolve({
          url,
          element: img,
          width: img.naturalWidth,
          height: img.naturalHeight,
          type: 'image'
        })
      }

      img.onerror = () => {
        reject(new Error(`Failed to load image: ${url}`))
      }

      img.src = url
    })
  }

  /**
   * Create responsive image element
   */
  createResponsiveImage (assetName, options = {}) {
    const {
      sizes = ['16', '24', '32', '48'],
      defaultSize = '24',
      className = '',
      alt = '',
      lazy = true
    } = options

    const img = document.createElement('img')
    img.className = `hb-responsive-img ${className}`.trim()
    img.alt = alt

    if (lazy) {
      img.loading = 'lazy'
    }

    // Set default source
    const defaultUrl = this.getAssetUrl(assetName, defaultSize)
    if (defaultUrl) {
      img.src = defaultUrl
    }

    // Create srcset for different sizes
    const asset = this.assetRegistry[assetName]
    if (asset) {
      const srcsetParts = []

      sizes.forEach(size => {
        const url = this.getAssetUrl(assetName, size)
        if (url) {
          srcsetParts.push(`${url} ${size}w`)
        }
      })

      if (srcsetParts.length > 0) {
        img.srcset = srcsetParts.join(', ')
        img.sizes = '(max-width: 24px) 16px, (max-width: 32px) 24px, (max-width: 48px) 32px, 48px'
      }
    }

    return img
  }

  /**
   * Create optimized image for specific context
   */
  createOptimizedImage (assetName, context, options = {}) {
    const contextConfigs = {
      icon: { size: '24', className: 'hb-icon-img' },
      logo: { size: '48', className: 'hb-logo-img' },
      avatar: { size: '32', className: 'hb-avatar-img' },
      badge: { size: '16', className: 'hb-badge-img' },
      header: { size: '128', className: 'hb-header-img' }
    }

    const config = contextConfigs[context] || contextConfigs.icon
    const mergedOptions = { ...config, ...options }

    return this.createResponsiveImage(assetName, mergedOptions)
  }

  /**
   * Preload multiple assets
   */
  async preloadAssets (assetList, options = {}) {
    const {
      priority = 'low',
      sizes = ['24'],
      formats = ['auto']
    } = options

    const preloadPromises = []

    assetList.forEach(assetName => {
      sizes.forEach(size => {
        formats.forEach(format => {
          const promise = this.getAsset(assetName, { size, format })
            .catch(error => {
              console.warn(`Failed to preload asset: ${assetName}`, error)
              return null
            })
          preloadPromises.push(promise)
        })
      })
    })

    const results = await Promise.allSettled(preloadPromises)
    const successful = results.filter(result => result.status === 'fulfilled').length
    const failed = results.length - successful

    console.log(`Asset preloading completed: ${successful} successful, ${failed} failed`)
    return { successful, failed, total: results.length }
  }

  /**
   * Preload critical assets for immediate use
   */
  async preloadCriticalAssets () {
    const criticalAssets = [
      'extension',
      'pushpin',
      'reload',
      'search'
    ]

    return this.preloadAssets(criticalAssets, {
      sizes: ['16', '24'],
      priority: 'high'
    })
  }

  /**
   * Create CSS background image rule
   */
  createBackgroundImageCSS (assetName, size = '24') {
    const url = this.getAssetUrl(assetName, size)
    if (!url) {
      return ''
    }

    return `background-image: url('${url}');`
  }

  /**
   * Optimize asset for display context
   */
  optimizeForDisplay (assetElement, context) {
    if (!assetElement) return

    const optimizations = {
      'high-dpi': () => {
        // Optimize for high DPI displays
        if (window.devicePixelRatio > 1) {
          const currentSrc = assetElement.src
          const scaledSrc = currentSrc.replace(/(\d+)(\.png|\.jpg)/, (match, size, ext) => {
            const newSize = parseInt(size) * window.devicePixelRatio
            return `${newSize}${ext}`
          })

          if (scaledSrc !== currentSrc) {
            assetElement.src = scaledSrc
          }
        }
      },

      print: () => {
        // Optimize for print
        assetElement.style.colorAdjust = 'exact'
        assetElement.style.webkitColorAdjust = 'exact'
      },

      accessibility: () => {
        // Enhance accessibility
        if (!assetElement.alt) {
          assetElement.alt = 'Hoverboard icon'
        }
        assetElement.setAttribute('role', 'img')
      }
    }

    if (optimizations[context]) {
      optimizations[context]()
    }
  }

  /**
   * Get asset dimensions
   */
  async getAssetDimensions (assetName, size = '24') {
    try {
      const asset = await this.getAsset(assetName, { size })
      return {
        width: asset.width,
        height: asset.height
      }
    } catch (error) {
      console.warn(`Failed to get dimensions for asset: ${assetName}`, error)
      return { width: 24, height: 24 } // Default fallback
    }
  }

  /**
   * Check if asset exists
   */
  hasAsset (assetName, size = null) {
    const asset = this.assetRegistry[assetName]
    if (!asset) return false

    if (size === null) return true

    return size in asset
  }

  /**
   * Get available sizes for asset
   */
  getAvailableSizes (assetName) {
    const asset = this.assetRegistry[assetName]
    if (!asset) return []

    return Object.keys(asset).filter(key => !isNaN(key) || key === 'svg')
  }

  /**
   * Clear asset cache
   */
  clearCache () {
    this.assetCache.clear()
    this.preloadedAssets.clear()
    this.loadingPromises.clear()
    this.retryAttempts.clear()
  }

  /**
   * Get cache statistics
   */
  getCacheStats () {
    return {
      cached: this.assetCache.size,
      preloaded: this.preloadedAssets.size,
      loading: this.loadingPromises.size,
      retrying: this.retryAttempts.size
    }
  }

  /**
   * Create favicon link element
   */
  createFavicon (size = '32') {
    const link = document.createElement('link')
    link.rel = 'icon'
    link.type = 'image/png'
    link.href = this.getAssetUrl('extension', size)
    link.sizes = `${size}x${size}`

    return link
  }

  /**
   * Create Apple touch icon
   */
  createAppleTouchIcon (size = '180') {
    const link = document.createElement('link')
    link.rel = 'apple-touch-icon'
    link.href = this.getAssetUrl('extension', size)
    link.sizes = `${size}x${size}`

    return link
  }

  /**
   * Generate asset manifest for PWA
   */
  generateAssetManifest () {
    const manifest = {
      icons: []
    }

    const extensionAsset = this.assetRegistry.extension
    if (extensionAsset) {
      Object.entries(extensionAsset).forEach(([size, path]) => {
        if (!isNaN(size)) {
          manifest.icons.push({
            src: chrome.runtime.getURL(path),
            sizes: `${size}x${size}`,
            type: 'image/png'
          })
        }
      })
    }

    return manifest
  }

  /**
   * Utility: delay function
   */
  delay (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Cleanup resources
   */
  cleanup () {
    this.clearCache()

    // Cancel any pending loading promises
    this.loadingPromises.forEach((promise, key) => {
      // Note: Can't actually cancel image loading, but clear the cache
      this.loadingPromises.delete(key)
    })
  }
}
