const pinboardApiPath = 'https://api.pinboard.in/v1/'
const pinTagsAsList = true;
const addTagAnchorId = 'newTag';

function addTooltip(cell, tiptext, widen = !WIDEN) {
  const tip = document.createElement('span')
  tip.textContent = tiptext;
  tip.setAttribute('class', 'tooltiptext');
  if (widen) {
    tip.style.width = '20em';
  }
  cell.appendChild(tip);
  cell.classList.add('tooltip');
}

function betterDescription(description, doctitle) {
  if (description === '' || description === 'no title') return doctitle;

  return description;
}

function BRSendMessage(obj, callback) {
  if (noisy) { log('tools', 'BRSendMessage', 'obj:', obj) }
  chrome.runtime.sendMessage(obj, callback);
}

function minEmpty(pin, description = '') {
  return {
    description: pin.description || description || '',
    extended: pin.extended || '',
    hash: pin.hash || '',
    shared: pin.shared || '',
    tags: pin.tags || [],
    time: pin.time || '',
    toread: pin.toread || '',
    url: pin.url || ''
  };
}

function newPin() {
  const obj = {
    description: '',
    extended: '',
    hash: '',
    shared: '',
    tags: [],
    time: '',
    toread: '',
    url: ''
  };
  Array.prototype.forEach.call(
    arguments,
    arg => Object.assign(obj, arg)
  )
  // log('newPin', 'obj:', obj)
  return obj;
}

// input: array of sortable values
// output: object { value: { [index, ...], length }, ... }
//
function occurrence(array) {
  'use strict'
  const result = {};
  if (array instanceof Array) {
    array.forEach((v, i) => {
      if (!result[v]) {
        result[v] = [i]
      } else {
        result[v].push(i)
      }
    })
    Object.keys(result).forEach(v => {
      result[v] = { index: result[v], length: result[v].length }
    })
  }
  return result;
};

// Send a message to the active tab
//
function sendToActiveTab(obj) {
  if (noisy) { log('tl', 'sendToActiveTab') }
  chrome.tabs.query({active: true, currentWindow: true}, tabs => {
    chrome.tabs.sendMessage(tabs[0].id, obj);
  });
}

// Send a message to the browser extension
//
function sendToExtension(obj, callback) {
  if (noisy) { log('tl', 'sendToExtension') }
  chrome.extension.sendMessage(obj, callback);
}

// Send a message to the browser extension
//
function sendToTab(id, obj) {
  if (noisy) { log('tl', 'sendToTab', 'id:', id) }
  chrome.tabs.sendMessage(id, obj);
}

// input: array of sortable values
// output: ordered array of values
//
function sortArrayByFrequency(array) {
  const oc = occurrence(array)
  return Object.keys(oc).map(k => [k, oc[k].length]).sort((a, b) => b[1] - a[1]).map(x => x[0])
}

// add whitespace to url to facilitate output in debug
//
function unurl(url) {
  if (!url) return url
  return url.match(/\?.+/)[0].split('&').join(' ')
}

// modify url as should be used in bookmark
//
function urlForBookmark(url) {
  if (!url) return url
  // clean URL by removing trailing hash data
  //
  return uxUrlStripHash ? url.replace(/#.*$/, '') : url
}

class Buttoner {
  constructor(gjq, injectOptions, container) {
    if (noisyOverlay) { log('tools', 'Buttoner', 'constructor') }
    this.container = container;
    this.gjq = gjq;
    this.injectOptions = injectOptions;
    this.pinTagsAsList = pinTagsAsList;
  }

  // addAnchorAddTag() {
  //   this.createAnchor(
  //     b64IconAddTag24pxSvg,
  //     'addtag-hot',
  //     {},
  //     'Add Tag'
  //   )
  // }
  addAnchorAddTag(pin) {
    if (noisyOverlay) { log('tools', 'Buttoner', 'addAnchorAddTag', 'pin:', pin) }
    this.createAnchor(
      b64IconAddTag24pxPng,
      'addtag-hot',
      pin,
      'Add Tag',
      !WIDEN,
      formatPng
    )
  }

  addAnchorDeletePin(description, url) {
    if (noisyOverlay) { log('tools', 'Buttoner', 'addAnchorDeletePin', 'description:', description, 'url:', url) }
    this.createAnchor(
      b64IconDelete24pxSvg,
      'iconDeletePinInactive',
      {
        description: description,
        url: url
      },
      'Delete Bookmark (req. 2-clicks)',
      WIDEN
    )
  }

  addAnchorDev(pin) {
    if (noisyOverlay) { log('tools', 'Buttoner', 'addAnchorDev', 'pin:', pin) }
    this.createAnchor(
      b64IconDev24pxSvg,
      'dev-cold',
      pin,
      'Delete tabs marked ToRead'
    )
  }

  addAnchorInhibitUrl(url) {
    if (noisyOverlay) { log('tools', 'Buttoner', 'addAnchorInhibitUrl', 'url:', url) }
    this.createAnchor(
      b64IconNotInterested24pxSvg,
      'iconBlockPinInactive',
      { url: url },
      'Block URL (req. 2-clicks)'
    )
  }

  addAnchorPrivate(pin) {
    if (noisyOverlay) { log('tools', 'Buttoner', 'addAnchorPrivate', 'pin:', pin) }
    this.createAnchor(
      b64IconVisibilityOff24pxSvg,
      pin.shared === 'no' ? 'svg-hot' : 'svg-cold',
      Object.assign({}, pin, {
        shared: pin.shared === 'no' ? 'yes' : 'no'
      }),
      'Private (Toggle)'
    )
  }

  addAnchorReload() {
    if (noisyOverlay) { log('tools', 'Buttoner', 'addAnchorReload') }
    this.createAnchor(
      b64IconReloadSvg,
      'reload-hot',
      { },
      'Reload Pin'
    )
  }

  addAnchorSearchTitle() {
    if (noisyOverlay) { log('tools', 'Buttoner', 'addAnchorSearchTitle') }
    this.createAnchor(
      b64IconSearchTitle24pxPng,
      'search-hot',
      {},
      'Search Title',
      !WIDEN,
      formatPng
    )
  }

  addAnchorShowHoverboard() {
    if (noisyOverlay) { log('tools', 'Buttoner', 'addAnchorShowHoverboard') }
    this.createAnchor(
      b64IconHoverboard32pxPng,
      'hover-hot',
      {},
      'Show Hoverboard',
      !WIDEN,
      formatPng
    )
  }

  addAnchorToRead(pin) {
    if (noisyOverlay) { log('tools', 'Buttoner', 'addAnchorToRead', 'pin:', pin) }
    this.createAnchor(
      b64IconBookmark24pxSvg,
      pin.toread === 'yes' ? 'svg-hot' : 'svg-cold',
      Object.assign({}, pin, {
        toread: pin.toread === 'yes' ? 'no' : 'yes'
      }),
      'To Read (Toggle)'
    )
  }

  addGroupSearchTitle(doc, container, tabId, initialSearchTitleText) {
    if (noisyOverlay) { log('tools', 'Buttoner', 'addGroupSearchTitle') }
    this.addTextboxSearchTitle(
      doc, container, 'qry Title', 9, tabId, initialSearchTitleText,
      response => {
        if (noisy) { log('tools', 'addGroupSearchTitle', 'response:', response) }
        // let overlay = new Overlay(gjq, doc, tabId, gTitle, gUrl);
        // setTimeout(() => { overlay.refreshHover() }, 3000)
      }
    )
    this.addAnchorSearchTitle();
    this.addSpanSearchCount(doc, container);
  }

  addSpanSearchCount(doc, container) {
    if (noisyOverlay) { log('tools', 'Buttoner', 'addSpanSearchCount') }
    const span = doc.createElement('span')
    // const input = doc.createElement('input')
    // // form.appendChild(input);
    // this.gjq(input).attr('autocomplete', 'on')
    // this.gjq(input).attr('maxlength', '128')
    // this.gjq(input).attr('placeholder', placeholder)
    // this.gjq(input).attr('size', size.toString())
    // this.gjq(input).attr('type', 'text')
    // this.gjq(input).attr('value', '@@@@')
    // this.gjq(input)[0].addEventListener('keyup', keyupCallback.bind(this, input))

    // span.appendChild(input)
    span.setAttribute('class', 'search-count');
    span.textContent = '';
    // span.setAttribute('value', '0');
    // if (this.injectOptions.hoverShowTooltips) { addTooltip(span, 'Add Tag') }
    container.appendChild(span);
    this.spanSearchCount = span;
  }

  addTag(pin, doctitle, tag, callback) {
    if (noisyOverlay) { log('tools', 'Buttoner', 'addTag', 'pin:', pin) }
log('tl', 'addTag', 'doctitle:', doctitle)
    BRSendMessage(
      newPin(
        pin,
        {
          action: msgBackSaveTag,
          description: betterDescription(pin.description, doctitle),
          value: tag
        }
      ),
      callback
    );
  }

  addTextbox(doc, container, placeholder, size, value, id, keyupCallback) {
    if (noisyOverlay) { log('tools', 'Buttoner', 'addTextbox') }
    // let form = document.createElement('form');
    const cell = doc.createElement('span');
    const input = doc.createElement('input');
    // form.appendChild(input);
    this.gjq(input)
    .attr('id', id)
    .attr('autocomplete', 'on')
    .attr('maxlength', '128');
    this.gjq(input).attr('placeholder', placeholder);
    this.gjq(input).attr('size', size.toString());
    this.gjq(input).attr('type', 'text');
    this.gjq(input).attr('value', value);
    this.gjq(input)[0].addEventListener('keyup', keyupCallback.bind(this, input));

    cell.appendChild(input);
    // cell.setAttribute('class', 'tooltip');
    if (this.injectOptions.hoverShowTooltips) { addTooltip(cell, 'Add Tag') }
    container.appendChild(cell);
  }

  addTextboxAddTag(doc, container, placeholder, size, pin, doctitle, anchorId, callback) {
    if (noisyOverlay) { log('tools', 'Buttoner', 'addTextboxAddTag', 'pin:', pin) }
    this.addTextboxEnter(doc, container, placeholder, size, '',
      anchorId,
      tag => {
        this.addTag(pin, doctitle, tag, callback);
        return true; // keep port open
      }
    );
    this.addAnchorAddTag(pin);
  }

  addTextboxEnter(doc, container, placeholder, size, value, anchorId, cbEnter, cbChange) {
    if (noisyOverlay) { log('tools', 'Buttoner', 'addTextboxEnter') }
    this.addTextbox(doc, container, placeholder, size, value, anchorId,
      (input, event) => {
        if (noisyOverlay) { log('tools', 'Buttoner', 'addTextboxEnter', 'cb', 'input:', input, 'event:', event) }
        if (event.keyCode === 13) {
          cbEnter.call(this, this.gjq(input).val());
        } else {
          // let text = this.gjq(input).val()
          // if (noisy) { log('tools', 'Buttoner', 'addTextboxSearchTitle', 'text:', text) }
///          cbChange.call(this, this.gjq(input).val())
        }
      },
      anchorId
    )
  }

  addTextboxSearchTitle(doc, container, placeholder, size, tabId, value, callback) {
    if (noisyOverlay) { log('tools', 'Buttoner', 'addTextboxSearchTitle') }
    this.addTextboxEnter(doc, container, placeholder, size, value,
      text => {
        if (noisyOverlay) { log('tools', 'Buttoner', 'addTextboxSearchTitle', 'addTextboxEnter', 'text:', text) }
        this.searchTitle(tabId, text, callback);
        return true; // keep port open
      },
      text => {
        // this.searchTitle(tabId, text, callback)
        // return true // keep port open
      }
    )
  }

  createAnchor(base64, className, data, tipText, tipStyle = !WIDEN, format = formatSvg) {
    if (noisyOverlay) { log('tools', 'Buttoner', 'createAnchor', 'className:', className, 'tipText:', tipText) }
    const img = document.createElement('img')
    this.gjq(img).attr('src', format + base64)
    this.gjq(img).attr('class', className)
    this.gjq(img).attr('height', 24)
    this.gjq(img).attr('width', 24)
    // this.gjq(img).attr('class', allit.toread === 'yes' ? 'svg-hot' : 'svg-cold');

    // let toread = (allit.toread === 'yes' ? 'no' : 'yes');
    const value = img
    if (noisy) { console.log(' !! tl createAnchor 64') }
    const tag = makeRecentAnchor(this.gjq, data, value, makeRecentAnchor2)

    if (this.pinTagsAsList) {
      const cell = document.createElement('span')
      cell.setAttribute('class', 'tiny')
      cell.appendChild(tag)
      this.container.appendChild(cell)
      if (this.injectOptions.hoverShowTooltips) { addTooltip(cell, tipText, tipStyle) }
    } else {
      const td1 = document.createElement('td')
      td1.appendChild(tag)
      this.container.appendChild(td1)
    }
  }

  searchTitle(tabId, text, callback) {
    if (noisyOverlay) { log('tools', 'Buttoner', 'searchTitle', 'text:', text) }
log('- - - - 3', 'tools')
    BRSendMessage(
      {
        action: msgBackSearchTitle,
        tabId: tabId,
        value: text
      },
      callback
    )
  }

  setSearchCount(text) {
    if (noisyOverlay) { log('tools', 'Buttoner', 'setSearchCount') }
    this.spanSearchCount.textContent = text;
  }
}

// ==
// value: string to display or anchor element
//
// function makeRecentAnchor(gjq, description, time, extended, shared, toread, tags, url, value, targetCallback) {
function makeRecentAnchor(gjq, data, value, targetCallback, anchorId = '') {
  if (noisyMakeAnchor) { log('makeRecentAnchor', 'data:', data, 'value:', value) }
  // if (logAnchorOnCreate) { LOG!1!('makeRecentAnchor()'); console.log('logAnchorOnCreate() description: ' + description); console.log('time: ' + time); console.log('extended: ' + extended); console.log('shared: ' + shared); console.log('toread: ' + toread); console.log('tags: ' + tags); console.log('url: ' + url, 'value: ' + value) }
  // var anchor = document.createElement('a');
  // if (noisyMakeAnchor) { console.log('typeof tags: ' + typeof tags); }
  // if (typeof tags == 'undefined') { console.error('makeRecentAnchor undefined tags'); }
  // if ((typeof tags == 'string') && (tags == '')) { console.error('makeRecentAnchor empty tags'); }
  // if ((typeof tags == 'object') && (tags.length == 0)) { console.error('makeRecentAnchor no tags'); }

  let clickable;
  if (typeof value === 'string') {
    // console.log('value is string');
    const anchor = document.createElement('a');
    anchor.setAttribute('id', anchorId);
    anchor.textContent = value;
    clickable = anchor;
  } else {
    // console.log('value is object');
    // console.dir(value);
    clickable = value;
    value = '';
  }

  if (recentInHorizontalMenu) { clickable.setAttribute('class', 'pure-menu-link') }
  gjq(clickable).click(event => {
    if (noisyMakeAnchor) { console.log('makeRecentAnchor anchor.click()'); console.dir(event) }
    event.preventDefault();
    // console.dir(event.target);
    // console.dir(gjq(event.target)[0]);
    // console.log('dt'+ gjq(event.target).hasClass('iconTagDeleteActive'));
    // console.log('nt'+ gjq(event.target).hasClass('iconTagDeleteInactive'));
    if (logAnchorOnCreate) { log('makeRecentAnchor()', 'logAnchorOnCreate()', 'data:', data, 'value:', value) }
    targetCallback.call(this, gjq, data, value, event.target);
  })
  return clickable
}

// function makeRecentAnchor2(gjq, description, time, extended, shared, toread, tags, url, value, eventTarget) {
function makeRecentAnchor2(gjq, data, value, eventTarget) {
console.log('tl 395')
  if (noisyMakeAnchor) { log('makeRecentAnchor2', 'data:', data, 'value:', value, 'eventTarget:', eventTarget) }
  let overlay = new Overlay(gjq, document, gTabId, gTitle, gUrl);

  if (gjq(eventTarget).hasClass('iconBlockPinInactive')) {
    // toggle
    gjq(eventTarget).attr('class', 'iconBlockPinActive');

  } else if (gjq(eventTarget).hasClass('iconBlockPinActive')) {
    overlay.inhibitUrl();

  } else if (gjq(eventTarget).hasClass('iconDeletePinInactive')) {
    // toggle
    gjq(eventTarget).attr('class', 'iconDeletePinActive');

  } else if (gjq(eventTarget).hasClass('iconDeletePinActive')) {
    overlay.deletePin(data, eventTarget);

  } else if (gjq(eventTarget).hasClass('iconTagDeleteInactive')) {
    // toggle
    gjq(eventTarget).attr('class', 'iconTagDeleteActive')
  } else if (gjq(eventTarget).hasClass('iconTagDeleteActive')) {
    overlay.deleteTag(data, value);

  } else if (gjq(eventTarget).hasClass('hover-hot')) {
    if (noisyMakeAnchor) { log('makeRecentAnchor2', 'hover-hot', 'gTabId:', gTabId) }
    overlay.toggleHover();

  } else if (gjq(eventTarget).hasClass('dev-cold')) {
    // toggle
    gjq(eventTarget).attr('class', 'dev-hot')

  } else if (gjq(eventTarget).hasClass('dev-hot')) {
    actionDev(gjq);

  } else if (gjq(eventTarget).hasClass('addtag-hot')) {
console.log('tl 423')
    overlay.savePin({pin: data, id: addTagAnchorId});
    // BRSendMessage(
    //   { action: msgBackAddTag },
    //   () => {}
    // )

  } else if (gjq(eventTarget).hasClass('reload-hot')) {
    overlay.refreshData();

  } else if (gjq(eventTarget).hasClass('search-hot')) {
    // buttoner.searchTitle(tabId, text, callback);
    // if (noisyMakeAnchor) { log('tools', 'Buttoner', 'searchTitle', 'text:', text) }
log('- - - - 2', 'tools')
    BRSendMessage(
      { action: msgBackSearchTitle },
      () => {}
    )

  } else {
    overlay.savePin({pin: data, value: value});

  }
}
