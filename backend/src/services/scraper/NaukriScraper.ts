import { BaseScraper, DiscoveredCompany } from './BaseScraper';

export class NaukriScraper extends BaseScraper {
  constructor() {
    super('Naukri');
    this.scraperVersion = '1.0.0';
  }

  protected async discoverCompanies(sourceUrl?: string): Promise<DiscoveredCompany[]> {
    if (!this.page) throw new Error('Browser not initialized');

    const baseUrl = sourceUrl || 'https://www.naukri.com/companies-hiring-in-india?src=nc_homepage_srch&title=Explore+jobs+by+top+companies&searchType=companySearch&qccustomTag=195&qcallExperience=0';
    let allDiscoveries: DiscoveredCompany[] = [];

    try {
      await this.page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await this.randomDelay(3000, 5000);

      const filters = ['Corporate', 'Indian MNC', 'Foreign MNC', 'Startup'];

      for (const filter of filters) {
        console.log(`[NaukriScraper] Applying filter: ${filter}`);
        try {
          // Attempt to find and click the filter checkbox by label
          const filterHandle = await this.page.evaluateHandle((filterText) => {
            const labels = Array.from(document.querySelectorAll('label, span, a'));
            return labels.find(l => l.textContent?.toLowerCase().includes(filterText.toLowerCase()));
          }, filter);

          if (filterHandle) {
            await (filterHandle as any).click();
            await this.randomDelay(2000, 4000);
          }
        } catch (e) {
          console.log(`[NaukriScraper] Could not apply filter: ${filter}`);
        }

        // Scroll to load more
        for (let i = 0; i < 3; i++) {
          await this.page.evaluate(() => window.scrollBy(0, document.body.scrollHeight));
          await this.randomDelay(1000, 2000);
        }

        const jobs = await this.page.evaluate(() => {
          const jobCards = Array.from(document.querySelectorAll('.srp-jobtuple-wrapper, article.jobTuple, .jobTuple, .tuple')).slice(0, 100);
          return jobCards.map(card => {
            const titleEl = card.querySelector('.title, .job-title');
            const companyEl = card.querySelector('.comp-name, .company-name');
            const linkEl = card.querySelector('.title, .job-title, a.title');
            const salaryEl = card.querySelector('.salary, .sal');
            
            const title = titleEl?.textContent?.trim() || '';
            const companyName = companyEl?.textContent?.trim() || '';
            const description = `${companyName} hiring for ${title}`;
            const salaryText = salaryEl?.textContent?.trim() || '';
            
            return {
              companyName,
              website: '',
              description,
              salaryText,
              sourceUrl: (linkEl as HTMLAnchorElement)?.href || window.location.href,
            };
          });
        });

        const mappedJobs = jobs.filter(j => j.companyName).map(j => ({
          companyName: j.companyName,
          website: j.website,
          description: j.description,
          salaryText: j.salaryText,
          source: this.platformName,
          sourceUrl: j.sourceUrl,
          careersUrl: '',
          discoveryMethod: 'DISCOVERY' as const
        }));

        allDiscoveries = [...allDiscoveries, ...mappedJobs];

        // Try to uncheck the filter
        try {
          const activeFilterHandle = await this.page.evaluateHandle((filterText) => {
             const activeLabels = Array.from(document.querySelectorAll('.active, input:checked + label, label'));
             return activeLabels.find(l => l.textContent?.toLowerCase().includes(filterText.toLowerCase()));
          }, filter);
          if (activeFilterHandle) {
             await (activeFilterHandle as any).click();
             await this.randomDelay(1000, 2000);
          }
        } catch(e) {}
      }

      // Deduplicate by company name
      const uniqueDiscoveries = Array.from(new Map(allDiscoveries.map(item => [item.companyName, item])).values());
      return uniqueDiscoveries;

    } catch (error) {
      console.error(`[${this.platformName}] Failed to scrape.`, error);
      return allDiscoveries;
    }
  }
}
