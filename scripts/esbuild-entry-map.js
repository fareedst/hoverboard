/**
 * [IMPL-SIDE_PANEL_BUNDLE] [ARCH-SIDE_PANEL_BUNDLE] [REQ-SIDE_PANEL_BUNDLE_SIZE]
 * [IMPL-SIDE_PANEL_BUNDLE] [ARCH-SIDE_PANEL_BUNDLE] [REQ-SIDE_PANEL_BUNDLE_SIZE] How: Central esbuild runner applies --minify when NODE_ENV=production; all five manifest entry points use the same helper so dev builds stay readable.
 *
 * Entry point map only (no esbuild import; safe under Jest jsdom).
 */

/** @type {Record<string, { in: string, out: string, format: 'esm' | 'iife' }>} */
export const ENTRY_MAP = {
  sw: {
    in: 'src/core/service-worker.js',
    out: 'dist/src/core/service-worker.js',
    format: 'esm'
  },
  options: {
    in: 'src/ui/options/options.js',
    out: 'dist/src/ui/options/options.js',
    format: 'esm'
  },
  content: {
    in: 'src/features/content/content-main.js',
    out: 'dist/src/features/content/content-main.js',
    format: 'iife'
  },
  popup: {
    in: 'src/ui/popup/popup.js',
    out: 'dist/src/ui/popup/popup.js',
    format: 'esm'
  },
  'side-panel': {
    in: 'src/ui/side-panel/side-panel.js',
    out: 'dist/src/ui/side-panel/side-panel.js',
    format: 'esm'
  }
}
