'use strict';

function initializeRedirectToExceptionPage() {
  setTimeout(() => {
    const url = new URL(document.location);
    const ok = url.searchParams.get('ok');
    const from = url.searchParams.get('from');
    const twitter = url.searchParams.get('twitter');
    
    if(ok && from) {
      if(twitter) {
        const twitterJson = JSON.parse(twitter);

        chrome.storage.local.get(['whitelistProfilesTwitterUserManaged'], ({whitelistProfilesTwitterUserManaged}) => {
          // TODO: MAKE IT DRY: repetition below
          if(whitelistProfilesTwitterUserManaged.every(twitterWhitlisted => twitterWhitlisted.handle !== twitterJson.handle)) {
            initializeRedirectToExceptionPage();
          } else {
            window.location.href = from;
          }
        });
      } else {
        const {hostname} = (new URL(from));

        chrome.storage.local.get(['whitelistDomainsUserManaged'], ({whitelistDomainsUserManaged}) => {
          if(whitelistDomainsUserManaged.includes(hostname)) {
            window.location.href = from;
          } else {
            initializeRedirectToExceptionPage();
          }
        });
      }
    }
  }, 400);
}

initializeRedirectToExceptionPage();
