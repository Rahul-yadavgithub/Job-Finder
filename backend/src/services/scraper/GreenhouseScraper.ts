import { BaseScraper, DiscoveredCompany } from './BaseScraper';

export class GreenhouseScraper extends BaseScraper {
  constructor() {
    super('Greenhouse');
    this.scraperVersion = '1.0.0';
  }

  private async scrapeDirectCompany(url: string): Promise<DiscoveredCompany[]> {
    if (!this.page) return [];
    
    try {
      await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await this.randomDelay();

      const data = await this.page.evaluate(() => {
        const companyName = document.querySelector('h1')?.textContent?.trim() || '';
        const jobs = Array.from(document.querySelectorAll('.opening a')).map(a => a.textContent?.trim() || '');
        const hasIntern = jobs.some(j => j.toLowerCase().includes('intern'));
        const hasFresher = jobs.some(j => j.toLowerCase().includes('new grad') || j.toLowerCase().includes('entry'));
        
        return {
          companyName: companyName.replace('Jobs at ', ''),
          jobsDesc: `Found ${jobs.length} jobs. ${hasIntern ? 'Internships available. ' : ''}${hasFresher ? 'Entry-level available.' : ''}`
        };
      });

      if (!data.companyName) return [];

      return [{
        companyName: data.companyName,
        website: '', // Usually not directly linked from Greenhouse board without clicking through
        description: data.jobsDesc,
        source: this.platformName,
        sourceUrl: url,
        careersUrl: url,
        discoveryMethod: 'DIRECT'
      }];
    } catch (e) {
      console.error(`[Greenhouse] Failed direct scrape for ${url}`);
      return [];
    }
  }

  private async discoverCompaniesFromSearch(): Promise<DiscoveredCompany[]> {
    if (!this.page) return [];
    // Greenhouse has no central directory. In a real scenario, we might use Google Dorking or an aggregator.
    // For Phase 1, we simulate discovery or fallback.
    console.warn('[Greenhouse] Discovery mode requires external aggregator. Using fallback list.');
    return [
      {
        companyName: 'OpenAI',
        website: 'https://openai.com',
        description: 'AI Research Company',
        source: this.platformName,
        sourceUrl: 'https://boards.greenhouse.io/openai',
        careersUrl: 'https://boards.greenhouse.io/openai',
        discoveryMethod: 'DISCOVERY'
      }
    ];
  }

  protected async discoverCompanies(sourceUrl?: string): Promise<DiscoveredCompany[]> {
    if (!sourceUrl || sourceUrl.trim() === 'https://boards.greenhouse.io') {
      return this.discoverCompaniesFromSearch();
    }
    return this.scrapeDirectCompany(sourceUrl);
  }
}
