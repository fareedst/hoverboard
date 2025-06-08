class Overlay {
  constructor(gjq, doct, tabId, title, url) {
    if (noisyOverlay) { log('ba', 'Overlay', 'constructor', 'tabId:', tabId) }
    this.doct = doct;
    this.gjq = gjq;
    this.tabId = tabId;
    this.title = title;
    this.url = url;
  }

  deletePin(url) {
    if (noisyOverlay) { log('ba', 'Overlay', 'deletePin') }
    this.hideHover()
    BRSendMessage(
      {
        action: msgBackDeletePin,
        url: url
      },
      response => {
        if (noisyOverlay) { log('ba', 'Overlay', 'deletePin', 'response:', response) }
        closePopup();
        this.refreshData()
      }
    )
  }

  deleteTag(pin, value) {
    if (noisyOverlay) { log('ba', 'Overlay', 'deleteTag') }
    this.hideHover();
    BRSendMessage(
      Object.assign({}, pin, {
        action: msgBackDeleteTag,
        description: betterDescription(pin.description, this.title),
        hash: '',
        value: value
      }),
      response => {
        if (noisyOverlay) { console.log('ba', 'Overlay', 'deleteTag', 'response:', response) }
        closePopup();
        this.refreshData();
      }
    )
  }

  hideHover() {
    if (noisyOverlay) { log('ba', 'Overlay', 'hideHover') }
    sendToTab(this.tabId, { message: msgTabHideOverlay })
  }

  inhibitUrl() {
    if (noisyOverlay) { log('ba', 'Overlay', 'inhibitUrl') }
    this.hideHover();
    BRSendMessage(
      {
        action: msgBackInhibitUrlAppend,
        inhibit: this.url
      },
      response => {
        if (noisyOverlay) { log('ba', 'Overlay', 'inhibitUrl', 'response:', response) }
        closePopup();
      }
    )
  }

  // refreshData() {
  //   if (noisyOverlay) { log('ba', 'Overlay', 'refreshData') }
  //   setTimeout(() => sendToTab(this.tabId, { message: msgTabRefreshData }), 0.5e3)
  // }

  refreshData() {
    if (noisyOverlay) { log('ba', 'Overlay', 'refreshData') }
    BRSendMessage(
      {
        action: msgBackReadCurrent,
        tabId: this.tabId,
        title: this.title,
        url: this.url,
        useBlock: false
      },
      response => {
        if (noisyOverlay) { log('ba', 'Overlay', 'refreshData', 'response:', response) }
        // this.pin = response
      }
    )
  }

  refreshHover() {
    if (noisyOverlay) { log('ba', 'Overlay', 'refreshHover') }
    sendToTab(this.tabId, { message: msgTabRefreshHover })
  }

  savePin(obj) {
console.log('ba 76')
log('ba', 'Overlay', 'savePin', 'pin:', obj.pin, 'value:', obj.value, 'id:', obj.id)
log('ba', 'Overlay', 'savePin', 'value:', obj.value, 'id:', obj.id)
    if (noisyOverlay) { log('ba', 'Overlay', 'savePin', obj.pin, obj.value, obj.id) }
// log('this.doct:', this.doct)
// var ins = this.gjq(this.doct).find('input');
// var ins = this.gjq('#' + id);
    if (obj.id !== '') {
// console.log('ba 80')
// log('ins:', ins)
// log('ins.length:', ins.length)
// log('ins[0]:', ins[0])
// log('ins.text():', ins.text())
// log('ins.val():', ins.val())
// log('ins[0].text():', ins[0].text())
//       log(this.gjq(this.doct).find('input').count())
//       log(this.gjq(this.doct).find('#' + id))
      value = this.gjq('#' + obj.id).val();
      if (noisyOverlay) { log('ba', 'Overlay', 'savePin', 'value:', value) }
console.log('ba 84')
    }
console.log('ba 86')
    this.hideHover();
    BRSendMessage(
      newPin(
        obj.pin,
        {
          action: msgBackSaveTag,
          description: betterDescription(obj.pin.description, this.title),
          value: obj.value
        }
      ),
      response => {
        if (noisyOverlay) { log('ba', 'Overlay', 'response:', response) }
        closePopup();
        this.refreshData()
      }
    )
  }

  toggleHover() {
    if (noisyOverlay) { log('ba', 'Overlay', 'toggleHover') }
    // will fail silently if called after the extension is reloaded in browser
    // and not reloaded in the current tab
    sendToTab(this.tabId, { message: msgTabToggleHover });
  }
}
