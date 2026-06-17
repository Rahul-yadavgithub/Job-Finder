import axios from 'axios';
import { PlatformAdapter, HRResult } from './adapter.interface';

export class GetProspectAdapter implements PlatformAdapter {
  
  async validateKey(plaintext_api_key: string): Promise<{ valid: boolean; limit: number | null }> {
    try {
      const res = await axios.get('https://api.getprospect.com/api/v1/users/current', {
        headers: { 'apiKey': plaintext_api_key }
      });
      return { valid: res.status === 200, limit: null };
    } catch (error) {
      return { valid: false, limit: null };
    }
  }

  async findHR(plaintext_api_key: string, company_name: string, titles: string[]): Promise<HRResult[]> {
    try {
      const domain = company_name.includes('.') ? company_name : `${company_name.replace(/\s+/g, '').toLowerCase()}.com`;

      const res = await axios.post(
        'https://api.getprospect.com/api/v1/search/contacts',
        { filters: [{ field: 'domain', operator: 'exact', value: domain }], limit: 10 },
        { headers: { 'apiKey': plaintext_api_key } }
      );

      const results: HRResult[] = [];
      const contacts = res.data?.data || res.data?.contacts || (Array.isArray(res.data) ? res.data : []);
      
      for (const c of contacts) {
        const info = c.attributes || c;
        if (info.email) {
          results.push({
            name: `${info.first_name || info.firstName || ''} ${info.last_name || info.lastName || ''}`.trim() || null,
            email: info.email,
            phone: info.phone || info.mobile || null,
            linkedin_url: info.linkedin_url || null,
            current_employer: company_name,
            job_title: info.position || info.title || null,
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
    return null; // Similar to hunter, getprospect might not expose a pure linkedin_url -> contact enrichment publicly
  }
}
