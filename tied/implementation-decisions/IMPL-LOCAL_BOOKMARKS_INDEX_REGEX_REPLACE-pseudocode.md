# [IMPL-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE] [ARCH-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE] [REQ-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE] — Regex find-and-replace on selected fields; applyRegexReplace (pure); regexReplaceSelected sends saveBookmark when changed. Pure function: build payload and set changed iff any selected field value changed.

## APPLY_REGEX_REPLACE

- [IMPL-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE] [ARCH-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE] [REQ-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE] How: Implements applyRegexReplace(bookmark, patternStr, replacementStr, options { title, url, tags, notes }) behavior for IMPL-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE.
- Contract:
  - INPUT: context / caller args
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: result | { error: OperationFailed }
  - POST:
    - success => block outputs match OUTPUT success shape
    - error OperationFailed => no silent partial commit beyond documented best-effort
  - FAILURE_MODES: OperationFailed
  - EFFECTS: IO
  - TERMINATION: total
- PROCEDURE: APPLY_REGEX_REPLACE
  - TRY reg = new RegExp(patternStr, 'g')
  - CATCH e RETURN { payload: null, error: e.message }
  - IF !bookmark || !bookmark.url RETURN { payload: null, error: 'missing bookmark or url' }
  - IF !patternStr || !patternStr.trim() RETURN { payload: null, error: 'empty pattern' }
  - IF !options.title && !options.url && !options.tags && !options.notes RETURN { payload: null, error: 'no fields selected' }
  - origDesc = String(bookmark.description ?? ''); origUrl = String(bookmark.url ?? ''); origTags = [...]; origExt = String(bookmark.extended ?? '')
  - desc = origDesc; u = origUrl; tagsArr = [...]; ext = origExt
  - TRY IF options.title: desc = desc.replace(reg, replacementStr); IF options.url: u = u.replace(reg, replacementStr); IF options.tags: tagsArr = ...; IF options.notes: ext = ext.replace(reg, replacementStr)
  - CATCH e RETURN { payload: null, error: e.message }
  - changed = (opts.title && desc !== origDesc) || (opts.url && u !== origUrl) || (opts.tags && tagsArr differs from origTags) || (opts.notes && ext !== origExt)
  - payload = { url, description: desc, tags: tagsArr, extended: ext, preferredBackend, ...time/updated_at/shared/toread }
  - RETURN { payload, error: null, changed }
  - How (sub-block): Per selected URL apply regex; save only when changed; refresh and restore selection.

## REGEX_REPLACE_SELECTED

- [IMPL-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE] [ARCH-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE] [REQ-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE] How: Implements regexReplaceSelected() behavior for IMPL-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE.
- Contract:
  - INPUT: context / caller args
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: result | { error: OperationFailed }
  - POST:
    - success => block outputs match OUTPUT success shape
    - error OperationFailed => no silent partial commit beyond documented best-effort
  - FAILURE_MODES: OperationFailed
  - EFFECTS: IO
  - TERMINATION: total
- PROCEDURE: REGEX_REPLACE_SELECTED
  - patternStr = regexInput.value.trim(); replacementStr = replacementInput.value
  - IF !patternStr || selectedUrls.size === 0 RETURN
  - options = { title, url, tags, notes } from checkboxes
  - IF no field selected: show error; RETURN
  - TRY RegExp(patternStr); CATCH: show error; RETURN
  - byUrl = Map(allBookmarks: url -> bookmark)
  - FOR url IN selectedUrls: b = byUrl.get(url); IF !b CONTINUE; result = applyRegexReplace(b, patternStr, replacementStr, options); IF result.error show and RETURN; IF !result.payload CONTINUE; IF result.changed === false CONTINUE; SEND saveBookmark(result.payload)
  - urlsToRestore = Set(selectedUrls); selectedUrls.clear(); loadBookmarks(); selectionStillVisible; renderTableBody(); clear error; updateMoveControlsState()

## ROUTER_STORAGE_REGEX_SAVE

- [IMPL-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE] [IMPL-BOOKMARK_ROUTER] [IMPL-LOCAL_BOOKMARKS_INDEX] [IMPL-STORAGE_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE] [ARCH-STORAGE_INDEX_AND_ROUTER] [REQ-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE] [REQ-RELIABILITY] How: Connects selected-bookmark regex replacement to preferred-backend router persistence and storage-index refresh.
- Contract:
  - INPUT: selected URLs, bookmark map, regex options, router save operation
  - PRE: selected URLs and replacement options are available
  - OUTPUT: refreshed bookmark rows with unchanged selections restored
  - POST:
    - success => only changed payloads are sent to the router and the display is reloaded
  - FAILURE_MODES: InvalidPattern, BookmarkSaveFailed
  - DATA: selected URL set and displayed bookmark rows
  - DATA_TRANSITION: changed rows are persisted; selection is cleared during reload and restored for visible URLs
  - EFFECTS: Async, IO, State
  - TERMINATION: total
- PROCEDURE: ROUTER_STORAGE_REGEX_SAVE
  - Build replacement payload for each selected URL
  - IF replacement is unchanged: skip router save
  - AWAIT router save for each changed payload
  - Reload bookmark rows
  - Restore visible selections
