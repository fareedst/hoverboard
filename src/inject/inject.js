async function read_local_settings() {
  if (noisy_settings) { console.log('read_local_settings()'); }
  return new Promise(async (resolve, reject) => {
    chrome.runtime.sendMessage(
      { action: msg_f2b_read_options },
      response => {
        if (noisy_settings) { console.log('response:'); console.dir(response); }
        resolve(response);
      }
    );
  });
}

chrome.extension.sendMessage(
  {
    action: msg_inject_on_complete
  },
  response => {
  	var readyStateCheckInterval = setInterval(() => {
    	if (document.readyState === "complete") {
    		clearInterval(readyStateCheckInterval);

    		// ----------------------------------------------------------
    		// This part of the script triggers when page is done loading
    		// log to console of foreground tab
    		if (noisy) {
          console.log("Hello. This message was sent from scripts/inject.js");
    		  console.dir(document);
        }

        new Promise(async (resolve, reject) => {
          let auth_settings = await read_local_settings();
          if (noisy_auth) { console.log('auth_settings:'); console.dir(auth_settings); }
          resolve();
        });
      }
    }, 10);
  }
);

