# [IMPL-AI_TAGGING_POPUP_UI] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] [REQ-STORAGE_MODE_DEFAULT] — Popup "Tag with AI" flow: get page content, get AI tags, split by session, create/update bookmark with default backend, update suggested tags.

## ON_TAG_WITH_AI_CLICK

- [IMPL-AI_TAGGING_POPUP_UI] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] [REQ-STORAGE_MODE_DEFAULT] How: Implements onTagWithAiClick() behavior for IMPL-AI_TAGGING_POPUP_UI.
- Contract:
  - INPUT: user click "Tag with AI"
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: bookmark updated; suggested tags updated | { error: OperationFailed }
  - POST:
    - success => block outputs match OUTPUT success shape
    - error OperationFailed => no silent partial commit beyond documented best-effort
  - FAILURE_MODES: OperationFailed
  - EFFECTS: Async, Http, IO, State
  - TERMINATION: total
- PROCEDURE: ON_TAG_WITH_AI_CLICK
  - IF !config.aiApiKey or !currentTab.url.startsWith('http') THEN show message; RETURN
  - content = await sendToSW({ type: 'GET_PAGE_CONTENT', data: { tabId } })  // SW uses scripting.executeScript in tab
  - IF !content?.textContent THEN show (content.error if content.success === false else generic error); RETURN
  - aiTags = await sendToSW({ type: 'GET_AI_TAGS', data: { text: content.textContent, limit: config.aiTagLimit } })
  - sessionSet = new Set(await sendToSW({ type: 'getSessionTags' }))
  - inSession = aiTags.filter(t => sessionSet.has(t.toLowerCase()))
  - suggested = aiTags.filter(t => !sessionSet.has(t.toLowerCase()))
  - bookmark = await getCurrentBookmark()
  - defaultBackend = await configManager.getStorageMode()
  - IF !bookmark?.time:
  - create bookmark with url, title, tags: inSession, preferredBackend: defaultBackend
  - ELSE:
  - merged = merge(bookmark.tags, inSession)  // dedupe case-insensitive
  - saveBookmark({ ...bookmark, tags: merged, preferredBackend: bookmark backend or defaultBackend })
  - updateSuggestedTags(suggested)  // so AI tags appear first in Suggested section
  - refresh bookmark state / badge
