if (noisyActionLoad) { log('BOF') }

const recentInHorizontalMenu = false
let gPin
let gTabId = ''
let gTitle = ''
let gUrl = ''

function actionDev(gjq) {
  if (noisyDev) { log(' * * *', ' !! ba cst') }
  BRSendMessage(
    { action: msgBackDev },
    response => {
      if (noisyDev) { log(' * * *', ' !! ba cst sm', 'response:', response) }
    }
  )
}

async function getBackSearchTitleText() {
  return new Promise(async (resolve, reject) => {
    if (noisyAction) { log('ba', 'getBackSearchTitleText') }
    try {
log('- - - - 1', 'ba')
      sendToExtension(
        { action: msgBackSearchTitleText },
        response => {
          if (noisyAction) { log('ba', 'getBackSearchTitleText', 'cesm', 'action:', 'msgBackSearchTitleText', 'response:', response) }
          resolve(response);
        }
      );
    } catch (error) {
      if (noisyAction) { log('ba', 'getBackSearchTitleText', 'cesm', 'error:', error) }
      reject(error);
    }
  });
}

function closePopup() {
  setTimeout(() => window.close(), 1e3)
}

function log() {
  const args = Array.prototype.map.call(
    arguments,
    arg => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg))
  )
  const msg = Array.prototype.join.call(args, ' ');
  console.log(msg);

  chrome.runtime.sendMessage(
    { action: msgBackEcho,
      data: {
        source: 'BA',
        message: msg,
        time: Date.now()
      }
    },
    response => {
      // if (noisyDev) { log('ba logBack crsm cb', 'response:', response) }
    }
  );
}

async function readCurrTabPin() {
  return new Promise(async (resolve, reject) => {
    try {
      chrome.tabs.query({active: true, currentWindow: true}, tabs => {
        if (noisyAction) { log('readCurrTabPin', 'ctq', 'tabs:', tabs) }
        let url = tabs[0].url;
        sendToExtension({ action: msgBackReadPin, url: url }, function (res) {
          if (noisyAction) { log('readCurrTabPin', 'cesm', msgBackReadPin, 'res:', res) }

          obj = {
            pin: res,
            tabId: tabs[0].id,
            title: tabs[0].title,
            url: url
          };
          if (noisyAction) { log('readCurrTabPin', 'cesm', 'obj:', obj) }
          resolve(obj);
        });
      })
    } catch (error) {
      if (noisyAction) { log('readCurrTabPin', 'error:', error) }
      reject(error);
    }
  });
}

document.addEventListener('DOMContentLoaded', async function () {
  if (noisyAction) { log('dael', 'BOF') }

  site = await readCurrTabPin();
  if (noisyAction) { log('dael', 'site:', site) }
  gPin = site.pin;
  gTabId = site.tabId;
  gTitle = site.title;
  gUrl = site.url;
  if (noisyAction) { log('dael', 'site:', site) }

  container = gjq('#mainPopup')[0]

  let buttoner = new Buttoner(gjq, injectOptions, container);
  buttoner.addAnchorShowHoverboard();
  buttoner.addAnchorPrivate(gPin);
  buttoner.addAnchorToRead(gPin);
  // buttoner.addAnchorDev(gPin);

  buttoner.addTextboxAddTag(
    document, container, 'add Tag', 6, gPin, gTitle, addTagAnchorId,
    response => {
      if (noisy) { log('dael', 'addTextboxAddTag', 'response:', response) }
      let overlay = new Overlay(gjq, document, gTabId, gTitle, gUrl);
      setTimeout(() => { overlay.refreshHover() }, 3000)
    }
  )

  let initialSearchTitleText = await getBackSearchTitleText();
  buttoner.addGroupSearchTitle(document, container, gTabId, initialSearchTitleText)

  buttoner.addAnchorDeletePin(gPin.description, gPin.url);
  buttoner.addAnchorReload();

  // buttoner.addTextRemovableTags(['A', 'BB', 'CCC'], gPin, injectOptions, container);

  if (noisyAction) { log('dael', 'EOF') }
}, false)


// function log() {
//   const args = Array.prototype.map.call(
//     arguments,
//     arg => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg))
//   )
//   // console.log(Array.prototype.join.call(args, " "));
//   sendToExtension({ action: msgBackEcho, data: Array.prototype.join.call(args, ' ') })
// }

if (true) {
  // if (noisyDev) { log('ba loading, send msgBackEcho') }
  log('loaded')
  // BRSendMessage(
  //   { action: msgBackEcho,
  //     data: {
  //       cause: 'loaded',
  //       source: 'ba',
  //       time: Date.now()
  //     }
  //   },
  //   response => {
  //     // if (noisyDev) { log('ba loading sm cb', 'response:', response) }
  //   }
  // )
}

if (noisyActionLoad) { log('EOF') }
