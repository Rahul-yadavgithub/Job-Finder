import { BaseScraper, DiscoveredCompany } from './BaseScraper';

export class LeverScraper extends BaseScraper {
  constructor() {
    super('Lever');
    this.scraperVersion = '1.0.0';
  }

  private async scrapeDirectCompany(url: string): Promise<DiscoveredCompany[]> {
    if (!this.page) return [];
    
    try {
      await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await this.randomDelay();

      const data = await this.page.evaluate(() => {
        const companyName = document.title.split('-')[0]?.trim() || '';
        const jobs = Array.from(document.querySelectorAll('.posting-title h5')).map(h => h.textContent?.trim() || '');
        const hasIntern = jobs.some(j => j.toLowerCase().includes('intern'));
        const hasFresher = jobs.some(j => j.toLowerCase().includes('new grad') || j.toLowerCase().includes('entry'));
        
        return {
          companyName,
          jobsDesc: `Found ${jobs.length} jobs. ${hasIntern ? 'Internships available. ' : ''}${hasFresher ? 'Entry-level available.' : ''}`
        };
      });

      if (!data.companyName) return [];

      return [{
        companyName: data.companyName,
        website: '', 
        description: data.jobsDesc,
        source: this.platformName,
        sourceUrl: url,
        careersUrl: url,
        discoveryMethod: 'DIRECT'
      }];
    } catch (e) {
      console.error(`[Lever] Failed direct scrape for ${url}`);
      return [];
    }
  }

  private async discoverCompaniesFromSearch(): Promise<DiscoveredCompany[]> {
    if (!this.page) return [];
    console.warn('[Lever] Discovery mode requires external aggregator. Using fallback list.');
    return [
      {
        companyName: 'Airtable',
        website: 'https://airtable.com',
        description: 'Cloud Collaboration Service',
        source: this.platformName,
        sourceUrl: 'https://jobs.lever.co/airtable',
        careersUrl: 'https://jobs.lever.co/airtable',
        discoveryMethod: 'DISCOVERY'
      }
    ];
  }

  protected async discoverCompanies(sourceUrl?: string): Promise<DiscoveredCompany[]> {
    if (!sourceUrl || sourceUrl.trim() === 'https://jobs.lever.co') {
      return this.discoverCompaniesFromSearch();
    }
    return this.scrapeDirectCompany(sourceUrl);
  }
}
