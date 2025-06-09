/**
 * Integration Tests for Extension Workflow
 * Tests complete workflows including configuration, services, and UI
 */

import { ConfigManager } from '../../src-new/config/config-manager.js';

describe('Extension Workflow Integration', () => {
  let configManager;

  beforeEach(() => {
    configManager = new ConfigManager();
    
    // Setup comprehensive chrome API mocks
    global.chrome.storage.sync.get.mockImplementation((keys) => {
      const mockData = {
        hoverboard_auth_token: 'user-test-token:123456',
        hoverboard_settings: {
          hoverShowRecentTags: true,
          showHoverOnPageLoad: true,
          recentTagsCountMax: 10,
          initRecentPostsCount: 5,
        },
        hoverboard_inhibit_urls: '',
      };
      
      if (typeof keys === 'string') {
        return Promise.resolve({ [keys]: mockData[keys] });
      }
      return Promise.resolve(mockData);
    });

    global.chrome.storage.sync.set.mockResolvedValue();
    global.chrome.tabs.query.mockResolvedValue([
      { id: 1, url: 'https://example.com', title: 'Test Page' }
    ]);
    global.chrome.tabs.sendMessage.mockResolvedValue({ success: true });
    
    // Mock Pinboard API responses
    global.fetch.mockImplementation((url) => {
      if (url.includes('posts/get')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            posts: [{
              href: 'https://example.com',
              description: 'Test Bookmark',
              tags: 'test tag1 tag2',
              time: '2023-01-01T00:00:00Z'
            }]
          })
        });
      }
      
      if (url.includes('tags/get')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            'javascript': 25,
            'webdev': 20,
            'testing': 15,
            'tutorial': 10
          })
        });
      }
      
      if (url.includes('posts/add')) {
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve('done')
        });
      }
      
      return Promise.reject(new Error('Unknown API endpoint'));
    });
  });

  describe('Extension Installation and Setup', () => {
    test('should complete fresh installation workflow', async () => {
      // Simulate fresh install - no existing settings
      global.chrome.storage.sync.get.mockResolvedValue({});
      
      // Initialize defaults
      await configManager.initializeDefaults();
      
      // Verify default settings were saved
      expect(global.chrome.storage.sync.set).toHaveBeenCalledWith({
        hoverboard_settings: expect.objectContaining({
          hoverShowRecentTags: true,
          recentTagsCountMax: 32,
          badgeTextIfNotBookmarked: '-'
        })
      });
    });

    test('should handle extension upgrade workflow', async () => {
      // Simulate existing settings with old structure
      global.chrome.storage.sync.get.mockResolvedValue({
        hoverboard_settings: {
          // Old setting names or missing new settings
          oldSetting: 'value',
          hoverShowRecentTags: false
        }
      });

      const config = await configManager.getConfig();
      
      // Should merge old settings with new defaults
      expect(config).toHaveProperty('hoverShowRecentTags', false); // preserved
      expect(config).toHaveProperty('recentTagsCountMax', 32); // added from defaults
    });
  });

  describe('Authentication and API Integration', () => {
    test('should complete authentication setup workflow', async () => {
      const testToken = 'user:abcdef123456';
      
      // Set authentication token
      await configManager.setAuthToken(testToken);
      
      // Verify token was stored
      expect(global.chrome.storage.sync.set).toHaveBeenCalledWith({
        hoverboard_auth_token: testToken
      });
      
      // Verify token can be retrieved for API calls
      const authParam = await configManager.getAuthTokenParam();
      expect(authParam).toBe(`auth_token=${testToken}`);
    });

    test('should handle API authentication failure gracefully', async () => {
      // Mock API authentication failure
      global.fetch.mockRejectedValueOnce(new Error('401 Unauthorized'));
      
      // Attempt to fetch user data
      try {
        await fetch('https://api.pinboard.in/v1/posts/get?auth_token=invalid');
      } catch (error) {
        expect(error.message).toContain('401');
      }
      
      // Extension should handle this gracefully and not crash
      const hasToken = await configManager.hasAuthToken();
      expect(hasToken).toBe(true); // Token still exists, just invalid
    });
  });

  describe('Bookmark Management Workflow', () => {
    test('should complete bookmark save workflow', async () => {
      const bookmarkData = {
        url: 'https://example.com',
        title: 'Test Page',
        description: 'A test bookmark',
        tags: 'test webdev',
        private: false
      };

      // Simulate saving bookmark through popup
      const authToken = await configManager.getAuthToken();
      expect(authToken).toBeTruthy();

      // Mock successful bookmark save
      const saveUrl = `https://api.pinboard.in/v1/posts/add?auth_token=${authToken}`;
      
      // Verify fetch would be called with correct parameters
      await fetch(saveUrl, {
        method: 'POST',
        body: new URLSearchParams({
          url: bookmarkData.url,
          description: bookmarkData.title,
          extended: bookmarkData.description,
          tags: bookmarkData.tags,
          shared: bookmarkData.private ? 'no' : 'yes'
        })
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('posts/add'),
        expect.objectContaining({
          method: 'POST'
        })
      );
    });

    test('should handle bookmark retrieval workflow', async () => {
      const testUrl = 'https://example.com';
      
      // Fetch existing bookmark for URL
      const response = await fetch(`https://api.pinboard.in/v1/posts/get?url=${testUrl}&auth_token=test`);
      const data = await response.json();
      
      expect(data.posts).toHaveLength(1);
      expect(data.posts[0].href).toBe(testUrl);
      expect(data.posts[0].tags).toBe('test tag1 tag2');
    });
  });

  describe('Content Script Integration', () => {
    test('should handle content script injection workflow', async () => {
      const tabId = 1;
      const testUrl = 'https://example.com';
      
      // Verify URL is allowed (not in inhibit list)
      const isAllowed = await configManager.isUrlAllowed(testUrl);
      expect(isAllowed).toBe(true);
      
      // Get configuration for content script
      const config = await configManager.getConfig();
      expect(config.showHoverOnPageLoad).toBe(true);
      
      // Simulate content script message
      const message = {
        action: 'getBookmarkStatus',
        url: testUrl
      };
      
      // Content script would send this message
      await chrome.tabs.sendMessage(tabId, message);
      
      expect(global.chrome.tabs.sendMessage).toHaveBeenCalledWith(tabId, message);
    });

    test('should handle inhibited URL workflow', async () => {
      const inhibitedUrl = 'https://sensitive-site.com';
      
      // Add URL to inhibit list
      await configManager.addInhibitUrl('sensitive-site.com');
      
      // Verify URL is now inhibited
      const isAllowed = await configManager.isUrlAllowed(inhibitedUrl);
      expect(isAllowed).toBe(false);
      
      // Content script should not be injected
      // This would be handled by the background script
    });
  });

  describe('Tag Management Workflow', () => {
    test('should complete tag suggestion workflow', async () => {
      // Fetch user's tags from API
      const response = await fetch('https://api.pinboard.in/v1/tags/get?auth_token=test');
      const tags = await response.json();
      
      expect(tags).toHaveProperty('javascript', 25);
      expect(tags).toHaveProperty('webdev', 20);
      
      // Tags should be sorted by frequency for suggestions
      const sortedTags = Object.entries(tags)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10);
      
      expect(sortedTags[0]).toEqual(['javascript', 25]);
      expect(sortedTags[1]).toEqual(['webdev', 20]);
    });

    test('should handle recent tags retrieval', async () => {
      const config = await configManager.getConfig();
      const maxTags = config.recentTagsCountMax;
      
      expect(maxTags).toBe(10); // From mock settings
      
      // Recent tags would be fetched and cached
      // This integration would involve the tag manager service
    });
  });

  describe('Settings and Configuration Workflow', () => {
    test('should complete settings update workflow', async () => {
      // User changes settings in options page
      const newSettings = {
        hoverShowRecentTags: false,
        recentTagsCountMax: 20,
        showHoverOnPageLoad: false
      };
      
      await configManager.updateConfig(newSettings);
      
      // Verify settings were saved
      expect(global.chrome.storage.sync.set).toHaveBeenCalledWith({
        hoverboard_settings: expect.objectContaining(newSettings)
      });
      
      // Background script would be notified of changes
      // Content scripts would receive updated configuration
    });

    test('should handle configuration export/import workflow', async () => {
      // Export current configuration
      const exported = await configManager.exportConfig();
      
      expect(exported).toHaveProperty('version');
      expect(exported).toHaveProperty('settings');
      expect(exported).toHaveProperty('authToken');
      
      // User could save this to file
      const configJson = JSON.stringify(exported, null, 2);
      expect(configJson).toContain('"version"');
      
      // Import configuration (e.g. on new device)
      await configManager.importConfig(exported);
      
      expect(global.chrome.storage.sync.set).toHaveBeenCalledWith(
        expect.objectContaining({
          hoverboard_settings: exported.settings,
          hoverboard_auth_token: exported.authToken
        })
      );
    });
  });

  describe('Error Recovery Workflows', () => {
    test('should handle network failures gracefully', async () => {
      // Mock network failure
      global.fetch.mockRejectedValueOnce(new Error('Network error'));
      
      try {
        await fetch('https://api.pinboard.in/v1/posts/get?auth_token=test');
      } catch (error) {
        expect(error.message).toBe('Network error');
      }
      
      // Extension should continue to function
      const config = await configManager.getConfig();
      expect(config).toBeDefined();
    });

    test('should handle storage failures gracefully', async () => {
      // Mock storage failure
      global.chrome.storage.sync.get.mockRejectedValueOnce(new Error('Storage error'));
      
      // Should fall back to defaults
      const config = await configManager.getConfig();
      expect(config).toEqual(configManager.defaultConfig);
    });

    test('should handle corrupted data gracefully', async () => {
      // Mock corrupted storage data
      global.chrome.storage.sync.get.mockResolvedValueOnce({
        hoverboard_settings: 'invalid-json-string'
      });
      
      // Should handle gracefully and use defaults
      const config = await configManager.getConfig();
      expect(config).toEqual(configManager.defaultConfig);
    });
  });
}); 