"use client";

import useSWR from "swr";
import type { ProductFilter, ProductsResponse } from "@/types/product";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useProducts(regionId: string, filters: ProductFilter) {
  const params = new URLSearchParams();
  params.set("region", regionId);

  if (filters.type) params.set("type", filters.type);
  if (filters.species) params.set("species", filters.species);
  if (filters.width_min) params.set("width_min", String(filters.width_min));
  if (filters.width_max) params.set("width_max", String(filters.width_max));
  if (filters.thickness_min) params.set("thickness_min", String(filters.thickness_min));
  if (filters.thickness_max) params.set("thickness_max", String(filters.thickness_max));
  if (filters.veneer_min) params.set("veneer_min", String(filters.veneer_min));
  if (filters.veneer_max) params.set("veneer_max", String(filters.veneer_max));
  if (filters.price_min) params.set("price_min", String(filters.price_min));
  if (filters.price_max) params.set("price_max", String(filters.price_max));
  if (filters.retailer) params.set("retailer", filters.retailer);
  if (filters.grade) params.set("grade", filters.grade);
  if (filters.finish) params.set("finish", filters.finish);
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.page) params.set("page", String(filters.page));

  const { data, error, isLoading } = useSWR<ProductsResponse>(
    `/api/products?${params.toString()}`,
    fetcher,
    { keepPreviousData: true }
  );

  return { data, error, isLoading };
}
