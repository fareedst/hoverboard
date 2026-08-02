/**
 * [IMPL-SIDE_PANEL_BUNDLE] [ARCH-SIDE_PANEL_BUNDLE] [REQ-SIDE_PANEL_BUNDLE_SIZE]
 * [IMPL-SIDE_PANEL_BUNDLE] [ARCH-SIDE_PANEL_BUNDLE] [REQ-SIDE_PANEL_BUNDLE_SIZE] How: Central esbuild runner applies --minify when NODE_ENV=production; all five manifest entry points use the same helper so dev builds stay readable.
 *
 * CLI wrapper for esbuild-bundle-core.js
 */
import { buildExtensionEntry } from './esbuild-bundle-core.js'

function main () {
  const entryKey = process.argv[2]
  if (!entryKey) {
    console.error('Usage: node scripts/esbuild-bundle.js <sw|popup|options|content|side-panel>')
    process.exit(1)
  }
  const result = buildExtensionEntry(entryKey)
  const mode = result.minify ? 'minified' : 'unminified'
  console.log(`Built ${result.entryKey} (${mode}) → ${result.outfile}`)
}

main()
