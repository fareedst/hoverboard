/**
 * Loading Diagnostics - Extension loading state tracking system
 * [SAFARI-EXT-DEBUG-001] Extension loading diagnostics
 *
 * This module tracks the extension loading process, timing stages, and errors
 * to help debug initialization issues and Safari-specific problems.
 */

import { debugLogger } from './debug-logger.js'

class LoadingDiagnostics {
  constructor () {
    this.startTime = Date.now()
    this.loadingStages = new Map()
    this.errors = []
    this.initialized = false

    // Initialize diagnostics
    this.initializeDiagnostics()
  }

  /**
   * Initialize the diagnostics system
   */
  initializeDiagnostics () {
    this.initialized = true
    debugLogger.info('LOADING_DIAGNOSTICS', 'Loading diagnostics initialized', {
      startTime: this.startTime,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Start tracking a loading stage
   * @param {string} stageName - Name of the loading stage
   * @param {Object} metadata - Optional metadata for the stage
   */
  startStage (stageName, metadata = {}) {
    if (!this.initialized) {
      console.warn('Loading diagnostics not initialized')
      return
    }

    const timestamp = Date.now()
    const stage = {
      name: stageName,
      startTime: timestamp,
      status: 'started',
      metadata
    }

    this.loadingStages.set(stageName, stage)

    debugLogger.info('LOADING', `Starting stage: ${stageName}`, {
      timestamp,
      elapsed: timestamp - this.startTime,
      metadata
    })
  }

  /**
   * Complete a loading stage
   * @param {string} stageName - Name of the loading stage
   * @param {Object} data - Optional completion data
   */
  completeStage (stageName, data = null) {
    if (!this.initialized) {
      console.warn('Loading diagnostics not initialized')
      return
    }

    const timestamp = Date.now()
    const stage = this.loadingStages.get(stageName)

    if (stage) {
      stage.endTime = timestamp
      stage.duration = timestamp - stage.startTime
      stage.status = 'completed'
      stage.data = data

      debugLogger.info('LOADING', `Completed stage: ${stageName}`, {
        duration: stage.duration,
        totalElapsed: timestamp - this.startTime,
        data
      })
    } else {
      debugLogger.warn('LOADING', `Attempted to complete unknown stage: ${stageName}`)
    }
  }

  /**
   * Mark a loading stage as failed
   * @param {string} stageName - Name of the loading stage
   * @param {Error} error - Error that occurred
   */
  errorStage (stageName, error) {
    if (!this.initialized) {
      console.warn('Loading diagnostics not initialized')
      return
    }

    const timestamp = Date.now()
    const stage = this.loadingStages.get(stageName)

    if (stage) {
      stage.endTime = timestamp
      stage.duration = timestamp - stage.startTime
      stage.status = 'error'
      stage.error = error
    }

    const errorRecord = {
      stage: stageName,
      error,
      timestamp,
      message: error.message,
      stack: error.stack
    }

    this.errors.push(errorRecord)

    debugLogger.error('LOADING', `Error in stage: ${stageName}`, {
      error: error.message,
      stack: error.stack,
      elapsed: timestamp - this.startTime
    })
  }

  /**
   * Get current loading status
   * @returns {Object} Current loading status
   */
  getStatus () {
    const now = Date.now()
    const totalElapsed = now - this.startTime
    const stages = Array.from(this.loadingStages.values())

    return {
      totalElapsed,
      stageCount: stages.length,
      completedStages: stages.filter(s => s.status === 'completed').length,
      errorStages: stages.filter(s => s.status === 'error').length,
      inProgressStages: stages.filter(s => s.status === 'started').length,
      hasErrors: this.errors.length > 0
    }
  }

  /**
   * Generate comprehensive loading report
   * @returns {Object} Detailed loading report
   */
  getReport () {
    const totalTime = Date.now() - this.startTime
    const stages = Array.from(this.loadingStages.entries()).map(([name, stage]) => ({
      name,
      ...stage
    }))

    const report = {
      totalTime,
      startTime: this.startTime,
      stages,
      errors: this.errors,
      summary: {
        totalStages: stages.length,
        completedStages: stages.filter(s => s.status === 'completed').length,
        errorStages: stages.filter(s => s.status === 'error').length,
        inProgressStages: stages.filter(s => s.status === 'started').length
      },
      performance: {
        averageStageTime: stages.length > 0
          ? stages.reduce((sum, stage) => sum + (stage.duration || 0), 0) / stages.length
          : 0,
        longestStage: stages.reduce((longest, stage) =>
          (stage.duration || 0) > (longest.duration || 0) ? stage : longest, {}),
        fastestStage: stages.reduce((fastest, stage) =>
          (stage.duration || 0) < (fastest.duration || Infinity) ? stage : fastest, {})
      }
    }

    return report
  }

  /**
   * Get errors only
   * @returns {Array} Array of error records
   */
  getErrors () {
    return this.errors
  }

  /**
   * Check if loading is complete (all stages completed or errored)
   * @returns {boolean} True if loading is complete
   */
  isLoadingComplete () {
    const stages = Array.from(this.loadingStages.values())
    return stages.length > 0 && stages.every(stage =>
      stage.status === 'completed' || stage.status === 'error'
    )
  }

  /**
   * Get loading stage by name
   * @param {string} stageName - Name of the stage
   * @returns {Object|null} Stage object or null if not found
   */
  getStage (stageName) {
    return this.loadingStages.get(stageName) || null
  }

  /**
   * Clear all diagnostics data
   */
  reset () {
    this.loadingStages.clear()
    this.errors = []
    this.startTime = Date.now()

    debugLogger.info('LOADING_DIAGNOSTICS', 'Loading diagnostics reset')
  }

  /**
   * Export diagnostics data for analysis
   * @returns {Object} Exportable diagnostics data
   */
  export () {
    return {
      report: this.getReport(),
      status: this.getStatus(),
      errors: this.getErrors(),
      exportTime: Date.now(),
      version: '1.0.0'
    }
  }

  /**
   * Log current status to console
   */
  logStatus () {
    const status = this.getStatus()
    const report = this.getReport()

    debugLogger.info('LOADING_DIAGNOSTICS', 'Current loading status', status)

    if (report.errors.length > 0) {
      debugLogger.error('LOADING_DIAGNOSTICS', 'Loading errors detected', {
        errorCount: report.errors.length,
        errors: report.errors.map(e => ({
          stage: e.stage,
          message: e.message
        }))
      })
    }
  }
}

// Create singleton instance
export const loadingDiagnostics = new LoadingDiagnostics()

// Log initial state
loadingDiagnostics.startStage('diagnostics-init', {
  userAgent: navigator.userAgent,
  url: window.location.href,
  timestamp: new Date().toISOString()
})

loadingDiagnostics.completeStage('diagnostics-init')
