/**
 * Offscreen document for file bookmark I/O - [IMPL-FILE_BOOKMARK_SERVICE] [ARCH-FILE_BOOKMARK_PROVIDER]
 * Handles READ_FILE_BOOKMARKS and WRITE_FILE_BOOKMARKS messages; reads/writes hoverboard-bookmarks.json
 * using File System Access API with directory handle from IndexedDB.
 * [REQ-FILE_BOOKMARK_STORAGE]
 */

const INDEXEDDB_NAME = 'hoverboard_file_storage'
const STORE_NAME = 'handles'
const HANDLE_KEY = 'directory_handle'
const FILENAME = 'hoverboard-bookmarks.json'
const FILE_FORMAT_VERSION = 1

function getDb () {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(INDEXEDDB_NAME, 1)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(STORE_NAME)
    }
  })
}

async function getDirectoryHandle () {
  const db = await getDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).get(HANDLE_KEY)
    req.onsuccess = () => resolve(req.result || null)
    req.onerror = () => reject(req.error)
  })
}

async function readFile (dirHandle) {
  try {
    const fileHandle = await dirHandle.getFileHandle(FILENAME, { create: false })
    const file = await fileHandle.getFile()
    const text = await file.text()
    const data = JSON.parse(text || '{}')
    if (!data.bookmarks || typeof data.bookmarks !== 'object') {
      return { version: FILE_FORMAT_VERSION, bookmarks: {} }
    }
    return { version: data.version || FILE_FORMAT_VERSION, bookmarks: data.bookmarks }
  } catch (e) {
    if (e.name === 'NotFoundError') {
      return { version: FILE_FORMAT_VERSION, bookmarks: {} }
    }
    throw e
  }
}

async function writeFile (dirHandle, data) {
  const fileHandle = await dirHandle.getFileHandle(FILENAME, { create: true })
  const writable = await fileHandle.createWritable()
  const json = JSON.stringify({ version: data.version || FILE_FORMAT_VERSION, bookmarks: data.bookmarks || {} }, null, 2)
  await writable.write(json)
  await writable.close()
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const type = message?.type
  if (type === 'READ_FILE_BOOKMARKS') {
    getDirectoryHandle()
      .then((handle) => {
        if (!handle) {
          sendResponse({ error: 'NO_HANDLE', data: null })
          return
        }
        return readFile(handle).then((data) => sendResponse({ error: null, data }))
      })
      .catch((e) => sendResponse({ error: e.message || 'READ_FAILED', data: null }))
    return true
  }
  if (type === 'WRITE_FILE_BOOKMARKS') {
    getDirectoryHandle()
      .then((handle) => {
        if (!handle) {
          sendResponse({ error: 'NO_HANDLE', success: false })
          return
        }
        return writeFile(handle, message.data || {}).then(() => sendResponse({ error: null, success: true }))
      })
      .catch((e) => sendResponse({ error: e.message || 'WRITE_FAILED', success: false }))
    return true
  }
  return false
})
