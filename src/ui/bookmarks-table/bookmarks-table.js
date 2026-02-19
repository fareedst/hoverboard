/**
 * Local Bookmarks Index - [REQ-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX]
 * Loads local + file bookmarks via getAggregatedBookmarksForIndex (Storage column). Fallback: getLocalBookmarksForIndex.
 * Export: [REQ-LOCAL_BOOKMARKS_INDEX_EXPORT] [ARCH-LOCAL_BOOKMARKS_INDEX_EXPORT] [IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT]
 * Import: [REQ-LOCAL_BOOKMARKS_INDEX_IMPORT] [ARCH-LOCAL_BOOKMARKS_INDEX_IMPORT] [IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT]
 */

import { matchStorageFilter } from './bookmarks-table-filter.js'
import { buildCsv, parseCsv } from './bookmarks-table-csv.js'
import { formatTimeAbsolute, formatTimeAge } from './bookmarks-table-time.js'

const MESSAGE_TYPE_AGGREGATED = 'getAggregatedBookmarksForIndex'
const MESSAGE_TYPE_LOCAL = 'getLocalBookmarksForIndex'
const MESSAGE_TYPE_MOVE = 'moveBookmarkToStorage'
const MESSAGE_TYPE_SAVE = 'saveBookmark'

let allBookmarks = []
let filteredBookmarks = []
let sortKey = 'time'
let sortAsc = false
/** [REQ-LOCAL_BOOKMARKS_INDEX] [REQ-BOOKMARK_CREATE_UPDATE_TIMES] Time column: which value to show (time = create, updated_at = last updated). Default: last updated. */
let timeColumnSource = 'updated_at'
/** [REQ-LOCAL_BOOKMARKS_INDEX] Time column display: 'absolute' (YYYY-MM-DD HH:mm:ss) or 'age' (e.g. N days O hours). Default: age at page load. */
let timeDisplayMode = 'age'
/** [REQ-LOCAL_BOOKMARKS_INDEX] Selected bookmark URLs for bulk operations (e.g. move to storage). */
const selectedUrls = new Set()

const elements = {
  searchInput: document.getElementById('search-input'),
  searchClear: document.getElementById('search-clear'),
  filterTags: document.getElementById('filter-tags'),
  filterToread: document.getElementById('filter-toread'),
  filterPrivate: document.getElementById('filter-private'),
  filterStorage: document.getElementById('filter-storage'),
  timeColumnSource: document.getElementById('time-column-source'),
  timeDisplayMode: document.getElementById('time-display-mode'),
  exportAll: document.getElementById('export-all'),
  exportDisplayed: document.getElementById('export-displayed'),
  exportSelected: document.getElementById('export-selected'),
  emptyState: document.getElementById('empty-state'),
  tableWrapper: document.getElementById('table-wrapper'),
  tableBody: document.getElementById('table-body'),
  rowCount: document.getElementById('row-count'),
  table: document.getElementById('bookmarks-table'),
  selectAll: document.getElementById('select-all'),
  moveTargetSelect: document.getElementById('move-target'),
  moveButton: document.getElementById('move-selected-btn'),
  importFile: document.getElementById('import-file'),
  importTrigger: document.getElementById('import-trigger'),
  importTarget: document.getElementById('import-target'),
  importResult: document.getElementById('import-result')
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
  /** [REQ-LOCAL_BOOKMARKS_INDEX] [REQ-BOOKMARK_CREATE_UPDATE_TIMES] When sorting by Time column, use timeColumnSource so order matches displayed value. */
  const effectiveKey = sortKey === 'time' ? timeColumnSource : sortKey
  const va = a[effectiveKey]
  const vb = b[effectiveKey]
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
    const timeValue = b[timeColumnSource] ?? b.time
    const time = escapeHtml(
      timeDisplayMode === 'absolute'
        ? formatTimeAbsolute(timeValue)
        : formatTimeAge(timeValue)
    )
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
  updateExportButtonState()
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
    sortAsc = key !== 'time'
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
 * Export bookmarks to CSV. scope: 'all' | 'displayed' | 'selected'.
 */
function exportBookmarks (scope) {
  let list
  if (scope === 'all') list = allBookmarks
  else if (scope === 'displayed') list = filteredBookmarks
  else if (scope === 'selected') list = allBookmarks.filter(b => selectedUrls.has(b.url || ''))
  else return
  if (!list || list.length === 0) return
  const csv = buildCsv(list)
  const date = new Date().toISOString().slice(0, 10)
  const filename = `hoverboard-bookmarks-${scope}-${date}.csv`
  const blob = new Blob([csv], { type: 'text/csv; charset=utf-8' })
  downloadBlob(blob, filename)
}

/**
 * [IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT] Enable/disable export buttons based on data availability and selection.
 * Export selected: enabled only when at least one bookmark is selected.
 */
function updateExportButtonState () {
  if (elements.exportAll) elements.exportAll.disabled = allBookmarks.length === 0
  if (elements.exportDisplayed) elements.exportDisplayed.disabled = filteredBookmarks.length === 0
  if (elements.exportSelected) elements.exportSelected.disabled = selectedUrls.size === 0
}

/**
 * [REQ-LOCAL_BOOKMARKS_INDEX_IMPORT] [ARCH-LOCAL_BOOKMARKS_INDEX_IMPORT] [IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT]
 * Normalize a raw object from JSON import to bookmark payload (url, description, tags array, time, shared, toread, extended).
 */
function normalizeJsonBookmark (raw) {
  const url = (raw.url || '').trim()
  if (!url) return null
  const tags = raw.tags == null ? [] : Array.isArray(raw.tags) ? raw.tags : String(raw.tags).split(/\s+/).filter(Boolean)
  const time = (raw.time ?? '').trim()
  return {
    url,
    description: (raw.description ?? '').trim(),
    extended: (raw.extended ?? '').trim(),
    tags,
    time,
    updated_at: (raw.updated_at ?? time ?? '').trim(),
    shared: raw.shared === 'no' ? 'no' : 'yes',
    toread: raw.toread === 'yes' ? 'yes' : 'no'
  }
}

/**
 * [REQ-LOCAL_BOOKMARKS_INDEX_IMPORT] [ARCH-LOCAL_BOOKMARKS_INDEX_IMPORT] [IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT]
 * Parse file content (CSV or JSON) into array of bookmark-like objects. Returns [] on parse error.
 */
function parseImportFile (text, filename) {
  const lower = (filename || '').toLowerCase()
  if (lower.endsWith('.json')) {
    try {
      const data = JSON.parse(text)
      const arr = Array.isArray(data) ? data : [data]
      return arr.map(normalizeJsonBookmark).filter(Boolean)
    } catch (e) {
      console.warn('[IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT] JSON parse failed:', e)
      return []
    }
  }
  return parseCsv(text)
}

/**
 * [REQ-LOCAL_BOOKMARKS_INDEX_IMPORT] [ARCH-LOCAL_BOOKMARKS_INDEX_IMPORT] [IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT]
 * Run import: parse file, optionally filter to only new URLs, send saveBookmark per row, refresh, show result.
 */
async function runImport (file) {
  if (!file || !elements.importResult) return
  elements.importResult.textContent = ''
  const onlyNew = document.querySelector('input[name="import-mode"]:checked')?.value === 'only-new'
  const preferredBackend = (elements.importTarget && elements.importTarget.value) || 'local'
  let text
  try {
    text = await file.text()
  } catch (e) {
    elements.importResult.textContent = 'Could not read file.'
    console.warn('[IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT] file.text() failed:', e)
    return
  }
  const records = parseImportFile(text, file.name)
  if (records.length === 0) {
    elements.importResult.textContent = 'No valid bookmarks in file (or invalid format).'
    return
  }
  const existingUrls = new Set(allBookmarks.map(b => (b.url || '').trim()).filter(Boolean))
  const toSave = onlyNew ? records.filter(r => !existingUrls.has(r.url)) : records
  const skipped = records.length - toSave.length
  if (elements.importTrigger) elements.importTrigger.disabled = true
  let imported = 0
  let failed = 0
  for (const rec of toSave) {
    try {
      const res = await chrome.runtime.sendMessage({
        type: MESSAGE_TYPE_SAVE,
        data: { ...rec, preferredBackend }
      })
      if (res && res.success) imported++
      else failed++
    } catch (e) {
      console.warn('[IMPL-LOCAL_BOOKMARKS_INDEX_IMPORT] saveBookmark failed for', rec.url, e)
      failed++
    }
  }
  if (elements.importTrigger) elements.importTrigger.disabled = false
  await loadBookmarks()
  const parts = []
  if (imported > 0) parts.push(`Imported ${imported}`)
  if (skipped > 0) parts.push(`skipped ${skipped}`)
  if (failed > 0) parts.push(`${failed} failed`)
  elements.importResult.textContent = parts.length ? parts.join(', ') + '.' : 'Done.'
  if (elements.importFile) elements.importFile.value = ''
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

  if (elements.timeColumnSource) {
    elements.timeColumnSource.addEventListener('change', () => {
      timeColumnSource = elements.timeColumnSource.value
      sortTable()
      renderTableBody()
    })
  }
  if (elements.timeDisplayMode) {
    elements.timeDisplayMode.addEventListener('change', () => {
      timeDisplayMode = elements.timeDisplayMode.value
      renderTableBody()
    })
  }

  if (elements.exportAll) elements.exportAll.addEventListener('click', () => exportBookmarks('all'))
  if (elements.exportDisplayed) elements.exportDisplayed.addEventListener('click', () => exportBookmarks('displayed'))
  if (elements.exportSelected) elements.exportSelected.addEventListener('click', () => exportBookmarks('selected'))

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

  if (elements.importTrigger && elements.importFile) {
    elements.importTrigger.addEventListener('click', () => elements.importFile.click())
    elements.importFile.addEventListener('change', (e) => {
      const file = e.target.files?.[0]
      if (file) runImport(file)
    })
  }

  if (elements.timeColumnSource) timeColumnSource = elements.timeColumnSource.value
  if (elements.timeDisplayMode) timeDisplayMode = elements.timeDisplayMode.value

  loadBookmarks()
  updateMoveControlsState()
}

init()
