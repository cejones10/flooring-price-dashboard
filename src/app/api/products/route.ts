import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { Product, AvailableFilters } from "@/types/product";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const region = searchParams.get("region");
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
  const sort = searchParams.get("sort") || "price_per_sqft";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);

  const db = getDb();
  const conditions: string[] = [];
  const args: (string | number)[] = [];

  if (region) {
    conditions.push("region_id = ?");
    args.push(region);
  }
  if (type) {
    conditions.push("type = ?");
    args.push(type);
  }
  if (species) {
    conditions.push("species = ?");
    args.push(species);
  }
  if (widthMin) {
    conditions.push("width >= ?");
    args.push(parseFloat(widthMin));
  }
  if (widthMax) {
    conditions.push("width <= ?");
    args.push(parseFloat(widthMax));
  }
  if (thicknessMin) {
    conditions.push("thickness >= ?");
    args.push(parseFloat(thicknessMin));
  }
  if (thicknessMax) {
    conditions.push("thickness <= ?");
    args.push(parseFloat(thicknessMax));
  }
  if (veneerMin) {
    conditions.push("veneer_thickness >= ?");
    args.push(parseFloat(veneerMin));
  }
  if (veneerMax) {
    conditions.push("veneer_thickness <= ?");
    args.push(parseFloat(veneerMax));
  }
  if (priceMin) {
    conditions.push("price_per_sqft >= ?");
    args.push(parseFloat(priceMin));
  }
  if (priceMax) {
    conditions.push("price_per_sqft <= ?");
    args.push(parseFloat(priceMax));
  }
  if (retailer) {
    conditions.push("retailer = ?");
    args.push(retailer);
  }
  if (grade) {
    conditions.push("grade = ?");
    args.push(grade);
  }
  if (finish) {
    conditions.push("finish = ?");
    args.push(finish);
  }

  const where =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // Validate sort column
  const validSorts = [
    "price_per_sqft",
    "species",
    "width",
    "thickness",
    "janka_hardness",
    "retailer",
    "type",
    "grade",
    "-price_per_sqft",
    "-species",
    "-width",
    "-thickness",
    "-janka_hardness",
    "veneer_thickness",
    "-veneer_thickness",
  ];
  let orderBy = "price_per_sqft ASC";
  if (validSorts.includes(sort)) {
    if (sort.startsWith("-")) {
      orderBy = `${sort.slice(1)} DESC`;
    } else {
      orderBy = `${sort} ASC`;
    }
  }

  const offset = (page - 1) * limit;

  const totalResult = await db.execute({
    sql: `SELECT COUNT(*) as count FROM products ${where}`,
    args,
  });
  const total = totalResult.rows[0].count as number;

  const productsResult = await db.execute({
    sql: `SELECT * FROM products ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
    args: [...args, limit, offset],
  });
  const products = productsResult.rows as unknown as Product[];

  // Cascading filters
  const [typesR, speciesR, retailersR, gradesR, finishesR, priceR, widthR, thicknessR, veneerR] =
    await Promise.all([
      db.execute({ sql: `SELECT DISTINCT type FROM products ${where} ORDER BY type`, args }),
      db.execute({ sql: `SELECT DISTINCT species FROM products ${where} ORDER BY species`, args }),
      db.execute({ sql: `SELECT DISTINCT retailer FROM products ${where} ORDER BY retailer`, args }),
      db.execute({ sql: `SELECT DISTINCT grade FROM products ${where} ORDER BY grade`, args }),
      db.execute({ sql: `SELECT DISTINCT finish FROM products ${where} ORDER BY finish`, args }),
      db.execute({ sql: `SELECT MIN(price_per_sqft) as min, MAX(price_per_sqft) as max FROM products ${where}`, args }),
      db.execute({ sql: `SELECT MIN(width) as min, MAX(width) as max FROM products ${where}`, args }),
      db.execute({ sql: `SELECT MIN(thickness) as min, MAX(thickness) as max FROM products ${where}`, args }),
      db.execute({
        sql: `SELECT MIN(veneer_thickness) as min, MAX(veneer_thickness) as max FROM products ${where ? where + " AND" : "WHERE"} veneer_thickness IS NOT NULL`,
        args,
      }),
    ]);

  const filters: AvailableFilters = {
    types: typesR.rows.map((r) => r.type as string),
    species: speciesR.rows.map((r) => r.species as string),
    retailers: retailersR.rows.map((r) => r.retailer as string),
    grades: gradesR.rows.map((r) => r.grade as string),
    finishes: finishesR.rows.map((r) => r.finish as string),
    price_range: {
      min: (priceR.rows[0]?.min as number) ?? 0,
      max: (priceR.rows[0]?.max as number) ?? 30,
    },
    width_range: {
      min: (widthR.rows[0]?.min as number) ?? 2,
      max: (widthR.rows[0]?.max as number) ?? 8,
    },
    thickness_range: {
      min: (thicknessR.rows[0]?.min as number) ?? 0.375,
      max: (thicknessR.rows[0]?.max as number) ?? 0.75,
    },
    veneer_range: {
      min: (veneerR.rows[0]?.min as number) ?? 0,
      max: (veneerR.rows[0]?.max as number) ?? 6,
    },
  };

  return NextResponse.json({ products, total, page, filters });
}
