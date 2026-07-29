# [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS] [ARCH-SIDE_PANEL_BROWSER_BOOKMARKS] [REQ-SIDE_PANEL_BROWSER_BOOKMARKS]
# This block defines the browser bookmarks panel: data fetch, flatten, folder tree, filter, UI, click to open. Implements REQ by listing Chrome bookmarks with folder path and favicon; real-time search; folder filter; implements ARCH by chrome.bookmarks API and visible-list actions.

INPUT: searchQuery (string), selectedFolderId (string | null), bookmarks from chrome.bookmarks.getTree
OUTPUT: visible bookmarks (filtered), click URL opens in new tab
DATA: allBookmarks = flattenBookmarkTree(tree), visibleBookmarks = filterBrowserBookmarks(allBookmarks, searchQuery, selectedFolderId)

# [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [ARCH-SIDE_PANEL_BROWSER_BOOKMARKS] [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS]
# Data fetch: panel calls chrome.bookmarks.getTree; flatten to list. Implements "list all Chrome bookmarks".
ON load / refresh (panel):
  tree = AWAIT chrome.bookmarks.getTree()
  allBookmarks = flattenBookmarkTree(tree[0]?.children ?? [], '')
  folderTree = buildFolderTree(tree[0]?.children ?? [], '')
  applyFilter(); renderList()

# [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [ARCH-SIDE_PANEL_BROWSER_BOOKMARKS] [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS]
# flattenBookmarkTree(nodes, parentPath): pure. For each node: if node.url push { id, url, title, dateAdded, folderPath: parentPath, parentId }; if node.children recurse with path = parentPath ? parentPath + ' / ' + node.title : node.title. Return flat list. Implements "folder path per bookmark".
flattenBookmarkTree(nodes, parentPath):
  list = []
  FOR each node in nodes:
    path = parentPath ? parentPath + ' / ' + (node.title || 'Unnamed') : (node.title || 'Unnamed')
    IF node.url: list.push({ id: node.id, url: node.url, title: node.title || '', dateAdded: node.dateAdded ?? 0, folderPath: parentPath, parentId: node.parentId })
    IF node.children: list.push(...flattenBookmarkTree(node.children, path))
  RETURN list

# [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [ARCH-SIDE_PANEL_BROWSER_BOOKMARKS] [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS]
# buildFolderTree(nodes, parentPath): pure. Returns [{ id, title, path, count, children }]. count = number of direct bookmarks (node.url) in this folder; children = recurse on node.children. Implements "folder tree with bookmark counts".
buildFolderTree(nodes, parentPath):
  result = []
  FOR each node in nodes:
    path = parentPath ? parentPath + ' / ' + (node.title || 'Unnamed') : (node.title || 'Unnamed')
    directCount = (node.children ?? []).filter(c => c.url).length
    childFolders = buildFolderTree((node.children ?? []).filter(c => !c.url), path)
    result.push({ id: node.id, title: node.title || 'Unnamed', path, count: directCount, children: childFolders })
  RETURN result

# [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [ARCH-SIDE_PANEL_BROWSER_BOOKMARKS] [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS]
# filterBrowserBookmarks(bookmarks, query, folderId): pure. Empty query returns all. If folderId: filter where parentId === folderId. Then filter by query: case-insensitive substring match on title, url, folderPath. Implements "real-time search" and "folder filter".
filterBrowserBookmarks(bookmarks, query, folderId):
  filtered = bookmarks
  IF folderId: filtered = filtered.filter(b => b.parentId === folderId)
  q = String(query).trim().toLowerCase()
  IF q === '': RETURN filtered
  RETURN filtered.filter(b => (b.title??'').toLowerCase().includes(q) OR (b.url??'').toLowerCase().includes(q) OR (b.folderPath??'').toLowerCase().includes(q))

# [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [ARCH-SIDE_PANEL_BROWSER_BOOKMARKS] [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS]
# UI: search input; folder dropdown/sidebar; list section; match count. Each row: favicon, title, url, folder path. Click url: chrome.tabs.create({ url }) for http(s). Implements "match count", "click URL opens in new tab".
RENDER: FOR each b in visibleBookmarks: display row with favicon, title, url (clickable), folderPath; show "N bookmarks" count
ON search input: searchQuery = value; applyFilter(); renderList()
ON folder select: selectedFolderId = value; applyFilter(); renderList()
ON sort select: sortValue = value; applyFilter(); chrome.storage.local.set({ hoverboard_browser_bookmarks_sort: sortValue })
sortBrowserBookmarks(visible, sortBy, sortAsc): IF sortBy === 'default' RETURN copy; IF sortBy === 'date' sort by dateAdded; IF sortBy === 'name' sort by title; sortAsc controls direction
ON url click: IF url starts with http(s): chrome.tabs.create({ url: b.url })

# [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [ARCH-SIDE_PANEL_BROWSER_BOOKMARKS] [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS]
# Bulk selection and button state: selectedIds Set; renderList outputs checkbox per row; checkbox change toggles selectedIds; updateBulkButtonStates disables Open/Copy/Move/Delete/Export when selectedIds.size === 0. Select all / Deselect all buttons.
DATA: selectedIds = Set(), lastVisible = filtered+sorted list
getSelectedBookmarks() = lastVisible.filter(b => selectedIds.has(b.id))
ON Select all: FOR b in lastVisible selectedIds.add(b.id); applyFilter()
ON Deselect all: selectedIds.clear(); applyFilter()

# [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [ARCH-SIDE_PANEL_BROWSER_BOOKMARKS] [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS]
# Bulk actions: Open in tabs (getSelectedBookmarks, chrome.tabs.create per URL); Open in window (chrome.windows.create); Copy (buildUrlListForCopy, navigator.clipboard.writeText); Move (move select value, chrome.bookmarks.move); Delete (confirm, chrome.bookmarks.remove, push undo stack, showUndoMessage).
ON Open in tabs: FOR url in getSelectedBookmarks().map(b => b.url): chrome.tabs.create({ url })
ON Open in window: chrome.windows.create({ url: getSelectedBookmarks().map(b => b.url) })
ON Copy URLs: navigator.clipboard.writeText(buildUrlListForCopy(getSelectedBookmarks()))
ON Move: targetId = moveSelect.value; FOR b in getSelectedBookmarks(): chrome.bookmarks.move(b.id, { parentId: targetId }); loadBookmarks()
ON Delete: confirm; FOR b in getSelectedBookmarks(): chrome.bookmarks.remove(b.id); push to undoStack { bookmarks: [{ parentId, url, title }] }; showUndoMessage(count)

# [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [ARCH-SIDE_PANEL_BROWSER_BOOKMARKS] [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS]
# Undo: undoStack array; UNDO_STACK_LIMIT 50; showUndoMessage(count) renders #browserBookmarksUndoBar with "Undo" button and setTimeout(UNDO_MESSAGE_DURATION_MS) to hide; on Undo click pop entry, chrome.bookmarks.create per bookmark, loadBookmarks.
showUndoMessage(deletedCount): render undo bar "Deleted N bookmarks. Undo"; setTimeout(hide, UNDO_MESSAGE_DURATION_MS)
ON Undo click: entry = undoStack.pop(); FOR b in entry.bookmarks: chrome.bookmarks.create({ parentId: b.parentId||'1', url, title, index: 0 }); loadBookmarks()

# [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [ARCH-SIDE_PANEL_BROWSER_BOOKMARKS] [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS]
# Export: buildBookmarksHtml/buildBookmarksCsv(selected|allBookmarks); Blob; downloadBlob. Export selected/all buttons disabled when no selection or no data.
ON Export selected HTML/CSV: buildBookmarksHtml|buildBookmarksCsv(getSelectedBookmarks()); downloadBlob(blob, filename)
ON Export all HTML/CSV: buildBookmarksHtml|buildBookmarksCsv(allBookmarks); downloadBlob(blob, filename)

# [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [ARCH-SIDE_PANEL_BROWSER_BOOKMARKS] [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS]
# Import: populateImportFolderSelect from folderTree; file input; on Import read file.text(), parse by extension (parseBookmarksHtml|parseBookmarksCsv); get existing URLs via getSubTree(targetId)+flatten; for each row skip or overwrite per conflict; chrome.bookmarks.create; progress; loadBookmarks.
ON Import: list = parseBookmarksHtml(text)|parseBookmarksCsv(text); existingUrls = flatten(getSubTree(targetId)); FOR b in list: IF conflict skip skip; ELSE IF overwrite find and chrome.bookmarks.update OR create; ELSE chrome.bookmarks.create; update progress; loadBookmarks()

# [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [ARCH-SIDE_PANEL_BROWSER_BOOKMARKS] [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS]
# Inline edit: double-click [data-field="title"] or [data-field="url"]; startInlineEdit(el): create input, replace el, focus; on blur/Enter finishEdit: chrome.bookmarks.update(id, { title }|{ url }), update allBookmarks, applyFilter(); Escape restore currentVal and applyFilter().
ON double-click title|url: startInlineEdit(el); input.onblur|Enter => finishEdit (update then applyFilter); Escape => applyFilter (restore view)

# [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [ARCH-SIDE_PANEL_BROWSER_BOOKMARKS] [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS]
# Keyboard: document keydown; if panel hidden return; if target in input/select/textarea and Escape blur and return; if Escape clear selectedIds and applyFilter(); if Ctrl+F preventDefault and focus searchInput.
handleBookmarksKeydown(e): IF panel hidden RETURN; IF target in input|select|textarea AND Escape THEN blur; RETURN; IF Escape THEN selectedIds.clear(); applyFilter(); IF Ctrl+F THEN preventDefault; searchInput.focus()

# [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [ARCH-SIDE_PANEL_BROWSER_BOOKMARKS] [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS]
# Layout: Undo bar #browserBookmarksUndoBar; import section with Import to folder, Conflict select, file input, Import button, progress; populateMoveSelect and populateImportFolderSelect mirror folder tree.
PANEL LAYOUT: above-list includes undo bar, bulk actions, import section; populateMoveSelect() and populateImportFolderSelect() from folderTree

# [REQ-SIDE_PANEL_BROWSER_BOOKMARKS] [ARCH-SIDE_PANEL_BROWSER_BOOKMARKS] [IMPL-SIDE_PANEL_BROWSER_BOOKMARKS]
# Panel layout: same as Tags tree. #browserBookmarksPanel scroll container; .browser-bookmarks-above-list (flex none) with header, search, folder selector; .browser-bookmarks-list-section (min-height 100%, overflow-y auto) with #browserBookmarksList.
PANEL LAYOUT: browserBookmarksPanel = scroll container; above-list = header + search + folder + sort + bulk + undo + import; list-section = #browserBookmarksList
