export interface RegionStore {
  regionId: string;
  regionName: string;
  zip: string;
  hdStoreId: string;
  lowesStoreId: string;
}

/**
 * Maps each of the 13 regions to a representative zip code and store IDs.
 * HD API uses storeId + deliveryZip for regional pricing.
 * Lowe's uses store navigation to set location cookies.
 */
export const REGION_STORES: RegionStore[] = [
  {
    regionId: "northeast",
    regionName: "Northeast",
    zip: "02101",       // Boston, MA
    hdStoreId: "2664",  // Boston HD
    lowesStoreId: "1835",
  },
  {
    regionId: "north-atlantic",
    regionName: "North Atlantic",
    zip: "10001",       // New York, NY
    hdStoreId: "6174",  // Manhattan HD
    lowesStoreId: "1920",
  },
  {
    regionId: "atlantic-coast",
    regionName: "Atlantic Coast",
    zip: "20001",       // Washington, DC
    hdStoreId: "4616",  // DC HD
    lowesStoreId: "3327",
  },
  {
    regionId: "southeast",
    regionName: "Southeast",
    zip: "30301",       // Atlanta, GA
    hdStoreId: "0121",  // Atlanta HD
    lowesStoreId: "2224",
  },
  {
    regionId: "south-florida",
    regionName: "South Florida",
    zip: "33101",       // Miami, FL
    hdStoreId: "0254",  // Miami HD
    lowesStoreId: "2283",
  },
  {
    regionId: "north-florida",
    regionName: "North Florida",
    zip: "32099",       // Jacksonville, FL
    hdStoreId: "0227",  // Jacksonville HD
    lowesStoreId: "1584",
  },
  {
    regionId: "gulf-coast",
    regionName: "Gulf Coast",
    zip: "77001",       // Houston, TX
    hdStoreId: "0581",  // Houston HD
    lowesStoreId: "0460",
  },
  {
    regionId: "interior-texas",
    regionName: "Interior Texas",
    zip: "75201",       // Dallas, TX
    hdStoreId: "0582",  // Dallas HD
    lowesStoreId: "1636",
  },
  {
    regionId: "midwest",
    regionName: "Midwest",
    zip: "60601",       // Chicago, IL
    hdStoreId: "1913",  // Chicago HD
    lowesStoreId: "2618",
  },
  {
    regionId: "mountain-west",
    regionName: "Mountain West",
    zip: "80201",       // Denver, CO
    hdStoreId: "1507",  // Denver HD
    lowesStoreId: "0186",
  },
  {
    regionId: "pacific-northwest",
    regionName: "Pacific Northwest",
    zip: "98101",       // Seattle, WA
    hdStoreId: "4702",  // Seattle HD
    lowesStoreId: "2540",
  },
  {
    regionId: "southern-california",
    regionName: "Southern California",
    zip: "90001",       // Los Angeles, CA
    hdStoreId: "6604",  // LA HD
    lowesStoreId: "2700",
  },
  {
    regionId: "great-plains",
    regionName: "Great Plains",
    zip: "66101",       // Kansas City, KS
    hdStoreId: "2208",  // KC HD
    lowesStoreId: "1614",
  },
];

export function getRegionStore(regionId: string): RegionStore | undefined {
  return REGION_STORES.find((r) => r.regionId === regionId);
}
