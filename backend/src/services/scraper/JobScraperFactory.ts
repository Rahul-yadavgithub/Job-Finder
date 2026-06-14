import { BaseScraper } from './BaseScraper';
import { WellfoundScraper } from './WellfoundScraper';
import { YCScraper } from './YCScraper';
import { GreenhouseScraper } from './GreenhouseScraper';
import { LeverScraper } from './LeverScraper';
import { AshbyScraper } from './AshbyScraper';
import { ProductHuntScraper } from './ProductHuntScraper';
import { HackerNewsHiringScraper } from './HackerNewsHiringScraper';
import { GitHubTrendingCompaniesScraper } from './GitHubTrendingCompaniesScraper';
import { NaukriScraper } from './NaukriScraper';
import { InstahyreScraper } from './InstahyreScraper';
import { FounditScraper } from './FounditScraper';
import { CutShortScraper } from './CutShortScraper';
import { HiristScraper } from './HiristScraper';
import { HasJobScraper } from './HasJobScraper';
import { LinkedInIndiaScraper } from './LinkedInIndiaScraper';
import { WellfoundIndiaScraper } from './WellfoundIndiaScraper';
import { GenericScraper } from './GenericScraper';

export class JobScraperFactory {
  static getScraper(platform: string): BaseScraper {
    switch (platform) {
      case 'Y Combinator':
        return new YCScraper();
      case 'Wellfound':
        return new WellfoundScraper();
      case 'Greenhouse':
        return new GreenhouseScraper();
      case 'Lever':
        return new LeverScraper();
      case 'Ashby':
        return new AshbyScraper();
      case 'Product Hunt':
        return new ProductHuntScraper();
      case 'Hacker News':
        return new HackerNewsHiringScraper();
      case 'GitHub Trending':
        return new GitHubTrendingCompaniesScraper();
      case 'Custom Website':
        return new GenericScraper();
      case 'Naukri':
        return new NaukriScraper();
      case 'Instahyre':
        return new InstahyreScraper();
      case 'Foundit':
        return new FounditScraper();
      case 'CutShort':
        return new CutShortScraper();
      case 'Hirist':
        return new HiristScraper();
      case 'HasJob':
        return new HasJobScraper();
      case 'LinkedIn India':
        return new LinkedInIndiaScraper();
      case 'Wellfound India':
        return new WellfoundIndiaScraper();
      default:
        console.warn(`[FACTORY] Unknown platform ${platform}, falling back to GenericScraper`);
        return new GenericScraper();
    }
  }
}
