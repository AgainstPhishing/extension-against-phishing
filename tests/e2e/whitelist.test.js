const BLOCKED_PAGE_URL = "https://phishing-blocked.surge.sh";

function delay(time) {
  return new Promise(function(resolve) { 
      setTimeout(resolve, time)
  });
}

describe("whitelist", () => {
  describe('visited ens-similar-favicon-siza.surge.sh', () => {
    let url;

    beforeAll(async () => {
      // Navigate to extension page
      await page.goto('https://ens-similar-favicon-siza.surge.sh/', {
        waitUntil: ['load','domcontentloaded','networkidle0','networkidle2']
      });
      await delay(1000);
      url = new URL(page.url());
    });

    it("is redirected to BLOCKED_PAGE_URL", () => {
      expect(url.origin.startsWith(BLOCKED_PAGE_URL)).toBe(true);
    });

    it("the GET parameter type is set to blacklist_domain_content_script", () => {
      expect(url.searchParams.get('type')).toBe("whitelist_favicon_size");
    });

    it("the GET parameter from is set to https://ens-similar-favicon-siza.surge.sh/", () => {
      expect(url.searchParams.get('from')).toBe("https://ens-similar-favicon-siza.surge.sh/");
    });
  });

  describe('visited ens-similar-favicon-resemble.surge.sh', () => {
    let url;
  
    beforeAll(async () => {
      // Navigate to extension page
      await page.goto('https://ens-similar-favicon-resemble.surge.sh/', {
        waitUntil: ['load','domcontentloaded','networkidle0','networkidle2']
      });
      await delay(1000);
      url = new URL(page.url());
    });

    it("is redirected to BLOCKED_PAGE_URL", async () => {
      expect(url.origin.startsWith(BLOCKED_PAGE_URL)).toBe(true);
    });

    it("the GET parameter type is set to blacklist_domain_content_script", () => {
      expect(url.searchParams.get('type')).toBe("whitelist_favicon_similar_10");
    });

    it("the GET parameter from is set to ens-similar-favicon-resemble.surge.sh", () => {
      expect(url.searchParams.get('from')).toBe("https://ens-similar-favicon-resemble.surge.sh/");
    });
  });

  describe('visited usual Twitter profile - intenseAutoTest', () => {
    let url;
  
    beforeAll(async () => {
      // Navigate to extension page
      await page.goto('https://twitter.com/intenseAutoTest', {
        waitUntil: ['load','domcontentloaded','networkidle0','networkidle2']
      });
      await delay(1000);
      url = new URL(page.url());
    });

    it("is not redirected to BLOCKED_PAGE_URL", () => {
      expect(url.hostname).toBe("twitter.com");
    });
  });

  describe('visited malecious Twitter profile - YesEnsYes', () => {
    let url;
  
    beforeAll(async () => {
      // Navigate to extension page
      await page.goto('https://twitter.com/YesEnsYes', {
        waitUntil: ['load','domcontentloaded','networkidle0','networkidle2']
      });
      await delay(1000);
      url = new URL(page.url());
    });

    it("is redirected to BLOCKED_PAGE_URL", () => {
      expect(url.origin.startsWith(BLOCKED_PAGE_URL)).toBe(true);
    });

    it("the GET parameter type is set to whitelist_twitter", () => {
      expect(url.searchParams.get('type')).toBe("whitelist_twitter");
    });
  });

});
