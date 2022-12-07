'use strict';

/**
 * @note chrome.* namespace is supported also by Firefox and Safari.
 *       On the other hand browser.* namespace is not supported by Chrome, Edge and Opera.
 *       browser.* namespace supports Promises and chrome.* use callbacks for asynchronous code.
 *
 */

const UPDATE_BLACKLIST_INTERVAL = 5;
const UPDATE_WHITELIST_INTERVAL = 110;

const BLACKLIST_DOMAINS_GITHUB_LOCATION = {
  repository: "AgainstPhishing/blacklist",
  branch: "main",
  path: "data/domains.json"
}

const WHITELIST_DOMAINS_GITHUB_LOCATION = {
  repository: "AgainstPhishing/whitelist",
  branch: "main",
  path: "data/domains.json"
};

const WHITELIST_TWITTER_GITHUB_LOCATION = {
  repository: "AgainstPhishing/whitelist",
  branch: "main",
  path: "data/domains.json"
}

const DATA_URLS = [
  'https://raw.githubusercontent.com/{repository}/{branch}/{path}',
  'https://cdn.statically.io/gh/{repository}/{branch}/{path}',
  'https://cdn.jsdelivr.net/gh/{repository}@{branch}/{path}'
];

const RANDOM_URL = false;

const DATA_URL = RANDOM_URL ?
  DATA_URLS[Math.floor(Math.random()*DATA_URLS.length)] :
  DATA_URLS[0];

const BLACKLIST_DOMAINS_URL = getDataResourceURL(DATA_URL, BLACKLIST_DOMAINS_GITHUB_LOCATION);
const WHITELIST_DOMAINS_URL = getDataResourceURL(DATA_URL, WHITELIST_DOMAINS_GITHUB_LOCATION);
const WHITELIST_TWITTER_URL = getDataResourceURL(DATA_URL, WHITELIST_TWITTER_GITHUB_LOCATION);

const onBlacklistDomainsUpdate = () => {
  // is chromium engine - break
  if(typeof browser === "undefined") {
    return;
  }

  console.info("AP: onBlacklistDomainsUpdate");
  
  // webRequest would work only in Firefox OR
  //    on Chromium engine with manifest version 2
  if(chrome.webRequest && chrome.webRequest.onBeforeRequest) {
    // TODO: remove existing listener

    chrome.storage.local.get('blacklistDomains', ({blacklistDomains}) => {
      const checkAgainstBlacklistListener = generateCheckAgainstBlacklist(blacklistDomains);
      chrome.webRequest.onBeforeRequest.addListener(
        checkAgainstBlacklistListener,
        {urls: ["<all_urls>"]},
        ["blocking", "main_frame"]
      )
    });
  } else {
    console.error("There is no chrome.webRequest OR chrome.webRequest.onBeforeRequest!");
  }
};

function getDataResourceURL(url_template, location) {
  return url_template
    .replace("{repository}", location.repository)
    .replace("{branch}", location.branch)
    .replace("{path}", location.path)
}

function fetchDataAndUpdateStorage(url, storageKey, callbackFunc = () => {}) {
  console.info("AP: fetchDataAndUpdateStorage, URL, storageKey: ", url);

  fetch(url, {cache: "no-cache"})
    .then(response => response.json())
    .then(responseJson => {
      console.info(`AP: fetchDataAndUpdateStorage, ${storageKey}.length = ${responseJson.data?.length}` );
      chrome.storage.local.set({[storageKey]: responseJson.data}, callbackFunc);
    })
    .catch(error => {
      console.error('AP: fetchDataAndUpdateStorage fetch error:', error);
    });
}

function updateStorageWithBlacklistDomains() {
  fetchDataAndUpdateStorage(BLACKLIST_DOMAINS_URL, 'blacklistDomains', onBlacklistDomainsUpdate);
}

function updateStorageWithWhitelistDomains() {
  fetchDataAndUpdateStorage(WHITELIST_DOMAINS_URL, 'whitelistDomains');
}

function updateStorageWithWhitelistTwitter() {
  fetchDataAndUpdateStorage(WHITELIST_TWITTER_URL, 'whitelistTwitter');
}

function onInstallListener() {
  updateStorageWithBlacklistDomains();
  updateStorageWithWhitelistDomains();
  updateStorageWithWhitelistTwitter();
}

chrome.runtime.onInstalled.addListener(onInstallListener);

chrome.alarms.create('blacklist', { periodInMinutes: UPDATE_BLACKLIST_INTERVAL });
chrome.alarms.create('whitelist', { periodInMinutes: UPDATE_WHITELIST_INTERVAL });

// Alarm object is passed to listener:
//    more info: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/alarms/onAlarm#addlistener_syntax
chrome.alarms.onAlarm.addListener(({name}) => {
  console.info("AP: Alarm: ", name);

  if('blacklist' === name) {
    updateStorageWithBlacklistDomains();
  } else if('whitelist' === name) {
    updateStorageWithWhitelistDomains();
    updateStorageWithWhitelistTwitter();  
  }
});

// ------- webRequest-------

// Below code is related to webRequest related blocking
//    which is not available at manifest v3 on Chrome AND
//    is risky because it's hard to get blacklistDomains inside of blocking callback

// function checkAgainstBlacklist() {
//   chrome.storage.local.get('blacklistDomains', ({blacklistDomains}) => {
//     if(simpleCheckAgainstBlacklistedDomains(blacklistDomains)) {
//       return {
//         redirectUrl: "http://phishing-blocked.surge.sh/"
//       };
//     }

//     return {cancel: true};
//   });
// }

function _doesHostnameBlacklisted(blacklistDomains, hostname) {
  extractDomain
  for(let i = 0; i < blacklistDomains.length; i++) {
    if( blacklistDomains[i] === hostname) {
      return true;
    }
  }
  return false;
}

function generateCheckAgainstBlacklist(blacklistDomains) {
  return function checkAgainstBlacklistListener({url}) {
    const {hostname} = new URL(url);
    console.info("AP: _doesHostnameBlacklisted(blacklistDomains, hostname)", _doesHostnameBlacklisted(blacklistDomains, hostname), hostname, blacklistDomains);
    if(_doesHostnameBlacklisted(blacklistDomains, hostname)) {
      return {
        redirectUrl: "http://phishing-blocked.surge.sh/"
      };
    }

    return {};
  };
}

if(chrome.storage.onChanged) {
  chrome.storage.onChanged.addListener(onBlacklistDomainsUpdate);
} else {
  console.error("chrome.storage.onChanged doesn't exist")
}
