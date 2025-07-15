console.log('Service worker loaded');

chrome.runtime.onInstalled.addListener(() => {
  console.log('Service worker: onInstalled event fired');
});

chrome.tabs.query({}, (tabs) => {
  console.log('Service worker: Number of open tabs:', tabs.length);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message === 'test-message') {
    console.log('Service worker: Received test-message');
    sendResponse({ reply: 'Service worker received your message!' });
  }
  // Return true to indicate async response if needed
}); 