import Company, { ICompany } from '../../models/Company';
import { DuplicateDetectionAgent } from '../agents/DuplicateDetectionAgent';

export class CompanyService {
  /**
   * Attempts to insert a new company into the database.
   * Deterministically checks for duplicates based on companyHash.
   * Returns the company if inserted, or null if it was a duplicate.
   */
  public async insertUniqueCompany(companyData: Partial<ICompany>): Promise<ICompany | null> {
    try {
      if (companyData.normalizedName && !companyData.companyHash) {
        companyData.companyHash = DuplicateDetectionAgent.generateHash(companyData.normalizedName);
      }
      
      // Create a new company instance
      const newCompany = new Company(companyData);
      
      // Save to database
      // The unique index on companyHash will throw an error if it's a duplicate
      await newCompany.save();
      
      return newCompany;
    } catch (error: any) {
      // 11000 is MongoDB's duplicate key error code
      if (error.code === 11000) {
        // It's a duplicate, we just return null to indicate it was skipped
        return null;
      }
      
      // If it's a different error, rethrow it
      throw error;
    }
  }

  /**
   * Update last seen date for an existing duplicate company
   */
  public async updateLastSeen(normalizedName: string): Promise<void> {
     const companyHash = DuplicateDetectionAgent.generateHash(normalizedName);
     await Company.updateOne(
       { companyHash },
       { 'source.discoveredAt': new Date() } // Last seen updating discovery date? Or add a new field. We just update updatedAt.
     );
  }
}

export const companyService = new CompanyService();
