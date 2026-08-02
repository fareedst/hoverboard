/**
 * [IMPL-SIDE_PANEL_BUNDLE] [ARCH-SIDE_PANEL_BUNDLE] [REQ-SIDE_PANEL_BUNDLE_SIZE]
 * [IMPL-SIDE_PANEL_BUNDLE] [ARCH-SIDE_PANEL_BUNDLE] [REQ-SIDE_PANEL_BUNDLE_SIZE] How: Dev/CI script runs esbuild with --metafile to temp output; reports unminified, minified, gzip sizes and top-N contributors; metafile never copied to dist/.
 *
 * Pure analyze helpers (no import.meta; unit-testable under Jest).
 */
import fs from 'fs'
import os from 'os'
import path from 'path'
import zlib from 'zlib'
import { buildSync } from 'esbuild'

export const SIDE_PANEL_ENTRY = 'src/ui/side-panel/side-panel.js'

/**
 * @param {string} filePath
 * @returns {number}
 */
export function measureFileBytes (filePath) {
  return fs.statSync(filePath).size
}

/**
 * @param {string} filePath
 * @returns {number}
 */
export function measureGzipBytes (filePath) {
  const data = fs.readFileSync(filePath)
  return zlib.gzipSync(data).length
}

/**
 * @param {Record<string, { bytes: number }>} inputs
 * @param {number} [limit]
 */
export function topContributors (inputs, limit = 15) {
  return Object.entries(inputs)
    .map(([filePath, meta]) => ({ path: filePath, bytes: meta.bytes }))
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, limit)
}

/**
 * @param {{ root?: string, topN?: number }} [options]
 */
export function analyzeSidePanelBundle (options = {}) {
  const root = options.root ?? process.cwd()
  const topN = options.topN ?? 15
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hoverboard-analyze-'))
  const unminOut = path.join(tmpDir, 'side-panel-unmin.js')
  const minOut = path.join(tmpDir, 'side-panel-min.js')

  try {
    buildSync({
      entryPoints: [path.join(root, SIDE_PANEL_ENTRY)],
      outfile: unminOut,
      bundle: true,
      minify: false,
      format: 'esm',
      platform: 'browser',
      absWorkingDir: root
    })

    const metaResult = buildSync({
      entryPoints: [path.join(root, SIDE_PANEL_ENTRY)],
      outfile: minOut,
      bundle: true,
      minify: true,
      metafile: true,
      format: 'esm',
      platform: 'browser',
      absWorkingDir: root
    })

    return {
      entry: SIDE_PANEL_ENTRY,
      bytes_unminified: measureFileBytes(unminOut),
      bytes_minified: measureFileBytes(minOut),
      bytes_gzip: measureGzipBytes(minOut),
      top_contributors: topContributors(metaResult.metafile.inputs, topN)
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }
}
