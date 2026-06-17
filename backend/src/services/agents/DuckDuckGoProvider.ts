import axios from 'axios';
import * as cheerio from 'cheerio';
import { SearchProvider, SearchResult } from './SearchProvider';

export class DuckDuckGoProvider implements SearchProvider {
  async search(query: string, limit: number = 5): Promise<SearchResult[]> {
    try {
      const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const results: SearchResult[] = [];

      $('.result').each((i, element) => {
        if (results.length >= limit) return false;

        const titleElement = $(element).find('.result__title a');
        const urlElement = $(element).find('.result__url');
        const snippetElement = $(element).find('.result__snippet');

        // DuckDuckGo sometimes wraps URLs. Let's try to get the cleanest one.
        let rawUrl = urlElement.attr('href') || titleElement.attr('href') || '';
        
        // Clean duckduckgo redirect wrapper if present (e.g. //duckduckgo.com/l/?uddg=https://...)
        if (rawUrl.includes('uddg=')) {
          try {
            const urlObj = new URL(rawUrl, 'https://duckduckgo.com');
            const uddg = urlObj.searchParams.get('uddg');
            if (uddg) rawUrl = uddg;
          } catch (e) {
            // ignore parsing errors
          }
        }

        // Decode the URL if it was encoded
        try {
            rawUrl = decodeURIComponent(rawUrl);
        } catch (e) {}

        const title = titleElement.text().trim();
        const snippet = snippetElement.text().trim();

        if (rawUrl && title) {
          results.push({
            title,
            url: rawUrl,
            snippet
          });
        }
      });

      return results;
    } catch (error: any) {
      console.error('[DuckDuckGoProvider] Search error:', error.message);
      return [];
    }
  }
}
