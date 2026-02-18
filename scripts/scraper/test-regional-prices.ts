/**
 * Quick test: scrape 2 pages per category for 3 regions to verify
 * that regional pricing is working (prices differ by region).
 */
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { firefox, type Browser, type Page } from "playwright";
import {
  extractSpecies,
  extractDimensions,
  detectType,
  extractFinish,
  extractGrade,
  getJankaHardness,
} from "./title-parser";
import { REGION_STORES, type RegionStore } from "./region-stores";

const TEST_PAGES = 2; // Only 2 pages per category for speed

const HD_CATEGORIES = [
  {
    url: "https://www.homedepot.com/b/Flooring-Hardwood-Flooring-Solid-Hardwood-Flooring/N-5yc1vZbejw",
    typeHint: "solid",
  },
  {
    url: "https://www.homedepot.com/b/Flooring-Hardwood-Flooring-Engineered-Hardwood-Flooring/N-5yc1vZb9as",
    typeHint: "engineered",
  },
];

interface SimpleProduct {
  sku: string;
  species: string;
  type: string;
  price: number;
  title: string;
}

function delay(min: number, max: number): Promise<void> {
  const ms = min + Math.random() * (max - min);
  return new Promise((r) => setTimeout(r, ms));
}

async function scrapeRegionQuick(
  browser: Browser,
  region: RegionStore
): Promise<SimpleProduct[]> {
  const products: SimpleProduct[] = [];

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0",
    locale: "en-US",
    timezoneId: "America/New_York",
  });

  // Set HD location cookies
  await context.addCookies([
    {
      name: "THD_LOCSTORE",
      value: `+${region.hdStoreId}+${region.zip}`,
      domain: ".homedepot.com",
      path: "/",
    },
    {
      name: "HD_DC",
      value: region.zip,
      domain: ".homedepot.com",
      path: "/",
    },
    {
      name: "THD_PERSIST",
      value: `C4%3D${region.hdStoreId}+%2B+${region.zip}`,
      domain: ".homedepot.com",
      path: "/",
    },
    {
      name: "THD_FORCE_LOC",
      value: `${region.hdStoreId}`,
      domain: ".homedepot.com",
      path: "/",
    },
  ]);

  const page = await context.newPage();

  // Intercept GraphQL requests and rewrite storeId + deliveryZip
  await page.route(
    (url: URL) =>
      url.href.includes("graphql") && url.href.includes("searchModel"),
    async (route) => {
      const request = route.request();
      if (request.method() === "POST") {
        try {
          const body = JSON.parse(request.postData() || "{}");
          body.variables = body.variables || {};
          body.variables.storeId = region.hdStoreId;
          body.variables.additionalSearchParams =
            body.variables.additionalSearchParams || {};
          body.variables.additionalSearchParams.deliveryZip = region.zip;
          await route.continue({ postData: JSON.stringify(body) });
        } catch {
          await route.continue();
        }
      } else {
        await route.continue();
      }
    }
  );

  try {
    // Visit store page to reinforce location
    console.log(`  Setting store: ${region.regionName} (${region.hdStoreId}, zip ${region.zip})`);
    try {
      await page.goto(
        `https://www.homedepot.com/l/store/${region.hdStoreId}`,
        { waitUntil: "domcontentloaded", timeout: 30000 }
      );
      await delay(2000, 3000);
    } catch {
      console.warn(`  Warning: store page failed, using cookies only`);
    }

    for (const cat of HD_CATEGORIES) {
      console.log(`  ${region.regionName} — ${cat.typeHint}`);

      for (let pageNum = 1; pageNum <= TEST_PAGES; pageNum++) {
        const pageUrl =
          pageNum === 1
            ? cat.url
            : `${cat.url}?Nao=${(pageNum - 1) * 24}`;

        const gqlPromise = page.waitForResponse(
          (r) =>
            r.url().includes("graphql") &&
            r.url().includes("searchModel") &&
            r.status() === 200,
          { timeout: 30000 }
        ).catch(() => null);

        await page.goto(pageUrl, {
          waitUntil: "domcontentloaded",
          timeout: 45000,
        });

        const resp = await gqlPromise;
        if (resp) {
          try {
            const json = await resp.json();
            const raw = json?.data?.searchModel?.products || [];
            for (const p of raw) {
              const title = p.identifiers?.productLabel || "";
              const sku = p.identifiers?.storeSkuNumber || p.identifiers?.itemId || p.itemId || "";
              let price = p.pricing?.alternate?.unit?.value ?? 0;
              if (price <= 0) {
                const carton = p.pricing?.value ?? 0;
                const units = p.pricing?.alternate?.unit?.unitsPerCase ?? 0;
                if (carton > 0 && units > 0) price = carton / units;
              }
              if (price > 0 && price <= 30) {
                const species = extractSpecies(title);
                if (species) {
                  products.push({
                    sku,
                    species,
                    type: detectType(title, cat.typeHint),
                    price: Math.round(price * 100) / 100,
                    title: title.substring(0, 60),
                  });
                }
              }
            }
            console.log(`    Page ${pageNum}: ${raw.length} raw → ${products.length} total parsed`);
          } catch {}
        } else {
          console.log(`    Page ${pageNum}: no GraphQL response`);
        }

        await delay(3000, 5000);
      }

      await delay(4000, 6000);
    }
  } finally {
    await page.close();
    await context.close();
  }

  return products;
}

async function main() {
  const browser = await firefox.launch({ headless: true });

  // 3 diverse regions
  const testRegions = [
    REGION_STORES[0],  // Northeast — Boston, MA
    REGION_STORES[6],  // Gulf Coast — Houston, TX
    REGION_STORES[10], // Pacific Northwest — Seattle, WA
  ];

  const results: { name: string; products: SimpleProduct[] }[] = [];

  try {
    for (const region of testRegions) {
      console.log(`\n${"=".repeat(50)}`);
      console.log(`  ${region.regionName} (store ${region.hdStoreId}, zip ${region.zip})`);
      console.log("=".repeat(50));

      const products = await scrapeRegionQuick(browser, region);
      results.push({ name: region.regionName, products });

      console.log(`  → ${products.length} products scraped`);
      if (products.length > 0) {
        const prices = products.map((p) => p.price);
        console.log(`  → Price range: $${Math.min(...prices).toFixed(2)} — $${Math.max(...prices).toFixed(2)}`);
        console.log(`  → Avg: $${(prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2)}`);
      }

      // Delay between regions
      await delay(8000, 12000);
    }
  } finally {
    await browser.close();
  }

  // ── Price Comparison ──────────────────────────────────────────
  console.log(`\n${"=".repeat(60)}`);
  console.log("  REGIONAL PRICE COMPARISON");
  console.log("=".repeat(60));

  const skuPrices = new Map<string, Map<string, number>>();
  for (const { name, products } of results) {
    for (const p of products) {
      if (!skuPrices.has(p.sku)) skuPrices.set(p.sku, new Map());
      skuPrices.get(p.sku)!.set(name, p.price);
    }
  }

  const shared = Array.from(skuPrices.entries())
    .filter(([, prices]) => prices.size === testRegions.length);

  console.log(`\nProducts found in all ${testRegions.length} regions: ${shared.length}`);

  let diffCount = 0;
  for (const [sku, prices] of shared.slice(0, 20)) {
    const vals = Array.from(prices.values());
    const allSame = vals.every((v) => v === vals[0]);
    if (!allSame) diffCount++;

    const priceStr = Array.from(prices.entries())
      .map(([r, p]) => `${r}: $${p.toFixed(2)}`)
      .join(" | ");
    console.log(`  ${sku}: ${priceStr}${allSame ? " (SAME)" : " (DIFF)"}`);
  }

  const totalDiff = shared.filter(([, prices]) => {
    const vals = Array.from(prices.values());
    return !vals.every((v) => v === vals[0]);
  }).length;

  console.log(`\n  RESULT: ${totalDiff}/${shared.length} shared SKUs have DIFFERENT prices`);
  if (totalDiff > 0) {
    console.log("  ✓ Regional pricing IS working");
  } else {
    console.log("  ✗ WARNING: Prices are identical — regional pricing NOT working");
  }

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
