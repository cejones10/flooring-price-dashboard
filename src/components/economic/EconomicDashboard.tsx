"use client";

import { useState } from "react";
import useSWR from "swr";
import IndicatorCard from "./IndicatorCard";
import IndicatorChart from "./IndicatorChart";
import type { Indicator } from "@/types/economic";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function EconomicDashboard() {
  const { data: indicators } = useSWR<Indicator[]>(
    `${BASE_PATH}/data/economic.json`,
    fetcher
  );
  const [expanded, setExpanded] = useState<Indicator | null>(null);

  if (!indicators || indicators.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-3">Economic Indicators</h2>
        <p className="text-sm text-text-muted">
          Set FRED_API_KEY in .env.local to display live economic data.
          Get a free key at{" "}
          <a
            href="https://fred.stlouisfed.org/docs/api/api_key.html"
            className="text-accent-blue underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            fred.stlouisfed.org
          </a>
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-card border border-border rounded-xl p-4">
        <h2 className="text-lg font-semibold mb-3">Economic Indicators</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {indicators.map((ind) => (
            <IndicatorCard
              key={ind.series_id}
              indicator={ind}
              onClick={() => setExpanded(ind)}
            />
          ))}
        </div>
      </div>
      {expanded && (
        <IndicatorChart
          indicator={expanded}
          onClose={() => setExpanded(null)}
        />
      )}
    </>
  );
}
