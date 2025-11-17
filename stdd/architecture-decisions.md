# Architecture Decisions

**STDD Methodology Version**: 1.0.0

## Overview
This document captures the high-level architectural decisions for this project. All decisions are cross-referenced with requirements using semantic tokens `[REQ:*]` and assigned architecture tokens `[ARCH:*]` for traceability.

## Template Structure

When documenting architecture decisions, use this format:

```markdown
## N. Decision Title [ARCH:IDENTIFIER] [REQ:RELATED_REQUIREMENT]

### Decision: Brief description of the architectural decision
**Rationale:**
- Why this decision was made
- What problems it solves
- What benefits it provides

**Alternatives Considered:**
- Alternative 1: Why it was rejected
- Alternative 2: Why it was rejected

**Cross-References**: [REQ:RELATED_REQUIREMENT], [ARCH:OTHER_DECISION]
```

## Notes

- All architecture decisions MUST be recorded here IMMEDIATELY when made
- Each decision MUST include `[ARCH:*]` token and cross-reference `[REQ:*]` tokens
- Architecture decisions are dependent on requirements
- DO NOT defer architecture documentation - record decisions as they are made

---

## Extracted Architecture Decisions from Existing Documentation

### 1. Extension Identity Architecture [ARCH:EXT_IDENTITY] [REQ:EXTENSION_IDENTITY]

**Decision**: Extension maintains core identity as "Hoverboard" with Pinboard.in bookmarking interface enhancement, targeting Chrome/Chromium-based browsers using browser extension architecture with content script injection.

**Rationale**:
- Core extension identity is fundamental to user recognition and brand consistency
- Pinboard.in integration is the primary value proposition
- Chrome/Chromium target ensures broad user base
- Content script injection enables non-intrusive page interaction

**Alternatives Considered**:
- Multi-platform native apps: Rejected - browser extension provides better integration
- Web app approach: Rejected - loses browser integration benefits

**Cross-References**: [REQ:EXTENSION_IDENTITY], [IMPL:EXT_IDENTITY]

---

### 2. Manifest V3 Migration Strategy [ARCH:MV3_MIGRATION] [REQ:MANIFEST_V3_MIGRATION]

**Decision**: Migrate from Manifest V2 to V3 by replacing background scripts with service workers, maintaining all current functionality while using V3 permissions model, and preserving content script injection patterns.

**Rationale**:
- Manifest V2 is deprecated by Chrome
- V3 provides better security and performance
- Service workers enable modern async patterns
- Migration required for continued Chrome Web Store support

**Alternatives Considered**:
- Stay on V2: Rejected - V2 will be unsupported
- Complete rewrite: Rejected - too risky, prefer incremental migration

**Cross-References**: [REQ:MANIFEST_V3_MIGRATION], [IMPL:MV3_MIGRATION]

---

### 3. Pinboard API Integration Architecture [ARCH:PINBOARD_API] [REQ:PINBOARD_COMPATIBILITY]

**Decision**: Use token-based authentication with Pinboard.in API, maintain compatibility with all current API endpoints (/posts/get, /posts/recent, /posts/add, /posts/delete), implement rate limiting and retry logic for 429 status handling, and handle authentication errors (401 status).

**Rationale**:
- Pinboard API is the core data source
- Token-based auth is secure and simple
- Rate limiting prevents API abuse
- Error handling ensures reliability

**Alternatives Considered**:
- OAuth: Rejected - Pinboard API uses token-based auth
- Caching only: Rejected - real-time sync required

**Cross-References**: [REQ:PINBOARD_COMPATIBILITY], [REQ:SMART_BOOKMARKING], [IMPL:PINBOARD_API]

---

### 4. Storage Strategy [ARCH:STORAGE] [REQ:CHROME_STORAGE_USAGE] [REQ:CONFIG_PORTABILITY]

**Decision**: Use chrome.storage.sync for user settings (persists across devices), chrome.storage.local for temporary data, preserve user configuration migration capability, maintain privacy with no external data collection, and provide export/import workflows that package settings, auth token, and inhibited site lists for portability.

**Rationale**:
- Sync storage enables cross-device settings
- Local storage for temporary data is efficient
- Migration/export capability preserves user data across browsers and reinstalls
- Privacy is a core value

**Alternatives Considered**:
- All local storage: Rejected - loses cross-device sync
- External storage: Rejected - privacy concerns

**Cross-References**: [REQ:CHROME_STORAGE_USAGE], [REQ:CONFIG_PORTABILITY], [IMPL:STORAGE]

---

### 5. Tag System Architecture [ARCH:TAG_SYSTEM] [REQ:RECENT_TAGS_SYSTEM] [REQ:TAG_INPUT_SANITIZATION]

**Decision**: Implement recent tags system with 5-minute TTL caching, tag suggestions algorithm, recent tags tracking in sync storage, tag history persistence, automatic addition to Recent Tags list when tags are added to records (without duplicate display on current tab), and strict sanitization/validation of every tag before persistence or rendering.

**Rationale**:
- Recent tags improve user productivity
- Caching reduces API calls
- Sync storage enables cross-device tag history
- Tag addition behavior is immutable requirement
- Sanitization prevents XSS/vector injection into both overlay UI and Pinboard requests

**Alternatives Considered**:
- No caching: Rejected - too many API calls
- Local-only tags: Rejected - loses cross-device sync

**Cross-References**: [REQ:RECENT_TAGS_SYSTEM], [REQ:TAG_MANAGEMENT], [REQ:TAG_INPUT_SANITIZATION], [IMPL:TAG_SYSTEM]

---

### 6. User Experience Architecture [ARCH:UX_CORE] [REQ:CORE_UX_PRESERVATION]

**Decision**: Preserve core user experience with hover-based interface activation, non-intrusive semi-transparent overlay, quick bookmark actions without page navigation, tag management with recent tags, and private bookmarking support.

**Rationale**:
- Core UX defines extension value
- Hover interface is unique differentiator
- Non-intrusive design respects user workflow
- Quick actions improve productivity

**Alternatives Considered**:
- Click-based activation: Rejected - less efficient
- Full-page interface: Rejected - too intrusive

**Cross-References**: [REQ:CORE_UX_PRESERVATION], [REQ:OVERLAY_SYSTEM], [IMPL:UX_CORE]

---

### 7. Overlay System Architecture [ARCH:OVERLAY] [REQ:OVERLAY_SYSTEM] [REQ:OVERLAY_AUTO_SHOW_CONTROL] [REQ:OVERLAY_REFRESH_ACTION]

**Decision**: Implement visual overlay system with hover-based activation, transparency controls (10-100% opacity), theme toggle (light-on-dark / dark-on-light), per-window customization, non-intrusive positioning, configurable auto-show behavior that respects inhibit lists and tag-based conditions, and an in-overlay refresh control with full keyboard accessibility for on-demand data sync.

**Rationale**:
- Overlay is core interaction mechanism
- Transparency controls provide user customization
- Theme toggle improves accessibility
- Per-window settings enable flexibility
- Auto-show controls let power users pre-open the overlay while safeguarding sites/tags that should remain quiet
- Refresh control ensures in-place data parity without dismissing the overlay

**Alternatives Considered**:
- Fixed transparency: Rejected - user needs control
- Single theme: Rejected - accessibility concerns

**Cross-References**: [REQ:OVERLAY_SYSTEM], [REQ:OVERLAY_AUTO_SHOW_CONTROL], [REQ:OVERLAY_REFRESH_ACTION], [IMPL:OVERLAY]

---

### 8. Badge System Architecture [ARCH:BADGE] [REQ:BADGE_INDICATORS]

**Decision**: Implement browser action badge management with dynamic badge text based on bookmark status, color coding for different states, tab-specific badge management, and sync with browser action clicks.

**Rationale**:
- Badges provide quick visual feedback
- Status indicators improve UX
- Tab-specific badges show per-page state
- Color coding enhances recognition

**Alternatives Considered**:
- No badges: Rejected - loses visual feedback
- Static badges: Rejected - not informative enough

**Cross-References**: [REQ:BADGE_INDICATORS], [IMPL:BADGE]

---

### 9. Cross-Browser Compatibility Architecture [ARCH:CROSS_BROWSER] [REQ:EXTENSION_IDENTITY]

**Decision**: Use unified browser API shim to abstract differences between Chrome, Firefox, and Safari, with platform detection utilities, Promise-based message passing, storage API abstraction with quota management, and enhanced error handling for platform-specific issues.

**Rationale**:
- Cross-browser support expands user base
- Unified API reduces code duplication
- Platform detection enables optimizations
- Quota management handles Safari constraints

**Alternatives Considered**:
- Platform-specific code: Rejected - too much duplication
- Chrome-only: Rejected - limits user base

**Cross-References**: [REQ:EXTENSION_IDENTITY], [IMPL:CROSS_BROWSER]

---

### 10. Service Worker Architecture [ARCH:SERVICE_WORKER] [REQ:MANIFEST_V3_MIGRATION]

**Decision**: Implement Manifest V3 service worker with lifecycle management (install, activate, update events), message routing setup, extension context integration (browser action, context menu), and modern async/await patterns.

**Rationale**:
- Service workers are V3 requirement
- Lifecycle management ensures proper initialization
- Message routing enables component communication
- Modern patterns improve maintainability

**Alternatives Considered**:
- Background scripts: Rejected - V3 doesn't support
- Event pages: Rejected - V3 uses service workers

**Cross-References**: [REQ:MANIFEST_V3_MIGRATION], [IMPL:SERVICE_WORKER]

---

### 11. Message Handling Architecture [ARCH:MESSAGE_HANDLING] [REQ:SMART_BOOKMARKING]

**Decision**: Implement centralized message routing system with standardized message format and types, request/response pattern with async message handling, comprehensive error handling and retry logic, and input validation and sanitization.

**Rationale**:
- Centralized routing simplifies communication
- Standardized format ensures consistency
- Async patterns improve performance
- Error handling ensures reliability

**Alternatives Considered**:
- Direct function calls: Rejected - doesn't work across extension contexts
- Event-based only: Rejected - need request/response pattern

**Cross-References**: [REQ:SMART_BOOKMARKING], [IMPL:MESSAGE_HANDLING]

---

### 12. Theme System Architecture [ARCH:THEME] [REQ:DARK_THEME]

**Decision**: Implement dark theme support with modern UI, default to dark theme, provide theme toggle capability, and persist user preference in storage.

**Rationale**:
- Dark theme is modern UI expectation
- Default dark theme matches user preferences
- Theme toggle enables user choice
- Preference persistence improves UX

**Alternatives Considered**:
- Light theme only: Rejected - user preference
- System theme detection: Considered but deferred - can add later

**Cross-References**: [REQ:DARK_THEME], [IMPL:THEME]

### 13. Popup Session Persistence Architecture [ARCH:POPUP_SESSION] [REQ:POPUP_PERSISTENT_SESSION]

**Decision**: Route every popup action through `PopupController` so UI events mutate state, dispatch messages, and update `UIManager` without invoking `window.close`. Overlay toggles consult tab messaging responses, fall back to `GET_OVERLAY_STATE` probes when payloads omit visibility data, and update button copy plus accessibility metadata via `UIManager.updateShowHoverButtonState`. Privacy, read-later, delete, reload, and open-options handlers show inline notifications, rely on async messaging/service-worker callbacks, and only allow closing when the user explicitly dismisses the popup.

**Rationale**:
- Preserves a continuous workflow where users chain multiple operations in one popup session
- Ensures overlay state is reflected in the popup even when toggle responses are partial or delayed
- Keeps accessibility metadata accurate while tolerating missing DOM nodes through defensive guards

**Alternatives Considered**:
- Automatically closing the popup after every action: Rejected because it interrupts workflows and contradicts regression test expectations
- Manipulating DOM elements directly without state manager/controller mediation: Rejected due to duplicated logic and inconsistent error handling

**Cross-References**: [REQ:POPUP_PERSISTENT_SESSION], [ARCH:UX_CORE], [ARCH:MESSAGE_HANDLING]

---

### 14. Bookmark State Synchronization Architecture [ARCH:BOOKMARK_STATE_SYNC] [REQ:BOOKMARK_STATE_SYNCHRONIZATION]

**Decision**: Standardize on the `BOOKMARK_UPDATED` broadcast path where overlay controls persist edits through `saveBookmark`, optimistically refresh overlay content, and emit normalized bookmark payloads to the service worker, popup, and badge subsystems. `PopupController` listens on the runtime bus, re-fetches authoritative bookmark data per tab, updates the state manager, and refreshes UI indicators, while badge logic compares popup data with injected tab/bookmark data to detect mismatches. Tag add/remove flows reuse the same pathway, and rapid toggling is guarded via idempotent message payloads plus diagnostic logging.

**Rationale**:
- Prevents divergent private/read-later/tag states between overlay, popup, and badge entry points
- Establishes a single observable contract that automated tests can assert
- Makes future inputs (keyboard shortcuts, context menus) straightforward by reusing the same broadcast pipeline

**Alternatives Considered**:
- Polling Pinboard after each action: Rejected due to latency and API rate limits
- Maintaining separate local stores for each surface: Rejected because it creates race conditions and inconsistent UX

**Cross-References**: [REQ:BOOKMARK_STATE_SYNCHRONIZATION], [ARCH:MESSAGE_HANDLING], [ARCH:OVERLAY], [ARCH:BADGE]

---

### 15. Overlay Control Layout Architecture [ARCH:OVERLAY_CONTROLS] [REQ:OVERLAY_CONTROL_LAYOUT]

**Decision**: Render close and refresh buttons within the overlay chrome using fixed absolute positions (`top: 8px; left: 8px` and `top: 8px; left: 40px`), guaranteeing 32px spacing, enforcing 24px minimum touch targets, and deriving styling from theme CSS variables. A shared helper wires `title`, `aria-label`, `role`, `tabindex`, and keyboard handlers while tolerating missing DOM nodes and logging diagnostic output instead of throwing. Refresh controls reuse the same base styles as close controls to ensure layout alignment introduced by `[REQ:OVERLAY_REFRESH_ACTION]`.

**Rationale**:
- Keeps essential controls consistently discoverable without overlapping bookmark content
- Guarantees accessibility regardless of theme or overlay size
- Simplifies regression testing via deterministic coordinates

**Alternatives Considered**:
- Positioning controls dynamically relative to content height: Rejected due to risk of overlaps on complex pages
- Relying solely on CSS without JS enforcement: Rejected because host-page styles can override positioning

**Cross-References**: [REQ:OVERLAY_CONTROL_LAYOUT], [REQ:OVERLAY_REFRESH_ACTION], [ARCH:OVERLAY]

---

### 16. Safari Adaptive Architecture [ARCH:SAFARI_ADAPTATION] [REQ:SAFARI_ADAPTATION]

**Decision**: Extend the cross-browser shim with Safari-specific configuration (message timeouts/retries, overlay opacity/blur defaults, performance monitoring cadence), animation/memory optimizations in content scripts, and a dedicated Safari error handler that categorizes failures (messaging, storage, UI, performance) before bounded recovery or degraded-mode escalation. Messaging payloads include Safari sender metadata/timestamps, performance monitors trigger proactive cleanup (cache eviction, GC hints, overlay reinitialization) when WebKit heap thresholds are exceeded, and degraded mode dials back monitoring plus retries to keep the overlay usable.

**Rationale**:
- Addresses Safari’s stricter memory limits and messaging bridge quirks without regressing Chrome/Firefox behavior
- Provides deterministic recovery steps validated by dedicated Safari unit suites
- Preserves the Hoverboard identity across browsers per `[REQ:EXTENSION_IDENTITY]`

**Alternatives Considered**:
- Treating Safari identically to Chrome: Rejected due to known instability/performance regressions
- Forking a separate Safari codebase: Rejected because it duplicates most logic and increases maintenance cost

**Cross-References**: [REQ:SAFARI_ADAPTATION], [ARCH:CROSS_BROWSER], [ARCH:OVERLAY], [ARCH:MESSAGE_HANDLING]

---

### 17. Overlay Test Harness Architecture [ARCH:OVERLAY_TESTABILITY] [REQ:OVERLAY_SYSTEM] [REQ:OVERLAY_CONTROL_LAYOUT]

**Decision**: Maintain a purpose-built mock DOM for overlay/unit suites that mirrors key browser behaviors—including automatic element registration whenever `className` or `id` mutate through direct assignments, classList operations, or attribute setters—so overlay buttons, ARIA metadata, and keyboard handlers remain discoverable without relying on a real document.

**Rationale:**
- Overlay verification depends on deterministic discovery of refresh/close controls and tag containers without loading an actual page DOM.
- Direct property assignments (`element.className = ...`) occur frequently inside overlay code; missing hooks caused stale registries and false negatives in `[OVERLAY-TEST-UNIT-001]`.
- Automated class/id re-registration ensures accessibility-specific selectors (`.refresh-button`, `.close-button`) and integration tests (`querySelectorAll`) stay aligned with `[REQ:OVERLAY_CONTROL_LAYOUT]` invariants.

**Alternatives Considered:**
- Rely solely on `setAttribute`-based registration: Rejected because overlay code and tests set `className`/`id` directly, leaving registries stale.
- Swap to jsdom for all overlay suites: Rejected to keep tests lightweight and deterministic without full DOM emulation overhead.

**Cross-References**: [REQ:OVERLAY_SYSTEM], [REQ:OVERLAY_CONTROL_LAYOUT], [ARCH:OVERLAY], [ARCH:OVERLAY_CONTROLS]

---