# ARCH Corpus — out-of-scope LEAP notes

**Date:** 2026-07-29  
**Parent plan:** ARCH_CORPUS_REVIEW_20260729185454-plan.md

## Deferred for future CITDP

1. **Wire Side Panel Browser Bookmarks through BookmarkRouter**  
   Current dual path (direct `chrome.bookmarks` vs Store B provider) is now documented. Unifying mutations through the router would be a product/architecture change, not hygiene.

2. **Promote ARCH-ERROR_HANDLING / ARCH-TESTING_STRATEGY from Template**  
   Left Template with pointers to ARCH-STRUCTURED_LOGGING, ARCH-UI_TESTABILITY, ARCH-CODE_QUALITY. Full strategies need dedicated CITDP + content, not corpus fill-in.

3. **Deduplicate IMPL fan-out on tag/message/side-panel ARCH**  
   Multiple ARCH tokens still list the same IMPLs. Trim to primary owner only in a focused ownership pass (code comments optional).

4. **Cross-browser shim vs EXT_IDENTITY vs Deferred Safari**  
   Boundaries are mostly intentional; a future pass can tighten Active language so Deferred Safari is never misread as in-scope delivery.

5. **Browser create/update times on write**  
   `IMPL-BOOKMARK_CREATE_UPDATE_TIMES` documents that Store B maps Chrome `dateAdded` → `time`/`updated_at` on **read**; `saveBookmark` does not persist payload `time`/`updated_at` (no Chrome field). Do not invent write-path unit tests until product wants a metadata sidecar. Existing read coverage: `tests/unit/browser-bookmark-service.test.js` (`time` truthy after create/lookup).

6. **TIED_YAML_BYPASS**  
   Removed stray `acceptance_criteria: null` from `REQ-URL_TAGS_DISPLAY.yaml` after MCP merge could not delete the key (null set to clear). Direct edit of that one line only; consistency revalidated.
