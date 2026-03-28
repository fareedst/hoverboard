/**
 * [REQ-SIDE_PANEL_POPUP_EQUIVALENT] This Page: three-way tag label casing (original | lower | upper);
 * display and add-from-chip use the same mapped string; remove uses stored tag.
 * [REQ-THIS_PAGE_TAG_SORT] Shim includes tag sort toggle (side-panel parity).
 */

import { UIManager } from '../../src/ui/popup/UIManager.js'

/** Append minimal Bookmark-tab markup as direct children of `container` (scoped querySelector). */
function appendTagCaseShim (container) {
  const html = `
    <div class="tag-case-folding" data-popup-ref="tagCaseFoldingToggle" role="toolbar" aria-label="Tag label casing">
      <span class="tag-case-folding-label" id="tag-case-folding-label-uim-test">Tag labels</span>
      <div class="tag-case-folding-buttons">
        <button type="button" class="tag-case-mode-btn" data-case-mode="original" aria-pressed="true">Original</button>
        <button type="button" class="tag-case-mode-btn" data-case-mode="lower" aria-pressed="false">lower</button>
        <button type="button" class="tag-case-mode-btn" data-case-mode="upper" aria-pressed="false">UPPER</button>
      </div>
    </div>
    <div class="tag-sort-toggle" data-popup-ref="tagSortToggle" role="toolbar" aria-label="Tag list sort">
      <div class="tag-sort-toggle-buttons">
        <button type="button" class="tag-sort-mode-btn" data-sort-mode="alphabetical" aria-pressed="true">A–Z</button>
        <button type="button" class="tag-sort-mode-btn" data-sort-mode="frequency" aria-pressed="false">Frequency</button>
        <button type="button" class="tag-sort-mode-btn" data-sort-mode="relevance" aria-pressed="false">Relevance</button>
      </div>
    </div>
    <div data-popup-ref="currentTagsContainer"></div>
    <div data-popup-ref="recentTagsContainer"></div>
    <section data-popup-ref="suggestedTags" style="display:block">
      <div data-popup-ref="suggestedTagsContainer"></div>
    </section>
  `
  container.insertAdjacentHTML('beforeend', html)
}

describe('[REQ-SIDE_PANEL_POPUP_EQUIVALENT] UIManager tag case folding', () => {
  const noop = () => {}

  /** @type {HTMLDivElement} */
  let container

  beforeEach(() => {
    container = document.createElement('div')
    appendTagCaseShim(container)
    document.body.appendChild(container)
  })

  afterEach(() => {
    container?.remove()
  })

  test('default mode is original; recent chip shows source casing and addTag receives it', () => {
    const ui = new UIManager({
      errorHandler: { handleError: noop },
      stateManager: null,
      config: {},
      container
    })
    const addSpy = jest.fn()
    ui.on('addTag', addSpy)
    ui.setupEventListeners()
    ui.updateRecentTags(['ReadLater'])
    const chip = container.querySelector('.tag.recent .tag-text')
    expect(chip?.textContent).toBe('ReadLater')
    chip?.closest('.tag')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(addSpy).toHaveBeenCalledWith('ReadLater')
  })

  test('lower mode: label lowercases and addTag receives lowercased value', () => {
    const ui = new UIManager({
      errorHandler: { handleError: noop },
      stateManager: null,
      config: {},
      container
    })
    const addSpy = jest.fn()
    ui.on('addTag', addSpy)
    ui.setupEventListeners()
    ui.updateRecentTags(['ReadLater'])
    container.querySelector('[data-case-mode="lower"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    const chip = container.querySelector('.tag.recent .tag-text')
    expect(chip?.textContent).toBe('readlater')
    chip?.closest('.tag')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(addSpy).toHaveBeenCalledWith('readlater')
  })

  test('upper mode on suggested chip: display and add use upper case', () => {
    const ui = new UIManager({
      errorHandler: { handleError: noop },
      stateManager: null,
      config: {},
      container
    })
    const addSpy = jest.fn()
    ui.on('addTag', addSpy)
    ui.setupEventListeners()
    ui.updateSuggestedTags(['api'])
    container.querySelector('[data-case-mode="upper"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    const chip = container.querySelector('[data-popup-ref="suggestedTagsContainer"] .tag.recent .tag-text')
    expect(chip?.textContent).toBe('API')
    chip?.closest('.tag')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(addSpy).toHaveBeenCalledWith('API')
  })

  test('current tag display follows mode; removeTag uses stored string', () => {
    const ui = new UIManager({
      errorHandler: { handleError: noop },
      stateManager: null,
      config: {},
      container
    })
    const removeSpy = jest.fn()
    ui.on('removeTag', removeSpy)
    ui.setupEventListeners()
    ui.updateCurrentTags(['ReadLater'])
    container.querySelector('[data-case-mode="upper"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    const label = container.querySelector('[data-popup-ref="currentTagsContainer"] .tag .tag-text')
    expect(label?.textContent).toBe('READLATER')
    const removeBtn = container.querySelector('[data-popup-ref="currentTagsContainer"] .tag-remove')
    removeBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(removeSpy).toHaveBeenCalledWith('ReadLater')
  })

  test('[REQ-THIS_PAGE_TAG_SORT] default alphabetical sorts current tags by display (case-insensitive)', () => {
    const ui = new UIManager({
      errorHandler: { handleError: noop },
      stateManager: null,
      config: {},
      container
    })
    ui.setupEventListeners()
    ui.updateCurrentTags(['zebra', 'Apple', 'banana'])
    const texts = [...container.querySelectorAll('[data-popup-ref="currentTagsContainer"] .tag .tag-text')].map((n) => n.textContent)
    expect(texts).toEqual(['Apple', 'banana', 'zebra'])
  })

  test('toggle updates aria-pressed and redraws without refetch', () => {
    const ui = new UIManager({
      errorHandler: { handleError: noop },
      stateManager: null,
      config: {},
      container
    })
    ui.setupEventListeners()
    ui.updateRecentTags(['MixEd'])
    expect(container.querySelector('.tag.recent .tag-text')?.textContent).toBe('MixEd')
    container.querySelector('[data-case-mode="lower"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(container.querySelector('[data-case-mode="lower"]')?.getAttribute('aria-pressed')).toBe('true')
    expect(container.querySelector('.tag.recent .tag-text')?.textContent).toBe('mixed')
  })
})
