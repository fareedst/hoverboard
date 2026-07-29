# [IMPL-AI_TAGGING_READABILITY] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP]
# Extract main content from document: Readability when available, else title + body.innerText; cap at maxLength.

# Contract: input = document (or run in page context); output = { title, textContent }; maxLength cap (e.g. 16k).
INPUT: document (or run in page context)
OUTPUT: { title: string, textContent: string }
DATA: maxLength (e.g. 16000)

# Clone document; Readability.parse; use result title/text or fallback to document.title and body.innerText; cap text length.
extractPageContent(document):
  clone = document.cloneNode(true)
  result = Readability.parse(clone)  // @mozilla/readability
  IF result:
    title = result.title ?? document.title
    text = result.textContent ?? ''
  ELSE:
    title = document.title
    text = document.body ? document.body.innerText : ''
  IF text.length > maxLength THEN text = text.slice(0, maxLength)
  RETURN { title, textContent: text }
