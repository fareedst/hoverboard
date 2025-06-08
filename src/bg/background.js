if (noisy) { console.log('bg', 'BOF'); }
log('bg', 'load time:', Date.now())


async function getPinForUrl(url, title) {
  if (noisy) { log('bg', 'getPinForUrl', 'url:', url) }

  try {
    let data = await fetchPinForUrl(url);
    if (logSiteUrlOnSiteLoad) { log('bg', 'fetchPinForUrl', 'url:', url, 'data:', data) }

    return minEmpty(data, title);
  }
  catch (error) {
    if (noisy) { log('bg', 'fetchPinForUrl', 'url:', url, 'error:', error.toString()) }
    return newPin();
  }
}

class Action {
  constructor(request) {
    if (noisy) { log('Action#constructor', 'request:', request) }
    this.request = Object.assign(request)
  }

  readRecentTags(senderTabUrl, sendResponse) {
    let request = this.request;
    readRecentTags(
      request.description,
      request.time,
      request.extended,
      request.shared,
      request.tags,
      request.toread,
      senderTabUrl
    ).then(data => {
      if (noisy) { log('Action#readRecentTags', 'data:', data); }
      sendResponse(
        newPin(
          minEmpty(request),
          data
        )
      );
    });    
  }
}

class AuthSettings {
  constructor() {
    if (noisyAuth) { console.log('AuthSettings#constructor'); }
    this.token = "fareed:FC8FFFF0E8CA1EE01FDD"; ///
  }

  getOptions() {
    if (noisyAuth) { console.log('AuthSettings#getOptions'); }
    let settings = new Store('settings');
    this.setInhibit(settings.get('inhibit') || '');
    this.setToken(settings.get('token') || '');
    // if (logAuthSentToFg) { log('gAuthSettings:', gAuthSettings) }
    let options = {
      'badgeTextIfBookmarkedNoTags': settings.get('badgeTextIfBookmarkedNoTags'),
      'badgeTextIfNotBookmarked': settings.get('badgeTextIfNotBookmarked'),
      'badgeTextIfPrivate': settings.get('badgeTextIfPrivate'),
      'badgeTextIfQueued': settings.get('badgeTextIfQueued'),
      'recentPostsCount': settings.get('recentPostsCount'),
      'showHoverOnPageLoad': settings.get('showHoverOnPageLoad'),
      'hoverShowTooltips': settings.get('hoverShowTooltips')
    };
    if (logOptionsSentToFg) { log('options:', options) }
    return options;
  }

  getResponse() {
    if (noisyAuth) { console.log('AuthSettings#getResponse'); }
    return {
      inhibit: this.inhibit,
      token: this.token
    }
  }

  getToken() {
    if (noisyAuth) { console.log('AuthSettings#getToken'); }
    return this.token;
  }

  inhibitUrl(url) {
    if (noisyAuth) { console.log('AuthSettings#inhibitUrl'); }
    let settings = new Store('settings');
    this.setInhibit((settings.get('inhibit') || '') + '\n' + url);
    this.setToken(settings.get('token'));
    // this.inhibit = request.inhibit;
    settings.set('inhibit', this.inhibit);
    // if (logAuthSentToFg) { log('gAuthSettings:', this) }
    return this.getResponse();
  }

  setInhibit(inhibit) {
    if (noisyAuth) { console.log('AuthSettings#setInhibit'); }
    this.inhibit = inhibit;
  }

  setToken(token) {
    if (noisyAuth) { console.log('AuthSettings#setToken'); }
    this.token = token;
  }

  tokenAsVar() {
    if (noisyAuth) { console.log('AuthSettings#tokenAsVar'); }
    return 'auth_token=' + this.token;
  }

  tokenExists() {
    if (noisyAuth) { console.log('AuthSettings#tokenExists'); }
    return this.token.length > 0;
  }
}

class BadgeAttributes {
  constructor(badgeTextIfNotBookmarked, badgeTextIfPrivate, badgeTextIfQueued, numTags, saved, shared, toread) {
    // console.log('BadgeAttributes#constructor');
    this.badgeTextIfNotBookmarked = badgeTextIfNotBookmarked;
    this.badgeTextIfPrivate = badgeTextIfPrivate;
    this.badgeTextIfQueued =  badgeTextIfQueued;
    this.numTags = numTags;
    this.saved = saved;
    this.shared = shared;
    this.toread = toread;
    // console.log('BadgeAttributes ' + this.numTags + ',' + this.saved + ',' + this.shared + ',' + this.toRead + '')
  }

  backgroundColor() {
    return this.saved ? "#000" : "#222";
  }

  badgeIcon() {
    return this.saved ? "icons/hoverboard_19b.png" : "icons/hoverboard_19.png";
  }

  badgeText(settings) {
    /// text if blocked
    if (!this.saved) return this.badgeTextIfNotBookmarked;

    // if (this.numTags == 0) return gOptions.badgeTextIfBookmarkedNoTags;
    let text = '';
    if (this.shared === 'no') text += this.badgeTextIfPrivate;
    text += this.numTags.toString();
    if (this.toread === 'yes') text += this.badgeTextIfQueued;
    return text;
  }

  badgeTitle() {
    return '';
  }
}

function initOptions() {
  // console.log('initOptions()');
  let settings = new Store('settings');
  settings.set('badgeTextIfBookmarkedNoTags', '0');
  settings.set('badgeTextIfNotBookmarked', '-');
  settings.set('badgeTextIfPrivate', ' * ');
  settings.set('badgeTextIfQueued', ' ! ');
  settings.set('recentPostsCount', initRecentPostsCount);
  settings.set('showHoverOnPageLoad', showHoverOnPageLoad);
  settings.set('hoverShowTooltips', hoverShowTooltips);
}

function paintBadge(senderTabId, saved, numTags, shared, toread) {
  if (noisy) { log('update browserAction icon', 'senderTabId:', senderTabId) }
  let settings = new Store('settings');
  let badge = new BadgeAttributes(
    settings.get('badgeTextIfNotBookmarked'),
    settings.get('badgeTextIfPrivate'),
    settings.get('badgeTextIfQueued'),
    numTags, saved, shared, toread);
  chrome.browserAction.setBadgeBackgroundColor({
    color: badge.backgroundColor(),
    tabId: senderTabId
  });
  chrome.browserAction.setBadgeText({
    text: badge.badgeText(),
    tabId: senderTabId
  });
  chrome.browserAction.setIcon({
    path: badge.badgeIcon(),
    tabId: senderTabId
  });
  chrome.browserAction.setTitle({
    title: badge.badgeTitle(),
    tabId: senderTabId
  });
}

// restrict specific domains
//
function urlIsAllowed(request, url, sendResponse) {
  let allowed = true;
  if (request.useBlock) {
    let settings = new Store('settings');
    let inhibit = settings.get('inhibit');
    if (!inhibit) {
      allowed = true;
    } else {
      let block = inhibit.split('\n').filter(s => s !== '');
      if (block.some(item => url.startsWith(item))) {
        if (noisy) { console.log('url blocked'); }
        allowed = false;
        sendResponse({
          blocked: true,
          url: url
        });
      }
    }
  }
  return allowed;
}

var lastSearchText = '';
var lastSearchMatchedTabId = 0;

function backSearchTitle(actionTabId, value) {
  if (noisy) { log('bg', 'backSearchTitle', 'actionTabId:', actionTabId, 'value:', value) }
  let normalized = value.toLowerCase();
  if (noisy) { log('bg', 'backSearchTitle', 'normalized:', normalized) }

  let ret = 0;
  // set to continue or start search
  //
  let restartTabId;
  if (lastSearchText === normalized) {
    restartTabId = lastSearchMatchedTabId;
  } else {
    restartTabId = actionTabId;
    lastSearchText = normalized;
  }
  if (noisy) { log('bg', 'backSearchTitle', 'restartTabId:', restartTabId) }

  return new Promise((resolve, reject) => {
    if (noisy) { log('bg', 'backSearchTitle', 'promise', 'BOF') }
    // let obj = {currentWindow: true};
    let obj = {};
    chrome.tabs.query(obj, tabs => {
      // if (noisy) { log('bg', 'backSearchTitle', 'tabs:', tabs) }

      // collect tabs that match criteria
      //
      let selt = [];
      tabs.forEach(tab => {
        // if (noisyDev) { log('bg', 'backSearchTitle', 'tab:', tab, 'tab title:', tab.title) }
        let ttl = tab.title.toLowerCase();
        let tti = ttl.includes(normalized);
        // if (noisyDev) { log('bg', 'backSearchTitle', 'ttl:', ttl, 'tti:', tti) }

        if (tab.title.toLowerCase().includes(normalized)) {
          selt.push(tab)
        }
        // chrome.tabs.remove(tab.id, () => {})
        // if (false) { sendToTab(tab.id, { message: msgTabCloseIfToRead, pin: pin, tabId: actionTabId }) }
      })
      if (noisyDev) { log('bg', 'backSearchTitle', 'selt.length:', selt.length) }
      // if (noisy) { log('bg', 'backSearchTitle', 'selt:', selt) }

      // get next larger than initial tabId or lowest in order
      //
      let firstOrNext = 0;
      let matchWindowId;
      let matchTabId = restartTabId;
      selt.forEach(tab => {
        if (noisyDev) { log('bg', 'backSearchTitle', 'selt', 'tab title:', tab.title, 'tab id:', tab.id) }
        if (firstOrNext === 0) {
          if (tab.id > restartTabId) {
            // first potential next
            firstOrNext = 1;
            matchTabId = tab.id;
            matchWindowId = tab.windowId;
          } else if (tab.id < matchTabId) {
            // new lowest
            matchTabId = tab.id;
            matchWindowId = tab.windowId;
          }
        } else {
          if (tab.id > restartTabId && tab.id < matchTabId) {
            // lower potential next
            matchTabId = tab.id;
            matchWindowId = tab.windowId;
          }
        }
      })
      if (noisyDev) { log('bg', 'backSearchTitle', 'selt', 'restartTabId:', restartTabId, 'firstOrNext:', firstOrNext, 'matchTabId:', matchTabId) }
      if (matchTabId !== restartTabId) {
        lastSearchMatchedTabId = matchTabId;
        /// display found tab
        chrome.tabs.update(matchTabId, {active: true});
        chrome.windows.update(matchWindowId, {focused: true});
      }
      resolve(selt.length);
      if (noisy) { log('bg', 'backSearchTitle', 'promise', 'EOF') }
    });
  });
}

function backSearchTitleRepeat() {
  if (noisy) { log('bg', 'backSearchTitleRepeat') }
  return backSearchTitle(lastSearchMatchedTabId, lastSearchText);
}

// Called when the user clicks on the browser action if the popup is not enabled (per manifest)
chrome.browserAction.onClicked.addListener(tab => {
  if (noisy) { log('bg', 'c.ba.onClk', 'tab:', tab) }
  sendToActiveTab({ "message": msgTabCheckPage });
});

chrome.extension.onMessage.addListener(
  (request, sender, sendResponse) => {
    if (noisyBackgroundChromeExtensionOnMessageListener) { log('bg', 'c.e.onMsg', 'request:', request, 'sender:', sender) }
    if (noisy) { log('bg', 'c.e.onMsg', 'action:', request.action) }
    if (false) {
    // } else if (request.action === 'getPin' ) {
    //   // synch with popup
    //   //
    //   let pinp = { pin: gPin, tabId: gTabId }
    //   if (noisy) { log('chrome.extension.onMessage listener() getPin', 'pinp:', pinp); }
    //   sendResponse({ pin: gPin, tabId: gTabId });

    // } else if (request.action === 'echo' ) {
    //   if (noisy) { log('chrome.extension.onMessage listener() echo', 'data:', request.data); }
    //   sendResponse({});
    } else if (request.action === msgBackGetTabId ) {
      if (noisy) { log('bg', 'c.e.onMsg', 'msgBackGetTabId', 'sender.tab:', sender.tab) }
      sendResponse({ tabId: sender.tab.id });

    } else if (request.action === msgBackInjectOnComplete) {
      sendResponse(true);

    } else if (request.action === msgBackEcho) {
      // if (noisyDev) { log('bg ceom', msgBackEcho, 'request.data:', request.data); }
      if (noisyAction) { log('. . .', request.data); }
      sendResponse(request);

    } else if (request.action === msgBackDeletePin) {
      sendResponse((new Pb(request.url)).deletePin(request.url));

    } else if (request.action === msgBackDeleteTag) {
      sendResponse((new Pb(request.url)).deleteTag(request));

    } else if (request.action === msgBackInhibitUrlAppend) {
      sendResponse(gAuthSettings.inhibitUrl(request.inhibit));

    } else if (request.action === msgBackReadCurrent) {
      if (noisy) { log('bg', 'c.e.onMsg', 'action', 'msgBackReadCurrent', 'request:', request) }
      let url = request.url;
      let fgTabId = request.tabId;
      if (urlIsAllowed(request, url, sendResponse)) {
        url = urlForBookmark(url);
        if (logSiteUrlOnSiteLoad) { log('url:', url) }

        // process url
        // 
        fetchPinForUrl(url).then(data => {
          if (logPinOnLoad) { log('bg', 'c.e.onMsg', 'fetchPinForUrl', 'data:', data) }

          // normalize binary values
          //
          if (data.shared !== 'yes' && data.shared !== 'no') data.shared = 'yes';
          if (data.toread !== 'yes' && data.toread !== 'no') data.toread = 'no';

          let pin = minEmpty(data, request.title);
          if (logPinOnLoad) { log('logPinOnLoad:', pin) }
          if (setIconOnLoad) {
            if (noisy) { log('data:', data, 'sender:', sender, 'fgTabId:', fgTabId) }
            paintBadge(fgTabId, pin.hash.length > 0, pin.tags.length, pin.shared, pin.toread);
          }
          sendResponse(pin);

          if (noisy) { console.log('<- background.js fetchPinForUrl cb()'); }
        })
        .catch(error => {
          console.log('bg msg error: ' + error.toString());
          sendResponse(newPin());
        });
      }

    } else if (request.action === msgBackReadOptions) {
      sendResponse(gAuthSettings.getOptions());

    } else if (request.action === msgBackSearchTitleText) {
if (noisy) { log('request.action:', request.action, 'lastSearchText:', lastSearchText) }
      sendResponse(lastSearchText);

    } else if (request.action === msgBackReadPin) {
      // let url = sender.tab.url;
      let url = request.url;
      if (urlIsAllowed(request, url, sendResponse)) {
        (async () => {
          // clean URL by removing trailing hash data
          // process url
          // 
          sendResponse(await getPinForUrl(urlForBookmark(url), request.title));
        })();
      }

    } else if (request.action === msgBackReadRecent) {
      if (noisy) { log(msgBackReadRecent, 'request:', request); }
      (new Action(request)).readRecentTags(sender.tab.url, sendResponse);

    } else if (request.action === msgBackSaveTag) {
log('request:', request)
      sendResponse((new Pb(request.url)).saveTag(request));

    } else if (request.action === msgBackSearchTitle) {
      if (noisy) { log('bg', 'c.e.onMsg', msgBackSearchTitle) }
      let cnt;
      if (request.value === undefined) {
        cnt = backSearchTitleRepeat();
      } else {
        cnt = backSearchTitle(request.tabId, request.value);
      }
      if (noisy) { log('bg', 'c.e.onMsg', msgBackSearchTitle, 'cnt:', cnt) }
      sendResponse(cnt) //tabId);this.spanSearchCount

    } else if (request.action === msgBackDev) {
      // dev
      //
      if (noisyDev) { log(' * * *', 'bg ceom', 'request:', request) }
      if (false) {
        chrome.tabs.query({active: false, currentWindow: true}, tabs => {
          tabs.forEach(tab => {
            if (noisyDev) { log(' * * *', 'bg ceom', 'tab:', tab, 'tab title:', tab.title) }

            // chrome.tabs.remove(tab.id, () => {})

            if (true) {
              sendToTab(tab.id, {
                message: msgTabCloseIfToRead,
                pin: pin,
                tabId: tabId
              })
            }
          })
        });
        sendResponse(tabId);
      }
    } else {
if (noisy) { console.log("bg.js 127"); }
      console.error('unrecognized request.action: ' + request.action);
      sendResponse(false);
    }
    return true; // keep port open
  }
);

if (false) { // deprecated
  // Fired when a request is sent from either an extension process or a content script.
  //
  chrome.extension.onRequest.addListener((request, sender, sendResponse) => {
    if (noisy) { log('bg', 'ceor', 'onRequest') }
  });

  // Fired when a request is sent from another extension.
  //
  chrome.extension.onRequestExternal.addListener((request, sender, sendResponse) => {
    if (noisy) { log('bg', 'ce', 'onRequestExternal') }
  });

  // Fired when a connection is made from either an extension process or a content script (by connect).
  //
  chrome.runtime.onConnect.addListener(port => {
    if (noisy) { log('bg', 'cr', 'onConnect', 'port:', port) }
  });

  // Fired when a connection is made from another extension (by connect).
  //
  chrome.runtime.onConnectExternal.addListener(port => {
    if (noisy) { log('bg', 'cr', 'onConnectExternal', 'port:', port) }
  });

  // Fired when the extension is first installed, when the extension is updated to a new version, and when Chrome is updated to a new version.Fired when the extension is first installed, when the extension is updated to a new version, and when Chrome is updated to a new version.
  //
  chrome.runtime.onInstalled.addListener(details => {
    if (noisy) { log('bg', 'cr', 'onInstalled', 'details:', details) }
    // chrome.contextMenus.create({
    //   "id": "sampleContextMenu",
    //   "title": "Sample Context Menu",
    //   "contexts": ["selection"]
    // });
  });

  // Fired when a message is sent from either an extension process (by sendMessage) or a content script (by tabs.sendMessage).
  //
  chrome.runtime.onMessage.addListener((message, sender, senderResponse) => {
    if (noisyBackgroundChromeRuntimeOnMessageListener) { log('bg', 'cr', 'onMessage') }
  });

  // Fired when a message is sent from another extension/app (by sendMessage). Cannot be used in a content script.
  //
  chrome.runtime.onMessageExternal.addListener((message, sender, senderResponse) => {
    if (noisy) { log('bg', 'cr', 'onMessageExternal') }
  });

  // Fired when a profile that has this extension installed first starts up. This event is not fired when an incognito profile is started, even if this extension is operating in 'split' incognito mode.
  //
  chrome.runtime.onStartup.addListener(() => {
    if (noisy) { log('bg', 'cr', 'onStartup') }
  });

  // Sent to the event page just before it is unloaded.
  //
  chrome.runtime.onSuspend.addListener(() => {
    if (noisy) { log('bg', 'cr', 'onSuspend') }
    // chrome.storage.local.set({variable: '2'});
    // chrome.browserAction.setBadgeText({text: ""});
  });

  // Sent after onSuspend to indicate that the app won't be unloaded after all.
  //
  chrome.runtime.onSuspendCanceled.addListener(() => {
    if (noisy) { log('bg', 'cr', 'onSuspendCanceled') }
  });

  //
  //
  chrome.runtime.onUpdateAvailable.addListener(details => {
    if (noisy) { log('bg', 'cr', 'onUpdateAvailable') }
  });

  // this will run when a bookmark is created
  //
  chrome.bookmarks.onCreated.addListener(() => {
    if (noisy) { log('bg', 'cb', 'onCreated') }
  });

  // chrome.storage.local.set({ variable: '1' });
  chrome.webNavigation.onCompleted.addListener(function() {
    alert("This is my favorite website!");
  }, {url: [{urlMatches : 'http://fareed.org/'}]});
}

// chrome.runtime.onMessage.addListener(function(message, sender, reply) {
//   chrome.runtime.onMessage.removeListener(event);
// });

const gAuthSettings = new AuthSettings();

if (noisy) { console.log('bg', 'EOF'); }
