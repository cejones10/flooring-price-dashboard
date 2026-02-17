import { getDb } from "./db";
import { Indicator, Observation } from "@/types/economic";
import { FRED_SERIES } from "./constants";

const FRED_BASE_URL = "https://api.stlouisfed.org/fred/series/observations";
const CACHE_HOURS = 6;

interface FredObservation {
  date: string;
  value: string;
}

interface FredResponse {
  observations: FredObservation[];
}

async function fetchFromFred(
  seriesId: string
): Promise<Observation[]> {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey || apiKey === "your_fred_api_key_here") {
    return [];
  }

  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

  const params = new URLSearchParams({
    series_id: seriesId,
    api_key: apiKey,
    file_type: "json",
    observation_start: twoYearsAgo.toISOString().split("T")[0],
    sort_order: "asc",
  });

  const res = await fetch(`${FRED_BASE_URL}?${params}`);
  if (!res.ok) return [];

  const data: FredResponse = await res.json();
  return data.observations
    .filter((o) => o.value !== ".")
    .map((o) => ({ date: o.date, value: parseFloat(o.value) }));
}

function getCachedObservations(seriesId: string, ignoreExpiry = false): Observation[] | null {
  const db = getDb();

  if (ignoreExpiry) {
    const rows = db
      .prepare(
        `SELECT observation_date as date, value FROM economic_cache
         WHERE series_id = ?
         ORDER BY observation_date ASC`
      )
      .all(seriesId) as Observation[];
    return rows.length > 0 ? rows : null;
  }

  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - CACHE_HOURS);

  const rows = db
    .prepare(
      `SELECT observation_date as date, value FROM economic_cache
       WHERE series_id = ? AND fetched_at > ?
       ORDER BY observation_date ASC`
    )
    .all(seriesId, cutoff.toISOString()) as Observation[];

  return rows.length > 0 ? rows : null;
}

function cacheObservations(seriesId: string, observations: Observation[]) {
  const db = getDb();
  const insert = db.prepare(
    `INSERT OR REPLACE INTO economic_cache (series_id, observation_date, value, fetched_at)
     VALUES (?, ?, ?, datetime('now'))`
  );
  const tx = db.transaction(() => {
    for (const obs of observations) {
      insert.run(seriesId, obs.date, obs.value);
    }
  });
  tx();
}

export async function getIndicator(seriesId: string): Promise<Indicator> {
  const seriesInfo = FRED_SERIES.find((s) => s.id === seriesId);
  const title = seriesInfo?.title ?? seriesId;
  const units = seriesInfo?.units ?? "";

  const apiKey = process.env.FRED_API_KEY;
  const hasApiKey = apiKey && apiKey !== "your_fred_api_key_here";

  // Try fresh cache first, then fetch, then fall back to any cached data (seed data)
  let observations = getCachedObservations(seriesId);
  if (!observations && hasApiKey) {
    observations = await fetchFromFred(seriesId);
    if (observations.length > 0) {
      cacheObservations(seriesId, observations);
    }
  }
  if (!observations) {
    observations = getCachedObservations(seriesId, true) ?? [];
  }

  const latest = observations.length > 0 ? observations[observations.length - 1] : null;
  const prev = observations.length > 1 ? observations[observations.length - 2] : null;

  return {
    series_id: seriesId,
    title,
    value: latest?.value ?? null,
    previous_value: prev?.value ?? null,
    delta: latest && prev ? Math.round((latest.value - prev.value) * 100) / 100 : null,
    delta_pct:
      latest && prev && prev.value !== 0
        ? Math.round(((latest.value - prev.value) / prev.value) * 10000) / 100
        : null,
    units,
    observations: observations.slice(-24),
  };
}

export async function getAllIndicators(): Promise<Indicator[]> {
  const indicators = await Promise.all(
    FRED_SERIES.map((s) => getIndicator(s.id))
  );
  return indicators;
}
