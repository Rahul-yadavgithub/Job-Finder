import { commApi } from './api';
import { CompanyActivity, CreateActivityInput } from '../types/activity';

export const activityApi = {
  getCompanyActivities: async (companyId: string) => {
    const { data } = await commApi.get<{ success: boolean; data: CompanyActivity[] }>(`/activities/company/${companyId}`);
    return data;
  },

  createActivity: async (companyId: string, input: CreateActivityInput) => {
    const { data } = await commApi.post<{ success: boolean; data: CompanyActivity }>(`/activities/company/${companyId}`, input);
    return data;
  }
};
