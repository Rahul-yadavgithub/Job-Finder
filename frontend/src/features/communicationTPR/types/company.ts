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
    locked?: boolean;
    editingLocked?: boolean;
  };
}

export interface DetailedCompany extends InterestedCompany {
  description?: string;
  dataSource?: string;
  createdAt: string;
  hrContacts: any[];
  statusHistory: any[];
  contactLog: any[];
}

export interface PaginatedCompanies {
  data: InterestedCompany[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface Branch {
  id: string;
  name: string;
}
