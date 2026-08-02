/**
 * [IMPL-SIDE_PANEL_BUNDLE] [ARCH-SIDE_PANEL_BUNDLE] [REQ-SIDE_PANEL_BUNDLE_SIZE]
 * [IMPL-SIDE_PANEL_BUNDLE] [ARCH-SIDE_PANEL_BUNDLE] [REQ-SIDE_PANEL_BUNDLE_SIZE] How: Dev/CI script runs esbuild with --metafile to temp output; reports unminified, minified, gzip sizes and top-N contributors; metafile never copied to dist/.
 *
 * CLI wrapper for analyze-side-panel-bundle-core.js
 */
import { analyzeSidePanelBundle } from './analyze-side-panel-bundle-core.js'

function main () {
  const report = analyzeSidePanelBundle()
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(report, null, 2))
    return
  }
  console.log('Side panel bundle analysis')
  console.log(`  unminified: ${report.bytes_unminified} B`)
  console.log(`  minified:   ${report.bytes_minified} B`)
  console.log(`  gzip:       ${report.bytes_gzip} B`)
  console.log('Top contributors (unminified metafile):')
  for (const row of report.top_contributors) {
    console.log(`  ${row.bytes}\t${row.path}`)
  }
}

main()
