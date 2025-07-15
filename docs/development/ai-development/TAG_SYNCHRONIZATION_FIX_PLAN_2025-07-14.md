# TAG SYNCHRONIZATION FIX PLAN — Double-Click Delete for Current Tags
*Date: 2025-07-14*

**Semantic Tokens:** `event:double-click`, `action:delete`, `tag:current`, `sync:site-record`, `ui:overlay-window`, `test:tag-deletion`, `arch:atomic-sync`

---

## Purpose
This document outlines the plan to restore and improve the double-click-to-delete functionality for Current tags in the overlay window, ensuring the tag is also deleted from the site’s record.

---

## Steps

1. **Audit Current Implementation**  
   - Review event handling for `event:double-click` on `tag:current` in `ui:overlay-window`.
   - Confirm that `action:delete` triggers `sync:site-record` atomically (`arch:atomic-sync`).

2. **Test Improvement**  
   - Expand `test:tag-deletion` in unit and integration tests to cover:
     - Double-click event triggers deletion.
     - Tag is removed from both UI and persistent storage.
     - No side effects on other tags or features.

3. **Restore Functionality**  
   - Fix any broken logic in event handling or synchronization.
   - Ensure atomicity and UI consistency.

4. **Documentation & Cross-References**  
   - Update all related docs with semantic tokens.
   - Cross-link to:  
     - `TAG_SYNCHRONIZATION_SPECIFICATION.md`  
     - `TAG_SYNCHRONIZATION_ARCHITECTURAL_DECISIONS.md`  
     - `TAG_SYNCHRONIZATION_SEMANTIC_TOKENS.md` 

## 2025-07-14 Corrections and Decisions

- The overlay window's privacy and read later toggles now send BOOKMARK_UPDATED messages directly to the background using chrome.runtime.sendMessage, bypassing the local messageService abstraction for this message type.
- Debug logs have been added before and after sending BOOKMARK_UPDATED to trace message flow and responses.
- This change resolves previous errors where the overlay attempted to send BOOKMARK_UPDATED via a local message bus, resulting in 'Unknown message type' errors.
- Both toggles have been tested in the browser and now work as expected, with correct updates to bookmark privacy and read later status.
- No large sections of existing specifications were deleted; all changes are additive and corrective. 