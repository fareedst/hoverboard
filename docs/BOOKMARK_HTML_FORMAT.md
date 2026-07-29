# Netscape Bookmark HTML Format

This document specifies the HTML bookmark file format produced and expected by this project, and sufficient for implementing interoperable export and import with Chromium-based browsers (Chrome, Edge, Brave, etc.) and Firefox.

The format is the de facto **Netscape Bookmark File Format** (`NETSCAPE-Bookmark-file-1`).

**Product surfaces:** Hoverboard exports and imports this HTML from the side panel **Bookmarks** tab (Chrome bookmark tree only). For Hoverboard Local/File/Sync restore with Tags/Notes (rich CSV/JSON), use the Local Bookmarks Index — see [BOOKMARK_IMPORT_EXPORT.md](BOOKMARK_IMPORT_EXPORT.md).

---

## 1. Overview

A bookmark file is a loosely structured HTML document that represents a tree of:

| Concept | HTML representation |
|--------|----------------------|
| Folder | `<DT><H3 …>Folder Name</H3>` followed by a nested `<DL>…</DL>` of children |
| Bookmark (URL) | `<DT><A HREF="…" …>Bookmark Title</A>` |
| Hierarchy | Nested `<DL>` lists |

Browsers ignore unknown tags/attributes and tolerate non-strict HTML. Implementations should still emit well-formed nesting as described below.

---

## 2. File identity

| Property | Value |
|----------|--------|
| Typical filename | `bookmarks.html`, `Bookmark.html` |
| MIME type | `text/html` |
| Character encoding | UTF-8 (declared in `<META>`) |
| Case sensitivity | Tag and attribute names are conventionally uppercase; parsers should treat them case-insensitively |
| Whitespace / indentation | Insignificant; indentation is for readability only |

---

## 3. Document skeleton

Every valid bookmark file has this top-level shape:

```html
<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- Optional comment -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
    …root entries…
</DL><p>
```

### 3.1 Doctype (required)

```html
<!DOCTYPE NETSCAPE-Bookmark-file-1>
```

- Public identifier: `NETSCAPE-Bookmark-file-1`
- No public/system IDs beyond the doctype name
- Browsers use this doctype (not a normal HTML5 doctype) to recognize bookmark imports

### 3.2 Content-Type meta (required for export)

```html
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
```

- Declares the document as HTML with UTF-8 encoding
- `charset` may be written `UTF-8` or `utf-8`
- Importers should honor this charset when decoding the file

### 3.3 Title and heading (required)

```html
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
```

- Both are conventionally the literal string `Bookmarks`
- Some exporters use a localized or product-specific string; importers should not depend on the exact text
- `<TITLE>` is document metadata; `<H1>` is the visible root heading historically expected by the format

### 3.4 Optional header comment

Many browser exports include a comment such as:

```html
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
```

Comments are optional and ignored on import.

### 3.5 Root list (required)

All bookmark entries live inside a single top-level definition list:

```html
<DL><p>
    …entries…
</DL><p>
```

Notes on `<p>`:

- The literal token `<p>` immediately after `<DL>` and after `</DL>` is traditional Netscape markup
- It is **not** a real paragraph element with a matching `</p>`
- Importers should accept `<DL>` with or without the trailing `<p>`
- Exporters targeting maximum browser compatibility should emit `<DL><p>` / `</DL><p>`

There is no wrapping `<html>`, `<head>`, or `<body>` requirement. Some tools emit a full HTML document; browsers accept both styles. The canonical interchange form is the flat skeleton above (no `<html>` wrapper).

---

## 4. Structural elements

### 4.1 Definition list: `<DL>`

- Represents a container of sibling items (folders and/or bookmarks)
- Children of a folder are the items inside that folder’s nested `<DL>`
- Empty folders are represented by an empty nested `<DL><p></DL><p>` (or `<DL></DL>`)

### 4.2 Item container: `<DT>`

- Every folder header and every bookmark link is wrapped in a `<DT>`
- One logical item per `<DT>`
- Do not place multiple `<A>` or `<H3>` elements in the same `<DT>`

### 4.3 Folder header: `<H3>`

```html
<DT><H3 ADD_DATE="…" LAST_MODIFIED="…" [PERSONAL_TOOLBAR_FOLDER="true"]>Folder Name</H3>
<DL><p>
    …children…
</DL><p>
```

Rules:

1. The folder’s display name is the **text content** of `<H3>`
2. The folder’s children are in the **immediately following** sibling `<DL>`, not nested inside the `<H3>` or `<DT>`
3. Attributes on `<H3>` describe the folder (see §5)
4. Folder names may contain any Unicode text; exporters must HTML-escape special characters (see §7)

### 4.4 Bookmark link: `<A>`

```html
<DT><A HREF="https://example.com" ADD_DATE="…">Bookmark Title</A>
```

Rules:

1. The bookmark title is the **text content** of `<A>`
2. The URL is the `HREF` attribute (required)
3. A bookmark has no nested `<DL>`
4. Titles and URLs must be escaped appropriately (see §7)

### 4.5 Nesting model

Correct nesting (folder contains bookmarks and subfolders):

```html
<DL><p>
    <DT><H3 ADD_DATE="100" LAST_MODIFIED="200">Parent</H3>
    <DL><p>
        <DT><A HREF="https://a.example" ADD_DATE="110">Link A</A>
        <DT><H3 ADD_DATE="120" LAST_MODIFIED="130">Child folder</H3>
        <DL><p>
            <DT><A HREF="https://b.example" ADD_DATE="125">Link B</A>
        </DL><p>
        <DT><A HREF="https://c.example" ADD_DATE="140">Link C</A>
    </DL><p>
</DL><p>
```

Tree interpretation:

```
Parent/
├── Link A
├── Child folder/
│   └── Link B
└── Link C
```

Import algorithm (conceptual):

1. Parse the root `<DL>`
2. Walk its children in order
3. On `<DT><H3>`: create a folder; the next sibling `<DL>` (if present) holds its children; recurse
4. On `<DT><A>`: create a bookmark with title = text content, URL = `HREF`
5. Preserve sibling order

---

## 5. Attributes

Attribute names are conventionally uppercase. Values are quoted strings. Parsers should accept single or double quotes and case-insensitive attribute names.

### 5.1 Folder attributes (`<H3>`)

| Attribute | Required | Description |
|-----------|----------|-------------|
| `ADD_DATE` | Recommended | When the folder was created (see §6) |
| `LAST_MODIFIED` | Recommended | When the folder’s contents were last changed (see §6) |
| `PERSONAL_TOOLBAR_FOLDER` | Optional | If `"true"`, this folder is the browser bookmarks bar / personal toolbar |

`PERSONAL_TOOLBAR_FOLDER`:

- At most one folder in the file should set this to `"true"`
- On import, browsers map that folder to the bookmarks bar
- This project marks the Chrome `roots.bookmark_bar` folder with `PERSONAL_TOOLBAR_FOLDER="true"`
- Omit the attribute (or do not set it true) for ordinary folders

### 5.2 Bookmark attributes (`<A>`)

| Attribute | Required | Description |
|-----------|----------|-------------|
| `HREF` | **Yes** | Target URL (absolute `http:`, `https:`, `ftp:`, `file:`, `javascript:`, `data:`, or other browser-accepted schemes; relative URLs are accepted but discouraged) |
| `ADD_DATE` | Recommended | When the bookmark was added (see §6) |

### 5.3 Common optional attributes (for full browser interoperability)

These are widely emitted/consumed by browsers but **not** required by this project’s exporter. Importers should accept and preserve them when present; exporters may omit them.

| Attribute | On | Description |
|-----------|-----|-------------|
| `ICON` | `<A>` | Data-URL favicon, typically `data:image/png;base64,…` |
| `ICON_URI` | `<A>` | URL of the favicon resource |
| `LAST_VISIT` | `<A>` | Last visit timestamp (same epoch rules as §6) |
| `LAST_MODIFIED` | `<A>` | Last modification timestamp |
| `SHORTCUTURL` | `<A>` | Keyword shortcut used by some browsers |
| `TAGS` | `<A>` | Comma-separated tags (Firefox) |
| `FEED` / `FEEDURL` | `<A>` | Legacy feed link metadata |
| `WEB_PANEL` | `<A>` / `<H3>` | Legacy sidebar panel flag (`"true"`) |
| `FOLDER_OPENED` / `folded` | `<H3>` | UI open/closed state in some exporters |

Unknown attributes should be ignored on import, not treated as fatal errors.

---

## 6. Timestamps

### 6.1 Representation

- Attributes store timestamps as **decimal integer strings** (e.g. `"1566286977"`)
- No units suffix; no floating-point values

### 6.2 Epoch and unit (interchange)

For maximum compatibility with browser HTML bookmark import/export:

| Convention | Value |
|------------|--------|
| Epoch | Unix time: seconds since 1970-01-01T00:00:00Z |
| Unit | Whole **seconds** |

Example: `ADD_DATE="1566286977"` → `2019-08-20T08:09:37Z`.

### 6.3 Relationship to Chrome JSON bookmarks

Chrome’s on-disk JSON bookmark store (`Bookmarks` file) uses a different clock:

| Source | Epoch | Unit |
|--------|--------|------|
| Chrome JSON `date_added` / `date_modified` | 1601-01-01T00:00:00Z (Windows FILETIME) | **Microseconds** |
| Netscape HTML `ADD_DATE` / `LAST_MODIFIED` | 1970-01-01T00:00:00Z | **Seconds** |

Conversion (JSON → HTML):

```
unix_seconds = floor(chrome_microseconds / 1_000_000) - 11644473600
```

Conversion (HTML → JSON):

```
chrome_microseconds = (unix_seconds + 11644473600) * 1_000_000
```

Where `11644473600` is the number of seconds between 1601-01-01 and 1970-01-01 UTC.

Exporters converting from Chrome JSON **should** convert to Unix seconds before writing HTML attributes. Importers writing Chrome JSON **should** convert back.

If a timestamp is missing, use `0` or omit the attribute; importers typically treat missing dates as “unknown” / current time depending on the browser.

---

## 7. Text escaping and encoding

When writing attribute values and text nodes:

| Character | Escape in text / attributes |
|-----------|----------------------------|
| `&` | `&amp;` |
| `<` | `&lt;` |
| `>` | `&gt;` (recommended in text) |
| `"` | `&quot;` (required inside double-quoted attributes) |
| `'` | `&apos;` or `&#39;` if using single-quoted attributes |

Additional rules:

- Emit the file as UTF-8 (no BOM preferred; BOM is tolerated)
- Preserve Unicode in titles (e.g. `Lesezeichenleiste`)
- Do not HTML-entity-encode the entire URL beyond the attribute escaping rules; keep the URL string as stored
- Newlines inside titles are uncommon; strip or normalize if present

---

## 8. Semantics for export

An exporter should:

1. Emit the doctype, meta charset, `<TITLE>`, `<H1>`, and root `<DL><p>`
2. For each root-level item, emit either a folder (§4.3) or bookmark (§4.4)
3. Mark the bookmarks-bar folder with `PERSONAL_TOOLBAR_FOLDER="true"` when applicable
4. Recurse into each folder’s children inside its nested `<DL><p>`
5. Write `ADD_DATE` / `LAST_MODIFIED` as Unix seconds strings when known
6. Preserve child order
7. HTML-escape titles and attribute values
8. Skip unsupported node types or map them explicitly (this project only supports folders and URLs)

### 8.1 Mapping from Chrome JSON (as used by this tool)

Chrome JSON shape (relevant fields only):

```json
{
  "roots": {
    "bookmark_bar": {
      "name": "…",
      "type": "folder",
      "date_added": "…",
      "date_modified": "…",
      "children": [ /* folder | url nodes */ ]
    },
    "other": { /* … */ },
    "synced": { /* … */ }
  }
}
```

| JSON field | HTML output |
|------------|-------------|
| `roots.bookmark_bar` | Root toolbar folder: `<H3 … PERSONAL_TOOLBAR_FOLDER="true">` |
| `type: "folder"` | `<DT><H3>` + nested `<DL>` |
| `type: "url"` | `<DT><A HREF="…">` |
| `name` | Text content of `<H3>` or `<A>` |
| `url` | `HREF` on `<A>` |
| `date_added` | `ADD_DATE` (after epoch conversion; see §6.3) |
| `date_modified` | `LAST_MODIFIED` on folders (after conversion) |
| `children` | Contents of the folder’s nested `<DL>` |
| `id`, `checksum`, `meta_info`, … | Not represented in HTML (safe to drop on export) |

This project’s current exporter focuses on `roots.bookmark_bar`. A complete Chrome round-trip exporter should also emit `roots.other` (and optionally `roots.synced`) as ordinary top-level folders without `PERSONAL_TOOLBAR_FOLDER`.

---

## 9. Semantics for import

An importer should:

1. Reject or warn if the doctype is not `NETSCAPE-Bookmark-file-1` (optional soft check; many importers still accept files that merely look like the DL/DT structure)
2. Decode using the charset from `<META>` (default UTF-8)
3. Locate the root `<DL>` after `<H1>` (or the first substantial `<DL>` in the body)
4. Walk `<DT>` entries in document order:
   - `<H3>` → folder; associate the following sibling `<DL>` as its children
   - `<A>` → bookmark; require `HREF`
5. Read attributes case-insensitively
6. Coerce timestamp attributes to integers; treat missing/invalid as unknown
7. If a folder has `PERSONAL_TOOLBAR_FOLDER="true"`, map it to the bookmarks bar
8. Ignore `<p>` tokens after `<DL>` / `</DL>`
9. Ignore comments and unrecognized tags/attributes
10. Preserve order of siblings

Suggested tolerant parsing notes:

- Accept lowercase tags (`<dl>`, `<dt>`, `<h3>`, `<a>`)
- Accept folders where the nested `<DL>` is placed as a child of `<DT>` instead of as a sibling (some non-conforming exporters do this)
- Accept missing `ADD_DATE` / `LAST_MODIFIED`
- Treat empty `HREF` as invalid bookmark and skip or keep with a placeholder, per product policy

---

## 10. Complete minimal example

```html
<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
    <DT><H3 ADD_DATE="1566286977" LAST_MODIFIED="1566293009" PERSONAL_TOOLBAR_FOLDER="true">Bookmarks Bar</H3>
    <DL><p>
        <DT><H3 ADD_DATE="1566290368" LAST_MODIFIED="1566370751">Folder 1</H3>
        <DL><p>
            <DT><A HREF="https://www.example.com" ADD_DATE="1566290355">Example Page Name</A>
        </DL><p>
        <DT><A HREF="https://www.youtube.com" ADD_DATE="1566366881">YouTube</A>
    </DL><p>
</DL><p>
```

Equivalent tree:

```
Bookmarks Bar/          ← PERSONAL_TOOLBAR_FOLDER
├── Folder 1/
│   └── Example Page Name → https://www.example.com
└── YouTube → https://www.youtube.com
```

A larger fixture lives at `example/bookmarks_example_output.html`.

---

## 11. Conformance checklist

### Export (must)

- [ ] Doctype is `<!DOCTYPE NETSCAPE-Bookmark-file-1>`
- [ ] UTF-8 `Content-Type` meta is present
- [ ] `<TITLE>` and `<H1>` are present
- [ ] Root container is a `<DL>`
- [ ] Folders are `<DT><H3>name</H3>` plus nested `<DL>` of children
- [ ] Bookmarks are `<DT><A HREF="url">title</A>`
- [ ] Nesting depth and sibling order match the source tree
- [ ] Special characters in titles/attributes are escaped
- [ ] Toolbar folder sets `PERSONAL_TOOLBAR_FOLDER="true"` when applicable

### Export (should)

- [ ] Emit traditional `<DL><p>` / `</DL><p>` markers
- [ ] Emit `ADD_DATE` / `LAST_MODIFIED` as Unix seconds
- [ ] Convert Chrome JSON FILETIME microseconds when the source uses that epoch
- [ ] Use uppercase tag/attribute names for compatibility with historical examples

### Import (must)

- [ ] Parse doctype-recognized or DL/DT/H3/A bookmark HTML
- [ ] Build a tree from nested `<DL>` lists
- [ ] Read bookmark titles, URLs (`HREF`), and folder names
- [ ] Honor `PERSONAL_TOOLBAR_FOLDER="true"` when present
- [ ] Tolerate missing optional attributes and `<p>` markers

### Import (should)

- [ ] Accept case-insensitive tags/attributes
- [ ] Decode via declared charset
- [ ] Convert Unix-second dates to the destination store’s native timestamp format
- [ ] Preserve unrecognized attributes when round-tripping is required

---

## 12. Non-goals / out of scope for this format

The HTML bookmark format does not standardize:

- Bookmark IDs (Chrome `id` fields)
- Sync metadata (`synced` mobile roots beyond ordinary folders)
- Checksums
- Favicon binary storage except via optional `ICON` data URLs
- Permissions, profiles, or browser-specific sync state

Those belong in each browser’s native store (e.g. Chrome JSON), not in the interchange HTML.
