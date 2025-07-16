# Safari Extension Architecture

**Date:** 2025-07-14  
**Status:** Active Development  
**Semantic Tokens:** `SAFARI-EXT-ARCH-001`, `SAFARI-EXT-API-001`, `SAFARI-EXT-COORD-001`

## Overview

This document outlines the architectural decisions and implementation strategy for Safari browser extension support in the Hoverboard project. All architectural decisions are coordinated with existing architecture documents and use semantic tokens for complete cross-referencing.

## [SAFARI-EXT-ARCH-001] Core Architectural Decisions

### Browser API Abstraction Strategy

**Decision:** Use a unified browser API shim to abstract differences between Chrome, Firefox, and Safari.

**Implementation:** `src/shared/safari-shim.js` provides a unified `browser` API that wraps platform-specific implementations.

**Cross-References:**
- `SAFARI-EXT-API-001`: Browser API abstraction implementation
- `SAFARI-EXT-TEST-001`: Test coverage for API abstraction
- `SAFARI-EXT-IMPL-001`: Safari-specific implementation details

### State Management Strategy

**Decision:** Cross-popup and cross-instance state must be managed consistently across all supported browsers, with special handling for Safari's storage and messaging quirks.

**Implementation:** 
- Shared memory management for recent tags (`SAFARI-EXT-IMPL-001`)
- Storage quota monitoring for Safari (`SAFARI-EXT-STORAGE-001`)
- Message passing enhancements for Safari (`SAFARI-EXT-MESSAGING-001`)

**Cross-References:**
- `docs/architecture/overview.md`: Overall state management strategy
- `docs/development/ai-development/TAG_SYNCHRONIZATION_ARCHITECTURAL_DECISIONS.md`: Tag synchronization

### Testability Strategy

**Decision:** All platform-specific code paths must be testable via dependency injection or global mocks, with tests for both success and failure/error conditions.

**Implementation:**
- Comprehensive mocking in `tests/setup.js` (`SAFARI-EXT-TEST-001`)
- Unit tests for Safari-specific functionality (`tests/unit/safari-shim.test.js`)
- Integration tests for cross-browser compatibility (`tests/integration/popup-tag-integration.test.js`)

## [SAFARI-EXT-API-001] Browser API Abstraction

### Chrome API Compatibility

The Safari shim provides Chrome API compatibility through:
- Promise-based message passing
- Storage API abstraction
- Tab querying with Safari-specific filtering
- Platform detection utilities

### Safari-Specific Enhancements

**Storage Quota Management:**
- Real-time storage usage monitoring
- Warning system for high usage (>80%)
- Graceful fallback for unsupported features

**Message Passing:**
- Enhanced messages with platform info
- Error handling for Safari-specific issues
- Async/await compatibility

**Tab Querying:**
- Filtering of Safari internal pages
- Error handling for tab query failures
- Cross-browser compatibility

## [SAFARI-EXT-COORD-001] Coordination with Existing Architecture

### Dark Theme Architecture

**Coordination:** Safari extension must support the dark theme default implementation.

**Cross-References:**
- `docs/architecture/DARK_THEME_DEFAULT_ARCHITECTURE.md`
- `SAFARI-EXT-IMPL-001`: Theme implementation in Safari

### Overlay Architecture

**Coordination:** Safari extension must support the overlay theming and functionality.

**Cross-References:**
- `docs/development/ai-development/OVERLAY_THEMING_TECHNICAL_SPEC.md`
- `SAFARI-EXT-IMPL-001`: Overlay implementation in Safari

### Tag Synchronization

**Coordination:** Safari extension must support the tag synchronization architecture.

**Cross-References:**
- `docs/development/ai-development/TAG_SYNCHRONIZATION_ARCHITECTURAL_DECISIONS.md`
- `SAFARI-EXT-IMPL-001`: Tag synchronization in Safari

### Toggle Synchronization

**Coordination:** Safari extension must support the toggle synchronization architecture.

**Cross-References:**
- `docs/development/ai-development/TOGGLE_SYNCHRONIZATION_ARCHITECTURAL_DECISIONS.md`
- `SAFARI-EXT-IMPL-001`: Toggle synchronization in Safari

## Implementation Status

### Completed
- [x] Basic Safari shim implementation (`SAFARI-EXT-API-001`)
- [x] Storage quota management (`SAFARI-EXT-STORAGE-001`)
- [x] Message passing enhancements (`SAFARI-EXT-MESSAGING-001`)
- [x] Tab querying with filtering (`SAFARI-EXT-CONTENT-001`)
- [x] Platform detection utilities (`SAFARI-EXT-SHIM-001`)

### In Progress
- [ ] Test coverage improvements (`SAFARI-EXT-TEST-001`)
- [ ] Cross-popup state management (`SAFARI-EXT-IMPL-001`)
- [ ] Error handling enhancements (`SAFARI-EXT-IMPL-001`)

### Planned
- [ ] Safari-specific UI optimizations
- [ ] Performance optimizations for Safari
- [ ] Safari App Extension support (if needed)

## Cross-Reference Summary

| Semantic Token | Description | Files |
|----------------|-------------|-------|
| `SAFARI-EXT-ARCH-001` | Safari architecture decisions | This document, safari-shim.js |
| `SAFARI-EXT-API-001` | Browser API abstraction | safari-shim.js, tests |
| `SAFARI-EXT-IMPL-001` | Safari implementation details | All Safari-specific code |
| `SAFARI-EXT-TEST-001` | Safari-specific tests | All Safari test files |
| `SAFARI-EXT-STORAGE-001` | Storage quota management | safari-shim.js, storage tests |
| `SAFARI-EXT-MESSAGING-001` | Message passing enhancements | safari-shim.js, messaging tests |
| `SAFARI-EXT-CONTENT-001` | Tab querying and filtering | safari-shim.js, content tests |
| `SAFARI-EXT-SHIM-001` | Platform detection utilities | safari-shim.js, platform tests |
| `SAFARI-EXT-COORD-001` | Architecture coordination | All architecture documents |

## Related Documents

- `docs/architecture/overview.md`: Overall architecture
- `docs/architecture/DARK_THEME_DEFAULT_ARCHITECTURE.md`: Dark theme architecture
- `docs/development/ai-development/OVERLAY_THEMING_TECHNICAL_SPEC.md`: Overlay theming
- `docs/development/ai-development/TAG_SYNCHRONIZATION_ARCHITECTURAL_DECISIONS.md`: Tag synchronization
- `docs/development/ai-development/TOGGLE_SYNCHRONIZATION_ARCHITECTURAL_DECISIONS.md`: Toggle synchronization
- `docs/development/ai-development/SAFARI_EXTENSION_IMPLEMENTATION_PLAN.md`: Implementation plan
- `docs/development/ai-development/SAFARI_EXTENSION_TEST_PLAN.md`: Test plan 