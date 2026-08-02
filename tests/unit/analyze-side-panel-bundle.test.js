/** @jest-environment node */
/**
 * [IMPL-SIDE_PANEL_BUNDLE] [ARCH-SIDE_PANEL_BUNDLE] [REQ-SIDE_PANEL_BUNDLE_SIZE]
 * [IMPL-SIDE_PANEL_BUNDLE] [ARCH-SIDE_PANEL_BUNDLE] [REQ-SIDE_PANEL_BUNDLE_SIZE] How: Dev/CI script runs esbuild with --metafile to temp output; reports unminified, minified, gzip sizes and top-N contributors; metafile never copied to dist/.
 */
import {
  analyzeSidePanelBundle,
  topContributors
} from '../../scripts/analyze-side-panel-bundle-core.js'

describe('[REQ-SIDE_PANEL_BUNDLE_SIZE] analyze side-panel bundle', () => {
  test('topContributors sorts by bytes descending', () => {
    const rows = topContributors({
      'a.js': { bytes: 10 },
      'b.js': { bytes: 100 },
      'c.js': { bytes: 50 }
    }, 2)
    expect(rows).toEqual([
      { path: 'b.js', bytes: 100 },
      { path: 'c.js', bytes: 50 }
    ])
  })

  test('analyzeSidePanelBundle reports unminified, minified, and gzip sizes', () => {
    const report = analyzeSidePanelBundle({ root: process.cwd(), topN: 5 })
    expect(report.entry).toBe('src/ui/side-panel/side-panel.js')
    expect(report.bytes_unminified).toBeGreaterThan(report.bytes_minified)
    expect(report.bytes_minified).toBeGreaterThan(report.bytes_gzip)
    expect(report.top_contributors.length).toBeGreaterThan(0)
    expect(report.top_contributors[0].bytes).toBeGreaterThan(0)
    expect(report.top_contributors[0].path).toMatch(/\.js$/)
  })

  test('analyzeSidePanelBundle gzip is smaller than minified', () => {
    const report = analyzeSidePanelBundle({ root: process.cwd(), topN: 1 })
    expect(report.bytes_gzip).toBeLessThan(report.bytes_minified)
  })
})
