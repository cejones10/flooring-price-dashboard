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

const LOWES_CATEGORIES: Record<string, { url: string; typeHint: string }> = {
  "solid-hardwood": {
    url: "https://www.lowes.com/pl/Solid-hardwood--Hardwood-flooring-Flooring/4294760428",
    typeHint: "solid",
  },
  "engineered-hardwood": {
    url: "https://www.lowes.com/pl/Engineered-hardwood--Hardwood-flooring-Flooring/4294760429",
    typeHint: "engineered",
  },
};

const IS_CI = !!process.env.GITHUB_ACTIONS;
const MAX_PAGES = 4;

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

interface LowesProduct {
  productId?: string;
  product?: {
    brand?: string;
    description?: string;
    pdURL?: string;
    omniItemId?: string;
    imageUrls?: string[];
  };
  price?: {
    itemPrice?: number;
    wasPrice?: number;
    unitOfMeasure?: string;
    priceQualifier?: string;
  };
}

export class LowesScraper extends BaseScraper {
  private browser: Browser | null = null;
  private consecutiveFailures = 0;

  constructor() {
    super("Lowe's", "https://www.lowes.com");
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

  private async createStealthPage(regionIndex: number): Promise<Page> {
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

    return await context.newPage();
  }

  /** Check if page is a block/error page. */
  private async isBlocked(page: Page): Promise<boolean> {
    try {
      const title = await page.title();
      if (title === "" || title.toLowerCase().includes("error")) return true;
      const bodySnippet = await page
        .evaluate(() => document.body?.innerText?.substring(0, 300) || "")
        .catch(() => "");
      if (
        bodySnippet.includes("Access Denied") ||
        bodySnippet.includes("Something went wrong") ||
        bodySnippet.includes("robot")
      )
        return true;
      return false;
    } catch {
      return true;
    }
  }

  /** Navigate with retry and exponential backoff on block. */
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

        if (status === 403 || status === 429 || (await this.isBlocked(page))) {
          const backoffSec = Math.min(30 * Math.pow(2, attempt - 1), 300);
          console.warn(
            `  [Lowes] Blocked (${status}) on attempt ${attempt}/${maxRetries} — backing off ${backoffSec}s`
          );
          this.consecutiveFailures++;
          await this.delay(backoffSec * 1000, backoffSec * 1000 * 1.2);
          continue;
        }

        this.consecutiveFailures = 0;
        return true;
      } catch (err) {
        const backoffSec = 15 * attempt;
        console.warn(
          `  [Lowes] Navigation error attempt ${attempt}/${maxRetries}: ${(err as Error).message?.substring(0, 80)} — waiting ${backoffSec}s`
        );
        await this.delay(backoffSec * 1000, backoffSec * 1000 * 1.2);
      }
    }
    return false;
  }

  async setStoreLocation(
    page: Page,
    regionStore: RegionStore
  ): Promise<void> {
    try {
      // Navigate to Lowe's and set location via the store page
      const ok = await this.navigateWithRetry(
        page,
        `https://www.lowes.com/store/${regionStore.lowesStoreId}`
      );
      if (!ok) {
        console.warn(
          `  [Lowes] Could not reach store page for ${regionStore.regionName}`
        );
        return;
      }
      await this.delay(2000, 4000);

      // Try clicking "Set as My Store" button if available
      const setStoreBtn = page.locator(
        'button:has-text("Set as My Store"), button:has-text("Make This My Store")'
      );
      if ((await setStoreBtn.count()) > 0) {
        await setStoreBtn.first().click();
        await this.delay(1500, 3000);
      }
    } catch (err) {
      console.warn(
        `  [Lowes] Could not set store for ${regionStore.regionName}, using default location`
      );
    }
  }

  /** Try extracting products from __NEXT_DATA__ JSON embedded in page */
  private extractFromNextData(page: Page): Promise<LowesProduct[]> {
    return page.evaluate(() => {
      const nextDataEl = document.querySelector("#__NEXT_DATA__");
      if (!nextDataEl?.textContent) return [];

      try {
        const data = JSON.parse(nextDataEl.textContent);
        const pageProps = data?.props?.pageProps;

        // Lowe's uses various structures — try common paths
        const products =
          pageProps?.categorizedProducts?.products ||
          pageProps?.productResults?.products ||
          pageProps?.results ||
          [];

        return products;
      } catch {
        return [];
      }
    });
  }

  /** Fallback: parse product cards from the DOM */
  private async extractFromDOM(page: Page): Promise<
    Array<{
      title: string;
      price: number;
      brand: string;
      url: string;
      productId: string;
    }>
  > {
    return page.evaluate(() => {
      const products: Array<{
        title: string;
        price: number;
        brand: string;
        url: string;
        productId: string;
      }> = [];

      // Lowe's product card selectors (may change)
      const cards = Array.from(
        document.querySelectorAll(
          '[data-testid="product-card"], .plp-card, [class*="ProductCard"], article[data-productid]'
        )
      );

      for (const card of cards) {
        try {
          const titleEl = card.querySelector(
            '[data-testid="product-title"], h3 a, [class*="product-title"] a, .js-productTitle'
          ) as HTMLElement;
          const priceEl = card.querySelector(
            '[data-testid="product-price"], [class*="art-price-amount"], .product-pricing__amount, span[itemprop="price"]'
          ) as HTMLElement;
          const brandEl = card.querySelector(
            '[data-testid="product-brand"], [class*="brand"], .js-productBrand'
          ) as HTMLElement;

          const title = titleEl?.textContent?.trim() || "";
          const priceText = priceEl?.textContent?.trim() || "";
          const brand = brandEl?.textContent?.trim() || "";
          const url =
            (titleEl?.closest("a") as HTMLAnchorElement)?.href || "";
          const productId = card.getAttribute("data-productid") || "";

          const priceMatch = priceText.match(/\$?([\d,]+\.?\d*)/);
          const price = priceMatch
            ? parseFloat(priceMatch[1].replace(",", ""))
            : 0;

          if (title && price > 0) {
            products.push({ title, price, brand, url, productId });
          }
        } catch {
          // Skip malformed cards
        }
      }

      return products;
    });
  }

  async scrapeRegion(
    regionStore: RegionStore,
    regionIndex: number = 0
  ): Promise<ScrapedProduct[]> {
    const allProducts: ScrapedProduct[] = [];
    let page: Page | null = null;

    try {
      page = await this.createStealthPage(regionIndex);
      await this.setStoreLocation(page, regionStore);

      for (const [category, config] of Object.entries(LOWES_CATEGORIES)) {
        console.log(`  [Lowes] ${regionStore.regionName} — ${category}`);

        let consecutiveEmpty = 0;

        for (let pageNum = 1; pageNum <= MAX_PAGES; pageNum++) {
          try {
            // Circuit breaker: pause if too many consecutive failures
            if (this.consecutiveFailures >= 5) {
              console.warn(
                `  [Lowes] Too many consecutive failures (${this.consecutiveFailures}), pausing 5 min`
              );
              await this.delay(300000, 330000);
              this.consecutiveFailures = 0;
            }

            const pageUrl =
              pageNum === 1
                ? config.url
                : `${config.url}?offset=${(pageNum - 1) * 24}`;

            const navOk = await this.navigateWithRetry(page, pageUrl);
            if (!navOk) {
              console.warn(
                `  [Lowes] Giving up on page ${pageNum} of ${category} after retries`
              );
              break;
            }
            await this.delay(3000, 6000);

            // Wait for product content to load
            await page
              .waitForSelector(
                '[data-testid="product-card"], .plp-card, [class*="ProductCard"], article',
                { timeout: 10000 }
              )
              .catch(() => {});

            // Strategy 1: Try __NEXT_DATA__
            const nextDataProducts = await this.extractFromNextData(page);
            let parsedCount = 0;

            if (nextDataProducts.length > 0) {
              for (const raw of nextDataProducts) {
                const parsed = this.parseLowesNextDataProduct(
                  raw,
                  regionStore,
                  config.typeHint
                );
                if (parsed) {
                  allProducts.push(parsed);
                  parsedCount++;
                }
              }
            } else {
              // Strategy 2: DOM parsing fallback
              const domProducts = await this.extractFromDOM(page);
              for (const raw of domProducts) {
                const parsed = this.parseLowesDOMProduct(
                  raw,
                  regionStore,
                  config.typeHint
                );
                if (parsed) {
                  allProducts.push(parsed);
                  parsedCount++;
                }
              }
            }

            console.log(
              `    Page ${pageNum}: ${parsedCount} products parsed`
            );

            // Track empty pages — stop after 2 consecutive empty
            if (parsedCount === 0) {
              consecutiveEmpty++;
              if (consecutiveEmpty >= 2 && pageNum > 1) break;
            } else {
              consecutiveEmpty = 0;
            }

            // Delay between pages
            await this.delay(IS_CI ? 5000 : 10000, IS_CI ? 10000 : 18000);
          } catch (err) {
            console.error(
              `  [Lowes] Error on page ${pageNum} of ${category}:`,
              err
            );
            break;
          }
        }

        // Delay between categories
        await this.delay(IS_CI ? 5000 : 10000, IS_CI ? 10000 : 20000);
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

  private parseLowesNextDataProduct(
    raw: LowesProduct,
    regionStore: RegionStore,
    typeHint: string
  ): ScrapedProduct | null {
    const title = raw.product?.description || "";
    const productId = raw.productId || raw.product?.omniItemId || "";

    const price = raw.price?.itemPrice ?? 0;
    if (price <= 0 || price > 30) return null;

    // Check unit of measure
    const uom = raw.price?.unitOfMeasure?.toLowerCase() || "";
    const qualifier = raw.price?.priceQualifier?.toLowerCase() || "";
    if (
      uom &&
      !uom.includes("sq") &&
      !uom.includes("foot") &&
      !qualifier.includes("sq")
    ) {
      if (uom) return null;
    }

    const species = extractSpecies(title);
    if (!species) return null;

    const dims = extractDimensions(title);
    const type = detectType(title, typeHint);
    const finish = extractFinish(title);
    const grade = extractGrade(title);
    const janka = getJankaHardness(species);

    const pdURL = raw.product?.pdURL || "";
    const url = pdURL
      ? `https://www.lowes.com${pdURL}`
      : `https://www.lowes.com/pd/${productId}`;

    let veneer: number | null = null;
    if (type === "engineered") {
      const t = dims.thickness || 0.5;
      if (t <= 0.375) veneer = 0.08;
      else if (t <= 0.5) veneer = 0.12;
      else if (t <= 0.625) veneer = 0.16;
      else veneer = 0.24;
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
      brand: raw.product?.brand || "Unknown",
      url,
      length: dims.length || 48,
      externalId: `lowes:${regionStore.regionId}:${productId}`,
      janka_hardness: janka,
    };
  }

  private parseLowesDOMProduct(
    raw: {
      title: string;
      price: number;
      brand: string;
      url: string;
      productId: string;
    },
    regionStore: RegionStore,
    typeHint: string
  ): ScrapedProduct | null {
    if (raw.price <= 0 || raw.price > 30) return null;

    const species = extractSpecies(raw.title);
    if (!species) return null;

    const dims = extractDimensions(raw.title);
    const type = detectType(raw.title, typeHint);
    const finish = extractFinish(raw.title);
    const grade = extractGrade(raw.title);
    const janka = getJankaHardness(species);

    const productId = raw.productId || raw.url.split("/").pop() || "";

    let veneer: number | null = null;
    if (type === "engineered") {
      const t = dims.thickness || 0.5;
      if (t <= 0.375) veneer = 0.08;
      else if (t <= 0.5) veneer = 0.12;
      else if (t <= 0.625) veneer = 0.16;
      else veneer = 0.24;
    }

    return {
      species,
      type,
      width: dims.width || 5,
      thickness: dims.thickness || (type === "engineered" ? 0.5 : 0.75),
      veneer_thickness: veneer,
      finish,
      grade,
      price_per_sqft: Math.round(raw.price * 100) / 100,
      brand: raw.brand || "Unknown",
      url: raw.url.startsWith("http")
        ? raw.url
        : `https://www.lowes.com${raw.url}`,
      length: dims.length || 48,
      externalId: `lowes:${regionStore.regionId}:${productId}`,
      janka_hardness: janka,
    };
  }

  /** Scrape all regions */
  async scrapeAllRegions(
    skipRegions: Set<string> = new Set(),
    onRegionComplete?: (regionId: string, products: ScrapedProduct[]) => Promise<void>,
    maxRegions?: number
  ): Promise<Map<string, ScrapedProduct[]>> {
    const regionProducts = new Map<string, ScrapedProduct[]>();
    let regionsScraped = 0;

    try {
      for (let i = 0; i < REGION_STORES.length; i++) {
        if (maxRegions && regionsScraped >= maxRegions) {
          console.log(`  [Lowes] Reached max regions (${maxRegions}) — stopping`);
          break;
        }

        const regionStore = REGION_STORES[i];

        if (skipRegions.has(regionStore.regionId)) {
          console.log(
            `  [Lowes] Skipping ${regionStore.regionName} — already has recent data`
          );
          continue;
        }

        // Recycle browser every 4 regions for a fresh TLS fingerprint
        if (i > 0 && i % 4 === 0) {
          console.log(`  [Lowes] Recycling browser for fresh fingerprint...`);
          await this.recycleBrowser();
          await this.delay(8000, 12000);
        }

        try {
          const products = await this.scrapeRegion(regionStore, i);
          regionProducts.set(regionStore.regionId, products);
          regionsScraped++;
          console.log(
            `[Lowes] ${regionStore.regionName}: ${products.length} products`
          );

          // Immediately persist to DB via callback
          if (onRegionComplete && products.length > 0) {
            await onRegionComplete(regionStore.regionId, products);
          }
        } catch (err) {
          console.error(
            `[Lowes] Failed region ${regionStore.regionName}:`,
            err
          );
          regionProducts.set(regionStore.regionId, []);
          regionsScraped++;
        }

        // Delay between regions — CI gets fresh IPs, local needs longer cooldown
        const baseDelay = IS_CI
          ? 45000 + Math.random() * 45000    // CI: 45-90s
          : 120000 + Math.random() * 60000;  // Local: 2-3 min
        const jitter = this.consecutiveFailures * (IS_CI ? 10000 : 20000);
        console.log(
          `  [Lowes] Waiting ${((baseDelay + jitter) / 1000).toFixed(0)}s before next region...`
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

  // Required by BaseScraper — not used directly
  async scrapeCategory(_category: string): Promise<ScrapedProduct[]> {
    return [];
  }

  protected async fetchPage(_url: string): Promise<string> {
    throw new Error("Lowes uses Playwright, not direct page fetching");
  }
}
