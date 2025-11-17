# Requirements Directory

**STDD Methodology Version**: 1.0.0

## Overview
This document serves as the **central listing/registry** for all requirements in this project. Each requirement has a unique semantic token `[REQ:IDENTIFIER]` for traceability.

**For detailed information about how requirements are fulfilled, see:**
- **Architecture decisions**: See `architecture-decisions.md` for high-level design choices that fulfill requirements
- **Implementation decisions**: See `implementation-decisions.md` for detailed implementation approaches, APIs, and algorithms
- **Semantic tokens**: See `semantic-tokens.md` for the complete token registry

### Requirement Structure

Each requirement includes:
- **Description**: What the requirement specifies (WHAT)
- **Rationale**: Why the requirement exists (WHY)
- **Satisfaction Criteria**: How we know the requirement is satisfied (acceptance criteria, success conditions)
- **Validation Criteria**: How we verify/validate the requirement is met (testing approach, verification methods, success metrics)

**Note**: 
- Satisfaction and validation criteria that involve architectural or implementation details reference the appropriate layers
- Architecture decisions in `architecture-decisions.md` explain HOW requirements are fulfilled at a high level
- Implementation decisions in `implementation-decisions.md` explain HOW requirements are fulfilled at a detailed level

## Requirements Registry

### Functional Requirements

| Token | Requirement | Priority | Status | Architecture | Implementation |
|-------|------------|----------|--------|--------------|----------------|
| `[REQ:SMART_BOOKMARKING]` | Smart Bookmarking | P0 | ✅ Implemented | [ARCH:BOOKMARKING] | [IMPL:BOOKMARKING] |
| `[REQ:TAG_MANAGEMENT]` | Tag Management | P0 | ✅ Implemented | [ARCH:TAG_MGMT] | [IMPL:TAG_MGMT] |
| `[REQ:OVERLAY_SYSTEM]` | Overlay System | P0 | ✅ Implemented | [ARCH:OVERLAY] | [IMPL:OVERLAY] |
| `[REQ:OVERLAY_AUTO_SHOW_CONTROL]` | Hover Auto-Show Controls | P1 | ✅ Implemented | [ARCH:OVERLAY] | [IMPL:OVERLAY] |
| `[REQ:OVERLAY_REFRESH_ACTION]` | Overlay Refresh Control | P1 | ✅ Implemented | [ARCH:OVERLAY] | [IMPL:OVERLAY] |
| `[REQ:POPUP_PERSISTENT_SESSION]` | Popup Session Persistence | P1 | ✅ Implemented | [ARCH:UX_CORE] | [IMPL:UX_CORE] |
| `[REQ:BOOKMARK_STATE_SYNCHRONIZATION]` | Bookmark State Synchronization | P1 | ✅ Implemented | [ARCH:MESSAGE_HANDLING] | [IMPL:MESSAGE_HANDLING] |
| `[REQ:PRIVACY_CONTROLS]` | Privacy Controls | P0 | ✅ Implemented | [ARCH:PRIVACY] | [IMPL:PRIVACY] |
| `[REQ:DARK_THEME]` | Dark Theme Support | P1 | ✅ Implemented | [ARCH:THEME] | [IMPL:THEME] |
| `[REQ:BADGE_INDICATORS]` | Badge Indicators | P1 | ✅ Implemented | [ARCH:BADGE] | [IMPL:BADGE] |
| `[REQ:SITE_MANAGEMENT]` | Site Management | P1 | ✅ Implemented | [ARCH:SITE_MGMT] | [IMPL:SITE_MGMT] |
| `[REQ:SEARCH_FUNCTIONALITY]` | Search Functionality | P1 | ✅ Implemented | [ARCH:SEARCH] | [IMPL:SEARCH] |
| `[REQ:OVERLAY_CONTROL_LAYOUT]` | Overlay Control Layout | P1 | ✅ Implemented | [ARCH:OVERLAY] | [IMPL:OVERLAY] |
| `[REQ:SUGGESTED_TAGS_FROM_CONTENT]` | Suggested Tags from Page Content | P1 | ✅ Implemented | [ARCH:SUGGESTED_TAGS] | [IMPL:SUGGESTED_TAGS] |
| `[REQ:SUGGESTED_TAGS_DEDUPLICATION]` | Suggested Tags Deduplication | P1 | ✅ Implemented | [ARCH:SUGGESTED_TAGS] | [IMPL:SUGGESTED_TAGS] |
| `[REQ:SUGGESTED_TAGS_CASE_PRESERVATION]` | Suggested Tags Case Preservation | P1 | ✅ Implemented | [ARCH:SUGGESTED_TAGS] | [IMPL:SUGGESTED_TAGS] |

### Non-Functional Requirements

| Token | Requirement | Priority | Status | Architecture | Implementation |
|-------|------------|----------|--------|--------------|----------------|
| `[REQ:CONFIG_PORTABILITY]` | Configuration Import/Export | P1 | ✅ Implemented | [ARCH:STORAGE] | [IMPL:STORAGE] |
| `[REQ:CHROME_STORAGE_USAGE]` | Chrome Storage API Usage | P0 | ✅ Implemented | [ARCH:STORAGE] | [IMPL:STORAGE] |
| `[REQ:PINBOARD_COMPATIBILITY]` | Pinboard API Compatibility | P0 | ✅ Implemented | [ARCH:PINBOARD_API] | [IMPL:PINBOARD_API] |
| `[REQ:TAG_INPUT_SANITIZATION]` | Tag Input Sanitization | P0 | ✅ Implemented | [ARCH:TAG_SYSTEM] | [IMPL:TAG_SYSTEM] |
| `[REQ:SAFARI_ADAPTATION]` | Safari Adaptive Behavior | P0 | ✅ Implemented | [ARCH:CROSS_BROWSER] | [IMPL:CROSS_BROWSER] |

### Immutable Requirements (Major Version Change Required)

| Token | Requirement | Priority | Status | Architecture | Implementation |
|-------|------------|----------|--------|--------------|----------------|
| `[REQ:EXTENSION_IDENTITY]` | Extension Identity Preservation | P0 | ✅ Implemented | [ARCH:EXT_IDENTITY] | [IMPL:EXT_IDENTITY] |
| `[REQ:CORE_UX_PRESERVATION]` | Core User Experience Preservation | P0 | ✅ Implemented | [ARCH:UX_CORE] | [IMPL:UX_CORE] |
| `[REQ:MANIFEST_V3_MIGRATION]` | Manifest V3 Migration | P0 | ⏳ Planned | [ARCH:MV3_MIGRATION] | [IMPL:MV3_MIGRATION] |
| `[REQ:PINBOARD_COMPATIBILITY]` | Pinboard API Compatibility | P0 | ✅ Implemented | [ARCH:PINBOARD_API] | [IMPL:PINBOARD_API] |
| `[REQ:CHROME_STORAGE_USAGE]` | Chrome Storage API Usage | P0 | ✅ Implemented | [ARCH:STORAGE] | [IMPL:STORAGE] |
| `[REQ:RECENT_TAGS_SYSTEM]` | Recent Tags System | P0 | ✅ Implemented | [ARCH:TAG_SYSTEM] | [IMPL:TAG_SYSTEM] |

### Incomplete Requirements

| Token | Requirement | Priority | Status | Architecture | Implementation |
|-------|------------|----------|--------|--------------|----------------|
| `[REQ:MANIFEST_V3_MIGRATION]` | Manifest V3 Migration | P0 | ⏳ Planned | [ARCH:MV3_MIGRATION] | [IMPL:MV3_MIGRATION] |

---

## Detailed Requirements

### Core Functionality

### [REQ:IDENTIFIER] Requirement Name

**Priority: P0 (Critical) | P1 (Important) | P2 (Nice-to-have) | P3 (Future)**

- **Description**: What the requirement specifies
- **Rationale**: Why the requirement exists
- **Satisfaction Criteria**:
  - How we know the requirement is satisfied
  - Acceptance criteria
  - Success conditions
- **Validation Criteria**: 
  - How we verify/validate the requirement is met
  - Testing approach
  - Verification methods
  - Success metrics
- **Architecture**: See `architecture-decisions.md` § Decision Name [ARCH:IDENTIFIER]
- **Implementation**: See `implementation-decisions.md` § Implementation Name [IMPL:IDENTIFIER]

**Status**: ✅ Implemented | ⏳ Planned
```

## Notes

- All requirements MUST be documented here with `[REQ:*]` tokens
- Requirements describe WHAT the system should do and WHY, not HOW
- Requirements MUST NOT describe bugs or implementation details

## Future Enhancements (Out of Scope)

The following features are documented but marked as future enhancements:
- Each requirement should cross-reference architecture and implementation decisions

---

## Extracted Requirements from Existing Documentation

### Immutable Requirements (Major Version Change Required)

#### [REQ:EXTENSION_IDENTITY] Extension Identity Preservation

**Priority**: P0 (Critical)

- **Description**: The extension must maintain its core identity as "Hoverboard" - a Pinboard.in bookmarking interface enhancement. The name, purpose, and target platform (Chrome/Chromium-based browsers) must never change.
- **Rationale**: Core extension identity is fundamental to user recognition and brand consistency. Changing this would break user expectations and require complete rebranding.
- **Satisfaction Criteria**:
  - Extension name remains "Hoverboard" in all contexts
  - Purpose remains Pinboard.in bookmarking interface enhancement
  - Target platform remains Chrome/Chromium-based browsers
  - Architecture remains browser extension with content script injection
- **Validation Criteria**:
  - Manifest.json name field validation
  - Documentation consistency checks
  - Branding audit in all user-facing interfaces
- **Architecture**: See `architecture-decisions.md` § Extension Identity [ARCH:EXT_IDENTITY]
- **Implementation**: See `implementation-decisions.md` § Identity Implementation [IMPL:EXT_IDENTITY]

**Status**: ✅ Implemented

#### [REQ:CORE_UX_PRESERVATION] Core User Experience Preservation

**Priority**: P0 (Critical)

- **Description**: The core user experience must be preserved: primary function to enhance Pinboard.in bookmarking workflow, hover interface with non-intrusive overlay, quick actions for add/edit bookmarks without leaving page, tag management with recent tags, and private bookmarking support.
- **Rationale**: These features define the essential user experience. Removing or significantly changing them would break user workflows and expectations.
- **Satisfaction Criteria**:
  - Hover interface activates on webpage hover
  - Overlay is semi-transparent and non-intrusive
  - Quick bookmark actions available without page navigation
  - Recent tags system functional
  - Private bookmark toggle available
- **Validation Criteria**:
  - User acceptance testing
  - Workflow validation
  - Feature parity testing
- **Architecture**: See `architecture-decisions.md` § User Experience [ARCH:UX_CORE]
- **Implementation**: See `implementation-decisions.md` § UX Implementation [IMPL:UX_CORE]

**Status**: ✅ Implemented

#### [REQ:MANIFEST_V3_MIGRATION] Manifest V3 Migration

**Priority**: P0 (Critical)

- **Description**: Extension must migrate to Manifest V3 compliance, replacing background scripts with service worker, maintaining current functionality while using V3 permissions, and preserving content script injection patterns.
- **Rationale**: Manifest V2 is deprecated. Migration to V3 is required for continued Chrome Web Store support and future browser compatibility.
- **Satisfaction Criteria**:
  - Service worker replaces background scripts
  - All V2 functionality preserved in V3
  - Content script injection patterns maintained
  - Permissions model updated to V3
- **Validation Criteria**:
  - Manifest validation
  - Feature parity testing
  - Performance benchmarking
- **Architecture**: See `architecture-decisions.md` § Manifest V3 Migration [ARCH:MV3_MIGRATION]
- **Implementation**: See `implementation-decisions.md` § MV3 Implementation [IMPL:MV3_MIGRATION]

**Status**: ⏳ Planned

#### [REQ:PINBOARD_COMPATIBILITY] Pinboard API Compatibility

**Priority**: P0 (Critical)

- **Description**: Extension must maintain compatibility with Pinboard.in API, using token-based authentication, preserving all current API endpoint integrations, and respecting Pinboard API rate limits.
- **Rationale**: Pinboard API is the core data source. Breaking compatibility would render the extension non-functional.
- **Satisfaction Criteria**:
  - All current API endpoints functional
  - Token-based authentication working
  - Rate limiting respected
  - Error handling for API failures
- **Validation Criteria**:
  - API integration tests
  - Rate limit compliance testing
  - Authentication flow validation
- **Architecture**: See `architecture-decisions.md` § Pinboard Integration [ARCH:PINBOARD_API]
- **Implementation**: See `implementation-decisions.md` § API Implementation [IMPL:PINBOARD_API]

**Status**: ✅ Implemented

#### [REQ:CHROME_STORAGE_USAGE] Chrome Storage API Usage

**Priority**: P0 (Critical)

- **Description**: Extension must use chrome.storage.sync for user settings, chrome.storage.local for temporary data, preserve user configuration migration capability, and maintain privacy with no external data collection or tracking.
- **Rationale**: Storage API is required for persistence. Privacy is a core value that must be maintained.
- **Satisfaction Criteria**:
  - User settings persist across sessions
  - Configuration migration works
  - No external data collection
  - Privacy policy compliance
- **Validation Criteria**:
  - Storage API tests
  - Migration testing
  - Privacy audit
- **Architecture**: See `architecture-decisions.md` § Storage Strategy [ARCH:STORAGE]
- **Implementation**: See `implementation-decisions.md` § Storage Implementation [IMPL:STORAGE]

**Status**: ✅ Implemented

#### [REQ:RECENT_TAGS_SYSTEM] Recent Tags System

**Priority**: P0 (Critical)

- **Description**: Recent tags system must preserve recently used tags across sessions, provide tag suggestions, maintain tag history in sync storage, display recent tags in bookmark interface, and when a tag is added to a record, it shall be added to the Recent Tags list (but not displayed on the current tab if it is a duplicate of an existing tag).
- **Rationale**: Recent tags are essential for user productivity. The tag addition behavior is a documented immutable requirement.
- **Satisfaction Criteria**:
  - Recent tags persist across sessions
  - Tag suggestions work
  - Tag history stored in sync storage
  - Recent tags displayed in interface
  - Tag addition behavior matches specification
- **Validation Criteria**:
  - Tag persistence tests
  - Tag suggestion algorithm tests
  - UI display validation
- **Architecture**: See `architecture-decisions.md` § Tag System [ARCH:TAG_SYSTEM]
- **Implementation**: See `implementation-decisions.md` § Tag Implementation [IMPL:TAG_SYSTEM]

**Status**: ✅ Implemented

### Core Functional Requirements

#### [REQ:SMART_BOOKMARKING] Smart Bookmarking

**Priority**: P0 (Critical)

- **Description**: Extension must provide smart bookmarking with intelligent tag suggestions, allowing users to save pages with URL, title, description, and tags.
- **Rationale**: Core functionality - the primary purpose of the extension.
- **Satisfaction Criteria**:
  - Bookmark creation works
  - Tag suggestions appear
  - All bookmark fields saveable
- **Validation Criteria**:
  - Bookmark creation tests
  - Tag suggestion tests
  - API integration tests
- **Architecture**: See `architecture-decisions.md` § Bookmarking [ARCH:BOOKMARKING]
- **Implementation**: See `implementation-decisions.md` § Bookmark Implementation [IMPL:BOOKMARKING]

**Status**: ✅ Implemented

#### [REQ:TAG_MANAGEMENT] Tag Management

**Priority**: P0 (Critical)

- **Description**: Extension must provide tag management with custom tags, categories, recent tags access, and quick tag insertion.
- **Rationale**: Tag organization is essential for bookmark management.
- **Satisfaction Criteria**:
  - Tags can be added/removed
  - Recent tags accessible
  - Tag suggestions work
- **Validation Criteria**:
  - Tag CRUD tests
  - Recent tags tests
  - UI interaction tests
- **Architecture**: See `architecture-decisions.md` § Tag Management [ARCH:TAG_MGMT]
- **Implementation**: See `implementation-decisions.md` § Tag Management Implementation [IMPL:TAG_MGMT]

**Status**: ✅ Implemented

#### [REQ:DARK_THEME] Dark Theme Support

**Priority**: P1 (Important)

- **Description**: Extension must support dark theme with modern UI, defaulting to dark theme, and providing theme toggle capability.
- **Rationale**: Modern UI expectations and user preference for dark mode.
- **Satisfaction Criteria**:
  - Dark theme available
  - Theme toggle works
  - Default is dark theme
- **Validation Criteria**:
  - Theme rendering tests
  - Toggle functionality tests
  - User preference persistence tests
- **Architecture**: See `architecture-decisions.md` § Theme System [ARCH:THEME]
- **Implementation**: See `implementation-decisions.md` § Theme Implementation [IMPL:THEME]

**Status**: ✅ Implemented

#### [REQ:OVERLAY_SYSTEM] Overlay System

**Priority**: P0 (Critical)

- **Description**: Extension must provide visual overlay system with transparency controls, hover-based activation, and non-intrusive display.
- **Rationale**: Core user interface for bookmark interaction.
- **Satisfaction Criteria**:
  - Overlay appears on hover
  - Transparency controls work
  - Non-intrusive behavior
- **Validation Criteria**:
  - Overlay display tests
  - Transparency tests
  - Interaction tests
- **Architecture**: See `architecture-decisions.md` § Overlay System [ARCH:OVERLAY]
- **Implementation**: See `implementation-decisions.md` § Overlay Implementation [IMPL:OVERLAY]

**Status**: ✅ Implemented

#### [REQ:BADGE_INDICATORS] Badge Indicators

**Priority**: P1 (Important)

- **Description**: Extension must provide visual status indicators in the extension icon showing bookmark state and tag count.
- **Rationale**: Quick visual feedback for bookmark status.
- **Satisfaction Criteria**:
  - Badge shows bookmark status
  - Tag count displayed
  - State indicators clear
- **Validation Criteria**:
  - Badge update tests
  - State indicator tests
- **Architecture**: See `architecture-decisions.md` § Badge System [ARCH:BADGE]
- **Implementation**: See `implementation-decisions.md` § Badge Implementation [IMPL:BADGE]

**Status**: ✅ Implemented

#### [REQ:SITE_MANAGEMENT] Site Management

**Priority**: P1 (Important)

- **Description**: Extension must allow users to disable extension on specific domains.
- **Rationale**: User control over extension behavior per site.
- **Satisfaction Criteria**:
  - Sites can be disabled
  - Disabled sites list persists
  - Extension respects disabled sites
- **Validation Criteria**:
  - Site blocking tests
  - Persistence tests
- **Architecture**: See `architecture-decisions.md` § Site Management [ARCH:SITE_MGMT]
- **Implementation**: See `implementation-decisions.md` § Site Management Implementation [IMPL:SITE_MGMT]

**Status**: ✅ Implemented

#### [REQ:SEARCH_FUNCTIONALITY] Search Functionality

**Priority**: P1 (Important)

- **Description**: Extension must provide search functionality to search through bookmarked tabs by title.
- **Rationale**: User need to find existing bookmarks.
- **Satisfaction Criteria**:
  - Search works
  - Title search functional
  - Results displayed
- **Validation Criteria**:
  - Search algorithm tests
  - UI interaction tests
- **Architecture**: See `architecture-decisions.md` § Search System [ARCH:SEARCH]
- **Implementation**: See `implementation-decisions.md` § Search Implementation [IMPL:SEARCH]

**Status**: ✅ Implemented

#### [REQ:PRIVACY_CONTROLS] Privacy Controls

**Priority**: P0 (Critical)

- **Description**: Extension must support marking bookmarks as private or to-read.
- **Rationale**: User privacy and organization needs.
- **Satisfaction Criteria**:
  - Private toggle works
  - To-read toggle works
  - State persists
- **Validation Criteria**:
  - Toggle functionality tests
  - State persistence tests
- **Architecture**: See `architecture-decisions.md` § Privacy Controls [ARCH:PRIVACY]
- **Implementation**: See `implementation-decisions.md` § Privacy Implementation [IMPL:PRIVACY]

**Status**: ✅ Implemented

#### [REQ:OVERLAY_AUTO_SHOW_CONTROL] Hover Auto-Show Controls

**Priority**: P1 (Important)

- **Description**: Users can opt into automatically displaying the hover overlay when pages load, with safeguards that respect the inhibit list, detect whether the site is new, and honor tag-based conditions before triggering the overlay.
- **Rationale**: Many users want immediate access to bookmarking tools on frequently used sites, while others prefer a quieter experience. Making the behavior configurable keeps the overlay non-intrusive by default while enabling automation for power users.
- **Satisfaction Criteria**:
  - Popup and options UI expose a `showHoverOnPageLoad` checkbox that persists via `ConfigManager`.
  - Content scripts consult the inhibit list, new-site detection, and tag-state flags (`showHoverOnPageLoadForNewSites`, `showHoverOnPageLoadOnlyIfNoTags`, `showHoverOnPageLoadOnlyIfSomeTags`) before showing the overlay.
  - Configuration updates broadcast to active tabs so the overlay reacts without requiring reloads.
- **Validation Criteria**:
  - Unit tests `tests/unit/popup-checkbox.test.js` confirm loading, saving, and broadcasting checkbox state.
  - Integration and Safari parity tests (e.g., `tests/integration/safari-cross-browser.integration.test.js`) ensure consistent behavior across browsers.
  - Manual verification that inhibited URLs and tag-conditional rules prevent unwanted overlay activation.
- **Architecture**: See `architecture-decisions.md` § Overlay System [ARCH:OVERLAY]
- **Implementation**: See `implementation-decisions.md` § Overlay Implementation [IMPL:OVERLAY]

**Status**: ✅ Implemented

#### [REQ:OVERLAY_REFRESH_ACTION] Overlay Refresh Control

**Priority**: P1 (Important)

- **Description**: The overlay must provide a dedicated refresh control that re-fetches bookmark data, reflects remote edits, and remains fully accessible via mouse and keyboard.
- **Rationale**: Users often edit bookmarks from multiple contexts; providing an in-overlay refresh prevents stale data and avoids closing the overlay simply to get the latest state.
- **Satisfaction Criteria**:
  - Overlay renders a refresh button with tooltip, ARIA label, and keyboard handlers (Enter/Space).
  - Clicking or pressing the keybinding requests updated bookmark data, displays loading/success messaging, and re-renders content.
  - Errors (network failures, invalid responses) surface non-destructive error messaging without breaking the overlay session.
- **Validation Criteria**:
  - Unit suites `tests/unit/overlay-refresh-button.test.js` and `tests/unit/overlay-refresh-accessibility.test.js` validate rendering, handler logic, error handling, and accessibility compliance.
  - Manual exploratory tests confirm refresh works after remote edits and does not interfere with the close button layout.
- **Architecture**: See `architecture-decisions.md` § Overlay System [ARCH:OVERLAY]
- **Implementation**: See `implementation-decisions.md` § Overlay Implementation [IMPL:OVERLAY]

**Status**: ✅ Implemented

#### [REQ:POPUP_PERSISTENT_SESSION] Popup Session Persistence

**Priority**: P1 (Important)

- **Description**: Popup interactions must keep the popup window open while reflecting overlay visibility and bookmark state changes in-line. Actions such as toggling the overlay, switching privacy/read-later flags, deleting a pin, reloading the extension context, or opening the options page update UI state and messaging without invoking `window.close`.
- **Rationale**: Keeping the popup visible lets users chain multiple actions (e.g., adjust overlay state, toggle privacy, edit tags) without reopening the UI, matching behavior verified by the regression tests.
- **Satisfaction Criteria**:
  - `PopupController.handleShowHoverboard` never closes the popup, updates `showHoverboard` button state using the overlay response, and falls back to `GET_OVERLAY_STATE` when toggle responses omit data.
  - Privacy/read-later toggles, delete, reload, and open-options handlers leave the popup open, surface success/error notifications, and only mutate UI state after successful messaging.
  - `UIManager.updateShowHoverButtonState` adjusts icons, titles, and `aria-label` text to describe the overlay state for assistive tech while tolerating missing DOM elements.
- **Validation Criteria**:
  - `tests/unit/popup-close-behavior.test.js` verifies each handler path never calls `closePopup`/`window.close`, updates overlay state, and handles error fallbacks.
  - `tests/unit/popup-live-data.test.js` confirms live data refresh keeps the session active while updating status icons and connection indicators.
- **Architecture**: See `architecture-decisions.md` § User Experience [ARCH:UX_CORE]
- **Implementation**: See `implementation-decisions.md` § UX Implementation [IMPL:UX_CORE]

**Status**: ✅ Implemented

#### [REQ:BOOKMARK_STATE_SYNCHRONIZATION] Bookmark State Synchronization

**Priority**: P1 (Important)

- **Description**: Privacy, read-later, and tag edits must propagate across overlay, popup, and badge surfaces via shared messaging (`BOOKMARK_UPDATED`) so every surface renders the same bookmark state even when changes originate elsewhere.
- **Rationale**: Users frequently toggle bookmark metadata from multiple contexts (overlay, popup, keyboard shortcuts); desynchronized states cause conflicting saves and confusing UI feedback.
- **Satisfaction Criteria**:
  - Overlay toggle controls persist changes through `saveBookmark`, update local overlay content immediately, show contextual success messages, and broadcast `BOOKMARK_UPDATED` with the updated record.
  - Popup listeners respond to `BOOKMARK_UPDATED` by fetching the latest bookmark, updating state manager fields (shared/toread/tags), refreshing button states, and surfacing a success toast.
  - Tag add/remove flows broadcast `BOOKMARK_UPDATED`, and overlay managers refresh visible content only after receiving the message.
  - Badge synchronization checks compare popup data with injected tab/bookmark data and flag mismatches for diagnostics.
  - Error conditions (network failures) leave local overlay content untouched and display non-destructive error banners.
- **Validation Criteria**:
  - `tests/unit/toggle-synchronization.test.js` exercises overlay toggles, BOOKMARK_UPDATED broadcasts, popup/overlay message handlers, rapid toggling, reload handling, and tag synchronization.
  - `tests/unit/popup-live-data.test.js` verifies popup refresh flows, data validation, badge synchronization checks, and debug logging tied to shared state updates.
- **Architecture**: See `architecture-decisions.md` § Message Handling [ARCH:MESSAGE_HANDLING]
- **Implementation**: See `implementation-decisions.md` § Message Handling Implementation [IMPL:MESSAGE_HANDLING]

**Status**: ✅ Implemented

#### [REQ:OVERLAY_CONTROL_LAYOUT] Overlay Control Layout

**Priority**: P1 (Important)

- **Description**: The overlay’s close and refresh controls must remain pinned to the top-left corner with fixed spacing, theme-aware styling, 24px minimum touch targets, and full accessibility metadata so they do not clash with bookmark content or each other.
- **Rationale**: Predictable placement and accessible controls keep the overlay non-intrusive while ensuring the refresh action introduced by `[REQ:OVERLAY_REFRESH_ACTION]` remains discoverable and keyboard accessible.
- **Satisfaction Criteria**:
  - Close button renders at `top: 8px; left: 8px;` and refresh button at `top: 8px; left: 40px;`, providing at least 32px spacing regardless of overlay width.
  - Both buttons share theme CSS variables (`--theme-button-bg`, `--theme-text-primary`, `--theme-border`, `--theme-transition`) and enforce `min-width/min-height` ≥ 24px.
  - Controls set `title`, `aria-label`, `role`, and `tabindex` attributes, register keyboard handlers, and retain pointer cursor styling.
  - Layout logic tolerates missing DOM nodes without throwing and keeps styling consistent with the overlay refresh action.
- **Validation Criteria**:
  - `tests/unit/overlay-close-button-positioning.test.js` covers positioning, spacing, styling, accessibility attributes, and theme integration.
  - `tests/unit/overlay-refresh-button.test.js` (and related overlay refresh suites) confirm refresh control behavior remains consistent with layout guarantees.
- **Architecture**: See `architecture-decisions.md` § Overlay System [ARCH:OVERLAY]
- **Implementation**: See `implementation-decisions.md` § Overlay Implementation [IMPL:OVERLAY]

**Status**: ✅ Implemented

#### [REQ:CONFIG_PORTABILITY] Configuration Import/Export

**Priority**: P1 (Important)

- **Description**: The extension must support exporting and importing user configuration, including settings, authentication token, inhibited site list, and metadata (version, export timestamp) to facilitate backup and device migration.
- **Rationale**: Users customize Hoverboard extensively; providing portable configuration reduces friction when upgrading browsers, synchronizing multi-device setups, or recovering from data loss.
- **Satisfaction Criteria**:
  - `ConfigManager.exportConfig()` returns version, export date, settings snapshot, auth token, and normalized inhibit URLs array.
  - `ConfigManager.importConfig()` accepts full or partial payloads and persists each component independently without corrupting missing fields.
  - Operations reuse existing storage keys (`hoverboard_settings`, `hoverboard_auth_token`, `hoverboard_inhibit_urls`) and honor privacy expectations (no external transmission).
- **Validation Criteria**:
  - `tests/unit/config-manager.test.js` export/import cases verify data fidelity, partial imports, and error handling.
  - Manual QA can move settings between profiles via export/import without losing credentials or inhibit lists.
- **Architecture**: See `architecture-decisions.md` § Storage Strategy [ARCH:STORAGE]
- **Implementation**: See `implementation-decisions.md` § Storage Implementation [IMPL:STORAGE]

**Status**: ✅ Implemented

#### [REQ:TAG_INPUT_SANITIZATION] Tag Input Sanitization

**Priority**: P0 (Critical)

- **Description**: All tag inputs must be sanitized to remove HTML markup, strip unsafe characters, enforce a 50-character limit, and reject null/blank/invalid entries before persistence or display.
- **Rationale**: Tags flow into Pinboard requests and overlay DOM elements; sanitization prevents XSS, ensures data integrity, and avoids sync pollution across devices.
- **Satisfaction Criteria**:
  - `TagService.sanitizeTag` eliminates HTML tags, encoded markup, and special characters, returning `null` for invalid inputs.
  - Overlay and popup validation prevents non-sanitized tags from rendering or persisting (double-click delete/add flows respect `isValidTag` guardrails).
  - Sanitization enforces max length of 50 characters and allows safe characters (`[A-Za-z0-9_- ]`) only.
- **Validation Criteria**:
  - `tests/unit/tag-sanitization-fix.test.js` exercises HTML stripping, special character removal, length enforcement, and malformed inputs.
  - Overlay interaction tests (e.g., `tests/unit/tag-recent-behavior.test.js`) confirm sanitized tags propagate through the UI without breaking layout.
- **Architecture**: See `architecture-decisions.md` § Tag System [ARCH:TAG_SYSTEM]
- **Implementation**: See `implementation-decisions.md` § Tag Service Implementation [IMPL:TAG_SYSTEM]

**Status**: ✅ Implemented

#### [REQ:SAFARI_ADAPTATION] Safari Adaptive Behavior

**Priority**: P0 (Critical)

- **Description**: The extension must tailor content scripts, messaging, performance monitoring, and error recovery to Safari’s WebExtension bridge so Hoverboard remains stable on Safari desktop. This includes Safari-specific configuration defaults, overlay animation tweaks, message retries, memory cleanup, and graceful degradation pathways.
- **Rationale**: Safari enforces different performance limits, messaging quirks, and DOM behaviors. Without explicit adaptation the overlay becomes sluggish, memory spikes crash tabs, and messaging failures leave the extension unusable on Safari—violating the cross-browser identity requirement.
- **Satisfaction Criteria**:
  - Safari platform detection injects configuration (message timeouts/retries, overlay opacity/blur settings, performance monitoring intervals) before scripts execute.
  - Content scripts apply Safari-only DOM/animation optimizations, memory cleanup, and performance monitors that can downgrade features when thresholds exceed limits.
  - Safari error handler tracks recovery attempts, differentiates messaging/storage/UI/performance faults, retries within configured limits, and enables degraded mode after max attempts while exposing telemetry.
  - Messaging pipeline enriches Safari messages with sender metadata and timestamps, reinitializes clients when WebKit bridges fail, and respects Safari storage/memory constraints.
  - Overlay managers and global controllers honor Safari-specific opacity, animation duration, and adaptive visibility defaults while remaining configurable through storage.
- **Validation Criteria**:
  - `tests/unit/safari-content-adaptations.test.js` verifies configuration loading, DOM/animation optimization, performance monitoring, memory cleanup, overlay adjustments, and Safari message processing.
  - `tests/unit/safari-error-handling.test.js`, `tests/unit/safari-messaging.test.js`, `tests/unit/safari-popup-adaptations.test.js`, and `tests/unit/safari-performance.test.js` confirm platform detection, recovery attempts, degraded-mode toggles, messaging retries, and UI reinitialization logic.
- **Architecture**: See `architecture-decisions.md` § Cross-Browser Compatibility [ARCH:CROSS_BROWSER]
- **Implementation**: See `implementation-decisions.md` § Cross-Browser API Shim [IMPL:CROSS_BROWSER]

**Status**: ✅ Implemented

#### [REQ:SUGGESTED_TAGS_FROM_CONTENT] Suggested Tags from Page Content

**Priority**: P1 (Important)

- **Description**: Both popup and overlay interfaces must display a "suggested tags" section below the "recent tags" list. Suggested tags are intelligently gathered from multiple sources on the current page. The system extracts unique "non-noise" words from: page title tag, URL path segments, headings (H1, H2, H3), top-level navigation elements, breadcrumb navigation, first N images' alt text, and first N anchor links within the main content area. When extracting text from elements (headings, links, navigation items), the system prioritizes attribute text (such as the `title` attribute) over visible text content, as attributes often contain the full, untruncated text while visible content may be truncated. If an element or its child elements have a `title` attribute with content, that attribute value is used; otherwise, the element's `textContent` is used. All extracted words are combined, filtered for noise, counted for frequency, and sorted by frequency with most frequent words appearing first.
- **Rationale**: Suggested tags help users quickly identify relevant tags for bookmarking by analyzing page content from multiple structured sources. Extracting words from title, URL, headings, navigation, breadcrumbs, images, and links provides comprehensive, semantically meaningful suggestions since these sources typically contain the most important keywords describing the page content. Combining multiple sources with frequency analysis ensures the most relevant keywords surface, while filtering noise words maintains tag quality. This reduces manual tag entry and improves bookmark organization.
- **Satisfaction Criteria**:
  - Popup interface displays "Suggested:" section below "Recent:" tags section with clickable tag elements
  - Overlay interface displays "Suggested:" section below "Recent:" tags section with clickable tag elements
  - Suggested tags are extracted from multiple sources: title tag, URL path segments, H1/H2/H3 headings, top-level navigation, breadcrumbs, first 5 images' alt text, and first 10 anchor links within main content
  - When extracting from elements (headings, links, navigation), the system checks for `title` attributes (on the element or its children) and uses attribute text when available, falling back to `textContent` otherwise
  - Words are filtered to remove "noise" words (common stop words, single characters, numbers, etc.)
  - Tags are deduplicated (unique words only)
  - Tags are sorted by frequency (most frequent first)
  - Suggested tags respect tag sanitization rules (same as `[REQ:TAG_INPUT_SANITIZATION]`)
  - Clicking a suggested tag adds it to the bookmark (same behavior as recent tags)
  - Suggested tags section is hidden when no suggestions are available
- **Validation Criteria**:
  - Unit tests verify extraction from all sources (title, URL, headings, nav, breadcrumbs, images, links) from mock DOM structures
  - Unit tests verify title attribute extraction from elements and child elements (e.g., title attribute on yt-formatted-string inside h1)
  - Unit tests verify fallback to textContent when title attributes are not available
  - Unit tests verify noise word filtering and frequency sorting across all sources
  - Unit tests verify tag sanitization is applied to suggested tags
  - Integration tests verify suggested tags appear in both popup and overlay
  - Integration tests verify clicking suggested tags adds them to bookmarks
  - Manual testing confirms suggested tags reflect page content accurately from multiple sources, including full text from title attributes
- **Architecture**: See `architecture-decisions.md` § Suggested Tags from Page Content Architecture [ARCH:SUGGESTED_TAGS]
- **Implementation**: See `implementation-decisions.md` § Suggested Tags from Page Content Implementation [IMPL:SUGGESTED_TAGS]

**Status**: ✅ Implemented

#### [REQ:SUGGESTED_TAGS_DEDUPLICATION] Suggested Tags Deduplication

**Priority**: P1 (Important)

- **Description**: Suggested tags must be filtered to exclude any tags that are already present in the Current Tags list. The comparison must be case-insensitive, meaning "Tag" and "tag" are considered the same tag. Tags present in Current Tags (case-insensitive match) must not appear in the Suggested Tags section in both popup and overlay interfaces. This requirement works in conjunction with `[REQ:SUGGESTED_TAGS_CASE_PRESERVATION]` to preserve original case while enabling case-insensitive deduplication.
- **Rationale**: Displaying tags in Suggested Tags that are already in Current Tags creates confusion and redundancy. Users should only see suggestions for tags they haven't already added. Case-insensitive comparison ensures that tags with different capitalization (e.g., "JavaScript" vs "javascript") are treated as the same tag, preventing duplicate suggestions while preserving the original case for display purposes.
- **Satisfaction Criteria**:
  - Suggested tags are filtered before display to exclude tags already in Current Tags
  - Comparison is case-insensitive (e.g., "Tag" = "tag" for deduplication purposes)
  - Filtering applies in both popup and overlay interfaces
  - Filtering occurs after tag extraction and sanitization but before display
  - If all suggested tags are filtered out, the Suggested Tags section is hidden
  - Case-insensitive comparison uses lowercase versions of both suggested tags and current tags
- **Validation Criteria**:
  - Unit tests verify suggested tags are filtered when they match Current Tags (case-insensitive)
  - Unit tests verify tags with different case (e.g., "Tag" vs "tag") are filtered if either is in Current Tags
  - Integration tests verify filtering works in both popup and overlay interfaces
  - Manual testing confirms suggested tags section hides tags already in Current Tags (case-insensitive)
- **Architecture**: See `architecture-decisions.md` § Suggested Tags from Page Content Architecture [ARCH:SUGGESTED_TAGS]
- **Implementation**: See `implementation-decisions.md` § Suggested Tags from Page Content Implementation [IMPL:SUGGESTED_TAGS]

**Status**: ✅ Implemented

#### [REQ:SUGGESTED_TAGS_CASE_PRESERVATION] Suggested Tags Case Preservation

**Priority**: P1 (Important)

- **Description**: When extracting suggested tags from page content, the system must preserve the original case of words as they appear in the source content. For words that contain uppercase letters (i.e., are not all lowercase), the system must include BOTH the original case-preserved version AND the lowercase version as separate suggested tags. For example, if an H2 element contains "Git clones", the system should suggest both "Git" (original case) and "git" (lowercase version) as separate tags, along with "clones" (which is already lowercase). Both versions are displayed to users as separate suggested tags, giving users flexibility to choose the capitalization style they prefer. The lowercase version is also used internally for case-insensitive deduplication with Current Tags (as specified in `[REQ:SUGGESTED_TAGS_DEDUPLICATION]`). Words that are already all lowercase do not generate a duplicate lowercase version (e.g., "clones" only appears once).
- **Rationale**: Preserving original case maintains the semantic meaning and visual context of words as they appear in the source content (e.g., "JavaScript", "API", "HTML"). Including both the original case and lowercase versions as separate suggested tags gives users flexibility - some may prefer "Git" (proper noun/tool name) while others may prefer "git" (lowercase convention). This dual-suggestion approach accommodates different tagging conventions while preserving the original context. The lowercase version also enables efficient case-insensitive deduplication without losing the original case information, allowing the system to filter duplicates while still displaying both capitalization options.
- **Satisfaction Criteria**:
  - Words extracted from content preserve their original case (e.g., "JavaScript" remains "JavaScript", not "javascript")
  - For words that contain uppercase letters (e.g., "Git", "JavaScript", "API"), BOTH the original case version AND the lowercase version are included as separate suggested tags
  - Words that are already all lowercase (e.g., "clones", "javascript") appear only once (no duplicate lowercase version)
  - Both the original case-preserved version and lowercase version (when different) are displayed in the Suggested Tags section as separate clickable tags
  - The lowercase version is used internally for case-insensitive comparison with Current Tags (if either "Git" or "git" is in Current Tags, both are filtered from Suggested Tags)
  - Case preservation applies to all extraction sources: title, URL segments, headings, navigation, breadcrumbs, images, and links
  - Frequency counting and sorting consider both versions independently (each version maintains its own frequency count)
  - Example: For H2 element with text "Git clones", suggested tags include: "Git", "git", and "clones" (if none exist in Current Tags)
- **Validation Criteria**:
  - Unit tests verify words extracted from content preserve original case
  - Unit tests verify both original case and lowercase versions are generated for mixed-case words (e.g., "Git" → ["Git", "git"])
  - Unit tests verify all-lowercase words do not generate duplicate lowercase versions (e.g., "clones" → ["clones"] only)
  - Unit tests verify both versions appear as separate suggested tags in the output
  - Unit tests verify case-insensitive deduplication filters both versions when either matches Current Tags
  - Integration tests verify both original case and lowercase versions display in both popup and overlay interfaces
  - Manual testing confirms suggested tags include both "Git" and "git" for H2 element with text "Git clones"
  - Manual testing confirms suggested tags reflect original capitalization from page content while also providing lowercase alternatives
- **Architecture**: See `architecture-decisions.md` § Suggested Tags from Page Content Architecture [ARCH:SUGGESTED_TAGS]
- **Implementation**: See `implementation-decisions.md` § Suggested Tags from Page Content Implementation [IMPL:SUGGESTED_TAGS]

**Status**: ✅ Implemented
