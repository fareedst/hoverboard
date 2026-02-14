# [IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT] Local Bookmarks Index Export Implementation

**Status**: Active  
**Cross-references**: ARCH-LOCAL_BOOKMARKS_INDEX_EXPORT, REQ-LOCAL_BOOKMARKS_INDEX_EXPORT

---

## Summary

- **UI**: Export controls in bookmarks-table toolbar: two buttons, "Export all" and "Export displayed" (in an export-row). Buttons are disabled when the corresponding scope has zero bookmarks.
- **Logic**: In bookmarks-table.js, add `exportBookmarks(scope)` where scope is `'all'` or `'displayed'`. Use `allBookmarks` or `filteredBookmarks`; serialize to CSV (escape quotes, comma-separated columns: description, url, tags as string, time, shared, toread, extended); build filename e.g. `hoverboard-bookmarks-{all|displayed}-{ISO date}.csv`; create Blob, object URL, programmatic click on `<a download="...">`, revoke URL.
- **Annotations**: Use [REQ-LOCAL_BOOKMARKS_INDEX_EXPORT], [ARCH-LOCAL_BOOKMARKS_INDEX_EXPORT], [IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT] in HTML/CSS/JS comments.

## Code locations

- `src/ui/bookmarks-table/bookmarks-table.html`: Export row or section with "Export all" and "Export displayed" buttons.
- `src/ui/bookmarks-table/bookmarks-table.js`: elements.exportAll, elements.exportDisplayed; exportBookmarks(scope); CSV building; download trigger; init bindings and updateExportButtonState() (or equivalent) called after applySearchAndFilter / loadBookmarks.
- `src/ui/bookmarks-table/bookmarks-table.css`: Export button styles using existing .btn / design tokens.

## Related

- IMPL-LOCAL_BOOKMARKS_INDEX (index page this export extends)
- ARCH-LOCAL_BOOKMARKS_INDEX_EXPORT, REQ-LOCAL_BOOKMARKS_INDEX_EXPORT
