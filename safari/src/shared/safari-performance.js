/**
 * Safari Performance Optimization Module
 * 
 * [SAFARI-EXT-PERFORMANCE-001] Safari-specific performance optimizations including:
 * - Memory monitoring and cleanup
 * - CPU optimization strategies
 * - Rendering optimizations
 * - Animation performance improvements
 * - DOM manipulation optimizations
 * - Event handling optimizations
 * 
 * @file safari/src/shared/safari-performance.js
 * @version 1.0.0
 * @author Fareed Stevenson
 * @date 2025-07-20
 */

// [SAFARI-EXT-PERFORMANCE-001] Safari performance optimization configuration
const SAFARI_PERFORMANCE_CONFIG = {
  // Memory management settings
  memoryMonitoring: {
    enabled: true,
    interval: 30000, // 30 seconds
    warningThreshold: 70, // 70% memory usage
    criticalThreshold: 90, // 90% memory usage
    cleanupThreshold: 80, // 80% memory usage triggers cleanup
    maxCleanupAttempts: 3
  },
  
  // CPU optimization settings
  cpuOptimization: {
    enabled: true,
    idleCallbackTimeout: 1000, // 1 second
    batchSize: 10, // Process items in batches of 10
    maxProcessingTime: 16, // 16ms per frame (60fps)
    enableThrottling: true
  },
  
  // Rendering optimization settings
  renderingOptimization: {
    enabled: true,
    hardwareAcceleration: true,
    backfaceVisibility: true,
    perspectiveOptimization: true,
    transformOptimization: true,
    willChangeOptimization: true
  },
  
  // Animation optimization settings
  animationOptimization: {
    enabled: true,
    reducedMotion: true,
    animationDuration: 300, // 300ms for Safari
    easingFunction: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    enableGPUAcceleration: true
  },
  
  // DOM manipulation optimization settings
  domOptimization: {
    enabled: true,
    batchUpdates: true,
    fragmentOptimization: true,
    styleOptimization: true,
    eventOptimization: true,
    debounceDelay: 16 // 16ms debounce
  },
  
  // Event handling optimization settings
  eventOptimization: {
    enabled: true,
    passiveListeners: true,
    throttledEvents: true,
    debouncedEvents: true,
    eventPooling: true
  }
}

/**
 * [SAFARI-EXT-PERFORMANCE-001] Safari Performance Manager
 * Provides comprehensive performance monitoring and optimization for Safari browsers
 */
class SafariPerformanceManager {
  constructor(config = SAFARI_PERFORMANCE_CONFIG) {
    this.config = config
    this.isSafari = this.detectSafari()
    this.memoryMonitor = null
    this.cpuOptimizer = null
    this.renderingOptimizer = null
    this.animationOptimizer = null
    this.domOptimizer = null
    this.eventOptimizer = null
    this.performanceStats = {
      memoryUsage: 0,
      cpuUsage: 0,
      frameRate: 0,
      lastCleanup: 0,
      cleanupCount: 0,
      optimizationCount: 0
    }
    
    this.init()
  }
  
  /**
   * [SAFARI-EXT-PERFORMANCE-001] Initialize Safari performance optimizations
   */
  init() {
    if (!this.isSafari) {
      console.log('[SAFARI-EXT-PERFORMANCE-001] Not Safari, skipping performance optimizations')
      return
    }
    
    console.log('[SAFARI-EXT-PERFORMANCE-001] Initializing Safari performance optimizations')
    
    // Initialize memory monitoring
    if (this.config.memoryMonitoring.enabled) {
      this.initMemoryMonitoring()
    }
    
    // Initialize CPU optimization
    if (this.config.cpuOptimization.enabled) {
      this.initCPUOptimization()
    }
    
    // Initialize rendering optimization
    if (this.config.renderingOptimization.enabled) {
      this.initRenderingOptimization()
    }
    
    // Initialize animation optimization
    if (this.config.animationOptimization.enabled) {
      this.initAnimationOptimization()
    }
    
    // Initialize DOM optimization
    if (this.config.domOptimization.enabled) {
      this.initDOMOptimization()
    }
    
    // Initialize event optimization
    if (this.config.eventOptimization.enabled) {
      this.initEventOptimization()
    }
    
    console.log('[SAFARI-EXT-PERFORMANCE-001] Safari performance optimizations initialized')
  }
  
  /**
   * [SAFARI-EXT-PERFORMANCE-001] Detect Safari browser
   */
  detectSafari() {
    return typeof safari !== 'undefined' || 
           (navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome'))
  }
  
  /**
   * [SAFARI-EXT-PERFORMANCE-001] Initialize memory monitoring
   */
  initMemoryMonitoring() {
    this.memoryMonitor = {
      interval: null,
      lastCheck: 0,
      cleanupAttempts: 0
    }
    
    this.startMemoryMonitoring()
  }
  
  /**
   * [SAFARI-EXT-PERFORMANCE-001] Start memory monitoring
   */
  startMemoryMonitoring() {
    if (this.memoryMonitor.interval) {
      clearInterval(this.memoryMonitor.interval)
    }
    
    this.memoryMonitor.interval = setInterval(() => {
      this.checkMemoryUsage()
    }, this.config.memoryMonitoring.interval)
    
    console.log('[SAFARI-EXT-PERFORMANCE-001] Memory monitoring started')
  }
  
  /**
   * [SAFARI-EXT-PERFORMANCE-001] Check memory usage and trigger cleanup if needed
   */
  checkMemoryUsage() {
    if (!window.performance || !window.performance.memory) {
      return
    }
    
    const memoryInfo = window.performance.memory
    const memoryUsagePercent = (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100
    
    this.performanceStats.memoryUsage = memoryUsagePercent
    this.memoryMonitor.lastCheck = Date.now()
    
    if (memoryUsagePercent > this.config.memoryMonitoring.criticalThreshold) {
      console.warn(`[SAFARI-EXT-PERFORMANCE-001] Critical memory usage: ${memoryUsagePercent.toFixed(1)}%`)
      this.handleCriticalMemoryUsage()
    } else if (memoryUsagePercent > this.config.memoryMonitoring.warningThreshold) {
      console.log(`[SAFARI-EXT-PERFORMANCE-001] High memory usage: ${memoryUsagePercent.toFixed(1)}%`)
      this.handleHighMemoryUsage()
    } else if (memoryUsagePercent > this.config.memoryMonitoring.cleanupThreshold) {
      console.log(`[SAFARI-EXT-PERFORMANCE-001] Memory cleanup threshold reached: ${memoryUsagePercent.toFixed(1)}%`)
      this.performMemoryCleanup()
    }
  }
  
  /**
   * [SAFARI-EXT-PERFORMANCE-001] Handle critical memory usage
   */
  handleCriticalMemoryUsage() {
    // Force garbage collection if available
    if (window.gc) {
      window.gc()
    }
    
    // Clear all caches
    this.clearAllCaches()
    
    // Disable non-essential features
    this.disableNonEssentialFeatures()
    
    // Notify user of performance issues
    this.notifyPerformanceIssue('critical_memory')
  }
  
  /**
   * [SAFARI-EXT-PERFORMANCE-001] Handle high memory usage
   */
  handleHighMemoryUsage() {
    // Perform aggressive cleanup
    this.performMemoryCleanup()
    
    // Throttle non-essential operations
    this.throttleNonEssentialOperations()
  }
  
  /**
   * [SAFARI-EXT-PERFORMANCE-001] Perform memory cleanup
   */
  performMemoryCleanup() {
    if (this.memoryMonitor.cleanupAttempts >= this.config.memoryMonitoring.maxCleanupAttempts) {
      console.warn('[SAFARI-EXT-PERFORMANCE-001] Max cleanup attempts reached')
      return
    }
    
    this.memoryMonitor.cleanupAttempts++
    this.performanceStats.cleanupCount++
    this.performanceStats.lastCleanup = Date.now()
    
    // Clear various caches
    this.clearAllCaches()
    
    // Force garbage collection if available
    if (window.gc) {
      window.gc()
    }
    
    console.log(`[SAFARI-EXT-PERFORMANCE-001] Memory cleanup performed (attempt ${this.memoryMonitor.cleanupAttempts})`)
  }
  
  /**
   * [SAFARI-EXT-PERFORMANCE-001] Clear all caches
   */
  clearAllCaches() {
    // Clear localStorage cache if needed
    if (window.localStorage) {
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('hoverboard_cache_')) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
    }
    
    // Clear sessionStorage cache
    if (window.sessionStorage) {
      sessionStorage.clear()
    }
    
    // Clear any in-memory caches
    if (window.hoverboardCache) {
      window.hoverboardCache.clear()
    }
  }
  
  /**
   * [SAFARI-EXT-PERFORMANCE-001] Initialize CPU optimization
   */
  initCPUOptimization() {
    this.cpuOptimizer = {
      idleCallbacks: [],
      processingQueue: [],
      isProcessing: false
    }
    
    console.log('[SAFARI-EXT-PERFORMANCE-001] CPU optimization initialized')
  }
  
  /**
   * [SAFARI-EXT-PERFORMANCE-001] Schedule CPU-intensive task for idle time
   */
  scheduleIdleTask(task, priority = 'normal') {
    if (!this.isSafari || !this.config.cpuOptimization.enabled) {
      task()
      return
    }
    
    const idleTask = {
      task,
      priority,
      timestamp: Date.now()
    }
    
    this.cpuOptimizer.idleCallbacks.push(idleTask)
    
    if (window.requestIdleCallback) {
      window.requestIdleCallback(() => {
        this.processIdleTasks()
      }, { timeout: this.config.cpuOptimization.idleCallbackTimeout })
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        this.processIdleTasks()
      }, this.config.cpuOptimization.idleCallbackTimeout)
    }
  }
  
  /**
   * [SAFARI-EXT-PERFORMANCE-001] Process idle tasks
   */
  processIdleTasks() {
    if (this.cpuOptimizer.isProcessing) {
      return
    }
    
    this.cpuOptimizer.isProcessing = true
    
    const startTime = performance.now()
    const maxTime = this.config.cpuOptimization.maxProcessingTime
    
    while (this.cpuOptimizer.idleCallbacks.length > 0 && 
           (performance.now() - startTime) < maxTime) {
      const task = this.cpuOptimizer.idleCallbacks.shift()
      try {
        task.task()
      } catch (error) {
        console.error('[SAFARI-EXT-PERFORMANCE-001] Idle task error:', error)
      }
    }
    
    this.cpuOptimizer.isProcessing = false
    
    // Schedule remaining tasks for next idle period
    if (this.cpuOptimizer.idleCallbacks.length > 0) {
      this.scheduleIdleTask(() => this.processIdleTasks(), 'low')
    }
  }
  
  /**
   * [SAFARI-EXT-PERFORMANCE-001] Initialize rendering optimization
   */
  initRenderingOptimization() {
    this.renderingOptimizer = {
      optimizedElements: new Set(),
      styleCache: new Map()
    }
    
    // Apply hardware acceleration optimizations
    this.applyHardwareAcceleration()
    
    console.log('[SAFARI-EXT-PERFORMANCE-001] Rendering optimization initialized')
  }
  
  /**
   * [SAFARI-EXT-PERFORMANCE-001] Apply hardware acceleration optimizations
   */
  applyHardwareAcceleration() {
    if (!this.config.renderingOptimization.hardwareAcceleration) {
      return
    }
    
    // Add hardware acceleration styles to document
    const style = document.createElement('style')
    style.textContent = `
      .hoverboard-optimized {
        -webkit-transform: translateZ(0);
        transform: translateZ(0);
        -webkit-backface-visibility: hidden;
        backface-visibility: hidden;
        -webkit-perspective: 1000px;
        perspective: 1000px;
        will-change: transform;
      }
      
      .hoverboard-overlay {
        -webkit-transform: translateZ(0);
        transform: translateZ(0);
        -webkit-backface-visibility: hidden;
        backface-visibility: hidden;
        will-change: opacity, transform;
      }
    `
    
    if (document.head) {
      document.head.appendChild(style)
    }
  }
  
  /**
   * [SAFARI-EXT-PERFORMANCE-001] Optimize element for rendering
   */
  optimizeElement(element) {
    if (!this.isSafari || !this.config.renderingOptimization.enabled) {
      return
    }
    
    if (this.renderingOptimizer.optimizedElements.has(element)) {
      return
    }
    
    element.classList.add('hoverboard-optimized')
    this.renderingOptimizer.optimizedElements.add(element)
    
    // Cache computed styles for performance
    const styles = window.getComputedStyle(element)
    this.renderingOptimizer.styleCache.set(element, {
      transform: styles.transform,
      opacity: styles.opacity,
      willChange: styles.willChange
    })
  }
  
  /**
   * [SAFARI-EXT-PERFORMANCE-001] Initialize animation optimization
   */
  initAnimationOptimization() {
    this.animationOptimizer = {
      animations: new Map(),
      reducedMotion: this.detectReducedMotion()
    }
    
    // Apply animation optimizations
    this.applyAnimationOptimizations()
    
    console.log('[SAFARI-EXT-PERFORMANCE-001] Animation optimization initialized')
  }
  
  /**
   * [SAFARI-EXT-PERFORMANCE-001] Detect reduced motion preference
   */
  detectReducedMotion() {
    return window.matchMedia && 
           window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }
  
  /**
   * [SAFARI-EXT-PERFORMANCE-001] Apply animation optimizations
   */
  applyAnimationOptimizations() {
    if (!this.config.animationOptimization.enabled) {
      return
    }
    
    // Add optimized animation styles
    const style = document.createElement('style')
    style.textContent = `
      .hoverboard-animation {
        transition-duration: ${this.config.animationOptimization.animationDuration}ms;
        transition-timing-function: ${this.config.animationOptimization.easingFunction};
        -webkit-transform: translateZ(0);
        transform: translateZ(0);
      }
      
      @media (prefers-reduced-motion: reduce) {
        .hoverboard-animation {
          transition-duration: 0ms;
          animation-duration: 0ms;
        }
      }
    `
    
    if (document.head) {
      document.head.appendChild(style)
    }
  }
  
  /**
   * [SAFARI-EXT-PERFORMANCE-001] Initialize DOM optimization
   */
  initDOMOptimization() {
    this.domOptimizer = {
      updateQueue: [],
      isUpdating: false,
      debounceTimers: new Map()
    }
    
    console.log('[SAFARI-EXT-PERFORMANCE-001] DOM optimization initialized')
  }
  
  /**
   * [SAFARI-EXT-PERFORMANCE-001] Batch DOM updates
   */
  batchDOMUpdate(updateFunction) {
    if (!this.isSafari || !this.config.domOptimization.batchUpdates) {
      updateFunction()
      return
    }
    
    this.domOptimizer.updateQueue.push(updateFunction)
    
    if (!this.domOptimizer.isUpdating) {
      this.processDOMUpdates()
    }
  }
  
  /**
   * [SAFARI-EXT-PERFORMANCE-001] Process batched DOM updates
   */
  processDOMUpdates() {
    if (this.domOptimizer.isUpdating || this.domOptimizer.updateQueue.length === 0) {
      return
    }
    
    this.domOptimizer.isUpdating = true
    
    // Process updates in batches
    const batchSize = this.config.cpuOptimization.batchSize
    const updates = this.domOptimizer.updateQueue.splice(0, batchSize)
    
    // Use requestAnimationFrame for smooth updates
    requestAnimationFrame(() => {
      updates.forEach(update => {
        try {
          update()
        } catch (error) {
          console.error('[SAFARI-EXT-PERFORMANCE-001] DOM update error:', error)
        }
      })
      
      this.domOptimizer.isUpdating = false
      
      // Process remaining updates
      if (this.domOptimizer.updateQueue.length > 0) {
        this.processDOMUpdates()
      }
    })
  }
  
  /**
   * [SAFARI-EXT-PERFORMANCE-001] Debounced function execution
   */
  debounce(func, delay = this.config.domOptimization.debounceDelay) {
    return (...args) => {
      const key = func.toString()
      
      if (this.domOptimizer.debounceTimers.has(key)) {
        clearTimeout(this.domOptimizer.debounceTimers.get(key))
      }
      
      const timer = setTimeout(() => {
        func.apply(this, args)
        this.domOptimizer.debounceTimers.delete(key)
      }, delay)
      
      this.domOptimizer.debounceTimers.set(key, timer)
    }
  }
  
  /**
   * [SAFARI-EXT-PERFORMANCE-001] Initialize event optimization
   */
  initEventOptimization() {
    this.eventOptimizer = {
      passiveListeners: new Map(),
      throttledEvents: new Map(),
      eventPool: []
    }
    
    console.log('[SAFARI-EXT-PERFORMANCE-001] Event optimization initialized')
  }
  
  /**
   * [SAFARI-EXT-PERFORMANCE-001] Add optimized event listener
   */
  addOptimizedEventListener(element, event, handler, options = {}) {
    if (!this.isSafari || !this.config.eventOptimization.enabled) {
      element.addEventListener(event, handler, options)
      return
    }
    
    // Use passive listeners for scroll and touch events
    if (this.config.eventOptimization.passiveListeners && 
        (event === 'scroll' || event === 'touchstart' || event === 'touchmove')) {
      options.passive = true
    }
    
    // Throttle frequent events
    if (this.config.eventOptimization.throttledEvents && 
        (event === 'scroll' || event === 'resize' || event === 'mousemove')) {
      const throttledHandler = this.throttle(handler, 16) // 60fps
      element.addEventListener(event, throttledHandler, options)
      this.eventOptimizer.throttledEvents.set(handler, throttledHandler)
    } else {
      element.addEventListener(event, handler, options)
    }
  }
  
  /**
   * [SAFARI-EXT-PERFORMANCE-001] Throttle function execution
   */
  throttle(func, delay) {
    let lastCall = 0
    return function(...args) {
      const now = Date.now()
      if (now - lastCall >= delay) {
        lastCall = now
        func.apply(this, args)
      }
    }
  }
  
  /**
   * [SAFARI-EXT-PERFORMANCE-001] Disable non-essential features
   */
  disableNonEssentialFeatures() {
    // Disable animations
    if (this.config.animationOptimization.enabled) {
      this.config.animationOptimization.enabled = false
    }
    
    // Disable CPU optimization
    if (this.config.cpuOptimization.enabled) {
      this.config.cpuOptimization.enabled = false
    }
    
    console.log('[SAFARI-EXT-PERFORMANCE-001] Non-essential features disabled')
  }
  
  /**
   * [SAFARI-EXT-PERFORMANCE-001] Throttle non-essential operations
   */
  throttleNonEssentialOperations() {
    // Increase debounce delays
    this.config.domOptimization.debounceDelay = 100 // 100ms instead of 16ms
    
    // Increase idle callback timeout
    this.config.cpuOptimization.idleCallbackTimeout = 5000 // 5 seconds instead of 1 second
    
    console.log('[SAFARI-EXT-PERFORMANCE-001] Non-essential operations throttled')
  }
  
  /**
   * [SAFARI-EXT-PERFORMANCE-001] Notify performance issue
   */
  notifyPerformanceIssue(type) {
    // Send performance issue notification
    const notification = {
      type: 'performance_issue',
      issueType: type,
      timestamp: Date.now(),
      stats: this.performanceStats
    }
    
    // Send to background script if available
    if (typeof browser !== 'undefined' && browser.runtime) {
      browser.runtime.sendMessage(notification).catch(() => {
        // Ignore errors if background script is not available
      })
    }
    
    console.warn(`[SAFARI-EXT-PERFORMANCE-001] Performance issue detected: ${type}`)
  }
  
  /**
   * [SAFARI-EXT-PERFORMANCE-001] Get performance statistics
   */
  getPerformanceStats() {
    return {
      ...this.performanceStats,
      isSafari: this.isSafari,
      config: this.config,
      memoryMonitor: this.memoryMonitor ? {
        lastCheck: this.memoryMonitor.lastCheck,
        cleanupAttempts: this.memoryMonitor.cleanupAttempts
      } : null
    }
  }
  
  /**
   * [SAFARI-EXT-PERFORMANCE-001] Cleanup performance manager
   */
  cleanup() {
    // Stop memory monitoring
    if (this.memoryMonitor && this.memoryMonitor.interval) {
      clearInterval(this.memoryMonitor.interval)
    }
    
    // Clear all timers
    if (this.domOptimizer) {
      this.domOptimizer.debounceTimers.forEach(timer => clearTimeout(timer))
      this.domOptimizer.debounceTimers.clear()
    }
    
    // Clear optimizations
    if (this.renderingOptimizer) {
      this.renderingOptimizer.optimizedElements.clear()
      this.renderingOptimizer.styleCache.clear()
    }
    
    console.log('[SAFARI-EXT-PERFORMANCE-001] Performance manager cleaned up')
  }
}

// [SAFARI-EXT-PERFORMANCE-001] Export Safari Performance Manager
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SafariPerformanceManager
} else if (typeof window !== 'undefined') {
  window.SafariPerformanceManager = SafariPerformanceManager
} 