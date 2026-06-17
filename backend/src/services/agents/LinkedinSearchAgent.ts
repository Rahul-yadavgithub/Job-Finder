import { SearchProvider } from './SearchProvider';
import { DuckDuckGoProvider } from './DuckDuckGoProvider';

export class LinkedinSearchAgent {
  private searchProvider: SearchProvider;

  constructor(provider?: SearchProvider) {
    // Default to DuckDuckGo if no provider is injected
    this.searchProvider = provider || new DuckDuckGoProvider();
  }

  /**
   * Finds the best LinkedIn profile URL for a given person at a specific company.
   * @param personName The name of the person (e.g. "Ricardo Beale")
   * @param companyName The company name (e.g. "Radisys")
   * @returns The LinkedIn profile URL or null if none found
   */
  public async findProfile(personName: string, companyName: string): Promise<string | null> {
    if (!personName || !companyName) return null;

    // Use quotes for exact matches on the names to improve accuracy
    const query = `site:linkedin.com/in "${personName}" "${companyName}"`;
    
    console.log(`[LinkedinSearchAgent] Searching for: ${query}`);
    
    try {
      const results = await this.searchProvider.search(query, 5);
      
      for (const result of results) {
        // Double check it's actually a linkedin profile URL
        if (result.url.includes('linkedin.com/in/') && !result.url.includes('/dir/')) {
          console.log(`[LinkedinSearchAgent] Found profile: ${result.url}`);
          return result.url;
        }
      }

      console.log('[LinkedinSearchAgent] No valid LinkedIn profile found in results.');
      return null;
    } catch (error: any) {
      console.error(`[LinkedinSearchAgent] Search failed:`, error.message);
      return null;
    }
  }
}
