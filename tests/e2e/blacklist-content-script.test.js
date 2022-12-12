const BLOCKED_PAGE_URL = "https://phishing-blocked.surge.sh";

function delay(time) {
  return new Promise(function(resolve) { 
      setTimeout(resolve, time)
  });
}

describe("blacklist", () => {
  beforeAll(async () => {
    await delay(2000); // wait for download of blacklist and whitelist
  });

  describe('visited primotapia.surge.sh', () => {
    let url;
  
    beforeAll(async () => {
      // Navigate to extension page
      await page.goto('https://primotapia.surge.sh/', {
        waitUntil: 'networkidle2',
      });
      
      url = new URL(page.url());
    });

    it("is redirected to BLOCKED_PAGE_URL", () => {
      expect(url.origin.startsWith(BLOCKED_PAGE_URL)).toBe(true);
    });

    it("the GET parameter type is set to blacklist_domain_content_script", () => {
      expect(url.searchParams.get('type')).toBe("blacklist_domain_content_script");
    });

    it("the GET parameter from is set to https://primotapia.surge.sh/", () => {
      expect(url.searchParams.get('from')).toBe("https://primotapia.surge.sh/");
    });
  });
});
