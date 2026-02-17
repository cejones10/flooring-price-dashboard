"use client";

import { useMemo } from "react";
import useSWR from "swr";
import type { Product, ProductFilter, ProductsResponse } from "@/types/product";
import { filterProducts } from "@/lib/filter-products";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useProducts(regionId: string, filters: ProductFilter) {
  const { data: allProducts, error, isLoading } = useSWR<Product[]>(
    `${BASE_PATH}/data/products/${regionId}.json`,
    fetcher
  );

  const result: ProductsResponse | undefined = useMemo(() => {
    if (!allProducts) return undefined;
    return filterProducts(allProducts, filters);
  }, [allProducts, filters]);

  return { data: result, error, isLoading };
}
