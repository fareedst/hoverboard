class Overlay {
  constructor(gjq, doct, tabId, title, url) {
    if (noisyOverlay) { log('io', 'Overlay', 'constructor', 'tabId:', tabId) }
    this.doct = doct;
    this.gjq = gjq;
    this.tabId = tabId;
    this.title = title;
    this.url = url;
  }

  deletePin(url, eventTarget) {
    if (noisyOverlay) { log('io', 'Overlay', 'deletePin') }
    hideHover();
    BRSendMessage(
      {
        action: msgBackDeletePin,
        url: url
      },
      response => {
        if (noisyOverlay) { log('io', 'Overlay', 'deletePin', 'response:', response) }
        this.gjq(eventTarget).attr('class', 'iconDeletePinInactive');
        setTimeout(() => this.refreshHover(), 0.5e3);
      }
    )
  }

  deleteTag(pin, value) {
    if (noisyOverlay) { log('io', 'Overlay', 'deleteTag') }
    hideHover();
    BRSendMessage(
      newPin(
        pin,
        {
          action: msgBackDeleteTag,
          description: betterDescription(pin.description, this.title),
          value: value
        }
      ),
      response => {
        if (noisyOverlay) { log('io', 'Overlay', 'deleteTag', 'response:', response) }
        setTimeout(() => this.refreshHover(), 0.5e3)
      }
    )
  }

  inhibitUrl() {
    if (noisyOverlay) { log('io', 'Overlay', 'inhibitUrl') }
    this.hideHover();
    BRSendMessage(
      {
        action: msgBackInhibitUrlAppend,
        inhibit: this.url
      },
      response => {
        if (noisyOverlay) { log('io', 'Overlay', 'inhibitUrl', 'response:', response) }
        removeHover();
      }
    )
  }

  refreshData() {
    if (noisyOverlay) { log('io', 'Overlay', 'refreshData') }
    BRSendMessage(
      {
        action: msgBackReadCurrent,
        tabId: this.tabId,
        title: this.title,
        url: this.url,
        useBlock: false
      },
      response => {
        if (noisyOverlay) { log('io', 'Overlay', 'refreshData', 'response:', response) }
        this.pin = response
      }
    )
  }

  refreshHover() {
    if (noisyOverlay) { log('io', 'Overlay', 'refreshHover') }
    removeHover();
    displayHover(
      newHoverConfig({
        displayNow: true,
        pageLoad: false,
        tabId: this.tabId,
        useBlock: false
      })
    );
  }

  savePin(obj) {
log('io', 'Overlay', 'savePin', 'pin:', obj.pin, 'value:', obj.value)
    if (noisyOverlay) { log('io', 'Overlay', 'savePin', 'pin:', obj.pin, 'value:', obj.value) }
    hideHover();
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
        if (noisyOverlay) { log('io', 'Overlay', 'savePin', 'response:', response) }
        setTimeout(() => this.refreshHover(), obj.delay || 0.5e3);
      }
    )
  }

  toggleHover() {
    if (noisyOverlay) { log('io', 'Overlay', 'toggleHover') }
    if (hoverIsPresent()) {
      removeHover();
    } else {
      displayHover(
        newHoverConfig({ pageLoad: false, useBlock: false, displayNow: true, tabId: this.tabId })
      );
    }
  }
}
