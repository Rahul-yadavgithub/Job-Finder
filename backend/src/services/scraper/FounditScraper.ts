import { BaseScraper, DiscoveredCompany } from './BaseScraper';

export class FounditScraper extends BaseScraper {
  constructor() {
    super('Foundit');
    this.scraperVersion = '1.0.0';
  }

  protected async discoverCompanies(sourceUrl?: string): Promise<DiscoveredCompany[]> {
    if (!this.page) throw new Error('Browser not initialized');

    try {
      await this.page.goto(sourceUrl || 'https://www.foundit.in/srp/results?query=', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await this.randomDelay(3000, 5000);

      const jobs = await this.page.evaluate(() => {
        const jobCards = Array.from(document.querySelectorAll('.card-apply-content')).slice(0, 100);
        return jobCards.map(card => {
          const titleEl = card.querySelector('.jobTitle');
          const companyEl = card.querySelector('.companyName');
          const linkEl = card.querySelector('.jobTitle a, a');
          const salaryEl = card.querySelector('.package, .salary');
          
          const title = titleEl?.textContent?.trim() || '';
          const companyName = companyEl?.textContent?.trim() || '';
          const description = `${companyName} hiring for ${title}`;
          const salaryText = salaryEl?.textContent?.trim() || '';
          
          return {
            companyName,
            website: '',
            description,
            salaryText,
            sourceUrl: (linkEl as HTMLAnchorElement)?.href || window.location.href,
          };
        });
      });

      return jobs.filter(j => j.companyName).map(j => ({
        ...j,
        source: this.platformName,
        careersUrl: '',
        discoveryMethod: 'DISCOVERY'
      }));

    } catch (error) {
      console.error(`[${this.platformName}] Failed to scrape.`, error);
      return [];
    }
  }
}
