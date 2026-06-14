import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export interface ValidationResult {
  isValid: boolean;
  companyName?: string;
  website?: string;
  description?: string;
  reason?: string;
}

export class ValidationAgent {
  private apiKey: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    this.model = 'openai/gpt-4o-mini';
  }

  // Rule-based HTTP check
  private async checkUrl(url: string): Promise<boolean> {
    try {
      const response = await axios.head(url, { timeout: 5000, validateStatus: () => true });
      return response.status >= 200 && response.status < 400;
    } catch {
      try {
        const response = await axios.get(url, { timeout: 5000, validateStatus: () => true });
        return response.status >= 200 && response.status < 400;
      } catch {
        return false;
      }
    }
  }

  public async validate(sourceUrl: string, rawText: string): Promise<ValidationResult> {
    // 1. Rule-based checks
    const isSourceValid = await this.checkUrl(sourceUrl);
    if (!isSourceValid) {
      return { isValid: false, reason: 'Source URL is invalid or unreachable' };
    }

    if (!this.apiKey || this.apiKey.includes('placeholder')) {
       console.warn('No OpenRouter API key found. Skipping LLM validation, relying on simple parsing.');
       return { isValid: true, companyName: rawText }; // Fallback
    }

    // 2. LLM Validation via OpenRouter
    const prompt = `
You are a strict Company Verification Agent.

Rules:
* Extract the official company name.
* Extract the company's official website URL if mentioned or easily inferable.
* Extract a brief description of what the company does from the text.
* Never hallucinate information not present or directly related.

Evaluate this raw company text/snippet: "${rawText}"
Source URL context: "${sourceUrl}"

Respond ONLY with valid JSON (no markdown):
{
  "companyName": "extracted official name or null",
  "website": "extracted official website or null",
  "description": "extracted description or null"
}
`;

    try {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: "json_object" }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const content = response.data?.choices?.[0]?.message?.content;
      if (!content) return { isValid: false, reason: 'Empty response from LLM' };
      
      const cleanContent = content.trim().replace(/^```json/i, '').replace(/```$/, '').trim();
      const parsed = JSON.parse(cleanContent);
      
      // Strict Validation Layer (Module 4)
      if (!parsed.companyName || parsed.companyName.trim() === '') {
        return { isValid: false, reason: 'Missing Company Name' };
      }
      if (!parsed.website || parsed.website.trim() === '') {
        return { isValid: false, reason: 'Missing Website' };
      }
      if (!parsed.description || parsed.description.trim().length < 20) {
        return { isValid: false, reason: 'Description missing or too short' };
      }

      return {
        isValid: true,
        companyName: parsed.companyName.trim(),
        website: parsed.website.trim(),
        description: parsed.description.trim()
      };

    } catch (error: any) {
      console.error('LLM Validation failed:', error.message);
      return { isValid: false, reason: 'LLM error' };
    }
  }
}
