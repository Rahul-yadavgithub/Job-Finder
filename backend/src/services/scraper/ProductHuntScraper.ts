import { BaseScraper, DiscoveredCompany } from './BaseScraper';

export class ProductHuntScraper extends BaseScraper {
  constructor() {
    super('Product Hunt');
    this.scraperVersion = '1.0.0';
  }

  protected async discoverCompanies(): Promise<DiscoveredCompany[]> {
    if (!this.page) throw new Error('Browser not initialized');

    try {
      await this.page.goto('https://www.producthunt.com', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await this.randomDelay(3000, 5000);

      const products = await this.page.evaluate(() => {
        // Find product cards on the home page
        const cards = Array.from(document.querySelectorAll('[data-test="post-item"]')).slice(0, 30);
        return cards.map(card => {
          const nameEl = card.querySelector('div[class*="text-16"]'); // Heuristic for title
          const descEl = card.querySelector('div[class*="text-12"]'); // Heuristic for tagline
          const linkEl = card.querySelector('a');
          
          return {
            companyName: nameEl?.textContent?.trim() || '',
            description: descEl?.textContent?.trim() || '',
            sourceUrl: linkEl ? `https://www.producthunt.com${linkEl.getAttribute('href')}` : 'https://www.producthunt.com'
          };
        }).filter(p => p.companyName);
      });

      // Product Hunt typically lists products, not "companies", but usually they map 1:1 for startups
      return products.map(p => ({
        companyName: p.companyName,
        website: '', // Would need click-through or enrichment
        description: p.description,
        source: this.platformName,
        sourceUrl: p.sourceUrl,
        careersUrl: '',
        discoveryMethod: 'DISCOVERY'
      }));

    } catch (error) {
      console.error(`[${this.platformName}] Failed to scrape.`, error);
      return [];
    }
  }
}
