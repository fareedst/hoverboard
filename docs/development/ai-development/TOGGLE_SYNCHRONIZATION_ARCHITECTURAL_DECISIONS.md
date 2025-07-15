# TOGGLE_SYNCHRONIZATION_ARCHITECTURAL_DECISIONS.md

## Architectural Decisions: Toggle Synchronization

**Date:** 2025-07-15  
**Semantic Tokens:** [TOGGLE_SYNC_ARCH_DECISION], [TOGGLE_SYNC_MESSAGE], [TOGGLE_SYNC_SITE_RECORD], [TOGGLE_SYNC_POPUP], [TOGGLE_SYNC_OVERLAY], [TOGGLE_SYNC_SPEC]
**Cross-References:** [OVERLAY-DATA-DISPLAY-001], [OVERLAY-DATA-FIX-001], [SAFARI-EXT-SHIM-001]

---

### 1. Message Passing Architecture
- Use browser extension messaging (e.g., `chrome.runtime.sendMessage` or equivalent) for cross-window communication between popup and overlay.  
  **[TOGGLE_SYNC_MESSAGE]**
- All toggle state changes are broadcast via a dedicated message type (e.g., `TOGGLE_STATE_CHANGED`).
- Both popup and overlay must listen for and respond to these messages.

---

### 2. State Management
- The toggle state is stored in a single source of truth (background script or extension storage).  
  **[TOGGLE_SYNC_SITE_RECORD]**
- UI components (popup and overlay) must always reflect the current state from this shared source.
- No independent or local-only state is permitted for toggles.

---

### 3. UI Update Mechanism
- Both popup and overlay windows subscribe to state changes and update their UI accordingly.  
  **[TOGGLE_SYNC_POPUP]**, **[TOGGLE_SYNC_OVERLAY]**
- UI updates must be idempotent and robust to rapid or repeated state changes.

---

### 4. Error Handling and Robustness
- All message passing and state updates must include error handling and fallback logic.  
  **[TOGGLE_SYNC_ARCH_DECISION]**
- The system must be robust to window reloads, extension reloads, and race conditions.

---

### 5. Coordination with Existing Architecture
- This architecture must coordinate with and, where possible, improve upon:
  - `DARK_THEME_DEFAULT_ARCHITECTURE.md`
  - `OVERLAY_THEMING_TECHNICAL_SPEC.md`
  - `TAG_SYNCHRONIZATION_ARCHITECTURAL_DECISIONS.md`
  - `OVERLAY_DATA_DISPLAY_SEMANTIC_TOKENS.md`
- No duplication of state management or messaging patterns is permitted.
- Any improvements or changes must be reflected in the above documents as needed.  
  **[TOGGLE_SYNC_SPEC]**

### 6. Overlay Data Display Coordination
**[OVERLAY-DATA-DISPLAY-001]** - Master semantic token for overlay data display functionality

#### Data Display Synchronization
- **Requirement**: Overlay must display same bookmark data as popup and badge
- **Implementation**: Fixed content script response handling **[OVERLAY-DATA-FIX-001]**
- **Validation**: Enhanced debugging ensures data structure consistency
- **Cross-Reference**: Coordinates with toggle synchronization for consistent state management

#### Platform Compatibility
**[SAFARI-EXT-SHIM-001]** - Safari browser API abstraction
- **Browser API**: Use webextension-polyfill for cross-platform compatibility
- **Data Flow**: Ensure consistent data flow across Chrome and Safari
- **Testing**: Comprehensive testing for both platforms

---

### 6. Semantic Token Usage
- All architectural decisions, code, and documentation must reference the appropriate semantic tokens for traceability and cross-referencing.  
  **[TOGGLE_SYNC_ARCH_DECISION]**

---

### 7. Platform and Language Specifics
- The solution is designed for browser extension environments (e.g., Chrome, Firefox, Edge).  
  **[TOGGLE_SYNC_ARCH_DECISION]**
- All messaging and storage APIs must be compatible with supported browsers.
- Code and documentation must note any platform-specific constraints or optimizations. 