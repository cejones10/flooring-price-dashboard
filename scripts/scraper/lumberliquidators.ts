import { BaseScraper, ScrapedProduct } from "./base-scraper";

export class LumberLiquidatorsScraper extends BaseScraper {
  constructor() {
    super("Lumber Liquidators", "https://www.lumberliquidators.com");
  }

  async scrapeCategory(_category: string): Promise<ScrapedProduct[]> {
    console.log(`[Lumber Liquidators] Scraping ${_category} — NOT IMPLEMENTED`);
    return [];
  }

  protected async fetchPage(_url: string): Promise<string> {
    throw new Error("Not implemented");
  }
}
