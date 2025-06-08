if (noisy) { console.log('pb', 'BOF') }

// const currentInHorizontalMenu = true; // use: pure-menu pure-menu-horizontal pure-menu-scrollable
const recentInHorizontalMenu = true // use: pure-menu pure-menu-horizontal pure-menu-scrollable

class Pb {
  constructor (url) {
    if (noisy) { log('Pb(url: ' + url + ')') }
    this.url = url
    const _apiPath = 'https://api.pinboard.in/v1/'
    let _description
    const _url = url

    this.getApiPath = () => _apiPath
    // this.getAuthTokenSet = () => _gAuth_settings.tokenAsVar;
    this.getAuthTokenSet = () => {
      return gAuthSettings.tokenAsVar()
    }

    this.getPinsUrl = () =>
      this.getApiPath() + 'posts/get?url=' + encodeURIComponent(this.getUrl()) + '&' + this.getAuthTokenSet()

    this.getRecentUrl = () =>
      this.getApiPath() + 'posts/recent?count=' + gAuthSettings.getOptions().recentPostsCount.toString() + '&' + this.getAuthTokenSet()

    this.getUrl = () => { return _url }

    this.hasAuth = () => gAuthSettings.tokenExists()

    this.storePost = resPost => {
      if (noisy) { log('Pb.storePost()') }
      if (logPinOnStore) { log('logPinOnStore:', resPost) }
      if (noisy) { log(resPost.description) }
      this.description = resPost.description
      this.hash = resPost.hash
      this.time = resPost.time
      this.extended = resPost.extended
      this.tag = resPost.tag
      this.tags = resPost.tags
      this.shared = resPost.shared
      this.toread = resPost.toread
      this.url = resPost.url
    }

    this.analyzePage = (url) => {
      if (noisyAnalyze) { log('analyzePage()', 'url:', url) }
      return this.fetchPin({
        pinurl: this.getPinsUrl(),
        play: this.analyzePageCore,
        url: url,
        verb: 'GET'
      });
    }

    this.analyzePageCore = (action, data, resolve, reject) => {
      if (noisyAnalyze) { log('Pb#analyzePageCore', 'action.url:', action.url) }
      let post
      if (!data) {
        post = newPin({
          shared: true,
          toread: false,
          url: action.url
        })
      } else {
        const resPost = data.getElementsByTagName('post')
        if (noisyAnalyze) { log('resPost', 'tags:', $(resPost).attr('tag')) }

        if (noisyAnalyze) { log(resPost) }

        let description = $(resPost).attr('description')
        const hash = $(resPost).attr('hash')
        const time = $(resPost).attr('time')
        let extended = $(resPost).attr('extended')
        const tag = $(resPost).attr('tag')
        const tags = tag ? tag.split(' ') : []
        const shared = $(resPost).attr('shared')
        const toread = $(resPost).attr('toread')
        if (typeof description === 'undefined') {
          description = ''
          // description = document.title || '';
        }
        if (typeof extended === 'undefined') {
          extended = ''
        }
        if (noisyAnalyze) { log(tags) }

        post = {
          description: description,
          hash: hash,
          time: time,
          // title: title,
          extended: extended,
          tag: tag,
          tags: tags,
          shared: shared,
          toread: toread,
          url: action.url
        }
      }
      if (noisyAnalyze) { log(post) }
      this.storePost(post)
      resolve(post)
    }

    this.deletePin = (url, eventTarget) => {
      if (logSiteUrlOnPinDelete) { log('Pb.deletePin()', 'url:', url) }
      return this.fetchPin({
        pinurl: this.deletePinUrl(url),
        play: this.deletePinCore,
        url: url,
        verb: 'GET'
      });
    }

    this.deletePinCore = (_action, httpResult, resolve, _reject) => {
      if (noisy) { log('deletePinCore()'); console.dir(httpResult) }
      setTimeout(() => resolve(httpResult), 3000);
    }

    this.deletePinUrl = (url) => {
      const args = 'url=' + encodeURIComponent(url)
      const pinurl = pinboardApiPath + 'posts/delete?' + args + '&' + gAuthSettings.tokenAsVar()
      return pinurl
    }

    this.deleteTag = (request) => {
      if (logSiteUrlOnTagDelete) { log('Pb.deleteTag()', 'request:', request) }
      return this.fetchPin({
        pinurl: this.deleteTagUrl(request),
        play: this.deleteTagCore,
        url: request.url,
        verb: 'POST'
      });
    }

    this.deleteTagCore = (_action, httpResult, resolve, _reject) => {
      if (noisy) { log('deleteTagCore()', 'httpResult:', httpResult) }
      setTimeout(() => resolve(httpResult), 3000);
    }

    this.deleteTagUrl = (request) => {
      let args = 'replace=yes'
      args = args + '&url=' + encodeURIComponent(request.url)
      if (request.description !== '') args = args + '&description=' + encodeURIComponent(request.description)

      // args = args + '&tags=' + (tags + ' ' + value).replace(' ', '%20').replace('\n', '%20').replace('\r', '');
      // args = args + '&tags=' + encodeURIComponent((request.tags ? request.tags : '') + (request.value ? ' ' + request.value : '') );
      args = args + '&tags=' + encodeURIComponent(
        (request.tags ? request.tags.filter(x => x !== request.value).join(' ') : '')
      )
      // args = args + '&tags=' + request.tags.replace(request.value, '');

      if (request.time) args = args + '&dt=' + encodeURIComponent(request.time)
      if (request.shared) args = args + '&shared=' + encodeURIComponent(request.shared)
      if (request.toread) args = args + '&toread=' + encodeURIComponent(request.toread)
      args = args + '&extended=' + encodeURIComponent(request.extended)
      if (noisy) { console.log('args: ' + args) }
      const pinurl = pinboardApiPath + 'posts/add?' + args + '&' + gAuthSettings.tokenAsVar()
      if (noisyPinboardUrl || logPinurlOnTagDelete) { console.log('pinurl: ' + unurl(pinurl)) }
      return pinurl
    }

    this.fetchPin = (action) => {
      // log('fetchPin()', 'action:', action);
      return this.fetchPinRetry(action, 0)
        .then(arg => {
          if (noisyFetchPin) { log('fetchPin()', 'Resolved with', arg) }
          return arg
        })
        .catch(arg => {
          if (noisyFetchPin) { log('fetchPin()', 'Rejected with', arg) }
          return arg
        })
    }

    this.fetchPinRetry = (action, retries) => {
      if (noisyFetchPin) { log('fetchPinRetry()', 'action:', action, 'retries:', retries) }
      const self = this
      return new Promise((resolve, reject) => {
        try {
          if (!this.hasAuth()) {
            reject('not logged in')
          } else {
            if (noisyPinboardUrl) { log('fetchPinRetry()', 'action.pinurl:', unurl(action.pinurl)) }

            const xhr = new XMLHttpRequest()
            xhr.open(action.verb, action.pinurl, true);
            xhr.onreadystatechange = ((retries, event) => {
              if (noisyFetchPin) { console.log('analyzePageResponse()'); console.dir(this); console.dir(action.url); console.dir(xhr); console.dir(resolve); console.dir(reject); console.dir(event) }
              if (noisyAsyncIn) { log('fetchPinRetry() on xhr.onreadystatechange', 'retries:', retries, 'event:', event) }
              // console.log('retries: ' + retries);

              if (retries > 2) {
                reject('Too many retries')
              } else if (event && event.target && event.target.readyState === 4 && event.target.status === 429) {
                setTimeout(() => {
                  resolve(self.fetchPinRetry(action, retries + 1));
                }, retries * 10e3)
              } else if (event && event.target && event.target.readyState === 4 && event.target.status === 401) {
                reject(event.target.status)
              } else if (event && event.target && event.target.readyState === 4 && event.target.status === 200) {
                const httpResult = xhr.responseXML;
                action.play(action, httpResult, resolve, reject); // analyzePageCore
              } else if (event && event.target && event.target.readyState === 2) {
                // console.dir(event);
              } else if (event && event.target && event.target.readyState === 3) {
                // console.dir(event);
              } else {
                // console.dir(event);
                // console.err('unrecognized event, normal');
              }
            }).bind(self, retries)
            xhr.send()
          }
        } catch (error) {
          console.error(error)
          reject(error)
        }
      })
    }

    this.getPin = () => {
      if (noisy) { console.log('Pb.getPin() this: ') }
      if (noisy) { console.dir(this) }
      if (noisy) { console.dir(Object.keys(this)) }
      return newPin(this);
    }

    this.readFreshRecentTags = (excludeTags) => {
      // log('readFreshRecentTags()', 'excludeTags:', excludeTags);
      try {
        return this.fetchPin({
          excludeTags: excludeTags,
          pinurl: this.getRecentUrl(),
          play: this.readFreshRecentTagsCore,
          verb: 'GET'
        })
      } catch (error) {
        console.error(error)
      }
    }

    this.readFreshRecentTagsCore = (action, httpResult, resolve, reject) => {
      if (noisy) { log('Pb', 'readFreshRecentTagsCore') }
      let posts = httpResult.getElementsByTagName('post');
      const tags = postsGetTags(posts);
      if (noisy) { log('Pb', 'readFreshRecentTagsCore', 'tags:', tags) }

    // var excludeTags = tags ? ((typeof tags == 'string') ? tags.split(' ') : tags) : [];
    var excludeTags = action.excludeTags;
    var suggestedList = [];
      posts = httpResult.getElementsByTagName('post');
      const tagsList = postsGetTags(posts);
      if (noisy) { log('Pb', 'readFreshRecentTagsCore', 'tagsList:', tagsList) }

      let lastTags
      if (tagsList.length > 0) {
        const dlisst = []
        tagsList.forEach((value, index) => {
          if (dlisst.length < recentTagsCountMax) {
            if (excludeTags.indexOf(value) < 0) {
              dlisst.push(value)
            }
          }
        })
        lastTags = dlisst
      } else { lastTags = [] }

      resolve(lastTags)
    }

    this.saveTag = (request) => {
      if (logPinOnSave || logSiteUrlOnPinSave) { log('Pb.saveTag()', 'request:', request) }

      if (request.value) {
        const trt = new ThrottledRecentTags()
        trt.appendTag(request.value)
      }

      let args = 'replace=yes'
      args = args + '&url=' + encodeURIComponent(request.url)
      if (request.description !== '') args = args + '&description=' + encodeURIComponent(request.description)

      let tags = request.tags
      if (noisy) { log('typeof tags:', typeof tags, tags) }
      // if (typeof tags == 'undefined') { console.error('msgBackSaveTag undefined tags'); }
      // if ((typeof tags == 'string') && (tags == '')) { console.error('msgBackSaveTag empty tags'); }
      // if ((typeof tags == 'object') && (tags.length == 0)) { console.error('msgBackSaveTag no tags'); }
      if (typeof tags === 'object') {
        tags = tags.join(',')
      }

      // args = args + '&tags=' + (tags + ' ' + value).replace(' ', '%20').replace('\n', '%20').replace('\r', '');
      args += '&tags=' + encodeURIComponent(
        // (request.tags ? request.tags : '') + (request.value ? ' ' + request.value : '')
        tags + (request.value ? (tags === '' ? '' : ' ') + request.value : '')
      )
      if (request.time) args = args + '&dt=' + encodeURIComponent(request.time)
      if (request.shared) args = args + '&shared=' + encodeURIComponent(request.shared)
      if (request.toread) args = args + '&toread=' + encodeURIComponent(request.toread)
      args = args + '&extended=' + encodeURIComponent(request.extended)
      if (noisy) { console.log('args: ' + args) }
      const pinurl = pinboardApiPath + 'posts/add?' + args + '&' + gAuthSettings.tokenAsVar()
      if (noisyPinboardUrl) { console.log('msgBackSaveTag pinurl: ' + unurl(pinurl)) }

      return this.fetchPin({
        pinurl: pinurl,
        play: this.saveTagCore,
        url: request.url,
        verb: 'POST'
      })
    }

    this.saveTagCore = (_action, httpResult, resolve, _reject) => {
      if (noisy) { log('saveTagCore()', httpResult) }
      resolve(httpResult);
    }
  }
}

function postsGetTags(posts) {
  if (noisy) { console.log('postsGetTags()') }
  const tags = []
  if (posts.length > 0) {
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i]
      const suggested = post.getAttribute('tag')
      if (suggested !== '') {
        suggested.split(' ').forEach((value, index) => {
          tags.push(value)
        })
      }
    }
  }
  if (noisy) { log('tags', tags) }
  return sortArrayByFrequency(tags)
}

function fetchPinForUrl(url) {
  return new Promise((resolve, reject) => {
    if (noisy) { log('pb', 'fetchPinForUrl', 'Promise') }
    try {
      const urlNeat = urlForBookmark(url)
      const pb = new Pb(urlNeat)
      pb.analyzePage(urlNeat, 0).then(data => {
        resolve(pb.getPin())
      })
        .catch(error => {
        // console.error('Error during service worker:', error);
          reject(error)
        })
    } catch (error) {
      if (noisy) { log('pb', 'fetchPinForUrl', 'error:', error) }
      reject(error)
    }
  })
}

async function readRecentTags(description, time, extended, shared, tags, toread, url) {
  return new Promise(async (resolve, reject) => {
    if (noisy) { log('pb', 'readRecentTags', 'Promise') }
    try {
      const urlNeat = urlForBookmark(url);
      const trt = new ThrottledRecentTags()
      trt.readTags(description, time, extended, shared, tags, toread, urlNeat).then(data => {
        if (noisy) { log('pb', 'readRecentTags', 'readTags', 'data:', data) }
        resolve(data)
      })
        .catch(error => {
          if (noisy) { log('pb', 'readRecentTags', 'error:', error) }
          reject(error)
        })
    } catch (error) {
      if (noisy) { log('pb', 'readRecentTags', 'error:', error) }
      reject(error)
    }
  })
}

if (logVersionOnExtnInstall) {
  const manifestData = chrome.runtime.getManifest();
  console.log(manifestData.name + ' version: ' + manifestData.version)
  log(manifestData.name, manifestData.version)
  // console.log(manifestData.defaultLocale);
}

// on extension install
//
initOptions()

if (noisy) { console.log('pb', 'EOF') }
