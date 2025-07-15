# 🦁 Safari Extension Architecture Decisions

**Semantic Token:** [SAFARI-EXT-ARCH-001]
**Date:** 2025-07-15

---

## Overview
This document records all strategic and architectural decisions for the Safari version of the Hoverboard extension. All decisions are cross-referenced with existing architecture documents and use the [SAFARI-EXT-ARCH-001] semantic token family for traceability.

---

## 1. Platform Targeting
- **Target:** Safari 17+ (macOS, iOS) using the Safari Web Extensions API.
- **Strategy:** Use the WebExtensions API for maximum code sharing with Chrome/Firefox ([overview.md]).
- **Build System:** Integrate Xcode project for packaging, signing, and distribution on the Mac App Store.
- **Manifest:** Use `manifest.json` (MV3) with Safari-specific keys as needed ([SAFARI-EXT-MANIFEST-001]).

## 2. Codebase Structure
- **Reuse:** Share all core logic, UI, and features with the Chrome version, using platform-specific shims as needed ([SAFARI-EXT-SHIM-001]).
- **Abstraction:** Introduce a `browser` API abstraction layer ([webextension-polyfill]) ([SAFARI-EXT-SHIM-001]).
- **Platform Detection:** Add runtime checks for Safari-specific behaviors.

## 3. UI and Theming
- **CSS:** Ensure all CSS custom properties and theming are tested in Safari ([OVERLAY-THEMING-001]).
- **Fonts:** Use system font stacks including `-apple-system` ([overview.md], line 236).
- **Popup/Overlay:** Test popup and overlay sizing, focus, and event handling in Safari.

## 4. Messaging and Storage
- **Messaging:** Use the standard WebExtensions messaging API ([TOGGLE_SYNC_MESSAGE]).
- **Storage:** Use `browser.storage` for settings and state. Validate quota and sync support in Safari.

## 5. Permissions and Manifest
- **Permissions:** Audit all permissions for Safari compatibility.
- **Manifest:** Add `safari`-specific keys if needed ([SAFARI-EXT-MANIFEST-001]).

## 6. Testing and Validation
- **Automated Tests:** Extend test suites to run in Safari ([SAFARI-EXT-TEST-001]).
- **Manual QA:** Test all features in Safari Technology Preview and release versions.
- **Accessibility:** Validate overlays and popups for VoiceOver and keyboard navigation.

## 7. Distribution
- **Packaging:** Use Xcode to wrap the extension for the Mac App Store ([SAFARI-EXT-DIST-001]).
- **Signing:** Follow Apple’s notarization and signing requirements.
- **Updates:** Plan for App Store review cycles and update delays.

---

## 8. Coordination with Existing Architecture
- All decisions here are cross-referenced with:
  - [DARK_THEME_DEFAULT_ARCHITECTURE.md]
  - [TOGGLE_SYNCHRONIZATION_ARCHITECTURAL_DECISIONS.md]
  - [TAG_SYNCHRONIZATION_ARCHITECTURAL_DECISIONS.md]
  - [OVERLAY_THEMING_TECHNICAL_SPEC.md]
  - [AI-FIRST-001] and [feature-tracking-matrix.md]
- Any improvements or platform-specific changes must be reflected in these documents as needed.

---

## 9. Semantic Token Usage
- All new and updated files must include semantic tokens for traceability.
- All platform-specific decisions, shims, and test cases must be documented and referenced in the feature registry.

---

**[SAFARI-EXT-ARCH-001]** 