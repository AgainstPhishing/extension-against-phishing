/**
 * The flow:
 * 1. Does it twitter?
 * 
 *  isTwitterAccountPhishing:
 *  1. Is it status page?
 *    check for the page name, filter title by: " on Twitter"
 *    If the project has been found at whitlist and...
 *    1. if it was posted by whitlisted twitter handle
 *      THIS IS NOT SCAM
 *    2. else
 *      THIS IS SCAM
 *    
 *  2. Is it profile page?
 *    check the document.title against (@)
 *    If the project has been found at whitlist and...
 *    1. if it is the same handler as whitelisted
 *      THIS IS NOT SCAM
 *    2. else
 *      THIS IS SCAM
 * 
 *  3. Not Page? Not Status?
 *    Just IGNORE
 * 
 * 2. Not a twitter:
 *  - check the domain favicon with deepai
 * 
 */

// TODO:
// - does the url contains no ASCII characters

const WHITELIST = [
  {
    "name": "ENS",
    "domain": "ens.domains",
    "twitter_profile": "ensdomains",
    "twitter_name": "ens.eth",
    "description": "Ethereum Domain System",
    "domain_favicon_url": "https://claim.ens.domains/favicon.ico",
    "twitter_logo_url": "https://pbs.twimg.com/profile_images/1455381288756695041/acatxTm8_400x400.jpg",
  }
];

const findWhitelistedProjectByTwitterName = (twitterPageName) => (
  WHITELIST.find(
    item => twitterPageName.indexOf(item.twitter_name) !== -1 ||
    twitterPageName.indexOf(item.name) !== -1
  )
)

const findWhitelistedProjectBasedOnCurrentDomainAndTitle = () => (
  WHITELIST.find(
    item => document.title.toLowerCase().indexOf(item.name.toLowerCase()) !== -1 ||
      document.title.toLowerCase().indexOf(item.name.toLowerCase()) !== -1
  )
)

const analyzePage = () => {
  console.log("Page analyze started!");
  // handle content modifications
  if (window.location.hostname.indexOf('twitter.com') !== -1) {
    if(isTwitterAccountPhishing()) {
      throwWarning();
    }
  } else {
    domainAnalyzer();
  }
};

/**
 * @returns false or twitter handle
 */
const isTwitterStatusPage = () => {
  const regex = /twitter.com\/(.*)\/status\//;
  console.log("regex");
  const matches = document.location.href.match(regex);
  if(matches) {
    return matches[0];
  }

  return false;
}

function getProfilePageHandle() {
  return document.title.slice(document.title.indexOf(" (@")+3, document.title.indexOf(") /"));
}
/**
 * @returns null OR {name, handle}
 */
function getTwitterHandleAndPageName() {
  let handle = isTwitterStatusPage();
  console.log("isTwitterStatusPage", handle);
  if(handle) {
    return {
      name: document.title.slice(0, document.title.indexOf(" on Twitter:")),
      handle
    }
  } else {
    handle = document.title.slice(document.title.indexOf(" (@")+3, document.title.indexOf(") /"));
    if(handle) {
      return {
        name: document.title.slice(0, document.title.indexOf(" (")),
        handle
      };
    }
  }
  return null;
}

const isTwitterAccountPhishing = () => {
  console.log("Twitter analyze started!");

  const twitterObject = getTwitterHandleAndPageName();
  // if the twitterObject is empty, it's not a status nor a profile page visited;
  if(!twitterObject) {
    console.log("No twitter object returned!");
    return false;
  }

  console.log("Twitter object: ", twitterObject);

  if(isTwitterAccountWhitelisted(twitterObject.handle)) {
    console.log("Twitter account whitelisted!");

    return false;
  }

  const project = findWhitelistedProjectByTwitterName(twitterObject.name);

  if(!!project) {
    console.log("Twitter fake account detected!")
    return true;
  }


  return false;
}

const isTwitterAccountWhitelisted = (twitterAccount) => {
  return !!WHITELIST.find(item => item.twitter_profile === twitterAccount);
}

const isItDomainOrSubdomainOfWhitelistedProject = (project) => (
  project.domain === window.location.hostname || window.location.hostname.split("").reverse().join("").indexOf(project.domain.split("").reverse().join("")+".") === 0
);

const domainAnalyzer = () => {
  console.log("Domain analyzer started!");
  // Step 0: Find whitelisted related project
  const project = findWhitelistedProjectBasedOnCurrentDomainAndTitle();

  // if the domain or is whitelisted, ignore it
  if(!project) {
    console.log("No project find. The website you are visiting is probably safe.")
    return;
  } else if(isItDomainOrSubdomainOfWhitelistedProject(project)) {
    console.log("The domain is whitelisted!");
  } else {
    // Step 1: analyze favicon
    const formData = new FormData();
    formData.append('image1', project.domain_favicon_url);
    formData.append('image2', window.location.protocol + '//'+ window.location.host + '/favicon.ico');
    fetch('https://api.deepai.org/api/image-similarity', {
      body: formData,
      method: 'POST',
      headers: new Headers({'api-key': '9ef95b57-fdee-474b-9fc6-108157b31d60'})
    }).then(response => response.json())
    .then(responseJson => {
      if(!responseJson.output) {
        // We didn't paid for the deepAI API. It means that it's a phishing website! Ha ha!
        // It's a dirty hack for the hackathon. TODO - just do it better. I might use this JS library for image comparison:
        throwWarning();
      } else if(responseJson.output.distance <= 5) {
        console.log("This is scam! The profile image is the same!")
        throwWarning();
      } else {
        console.log("It's probably not a phishing.")
      };
    });
  }
}

function throwWarning() {
  window.location.href = 'https://phishing-blocked.surge.sh/?from=' + window.location.href;
}

function runOnObservedMutation(callbackFunction) {
  const bodyList = document.querySelector("body")

  const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
          if (oldHref != document.location.href) {
              console.log("The old URL: "+oldHref+" is not the same as a new: "+document.location.href+"!");
              oldHref = document.location.href;
              setTimeout(callbackFunction, 800);
          }
      });
  });
  
  const config = {
      childList: true,
      subtree: true
  };
  
  observer.observe(bodyList, config);
}

setTimeout(() => {
  analyzePage();

  runOnObservedMutation(analyzePage);
}, 1000);

var oldHref = document.location.href;
