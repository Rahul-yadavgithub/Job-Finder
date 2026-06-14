import { BaseScraper, DiscoveredCompany } from './BaseScraper';

export class HackerNewsHiringScraper extends BaseScraper {
  constructor() {
    super('Hacker News');
    this.scraperVersion = '1.0.0';
  }

  protected async discoverCompanies(): Promise<DiscoveredCompany[]> {
    if (!this.page) throw new Error('Browser not initialized');

    try {
      // First, find the latest "Who is hiring?" thread
      await this.page.goto('https://news.ycombinator.com/submitted?id=whoishiring', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await this.randomDelay(2000, 4000);

      const latestThreadUrl = await this.page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a.titlelink, a'));
        const hiringLink = links.find(a => a.textContent?.includes('Ask HN: Who is hiring?'));
        return hiringLink ? (hiringLink as HTMLAnchorElement).href : null;
      });

      if (!latestThreadUrl) {
        console.error('[Hacker News] Could not find the latest hiring thread');
        return [];
      }

      await this.page.goto(latestThreadUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await this.randomDelay(3000, 5000);

      const comments = await this.page.evaluate(() => {
        // Top level comments usually have a specific indent width or class.
        // On HN, top level comments have a 0px spacer in the indent td.
        const allComments = Array.from(document.querySelectorAll('.comtr'));
        const topLevelComments = allComments.filter(c => {
          const indent = c.querySelector('.ind img');
          return indent && indent.getAttribute('width') === '0';
        }).slice(0, 50); // Get first 50

        return topLevelComments.map(c => {
          const textBody = c.querySelector('.commtext');
          const fullText = textBody?.textContent || '';
          // HN conventions: first line usually contains "Company | Title | Location"
          const firstLine = fullText.split('\n')[0] || '';
          const parts = firstLine.split('|').map(s => s.trim());
          
          return {
            companyName: parts[0] || '',
            description: fullText.substring(0, 500),
            sourceUrl: window.location.href + '#' + c.id
          };
        }).filter(c => c.companyName && c.companyName.length > 2);
      });

      return comments.map(c => ({
        companyName: c.companyName,
        website: '', // Extremely hard to parse deterministically without AI, leaving empty for enrichment
        description: c.description,
        source: this.platformName,
        sourceUrl: c.sourceUrl,
        careersUrl: '',
        discoveryMethod: 'DISCOVERY'
      }));

    } catch (error) {
      console.error(`[${this.platformName}] Failed to scrape.`, error);
      return [];
    }
  }
}
