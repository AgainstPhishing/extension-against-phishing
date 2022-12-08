'use strict';

const resemble = require("./lib/resemble");

const IMAGE_SIMILARITY_THRESHOLD = 5;
/**
 * There are two flows:
 * ## For Twitter website
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
 * 
 * ## For other websites
 *  Check the domain favicon with resemble.js
 *     If the icon is very similar, and the domain is not this one whitelisted it's a fake website.
 */

// Used for detecting in observed mutations mode for Twitter whether the location.href has been changed
var previousLocationHref = document.location.href;

var whitelistTwitterGlobal = [];
var whitelistDomainsGlobal = [];

function blockWebsite(type = 'other') {
  window.location.href = `https://phishing-blocked.surge.sh/?from=${window.location.href}&type=${type}`;
}

function isTwitterPage() {
  return window.location.hostname.startsWith('twitter.com');
}

function getCurrentFaviconURL() {
    var favicon = 'favicon.ico';
    var nodeList = document.getElementsByTagName("link");
    for (var i = 0; i < nodeList.length; i++)
    {
        if((nodeList[i].getAttribute("rel") == "icon")||(nodeList[i].getAttribute("rel") == "shortcut icon"))
        {
            favicon = nodeList[i].getAttribute("href");
            break;
        }
    }
    return window.location.origin + "/" + favicon;        
}

const findWhitelistedProjectByTwitterName = (twitterPageName) => whitelistTwitterGlobal.find(
  item => (
    twitterPageName.toLowerCase().indexOf(item.name.toLowerCase()) !== -1 ||
    twitterPageName.toLowerCase().indexOf(item.projectName.toLowerCase()) !== -1
  )
);

const findWhitelistedProjectByPageTitle = () => (
  whitelistDomainsGlobal.find(
    item => document.title.toLowerCase().indexOf(item.name.toLowerCase()) !== -1 ||
      document.title.toLowerCase().indexOf(item.name.toLowerCase()) !== -1
  )
)

const analyzeTwitter = () => {
  console.info("AP: Twitter analyze started!");
  if(isTwitterAccountPhishing()) {
    blockWebsite('whitelist_twitter');
  }
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

const isTwitterAccountPhishing = () => {
  const twitterObject = getTwitterHandleAndPageName();

  // Is it a status or a profile page?
  if(!twitterObject) {
    console.info("AP: Not a status nor profile page. Ignored.");
    return false;
  }

  console.info("AP: Twitter object: ", twitterObject);

  if(isTwitterAccountWhitelisted(twitterObject.handle)) {
    console.info("AP: Twitter account whitelisted!");

    return false;
  }

  const project = findWhitelistedProjectByTwitterName(twitterObject.name);

  if(!!project) {
    console.log("AP: Twitter fake account detected!")
    return true;
  }

  return false;
}

const isTwitterAccountWhitelisted = (twitterAccount) => {
  return !!whitelistTwitterGlobal.find(item => item.handle === twitterAccount);
}

const isItDomainOrSubdomainOfWhitelistedProject = ({address}) => {
  const domain = psl.parse(window.location.hostname).domain;
  const {hostname} = window.location;

  return (
    address === hostname ||
    address === domain ||
    hostname.endsWith("."+address)
  );
};

async function getResponseHeaderContentLength(response) {
  const blob = await response.blob();
  const {size} = blob;
  
  console.info("AP: favicon size", size);

  if(!size) {
    console.error("AP: favicon analyse - size is empty!");
    throw new Error("AP: favicon analyse - size is empty!");
  }

  return size;
}

const domainAnalyzer = () => {
  console.info("AP: Domain analyzer started!");
  // Step 0: Find whitelisted related project
  const project = findWhitelistedProjectByPageTitle();

  // if there is any similar whitlisted project
  if(!project) {
    console.info("AP: No project found. The website you are visiting might be safe.")
    return;
  }
  
  if(isItDomainOrSubdomainOfWhitelistedProject(project)) {
    console.info("AP: The domain is whitelisted! The page is SAFE!");
    return;
  }

  console.log("AP: whitelist faviconUrl", project.faviconUrl);

  // Analyze favicon size. If the same bytes it's a probably scam.
  // TODO: Get one favicon. The bigger one.
  fetch(project.faviconUrl).then(getResponseHeaderContentLength).then(projectFaviconSize => {
    const currentFaviconURL = getCurrentFaviconURL();
    console.info("AP: currentFaviconURL", currentFaviconURL);
  
    fetch(currentFaviconURL).then(getResponseHeaderContentLength).then(currentFaviconSize => {
      if(projectFaviconSize === currentFaviconSize) {
        console.info("AP: Favicons have the same size!");
        blockWebsite('whitelist_favicon_size');
        return;
      }

      // Resemble.js comparison
      resemble(project.faviconUrl)
        .compareTo(currentFaviconURL)
        .scaleToSameSize()
        .ignoreColors()
        .onComplete(data => {
          console.info("AP: resemble, onComplete", data);
          if(data.rawMisMatchPercentage < IMAGE_SIMILARITY_THRESHOLD) {
            blockWebsite('whitelist_favicon_similar_'+IMAGE_SIMILARITY_THRESHOLD);
          }
        });
    })
  });
}

function runOnObservedMutation(callbackFunction) {
  const bodyList = document.querySelector("body");

  console.info("AP: runOnObservedMutation");

  function onMutation(mutations) {
    mutations.forEach(function(mutation) {
        if (previousLocationHref != document.location.href) {
            console.info("AP: Previous URL "+previousLocationHref+" differs from the current: "+document.location.href+"!");
            previousLocationHref = document.location.href;
            setTimeout(callbackFunction, 800);
            return;
        }
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

function initCheckingAgainstWhitelist() {
  setTimeout(() => {
    if(isTwitterPage()) {
      chrome.storage.local.get('whitelistTwitter', ({whitelistTwitter}) => {
        whitelistTwitterGlobal = whitelistTwitter;

        runOnObservedMutation(analyzeTwitter);
        analyzeTwitter();
      });
    } else {
      chrome.storage.local.get('whitelistDomains', ({whitelistDomains}) => {
        whitelistDomainsGlobal = whitelistDomains;
  
        domainAnalyzer();
      });
    }
  }, 1000);  
}

initCheckingAgainstWhitelist();
