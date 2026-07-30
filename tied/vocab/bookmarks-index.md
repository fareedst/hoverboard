# Local Bookmarks Index and interchange (canonical)

**Scope:** **Local Bookmarks Index** management page, export/import scopes and conflict policies, regex find-and-replace, **Browser Bookmark Import**, and **Netscape Bookmark File Format** interchange. **Vocabulary only** — filter/export algorithms stay in IMPL.

**Excludes:** Per-URL storage backend routing (see [`storage-backends.md`](storage-backends.md)); pin field semantics (see [`bookmarks.md`](bookmarks.md)); side-panel **Bookmarks** tab (browser `bookmarks.getTree` — see [`side-panel.md`](side-panel.md)).

**Traceability:** [REQ-LOCAL_BOOKMARKS_INDEX](../requirements/REQ-LOCAL_BOOKMARKS_INDEX.yaml) · [REQ-BROWSER_BOOKMARK_STORAGE](../requirements/REQ-BROWSER_BOOKMARK_STORAGE.yaml) · [REQ-LOCAL_BOOKMARKS_INDEX_EXPORT](../requirements/REQ-LOCAL_BOOKMARKS_INDEX_EXPORT.yaml) · [REQ-LOCAL_BOOKMARKS_INDEX_IMPORT](../requirements/REQ-LOCAL_BOOKMARKS_INDEX_IMPORT.yaml) · [REQ-LOCAL_BOOKMARKS_INDEX_ADD_TAGS](../requirements/REQ-LOCAL_BOOKMARKS_INDEX_ADD_TAGS.yaml) · [REQ-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE](../requirements/REQ-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE.yaml) · [REQ-BROWSER_BOOKMARK_IMPORT](../requirements/REQ-BROWSER_BOOKMARK_IMPORT.yaml) · [ARCH-LOCAL_BOOKMARKS_INDEX](../architecture-decisions/ARCH-LOCAL_BOOKMARKS_INDEX.yaml) · [ARCH-BROWSER_BOOKMARK_IMPORT](../architecture-decisions/ARCH-BROWSER_BOOKMARK_IMPORT.yaml) · [IMPL-LOCAL_BOOKMARKS_INDEX](../implementation-decisions/IMPL-LOCAL_BOOKMARKS_INDEX.yaml) · [IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT](../implementation-decisions/IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT.yaml) · [IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT](../implementation-decisions/IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT.yaml) · [IMPL-BROWSER_BOOKMARK_IMPORT](../implementation-decisions/IMPL-BROWSER_BOOKMARK_IMPORT.yaml)

**See also:** [`bookmarks.md`](bookmarks.md) · [`storage-backends.md`](storage-backends.md) · [`side-panel.md`](side-panel.md) · [`domain-references.md`](domain-references.md) · [`../../docs/BOOKMARK_IMPORT_EXPORT.md`](../../docs/BOOKMARK_IMPORT_EXPORT.md) (which surface for HTML vs rich CSV) · [`../../docs/BOOKMARK_HTML_FORMAT.md`](../../docs/BOOKMARK_HTML_FORMAT.md)

---

## Preferred terms vs synonyms

| Preferred | Avoid / demote | Notes |
|-----------|----------------|-------|
| **Local Bookmarks Index** | bookmarks table, index page | Full-page table of Hoverboard-stored bookmarks (local+file+sync+browser aggregation) |
| **Storage column** | backend column | Shows which storage backend holds the row |
| **Stores (L / F / S / B)** | Stores (L / F / S), store filters | Filter checkboxes for Local / File / Sync / Browser |
| **Browser (B)** | Chrome store checkbox | Index Stores checkbox for **Browser storage (backend)** (`browser`) — not Pinboard, not side-panel Bookmarks |
| **export scope** | export mode | `all` \| `displayed` \| `selected` |
| **import conflict policy** | conflict mode | **Skip** \| **Overwrite** \| **Merge tags** |
| **Browser Bookmark Import** | Chrome import page | Page that copies browser bookmarks into Hoverboard backends |
| **Netscape Bookmark File Format** | bookmarks.html format | Doctype `NETSCAPE-Bookmark-file-1` |
| **Use folder names as tags** | folder→tag | Import option mapping folder path to tags |
| **Import to** | import target | Index CSV/JSON import: Local \| File \| Sync \| Browser. **Browser Bookmark Import** page: Local \| File \| Sync only (Browser excluded as target — source is already the Chrome tree) |
| **regex find-and-replace** | bulk replace | Title / URL / Tags / Notes fields on selection |
| **index-open dismisses side panel** | close sidebar on index | On Local Bookmarks Index **tab create** (popup / command / context menu) only; broadcast `REQUEST_SIDE_PANEL_CLOSE`. Not on index page refresh. Toolbar icon may reopen the **side panel**. |

---

## Naming bridge: index and interchange

| Canonical concept | UI label | Message / API | Storage / format | Code |
|-------------------|----------|---------------|------------------|------|
| Index load (local only) | Local Bookmarks Index | `getLocalBookmarksForIndex` | — | bookmarks-table |
| Open index tab | Bookmarks index | `OPEN_BOOKMARKS_INDEX` | — | SW `_openBookmarksIndexTab` (create + `REQUEST_SIDE_PANEL_CLOSE`) |
| Aggregated index | Storage column | `getAggregatedBookmarksForIndex` | storage field on row | BookmarkRouter aggregate |
| Bulk Delete | Delete (Actions for selected) | `deleteBookmark` | `preferredBackend` from row **Storage column** (same bridge as Add tags) | `buildDeletePayload` → BookmarkRouter |
| Delete status | `#delete-result` | — | pending `Deleting…` / final `Deleted N…` | `bookmarks-table-delete-status` |
| Export CSV | Export all / displayed / selected | — | CSV columns Title←`description`, Notes←`extended` | `bookmarks-table-csv` |
| Import CSV/JSON | Import (control group) | — | preferredBackend on save; pending/final in `#import-result` | bookmarks-table import |

| Browser HTML import | Browser Bookmark Import | — | Netscape HTML | `browser-bookmark-import` |
| Folder in HTML | Folder | `<H3>` + nested `<DL>` | — | BOOKMARK_HTML_FORMAT |
| Link in HTML | Bookmark (URL) | `<A HREF>` | `ADD_DATE`, `LAST_MODIFIED` | same |
| Bookmarks bar marker | Bookmarks Bar | `PERSONAL_TOOLBAR_FOLDER` / `bookmark_bar` | — | same |

---

## Named concepts

- **Local Bookmarks Index** — Management UI under `src/ui/bookmarks-table/`; not the side-panel Bookmarks tab.
- **allBookmarks / filteredBookmarks / selectedUrls** — In-page data sets for display and bulk ops.
- **timeColumnSource / timeDisplayMode / sortKey** — Table time-column controls.
- **Show only / Hide** — Tag include/exclude, to-read, private, and time-range filters.
- **Visits / Last Visited** — Usage columns when usage tracking data exists.
- **Add tags / Delete tags** — Bulk tag ops on selected rows (merge/dedupe case-insensitive).
- **Skip / Overwrite / Merge tags** — When imported URL already exists: leave alone; replace record; or merge tag sets.
- **Import control group** — Dedicated fieldset on Local Bookmarks Index (sibling of **Actions for selected**): conflict radios, **Import to**, **Import** button last, then `#import-result`.
- **import result pending / final** — Pending: `Importing…` (accepted, warning color). Final: `Imported N…` counts (success color). Same `#import-result` element.
- **delete result pending / final** — Pending: `Deleting…` (accepted, warning color). Final: `Deleted N…` counts (success color). Same `#delete-result` element next to **Delete**.
- **Netscape Bookmark File Format** — Interchange HTML with doctype `NETSCAPE-Bookmark-file-1` (see `docs/BOOKMARK_HTML_FORMAT.md`).
- **store-change reload** — When a **Stores (L / F / S / B)** checkbox changes and `allBookmarks` is empty while at least one store is checked, re-run **LOAD_LOCAL_BOOKMARKS_INDEX** so a failed/empty first fetch can recover without a full page reload.
- **Browser (B)** — Stores checkbox `#store-browser` for backend `browser` (native `chrome.bookmarks`); peer to Local/File/Sync for filter, move, and import targets.
- **index-open dismisses side panel** — Creating the Local Bookmarks Index tab via popup, command, or context menu dismisses an already-open **side panel** (`REQUEST_SIDE_PANEL_CLOSE`). Refresh of the index document does not re-dismiss. Options page `href` open does not use this path.

---

## Pseudo-code block names

| Preferred term / concept | Procedure / block (existing) | Owning IMPL |
|--------------------------|------------------------------|-------------|
| Open index tab + dismiss panel | `OPEN_BOOKMARKS_INDEX_TAB` | [IMPL-LOCAL_BOOKMARKS_INDEX](../implementation-decisions/IMPL-LOCAL_BOOKMARKS_INDEX.yaml) |
| Load index rows | `LOAD_LOCAL_BOOKMARKS_INDEX` | [IMPL-LOCAL_BOOKMARKS_INDEX](../implementation-decisions/IMPL-LOCAL_BOOKMARKS_INDEX.yaml) |
| Store-change reload predicate | `shouldReloadBookmarksOnStoreChange` | [IMPL-LOCAL_BOOKMARKS_INDEX](../implementation-decisions/IMPL-LOCAL_BOOKMARKS_INDEX.yaml) |
| SW provider init mutex | `PROVIDER_INIT_MUTEX` / `ensureBookmarkProviderInitialized` | [IMPL-LOCAL_BOOKMARKS_INDEX](../implementation-decisions/IMPL-LOCAL_BOOKMARKS_INDEX.yaml) |
| Bulk Delete | `BULK_DELETE` / `runBulkDelete` | [IMPL-LOCAL_BOOKMARKS_INDEX](../implementation-decisions/IMPL-LOCAL_BOOKMARKS_INDEX.yaml) |
| Export CSV | `(proposed) EXPORT_BOOKMARKS_CSV` | [IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT](../implementation-decisions/IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT.yaml) |
| Import records | `(proposed) IMPORT_BOOKMARKS_INDEX` | [IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT](../implementation-decisions/IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT.yaml) |
| Regex replace | `(proposed) REGEX_REPLACE_BOOKMARK_FIELDS` | [IMPL-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE](../implementation-decisions/IMPL-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE.yaml) |
| Browser import conflict | Skip / Overwrite / Merge handlers | [IMPL-BROWSER_BOOKMARK_IMPORT](../implementation-decisions/IMPL-BROWSER_BOOKMARK_IMPORT.yaml) |

---

## Alphabetical index

| Term | Section |
|------|---------|
| Add tags / Delete tags | Named concepts |
| Bulk Delete | Pseudo-code block names / Naming bridge |
| delete result pending / final | Named concepts |
| Browser Bookmark Import | Preferred terms |
| export scope | Preferred terms |
| import conflict policy | Preferred terms |
| Import to | Preferred terms |
| Import control group | Named concepts |
| import result pending / final | Named concepts |
| index-open dismisses side panel | Preferred terms / Named concepts |
| Local Bookmarks Index | Preferred terms |
| OPEN_BOOKMARKS_INDEX_TAB | Pseudo-code block names |
| Netscape Bookmark File Format | Named concepts |
| PROVIDER_INIT_MUTEX | Pseudo-code block names |
| regex find-and-replace | Preferred terms |
| Skip / Overwrite / Merge tags | Named concepts |
| Storage column | Preferred terms |
| Stores (L / F / S / B) | Preferred terms |
| Browser (B) | Preferred terms |
| store-change reload | Named concepts |
| shouldReloadBookmarksOnStoreChange | Pseudo-code block names |
| LOAD_LOCAL_BOOKMARKS_INDEX | Pseudo-code block names |
| Use folder names as tags | Preferred terms |
