/**
 * [IMPL-COMPOSITION_TEST_PATTERNS] [ARCH-COMPOSITION_TEST_PATTERNS] [REQ-COMPOSITION_TEST_RECOGNITION]
 * Pure MATCH / CLASSIFY / report helpers (no import.meta; unit-testable under Jest).
 */

/** Prefer explicit binding verbs; bare AWAIT alone is too common in algorithm prose. */
export const BINDING_SIGNAL_RE = /(^\s*-\s*\d*\.?\s*(ON|WHEN|REGISTER)\b|\b(emit\(|sendMessage|addListener|onMessage|createPopup|switchTabForTest|bindTabChange|bindWindowFocus|sendNativeMessage|sendToTab)\b)/im

/** @type {{ id: string, hints: RegExp[] }[]} */
export const PATTERN_RULES = [
  {
    id: 'MESSAGE_DISPATCH',
    hints: [/onMessage|processMessage|MESSAGE_TYPES|sendResponse|message-handler|link-health\.integration|local-query-api-snapshot\.integration/i]
  },
  {
    id: 'UI_EMIT_COMMAND',
    hints: [/UIManager\.emit|\.emit\(|uiManager\.on|library-search-entry|bookmark-notes-ui|openTagsTree|handleLibrarySearch/i]
  },
  {
    id: 'ORCHESTRATOR_STATUS',
    hints: [/runBulkDelete|runCheckLinkHealth|runRefreshApiSnapshot|onResults|status DOM|bulk-delete-composition|link-health-composition|api-snapshot-composition/i]
  },
  {
    id: 'ROUTER_STORAGE',
    hints: [/BookmarkRouter|StorageIndex|preferredBackend|message-handler-router-storage|move-bookmark-preferred/i]
  },
  {
    id: 'LAZY_INIT_GUARD',
    hints: [/one-shot|TabInited|switchTabForTest|runInitialTabInit|browser-tabs-tab-composition|initBrowserTabsTab/i]
  },
  {
    id: 'EVENT_REFRESH_GUARD',
    hints: [/onActivated|onFocusChanged|bindTabChange|bindWindowFocus|tab-change-injection|window-focus-recent-tags/i]
  },
  {
    id: 'ORDERED_ASYNC_HANDOFF',
    hints: [/AWAIT .+ before|ordered|loadInitialData|this-page-tag-sort-composition|refreshTagFrequencyMap/i]
  },
  {
    id: 'NATIVE_ADAPTER_CALLBACK',
    hints: [/sendNativeMessage|native.?host|file adapter|local-query-api-snapshot-write/i]
  },
  {
    id: 'SCOPED_DOM_BINDING',
    hints: [/createPopup|data-popup-ref|scoped root|UIManager_SCOPED|scoped-root|bookmarkPanel/i]
  }
]

export const TEMPLATE_PATH = 'tests/integration/_templates/composition-test.template.js'

/**
 * Escape Markdown table cell content (pipes and newlines break GFM tables).
 * @param {string} value
 * @returns {string}
 */
export function escapeMarkdownCell (value) {
  return String(value ?? '')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, ' ')
}

/**
 * MATCH_COMPOSITION_PATTERN
 * @param {{ text: string, suites: string[] }} input
 * @returns {string}
 */
export function matchCompositionPattern (input) {
  const hay = `${input.text}\n${input.suites.join('\n')}`
  for (const rule of PATTERN_RULES) {
    if (rule.hints.some((re) => re.test(hay))) return rule.id
  }
  return 'UNKNOWN'
}

/**
 * CLASSIFY_COMPOSITION_EDGE
 * @param {{ matchedSuites: string[], unitTests: string[], e2eReason: string|null, hasBindingSignal: boolean }} input
 */
export function classifyCompositionEdge (input) {
  if (input.e2eReason && /platform|safari|web store|native os|chrome-extension:\/\//i.test(input.e2eReason)) {
    return { status: 'e2e_only', evidence: input.e2eReason }
  }
  if (input.matchedSuites.length > 0) {
    const compositionNamed = input.matchedSuites.some((s) => /composition|router-storage|message-handler|library-search|bookmark-notes|link-health\.integration|local-query|browser-tabs-tab|window-focus|tab-change|config-manager-load|move-bookmark|popup-link-health/i.test(s))
    if (compositionNamed) {
      return { status: 'covered', evidence: input.matchedSuites.join(', ') }
    }
    return { status: 'partial', evidence: input.matchedSuites.join(', ') }
  }
  if ((input.unitTests || []).length > 0) {
    return { status: 'unit-only', evidence: input.unitTests.slice(0, 3).join(', ') }
  }
  if (input.hasBindingSignal) {
    return { status: 'candidate', evidence: 'binding signal without composition suite' }
  }
  return { status: 'candidate', evidence: 'composed_with without matched suite' }
}

/**
 * @param {string} source
 * @param {string} target
 * @param {string} pattern
 */
export function suggestMissingPath (source, target, pattern) {
  const slug = `${source.replace(/^IMPL-/, '').toLowerCase().replace(/_/g, '-')}` +
    `-x-${target.replace(/^IMPL-/, '').toLowerCase().replace(/_/g, '-')}`
  const patternSlug = pattern === 'UNKNOWN' ? 'binding' : pattern.toLowerCase().replace(/_/g, '-')
  return `tests/integration/${slug}-${patternSlug}-composition.integration.test.js`
}
