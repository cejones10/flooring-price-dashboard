"use client";

import { useState, useCallback } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
} from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import { useRouter } from "next/navigation";
import RegionTooltip from "./RegionTooltip";
import MapLegend from "./MapLegend";
import { STATE_FIPS_TO_REGION } from "@/lib/state-regions";
import type { RegionSummary } from "@/types/region";

const GEO_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

interface RegionMapProps {
  regions: RegionSummary[];
}

export default function RegionMap({ regions }: RegionMapProps) {
  const router = useRouter();
  const [tooltip, setTooltip] = useState<{
    name: string;
    avgPrice: number;
    productCount: number;
    x: number;
    y: number;
  } | null>(null);

  const regionMap = new Map(regions.map((r) => [r.id, r]));

  const prices = regions.map((r) => r.avg_price).filter((p) => p > 0);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  const colorScale = scaleLinear<string>()
    .domain([minPrice, (minPrice + maxPrice) / 2, maxPrice])
    .range(["#10b981", "#3b82f6", "#ef4444"]);

  const getRegionForState = (geo: { id: string }) => {
    const fips = geo.id;
    const regionId = STATE_FIPS_TO_REGION[fips];
    if (!regionId) return null;
    return regionMap.get(regionId) ?? null;
  };

  const handleMouseEnter = useCallback(
    (
      geo: { id: string },
      event: React.MouseEvent
    ) => {
      const region = getRegionForState(geo);
      if (region) {
        setTooltip({
          name: region.name,
          avgPrice: region.avg_price,
          productCount: region.product_count,
          x: event.clientX,
          y: event.clientY,
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [regions]
  );

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  const handleClick = useCallback(
    (geo: { id: string }) => {
      const fips = geo.id;
      const regionId = STATE_FIPS_TO_REGION[fips];
      if (regionId) {
        router.push(`/region/${regionId}`);
      }
    },
    [router]
  );

  const legendItems = [
    { label: `$${minPrice.toFixed(2)} (Low)`, color: "#10b981" },
    { label: "Mid", color: "#3b82f6" },
    { label: `$${maxPrice.toFixed(2)} (High)`, color: "#ef4444" },
  ];

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Regional Price Map</h2>
        <p className="text-xs text-text-muted">Click a region to explore prices</p>
      </div>
      <div className="relative">
        <ComposableMap
          projection="geoAlbersUsa"
          projectionConfig={{ scale: 1000 }}
          width={800}
          height={500}
          style={{ width: "100%", height: "auto" }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const region = getRegionForState(geo);
                const fill = region
                  ? colorScale(region.avg_price)
                  : "#e5e7eb";

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fill}
                    stroke="#ffffff"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: "none" },
                      hover: {
                        outline: "none",
                        fill: "#60a5fa",
                        cursor: "pointer",
                      },
                      pressed: { outline: "none" },
                    }}
                    onMouseEnter={(event) =>
                      handleMouseEnter(geo, event as unknown as React.MouseEvent)
                    }
                    onMouseLeave={handleMouseLeave}
                    onClick={() => handleClick(geo)}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>
        {tooltip && (
          <RegionTooltip
            name={tooltip.name}
            avgPrice={tooltip.avgPrice}
            productCount={tooltip.productCount}
            x={tooltip.x}
            y={tooltip.y}
          />
        )}
      </div>
      <div className="mt-3">
        <MapLegend items={legendItems} />
      </div>
    </div>
  );
}
