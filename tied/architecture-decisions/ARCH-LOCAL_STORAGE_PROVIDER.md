# [ARCH-LOCAL_STORAGE_PROVIDER] Local Storage Bookmark Provider (Strategy Pattern)

**Status**: Active  
**Cross-references**: REQ-STORAGE_MODE_DEFAULT, ARCH-STORAGE, ARCH-PINBOARD_API, IMPL-LOCAL_BOOKMARK_SERVICE

---

## Summary

The extension supports two bookmark storage modes: **Pinboard (cloud)**, using the Pinboard.in API, and **Local Storage (offline)**, using `chrome.storage.local`. A strategy pattern is used so that `MessageHandler` delegates all bookmark operations to an active **bookmark provider** chosen from user configuration (`storageMode`). The provider can be switched at runtime without reloading the extension.

## Rationale

- **Problem**: The extension previously depended solely on the Pinboard API; there was no way to use the extension without an external service or to store bookmarks locally.
- **Solution**: Introduce a bookmark provider abstraction. Both `PinboardService` and `LocalBookmarkService` implement the same contract (duck-typed). The service worker resolves the active provider from `config.storageMode` and passes it to `MessageHandler`. The options page exposes a Storage Mode control and sends `SWITCH_STORAGE_MODE` so the service worker re-initializes the provider.

## Default

The default storage mode is **local**. This is preferable for most users: no account or API token is required, and the extension works out of the box. Pinboard remains optional; users who want cloud sync can switch to "Pinboard (cloud)" in Options > Storage Mode.

## Implementation

- **ConfigManager**: `storageMode` in default config (default `'local'`) and settings; `getStorageMode()` / `setStorageMode(mode)`; valid values `'pinboard'` | `'local'`.
- **MessageHandler**: Constructor accepts `bookmarkProvider`; all bookmark operations use `this.bookmarkProvider`; `setBookmarkProvider(provider)` for runtime swap.
- **Service worker**: Lazy `initBookmarkProvider()` from config; handles `SWITCH_STORAGE_MODE` by re-running init and responding; badge uses `this.bookmarkProvider`.
- **Options page**: Storage Mode section with radio buttons; Authentication section disabled (dimmed) when mode is local.

## Related

- ARCH-STORAGE (chrome.storage usage)
- ARCH-PINBOARD_API (Pinboard provider)
- IMPL-LOCAL_BOOKMARK_SERVICE (local provider implementation)
