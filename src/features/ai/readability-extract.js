/**
 * [IMPL-AI_TAGGING_READABILITY] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP]
 * Extract main page content using @mozilla/readability for AI tagging.
 */

import { Readability } from '@mozilla/readability'

const DEFAULT_MAX_LENGTH = 16000

/**
 * Extract title and text content from document for AI tagging.
 * Clones document so the page is not mutated.
 * @param {Document} document - DOM document (e.g. window.document)
 * @param {{ maxLength?: number }} [options] - Optional max text length (default 16000)
 * @returns {{ title: string, textContent: string }}
 */
export function extractPageContent (document, options = {}) {
  const maxLength = options.maxLength ?? DEFAULT_MAX_LENGTH
  // [IMPL-AI_TAGGING_READABILITY] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] Guard: no document or cloneNode → empty result.
  if (!document || typeof document.cloneNode !== 'function') {
    return { title: '', textContent: '' }
  }

  let title = ''
  let textContent = ''

  try {
    // [IMPL-AI_TAGGING_READABILITY] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] Clone document; Readability.parse; use article title/text or fallback to document.title + body.innerText.
    const clone = document.cloneNode(true)
    const reader = new Readability(clone)
    const article = reader.parse()
    if (article) {
      title = (article.title && String(article.title).trim()) || (document.title && String(document.title).trim()) || ''
      textContent = (article.textContent && String(article.textContent).trim()) || ''
    } else {
      // [IMPL-AI_TAGGING_READABILITY] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] Fallback when parse returns null: document.title + body.innerText.
      title = (document.title && String(document.title).trim()) || ''
      const body = document.body
      textContent = (body && body.innerText && String(body.innerText).trim()) ? String(body.innerText).trim() : ''
    }
  } catch {
    // [IMPL-AI_TAGGING_READABILITY] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] Catch: fallback to document.title + body.innerText.
    title = (document.title && String(document.title).trim()) || ''
    const body = document.body
    textContent = (body && body.innerText) ? String(body.innerText).trim() : ''
  }

  // [IMPL-AI_TAGGING_READABILITY] [ARCH-AI_TAGGING_FLOW] [REQ-AI_TAGGING_POPUP] Cap textContent at maxLength for AI payload size.
  if (textContent.length > maxLength) {
    textContent = textContent.slice(0, maxLength)
  }
  return { title, textContent }
}
