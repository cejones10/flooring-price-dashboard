"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useFilters } from "@/hooks/useFilters";
import { useProducts } from "@/hooks/useProducts";
import FilterPanel from "@/components/products/FilterPanel";
import ProductTable from "@/components/products/ProductTable";
import FilterChip from "@/components/products/FilterChip";
import { REGIONS } from "@/lib/regions";
import { COMPETITIVE_PROFILES } from "@/lib/competitiveness";

function RegionPageContent({ regionId }: { regionId: string }) {
  const region = REGIONS.find((r) => r.id === regionId);
  const { filters, setFilter, clearFilters, activeFilterCount } = useFilters();
  const { data, isLoading } = useProducts(regionId, filters);

  if (!region) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <h2 className="text-lg font-semibold">Region not found</h2>
          <p className="text-text-muted mt-2">
            The region &ldquo;{regionId}&rdquo; does not exist.
          </p>
          <Link
            href="/"
            className="inline-block mt-4 text-accent-blue hover:underline"
          >
            Back to map
          </Link>
        </div>
      </div>
    );
  }

  const activeChips: Array<{ key: string; label: string; value: string }> = [];
  if (filters.type)
    activeChips.push({ key: "type", label: "Type", value: filters.type });
  if (filters.species)
    activeChips.push({
      key: "species",
      label: "Species",
      value: filters.species,
    });
  if (filters.grade)
    activeChips.push({ key: "grade", label: "Grade", value: filters.grade });
  if (filters.finish)
    activeChips.push({ key: "finish", label: "Finish", value: filters.finish });
  if (filters.retailer)
    activeChips.push({
      key: "retailer",
      label: "Retailer",
      value: filters.retailer,
    });
  if (filters.price_min)
    activeChips.push({
      key: "price_min",
      label: "Min Price",
      value: `$${filters.price_min}`,
    });
  if (filters.price_max)
    activeChips.push({
      key: "price_max",
      label: "Max Price",
      value: `$${filters.price_max}`,
    });
  if (filters.veneer_min)
    activeChips.push({
      key: "veneer_min",
      label: "Min Veneer",
      value: `${filters.veneer_min}mm`,
    });
  if (filters.veneer_max)
    activeChips.push({
      key: "veneer_max",
      label: "Max Veneer",
      value: `${filters.veneer_max}mm`,
    });

  const defaultFilters = data?.filters ?? {
    types: [],
    species: [],
    retailers: [],
    grades: [],
    finishes: [],
    price_range: { min: 0, max: 30 },
    width_range: { min: 2, max: 8 },
    thickness_range: { min: 0.375, max: 0.75 },
    veneer_range: { min: 0.6, max: 6 },
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/"
          className="text-text-muted hover:text-text-primary transition-colors"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
              clipRule="evenodd"
            />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-semibold">{region.name}</h1>
          <p className="text-sm text-text-muted">
            {region.states.join(", ")}
          </p>
        </div>
      </div>

      {/* Competitive Overview */}
      {COMPETITIVE_PROFILES[regionId] && (
        <div className="bg-card border border-border rounded-xl p-5 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-lg font-bold text-white text-lg ${
                COMPETITIVE_PROFILES[regionId].score >= 8
                  ? "bg-accent-red"
                  : COMPETITIVE_PROFILES[regionId].score >= 6
                  ? "bg-accent-amber"
                  : COMPETITIVE_PROFILES[regionId].score >= 4
                  ? "bg-accent-blue"
                  : "bg-text-muted"
              }`}
            >
              {COMPETITIVE_PROFILES[regionId].score}
            </div>
            <div>
              <h2 className="text-sm font-semibold">
                Market Competitiveness
              </h2>
              <p
                className={`text-xs font-medium ${
                  COMPETITIVE_PROFILES[regionId].score >= 8
                    ? "text-accent-red"
                    : COMPETITIVE_PROFILES[regionId].score >= 6
                    ? "text-accent-amber"
                    : COMPETITIVE_PROFILES[regionId].score >= 4
                    ? "text-accent-blue"
                    : "text-text-muted"
                }`}
              >
                {COMPETITIVE_PROFILES[regionId].label} ({COMPETITIVE_PROFILES[regionId].score}/10)
              </p>
            </div>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">
            {COMPETITIVE_PROFILES[regionId].overview}
          </p>
        </div>
      )}

      {/* Active filter chips */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {activeChips.map((chip) => (
            <FilterChip
              key={chip.key}
              label={chip.label}
              value={chip.value}
              onRemove={() => setFilter(chip.key, null)}
            />
          ))}
        </div>
      )}

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-72 shrink-0 hidden lg:block">
          <FilterPanel
            filters={filters}
            available={defaultFilters}
            onFilterChange={setFilter}
            onClear={clearFilters}
            activeCount={activeFilterCount}
          />
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {isLoading && !data ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <div className="animate-pulse text-text-muted">
                Loading products...
              </div>
            </div>
          ) : data ? (
            <ProductTable
              products={data.products}
              total={data.total}
              page={data.page}
              currentSort={filters.sort || "price_per_sqft"}
              onSort={(field) => setFilter("sort", field)}
              onPageChange={(p) => setFilter("page", p)}
            />
          ) : (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <p className="text-text-muted">Failed to load products.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RegionPageClient({ regionId }: { regionId: string }) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="animate-pulse text-text-muted text-center">
            Loading region...
          </div>
        </div>
      }
    >
      <RegionPageContent regionId={regionId} />
    </Suspense>
  );
}
