# CITDP analysis (design-time) — REQ-BROWSER_BOOKMARK_STORAGE

**Change request id:** REQ-BROWSER_BOOKMARK_STORAGE
**Date:** 2026-07-29
**Persist formal CITDP YAML after implementation** (`persist-citdp-record`).

## change-definition

Introduce fifth **storage backend** id `browser` backed by `chrome.bookmarks`, as a peer to local/file/sync in **BookmarkRouter**, **storage index**, config **default storage mode**, **Save to**, and **Local Bookmarks Index** Stores (**Browser (B)**) with full parity ops.

## impact-discovery

| Layer | Impact |
|---|---|
| New provider | `src/features/storage/browser-bookmark-service.js` + unit tests |
| Router / index | `bookmark-router.js`, `storage-index.js`, `service-worker.js` |
| Shared utils | `browser-bookmark-import-utils.js` (root-strip, collapseByUrl) |
| Config / IPC | `config-manager.js`, `message-schemas.js`, `config-types.d.ts` |
| Index UI | `bookmarks-table.html/js/filter.js` — Store B, move/import targets |
| Popup / Options | Save-to button + storage-mode radio; Local aria-label clarify |
| TIED | New REQ/ARCH/IMPL; LEAP-update router/index/storage tokens |
| Vocab | `storage-backends.md`, `bookmarks-index.md` |

## risk-assessment

| Risk | Mitigation |
|---|---|
| 2C ownership steal | Exclude `browser` from best-of race unless index/default/preferred is `browser` or no other non-empty candidate |
| Duplicate URLs in Chrome | Collapse to one index row; merge tags; mutations apply to all matching nodes |
| Large Chrome trees | Flatten once; mock large tree in unit tests |
| Root strip locale | Prefer folder ids `'1'`/`'2'`; fallback title list |
| Field limits | shared/toread/extended: read defaults, write no-ops |
| VALID_BACKENDS drift | Update every duplicate list; LEAP note for centralize constant |
| Label confusion | Clarify Local (chrome.storage) vs Browser (chrome.bookmarks) |

## test-strategy

| Layer | Focus |
|---|---|
| Unit RED | BrowserBookmarkService CRUD + folder↔tags + URL collapse; StorageIndex `browser`; BookmarkRouter 2C + aggregate + move/save; matchStoresFilter |
| Composition | SW/message paths for aggregate + move target `browser` |
| E2E | Prefer composition; E2E only if checklist requires UI invoke |

Desired-behavior tests must fail before production code.
