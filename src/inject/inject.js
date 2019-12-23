async function read_local_settings() {
  if (noisy_settings) { console.log('read_local_settings()'); }
  return new Promise(async (resolve, reject) => {
    chrome.runtime.sendMessage(
      { action: msg_f2b_read_options },
      response => {
        if (noisy_settings) { console.log('msg_f2b_read_options response:'); console.dir(response); }
        resolve(response);
      }
    );
  });
}

chrome.extension.sendMessage(
  { action: msg_inject_on_complete },
  response => {
  	var readyStateCheckInterval = setInterval(() => {
    	if (document.readyState === "complete") {
    		clearInterval(readyStateCheckInterval);
    		if (noisy) { console.log("Hello. This message was sent from scripts/inject.js"); console.dir(document); }

        new Promise(async (resolve, reject) => {
          let auth_settings = await read_local_settings();
          if (noisy_auth) { console.log('msg_inject_on_complete auth_settings:'); console.dir(auth_settings); }

          chrome.runtime.sendMessage(
            { action: msg_f2b_inhibit_url_append,
              inhibit: '1' },
            response => {
              if (noisy_settings) { console.log('msg_f2b_inhibit_url_append response:'); console.dir(response); }
              resolve(response);
            }
          );
        });
      }
    }, 10);
  }
);
