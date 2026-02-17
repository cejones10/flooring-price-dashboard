import { Region } from "@/types/region";

export const REGIONS: Region[] = [
  {
    id: "northeast",
    name: "Northeast",
    states: ["CT", "ME", "MA", "NH", "RI", "VT"],
    fips_codes: ["09", "23", "25", "33", "44", "50"],
  },
  {
    id: "north-atlantic",
    name: "North Atlantic",
    states: ["NJ", "NY", "PA", "Northern VA"],
    fips_codes: ["34", "36", "42"],
  },
  {
    id: "atlantic-coast",
    name: "Atlantic Coast",
    states: ["DE", "MD", "Southern VA", "DC", "WV"],
    fips_codes: ["10", "24", "51", "11", "54"],
  },
  {
    id: "southeast",
    name: "Southeast",
    states: ["GA", "NC", "SC", "TN"],
    fips_codes: ["13", "37", "45", "47"],
  },
  {
    id: "south-florida",
    name: "South Florida",
    states: ["FL (South)"],
    fips_codes: ["12"],
  },
  {
    id: "north-florida",
    name: "North Florida",
    states: ["FL (North)", "AL"],
    fips_codes: ["12", "01"],
  },
  {
    id: "gulf-coast",
    name: "Gulf Coast",
    states: ["LA", "MS", "TX (Gulf)"],
    fips_codes: ["22", "28", "48"],
  },
  {
    id: "interior-texas",
    name: "Interior Texas",
    states: ["TX (Interior)", "OK", "AR"],
    fips_codes: ["48", "40", "05"],
  },
  {
    id: "midwest",
    name: "Midwest",
    states: ["OH", "IN", "IL", "MI", "WI", "MN", "IA", "MO"],
    fips_codes: ["39", "18", "17", "26", "55", "27", "19", "29"],
  },
  {
    id: "mountain-west",
    name: "Mountain West",
    states: ["CO", "UT", "AZ", "NM", "NV", "ID", "MT", "WY"],
    fips_codes: ["08", "49", "04", "35", "32", "16", "30", "56"],
  },
  {
    id: "pacific-northwest",
    name: "Pacific Northwest",
    states: ["WA", "OR", "Northern CA"],
    fips_codes: ["53", "41"],
  },
  {
    id: "southern-california",
    name: "Southern California",
    states: ["CA (South)"],
    fips_codes: ["06"],
  },
  {
    id: "great-plains",
    name: "Great Plains",
    states: ["KS", "NE", "SD", "ND"],
    fips_codes: ["20", "31", "46", "38"],
  },
];

export const REGION_PRICE_MULTIPLIERS: Record<string, number> = {
  "northeast": 1.12,
  "north-atlantic": 1.10,
  "atlantic-coast": 1.05,
  "southeast": 0.95,
  "south-florida": 1.15,
  "north-florida": 0.93,
  "gulf-coast": 0.92,
  "interior-texas": 0.90,
  "midwest": 0.90,
  "mountain-west": 1.02,
  "pacific-northwest": 1.08,
  "southern-california": 1.18,
  "great-plains": 0.88,
};

export function getRegionById(id: string): Region | undefined {
  return REGIONS.find((r) => r.id === id);
}
