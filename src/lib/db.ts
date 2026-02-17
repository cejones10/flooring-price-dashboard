import Database from "better-sqlite3";
import path from "path";

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  const dbPath = path.join(process.cwd(), "data", "flooring.db");
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  initTables(db);
  return db;
}

function initTables(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
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
    );

    CREATE INDEX IF NOT EXISTS idx_products_region ON products(region_id);
    CREATE INDEX IF NOT EXISTS idx_products_type ON products(type);
    CREATE INDEX IF NOT EXISTS idx_products_species ON products(species);
    CREATE INDEX IF NOT EXISTS idx_products_retailer ON products(retailer);
    CREATE INDEX IF NOT EXISTS idx_products_price ON products(price_per_sqft);

    CREATE TABLE IF NOT EXISTS economic_cache (
      series_id TEXT NOT NULL,
      observation_date TEXT NOT NULL,
      value REAL NOT NULL,
      fetched_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (series_id, observation_date)
    );

    CREATE INDEX IF NOT EXISTS idx_economic_series ON economic_cache(series_id);
  `);
}
