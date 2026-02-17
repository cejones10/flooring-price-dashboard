export interface Region {
  id: string;
  name: string;
  states: string[];
  fips_codes: string[];
}

export interface RegionSummary {
  id: string;
  name: string;
  avg_price: number;
  product_count: number;
  price_min: number;
  price_max: number;
}
