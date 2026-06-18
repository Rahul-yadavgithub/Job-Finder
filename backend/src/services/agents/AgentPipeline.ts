import { ValidationAgent } from './ValidationAgent';
import { EnrichmentAgent } from './EnrichmentAgent';
import { DuplicateDetectionAgent } from './DuplicateDetectionAgent';
import Company, { CompanyStatus } from '../../models/Company';
import ScanHistory from '../../models/ScanHistory';
import RawDiscovery from '../../models/RawDiscovery';
import { DiscoveredCompany } from '../scraper/BaseScraper';
import { SalaryParser } from '../../utils/SalaryParser';

export interface PipelineResult {
  status: 'NEW_ADD' | 'DUPLICATE' | 'REJECTED';
  placementScore?: number;
  confidenceScore?: number;
}

export class AgentPipeline {
  private validationAgent: ValidationAgent;
  private enrichmentAgent: EnrichmentAgent;
  private duplicateAgent: DuplicateDetectionAgent;

  constructor() {
    this.validationAgent = new ValidationAgent();
    this.enrichmentAgent = new EnrichmentAgent();
    this.duplicateAgent = new DuplicateDetectionAgent();
  }

  private calculateConfidenceScore(
    validationResult: any, 
    enrichmentResult: any
  ): number {
    let score = 0;
    
    if (validationResult.website) score += 15;
    // We don't have linkedin extraction yet, but reserve logic
    // if (validationResult.linkedinUrl) score += 10;
    // if (validationResult.careersUrl) score += 10;
    
    if (enrichmentResult.hiringType?.toLowerCase().includes('intern')) score += 15;
    if (enrichmentResult.hiringType?.toLowerCase().includes('fresher')) score += 20;
    if (enrichmentResult.fundingStage && enrichmentResult.fundingStage.toLowerCase() !== 'unknown') score += 10;
    if (enrichmentResult.engineeringRelevance?.toLowerCase() === 'high') score += 10;
    if (validationResult.isValid) score += 10;

    return Math.min(score, 100);
  }

  private calculatePlacementScore(
    validationResult: any,
    enrichmentResult: any,
    discovery: DiscoveredCompany,
    parsedSalary: any,
    startupSignals: string[]
  ): { score: number, priority: 'HIGH' | 'MEDIUM' | 'LOW' } {
    let score = 0;
    
    const hiring = enrichmentResult.hiringType?.toLowerCase() || '';
    if (hiring.includes('fresher')) score += 20;
    if (hiring.includes('intern')) score += 15;
    
    if (enrichmentResult.engineeringRelevance?.toLowerCase() === 'high') score += 15;

    const category = enrichmentResult.category?.toLowerCase() || '';
    if (category.includes('product') || category.includes('saas') || category.includes('ai') || category.includes('fintech') || category.includes('startup')) {
      score += 15;
    }

    if (discovery.careersUrl && discovery.careersUrl.length > 0) score += 10;
    
    if (startupSignals.length > 1) score += 10;

    if (parsedSalary?.salaryBand || parsedSalary?.stipendBand) score += 5;

    if (validationResult.website && validationResult.website.length > 0) score += 10;

    const finalScore = Math.min(score, 100);

    let priority: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
    if (finalScore >= 70) priority = 'HIGH';
    else if (finalScore >= 40) priority = 'MEDIUM';

    return { score: finalScore, priority };
  }

  public async processDiscoveredCompany(discovery: DiscoveredCompany, scanHistoryId?: string, rawDiscoveryId?: string, forceValidate: boolean = false): Promise<PipelineResult> {
    console.log(`Pipeline started for: ${discovery.companyName || discovery.description?.substring(0, 50)}...`);

    const updatePhase = async (phase: string) => {
      if (scanHistoryId) {
        await ScanHistory.findByIdAndUpdate(scanHistoryId, { phase });
      }
    };

    const updateRawStatus = async (status: string) => {
      if (rawDiscoveryId) {
        await RawDiscovery.findByIdAndUpdate(rawDiscoveryId, { status });
      }
    };

    // 1. Validate
    await updatePhase('Validating Companies...');
    
    let validationResult;
    // Generic scraper output needs more rigorous validation. Dedicated scrapers provide structured data directly.
    if (!forceValidate && (!discovery.companyName || !discovery.website)) {
       validationResult = await this.validationAgent.validate(discovery.sourceUrl, discovery.description);
    } else {
       // Deterministic scraper already extracted these OR forceValidate is true
       validationResult = {
         isValid: true,
         companyName: discovery.companyName || discovery.description?.substring(0, 50) || 'Unknown',
         website: discovery.website || '',
         description: discovery.description
       };
    }

    if (!forceValidate && (!validationResult.isValid || !validationResult.companyName)) {
      console.log(`Validation failed: ${validationResult.reason}`);
      await updateRawStatus('REJECTED');
      return { status: 'REJECTED' };
    }

    // 2. Duplicate Check
    await updatePhase('Checking Duplicates...');
    const normalizedName = DuplicateDetectionAgent.normalizeName(validationResult.companyName || '');
    const companyHash = DuplicateDetectionAgent.generateHash(normalizedName);
    
    // Check our database directly
    const existingDb = await Company.findOne({ companyHash });
    if (existingDb) {
      console.log(`Duplicate found in DB: ${normalizedName}. Merging history...`);
      existingDb.discoveryHistory.push({
        platform: discovery.source,
        sourceUrl: discovery.sourceUrl,
        discoveredAt: new Date()
      });
      if (!existingDb.startupSignals.includes(discovery.source)) {
        existingDb.startupSignals.push(discovery.source);
      }
      await existingDb.save();
      await updateRawStatus('DUPLICATE');
      return { status: 'DUPLICATE' };
    }

    // 3. Enrichment
    await updatePhase('Running AI Enrichment...');
    const enrichmentResult = await this.enrichmentAgent.enrich(
      validationResult.companyName || discovery.companyName || '',
      validationResult.website || discovery.website,
      validationResult.description || discovery.description
    );

    // 4. Extract Salaries
    const salaryTextToParse = discovery.salaryText || enrichmentResult.salaryRawText || enrichmentResult.stipendRawText || '';
    const parsedSalary = SalaryParser.parse(salaryTextToParse);

    const startupSignals = [discovery.source];

    // 5. Calculate Scores
    await updatePhase('Generating Placement Intelligence...');
    const confidenceScore = this.calculateConfidenceScore(validationResult, enrichmentResult);
    const placement = this.calculatePlacementScore(validationResult, enrichmentResult, discovery, parsedSalary, startupSignals);

    const isFresher = enrichmentResult.hiringType?.toLowerCase().includes('fresher') || false;
    const isIntern = enrichmentResult.hiringType?.toLowerCase().includes('intern') || false;

    // 6. Build and Save
    await updatePhase('Saving Results...');
    
    let status = CompanyStatus.PENDING_REVIEW;
    
    try {
      await Company.create({
        companyName: validationResult.companyName,
        normalizedName,
        companyHash,
        website: validationResult.website,
        description: enrichmentResult.summary || validationResult.description,
        category: enrichmentResult.category,
        foundedYear: enrichmentResult.foundedYear,
        teamSize: enrichmentResult.teamSize,
        fundingStage: enrichmentResult.fundingStage,
        
        source: {
          platform: discovery.source,
          sourceUrl: discovery.sourceUrl,
          careersUrl: discovery.careersUrl,
          discoveryMethod: discovery.discoveryMethod || 'DISCOVERY',
          discoveredAt: new Date()
        },
        discoveryHistory: [{
          platform: discovery.source,
          sourceUrl: discovery.sourceUrl,
          discoveredAt: new Date()
        }],

        hiringType: enrichmentResult.hiringType,
        internshipAvailable: isIntern,
        fresherHiring: isFresher,
        
        salaryRawText: enrichmentResult.salaryRawText,
        salaryBand: parsedSalary.salaryBand,
        stipendRawText: enrichmentResult.stipendRawText,
        stipendBand: parsedSalary.stipendBand,
        startupSignals: startupSignals,

        placementScore: placement.score,
        placementPriority: placement.priority,
        confidenceScore: confidenceScore,
        aiConfidence: enrichmentResult.aiConfidence,

        status: status,
        outreachStatus: 'NOT_CONTACTED',
        data_source: 'scanned',
        review_status: 'scanned'
      });
      console.log(`Successfully saved company: ${validationResult.companyName} with status: ${status}`);
      await updateRawStatus('VALIDATED');
      return { 
        status: 'NEW_ADD', 
        placementScore: placement.score, 
        confidenceScore: enrichmentResult.aiConfidence || confidenceScore
      };
    } catch (err) {
      console.error(`Failed to save company ${validationResult.companyName}:`, err);
      await updateRawStatus('REJECTED');
      return { status: 'REJECTED' };
    }
  }
}
