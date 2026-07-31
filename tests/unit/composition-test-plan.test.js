/**
 * [IMPL-COMPOSITION_TEST_PATTERNS] [ARCH-COMPOSITION_TEST_PATTERNS] [REQ-COMPOSITION_TEST_RECOGNITION]
 * Unit: MATCH_COMPOSITION_PATTERN / CLASSIFY_COMPOSITION_EDGE / markdown escape.
 * No Playwright — plan script is a discovery tool, not a UI surface.
 */

import {
  matchCompositionPattern,
  classifyCompositionEdge,
  escapeMarkdownCell,
  suggestMissingPath
} from '../../scripts/composition-test-plan-core.js'

describe('[IMPL-COMPOSITION_TEST_PATTERNS] MATCH_COMPOSITION_PATTERN', () => {
  test('maps onMessage / processMessage to MESSAGE_DISPATCH', () => {
    expect(matchCompositionPattern({
      text: 'REGISTER runtime.onMessage; processMessage',
      suites: []
    })).toBe('MESSAGE_DISPATCH')
  })

  test('maps createPopup / data-popup-ref to SCOPED_DOM_BINDING', () => {
    expect(matchCompositionPattern({
      text: 'createPopup({ container }) with data-popup-ref',
      suites: []
    })).toBe('SCOPED_DOM_BINDING')
  })

  test('maps UIManager.emit to UI_EMIT_COMMAND', () => {
    expect(matchCompositionPattern({
      text: 'UIManager.emit("openTagsTree"); sendMessage OPEN_SIDE_PANEL',
      suites: ['tests/integration/popup-open-tags-tree-composition.integration.test.js']
    })).toBe('UI_EMIT_COMMAND')
  })

  test('returns UNKNOWN when no hints match', () => {
    expect(matchCompositionPattern({
      text: 'pure classifyHttpStatus algorithm',
      suites: []
    })).toBe('UNKNOWN')
  })
})

describe('[IMPL-COMPOSITION_TEST_PATTERNS] CLASSIFY_COMPOSITION_EDGE', () => {
  test('covered when composition suite matched', () => {
    const result = classifyCompositionEdge({
      matchedSuites: ['tests/integration/popup-link-health-hint-composition.integration.test.js'],
      unitTests: ['tests/unit/link-health.test.js'],
      e2eReason: null,
      hasBindingSignal: true
    })
    expect(result.status).toBe('covered')
  })

  test('unit-only when only unit tests exist', () => {
    const result = classifyCompositionEdge({
      matchedSuites: [],
      unitTests: ['tests/unit/foo.test.js'],
      e2eReason: null,
      hasBindingSignal: true
    })
    expect(result.status).toBe('unit-only')
    expect(result.evidence).toContain('tests/unit/foo.test.js')
  })

  test('candidate when binding signal without suites', () => {
    const result = classifyCompositionEdge({
      matchedSuites: [],
      unitTests: [],
      e2eReason: null,
      hasBindingSignal: true
    })
    expect(result.status).toBe('candidate')
  })

  test('e2e_only only with named platform constraint reason', () => {
    const result = classifyCompositionEdge({
      matchedSuites: [],
      unitTests: [],
      e2eReason: 'Safari App Extension packaging / platform host',
      hasBindingSignal: true
    })
    expect(result.status).toBe('e2e_only')
  })

  test('matched composition suite wins over unit tests (no silent e2e from prose)', () => {
    const result = classifyCompositionEdge({
      matchedSuites: [
        'tests/integration/message-response-missing-composition.integration.test.js'
      ],
      unitTests: ['tests/unit/composition-test-plan.test.js'],
      e2eReason: null,
      hasBindingSignal: true
    })
    expect(result.status).toBe('covered')
  })
})

describe('[IMPL-COMPOSITION_TEST_PATTERNS] report helpers', () => {
  test('escapeMarkdownCell escapes pipes and newlines', () => {
    expect(escapeMarkdownCell('a|b\nc')).toBe('a\\|b c')
  })

  test('suggestMissingPath builds composition suite path', () => {
    expect(suggestMissingPath('IMPL-LINK_HEALTH', 'IMPL-MESSAGE_HANDLING', 'MESSAGE_DISPATCH'))
      .toBe('tests/integration/link-health-x-message-handling-message-dispatch-composition.integration.test.js')
  })
})
