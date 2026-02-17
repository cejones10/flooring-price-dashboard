import Database from "better-sqlite3";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

const DB_PATH = join(process.cwd(), "data", "flooring.db");
const OUT_DIR = join(process.cwd(), "public", "data");

interface Product {
  id: number;
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

interface RegionStat {
  region_id: string;
  product_count: number;
  avg_price: number;
  price_min: number;
  price_max: number;
}

interface EconRow {
  date: string;
  value: number;
}

const FRED_SERIES = [
  { id: "MORTGAGE30US", title: "30-Year Mortgage Rate", units: "%" },
  { id: "HOUST1F", title: "Single-Family Housing Starts", units: "Thousands" },
  { id: "PERMIT1", title: "Building Permits", units: "Thousands" },
  { id: "CSUSHPISA", title: "Case-Shiller Home Price Index", units: "Index" },
  { id: "TLRESCONS", title: "Residential Construction Spending", units: "$M" },
  { id: "WPU08", title: "PPI: Lumber & Wood Products", units: "Index" },
  { id: "UMCSENT", title: "Consumer Sentiment", units: "Index" },
  { id: "HSN1F", title: "New Home Sales", units: "Thousands" },
];

const REGIONS = [
  { id: "northeast", name: "Northeast" },
  { id: "north-atlantic", name: "North Atlantic" },
  { id: "atlantic-coast", name: "Atlantic Coast" },
  { id: "southeast", name: "Southeast" },
  { id: "south-florida", name: "South Florida" },
  { id: "north-florida", name: "North Florida" },
  { id: "gulf-coast", name: "Gulf Coast" },
  { id: "interior-texas", name: "Interior Texas" },
  { id: "midwest", name: "Midwest" },
  { id: "mountain-west", name: "Mountain West" },
  { id: "pacific-northwest", name: "Pacific Northwest" },
  { id: "southern-california", name: "Southern California" },
  { id: "great-plains", name: "Great Plains" },
];

function main() {
  if (!existsSync(DB_PATH)) {
    console.error("Database not found at", DB_PATH);
    console.error("Run `npm run seed` first.");
    process.exit(1);
  }

  const db = new Database(DB_PATH, { readonly: true });

  // Ensure output dirs exist
  mkdirSync(OUT_DIR, { recursive: true });
  mkdirSync(join(OUT_DIR, "products"), { recursive: true });

  // 1. Export regions summary
  const stats = db
    .prepare(
      `SELECT region_id,
              COUNT(*) as product_count,
              ROUND(AVG(price_per_sqft), 2) as avg_price,
              ROUND(MIN(price_per_sqft), 2) as price_min,
              ROUND(MAX(price_per_sqft), 2) as price_max
       FROM products
       GROUP BY region_id`
    )
    .all() as RegionStat[];

  const statsMap = new Map(stats.map((s) => [s.region_id, s]));

  const regionsSummary = REGIONS.map((r) => {
    const s = statsMap.get(r.id);
    return {
      id: r.id,
      name: r.name,
      avg_price: s?.avg_price ?? 0,
      product_count: s?.product_count ?? 0,
      price_min: s?.price_min ?? 0,
      price_max: s?.price_max ?? 0,
    };
  });

  writeFileSync(
    join(OUT_DIR, "regions.json"),
    JSON.stringify(regionsSummary, null, 2)
  );
  console.log(`Exported ${regionsSummary.length} regions to regions.json`);

  // 2. Export products per region
  for (const region of REGIONS) {
    const products = db
      .prepare(
        `SELECT * FROM products WHERE region_id = ? ORDER BY price_per_sqft ASC`
      )
      .all(region.id) as Product[];

    writeFileSync(
      join(OUT_DIR, "products", `${region.id}.json`),
      JSON.stringify(products, null, 2)
    );
    console.log(
      `Exported ${products.length} products for ${region.name}`
    );
  }

  // 3. Export economic indicators
  const indicators = FRED_SERIES.map((series) => {
    const observations = db
      .prepare(
        `SELECT observation_date as date, value FROM economic_cache
         WHERE series_id = ?
         ORDER BY observation_date ASC`
      )
      .all(series.id) as EconRow[];

    const sliced = observations.slice(-24);
    const latest = sliced.length > 0 ? sliced[sliced.length - 1] : null;
    const prev = sliced.length > 1 ? sliced[sliced.length - 2] : null;

    return {
      series_id: series.id,
      title: series.title,
      value: latest?.value ?? null,
      previous_value: prev?.value ?? null,
      delta:
        latest && prev
          ? Math.round((latest.value - prev.value) * 100) / 100
          : null,
      delta_pct:
        latest && prev && prev.value !== 0
          ? Math.round(
              ((latest.value - prev.value) / prev.value) * 10000
            ) / 100
          : null,
      units: series.units,
      observations: sliced,
    };
  });

  writeFileSync(
    join(OUT_DIR, "economic.json"),
    JSON.stringify(indicators, null, 2)
  );
  console.log(`Exported ${indicators.length} economic indicators`);

  db.close();
  console.log("\nStatic data export complete!");
}

main();
