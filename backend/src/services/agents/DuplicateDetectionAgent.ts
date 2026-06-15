import Company, { ICompany } from '../../models/Company';
import crypto from 'crypto';

export class DuplicateDetectionAgent {
  public static normalizeName(rawName: string): string {
    return rawName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\b(inc|llc|ltd|pvt|private|limited|corp|corporation)\b/g, '')
      .trim()
      .replace(/\s+/g, '-');
  }

  public static generateHash(normalizedName: string): string {
    return crypto.createHash('sha256').update(normalizedName).digest('hex');
  }

  public async isDuplicate(normalizedName: string, website?: string): Promise<boolean> {
    const companyHash = DuplicateDetectionAgent.generateHash(normalizedName);
    const existing = await Company.findOne({ companyHash });
    return !!existing;
  }

  public async getDuplicate(normalizedName: string): Promise<ICompany | null> {
    const companyHash = DuplicateDetectionAgent.generateHash(normalizedName);
    return Company.findOne({ companyHash });
  }
}
