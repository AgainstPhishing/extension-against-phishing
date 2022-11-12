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
    item => item.twitter_name === twitterPageName ||
    twitterPageName.indexOf(item.name) !== -1
  )
)

const findWhitelistedProjectBasedOnCurrentDomainAndTitle = () => (
  WHITELIST.find(
    item => document.title.indexOf(item.name) !== -1 ||
      document.title.indexOf(item.name) !== -1
  )
)

const analyzePage = () => {
  console.log("Page analyze started!");
  // handle content modifications
  if (window.location.hostname.indexOf('twitter.com') === 0) {
    if(isTwitterAccountPhishing()) {
      throwWarning();
    }
  } else {
    domainAnalyzer();
  }
};

const isTwitterAccountPhishing = () => {
  console.log("Twitter analyze started!");

  const twitterAccount = document.title.slice(document.title.indexOf(" (@")+3, document.title.indexOf(") /"));
  if(isTwitterAccountWhitelisted(twitterAccount)) {
    console.log("Twitter account whitelisted!");
    return false;
  }

  const twitterTitle = document.title.slice(0, document.title.indexOf(" ("));

  const project = WHITELIST.find(
    item => item.twitter_name === twitterTitle ||
    twitterTitle.indexOf(item.name) !== -1
  );

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
  project.domain === window.location.hostname || window.location.hostname.reverse().indexOf(project.domain.reverse()+".") === 0
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
      headers: new Headers({'api-key': 'quickstart-QUdJIGlzIGNvbWluZy4uLi4K'})
    }).then(response => response.json())
    .then(responseJson => {
      if(responseJson.output.distance <= 5) {
        throwWarning();
      } else {
        console.log("It's probably not a phishing.")
      };
    });
  }
}

function throwWarning() {
  alert('It\'s phishing!');
}

// TODO:
// - does the url contains no ASCII characters

setTimeout(analyzePage, 2000);
console.log("Content Script loaded");
