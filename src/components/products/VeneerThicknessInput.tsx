"use client";

import { useState, useCallback } from "react";

interface VeneerThicknessInputProps {
  currentMin?: number;
  currentMax?: number;
  onChangeMin: (value: number | null) => void;
  onChangeMax: (value: number | null) => void;
}

export default function VeneerThicknessInput({
  currentMin,
  currentMax,
  onChangeMin,
  onChangeMax,
}: VeneerThicknessInputProps) {
  const [minVal, setMinVal] = useState(currentMin?.toString() ?? "");
  const [maxVal, setMaxVal] = useState(currentMax?.toString() ?? "");

  const isExactMatch = currentMin != null && currentMax != null && currentMin === currentMax;

  const commitMin = useCallback(() => {
    const parsed = parseFloat(minVal);
    onChangeMin(minVal && !isNaN(parsed) ? parsed : null);
  }, [minVal, onChangeMin]);

  const commitMax = useCallback(() => {
    const parsed = parseFloat(maxVal);
    onChangeMax(maxVal && !isNaN(parsed) ? parsed : null);
  }, [maxVal, onChangeMax]);

  const setExact = useCallback(
    (val: string) => {
      setMinVal(val);
      setMaxVal(val);
      const parsed = parseFloat(val);
      if (val && !isNaN(parsed)) {
        onChangeMin(parsed);
        onChangeMax(parsed);
      } else {
        onChangeMin(null);
        onChangeMax(null);
      }
    },
    [onChangeMin, onChangeMax]
  );

  const [mode, setMode] = useState<"exact" | "range">(
    isExactMatch ? "exact" : currentMin != null || currentMax != null ? "range" : "exact"
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-text-secondary">
          Veneer Thickness (mm)
        </label>
        <div className="flex gap-1">
          <button
            onClick={() => setMode("exact")}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
              mode === "exact"
                ? "bg-accent-blue text-white"
                : "bg-elevated text-text-muted hover:text-text-secondary"
            }`}
          >
            Exact
          </button>
          <button
            onClick={() => setMode("range")}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
              mode === "range"
                ? "bg-accent-blue text-white"
                : "bg-elevated text-text-muted hover:text-text-secondary"
            }`}
          >
            Range
          </button>
        </div>
      </div>

      {mode === "exact" ? (
        <input
          type="number"
          step="0.5"
          min="0"
          placeholder="e.g. 3"
          value={isExactMatch ? minVal : ""}
          onChange={(e) => setExact(e.target.value)}
          className="w-full bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted"
        />
      ) : (
        <div className="flex gap-2 items-center">
          <input
            type="number"
            step="0.5"
            min="0"
            placeholder="Min"
            value={minVal}
            onChange={(e) => setMinVal(e.target.value)}
            onBlur={commitMin}
            onKeyDown={(e) => e.key === "Enter" && commitMin()}
            className="w-full bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted"
          />
          <span className="text-text-muted text-xs">to</span>
          <input
            type="number"
            step="0.5"
            min="0"
            placeholder="Max"
            value={maxVal}
            onChange={(e) => setMaxVal(e.target.value)}
            onBlur={commitMax}
            onKeyDown={(e) => e.key === "Enter" && commitMax()}
            className="w-full bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted"
          />
        </div>
      )}
    </div>
  );
}
