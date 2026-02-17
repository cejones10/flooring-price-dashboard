"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";
import type { ProductFilter } from "@/types/product";

export function useFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const filters: ProductFilter = useMemo(() => {
    const f: ProductFilter = {};
    const type = searchParams.get("type");
    const species = searchParams.get("species");
    const widthMin = searchParams.get("width_min");
    const widthMax = searchParams.get("width_max");
    const thicknessMin = searchParams.get("thickness_min");
    const thicknessMax = searchParams.get("thickness_max");
    const veneerMin = searchParams.get("veneer_min");
    const veneerMax = searchParams.get("veneer_max");
    const priceMin = searchParams.get("price_min");
    const priceMax = searchParams.get("price_max");
    const retailer = searchParams.get("retailer");
    const grade = searchParams.get("grade");
    const finish = searchParams.get("finish");
    const sort = searchParams.get("sort");
    const page = searchParams.get("page");

    if (type) f.type = type;
    if (species) f.species = species;
    if (widthMin) f.width_min = parseFloat(widthMin);
    if (widthMax) f.width_max = parseFloat(widthMax);
    if (thicknessMin) f.thickness_min = parseFloat(thicknessMin);
    if (thicknessMax) f.thickness_max = parseFloat(thicknessMax);
    if (veneerMin) f.veneer_min = parseFloat(veneerMin);
    if (veneerMax) f.veneer_max = parseFloat(veneerMax);
    if (priceMin) f.price_min = parseFloat(priceMin);
    if (priceMax) f.price_max = parseFloat(priceMax);
    if (retailer) f.retailer = retailer;
    if (grade) f.grade = grade;
    if (finish) f.finish = finish;
    if (sort) f.sort = sort;
    if (page) f.page = parseInt(page, 10);

    return f;
  }, [searchParams]);

  const setFilter = useCallback(
    (key: string, value: string | number | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === null || value === "" || value === undefined) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
      // Reset page when filter changes (unless changing page itself)
      if (key !== "page") {
        params.delete("page");
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, router, pathname]
  );

  const clearFilters = useCallback(() => {
    router.push(pathname);
  }, [router, pathname]);

  const activeFilterCount = useMemo(() => {
    return Object.keys(filters).filter(
      (k) => k !== "page" && k !== "sort"
    ).length;
  }, [filters]);

  return { filters, setFilter, clearFilters, activeFilterCount };
}
