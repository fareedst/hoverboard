// [OVERLAY-TEST-MOCK-001] Enhanced mock DOM utility for UI/overlay-related tests
// [OVERLAY-TEST-ELEMENT-001] Enhanced element creation with comprehensive tracking
// [OVERLAY-TEST-CLASS-001] Improved class and ID tracking with dynamic updates
// [OVERLAY-TEST-APPEND-001] Enhanced appendChild simulation with proper registration
// [OVERLAY-TEST-QUERY-001] Improved query selector with accurate results

// [OVERLAY-TEST-LOG-001] Debug logging for mock DOM operations
const mockLogger = {
  log: (level, component, message, data = null) => {
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${level}] [${component}]`
    if (data) {
      console.log(prefix, message, data)
    } else {
      console.log(prefix, message)
    }
  }
}

function createMockButton(className = '', id = '', registerElement) {
  // [OVERLAY-TEST-ELEMENT-001] Enhanced button creation with debug logging
  mockLogger.log('DEBUG', 'MockDOM', 'Creating button element', { className, id })
  
  const eventListeners = {}
  const button = {
    tagName: 'BUTTON',
    className,
    id,
    innerHTML: '',
    style: { cssText: '' },
    setAttribute: jest.fn(function (attr, value) {
      // [OVERLAY-TEST-CLASS-001] Enhanced attribute tracking with debug logging
      mockLogger.log('DEBUG', 'MockDOM', 'Button setAttribute called', { attr, value })
      
      if (attr === 'class') {
        this.className = value
        registerElement(this)
        mockLogger.log('DEBUG', 'MockDOM', 'Button class registered', { className: value })
      }
      if (attr === 'id') {
        this.id = value
        registerElement(this)
        mockLogger.log('DEBUG', 'MockDOM', 'Button id registered', { id: value })
      }
      this[attr] = value
    }),
    getAttribute: jest.fn(function (attr) {
      // [OVERLAY-TEST-QUERY-001] Enhanced attribute retrieval with debug logging
      mockLogger.log('DEBUG', 'MockDOM', 'Button getAttribute called', { attr, value: this[attr] })
      return this[attr]
    }),
    addEventListener: jest.fn((event, cb) => {
      // [OVERLAY-TEST-ELEMENT-001] Enhanced event listener tracking
      mockLogger.log('DEBUG', 'MockDOM', 'Button addEventListener called', { event })
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
        // [OVERLAY-TEST-CLASS-001] Enhanced classList.add with debug logging
        mockLogger.log('DEBUG', 'MockDOM', 'Button classList.add called', { class: cls })
        this.className += ` ${cls}`
        registerElement(this)
      }),
      remove: jest.fn(),
      contains: jest.fn()
    },
    _eventListeners: eventListeners,
    _triggerClick: async function () {
      // [OVERLAY-TEST-ELEMENT-001] Enhanced click simulation with debug logging
      mockLogger.log('DEBUG', 'MockDOM', 'Button click triggered')
      if (typeof this.onclick === 'function') await this.onclick({ preventDefault: jest.fn() })
      if (eventListeners['click']) await eventListeners['click']({ preventDefault: jest.fn() })
    },
    _triggerKeydown: async function (event) {
      // [OVERLAY-TEST-ELEMENT-001] Enhanced keyboard simulation with debug logging
      mockLogger.log('DEBUG', 'MockDOM', 'Button keydown triggered', { key: event.key })
      if (typeof this.onkeydown === 'function') await this.onkeydown(event)
      if (eventListeners['keydown']) await eventListeners['keydown'](event)
    },
    appendChild: jest.fn((child) => {
      // [OVERLAY-TEST-APPEND-001] Enhanced appendChild with debug logging
      mockLogger.log('DEBUG', 'MockDOM', 'Button appendChild called', { child })
    }),
    contains: jest.fn(() => true),
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(() => []),
  }
  // Always register on creation
  registerElement(button)
  mockLogger.log('DEBUG', 'MockDOM', 'Button element created and registered', { className, id })
  return button
}

function createMockInput(className = '', id = '', registerElement) {
  // [OVERLAY-TEST-ELEMENT-001] Enhanced input creation with debug logging
  mockLogger.log('DEBUG', 'MockDOM', 'Creating input element', { className, id })
  
  const input = {
    tagName: 'INPUT',
    className,
    id,
    value: '',
    setAttribute: jest.fn(function (attr, value) {
      // [OVERLAY-TEST-CLASS-001] Enhanced attribute tracking for input
      mockLogger.log('DEBUG', 'MockDOM', 'Input setAttribute called', { attr, value })
      
      if (attr === 'class') {
        this.className = value
        registerElement(this)
        mockLogger.log('DEBUG', 'MockDOM', 'Input class registered', { className: value })
      }
      if (attr === 'id') {
        this.id = value
        registerElement(this)
        mockLogger.log('DEBUG', 'MockDOM', 'Input id registered', { id: value })
      }
      this[attr] = value
    }),
    getAttribute: jest.fn(function (attr) {
      // [OVERLAY-TEST-QUERY-001] Enhanced attribute retrieval for input
      mockLogger.log('DEBUG', 'MockDOM', 'Input getAttribute called', { attr, value: this[attr] })
      return this[attr]
    }),
    addEventListener: jest.fn((event, cb) => {
      // [OVERLAY-TEST-ELEMENT-001] Enhanced event listener tracking for input
      mockLogger.log('DEBUG', 'MockDOM', 'Input addEventListener called', { event })
    }),
    dispatchEvent: jest.fn(),
    focus: jest.fn(),
    blur: jest.fn(),
    classList: { 
      add: jest.fn(function (cls) {
        // [OVERLAY-TEST-CLASS-001] Enhanced classList.add for input
        mockLogger.log('DEBUG', 'MockDOM', 'Input classList.add called', { class: cls })
        this.className += ` ${cls}`
        registerElement(this)
      }), 
      remove: jest.fn(), 
      contains: jest.fn() 
    },
  }
  registerElement(input)
  mockLogger.log('DEBUG', 'MockDOM', 'Input element created and registered', { className, id })
  return input
}

function createMockSpan(className = '', id = '', registerElement) {
  // [OVERLAY-TEST-ELEMENT-001] Enhanced span creation with debug logging
  mockLogger.log('DEBUG', 'MockDOM', 'Creating span element', { className, id })
  
  const span = {
    tagName: 'SPAN',
    className,
    id,
    textContent: '',
    setAttribute: jest.fn(function (attr, value) {
      // [OVERLAY-TEST-CLASS-001] Enhanced attribute tracking for span
      mockLogger.log('DEBUG', 'MockDOM', 'Span setAttribute called', { attr, value })
      
      if (attr === 'class') {
        this.className = value
        registerElement(this)
        mockLogger.log('DEBUG', 'MockDOM', 'Span class registered', { className: value })
      }
      if (attr === 'id') {
        this.id = value
        registerElement(this)
        mockLogger.log('DEBUG', 'MockDOM', 'Span id registered', { id: value })
      }
      this[attr] = value
    }),
    getAttribute: jest.fn(function (attr) {
      // [OVERLAY-TEST-QUERY-001] Enhanced attribute retrieval for span
      mockLogger.log('DEBUG', 'MockDOM', 'Span getAttribute called', { attr, value: this[attr] })
      return this[attr]
    }),
    addEventListener: jest.fn((event, cb) => {
      // [OVERLAY-TEST-ELEMENT-001] Enhanced event listener tracking for span
      mockLogger.log('DEBUG', 'MockDOM', 'Span addEventListener called', { event })
    }),
    dispatchEvent: jest.fn(),
    classList: { 
      add: jest.fn(function (cls) {
        // [OVERLAY-TEST-CLASS-001] Enhanced classList.add for span
        mockLogger.log('DEBUG', 'MockDOM', 'Span classList.add called', { class: cls })
        this.className += ` ${cls}`
        registerElement(this)
      }), 
      remove: jest.fn(), 
      contains: jest.fn() 
    },
  }
  registerElement(span)
  mockLogger.log('DEBUG', 'MockDOM', 'Span element created and registered', { className, id })
  return span
}

function createMockDiv(className = '', id = '', registerElement) {
  // [OVERLAY-TEST-ELEMENT-001] Enhanced div creation with debug logging
  mockLogger.log('DEBUG', 'MockDOM', 'Creating div element', { className, id })
  
  const div = {
    tagName: 'DIV',
    className,
    id,
    innerHTML: '',
    style: { cssText: '' },
    setAttribute: jest.fn(function (attr, value) {
      // [OVERLAY-TEST-CLASS-001] Enhanced attribute tracking for div
      mockLogger.log('DEBUG', 'MockDOM', 'Div setAttribute called', { attr, value })
      
      if (attr === 'class') {
        this.className = value
        registerElement(this)
        mockLogger.log('DEBUG', 'MockDOM', 'Div class registered', { className: value })
      }
      if (attr === 'id') {
        this.id = value
        registerElement(this)
        mockLogger.log('DEBUG', 'MockDOM', 'Div id registered', { id: value })
      }
      this[attr] = value
    }),
    getAttribute: jest.fn(function (attr) {
      // [OVERLAY-TEST-QUERY-001] Enhanced attribute retrieval for div
      mockLogger.log('DEBUG', 'MockDOM', 'Div getAttribute called', { attr, value: this[attr] })
      return this[attr]
    }),
    addEventListener: jest.fn((event, cb) => {
      // [OVERLAY-TEST-ELEMENT-001] Enhanced event listener tracking for div
      mockLogger.log('DEBUG', 'MockDOM', 'Div addEventListener called', { event })
    }),
    dispatchEvent: jest.fn(),
    appendChild: jest.fn((child) => {
      // [OVERLAY-TEST-APPEND-001] Enhanced appendChild for div with debug logging
      mockLogger.log('DEBUG', 'MockDOM', 'Div appendChild called', { child })
      // Register the child element
      registerElement(child)
      // Update parent-child relationship
      child.parentNode = this
      mockLogger.log('DEBUG', 'MockDOM', 'Child registered and parent set for div')
    }),
    classList: { 
      add: jest.fn(function (cls) {
        // [OVERLAY-TEST-CLASS-001] Enhanced classList.add for div
        mockLogger.log('DEBUG', 'MockDOM', 'Div classList.add called', { class: cls })
        this.className += ` ${cls}`
        registerElement(this)
      }), 
      remove: jest.fn(), 
      contains: jest.fn() 
    },
  }
  registerElement(div)
  mockLogger.log('DEBUG', 'MockDOM', 'Div element created and registered', { className, id })
  return div
}

function createMockDocument() {
  // [OVERLAY-TEST-MOCK-001] Enhanced mock document with comprehensive tracking
  mockLogger.log('DEBUG', 'MockDOM', 'Creating enhanced mock document')
  
  const elementsByClass = new Map()
  const elementsById = new Map()
  const allElements = []

  function registerElement(el) {
    // [OVERLAY-TEST-CLASS-001] Enhanced element registration with debug logging
    mockLogger.log('DEBUG', 'MockDOM', 'Registering element', { 
      tagName: el.tagName, 
      className: el.className, 
      id: el.id 
    })
    
    // Register by class
    if (el.className) {
      el.className.split(' ').forEach(cls => {
        if (!cls) return
        if (!elementsByClass.has(cls)) {
          elementsByClass.set(cls, [])
          mockLogger.log('DEBUG', 'MockDOM', 'Created new class registry', { class: cls })
        }
        if (!elementsByClass.get(cls).includes(el)) {
          elementsByClass.get(cls).push(el)
          mockLogger.log('DEBUG', 'MockDOM', 'Added element to class', { class: cls, element: el.tagName })
        }
      })
    }
    // Register by id
    if (el.id) {
      elementsById.set(el.id, el)
      mockLogger.log('DEBUG', 'MockDOM', 'Registered element by id', { id: el.id, element: el.tagName })
    }
    if (!allElements.includes(el)) {
      allElements.push(el)
      mockLogger.log('DEBUG', 'MockDOM', 'Added element to all elements list', { element: el.tagName })
    }
  }

  return {
    createElement: jest.fn((tag) => {
      // [OVERLAY-TEST-ELEMENT-001] Enhanced element creation with debug logging
      mockLogger.log('DEBUG', 'MockDOM', 'createElement called', { tag })
      
      let el
      if (tag.toLowerCase() === 'button') {
        el = createMockButton('', '', registerElement)
      } else if (tag.toLowerCase() === 'input') {
        el = createMockInput('', '', registerElement)
      } else if (tag.toLowerCase() === 'span') {
        el = createMockSpan('', '', registerElement)
      } else if (tag.toLowerCase() === 'div') {
        el = createMockDiv('', '', registerElement)
      } else {
        // [OVERLAY-TEST-ELEMENT-001] Generic element creation for other tags
        mockLogger.log('DEBUG', 'MockDOM', 'Creating generic element', { tag })
        el = {
          tagName: tag.toUpperCase(),
          className: '',
          id: '',
          innerHTML: '',
          style: { cssText: '' },
          setAttribute: jest.fn(function (attr, value) {
            // [OVERLAY-TEST-CLASS-001] Enhanced attribute tracking for generic elements
            mockLogger.log('DEBUG', 'MockDOM', 'Generic element setAttribute called', { tag, attr, value })
            
            if (attr === 'class') {
              this.className = value
              registerElement(this)
              mockLogger.log('DEBUG', 'MockDOM', 'Generic element class registered', { tag, className: value })
            }
            if (attr === 'id') {
              this.id = value
              registerElement(this)
              mockLogger.log('DEBUG', 'MockDOM', 'Generic element id registered', { tag, id: value })
            }
            this[attr] = value
          }),
          getAttribute: jest.fn(function (attr) {
            // [OVERLAY-TEST-QUERY-001] Enhanced attribute retrieval for generic elements
            mockLogger.log('DEBUG', 'MockDOM', 'Generic element getAttribute called', { tag, attr, value: this[attr] })
            return this[attr]
          }),
          addEventListener: jest.fn((event, cb) => {
            // [OVERLAY-TEST-ELEMENT-001] Enhanced event listener tracking for generic elements
            mockLogger.log('DEBUG', 'MockDOM', 'Generic element addEventListener called', { tag, event })
          }),
          dispatchEvent: jest.fn(),
          appendChild: jest.fn((child) => {
            // [OVERLAY-TEST-APPEND-001] Enhanced appendChild for generic elements
            mockLogger.log('DEBUG', 'MockDOM', 'Generic element appendChild called', { tag, child })
            registerElement(child)
            child.parentNode = this
          }),
          classList: { 
            add: jest.fn(function (cls) {
              // [OVERLAY-TEST-CLASS-001] Enhanced classList.add for generic elements
              mockLogger.log('DEBUG', 'MockDOM', 'Generic element classList.add called', { tag, class: cls })
              this.className += ` ${cls}`
              registerElement(this)
            }), 
            remove: jest.fn(), 
            contains: jest.fn() 
          },
        }
        registerElement(el)
      }
      
      mockLogger.log('DEBUG', 'MockDOM', 'Element created successfully', { tag, element: el.tagName })
      return el
    }),
    
    querySelector: jest.fn((selector) => {
      // [OVERLAY-TEST-QUERY-001] Enhanced querySelector with debug logging
      mockLogger.log('DEBUG', 'MockDOM', 'querySelector called', { selector })
      
      let result = null
      if (selector.startsWith('.')) {
        const cls = selector.slice(1)
        const arr = elementsByClass.get(cls)
        result = arr && arr.length ? arr[0] : null
        mockLogger.log('DEBUG', 'MockDOM', 'querySelector by class result', { class: cls, found: !!result })
      } else if (selector.startsWith('#')) {
        const id = selector.slice(1)
        result = elementsById.get(id) || null
        mockLogger.log('DEBUG', 'MockDOM', 'querySelector by id result', { id, found: !!result })
      } else {
        // fallback: return first element with matching tagName
        for (const el of allElements) {
          if (el.tagName && selector.toUpperCase() === el.tagName) {
            result = el
            break
          }
        }
        mockLogger.log('DEBUG', 'MockDOM', 'querySelector by tag result', { tag: selector, found: !!result })
      }
      
      mockLogger.log('DEBUG', 'MockDOM', 'querySelector final result', { 
        selector, 
        result: result ? { tagName: result.tagName, className: result.className, id: result.id } : null 
      })
      return result
    }),
    
    querySelectorAll: jest.fn((selector) => {
      // [OVERLAY-TEST-QUERY-001] Enhanced querySelectorAll with debug logging
      mockLogger.log('DEBUG', 'MockDOM', 'querySelectorAll called', { selector })
      
      let results = []
      if (selector.startsWith('.')) {
        const cls = selector.slice(1)
        results = elementsByClass.get(cls) || []
        mockLogger.log('DEBUG', 'MockDOM', 'querySelectorAll by class result', { class: cls, count: results.length })
      } else if (selector.startsWith('#')) {
        const id = selector.slice(1)
        const el = elementsById.get(id)
        results = el ? [el] : []
        mockLogger.log('DEBUG', 'MockDOM', 'querySelectorAll by id result', { id, count: results.length })
      } else {
        // fallback: return all elements with matching tagName
        results = allElements.filter(el => el.tagName && selector.toUpperCase() === el.tagName)
        mockLogger.log('DEBUG', 'MockDOM', 'querySelectorAll by tag result', { tag: selector, count: results.length })
      }
      
      mockLogger.log('DEBUG', 'MockDOM', 'querySelectorAll final result', { 
        selector, 
        count: results.length,
        results: results.map(el => ({ tagName: el.tagName, className: el.className, id: el.id }))
      })
      return results
    }),
    
    getElementById: jest.fn((id) => {
      // [OVERLAY-TEST-QUERY-001] Enhanced getElementById with debug logging
      mockLogger.log('DEBUG', 'MockDOM', 'getElementById called', { id })
      const result = elementsById.get(id) || null
      mockLogger.log('DEBUG', 'MockDOM', 'getElementById result', { id, found: !!result })
      return result
    }),
    
    body: {
      appendChild: jest.fn((el) => {
        // [OVERLAY-TEST-APPEND-001] Enhanced body.appendChild with debug logging
        mockLogger.log('DEBUG', 'MockDOM', 'body.appendChild called', { element: el.tagName })
        registerElement(el)
        mockLogger.log('DEBUG', 'MockDOM', 'Element registered in body')
      }),
      removeChild: jest.fn((el) => {
        // [OVERLAY-TEST-ELEMENT-001] Enhanced body.removeChild with debug logging
        mockLogger.log('DEBUG', 'MockDOM', 'body.removeChild called', { element: el.tagName })
      }),
    },
    
    // [OVERLAY-TEST-RESET-001] Enhanced reset functionality for test isolation
    reset: () => {
      mockLogger.log('DEBUG', 'MockDOM', 'Resetting mock document state')
      elementsByClass.clear()
      elementsById.clear()
      allElements.length = 0
      mockLogger.log('DEBUG', 'MockDOM', 'Mock document state reset complete')
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
  createMockDiv,
} 