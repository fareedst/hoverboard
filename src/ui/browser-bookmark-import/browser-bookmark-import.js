/**
 * Browser Bookmark Import - [REQ-BROWSER_BOOKMARK_IMPORT] [ARCH-BROWSER_BOOKMARK_IMPORT] [IMPL-BROWSER_BOOKMARK_IMPORT]
 * Loads native bookmarks via chrome.bookmarks.getTree, flattens with folder path; filter, select, conflict resolution, tags, saveBookmark per row.
 */

import { sanitizeTag, folderPathToTags, parseExtraTags, flattenTree } from './browser-bookmark-import-utils.js'

const MESSAGE_TYPE_AGGREGATED = 'getAggregatedBookmarksForIndex'
const MESSAGE_TYPE_LOCAL = 'getLocalBookmarksForIndex'
const MESSAGE_TYPE_SAVE = 'saveBookmark'

let allBookmarks = []
let filteredBookmarks = []
let folderList = []
let sortKey = 'dateAdded'
let sortAsc = false
/** [REQ-BROWSER_BOOKMARK_IMPORT] Selected bookmark URLs for import. */
const selectedUrls = new Set()

const elements = {
  searchInput: document.getElementById('search-input'),
  searchClear: document.getElementById('search-clear'),
  filterFolder: document.getElementById('filter-folder'),
  emptyState: document.getElementById('empty-state'),
  emptyStateMessage: document.getElementById('empty-state-message'),
  tableWrapper: document.getElementById('table-wrapper'),
  tableBody: document.getElementById('table-body'),
  rowCount: document.getElementById('row-count'),
  table: document.getElementById('bookmarks-table'),
  selectAll: document.getElementById('select-all'),
  importTarget: document.getElementById('import-target'),
  importBtn: document.getElementById('import-btn'),
  importResult: document.getElementById('import-result'),
  useFolderTags: document.getElementById('use-folder-tags'),
  extraTags: document.getElementById('extra-tags')
}

/**
 * [IMPL-BROWSER_BOOKMARK_IMPORT] Build unique folder list for filter dropdown (from allBookmarks).
 */
function buildFolderList () {
  const set = new Set()
  set.add('')
  for (const b of allBookmarks) {
    const p = (b.folderPath || '').trim()
    if (p) set.add(p)
  }
  folderList = Array.from(set).filter(Boolean).sort()
}

function escapeHtml (str) {
  if (str == null) return ''
  const s = String(str)
  const div = document.createElement('div')
  div.textContent = s
  return div.innerHTML
}

function matchSearch (bookmark, q) {
  if (!q || !q.trim()) return true
  const lower = q.trim().toLowerCase()
  const title = (bookmark.title || '').toLowerCase()
  const url = (bookmark.url || '').toLowerCase()
  return title.includes(lower) || url.includes(lower)
}

function matchFilters (bookmark) {
  const folderVal = (elements.filterFolder && elements.filterFolder.value) || ''
  if (folderVal) {
    const bPath = (bookmark.folderPath || '').trim()
    if (bPath !== folderVal) return false
  }
  return true
}

function applySearchAndFilter () {
  const q = elements.searchInput.value.trim()
  filteredBookmarks = allBookmarks.filter(b => matchSearch(b, q) && matchFilters(b))
  sortTable()
  renderTableBody()
  updateRowCount()
  toggleEmptyState()
  updateImportButtonState()
}

function compare (a, b) {
  const va = a[sortKey]
  const vb = b[sortKey]
  if (sortKey === 'dateAdded') {
    const ta = typeof va === 'number' ? va : 0
    const tb = typeof vb === 'number' ? vb : 0
    return sortAsc ? ta - tb : tb - ta
  }
  const sa = String(va ?? '').toLowerCase()
  const sb = String(vb ?? '').toLowerCase()
  const cmp = sa.localeCompare(sb)
  return sortAsc ? cmp : -cmp
}

function sortTable () {
  filteredBookmarks.sort(compare)
}

function renderTableBody () {
  elements.tableBody.innerHTML = ''
  for (const b of filteredBookmarks) {
    const url = b.url || ''
    const checked = selectedUrls.has(url) ? ' checked' : ''
    const title = escapeHtml(b.title || '(no title)')
    const urlEsc = escapeHtml(url)
    const folderEsc = escapeHtml(b.folderPath || '')
    const dateAdded = b.dateAdded ? (typeof b.dateAdded === 'number' ? new Date(b.dateAdded).toLocaleString() : String(b.dateAdded)) : ''
    const urlLink = b.url
      ? `<a href="${escapeHtml(b.url)}" target="_blank" rel="noopener" class="url-link" title="Opens in new tab">${urlEsc}<span class="url-external-icon" aria-hidden="true">↗</span></a>`
      : urlEsc
    const tr = document.createElement('tr')
    tr.innerHTML = `
      <td class="col-select"><label><input type="checkbox" class="row-select" data-url="${escapeHtml(url)}" aria-label="Select bookmark"${checked}></label></td>
      <td class="col-title">${title}</td>
      <td class="col-url">${urlLink}</td>
      <td class="col-folder">${folderEsc}</td>
      <td class="col-date">${escapeHtml(dateAdded)}</td>
    `
    elements.tableBody.appendChild(tr)
  }
  updateSelectAllState()
}

function onRowSelectChange (url, checked) {
  if (checked) selectedUrls.add(url)
  else selectedUrls.delete(url)
  updateImportButtonState()
}

function updateSelectAllState () {
  if (!elements.selectAll) return
  const visible = filteredBookmarks.map(b => b.url).filter(Boolean)
  const none = visible.length === 0
  const allSelected = !none && visible.every(u => selectedUrls.has(u))
  const someSelected = visible.some(u => selectedUrls.has(u))
  elements.selectAll.checked = allSelected
  elements.selectAll.indeterminate = someSelected && !allSelected
  elements.selectAll.disabled = none
}

function updateImportButtonState () {
  const hasSelection = selectedUrls.size > 0
  if (elements.importBtn) elements.importBtn.disabled = !hasSelection
  updateSelectAllState()
}

function updateRowCount () {
  elements.rowCount.textContent = `${filteredBookmarks.length} bookmark${filteredBookmarks.length !== 1 ? 's' : ''}`
}

function toggleEmptyState () {
  const showEmpty = allBookmarks.length === 0
  elements.emptyState.classList.toggle('hidden', !showEmpty)
  elements.tableWrapper.classList.toggle('hidden', showEmpty)
}

function setSort (key) {
  if (sortKey === key) {
    sortAsc = !sortAsc
  } else {
    sortKey = key
    sortAsc = key === 'dateAdded' ? false : true
  }
  const headers = elements.table.querySelectorAll('th.sortable')
  headers.forEach(th => {
    th.classList.remove('sort-active', 'sort-asc', 'sort-desc')
    const icon = th.querySelector('.sort-icon')
    if (th.dataset.sort === sortKey) {
      th.classList.add('sort-active', sortAsc ? 'sort-asc' : 'sort-desc')
      icon.textContent = sortAsc ? '↑' : '↓'
    } else {
      icon.textContent = ''
    }
  })
  sortTable()
  renderTableBody()
}

/**
 * [REQ-BROWSER_BOOKMARK_IMPORT] [ARCH-BROWSER_BOOKMARK_IMPORT] [IMPL-BROWSER_BOOKMARK_IMPORT]
 * Fetch existing Hoverboard bookmarks for conflict detection and merge.
 */
async function fetchExistingBookmarks () {
  try {
    const response = await chrome.runtime.sendMessage({ type: MESSAGE_TYPE_AGGREGATED })
    let list = response?.data?.bookmarks ?? response?.bookmarks
    if (!Array.isArray(list)) {
      const fallback = await chrome.runtime.sendMessage({ type: MESSAGE_TYPE_LOCAL })
      list = fallback?.data?.bookmarks ?? fallback?.bookmarks ?? []
    }
    return Array.isArray(list) ? list : []
  } catch (e) {
    console.warn('[IMPL-BROWSER_BOOKMARK_IMPORT] fetchExistingBookmarks failed:', e)
    return []
  }
}

/**
 * [REQ-BROWSER_BOOKMARK_IMPORT] [ARCH-BROWSER_BOOKMARK_IMPORT] [IMPL-BROWSER_BOOKMARK_IMPORT]
 * Run import: for each selected bookmark, resolve conflict, build payload, send saveBookmark, show result.
 */
async function runImport () {
  if (selectedUrls.size === 0 || !elements.importResult) return
  elements.importResult.textContent = ''
  const conflictMode = document.querySelector('input[name="conflict-mode"]:checked')?.value || 'skip'
  const preferredBackend = (elements.importTarget && elements.importTarget.value) || 'local'
  const useFolderTags = elements.useFolderTags && elements.useFolderTags.checked
  const extraTagsList = parseExtraTags(elements.extraTags && elements.extraTags.value)

  const existingList = await fetchExistingBookmarks()
  const existingByUrl = new Map()
  for (const b of existingList) {
    const u = (b.url || '').trim()
    if (u) existingByUrl.set(u, b)
  }

  const toProcess = allBookmarks.filter(b => selectedUrls.has(b.url || ''))
  if (elements.importBtn) elements.importBtn.disabled = true

  let imported = 0
  let skipped = 0
  let failed = 0

  for (const b of toProcess) {
    const url = (b.url || '').trim()
    if (!url) continue
    const existing = existingByUrl.get(url)

    if (existing && conflictMode === 'skip') {
      skipped++
      continue
    }

    let description = b.title || ''
    let extended = ''
    let tags = []

    if (useFolderTags) {
      tags = folderPathToTags(b.folderPath)
    }
    tags = [...tags, ...extraTagsList]
    tags = [...new Set(tags)].filter(Boolean)

    if (existing && conflictMode === 'merge') {
      const existTags = Array.isArray(existing.tags) ? existing.tags : (existing.tags ? String(existing.tags).split(/\s+/).filter(Boolean) : [])
      tags = [...new Set([...existTags, ...tags])].filter(Boolean)
      if (existing.description) description = existing.description
      if (existing.extended) extended = existing.extended
    }

    const time = b.dateAdded != null
      ? new Date(b.dateAdded).toISOString()
      : new Date().toISOString()

    const payload = {
      url,
      description,
      extended,
      tags,
      time,
      shared: 'yes',
      toread: 'no',
      preferredBackend
    }

    try {
      const res = await chrome.runtime.sendMessage({ type: MESSAGE_TYPE_SAVE, data: payload })
      if (res && res.success) imported++
      else failed++
    } catch (e) {
      console.warn('[IMPL-BROWSER_BOOKMARK_IMPORT] saveBookmark failed for', url, e)
      failed++
    }
  }

  if (elements.importBtn) elements.importBtn.disabled = false
  const parts = []
  if (imported > 0) parts.push(`Imported ${imported}`)
  if (skipped > 0) parts.push(`skipped ${skipped}`)
  if (failed > 0) parts.push(`${failed} failed`)
  elements.importResult.textContent = parts.length ? parts.join(', ') + '.' : 'Done.'
}

/**
 * [IMPL-BROWSER_BOOKMARK_IMPORT] Load browser bookmarks via chrome.bookmarks.getTree; flatten, build folder list, apply filters.
 */
async function loadBrowserBookmarks () {
  if (typeof chrome === 'undefined' || !chrome.bookmarks || !chrome.bookmarks.getTree) {
    if (elements.emptyStateMessage) {
      elements.emptyStateMessage.textContent = 'Bookmarks API is not available. Ensure the extension has the bookmarks permission.'
    }
    allBookmarks = []
    buildFolderList()
    applySearchAndFilter()
    toggleEmptyState()
    return
  }
  try {
    const roots = await chrome.bookmarks.getTree()
    allBookmarks = flattenTree(roots)
    buildFolderList()
    applySearchAndFilter()
    toggleEmptyState()
    populateFolderFilter()
  } catch (err) {
    console.error('[IMPL-BROWSER_BOOKMARK_IMPORT] getTree failed:', err)
    if (elements.emptyStateMessage) {
      elements.emptyStateMessage.textContent = 'Could not load browser bookmarks. Check the bookmarks permission.'
    }
    allBookmarks = []
    folderList = []
    applySearchAndFilter()
    elements.emptyState.classList.remove('hidden')
    elements.tableWrapper.classList.add('hidden')
  }
}

function populateFolderFilter () {
  if (!elements.filterFolder) return
  const current = elements.filterFolder.value
  elements.filterFolder.innerHTML = '<option value="">All</option>'
  for (const path of folderList) {
    const opt = document.createElement('option')
    opt.value = path
    opt.textContent = path
    elements.filterFolder.appendChild(opt)
  }
  if (folderList.includes(current)) {
    elements.filterFolder.value = current
  }
}

function init () {
  elements.searchInput.addEventListener('input', applySearchAndFilter)
  elements.searchClear.addEventListener('click', () => {
    elements.searchInput.value = ''
    applySearchAndFilter()
  })
  if (elements.filterFolder) elements.filterFolder.addEventListener('change', applySearchAndFilter)

  if (elements.selectAll) {
    elements.selectAll.addEventListener('change', () => {
      const visible = filteredBookmarks.map(b => b.url).filter(Boolean)
      if (elements.selectAll.checked) {
        visible.forEach(u => selectedUrls.add(u))
      } else {
        visible.forEach(u => selectedUrls.delete(u))
      }
      renderTableBody()
      updateImportButtonState()
    })
  }
  elements.tableBody.addEventListener('change', (e) => {
    const cb = e.target.closest('.row-select')
    if (cb && cb.dataset.url !== undefined) {
      onRowSelectChange(cb.dataset.url, cb.checked)
    }
  })

  elements.table.querySelectorAll('th.sortable').forEach(th => {
    th.addEventListener('click', () => setSort(th.dataset.sort))
  })

  if (elements.importBtn) elements.importBtn.addEventListener('click', () => runImport())

  loadBrowserBookmarks()
  updateImportButtonState()
}

init()
