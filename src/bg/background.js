// if you checked "fancy-settings" in extensionizr.com, uncomment this lines

// var settings = new Store("settings", {
//     "sample_setting": "This is how you use Store.js to remember values"
// });


var g_auth_settings;

function auth_token_exists() {
  return (g_auth_settings.username !== "") && (g_auth_settings.token !== "")
}

function auth_token_set() {
  if (noisy) { console.log('auth_token_set()'); }
  return 'auth_token=' + g_auth_settings.username + ':' + g_auth_settings.token;
}

function url_is_allowed(request, url) {
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

chrome.extension.onMessage.addListener(
  (request, sender, sendResponse) => {
    if (noisy_background_msg_listener) { console.log('background_msg_listener() request:'); console.dir(request); }
    if (false) {
    } else if (request.action === msg_inject_on_complete) {
      sendResponse(true);

    } else if (request. action === msg_f2b_inhibit_url_append) {
      let settings = new Store('settings');
      g_auth_settings = {
        inhibit: (settings.get('inhibit') || '') + '\n' + request.inhibit,
        token: settings.get('token') || '',
        username: settings.get('username') || ''
      };
      // g_auth_settings.inhibit = request.inhibit;
      settings.set('inhibit', g_auth_settings.inhibit);
      // if (log_auth_sent_to_fg) { console.log('g_auth_settings:'); console.dir(g_auth_settings); }
      sendResponse(g_auth_settings);

    } else if (request. action === msg_f2b_read_options) {
      let settings = new Store('settings');
      g_auth_settings = {
        inhibit: settings.get('inhibit') || '',
        token: settings.get('token') || '',
        username: settings.get('username') || ''
      };
      if (log_auth_sent_to_fg) { console.log('g_auth_settings:'); console.dir(g_auth_settings); }
      sendResponse(g_auth_settings);

    // } else if (request.action === msg_f2b_read_pin) {
    //     sendResponse({});
    } else if (request.action === msg_f2b_read_pin) {
      let url = sender.tab.url;
      if (url_is_allowed(request, url)) {
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
    } else {
if (noisy) { console.log("bg.js 127"); }
      sendResponse(false);
    }
    return true; // keep port open
  }
);
