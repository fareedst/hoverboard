/**
 * === IMPL-FULL-BLOCK: IMPL-FILE_STORAGE_HELPER_PATH_NORMALIZE ===
 * [IMPL-FILE_STORAGE_HELPER_PATH_NORMALIZE] [ARCH-FILE_BOOKMARK_PROVIDER] [REQ-FILE_BOOKMARK_STORAGE] — Path normalization (~ expansion without double slash) and write verification (file exists and non-empty). Contract: path/data inputs and resolved path or success/error.
 * 
 * ## EXPAND_TILDE
 * 
 * - [IMPL-FILE_STORAGE_HELPER_PATH_NORMALIZE] [ARCH-FILE_BOOKMARK_PROVIDER] [REQ-FILE_BOOKMARK_STORAGE] How: Implements expand_tilde(path) behavior for IMPL-FILE_STORAGE_HELPER_PATH_NORMALIZE.
 * - Contract:
 *   - INPUT: path string (may contain ~); file path and data (for write)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: resolved path (no double slash from HOME); success only if file exists and non-empty after write | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: HOME with trailing slash stripped (H = ${HOME%/})
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: EXPAND_TILDE
 *   - H = strip_trailing_slash(HOME)
 *   - IF path is ~ or ~/...: REPLACE ~ with H; RETURN (no // in result)
 *   - RETURN path
 *   - How (sub-block): Write data to path; fail if file missing or empty after write.
 * 
 * ## WRITE_BOOKMARKS_FILE
 * 
 * - [IMPL-FILE_STORAGE_HELPER_PATH_NORMALIZE] [ARCH-FILE_BOOKMARK_PROVIDER] [REQ-FILE_BOOKMARK_STORAGE] How: Implements writeBookmarksFile(path, data) behavior for IMPL-FILE_STORAGE_HELPER_PATH_NORMALIZE.
 * - Contract:
 *   - INPUT: path string (may contain ~); file path and data (for write)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: resolved path (no double slash from HOME); success only if file exists and non-empty after write | { error: OperationFailed }
 *   - POST:
 *     - success => block outputs match OUTPUT success shape
 *     - error OperationFailed => no silent partial commit beyond documented best-effort
 *   - FAILURE_MODES: OperationFailed
 *   - DATA: HOME with trailing slash stripped (H = ${HOME%/})
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: WRITE_BOOKMARKS_FILE
 *   - path = expand_tilde(path)
 *   - WRITE data to path (create dir if needed)
 *   - IF file missing OR file empty: OUTPUT error; EXIT failure
 *   - ELSE: OUTPUT success
 * 
 * === END IMPL-FULL-BLOCK: IMPL-FILE_STORAGE_HELPER_PATH_NORMALIZE ===
 */
/**
 * === IMPL-FULL-BLOCK: IMPL-FILE_STORAGE_TYPED_PATH ===
 * [IMPL-FILE_STORAGE_TYPED_PATH] [ARCH-FILE_BOOKMARK_PROVIDER] [REQ-FILE_BOOKMARK_STORAGE] — User-typed path for file storage; Options persist path; native host read/write; initBookmarkProvider path vs picker. Contract: path input and storage; persisted path and file I/O via native host.
 * 
 * ## RESOLVE_FILE_PATH
 * 
 * - [IMPL-FILE_STORAGE_TYPED_PATH] [ARCH-FILE_BOOKMARK_PROVIDER] [REQ-FILE_BOOKMARK_STORAGE] How: Implements resolveFilePath(path) behavior for IMPL-FILE_STORAGE_TYPED_PATH.
 * - Contract:
 *   - INPUT: path string (user-typed, default ~/.hoverboard); read/write requests with path
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: persisted path in hoverboard_file_storage_path; file contents read/written via native host
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: hoverboard_file_storage_path (storage); path -> if dir then path/hoverboard-bookmarks.json else path as file
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: RESOLVE_FILE_PATH
 *   - path = expand_tilde(path)  // IMPL-FILE_STORAGE_HELPER_PATH_NORMALIZE
 *   - IF path ends with .json: RETURN path AS file
 *   - ELSE: RETURN path + "/hoverboard-bookmarks.json"
 *   - How (sub-block): Send native message to helper for read/write; return result.
 * 
 * ## READ_BOOKMARKS_FILE
 * 
 * - [IMPL-FILE_STORAGE_TYPED_PATH] [ARCH-FILE_BOOKMARK_PROVIDER] [REQ-FILE_BOOKMARK_STORAGE] How: Implements readBookmarksFile(path), writeBookmarksFile(path, data) behavior for IMPL-FILE_STORAGE_TYPED_PATH.
 * - Contract:
 *   - INPUT: path string (user-typed, default ~/.hoverboard); read/write requests with path
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: persisted path in hoverboard_file_storage_path; file contents read/written via native host
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: hoverboard_file_storage_path (storage); path -> if dir then path/hoverboard-bookmarks.json else path as file
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: READ_BOOKMARKS_FILE
 *   - path = resolveFilePath(path)
 *   - SEND native message (type, path) to helper; helper reads/writes file; RETURN result
 *   - How (sub-block): Prefer path adapter when path set; else picker adapter.
 * 
 * ## INIT_BOOKMARK_PROVIDER
 * 
 * - [IMPL-FILE_STORAGE_TYPED_PATH] [ARCH-FILE_BOOKMARK_PROVIDER] [REQ-FILE_BOOKMARK_STORAGE] How: Implements initBookmarkProvider() behavior for IMPL-FILE_STORAGE_TYPED_PATH.
 * - Contract:
 *   - INPUT: path string (user-typed, default ~/.hoverboard); read/write requests with path
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: persisted path in hoverboard_file_storage_path; file contents read/written via native host
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: hoverboard_file_storage_path (storage); path -> if dir then path/hoverboard-bookmarks.json else path as file
 *   - DATA_TRANSITION: mutable DATA updated per PROCEDURE steps on success paths
 *   - EFFECTS: IO, State
 *   - TERMINATION: total
 * - PROCEDURE: INIT_BOOKMARK_PROVIDER
 *   - IF path set in storage: USE NativeHostFileBookmarkAdapter(path)
 *   - ELSE IF picker configured: USE MessageFileBookmarkAdapter
 * 
 * === END IMPL-FULL-BLOCK: IMPL-FILE_STORAGE_TYPED_PATH ===
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
