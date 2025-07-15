# TAG SYNCHRONIZATION IMPLEMENTATION PLAN — Double-Click Delete for Current Tags
*Date: 2025-07-14*

**Semantic Tokens:** `event:double-click`, `action:delete`, `tag:current`, `sync:site-record`, `ui:overlay-window`, `test:tag-deletion`, `arch:atomic-sync`

---

## Purpose
If the double-click-to-delete is a new requirement, this document specifies the implementation plan.

---

## Steps

1. **Specification Update**  
   - Add requirement for `event:double-click` on `tag:current` in `ui:overlay-window` to trigger `action:delete` and `sync:site-record`.

2. **Architecture**  
   - Ensure event handling is isolated and does not conflict with other UI actions.
   - Synchronization must be atomic (`arch:atomic-sync`).

3. **Implementation Plan**  
   - Add double-click event listener.
   - On double-click, trigger deletion in both UI and persistent storage.

4. **Testing**  
   - Add/expand `test:tag-deletion` in unit and integration tests.

5. **Documentation**  
   - All new/updated docs must use semantic tokens and cross-reference related features. 

## 2025-07-14 Implementation Correction

- Overlay window toggles (privacy, read later) now send BOOKMARK_UPDATED messages directly to the background using chrome.runtime.sendMessage.
- Debug logging has been added to trace message sending and responses.
- This corrects previous issues where messages were not routed to the background, resulting in errors.
- The implementation has been tested and both toggles now work as intended. 