/**
 * Dedicated page for directory picker - [REQ-FILE_BOOKMARK_STORAGE]
 * showDirectoryPicker is not available in the options page context in Chrome;
 * this page is opened in a new tab so the picker runs with a user gesture here.
 */

const INDEXEDDB_NAME = 'hoverboard_file_storage'
const STORE_NAME = 'handles'
const HANDLE_KEY = 'directory_handle'

const btn = document.getElementById('select-folder')
const status = document.getElementById('picker-status')

function setStatus (text, isError = false) {
  status.textContent = text
  status.style.color = isError ? '#c00' : ''
}

async function selectFolder () {
  if (typeof window.showDirectoryPicker !== 'function') {
    setStatus('Folder selection is not supported in this browser. Chrome does not expose it on extension pages. Use Options → Storage Mode → Local or Pinboard instead.', true)
    if (!document.getElementById('back-to-options')) {
      const link = document.createElement('a')
      link.id = 'back-to-options'
      link.href = chrome.runtime.getURL('src/ui/options/options.html')
      link.textContent = ' Open Options'
      link.style.marginLeft = '0.25em'
      status.appendChild(link)
    }
    return
  }
  setStatus('Opening picker…')
  try {
    const dirHandle = await window.showDirectoryPicker()
    const db = await new Promise((resolve, reject) => {
      const req = indexedDB.open(INDEXEDDB_NAME, 1)
      req.onerror = () => reject(req.error)
      req.onsuccess = () => resolve(req.result)
      req.onupgradeneeded = (e) => {
        if (!e.target.result.objectStoreNames.contains(STORE_NAME)) {
          e.target.result.createObjectStore(STORE_NAME)
        }
      }
    })
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).put(dirHandle, HANDLE_KEY)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    await chrome.storage.local.set({
      hoverboard_file_storage_configured: true,
      hoverboard_file_storage_name: dirHandle.name || 'Selected folder'
    })
    chrome.runtime.sendMessage({ type: 'switchStorageMode' }).catch(() => {})
    setStatus('Folder saved. You can close this tab or open Options to continue.')
    // Optionally focus existing options tab or open a new one
    const optionsUrl = chrome.runtime.getURL('src/ui/options/options.html')
    const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true })
    const existing = await chrome.tabs.query({ url: optionsUrl })
    if (existing.length > 0) {
      await chrome.tabs.update(existing[0].id, { active: true })
      if (currentTab?.id) chrome.tabs.remove(currentTab.id)
    } else if (currentTab?.id) {
      await chrome.tabs.update(currentTab.id, { url: optionsUrl })
    } else {
      chrome.tabs.create({ url: optionsUrl })
    }
  } catch (e) {
    if (e.name === 'AbortError') {
      setStatus('Cancelled.')
      return
    }
    setStatus('Error: ' + (e.message || e.name || 'Unknown'), true)
  }
}

btn.addEventListener('click', () => selectFolder())
