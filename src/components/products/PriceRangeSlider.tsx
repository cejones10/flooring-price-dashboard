"use client";

import { useState, useEffect, useCallback } from "react";

interface PriceRangeSliderProps {
  label: string;
  min: number;
  max: number;
  step: number;
  currentMin?: number;
  currentMax?: number;
  prefix?: string;
  onChangeMin: (value: number | null) => void;
  onChangeMax: (value: number | null) => void;
}

export default function PriceRangeSlider({
  label,
  min,
  max,
  step,
  currentMin,
  currentMax,
  prefix = "",
  onChangeMin,
  onChangeMax,
}: PriceRangeSliderProps) {
  const [localMin, setLocalMin] = useState(currentMin ?? min);
  const [localMax, setLocalMax] = useState(currentMax ?? max);

  useEffect(() => {
    setLocalMin(currentMin ?? min);
    setLocalMax(currentMax ?? max);
  }, [currentMin, currentMax, min, max]);

  const handleMinCommit = useCallback(() => {
    if (localMin <= min) {
      onChangeMin(null);
    } else {
      onChangeMin(localMin);
    }
  }, [localMin, min, onChangeMin]);

  const handleMaxCommit = useCallback(() => {
    if (localMax >= max) {
      onChangeMax(null);
    } else {
      onChangeMax(localMax);
    }
  }, [localMax, max, onChangeMax]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-text-secondary">
          {label}
        </label>
        <span className="text-xs text-text-muted">
          {prefix}{localMin.toFixed(step < 1 ? 2 : 0)} – {prefix}{localMax.toFixed(step < 1 ? 2 : 0)}
        </span>
      </div>
      <div className="flex gap-2 items-center">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localMin}
          onChange={(e) => setLocalMin(parseFloat(e.target.value))}
          onMouseUp={handleMinCommit}
          onTouchEnd={handleMinCommit}
          className="w-full"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localMax}
          onChange={(e) => setLocalMax(parseFloat(e.target.value))}
          onMouseUp={handleMaxCommit}
          onTouchEnd={handleMaxCommit}
          className="w-full"
        />
      </div>
    </div>
  );
}
