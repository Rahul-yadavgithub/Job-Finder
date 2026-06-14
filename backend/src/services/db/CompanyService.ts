import Company, { ICompany } from '../../models/Company';

export class CompanyService {
  /**
   * Attempts to insert a new company into the database.
   * Deterministically checks for duplicates based on normalizedName and jobUrl.
   * Returns the company if inserted, or null if it was a duplicate.
   */
  public async insertUniqueCompany(companyData: Partial<ICompany>): Promise<ICompany | null> {
    try {
      // Create a new company instance
      const newCompany = new Company(companyData);
      
      // Save to database
      // The compound unique index on { normalizedName: 1, jobUrl: 1 } will throw an error if it's a duplicate
      await newCompany.save();
      
      return newCompany;
    } catch (error: any) {
      // 11000 is MongoDB's duplicate key error code
      if (error.code === 11000) {
        // It's a duplicate, we just return null to indicate it was skipped
        // We could optionally update the lastSeenDate here if we wanted
        return null;
      }
      
      // If it's a different error, rethrow it
      throw error;
    }
  }

  /**
   * Update last seen date for an existing duplicate company
   */
  public async updateLastSeen(normalizedName: string, jobUrl: string): Promise<void> {
     await Company.updateOne(
       { normalizedName, jobUrl },
       { lastSeenDate: new Date() }
     );
  }
}

export const companyService = new CompanyService();
