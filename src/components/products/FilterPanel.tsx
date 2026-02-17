"use client";

import type { AvailableFilters, ProductFilter } from "@/types/product";
import PriceRangeSlider from "./PriceRangeSlider";
import VeneerThicknessInput from "./VeneerThicknessInput";

interface FilterPanelProps {
  filters: ProductFilter;
  available: AvailableFilters;
  onFilterChange: (key: string, value: string | number | null) => void;
  onClear: () => void;
  activeCount: number;
}

export default function FilterPanel({
  filters,
  available,
  onFilterChange,
  onClear,
  activeCount,
}: FilterPanelProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Filters</h3>
        {activeCount > 0 && (
          <button
            onClick={onClear}
            className="text-xs text-accent-blue hover:underline"
          >
            Clear all ({activeCount})
          </button>
        )}
      </div>

      {/* Type tabs */}
      <div>
        <label className="text-xs font-medium text-text-secondary mb-2 block">
          Type
        </label>
        <div className="flex gap-1">
          {["solid", "engineered", "unfinished"].map((t) => (
            <button
              key={t}
              onClick={() =>
                onFilterChange("type", filters.type === t ? null : t)
              }
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filters.type === t
                  ? "bg-accent-blue text-white"
                  : "bg-elevated text-text-secondary hover:text-text-primary"
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Species */}
      <div>
        <label className="text-xs font-medium text-text-secondary mb-2 block">
          Species
        </label>
        <select
          value={filters.species || ""}
          onChange={(e) =>
            onFilterChange("species", e.target.value || null)
          }
          className="w-full bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-text-primary"
        >
          <option value="">All Species</option>
          {available.species.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Price Range */}
      <PriceRangeSlider
        label="Price ($/sqft)"
        min={available.price_range.min}
        max={available.price_range.max}
        step={0.5}
        currentMin={filters.price_min}
        currentMax={filters.price_max}
        prefix="$"
        onChangeMin={(v) => onFilterChange("price_min", v)}
        onChangeMax={(v) => onFilterChange("price_max", v)}
      />

      {/* Width Range */}
      <PriceRangeSlider
        label="Width (inches)"
        min={available.width_range.min}
        max={available.width_range.max}
        step={0.25}
        currentMin={filters.width_min}
        currentMax={filters.width_max}
        prefix=""
        onChangeMin={(v) => onFilterChange("width_min", v)}
        onChangeMax={(v) => onFilterChange("width_max", v)}
      />

      {/* Thickness Range */}
      <PriceRangeSlider
        label="Thickness (inches)"
        min={available.thickness_range.min}
        max={available.thickness_range.max}
        step={0.125}
        currentMin={filters.thickness_min}
        currentMax={filters.thickness_max}
        prefix=""
        onChangeMin={(v) => onFilterChange("thickness_min", v)}
        onChangeMax={(v) => onFilterChange("thickness_max", v)}
      />

      {/* Veneer Thickness */}
      <VeneerThicknessInput
        currentMin={filters.veneer_min}
        currentMax={filters.veneer_max}
        onChangeMin={(v) => onFilterChange("veneer_min", v)}
        onChangeMax={(v) => onFilterChange("veneer_max", v)}
      />

      {/* Grade */}
      <div>
        <label className="text-xs font-medium text-text-secondary mb-2 block">
          Grade
        </label>
        <select
          value={filters.grade || ""}
          onChange={(e) =>
            onFilterChange("grade", e.target.value || null)
          }
          className="w-full bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-text-primary"
        >
          <option value="">All Grades</option>
          {available.grades.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      {/* Finish */}
      <div>
        <label className="text-xs font-medium text-text-secondary mb-2 block">
          Finish
        </label>
        <select
          value={filters.finish || ""}
          onChange={(e) =>
            onFilterChange("finish", e.target.value || null)
          }
          className="w-full bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-text-primary"
        >
          <option value="">All Finishes</option>
          {available.finishes.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>

      {/* Retailer checkboxes */}
      <div>
        <label className="text-xs font-medium text-text-secondary mb-2 block">
          Retailer
        </label>
        <div className="space-y-1.5">
          {available.retailers.map((r) => (
            <label
              key={r}
              className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary cursor-pointer"
            >
              <input
                type="radio"
                name="retailer"
                checked={filters.retailer === r}
                onChange={() =>
                  onFilterChange(
                    "retailer",
                    filters.retailer === r ? null : r
                  )
                }
                className="accent-accent-blue"
              />
              {r}
            </label>
          ))}
          {filters.retailer && (
            <button
              onClick={() => onFilterChange("retailer", null)}
              className="text-xs text-accent-blue hover:underline mt-1"
            >
              Clear retailer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
