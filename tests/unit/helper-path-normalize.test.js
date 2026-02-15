/**
 * [IMPL-FILE_STORAGE_HELPER_PATH_NORMALIZE] Helper path normalization and post-write verification.
 * When HOME has a trailing slash, expand_tilde must produce a path without double slash so the file is created.
 */

import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import os from 'os'

const helperPath = path.join(process.cwd(), 'native_host', 'helper.sh')

function runHelper (input, env = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn('sh', [helperPath], {
      env: { ...process.env, ...env },
      stdio: ['pipe', 'pipe', 'pipe']
    })
    let stdout = ''
    let stderr = ''
    proc.stdout.on('data', (d) => { stdout += d })
    proc.stderr.on('data', (d) => { stderr += d })
    proc.on('error', reject)
    proc.on('close', (code) => {
      try {
        const out = JSON.parse(stdout.trim())
        resolve({ response: out, code, stderr })
      } catch {
        reject(new Error(`Helper stdout not JSON: ${stdout.slice(0, 200)}; stderr: ${stderr}`))
      }
    })
    proc.stdin.write(input)
    proc.stdin.end()
  })
}

describe('helper path normalization [IMPL-FILE_STORAGE_HELPER_PATH_NORMALIZE]', () => {
  let tmpDir
  let originalCwd

  beforeAll(() => {
    if (!fs.existsSync(helperPath)) {
      console.warn('helper.sh not found, skipping helper-path-normalize tests')
    }
  })

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hoverboard-helper-test-'))
    originalCwd = process.cwd()
  })

  afterEach(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    } catch {}
    process.chdir(originalCwd)
  })

  test('writeBookmarksFile with HOME with trailing slash creates file at path without double slash [IMPL-FILE_STORAGE_HELPER_PATH_NORMALIZE]', async () => {
    if (!fs.existsSync(helperPath)) return
    const homeWithSlash = tmpDir + path.sep
    const expectedFile = path.join(tmpDir, '.hoverboard', 'hoverboard-bookmarks.json')
    const input = JSON.stringify({
      type: 'writeBookmarksFile',
      path: '~/.hoverboard',
      data: { version: 1, bookmarks: { 'https://example.com': { url: 'https://example.com', description: 'Test', tags: [], time: '', shared: 'yes', toread: 'no', hash: '' } } }
    })
    const { response } = await runHelper(input, { HOME: homeWithSlash })
    expect(response.type).toBe('writeBookmarksFile')
    expect(response.success).toBe(true)
    expect(fs.existsSync(expectedFile)).toBe(true)
    const content = JSON.parse(fs.readFileSync(expectedFile, 'utf8'))
    expect(content.bookmarks['https://example.com']).toBeDefined()
  })

})
