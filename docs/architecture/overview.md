# Hoverboard Extension Architecture Overview

**Date:** 2025-07-14  
**Status:** Active Development  
**Semantic Tokens:** `ARCH-OVERVIEW-001`, `SAFARI-EXT-COORD-001`

## Overview

This document provides a high-level overview of the Hoverboard browser extension architecture, including cross-browser support with a focus on Safari compatibility. All architectural decisions are coordinated across all supported platforms.

## [ARCH-OVERVIEW-001] Core Architecture Principles

### Cross-Browser Compatibility

**Principle:** The extension must work identically across Chrome, Firefox, and Safari while leveraging platform-specific optimizations.

**Implementation:**
- Unified browser API abstraction (`SAFARI-EXT-API-001`)
- Platform detection utilities (`SAFARI-EXT-SHIM-001`)
- Cross-browser testing strategy (`SAFARI-EXT-TEST-001`)

**Cross-References:**
- `docs/architecture/safari-extension-architecture.md`: Safari-specific architecture
- `SAFARI-EXT-COORD-001`: Architecture coordination

### State Management Strategy

**Principle:** State must be managed consistently across all supported browsers, with special handling for platform-specific constraints.

**Implementation:**
- Shared memory management for recent tags (`SAFARI-EXT-STORAGE-001`)
- Cross-popup state synchronization (`SAFARI-EXT-IMPL-001`)
- Storage quota monitoring for Safari (`SAFARI-EXT-STORAGE-001`)

**Cross-References:**
- `docs/development/ai-development/TAG_SYNCHRONIZATION_ARCHITECTURAL_DECISIONS.md`: Tag synchronization
- `docs/development/ai-development/TOGGLE_SYNCHRONIZATION_ARCHITECTURAL_DECISIONS.md`: Toggle synchronization

### Testability Strategy

**Principle:** All platform-specific code paths must be testable via dependency injection or global mocks.

**Implementation:**
- Comprehensive mocking in `tests/setup.js` (`SAFARI-EXT-TEST-001`)
- Unit tests for platform-specific functionality
- Integration tests for cross-browser compatibility

**Cross-References:**
- `docs/development/ai-development/SAFARI_EXTENSION_TEST_PLAN.md`: Safari test plan
- `SAFARI-EXT-TEST-001`: Safari-specific tests

## [SAFARI-EXT-COORD-001] Safari Architecture Coordination

### Browser API Abstraction

**Coordination:** Safari extension uses a unified browser API shim to abstract differences between platforms.

**Cross-References:**
- `SAFARI-EXT-API-001`: Browser API abstraction implementation
- `SAFARI-EXT-SHIM-001`: Platform detection utilities

### Storage and State Management

**Coordination:** Safari extension implements storage quota monitoring and cross-popup state management.

**Cross-References:**
- `SAFARI-EXT-STORAGE-001`: Storage quota management
- `SAFARI-EXT-IMPL-001`: Safari implementation details

### Message Passing and Communication

**Coordination:** Safari extension enhances message passing with platform info and error handling.

**Cross-References:**
- `SAFARI-EXT-MESSAGING-001`: Message passing enhancements
- `SAFARI-EXT-ERROR-001`: Error handling and recovery

### UI and Overlay System

**Coordination:** Safari extension adapts UI components and overlay system for platform-specific requirements.

**Cross-References:**
- `docs/development/ai-development/OVERLAY_THEMING_TECHNICAL_SPEC.md`: Overlay theming
- `docs/architecture/DARK_THEME_DEFAULT_ARCHITECTURE.md`: Dark theme architecture
- `SAFARI-EXT-UI-001`: UI and overlay system

## Architecture Components

### Core Components

| Component | Description | Safari Coordination |
|-----------|-------------|-------------------|
| Browser API Abstraction | Unified API for cross-browser compatibility | `SAFARI-EXT-API-001` |
| Storage Management | Cross-browser storage with quota monitoring | `SAFARI-EXT-STORAGE-001` |
| Message Passing | Enhanced messaging with platform info | `SAFARI-EXT-MESSAGING-001` |
| State Management | Cross-popup and cross-instance state | `SAFARI-EXT-IMPL-001` |
| UI Components | Platform-specific UI adaptations | `SAFARI-EXT-UI-001` |
| Overlay System | Platform-specific overlay management | `SAFARI-EXT-UI-001` |

### Testing Components

| Component | Description | Safari Coordination |
|-----------|-------------|-------------------|
| Unit Tests | Platform-specific functionality testing | `SAFARI-EXT-TEST-001` |
| Integration Tests | Cross-component testing | `SAFARI-EXT-INTEGRATION-001` |
| Performance Tests | Performance benchmarking | `SAFARI-EXT-PERF-001` |
| Error Handling Tests | Error scenario testing | `SAFARI-EXT-ERROR-001` |
| Compatibility Tests | Cross-browser compatibility | `SAFARI-EXT-COMPAT-001` |

## Cross-Reference Summary

| Semantic Token | Description | Files | Status |
|----------------|-------------|-------|--------|
| `ARCH-OVERVIEW-001` | Architecture overview | This document | ✅ Complete |
| `SAFARI-EXT-COORD-001` | Safari architecture coordination | All architecture docs | ✅ Complete |
| `SAFARI-EXT-API-001` | Browser API abstraction | safari-shim.js | ✅ Complete |
| `SAFARI-EXT-STORAGE-001` | Storage quota management | tag-service.js, safari-shim.js | ✅ Complete |
| `SAFARI-EXT-MESSAGING-001` | Message passing enhancements | message-handler.js, safari-shim.js | ✅ Complete |
| `SAFARI-EXT-IMPL-001` | Safari implementation details | All Safari-specific code | 🔄 In Progress |
| `SAFARI-EXT-UI-001` | UI and overlay system | popup.js, overlay-manager.js | 📋 Planned |
| `SAFARI-EXT-TEST-001` | Safari-specific tests | All Safari test files | 🔄 In Progress |

## Related Documents

- `docs/architecture/safari-extension-architecture.md`: Safari architecture decisions
- `docs/development/ai-development/SAFARI_EXTENSION_IMPLEMENTATION_PLAN.md`: Safari implementation plan
- `docs/development/ai-development/SAFARI_EXTENSION_TEST_PLAN.md`: Safari test plan
- `docs/development/ai-development/SAFARI_EXTENSION_SEMANTIC_TOKENS.md`: Safari semantic tokens
- `docs/architecture/DARK_THEME_DEFAULT_ARCHITECTURE.md`: Dark theme architecture
- `docs/development/ai-development/OVERLAY_THEMING_TECHNICAL_SPEC.md`: Overlay theming
- `docs/development/ai-development/TAG_SYNCHRONIZATION_ARCHITECTURAL_DECISIONS.md`: Tag synchronization
- `docs/development/ai-development/TOGGLE_SYNCHRONIZATION_ARCHITECTURAL_DECISIONS.md`: Toggle synchronization