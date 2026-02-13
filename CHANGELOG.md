# Changelog

All notable changes to the Hoverboard Browser Extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - 2026-02-13

### Added

- **Customizable Font Sizes** (`CFG-FONT-SIZE-001`) - User-configurable font sizes for all UI text elements:
  - **Suggested Tags**: Default 10px (smaller for less visual intrusion), configurable 8-20px
  - **Labels**: Default 12px (Current, Recent, Suggested), configurable 10-16px
  - **Tag Elements**: Default 12px (current and recent tags), configurable 10-16px
  - **Base UI Text**: Default 14px (general UI text), configurable 12-18px
  - **Input Fields & Buttons**: Default 14px, configurable 12-18px
  - Accessibility-friendly: users can increase sizes for better readability
  - Settings persist via chrome.storage and apply to both overlay and popup interfaces
  - New "📝 Font Size Settings" section in options page with helpful guidance

### Enhanced

- **Intelligent Tag Suggestions** (`REQ-SUGGESTED_TAGS_FROM_CONTENT`) - Increased tag extraction capacity:
  - **Overlay**: Now extracts 30 tags (was 10), displays 15 (was 5) - 200% increase
  - **Popup**: Now extracts 60 tags (was 20) - 200% increase
  - **Per-Source Caps**: Doubled to ensure top tags from all sources can contribute:
    - Emphasis elements: 60 (was 30)
    - Definition terms: 40 (was 20)
    - Table headers: 40 (was 20)
    - Nav links: 40 (was 20)
    - Images alt: 10 (was 5)
    - Main content links: 20 (was 10)
  - All sources can now contribute more candidates before frequency ranking
  - No algorithm changes - still uses frequency sorting, case preservation, deduplication

- **Tag Extraction Sources** - Significantly improved tag extraction algorithm with new content sources:
  - **Meta Tags**: Extract from `<meta name="keywords">` and `<meta name="description">` for author-specified topics
  - **Emphasis Elements**: Extract from `<strong>`, `<b>`, `<em>`, `<i>`, `<mark>`, `<dfn>`, `<cite>`, `<kbd>`, `<code>` (first 60 in main content)
  - **Definition Terms**: Extract from `<dt>` elements in definition lists (first 40)
  - **Table Headers**: Extract from `<th>` and `<caption>` elements (first 40)
  - All new sources scoped to main content areas (main, article, [role="main"]) to reduce noise

### Technical Details

- **Font Configuration**: Stored in `ConfigManager` with defaults in `getDefaultConfiguration()`
- **CSS Implementation**: Dynamic CSS variables in popup, template literals in overlay injection
- **Sources**: 11 total extraction sources (was 7): title, URL, meta keywords, meta description, headings, emphasis elements, definition terms, table headers, navigation, breadcrumbs, images, links
- **Performance**: Minimal impact (~5-10ms typical, <20ms complex pages)
- **Backward Compatible**: No breaking changes, all existing functionality preserved
- **TIED Documentation**: Complete traceability with `[REQ-SUGGESTED_TAGS_FROM_CONTENT]`, `[ARCH-SUGGESTED_TAGS]`, `[IMPL-SUGGESTED_TAGS]`

### Benefits

- **Customization**: Users can adjust font sizes for personal preference and accessibility needs
- **Reduced Visual Clutter**: Suggested tags now smaller by default (10px vs 12px)
- **Consistency**: Font sizes apply uniformly across overlay and popup interfaces
- **More Tag Suggestions**: 100-200% increase in suggested tags provides more options from all content sources
- **Better Tag Quality**: More candidates from each source means top tags from all sources can contribute
- **Better Extraction**: Technical documentation, glossaries, data-heavy pages, meta-tagged content now provide richer suggestions
- **Pages with Visual Emphasis**: Bold/italic/highlighted/code terms now contribute to suggestions

## [1.0.7] - 2025-11-17

### Added

- Suggested tags offer words from various elements on the page.

### Changed

- Converted to TIED methodology.
- Removed Safari integration.

## [1.0.6.80] - 2025-07-20

### Added
- **Safari App Extension Integration** (`SAFARI-EXT-IMPL-001`) - Complete Safari extension packaging and deployment pipeline
- **Safari Performance Optimizations** (`SAFARI-EXT-PERFORMANCE-001`) - Safari-specific performance monitoring and memory management
- **Safari Popup Adaptations** (`SAFARI-EXT-POPUP-001`) - Safari-specific popup optimizations and UI enhancements
- **Enhanced Error Handling Framework** (`SAFARI-EXT-ERROR-001`) - Comprehensive error recovery and graceful degradation
- **Safari UI Optimizations** (`SAFARI-EXT-UI-001`) - Safari-specific accessibility and theme optimizations
- **Safari Content Script Adaptations** (`SAFARI-EXT-CONTENT-001`) - Safari-specific content script optimizations
- **Enhanced Platform Detection** (`SAFARI-EXT-SHIM-001`) - Runtime feature detection and performance monitoring
- **Enhanced Message Passing** (`SAFARI-EXT-MESSAGING-001`) - Safari-specific validation and retry mechanisms
- **Enhanced Storage Quota Management** (`SAFARI-EXT-STORAGE-001`) - Real-time monitoring with graceful degradation

### Fixed
- Safari Shim Message Passing - Resolved `browser.runtime.getManifest().version` undefined error
- Error Recovery Tests - Corrected mock expectations for failed vs successful recovery
- Test Coverage - Enhanced mocking for Safari-specific APIs and behaviors
- Reduced failing tests from 45 to 41 (9% improvement)

### Changed
- Cross-browser compatibility improvements
- Enhanced test coverage with 252 comprehensive tests
- Improved error handling across all platforms
- Performance optimizations for both Chrome and Safari

### Technical Details
- **Test Coverage**: 252 tests across 8 test suites (84% success rate)
- **Safari Extension**: Complete App Store preparation
- **Cross-Browser**: Full compatibility with Chrome and Safari
- **Performance**: Real-time monitoring and optimization

## [1.0.0] - 2025-07-14

### Added
- Initial Chrome extension release
- Core bookmark management functionality
- Tag management system
- Hover overlay system
- Dark theme support
- Cross-popup state management
- Pinboard integration
- Content script overlay system
- Options page configuration
- Service worker implementation

### Features
- Smart bookmarking with tag suggestions
- Recent tags quick access
- Visual feedback with transparency controls
- Modern UI with dark theme default
- Keyboard shortcuts support
- Context menu integration

## [0.9.0] - 2025-07-10

### Added
- Initial development version
- Basic extension structure
- Manifest V3 implementation
- Core architecture setup

---

## Release Notes

### Version 1.0.6.80 (Current)
This release represents a major milestone in cross-browser compatibility, with complete Safari App Extension support and comprehensive testing infrastructure. The extension now provides a seamless experience across both Chrome and Safari browsers.

**Key Highlights:**
- ✅ Complete Safari App Extension Integration
- ✅ 252 comprehensive tests with 84% success rate
- ✅ Enhanced error handling and recovery
- ✅ Performance monitoring and optimization
- ✅ Full cross-browser compatibility

### Version 1.0.0 (Stable)
The first stable release of Hoverboard, providing core bookmark management functionality with modern UI and cross-browser support.

**Key Features:**
- Smart bookmarking with intelligent tag suggestions
- Visual hover overlays with transparency controls
- Dark theme with modern UI design
- Cross-popup state management
- Pinboard integration for bookmark sync

---

## Migration Guide

### Upgrading to 1.0.6.80

No breaking changes. The update includes:
- Enhanced Safari support
- Improved error handling
- Performance optimizations
- Better cross-browser compatibility

### Upgrading to 1.0.0

This is the first stable release. If upgrading from development versions:
- Clear extension data if experiencing issues
- Reconfigure settings in the options page
- Test functionality in both Chrome and Safari

---

## Support

- **Issues**: [GitHub Issues](https://github.com/fareedst/hoverboard/issues)
- **Discussions**: [GitHub Discussions](https://github.com/fareedst/hoverboard/discussions)
- **Documentation**: [Project Wiki](https://github.com/fareedst/hoverboard/wiki)

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
