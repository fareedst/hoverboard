# Bookmark import and export

Which surface to use depends on whether you need **Hoverboard** fields (tags, notes, shared, to-read) or the **Chrome bookmark tree** (folders / Netscape HTML).

For the Netscape HTML wire format itself, see [BOOKMARK_HTML_FORMAT.md](BOOKMARK_HTML_FORMAT.md).

---

## Surface map

| Surface | Formats | Writes to |
|---------|---------|-----------|
| **Local Bookmarks Index** | CSV / JSON (rich) | Hoverboard Local / File / Sync |
| **Side panel → Bookmarks** | Netscape HTML; simple CSV (`title,url,folderPath`) | Chrome `chrome.bookmarks` tree |
| **Browser Bookmark Import** | Live browser tree (no file) | Hoverboard Local / File / Sync |

```text
Local Bookmarks Index          Side panel Bookmarks tab       Browser Bookmark Import page
CSV/JSON ↔ Hoverboard          Netscape HTML ↔ Chrome BM      chrome.bookmarks → Hoverboard
CSV: Title…Notes (9 cols)      CSV: title,url,folderPath      (no file formats)
No HTML                        HTML + CSV file import
```

---

## Netscape HTML (browser bookmarks)

**Export and import are both supported** on the side panel **Bookmarks** tab only.

| Action | UI | Destination |
|--------|-----|-------------|
| Export HTML / Export all HTML | Side panel → **Bookmarks** | Netscape `NETSCAPE-Bookmark-file-1` file |
| Import `.html` / `.htm` | Same tab → Import | Creates/updates **Chrome** bookmarks |

HTML does **not** carry Hoverboard fields (Tags, Notes, Shared, To read, Storage). Use it to share with Chrome/Firefox or round-trip browser folders.

Code: `src/ui/side-panel/browser-bookmarks-panel.js` (`buildBookmarksHtml` / `parseBookmarksHtml`).

---

## Rich CSV (Hoverboard restore)

Index export/import uses:

```text
Title,URL,Tags,Time,Updated,Storage,Shared,To read,Notes
```

### Import steps

1. Open **Local Bookmarks Index**
   - Popup or side-panel footer → **Bookmarks index**
   - Or Options → Bookmarks index link
   - Page: `src/ui/bookmarks-table/bookmarks-table.html`
2. Under the **Import** control group (below **Actions for selected**), set conflict mode and **Import to**, then click **Import** (accepts `.csv` / `.json`).
3. Choose the file (e.g. `hoverboard-bookmarks-all-*.csv`).
4. Conflict mode:
   - **Only new** — skip URLs that already exist
   - **Overwrite existing** — replace existing records
5. **Import to:** Local | File | Sync (target backend for saved rows).
6. The UI shows **Importing…** (pending), then imported / skipped / failed counts. New rows keep CSV **Time** / **Updated** when present.

Do **not** use the side-panel Bookmarks CSV import for this file. That path only understands `title,url,folderPath` and drops Tags/Notes/etc.

`Storage` on export is informational. On import, destination is controlled by **Import to**, not by replaying each row’s Storage column.

Code: `src/ui/bookmarks-table/bookmarks-table-csv.js` (`buildCsv` / `parseCsv`).

---

## When to use which format

- **Restore Hoverboard data with tags/notes** → Index **Import** with rich CSV/JSON.
- **Share with Chrome/Firefox / round-trip browser folders** → side-panel Bookmarks **Export HTML** / **Import** Netscape HTML.
- **Chrome tree → Hoverboard storage** → **Browser Bookmark Import** page (live `chrome.bookmarks.getTree`, not a file).

There is no in-repo CSV ↔ HTML converter. Convert only if you need the other surface’s format; for Hoverboard restore, keep the Index CSV.
