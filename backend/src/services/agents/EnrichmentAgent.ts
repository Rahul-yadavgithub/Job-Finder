import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export interface EnrichmentResult {
  category?: string;
  hiringType?: string;
  engineeringRelevance?: string;
  summary?: string;
  teamSize?: string;
  fundingStage?: string;
  foundedYear?: string;
  salaryRawText?: string;
  stipendRawText?: string;
  aiConfidence: number;
}

export class EnrichmentAgent {
  private apiKey: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    this.model = 'qwen/qwen-2.5-72b-instruct'; // Fallback if exact model name is different
  }

  public async enrich(companyName: string, website?: string, rawContext?: string): Promise<EnrichmentResult> {
    if (!this.apiKey || this.apiKey.includes('placeholder')) {
      return {
        summary: 'Auto-generated placeholder summary (API Key missing).',
        category: 'Unknown',
        hiringType: 'Mixed',
        aiConfidence: 50
      };
    }

    const prompt = `
You are a Company Enrichment Agent.
Research the following company and provide deep metadata.
Company Name: "${companyName}"
Website: "${website || 'Unknown'}"
Additional Context from scraping: "${rawContext || 'None'}"

Tasks:
1. Determine Company Category (e.g. Startup, Product, Service, FinTech, AI, SaaS, Cybersecurity, Healthcare)
2. Determine Hiring Type (Internship, Freshers, Experienced, Mixed) based on context or general knowledge.
3. Assess Engineering Relevance (High, Medium, Low) - How relevant is this company for CS/Engineering students?
4. Generate a 3 line company summary.
5. Extract team size, funding stage, and founded year if available.
6. Extract ANY raw salary information (e.g. "6-10 LPA", "Competitive", "Industry Standard") into salaryRawText. If absolutely no salary info is found, return null. DO NOT invent salaries.
7. Extract ANY raw stipend information (e.g. "20k/month", "15000") into stipendRawText. If none, return null. DO NOT invent stipends.
8. Provide an AI Confidence score (0-100) representing how confident you are in this metadata.

Return ONLY a valid JSON object (no markdown tags):
{
  "category": "e.g., AI",
  "hiringType": "e.g., Freshers",
  "engineeringRelevance": "High",
  "summary": "Your 3 line summary here",
  "teamSize": "e.g., 11-50",
  "fundingStage": "e.g., Seed",
  "foundedYear": "e.g., 2021",
  "salaryRawText": "6-10 LPA",
  "stipendRawText": null,
  "aiConfidence": 95
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
      if (!content) return { aiConfidence: 0 };
      
      const cleanContent = content.trim().replace(/^```json/i, '').replace(/```$/, '').trim();
      const parsed = JSON.parse(cleanContent);
      
      return {
        category: parsed.category,
        hiringType: parsed.hiringType,
        engineeringRelevance: parsed.engineeringRelevance,
        summary: parsed.summary,
        teamSize: parsed.teamSize,
        fundingStage: parsed.fundingStage,
        foundedYear: parsed.foundedYear,
        salaryRawText: parsed.salaryRawText,
        stipendRawText: parsed.stipendRawText,
        aiConfidence: typeof parsed.aiConfidence === 'number' ? parsed.aiConfidence : parseInt(parsed.aiConfidence) || 0
      };
    } catch (error: any) {
      console.error('LLM Enrichment failed:', error.message);
      return { aiConfidence: 0 };
    }
  }
}
