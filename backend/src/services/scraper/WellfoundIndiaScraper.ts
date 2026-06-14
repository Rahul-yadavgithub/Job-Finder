import { BaseScraper, DiscoveredCompany } from './BaseScraper';

export class WellfoundIndiaScraper extends BaseScraper {
  constructor() {
    super('Wellfound India');
    this.scraperVersion = '1.0.0';
  }

  protected async discoverCompanies(sourceUrl?: string): Promise<DiscoveredCompany[]> {
    if (!this.page) throw new Error('Browser not initialized');

    try {
      await this.page.goto(sourceUrl || 'https://wellfound.com/role/l/india', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await this.randomDelay(3000, 5000);

      const jobs = await this.page.evaluate(() => {
        const jobCards = Array.from(document.querySelectorAll('.styles_component__uEIEh')).slice(0, 100);
        return jobCards.map(card => {
          const titleEl = card.querySelector('.styles_title__pYeo_');
          const companyEl = card.querySelector('.styles_name__o1x5M');
          const linkEl = card.querySelector('a.styles_component__1v1A5');
          const salaryEl = card.querySelector('.styles_compensation__34K-U');
          
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
