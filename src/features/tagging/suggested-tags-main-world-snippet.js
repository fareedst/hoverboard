/**
 * [REQ-SUGGESTED_TAGS_FROM_CONTENT] [REQ-THIS_PAGE_TAG_SORT] [ARCH-THIS_PAGE_TAG_SORT] [IMPL-THIS_PAGE_TAG_SORT]
 * Injected into page MAIN world via chrome.scripting.executeScript({ files: [...] }).
 * Defines globalThis.__hoverboardExtractSuggestedTagsWithRelevance → Array<{ tag, relevance, inPageFrequency }>.
 * No imports; must stay plain script for MV3 executeScript files.
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-SUGGESTED_TAGS ===
 * [IMPL-SUGGESTED_TAGS] [ARCH-SUGGESTED_TAGS] [REQ-SUGGESTED_TAGS_FROM_CONTENT] [REQ-SUGGESTED_TAGS_DEDUPLICATION] [REQ-SUGGESTED_TAGS_CASE_PRESERVATION] — Summary: Suggested tags from page — overlay TagService.extractSuggestedTagsFromContent; Chromium popup via MAIN-world snippet global and IMPL-THIS_PAGE_TAG_SORT loadSuggestedTags (inject, normalize, filter, UIManager handoff).
 *
 * ## EXTRACT_SUGGESTED_TAGS
 *
 * - [IMPL-SUGGESTED_TAGS] [IMPL-THIS_PAGE_TAG_SORT] [ARCH-SUGGESTED_TAGS] [ARCH-THIS_PAGE_TAG_SORT] [REQ-SUGGESTED_TAGS_FROM_CONTENT] [REQ-SUGGESTED_TAGS_DEDUPLICATION] [REQ-SUGGESTED_TAGS_CASE_PRESERVATION] [REQ-THIS_PAGE_TAG_SORT] How: How — cross-IMPL: Popup path depends on IMPL-THIS_PAGE_TAG_SORT loadSuggestedTags; ordering invariant — executeScript file (snippet) then func (global extractor); shared data — raw array from page world; post — NORMALIZE_SUGGESTED_ROWS then filters then updateSuggestedTags(rows); on error or non-http(s) — updateSuggestedTags([]). How — composed_with IMPL-SELECTION_TO_TAG_INPUT: pre — suggested chips rendered in UIManager; post — selection/tag-input add flows attach to chip DOM per IMPL-SELECTION_TO_TAG_INPUT (shared surface only; no ordering constraint on extraction).
 * - Contract:
 *   - INPUT: active page document (implicit)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: array of { tag: string, relevance: number, inPageFrequency: number }; tag sanitized by snippet inline rules; canonical case per pickBetterSuggestedOriginalCase rank
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: noise set; delimiter regex MUST match TagService tokenization (ARCH-SUGGESTED_TAGS tokenizer sync)
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: State
 *   - TERMINATION: total
 * - PROCEDURE: EXTRACT_SUGGESTED_TAGS
 *   - IF document invalid THEN RETURN []
 *   - TRY:
 *   - allTexts = GATHER_SOURCES(document, url)
 *   - IF allTexts empty THEN RETURN []
 *   - words = TOKENIZE(join allTexts) using shared delimiter regex
 *   - FOR each token: increment wordFrequency(lower); update originalCaseMap with pickBetterSuggestedOriginalCase
 *   - sortedEntries = SORT wordFrequency by count desc then key asc
 *   - sortedWords = PLUCK canonical string per key from originalCaseMap
 *   - How (sub-block): # [IMPL-SUGGESTED_TAGS] [IMPL-TAG_SYSTEM] [ARCH-TAG_SYSTEM] [REQ-TAG_INPUT_SANITIZATION]
 *   - How (sub-block): # How — map each candidate through TagService.sanitizeTag (overlay path delegates to IMPL-TAG_SYSTEM).
 *   - sanitized = MAP each sortedWord through SANITIZE_OVERLAY (= TagService.sanitizeTag)
 *   - unique = DEDUPE exact adjacent duplicates preserving order
 *   - RETURN slice(unique, 0, limit)
 *   - CATCH:
 *   - RETURN []
 *   - How (sub-block): How — Cross-path note (S06.3): overlay sanitizeTag vs snippet inline sanitizer may differ on edge characters; tokenizer must remain identical. See ARCH-SUGGESTED_TAGS.
 *
 * === END IMPL-FULL-BLOCK: IMPL-SUGGESTED_TAGS ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-THIS_PAGE_TAG_SORT ===
 * [IMPL-THIS_PAGE_TAG_SORT] [ARCH-THIS_PAGE_TAG_SORT] [REQ-THIS_PAGE_TAG_SORT] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [REQ-SUGGESTED_TAGS_FROM_CONTENT] — Summary: Three-way chip sort when tagSortToggle present; frequency map from storage; popup suggested rows from two-step MAIN inject; uses tag-chip-sort.sortTagChipRows.
 *
 * ## REFRESH_TAG_FREQUENCY_MAP_FOR_SORT
 *
 * - [IMPL-THIS_PAGE_TAG_SORT] [IMPL-UIManager_SCOPED_ROOT] [ARCH-SIDE_PANEL_TABS] [ARCH-THIS_PAGE_TAG_SORT] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [REQ-THIS_PAGE_TAG_SORT] How: How — cross-IMPL depends on IMPL-UIManager_SCOPED_ROOT: tagSortToggle and chip containers resolve under scoped container in side panel; pre — UIManager constructed with container=bookmarkPanel and cacheElements completed; post — non-null elements.tagSortToggle enables sort UI; shared data — this.elements from IMPL-UIManager_SCOPED_ROOT. How — cross-IMPL depends on IMPL-SUGGESTED_TAGS MAIN-world path: snippet registers global; ordering — loadSuggestedTags runs file inject then func inject before NORMALIZE; shared data — raw extraction array; post — filtered rows passed to UIManager.updateSuggestedTags. How — NORMALIZE_SUGGESTED_ROWS + FILTER_INVALID_ROWS: PopupController maps MAIN extract to rows; trim string/object tags; omit entries empty after trim; then FILTER_NOT_ON_CURRENT_BOOKMARK. How — FILTER_NOT_ON_CURRENT_BOOKMARK(rows, currentTagsNormalizedLower): drop row where lower(row.tag) in set.
 * - Contract:
 *   - INPUT: raw (array of strings and/or objects from page world)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: array of { tag: string, relevance: number, inPageFrequency: number } | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: tagFrequencyMap (tag string -> count from hoverboard_tag_frequency); suggested rows { tag, relevance?, inPageFrequency? } after normalize
 *   - EFFECTS: Async, IO
 *   - TERMINATION: total
 * - PROCEDURE: REFRESH_TAG_FREQUENCY_MAP_FOR_SORT
 *   - IF NOT chrome.storage.local THEN RETURN
 *   - TRY:
 *   - AWAIT get hoverboard_tag_frequency
 *   - map = _normalizeHoverboardTagFrequencyMap(raw)
 *   - uiManager.setTagFrequencyMapForSort(map)
 *   - CATCH:
 *   - debugError; RETURN
 *   - How (sub-block): How — loadSuggestedTags (invokes IMPL-SUGGESTED_TAGS page-world contract; ordering explicit).
 *
 * ## LOAD_SUGGESTED_TAGS
 *
 * - [IMPL-THIS_PAGE_TAG_SORT] [ARCH-THIS_PAGE_TAG_SORT] [REQ-THIS_PAGE_TAG_SORT] [REQ-SIDE_PANEL_POPUP_EQUIVALENT] [REQ-SUGGESTED_TAGS_FROM_CONTENT] How: Implements loadSuggestedTags() behavior for IMPL-THIS_PAGE_TAG_SORT.
 * - Contract:
 *   - INPUT: context / caller args
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: result | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - EFFECTS: Async, Http, IO, State
 *   - TERMINATION: total
 * - PROCEDURE: LOAD_SUGGESTED_TAGS
 *   - IF no tab id OR url not http(s) THEN updateSuggestedTags([]); RETURN
 *   - TRY:
 *   - TRY executeScript MAIN files [suggested-tags-main-world-snippet.js]; ON fileErr log non-fatal CONTINUE
 *   - AWAIT executeScript MAIN func -> globalThis.__hoverboardExtractSuggestedTagsWithRelevance()
 *   - rows = NORMALIZE_SUGGESTED_ROWS(result)
 *   - rows = FILTER_INVALID_ROWS(rows)
 *   - rows = FILTER_NOT_ON_CURRENT_BOOKMARK(rows, currentPinTagsLowerSet)
 *   - updateSuggestedTags(rows)
 *   - CATCH scriptError:
 *   - debugError; updateSuggestedTags([])
 *   - How (sub-block): How — setTagFrequencyMapForSort: merge into tagFrequencyMap; caller redraws.
 *   - How (sub-block): How — getEffectiveTagSortMode: IF no tagSortToggle element THEN RETURN null; ELSE RETURN mode from segment state.
 *   - How (sub-block): How — updateCurrentTags / updateRecentTags / _paintSuggestedTags: IF getEffectiveTagSortMode() null THEN paint source order; ELSE build rows with displayKey=tagChipDisplayAndAddValue, bookmarkFreq, suggested relevance; sortTagChipRows(mode); paint.
 *   - How (sub-block): How — Comparators (tag-chip-sort): alphabetical by displayKey localeCompare lower tie stableIndex; frequency by bookmarkFreq desc; relevance by relevance desc then bookmarkFreq then inPageFrequency.
 *   - How (sub-block): How — loadInitialData: AWAIT refreshTagFrequencyMapForSort before first updateCurrentTags; AWAIT loadRecentTags before AWAIT loadSuggestedTags (PopupController orchestration binding).
 *   - How (sub-block): How — setupEventListeners: click [data-sort-mode] under tagSortToggle -> setTagSortMode if isTagChipSortMode.
 *
 * ## SIDE_PANEL_TAG_SORT_TOOLBAR_E2E
 *
 * - [IMPL-THIS_PAGE_TAG_SORT] [IMPL-PLAYWRIGHT_E2E_EXTENSION] [ARCH-THIS_PAGE_TAG_SORT] [REQ-THIS_PAGE_TAG_SORT] How: How — E2E-only surface (phase_h_e2e_only_surface): Playwright chrome-extension:// side panel; complements JSDOM composition tests.
 * - Contract:
 *   - INPUT: context / caller args
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: result
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - EFFECTS: pure
 *   - TERMINATION: total
 * - PROCEDURE: SIDE_PANEL_TAG_SORT_TOOLBAR_E2E
 *   - PRE: open side-panel.html; bookmarkPanel visible
 *   - ASSERT tagSortToggle visible
 *   - ON click frequency segment: aria-pressed matches selection
 *
 * === END IMPL-FULL-BLOCK: IMPL-THIS_PAGE_TAG_SORT ===
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
