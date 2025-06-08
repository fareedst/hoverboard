/**
 * Pinboard Service - Modern API integration for Pinboard bookmarking service
 * Replaces legacy Pb class with Promise-based, error-handled architecture
 */

import { ConfigManager } from '../../config/config-manager.js';

export class PinboardService {
  constructor() {
    this.configManager = new ConfigManager();
    this.apiBase = 'https://api.pinboard.in/v1/';
    this.retryDelays = [1000, 2000, 5000]; // Progressive retry delays
  }

  /**
   * Get bookmark data for a specific URL
   * @param {string} url - URL to lookup
   * @param {string} title - Page title (fallback for description)
   * @returns {Promise<Object>} Bookmark data
   */
  async getBookmarkForUrl(url, title = '') {
    try {
      const cleanUrl = this.cleanUrl(url);
      const endpoint = `posts/get?url=${encodeURIComponent(cleanUrl)}`;
      const response = await this.makeApiRequest(endpoint);
      
      return this.parseBookmarkResponse(response, cleanUrl, title);
    } catch (error) {
      console.error('Failed to get bookmark for URL:', error);
      return this.createEmptyBookmark(url, title);
    }
  }

  /**
   * Get recent bookmarks from Pinboard
   * @param {number} count - Number of recent bookmarks to fetch
   * @returns {Promise<Object[]>} Array of recent bookmarks
   */
  async getRecentBookmarks(count = 15) {
    try {
      const endpoint = `posts/recent?count=${count}`;
      const response = await this.makeApiRequest(endpoint);
      
      return this.parseRecentBookmarksResponse(response);
    } catch (error) {
      console.error('Failed to get recent bookmarks:', error);
      return [];
    }
  }

  /**
   * Save a bookmark to Pinboard
   * @param {Object} bookmarkData - Bookmark data to save
   * @returns {Promise<Object>} Save result
   */
  async saveBookmark(bookmarkData) {
    try {
      const params = this.buildSaveParams(bookmarkData);
      const endpoint = `posts/add?${params}`;
      const response = await this.makeApiRequest(endpoint, 'GET');
      
      return this.parseApiResponse(response);
    } catch (error) {
      console.error('Failed to save bookmark:', error);
      throw error;
    }
  }

  /**
   * Save a tag to an existing bookmark
   * @param {Object} tagData - Tag data to save
   * @returns {Promise<Object>} Save result
   */
  async saveTag(tagData) {
    try {
      // Get current bookmark data
      const currentBookmark = await this.getBookmarkForUrl(tagData.url);
      
      // Add new tag to existing tags
      const existingTags = currentBookmark.tags || [];
      const newTags = [...existingTags];
      
      if (tagData.value && !existingTags.includes(tagData.value)) {
        newTags.push(tagData.value);
      }

      // Save updated bookmark
      const updatedBookmark = {
        ...currentBookmark,
        ...tagData,
        tags: newTags.join(' ')
      };

      return this.saveBookmark(updatedBookmark);
    } catch (error) {
      console.error('Failed to save tag:', error);
      throw error;
    }
  }

  /**
   * Delete a bookmark from Pinboard
   * @param {string} url - URL of bookmark to delete
   * @returns {Promise<Object>} Delete result
   */
  async deleteBookmark(url) {
    try {
      const cleanUrl = this.cleanUrl(url);
      const endpoint = `posts/delete?url=${encodeURIComponent(cleanUrl)}`;
      const response = await this.makeApiRequest(endpoint);
      
      return this.parseApiResponse(response);
    } catch (error) {
      console.error('Failed to delete bookmark:', error);
      throw error;
    }
  }

  /**
   * Remove a specific tag from a bookmark
   * @param {Object} tagData - Tag removal data
   * @returns {Promise<Object>} Update result
   */
  async deleteTag(tagData) {
    try {
      // Get current bookmark data
      const currentBookmark = await this.getBookmarkForUrl(tagData.url);
      
      // Remove specified tag from existing tags
      const existingTags = currentBookmark.tags || [];
      const filteredTags = existingTags.filter(tag => tag !== tagData.value);

      // Save updated bookmark
      const updatedBookmark = {
        ...currentBookmark,
        ...tagData,
        tags: filteredTags.join(' ')
      };

      return this.saveBookmark(updatedBookmark);
    } catch (error) {
      console.error('Failed to delete tag:', error);
      throw error;
    }
  }

  /**
   * Make API request with authentication and retry logic
   * @param {string} endpoint - API endpoint
   * @param {string} method - HTTP method
   * @returns {Promise<Document>} Parsed XML response
   */
  async makeApiRequest(endpoint, method = 'GET') {
    const hasAuth = await this.configManager.hasAuthToken();
    if (!hasAuth) {
      throw new Error('No authentication token configured');
    }

    const authParam = await this.configManager.getAuthTokenParam();
    const url = `${this.apiBase}${endpoint}&${authParam}`;

    return this.makeRequestWithRetry(url, method);
  }

  /**
   * Make HTTP request with retry logic for rate limiting
   * @param {string} url - Request URL
   * @param {string} method - HTTP method
   * @param {number} retryCount - Current retry attempt
   * @returns {Promise<Document>} Response
   */
  async makeRequestWithRetry(url, method = 'GET', retryCount = 0) {
    const config = await this.configManager.getConfig();
    
    try {
      const response = await fetch(url, { method });
      
      if (response.status === 429) {
        // Rate limited - implement retry with exponential backoff
        if (retryCount < config.pinRetryCountMax) {
          const delay = this.retryDelays[retryCount] || 5000;
          console.log(`Rate limited, retrying after ${delay}ms (attempt ${retryCount + 1})`);
          
          await this.sleep(delay);
          return this.makeRequestWithRetry(url, method, retryCount + 1);
        } else {
          throw new Error('Rate limit exceeded, max retries reached');
        }
      }
      
      if (response.status === 401) {
        throw new Error('Authentication failed - check API token');
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseText = await response.text();
      return this.parseXmlResponse(responseText);
    } catch (error) {
      if (retryCount < config.pinRetryCountMax && this.isRetryableError(error)) {
        const delay = this.retryDelays[retryCount] || 5000;
        console.log(`Request failed, retrying after ${delay}ms:`, error.message);
        
        await this.sleep(delay);
        return this.makeRequestWithRetry(url, method, retryCount + 1);
      }
      
      throw error;
    }
  }

  /**
   * Parse XML response from Pinboard API
   * @param {string} xmlText - XML response text
   * @returns {Document} Parsed XML document
   */
  parseXmlResponse(xmlText) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    // Check for parsing errors
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
      throw new Error('Failed to parse XML response');
    }
    
    return xmlDoc;
  }

  /**
   * Parse bookmark response from Pinboard API
   * @param {Document} xmlDoc - XML document
   * @param {string} url - Original URL
   * @param {string} title - Page title
   * @returns {Object} Bookmark data
   */
  parseBookmarkResponse(xmlDoc, url, title) {
    const posts = xmlDoc.getElementsByTagName('post');
    
    if (posts.length === 0) {
      return this.createEmptyBookmark(url, title);
    }

    const post = posts[0];
    const tags = post.getAttribute('tag') || '';
    
    return {
      description: post.getAttribute('description') || title,
      hash: post.getAttribute('hash') || '',
      time: post.getAttribute('time') || '',
      extended: post.getAttribute('extended') || '',
      tag: tags,
      tags: tags ? tags.split(' ') : [],
      shared: post.getAttribute('shared') || 'yes',
      toread: post.getAttribute('toread') || 'no',
      url: post.getAttribute('href') || url
    };
  }

  /**
   * Parse recent bookmarks response
   * @param {Document} xmlDoc - XML document
   * @returns {Object[]} Array of bookmark objects
   */
  parseRecentBookmarksResponse(xmlDoc) {
    const posts = xmlDoc.getElementsByTagName('post');
    const bookmarks = [];

    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      const tags = post.getAttribute('tag') || '';
      
      bookmarks.push({
        description: post.getAttribute('description') || '',
        hash: post.getAttribute('hash') || '',
        time: post.getAttribute('time') || '',
        extended: post.getAttribute('extended') || '',
        tag: tags,
        tags: tags ? tags.split(' ') : [],
        shared: post.getAttribute('shared') || 'yes',
        toread: post.getAttribute('toread') || 'no',
        url: post.getAttribute('href') || ''
      });
    }

    return bookmarks;
  }

  /**
   * Parse generic API response
   * @param {Document} xmlDoc - XML document
   * @returns {Object} Response data
   */
  parseApiResponse(xmlDoc) {
    const result = xmlDoc.getElementsByTagName('result')[0];
    if (result) {
      return {
        code: result.getAttribute('code'),
        message: result.textContent
      };
    }
    return { success: true };
  }

  /**
   * Create empty bookmark object
   * @param {string} url - URL
   * @param {string} title - Title
   * @returns {Object} Empty bookmark
   */
  createEmptyBookmark(url, title) {
    return {
      description: title || '',
      hash: '',
      time: '',
      extended: '',
      tag: '',
      tags: [],
      shared: 'yes',
      toread: 'no',
      url: url
    };
  }

  /**
   * Build URL parameters for saving bookmark
   * @param {Object} bookmarkData - Bookmark data
   * @returns {string} URL parameters
   */
  buildSaveParams(bookmarkData) {
    const params = new URLSearchParams();
    
    params.set('replace', 'yes');
    params.set('url', bookmarkData.url);
    
    if (bookmarkData.description) {
      params.set('description', bookmarkData.description);
    }
    
    if (bookmarkData.tags) {
      const tagsString = Array.isArray(bookmarkData.tags) 
        ? bookmarkData.tags.join(' ')
        : bookmarkData.tags;
      params.set('tags', tagsString);
    }
    
    if (bookmarkData.extended) {
      params.set('extended', bookmarkData.extended);
    }
    
    if (bookmarkData.shared !== undefined) {
      params.set('shared', bookmarkData.shared);
    }
    
    if (bookmarkData.toread !== undefined) {
      params.set('toread', bookmarkData.toread);
    }
    
    if (bookmarkData.time) {
      params.set('dt', bookmarkData.time);
    }

    return params.toString();
  }

  /**
   * Clean URL for Pinboard API (remove hash if configured)
   * @param {string} url - URL to clean
   * @returns {string} Cleaned URL
   */
  cleanUrl(url) {
    // TODO: Implement uxUrlStripHash logic from config
    return url;
  }

  /**
   * Check if error is retryable
   * @param {Error} error - Error to check
   * @returns {boolean} Whether error is retryable
   */
  isRetryableError(error) {
    return error.name === 'TypeError' || // Network errors
           error.message.includes('fetch');
  }

  /**
   * Sleep for specified milliseconds
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise} Promise that resolves after delay
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
} 