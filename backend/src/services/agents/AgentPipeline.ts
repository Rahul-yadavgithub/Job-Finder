import { ValidationAgent } from './ValidationAgent';
import { EnrichmentAgent } from './EnrichmentAgent';
import { DuplicateDetectionAgent } from './DuplicateDetectionAgent';
import Company, { CompanyStatus } from '../../models/Company';
import ScanHistory from '../../models/ScanHistory';
import RawDiscovery from '../../models/RawDiscovery';
import { DiscoveredCompany } from '../scraper/BaseScraper';
import { SalaryParser } from '../../utils/SalaryParser';
import { supabase } from '../../config/supabase';

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

    const updateRawStatus = async (status: string, additionalData?: any) => {
      if (rawDiscoveryId) {
        await RawDiscovery.findByIdAndUpdate(rawDiscoveryId, { status, ...additionalData });
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

    // 2. Duplicate Check (Supabase is Primary Source of Truth)
    await updatePhase('Checking Duplicates...');
    const normalizedName = DuplicateDetectionAgent.normalizeName(validationResult.companyName || '');
    const companyHash = DuplicateDetectionAgent.generateHash(normalizedName);
    
    // Level 1: Fetch potential matches from Supabase using the first word to narrow down, then normalize in JS
    const firstWord = (validationResult.companyName || '').split(' ')[0].replace(/[^a-zA-Z0-9]/g, '');
    let existsInSupabase = false;
    
    if (firstWord.length > 1) {
      const { data: potentialMatches } = await supabase
        .from('companies')
        .select('company_name')
        .eq('status', 'active')
        .ilike('company_name', `${firstWord}%`);
        
      if (potentialMatches && potentialMatches.length > 0) {
        for (const match of potentialMatches) {
          if (DuplicateDetectionAgent.normalizeName(match.company_name) === normalizedName) {
            existsInSupabase = true;
            break;
          }
        }
      }
    } else {
      // Fallback if first word is too short: fetch all or do direct ilike on full name
      const { data: exactMatch } = await supabase
        .from('companies')
        .select('company_name')
        .eq('status', 'active')
        .ilike('company_name', validationResult.companyName?.trim() || '');
      if (exactMatch && exactMatch.length > 0) existsInSupabase = true;
    }

    if (existsInSupabase) {
      console.log(`Duplicate found in Supabase: ${normalizedName}. Ignoring completely.`);
      await updateRawStatus('DUPLICATE');
      return { status: 'DUPLICATE' };
    }

    // Defensive Check in MongoDB
    const existingMongo = await Company.findOne({ companyHash });
    if (existingMongo) {
      console.log(`Duplicate found in MongoDB Staging: ${normalizedName}. Updating history...`);
      existingMongo.discoveryHistory.push({
        platform: discovery.source,
        sourceUrl: discovery.sourceUrl,
        discoveredAt: new Date()
      });
      if (!existingMongo.startupSignals.includes(discovery.source)) {
        existingMongo.startupSignals.push(discovery.source);
      }
      await existingMongo.save();
      await updateRawStatus('DUPLICATE');
      return { status: 'DUPLICATE' };
    }
    
    const existingHistory = await RawDiscovery.findOne({ companyHash, status: { $in: ['REJECTED', 'MANUALLY_APPROVED'] } });
    if (existingHistory) {
      console.log(`Duplicate found in RawDiscovery History Queue: ${normalizedName}. Ignoring.`);
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

    // 6. Build and Save depending on Validation
    await updatePhase('Saving Results...');
    
    try {
      // Check if validation passed (for scanner discoveries, they typically pass ValidationAgent but might fail Enrichment)
      // Actually, if validationAgent already failed, we returned early. But let's check enrichment confidence.
      const isValidated = confidenceScore >= 40 || validationResult.isValid;

      const history = await ScanHistory.findById(scanHistoryId).select('branchId').lean();
      const branchId = history?.branchId;

      if (isValidated) {
        await Company.create({
          companyName: validationResult.companyName,
          normalizedName,
          companyHash,
          website: validationResult.website,
          description: enrichmentResult.summary || validationResult.description,
          category: enrichmentResult.category,
          branchCategory: enrichmentResult.branchCategory,
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
  
          assignedBranch: branchId || undefined,
          syncStatus: branchId ? 'pending' : undefined,

          placementScore: placement.score,
          placementPriority: placement.priority,
          confidenceScore: confidenceScore,
          aiConfidence: enrichmentResult.aiConfidence,
  
          status: CompanyStatus.PENDING_REVIEW,
          outreachStatus: 'NOT_CONTACTED',
          data_source: 'scanned',
          review_status: 'scanned' // Ready for sync queue
        });
        console.log(`Successfully saved validated company: ${validationResult.companyName}`);
        await updateRawStatus('VALIDATED');
        return { 
          status: 'NEW_ADD', 
          placementScore: placement.score, 
          confidenceScore: enrichmentResult.aiConfidence || confidenceScore
        };
      } else {
        // Failed Validation -> Move to History Queue (update RawDiscovery)
        await updateRawStatus('REJECTED', {
          normalizedName,
          companyHash,
          validationResult: enrichmentResult,
          failureReason: 'AI Validation score too low or missing critical data'
        });
        console.log(`Updated failed company in RawDiscovery History: ${validationResult.companyName}`);
        return { status: 'REJECTED' };
      }
    } catch (err) {
      console.error(`Failed to save company ${validationResult.companyName}:`, err);
      await updateRawStatus('REJECTED');
      return { status: 'REJECTED' };
    }
  }
}
