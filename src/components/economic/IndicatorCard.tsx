"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import type { Indicator } from "@/types/economic";

interface IndicatorCardProps {
  indicator: Indicator;
  onClick?: () => void;
}

export default function IndicatorCard({ indicator, onClick }: IndicatorCardProps) {
  const { title, value, delta, delta_pct, units, observations } = indicator;

  const isPositive = delta !== null && delta >= 0;
  const deltaColor = isPositive ? "text-accent-green" : "text-accent-red";
  const deltaBg = isPositive ? "bg-accent-green/10" : "bg-accent-red/10";

  const formatValue = (val: number | null) => {
    if (val === null) return "—";
    if (units === "%") return `${val.toFixed(2)}%`;
    if (units === "$M") return `$${(val / 1000).toFixed(1)}B`;
    if (val >= 1000) return val.toLocaleString("en-US", { maximumFractionDigits: 1 });
    return val.toFixed(1);
  };

  const sparklineColor = isPositive ? "#10b981" : "#ef4444";

  return (
    <button
      onClick={onClick}
      className="bg-card border border-border rounded-xl p-4 text-left hover:border-accent-blue/50 transition-colors w-full"
    >
      <p className="text-xs text-text-muted mb-1 truncate">{title}</p>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-xl font-semibold text-text-primary">
            {formatValue(value)}
          </p>
          {delta !== null && delta_pct !== null && (
            <span
              className={`inline-flex items-center text-xs px-1.5 py-0.5 rounded ${deltaBg} ${deltaColor} mt-1`}
            >
              {isPositive ? "+" : ""}
              {delta_pct.toFixed(1)}%
            </span>
          )}
        </div>
        {observations.length > 2 && (
          <div className="w-20 h-10">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={observations}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={sparklineColor}
                  strokeWidth={1.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </button>
  );
}
