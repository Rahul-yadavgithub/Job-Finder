import { BaseScraper, DiscoveredCompany } from './BaseScraper';

export class InstahyreScraper extends BaseScraper {
  constructor() {
    super('Instahyre');
    this.scraperVersion = '1.0.0';
  }

  protected async discoverCompanies(sourceUrl?: string): Promise<DiscoveredCompany[]> {
    if (!this.page) throw new Error('Browser not initialized');

    try {
      await this.page.goto(sourceUrl || 'https://www.instahyre.com/jobs', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await this.randomDelay(3000, 5000);

      const jobs = await this.page.evaluate(() => {
        const jobCards = Array.from(document.querySelectorAll('.employer-block')).slice(0, 100);
        return jobCards.map(card => {
          const titleEl = card.querySelector('.position-title');
          const companyEl = card.querySelector('.company-name');
          const linkEl = card.querySelector('.position-title a, a.employer-name');
          const salaryEl = card.querySelector('.salary, .ctc');
          
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
