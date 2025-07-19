// Shared mock DOM utility for UI/overlay-related tests

function createMockButton(className = '', id = '', registerElement) {
  const eventListeners = {}
  const button = {
    tagName: 'BUTTON',
    className,
    id,
    innerHTML: '',
    style: { cssText: '' },
    setAttribute: jest.fn(function (attr, value) {
      if (attr === 'class') {
        this.className = value
        registerElement(this)
      }
      if (attr === 'id') {
        this.id = value
        registerElement(this)
      }
      this[attr] = value
    }),
    getAttribute: jest.fn(function (attr) {
      return this[attr]
    }),
    addEventListener: jest.fn((event, cb) => {
      eventListeners[event] = cb
    }),
    dispatchEvent: jest.fn(),
    onclick: null,
    onkeydown: null,
    onkeyup: null,
    onfocus: null,
    onblur: null,
    focus: jest.fn(),
    blur: jest.fn(),
    disabled: false,
    tabIndex: 0,
    classList: {
      add: jest.fn(function (cls) {
        this.className += ` ${cls}`
        registerElement(this)
      }),
      remove: jest.fn(),
      contains: jest.fn()
    },
    _eventListeners: eventListeners,
    _triggerClick: async function () {
      if (typeof this.onclick === 'function') await this.onclick({ preventDefault: jest.fn() })
      if (eventListeners['click']) await eventListeners['click']({ preventDefault: jest.fn() })
    },
    _triggerKeydown: async function (event) {
      if (typeof this.onkeydown === 'function') await this.onkeydown(event)
      if (eventListeners['keydown']) await eventListeners['keydown'](event)
    },
    appendChild: jest.fn(),
    contains: jest.fn(() => true),
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(() => []),
  }
  // Always register on creation
  registerElement(button)
  return button
}

function createMockInput(className = '', id = '', registerElement) {
  const input = {
    tagName: 'INPUT',
    className,
    id,
    value: '',
    setAttribute: jest.fn(function (attr, value) {
      if (attr === 'class') {
        this.className = value
        registerElement(this)
      }
      if (attr === 'id') {
        this.id = value
        registerElement(this)
      }
      this[attr] = value
    }),
    getAttribute: jest.fn(),
    addEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
    focus: jest.fn(),
    blur: jest.fn(),
    classList: { add: jest.fn(), remove: jest.fn(), contains: jest.fn() },
  }
  registerElement(input)
  return input
}

function createMockSpan(className = '', id = '', registerElement) {
  const span = {
    tagName: 'SPAN',
    className,
    id,
    textContent: '',
    setAttribute: jest.fn(function (attr, value) {
      if (attr === 'class') {
        this.className = value
        registerElement(this)
      }
      if (attr === 'id') {
        this.id = value
        registerElement(this)
      }
      this[attr] = value
    }),
    getAttribute: jest.fn(),
    addEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
    classList: { add: jest.fn(), remove: jest.fn(), contains: jest.fn() },
  }
  registerElement(span)
  return span
}

function createMockDocument() {
  const elementsByClass = new Map()
  const elementsById = new Map()
  const allElements = []

  function registerElement(el) {
    // Register by class
    if (el.className) {
      el.className.split(' ').forEach(cls => {
        if (!cls) return
        if (!elementsByClass.has(cls)) elementsByClass.set(cls, [])
        if (!elementsByClass.get(cls).includes(el)) elementsByClass.get(cls).push(el)
      })
    }
    // Register by id
    if (el.id) {
      elementsById.set(el.id, el)
    }
    if (!allElements.includes(el)) allElements.push(el)
  }

  return {
    createElement: jest.fn((tag) => {
      process.stdout.write(`[mockDocument.createElement] called with tag: ${tag}\n`)
      let el
      if (tag.toLowerCase() === 'button') {
        el = createMockButton('', '', registerElement)
      } else if (tag.toLowerCase() === 'input') {
        el = createMockInput('', '', registerElement)
      } else if (tag.toLowerCase() === 'span') {
        el = createMockSpan('', '', registerElement)
      } else {
        el = {
          tagName: tag.toUpperCase(),
          className: '',
          id: '',
          setAttribute: jest.fn(function (attr, value) {
            if (attr === 'class') {
              this.className = value
              registerElement(this)
            }
            if (attr === 'id') {
              this.id = value
              registerElement(this)
            }
            this[attr] = value
          }),
          getAttribute: jest.fn(),
          addEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
          appendChild: jest.fn(),
          classList: { add: jest.fn(), remove: jest.fn(), contains: jest.fn() },
        }
        registerElement(el)
      }
      return el
    }),
    querySelector: jest.fn((selector) => {
      if (selector.startsWith('.')) {
        const cls = selector.slice(1)
        const arr = elementsByClass.get(cls)
        return arr && arr.length ? arr[0] : null
      }
      if (selector.startsWith('#')) {
        const id = selector.slice(1)
        return elementsById.get(id) || null
      }
      // fallback: return first element with matching tagName
      for (const el of allElements) {
        if (el.tagName && selector.toUpperCase() === el.tagName) return el
      }
      return null
    }),
    querySelectorAll: jest.fn((selector) => {
      if (selector.startsWith('.')) {
        const cls = selector.slice(1)
        return elementsByClass.get(cls) || []
      }
      if (selector.startsWith('#')) {
        const id = selector.slice(1)
        const el = elementsById.get(id)
        return el ? [el] : []
      }
      return []
    }),
    getElementById: jest.fn((id) => elementsById.get(id) || null),
    body: {
      appendChild: jest.fn((el) => {
        registerElement(el)
      }),
      removeChild: jest.fn(),
    },
    // Expose internal tracking for debugging
    _elementsByClass: elementsByClass,
    _elementsById: elementsById,
    _allElements: allElements,
  }
}

module.exports = {
  createMockDocument,
  createMockButton,
  createMockInput,
  createMockSpan,
} 