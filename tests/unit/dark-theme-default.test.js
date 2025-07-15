/**
 * Unit Tests for Dark Theme Default Implementation
 * 🌙 DARK-THEME-DEFAULT-001: Tests for dark theme as default
 */

import { ConfigManager } from '../../src/config/config-manager.js';
import { VisibilityControls } from '../../src/ui/components/VisibilityControls.js';

// Mock DOM environment for VisibilityControls
const mockDocument = {
  createElement: (tag) => ({
    className: '',
    innerHTML: '',
    querySelector: () => null,
    addEventListener: () => {},
    textContent: ''
  }),
  querySelector: () => null
};

describe('🌙 DARK-THEME-DEFAULT-001: Dark Theme Default Implementation', () => {
  let configManager;
  let visibilityControls;

  beforeEach(() => {
    configManager = new ConfigManager();
    visibilityControls = new VisibilityControls(mockDocument);
    
    // Mock chrome.storage responses
    global.chrome.storage.sync.get.mockImplementation((keys) => {
      const mockData = {
        hoverboard_auth_token: 'test-token',
        hoverboard_settings: {},
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

  describe('New Installation Tests', () => {
    test('should default to dark theme for new installations', () => {
      const defaults = configManager.getDefaultConfiguration();
      expect(defaults.defaultVisibilityTheme).toBe('light-on-dark');
    });

    test('should show dark theme in VisibilityControls', () => {
      expect(visibilityControls.settings.textTheme).toBe('light-on-dark');
    });

    test('should have correct theme terminology', () => {
      const config = configManager.getDefaultConfiguration();
      expect(config.defaultVisibilityTheme).toBe('light-on-dark');
      
      // Verify theme terminology is consistent
      expect(visibilityControls.settings.textTheme).toBe('light-on-dark');
    });

    test('should initialize with dark theme default', () => {
      const controls = new VisibilityControls(mockDocument);
      expect(controls.settings.textTheme).toBe('light-on-dark');
      expect(controls.settings.transparencyEnabled).toBe(false);
      expect(controls.settings.backgroundOpacity).toBe(90);
    });
  });

  describe('Existing User Compatibility Tests', () => {
    test('should preserve existing user theme preferences', async () => {
      // Mock existing user with light theme preference
      global.chrome.storage.sync.get.mockResolvedValue({
        hoverboard_settings: { defaultVisibilityTheme: 'dark-on-light' }
      });
      
      const config = await configManager.getConfig();
      expect(config.defaultVisibilityTheme).toBe('dark-on-light');
    });

    test('should not change existing theme preferences on update', async () => {
      // Mock existing configuration
      global.chrome.storage.sync.get.mockResolvedValue({
        hoverboard_settings: { 
          defaultVisibilityTheme: 'dark-on-light',
          otherSetting: 'value'
        }
      });
      
      await configManager.updateConfig({ otherSetting: 'new-value' });
      
      const config = await configManager.getConfig();
      expect(config.defaultVisibilityTheme).toBe('dark-on-light');
    });

    test('should apply new default only for fresh installations', async () => {
      // Mock empty storage (fresh installation)
      global.chrome.storage.sync.get.mockResolvedValue({});
      
      const config = await configManager.getConfig();
      expect(config.defaultVisibilityTheme).toBe('light-on-dark');
    });
  });

  describe('Configuration Manager Tests', () => {
    test('should have dark theme default in configuration', () => {
      const defaults = configManager.getDefaultConfiguration();
      expect(defaults.defaultVisibilityTheme).toBe('light-on-dark');
      expect(defaults.defaultTransparencyEnabled).toBe(false);
      expect(defaults.defaultBackgroundOpacity).toBe(90);
    });

    test('should get visibility defaults correctly', async () => {
      const visibilityDefaults = await configManager.getVisibilityDefaults();
      expect(visibilityDefaults.textTheme).toBe('light-on-dark');
      expect(visibilityDefaults.transparencyEnabled).toBe(false);
      expect(visibilityDefaults.backgroundOpacity).toBe(90);
    });

    test('should update visibility defaults', async () => {
      const newDefaults = {
        textTheme: 'dark-on-light',
        transparencyEnabled: true,
        backgroundOpacity: 75
      };
      
      await configManager.updateVisibilityDefaults(newDefaults);
      
      expect(global.chrome.storage.sync.set).toHaveBeenCalledWith({
        hoverboard_settings: expect.objectContaining({
          defaultVisibilityTheme: 'dark-on-light',
          defaultTransparencyEnabled: true,
          defaultBackgroundOpacity: 75
        })
      });
    });

    test('should handle partial visibility updates', async () => {
      const partialUpdate = {
        textTheme: 'dark-on-light'
      };
      
      await configManager.updateVisibilityDefaults(partialUpdate);
      
      expect(global.chrome.storage.sync.set).toHaveBeenCalledWith({
        hoverboard_settings: expect.objectContaining({
          defaultVisibilityTheme: 'dark-on-light'
        })
      });
    });
  });

  describe('VisibilityControls Component Tests', () => {
    test('should initialize with dark theme default', () => {
      const controls = new VisibilityControls(mockDocument);
      expect(controls.settings.textTheme).toBe('light-on-dark');
    });

    test('should toggle theme correctly', () => {
      const controls = new VisibilityControls(mockDocument);
      
      // Should start with dark theme
      expect(controls.settings.textTheme).toBe('light-on-dark');
      
      // Toggle to light theme
      controls.toggleTheme();
      expect(controls.settings.textTheme).toBe('dark-on-light');
      
      // Toggle back to dark theme
      controls.toggleTheme();
      expect(controls.settings.textTheme).toBe('light-on-dark');
    });

    test('should generate correct HTML for dark theme', () => {
      const controls = new VisibilityControls(mockDocument);
      const html = controls.getControlsHTML();
      
      // Should show dark theme icon and text
      expect(html).toContain('🌙');
      expect(html).toContain('Dark');
    });

    test('should generate correct HTML for light theme', () => {
      const controls = new VisibilityControls(mockDocument);
      controls.settings.textTheme = 'dark-on-light';
      
      const html = controls.getControlsHTML();
      
      // Should show light theme icon and text
      expect(html).toContain('☀️');
      expect(html).toContain('Light');
    });

    test('should update theme display correctly', () => {
      const controls = new VisibilityControls(mockDocument);
      
      // Mock DOM elements
      const mockThemeIcon = { textContent: '' };
      const mockThemeText = { textContent: '' };
      
      controls.controlsElement = {
        querySelector: (selector) => {
          if (selector === '.theme-icon') return mockThemeIcon;
          if (selector === '.theme-text') return mockThemeText;
          return null;
        }
      };
      
      // Test dark theme display
      controls.updateThemeDisplay();
      expect(mockThemeIcon.textContent).toBe('🌙');
      expect(mockThemeText.textContent).toBe('Dark');
      
      // Test light theme display
      controls.settings.textTheme = 'dark-on-light';
      controls.updateThemeDisplay();
      expect(mockThemeIcon.textContent).toBe('☀️');
      expect(mockThemeText.textContent).toBe('Light');
    });

    test('should handle settings changes', () => {
      const mockCallback = jest.fn();
      const controls = new VisibilityControls(mockDocument, mockCallback);
      
      controls.toggleTheme();
      
      expect(mockCallback).toHaveBeenCalledWith(controls.settings);
    });

    test('should get and set settings correctly', () => {
      const controls = new VisibilityControls(mockDocument);
      
      const currentSettings = controls.getSettings();
      expect(currentSettings.textTheme).toBe('light-on-dark');
      
      const newSettings = {
        textTheme: 'dark-on-light',
        transparencyEnabled: true,
        backgroundOpacity: 75
      };
      
      controls.setSettings(newSettings);
      expect(controls.settings.textTheme).toBe('dark-on-light');
      expect(controls.settings.transparencyEnabled).toBe(true);
      expect(controls.settings.backgroundOpacity).toBe(75);
    });
  });

  describe('Theme Terminology Tests', () => {
    test('should use consistent theme terminology', () => {
      // Verify theme terminology is consistent across components
      const configDefaults = configManager.getDefaultConfiguration();
      const controlsDefaults = new VisibilityControls(mockDocument).settings;
      
      expect(configDefaults.defaultVisibilityTheme).toBe('light-on-dark');
      expect(controlsDefaults.textTheme).toBe('light-on-dark');
    });

    test('should handle theme terminology correctly', () => {
      const controls = new VisibilityControls(mockDocument);
      
      // 'light-on-dark' should mean dark theme (light text on dark background)
      expect(controls.settings.textTheme).toBe('light-on-dark');
      
      // 'dark-on-light' should mean light theme (dark text on light background)
      controls.settings.textTheme = 'dark-on-light';
      expect(controls.settings.textTheme).toBe('dark-on-light');
    });
  });

  describe('Backward Compatibility Tests', () => {
    test('should preserve existing configurations', async () => {
      // Mock existing configuration with light theme
      global.chrome.storage.sync.get.mockResolvedValue({
        hoverboard_settings: { 
          defaultVisibilityTheme: 'dark-on-light',
          otherSetting: 'existing-value'
        }
      });
      
      const config = await configManager.getConfig();
      expect(config.defaultVisibilityTheme).toBe('dark-on-light');
      expect(config.otherSetting).toBe('existing-value');
    });

    test('should apply new defaults only to fresh installations', async () => {
      // Mock empty storage (fresh installation)
      global.chrome.storage.sync.get.mockResolvedValue({});
      
      const config = await configManager.getConfig();
      expect(config.defaultVisibilityTheme).toBe('light-on-dark');
    });

    test('should handle migration scenarios correctly', async () => {
      // Test that existing users are not affected
      global.chrome.storage.sync.get.mockResolvedValue({
        hoverboard_settings: { defaultVisibilityTheme: 'dark-on-light' }
      });
      
      await configManager.initializeDefaults();
      
      // Should not call set because existing settings exist
      expect(global.chrome.storage.sync.set).not.toHaveBeenCalled();
    });
  });

  describe('Integration Tests', () => {
    test('should work together with configuration and controls', async () => {
      // Test that configuration and controls work together
      const config = await configManager.getVisibilityDefaults();
      const controls = new VisibilityControls(mockDocument);
      
      expect(config.textTheme).toBe('light-on-dark');
      expect(controls.settings.textTheme).toBe('light-on-dark');
      
      // Update configuration
      await configManager.updateVisibilityDefaults({
        textTheme: 'dark-on-light'
      });
      
      // Controls should still have their own defaults
      expect(controls.settings.textTheme).toBe('light-on-dark');
      
      // But can be updated
      controls.setSettings({ textTheme: 'dark-on-light' });
      expect(controls.settings.textTheme).toBe('dark-on-light');
    });

    test('should handle edge cases gracefully', () => {
      // Test with null callback
      const controls = new VisibilityControls(mockDocument, null);
      expect(() => controls.toggleTheme()).not.toThrow();
      
      // Test with invalid settings
      const controls2 = new VisibilityControls(mockDocument);
      expect(() => controls2.setSettings({ invalid: 'setting' })).not.toThrow();
    });
  });

  describe('Performance Tests', () => {
    test('should initialize quickly', () => {
      const startTime = performance.now();
      new VisibilityControls(mockDocument);
      const endTime = performance.now();
      
      // Should initialize in less than 10ms
      expect(endTime - startTime).toBeLessThan(10);
    });

    test('should handle theme toggles efficiently', () => {
      const controls = new VisibilityControls(mockDocument);
      
      const startTime = performance.now();
      for (let i = 0; i < 100; i++) {
        controls.toggleTheme();
      }
      const endTime = performance.now();
      
      // Should handle 100 toggles in less than 50ms
      expect(endTime - startTime).toBeLessThan(50);
    });
  });
}); 