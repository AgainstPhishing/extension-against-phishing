/**
 * @note chrome.* namespace is supported also by Firefox and Safari.
 *       On the other hand browser.* namespace is not supported by Chrome, Edge and Opera.
 *       browser.* namespace supports Promises and chrome.* use callbacks for asynchronous code.
 *
 *       Therefore we should use chrome.* for cross-browser web extensions.
 */

const BALCKLIST_DOMAINS_URLS = [
  'https://raw.githubusercontent.com/AgainstPhishing/blacklist/main/data/domains.json',
  'https://cdn.statically.io/gh/AgainstPhishing/blacklist/main/data/domains.json',
  'https://cdn.jsdelivr.net/gh/AgainstPhishing/blacklist@main/data/domains.json'
];

const RANDOM_URL = false;

const BLACKLIST_DOMAINS_URL = RANDOM_URL ?
  BALCKLIST_DOMAINS_URLS[Math.floor(Math.random()*BALCKLIST_DOMAINS_URLS.length)] :
  BALCKLIST_DOMAINS_URLS[0];


function updateStorageWithBlacklistDomains() {
  fetch(BLACKLIST_DOMAINS_URL, {cache: "no-cache"})
    .then(response => response.json())
    .then(responseJson => {
      console.info(`AP: updateStorageWithBlacklistDomains, blacklistDomains.length = ${responseJson.data?.length}` );
      chrome.storage.local.set({blacklistDomains: responseJson.data}).then(() => {
        onBlacklistDomainsUpdate();
      });
    }).catch(error => {
      console.error('AP updateStorageWithBlacklistDomains fetch rrror:', error);
    });
}

chrome.runtime.onInstalled.addListener(updateStorageWithBlacklistDomains);

chrome.alarms.create({ delayInMinutes: 1 });

chrome.alarms.onAlarm.addListener(() => {
  console.info("AP: Alarm");
  updateStorageWithBlacklistDomains();
  chrome.alarms.create({ delayInMinutes: 1 });
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

function onBlacklistDomainsUpdate() {
  // is chromium engine - break
  if(typeof browser === "undefined") {
    return;
  }
  
  // webRequest would work only in Firefox OR
  //    on Chromium engine with manifest version 2
  if(chrome.webRequest && chrome.webRequest.onBeforeRequest) {

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
}
