import { commApi } from './api';
import { PaginatedCompanies, DetailedCompany, Branch } from '../types/company';

export const companyApi = {
  getInterestedCompanies: async (params?: { page?: number; limit?: number; search?: string; branchId?: string }) => {
    const { data } = await commApi.get<{ success: boolean; data: PaginatedCompanies['data']; meta: PaginatedCompanies['meta'] }>('/companies', { params });
    return data;
  },

  getCompanyDetail: async (id: string) => {
    const { data } = await commApi.get<{ success: boolean; data: DetailedCompany }>(`/companies/${id}`);
    return data;
  },

  getBranches: async () => {
    const { data } = await commApi.get<{ success: boolean; data: Branch[] }>('/companies/branches');
    return data;
  },

  updateStage: async (id: string, status: string, notes?: string) => {
    const { data } = await commApi.patch<{ success: boolean; data: any }>(`/companies/${id}/stage`, { status, notes });
    return data;
  },

  transferToHead: async (id: string) => {
    const { data } = await commApi.post<{ success: boolean; data: any }>(`/companies/${id}/transfer`);
    return data;
  }
};
