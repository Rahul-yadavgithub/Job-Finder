import { CompanyRepository } from '../repositories/company.repository';
import { GetCompaniesFilters, InterestedCompany, PaginatedResult } from '../types/company.types';

export class CompanyService {
  private companyRepository: CompanyRepository;

  constructor() {
    this.companyRepository = new CompanyRepository();
  }

  private resolveInterestDate(statusHistory: any[], fallbackDate: string): string {
    if (statusHistory && statusHistory.length > 0) {
      // Sort chronologically ascending to find the FIRST time it was marked interested
      const sortedHistory = [...statusHistory].sort(
        (a: any, b: any) => new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime()
      );
      
      const firstInterested = sortedHistory.find((h: any) => h.new_status === 'interested');
      if (firstInterested) {
        return firstInterested.changed_at;
      }
    }
    return fallbackDate;
  }

  async getInterestedCompanies(filters: GetCompaniesFilters): Promise<PaginatedResult<InterestedCompany>> {
    const { data, count } = await this.companyRepository.getInterestedCompanies(filters);

    const formattedData: InterestedCompany[] = data.map((row: any) => {
      // Data from nested relations comes as arrays or objects depending on Supabase version/setup.
      // Usually inner joins on 1-to-1 return an array with 1 element or a single object.
      const status = Array.isArray(row.company_status) ? row.company_status[0] : row.company_status;
      const branch = Array.isArray(row.branches) ? row.branches[0] : row.branches;
      const user = Array.isArray(row.users) ? row.users[0] : row.users;

      const fallbackDate = status?.updated_at || row.created_at;
      const interestDate = this.resolveInterestDate(row.status_history || [], fallbackDate);

      return {
        id: row.id,
        companyName: row.company_name,
        hrName: row.hr_name,
        email: row.email,
        phone: row.phone_number,
        assignedTPR: user?.name,
        branch: branch?.name,
        branchId: branch?.id,
        interestDate,
        currentStatus: {
          baseStatus: status?.base_status || 'interested',
          midStatus: status?.mid_status
        }
      };
    });

    return {
      data: formattedData,
      meta: {
        total: count,
        page: filters.page || 1,
        limit: filters.limit || 20,
        pages: Math.ceil(count / (filters.limit || 20))
      }
    };
  }

  async getCompanyDetail(id: string) {
    const row = await this.companyRepository.getCompanyById(id);
    
    const status = Array.isArray(row.company_status) ? row.company_status[0] : row.company_status;
    const branch = Array.isArray(row.branches) ? row.branches[0] : row.branches;
    const user = Array.isArray(row.users) ? row.users[0] : row.users;

    const fallbackDate = status?.updated_at || row.created_at;
    const interestDate = this.resolveInterestDate(row.status_history || [], fallbackDate);

    // Sort histories descending for the detail view display
    const statusHistory = (row.status_history || []).sort(
      (a: any, b: any) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()
    );
    const contactLog = (row.contact_log || []).sort(
      (a: any, b: any) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()
    );

    return {
      id: row.id,
      companyName: row.company_name,
      hrName: row.hr_name,
      email: row.email,
      phone: row.phone_number,
      description: row.description,
      dataSource: row.data_source,
      createdAt: row.created_at,
      assignedTPR: user?.name,
      branch: branch?.name,
      interestDate,
      currentStatus: {
        baseStatus: status?.base_status,
        midStatus: status?.mid_status,
        locked: status?.locked,
        editingLocked: status?.editing_locked
      },
      hrContacts: row.hr_contacts || [],
      statusHistory,
      contactLog
    };
  }

  async getBranches() {
    return this.companyRepository.getBranches();
  }

  async updateMidStatus(companyId: string, status: string) {
    return this.companyRepository.updateMidStatus(companyId, status);
  }

  async transferToHead(companyId: string, userId: string) {
    return this.companyRepository.transferToHead(companyId, userId);
  }
}
