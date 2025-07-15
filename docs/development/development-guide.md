# 🛠️ Hoverboard Development Guide

## 📋 Overview

This guide provides comprehensive instructions for setting up your development environment, understanding the codebase, and contributing to the Hoverboard browser extension project.

## 🚀 Quick Start

### ⚡ Prerequisites

- **Node.js**: Version 18.0 or higher
- **npm**: Version 8.0 or higher  
- **Chrome/Chromium**: Latest stable version for testing
- **Git**: For version control

### 🔧 Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/hoverboard.git
cd hoverboard

# Install dependencies
npm install

# Set up development environment
npm run setup:dev

# Build the extension
npm run build:dev

# Start development mode with file watching
npm run dev
```

### 🎯 Load Extension in Browser

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked" 
4. Select the `dist/` directory from your project
5. The extension should now be loaded and visible in your toolbar

## 📁 Project Structure Deep Dive

### 🗂️ Directory Overview

```
hoverboard/
├── src-new/                 # Modern source code
│   ├── core/               # Core services and background scripts
│   ├── config/            # Configuration management
│   ├── features/          # Feature-specific modules
│   ├── ui/               # User interface components
│   └── shared/           # Shared utilities and constants
├── tests/                 # Testing infrastructure
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   ├── e2e/             # End-to-end tests
│   └── fixtures/        # Test data and mocks
├── docs/                 # Documentation
├── scripts/              # Build and utility scripts
├── dist/                # Built extension files
└── coverage/            # Test coverage reports
```

### 🔍 Key Files

- **`manifest.v3.json`**: Extension manifest (Manifest V3)
- **`package.json`**: Dependencies and scripts
- **`jest.config.js`**: Testing configuration
- **`.eslintrc.yml`**: Code quality rules
- **`src-new/config/config-manager.js`**: Configuration system

## 🧪 Development Workflow

### 🔄 Daily Development

```bash
# Start development mode (watches files for changes)
npm run dev

# Run linting
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Run unit tests
npm run test:unit

# Run tests in watch mode
npm run test:watch

# Check code quality
npm run quality:check
```

### 🏗️ Building

```bash
# Development build
npm run build:dev

# Production build (optimized)
npm run build:prod

# Clean build artifacts
npm run clean
```

### 🧪 Testing

```bash
# Run all tests
npm test

# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration  

# End-to-end tests
npm run test:e2e

# Coverage report
npm run test:coverage

# Continuous integration testing
npm run test:ci
```

## 🔧 Configuration

### ⚙️ Environment Variables

Create a `.env` file for local development:

```bash
# Development settings
NODE_ENV=development
DEBUG=true
SLOW_MO=100

# Testing settings  
CI=false
SCREENSHOT_ON_FAILURE=true

# API settings (for testing)
PINBOARD_API_URL=https://api.pinboard.in/v1
```

### 🎯 Extension Configuration

The extension uses a layered configuration system:

1. **Default values** in `config-manager.js`
2. **User settings** stored in Chrome storage
3. **Environment overrides** for development

```javascript
// Example configuration access
import { ConfigManager } from '@/config/config-manager.js';

const config = new ConfigManager();
const settings = await config.getConfig();
```

## 🧩 Architecture Guidelines

### 📦 Module Organization

Each feature should be self-contained:

```
features/bookmark/
├── bookmark-service.js      # Core business logic
├── bookmark-api.js         # API integration
├── bookmark-ui.js          # UI components
└── __tests__/             # Feature tests
    ├── bookmark-service.test.js
    └── bookmark-integration.test.js
```

### 🔄 Message Passing

**Critical Note:** The extension uses a hybrid approach for message passing to ensure cross-browser compatibility:

- **Service Workers:** Use native `chrome` API for all event listeners
- **Content Scripts/Popups:** Use Safari shim (`browser` API) for cross-browser compatibility

```javascript
// Service Worker (use native Chrome API)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  this.handleMessage(message, sender)
    .then(response => {
      sendResponse(response)
    })
    .catch(error => {
      sendResponse({ success: false, error: error.message })
    })
  return true // Keep message port alive for async response
});

// Content Script (use Safari shim for cross-browser compatibility)
const response = await browser.runtime.sendMessage({
  type: 'GET_BOOKMARK_STATUS',
  payload: { url: 'https://example.com' }
});
```

**Related Documentation:** [Messaging Fixes Summary](../troubleshooting/messaging-fixes-2025-07-15.md)
    handleBookmarkStatusRequest(message.payload);
  }
});
```

### 💾 Storage Patterns

Use the storage abstraction layer:

```javascript
import { ConfigManager } from '@/config/config-manager.js';

const config = new ConfigManager();

// Get configuration
const settings = await config.getConfig();

// Update configuration
await config.updateConfig({ newSetting: 'value' });

// Get authentication
const token = await config.getAuthToken();
```

## 🎨 UI Development

### 🎭 Design System

Follow the established design patterns:

```css
/* Color variables */
:root {
  --color-primary: #1E40AF;
  --color-secondary: #374151;
  --color-success: #059669;
  --color-warning: #D97706;
  --color-error: #DC2626;
}

/* Spacing scale */
.spacing-1 { margin: 0.25rem; }
.spacing-2 { margin: 0.5rem; }
.spacing-3 { margin: 0.75rem; }
/* ... */
```

### 📱 Responsive Components

Create components that work in different contexts:

```javascript
class HoverOverlay {
  constructor(options) {
    this.maxWidth = options.maxWidth || 320;
    this.position = options.position || 'auto';
  }
  
  render() {
    // Adapt to context (popup vs content script)
    const isPopup = window.location.protocol === 'chrome-extension:';
    // ... responsive logic
  }
}
```

## 🧪 Testing Guidelines

### 🔬 Unit Testing

Write tests for individual components:

```javascript
// tests/unit/config-manager.test.js
import { ConfigManager } from '@/config/config-manager.js';

describe('ConfigManager', () => {
  let configManager;
  
  beforeEach(() => {
    configManager = new ConfigManager();
    // Mock chrome APIs
    global.chrome.storage.sync.get = jest.fn();
  });
  
  test('should get default configuration', () => {
    const config = configManager.getDefaultConfiguration();
    expect(config).toHaveProperty('hoverShowRecentTags', true);
  });
});
```

### 🔗 Integration Testing

Test component interactions:

```javascript
// tests/integration/bookmark-workflow.integration.test.js
describe('Bookmark Workflow', () => {
  test('should save bookmark with tags', async () => {
    // Mock API responses
    global.fetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('done')
    });
    
    // Test complete workflow
    const result = await bookmarkService.saveBookmark({
      url: 'https://example.com',
      tags: 'test javascript'
    });
    
    expect(result.success).toBe(true);
  });
});
```

### 🎭 E2E Testing

Test user journeys:

```javascript
// tests/e2e/extension-e2e.test.js
describe('Extension E2E', () => {
  test('should load and display popup', async () => {
    const browser = await puppeteer.launch(testConfig);
    const page = await browser.newPage();
    
    // Test extension loading
    const extensionId = await e2eUtils.waitForExtension(browser);
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    
    // Test UI interactions
    expect(await page.title()).toContain('Hoverboard');
  });
});
```

## 🚀 Deployment

### 📦 Build Process

The build process includes:

1. **Linting**: Code quality checks
2. **Testing**: Full test suite
3. **Bundling**: Optimize for production
4. **Validation**: Manifest and permissions check
5. **Packaging**: Create extension zip

```bash
# Full production build
npm run build:prod

# Package for Chrome Web Store
npm run package
```

### 🔍 Quality Gates

Before deployment, ensure:

- ✅ All tests passing
- ✅ 80%+ code coverage
- ✅ No linting errors
- ✅ Security audit clean
- ✅ Manifest validation passes

```bash
# Run all quality checks
npm run quality:check
```

## 🔧 Debugging

### 🐛 Extension Debugging

1. **Service Worker**: 
   - Go to `chrome://extensions/`
   - Click "Inspect views: service worker"

2. **Content Scripts**:
   - Open page DevTools
   - Content scripts appear in Sources tab

3. **Popup/Options**:
   - Right-click extension icon → "Inspect popup"
   - Or visit `chrome://extensions/` → Details → "Inspect views"

### 📊 Logging

Use structured logging:

```javascript
// Shared logger utility
class Logger {
  static debug(message, data = {}) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${message}`, data);
    }
  }
  
  static error(message, error = null) {
    console.error(`[ERROR] ${message}`, error);
    // Send to error tracking service in production
  }
}

// Usage
Logger.debug('Fetching bookmark status', { url });
Logger.error('API request failed', error);
```

### 🔍 Performance Profiling

Use Chrome DevTools to profile:

```javascript
// Performance markers
performance.mark('bookmark-fetch-start');
await fetchBookmark(url);
performance.mark('bookmark-fetch-end');

performance.measure(
  'bookmark-fetch', 
  'bookmark-fetch-start', 
  'bookmark-fetch-end'
);
```

## 🤝 Contributing

### 🌟 Code Style

- Use ES6+ features and modules
- Follow functional programming principles where possible
- Write self-documenting code with clear variable names
- Include JSDoc comments for public APIs

```javascript
/**
 * Retrieves bookmark status for a given URL
 * @param {string} url - The URL to check
 * @param {Object} options - Additional options
 * @param {boolean} options.useCache - Whether to use cached results
 * @returns {Promise<BookmarkStatus>} Bookmark status object
 */
async function getBookmarkStatus(url, options = {}) {
  // Implementation...
}
```

### 🔄 Git Workflow

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** changes: `git commit -m 'Add amazing feature'`
4. **Test** your changes: `npm run test:ci`
5. **Push** to branch: `git push origin feature/amazing-feature`
6. **Create** a Pull Request

### 📝 Commit Messages

Follow conventional commit format:

```
type(scope): brief description

More detailed description if needed.

Fixes #123
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### 🧪 Pre-commit Hooks

Husky runs quality checks before commits:

```bash
# Install git hooks
npm run prepare

# Hooks will run automatically on commit
git commit -m "feat: add new feature"
```

## 🆘 Troubleshooting

### Common Issues

**Extension not loading:**
- Check console for errors in `chrome://extensions/`
- Verify manifest.json syntax
- Ensure all file paths are correct

**Tests failing:**
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version compatibility
- Verify test environment setup

**Build issues:**
- Clean build artifacts: `npm run clean`
- Check for conflicting global packages
- Verify all dependencies are installed

### 🏥 Getting Help

- **Issues**: Report bugs on GitHub Issues
- **Discussions**: Join GitHub Discussions for questions
- **Documentation**: Check existing docs first
- **Code Review**: Request review for complex changes

## 📚 Additional Resources

- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Guide](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)
- [Puppeteer E2E Testing](https://pptr.dev/)
- [ESLint Configuration](https://eslint.org/docs/user-guide/configuring/)

## 🎯 Next Steps

1. **Set up your development environment** following the Quick Start
2. **Explore the codebase** starting with `src-new/config/config-manager.js`
3. **Run the test suite** to understand the current functionality
4. **Make a small change** and test the development workflow
5. **Read the Architecture documentation** for deeper understanding

Happy coding! 🚀 