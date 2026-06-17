import axios from 'axios';
import { PlatformAdapter, HRResult } from './adapter.interface';

interface SnovTokenCache {
  accessToken: string;
  expiresAt: number; // Unix timestamp in milliseconds
}

// In-memory cache for OAuth tokens to prevent redundant auth requests
const tokenCache = new Map<string, SnovTokenCache>();

export class SnovAdapter implements PlatformAdapter {
  
  /**
   * Exchanges the client_id:client_secret for a short-lived bearer token.
   * Caches the token in memory to optimize subsequent requests.
   */
  private async getAccessToken(credentials: string): Promise<string> {
    const cached = tokenCache.get(credentials);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.accessToken;
    }

    const [clientId, clientSecret] = credentials.split(':');
    if (!clientId || !clientSecret) {
      throw new Error('INVALID_KEY');
    }

    try {
      const res = await axios.post('https://api.snov.io/v1/oauth/access_token', {
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret
      });

      const accessToken = res.data.access_token;
      // Snov tokens usually expire in 3600 seconds (1 hour)
      // We set expiration to 55 minutes to be safe
      const expiresIn = (res.data.expires_in || 3600) * 1000;
      const expiresAt = Date.now() + expiresIn - (5 * 60 * 1000); 

      tokenCache.set(credentials, { accessToken, expiresAt });
      return accessToken;
    } catch (error) {
      throw new Error('INVALID_KEY');
    }
  }

  async validateKey(plaintext_api_key: string): Promise<{ valid: boolean; limit: number | null }> {
    try {
      const token = await this.getAccessToken(plaintext_api_key);
      const res = await axios.post('https://api.snov.io/v1/get-balance', {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      return { 
        valid: res.data.success === true, 
        limit: res.data.balance || null 
      };
    } catch (error) {
      return { valid: false, limit: null };
    }
  }

  async findHR(plaintext_api_key: string, company_name: string, titles: string[]): Promise<HRResult[]> {
    try {
      const token = await this.getAccessToken(plaintext_api_key);
      const domain = company_name.includes('.') ? company_name : `${company_name.replace(/\s+/g, '').toLowerCase()}.com`;

      const res = await axios.post(
        'https://api.snov.io/v2/domain-emails-with-info',
        { 
          domain, 
          type: 'all', 
          limit: 20 
        },
        { 
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      const results: HRResult[] = [];
      if (res.data?.emails) {
        for (const e of res.data.emails) {
          results.push({
            name: `${e.firstName || ''} ${e.lastName || ''}`.trim() || null,
            email: e.email || null,
            phone: null,
            linkedin_url: null,
            current_employer: company_name,
            job_title: e.position || null,
            confidence_score: e.status === 'valid' ? 95 : 70
          });
        }
      }
      return results;

    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 429) {
        throw new Error('RATE_LIMITED');
      } else if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
        // Clear token cache on auth failure
        tokenCache.delete(plaintext_api_key);
        throw new Error('INVALID_KEY');
      }
      throw error;
    }
  }

  async enrichContact(plaintext_api_key: string, linkedin_url: string): Promise<HRResult | null> {
    try {
      const token = await this.getAccessToken(plaintext_api_key);
      const res = await axios.post(
        'https://api.snov.io/v1/get-emails-from-linkedin',
        { url: linkedin_url },
        { 
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (!res.data?.data?.[0]) return null;

      const p = res.data.data[0];
      return {
        name: p.name || null,
        email: p.emails?.[0]?.email || null,
        phone: null,
        linkedin_url: linkedin_url,
        current_employer: p.currentJob?.[0]?.companyName || null,
        job_title: p.currentJob?.[0]?.position || null,
        confidence_score: 90
      };

    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 429) {
        throw new Error('RATE_LIMITED');
      } else if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
        tokenCache.delete(plaintext_api_key);
        throw new Error('INVALID_KEY');
      }
      throw error;
    }
  }
}
