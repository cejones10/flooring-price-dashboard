import { REGIONS } from "@/lib/regions";
import RegionPageClient from "@/components/region/RegionPageClient";

export function generateStaticParams() {
  return REGIONS.map((r) => ({ regionId: r.id }));
}

export default async function RegionPage({
  params,
}: {
  params: Promise<{ regionId: string }>;
}) {
  const { regionId } = await params;

  return <RegionPageClient regionId={regionId} />;
}
