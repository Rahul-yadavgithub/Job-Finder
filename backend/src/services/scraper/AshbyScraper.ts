import { BaseScraper, DiscoveredCompany } from './BaseScraper';

export class AshbyScraper extends BaseScraper {
  constructor() {
    super('Ashby');
    this.scraperVersion = '1.0.0';
  }

  private async scrapeDirectCompany(url: string): Promise<DiscoveredCompany[]> {
    if (!this.page) return [];
    
    try {
      await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await this.randomDelay();

      const data = await this.page.evaluate(() => {
        const companyName = document.querySelector('h1')?.textContent?.trim() || '';
        const jobs = Array.from(document.querySelectorAll('a h3')).map(h => h.textContent?.trim() || '');
        const hasIntern = jobs.some(j => j.toLowerCase().includes('intern'));
        const hasFresher = jobs.some(j => j.toLowerCase().includes('new grad') || j.toLowerCase().includes('entry'));
        
        return {
          companyName: companyName.replace(' Jobs', ''),
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
      console.error(`[Ashby] Failed direct scrape for ${url}`);
      return [];
    }
  }

  private async discoverCompaniesFromSearch(): Promise<DiscoveredCompany[]> {
    if (!this.page) return [];
    console.warn('[Ashby] Discovery mode requires external aggregator. Using fallback list.');
    return [
      {
        companyName: 'Notion',
        website: 'https://notion.so',
        description: 'Productivity Application',
        source: this.platformName,
        sourceUrl: 'https://jobs.ashbyhq.com/notion',
        careersUrl: 'https://jobs.ashbyhq.com/notion',
        discoveryMethod: 'DISCOVERY'
      }
    ];
  }

  protected async discoverCompanies(sourceUrl?: string): Promise<DiscoveredCompany[]> {
    if (!sourceUrl || sourceUrl.trim() === 'https://jobs.ashbyhq.com') {
      return this.discoverCompaniesFromSearch();
    }
    return this.scrapeDirectCompany(sourceUrl);
  }
}
