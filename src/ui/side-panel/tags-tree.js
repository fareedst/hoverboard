/**
 * [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]
 * Side panel entry script. Load bookmarks, load config, apply filter/sort/group, render config toggle and controls, tag selector, tree or grouped list; click URL opens in new tab.
 *
 * [REQ-SIDE_PANEL_BOOKMARK_SEARCH] [ARCH-SIDE_PANEL_BOOKMARK_SEARCH] [IMPL-SIDE_PANEL_BOOKMARK_SEARCH]
 * Search over displayed list; count; Next/Previous with scroll and highlight.
 */

import { buildTagToBookmarks, getAllTagsFromBookmarks, getTagsToDisplay, openUrlInNewTab } from './tags-tree-data.js'
import { applyFilters, sortBookmarks, groupBookmarksBy, filterBookmarksBySearch } from './tags-tree-filter.js'
import { parseTimeRangeValue } from '../bookmarks-table/bookmarks-table-filter.js'

const MESSAGE_TYPE_AGGREGATED = 'getAggregatedBookmarksForIndex'
const STORAGE_KEY_SELECTED_TAGS = 'hoverboard_sidepanel_selected_tags'
const STORAGE_KEY_COLLAPSED = 'hoverboard_sidepanel_collapsed'
const STORAGE_KEY_PANEL_CONFIG = 'hoverboard_sidepanel_config'

let rawBookmarks = []
let tagToBookmarks = new Map()
let allTags = []
let selectedTagOrder = []
let collapsedTags = new Set()
let collapsedSections = new Set()
/** @type {{ expanded: boolean, timeField: string, timeStart: number|null, timeEnd: number|null, tagsInclude: Set<string>, domains: Set<string>, groupBy: string, sortBy: string, sortAsc: boolean, showAllTags: boolean }} */
let panelConfig = {
  expanded: false,
  timeField: 'updated_at',
  timeStart: null,
  timeEnd: null,
  tagsInclude: new Set(),
  domains: new Set(),
  groupBy: 'none',
  sortBy: 'updated_at',
  sortAsc: false,
  showAllTags: true
}

const tagSelectorEl = document.getElementById('tagSelector')
const treeContainerEl = document.getElementById('treeContainer')
const emptyStateEl = document.getElementById('emptyState')
const loadErrorEl = document.getElementById('loadError')
const configToggleEl = document.getElementById('configToggle')
const configContentEl = document.getElementById('configContent')
const filterTimeFieldEl = document.getElementById('filterTimeField')
const filterTimeStartEl = document.getElementById('filterTimeStart')
const filterTimeEndEl = document.getElementById('filterTimeEnd')
const filterTagsIncludeEl = document.getElementById('filterTagsInclude')
const filterDomainsEl = document.getElementById('filterDomains')
const groupByEl = document.getElementById('groupBy')
const sortByEl = document.getElementById('sortBy')
const sortAscEl = document.getElementById('sortAsc')
// [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE] Toggle: show all tags vs only checked tags; state persisted in panel config.
const tagListViewToggleEl = document.getElementById('tagListViewToggle')

// [REQ-SIDE_PANEL_BOOKMARK_SEARCH] [ARCH-SIDE_PANEL_BOOKMARK_SEARCH] [IMPL-SIDE_PANEL_BOOKMARK_SEARCH] Search state and refs for count and Next/Prev.
let searchQuery = ''
let searchMatchIndex = 0
/** @type {Array<object>} Flat list of bookmarks in current display order (after search filter) for match count and scroll-to. */
let matchingBookmarks = []
const searchInputEl = document.getElementById('searchInput')
const searchCountEl = document.getElementById('searchCount')
const searchPrevEl = document.getElementById('searchPrev')
const searchNextEl = document.getElementById('searchNext')

/** Placeholder bookmarks for ?screenshot=1 / ?demo=1 (README and demos). */
const MOCK_BOOKMARKS = [
  { url: 'https://example.com', description: 'Example', tags: ['work'] },
  { url: 'https://example.org', description: 'Example Org', tags: ['work', 'personal'] },
  { url: 'https://example.net', description: 'Sample Page', tags: ['personal'] }
]

/**
 * [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]
 * loadPanelConfig: implements config state persistence; reads expanded, timeField, timeStart, timeEnd, domains, groupBy, sortBy, sortAsc from chrome.storage.local; defaults for missing keys.
 */
function loadPanelConfig () {
  return new Promise((resolve) => {
    chrome.storage.local.get(STORAGE_KEY_PANEL_CONFIG, (o) => {
      const c = o[STORAGE_KEY_PANEL_CONFIG]
      const expanded = c?.expanded === true
      const timeField = c?.timeField === 'time' ? 'time' : 'updated_at'
      const timeStart = c?.timeStart != null ? c.timeStart : null
      const timeEnd = c?.timeEnd != null ? c.timeEnd : null
      const tagsInclude = new Set(Array.isArray(c?.tagsInclude) ? c.tagsInclude.filter(Boolean) : [])
      const domains = new Set(Array.isArray(c?.domains) ? c.domains : [])
      const groupBy = c?.groupBy === 'time' || c?.groupBy === 'updated_at' || c?.groupBy === 'tag' || c?.groupBy === 'domain' ? c.groupBy : 'none'
      const sortBy = c?.sortBy === 'time' || c?.sortBy === 'updated_at' || c?.sortBy === 'tag' || c?.sortBy === 'domain' ? c.sortBy : 'updated_at'
      const sortAsc = c?.sortAsc === true
      const showAllTags = c?.showAllTags !== false
      panelConfig = { expanded, timeField, timeStart, timeEnd, tagsInclude, domains, groupBy, sortBy, sortAsc, showAllTags }
      resolve(panelConfig)
    })
  })
}

/**
 * [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]
 * savePanelConfig: persists config to chrome.storage.local; domains stored as array.
 */
function savePanelConfig () {
  const c = {
    expanded: panelConfig.expanded,
    timeField: panelConfig.timeField,
    timeStart: panelConfig.timeStart,
    timeEnd: panelConfig.timeEnd,
    tagsInclude: Array.from(panelConfig.tagsInclude),
    domains: Array.from(panelConfig.domains),
    groupBy: panelConfig.groupBy,
    sortBy: panelConfig.sortBy,
    sortAsc: panelConfig.sortAsc,
    showAllTags: panelConfig.showAllTags
  }
  chrome.storage.local.set({ [STORAGE_KEY_PANEL_CONFIG]: c })
}

/**
 * [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]
 * renderConfigToggle: when collapsed shows only compact bar; when expanded shows full config content. Implements expandable/collapsible config region.
 */
function renderConfigToggle () {
  const expanded = panelConfig.expanded
  if (configToggleEl) {
    configToggleEl.setAttribute('aria-expanded', String(expanded))
    const chevron = configToggleEl.querySelector('.config-toggle-chevron')
    if (chevron) chevron.style.transform = expanded ? 'rotate(180deg)' : ''
  }
  if (configContentEl) configContentEl.classList.toggle('hidden', !expanded)
}

/**
 * Sync panelConfig from DOM controls (after user change). Sub-block: reads current control values into panelConfig.
 */
function syncConfigFromControls () {
  panelConfig.timeField = filterTimeFieldEl?.value === 'time' ? 'time' : 'updated_at'
  panelConfig.timeStart = filterTimeStartEl?.value ? parseTimeRangeValue(filterTimeStartEl.value) : null
  panelConfig.timeEnd = filterTimeEndEl?.value ? parseTimeRangeValue(filterTimeEndEl.value) : null
  const tagsStr = (filterTagsIncludeEl?.value || '').trim()
  panelConfig.tagsInclude = new Set(tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [])
  const domainStr = (filterDomainsEl?.value || '').trim()
  panelConfig.domains = new Set(domainStr ? domainStr.split(',').map(d => d.trim().toLowerCase()).filter(Boolean) : [])
  panelConfig.groupBy = groupByEl?.value || 'none'
  panelConfig.sortBy = sortByEl?.value || 'updated_at'
  panelConfig.sortAsc = sortAscEl?.value === '1'
}

/**
 * Sync DOM controls from panelConfig (e.g. after load). Sub-block: writes config to controls.
 */
function syncControlsFromConfig () {
  if (filterTimeFieldEl) filterTimeFieldEl.value = panelConfig.timeField
  if (filterTimeStartEl) filterTimeStartEl.value = panelConfig.timeStart != null ? new Date(panelConfig.timeStart).toISOString().slice(0, 16) : ''
  if (filterTimeEndEl) filterTimeEndEl.value = panelConfig.timeEnd != null ? new Date(panelConfig.timeEnd).toISOString().slice(0, 16) : ''
  if (filterTagsIncludeEl) filterTagsIncludeEl.value = Array.from(panelConfig.tagsInclude).join(', ')
  if (filterDomainsEl) filterDomainsEl.value = Array.from(panelConfig.domains).join(', ')
  if (groupByEl) groupByEl.value = panelConfig.groupBy
  if (sortByEl) sortByEl.value = panelConfig.sortBy
  if (sortAscEl) sortAscEl.value = panelConfig.sortAsc ? '1' : '0'
}

/**
 * Load placeholder data when ?screenshot=1 or ?demo=1 so the panel can be captured with consistent content.
 */
function loadPlaceholderForScreenshot () {
  loadErrorEl.classList.add('hidden')
  emptyStateEl.classList.add('hidden')
  tagToBookmarks = buildTagToBookmarks(MOCK_BOOKMARKS)
  allTags = getAllTagsFromBookmarks(MOCK_BOOKMARKS)
  selectedTagOrder = [...allTags]
  collapsedTags = new Set()
  if (tagListViewToggleEl) tagListViewToggleEl.checked = panelConfig.showAllTags
  renderTagSelector()
  renderTree()
}

/**
 * [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE] [IMPL-LOCAL_BOOKMARKS_INDEX]
 * loadBookmarks: getAggregatedBookmarksForIndex then load config, apply filters (time, tags include, domain), sort, then either group+renderGrouped or buildTagToBookmarks+renderTree. Implements filter pipeline and display sort/group.
 */
async function loadBookmarks () {
  loadErrorEl.classList.add('hidden')
  try {
    await loadPanelConfig()
    renderConfigToggle()
    syncControlsFromConfig()
    if (tagListViewToggleEl) tagListViewToggleEl.checked = panelConfig.showAllTags
    selectedTagOrder = await loadSelectedTagOrder()
    allTags = [] // set after we have bookmarks
    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: MESSAGE_TYPE_AGGREGATED }, (r) => {
        if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message))
        else resolve(r)
      })
    })
    const bookmarks = response?.bookmarks ?? (response?.data?.bookmarks ?? (Array.isArray(response) ? response : []))
    if (!Array.isArray(bookmarks)) {
      loadErrorEl.textContent = 'No bookmark data received.'
      loadErrorEl.classList.remove('hidden')
      return
    }
    rawBookmarks = bookmarks
    allTags = getAllTagsFromBookmarks(bookmarks)
    if (selectedTagOrder.length === 0) selectedTagOrder = [...allTags]
    collapsedTags = await loadCollapsedState()
    collapsedSections = new Set()
    const filterState = {
      timeField: panelConfig.timeField,
      timeStart: panelConfig.timeStart,
      timeEnd: panelConfig.timeEnd,
      tagsInclude: panelConfig.tagsInclude.size > 0 ? panelConfig.tagsInclude : new Set(selectedTagOrder),
      domains: panelConfig.domains
    }
    const filtered = applyFilters(bookmarks, filterState)
    const sorted = sortBookmarks(filtered, panelConfig.sortBy, panelConfig.sortAsc)
    // [REQ-SIDE_PANEL_BOOKMARK_SEARCH] [ARCH-SIDE_PANEL_BOOKMARK_SEARCH] [IMPL-SIDE_PANEL_BOOKMARK_SEARCH] Apply text search to displayed list; use matchingBookmarks for tree/grouped and count.
    matchingBookmarks = (searchQuery && searchQuery.trim()) ? filterBookmarksBySearch(sorted, searchQuery) : sorted
    if (panelConfig.groupBy && panelConfig.groupBy !== 'none') {
      const grouped = groupBookmarksBy(matchingBookmarks, panelConfig.groupBy)
      renderGrouped(grouped)
      const hasContent = grouped && grouped.size > 0
      emptyStateEl.classList.toggle('hidden', hasContent)
    } else {
      tagToBookmarks = buildTagToBookmarks(matchingBookmarks)
      renderTagSelector()
      renderTree()
      const hasContent = selectedTagOrder.length > 0 && selectedTagOrder.some(t => tagToBookmarks.has(t) && tagToBookmarks.get(t).length > 0)
      emptyStateEl.classList.toggle('hidden', hasContent)
    }
    updateSearchCount()
    if (matchingBookmarks.length > 0 && searchMatchIndex >= matchingBookmarks.length) searchMatchIndex = 0
    scrollToMatch(searchMatchIndex)
  } catch (err) {
    loadErrorEl.textContent = err?.message || 'Failed to load bookmarks.'
    loadErrorEl.classList.remove('hidden')
  }
}

function loadSelectedTagOrder () {
  return new Promise((resolve) => {
    chrome.storage.local.get(STORAGE_KEY_SELECTED_TAGS, (o) => {
      const v = o[STORAGE_KEY_SELECTED_TAGS]
      resolve(Array.isArray(v) ? v : [])
    })
  })
}

function saveSelectedTagOrder (order) {
  chrome.storage.local.set({ [STORAGE_KEY_SELECTED_TAGS]: order })
}

function loadCollapsedState () {
  return new Promise((resolve) => {
    chrome.storage.local.get(STORAGE_KEY_COLLAPSED, (o) => {
      const v = o[STORAGE_KEY_COLLAPSED]
      resolve(Array.isArray(v) ? new Set(v) : new Set())
    })
  })
}

function saveCollapsedState () {
  chrome.storage.local.set({ [STORAGE_KEY_COLLAPSED]: Array.from(collapsedTags) })
}

/** [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE] Renders tag selector (checkboxes) for visible tags from getTagsToDisplay; implements tag selection/order UI and compact layout; persists selectedTagOrder. */
function renderTagSelector () {
  if (!tagSelectorEl) return
  const visibleTags = getTagsToDisplay(allTags, selectedTagOrder, panelConfig.showAllTags)
  tagSelectorEl.innerHTML = ''
  for (const tag of visibleTags) {
    const label = document.createElement('label')
    const cb = document.createElement('input')
    cb.type = 'checkbox'
    cb.value = tag
    cb.checked = selectedTagOrder.includes(tag)
    cb.addEventListener('change', () => {
      if (cb.checked) selectedTagOrder.push(tag)
      else selectedTagOrder = selectedTagOrder.filter(t => t !== tag)
      saveSelectedTagOrder(selectedTagOrder)
      refreshFromConfig()
    })
    label.appendChild(cb)
    label.appendChild(document.createTextNode(tag))
    tagSelectorEl.appendChild(label)
  }
}

/**
 * [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]
 * renderGrouped: when groupBy is not none, render section headers (collapsible) and list of bookmark links per group; click URL opens in new tab. Implements sectioned display.
 * [REQ-SIDE_PANEL_BOOKMARK_SEARCH] [IMPL-SIDE_PANEL_BOOKMARK_SEARCH] Sets data-search-index on each link for scroll/highlight.
 * @param {Map<string, Array<object>>} grouped
 */
function renderGrouped (grouped) {
  if (!grouped || !treeContainerEl) return
  treeContainerEl.innerHTML = ''
  const tagSelectorSection = document.querySelector('.tag-selector-section')
  if (tagSelectorSection) tagSelectorSection.classList.add('hidden')
  let searchRenderIndex = 0
  const keys = [...grouped.keys()].sort()
  for (const groupKey of keys) {
    const items = grouped.get(groupKey) || []
    if (items.length === 0) continue
    const section = document.createElement('div')
    section.className = 'tree-tag-section' + (collapsedSections.has(groupKey) ? ' collapsed' : '')
    section.dataset.groupKey = groupKey
    const header = document.createElement('div')
    header.className = 'tree-tag-header'
    header.setAttribute('role', 'button')
    header.setAttribute('aria-expanded', !collapsedSections.has(groupKey))
    const toggle = document.createElement('span')
    toggle.className = 'tree-tag-toggle'
    toggle.textContent = '▼'
    header.appendChild(toggle)
    header.appendChild(document.createTextNode(`${groupKey} (${items.length})`))
    header.addEventListener('click', () => {
      if (collapsedSections.has(groupKey)) collapsedSections.delete(groupKey)
      else collapsedSections.add(groupKey)
      section.classList.toggle('collapsed', collapsedSections.has(groupKey))
      header.setAttribute('aria-expanded', !collapsedSections.has(groupKey))
    })
    const list = document.createElement('ul')
    list.className = 'tree-tag-list'
    for (const b of items) {
      const title = (b.description != null && b.description !== '') ? String(b.description) : (b.url ? String(b.url) : '')
      const url = b.url ? String(b.url) : ''
      const li = document.createElement('li')
      const a = document.createElement('a')
      a.className = 'tree-bookmark-link'
      a.href = url
      a.target = '_blank'
      a.rel = 'noopener'
      a.dataset.searchIndex = String(searchRenderIndex++)
      const titleSpan = document.createElement('span')
      titleSpan.className = 'bookmark-title'
      titleSpan.textContent = title || url
      const urlSpan = document.createElement('span')
      urlSpan.className = 'bookmark-url'
      urlSpan.textContent = url
      a.appendChild(titleSpan)
      a.appendChild(urlSpan)
      a.addEventListener('click', (e) => {
        e.preventDefault()
        openUrlInNewTab(url)
      })
      li.appendChild(a)
      list.appendChild(li)
    }
    section.appendChild(header)
    section.appendChild(list)
    treeContainerEl.appendChild(section)
  }
}

/** [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE] Renders collapsible tree per selected tag with bookmark links; implements tag→URL list and click-to-open (openUrlInNewTab). [REQ-SIDE_PANEL_BOOKMARK_SEARCH] [IMPL-SIDE_PANEL_BOOKMARK_SEARCH] Sets data-search-index on each link for scroll/highlight. */
function renderTree () {
  const tagSelectorSection = document.querySelector('.tag-selector-section')
  if (tagSelectorSection) tagSelectorSection.classList.remove('hidden')
  treeContainerEl.innerHTML = ''
  let searchRenderIndex = 0
  for (const tag of selectedTagOrder) {
    const entries = tagToBookmarks.get(tag) || []
    if (entries.length === 0) continue
    const section = document.createElement('div')
    section.className = 'tree-tag-section' + (collapsedTags.has(tag) ? ' collapsed' : '')
    section.dataset.tag = tag
    const header = document.createElement('div')
    header.className = 'tree-tag-header'
    header.setAttribute('role', 'button')
    header.setAttribute('aria-expanded', !collapsedTags.has(tag))
    const toggle = document.createElement('span')
    toggle.className = 'tree-tag-toggle'
    toggle.textContent = '▼'
    header.appendChild(toggle)
    header.appendChild(document.createTextNode(`${tag} (${entries.length})`))
    header.addEventListener('click', () => {
      if (collapsedTags.has(tag)) collapsedTags.delete(tag)
      else collapsedTags.add(tag)
      saveCollapsedState()
      section.classList.toggle('collapsed', collapsedTags.has(tag))
      header.setAttribute('aria-expanded', !collapsedTags.has(tag))
    })
    const list = document.createElement('ul')
    list.className = 'tree-tag-list'
    for (const { title, url } of entries) {
      const li = document.createElement('li')
      const a = document.createElement('a')
      a.className = 'tree-bookmark-link'
      a.href = url
      a.target = '_blank'
      a.rel = 'noopener'
      a.dataset.searchIndex = String(searchRenderIndex++)
      const titleSpan = document.createElement('span')
      titleSpan.className = 'bookmark-title'
      titleSpan.textContent = title || url
      const urlSpan = document.createElement('span')
      urlSpan.className = 'bookmark-url'
      urlSpan.textContent = url
      a.appendChild(titleSpan)
      a.appendChild(urlSpan)
      a.addEventListener('click', (e) => {
        e.preventDefault()
        openUrlInNewTab(url) // [REQ-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE] Implements click URL opens in new tab
      })
      li.appendChild(a)
      list.appendChild(li)
    }
    section.appendChild(header)
    section.appendChild(list)
    treeContainerEl.appendChild(section)
  }
}

/**
 * [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]
 * refreshFromConfig: re-applies filter/sort/group from current config and rawBookmarks, then re-renders. Used when config controls change. Implements config change → re-render.
 */
function refreshFromConfig () {
  syncConfigFromControls()
  savePanelConfig()
  if (!Array.isArray(rawBookmarks) || rawBookmarks.length === 0) return
  const filterState = {
    timeField: panelConfig.timeField,
    timeStart: panelConfig.timeStart,
    timeEnd: panelConfig.timeEnd,
    tagsInclude: panelConfig.tagsInclude.size > 0 ? panelConfig.tagsInclude : new Set(selectedTagOrder),
    domains: panelConfig.domains
  }
  const filtered = applyFilters(rawBookmarks, filterState)
  const sorted = sortBookmarks(filtered, panelConfig.sortBy, panelConfig.sortAsc)
  // [REQ-SIDE_PANEL_BOOKMARK_SEARCH] [ARCH-SIDE_PANEL_BOOKMARK_SEARCH] [IMPL-SIDE_PANEL_BOOKMARK_SEARCH] Apply text search; use matchingBookmarks for tree/grouped and count.
  matchingBookmarks = (searchQuery && searchQuery.trim()) ? filterBookmarksBySearch(sorted, searchQuery) : sorted
  if (panelConfig.groupBy && panelConfig.groupBy !== 'none') {
    const grouped = groupBookmarksBy(matchingBookmarks, panelConfig.groupBy)
    renderGrouped(grouped)
    emptyStateEl.classList.toggle('hidden', grouped && grouped.size > 0)
  } else {
    tagToBookmarks = buildTagToBookmarks(matchingBookmarks)
    renderTagSelector()
    renderTree()
    emptyStateEl.classList.toggle('hidden', selectedTagOrder.length > 0 && selectedTagOrder.some(t => tagToBookmarks.has(t) && tagToBookmarks.get(t).length > 0))
  }
  updateSearchCount()
  if (matchingBookmarks.length > 0 && searchMatchIndex >= matchingBookmarks.length) searchMatchIndex = 0
  scrollToMatch(searchMatchIndex)
}

/**
 * [REQ-SIDE_PANEL_BOOKMARK_SEARCH] [ARCH-SIDE_PANEL_BOOKMARK_SEARCH] [IMPL-SIDE_PANEL_BOOKMARK_SEARCH]
 * Updates the search count text (N matches / No matches). Implements display count of matching records.
 */
function updateSearchCount () {
  if (!searchCountEl) return
  const n = Array.isArray(matchingBookmarks) ? matchingBookmarks.length : 0
  searchCountEl.textContent = n === 0 ? 'No matches' : n + (n === 1 ? ' match' : ' matches')
}

/**
 * [REQ-SIDE_PANEL_BOOKMARK_SEARCH] [ARCH-SIDE_PANEL_BOOKMARK_SEARCH] [IMPL-SIDE_PANEL_BOOKMARK_SEARCH]
 * Scrolls to the Nth matching bookmark link and highlights it. Implements advance to next/previous with scroll and highlight.
 * @param {number} idx 0-based index into matching list
 */
function scrollToMatch (idx) {
  if (!treeContainerEl) return
  const links = treeContainerEl.querySelectorAll('.tree-bookmark-link[data-search-index]')
  const el = links[idx]
  links.forEach(link => link.classList.remove('search-current'))
  if (el) {
    el.classList.add('search-current')
    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }
}

/**
 * [REQ-SIDE_PANEL_BOOKMARK_SEARCH] [ARCH-SIDE_PANEL_BOOKMARK_SEARCH] [IMPL-SIDE_PANEL_BOOKMARK_SEARCH]
 * Wires search input, count, and Previous/Next buttons. Implements search bar and advance to next/previous record.
 */
function attachSearchHandlers () {
  if (searchInputEl) {
    const onSearchChange = () => {
      searchQuery = searchInputEl.value
      searchMatchIndex = 0
      refreshFromConfig()
    }
    searchInputEl.addEventListener('input', onSearchChange)
    searchInputEl.addEventListener('change', onSearchChange)
  }
  if (searchPrevEl) {
    searchPrevEl.addEventListener('click', () => {
      const total = matchingBookmarks.length
      if (total === 0) return
      searchMatchIndex = (searchMatchIndex - 1 + total) % total
      scrollToMatch(searchMatchIndex)
    })
  }
  if (searchNextEl) {
    searchNextEl.addEventListener('click', () => {
      const total = matchingBookmarks.length
      if (total === 0) return
      searchMatchIndex = (searchMatchIndex + 1) % total
      scrollToMatch(searchMatchIndex)
    })
  }
}

/**
 * [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE]
 * Config toggle click: implements expand/collapse; save expanded state and show/hide config content.
 */
function attachConfigHandlers () {
  if (configToggleEl) {
    configToggleEl.addEventListener('click', () => {
      panelConfig.expanded = !panelConfig.expanded
      savePanelConfig()
      renderConfigToggle()
    })
  }
  const configInputs = [filterTimeFieldEl, filterTimeStartEl, filterTimeEndEl, filterTagsIncludeEl, filterDomainsEl, groupByEl, sortByEl, sortAscEl]
  configInputs.forEach(el => {
    if (el) el.addEventListener('change', refreshFromConfig)
  })
  if (filterTagsIncludeEl) filterTagsIncludeEl.addEventListener('blur', refreshFromConfig)
  if (filterDomainsEl) filterDomainsEl.addEventListener('blur', refreshFromConfig)
  // [REQ-SIDE_PANEL_TAGS_TREE] [ARCH-SIDE_PANEL_TAGS_TREE] [IMPL-SIDE_PANEL_TAGS_TREE] ON tag list view toggle: update showAllTags, save config, re-render tag selector only.
  if (tagListViewToggleEl) {
    tagListViewToggleEl.addEventListener('change', () => {
      panelConfig.showAllTags = !!tagListViewToggleEl.checked
      savePanelConfig()
      renderTagSelector()
    })
  }
}

// Export for unit test (open URL in new tab)
export { openUrlInNewTab }

document.addEventListener('DOMContentLoaded', () => {
  attachConfigHandlers()
  attachSearchHandlers()
  const params = new URLSearchParams(typeof window !== 'undefined' && window.location ? window.location.search : '')
  if (params.get('screenshot') === '1' || params.get('demo') === '1') {
    loadPlaceholderForScreenshot()
  } else {
    loadBookmarks()
  }
})
