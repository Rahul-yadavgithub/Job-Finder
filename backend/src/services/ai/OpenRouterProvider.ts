import axios from 'axios';
import { AIService, ExtractedCompanyInfo } from './AIService';
import { RuleBasedProvider } from './RuleBasedProvider';
import dotenv from 'dotenv';

dotenv.config();

export class OpenRouterProvider implements AIService {
  private apiKey: string;
  private model: string;
  private fallbackProvider: RuleBasedProvider;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    this.model = process.env.OPENROUTER_MODEL || 'qwen/qwen3-next-80b-a3b-instruct:free';
    this.fallbackProvider = new RuleBasedProvider();
  }

  public async extractAndNormalizeCompany(rawText: string, url: string): Promise<ExtractedCompanyInfo | null> {
    if (!rawText) return null;

    if (!this.apiKey || this.apiKey.includes('placeholder')) {
      console.warn('No valid OpenRouter API key found. Falling back to rule-based normalization.');
      return this.fallbackProvider.extractAndNormalizeCompany(rawText, url);
    }

    try {
      const prompt = `
You are an expert company data extractor. 
Given the following raw company name string (often scraped from job boards) and the job URL, 
extract the true company name, provide a clean "normalized" version of it (e.g., "Google India Pvt Ltd" -> "Google"), 
and if possible, guess their website or category based on the name.

Raw Text: "${rawText}"
Job URL: "${url}"

Return ONLY a valid JSON object with the following structure (do not include markdown tags, just the JSON):
{
  "companyName": "The exact name as extracted from Raw Text",
  "normalizedName": "The clean, shortened version without suffixes like Inc, LLC, etc.",
  "website": "example.com (if known or guessable, otherwise null)",
  "category": "Industry category (e.g., Tech, Finance) or null"
}
`;

      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: this.model,
          messages: [
            { role: 'user', content: prompt }
          ],
          response_format: { type: "json_object" }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'Job Finder Platform'
          }
        }
      );

      const content = response.data?.choices?.[0]?.message?.content;
      if (!content) {
         throw new Error("No content received from OpenRouter");
      }
      
      // Attempt to parse JSON safely (cleaning markdown formatting if present)
      const cleanContent = content.trim().replace(/^```json/i, '').replace(/```$/, '').trim();
      const parsed = JSON.parse(cleanContent);
      
      return {
        companyName: parsed.companyName || rawText,
        normalizedName: parsed.normalizedName || rawText,
        website: parsed.website || undefined,
        category: parsed.category || undefined
      };

    } catch (error) {
      console.error('OpenRouter API failed. Falling back to rule-based normalization.', error);
      return this.fallbackProvider.extractAndNormalizeCompany(rawText, url);
    }
  }
}
