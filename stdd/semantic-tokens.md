# Semantic Tokens Directory

**STDD Methodology Version**: 1.0.0

## Overview
This document serves as the **central directory/registry** for all semantic tokens used in the project. Semantic tokens (`[REQ:*]`, `[ARCH:*]`, `[IMPL:*]`) provide a consistent vocabulary and traceability mechanism that ties together all documentation, code, and tests.

**For detailed information about tokens, see:**
- **Requirements tokens**: See `requirements.md` for full descriptions, rationale, satisfaction criteria, and validation criteria
- **Architecture tokens**: See `architecture-decisions.md` for architectural decisions, rationale, and alternatives considered
- **Implementation tokens**: See `implementation-decisions.md` for implementation details, code structures, and algorithms

## Token Format

```
[TYPE:IDENTIFIER]
```

## Token Types

- `[REQ:*]` - Requirements (functional/non-functional) - **The source of intent**
- `[ARCH:*]` - Architecture decisions - **High-level design choices that preserve intent**
- `[IMPL:*]` - Implementation decisions - **Low-level choices that preserve intent**
- `[TEST:*]` - Test specifications - **Validation of intent**

## Token Naming Convention

- Use UPPER_SNAKE_CASE for identifiers
- Be descriptive but concise
- Example: `[REQ:DUPLICATE_PREVENTION]` not `[REQ:DP]`

## Cross-Reference Format

When referencing other tokens:

```markdown
[IMPL:EXAMPLE] Description [ARCH:DESIGN] [REQ:REQUIREMENT]
```

## Requirements Tokens Registry

**📖 Full details**: See `requirements.md`

### Immutable Requirements
- `[REQ:EXTENSION_IDENTITY]` - Extension Identity Preservation
- `[REQ:CORE_UX_PRESERVATION]` - Core User Experience Preservation
- `[REQ:MANIFEST_V3_MIGRATION]` - Manifest V3 Migration
- `[REQ:PINBOARD_COMPATIBILITY]` - Pinboard API Compatibility
- `[REQ:CHROME_STORAGE_USAGE]` - Chrome Storage API Usage
- `[REQ:RECENT_TAGS_SYSTEM]` - Recent Tags System

### Core Functional Requirements
- `[REQ:SMART_BOOKMARKING]` - Smart Bookmarking
- `[REQ:TAG_MANAGEMENT]` - Tag Management
- `[REQ:DARK_THEME]` - Dark Theme Support
- `[REQ:OVERLAY_SYSTEM]` - Overlay System
- `[REQ:OVERLAY_AUTO_SHOW_CONTROL]` - Hover Auto-Show Controls
- `[REQ:OVERLAY_REFRESH_ACTION]` - Overlay Refresh Control
- `[REQ:POPUP_PERSISTENT_SESSION]` - Popup Session Persistence
- `[REQ:BOOKMARK_STATE_SYNCHRONIZATION]` - Bookmark State Synchronization
- `[REQ:BADGE_INDICATORS]` - Badge Indicators
- `[REQ:SITE_MANAGEMENT]` - Site Management
- `[REQ:SEARCH_FUNCTIONALITY]` - Search Functionality
- `[REQ:PRIVACY_CONTROLS]` - Privacy Controls
- `[REQ:OVERLAY_CONTROL_LAYOUT]` - Overlay Control Layout

### Non-Functional Requirements
- `[REQ:CONFIG_PORTABILITY]` - Configuration Import/Export
- `[REQ:TAG_INPUT_SANITIZATION]` - Tag Input Sanitization
- `[REQ:SAFARI_ADAPTATION]` - Safari Adaptive Behavior

## Architecture Tokens Registry

**📖 Full details**: See `architecture-decisions.md`

- `[ARCH:EXT_IDENTITY]` - Extension Identity Architecture
- `[ARCH:MV3_MIGRATION]` - Manifest V3 Migration Strategy
- `[ARCH:PINBOARD_API]` - Pinboard API Integration Architecture
- `[ARCH:STORAGE]` - Storage Strategy
- `[ARCH:TAG_SYSTEM]` - Tag System Architecture
- `[ARCH:UX_CORE]` - User Experience Architecture
- `[ARCH:OVERLAY]` - Overlay System Architecture
- `[ARCH:BADGE]` - Badge System Architecture
- `[ARCH:CROSS_BROWSER]` - Cross-Browser Compatibility Architecture
- `[ARCH:SERVICE_WORKER]` - Service Worker Architecture
- `[ARCH:MESSAGE_HANDLING]` - Message Handling Architecture
- `[ARCH:THEME]` - Theme System Architecture
- `[ARCH:POPUP_SESSION]` - Popup Session Persistence Architecture
- `[ARCH:BOOKMARK_STATE_SYNC]` - Bookmark State Synchronization Architecture
- `[ARCH:OVERLAY_CONTROLS]` - Overlay Control Layout Architecture
- `[ARCH:SAFARI_ADAPTATION]` - Safari Adaptive Architecture

## Implementation Tokens Registry

**📖 Full details**: See `implementation-decisions.md`

- `[IMPL:PINBOARD_API]` - Pinboard API Service Implementation
- `[IMPL:MESSAGE_HANDLING]` - Message Handling System Implementation
- `[IMPL:CONTENT_SCRIPT]` - Content Script Injection Implementation
- `[IMPL:TAG_SYSTEM]` - Tag Service Implementation
- `[IMPL:BADGE]` - Badge Management Implementation
- `[IMPL:STORAGE]` - Configuration Management Implementation
- `[IMPL:SERVICE_WORKER]` - Service Worker Implementation
- `[IMPL:OVERLAY]` - Overlay Visibility Controls Implementation
- `[IMPL:CROSS_BROWSER]` - Cross-Browser API Shim Implementation
- `[IMPL:ERROR_HANDLING]` - Error Handling Framework Implementation
- `[IMPL:EXT_IDENTITY]` - Identity Implementation
- `[IMPL:UX_CORE]` - UX Implementation
- `[IMPL:THEME]` - Theme Implementation
- `[IMPL:BOOKMARKING]` - Bookmark Implementation
- `[IMPL:TAG_MGMT]` - Tag Management Implementation
- `[IMPL:SITE_MGMT]` - Site Management Implementation
- `[IMPL:SEARCH]` - Search Implementation
- `[IMPL:PRIVACY]` - Privacy Implementation
- `[IMPL:MV3_MIGRATION]` - MV3 Implementation
- `[IMPL:POPUP_SESSION]` - Popup Session Persistence Implementation
- `[IMPL:BOOKMARK_STATE_SYNC]` - Bookmark State Synchronization Implementation
- `[IMPL:OVERLAY_CONTROLS]` - Overlay Control Layout Implementation
- `[IMPL:SAFARI_ADAPTATION]` - Safari Adaptive Implementation

## Token Relationships

### Hierarchical Relationships
- `[REQ:FEATURE]` → `[ARCH:DESIGN]` → `[IMPL:IMPLEMENTATION]` → Code + Tests

### Flow Relationships
- `[REQ:FEATURE]` → `[ARCH:DESIGN]` → `[IMPL:IMPLEMENTATION]` → Code + Tests

### Dependency Relationships
- `[IMPL:FEATURE]` depends on `[ARCH:DESIGN]` and `[REQ:FEATURE]`
- `[ARCH:DESIGN]` depends on `[REQ:FEATURE]`

## Usage Examples

### In Code Comments
```javascript
// [REQ:FEATURE_NAME] Brief description
// [IMPL:IMPLEMENTATION_NAME] [ARCH:ARCHITECTURE_NAME] [REQ:FEATURE_NAME]
function featureFunction() {
    // ...
}
```

### In Tests
```javascript
// Test validates [REQ:FEATURE_NAME] is met
test('feature name REQ_FEATURE_NAME', () => {
    // ...
})
```

### In Documentation
```markdown
The feature uses [ARCH:ARCHITECTURE_NAME] to fulfill [REQ:FEATURE_NAME].
Implementation details are documented in [IMPL:IMPLEMENTATION_NAME].
```

## Token Validation Guidelines

### Cross-Layer Token Consistency

Every feature must have proper token coverage across all layers:

1. **Requirements Layer**: Feature must have `[REQ:*]` token in `requirements.md`
2. **Architecture Layer**: Architecture decisions must have `[ARCH:*]` tokens in `architecture-decisions.md`
3. **Implementation Layer**: Implementation must have `[IMPL:*]` tokens in code comments
4. **Test Layer**: Tests must reference `[REQ:*]` tokens in test names/comments
5. **Documentation Layer**: All documentation must cross-reference tokens consistently

### Token Format Validation

1. **Token Format**: Must follow `[TYPE:IDENTIFIER]` pattern exactly
2. **Token Types**: Must use valid types (`REQ`, `ARCH`, `IMPL`, `TEST`)
3. **Identifier Format**: Must use UPPER_SNAKE_CASE
4. **Cross-References**: Implementation tokens must reference architecture and requirement tokens

### Token Traceability Validation

1. Every requirement in `requirements.md` must have corresponding implementation tokens
2. Every architecture decision must have corresponding implementation tokens
3. Every test must link to specific requirements via `[REQ:*]` tokens
4. All tokens must be discoverable through automated validation

## Token Creation Requirements

When implementing features:
1. **ALWAYS** create `[REQ:*]` token in `requirements.md` first
2. **ALWAYS** create `[ARCH:*]` token in `architecture-decisions.md` for design decisions
3. **ALWAYS** add `[IMPL:*]` tokens to code comments
4. **ALWAYS** reference `[REQ:*]` tokens in test names/comments
5. **ALWAYS** update `semantic-tokens.md` registry when creating new tokens
