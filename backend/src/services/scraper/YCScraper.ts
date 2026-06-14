import { BaseScraper, DiscoveredCompany } from './BaseScraper';

export class YCScraper extends BaseScraper {
  constructor() {
    super('Y Combinator');
    this.scraperVersion = '1.0.0';
  }

  protected async discoverCompanies(sourceUrl?: string): Promise<DiscoveredCompany[]> {
    if (!this.page) throw new Error('Browser not initialized');

    try {
      await this.page.goto('https://www.ycombinator.com/companies', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await this.randomDelay(3000, 5000);

      const companies = await this.page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('a._company_86jzd_338'));
        return cards.slice(0, 50).map(card => {
          const nameEl = card.querySelector('span._coName_86jzd_453');
          const descEl = card.querySelector('span._coDescription_86jzd_478');
          const locEl = card.querySelector('span._coLocation_86jzd_469');
          
          return {
            companyName: nameEl?.textContent?.trim() || '',
            description: (descEl?.textContent?.trim() || '') + ' - ' + (locEl?.textContent?.trim() || ''),
            sourceUrl: (card as HTMLAnchorElement).href
          };
        });
      });

      // Navigate to each company page to get the actual website
      const fullCompanies: DiscoveredCompany[] = [];
      for (const comp of companies) {
        if (!comp.companyName) continue;
        
        try {
           await this.page.goto(comp.sourceUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
           const website = await this.page.evaluate(() => {
             const links = Array.from(document.querySelectorAll('a'));
             const siteLink = links.find(l => l.textContent?.includes('http'));
             return siteLink?.href || '';
           });

           fullCompanies.push({
             companyName: comp.companyName,
             website: website || '',
             description: comp.description,
             source: this.platformName,
             sourceUrl: comp.sourceUrl,
             careersUrl: '',
             discoveryMethod: 'DISCOVERY'
           });
           
           await this.randomDelay(500, 1500);
        } catch(e) {
          console.error(`Failed to load YC profile ${comp.sourceUrl}`);
        }
      }

      return fullCompanies.filter(c => c.companyName && c.website);
    } catch (error) {
      console.error(`[${this.platformName}] Failed to scrape.`, error);
      return [];
    }
  }
}
