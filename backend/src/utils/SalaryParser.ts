export class SalaryParser {
  /**
   * Deterministically extract salary/stipend bands from raw text.
   */
  public static parse(rawText: string | undefined): {
    salaryMin?: number;
    salaryMax?: number;
    salaryBand?: string;
    stipendMin?: number;
    stipendMax?: number;
    stipendBand?: string;
    rawText: string;
  } {
    if (!rawText) return { rawText: '' };
    
    const text = rawText.toLowerCase().replace(/,/g, '');
    let result: any = { rawText };

    // Match LPA (e.g., 3 LPA, 6-10 LPA, 8.5 to 12.5 LPA, ₹4,00,000 per annum)
    const lpaMatch = text.match(/([\d\.]+)\s*(?:-|to)\s*([\d\.]+)\s*(?:lpa|lakhs? per annum|lakhs?\/yr)/i);
    const lpaSingleMatch = text.match(/([\d\.]+)\s*(?:lpa|lakhs? per annum|lakhs?\/yr)/i);
    const paMatch = text.match(/(?:₹|rs\.?|inr)?\s*(\d{5,})\s*(?:-|to)\s*(?:₹|rs\.?|inr)?\s*(\d{5,})\s*(?:per annum|p\.a\.|pa|\/yr|\/year)/i);
    const paSingleMatch = text.match(/(?:₹|rs\.?|inr)?\s*(\d{5,})\s*(?:per annum|p\.a\.|pa|\/yr|\/year)/i);

    // Match Monthly (e.g., 20k/month, 25000 per month, 10k-20k/mo)
    const moKMatch = text.match(/([\d\.]+)(?:k)?\s*(?:-|to)\s*([\d\.]+)(?:k)?\s*(?:\/mo|\/month|per month|pm)/i);
    const moKSingleMatch = text.match(/([\d\.]+)(?:k)?\s*(?:\/mo|\/month|per month|pm)/i);
    const moMatch = text.match(/(?:₹|rs\.?|inr)?\s*(\d{4,})\s*(?:-|to)\s*(?:₹|rs\.?|inr)?\s*(\d{4,})\s*(?:\/mo|\/month|per month|pm)/i);
    const moSingleMatch = text.match(/(?:₹|rs\.?|inr)?\s*(\d{4,})\s*(?:\/mo|\/month|per month|pm)/i);

    // Parse LPA
    if (lpaMatch) {
      result.salaryMin = parseFloat(lpaMatch[1]) * 100000;
      result.salaryMax = parseFloat(lpaMatch[2]) * 100000;
    } else if (lpaSingleMatch) {
      result.salaryMin = parseFloat(lpaSingleMatch[1]) * 100000;
      result.salaryMax = parseFloat(lpaSingleMatch[1]) * 100000;
    } else if (paMatch) {
      result.salaryMin = parseFloat(paMatch[1]);
      result.salaryMax = parseFloat(paMatch[2]);
    } else if (paSingleMatch) {
      result.salaryMin = parseFloat(paSingleMatch[1]);
      result.salaryMax = parseFloat(paSingleMatch[1]);
    }

    // Apply Salary Band
    if (result.salaryMax) {
      const maxLPA = result.salaryMax / 100000;
      if (maxLPA < 3) result.salaryBand = '< 3 LPA';
      else if (maxLPA <= 6) result.salaryBand = '3-6 LPA';
      else if (maxLPA <= 10) result.salaryBand = '6-10 LPA';
      else if (maxLPA <= 20) result.salaryBand = '10-20 LPA';
      else result.salaryBand = '20+ LPA';
    }

    // Parse Monthly (Stipend usually)
    if (!result.salaryMax) {
      if (moKMatch) {
        result.stipendMin = parseFloat(moKMatch[1]) * (moKMatch[1].includes('k') || parseFloat(moKMatch[1]) < 1000 ? 1000 : 1);
        result.stipendMax = parseFloat(moKMatch[2]) * (moKMatch[2].includes('k') || parseFloat(moKMatch[2]) < 1000 ? 1000 : 1);
      } else if (moKSingleMatch) {
        const val = parseFloat(moKSingleMatch[1]) * (moKSingleMatch[1].includes('k') || parseFloat(moKSingleMatch[1]) < 1000 ? 1000 : 1);
        result.stipendMin = val;
        result.stipendMax = val;
      } else if (moMatch) {
        result.stipendMin = parseFloat(moMatch[1]);
        result.stipendMax = parseFloat(moMatch[2]);
      } else if (moSingleMatch) {
        result.stipendMin = parseFloat(moSingleMatch[1]);
        result.stipendMax = parseFloat(moSingleMatch[1]);
      }

      if (result.stipendMax) {
        if (result.stipendMax < 10000) result.stipendBand = '< 10000';
        else if (result.stipendMax <= 20000) result.stipendBand = '10000-20000';
        else if (result.stipendMax <= 40000) result.stipendBand = '20000-40000';
        else result.stipendBand = '40000+';
      }
    }

    return result;
  }
}
