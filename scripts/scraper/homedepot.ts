import { BaseScraper, ScrapedProduct } from "./base-scraper";

export class HomeDepotScraper extends BaseScraper {
  constructor() {
    super("Home Depot", "https://www.homedepot.com");
  }

  async scrapeCategory(_category: string): Promise<ScrapedProduct[]> {
    // TODO: Implement actual scraping logic
    // This will require handling HD's dynamic rendering (Playwright/Puppeteer)
    // and parsing their product grid pages
    console.log(`[Home Depot] Scraping ${_category} — NOT IMPLEMENTED`);
    return [];
  }

  protected async fetchPage(_url: string): Promise<string> {
    // TODO: Implement with headless browser
    throw new Error("Not implemented");
  }
}
