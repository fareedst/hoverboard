/**
 * [IMPL-MV3_MIGRATION] [ARCH-MV3_MIGRATION] [REQ-MANIFEST_V3_MIGRATION] How: Verifies the Manifest V3 background declaration resolves to the shipped service-worker entry point without invoking a browser UI.
 * Contract:
 *   INPUT: manifest file and service-worker entry path
 *   PRE: manifest JSON and repository entry file are readable
 *   OUTPUT: validated manifest_version and existing service-worker path
 *   POST:
 *     success => manifest declares version 3 and points to src/core/service-worker.js
 *   FAILURE_MODES: InvalidManifest, MissingServiceWorker
 *   EFFECTS: pure, IO
 *   TERMINATION: total
 * PROCEDURE: MV3_ENTRY_POINT_BINDING
 *   READ manifest
 *   ASSERT manifest_version = 3
 *   READ background.service_worker
 *   ASSERT entry path = src/core/service-worker.js
 *   ASSERT entry file exists
 *
 * Pattern: UNKNOWN manifest/runtime binding.
 * Composition: Manifest V3 background declaration -> service-worker module
 * resolution. This verifies the extension entry-point binding without UI.
 */

import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

describe('[IMPL-MV3_MIGRATION] manifest binding', () => {
  test('manifest points to the shipped service worker entry point', () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'))
    const serviceWorker = manifest.background?.service_worker

    expect(manifest.manifest_version).toBe(3)
    expect(serviceWorker).toBe('src/core/service-worker.js')
    expect(fs.existsSync(path.join(root, serviceWorker))).toBe(true)
  })
})
