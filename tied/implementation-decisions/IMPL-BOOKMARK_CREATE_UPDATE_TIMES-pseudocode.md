# [IMPL-BOOKMARK_CREATE_UPDATE_TIMES] [ARCH-BOOKMARK_CREATE_UPDATE_TIMES] [REQ-BOOKMARK_CREATE_UPDATE_TIMES] — Every bookmark has time (create) and updated_at (last update); provider-specific set/normalize; export/import include.

## PINBOARD

- [IMPL-BOOKMARK_CREATE_UPDATE_TIMES] [ARCH-BOOKMARK_CREATE_UPDATE_TIMES] [REQ-BOOKMARK_CREATE_UPDATE_TIMES] — import create preserves CSV/JSON Time and Updated. How: Implements Pinboard behavior for IMPL-BOOKMARK_CREATE_UPDATE_TIMES.
- Contract:
  - INPUT: bookmark data (for save), API response (for Pinboard), raw record (for normalize)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: bookmark with time and updated_at set per provider and context
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: time = create time; updated_at = last update time
  - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
  - EFFECTS: Http, IO, State
  - TERMINATION: total
- PROCEDURE: PINBOARD
  - parseBookmarkResponse / createEmptyBookmark: SET updated_at = time (API has no updated_at)
  - SEND to API: do NOT include updated_at
  - How (sub-block): If missing updated_at set to time (legacy); include updated_at in payload/CSV/JSON.
  - 1. Normalize (url-tags-manager, display, move, export/import):
  - IF bookmark has no updated_at: SET updated_at = time   // legacy
  - ELSE: keep updated_at
  - Include updated_at in payload/CSV/JSON

## ROUTER_STORAGE_BOOKMARK_TIMES

- [IMPL-BOOKMARK_CREATE_UPDATE_TIMES] [IMPL-BOOKMARK_ROUTER] [IMPL-STORAGE_INDEX] [ARCH-BOOKMARK_CREATE_UPDATE_TIMES] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-BOOKMARK_CREATE_UPDATE_TIMES] [REQ-RELIABILITY] How: Preserves bookmark time fields while router storage operations select a provider and update the storage index.
- Contract:
  - INPUT: bookmark data, preferred backend, storage providers, storage index
  - PRE: bookmark URL and provider map are available
  - OUTPUT: provider result with normalized time fields and updated storage index
  - POST:
    - success => saved bookmark retains time and updated_at; index points to the selected backend
  - FAILURE_MODES: ProviderSaveFailed
  - DATA: bookmark time fields and storage-index backend mapping
  - DATA_TRANSITION: successful save updates the selected URL mapping; failed save leaves the mapping unchanged
  - EFFECTS: Async, IO, State
  - TERMINATION: total
- PROCEDURE: ROUTER_STORAGE_BOOKMARK_TIMES
  - Normalize missing updated_at from time
  - Resolve provider from preferred backend
  - AWAIT provider save
  - IF save succeeds: update storage index for the URL
  - RETURN provider result
