import { BaseScraper, DiscoveredCompany } from './BaseScraper';

export class NaukriScraper extends BaseScraper {
  constructor() {
    super('Naukri');
    this.scraperVersion = '1.0.0';
  }

  protected async discoverCompanies(sourceUrl?: string): Promise<DiscoveredCompany[]> {
    if (!this.page) throw new Error('Browser not initialized');

    try {
      await this.page.goto(sourceUrl || 'https://www.naukri.com/fresher-jobs', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await this.randomDelay(3000, 5000);

      for (let i = 0; i < 5; i++) {
        await this.page.evaluate(() => window.scrollBy(0, document.body.scrollHeight));
        await this.randomDelay(1000, 2000);
      }

      const jobs = await this.page.evaluate(() => {
        const jobCards = Array.from(document.querySelectorAll('.srp-jobtuple-wrapper, article.jobTuple')).slice(0, 100);
        return jobCards.map(card => {
          const titleEl = card.querySelector('.title');
          const companyEl = card.querySelector('.comp-name');
          const linkEl = card.querySelector('.title');
          const salaryEl = card.querySelector('.salary, .sal');
          
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
        companyName: j.companyName,
        website: j.website,
        description: j.description,
        salaryText: j.salaryText,
        source: this.platformName,
        sourceUrl: j.sourceUrl,
        careersUrl: '',
        discoveryMethod: 'DISCOVERY'
      }));

    } catch (error) {
      console.error(`[${this.platformName}] Failed to scrape.`, error);
      return [];
    }
  }
}
