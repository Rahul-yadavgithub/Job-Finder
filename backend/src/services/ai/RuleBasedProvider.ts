import { AIService, ExtractedCompanyInfo } from './AIService';

export class RuleBasedProvider implements AIService {
  public async extractAndNormalizeCompany(rawText: string, url: string): Promise<ExtractedCompanyInfo | null> {
    // Simple rule-based extraction
    // This is a fallback and will just do basic cleanup on the rawText.
    if (!rawText) return null;
    
    let normalized = rawText.trim();
    
    // Remove common suffixes
    const suffixes = [
      ' Inc.', ' Inc', ' LLC', ' LLC.', ' Ltd.', ' Ltd', ' Pvt Ltd', ' Pvt. Ltd.', 
      ' Corporation', ' Corp.', ' Corp', ' India', ' Technologies', ' Solutions'
    ];
    
    // Sort suffixes by length descending so longer suffixes are matched first
    suffixes.sort((a, b) => b.length - a.length);

    let changed = true;
    while (changed) {
      changed = false;
      for (const suffix of suffixes) {
        if (normalized.toLowerCase().endsWith(suffix.toLowerCase())) {
          normalized = normalized.substring(0, normalized.length - suffix.length).trim();
          // Remove trailing commas or dashes left behind
          normalized = normalized.replace(/[,|-]$/, '').trim();
          changed = true;
          break; // restart check in case there are multiple suffixes like "Solutions Pvt Ltd"
        }
      }
    }

    return {
      companyName: rawText.trim(),
      normalizedName: normalized,
    };
  }
}
