"use client";

import type { Product } from "@/types/product";

interface ProductTableProps {
  products: Product[];
  total: number;
  page: number;
  onSort: (field: string) => void;
  currentSort: string;
  onPageChange: (page: number) => void;
}

const COLUMNS = [
  { key: "species", label: "Species" },
  { key: "type", label: "Type" },
  { key: "width", label: "Width" },
  { key: "thickness", label: "Thick." },
  { key: "veneer_thickness", label: "Veneer (mm)" },
  { key: "grade", label: "Grade" },
  { key: "finish", label: "Finish" },
  { key: "janka_hardness", label: "Janka" },
  { key: "price_per_sqft", label: "$/sqft" },
  { key: "retailer", label: "Retailer" },
  { key: "brand", label: "Brand" },
];

export default function ProductTable({
  products,
  total,
  page,
  onSort,
  currentSort,
  onPageChange,
}: ProductTableProps) {
  const pageSize = 50;
  const totalPages = Math.ceil(total / pageSize);

  const getSortIndicator = (key: string) => {
    if (currentSort === key) return " ↑";
    if (currentSort === `-${key}`) return " ↓";
    return "";
  };

  const handleSort = (key: string) => {
    if (currentSort === key) {
      onSort(`-${key}`);
    } else {
      onSort(key);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <p className="text-sm text-text-secondary">
          <span className="font-medium text-text-primary">{total}</span> products
          found
        </p>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="px-2.5 py-1 rounded bg-elevated text-xs text-text-secondary hover:text-text-primary disabled:opacity-40"
            >
              Prev
            </button>
            <span className="text-xs text-text-muted">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="px-2.5 py-1 rounded bg-elevated text-xs text-text-secondary hover:text-text-primary disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="text-left px-3 py-2.5 text-xs font-medium text-text-muted cursor-pointer hover:text-text-primary whitespace-nowrap"
                >
                  {col.label}
                  {getSortIndicator(col.key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr
                key={product.id}
                className="border-b border-border/50 hover:bg-elevated/50 transition-colors"
              >
                <td className="px-3 py-2.5 font-medium whitespace-nowrap">
                  {product.species}
                </td>
                <td className="px-3 py-2.5 capitalize whitespace-nowrap">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${
                      product.type === "solid"
                        ? "bg-accent-green/10 text-accent-green"
                        : product.type === "engineered"
                        ? "bg-accent-blue/10 text-accent-blue"
                        : "bg-accent-amber/10 text-accent-amber"
                    }`}
                  >
                    {product.type}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-text-secondary whitespace-nowrap">
                  {product.width}&quot;
                </td>
                <td className="px-3 py-2.5 text-text-secondary whitespace-nowrap">
                  {product.thickness}&quot;
                </td>
                <td className="px-3 py-2.5 text-text-secondary whitespace-nowrap">
                  {product.veneer_thickness != null
                    ? `${product.veneer_thickness} mm`
                    : "—"}
                </td>
                <td className="px-3 py-2.5 text-text-secondary whitespace-nowrap">
                  {product.grade}
                </td>
                <td className="px-3 py-2.5 text-text-secondary whitespace-nowrap">
                  {product.finish}
                </td>
                <td className="px-3 py-2.5 text-text-secondary whitespace-nowrap">
                  {product.janka_hardness.toLocaleString()}
                </td>
                <td className="px-3 py-2.5 font-semibold text-accent-green whitespace-nowrap">
                  ${product.price_per_sqft.toFixed(2)}
                </td>
                <td className="px-3 py-2.5 text-text-secondary whitespace-nowrap">
                  {product.retailer}
                </td>
                <td className="px-3 py-2.5 text-text-secondary whitespace-nowrap">
                  {product.brand}
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td
                  colSpan={COLUMNS.length}
                  className="px-3 py-8 text-center text-text-muted"
                >
                  No products match your filters. Try adjusting your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
