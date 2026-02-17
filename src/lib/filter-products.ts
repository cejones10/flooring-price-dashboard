import type { Product, ProductFilter, AvailableFilters, ProductsResponse } from "@/types/product";

export function filterProducts(
  allProducts: Product[],
  filters: ProductFilter
): ProductsResponse {
  let filtered = [...allProducts];

  // Apply filters
  if (filters.type) {
    filtered = filtered.filter((p) => p.type === filters.type);
  }
  if (filters.species) {
    filtered = filtered.filter((p) => p.species === filters.species);
  }
  if (filters.width_min) {
    filtered = filtered.filter((p) => p.width >= filters.width_min!);
  }
  if (filters.width_max) {
    filtered = filtered.filter((p) => p.width <= filters.width_max!);
  }
  if (filters.thickness_min) {
    filtered = filtered.filter((p) => p.thickness >= filters.thickness_min!);
  }
  if (filters.thickness_max) {
    filtered = filtered.filter((p) => p.thickness <= filters.thickness_max!);
  }
  if (filters.veneer_min) {
    filtered = filtered.filter(
      (p) => p.veneer_thickness != null && p.veneer_thickness >= filters.veneer_min!
    );
  }
  if (filters.veneer_max) {
    filtered = filtered.filter(
      (p) => p.veneer_thickness != null && p.veneer_thickness <= filters.veneer_max!
    );
  }
  if (filters.price_min) {
    filtered = filtered.filter((p) => p.price_per_sqft >= filters.price_min!);
  }
  if (filters.price_max) {
    filtered = filtered.filter((p) => p.price_per_sqft <= filters.price_max!);
  }
  if (filters.retailer) {
    filtered = filtered.filter((p) => p.retailer === filters.retailer);
  }
  if (filters.grade) {
    filtered = filtered.filter((p) => p.grade === filters.grade);
  }
  if (filters.finish) {
    filtered = filtered.filter((p) => p.finish === filters.finish);
  }

  // Compute cascading filter options from the filtered set
  const availableFilters: AvailableFilters = {
    types: [...new Set(filtered.map((p) => p.type))].sort(),
    species: [...new Set(filtered.map((p) => p.species))].sort(),
    retailers: [...new Set(filtered.map((p) => p.retailer))].sort(),
    grades: [...new Set(filtered.map((p) => p.grade))].sort(),
    finishes: [...new Set(filtered.map((p) => p.finish))].sort(),
    price_range: {
      min: filtered.length > 0 ? Math.min(...filtered.map((p) => p.price_per_sqft)) : 0,
      max: filtered.length > 0 ? Math.max(...filtered.map((p) => p.price_per_sqft)) : 30,
    },
    width_range: {
      min: filtered.length > 0 ? Math.min(...filtered.map((p) => p.width)) : 2,
      max: filtered.length > 0 ? Math.max(...filtered.map((p) => p.width)) : 8,
    },
    thickness_range: {
      min: filtered.length > 0 ? Math.min(...filtered.map((p) => p.thickness)) : 0.375,
      max: filtered.length > 0 ? Math.max(...filtered.map((p) => p.thickness)) : 0.75,
    },
    veneer_range: (() => {
      const withVeneer = filtered.filter((p) => p.veneer_thickness != null);
      return {
        min: withVeneer.length > 0 ? Math.min(...withVeneer.map((p) => p.veneer_thickness!)) : 0,
        max: withVeneer.length > 0 ? Math.max(...withVeneer.map((p) => p.veneer_thickness!)) : 6,
      };
    })(),
  };

  // Sort
  const sort = filters.sort || "price_per_sqft";
  const desc = sort.startsWith("-");
  const sortKey = desc ? sort.slice(1) : sort;

  filtered.sort((a, b) => {
    const aVal = (a as unknown as Record<string, unknown>)[sortKey];
    const bVal = (b as unknown as Record<string, unknown>)[sortKey];

    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;

    let cmp: number;
    if (typeof aVal === "string" && typeof bVal === "string") {
      cmp = aVal.localeCompare(bVal);
    } else {
      cmp = (aVal as number) - (bVal as number);
    }

    return desc ? -cmp : cmp;
  });

  // Paginate
  const page = filters.page || 1;
  const limit = filters.limit || 50;
  const total = filtered.length;
  const offset = (page - 1) * limit;
  const products = filtered.slice(offset, offset + limit);

  return {
    products,
    total,
    page,
    filters: availableFilters,
  };
}
