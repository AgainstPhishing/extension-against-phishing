const BLOCKED_PAGE_URL = "https://phishing-blocked.surge.sh";

const TWITTER_SEARCHBOX_SELECTOR = '[data-testid="SearchBox_Search_Input_label"]';

function delay(time) {
  return new Promise(function(resolve) { 
      setTimeout(resolve, time)
  });
}

async function clearBrowser() {
  // clear cookies
  const client = await this.page.target().createCDPSession();
  await await client.send('Network.clearBrowserCookies');
}

describe("whitelist", () => {
  beforeAll(async () => {
    await delay(2000); // wait for download of blacklist and whitelist
  });

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

    it("user proceed despite the warning", async () => {
      await Promise.all([
        page.waitForNavigation(),
        page.click('.link-proceed'),
        page.waitForTimeout(2000)
      ]);

      const from = url.searchParams.get('from');

      const newUrl = new URL(page.url());

      expect(newUrl.href).toBe(from);
    });
  });

  describe('visited usual Twitter profile - intenseAutoTest', () => {
    let url;
  
    beforeAll(async () => {
      // Navigate to extension page
      await page.goto('https://twitter.com/intenseAutoTest', {
        waitUntil: ['load','domcontentloaded','networkidle0','networkidle2']
      });

      await delay(1500);

      url = new URL(page.url());
    });

    it("is not redirected to BLOCKED_PAGE_URL", () => {
      expect(url.hostname).toBe("twitter.com");
    });
  });

  describe('twitter malecious twitter profile from homepage', () => {
    let url;

    beforeAll(async () => {
      // const context = await browser.createIncognitoBrowserContext();
      // pageIncognito = await context.newPage();

      // Navigate to extension page
      await page.goto('https://twitter.com', {
        waitUntil: ['load','domcontentloaded','networkidle0','networkidle2']
      });

      await page.waitForSelector(TWITTER_SEARCHBOX_SELECTOR);
      await page.focus(TWITTER_SEARCHBOX_SELECTOR);
      await page.keyboard.type('@YesEnsYes');
      await page.keyboard.press('Enter');;
      await delay(1500);
      page.waitForSelector('[role="button"][data-testid="UserCell"]');

      // page.waitForSelector('a[href="/YesEnsYes"][role="link"]');
      // await delay(800);

      // page.click('a[href="/YesEnsYes"][role="link"]');

      page.click('[aria-label="Close"][role="button"]');

      await delay(800);

      page.click('[role="button"][data-testid="UserCell"]');

      await delay(2200); // wait for blocking

      url = new URL(page.url());
    }, 15000);

    it("is redirected to BLOCKED_PAGE_URL", () => {
      expect(url.origin.startsWith(BLOCKED_PAGE_URL)).toBe(true);
    });

    it("the GET parameter type is set to blacklist_domain_content_script", () => {
      expect(url.searchParams.get('type')).toBe("whitelist_twitter");
    });
  });

  describe('visited malecious Twitter profile - YesEnsYes', () => {
    let url;
  
    beforeAll(async () => {
      // Navigate to extension page
      await page.goto('https://twitter.com/YesEnsYes', {
        waitUntil: ['load','domcontentloaded','networkidle0','networkidle2']
      });
      await delay(1500);
      url = new URL(page.url());
    });

    it("is redirected to BLOCKED_PAGE_URL", () => {
      expect(url.origin.startsWith(BLOCKED_PAGE_URL)).toBe(true);
    });

    it("the GET parameter type is set to whitelist_twitter", () => {
      expect(url.searchParams.get('type')).toBe("whitelist_twitter");
    });

    it("user proceed despite the warning", async () => {
      await Promise.all([
        page.waitForNavigation(),
        page.click('.link-proceed'),
        page.waitForTimeout(2000)
      ]);
      
      const from = url.searchParams.get('from');

      const newUrl = new URL(page.url());

      expect(newUrl.href).toBe(from);
    });
  });
});
