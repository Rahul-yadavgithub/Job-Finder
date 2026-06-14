import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export class CampusIntelligenceAgent {
  private apiKey: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    this.model = 'qwen/qwen-2.5-72b-instruct'; // Fallback
  }

  public async evaluate(companyName: string, description?: string): Promise<'HIGH' | 'MEDIUM' | 'LOW'> {
    if (!this.apiKey || this.apiKey.includes('placeholder')) {
      return 'LOW'; // Fallback
    }

    const prompt = `
You are a Campus Hiring Intelligence Agent.
Evaluate the following company's likelihood or history of hiring from top Indian universities (IITs, NITs, IIITs) or conducting campus placements.

Company Name: "${companyName}"
Description: "${description || 'Unknown'}"

Based on the company size, industry (e.g., tech startups, large IT firms, FAANG usually hire from campuses), and general knowledge, output their campus hiring confidence level.

Return ONLY a valid JSON object (no markdown):
{
  "campusHiringConfidence": "HIGH" | "MEDIUM" | "LOW"
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
      if (!content) return 'LOW';
      
      const cleanContent = content.trim().replace(/^```json/i, '').replace(/```$/, '').trim();
      const parsed = JSON.parse(cleanContent);
      
      const conf = parsed.campusHiringConfidence;
      if (conf === 'HIGH' || conf === 'MEDIUM' || conf === 'LOW') {
        return conf;
      }
      return 'LOW';
    } catch (error: any) {
      console.error('LLM Campus Intelligence failed:', error.message);
      return 'LOW';
    }
  }
}
