let psl;
(async () => {
  const src = chrome.runtime.getURL("lib/psl.min.js");
  const moduleObject = await import(src);
  psl = moduleObject.default;
  console.log("moduleObject", moduleObject);
})();

function throwWarning() {
  window.location.href = 'https://phishing-blocked.surge.sh/?from=' + window.location.href;
}



const isItDomainOrSubdomainOfWhitelistedProject = (project) => (
  project.domain === window.location.hostname || window.location.hostname.split("").reverse().join("").indexOf(project.domain.split("").reverse().join("")+".") === 0
);

chrome.storage.local.get('blacklistDomains', ({blacklistDomains}) => {
  console.log("blacklistDomains", blacklistDomains);
  console.log("psl", psl);
});
