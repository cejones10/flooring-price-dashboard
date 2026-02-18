import { NextResponse } from "next/server";
import { getAllIndicators } from "@/lib/fred";
import { initTables } from "@/lib/db";

export async function GET() {
  try {
    // Ensure tables exist (no-op if already created)
    await initTables();
    const indicators = await getAllIndicators();
    return NextResponse.json(indicators);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[economic] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
