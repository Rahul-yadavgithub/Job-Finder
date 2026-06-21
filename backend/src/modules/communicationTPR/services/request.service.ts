import { RequestRepository } from '../repositories/request.repository';
import { sendPlacementEmail } from '../../../services/email.service';
import { supabase } from '../../../config/supabase';
import { CreateRequestInput, UpdateRequestStatusInput, CommunicationRequest } from '../types/request.types';

export class RequestService {
  private requestRepository: RequestRepository;

  constructor() {
    this.requestRepository = new RequestRepository();
  }

  private formatRequest(row: any): CommunicationRequest {
    const user = Array.isArray(row.users) ? row.users[0] : row.users;
    const company = Array.isArray(row.companies) ? row.companies[0] : row.companies;
    return {
      id: row.id,
      companyId: row.company_id,
      requestedBy: row.requested_by,
      requestedByName: user?.name,
      requestType: row.request_type,
      status: row.status,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      companyName: company?.company_name
    };
  }

  async getRequestsByCompany(companyId: string): Promise<CommunicationRequest[]> {
    const data = await this.requestRepository.getRequestsByCompany(companyId);
    return data.map(this.formatRequest);
  }

  async getAllRequests(): Promise<CommunicationRequest[]> {
    const data = await this.requestRepository.getAllRequests();
    return data.map(this.formatRequest);
  }

  async getPendingApprovals(): Promise<CommunicationRequest[]> {
    const data = await this.requestRepository.getPendingApprovals();
    return data.map(this.formatRequest);
  }


  async createRequest(input: CreateRequestInput, userId: string): Promise<CommunicationRequest> {
    if (!input.companyId || !input.requestType) {
      throw new Error('Missing required fields');
    }
    const data = await this.requestRepository.createRequest(input, userId);
    return this.formatRequest(data);
  }

  async updateDraft(requestId: string, input: any): Promise<CommunicationRequest> {
    const data = await this.requestRepository.updateDraft(requestId, input);
    return this.formatRequest(data);
  }

  async submitForApproval(requestId: string): Promise<CommunicationRequest> {
    const data = await this.requestRepository.submitForApproval(requestId);
    return this.formatRequest(data);
  }

  async updateRequestStatus(requestId: string, input: UpdateRequestStatusInput): Promise<CommunicationRequest> {
    const data = await this.requestRepository.updateRequestStatus(requestId, input);
    return this.formatRequest(data);
  }

  async approveAndSendRequest(requestId: string): Promise<CommunicationRequest> {
    // 1. Fetch Request details & Email Template attachment
    const requestDetails = await this.requestRepository.getRequestForEmail(requestId);
    
    if (!requestDetails) throw new Error('Request not found');
    if (requestDetails.status !== 'pending_approval') {
      throw new Error('Request must be in pending_approval state to approve');
    }

    // 2. Fetch assignment_id from company_status
    const { data: statusData } = await supabase
      .from('company_status')
      .select('id')
      .eq('company_id', requestDetails.company_id)
      .single();

    if (statusData) {
      await supabase.from('company_status')
        .update({ 
          top_stage: 'pending_staff_review',
          mid_status: 'pending_staff_review'
        })
        .eq('company_id', requestDetails.company_id);

      await supabase.from('staff_requests').insert({
        company_id: requestDetails.company_id,
        assignment_id: statusData.id,
        raised_by: requestDetails.requested_by,
        email_to: requestDetails.email_to,
        email_subject: requestDetails.email_subject,
        email_body: requestDetails.email_body,
        attachment_template_id: requestDetails.template_id,
        status: 'pending_send'
      });
    }

    // 3. Update status to pending_staff_review (Wait for TPO Staff)
    const data = await this.requestRepository.updateRequestStatus(requestId, { status: 'pending_staff_review' });
    return this.formatRequest(data);
  }

  async rejectRequest(requestId: string): Promise<CommunicationRequest> {
    const data = await this.requestRepository.updateRequestStatus(requestId, { status: 'rejected' });
    return this.formatRequest(data);
  }

  async revertRequest(requestId: string, currentUserId: string): Promise<CommunicationRequest> {
    // Look up original_marked_by on the request's company record
    const requestDetails = await this.requestRepository.getRequestForEmail(requestId);
    if (!requestDetails) throw new Error('Request not found');

    const { data: statusData, error: statusError } = await supabase
      .from('company_status')
      .select('original_marked_by')
      .eq('company_id', requestDetails.company_id)
      .single();

    if (statusError || !statusData) {
      throw new Error('Company status not found');
    }

    const originalMarkedBy = statusData.original_marked_by;
    if (!originalMarkedBy) {
      throw new Error('Original marking TPR not found for this company');
    }

    // Only allow revert if the current user is the original_marked_by (though the requirement said "auto-assigns",
    // wait, the API should probably just assign it to originalMarkedBy, but wait, who clicks "Revert"? The Mid TPR does.)
    // "Mid TPR (original one) clicks Revert -> confirm task re-assigns specifically to them"

    // Reset company_status.top_stage to 'not_contacted' and mid_status to null so it goes back to calling
    await supabase.from('company_status')
      .update({ 
        top_stage: null, 
        mid_status: null, 
        base_status: 'call_again', // or not_contacted
        locked: false,
        locked_by: null
      })
      .eq('company_id', requestDetails.company_id);

    // Update request status
    const data = await this.requestRepository.updateRequestStatus(requestId, { status: 'rejected' }); // Leave it as rejected but now they can re-contact
    return this.formatRequest(data);
  }
}
