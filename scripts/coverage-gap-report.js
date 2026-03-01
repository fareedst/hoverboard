#!/usr/bin/env node
/**
 * [IMPL-TESTING] [PROC-TEST_STRATEGY] Coverage gap report: list src/ files below coverage threshold
 * and IMPLs with empty traceability.tests. Surface in MRs or docs to minimize untested code.
 * Run after: npm run test:coverage
 * Usage: node scripts/coverage-gap-report.js [threshold-percent]; default 0
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const COVERAGE_SUMMARY = path.join(ROOT, 'coverage', 'coverage-summary.json')
const IMPL_DIR = path.join(ROOT, 'tied', 'implementation-decisions')
const THRESHOLD = Math.max(0, parseInt(process.argv[2] || '0', 10))

function main () {
  console.log('# Coverage gap report (Chrome extension src/ only)\n')
  console.log(`Threshold: ${THRESHOLD}% (line coverage). Run \`npm run test:coverage\` first.\n`)

  // 1. Source files below threshold
  let summary
  try {
    summary = JSON.parse(fs.readFileSync(COVERAGE_SUMMARY, 'utf8'))
  } catch (err) {
    console.error('Missing or invalid coverage/coverage-summary.json. Run: npm run test:coverage')
    process.exit(1)
  }

  const low = []
  for (const [file, data] of Object.entries(summary)) {
    if (!file || file === 'total') continue
    if (!file.startsWith('src/') || file.includes('node_modules')) continue
    const pct = data?.lines?.pct
    if (typeof pct !== 'number' || pct <= THRESHOLD) {
      low.push({ file, pct: pct ?? 0 })
    }
  }
  low.sort((a, b) => a.pct - b.pct)

  console.log('## Source files at or below threshold\n')
  if (low.length === 0) {
    console.log('None.\n')
  } else {
    console.log('| File | Line coverage % |')
    console.log('|------|-----------------|')
    for (const { file, pct } of low) {
      console.log(`| ${file} | ${pct.toFixed(1)} |`)
    }
    console.log('')
  }

  // 2. IMPLs with empty traceability.tests
  const implsWithEmptyTests = []
  if (fs.existsSync(IMPL_DIR)) {
    for (const name of fs.readdirSync(IMPL_DIR)) {
      if (!name.endsWith('.yaml')) continue
      const filePath = path.join(IMPL_DIR, name)
      const content = fs.readFileSync(filePath, 'utf8')
      // IMPL detail schema: traceability.tests may be [] (empty)
      if (/^\s*tests:\s*\[\]\s*$/m.test(content)) {
        const implToken = name.replace('.yaml', '')
        implsWithEmptyTests.push(implToken)
      }
    }
  }
  implsWithEmptyTests.sort()

  console.log('## IMPLs with empty traceability.tests\n')
  if (implsWithEmptyTests.length === 0) {
    console.log('None.\n')
  } else {
    console.log('| IMPL token |')
    console.log('|------------|')
    for (const token of implsWithEmptyTests) {
      console.log(`| ${token} |`)
    }
    console.log('')
  }

  console.log('---')
  console.log('Add unit or integration tests for the above, or document "E2E only" in the IMPL detail.')
}

main()
