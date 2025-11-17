### 11. Popup Session Persistence Implementation [IMPL:POPUP_SESSION] [ARCH:POPUP_SESSION] [REQ:POPUP_PERSISTENT_SESSION]

**Decision**: Keep the popup open across every action by routing UI events through `PopupController` handlers that await async work, mutate `StateManager`, update `UIManager`, and explicitly avoid `window.close`. Overlay toggles interpret tab responses, issue `GET_OVERLAY_STATE` probes when responses omit `isVisible`, and update button text/ARIA metadata; privacy/read-later/delete/reload/options handlers surface inline notifications rather than closing the window.

**Rationale**:
- Preserves multi-action workflows validated by `popup-close-behavior` tests
- Ensures overlay button reflects actual visibility even when toggle responses are partial
- Centralizes accessibility metadata updates for assistive technologies

### Implementation Approach:
- `src/ui/popup/PopupController.js`
  - `handleShowHoverboard()` dispatches `TOGGLE_HOVER`, inspects `data.isVisible`, falls back to `GET_OVERLAY_STATE`, and calls `uiManager.updateShowHoverButtonState`
  - `handleTogglePrivate`, `handleReadLater`, `handleDeletePin`, `handleReloadExtension`, `handleOpenOptions` await service worker responses, call `uiManager.showSuccess/showError`, and never call `closePopup`
  - `chrome.runtime.onMessage` listener handles `BOOKMARK_UPDATED` by refreshing bookmark data and updating UI controls/tags
- `src/ui/popup/UIManager.js` – `updateShowHoverButtonState` adjusts icon/title/ARIA attributes while tolerating missing DOM nodes
- Tests: `tests/unit/popup-close-behavior.test.js`, `tests/unit/popup-live-data.test.js`

**Code Markers**: `PopupController.handleShowHoverboard`, `PopupController.handleTogglePrivate`, `UIManager.updateShowHoverButtonState`

**Cross-References**: [ARCH:POPUP_SESSION], [REQ:POPUP_PERSISTENT_SESSION]

---

### 12. Bookmark State Synchronization Implementation [IMPL:BOOKMARK_STATE_SYNC] [ARCH:BOOKMARK_STATE_SYNC] [REQ:BOOKMARK_STATE_SYNCHRONIZATION]

**Decision**: Standardize on `BOOKMARK_UPDATED` broadcasts where overlay toggle handlers persist changes via `messageService.sendMessage`, optimistically update overlay content, and emit normalized payloads that service worker, popup, and badge subsystems consume. PopupController listens for the broadcast, re-fetches authoritative bookmark data, updates `StateManager`, refreshes UI controls/tags, and displays toasts; badge logic compares popup data with injected tab data to detect mismatches, and tag add/remove flows reuse the same pathway.

**Rationale**:
- Prevents diverging private/read-later/tag state across UI surfaces
- Provides deterministic synchronization hooks for diagnostics and automated tests
- Enables future entry points (keyboard shortcuts, context menus) to reuse the same contract

### Implementation Approach:
- `src/features/content/overlay-manager.js` – toggle handlers call `messageService.sendMessage({ type: 'saveBookmark' })`, update `overlayManager.show()`, and dispatch `BOOKMARK_UPDATED`
- `src/ui/popup/PopupController.js` – runtime listener calls `getBookmarkData`, updates `StateManager`, refreshes UI controls, normalizes tags, and fires success notifications
- `src/core/badge-manager.js` – updates browser action badge state using incoming bookmark payloads
- Tests: `tests/unit/toggle-synchronization.test.js`, `tests/unit/popup-live-data.test.js`

**Code Markers**: `overlay-manager` toggle handlers, `PopupController` `chrome.runtime.onMessage` handler, `badge-manager.updateBadgeForTab`

**Cross-References**: [ARCH:BOOKMARK_STATE_SYNC], [REQ:BOOKMARK_STATE_SYNCHRONIZATION]

---

### 13. Overlay Control Layout Implementation [IMPL:OVERLAY_CONTROLS] [ARCH:OVERLAY_CONTROLS] [REQ:OVERLAY_CONTROL_LAYOUT]

**Decision**: Build overlay close/refresh controls with helper functions that set deterministic inline styles (`top: 8px`, `left: 8px/40px`, `position: absolute`), enforce 24px minimum touch targets, and use theme CSS variables for colors/borders, while wiring ARIA metadata, keyboard handlers, and diagnostic logging for missing nodes.

**Rationale**:
- Guarantees accessible, predictable control placement aligned with `[REQ:OVERLAY_REFRESH_ACTION]`
- Simplifies regression tests that assert spacing and styling
- Prevents host-page CSS from shifting critical controls

### Implementation Approach:
- `src/features/content/overlay-manager.js`
  - `createCloseButton`/`createRefreshButton` set `style.cssText`, `title`, `aria-label`, `role`, `tabindex`, and `keydown` handlers
  - Buttons share styling constants to maintain 32px spacing and theme awareness; missing overlay nodes log warnings instead of throwing
- Tests: `tests/unit/overlay-close-button-positioning.test.js`, `tests/unit/overlay-refresh-button.test.js`

**Code Markers**: `overlay-manager.createCloseButton`, `overlay-manager.createRefreshButton`

**Cross-References**: [ARCH:OVERLAY_CONTROLS], [REQ:OVERLAY_CONTROL_LAYOUT]

---

### 14. Safari Adaptive Implementation [IMPL:SAFARI_ADAPTATION] [ARCH:SAFARI_ADAPTATION] [REQ:SAFARI_ADAPTATION]

**Decision**: Apply Safari-specific adaptations across the shim, content scripts, and error handling: platform detection chooses Safari config (timeouts, retries, opacity) before initialization; content scripts call `getSafariConfig`, `optimizeSafariAnimations`, `optimizeSafariMemory`, and performance monitors; Safari ErrorHandler tracks recovery attempts, toggles degraded mode, and categorizes messaging/storage/UI/performance failures; messaging payloads include Safari sender metadata and retry semantics tailored for WebKit.

**Rationale**:
- Maintains Hoverboard stability on Safari’s constrained WebExtension bridge
- Provides bounded recovery backed by telemetry for degraded mode transitions
- Matches Safari-specific unit suites enforcing these behaviors

### Implementation Approach:
- `src/shared/safari-shim.js`, `src/shared/utils.js` – platform detection helpers, Safari messaging retries, metadata injection
- `safari/src/shared/ErrorHandler.js` – Safari recovery state, degraded mode toggles, performance monitoring hooks
- Safari content bundles (`safari/src/features/...`) – configuration load, animation/memory optimization, overlay adjustments
- Tests: `tests/unit/safari-content-adaptations.test.js`, `tests/unit/safari-error-handling.test.js`, `tests/unit/safari-messaging.test.js`, `tests/unit/safari-performance.test.js`

**Code Markers**: `getSafariConfig`, `Safari ErrorHandler`, `safari-shim` message utilities

**Cross-References**: [ARCH:SAFARI_ADAPTATION], [REQ:SAFARI_ADAPTATION]

---
# Implementation Decisions

**STDD Methodology Version**: 1.0.0

## Overview
This document captures detailed implementation decisions for this project, including specific APIs, data structures, and algorithms. All decisions are cross-referenced with architecture decisions using `[ARCH:*]` tokens and requirements using `[REQ:*]` tokens for traceability.

## Template Structure

When documenting implementation decisions, use this format:

```markdown
## N. Implementation Title [IMPL:IDENTIFIER] [ARCH:RELATED_ARCHITECTURE] [REQ:RELATED_REQUIREMENT]

### Decision: Brief description of the implementation decision
**Rationale:**
- Why this implementation approach was chosen
- What problems it solves
- How it fulfills the architecture decision

### Implementation Approach:
- Specific technical details
- Code structure or patterns
- API design decisions

**Code Markers**: Specific code locations, function names, or patterns to look for

**Cross-References**: [ARCH:RELATED_ARCHITECTURE], [REQ:RELATED_REQUIREMENT]
```

## Notes

- All implementation decisions MUST be recorded here IMMEDIATELY when made
- Each decision MUST include `[IMPL:*]` token and cross-reference both `[ARCH:*]` and `[REQ:*]` tokens
- Implementation decisions are dependent on both architecture decisions and requirements
- DO NOT defer implementation documentation - record decisions as they are made

---

## Extracted Implementation Decisions from Existing Documentation

### 1. Pinboard API Service Implementation [IMPL:PINBOARD_API] [ARCH:PINBOARD_API] [REQ:PINBOARD_COMPATIBILITY] [REQ:SMART_BOOKMARKING]

**Decision**: Implement Pinboard API service using `Pb` class as main wrapper with `AuthSettings` for authentication management, supporting `/posts/get`, `/posts/recent`, `/posts/add`, `/posts/delete` endpoints, with rate limiting, retry logic for 429 status, and 401 authentication error handling.

**Rationale**:
- Class-based design provides encapsulation
- Separate auth class enables reuse
- Rate limiting prevents API abuse
- Error handling ensures reliability

**Implementation Approach**:
- `Pb` class wraps all API calls
- `AuthSettings` manages token storage and validation
- Retry logic with exponential backoff for rate limits
- Error handling with user-friendly messages

**Code Markers**: `src/bg/pinboard.js`, `src/bg/background.js` (auth portions)

**Cross-References**: [ARCH:PINBOARD_API], [REQ:PINBOARD_COMPATIBILITY], [REQ:SMART_BOOKMARKING]

---

### 2. Message Handling System Implementation [IMPL:MESSAGE_HANDLING] [ARCH:MESSAGE_HANDLING] [REQ:SMART_BOOKMARKING]

**Decision**: Implement centralized message routing system in service worker with 15+ message types including `msgBackReadCurrent`, `msgBackReadRecent`, `msgBackSaveTag`, `msgBackDeletePin`, `msgBackDeleteTag`, `msgBackInhibitUrlAppend`, using request/response pattern with Promise-based async handling.

**Rationale**:
- Centralized routing simplifies debugging
- Standardized message types ensure consistency
- Promise-based pattern enables modern async code
- Request/response enables error handling

**Implementation Approach**:
- Message handler in service worker
- Message type constants for consistency
- Request/response wrapper functions
- Error propagation and handling

**Code Markers**: `src/core/message-handler.js`, `src/bg/background.js` (message routing)

**Cross-References**: [ARCH:MESSAGE_HANDLING], [REQ:SMART_BOOKMARKING]

---

### 3. Content Script Injection Implementation [IMPL:CONTENT_SCRIPT] [ARCH:OVERLAY] [REQ:OVERLAY_SYSTEM]

**Decision**: Implement dynamic overlay injection using `displayHover()` for main overlay display logic, `makeSiteTagsRowElement()` for tag interface generation, `Overlay` class for overlay management, and `Buttoner` class for interactive button creation, with hover trigger system and configurable delays.

**Rationale**:
- Dynamic injection enables per-page customization
- Class-based design provides structure
- Configurable delays improve UX
- Hover trigger maintains non-intrusive behavior

**Implementation Approach**:
- Content script injection on all pages
- Hover event listeners with debouncing
- DOM manipulation for overlay creation
- Event handling for user interactions

**Code Markers**: `src/inject/inject.js`, `src/inject/hoverInjector.js`, `src/inject/in_overlay.js`

**Cross-References**: [ARCH:OVERLAY], [REQ:OVERLAY_SYSTEM]

---

### 4. Tag Service Implementation [IMPL:TAG_SYSTEM] [ARCH:TAG_SYSTEM] [REQ:RECENT_TAGS_SYSTEM] [REQ:TAG_MANAGEMENT] [REQ:TAG_INPUT_SANITIZATION]

**Decision**: Implement tag service with 5-minute TTL caching, tag suggestions algorithm, recent tags tracking in sync storage, tag frequency tracking, memory optimization for tag storage, automatic addition to Recent Tags list when tags are added to records, and centralized sanitization/validation that strips HTML, enforces safe characters, and caps tag length before persistence or UI display.

**Rationale**:
- Caching reduces API calls and improves performance
- Tag suggestions improve user productivity
- Sync storage enables cross-device tag history
- Memory optimization handles large tag sets
- Sanitization protects the overlay/UI from XSS and prevents corrupt data from syncing to Pinboard

**Implementation Approach**:
- Tag cache with TTL expiration
- Suggestion algorithm based on frequency and recency
- Recent tags stored in chrome.storage.sync
- Tag addition triggers Recent Tags update
- `TagService.sanitizeTag` removes HTML/special characters, enforces max length, and returns `null` for invalid tags; overlay/popup flows call it before save

**Code Markers**: `src/features/tagging/tag-service.js`, `src/bg/throttled_recent_tags.js`

**Cross-References**: [ARCH:TAG_SYSTEM], [REQ:RECENT_TAGS_SYSTEM], [REQ:TAG_MANAGEMENT], [REQ:TAG_INPUT_SANITIZATION]

---

### 5. Badge Management Implementation [IMPL:BADGE] [ARCH:BADGE] [REQ:BADGE_INDICATORS]

**Decision**: Implement badge management with dynamic badge text based on bookmark status (using "-" for not bookmarked, "0" for bookmarked with no tags, "." for private, "!" for to-read), color coding for different states, and tab-specific badge management.

**Rationale**:
- Badge text provides quick status feedback
- Color coding enhances visual recognition
- Tab-specific badges show per-page state
- Standardized text ensures consistency

**Implementation Approach**:
- Badge manager class in service worker
- Status calculation based on bookmark data
- Tab-specific badge updates
- Color coding based on state

**Code Markers**: `src/core/badge-manager.js`, `src/bg/background.js` (badge management)

**Cross-References**: [ARCH:BADGE], [REQ:BADGE_INDICATORS]

---

### 6. Configuration Management Implementation [IMPL:STORAGE] [ARCH:STORAGE] [REQ:CHROME_STORAGE_USAGE] [REQ:CONFIG_PORTABILITY]

**Decision**: Implement configuration management using ConfigManager class with structured configuration schema, authentication management for API token secure storage, URL inhibit system for site blocking, settings migration from V2 to V3, real-time configuration updates, and export/import flows that serialize settings, auth token, and inhibited URLs for safe transfer between profiles.

**Rationale**:
- Centralized config simplifies access
- Schema validation prevents errors
- Migration preserves user data
- Real-time updates improve responsiveness
- Export/import ensures users can migrate personalized setups without manual re-entry

**Implementation Approach**:
- ConfigManager class with validation
- chrome.storage.sync for user settings
- chrome.storage.local for temporary data
- Migration utility for V2 to V3 upgrade
- `exportConfig()` packages version, timestamp, settings snapshot, auth token, and normalized inhibit list; `importConfig()` handles partial payloads safely

**Code Markers**: `src/config/config-manager.js`, `src/shared/config.js`

**Cross-References**: [ARCH:STORAGE], [REQ:CHROME_STORAGE_USAGE], [REQ:CONFIG_PORTABILITY]

---

### 7. Service Worker Implementation [IMPL:SERVICE_WORKER] [ARCH:SERVICE_WORKER] [REQ:MANIFEST_V3_MIGRATION]

**Decision**: Implement Manifest V3 service worker with lifecycle management (install, activate, update event handlers), message routing integration, browser action and context menu integration, and modern async/await patterns replacing legacy callback-based code.

**Rationale**:
- Service workers are V3 requirement
- Lifecycle management ensures proper initialization
- Modern patterns improve maintainability
- Integration enables full extension functionality

**Implementation Approach**:
- Service worker entry point
- Event listeners for lifecycle events
- Message routing setup
- Browser API integration

**Code Markers**: `src/core/service-worker.js`, `chrome/src/core/service-worker.js`

**Cross-References**: [ARCH:SERVICE_WORKER], [REQ:MANIFEST_V3_MIGRATION]

---

### 8. Overlay Visibility Controls Implementation [IMPL:OVERLAY] [ARCH:OVERLAY] [REQ:OVERLAY_SYSTEM] [REQ:OVERLAY_AUTO_SHOW_CONTROL] [REQ:OVERLAY_REFRESH_ACTION]

**Decision**: Implement overlay visibility controls with VisibilityControls component providing theme toggle (light-on-dark / dark-on-light), transparency controls with 10-100% opacity slider, per-window customization (non-persistent), global default settings in ConfigManager, real-time preview of changes, configurable auto-show checkbox propagated through popup/options to content scripts, and an accessible in-overlay refresh control that re-fetches bookmark data without closing the overlay.

**Rationale**:
- User-controlled visibility improves UX
- Theme toggle improves accessibility
- Transparency controls provide customization
- Per-window settings enable flexibility
- Auto-show controls let users pre-open hover workflows while respecting inhibit/tag conditions
- Refresh control keeps overlay data synchronized with remote changes

**Implementation Approach**:
- VisibilityControls UI component
- ConfigManager backend with visibility defaults API
- Options page integration with real-time preview
- Per-window state management
- Popup/options checkbox updates `showHoverOnPageLoad`; ConfigManager broadcasts updates to tabs; content script gates auto-show via inhibit/tag logic
- Overlay adds refresh button with ARIA labeling, keyboard support, and message service hook to re-render data

**Code Markers**: `src/ui/components/VisibilityControls.js`, `src/ui/popup/PopupController.js`, `src/features/content/overlay-manager.js`, `src/config/config-manager.js`, `src/ui/options/options.js`

**Cross-References**: [ARCH:OVERLAY], [REQ:OVERLAY_SYSTEM], [REQ:OVERLAY_AUTO_SHOW_CONTROL], [REQ:OVERLAY_REFRESH_ACTION]

---

### 9. Cross-Browser API Shim Implementation [IMPL:CROSS_BROWSER] [ARCH:CROSS_BROWSER] [REQ:EXTENSION_IDENTITY]

**Decision**: Implement unified browser API shim (`safari-shim.js`) providing unified `browser` API that wraps platform-specific implementations, Promise-based message passing, storage API abstraction with quota management, tab querying with Safari-specific filtering, platform detection utilities, and enhanced error handling for Safari-specific issues.

**Rationale**:
- Unified API reduces code duplication
- Platform detection enables optimizations
- Quota management handles Safari constraints
- Enhanced error handling improves reliability

**Implementation Approach**:
- Browser API abstraction layer
- Platform detection utilities
- Storage quota monitoring
- Safari-specific error handling

**Code Markers**: `src/shared/safari-shim.js`, `src/shared/utils.js`

**Cross-References**: [ARCH:CROSS_BROWSER], [REQ:EXTENSION_IDENTITY]

---

### 10. Error Handling Framework Implementation [IMPL:ERROR_HANDLING] [ARCH:EXT_IDENTITY] [REQ:EXTENSION_IDENTITY]

**Decision**: Implement centralized error handling with ErrorHandler class providing logging, reporting, and recovery mechanisms, comprehensive error types, user-friendly error messages, and error recovery strategies.

**Rationale**:
- Centralized handling simplifies debugging
- Comprehensive types enable specific handling
- User-friendly messages improve UX
- Recovery strategies ensure reliability

**Implementation Approach**:
- ErrorHandler class with error types
- Logging infrastructure
- Error reporting mechanisms
- Recovery strategies

**Code Markers**: `src/shared/ErrorHandler.js`

**Cross-References**: [ARCH:EXT_IDENTITY], [REQ:EXTENSION_IDENTITY]
