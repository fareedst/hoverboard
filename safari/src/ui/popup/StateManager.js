/**
 * StateManager - Manages application state for the popup
 */

export class StateManager {
  constructor () {
    this.state = {
      currentTab: null,
      currentPin: null,
      url: '',
      title: '',
      tags: [],
      isPrivate: false,
      isConnected: false,
      isLoading: false,
      searchHistory: [],
      preferences: {}
    }

    this.listeners = new Map()
    this.stateHistory = []
    this.maxHistorySize = 50

    // Load persisted state
    this.loadPersistedState()
  }

  /**
   * Get current state or specific property
   */
  getState (property = null) {
    if (property) {
      return this.state[property]
    }
    return { ...this.state }
  }

  /**
   * Set state with partial updates
   */
  setState (updates) {
    const previousState = { ...this.state }

    // Merge updates into current state
    this.state = {
      ...this.state,
      ...updates
    }

    // Add to history
    this.addToHistory(previousState)

    // Notify listeners
    this.notifyListeners(updates, previousState)

    // Persist certain state changes
    this.persistState()
  }

  /**
   * Subscribe to state changes
   */
  subscribe (listener, properties = null) {
    const id = Date.now() + Math.random()

    this.listeners.set(id, {
      callback: listener,
      properties: properties ? (Array.isArray(properties) ? properties : [properties]) : null
    })

    return () => this.listeners.delete(id)
  }

  /**
   * Notify all listeners of state changes
   */
  notifyListeners (updates, previousState) {
    this.listeners.forEach(({ callback, properties }) => {
      // If specific properties are specified, only notify if those changed
      if (properties) {
        const hasRelevantChanges = properties.some(prop =>
          Object.prototype.hasOwnProperty.call(updates, prop) && updates[prop] !== previousState[prop]
        )

        if (!hasRelevantChanges) return
      }

      try {
        callback(this.state, updates, previousState)
      } catch (error) {
        console.error('Error in state listener:', error)
      }
    })
  }

  /**
   * Add state to history for undo functionality
   */
  addToHistory (state) {
    this.stateHistory.push({
      state: { ...state },
      timestamp: Date.now()
    })

    // Limit history size
    if (this.stateHistory.length > this.maxHistorySize) {
      this.stateHistory.shift()
    }
  }

  /**
   * Undo last state change
   */
  undo () {
    if (this.stateHistory.length > 0) {
      const previousState = this.stateHistory.pop()
      this.state = { ...previousState.state }
      this.notifyListeners(this.state, {})
      return true
    }
    return false
  }

  /**
   * Reset state to initial values
   */
  reset () {
    const initialState = {
      currentTab: null,
      currentPin: null,
      url: '',
      title: '',
      tags: [],
      isPrivate: false,
      isConnected: false,
      isLoading: false,
      searchHistory: this.state.searchHistory, // Preserve search history
      preferences: this.state.preferences // Preserve preferences
    }

    this.setState(initialState)
  }

  /**
   * Update current tab information
   */
  updateTab (tabInfo) {
    this.setState({
      currentTab: tabInfo,
      url: tabInfo?.url || '',
      title: tabInfo?.title || ''
    })
  }

  /**
   * Update current pin/bookmark information
   */
  updatePin (pinInfo) {
    const tags = pinInfo?.tags
      ? (Array.isArray(pinInfo.tags) ? pinInfo.tags : pinInfo.tags.split(' ').filter(tag => tag.length > 0))
      : []

    this.setState({
      currentPin: pinInfo,
      tags,
      isPrivate: pinInfo?.shared === 'no'
    })
  }

  /**
   * Add to search history
   */
  addToSearchHistory (searchTerm) {
    if (!searchTerm || searchTerm.trim().length === 0) return

    const trimmedTerm = searchTerm.trim()
    const currentHistory = this.state.searchHistory

    // Remove if already exists
    const filteredHistory = currentHistory.filter(term => term !== trimmedTerm)

    // Add to beginning
    const newHistory = [trimmedTerm, ...filteredHistory].slice(0, 10) // Keep only 10 items

    this.setState({
      searchHistory: newHistory
    })
  }

  /**
   * Update user preferences
   */
  updatePreferences (preferences) {
    this.setState({
      preferences: {
        ...this.state.preferences,
        ...preferences
      }
    })
  }

  /**
   * Set loading state
   */
  setLoading (isLoading) {
    this.setState({ isLoading })
  }

  /**
   * Set connection status
   */
  setConnected (isConnected) {
    this.setState({ isConnected })
  }

  /**
   * Load persisted state from storage
   */
  async loadPersistedState () {
    try {
      const result = await chrome.storage.local.get(['popupState'])

      if (result.popupState) {
        const persistedState = result.popupState

        // Only restore certain properties
        this.setState({
          searchHistory: persistedState.searchHistory || [],
          preferences: persistedState.preferences || {}
        })
      }
    } catch (error) {
      console.warn('Failed to load persisted state:', error)
    }
  }

  /**
   * Persist state to storage
   */
  async persistState () {
    try {
      const stateToPersist = {
        searchHistory: this.state.searchHistory,
        preferences: this.state.preferences,
        timestamp: Date.now()
      }

      await chrome.storage.local.set({
        popupState: stateToPersist
      })
    } catch (error) {
      console.warn('Failed to persist state:', error)
    }
  }

  /**
   * Compute derived state values
   */
  getDerivedState () {
    return {
      hasBookmark: !!this.state.currentPin,
      tagCount: this.state.tags.length,
      isValidUrl: this.isValidUrl(this.state.url),
      canSave: this.state.url && this.state.title,
      isEmpty: !this.state.currentPin && this.state.tags.length === 0
    }
  }

  /**
   * Validate URL
   */
  isValidUrl (url) {
    try {
      // eslint-disable-next-line no-new
      new URL(url)
      return url.startsWith('http://') || url.startsWith('https://')
    } catch {
      return false
    }
  }

  /**
   * Get state summary for debugging
   */
  getStateSummary () {
    return {
      hasTab: !!this.state.currentTab,
      hasPin: !!this.state.currentPin,
      tagCount: this.state.tags.length,
      isPrivate: this.state.isPrivate,
      isConnected: this.state.isConnected,
      isLoading: this.state.isLoading,
      url: this.state.url ? this.state.url.substring(0, 50) + '...' : '',
      derived: this.getDerivedState()
    }
  }

  /**
   * Export state for backup
   */
  exportState () {
    return {
      ...this.state,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    }
  }

  /**
   * Import state from backup
   */
  importState (importedState) {
    if (!importedState || typeof importedState !== 'object') {
      throw new Error('Invalid state format')
    }

    // Validate and sanitize imported state
    const safeState = {
      searchHistory: Array.isArray(importedState.searchHistory) ? importedState.searchHistory : [],
      preferences: typeof importedState.preferences === 'object' ? importedState.preferences : {}
    }

    this.setState(safeState)
  }

  /**
   * Clear all persisted data
   */
  async clearPersistedState () {
    try {
      await chrome.storage.local.remove(['popupState'])
      this.setState({
        searchHistory: [],
        preferences: {}
      })
    } catch (error) {
      console.warn('Failed to clear persisted state:', error)
    }
  }

  /**
   * Cleanup state manager
   */
  cleanup () {
    this.listeners.clear()
    this.stateHistory = []
  }
}
