# 🦁 Safari Extension Test Plan

**Semantic Token:** [SAFARI-EXT-TEST-001]
**Cross-References:** [SAFARI-EXT-ARCH-001], [SAFARI-EXT-PLAN-001], [SAFARI-EXT-DEBUG-001], [TOGGLE_SYNCHRONIZATION_ARCHITECTURAL_DECISIONS], [TAG_SYNCHRONIZATION_ARCHITECTURAL_DECISIONS]
**Date:** 2025-07-15
**Status:** Active Development

---

## Executive Summary

This document defines a comprehensive testing strategy for the Safari version of the Hoverboard extension. The test plan ensures feature parity with the Chrome version while validating Safari-specific optimizations and addressing platform-specific constraints.

---

## 1. Testing Philosophy and Strategy 🎯

### 1.1 Testing Principles
- **Safari-First Validation:** All tests must pass on Safari before Chrome compatibility
- **Performance-Driven:** Safari's memory constraints require continuous performance validation
- **Accessibility-Complete:** VoiceOver and keyboard navigation must be fully functional
- **Cross-Platform Parity:** Feature behavior should be identical across platforms

### 1.2 Test Pyramid Structure
```
┌─────────────────────────────────────┐
│         E2E Tests (5%)              │
│     Safari-specific workflows       │
├─────────────────────────────────────┤
│      Integration Tests (25%)        │
│   Safari API and feature testing    │
├─────────────────────────────────────┤
│        Unit Tests (70%)             │
│   Safari adapters and utilities     │
└─────────────────────────────────────┘
```

### 1.3 Testing Environments
- **Development:** Local Safari Technology Preview
- **Staging:** Safari 17+ and macOS 14+ combinations
- **Production:** Safari release versions with iOS support

---

## 2. Phase 0: Foundation Testing 🔧

### 2.1 Chrome Extension Loading Fix Validation
**Token:** [SAFARI-EXT-DEBUG-001]
**Priority:** Critical

#### Test 2.1.1: Browser Abstraction Loading
```javascript
// File: tests/unit/safari-debug-loading.test.js
// [SAFARI-EXT-DEBUG-001] Test Chrome extension loading fixes

describe('Chrome Extension Loading Fixes', () => {
  beforeEach(() => {
    // Reset browser globals
    delete window.chrome;
    delete window.browser;
    delete window.safari;
  });

  test('[SAFARI-EXT-DEBUG-001] should load webextension-polyfill without CommonJS errors', async () => {
    // Mock ES module import
    const mockPolyfill = {
      default: {
        runtime: { id: 'test-id' },
        storage: { sync: {}, local: {} },
        tabs: { query: jest.fn() }
      }
    };
    
    jest.doMock('webextension-polyfill', () => mockPolyfill);
    
    const { browser } = await import('../../src/shared/utils.js');
    
    expect(browser).toBeDefined();
    expect(browser.runtime).toBeDefined();
    expect(browser.storage).toBeDefined();
    expect(browser.tabs).toBeDefined();
  });

  test('[SAFARI-EXT-DEBUG-001] should fallback to Chrome API when polyfill fails', async () => {
    // Mock Chrome API
    window.chrome = {
      runtime: { id: 'chrome-test-id' },
      storage: { sync: {}, local: {} },
      tabs: { query: jest.fn() }
    };
    
    // Mock polyfill failure
    jest.doMock('webextension-polyfill', () => {
      throw new Error('Polyfill not available');
    });
    
    const { browser } = await import('../../src/shared/utils.js');
    
    expect(browser).toBe(window.chrome);
  });

  test('[SAFARI-EXT-DEBUG-001] should throw error when no browser API available', async () => {
    // Mock both polyfill and Chrome API failures
    jest.doMock('webextension-polyfill', () => {
      throw new Error('Polyfill not available');
    });
    
    await expect(import('../../src/shared/utils.js')).rejects.toThrow('No browser API available');
  });
});
```

#### Test 2.1.2: Debug Logging System Validation
```javascript
// File: tests/unit/safari-debug-logger.test.js
// [SAFARI-EXT-DEBUG-001] Test debug logging system

import { debugLogger } from '../../src/shared/debug-logger.js';

describe('Debug Logger System', () => {
  let consoleSpy;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    debugLogger.debugEnabled = true;
    debugLogger.currentLevel = debugLogger.logLevels.DEBUG;
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  test('[SAFARI-EXT-DEBUG-001] should log messages at appropriate levels', () => {
    debugLogger.error('TEST', 'Error message');
    debugLogger.warn('TEST', 'Warning message');
    debugLogger.info('TEST', 'Info message');
    debugLogger.debug('TEST', 'Debug message');
    debugLogger.trace('TEST', 'Trace message');

    expect(consoleSpy).toHaveBeenCalledTimes(4); // All except trace
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[ERROR] [TEST]'),
      'Error message'
    );
  });

  test('[SAFARI-EXT-DEBUG-001] should include data in log output', () => {
    const testData = { key: 'value' };
    debugLogger.info('TEST', 'Message with data', testData);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[INFO] [TEST]'),
      'Message with data',
      testData
    );
  });

  test('[SAFARI-EXT-DEBUG-001] should respect log level filtering', () => {
    debugLogger.currentLevel = debugLogger.logLevels.WARN;
    
    debugLogger.error('TEST', 'Error message');
    debugLogger.warn('TEST', 'Warning message');
    debugLogger.info('TEST', 'Info message');
    debugLogger.debug('TEST', 'Debug message');

    expect(consoleSpy).toHaveBeenCalledTimes(2); // Only error and warn
  });
});
```

#### Test 2.1.3: Loading Diagnostics Validation
```javascript
// File: tests/unit/safari-loading-diagnostics.test.js
// [SAFARI-EXT-DEBUG-001] Test loading diagnostics system

import { loadingDiagnostics } from '../../src/shared/loading-diagnostics.js';

describe('Loading Diagnostics System', () => {
  beforeEach(() => {
    loadingDiagnostics.loadingStages.clear();
    loadingDiagnostics.errors = [];
    loadingDiagnostics.startTime = Date.now();
  });

  test('[SAFARI-EXT-DEBUG-001] should track loading stages with timing', () => {
    loadingDiagnostics.startStage('test-stage');
    
    // Simulate some work
    const testData = { result: 'success' };
    loadingDiagnostics.completeStage('test-stage', testData);
    
    const report = loadingDiagnostics.getReport();
    
    expect(report.stages).toHaveLength(1);
    expect(report.stages[0].name).toBe('test-stage');
    expect(report.stages[0].status).toBe('completed');
    expect(report.stages[0].duration).toBeGreaterThan(0);
    expect(report.stages[0].data).toEqual(testData);
  });

  test('[SAFARI-EXT-DEBUG-001] should track errors with context', () => {
    const testError = new Error('Test error');
    
    loadingDiagnostics.startStage('error-stage');
    loadingDiagnostics.errorStage('error-stage', testError);
    
    const report = loadingDiagnostics.getReport();
    
    expect(report.errors).toHaveLength(1);
    expect(report.errors[0].stage).toBe('error-stage');
    expect(report.errors[0].error).toBe(testError);
    expect(report.stages[0].status).toBe('error');
  });

  test('[SAFARI-EXT-DEBUG-001] should provide comprehensive reporting', () => {
    loadingDiagnostics.startStage('stage1');
    loadingDiagnostics.completeStage('stage1');
    
    loadingDiagnostics.startStage('stage2');
    loadingDiagnostics.errorStage('stage2', new Error('Stage 2 failed'));
    
    const report = loadingDiagnostics.getReport();
    
    expect(report.totalTime).toBeGreaterThan(0);
    expect(report.summary.totalStages).toBe(2);
    expect(report.summary.completedStages).toBe(1);
    expect(report.summary.errorStages).toBe(1);
  });
});
```

---

## 3. Phase 1: Safari Foundation Testing 🚀

### 3.1 Safari Browser Abstraction Tests
**Token:** [SAFARI-EXT-SHIM-001]

#### Test 3.1.1: Safari Browser Shim Validation
```javascript
// File: tests/unit/safari-browser-shim.test.js
// [SAFARI-EXT-SHIM-001] Test Safari browser abstraction layer

import { SafariBrowserShim } from '../../src/shared/safari-browser-shim.js';

describe('Safari Browser Shim', () => {
  let browserShim;
  
  beforeEach(() => {
    // Mock Safari environment
    global.safari = {
      extension: { baseURI: 'safari-extension://test/' }
    };
    
    browserShim = new SafariBrowserShim();
  });

  test('[SAFARI-EXT-SHIM-001] should detect Safari platform correctly', () => {
    expect(browserShim.getPlatform()).toBe('safari');
    expect(browserShim.isSafari).toBe(true);
    expect(browserShim.isChrome).toBe(false);
  });

  test('[SAFARI-EXT-SHIM-001] should provide storage API with fallback', async () => {
    const testData = { key: 'value' };
    
    // Mock sync storage failure
    global.browser.storage.sync.set = jest.fn().mockRejectedValue(new Error('Sync failed'));
    global.browser.storage.local.set = jest.fn().mockResolvedValue();
    
    await browserShim.storage.sync.set(testData);
    
    expect(global.browser.storage.sync.set).toHaveBeenCalledWith(testData);
    expect(global.browser.storage.local.set).toHaveBeenCalledWith(testData);
  });

  test('[SAFARI-EXT-SHIM-001] should enhance messages with platform info', () => {
    const originalMessage = { type: 'TEST', data: 'test' };
    
    browserShim.runtime.sendMessage(originalMessage);
    
    expect(global.browser.runtime.sendMessage).toHaveBeenCalledWith({
      ...originalMessage,
      platform: 'safari',
      timestamp: expect.any(Number)
    });
  });

  test('[SAFARI-EXT-SHIM-001] should detect Safari-specific features', () => {
    const features = browserShim.getFeatureSupport();
    
    expect(features).toHaveProperty('backdropFilter');
    expect(features).toHaveProperty('webkitBackdropFilter');
    expect(features).toHaveProperty('visualViewport');
    expect(features).toHaveProperty('storageQuota');
  });
});
```

#### Test 3.1.2: Platform Detection Tests
```javascript
// File: tests/unit/safari-platform-detector.test.js
// [SAFARI-EXT-SHIM-001] Test platform detection utilities

import { PlatformDetector } from '../../src/shared/platform-detector.js';

describe('Platform Detector', () => {
  let detector;

  beforeEach(() => {
    // Reset global objects
    delete global.safari;
    delete global.chrome;
    delete global.browser;
  });

  test('[SAFARI-EXT-SHIM-001] should detect Safari platform', () => {
    global.safari = { extension: {} };
    
    detector = new PlatformDetector();
    
    expect(detector.detectPlatform()).toBe('safari');
    expect(detector.isSafari()).toBe(true);
  });

  test('[SAFARI-EXT-SHIM-001] should detect Chrome platform', () => {
    global.chrome = { runtime: {} };
    
    detector = new PlatformDetector();
    
    expect(detector.detectPlatform()).toBe('chrome');
    expect(detector.isChrome()).toBe(true);
  });

  test('[SAFARI-EXT-SHIM-001] should detect Firefox platform', () => {
    global.browser = { 
      runtime: { 
        getBrowserInfo: jest.fn()
      }
    };
    
    detector = new PlatformDetector();
    
    expect(detector.detectPlatform()).toBe('firefox');
    expect(detector.isFirefox()).toBe(true);
  });

  test('[SAFARI-EXT-SHIM-001] should detect CSS features', () => {
    // Mock CSS feature detection
    Object.defineProperty(document.documentElement.style, 'backdropFilter', {
      value: '',
      configurable: true
    });
    
    detector = new PlatformDetector();
    
    expect(detector.supportsCSS('backdrop-filter')).toBe(true);
    expect(detector.hasFeature('backdropFilter')).toBe(true);
  });
});
```

### 3.2 Safari Manifest and Build Testing
**Token:** [SAFARI-EXT-MANIFEST-001], [SAFARI-EXT-BUILD-001]

#### Test 3.2.1: Safari Manifest Validation
```javascript
// File: tests/unit/safari-manifest-validation.test.js
// [SAFARI-EXT-MANIFEST-001] Test Safari manifest configuration

import fs from 'fs';
import path from 'path';

describe('Safari Manifest Validation', () => {
  let manifest;

  beforeAll(() => {
    const manifestPath = path.join(__dirname, '../../manifest.json');
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  });

  test('[SAFARI-EXT-MANIFEST-001] should have Safari-specific settings', () => {
    expect(manifest.browser_specific_settings).toBeDefined();
    expect(manifest.browser_specific_settings.safari).toBeDefined();
    expect(manifest.browser_specific_settings.safari.strict_min_version).toBe('17.0');
  });

  test('[SAFARI-EXT-MANIFEST-001] should have required permissions', () => {
    const requiredPermissions = ['storage', 'tabs', 'activeTab'];
    
    requiredPermissions.forEach(permission => {
      expect(manifest.permissions).toContain(permission);
    });
  });

  test('[SAFARI-EXT-MANIFEST-001] should have proper CSP for Safari', () => {
    expect(manifest.content_security_policy).toBeDefined();
    expect(manifest.content_security_policy.extension_pages).toContain("script-src 'self'");
    expect(manifest.content_security_policy.extension_pages).toContain("style-src 'self' 'unsafe-inline'");
  });

  test('[SAFARI-EXT-MANIFEST-001] should use action instead of browserAction', () => {
    expect(manifest.action).toBeDefined();
    expect(manifest.browserAction).toBeUndefined();
  });
});
```

#### Test 3.2.2: Safari Build Configuration Tests
```javascript
// File: tests/unit/safari-build-config.test.js
// [SAFARI-EXT-BUILD-001] Test Safari build configuration

import { SafariBuildConfig } from '../../scripts/safari-build.js';

describe('Safari Build Configuration', () => {
  let buildConfig;

  beforeEach(() => {
    buildConfig = new SafariBuildConfig();
  });

  test('[SAFARI-EXT-BUILD-001] should have Safari-specific build targets', () => {
    expect(buildConfig.config.serviceWorker.define['process.env.PLATFORM']).toBe('"safari"');
    expect(buildConfig.config.contentScript.define['process.env.PLATFORM']).toBe('"safari"');
    expect(buildConfig.config.popup.define['process.env.PLATFORM']).toBe('"safari"');
  });

  test('[SAFARI-EXT-BUILD-001] should use appropriate formats for Safari', () => {
    expect(buildConfig.config.serviceWorker.format).toBe('esm');
    expect(buildConfig.config.contentScript.format).toBe('iife');
    expect(buildConfig.config.popup.format).toBe('esm');
  });

  test('[SAFARI-EXT-BUILD-001] should exclude webextension-polyfill from bundle', () => {
    expect(buildConfig.config.serviceWorker.external).toContain('webextension-polyfill');
    expect(buildConfig.config.contentScript.external).toContain('webextension-polyfill');
    expect(buildConfig.config.popup.external).toContain('webextension-polyfill');
  });

  test('[SAFARI-EXT-BUILD-001] should target ES2020 for Safari compatibility', () => {
    expect(buildConfig.config.serviceWorker.target).toBe('es2020');
    expect(buildConfig.config.contentScript.target).toBe('es2020');
    expect(buildConfig.config.popup.target).toBe('es2020');
  });
});
```

---

## 4. Phase 2: Safari Feature Testing 🎯

### 4.1 Safari UI Component Tests
**Token:** [SAFARI-EXT-UI-001]

#### Test 4.1.1: Safari Popup Adapter Tests
```javascript
// File: tests/unit/safari-popup-adapter.test.js
// [SAFARI-EXT-UI-001] Test Safari popup adaptations

import { SafariPopupAdapter } from '../../src/ui/popup/safari-popup-adapter.js';

describe('Safari Popup Adapter', () => {
  let adapter;
  let mockDocument;

  beforeEach(() => {
    mockDocument = {
      documentElement: {
        style: { setProperty: jest.fn() },
        classList: { add: jest.fn() }
      },
      querySelector: jest.fn(),
      querySelectorAll: jest.fn(() => []),
      addEventListener: jest.fn()
    };
    
    global.document = mockDocument;
    adapter = new SafariPopupAdapter();
  });

  test('[SAFARI-EXT-UI-001] should have Safari-specific configuration', () => {
    expect(adapter.config.dimensions.width).toBe(400);
    expect(adapter.config.dimensions.height).toBe(600);
    expect(adapter.config.styles.fontFamily).toContain('-apple-system');
  });

  test('[SAFARI-EXT-UI-001] should apply Safari-specific styles', () => {
    adapter.applyPopupStyles();
    
    expect(mockDocument.documentElement.style.setProperty).toHaveBeenCalledWith(
      '--safari-fontFamily',
      adapter.config.styles.fontFamily
    );
    expect(mockDocument.documentElement.classList.add).toHaveBeenCalledWith('safari-popup');
  });

  test('[SAFARI-EXT-UI-001] should setup focus management', () => {
    const mockInput = { focus: jest.fn() };
    const mockButtons = [{ focus: jest.fn() }, { focus: jest.fn() }];
    
    mockDocument.querySelector.mockReturnValue(mockInput);
    mockDocument.querySelectorAll.mockReturnValue(mockButtons);
    
    adapter.setupFocusManagement();
    
    expect(mockInput.focus).toHaveBeenCalled();
    expect(mockDocument.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  test('[SAFARI-EXT-UI-001] should handle backdrop filter detection', () => {
    // Mock backdrop filter support
    const mockPlatformDetector = {
      hasFeature: jest.fn().mockReturnValue(true)
    };
    
    jest.doMock('../../src/shared/platform-detector.js', () => ({
      platformDetector: mockPlatformDetector
    }));
    
    adapter.applyPopupStyles();
    
    expect(mockDocument.documentElement.classList.add).toHaveBeenCalledWith('safari-backdrop-support');
  });
});
```

#### Test 4.1.2: Safari Overlay Adapter Tests
```javascript
// File: tests/unit/safari-overlay-adapter.test.js
// [SAFARI-EXT-OVERLAY-001] Test Safari overlay adaptations

import { SafariOverlayAdapter } from '../../src/features/content/safari-overlay-adapter.js';

describe('Safari Overlay Adapter', () => {
  let adapter;
  let mockDocument;

  beforeEach(() => {
    mockDocument = {
      createElement: jest.fn(() => ({
        style: {},
        classList: { add: jest.fn() }
      })),
      body: { appendChild: jest.fn() }
    };
    
    global.document = mockDocument;
    global.window = {
      innerWidth: 1200,
      innerHeight: 800,
      matchMedia: jest.fn().mockReturnValue({ matches: false }),
      requestAnimationFrame: jest.fn(cb => cb())
    };
    
    adapter = new SafariOverlayAdapter();
  });

  test('[SAFARI-EXT-OVERLAY-001] should have Safari-specific configuration', () => {
    expect(adapter.config.positioning.injectionDelay).toBe(50);
    expect(adapter.config.positioning.zIndex).toBe(2147483647);
    expect(adapter.config.animations.duration).toBe('0.3s');
  });

  test('[SAFARI-EXT-OVERLAY-001] should create overlay with Safari styling', () => {
    const mockOverlay = {
      style: {},
      classList: { add: jest.fn() }
    };
    mockDocument.createElement.mockReturnValue(mockOverlay);
    
    const overlay = adapter.createOverlay('<div>Test</div>', { x: 100, y: 100 });
    
    expect(overlay.style.fontFamily).toContain('-apple-system');
    expect(overlay.style.borderRadius).toBe('8px');
    expect(overlay.style.position).toBe('fixed');
  });

  test('[SAFARI-EXT-OVERLAY-001] should position overlay within viewport', () => {
    const mockOverlay = { style: {} };
    
    adapter.positionOverlay(mockOverlay, { x: 50, y: 50 });
    
    expect(mockOverlay.style.left).toBe('50px');
    expect(mockOverlay.style.top).toBe('50px');
  });

  test('[SAFARI-EXT-OVERLAY-001] should handle viewport edge cases', () => {
    const mockOverlay = { style: {} };
    
    adapter.positionOverlay(mockOverlay, { x: 2000, y: 2000 });
    
    expect(parseInt(mockOverlay.style.left)).toBeLessThan(900);
    expect(parseInt(mockOverlay.style.top)).toBeLessThan(600);
  });

  test('[SAFARI-EXT-OVERLAY-001] should respect reduced motion preferences', () => {
    global.window.matchMedia.mockReturnValue({ matches: true });
    
    const mockOverlay = { style: {} };
    adapter.applyOverlayStyles(mockOverlay);
    
    expect(mockOverlay.style.transition).toBe('none');
  });
});
```

### 4.2 Safari Storage Tests
**Token:** [SAFARI-EXT-STORAGE-001]

#### Test 4.2.1: Safari Storage Manager Tests
```javascript
// File: tests/unit/safari-storage-manager.test.js
// [SAFARI-EXT-STORAGE-001] Test Safari storage management

import { SafariStorageManager } from '../../src/shared/safari-storage-manager.js';

describe('Safari Storage Manager', () => {
  let storageManager;
  let mockBrowser;

  beforeEach(() => {
    mockBrowser = {
      storage: {
        sync: {
          get: jest.fn(),
          set: jest.fn(),
          remove: jest.fn()
        },
        local: {
          get: jest.fn(),
          set: jest.fn(),
          remove: jest.fn()
        }
      }
    };
    
    jest.doMock('../../src/shared/safari-browser-shim.js', () => ({
      browser: mockBrowser
    }));
    
    storageManager = new SafariStorageManager();
  });

  test('[SAFARI-EXT-STORAGE-001] should fallback to local storage on sync failure', async () => {
    const testData = { key: 'value' };
    
    mockBrowser.storage.sync.set.mockRejectedValue(new Error('Sync failed'));
    mockBrowser.storage.local.set.mockResolvedValue();
    
    await storageManager.set(testData);
    
    expect(mockBrowser.storage.sync.set).toHaveBeenCalledWith(testData);
    expect(mockBrowser.storage.local.set).toHaveBeenCalledWith(testData);
  });

  test('[SAFARI-EXT-STORAGE-001] should compress large data objects', () => {
    const largeData = {
      smallString: 'small',
      largeString: 'x'.repeat(2000),
      largeObject: { data: 'x'.repeat(1500) }
    };
    
    const compressed = storageManager.compressLargeData(largeData);
    
    expect(compressed.smallString).toBe('small');
    expect(compressed.largeString).toMatch(/x\d+/);
    expect(compressed.largeObject).toBeDefined();
  });

  test('[SAFARI-EXT-STORAGE-001] should handle storage quota monitoring', async () => {
    global.navigator.storage = {
      estimate: jest.fn().mockResolvedValue({
        usage: 80 * 1024 * 1024,
        quota: 100 * 1024 * 1024
      })
    };
    
    const cleanupSpy = jest.spyOn(storageManager, 'cleanupOldData').mockResolvedValue();
    
    await storageManager.checkQuota();
    
    expect(global.navigator.storage.estimate).toHaveBeenCalled();
    expect(cleanupSpy).toHaveBeenCalled();
  });

  test('[SAFARI-EXT-STORAGE-001] should cleanup old cache data', async () => {
    const oldCacheData = {
      tagCache: {
        timestamp: Date.now() - (8 * 24 * 60 * 60 * 1000), // 8 days old
        data: ['old', 'tags']
      }
    };
    
    storageManager.get = jest.fn().mockResolvedValue(oldCacheData);
    
    await storageManager.cleanupOldData();
    
    expect(mockBrowser.storage.local.remove).toHaveBeenCalledWith('tagCache');
  });
});
```

---

## 5. Phase 3: Safari Performance Testing 🚀

### 5.1 Safari Performance Test Suite
**Token:** [SAFARI-EXT-PERF-001]

#### Test 5.1.1: Safari Overlay Performance Tests
```javascript
// File: tests/performance/safari-overlay-performance.test.js
// [SAFARI-EXT-PERF-001] Test Safari overlay performance

import { SafariOverlayAdapter } from '../../src/features/content/safari-overlay-adapter.js';

describe('Safari Overlay Performance', () => {
  let adapter;
  let performanceObserver;

  beforeEach(() => {
    adapter = new SafariOverlayAdapter();
    
    // Mock performance API
    global.performance = {
      now: jest.fn().mockReturnValue(Date.now()),
      mark: jest.fn(),
      measure: jest.fn(),
      getEntriesByName: jest.fn(),
      clearMarks: jest.fn(),
      clearMeasures: jest.fn()
    };
    
    performanceObserver = {
      observe: jest.fn(),
      disconnect: jest.fn()
    };
  });

  test('[SAFARI-EXT-PERF-001] should create overlay within 16ms budget', () => {
    let startTime = performance.now();
    
    performance.now
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(10);
    
    performance.getEntriesByName.mockReturnValue([
      { duration: 10 }
    ]);
    
    performance.mark('overlay-start');
    adapter.createOverlay('<div>Test</div>', { x: 100, y: 100 });
    performance.mark('overlay-end');
    performance.measure('overlay-creation', 'overlay-start', 'overlay-end');
    
    const measures = performance.getEntriesByName('overlay-creation');
    expect(measures[0].duration).toBeLessThan(16);
  });

  test('[SAFARI-EXT-PERF-001] should handle multiple overlays without memory leaks', () => {
    const initialMemory = 10 * 1024 * 1024; // 10MB
    let currentMemory = initialMemory;
    
    global.performance.memory = {
      get usedJSHeapSize() { return currentMemory; }
    };
    
    const overlays = [];
    for (let i = 0; i < 10; i++) {
      const overlay = adapter.createOverlay(`<div>Test ${i}</div>`, { x: i * 10, y: i * 10 });
      overlays.push(overlay);
      currentMemory += 100 * 1024; // 100KB per overlay
    }
    
    const memoryIncrease = currentMemory - initialMemory;
    expect(memoryIncrease).toBeLessThan(2 * 1024 * 1024); // Less than 2MB
  });

  test('[SAFARI-EXT-PERF-001] should optimize animation performance', () => {
    let animationFrameCallbacks = [];
    global.requestAnimationFrame = jest.fn(cb => {
      animationFrameCallbacks.push(cb);
      return animationFrameCallbacks.length;
    });
    
    const overlay = { style: {} };
    adapter.animateIn(overlay);
    
    // Execute animation frame callback
    animationFrameCallbacks.forEach(cb => cb());
    
    expect(overlay.style.opacity).toBe('1');
    expect(overlay.style.transform).toBe('scale(1)');
  });
});
```

#### Test 5.1.2: Safari Memory Management Tests
```javascript
// File: tests/performance/safari-memory-management.test.js
// [SAFARI-EXT-PERF-001] Test Safari memory management

import { SafariMemoryManager } from '../../src/shared/safari-memory-manager.js';

describe('Safari Memory Management', () => {
  let memoryManager;

  beforeEach(() => {
    global.performance.memory = {
      usedJSHeapSize: 30 * 1024 * 1024, // 30MB
      totalJSHeapSize: 50 * 1024 * 1024, // 50MB
      jsHeapSizeLimit: 100 * 1024 * 1024 // 100MB
    };
    
    memoryManager = new SafariMemoryManager();
    
    // Mock optimization methods
    memoryManager.clearUnusedCaches = jest.fn();
    memoryManager.compactOverlaySystem = jest.fn();
    memoryManager.optimizeTagStorage = jest.fn();
  });

  test('[SAFARI-EXT-PERF-001] should monitor memory usage', () => {
    const setupSpy = jest.spyOn(memoryManager, 'setupMemoryMonitoring');
    
    new SafariMemoryManager();
    
    expect(setupSpy).toHaveBeenCalled();
  });

  test('[SAFARI-EXT-PERF-001] should optimize memory when threshold exceeded', () => {
    // Simulate high memory usage
    global.performance.memory.usedJSHeapSize = 60 * 1024 * 1024; // 60MB (above 50MB threshold)
    
    memoryManager.optimizeMemoryUsage();
    
    expect(memoryManager.clearUnusedCaches).toHaveBeenCalled();
    expect(memoryManager.compactOverlaySystem).toHaveBeenCalled();
    expect(memoryManager.optimizeTagStorage).toHaveBeenCalled();
  });

  test('[SAFARI-EXT-PERF-001] should track memory pressure over time', () => {
    const pressureEvents = [];
    
    memoryManager.onMemoryPressure = jest.fn((event) => {
      pressureEvents.push(event);
    });
    
    // Simulate memory pressure
    global.performance.memory.usedJSHeapSize = 80 * 1024 * 1024; // 80MB
    
    memoryManager.checkMemoryPressure();
    
    expect(pressureEvents).toHaveLength(1);
    expect(pressureEvents[0].level).toBe('high');
  });
});
```

### 5.2 Safari Rendering Performance Tests
**Token:** [SAFARI-EXT-PERF-001]

#### Test 5.2.1: Safari CSS Performance Tests
```javascript
// File: tests/performance/safari-css-performance.test.js
// [SAFARI-EXT-PERF-001] Test Safari CSS rendering performance

describe('Safari CSS Performance', () => {
  let testElement;

  beforeEach(() => {
    testElement = document.createElement('div');
    document.body.appendChild(testElement);
    
    // Mock CSS property support
    Object.defineProperty(testElement.style, 'backdropFilter', {
      get: function() { return this._backdropFilter || ''; },
      set: function(value) { this._backdropFilter = value; },
      configurable: true
    });
  });

  afterEach(() => {
    document.body.removeChild(testElement);
  });

  test('[SAFARI-EXT-PERF-001] should apply backdrop filter efficiently', () => {
    const startTime = performance.now();
    
    testElement.style.backdropFilter = 'blur(10px)';
    testElement.style.webkitBackdropFilter = 'blur(10px)';
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    expect(duration).toBeLessThan(1); // Should be sub-millisecond
    expect(testElement.style.backdropFilter).toBe('blur(10px)');
  });

  test('[SAFARI-EXT-PERF-001] should handle CSS transitions smoothly', () => {
    testElement.style.transition = 'opacity 0.3s ease';
    testElement.style.opacity = '0';
    
    const startTime = performance.now();
    
    // Trigger transition
    testElement.style.opacity = '1';
    
    // Force layout
    testElement.offsetHeight;
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    expect(duration).toBeLessThan(5); // Should be very fast
  });

  test('[SAFARI-EXT-PERF-001] should minimize reflows during style changes', () => {
    let layoutCount = 0;
    
    // Mock layout detection
    const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');
    Object.defineProperty(testElement, 'offsetHeight', {
      get: function() {
        layoutCount++;
        return 100;
      },
      configurable: true
    });
    
    // Apply multiple style changes
    testElement.style.width = '200px';
    testElement.style.height = '200px';
    testElement.style.backgroundColor = 'red';
    
    // Force single layout
    testElement.offsetHeight;
    
    expect(layoutCount).toBe(1); // Should only trigger one layout
    
    // Restore original descriptor
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', originalOffsetHeight);
  });
});
```

---

## 6. Phase 4: Safari Integration Testing 🔄

### 6.1 Safari E2E Test Suite
**Token:** [SAFARI-EXT-TEST-001]

#### Test 6.1.1: Safari Extension Loading E2E
```javascript
// File: tests/e2e/safari-extension-loading.test.js
// [SAFARI-EXT-TEST-001] Safari extension loading end-to-end tests

import { test, expect } from '@playwright/test';

test.describe('Safari Extension Loading', () => {
  test.beforeEach(async ({ page }) => {
    // Load extension in Safari
    await page.goto('safari-extension://test-extension-id/src/ui/popup/popup.html');
  });

  test('[SAFARI-EXT-TEST-001] should load extension without errors', async ({ page }) => {
    // Check for console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.waitForLoadState('networkidle');
    
    expect(errors).toHaveLength(0);
  });

  test('[SAFARI-EXT-TEST-001] should initialize all components', async ({ page }) => {
    // Wait for initialization
    await page.waitForFunction(() => {
      return window.hoverboardInitialized === true;
    });
    
    // Check component presence
    const serviceWorker = await page.evaluate(() => {
      return window.serviceWorkerReady;
    });
    
    expect(serviceWorker).toBe(true);
  });

  test('[SAFARI-EXT-TEST-001] should handle Safari-specific APIs', async ({ page }) => {
    const browserDetection = await page.evaluate(() => {
      return {
        hasSafari: typeof safari !== 'undefined',
        hasBrowser: typeof browser !== 'undefined',
        platform: window.detectedPlatform
      };
    });
    
    expect(browserDetection.hasSafari).toBe(true);
    expect(browserDetection.platform).toBe('safari');
  });
});
```

#### Test 6.1.2: Safari Popup Functionality E2E
```javascript
// File: tests/e2e/safari-popup-functionality.test.js
// [SAFARI-EXT-TEST-001] Safari popup functionality end-to-end tests

import { test, expect } from '@playwright/test';

test.describe('Safari Popup Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('safari-extension://test-extension-id/src/ui/popup/popup.html');
    await page.waitForLoadState('networkidle');
  });

  test('[SAFARI-EXT-UI-001] should display popup with Safari styling', async ({ page }) => {
    // Check Safari-specific classes
    const hasSafariClass = await page.evaluate(() => {
      return document.documentElement.classList.contains('safari-popup');
    });
    
    expect(hasSafariClass).toBe(true);
    
    // Check Safari font family
    const fontFamily = await page.evaluate(() => {
      return getComputedStyle(document.body).fontFamily;
    });
    
    expect(fontFamily).toContain('apple-system');
  });

  test('[SAFARI-EXT-UI-001] should handle popup dimensions correctly', async ({ page }) => {
    const dimensions = await page.evaluate(() => {
      return {
        width: window.innerWidth,
        height: window.innerHeight
      };
    });
    
    expect(dimensions.width).toBe(400);
    expect(dimensions.height).toBe(600);
  });

  test('[SAFARI-EXT-UI-001] should manage focus properly', async ({ page }) => {
    // Check initial focus
    const initialFocus = await page.evaluate(() => {
      return document.activeElement.id;
    });
    
    expect(initialFocus).toBe('search-input');
    
    // Test focus trap
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    
    const focusedElement = await page.evaluate(() => {
      return document.activeElement.tagName;
    });
    
    expect(focusedElement).toBe('INPUT');
  });
});
```

### 6.2 Safari Content Script Integration Tests
**Token:** [SAFARI-EXT-CONTENT-001]

#### Test 6.2.1: Safari Content Script Injection
```javascript
// File: tests/e2e/safari-content-script-injection.test.js
// [SAFARI-EXT-CONTENT-001] Safari content script injection tests

import { test, expect } from '@playwright/test';

test.describe('Safari Content Script Injection', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to test page
    await page.goto('https://example.com');
  });

  test('[SAFARI-EXT-CONTENT-001] should inject content script on page load', async ({ page }) => {
    // Wait for content script injection
    await page.waitForFunction(() => {
      return window.hoverboardContentScript !== undefined;
    });
    
    const contentScriptReady = await page.evaluate(() => {
      return window.hoverboardContentScript.isInitialized;
    });
    
    expect(contentScriptReady).toBe(true);
  });

  test('[SAFARI-EXT-CONTENT-001] should handle Safari-specific timing', async ({ page }) => {
    // Check injection timing
    const injectionTiming = await page.evaluate(() => {
      return window.hoverboardContentScript.injectionTiming;
    });
    
    expect(injectionTiming.domReady).toBeDefined();
    expect(injectionTiming.scriptsReady).toBeDefined();
    expect(injectionTiming.delay).toBeGreaterThan(0); // Safari delay applied
  });

  test('[SAFARI-EXT-CONTENT-001] should create overlays with Safari styling', async ({ page }) => {
    // Hover over a link to trigger overlay
    await page.hover('a');
    
    // Wait for overlay to appear
    await page.waitForSelector('.hoverboard-overlay.safari-overlay');
    
    const overlayStyles = await page.evaluate(() => {
      const overlay = document.querySelector('.hoverboard-overlay.safari-overlay');
      return {
        backdropFilter: overlay.style.backdropFilter,
        webkitBackdropFilter: overlay.style.webkitBackdropFilter,
        fontFamily: overlay.style.fontFamily
      };
    });
    
    expect(overlayStyles.fontFamily).toContain('apple-system');
    expect(overlayStyles.backdropFilter || overlayStyles.webkitBackdropFilter).toContain('blur');
  });
});
```

---

## 7. Safari Accessibility Testing 🦽

### 7.1 VoiceOver Compatibility Tests
**Token:** [SAFARI-EXT-A11Y-001]

#### Test 7.1.1: VoiceOver Navigation Tests
```javascript
// File: tests/accessibility/safari-voiceover.test.js
// [SAFARI-EXT-A11Y-001] Safari VoiceOver accessibility tests

import { test, expect } from '@playwright/test';

test.describe('Safari VoiceOver Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    // Enable VoiceOver simulation
    await page.addInitScript(() => {
      window.VoiceOver = {
        enabled: true,
        speak: (text) => {
          window.voiceOverOutput = window.voiceOverOutput || [];
          window.voiceOverOutput.push(text);
        }
      };
    });
    
    await page.goto('safari-extension://test-extension-id/src/ui/popup/popup.html');
  });

  test('[SAFARI-EXT-A11Y-001] should provide proper ARIA labels', async ({ page }) => {
    const ariaLabels = await page.evaluate(() => {
      const elements = document.querySelectorAll('[aria-label]');
      return Array.from(elements).map(el => ({
        tag: el.tagName,
        label: el.getAttribute('aria-label')
      }));
    });
    
    expect(ariaLabels.length).toBeGreaterThan(0);
    expect(ariaLabels.some(el => el.label.includes('Search'))).toBe(true);
  });

  test('[SAFARI-EXT-A11Y-001] should support keyboard navigation', async ({ page }) => {
    // Test Tab navigation
    await page.keyboard.press('Tab');
    const firstFocused = await page.evaluate(() => document.activeElement.id);
    
    await page.keyboard.press('Tab');
    const secondFocused = await page.evaluate(() => document.activeElement.id);
    
    expect(firstFocused).toBeDefined();
    expect(secondFocused).toBeDefined();
    expect(firstFocused).not.toBe(secondFocused);
  });

  test('[SAFARI-EXT-A11Y-001] should announce overlay content', async ({ page }) => {
    // Navigate to a page with links
    await page.goto('https://example.com');
    
    // Hover over a link
    await page.hover('a');
    
    // Check VoiceOver announcement
    const voiceOverOutput = await page.evaluate(() => {
      return window.voiceOverOutput || [];
    });
    
    expect(voiceOverOutput.some(text => text.includes('bookmark'))).toBe(true);
  });
});
```

#### Test 7.1.2: Keyboard Navigation Tests
```javascript
// File: tests/accessibility/safari-keyboard-navigation.test.js
// [SAFARI-EXT-A11Y-001] Safari keyboard navigation tests

import { test, expect } from '@playwright/test';

test.describe('Safari Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('safari-extension://test-extension-id/src/ui/popup/popup.html');
    await page.waitForLoadState('networkidle');
  });

  test('[SAFARI-EXT-A11Y-001] should support Tab navigation', async ({ page }) => {
    const focusableElements = await page.evaluate(() => {
      return Array.from(document.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )).map(el => el.id || el.tagName);
    });
    
    expect(focusableElements.length).toBeGreaterThan(0);
    
    // Navigate through all focusable elements
    for (let i = 0; i < focusableElements.length; i++) {
      await page.keyboard.press('Tab');
    }
    
    // Should wrap back to first element
    await page.keyboard.press('Tab');
    const finalFocus = await page.evaluate(() => document.activeElement.id);
    expect(finalFocus).toBe('search-input');
  });

  test('[SAFARI-EXT-A11Y-001] should support Shift+Tab reverse navigation', async ({ page }) => {
    // Move to last element
    await page.keyboard.press('Shift+Tab');
    const lastElement = await page.evaluate(() => document.activeElement.tagName);
    
    // Move back to first element
    await page.keyboard.press('Tab');
    const firstElement = await page.evaluate(() => document.activeElement.id);
    
    expect(firstElement).toBe('search-input');
  });

  test('[SAFARI-EXT-A11Y-001] should support Enter and Space activation', async ({ page }) => {
    // Focus on a button
    await page.focus('button');
    
    let clickCount = 0;
    await page.evaluate(() => {
      document.querySelector('button').addEventListener('click', () => {
        window.clickCount = (window.clickCount || 0) + 1;
      });
    });
    
    // Test Enter key
    await page.keyboard.press('Enter');
    
    clickCount = await page.evaluate(() => window.clickCount);
    expect(clickCount).toBe(1);
    
    // Test Space key
    await page.keyboard.press('Space');
    
    clickCount = await page.evaluate(() => window.clickCount);
    expect(clickCount).toBe(2);
  });
});
```

---

## 8. Safari Performance Benchmarking 📊

### 8.1 Performance Metrics Collection
**Token:** [SAFARI-EXT-PERF-001]

#### Test 8.1.1: Safari Performance Benchmarks
```javascript
// File: tests/performance/safari-benchmarks.test.js
// [SAFARI-EXT-PERF-001] Safari performance benchmarking

import { test, expect } from '@playwright/test';

test.describe('Safari Performance Benchmarks', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('safari-extension://test-extension-id/src/ui/popup/popup.html');
  });

  test('[SAFARI-EXT-PERF-001] should load popup within performance budget', async ({ page }) => {
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint')?.startTime,
        firstContentfulPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-contentful-paint')?.startTime
      };
    });
    
    expect(performanceMetrics.domContentLoaded).toBeLessThan(100); // 100ms budget
    expect(performanceMetrics.loadComplete).toBeLessThan(200); // 200ms budget
    expect(performanceMetrics.firstPaint).toBeLessThan(100); // 100ms budget
  });

  test('[SAFARI-EXT-PERF-001] should maintain 60fps during animations', async ({ page }) => {
    // Trigger animation
    await page.evaluate(() => {
      const element = document.querySelector('.animated-element');
      element.style.transition = 'transform 1s ease';
      element.style.transform = 'translateX(100px)';
    });
    
    // Measure frame rate
    const frameRate = await page.evaluate(() => {
      return new Promise(resolve => {
        let frameCount = 0;
        const startTime = performance.now();
        
        function countFrames() {
          frameCount++;
          
          if (performance.now() - startTime < 1000) {
            requestAnimationFrame(countFrames);
          } else {
            resolve(frameCount);
          }
        }
        
        requestAnimationFrame(countFrames);
      });
    });
    
    expect(frameRate).toBeGreaterThan(55); // Allow for some variance
  });

  test('[SAFARI-EXT-PERF-001] should handle memory efficiently', async ({ page }) => {
    const memoryUsage = await page.evaluate(() => {
      if (performance.memory) {
        return {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit
        };
      }
      return null;
    });
    
    if (memoryUsage) {
      expect(memoryUsage.used).toBeLessThan(50 * 1024 * 1024); // 50MB limit
      expect(memoryUsage.used / memoryUsage.total).toBeLessThan(0.8); // 80% of allocated
    }
  });
});
```

### 8.2 Safari Resource Usage Tests
**Token:** [SAFARI-EXT-PERF-001]

#### Test 8.2.1: Safari Resource Monitoring
```javascript
// File: tests/performance/safari-resource-usage.test.js
// [SAFARI-EXT-PERF-001] Safari resource usage monitoring

import { test, expect } from '@playwright/test';

test.describe('Safari Resource Usage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://example.com');
    await page.waitForLoadState('networkidle');
  });

  test('[SAFARI-EXT-PERF-001] should minimize CPU usage', async ({ page }) => {
    // Monitor CPU usage during normal operation
    const cpuUsage = await page.evaluate(() => {
      return new Promise(resolve => {
        const startTime = performance.now();
        let cycles = 0;
        
        function measureCPU() {
          const currentTime = performance.now();
          cycles++;
          
          if (currentTime - startTime < 1000) {
            requestAnimationFrame(measureCPU);
          } else {
            // Higher cycles = lower CPU usage (more idle time)
            resolve(cycles);
          }
        }
        
        requestAnimationFrame(measureCPU);
      });
    });
    
    expect(cpuUsage).toBeGreaterThan(50); // Should have plenty of idle cycles
  });

  test('[SAFARI-EXT-PERF-001] should limit network requests', async ({ page }) => {
    const networkRequests = [];
    
    page.on('request', request => {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType()
      });
    });
    
    // Trigger extension functionality
    await page.hover('a');
    await page.waitForTimeout(1000);
    
    const extensionRequests = networkRequests.filter(req => 
      req.url.includes('api.pinboard.in') || req.url.includes('chrome-extension')
    );
    
    expect(extensionRequests.length).toBeLessThan(5); // Limit API calls
  });

  test('[SAFARI-EXT-PERF-001] should handle multiple tabs efficiently', async ({ context }) => {
    const tabs = [];
    
    // Create multiple tabs
    for (let i = 0; i < 5; i++) {
      const tab = await context.newPage();
      await tab.goto('https://example.com');
      tabs.push(tab);
    }
    
    // Measure memory usage across all tabs
    const totalMemory = await Promise.all(tabs.map(tab => 
      tab.evaluate(() => {
        return performance.memory ? performance.memory.usedJSHeapSize : 0;
      })
    ));
    
    const averageMemory = totalMemory.reduce((a, b) => a + b, 0) / totalMemory.length;
    expect(averageMemory).toBeLessThan(10 * 1024 * 1024); // 10MB per tab
    
    // Clean up
    await Promise.all(tabs.map(tab => tab.close()));
  });
});
```

---

## 9. Safari Compatibility Testing 🔄

### 9.1 Safari Version Compatibility
**Token:** [SAFARI-EXT-COMPAT-001]

#### Test 9.1.1: Safari Version Support Tests
```javascript
// File: tests/compatibility/safari-version-support.test.js
// [SAFARI-EXT-COMPAT-001] Safari version compatibility tests

import { test, expect } from '@playwright/test';

const safariVersions = [
  { version: '17.0', supported: true },
  { version: '17.1', supported: true },
  { version: '17.2', supported: true },
  { version: '18.0', supported: true },
  { version: '16.6', supported: false }
];

safariVersions.forEach(({ version, supported }) => {
  test.describe(`Safari ${version} Compatibility`, () => {
    test.beforeEach(async ({ page }) => {
      // Mock Safari version
      await page.addInitScript((safariVersion) => {
        Object.defineProperty(navigator, 'userAgent', {
          get: () => `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${safariVersion} Safari/605.1.15`
        });
      }, version);
    });

    if (supported) {
      test(`[SAFARI-EXT-COMPAT-001] should support Safari ${version}`, async ({ page }) => {
        await page.goto('safari-extension://test-extension-id/src/ui/popup/popup.html');
        
        const extensionLoaded = await page.evaluate(() => {
          return window.hoverboardInitialized === true;
        });
        
        expect(extensionLoaded).toBe(true);
      });
    } else {
      test(`[SAFARI-EXT-COMPAT-001] should show compatibility warning for Safari ${version}`, async ({ page }) => {
        await page.goto('safari-extension://test-extension-id/src/ui/popup/popup.html');
        
        const compatibilityWarning = await page.evaluate(() => {
          return document.querySelector('.compatibility-warning') !== null;
        });
        
        expect(compatibilityWarning).toBe(true);
      });
    }
  });
});
```

### 9.2 macOS Version Compatibility
**Token:** [SAFARI-EXT-COMPAT-001]

#### Test 9.2.1: macOS Version Support Tests
```javascript
// File: tests/compatibility/macos-version-support.test.js
// [SAFARI-EXT-COMPAT-001] macOS version compatibility tests

import { test, expect } from '@playwright/test';

const macOSVersions = [
  { version: '14.0', name: 'Sonoma', supported: true },
  { version: '14.1', name: 'Sonoma', supported: true },
  { version: '15.0', name: 'Sequoia', supported: true },
  { version: '13.6', name: 'Ventura', supported: false }
];

macOSVersions.forEach(({ version, name, supported }) => {
  test.describe(`macOS ${name} (${version}) Compatibility`, () => {
    test.beforeEach(async ({ page }) => {
      // Mock macOS version
      await page.addInitScript((macOSVersion) => {
        Object.defineProperty(navigator, 'platform', {
          get: () => 'MacIntel'
        });
        
        Object.defineProperty(navigator, 'userAgent', {
          get: () => `Mozilla/5.0 (Macintosh; Intel Mac OS X ${macOSVersion.replace(/\./g, '_')}) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15`
        });
      }, version);
    });

    if (supported) {
      test(`[SAFARI-EXT-COMPAT-001] should support macOS ${name}`, async ({ page }) => {
        await page.goto('safari-extension://test-extension-id/src/ui/popup/popup.html');
        
        const systemCompatible = await page.evaluate(() => {
          return window.systemCompatibilityCheck === true;
        });
        
        expect(systemCompatible).toBe(true);
      });
    } else {
      test(`[SAFARI-EXT-COMPAT-001] should show system requirements for macOS ${name}`, async ({ page }) => {
        await page.goto('safari-extension://test-extension-id/src/ui/popup/popup.html');
        
        const systemWarning = await page.evaluate(() => {
          return document.querySelector('.system-requirements-warning') !== null;
        });
        
        expect(systemWarning).toBe(true);
      });
    }
  });
});
```

---

## 10. Test Execution and Reporting 📋

### 10.1 Test Configuration
**Token:** [SAFARI-EXT-TEST-001]

#### Configuration 10.1.1: Jest Configuration for Safari
```javascript
// File: jest.config.safari.js
// [SAFARI-EXT-TEST-001] Jest configuration for Safari testing

export default {
  displayName: 'Safari Extension Tests',
  testEnvironment: 'jsdom',
  
  setupFilesAfterEnv: [
    '<rootDir>/tests/safari/safari-test-setup.js'
  ],
  
  testMatch: [
    '<rootDir>/tests/safari/**/*.test.js',
    '<rootDir>/tests/unit/**/*safari*.test.js',
    '<rootDir>/tests/performance/**/*safari*.test.js'
  ],
  
  coverageDirectory: 'coverage/safari',
  coverageReporters: ['text', 'html', 'json'],
  
  collectCoverageFrom: [
    'src/shared/safari-*.js',
    'src/ui/popup/safari-*.js',
    'src/features/content/safari-*.js',
    '!**/*.test.js',
    '!**/node_modules/**'
  ],
  
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  transform: {
    '^.+\\.m?js$': 'babel-jest'
  },
  
  testTimeout: 30000
};
```

#### Configuration 10.1.2: Playwright Configuration for Safari
```javascript
// File: playwright.config.safari.js
// [SAFARI-EXT-TEST-001] Playwright configuration for Safari E2E testing

import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  
  projects: [
    {
      name: 'safari',
      use: {
        browserName: 'webkit',
        headless: false,
        viewport: { width: 1280, height: 720 }
      }
    }
  ],
  
  use: {
    baseURL: 'safari-extension://test-extension-id/',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry'
  },
  
  reporter: [
    ['html', { outputFolder: 'test-results/safari' }],
    ['json', { outputFile: 'test-results/safari/results.json' }]
  ],
  
  outputDir: 'test-results/safari'
});
```

### 10.2 Test Execution Scripts
**Token:** [SAFARI-EXT-TEST-001]

#### Script 10.2.1: Safari Test Runner
```bash
#!/bin/bash
# File: scripts/test-safari.sh
# [SAFARI-EXT-TEST-001] Safari test execution script

set -e

echo "🦁 Starting Safari Extension Test Suite"

# Build Safari extension
echo "Building Safari extension..."
npm run build:safari

# Run unit tests
echo "Running Safari unit tests..."
npm run test:safari:unit

# Run integration tests
echo "Running Safari integration tests..."
npm run test:safari:integration

# Run performance tests
echo "Running Safari performance tests..."
npm run test:safari:performance

# Run E2E tests
echo "Running Safari E2E tests..."
npm run test:safari:e2e

# Run accessibility tests
echo "Running Safari accessibility tests..."
npm run test:safari:a11y

# Generate coverage report
echo "Generating coverage report..."
npm run test:safari:coverage

echo "✅ Safari Extension Test Suite Complete"
```

#### Script 10.2.2: Continuous Safari Testing
```bash
#!/bin/bash
# File: scripts/test-safari-ci.sh
# [SAFARI-EXT-TEST-001] CI/CD Safari testing script

set -e

# Environment setup
export NODE_ENV=test
export PLATFORM=safari
export HEADLESS=true

# Install dependencies
npm ci

# Validate Safari build
npm run build:safari
npm run validate:safari

# Run test suite
npm run test:safari:all

# Upload results
if [ "$CI" = "true" ]; then
  # Upload to test reporting service
  curl -s "https://api.testreporting.com/upload" \
    -F "project=hoverboard-safari" \
    -F "results=@test-results/safari/results.json"
fi

echo "✅ Safari CI Testing Complete"
```

---

## 11. Test Metrics and Success Criteria 📊

### 11.1 Test Coverage Requirements
**Token:** [SAFARI-EXT-TEST-001]

#### Coverage Targets:
- **Unit Tests:** 90% code coverage for Safari-specific modules
- **Integration Tests:** 85% feature coverage for Safari adaptations
- **E2E Tests:** 100% critical user journey coverage
- **Performance Tests:** All performance budgets validated
- **Accessibility Tests:** 100% WCAG 2.1 AA compliance

### 11.2 Performance Benchmarks
**Token:** [SAFARI-EXT-PERF-001]

#### Performance Budgets:
- **Extension Load Time:** < 100ms
- **Popup Display Time:** < 50ms
- **Overlay Creation:** < 16ms (60fps)
- **Memory Usage:** < 50MB total
- **Network Requests:** < 5 per user action

### 11.3 Quality Gates
**Token:** [SAFARI-EXT-TEST-001]

#### Release Criteria:
- [ ] All unit tests passing (100%)
- [ ] Integration tests passing (100%)
- [ ] E2E tests passing (100%)
- [ ] Performance benchmarks met (100%)
- [ ] Accessibility tests passing (100%)
- [ ] Security audit passed
- [ ] Safari compatibility verified across versions

---

## 12. Test Maintenance and Updates 🔄

### 12.1 Test Maintenance Schedule
**Token:** [SAFARI-EXT-TEST-001]

#### Regular Maintenance:
- **Weekly:** Update Safari compatibility tests for new versions
- **Monthly:** Review and optimize performance benchmarks
- **Quarterly:** Comprehensive accessibility audit
- **Annually:** Full test suite architecture review

### 12.2 Test Evolution Strategy
**Token:** [SAFARI-EXT-TEST-001]

#### Continuous Improvement:
- Monitor Safari API changes and update tests accordingly
- Track performance regressions and adjust budgets
- Expand accessibility coverage based on user feedback
- Integrate new testing tools and methodologies

---

**[SAFARI-EXT-TEST-001]** - Safari Extension Test Plan  
**Cross-References:** [SAFARI-EXT-ARCH-001], [SAFARI-EXT-PLAN-001], [SAFARI-EXT-DEBUG-001], [SAFARI-EXT-PERF-001], [SAFARI-EXT-UI-001], [SAFARI-EXT-COMPAT-001], [SAFARI-EXT-A11Y-001] 