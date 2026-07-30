# [IMPL-SESSION_TAGS] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] — In-session tags (lowercase) for auto-apply when AI returns; getSessionTags, recordSessionTags; session or in-memory. Contract: recordSessionTags(tags) or getSessionTags(); array of lowercase tags or void.

## GET_SESSION_TAGS

- [IMPL-SESSION_TAGS] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] How: Implements getSessionTags() behavior for IMPL-SESSION_TAGS.
- Contract:
  - INPUT: recordSessionTags(tags: string[]); getSessionTags(): no args
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: getSessionTags() -> string[] (lowercase); recordSessionTags -> void
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: storage key hoverboard_session_tags; use chrome.storage.session or in-memory Map in SW
  - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
  - EFFECTS: Async, IO, State
  - TERMINATION: total
- PROCEDURE: GET_SESSION_TAGS
  - IF chrome.storage.session:
  - result = await chrome.storage.session.get('hoverboard_session_tags')
  - RETURN (result.hoverboard_session_tags ?? []).map(t => t.toLowerCase())
  - RETURN inMemorySet ? Array.from(inMemorySet) : []
  - How (sub-block): Merge tags (lowercase) into set; persist to session storage or in-memory.

## RECORD_SESSION_TAGS

- [IMPL-SESSION_TAGS] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] How: Implements recordSessionTags(tags) behavior for IMPL-SESSION_TAGS.
- Contract:
  - INPUT: recordSessionTags(tags: string[]); getSessionTags(): no args
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: getSessionTags() -> string[] (lowercase); recordSessionTags -> void
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: storage key hoverboard_session_tags; use chrome.storage.session or in-memory Map in SW
  - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
  - EFFECTS: Async, IO, State
  - TERMINATION: total
- PROCEDURE: RECORD_SESSION_TAGS
  - current = await getSessionTags()
  - set = new Set(current.map(t => t.toLowerCase()))
  - FOR tag IN tags: set.add(String(tag).trim().toLowerCase())
  - arr = Array.from(set)
  - IF chrome.storage.session: await chrome.storage.session.set({ hoverboard_session_tags: arr })
  - ELSE: inMemorySet = set
