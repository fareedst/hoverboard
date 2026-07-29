# [IMPL-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE] [ARCH-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE] [REQ-LOCAL_BOOKMARKS_INDEX_REGEX_REPLACE]
# Regex find-and-replace on selected fields; applyRegexReplace (pure); regexReplaceSelected sends saveBookmark when changed.
# Pure function: build payload and set changed iff any selected field value changed.
applyRegexReplace(bookmark, patternStr, replacementStr, options { title, url, tags, notes }):
  TRY reg = new RegExp(patternStr, 'g')
  CATCH e RETURN { payload: null, error: e.message }
  IF !bookmark || !bookmark.url RETURN { payload: null, error: 'missing bookmark or url' }
  IF !patternStr || !patternStr.trim() RETURN { payload: null, error: 'empty pattern' }
  IF !options.title && !options.url && !options.tags && !options.notes RETURN { payload: null, error: 'no fields selected' }
  origDesc = String(bookmark.description ?? ''); origUrl = String(bookmark.url ?? ''); origTags = [...]; origExt = String(bookmark.extended ?? '')
  desc = origDesc; u = origUrl; tagsArr = [...]; ext = origExt
  TRY IF options.title: desc = desc.replace(reg, replacementStr); IF options.url: u = u.replace(reg, replacementStr); IF options.tags: tagsArr = ...; IF options.notes: ext = ext.replace(reg, replacementStr)
  CATCH e RETURN { payload: null, error: e.message }
  changed = (opts.title && desc !== origDesc) || (opts.url && u !== origUrl) || (opts.tags && tagsArr differs from origTags) || (opts.notes && ext !== origExt)
  payload = { url, description: desc, tags: tagsArr, extended: ext, preferredBackend, ...time/updated_at/shared/toread }
  RETURN { payload, error: null, changed }

# Per selected URL apply regex; save only when changed; refresh and restore selection.
regexReplaceSelected():
  patternStr = regexInput.value.trim(); replacementStr = replacementInput.value
  IF !patternStr || selectedUrls.size === 0 RETURN
  options = { title, url, tags, notes } from checkboxes
  IF no field selected: show error; RETURN
  TRY RegExp(patternStr); CATCH: show error; RETURN
  byUrl = Map(allBookmarks: url -> bookmark)
  FOR url IN selectedUrls: b = byUrl.get(url); IF !b CONTINUE; result = applyRegexReplace(b, patternStr, replacementStr, options); IF result.error show and RETURN; IF !result.payload CONTINUE; IF result.changed === false CONTINUE; SEND saveBookmark(result.payload)
  urlsToRestore = Set(selectedUrls); selectedUrls.clear(); loadBookmarks(); selectionStillVisible; renderTableBody(); clear error; updateMoveControlsState()
