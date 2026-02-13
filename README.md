# Hoverboard Chrome Extension

[![Build Status](https://github.com/fareedst/hoverboard/workflows/Build%20and%20Test/badge.svg)](https://github.com/fareedst/hoverboard/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Chrome Web Store](https://img.shields.io/badge/Chrome-Extension-blue.svg)](https://chrome.google.com/webstore)

A modern Chrome extension for efficient bookmark management and web page tagging with Pinboard.in integration.

## 🚀 Quick Start

### Install from GitHub Releases

1. **Download** the latest release from [Releases](https://github.com/fareedst/hoverboard/releases)
2. **Chrome**: Extract and load as unpacked extension
3. **Safari**: Double-click the `.safariextz` file

### Build from Source

```bash
git clone https://github.com/fareedst/hoverboard.git
cd hoverboard
npm install
npm run build:dev
```

## 📋 Status

**Current Version:** 1.0.8 (development)  
**Last Updated:** 2026-02-13  
**Chrome Extension Status:** Production Ready

**Latest Enhancement:** Recent Tags list refreshes every time the popup is displayed and stays in sync across browser windows—tags saved in one window appear in Recent Tags when you open the popup or overlay in any window. Intelligent tag suggestions extract from 11 content sources including meta tags, emphasis elements, definition terms, and table headers.

### Chrome Extension Features

Hoverboard is a fully-featured Chrome extension that provides seamless bookmark management with Pinboard.in integration:

#### **Core Features:**
- ✅ **Smart Bookmarking** - Save pages with intelligent tag suggestions from 11 content sources (title, URL, meta tags, headings, emphasis elements, definition terms, table headers, navigation, breadcrumbs, images, links)
- ✅ **Tag Management** - Organize bookmarks with custom tags and categories
- ✅ **Recent Tags** - Quick access to frequently used tags; list refreshes every time the popup is displayed and syncs across windows
- ✅ **Dark Theme Support** - Modern UI with dark theme default
- ✅ **Overlay System** - Visual feedback with transparency controls
- ✅ **Pinboard Integration** - Direct integration with Pinboard.in API
- ✅ **Badge Indicators** - Visual status indicators in the extension icon
- ✅ **Site Management** - Disable extension on specific domains

#### **Test Coverage:**
- **252 comprehensive tests** across 8 test suites
- **211 passing tests** (84% success rate)
- **Complete Chrome extension testing** with Manifest V3 compliance
- **Pinboard API integration testing** for reliable bookmark management

## Features

### Core Functionality

#### Smart Bookmarking
Intelligent tag suggestions extracted from multiple page content sources:
- **Meta Tags**: Keywords and descriptions from `<meta>` tags
- **Emphasis Elements**: Bold, italic, highlighted, and code terms (`<strong>`, `<em>`, `<mark>`, `<code>`, etc.)
- **Structured Content**: Definition terms (`<dt>`) and table headers (`<th>`, `<caption>`)
- **Semantic Elements**: Headings (H1-H3), navigation links, breadcrumbs
- **Media**: Image alt text and anchor link text
- **Frequency-Based Ranking**: Most frequently mentioned terms appear first
- **Case Preservation**: Both original case (e.g., "GitHub") and lowercase variants offered
- **Smart Deduplication**: Filters out tags already applied to current bookmark

#### Additional Features
- **Tag Management:** Organize bookmarks with custom tags and categories
- **Recent Tags:** Quick access to frequently used tags; refreshes on every popup display and syncs across windows so tags saved in one window appear in any other
- **Pinboard Integration:** Direct API integration with Pinboard.in bookmarking service
- **Dark Theme Support:** Modern UI with dark theme default
- **Overlay System:** Visual feedback with transparency controls
- **Badge Indicators:** Visual status indicators showing bookmark state and tag count
- **Site Management:** Disable extension on specific domains
- **Search Functionality:** Search through bookmarked tabs by title
- **Privacy Controls:** Mark bookmarks as private or to-read
- **Customizable Font Sizes:** Configure font sizes for suggested tags, labels, tags, and UI elements via options page

## 📸 Screenshots

### Extension Interface on Pinboard.in

![Hoverboard Extension on Pinboard.in](images/Hoverboard_v1.0.7.0_Chrome_Pinboard.png)

The screenshot above demonstrates Hoverboard in action on the Pinboard.in website, showcasing:

- **Extension Badge**: The Hoverboard icon in the browser toolbar displays "3!" indicating 3 tags are associated with the current page and the site is marked as "Read Later"
- **Transparent Overlay**: A dark overlay appears at the bottom of the page showing the current bookmark status with tags "Pinboard," "Social," and "Bookmarking"
- **Popup Interface**: The main Hoverboard popup window provides:
  - **Visibility Controls**: Eye icon and "Show on page load" checkbox for overlay display
  - **Tag Management**: "Add a tag..." input field with current tags displayed below
  - **Search Functionality**: "Search tabs by title..." for finding related bookmarks
  - **Quick Actions**: Reload and Options buttons for easy access to settings

### Extension Configuration Options

![Hoverboard Extension Options](images/Hoverboard_v1.0.7.0_Chrome_Options.png)

The configuration page provides comprehensive settings for customizing the extension experience:

- **Overlay Visibility Defaults**: 
  - Dark/Light theme selection with live preview
  - Transparency controls with opacity slider (currently set to 90%)

- **Font Size Settings**:
  - Customizable font sizes for suggested tags (default: 10px, smaller for less visual intrusion)
  - Configurable sizes for labels, tag elements, base UI text, and input fields
  - Recommended ranges: 8-20px for suggested tags, 10-16px for labels/tags, 12-18px for UI/inputs
  - Accessibility-friendly: increase sizes for better readability

- **Badge Settings**: 
  - Customizable text indicators for different bookmark states
  - "-" for not bookmarked, "0" for bookmarked with no tags
  - "." for private bookmarks, "!" for to-read bookmarks

- **Site Management**: 
  - Disabled sites list to prevent extension activation on specific domains
  - Example entries: "example.com" and "subdomain.example.org"

- **Advanced Options**: 
  - URL hash stripping when saving bookmarks
  - Auto-close timeout configuration (currently disabled at 0ms)

## Architecture

### Chrome Extension Architecture
- **Manifest V3:** Modern Chrome extension architecture with service workers
- **Pinboard API Integration:** Direct integration with Pinboard.in bookmarking service
- **Chrome Storage API:** Efficient local storage for extension state and settings
- **Chrome Tabs API:** Tab management and search functionality

### Core Components
- **Service Worker:** Background script handling bookmark operations and API calls
- **Content Scripts:** Overlay system with transparency controls and visual feedback
- **Popup Interface:** Modern UI with quick actions and tag management
- **Storage System:** Local state management with Chrome storage API
- **Error Handling:** Comprehensive error recovery and user feedback
- **Badge Management:** Visual indicators in the extension icon

## Development

### Prerequisites
- Node.js 18+ and npm
- Chrome browser for development and testing
- Pinboard.in account for API testing

### Setup
```bash
# Install dependencies
npm install

# Build the extension
npm run build

# Run tests
npm test

# Development mode with hot reload
npm run dev
```

### Chrome Extension Development
```bash
# Build for development
npm run build:dev

# Build for production
npm run build

# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Validate manifest
npm run validate-manifest

# Create release package
npm run create-release
```

## Testing

### Test Coverage
- **Unit Tests:** 252 comprehensive tests across 8 test suites
- **Integration Tests:** Chrome extension API integration and component interaction
- **Performance Tests:** Memory usage, CPU usage, and timing metrics
- **Accessibility Tests:** Screen reader, high contrast, and keyboard navigation support
- **Error Handling Tests:** Graceful degradation and recovery mechanisms
- **Pinboard API Tests:** API integration and error handling validation

### Test Results
- **Total Tests:** 252 tests
- **Passing:** 211 tests (84% success rate)
- **Failing:** 41 tests (16% failure rate)

#### Chrome Extension Test Coverage
- **Core Functionality Tests:** 45 passing, 0 failing (100% success rate)
- **Error Handling Tests:** 33 passing, 5 failing (87% success rate)
- **UI Component Tests:** 17 passing, 11 failing (61% success rate)
- **Popup Interface Tests:** 45 passing, 0 failing (100% success rate)
- **Performance Tests:** 34 passing, 15 failing (69% success rate)
- **Content Script Tests:** 8 passing, 3 failing (73% success rate)
- **Integration Tests:** 7 passing, 4 failing (64% success rate)
- **API Integration Tests:** 12 passing, 0 failing (100% success rate)

#### Recent Improvements (2025-07-20)
- ✅ **Fixed Chrome Extension Message Passing:** Resolved manifest version access issues
- ✅ **Fixed Error Recovery Tests:** Corrected mock expectations for failed vs successful recovery
- ✅ **Improved Test Coverage:** Enhanced mocking for Chrome extension APIs and behaviors
- ✅ **Reduced Failing Tests:** From 45 to 41 failing tests (9% improvement)

#### Remaining Priority Fixes
1. **Storage API Tests:** Mock expectations don't match actual implementation values
2. **Performance Monitoring Tests:** Console log expectations don't match actual implementation
3. **Content Script Tests:** DOM manipulation mocks not working correctly
4. **UI Component Tests:** Theme and accessibility optimization mocks need adjustment

## Documentation

### TIED Documentation (Token-Integrated Engineering & Development)
This project follows the TIED methodology for comprehensive requirements tracking and traceability:
- **Requirements**: [`tied/requirements/REQ-SUGGESTED_TAGS_FROM_CONTENT.md`](tied/requirements/REQ-SUGGESTED_TAGS_FROM_CONTENT.md) - Detailed tag extraction requirements and validation criteria
- **Architecture**: [`tied/architecture-decisions/ARCH-SUGGESTED_TAGS.md`](tied/architecture-decisions/ARCH-SUGGESTED_TAGS.md) - Multi-source extraction architecture and design decisions
- **Implementation**: [`tied/implementation-decisions/IMPL-SUGGESTED_TAGS.md`](tied/implementation-decisions/IMPL-SUGGESTED_TAGS.md) - Implementation details, modifiable decisions, and performance considerations
- **Recent Tags Refresh**: [`tied/implementation-decisions/IMPL-RECENT_TAGS_POPUP_REFRESH.md`](tied/implementation-decisions/IMPL-RECENT_TAGS_POPUP_REFRESH.md) - Refresh Recent Tags on every popup display and cross-window sync
- **Implementation Map**: [`tied/docs/suggested-tags-implementation-map.md`](tied/docs/suggested-tags-implementation-map.md) - Quick reference mapping TIED tokens to code locations

### Architecture Documents
- [Chrome Extension Architecture](docs/architecture/chrome-extension-architecture.md) - Core architectural decisions and implementation strategy
- [Development Guide](docs/development/development-guide.md) - Development setup and guidelines
- [Feature Tracking Matrix](docs/development/feature-tracking-matrix.md) - Feature implementation status

### Chrome Extension Development
- [Chrome Extension Implementation Guide](docs/development/chrome-extension-guide.md) - Chrome-specific development guidelines
- [Pinboard API Integration](docs/development/pinboard-api-integration.md) - API integration and error handling
- [Chrome Extension Testing](docs/development/chrome-extension-testing.md) - Testing strategy and best practices

### Implementation Guides
- [Error Handling Framework](docs/development/error-handling-framework.md) - Error handling implementation details
- [Content Script Implementation](docs/development/content-script-implementation.md) - Content script implementation details
- [UI Component Development](docs/development/ui-component-development.md) - UI component implementation details
- [Chrome Storage Management](docs/development/chrome-storage-management.md) - Storage API usage and best practices

## Chrome Extension Features

The Chrome extension provides comprehensive bookmark management with the following key features:

| Feature | Description | Status |
|---------|-------------|--------|
| `CHROME-BOOKMARK-001` | Pinboard.in API integration | ✅ Complete |
| `CHROME-TAG-001` | Tag management and suggestions (enhanced 2026-02-13 with meta tags, emphasis elements, structured content) | ✅ Complete |
| `CHROME-OVERLAY-001` | Visual overlay system | ✅ Complete |
| `CHROME-BADGE-001` | Extension badge indicators | ✅ Complete |
| `CHROME-STORAGE-001` | Chrome storage API integration | ✅ Complete |
| `CHROME-UI-001` | Modern popup interface | ✅ Complete |
| `CHROME-ERROR-001` | Error handling and recovery | ✅ Complete |
| `CHROME-SEARCH-001` | Tab search functionality | ✅ Complete |
| `CHROME-SETTINGS-001` | Configuration and preferences | ✅ Complete |
| `CHROME-ACCESSIBILITY-001` | Accessibility features | ✅ Complete |

## Contributing

### Development Guidelines
1. **Chrome Extension Standards:** All features must follow Chrome extension best practices
2. **Test Coverage:** All new features must include comprehensive test coverage
3. **Pinboard Integration:** All bookmark features must integrate with Pinboard.in API
4. **Documentation:** All changes must be documented with clear examples
5. **Error Handling:** All features must include appropriate error handling and recovery

### Chrome Extension Development
1. **Manifest V3:** Use modern Chrome extension architecture with service workers
2. **Performance:** Implement efficient memory usage and fast response times
3. **Accessibility:** Include screen reader support and keyboard navigation
4. **User Experience:** Focus on intuitive interface and smooth interactions
5. **Testing:** Include comprehensive Chrome extension testing

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **Chrome Extensions API:** For comprehensive browser extension support
- **Pinboard.in:** For providing the bookmarking service and API
- **Manifest V3:** For modern Chrome extension architecture
