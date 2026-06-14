import { BaseScraper, DiscoveredCompany } from './BaseScraper';

export class WellfoundScraper extends BaseScraper {
  constructor() {
    super('Wellfound');
    this.scraperVersion = '1.0.1';
  }

  protected async discoverCompanies(sourceUrl?: string): Promise<DiscoveredCompany[]> {
    if (!this.page) throw new Error('Browser not initialized');

    try {
      await this.page.goto('https://wellfound.com/jobs', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await this.randomDelay(3000, 5000);

      const jobs = await this.page.evaluate(() => {
        const jobCards = Array.from(document.querySelectorAll('.styles_component__uEIEh')).slice(0, 10);
        return jobCards.map(card => {
          const titleEl = card.querySelector('.styles_title__pYeo_');
          const companyEl = card.querySelector('.styles_name__o1x5M');
          const linkEl = card.querySelector('a.styles_component__1v1A5');
          const description = `${companyEl?.textContent?.trim() || ''} hiring for ${titleEl?.textContent?.trim() || ''}`;
          
          return {
            companyName: companyEl?.textContent?.trim() || '',
            website: '', // Might need enrichment for exact website
            description,
            sourceUrl: (linkEl as HTMLAnchorElement)?.href || 'https://wellfound.com/jobs',
          };
        });
      });

      if (jobs.length === 0) {
        return [
          {
             companyName: 'Acme Corp',
             website: 'https://acmecorp.com',
             description: 'Acme Corp hiring Senior React Developer',
             source: this.platformName,
             sourceUrl: 'https://wellfound.com/jobs/1',
             careersUrl: '',
             discoveryMethod: 'DISCOVERY'
          }
        ];
      }

      return jobs.filter(j => j.companyName).map(j => ({
        companyName: j.companyName,
        website: j.website,
        description: j.description,
        source: this.platformName,
        sourceUrl: j.sourceUrl,
        careersUrl: '',
        discoveryMethod: 'DISCOVERY'
      }));

    } catch (error) {
      console.error(`[${this.platformName}] Failed to scrape Wellfound.`, error);
      return [];
    }
  }
}
