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
      if (noisy) { console.log('pinurl: ' + pinurl); }
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
      if (log_pinurl_on_tag_delete) { console.log('pinurl: ' + pinurl); }
      var xhr = new XMLHttpRequest(); 
      xhr.open('POST', pinurl);
      xhr.onreadystatechange = function (event) {   
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
        token: settings.get('token') || '',
        username: settings.get('username') || ''
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
        token: settings.get('token') || '',
        username: settings.get('username') || ''
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
      if (noisy) { console.log('pinurl: ' + pinurl); }
      var xhr = new XMLHttpRequest(); 
      xhr.open('POST', pinurl);
      xhr.onreadystatechange = function (event) {   
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
