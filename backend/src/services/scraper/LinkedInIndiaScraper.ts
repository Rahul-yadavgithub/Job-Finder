import { BaseScraper, DiscoveredCompany } from './BaseScraper';

export class LinkedInIndiaScraper extends BaseScraper {
  constructor() {
    super('LinkedIn India');
    this.scraperVersion = '1.0.0';
  }

  protected async discoverCompanies(sourceUrl?: string): Promise<DiscoveredCompany[]> {
    if (!this.page) throw new Error('Browser not initialized');

    try {
      await this.page.goto(sourceUrl || 'https://www.linkedin.com/jobs/search?location=India', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await this.randomDelay(3000, 5000);

      const jobs = await this.page.evaluate(() => {
        const jobCards = Array.from(document.querySelectorAll('.job-search-card, .base-card')).slice(0, 100);
        return jobCards.map(card => {
          const titleEl = card.querySelector('.base-search-card__title');
          const companyEl = card.querySelector('.base-search-card__subtitle');
          const linkEl = card.querySelector('a.base-card__full-link');
          const salaryEl = card.querySelector('.job-search-card__salary-info');
          
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
