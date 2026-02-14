# [REQ-STORAGE_MODE_DEFAULT] Storage Mode Default and Dual-Use

**Status**: Implemented  
**Cross-references**: ARCH-LOCAL_STORAGE_PROVIDER, IMPL-LOCAL_BOOKMARK_SERVICE

---

## Summary

The extension supports two bookmark storage modes: **local** (chrome.storage.local) and **Pinboard** (Pinboard.in API). The **default is local** so most users can use the extension without creating an account or configuring an API token. Users who want cloud sync may switch to Pinboard in the Options page (Storage Mode).

## Purpose

- Reduce friction for new users: no signup or API required by default.
- Preserve optional Pinboard integration for users who want it.
- Make the dual-use case explicit: local-first, Pinboard optional.

## Where configured

- **ConfigManager**: `getDefaultConfiguration().storageMode === 'local'`; `getStorageMode()` / `setStorageMode(mode)`.
- **Options page**: Storage Mode section with radios "Local Storage (offline)" and "Pinboard (cloud)"; selection is persisted and triggers provider swap via `SWITCH_STORAGE_MODE` message.

## How validated

- Unit tests in `tests/unit/config-manager.test.js`:
  - Default configuration includes `storageMode: 'local'`.
  - `getStorageMode()` returns `'local'` when no stored override, `'pinboard'` when stored, and `'pinboard'` for invalid stored value (fallback).
  - `setStorageMode('local')` and `setStorageMode('pinboard')` call `updateConfig` with the correct value; invalid mode throws.

## Related

- ARCH-LOCAL_STORAGE_PROVIDER (strategy and default choice)
- IMPL-LOCAL_BOOKMARK_SERVICE (local provider implementation)
- REQ-CHROME_STORAGE_USAGE (storage API usage)
