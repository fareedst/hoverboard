# Changelog

All notable changes to the Hoverboard Browser Extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- **Move bookmark UI and persistence** (`IMPL-MOVE_BOOKMARK_RESPONSE_AND_URL`) – Move-to-storage now updates the UI only when the move actually succeeds, and the stored bookmark is moved correctly:
  - **Popup uses inner result:** The service worker wraps handler responses as `{ success: true, data: routerResult }`. The popup now uses the inner result (`response.data`) for success/error, so failed moves (e.g. "Bookmark not found in source") show an error message instead of a false success.
  - **Move uses bookmark URL:** When sending a move request, the popup uses the current bookmark’s URL (`currentPin.url`) when available so the move key matches storage; this fixes moves failing when the tab URL differed (e.g. with or without query string).
  - **Router allows bookmark without time:** The router no longer requires `bookmark.time` to consider a bookmark valid for move; if `time` is missing, it is set when saving to the target so legacy or provider-returned bookmarks without time can be moved.

### Technical Details

- **Requirements:** `REQ-MOVE_BOOKMARK_STORAGE_UI` satisfaction criteria extended; new implementation decision `IMPL-MOVE_BOOKMARK_RESPONSE_AND_URL`.
- **Tests:** New unit test `moveBookmarkToStorage succeeds when bookmark has url but no time [IMPL-MOVE_BOOKMARK_RESPONSE_AND_URL]` in `bookmark-router.test.js`.

## [1.0.8] - 2026-02-13

### Changed

- **Default storage mode is now Local Storage** (`REQ-STORAGE_MODE_DEFAULT`) - Local storage is preferable for most users:
  - New installs and users without a saved storage preference use **local-only** bookmarks (no account or API required)
  - Pinboard remains available via **Options > Storage Mode > "Pinboard (cloud)"**
  - Existing users keep their current choice; stored `storageMode` is unchanged

### Added

- **Local Bookmarks Index** (`REQ-LOCAL_BOOKMARKS_INDEX`, `ARCH-LOCAL_BOOKMARKS_INDEX`, `IMPL-LOCAL_BOOKMARKS_INDEX`) - A dedicated full-page index of **locally stored bookmarks only**:
  - **Open from:** Popup footer ("Bookmarks index" button) or Options page ("Local bookmarks index" link); opens in a new tab
  - **Search:** Single text box over title, URL, tags, and notes (case-insensitive)
  - **Filter:** By tag (comma-separated include), "To read only", "Private only"
  - **Sort:** Click column headers (Title, URL, Tags, Time, Shared, To read); default sort is Time descending
  - **Launch:** URL column is a link that opens the page in a new tab
  - **Export:** "Export all" and "Export displayed" buttons download the current set (all local bookmarks or the filtered/sorted view) as CSV (`REQ-LOCAL_BOOKMARKS_INDEX_EXPORT`, `IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT`)
  - Data is **live** from `chrome.storage.local` via `getLocalBookmarksForIndex` (always uses LocalBookmarkService; not Pinboard). When storage mode is Pinboard, the index may be empty with an explanatory message
  - Implemented in `src/ui/bookmarks-table/` (HTML, JS, CSS); backend: `LocalBookmarkService.getAllBookmarks()`, message handler returns `{ bookmarks }`

- **Recent Tags refresh on popup display** (`IMPL-RECENT_TAGS_POPUP_REFRESH`) - Recent Tags list now refreshes every time the popup is displayed:
  - Popup listens for `document.visibilitychange` and refetches Recent Tags from the service worker when the popup becomes visible
  - Ensures the list is up to date even when the popup document is reused without a full reload
  - Tags saved in one browser window appear in the Recent Tags list when the popup or overlay is opened in this or any other window (shared state via service worker)
  - Overlay already refreshed recent tags on each show; no overlay code change required

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

### Documentation

- **README and TIED** - Dual storage (local default, optional Pinboard) is now documented:
  - README: local-first intro, Storage Mode in Options, Storage subsection, architecture note, prerequisites (Pinboard optional)
  - New requirement `REQ-STORAGE_MODE_DEFAULT`; architecture and implementation decisions updated with default choice and rationale
  - Unit tests for ConfigManager default `storageMode`, `getStorageMode`, and `setStorageMode` (see `tests/unit/config-manager.test.js`)

## [1.0.10] - 2026-02-14

### Added

- **Optional native messaging host** (`REQ-NATIVE_HOST_WRAPPER`, `ARCH-NATIVE_HOST`, `IMPL-NATIVE_HOST_WRAPPER`, `IMPL-NATIVE_HOST_INSTALLER`) – The extension can communicate with a native host for features that need local code (outside the browser sandbox). The host is a **thin wrapper** that does not run code from the extension folder; instead, an installer copies the wrapper and helper to a fixed path, and the wrapper runs only from that directory.
  - **Wrapper**: Go binary in `native_host/` implementing Chrome native messaging protocol (stdio, length-prefixed JSON). Responds to `ping` with `pong`; delegates other messages to a helper script in the same directory (`helper.sh` on macOS/Linux, `helper.ps1` or `helper.exe` on Windows).
  - **Installer**: `install.sh` (macOS/Linux) and `install.ps1` (Windows) copy the wrapper and helpers to `~/.hoverboard/` or `%LOCALAPPDATA%\Hoverboard\`, generate the native messaging manifest with the extension ID, and (on Windows) create the registry key for Chrome.
  - **Extension**: `nativeMessaging` permission; Options page has a "Native host" section with "Test native host" button; service worker handles `NATIVE_PING` and calls `pingNativeHost()`.
  - **Build**: `npm run build:native` builds the Go binary and copies artifacts to `dist/native_host/`.
  - **Tests**: Go tests in `native_host/main_test.go` (protocol read/write, findHelper, ping-pong integration); Jest tests in `tests/unit/native-host-ping.test.js` (NATIVE_PING handling and pingNativeHost).

### Technical Details

- **Manifest**: Added `nativeMessaging` to `permissions`.
- **Host name**: `com.hoverboard.native_host`; manifest template `com.hoverboard.native_host.json.template` with `{{PATH}}` and `{{ALLOWED_ORIGINS}}` placeholders.

---

## [1.0.9] - 2026-02-14

### Added

- **File-based bookmark storage** – Third storage backend: bookmarks in a **single file** (`hoverboard-bookmarks.json`) in a **user-chosen folder**. Important for **privacy** (data stays in a location you control, no third-party service) and **sharing** (e.g. put the folder in Dropbox/Drive for sync, or share the file with others). Options: "Select folder" (File System Access); directory handle stored in IndexedDB; offscreen document performs file read/write.

- **Per-bookmark storage** – Each bookmark is tagged with a storage method (Pinboard, Local, or File). A storage index maps URL → backend; **default storage for new bookmarks** is configurable in Options (three-way: Pinboard, Local, File). Bookmark operations are routed to the correct backend per URL.

- **Move bookmark between storages** – In the popup, a **Storage** control shows where the current bookmark is saved and lets you **move** it to Pinboard, Local, or File (copy to target, delete from source, update index).

- **Local bookmarks index: Storage column** – The index page now shows **local and file** bookmarks together, with a **Storage** column (Local | File). Uses `getAggregatedBookmarksForIndex`; CSV export includes Storage.

### Technical Details

- **StorageIndex** (`hoverboard_storage_index` in chrome.storage.local) maps URL → backend; **BookmarkRouter** delegates get/save/delete to Pinboard, Local, or File provider; **MessageFileBookmarkAdapter** and offscreen document for file I/O.

### Benefits

- **Privacy:** Keep bookmarks in a folder you control; no need to send data to Pinboard or any other service for file-backed bookmarks.
- **Sharing:** Use a cloud-synced folder to sync across devices, or share the single JSON file with others for ad-hoc collaboration.

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
