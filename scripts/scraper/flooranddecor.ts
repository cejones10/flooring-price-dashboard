import { BaseScraper, ScrapedProduct } from "./base-scraper";

export class FloorAndDecorScraper extends BaseScraper {
  constructor() {
    super("Floor & Decor", "https://www.flooranddecor.com");
  }

  async scrapeCategory(_category: string): Promise<ScrapedProduct[]> {
    console.log(`[Floor & Decor] Scraping ${_category} — NOT IMPLEMENTED`);
    return [];
  }

  protected async fetchPage(_url: string): Promise<string> {
    throw new Error("Not implemented");
  }
}
