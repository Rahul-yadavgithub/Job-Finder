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

  async getPendingApprovals() {
    const { data, error } = await supabase
      .from('communication_requests')
      .select('*, users!requested_by(name), companies(company_name)')
      .eq('status', 'pending_review')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async getRequestForEmail(requestId: string) {
    const { data: requestData, error } = await supabase
      .from('communication_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (error) throw error;

    if (requestData && requestData.template_id) {
      const { data: templateData } = await supabase
        .from('email_templates')
        .select('attachment_url, attachment_filename')
        .eq('id', requestData.template_id)
        .single();
        
      if (templateData) {
        requestData.email_templates = templateData;
      }
    }

    return requestData;
  }


  async createRequest(input: CreateRequestInput, userId: string) {
    const { data, error } = await supabase
      .from('communication_requests')
      .insert({
        company_id: input.companyId,
        requested_by: userId,
        request_type: input.requestType,
        template_id: input.templateId,
        email_to: input.emailTo,
        email_subject: input.emailSubject,
        email_body: input.emailBody,
        notes: input.notes,
        status: 'draft' // Initializing as draft
      })
      .select('*, users!requested_by(name)')
      .single();

    if (error) throw error;

    // Transition mid_status to under_communication if it was interested
    // using the company_status table
    await supabase.from('company_status')
      .update({ mid_status: 'under_communication' })
      .eq('company_id', input.companyId)
      .eq('mid_status', 'interested');

    return data;
  }

  async updateDraft(requestId: string, input: any) {
    const updateData: any = {};
    if (input.emailTo !== undefined) updateData.email_to = input.emailTo;
    if (input.emailSubject !== undefined) updateData.email_subject = input.emailSubject;
    if (input.emailBody !== undefined) updateData.email_body = input.emailBody;
    if (input.urgency !== undefined) updateData.urgency = input.urgency;

    const { data, error } = await supabase
      .from('communication_requests')
      .update(updateData)
      .eq('id', requestId)
      .eq('status', 'draft') // Only allow if it's still a draft
      .select('*, users!requested_by(name)')
      .single();

    if (error) throw error;
    return data;
  }

  async submitForApproval(requestId: string) {
    const { data, error } = await supabase
      .from('communication_requests')
      .update({ status: 'pending_review' })
      .eq('id', requestId)
      .eq('status', 'draft')
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

  async approveAndMarkSent(requestId: string, nextFollowupDate: string | null) {
    const { data, error } = await supabase
      .from('communication_requests')
      .update({ 
        status: 'sent', 
        next_followup_date: nextFollowupDate 
      })
      .eq('id', requestId)
      .select('*, users!requested_by(name)')
      .single();

    if (error) throw error;
    return data;
  }

  async getQueueCounts() {
    const statuses = ['draft', 'pending_review', 'approved', 'rejected', 'reverted', 'completed'];
    const counts: Record<string, number> = {};

    const queries = statuses.map(status => 
      supabase.from('communication_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', status)
    );

    const results = await Promise.all(queries);

    statuses.forEach((status, index) => {
      counts[status] = results[index].count || 0;
    });

    return counts;
  }

  async getRequestsByQueueStatus(status: string) {
    const { data, error } = await supabase
      .from('communication_requests')
      .select(`
        *,
        companies (
          company_name,
          hr_name,
          phone_number,
          email,
          company_status (
            interested_by_name,
            original_marked_by
          )
        ),
        users!requested_by (name),
        rejected_by_user:users!rejected_by (name),
        reverted_to_user:users!reverted_to_user_id (name)
      `)
      .eq('status', status)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async revertRequest(requestId: string, notes: string, revertedToUserId: string) {
    const { data, error } = await supabase
      .from('communication_requests')
      .update({
        status: 'reverted',
        revert_notes: notes,
        reverted_to_user_id: revertedToUserId,
        reverted_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select('*, companies(company_name)')
      .single();

    if (error) throw error;
    
    if (data?.company_id) {
       await supabase.from('company_status')
         .update({ mid_status: 'revoked' })
         .eq('company_id', data.company_id);
    }

    return data;
  }
}

