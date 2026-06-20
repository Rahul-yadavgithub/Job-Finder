import Company, { ICompany } from '../../models/Company';
import crypto from 'crypto';

export class DuplicateDetectionAgent {
  public static normalizeName(rawName: string): string {
    return rawName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // remove punctuation
      .replace(/\b(pvt ltd|private limited|ltd|limited|inc|corporation|technologies|solutions|llc|corp|co|pvt|private)\b/g, '')
      .replace(/\s+/g, ' ') // replace multiple spaces with single space
      .trim();
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
