import { chromium, Browser, BrowserContext, Page } from 'playwright';
import ScanHistory from '../../models/ScanHistory';
import RawDiscovery from '../../models/RawDiscovery';
import { AgentPipeline } from '../agents/AgentPipeline';
import { SalaryParser } from '../../utils/SalaryParser';

export interface DiscoveredCompany {
  companyName: string;
  website: string;
  description: string;
  source: string;
  sourceUrl: string;
  careersUrl: string;
  salaryText?: string;
  discoveryMethod?: 'DISCOVERY' | 'DIRECT';
}

export abstract class BaseScraper {
  protected browser: Browser | null = null;
  protected context: BrowserContext | null = null;
  protected page: Page | null = null;
  public platformName: string;
  protected scanHistoryId: string | null = null;
  protected scraperVersion = '1.0.0';
  protected stats = {
    rawCompaniesFound: 0,
    validatedCompanies: 0,
    rejectedCompanies: 0,
    duplicatesFound: 0,
    newCompaniesAdded: 0,
    totalPlacementScore: 0,
    totalAiConfidence: 0
  };

  constructor(platformName: string) {
    this.platformName = platformName;
  }

  protected async initBrowser() {
    this.browser = await chromium.launch({ headless: true });
    this.context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 720 },
    });
    this.page = await this.context.newPage();
  }

  protected async closeBrowser() {
    if (this.page) await this.page.close();
    if (this.context) await this.context.close();
    if (this.browser) await this.browser.close();
  }

  protected async randomDelay(min: number = 1000, max: number = 3000) {
    const delay = Math.floor(Math.random() * (max - min + 1) + min);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  // Common pipeline
  public async runScan(existingHistoryId?: string, sourceUrl?: string): Promise<void> {
    const startTime = Date.now();
    try {
      if (existingHistoryId) {
        this.scanHistoryId = existingHistoryId;
        await ScanHistory.findByIdAndUpdate(this.scanHistoryId, { status: 'running' });
      } else {
        const history = await ScanHistory.create({
          platform: this.platformName,
          status: 'RUNNING',
          startedAt: new Date(),
          date: new Date(),
        });
        this.scanHistoryId = history._id as unknown as string;
      }

      await this.initBrowser();
      console.log(`[SCRAPER] Using ${this.constructor.name}`);
      const discoveries = await this.discoverCompanies(sourceUrl || '');
      console.log(`[SCRAPER] Found ${discoveries.length} companies initially`);

      const filteredDiscoveries: { discovery: DiscoveredCompany, rawId: string }[] = [];
      
      for (const discovery of discoveries) {
        const parsed = SalaryParser.parse(discovery.salaryText);
        const isLowSalary = parsed.salaryMax && parsed.salaryMax < 600000;
        
        if (isLowSalary) {
          console.log(`Discarding ${discovery.companyName} due to low salary (< 6 LPA). Not saving anywhere.`);
          continue;
        }

        let rawId = '';
        if (this.scanHistoryId) {
          const rawDoc = await RawDiscovery.create({
            scanHistoryId: this.scanHistoryId,
            companyName: discovery.companyName || discovery.description?.substring(0, 50) || 'Unknown',
            website: discovery.website,
            description: discovery.description,
            source: discovery.source,
            sourceUrl: discovery.sourceUrl,
            careersUrl: discovery.careersUrl,
            salaryText: discovery.salaryText,
            status: 'PENDING'
          });
          rawId = rawDoc._id as unknown as string;
        }
        
        filteredDiscoveries.push({ discovery, rawId });
      }

      this.stats.rawCompaniesFound = filteredDiscoveries.length;
      console.log(`[SCRAPER] Proceeding with ${filteredDiscoveries.length} valid companies`);

      const pipeline = new AgentPipeline();
      
      // OPTIMIZATION: Process in parallel batches of 5 to speed up AI
      const batchSize = 5;
      for (let i = 0; i < filteredDiscoveries.length; i += batchSize) {
        const batch = filteredDiscoveries.slice(i, i + batchSize);
        const results = await Promise.all(
          batch.map(item => pipeline.processDiscoveredCompany(item.discovery, this.scanHistoryId || undefined, item.rawId))
        );
        
        results.forEach(res => {
          if (res.status === 'NEW_ADD') {
            this.stats.validatedCompanies++;
            this.stats.newCompaniesAdded++;
            if (res.placementScore) this.stats.totalPlacementScore += res.placementScore;
            if (res.confidenceScore) this.stats.totalAiConfidence += res.confidenceScore;
          } else if (res.status === 'DUPLICATE') {
            this.stats.validatedCompanies++;
            this.stats.duplicatesFound++;
          } else {
            this.stats.rejectedCompanies++;
          }
        });

        // Continuously update DB
        if (this.scanHistoryId) {
           await ScanHistory.findByIdAndUpdate(this.scanHistoryId, {
             rawCompaniesFound: this.stats.rawCompaniesFound,
             validatedCompanies: this.stats.validatedCompanies,
             rejectedCompanies: this.stats.rejectedCompanies,
             duplicatesFound: this.stats.duplicatesFound,
             newCompaniesAdded: this.stats.newCompaniesAdded,
             averagePlacementScore: this.stats.validatedCompanies > 0 ? Math.round(this.stats.totalPlacementScore / this.stats.newCompaniesAdded || 1) : 0,
             averageAiConfidence: this.stats.validatedCompanies > 0 ? Math.round(this.stats.totalAiConfidence / this.stats.newCompaniesAdded || 1) : 0,
             phase: `Processed ${Math.min(i + batchSize, filteredDiscoveries.length)} / ${filteredDiscoveries.length}`
           });
        }
      }
      
      console.log(`[VALIDATION] Accepted ${this.stats.validatedCompanies}`);
      console.log(`[VALIDATION] Rejected ${this.stats.rejectedCompanies}`);

      const durationMs = Date.now() - startTime;
      
      if (this.scanHistoryId) {
        await ScanHistory.findByIdAndUpdate(this.scanHistoryId, {
          status: 'COMPLETED',
          durationMs,
          completedAt: new Date(),
          scraperUsed: this.constructor.name,
          scraperVersion: this.scraperVersion,
          rawCompaniesFound: this.stats.rawCompaniesFound,
          validatedCompanies: this.stats.validatedCompanies,
          rejectedCompanies: this.stats.rejectedCompanies,
          duplicatesFound: this.stats.duplicatesFound,
          newCompaniesAdded: this.stats.newCompaniesAdded,
          averagePlacementScore: this.stats.validatedCompanies > 0 ? Math.round(this.stats.totalPlacementScore / this.stats.newCompaniesAdded || 1) : 0,
          averageAiConfidence: this.stats.validatedCompanies > 0 ? Math.round(this.stats.totalAiConfidence / this.stats.newCompaniesAdded || 1) : 0,
          phase: 'Done'
        });
      }
    } catch (error: any) {
      console.error(`Error in runScan for ${this.platformName}:`, error);
      const durationMs = Date.now() - startTime;
      
      if (this.scanHistoryId) {
        await ScanHistory.findByIdAndUpdate(this.scanHistoryId, {
          status: 'FAILED',
          durationMs,
          completedAt: new Date(),
          errorMessage: error.message || 'Unknown error',
          scraperUsed: this.constructor.name,
          scraperVersion: this.scraperVersion,
          rawCompaniesFound: this.stats.rawCompaniesFound,
          validatedCompanies: this.stats.validatedCompanies,
          rejectedCompanies: this.stats.rejectedCompanies,
          duplicatesFound: this.stats.duplicatesFound,
          newCompaniesAdded: this.stats.newCompaniesAdded,
        });
      }
      throw error;
    } finally {
      await this.closeBrowser();
    }
  }

  // To be implemented by specific scrapers
  protected abstract discoverCompanies(sourceUrl?: string): Promise<DiscoveredCompany[]>;
}
