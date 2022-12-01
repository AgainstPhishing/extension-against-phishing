function throwWarning() {
  window.location.href = 'https://phishing-blocked.surge.sh/?from=' + window.location.href;
}

const isUserVisitBlacklistedDomain = (blacklistDomains) => {
  const domain = psl.parse(window.location.hostname).domain;
  console.log("isUserVisitBlacklistedDomain", domain, blacklistDomains);
  return -1 !== blacklistDomains.findIndex(blacklistDomain => blacklistDomain === domain);
};

chrome.storage.local.get('blacklistDomains', ({blacklistDomains}) => {
  if(isUserVisitBlacklistedDomain(blacklistDomains)) {
    throwWarning();
  }
});
