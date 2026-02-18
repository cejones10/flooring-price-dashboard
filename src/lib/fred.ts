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

async function fetchFromFred(seriesId: string): Promise<Observation[]> {
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

  const url = `${FRED_BASE_URL}?${params}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(
      `[FRED] Fetch failed for ${seriesId}: HTTP ${res.status} ${res.statusText}`
    );
    return [];
  }

  const data: FredResponse = await res.json();
  return data.observations
    .filter((o) => o.value !== ".")
    .map((o) => ({ date: o.date, value: parseFloat(o.value) }));
}

async function getCachedObservations(
  seriesId: string,
  ignoreExpiry = false
): Promise<Observation[] | null> {
  const db = getDb();

  if (ignoreExpiry) {
    const result = await db.execute({
      sql: `SELECT observation_date as date, value FROM economic_cache
            WHERE series_id = ?
            ORDER BY observation_date ASC`,
      args: [seriesId],
    });
    const rows = result.rows.map((r) => ({
      date: r.date as string,
      value: r.value as number,
    }));
    return rows.length > 0 ? rows : null;
  }

  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - CACHE_HOURS);

  const result = await db.execute({
    sql: `SELECT observation_date as date, value FROM economic_cache
          WHERE series_id = ? AND fetched_at > ?
          ORDER BY observation_date ASC`,
    args: [seriesId, cutoff.toISOString()],
  });
  const rows = result.rows.map((r) => ({
    date: r.date as string,
    value: r.value as number,
  }));
  return rows.length > 0 ? rows : null;
}

async function cacheObservations(
  seriesId: string,
  observations: Observation[]
): Promise<void> {
  const db = getDb();
  const statements = observations.map((obs) => ({
    sql: `INSERT OR REPLACE INTO economic_cache (series_id, observation_date, value, fetched_at)
          VALUES (?, ?, ?, datetime('now'))`,
    args: [seriesId, obs.date, obs.value],
  }));

  if (statements.length > 0) {
    await db.batch(statements);
  }
}

export async function getIndicator(seriesId: string): Promise<Indicator> {
  const seriesInfo = FRED_SERIES.find((s) => s.id === seriesId);
  const title = seriesInfo?.title ?? seriesId;
  const units = seriesInfo?.units ?? "";

  const apiKey = process.env.FRED_API_KEY;
  const hasApiKey = apiKey && apiKey !== "your_fred_api_key_here";

  let observations = await getCachedObservations(seriesId);
  if (!observations && hasApiKey) {
    observations = await fetchFromFred(seriesId);
    if (observations.length > 0) {
      await cacheObservations(seriesId, observations);
    }
  }
  if (!observations) {
    observations = (await getCachedObservations(seriesId, true)) ?? [];
  }

  const latest =
    observations.length > 0 ? observations[observations.length - 1] : null;
  const prev =
    observations.length > 1 ? observations[observations.length - 2] : null;

  return {
    series_id: seriesId,
    title,
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
