export interface InterestedCompany {
  id: string;
  companyName: string;
  hrName?: string;
  email?: string;
  phone?: string;
  assignedTPR?: string;
  branch: string;
  branchId: string;
  interestDate: string;
  currentStatus: {
    baseStatus: string;
    midStatus?: string;
  };
}

export interface GetCompaniesFilters {
  page?: number;
  limit?: number;
  search?: string;
  branchId?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}
