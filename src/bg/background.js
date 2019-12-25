// if you checked "fancy-settings" in extensionizr.com, uncomment this lines

// var settings = new Store("settings", {
//     "sample_setting": "This is how you use Store.js to remember values"
// });


var g_auth_settings;

function auth_token_exists() {
  return g_auth_settings.token !== ""
}

function auth_token_set() {
  if (noisy) { console.log('auth_token_set()'); }
  return 'auth_token=' + g_auth_settings.token;
}

// restrict specific domains
//
function url_is_allowed(request, url, sendResponse) {
  let allowed = true;
  if (request.use_block) {
    let settings = new Store('settings');
    let inhibit = settings.get('inhibit');
    if (!inhibit) {
      allowed = true;
    } else {
      let block = inhibit.split('\n').filter(s => s != '');
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

// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener(tab => {
  // Send a message to the active tab
  chrome.tabs.query({active: true, currentWindow: true}, tabs => {
    if (noisy) { console.log('bg.js browserAction.onClicked'); }
    var activeTab = tabs[0];
    chrome.tabs.sendMessage(activeTab.id, {"message": msg_b2f_clicked_browser_action});
  });
});

chrome.extension.onMessage.addListener(
  (request, sender, sendResponse) => {
    if (noisy_background_msg_listener) { console.log('background_msg_listener() request:'); console.dir(request); }
    if (false) {
    } else if (request.action === msg_inject_on_complete) {
      sendResponse(true);

    } else if (request.action === msg_f2b_delete_pin) {
      if (log_site_url_on_pin_delete) { console.log('log_site_url_on_pin_delete: ' + request.url); }
      var args = 'url=' + encodeURIComponent(request.url);
      var pinurl = api_path + 'posts/delete?' + args + '&' + auth_token_set();
      if (noisy_pinboard_url) { console.log('pinurl: ' + pinurl); }
      var xhr = new XMLHttpRequest(); 
      xhr.open('GET', pinurl);
      xhr.onreadystatechange = (event) => {
        if (noisy) { console.log('background.js GET delete xhr.onreadystatechange()'); }
        if (event.target.readyState == 4 && event.target.status == 200) {
          var data = xhr.responseXML;
          if (noisy) { console.dir(data); }
          sendResponse(data);
        }
      }
      xhr.send();

    } else if (request.action === msg_f2b_delete_tag) {
      if (log_site_url_on_tag_delete) { console.log('log_site_url_on_tag_delete: ' + request.url); }
      if (log_pin_on_save) { console.log('log_pin_on_save:'); console.dir(request); }

      var args = 'replace=yes';
      args = args + '&url=' + encodeURIComponent(request.url);
      if (request.description !== '') args = args + '&description=' + encodeURIComponent(request.description);

      // args = args + '&tags=' + (tags + ' ' + value).replace(' ', '%20').replace('\n', '%20').replace('\r', '');
      // args = args + '&tags=' + encodeURIComponent((request.tags ? request.tags : '') + (request.value ? ' ' + request.value : '') );
      args = args + '&tags=' + encodeURIComponent(
        (request.tags ? request.tags.filter(x => x != request.value).join(' ') : '')
      );
      // args = args + '&tags=' + request.tags.replace(request.value, '');

      if (request.time) args = args + '&dt=' + encodeURIComponent(request.time);
      if (request.shared) args = args + '&shared=' + encodeURIComponent(request.shared);
      if (request.toread) args = args + '&toread=' + encodeURIComponent(request.toread);
      args = args + '&extended=' + encodeURIComponent(request.extended);
      if (noisy) { console.log('args: ' + args); }
      var pinurl = api_path + "posts/add?" + args + "&" + auth_token_set();
      if (noisy_pinboard_url || log_pinurl_on_tag_delete) { console.log('pinurl: ' + pinurl); }
      var xhr = new XMLHttpRequest(); 
      xhr.open('POST', pinurl);
      xhr.onreadystatechange = event => {
        if (noisy) { console.log('background.js POST xhr.onreadystatechange()'); }
        if (event.target.readyState == 4 && event.target.status == 200) {
          var data = xhr.responseXML;
          if (noisy) { console.dir(data); }
          sendResponse(data);
        }
      }
      xhr.send();

    } else if (request.action === msg_f2b_inhibit_url_append) {
      let settings = new Store('settings');
      g_auth_settings = {
        inhibit: (settings.get('inhibit') || '') + '\n' + request.inhibit,
        token: settings.get('token') || ''
      };
      // g_auth_settings.inhibit = request.inhibit;
      settings.set('inhibit', g_auth_settings.inhibit);
      // if (log_auth_sent_to_fg) { console.log('g_auth_settings:'); console.dir(g_auth_settings); }
      sendResponse(g_auth_settings);

    } else if (request.action === msg_f2b_read_current) {
      let url = sender.tab.url;
      if (url_is_allowed(request, url, sendResponse)) {
        // clean URL by removing trailing hash data
        //
        if (log_site_url_on_site_load) { console.log('url: ' + url); }
        url = url.replace(/#.*$/, '');
        if (log_site_url_on_site_load) { console.log('url: ' + url); }

        // process url
        // 
        read_current_tags(url).then(data => {
          if (noisy) { console.log('background.js read_current_tags cb()\ndata:'); }
          if (noisy) { console.dir(data); }
          if (noisy) { console.log('background.js read_current_tags responding'); }
          if (log_site_url_on_site_load) { console.log('url: ' + data.url); }

          let response = Object.assign(
            // {},
            {
              description: data.description || request.title,
              time: data.time || "",
              hash: data.hash || "",
              extended: data.extended || "",
              tags: data.tags || [],
              shared: data.shared || "",
              toread: data.toread || "",
              url: data.url || ""
            }
          );
          if (log_pin_on_load) { console.log('log_pin_on_load:'); console.dir(response); }
          sendResponse(response);

          if (noisy) { console.log('<- background.js read_current_tags cb()'); }
        })
        .catch(error => {
          console.log('bg.js 199 error: ' + error.toString());
          sendResponse({
            description: "",
            time: "",
            hash: "",
            extended: "",
            tags: [],
            shared: "",
            toread: "",
            url: ""
          });
        });
      }

    } else if (request. action === msg_f2b_read_options) {
      let settings = new Store('settings');
      g_auth_settings = {
        inhibit: settings.get('inhibit') || '',
        token: settings.get('token') || ''
      };
      if (log_auth_sent_to_fg) { console.log('g_auth_settings:'); console.dir(g_auth_settings); }
      sendResponse(g_auth_settings);

    // } else if (request.action === msg_f2b_read_pin) {
    //     sendResponse({});
    } else if (request.action === msg_f2b_read_pin) {
      let url = sender.tab.url;
      if (url_is_allowed(request, url, sendResponse)) {
        // clean URL by removing trailing hash data
        //
        if (log_site_url_on_site_load) { console.log('url: ' + url); }
        url = url.replace(/#.*$/, '');
        if (log_site_url_on_site_load) { console.log('url: ' + url); }

        // sendResponse({});

        // process url
        // 
if (noisy) { console.log("bg.js 84"); }
let er = {
  description: "",
  time: "",
  hash: "",
  extended: "",
  tags: [],
  shared: "",
  toread: "",
  url: ""
};

//           read_current_tags(url).then(data => {
// if (noisy) { console.log("bg.js 97"); }
//             sendResponse(er);
//           })
//           .catch(error => {
// if (noisy) { console.log("bg.js 101"); }
//             sendResponse(er);
//           });
// if (noisy) { console.log("bg.js 104"); }


        read_current_tags(url).then(data => {
if (noisy) { console.log("bg.js 86"); }
          // sendResponse({});

          if (noisy) { console.log('background.js read_current_tags cb()\ndata:'); }
          if (noisy) { console.dir(data); }
          if (noisy) { console.log('background.js read_current_tags responding'); }
          if (log_site_url_on_site_load) { console.log('url: ' + data.url); }

          let response = Object.assign(
            {
              description: data.description || request.title || "",
              time: data.time || "",
              hash: data.hash || "",
              extended: data.extended || "",
              tags: data.tags || [],
              shared: data.shared || "",
              toread: data.toread || "",
              url: data.url || ""
            }
          );
          if (log_pin_on_load) { console.log('log_pin_on_load:'); console.dir(response); }
          sendResponse(response);

          if (noisy) { console.log('<- background.js read_current_tags cb()'); }
        })
        .catch(error => {
if (noisy) { console.log("bg.js 111"); }
          console.log('bg.js 199 error: ' + error.toString());
          sendResponse({
            description: "",
            time: "",
            hash: "",
            extended: "",
            tags: [],
            shared: "",
            toread: "",
            url: ""
          });
        });
      }

    } else if (request.action === msg_f2b_read_recent) {
      if (noisy) { console.log(msg_f2b_read_recent + ' request:'); console.dir(request); }
      read_recent_tags(request.description, request.time, request.extended, request.shared, request.tags, request.toread, sender.tab.url)
        .then(data => {
          if (noisy) { console.log('background.js ' + msg_f2b_read_recent + ' cb()\ndata:'); }
          if (noisy) { console.dir(data); }
          if (noisy) { console.log('background.js ' + msg_f2b_read_recent + ' responding'); }
          sendResponse(Object.assign(
            {
              description: request.description || "",
              time: request.time || "",
              hash: request.hash || "",
              extended: request.extended || "",
              shared: request.shared || "",
              tags: request.tags || "",
              toread: request.toread || "",
              url: request.url || ""
            },
            data));
          if (noisy) { console.log('<- background.js ' + msg_f2b_read_recent + ' cb()'); }
        });

    } else if (request.action === msg_f2b_save_tag) {
      // alert('@' + value);
      if (log_site_url_on_pin_save) { console.log('site_url_on_pin_save: ' + request.url); }
      if (log_pin_on_save) { console.log('log_pin_on_save:'); console.dir(request); }

      if (request.value) {
        let trt = new ThrottledRecentTags();
        console.log('trt bg.js 292')
        trt.appendTag(request.value);
      }
 
      var args = 'replace=yes';
      args = args + '&url=' + encodeURIComponent(request.url);
      if (request.description !== '') args = args + '&description=' + encodeURIComponent(request.description);
      // args = args + '&tags=' + (tags + ' ' + value).replace(' ', '%20').replace('\n', '%20').replace('\r', '');
      args = args + '&tags=' + encodeURIComponent(
        (request.tags ? request.tags : '') + (request.value ? ' ' + request.value : '')
      );
      if (request.time) args = args + '&dt=' + encodeURIComponent(request.time);
      if (request.shared) args = args + '&shared=' + encodeURIComponent(request.shared);
      if (request.toread) args = args + '&toread=' + encodeURIComponent(request.toread);
      args = args + '&extended=' + encodeURIComponent(request.extended);
      if (noisy) { console.log('args: ' + args); }
      var pinurl = api_path + "posts/add?" + args + "&" + auth_token_set();
      if (noisy_pinboard_url) { console.log('pinurl: ' + pinurl); }
      var xhr = new XMLHttpRequest(); 
      xhr.open('POST', pinurl);
      xhr.onreadystatechange = event => {   
        if (noisy) { console.log('background.js POST xhr.onreadystatechange()'); }
        if (event.target.readyState == 4 && event.target.status == 200) {
          var data = xhr.responseXML;
          if (noisy) { console.dir(data); }
          sendResponse(data);
        }
      }
      xhr.send();

    } else {
if (noisy) { console.log("bg.js 127"); }
      console.error('unrecognized request.action: ' + request.action);
      sendResponse(false);
    }
    return true; // keep port open
  }
);

class ThrottledRecentTags {
  tags;
  timestamp;

  constructor() {
console.log('ThrottledRecentTags constructor()');
    let settings = new Store('settings');
    this.recentTagTimestamp = settings.get('recentTagsTimestamp');
console.log('this.recentTagTimestamp:' + this.recentTagTimestamp);
    this.tags = settings.get('recentTags');
console.log('this.tags:' + this.tags);
  }

  get delaySeconds() {
    return 60;
  }

  appendTag(tag) {
    let settings = new Store('settings');
    this.timestamp = settings.get('recentTagsTimestamp');
    this.tags = settings.get('recentTags');

    // prepend new tag, remove duplicates
    this.tags = [tag].concat(this.tags.filter(t => t !== tag));

    this.timestamp = Date.now();
    console.log('ThrottledRecentTags.appendTag this.timestamp: ' + this.timestamp);
    console.log('ThrottledRecentTags.appendTag this.tags: ' + this.tags);
    settings.set('recentTagsTimestamp', this.timestamp);
    settings.set('recentTags', this.tags);
  }

  async readTags(description, time, extended, shared, tags, toread, url) {
    console.log('ThrottledRecentTags readTags()');
    return new Promise((resolve, reject) => {
      let now = Date.now();
      console.log('ThrottledRecentTags.readTags now: ' + now);

      let settings = new Store('settings');
      this.timestamp = settings.get('recentTagsTimestamp');
      console.log('ThrottledRecentTags.readTags this.timestamp: ' + this.timestamp);
      this.tags = settings.get('recentTags');
      console.log('ThrottledRecentTags.readTags this.tags: ' + this.tags);

      if ((typeof this.timestamp !== 'undefined') && (this.timestamp !== null)) {
        let diff = (now - this.timestamp) / 1000;
        console.log('ThrottledRecentTags.readTags diff: ' + diff);
      }

      if ((typeof this.timestamp === 'undefined')
          || (this.timestamp === null) 
          || (((now - this.timestamp) / 1000) > this.delaySeconds)) {
        if (log_throttled_get_fresh) { console.log('ThrottledRecentTags readTags get new'); }        
        this.timestamp = now;
        // this.tags = [1];
        let pb = new Pb(url);
        pb.read_recent(description, time, extended, shared, tags, toread, url).then(data => {
          // if (noisy) { console.log('src/bg/pinboard.js read_recent_tags\ndata:'); console.dir(data); }
          this.tags = Object.assign([], data.tags);
          settings.set('recentTagsTimestamp', this.timestamp);
          settings.set('recentTags', this.tags);
          console.log('ThrottledRecentTags return tags: ' + this.tags);
          resolve(data);
          // console.log("src/bg/pinboard.js pb.getUrl");
          // console.log(pb.getUrl());

          // console.log("src/bg/pinboard.js pb.getPost");
          // let pp = pb.getPost();
          // console.log("src/bg/pinboard.js pp");
          // console.dir(pp);
          // resolve(pp);
        })
        .catch(error => {
            { console.log('src/bg/pinboard.js read_recent_tags\n error:'); console.dir(error); }
          reject(error)
        });
      } else {
        if (log_throttled_get_cache) {
          console.log('ThrottledRecentTags readTags return existing');
          console.log('ThrottledRecentTags return tags: ' + this.tags);
        }
        resolve({
          description: description,
          time: time,
          hash: '',
          extended: extended,
          shared: shared,
          tags: this.tags,
          toread: toread,
          url: url
        });
      }
    });
  }
}
