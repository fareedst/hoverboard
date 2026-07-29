# Storage backends (canonical)

**Scope:** Per-bookmark **storage backends** (`pinboard` | `local` | `file` | `sync`), the **storage index**, **BookmarkRouter**, default storage mode, move-between-backends, and **native host** / file path plumbing for File storage. **Vocabulary only** — routing and I/O algorithms live in IMPL essence_pseudocode.

**Excludes:** Pinboard-shaped pin field names (see [`bookmarks.md`](bookmarks.md)); Local Bookmarks Index UI (see [`bookmarks-index.md`](bookmarks-index.md)); overlay/popup chrome (see [`ui-surfaces.md`](ui-surfaces.md)).

**Traceability:** [REQ-PER_BOOKMARK_STORAGE_BACKEND](../requirements/REQ-PER_BOOKMARK_STORAGE_BACKEND.yaml) · [REQ-STORAGE_MODE_DEFAULT](../requirements/REQ-STORAGE_MODE_DEFAULT.yaml) · [REQ-MOVE_BOOKMARK_STORAGE_UI](../requirements/REQ-MOVE_BOOKMARK_STORAGE_UI.yaml) · [REQ-FILE_BOOKMARK_STORAGE](../requirements/REQ-FILE_BOOKMARK_STORAGE.yaml) · [REQ-NATIVE_HOST_WRAPPER](../requirements/REQ-NATIVE_HOST_WRAPPER.yaml) · [ARCH-STORAGE_INDEX_AND_ROUTER](../architecture-decisions/ARCH-STORAGE_INDEX_AND_ROUTER.yaml) · [ARCH-FILE_BOOKMARK_PROVIDER](../architecture-decisions/ARCH-FILE_BOOKMARK_PROVIDER.yaml) · [ARCH-NATIVE_HOST](../architecture-decisions/ARCH-NATIVE_HOST.yaml) · [IMPL-BOOKMARK_ROUTER](../implementation-decisions/IMPL-BOOKMARK_ROUTER.yaml) · [IMPL-STORAGE_INDEX](../implementation-decisions/IMPL-STORAGE_INDEX.yaml) · [IMPL-NATIVE_HOST_WRAPPER](../implementation-decisions/IMPL-NATIVE_HOST_WRAPPER.yaml) · [IMPL-FILE_STORAGE_TYPED_PATH](../implementation-decisions/IMPL-FILE_STORAGE_TYPED_PATH.yaml)

**See also:** [`bookmarks.md`](bookmarks.md) · [`bookmarks-index.md`](bookmarks-index.md) · [`ipc-messaging.md`](ipc-messaging.md) · [`config-and-privacy.md`](config-and-privacy.md) · [`domain-references.md`](domain-references.md)

---

## Preferred terms vs synonyms

| Preferred | Avoid / demote | Notes |
|-----------|----------------|-------|
| **storage backend** | storage method, provider name (alone) | One of `pinboard` \| `local` \| `file` \| `sync` |
| **storage index** | backend map, URL→backend table | Key `hoverboard_storage_index`; maps URL → backend |
| **BookmarkRouter** | storage router, aggregator (alone) | Delegates get/save/delete/tag/move across providers |
| **preferredBackend** | selected backend, UI backend | Override on save (**Save to**) and Index **Bulk Delete** (row Storage column via `buildDeletePayload`) |
| **default storage mode** | global storage mode | Config `storageMode` / key `hoverboard_storage_mode` |
| **Save to** | storage picker, backend buttons | UI label for per-bookmark backend selection |
| **move bookmark to storage** | migrate bookmark, copy backend | Copy to target, delete source, update index |
| **native host** | native messaging host, helper process | Local process for File storage I/O |
| **File storage** | cloud-sync folder (Options marketing) | Backend `file`; path under `~/.hoverboard` by default |
| **Local storage (backend)** | local bookmarks (alone) | Backend `local` in `chrome.storage.local` — **not** Local Bookmarks Index |
| **Sync storage (backend)** | browser sync (alone) | Backend `sync` in `chrome.storage.sync` (~100 KB) — **not** bookmark state sync |

---

## Naming bridge: backends

| Canonical concept | UI label | Config / storage key | Code / `data-*` | TIED |
|-------------------|----------|----------------------|-----------------|------|
| Default backend | Storage Mode | `hoverboard_storage_mode`, `storageMode` | `pinboard`\|`local`\|`file`\|`sync` | [REQ-STORAGE_MODE_DEFAULT](../requirements/REQ-STORAGE_MODE_DEFAULT.yaml) |
| Per-URL backend map | Storage column (index) | `hoverboard_storage_index` | `StorageIndex` | [IMPL-STORAGE_INDEX](../implementation-decisions/IMPL-STORAGE_INDEX.yaml) |
| Save / delete override | Save to (highlight); Index Bulk Delete | — | `preferredBackend` on `saveBookmark` / `deleteBookmark` | [IMPL-BOOKMARK_ROUTER](../implementation-decisions/IMPL-BOOKMARK_ROUTER.yaml) |
| Pinboard cloud | Pinboard | auth via `hoverboard_auth_token` | provider `pinboard` | [IMPL-PINBOARD_API](../implementation-decisions/IMPL-PINBOARD_API.yaml) |
| Local offline | Local | `hoverboard_local_bookmarks` | provider `local` | [IMPL-LOCAL_BOOKMARK_SERVICE](../implementation-decisions/IMPL-LOCAL_BOOKMARK_SERVICE.yaml) |
| File via native host | File | `hoverboard_file_storage_path`, `hoverboard-bookmarks.json` | provider `file` | [IMPL-FILE_BOOKMARK_SERVICE](../implementation-decisions/IMPL-FILE_BOOKMARK_SERVICE.yaml) |
| Browser sync | Sync | `hoverboard_sync_bookmarks` | provider `sync` | [IMPL-SYNC_BOOKMARK_SERVICE](../implementation-decisions/IMPL-SYNC_BOOKMARK_SERVICE.yaml) |
| File directory | File path | `hoverboard_file_storage_path` (default `~/.hoverboard`) | typed path normalize | [IMPL-FILE_STORAGE_TYPED_PATH](../implementation-decisions/IMPL-FILE_STORAGE_TYPED_PATH.yaml) |
| Native ping | Native Host (Options) | — | `NATIVE_PING` | [REQ-NATIVE_HOST_WRAPPER](../requirements/REQ-NATIVE_HOST_WRAPPER.yaml) |

---

## Named concepts

- **storage backend** — Exactly one of `pinboard`, `local`, `file`, `sync` for a given URL after resolve.
- **storage index** — `chrome.storage.local` map URL → backend under key `hoverboard_storage_index`.
- **BookmarkRouter** — Facade: resolve provider, delegate CRUD/tag ops, aggregate `getRecentBookmarks`, perform `moveBookmarkToStorage`.
- **resolveProvider** — Order: valid `preferredBackend` → index `getBackendForUrl` → `defaultStorageMode`.
- **preferredBackend** — Field on save and delete payloads so resolve uses the intended backend before the storage index: **Save to** highlight on save; Local Bookmarks Index **Bulk Delete** from the row Storage column (`buildDeletePayload`). Same resolve order as save (`preferredBackend` → index → default).
- **defaultStorageMode** — Global default when URL not in index; config default is `local`.
- **moveBookmarkToStorage** — Get from source → ensure `time` → save to target → delete source → `setBackendForUrl`.
- **hoverboard-bookmarks.json** — Filename written inside the File storage directory.
- **native host** — Length-prefixed JSON stdin/stdout helper (`helper.sh` / `helper.exe` / `helper.ps1`); install under `~/.hoverboard` or `%LOCALAPPDATA%\Hoverboard`.
- **offscreen file I/O** — Offscreen document handles `READ_FILE_BOOKMARKS` / `WRITE_FILE_BOOKMARKS` for File backend.
- **aggregated bookmarks** — Union across providers for Local Bookmarks Index (`getAggregatedBookmarksForIndex`).

---

## Pseudo-code block names

| Preferred term / concept | Procedure / block (existing) | Owning IMPL |
|--------------------------|------------------------------|-------------|
| Resolve provider | `resolveProvider` | [IMPL-BOOKMARK_ROUTER](../implementation-decisions/IMPL-BOOKMARK_ROUTER.yaml) |
| Save with preferred backend | `saveBookmark` | [IMPL-BOOKMARK_ROUTER](../implementation-decisions/IMPL-BOOKMARK_ROUTER.yaml) |
| Delete with preferred backend | `deleteBookmark` | [IMPL-BOOKMARK_ROUTER](../implementation-decisions/IMPL-BOOKMARK_ROUTER.yaml) |
| Aggregate recent | `getRecentBookmarks` | [IMPL-BOOKMARK_ROUTER](../implementation-decisions/IMPL-BOOKMARK_ROUTER.yaml) |
| Move between backends | `moveBookmarkToStorage` | [IMPL-BOOKMARK_ROUTER](../implementation-decisions/IMPL-BOOKMARK_ROUTER.yaml) |
| Index get/set | `getBackendForUrl` / `setBackendForUrl` | [IMPL-STORAGE_INDEX](../implementation-decisions/IMPL-STORAGE_INDEX.yaml) |
| Typed file path | `(proposed) NORMALIZE_FILE_STORAGE_PATH` | [IMPL-FILE_STORAGE_TYPED_PATH](../implementation-decisions/IMPL-FILE_STORAGE_TYPED_PATH.yaml) |
| Native host wrap | `(proposed) NATIVE_HOST_IO` | [IMPL-NATIVE_HOST_WRAPPER](../implementation-decisions/IMPL-NATIVE_HOST_WRAPPER.yaml) |

---

## Alphabetical index

| Term | Section |
|------|---------|
| BookmarkRouter | Named concepts |
| default storage mode | Preferred terms |
| Delete with preferred backend | Pseudo-code block names |
| File storage | Preferred terms |
| hoverboard-bookmarks.json | Named concepts |
| Local storage (backend) | Preferred terms |
| move bookmark to storage | Preferred terms |
| native host | Named concepts |
| offscreen file I/O | Named concepts |
| preferredBackend | Naming bridge |
| resolveProvider | Pseudo-code block names |
| Save to | Preferred terms |
| storage backend | Preferred terms |
| storage index | Naming bridge |
| Sync storage (backend) | Preferred terms |
