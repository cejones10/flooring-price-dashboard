export const SPECIES = [
  { name: "Red Oak", janka: 1290 },
  { name: "White Oak", janka: 1360 },
  { name: "Hickory", janka: 1820 },
  { name: "Maple", janka: 1450 },
  { name: "Walnut", janka: 1010 },
  { name: "Cherry", janka: 950 },
  { name: "Ash", janka: 1320 },
  { name: "Brazilian Cherry", janka: 2350 },
] as const;

export const GRADES = ["Select", "Character", "#1 Common", "#2 Common", "Rustic"] as const;

export const FINISHES = [
  "Site-Finished",
  "UV Urethane",
  "Oil-Based Poly",
  "Aluminum Oxide",
  "Wire-Brushed",
  "Hand-Scraped",
  "Unfinished",
] as const;

export const RETAILERS = [
  "Home Depot",
  "Lowe's",
  "Floor & Decor",
  "LL Flooring",
  "BuildDirect",
  "ProSource Wholesale",
  "Wayfair",
  "Empire Today",
  "National Floors Direct",
  "Flooring America",
  "The Floor Trader",
  "Carpet One",
] as const;

export const HARDWOOD_TYPES = ["solid", "engineered", "unfinished"] as const;

export const WIDTHS = [2.25, 3.25, 4, 5, 6, 7, 8] as const;
export const THICKNESSES_SOLID = [0.375, 0.5, 0.75] as const;
export const THICKNESSES_ENGINEERED = [0.375, 0.5, 0.625] as const;

export const BRANDS: Record<string, string[]> = {
  "Home Depot": ["Bruce", "Mohawk", "TrafficMaster", "Home Decorators"],
  "Lowe's": ["SMARTCORE", "Pergo", "Shaw", "Style Selections"],
  "Floor & Decor": ["AquaGuard", "Avella", "NuCore", "Virginia Mill Works"],
  "LL Flooring": ["Bellawood", "ReNature", "Dream Home", "Hydroscapes"],
  "BuildDirect": ["Jasper", "Tungston", "Vanier"],
  "ProSource Wholesale": ["Somerset", "Mannington", "Armstrong", "IndusParquet"],
  "Wayfair": ["Foundry Select", "Wade Logan", "Mercury Row", "Joss & Main"],
  "Empire Today": ["Empire", "Empire Premium", "Empire Select"],
  "National Floors Direct": ["NFD Select", "NFD Premium", "Shaw"],
  "Flooring America": ["Aquadura", "PurParquet", "Downs", "Tigerwood"],
  "The Floor Trader": ["Regal Hardwoods", "Johnson Premium", "Ark Floors"],
  "Carpet One": ["Invincible", "Bigelow", "Lees", "Innovia"],
};

export const FRED_SERIES = [
  { id: "MORTGAGE30US", title: "30-Year Mortgage Rate", units: "%" },
  { id: "HOUST1F", title: "Single-Family Housing Starts", units: "Thousands" },
  { id: "PERMIT1", title: "Building Permits", units: "Thousands" },
  { id: "CSUSHPISA", title: "Case-Shiller Home Price Index", units: "Index" },
  { id: "TLRESCONS", title: "Residential Construction Spending", units: "$M" },
  { id: "WPU08", title: "PPI: Lumber & Wood Products", units: "Index" },
  { id: "UMCSENT", title: "Consumer Sentiment", units: "Index" },
  { id: "HSN1F", title: "New Home Sales", units: "Thousands" },
] as const;
