'use strict';

function blockWebsite(type = 'other') {
  window.location.href = `https://phishing-blocked.surge.sh/?from=${encodeURIComponent(window.location.href)}&type=${type}`;
}

const doesUserVisitBlacklistedDomain = (blacklistDomains) => {
  const domain = psl.parse(window.location.hostname).domain;
  const {hostname} = window.location;

  console.info(`AP: isUserVisitBlacklistedDomain, blacklistDomains (${blacklistDomains.length}), hostname: ${hostname}, domain: ${domain}`);

  return -1 !== 
    blacklistDomains.findIndex(blacklistDomain => 
      blacklistDomain === domain ||
      blacklistDomain === hostname ||
      hostname.endsWith("."+blacklistDomain)
    );
};

chrome.storage.local.get(['blacklistDomains', 'whitelistDomainsUserManaged'], ({blacklistDomains, whitelistDomainsUserManaged}) => {
  // TODO: Make it DRY - this is repeated at against-blacklist.js
  if(whitelistDomainsUserManaged.includes(window.location.hostname)) {
    console.warn("AP: The website whitelisted by user", window.location.hostname);
    // TODO: Display warning to the user!
    return;
  }
  
  if(doesUserVisitBlacklistedDomain(blacklistDomains)) {
    blockWebsite('blacklist_domain_content_script');
  }
});
