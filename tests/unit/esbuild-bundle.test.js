/**
 * [IMPL-SIDE_PANEL_BUNDLE] [ARCH-SIDE_PANEL_BUNDLE] [REQ-SIDE_PANEL_BUNDLE_SIZE]
 * [IMPL-SIDE_PANEL_BUNDLE] [ARCH-SIDE_PANEL_BUNDLE] [REQ-SIDE_PANEL_BUNDLE_SIZE] How: Central esbuild runner applies --minify when NODE_ENV=production; all five manifest entry points use the same helper so dev builds stay readable.
 */
import fs from 'fs'

import { isProductionBuild } from '../../scripts/is-production-build.js'
import { ENTRY_MAP } from '../../scripts/esbuild-entry-map.js'

describe('[REQ-SIDE_PANEL_BUNDLE_SIZE] esbuild production minify', () => {
  test('isProductionBuild is true when NODE_ENV=production', () => {
    expect(isProductionBuild({ NODE_ENV: 'production' })).toBe(true)
  })

  test('isProductionBuild is false for dev builds', () => {
    expect(isProductionBuild({ NODE_ENV: 'development' })).toBe(false)
    expect(isProductionBuild({})).toBe(false)
  })

  test('ENTRY_MAP includes all five extension entry points', () => {
    expect(Object.keys(ENTRY_MAP).sort()).toEqual([
      'content',
      'options',
      'popup',
      'side-panel',
      'sw'
    ])
  })

  test('each entry maps to dist outfile under dist/', () => {
    for (const key of Object.keys(ENTRY_MAP)) {
      expect(ENTRY_MAP[key].out).toMatch(/^dist\//)
      expect(ENTRY_MAP[key].in).toMatch(/^src\//)
    }
  })

  test('build:prod REQ-SIDE_PANEL_BUNDLE_SIZE passes production mode to the final build', () => {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
    expect(packageJson.scripts['build:prod']).toContain('NODE_ENV=production node scripts/build.js')
  })
})
