// Maps US state FIPS codes to our 13 custom regions
// For states split across regions (FL, TX, VA, CA), we assign to the primary region
export const STATE_FIPS_TO_REGION: Record<string, string> = {
  // Northeast
  "09": "northeast", // CT
  "23": "northeast", // ME
  "25": "northeast", // MA
  "33": "northeast", // NH
  "44": "northeast", // RI
  "50": "northeast", // VT

  // North Atlantic
  "34": "north-atlantic", // NJ
  "36": "north-atlantic", // NY
  "42": "north-atlantic", // PA

  // Atlantic Coast
  "10": "atlantic-coast", // DE
  "24": "atlantic-coast", // MD
  "11": "atlantic-coast", // DC
  "54": "atlantic-coast", // WV
  "51": "atlantic-coast", // VA

  // Southeast
  "13": "southeast", // GA
  "37": "southeast", // NC
  "45": "southeast", // SC
  "47": "southeast", // TN

  // Florida (South Florida as primary for state-level)
  "12": "south-florida", // FL

  // North Florida / Alabama
  "01": "north-florida", // AL

  // Gulf Coast
  "22": "gulf-coast", // LA
  "28": "gulf-coast", // MS

  // Interior Texas / OK / AR
  "48": "interior-texas", // TX
  "40": "interior-texas", // OK
  "05": "interior-texas", // AR

  // Midwest
  "39": "midwest", // OH
  "18": "midwest", // IN
  "17": "midwest", // IL
  "26": "midwest", // MI
  "55": "midwest", // WI
  "27": "midwest", // MN
  "19": "midwest", // IA
  "29": "midwest", // MO
  "21": "midwest", // KY

  // Mountain West
  "08": "mountain-west", // CO
  "49": "mountain-west", // UT
  "04": "mountain-west", // AZ
  "35": "mountain-west", // NM
  "32": "mountain-west", // NV
  "16": "mountain-west", // ID
  "30": "mountain-west", // MT
  "56": "mountain-west", // WY

  // Pacific Northwest
  "53": "pacific-northwest", // WA
  "41": "pacific-northwest", // OR

  // Southern California
  "06": "southern-california", // CA

  // Great Plains
  "20": "great-plains", // KS
  "31": "great-plains", // NE
  "46": "great-plains", // SD
  "38": "great-plains", // ND

  // Others (assign to nearest region)
  "02": "pacific-northwest", // AK
  "15": "pacific-northwest", // HI
};

export const REGION_COLORS: Record<string, string> = {
  "northeast": "#3b82f6",
  "north-atlantic": "#6366f1",
  "atlantic-coast": "#8b5cf6",
  "southeast": "#10b981",
  "south-florida": "#f59e0b",
  "north-florida": "#84cc16",
  "gulf-coast": "#ef4444",
  "interior-texas": "#f97316",
  "midwest": "#06b6d4",
  "mountain-west": "#ec4899",
  "pacific-northwest": "#14b8a6",
  "southern-california": "#eab308",
  "great-plains": "#a78bfa",
};
