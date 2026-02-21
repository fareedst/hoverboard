/**
 * [REQ-AI_TAGGING_POPUP] [ARCH-AI_TAGGING_FLOW] [IMPL-AI_TAGGING_READABILITY]
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
  if (!document || typeof document.cloneNode !== 'function') {
    return { title: '', textContent: '' }
  }

  let title = ''
  let textContent = ''

  try {
    const clone = document.cloneNode(true)
    const reader = new Readability(clone)
    const article = reader.parse()
    if (article) {
      title = (article.title && String(article.title).trim()) || (document.title && String(document.title).trim()) || ''
      textContent = (article.textContent && String(article.textContent).trim()) || ''
    } else {
      title = (document.title && String(document.title).trim()) || ''
      const body = document.body
      textContent = (body && body.innerText && String(body.innerText).trim()) ? String(body.innerText).trim() : ''
    }
  } catch {
    title = (document.title && String(document.title).trim()) || ''
    const body = document.body
    textContent = (body && body.innerText) ? String(body.innerText).trim() : ''
  }

  if (textContent.length > maxLength) {
    textContent = textContent.slice(0, maxLength)
  }
  return { title, textContent }
}
