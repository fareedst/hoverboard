/**
 * Local Bookmarks Index - [REQ-LOCAL_BOOKMARKS_INDEX] [ARCH-LOCAL_BOOKMARKS_INDEX] [IMPL-LOCAL_BOOKMARKS_INDEX]
 * Loads local + file bookmarks via getAggregatedBookmarksForIndex (Storage column). Fallback: getLocalBookmarksForIndex.
 * Export: [REQ-LOCAL_BOOKMARKS_INDEX_EXPORT] [ARCH-LOCAL_BOOKMARKS_INDEX_EXPORT] [IMPL-LOCAL_BOOKMARKS_INDEX_EXPORT]
 */

const MESSAGE_TYPE_AGGREGATED = 'getAggregatedBookmarksForIndex'
const MESSAGE_TYPE_LOCAL = 'getLocalBookmarksForIndex'

let allBookmarks = []
let filteredBookmarks = []
let sortKey = 'time'
let sortAsc = false

const elements = {
  searchInput: document.getElementById('search-input'),
  searchClear: document.getElementById('search-clear'),
  filterTags: document.getElementById('filter-tags'),
  filterToread: document.getElementById('filter-toread'),
  filterPrivate: document.getElementById('filter-private'),
  exportAll: document.getElementById('export-all'),
  exportDisplayed: document.getElementById('export-displayed'),
  emptyState: document.getElementById('empty-state'),
  tableWrapper: document.getElementById('table-wrapper'),
  tableBody: document.getElementById('table-body'),
  rowCount: document.getElementById('row-count'),
  table: document.getElementById('bookmarks-table')
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
    const title = escapeHtml(b.description || '(no title)')
    const url = escapeHtml(b.url || '')
    const tagsStr = Array.isArray(b.tags) ? b.tags.join(', ') : String(b.tags || '')
    const tagsEsc = escapeHtml(tagsStr)
    const time = escapeHtml(b.time ? new Date(b.time).toLocaleString() : '')
    const shared = b.shared === 'no' ? 'Private' : 'Public'
    const toread = b.toread === 'yes' ? 'Yes' : 'No'
    const storage = escapeHtml(b.storage === 'sync' ? 'Sync' : (b.storage === 'file' ? 'File' : 'Local'))
    const urlLink = b.url
      ? `<a href="${escapeHtml(b.url)}" target="_blank" rel="noopener" class="url-link">${url}</a>`
      : url
    tr.innerHTML = `
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

  if (elements.exportAll) elements.exportAll.addEventListener('click', () => exportBookmarks('all'))
  if (elements.exportDisplayed) elements.exportDisplayed.addEventListener('click', () => exportBookmarks('displayed'))

  elements.table.querySelectorAll('th.sortable').forEach(th => {
    th.addEventListener('click', () => setSort(th.dataset.sort))
  })

  loadBookmarks()
}

init()
