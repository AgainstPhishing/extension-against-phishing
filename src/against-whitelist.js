'use strict';

const IMAGE_SIMILARITY_THRESHOLD = 10;

/**
 * ## For websites websites
 *  Check the domain favicon with resemble.js
 *     If the icon is very similar, and the domain is not this one whitelisted it's a fake website.
 */

var whitelistDomainsGlobal = [];

function blockWebsite(type = 'other') {
  window.location.href = `https://phishing-blocked.surge.sh/?from=${encodeURIComponent(window.location.href)}&type=${encodeURIComponent(type)}`;
}

function displayNotificationAboutUnsafeWebsite(hostname) {
  chrome.runtime.sendMessage({name: 'unsafe-phishing-related-website', hostname});
}

// TODO: Get one favicon. The bigger one.
function getCurrentFaviconURL() {
    var favicon = 'favicon.ico'; // default favicon url
    var nodeList = document.getElementsByTagName("link");

    for (var i = 0; i < nodeList.length; i++)
    {
        if((nodeList[i].getAttribute("rel") == "icon")||(nodeList[i].getAttribute("rel") == "shortcut icon"))
        {
            favicon = nodeList[i].getAttribute("href");
            break;
        }
    }

    if(favicon.startsWith("https://") || favicon.startsWith("http://")) {
      return favicon;        
    }

    return window.location.origin + "/" + favicon;        
}

const findWhitelistedProjectByPageTitle = () => (
  whitelistDomainsGlobal.find(
    item => document.title.toLowerCase().indexOf(item.name.toLowerCase()) !== -1 ||
      document.title.toLowerCase().indexOf(item.name.toLowerCase()) !== -1
  )
)

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

async function domainAnalyzer() {
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

  const {faviconUrl: whitelistedFavicon} = project;
  const currentPageFaviconURL = getCurrentFaviconURL();

  console.log("AP: whitelistedFavicon", whitelistedFavicon);

  // Comparing URLs
  if(currentPageFaviconURL === whitelistedFavicon) {
    blockWebsite('whitelist_favicon_same_url');
    return;
  }

  const [whitelistedFaviconSize, currentFaviconSize] = await Promise.all([
    fetch(whitelistedFavicon).then(getResponseHeaderContentLength),
    fetch(currentPageFaviconURL).then(getResponseHeaderContentLength)
  ]);

  // Compare Favicon Sizes
  if(whitelistedFaviconSize === currentFaviconSize) {
    console.info("AP: Favicons have the same size!");
    blockWebsite('whitelist_favicon_size');
    return;
  }

  // Resemble.js based favicon comparison
  resemble(whitelistedFavicon)
    .compareTo(currentPageFaviconURL)
    .scaleToSameSize()
    .onComplete(data => {
      console.info("AP: resemble, onComplete", data);
      if(data.rawMisMatchPercentage < IMAGE_SIMILARITY_THRESHOLD) {
        blockWebsite('whitelist_favicon_similar_'+IMAGE_SIMILARITY_THRESHOLD);
      }
    });
}

function initCheckingAgainstWhitelist() {
  // TODO: remove timeout if possible
  setTimeout(async () => {
    chrome.storage.local.get(['whitelistDomains', 'whitelistDomainsUserManaged'], ({whitelistDomains, whitelistDomainsUserManaged}) => {

      // TODO: Make it DRY - this is repeated at against-blacklist.js
      if(whitelistDomainsUserManaged.includes(window.location.hostname)) {
        console.warn("AP: The website whitelisted by user", window.location.hostname);

        displayNotificationAboutUnsafeWebsite(window.location.hostname);

        return;
      }

      whitelistDomainsGlobal = whitelistDomains;
      domainAnalyzer();
    });
  }, 1000);  
}

initCheckingAgainstWhitelist();
