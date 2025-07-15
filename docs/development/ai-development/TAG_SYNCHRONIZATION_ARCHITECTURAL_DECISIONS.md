# TAG SYNCHRONIZATION ARCHITECTURAL DECISIONS — Double-Click Delete for Current Tags
*Date: 2025-07-14*

**Semantic Tokens:** `event:double-click`, `action:delete`, `tag:current`, `sync:site-record`, `ui:overlay-window`, `test:tag-deletion`, `arch:atomic-sync`

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
    - Other tag/toggle synchronization documents. 

## 2025-07-14 Architectural Correction

- Overlay UI actions that require cross-context updates (such as privacy and read later toggles) must use chrome.runtime.sendMessage to communicate with the background script, rather than local message abstractions, to ensure correct message routing and handling.
- Debug logging is required before and after sending such messages to ensure traceability and easier debugging.
- This decision corrects previous architectural gaps that led to message routing errors. 