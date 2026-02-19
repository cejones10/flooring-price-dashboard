import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
import { createClient } from "@libsql/client/http";
import { HomeDepotScraper } from "./homedepot";
import { LowesScraper } from "./lowes";
import type { ScrapedProduct } from "./base-scraper";
import { REGION_STORES } from "./region-stores";

// ── DB Setup ──────────────────────────────────────────────────────────────────

function getDb() {
  const rawUrl = process.env.TURSO_DATABASE_URL!.trim();
  const url = rawUrl.replace(/^libsql:\/\//, "https://");
  return createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
}

// ── Migration: add external_id column if missing ──────────────────────────────

async function migrateDb() {
  const db = getDb();

  // Add external_id column (safe to run multiple times — SQLite ignores if exists)
  try {
    await db.execute({
      sql: `ALTER TABLE products ADD COLUMN external_id TEXT`,
      args: [],
    });
    console.log("[DB] Added external_id column");
  } catch (err: unknown) {
    const msg = (err as Error).message || "";
    if (msg.includes("duplicate column") || msg.includes("already exists")) {
      // Column already exists — no-op
    } else {
      throw err;
    }
  }

  // Create unique index
  await db.execute({
    sql: `CREATE UNIQUE INDEX IF NOT EXISTS idx_products_external_id ON products(external_id) WHERE external_id IS NOT NULL`,
    args: [],
  });
  console.log("[DB] Migration complete");
}

// ── Upsert Logic ──────────────────────────────────────────────────────────────

const BATCH_SIZE = 50;

async function upsertProducts(
  regionId: string,
  products: ScrapedProduct[],
  retailer: string
) {
  const db = getDb();
  let upserted = 0;

  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE);

    const statements = batch.map((p) => ({
      sql: `INSERT INTO products (
        region_id, type, species, width, thickness, veneer_thickness,
        finish, grade, janka_hardness, length, price_per_sqft,
        retailer, brand, url, external_id, last_updated
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(external_id) DO UPDATE SET
        price_per_sqft = excluded.price_per_sqft,
        last_updated = datetime('now'),
        brand = excluded.brand,
        url = excluded.url,
        finish = excluded.finish,
        grade = excluded.grade`,
      args: [
        regionId,
        p.type,
        p.species,
        p.width,
        p.thickness,
        p.veneer_thickness,
        p.finish,
        p.grade,
        p.janka_hardness ?? 1000,
        p.length,
        p.price_per_sqft,
        retailer,
        p.brand,
        p.url,
        p.externalId,
      ],
    }));

    await db.batch(statements);
    upserted += batch.length;
  }

  return upserted;
}

// ── Stale Product Cleanup ─────────────────────────────────────────────────────

async function removeStaleProducts(maxAgeDays: number = 45) {
  const db = getDb();
  const result = await db.execute({
    sql: `DELETE FROM products
          WHERE external_id IS NOT NULL
            AND last_updated < datetime('now', ?)`,
    args: [`-${maxAgeDays} days`],
  });
  console.log(`[DB] Removed ${result.rowsAffected} stale products (>${maxAgeDays} days old)`);
}

// ── Health Validation ─────────────────────────────────────────────────────────

interface ValidationResult {
  passed: boolean;
  checks: { name: string; passed: boolean; detail: string }[];
}

async function validateHealth(): Promise<ValidationResult> {
  const db = getDb();
  const checks: { name: string; passed: boolean; detail: string }[] = [];
  const totalRegions = REGION_STORES.length;

  // Check 1: Regions with HD products
  const hdRegions = await db.execute({
    sql: `SELECT COUNT(DISTINCT region_id) as cnt FROM products
          WHERE retailer = 'Home Depot' AND external_id IS NOT NULL`,
    args: [],
  });
  const hdRegionCount = Number(hdRegions.rows[0]?.cnt ?? 0);
  const hdRegionThreshold = Math.ceil(totalRegions * 0.5);
  checks.push({
    name: "HD regions with products",
    passed: hdRegionCount >= hdRegionThreshold,
    detail: `${hdRegionCount}/${totalRegions} regions (need >= ${hdRegionThreshold})`,
  });

  // Check 2: Regions with Lowes products
  const lowesRegions = await db.execute({
    sql: `SELECT COUNT(DISTINCT region_id) as cnt FROM products
          WHERE retailer = 'Lowe''s' AND external_id IS NOT NULL`,
    args: [],
  });
  const lowesRegionCount = Number(lowesRegions.rows[0]?.cnt ?? 0);
  checks.push({
    name: "Lowes regions with products",
    passed: lowesRegionCount >= hdRegionThreshold,
    detail: `${lowesRegionCount}/${totalRegions} regions (need >= ${hdRegionThreshold})`,
  });

  // Check 3: Total HD products >= 100
  const hdTotal = await db.execute({
    sql: `SELECT COUNT(*) as cnt FROM products
          WHERE retailer = 'Home Depot' AND external_id IS NOT NULL`,
    args: [],
  });
  const hdTotalCount = Number(hdTotal.rows[0]?.cnt ?? 0);
  checks.push({
    name: "Total HD products",
    passed: hdTotalCount >= 100,
    detail: `${hdTotalCount} products (need >= 100)`,
  });

  // Check 4: Price sanity — all prices $1-$30/sqft
  const priceSanity = await db.execute({
    sql: `SELECT COUNT(*) as cnt FROM products
          WHERE external_id IS NOT NULL
            AND (price_per_sqft < 1 OR price_per_sqft > 30)`,
    args: [],
  });
  const badPrices = Number(priceSanity.rows[0]?.cnt ?? 0);
  checks.push({
    name: "Price sanity ($1-$30/sqft)",
    passed: badPrices === 0,
    detail: `${badPrices} products outside range`,
  });

  // Check 5: Database total (HD + Lowes) >= 500
  const dbTotal = await db.execute({
    sql: `SELECT COUNT(*) as cnt FROM products
          WHERE external_id IS NOT NULL
            AND retailer IN ('Home Depot', 'Lowe''s')`,
    args: [],
  });
  const dbTotalCount = Number(dbTotal.rows[0]?.cnt ?? 0);
  checks.push({
    name: "Total scraped products (HD + Lowes)",
    passed: dbTotalCount >= 500,
    detail: `${dbTotalCount} products (need >= 500)`,
  });

  const allPassed = checks.every((c) => c.passed);
  return { passed: allPassed, checks };
}

// ── Recently Scraped Regions ─────────────────────────────────────────────────

async function getRecentlyScrapedRegions(
  retailer: string,
  withinHours: number = 12
): Promise<Set<string>> {
  const db = getDb();

  // Debug: check what timestamps look like in the DB
  const debug = await db.execute({
    sql: `SELECT region_id, MAX(last_updated) as latest, COUNT(*) as cnt
          FROM products
          WHERE retailer = ? AND external_id IS NOT NULL
          GROUP BY region_id
          ORDER BY latest DESC
          LIMIT 5`,
    args: [retailer],
  });
  console.log(`[Skip] DB timestamps for ${retailer} (UTC now = ${new Date().toISOString()}):`);
  for (const row of debug.rows) {
    console.log(`  ${row.region_id}: ${row.latest} (${row.cnt} products)`);
  }

  const result = await db.execute({
    sql: `SELECT DISTINCT region_id FROM products
          WHERE retailer = ? AND external_id IS NOT NULL
            AND last_updated > datetime('now', ?)`,
    args: [retailer, `-${withinHours} hours`],
  });
  const regions = new Set<string>();
  for (const row of result.rows) {
    regions.add(row.region_id as string);
  }
  return regions;
}

// ── Pre-flight Check ─────────────────────────────────────────────────────────

async function preflightCheck(): Promise<boolean> {
  const { firefox } = await import("playwright");
  console.log("[Preflight] Checking HD connectivity...");
  const browser = await firefox.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const resp = await page.goto("https://www.homedepot.com", {
      waitUntil: "load",
      timeout: 45000,
    });
    const status = resp?.status() ?? 0;

    // HD is a SPA — title may not be set until JS runs. Wait briefly for it.
    let title = await page.title();
    if (!title) {
      await page.waitForTimeout(5000);
      title = await page.title();
    }

    // Also check page body for block indicators
    const bodySnippet = await page
      .evaluate(() => document.body?.innerText?.substring(0, 500) || "")
      .catch(() => "");
    await page.close();

    const isBlocked =
      status === 403 ||
      title === "Error Page" ||
      bodySnippet.includes("Access Denied") ||
      bodySnippet.includes("Something went wrong");

    if (isBlocked) {
      console.error(
        `[Preflight] HD is blocking us (status ${status}, title "${title}").`
      );
      console.error(
        "[Preflight] Wait 30-60 minutes for the rate limit to clear, then try again."
      );
      return false;
    }
    console.log(`[Preflight] HD OK (status ${status}, title "${title}")`);
    return true;
  } finally {
    await browser.close();
  }
}

// ── Main Orchestrator ─────────────────────────────────────────────────────────

const TEST_MODE = process.argv.includes("--test");

async function main() {
  console.log("=".repeat(60));
  console.log(`  Scraper Orchestrator — ${TEST_MODE ? "TEST MODE (1 region)" : "Starting"}`);
  console.log("=".repeat(60));
  const startTime = Date.now();

  // Pre-flight: make sure we're not blocked before starting a long run
  const canProceed = await preflightCheck();
  if (!canProceed) {
    process.exit(2); // Exit 2 = blocked, not a code error
  }

  // Run migration
  await migrateDb();

  // Track per-retailer stats
  let hdTotal = 0;
  let lowesTotal = 0;

  // ── Home Depot ──────────────────────────────────────────────
  console.log("\n" + "─".repeat(60));
  console.log("  HOME DEPOT — GraphQL API Scraper");
  console.log("─".repeat(60));

  const hdSkip = await getRecentlyScrapedRegions("Home Depot", 12);
  if (hdSkip.size > 0) {
    console.log(`  Skipping ${hdSkip.size} HD regions with recent data: ${[...hdSkip].join(", ")}`);
  }

  // In test mode, only scrape regions not already skipped, limit to 1
  const maxRegions = TEST_MODE ? 1 : undefined;

  try {
    const hdScraper = new HomeDepotScraper();
    await hdScraper.scrapeAllRegions(hdSkip, async (regionId, products) => {
      const count = await upsertProducts(regionId, products, "Home Depot");
      hdTotal += count;
      console.log(`  [DB] Upserted ${count} HD products for ${regionId}`);
    }, maxRegions);
    console.log(`\n[HD] Total upserted: ${hdTotal}`);
  } catch (err) {
    console.error("[HD] Scraper failed:", err);
  }

  // Pause between retailers to avoid cross-site fingerprint correlation
  console.log("\n  Pausing 30s between retailers...");
  await new Promise((r) => setTimeout(r, 30000));

  // ── Lowe's ──────────────────────────────────────────────────
  console.log("\n" + "─".repeat(60));
  console.log("  LOWE'S — Playwright Browser Scraper");
  console.log("─".repeat(60));

  const lowesSkip = await getRecentlyScrapedRegions("Lowe's", 12);
  if (lowesSkip.size > 0) {
    console.log(`  Skipping ${lowesSkip.size} Lowes regions with recent data: ${[...lowesSkip].join(", ")}`);
  }

  try {
    const lowesScraper = new LowesScraper();
    await lowesScraper.scrapeAllRegions(lowesSkip, async (regionId, products) => {
      const count = await upsertProducts(regionId, products, "Lowe's");
      lowesTotal += count;
      console.log(`  [DB] Upserted ${count} Lowes products for ${regionId}`);
    }, maxRegions);
    console.log(`\n[Lowes] Total upserted: ${lowesTotal}`);
  } catch (err) {
    console.error("[Lowes] Scraper failed:", err);
  }

  // ── Cleanup stale products ──────────────────────────────────
  console.log("\n" + "─".repeat(60));
  console.log("  CLEANUP");
  console.log("─".repeat(60));
  await removeStaleProducts(45);

  // ── Health Validation ───────────────────────────────────────
  if (!TEST_MODE) {
    console.log("\n" + "─".repeat(60));
    console.log("  HEALTH VALIDATION");
    console.log("─".repeat(60));

    const health = await validateHealth();
    for (const check of health.checks) {
      const icon = check.passed ? "PASS" : "FAIL";
      console.log(`  [${icon}] ${check.name}: ${check.detail}`);
    }

    if (!health.passed) {
      console.error("\nHealth validation FAILED — exiting with code 1");
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log("\n" + "=".repeat(60));
  console.log(`  Complete — HD: ${hdTotal}, Lowes: ${lowesTotal} — ${elapsed} min`);
  console.log("=".repeat(60));
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
