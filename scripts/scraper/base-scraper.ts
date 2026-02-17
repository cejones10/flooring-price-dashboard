import type { Product } from "../../src/types/product";

export interface ScrapedProduct {
  species: string;
  type: "solid" | "engineered" | "unfinished";
  width: number;
  thickness: number;
  veneer_thickness: number | null;
  finish: string;
  grade: string;
  price_per_sqft: number;
  brand: string;
  url: string;
  length: number;
}

export abstract class BaseScraper {
  readonly retailer: string;
  readonly baseUrl: string;

  constructor(retailer: string, baseUrl: string) {
    this.retailer = retailer;
    this.baseUrl = baseUrl;
  }

  abstract scrapeCategory(category: string): Promise<ScrapedProduct[]>;

  protected abstract fetchPage(url: string): Promise<string>;

  protected parsePrice(priceStr: string): number {
    const cleaned = priceStr.replace(/[^0-9.]/g, "");
    return parseFloat(cleaned) || 0;
  }

  protected normalizeSpecies(raw: string): string {
    const lower = raw.toLowerCase().trim();
    const speciesMap: Record<string, string> = {
      "red oak": "Red Oak",
      "white oak": "White Oak",
      hickory: "Hickory",
      maple: "Maple",
      walnut: "Walnut",
      cherry: "Cherry",
      ash: "Ash",
      "brazilian cherry": "Brazilian Cherry",
      jatoba: "Brazilian Cherry",
    };

    for (const [key, value] of Object.entries(speciesMap)) {
      if (lower.includes(key)) return value;
    }
    return raw.trim();
  }

  protected normalizeType(raw: string): Product["type"] {
    const lower = raw.toLowerCase();
    if (lower.includes("engineered")) return "engineered";
    if (lower.includes("unfinished")) return "unfinished";
    return "solid";
  }

  async scrapeAll(): Promise<ScrapedProduct[]> {
    const categories = ["solid-hardwood", "engineered-hardwood", "unfinished-hardwood"];
    const results: ScrapedProduct[] = [];

    for (const cat of categories) {
      try {
        const products = await this.scrapeCategory(cat);
        results.push(...products);
      } catch (err) {
        console.error(`[${this.retailer}] Error scraping ${cat}:`, err);
      }
    }

    return results;
  }
}
