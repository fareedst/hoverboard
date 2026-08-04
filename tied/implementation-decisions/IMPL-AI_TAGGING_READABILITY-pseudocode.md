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

## MESSAGE_DISPATCH_GET_PAGE_CONTENT

- [IMPL-AI_TAGGING_READABILITY] [IMPL-CROSS_BROWSER] [ARCH-AI_TAGGING_FLOW] [ARCH-CROSS_BROWSER] [REQ-AI_TAGGING_POPUP] [REQ-CROSS_BROWSER] How: Dispatches GET_PAGE_CONTENT to EXTRACT_PAGE_CONTENT and returns the extracted payload through the runtime response channel.
- Contract:
  - INPUT: runtime message, sender, response callback
  - PRE: runtime listener is registered; response callback is callable
  - OUTPUT: response channel containing { success: true, data: { title, textContent } }
  - POST:
    - success => response callback receives the extracted page payload
  - EFFECTS: Async, IO
  - TERMINATION: total
- PROCEDURE: MESSAGE_DISPATCH_GET_PAGE_CONTENT
  - ON runtime message with type GET_PAGE_CONTENT:
    - data = AWAIT EXTRACT_PAGE_CONTENT(document)
    - SEND response callback { success: true, data }
    - RETURN true to keep the response channel open
