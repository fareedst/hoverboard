# Storage backends (canonical)

**Scope:** Per-bookmark **storage backends** (`pinboard` | `local` | `file` | `sync` | `browser`), the **storage index**, **BookmarkRouter**, default storage mode, move-between-backends, and **native host** / file path plumbing for File storage. **Vocabulary only** — routing and I/O algorithms live in IMPL essence_pseudocode.

**Excludes:** Pinboard-shaped pin field names (see [`bookmarks.md`](bookmarks.md)); Local Bookmarks Index UI (see [`bookmarks-index.md`](bookmarks-index.md)); overlay/popup chrome (see [`ui-surfaces.md`](ui-surfaces.md)).

**Traceability:** [REQ-PER_BOOKMARK_STORAGE_BACKEND](../requirements/REQ-PER_BOOKMARK_STORAGE_BACKEND.yaml) · [REQ-BROWSER_BOOKMARK_STORAGE](../requirements/REQ-BROWSER_BOOKMARK_STORAGE.yaml) · [REQ-STORAGE_MODE_DEFAULT](../requirements/REQ-STORAGE_MODE_DEFAULT.yaml) · [REQ-MOVE_BOOKMARK_STORAGE_UI](../requirements/REQ-MOVE_BOOKMARK_STORAGE_UI.yaml) · [REQ-FILE_BOOKMARK_STORAGE](../requirements/REQ-FILE_BOOKMARK_STORAGE.yaml) · [REQ-NATIVE_HOST_WRAPPER](../requirements/REQ-NATIVE_HOST_WRAPPER.yaml) · [ARCH-STORAGE_INDEX_AND_ROUTER](../architecture-decisions/ARCH-STORAGE_INDEX_AND_ROUTER.yaml) · [ARCH-BROWSER_BOOKMARK_PROVIDER](../architecture-decisions/ARCH-BROWSER_BOOKMARK_PROVIDER.yaml) · [ARCH-FILE_BOOKMARK_PROVIDER](../architecture-decisions/ARCH-FILE_BOOKMARK_PROVIDER.yaml) · [ARCH-NATIVE_HOST](../architecture-decisions/ARCH-NATIVE_HOST.yaml) · [IMPL-BOOKMARK_ROUTER](../implementation-decisions/IMPL-BOOKMARK_ROUTER.yaml) · [IMPL-BROWSER_BOOKMARK_SERVICE](../implementation-decisions/IMPL-BROWSER_BOOKMARK_SERVICE.yaml) · [IMPL-STORAGE_INDEX](../implementation-decisions/IMPL-STORAGE_INDEX.yaml) · [IMPL-NATIVE_HOST_WRAPPER](../implementation-decisions/IMPL-NATIVE_HOST_WRAPPER.yaml) · [IMPL-FILE_STORAGE_TYPED_PATH](../implementation-decisions/IMPL-FILE_STORAGE_TYPED_PATH.yaml)

**See also:** [`bookmarks.md`](bookmarks.md) · [`bookmarks-index.md`](bookmarks-index.md) · [`ipc-messaging.md`](ipc-messaging.md) · [`config-and-privacy.md`](config-and-privacy.md) · [`domain-references.md`](domain-references.md)

---

## Preferred terms vs synonyms

| Preferred | Avoid / demote | Notes |
|-----------|----------------|-------|
| **storage backend** | storage method, provider name (alone) | One of `pinboard` \| `local` \| `file` \| `sync` \| `browser` |
| **Browser storage (backend)** / **Store B** | Chrome bookmarks (as backend), native bookmarks store | Backend `browser` via BookmarkRouter / [ARCH-BROWSER_BOOKMARK_PROVIDER](../architecture-decisions/ARCH-BROWSER_BOOKMARK_PROVIDER.yaml) — **not** Local storage (`chrome.storage.local`) and **not** side-panel **Bookmarks** panel (direct `chrome.bookmarks` tree UX / [ARCH-SIDE_PANEL_BROWSER_BOOKMARKS](../architecture-decisions/ARCH-SIDE_PANEL_BROWSER_BOOKMARKS.yaml)) |
| **Chrome storage settings** | ARCH-STORAGE as bookmark backends | Settings/portability via [ARCH-STORAGE](../architecture-decisions/ARCH-STORAGE.yaml) — distinct from this glossary’s five bookmark backends |
| **storage index** | backend map, URL→backend table | Key `hoverboard_storage_index`; maps URL → backend |
| **BookmarkRouter** | storage router, aggregator (alone) | Delegates get/save/delete/tag/move across providers |
| **preferredBackend** | selected backend, UI backend | Override on save (**Save to**) and Index **Bulk Delete** (row Storage column via `buildDeletePayload`) |
| **getSelectedStorageBackend** | selected storage, highlighted backend | Popup/side-panel helper: returns the **Save to** button with `aria-pressed="true"` when `data-backend` is in `pinboard` \| `local` \| `file` \| `sync` \| `browser`; otherwise `null`. Feeds `preferredBackend` on save ([IMPL-MOVE_BOOKMARK_UI](../implementation-decisions/IMPL-MOVE_BOOKMARK_UI.yaml)) |
| **default storage mode** | global storage mode | Config `storageMode` / key `hoverboard_storage_mode` |
| **Save to** | storage picker, backend buttons; file ↔ browser toggle; Move to browser | UI label for five select-one buttons (Pinboard, Local, File, Sync, Browser); click moves via `moveBookmarkToStorage` when a bookmark exists. Do not invent a separate Local/File toggle control |
| **move bookmark to storage** | migrate bookmark, copy backend | Copy to target, delete source, update index |
| **native host** | native messaging host, helper process | Local process for File storage I/O |
| **File storage** | cloud-sync folder (Options marketing) | Backend `file`; path under `~/.hoverboard` by default |
| **Local storage (backend)** | local bookmarks (alone) | Backend `local` in `chrome.storage.local` — **not** Local Bookmarks Index |
| **Sync storage (backend)** | browser sync (alone) | Backend `sync` in `chrome.storage.sync` (~100 KB) — **not** bookmark state sync |
| **2C (browser race exclusion)** | browser best-of, race includes browser | `getBookmarkForUrl` races pinboard/local/file/sync only; consult **Browser storage (backend)** via preferred/index/default or when other providers are empty |
| **collapseByUrl** | URL merge, duplicate collapse | Merge Chrome nodes with the same cleaned URL into one pin; union tags; earliest `dateAdded` |
| **ENSURE_TAG_FOLDERS** | tag folder chain | Get-or-create nested folders under Other Bookmarks (`id` `"2"`) from tag segments |
| **stripChromeRootSegments** | root-folder strip | Drop Chrome root titles/ids (Bookmarks Bar / Other Bookmarks) before folder path → tags |

---

## Naming bridge: backends

| Canonical concept | UI label | Config / storage key | Code / `data-*` | TIED |
|-------------------|----------|----------------------|-----------------|------|
| Default backend | Storage Mode | `hoverboard_storage_mode`, `storageMode` | `pinboard`\|`local`\|`file`\|`sync`\|`browser` | [REQ-STORAGE_MODE_DEFAULT](../requirements/REQ-STORAGE_MODE_DEFAULT.yaml) |
| Per-URL backend map | Storage column (index) | `hoverboard_storage_index` | `StorageIndex` | [IMPL-STORAGE_INDEX](../implementation-decisions/IMPL-STORAGE_INDEX.yaml) |
| Save / delete override | Save to (highlight); Index Bulk Delete | — | `preferredBackend` on `saveBookmark` / `deleteBookmark` | [IMPL-BOOKMARK_ROUTER](../implementation-decisions/IMPL-BOOKMARK_ROUTER.yaml) |
| Save-to highlight reader | Save to (pressed button) | — | `getSelectedStorageBackend()` | [IMPL-MOVE_BOOKMARK_UI](../implementation-decisions/IMPL-MOVE_BOOKMARK_UI.yaml) |
| Pinboard cloud | Pinboard | auth via `hoverboard_auth_token` | provider `pinboard` | [IMPL-PINBOARD_API](../implementation-decisions/IMPL-PINBOARD_API.yaml) |
| Local offline | Local | `hoverboard_local_bookmarks` | provider `local` | [IMPL-LOCAL_BOOKMARK_SERVICE](../implementation-decisions/IMPL-LOCAL_BOOKMARK_SERVICE.yaml) |
| File via native host | File | `hoverboard_file_storage_path`, `hoverboard-bookmarks.json` | provider `file` | [IMPL-FILE_BOOKMARK_SERVICE](../implementation-decisions/IMPL-FILE_BOOKMARK_SERVICE.yaml) |
| Browser sync | Sync | `hoverboard_sync_bookmarks` | provider `sync` | [IMPL-SYNC_BOOKMARK_SERVICE](../implementation-decisions/IMPL-SYNC_BOOKMARK_SERVICE.yaml) |
| Native Chrome bookmarks | Browser | `chrome.bookmarks` API | provider `browser` | [IMPL-BROWSER_BOOKMARK_SERVICE](../implementation-decisions/IMPL-BROWSER_BOOKMARK_SERVICE.yaml) |
| File directory | File path | `hoverboard_file_storage_path` (default `~/.hoverboard`) | typed path normalize | [IMPL-FILE_STORAGE_TYPED_PATH](../implementation-decisions/IMPL-FILE_STORAGE_TYPED_PATH.yaml) |
| Native ping | Native Host (Options) | — | `NATIVE_PING` | [REQ-NATIVE_HOST_WRAPPER](../requirements/REQ-NATIVE_HOST_WRAPPER.yaml) |

---

## Named concepts

- **storage backend** — Exactly one of `pinboard`, `local`, `file`, `sync`, `browser` for a given URL after resolve.
- **Browser storage (backend)** — Backend `browser` over native `chrome.bookmarks`; folder path segments map to tags (Chrome roots stripped); distinct from **Local storage (backend)** and from side-panel **Bookmarks** panel.
- **storage index** — `chrome.storage.local` map URL → backend under key `hoverboard_storage_index`.
- **BookmarkRouter** — Facade: resolve provider, delegate CRUD/tag ops, aggregate `getRecentBookmarks`, perform `moveBookmarkToStorage`.
- **resolveProvider** — Order: valid `preferredBackend` → index `getBackendForUrl` → `defaultStorageMode`.
- **preferredBackend** — Field on save and delete payloads so resolve uses the intended backend before the storage index: **Save to** highlight on save; Local Bookmarks Index **Bulk Delete** from the row Storage column (`buildDeletePayload`). Same resolve order as save (`preferredBackend` → index → default).
- **getSelectedStorageBackend** — Reads the pressed **Save to** button (`data-backend` + `aria-pressed="true"`); allowlist is the five backends including `browser`; returns `null` when none or unknown.
- **defaultStorageMode** — Global default when URL not in index; config default is `local`.
- **moveBookmarkToStorage** — Get from source → ensure `time` → save to target → delete source → `setBackendForUrl`.
- **hoverboard-bookmarks.json** — Filename written inside the File storage directory.
- **native host** — Length-prefixed JSON stdin/stdout helper (`helper.sh` / `helper.exe` / `helper.ps1`); install under `~/.hoverboard` or `%LOCALAPPDATA%\Hoverboard`.
- **offscreen file I/O** — Offscreen document handles `READ_FILE_BOOKMARKS` / `WRITE_FILE_BOOKMARKS` for File backend.
- **aggregated bookmarks** — Union across providers for Local Bookmarks Index (`getAggregatedBookmarksForIndex`); includes **Browser storage (backend)** with `storage: 'browser'`.
- **2C (browser race exclusion)** — Router rule for `getBookmarkForUrl`: exclude browser from the parallel non-empty best-of race; still reachable via `preferredBackend` / storage index / `defaultStorageMode`, or when no other provider returns a non-empty pin ([REQ-BROWSER_BOOKMARK_STORAGE]).
- **collapseByUrl** — Provider helper: one logical bookmark per cleaned URL across duplicate Chrome nodes; merge tags; keep earliest time.
- **ENSURE_TAG_FOLDERS** — Create or reuse nested tag folders under Other Bookmarks before `saveBookmark` create/move.
- **stripChromeRootSegments** — Shared util with Browser Bookmark Import: strip Chrome root folder segments so tags omit “Bookmarks Bar” / “Other Bookmarks”.

---

## Pseudo-code block names

| Preferred term / concept | Procedure / block (existing) | Owning IMPL |
|--------------------------|------------------------------|-------------|
| Resolve provider | `resolveProvider` | [IMPL-BOOKMARK_ROUTER](../implementation-decisions/IMPL-BOOKMARK_ROUTER.yaml) |
| 2C get by URL | `getBookmarkForUrl` (2C) | [IMPL-BOOKMARK_ROUTER](../implementation-decisions/IMPL-BOOKMARK_ROUTER.yaml) |
| Save with preferred backend | `saveBookmark` | [IMPL-BOOKMARK_ROUTER](../implementation-decisions/IMPL-BOOKMARK_ROUTER.yaml) |
| Read Save-to highlight | `getSelectedStorageBackend` | [IMPL-MOVE_BOOKMARK_UI](../implementation-decisions/IMPL-MOVE_BOOKMARK_UI.yaml) |
| Delete with preferred backend | `deleteBookmark` | [IMPL-BOOKMARK_ROUTER](../implementation-decisions/IMPL-BOOKMARK_ROUTER.yaml) |
| Aggregate recent | `getRecentBookmarks` | [IMPL-BOOKMARK_ROUTER](../implementation-decisions/IMPL-BOOKMARK_ROUTER.yaml) |
| Move between backends | `moveBookmarkToStorage` | [IMPL-BOOKMARK_ROUTER](../implementation-decisions/IMPL-BOOKMARK_ROUTER.yaml) |
| Index get/set | `getBackendForUrl` / `setBackendForUrl` | [IMPL-STORAGE_INDEX](../implementation-decisions/IMPL-STORAGE_INDEX.yaml) |
| Collapse URL duplicates | `collapseByUrl` | [IMPL-BROWSER_BOOKMARK_SERVICE](../implementation-decisions/IMPL-BROWSER_BOOKMARK_SERVICE.yaml) |
| Ensure tag folders | `ENSURE_TAG_FOLDERS` | [IMPL-BROWSER_BOOKMARK_SERVICE](../implementation-decisions/IMPL-BROWSER_BOOKMARK_SERVICE.yaml) |
| Strip Chrome roots | `stripChromeRootSegments` | [IMPL-BROWSER_BOOKMARK_SERVICE](../implementation-decisions/IMPL-BROWSER_BOOKMARK_SERVICE.yaml) |
| Typed file path | `(proposed) NORMALIZE_FILE_STORAGE_PATH` | [IMPL-FILE_STORAGE_TYPED_PATH](../implementation-decisions/IMPL-FILE_STORAGE_TYPED_PATH.yaml) |
| Native host wrap | `(proposed) NATIVE_HOST_IO` | [IMPL-NATIVE_HOST_WRAPPER](../implementation-decisions/IMPL-NATIVE_HOST_WRAPPER.yaml) |

---

## Alphabetical index

| Term | Section |
|------|---------|
| 2C (browser race exclusion) | Named concepts |
| BookmarkRouter | Named concepts |
| Browser storage (backend) | Preferred terms |
| collapseByUrl | Named concepts |
| default storage mode | Preferred terms |
| Delete with preferred backend | Pseudo-code block names |
| ENSURE_TAG_FOLDERS | Pseudo-code block names |
| File storage | Preferred terms |
| getSelectedStorageBackend | Preferred terms |
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
| stripChromeRootSegments | Named concepts |
| Sync storage (backend) | Preferred terms |
