export interface EconomicSeries {
  id: string;
  title: string;
  units: string;
  frequency: string;
}

export interface Indicator {
  series_id: string;
  title: string;
  value: number | null;
  previous_value: number | null;
  delta: number | null;
  delta_pct: number | null;
  units: string;
  observations: Observation[];
}

export interface Observation {
  date: string;
  value: number;
}
