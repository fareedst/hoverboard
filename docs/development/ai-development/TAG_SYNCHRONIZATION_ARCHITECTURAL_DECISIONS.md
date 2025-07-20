# TAG SYNCHRONIZATION ARCHITECTURAL DECISIONS — Double-Click Delete for Current Tags
*Date: 2025-07-14*

**Semantic Tokens:** `event:double-click`, `action:delete`, `tag:current`, `sync:site-record`, `ui:overlay-window`, `test:tag-deletion`, `arch:atomic-sync`, `SAFARI-EXT-CONTENT-001`

---

## Decisions

- **Atomic Synchronization (`arch:atomic-sync`):**  
  All tag deletions must be atomic to prevent UI/storage desync.

- **UI Event Isolation:**  
  Double-click must not interfere with other tag actions.

- **Semantic Tokenization:**  
  All documentation and code must use semantic tokens for traceability.

- **Cross-Feature Consistency:**  
  Ensure behavior is consistent with other tag and toggle synchronization features.

- **Platform/Language Specifics:**  
  - Event handling must be robust in the browser environment.
  - Synchronization logic must be compatible with the extension’s storage and messaging architecture.

- **Coordination:**  
  - All decisions must be cross-referenced with:
    - `OVERLAY_THEMING_TECHNICAL_SPEC.md`
    - `TOGGLE_SYNCHRONIZATION_SPECIFICATION.md`
    - `SAFARI_EXTENSION_ARCHITECTURE.md`
    - Other tag/toggle synchronization documents. 

## 2025-07-14 Architectural Correction

- Overlay UI actions that require cross-context updates (such as privacy and read later toggles) must use chrome.runtime.sendMessage to communicate with the background script, rather than local message abstractions, to ensure correct message routing and handling.
- Debug logging is required before and after sending such messages to ensure traceability and easier debugging.
- This decision corrects previous architectural gaps that led to message routing errors.

## 2025-07-20 Safari Content Script Adaptations Integration

**Status:** Completed [2025-07-20]  
**Cross-Reference:** `SAFARI-EXT-CONTENT-001`

### Safari-Specific Tag Synchronization Enhancements

**Enhanced Message Processing:**
- Safari-specific message timeout (15 seconds vs 10 seconds for Chrome)
- Enhanced retry mechanism (5 retries vs 3 for Chrome)
- Longer retry delays (2 seconds vs 1 second for Chrome)
- Safari-specific sender information addition to all tag messages
- Platform detection in tag synchronization messages

**Safari-Specific Error Handling:**
- Automatic error recovery with up to 3 attempts for tag operations
- Enhanced error logging with Safari-specific context
- Graceful degradation for failed tag operations
- Safari-specific message validation for tag synchronization

**Cross-Platform Compatibility:**
- Tag synchronization maintains consistency across Chrome and Safari
- Safari-specific optimizations do not affect Chrome tag behavior
- Platform detection ensures appropriate message handling
- Enhanced debugging for cross-platform tag operations

**Implementation Details:**
- All tag messages include Safari-specific sender information when platform detected
- Tag synchronization uses enhanced message passing with Safari optimizations
- Error recovery mechanisms ensure tag operations complete successfully
- Performance monitoring tracks tag operation efficiency across platforms 