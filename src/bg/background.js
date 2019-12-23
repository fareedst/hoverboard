// if you checked "fancy-settings" in extensionizr.com, uncomment this lines

// var settings = new Store("settings", {
//     "sample_setting": "This is how you use Store.js to remember values"
// });

chrome.extension.onMessage.addListener(
  (request, sender, sendResponse) => {
    if (noisy_background_msg_listener) { console.log('background_msg_listener() request:'); console.dir(request); }
    if (false) {
    } else if (request.action === msg_inject_on_complete) {
      sendResponse(true);

    } else if (request. action === msg_f2b_read_options) {
      let settings = new Store('settings');
      let auth_settings = {
        inhibit: settings.get('inhibit') || '',
        token: settings.get('token') || '',
        username: settings.get('username') || ''
      };
      if (log_auth_sent_to_fg) { console.log('auth_settings:'); console.dir(auth_settings); }
      sendResponse(auth_settings);

    } else if (request. action === msg_f2b_inhibit_url_append) {
      let settings = new Store('settings');
      let auth_settings = {
        inhibit: (settings.get('inhibit') || '') + '\n' + request.inhibit,
        token: settings.get('token') || '',
        username: settings.get('username') || ''
      };
      // auth_settings.inhibit = request.inhibit;
      settings.set('inhibit', auth_settings.inhibit);
      // if (log_auth_sent_to_fg) { console.log('auth_settings:'); console.dir(auth_settings); }
      sendResponse(auth_settings);

    } else {
      sendResponse(false);
    }
  }
);
