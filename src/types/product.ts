export interface Product {
  id: number;
  region_id: string;
  type: "solid" | "engineered" | "unfinished";
  species: string;
  width: number;
  thickness: number;
  veneer_thickness: number | null;
  finish: string;
  grade: string;
  janka_hardness: number;
  length: number;
  price_per_sqft: number;
  retailer: string;
  brand: string;
  url: string;
  external_id?: string | null;
  last_updated: string;
}

export interface ProductFilter {
  region?: string;
  type?: string;
  species?: string;
  width_min?: number;
  width_max?: number;
  thickness_min?: number;
  thickness_max?: number;
  veneer_min?: number;
  veneer_max?: number;
  price_min?: number;
  price_max?: number;
  retailer?: string;
  grade?: string;
  finish?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  filters: AvailableFilters;
}

export interface AvailableFilters {
  types: string[];
  species: string[];
  retailers: string[];
  grades: string[];
  finishes: string[];
  price_range: { min: number; max: number };
  width_range: { min: number; max: number };
  thickness_range: { min: number; max: number };
  veneer_range: { min: number; max: number };
}
