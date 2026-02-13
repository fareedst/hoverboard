# [IMPL-RECENT_TAGS_POPUP_REFRESH] Recent Tags refresh on every popup display

**Status**: Active  
**Cross-references**: REQ-RECENT_TAGS_SYSTEM, ARCH-POPUP_SESSION

---

## Summary

The Recent Tags list is refreshed whenever the popup document becomes visible by listening for `document.visibilitychange` and calling `loadRecentTags()` when the document is visible and the popup is initialized. This ensures tags saved in one browser window appear in the Recent Tags list when the popup is displayed in this or any other window.

## Rationale

- **Problem**: In environments where the popup document is reused (e.g. without a full reload), the Recent Tags list might not be refreshed when the popup is shown again. Users expect the list to reflect the shared service-worker state every time they see the popup.
- **Solution**: Register a `visibilitychange` listener in `PopupController.setupAutoRefresh()`. When `document.visibilityState === 'visible'` and the controller is initialized and not loading, call `loadRecentTags()` so the UI is updated from the service worker’s `recentTagsMemory`.

## Implementation

- **File**: `src/ui/popup/PopupController.js`
- **Function**: `setupAutoRefresh()` — adds `document.addEventListener('visibilitychange', ...)` that invokes `this.loadRecentTags()` when visible and initialized (with `!this.isLoading` guard).

## Related

- REQ-RECENT_TAGS_SYSTEM (recent tags behavior)
- ARCH-POPUP_SESSION (popup lifecycle)
- IMMUTABLE-REQ-TAG-003 (user-driven recent tags; referenced in code comments)
