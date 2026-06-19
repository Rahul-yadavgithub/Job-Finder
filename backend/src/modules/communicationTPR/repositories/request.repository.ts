import { supabase } from '../../../config/supabase';
import { CreateRequestInput, UpdateRequestStatusInput } from '../types/request.types';

export class RequestRepository {
  async getRequestsByCompany(companyId: string) {
    const { data, error } = await supabase
      .from('communication_requests')
      .select('*, users!requested_by(name)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async getAllRequests() {
    const { data, error } = await supabase
      .from('communication_requests')
      .select('*, users!requested_by(name), companies(company_name)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async createRequest(input: CreateRequestInput, userId: string) {
    const { data, error } = await supabase
      .from('communication_requests')
      .insert({
        company_id: input.companyId,
        requested_by: userId,
        request_type: input.requestType,
        notes: input.notes,
        status: 'pending' // default status
      })
      .select('*, users!requested_by(name)')
      .single();

    if (error) throw error;
    return data;
  }

  async updateRequestStatus(requestId: string, input: UpdateRequestStatusInput) {
    const { data, error } = await supabase
      .from('communication_requests')
      .update({ status: input.status })
      .eq('id', requestId)
      .select('*, users!requested_by(name)')
      .single();

    if (error) throw error;
    return data;
  }
}
