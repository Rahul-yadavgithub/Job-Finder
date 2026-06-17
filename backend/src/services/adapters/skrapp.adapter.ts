import axios from 'axios';
import { PlatformAdapter, HRResult } from './adapter.interface';

export class SkrappAdapter implements PlatformAdapter {
  
  async validateKey(plaintext_api_key: string): Promise<{ valid: boolean; limit: number | null }> {
    try {
      const res = await axios.get('https://api.skrapp.io/api/v2/account', {
        headers: { 'X-Access-Key': plaintext_api_key }
      });
      return { valid: res.status === 200, limit: null }; // Limit not returned natively in health check usually
    } catch (error) {
      return { valid: false, limit: null };
    }
  }

  async findHR(plaintext_api_key: string, company_name: string, titles: string[]): Promise<HRResult[]> {
    try {
      const domain = company_name.includes('.') ? company_name : `${company_name.replace(/\s+/g, '').toLowerCase()}.com`;

      const res = await axios.get(
        `https://api.skrapp.io/api/v2/company?domain=${domain}`,
        { headers: { 'X-Access-Key': plaintext_api_key } }
      );

      const results: HRResult[] = [];
      if (res.data?.company?.emails) {
        for (const e of res.data.company.emails) {
          results.push({
            name: `${e.firstName || ''} ${e.lastName || ''}`.trim() || null,
            email: e.email || null,
            phone: null,
            linkedin_url: null,
            current_employer: company_name,
            job_title: e.position || null,
            confidence_score: 80
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
    return null;
  }
}
