/**
 * Unit Tests for ConfigManager
 * Tests configuration management, authentication, and storage functionality
 */

import { ConfigManager } from '../../src/config/config-manager.js';

describe('ConfigManager', () => {
  let configManager;

  beforeEach(() => {
    configManager = new ConfigManager();
    
    // Mock chrome.storage responses
    global.chrome.storage.sync.get.mockImplementation((keys) => {
      const mockData = {
        hoverboard_auth_token: 'test-token',
        hoverboard_settings: {
          hoverShowRecentTags: false,
          recentTagsCountMax: 20,
        },
        hoverboard_inhibit_urls: 'example.com\ntest.com',
      };
      
      if (typeof keys === 'string') {
        return Promise.resolve({ [keys]: mockData[keys] });
      } else if (Array.isArray(keys)) {
        const result = {};
        keys.forEach(key => {
          result[key] = mockData[key];
        });
        return Promise.resolve(result);
      } else if (keys && typeof keys === 'object') {
        const result = {};
        Object.keys(keys).forEach(key => {
          result[key] = mockData[key] || keys[key];
        });
        return Promise.resolve(result);
      }
      return Promise.resolve(mockData);
    });

    global.chrome.storage.sync.set.mockResolvedValue();
  });

  describe('Construction and Defaults', () => {
    test('should initialize with correct storage keys', () => {
      expect(configManager.storageKeys).toEqual({
        AUTH_TOKEN: 'hoverboard_auth_token',
        SETTINGS: 'hoverboard_settings',
        INHIBIT_URLS: 'hoverboard_inhibit_urls',
        RECENT_TAGS: 'hoverboard_recent_tags',
        TAG_FREQUENCY: 'hoverboard_tag_frequency'
      });
    });

    test('should have default configuration', () => {
      const defaults = configManager.getDefaultConfiguration();
      
      expect(defaults).toHaveProperty('hoverShowRecentTags', true);
      expect(defaults).toHaveProperty('recentTagsCountMax', 32);
      expect(defaults).toHaveProperty('badgeTextIfNotBookmarked', '-');
      expect(defaults).toHaveProperty('pinRetryCountMax', 2);
    });

    test('should initialize defaults on first run', async () => {
      // Mock empty storage
      global.chrome.storage.sync.get.mockResolvedValue({});
      
      await configManager.initializeDefaults();
      
      expect(global.chrome.storage.sync.set).toHaveBeenCalledWith({
        hoverboard_settings: configManager.defaultConfig
      });
    });

    test('should not override existing settings on initialize', async () => {
      // Mock existing settings
      global.chrome.storage.sync.get.mockResolvedValue({
        hoverboard_settings: { existing: 'data' }
      });
      
      await configManager.initializeDefaults();
      
      expect(global.chrome.storage.sync.set).not.toHaveBeenCalled();
    });
  });

  describe('Configuration Management', () => {
    test('should get complete config with defaults and overrides', async () => {
      const config = await configManager.getConfig();
      
      expect(config).toHaveProperty('hoverShowRecentTags', false); // overridden
      expect(config).toHaveProperty('recentTagsCountMax', 20); // overridden
      expect(config).toHaveProperty('badgeTextIfNotBookmarked', '-'); // default
    });

    test('should get user options subset', async () => {
      const options = await configManager.getOptions();
      
      expect(options).toHaveProperty('badgeTextIfNotBookmarked');
      expect(options).toHaveProperty('showHoverOnPageLoad');
      expect(options).not.toHaveProperty('pinRetryCountMax'); // internal config
    });

    test('should update configuration', async () => {
      const updates = {
        hoverShowRecentTags: true,
        newProperty: 'test-value'
      };
      
      await configManager.updateConfig(updates);
      
      expect(global.chrome.storage.sync.set).toHaveBeenCalledWith({
        hoverboard_settings: expect.objectContaining(updates)
      });
    });

    test('should reset to defaults', async () => {
      await configManager.resetToDefaults();
      
      expect(global.chrome.storage.sync.set).toHaveBeenCalledWith({
        hoverboard_settings: configManager.defaultConfig
      });
    });

    test('should handle uxShowSectionLabels option correctly', async () => {
      // Test that the default value is false
      const defaultConfig = await configManager.getConfig();
      expect(defaultConfig).toHaveProperty('uxShowSectionLabels', false);
      
      // Test updating the value
      const updates = {
        uxShowSectionLabels: true
      };
      await configManager.updateConfig(updates);
      const updatedConfig = await configManager.getConfig();
      expect(updatedConfig).toHaveProperty('uxShowSectionLabels', true);
    });
  });

  describe('Authentication Management', () => {
    test('should get auth token', async () => {
      const token = await configManager.getAuthToken();
      
      expect(token).toBe('test-token');
      expect(global.chrome.storage.sync.get).toHaveBeenCalledWith('hoverboard_auth_token');
    });

    test('should return empty string for missing auth token', async () => {
      global.chrome.storage.sync.get.mockResolvedValue({});
      
      const token = await configManager.getAuthToken();
      
      expect(token).toBe('');
    });

    test('should set auth token', async () => {
      await configManager.setAuthToken('new-token');
      
      expect(global.chrome.storage.sync.set).toHaveBeenCalledWith({
        hoverboard_auth_token: 'new-token'
      });
    });

    test('should check if auth token exists', async () => {
      let hasToken = await configManager.hasAuthToken();
      expect(hasToken).toBe(true);
      
      // Test with no token
      global.chrome.storage.sync.get.mockResolvedValue({});
      hasToken = await configManager.hasAuthToken();
      expect(hasToken).toBe(false);
    });

    test('should format auth token for API requests', async () => {
      const tokenParam = await configManager.getAuthTokenParam();
      
      expect(tokenParam).toBe('auth_token=test-token');
    });

    test('should handle auth token storage errors', async () => {
      global.chrome.storage.sync.get.mockRejectedValue(new Error('Storage error'));
      
      const token = await configManager.getAuthToken();
      
      expect(token).toBe('');
    });

    test('should throw on auth token set errors', async () => {
      global.chrome.storage.sync.set.mockRejectedValue(new Error('Storage error'));
      
      await expect(configManager.setAuthToken('token')).rejects.toThrow('Storage error');
    });
  });

  describe('URL Inhibition Management', () => {
    test('should get inhibited URLs as array', async () => {
      const urls = await configManager.getInhibitUrls();
      
      expect(urls).toEqual(['example.com', 'test.com']);
    });

    test('should handle empty inhibit URLs', async () => {
      global.chrome.storage.sync.get.mockResolvedValue({});
      
      const urls = await configManager.getInhibitUrls();
      
      expect(urls).toEqual([]);
    });

    test('should add URL to inhibit list', async () => {
      const result = await configManager.addInhibitUrl('newsite.com');
      
      expect(result).toHaveProperty('inhibit', 'example.com\ntest.com\nnewsite.com');
      expect(global.chrome.storage.sync.set).toHaveBeenCalledWith({
        hoverboard_inhibit_urls: 'example.com\ntest.com\nnewsite.com'
      });
    });

    test('should not add duplicate URLs to inhibit list', async () => {
      await configManager.addInhibitUrl('example.com');
      
      expect(global.chrome.storage.sync.set).not.toHaveBeenCalled();
    });

    test('should check if URL is allowed', async () => {
      let isAllowed = await configManager.isUrlAllowed('https://allowed-site.com');
      expect(isAllowed).toBe(true);
      
      isAllowed = await configManager.isUrlAllowed('https://example.com/path');
      expect(isAllowed).toBe(false);
    });

    test('should default to allowing URLs on check error', async () => {
      global.chrome.storage.sync.get.mockRejectedValue(new Error('Storage error'));
      
      const isAllowed = await configManager.isUrlAllowed('https://any-site.com');
      
      expect(isAllowed).toBe(true);
    });
  });

  describe('Configuration Import/Export', () => {
    test('should export configuration', async () => {
      const exported = await configManager.exportConfig();
      
      expect(exported).toHaveProperty('version', '1.0.0');
      expect(exported).toHaveProperty('exportDate');
      expect(exported).toHaveProperty('settings');
      expect(exported).toHaveProperty('authToken', 'test-token');
      expect(exported).toHaveProperty('inhibitUrls', ['example.com', 'test.com']);
    });

    test('should import configuration', async () => {
      const importData = {
        version: '1.0.0',
        settings: { hoverShowRecentTags: true },
        authToken: 'imported-token',
        inhibitUrls: ['imported.com']
      };
      
      await configManager.importConfig(importData);
      
      // importConfig makes separate calls to saveSettings() and setAuthToken()
      // Each calls chrome.storage.sync.set() individually
      expect(global.chrome.storage.sync.set).toHaveBeenCalledWith({
        hoverboard_settings: importData.settings
      });
      expect(global.chrome.storage.sync.set).toHaveBeenCalledWith({
        hoverboard_auth_token: importData.authToken
      });
      expect(global.chrome.storage.sync.set).toHaveBeenCalledWith({
        hoverboard_inhibit_urls: 'imported.com'
      });
    });

    test('should handle partial import data', async () => {
      const importData = {
        settings: { hoverShowRecentTags: true }
        // Missing authToken and inhibitUrls
      };
      
      await configManager.importConfig(importData);
      
      expect(global.chrome.storage.sync.set).toHaveBeenCalledWith({
        hoverboard_settings: importData.settings
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle storage errors gracefully', async () => {
      global.chrome.storage.sync.get.mockRejectedValue(new Error('Storage error'));
      
      const config = await configManager.getConfig();
      
      expect(config).toEqual(configManager.defaultConfig);
    });

    test('should handle inhibit URL errors gracefully', async () => {
      global.chrome.storage.sync.get.mockRejectedValue(new Error('Storage error'));
      
      const urls = await configManager.getInhibitUrls();
      
      expect(urls).toEqual([]);
    });

    test('should throw on critical update errors', async () => {
      global.chrome.storage.sync.set.mockRejectedValue(new Error('Critical storage error'));
      
      await expect(configManager.updateConfig({ test: 'value' })).rejects.toThrow();
    });
  });
}); 