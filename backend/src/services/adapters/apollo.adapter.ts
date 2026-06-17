import axios from 'axios';
import { PlatformAdapter, HRResult } from './adapter.interface';

export class ApolloAdapter implements PlatformAdapter {
  
  async validateKey(plaintext_api_key: string): Promise<{ valid: boolean; limit: number | null }> {
    try {
      const res = await axios.get('https://api.apollo.io/v1/auth/health', {
        headers: {
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json',
          'x-api-key': plaintext_api_key
        }
      });
      
      return { 
        valid: res.data.is_logged_in === true, 
        limit: null // Apollo limit varies by plan, usually handle via rate limit headers
      };
    } catch (error) {
      return { valid: false, limit: null };
    }
  }

  async findHR(plaintext_api_key: string, company_name: string, titles: string[]): Promise<HRResult[]> {
    try {
      const domain = company_name.includes('.') ? company_name : `${company_name.replace(/\s+/g, '').toLowerCase()}.com`;

      const fetchApollo = async (locations: string[] = []) => {
        const res = await axios.post(
          'https://api.apollo.io/v1/mixed_people/search',
          { 
            q_organization_domains: domain, 
            page: 1, 
            person_titles: titles,
            ...(locations.length > 0 ? { person_locations: locations } : {})
          },
          { 
            headers: { 
              'Cache-Control': 'no-cache', 
              'Content-Type': 'application/json', 
              'x-api-key': plaintext_api_key 
            }
          }
        );
        return res;
      };

      // 1. Try specifically for India
      let res = await fetchApollo(["India"]);
      
      // 2. Fallback to global search if no Indians found
      if (!res.data?.people || res.data.people.length === 0) {
        res = await fetchApollo([]);
      }

      const results: HRResult[] = [];
      if (res.data?.people) {
        for (const p of res.data.people) {
          const location = [p.city, p.state, p.country].filter(Boolean).join(', ');
          results.push({
            name: p.name || null,
            email: p.email || null,
            phone: p.phone_numbers?.[0]?.sanitized_number || null,
            linkedin_url: p.linkedin_url || null,
            current_employer: p.organization?.name || null,
            job_title: p.title || null,
            confidence_score: p.email ? 95 : 60,
            location: location || null
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
    try {
      const res = await axios.post(
        'https://api.apollo.io/v1/people/match',
        { linkedin_url },
        { 
          headers: { 
            'Cache-Control': 'no-cache', 
            'Content-Type': 'application/json', 
            'x-api-key': plaintext_api_key 
          }
        }
      );

      const p = res.data?.person;
      if (!p) return null;

      return {
        name: p.name || null,
        email: p.email || null,
        phone: p.phone_numbers?.[0]?.sanitized_number || null,
        linkedin_url: p.linkedin_url || null,
        current_employer: p.organization?.name || null,
        job_title: p.title || null,
        confidence_score: p.email ? 95 : 60
      };

    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 429) {
        throw new Error('RATE_LIMITED');
      } else if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
        throw new Error('INVALID_KEY');
      }
      throw error;
    }
  }
}
