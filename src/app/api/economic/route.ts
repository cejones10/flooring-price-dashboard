import { NextResponse } from "next/server";
import { getAllIndicators } from "@/lib/fred";

export async function GET() {
  const indicators = await getAllIndicators();
  return NextResponse.json(indicators);
}
