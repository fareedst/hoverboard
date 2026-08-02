/**
 * [IMPL-SIDE_PANEL_BUNDLE] [ARCH-SIDE_PANEL_BUNDLE] [REQ-SIDE_PANEL_BUNDLE_SIZE]
 * [IMPL-SIDE_PANEL_BUNDLE] [ARCH-SIDE_PANEL_BUNDLE] [REQ-SIDE_PANEL_BUNDLE_SIZE] How: Central esbuild runner applies --minify when NODE_ENV=production; all five manifest entry points use the same helper so dev builds stay readable.
 *
 * Pure esbuild entry map and builder (no import.meta; unit-testable under Jest).
 */
import { buildSync } from 'esbuild'
import path from 'path'
import { isProductionBuild } from './is-production-build.js'
import { ENTRY_MAP } from './esbuild-entry-map.js'

export { ENTRY_MAP } from './esbuild-entry-map.js'

/**
 * @param {string} entryKey
 * @param {{ minify?: boolean, root?: string }} [options]
 */
export function buildExtensionEntry (entryKey, options = {}) {
  const opts = ENTRY_MAP[entryKey]
  if (!opts) {
    throw new Error(`Unknown esbuild entry: ${entryKey}`)
  }
  const root = options.root ?? process.cwd()
  const minify = options.minify ?? isProductionBuild()
  buildSync({
    entryPoints: [path.join(root, opts.in)],
    outfile: path.join(root, opts.out),
    bundle: true,
    minify,
    format: opts.format,
    platform: 'browser'
  })
  return { entryKey, minify, outfile: opts.out }
}
