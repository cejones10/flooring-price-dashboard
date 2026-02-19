import { createClient, type Client } from "@libsql/client/http";

let client: Client | null = null;

export function getDb(): Client {
  if (client) return client;

  const rawUrl = process.env.TURSO_DATABASE_URL!.trim();
  const url = rawUrl.replace(/^libsql:\/\//, "https://");

  client = createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN?.trim(),
  });

  return client;
}

export async function initTables(): Promise<void> {
  const db = getDb();

  await db.batch([
    {
      sql: `CREATE TABLE IF NOT EXISTS products (
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
        external_id TEXT,
        last_updated TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      args: [],
    },
    {
      sql: `CREATE INDEX IF NOT EXISTS idx_products_region ON products(region_id)`,
      args: [],
    },
    {
      sql: `CREATE INDEX IF NOT EXISTS idx_products_type ON products(type)`,
      args: [],
    },
    {
      sql: `CREATE INDEX IF NOT EXISTS idx_products_species ON products(species)`,
      args: [],
    },
    {
      sql: `CREATE INDEX IF NOT EXISTS idx_products_retailer ON products(retailer)`,
      args: [],
    },
    {
      sql: `CREATE INDEX IF NOT EXISTS idx_products_price ON products(price_per_sqft)`,
      args: [],
    },
    {
      sql: `CREATE UNIQUE INDEX IF NOT EXISTS idx_products_external_id ON products(external_id) WHERE external_id IS NOT NULL`,
      args: [],
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS economic_cache (
        series_id TEXT NOT NULL,
        observation_date TEXT NOT NULL,
        value REAL NOT NULL,
        fetched_at TEXT NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (series_id, observation_date)
      )`,
      args: [],
    },
    {
      sql: `CREATE INDEX IF NOT EXISTS idx_economic_series ON economic_cache(series_id)`,
      args: [],
    },
  ]);
}
