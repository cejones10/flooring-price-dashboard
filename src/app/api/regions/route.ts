import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { REGIONS } from "@/lib/regions";
import type { RegionSummary } from "@/types/region";

export async function GET() {
  try {
    const db = getDb();

    const result = await db.execute({
      sql: `SELECT region_id,
                  COUNT(*) as product_count,
                  ROUND(AVG(price_per_sqft), 2) as avg_price,
                  ROUND(MIN(price_per_sqft), 2) as price_min,
                  ROUND(MAX(price_per_sqft), 2) as price_max
           FROM products
           GROUP BY region_id`,
      args: [],
    });

    const statsMap = new Map(
      result.rows.map((s) => [
        s.region_id as string,
        {
          product_count: s.product_count as number,
          avg_price: s.avg_price as number,
          price_min: s.price_min as number,
          price_max: s.price_max as number,
        },
      ])
    );

    const regions: RegionSummary[] = REGIONS.map((r) => {
      const s = statsMap.get(r.id);
      return {
        id: r.id,
        name: r.name,
        avg_price: s?.avg_price ?? 0,
        product_count: s?.product_count ?? 0,
        price_min: s?.price_min ?? 0,
        price_max: s?.price_max ?? 0,
      };
    });

    return NextResponse.json(regions);
  } catch (error) {
    console.error("Regions API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
