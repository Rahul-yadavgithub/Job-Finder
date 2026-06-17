export interface HRResult {
  name: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  current_employer: string | null;
  job_title: string | null;
  confidence_score: number; // 0-100
  location?: string | null; // e.g., "India", "US", "Mumbai, India"
}

export interface PlatformAdapter {
  /**
   * Validates if the given plaintext key/credentials are working.
   * Resolves with validity and rate limit constraints.
   */
  validateKey(plaintext_api_key: string): Promise<{ valid: boolean; limit: number | null }>;

  /**
   * Finds HR contacts for a given company name or domain.
   */
  findHR(plaintext_api_key: string, company_name: string, titles: string[]): Promise<HRResult[]>;

  /**
   * Enriches a specific contact based on their LinkedIn URL.
   */
  enrichContact(plaintext_api_key: string, linkedin_url: string): Promise<HRResult | null>;
}
