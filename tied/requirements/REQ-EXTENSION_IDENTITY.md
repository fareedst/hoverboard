# [REQ-EXTENSION_IDENTITY] Extension Identity Preservation

**Category**: Immutable  
**Priority**: P0 (Critical)  
**Status**: ✅ Implemented  
**Created**: 2025-07-14  
**Last Updated**: 2026-02-13

---

## Description

The extension must maintain its core identity as "Hoverboard" - a Pinboard.in bookmarking interface enhancement. The name, purpose, and target platform (Chrome/Chromium-based browsers) must never change.

## Rationale

Core extension identity is fundamental to user recognition and brand consistency. Changing this would break user expectations and require complete rebranding.

## Satisfaction Criteria

- Extension name remains "Hoverboard" in all contexts
- Purpose remains Pinboard.in bookmarking interface enhancement
- Target platform remains Chrome/Chromium-based browsers
- Architecture remains browser extension with content script injection

## Validation Criteria

- Manifest.json name field validation
- Documentation consistency checks
- Branding audit in all user-facing interfaces

## Traceability

- **Architecture**: See `architecture-decisions.yaml` § [ARCH-EXT_IDENTITY]
- **Implementation**: See `implementation-decisions.yaml` § [IMPL-EXT_IDENTITY]
- **Tests**: Manifest validation tests, branding consistency tests
- **Code**: manifest.json, README.md, all user-facing UI files

## Related Requirements

- None (foundational requirement)

## Notes

This is an immutable requirement - changes require major version bump and full rebranding.
