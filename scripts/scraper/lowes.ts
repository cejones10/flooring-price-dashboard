import { BaseScraper, ScrapedProduct } from "./base-scraper";

export class LowesScraper extends BaseScraper {
  constructor() {
    super("Lowe's", "https://www.lowes.com");
  }

  async scrapeCategory(_category: string): Promise<ScrapedProduct[]> {
    console.log(`[Lowe's] Scraping ${_category} — NOT IMPLEMENTED`);
    return [];
  }

  protected async fetchPage(_url: string): Promise<string> {
    throw new Error("Not implemented");
  }
}
