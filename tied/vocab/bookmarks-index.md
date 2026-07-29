# Local Bookmarks Index and interchange (canonical)

**Scope:** **Local Bookmarks Index** management page, export/import scopes and conflict policies, regex find-and-replace, **Browser Bookmark Import**, and **Netscape Bookmark File Format** interchange. **Vocabulary only** — filter/export algorithms stay in IMPL.

**Excludes:** Per-URL storage backend routing (see [`storage-backends.md`](storage-backends.md)); pin field semantics (see [`bookmarks.md`](bookmarks.md)); side-panel **Bookmarks** tab (browser `bookmarks.getTree` — see [`side-panel.md`](side-panel.md)).

**Traceability:** [REQ-LOCAL_BOOKMARKS_INDEX](../requirements/REQ-LOCAL_BOOKMARKS_INDEX.yaml) · [REQ-LOCAL_BOOKMARKS_INDEX_EXPORT](../requirements/REQ-LOCAL_BOOKMARKS_INDEX_EXPORT.yaml) · [REQ-LOCAL_BOOKMARKS_INDEX_IMPORT](../requirements/REQ-LOCAL_BOOKMARKS_INDEX_IMPORT.yaml) · [REQ-LOCAL_BOOKMARKS_INDEX_ADD_TAGS](../requirements/REQ-LOCAL_BOOKMARKS_INDEX_ADD_TAGS.yaml) · [REQ-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE](../requirements/REQ-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE.yaml) · [REQ-BROWSER_BOOKMARK_IMPORT](../requirements/REQ-BROWSER_BOOKMARK_IMPORT.yaml) · [ARCH-LOCAL_BOOKMARKS_INDEX](../architecture-decisions/ARCH-LOCAL_BOOKMARKS_INDEX.yaml) · [ARCH-BROWSER_BOOKMARK_IMPORT](../architecture-decisions/ARCH-BROWSER_BOOKMARK_IMPORT.yaml) · [IMPL-LOCAL_BOOKMARKS_INDEX](../implementation-decisions/IMPL-LOCAL_BOOKMARKS_INDEX.yaml) · [IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT](../implementation-decisions/IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT.yaml) · [IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT](../implementation-decisions/IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT.yaml) · [IMPL-BROWSER_BOOKMARK_IMPORT](../implementation-decisions/IMPL-BROWSER_BOOKMARK_IMPORT.yaml)

**See also:** [`bookmarks.md`](bookmarks.md) · [`storage-backends.md`](storage-backends.md) · [`side-panel.md`](side-panel.md) · [`domain-references.md`](domain-references.md) · [`../../docs/BOOKMARK_HTML_FORMAT.md`](../../docs/BOOKMARK_HTML_FORMAT.md)

---

## Preferred terms vs synonyms

| Preferred | Avoid / demote | Notes |
|-----------|----------------|-------|
| **Local Bookmarks Index** | bookmarks table, index page | Full-page table of Hoverboard-stored bookmarks (local+file+sync aggregation) |
| **Storage column** | backend column | Shows which storage backend holds the row |
| **Stores (L / F / S)** | store filters | Filter checkboxes for Local / File / Sync |
| **export scope** | export mode | `all` \| `displayed` \| `selected` |
| **import conflict policy** | conflict mode | **Skip** \| **Overwrite** \| **Merge tags** |
| **Browser Bookmark Import** | Chrome import page | Page that copies browser bookmarks into Hoverboard backends |
| **Netscape Bookmark File Format** | bookmarks.html format | Doctype `NETSCAPE-Bookmark-file-1` |
| **Use folder names as tags** | folder→tag | Import option mapping folder path to tags |
| **Import to** | import target | Target backend Local \| File \| Sync |
| **regex find-and-replace** | bulk replace | Title / URL / Tags / Notes fields on selection |

---

## Naming bridge: index and interchange

| Canonical concept | UI label | Message / API | Storage / format | Code |
|-------------------|----------|---------------|------------------|------|
| Index load (local only) | Local Bookmarks Index | `getLocalBookmarksForIndex` | — | bookmarks-table |
| Aggregated index | Storage column | `getAggregatedBookmarksForIndex` | storage field on row | BookmarkRouter aggregate |
| Export CSV | Export all / displayed / selected | — | CSV columns Title←`description`, Notes←`extended` | `bookmarks-table-csv` |
| Import CSV/JSON | Import | — | preferredBackend on save | bookmarks-table import |
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
- **Netscape Bookmark File Format** — Interchange HTML with doctype `NETSCAPE-Bookmark-file-1` (see `docs/BOOKMARK_HTML_FORMAT.md`).

---

## Pseudo-code block names

| Preferred term / concept | Procedure / block (existing) | Owning IMPL |
|--------------------------|------------------------------|-------------|
| Load index rows | `(proposed) LOAD_LOCAL_BOOKMARKS_INDEX` | [IMPL-LOCAL_BOOKMARKS_INDEX](../implementation-decisions/IMPL-LOCAL_BOOKMARKS_INDEX.yaml) |
| Export CSV | `(proposed) EXPORT_BOOKMARKS_CSV` | [IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT](../implementation-decisions/IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT.yaml) |
| Import records | `(proposed) IMPORT_BOOKMARKS_INDEX` | [IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT](../implementation-decisions/IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT.yaml) |
| Regex replace | `(proposed) REGEX_REPLACE_BOOKMARK_FIELDS` | [IMPL-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE](../implementation-decisions/IMPL-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE.yaml) |
| Browser import conflict | Skip / Overwrite / Merge handlers | [IMPL-BROWSER_BOOKMARK_IMPORT](../implementation-decisions/IMPL-BROWSER_BOOKMARK_IMPORT.yaml) |

---

## Alphabetical index

| Term | Section |
|------|---------|
| Add tags / Delete tags | Named concepts |
| Browser Bookmark Import | Preferred terms |
| export scope | Preferred terms |
| import conflict policy | Preferred terms |
| Import to | Preferred terms |
| Local Bookmarks Index | Preferred terms |
| Netscape Bookmark File Format | Named concepts |
| regex find-and-replace | Preferred terms |
| Skip / Overwrite / Merge tags | Named concepts |
| Storage column | Preferred terms |
| Stores (L / F / S) | Preferred terms |
| Use folder names as tags | Preferred terms |
