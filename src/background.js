/**
 * @note chrome.* namespace is supported also by Firefox and Safari.
 *       On the other hand browser.* namespace is not supported by Chrome, Edge and Opera.
 *       browser.* namespace supports Promises and chrome.* use callbacks for asynchronous code.
 *
 *       Therefore we should use chrome.* for cross-browser web extensions.
 */

chrome.runtime.onInstalled.addListener(function() {
  const BALCKLIST_DOMAINS_URLS = [
    'https://cdn.statically.io/gh/AgainstPhishing/blacklist/main/data/domains.json',
    'https://cdn.jsdelivr.net/gh/AgainstPhishing/blacklist@main/data/domains.json'
  ];

  const RANDOM_URL = BALCKLIST_DOMAINS_URLS[Math.floor(Math.random()*BALCKLIST_DOMAINS_URLS.length)];

  fetch(RANDOM_URL).then(response => response.json()).then(responseJson => {
    chrome.storage.local.set({blacklistDomains: responseJson.data});
  });
});
