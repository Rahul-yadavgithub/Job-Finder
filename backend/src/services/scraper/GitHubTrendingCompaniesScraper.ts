import { BaseScraper, DiscoveredCompany } from './BaseScraper';

export class GitHubTrendingCompaniesScraper extends BaseScraper {
  constructor() {
    super('GitHub Trending');
    this.scraperVersion = '1.0.0';
  }

  protected async discoverCompanies(): Promise<DiscoveredCompany[]> {
    if (!this.page) throw new Error('Browser not initialized');

    try {
      await this.page.goto('https://github.com/trending', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await this.randomDelay(2000, 4000);

      const repos = await this.page.evaluate(() => {
        const repoCards = Array.from(document.querySelectorAll('article.Box-row')).slice(0, 25);
        return repoCards.map(card => {
          const titleEl = card.querySelector('h2 a');
          const descEl = card.querySelector('p');
          const orgName = titleEl?.textContent?.split('/')[0]?.trim() || '';
          
          return {
            companyName: orgName,
            description: descEl?.textContent?.trim() || `Trending GitHub Repo by ${orgName}`,
            sourceUrl: `https://github.com/${orgName}`
          };
        }).filter(r => r.companyName);
      });

      // Filter out individual users, ideally we want orgs
      // A simple heuristic: if they have a company website on their profile, it's more likely an org
      // But for speed, we'll just return them and let validation handle it.
      return repos.map(r => ({
        companyName: r.companyName,
        website: '', 
        description: r.description,
        source: this.platformName,
        sourceUrl: r.sourceUrl,
        careersUrl: '',
        discoveryMethod: 'DISCOVERY'
      }));

    } catch (error) {
      console.error(`[${this.platformName}] Failed to scrape.`, error);
      return [];
    }
  }
}
