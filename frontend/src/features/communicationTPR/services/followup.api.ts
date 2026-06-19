import { commApi } from './api';
import { FollowUp, CreateFollowUpInput } from '../types/followup';

export const followUpApi = {
  getMyFollowUps: async () => {
    const { data } = await commApi.get<{ success: boolean; data: FollowUp[] }>('/follow-ups/my-followups');
    return data;
  },

  getCompanyFollowUps: async (companyId: string) => {
    const { data } = await commApi.get<{ success: boolean; data: FollowUp[] }>(`/follow-ups/company/${companyId}`);
    return data;
  },

  createFollowUp: async (companyId: string, input: CreateFollowUpInput) => {
    const { data } = await commApi.post<{ success: boolean; data: FollowUp }>(`/follow-ups/company/${companyId}`, input);
    return data;
  },

  updateStatus: async (followUpId: string, status: 'completed' | 'cancelled') => {
    const { data } = await commApi.patch<{ success: boolean; data: FollowUp }>(`/follow-ups/${followUpId}/status`, { status });
    return data;
  }
};
