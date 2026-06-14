export interface ExtractedCompanyInfo {
  companyName: string;
  normalizedName: string;
  website?: string;
  category?: string;
}

export interface AIService {
  extractAndNormalizeCompany(rawText: string, url: string): Promise<ExtractedCompanyInfo | null>;
}
