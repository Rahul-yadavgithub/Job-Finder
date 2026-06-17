import axios from 'axios';
import { PlatformAdapter, HRResult } from './adapter.interface';

export class HunterAdapter implements PlatformAdapter {
  
  async validateKey(plaintext_api_key: string): Promise<{ valid: boolean; limit: number | null }> {
    try {
      const res = await axios.get(`https://api.hunter.io/v2/account?api_key=${plaintext_api_key}`);
      
      const callsInfo = res.data?.data?.calls;
      const limit = callsInfo?.available ?? null;

      return { valid: true, limit };
    } catch (error) {
      return { valid: false, limit: null };
    }
  }

  async findHR(plaintext_api_key: string, company_name: string, titles: string[]): Promise<HRResult[]> {
    try {
      const domain = company_name.includes('.') ? company_name : `${company_name.replace(/\s+/g, '').toLowerCase()}.com`;

      // Hunter allows filtering by department. HR is available as 'hr'
      const res = await axios.get(
        `https://api.hunter.io/v2/domain-search?domain=${domain}&department=hr&api_key=${plaintext_api_key}`
      );

      const results: HRResult[] = [];
      if (res.data?.data?.emails) {
        for (const e of res.data.data.emails) {
          results.push({
            name: `${e.first_name || ''} ${e.last_name || ''}`.trim() || null,
            email: e.value || null,
            phone: e.phone_number || null,
            linkedin_url: e.linkedin || null,
            current_employer: company_name,
            job_title: e.position || null,
            confidence_score: e.confidence || 75
          });
        }
      }
      return results;

    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 429) {
        throw new Error('RATE_LIMITED');
      } else if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
        throw new Error('INVALID_KEY');
      }
      throw error;
    }
  }

  async enrichContact(plaintext_api_key: string, linkedin_url: string): Promise<HRResult | null> {
    // Hunter's email finder requires name and company, not linkedin_url natively.
    // Without full names, we can't reliably do this with Hunter standard API.
    return null;
  }
}
