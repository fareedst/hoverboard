if (noisy) { console.log('ij', 'BOF') }

const currentInHorizontalMenu = false // use: pure-menu pure-menu-horizontal pure-menu-scrollable
const recentInHorizontalMenu = false // use: pure-menu pure-menu-horizontal pure-menu-scrollable
const recentAsList = true
const recentAsTable = false

// const pinTagsAsList = true;

// var gjq;
// // gjq(document).ready(function() {
//   console.log('');
//   // gjq = $.noConflict();
//   console.dir(gjq);
//   console.dir($);
// // });

if (dtrue) {
  // use existing jQuery if a second copy was loaded by this extension
  //
  // if (typeof $ === 'undefined') {
  //   $ = gjq;
  //   console.dir($);
  // }
}

// $.noConflict();
// jQuery( document ).ready(function( $ ) {
//   // Code that uses jQuery's $ can follow here.


function hideHover() {
  if (noisy) { log('ij', 'hideHover') }
  gjq('#overlay').hide();
}

function hoverIsPresent() {
  if (noisy) { log('ij', 'hoverIsPresent') }
  return gjq('#overlay').length > 0;
}

function makeSiteTagsRowElement(pin, tags) {
  if (logMakeSiteTagsRowElement) { log('ij', 'makeSiteTagsRowElement', 'pin:', pin, 'tags:', tags) }
  let container
  let main

  if (pinTagsAsList) {
    const table = document.createElement('div')
    table.setAttribute('class', 'scrollmenu')
    container = table
    main = table
  } else {
    const table = document.createElement('table')
    table.setAttribute('class', 'pure-table pure-table-horizontal')
    const tbody = document.createElement('tbody')
    tbody.setAttribute('class', '')
    const tr1 = document.createElement('tr')
    tr1.setAttribute('class', 'pure-table-odd')
    tbody.appendChild(tr1)
    table.appendChild(tbody)
    container = tr1
    main = table
  }

  if (uxRecentRowWithCloseButton) {
    const img = document.createElement('img')
    gjq(img).attr('src', 'data:image/svg+xml;base64,' + b64IconClear24pxSvg)
    gjq(img).attr('class', 'svg-hot')

    gjq(img).click(event => {
      if (noisy) console.log(' !! ij makeSiteTagsRowElement img.click()')
      event.preventDefault()
      removeHover();
    })

    if (pinTagsAsList) {
      const cell = document.createElement('span')
      cell.setAttribute('class', 'tiny')
      cell.appendChild(img)
      container.appendChild(cell)
      if (injectOptions.hoverShowTooltips) { addTooltip(cell, 'Close Hoverboard') }
    } else {
      const td1 = document.createElement('td')
      td1.appendChild(img)
      container.appendChild(td1)
    }
  }

  let buttoner = new Buttoner(gjq, injectOptions, container);
  let overlay = new Overlay(gjq, document, gTabId, gTitle, gUrl);

  if (uxRecentRowWithPrivateButton) {
    buttoner.addAnchorPrivate(gPin);
  }

  if (uxRecentRowWithBookmarkButton) {
    buttoner.addAnchorToRead(gPin);
  }

  if (uxRecentRowWithInput) {
    buttoner.addTextboxAddTag(document, container, 'New Tag', 6, pin, document.title, addTagAnchorId,
      response => {
        if (noisy) { log('ij', 'makeSiteTagsRowElement', 'adat', 'response:', response) }
        setTimeout(() => { overlay.refreshHover() }, 3000)
      }
    )
  }

  if (uxRecentRowWithBlock) {
    buttoner.addAnchorInhibitUrl(pin.url);
  }

  if (uxRecentRowWithDeletePin) {
    if (pin.hash !== '') {
      buttoner.addAnchorDeletePin(pin.description, pin.url);
    }
  }

  if (false) {
    const img = document.createElement('img')
    gjq(img).attr('src', 'data:image/svg+xml;base64,' + b64IconBookmark24pxSvg)
    gjq(img).attr('class', pin.toread === 'yes' ? 'svg-hot' : 'svg-cold')
    // let button = document.createElement('button');
    gjq(img).attr('id', 'go-to-options')

    if (pinTagsAsList) {
      const cell = document.createElement('span')
      cell.setAttribute('class', 'tiny')
      cell.appendChild(img)
      container.appendChild(cell)
    } else {
      const td1 = document.createElement('td')
      td1.appendChild(img)
      container.appendChild(td1)
    }

    gjq(img)[0].addEventListener('click', event => {
      event.preventDefault()
      if (chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage()
      } else {
        window.open(chrome.runtime.getURL('src/optionsCustom/index.html'))
      }
    })
  }

  const td = document.createElement('span')
  td.setAttribute('class', 'tiny')
  td.textContent = 'Current:'
  if (injectOptions.hoverShowTooltips) { addTooltip(td, 'Tags for this Bookmark (2-click-delete)', WIDEN) }
  // gjq(td).attr('class', 'rowHeading');
  if (pinTagsAsList) {
    const cell = document.createElement('span')
    cell.setAttribute('class', 'tiny')
    cell.appendChild(td)
    container.appendChild(cell)
  } else {
    const td1 = document.createElement('td')
    td1.appendChild(td)
    container.appendChild(td1)
  }

  tags.forEach((value, index) => {
    if (typeof value === 'string') {
      if (noisy) { console.log(' !! ij 362') }
      tag = makeRecentAnchor(gjq, Object.assign({}, pin, {
        tags: pin.siteTags
      }), value, makeRecentAnchor2)
      gjq(tag).attr('class', 'iconTagDeleteInactive')
      if (pinTagsAsList) {
        const cell = document.createElement('span')
        cell.setAttribute('class', 'tiny')
        cell.appendChild(tag)
        container.appendChild(cell)
      } else {
        const td1 = document.createElement('td')
        td1.appendChild(tag)
        container.appendChild(td1)
      }
    } else {
      if (pinTagsAsList) {
        const cell = document.createElement('span')
        cell.setAttribute('class', 'tiny')
        cell.appendChild(value)
        container.appendChild(cell)
      } else {
        const td1 = document.createElement('td')
        td1.appendChild(value)
        container.appendChild(td1)
      }
    }
  })

  // // #tags
  // var tagsDiv = document.createElement('div');
  // tagsDiv.setAttribute('id', 'tagsDiv');
  // if (currentInHorizontalMenu) { tagsDiv.setAttribute('class', 'custom-menu-horizontal pure-menu pure-menu-horizontal pure-menu-scrollable'); }
  // // if (currentInHorizontalMenu) { tagsDiv.setAttribute('class', 'pure-u-1 pure-menu-heading'); }
  // td1.appendChild(tagsDiv);
  return main
}

function newHoverConfig() {
  if (noisy) { log('ij', 'newHoverConfig') }
  const obj = {
    displayNow: true,
    pageLoad: false,
    // showHoverOnPageLoad
    tabId: 0,
    useBlock: false
  };
  Array.prototype.forEach.call(
    arguments,
    arg => Object.assign(obj, arg)
  )
  // log('newHoverConfig', 'obj:', obj)
  return obj;
}

function occurrence(array) {
  'use strict'
  const result = {}
  if (array instanceof Array) {
    array.forEach((v, i) => {
      if (!result[v]) {
        result[v] = [i]
      } else {
        result[v].push(i)
      }
    })
    Object.keys(result).forEach(v => {
      result[v] = { index: result[v], length: result[v].length };
    })
  }
  return result
};

function readLocalSettings() {
  if (noisySettings) { log('in', 'readLocalSettings') }
  return new Promise(async (resolve, reject) => {
    try {
      BRSendMessage(
        { action: msgBackReadOptions },
        response => {
          if (noisySettings) { log('in', 'readLocalSettings', 'response:', response) }
          resolve(response)
        }
      )
    } catch (error) {
      if (noisySettings) { log('in', 'readLocalSettings', 'error:', error) }
      reject(error)
    }
  })
}

function removeHover() {
  if (noisySettings) { log('in', 'removeHover') }
  gjq('#overlay').remove();
}

// ===
//
let allit
const hovinj = new HoverInjector(document)
let gPin
let gTabId = ''
let gTitle = ''
const gUrl = document.location.href

// ===
//

function displayHover(hoverConfig) {
  if (noisy) { log('ij', 'displayHover') }
  BRSendMessage(
    {
      action: msgBackReadCurrent,
      tabId: hoverConfig.tabId,
      title: document.title,
      url: gUrl,
      useBlock: hoverConfig.useBlock
    },
    response => {
      if (noisy || logReadCurrentResponse) { log('ij', 'displayHover', 'crsm', 'action:', 'msgBackReadCurrent', 'response:', response) }
      gPin = newPin(response);
      if (noisy) { log('ij', 'displayHover', 'gPin:', gPin) }
      const show = hoverConfig.displayNow || showHoverOnPageLoad;
      if (show && response) {
        hovinj.loadSite(hoverConfig.pageLoad, gPin, show);
      }
    }
  )
}

function displayHoverAfterDelayAndResolve(
  delay,
  injectOptions,
  inhibitSitesOnPageLoad,
  gTabId,
  uxAutoCloseTimeout,
  resolve
) {
  if (noisy) { log('ij', 'displayHoverAfterDelayAndResolve') }
  setTimeout(() => {
    displayHover(
      newHoverConfig({
        pageLoad: true,
        useBlock: inhibitSitesOnPageLoad,
        displayNow: false,
        tabId: gTabId
      })
    );
    if (injectOptions.showHoverOnPageLoad) {
      if (uxAutoCloseTimeout > 0) {
        setTimeout(
          () => { removeHover() },
          uxAutoCloseTimeout
        );
      }
    }
    resolve();
  }, delay)
}

if (false) {
  // Fired when a connection is made from either an extension process or a content script (by connect).
  //
  chrome.runtime.onConnect.addListener(port => {
    if (noisy) { log('ij', 'c.r.onCnc', 'port:', port) }
  });
}

if (false) { // chrome.runtime.onConnectExternal is undefined in Brave
  // Fired when a connection is made from another extension (by connect).
  //
  chrome.runtime.onConnectExternal.addListener(port => {
    if (noisy) { log('ij', 'c.r.onCExt', 'onConnectExternal', 'port:', port) }
  });
}

if (false) { // chrome.runtime.onInstalled is undefined in Brave
  // Fired when the extension is first installed, when the extension is updated to a new version, and when Chrome is updated to a new version.Fired when the extension is first installed, when the extension is updated to a new version, and when Chrome is updated to a new version.
  //
  chrome.runtime.onInstalled.addListener(details => {
    if (noisy) { log('ij', 'c.r.onIns', 'onInstalled', 'details:', details) }
    chrome.contextMenus.create({
      "id": "sampleContextMenu",
      "title": "Sample Context Menu",
      "contexts": ["selection"]
    });
  });
}

// Fired when a message is sent from either an extension process (by sendMessage) or a content script (by tabs.sendMessage).
//
chrome.runtime.onMessage.addListener((message, sender, senderResponse) => {
  if (noisy) { log('ij', 'c.r.onMsg', 'message:', message) }

  let overlay = new Overlay(gjq, document, gTabId, gTitle, gUrl);
  if (message.message === msgTabCheckPage) {
    // toggle display of Hover
    //
    if (false) { // use add+remove instead to force data refresh
      // toggle display
      //
      gjq('#overlay').toggle()
    } else if (gjq('#overlay').length) {
      // exists, remove it
      //
      removeHover();
    } else {
      // display it
      //
      /// load without block list
      displayHover(
        newHoverConfig({
          displayNow: true,
          pageLoad: false,
          tabId: gTabId,
          useBlock: false
        })
      );
    }
  } else if (message.message === msgTabCloseIfToRead) {
    ///
    if (noisyDev) { log(' * * *', 'ij msg',
     'message:', message,
     'msgTabCloseIfToRead', 'gPin:', gPin, 'gUrl:', gUrl) }
    // sendToTab(tab.id, {
    //   message: msgTabCloseIfToRead,
    //   tabId: message.tabId
    // })
    if (gPin.toread === 'yes') {
      if (noisyDev) { log(' * * *', 'ij msg', 'toread tested, deleting window') }
      window.close()
      // setTimeout(() => window.close(), 1e3)
    }

  } else if (message.message === msgTabHideOverlay) {
    removeHover();
  // } else if (message.message === msgB2fOptions) {
  //   // background sets foreground injectOptions
  //   //
  //   injectOptions = Object.assign({}, message.data, { url: gUrl })
  //   if (noisy) { log('injectOptions:', injectOptions) }
  } else if (message.message === msgTabRefreshData) {
    overlay.refreshData()
  } else if (message.message === msgTabRefreshHover) {
    overlay.refreshHover()
  } else if (message.message === msgTabToggleHover) {
    overlay.toggleHover()
  } else {
    log('ERROR unrecognized', 'message.message:', message.message)
    console.error('unrecognized message.message: ' + message.message)
  }
})

if (false) { // chrome.runtime.onMessageExternal is undefined in Brave
  // Fired when a message is sent from another extension/app (by sendMessage). Cannot be used in a content script.
  //
  chrome.runtime.onMessageExternal.addListener((message, sender, senderResponse) => {
    if (noisy) { log('ij', 'cr', 'onMessageExternal') }
  });
}

if (false) { // chrome.runtime.onStartup is undefined in Brave
  // Fired when a profile that has this extension installed first starts up. This event is not fired when an incognito profile is started, even if this extension is operating in 'split' incognito mode.
  //
  chrome.runtime.onStartup.addListener(() => {
    if (noisy) { log('ij', 'cr', 'onStartup') }
  });
}

if (false) { // chrome.runtime.onSuspend is undefined in Brave
  // Sent to the event page just before it is unloaded.
  //
  chrome.runtime.onSuspend.addListener(() => {
    if (noisy) { log('ij', 'cr', 'onSuspend') }
  });
}

if (false) { // chrome.runtime.onSuspendCanceled is undefined in Brave
  // Sent after onSuspend to indicate that the app won't be unloaded after all.
  //
  chrome.runtime.onSuspendCanceled.addListener(() => {
    if (noisy) { log('ij', 'cr', 'onSuspendCanceled') }
  });
}

if (false) { // chrome.runtime.onUpdateAvailable is undefined in Brave
  // Fired when an update is available, but isn't installed immediately because the app is currently running.
  //
  chrome.runtime.onUpdateAvailable.addListener(details => {
    if (noisy) { log('ij', 'cr', 'onUpdateAvailable') }
  });
}

// synch with background
//
sendToExtension(
  { action: msgBackGetTabId, url: gUrl },
  response => {
    if (noisy) { log('ij', 'cesm', 'action:', 'msgBackGetTabId', 'response:', response) }
    gTabId = response.tabId
    if (noisy) { log('ij', 'cesm', 'action:', 'msgBackGetTabId', 'gTabId:', gTabId) }
  }
)

// ==

// log('chrome.extension:', chrome.extension)
// log('chrome.browserAction:', chrome.browserAction)
// log('chrome.pageAction:', chrome.pageAction)
sendToExtension(
  { action: msgBackInjectOnComplete },
  response => {
    if (noisy) { log('ij', 'cesm', 'action:', 'msgBackInjectOnComplete', 'response:', response) }
    const readyStateCheckInterval = setInterval(async () => {
      if (document.readyState === 'complete') {
        if (noisy) { log('ij', 'cesm', 'document.readyState=', 'complete') }
        clearInterval(readyStateCheckInterval)
        // c.l appears in fg
        await new Promise(async (resolve, reject) => {
          try {
            // let authSettings = await readLocalSettings();
            // if (noisyAuth) { log('msgBackInjectOnComplete authSettings:', authSettings) }

            injectOptions = Object.assign({}, await readLocalSettings())
            // if (noisyAuth) { log('ij.js gOptions:', gOptions) }

            // BRSendMessage(
            //   { action: msgBackInhibitUrlAppend,
            //     inhibit: '1' },
            //   response => {
            //     if (noisySettings) { log('msgBackInhibitUrlAppend response:', response) }
            //     resolve(response);
            //   }
            // );

            // BRSendMessage(
            //   { action: msgBackReadPin },
            //   response => {
            //     if (noisySettings) { log('msgBackReadPin response:', response) }
            //     resolve(response);
            //   }
            // );

            if (noisy) { log('ij', 'cesm', 'action:', 'msgBackInjectOnComplete', ':', ) }
            if (logVersionOnPageLoad) {
              const manifestData = chrome.runtime.getManifest()
              log('ij', 'cesm', 'action:', 'msgBackInjectOnComplete', manifestData.name, 'version:', manifestData.version)
            }
            if (logSiteUrlOnSiteLoad) console.log('url: ' + gUrl)

            displayHoverAfterDelayAndResolve(
              3000,
              injectOptions,
              inhibitSitesOnPageLoad,
              gTabId,
              uxAutoCloseTimeout,
              resolve
            );
          } catch (error) {
            reject(error)
          }
        })
      }
    }, 10)
  }
)

if (noisy) { console.log('ij', 'EOF') }
