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
  path: "data/profiles_twitter.json"
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

// const onBlacklistDomainsUpdate = () => {
//   // is chromium engine - break
//   if(typeof browser === "undefined") {
//     return;
//   }

//   console.info("AP: onBlacklistDomainsUpdate");
  
//   // webRequest would work only in Firefox OR
//   //    on Chromium engine with manifest version 2
//   if(browser.webRequest && browser.webRequest.onBeforeRequest) {
//     // TODO: remove existing listener

//     chrome.storage.local.get('blacklistDomains', ({blacklistDomains}) => {
//       const checkAgainstBlacklistListener = generateCheckAgainstBlacklist(blacklistDomains);
//       browser.webRequest.onBeforeRequest.addListener(
//         checkAgainstBlacklistListener,
//         {urls: ["<all_urls>"]},
//         ["blocking", "main_frame"]
//       );
//     });
//   } else {
//     console.error("AP: There is no chrome.webRequest OR chrome.webRequest.onBeforeRequest!");
//   }
// };

function handleNotificationRequest(request) {
  console.info('AP: handleNotificationRequest');

  const notificationOptions = {
    type: "basic",
    iconUrl: chrome.runtime.getURL("icons/logo-96x96.png"),
    buttons: [{
      title: "Block it again!"
    }]
  };

  if(request.name === 'unsafe-phishing-related-twitter-subpage') {
    function removeUnsafeTwitterPageFromWhitelist(name) {
      if(request.name !== name) {
        console.log("AP: request", request);
        return;
      }

      chrome.storage.local.get(['whitelistProfilesTwitterUserManaged'], ({whitelistProfilesTwitterUserManaged}) => {
        chrome.storage.local.set({
          whitelistProfilesTwitterUserManaged: whitelistProfilesTwitterUserManaged.filter(twitterObject => request.twitterObject.handle !== twitterObject.handle)
        }, () => {
          chrome.runtime.onMessage.removeListener(removeUnsafeTwitterPageFromWhitelist);
        });
        console.info("AP: the following twitterObject has been removef from whitelistProfilesTwitterUserManaged", request.twitterObject);
      });
  
    }

    notificationOptions.title = "UNSAFE Twitter page!";
    notificationOptions.message = "The twitter page you are visiting is unsafe but you chose to visit it despite the risk.";
    chrome.notifications.onButtonClicked.addListener(removeUnsafeTwitterPageFromWhitelist);
    
  } else if(request.name === 'unsafe-phishing-related-website') {
    function removeUnsafeWebsiteFromWhitelist(name) {
      if(request.name !== name) {
        console.log("AP: request", request);
        return;
      }
      chrome.storage.local.get(['whitelistDomainsUserManaged'], ({whitelistDomainsUserManaged}) => {
        chrome.storage.local.set({
          whitelistDomainsUserManaged: whitelistDomainsUserManaged.filter(hostname => hostname !== request.hostname)
        }, () => {
          chrome.runtime.onMessage.removeListener(removeUnsafeWebsiteFromWhitelist);
        });
        console.info("AP: the following hostname has been removed from whitelistDomainsUserManaged", request.hostname);  
      });
    }

    notificationOptions.title = "UNSAFE website!";
    notificationOptions.message = "The website you are visiting is unsafe but you chose to visit it despite the risk.";
    chrome.notifications.onButtonClicked.addListener(removeUnsafeWebsiteFromWhitelist);
  }

  chrome.notifications.create(request.name, notificationOptions);
}

chrome.runtime.onMessage.addListener(handleNotificationRequest);

function getDataResourceURL(url_template, location) {
  return url_template
    .replace("{repository}", location.repository)
    .replace("{branch}", location.branch)
    .replace("{path}", location.path)
}

function fetchDataAndUpdateStorage(url, storageKey, callbackFunc = () => {}) {
  console.info("AP: fetchDataAndUpdateStorage, URL, storageKey: ", url);

  fetch(url)
    .then(response => response.json())
    .then(responseJson => {
      console.info(`AP: fetchDataAndUpdateStorage, ${storageKey}.length = ${responseJson.data?.length}` );
      chrome.storage.local.set({[storageKey]: responseJson.data}, callbackFunc);
    })
    .catch(error => {
      console.error('AP: fetchDataAndUpdateStorage fetch error:', error);
    });
}

function isTwitterPage(hostname) {
  return hostname.startsWith('twitter.com');
}

function updateStorageWithBlacklistDomains() {
  fetchDataAndUpdateStorage(BLACKLIST_DOMAINS_URL, 'blacklistDomains'); //, onBlacklistDomainsUpdate);
}

function updateStorageWithWhitelistDomains() {
  fetchDataAndUpdateStorage(WHITELIST_DOMAINS_URL, 'whitelistDomains');
}

function updateStorageWithWhitelistTwitter() {
  fetchDataAndUpdateStorage(WHITELIST_TWITTER_URL, 'whitelistTwitter');
}

function initializeStorageWithUserManagedExeptions() {
  chrome.storage.local.set({whitelistDomainsUserManaged: []});
  chrome.storage.local.set({whitelistProfilesTwitterUserManaged: []});
}

function onInstallListener() {
  initializeStorageWithUserManagedExeptions();
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

/**
 * This listener adds exceptions to local storages:
 * - whitelistDomainsUserManaged,
 * - whitelistProfilesTwitterUserManaged
 */
chrome.webRequest.onBeforeRequest.addListener((details) => {
    const url = new URL(details.url);
    const ok = url.searchParams.get('ok');

    if(!ok) {
      return;
    }

    const from = url.searchParams.get('from');
    const {hostname} = (new URL(from));
    if(isTwitterPage(hostname)) {
      const twitter = url.searchParams.get('twitter');
      if(!twitter) {
        return;
      }

      try {
        const jsonTwitterObject = JSON.parse(twitter);

        // Check whether it's a twitter object
        if(!jsonTwitterObject.handle) {
          return;
        }

        chrome.storage.local.get(['whitelistProfilesTwitterUserManaged'], ({whitelistProfilesTwitterUserManaged}) => {
          if(whitelistProfilesTwitterUserManaged.every(twitterObject => twitterObject.handle !== jsonTwitterObject.handle)) {
            whitelistProfilesTwitterUserManaged.push(jsonTwitterObject);
            chrome.storage.local.set({whitelistProfilesTwitterUserManaged});  
            console.info("AP: the following twitterObject has been added to whitelistProfilesTwitterUserManaged", jsonTwitterObject);
          }
        });
      } catch(error) {
        console.info("AP: JSON parsing error", error);
      }
    } else {
      // here we know, that it's not about twitter but website
      chrome.storage.local.get(['whitelistDomainsUserManaged'], ({whitelistDomainsUserManaged}) => {
        if(whitelistDomainsUserManaged.includes(hostname)) {
          console.info("AP: the domain already exist at storage.local whitelistDomainsUserManaged", hostname, from);  
        } else {
          whitelistDomainsUserManaged.push(hostname);
          chrome.storage.local.set({whitelistDomainsUserManaged});
          console.info("AP: the following url has been added to whitelistDomainsUserManaged", hostname, from);  
        }
      });
    }
  }, {
    urls: ["https://phishing-blocked.surge.sh/*"]
  }
);

// ------- webRequest-------
// ~~~ experimental ~~~
// TODO: validate behaviour
// Below code is related to webRequest related blocking
//    which is not available at manifest v3 on Chrome AND
//    is risky because it's hard to get blacklistDomains inside of blocking callback

// function _doesHostnameBlacklisted(blacklistDomains, hostname) {
//   extractDomain
//   for(let i = 0; i < blacklistDomains.length; i++) {
//     if( blacklistDomains[i] === hostname) {
//       return true;
//     }
//   }
//   return false;
// }

// function generateCheckAgainstBlacklist(blacklistDomains) {
//   return function _checkAgainstBlacklistListener({url}) {
//     const {hostname} = new URL(url);
//     console.info("AP: _doesHostnameBlacklisted(blacklistDomains, hostname)", _doesHostnameBlacklisted(blacklistDomains, hostname), hostname, blacklistDomains);
//     if(_doesHostnameBlacklisted(blacklistDomains, hostname)) {
//       return {
//         redirectUrl: `https://phishing-blocked.surge.sh/?from=${encodeURIComponent(url)}&type=blacklist_web_request_blocking`
//       };
//     }

//     return {};
//   };
// }

// chrome.storage.onChanged.addListener(onBlacklistDomainsUpdate);
