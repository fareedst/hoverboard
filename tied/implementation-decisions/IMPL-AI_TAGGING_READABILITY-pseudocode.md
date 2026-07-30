# [IMPL-AI_TAGGING_READABILITY] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] — Extract main content from document: Readability when available, else title + body.innerText; cap at maxLength.

## EXTRACT_PAGE_CONTENT

- [IMPL-AI_TAGGING_READABILITY] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] How: Implements extractPageContent(document) behavior for IMPL-AI_TAGGING_READABILITY.
- Contract:
  - INPUT: document (or run in page context)
  - PRE: caller supplies valid inputs for this block; dependencies wired
  - OUTPUT: { title: string, textContent: string }
  - POST:
    - success => block outputs match OUTPUT shape
  - DATA: maxLength (e.g. 16000)
  - EFFECTS: pure
  - TERMINATION: total
- PROCEDURE: EXTRACT_PAGE_CONTENT
  - clone = document.cloneNode(true)
  - result = Readability.parse(clone)  // @mozilla/readability
  - IF result:
  - title = result.title ?? document.title
  - text = result.textContent ?? ''
  - ELSE:
  - title = document.title
  - text = document.body ? document.body.innerText : ''
  - IF text.length > maxLength THEN text = text.slice(0, maxLength)
  - RETURN { title, textContent: text }
