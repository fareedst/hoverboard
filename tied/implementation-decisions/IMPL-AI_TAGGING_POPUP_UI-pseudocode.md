# [IMPL-AI_TAGGING_POPUP_UI] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] [REQ-STORAGE_MODE_DEFAULT]
# Popup "Tag with AI" flow: get page content, get AI tags, split by session, create/update bookmark with default backend, update suggested tags.

# Contract: input = user click; outputs = bookmark updated, suggested tags list updated.
INPUT: user click "Tag with AI"
OUTPUT: bookmark updated; suggested tags updated

# Guard on API key and http(s) URL; GET_PAGE_CONTENT then GET_AI_TAGS via SW; split inSession vs suggested; save with preferredBackend (REQ-STORAGE_MODE_DEFAULT); refresh state.
onTagWithAiClick():
  IF !config.aiApiKey or !currentTab.url.startsWith('http') THEN show message; RETURN
  content = await sendToSW({ type: 'GET_PAGE_CONTENT', data: { tabId } })  // SW uses scripting.executeScript in tab
  IF !content?.textContent THEN show (content.error if content.success === false else generic error); RETURN
  aiTags = await sendToSW({ type: 'GET_AI_TAGS', data: { text: content.textContent, limit: config.aiTagLimit } })
  sessionSet = new Set(await sendToSW({ type: 'getSessionTags' }))
  inSession = aiTags.filter(t => sessionSet.has(t.toLowerCase()))
  suggested = aiTags.filter(t => !sessionSet.has(t.toLowerCase()))
  bookmark = await getCurrentBookmark()
  defaultBackend = await configManager.getStorageMode()
  IF !bookmark?.time:
    create bookmark with url, title, tags: inSession, preferredBackend: defaultBackend
  ELSE:
    merged = merge(bookmark.tags, inSession)  // dedupe case-insensitive
    saveBookmark({ ...bookmark, tags: merged, preferredBackend: bookmark backend or defaultBackend })
  updateSuggestedTags(suggested)  // so AI tags appear first in Suggested section
  refresh bookmark state / badge
