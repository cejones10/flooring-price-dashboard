import { SPECIES } from "../../src/lib/constants";

// Species patterns ordered longest-first to avoid partial matches
const SPECIES_PATTERNS: { pattern: RegExp; name: string }[] = [
  { pattern: /brazilian\s*cherry/i, name: "Brazilian Cherry" },
  { pattern: /\bjatoba\b/i, name: "Brazilian Cherry" },
  { pattern: /brazilian\s*teak/i, name: "Brazilian Cherry" },
  { pattern: /white\s*oak/i, name: "White Oak" },
  { pattern: /red\s*oak/i, name: "Red Oak" },
  { pattern: /american\s*walnut/i, name: "Walnut" },
  { pattern: /black\s*walnut/i, name: "Walnut" },
  { pattern: /sugar\s*maple/i, name: "Maple" },
  { pattern: /hard\s*maple/i, name: "Maple" },
  { pattern: /american\s*cherry/i, name: "Cherry" },
  { pattern: /\bhickory\b/i, name: "Hickory" },
  { pattern: /\bpecan\b/i, name: "Hickory" },
  { pattern: /\bmaple\b/i, name: "Maple" },
  { pattern: /\bwalnut\b/i, name: "Walnut" },
  { pattern: /\bcherry\b/i, name: "Cherry" },
  { pattern: /\bash\b/i, name: "Ash" },
  { pattern: /\boak\b/i, name: "White Oak" }, // generic "oak" defaults to White Oak
  { pattern: /\bacacia\b/i, name: "Acacia" },
  { pattern: /\bbamboo\b/i, name: "Bamboo" },
  { pattern: /\bbirch\b/i, name: "Birch" },
  { pattern: /\bteak\b/i, name: "Teak" },
  { pattern: /\bmahogany\b/i, name: "Mahogany" },
  { pattern: /\bpine\b/i, name: "Pine" },
  { pattern: /\bcypress\b/i, name: "Cypress" },
  { pattern: /\bbeech\b/i, name: "Beech" },
];

const JANKA_LOOKUP: Record<string, number> = {};
for (const s of SPECIES) {
  JANKA_LOOKUP[s.name] = s.janka;
}
// Additional species not in SPECIES constant
Object.assign(JANKA_LOOKUP, {
  Acacia: 2300,
  Bamboo: 1380,
  Birch: 1260,
  Teak: 1155,
  Mahogany: 800,
  Pine: 690,
  Cypress: 510,
  Beech: 1300,
});

export function extractSpecies(title: string): string | null {
  for (const { pattern, name } of SPECIES_PATTERNS) {
    if (pattern.test(title)) return name;
  }
  return null;
}

/**
 * Parse mixed-fraction dimension strings like "3/4 in.", "3-1/4 in.", "0.75 in"
 * Returns the value in inches as a number.
 */
function parseMixedFraction(str: string): number | null {
  str = str.trim();

  // Pure decimal: "0.75", "5.0"
  const decimalMatch = str.match(/^(\d+\.?\d*)$/);
  if (decimalMatch) return parseFloat(decimalMatch[1]);

  // Mixed fraction: "3-1/4", "1-1/2"
  const mixedMatch = str.match(/^(\d+)\s*[-]\s*(\d+)\s*\/\s*(\d+)$/);
  if (mixedMatch) {
    return parseInt(mixedMatch[1]) + parseInt(mixedMatch[2]) / parseInt(mixedMatch[3]);
  }

  // Simple fraction: "3/4", "1/2"
  const fractionMatch = str.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (fractionMatch) {
    return parseInt(fractionMatch[1]) / parseInt(fractionMatch[2]);
  }

  return null;
}

export interface Dimensions {
  thickness: number | null;
  width: number | null;
  length: number | null;
}

export function extractDimensions(title: string): Dimensions {
  const result: Dimensions = { thickness: null, width: null, length: null };

  // Pattern: "T in. Thick x W in. Wide x L in. Long" (Home Depot style)
  const hdPattern = /(\d[\d\s\-\/\.]*)\s*in\.?\s*(?:Thick|T)\s*x\s*(\d[\d\s\-\/\.]*)\s*in\.?\s*(?:Wide|W)(?:\s*x\s*(\d[\d\s\-\/\.]*)\s*(?:in\.?|ft\.?)\s*(?:Long|L))?/i;
  const hdMatch = title.match(hdPattern);
  if (hdMatch) {
    result.thickness = parseMixedFraction(hdMatch[1]);
    result.width = parseMixedFraction(hdMatch[2]);
    if (hdMatch[3]) {
      const lengthVal = parseMixedFraction(hdMatch[3]);
      // If units were "ft" convert to inches
      if (lengthVal && /ft/i.test(hdMatch[0])) {
        result.length = lengthVal * 12;
      } else {
        result.length = lengthVal;
      }
    }
    return result;
  }

  // Pattern: "Tx W" shorthand like "3/4 x 3-1/4"
  const shortPattern = /(\d[\d\s\-\/\.]*)\s*(?:in\.?)?\s*x\s*(\d[\d\s\-\/\.]*)\s*(?:in\.?)?\s*(?:x\s*(\d[\d\s\-\/\.]*)\s*(?:in\.?|ft\.?)?)?/i;
  const shortMatch = title.match(shortPattern);
  if (shortMatch) {
    const v1 = parseMixedFraction(shortMatch[1]);
    const v2 = parseMixedFraction(shortMatch[2]);
    // Thickness is always smaller than width
    if (v1 !== null && v2 !== null) {
      if (v1 < v2) {
        result.thickness = v1;
        result.width = v2;
      } else {
        result.thickness = v2;
        result.width = v1;
      }
    }
    if (shortMatch[3]) {
      result.length = parseMixedFraction(shortMatch[3]);
    }
  }

  return result;
}

export function detectType(
  title: string,
  categoryHint?: string
): "solid" | "engineered" | "unfinished" {
  const combined = `${title} ${categoryHint || ""}`.toLowerCase();
  if (combined.includes("unfinished")) return "unfinished";
  if (combined.includes("engineered")) return "engineered";
  if (combined.includes("solid")) return "solid";
  // Default based on category hint alone
  if (categoryHint) {
    if (categoryHint.includes("engineered")) return "engineered";
    if (categoryHint.includes("unfinished")) return "unfinished";
  }
  return "solid";
}

const FINISH_PATTERNS: { pattern: RegExp; name: string }[] = [
  { pattern: /wire[\s-]*brush/i, name: "Wire-Brushed" },
  { pattern: /hand[\s-]*scrap/i, name: "Hand-Scraped" },
  { pattern: /distress/i, name: "Hand-Scraped" },
  { pattern: /uv\s*(?:cured\s*)?urethane/i, name: "UV Urethane" },
  { pattern: /aluminum\s*oxide/i, name: "Aluminum Oxide" },
  { pattern: /oil[\s-]*(?:based\s*)?poly/i, name: "Oil-Based Poly" },
  { pattern: /polyurethane/i, name: "Oil-Based Poly" },
  { pattern: /site[\s-]*finish/i, name: "Site-Finished" },
  { pattern: /prefinish/i, name: "UV Urethane" },
  { pattern: /unfinish/i, name: "Unfinished" },
  { pattern: /smooth/i, name: "UV Urethane" },
  { pattern: /satin/i, name: "UV Urethane" },
  { pattern: /matte/i, name: "UV Urethane" },
  { pattern: /gloss/i, name: "UV Urethane" },
];

export function extractFinish(title: string): string {
  for (const { pattern, name } of FINISH_PATTERNS) {
    if (pattern.test(title)) return name;
  }
  return "UV Urethane"; // most common default for prefinished products
}

const GRADE_PATTERNS: { pattern: RegExp; name: string }[] = [
  { pattern: /\bselect\b/i, name: "Select" },
  { pattern: /\bpremium\b/i, name: "Select" },
  { pattern: /\b#?\s*1\s*common\b/i, name: "#1 Common" },
  { pattern: /\b#?\s*2\s*common\b/i, name: "#2 Common" },
  { pattern: /\bcharacter\b/i, name: "Character" },
  { pattern: /\brushtic\b/i, name: "Rustic" },
  { pattern: /\bcabin\b/i, name: "Rustic" },
  { pattern: /\bnatural\b/i, name: "Character" },
  { pattern: /\bbuilder\b/i, name: "#1 Common" },
];

export function extractGrade(title: string): string {
  for (const { pattern, name } of GRADE_PATTERNS) {
    if (pattern.test(title)) return name;
  }
  return "Character"; // most common grade in big-box retail
}

export function getJankaHardness(species: string): number {
  return JANKA_LOOKUP[species] || 1000; // fallback for unknown species
}
