# [IMPL-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] [ARCH-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] [REQ-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] — Add/delete tags to selected bookmarks; parseTagsInput, mergeTags, removeTags, selectionStillVisible; saveBookmark per row. Parse comma-separated input; trim and dedupe case-insensitive.

## MAIN

- [IMPL-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] [ARCH-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] [REQ-LOCAL_BOOKMARKS_INDEX_ADD_TAGS] How: Logical block for IMPL-LOCAL_BOOKMARKS_INDEX_ADD_TAGS.
- Contract:
  - INPUT: context / caller args
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: result
  - POST:
    - success => block outputs match OUTPUT shape
  - EFFECTS: IO, State
  - TERMINATION: total
- PROCEDURE: MAIN
  - 1. parseTagsInput(raw): IF !raw || !raw.trim() RETURN []; parts = raw.split(',').map(s => s.trim()).filter(Boolean); seen = Set(); result = []; FOR p IN parts: low = p.toLowerCase(); IF !seen.has(low): seen.add(low); result.push(p); RETURN result
  - How (sub-block): Merge new tags with existing; case-insensitive dedupe.
  - 2. mergeTags(existingTags, newTags): existing = existingTags || []; new = newTags || []; lowerSet = Set(existing.map(t => String(t).toLowerCase())); result = [...existing]; FOR tag IN new: t = tag.trim(); IF t && !lowerSet.has(t.toLowerCase()): result.push(t); lowerSet.add(t.toLowerCase()); RETURN result
  - How (sub-block): Remove given tags from existing list (case-insensitive).
  - 3. removeTags(existingTags, tagsToRemove): removeSet = Set(tagsToRemove.map(t => String(t).trim().toLowerCase()).filter(Boolean)); RETURN existing.filter(t => !removeSet.has(String(t).toLowerCase()))
  - How (sub-block): Return set of selected URLs that remain in filtered list.
  - 4. selectionStillVisible(selectedUrls, filteredBookmarks): visibleUrls = Set(filteredBookmarks.map(b => b.url).filter(Boolean)); RETURN new Set([...selectedUrls].filter(url => visibleUrls.has(url)))
  - How (sub-block): For each selected URL merge new tags and send saveBookmark; refresh and restore selection for still-visible.
  - 5. addTagsToSelected(): newTags = parseTagsInput(addTagsInput.value); IF newTags.length === 0 RETURN; urls = Array.from(selectedUrls); byUrl = Map(allBookmarks: url -> bookmark); FOR url IN urls: b = byUrl.get(url); IF !b CONTINUE; payload = buildAddTagsPayload(b, newTags); IF payload SEND saveBookmark(payload); urlsToRestore = Set(selectedUrls); selectedUrls.clear(); loadBookmarks(); FOR url IN selectionStillVisible(urlsToRestore, filteredBookmarks): selectedUrls.add(url); renderTableBody(); addTagsInput.value = ""; updateMoveControlsState()
  - How (sub-block): For each selected URL remove tags and send saveBookmark; refresh and restore selection for still-visible.
  - 6. deleteTagsFromSelected(): tagsToRemove = parseTagsInput(addTagsInput.value); IF tagsToRemove.length === 0 RETURN; urls = Array.from(selectedUrls); byUrl = Map(allBookmarks: url -> bookmark); FOR url IN urls: b = byUrl.get(url); IF !b CONTINUE; payload = buildRemoveTagsPayload(b, tagsToRemove); IF payload SEND saveBookmark(payload); urlsToRestore = Set(selectedUrls); selectedUrls.clear(); loadBookmarks(); FOR url IN selectionStillVisible(urlsToRestore, filteredBookmarks): selectedUrls.add(url); renderTableBody(); addTagsInput.value = ""; updateMoveControlsState()
