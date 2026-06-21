import { commApi } from './api';
import { CommunicationRequest, CreateRequestInput } from '../types/request';

export const requestApi = {
  getCompanyRequests: async (companyId: string) => {
    const { data } = await commApi.get<{ success: boolean; data: CommunicationRequest[] }>(`/requests/company/${companyId}`);
    return data;
  },

  getAllRequests: async () => {
    const { data } = await commApi.get<{ success: boolean; data: CommunicationRequest[] }>('/requests/queue');
    return data;
  },

  createRequest: async (companyId: string, input: CreateRequestInput) => {
    const { data } = await commApi.post<{ success: boolean; data: CommunicationRequest }>(`/requests/company/${companyId}`, input);
    return data;
  },

  getPendingApprovals: async () => {
    const { data } = await commApi.get<{ success: boolean; data: CommunicationRequest[] }>('/requests/approvals/pending');
    return data;
  },

  approveRequest: async (requestId: string) => {
    const { data } = await commApi.post<{ success: boolean; data: CommunicationRequest }>(`/requests/${requestId}/approve`);
    return data;
  },

  rejectRequest: async (requestId: string) => {
    const { data } = await commApi.post<{ success: boolean; data: CommunicationRequest }>(`/requests/${requestId}/reject`);
    return data;
  }
};
