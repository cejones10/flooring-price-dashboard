import { firefox, type Browser, type Page } from "playwright";
import { BaseScraper, ScrapedProduct } from "./base-scraper";
import {
  extractSpecies,
  extractDimensions,
  detectType,
  extractFinish,
  extractGrade,
  getJankaHardness,
} from "./title-parser";
import { REGION_STORES, RegionStore } from "./region-stores";

const HD_CATEGORIES: { url: string; typeHint: string }[] = [
  {
    url: "https://www.homedepot.com/b/Flooring-Hardwood-Flooring-Solid-Hardwood-Flooring/N-5yc1vZbejw",
    typeHint: "solid",
  },
  {
    url: "https://www.homedepot.com/b/Flooring-Hardwood-Flooring-Engineered-Hardwood-Flooring/N-5yc1vZb9as",
    typeHint: "engineered",
  },
];

const MAX_PAGES = 20;

// Rotate user-agents so successive regions look like different visitors
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:134.0) Gecko/20100101 Firefox/134.0",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14.5; rv:134.0) Gecko/20100101 Firefox/134.0",
  "Mozilla/5.0 (X11; Linux x86_64; rv:133.0) Gecko/20100101 Firefox/133.0",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0",
];

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
];

interface HDGraphQLProduct {
  itemId?: string;
  identifiers?: {
    storeSkuNumber?: string;
    productLabel?: string;
    modelNumber?: string;
    itemId?: string;
    canonicalUrl?: string;
    brandName?: string;
  };
  pricing?: {
    value?: number;
    unitOfMeasure?: string;
    alternate?: {
      unit?: {
        caseUnitOfMeasure?: string;
        value?: number;
        unitsPerCase?: number;
        unitsOriginalPrice?: number;
      };
    };
  };
  brandName?: string;
}

export class HomeDepotScraper extends BaseScraper {
  private browser: Browser | null = null;
  private consecutiveFailures = 0;

  constructor() {
    super("Home Depot", "https://www.homedepot.com");
  }

  private async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await firefox.launch({
        headless: true,
      });
    }
    return this.browser;
  }

  /** Close and re-create the browser (fresh TLS fingerprint). */
  private async recycleBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close().catch(() => {});
      this.browser = null;
    }
  }

  private async createPage(
    regionStore: RegionStore,
    regionIndex: number
  ): Promise<Page> {
    const browser = await this.getBrowser();
    const ua = USER_AGENTS[regionIndex % USER_AGENTS.length];
    const tz = TIMEZONES[regionIndex % TIMEZONES.length];

    const context = await browser.newContext({
      viewport: {
        width: 1280 + Math.floor(Math.random() * 640),
        height: 800 + Math.floor(Math.random() * 280),
      },
      userAgent: ua,
      locale: "en-US",
      timezoneId: tz,
    });

    // Set HD location cookies for general site context
    await context.addCookies([
      {
        name: "THD_LOCSTORE",
        value: `+${regionStore.hdStoreId}+${regionStore.zip}`,
        domain: ".homedepot.com",
        path: "/",
      },
      {
        name: "HD_DC",
        value: regionStore.zip,
        domain: ".homedepot.com",
        path: "/",
      },
      {
        name: "THD_PERSIST",
        value: `C4%3D${regionStore.hdStoreId}+%2B+${regionStore.zip}`,
        domain: ".homedepot.com",
        path: "/",
      },
      {
        name: "THD_INTERNAL",
        value: ``,
        domain: ".homedepot.com",
        path: "/",
      },
      {
        name: "THD_FORCE_LOC",
        value: `${regionStore.hdStoreId}`,
        domain: ".homedepot.com",
        path: "/",
      },
    ]);

    const page = await context.newPage();

    // Intercept GraphQL requests and rewrite storeId + deliveryZip.
    // HD's frontend JS bakes in a default store/zip that ignores cookies,
    // so we must modify the request body before it reaches the server.
    await page.route(
      (url) =>
        url.href.includes("graphql") && url.href.includes("searchModel"),
      async (route) => {
        const request = route.request();
        if (request.method() === "POST") {
          try {
            const body = JSON.parse(request.postData() || "{}");
            body.variables = body.variables || {};
            body.variables.storeId = regionStore.hdStoreId;
            body.variables.additionalSearchParams =
              body.variables.additionalSearchParams || {};
            body.variables.additionalSearchParams.deliveryZip = regionStore.zip;
            await route.continue({
              postData: JSON.stringify(body),
            });
          } catch {
            await route.continue();
          }
        } else {
          await route.continue();
        }
      }
    );

    return page;
  }

  /**
   * Check if a page loaded successfully or hit a block / error page.
   * Returns true if blocked.
   */
  private async isBlocked(page: Page): Promise<boolean> {
    try {
      const title = await page.title();
      if (title === "Error Page" || title === "") return true;
      const bodySnippet = await page
        .evaluate(() => document.body?.innerText?.substring(0, 200) || "")
        .catch(() => "");
      if (bodySnippet.includes("Something went wrong")) return true;
      return false;
    } catch {
      return true;
    }
  }

  /**
   * Navigate with retry and exponential backoff on 403/block.
   * Returns the Page response or null if all retries exhausted.
   */
  private async navigateWithRetry(
    page: Page,
    url: string,
    maxRetries: number = 3
  ): Promise<boolean> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const resp = await page.goto(url, {
          waitUntil: "domcontentloaded",
          timeout: 45000,
        });

        const status = resp?.status() ?? 0;

        if (status === 403 || (await this.isBlocked(page))) {
          const backoffSec = Math.min(30 * Math.pow(2, attempt - 1), 300);
          console.warn(
            `  [HD] Blocked (403/error) on attempt ${attempt}/${maxRetries} — backing off ${backoffSec}s`
          );
          this.consecutiveFailures++;
          await this.delay(backoffSec * 1000, backoffSec * 1000 * 1.2);
          continue;
        }

        // Success
        this.consecutiveFailures = 0;
        return true;
      } catch (err) {
        const backoffSec = 15 * attempt;
        console.warn(
          `  [HD] Navigation error attempt ${attempt}/${maxRetries}: ${(err as Error).message?.substring(0, 80)} — waiting ${backoffSec}s`
        );
        await this.delay(backoffSec * 1000, backoffSec * 1000 * 1.2);
      }
    }
    return false;
  }

  async scrapeRegion(
    regionStore: RegionStore,
    regionIndex: number = 0
  ): Promise<ScrapedProduct[]> {
    const allProducts: ScrapedProduct[] = [];
    let page: Page | null = null;

    try {
      page = await this.createPage(regionStore, regionIndex);

      // Navigate to the store page first to reinforce location context
      console.log(
        `  [HD] Setting store location: ${regionStore.regionName} (store ${regionStore.hdStoreId}, zip ${regionStore.zip})`
      );
      try {
        await page.goto(
          `https://www.homedepot.com/l/store/${regionStore.hdStoreId}`,
          { waitUntil: "domcontentloaded", timeout: 30000 }
        );
        await this.delay(3000, 6000);
      } catch (err) {
        console.warn(
          `  [HD] Warning: could not load store page for ${regionStore.regionName}, continuing with cookies only`
        );
      }

      for (const category of HD_CATEGORIES) {
        console.log(
          `  [HD] ${regionStore.regionName} — ${category.typeHint}`
        );

        let consecutiveEmpty = 0;

        for (let pageNum = 1; pageNum <= MAX_PAGES; pageNum++) {
          try {
            // If we've hit too many consecutive failures, abort early
            if (this.consecutiveFailures >= 5) {
              console.warn(
                `  [HD] Too many consecutive failures (${this.consecutiveFailures}), pausing 5 min before continuing`
              );
              await this.delay(300000, 330000);
              this.consecutiveFailures = 0;
            }

            const pageUrl =
              pageNum === 1
                ? category.url
                : `${category.url}?Nao=${(pageNum - 1) * 24}`;

            // Wait for the GraphQL searchModel response via a Promise.
            // This is set up BEFORE navigation so we never miss the response.
            const graphqlPromise = page
              .waitForResponse(
                (resp) =>
                  resp.url().includes("graphql") &&
                  resp.url().includes("searchModel") &&
                  resp.status() === 200,
                { timeout: 30000 }
              )
              .catch(() => null);

            const navOk = await this.navigateWithRetry(page, pageUrl);
            if (!navOk) {
              console.warn(
                `  [HD] Giving up on page ${pageNum} of ${category.typeHint} after retries`
              );
              break;
            }

            const graphqlResp = await graphqlPromise;
            let graphqlProducts: HDGraphQLProduct[] = [];
            if (graphqlResp) {
              try {
                const json = await graphqlResp.json();
                graphqlProducts = json?.data?.searchModel?.products || [];
              } catch {}
            }

            // Small buffer for any additional rendering
            await this.delay(2000, 4000);

            let parsedCount = 0;
            for (const raw of graphqlProducts) {
              const parsed = this.parseProduct(
                raw,
                regionStore,
                category.typeHint
              );
              if (parsed) {
                allProducts.push(parsed);
                parsedCount++;
              }
            }

            console.log(
              `    Page ${pageNum}: ${graphqlProducts.length} raw → ${parsedCount} parsed`
            );

            // Track empty pages — stop after 2 consecutive empty pages
            if (graphqlProducts.length === 0) {
              consecutiveEmpty++;
              if (consecutiveEmpty >= 2 && pageNum > 1) break;
            } else {
              consecutiveEmpty = 0;
            }

            // Generous delay between pages — randomized to look organic
            await this.delay(6000, 14000);
          } catch (err) {
            console.error(
              `  [HD] Error on page ${pageNum} of ${category.typeHint}:`,
              err
            );
            break;
          }
        }

        // Longer delay between categories
        await this.delay(10000, 20000);
      }
    } finally {
      if (page) {
        const context = page.context();
        await page.close();
        await context.close();
      }
    }

    return allProducts;
  }

  private parseProduct(
    raw: HDGraphQLProduct,
    regionStore: RegionStore,
    typeHint: string
  ): ScrapedProduct | null {
    const title = raw.identifiers?.productLabel || "";
    const sku =
      raw.identifiers?.storeSkuNumber ||
      raw.identifiers?.itemId ||
      raw.itemId ||
      "";

    // Get per-sqft price from alternate.unit.value (primary pricing is per carton)
    const sqftPrice = raw.pricing?.alternate?.unit?.value ?? 0;

    // Fallback: if alternate pricing is missing, try to compute from carton price
    let price = sqftPrice;
    if (price <= 0) {
      const cartonPrice = raw.pricing?.value ?? 0;
      const sqftPerCase = raw.pricing?.alternate?.unit?.unitsPerCase ?? 0;
      if (cartonPrice > 0 && sqftPerCase > 0) {
        price = cartonPrice / sqftPerCase;
      }
    }

    if (price <= 0 || price > 30) return null;

    const species = extractSpecies(title);
    if (!species) return null;

    const dims = extractDimensions(title);
    const type = detectType(title, typeHint);
    const finish = extractFinish(title);
    const grade = extractGrade(title);
    const janka = getJankaHardness(species);

    const canonicalUrl = raw.identifiers?.canonicalUrl || "";
    const url = canonicalUrl
      ? `https://www.homedepot.com${canonicalUrl}`
      : `https://www.homedepot.com/p/${sku}`;

    const brand = raw.identifiers?.brandName || raw.brandName || "Unknown";

    // Estimate veneer (wear layer) thickness from total thickness for engineered
    let veneer: number | null = null;
    if (type === "engineered") {
      const t = dims.thickness || 0.5;
      // Industry-standard approximate veneer thicknesses by total plank thickness
      if (t <= 0.375) veneer = 0.08; // 3/8" → ~2mm veneer
      else if (t <= 0.5) veneer = 0.12; // 1/2" → ~3mm veneer
      else if (t <= 0.625) veneer = 0.16; // 5/8" → ~4mm veneer
      else veneer = 0.24; // 3/4"+ → ~6mm veneer
    }

    return {
      species,
      type,
      width: dims.width || 5,
      thickness: dims.thickness || (type === "engineered" ? 0.5 : 0.75),
      veneer_thickness: veneer,
      finish,
      grade,
      price_per_sqft: Math.round(price * 100) / 100,
      brand,
      url,
      length: dims.length || 48,
      externalId: `homedepot:${regionStore.regionId}:${sku}`,
      janka_hardness: janka,
    };
  }

  async scrapeAllRegions(): Promise<Map<string, ScrapedProduct[]>> {
    const regionProducts = new Map<string, ScrapedProduct[]>();

    try {
      for (let i = 0; i < REGION_STORES.length; i++) {
        const regionStore = REGION_STORES[i];

        // Recycle browser every 4 regions for a fresh TLS fingerprint
        if (i > 0 && i % 4 === 0) {
          console.log(`  [HD] Recycling browser for fresh fingerprint...`);
          await this.recycleBrowser();
          // Extra pause after recycle
          await this.delay(10000, 15000);
        }

        try {
          const products = await this.scrapeRegion(regionStore, i);
          regionProducts.set(regionStore.regionId, products);
          console.log(
            `[HD] ${regionStore.regionName}: ${products.length} products total`
          );
        } catch (err) {
          console.error(
            `[HD] Failed region ${regionStore.regionName}:`,
            err
          );
          regionProducts.set(regionStore.regionId, []);
        }

        // Longer delays between regions — randomized and generous
        const baseDelay = 25000 + Math.random() * 35000; // 25-60s
        // Add jitter based on consecutive failures
        const jitter = this.consecutiveFailures * 10000;
        console.log(
          `  [HD] Waiting ${((baseDelay + jitter) / 1000).toFixed(0)}s before next region...`
        );
        await this.delay(baseDelay + jitter, baseDelay + jitter + 5000);
      }
    } finally {
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
    }

    return regionProducts;
  }

  async scrapeCategory(_category: string): Promise<ScrapedProduct[]> {
    return [];
  }

  protected async fetchPage(_url: string): Promise<string> {
    throw new Error("HD uses Playwright Firefox, not direct page fetching");
  }
}
