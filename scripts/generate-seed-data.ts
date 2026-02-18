import { createClient } from "@libsql/client/http";
import * as dotenv from "dotenv";
import path from "path";

// Load .env.local
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const SPECIES = [
  { name: "Red Oak", janka: 1290 },
  { name: "White Oak", janka: 1360 },
  { name: "Hickory", janka: 1820 },
  { name: "Maple", janka: 1450 },
  { name: "Walnut", janka: 1010 },
  { name: "Cherry", janka: 950 },
  { name: "Ash", janka: 1320 },
  { name: "Brazilian Cherry", janka: 2350 },
];

const GRADES = ["Select", "Character", "#1 Common", "#2 Common", "Rustic"];
const FINISHES_PREFINISHED = [
  "UV Urethane",
  "Oil-Based Poly",
  "Aluminum Oxide",
  "Wire-Brushed",
  "Hand-Scraped",
];
const RETAILERS = [
  "Home Depot",
  "Lowe's",
  "Floor & Decor",
  "LL Flooring",
  "BuildDirect",
  "ProSource Wholesale",
  "Wayfair",
  "Empire Today",
  "National Floors Direct",
  "Flooring America",
  "The Floor Trader",
  "Carpet One",
];
const BRANDS: Record<string, string[]> = {
  "Home Depot": ["Bruce", "Mohawk", "TrafficMaster", "Home Decorators"],
  "Lowe's": ["SMARTCORE", "Pergo", "Shaw", "Style Selections"],
  "Floor & Decor": ["AquaGuard", "Avella", "NuCore", "Virginia Mill Works"],
  "LL Flooring": ["Bellawood", "ReNature", "Dream Home", "Hydroscapes"],
  BuildDirect: ["Jasper", "Tungston", "Vanier"],
  "ProSource Wholesale": ["Somerset", "Mannington", "Armstrong", "IndusParquet"],
  Wayfair: ["Foundry Select", "Wade Logan", "Mercury Row", "Joss & Main"],
  "Empire Today": ["Empire", "Empire Premium", "Empire Select"],
  "National Floors Direct": ["NFD Select", "NFD Premium", "Shaw"],
  "Flooring America": ["Aquadura", "PurParquet", "Downs", "Tigerwood"],
  "The Floor Trader": ["Regal Hardwoods", "Johnson Premium", "Ark Floors"],
  "Carpet One": ["Invincible", "Bigelow", "Lees", "Innovia"],
};

const REGIONS = [
  "northeast", "north-atlantic", "atlantic-coast", "southeast",
  "south-florida", "north-florida", "gulf-coast", "interior-texas",
  "midwest", "mountain-west", "pacific-northwest", "southern-california",
  "great-plains",
];

const REGION_MULTIPLIERS: Record<string, number> = {
  northeast: 1.12, "north-atlantic": 1.1, "atlantic-coast": 1.05,
  southeast: 0.95, "south-florida": 1.15, "north-florida": 0.93,
  "gulf-coast": 0.92, "interior-texas": 0.9, midwest: 0.9,
  "mountain-west": 1.02, "pacific-northwest": 1.08,
  "southern-california": 1.18, "great-plains": 0.88,
};

const WIDTHS_SOLID = [2.25, 3.25, 4, 5];
const WIDTHS_ENGINEERED = [5, 6, 7, 8];
const THICKNESSES_SOLID = [0.375, 0.5, 0.75];
const THICKNESSES_ENGINEERED = [0.375, 0.5, 0.625];
const LENGTHS = [12, 24, 36, 48, 72, 84];

function rand(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function pick<T>(arr: readonly T[] | T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function calcBasePrice(
  type: string,
  species: (typeof SPECIES)[number],
  grade: string,
  width: number
): number {
  let base: number;
  if (type === "solid") base = rand(3.5, 10);
  else if (type === "engineered") base = rand(3, 11);
  else base = rand(3, 7);

  if (species.janka > 1500) base *= rand(1.1, 1.35);
  if (species.name === "Walnut") base *= rand(1.15, 1.4);
  if (species.name === "Brazilian Cherry") base *= rand(1.2, 1.5);
  if (grade === "Select") base *= rand(1.1, 1.25);
  if (grade === "Rustic") base *= rand(0.8, 0.95);
  if (width >= 6) base *= rand(1.05, 1.2);
  if (width >= 8) base *= rand(1.05, 1.15);

  return base;
}

interface ProductRow {
  region_id: string;
  type: string;
  species: string;
  width: number;
  thickness: number;
  veneer_thickness: number | null;
  finish: string;
  grade: string;
  janka_hardness: number;
  length: number;
  price_per_sqft: number;
  retailer: string;
  brand: string;
  url: string;
  last_updated: string;
}

function generateProducts(): ProductRow[] {
  const products: ProductRow[] = [];
  const targetPerRegion = 200;

  for (const regionId of REGIONS) {
    const multiplier = REGION_MULTIPLIERS[regionId];
    for (let i = 0; i < targetPerRegion; i++) {
      const typeRoll = Math.random();
      const type = typeRoll < 0.4 ? "solid" : typeRoll < 0.8 ? "engineered" : "unfinished";
      const species = pick(SPECIES);
      const grade = pick(GRADES);
      const retailer = pick(RETAILERS);
      const brand = pick(BRANDS[retailer]);
      const width = type === "engineered" ? pick(WIDTHS_ENGINEERED) : pick(WIDTHS_SOLID);
      const thickness = type === "engineered" ? pick(THICKNESSES_ENGINEERED) : pick(THICKNESSES_SOLID);
      const veneerThickness = type === "engineered" ? pick([0.6, 1, 2, 3, 4]) : null;
      const finish = type === "unfinished" ? "Unfinished" : pick(FINISHES_PREFINISHED);
      const length = pick(LENGTHS);
      const price = Math.round(calcBasePrice(type, species, grade, width) * multiplier * 100) / 100;
      const daysAgo = Math.floor(Math.random() * 30);
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);

      products.push({
        region_id: regionId, type, species: species.name, width, thickness,
        veneer_thickness: veneerThickness, finish, grade,
        janka_hardness: species.janka, length, price_per_sqft: price,
        retailer, brand, url: "", last_updated: date.toISOString().split("T")[0],
      });
    }
  }
  return products;
}

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    console.error("TURSO_DATABASE_URL not set in .env.local");
    process.exit(1);
  }

  console.log(`Connecting to Turso: ${url}`);
  const db = createClient({ url, authToken });

  // Drop and recreate tables
  console.log("Creating tables...");
  await db.batch([
    { sql: "DROP TABLE IF EXISTS products", args: [] },
    { sql: "DROP TABLE IF EXISTS economic_cache", args: [] },
    {
      sql: `CREATE TABLE products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        region_id TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('solid', 'engineered', 'unfinished')),
        species TEXT NOT NULL,
        width REAL NOT NULL,
        thickness REAL NOT NULL,
        veneer_thickness REAL,
        finish TEXT NOT NULL,
        grade TEXT NOT NULL,
        janka_hardness INTEGER NOT NULL,
        length REAL NOT NULL,
        price_per_sqft REAL NOT NULL,
        retailer TEXT NOT NULL,
        brand TEXT NOT NULL,
        url TEXT NOT NULL DEFAULT '',
        last_updated TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      args: [],
    },
    { sql: "CREATE INDEX idx_products_region ON products(region_id)", args: [] },
    { sql: "CREATE INDEX idx_products_type ON products(type)", args: [] },
    { sql: "CREATE INDEX idx_products_species ON products(species)", args: [] },
    { sql: "CREATE INDEX idx_products_retailer ON products(retailer)", args: [] },
    { sql: "CREATE INDEX idx_products_price ON products(price_per_sqft)", args: [] },
    {
      sql: `CREATE TABLE economic_cache (
        series_id TEXT NOT NULL,
        observation_date TEXT NOT NULL,
        value REAL NOT NULL,
        fetched_at TEXT NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (series_id, observation_date)
      )`,
      args: [],
    },
    { sql: "CREATE INDEX idx_economic_series ON economic_cache(series_id)", args: [] },
  ]);

  // Generate and insert products in batches (Turso batch limit)
  console.log("Generating products...");
  const products = generateProducts();

  const BATCH_SIZE = 100;
  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE);
    await db.batch(
      batch.map((p) => ({
        sql: `INSERT INTO products (region_id, type, species, width, thickness, veneer_thickness, finish, grade, janka_hardness, length, price_per_sqft, retailer, brand, url, last_updated)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          p.region_id, p.type, p.species, p.width, p.thickness,
          p.veneer_thickness, p.finish, p.grade, p.janka_hardness,
          p.length, p.price_per_sqft, p.retailer, p.brand, p.url,
          p.last_updated,
        ],
      }))
    );
    console.log(`  Inserted ${Math.min(i + BATCH_SIZE, products.length)}/${products.length} products`);
  }

  // Generate economic seed data
  console.log("Generating economic data...");
  const ECONOMIC_SERIES = [
    { id: "MORTGAGE30US", base: 6.8, volatility: 0.15, trend: -0.02 },
    { id: "HOUST1F", base: 950, volatility: 30, trend: 5 },
    { id: "PERMIT1", base: 1450, volatility: 40, trend: 3 },
    { id: "CSUSHPISA", base: 310, volatility: 2, trend: 1.2 },
    { id: "TLRESCONS", base: 650000, volatility: 8000, trend: 2000 },
    { id: "WPU08", base: 280, volatility: 3, trend: 0.5 },
    { id: "UMCSENT", base: 67, volatility: 2.5, trend: 0.3 },
    { id: "HSN1F", base: 660, volatility: 20, trend: 2 },
  ];

  const econStatements: Array<{ sql: string; args: (string | number)[] }> = [];
  for (const series of ECONOMIC_SERIES) {
    let value = series.base;
    for (let monthsAgo = 23; monthsAgo >= 0; monthsAgo--) {
      const date = new Date();
      date.setMonth(date.getMonth() - monthsAgo);
      const dateStr = date.toISOString().split("T")[0];
      value += series.trend + (Math.random() - 0.5) * 2 * series.volatility;
      value = Math.max(value, series.base * 0.7);
      value = Math.min(value, series.base * 1.4);
      econStatements.push({
        sql: `INSERT INTO economic_cache (series_id, observation_date, value, fetched_at) VALUES (?, ?, ?, datetime('now'))`,
        args: [series.id, dateStr, Math.round(value * 100) / 100],
      });
    }
  }

  await db.batch(econStatements);
  console.log(`Generated ${ECONOMIC_SERIES.length} economic series (24 months each)`);

  // Print summary
  const summary = await db.execute({
    sql: `SELECT region_id, COUNT(*) as count, ROUND(AVG(price_per_sqft), 2) as avg_price,
          ROUND(MIN(price_per_sqft), 2) as min_price, ROUND(MAX(price_per_sqft), 2) as max_price
          FROM products GROUP BY region_id ORDER BY region_id`,
    args: [],
  });

  console.log("\nRegion Summary:");
  console.log("─".repeat(70));
  for (const row of summary.rows) {
    const rid = (row.region_id as string).padEnd(22);
    const cnt = String(row.count).padStart(4);
    const min = (row.min_price as number).toFixed(2);
    const max = (row.max_price as number).toFixed(2);
    const avg = (row.avg_price as number).toFixed(2);
    console.log(`  ${rid} | ${cnt} products | $${min} - $${max} | avg $${avg}`);
  }

  console.log(`\nDone! ${products.length} products seeded to Turso.`);
  db.close();
}

main().catch(console.error);
