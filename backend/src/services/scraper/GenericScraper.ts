import { BaseScraper, DiscoveredCompany } from './BaseScraper';

export class GenericScraper extends BaseScraper {
  constructor() {
    super('Custom Website');
    this.scraperVersion = '1.0.0';
  }

  protected async discoverCompanies(sourceUrl?: string): Promise<DiscoveredCompany[]> {
    if (!this.page || !sourceUrl) return [];

    console.log('[SCRAPER] Using GenericScraper (Fallback Mode)');

    try {
      await this.page.goto(sourceUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await this.randomDelay(2000, 4000);

      const data = await this.page.evaluate(() => {
        // Extract basic text to serve as the description
        const bodyText = document.body.innerText.substring(0, 1500);
        const title = document.title;
        
        // Try to find a careers link
        const links = Array.from(document.querySelectorAll('a'));
        const careerLink = links.find(l => 
          l.textContent?.toLowerCase().includes('career') || 
          l.textContent?.toLowerCase().includes('job') ||
          l.href.includes('careers')
        )?.href || '';

        // Try to filter out noise from links
        const ignoreTerms = ['privacy policy', 'terms of service', 'login', 'sign up', 'contact us', 'blog', 'facebook.com', 'twitter.com', 'linkedin.com', 'instagram.com'];
        const validLinks = links.filter(l => {
          const text = (l.textContent || '').toLowerCase();
          const href = l.href.toLowerCase();
          return !ignoreTerms.some(term => text.includes(term) || href.includes(term));
        });

        // The name might be in the title
        const companyNameGuess = title.split('|')[0]?.split('-')[0]?.trim() || '';

        return {
          companyName: companyNameGuess,
          description: bodyText,
          careersUrl: careerLink,
          website: window.location.origin
        };
      });

      // GenericScraper has a lower trust level, so we rely on the AI Pipeline's ValidationAgent
      // by not setting companyName or website fully if we're not sure, 
      // but the prompt says output must follow the same structure.
      // We will provide our best guess and let validation reject it if confidence is low.
      
      return [{
        companyName: '', // Force AI validation to run for GenericScraper by leaving this empty
        website: '', 
        description: data.description,
        source: this.platformName,
        sourceUrl: sourceUrl,
        careersUrl: data.careersUrl,
        discoveryMethod: 'DIRECT'
      }];

    } catch (error) {
      console.error(`[${this.platformName}] Failed to scrape custom website.`, error);
      return [];
    }
  }
}
