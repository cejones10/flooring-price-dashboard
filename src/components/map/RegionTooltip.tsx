"use client";

interface RegionTooltipProps {
  name: string;
  avgPrice: number;
  productCount: number;
  x: number;
  y: number;
}

export default function RegionTooltip({
  name,
  avgPrice,
  productCount,
  x,
  y,
}: RegionTooltipProps) {
  return (
    <div
      className="pointer-events-none fixed z-50 rounded-lg bg-elevated border border-border px-3 py-2 shadow-lg"
      style={{
        left: x + 12,
        top: y - 10,
      }}
    >
      <p className="text-sm font-medium text-text-primary">{name}</p>
      <p className="text-xs text-text-secondary">
        Avg: <span className="text-accent-green font-medium">${avgPrice.toFixed(2)}</span>/sqft
      </p>
      <p className="text-xs text-text-muted">{productCount} products</p>
    </div>
  );
}
