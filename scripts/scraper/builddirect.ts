import { BaseScraper, ScrapedProduct } from "./base-scraper";

export class BuildDirectScraper extends BaseScraper {
  constructor() {
    super("BuildDirect", "https://www.builddirect.com");
  }

  async scrapeCategory(_category: string): Promise<ScrapedProduct[]> {
    console.log(`[BuildDirect] Scraping ${_category} — NOT IMPLEMENTED`);
    return [];
  }

  protected async fetchPage(_url: string): Promise<string> {
    throw new Error("Not implemented");
  }
}
