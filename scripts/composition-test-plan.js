#!/usr/bin/env node
/**
 * [IMPL-COMPOSITION_TEST_PATTERNS] [ARCH-COMPOSITION_TEST_PATTERNS] [REQ-COMPOSITION_TEST_RECOGNITION] [REQ-MODULE_VALIDATION]
 * [PROC-TEST_STRATEGY] Composition test-plan report: discover Active IMPL composition edges,
 * match pattern IDs, classify edge status, emit reviewable plan for generated tests.
 *
 * Usage: node scripts/composition-test-plan.js [--json] [--out path]
 * Never silently classifies a binding as e2e_only — requires e2e_only_reason / platform note.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import yaml from 'js-yaml'
import {
  BINDING_SIGNAL_RE,
  TEMPLATE_PATH,
  matchCompositionPattern,
  classifyCompositionEdge,
  escapeMarkdownCell,
  suggestMissingPath
} from './composition-test-plan-core.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.join(__dirname, '..')
const IMPL_DIR = path.join(ROOT, 'tied', 'implementation-decisions')
const INTEGRATION_DIR = path.join(ROOT, 'tests', 'integration')

/**
 * @param {string} dir
 * @returns {string[]}
 */
function listIntegrationSuites (dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter((n) => n.endsWith('.integration.test.js'))
    .map((n) => path.join('tests/integration', n))
    .sort()
}

/**
 * @param {string} filePath
 * @param {string} token
 * @returns {object|null}
 */
function loadYamlDetail (filePath, token) {
  try {
    const raw = yaml.load(fs.readFileSync(filePath, 'utf8'))
    if (!raw || typeof raw !== 'object') return null
    if (raw[token] && typeof raw[token] === 'object') return raw[token]
    if (raw.status !== undefined || raw.related_decisions !== undefined) return raw
    const keys = Object.keys(raw)
    if (keys.length === 1 && keys[0].startsWith('IMPL-')) return raw[keys[0]]
    return raw
  } catch {
    return null
  }
}

/**
 * Resolve sidecar text. Paths are relative to tied/ (e.g. implementation-decisions/IMPL-FOO-pseudocode.md).
 * @param {string} _token
 * @param {object} detail
 * @returns {string}
 */
function loadSidecarText (_token, detail) {
  const rel = detail?.essence_pseudocode_path
  if (rel) {
    const abs = path.join(ROOT, 'tied', rel)
    if (fs.existsSync(abs)) return fs.readFileSync(abs, 'utf8')
  }
  if (typeof detail?.essence_pseudocode === 'string') return detail.essence_pseudocode
  return ''
}

/**
 * @param {string[]} suites
 * @param {string} text
 * @param {string[]} testPaths
 * @returns {string[]}
 */
function matchSuitesForEdge (suites, text, testPaths) {
  const tokens = (text.match(/IMPL-[A-Z0-9_]+/g) || []).map((t) => t.toLowerCase())
  const keywords = []
  for (const t of tokens) {
    const slug = t.replace(/^impl-/, '').replace(/_/g, '-').toLowerCase()
    keywords.push(slug)
  }
  if (/timeout/i.test(text)) keywords.push('timeout', 'message-timeout')
  if (/createPopup|scoped/i.test(text)) keywords.push('scoped', 'create-popup', 'side-panel')
  if (/suggested|addTag|chip/i.test(text)) keywords.push('suggested', 'tag-chip', 'notes')
  if (/openTagsTree|OPEN_SIDE_PANEL/i.test(text)) keywords.push('tags-tree', 'open-tags', 'library-search')
  if (/BookmarkRouter|StorageIndex/i.test(text)) keywords.push('router-storage', 'message-handler')
  if (/bulk.?delete|link.?health|api.?snapshot/i.test(text)) keywords.push('bulk-delete', 'link-health', 'api-snapshot', 'composition')
  if (/browser.?tabs|LAZY_INIT|switchTab/i.test(text)) keywords.push('browser-tabs')
  if (/onFocusChanged|onActivated|tab.?change/i.test(text)) keywords.push('window-focus', 'tab-change')
  if (/tag.?sort|ORDERED/i.test(text)) keywords.push('tag-sort')
  if (/native|snapshot-write/i.test(text)) keywords.push('snapshot-write', 'native')
  if (/config.?manager|ConfigManager/i.test(text)) keywords.push('config-manager')
  if (/refreshLinkHealthHint|CAPTURE_UI_LINK_HEALTH|linkHealthHint/i.test(text)) {
    keywords.push('popup-link-health', 'link-health-hint')
  }

  const fromTrace = (testPaths || [])
    .filter((p) => typeof p === 'string' && p.includes('.integration.test.js'))
  const matched = new Set(fromTrace)
  for (const suite of suites) {
    const base = path.basename(suite).toLowerCase()
    if (keywords.some((k) => k.length > 3 && base.includes(k))) matched.add(suite)
  }
  return [...matched].sort()
}

function parseArgs (argv) {
  const out = { json: false, outPath: null }
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--json') out.json = true
    if (argv[i] === '--out' && argv[i + 1]) {
      out.outPath = argv[++i]
    }
  }
  return out
}

/**
 * Build composition-plan rows from Active IMPL details + integration suites.
 * @returns {{ rows: object[], counts: Record<string, number>, suites: string[] }}
 */
function buildCompositionPlan () {
  const suites = listIntegrationSuites(INTEGRATION_DIR)
  /** @type {object[]} */
  const rows = []

  const files = fs.readdirSync(IMPL_DIR).filter((n) => n.endsWith('.yaml'))
  for (const name of files) {
    const filePath = path.join(IMPL_DIR, name)
    const token = name.replace(/\.yaml$/, '')
    const detail = loadYamlDetail(filePath, token)
    if (!detail || detail.status !== 'Active') continue
    const composed = detail?.related_decisions?.composed_with || []
    const sidecar = loadSidecarText(token, detail)
    const bodyText = [
      token,
      sidecar,
      typeof detail.essence_pseudocode === 'string' ? detail.essence_pseudocode : '',
      JSON.stringify(detail.implementation_approach || {}),
      JSON.stringify(detail.code_locations || {})
    ].join('\n')
    const hasBindingSignal = BINDING_SIGNAL_RE.test(bodyText) || composed.length > 0
    if (!hasBindingSignal && composed.length === 0) continue

    // Only explicit e2e_only_reason may justify e2e_only (never scan prose notes for "platform").
    const e2eReason = typeof detail.e2e_only_reason === 'string' && detail.e2e_only_reason.trim()
      ? detail.e2e_only_reason.trim()
      : null
    const tests = detail?.traceability?.tests || []
    const unitTests = tests.filter((t) => typeof t === 'string' && t.includes('/unit/'))
    const peers = composed.length > 0 ? composed : ['(self-binding-signals)']

    for (const peer of peers) {
      const edgeText = `${bodyText}\n${peer}`
      const matchedSuites = matchSuitesForEdge(suites, edgeText, tests)
      const pattern = matchCompositionPattern({ text: edgeText, suites: matchedSuites })
      const classification = classifyCompositionEdge({
        matchedSuites,
        unitTests,
        e2eReason,
        hasBindingSignal
      })
      if (classification.status === 'e2e_only' && !e2eReason) {
        classification.status = unitTests.length ? 'unit-only' : 'candidate'
        classification.evidence = `${classification.evidence} (refused silent e2e_only; set e2e_only_reason)`
      }

      const trigger = (() => {
        if (pattern === 'MESSAGE_DISPATCH') return 'runtime.onMessage / processMessage'
        if (pattern === 'UI_EMIT_COMMAND') return 'UIManager.emit / on'
        if (pattern === 'ORCHESTRATOR_STATUS') return 'orchestrator run*()'
        if (pattern === 'ROUTER_STORAGE') return 'save/delete/move via handler'
        if (pattern === 'LAZY_INIT_GUARD') return 'switchTab / runInitialTabInit'
        if (pattern === 'EVENT_REFRESH_GUARD') return 'tabs.onActivated / windows.onFocusChanged'
        if (pattern === 'ORDERED_ASYNC_HANDOFF') return 'ordered async handoff'
        if (pattern === 'NATIVE_ADAPTER_CALLBACK') return 'native/file callback'
        if (pattern === 'SCOPED_DOM_BINDING') return 'createPopup({ container })'
        return 'binding signal / composed_with'
      })()

      rows.push({
        pattern_id: pattern,
        source_impl: token,
        target_impl: peer,
        trigger,
        expected_args: 'see IMPL block INPUT / message data',
        expected_effect: 'see IMPL block OUTPUT / POST',
        status: classification.status,
        evidence: classification.evidence,
        existing_test_path: matchedSuites[0] || '',
        missing_test_path: classification.status === 'covered' || classification.status === 'e2e_only'
          ? ''
          : suggestMissingPath(token, peer.startsWith('IMPL-') ? peer : 'BINDING', pattern),
        e2e_justification: classification.status === 'e2e_only' ? (detail.e2e_only_reason || '') : '',
        unit_tests: unitTests.slice(0, 5)
      })
    }
  }

  rows.sort((a, b) => {
    const order = { candidate: 0, 'unit-only': 1, partial: 2, covered: 3, e2e_only: 4 }
    return (order[a.status] ?? 9) - (order[b.status] ?? 9) ||
      a.pattern_id.localeCompare(b.pattern_id) ||
      a.source_impl.localeCompare(b.source_impl)
  })

  const counts = rows.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1
    return acc
  }, /** @type {Record<string, number>} */ ({}))

  return { rows, counts, suites }
}

/**
 * Format plan as markdown or JSON string.
 * @param {{ rows: object[], counts: Record<string, number>, suites: string[] }} plan
 * @param {{ json?: boolean }} [opts]
 * @returns {string}
 */
function formatCompositionPlan (plan, opts = {}) {
  const { rows, counts, suites } = plan
  if (opts.json) {
    return JSON.stringify({ generated_at: new Date().toISOString(), counts, rows, template: TEMPLATE_PATH }, null, 2)
  }
  const lines = []
  lines.push('# Composition test plan')
  lines.push('')
  lines.push(`[IMPL-COMPOSITION_TEST_PATTERNS] [REQ-COMPOSITION_TEST_RECOGNITION] Generated ${new Date().toISOString()}`)
  lines.push('')
  lines.push('## Counts')
  lines.push('')
  lines.push('| Status | Count |')
  lines.push('|--------|------:|')
  for (const k of ['candidate', 'unit-only', 'partial', 'covered', 'e2e_only']) {
    lines.push(`| ${k} | ${counts[k] || 0} |`)
  }
  lines.push('')
  lines.push('## Guidance (unit-first RED)')
  lines.push('')
  lines.push('1. Validate IMPL pseudo-code for the edge.')
  lines.push('2. RED unit test for each algorithm/PROCEDURE on the path; GREEN minimal code.')
  lines.push('3. RED composition test asserting trigger → receiving unit → args → effect (no UI).')
  lines.push('4. GREEN minimal wiring. E2E only with named platform constraint (`e2e_only_reason`).')
  lines.push(`5. Template: \`${TEMPLATE_PATH}\``)
  lines.push('')
  lines.push('## Edges')
  lines.push('')
  lines.push('| Status | Pattern | Source | Target | Trigger | Existing suite | Missing suite / e2e reason |')
  lines.push('|--------|---------|--------|--------|---------|----------------|----------------------------|')
  for (const r of rows) {
    const miss = r.status === 'e2e_only'
      ? (r.e2e_justification || 'e2e_only')
      : (r.missing_test_path || '—')
    lines.push(
      `| ${escapeMarkdownCell(r.status)} | ${escapeMarkdownCell(r.pattern_id)} | ` +
      `${escapeMarkdownCell(r.source_impl)} | ${escapeMarkdownCell(r.target_impl)} | ` +
      `${escapeMarkdownCell(r.trigger)} | ${escapeMarkdownCell(r.existing_test_path || '—')} | ` +
      `${escapeMarkdownCell(miss)} |`
    )
  }
  lines.push('')
  lines.push(`Integration suites scanned: ${suites.length}`)
  return lines.join('\n')
}

function main (argv = process.argv) {
  const args = parseArgs(argv)
  const plan = buildCompositionPlan()
  const output = formatCompositionPlan(plan, { json: args.json })
  if (args.outPath) {
    fs.writeFileSync(path.resolve(ROOT, args.outPath), output, 'utf8')
    console.error(`Wrote ${args.outPath}`)
  }
  process.stdout.write(output + (output.endsWith('\n') ? '' : '\n'))
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === __filename
if (isDirectRun) {
  main()
}

export {
  buildCompositionPlan,
  formatCompositionPlan,
  parseArgs,
  main,
  loadSidecarText,
  loadYamlDetail,
  matchSuitesForEdge
}
