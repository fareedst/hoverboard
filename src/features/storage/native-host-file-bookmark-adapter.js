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
/**
 * === IMPL-FULL-BLOCK: IMPL-NATIVE_HOST_WRAPPER ===
 * [IMPL-NATIVE_HOST_WRAPPER] [ARCH-NATIVE_HOST] [REQ-NATIVE_HOST_WRAPPER] — Length-prefixed JSON on stdin/stdout; ping/pong; delegate to helper for other messages. Contract: stdin length+JSON in; stdout length+JSON out; helper path from install dir.
 *
 * ## LOOP
 *
 * - [IMPL-NATIVE_HOST_WRAPPER] [ARCH-NATIVE_HOST] [REQ-NATIVE_HOST_WRAPPER] How: Implements loop behavior for IMPL-NATIVE_HOST_WRAPPER.
 * - Contract:
 *   - INPUT: stdin — 4-byte length (native byte order) then UTF-8 JSON message (max 64 MiB from Chrome)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: stdout — 4-byte length then UTF-8 JSON response (max 1 MB to Chrome); stderr for debug/TRACE
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: install_dir = dir of executable; helper = helper.sh (Unix) or helper.exe then helper.ps1 (Windows)
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: LOOP
 *   - READ 4-byte length L
 *   - READ L bytes UTF-8 into message
 *   - PARSE message as JSON
 *   - How (sub-block): # Respond to ping with pong.
 *   - IF message.type === "ping":
 *   - WRITE length-prefixed JSON {"type":"pong"} to stdout
 *   - CONTINUE
 *   - How (sub-block): # Resolve helper; if missing echo request or pong per product rule.
 *   - RESOLVE helper path from install_dir (helper.sh or helper.ps1/helper.exe)
 *   - IF no helper:
 *   - ECHO request or pong to stdout (per product rule)
 *   - CONTINUE
 *   - How (sub-block): # Invoke helper; read single JSON from stdout; write length-prefixed to stdout.
 *   - INVOKE helper with message JSON on stdin
 *   - READ helper stdout as single JSON object
 *   - WRITE length-prefixed response to stdout
 *
 * === END IMPL-FULL-BLOCK: IMPL-NATIVE_HOST_WRAPPER ===
 */
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
 * === IMPL-FULL-BLOCK: IMPL-NATIVE_HOST_INSTALLER ===
 * [IMPL-NATIVE_HOST_INSTALLER] [ARCH-NATIVE_HOST] [REQ-NATIVE_HOST_WRAPPER] — Copy wrapper and helper to install dir; write manifest; register with Chrome/Chromium. Contract: source dir and extension ID and browser; install dir and registration.
 *
 * ## MAIN
 *
 * - [IMPL-NATIVE_HOST_INSTALLER] [ARCH-NATIVE_HOST] [REQ-NATIVE_HOST_WRAPPER] How: Logical block for IMPL-NATIVE_HOST_INSTALLER.
 * - Contract:
 *   - INPUT: source dir, extension ID, browser (e.g. chrome vs chromium)
 *   - PRE: caller supplies valid inputs for this block; dependencies wired
 *   - OUTPUT: install dir with binary and manifest; browser registration so extension can connect
 *   - POST:
 *     - success => block outputs match OUTPUT shape
 *   - DATA: install dir (e.g. ~/.hoverboard or %LOCALAPPDATA%\Hoverboard); manifest path; allowed_origins = [chrome-extension://<EXTENSION_ID>/]
 *   - EFFECTS: IO
 *   - TERMINATION: total
 * - PROCEDURE: MAIN
 *   - How (sub-block): Parse args; copy binary and helper; fill manifest; write to NativeMessagingHosts dir.
 *   - 1. install_sh (macOS/Linux):
 *   - 2.   PARSE args [SOURCE_DIR] [EXTENSION_ID] [BROWSER]
 *   - 3.   DETERMINE install_dir (e.g. ~/.hoverboard)
 *   - 4.   COPY native_host binary (or platform-named) and helper.sh to install_dir
 *   - 5.   FILL manifest template: path = absolute path to wrapper, allowed_origins = [chrome-extension://<EXTENSION_ID>/]
 *   - 6.   WRITE manifest to browser NativeMessagingHosts dir (Chrome: ~/Library/Application Support/... or ~/.config/google-chrome/...; Chromium: ~/.config/chromium/...)
 *   - How (sub-block): Parse params; copy exe and helper; write manifest; create registry key for host path.
 *   - 7. install_ps1 (Windows):
 *   - 8.   PARSE params -SourceDir, -ExtensionId, -Browser
 *   - 9.   DETERMINE install_dir (%LOCALAPPDATA%\Hoverboard)
 *   - 10.   COPY native_host.exe and helper.ps1 (or helper.exe) to install_dir
 *   - 11.   WRITE manifest to install_dir
 *   - 12.   CREATE registry key HKCU\Software\Google\Chrome\NativeMessagingHosts\com.hoverboard.native_host (or Chromium) with default value = full path to manifest
 *
 * === END IMPL-FULL-BLOCK: IMPL-NATIVE_HOST_INSTALLER ===
 */
import { FileBookmarkStorageAdapter } from './file-bookmark-storage-adapter.js'

const NATIVE_HOST_NAME = 'com.hoverboard.native_host'
const STORAGE_KEY_PATH = 'hoverboard_file_storage_path'
const DEFAULT_PATH = '~/.hoverboard'

/**
 * [IMPL-FILE_STORAGE_TYPED_PATH] Get path from storage; default ~/.hoverboard.
 * @returns {Promise<string>}
 */
async function getPathFromStorage () {
  const result = await chrome.storage.local.get(STORAGE_KEY_PATH)
  const path = result[STORAGE_KEY_PATH]
  return (path && typeof path === 'string' && path.trim()) ? path.trim() : DEFAULT_PATH
}

/**
 * [IMPL-FILE_STORAGE_TYPED_PATH] Adapter that sends read/write to native host with path from storage.
 */
export class NativeHostFileBookmarkAdapter extends FileBookmarkStorageAdapter {
  async readBookmarksFile () {
    const path = await getPathFromStorage()
    const response = await chrome.runtime.sendNativeMessage(NATIVE_HOST_NAME, { type: 'readBookmarksFile', path })
    if (!response) {
      throw new Error(chrome.runtime.lastError?.message || 'Native host did not respond')
    }
    if (response.type === 'error') {
      throw new Error(response.message || 'Native host error')
    }
    if (response.type === 'readBookmarksFile' && response.data) {
      return { version: response.data.version ?? 1, bookmarks: response.data.bookmarks ?? {} }
    }
    throw new Error('Invalid native host response for readBookmarksFile')
  }

  async writeBookmarksFile (data) {
    const path = await getPathFromStorage()
    const payload = { version: data?.version ?? 1, bookmarks: data?.bookmarks ?? {} }
    const response = await chrome.runtime.sendNativeMessage(NATIVE_HOST_NAME, { type: 'writeBookmarksFile', path, data: payload })
    if (!response) {
      throw new Error(chrome.runtime.lastError?.message || 'Native host did not respond')
    }
    if (response.type === 'error') {
      throw new Error(response.message || 'Native host error')
    }
    if (response.type === 'writeBookmarksFile' && response.success) {
      return
    }
    throw new Error('Invalid native host response for writeBookmarksFile')
  }
}
