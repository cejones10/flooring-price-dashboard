"use client";

import useSWR from "swr";
import Link from "next/link";
import EconomicDashboard from "@/components/economic/EconomicDashboard";
import RegionMap from "@/components/map/RegionMap";
import type { RegionSummary } from "@/types/region";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function HomePage() {
  const { data: regions, isLoading } = useSWR<RegionSummary[]>(
    `${BASE_PATH}/data/regions.json`,
    fetcher
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <section>
        <EconomicDashboard />
      </section>

      <section>
        {isLoading || !regions ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <div className="animate-pulse text-text-muted">Loading map data...</div>
          </div>
        ) : (
          <div className="flex gap-4">
            {/* Region list sidebar */}
            <div className="w-64 shrink-0 bg-card border border-border rounded-xl p-3 hidden lg:block">
              <h3 className="text-sm font-semibold mb-2 px-1">Regions</h3>
              <nav className="space-y-0.5">
                {regions
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((region) => (
                    <Link
                      key={region.id}
                      href={`/region/${region.id}`}
                      className="flex items-center justify-between px-2.5 py-2 rounded-lg text-sm hover:bg-elevated transition-colors group"
                    >
                      <span className="text-text-secondary group-hover:text-text-primary transition-colors">
                        {region.name}
                      </span>
                      <span className="text-xs font-medium text-accent-green">
                        ${region.avg_price.toFixed(2)}
                      </span>
                    </Link>
                  ))}
              </nav>
            </div>

            {/* Map */}
            <div className="flex-1 min-w-0">
              <RegionMap regions={regions} />
            </div>
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {regions &&
          [...regions]
            .sort((a, b) => b.avg_price - a.avg_price)
            .slice(0, 6)
            .map((region) => (
              <Link
                key={region.id}
                href={`/region/${region.id}`}
                className="bg-card border border-border rounded-xl p-4 hover:border-accent-blue/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-sm">{region.name}</h3>
                  <span className="text-xs text-text-muted">
                    {region.product_count} products
                  </span>
                </div>
                <p className="text-2xl font-semibold text-accent-green">
                  ${region.avg_price.toFixed(2)}
                  <span className="text-sm text-text-muted font-normal">
                    /sqft avg
                  </span>
                </p>
                <p className="text-xs text-text-muted mt-1">
                  Range: ${region.price_min.toFixed(2)} – $
                  {region.price_max.toFixed(2)}
                </p>
              </Link>
            ))}
      </section>
    </div>
  );
}
