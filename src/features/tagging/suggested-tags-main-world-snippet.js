/**
 * [REQ-SUGGESTED_TAGS_FROM_CONTENT] [REQ-THIS_PAGE_TAG_SORT] [ARCH-THIS_PAGE_TAG_RELEVANCE] [IMPL-THIS_PAGE_TAG_SORT]
 * Injected into page MAIN world via chrome.scripting.executeScript({ files: [...] }).
 * Defines globalThis.__hoverboardExtractSuggestedTagsWithRelevance → Array<{ tag, relevance, inPageFrequency }>.
 * No imports; must stay plain script for MV3 executeScript files.
 */
(function attachHoverboardSuggestedTagsExtract () {
  if (typeof globalThis === 'undefined') return

  const MAIN_SEL = 'main, article, [role="main"], .main, .content'

  const noiseWords = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
    'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
    'to', 'was', 'will', 'with', 'this', 'but', 'they', 'have',
    'had', 'what', 'said', 'each', 'which', 'their', 'time', 'if', 'up',
    'out', 'many', 'then', 'them', 'these', 'so', 'some', 'her', 'would',
    'make', 'like', 'into', 'him', 'two', 'more', 'very', 'after',
    'words', 'long', 'than', 'first', 'been', 'call', 'who', 'oil', 'sit',
    'now', 'find', 'down', 'day', 'did', 'get', 'come', 'made', 'may',
    'part', 'over', 'new', 'sound', 'take', 'only', 'little', 'work', 'know',
    'place', 'year', 'live', 'me', 'back', 'give', 'most', 'thing', 'our',
    'just', 'name', 'good', 'sentence', 'man', 'think', 'say', 'great',
    'where', 'help', 'through', 'much', 'before', 'line', 'right', 'too',
    'mean', 'old', 'any', 'same', 'tell', 'boy', 'follow', 'came', 'want',
    'show', 'also', 'around', 'form', 'three', 'small', 'set', 'put', 'end',
    'does', 'another', 'well', 'large', 'must', 'big', 'even', 'such',
    'because', 'turn', 'here', 'why', 'ask', 'went', 'men', 'read', 'need',
    'land', 'different', 'home', 'us', 'move', 'try', 'kind', 'hand', 'picture',
    'again', 'change', 'off', 'play', 'spell', 'air', 'away', 'animal', 'house',
    'point', 'page', 'letter', 'mother', 'answer', 'found', 'study', 'still',
    'learn', 'should', 'america', 'world', 'high', 'every', 'near', 'add',
    'food', 'between', 'own', 'below', 'country', 'plant', 'last', 'school',
    'father', 'keep', 'tree', 'never', 'start', 'city', 'earth', 'eye', 'light',
    'thought', 'head', 'under', 'story', 'saw', 'left', 'don\'t', 'few', 'while',
    'along', 'might', 'close', 'something', 'seem', 'next', 'hard', 'open',
    'example', 'begin', 'life', 'always', 'those', 'both', 'paper', 'together',
    'got', 'group', 'often', 'run', 'important', 'until', 'children', 'side',
    'feet', 'car', 'mile', 'night', 'walk', 'white', 'sea', 'began', 'grow',
    'took', 'river', 'four', 'carry', 'state', 'once', 'book', 'hear', 'stop',
    'without', 'second', 'later', 'miss', 'idea', 'enough', 'eat', 'face',
    'watch', 'far', 'indian', 'really', 'almost', 'let', 'above', 'girl',
    'sometimes', 'mountain', 'cut', 'young', 'talk', 'soon', 'list', 'song',
    'leave', 'family', 'it\'s'
  ])

  // [REQ-SUGGESTED_TAGS_CASE_PRESERVATION] Mirror src/shared/suggested-tag-original-case.js (no imports in MAIN-world file)
  function suggestedOriginalCaseVariantRank (s) {
    if (!s || typeof s !== 'string') return 0
    const hasUpper = /[A-Z]/.test(s)
    const hasLower = /[a-z]/.test(s)
    if (hasUpper && hasLower) return 2
    if (hasUpper && !hasLower) return 1
    return 0
  }
  function pickBetterSuggestedOriginalCase (existing, candidate) {
    const rNew = suggestedOriginalCaseVariantRank(candidate)
    const rOld = suggestedOriginalCaseVariantRank(existing)
    if (rNew > rOld) return candidate
    if (rNew < rOld) return existing
    return existing
  }

  function extractElementText (element) {
    if (element.title && element.title.trim().length > 0) {
      return element.title.trim()
    }
    const childWithTitle = element.querySelector('[title]')
    if (childWithTitle && childWithTitle.title && childWithTitle.title.trim().length > 0) {
      return childWithTitle.title.trim()
    }
    return (element.textContent || '').trim()
  }

  globalThis.__hoverboardExtractSuggestedTagsWithRelevance = function __hoverboardExtractSuggestedTagsWithRelevance () {
    try {
      const wordFrequency = new Map()
      const wordRelevance = new Map()
      const originalCaseMap = new Map()
      const maxTagLen = 50

      function ingestToken (trimmed, score) {
        if (!trimmed || trimmed.length === 0) return
        const lowerWord = trimmed.toLowerCase()
        if (
          trimmed.length < 2 ||
          trimmed.length > maxTagLen ||
          noiseWords.has(lowerWord) ||
          /^\d+$/.test(trimmed)
        ) {
          return
        }
        wordFrequency.set(lowerWord, (wordFrequency.get(lowerWord) || 0) + 1)
        wordRelevance.set(lowerWord, Math.max(wordRelevance.get(lowerWord) || 0, score))
        const prev = originalCaseMap.get(lowerWord)
        if (prev === undefined) {
          originalCaseMap.set(lowerWord, trimmed)
        } else {
          originalCaseMap.set(lowerWord, pickBetterSuggestedOriginalCase(prev, trimmed))
        }
      }

      function addFromText (text, score) {
        if (!text || !String(text).trim()) return
        const words = String(text)
          .split(/[\s\.,;:!?\-_\(\)\[\]{}"']+/) // eslint-disable-line no-useless-escape -- ] must be escaped to be literal in character class
          .filter((word) => word.length > 0)
        words.forEach((word) => {
          const trimmed = word.trim()
          if (trimmed.length === 0) return
          ingestToken(trimmed, score)
        })
      }

      if (document.title) {
        addFromText(document.title, 360)
      }

      try {
        const urlObj = new URL(window.location.href)
        const pathSegments = urlObj.pathname.split('/').filter((seg) => seg.length > 0)
        const meaningfulSegments = pathSegments.filter((seg) => {
          const lower = seg.toLowerCase()
          return !['www', 'com', 'org', 'net', 'html', 'htm', 'php', 'asp', 'aspx', 'index', 'home', 'page'].includes(lower) &&
            !/^\d+$/.test(seg) && seg.length >= 2
        })
        if (meaningfulSegments.length > 0) {
          addFromText(meaningfulSegments.join(' '), 340)
        }
      } catch (_e) {
        /* ignore */
      }

      const metaKeywords = document.querySelector('meta[name="keywords"]')
      if (metaKeywords && metaKeywords.content && metaKeywords.content.trim().length > 0) {
        addFromText(metaKeywords.content.trim(), 380)
      }
      const metaDescription = document.querySelector('meta[name="description"]')
      if (metaDescription && metaDescription.content && metaDescription.content.trim().length > 0) {
        addFromText(metaDescription.content.trim(), 400)
      }

      document.querySelectorAll('h1, h2, h3').forEach((h) => {
        const t = extractElementText(h)
        if (!t) return
        const inMain = h.closest(MAIN_SEL)
        const tagName = h.tagName.toLowerCase()
        let base = tagName === 'h1' ? 800 : tagName === 'h2' ? 760 : 720
        if (inMain) base += 120
        addFromText(t, base)
      })

      const emphasisElements = document.querySelectorAll('main strong, main b, main em, main i, main mark, main dfn, main cite, main kbd, main code, article strong, article b, article em, article i, article mark, article dfn, article cite, article kbd, article code, [role="main"] strong, [role="main"] b, [role="main"] em, [role="main"] i, [role="main"] mark, [role="main"] dfn, [role="main"] cite, [role="main"] kbd, [role="main"] code, .main strong, .main b, .main em, .main i, .main mark, .main dfn, .main cite, .main kbd, .main code, .content strong, .content b, .content em, .content i, .content mark, .content dfn, .content cite, .content kbd, .content code')
      Array.from(emphasisElements).slice(0, 60).forEach((el) => {
        addFromText(extractElementText(el), 700)
      })

      const definitionTerms = document.querySelectorAll('main dl dt, article dl dt, [role="main"] dl dt, .main dl dt, .content dl dt')
      Array.from(definitionTerms).slice(0, 40).forEach((dt) => {
        addFromText(extractElementText(dt), 700)
      })
      const tableHeaders = document.querySelectorAll('main th, main caption, article th, article caption, [role="main"] th, [role="main"] caption, .main th, .main caption, .content th, .content caption')
      Array.from(tableHeaders).slice(0, 40).forEach((th) => {
        addFromText(extractElementText(th), 700)
      })

      const nav = document.querySelector('nav') || document.querySelector('header nav') || document.querySelector('[role="navigation"]')
      if (nav) {
        const navLinks = nav.querySelectorAll('a')
        Array.from(navLinks).slice(0, 40).forEach((link) => {
          addFromText(extractElementText(link), 600)
        })
      }

      const breadcrumb = document.querySelector('[aria-label*="breadcrumb" i], .breadcrumb, nav[aria-label*="breadcrumb" i], [itemtype*="BreadcrumbList"]')
      if (breadcrumb) {
        const breadcrumbLinks = breadcrumb.querySelectorAll('a, [itemprop="name"]')
        Array.from(breadcrumbLinks).forEach((link) => {
          addFromText(extractElementText(link), 580)
        })
      }

      const mainImages = document.querySelectorAll('main img, article img, [role="main"] img, .main img, .content img')
      Array.from(mainImages).slice(0, 10).forEach((img) => {
        const alt = img.alt || ''
        if (alt.trim()) addFromText(alt.trim(), 540)
      })

      const mainLinks = document.querySelectorAll('main a, article a, [role="main"] a, .main a, .content a')
      Array.from(mainLinks).slice(0, 20).forEach((link) => {
        addFromText(extractElementText(link), 560)
      })

      const footers = document.querySelectorAll('footer, [role="contentinfo"]')
      footers.forEach((footer) => {
        footer.querySelectorAll('a').forEach((link) => {
          addFromText(extractElementText(link), 250)
        })
        addFromText(extractElementText(footer), 220)
      })

      if (wordFrequency.size === 0 && document.body && document.body.innerText) {
        const bodyText = (document.body.innerText || '').trim()
        if (bodyText.length > 0) {
          addFromText(bodyText.slice(0, 5000), 100)
        }
      }

      if (wordFrequency.size === 0) return []

      const sortedEntries = Array.from(wordFrequency.entries())
        .sort((a, b) => {
          if (b[1] !== a[1]) return b[1] - a[1]
          return a[0].localeCompare(b[0])
        })

      // [REQ-SUGGESTED_TAGS_CASE_PRESERVATION] One row per lowercase key; no duplicate lowercase-only chip
      const sortedWords = sortedEntries.slice(0, 60).map(([lowerWord, frequency]) => {
        const originalCase = originalCaseMap.get(lowerWord) || lowerWord
        const rel = wordRelevance.get(lowerWord) || 0
        return { tag: originalCase, lowerTag: lowerWord, frequency, relevance: rel }
      })

      function sanitizeTag (word) {
        if (!word || typeof word !== 'string') return null
        const sanitized = word.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 50)
        return sanitized.length > 0 ? sanitized : null
      }

      const out = []
      const seenExact = new Set()

      for (const item of sortedWords) {
        const sanitized = sanitizeTag(item.tag)
        if (!sanitized) continue
        if (seenExact.has(sanitized)) continue
        seenExact.add(sanitized)
        const rel = wordRelevance.get(item.lowerTag) || item.relevance || 0
        out.push({
          tag: sanitized,
          relevance: rel,
          inPageFrequency: item.frequency
        })
        if (out.length >= 60) break
      }

      return out
    } catch (_err) {
      return []
    }
  }
})()
