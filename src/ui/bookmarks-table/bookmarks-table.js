/**
 * Local Bookmarks Index - [REQ-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX]
 * Loads local + file bookmarks via getAggregatedBookmarksForIndex (Storage column). Fallback: getLocalBookmarksForIndex.
 * Export: [REQ-LOCAL_BOOKMARKS_INDEX_EXPORT] [ARCH-LOCAL_BOOKMARKS_INDEX_EXPORT] [IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT]
 */

import { matchStorageFilter } from './bookmarks-table-filter.js'

const MESSAGE_TYPE_AGGREGATED = 'getAggregatedBookmarksForIndex'
const MESSAGE_TYPE_LOCAL = 'getLocalBookmarksForIndex'
const MESSAGE_TYPE_MOVE = 'moveBookmarkToStorage'

let allBookmarks = []
let filteredBookmarks = []
let sortKey = 'time'
let sortAsc = false
/** [REQ-LOCAL_BOOKMARKS_INDEX] Selected bookmark URLs for bulk operations (e.g. move to storage). */
const selectedUrls = new Set()

const elements = {
  searchInput: document.getElementById('search-input'),
  searchClear: document.getElementById('search-clear'),
  filterTags: document.getElementById('filter-tags'),
  filterToread: document.getElementById('filter-toread'),
  filterPrivate: document.getElementById('filter-private'),
  filterStorage: document.getElementById('filter-storage'),
  exportAll: document.getElementById('export-all'),
  exportDisplayed: document.getElementById('export-displayed'),
  emptyState: document.getElementById('empty-state'),
  tableWrapper: document.getElementById('table-wrapper'),
  tableBody: document.getElementById('table-body'),
  rowCount: document.getElementById('row-count'),
  table: document.getElementById('bookmarks-table'),
  selectAll: document.getElementById('select-all'),
  moveTargetSelect: document.getElementById('move-target'),
  moveButton: document.getElementById('move-selected-btn')
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
  const title = (bookmark.description || '').toLowerCase()
  const url = (bookmark.url || '').toLowerCase()
  const tags = (Array.isArray(bookmark.tags) ? bookmark.tags.join(' ') : String(bookmark.tags || '')).toLowerCase()
  const extended = (bookmark.extended || '').toLowerCase()
  return title.includes(lower) || url.includes(lower) || tags.includes(lower) || extended.includes(lower)
}

function matchFilters (bookmark) {
  const tagFilter = (elements.filterTags.value || '').trim()
  if (tagFilter) {
    const includeTags = tagFilter.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
    if (includeTags.length) {
      const bTags = (bookmark.tags || []).map(t => String(t).toLowerCase())
      if (!includeTags.some(t => bTags.includes(t))) return false
    }
  }
  if (elements.filterToread.checked && bookmark.toread !== 'yes') return false
  if (elements.filterPrivate.checked && bookmark.shared !== 'no') return false
  const storageFilter = (elements.filterStorage && elements.filterStorage.value) || ''
  if (!matchStorageFilter(bookmark, storageFilter)) return false
  return true
}

function applySearchAndFilter () {
  const q = elements.searchInput.value.trim()
  filteredBookmarks = allBookmarks.filter(b => matchSearch(b, q) && matchFilters(b))
  sortTable()
  renderTableBody()
  updateRowCount()
  toggleEmptyState()
  updateExportButtonState()
}

function compare (a, b) {
  const va = a[sortKey]
  const vb = b[sortKey]
  if (sortKey === 'time') {
    const cmp = (vb || '').localeCompare(va || '')
    return sortAsc ? -cmp : cmp
  }
  if (sortKey === 'tags') {
    const sa = Array.isArray(va) ? va.join(' ') : String(va || '')
    const sb = Array.isArray(vb) ? vb.join(' ') : String(vb || '')
    const cmp = sa.localeCompare(sb)
    return sortAsc ? cmp : -cmp
  }
  if (sortKey === 'storage') {
    const cmp = String(va || '').localeCompare(String(vb || ''))
    return sortAsc ? cmp : -cmp
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
    const tr = document.createElement('tr')
    const url = b.url || ''
    const checked = selectedUrls.has(url) ? ' checked' : ''
    const title = escapeHtml(b.description || '(no title)')
    const urlEsc = escapeHtml(url)
    const tagsStr = Array.isArray(b.tags) ? b.tags.join(', ') : String(b.tags || '')
    const tagsEsc = escapeHtml(tagsStr)
    const time = escapeHtml(b.time ? new Date(b.time).toLocaleString() : '')
    const shared = b.shared === 'no' ? 'Private' : 'Public'
    const toread = b.toread === 'yes' ? 'Yes' : 'No'
    const storage = escapeHtml(b.storage === 'sync' ? 'Sync' : (b.storage === 'file' ? 'File' : 'Local'))
    const urlLink = b.url
      ? `<a href="${escapeHtml(b.url)}" target="_blank" rel="noopener" class="url-link" title="Opens in new tab">${urlEsc}<span class="url-external-icon" aria-hidden="true">↗</span></a>`
      : urlEsc
    tr.innerHTML = `
      <td class="col-select"><label><input type="checkbox" class="row-select" data-url="${escapeHtml(url)}" aria-label="Select bookmark"${checked}></label></td>
      <td class="col-title">${title}</td>
      <td class="col-url">${urlLink}</td>
      <td class="col-tags">${tagsEsc}</td>
      <td class="col-time">${time}</td>
      <td class="col-storage">${storage}</td>
      <td class="col-shared">${shared}</td>
      <td class="col-toread">${toread}</td>
    `
    elements.tableBody.appendChild(tr)
  }
  updateSelectAllState()
}

/** [REQ-LOCAL_BOOKMARKS_INDEX] Toggle selection for one row; call after checkbox change. */
function onRowSelectChange (url, checked) {
  if (checked) selectedUrls.add(url)
  else selectedUrls.delete(url)
  updateMoveControlsState()
}

/** [REQ-LOCAL_BOOKMARKS_INDEX] Update header "select all" checkbox to reflect current visible selection. */
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

/** [REQ-LOCAL_BOOKMARKS_INDEX] [REQ-MOVE_BOOKMARK_STORAGE_UI] Enable/disable move-selected controls based on selection. */
function updateMoveControlsState () {
  const hasSelection = selectedUrls.size > 0
  if (elements.moveTargetSelect) elements.moveTargetSelect.disabled = !hasSelection
  if (elements.moveButton) elements.moveButton.disabled = !hasSelection
  updateSelectAllState()
}

/**
 * [REQ-LOCAL_BOOKMARKS_INDEX] [REQ-MOVE_BOOKMARK_STORAGE_UI] Move all selected bookmarks to the chosen storage backend.
 * Uses existing moveBookmarkToStorage message per URL; then refreshes table and clears selection.
 */
async function moveSelectedToStorage () {
  const target = elements.moveTargetSelect && elements.moveTargetSelect.value
  if (!target || selectedUrls.size === 0) return
  const urls = Array.from(selectedUrls)
  if (elements.moveButton) elements.moveButton.disabled = true
  let ok = 0
  let fail = 0
  for (const url of urls) {
    try {
      const res = await chrome.runtime.sendMessage({ type: MESSAGE_TYPE_MOVE, data: { url, targetBackend: target } })
      if (res && res.success) ok++
      else fail++
    } catch (e) {
      console.warn('[IMPL-LOCAL_BOOKMARKS_INDEX] moveBookmarkToStorage failed for', url, e)
      fail++
    }
  }
  selectedUrls.clear()
  await loadBookmarks()
  updateMoveControlsState()
  if (fail > 0) console.warn('[IMPL-LOCAL_BOOKMARKS_INDEX] Move completed:', ok, 'moved,', fail, 'failed')
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
    sortAsc = key === 'time' ? false : true
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
 * [REQ-LOCAL_BOOKMARKS_INDEX_EXPORT] [ARCH-LOCAL_BOOKMARKS_INDEX_EXPORT] [IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT]
 * Escape a field for CSV: wrap in double quotes, escape internal " as "".
 */
function escapeCsvField (str) {
  if (str == null) return '""'
  const s = String(str).replace(/"/g, '""')
  return `"${s}"`
}

/**
 * [IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT] Build CSV string from bookmark array. Columns: Title, URL, Tags, Time, Storage, Shared, To read, Notes.
 */
function buildCsv (bookmarks) {
  const header = 'Title,URL,Tags,Time,Storage,Shared,To read,Notes'
  const rows = bookmarks.map(b => {
    const title = b.description ?? ''
    const url = b.url ?? ''
    const tags = Array.isArray(b.tags) ? b.tags.join(', ') : String(b.tags ?? '')
    const time = b.time ? new Date(b.time).toISOString() : ''
    const storage = b.storage === 'sync' ? 'Sync' : (b.storage === 'file' ? 'File' : 'Local')
    const shared = b.shared === 'no' ? 'Private' : 'Public'
    const toread = b.toread === 'yes' ? 'Yes' : 'No'
    const notes = b.extended ?? ''
    return [escapeCsvField(title), escapeCsvField(url), escapeCsvField(tags), escapeCsvField(time), escapeCsvField(storage), escapeCsvField(shared), escapeCsvField(toread), escapeCsvField(notes)].join(',')
  })
  return [header, ...rows].join('\r\n')
}

/**
 * [IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT] Trigger download of a blob as a file.
 */
function downloadBlob (blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * [REQ-LOCAL_BOOKMARKS_INDEX_EXPORT] [ARCH-LOCAL_BOOKMARKS_INDEX_EXPORT] [IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT]
 * Export bookmarks to CSV. scope: 'all' | 'displayed'.
 */
function exportBookmarks (scope) {
  const list = scope === 'all' ? allBookmarks : filteredBookmarks
  if (!list || list.length === 0) return
  const csv = buildCsv(list)
  const date = new Date().toISOString().slice(0, 10)
  const filename = `hoverboard-bookmarks-${scope}-${date}.csv`
  const blob = new Blob([csv], { type: 'text/csv; charset=utf-8' })
  downloadBlob(blob, filename)
}

/**
 * [IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT] Enable/disable export buttons based on data availability.
 */
function updateExportButtonState () {
  if (elements.exportAll) elements.exportAll.disabled = allBookmarks.length === 0
  if (elements.exportDisplayed) elements.exportDisplayed.disabled = filteredBookmarks.length === 0
}

async function loadBookmarks () {
  try {
    const response = await chrome.runtime.sendMessage({ type: MESSAGE_TYPE_AGGREGATED })
    let list = response?.data?.bookmarks ?? response?.bookmarks
    if (!Array.isArray(list)) {
      const fallback = await chrome.runtime.sendMessage({ type: MESSAGE_TYPE_LOCAL })
      list = fallback?.data?.bookmarks ?? fallback?.bookmarks ?? []
      list = list.map(b => ({ ...b, storage: 'local' }))
    }
    allBookmarks = Array.isArray(list) ? list : []
    applySearchAndFilter()
    toggleEmptyState()
    updateExportButtonState()
    updateMoveControlsState()
  } catch (err) {
    console.error('[IMPL-LOCAL_BOOKMARKS_INDEX] loadBookmarks failed:', err)
    allBookmarks = []
    elements.emptyState.innerHTML = '<p>Failed to load bookmarks. Try again later.</p>'
    elements.emptyState.classList.remove('hidden')
    elements.tableWrapper.classList.add('hidden')
    updateExportButtonState()
  }
}

function init () {
  elements.searchInput.addEventListener('input', applySearchAndFilter)
  elements.searchClear.addEventListener('click', () => {
    elements.searchInput.value = ''
    applySearchAndFilter()
  })
  elements.filterTags.addEventListener('input', applySearchAndFilter)
  elements.filterToread.addEventListener('change', applySearchAndFilter)
  elements.filterPrivate.addEventListener('change', applySearchAndFilter)
  if (elements.filterStorage) elements.filterStorage.addEventListener('change', applySearchAndFilter)

  if (elements.exportAll) elements.exportAll.addEventListener('click', () => exportBookmarks('all'))
  if (elements.exportDisplayed) elements.exportDisplayed.addEventListener('click', () => exportBookmarks('displayed'))

  elements.table.querySelectorAll('th.sortable').forEach(th => {
    th.addEventListener('click', () => setSort(th.dataset.sort))
  })

  if (elements.selectAll) {
    elements.selectAll.addEventListener('change', () => {
      const visible = filteredBookmarks.map(b => b.url).filter(Boolean)
      if (elements.selectAll.checked) {
        visible.forEach(u => selectedUrls.add(u))
      } else {
        visible.forEach(u => selectedUrls.delete(u))
      }
      renderTableBody()
      updateMoveControlsState()
    })
  }
  elements.tableBody.addEventListener('change', (e) => {
    const cb = e.target.closest('.row-select')
    if (cb && cb.dataset.url !== undefined) {
      onRowSelectChange(cb.dataset.url, cb.checked)
    }
  })

  if (elements.moveButton) elements.moveButton.addEventListener('click', () => moveSelectedToStorage())

  loadBookmarks()
  updateMoveControlsState()
}

init()
