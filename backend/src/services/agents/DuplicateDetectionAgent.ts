import Company, { ICompany } from '../../models/Company';

export class DuplicateDetectionAgent {
  public static normalizeName(rawName: string): string {
    return rawName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\b(inc|llc|ltd|pvt|private|limited|corp|corporation)\b/g, '')
      .trim()
      .replace(/\s+/g, '-');
  }

  public async isDuplicate(normalizedName: string, website?: string): Promise<boolean> {
    const query: any = { normalizedName };
    if (website) {
      // Or check if website exists, but normalized name is safer
    }
    const existing = await Company.findOne(query);
    return !!existing;
  }

  public async getDuplicate(normalizedName: string): Promise<ICompany | null> {
    return Company.findOne({ normalizedName });
  }
}
