chrome.extension.sendMessage({}, response => {
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
    }
  }, 10);
});
