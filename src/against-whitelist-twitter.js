'use strict';

/**
 * ## Flow for Twitter
 * 
 * #### 1. Status page
 *  check for the page name, filter title by: " on Twitter"
 *  If the related project has been found at whitlist and...
 *  If the status was posted by not whitlisted twitter handle
 *    BLOCK, this is SCAM
 *    
 * #### 2. Profile page
 *    check the document.title against (@)
 *    If the project has been found at whitlist and...
 *    1. if the handle is different than whitelisted
 *      THIS IS SCAM
 * 
 * #### 3. Not a twitter page nor status page?
 *    IGNORE for now
 */

// Used for detecting in observed mutations mode for Twitter whether the location.href has been changed
var previousLocationHref = document.location.href;

var whitelistTwitterGlobal = [];
var whitelistProfilesTwitterUserManagedGlobal = [];

function blockWebsite(type, twitterObject) {
  window.location.href = `https://phishing-blocked.surge.sh/?from=${encodeURIComponent(window.location.href)}&type=${encodeURIComponent(type)}&twitter=${encodeURIComponent(JSON.stringify(twitterObject))}`;
}

const analyzeTwitter = () => {
  console.info("AP: Twitter analyze started!");

  const twitterObject = getTwitterHandleAndPageName();

  // Is it a status or a profile page?
  //   Then Abort
  if(!twitterObject) {
    console.info("AP: Not a status nor profile page. Ignored.");
    return;
  }

  console.info("AP: Twitter object: ", twitterObject);

  // Does the page is whitelisted by the user?
  if(whitelistProfilesTwitterUserManagedGlobal.some(
    whitelistedTwitterObject => whitelistedTwitterObject.handle === twitterObject.handle )
  ) {
      return
  }

  if(isTwitterAccountWhitelisted(twitterObject.handle)) {
    console.info("AP: Twitter account whitelisted!");

    return;
  }

  if(!doesTwitterObjectResembleWhitelistedProject(twitterObject)) {
    return;
  }

  console.log("AP: Twitter fake account detected!")

  blockWebsite('whitelist_twitter', twitterObject);
};

/**
 * @returns false or string (twitter handle)
 */
const isTwitterStatusPage = () => {
  const regex = /twitter.com\/(.*)\/status\//;
  const matches = document.location.href.match(regex);
  if(matches) {
    return matches[0];
  }

  return false;
};

const isTwitterProfilePage = () => {
  const regex =  /^(\w){1,15}$/;  

  const matches = document.location.pathname.slice(1).match(regex);
  if(matches) {
    return matches[0];
  }

  return false;
};

function getProfilePageHandle() {
  return document.title.slice(document.title.indexOf(" (@")+3, document.title.indexOf(") /"));
}
/**
 * @returns null OR {name, handle}
 */
function getTwitterHandleAndPageName() {
  let handle;
  
  handle = isTwitterStatusPage();

  console.log("AP: isTwitterStatusPage", handle);

  if(handle) {
    return {
      name: document.title.slice(0, document.title.indexOf(" on Twitter:")),
      handle
    }
  }
  
  handle = isTwitterProfilePage();

  if(handle && 'explore' !== handle && 'search' !== handle) {
    // handle = document.title.slice(document.title.indexOf(" (@")+3, document.title.indexOf(") /"));
    return {
      name: document.title.slice(0, document.title.indexOf(" (")),
      handle
    };
  }

  return null;
}

const isTwitterAccountWhitelisted = (twitterAccount) => (
  !!whitelistTwitterGlobal.find(item => item.handle === twitterAccount)
);

function runOnObservedMutation(callbackFunction) {
  const bodyList = document.querySelector("body");

  console.info("AP: runOnObservedMutation");

  function onMutation(mutations) {
    mutations.some(function(_mutation) {
      if (previousLocationHref === document.location.href) {
        return false;
      }

      console.info("AP: Previous URL "+previousLocationHref+" differs from the current: "+document.location.href+"!");
      previousLocationHref = document.location.href;
      setTimeout(callbackFunction, 800);

      return true;
    });
  }

  const mo = new MutationObserver(onMutation);
  

  // TODO: revise those settings
  const config = {
    childList: true,
    subtree: true
  };
  
  mo.observe(bodyList, config);
}

/**
 * @description The following function is trying to search for resembling 
 *   whitelisted Twitter project to this described in TwitterObject
 * 
 * @param {*} TwitterObject 
 * @returns boolean
 */
function doesTwitterObjectResembleWhitelistedProject({name, handle}) {
  const nameLowercase = name.toLowerCase();
  const nameReduced = nameLowercase
  
    // Replace emoji with space
    .replace(/([\uE000-\uF8FF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF])/g, ' ')

    // TODO: replace Unicode character with ascii counterparts

    // TODO: reduce space-like characters to ascii spaces

    // normalize to Unicode group of characters
    .normalize("NFD")
    
    // remove non-ascii characters
    .replace(/[^\x00-\x7F]/g, "");

  return whitelistTwitterGlobal.some(
    whitelistItem => {
      const whitelistedProjectNameLowercase = whitelistItem.projectName.toLowerCase();

      // 1. Try to match exactly the Twitter name.
      if(
        whitelistItem.name.toLowerCase() === nameLowercase ||
        whitelistedProjectNameLowercase === nameLowercase
      ) {
        return true;
      }

      // 2. Does Twitter Name contains Project Name
      if(nameLowercase.includes(whitelistedProjectNameLowercase)) {
        // Without Escaping Regex: /^(\s)?[\s,\.\-_]+/giums;
        const regexModifiers = 'giums';

        // 2.1 Match beginning
        const regexBeginningMatch = new RegExp('^(\\s)?'+whitelistedProjectNameLowercase+'[\\s,\\.\\-_]+', regexModifiers);

        // 2.2 Match beginning
        const regexEndingMatch = new RegExp('[\\s,\\.\\-_]+'+whitelistedProjectNameLowercase+'[\\s\\._-]*$', regexModifiers);

        // 2.3 Match content
        const regexContentMatch = new RegExp('[\\s,\\.\\-_]+'+whitelistedProjectNameLowercase+'[\\s,\\.\\-_]+', regexModifiers);

        if(
          nameReduced.match(regexBeginningMatch) ||
          nameReduced.match(regexEndingMatch) ||
          nameReduced.match(regexContentMatch)
        ) {
          console.log("AP: twitter name contains project name");
          return true;
        }
      }

      // TODO: checking for handle
      // TODO: fetching description, date and checking against it

      return false;
    }
  );
}

function initCheckingAgainstWhitelistTwitter() {
  // TODO, remove timeout if possible
  setTimeout(async () => {
    chrome.storage.local.get(['whitelistTwitter', 'whitelistProfilesTwitterUserManaged'], ({whitelistTwitter, whitelistProfilesTwitterUserManaged}) => {
      whitelistTwitterGlobal = whitelistTwitter;
      whitelistProfilesTwitterUserManagedGlobal = whitelistProfilesTwitterUserManaged;

      runOnObservedMutation(analyzeTwitter);
      analyzeTwitter();
    });
  }, 1000);  
}

initCheckingAgainstWhitelistTwitter();
