import axios from 'axios';
import { PlatformAdapter, HRResult } from './adapter.interface';

export class LushaAdapter implements PlatformAdapter {
  
  async validateKey(plaintext_api_key: string): Promise<{ valid: boolean; limit: number | null }> {
    try {
      // Testing the key with a generic lightweight ping
      const res = await axios.get('https://api.lusha.com/person?firstName=test&company=test', {
        headers: { 'api_key': plaintext_api_key }
      });
      return { valid: res.status === 200, limit: null };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // 404 or 402 can sometimes mean plan limits or no results, but 401/403 is invalid
        if (error.response?.status === 401 || error.response?.status === 403) {
          return { valid: false, limit: null };
        }
        // If it's a 404 on a test query, the key might still be valid
        if (error.response?.status === 404) {
          return { valid: true, limit: null };
        }
      }
      return { valid: false, limit: null };
    }
  }

  async findHR(plaintext_api_key: string, company_name: string, titles: string[]): Promise<HRResult[]> {
    try {
      // Note: Lusha is strict and expensive. We try a basic search for the company and 'HR' title.
      // Standard docs usually require company and title filters.
      const res = await axios.get(
        `https://api.lusha.com/person?company=${encodeURIComponent(company_name)}&title=${encodeURIComponent('HR')}`,
        { 
          headers: { 'api_key': plaintext_api_key }
        }
      );

      const results: HRResult[] = [];
      const data = res.data?.data || (res.data ? [res.data] : []);
      
      for (const p of data) {
        if (!p) continue;
        results.push({
          name: `${p.firstName || ''} ${p.lastName || ''}`.trim() || null,
          email: p.emailAddresses?.[0]?.email || null,
          phone: p.phoneNumbers?.[0]?.number || null,
          linkedin_url: p.socialLinks?.linkedin || null,
          current_employer: p.company?.name || company_name,
          job_title: p.jobTitle || null,
          confidence_score: 85
        });
      }
      return results;

    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 429) {
        throw new Error('RATE_LIMITED');
      } else if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
        throw new Error('INVALID_KEY');
      } else if (axios.isAxiosError(error) && error.response?.status === 402) {
        // Payment Required / Out of Credits
        throw new Error('RATE_LIMITED'); 
      }
      // For lusha, if it fails for other reasons (e.g. plan doesn't support it), just return empty instead of failing the queue
      console.warn('[LushaAdapter] Failed to fetch or feature not available on this plan:', error instanceof Error ? error.message : 'Unknown error');
      return [];
    }
  }

  async enrichContact(plaintext_api_key: string, linkedin_url: string): Promise<HRResult | null> {
    try {
      const res = await axios.get(
        `https://api.lusha.com/person?linkedinUrl=${encodeURIComponent(linkedin_url)}`,
        { 
          headers: { 'api_key': plaintext_api_key }
        }
      );

      const p = res.data?.data?.[0] || res.data;
      if (!p || !p.firstName) return null;

      return {
        name: `${p.firstName || ''} ${p.lastName || ''}`.trim() || null,
        email: p.emailAddresses?.[0]?.email || null,
        phone: p.phoneNumbers?.[0]?.number || null,
        linkedin_url: p.socialLinks?.linkedin || linkedin_url,
        current_employer: p.company?.name || null,
        job_title: p.jobTitle || null,
        confidence_score: 95
      };

    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 429) {
        throw new Error('RATE_LIMITED');
      } else if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
        throw new Error('INVALID_KEY');
      } else if (axios.isAxiosError(error) && error.response?.status === 402) {
        throw new Error('RATE_LIMITED'); 
      }
      console.warn('[LushaAdapter] Enrich failed or feature not available on this plan');
      return null;
    }
  }
}
