# [IMPL-SESSION_TAGS] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP]
# In-session tags (lowercase) for auto-apply when AI returns; getSessionTags, recordSessionTags; session or in-memory.
# Contract: recordSessionTags(tags) or getSessionTags(); array of lowercase tags or void.
INPUT: recordSessionTags(tags: string[]); getSessionTags(): no args
OUTPUT: getSessionTags() -> string[] (lowercase); recordSessionTags -> void
DATA: storage key hoverboard_session_tags; use chrome.storage.session or in-memory Map in SW

# Read from session storage or in-memory set; return lowercase array.
getSessionTags():
  IF chrome.storage.session:
    result = await chrome.storage.session.get('hoverboard_session_tags')
    RETURN (result.hoverboard_session_tags ?? []).map(t => t.toLowerCase())
  RETURN inMemorySet ? Array.from(inMemorySet) : []

# Merge tags (lowercase) into set; persist to session storage or in-memory.
recordSessionTags(tags):
  current = await getSessionTags()
  set = new Set(current.map(t => t.toLowerCase()))
  FOR tag IN tags: set.add(String(tag).trim().toLowerCase())
  arr = Array.from(set)
  IF chrome.storage.session: await chrome.storage.session.set({ hoverboard_session_tags: arr })
  ELSE: inMemorySet = set
