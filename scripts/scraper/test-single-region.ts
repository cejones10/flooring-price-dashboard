import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { HomeDepotScraper } from "./homedepot";
import { REGION_STORES } from "./region-stores";
import type { ScrapedProduct } from "./base-scraper";

async function main() {
  const hdScraper = new HomeDepotScraper();

  // Pick 3 geographically diverse regions to test regional pricing
  const testRegions = [
    REGION_STORES[0],  // Northeast — Boston, MA
    REGION_STORES[6],  // Gulf Coast — Houston, TX
    REGION_STORES[10], // Pacific Northwest — Seattle, WA
  ];

  const regionResults: { name: string; products: ScrapedProduct[] }[] = [];

  for (const region of testRegions) {
    console.log(`\n${"=".repeat(50)}`);
    console.log(`Testing HD scraper for ${region.regionName} (store ${region.hdStoreId}, zip ${region.zip})...`);
    console.log("=".repeat(50));

    const products = await hdScraper.scrapeRegion(region);
    regionResults.push({ name: region.regionName, products });

    console.log(`\n${region.regionName}: ${products.length} products`);
    for (const p of products.slice(0, 3)) {
      console.log(
        `  ${p.brand} ${p.species} ${p.type} ${p.thickness}"x${p.width}" — $${p.price_per_sqft}/sqft`
      );
    }

    if (products.length > 0) {
      const prices = products.map((p) => p.price_per_sqft);
      console.log(
        `  Price range: $${Math.min(...prices).toFixed(2)} — $${Math.max(...prices).toFixed(2)}`
      );
      console.log(
        `  Avg: $${(prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2)}`
      );
    }
  }

  // Compare prices across regions for the same products (by SKU)
  console.log(`\n${"=".repeat(60)}`);
  console.log("  REGIONAL PRICE COMPARISON");
  console.log("=".repeat(60));

  // Build SKU → {region → price} map
  const skuPrices = new Map<string, Map<string, number>>();
  for (const { name, products } of regionResults) {
    for (const p of products) {
      // Extract base SKU (strip region prefix)
      const baseSku = p.externalId.replace(/^homedepot:[^:]+:/, "");
      if (!skuPrices.has(baseSku)) skuPrices.set(baseSku, new Map());
      skuPrices.get(baseSku)!.set(name, p.price_per_sqft);
    }
  }

  // Find SKUs present in all 3 regions
  const sharedSkus = Array.from(skuPrices.entries())
    .filter(([, prices]) => prices.size === testRegions.length);

  console.log(`\nProducts found in all ${testRegions.length} regions: ${sharedSkus.length}`);

  let hasDifferences = false;
  let shownCount = 0;
  for (const [sku, prices] of sharedSkus) {
    const vals = Array.from(prices.values());
    const allSame = vals.every((v) => v === vals[0]);
    if (!allSame) hasDifferences = true;

    if (shownCount < 15) {
      const priceStr = Array.from(prices.entries())
        .map(([region, price]) => `${region}: $${price.toFixed(2)}`)
        .join(" | ");
      const tag = allSame ? " (SAME)" : " (DIFFERENT)";
      console.log(`  SKU ${sku}: ${priceStr}${tag}`);
      shownCount++;
    }
  }

  if (sharedSkus.length > 0) {
    const diffCount = sharedSkus.filter(([, prices]) => {
      const vals = Array.from(prices.values());
      return !vals.every((v) => v === vals[0]);
    }).length;

    console.log(`\n  Summary: ${diffCount}/${sharedSkus.length} shared products have DIFFERENT prices across regions`);
    if (hasDifferences) {
      console.log("  Regional pricing IS working!");
    } else {
      console.log("  WARNING: All shared products have IDENTICAL prices — regional pricing may NOT be working");
    }
  }

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
