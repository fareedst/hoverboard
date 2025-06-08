/**
 * PopupController - Main business logic controller for the popup
 */

export class PopupController {
  constructor({ uiManager, stateManager, errorHandler }) {
    this.uiManager = uiManager;
    this.stateManager = stateManager;
    this.errorHandler = errorHandler;
    
    this.currentTab = null;
    this.currentPin = null;
    this.isLoading = false;
    
    // Bind methods
    this.loadInitialData = this.loadInitialData.bind(this);
    this.handleShowHoverboard = this.handleShowHoverboard.bind(this);
    this.handleTogglePrivate = this.handleTogglePrivate.bind(this);
    this.handleReadLater = this.handleReadLater.bind(this);
    this.handleAddTag = this.handleAddTag.bind(this);
    this.handleRemoveTag = this.handleRemoveTag.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
    this.handleDeletePin = this.handleDeletePin.bind(this);
    this.handleReloadExtension = this.handleReloadExtension.bind(this);
    this.handleOpenOptions = this.handleOpenOptions.bind(this);
    
    this.setupEventListeners();
  }

  /**
   * Setup event listeners for popup actions
   */
  setupEventListeners() {
    // Action buttons
    this.uiManager.on('showHoverboard', this.handleShowHoverboard);
    this.uiManager.on('togglePrivate', this.handleTogglePrivate);
    this.uiManager.on('readLater', this.handleReadLater);
    this.uiManager.on('addTag', this.handleAddTag);
    this.uiManager.on('removeTag', this.handleRemoveTag);
    this.uiManager.on('search', this.handleSearch);
    this.uiManager.on('deletePin', this.handleDeletePin);
    this.uiManager.on('reloadExtension', this.handleReloadExtension);
    this.uiManager.on('openOptions', this.handleOpenOptions);
  }

  /**
   * Load initial data when popup opens
   */
  async loadInitialData() {
    try {
      this.setLoading(true);
      
      // Get current tab information
      this.currentTab = await this.getCurrentTab();
      if (!this.currentTab) {
        throw new Error('Unable to get current tab information');
      }
      
      // Update state with tab info
      this.stateManager.setState({
        currentTab: this.currentTab,
        url: this.currentTab.url,
        title: this.currentTab.title
      });
      
      // Get bookmark data for current URL
      this.currentPin = await this.getBookmarkData(this.currentTab.url);
      this.stateManager.setState({ currentPin: this.currentPin });
      
      // Update UI with loaded data
      this.uiManager.updateCurrentTags(this.currentPin?.tags || []);
      this.uiManager.updateConnectionStatus(true);
      this.uiManager.updatePrivateStatus(this.currentPin?.private === 'yes');
      
      // Set version info
      const manifest = chrome.runtime.getManifest();
      this.uiManager.updateVersionInfo(manifest.version);
      
    } catch (error) {
      this.errorHandler.handleError('Failed to load initial data', error);
      this.uiManager.updateConnectionStatus(false);
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Get current active tab
   */
  async getCurrentTab() {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        
        if (tabs && tabs.length > 0) {
          resolve(tabs[0]);
        } else {
          reject(new Error('No active tab found'));
        }
      });
    });
  }

  /**
   * Get bookmark data for a URL
   */
  async getBookmarkData(url) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { 
          action: 'readPin',
          url: url 
        },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          
          resolve(response);
        }
      );
    });
  }

  /**
   * Send message to background script
   */
  async sendMessage(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        
        resolve(response);
      });
    });
  }

  /**
   * Send message to content script in current tab
   */
  async sendToTab(message) {
    if (!this.currentTab) {
      throw new Error('No current tab available');
    }
    
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(this.currentTab.id, message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        
        resolve(response);
      });
    });
  }

  /**
   * Set loading state
   */
  setLoading(isLoading) {
    this.isLoading = isLoading;
    this.uiManager.setLoading(isLoading);
  }

  /**
   * Handle show/hide hoverboard action
   */
  async handleShowHoverboard() {
    try {
      await this.sendToTab({ message: 'toggleHover' });
      this.closePopup();
    } catch (error) {
      this.errorHandler.handleError('Failed to toggle hoverboard', error);
    }
  }

  /**
   * Handle toggle private status
   */
  async handleTogglePrivate() {
    if (!this.currentPin) {
      this.errorHandler.handleError('No bookmark found for this page');
      return;
    }

    try {
      this.setLoading(true);
      
      const isPrivate = this.currentPin.private === 'yes';
      const newPrivateStatus = isPrivate ? 'no' : 'yes';
      
      const updatedPin = {
        ...this.currentPin,
        private: newPrivateStatus,
        action: 'savePin'
      };
      
      const response = await this.sendMessage(updatedPin);
      
      if (response && response.success) {
        this.currentPin.private = newPrivateStatus;
        this.stateManager.setState({ currentPin: this.currentPin });
        this.uiManager.updatePrivateStatus(newPrivateStatus === 'yes');
        this.uiManager.showSuccess('Privacy setting updated');
      } else {
        throw new Error(response?.error || 'Failed to update privacy setting');
      }
      
    } catch (error) {
      this.errorHandler.handleError('Failed to toggle private status', error);
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Handle read later action
   */
  async handleReadLater() {
    try {
      this.setLoading(true);
      
      const readLaterTag = 'to-read';
      
      if (this.currentPin) {
        // Add to-read tag to existing bookmark
        const currentTags = this.currentPin.tags || '';
        const tagsArray = currentTags.split(' ').filter(tag => tag.length > 0);
        
        if (!tagsArray.includes(readLaterTag)) {
          tagsArray.push(readLaterTag);
          await this.addTagsToBookmark(tagsArray);
        } else {
          this.uiManager.showInfo('Already marked as read later');
        }
      } else {
        // Create new bookmark with to-read tag
        await this.createBookmark([readLaterTag]);
      }
      
    } catch (error) {
      this.errorHandler.handleError('Failed to add to read later', error);
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Handle add tag action
   */
  async handleAddTag(tagText) {
    if (!tagText || !tagText.trim()) {
      this.errorHandler.handleError('Please enter a tag');
      return;
    }

    try {
      this.setLoading(true);
      
      const newTags = tagText.trim().split(/\s+/).filter(tag => tag.length > 0);
      
      if (this.currentPin) {
        // Add tags to existing bookmark
        const currentTags = this.currentPin.tags || '';
        const currentTagsArray = currentTags.split(' ').filter(tag => tag.length > 0);
        const allTags = [...new Set([...currentTagsArray, ...newTags])];
        
        await this.addTagsToBookmark(allTags);
      } else {
        // Create new bookmark with tags
        await this.createBookmark(newTags);
      }
      
      // Clear the input
      this.uiManager.clearTagInput();
      
    } catch (error) {
      this.errorHandler.handleError('Failed to add tags', error);
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Handle remove tag action
   */
  async handleRemoveTag(tagToRemove) {
    if (!this.currentPin) {
      this.errorHandler.handleError('No bookmark found');
      return;
    }

    try {
      this.setLoading(true);
      
      const currentTags = this.currentPin.tags || '';
      const tagsArray = currentTags.split(' ').filter(tag => tag.length > 0 && tag !== tagToRemove);
      
      await this.addTagsToBookmark(tagsArray);
      
    } catch (error) {
      this.errorHandler.handleError('Failed to remove tag', error);
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Add tags to bookmark
   */
  async addTagsToBookmark(tags) {
    const tagsString = tags.join(' ');
    
    const pinData = {
      ...this.currentPin,
      tags: tagsString,
      action: 'saveTag',
      description: this.getBetterDescription(this.currentPin?.description, this.currentTab?.title)
    };
    
    const response = await this.sendMessage(pinData);
    
    if (response && response.success) {
      this.currentPin.tags = tagsString;
      this.stateManager.setState({ currentPin: this.currentPin });
      this.uiManager.updateCurrentTags(tags);
      this.uiManager.showSuccess('Tags updated successfully');
    } else {
      throw new Error(response?.error || 'Failed to update tags');
    }
  }

  /**
   * Create new bookmark
   */
  async createBookmark(tags) {
    const tagsString = tags.join(' ');
    
    const pinData = {
      url: this.currentTab.url,
      description: this.currentTab.title,
      tags: tagsString,
      private: 'no',
      action: 'savePin'
    };
    
    const response = await this.sendMessage(pinData);
    
    if (response && response.success) {
      this.currentPin = pinData;
      this.stateManager.setState({ currentPin: this.currentPin });
      this.uiManager.updateCurrentTags(tags);
      this.uiManager.showSuccess('Bookmark created successfully');
    } else {
      throw new Error(response?.error || 'Failed to create bookmark');
    }
  }

  /**
   * Handle search action
   */
  async handleSearch(searchText) {
    if (!searchText || !searchText.trim()) {
      this.errorHandler.handleError('Please enter search terms');
      return;
    }

    try {
      this.setLoading(true);
      
      const response = await this.sendMessage({
        action: 'searchTitleText',
        searchText: searchText.trim()
      });
      
      if (response && response.success) {
        this.uiManager.showSuccess('Search completed');
        // Could potentially show search results in a separate view
      } else {
        throw new Error(response?.error || 'Search failed');
      }
      
    } catch (error) {
      this.errorHandler.handleError('Failed to search', error);
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Handle delete bookmark action
   */
  async handleDeletePin() {
    if (!this.currentPin) {
      this.errorHandler.handleError('No bookmark found to delete');
      return;
    }

    // Confirm deletion
    if (!confirm('Are you sure you want to delete this bookmark?')) {
      return;
    }

    try {
      this.setLoading(true);
      
      const response = await this.sendMessage({
        action: 'deletePin',
        url: this.currentPin.url
      });
      
      if (response && response.success) {
        this.currentPin = null;
        this.stateManager.setState({ currentPin: null });
        this.uiManager.updateCurrentTags([]);
        this.uiManager.updatePrivateStatus(false);
        this.uiManager.showSuccess('Bookmark deleted');
        
        // Refresh hover data
        await this.sendToTab({ message: 'refreshData' });
        
        this.closePopup();
      } else {
        throw new Error(response?.error || 'Failed to delete bookmark');
      }
      
    } catch (error) {
      this.errorHandler.handleError('Failed to delete bookmark', error);
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Handle reload extension action
   */
  async handleReloadExtension() {
    try {
      await this.sendMessage({ action: 'reloadExtension' });
      this.closePopup();
    } catch (error) {
      this.errorHandler.handleError('Failed to reload extension', error);
    }
  }

  /**
   * Handle open options action
   */
  async handleOpenOptions() {
    try {
      chrome.runtime.openOptionsPage();
      this.closePopup();
    } catch (error) {
      this.errorHandler.handleError('Failed to open options', error);
    }
  }

  /**
   * Get better description for bookmark
   */
  getBetterDescription(currentDescription, pageTitle) {
    if (currentDescription && currentDescription.trim()) {
      return currentDescription;
    }
    return pageTitle || 'Untitled';
  }

  /**
   * Close the popup
   */
  closePopup() {
    setTimeout(() => window.close(), 100);
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    // Remove event listeners if needed
    this.uiManager?.off('showHoverboard', this.handleShowHoverboard);
    this.uiManager?.off('togglePrivate', this.handleTogglePrivate);
    this.uiManager?.off('readLater', this.handleReadLater);
    this.uiManager?.off('addTag', this.handleAddTag);
    this.uiManager?.off('removeTag', this.handleRemoveTag);
    this.uiManager?.off('search', this.handleSearch);
    this.uiManager?.off('deletePin', this.handleDeletePin);
    this.uiManager?.off('reloadExtension', this.handleReloadExtension);
    this.uiManager?.off('openOptions', this.handleOpenOptions);
  }
} 